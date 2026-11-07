#!/usr/bin/env python3
"""Chroma retention through a dim chain: saturate -> value-weighted wash -> fill.

Mirrors the shipped glass chain numerically so a dim tune can be swept BEFORE
any token edit, and the rendered result compared after. Stdlib only.

Usage:
  # bare wash (the plastic baseline): ~33% retention on warm cream
  python chroma-retention.py --in 240,232,210 --wash 0.35 --tint 31,29,41

  # sat-before-wash (the vibrancy fix): ~64%
  python chroma-retention.py --in 240,232,210 --sat 1.4 --wash 0.30 --tint 31,29,41

  # dark strong: the film dominates -- 32% at .70, 56% at .52
  python chroma-retention.py --in 242,203,88 --sat 1.5 --wash 0.14 --tint 16,15,28 --fill 0.70 --fill-tint 16,15,28

Stages (each optional, applied in chain order):
  --sat K        saturate:  c' = luma + K*(c - luma), luma = Rec.709
  --wash B       value-weighted wash toward --tint:
                 c' = c + B*(c/255)*(tint - c)   (black stays black; keep B in [0, 0.5])
  --fill A       alpha composite over --fill-tint:  c' = (1-A)*c + A*tint

Retention = final chroma / input chroma, chroma = max(r,g,b) - min(r,g,b).
Target band ~60-75% ("whites washed, colours intact"); below ~40% is the
grey-putty / plastic read. On dark plates the --fill term dominates.
"""
import argparse
import math


def luma(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def saturate(c, k):
    L = luma(c)
    return tuple(max(0.0, min(255.0, L + k * (x - L))) for x in c)


def wash(c, b, tint):
    return tuple(x + b * (x / 255.0) * (t - x) for x, t in zip(c, tint))


def fill(c, a, tint):
    return tuple((1 - a) * x + a * t for x, t in zip(c, tint))


def chroma(c):
    return max(c) - min(c)


def parse_rgb(s):
    parts = [float(p) for p in s.split(',')]
    if len(parts) != 3 or not all(math.isfinite(x) and 0 <= x <= 255 for x in parts):
        raise SystemExit(f'expected three finite RGB channels in [0,255] - got {s!r}')
    return tuple(parts)


def show(label, c):
    c = tuple(round(x, 1) for x in c)
    print(f'  {label:>12}: {c}  chroma {chroma(c):6.1f}')


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--in', dest='inp', required=True,
                    help='input rgb, e.g. 240,232,210')
    ap.add_argument('--sat', type=float, help='saturate factor k (e.g. 1.4)')
    ap.add_argument('--wash', type=float, help='wash strength b (0..0.5)')
    ap.add_argument('--tint', default='0,0,0',
                    help='wash target rgb (the theme dim tint)')
    ap.add_argument('--fill', type=float, help='fill alpha composite (0..1)')
    ap.add_argument('--fill-tint', help='fill colour rgb (default: --tint)')
    a = ap.parse_args()
    for label, value, low, high in [('wash', a.wash, 0, 0.5), ('fill', a.fill, 0, 1), ('sat', a.sat, 0, float('inf'))]:
        if value is not None and (not math.isfinite(value) or not low <= value <= high):
            ap.error(f'{label} must be finite and in [{low},{high}]')

    c = parse_rgb(a.inp)
    base = chroma(c)
    print(f'input chroma {base:.1f}')
    show('input', c)
    if a.sat is not None:
        c = saturate(c, a.sat)
        show(f'sat {a.sat}', c)
    if a.wash is not None:
        c = wash(c, a.wash, parse_rgb(a.tint))
        show(f'wash {a.wash}', c)
    if a.fill is not None:
        ft = parse_rgb(a.fill_tint) if a.fill_tint else parse_rgb(a.tint)
        c = fill(c, a.fill, ft)
        show(f'fill {a.fill}', c)
    retention = 100.0 * chroma(c) / base if base else 100.0
    print(f'chroma retention: {retention:.0f}%   '
          f'(target ~60-75%; <~40% = plastic/putty read)')


if __name__ == '__main__':
    main()
