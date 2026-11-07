# Migration to Ultimate Liquid Glass 1.1

This package keeps the supplied skill's useful depth while correcting its install and executable contracts.

## 1. Standalone entry and installation

- Skill name and folder: `ultimate-liquid-glass`.
- README lives inside the package. No `../README.md` requirement.
- Plugin manifest points `skills` at `.`: the directory containing `SKILL.md`.
- Internal reference names are descriptive, not obsolete numbered filenames.
- Added `references/showcase.md`, `references/sources.md`, and this migration guide.

## 2. Reference appearance is preserved

The approved Azmoon-style preview is now `assets/showcase.html`, renamed **Ultimate Liquid Glass**. Its source builders, historical linear dim, default values, and original SVG graph are preserved. The old `assets/demo.html` redirects to it without network access.

Do not confuse the lightweight `assets/liquid-glass.css` and `assets/liquid-glass.js` scaffold with the faithful reference renderer. The scaffold's independent ramps and painted accents are not the source's reflective rim construction.

## 3. Explicit production exceptions

- General production map budget: 1 bitmap pixel per CSS pixel, longest side capped at 1024px.
- Conservative Safari SVG-path map budget: 512px; not a documented universal source-graphic or hardware ceiling.
- Reference parity: original 2× maps, explicitly exempt from those production defaults.
- Production dim: highlight-weighted wash with `b` in `[0, 0.5]`.
- Reference dim: the baseline's per-channel linear slope/intercept law, intentionally retained.

Numerical and visual choices do not transfer silently between those modes.

## 4. Native API corrections

- `GlassEffectContainer.spacing` is a merge threshold. It must not universally exceed the stack's layout spacing; that causes nearby shapes to blend at rest.
- UIKit hosts `UIGlassEffect` in `UIVisualEffectView(effect:)`; there is no documented `UIGlassEffectView` host here.
- Use `RoundedRectangle(cornerRadius:)` rather than questionable shorthand labels.
- Native guidance is self-contained, with Apple primary links. Companion skills are optional.

## 5. Runnable WebGL2, not the old shader sketch

`assets/webgl-glass.js` replaces the previous uncalibrated WebGL1 sketch with the actual renderer consumed by the showcase. It accepts explicit backdrop, displacement, specular, and dim inputs, runs separable Gaussian blur, and draws the sampled material below DOM content.

It does not implement the alternative Fresnel/dispersion/caustic pipeline described conceptually in older notes. Do not claim those effects or bit-identical WebGL/CSS output. CSS/SVG is the pixel-identical reference route in the tested Chromium scenes.

Both engines stay installed and selectable. WebGL errors restore CSS; reduced transparency and forced colors pause optics.

## 6. Input, accessibility, and exports

- Imported settings are finite and bounded and validate before any state mutation.
- Malformed URL-hash settings retain the defaults.
- Exported tokens use this package's `--lg-*` namespace, not private app filter families or missing generator paths.
- Clipboard failure no longer reports success.
- Explicit labels, arrow-key movement, visible focus, live status, mobile grid sizing, reduced motion/transparency, and forced colors are exercised by browser tests.

## 7. Measurement and tests

The chroma tool now clamps saturation channels as the CSS color transform does and rejects non-finite/out-of-range inputs. Historical dark-sample numbers changed as a result; fresh fixture output replaces the old transcript. These RGB calculations are not a universal linear-light color-management model.

`tests/test_package.py` checks package contracts. `tests/browser/showcase.spec.mjs` compares the unchanged baseline's map bytes and CSS stage pixels and exercises both renderers. The test baseline is packaged so the comparisons do not depend on another project or internet access.

## 8. License and provenance

The author MIT license is retained. `NOTICE` and `references/sources.md` state the inherited kube.io lineage and unresolved third-party site-code licensing explicitly. Do not fabricate an Apache license because an unrelated package uses one. This repository is private; public redistribution requires a provenance review.
