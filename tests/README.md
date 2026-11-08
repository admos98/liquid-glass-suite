# Verification

Run from the suite root:

```bash
npm ci
python -m pip install Pillow
npm run verify
```

On an externally managed Python installation:

```bash
python -m venv .venv
.venv/bin/python -m pip install Pillow
.venv/bin/python -m unittest discover -s tests -v
```

The Playwright config uses the dev-only packaged Chromium runtime on Linux and extracts its bundled runtime libraries. For an installed system Playwright browser, use `PLAYWRIGHT_SYSTEM_CHROMIUM=1 npm test`; the usual setup is `npx playwright install chromium`.

`npm run verify` checks the standalone build, Python package/fixture contracts and Chromium behavior. The browser suite loads `shared/assets/showcase.html` directly through `file://` with networking offline. It checks both renderers, split mode, all eight owned plates, optical map properties, exact presets, atomic state, interaction, exports, accessibility preferences, mobile layout and visible fallbacks.

The only screenshot assertions are the three suite-owned images in `tests/baselines/`, captured from the clean engine in Chromium 153 with software WebGL2. Update them deliberately with `npm test -- --update-snapshots` after an intended visual change, then run `npm test` without update mode. No external image or implementation is a comparison target.

The synthetic map/rim/glow/cutout fixtures validate measurement tools, not a browser. The current chroma output is in `tests/fixtures/chroma-retention.txt`; saturation clamps channels.

Actual output belongs in `tests/evidence/verification.txt`. An unavailable browser or CLI is reported as untested, never converted to a pass. Desktop Chromium is not a real-device Safari/iPhone check, and native examples are not native-runtime passes.
