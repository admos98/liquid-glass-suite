# Standalone clean-room showcase

`shared/assets/showcase.html` is the interactive product reference. Open it directly from disk. JavaScript, CSS, presets and eight suite-authored SVG plates are embedded; opening it requires no network, server, framework, build or agent installation.

## Independent optics

The field is evaluated independently at every bitmap pixel:

1. Evaluate a rounded-rectangle signed-distance field and its analytic outward gradient.
2. Convert normalized bezel depth through the selected convex-circle, convex-squircle, concave or lip height equation.
3. Estimate local slope with a bounded central difference and construct a three-component surface normal.
4. Apply vector Snell refraction in air/glass and project lateral travel through the local glass depth.
5. Encode X/Y in R/G around 128, with a ±24 CSS-pixel design budget and SVG scale 48. The flat interior remains neutral.

The default index of refraction is the textbook glass approximation 1.5. Slope is capped at 8 for numerical stability. The light model is independently designed: a three-pixel linear rim window multiplied by a cubic light-facing lobe. The opposite edge receives no specular light. No profile lookup sweep, external preset bundle or external visual target is used.

Both CSS+SVG and WebGL2 consume the same `ImageData` displacement and specular maps. CSS uses a fresh `feImage`/`feDisplacementMap` graph. WebGL2 uses two separable blur passes and one scene/material composite pass. Both apply the same highlight-weighted slate wash and white fill. Pixel identity between different rasterizers is not required.

## Product presets

These seven bundles are the only product presets. Values are independently tuned for the suite's plates and product sizes. Every row below exactly matches `shared/assets/showcase/presets.json`; each bundle also has a `_derivation` note there. Angles are degrees and geometry is CSS pixels.

| Preset | Specular | Chroma | Refract | Blur | Light° | Fill | Dim | Surface | Bezel | Thick | Gain | Radius | W×H |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|
| `navigation` | 0.3 | 2.5 | 0.85 | 2.5 | -35 | 0.08 | 0.15 | convex_squircle | 16 | 48 | 1 | 18 | 340×52 |
| `toggle` | 0.45 | 3.25 | 1.1 | 1.5 | -25 | 0.05 | 0.1 | lip | 10 | 36 | 0.9 | 28 | 156×56 |
| `slider` | 0.38 | 3 | 1.2 | 1 | -45 | 0.04 | 0.08 | convex_circle | 12 | 42 | 1.1 | 20 | 300×44 |
| `player` | 0.32 | 2.25 | 0.65 | 4.5 | -20 | 0.22 | 0.2 | convex_squircle | 22 | 58 | 0.85 | 28 | 320×216 |
| `loupe` | 0.5 | 3.5 | 1.35 | 0.5 | -40 | 0 | 0.05 | convex_circle | 18 | 72 | 1.25 | 72 | 144×144 |
| `panelA` | 0.28 | 2.75 | 0.75 | 3.5 | -30 | 0.12 | 0.18 | convex_squircle | 14 | 40 | 0.8 | 16 | 384×128 |
| `panelB` | 0.36 | 2.5 | 0.9 | 6 | -50 | 0.16 | 0.24 | lip | 20 | 54 | 1 | 24 | 360×280 |

The product roles are navigation/search bar, toggle switch, slider, media player, loupe/zoom lens, app banner (`panelA`) and app menu (`panelB`). A preset replaces the complete settings object atomically and centers the panel.

## Controls and ranges

| Setting | Range / step |
|---|---|
| Specular | 0…0.8 / 0.05 |
| Rim saturation | 1…6 / 0.25 |
| Refraction | 0…1.5 / 0.05 |
| Blur | 0…16 / 0.5 |
| Light angle | −180…180 / 5 |
| Background opacity | 0…0.6 / 0.01 |
| Dim | 0…0.5 / 0.01 |
| Bezel | 4…40 / 1 |
| Thickness | 10…100 / 2 |
| Gain | 0.25…1.5 / 0.05 |
| Radius | 0…160 / 1, additionally capped at half the shorter side |
| Width / height | 80…640 / 2 and 32…320 / 2 |

All controls regenerate the maps and visualizations. Drag the preview or use arrow keys; **Centre glass** resets position. Eight plate buttons and the deterministic generated-plate option work offline. Compare mode retains the CSS stage and adds the WebGL2 stage. Reduced transparency pauses optical draws and restores the requested renderer; forced colors and reduced motion retain their accessible CSS behavior.

State changes validate a complete candidate, including unknown keys, finite numeric bounds and radius/geometry, before mutation. URL `#state=` restores valid settings and ignores malformed input. CSS-token, integration-token and JSON exports share the current state; clipboard failure is reported as failure.

## Editable source and rebuild

```bash
node scripts/build-showcase.mjs
node scripts/build-showcase.mjs --check
```

- `shared/assets/liquid-glass.js`: shared field core and default drop-in wrapper.
- `shared/assets/showcase/optics.js`: validated state, SVG composition, controls, exports and visualizations.
- `shared/assets/showcase/controller.js`: renderer selection, texture ownership, movement and diagnostic API.
- `shared/assets/webgl-glass.js`: explicit-texture renderer.
- `shared/assets/showcase/template.html`, `presets.json`, `plates/`: UI, product tuning and owned artwork.

The builder validates preset shape/geometry and exactly eight plates, checks combined JavaScript syntax, and requires the generated HTML to match editable source.

## Integration and diagnostics

For WebGL2, include `shared/assets/webgl-glass.js`, place a canvas below content, and supply explicit inputs:

```js
const renderer = new window.LiquidGlassRenderer(canvas);
await renderer.loadPlate(backgroundURL);
renderer.draw(stage, panel, {
  params,        // all 14 settings from a preset or validated state
  displacement,  // ImageData from LiquidGlassField.createMaps(settings)
  specular,      // matching ImageData light mask
  scale,         // 48 for the suite's 24-pixel displacement budget
  mapKey,        // change whenever either map changes
});
renderer.dispose();
```

The renderer cannot capture arbitrary page DOM. Cross-origin textures must be origin-clean. Decode, upload, compile, link or draw failures must leave a visible CSS fallback.

The standalone diagnostic API is `window.LiquidGlassShowcase`: `setRenderer('css'|'webgl'|'split')`, `setState(partial)`, `setBackground(url)`, `getState()`, `maps()` and `whenSettled()`. `setState` is async and atomic. Exported JSON is informative; import only documented settings fields.

## Verification scope

`tests/browser/optics.spec.mjs` checks offline operation, real CSS/SVG and WebGL2 drawing, split mode, map properties, controls, presets, state, input, exports, fallbacks, accessibility and mobile layout. The three screenshots in `tests/baselines/` were captured from this engine in Chromium 153 with software WebGL2, then passed a separate no-update run. They are the only visual baselines. This is not real-device Safari/iPhone or native-runtime evidence.
