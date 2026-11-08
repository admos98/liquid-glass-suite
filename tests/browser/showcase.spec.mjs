import { test as base, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(page);
    expect(errors, 'no uncaught browser errors').toEqual([]);
  },
});
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const showcaseURL = pathToFileURL(path.join(root, 'shared/assets/showcase.html')).href;
const hash = input => crypto.createHash('sha256').update(input).digest('hex');
const EXPECTED_PRESETS = {
  searchbox: { specOpacity: 0.2, saturation: 4, refraction: 0.7, blur: 1, surface: 'convex_squircle', bezel: 14, thickness: 66, radius: 21, w: 320, h: 42, glassBg: 0, rgbDim: 0 },
  switch: { specOpacity: 0.5, saturation: 6, refraction: 1, blur: 0.2, surface: 'lip', bezel: 10, thickness: 60, radius: 32, w: 140, h: 64, glassBg: 0, rgbDim: 0 },
  slider: { specOpacity: 0.4, saturation: 7, refraction: 1, blur: 0, surface: 'convex_circle', bezel: 10, thickness: 60, radius: 20, w: 280, h: 40, glassBg: 0, rgbDim: 0 },
  player: { specOpacity: 0.4, saturation: 6, refraction: 1, blur: 1, surface: 'convex_circle', bezel: 20, thickness: 80, radius: 24, w: 300, h: 200, glassBg: 0.6, rgbDim: 0 },
  magnifier: { specOpacity: 0.5, saturation: 9, refraction: 1, blur: 0, surface: 'convex_circle', bezel: 16, thickness: 80, radius: 75, w: 210, h: 150, glassBg: 0, rgbDim: 0 },
  panelA: { specOpacity: 0.45, saturation: 8, refraction: 0.7, blur: 3, surface: 'convex_squircle', bezel: 12, thickness: 66, radius: 12, w: 380, h: 200, glassBg: 0, rgbDim: 0.15 },
  panelB: { specOpacity: 0.35, saturation: 6, refraction: 0.7, blur: 20, surface: 'convex_squircle', bezel: 16, thickness: 70, radius: 24, w: 360, h: 300, glassBg: 0, rgbDim: 0.15 },
};

async function ready(page) {
  await page.goto(showcaseURL);
  await page.waitForFunction(() => typeof mapInfo !== 'undefined' && mapInfo && prof && window.UltimateLiquidGlass);
  await settle(page);
}
async function settle(page) {
  await page.evaluate(async () => {
    for (let index = 0; index < 4; index++) await new Promise(requestAnimationFrame);
    await window.UltimateLiquidGlass.whenSettled();
  });
}
async function renderer(page, mode) {
  await page.evaluate(async value => { await window.UltimateLiquidGlass.setRenderer(value); }, mode);
  await expect.poll(() => page.evaluate(() => window.UltimateLiquidGlass.getState().renderer)).toBe(mode);
}

test('standalone file works offline and creates original 2x maps', async ({ page, context }) => {
  const network = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await context.setOffline(true);
  await ready(page);
  expect(network).toEqual([]);
  expect(new URL(page.url()).protocol).toBe('file:');
  await expect(page.locator('h1')).toHaveText('Liquid Glass Suite');
  await expect(page.locator('#browserBadge')).toHaveText('Standalone · CSS/SVG');
  const state = await page.evaluate(() => window.UltimateLiquidGlass.getState());
  expect(state.mapSize).toEqual([640, 84]);
  expect(state.displacementScale).toBeGreaterThan(0);
  expect(await page.evaluate(() => DPR)).toBe(2);
  await expect(page.locator('#filterDefs filter')).toHaveCount(1);
});

test('all seven original preset buttons apply their complete original bundles', async ({ page }) => {
  await ready(page);
  await expect(page.locator('[data-preset]')).toHaveCount(7);
  for (const [id, expected] of Object.entries(EXPECTED_PRESETS)) {
    await page.locator(`[data-preset="${id}"]`).click(); await settle(page);
    const actual = await page.evaluate(() => window.UltimateLiquidGlass.getState());
    for (const [key, value] of Object.entries(expected)) expect(actual.params[key], `${id}.${key}`).toBe(value);
    expect(actual.mapSize).toEqual([expected.w * 2, expected.h * 2]);
  }
});

test('surface families, live controls and diagnostic canvases remain functional', async ({ page }) => {
  await ready(page);
  for (const surface of ['convex_circle', 'convex_squircle', 'concave', 'lip']) {
    await page.locator(`[data-surface="${surface}"]`).click(); await settle(page);
    const result = await page.evaluate(() => {
      const image = mapInfo.img, index = (Math.floor(image.height / 2) * image.width + Math.floor(image.width / 2)) * 4;
      return { surface: P.surface, center: Array.from(image.data.slice(index, index + 4)), size: [image.width, image.height] };
    });
    expect(result.surface).toBe(surface);
    expect(result.center).toEqual([128, 128, 0, 255]);
    expect(result.size).toEqual([640, 84]);
  }
  const values = { specOpacity: 0.55, saturation: 8, refraction: 0.85, blur: 2.5, angle: 30,
    glassBg: 0.2, rgbDim: 0.25, bezel: 18, thickness: 70, scale: 0.9, radius: 20, pw: 360, ph: 140 };
  for (const [id, value] of Object.entries(values)) {
    await page.locator('#' + id).evaluate((input, next) => {
      input.value = String(next); input.dispatchEvent(new Event(input.type === 'number' ? 'change' : 'input', { bubbles: true }));
    }, value);
    await settle(page);
    const key = id === 'pw' ? 'w' : id === 'ph' ? 'h' : id;
    expect(await page.evaluate(key => window.UltimateLiquidGlass.getState().params[key], key)).toBe(value);
  }
  for (const id of ['simCanvas', 'chartCanvas', 'mapCanvas']) {
    expect(await page.locator('#' + id).evaluate(canvas => canvas.toDataURL().length)).toBeGreaterThan(500);
  }
});

test('original plates and generated background work without external assets', async ({ page }) => {
  await ready(page);
  await expect(page.locator('.chip.plate')).toHaveCount(6);
  for (const button of await page.locator('.chip.plate').all()) {
    await button.click();
    await expect(page.locator('#stage')).toHaveCSS('background-image', /data:image\/svg\+xml;base64/);
  }
  await page.locator('#imgBg').check();
  await expect(page.locator('#stage')).toHaveCSS('background-image', /data:image\/png;base64/);
});

test('WebGL2 draws optical changes and comparison mode keeps CSS alive', async ({ page }) => {
  await ready(page); await renderer(page, 'webgl');
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().webglDraws)).toBeGreaterThan(0);
  const before = await page.locator('#stage').screenshot();
  await page.evaluate(() => window.UltimateLiquidGlass.setState({ refraction: 0, specOpacity: 0, saturation: 1 }));
  const after = await page.locator('#stage').screenshot();
  expect(hash(before)).not.toBe(hash(after));
  await renderer(page, 'split');
  await expect(page.locator('#stage-gl')).toBeVisible();
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', /url|blur/);
  await renderer(page, 'css');
  await expect(page.locator('#glass-canvas')).toBeHidden();
});

test('WebGL2 unavailable keeps a visible CSS fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return kind === 'webgl2' ? null : original.call(this, kind, ...args); };
  });
  await ready(page); await page.selectOption('#renderer', 'webgl'); await settle(page);
  await expect(page.locator('#render-status')).toContainText('CSS fallback');
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().renderer)).toBe('css');
  await expect(page.locator('#glass')).toBeVisible();
});

test('reduced transparency pauses draws and restores the requested renderer', async ({ page }) => {
  await ready(page); await renderer(page, 'webgl');
  await page.check('#reduce-transparency'); await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-reduced-transparency', 'true');
  await expect(page.locator('#glass-canvas')).toBeHidden();
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', 'none');
  const count = await page.evaluate(() => window.UltimateLiquidGlass.getState().webglDraws);
  await page.evaluate(() => window.UltimateLiquidGlass.setState({ angle: 35 }));
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().webglDraws)).toBe(count);
  await page.uncheck('#reduce-transparency'); await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-render', 'webgl');
});

test('forced colors and reduced motion retain accessible CSS behavior', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#glass-canvas')).toBeHidden();
  await expect(page.locator('#toast')).toHaveCSS('transition-duration', '0s');
});

test('invalid imported state is rejected atomically and valid URL state restores', async ({ page }) => {
  await ready(page);
  const prior = await page.evaluate(() => window.UltimateLiquidGlass.getState().params);
  for (const input of [{ w: 1000000000 }, { blur: NaN }, { surface: '<img src=x onerror=alert(1)>' }, { __unrecognized: 1 }, { specOpacity: 0.9, w: -1 }, [1, 2]]) {
    await expect(page.evaluate(async values => { await window.UltimateLiquidGlass.setState(values); }, input)).rejects.toThrow();
    expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().params)).toEqual(prior);
  }
  await page.evaluate(() => window.UltimateLiquidGlass.setState({ w: 366, specOpacity: 0.6 }));
  await page.reload(); await page.waitForFunction(() => window.UltimateLiquidGlass?.getState().mapSize);
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().params.w)).toBe(366);
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().params.specOpacity)).toBe(0.6);
});

test('pointer, keyboard, reset, mobile overflow and visible focus still work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.locator('#glass').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 + 20, { steps: 3 }); await page.mouse.up();
  const moved = await page.evaluate(() => window.UltimateLiquidGlass.getState().position);
  expect(moved.x).toBeGreaterThan(0.5);
  await page.locator('#glass').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().position.x)).toBeGreaterThan(moved.x);
  await expect(page.locator('#glass')).toHaveCSS('outline-style', 'solid');
  await page.locator('#reset-position').click();
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().position)).toEqual({ x: 0.5, y: 0.46 });
});

test('exports use package tokens and clipboard failure is honest', async ({ page }) => {
  await ready(page);
  const exported = await page.evaluate(() => [tokensCSS(), tokensAppCSS(), tokensJSON()]);
  expect(exported[0]).toContain('--lg-'); expect(exported[1]).toContain('--lg-');
  expect(exported[1]).not.toContain('tools/gen-glass-maps.py');
  expect(JSON.parse(exported[2]).surface).toBe('convex_squircle');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } });
    document.execCommand = () => false;
  });
  await page.click('#copyBtn');
  await expect(page.locator('#toast')).toContainText('Copy failed');
});
