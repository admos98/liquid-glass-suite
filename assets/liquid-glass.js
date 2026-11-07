/*
 * liquid-glass.js — strategy-1 SVG lens injector + capability gate.
 *
 * Extracted from source references/strategy-picker.md (paint probe,
 * purely additive gate, document.documentElement.dataset),
 * references/chromium-quirks.md (alpha-255 map, fresh filter IDs, region),
 * references/svg-filter-graph.md (map head smoothing), and
 * references/dim-and-rim.md (delegated pointer listener).
 * MIT — see LICENSE. Vanilla JS, zero dependencies, no framework code.
 *
 * Load this in <head> (or before the first glass element) so the conservative
 * dataset value is set BEFORE any glass paints. Refraction is purely additive:
 * with no JS, or a failed paint probe, every engine keeps blur() + saturate().
 * The CSS places url() LAST in the chain; this file only supplies the ID.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var host = document.body || document.head || root;

  // Build a real SVG element without writing a namespace URL in source.
  var holder = document.createElement('div');
  holder.innerHTML = '<svg width="0" height="0" aria-hidden="true" style="position:absolute"></svg>';
  var svg = holder.firstElementChild;
  var NS = svg.namespaceURI;
  var defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);
  host.appendChild(svg);

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  /* ---------- Displacement map: neutral centre, two channels, alpha 255 ---- */

  // 256x160 is the "wide" ladder canvas from references/12b; 1 map-px per
  // CSS px, long side well under the 512px Safari ceiling (references/07).
  var MAP_W = 256, MAP_H = 160;

  function profile(len, band) {
    var a = new Float32Array(band), i, j, pass, prev;
    for (i = 0; i < band; i++) a[i] = 1 - i / (band - 1);
    a[0] = a[1];                                  // border starts at the peak
    for (pass = 0; pass < 2; pass++) {            // [1,2,1]/4 box smoothing
      prev = a.slice();
      for (j = 1; j < band - 1; j++) a[j] = (prev[j - 1] + 2 * prev[j] + prev[j + 1]) / 4;
    }
    for (j = 1; j < band; j++) {                  // monotone non-increasing
      if (a[j] > a[j - 1]) a[j] = a[j - 1];
    }
    a[band - 1] = 0;                              // pin last sample
    return a;
  }

  function mapPNG() {
    var c = document.createElement('canvas');
    c.width = MAP_W; c.height = MAP_H;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(MAP_W, MAP_H);
    // 18% flat shoulder per direction (references/10, "A grayscale map is
    // not a lens"); the ramp outside it is the bezel band.
    var bx = Math.round(MAP_W * 0.18), by = Math.round(MAP_H * 0.18);
    var px = profile(MAP_W, bx), py = profile(MAP_H, by), x, y, o;
    for (y = 0; y < MAP_H; y++) {
      for (x = 0; x < MAP_W; x++) {
        var rx = px[x < bx ? x : (x > MAP_W - 1 - bx ? MAP_W - 1 - x : bx - 1)];
        var ry = py[y < by ? y : (y > MAP_H - 1 - by ? MAP_H - 1 - y : by - 1)];
        if (rx < 0) rx = 0;
        if (ry < 0) ry = 0;
        o = (y * MAP_W + x) * 4;
        // R = horizontal offset, G = vertical offset, 128 = identity.
        img.data[o]     = x < MAP_W / 2 ? 128 - 127 * rx : 128 + 127 * rx;
        img.data[o + 1] = y < MAP_H / 2 ? 128 - 127 * ry : 128 + 127 * ry;
        img.data[o + 2] = 128;
        img.data[o + 3] = 255;   // alpha 0 kills the map in Chromium (06 §1)
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }

  /* ---------- Lens injector: fresh ID on every rebuild -------------------- */

  var seq = 0, liveId = null, liveNode = null;
  var png = mapPNG();

  function rebuildLens() {
    var old = liveNode;
    var id = 'lg-lens-' + (++seq);

    var filter = el('filter', {
      id: id, x: '0', y: '0', width: '100%', height: '100%',
      'color-interpolation-filters': 'sRGB'
    });
    // External file hrefs never load inside backdrop-filter chains (12b);
    // data URIs do. preserveAspectRatio="none" bakes the bezel as fractions
    // (05 Parity check 2) — one map is exact only at its canonical size.
    var feImage = el('feImage', {
      x: '0', y: '0', width: '100%', height: '100%',
      preserveAspectRatio: 'none', result: 'map'
    });
    feImage.setAttribute('href', png);
    feImage.setAttribute('xlink:href', png);
    filter.appendChild(feImage);
    filter.appendChild(el('feDisplacementMap', {
      'in': 'SourceGraphic', in2: 'map', scale: '40',
      xChannelSelector: 'R', yChannelSelector: 'G'
    }));
    defs.appendChild(filter);

    // url() is LAST in the CSS chain (liquid-glass.css). Update the shared
    // custom property first, THEN remove the stale node: Safari and Chromium
    // cache <filter> output by ID, so a reused ID freezes mid-motion (06 §3).
    root.style.setProperty('--lg-lens', 'url(#' + id + ')');
    if (old) old.remove();
    liveNode = filter;
    liveId = id;
    return id;
  }

  rebuildLens();

  /* ---------- Paint probe (NOT an @supports syntax probe) ----------------- */

  // A white square drawn through feDisplacementMap with R=255, G=128 moves
  // +10px in x and ~0 in y. If url() filters do not paint, the square stays.
  var PROBE_FILTER = el('filter', {
    id: 'lg-probe', filterUnits: 'userSpaceOnUse',
    x: '0', y: '0', width: '64', height: '64',
    'color-interpolation-filters': 'sRGB'
  });
  PROBE_FILTER.appendChild(el('feFlood', { 'flood-color': '#ff8080', result: 'map' }));
  PROBE_FILTER.appendChild(el('feDisplacementMap', {
    'in': 'SourceGraphic', in2: 'map', scale: '20',
    xChannelSelector: 'R', yChannelSelector: 'G'
  }));
  defs.appendChild(PROBE_FILTER);

  function readShifted(canvas) {
    var ctx = canvas.getContext('2d');
    var before = ctx.getImageData(26, 32, 1, 1).data;
    var after = ctx.getImageData(44, 32, 1, 1).data;
    return before[0] < 40 && after[0] > 200;
  }

  function syncProbe() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 64, 64);
    ctx.filter = 'url(#lg-probe)';
    if (ctx.filter === 'none' || ctx.filter === '') return null;  // unsupported
    ctx.fillStyle = '#fff'; ctx.fillRect(24, 24, 16, 16);
    try { return readShifted(c); } catch (e) { return null; }
  }

  function asyncProbe() {
    return new Promise(function (resolve) {
      var h = document.createElement('div');
      h.innerHTML = '<svg width="64" height="64" viewBox="0 0 64 64">' +
        '<defs><filter id="lg-probe-img" filterUnits="userSpaceOnUse" ' +
        'x="0" y="0" width="64" height="64" color-interpolation-filters="sRGB">' +
        '<feFlood flood-color="#ff8080" result="map"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="20" ' +
        'xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter></defs>' +
        '<rect width="64" height="64" fill="#000"/>' +
        '<rect x="24" y="24" width="16" height="16" fill="#fff" ' +
        'filter="url(#lg-probe-img)"/></svg>';
      // XMLSerializer adds the SVG namespace at runtime; no external URL is
      // written in source. A data URI is same-origin for canvas readback.
      var text = new XMLSerializer().serializeToString(h.firstElementChild);
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = 64; c.height = 64;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(readShifted(c));
        } catch (e) { resolve(false); }
      };
      img.onerror = function () { resolve(false); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
    });
  }

  // Engine-version probe: strategy 2 (backdrop-filter: url()) is Chromium-only.
  // 02 states the handoff floor as "Chromium-138+-only". This is a secondary
  // guard; the PRIMARY signal is the paint probe above.
  function chromium138Plus() {
    var ua = navigator.userAgentData;
    if (!ua || !ua.brands) return false;
    var v = 0;
    ua.brands.forEach(function (b) {
      var n = parseInt(b.version, 10);
      if (b.brand === 'Chromium') v = Math.max(v, n);
      else if (b.brand === 'Google Chrome') v = Math.max(v, n);
    });
    return v >= 138;
  }

  // Pre-paint gate: conservative value before anything paints. No url() is
  // referenced by CSS until a real filter has been observed painting pixels.
  root.dataset.lgRefraction = 'off';

  function applyProbe(painted) {
    root.dataset.lgRefraction = painted ? (chromium138Plus() ? 'backdrop' : 'lens') : 'off';
  }

  var immediate = syncProbe();
  if (immediate === null) asyncProbe().then(applyProbe);
  else applyProbe(immediate);

  /* ---------- One delegated pointer listener for rim light ---------------- */

  if (root.dataset.motion === 'reduce' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    return;   // parked under both motion preferences (references/11)
  }

  var RIM = '.lg';
  var EPSILON = 0.5;   // jitter under this px reuses the last position
  var NEAR = 0.7;      // half-diagonal fraction at which the rim counts as lit
  var REACH = 1.1;     // ...and as fully dark
  var EASE = 0.18;     // per-frame lerp toward target boost
  var lastX = NaN, lastY = NaN, lit = null, boost = 0, target = 0, raf = 0;

  function tick() {
    boost += (target - boost) * EASE;
    if (Math.abs(target - boost) < EASE) boost = target;
    if (lit) lit.style.setProperty('--eg-boost', boost.toFixed(3));
    raf = boost === target ? 0 : requestAnimationFrame(tick);
  }

  function relight(node, x, y) {
    if (lit && lit !== node) {
      lit.style.setProperty('--eg-boost', '0');   // no stuck hover behind cursor
      lit = null; boost = 0; target = 0;
    }
    if (!node) return;
    var r = node.getBoundingClientRect();
    if (!r.width || !r.height) return;
    node.style.setProperty('--eg-x', ((x - r.left) / r.width * 100).toFixed(2) + '%');
    node.style.setProperty('--eg-y', ((y - r.top) / r.height * 100).toFixed(2) + '%');
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var half = Math.sqrt(r.width * r.width + r.height * r.height) / 2;
    var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    target = Math.max(0, Math.min(1, 1 - (d / half - NEAR) / (REACH - NEAR)));
    lit = node;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;  // touch has no hover
    var x = e.clientX, y = e.clientY;
    if (Number.isFinite(lastX) && Math.abs(x - lastX) < EPSILON &&
        Math.abs(y - lastY) < EPSILON) return;
    lastX = x; lastY = y;
    var hit = document.elementFromPoint(x, y);
    relight(hit ? hit.closest(RIM) : null, x, y);
  }, { passive: true });

  window.LiquidGlass = {
    rebuildLens: rebuildLens,          // fresh ID on every update (06 §3)
    lensId: function () { return liveId; },
    refraction: function () { return root.dataset.lgRefraction; }
  };
})();
