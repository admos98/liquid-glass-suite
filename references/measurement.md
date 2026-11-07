# Measurement

Purpose: read glass from pixels, audit the live build, and prove the chain, the map and the dim with numbers instead of adjectives.

Read when: a visual complaint arrives with a screenshot, a token changed but the render didn't, or a "measured" claim needs reproducing.
Skip if: the complaint is a known symptom (→ failure-catalogue.md) or the fix is purely a value choice (→ dim-and-rim.md).

Summary:
- Vision models describe impression and are near-blind to sub-10px edge structure. Use pixels for edges.
- Rim ramp 2–5px; ≥8px is a glow; ≤1px is a cutout. (fixture: tests/fixtures/rim-swatch.png)
- Map: neutral centre `(128,128)`, alpha never 0, per-edge peak ≥90% of `scale/2`, L/R skew <10%. (fixture: tests/fixtures/lens-map.png)
- Chroma retention target ~60–75%, below ~40% is putty. (fixture: tests/fixtures/chroma-retention.txt)
- Grep the BUILT bundle for token/property names, not authored values; the computed value is the authority.

## §Reading pixels

A vision model reading a screenshot will confidently report *"soft faded borders, proper elevation, authentic glassmorphism, no technical issues"* on an image whose top edge is a 16px, +93-luminance glow `src: measured`. Vision models describe the general impression and are near-blind to sub-10px edge structure — which is the entire subject of a rim complaint. On a material task, **never accept a vision model's verdict on an edge, a band, a falloff or a contrast ratio.** Use it for layout and content; use pixels for the edge. The tell that the prose is wrong: it says "no issues" while the user is still filing complaints.

Profile an edge with Pillow:

```python
from PIL import Image
im = Image.open(path).convert("RGB")
px = im.load(); w, h = im.size

x = int(w * 0.45)                      # a column clear of text/controls
for y in range(y0, y0 + 40):            # straddle the suspected edge
    c = px[x, y]
    L = 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]
    print(y, c, round(L, 1))
```

| measurement | rim | glow / defect |
|---|---|---|
| ramp width (page → body) | 2–5px | ≥ 8px |
| peak ΔL page → body | small, localised | 50–100+ |
| monotonic rise border → centre | no | yes = gradient is backwards |

Run it at three x positions. A ramp identical at all three is a gradient; a ramp that is 1px at one and 16px at another is a `clamp()` whose percentage stop is binding differently per panel size. `scripts/edge-profile.py` does the whole thing: pick a column, get the luminance profile, report ramp width and monotonicity. (fixture: tests/fixtures/rim-swatch.png)

**Finding an edge to profile.** Scan rows for the strongest mean absolute delta, then profile across one:

```python
for y in range(1, h - 1):
    idx = range(0, w, 7)
    d = sum(sum(abs(px[i, y-1][k] - px[i, y][k]) for k in range(3)) for i in idx) / len(idx)
```

The top hits are panel edges. Profile the top few rather than guessing a y. For horizontal edges, find the panel's x-span first (scan for the interior colour) and profile left and right the same way — **a panel whose left edge ramps and whose right edge is a 1px cut is a real, nameable defect**, invisible unless you measure both sides.

**Numbers before tuning a rim `src: measured`:** rim band 2–4px on small controls, up to ~15px distortion on a large panel; sub-2px cannot read as a fade at 1x. A well-behaved panel differs from its page by a modest amount; if the body is 20+ levels brighter than the page across its *whole* interior, the fill is doing the rim's job. A white rim on a white fill has zero contrast at any alpha — sweep the ceiling first. → see references/measurement.md §Material audit 3b.

**What a measurement buys you.** A number converts a taste argument into a one-line justification, e.g. *"the flashlight is an edge gradient sized in percent of the panel, peaking at the border — deleting it"*. When the fix is a **deletion** of a mechanism you added last commit, showing the measured ramp that motivated it is the difference between a revert the user accepts and one they have to check themselves.

**A static probe page: measure a surface without booting the app.** Reproduce the surface under test in one HTML file that links the built CSS (`dist/assets/index-*.css`) and re-creates only that surface with the real class names and the component's real markup — the shipped rules then apply with no login, no data, no routing, and geometry pinned by your own CSS. Three traps, each silently producing numbers about nothing:
- **`npm run build` EMPTIES `dist/`**, killing anything staged there. Keep the harness outside `dist/` (scratch) and copy it in at run time.
- **Vite hashes the CSS filename every build**, so the harness link must be rewritten to the newest `dist/assets/index-*.css` on each run — a stale href loads nothing and every probe measures the empty page.
- **Bare ESM imports resolve from the script's own path, not the cwd**, so a shot script living outside the project fails with ERR_MODULE_NOT_FOUND. Resolve the driver through `createRequire` pointed at the project's `package.json`.

A stdlib PNG reader (zlib + scanline unfilter) is enough for band and spread metrics when Pillow is unavailable.

## §Chain delivery

Before tuning any mechanism that feeds a chain, measure whether the chain delivers it: compare structure at the edge against the interior. If the ratio is near 1 the mechanism is not arriving — fix the chain, not the input.

- **Edge-vs-interior structure ratio `src: measured`:** with `url()` last, 31×; with blur after `url()`, 1.8× (invisible). Order of magnitude is the tell, and reordering is free — always the first experiment. → see references/strategy-picker.md §4.
- **`scripts/measure-displacement-map.py`** verifies a regenerated map against its declared scale: neutral centre `(128,128)`, alpha never 0, per-edge peak ≥90% of declared `scale/2`, L/R skew <10%. (fixture: tests/fixtures/lens-map.png) → see references/svg-filter-graph.md §4.
- **`scripts/edge-profile.py`** profiles an edge and prints the luminance profile plus ramp width in pixels; a rim should be 2–5px, anything ≥8px is a glow. (fixture: tests/fixtures/rim-swatch.png)
- **`scripts/chroma-retention.py`** sweeps the dim chain numerically before any token edit. (fixture: tests/fixtures/chroma-retention.txt) — never write a retention number you did not compute.

## §Transmission: measuring the band behind a panel

Put a solid high-contrast block directly behind the panel (white in dark, near-black in light), screenshot the panel alone, and compare the best 6-row window mean against the median row mean — that delta is the band the user sees as a line `src: measured`:

| 6-row peak vs median | reading |
|---|---|
| <= ~35 | backdrop no longer reads as a line |
| 60-90 | the 'blurred line behind the panels' report |

Text behind the panel is the real-world case and measures far lower than a solid block (light menus over headline text: about -14, i.e. illegible and correct). The solid-block case decides the fix; the text case tells you whether you over-closed it.

For watermark / ghost visibility use **spread**: the 5th-to-95th percentile luminance inside the element's box. A flat spread (~10) means the mark is invisible whatever its token says; ~35-40 means it reads as a subtle ghost. Both numbers beat a vision model's verdict on whether the mark is there.

## §Chroma retention: does the dim transmit or paint?

The *"plastic, not smoked glass"* dim report is measurable. Mirror the chain as a formula chain and read how much of the backdrop's chroma survives — no browser needed (`scripts/chroma-retention.py` runs this with args):

```
saturate k :  c' = clamp(luma + k*(c - luma), 0, 255)       # luma = 0.2126R + 0.7152G + 0.0722B
wash b     :  c' = c + b*(c/255)*(tint - c)  # value-weighted; black stays black
fill a     :  c' = (1-a)*c + a*filltint
```

Measured on the shipped chain (before → after the vibrancy pass) `src: measured` (fixture: tests/fixtures/chroma-retention.txt):

| surface | chain | chroma kept |
|---|---|---|
| light menu | bare blur + wash .35 | **33%** (warm axis G−B 22 → 6 = putty) |
| light menu | sat 1.4 + wash .30 | **64%** |
| dark strong | sat 1.5 + wash .14 + navy fill .70 | **32%** (slab) |
| dark strong | same chain, fill .52 | **56%** (smoke) |

Target band ~60–75%; below ~40% is the grey-putty read (fixture: tests/fixtures/chroma-retention.txt). Two facts the table enforces: a chain with no saturate collapses every backdrop toward the same khaki (one missing filter, not a tint choice), and on dark the fill alpha dominates while the wash moves almost nothing (backdrop ≈ tint).

Then verify from RENDERED pixels — the arithmetic mirror proves only the formula:
1. Screenshot the surface over a warm/busy backdrop, both themes (dev harness fine).
2. Average an interior band clear of text and print avg RGB, `chroma = max−min`, and the warm axis (`G−B`). The before/after delta is the proof `src: measured`: light menu warm axis **+18** against ~**+6** for the bare chain.
3. Read the live computed `backdrop-filter` — the `saturate()` must be IN the chain (`blur(3px) saturate(1.4) url("#lg-1")`), not merely in a token; a token that never reached the chain is a dead fix.
4. At PANEL scale (interior regions, never edges) a vision model is usable as a second opinion — "smoked amber glass vs grey plastic" is a gestalt read it gets right (4/5 after this fix). The sub-10px edge caveat at the top of this file still stands.

## §Isolated probe

To test whether a `backdrop-filter` samples outside its own outline, place a bright marker band around the panel and count pixels of it *inside*. Two ways to make that measurement lie:
- The band shows **straight through** the transparent panel body, so the probe reports tens of thousands of hits and the lens looks catastrophically broken. The marker must be a **ring** — mask it to `content-box` with `exclude` — and the panel body must be painted **identically to the page background**, so the only pixels differing from the page are the ones under test.
- A near-transparent body does not provide a reference pixel, so "the ring is present" and "the panel is showing the page" become indistinguishable. Paint the panel the page colour and the question becomes exact.

Calibrate against a control: the same panel with **no** filter. The control must read zero hits; if it does not, the probe is measuring the setup and not the effect. → see references/dim-and-rim.md §Geometry faults.

## §Live audit — audit the live build instead of reading source

Use when a visual defect is *not* visible in `src/index.css` or in `dist/*.css`, or when a token was changed and you need to know what the browser actually resolved. The glass border once computed to `rgba(0,0,0,0)` while the source and the bundle were both correct — reading either one would have "confirmed" the code was fine.

| looks like | actually |
|---|---|
| rim/flare is dead | correctly `0` at rest, non-zero on hover |
| a token is unused | resolves on the element, overridden by the cascade |
| refraction is off | `url(#id)` present in computed `backdrop-filter` |

**Getting a session without handling a password.** Never type a password or accept one in chat. Open a real (headed) browser, type only the identifier, and let the user enter the secret in that window; then persist the session:

```js
const ctx = await chromium.launchPersistentContext('audit-profile', {
  channel: 'chrome', headless: false, viewport: null,
});
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
const email = page.locator('input[type="email"]').first();
if (await email.count()) await email.fill(IDENTIFIER);   // identifier only
// user types the password in the visible window
await page.waitForFunction(() => !!document.querySelector('#app-shell-id'));
await ctx.storageState({ path: 'audit-state.json' });
```

Assert on a **positive** marker — a known app-shell id. Checking for the absence of the word "login" matches the login page itself, so the loop reports success on the first poll and closes the window having authenticated nothing. Reuse the saved state on every later run (`storageState: 'audit-state.json'`). Without it the run lands on the login page and every selector misses — which surfaces as "no match for .glx-strong", not as an auth error. Add `audit-profile/` and `audit-*.json` to `.gitignore`; both hold live session cookies.

**Reading computed values.**

```js
const s = getComputedStyle(el);
s.backgroundImage            // the fill, fully resolved
s.backdropFilter            // or s.webkitBackdropFilter
s.borderTop
s.getPropertyValue('--glass-p-ba')   // the TOKEN, not the resolved value
```

Reading a token via `getPropertyValue` proves the token resolves. If the token is right and the property is still wrong, the cascade is the cause. Scope every selector to a stable id: `.glx-strong` matches the topbar pill first in DOM order, which is not the element you meant.

**When the cascade is the suspect.** `getComputedStyle` says what won but not which rule. CDP's matched-rule list, in cascade order, names it:

```js
const cdp = await page.context().newCDPSession(page);
await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: SEL });
const { matchedCSSRules } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
// the LAST rule that sets the property is the winner
```

`@utility` rules live in a cascade layer, so a naive `el.matches(rule.selectorText)` scan of `document.styleSheets` returns *empty* for them and looks like "no rule touches this element". That is a false negative about your own scan. Use CDP.

**Assert the transition, not a snapshot.** An assertion written from the same theory as the bug inherits its blind spots:

```js
const rest = await get('--eg-flare');   // calc(0*.55)
await page.locator(SEL).hover();
const hot  = await get('--eg-flare');   // calc(1*.55)
check('flare lifts off rest', !/calc\(0\*/.test(hot), `${rest} → ${hot}`);
```

**Serving a local build.** For an uncommitted fix, serve `dist/` over a throwaway HTTP server and inject a probe element carrying the class, so the assertion does not depend on being signed in:

```js
const el = await page.evaluate(() => {
  const n = document.createElement('div');
  n.className = 'glx-strong';
  document.body.appendChild(n);
  const s = getComputedStyle(n);
  const out = { border: s.borderTop, blur: s.backdropFilter };
  n.remove();
  return out;
});
```

Run the script **from the project root** so `require('playwright')` resolves from `node_modules`; a script in a temp or scratch dir fails to resolve even when the module is installed. `NODE_PATH=<project>/node_modules` also works. Use the project's own playwright with `channel: 'chrome'` against an already-installed Chrome so no browser download is needed.

**Inline kill (runtime-critical CSS).** Production minification collapses `prop`/`-webkit-prop` pairs and can keep only the spelling Chromium ignores. Apply kills inline via `style.setProperty('backdrop-filter','none','important')` (both spellings) and pin the inline style in tests, not just the computed value. → see references/webgl-shader.md §Hybrid.

**Dress is ASYNC.** After opening a floating panel, wait bounded for `url(` to appear (maps land a beat later), and attach state to any screenshot (rect, opacity, filter count, theme) — a panel caught mid-animation or pre-dress reads as a defect only if the shot explains nothing. Pixel proof of a dress restore is a before/after crop of the same region: the rim shows as the top-edge band plus corner arcs, while a uniform interior DARKENING is the dim wash arriving with the graph — not the rim.

**When the driving browser's profile is locked.** Fall back to a headless Chrome CLI run with a fresh `--user-data-dir` — without a fresh dir the binary delegates to the running instance ("Opening in existing browser session") and nothing is captured. Two environment traps: give it a **Windows path** (MSYS `/tmp` is not readable by the native binary), and budget JS time explicitly:

```bash
CH="C:/Program Files/Google/Chrome/Application/chrome.exe"
D="C:/…/scratch/chrome-test"           # fresh profile dir, every run
"$CH" --headless=new --disable-gpu --user-data-dir="$D" \
  --virtual-time-budget=7000 --window-size=1200,1500 \
  --screenshot="$D/shot.png" "$URL"
"$CH" --headless=new --disable-gpu --user-data-dir="$D" \
  --virtual-time-budget=7000 --dump-dom "$URL" | grep -o 'id="status">[^<]*'
```

`--virtual-time-budget` lets JS-built state (maps, filters, status lines) finish before capture; `--dump-dom` + the app's own readout elements answers "is the filter built" where a screenshot cannot.

**Proving your own edit landed: paired-screenshot diff.** Render the same URL twice with exactly one parameter changed (dim 0 vs 0.38), then diff with numpy: `np.abs(a-b).sum(axis=2)`, threshold >6, and cluster differing rows by y-gaps so the real region separates from slider readouts that always differ. Then sample per-channel means **inside the target region and on the backdrop beside it at the same rows** — interior-vs-backdrop delta answers "is there a tint at zero". Two readings decide: ~0 changed pixels in the target region means the mechanism is not applying at all, and a per-channel delta matching the intended arithmetic (warm channels compressed, blue preserved) proves the mechanism rather than mere motion. Finding the region is half the work — panel bounds come from the largest diff cluster, not from guessing stage coordinates.

## §Material audit — four checks before any glass value change

All four failed silently on a real project because each symptom reads as a taste complaint while the fault is arithmetic or geometry.

**1. A masked ring cannot fade inward.** The `mask-composite: exclude` rim recipe confines every gradient to the `padding` band. A ring has no interior, so across the top band the alpha is effectively constant — measured `0.5 → 0.496` on a 1,376px hero `src: measured`. So *"the shine should fade inward toward the panel"* is not achievable by editing ring values at all. It needs a second layer the mask never sees: `inset 0 Npx Mpx rgb(var(--glass-edge-color) / a)` where `M` is the falloff distance. The correct three-part edge: sub-pixel outer line (the ring), a band that genuinely varies **across its own width**, an inset shadow carrying glow inward. Part 2 is the one usually missing: a band constant across its width is a painted stripe at every size. → see references/dim-and-rim.md §Geometry faults.

**2. Verify a size-relative clamp actually binds.** `clamp(1.5px, 4.2%, 3.6px)` looks size-relative and is not, for every panel above saturation: the percentage exceeds the ceiling once `width > ceiling ÷ percent` → `3.6 ÷ 0.042 = 86px`. A 1,376px hero and a 40px chip both render the identical `3.6px`. **Never accept "size-relative" from reading the declaration — do the division.** Fix by moving the bounds (raise the ceiling, lower the percentage) or being honest that the band is constant.

**3. Judge rim-vs-fill contrast by composited delta.** A `255 255 255` rim at 0.5 over a `255 255 255` fill is invisible because both composite to the same value. Compute the 8-bit delta:

```python
def lin(c, a, bg):  # composite fg over bg, per channel
    return tuple(round(c[i]*a + bg[i]*(1-a)) for i in range(3))
```

Compare that delta against **the competing border the rim was meant to replace** `src: measured`:

| element | composited | Δ from panel |
|---|---|---|
| panel fill | rgb(251,250,247) | — |
| rim, white @ 0.5 | rgb(253,252,251) | **4/255** |
| border, ink @ 0.22 | rgb(202,201,200) | **49/255** |

The rim was **12× less visible than the border**. Report the *ratio* rim-to-border; it points the fix at removing or changing the border, not at raising rim alpha.

**3b. Sweep the ceiling before tuning — white-on-light is unsolvable by value.** A low ratio has two different causes. Distinguish them by computing the maximum achievable delta at alpha 1.0:

```python
for a1 in (0.30, 0.5, 0.8, 1.0):            # panel fill alpha
    edge = lin((255,255,255), a1, page)     # fill at the rim
    full = lin((255,255,255), 1.0, page)    # rim at full strength
    print(a1, max(abs(full[i]-edge[i]) for i in range(3)))
```

Measured on a cream page (`rgb(250,248,245)`) `src: measured`:

| fill α | edge colour | pure-white rim Δ |
|---|---|---|
| 0.30 | (252,250,248) | 7/255 |
| 0.50 | (252,252,250) | 5/255 |
| 1.00 | (255,255,255) | 0/255 |

**If the ceiling is under ~12/255, no value change can work and the structure must change.** Two escapes, both required on a light theme:
1. **Ink defining line.** Real glass shows a *dark* total-internal-reflection boundary on light backgrounds. An ink hairline at α≈0.2 measures Δ≈50 where white measured 4 `src: measured`: ink defining line α 0.20 → (208,207,208), Δ **46**; white band on the line α 0.85 → (248,248,248), **41** of internal contrast; white band alone α 0.62 → 4 against the page. Reinstating the removed border is the *fix*, not a regression: it had been deleted because the rim was meant to replace it and could not, so light mode was showing the border alone. A border carrying a band and a glow above it reads as an edge; a border alone is a stroke.
2. **Radial, edge-dense fill.** A linear top-to-bottom fill varies the panel in the wrong axis — it leaves the centre as opaque as the edge, so the panel reads as a card. A pane of glass is thickest where light enters, so density must fall off *inward*.

Ordering matters: on light, the ink line goes in first, because a white band on white fill is still 4/255 no matter how bright it is.

**4. `backdrop-filter: blur()` over a flat field returns a flat field.** Blur samples what is actually behind the element. When the page is a solid colour or a ~1% radial tint on solid, there is no structure to displace, so the panel can only be a tinted wash. This is the *"no liquid-glass feeling at all"* report, and the reason dark mode reads flatter than light — a dark fill over a dark page has no luminance range to work with. **This is a page-design decision, not a CSS bug, and it gates the material work.** Two options, and they are not the same project: give the page real depth (gradient field, texture, scrolling content) so the filter has something to act on; or formally accept that in-page cards are frosted panels and reserve refraction for floating chrome. Surface the fork before tuning opacity against an empty backdrop. Also measure panel-vs-page delta: ~1% (2/255 light, 4/255 dark) means no material presence at all. A starved field is ±5/255 plate luminance range.

**What a good audit deliverable looks like.** Every claim carries a **measured number**, not an adjective; load-bearing faults are separated from taste variables and the report says which need the user's eyes; structural faults (geometry, arithmetic) are stated as faults — not "consider tuning"; the report names the gate each phase must pass before the next begins.

## §Minifier traps

Grep the dist for the token or property name, never for the authored value, and check the bundle's mtime — a dist built before your last edit reports shipped code as missing. Rewrites that cause false alarms:

| Authored | Emitted by Lightning CSS |
|---|---|
| `::before` / `::after` | `:before` / `:after` |
| `rgba(26,26,46,0.05)` | `#1a1a2e0d` |
| `rgb(0 0 0 / var(--x))` | `rgb(0 0 0/var(--x))` |
| `rgba(255,255,255,0.065)` | `#fff1` |
| `[data-lens='on']` | `[data-lens=on]` |
| `rgba(26,26,46,0.97)` | `#1a1a2ef7` |
| `@supports (backdrop-filter: url("#x"))` | `@supports ((-webkit-backdrop-filter:url(#x)) or (backdrop-filter:url(#x)))` |

Before concluding a value is gone from the bundle, search for its **semantic** form (hex shorthand, single-colon pseudo-element) — a rule the minifier folds into an existing one (a reset merged into Tailwind preflight) legitimately disappears as literal text while remaining present as behaviour. The computed-value probe is the authority in both cases. Tailwind's build emits `.glass-edge:before` from `::before`, so match both `r"\.glass-edge:before"` and `r"\.glass-edge::before"`. Confirming a feature in `src/index.css` proves the source is right; only the bundle proves it shipped.

## §Fixtures

`tests/README.md` holds the exact commands and the real stdout for all three scripts against `tests/fixtures/lens-map.png`, `tests/fixtures/rim-swatch.png` and `tests/fixtures/chroma-retention.txt`. Claims with no fixture keep their `src: apple-hig | community | figma | measured` tag and gain no new authority. → see references/honesty-and-checklists.md §Source tags.
