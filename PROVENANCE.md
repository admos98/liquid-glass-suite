# Provenance and clean-room record

## Credit

Technique follows the approach explained in kube's 'Liquid Glass in the Browser' (kube.io/blog/liquid-glass-css-svg) — the guide this project learned from. The implementation in this repository is an independent clean-room implementation; no kube.io code or assets are included, and this project is not affiliated with kube.io or Apple.

Final status on 2026-11-07: **clean-room replacement, disposal, rebuild and verification completed**. The inherited files identified below were replaced or removed as recorded; the statement above describes the final public tree.

## Audit and disposition

| File or block | Origin determination | Required disposition |
|---|---|---|
| `shared/assets/showcase/optics.js` | Declared an external faithful port; profile sweep, map construction, specular values, demo bundle, and UI coupling are derivative. | Delete the engine construction and write a new SDF-gradient/vector-Snell engine, state flow, controls, light model, and exports. |
| `shared/assets/liquid-glass.js` | The suite restructure copied the same profile/specular construction into the default scaffold. | Replace with an independent per-pixel SDF implementation; retain only generic gate/fallback behavior and the authored pointer interaction. |
| `shared/assets/webgl-glass.js` | Renderer implements the old reference blend/dim contract; independent authorship of every block cannot be established. | Treat as derivative and rewrite the renderer, shaders, dim path, and final composition. |
| `shared/assets/showcase/controller.js` | Product adapter for renderer switching, input, accessibility, and status, but coupled to old globals and claims. | Retain the feature concept, rewrite integration against the new engine, and remove resemblance language. |
| `shared/assets/showcase/template.html` | Suite-facing layout and controls may remain; external preset labels, attribution comments, defaults, and renderer copy may not. | Keep the general UI structure; replace labels, control model, defaults, preset IDs, plate IDs, and copy. |
| `shared/assets/showcase.html` | Generated file containing the old engine and assets. | Delete and regenerate solely from the new source. |
| `shared/assets/showcase/backgrounds/` | Plate independence is not established; identical plates also exist in the old comparison baseline. | Remove all eight and author new procedural SVG plates for this suite. |
| `shared/assets/showcase/source-manifest.json` | Records the old playground lineage and preserved values. | Delete; this file supersedes it. |
| `tests/reference/` | Bundled external implementation, artwork, manifests, and resemblance target. | Delete the entire directory; never use it as a test target again. |
| `tests/browser/showcase.spec.mjs` | Enforces old map bytes and zero-pixel external parity alongside useful behavior tests. | Delete resemblance tests; write contract/property tests and suite-owned snapshot assertions. |
| `tests/baselines/` | Does not yet exist. | Generate only from the new engine in a named real browser; commit those screenshots. |
| `shared/references/07-webgl-shader.md`, `14-showcase.md` | Describe the old renderer and reference-production split. | Rewrite for the clean engine and exact suite-authored preset table. |
| Other shared references | Mixture of suite field notes, browser quirks, general SVG facts, and resemblance-era directives. | Retain general material/debug knowledge; remove instructions to copy or match an external implementation and update paths/claims. |
| `NOTICE`, `README`, `shared/references/16-sources.md` | Describe unresolved inherited-code licensing and prior research lineage. | Replace with the loud technique credit and accurate clean-room/MIT scope after disposal. |
| `PUBLISHING-BLOCKED.md` | Gate for the inherited implementation. | Remove only after the inherited implementation and assets have actually been disposed of and the new checks pass. |
| `MIGRATION_MAP.md` | Development history, including prior migration decisions and a historical test transcript. | Retain as history, add clean-room dispositions, and mark superseded license/replica decisions. It is not a runtime source or a baseline. |

## Independent derivation

The replacement uses a rounded-rectangle signed-distance field evaluated independently at each pixel. The analytic SDF gradient supplies the outward direction; a shape-family height function supplies local slope; a three-component vector form of Snell's law produces lateral travel. No one-dimensional profile table is rotated around the shape.

- The four height equations are mathematical shape families, not copied implementation blocks.
- Displacement uses the SVG-standard R=X/G=Y encoding with 128 neutral and a documented pixel-range budget.
- Specular light uses a suite-selected direction, a cubic forward-facing lobe, and a linear rim window. The opposite side receives zero light.
- Every preset lives in `shared/assets/showcase/presets.json` with its own derivation note. The values are product design choices for the suite's plates, not transcriptions.
- Map sampling is one bitmap pixel per CSS pixel as an explicit production budget. Panel limits bound work to 640×320 pixels.
- The visual targets are numerical optical properties and screenshots captured from this new engine only.

Clean-room work started on 2026-11-07. Final disposal counts, preset verification, browser evidence, and any remaining unverified items will be appended after the implementation and checks.

## Origin of retained material

- `LICENSE`: Moslem Adib's MIT license for original suite material.
- `skills/`, `evals/`, package/plugin manifests, general recipes, measurement scripts, and synthetic measurement fixtures: authored for this suite or retained from the author's package, with no external showcase code required.
- `shared/assets/showcase/plates/`: eight original deterministic procedural SVG artworks authored for this suite.
- `shared/assets/showcase/presets.json`: seven original product-tuning bundles authored for this suite, each with a derivation note.
- `tests/baselines/`: three screenshots authored by running this suite's new engine.

## Final disposal and verification record

- Removed the entire bundled external comparison tree (11 files), eight inherited showcase plates, the inherited source manifest and resemblance spec, the old generated showcase, and the obsolete publishing gate. No renamed copy of those implementation/artwork/baseline files remains in the public tree.
- Replaced the shared scaffold optics and WebGL2 renderer rather than retaining uncertain blocks. The temporary field adapter was removed after its independently written core became the single inline source shared by the drop-in and standalone builder.
- Generated a new 85,167-byte standalone showcase from the clean core, seven validated presets and eight owned plates. The generated file contains no external script/link or runtime network URL.
- Authored `css-navigation.png`, `webgl-media.png`, and `split-loupe.png` from the new engine in Chromium 153.0.8010.0 with software WebGL2, visually inspected them, and passed a separate no-update screenshot run.
- Final executed checks: standalone freshness; 16/16 Python package/measurement tests; all shipped/test JS/MJS syntax checks; 11/11 Chromium behavior/property/accessibility tests; exact seven-row preset-table comparison; clean-room language, disposal/migration, empty-eval and whitespace audits. C01–C20 are verified in `tests/SHOWCASE_CONTRACT.md`.
- Unchanged synthetic measurement fixtures retain their own numeric outputs. The derivative optical constant assignments and identifiers were removed; unrelated measurement examples are not treated as optical preset provenance.
- Claude CLI validation, real Safari/iPhone and native Apple runtimes remain unrun and are not claimed.

Pre-existing git history is not rewritten by this clean-room pass; its disposition is the repository owner's decision.
