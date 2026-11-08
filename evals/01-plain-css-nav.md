# Eval 01: Plain-CSS glass navigation

## User prompt

Make my top navigation look like Apple Liquid Glass. Plain HTML/CSS, no framework, and please don't make the whole page glassy.

## Skill that should trigger

`liquid-glass`

## Expected behavior

- Uses the shared `liquid-glass.css` and `.js` drop-in rather than requiring the showcase.
- Applies `lg lg--backdrop` to one floating `nav`, not to page content or every link.
- States that blur+saturate remains everywhere and backdrop bend is gated/additive.
- Uses the shipped light/dark tokens and points to the navigation recipe.
- Mentions S15 or the live-`url()` check if explaining how to verify the bend.
