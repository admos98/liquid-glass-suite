# Eval 04: Bend missing in Safari

## User prompt

The glass bend works in Chrome but is broken on my iPhone. Why is backdrop-filter url() doing nothing in Safari?

## Skill that should trigger

`liquid-glass-debug`

## Expected behavior

- Starts at S30 and identifies the SVG-backdrop/WebKit support wall rather than recommending random token changes.
- Distinguishes content `filter:url()` from `backdrop-filter:url()`; `@supports` alone is not accepted as paint evidence.
- Keeps the blur+saturate fallback and does not promise SVG-backdrop refraction in Safari.
- Offers explicit-texture WebGL2 through `liquid-glass-optics` when true WebKit refraction is required.
- Names real-device verification as untested unless the evaluator actually performs it.
