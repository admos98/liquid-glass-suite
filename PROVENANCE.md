# Provenance and standalone restoration

## Current status

On 2026-11-07, at the repository owner's request, the clean-room optics replacement was withdrawn and the original showcase engine was restored. “Standalone” means the showcase is self-contained and works offline without a server, build step, network, framework, or external assets. It does **not** mean independently authored or clean-room code.

The current public tree restores the original profile/map/specular behavior, preset values, 2× sampling, historical linear RGB dim, controller, WebGL2 renderer, default drop-in, and eight original background plates. Suite packaging and the `shared/` layout are retained.

## Source lineage

- Original showcase source: the author's Azmoonsaz reference playground, commit `0fa31b94a86efb6390fd52f53d61b76464acf6bc`.
- Origin source SHA-256: `8e1d62095057b0b74d2857b286a03b9cc05da9617c348a364fadad5fece3263c`.
- Technique and inherited implementation attribution: Chris Feijoo (kube), “Liquid Glass in the Browser,” https://kube.io/blog/liquid-glass-css-svg/.
- Restoration source in git history: pre-restructure commit `93be32eccf4cb1a2d853fe6a839196ec62d3686d`.

`shared/assets/showcase/source-manifest.json` records the origin and preserved blocks. `NOTICE` retains the attribution and license boundary. No permissive license for substantial inherited upstream implementation was established; the author's MIT license does not grant third-party rights.

## Current file origins

| File or directory | Current origin and restoration action |
|---|---|
| `shared/assets/showcase/optics.js` | Original profile, map, specular, graph, state, and presets restored from pre-restructure source; standalone header and badge text changed only. |
| `shared/assets/showcase/controller.js` | Original renderer/input/accessibility adapter restored; source/reference header paths updated. |
| `shared/assets/webgl-glass.js` | Original explicit-texture WebGL2 renderer restored; standalone/reference header updated. |
| `shared/assets/liquid-glass.js` | Original strategy-1 SVG lens injector and capability gate restored; reference paths updated. |
| `shared/assets/liquid-glass.css` | Suite CSS/tokens/accessibility retained; header describes the restored original strategy-1 drop-in and the showcase's separate 2× optics. |
| `shared/assets/showcase/template.html` | Original layout, controls, ranges, and presets restored; suite branding and standalone labels/reference paths changed. |
| `shared/assets/showcase/backgrounds/` | Eight original SVG plates restored. |
| `shared/assets/showcase/source-manifest.json` | Original lineage manifest restored. |
| `shared/assets/showcase.html` | Regenerated solely from the restored editable sources and plates by `scripts/build-showcase.mjs`. |
| `shared/references/04-svg-filter-graph.md`, `07-webgl-shader.md`, `14-showcase.md`, `16-sources.md` | Restored-model documentation with current `shared/` paths and no bundled external comparison target. |
| `tests/browser/showcase.spec.mjs` | Behavior tests for the restored original values and 2× maps; no external pixel-parity target. |
| `tests/baselines/` | Removed with the clean-room engine; the current suite has no screenshot baseline directory. |
| `shared/assets/showcase/plates/`, `presets.json` | Clean-room-only assets removed. |
| `MIGRATION_MAP.md` | Historical development record, including the superseded clean-room phase; a restoration addendum identifies the current mapping. |

## Verification scope

The restored engine is checked by direct offline browser tests for the exact seven original preset bundles and 2× map sizes, surfaces, live controls, plates, CSS/SVG, WebGL2, split mode, interaction, URL/state validation, exports, and accessibility fallbacks. Package tests retain the four-skill structure, shared references, measurement fixtures, and standalone build checks.

Final command results are recorded in `tests/evidence/verification.txt`. Real Safari/iPhone, native Apple runtimes, and Claude CLI validation are not inferred from those tests.

Pre-existing git history is not rewritten. Earlier clean-room and restructure commits remain historical; their disposition is the repository owner's decision.
