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

The Playwright config uses the dev-only packaged Chromium runtime on Linux. For an installed system Playwright browser, use `PLAYWRIGHT_SYSTEM_CHROMIUM=1 npm test`; the usual setup is `npx playwright install chromium`.

`npm run verify` checks the standalone build, Python package/fixture contracts, and restored browser behavior. The 11 browser tests load `shared/assets/showcase.html` directly through `file://`. They verify the exact seven original preset bundles and 2× map sizes, all surfaces and live controls, original plates, generated background, CSS/SVG, WebGL2, split mode, interaction, URL/state validation, exports, and accessibility fallbacks.

No external implementation, image, or pixel baseline is a comparison target. WebGL optical-change checks compare two states of this same showcase; they are not external resemblance tests. The synthetic map/rim/glow/cutout fixtures validate measurement tools, not a browser.

Actual output belongs in `tests/evidence/verification.txt`. An unavailable browser or CLI is reported as untested, never converted to a pass. Desktop Chromium is not a real-device Safari/iPhone check, and native examples are not native-runtime passes.
