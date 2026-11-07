import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { PNG } from 'pngjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const showcaseURL = pathToFileURL(path.join(root, 'assets/showcase.html')).href;
const referenceURL = pathToFileURL(path.join(root, 'tests/reference/azmoon/index.html')).href;
const hash = input => crypto.createHash('sha256').update(input).digest('hex');

async function ready(page, url = showcaseURL) {
  await page.goto(url);
  await page.waitForFunction(() => typeof mapInfo !== 'undefined' && mapInfo && prof);
  await page.evaluate(async () => {
    for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
    if (window.UltimateLiquidGlass) await window.UltimateLiquidGlass.whenSettled();
  });
}

async function maps(page) {
  return page.evaluate(() => ({
    displacement: toURL(mapInfo.img),
    specular: toURL(buildSpecularMap(P.w, P.h, P.radius, P.angle)),
    profile: Array.from(prof),
    scale: effectiveScale(),
    dim: dimParams(),
  }));
}

async function setPreset(page, preset) {
  await page.evaluate(async preset => {
    Object.assign(P, PRESETS[preset]);
    syncUI(); schedule({ map: true, spec: true, sim: true });
    for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
    if (window.UltimateLiquidGlass) await window.UltimateLiquidGlass.whenSettled();
  }, preset);
}

function difference(left, right) {
  const a = PNG.sync.read(left), b = PNG.sync.read(right);
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  let changed = 0, total = 0, max = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    let pixelChanged = false;
    for (let j = 0; j < 3; j++) {
      const delta = Math.abs(a.data[i + j] - b.data[i + j]);
      total += delta; max = Math.max(max, delta); pixelChanged ||= delta !== 0;
    }
    changed += Number(pixelChanged);
  }
  return { width: a.width, height: a.height, changedPixels: changed, meanChannelDelta: total / (a.width * a.height * 3), maxChannelDelta: max };
}

async function normalizeStage(page) {
  await page.addStyleTag({ content: '.wrap{visibility:hidden!important}#stage{visibility:visible!important;position:fixed!important;left:0!important;top:0!important;width:800px!important;height:400px!important;z-index:1000!important}#glass{outline:none!important}' });
  await page.evaluate(async () => {
    for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
    if (window.UltimateLiquidGlass) await window.UltimateLiquidGlass.whenSettled();
  });
}

test('standalone file works offline and creates both real maps', async ({ page }) => {
  const network = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => route.abort());
  await ready(page);
  expect(network).toEqual([]); expect(errors).toEqual([]);
  await expect(page.locator('h1')).toHaveText('Ultimate Liquid Glass');
  const state = await page.evaluate(() => window.UltimateLiquidGlass.getState());
  expect(state.mapSize).toEqual([640, 84]);
  expect(state.displacementScale).toBeGreaterThan(0);
});

test('every preset has the same map bytes, profile and dim law as Azmoon', async ({ page, context }) => {
  const reference = await context.newPage();
  await ready(page); await ready(reference, referenceURL);
  const presets = ['searchbox', 'switch', 'slider', 'player', 'magnifier', 'panelA', 'panelB'];
  for (const preset of presets) {
    await setPreset(page, preset); await setPreset(reference, preset);
    expect(await maps(page), preset).toEqual(await maps(reference));
  }
  await reference.close();
});

test('CSS backdrop pixels exactly match Azmoon across panel presets and surfaces', async ({ page, context, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'SVG backdrop refraction is conservatively gated to Chromium.');
  const reference = await context.newPage();
  await ready(page); await ready(reference, referenceURL);
  await normalizeStage(page); await normalizeStage(reference);
  const rows = [];
  for (const preset of ['searchbox', 'switch', 'slider', 'player', 'magnifier', 'panelA', 'panelB']) {
    await setPreset(page, preset); await setPreset(reference, preset);
    const a = await page.locator('#stage').screenshot(), b = await reference.locator('#stage').screenshot();
    const delta = difference(a, b); rows.push({ preset, ...delta });
    expect(delta.changedPixels, preset).toBe(0);
  }
  for (const surface of ['convex_circle', 'convex_squircle', 'concave', 'lip']) {
    for (const target of [page, reference]) {
      await target.evaluate(async surface => {
        P.surface = surface; schedule({ map: true, spec: true, sim: true });
        for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
        if (window.UltimateLiquidGlass) await window.UltimateLiquidGlass.whenSettled();
      }, surface);
    }
    const delta = difference(await page.locator('#stage').screenshot(), await reference.locator('#stage').screenshot());
    rows.push({ surface, ...delta }); expect(delta.changedPixels, surface).toBe(0);
  }
  const report = { browser: browserName, version: page.context().browser().version(), rows };
  await testInfo.attach('azmoon-css-parity', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log('CSS parity:', JSON.stringify(report));
  await reference.close();
});

test('WebGL2 draws real optical changes and comparison mode keeps CSS', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.UltimateLiquidGlass.setRenderer('webgl'));
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().renderer)).toBe('webgl');
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().webglDraws)).toBeGreaterThan(0);
  const before = await page.locator('#stage').screenshot();
  await page.evaluate(() => window.UltimateLiquidGlass.setState({ refraction: 0, specOpacity: 0, saturation: 1 }));
  const after = await page.locator('#stage').screenshot();
  expect(hash(before)).not.toBe(hash(after));
  await page.evaluate(() => window.UltimateLiquidGlass.setRenderer('split'));
  await expect(page.locator('#stage-gl')).toBeVisible();
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', /url|blur/);
  await page.evaluate(() => window.UltimateLiquidGlass.setRenderer('css'));
  await expect(page.locator('#glass-canvas')).not.toBeVisible();
});

test('WebGL2 unavailable keeps the CSS fallback usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...args);
    };
  });
  await ready(page);
  await page.selectOption('#renderer', 'webgl');
  await expect(page.locator('#render-status')).toContainText('CSS fallback');
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().renderer)).toBe('css');
  await expect(page.locator('#glass')).toBeVisible();
});

test('reduced transparency pauses optics and restores the chosen renderer', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.UltimateLiquidGlass.setRenderer('webgl'));
  await page.check('#reduce-transparency');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-transparency', 'true');
  await expect(page.locator('#glass-canvas')).not.toBeVisible();
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', 'none');
  const count = await page.evaluate(() => window.UltimateLiquidGlass.getState().webglDraws);
  await page.evaluate(() => window.UltimateLiquidGlass.setState({ angle: 35 }));
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().webglDraws)).toBe(count);
  await page.uncheck('#reduce-transparency');
  await expect(page.locator('html')).toHaveAttribute('data-render', 'webgl');
});

test('invalid imported state is rejected without partially mutating settings', async ({ page }) => {
  await ready(page);
  const prior = await page.evaluate(() => window.UltimateLiquidGlass.getState().params);
  for (const input of [{ w: 1000000000 }, { blur: NaN }, { surface: '<img src=x onerror=alert(1)>' }, { __unrecognized: 1 }, { specOpacity: 0.9, w: -1 }]) {
    const rejected = await page.evaluate(async input => {
      try { await window.UltimateLiquidGlass.setState(input); return false; } catch { return true; }
    }, input);
    expect(rejected, JSON.stringify(input)).toBe(true);
    expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().params)).toEqual(prior);
  }
});

test('small viewport has no document overflow and arrow keys move the glass', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#glass').focus();
  const before = await page.evaluate(() => window.UltimateLiquidGlass.getState().position.x);
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.UltimateLiquidGlass.getState().position.x)).toBeGreaterThan(before);
  await expect(page.locator('#glass')).toHaveCSS('outline-style', 'solid');
});

test('exports use package tokens and failed clipboard does not claim success', async ({ page }) => {
  await ready(page);
  const exports = await page.evaluate(() => [tokensCSS(), tokensAppCSS(), tokensJSON()]);
  expect(exports[0]).toContain('--lg-');
  expect(exports[1]).toContain('--lg-');
  expect(exports[1]).not.toContain('tools/gen-glass-maps.py');
  expect(exports[1]).not.toContain('--lens-');
  expect(JSON.parse(exports[2]).surface).toBe('convex_squircle');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } });
    document.execCommand = () => false;
  });
  await page.click('#copyBtn');
  await expect(page.locator('#toast')).toContainText('Copy failed');
});

test('forced colors disables optical rendering', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#glass-canvas')).not.toBeVisible();
  await expect(page.locator('#toast')).toHaveCSS('transition-duration', '0s');
});
