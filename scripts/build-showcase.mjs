import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'shared', 'assets');
const source = path.join(assets, 'showcase');
const template = fs.readFileSync(path.join(source, 'template.html'), 'utf8');
const core = fs.readFileSync(path.join(assets, 'liquid-glass.js'), 'utf8');
const optics = fs.readFileSync(path.join(source, 'optics.js'), 'utf8');
const renderer = fs.readFileSync(path.join(assets, 'webgl-glass.js'), 'utf8');
const controller = fs.readFileSync(path.join(source, 'controller.js'), 'utf8');
const presets = JSON.parse(fs.readFileSync(path.join(source, 'presets.json'), 'utf8'));
const requiredPresets = ['navigation', 'toggle', 'slider', 'player', 'loupe', 'panelA', 'panelB'];
if (JSON.stringify(Object.keys(presets).sort()) !== JSON.stringify(requiredPresets.slice().sort())) {
  throw new Error('The seven suite product presets are the only valid preset set.');
}
const numericKeys = ['specular', 'chroma', 'refraction', 'blur', 'lightAngle', 'fill', 'dim',
  'bezel', 'thickness', 'gain', 'radius', 'width', 'height'];
for (const id of requiredPresets) {
  const preset = presets[id];
  if (!preset._derivation || typeof preset._derivation !== 'string') throw new Error(`Missing derivation: ${id}`);
  if (!['convex_circle', 'convex_squircle', 'concave', 'lip'].includes(preset.settings.surface)) {
    throw new Error(`Invalid surface: ${id}`);
  }
  for (const key of numericKeys) {
    if (!Number.isFinite(preset.settings[key])) throw new Error(`Invalid ${id}.${key}`);
  }
  if (preset.settings.radius > Math.min(preset.settings.width, preset.settings.height) / 2) {
    throw new Error(`Radius exceeds geometry: ${id}`);
  }
}

const images = {};
const plateFiles = fs.readdirSync(path.join(source, 'plates')).filter(name => name.endsWith('.svg')).sort();
if (plateFiles.length !== 8) throw new Error('Exactly eight suite-authored SVG plates are required.');
for (const filename of plateFiles) {
  const svg = fs.readFileSync(path.join(source, 'plates', filename));
  images[filename.slice(0, -4)] = 'data:image/svg+xml;base64,' + svg.toString('base64');
}
const header = `const LG_PRODUCT_PRESETS = ${JSON.stringify(presets)};\nconst LG_PLATES = ${JSON.stringify(images)};\n`;
const script = core + '\n' + header + optics + '\n' + renderer + '\n' + controller;
new vm.Script(script, { filename: 'liquid-glass-suite-showcase.js' });
const marker = '<!-- LIQUID_GLASS_SUITE_RUNTIME -->';
if (template.split(marker).length !== 2) throw new Error('The showcase template must contain one runtime marker.');
const html = template.replace(marker, '<script>\n' + script.replace(/<\/script/gi, '<\\/script') + '\n</script>');
const target = path.join(assets, 'showcase.html');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== html) {
    console.error('FAIL: standalone showcase is not the current source build. Run npm run build:showcase.');
    process.exitCode = 1;
  } else {
    console.log('PASS: standalone showcase matches its clean source build exactly.');
  }
} else {
  fs.writeFileSync(target, html, 'utf8');
  console.log(JSON.stringify({ file: path.relative(root, target), bytes: Buffer.byteLength(html),
    presets: requiredPresets.length, plates: plateFiles.length,
    sha256: crypto.createHash('sha256').update(html).digest('hex') }, null, 2));
}
