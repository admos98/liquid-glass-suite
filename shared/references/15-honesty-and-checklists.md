# Honesty and checklists

Purpose: provenance tags, what Apple actually publishes, the ship/verification checklists, and the working and release rules that do not belong to a mechanism file.

Read when: quoting a number in a handoff, shipping a material pass, answering a report, or running the verification checklist.
Skip if: you need a specific mechanism (→ the matching reference).

Summary:
- Apple publishes no numeric Liquid Glass spec. Tag every number `src: apple-hig | community | figma | measured`.
- The only published dim number is the clear variant's 35% dark layer over bright media.
- Two source conflicts are kept visible, not silently resolved.
- Run the ship checklist before a material pass; never report a pass you did not run.
- The repo being correct and the site being correct are two different claims.

## §Honesty and provenance

**The core fact.** **Apple publishes no numeric Liquid Glass spec.** No blur radius, no compositing-layer budget, no refraction coefficient, no dim constant for the regular variant, no corner concentration number. The stated rule in the Human Interface Guidelines is qualitative: reserve glass for the navigation layer, let content scroll behind it. Every number in this skill is tagged so it is never cited as "Apple's spec".

**Source tags** (verbatim from `15-honesty-and-checklists.md`):

| Tag | Meaning | Can you cite it? |
|---|---|---|
| `src: apple-hig` | Traceable to a published HIG page (materials, accessibility) | Yes — the only category you can cite as Apple's |
| `src: community` | A convention that works in practice (blur cap, layer budget) | Label as heuristic; confirm before shipping |
| `src: figma` | From the Figma Glass effect's own controls (depth/frost) | Not a spec |
| `src: measured` | Benchmarked on a specific device/browser; record which | Yes, with the device recorded |

**Numbers that are Apple's.**
- **Clear-variant dark dimming layer: 35% opacity over bright media** (`src: apple-hig`, materials). This is the *only* published dim number. It applies to the clear variant over visually rich backgrounds — **not** to regular-variant app panels. Copying 35% onto light panels turns them into grey slabs (category error).
- System colour palette (`src: apple-hig`) — reference colours by name in code so they adapt to light/dark/increase-contrast; treat hex as reference-only.
- Text contrast 4.5:1 (WCAG AA, not Apple) — measured after blur, at every scroll position.

**Numbers that are NOT Apple's (heuristic, ship with a note).**
- Blur max ~40px (iPhone) / ~60px (iPad/Mac) — `src: community`.
- Max ~4 compositing layers per screen — `src: community`.
- Figma Glass `depth` ≤ 20, `frost` 10–25 (>30 reads as milky plastic) — `src: figma`.
- Displacement `scale` values, map ramp widths, rim alphas, wash strengths — `src: measured` against a named lab and plate; re-derive against your own field before shipping. → see shared/references/04-svg-filter-graph.md §2, shared/references/03-dim-and-rim.md §Dim law.

## §Conflicts kept visible

- **`backdrop-filter: url()` direction:** an older archived note claimed "Safari-only, dead in Chrome"; WebKit 245510 + a June 2026 repro say the opposite (Chromium-only). This skill follows the bug/repro and flags the older note in place rather than silently overwriting it. Verify on device. → see shared/references/06-safari-webkit.md §7.
- **Static `<filter>` reuse:** Safari caches by ID; Chromium caches by ID too — same rule, both broken the same way. → see shared/references/05-chromium-quirks.md §3.
- **OS material on the open web:** `-apple-system-glass-material` is presented as usable under `@supports` in one source and as a dead end (needs private `WKPreferences.useSystemAppearance`) in another. Verify on a real device; keep `blur() + saturate()` as the base. → see shared/references/06-safari-webkit.md §6.

## §Apple spec and rules (folded from `15-honesty-and-checklists.md`)

**The one rule.** Liquid Glass is the navigation/overlay layer only. Apple's words (materials.md): "Don't use Liquid Glass in the content layer… including it in the content layer can result in unnecessary complexity and a confusing visual hierarchy." And: "Use Liquid Glass effects sparingly… overusing this material in multiple custom controls can provide a subpar user experience by distracting from that content." The one exception: a control in the content layer with a *transient* interactive element (sliders, toggles) may take on the glass appearance when activated. → see shared/references/01-strategy-picker.md §0.

**The two variants.** **regular** blurs and adjusts luminosity of background content to keep text legible — most system components, use when the background may hurt legibility or there is significant text (alerts, sidebars, popovers); scroll edge effects add further blur + opacity reduction. **clear** is highly translucent and prioritizes showing the background — only over visually rich backgrounds (photos, video). If the underlying content is bright, add a **dark dimming layer at 35% opacity**; if it is already dark, or you use AVKit's standard media controls (which dim themselves), no dimming layer is needed.

**What Apple does NOT publish.** No blur radius, no compositing-layer cap, no refraction coefficient, no layer-count budget. → §Honesty and provenance above.

**Web equivalent.** Treat the private `-apple-system-glass-material` story as unresolved historical context, not an open-web implementation recipe. Keep the ordinary CSS fallback and a verified SVG or WebGL path. → see shared/references/06-safari-webkit.md §6.

**System settings that change appearance.** People can pick a preferred Liquid Glass look in device settings, and can turn on Reduce Transparency / Increase Contrast. Appearance differs per variant. Test custom elements under all of these — system components adapt automatically, custom ones do not. → §Accessibility below.

**Related.** Primary materials and adoption documentation is linked in `shared/references/16-sources.md`; `shared/references/13-native-apple.md` is the self-contained native route. External companion skills are optional, not installation dependencies.

## §Accessibility

Not optional. People can pick a preferred Liquid Glass appearance in Settings, and Reduce Transparency / Reduce Motion can remove or modify effects. Standard components adapt automatically; **custom elements, colours, and animations do not** — test them under each configuration. Glass is where glass breaks contrast: `@media (prefers-reduced-transparency)` and `prefers-reduced-motion` need real handling, and text over a moving backdrop needs a scrim — measured contrast must hold at every scroll position, not at rest. → see shared/references/02-css-scaffold.md §6, shared/references/09-motion.md §Accessibility.

## §Native appendix (remainder of `13-native-apple.md`)

**When to use / do not load.** Load for "add Liquid Glass to my view", `glassEffect` vs `UIGlassEffect`, "why doesn't my glass show up", `GlassEffectContainer spacing`, `.glass` button style, "should this bar be glass", "adopt Liquid Glass in my app". Do not load for browser/CSS implementation (`liquid-glass-web`), animation timing (`glass-overlay-motion`), or whether glass belongs on a surface at all (`apple-hig`). The corrected, self-contained native guide and primary sources are in `shared/references/13-native-apple.md`; retained contextual names require target-SDK availability checks.

**Glass variants.**

| | |
|---|---|
| `.regular` | blurs behind, adjusts luminosity. The default; use for most system components. |
| `.clear` | high translucency, for media backgrounds. Add a dark dimming layer if content behind is bright. |
| `.identity` | content completely unaffected, as if no glass applied. Useful for opt-outs. |

Builders: `func tint(_ color: Color?) -> Glass`, `func interactive(_ isInteractive: Bool = true) -> Glass`.

**Containers — the performance rule.** `GlassEffectContainer` merges nearby glass shapes and morphs them during transitions. Without it, every effect renders independently and costs more. **Apple is explicit: a container spacing larger than the interior `HStack`/`VStack` spacing causes effects to blend together at rest**, because the views are too close — a design choice: unintended if the shapes should remain separate. The container value controls how soon shapes merge during animation; the stack value controls actual layout distance. `spacing` is the merge threshold in points. `glassEffectUnion(id:namespace:)` forces multiple views into one shape even at rest — for dynamic content or views outside a stack:

```swift
GlassEffectContainer(spacing: 20.0) {
    ForEach(items.indices, id: \.self) { i in
        Image(systemName: items[i])
            .glassEffect()
            .glassEffectUnion(id: i < 2 ? "1" : "2", namespace: namespace)
    }
}
```

**Ordering.** `glassEffect` captures content to send to the container. Applying it before other appearance modifiers renders the wrong thing. Put it at the end of the modifier chain, always.

**Platform-specific background effects (including visionOS; verify availability before using on iOS).** `.glassBackgroundEffect()` (automatic, container-relative rect), `.glassBackgroundEffect(in: someShape)`, `.glassBackgroundEffect(displayMode: .implicit)`. `GlassBackgroundDisplayMode`: `.always` (always show), `.implicit` (**show only when the view isn't already inside glass** — the correct default for nested surfaces), `.never`. `glassEffectID(_:in:)`, `glassEffectTransition(_:)` — `GlassEffectTransition.matchedGeometry` (default) or `.materialize`.

**Scroll edge effect.** Content scrolling under a control can break legibility. System bars get this automatically; custom bars opt in with `.scrollEdgeEffectStyle(.automatic, for: .top)`. `backgroundExtensionEffect()` mirrors adjacent content to look like it stretches under a sidebar or inspector — the hero-image trick.

**Button styles — don't hand-roll.** `Button("OK") { }.buttonStyle(.glass)` / `.glassProminent`. UIKit: `UIButton.Configuration.glass()`, `.prominentGlass()`, `.clearGlass()`, `.prominentClearGlass()`. AppKit: `NSButton.BezelStyle.glass`.

**UIKit.** `let effect = UIGlassEffect(style: .regular)` (or `.clear`); `effect.isInteractive = true`; `effect.tintColor = .systemOrange`; `let view = UIVisualEffectView(effect: effect)` (set `.contentView`). `UIGlassContainerEffect` renders multiple glass elements into one combined effect. `UIBackgroundExtensionView`, `UIScrollEdgeElementContainerInteraction` mirror the SwiftUI background/scroll-edge APIs.

**AppKit.** `NSGlassEffectView` with `NSGlassEffectView.Style`, properties `tintColor`, `cornerRadius`, `contentView`, `automaticallyPlacesContentView`. `NSGlassEffectContainerView` merges descendants within a proximity.

**Corner concentration.** Apple's shapes are concentric with their containers — hardware curvature drives the radius. `ConcentricRectangle` and `Shape/rect(corners:isUniform:)` in SwiftUI; `UICornerConfiguration` (`capsule(maximumRadius:)`, `corners(radius:)`, `uniformCorners(radius:)`, and the per-edge family) in UIKit.

**Per-platform behaviour.**
- **watchOS** — minimal changes, appear automatically. Adopt watchOS 10 toolbar APIs and button styles. Old hardware is unaffected.
- **tvOS** — standard focus APIs drive the glass appearance; Apple TV 4K (2nd gen) and newer only. Apply effects to custom controls on focus with the standard focus APIs (`UIFocusItem`, `UIControl.State.focused`, `@Environment(\.isFocused)`).
- **iPadOS** — half sheets are inset from the display edge, with content peeking through. Set `UIPopoverPresentationController.sourceView` / `.sourceItem` so action sheets originate from their control, not the screen bottom.
- **macOS** — windows adopt rounder corners; support arbitrary resizing via split views.

**Compatibility.** `UIDesignRequiresCompatibility` is a temporary SDK-era escape hatch. Verify whether the target SDK still honors it; do not make it the migration plan.

**Common failures.**

| Symptom | Cause |
|---|---|
| No glass at all | Custom background/appearance view layering over the effect. Remove it. |
| Shapes merge when static | Merge threshold greater than the actual inter-shape gap (when merging is unintended). |
| Effect renders the wrong content | `glassEffect` applied before other appearance modifiers. |
| Doesn't adopt after SDK upgrade | Hard-coded layout metrics or a custom background in the bar/sheet. |
| Nested surfaces look doubled | `glassBackgroundEffect(displayMode:)` defaults wrong — use `.implicit`. |

**Sourcing every number.** Apple publishes **no numeric blur cap, layer count, or displacement budget**. Use the primary DocC-checked declarations in `shared/references/13-native-apple.md`; verify other names and platform availability before quoting; every pixel/point figure is a heuristic and is tagged per §Source tags. One signature to distrust: `glassEffect(_:in:isEnabled:)` — see shared/references/13-native-apple.md §2.

## §Ship checklist (from `15-honesty-and-checklists.md`)

Print this before any material pass. Every box has a reference for the why.

**Design decision**
- [ ] Surface is navigation/overlay layer, not content layer (→ 01-strategy-picker.md §0)
- [ ] Opacity / fill sign-off obtained (cannot have full see-through *and* WCAG AA) (→ 02-css-scaffold.md §3)
- [ ] Support floor stated (refraction Chromium-only if strategy 2) (→ 01-strategy-picker.md §5)
- [ ] Application path picked: default `shared/assets/liquid-glass.css` + `.js` (universal fallback with gated content/backdrop bend), or WebGL2 for an explicit texture/Safari true-refraction brief. The showcase is reference-only (→ 01-strategy-picker.md §1)

**Structure**
- [ ] Exactly two blur layers with distinct jobs; counted the stack (→ 02-css-scaffold.md §3)
- [ ] Every recipe that carries specular got the same treatment (→ 02-css-scaffold.md §1)
- [ ] One `::before` per element; grepped all old selector references (→ 02-css-scaffold.md §5)
- [ ] Mechanism applied at shared primitives; counted surfaces carrying it (→ §Working rules)
- [ ] No nested glass: one-selector de-nest in place, or verified no nesting (→ 02-css-scaffold.md §5)
- [ ] Filter region `x="0" y="0" width="100%" height="100%"` (→ 03-dim-and-rim.md §Geometry faults)
- [ ] Map: neutral centre `(128,128)`, alpha 255, per-edge peak ≥90% of `scale/2`, L/R skew <10% (→ 10-measurement.md §Chain delivery)
- [ ] Squircle: `corner-shape: squircle` under `@supports`, K=2 (n=4) for Apple; map geometry mirrors painted curve (→ 02-css-scaffold.md §4)

**Material**
- [ ] Dim law is the value-weighted wash; clamped `d ∈ [0, 0.5]` (→ 03-dim-and-rim.md §Dim law)
- [ ] `saturate()` in every dimmed chain; chroma retention ~60–75% measured with `shared/scripts/chroma-retention.py` (→ 10-measurement.md §Chroma retention)
- [ ] Fill: text-bearing ~0.4–0.7 alpha; Apple chrome 15–30% (→ 02-css-scaffold.md §3)
- [ ] No resting drop shadow on dark glass (→ 02-css-scaffold.md §3)
- [ ] Rim ramp 2–5px (measure with `shared/scripts/edge-profile.py`); ≥8px = glow (→ 10-measurement.md §Chain delivery)
- [ ] White-on-white ceiling swept; if <12/255, structure changed (ink line + edge-dense radial field), not alpha (→ 10-measurement.md §Material audit 3b)
- [ ] No glint band crossing mid-body (→ 11-failure-catalogue.md S28)

**Motion**
- [ ] Trigger origin measured in `useLayoutEffect` on laid-out box; kept while closing (→ 09-motion.md §Procedure)
- [ ] Entry 300ms easeOutQuint; close 280ms decelerate-into-trigger; scale anchor 0 (→ 09-motion.md §Timing budget)
- [ ] No opacity animation on any `backdrop-filter` element; veil split scrim/blur; blur ramps to `blur(0px)` in ~120ms with the panel (→ 09-motion.md §Veil split)
- [ ] Child exits fit inside container close budget (→ 09-motion.md §Timing budget)

**Performance**
- [ ] Fixed canvas on compositor scroll lock (`animation-timeline: scroll(root block)`), or gap instrumented; no display-time lead (→ 08-performance.md §Scroll lock)
- [ ] Idle repaints gated on frame identity; no infinite pulse in frame (→ 08-performance.md §Idle gate)
- [ ] Offscreen `url()` parked via IO (~300px margin), re-dressed from cache (→ 08-performance.md §Viewport gate)
- [ ] No `content-visibility: auto` on glass cards (→ 08-performance.md §Viewport gate)
- [ ] No `url()` graphs culled for fps; frame drivers killed first (→ 08-performance.md §Viewport gate)
- [ ] Production maps quantized (8px grid): 1024px general long-side cap; Safari exception 512px conservative map budget. Reference showcase supersampling is a separate parity mode (→ 08-performance.md §Cost levers).

**Verification**
- [ ] Large-size screenshot over fine grid (→ §Verification checklist)
- [ ] Stripes compress/flip at edge (map actually read) (→ §Verification checklist)
- [ ] Strategy 1 tested in Firefox (→ §Verification checklist)
- [ ] `prefers-reduced-transparency` + `prefers-reduced-motion` render (→ §Verification checklist)
- [ ] Built bundle grepped for token/property names (not authored values); bundle mtime checked (→ 10-measurement.md §Minifier traps)
- [ ] Runtime-critical CSS inline (`style.setProperty` both spellings, `!important`) (→ 10-measurement.md §Live audit)
- [ ] Material tests rewritten to new intent + guard naming old mechanism (→ §Verification checklist)
- [ ] Gates re-run after LAST edit; visual state named explicitly if unverified (→ §Integrity rules)

**Reporting**
- [ ] Numbers tagged `src: apple-hig | community | figma | measured` (→ §Source tags)
- [ ] Support floor in the handoff (expected output vs defect) (→ 01-strategy-picker.md §5)
- [ ] Two claims kept apart: repo correct vs site correct (deploy window) (→ §Release discipline)

## §Verification checklist (from `15-honesty-and-checklists.md`)

1. **Screenshot-test at large size over a fine grid** — Chromium quirk 2 (backdrop ends at element edge) and quirk 4 (refraction only bottom/right) hide at small scale.
2. **Sample-pixel test with a ruled/striped background:** with a real lens the stripes **compress and flip** at the edge. Constant-travel stripes mean the map is not being read (quirk 1: alpha-0 map is dead).
3. **Test strategy 1 in Firefox** — if it only works in Chrome you shipped strategy 2 by accident.
4. **Confirm the `prefers-reduced-transparency` and `prefers-reduced-motion` paths render.** Glass is where glass breaks contrast; text over a moving backdrop needs a scrim, and measured contrast must hold at every scroll position, not at rest.
5. **Verify the corner curve matches the painted border** — the map's corner geometry must mirror what the browser actually paints (→ 02-css-scaffold.md §4).

**Material tests are a decision ledger.** Changing the rim, the dark fill or the bloom makes every test that pinned the *previous* decision fail. Do not delete them and do not loosen the thresholds — a loosened threshold hides the next regression. Rewrite each to assert the new value's **reason** ("2–5px, ratio-clamped, because a 1px band cannot fade"), and add one guard that fails if the specific old mechanism returns: assert the ring block does not match `content-box, linear-gradient(#000 0 0)` and does not use `mask-composite: exclude`. Then re-run the suite — rewriting assertions and running them are two separate acts.

## §Integrity rules

- **Never report a pass you did not run.** If typecheck/lint/test/build have not run since the edits, say so plainly and name what is unverified.
- **Re-run gates after the LAST edit**, and when a result contradicts an earlier run, resolve it before reporting either. A green result collected before the final patch is not evidence about the committed tree.
- If no browser can be driven, that is a hard stop on visual claims — say so instead of reasoning from tokens. Say "I don't know" about a browser-dependent mechanism and name the confidence split.
- A headless capture of a probe page that shows no glass is not evidence the chain is dead — a GPU-less capture is not the user's renderer — just as a vision model's prose about a screenshot is not evidence it lives; without eyes, the gate attributes and the status line are the oracles.

## §Working rules

- **Diagnose from numbers, never from adjectives.** "Mushy", "too much shine", "dirty border" are unactionable. Map the complaint to token values before proposing anything. → see shared/references/10-measurement.md §Reading pixels.
- **Prefer retuning to replacing.** Before accepting a plan's "replace X", check whether X's *values* are wrong rather than X itself. Before accepting an external implementation, diff its mechanism against yours (filter-graph shape, support wall, perf architecture, fallback) — same physics + same wall + heavier graph is a downgrade; steal its portable ideas instead of its engine.
- **Audit a plan's numeric premises before executing its steps.** "X is 0" is often 0.2; "four blur layers" is often two; "adds refraction" is often wired to nothing. Classify each premise: wrong-but-still-wanted (apply as a delta), wrong-and-already-done (do nothing, say so), or describes behaviour that never existed (fix the stale comment, flag the wiring as a user decision).
- **One isolated change per cycle; name the confidence split.** Separate "mechanism I am confident about, from reading token values" from "taste judgement only your eyes can settle". If the previous cycle was never visually confirmed, do not build on it. Never report a pass you did not run — gates green is a compile fact, not a visual fact.
- **Measure from pixels, not from a vision model's prose.** Vision models describe impression and are blind to sub-10px edge structure. → see shared/references/10-measurement.md §Reading pixels.
- **Verify in the built bundle, matching what the minifier emits.** → see shared/references/10-measurement.md §Minifier traps.
- **Runtime-critical CSS goes inline.** → see shared/references/10-measurement.md §Live audit.
- **Material tests are a decision ledger.** → §Verification checklist above.
- **Stop and re-align on the third blind revision — do not stack a fourth.** One isolated change per cycle; name the confidence split.
- **Green gates ≠ seen material.** "Run the gates, if green push it" is not permission to publish unseen taste variables.
- **Apply at shared primitives, then verify it landed.** Apply a new mechanism to shared components (`Card`, `Modal`, `Drawer`, `Dropdown`, `EmptyState`, command palette), not hundreds of call sites. Then count (`grep -rn "glass-edge" src --include="*.tsx"`) and say exactly which surfaces carry it and which do not. An unapplied mechanism produces a build, a passing gate and a screenshot identical to before. Do not push for review while unapplied: a push asks for the user's attention, and their only visual check may be the deployed site. Expect "you have to push it for me to see it" as a mid-task correction — check whether anything visible actually changed, apply, gate, then push once; tell them what to look for and roughly how long the build takes, since CSS is cached hard enough to need an explicit hard reload. If the next item is blocked on a visual judgement only they can make, say so plainly. Also confirm the preference/motion context you gate the hook on is the real one: `useMotionPreference()` is a context, a persisted `usePersistentPreference('motion', …)` key is a different, probably nonexistent, thing — a silent no-op. → see shared/references/03-dim-and-rim.md §Apply at shared primitives.
- **Framing the whole-plan file.** Two framing mistakes cost real time, both about title and scope: **title the plan for the whole job** (a plan file named after one phase reads as a side quest — name it for the deliverable, `FRONTEND-REFACTOR-PLAN.md`, and list every phase); **write the plan BEFORE implementing and make it compression-safe** — include locked decisions as a table, the scorecard, a "key measurements — do not re-derive" section, per-phase gates, phase history with commits, and a named revert point. Decisions, scorecard and measured numbers are the parts that cannot be re-derived cheaply.

**Answering a report.**
- **The verdict first, in plain words.** One issue per line, a number only where it decides something. Analysis tables and multi-paragraph mechanics in the reply earn "talk simple" back; that depth belongs in the commit or the file.
- **When console output is pasted, name extension noise in one line and move on.** `contentscript.js` is always an extension's content script; the app's own bundles are the hashed `index-*.js` files.
- **Probe the defect with pixels before writing a neuronal fix.** Load the PNG, compute column means over the panel's body rows for a diagonal band, row means for a horizontal one. A +16 lift at a diagonal angle identifies a glint in seconds. Do not write a diagnosis paragraph before the probe returns a number.
- **When the report is *this build differs from that build***, the first deliverable is the comparison itself (same panel content, both surfaces), plus the number-set diff — reference tuning and app tokens drift in separate commits, and the agreed tuning usually lives in the reference's address-bar hash, not its committed defaults.
- **When the user has already chosen an approach, execute it.** Do not re-present the menu. Once picked, do not re-open the decision because the next cycle's evidence is uncomfortable.
- **"Don't change any code — figure this out first"** = a diagnosis with evidence. Name how many layers are stacked, which recipe still carries the property that was supposed to be gone, and whether the effect is wired at all. Report as *defect, file:line, why it survived*.
- **When a mechanism you added last cycle is the cause, offer deletion plus a baseline revert as a named option.** Do not silently keep it at a "reduced" value (wrong structurally, not in magnitude), and name the un-implemented half of any paired request in the commit message.

## §Release discipline

- **"Run the gates, if green push it" is not permission to publish unseen material.** It authorizes delivery of work already seen or a single isolated change with a stated expected delta. Green gates on an unseen batch of taste variables are the highest-risk push in this work.
- **Keep two claims apart: the repo is correct, and the site is correct.** They diverge for the whole deploy window. After any push, name which one is proven.
- **A full-revert request is still a release action: say what survives.** Use `--force-with-lease`, then name the reflog hashes discarded.
- **"Revert it to the commit I sent you" means that exact commit.** Prove it landed by rebuilding and grepping the bundle for the mechanism that should be gone.
- **When a revert loop starts, stop producing changes and produce evidence.** Repeated reject-and-revert cycles mean the diagnosis *method* is the defect. Hand over the measured cause in numbers.
- **Prove a revert is not your fix.** A file with an earlier in-file statement of the same property at a different value is a stale duplicate, not a regression. `grep -n -- "--<prop>:"` and confirm one value per scope before shipping a revert.
- **Commit messages:** write to a scratch file outside the repo and pass a native forward-slash path to `git commit -F`. Check `git log -1 --format=%B` — the subject arriving intact while the body is cut is the tell of a truncated message.

## §What this skill is not

- **Not Apple's documentation.** Apple publishes no numeric Liquid Glass spec. Where this skill gives a number it is `src: community`, `src: figma`, or `src: measured` — labelled as such. → §Source tags.
- **Not affiliated with or endorsed by Apple.** Apple, the Human Interface Guidelines, SF Symbols, SwiftUI, and Liquid Glass are trademarks of Apple Inc.
- **Not a licence to skip verification.** This material cannot be verified by reading tokens. If no browser can be driven, say so plainly and hand back the measured numbers instead of a confident narrative.
- **Not a substitute for the design decision.** Whether a surface should be glass at all, whether the field behind it is worth building, and whether the opacity sign-off is granted — those are user decisions. This skill makes each of them decidable with evidence.

## §Development notice

This skill suite was developed from publicly available information on the web and practical research with browser rendering engines. See `NOTICE` and `shared/references/16-sources.md`.

Keep implementation claims tied to observable behavior, named test environments, and the verification limits documented in this reference set.
