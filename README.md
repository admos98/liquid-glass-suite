# Liquid Glass Suite

**Liquid Glass is refraction, not blur — this suite ships CSS/SVG and WebGL2 paths plus tools to measure the bend.**

> Technique follows the approach explained in kube's 'Liquid Glass in the Browser' (kube.io/blog/liquid-glass-css-svg) — the guide this project learned from. The implementation in this repository is an independent clean-room implementation; no kube.io code or assets are included, and this project is not affiliated with kube.io or Apple.

One repository, one Claude Code plugin, four task-focused skills over a shared clean-room core. Start with the apply skill; open the interactive showcase for optics work.

## Skills

| Skill | Fires when | Use for |
|---|---|---|
| [`liquid-glass`](skills/liquid-glass/SKILL.md) | “make this glass”, glassmorphism, frosted/translucent UI, glass nav/card/modal | Drop-in and plain-CSS-first recipes for navigation, toolbar, tabs, cards, sheets, menus, buttons, search, sidebar and sliders |
| [`liquid-glass-optics`](skills/liquid-glass-optics/SKILL.md) | SVG graphs, reflective rim, WebGL2, Safari true-refraction strategy | Offline showcase, per-geometry SDF maps, renderer choice and mathematical optical checks |
| [`liquid-glass-debug`](skills/liquid-glass-debug/SKILL.md) | Bend missing, Chrome works/iPhone fails, rim looks painted, glass looks plastic | S01–S33 symptom triage, Chromium/WebKit quirks, pixel measurements and verification gate |
| [`liquid-glass-native`](skills/liquid-glass-native/SKILL.md) | SwiftUI/UIKit/AppKit, `glassEffect`, native custom buttons | System-first APIs, DocC-checked declarations and older-OS/accessibility fallbacks |

## Install

For users with access to the private repository, register its marketplace and install the plugin:

```text
/plugin marketplace add admos98/liquid-glass-suite
/plugin install liquid-glass-suite@admos98-skills
```

The marketplace entry points at the repository root (`source: "./"`), and Claude Code auto-discovers all four folders under `skills/`.

**Manual install:** copy the entire `liquid-glass-suite` folder into the agent's skills area, then expose each `skills/<name>` folder in its skill scan path using the agent's supported folder-link mechanism. Each folder name matches its frontmatter `name`. Keep the suite intact because its `../../shared/...` references must resolve. For a local Claude Code run without marketplace installation, `claude --plugin-dir /path/to/liquid-glass-suite` loads the same unit.

## Shared core and two application paths

| Path | Purpose |
|---|---|
| [`shared/assets/liquid-glass.css`](shared/assets/liquid-glass.css) + `.js` | Default app path: tokens, themes, conservative gate, per-pixel rounded-rectangle SDF/vector-Snell maps, wash graph and fallback |
| [`shared/assets/webgl-glass.js`](shared/assets/webgl-glass.js) | Explicit-texture WebGL2 path using the same maps and highlight-weighted wash |
| [`shared/assets/showcase.html`](shared/assets/showcase.html) | Self-contained interactive clean-room showcase; no server, build, network or external assets needed to open it |
| [`shared/assets/showcase/`](shared/assets/showcase/) | Editable template, state/control layer, seven JSON presets and eight suite-authored procedural plates |
| [`shared/references/`](shared/references/) | Sixteen implementation, browser, measurement and honesty references |
| [`shared/scripts/`](shared/scripts/) | Displacement-map, edge-profile and chroma-retention measurement tools |

There are exactly two application paths: the shared CSS/JS drop-in by default, or WebGL2 through optics for explicit textures/Safari true-refraction briefs. Both use one bitmap pixel per CSS pixel, the same highlight-weighted wash, and the same clean mathematical core. The showcase is a product demonstration, not a third application architecture.

## Verify

```sh
npm ci
python -m pip install Pillow
node scripts/build-showcase.mjs --check
python -m unittest discover -s tests -v
node --check shared/assets/liquid-glass.js
node --check shared/assets/webgl-glass.js
node --check shared/assets/showcase/optics.js
node --check shared/assets/showcase/controller.js
npm test
```

The dev-only Chromium package supplies the Linux test runtime; on another platform use `PLAYWRIGHT_SYSTEM_CHROMIUM=1` after `npx playwright install chromium`. Run `claude plugin validate .` when the Claude Code CLI is available. [`tests/evidence/verification.txt`](tests/evidence/verification.txt) records actual runs. [`evals/`](evals/) contains ten agent benchmarks with empty results tables.

## Honesty, provenance and license

- Apple publishes no numeric Liquid Glass specification. Keep `src: apple-hig | community | figma | measured` distinctions; browser heuristics are not Apple requirements.
- CSS syntax support is not paint evidence. Name the renderer, browser, geometry and fallback in every optical claim. Playwright is not a real iPhone, and native samples are not a native-runtime pass.
- [`PROVENANCE.md`](PROVENANCE.md) records per-file disposal/origin, independent architecture, constants, presets, specular model, tests and plate ownership. [`tests/SHOWCASE_CONTRACT.md`](tests/SHOWCASE_CONTRACT.md) records behavior verification or explicit untested items.
- Original suite code, documentation, tests, procedural plates and suite-generated screenshots are under [`LICENSE`](LICENSE) (MIT), to the extent the author holds those rights. No external implementation or comparison baseline is bundled.
- Pre-existing git history is not rewritten; its disposition is the repository owner's decision. Apple, Liquid Glass, SwiftUI and SF Symbols are trademarks of Apple Inc.; this independent project is not affiliated with or endorsed by Apple.
