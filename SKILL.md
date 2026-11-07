---
name: ultimate-liquid-glass
description: Use when building or debugging Liquid Glass effects. Source-matched SVG and WebGL refraction, reflective rims, native Apple API guidance, accessible fallbacks, and executable verification. Triggers include liquid glass, glassmorphism, backdrop-filter url(), specular rim, missing bend, Safari refraction, and glass playground.
version: 1.1.0
author: Moslem Adib (admos98)
license: MIT
---

# Ultimate Liquid Glass

**Refraction, reflective rims, and evidence.** Blur alone is frosted glass. Optical glass bends a defined backdrop near its boundary while keeping content readable.

## Start here

1. Inspect the framework, material primitives, target browsers, and existing rendering paths. Preserve business logic and every renderer the user wants retained.
2. Choose the surface's job first. Glass belongs primarily to navigation and controls; it must not compete with content.
3. Open **`assets/showcase.html`** for the reference appearance. It is fully standalone: code and backgrounds are embedded; no server, build, network, or other skill is required.
4. Match the **displacement profile, specular map, filter graph, geometry, and settings** before tuning tokens. The showcase provides CSS/SVG, WebGL2, comparison mode, surface presets, and exports.
5. Run the checks in `tests/README.md`. Report the actual renderer, browser, input, and result. Never turn an unrun check into a pass.

The showcase is a **reference replica**, not a default application architecture. It retains its historical linear RGB dim and 2× map sampling to preserve the approved appearance. New production surfaces normally use the highlight-weighted wash and budgets in `references/dim-and-rim.md` and `references/performance.md`. Do not silently change one mode into the other.

## Load-on-demand map

| Read | When |
|---|---|
| `references/strategy-picker.md` | Choose content-filter, live SVG backdrop, WebGL, or frosted fallback. |
| `references/showcase.md` | Run or integrate the standalone reference and exported settings. |
| `references/css-scaffold.md` | CSS fallback, layers, tokens, nested surfaces, and corner geometry. |
| `references/svg-filter-graph.md` | Displacement maps, reflective specular branch, per-size graphs, and rewrites. |
| `references/chromium-quirks.md` | Alpha, cached IDs, percentage sizing, and transform failures. |
| `references/safari-webkit.md` | WebKit, URL escaping, compositing, and device budgets. |
| `references/webgl-shader.md` | Explicit texture sources, WebGL2, DOM composition, and parity tests. |
| `references/dim-and-rim.md` | Production dim law, rim lighting, and geometric failures. |
| `references/motion.md` | Trigger origin, veil split, and open/close choreography. |
| `references/performance.md` | Idle gating, scroll sync, caches, viewport parking, and map budgets. |
| `references/measurement.md` | Pixel profiles, computed styles, chroma, and built-bundle inspection. |
| `references/failure-catalogue.md` | Symptom-led triage, S01–S33. |
| `references/native-apple.md` | Self-contained SwiftUI/UIKit/AppKit with primary documentation links. |
| `references/tailwind-v4.md` | CSS-first config, utilities, cascade, and explicit capability gates. |
| `references/honesty-and-checklists.md` | Source tags, accessibility, verification, and handoff. |
| `references/sources.md` | Source attribution, license scope, and browser/Apple references. |
| `references/migration.md` | Packaging fixes and legacy scaffold versus faithful reference. |

## Rendering choices

| Path | What it samples | Boundary |
|---|---|---|
| `filter: url(#f)` | The element's **own painted content** | Does not capture arbitrary DOM behind it. Distorting text is usually undesirable. |
| `backdrop-filter: blur() … url(#f)` | Live browser backdrop | Browser-dependent. Conservative Chromium gate; verify paint, not syntax alone. |
| WebGL2 | A texture explicitly supplied to the renderer | Can reproduce optics on supported engines. Cannot read arbitrary DOM without a separate source/capture mechanism. |
| CSS blur/saturation or solid fallback | Browser backdrop, or solid surface | Required safety path; preserve reduced transparency and forced colors. |

**Keep both engines when the product uses both.** Select explicitly, swap atomically, and restore CSS on failure. The reference defaults to CSS/SVG for exact Chromium parity; WebGL2 remains selectable.

## Optical contract

- Build the field from the **surface profile and boundary normal**, not independent linear R/G ramps or random turbulence.
- Build displacement and specular maps for the actual width, height, radius, and corner shape. Use absolute CSS-pixel `feImage` sizes and an explicit filter region.
- The reflective rim is the **saturated, refracted backdrop masked by the specular map**, then the light blend. A painted border is a fallback accent, not that optical construction.
- Production chain: `blur → chain saturation → url()`. Inside the graph: displacement, rim saturation, dim, specular. The historical showcase keeps in-graph blur for exact replica output.
- Map centre `(128,128)`; displacement alpha 255. Check per-edge amplitude and skew, not just a global maximum.
- `CSS.supports()` only validates syntax. A canvas/SVG-content probe does **not** establish SVG-backdrop support. Use a conservative engine gate and verify the real target.
- Runtime filter overrides must respect reduced transparency and forced colors. Failed capability checks must not subtract the fallback.
- Shader output belongs below content. Do not duplicate DOM fill or hide a full background pass under opaque stage fill.
- Avoid fading a backdrop-filter carrier in engines with observed freeze/ghost bugs; split scrim, filter, and motion. This is defensive practice, not a CSS specification prohibition.
- Park idle/offscreen work without dropping visible material. Production budgets are heuristics, not Apple's specifications or universal hardware limits.

## Shipped artifacts

- **`assets/showcase.html`** — approved, offline, source-matched interactive showcase.
- **`assets/showcase/`** — editable template, optics, controller, and backgrounds; rebuild with `node scripts/build-showcase.mjs`.
- **`assets/webgl-glass.js`** — reusable WebGL2 renderer used by the showcase; explicit maps, settings, and backdrop input.
- **`assets/liquid-glass.css` + `assets/liquid-glass.js`** — lightweight legacy scaffold and SVG-content probe. Not the faithful rim/reference renderer.
- **`scripts/measure-displacement-map.py`**, **`scripts/edge-profile.py`**, **`scripts/chroma-retention.py`** — measurement tools. The edge profiler requires Pillow; map/chroma use Python's standard library.

## Before reporting done

- [ ] Same reference settings, geometry, and background; do not infer optics from rendered labels.
- [ ] SVG claims have live referenced filters; WebGL claims have ready textures and actual draw output. WebGL does not require `url()`.
- [ ] State which mode was measured. CSS reference parity does not imply bit-identical WebGL or native OS rendering.
- [ ] Both desired renderers and their error/fallback states work.
- [ ] Labels, keyboard controls, reduced motion/transparency, forced colors, and responsive layouts checked.
- [ ] New behavior has a red-capable regression test; gates rerun after the last edit.
- [ ] Numbers have source and scope. Fixtures and a named browser do not prove every device.
- [ ] Untested platforms stated plainly. Companion skills are optional, not package dependencies.
