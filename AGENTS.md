# AGENTS.md

This repository is **Liquid Glass Suite** — Apple Liquid Glass agent skills for web
pages, packaged as a Claude Code plugin and an Agent Skills collection.

## Install it intact

Do **not** copy a single `skills/<name>` folder as a standalone skill. All four
skills reference `../../shared/...`, so the suite must stay together.

```text
/plugin marketplace add admos98/liquid-glass-suite
/plugin install liquid-glass-suite@admos98-skills
```

Generic Agent Skills CLI:

```sh
npx skills add admos98/liquid-glass-suite
```

That installs the repository as **one skill** carrying the whole suite, because the
CLI copies only a skill folder and the four task skills reference `../../shared/...`.
The installed entry (`liquid-glass-suite`) is a router: do the task from
`skills/<name>/SKILL.md` inside the installation.

## The four skills

| Skill | Job |
|---|---|
| `liquid-glass` | Apply: drop-in CSS/JS recipes for nav, tabs, cards, sheets, menus, buttons, search, sidebar, sliders |
| `liquid-glass-optics` | CSS/SVG displacement, reflective rim, WebGL2, the standalone showcase |
| `liquid-glass-debug` | S01–S33 symptom triage, Chromium/WebKit quirks, pixel measurement |
| `liquid-glass-native` | SwiftUI/UIKit/AppKit, DocC-checked declarations, availability fallbacks |

## Rules for working in this repository

- Run `npm ci && npm run verify` before claiming a pass. Report what actually ran.
- Read `shared/references/15-honesty-and-checklists.md` before quoting any numeric
  claim. Apple publishes no numeric Liquid Glass specification.
- Native Apple samples are **not** compiled here. Do not report a native-runtime pass.
- Playwright Chromium is not a real iPhone. Do not infer device behaviour from it.
- `tests/test_package.py` enforces contracts, including byte budgets on `README.md`
  and each `skills/*/SKILL.md`. Re-run the suite after editing either.
- Do not add a fifth folder under `skills/` without updating `SKILLS` in
  `tests/test_package.py`; the test asserts exactly four folder names.
- Do not add a `skills` key to `.claude-plugin/plugin.json`; standard `skills/`
  discovery is asserted.

## Layout

| Path | Contents |
|---|---|
| `skills/` | The four published skills |
| `shared/assets/` | CSS/JS drop-in, WebGL2 renderer, standalone showcase |
| `shared/references/` | Sixteen implementation, browser, measurement and honesty references |
| `shared/scripts/` | Displacement-map, edge-profile and chroma-retention tools |
| `tests/` | Package contracts, browser suite, evidence transcript |
| `evals/` | Ten agent benchmark prompts (results table intentionally empty) |
| `docs/` | README imagery, comparison, and the Pages landing files |
