#!/usr/bin/env python
"""Profile a panel edge in a screenshot and classify it: rim, glow, or cutout.

Usage:
    python edge-profile.py <image> [--axis v|h] [--at N,N,...] [--span N] [--start N]

    --axis v   vertical profile (straddling a horizontal edge)   [default]
    --axis h   horizontal profile (straddling a vertical edge)
    --at       fractions of the image axis to sample, e.g. 0.3,0.5,0.7
    --span     how many px to print on each side of the start  [default 40]
    --start    fraction of the axis to begin at                    [default 0.10]

Rim      : ramp 2-5px, small peak dL
Glow     : ramp >= 8px  -> an edge effect sized in percent of the PANEL
Cutout   : ramp <= 1px  -> a hard mask; the thickness tokens are decorative
Backwards: luminance rises monotonically border -> centre (printed as a note)

Works on screenshots; the point is to never trust a vision model's prose
about an edge. See references/measurement.md.
"""

import argparse
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow required: python -m pip install Pillow")


def luma(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--axis", choices=["v", "h"], default="v")
    ap.add_argument("--at", default="0.45")
    ap.add_argument("--span", type=int, default=40)
    ap.add_argument("--start", type=float, default=0.10)
    a = ap.parse_args()

    im = Image.open(a.image).convert("RGB")
    w, h = im.size
    px = im.load()
    print(f"{a.image}  {w}x{h}  axis={a.axis}")

    for frac in [float(f) for f in a.at.split(",")]:
        if a.axis == "v":
            fixed = min(max(int(frac * w), 0), w - 1)
            n = h
        else:
            fixed = min(max(int(frac * h), 0), h - 1)
            n = w
        base = int(a.start * n)
        lo, hi = max(0, base - a.span), min(n, base + a.span)

        prof = []
        for i in range(lo, hi):
            c = px[fixed, i] if a.axis == "v" else px[i, fixed]
            prof.append((i, c, luma(c)))
        if not prof:
            continue

        # strongest step inside the window, then the ramp around it
        best, bi = 0.0, 0
        for k in range(1, len(prof)):
            d = abs(prof[k][2] - prof[k - 1][2])
            if d > best:
                best, bi = d, k

        ref = prof[0][2]
        peak = max(prof, key=lambda p: abs(p[2] - ref))
        width, k = 0, bi
        while k > 0 and abs(prof[k - 1][2] - ref) > 2:
            k -= 1
            width += 1
        k = bi
        while k < len(prof) - 1 and abs(prof[k + 1][2] - ref) > 2:
            k += 1
            width += 1

        pos = f"x={fixed}" if a.axis == "v" else f"y={fixed}"
        print(f"\n--- {pos}  {lo}..{hi} ---")
        for i, c, L in prof:
            bar = "#" * min(40, int(abs(L - ref) / 2))
            print(f"  {i:5d} {str(c):18} L={L:6.1f}  {bar}")

        if width <= 1:
            verdict = "CUTOUT  (1px step) -> hard mask; thickness tokens are decorative"
        elif width >= 8:
            verdict = "GLOW    (>=8px ramp) -> edge effect sized in PERCENT OF THE PANEL"
        else:
            verdict = "RIM     (2-5px ramp) -> this is the band you want"

        print(f"  -> ramp {width}px, peak dL {abs(peak[2] - ref):.0f}: {verdict}")
        if len(prof) > 6 and abs(prof[1][2] - ref) > abs(prof[-1][2] - ref) * 1.5:
            print("  -> NOTE: brightest near the border, dimmer inward: gradient may be BACKWARDS")


if __name__ == "__main__":
    main()
