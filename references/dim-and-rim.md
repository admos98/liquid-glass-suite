# Dim and rim

Purpose: the dim law, the edge-light rim, its pointer light, the three geometry faults, and the refraction worked examples.

Read when: a "plastic", "static stripe", "white-on-white", "even the edges", "bend is not curved" or "rim lost" report.
Skip if: you need the strategy decision (→ strategy-picker.md), a symptom lookup (→ failure-catalogue.md), or raw measurement arithmetic (→ measurement.md).

Summary:
- **Mode boundary:** these production-wash and painted-edge notes are not the faithful showcase's historical linear-dim/specular-map graph. Preserve the reference in `references/showcase.md` when matching it.
- Dim is a value-weighted wash `out = x + d·(x/255)·(tint − x)`; black stays black; clamp `d ∈ [0, 0.5]`.
- The dim must transmit: `saturate()` in every dimmed chain; chroma retention ~60–75%, below ~40% is putty.
- A rim paints light, it does not bend light. The rim never blurs; a ring cannot fade inward.
- Three geometry faults: oversized filter region, a mask that floors at 0, an unclipped rectangular child.
- Size edge effects in px against the rim token. A rim is 2–5px; ≥8px is a glow.

## §Dim law

Three laws, 255-scale, tint = slate 33 `src: measured`:

| Input | affine 0.1 | flat multiply 0.35 | wash 0.35 |
|---|---|---|---|
| 0 | +10 … +16 (lifted) | 0 | 0 |
| 64 | 61 | 55 | 59 |
| 128 | 122 | 89 | 111 |
| 224 | 214 | 165 | 165 |
| 255 | 244 | 177 | 177 |

The wash keeps the multiply's highlight compression while leaving mids near their value — the gap at 128 is "tinted dark glass" vs "practically black". `out = in + b·(in/255)·(tint − in)`: the weight `in/255` makes black a fixed point with no additive term. `d(out)/d(in) = 1 + b·(tint − 2·in)/255` is non-negative over `in ∈ [0,255]` when `b ≤ 255/(510 − tint)`; `b ≤ 0.5` is a safe clamp that also prevents highlight inversion. `feFunc type="table"` at 33 samples: worst-case error below 0.1/255 (two orders under the 2/255 LSB), ~600 B markup vs ~4 KB at 256 samples.

`b` is per-material: body panels `0.12` light / `0.14` dark, floating menus `0.35` light / `0.32` dark `src: measured`; menus need more because readability over scrolling content is the point. Aesthetic choices, not Apple numbers. The only published constant is the clear variant's 35% dark dimming layer over bright media; copying it to regular panels gives grey slabs. → see references/honesty-and-checklists.md §Numbers that are Apple's. Tint: light `31 29 41`, dark navy `16 15 28` (not black; black flattens dimmed whites). Keep the filter-law token equal to the lite/off-tier fill token per theme; pin equality in a test.

Guards: black fixed at every `b`/tint; `b ∈ [0, 0.5]` with non-decreasing curve at clamp; tint channel order survives wash on pure white; both production-wash paths call the same function (`feFunc type="linear"` or a flat multiply is not this curve). The explicitly named reference-linear showcase is exempt; do not remove its preserved ratios or intercepts. **The dim must transmit, not paint:** `saturate()` in every dimmed chain, chroma retention ~60–75% target, below ~40% putty `src: measured`; sweep `scripts/chroma-retention.py` before token edits. Values tuned under one law do not transfer — re-derive per theme at a named anchor, state anchor + both values. → see references/measurement.md §Chroma retention.

## §Rim: four properties

1. **Thickness is size-relative.** `--eg-t: clamp(var(--glass-edge-min), var(--glass-edge-t), var(--glass-edge-max))`; percentage resolves against inline size, clamp bounds are the real control. Light `clamp(1.5px, 4.2%, 3.6px)`, dark `clamp(1.25px, 3.1%, 2.6px)`. "A tiny bit thicker" needs percentage AND ceiling moved (small panels sit on the floor). The percentage stops binding at `width > ceiling ÷ percent` (86px for `3.6px / 4.2%`). → see references/measurement.md §Material audit 2.
2. **All four edges, weighted.** Light from above: `base` 0%, `base * 0.5` 52%, `base * 0.28` 100%. A flat ring reads as a border.
3. **The pointer flare selects its own edge.** A pointer-centred radial gradient, masked inside the ring, peaks on the nearest edge and falls off by real distance. No per-edge CSS.
4. **Separate pseudo-element layer.** The ring lives in `::before`: `backdrop-filter` carriers are never animated and never gain a pseudo-element.

The ring CSS (radial pointer flare + weighted linear base, content-box mask, `-webkit-mask-composite: xor` / `mask-composite: exclude`) is canonical in → see references/css-scaffold.md §1 (Layer 2b). The content-box mask follows `border-radius`; without `mask-composite: exclude` the two mask layers cancel and nothing paints.

**A blurred rim line is the top cause of "it looks like a border":** even `filter: blur(0.5px)` resolves as a soft grey hairline, and raising alpha only makes a fatter grey line. **The rim never blurs.** Melting the inner edge is a separate job: top-centre radial highlight in the same pseudo-element (`radial-gradient(140% 90% at 50% 0%, …)`), plus an inset shadow carrying glow inward (`inset 0 1px 0 …` hairline + wide soft inset) — the inward fade a `mask-composite` ring cannot produce. → see references/measurement.md §Material audit 1. Falloff per theme: `--glass-edge-mid-f: 0.32; --glass-edge-bot-f: 0.17;` light, overridden upward in dark; top spike 0.9 against low side/bottom factors. Dials in order: two falloff factors, then top spike. Pin `expect(css).not.toMatch(/filter:\s*blur\(0\.5px\)/)` plus exact token values. Specular is a lit edge, not a drawn line — a `background` layer that composites with the fill, applied identically to every specular recipe. → see references/css-scaffold.md §1. White-on-white is unsolvable by value: sweep the ceiling first. → see references/measurement.md §Material audit 3b.

## §Tokens (light hard, dark soft)

| token | light | dark | role |
|---|---|---|---|
| `--glass-edge-base` | 0.5 | 0.26 | resting rim strength |
| `--glass-edge-hot` | 0.55 | 0.3 | extra at the pointer's edge |
| `--glass-edge-spread` | 38% | 72% | falloff radius; dark spreads into a slow sheen |
| `--glass-edge-t` | 4.2% | 3.1% | thickness, % of inline size |
| `--glass-edge-min/max` | 1.5/3.6px | 1.25/2.6px | clamp bounds |
| `--glass-edge-color` | `255 255 255` | — | rim colour |

## §Pointer listener — one delegated listener, not one per surface

Attach **one** `document` listener; write only `--eg-x`, `--eg-y` (pointer %), `--eg-boost` (0 away → 1 near) on the element under the cursor. Constants: `RIM='.glass-edge'`, `EPSILON=0.5` (jitter px reuses last position), `NEAR=0.7`, `REACH=1.1` (half-diagonal fractions), `EASE=0.18` (per-frame lerp); target `clamp(1 - (d / half - NEAR) / (REACH - NEAR))`. Skip non-mouse pointers; bail when `|x−lastX|` and `|y−lastY|` are both under EPSILON.

Non-negotiables: no React state / re-render, only custom properties; distance ramp, not binary hit test; ease boost in JS, never CSS `transition`; drop the previous panel to 0 immediately on change; mouse only; gate on the project's motion preference; clean up `--eg-boost` on unmount. `assets/liquid-glass.js` implements this in vanilla JS.

## §Pseudo-element collisions

One element has **one** `::before`; grep every owner and every conditional reference to an old selector before moving a decorative layer. → see references/css-scaffold.md §5 (canonical rule + the three conditional blocks). Never set `position: relative` inside a custom `@utility`: it overrides `fixed` on call sites. → see references/tailwind-v4.md §Cascade traps.

## §Apply at shared primitives

Apply at shared primitives, count surfaces, and never call an unapplied mechanism done. → see references/honesty-and-checklists.md §Working rules (full rule: shared `Card`/`Modal`/`Drawer`/`Dropdown`/`EmptyState`/command palette, `grep -rn "glass-edge" src --include="*.tsx"`, no push for review while unapplied, hard-reload CSS, real motion-preference context).

## §Geometry faults (check before tuning any token)

**1. Oversized filter region turns the lens into a square.** Use `<filter id="lg-lens" x="0" y="0" width="100%" height="100%">`, not `x="-20%" … width="140%"`. The bend is computed across the whole region while only the rounded intersection paints: straight-edged blur under a curved rim — *"the blur inside is not curved"*. Oversizing is usually deliberate to stop the strongest pull clipping; fix by **widening the ramp in the map**, never by enlarging the region (raising `scale` makes square edges more visible). Chain order is the cheaper first experiment. → see references/strategy-picker.md §4.

**2. A mask that floors at zero erases the fill at the border.** The four-sided feather `linear-gradient(to right, #0000 0, #000 var(--ff), #000 calc(100% - var(--ff)), #0000 100%)` (twice, `mask-composite: intersect`) is a correct ramp and a wrong fill mask: the outermost `--ff` (7–10px) of fill is removed on all sides → *"basically transparent, even the edges"*. **The word "even" is the diagnostic**: low fill alpha weakens the whole panel; a floored mask weakens only the border. Use `--glass-fill-edge: 0.5` (not 0), `rgb(0 0 0 / var(--glass-fill-edge))` at both ends. A variant with `mask: none` does not see the floor — confirm which surfaces it lands on. → see references/css-scaffold.md §5.

**3. An unclipped rectangular child paints square corners over the panel's curve.** *"The lower part has no curve"* / *"top rounded, bottom square"* is a footer, header bar or inset well. A rounded panel does not clip children; every parent property measures correct, which is what makes this expensive. Fix `.panel-shell { overflow: hidden; }`. Elimination order, cheapest first: ring mask → filter region → lens map → parent radius → **children**. Fastest check: does the shell already carry `overflow: hidden`? (`grep -rn "overflow-hidden" src/components`; `grep -rn "glass-edge\|glx-strong" src/components | grep -c rounded`.) Verify the clip cannot trap anything portalled to `body`; apply to **every branch** of a shell.

**Isolated-probe corollary.** Marker-ring setup, the two ways the probe lies, and the zero-hit control: → see references/measurement.md §Isolated probe.

**A ring cannot fade inward.** `mask-composite: exclude` confines gradients to the `padding` band; a ring has no interior, so alpha is effectively constant (`0.5 → 0.496` on a 1,376px hero `src: measured`). No alpha, gradient direction or pointer flare produces an inward falloff inside a ring. Traps: mask stops are PERCENTAGES, not px — `calc(var(--eg-t) * .85)` is a ~0.6px length used as a percentage, so the fade completes across the top 0.6% of the panel; one `to bottom` gradient feathers one edge and leaves three at full alpha. Correct three-part edge: sub-pixel outer line (ring), a band varying across its own width, an inset shadow carrying glow inward (`inset 0 Npx Mpx rgb(var(--glass-edge-color) / a)`). → see references/measurement.md §Material audit 1.

## §Which surfaces get the rim

**Rim** padded panels, cards, modals, drawers, dropdowns, popovers, large rows (`p-4` up, visible radius). **Never rim** badges, status pills, mono chips, `glx-inset` rows, inputs, icon buttons. N matches in one file is usually one panel in a `.map()` — rim all of them.

## §Arm delay

A transform on the element warps the lens. Arm after settle (~150–200ms fade), or better, ramp the filter's own alpha with a CSS keyframe on the panel chain. Full rule and gate invariant: → see references/motion.md §Arm delay. Gates green is a compile fact; whether arm-then-fade reads as a bend needs the user's eyes. → see references/honesty-and-checklists.md §Integrity rules.

## Appendix — worked examples

**A painted rim cannot refract.** The ring adds constant light and never reads the backdrop. The bend is displacement: two direction channels, 50% grey neutral, flat interior shoulder, defined field, arm-after-transform. Dispersion is a further step. When a user describes a material property rather than a token, ask for a reference screenshot — rim strength, fade width and bend magnitude are numbers they hold. → see references/css-scaffold.md §1.

**A grayscale displacement map is not a lens.** `feDisplacementMap` reads R for X, G for Y. Grayscale means R = G: every pixel shifts along one diagonal, pinching corners instead of bending edges. Build a horizontal and a vertical gradient, reduce each to one channel with `feColorMatrix`, add with `feComposite`. Neutral must be 50% grey, not white: displacement is `scale × (R − 0.5)`; with `primitiveUnits="objectBoundingBox"`, `scale="14"` in a white-centred map shifts the interior by **7× the element's width**. Workable shape: an 18% flat shoulder per direction (glass edge thickness); outside it the shift ramps hard, inside it the pane is flat. Keep `scale` under ~0.3 — past that the image shatters. Fraction-of-own-size lets one filter serve a 40px button and a 700px panel.

**Chromatic dispersion in SVG.** Split into channels, displace each by a different scale, recombine — the delta between scales IS the dispersion. The three `feColorMatrix` + three `feDisplacementMap` (`26/18/10`) + two `feBlend mode="screen"` snippet, plus its three costs (triples per-panel work, per-channel `feColorMatrix` drops alpha handling, `screen` is an approximation) and the small-ratio rule (26/18/10, not 26/18/4 — a large split reads as a fringe glitch), is canonical in → see references/svg-filter-graph.md §1 (Dispersion). Shader equivalent: per-channel IOR → see references/webgl-shader.md §GLSL core.

**Chrome-viable path.** `filter: url(#f)` bends what the element paints; a viewport-fixed plate copy is required for the page background. → see references/strategy-picker.md §1. Archived "Safari-only" claim flagged, not adopted → see references/safari-webkit.md §7. `@supports` nested inside `@utility` → see references/tailwind-v4.md §Cascade traps.

**Refraction needs something to refract.** Over a solid colour or ~1% radial tint a correct lens reads as a slightly warm card. The page needs defined shapes — rings, discs, bands, a contour plate with real edges and enough alpha to survive the wash — positioned so panels overlap them. Filter and field land together or the effect is invisible. → see references/measurement.md §Material audit 4.

**A scripted class edit can invent a class that never existed.** Bulk `str.replace` on class strings mangles neighbours: replacing `glx ` produced `glass-edge-strong` on one hero, a class defined nowhere, so Tailwind emitted no rule and that panel had no effect — build and tests stayed green. After any scripted multi-site edit, diff every `glass-*` class used in markup against every one defined in CSS; used-but-undefined is a silent no-op. Check it in the same pass that counts surfaces.

**Remaining pointers.** BUILT CSS (`:before` / `::before`) → see references/measurement.md §Minifier traps. Wiring greps → see references/failure-catalogue.md §Diagnostic order. A glint crossing mid-body is a defect: delete it → see references/failure-catalogue.md §Symptoms S28.
