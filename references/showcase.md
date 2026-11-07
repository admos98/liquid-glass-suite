# Standalone showcase

`assets/showcase.html` is the interactive reference for this skill. Open it directly from disk. Its JavaScript, CSS, and eight SVG backgrounds are embedded; it requires no network, server, framework, or agent installation.

## What is preserved

The baseline is the Azmoonsaz reference playground at commit `0fa31b94a86efb6390fd52f53d61b76464acf6bc`. The original source hash and unmodified comparison files are recorded in `assets/showcase/source-manifest.json` and `tests/reference/source-manifest.json`.

Preserved optics:

- Convex circle, convex squircle, concave, and lip surface functions.
- Snell-derived displacement profile, including the baseline's head smoothing.
- Actual displacement and light-angle specular maps, not independent linear ramps.
- Saturated, displaced backdrop masked by the specular map, then highlight blending.
- Preset values, historical per-channel linear dim, and 2× map sampling.

The CSS/SVG reference was tested with isolated 800×400 stages in Chromium 149.0.7827.55: all seven presets and four surface checks produced **zero changed pixels** against the unmodified Azmoon baseline. See `tests/evidence/verification.txt` for the real test transcript. This proves the tested reference scene, not every browser, geometry, or production app.

## Controls

- **CSS + SVG**: source-matched live backdrop rendering, conservatively gated to Chromium 138+.
- **WebGL2**: explicit background texture with the same displacement/specular pixels and dim parameters. It draws the stage and material below DOM text.
- **Compare both**: retain the CSS stage and add a WebGL2 stage. It is an approximation comparison, not a declaration of bit-identical shader output.
- Presets and surface buttons rebuild maps. Sliders update the relevant optical parameters.
- Drag the preview or use arrow keys. Centre glass resets position.
- Reduce transparency pauses optical draws and uses an opaque readable surface; forced colors does the same. Reduced motion disables toast transitions.
- Exports provide `--lg-*` reference settings and JSON. Failed clipboard operations show an error, not a success message.

## Reference versus production

The reference's `reference-linear` dim mode is intentionally preserved. It is **not** the highlight-weighted production wash described in `references/dim-and-rim.md`. The 2× bitmap sampling is also a reference-parity choice, not the general production budget. Do not silently rewrite either when matching this showcase.

This is a lens-profile approximation with Snell-derived displacement; it does not implement native Apple's private material, dispersion, caustics, Fresnel, or arbitrary DOM capture. Its `convex_squircle` describes the bevel profile; the painted panel outline remains a rounded rectangle.

## Editable source and rebuild

```bash
node scripts/build-showcase.mjs
node scripts/build-showcase.mjs --check
```

The template, optical source, controller, and backgrounds live in `assets/showcase/`. `assets/webgl-glass.js` is included by the builder. The generated HTML is shipped deliberately so an installed skill can demonstrate the material offline.

The builder checks combined JavaScript syntax and, in `--check` mode, requires an exact match with the shipped HTML.

## Integration contract

Do not copy the preview's colors and expect refraction. Integrate its maps and graph with the actual panel geometry.

For WebGL2, include `assets/webgl-glass.js`, place a canvas below content, and supply the inputs explicitly:

```js
const renderer = new window.UltimateLiquidGlassRenderer(canvas);
await renderer.loadPlate(backgroundURL);
renderer.draw(stage, panel, {
  params,              // reference values including radius, blur, saturation, specOpacity, glassBg
  displacement,        // ImageData from the source builder
  specular,            // ImageData from the source builder
  scale,               // effective displacement scale in CSS pixels
  mapKey,              // changes whenever either map changes
  dim,                 // three [slope, intercept] pairs for reference-linear mode
});
// When permanently removing the renderer:
renderer.dispose();
```

The renderer needs an explicit image source. It cannot read arbitrary page DOM. A cross-origin image must be origin-clean for canvas upload; a decode, upload, or program failure must restore the CSS fallback.

The diagnostic API on the standalone page is `window.UltimateLiquidGlass`: `setRenderer`, `setState`, `setBackground`, `getState`, `maps`, and `whenSettled`. Imported settings are finite, bounded, and validated atomically. Exported JSON also includes derived measurement metadata; import only the documented parameter fields, not that metadata.

For production hybrid rendering, disable both spellings of the DOM backdrop inline at the successful swap and restore them on failure or teardown. The reference template does this through its own scoped state CSS; it is not minified by the builder. Follow `references/webgl-shader.md` for the production contract.

## Browser scope

Chromium and Playwright WebKit were exercised on Windows. Playwright WebKit is not an iPhone or a Safari release. Native SwiftUI/UIKit samples were checked against documentation, not compiled on Apple hardware. These limits remain explicit in the README and test report.
