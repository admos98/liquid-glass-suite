---
name: liquid-glass
description: Use when asked to "make this glass", glassmorphism, frosted or translucent UI, Apple-like UI, or a glass nav/card/modal/dropdown. Drop-in CSS recipes for navigation, tab bars, cards, sheets, buttons, search, sidebars, sliders, React and Tailwind v4.
---

# Liquid Glass

**Refraction, not blur: glass is the floating layer, never the content.**

## 60-second path

From this skill's directory, copy the two blessed files into the app:

```sh
cp ../../shared/assets/liquid-glass.css /path/to/app/
cp ../../shared/assets/liquid-glass.js /path/to/app/
```

```html
<link rel="stylesheet" href="liquid-glass.css">
<script src="liquid-glass.js"></script><!-- before the first glass element -->
<nav class="lg lg--backdrop">Navigation</nav>
```

Every browser keeps blur+saturate; bend is additive and enabled only by the paint probe plus the conservative Chromium gate. Use `lg--backdrop` on floating surfaces; omit it for static cards and inset inputs.

## Recipe index

Open [`recipes.md`](recipes.md) for minimal HTML, theme tokens, fallback and the surface's pitfall.

| Surface | Use when | Classes | Notes |
|---|---|---|---|
| Navigation bar | Floating top nav | `lg lg--backdrop` | Floating chrome, not page content |
| Toolbar | Controls over content | `lg lg--backdrop` | Keep the toolbar above the content layer |
| Tab bar | Floating tabs | `lg lg--backdrop` | One carrier around the tab list |
| Floating card | Popover-like card | `lg` (+ gated bend if floating) | Ordinary content cards stay standard material |
| Modal / sheet | Transient overlay | `lg lg-strong lg--backdrop` | Few, transient strong surfaces |
| Dropdown / popover | Floating menu | `lg lg-strong lg--backdrop` | Strong fill aids readability |
| Button / FAB | Floating action or control | `lg lg--backdrop` | No pointer rim on an icon-only FAB |
| Search field | Inset input | `lg lg-inset` | Concave fill; no displacement or rim |
| Sidebar | Structural dark overlay | `lg lg-dark lg--backdrop` | Dark fill and on-dark text |
| Slider | Only while activated | `lg lg--backdrop` | Transient glass exception |

Framework variants are in the final section of `recipes.md`.

## Three rules

1. **Floating layer, not content:** navigation and overlays get glass; lists, tables, media and ordinary content cards do not.
2. **Tint colorless:** keep the material's tint neutral; let the refracted/saturated backdrop supply color.
3. **Never animate opacity on a `backdrop-filter` carrier:** fade a separate scrim and keep motion off the filter element.

## Escalation

Bend/rim/Safari/reference-matching problems → `liquid-glass-optics` for strategy/parity or `liquid-glass-debug` for symptom-led diagnosis.
SwiftUI/UIKit/AppKit → `liquid-glass-native`.

Part of liquid-glass-suite — install the suite, not this folder alone.
