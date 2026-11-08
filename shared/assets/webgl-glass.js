/*
 * Liquid Glass Suite clean-room WebGL2 texture renderer.
 *
 * Technique follows the approach explained in kube's 'Liquid Glass in the Browser' (kube.io/blog/liquid-glass-css-svg) — the guide this project learned from. The implementation in this repository is an independent clean-room implementation; no kube.io code or assets are included, and this project is not affiliated with kube.io or Apple.
 *
 * Two separable blur passes feed one final scene/material composite. The caller
 * supplies an origin-clean plate and the clean-room displacement/specular maps.
 */
(() => {
  const VERTEX_SOURCE = `#version 300 es
  in vec2 a_position;
  out vec2 v_uv;
  void main(){v_uv=a_position;gl_Position=vec4(a_position.x*2.0-1.0,1.0-a_position.y*2.0,0.0,1.0);}`;

  const BLUR_SOURCE = `#version 300 es
  precision highp float;
  uniform sampler2D u_input;
  uniform vec2 u_direction;
  uniform float u_weight[13];
  uniform float u_spread;
  in vec2 v_uv;
  out vec4 outColor;
  void main(){
    vec4 sum=vec4(0.0);
    for(int i=0;i<13;i++){
      float offset=(float(i)-6.0)*u_spread;
      sum+=texture(u_input,v_uv+u_direction*offset)*u_weight[i];
    }
    outColor=sum;
  }`;

  const COMPOSITE_SOURCE = `#version 300 es
  precision highp float;
  uniform sampler2D u_plate;
  uniform sampler2D u_source;
  uniform sampler2D u_vector;
  uniform sampler2D u_light;
  uniform vec2 u_viewport;
  uniform vec4 u_panel;
  uniform float u_dpr;
  uniform float u_radius;
  uniform float u_bend;
  uniform float u_chroma;
  uniform float u_fill;
  uniform float u_dim;
  uniform vec3 u_tint;
  in vec2 v_uv;
  out vec4 outColor;
  vec3 wash(vec3 color){return clamp(color+u_dim*color*(u_tint-color),0.0,1.0);}
  void main(){
    vec4 plate=texture(u_plate,v_uv);
    vec2 point=v_uv*u_viewport;
    vec2 local=point-u_panel.xy;
    vec2 q=abs(local-u_panel.zw*0.5)-(u_panel.zw*0.5-vec2(u_radius));
    float sdf=length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0)-u_radius;
    float coverage=clamp(0.5-sdf,0.0,1.0);
    if(coverage<=0.0){outColor=plate;return;}
    vec2 localUV=local/u_panel.zw;
    vec2 travel=(texture(u_vector,localUV).rg-0.5)*u_bend*u_dpr;
    vec3 refracted=texture(u_source,(point+travel)/u_viewport).rgb;
    float luma=dot(refracted,vec3(0.2126,0.7152,0.0722)); // Rec.709 luma weights.
    vec3 chroma=clamp(mix(vec3(luma),refracted,u_chroma),0.0,1.0);
    vec4 light=texture(u_light,localUV);
    vec3 body=wash(refracted);
    vec3 rim=wash(chroma);
    vec3 material=mix(body,rim,light.a);
    material=mix(material,light.rgb,light.a);
    material=mix(material,vec3(1.0),u_fill);
    outColor=vec4(mix(plate.rgb,material,coverage),1.0);
  }`;

  const BLUR_RADIUS = 6; // Budget: thirteen taps per axis, chosen for interactive redraws.
  const BLUR_SIGMA = 2; // Design choice: Gaussian shape in tap units.
  const MAX_DPR = 2; // Texture-memory budget for the preview canvas.

  function blurWeights() {
    const weights = [];
    for (let index = -BLUR_RADIUS; index <= BLUR_RADIUS; index++) {
      weights.push(Math.exp(-(index * index) / (2 * BLUR_SIGMA * BLUR_SIGMA)));
    }
    const total = weights.reduce((sum, value) => sum + value, 0);
    return Float32Array.from(weights.map(value => value / total));
  }

  class TextureLensRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        alpha: false, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: true, preserveDrawingBuffer: true, // Preserve for suite-owned snapshots.
      });
      if (!gl) throw new Error('WebGL2 is unavailable.');
      this.gl = gl;
      this.blurProgram = this.makeProgram(BLUR_SOURCE);
      this.compositeProgram = this.makeProgram(COMPOSITE_SOURCE);
      this.quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      this.plate = this.makeTexture(); this.vector = this.makeTexture(); this.light = this.makeTexture();
      this.ping = this.makeTarget(); this.pong = this.makeTarget();
      this.image = null; this.imageURL = ''; this.mapKey = ''; this.size = ''; this.draws = 0;
    }

    makeProgram(fragmentSource) {
      const gl = this.gl;
      const compile = (type, source) => {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message);
        }
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, VERTEX_SOURCE), fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment);
      gl.linkProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      return program;
    }

    makeTexture() {
      const gl = this.gl, texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    }
    makeTarget() { return { texture: this.makeTexture(), framebuffer: this.gl.createFramebuffer() }; }

    async loadPlate(url) {
      if (this.image && this.imageURL === url) return;
      const image = new Image(); image.src = url; await image.decode();
      this.image = image; this.imageURL = url; this.size = '';
    }

    upload(texture, source) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }

    bindTexture(program, name, texture, unit) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(program, name), unit);
    }

    use(program) {
      const gl = this.gl; gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      const attribute = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    }

    resizeTargets(width, height) {
      const gl = this.gl;
      [this.ping, this.pong].forEach(target => {
        gl.bindTexture(gl.TEXTURE_2D, target.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Blur target unavailable');
      });
    }

    resize() {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const width = Math.max(2, Math.round(this.canvas.clientWidth * dpr));
      const height = Math.max(2, Math.round(this.canvas.clientHeight * dpr));
      const key = `${width}x${height}`;
      if (this.size !== key) {
        this.canvas.width = width; this.canvas.height = height;
        const plate = document.createElement('canvas'); plate.width = width; plate.height = height;
        const context = plate.getContext('2d');
        const cover = Math.max(width / this.image.naturalWidth, height / this.image.naturalHeight);
        const drawWidth = this.image.naturalWidth * cover, drawHeight = this.image.naturalHeight * cover;
        context.drawImage(this.image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
        this.upload(this.plate, plate); this.resizeTargets(width, height); this.size = key;
      }
      return { width, height, dpr };
    }

    draw(host, panel, input) {
      if (!this.image) throw new Error('No explicit backdrop texture is loaded.');
      const { params, displacement, specular, scale, mapKey } = input;
      if (!displacement || !specular) throw new Error('Both optical maps are required.');
      const gl = this.gl, { width, height, dpr } = this.resize();
      if (this.mapKey !== mapKey) {
        this.upload(this.vector, displacement); this.upload(this.light, specular); this.mapKey = mapKey;
      }
      let source = this.plate;
      gl.disable(gl.BLEND);
      if (params.blur > 0) {
        this.use(this.blurProgram);
        gl.uniform1fv(gl.getUniformLocation(this.blurProgram, 'u_weight[0]'), blurWeights());
        gl.uniform1f(gl.getUniformLocation(this.blurProgram, 'u_spread'), Math.max(0.5, params.blur / BLUR_RADIUS) * dpr);
        [this.ping, this.pong].forEach((target, index) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer); gl.viewport(0, 0, width, height);
          this.bindTexture(this.blurProgram, 'u_input', index ? this.ping.texture : this.plate, 0);
          gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_direction'), index ? 0 : 1 / width, index ? 1 / height : 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });
        source = this.pong.texture;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, width, height);
      this.use(this.compositeProgram);
      this.bindTexture(this.compositeProgram, 'u_plate', this.plate, 0);
      this.bindTexture(this.compositeProgram, 'u_source', source, 1);
      this.bindTexture(this.compositeProgram, 'u_vector', this.vector, 2);
      this.bindTexture(this.compositeProgram, 'u_light', this.light, 3);
      const rect = panel.getBoundingClientRect(), canvasRect = this.canvas.getBoundingClientRect();
      const uniform = name => gl.getUniformLocation(this.compositeProgram, name);
      gl.uniform2f(uniform('u_viewport'), width, height);
      gl.uniform4f(uniform('u_panel'), (rect.left - canvasRect.left) * dpr,
        (rect.top - canvasRect.top) * dpr, rect.width * dpr, rect.height * dpr);
      gl.uniform1f(uniform('u_dpr'), dpr);
      gl.uniform1f(uniform('u_radius'), Math.min(params.radius, Math.min(rect.width, rect.height) / 2) * dpr);
      gl.uniform1f(uniform('u_bend'), scale);
      gl.uniform1f(uniform('u_chroma'), params.chroma);
      gl.uniform1f(uniform('u_fill'), params.fill);
      gl.uniform1f(uniform('u_dim'), params.dim);
      gl.uniform3f(uniform('u_tint'), 31 / 255, 29 / 255, 41 / 255); // Same suite slate wash as the SVG path.
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); this.draws++;
      if (gl.getError() !== gl.NO_ERROR) throw new Error('WebGL draw failed');
    }

    dispose() {
      const gl = this.gl;
      [this.plate, this.vector, this.light, this.ping.texture, this.pong.texture].forEach(texture => gl.deleteTexture(texture));
      [this.ping, this.pong].forEach(target => gl.deleteFramebuffer(target.framebuffer));
      gl.deleteProgram(this.blurProgram); gl.deleteProgram(this.compositeProgram); gl.deleteBuffer(this.quad);
    }
  }

  window.LiquidGlassRenderer = TextureLensRenderer;
})();
