import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'shared', 'assets', 'showcase');
const template = fs.readFileSync(path.join(source, 'template.html'), 'utf8');
const optics = fs.readFileSync(path.join(source, 'optics.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'shared', 'assets', 'webgl-glass.js'), 'utf8');
const controller = fs.readFileSync(path.join(source, 'controller.js'), 'utf8');
const images = {};
for (const plate of ['d', 'e', 'f', 'g']) {
  for (const theme of ['light', 'dark']) {
    const svg = fs.readFileSync(path.join(source, 'backgrounds', `bg-${plate}-${theme}.svg`));
    images[`${plate}-${theme}`] = 'data:image/svg+xml;base64,' + svg.toString('base64');
  }
}
const header = 'const ULG_PLATES = ' + JSON.stringify(images) + ';\n';
const script = header + optics + '\n' + renderer + '\n' + controller;
new vm.Script(script, { filename: 'ultimate-liquid-glass-showcase.js' });
const marker = '<!-- ULTIMATE_LIQUID_GLASS_RUNTIME -->';
if (template.split(marker).length !== 2) throw new Error('The showcase template must contain one runtime marker.');
const html = template.replace(marker, '<script>\n' + script.replaceAll('</script', '<\\/script') + '\n</script>');
const target = path.join(root, 'shared', 'assets', 'showcase.html');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== html) {
    console.error('FAIL: standalone showcase is not the current source build. Run npm run build:showcase.');
    process.exitCode = 1;
  } else {
    console.log('PASS: standalone showcase matches its editable source exactly.');
  }
} else {
  fs.writeFileSync(target, html, 'utf8');
  console.log(JSON.stringify({ file: path.relative(root, target), bytes: Buffer.byteLength(html), sha256: crypto.createHash('sha256').update(html).digest('hex') }, null, 2));
}
