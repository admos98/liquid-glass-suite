---
name: liquid-glass-optics
description: Use for Liquid Glass rendering strategy, original SVG displacement/specular maps, backdrop-filter url(), WebGL2 refraction, Safari true-refraction options, reflective rims, standalone showcase tuning, and optical behavior verification.
---

# Liquid Glass optics

Open [`../../shared/assets/showcase.html`](../../shared/assets/showcase.html) directly from disk. It is the restored original standalone showcase: no server, build, network, framework, or external assets are needed. Editable optics, controller, template, plates, and lineage manifest are in `../../shared/assets/showcase/`.

## Restored original model

The showcase preserves its original surface profile, Snell-derived displacement map, directional specular map, seven preset bundles, 2× map sampling, and historical linear RGB dim. The default drop-in retains its separate strategy-1 SVG lens/capability-gate implementation. Do not substitute the removed clean-room SDF engine or its presets.

Standalone describes offline packaging, not independent authorship. Attribution and the inherited-code license boundary are in `../../NOTICE` and `../../PROVENANCE.md`.

## Route the problem

| Need | Read |
|---|---|
| Content filter vs SVG backdrop vs WebGL2 vs frost | `../../shared/references/01-strategy-picker.md` |
| Original displacement/specular maps and SVG graph | `../../shared/references/04-svg-filter-graph.md` |
| Production wash, rim weighting, theme tokens, geometry faults | `../../shared/references/03-dim-and-rim.md` |
| Original WebGL2 API, explicit textures, hybrid swap and cleanup | `../../shared/references/07-webgl-shader.md` |
| Standalone controls, exact original presets, exports and diagnostic API | `../../shared/references/14-showcase.md` |
| Safari URL-filter wall, caches, compositing and OS-material conflict | `../../shared/references/06-safari-webkit.md` |
| Map budgets, idle/viewport gates, scroll synchronization | `../../shared/references/08-performance.md` |
| Transform arming, filter-carrier motion and origin | `../../shared/references/09-motion.md` |

## Two application paths only

1. **Default:** `../../shared/assets/liquid-glass.css` + `.js`, normally through `liquid-glass`. Its strategy-1 lens and conservative gate add optics only where supported; fallback remains usable.
2. **WebGL2:** use `../../shared/assets/webgl-glass.js` with an explicit origin-clean image/canvas/video texture or a WebKit true-refraction brief. It cannot read arbitrary DOM. Paint below content and restore CSS on failure/teardown.

The standalone renderer global is `window.UltimateLiquidGlassRenderer`; its diagnostic page API is `window.UltimateLiquidGlass`. Shared maps do not prove cross-renderer pixel identity.

## Verify the restored behavior

1. Record renderer, browser, surface, width, height, radius, bezel, scale, light angle/opacity/saturation, dim, background, and DPR.
2. Check the seven original preset bundles exactly and require map dimensions of 2× CSS geometry.
3. Exercise every surface/control, real CSS/SVG and WebGL2 drawing, split mode, pointer/keyboard/reset, URL/state validation, exports, and fallbacks.
4. Test center R/G neutrality and actual optical changes without using an external comparison implementation. Do not infer paint from labels or syntax support.

```sh
node scripts/build-showcase.mjs --check
npm test
```

For observed failures, switch to `liquid-glass-debug` rather than tuning blindly.

Part of liquid-glass-suite — install the suite, not this folder alone.
