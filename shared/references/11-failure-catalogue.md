# Failure catalogue

Purpose: map "it looks like X" to a cause, in diagnostic order. Exactly 33 numbered symptoms.

Read when: a user reports an appearance defect. Start from the symptom column, then run §Diagnostic order.
Skip if: you already know the mechanism and need its depth (→ the matching reference).

Summary:
- Most failures are structural (chain, geometry, nesting), not token values.
- Check chain order, wiring, filter region, then map checks — cheapest first.
- A defect in BOTH themes is structural; stop theorising per-theme.
- "Transparent, even the edges" means a zero-floored feather, not a low fill alpha.
- "It bends nothing" means a starved field. Measure the plate first.

## §Symptoms (S01–S33)

| # | Symptom (user words) | Most likely cause | First check |
|---|---|---|---|
| S01 | "Just blur, not liquid glass" | Missing refraction layers 1–3 (→ 02-css-scaffold.md §1) | Is there a live `url(` in computed `backdrop-filter`? Edge-vs-interior ratio near 1? |
| S02 | "feels like frosted plastic" | Blur after `url()` erasing displacement (→ 01-strategy-picker.md §4) | Is `url()` last? Reorder before tuning anything. |
| S03 | "It looks like a border" — also reported as "dirty border", "bad light border" | Blurred rim line (`filter: blur(0.5px)` on ring) — resolves as soft grey hairline | Remove blur from rim layer; melt belongs in mask / inset shadow (→ 03-dim-and-rim.md §Rim) |
| S04 | "It looks like a border" (light theme, white panel) | White rim on white fill: zero contrast by arithmetic, ceiling <12/255 | Composite delta sweep; add ink hairline + edge-dense radial field (→ 10-measurement.md §Material audit 3b) |
| S05 | "The shine is a static stripe" | Fixed-thickness top band, not size-relative rim | Replace with size-relative rim; `--eg-t` ratio-and-clamp thickness |
| S06 | "same on every panel" | `clamp()` percentage stops binding (86px for `3.6px / 4.2%`) | Do the division; never accept "size-relative" from the declaration (→ 10-measurement.md §Material audit 2) |
| S07 | "The shine should track my mouse" | Pointer flare missing | One delegated listener; check `--eg-flare` transition, not snapshot |
| S08 | "edge nearest cursor should brighten" | Listener not delegated, or boost snapped on | Distance ramp + eased boost in JS (→ 03-dim-and-rim.md §Pointer listener) |
| S09 | "The panel is basically transparent, even the edges" | Mask feather floors at 0, erasing fill at border | The word *even* = feather, not fill alpha. Floor at `--glass-fill-edge` (→ 03-dim-and-rim.md §Geometry faults) |
| S10 | "The lower part has no curve" — also reported as "top rounded, bottom square" | Rectangular child overflowing rounded parent | Cheapest check: does parent carry `overflow: hidden`? (→ 03-dim-and-rim.md §Geometry faults) |
| S11 | "The panel has a curve but the blur inside is not curved" | Filter region oversized → square map under curved rim | Region must be `x="0" y="0" width="100%" height="100%"`; widen map ramp |
| S12 | "Dark mode feels flat" | Fill alpha 0.5+ opaque; or resting drop shadow | Check opacity, then shadow, then law — in that order |
| S13 | "way too dark / practically black" | Wrong dim law (affine floor or flat multiply) | Check the value-weighted wash (→ 03-dim-and-rim.md §Dim law) |
| S14 | "It feels flat on the ground" | Dark fill over dark page, no luminance range | Measure plate range; deepen field first, then fill |
| S15 | "The rim is perfect but the panel lost its bend" | `url()` graph dropped (perf cull or engine path) | Computed `backdrop-filter` must contain `url(` + live `filter[id^="lg-"]` nodes |
| S16 | "Thickening it made it worse" | Hard-cutout mask (`content-box` + `exclude`): tokens decorative | Read the mask. Gradient mask, not tokens (→ 10-measurement.md §Material audit 1) |
| S17 | "still lines, now thicker" | Same hard-cutout mask | Read the mask; a ring cannot fade inward |
| S18 | "It got flatter after that change" | Mask broken + shadow removed together; or layer deleted that carried bend | Diff single file vs pre-commit revision |
| S19 | "Something is off and I can't name it" | Starved field: no luminance structure behind panel | Plate range ±5/255 = starved. Field first, then fill |
| S20 | "A line blurred behind the panels" | Transmitted backdrop content, not painted line | Scan screenshot for long horizontal runs; prove absence first |
| S21 | "The logo is not there" | Per-theme token flip inverted colour-math filter | Re-check invert/sepia/hue-rotate against token value per theme |
| S22 | "just a circle" | Same per-theme token flip | Same check; keep the pre-derivation raw computed value (→ 06-safari-webkit.md §5) |
| S23 | "The menu closes faster than the shape returns" | Child exit (0.5s morph) exceeds container close budget (0.22s) | Child must finish inside container duration (→ 09-motion.md §Timing budget) |
| S24 | Ghost / lingering blur after close | Opacity animated on `backdrop-filter` element — frozen frame | Split veil: scrim fades, blur ramps to `blur(0px)` in ~120ms |
| S25 | Panels seem to resize/jelly while scrolling | `content-visibility: auto` placeholder lie (368px→1248px) | Remove containment on glass cards (→ 08-performance.md §Viewport gate) |
| S26 | Panels lag behind scroll ("panels are behind") | Fixed canvas on rAF clock vs compositor DOM scroll (37px stale) | Compositor scroll lock; never restore display-time lead |
| S27 | "The mouse is a flashlight" | Edge falloff sized % of panel (~270px glow on 1243px panel) | Size in px against rim token; ≥8px ramp is a glow |
| S28 | "A white blurred stripe top to bottom" | Diagonal glint band crossing mid-body | Delete the layer; do not tune it |
| S29 | "Washed out panel" | Nested glass: fills stack `0.62 + 0.62 ≈ 0.86` opaque milk | One-selector de-nest; real glass does not refract inside itself (→ 02-css-scaffold.md §5) |
| S30 | "Works in Chrome, broken on iPhone" | Strategy 2 (`backdrop-filter: url()`) — WebKit 245510 | Use strategy 1 or WebGL (→ 01-strategy-picker.md §2, 06-safari-webkit.md §1) |
| S31 | "Refraction isn't showing" | Chain order wrong (blur after url) or map alpha 0 | `url()` last; alpha 255; final step not outputting map |
| S32 | "The bend is not curved" | Square map / oversized region | → 05-chromium-quirks.md §4; region arithmetic |
| S33 | "The rim and the panel corner disagree" | Map authored on `superellipse(3)` while CSS paints arc | Map geometry must mirror painted curve (→ 02-css-scaffold.md §4) |

## §Diagnostic order

1. **Chain order** — is `url()` last? (→ 01-strategy-picker.md §4) Cheapest experiment, order of magnitude of difference.
2. **Is the filter even referenced?** `grep -rn 'backdrop-filter[^;]*url(' src` and `grep -rn 'id="lg-…' src`. An `feDisplacementMap` no `backdrop-filter` references is dead weight in a convincing costume.
3. **Filter region** — `x="0" y="0" width="100%" height="100%"`?
4. **Map checks** — neutral centre `(128,128)`, alpha never 0, per-edge peak ≥90% of declared `scale/2`, L/R skew <10%. Run `shared/scripts/measure-displacement-map.py` (fixture: `tests/fixtures/lens-map.png`).
5. **White-on-white ceiling** — sweep before tuning (→ 10-measurement.md §Material audit 3b).
6. **Defect in BOTH themes = structural.** Stop theorising per-theme; one shared mechanism explains both. Do not declare one theme "correct" from the other's screenshot.
7. **"Transparent, even the edges"** (the word *even*) → the feather floors at 0 and erases the fill at the border, not a low fill alpha.
8. **"The panel has a curve but something inside it does not"** → a child overflowing a rounded parent. Check children before the parent's own geometry. Cheapest check: does the shell already carry `overflow: hidden`?
9. **"It bends nothing"** → the field is starved (plate luminance range ±5/255). Measure the plate before touching any glass token. Field first, then fill.
10. **"A line behind the panels"** → transmitted backdrop content, not a painted line. Prove absence first (scan for long horizontal runs).
11. **"The logo is not there"** → a per-theme token flip inverted a colour-matching filter (invert/sepia/hue-rotate). Re-check every colour-math filter against the token's value in that theme block.
12. **A defect present at rest that vanishes under scroll** (or vice versa) → cadence, not cost (→ 08-performance.md §Diagnose first).

## §Numbers that decide

- Edge-vs-interior structure ratio: ~31× bend-last vs 1.8× blur-after `src: measured`.
- Rim ramp: 2–5px correct; ≥8px is a glow `src: measured` (fixture: `tests/fixtures/rim-swatch.png`).
- White-on-white ceiling: below ~12/255 = unsolvable by value `src: measured`.
- Fill: Apple chrome ~15–30%, text-bearing glass ~0.4–0.7 alpha `src: community`.
- Chroma retention: target ~60–75%, below ~40% is putty `src: measured` (fixture: `tests/fixtures/chroma-retention.txt`).

Tag every number per → shared/references/15-honesty-and-checklists.md §Source tags. Never quote a heuristic as "Apple's spec".
