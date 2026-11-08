# Strategy picker

Purpose: choose the refraction path before tuning any token, and state its support floor.

Read when: a new glass surface, a "works in Chrome broken on iPhone" report, or any decision about whether a surface should be glass at all.
Skip if: the strategy is already chosen and you are tuning rim, dim, motion or perf — go to the matching reference.

Summary:
- Choose by source ownership: content `filter` distorts its own paint; SVG backdrop is conservatively Chromium-gated; the shipped WebGL2 path needs an explicit texture. No path captures arbitrary DOM by magic.
- Four paths: three refraction paths plus one universal `blur() saturate()` fallback that every browser keeps.
- `url()` goes LAST in the chain; `@supports` is a syntax probe, not a paint probe.
- Apple publishes no numeric spec. Glass belongs to the navigation/overlay layer, not the content layer.
- State the support floor in the handoff: an absent bend in Safari/Firefox is expected output, not a defect.

## §0 Before you pick: should this surface be glass?

**Liquid Glass is the navigation/overlay layer only. Never the content layer.** Tab bars, toolbars, sidebars, nav bars, sheets, popovers, and controls that float above content — yes. Lists, tables, cards, media and text areas stay on standard materials.

Apple's words (materials.md): "Don't use Liquid Glass in the content layer… including it in the content layer can result in unnecessary complexity and a confusing visual hierarchy." And: "Use Liquid Glass effects sparingly… overusing this material in multiple custom controls can provide a subpar user experience by distracting from that content."

The one exception: a control in the content layer with a *transient* interactive element — sliders and toggles — may take on the glass appearance when activated.

Apple publishes no blur radius, no compositing-layer cap, no refraction coefficient, no layer-count budget, no dim constant for the regular variant. Numbers that circulate, with honest provenance: blur max ~40px (iPhone) / ~60px (iPad/Mac) `src: community`; max ~4 compositing layers per screen `src: community`; Figma Glass `depth` ≤ 20, `frost` 10–25 (>30 reads as milky plastic) `src: figma`; 4.5:1 text contrast measured after blur — WCAG AA, not Apple. → see shared/references/15-honesty-and-checklists.md §Numbers that are NOT Apple's.

## §1 The decision

| # | Mechanism | Browsers that render | Use when |
|---|---|---|---|
| 1 | `filter: url(#f)` on the **content** | Chrome, Safari, Firefox | Use for deliberately filtering the element's own paint or a copied background; it can also distort text. |
| 2 | `backdrop-filter: url(#f)` | **Chromium only** | Element-level, nothing of your own to distort. |
| 3 | WebGL shader | WebGL2 for the shipped renderer | `<video>`/`<canvas>`, real Snell optics + chromatic dispersion, true Safari refraction. |
| 4 | `backdrop-filter: blur() saturate() brightness()` | Universal | The fallback every other path needs anyway. |

**How strategy 1 actually bends the backdrop.** A filter can only displace what the element PAINTS. If the page background is a `::before`/sibling outside the panel — the normal case, a plate or gradient layer on the shell — filtering the panel warps its own text and icons and leaves the background untouched. To refract the page background, the panel must paint its own copy of it, with `background-attachment: fixed` so the copy is positioned against the viewport rather than the panel; the same contour then enters one side and leaves the other, only displaced. Practical shape, three background layers top to bottom: tint fill, a knock-down wash of the page colour over the plate (the plate is an opaque image, so at full strength it erases translucency), then the viewport-fixed plate copy. Keep the displacement map neutral across the interior so panel content stays untouched.

Scope the lens to surfaces that float over the page background — popups, menus, notifications, command palette — and leave in-page cards unfiltered on purpose. A card over a scrolling list would have the background copy painted over the list it is supposed to be blurring. This is an honest limit: refraction is compositing a real background buffer, which the web cannot do. → see shared/references/03-dim-and-rim.md §Appendix for the map shape and the archived claim this mechanism came from.

## §2 Why strategy 2 is the trap

**Strategy 2 has no Safari or Firefox fallback — there is nothing to fall back *to*.** [WebKit 245510](https://bugs.webkit.org/show_bug.cgi?id=245510), open since 2022, still reproducing in a June 2026 repro: `backdrop-filter: url(#some-svg-filter)` silently renders nothing. Historical iOS reports here used WebKit; do not infer the current engine of every browser or region. Firefox parses the `url()` grammar and paints nothing too, so `@supports` returns true and lies.

Ship strategy 2 only when:
- the surface carries no live content of its own to distort;
- Safari/Firefox get blur-only and that is accepted (they always get the fallback);
- the handoff says "refraction is Chromium-138+-only" — expected output there, not a defect.

Strategy 1 can filter an owned/captured source, but it is not an arbitrary live-backdrop solution. The shipped WebGL2 route is the selectable texture-backed alternative on WebKit; video and live-DOM source handling are separate application work. → see shared/references/06-safari-webkit.md §1, §3.

**Known source conflict, flagged honestly:** an older field note claimed the opposite (`backdrop-filter: url()` is "Safari-only, dead in Chrome"). That claim contradicts WebKit 245510 and the later, device-measured repro. Treat *both* historical claims as suspect: verify on a real device before shipping either direction, and never let `@supports` be your evidence. → see shared/references/06-safari-webkit.md §7, shared/references/15-honesty-and-checklists.md §Conflicts kept visible.

## §3 Safari / Chromium / Firefox specifics

- Safari caches `<filter>` output by ID: replacing a `<filter>` under the same ID keeps rendering the old one. Mint a fresh ID on every update and update the `filter` value with it. Safari also has a source-graphic size ceiling above which it blocks or drops the effect. → see shared/references/06-safari-webkit.md §2
- Minification can delete the kill. A rule `{ backdrop-filter: none !important; -webkit-backdrop-filter: none !important }` gets deduped to ONE declaration, the survivor being the last one written. If `-webkit-` survives, Chromium ignores it and every drawn panel keeps blurring under your canvas. Apply the kill inline: `el.style.setProperty('backdrop-filter','none','important')` plus the `-webkit-` twin. → see shared/references/10-measurement.md §Live audit
- The same chain order applies in the shader path. → see shared/references/07-webgl-shader.md §Hybrid
- Firefox `-moz-element(#id)` paints any element as a live image in another element's background — glass can float over arbitrary page content it doesn't own. Align with `background-position` = source viewport offset − surface offset, rewritten rAF-coalesced on scroll. Point it at a **sibling**, never an ancestor (Gecko breaks the paint cycle on a cycle), and the source must not be a `background-attachment: fixed` element.
- Test strategy 1 in **Firefox** — if it only works in Chrome you shipped strategy 2 by accident.

## §4 The chain order law

```
blur → saturate → displacement (url) → dim → specular → DOM fill on top
```

- **`url()` goes LAST.** A blur placed *after* a `url()` filter erases the displacement: measured edge-vs-interior structure 1.8× (invisible) with blur after, 31× with the bend last (`src: measured`). This failure is silent and total — the refraction is not wrong, it is absent, and every token feeding it (displacement `scale`, map ramp width, filter region overscan) is inert. **Before tuning any mechanism that feeds a chain, measure whether the chain delivers it:** compare structure at the edge against the interior; if the ratio is near 1, fix the chain, not the input.
- `@supports (backdrop-filter: url('#x'))` is a **syntax probe, not a paint probe**. Engines that accept the syntax and fail to render an SVG reference inside `backdrop-filter` drop the *entire declaration* including the chained `blur()`. Keep the capability **purely additive**: every browser retains `blur() + saturate()`, and only a conservatively gated path adds the bend. The scaffold's canvas/SVG-content probe tests that content filter only; it does not prove SVG-backdrop painting. Verify the actual target with a browser pixel test. The showcase uses an explicit Chromium gate and a tested WebGL2 alternative.
- State the support floor in your handoff. "The rim twist doesn't show in Firefox" must be reported as expected output, not discovered as a defect.

## §5 Defaults and support floor

- New surface over live DOM → use verified live SVG backdrop if supported, or provide an explicit source for WebGL; otherwise retain fallback 4. Do not refract labels to simulate backdrop optics.
- Video/canvas backdrop, or true optics needed in Safari → strategy 3 + fallback 4.
- Element-level backdrop, no content to distort, Chromium-only acceptable → strategy 2 + fallback 4, with the support floor stated.
- Everything else → fallback 4. Frost is a legitimate result and ships everywhere.

Two claims stay apart in every handoff: the repo is correct, and the site is correct. They diverge for the whole deploy window. → see shared/references/15-honesty-and-checklists.md §Release discipline.
