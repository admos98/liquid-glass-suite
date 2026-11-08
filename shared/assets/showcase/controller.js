/* Liquid Glass Suite product adapter for the clean-room showcase.
   Owns renderer selection, explicit textures, input, accessibility and status. */
(() => {
  const root = document.documentElement;
  const stage = $('stage'), glass = $('glass');
  const mirrorStage = $('stage-gl'), mirrorGlass = $('glass-gl');
  const canvas = document.createElement('canvas');
  canvas.id = 'glass-canvas'; canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);
  const notice = $('render-status'), renderSelect = $('renderer');
  const reducedMedia = matchMedia('(prefers-reduced-transparency: reduce)');
  const forcedMedia = matchMedia('(forced-colors: active)');
  const reduced = () => $('reduce-transparency').checked || reducedMedia.matches || forcedMedia.matches;
  const KEY_STEP_X = 0.02, KEY_STEP_Y = 0.03; // UI choice: 2%/3% stage movement per arrow press.
  let renderer = null, wanted = 'css', frame = 0, disposed = false;
  let position = { x: 0.5, y: 0.5 }; // Center is the deterministic initial/reset location.
  let settled = Promise.resolve(), activePlate = '';

  function backgroundURL() {
    const value = getComputedStyle(stage).backgroundImage;
    return value.slice(value.indexOf('(') + 1, value.lastIndexOf(')')).replace(/^['"]|['"]$/g, '');
  }
  function clampPosition(value) { return Math.max(0.05, Math.min(0.95, value)); } // Keep the panel center in view.
  function place() {
    [glass, mirrorGlass].forEach(element => {
      element.style.left = `${position.x * 100}%`; element.style.top = `${position.y * 100}%`;
    });
    mirrorGlass.style.width = Lab.state.width + 'px'; mirrorGlass.style.height = Lab.state.height + 'px';
    mirrorGlass.style.borderRadius = Lab.state.radius + 'px';
    mirrorGlass.style.background = `rgba(255,255,255,${Lab.state.fill})`;
    mirrorGlass.innerHTML = glass.innerHTML;
    mirrorStage.className = stage.className;
    mirrorStage.style.backgroundImage = stage.style.backgroundImage;
  }

  async function commit() {
    place();
    const solid = reduced();
    root.dataset.reducedTransparency = solid ? 'true' : 'false';
    if (solid) {
      root.dataset.render = 'css'; canvas.style.display = 'none';
      notice.textContent = 'Reduced transparency: solid preview. Optical rendering is paused.';
      return;
    }
    if (wanted === 'css') {
      root.dataset.render = 'css'; canvas.style.display = 'none';
      notice.textContent = Lab.supported
        ? 'CSS + SVG · clean-room SDF map and filter graph.'
        : 'CSS fallback · SVG backdrop refraction is unavailable. Choose WebGL2 for texture-backed optics.';
      return;
    }
    if (!Lab.maps) return;
    try {
      if (!renderer) { renderer = new window.LiquidGlassRenderer(canvas); activePlate = ''; }
      const url = backgroundURL();
      if (activePlate !== url) { await renderer.loadPlate(url); activePlate = url; }
      if (disposed) return;
      const split = wanted === 'split';
      const target = split ? mirrorStage : stage;
      target.prepend(canvas); place();
      root.dataset.render = wanted; canvas.style.display = 'block';
      renderer.draw(target, split ? mirrorGlass : glass, {
        params: Lab.state,
        displacement: Lab.maps.displacement,
        specular: Lab.maps.specular,
        scale: Lab.maps.scale,
        mapKey: String(Lab.revision),
      });
      notice.textContent = split
        ? 'Compare · CSS + SVG and WebGL2 share the clean-room maps.'
        : 'WebGL2 · explicit texture, clean-room maps and wash. CSS remains available.';
    } catch (error) {
      root.dataset.render = 'css'; canvas.style.display = 'none';
      notice.textContent = `${error.message || error} CSS fallback is active.`;
      console.error('Liquid Glass Suite WebGL2:', error);
    }
  }

  function scheduleDraw() {
    if (disposed || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0; settled = settled.then(commit, commit);
    });
  }
  async function waitSettled() {
    for (let count = 0; count < 4; count++) await new Promise(requestAnimationFrame); // Flush input and texture work.
    await settled;
  }

  renderSelect.addEventListener('change', () => { wanted = renderSelect.value; scheduleDraw(); });
  $('reduce-transparency').addEventListener('change', scheduleDraw);
  reducedMedia.addEventListener('change', scheduleDraw); forcedMedia.addEventListener('change', scheduleDraw);
  document.addEventListener('lg-lab-change', scheduleDraw);
  document.addEventListener('lg-plate-change', scheduleDraw);
  window.addEventListener('resize', scheduleDraw); window.addEventListener('scroll', scheduleDraw, { passive: true });
  new ResizeObserver(scheduleDraw).observe(stage);

  function moveToPointer(event, host) {
    const rect = host.getBoundingClientRect();
    position = {
      x: clampPosition((event.clientX - rect.left) / rect.width),
      y: clampPosition((event.clientY - rect.top) / rect.height),
    };
    place(); scheduleDraw();
  }
  [glass, mirrorGlass].forEach(element => {
    let dragging = false;
    element.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true; element.setPointerCapture(event.pointerId); element.focus({ preventScroll: true });
      moveToPointer(event, element.parentElement);
    });
    element.addEventListener('pointermove', event => {
      if (dragging && element.hasPointerCapture(event.pointerId)) moveToPointer(event, element.parentElement);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => element.addEventListener(type, () => { dragging = false; }));
    element.addEventListener('keydown', event => {
      const delta = {
        ArrowLeft: [-KEY_STEP_X, 0], ArrowRight: [KEY_STEP_X, 0],
        ArrowUp: [0, -KEY_STEP_Y], ArrowDown: [0, KEY_STEP_Y],
      }[event.key];
      if (!delta) return;
      event.preventDefault();
      position = { x: clampPosition(position.x + delta[0]), y: clampPosition(position.y + delta[1]) };
      place(); scheduleDraw();
    });
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-preset]')) { position = { x: 0.5, y: 0.5 }; place(); scheduleDraw(); }
  });
  $('reset-position').addEventListener('click', () => { position = { x: 0.5, y: 0.5 }; place(); scheduleDraw(); });

  window.LiquidGlassShowcase = {
    source: 'clean-room-sdf-vector-v1',
    async setRenderer(mode) {
      if (!['css', 'webgl', 'split'].includes(mode)) throw new Error('Unknown renderer');
      wanted = mode; renderSelect.value = mode; scheduleDraw(); await waitSettled();
    },
    async setState(values) { setLabState(values); await waitSettled(); },
    async setBackground(url) { stage.style.backgroundImage = `url("${url}")`; scheduleDraw(); await waitSettled(); },
    getState() {
      return {
        params: { ...Lab.state }, renderer: root.dataset.render || 'css', requestedRenderer: wanted,
        displacementScale: Lab.maps?.scale || 0,
        mapSize: Lab.maps ? [Lab.maps.width, Lab.maps.height] : null,
        webglDraws: renderer?.draws || 0, position: { ...position }, reduced: reduced(),
      };
    },
    maps() { return { displacement: Lab.maps.displacement, specular: Lab.maps.specular }; },
    whenSettled: waitSettled,
  };
  window.addEventListener('pagehide', () => { disposed = true; cancelAnimationFrame(frame); renderer?.dispose(); });
  scheduleDraw();
})();
