/* Vignettes « liquides » de la home (d'après jithinrp.com)
   Chaque vignette est redessinée en WebGL sur un calque fixe :
   · au scroll, la feuille se courbe, le milieu traîne derrière comme une surface liquide ;
   · à l'apparition, l'image se dévoile de bas en haut avec un bord ondulé ;
   · au survol, une loupe liquide et des ondes suivent le curseur.
   Sans WebGL ou avec « réduire les animations », les vignettes restent en HTML. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = [...document.querySelectorAll(".page-home .card")];
  if (reduce || !cards.length) return;

  const canvas = document.createElement("canvas");
  canvas.className = "liquid-stage";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return;
  document.body.appendChild(canvas);
  document.documentElement.classList.add("has-liquid");

  const NOISE = `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  const VERT = `
    attribute vec2 aUv;
    uniform vec4 uRect;      // x, y, largeur, hauteur (px CSS, y vers le bas)
    uniform vec2 uView;      // largeur, hauteur de l'écran
    uniform float uVelocity; // vitesse de scroll lissée (px / image)
    varying vec2 vUv;
    void main(){
      vUv = aUv;
      vec2 p = uRect.xy + vec2(aUv.x, 1.0 - aUv.y) * uRect.zw;
      // le milieu de la feuille traîne derrière le scroll, comme une surface liquide
      p.y += sin(aUv.x * 3.14159265) * uVelocity * 0.45;
      vec2 clip = p / uView * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    }`;

  const FRAG = `
    precision highp float;
    uniform sampler2D uTex;
    uniform vec4 uTexMap;    // décalage + échelle : coordonnées de la vignette -> texture (cadrage, parallaxe)
    uniform vec2 uSize;
    uniform vec2 uMouse;
    uniform float uHover, uReveal, uSeed, uTime, uVelocity, uDim;
    varying vec2 vUv;
    ${NOISE}
    void main(){
      vec2 top = vec2(vUv.x, 1.0 - vUv.y);            // 0,0 en haut à gauche
      float aspect = uSize.x / uSize.y;
      vec2 d = (top - uMouse) * vec2(aspect, 1.0);
      float dist = length(d);
      float n = snoise(vec3(top * 2.5, uTime * 0.3 + uSeed));
      // loupe liquide et ondes autour du curseur
      float lens = smoothstep(0.55, 0.0, dist) * uHover;
      vec2 push = d / vec2(aspect, 1.0) * lens;
      vec2 uv = top;
      uv -= push * 0.22;
      uv += push * sin(dist * 34.0 - uTime * 5.0) * 0.03;
      uv += vec2(n, snoise(vec3(top * 2.5 + 7.0, uTime * 0.3))) * 0.006 * uHover;
      // la vitesse de scroll étire légèrement l'image à la verticale
      uv.y += n * uVelocity * 0.0007;
      vec2 t = uTexMap.xy + uv * uTexMap.zw;
      vec3 col = texture2D(uTex, t).rgb * uDim;
      // dévoilement de bas en haut, bord ondulé
      float nn = snoise(vec3(top.x * 3.0, top.y * 1.5, uTime * 0.6 + uSeed)) * 0.12;
      float h = (1.0 - top.y) + nn;
      float edge = uReveal * 1.35 - 0.12;
      float a = smoothstep(edge, edge - 0.08, h);
      gl_FragColor = vec4(col * a, a);
    }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); document.documentElement.classList.remove("has-liquid"); return; }
  gl.useProgram(prog);

  // grille fine pour que la courbure reste lisse
  const N = 32, uvs = [], idx = [];
  for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) uvs.push(x / N, y / N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * (N + 1) + x;
    idx.push(i, i + 1, i + N + 1, i + 1, i + N + 2, i + N + 1);
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(prog, "aUv");
  gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ["uRect", "uView", "uVelocity", "uTex", "uTexMap", "uSize", "uMouse", "uHover", "uReveal", "uSeed", "uTime", "uDim"]
    .forEach((k) => (U[k] = gl.getUniformLocation(prog, k)));
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  const ease = (t) => 1 - Math.pow(1 - t, 3);   // power3.out
  const items = cards.map((card) => {
    const media = card.querySelector(".media");
    const plx = card.querySelector(".plx") || media;
    const video = card.querySelector("video");
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([13, 13, 13, 255]));
    const it = { card, media, plx, video, tex, ready: false, w: 1, h: 1, reveal: 0, revealStart: -1,
      hover: 0, hoverTarget: 0, mouse: [0.5, 0.5], mouseT: [0.5, 0.5], dim: 1, seed: Math.random() * 100 };
    const poster = new Image();
    poster.onload = () => {
      if (it.ready) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);
      it.w = poster.naturalWidth; it.h = poster.naturalHeight; it.posterOk = true;
    };
    if (video && video.poster) poster.src = video.poster;
    card.addEventListener("pointerenter", () => (it.hoverTarget = 1));
    card.addEventListener("pointerleave", () => (it.hoverTarget = 0));
    card.addEventListener("pointermove", (e) => {
      const r = media.getBoundingClientRect();
      it.mouseT = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    });
    return it;
  });

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize);

  let lastY = scrollY, vel = 0, lastT = performance.now();
  const t0 = performance.now();
  const frame = (now) => {
    const dt = Math.min(64, now - lastT) / 16.667; lastT = now;
    const dy = scrollY - lastY; lastY = scrollY;
    const target = Math.max(-60, Math.min(60, dy / Math.max(dt, 0.5)));
    vel += (target - vel) * 0.12;
    const time = (now - t0) / 1000;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uView, W, H);
    gl.uniform1f(U.uVelocity, vel);
    gl.uniform1f(U.uTime, time);

    for (const it of items) {
      const r = it.media.getBoundingClientRect();
      if (r.bottom < -80 || r.top > H + 80 || r.width === 0) continue;

      // apparition quand la vignette atteint 92 % de la hauteur de l'écran
      if (it.revealStart < 0 && r.top < H * 0.92) it.revealStart = now;
      it.reveal = it.revealStart < 0 ? 0 : ease(Math.min(1, (now - it.revealStart) / 1800));

      // survol : entrée rapide, sortie plus lente ; le point suit le curseur en douceur
      const k = it.hoverTarget > it.hover ? 0.08 : 0.04;
      it.hover += (it.hoverTarget - it.hover) * k;
      it.mouse[0] += (it.mouseT[0] - it.mouse[0]) * 0.15;
      it.mouse[1] += (it.mouseT[1] - it.mouse[1]) * 0.15;
      const dimT = it.hoverTarget && matchMedia("(hover: hover)").matches ? 0.78 : 1;
      it.dim += (dimT - it.dim) * 0.08;

      // texture : la vidéo dès qu'elle a des images, sinon l'affiche
      const v = it.video;
      if (v && v.readyState >= 2 && v.videoWidth) {
        gl.bindTexture(gl.TEXTURE_2D, it.tex);
        if (!v.paused || !it.ready) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
        }
        it.ready = true; it.w = v.videoWidth; it.h = v.videoHeight;
      } else {
        gl.bindTexture(gl.TEXTURE_2D, it.tex);
      }

      // cadrage « cover » dans la zone .plx (qui porte la parallaxe et le léger zoom)
      const p = it.plx.getBoundingClientRect();
      const boxA = p.width / p.height, texA = it.w / it.h;
      let sx = 1, sy = 1;
      if (texA > boxA) sx = boxA / texA; else sy = texA / boxA;
      const ox = (1 - sx) / 2, oy = (1 - sy) / 2;
      // coordonnées de la vignette -> coordonnées dans .plx -> coordonnées texture
      const ax = (r.left - p.left) / p.width, ay = (r.top - p.top) / p.height;
      const bx = r.width / p.width, by = r.height / p.height;
      gl.uniform4f(U.uTexMap, ox + ax * sx, oy + ay * sy, bx * sx, by * sy);

      gl.uniform4f(U.uRect, r.left, r.top, r.width, r.height);
      gl.uniform2f(U.uSize, r.width, r.height);
      gl.uniform2f(U.uMouse, it.mouse[0], it.mouse[1]);
      gl.uniform1f(U.uHover, it.hover);
      gl.uniform1f(U.uReveal, it.reveal);
      gl.uniform1f(U.uSeed, it.seed);
      gl.uniform1f(U.uDim, it.dim);
      gl.uniform1i(U.uTex, 0);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
