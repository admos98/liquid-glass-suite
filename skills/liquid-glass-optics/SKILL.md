---
name: liquid-glass-optics
description: Use for Liquid Glass rendering strategy, per-pixel SDF displacement/specular maps, backdrop-filter url(), WebGL2 refraction, Safari true-refraction options, reflective rims, clean-room showcase tuning, and mathematical optical verification.
---

# Liquid Glass optics

Open [`../../shared/assets/showcase.html`](../../shared/assets/showcase.html) directly from disk for interactive renderer and optics work. It runs offline with owned plates, seven product presets and editable source in `../../shared/assets/showcase/`.

## One clean model

The showcase and default drop-in share the field in `../../shared/assets/liquid-glass.js`: evaluate a rounded-rectangle signed-distance field per pixel, take its analytic gradient, derive slope from a mathematical height family, and apply three-component vector Snell refraction. A cubic directional lobe and linear rim window create specular light. Both renderers use one bitmap pixel per CSS pixel and the highlight-weighted wash.

Do not introduce profile lookup sweeps, external parameter bundles, or resemblance targets. Constants and presets need an independent derivation. `../../PROVENANCE.md` records origins and credit.

## Route the problem

| Need | Read |
|---|---|
| Content filter vs SVG backdrop vs WebGL2 vs frost | `../../shared/references/01-strategy-picker.md` |
| SDF maps, specular masking, SVG graph and fresh IDs | `../../shared/references/04-svg-filter-graph.md` |
| Wash, rim weighting, theme tokens, geometry faults | `../../shared/references/03-dim-and-rim.md` |
| WebGL2 API, explicit textures, hybrid swap and cleanup | `../../shared/references/07-webgl-shader.md` |
| Controls, exact presets, exports and diagnostic API | `../../shared/references/14-showcase.md` |
| Safari URL-filter wall, caches, compositing and OS-material conflict | `../../shared/references/06-safari-webkit.md` |
| Map budgets, idle/viewport gates, scroll synchronization | `../../shared/references/08-performance.md` |
| Transform arming, filter-carrier motion and origin | `../../shared/references/09-motion.md` |

## Two application paths only

1. **Default:** `../../shared/assets/liquid-glass.css` + `.js`, normally through `liquid-glass`. The conservative gate adds optics only where the SVG backdrop can paint; fallback remains usable.
2. **WebGL2:** use `../../shared/assets/webgl-glass.js` with an explicit origin-clean image/canvas/video texture or a WebKit true-refraction brief. It cannot read arbitrary DOM. Paint below content and restore CSS on failure/teardown.

The renderer is `window.LiquidGlassRenderer`. Shared maps are required; cross-renderer pixel identity is not.

## Verify optical properties

1. Record renderer, browser, surface, width, height, radius, bezel, scale, light angle/strength, saturation, dim, background and DPR.
2. Probe center neutrality, near-edge growth, 180-degree vector symmetry, flat interior, and light-facing/opposite specular samples for every relevant surface.
3. Regenerate maps for actual geometry and use fresh filter IDs. Keep `url()` last in CSS backdrop chains.
4. Test real drawing and visible fallback. Use only suite-owned screenshots for visual regression; never infer a bend from labels or a vision description.

From the suite root:

```sh
node scripts/build-showcase.mjs --check
npm test
```

For observed failures, switch to `liquid-glass-debug` rather than tuning blindly.

Part of liquid-glass-suite — install the suite, not this folder alone.
