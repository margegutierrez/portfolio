(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Letter roll ---------------------------------------------------------- */
  $$("[data-roll]").forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const box = document.createElement("span");
    box.className = "roll";
    box.setAttribute("aria-hidden", "true");
    [...text].forEach((c, i) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      s.dataset.c = c;
      s.style.setProperty("--i", i);
      box.appendChild(s);
    });
    el.appendChild(box);
    (el.closest("a, button") || el).classList.add("roll-host");
  });

  /* Split into masked characters (titres gothiques, Linkedin) ------------ */
  $$('[data-reveal="chars"]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    [...text].forEach((c, i) => {
      if (c === " ") { el.appendChild(document.createTextNode(" ")); return; } // garde l'espace entre les mots
      const m = document.createElement("span");
      m.className = "m-mask";
      m.setAttribute("aria-hidden", "true");
      const s = document.createElement("span");
      s.className = "m-ch";
      s.textContent = c;
      s.style.setProperty("--i", i);
      m.appendChild(s);
      el.appendChild(m);
    });
  });

  /* Fit text to its container --------------------------------------------- */
  const fits = $$(".fit");
  const fit = () => {
    fits.forEach((el) => {
      const box = el.parentElement;
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.fontSize = "100px";
      const w = el.scrollWidth;
      el.style.fontSize = (100 * avail) / w + "px";
    });
  };
  fit();
  document.fonts && document.fonts.ready.then(fit);
  window.addEventListener("resize", fit);

  /* Page load ------------------------------------------------------------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("loaded")));

  /* Home intro (timings relevés sur le site Framer) ------------------------ */
  const body = document.body;
  if (body.classList.contains("intro")) {
    const q = (s) => document.querySelector(s);
    const move = q(".hero-name-move");
    const name = q(".hero-name .fit");
    const lines = [...document.querySelectorAll(".site-header .rule, main > section:first-child .rule")];
    const nav = q(".site-header .bar");
    const h1 = q(".hero-intro h1");
    const sub = q(".hero-intro p");
    const canAnimate = !reduce && move && name && typeof move.animate === "function";

    if (!canAnimate) {
      body.classList.remove("intro");
    } else {
      const expo = "cubic-bezier(0.16, 1, 0.3, 1)";
      const soft = "cubic-bezier(0.22, 1, 0.36, 1)";
      const inOut = "cubic-bezier(0.76, 0, 0.24, 1)";
      const vh = window.innerHeight;
      // desktop : décalage relevé sur Framer ; mobile/tablette (nom calé en bas) :
      // on part du tiers haut de l'écran pour garder la même mise en scène
      let startY = -0.37 * vh;
      if (window.innerWidth <= 1024) {
        const prev = move.style.transform;
        move.style.transform = "none";
        const r = move.getBoundingClientRect();
        move.style.transform = prev;
        startY = vh * 0.3 - (r.top + r.height / 2);
      }
      const anims = [
        name.animate(
          [{ transform: `translateY(${-0.5 * vh}px)` }, { transform: "translateY(0)" }],
          { duration: 2000, easing: expo, fill: "both" }
        ),
        name.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1100, easing: "ease-out", fill: "both" }),
        move.animate(
          [{ transform: `translateY(${startY}px) scale(0.6)` }, { transform: "translateY(0) scale(1)" }],
          { duration: 1100, delay: 2250, easing: inOut, fill: "both" }
        ),
        ...lines.map((l, i) =>
          l.animate(
            [{ transform: "translateX(-103%)" }, { transform: "translateX(0)" }],
            { duration: 1500, delay: 3300 + i * 90, easing: expo, fill: "both" }
          )
        ),
        ...[h1, sub].map((el) =>
          el.animate(
            [{ opacity: 0, transform: "translateY(45px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 1000, delay: 3700, easing: soft, fill: "both" }
          )
        ),
        nav.animate(
          [{ opacity: 0, transform: "translateY(-90px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 1000, delay: 3780, easing: soft, fill: "both" }
        ),
      ];
      body.classList.remove("intro");
      Promise.all(anims.map((a) => a.finished)).then(() => anims.forEach((a) => a.cancel())).catch(() => {});
    }
  }

  /* Statements: split into characters ------------------------------------- */
  const statements = $$(".statement").map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.textContent = "";
    const chars = [];
    words.forEach((w, wi) => {
      const ws = document.createElement("span");
      ws.className = "w";
      ws.setAttribute("aria-hidden", "true");
      [...w].forEach((c) => {
        const cs = document.createElement("span");
        cs.className = "c";
        cs.textContent = c;
        ws.appendChild(cs);
        chars.push(cs);
      });
      el.appendChild(ws);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return { el, chars, lit: -1 };
  });

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Grands paragraphes des études de cas : s'allument mot à mot au scroll -- */
  const leads = $$("[data-lead]").map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="lw" aria-hidden="true">${w}</span>`).join(" ");
    return { el, words: [...el.querySelectorAll(".lw")] };
  });

  /* Reveal on enter ------------------------------------------------------- */
  $$('[data-reveal="rows"]').forEach((list) =>
    [...list.children].forEach((c, i) => c.style.setProperty("--i", i))
  );
  // petits décalages entre éléments qui entrent ensemble (image puis légende)
  $$(".pm-row").forEach((row) =>
    [...row.querySelectorAll('[data-reveal="image"]')].forEach((m, i) => m.style.setProperty("--d", i * 0.12 + "s"))
  );
  $$(".card").forEach((card) => {
    const label = card.querySelector('[data-reveal="fade"]');
    if (label) label.style.setProperty("--d", "0.25s");
  });
  const revealables = $$("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target._reveal || e.target;
          el.classList.add("is-in");
          if (el.dataset.reveal === "chars") setTimeout(() => el.classList.add("is-done"), 2200);
          io.unobserve(e.target);
        }
      }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );
    // un élément masqué par clip-path n'est jamais « visible » pour l'observer :
    // on observe donc son parent pour les images
    revealables.forEach((el) => {
      const target = el.dataset.reveal === "image" ? el.parentElement : el;
      target._reveal = el;
      io.observe(target);
    });
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  /* Toujours arriver en haut d'une page qu'on ouvre (sauf ancre) ----------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const toTop = () => {
    if (location.hash) return;
    window.scrollTo(0, 0);
    // si la page est affichée dans un cadre (aperçu), on remonte aussi le cadre parent
    try { document.getElementById("top")?.scrollIntoView({ block: "start", behavior: "instant" }); } catch (_) {}
  };
  toTop();
  window.addEventListener("load", toTop);
  window.addEventListener("pageshow", toTop);

  /* Smooth scroll (Lenis) ------------------------------------------------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    if (!location.hash) lenis.scrollTo(0, { immediate: true, force: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* Scroll-linked effects ------------------------------------------------- */
  const portrait = document.querySelector(".about-portrait");
  const track = document.querySelector(".tools-track");
  const helix = document.querySelector(".helix");
  const sticky = document.querySelector(".tools-sticky");
  const plx = $$(".card .plx");
  const marquee = document.querySelector(".marquee-track");
  let helixP = null, helixTarget = 0;
  const renderHelix = () => {
    if (!helix) return;
    if (helixP === null) helixP = helixTarget;
    helixP += (helixTarget - helixP) * (reduce ? 1 : 0.2);
    if (Math.abs(helixTarget - helixP) < 0.0005) helixP = helixTarget;
    helix.style.transform =
      `perspective(1200px) translateY(${240 - 440 * helixP}px) rotateY(${90 - 180 * helixP}deg)`;
    if (helixP !== helixTarget) requestAnimationFrame(renderHelix);
  };

  // la spirale garde ses proportions : on la réduit pour qu'elle tienne dans l'écran
  const helixScale = document.querySelector(".helix-scale");
  const fitHelix = () => {
    if (!helixScale) return;
    const vw = window.innerWidth;
    const design = vw <= 700 ? 650 : vw <= 1024 ? 1050 : 1250;
    helixScale.style.scale = Math.min(1, vw / design).toFixed(3);
  };
  fitHelix();
  window.addEventListener("resize", fitHelix);

  const onScroll = () => {
    const vh = window.innerHeight;

    // Statements : chaque lettre s'allume progressivement (fenêtre de 8 lettres)
    statements.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = reduce ? 1 : clamp((vh * 0.88 - r.top) / (r.height + vh * 0.5));
      // vague : chaque lettre monte légèrement en s'allumant, avec un petit rebond
      const n = s.chars.length, w = 10;
      const head = p * (n + w);
      s.chars.forEach((c, i) => {
        const q = clamp((head - i) / w);
        if (c._q === q) return;
        c._q = q;
        const ease = 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2); // easeOutBack doux
        c.style.opacity = (0.2 + 0.8 * q).toFixed(3);
        c.style.transform = `translate3d(0, ${((1 - ease) * 0.28).toFixed(3)}em, 0)`;
      });
    });

    leads.forEach((l) => {
      const r = l.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = reduce ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const n = l.words.length, w = 4, head = p * (n + w);
      l.words.forEach((s, i) => {
        const o = (0.22 + 0.78 * clamp((head - i) / w)).toFixed(3);
        if (s._o !== o) { s.style.opacity = o; s._o = o; }
      });
    });

    if (portrait && !reduce) {
      const r = portrait.parentElement.getBoundingClientRect();
      const p = clamp((vh - r.top) / (r.height + vh));
      const amp = window.innerWidth <= 1024 ? 140 : 360; // parallaxe plus courte sur petit écran
      portrait.style.transform = `translateY(${(0.5 - p) * amp}px)`;
    }

    // Parallaxe douce dans les vignettes projets
    if (!reduce) {
      plx.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.setProperty("--py", (p * -28).toFixed(1) + "px");
      });
    }

    if (track && helix) {
      const r = track.getBoundingClientRect();
      const was = helixTarget;
      helixTarget = clamp(-r.top / (r.height - sticky.offsetHeight));
      if (was !== helixTarget || helixP === null) requestAnimationFrame(renderHelix);
    }
  };
  if (lenis) lenis.on("scroll", onScroll);
  else window.addEventListener("scroll", () => requestAnimationFrame(onScroll), { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* Marquee : vitesse de base + accélération selon la vitesse de scroll ---- */
  if (marquee && !reduce) {
    let x = 0, boost = 0, last = performance.now();
    const loop = (t) => {
      const dt = Math.min(64, t - last) / 1000; last = t;
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      boost += (v * 9 - boost) * 0.08;
      x -= (70 + boost) * dt;
      const half = marquee.scrollWidth / 2;
      if (-x >= half) x += half;
      marquee.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* Vidéos projets : chargées à la première apparition, lues seulement à l'écran */
  const videos = $$("video[data-src]");
  if ("IntersectionObserver" in window && videos.length) {
    const vio = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.dataset.src; v.load(); }
          if (!reduce) v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      }),
      { rootMargin: "200px 0px" }
    );
    videos.forEach((v) => vio.observe(v));
  }

  /* Curseur : un point qui suit la souris (repris de tomdekoning.work) et une
     traînée de paillettes dessinée sur un canvas. Le point grossit au survol
     des liens. */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduce) {
    const wrap = document.createElement("div");
    wrap.className = "cursor-wrap";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<canvas class="cursor-canvas cursor-haze"></canvas><canvas class="cursor-canvas"></canvas><div class="cursor-dot"></div>';
    document.body.appendChild(wrap);
    // deux calques : la vapeur (floutée en CSS) et la poussière (nette)
    const haze = wrap.children[0], canvas = wrap.children[1], dot = wrap.lastChild;
    const hctx = haze.getContext("2d"), ctx = canvas.getContext("2d");
    let inside = false, tx = 0, ty = 0, x = 0, y = 0, lastT = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      [canvas, haze].forEach((cv) => {
        cv.width = Math.round(innerWidth * dpr);
        cv.height = Math.round(innerHeight * dpr);
        cv.style.width = innerWidth + "px";
        cv.style.height = innerHeight + "px";
        cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!inside) { x = tx; y = ty; inside = true; dot.style.opacity = 1; }
    }, { passive: true });
    document.addEventListener("mouseleave", () => { inside = false; dot.style.opacity = 0; });
    document.addEventListener("mouseover", (e) => {
      const l = e.target.closest("a, button, [data-cursor]");
      if (l && !l.contains(e.relatedTarget)) dot.classList.add("is-link");
    });
    document.addEventListener("mouseout", (e) => {
      const l = e.target.closest("a, button, [data-cursor]");
      if (l && !l.contains(e.relatedTarget)) dot.classList.remove("is-link");
    });

    // Paillettes : de minuscules éclats plats (carrés, hexagones) qui
    // pivotent sur eux-mêmes en tombant. Ils accrochent la lumière quand ils
    // font face à l'écran, comme de vraies paillettes, puis s'éteignent.
    const sparks = [];
    const trail = [];   // traînée lumineuse qui s'efface progressivement
    const TRAIL_LIFE = 900;
    // argent dominant + quelques reflets holographiques discrets
    const TINTS = [[235, 235, 240], [235, 235, 240], [235, 235, 240], [244, 226, 190], [240, 214, 232], [206, 232, 244]];
    let px = null, py = null;
    const spawn = (x0, y0, vx0, vy0) => {
      sparks.push({
        x: x0 + (Math.random() - 0.5) * 12,
        y: y0 + (Math.random() - 0.5) * 12,
        vx: vx0 * 0.03 + (Math.random() - 0.5) * 0.6,
        vy: vy0 * 0.03 + Math.random() * 0.4,
        s: 0.3 + Math.random() * 0.6,           // taille de l'éclat
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.08,
        flip: Math.random() * Math.PI * 2,      // rotation « 3D » de la paillette
        vf: 0.08 + Math.random() * 0.22,
        sides: Math.random() < 0.5 ? 4 : 6,
        born: performance.now(),
        life: 1400 + Math.random() * 1000,
        c: TINTS[(Math.random() * TINTS.length) | 0],
      });
    };
    const flake = (r, sides) => {
      ctx.beginPath();
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    };

    const tick = (now) => {
      const dt = Math.min(64, now - lastT); lastT = now;
      const k = 1 - Math.pow(0.0015, dt / 250);
      x += (tx - x) * k; y += (ty - y) * k;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      if (inside && px !== null) {
        const dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy);
        const n = Math.min(12, Math.ceil(d / 2.5));
        for (let i = 0; i < n; i++) spawn(px + (dx * i) / n, py + (dy * i) / n, dx, dy);
      }
      px = tx; py = ty;
      if (sparks.length > 900) sparks.splice(0, sparks.length - 900);

      ctx.clearRect(0, 0, innerWidth, innerHeight);

      // traînée : une ligne douce qui s'amincit et s'efface vers la queue
      if (inside) {
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(x - last.x, y - last.y) > 1.5) trail.push({ x, y, t: now });
      }
      while (trail.length && now - trail[0].t > TRAIL_LIFE) trail.shift();
      hctx.clearRect(0, 0, innerWidth, innerHeight);
      if (trail.length > 2) {
        hctx.lineCap = "round";
        hctx.lineJoin = "round";
        for (let i = 1; i < trail.length - 1; i++) {
          const a = trail[i - 1], b = trail[i], c = trail[i + 1];
          const life = 1 - (now - b.t) / TRAIL_LIFE;           // 1 à la tête, 0 à la queue
          if (life <= 0) continue;
          const ease = life * life;
          hctx.beginPath();
          hctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
          hctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
          hctx.strokeStyle = `rgba(255,255,255,${(ease * 0.32).toFixed(3)})`;
          hctx.lineWidth = 4 + ease * 18;
          hctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i], age = now - s.born;
        if (age > s.life) { sparks.splice(i, 1); continue; }
        s.vy += 0.006;                        // poussière : flotte et retombe à peine
        s.vx += Math.sin(age / 180 + s.rot) * 0.01;   // léger flottement
        s.vx *= 0.99; s.vy *= 0.985;
        s.x += s.vx; s.y += s.vy; s.rot += s.vr; s.flip += s.vf;
        const face = Math.cos(s.flip);        // -1..1 : la paillette pivote
        const glint = Math.pow(Math.abs(face), 6);   // éclat bref quand elle fait face
        const fade = 1 - Math.pow(age / s.life, 2);
        const light = 0.7 + 0.3 * glint;
        const [r, g, b] = s.c;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.scale(Math.max(0.12, Math.abs(face)), 1);
        ctx.fillStyle = `rgba(${(r * light) | 0},${(g * light) | 0},${(b * light) | 0},${(fade * (0.75 + 0.25 * glint)).toFixed(3)})`;
        flake(s.s, s.sides);
        ctx.restore();
        if (glint > 0.85) {                   // petit point de lumière sur l'éclat
          ctx.fillStyle = `rgba(255,255,255,${(fade * glint).toFixed(3)})`;
          ctx.fillRect(s.x - 0.35, s.y - 0.35, 0.7, 0.7);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* Transition vers un projet (d'après moisez.com) ------------------------
     Au clic, l'écran se couvre colonne par colonne (les 12 colonnes de la
     grille + les deux marges). Chaque colonne s'ouvre verticalement depuis la
     hauteur du clic ; la vague part de la colonne cliquée et se propage sur
     les côtés. Puis la page projet s'affiche. */
  const PROJECTS = ["paladin", "oreve", "renault", "joseph-duclos", "helena-rubinstein", "juice",
    "henri-selmer", "moet-chandon", "sonergia", "hopauto", "goyard", "selectour"];
  const isProjectLink = (a) => {
    const h = (a.getAttribute("href") || "").split("#")[0].replace(/\.html$/, "").replace(/^\.?\//, "");
    return PROJECTS.includes(h) || /^index$/.test(h) && a.classList.contains("mono-btn");
  };
  const buildWipe = () => {
    const vw = document.documentElement.clientWidth;
    const wrap = document.querySelector(".wrap");
    const cs = getComputedStyle(wrap);
    const r = wrap.getBoundingClientRect();
    const left = r.left + parseFloat(cs.paddingLeft), right = r.right - parseFloat(cs.paddingRight);
    const n = vw <= 700 ? 4 : 12, cw = (right - left) / n;
    const edges = [0, left];
    for (let i = 1; i < n; i++) edges.push(left + cw * i);
    edges.push(right, vw);
    const el = document.createElement("div");
    el.className = "page-wipe";
    el.setAttribute("aria-hidden", "true");
    const cols = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const c = document.createElement("i");
      c.style.left = edges[i] + "px";
      c.style.width = Math.ceil(edges[i + 1] - edges[i]) + 1 + "px";
      el.appendChild(c); cols.push(c);
    }
    document.body.appendChild(el);
    return { el, cols, edges };
  };

  if (!reduce && "animate" in document.body) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === "_blank" || !isProjectLink(a)) return;
      e.preventDefault();
      const href = a.href;
      const { el, cols, edges } = buildWipe();
      const vh = innerHeight, y = Math.min(vh - 1, Math.max(1, e.clientY || vh / 2));
      let hit = edges.findIndex((x, i) => e.clientX >= x && e.clientX < edges[i + 1]);
      if (hit < 0) hit = Math.floor(cols.length / 2);
      const anims = cols.map((c, i) => c.animate(
        [{ clipPath: `inset(${y}px 0 ${vh - y}px 0)` }, { clipPath: "inset(0 0 0 0)" }],
        { duration: 750, delay: Math.abs(i - hit) * 50, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" }
      ));
      try { sessionStorage.setItem("wipe", "1"); } catch (_) {}
      Promise.all(anims.map((x) => x.finished)).then(() => setTimeout(() => { window.location.href = href; }, 80));
    });

    // arrivée sur la nouvelle page : l'écran couvert se dissipe
    let arrived = false;
    try { arrived = !!sessionStorage.getItem("wipe"); sessionStorage.removeItem("wipe"); } catch (_) {}
    if (arrived) {
      const { el } = buildWipe();
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 120, easing: "ease-out", fill: "both" })
        .finished.then(() => el.remove());
    }
    window.addEventListener("pageshow", (ev) => {
      if (ev.persisted) document.querySelectorAll(".page-wipe").forEach((w) => w.remove());
    });
  }

  /* Back to top ----------------------------------------------------------- */
  $$("[data-top]").forEach((b) =>
    b.addEventListener("click", () =>
      lenis
        ? lenis.scrollTo(0, { duration: 2, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) })
        : window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
    )
  );
})();
