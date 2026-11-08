# Showcase survival contract

Inventory date: 2026-11-07. This contract records user-visible behavior before the clean-room rewrite. “Replacement” marks behavior that intentionally changes because its only purpose was external-reference resemblance.

Verification status is recorded per item after implementation. `UNTESTED` is not a pass.

| ID | Contract item | Acceptance evidence | Status |
|---|---|---|---|
| C01 | One standalone `shared/assets/showcase.html` opens through `file://` without a server, build step, network, or external assets. | Browser blocks HTTP(S); document loads with no page error or external script/link. | Verified |
| C02 | CSS+SVG and WebGL2 renderers consume the same displacement/specular maps; compare mode keeps both stages alive. | Select each renderer; both draw; split shows both; returning to CSS hides only the WebGL canvas. | Verified |
| C03 | WebGL2 failure leaves a usable CSS preview and a visible fallback status. | Force `getContext('webgl2')` to return null; status contains “CSS fallback”. | Verified |
| C04 | Pointer drag, arrow keys, and reset move the interactive panel. | Pointer and keyboard positions change; reset returns to the center. | Verified |
| C05 | Preview floats over structured, non-flat plates authored for this suite; generated image mode also works. | Switch every plate and generated background; no network request occurs. | Verified |
| C06 | Convex circle, convex squircle, concave, and lip remain selectable mathematical shape families. | Each surface button rebuilds valid maps without errors. | Verified |
| C07 | Live controls cover specular strength, saturation, refraction, blur, light angle, background opacity, dim, bezel, thickness, displacement gain, radius, width, and height. | Every control changes validated state and refreshes output. | Verified |
| C08 | Seven product preset buttons remain: navigation/search bar, toggle switch, slider, media player, loupe lens, app banner, and app menu. | Each applies its complete suite-authored bundle atomically; documentation matches every number. | Verified |
| C09 | URL/settings import validates a complete candidate before mutation; invalid or unknown values leave prior state untouched. | Exercise malformed, non-finite, out-of-range, wrong-shape, and unknown-key inputs. | Verified |
| C10 | CSS tokens, integration tokens, and JSON export remain copyable; clipboard failure never reports success. | Inspect exports; force clipboard and fallback copy to fail; toast says “Copy failed”. | Verified |
| C11 | Reduced transparency pauses optics and restores the requested renderer when disabled. | WebGL draw count remains fixed while paused; prior renderer returns afterward. | Verified |
| C12 | Forced colors disables optical rendering; reduced motion removes toast transitions. | Emulate media preferences and inspect canvas/filter/transition state. | Verified |
| C13 | Small viewports have no document overflow; keyboard focus remains visible and all preview movement is keyboard-operable. | 375px viewport, horizontal overflow check, arrow-key movement, visible outline. | Verified |
| C14 | Map preview, cross-section visualization, and displacement chart remain live. | Each canvas has non-blank output and updates after a preset change. | Verified |
| C15 | Replacement optical property: panel-center displacement is neutral and center content is not displaced. | Center samples are R≈128/G≈128 and zero decoded shift. | Verified |
| C16 | Replacement optical property: displacement becomes nonzero near edges, with left/right symmetry inside tolerance and a flat interior. | Numeric map probes assert these properties for every surface. | Verified |
| C17 | Replacement optical property: specular intensity peaks on the light-facing edge and is zero on the opposite edge. | Numeric specular-map probes at matching edge samples. | Verified |
| C18 | Replacement visual regression: screenshots come from the new engine only. | Suite-owned CSS, WebGL2, and split snapshots are generated and committed, then compared by tests. | Verified |
| C19 | The three measurement scripts and their existing fixtures retain behavior. | Python fixture tests pass unchanged. | Verified |
| C20 | External-reference pixel comparisons and bundled resemblance baselines are removed, not replaced by a renamed target. | No old baseline directory or comparison test remains; property tests and own snapshots are the only visual targets. | Verified |

## Replacement notes

- Preset values, ranges, defaults, light model, map sampling, and specular falloff are suite design decisions; none is accepted solely because it appeared in an external demo.
- CSS/WebGL screenshots are allowed to differ at rasterization edges. Contract tests require real drawing and optical properties, not cross-renderer pixel identity.
- Browser evidence must name the actual runtime. If no browser is available, C01–C18 remain explicitly untested rather than being inferred from source.

## Verification record — 2026-11-07

- C01–C18: verified in Chromium 153.0.8010.0 on Linux with software WebGL2. The final `npm test` run executes 11 tests without snapshot-update mode. C12 uses explicit CDP emulation for `prefers-reduced-transparency`; C03 forces WebGL2 context failure; C08 also has an exact JSON/Markdown table assertion in the Python suite.
- C15–C17: numeric `ImageData` probes, including per-surface center/symmetry/edge checks and reversed-light samples. These are independent properties, not external comparisons.
- C18: `css-navigation.png`, `webgl-media.png`, and `split-loupe.png` were generated from this engine, visually inspected, and then passed the separate no-update run.
- C19: all 16 Python tests pass, including the three unchanged measurement-fixture groups.
- C20: clean-room language, derivative-identifier, disposal/migration, internal-reference, and self-containment audits pass. Only the three owned PNGs are visual baselines.

Real Safari/iPhone and native Apple runtimes were not tested; no such claim is made. The full transcript and environment are in `tests/evidence/verification.txt`.
