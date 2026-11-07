# SVG filter graph and displacement maps

Purpose: depth for a `backdrop-filter: url(#f)` pipeline (displace → treat → rim → highlight), map geometry, parity with a reference lab, and chain-rewrite proofs.

Read when: building, regenerating or rewriting an SVG filter graph, or porting a CSS-path family onto a shader.
Skip if: you need the strategy decision (→ strategy-picker.md) or a symptom lookup (→ failure-catalogue.md).

Summary:
- Rim colour is the refracted backdrop, never paint; feed the blend base from the PLAIN displaced signal.
- Dim is a value-weighted wash inside the filter, one `feFuncR/G/B type="table"` per channel; clamp `d` to `[0, 0.5]`.
- Clamp the displacement profile's head before it becomes a map; build maps at 1 px/CSS px with a 1024 long-side cap.
- `feImage` with `preserveAspectRatio="none"` bakes the bezel as fractions — one static map is only right at one size.
- Count passes from emitted markup, prove rewrites with float sim + in-engine pixel probe, and keep a false-zero guard.

Engine support limits (`url()` is Chromium-only, `@supports` lies) live in → see references/strategy-picker.md §2. This file is the graph itself.

## §1 Which intermediate feeds which treatment

The difference between a material and a cast is which signal each layer consumes:

1. **The rim's colour is the refracted backdrop, never paint.** Saturate/brighten the displaced signal, clip it to the specular ring with `feComposite operator="in"`, then blend the highlight on top with `feBlend`. A gradient rim painted in CSS above the filter cannot take the background's colours — the report is *"the rims don't take the colours"*. A hand-drawn imitation of any filter mechanism fails the same way.
2. **Feed the blend base from the PLAIN displaced signal.** Chain: displace → dim → base, and displace → saturate → dim → ring-clip. Basing the blend on the saturated intermediate leaks the saturate cast across the whole panel, surfacing as *"the whole panel has a tint even at 0"* — the layer is fine, its consumer is wrong.
3. **Dim is a value-weighted WASH inside the filter — one `feFuncR/G/B type="table"` per channel, not a linear scale.** `out_c = x + d·(x/255)·(tint_c − x)`: the pixel's own value is the weight — whites travel the full distance to the tint ("whites washed"), blacks never move (weight 0 — no floor, no lift), mids barely move, and all channels converging on ONE tint keeps hue/saturation (dark TINTED glass, not grey). Clamp `d` to `[0, 0.5]` — monotone only on that interval. Render as 33 `toFixed(4)` samples per channel (<0.09/255 interpolation error) in a single `feComponentTransfer` after the saturate/rim blend; attributes are static, so the contract test recomputes the tables from the dim token. Two earlier laws are banned by regression guard: the affine wash toward mid-grey `103 100 112` (G/B boost ratios 1.0526/1.4737 — wrote +10/+11/+16 onto black, the additive putty floor) and the flat multiply (`x·(1 − d·(1 − tint/255))` — crushed mids uniformly, "practically black / plastic dark"; also guard against `col *= vec3(u_dim`). Tuned strengths `src: measured`: lens 0.12 light / 0.14 dark; floating menus 0.35 light / 0.32 dark with blur cut to 3px both themes — readability is the dim's job, not the blur's. Dark's wash target is the GLASS NAVY `16 15 28`, not black — washed whites keep a blue cast ("glassy dark"), and the token equals the theme's lite/off fill. Re-derive per theme per law swap — numeric transfer across laws only happens at a pure-black tint, and no current theme qualifies. Shader mirror: `col = col + u_dim * col * (vec3(u_dimTr, u_dimTg, u_dimTb) / 255.0 - col)` after clamping col to [0,1]; the slope/intercept uniforms are gone (`u_dimTr/g/b` carry the tint). Attribute-only updates: rewriting the tables needs no map rebuild.
4. **A directional specular zeroes on the side facing away from the light** (`cos²(normal − light)`); at steep angles a corner can lose its rim line entirely. Correct for *dark sides* by design — but if a corner reads as *undefined* rather than dark, floor the term (`max(cos², k)`) so every edge keeps a line. Window the term with a bump that peaks a pixel INSIDE the border and is zero AT the border, so the highlight never paints on the silhouette itself.

**Dispersion (canonical SVG snippet).** Split the source into channels, displace each by a different scale, recombine — the delta between the three scales IS the dispersion:

```xml
<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="only-r"/>
<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="only-g"/>
<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="only-b"/>
<feDisplacementMap in="only-r" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G" result="d-r"/>
<feDisplacementMap in="only-g" in2="map" scale="18" xChannelSelector="R" yChannelSelector="G" result="d-g"/>
<feDisplacementMap in="only-b" in2="map" scale="10" xChannelSelector="R" yChannelSelector="G" result="d-b"/>
<feBlend in="d-r" in2="d-g" mode="screen" result="rg"/>
<feBlend in="rg" in2="d-b" mode="screen"/>
```

Three costs, all real: triples the filter's per-panel work, `feColorMatrix` per channel drops alpha handling, and `screen` blending is an approximation. The scales should differ by a *small* ratio (26/18/10 rather than 26/18/4) — a large split reads as a colour fringe glitch, not as dispersion. **A painted rim cannot produce this, and no token change will get there.** `plus-lighter` over a gradient adds a constant; it never samples the backdrop, so its colour and alpha are near-constant per edge. Only displacement reads the backdrop. Shader equivalent: per-channel IOR → see references/webgl-shader.md §GLSL core.

## §2 Displacement profile and map resolution

A superellipse/squircle surface has an infinite slope at `s=0`, so a Snell-refraction profile sampled from the edge spikes then cliffs (15px → 40px of travel inside half a pixel). Over flat colour it is invisible; wherever a colour seam crosses the border it tears — a step in the band, a ghost slice at the cap, a kinked corner. That is the mechanism behind *"one corner is crisp, the one over a colour boundary is not"*: same geometry, different backdrop.

Fix the source curve, never the PNG:
1. `out[0] = out[1]` — the border starts at the peak.
2. Enforce monotonically non-increasing magnitude from the edge inward.
3. Box-smooth (3-tap weighted `[1,2,1]/4`), two passes.
4. Pin the last sample to 0.

This complements the strict-monotonicity rule (a non-monotonic profile creates dead zones); it governs the first few samples at the border specifically.

**Map resolution.** Build at `Math.min(devicePixelRatio, 2)` was round 2: 45° arcs supersample cleanly, but a 1240×800 panel paints two 2480×1600 ImageData and PNG-encodes them on the main thread — 30–80 ms each, the scroll-jank signature. Round 3 measured that the field is a smooth gradient (neutral interior, monotone ring ramp) and proved it does not need supersampling: build at **1 map-px per CSS px, long side capped at 1024**, and let the browser upscale the raster into the element box. On-screen ring geometry is defined in CSS px and is unchanged; the per-pixel loop and encode shrink 4–16×. Keep the 2× rebuild on DPR change (zoom), not on every resize. Operating rule: the ramp must be smooth in map-space; if a bend tears or a corner stair-steps at a real DPR, raise the floor on that panel only — do not force 2 globally. Safari uses a conservative exception (≤512px map long side, 8px-grid cache key), not a claimed universal source-graphic ceiling. The standalone reference showcase keeps its original 2× supersampling for measured parity. → see references/safari-webkit.md §6.

## §3 Proving a layer exists, and reference parity

Render twice, differing only in the new layer (e.g. refraction 0 vs N), and diff the frames. On a smooth plate a live effect may move only a few levels per channel — invisible to the eye, decisive in the diff — and a featureless gradient cannot show the bend at all, so judge on bands or text. Pair with the status-line check (a built filter reports itself) to separate "dead" from "subtle" before writing any diagnosis.

When a playground/lab is the approved reference and the standing bar is *no difference between the lab and the live app*:

1. **Port the reference's filter builder VERBATIM** — same intermediate names (`displaced`, `rgb_dimmed`, `specular_faded`…), same op order — instead of re-implementing its *output* as CSS layers. If the reference computes rim/saturation/dim inside the filter, the app's utilities paint NOTHING: no rim gradient, no bloom, no text-shadow, no CSS `saturate`. A CSS approximation of a filter mechanism is the painted-rim fake from §1.
2. **Blur stays in the CSS chain.** `blur()` is the `feGaussianBlur` equivalent at the same position (before displacement), so per-type blur tokens keep working against ONE shared filter; the gate rule is `blur(var(--t)) url('#x')`, `url()` last. → see references/strategy-picker.md §4.
3. **Theme-varying params need one filter per theme.** CSS cannot feed `slope`/`values` attributes — they are static — so ship `#x` (light) + `#x-dark` (dark) differing only in the dim table, selected by the theme gate in CSS.
4. **Tokens stay the single source through TESTS, not through comments.** The contract test recomputes every static attribute from the tokens (dim tables `toFixed(4)`, `feFuncA` slope = spec-opacity, `type="saturate"` values = spec-saturation, `scale` = max-displacement) and pins chain structure by the reference's result names. Both maps — displacement AND the specular ring (its light angle parsed from the angle token) — come from one tool that PARSES the tokens; run it twice and require byte-identical output for each.
5. **Moving a layer INTO the filter must extend the dead-token guard in the same change** — every CSS-side copy of the moved value joins the "must never come back" list. Tiers that STRIP `backdrop-filter` (lite/off) lose the moved layer entirely — give those tiers a CSS stand-in on its own fallback token (fill alpha `0` while the filter runs, swapped up by the tier block), so degraded devices keep contrast without the old value sneaking back as a second source.
6. **Narrow, don't delete, a repo rule that blocks parity.** When the project's own regression test bans a primitive the approved reference needs, replace the blanket ban with an assertion on the historical defect (ban data-URI gradients inside a filter — the actual right-edge-only cause — while allowing the primitive), say so in the commit, and get the user's yes first; never quietly drop the guard.
7. **JS→Python ports: `Math.round` is half-up, Python `round` is banker's.** Use `int(v + 0.5)` in a Python map generator or the artifact silently diverges from the reference while every test stays green.

**Parity check 1: the number sets, before any render theory.** When the report is *"the app and the playground/lab are very different"*, diff the two **value tables** first — the reference's exported tuning vs the app's tokens (refraction→displacement `scale`, spec opacity, saturation, spec angle, thickness). They drift in separate commits, and the reference's agreed state usually lives in its **address-bar hash**, not its committed defaults: ask for the URL rather than treating defaults as canonical. Five drifted values each change the render on their own; any mechanism story told before the diff is a guess.

**Parity check 2: one map, many sizes — the bezel is baked as FRACTIONS.** `feImage` with `preserveAspectRatio="none"` stretches the map onto the element box, so a map generated for one canonical panel size carries its bezel as **percentages**: a 14px bezel on 326×64 is 4.3% horizontally / 21.9% vertically. Stretched onto real surfaces the geometry lies:
- a 1240px-wide section gets **51px-deep side bands** of lateral displacement (designed: 14px) → *"pushing everything sideways"*;
- a 400px-tall menu gets **87px** top/bottom bands → *"the bend is misplaced"*;
- the baked corner arc stretches into an ellipse that no longer matches the panel's own radius.

A reference playground regenerates the map at the current panel size (size inputs re-run the builder); a shipped app with one static PNG can only be right at its canonical size. Fix direction is a decision, not a default: port the reference's builder to runtime generation (canvas → dataURL → **fresh filter id**, caches keyed on id), or ship bucketed filters per size class — and if a single map is kept deliberately, say in the handoff that non-canonical sizes bend approximately. → see references/performance.md §Fixed-ladder engine.

## §4 Verify a regenerated map against its declared scale

`feDisplacementMap` moves pixels by `scale × (C/255 − ½)`, so the declared peak `scale/2` only materializes if the channels actually reach 0/255 — a head-smoothed profile can undershoot it **and** skew the two edges (left pulling 19px while right pulls 16px is an unequal shove the eye reads as misplacement). After any map regeneration, decode the PNG and check: centre neutral (identity in the interior), per-edge peak pull in px vs the declared peak, L/R and T/B symmetry, band depth as a fraction of the map (that fraction is what gets stretched onto every panel size), and alpha never touching 0 (Chromium premultiplies by alpha; a zero-alpha map displaces uniformly and looks like a dead bend). `scripts/measure-displacement-map.py <map.png> --scale <declared>` prints exactly that and exits non-zero on a shortfall. → see references/measurement.md §Chain delivery (fixture: `tests/fixtures/lens-map.png`).

## §5 Chain rewrites

**Count passes from the emitted markup, never from memory.** Every `fe*` node is one full-resolution raster pass plus an intermediate buffer, per frame, per panel — `feImage` included (it materializes its image at element size). A chain remembered as "11 primitives, foldable to 6" can be an exact-preserving 10 → 9.

- Identity primitives (`feComponentTransfer` slope 1 / intercept 0, `feOffset` dx 0 dy 0) cost a full pass and paint nothing. Emit them only when a downstream `in=` reference needs the result name; when a branch is disabled emit nothing and re-point the downstream references.
- One fewer full-res buffer is a real win even when the pass count barely moves: buffers scale with panel area × DPR².

**Equivalence algebra.**
- An affine op `dim(x) = m·x + c` commutes with an alpha-weighted blend when the weights sum to 1: `dim(a·S + (1−a)·D) = a·dim(S) + (1−a)·dim(D)`. In premultiplied terms the intercept scales by the pixel's alpha on both sides, so the identity holds at any backdrop alpha — verify both sides, don't assume opacity.
- `feComposite operator=in`: premult `out = src_p · a_in2`, `out_a = a_src · a_in2`. `feBlend mode=normal`: `out = src + dst·(1 − src_a)` (premultiplied). Chain the algebra in premultiplied space; SVG primitives operate on straight values but compositing is premultiplied.
- A transfer that writes only `feFuncR/G/B` passes alpha through untouched — that is what lets a dim move across a blend without disturbing the alpha channel.
- Divergence that only appears when an intermediate leaves [0,1] is a CLAMP question, not an algebra question.

**Two-stage proof.**
1. Float algebra sim (Python is fine): random samples × every theme's token values × adversarial inputs — pure primaries (overflow for `saturate` s>1), mid-saturation UI colours, gradients, partial backdrop alpha. Reports where the chains can diverge.
2. In-engine pixel probe settles clamp/quantization behaviour, which the sim cannot know. A sim that skips mid-chain clamping will overstate divergence on exactly the overflow paths stage 1 found; renderers clamp/quantize primitive outputs (8-bit buffers). Ship stage 2's measured max delta (LSB of 255) as the equivalence evidence.

**Probe anatomy** (one standalone page): two `<filter>` defs in one page — old chain and new chain — fed identical `feImage` inputs (data-URL PNGs built at runtime). Render both via canvas 2D: `ctx.filter = 'url(#id)'; ctx.drawImage(src, …)` then `getImageData`; diff in JS; report max/mean LSB, % of channels moved, worst pixel. Source pattern must be adversarial: pure `#f00/#0f0/#00f/#ff0` blocks to force matrix overflow, plus greys, skin tones, brand colours, gradients. **False-zero guard (mandatory):** if the `feImage` inputs never load, both chains render identically-wrong and a diff of 0 proves nothing. Include a control filter that renders one input alone over a known underlay and assert its pixels against computed expectations. Emit results into the page DOM as prefixed JSON (`RESULT:{…}` / `ERROR:{…}` in a `<pre>`) plus a `PENDING` initial state, so a headless runner just waits on the prefix and prints.

**Headless runner.** Drive with Playwright from the project's own `node_modules` (`NODE_PATH=<project>/node_modules node runner.cjs <page> <out.json>`); headless context, `waitForFunction` on the DOM marker, print page/console errors on timeout. If launch fails on a missing bundled browser revision, pin `executablePath` to an installed ms-playwright build (glob the ms-playwright cache) instead of assuming a download is available.

**Render-contract tests.** Contract tests regex-pin emitted markup (primitive names, `in=`/`result=` fragments, attribute shapes). Before renaming a result or removing a primitive, grep the test tree for the exact fragments and update the assertions in the same commit — the rewrite is not done until the contract test pins the new chain.

## Appendix A — Inventory before a swap batch

When the plan is "retire every existing surface onto the new material", classify before editing:
- **Count class usages PER FILE** in one aggregated regex pass over `*.tsx`, not just globally — the per-file column is the blast radius and sets the review order.
- **Classify each hit by interaction:** portalled/fixed overlay (dropdown list, modal, palette, menu stack), in-flow chrome (pills, header), static card, control (blur-free inset). Popups and cards usually want different tiers of one material; controls must stay OUT of the swap.
- **Include the rimless variants** (`glx` with no `glass-edge`) — a swap keyed on the rim class misses most instances, because most content boxes never carried a rim, and they are still live `backdrop-filter` surfaces.
- **List component-driven materials** (a `Card` glassLayer map, a StatCard default) separately from call sites — they change many surfaces at once: one prop default re-materials every instance, while stale per-call props then need their own sweep.
- **Bucket dev/test pages apart** so the app counts stay honest, and report counts, not anecdotes — "27 rimmed cards + 168 rimless boxes across 20 files" is what the user decides a mapping from.

## Appendix B — Porting a CSS-path family onto the shader (urlArea recovery)

A perf report decoding to `engine.mode: webgl` with a small `drawn` count while the page's largest surface still shows `hasUrl: true, glassPaint: null` in the surface census means that family never reached the shader and every frame still runs its full CPU/Skia `url()` graph (`src: measured`: ~388k px on one card — the whole scroll budget). "It keeps its CSS bloom" is not an exclusion reason: the bloom is painted material (`box-shadow`) and composites over shader output exactly as it composited over `url()` output. Keep it through the paint-strip with a higher-specificity `!important` override scoped to the family — and make the strip's blur kill load-bearing INLINE at the atomic swap (`style.setProperty('backdrop-filter','none','important')`, both spellings, cleared on untrack/teardown), pinning the inline style in e2e rather than only the computed value: production minification collapsed the stylesheet's dual declaration to the `-webkit-` spelling, leaving Chrome's computed standard property at `blur(1px)` — every drawn panel double-painted its Skia blur under the canvas in prod only. → see references/measurement.md §Live audit.

Chain-parity checklist before the swap:
1. The param reader must read the FAMILY's tokens — chain blur, chain saturate — not the house lens tokens.
2. Chain saturate is a whole-image filter applied AFTER the displacement sample (CSS order is blur → saturate → url) and is a different uniform from the masked rim saturation — never overload one uniform for both.
3. The shader reproduces ONLY the backdrop chain, in CSS order: backdrop → chain saturate → masked rim sat → dim (inside the chain, after the rim blend) → specular fade. That is the whole shader.
4. **Do NOT shader-paint the family's own fill gradient — keep it DOM-painted.** The cascade owns per-element fills: an ID rule can beat the utility class, and a `background:` shorthand whose var resolves transparent wipes the utility's `background-image` entirely — so a token-derived shader fill paints a wash the CSS path never had (`src: measured`: +6/255 on a hero whose page rule replaced the gradient). Strip the DOM background only for families whose fill is 0; for the ported family keep the DOM background AND its painted bloom (`box-shadow`) via scoped `!important` overrides. Removing the shader fill and keeping the DOM fill collapsed the port's residual from ~8 to ~2.4 mean|d|. If a computed background reads `none` while a utility declares a gradient, dump matched rules (CDP `CSS.getMatchedStylesForNode`) — a higher-specificity shorthand is the explanation, not a bug.

Prove it before trusting it:
- Gate the family behind a URL-param A/B lever (resolution order `window.__x` > query param > default) so ONE build renders both paths; capture the pair in one session and diff: acceptance is 0 changed pixels OUTSIDE the family rects, and the inside-family mean|d| is the stated migration error.
- Bisect any inside-family residual with override capture pairs applied to BOTH modes (sat=1, then fill=0): the override that collapses the delta names the mechanism. On this pipeline fill=0 collapsed it to ~1/255 — meaning the FILL layer is the delta, and the fix is to hand the fill back to the DOM, not to re-derive fill numbers in the shader. Run this before touching the blur: widening the shader's blur kernel did NOT move the parity number at all. A part of any fill residual is Chromium compositing an element's background over its own filter output ~2/255 off naive alpha math (confirm with a minimal three-swatch page: filter+fill / fill-only / filter-only, read the centres).
- Flip the e2e pin the same day: the test asserting the family is "not painted and keeps its backdrop" inverts to "painted, transparent backdrop-filter, DOM painted material (fill + bloom) survives" — invert, never delete.
- Mirror the family into the lab's chain reader too (its `chainBase`/`paramsFor` equivalents). A split-mode A/B in the lab must run the shipping chain, or the comparison measures a family the app no longer paints — and the lab's fill/params divergence is its own source of fake deltas.
