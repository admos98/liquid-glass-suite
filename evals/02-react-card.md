# Eval 02: React floating glass card

## User prompt

Give me a React floating now-playing card with a glassmorphism style.

## Skill that should trigger

`liquid-glass`

## Expected behavior

- Returns a small React component using `className`, with `lg glass-card` and `lg--backdrop` only because the card floats.
- Loads the shared assets once rather than defining a second CSS/SVG optical engine.
- Uses the card recipe's `18px 20px` layout and existing material tokens.
- Distinguishes this floating card from ordinary content cards, which stay on standard material.
- Preserves the common fallback and does not claim Safari backdrop refraction.
