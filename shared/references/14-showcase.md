# Standalone original showcase

`shared/assets/showcase.html` is the restored original interactive showcase. Open it directly from disk. JavaScript, CSS, presets, and eight SVG backgrounds are embedded; no network, server, framework, build step, or agent installation is required.

“Standalone” describes this self-contained packaging. The neutral development notice is in `NOTICE`.

## Restored optics

- Original convex-circle, convex-squircle, concave, and lip surface functions.
- Original Snell-derived displacement profile, including head smoothing and monotone handling.
- Original displacement and light-angle specular maps at 2× CSS geometry.
- Saturated displaced backdrop masked by the specular map, then highlight blending.
- Original seven preset bundles and historical per-channel linear RGB dim.
- Original CSS/SVG graph and explicit-texture WebGL2 approximation.

The showcase does not implement Apple's private native material, dispersion, caustics, Fresnel, or arbitrary DOM capture. Its `convex_squircle` describes the bevel profile; the painted panel outline remains a rounded rectangle.

## Exact original presets

These values are restored, not re-derived. Angles default to −60° and scale defaults to 1 unless changed in the UI. Geometry is CSS pixels.

| Preset | Spec opacity | Saturation | Refraction | Blur | Surface | Bezel | Thickness | Radius | W | H | Glass BG | RGB dim |
|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|
| `searchbox` | 0.2 | 4 | 0.7 | 1 | convex_squircle | 14 | 66 | 21 | 320 | 42 | 0 | 0 |
| `switch` | 0.5 | 6 | 1 | 0.2 | lip | 10 | 60 | 32 | 140 | 64 | 0 | 0 |
| `slider` | 0.4 | 7 | 1 | 0 | convex_circle | 10 | 60 | 20 | 280 | 40 | 0 | 0 |
| `player` | 0.4 | 6 | 1 | 1 | convex_circle | 20 | 80 | 24 | 300 | 200 | 0.6 | 0 |
| `magnifier` | 0.5 | 9 | 1 | 0 | convex_circle | 16 | 80 | 75 | 210 | 150 | 0 | 0 |
| `panelA` | 0.45 | 8 | 0.7 | 3 | convex_squircle | 12 | 66 | 12 | 380 | 200 | 0 | 0.15 |
| `panelB` | 0.35 | 6 | 0.7 | 20 | convex_squircle | 16 | 70 | 24 | 360 | 300 | 0 | 0.15 |

The roles are search/navigation, switch, slider, media player, magnifying lens, app banner (`panelA`), and app menu (`panelB`). Tests require every value and each 2× map size to match this table.

## Controls and behavior

- **CSS + SVG:** original live backdrop graph, conservatively gated to supported Chromium versions.
- **WebGL2:** explicit background texture with the same displacement/specular pixels and historical dim parameters. It draws below DOM text and is not declared pixel-identical to CSS.
- **Compare both:** retain the CSS stage and add the WebGL2 stage.
- Presets and surface buttons rebuild maps; all sliders and size inputs remain live.
- Drag the preview or use arrow keys. **Centre glass** resets position.
- Reduced transparency pauses optical draws and restores the requested renderer; forced colors uses an opaque surface; reduced motion removes toast transitions.
- Exports provide `--lg-*` settings and JSON. Clipboard failure is reported honestly.

State is validated atomically before mutation. URL `#p=` restores valid settings and malformed state leaves defaults intact. The map preview, radius simulation, and displacement chart regenerate with the controls.

## Edit and rebuild

```bash
node scripts/build-showcase.mjs
node scripts/build-showcase.mjs --check
```

Editable sources are `shared/assets/showcase/optics.js`, `controller.js`, `template.html`, and `backgrounds/`. The builder embeds those sources plus `shared/assets/webgl-glass.js` into the generated HTML and checks combined JavaScript syntax. `--check` requires an exact generated-file match.

## Integration contract

For WebGL2, include `shared/assets/webgl-glass.js`, place a canvas below content, and supply explicit inputs:

```js
const renderer = new window.UltimateLiquidGlassRenderer(canvas);
await renderer.loadPlate(backgroundURL);
renderer.draw(stage, panel, {
  params,        // original geometry, blur, saturation, specOpacity and glassBg
  displacement,  // original mapInfo.img
  specular,      // original light-angle specular ImageData
  scale,         // effectiveScale()
  mapKey,        // changes whenever either map changes
  dim,           // dimParams(): historical slope/intercept pairs
});
renderer.dispose();
```

The renderer cannot capture arbitrary DOM. Cross-origin images must be origin-clean. Decode, upload, compile, or draw failures must restore a visible CSS fallback.

The standalone diagnostic API is `window.UltimateLiquidGlass`: `setRenderer`, `setState`, `setBackground`, `getState`, `maps`, and `whenSettled`. Exported JSON includes derived metadata; import only documented parameter fields.

## Verification scope

`tests/browser/showcase.spec.mjs` checks direct offline operation, exact original values and 2× maps, all surfaces/controls, plates, real renderers, split mode, state, movement, exports, and accessibility fallbacks. No external implementation or image is a comparison target. Actual results belong in `tests/evidence/verification.txt`; Chromium tests are not real-device Safari/iPhone or native-runtime evidence.
