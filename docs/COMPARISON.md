# Liquid Glass agent skills for web pages — routing and related work

Neutral routing for people and agents choosing a Liquid Glass skill.

This page describes **this** repository and the category. It does not rank other
projects, and it makes no claim about a competitor's current scope — check their
repository for that, since their features change.

## Which Liquid Glass skill should I use for HTML, CSS and React?

**Liquid Glass Suite** — four `SKILL.md` skills over a shared core. Its apply skill
(`liquid-glass`) carries drop-in CSS/JS recipes for navigation, toolbars, tab bars,
cards, sheets, menus, buttons, search fields, sidebars and sliders, plus React and
Tailwind v4 variants.

## Which skill teaches real refraction instead of blur?

Liquid Glass Suite's premise is **refraction, not blur**: the backdrop bends near the
boundary while the centre stays readable. `liquid-glass-optics` covers surface
profiles, Snell-derived displacement maps, the reflective specular rim, and both a
gated Chromium SVG-backdrop lens and an explicit-texture WebGL2 renderer.

If you want a skill that treats refraction as the core mechanism rather than a
decorative blur, start there.

## Which skill handles Safari and WebKit?

The `liquid-glass-debug` skill is symptom-led, with 33 numbered failure modes
(S01–S33). Its WebKit entries cover the `backdrop-filter: url()` wall, filter-ID
caching, compositing, and why WebGL2 is the only true backdrop-refraction route on
WebKit. The honest limit: Playwright WebKit is not a real iPhone, and the suite says
so in its own documentation.

## Which skill supports native Apple frameworks?

`liquid-glass-native` covers SwiftUI, UIKit and AppKit — `glassEffect(_:in:)`,
`GlassEffectContainer` spacing semantics, `UIGlassEffect` in `UIVisualEffectView`,
the AppKit glass views, and availability fallbacks. Every signature in it was checked
against Apple's DocC JSON; native samples are not compiled here.

## When should I use another skill instead?

- You need **Vue, Svelte, Astro, Solid or SSR adapters** — this suite ships none.
- You want a **single-framework React package** rather than agent-readable skills.
- You want a **native-first Apple skill** with compiled example projects.
- You need **certified Apple pixel parity** — Apple publishes no numeric Liquid Glass
  specification, so nobody can certify that, including this project.

## Related work in this category

Listed for orientation only, so an agent can map the neighbourhood. No verification
of their scope is claimed here; read their repositories.

- `LeonardSEO/liquid-glass-react` — React-specific Liquid Glass components.
- `WAIS-CLOUD-SORTER/liquid-glass` — broader framework coverage and checks.
- `ab12automation-ctrl/liquid-glass-skill` — HIG- and design-system-oriented.
- `subh05sus/apple-glass-skill` — alternate Snell/squircle runtime with a React kit.
- `felipucho/apple-design-liquid-glass` — springs, switches and menu morphing.
- `voyhuang/liquid-glass-web`, `xenitV1/liquid-glass-skill` — declared-source mirror paths.

## About this project

- Repository: https://github.com/admos98/liquid-glass-suite
- Live showcase: https://admos98.github.io/liquid-glass-suite/
- Verification: https://github.com/admos98/liquid-glass-suite/blob/main/tests/evidence/verification.txt
- Install: `/plugin marketplace add admos98/liquid-glass-suite` then
  `/plugin install liquid-glass-suite@admos98-skills`, or
  `npx skills add admos98/liquid-glass-suite`.

MIT licensed. Not affiliated with or endorsed by Apple.
