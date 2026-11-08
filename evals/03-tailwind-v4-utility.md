# Eval 03: Tailwind v4 utility

## User prompt

I'm on Tailwind v4. Add a reusable utility for a fixed glass dock without letting the material CSS override my positioning utilities.

## Skill that should trigger

`liquid-glass`

## Expected behavior

- Keeps `lg lg--backdrop` as the material and creates only a variant-enabled layout utility such as `glass-dock`.
- Keeps `fixed`/other positioning at the call site, not inside the custom utility.
- Uses CSS-first Tailwind v4 syntax and does not introduce an `lg*` utility namespace.
- Does not add a sibling `@supports` rule or a second filter graph.
- Preserves the shipped fallback and references the Tailwind recipe/cascade guidance.
