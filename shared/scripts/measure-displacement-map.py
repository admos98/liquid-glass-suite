#!/usr/bin/env python3
"""Verify a glass displacement-map PNG against its declared feDisplacementMap scale.

feDisplacementMap moves pixels by scale * (C/255 - 0.5), so the declared peak
scale/2 only materializes if the channels reach 0/255, and a head-smoothed
profile can undershoot it or skew the two edges. Run after every map
generation (see shared/references/04-svg-filter-graph.md, 'Verify a regenerated
map'):

    python measure-displacement-map.py lens-map.png --scale 43.67

Reports: centre neutrality, alpha floor, per-edge band depth as a fraction of
the map (the fraction stretched onto every panel size), per-edge peak pull in
px vs the declared peak, and L/R + T/B skew. Exit 1 on a non-neutral centre,
zero alpha, or a peak below 90%% of the declared peak; skew above 10%% warns.
Stdlib only (8-bit RGB/RGBA, non-interlaced).
"""
from __future__ import annotations

import struct
import sys
import zlib

UNDERSHOOT_FAIL = 0.90  # min peak pull must reach 90% of scale/2
SKEW_WARN = 0.10        # L/R or T/B peak difference above 10% warns
NEUTRAL = 128


def read_png(path: str):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{path}: not a PNG")
    pos, idat = 8, b""
    w = h = depth = ctype = interlace = 0
    while pos < len(data):
        (ln,) = struct.unpack(">I", data[pos : pos + 4])
        typ = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + ln]
        if typ == b"IHDR":
            w, h, depth, ctype, _comp, _filt, interlace = struct.unpack(">IIBBBBB", chunk[:13])
        elif typ == b"IDAT":
            idat += chunk
        pos += 12 + ln
    if depth != 8 or ctype not in (2, 6) or interlace:
        sys.exit(f"{path}: need 8-bit non-interlaced RGB/RGBA (depth={depth} ctype={ctype} interlace={interlace})")
    ch = 3 if ctype == 2 else 4
    raw = zlib.decompress(idat)
    stride = w * ch
    out = bytearray()
    prev = bytearray(stride)
    i = 0
    for _ in range(h):
        filt = raw[i]
        i += 1
        line = bytearray(raw[i : i + stride])
        i += stride
        if filt == 1:
            for x in range(ch, stride):
                line[x] = (line[x] + line[x - ch]) & 255
        elif filt == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                a = line[x - ch] if x >= ch else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif filt == 4:
            for x in range(stride):
                a = line[x - ch] if x >= ch else 0
                b = prev[x]
                c = prev[x - ch] if x >= ch else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 255
        elif filt != 0:
            sys.exit(f"{path}: unsupported PNG filter {filt}")
        out += line
        prev = line
    return w, h, ch, bytes(out)


def main() -> None:
    args = sys.argv[1:]
    if "-h" in args or "--help" in args or "--scale" not in args or not args or args[0].startswith("-"):
        print(__doc__)
        raise SystemExit(2)
    path = args[0]
    scale = float(args[args.index("--scale") + 1])
    w, h, ch, buf = read_png(path)

    def get(x: int, y: int):
        o = (y * w + x) * ch
        return buf[o], buf[o + 1], buf[o + 2], (buf[o + 3] if ch == 4 else 255)

    def pull(channel_value: int) -> float:
        return scale * abs(channel_value / 255.0 - 0.5)

    def measure(sample, start: int, stop: int, step: int, cidx: int):
        """Walk from an edge inward: returns (peak channel value, band px)."""
        peak_c, band, ended = NEUTRAL, 0, False
        for p in range(start, stop, step):
            v = sample(p)[cidx]
            if abs(v - NEUTRAL) > 2:
                if ended:
                    break
                band += 1
                if abs(v - NEUTRAL) > abs(peak_c - NEUTRAL):
                    peak_c = v
            elif band:
                ended = True
        return peak_c, band

    fails: list[str] = []
    warns: list[str] = []

    c = get(w // 2, h // 2)
    centre_ok = abs(c[0] - NEUTRAL) <= 1 and abs(c[1] - NEUTRAL) <= 1
    amin = min(buf[o] for o in range(3, len(buf), ch)) if ch == 4 else 255

    left_c, left_b = measure(lambda p: get(p, h // 2), 0, w // 2, 1, 0)
    right_c, right_b = measure(lambda p: get(p, h // 2), w - 1, w // 2, -1, 0)
    top_c, top_b = measure(lambda p: get(w // 2, p), 0, h // 2, 1, 1)
    bot_c, bot_b = measure(lambda p: get(w // 2, p), h - 1, h // 2, -1, 1)

    declared = scale / 2.0
    edges = {
        "left": (pull(left_c), left_b / w),
        "right": (pull(right_c), right_b / w),
        "top": (pull(top_c), top_b / h),
        "bottom": (pull(bot_c), bot_b / h),
    }

    print(f"{path}  {w}x{h}  declared scale {scale} (peak {declared:.2f}px)")
    print(f"  centre      RGB({c[0]},{c[1]})          {'PASS' if centre_ok else 'FAIL'}")
    if not centre_ok:
        fails.append("centre not neutral - the panel interior bends")
    print(f"  alpha min   {amin}{' ' * max(0, 10 - len(str(amin)))}{'PASS' if amin > 0 else 'FAIL'}")
    if amin == 0:
        fails.append("alpha reaches 0 - Chromium premultiplies the map dead")
    for name, (pk, frac) in edges.items():
        axis = "width" if name in ("left", "right") else "height"
        print(f"  {name:<7}     band {frac * 100:.1f}% of {axis:<6} peak {pk:.2f}px")
    worst = min(pk for pk, _ in edges.values())
    if worst < declared * UNDERSHOOT_FAIL:
        fails.append(
            f"undershoot: min peak {worst:.2f}px = {worst / declared * 100:.0f}% of declared "
            f"(>= {UNDERSHOOT_FAIL * 100:.0f}% required)"
        )
    for pair in (("left", "right"), ("top", "bottom")):
        a, b = edges[pair[0]][0], edges[pair[1]][0]
        skew = abs(a - b) / max(a, b) if max(a, b) else 0.0
        tag = "WARN" if skew > SKEW_WARN else "PASS"
        print(f"  {pair[0]}/{pair[1]:<5} skew {skew * 100:.1f}%          {tag}")
        if skew > SKEW_WARN:
            warns.append(f"{pair[0]}/{pair[1]} peaks differ {skew * 100:.0f}% - unequal shove reads as misplacement")
    for wmsg in warns:
        print(f"  WARN: {wmsg}")
    for fmsg in fails:
        print(f"  FAIL: {fmsg}")
    verdict = "FAIL" if fails else ("WARN" if warns else "PASS")
    print(f"VERDICT: {verdict} ({len(fails)} fail, {len(warns)} warn)")
    raise SystemExit(1 if fails else 0)


if __name__ == "__main__":
    main()
