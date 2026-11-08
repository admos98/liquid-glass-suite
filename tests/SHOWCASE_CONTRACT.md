# Standalone original-showcase contract

Restoration date: 2026-11-07. This contract replaces the clean-room acceptance matrix after the owner requested the original engine back. “Standalone” means self-contained offline packaging, not independent implementation authorship.

| ID | Restored behavior | Evidence | Status |
|---|---|---|---|
| C01 | `shared/assets/showcase.html` opens through `file://` with no server, build, network, or external assets. | Offline Chromium load; no HTTP(S) requests or page errors. | Verified |
| C02 | Original displacement/specular maps use 2× CSS geometry and neutral center R/G. | Default map is 640×84 for a 320×42 panel; center bytes are checked. | Verified |
| C03 | All seven original presets and exact values remain: searchbox, switch, slider, player, magnifier, panelA, panelB. | Every button applies every documented value and expected 2× map size. | Verified |
| C04 | Convex circle, convex squircle, concave, lip, and every live control remain functional. | Surface/state checks and all input IDs; diagnostic canvases are nonblank. | Verified |
| C05 | Original plate selectors and generated image mode work without external assets. | Six original plate buttons plus generated PNG mode. | Verified |
| C06 | CSS+SVG retains the original graph and conservative fallback behavior. | Live filter exists; Chromium badge and computed behavior are checked. | Verified |
| C07 | WebGL2 draws real optical changes; split mode keeps CSS alive; returning to CSS hides the canvas. | Draw count, before/after optical-state screenshots, both stages, and renderer restoration. | Verified |
| C08 | Pointer drag, arrow keys, reset, visible focus, and small-viewport layout survive. | 375px overflow, pointer/keyboard positions, reset to original `(0.5, 0.46)`, focus outline. | Verified |
| C09 | State validation is atomic and valid URL state restores. | Unknown, non-finite, malformed, wrong-shape, and compound-invalid inputs; reload after valid state. | Verified |
| C10 | CSS/integration/JSON exports use package tokens and clipboard failure is honest. | Export contents plus forced clipboard and `execCommand` failure. | Verified |
| C11 | Reduced transparency pauses optics and restores the requested renderer. | Draw count remains fixed while paused; WebGL2 returns afterward. | Verified |
| C12 | Forced colors disables optics and reduced motion removes toast transitions. | Emulated media and computed backdrop/canvas/transition checks. | Verified |
| C13 | Radius simulation, displacement chart, and map preview remain live. | All three canvases produce nonblank output after control changes. | Verified |
| C14 | Existing measurement scripts and fixtures retain behavior. | Python fixture tests pass unchanged. | Verified |
| C15 | Headers/references describe standalone packaging with accurate original lineage; no external comparison baseline is bundled. | `NOTICE`, `PROVENANCE.md`, source manifest, current `shared/` references, and package audits. | Verified |

## Verification record

Browser evidence is from the named Chromium runtime with software WebGL2. The suite compares WebGL output before and after changing this showcase's own optical state only to prove that drawing changes; it does not compare against an external implementation or image.

The final transcript is in `tests/evidence/verification.txt`. Real Safari/iPhone, native Apple runtimes, and Claude CLI validation are not claimed.
