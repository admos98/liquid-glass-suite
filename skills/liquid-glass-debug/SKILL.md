---
name: liquid-glass-debug
description: Use when glass works in Chrome but is broken on iPhone, bend/refraction is missing in Safari, rim looks painted or like a border, glass looks like plastic, backdrop-filter url() paints nothing, edges are square, nested glass is milky, or optical measurements must be verified.
---

# Liquid Glass debug

Start with the symptom, then use the full first checks and diagnostic order in [`../../shared/references/11-failure-catalogue.md`](../../shared/references/11-failure-catalogue.md). Do not tune tokens before checking chain delivery, wiring, filter region and map alpha.

| # | Symptom / entry | First move |
|---|---|---|
| S01 | Just blur, not glass | Check live `url()` and edge/interior structure |
| S02 | Frosted plastic | Put `url()` last; remove blur after it |
| S03 | Rim looks like a painted/dirty border | Remove rim blur; use mask + inset treatment |
| S04 | White rim on white panel | Measure contrast ceiling; change structure |
| S05 | Shine is a static stripe | Use size-relative rim thickness |
| S06 | Same shine on every panel | Check where `clamp()` stops binding |
| S07 | Shine does not track pointer | Verify delegated flare listener |
| S08 | Nearest edge does not brighten | Check distance ramp and eased boost |
| S09 | Transparent even at edges | Find a zero-floored feather mask |
| S10 | Bottom/some corners square | Clip rectangular children |
| S11 | Curved panel, square blur | Restore exact filter region; widen map ramp |
| S12 | Dark glass looks flat/plastic | Check opacity, shadow, then dim law |
| S13 | Practically black | Check for affine/flat-multiply dim |
| S14 | Flat on the ground | Measure backdrop luminance range |
| S15 | Rim present, bend lost | Check computed `url()` and live filter IDs |
| S16 | Thicker rim made it worse | Inspect hard-cutout mask |
| S17 | Still lines, now thicker | A ring cannot fade inward |
| S18 | Change made it flatter | Diff mask, shadow and bend layers separately |
| S19 | Something indescribably off | Fix a starved backdrop field first |
| S20 | Line behind panels | Prove transmitted content vs painted line |
| S21 | Logo disappeared | Check per-theme color-math filters |
| S22 | Logo is just a circle | Preserve raw computed token before transforms |
| S23 | Menu closes before shape returns | Fit child exit inside container budget |
| S24 | Ghost blur after close | Never fade opacity on filter carrier; split veil |
| S25 | Cards resize/jelly on scroll | Remove `content-visibility:auto` |
| S26 | Panels lag scroll | Check compositor vs rAF clocks |
| S27 | Pointer is a flashlight | Size falloff in px against rim thickness |
| S28 | White stripe through body | Delete the diagonal glint layer |
| S29 | Washed-out/milky panel | De-nest glass; stop stacking fills |
| S30 | Chrome works, iPhone broken | SVG backdrop is WebKit-blocked; keep fallback or use WebGL2 |
| S31 | Bend/refraction not showing | `url()` last, map alpha 255, output not raw map |
| S32 | Bend is not curved | Check square map and oversized filter region |
| S33 | Rim and panel corner disagree | Rebuild map from painted corner geometry |

## Engine quirks

- **Chromium:** alpha-0 maps die; filters cache by ID; backdrop ends at the element edge; transforms can skew the lens. See `../../shared/references/05-chromium-quirks.md`.
- **Safari/WebKit:** `backdrop-filter:url()` is the known wall; content `filter:url()` is different. Filter IDs cache, promoted children can leave an ancestor filter, and Playwright WebKit is not a real iPhone. See `../../shared/references/06-safari-webkit.md`.
- **Strategy/parity:** use `liquid-glass-optics` for WebGL2, per-geometry maps or reference matching. A syntax `@supports` result is not paint evidence.

## Measure

Run from the suite root. Map/chroma scripts use the Python standard library; edge profiles require Pillow.

```sh
python shared/scripts/measure-displacement-map.py tests/fixtures/lens-map.png --scale 40
python shared/scripts/edge-profile.py tests/fixtures/rim-swatch.png --at 0.45 --span 40
python shared/scripts/chroma-retention.py --in 240,232,210 --sat 1.4 --wash 0.30 --tint 31,29,41
python -m unittest discover -s tests -v
node scripts/build-showcase.mjs --check
```

For app maps, replace the fixture path and declared scale; for rim/glow/cutout comparisons use the corresponding fixture. Commands, live-bundle audits and thresholds are in `../../shared/references/10-measurement.md`. Run `npm test` only when Playwright browsers are installed; otherwise report browser behavior untested.

## Verification gate

From `../../shared/references/15-honesty-and-checklists.md`:

1. Capture a large panel over a fine grid; small screenshots hide edge/region defects.
2. Over ruled stripes, prove compression/flipping at the edge; include a zero-effect control.
3. Test the actual target engine and the explicit fallback; content-filter success does not prove SVG-backdrop support.
4. Verify reduced transparency, reduced motion, forced colors, corner geometry and the built bundle after the last edit.
5. Report renderer, browser, geometry, settings and actual output. Never claim an unrun check, real-device pass or visual parity.

Part of liquid-glass-suite — install the suite, not this folder alone.
