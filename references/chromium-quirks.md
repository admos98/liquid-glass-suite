# Chromium quirks

Purpose: the five silent failures of `backdrop-filter: url(#f)` (strategy 2), each of which renders *wrong* rather than failing loudly.

Read when: a Chromium surface refracts in the wrong place, not at all, or only on two edges.
Skip if: the surface is Safari/iOS (→ safari-webkit.md) or the chain has no live `url(` at all (→ strategy-picker.md §4).

Summary:
- Alpha 0 in a map kills it: Chromium premultiplies RGB by alpha. Keep alpha 255 and let the map stay a named `in2` intermediate.
- `<filter>` definitions are cached by ID — mint a fresh ID on every rebuild.
- Keep the filter region at the element box; percentage `feImage` measures produce bottom/right-only bends.
- `transform: scale()`/`rotate()` warps the lens coordinate space; plain `translate` is safe.
- Before tuning any input, measure whether the chain delivers it — `url()` must be last.

## §1 A map with alpha 0 is dead

If you bind via `feImage`, Chromium premultiplies colour channels by alpha while decoding the PNG. At alpha 0 you get zeros in R/G/B regardless of file contents, so the filter shifts everything by a constant toward the upper left. With blur added it *convincingly resembles* refraction. **Fix: alpha 255, plus an explicit filter graph whose final step does not output the map** — the map stays a named intermediate used only as `in2`. `assets/liquid-glass.js` generates an RGBA map with a constant 255 alpha channel.

## §2 The backdrop ends at the element edge

Chromium clips the backdrop to the element box; neighbours are unreachable no matter how far you sample, and everything past the edge is **mirrored back**. Sampling deliberately past the edge is what produces the upside-down water-droplet band. A profile that only pulls inward cannot produce that look at all.

## §3 Filter definitions are cached by ID

Replacing a `<filter>` element under the same ID keeps rendering the old one. Invisible with static CSS, immediate with generated maps. **Give every rebuild a fresh ID and update the `filter`/`backdrop-filter` value with it.** This one bites strategy 1 in Safari too. → see references/safari-webkit.md §2.

## §4 Refraction appears only on bottom and right

Caused by percentage measures on `feImage` (`x="0%" width="100%"`). Work in `objectBoundingBox` units (one filter for all sizes) or absolute pixels matching the element. Verify on a large element over a fine grid — on small surfaces the asymmetry is invisible.

## §5 `transform: scale()` / `rotate()` distorts refraction

The filter's coordinate space warps and the refraction goes crooked. Plain `translate` is safe. For "wobble" animations prefer `border-radius` morphing over `scale()`. Arm the effect after the transform settles (a CSS keyframe on the panel chain is the better form). → see references/dim-and-rim.md §Arm delay.

## §Before tuning anything: verify the chain delivers

`url()` goes LAST: `blur saturate url('#lens')`. A blur after `url()` smears the displacement away (measured 1.8× invisible vs 31× bend-last, `src: measured`). **Before tuning any mechanism that feeds a chain, measure whether the chain delivers it.** → see references/strategy-picker.md §4 (canonical chain-order law and numbers).

## §Map checks

- A grayscale displacement map is not a lens: `feDisplacementMap` reads R for X and G for Y, so one channel repeats the same displacement everywhere. → see references/dim-and-rim.md §Appendix.
- Real refraction needs distinct R/G/B displacement fields (per-channel maps) or per-channel IOR in the shader. → see references/dim-and-rim.md §Appendix, references/webgl-shader.md §GLSL core.
- After any map regeneration, check neutral centre `(128,128)`, alpha never 0, per-edge peak ≥90% of declared `scale/2`, L/R skew <10%. → see references/measurement.md §Chain delivery, scripts/measure-displacement-map.py.

## §Engine wall

`backdrop-filter: url(#f)` is Chromium-only — Safari and Firefox parse the syntax, paint nothing, and report success anyway, so `@supports` lies. State the support floor in the handoff. → see references/strategy-picker.md §2, references/safari-webkit.md §1.

## §Chromatic dispersion is what makes it read as glass

RGB channels landing at different offsets is the actual visual tell of quality glass; sampling R, G, B at slightly different refraction angles produces the rainbow fringe at the edges. Skip it and it reads as plastic. In SVG the offset comes from per-channel displacement maps; in the shader from per-channel IOR. → see references/dim-and-rim.md §Appendix, references/webgl-shader.md §GLSL core.

## §Refraction needs something to refract

A defined field, not a tint. A starved or uniform backdrop bends nothing — measure the plate before touching any glass token. → see references/measurement.md §Material audit 4.

## §A scripted class edit can invent a class that never existed

Audit every `glass-*` class used in markup minus every one defined in CSS. → see references/dim-and-rim.md §Appendix for the worked example.

## §Extracted code

`assets/liquid-glass.js` implements the alpha-255 map, the fresh-ID injector, the paint-probe gate and one delegated pointer listener. It is inert when the probe fails: only `blur() + saturate()` remains.
