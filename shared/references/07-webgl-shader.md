# WebGL2 explicit-texture renderer

Use `shared/assets/webgl-glass.js` when an origin-clean image/canvas/video texture is available or true refraction is required outside the SVG-backdrop support path. It cannot capture arbitrary page DOM.

## Clean pipeline

The renderer owns one full-stage canvas below DOM content and executes:

1. **Plate:** decode the explicit source and draw it with centered cover fitting into a canvas-sized texture.
2. **Blur:** when requested, run two thirteen-tap separable Gaussian passes into framebuffer textures. A zero blur bypasses both passes.
3. **Composite:** sample the plate, displacement map and specular map. Evaluate rounded-rectangle SDF coverage for antialiasing, decode map travel, refract the blurred source, create plain/saturated wash branches, mask colored rim and white light, then apply white fill.
4. **DOM:** leave text and controls above the canvas. On the successful hybrid swap, scoped CSS disables the DOM backdrop; failure or teardown restores it.

There is no separate full-screen copy pass and no historical linear-dim uniform path. Both WebGL2 and CSS/SVG consume the same suite-generated maps, slate wash and fill values. Their rasterization may differ at edges.

## API

```js
const renderer = new window.LiquidGlassRenderer(canvas);
await renderer.loadPlate(url);
renderer.draw(stage, panel, {
  params,        // width, height, radius, bezel, thickness, refraction, gain,
                 // lightAngle, specular, chroma, blur, fill, dim, surface
  displacement,  // ImageData, R=X and G=Y around 128
  specular,      // ImageData, white RGB and directional alpha
  scale,         // SVG-compatible displacement scale; 48 in the suite
  mapKey,        // new identity whenever either map changes
});
renderer.dispose();
```

`params.width`/`height` describe the generated map and panel geometry; the renderer uses the panel's current bounding rectangle and device-pixel ratio for placement. Radius is capped to half the shorter rendered side. Upload maps when `mapKey` changes and the plate only when its URL/size changes. Dispose textures, framebuffers, programs and the quad buffer when permanently removing the instance.

## Texture and security contract

- Supply an explicit decoded source. Cross-origin images require valid CORS permission and an origin-clean canvas.
- Use clamp-to-edge sampling for maps and plate textures. Report decode/upload errors to the caller.
- Canvas backing size uses device pixels with a suite cap of 2× for the preview. Displacement travel is multiplied by the same DPR.
- `preserveDrawingBuffer` is enabled for deterministic suite-owned test screenshots; an application may choose a different presentation budget in a separately tested renderer.
- Compile and link status, framebuffer completeness and `getError()` after drawing are checked. A thrown error must produce visible CSS fallback status, not a blank stage.

## Verification

Prove WebGL2 drawing by reading pixels or capturing the canvas, not by checking context creation alone. Exercise zero and nonzero blur, map updates, plate changes, resize, split mode, reduced transparency and restore. Keep DOM backdrop enabled until the first successful draw.

The model does not implement chromatic dispersion, Fresnel-Schlick, Beer absorption, caustics, ACES or arbitrary DOM capture. Those are different optical/features decisions and need independent derivations and tests.
