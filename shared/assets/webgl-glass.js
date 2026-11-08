/*
 * Liquid Glass Suite — reusable WebGL2 renderer for the standalone showcase.
 * Development notice: NOTICE; license: LICENSE.
 * Accepts explicit backdrop and displacement/specular ImageData and preserves
 * the showcase's historical linear RGB dim law.
 */
(() => {
  const VS = `#version 300 es
  in vec2 a_corner;
  out vec2 v_uv;
  void main(){v_uv=a_corner;gl_Position=vec4(a_corner.x*2.0-1.0,1.0-a_corner.y*2.0,0.0,1.0);}`;
  const COPY_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_source;
  in vec2 v_uv;
  out vec4 color;
  void main(){color=texture(u_source,v_uv);}`;
  const BLUR_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_source;
  uniform vec2 u_axis;
  uniform int u_count;
  uniform float u_weight[121];
  uniform float u_offset[121];
  in vec2 v_uv;
  out vec4 color;
  void main(){
    vec4 sum=texture(u_source,v_uv)*u_weight[0];
    for(int i=1;i<121;i++){
      if(i>=u_count)break;
      vec2 d=u_axis*u_offset[i];
      sum+=(texture(u_source,v_uv+d)+texture(u_source,v_uv-d))*u_weight[i];
    }
    color=sum;
  }`;
  const GLASS_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_source;
  uniform sampler2D u_displacement;
  uniform sampler2D u_specular;
  uniform vec2 u_res;
  uniform vec4 u_rect;
  uniform float u_dpr;
  uniform float u_radius;
  uniform float u_scale;
  uniform float u_sat;
  uniform float u_opacity;
  uniform float u_fill;
  uniform vec3 u_dimSlope;
  uniform vec3 u_dimIntercept;
  in vec2 v_uv;
  out vec4 color;
  void main(){
    vec2 point=v_uv*u_res;
    vec2 local=point-u_rect.xy;
    vec2 size=u_rect.zw;
    vec2 q=abs(local-size*0.5)-(size*0.5-vec2(u_radius));
    float sd=length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0)-u_radius;
    float inside=clamp(0.5-sd,0.0,1.0);
    if(inside<=0.0)discard;
    vec2 uv=local/size;
    vec2 shift=(texture(u_displacement,uv).rg-0.5)*u_scale*u_dpr;
    vec3 displaced=texture(u_source,(point+shift)/u_res).rgb;
    float luma=dot(displaced,vec3(0.2126,0.7152,0.0722));
    vec3 saturated=clamp(mix(vec3(luma),displaced,u_sat),0.0,1.0);
    vec3 dimmed=clamp(displaced*u_dimSlope+u_dimIntercept,0.0,1.0);
    vec3 saturatedDimmed=clamp(saturated*u_dimSlope+u_dimIntercept,0.0,1.0);
    vec4 specular=texture(u_specular,uv);
    vec3 withSaturation=mix(dimmed,saturatedDimmed,specular.a);
    vec3 result=mix(withSaturation,specular.rgb,specular.a*u_opacity);
    result=mix(result,vec3(1.0),u_fill);
    color=vec4(result*inside,inside);
  }`;

  class PlaygroundRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        alpha: false, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: true, preserveDrawingBuffer: true,
      });
      if (!gl) throw new Error('WebGL2 is unavailable. CSS fallback remains active.');
      this.gl = gl;
      this.programs = [COPY_FS, BLUR_FS, GLASS_FS].map(fragment => {
        const shaders = [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fragment]].map(([type, source]) => {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source); gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(error);
          }
          return shader;
        });
        const program = gl.createProgram();
        shaders.forEach(shader => gl.attachShader(program, shader));
        gl.linkProgram(program);
        shaders.forEach(shader => gl.deleteShader(shader));
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        return program;
      });
      this.quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,1,1]), gl.STATIC_DRAW);
      this.texture = () => {
        const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tex;
      };
      this.plate = this.texture();
      this.displacement = this.texture();
      this.specular = this.texture();
      this.targets = [0, 1].map(() => ({texture:this.texture(), framebuffer:gl.createFramebuffer()}));
      this.image = null;
      this.imageURL = '';
      this.mapKey = '';
      this.size = '';
      this.draws = 0;
    }
    async loadPlate(url) {
      if (this.imageURL === url && this.image) return;
      const image = new Image();
      image.src = url;
      await image.decode();
      this.image = image; this.imageURL = url; this.size = '';
    }
    upload(texture, source) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
    resize() {
      const canvas = this.canvas;
      const gl = this.gl;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(2, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(2, Math.round(canvas.clientHeight * dpr));
      const key = `${width}x${height}`;
      if (this.size !== key) {
        canvas.width = width; canvas.height = height;
        const plate = document.createElement('canvas');
        plate.width = width; plate.height = height;
        const c = plate.getContext('2d');
        const cover = Math.max(width / this.image.naturalWidth, height / this.image.naturalHeight);
        const w = this.image.naturalWidth * cover, h = this.image.naturalHeight * cover;
        c.drawImage(this.image, (width-w)/2, (height-h)/2, w, h);
        this.upload(this.plate, plate);
        this.targets.forEach(target => {
          gl.bindTexture(gl.TEXTURE_2D, target.texture);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
          gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);
          gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target.texture,0);
          if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error('Blur framebuffer unavailable');
        });
        this.size = key;
      }
      gl.viewport(0,0,width,height);
      return {width,height,dpr};
    }
    use(program) {
      const gl = this.gl;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);
      const location=gl.getAttribLocation(program,'a_corner');
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
    }
    bind(program,name,texture,unit) {
      const gl=this.gl;
      gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(gl.getUniformLocation(program,name),unit);
    }
    gaussian(sigma) {
      if(sigma<0.05)return {weight:new Float32Array([1]),offset:new Float32Array([0]),count:1};
      const radius=Math.min(240,Math.ceil(sigma*3));
      const taps=Array.from({length:radius+1},(_,i)=>Math.exp(-(i*i)/(2*sigma*sigma)));
      const norm=taps[0]+2*taps.slice(1).reduce((a,b)=>a+b,0);
      const weight=[taps[0]/norm],offset=[0];
      for(let i=1;i<=radius;i+=2){
        const a=taps[i], b=taps[i+1]||0;
        weight.push((a+b)/norm); offset.push(i+b/(a+b));
      }
      return {weight:Float32Array.from(weight),offset:Float32Array.from(offset),count:weight.length};
    }
    draw(host, panel, input) {
      const canvas = this.canvas;
      const { params: P, displacement, specular, scale: sourceScale, mapKey, dim } = input;
      if(!this.image||!displacement||!specular)return;
      const gl=this.gl;
      const {width,height,dpr}=this.resize();
      if(this.mapKey!==mapKey){
        this.upload(this.displacement,displacement);
        this.upload(this.specular,specular);
        this.mapKey=mapKey;
      }
      let blurred=this.plate;
      gl.disable(gl.BLEND);
      if(P.blur>0){
        const program=this.programs[1], kernel=this.gaussian(P.blur*dpr);
        this.use(program);
        gl.uniform1i(gl.getUniformLocation(program,'u_count'),kernel.count);
        gl.uniform1fv(gl.getUniformLocation(program,'u_weight[0]'),kernel.weight);
        gl.uniform1fv(gl.getUniformLocation(program,'u_offset[0]'),kernel.offset);
        this.targets.forEach((target,i)=>{
          gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);
          this.bind(program,'u_source',i?this.targets[0].texture:this.plate,0);
          gl.uniform2f(gl.getUniformLocation(program,'u_axis'),i?0:1/width,i?1/height:0);
          gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        });
        blurred=this.targets[1].texture;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      const copy=this.programs[0]; this.use(copy); this.bind(copy,'u_source',this.plate,0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      const program=this.programs[2]; this.use(program);
      this.bind(program,'u_source',blurred,0);
      this.bind(program,'u_displacement',this.displacement,1);
      this.bind(program,'u_specular',this.specular,2);
      const r=panel.getBoundingClientRect(), c=canvas.getBoundingClientRect();
      const u=name=>gl.getUniformLocation(program,name);
      gl.uniform2f(u('u_res'),width,height);
      gl.uniform4f(u('u_rect'),(r.left-c.left)*dpr,(r.top-c.top)*dpr,r.width*dpr,r.height*dpr);
      gl.uniform1f(u('u_dpr'),dpr);
      gl.uniform1f(u('u_radius'),Math.min(P.radius,Math.min(r.width,r.height)/2)*dpr);
      gl.uniform1f(u('u_scale'),+sourceScale.toFixed(3));
      gl.uniform1f(u('u_sat'),P.saturation); gl.uniform1f(u('u_opacity'),P.specOpacity);
      gl.uniform1f(u('u_fill'),P.glassBg);
      gl.uniform3f(u('u_dimSlope'),...dim.map(v=>+v[0].toFixed(4)));
      gl.uniform3f(u('u_dimIntercept'),...dim.map(v=>+v[1].toFixed(4)));
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.disable(gl.BLEND);
      this.draws++;
      if(gl.getError()!==gl.NO_ERROR)throw new Error('WebGL draw failed');
    }
    dispose(){
      const gl=this.gl;
      [this.plate,this.displacement,this.specular,...this.targets.map(t=>t.texture)].forEach(t=>gl.deleteTexture(t));
      this.targets.forEach(t=>gl.deleteFramebuffer(t.framebuffer));
      this.programs.forEach(p=>gl.deleteProgram(p)); gl.deleteBuffer(this.quad);
    }
  }

  window.UltimateLiquidGlassRenderer = PlaygroundRenderer;
})();
