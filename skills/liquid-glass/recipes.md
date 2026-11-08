# Liquid Glass recipes

Plain CSS first. Load `../../shared/assets/liquid-glass.css` and `.js` once, before the first surface. The HTML below is minimal; layout declarations are separate from the shipped material.

Source assembly: `../../shared/references/02-css-scaffold.md` (classes, tokens, layers), `03-dim-and-rim.md` (rim scope and production values), `01-strategy-picker.md` (surface/support decisions), `04-svg-filter-graph.md` (optical rim), `11-failure-catalogue.md` (pitfalls), `12-tailwind-v4.md` (framework rules), `../../shared/assets/showcase/optics.js` (original product tuning), and `../../shared/assets/liquid-glass.js` (original strategy-1 drop-in). No optical values below come from a competitor or an assumed Apple specification.

## Shared theme tokens and fallback

| Token | Light | Dark |
|---|---|---|
| `--lg-fill` | `rgba(255,255,255,0.08)` | `rgba(34,30,74,0.65)` |
| `--lg-fill-strong` | `rgba(252,252,252,0.32)` | `rgba(34,30,74,0.88)` |
| `--lg-fill-flat` | `rgba(255,255,255,0.72)` | `rgba(34,30,74,0.88)` |
| `--lg-fill-dark` | `rgba(34,30,74,0.65)` | `rgba(34,30,74,0.88)` |
| `--lg-blur` / saturation / brightness | `2px` / `180%` / `1.08` | `2px` / `140%` / `1.08` |
| `--lg-border` | `rgba(255,255,255,0.28)` | `rgba(255,255,255,0.08)` |
| `--lg-radius` | `20px` | `20px` |
| Rim top / sides / bottom | white `.55` / `.25`; black `.10` | white `.06` / `.06`; black `.10` |
| Edge thickness / base / hot / spread | `clamp(1.5px,4.2%,3.6px)` / `.5` / `.55` / `38%` | `clamp(1.25px,3.1%,2.6px)` / `.26` / `.3` / `72%` |
| `--lg-ink` | `#221E4A` | `#F8FAFC` |

**Common fallback:** with no JS or a failed gate, the base blur+saturate+brightness, painted specular and bezel remain. With the live backdrop graph, those painted rim stand-ins are removed and the saturated displaced backdrop feeds the specular ring. Reduced transparency uses `--lg-fill-flat` and removes filters; forced colors uses `Canvas`, `CanvasText` and a real border. Bend needs structured imagery behind the surface; a flat page can look unchanged.

## Navigation bar

```html
<nav class="lg lg--backdrop glass-nav" aria-label="Primary">
  <a href="/">Home</a><a href="/docs">Docs</a>
</nav>
```
```css
.glass-nav { position: fixed; inset: 0 0 auto; display: flex; gap: 8px; padding: 8px; }
```

- **Classes/tokens:** base `.lg`, gated `.lg--backdrop`; default `20px` radius.
- **Light/dark:** base fill `.08` white / `.65` navy; border `.28` / `.08` white; ink `#221E4A` / `#F8FAFC`.
- **Fallback:** common contract; Safari/Firefox keep readable frosted navigation when backdrop bend is unavailable.
- **Pitfall — S15:** if the rim remains but bend disappears, check for a live `url()` and filter node before changing tokens.

## Toolbar

```html
<div class="lg lg--backdrop glass-toolbar" role="toolbar" aria-label="Editor">
  <button type="button">Bold</button><button type="button">Italic</button>
</div>
```
```css
.glass-toolbar { display: flex; gap: 8px; padding: 8px; }
```

- **Classes/tokens:** `.lg lg--backdrop`; base rim and radius tokens. Put plain buttons in the carrier, not nested `.lg` buttons.
- **Light/dark:** base fill `.08` white / `.65` navy; saturation `180%` / `140%`; border `.28` / `.08`.
- **Fallback:** common contract; the toolbar remains one frosted control strip without displacement.
- **Pitfall — S29:** nested glass stacks fills into opaque milk; keep one toolbar carrier and de-nest any shared button primitive.

## Tab bar

```html
<nav class="lg lg--backdrop glass-tabs" aria-label="Sections">
  <a href="#now" aria-current="page">Now</a><a href="#saved">Saved</a>
</nav>
```
```css
.glass-tabs { display: flex; gap: 8px; padding: 8px; }
.glass-tabs a { padding: 7px 10px; }
```

- **Classes/tokens:** one `.lg lg--backdrop` around the list; do not make every tab a second glass panel.
- **Light/dark:** base fill `.08` / `.65`; rim top `.55` / `.06`; radius `20px` in both themes.
- **Fallback:** common contract; selected-tab styling remains ordinary foreground/background styling.
- **Pitfall — S05:** a fixed-thickness active-tab band reads as a static stripe; do not confuse selection paint with the material rim.

## Floating card

```html
<aside class="lg glass-card" aria-labelledby="card-title">
  <h2 id="card-title">Now playing</h2><p>Floating detail</p>
</aside>
```
```css
.glass-card { padding: 18px 20px; }
/* Add lg--backdrop only when this card floats above a structured backdrop. */
```

- **Classes/tokens:** `.lg` for a static card; add `.lg--backdrop` only to a floating card. Ordinary content cards should use the app's standard material instead.
- **Light/dark:** base fill `.08` white / `.65` navy; flat fallback `.72` white / `.88` navy; no resting drop shadow on dark glass.
- **Fallback:** common contract; static cards intentionally omit the bend class and retain frost/specular/bezel.
- **Pitfall — S19:** if something feels unnamed but wrong, measure the backdrop's luminance structure before tuning the card fill.

## Modal / sheet

```html
<section class="lg lg-strong lg--backdrop glass-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
  <h2 id="sheet-title">Details</h2><button type="button">Close</button>
</section>
```
```css
.glass-sheet { padding: 18px 20px; overflow: hidden; }
/* Fade a separate scrim, never opacity on .glass-sheet. */
```

- **Classes/tokens:** `.lg-strong` is reserved for transient modals/drawers; `.lg--backdrop` adds the gated bend.
- **Light/dark:** strong fill `rgba(252,252,252,.32)` / `rgba(34,30,74,.88)`; border `.28` / `.08`; default radius `20px`.
- **Fallback:** common contract; strong fill and flat reduced-transparency fill preserve dialog readability.
- **Pitfall — S24:** opacity on the filter carrier can leave ghost blur; split scrim and panel motion. Check portalled controls before retaining `overflow:hidden`.

## Dropdown / popover

```html
<div class="lg lg-strong lg--backdrop glass-menu" role="menu">
  <button type="button" role="menuitem">Rename</button>
  <button type="button" role="menuitem">Duplicate</button>
</div>
```
```css
.glass-menu { padding: 8px; }
```

- **Classes/tokens:** strong floating-menu tier with gated bend; apply at the shared Dropdown/Popover primitive.
- **Light/dark:** strong fill `.32` off-white / `.88` navy; production floating-menu wash values are `.35` light / `.32` dark when regenerating a menu-specific graph (`src: measured`).
- **Fallback:** common contract; blur/saturation and strong fill remain without `backdrop-filter:url()`.
- **Pitfall — S30:** Chrome-to-iPhone breakage is the SVG-backdrop support wall, not a menu token problem; retain fallback or use explicit-texture WebGL2.

## Button and circular FAB

```html
<button type="button" class="lg lg--backdrop glass-button">Continue</button>
<button type="button" class="lg lg--backdrop glass-fab" aria-label="Add">+</button>
```
```css
.glass-button { padding: 7px 10px; }
.glass-fab { --lg-radius: 50%; inline-size: 64px; aspect-ratio: 1; padding: 0; }
.glass-fab::before, .glass-fab::after { display: none; } /* no painted/pointer rim on icon buttons */
```

- **Classes/tokens:** base tier; circular geometry comes from the `convex_circle` surface family. The drop-in regenerates maps for measured geometry; use the optics skill for custom surface/light tuning.
- **Light/dark:** base fill `.08` white / `.65` navy; border `.28` / `.08`; ink `#221E4A` / `#F8FAFC`.
- **Fallback:** common contract, except the FAB intentionally has no painted/pointer rim; blur, fill and accessible label remain.
- **Pitfall — S27:** a large percentage-sized pointer glow becomes a flashlight; the FAB removes that effect rather than enlarging it.

## Search field

```html
<label class="lg lg-inset glass-search">
  <span>Search</span><input type="search" name="query">
</label>
```
```css
.glass-search { --lg-radius: 21px; display: flex; gap: 8px; padding: 7px 10px; }
```

- **Classes/tokens:** `.lg-inset`; no `.lg--backdrop`, no decorative rim/sheen. `21px` is the restored original searchbox radius; this inset recipe intentionally omits backdrop refraction.
- **Light/dark:** inset uses base fill `.08` white / `.65` navy; border `.28` / `.08`; flat fallback `.72` / `.88`.
- **Fallback:** common contract for an inset well: concave inner shadow and blur remain; reduced transparency makes the well flat/opaque.
- **Pitfall — S09:** “transparent, even the edges” indicates a zero-floored feather mask, not merely weak fill.

## Sidebar

```html
<aside class="lg lg-dark lg--backdrop glass-sidebar" aria-label="Library">
  <a href="#all">All items</a><a href="#favorites">Favorites</a>
</aside>
```
```css
.glass-sidebar { padding: 18px 20px; }
```

- **Classes/tokens:** `.lg-dark` supplies the structural ink fill and on-dark text; gated bend is allowed for the floating/drawer variant.
- **Light/dark:** `--lg-fill-dark` is `rgba(34,30,74,.65)` in light and `.88` in dark; text is `#F8FAFC`; border remains `.28` / `.08` white.
- **Fallback:** common contract; dark fill plus rim/bezel supplies separation without a resting drop shadow.
- **Pitfall — S12:** dark mode looks flat when fill is effectively opaque or a resting shadow turns it into moulded plastic; check opacity, shadow, then dim law.

## Slider (active only)

```html
<label class="lg lg--backdrop glass-slider">
  <span>Volume</span><input type="range" min="0" max="100" value="50">
</label>
```
```css
.glass-slider { display: flex; gap: 8px; padding: 7px 10px; }
/* Add these material classes only while the control is activated. */
```

- **Classes/tokens:** base tier only during interaction; the source slider preset uses `convex_circle`, radius `20px`, and a `280×40` reference surface. The canonical drop-in map remains approximate outside `320×42`.
- **Light/dark:** base fill `.08` white / `.65` navy; radius `20px`; saturation `180%` / `140%`.
- **Fallback:** common contract while active; after interaction remove the glass classes and return to the ordinary control.
- **Pitfall — S33:** the map and painted corner must share geometry; do not stretch a squircle map onto a different active-thumb shape.

## React and Tailwind v4

**React:** load the two shared assets once in the HTML/app entry, then use `className`; no wrapper is required for the material.

```jsx
export function FloatingCard({ children }) {
  return <aside className="lg lg--backdrop glass-card">{children}</aside>;
}
```

Keep ordinary content cards on the standard component. Apply at shared `Card`/`Modal`/`Dropdown` primitives and audit every rendered surface.

**Tailwind v4:** plain classes are valid, so the same `lg lg--backdrop` markup works with utilities such as `fixed inset-x-0 top-0`. Keep position at the call site, not inside a custom material utility. For a variant-enabled layout utility, register layout only and leave the optical declarations in the blessed CSS:

```css
@import "tailwindcss";
@utility glass-dock {
  display: flex;
  align-items: center;
  gap: 8px;
}
```
```html
<nav class="lg lg--backdrop glass-dock fixed inset-x-0 top-0">…</nav>
```

Do not create an `lg*` breakpoint-colliding namespace, put `@supports` beside a same-named utility, or add a second filter graph. If CSS-first `@theme` colors are needed, use the exact token values in `../../shared/references/12-tailwind-v4.md`; computed colors belong in variables, not unreliable arbitrary `color-mix()` class values. No Vue or Angular variant is included because the shipped sources do not provide one.
