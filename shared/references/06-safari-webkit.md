# Safari and WebKit

Purpose: the engine wall, the device-measured iOS field reports, and the two source claims that contradict each other.

Read when: a report names Safari, iOS, iPhone, WebKit, or "works in Chrome broken on iPhone".
Skip if: the defect is Chromium-only (→ 05-chromium-quirks.md) or you are picking a strategy (→ 01-strategy-picker.md).

Summary:
- `backdrop-filter: url(#f)` silently renders nothing in WebKit (bug 245510) and paints nothing in Firefox; `@supports` returns true and lies.
- Three paths in Safari: bend live DOM with `filter: url(#f)`; bend the backdrop with WebGL only; `backdrop-filter: url(#f)` has no fallback.
- Safari caches `<filter>` output by ID → mint a fresh ID on every update.
- A CSS-animation-promoted child drops out of an ancestor's `filter: url()`; `will-change: transform` alone is enough.
- Pin long-lived fixed layers to `height: 100lvh`; `drawImage(webgl→2D)` is a CPU readback on WebKit.

## §1 The headline bug

[WebKit 245510](https://bugs.webkit.org/show_bug.cgi?id=245510), open since 2022, still reproducing as of a June 2026 repro: `backdrop-filter: url(#some-svg-filter)` silently renders nothing. Every iOS browser is WebKit. Firefox parses the `url()` grammar and paints nothing too, so `@supports` returns true and lies.

| What you want | Path |
|---|---|
| Bend live DOM content | `filter: url(#f)` on the content (strategy 1) — works |
| Bend the backdrop | WebGL shader only (strategy 3) — the *only* true refraction in Safari |
| `backdrop-filter: url(#f)` | renders nothing — no fallback exists, because there is nothing to fall back *to* |

State this as expected output in the handoff; do not "discover" the missing bend after shipping. → see shared/references/01-strategy-picker.md §2.

## §2 Safari caches `<filter>` output by ID

Replacing a `<filter>` element under the same ID keeps rendering the old one, so a dynamically generated map freezes mid-motion. **Mint a fresh ID on every update** and update the `filter` value with it. Safari also has a source-graphic size ceiling above which it blocks or drops the effect. → see shared/references/05-chromium-quirks.md §3 (Chromium does the same); `shared/assets/liquid-glass.js` mints a fresh ID.

## §3 `filter: url()` on `<video>` is refused

WebKit refuses to filter video. For any `<video>`/`<canvas>` backdrop, strategy 3 (WebGL) is required. → see shared/references/07-webgl-shader.md §When.

## §4 A promoted child drops out of an ancestor's SVG filter

`src: measured` — iPhone, iOS 26.6 Safari, WebKit, DPR 3, read live on-device. A promoted element gets its own compositing layer and drops out of an ancestor's `filter: url()`, so it floats above the glass sharp and unrefracted while its siblings bend:

| How the child is animated | Renders | Why |
|---|---|---|
| no transform (control) | **bent** | ordinary paint, inside the filter |
| script-set `transform`, resting | **bent** | a style change, no layer |
| rAF-driven `transform` | **bent** | script-set each frame, no CSS animation layer |
| `@keyframes` on `transform` | **sharp** | animation promotes a layer |
| `transition: transform` | **sharp** | promotes identically — the common case is a pill that slides |
| `will-change: transform`, not animating | **sharp** | the declaration alone is enough |
| actively redrawn `<canvas>` | bent | own surface, not a CSS-animation layer |

Fix for a moving child: a **rAF-driven `transform`**. Two corrections to the widely-repeated version: **`will-change: transform` is not a safe no-op** — setting it without animating already buys the exclusion, so remove it when you want the child to refract. And an actively-redrawn canvas does *not* escape the filter this way; if a canvas must stay sharp, keep it out of the filtered subtree.

## §5 A computed custom property can arrive CSS-escaped

`src: measured` — iPhone, iOS 26.6 Safari. iOS serializes `getComputedStyle().getPropertyValue('--page-plate')` **with CSS escapes applied** — `url(/plates/grid-light\.svg)` — and taken verbatim the backslash makes the WHATWG URL parser resolve a mangled path, so every request (SVG via `<img>`, raster twin via `<img>`, `fetch→createImageBitmap`) dies before the network while the file itself is fine. **Decode CSS escapes (css-syntax-3 §4.3.7) before using any computed custom property as a URL; verify decoding is byte-identical no-op on clean input** (all desktop engines). The decisive diagnostic: a minimal lab page on the same device/engine decoded the same file through `new Image()` — the file was fine, so the input string was the suspect. Instrument the raw computed value and the escaped-flag in your telemetry, and never let a failure report only the *derived* URL — keep the pre-derivation raw string so the corruption point is provable.

## §6 Fixed layers, iOS 26 and the OS-material claims

`src: measured` — iPhone iOS 26 field report "the background moves on scroll"; WebKit #297779 (fixed elements shift during scroll; fixed in 26.1) and #261185 (dvh/svh re-measure on tab-bar collapse). While the URL bar collapses, the fixed layer's height changes, `background-size: cover` re-scales the crop and the art slides; a `height: 100%` canvas re-sizes its buffer, forcing re-alloc + redraw every frame. **Fix: pin long-lived fixed background layers (plate, canvas) to `height: 100lvh`** — the large viewport is constant, so nothing re-scales; the extra height sits under the collapsed bar. Ship `height: 100%` first, then `height: 100lvh`, so engines without `lvh` keep the old stretch behaviour.

iOS performance traps:
- `drawImage(webglCanvas → 2D canvas)` is **not a compositor path** on WebKit — a CPU readback costing tens of milliseconds per full-viewport copy. One canvas, many panels. → see shared/references/08-performance.md §Cost levers.
- Never pair a shader canvas with `content-visibility: auto` on glass cards — the intrinsic-size placeholder is a layout lie. → see shared/references/08-performance.md §Viewport gate.
- Large SVG-filtered source graphics can fail on WebKit. Use a conservative ≤512px **map** budget and an 8px-grid cache key on that path, but do not mistake map dimensions for the filtered source-graphic size or claim a universal 512px engine limit. The general production map cap is 1024px; Safari is the conservative exception. Verify on device. → see shared/references/08-performance.md §Cost levers.

**Two source claims about the OS material, kept side by side.** Source `01-spec-and-rules` says Safari/iOS 26 can use the real OS material from the web, gated by `@supports (backdrop-filter: -apple-system-glass-material)`:

```css
border-radius: 20px;
border: 1px solid rgba(255, 255, 255, 0.15);
-webkit-appearance: none;
-webkit-backdrop-filter: -apple-system-glass-material;
backdrop-filter: -apple-system-glass-material;
```

Source `04-squircles` calls `-apple-visual-effect: -apple-system-glass-material` a dead end: it does not work on the open web, nor by default in a `WKWebView` (it needs the private `useSystemAppearance` toggle in `WKPreferences`, which means giving up App Store review). **These conflict.** Treat the first as unverified; gate it, keep `blur() + saturate()` as the base, and verify on a real device before claiming the OS material ships. → see shared/references/15-honesty-and-checklists.md §Conflicts kept visible.

## §7 Known source conflict, flagged honestly

An older note in source `03-dim-and-rim.md` ("`backdrop-filter: url(#f)` is SAFARI-ONLY — in Chrome it silently does nothing", with "Firefox deletes the SVG reference itself") claimed the opposite direction from WebKit 245510 and the later, device-measured repro. Its mechanism notes are kept in → see shared/references/01-strategy-picker.md §1 and shared/references/03-dim-and-rim.md §Appendix. Its support claim is **not** adopted: treat *both* historical claims as suspect, verify on a real device before shipping either direction, and never let `@supports` be your evidence. Where this skill states a direction, it is backed by the open WebKit bug and the June 2026 repro, not by either archived note. → see shared/references/15-honesty-and-checklists.md §Conflicts kept visible.
