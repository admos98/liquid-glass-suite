# Motion and origin

Purpose: open/close choreography for glass panels, trigger-origin measurement, the veil split, backdrop roots, and the arm-delay rule.

Read when: a panel opens from the wrong place, a ghost blur lingers after close, a hover light needs to move, or a blur dies mid-animation.
Skip if: the defect is a static material (→ dim-and-rim.md) or scroll lag (→ performance.md).

Summary:
- Measure the trigger origin synchronously in `useLayoutEffect` on the laid-out box; keep the last origin while closing.
- Never animate `opacity` on an element with `backdrop-filter` — the filtered layer freezes and can leave a ghost print.
- Split the veil: scrim fades, blur layer stays static and ramps to `blur(0px)` in ~120ms with the panel.
- An ancestor with `opacity < 1` kills a child's `backdrop-filter`; keep the positioning ancestor completely static.
- Entry 300ms easeOutQuint, close 280ms decelerate-into-trigger, no overshoot, stagger on open only.

## §Procedure: panel opens and closes toward its trigger

1. Give each popup a trigger ref (the button that opened it) and a panel ref.
2. Measure the origin **synchronously in `useLayoutEffect`**: `transformOrigin = triggerCenter - panelTopLeft`, in panel-local px. Never via `requestAnimationFrame` inside `useEffect` — a frame-late origin makes the panel start at the default origin and jump to the button centre, which reads as animation latency. Four measurement traps:
   - **Measure the laid-out box, not the animated one.** framer writes `initial: { scale: 0 }` inline during render, so by layout-effect time `getBoundingClientRect()` returns a box already collapsed toward the *previous* origin — up to half a panel-width of error. Save `el.style.transform`, set `'none'`, measure, restore — one synchronous block, never painted.
   - **Keep the last measured origin while closing.** `active` flipping false must early-return, not reset state: the exit still shrinks into the same button, and clearing the origin makes it collapse around the panel's own centre.
   - **A sibling with a different box needs its own origin.** The negative-inset `area-blur` halo maps the same viewport point to different local px — measure it too and deliver both origins as a returned tuple/state. Never write `el.style` from a ref passed as a hook argument (`react-hooks/immutability` rejects mutations of values derived from props or hook args).
   - **The trigger ref is often missing.** Optional `triggerRef` props are frequently never threaded by call sites; fall back to `document.activeElement` captured at open (guard `document.body` — it means "no real trigger"). A missing trigger silently leaves the default centre origin. **A popup with no measured origin must still grow from the trigger's side, not from a generic centre**: hard-coding `transformOrigin: 'top center'` makes that one surface fade-and-nudge while every sibling grows out of its button.
3. Entry: `opacity 0→1, scale 0→1`, 300ms, easeOutQuint `[0.22, 1, 0.36, 1]`; close mirrors: `scale 1→0`, 280ms, `cubic-bezier(0.4, 0, 0.2, 1)` — it must *decelerate into* the button, not slam at max speed. **Never overshoot curves** (control-point y > 1, e.g. `[0.25, 1.6, 0.45, 1]`): bounce reads as snap-back, not smoothness. A panel with no exit hard-cuts at unmount and looks broken.
4. The backdrop and blur halo ride the exit with the panel (§Veil split) so nothing pops when the DOM node disappears.
5. Stagger: acceptable on **open** (choreographed reveals, menus); never on **close** — staggered close reads as latency.

## §Timing budget

| Element | Open | Close |
|---|---|---|
| Popup panel (modal, drawer, notif, dropdown) | 300ms easeOutQuint `[0.22, 1, 0.36, 1]` | 280ms `cubic-bezier(0.4, 0, 0.2, 1)` — decelerates into the trigger |
| Hover-expand pill (avatar, search) | 300ms | 300ms |
| Choreographed menu/nav | may stay slower (400ms+) with stagger | 300ms, no stagger |

Scale anchor: 0 — with the origin pinned exactly to the button the panel grows out of nothing; a mid-scale start (0.72) reads as a shrink-snap once the origin is exact.

Latency/origin complaints about blur/panels are almost always (a) origin set a frame late, (b) `duration-500` left on a wrapper, (c) close stagger delays, (d) origin cleared at close or measured against framer's collapsed initial box, or (e) a hide-timer outlasting the exit — check those before touching easing curves.

**A child element's exit animation must fit inside its container's close budget.** A 0.5s morph inside a 0.22s menu close is still visibly reversing on an empty screen — "the menu closes faster than the shape returns". Shorten the child to the container's duration; keep the longer duration for the OPENING direction.

## §Veil split

- **Never animate `opacity` on an element that has `backdrop-filter`.** The filtered layer freezes on its last rendered frame, and that frozen frame can linger on screen after the element unmounts (the ghost "print" behind a closed panel).
- Split every veil: `.scrim` = colour/background only, safe to fade in and out (click-through should carry the panel's close handler). Blur layer = **static**, never opacity-animated. On exit, ramp the blur layer's `backdrop-filter` to `blur(0px)` (and unsaturate) over ~120ms so no stale frame survives — and the un-blur must finish *with* the panel's exit, not after it: any overlay hide-timer longer than the exit animation keeps blur alive after the panel is gone. Align hide-timers to the animation duration.
- Blur halos (`area-blur` ratio rings) **ride the panel's scale, anchored at their own measured origin** — a static halo renders full-size from frame one and reads as a yellowish glow patch hovering where the panel hasn't arrived yet. Scale is safe on `backdrop-filter`; opacity is not (frozen frame). On exit, ramp the halo's `backdrop-filter` to `blur(0)` alongside its scale.
- Click-catcher backdrops must carry the close `onClick` — a plain `fixed inset-0` div silently swallows clicks without closing.
- A material pass must not touch the motion contract: retuning fill/specular/blur is safe, but preserve the veil split and origin rules. → see references/css-scaffold.md §3.

## §RTL layout pitfalls

- `justify-end` under `dir="rtl"` docks blocks to the **left**. Never infer a panel's dock side from class names (`border-r`, `slide-in-from-right` lie) — measure `getBoundingClientRect().left` or check against a sibling.
- Pin an icon that must stay centered while its pill expands to the pill's **static edge** (the right edge in RTL, since pills grow leftward). Anchoring to the visual left makes it drift as width animates.
- Pill icon off-center in both axes is usually an unconstrained height (button `h-11` inside a pill with no fixed height, or `flex-shrink-0` wider than the content box), not an alignment bug: fix with a fixed pill height + `h-full` button and no shrink lock.

## §Companion geometry — a pill that comes out from behind its button

When a control expands (search pill, avatar name), never let the button element itself change width: the icon drifts and the report is "the button moved". Structure it as a rest-sized slot; a `pane` panel absolutely positioned with its near edge tucked ~14px UNDER the circle (`right-[14px]`/`left-[14px]`) and growing away from it; the circle as an `absolute`, later-in-DOM overlay pinned to the slot edge with a perfectly centered icon; the label at a FIXED offset from the panel's far edge so its reveal point stays put while the panel grows — the label then slides out from behind the circle instead of riding the growing edge. Hover never flickers even though the panel extends past the slot: the panel is a DOM descendant, so `mouseleave` on the slot does not fire while the pointer is on it.

## §Hover — the moving light

Standing user standard ("the normal hover state from now on"): hover/focus runs the body gradient's angle through one slow full circuit around the button (3s/turn, linear, infinite; size never changes); push turns the semantic tint up; transparent/ghost buttons materialize on the brand tint (faint at hover, stronger at press); a destructive control stays tinted glass of its own colour, never a flat fill.

- An unregistered custom property cannot animate — an `@keyframes` rule writing `--angle` snaps or silently does nothing. Register every moving part with `@property` (`'<angle>'`, `'<color>'`, `'<percentage>'`, `'<number>'`; `inherits: true`) so frames repaint and the tint cross-fades.
- Sweep exactly 360° from the material's rest angle (rest −55° → 305°): the end value ≡ start + 360, so the loop restart lands on the same frame.
- Park the circuit under `prefers-reduced-motion` **and** the app's own motion attribute — either preference must yield the static highlight. → see references/css-scaffold.md §6.
- A ghost resting at `background: none` cannot fade its material in: the background image itself is not transitionable. Keep the gradient always declared and scale its alpha with the registered sheen multiplier (rest 0 for the ghost, 1 for real glass); border, shadow and `backdrop-filter` then fade in through ordinary transitions.
- Press tint lives on `:active` at higher specificity than any variant class, so ONE rule bumps every variant; keep the resting mix in a `:root` token so the press delta stays a single comparison.
- Brand tints come from the brand doc, not the accent palette.
- The primary's WASH must beat untinted glass at rest in BOTH themes — screenshot each theme with a neutral sibling beside the primary; if the pair reads equal, primary gets its own mix step while every other variant keeps the house wash.
- A control whose feedback IS a shape/state morph opts out of the whole hover layer — the morph itself is the affordance.

## §Backdrop roots (headless-Chromium screenshot evidence)

A `backdrop-filter` samples everything painted behind the element **within its backdrop root**. An ancestor that creates a backdrop root leaves the child sampling near-empty content → the child renders **sharp**. No build error, no console warning — only visible in the render.

| Condition | Child `backdrop-filter` |
|---|---|
| Ancestor `opacity: 1` (static) | ✅ works |
| Ancestor `opacity < 1` — even `0.999`, even mid-animation (0.55) | ❌ broken (sharp) |
| Ancestor `transform: scale(1)` | ✅ works |
| Ancestor non-identity scale (static `scale(1.05)`) | ❌ one reading: sharp — never re-verified; treat as unsafe |
| Element's **own** opacity, animated fade in/out | ✅ works — blur persists through the fade |
| Element's **own** `scale()` open/close animation | ✅ works |
| Parent backdrop-filter + child ring with its own backdrop-filter | ✅ works — nested roots compose (double blur) |

Rules:
1. **Never animate `opacity` on an ancestor of a blur layer** — the blur dies for the whole animation; framer-motion leaves `opacity` inline after, and only an exact `1` is safe (`0.999` breaks it at rest).
2. **Animate the blur layer and the panel themselves**, not a shared wrapper — each carries its own fade/scale with its own `transformOrigin`.
3. **Keep the positioning ancestor completely static** — no opacity, no transform (identity transform is the only verified-safe ancestor transform).
4. **Double blur is the goal**: the panel's own `backdrop-filter` over an already-blurred halo compounds — glass panel + blurred region behind it.

**Area-blur halo recipe** (replaces whole-screen blur). User rule: overlay = light dim over the WHOLE screen, blur only in a region behind the panel. `fixed inset-0 backdrop-blur-sm` behind an overlay is rejected (blurs unrelated content and reads cheap). Full-screen backdrops use the `bgfx` veil utility (blur + scrim in one); the halo supplies the localized double blur behind the panel.

Ratio-sized halo (shipped): its extent derives from `--glass-h-ratio` via container-query units (`inset: calc(-1 * ratio * 100 * 1cqw)`), so geometry scales with panel width. Two hard constraints:
1. **The halo's positioning wrapper MUST be a size container** (`@container` class). Without it `1cqw` resolves against the viewport and the halo lands at the wrong size. Strip any fixed `-inset-*`/`rounded-*` classes off the halo element itself — the `area-blur` utility owns inset and border-radius.
2. **Halo transform-origin must use the same ratio pad.** When halo and panel share scale keyframes, the halo's `transformOrigin` shifts by the pad on both axes so they scale as one unit: `pad = panelWidth × ratio` (e.g. `320 × 0.17`). A stale hardcoded pad (±40px from the fixed-inset era) drifts the anchor and visibly detaches the animation — recompute it from the ratio.

```tsx
{/* static @container wrapper: positioning only — NO opacity/transform/animation */}
<div className="fixed @container" style={{ left, top, width }}>
  {/* halo: ratio inset + radius owned by area-blur; own animation synced to panel */}
  <div aria-hidden className="absolute area-blur"
       style={{ animation: openClose, transformOrigin: originShiftedByPad }} />
  {/* panel: keeps ref/id — outside-click logic keys off THIS element */}
  <div ref={panelRef} className="glx-strong rounded-2xl"
       style={{ animation: openClose, transformOrigin: origin }}>
    ...
  </div>
</div>
```

- Click-to-close still works with the panel-only ref: a click on the halo targets the halo (not inside panel ref) → the document `pointerdown` handler closes the overlay — no full-screen click-catcher needed. Never put the `id`/ref on the wrapper.
- The whole-screen layer keeps dim only: `bg-black/20`, NO `backdrop-blur` (field note v2 #6 superseded — blur moved into the halo).
- Verify with a striped backdrop behind the panel (plain screenshot): stripes must read smoothed behind the halo, not sharp. One check — if it fails, re-read the table above rather than widening the experiment.

## §Arm delay: a transform on the element warps the lens

`backdrop-filter: url(#f)` samples the backdrop in the **element's own coordinate space**, transformed along with the element. A panel that opens via `scale()` rescales the displacement map on every frame, so the bend stretches with the scale and reads as the panel smearing rather than as light bending. CSS has no screen-space anchor equivalent, and displacement scale is already a fraction of the element's own size, which amplifies the error.

- **A resting panel proves nothing about an animating one.**
- **Gate the effect on the transform settling, not on the mount.** Arm refraction only after the open finishes — arm time = open duration + longest stagger in the group + a small buffer — then fade the effect in over ~150–200ms so the switch is not a pop. The eye reads one gesture: the panel arrives, then light settles into it. The bend is never visible on a moving surface, so it cannot warp or pop.
- **Shortening the open is part of the fix.** Every ms added to the open is a ms the user waits before the material appears. Stagger only on open; the arm time belongs to the **slowest** element in the group, not the average.
- **A pill that animates its own width is the same case.** Bend it only while collapsed, or not at all.
- **Arm-only effects, cleared in the close handler.** An effect that both arms and resets on the open flag trips `set-state-in-effect`; let the effect only ever arm and clear the flag where the panel is dismissed, so reopening inside the settle window cannot inherit a stale flag. Clearing in the *open* handler as well stops a fast reopen from skipping the arm entirely.

**The arm-delay approach is the fallback — a CSS keyframe on the panel chain is better.** The same visual result is expressible as a keyframe ramping the filter's own alpha through the panel's own open timeline. That deletes the entire failure class: no state flag, no timer, no settle constant to keep in sync with the duration, and nothing for `set-state-in-effect` to reject. Reach for JS settle machinery only when you do not control the surface's animation chain.

Either way, encode the invariant as a **gate**: a check script whose job is to fail when the mechanism is wired in the wrong shape — unreferenced filter, flag with no surface carrying it, blur on a rim layer, use of the mechanism without being allowlisted with a review note. A gate's own success string describes the mechanism it enforces, so when its wording changes from "settle machinery" to "panel chains" that is a reliable report that the implementation moved. → see references/dim-and-rim.md §Arm delay.

## §Accessibility

Glass is where glass breaks contrast. `@media (prefers-reduced-transparency)` and `prefers-reduced-motion` need real handling, and text over a moving backdrop needs a scrim — measured contrast must hold at every scroll position, not at rest. People can pick a preferred Liquid Glass appearance in Settings and can turn on Reduce Transparency / Increase Contrast; standard components adapt automatically, custom elements, colours and animations do not. → see references/honesty-and-checklists.md §Accessibility, references/css-scaffold.md §6.
