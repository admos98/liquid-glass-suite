# Tailwind v4 recipes

Purpose: glass surfaces as `@utility` blocks, the build traps that delete them, and the cascade rules that silently override them.

Read when: the project uses Tailwind v4, or a glass utility is present in source but absent from `dist/*.css`.
Skip if: plain CSS is enough (→ 02-css-scaffold.md) or the defect is a symptom (→ 11-failure-catalogue.md).

Summary:
- Tailwind v4 prefers CSS-first `@theme`; legacy JavaScript config can be loaded explicitly with `@config`.
- Use `@utility` for a utility that needs Tailwind variants; ordinary component CSS classes are also valid.
- Never name a utility `lg*` (breakpoint collision). Use `glx*`.
- A custom `@utility` must not set `position`; `@supports` must be nested *inside* it.
- Global resets go in `@layer base`; grep the built CSS for token names.

## §Tokens in CSS, not in a JS config

Tailwind v4 defaults to CSS-first configuration (`@theme`). A legacy JavaScript config is still possible with an explicit `@config` directive; it is not auto-detected. Reference them in markup via arbitrary values: `bg-[var(--color-accent)]`.

```css
@import "tailwindcss";
@theme {
  --color-glass-surface: rgba(255,255,255,0.72);
  --color-glass-surface-dim: rgba(255,255,255,0.45);
  --color-glass-border: rgba(255,255,255,0.40);
  --color-glass-highlight: rgba(255,255,255,0.60);
  --color-glass-dark: rgba(34,30,74,0.88);
  --color-glass-dark-border: rgba(255,255,255,0.08);
  --color-glass-dark-highlight: rgba(255,255,255,0.06);
  --color-ink: #221E4A;
  --color-text-on-dark: #F8FAFC;
}
```

`color-mix()` inside `@theme` values works, but arbitrary-value colour functions in `className=` (e.g. `bg-[color-mix(...)]`) are unreliable in JIT. Put computed colours in CSS custom properties under `@theme` and reference via `var(--token)` in class strings. Plain-CSS projects use `--lg-*` tokens instead. → see shared/references/02-css-scaffold.md §2.

## §Surfaces as `@utility`, never plain classes

Use **`@utility`** when a material should participate in Tailwind variants. Plain component classes remain valid CSS; `@apply` resolution depends on the utility being available in that build. Inspect emitted CSS before blaming a class name.

```css
@utility glx {
  background: rgba(252,252,252,0.32);
  border: 1px solid rgba(255,255,255,0.45);
  backdrop-filter: blur(20px) saturate(1.5) brightness(1.05);
  -webkit-backdrop-filter: blur(20px) saturate(1.5) brightness(1.05);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.60),
    inset 0 -1px 1px rgba(0,0,0,0.035),
    inset 1px 0 1px rgba(255,255,255,0.19),
    inset -1px 0 1px rgba(255,255,255,0.16),
    0 10px 40px rgba(34,30,74,0.10);
}
@utility glx-strong { /* blur(40px) + url(#lg-displace) displacement (Chromium) + stronger specular/bezel */ }
@utility glx-dark { /* rgba(34,30,74,0.65) ink fill + inverted specular */ }
@utility glx-inset { /* concave: inverted inner shadow for inputs */ }
```

- `url(#lg-displace)` = one SVG `<filter id="lg-displace">` rendered once at app root. One filter on the largest ancestor, not stacked per card.
- `saturate(1.5)` light / `saturate(1.4)` dark is what reads "liquid" vs fog. Plain blur reads as fog.
- Safari/Firefox don't render the SVG-backdrop bend in documented engine behaviour — displacement falls through to `blur()`; specular + bezel carry the effect. The bend is confirmed on the owner-tested iPhone Safari; frost is the floor elsewhere. → see shared/references/06-safari-webkit.md §1.
- Each tier needs a visibly different recipe (alpha, blur, radius, shadow, specular) and exactly one job — recipes without hierarchy read as one flat material.

## §Never name a utility `lg*`

The `lg:` breakpoint prefix does not categorically invalidate classes named `lg` or `lg-strong`. Use `glx` here as a clear project namespace and investigate `Cannot apply unknown utility class lg` as a build/registration issue rather than a language prohibition. Legacy aliases must inline full declarations, not `@apply`, so old `.glass-1/2/3` classes can be upgraded in one sed pass without touching component files.

## §Cascade traps

**Prefer a scoped, verified capability enhancement inside the material utility.** A reported build dropped a sibling selector; do not turn that toolchain observation into a universal Tailwind rule. `@supports` alone validates grammar, not paint. The split is load-bearing: Safari does not degrade gracefully on `backdrop-filter: url(…)`, it treats the whole declaration as invalid and **drops it**. A surface whose only backdrop-filter is `url()` renders with no glass at all. The base rule must always carry `blur()`, with `url()` layered on under `@supports`.

```css
/* WRONG — Tailwind v4 strips a plain selector whose name collides with a
   registered @utility, so the entire @supports block disappears from the
   build. No error, no test, no type or lint signal. */
@supports (backdrop-filter: url("#x")) {
  .glx-refract { backdrop-filter: url('#lg-lens') blur(4px); }
}
@utility glx-refract { /* base blur only */ }

/* Scoped enhancement: only a verified/conservatively gated renderer adds it. */
@utility glx-refract {
  -webkit-backdrop-filter: blur(4px) saturate(1.1);
  backdrop-filter: blur(4px) saturate(1.1);
  [data-lg-refraction='backdrop'] & {
    -webkit-backdrop-filter: blur(4px) saturate(1.1) url('#lg-lens');
    backdrop-filter: blur(4px) saturate(1.1) url('#lg-lens');
  }
}
```

Only reading `dist/*.css` catches this. The minifier rewrites the condition to a prefixed form (`@supports ((-webkit-backdrop-filter:url(#x)) or (backdrop-filter:url(#x)))`), so a verification regex written against your own source syntax reports a false negative — match the declaration, not the condition. → see shared/references/10-measurement.md §Minifier traps.

**A custom `@utility` must not set `position`.** With no `@layer` wrapper it competes with Tailwind's position utilities and the later declaration wins, silently overriding `fixed` on call sites. Keep positioning a call-site concern. A `::before` with no positioned ancestor anchors to a distant ancestor and wraps the wrong box, silently.

```css
/* WRONG — silently overrides `fixed` on every glass-edge call site */
@utility glass-edge { position: relative; isolation: isolate; }

/* RIGHT — isolate only; positioning stays a call-site concern */
@utility glass-edge { isolation: isolate; }
```

Call sites carry `relative` only when they do not already have a positioning utility: `fixed` and `absolute` are already anchors, and adding `relative` there would break them. Audit with `grep -rn 'className="[^"]*glass-edge' src --include="*.tsx"`.

**A correct declaration that renders wrong is a cascade bug, not a typo.** Tailwind v4 emits `@utility` inside `@layer utilities`; any unlayered rule beats all of them regardless of specificity. Put global resets in `@layer base` — a bare `* { border-color: transparent }` left at the top of the stylesheet overrides the glass border on every panel in both themes, with tokens resolving correctly. Unlayered project CSS that redefines `--ease-out` etc. silently replaces Tailwind's own theme values app-wide — grep the built CSS for token names before defining new ones.

## §Contrast

`text-white` on a translucent light-glass surface renders ~4.5:1 against a light page — borderline for body, failing for fine print; on sky/warm bgs it degrades further.
- Audit: grep `text-white` on every `glx`/`glass-*` surface. Exception: `text-white` on solid dark panels is fine.
- Fix: dark ink token on light glass; the known-good on-dark text token on `glx-dark`. Never assume white is legible on a translucent surface — verify against the underlying bg. → see shared/references/02-css-scaffold.md §3.

## §Depth scale

`glx` (cards) < `glx-strong` (floating menus/modals, `blur(40px)`) < `glx-dark` (structural dark, e.g. sidebar). Each tier needs a visibly different recipe (alpha, blur, radius, shadow, specular) and exactly one job — recipes without hierarchy read as one flat material.

## §Asset

Plain-CSS equivalent of these tokens and the 4-layer anatomy is in `shared/assets/liquid-glass.css`. Tailwind stays here; do not mix `@utility` syntax into the drop-in CSS file. → see shared/references/02-css-scaffold.md §2.
