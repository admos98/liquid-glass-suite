import { test as base, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(page);
    expect(errors, 'no uncaught browser errors').toEqual([]);
  },
});
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const showcase = pathToFileURL(path.join(root, 'shared/assets/showcase.html')).href;
const presets = JSON.parse(fs.readFileSync(path.join(root, 'shared/assets/showcase/presets.json'), 'utf8'));

async function boot(page) {
  await page.goto(showcase);
  await page.waitForFunction(() => window.LiquidGlassShowcase?.getState().mapSize);
  await settle(page);
}
async function settle(page) { await page.evaluate(() => window.LiquidGlassShowcase.whenSettled()); }
async function renderer(page, mode) {
  await page.evaluate(async value => { await window.LiquidGlassShowcase.setRenderer(value); }, mode);
  await expect.poll(() => page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe(mode);
}

test('offline file operation, both renderers, split and all owned plates', async ({ page, context }) => {
  const network = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await context.setOffline(true);
  await boot(page);
  expect(new URL(page.url()).protocol).toBe('file:');
  expect(network).toEqual([]);
  const initial = await page.evaluate(() => window.LiquidGlassShowcase.getState());
  expect(initial.renderer).toBe('css');
  expect(initial.displacementScale).toBe(48);
  await expect(page.locator('#filterDefs filter')).toHaveCount(1);
  await expect(page.locator('#glass-canvas')).toBeHidden();

  await renderer(page, 'webgl');
  const webgl = await page.evaluate(() => {
    const canvas = document.getElementById('glass-canvas');
    const gl = canvas.getContext('webgl2');
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const colors = new Set();
    for (let index = 0; index < pixels.length; index += 1600) colors.add(pixels.slice(index, index + 4).join(','));
    return { ...window.LiquidGlassShowcase.getState(), colors: colors.size, visible: canvas.style.display };
  });
  expect(webgl.webglDraws).toBeGreaterThan(0);
  expect(webgl.colors).toBeGreaterThan(10);
  expect(webgl.visible).toBe('block');

  for (const button of await page.locator('.chip.plate').all()) {
    const before = await page.evaluate(() => window.LiquidGlassShowcase.getState().webglDraws);
    await button.click(); await settle(page);
    expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().webglDraws)).toBeGreaterThan(before);
    await expect(page.locator('#stage')).toHaveCSS('background-image', /data:image\/svg\+xml;base64/);
  }
  await page.locator('#imgBg').check(); await settle(page);
  await expect(page.locator('#stage')).toHaveCSS('background-image', /data:image\/png;base64/);
  await renderer(page, 'split');
  await expect(page.locator('#stage-gl')).toBeVisible();
  await expect(page.locator('#stage-gl #glass-canvas')).toBeVisible();
  await expect(page.locator('#filterDefs filter')).toHaveCount(1);
  await renderer(page, 'css');
  await expect(page.locator('#glass-canvas')).toBeHidden();
  await expect(page.locator('#stage-gl')).toBeHidden();
});

test('mathematical properties: neutral center, edge growth, symmetry and directional light', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.LiquidGlassShowcase.setState({
    width: 340, height: 120, radius: 18, surface: 'convex_squircle', bezel: 16,
    thickness: 48, refraction: 0.85, gain: 1, lightAngle: -90, specular: 0.5,
  }));
  const result = await page.evaluate(() => {
    const { displacement: map, specular: light } = window.LiquidGlassShowcase.maps();
    const at = (image, x, y) => Array.from(image.data.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4));
    let symmetric = true;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      const a = at(map, x, y), b = at(map, map.width - 1 - x, map.height - 1 - y);
      if (Math.abs(a[0] + b[0] - 256) > 1 || Math.abs(a[1] + b[1] - 256) > 1) symmetric = false;
    }
    const x = Math.floor(map.width / 2), y = Math.floor(map.height / 2);
    return {
      center: at(map, x, y), border: at(map, 0, y), nearEdge: at(map, 2, y), symmetric,
      top: at(light, x, 1)[3], bottom: at(light, x, map.height - 2)[3],
      flat: at(map, x, map.height - 20),
    };
  });
  expect(result.center).toEqual([128, 128, 128, 255]);
  expect(result.flat).toEqual([128, 128, 128, 255]);
  expect(result.symmetric).toBe(true);
  expect(Math.abs(result.nearEdge[0] - 128)).toBeGreaterThan(Math.abs(result.border[0] - 128));
  expect(result.top).toBeGreaterThan(0);
  expect(result.bottom).toBe(0);

  const reversed = await page.evaluate(() => {
    const { specular: light } = window.LiquidGlassShowcase.maps();
    const x = Math.floor(light.width / 2);
    const alpha = y => light.data[(y * light.width + x) * 4 + 3];
    return { before: [alpha(1), alpha(light.height - 2)] };
  });
  await page.evaluate(() => window.LiquidGlassShowcase.setState({ lightAngle: 90 }));
  const flipped = await page.evaluate(() => {
    const { specular: light } = window.LiquidGlassShowcase.maps();
    const x = Math.floor(light.width / 2), alpha = y => light.data[(y * light.width + x) * 4 + 3];
    return [alpha(1), alpha(light.height - 2)];
  });
  expect(reversed.before[0]).toBeGreaterThan(0);
  expect(flipped[0]).toBe(0);
  expect(flipped[1]).toBeGreaterThan(0);
});

test('all four surface families and every live control regenerate maps', async ({ page }) => {
  await boot(page);
  for (const surface of ['convex_circle', 'convex_squircle', 'concave', 'lip']) {
    await page.locator(`[data-surface="${surface}"]`).click();
    const state = await page.evaluate(() => window.LiquidGlassShowcase.getState());
    expect(state.params.surface).toBe(surface);
    expect(state.mapSize).toEqual([state.params.width, state.params.height]);
    const properties = await page.evaluate(() => {
      const { displacement: map } = window.LiquidGlassShowcase.maps();
      const at = (x, y) => Array.from(map.data.slice((y * map.width + x) * 4, (y * map.width + x) * 4 + 4));
      let symmetric = true, nonNeutralEdges = 0;
      for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
        const a = at(x, y), b = at(map.width - 1 - x, map.height - 1 - y);
        if (Math.abs(a[0] + b[0] - 256) > 1 || Math.abs(a[1] + b[1] - 256) > 1) symmetric = false;
        if (a[0] !== 128 || a[1] !== 128) nonNeutralEdges++;
      }
      return { center: at(Math.floor(map.width / 2), Math.floor(map.height / 2)), symmetric, nonNeutralEdges };
    });
    expect(properties.center).toEqual([128, 128, 128, 255]);
    expect(properties.symmetric).toBe(true);
    expect(properties.nonNeutralEdges).toBeGreaterThan(0);
  }
  const values = { specular: 0.55, chroma: 3.5, refraction: 1.1, blur: 5.5, lightAngle: 45,
    fill: 0.22, dim: 0.3, bezel: 18, thickness: 62, gain: 0.85, width: 360, height: 140, radius: 20 };
  for (const [id, value] of Object.entries(values)) {
    const revision = await page.evaluate(() => Lab.revision);
    await page.locator('#' + id).evaluate((input, next) => {
      input.value = String(next); input.dispatchEvent(new Event(input.type === 'number' ? 'change' : 'input', { bubbles: true }));
    }, value);
    expect(await page.evaluate(key => window.LiquidGlassShowcase.getState().params[key], id)).toBe(value);
    expect(await page.evaluate(() => Lab.revision)).toBeGreaterThan(revision);
    if (id === 'width' || id === 'height') await expect(page.locator('#' + id)).toHaveValue(String(value));
    else await expect(page.locator('#o-' + id)).toHaveText(String(value) + (id === 'lightAngle' ? '°' : ''));
  }
  for (const canvas of ['simCanvas', 'chartCanvas', 'mapCanvas']) {
    expect(await page.locator('#' + canvas).evaluate(node => node.toDataURL().length)).toBeGreaterThan(500);
  }
});

test('seven exact product presets and validated atomic state', async ({ page }) => {
  await boot(page);
  await expect(page.locator('[data-preset]')).toHaveCount(7);
  const beforeVisuals = await page.evaluate(() => ['simCanvas', 'chartCanvas', 'mapCanvas'].map(id => document.getElementById(id).toDataURL()));
  for (const [id, preset] of Object.entries(presets)) {
    await page.locator(`[data-preset="${id}"]`).click();
    expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().params)).toEqual(preset.settings);
  }
  const afterVisuals = await page.evaluate(() => ['simCanvas', 'chartCanvas', 'mapCanvas'].map(id => document.getElementById(id).toDataURL()));
  expect(afterVisuals).not.toEqual(beforeVisuals);
  const before = await page.evaluate(() => ({ state: window.LiquidGlassShowcase.getState().params, revision: Lab.revision }));
  for (const invalid of [{ __unrecognized: 1 }, { specular: 2 }, { radius: 10000 }, { gain: null }, [1, 2]]) {
    await expect(page.evaluate(async patch => { await window.LiquidGlassShowcase.setState(patch); }, invalid)).rejects.toThrow();
    expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().params)).toEqual(before.state);
    expect(await page.evaluate(() => Lab.revision)).toBe(before.revision);
  }
  await expect(page.evaluate(() => window.LiquidGlassShowcase.setState({ specular: NaN }))).rejects.toThrow();
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().params)).toEqual(before.state);
});

test('pointer, keyboard, reset, preset centering and focus', async ({ page }) => {
  await boot(page);
  const box = await page.locator('#glass').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 35, { steps: 4 }); await page.mouse.up();
  const moved = await page.evaluate(() => window.LiquidGlassShowcase.getState().position);
  expect(moved.x).toBeGreaterThan(0.5); expect(moved.y).toBeGreaterThan(0.5);
  await page.locator('#glass').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().position.x)).toBeGreaterThan(moved.x);
  await expect(page.locator('#glass')).toHaveCSS('outline-style', 'solid');
  await page.locator('#reset-position').click();
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().position)).toEqual({ x: 0.5, y: 0.5 });
  await page.keyboard.press('ArrowLeft');
  await page.locator('[data-preset="toggle"]').click();
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().position)).toEqual({ x: 0.5, y: 0.5 });
});

test('URL restore, malformed state, mobile layout and export success/failure', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.LiquidGlassShowcase.setState({ width: 366, specular: 0.6 }));
  await page.reload(); await page.waitForFunction(() => window.LiquidGlassShowcase?.getState().mapSize);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().params.width)).toBe(366);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().params.specular)).toBe(0.6);
  await page.goto(showcase + '#state=%%%'); await page.reload(); await page.waitForFunction(() => window.LiquidGlassShowcase?.getState().mapSize);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().params)).toEqual(presets.navigation.settings);
  await page.setViewportSize({ width: 375, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('#stage')).toHaveCSS('height', '320px');

  await page.evaluate(() => {
    window.copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedText = text; } } });
  });
  await page.locator('#copyBtn').click(); await expect(page.locator('#status')).toHaveText('Export copied.');
  expect(await page.evaluate(() => window.copiedText)).toContain('--lg-filter-scale: 48;');
  await page.locator('#copyAppBtn').click();
  expect(await page.evaluate(() => window.copiedText)).toContain('Use the suite drop-in for apps');
  await page.locator('#copyJsonBtn').click();
  expect(JSON.parse(await page.evaluate(() => window.copiedText)).engine).toBe('sdf-vector-v1');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
    document.execCommand = () => false;
  });
  await page.locator('#copyJsonBtn').click(); await expect(page.locator('#status')).toHaveText('Clipboard unavailable.');
  await expect(page.locator('#toast')).toHaveText('Copy failed');
});

test('manual, media and forced-colors transparency fallbacks restore cleanly', async ({ page }) => {
  await boot(page); await renderer(page, 'webgl');
  await page.locator('#reduce-transparency').check(); await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('css');
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().requestedRenderer)).toBe('webgl');
  const pausedDraws = await page.evaluate(() => window.LiquidGlassShowcase.getState().webglDraws);
  await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().webglDraws)).toBe(pausedDraws);
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#render-status')).toContainText('solid preview');
  await page.locator('#reduce-transparency').uncheck(); await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('webgl');

  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().reduced)).toBe(true);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('css');
  await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }] });
  await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('webgl');

  await page.emulateMedia({ forcedColors: 'active' }); await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('css');
  await expect(page.locator('#glass')).toHaveCSS('border-top-style', 'solid');
  await page.emulateMedia({ forcedColors: 'none' }); await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('webgl');
  await expect(page.locator('#filterDefs filter')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#toast')).toHaveCSS('transition-duration', '0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

test('visible CSS fallback works for unsupported SVG and unavailable WebGL2', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' });
  await boot(page);
  await expect(page.locator('#render-status')).toContainText('CSS fallback');
  await expect(page.locator('#glass')).toHaveCSS('backdrop-filter', /blur\(/);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('glass')).backdropFilter.includes('url('))).toBe(false);
  await renderer(page, 'webgl');
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().webglDraws)).toBeGreaterThan(0);

  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  await page.reload(); await page.waitForFunction(() => window.LiquidGlassShowcase?.getState().mapSize);
  await page.evaluate(() => window.LiquidGlassShowcase.setRenderer('webgl')); await settle(page);
  expect(await page.evaluate(() => window.LiquidGlassShowcase.getState().renderer)).toBe('css');
  await expect(page.locator('#render-status')).toContainText('CSS fallback is active');
});

test.describe('suite-owned visual baselines', () => {
  test('CSS navigation screenshot', async ({ page }) => {
    await boot(page);
    await expect(page.locator('#stage')).toHaveScreenshot('css-navigation.png', { animations: 'disabled', maxDiffPixelRatio: 0.005 });
  });
  test('WebGL media screenshot', async ({ page }) => {
    await boot(page); await page.locator('[data-preset="player"]').click();
    await page.locator('[data-plate="orbit"][data-theme="dark"]').click();
    await renderer(page, 'webgl');
    await expect(page.locator('#stage')).toHaveScreenshot('webgl-media.png', { animations: 'disabled', maxDiffPixelRatio: 0.005 });
  });
  test('split loupe screenshot', async ({ page }) => {
    await boot(page); await page.locator('[data-preset="loupe"]').click();
    await page.locator('[data-plate="spectrum"][data-theme="light"]').click();
    await renderer(page, 'split');
    await expect(page.locator('.wrap')).toHaveScreenshot('split-loupe.png', { animations: 'disabled', maxDiffPixelRatio: 0.005 });
  });
});
