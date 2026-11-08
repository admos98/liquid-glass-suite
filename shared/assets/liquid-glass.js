/*
 * Liquid Glass Suite clean-room SDF optics.
 *
 * Technique follows the approach explained in kube's 'Liquid Glass in the Browser' (kube.io/blog/liquid-glass-css-svg) — the guide this project learned from. The implementation in this repository is an independent clean-room implementation; no kube.io code or assets are included, and this project is not affiliated with kube.io or Apple.
 *
 * Independent derivation: evaluate a rounded-rectangle signed-distance field at
 * each pixel, use its analytic gradient as the outward direction, derive slope
 * from a mathematical height family, then apply vector Snell refraction. There
 * is no profile lookup table and no external preset or specular sample data.
 */
'use strict';
const LiquidGlassField = (() => {
  const GLASS_IOR = 1.5; // Textbook approximation for common glass in air.
  const DISPLACEMENT_RANGE = 24; // Design budget: cap lateral travel at 24 CSS px.
  const FILTER_SCALE = DISPLACEMENT_RANGE * 2; // SVG scale maps ±RANGE to channel endpoints.
  const SLOPE_LIMIT = 8; // Stability budget for the singular edge derivative.
  const HEIGHT_EPSILON = 0.001; // Central-difference step in normalized bezel space.
  const RIM_WIDTH = 3; // Design token: a narrow three-CSS-pixel light band.
  const SPECULAR_LOBE = 3; // Design choice: cubic lobe narrows the lit edge.
  const LIP_STRETCH = 1.25; // Design choice: shorten the lip's first transition region.

  const clamp01 = value => Math.max(0, Math.min(1, value));
  const smooth = value => {
    const t = clamp01(value);
    return t * t * t * (t * (t * 6 - 15) + 10); // Quintic smootherstep identity.
  };

  function heightAt(family, distance) {
    const t = clamp01(distance);
    const circle = Math.sqrt(Math.max(0, 1 - (1 - t) ** 2));
    const squircle = Math.max(0, 1 - (1 - t) ** 4) ** 0.25;
    if (family === 'convex_circle') return circle;
    if (family === 'concave') return 1 - circle;
    if (family === 'lip') {
      const leading = Math.max(0, 1 - (1 - clamp01(t * LIP_STRETCH)) ** 4) ** 0.25;
      return leading * (1 - smooth(t)) + (1 - circle) * smooth(t);
    }
    return squircle;
  }

  /* Standard rounded-box SDF plus its analytic gradient. The gradient points
     out of the panel; only the bezel uses it, so the flat center is neutral. */
  function roundedFrame(x, y, width, height, radius) {
    const px = x - width / 2, py = y - height / 2;
    const qx = Math.abs(px) - (width / 2 - radius);
    const qy = Math.abs(py) - (height / 2 - radius);
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    const outside = Math.hypot(ox, oy);
    const distance = outside + Math.min(Math.max(qx, qy), 0) - radius;
    let gx = 0, gy = 0;
    if (outside > 0) {
      gx = ox / outside * Math.sign(px);
      gy = oy / outside * Math.sign(py);
    } else if (qx > qy) {
      gx = Math.sign(px);
    } else {
      gy = Math.sign(py);
    }
    return { distance, gx, gy };
  }

  function slopeAt(family, depth, bezel, thickness) {
    const t = clamp01(depth / bezel);
    const lo = clamp01(t - HEIGHT_EPSILON), hi = clamp01(t + HEIGHT_EPSILON);
    const derivative = (heightAt(family, hi) - heightAt(family, lo)) / (hi - lo || HEIGHT_EPSILON);
    return Math.max(-SLOPE_LIMIT, Math.min(SLOPE_LIMIT, derivative * thickness / bezel));
  }

  /* Vector Snell form: incident light is vertical, the normal has three
     components, and lateral travel is measured through the local glass depth. */
  function lateralTravel(family, frame, depth, settings) {
    const t = clamp01(depth / settings.bezel);
    const height = heightAt(family, t);
    if (height <= 0) return [0, 0];
    const slope = slopeAt(family, depth, settings.bezel, settings.thickness);
    const nx = slope * frame.gx, ny = slope * frame.gy;
    const length = Math.hypot(nx, ny, 1);
    const ux = nx / length, uy = ny / length, uz = 1 / length;
    const eta = 1 / GLASS_IOR;
    const discriminant = 1 - eta * eta * (1 - uz * uz);
    if (discriminant < 0) return [0, 0]; // Total internal reflection: no transmitted ray.
    const coefficient = eta * uz - Math.sqrt(discriminant);
    const tx = coefficient * ux, ty = coefficient * uy;
    const tz = -eta + coefficient * uz;
    const depthPx = settings.thickness * height;
    const gain = settings.refraction * settings.gain;
    return [tx * depthPx / -tz * gain, ty * depthPx / -tz * gain];
  }

  function createMaps(settings) {
    const width = Math.round(settings.width), height = Math.round(settings.height);
    const displacement = new ImageData(width, height);
    const specular = new ImageData(width, height);
    const radius = Math.min(settings.radius, width / 2, height / 2);
    const lightAngle = settings.lightAngle * Math.PI / 180;
    const lightX = Math.cos(lightAngle), lightY = Math.sin(lightAngle);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const frame = roundedFrame(x + 0.5, y + 0.5, width, height, radius);
        const depth = Math.max(0, -frame.distance);
        let dx = 0, dy = 0;
        if (frame.distance <= 0 && depth < settings.bezel) {
          [dx, dy] = lateralTravel(settings.surface, frame, depth, settings);
        }
        const encode = value => Math.max(0, Math.min(255, Math.round(128 + value * 128 / DISPLACEMENT_RANGE)));
        displacement.data[index] = encode(dx);
        displacement.data[index + 1] = encode(dy);
        displacement.data[index + 2] = 128; // Unused blue channel stays neutral.
        displacement.data[index + 3] = 255; // Opaque map avoids premultiplied-alpha loss.

        let alpha = 0;
        if (frame.distance <= 0 && depth < RIM_WIDTH) {
          const facing = Math.max(0, frame.gx * lightX + frame.gy * lightY);
          const window = 1 - depth / RIM_WIDTH; // Design choice: linear falloff to the interior.
          alpha = facing ** SPECULAR_LOBE * window * settings.specular;
        }
        specular.data[index] = 255; // Suite-selected white light, not sampled render colors.
        specular.data[index + 1] = 255;
        specular.data[index + 2] = 255;
        specular.data[index + 3] = Math.round(clamp01(alpha) * 255);
      }
    }
    return { displacement, specular, scale: FILTER_SCALE, width, height };
  }

  return Object.freeze({ createMaps, heightAt, FILTER_SCALE, DISPLACEMENT_RANGE, RIM_WIDTH });
})();


/* Suite-authored application wrapper. The field above is also embedded by the
   standalone showcase build, so both product paths use one mathematical core. */
(() => {
  const MIN_CHROMIUM = 138; // Existing suite support policy, not feature detection.
  const FALLBACK_SATURATION = 1.35;
  const DIM_SAMPLES = 33;
  const DIM_TINT = [31 / 255, 29 / 255, 41 / 255];
  const MAX_TILT = 6, MAX_TRANSLATE = 8, HOVER_SCALE = 1.02, LERP = 0.16; // Suite interaction design tokens.
  const DEFAULTS = Object.freeze({ surface: 'convex_squircle', bezel: 16, thickness: 48,
    gain: 1, refraction: 0.85, lightAngle: -35, specular: 0.3, chroma: 2.5, blur: 2.5, fill: 0.08, dim: 0.15 });
  const reducedMedia = matchMedia('(prefers-reduced-transparency: reduce)');
  const forcedMedia = matchMedia('(forced-colors: active)');
  const instances = new WeakMap(), mounted = new Set();
  let serial = 0;

  function allowedChromium() {
    const brands = navigator.userAgentData?.brands || [];
    const chromium = brands.find(item => item.brand === 'Chromium' || item.brand === 'Google Chrome');
    const version = Number(chromium?.version || 0);
    return version >= MIN_CHROMIUM && !/HeadlessChrome|HeadlessChromium/.test(navigator.userAgent) &&
      CSS.supports('backdrop-filter', 'url(#x)') && !reducedMedia.matches && !forcedMedia.matches;
  }
  function solidFallback() { return reducedMedia.matches || forcedMedia.matches; }
  function fallback(element) {
    const solid = solidFallback();
    element.style.backdropFilter = solid ? 'none' : `blur(8px) saturate(${FALLBACK_SATURATION})`;
    element.style.webkitBackdropFilter = element.style.backdropFilter;
    element.style.background = solid ? '#f4f5f8' : 'rgba(255,255,255,.18)';
    element.style.boxShadow = 'inset 0 0 0 1px rgba(115,115,115,.35)';
    element.dataset.lgFallback = solid ? 'solid' : 'frosted';
  }
  function mapURL(imageData) {
    const canvas = document.createElement('canvas'); canvas.width = imageData.width; canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0); return canvas.toDataURL('image/png');
  }
  function washTable(tint, strength) {
    const values = [];
    for (let index = 0; index < DIM_SAMPLES; index++) {
      const x = index / (DIM_SAMPLES - 1);
      values.push((x + strength * x * (tint - x)).toFixed(4));
    }
    return values.join(' ');
  }
  function wash(input, result, dim) {
    return `<feComponentTransfer in="${input}" result="${result}">${['R', 'G', 'B'].map((channel, index) =>
      `<feFunc${channel} type="table" tableValues="${washTable(DIM_TINT[index], dim)}"/>`).join('')}</feComponentTransfer>`;
  }
  function defsRoot() {
    let root = document.getElementById('lg-suite-defs');
    if (root) return root.querySelector('defs');
    const host = document.createElement('div'); // HTML parsing supplies the SVG namespace without a URL literal.
    host.innerHTML = '<svg id="lg-suite-defs" colorInterpolationFilters="sRGB" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs></defs></svg>';
    root = host.firstElementChild; document.body.appendChild(root); return root.querySelector('defs');
  }

  function getFilterDefinition(width, height, radius, bezel = DEFAULTS.bezel, surface = DEFAULTS.surface,
    thickness = DEFAULTS.thickness, refraction = DEFAULTS.refraction, gain = DEFAULTS.gain,
    lightAngle = DEFAULTS.lightAngle, specular = DEFAULTS.specular) {
    const settings = { width: Math.max(2, Math.round(width)), height: Math.max(2, Math.round(height)),
      radius: Math.max(0, Math.min(radius, width / 2, height / 2)), bezel, surface, thickness,
      refraction, gain, lightAngle, specular };
    const maps = LiquidGlassField.createMaps(settings);
    return { ...maps, filterId: '', settings };
  }

  function installFilter(element, maps, options) {
    const id = `lg-dropin-${++serial}`;
    const vectorURL = mapURL(maps.displacement), lightURL = mapURL(maps.specular);
    defsRoot().insertAdjacentHTML('beforeend', `<filter id="${id}" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feImage href="${vectorURL}" width="${maps.width}" height="${maps.height}" preserveAspectRatio="none" result="field"/>
      <feDisplacementMap in="SourceGraphic" in2="field" scale="${maps.scale}" xChannelSelector="R" yChannelSelector="G" result="refracted"/>
      <feColorMatrix in="refracted" type="saturate" values="${options.chroma}" result="chroma"/>
      ${wash('refracted', 'body', options.dim)}${wash('chroma', 'rim', options.dim)}
      <feImage href="${lightURL}" width="${maps.width}" height="${maps.height}" preserveAspectRatio="none" result="light"/>
      <feComposite in="rim" in2="light" operator="in" result="colored-rim"/>
      <feBlend in="colored-rim" in2="body" mode="normal" result="body-plus-rim"/>
      <feBlend in="light" in2="body-plus-rim" mode="normal"/>
    </filter>`);
    const chain = `blur(${options.blur}px) saturate(${FALLBACK_SATURATION}) url(#${id})`;
    element.style.backdropFilter = chain; element.style.webkitBackdropFilter = chain;
    element.style.background = `rgba(255,255,255,${options.fill})`;
    return id;
  }

  function numberOption(element, name, fallbackValue) {
    const value = Number(element.dataset[name]);
    return Number.isFinite(value) && element.dataset[name] !== undefined ? value : fallbackValue;
  }
  function optionsFor(element, rect) {
    return {
      surface: element.dataset.surface || DEFAULTS.surface,
      bezel: numberOption(element, 'bezel', DEFAULTS.bezel),
      thickness: numberOption(element, 'thickness', DEFAULTS.thickness),
      gain: numberOption(element, 'gain', DEFAULTS.gain),
      refraction: numberOption(element, 'refraction', DEFAULTS.refraction),
      lightAngle: numberOption(element, 'lightAngle', DEFAULTS.lightAngle),
      specular: numberOption(element, 'specular', DEFAULTS.specular),
      chroma: numberOption(element, 'chroma', DEFAULTS.chroma),
      blur: numberOption(element, 'blur', DEFAULTS.blur),
      fill: numberOption(element, 'fill', DEFAULTS.fill),
      dim: numberOption(element, 'dim', DEFAULTS.dim),
      width: Math.max(2, rect.width), height: Math.max(2, rect.height),
      radius: Math.max(0, parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0),
    };
  }

  function attachMotion(element) {
    if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return () => {};
    let targetX = 0, targetY = 0, x = 0, y = 0, raf = 0, active = true;
    const move = event => {
      const rect = element.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
      targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
    };
    const leave = () => { targetX = 0; targetY = 0; };
    const tick = () => {
      if (!active) return;
      x += (targetX - x) * LERP; y += (targetY - y) * LERP;
      element.style.transform = `translate3d(${(-x * MAX_TRANSLATE).toFixed(2)}px,${(-y * MAX_TRANSLATE).toFixed(2)}px,0) rotateX(${(y * MAX_TILT).toFixed(2)}deg) rotateY(${(-x * MAX_TILT).toFixed(2)}deg) scale(${HOVER_SCALE})`;
      raf = requestAnimationFrame(tick);
    };
    element.addEventListener('pointermove', move); element.addEventListener('pointerleave', leave); tick();
    return () => { active = false; cancelAnimationFrame(raf); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); };
  }

  function mount(element) {
    if (!(element instanceof HTMLElement) || instances.has(element)) return instances.get(element);
    if (!allowedChromium()) { fallback(element); return null; }
    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    const options = optionsFor(element, rect);
    const maps = getFilterDefinition(options.width, options.height, options.radius, options.bezel,
      options.surface, options.thickness, options.refraction, options.gain, options.lightAngle, options.specular);
    const previous = { backdropFilter: element.style.backdropFilter, webkitBackdropFilter: element.style.webkitBackdropFilter,
      background: element.style.background, transform: element.style.transform,
      transformStyle: element.style.transformStyle, willChange: element.style.willChange };
    const filterId = installFilter(element, maps, options);
    element.style.transformStyle = 'preserve-3d'; element.style.willChange = 'transform';
    if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
    const cleanupMotion = attachMotion(element);
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (instances.has(element)) { destroy(element); mount(element); } });
    });
    observer.observe(element);
    const cleanup = () => { cancelAnimationFrame(raf); observer.disconnect(); cleanupMotion(); };
    const api = { element, filterId, maps, options, cleanup, previous,
      refresh: () => { destroy(element); return mount(element); }, destroy: () => destroy(element) };
    instances.set(element, api); mounted.add(element); delete element.dataset.lgFallback;
    Object.defineProperty(element, '__liquidGlass', { configurable: true, value: api });
    return api;
  }

  function destroy(element) {
    const instance = instances.get(element); if (!instance) return;
    instance.cleanup();
    Object.assign(element.style, instance.previous);
    document.getElementById(instance.filterId)?.remove();
    instances.delete(element); mounted.delete(element); delete element.__liquidGlass;
  }
  function refreshAll() {
    document.querySelectorAll('[data-liquid-glass]').forEach(element => { destroy(element); mount(element); });
  }
  const start = () => {
    refreshAll();
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.matches?.('[data-liquid-glass]')) mount(node);
      node.querySelectorAll?.('[data-liquid-glass]').forEach(mount);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  reducedMedia.addEventListener('change', refreshAll); forcedMedia.addEventListener('change', refreshAll);
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
  window.LiquidGlass = Object.freeze({ mount, refresh: element => { destroy(element); return mount(element); },
    destroy, refreshAll, getFilterDefinition, get: element => instances.get(element), version: '2.0.0' });
})();
