# Verification

Run from the package root:

```bash
npm ci
python -m pip install Pillow
npx playwright install chromium webkit
npm run verify
```

`npm run verify` checks the standalone build, Python package/fixture contracts, and browser behavior. Actual output is recorded in `tests/evidence/verification.txt`.

The browser suite uses an unmodified Azmoon baseline shipped under `tests/reference/azmoon/`. Source hashes are in `tests/reference/source-manifest.json`. It compares map bytes and the isolated 800×400 CSS stage against the baseline, then exercises WebGL2, explicit fallback, imported-state validation, clipboard failure, mobile overflow, keyboard focus, and accessibility preferences.

CSS pixel parity runs in Chromium only. Playwright WebKit exercises the texture renderer and fallback; its SVG-backdrop parity case is intentionally skipped. Playwright WebKit on Windows is not a real-device Safari test. Native examples were not compiled on Apple hardware.

The synthetic map/rim/glow/cutout fixtures validate the measurement tools, not a browser. The current chroma output is in `tests/fixtures/chroma-retention.txt`; saturation now clamps channels, giving dark fixture retentions of 32% and 56% instead of the old unbounded 33% and 57%.

No test result is implied by this document. The execution transcript is the evidence.
