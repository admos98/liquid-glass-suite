/*
 * Liquid Glass Suite standalone showcase adapter.
 * Source optics: shared/assets/showcase/optics.js. Development notice: NOTICE.
 * Both renderers consume the original mapInfo and specular pixels. CSS retains
 * the original SVG graph; WebGL2 evaluates the same blur, displacement, rim,
 * historical linear dim and specular blends. Fallback remains available.
 */
(() => {
  const root = document.documentElement;
  const stage = $('stage');
  const glass = $('glass');
  const mirrorStage = $('stage-gl');
  const mirrorGlass = $('glass-gl');
  const renderSelect = $('renderer');
  const notice = $('render-status');
  const canvas = document.createElement('canvas');
  canvas.id = 'glass-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);
  let renderer = null;
  let wanted = 'css';
  let frame = 0;
  let position = { x: 0.5, y: 0.46 };
  let settled = Promise.resolve();
  let revision = 0;
  let disposed = false;
  let activePlate = '';
  let specularKey = '';
  let cachedSpecular = null;
  const reducedMedia = matchMedia('(prefers-reduced-transparency: reduce)');
  const forcedMedia = matchMedia('(forced-colors: active)');
  const reduced = () => $('reduce-transparency').checked || reducedMedia.matches || forcedMedia.matches;


  function urlOf(element){
    const raw=getComputedStyle(element).backgroundImage;
    const start=raw.indexOf('('), end=raw.lastIndexOf(')');
    let url=raw.slice(start+1,end).trim();
    if(url[0]==='"'||url[0]==="'")url=url.slice(1,-1);
    return url;
  }
  function place(){
    [glass,mirrorGlass].forEach(el=>{
      el.style.left=`${position.x*100}%`; el.style.top=`${position.y*100}%`;
    });
    mirrorGlass.style.width=P.w+'px';mirrorGlass.style.height=P.h+'px';mirrorGlass.style.borderRadius=P.radius+'px';
    mirrorStage.className=stage.className;
    mirrorStage.style.backgroundImage=stage.style.backgroundImage;
    mirrorGlass.innerHTML=glass.innerHTML;
  }
  async function commit(){
    const ticket=++revision;
    place();
    const solid=reduced(); root.dataset.reducedTransparency=solid?'true':'false';
    if(solid){
      root.dataset.render='css'; canvas.style.display='none';
      notice.textContent='Reduced transparency: solid, high-contrast preview. Optical rendering is paused.';
      return;
    }
    if(wanted==='css'){
      root.dataset.render='css';canvas.style.display='none';
      notice.textContent=supported?'CSS + SVG · source-matched SVG graph.':'CSS fallback · this browser does not render SVG backdrop refraction. Choose WebGL2.';
      return;
    }
    if(!mapInfo)return;
    try{
      if(!renderer)renderer=new window.UltimateLiquidGlassRenderer(canvas);
      const url=urlOf(stage);
      if(activePlate!==url){await renderer.loadPlate(url);activePlate=url;}
      if(ticket!==revision||disposed)return;
      const target=wanted==='split'?mirrorStage:stage;
      target.prepend(canvas);
      root.dataset.render=wanted;
      canvas.style.display='block';
      place();
      if(specularKey!==specURL){cachedSpecular=buildSpecularMap(P.w,P.h,P.radius,P.angle);specularKey=specURL;}
      renderer.draw(target,wanted==='split'?mirrorGlass:glass,{params:P,displacement:mapInfo.img,specular:cachedSpecular,scale:effectiveScale(),mapKey:dispURL+'|'+specURL,dim:dimParams()});
      notice.textContent=wanted==='split'
        ?'CSS + SVG and WebGL2 · the same displacement and specular maps. No painted rims.'
        :'WebGL2 · original playground maps and blend order. CSS remains available.';
    }catch(error){
      root.dataset.render='css';canvas.style.display='none';
      notice.textContent=String(error.message||error)+' CSS fallback is active.';
      console.error('Liquid Glass Suite WebGL2:',error);
    }
  }
  function scheduleDraw(){
    if(disposed||frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      settled=settled.then(commit,commit);
    });
  }
  async function waitSettled(){
    for(let n=0;n<4;n++)await new Promise(resolve=>requestAnimationFrame(resolve));
    await settled;
  }
  renderSelect.addEventListener('change',()=>{wanted=renderSelect.value;scheduleDraw();});
  $('reduce-transparency').addEventListener('change',scheduleDraw);
  reducedMedia.addEventListener('change',scheduleDraw);forcedMedia.addEventListener('change',scheduleDraw);
  document.addEventListener('ulg-material-updated',scheduleDraw);
  document.addEventListener('click',event=>{
    if(event.target.closest('.plate,.pbtn,.sbtn'))scheduleDraw();
  });
  document.addEventListener('change',event=>{if(event.target.id==='imgBg')scheduleDraw();});
  window.addEventListener('resize',scheduleDraw);
  window.addEventListener('scroll',scheduleDraw,{passive:true});
  new ResizeObserver(scheduleDraw).observe(stage);

  let drag=null;
  function move(event){
    const host=drag.host.getBoundingClientRect();
    position={x:Math.max(0.05,Math.min(0.95,(event.clientX-host.left)/host.width)),y:Math.max(0.05,Math.min(0.95,(event.clientY-host.top)/host.height))};
    place();scheduleDraw();
  }
  [glass,mirrorGlass].forEach(el=>{
    el.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      drag={host:el.parentElement};el.setPointerCapture(event.pointerId);el.focus({preventScroll:true});move(event);
    });
    el.addEventListener('pointermove',event=>{if(drag&&el.hasPointerCapture(event.pointerId))move(event);});
    const stop=()=>{drag=null;};
    el.addEventListener('pointerup',stop);el.addEventListener('pointercancel',stop);el.addEventListener('lostpointercapture',stop);
    el.addEventListener('keydown',event=>{
      const deltas={ArrowLeft:[-0.015,0],ArrowRight:[0.015,0],ArrowUp:[0,-0.025],ArrowDown:[0,0.025]};
      if(!deltas[event.key])return;
      event.preventDefault();const d=deltas[event.key];
      position={x:Math.max(0.05,Math.min(0.95,position.x+d[0])),y:Math.max(0.05,Math.min(0.95,position.y+d[1]))};
      place();scheduleDraw();
    });
  });
  document.addEventListener('click',event=>{if(event.target.closest('.pbtn'))position={x:0.5,y:0.46};});
  $('reset-position').addEventListener('click',()=>{position={x:0.5,y:0.46};place();scheduleDraw();});

  window.UltimateLiquidGlass={
    source:'shared/assets/showcase/optics.js',
    async setRenderer(mode){
      if(!['css','webgl','split'].includes(mode))throw new Error('Unknown renderer');
      wanted=mode;renderSelect.value=mode;scheduleDraw();await waitSettled();
    },
    async setState(values){
      Object.assign(P,validatedState(values));syncUI();schedule({map:true,spec:true,sim:true});persist();await waitSettled();
    },
    async setBackground(url){stage.style.backgroundImage=`url("${url}")`;scheduleDraw();await waitSettled();},
    getState(){return {params:{...P},renderer:root.dataset.render,requestedRenderer:wanted,displacementScale:effectiveScale(),mapSize:mapInfo?[mapInfo.W,mapInfo.H]:null,webglDraws:renderer?.draws||0,position:{...position},reduced:reduced()};},
    maps(){return {displacement:mapInfo.img,specular:buildSpecularMap(P.w,P.h,P.radius,P.angle),profile:prof};},
    whenSettled:waitSettled,
  };
  window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);renderer?.dispose();});
  scheduleDraw();
})();
