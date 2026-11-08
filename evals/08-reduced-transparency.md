# Eval 08: Reduced-transparency fallback

## User prompt

Make my glass card accessible when Reduce Transparency is on. It still needs readable light and dark fallbacks.

## Skill that should trigger

`liquid-glass`

## Expected behavior

- Uses the shipped `prefers-reduced-transparency` behavior rather than inventing a new optical treatment.
- Identifies `--lg-fill-flat` as `rgba(255,255,255,0.72)` light and `rgba(34,30,74,0.88)` dark.
- Removes backdrop/content refraction while retaining readable ink and the card structure.
- Also preserves the shipped forced-colors behavior and avoids opacity animation on the filter carrier.
- States that actual preference emulation/contrast must be run before claiming a pass.
