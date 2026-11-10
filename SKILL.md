---
name: liquid-glass-suite
description: Use for Apple Liquid Glass on web pages — HTML/CSS, SVG displacement maps, WebGL2 refraction, React, Tailwind v4, Safari/WebKit fallbacks, optical measurement, debugging and native Apple views. Installs the whole suite, because its four skills share assets and references.
---

# Liquid Glass Suite

**Refraction, not blur.** One suite, four skills over a shared core.

This is the install entry point for generic Agent Skills CLIs. It exists because
those CLIs copy only a skill folder, and the four skills below share assets they
would otherwise lose. Installing this skill carries the whole suite intact.

## What ships with this skill

| Path | Contents |
|---|---|
| `skills/liquid-glass/` | Apply: drop-in CSS/JS recipes, `recipes.md` |
| `skills/liquid-glass-optics/` | SVG displacement, reflective rim, WebGL2, showcase |
| `skills/liquid-glass-debug/` | S01–S33 symptom triage, WebKit quirks, pixel measurement |
| `skills/liquid-glass-native/` | SwiftUI/UIKit/AppKit, DocC-checked declarations |
| `shared/assets/` | The two blessed files, the WebGL2 renderer, the standalone showcase |
| `shared/references/` | Sixteen implementation, browser, measurement and honesty references |
| `shared/scripts/` | Displacement-map, edge-profile and chroma-retention tools |

## Route the request

- Build a glass nav, card, sheet, menu, button, search field, sidebar or slider →
  `skills/liquid-glass/SKILL.md`
- Bend or rim is wrong, glass looks like plastic, Chrome works and iPhone does not,
  or optics need measuring → `skills/liquid-glass-debug/SKILL.md`
- Choosing an SVG graph vs a WebGL2 path, tuning maps, programmatic properties,
  reference matching → `skills/liquid-glass-optics/SKILL.md`
- SwiftUI, UIKit or AppKit, `glassEffect`, native buttons and fallbacks →
  `skills/liquid-glass-native/SKILL.md`

Do not load every reference. Each skill names the file it needs.

## Non-negotiables

- **Keep the suite intact.** The four skills reference `../../shared/...`. Copying
  one skill folder alone breaks it.
- **Liquid Glass is the navigation/overlay layer, never the content layer.**
- **No number here is Apple's.** Apple publishes no numeric Liquid Glass
  specification; every value is tagged `apple-hig`, `community`, `figma` or
  `measured`. Read `shared/references/15-honesty-and-checklists.md` before quoting one.
- **Verify before claiming.** Run `shared/scripts/` measurement tools and the tests.
  Playwright Chromium is not a real iPhone, and native samples are not compiled here.

Part of liquid-glass-suite — install the suite, not this folder alone.
