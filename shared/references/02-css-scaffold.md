# CSS scaffold

Purpose: the universal fallback, the four optical layers, the token set, squircle geometry, and the selectors that keep glass from eating itself.

Read when: writing or reviewing the CSS for a glass surface, choosing tokens, or adding a squircle / nested-glass rule.
Skip if: the problem is chain order or engine support (→ 01-strategy-picker.md, 06-safari-webkit.md) or a symptom lookup (→ 11-failure-catalogue.md).

Summary:
- `blur() saturate() brightness()` is the fallback every browser keeps; `saturate(180%)` is load-bearing.
- Four optical layers: refraction, specular highlight, bezel, sheen. Blur is only layer 0.
- One `::before` per element; flatten nested glass with one selector; no resting drop shadow on dark glass.
- `corner-shape: squircle` is an enhancement, never a dependency; map geometry must mirror the painted curve.
- `shared/assets/liquid-glass.css` is this scaffold as a drop-in file with `--lg-*` tokens.

## §0 The scaffold

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(2px) saturate(180%) brightness(1.08);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 20px;
  box-shadow:
    inset 1px 1px 1px rgba(255, 255, 255, 0.6),   /* top glossy edge */
    inset -1px -1px 1px rgba(255, 255, 255, 0.15),
    0 18px 50px rgba(0, 0, 0, 0.4);               /* depth */
}
```

**`saturate(180%)` is load-bearing.** Without it every backdrop looks dull and grey. With it you already have solid frosted glass worth shipping before any SVG. Filter order: `blur → saturate → brightness`. Never a second `blur` after a tint. When `url()` is added it goes last. → see shared/references/01-strategy-picker.md §4.

Minifiers rewrite selectors and values; grep dist for the token or property name, never the authored value. → see shared/references/10-measurement.md §Minifier traps.

## §1 Four-layer anatomy — why blur-only fails

Apple's Liquid Glass is a simulated **lens**, not a frosted sheet. `backdrop-filter: blur()` is layer 0 (the substrate). Missing layers 1–3 is what makes a port read as "smudged background".

| # | Layer | What it does |
|---|---|---|
| 1 | Refraction (lensing) | Backdrop near edges bends inward — thick glass puck |
| 2 | Specular highlight | Bright top rim (light from above), subtle sides, soft dark bottom inner shadow |
| 3 | Bezel (edge thickness) | Gradient border: bright top → transparent sides → dark bottom = 3D edge |
| 4 | Sheen / content infusion | Diagonal light that shifts with pointer; ambient colour pickup |

**The rim paints light; it does not bend light.** A painted rim can never refract the backdrop, and chromatic dispersion (RGB channels landing at different offsets) is only available from displacement/shader paths. → see shared/references/07-webgl-shader.md §GLSL core.

### Layer 1 — refraction: SVG displacement on the backdrop

Rendered ONCE at app root:

```html
<svg width="0" height="0">
  <filter id="lg-displace" x="0" y="0" width="100%" height="100%">
    <feImage href="data:image/svg+xml,..." result="map" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale="70"
        xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>
```

The `feImage` is a displacement map: red channel = X offset, green = Y offset. Gradient rects hugging each edge encode "pull inward"; centre = no displacement. `shared/assets/liquid-glass.js` injects an equivalent graph with an alpha-255 PNG map and a fresh ID per rebuild. → see shared/references/05-chromium-quirks.md §1, §3.

Support: Chromium yes for `url()` in `backdrop-filter`; untested Safari/Firefox targets get the fallback (frost guaranteed — the bend is confirmed on the owner-tested iPhone Safari; verify on target versions). Layers 2–3 carry the effect everywhere; displacement is the Chromium cherry. → see shared/references/01-strategy-picker.md §2.

### Layer 2 — specular highlight (sells "glass" on every browser)

```css
box-shadow:
  inset 0 1px 1px -0.5px rgba(255,255,255,0.55),   /* crisp top rim */
  inset 0 -1px 1px -0.5px rgba(0,0,0,0.10),         /* bottom inner shadow */
  inset 1px 0 1px -1px rgba(255,255,255,0.25),      /* side rims */
  inset -1px 0 1px -1px rgba(255,255,255,0.25),
  0 10px 40px -10px rgba(34,30,74,0.18);            /* panel floats */
```

Specular is a lit edge, not a drawn line. A hard 1px `inset 0 1px 0 rgb(255 255 255 / .68)` is the "shine is too much" report; the complaint is the shape (a crisp drawn line), not the brightness — dropping .68 → .22 leaves a crisp 1px bar, just dimmer. Whatever you use must be a `background` layer rather than a `box-shadow` where it composites with the fill gradient, and it must be applied identically to every recipe carrying a specular or a dropdown and a modal read as two materials. → see shared/references/03-dim-and-rim.md §Rim.

### Layer 2b — edge-light rim ring (canonical code)

The pointer-tracking ring from `03-dim-and-rim.md`. The content-box mask makes the ring follow `border-radius`; `mask-composite: exclude` is required or the two mask layers cancel and nothing paints. The ring lives in `::before`, so `backdrop-filter` carriers are never animated.

```css
.glass-edge::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  padding: var(--eg-t); pointer-events: none; z-index: 1;
  background:
    radial-gradient(ellipse var(--glass-edge-spread) var(--glass-edge-spread) at
        var(--eg-x, 50%) var(--eg-y, 50%),
      rgb(var(--glass-edge-color) / var(--eg-flare)) 0%,
      rgb(var(--glass-edge-color) / calc(var(--eg-flare) * 0.45)) 34%,
      rgb(var(--glass-edge-color) / 0) 68%),
    linear-gradient(to bottom,
      rgb(var(--glass-edge-color) / var(--eg-top)) 0%,
      rgb(var(--glass-edge-color) / var(--eg-mid)) 52%,
      rgb(var(--glass-edge-color) / var(--eg-bot)) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
```

### Layer 3 — bezel: gradient border via masked pseudo-element

```css
.lg::before {
  content: ""; position: absolute; inset: 0;
  border-radius: inherit; padding: 1px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 30%,
    rgba(255,255,255,0) 60%, rgba(255,255,255,0.1) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none;
}
```

### Layer 4 — sheen: pointer-following light

```css
.lg::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: radial-gradient(600px circle at var(--mx,70%) var(--my,0%),
    rgba(255,255,255,0.14), transparent 40%);
  pointer-events: none; transition: background .3s ease;
}
/* JS: onPointerMove → --mx/--my as % — ONE delegated listener, not one per panel */
```

### Text legibility on glass

- Light glass: tinted fill ~0.6 white + `text-shadow: 0 1px 1px rgba(255,255,255,0.45)` (knockout).
- Headings: slightly heavier weight + tiny shadow.
- Dark glass: `text-shadow: 0 1px 2px rgba(0,0,0,0.4)`, fill opacity up.
- Never pure `bg-white` — tinted gradient so material reads as material.

## §2 Token set

- `.lg` — cards, topbar, dropdowns (specular + bezel + sheen + blur).
- `.lg-strong` — modals, drawers ONLY (+ displacement; GPU cost — few and transient).
- `.lg-dark` — sidebar (inverted specular on ink).
- `.lg-inset` — inputs, wells (concave: inner shadow instead of rim; `inset 0 1px 0` highlight at reduced opacity plus `brightness(1.04)` in the backdrop-filter).

The drop-in file uses `--lg-*` tokens in `:root` (light) and `[data-theme='dark']`/`@media (prefers-color-scheme: dark)` overrides (dark). Token values are the numbers in §0, §1 and the rim table in → see shared/references/03-dim-and-rim.md §Tokens. Tailwind v4 projects should keep tokens in `@theme` instead. → see shared/references/12-tailwind-v4.md §Tokens in CSS.

## §3 Material rules

1. **Read the recipe vars before proposing anything.** Map the complaint to numbers: specular strength, body-gradient fill alphas, border alpha/width, count of `backdrop-filter` carriers in the stack. The adjective is unactionable. → see shared/references/10-measurement.md §Reading pixels.
2. **A surface with no body is the root of mush.** Fill alphas of 0 make the panel blur-only; legibility then depends on whatever is behind it. Real glass tints sit around 0.4–0.7 alpha for text-bearing surfaces, 15–30% fill for Apple chrome panels `src: community`. You cannot have full see-through *and* WCAG AA — get sign-off on opacity first.
3. **Count the blur layers before adding one.** Target two with distinct jobs: one backdrop behind the floating surface, one body on it. Panel + scrim + veil + halo at low values compounds into a soft, edgeless stack. Consolidating is not deleting.
4. **Keep the silhouette crisp.** Glass reads as glass because its boundary is hard against soft content; a mask/halo feather bleeding outside the panel softens precisely that boundary. Feather inward. → see shared/references/03-dim-and-rim.md §Geometry faults.
5. **One element has one `::before`.** → see shared/references/03-dim-and-rim.md §Pseudo-element collisions.
6. **A mechanism that no visible surface uses is not done.** → see shared/references/03-dim-and-rim.md §Apply at shared primitives.
7. **A page-level sheen is a pointer effect applied to the whole document, and it always reads as a bug.** Scope sheen to floating surfaces that own the pointer — dropdowns, notification panels, popovers — and remove it from the routed page. Delete the orphaned import too; an exported-but-unused component produces no lint warning.
8. **Changing fill alpha changes contrast.** Compute WCAG contrast for each text role on each theme's glass fill and report the tightest ratio. The light tertiary role on the lightest glass fails first. `text-white` on translucent light glass renders ~4.5:1 against a light page — borderline for body, failing for fine print. → see shared/references/12-tailwind-v4.md §Contrast.
9. **A material pass must not touch the motion contract.** Retuning fill/specular/blur is safe; preserve the veil split and origin rules. → see shared/references/09-motion.md §Veil split.
10. **Recipes without hierarchy read as one flat material.** → see shared/references/12-tailwind-v4.md §Depth scale.
11. **Rim panels, never chips.** → see shared/references/03-dim-and-rim.md §Which surfaces get the rim.
12. **Dark glass has no resting drop shadow.** Real glass is transparent, so it cannot cast a shadow; a shadow on dark glass is the single strongest moulded-plastic cue. A dark fill at 0.6+ alpha is mostly opaque paint with no depth behind it. Separation comes from rim + fill step + depth field. Check opacity, then shadow, then luminance range — in that order. → see shared/references/10-measurement.md §Material audit 4.
13. **A correct declaration that renders wrong is a cascade bug, not a typo.** → see shared/references/12-tailwind-v4.md §Cascade traps.
14. **A custom `@utility` must not set `position`.** → see shared/references/12-tailwind-v4.md §Cascade traps.
15. **Verify in the BUILT bundle, not the source.** → see shared/references/10-measurement.md §Minifier traps.

## §4 Squircles — the shape underneath

`border-radius` gives circular arcs. Apple uses **continuous-curvature** corners; the arc-to-edge transition is the tell. CSS now supports this natively:

```css
.squircle {
  border-radius: 24px;
  corner-shape: squircle;   /* = superellipse(2) */
}
```

| Value | `superellipse(K)` | Meaning |
|---|---|---|
| `round` | `superellipse(1)` | the default arc |
| `squircle` | `superellipse(2)` | the iOS look |
| `bevel` | `superellipse(0)` | faceted |
| `scoop` | `superellipse(-1)` | concave |
| — | `notch`/`square` | extremes |

`superellipse(K)` draws `x^(2K) + y^(2K) = 1` in the corner box — K=1 round, K=2 squircle, higher grows squarer. **`corner-shape` does nothing without a non-zero `border-radius`** — radius defines the corner box, shape draws the curve inside it.

**Ship K=2 (n=4) for Apple panels.** K=3 (n=8) is a near-rectangle with tiny rounded corners that reads visibly too sharp. When you hand the same exponent to a JS SDF, raise it to `n = 2^K` so the rim ring and the CSS border land on the same curve; a mismatch there is the "the rim and the panel corner disagree" bug.

**The inverse trap.** `corner-shape` is inert in most live browsers, so the painted border is a plain round arc while a map authored on `superellipse(3)` draws its rim on a different curve. The result is the "double corner / rim curve ≠ panel curve" report. **The displacement/specular map's corner geometry MUST mirror what the browser actually paints** — drive the map FROM the painted curve, never the reverse, and gate the swap on a real capability probe, not on the mere presence of the declaration.

**Ship as an enhancement, never a dependency:**

```css
@supports (corner-shape: squircle) {
  .glx, .glx-strong, .glass-edge { corner-shape: squircle; }
}
```

Unsupported engines drop the unknown property and keep the plain arc. Report the support floor (Chromium 139+ renders it) — others keeping the arc is expected output, not a defect. Rim masks and fill feathers that use `border-radius: inherit` pick the curve up automatically. Verify it shipped in the built bundle (`grep dist` for `corner-shape`).

`@spatio-labs/squircle` renders the real SwiftUI continuous corner via `clip-path` + `ResizeObserver` (identical across Chrome, Firefox, Safari), because `superellipse(2)` is still rougher than the true iOS curve. It also keeps border width even around the curve, which most implementations miss.

The `-apple-visual-effect: -apple-system-glass-material` dead end: it yields the actual OS material but does not work on the open web, nor by default in a `WKWebView` (it needs the private `useSystemAppearance` toggle in `WKPreferences`, which means giving up App Store review). → see shared/references/06-safari-webkit.md §6 for the flagged conflict with the `-apple-system-glass-material` claim.

## §5 Nested-glass flattening

A `backdrop-filter` ancestor is a backdrop root. A nested glass child can only sample the parent's flat fill — it bends nothing, blurs nothing, and its translucent fill stacks (`0.62 + 0.62 ≈ 0.86` opaque milk = the "washed out panel" report). Flatten nested glass with ONE selector, not by auditing call sites:

```css
.lg .lg {                    /* one-selector de-nest */
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  filter: none;
  background: var(--lg-fill-flat);
}
```

Real glass does not refract inside itself. Any rule that sets `mask: none` on a variant (the de-nest rule, the `data-glass='off'` tier) does not see a zero-floored fill feather — confirm which surfaces the floor lands on. → see shared/references/03-dim-and-rim.md §Geometry faults.

**Pseudo-element collisions (canonical).** One element has **one** `::before`. Before adding a rim, glow or grain overlay, `grep -n "::before\|::after" src/index.css` and grep every existing owner: any class used *together* with the new one silently loses whichever layer lands second — no error, no lint finding. Resolve by moving the incumbent to the other pseudo-element. **When you move a pseudo-element, grep for every reference to the old selector, not just its definition.** Conditional copies hide under `:root[data-motion='reduce'] .glx-sheen:hover::before`, `@media (prefers-reduced-motion: reduce)`, and `@media (forced-colors: active)`. Miss one and reduced-motion users keep an effect the design intended to disable. → see shared/references/03-dim-and-rim.md §Pseudo-element collisions.

## §6 Media handling and accessibility

- `@media (prefers-reduced-motion: reduce)` — park the sheen transition and the pointer circuit; the rim stays. → see shared/references/09-motion.md §Hover.
- `@media (prefers-reduced-transparency: reduce)` — raise fill opacity toward opaque; glass is where glass breaks contrast.
- `@media (forced-colors: active)` — keep a real `border`, drop `backdrop-filter` and decorative pseudo-elements; system colours win.
- Text over a moving backdrop needs a scrim; measured contrast must hold at every scroll position, not at rest. People can pick a preferred Liquid Glass look in device settings and can turn on Reduce Transparency / Increase Contrast. Standard components adapt automatically; custom elements, colours and animations do not. → see shared/references/15-honesty-and-checklists.md §Accessibility.

Conditional copies hide under `prefers-reduced-motion`, `forced-colors`, and data-attribute blocks — grep every reference to an old selector when you move a pseudo-element. → see shared/references/03-dim-and-rim.md §Pseudo-element collisions.

## §7 Session notes (generalized from a real React/Tailwind v4 RTL app)

- **CSS architecture** — the displacement filter SVG lives at app root via a `<GlassFilters/>` component. Sheen is a JS-driven CSS variable (`--lg-sheen-x/y`) updated via `mousemove` + `requestAnimationFrame` (throttled); a wrapper component handles it with no per-render overhead.
- **Browser reality** — `backdrop-filter: url(#svg)` is blocked in documented WebKit behaviour (bug 245510), so untested Safari versions fall through to `blur() saturate()`, while specular + bezel carry the glass look on every browser. Frost is the guaranteed floor; the bend is confirmed on the owner-tested iPhone Safari (2026-11-08) — verify on the target version. → see shared/references/06-safari-webkit.md §1.
- **Alias pattern** — legacy `.glass-1/2/3` classes aliased via `@apply lg / lg-strong / lg-dark` so existing pages upgrade in a single sed pass without touching component files. In Tailwind v4, legacy aliases must inline full declarations, not `@apply`. → see shared/references/12-tailwind-v4.md §Cascade traps.
- **Perf budget** — `.lg-strong` (displacement) on only modals/drawers/sidebars. Static cards use `.lg`. A page full of displacement-backed cards visibly janks on mid-tier laptops. → see shared/references/08-performance.md §Viewport gate.
- **Tailwind v4 gotcha** — `color-mix()` inside `@theme` values works, but arbitrary-value colour functions in `className=` (`bg-[color-mix(...)]`) are unreliable in JIT. Put computed colours in CSS custom properties under `@theme` and reference via `var(--token)`.

## §8 Drop-in

`shared/assets/liquid-glass.css` is the default drop-in with `--lg-*` tokens, both themes, the universal fallback, reduced-motion/forced-colors handling and the de-nest selector. `shared/assets/liquid-glass.js` restores the original strategy-1 SVG lens injector, 1× canonical map, fresh filter IDs, conservative capability gate and authored pointer behavior. Its painted bezel is fallback dress; the gated SVG graph supplies the additive bend. The standalone original showcase is `shared/assets/showcase.html`; it is not required for application work and retains its separate 2× optics. Header comment: "Fallback is universal; bend is additive".
