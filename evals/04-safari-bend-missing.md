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
- Names real-device verification honestly: the recorded owner-tested iPhone Safari result (bend renders; versions not recorded) may be cited; an evaluator who has not tested must still say untested rather than invent a pass.
