# Migration map: Ultimate Liquid Glass 1.1.0 to Liquid Glass Suite 2.0.0

Development record only; runtime skills do not require this file. The historical product name appears here solely to identify the source tree. This map was written before any file move.

## Standalone restoration addendum (2026-11-07)

This addendum supersedes the clean-room addendum for the current tree. The owner requested the original engine back with standalone packaging/reference text. Historical clean-room entries below remain development history only.

| Clean-room-era path | Current restoration |
|---|---|
| `shared/assets/showcase/optics.js` | Original engine restored from pre-restructure source; standalone header/branding only. |
| `shared/assets/showcase/controller.js`, `template.html` | Original adapter/UI restored; current `shared/` reference paths and standalone labels. |
| `shared/assets/webgl-glass.js`, `liquid-glass.js` | Original WebGL2 renderer and strategy-1 drop-in restored. |
| `shared/assets/showcase/plates/`, `presets.json` | Removed with the clean-room engine. |
| `shared/assets/showcase/backgrounds/`, `source-manifest.json` | Eight original plates and lineage manifest restored. |
| `shared/assets/showcase.html` | Regenerated from restored original sources. |
| `tests/browser/optics.spec.mjs`, `tests/baselines/` | Removed; replaced by original-behavior tests in `tests/browser/showcase.spec.mjs` with no external comparison target. |
| `PROVENANCE.md`, `NOTICE`, `README.md`, `shared/references/` | Current standalone/original-lineage documentation; earlier independent-authorship claims withdrawn. |

## Clean-room addendum (written before the 2026-11-07 replacement)

This addendum supersedes earlier replica-preservation and unresolved-inherited-code decisions. The old implementation and comparison artifacts are not retained in new “reference” folders.

| Current file | Clean-room destination |
|---|---|
| `shared/assets/showcase/optics.js` | Replaced clean-room (`PROVENANCE.md`); new UI orchestration uses `field.js` and `presets.json`. |
| `shared/assets/liquid-glass.js` | Replaced clean-room with per-pixel SDF optics (`PROVENANCE.md`). |
| `shared/assets/webgl-glass.js` | Replaced clean-room renderer and shaders (`PROVENANCE.md`). |
| `shared/assets/showcase/controller.js` | Rewritten adapter against the clean engine; product behavior follows `tests/SHOWCASE_CONTRACT.md`. |
| `shared/assets/showcase/template.html` | Retains only the suite UI concept; rewritten labels, controls, presets, and plates. |
| `shared/assets/showcase.html` | Old generated file deleted; regenerated from clean sources only. |
| `shared/assets/showcase/source-manifest.json` | Deleted; superseded by `PROVENANCE.md`. |
| `shared/assets/showcase/backgrounds/` (8 SVGs) | Deleted; replaced by suite-authored `shared/assets/showcase/plates/` (8 procedural SVGs). |
| `tests/reference/` | Deleted in full, including the old baseline, artwork, and manifests. |
| `tests/browser/showcase.spec.mjs` | External resemblance tests deleted; replaced by contract/property tests and own-baseline assertions. |
| `evals/06-reference-parity.md` | `evals/06-optical-properties.md` — rewritten for clean mathematical property verification. |
| `tests/SHOWCASE_CONTRACT.md`, `tests/baselines/`, `shared/assets/showcase/presets.json` | New clean-room contract, product data, and suite-owned visual evidence. |
| `PUBLISHING-BLOCKED.md` | Removed after actual disposal and verification; earlier gate remains below only as history. |

## Architecture decisions

- The installable unit is one plugin with four skills under `skills/`; the former root `SKILL.md` is split by task rather than copied four times.
- `shared/assets/liquid-glass.css` and `.js` are the default application path. WebGL2 through the optics skill is the second path. The showcase is reference evidence, not an application scaffold.
- The old scaffold lacked the source graph's saturated, displaced backdrop clipped by a specular map. The shared JS now ports the showcase's convex-squircle/Snell displacement and specular-map builders at production 1x sampling, adds plain/saturated branches and 33-sample production wash tables (light `.12` / dark `.14`), and retains fresh filter IDs and the additive probe. Painted CSS rim/bezel layers remain documented fallback dress and are removed only when the live backdrop graph owns the rim. CSS also applies the existing readable ink tokens, removes inset/input rim decoration, and documents the production/showcase dim boundary.
- References keep their substantive sections and `src:` tags. Paths are renumbered; the superseded 1.1 migration guide is folded into this file instead of shipped as a second migration map.
- kube.io is described as a research platform and technical reference, not as the owner of this suite. Existing copied/inherited-code provenance and the unresolved license boundary remain visible; no permission or public-release readiness is asserted.

## Reference-block disposition

| Current reference and unique blocks | Destination | Disposition |
|---|---|---|
| `references/strategy-picker.md`: surface decision, four mechanisms, Safari trap, engine specifics, chain order, support floor | `shared/references/01-strategy-picker.md`; router summary in `skills/liquid-glass-optics/SKILL.md` | Retain all sections; update paths and make scaffold/WebGL2 the two application paths. |
| `references/css-scaffold.md`: base CSS, four layers, reflective-ring code, tokens, material rules, squircles, de-nesting, accessibility, session notes, drop-in | `shared/references/02-css-scaffold.md`; recipes and Skill A summaries | Retain full reference; assemble surface recipes without adding unsupported optical values. |
| `references/dim-and-rim.md`: wash law, rim properties/tokens/listener, collisions, geometry, surface scope, arm delay, worked examples | `shared/references/03-dim-and-rim.md`; Skill C and recipes | Retain all sections and numeric provenance. |
| `references/svg-filter-graph.md`: branch routing, dispersion, maps, parity, scale verification, rewrites, inventories | `shared/references/04-svg-filter-graph.md`; Skill B router | Retain all sections; source for scaffold reflective-rim upgrade. |
| `references/chromium-quirks.md`: alpha, edges, ID caches, asymmetric bend, transforms, delivery/map/engine checks, extracted code | `shared/references/05-chromium-quirks.md`; Skill C router | Retain all sections. |
| `references/safari-webkit.md`: URL backdrop bug, caches, video, promoted children, escaping, fixed layers/OS material, source conflict | `shared/references/06-safari-webkit.md`; Skills B/C | Retain all sections and conflicts. |
| `references/webgl-shader.md`: renderer, hybrid contract, color modes, scroll/idle, parity, scope | `shared/references/07-webgl-shader.md`; Skill B router | Retain all sections. |
| `references/performance.md`: scroll diagnosis/lock, idle/viewport gates, cost levers, fixed ladder, compositor lab | `shared/references/08-performance.md`; Skill B/C routers | Retain all sections and both map budgets. |
| `references/motion.md`: origin, timing, veil split, RTL, companion geometry, hover, backdrop roots, arm delay, accessibility | `shared/references/09-motion.md`; Skill C router | Retain all sections. |
| `references/measurement.md`: pixel reading, chain delivery, transmission/chroma, probes, live/material audits, minifier traps, fixtures | `shared/references/10-measurement.md`; Skill C commands | Retain all sections and exact command behavior. |
| `references/failure-catalogue.md`: S01–S33, diagnostic order, decision numbers | `shared/references/11-failure-catalogue.md`; Skill C entry | Retain the complete catalogue; Skill C links directly to its symptom table. |
| `references/tailwind-v4.md`: CSS tokens, `@utility`, naming, cascade, contrast, depth, asset boundary | `shared/references/12-tailwind-v4.md`; `skills/liquid-glass/recipes.md` | Retain reference; assemble one short framework section. |
| `references/native-apple.md`: system-first SwiftUI, DocC signature, containers, UIKit/AppKit, accessibility, primary links | `shared/references/13-native-apple.md`; Skill D condensation | Retain full reference and verified declarations. |
| `references/showcase.md`: preservation, controls, reference/production split, rebuild, integration, browser scope | `shared/references/14-showcase.md`; Skill B | Retain all sections; showcase opened here first, never required by Skill A. |
| `references/honesty-and-checklists.md`: provenance/tags, conflicts, Apple rules, native appendix, ship/verification/integrity/work/release rules, scope | `shared/references/15-honesty-and-checklists.md`; Skill C verification gate | Retain all sections; only stale paths/product framing change. |
| `references/sources.md`: authorship/license, research lineage, peers, native/platform/packaging links, evidence scope | `shared/references/16-sources.md`; README honesty section | Retain links and limits; research-platform wording avoids unsupported ownership claims. |
| `references/migration.md`: install corrections, reference preservation, production exceptions, native fixes, WebGL2, input/a11y, measurement, license | Historical section below and this map's file tables | Fold into dev-only history; intentionally cut as a shipped reference because it describes 1.1 installation and duplicates current docs. No technical block is dropped. |

## File-by-file move table

| Current file | Destination(s) |
|---|---|
| `.claude-plugin/plugin.json` | `.claude-plugin/plugin.json` (2.0.0; auto-discovered `skills/`) |
| `.gitignore` | `.gitignore` (retain; add only local eval-result ignores if needed) |
| `LICENSE` | `LICENSE` (unchanged) |
| `NOTICE` | `NOTICE` (carried verbatim; unresolved license boundary retained) |
| `README.md` | `README.md` (rewritten as suite front door) |
| `SKILL.md` | `skills/liquid-glass/SKILL.md`, `skills/liquid-glass-optics/SKILL.md`, `skills/liquid-glass-debug/SKILL.md`, `skills/liquid-glass-native/SKILL.md`; detailed routing remains in shared references |
| `assets/liquid-glass.css` | `shared/assets/liquid-glass.css` (production header and additive optical-rim integration) |
| `assets/liquid-glass.js` | `shared/assets/liquid-glass.js` (paint gate, displacement + specular maps, reflective SVG graph, pointer listener) |
| `assets/webgl-glass.js` | `shared/assets/webgl-glass.js` (behavior retained; names/comments/paths updated) |
| `assets/showcase.html` | `shared/assets/showcase.html` (regenerated, not hand-edited) |
| `assets/demo.html` | Intentionally cut: a three-line redirect to the old showcase adds no recipe or runtime behavior. |
| `assets/showcase/template.html` | `shared/assets/showcase/template.html` |
| `assets/showcase/optics.js` | `shared/assets/showcase/optics.js` (source optics retained; also source for shared scaffold rim graph) |
| `assets/showcase/controller.js` | `shared/assets/showcase/controller.js` (names/paths updated) |
| `assets/showcase/source-manifest.json` | `shared/assets/showcase/source-manifest.json` (unchanged provenance data) |
| `assets/showcase/backgrounds/bg-{d,e,f,g}-{light,dark}.svg` (8 files) | `shared/assets/showcase/backgrounds/` with identical filenames and bytes |
| `references/*.md` (17 files) | `shared/references/01-` through `16-` per block table; `migration.md` folded here |
| `scripts/build-showcase.mjs` | `scripts/build-showcase.mjs` (development builder; source/output paths updated) |
| `scripts/chroma-retention.py` | `shared/scripts/chroma-retention.py` (behavior unchanged) |
| `scripts/edge-profile.py` | `shared/scripts/edge-profile.py` (behavior unchanged) |
| `scripts/measure-displacement-map.py` | `shared/scripts/measure-displacement-map.py` (behavior unchanged) |
| `tests/test_package.py` | `tests/test_package.py` (paths and strengthened suite contracts updated; measurement assertions retained) |
| `tests/browser/showcase.spec.mjs` | `tests/browser/showcase.spec.mjs` (showcase path/product names updated; assertions retained) |
| `tests/README.md` | `tests/README.md` (commands and scope updated) |
| `tests/evidence/verification.txt` | `tests/evidence/verification.txt` (original transcript preserved verbatim below; this file contains only freshly executed 2.0.0 output) |
| `tests/fixtures/chroma-retention.txt` | `tests/fixtures/chroma-retention.txt` (script paths updated; numeric fixture output unchanged) |
| `tests/fixtures/{lens-map,rim-swatch,glow-swatch,cutout-swatch}.png` | `tests/fixtures/` with identical filenames and bytes |
| `tests/reference/source-manifest.json` | `tests/reference/source-manifest.json` (unchanged baseline manifest) |
| `tests/reference/azmoon/index.html` | `tests/reference/azmoon/index.html` (unmodified baseline) |
| `tests/reference/azmoon/playground.js` | `tests/reference/azmoon/playground.js` (unmodified baseline) |
| `tests/reference/azmoon/assets/backgrounds/bg-{d,e,f,g}-{light,dark}.svg` (8 files) | Same relative paths under `tests/reference/azmoon/`; unmodified baseline bytes |
| `package.json`, `package-lock.json` | Same paths; suite name/version and shared script paths updated |
| `playwright.config.mjs` | Same path; test discovery retained |

## New files with no 1.1 source

- `.claude-plugin/marketplace.json`, `PUBLISHING-BLOCKED.md`
- `skills/liquid-glass/recipes.md` (assembled only from the mapped scaffold/token/rim/failure/showcase sources)
- `evals/README.md` and ten prompt files (expectations limited to shipped behavior)

## Historical 1.1 notes retained from `references/migration.md`

- The former package corrected installation by putting README and `SKILL.md` at package root and pointing its plugin at that directory. Suite 2.0 replaces that layout with auto-discovered skill folders.
- The generated showcase preserves Azmoon source builders, defaults, historical linear dim, and original SVG graph. Its eight backgrounds remain embedded for offline use.
- Production defaults remain 1 map pixel per CSS pixel with a 1024px general cap, a conservative 512px Safari SVG-path budget, and highlight-weighted wash clamped to `[0, 0.5]`. Showcase 2x maps and linear dim are parity exceptions, not production defaults.
- Native corrections remain: container `spacing` is a merge threshold; UIKit uses `UIVisualEffectView(effect:)`; `RoundedRectangle(cornerRadius:)` is explicit; no undocumented host or `isEnabled:` parameter is invented.
- WebGL2 accepts explicit backdrop/displacement/specular/dim inputs and restores CSS on failure. It does not claim arbitrary DOM capture, dispersion, Fresnel, caustics, or pixel-identical CSS output.
- Imported settings validate atomically; clipboard errors stay errors; keyboard, labels, mobile layout, reduced motion/transparency, and forced colors remain tested behavior.
- Measurement saturation clamps channels and rejects invalid input. Synthetic fixtures test tools, not browsers or native rendering.
- MIT applies only to rights the author can grant. The unresolved inherited-code license remains a publishing blocker; no Apache or third-party permission is inferred.

## Historical 1.1 verification transcript

The original `tests/evidence/verification.txt` is preserved verbatim below as history. It is not a 2.0.0 result; the evidence file now contains only fresh suite runs.

```text
$ npm run verify
> ultimate-liquid-glass@1.1.0 verify
> npm run check:showcase && npm run test:package && npm test


> ultimate-liquid-glass@1.1.0 check:showcase
> node scripts/build-showcase.mjs --check

PASS: standalone showcase matches its editable source exactly.

> ultimate-liquid-glass@1.1.0 test:package
> python -m unittest discover -s tests -v

test_cli_rejects_out_of_range_wash (test_package.ChromaMath.test_cli_rejects_out_of_range_wash) ... ok
test_css_saturation_clamps_channels (test_package.ChromaMath.test_css_saturation_clamps_channels) ... ok
test_highlight_weighted_wash_keeps_black_fixed (test_package.ChromaMath.test_highlight_weighted_wash_keeps_black_fixed) ... ok
test_edge_fixture_classes_are_distinct (test_package.MeasurementFixtures.test_edge_fixture_classes_are_distinct) ... ok
test_fixture_lens_map_is_a_real_pass (test_package.MeasurementFixtures.test_fixture_lens_map_is_a_real_pass) ... ok
test_warm_cream_retention_matches_the_documented_fixture (test_package.MeasurementFixtures.test_warm_cream_retention_matches_the_documented_fixture) ... ok
test_general_cap_and_webkit_budget_are_explicit (test_package.PackageContract.test_general_cap_and_webkit_budget_are_explicit) ... ok
test_native_rules_do_not_force_unintended_shape_merging (test_package.PackageContract.test_native_rules_do_not_force_unintended_shape_merging) ... ok
test_shipped_internal_references_resolve (test_package.PackageContract.test_shipped_internal_references_resolve) ... ok
test_showcase_is_self_contained_and_skill_branded (test_package.PackageContract.test_showcase_is_self_contained_and_skill_branded) ... ok
test_skill_name_and_plugin_path_match_the_installable_directory (test_package.PackageContract.test_skill_name_and_plugin_path_match_the_installable_directory) ... ok

----------------------------------------------------------------------
Ran 11 tests in 0.647s

OK

> ultimate-liquid-glass@1.1.0 test
> playwright test


Running 20 tests using 1 worker

  ok  1 [chromium] › tests\browser\showcase.spec.mjs:64:1 › standalone file works offline and creates both real maps (358ms)
  ok  2 [chromium] › tests\browser\showcase.spec.mjs:77:1 › every preset has the same map bytes, profile and dim law as Azmoon (1.9s)
CSS parity: {"browser":"chromium","version":"149.0.7827.55","rows":[{"preset":"searchbox","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"preset":"switch","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"preset":"slider","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"preset":"player","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"preset":"magnifier","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"preset":"panelA","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"preset":"panelB","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"surface":"convex_circle","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"surface":"convex_squircle","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"surface":"concave","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0},{"surface":"lip","width":800,"height":400,"changedPixels":0,"meanChannelDelta":0,"maxChannelDelta":0}]}
  ok  3 [chromium] › tests\browser\showcase.spec.mjs:88:1 › CSS backdrop pixels exactly match Azmoon across panel presets and surfaces (6.7s)
  ok  4 [chromium] › tests\browser\showcase.spec.mjs:117:1 › WebGL2 draws real optical changes and comparison mode keeps CSS (1.0s)
  ok  5 [chromium] › tests\browser\showcase.spec.mjs:133:1 › WebGL2 unavailable keeps the CSS fallback usable (326ms)
  ok  6 [chromium] › tests\browser\showcase.spec.mjs:147:1 › reduced transparency pauses optics and restores the chosen renderer (645ms)
  ok  7 [chromium] › tests\browser\showcase.spec.mjs:161:1 › invalid imported state is rejected without partially mutating settings (324ms)
  ok  8 [chromium] › tests\browser\showcase.spec.mjs:173:1 › small viewport has no document overflow and arrow keys move the glass (343ms)
  ok  9 [chromium] › tests\browser\showcase.spec.mjs:184:1 › exports use package tokens and failed clipboard does not claim success (325ms)
  ok 10 [chromium] › tests\browser\showcase.spec.mjs:200:1 › forced colors disables optical rendering (325ms)
  ok 11 [webkit] › tests\browser\showcase.spec.mjs:64:1 › standalone file works offline and creates both real maps (516ms)
  ok 12 [webkit] › tests\browser\showcase.spec.mjs:77:1 › every preset has the same map bytes, profile and dim law as Azmoon (2.9s)
  -  13 [webkit] › tests\browser\showcase.spec.mjs:88:1 › CSS backdrop pixels exactly match Azmoon across panel presets and surfaces
  ok 14 [webkit] › tests\browser\showcase.spec.mjs:117:1 › WebGL2 draws real optical changes and comparison mode keeps CSS (1.9s)
  ok 15 [webkit] › tests\browser\showcase.spec.mjs:133:1 › WebGL2 unavailable keeps the CSS fallback usable (510ms)
  ok 16 [webkit] › tests\browser\showcase.spec.mjs:147:1 › reduced transparency pauses optics and restores the chosen renderer (1.3s)
  ok 17 [webkit] › tests\browser\showcase.spec.mjs:161:1 › invalid imported state is rejected without partially mutating settings (501ms)
  ok 18 [webkit] › tests\browser\showcase.spec.mjs:173:1 › small viewport has no document overflow and arrow keys move the glass (403ms)
  ok 19 [webkit] › tests\browser\showcase.spec.mjs:184:1 › exports use package tokens and failed clipboard does not claim success (619ms)
  ok 20 [webkit] › tests\browser\showcase.spec.mjs:200:1 › forced colors disables optical rendering (483ms)

  1 skipped
  19 passed (22.9s)
Exit code: 0

```
