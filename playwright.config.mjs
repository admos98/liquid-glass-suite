import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

let launchOptions = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.PLAYWRIGHT_SYSTEM_CHROMIUM !== '1') {
  try {
    const { default: Chromium, inflate } = await import('@sparticuz/chromium');
    const libraryPack = fileURLToPath(new URL('./node_modules/@sparticuz/chromium/bin/al2023.tar.br', import.meta.url));
    const libraryRoot = await inflate(libraryPack);
    process.env.LD_LIBRARY_PATH = [path.join(libraryRoot, 'lib'), process.env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':');
    const args = Chromium.args.filter(arg => arg !== '--single-process' && arg !== '--no-zygote');
    launchOptions = { executablePath: await Chromium.executablePath(), args, headless: true };
  } catch (error) {
    if (process.env.CI) throw error; // A declared browser dependency must not silently disappear in CI.
  }
}

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results',
  // No external or committed pixel baselines; tests compare behavior and in-session optical changes.
  reporter: 'list',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  use: {
    headless: true,
    viewport: { width: 1180, height: 980 },
    deviceScaleFactor: 1,
    launchOptions,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
