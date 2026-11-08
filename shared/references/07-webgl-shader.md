# WebGL rendering

Use WebGL when the product can supply an explicit image, canvas, video, or other origin-clean backdrop. A renderer cannot read arbitrary page DOM by itself. Keep a readable CSS fallback on unsupported or failed paths.

## The shipped renderer

`shared/assets/webgl-glass.js` exports `window.UltimateLiquidGlassRenderer`. It is the **WebGL2 renderer** actually consumed by the standalone showcase, not the previous WebGL1 shader sketch.

Pipeline: centred cover plate → separable Gaussian blur → supplied displacement map → rim-saturated/plain branches → reference linear dim on both branches → specular-alpha backdrop mask → light highlight → reference white fill below DOM content.

Map pixels and dim parameters come from the source builders. CSS/SVG retains the original graph. **WebGL2 is an approximation**: texture sampling, backdrop clipping, edges, and blur can differ. Shared maps do not prove shared output pixels; no external comparison baseline is bundled.

The renderer does not implement chromatic dispersion, Fresnel-Schlick, Beer absorption, caustics, or ACES. Those are alternative optical models, not features hidden in this package. Add them only if the brief wants a different material; they require a separate behavior and verification contract.

Call contract and standalone packaging: `shared/references/14-showcase.md`.

## Production hybrid contract

A real application needs source capture/input, geometry tracking, safe selection, and cleanup beyond the controlled standalone stage.

- Paint optics below labels and controls.
- Never duplicate a DOM fill in the shader and above it. The reference owns its simple white fill in the shader and disables the DOM reference fill during the swap. A production DOM-owned fill stays out of the shader.
- Disable the panel's DOM backdrop only after successful shader output. Use both spellings inline so minification cannot drop the intended kill:

```js
panel.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
panel.style.setProperty('backdrop-filter', 'none', 'important');
// Restore on failure or untrack:
panel.style.removeProperty('-webkit-backdrop-filter');
panel.style.removeProperty('backdrop-filter');
```

- Preserve SVG dress for panels a shader cannot place; removing visible rims/refraction is a trade-off requiring explicit approval.
- Nested glass must share composition and coordinate clocks.
- Handle image, program, framebuffer, upload, draw, and context failures. Origin-unclean images cannot travel through a 2D canvas into the texture.
- Respect reduced transparency, forced colors, and reduced motion in runtime paths.

## Blur and color modes

The reference preserves its original in-graph blur and linear slope/intercept dim. Production highlight-weighted wash is a different curve (`shared/references/03-dim-and-rim.md`); implement it explicitly in both SVG and GLSL when chosen.

A tiny fixed kernel cannot cover every blur radius. The supplied separable Gaussian varies with sigma and pairs neighbouring taps with bilinear sampling. Downsampling is a separate approximation requiring new comparisons.

## Scroll and idle work

An application-wide fixed canvas can trail compositor scrolling. Do not extrapolate position without proving the effect; prediction can bounce or overshoot. Use the compositor-coordinate pair in `shared/references/08-performance.md` or measure and disclose the residual gap.

Gate paint on real input, geometry, material, and visibility changes. Resize forces paint because buffer allocation clears the surface. The showcase is event-driven and owns one explicit stage; it is not a multi-panel station manager or a supplied compositor scroll lock.

## Renderer verification

Use one build, one browser session, matched geometry and settings. A zero-refraction/specular control proves optical terms affect real output.

For renderer swaps, require zero changed pixels outside the material rects after controlling unrelated animation/antialiasing. Inside, report mean and maximum channel difference and edge/corner crops. Zero one term in both paths at a time to isolate dim, fill, blur, saturation, and specular. Read built-application computed styles to catch duplicate filtering.

A historical app's approximately 2.4/255 mean inside delta is contextual evidence, not a measurement of this package. Current tests and real output: `tests/README.md` and `tests/evidence/verification.txt`.

## Scope

Current behavior tests run in the named Chromium runtime with software WebGL2. They are not real iPhone/Safari or native-rendering checks. Arbitrary live-DOM capture is not validated. Both renderers stay installed and selectable.
