# SVG filter graph and SDF optics

`src: spec` filter primitive behavior; `src: measured` browser behavior must name its browser and geometry. The suite implementation uses an independently derived per-pixel field, not a rotated one-dimensional profile.

## §1 Geometry to displacement

For each pixel, evaluate the rounded-rectangle signed-distance field (SDF). Its analytic gradient is the outward direction. Inside the bezel, a surface-family height equation supplies local glass depth and slope. Construct a three-component normal and apply vector Snell refraction with incident light vertical to the panel. Project the transmitted ray through the local depth to obtain lateral X/Y travel.

The suite's four height families are convex circle, convex squircle, concave and lip. They change the slope field; the painted panel outline remains a rounded rectangle. At depth greater than the bezel, write neutral R=128/G=128 so the center content samples its original location.

SVG `feDisplacementMap` decodes a selected channel as `(C - 0.5) * scale`. The suite budgets ±24 CSS pixels and uses scale 48, with X in R and Y in G. Blue is neutral and alpha is opaque. Generate maps at the actual panel width and height; stretching a map to unrelated geometry is approximate.

## §2 Specular is a directional mask

The light map is white RGB with a computed alpha mask. The suite multiplies a three-pixel linear rim window by the cube of the positive dot product between the SDF gradient and the selected light direction. The opposite-facing edge therefore has zero alpha. Saturation belongs to the refracted backdrop branch, not to opaque white paint.

Required mathematical probes:

- center and flat interior are neutral;
- near-edge displacement is nonzero and grows away from the exact silhouette;
- 180-degree corresponding vectors are opposite within channel quantization;
- light-facing alpha is nonzero and the matching opposite sample is zero;
- reversing the light reverses those samples.

These tests are not available from a screenshot description. Inspect map bytes and separately prove that the renderer draws.

## §3 Suite graph order

1. Load the displacement bitmap with `feImage` and displace `SourceGraphic` using R/G.
2. Keep a plain displaced branch and a Rec.709-saturated displaced branch.
3. Apply the highlight-weighted slate wash independently to both branches. Black remains black; the dim must transmit color.
4. Load the specular bitmap with `feImage` and mask the saturated/washed rim branch with its alpha.
5. Composite the colored rim over the plain body, then composite white specular light using the same alpha.
6. Apply the DOM element's white background-opacity fill and CSS blur/saturation in the documented order. Keep `url(#id)` last in the backdrop chain.

`color-interpolation-filters="sRGB"` is the suite's explicit color-space choice. Filter-region clipping, primitive subregions and alpha premultiplication can erase an otherwise valid effect; inspect each intermediate when debugging.

## §4 Live rebuilds and resources

Use a fresh filter ID whenever map bytes change. Replace the old node or definition deliberately; do not rely on mutating an attribute that a browser may have cached. `feImage` hrefs are embedded PNG data URLs in the standalone showcase, so file/offline use has no network dependency. In an app, blob/data URLs and canvas uploads must remain origin-clean.

The default budget is one bitmap pixel per CSS pixel. Quantize cache keys only when the resulting approximation is disclosed. A resize observer should coalesce rebuilds into animation frames, and hidden/offscreen panels should not regenerate continuously. See `shared/references/08-performance.md`.

## §5 Backdrop and failure boundaries

An SVG backdrop filter can refract the painted backdrop where the browser supports that path; it is not arbitrary DOM capture for WebGL. CSS syntax support does not prove paint. Chromium support is conservatively gated in the showcase, while the explicit-texture WebGL2 route remains available. Safari/WebKit behavior requires its own rendered check and the explicit-texture strategy in `shared/references/06-safari-webkit.md`.

On compile, image decode, security or paint failure, remove the optical chain and retain a readable frosted or solid fallback. Reduced transparency and forced colors take precedence over requested optics. The visualizations in the showcase are diagnostics, not proof that a backdrop painted.
