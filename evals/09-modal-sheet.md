# Eval 09: Glass modal sheet

## User prompt

Turn this modal sheet into frosted Liquid Glass, including dark mode and a safe close animation.

## Skill that should trigger

`liquid-glass`

## Expected behavior

- Uses `lg lg-strong lg--backdrop` and the modal/sheet recipe with accessible dialog naming.
- Uses strong fill `.32` off-white light / `.88` navy dark and the common reduced-transparency fallback.
- Separates scrim opacity from the backdrop-filter carrier and cites S24 for ghost blur.
- Keeps the surface transient and does not glass the underlying content.
- Avoids an unconditional `overflow:hidden` if it would trap portalled controls.
