# Eval 10: Dropdown popover

## User prompt

Make my dropdown menu a translucent glass popover. It must stay readable over scrolling content and degrade safely on iOS.

## Skill that should trigger

`liquid-glass`

## Expected behavior

- Uses the dropdown recipe with `lg lg-strong lg--backdrop` on the shared popover primitive.
- Uses strong light/dark fills and, if discussing a custom menu graph, tags the `.35`/`.32` wash values as `src: measured`.
- States the common blur+saturate fallback and the S30 WebKit support boundary.
- Does not nest glass menu items inside the glass menu carrier.
- Avoids claiming that all browsers render the same bend.
