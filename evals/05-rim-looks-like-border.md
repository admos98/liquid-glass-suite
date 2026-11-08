# Eval 05: Rim looks like a border

## User prompt

My glass rim looks painted, like a dirty grey border. Making it thicker only made it worse.

## Skill that should trigger

`liquid-glass-debug`

## Expected behavior

- Routes to S03 and S16/S17 before changing rim alpha or thickness.
- Checks for blur on the rim and explains that a hard mask ring cannot fade inward.
- Distinguishes the painted fallback from the backdrop-fed saturated/specular optical rim.
- Uses the rim/mask guidance and, if measuring, gives the real `edge-profile.py` command.
- Does not claim a visual fix without a browser or measured evidence.
