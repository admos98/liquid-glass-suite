# Performance

Purpose: diagnose scroll lag and still-frame cost, then apply the levers that actually work for a canvas-painted or `url()`-dressed glass layer.

Read when: fps drops while scrolling, panels trail the DOM, a full-viewport repaint never stops, or someone proposes culling refraction for speed.
Skip if: the effect is absent rather than slow (→ strategy-picker.md §4, failure-catalogue.md).

Summary:
- Diagnose first: slow only while scrolling = raster-bound; slow while still = a frame driver.
- Only compositor scroll lock works: `animation-timeline: scroll(root block)`, measured `maxLockErr 0.00px` over 131 samples.
- Gate idle repaints on frame identity; keep `resize` outside the gate; no infinite pulse in frame.
- Never cull a panel's `url()` graph for fps — the graph is the rim and the bend.
- One canvas, many panels; no `content-visibility: auto` on glass cards.

## §Diagnose first: scrolling vs still

**Worst frames with `scrolling: true`, no longtask overlap, acceptable fps is the cadence signature** — every cost lever is wasted there. Two different diseases:
- Slow only while scrolling = raster-bound (compositor re-sampling backdrops).
- Slow while still = a frame driver (infinite animation, timer, DOM adds).

## §Scroll lock (canonical table and recipe)

A `position: fixed` canvas repaints on the rAF clock while the DOM scrolls on the compositor clock. Every frame the canvas paints at the scroll value the main thread last observed, so glass trails its own DOM contents by roughly one display interval. Measured on a real app at a clean 60 fps `src: measured`: `maxStale 37 px` over one dashboard run, `staleFrames 869` — the visible symptom is "the big bent panels move slower than the panels inside them".

| Approach | Verdict |
|---|---|
| **Compositor scroll lock** — translate the canvas with `animation-timeline: scroll(root block)` | **Works. `maxLockErr 0.00px` over 131 samples.** Zero main-thread cost. |
| Document-sized canvas in flow, moved by the compositor | **Impossible.** GL `MAX_TEXTURE_SIZE` is 8192; a 6000 px page at dpr 2 needs a 12000 px buffer (117 MB). Probe `gl.getParameter(gl.MAX_TEXTURE_SIZE)` before designing around this; do not assume 16384. |
| Predict the delta (raw, or EMA-smoothed) | **Rejected by users.** Cancels the average trail but slides ahead and eases back on every flick; wheel input can move **220 px in a single frame**, which no linear prediction can track. The clamp only bounds the error. |

**Never restore a display-time "lead"** (any estimated motion overshoots and reads as *"slides ahead then eases back"*). If you cannot ship the lock, paint at read-time position and *instrument* the gap. Cadence-bound (drift ≈ one frame of motion) reads differently from raster-bound (long frames, high filtered area).

### What works

Translate a viewport-sized canvas by exactly the scroll distance with a CSS scroll-driven animation. Scroll timelines advance on the same compositor clock that moves the DOM, so glass and content cannot desync. Measured lock error: **0.00 px at every sample across 131 frames**, with zero main-thread cost (no JS runs for the motion).

```css
@supports (animation-timeline: scroll()) {
  .glass-canvas {
    animation: glass-scroll-lock linear both;
    animation-timeline: scroll(root block);
  }
  @keyframes glass-scroll-lock {
    from { transform: translateY(0); }
    to   { transform: translateY(calc(-1 * var(--glass-scroll-range, 1px))); }
  }
}
```

- `--glass-scroll-range` must be written from script as `document.scrollingElement.scrollHeight - document.documentElement.clientHeight` and refreshed on resize / route change. `clientHeight` is the exact scroll-range denominator; `window.innerHeight` over-counts when a horizontal scrollbar is present and mis-scales every translate. The `1px` fallback keeps the animation valid before the first write.
- The keyframe range is the **scroll travel**, not the document height. Using `translateY(-documentHeight)` overshoots by exactly one viewport and every sampled frame reports a constant error equal to the viewport size.
- `position: fixed` stays. The transform moves it; the buffer stays viewport-sized, which is what keeps it under the texture limit.

### The painted−live variant (simpler when the canvas is glass-only)

The recipe above anchors the canvas to the document (transform = −scrollY over the full range), which forces the document-space shader. A lighter variant keeps viewport-space painting:
- The paint loop writes the scroll offset it painted at into `--glass-sync` (per painted frame, past the idle gate) and the scroller's travel into `--glass-range`; the keyframes translate by `var(--glass-sync) − progress·range`, i.e. `painted − live` at any display moment — tiny in steady state.
- The canvas must then be GLASS-ONLY: `alpha: true`, no backdrop/plate pass drawn into it, and the rule that hid the DOM plate flipped back to visible — the plate is the layer UNDER the canvas, and a translated canvas drags anything painted into it. The shader keeps painting in plain viewport coordinates; no document-space rewrite is needed.
- Load-bearing details: the vars go on the CANVAS element (a per-frame write on the root invalidates style for the whole inheriting subtree); the publish happens only past the paint gate (the var claims the on-screen pixels correspond to that offset — writing it on a skipped frame translates the canvas against pixels that were never repainted); the range denominator is `scrollHeight − clientHeight`.
- Residual: the box position is exact; the backdrop the shader sampled is at most one paint interval stale (content freshness, not box lag).
- Proof: a CDP strip screencast while the main thread is blocked ~450ms with a wheel scroll mid-block — compositor-time evaluation shows the painted band tracking the DOM at its new position DURING the block. A screenshot cannot distinguish this: it forces a main-thread commit.

### The shader half (easy to get wrong)

A translated canvas breaks every shader that paints in viewport coordinates: the same panel would be offset once by `rect.top` and again by the transform. Once the canvas is scroll-locked, the shader must paint in **document space**:

```
// panel rect: document coordinates, not getBoundingClientRect().top
rectTopDoc   = rect.top + scrollY
viewCssDoc   = gl_FragCoord.y / u_dpr + scrollY      // backdrop sampling
screenPx     = rectTopDoc - scrollY                  // final NDC placement
```

The backdrop sampler must also read the plate at document coordinates, or the blurred background slides against the plate the DOM paints.

### Verifying the lock

1. **Lock error** — during a synthetic wheel scroll, record the canvas' `getBoundingClientRect().top` each frame and assert `|canvasTop + scrollY| == 0`. A constant nonzero value means the keyframe range is wrong; a growing value means the animation is not attached.
2. **Support check** — `CSS.supports('animation-timeline', 'scroll()')`. Chrome 115+ and Safari 26+; anything else must keep the read-time painting path. Gate with `@supports` in CSS, never a JS user-agent sniff.

### If you cannot ship the lock

Instrument instead of predicting. In the paint loop, record per frame `driftPx` (page advance observed between paints), `stalePx` (`|scrollY − lastPaintedScrollY|` at paint time) and `dtMs`; keep a 32-slot ring plus a running `maxStale` / `meanStale` / `staleFrames`, and a per-bin maximum in the report so the *when* is visible. Reset must seed `lastScrollY` from the current `window.scrollY` — zeroing it makes the first sample after a mid-page reset report the whole document offset as one giant stale step (a bogus 711 px reading that looks like a real regression).

## §Idle gate

Repainting a full-viewport canvas at 60 Hz while nothing moves costs more than the motion itself — measured `fpsStill 36` *below* `fpsScroll 52` on the same page `src: measured`. Repaint only when scroll position, draw-set membership, a panel's fade alpha, the buffer size, or the plate/theme changed; set a dirty flag from the tracking/teardown paths so a new panel cannot wait for the next scroll. Keep `resize` outside the gate (a re-alloc means the browser cleared the buffer, so it must force a repaint). Keep an infinite `animate-pulse` out of the frame — a single always-mounted pulsing icon is enough to keep the compositor permanently dirty. When the canvas animation and the shader doc-coordinate compensation are a PAIR, land both in one pass — the canvas translate without the compensation double-offsets every panel, and a half-applied pair is reverted, not shipped.

## §Viewport gate

An offscreen panel holding an inline `url()` chain burns a full filter-graph pass per scroll frame on invisible pixels (`src: measured`: one 1204×261 offscreen panel inside ~2M px of live urlArea, 13fps scroll vs 36fps still with no longtask overlap). An `IntersectionObserver` with a ~300px root margin parks on exit (guarded inline-chain clear + forget the change-detection key — no layout) and re-queues on entry; re-entry re-dresses from the map/filter cache-hit path (string ops, sub-frame, zero worker rebuild), and the margin attaches the bend before pixels turn visible, so resting in-view output is byte-identical — zero visual loss by construction. Three details decide correctness: the **flush-time rect check is authoritative**, not the IO entry state (IO timing can't be trusted at boot); a **dress-time guard** covers worker maps resolving while the panel scrolled offscreen (request posted in-view, message lands out-of-view — park, keep the cache); and `pruneDead` must **unobserve dead nodes** (observers hold strong refs, so a removed panel is retained until the next resync without it). **This is parking, not lazy-build scheduling**: no build is deferred, no rebuild storm is possible, the cache is never invalidated.

**Do not pair this with `content-visibility: auto` on glass cards — the intrinsic-size placeholder is a layout lie.** A skipped card reports the placeholder until its first render (the `auto` keyword only remembers real size after render), then the real height lands in ONE frame — measured `368px → 1248px`, a +880px shove of everything below, read as "the panels resize / jelly while scrolling" — and the layout-reading engine (canvas paint loop, measurement code) consumes the placeholder height for rects, painting the panel at the wrong size until render.

**Never cull a panel's `url()` graph to buy fps.** The graph *is* the rim and the bend; a blur-only fallback is a visible regression that gets reverted. Panels inside overlays, scroll clips or fixed ancestors fail the placeability test — do not leave them on bare `blur() saturate()`. The measured still-cost on that page was frame DRIVERS (an always-mounted infinite animation plus an un-gated full-viewport repaint loop), not the graphs: kill the driver, gate idle repaints on frame identity, then let the shader-rejected panel dress through the CSS engine like every other panel. If a genuine per-page raster budget forces a choice, present it to the user as a material trade — never cull silently. Rim-presence tell: the panel's computed `backdrop-filter` contains `url(` with live `filter[id^="lg-"]` nodes; a bare `blur()` reading means the dress was dropped.

## §Cost levers

- **Never animate a filter value.** Every frame re-rasterizes the backdrop.
- **Budget filtered area, not just filter count.** Cost scales with area × DPR²; each chained primitive allocates a full-res intermediate.
- **`drawImage(webglCanvas → 2D canvas)` is not a compositor path** on WebKit — a CPU readback costing tens of milliseconds per full-viewport copy. One canvas, many panels. → see references/safari-webkit.md §6.
- **Cache generated displacement maps on a *quantized* size, and cap the map's longest side.** An exact-pixel key multiplies the table on every tween frame — a hover pill changing width 5px per frame rebuilds an 80k-point pixel loop + PNG encode twice per frame, synchronously, before paint. Quantize the key (e.g. 8px grid), reuse the map across that bucket (the stretch is invisible at ~1px blur), and build the map at **1 map-px per CSS px, 1024px long side maximum**. The **Safari exception** is a conservative **512px map budget** for the SVG-content path; it is not a published universal hardware ceiling. Re-test large source graphics on the target device. The approved showcase deliberately keeps its original 2× supersampling for reference parity, not as the production default. Put the same quantized key on the per-element "did it change" check, or exact-vs-quantized mismatches silently rebuild every call.
- Production minification can silently delete the kill — see the inline-kill rule in → see references/measurement.md §Live audit.
- `.lg-strong` (displacement) belongs on modals/drawers/sidebars only; static cards use `.lg`. A page full of displacement-backed cards visibly janks on mid-tier laptops. → see references/css-scaffold.md §7.

## §Fixed-ladder engine — maps built once at boot, no scheduler

When the demand is *no difference between the reference lab and the live app*, one static, pre-baked map is a structural fail (→ see references/svg-filter-graph.md §3, Parity check 2). The first fix attempt was a per-panel runtime rebuild loop with worker pool, LRU cache, IntersectionObserver lazy builds and rAF-coalesced sweeps. That whole scheduler was itself the dominant failure family — worker error latch, sticky blob URLs, 120 ms debounce, rebuild storms, sweep coalescing on theme flips. The version that survived: **a fixed ladder built ONCE at boot**, every panel sharing a cached `<filter>`.

**Render contract — do not "simplify" any of these back:**
1. **Explicit filter region on `<filter>` (`x="0" y="0" width="100%" height="100%"`).** With the default region (`-10% -10% 120% 120%`), a percentage subregion on `feImage` resolves against the REGION, not the element box — the displacement and specular maps never paint where designed, and `feDisplacementMap` samples an empty map and shifts **every pixel by `scale/2` diagonally**: whole-panel displacement, no rim, sharp edges. Ship both: explicit region AND absolute-px feImage sizes.
2. **External file hrefs never load inside `backdrop-filter` chains** — only data URIs and `blob:` object URLs do. A static fallback filter pointing at `/lens-map.png` therefore silently fails on every `.glx` surface, and the failure masquerades as a uniform shift.
3. **No `feGaussianBlur` inside the SVG chain.** Blur lives in the CSS chain (`blur(B) saturate(S) url(#id)`, `url()` LAST) where it is GPU-composited; the SVG chain only displaces the already-soft backdrop.
4. **The engine covers EVERY glass family** — `.lens/.pane/.drop` AND `.glx/.glx-strong/.glx-dark`. A controller keyed on a subset leaves the majority of surfaces on whatever static fallback remains.
5. **Corner geometry MUST match what CSS paints.** Chromium serializes `corner-shape: superellipse(k)` as `|x|^n + |y|^n = 1` with `n = 2^k` (k=1 is the circle — there is no bare `corner-shape` support in most engines, so the map must degrade to the circle it actually paints). Map exponent and CSS exponent come from the same token (`--corner-exp`), and `mapCornerExp` returns k=1 when the browser doesn't honor `corner-shape`.
6. **Share ONE filter per unique signature.** Cards in a grid, rows, buttons — identical (kind, map bucket, W×H, dim-mode) share one graph + one decode. One private filter per panel is a duplicate-per-frame tax.
7. **Do not re-mint a filter mid-tween.** A width/scale grow animation fires ResizeObserver per frame; rebuilding per frame burns the main thread and pops the material. The ladder side-steps this: the map never rebuilds, only the `<filter>` re-keys when the (radius-bucket, aspect-class) pair actually changes.

**The ladder.**
- `RADIUS_RUNGS = [8, 14, 21, 28, 64, 9999]` — 9999 snaps to exact circle (pill/drop). An element whose radius is > 8px from its rung gets `data-lens-snap="<actual>-><rung>"` on itself so DevTools explains the snap.
- Aspect classes: `wide` (≥ 1.5:1), `tall`, `square`. Each gets a small canvas (256×160 / 160×256 / 200×200). Smooth gradient fields survive bilinear upscale exactly — flat-neutral interior, smooth ring ramp.
- 3 kinds × 6 rungs × 3 aspects = 54 map pairs, built once at boot on the main thread. Each is ≤ 220×130 imageData + a PNG dataURL encode — one frame's cost, total, forever.
- `FILTERS` cache keyed `kind|radius|aspect|WxH|dimBit|specOpacity|specSat|dim`. A panel whose bucket and size haven't changed is a WeakMap read, a Map hit, and one inline style write (only if the chain string changed).

**Perf contract.** No worker pool, no `mapWorker.ts`, no `IntersectionObserver` lazy builds, no 30/120 ms resize debounces, no rAF-coalesced sweep queue. The retry-on-failure and sticky-worker bug families are gone by construction, not by patch. `ResizeObserver` re-syncs only when the (radius, aspect) bucket key changes. `MutationObserver` on childList early-exits unless an added node matches the glass selector. `pruneDead` is one DOM pass; filters not referenced by any live element get removed; one querySelectorAll per dead candidate, not per filter. **NEVER introduce a `.lg-gpu` class that strips `url()` from the chain.** Round 4 did exactly that as a perf tier and the live app rendered no bending at all — fast because it rendered nothing.

**Test contract.** Static-system assertions ("filter #lens exists in index.html", "scale=… pinned") die with the static lookup. Replace with: utilities keep a plain-blur fallback AND no static family filters ship (zero external feImage hrefs anywhere in built HTML); the controller module exists and is mounted (`mountGlassEngine` in glassController.ts); `corner-shape` superellipse in CSS, `mapCornerExp` + `2^k` parameterization in mapMath, `--corner-exp` token shared; the engine owns the runtime `url()` hookup — a panel that claims blob/data URIs outside the engine files is a regression.

**Test-environment trap that mimics a product bug.** When 5+ suites fail that share only `localStorage` in a `beforeEach` (`Cannot read properties of undefined (reading 'removeItem')`), the cause is the runtime, not the product: Node ≥ 26 exposes a flag-gated experimental global `localStorage` whose getter resolves to `undefined` and shadows jsdom's. Shepherd it back in `src/test/setup.ts`: `Object.defineProperty(globalThis, 'localStorage', {value: window.localStorage ?? inMemoryFallback, configurable: true, writable: true})`. Confirm with a probe test. Do not "fix" green tests by weakening assertions.

## §Compositor scroll-sync lab — locking the fixed canvas at display time

**Symptom class:** *"The panels are behind"*, *"they get to their position late and stutter"*, *"the glass slides/bounces while you scroll"* — while FPS is fine.

Triage BEFORE touching anything, from a `?perf=1` report:
- `summary.avgFps` 60, `longTasks.count` 0, `worstMs` ≤ ~17 → the paint loop is not the bottleneck. Do not tune rAF work.
- `drift.maxStale` > 0 with `drift.staleFrames` > 0 → architectural gap: the canvas paints on the main-thread rAF clock while the DOM scrolls on the compositor clock. Between paints the glass can only be where it was last painted. No rAF-time correction can be exact — only the compositor knows the scroll position at display time.

Never reintroduce a display-time "lead" (painting at rect + estimated motion): any estimate overshoots, stutters on direction change, and reads as *"slides ahead then eases back"*. The compositor owns the correction.

**Mechanism.** A `scroll()` timeline translates the fixed canvas by *(painted − live)*:

```css
#glass-canvas {
  animation: glass-sync linear both;
  animation-timeline: scroll(root block);   /* the document scroller */
}
@keyframes glass-sync {
  from { transform: translateY(var(--glass-sync, 0px)); }
  to   { transform: translateY(calc(var(--glass-sync, 0px) - var(--glass-range, 0px))); }
}
@supports not (animation-timeline: scroll()) { #glass-canvas { animation: none; } }
```

The paint loop writes, per painted frame: `--glass-sync` = the scrollY it painted at; `--glass-range` = `scrollHeight − clientHeight`. At display time the compositor evaluates the keyframes against the live scroll position: `boxY = painted − live`, so pixels painted for offset *painted* land where the DOM *is*. Correct at any velocity including fling/momentum; a dropped paint is compensated on the next display update instead of parking the panel behind.

**Implementation contract (each item load-bearing):**
1. **Un-normalized range.** `scroll()` timeline progress is `0..1`; the translate needs the true range. Denominator: `scrollHeight − clientHeight` of the scroller (NOT `innerHeight` — a mismatch mis-scales every translate).
2. **Publish only past the paint gate.** The var is a claim: *"the pixels now on screen were painted for this scroll offset."* Writing it on a skipped/idle frame translates the canvas against pixels that were never repainted. Range publishes in the same block.
3. **Vars on the CANVAS element, never `:root`/`<html>`.** A per-frame custom-property write on the root invalidates style for the whole inheriting subtree; on the canvas it is scoped to the one animated element (`canvas.style.setProperty(...)`).
4. **The canvas becomes GLASS-ONLY.** `alpha: true`; no backdrop/plate pass drawn into it; every rule that hid the DOM plate (the webgl-path `::before { display: none }`) flips back to `display: block` — the plate is now the layer UNDER the canvas and must never translate. The shader still samples the plate texture for refraction.
5. **Drop any per-panel lead.** Draw raw `getBoundingClientRect()` rects — the compositor correction is exact; a lead would double-correct.
6. **Dual guard.** Controller: `CSS.supports('animation-timeline','scroll()')` gates all var writes. CSS: `@supports not (...)` disables the animation. Fallback engines keep the classic fixed canvas — all fixed-layer invariants unchanged (100lvh, DPR buffer, idle gate).
7. **Teardown resets module sync state**; the vars live inline on the canvas element and die with it.

Controller shape (inside the frame, past the idle gate):

```ts
if (SCROLL_SYNC_SUPPORTED) {
  const range = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
  if (range !== syncRange) { syncRange = range; canvas.style.setProperty('--glass-range', `${range}px`); }
  if (yNow !== syncPaintY) { syncPaintY = yNow; canvas.style.setProperty('--glass-sync', `${yNow}px`); }
}
```

**The drift metric changes meaning — update it in the same change.** `driftSample`'s `stale` used to mean "painted position vs now" (box lag). After sync the box tracks exactly, so the residual is CONTENT freshness: `stale = |scrollY − lastPaintY|` — page movement between paints while the older paint is still displayed. Update the perfRecorder docblock in the same change: a docblock still saying *"how far behind the glass was"* misleads the next field triage. What sync does NOT fix: the internal backdrop sample is still taken at paint time (bounded by that freshness number). The box is exact; the sampled content is at most one paint old and self-heals on the next paint.

**Proving it — the compositor lab that actually decides.** `page.screenshot()` is NOT evidence: it forces a main-thread commit, so even a main-thread-only animation reads consistent. The decisive probe is a CDP strip screencast (real compositor frames) taken while the main thread is BLOCKED and scroll moves:
1. Lab page: tall body; fixed canvas carrying the exact sync animation; a painted band at canvas row ~300; a DOM bar at document y ~1200; rAF writes `--glass-sync = scrollY` (mimics the controller).
2. Settle at scroll 900 → band and bar both read ~300 (identity holds at rest).
3. `Page.startScreencast` (jpeg), block the main thread ~450ms from `page.evaluate` (busy `while` loop), and `Input.dispatchMouseEvent` wheel ~130 mid-block.
4. Decode frames (Pillow): locate band rows and bar rows per frame. **Working:** mid-block the band tracks the bar's new position (the band ends up covering the bar — same rows). **Broken (main-thread-only):** the band freezes at its old row while the bar advances.

The lab canvas never repaints (only the var changes) — post-unblock frames therefore expose the stale bitmap (bar visible, band back at its painted row). That is the *"panels left behind"* state the sync prevents, not a sync failure; the decisive frames are the ones taken DURING the block.

App-side identity check: `canvas.getBoundingClientRect().top === paintedVar − window.scrollY`, sampled across wheel scroll (measured `maxErr 0.00px`). Caveats: at rest the transform is exactly 0 and the identity is trivially true; reading `getComputedStyle(canvas).transform` inside rAF during native wheel scroll can show 0/−0 because rAF does not tick every compositor scroll step. The mid-block screencast frame is what distinguishes working from not-working.

Post-change regression pass (real harness): swap attribute set, plate `::before` computed `display: block`, drawn panel count > 0, buffer ≥ viewport, panel fill/corners intact in a vision pass (no missing plate, doubled edges, or transparent holes), plus the existing gates.
