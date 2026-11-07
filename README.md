# Ultimate Liquid Glass

**Real bends. Reflective rims. A showcase you can open offline.**

A focused agent skill for building and debugging Liquid Glass in CSS/SVG, WebGL2, and native Apple interfaces. The standalone reference preserves the approved Azmoon playground optics instead of replacing them with blur and a painted border.

## Open the showcase

Open [`assets/showcase.html`](assets/showcase.html) directly in your browser. No install, server, build, or network is required.

- **CSS + SVG** — pixel-identical to the Azmoon reference in the tested Chromium scenes.
- **WebGL2** — the same optical maps through an explicit texture renderer.
- **Compare both** — switch rendering paths without removing either engine.
- Surface presets, live controls, keyboard movement, reduced transparency, and exported settings.

The CSS comparison produced **zero changed pixels** across seven presets and four surface checks in Chromium 149.0.7827.55. WebGL2 works in the tested Chromium and Playwright WebKit runtimes; it is not claimed to be pixel-identical to CSS or a real-device Safari pass.

## Use the skill

Clone the private repository with your authenticated Git client:

```bash
git clone https://github.com/admos98/ultimate-liquid-glass.git
```

Place the complete `ultimate-liquid-glass` folder in your agent's skills directory. Keep the folder name aligned with `name: ultimate-liquid-glass` in [`SKILL.md`](SKILL.md). The references, assets, and scripts travel with it; no parent README or companion skill is required.

For Claude Code, `.claude-plugin/plugin.json` points at the root directory containing `SKILL.md`.

## Inside

| Artifact | Purpose |
|---|---|
| [`SKILL.md`](SKILL.md) | Decision rules and load-on-demand reference map. |
| [`assets/showcase.html`](assets/showcase.html) | Self-contained interactive reference. |
| [`references/showcase.md`](references/showcase.md) | Optical scope, renderer API, and integration contract. |
| [`references/native-apple.md`](references/native-apple.md) | Corrected native declarations and container-spacing guidance. |
| [`references/migration.md`](references/migration.md) | Changes from the supplied package. |
| [`references/sources.md`](references/sources.md) | Attribution, license boundaries, and primary sources. |
| [`tests/README.md`](tests/README.md) | Reproducible verification and its limits. |

## Verify or rebuild

The showcase itself has no dependencies. Development checks use Node, Python, Pillow, and Playwright:

```bash
npm ci
python -m pip install Pillow
npx playwright install chromium webkit
npm run verify
```

Use the Python interpreter and package installer that belong to the same environment. Rebuild the offline file with `npm run build:showcase`; `npm run check:showcase` detects stale generated output.

## Intentional boundaries

- The reference keeps Azmoon's original linear dim and 2× map sampling. Production wash and map budgets are separate, explicitly documented modes.
- WebGL requires an explicit image/texture source; it does not capture arbitrary DOM.
- The legacy CSS/JS scaffold is not the faithful reference renderer.
- Browser tests are named-engine evidence, not a claim about every phone or native SDK.

## Attribution and license

Author package: MIT. Optical lineage: Chris Feijoo's [kube.io research](https://kube.io/blog/liquid-glass-css-svg/) and the author's Azmoonsaz playground. See [`NOTICE`](NOTICE) and [`references/sources.md`](references/sources.md) for the unresolved upstream site-code licensing boundary before public redistribution.

Private repository. Independent recreation; not affiliated with Apple.
