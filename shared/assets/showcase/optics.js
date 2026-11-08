'use strict';

/* Clean-room showcase state and SVG composition. Mathematical field: field.js.
   Product tuning: presets.json. No external runtime assets or preset data. */

const $ = id => document.getElementById(id);
const FALLBACK_SATURATION = 1.35; // Design choice: modest chroma retention in the universal CSS path.
const DIM_SAMPLES = 33; // Budget: 32 intervals keep transfer tables compact and smooth.
const DIM_TINT = [31 / 255, 29 / 255, 41 / 255]; // Existing suite slate token, normalized.
const TOAST_DURATION = 1800; // UI choice: keep status feedback readable without lingering.
const CHART = Object.freeze({ width: 480, height: 180, padding: 18, arrowGain: 3 }); // Suite visualization dimensions.
const SURFACES = Object.freeze([
  ['convex_circle', 'Convex circle'],
  ['convex_squircle', 'Convex squircle'],
  ['concave', 'Concave'],
  ['lip', 'Lip'],
]);
const STATE_KEYS = Object.freeze(Object.keys(LG_PRODUCT_PRESETS.navigation.settings));
const cloneSettings = settings => ({ ...settings });
const Lab = {
  state: cloneSettings(LG_PRODUCT_PRESETS.navigation.settings),
  maps: null,
  revision: 0,
  filterId: '',
  supported: false,
};
let filterSerial = 0;

function detectSvgBackdrop() {
  const brands = navigator.userAgentData?.brands || [];
  const chromium = brands.find(item => item.brand === 'Chromium' || item.brand === 'Google Chrome');
  const uaVersion = navigator.userAgent.match(/(?:HeadlessChrome|Chrome|Chromium)\/(\d+)/)?.[1];
  const version = Number(chromium?.version || uaVersion || 0);
  // Existing suite support floor: Chromium 138+. Syntax alone is never called paint proof.
  Lab.supported = version >= 138 && CSS.supports('backdrop-filter', 'url(#x)');
}

function validatedSettings(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Settings must be an object.');
  const candidate = cloneSettings(Lab.state);
  for (const [key, value] of Object.entries(patch)) {
    if (!STATE_KEYS.includes(key)) throw new TypeError(`Unknown setting: ${key}`);
    if (key === 'surface') {
      if (!SURFACES.some(([id]) => id === value)) throw new RangeError('Unknown surface.');
    } else {
      const input = $(key);
      const min = Number(input.min), max = Number(input.dataset.limit || input.max);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        throw new RangeError(`Setting outside its allowed range: ${key}`);
      }
    }
    candidate[key] = value;
  }
  if (candidate.radius > Math.min(candidate.width, candidate.height) / 2) {
    throw new RangeError('Radius cannot exceed half the shorter panel side.');
  }
  return candidate;
}

function syncControls() {
  for (const key of STATE_KEYS) {
    if (key === 'surface') continue;
    $(key).value = Lab.state[key];
    const output = $('o-' + key);
    if (output) output.textContent = String(Lab.state[key]) + (key === 'lightAngle' ? '°' : '');
  }
  $('radius').max = Math.floor(Math.min(Lab.state.width, Lab.state.height) / 2);
  document.querySelectorAll('.sbtn').forEach(button => {
    button.classList.toggle('on', button.dataset.surface === Lab.state.surface);
  });
}

function persistState() {
  try {
    const encoded = btoa(JSON.stringify(Lab.state)).replace(/=+$/, '');
    history.replaceState(null, '', '#state=' + encoded);
  } catch { /* file:// history can be unavailable; state remains usable. */ }
}

function restoreState() {
  if (!location.hash.startsWith('#state=')) return;
  try {
    const encoded = location.hash.slice(7);
    const parsed = JSON.parse(atob(encoded));
    Lab.state = validatedSettings(parsed);
  } catch { /* Invalid shared state leaves the complete navigation defaults intact. */ }
}

function mapURL(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width; canvas.height = imageData.height;
  canvas.getContext('2d').putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function washTable(tint, strength) {
  const values = [];
  for (let index = 0; index < DIM_SAMPLES; index++) {
    const x = index / (DIM_SAMPLES - 1);
    values.push((x + strength * x * (tint - x)).toFixed(4)); // Highlight-weighted suite wash; black stays black.
  }
  return values.join(' ');
}

function washMarkup(input, result) {
  const functions = ['R', 'G', 'B'].map((channel, index) =>
    `<feFunc${channel} type="table" tableValues="${washTable(DIM_TINT[index], Lab.state.dim)}"/>`).join('');
  return `<feComponentTransfer in="${input}" result="${result}">${functions}</feComponentTransfer>`;
}

function renderSvgFilter(vectorURL, lightURL) {
  const id = `lg-sdf-${++filterSerial}`;
  const s = Lab.state;
  $('filterDefs').innerHTML = `<filter id="${id}" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feImage href="${vectorURL}" x="0" y="0" width="${s.width}" height="${s.height}" preserveAspectRatio="none" result="vector-field"/>
    <feDisplacementMap in="SourceGraphic" in2="vector-field" scale="${Lab.maps.scale}" xChannelSelector="R" yChannelSelector="G" result="refracted"/>
    <feColorMatrix in="refracted" type="saturate" values="${s.chroma}" result="rim-chroma"/>
    ${washMarkup('refracted', 'body-wash')}
    ${washMarkup('rim-chroma', 'rim-wash')}
    <feImage href="${lightURL}" x="0" y="0" width="${s.width}" height="${s.height}" preserveAspectRatio="none" result="light-mask"/>
    <feComposite in="rim-wash" in2="light-mask" operator="in" result="colored-rim"/>
    <feBlend in="colored-rim" in2="body-wash" mode="normal" result="body-plus-rim"/>
    <feBlend in="light-mask" in2="body-plus-rim" mode="normal"/>
  </filter>`;
  Lab.filterId = id;
  const chain = `blur(${s.blur}px) saturate(${FALLBACK_SATURATION})` + (Lab.supported ? ` url(#${id})` : '');
  $('glass').style.backdropFilter = chain;
  $('glass').style.webkitBackdropFilter = chain;
}

function drawMapPreview() {
  const canvas = $('mapCanvas');
  canvas.width = Lab.maps.width; canvas.height = Lab.maps.height;
  canvas.getContext('2d').putImageData(Lab.maps.displacement, 0, 0);
  $('mapMeta').textContent = `${Lab.maps.width}×${Lab.maps.height} · 1 px/CSS px · scale ${Lab.maps.scale}`;
}

function decodedVector(x, y) {
  const data = Lab.maps.displacement.data;
  const index = (y * Lab.maps.width + x) * 4;
  const decode = channel => (channel - 128) / 128 * LiquidGlassField.DISPLACEMENT_RANGE;
  return [decode(data[index]), decode(data[index + 1])];
}

function prepareChart(canvas) {
  canvas.width = CHART.width; canvas.height = CHART.height;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#9994'; context.lineWidth = 1;
  context.beginPath(); context.moveTo(CHART.padding, CHART.height / 2);
  context.lineTo(CHART.width - CHART.padding, CHART.height / 2); context.stroke();
  return context;
}

function drawCrossSection() {
  const context = prepareChart($('simCanvas'));
  const y = Math.floor(Lab.maps.height / 2);
  const step = Math.max(6, Math.floor(Lab.maps.width / 24)); // Budget: at most about 24 arrows.
  const scaleX = (CHART.width - CHART.padding * 2) / Lab.maps.width;
  for (let x = 0; x < Lab.maps.width; x += step) {
    const [dx, dy] = decodedVector(x, y);
    const sx = CHART.padding + x * scaleX, sy = CHART.height / 2;
    const magnitude = Math.hypot(dx, dy);
    context.strokeStyle = `rgb(109 40 217 / ${Math.min(1, 0.25 + magnitude / 12)})`;
    context.beginPath(); context.moveTo(sx, sy);
    context.lineTo(sx + dx * CHART.arrowGain, sy + dy * CHART.arrowGain); context.stroke();
  }
}

function drawDisplacementChart() {
  const context = prepareChart($('chartCanvas'));
  const y = Math.floor(Lab.maps.height / 2);
  context.strokeStyle = '#7c3aed'; context.lineWidth = 1.5; context.beginPath();
  for (let x = 0; x < Lab.maps.width; x++) {
    const [dx] = decodedVector(x, y);
    const px = CHART.padding + x / Math.max(1, Lab.maps.width - 1) * (CHART.width - CHART.padding * 2);
    const py = CHART.height / 2 - dx * CHART.arrowGain;
    if (x === 0) context.moveTo(px, py); else context.lineTo(px, py);
  }
  context.stroke();
}

function applyGeometry() {
  const glass = $('glass');
  glass.style.width = Lab.state.width + 'px'; glass.style.height = Lab.state.height + 'px';
  glass.style.borderRadius = Lab.state.radius + 'px';
  glass.style.background = `rgba(255,255,255,${Lab.state.fill})`;
}

function rebuildLab() {
  Lab.maps = LiquidGlassField.createMaps(Lab.state);
  Lab.revision++;
  applyGeometry();
  renderSvgFilter(mapURL(Lab.maps.displacement), mapURL(Lab.maps.specular));
  drawMapPreview(); drawCrossSection(); drawDisplacementChart();
  document.dispatchEvent(new CustomEvent('lg-lab-change', { detail: { revision: Lab.revision } }));
}

function setLabState(patch, { persist = true } = {}) {
  const candidate = validatedSettings(patch); // Validate the whole transaction before mutating Lab.state.
  Lab.state = candidate;
  syncControls(); rebuildLab();
  if (persist) persistState();
}

function toast(message) {
  const node = $('toast');
  node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), TOAST_DURATION);
}

function tokensCSS() {
  const lines = STATE_KEYS.map(key => `--lg-${key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())}: ${Lab.state[key]};`);
  lines.push(`--lg-filter-scale: ${Lab.maps.scale};`);
  return `:root {\n  ${lines.join('\n  ')}\n}`;
}
function integrationCSS() {
  return `${tokensCSS()}\n/* Use the suite drop-in for apps; regenerate maps for actual panel geometry. */`;
}
function stateJSON() {
  return JSON.stringify({ engine: 'sdf-vector-v1', settings: Lab.state,
    map: { width: Lab.maps.width, height: Lab.maps.height, scale: Lab.maps.scale } }, null, 2);
}

async function copyText(text) {
  let clipboardError = null;
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch (error) { clipboardError = error; }
  }
  const area = document.createElement('textarea');
  area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select();
  const copied = document.execCommand && document.execCommand('copy');
  area.remove();
  if (!copied) throw clipboardError || new Error('Clipboard unavailable');
}

function bindExport(buttonId, exporter) {
  $(buttonId).addEventListener('click', async () => {
    try { await copyText(exporter()); $('status').textContent = 'Export copied.'; toast('Copied'); }
    catch { $('status').textContent = 'Clipboard unavailable.'; toast('Copy failed'); }
  });
}

function generatedPlate() {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 540; // Suite-authored deterministic plate dimensions.
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 960, 540);
  gradient.addColorStop(0, '#0f766e'); gradient.addColorStop(0.5, '#3730a3'); gradient.addColorStop(1, '#be185d');
  context.fillStyle = gradient; context.fillRect(0, 0, 960, 540);
  context.strokeStyle = '#ffffff38'; context.lineWidth = 1;
  for (let x = 0; x < 960; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 540); context.stroke(); }
  for (let y = 0; y < 540; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(960, y); context.stroke(); }
  for (let index = 0; index < 18; index++) {
    const x = (index * 173) % 960, y = (index * 97) % 540;
    context.fillStyle = index % 2 ? '#fbbf24aa' : '#f8fafc99';
    context.beginPath(); context.arc(x, y, 24 + index % 4 * 8, 0, Math.PI * 2); context.fill();
  }
  return canvas.toDataURL('image/png');
}
let generatedPlateURL = '';
function selectPlate(button) {
  document.querySelectorAll('.chip.plate').forEach(item => item.classList.toggle('on', item === button));
  const stage = $('stage');
  stage.classList.remove('dark', 'light'); stage.classList.add(button.dataset.theme);
  stage.style.backgroundImage = `url("${LG_PLATES[`${button.dataset.plate}-${button.dataset.theme}`]}")`;
  document.dispatchEvent(new Event('lg-plate-change'));
}

function bindInterface() {
  const container = $('surfaceBtns');
  SURFACES.forEach(([id, label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sbtn'; button.dataset.surface = id; button.textContent = label;
    button.addEventListener('click', () => setLabState({ surface: id }));
    container.appendChild(button);
  });
  STATE_KEYS.filter(key => key !== 'surface').forEach(key => {
    $(key).addEventListener(key === 'width' || key === 'height' ? 'change' : 'input', () => {
      try { setLabState({ [key]: Number($(key).value) }); }
      catch (error) { syncControls(); toast(error.message); }
    });
  });
  document.querySelectorAll('[data-preset]').forEach(button => {
    button.addEventListener('click', () => {
      const preset = LG_PRODUCT_PRESETS[button.dataset.preset];
      if (!preset) return;
      setLabState(cloneSettings(preset.settings)); toast(button.textContent.trim());
    });
  });
  document.querySelectorAll('.chip.plate').forEach(button => button.addEventListener('click', () => selectPlate(button)));
  $('imgBg').addEventListener('change', event => {
    if (event.target.checked) {
      if (!generatedPlateURL) generatedPlateURL = generatedPlate();
      $('stage').style.backgroundImage = `url("${generatedPlateURL}")`;
      document.dispatchEvent(new Event('lg-plate-change'));
    } else {
      selectPlate(document.querySelector('.chip.plate.on') || document.querySelector('.chip.plate'));
    }
  });
  bindExport('copyBtn', tokensCSS); bindExport('copyJsonBtn', stateJSON); bindExport('copyAppBtn', integrationCSS);
}

detectSvgBackdrop();
bindInterface();
restoreState();
syncControls();
if (document.querySelector('.chip.plate.on')) selectPlate(document.querySelector('.chip.plate.on'));
rebuildLab();
$('browserBadge').textContent = 'Clean-room SDF optics';
