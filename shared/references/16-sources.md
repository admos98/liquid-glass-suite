# Sources and provenance

## Required technique credit

Technique follows the approach explained in kube's 'Liquid Glass in the Browser' (kube.io/blog/liquid-glass-css-svg) — the guide this project learned from. The implementation in this repository is an independent clean-room implementation; no kube.io code or assets are included, and this project is not affiliated with kube.io or Apple.

The guide informs the general technique only. The SDF-gradient/vector-Snell architecture, constants, light model, presets, shaders, tests and procedural plates in this repository were independently derived. No statement here claims that the guide's code is MIT-licensed or endorsed this project. See `PROVENANCE.md` for the per-file audit and disposal record.

## Platform and measurement sources

- Apple Human Interface Guidelines, Materials and Liquid Glass sections; SwiftUI, UIKit and AppKit API documentation. These are behavior/API sources, not numeric web-material specifications.
- W3C Filter Effects and CSS Backdrop Filter specifications for SVG filter primitives, channel decoding, color interpolation and backdrop behavior.
- MDN and Chromium/WebKit documentation for browser API syntax. Syntax support is never treated as rendered evidence.
- `src: measured` notes in the shared references are suite field observations with their stated device/browser scope; they are not vendor requirements.
- `src: community` and `src: figma` material remains labeled as community interpretation rather than Apple fact.

## Owned assets and evidence

The eight files in `shared/assets/showcase/plates/` are deterministic suite-authored SVG artwork. The three images in `tests/baselines/` are screenshots captured from this repository's clean engine in the named Chromium test runtime. No external screenshot, application bundle, font, music artwork, site map or comparison implementation is a test target.
