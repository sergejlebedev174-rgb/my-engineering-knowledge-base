// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС
// СЛОЙ ВИЗУАЛЬНЫХ ЭФФЕКТОВ КОКПИТА (пара к css/cockpit-fx.css)
// Оживляет главный экран, ничего не меняя в его разметке и логике:
// глубина фона, объём и свет карточек, живой 3D-разрез камеры (потоки воздуха,
// конденсат, испарение), живой финансовый график, таймер, капсулы KOMET, тележки.
// ==========================================================================
(function () {
  "use strict";
  // аварийный выключатель: index.html?fx=0 — кокпит без слоя эффектов
  if (window.ArmFx || /[?&]fx=0\b/.test(location.search)) return;

  const html = document.documentElement;
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = reduceMotion || (navigator.hardwareConcurrency || 8) <= 4 || (window.matchMedia && matchMedia("(max-width: 900px)").matches);
  // для штрихов потока 1.5× достаточно: чётко, но вдвое дешевле, чем 2× на 4K-экране
  const FDPR = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.5);
  html.classList.add("fx-on");
  if (lite) html.classList.add("fx-lite");

  // ---------- Общий цикл анимации: один requestAnimationFrame на все эффекты ----------
  const tasks = new Set();
  let rafId = 0;
  let lastT = 0;
  let paused = false;
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    if (document.visibilityState === "visible" && !paused) {
      tasks.forEach((fn) => {
        try { fn(dt, now / 1000); } catch (e) { console.warn("[FX]", e); tasks.delete(fn); }
      });
    }
    rafId = tasks.size ? requestAnimationFrame(loop) : 0;
  }
  function addTask(fn) {
    tasks.add(fn);
    if (!rafId) { lastT = performance.now(); rafId = requestAnimationFrame(loop); }
  }
  const isShown = (el) => !!(el && el.isConnected && el.offsetParent !== null);
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, k) => a + (b - a) * k;

  // Готовые «пятна света» вместо градиента на каждую частицу в каждом кадре — в разы дешевле
  const SPRITES = {};
  function sprite(rgb) {
    if (SPRITES[rgb]) return SPRITES[rgb];
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.35, `rgba(${rgb},0.45)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return (SPRITES[rgb] = c);
  }
  function blob(ctx, rgb, x, y, rx, ry, a) {
    if (a <= 0.003) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(sprite(rgb), x - rx, y - ry, rx * 2, ry * 2);
    ctx.globalAlpha = 1;
  }

  function telemetry() {
    const tel = (window.state && window.state.telemetry) || {};
    let pid = null;
    try { pid = window.ARMCore && window.ARMCore.computeClosedLoopPid ? window.ARMCore.computeClosedLoopPid(tel) : null; } catch (e) {}
    const hzTxt = (document.querySelector(".ck-v-slider-hz") || {}).textContent || "";
    const hzMatch = hzTxt.match(/(\d+(?:\.\d+)?)\s*Hz/i);
    const fanHz = hzMatch ? parseFloat(hzMatch[1]) : (pid ? pid.recHz : 30);
    return {
      tempC: pid ? pid.tempC : Number(tel.environmentTempC || 15.8),
      rh: pid ? Math.round(pid.rhPct) : Math.round(Number(tel.parksideRhPercent || 58)),
      vpd: pid ? pid.vpdKpa : 0.75,
      dew: pid ? pid.dewPointC : 7.6,
      coil: Number(tel.dehumicoilTempC != null ? tel.dehumicoilTempC : 5.1),
      eev: pid ? pid.recEevSteps : Number(tel.eev1Steps || 315),
      fanHz,
      pause: Boolean(tel.isPausePhaseNow) || fanHz < 20,
      statusCol: pid ? pid.statusCol : "#2DD4BF",
    };
  }

  // =====================================================================
  // 1. Фон: аврора, пыль в луче, плёночное зерно
  // =====================================================================
  function mountAmbient(pane) {
    if (pane.querySelector(":scope > .fx-ambient")) return;
    const amb = document.createElement("div");
    amb.className = "fx-ambient";
    amb.innerHTML = '<div class="fx-aurora a1"></div><div class="fx-aurora a2"></div><div class="fx-aurora a3"></div><canvas class="fx-dust"></canvas><div class="fx-grain"></div>';
    pane.insertBefore(amb, pane.firstChild);
    if (lite) return;

    const cvs = amb.querySelector("canvas");
    const ctx = cvs.getContext("2d");
    const motes = Array.from({ length: 55 }, () => ({ x: Math.random(), y: Math.random(), z: rand(0.3, 1), tw: rand(0, 6.28), vx: rand(-0.004, 0.004), vy: rand(-0.012, -0.004) }));
    let mx = 0, my = 0, smx = 0, smy = 0;
    window.addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    addTask((dt, t) => {
      if (!isShown(pane)) return;
      const w = cvs.clientWidth, h = cvs.clientHeight;
      if (!w || !h) return;
      // мягкие пылинки не требуют высокой плотности пикселей — рисуем в 1×
      if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h; }
      smx = lerp(smx, mx, 0.04); smy = lerp(smy, my, 0.04);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      motes.forEach((m) => {
        m.x += m.vx * dt * m.z; m.y += m.vy * dt * m.z;
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
        if (m.x < -0.02) m.x = 1.02; else if (m.x > 1.02) m.x = -0.02;
        const px = m.x * w - smx * 40 * m.z, py = m.y * h - smy * 30 * m.z;
        const r = (0.6 + m.z * 1.6) * 4;
        blob(ctx, "186,230,253", px, py, r, r, (0.18 + 0.22 * Math.sin(t * 1.3 + m.tw)) * m.z);
      });
    });
  }

  // =====================================================================
  // 2. Карточки: наклон за курсором, блик, порядок появления
  // =====================================================================
  const cardStates = new Map();
  function enhanceCards(root) {
    const header = root.querySelector(".ck-header-bar");
    if (header) header.style.setProperty("--fx-i", "0");
    root.querySelectorAll(".ck-bento-grid .ck-card").forEach((card, i) => {
      if (card.dataset.fxCard) return;
      card.dataset.fxCard = "1";
      card.style.setProperty("--fx-i", String(i + 1));
      card.style.setProperty("--fx-sheen-delay", `${(i * 1.7) % 11}s`);
      // световая волна — только на главных карточках: на всех семи она стоила бы заметной доли кадра
      if (!lite && (card.classList.contains("stage-3d") || card.classList.contains("fintech-hero"))) {
        const sheen = document.createElement("i");
        sheen.className = "fx-sheen";
        card.appendChild(sheen);
      }
      const st = { rx: 0, ry: 0, trx: 0, try: 0, g: 0, tg: 0 };
      cardStates.set(card, st);
      card.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        const dragging3d = e.buttons && e.target.closest && e.target.closest(".fx-live3d-layer");
        const k = lite || dragging3d ? 0 : 1;
        // большие карточки наклоняются слабее, чтобы не «плыл» текст
        const amp = r.width > 600 ? 1.6 : 3.2;
        st.try = nx * amp * k; st.trx = -ny * amp * k; st.tg = 1;
        card.classList.add("fx-hover");
        if (k) card.classList.add("fx-tilt");
      });
      card.addEventListener("pointerleave", () => { st.trx = 0; st.try = 0; st.tg = 0; card.classList.remove("fx-hover"); });
    });
  }
  addTask(() => {
    cardStates.forEach((st, card) => {
      if (!card.isConnected) { cardStates.delete(card); return; }
      const d = Math.abs(st.rx - st.trx) + Math.abs(st.ry - st.try) + Math.abs(st.g - st.tg);
      if (d < 0.002) {
        // вернулась в покой — снимаем 3D-трансформацию, чтобы не держать слой на видеокарте
        if (!st.tg && card.classList.contains("fx-tilt")) card.classList.remove("fx-tilt");
        return;
      }
      st.rx = lerp(st.rx, st.trx, 0.12); st.ry = lerp(st.ry, st.try, 0.12); st.g = lerp(st.g, st.tg, 0.12);
      card.style.setProperty("--fx-rx", st.rx.toFixed(3) + "deg");
      card.style.setProperty("--fx-ry", st.ry.toFixed(3) + "deg");
      card.style.setProperty("--fx-glare", st.g.toFixed(3));
    });
  });

  // =====================================================================
  // 3. Живой 3D-разрез камеры: потоки воздуха, конденсат, испарение с рыбы
  //    Координаты — в долях рендера aim-3d.png (1376×768), привязаны к его узлам
  // =====================================================================
  const IMG_W = 1376, IMG_H = 768;
  const FLOW_PATHS = {
    fanA: [[0.205, 0.235], [0.225, 0.31], [0.27, 0.39], [0.34, 0.47], [0.41, 0.54], [0.455, 0.58]],
    fanB: [[0.335, 0.21], [0.335, 0.29], [0.355, 0.38], [0.39, 0.47], [0.43, 0.55], [0.455, 0.62]],
    cold1: [[0.472, 0.165], [0.487, 0.25], [0.503, 0.36], [0.518, 0.48], [0.528, 0.6], [0.531, 0.655]],
    cold2: [[0.5, 0.15], [0.51, 0.24], [0.522, 0.35], [0.531, 0.47], [0.536, 0.58]],
    warm1: [[0.605, 0.78], [0.612, 0.66], [0.618, 0.52], [0.622, 0.38], [0.624, 0.26], [0.618, 0.15]],
    warm2: [[0.588, 0.76], [0.596, 0.63], [0.602, 0.49], [0.607, 0.35], [0.61, 0.22]],
    smoke: [[0.965, 0.135], [0.9, 0.115], [0.84, 0.105], [0.79, 0.105], [0.75, 0.11]],
    heat: [[0.77, 0.57], [0.772, 0.5], [0.768, 0.43], [0.775, 0.36]],
  };
  const LANES_V = [0.41, 0.48, 0.55, 0.62, 0.69];
  LANES_V.forEach((v, i) => { FLOW_PATHS["lane" + i] = [[0.115, v], [0.2, v + 0.006], [0.3, v - 0.004], [0.4, v + 0.004], [0.452, v + 0.018]]; });

  // Равномерная по длине выборка гладкой кривой (Catmull-Rom) — частицы идут с постоянной скоростью
  function samplePath(points, count) {
    const pts = points.map(([u, v]) => [u * IMG_W, v * IMG_H]);
    const dense = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let s = 0; s < 20; s++) {
        const t = s / 20, t2 = t * t, t3 = t2 * t;
        dense.push([0, 1].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    dense.push(pts[pts.length - 1]);
    const acc = [0];
    for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const total = acc[acc.length - 1];
    const out = [];
    let j = 0;
    for (let n = 0; n < count; n++) {
      const d = (n / (count - 1)) * total;
      while (j < acc.length - 2 && acc[j + 1] < d) j++;
      const k = (d - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
      out.push([lerp(dense[j][0], dense[j + 1][0], k), lerp(dense[j][1], dense[j + 1][1], k)]);
    }
    return { pts: out, length: total };
  }
  const SAMPLED = {};
  Object.keys(FLOW_PATHS).forEach((k) => { SAMPLED[k] = samplePath(FLOW_PATHS[k], 140); });
  function pathAt(path, f) {
    const p = path.pts, x = Math.max(0, Math.min(0.9999, f)) * (p.length - 1), i = Math.floor(x), k = x - i;
    const a = p[i], b = p[i + 1] || a;
    const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1;
    return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), nx: nx / nl, ny: ny / nl };
  }

  function makeParticles() {
    const n = (full) => (lite ? Math.ceil(full / 2) : full);
    const list = [];
    const add = (kind, paths, count, opt) => {
      for (let i = 0; i < count; i++) {
        list.push({ kind, path: SAMPLED[paths[i % paths.length]], f: Math.random(), off: rand(-1, 1), speed: rand(opt.v[0], opt.v[1]), w: rand(opt.w[0], opt.w[1]), a: rand(opt.a[0], opt.a[1]), tail: rand(opt.tail[0], opt.tail[1]), seed: Math.random() * 10 });
      }
    };
    add("air", ["fanA", "fanB"], n(70), { v: [150, 260], w: [0.8, 2], a: [0.12, 0.34], tail: [14, 34] });
    add("lane", LANES_V.map((_, i) => "lane" + i), n(60), { v: [90, 170], w: [0.6, 1.6], a: [0.06, 0.2], tail: [18, 44] });
    add("cold", ["cold1", "cold2"], n(56), { v: [120, 210], w: [1.2, 3], a: [0.25, 0.6], tail: [12, 28] });
    add("warm", ["warm1", "warm2"], n(56), { v: [120, 210], w: [1.2, 3], a: [0.22, 0.55], tail: [12, 28] });
    add("smoke", ["smoke"], n(18), { v: [40, 75], w: [0, 0], a: [0.08, 0.16], tail: [0, 0] });
    add("heat", ["heat"], n(14), { v: [30, 60], w: [0, 0], a: [0.08, 0.16], tail: [0, 0] });
    return list;
  }

  function mountLivingChamber(stage) {
    if (stage.dataset.fxStage) return;
    stage.dataset.fxStage = "1";
    const depth = document.createElement("div");
    depth.className = "fx-depth";
    while (stage.firstChild) depth.appendChild(stage.firstChild);
    stage.appendChild(depth);
    const img = depth.querySelector(".ck-photo-twin-img");
    const cvs = document.createElement("canvas");
    cvs.className = "fx-flow";
    if (img && img.nextSibling) depth.insertBefore(cvs, img.nextSibling); else depth.appendChild(cvs);
    const ctx = cvs.getContext("2d");

    // подписи датчиков при наведении
    depth.querySelectorAll(".ck-photo-hs").forEach((hs) => {
      if (hs.querySelector(".fx-hs-label")) return;
      const lab = document.createElement("span");
      lab.className = "fx-hs-label";
      lab.textContent = (hs.getAttribute("title") || "").replace(/^\[\d+\]\s*/, "");
      hs.appendChild(lab);
    });

    // выноски с живыми значениями (позиция в долях рендера)
    const CALLOUTS = [
      { id: "coil", u: 0.505, v: 0.085, c: "#38BDF8", d: 0.2 },
      { id: "reheat", u: 0.668, v: 0.24, c: "#FB923C", d: 0.35 },
      { id: "fish", u: 0.30, v: 0.765, c: "#FBBF24", d: 0.5 },
      { id: "drain", u: 0.455, v: 0.895, c: "#2DD4BF", d: 0.65 },
      { id: "comp", u: 0.735, v: 0.935, c: "#A78BFA", d: 0.8 },
    ];
    const calloutEls = CALLOUTS.map((co) => {
      const el = document.createElement("div");
      el.className = "fx-callout";
      el.style.setProperty("--c", co.c);
      el.style.setProperty("--d", co.d + "s");
      depth.appendChild(el);
      return { ...co, el };
    });
    function updateCallouts() {
      const t = telemetry();
      const text = {
        coil: `1#DEHUMICOIL <b>+${t.coil.toFixed(1)}°C</b>`,
        reheat: `REHEAT <b>+68°C</b>`,
        fish: `15 ТЕЛЕЖЕК <b>${t.tempC.toFixed(1)}°C · ${t.rh}%</b>`,
        drain: `ТРАП [21] <b>${t.pause ? "пауза" : "−6.4 л/ч"}</b>`,
        comp: `R410A <b>24.0 бар</b>`,
      };
      calloutEls.forEach((co) => {
        const html2 = `<i></i>${text[co.id]}`;
        if (co.el.innerHTML !== html2) co.el.innerHTML = html2;
      });
    }
    updateCallouts();
    setInterval(updateCallouts, 1500);

    // параллакс: рендер, частицы и датчики двигаются как один слой глубины
    stage.addEventListener("pointermove", (e) => {
      if (lite || e.pointerType === "touch") return;
      const r = stage.getBoundingClientRect();
      depth.style.setProperty("--fx-px", (-((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(1) + "px");
      depth.style.setProperty("--fx-py", (-((e.clientY - r.top) / r.height - 0.5) * 9).toFixed(1) + "px");
    });
    stage.addEventListener("pointerleave", () => { depth.style.setProperty("--fx-px", "0px"); depth.style.setProperty("--fx-py", "0px"); });

    const parts = makeParticles();
    const drips = Array.from({ length: lite ? 3 : 6 }, (_, i) => ({ u: [0.515, 0.523, 0.531, 0.539, 0.527, 0.519][i], y: 0, vy: 0, wait: rand(0, 1.6), splash: -1 }));
    const mist = Array.from({ length: lite ? 22 : 46 }, () => ({ u: rand(0.12, 0.4), v: rand(0.37, 0.71), life: rand(0, 1), dur: rand(2.5, 5) }));
    const lamps = [[0.225, 0.305, 0.07], [0.358, 0.28, 0.065]];
    let W = 0, H = 0, S = 1, OX = 0, OY = 0, speedK = 1;

    function fit() {
      W = depth.clientWidth; H = depth.clientHeight;
      if (!W || !H) return false;
      if (cvs.width !== Math.round(W * FDPR) || cvs.height !== Math.round(H * FDPR)) { cvs.width = Math.round(W * FDPR); cvs.height = Math.round(H * FDPR); }
      // рендер вписан через object-fit: contain (cyber-scada.css) — та же формула и здесь
      S = Math.min(W / IMG_W, H / IMG_H); OX = (W - IMG_W * S) / 2; OY = (H - IMG_H * S) / 2;
      return true;
    }
    const X = (px) => OX + px * S, Y = (py) => OY + py * S;
    let lastFit = 0;

    function placeCallouts() {
      calloutEls.forEach((co) => {
        co.el.style.left = X(co.u * IMG_W).toFixed(1) + "px";
        co.el.style.top = Y(co.v * IMG_H).toFixed(1) + "px";
      });
    }

    addTask((dt, t) => {
      if (!isShown(stage) || stage.classList.contains("fx-hidden-by-live")) return;
      if (t - lastFit > 0.5 || !W) { lastFit = t; if (!fit()) return; placeCallouts(); }
      // толщина и яркость штрихов не должны теряться на маленькой карточке
      const LW = Math.max(1, S * 2.6);
      const tel = telemetry();
      speedK = lerp(speedK, tel.pause ? 0.32 : Math.max(0.4, tel.fanHz / 30), 0.05);
      ctx.setTransform(FDPR, 0, 0, FDPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";

      // тёплое свечение ламп в тоннеле
      ctx.globalCompositeOperation = "lighter";
      lamps.forEach(([u, v, r], i) => {
        const fl = 0.85 + 0.15 * Math.sin(t * 3.1 + i * 2) * Math.sin(t * 7.3 + i);
        const rr = r * IMG_W * S;
        blob(ctx, "255,214,150", X(u * IMG_W), Y(v * IMG_H), rr * 1.9, rr * 0.6, 0.22 * fl);
      });

      // испарение влаги с рыбы (сушка идёт — значит, пар уходит в поток)
      mist.forEach((m) => {
        m.life += (dt / m.dur) * (0.5 + speedK * 0.6);
        if (m.life > 1) { m.life = 0; m.u = rand(0.12, 0.4); m.v = rand(0.37, 0.71); m.dur = rand(2.5, 5); }
        const px = X((m.u + m.life * 0.035 * speedK) * IMG_W), py = Y((m.v - m.life * 0.05) * IMG_H);
        const r = (1.2 + m.life * 2.2) * S * 2.2;
        blob(ctx, "200,236,255", px, py, r, r, Math.sin(m.life * Math.PI) * 0.35);
      });

      // потоки воздуха
      parts.forEach((p) => {
        const isGas = p.kind === "smoke" || p.kind === "heat";
        const k = p.kind === "cold" || p.kind === "warm" ? 0.55 + speedK * 0.45 : speedK;
        p.f += ((p.speed * k) / p.path.length) * dt;
        if (p.f > 1) { p.f -= 1; p.off = rand(-1, 1); }
        const lane = p.kind === "lane" ? 7 : p.kind === "air" ? 16 : p.kind === "smoke" ? 10 : 9;
        const wob = Math.sin(t * 2 + p.seed) * 2.5;
        const head = pathAt(p.path, p.f);
        const hx = X(head.x + head.nx * (p.off * lane + wob)), hy = Y(head.y + head.ny * (p.off * lane + wob));
        const fade = Math.min(1, p.f * 6, (1 - p.f) * 5);
        if (isGas) {
          const grow = p.kind === "smoke" ? 6 + p.f * 26 : 4 + p.f * 10;
          const r = grow * S * 1.6;
          ctx.globalCompositeOperation = p.kind === "smoke" ? "screen" : "lighter";
          blob(ctx, p.kind === "smoke" ? "215,225,235" : "255,170,110", hx, hy, r, r, p.a * fade);
          return;
        }
        const tailF = p.f - (p.tail * 1.6) / p.path.length;
        const tl = pathAt(p.path, Math.max(0, tailF));
        const tx = X(tl.x + tl.nx * (p.off * lane + wob)), ty = Y(tl.y + tl.ny * (p.off * lane + wob));
        const a = Math.min(1, p.a * 1.7) * fade;
        const rgb = p.kind === "cold" ? "120,205,255" : p.kind === "warm" ? (p.f < 0.5 ? "255,140,80" : "255,180,110") : "225,242,255";
        const alpha = p.kind === "air" || p.kind === "lane" ? a * (0.6 + speedK * 0.4) : a;
        // хвост бледнее головы — два отрезка вместо градиента на каждую частицу
        const mx = (tx + hx) / 2, my = (ty + hy) / 2;
        ctx.globalCompositeOperation = "lighter";
        ctx.lineWidth = p.w * LW;
        ctx.strokeStyle = `rgba(${rgb},${(alpha * 0.3).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(mx, my); ctx.stroke();
        ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(hx, hy); ctx.stroke();
        if (p.kind === "cold" || p.kind === "warm") {
          // светящаяся «головка» потока у теплообменников
          const r = p.w * LW * 2.2;
          blob(ctx, rgb, hx, hy, r, r, alpha);
        }
      });

      // капли конденсата с V-испарителя в трап
      ctx.globalCompositeOperation = "lighter";
      const y0 = 0.675 * IMG_H, y1 = 0.815 * IMG_H;
      drips.forEach((d) => {
        if (d.splash >= 0) {
          d.splash += dt * 1.6;
          const cx = X(0.53 * IMG_W), cy = Y(y1);
          const r = (4 + d.splash * 30) * S;
          ctx.strokeStyle = `rgba(150,220,255,${0.45 * (1 - d.splash)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.ellipse(cx + (d.u - 0.53) * IMG_W * S * 0.6, cy, r, r * 0.28, 0, 0, 6.283); ctx.stroke();
          if (d.splash >= 1) { d.splash = -1; d.wait = rand(0.2, tel.pause ? 3.5 : 1.4); }
          return;
        }
        if (d.wait > 0) { d.wait -= dt; d.y = 0; d.vy = 0; return; }
        d.vy += 900 * dt; d.y += d.vy * dt;
        const py = y0 + d.y;
        if (py >= y1) { d.splash = 0; return; }
        const cx = X(d.u * IMG_W), cy = Y(py);
        blob(ctx, "150,215,255", cx, cy, 2.6 * S * 2, 4 * S * 2, 0.75);
        blob(ctx, "240,252,255", cx, cy, 1.1 * S * 2, 1.7 * S * 2, 0.9);
      });

      // мягкая пульсация холодного свечения испарителя и тепла догрева
      [[0.505, 0.42, "80,170,255", 0.15], [0.61, 0.47, "255,140,80", 0.13]].forEach(([u, v, c, base], i) => {
        const r = 0.11 * IMG_W * S;
        blob(ctx, c, X(u * IMG_W), Y(v * IMG_H), r, r, base * (0.75 + 0.25 * Math.sin(t * 1.4 + i * 1.7)) * 1.6);
      });
    });
  }

  // =====================================================================
  // 4. Живой финансовый терминал на месте статичных свечей
  // =====================================================================
  function mountLiveCandles(svg) {
    if (svg.dataset.fxCandles) return;
    svg.dataset.fxCandles = "1";
    const N = 24, STEP = 13, H0 = 62;
    // старт — те же «волны», что рисовал кокпит, дальше ряд живёт сам
    const data = [];
    for (let i = 0; i < N; i++) {
      const wv = Math.sin(i * 0.45) * 26 + Math.cos(i * 0.9) * 12;
      data.push({ top: H0 - wv, h: 22 + (i % 4) * 7, up: i % 2 === 0 });
    }
    let level = data[N - 1].top;
    function nextCandle() {
      level += rand(-9, 9) + (62 - level) * 0.12;
      level = Math.max(20, Math.min(110, level));
      const h = rand(16, 42);
      return { top: level, h, up: Math.random() > 0.42 };
    }
    function smoothPath(pts) {
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const mx = (x0 + x1) / 2;
        d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
      }
      return d;
    }
    function render(shift) {
      const mids = data.map((c, i) => [8 + i * STEP + 2.5, +(c.top + c.h * 0.35).toFixed(1)]);
      const line = smoothPath(mids);
      const area = `${line} L ${mids[mids.length - 1][0]} 165 L ${mids[0][0]} 165 Z`;
      const last = mids[mids.length - 1];
      const candles = data.map((c, i) => {
        const x = 8 + i * STEP, col = c.up ? "#2DD4BF" : "#3B82F6";
        return `<line x1="${x + 2.5}" y1="${(c.top - 7).toFixed(1)}" x2="${x + 2.5}" y2="${(c.top + c.h + 7).toFixed(1)}" stroke="${col}" opacity="0.45"/>` +
          `<rect class="fx-c-body" style="--i:${i}" x="${x}" y="${c.top.toFixed(1)}" width="5" height="${c.h.toFixed(1)}" rx="2.5" fill="${col}" opacity="${c.up ? 0.92 : 0.7}"/>`;
      }).join("");
      // свечение — широкой полупрозрачной копией линии, без SVG-фильтров (их пришлось бы пересчитывать каждый кадр)
      svg.innerHTML = `
        <defs>
          <linearGradient id="fxAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.32"/><stop offset="100%" stop-color="#2563EB" stop-opacity="0"/></linearGradient>
          <clipPath id="fxChartClip"><rect x="0" y="-10" width="320" height="185"/></clipPath>
        </defs>
        <g opacity="0.6">${[30, 60, 90, 120].map((y) => `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 5"/>`).join("")}</g>
        <g clip-path="url(#fxChartClip)">
          <g class="fx-candles" style="transform:translateX(${shift ? STEP : 0}px)">
            <path class="fx-area" d="${area}" fill="url(#fxAreaGrad)"/>
            ${candles}
            <path class="fx-line" d="${line}" fill="none" stroke="#5EEAD4" stroke-width="5" opacity="0.14"/>
            <path class="fx-line" d="${line}" fill="none" stroke="#5EEAD4" stroke-width="1.3" opacity="0.9"/>
          </g>
        </g>
        <line x1="${last[0]}" y1="${last[1]}" x2="320" y2="${last[1]}" stroke="#5EEAD4" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.7"/>
        <circle cx="${last[0]}" cy="${last[1]}" r="6" fill="#5EEAD4" opacity="0.22"/>
        <circle class="fx-last-dot" cx="${last[0]}" cy="${last[1]}" r="2.6" fill="#ECFEFF"/>`;
      if (shift) {
        const g = svg.querySelector(".fx-candles");
        requestAnimationFrame(() => requestAnimationFrame(() => { if (g) g.style.transform = "translateX(0px)"; }));
      }
      placePulse();
    }
    // скан-полоса и пульс последней свечи — HTML-слой поверх SVG, анимируется видеокартой
    const box = svg.parentElement;
    const overlay = document.createElement("div");
    overlay.className = "fx-chart-overlay";
    overlay.innerHTML = '<div class="fx-chart-scan"></div><div class="fx-chart-pulse"></div>';
    box.appendChild(overlay);
    const pulse = overlay.querySelector(".fx-chart-pulse");
    function placePulse() {
      const dot = svg.querySelector(".fx-last-dot");
      if (!dot || !pulse) return;
      const r = dot.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (!r.width) return;
      pulse.style.left = (r.left + r.width / 2 - b.left).toFixed(1) + "px";
      pulse.style.top = (r.top + r.height / 2 - b.top).toFixed(1) + "px";
    }
    window.addEventListener("resize", placePulse);
    svg.classList.add("fx-grow");
    render(false);
    setTimeout(() => svg.classList.remove("fx-grow"), 2200);
    if (reduceMotion) return;
    setInterval(() => {
      if (!isShown(svg) || document.visibilityState !== "visible") return;
      data.shift();
      data.push(nextCandle());
      render(true);
    }, 2600);
  }

  // =====================================================================
  // 5. Таймер MCGS, капсулы KOMET, тележки, эквалайзер, сфера ИИ
  // =====================================================================
  function enhanceTimer(root) {
    const grad = root.querySelector("#ckTimerRingGrad");
    const svg = grad && grad.closest("svg");
    if (!svg || svg.dataset.fxTimer) return;
    svg.dataset.fxTimer = "1";
    const circles = svg.querySelectorAll("circle");
    if (circles[1]) circles[1].classList.add("fx-timer-progress");
    const ns = "http://www.w3.org/2000/svg";
    const defs = svg.querySelector("defs");
    defs.insertAdjacentHTML("beforeend", '<linearGradient id="fxCometGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="1"/></linearGradient>');
    const ticks = document.createElementNS(ns, "g");
    ticks.setAttribute("class", "fx-timer-ticks");
    let t = "";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, r1 = i % 5 === 0 ? 46.5 : 47.4, r2 = 49;
      t += `<line x1="${(50 + Math.cos(a) * r1).toFixed(2)}" y1="${(50 + Math.sin(a) * r1).toFixed(2)}" x2="${(50 + Math.cos(a) * r2).toFixed(2)}" y2="${(50 + Math.sin(a) * r2).toFixed(2)}" stroke="${i % 5 === 0 ? "rgba(125,211,252,0.55)" : "rgba(255,255,255,0.14)"}" stroke-width="${i % 5 === 0 ? 0.9 : 0.5}"/>`;
    }
    ticks.innerHTML = t;
    svg.insertBefore(ticks, defs.nextSibling);
    const comet = document.createElementNS(ns, "circle");
    comet.setAttribute("class", "fx-timer-comet");
    ["cx", "cy"].forEach((k) => comet.setAttribute(k, "50"));
    comet.setAttribute("r", "42");
    comet.setAttribute("fill", "none");
    comet.setAttribute("stroke", "#E0F2FE");
    comet.setAttribute("stroke-width", "2.4");
    comet.setAttribute("stroke-linecap", "round");
    comet.setAttribute("stroke-dasharray", "1 263");
    svg.appendChild(comet);
    // ореол кометы — второй, широкий и прозрачный штрих (без CSS-фильтра: SVG перерисовывается каждый кадр)
    const halo = comet.cloneNode();
    halo.setAttribute("stroke", "#22D3EE");
    halo.setAttribute("stroke-width", "7");
    halo.setAttribute("stroke-dasharray", "3 261");
    halo.setAttribute("stroke-dashoffset", "1");
    halo.setAttribute("opacity", "0.35");
    svg.insertBefore(halo, comet);
  }

  function enhanceKomet(root) {
    root.querySelectorAll(".ck-bar-body").forEach((body) => {
      if (body.querySelector(".fx-liquid")) return;
      const liq = document.createElement("div");
      liq.className = "fx-liquid";
      liq.innerHTML = Array.from({ length: 6 }, () =>
        `<span style="--x:${rand(15, 80).toFixed(0)}%;--s:${rand(2.5, 5.5).toFixed(1)}px;--t:${rand(2.2, 4.2).toFixed(2)}s;--d:${rand(0, 3).toFixed(2)}s;--w:${rand(-6, 6).toFixed(0)}px"></span>`).join("");
      body.insertBefore(liq, body.firstChild);
    });
  }

  function enhanceTrolleys(root) {
    const rows = root.querySelectorAll("#ckHabitRows > div");
    rows.forEach((row, ri) => {
      row.style.setProperty("--fx-row", String(ri));
      row.querySelectorAll(".ck-tr-circle").forEach((c, ci) => {
        c.style.setProperty("--fx-col", String(ci));
        c.style.setProperty("--fx-row", String(ri));
      });
    });
  }

  function enhanceOrb(root) {
    const orb = root.querySelector("#ckParticleOrb");
    if (!orb || orb.parentElement.classList.contains("fx-orb-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "fx-orb-wrap";
    orb.parentElement.insertBefore(wrap, orb);
    wrap.innerHTML = '<div class="fx-orb-glow"></div><div class="fx-orb-ring"></div><div class="fx-orb-ring r2"></div>';
    wrap.insertBefore(orb, wrap.children[1]);
    root.querySelectorAll(".ck-eq-bar-item").forEach((b, i) => b.style.setProperty("--fx-i", String(i)));
  }

  // =====================================================================
  // 6. Отклик: волна при нажатии, вспышка изменённых значений, счётчик прибыли
  // =====================================================================
  function enableRipples(root) {
    if (root.dataset.fxRipple) return;
    root.dataset.fxRipple = "1";
    root.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".ck-badge, .ck-sys-btn, .ck-bar-body, #ck-bento-root button");
      if (!el || reduceMotion) return;
      const cs = getComputedStyle(el);
      if (cs.position === "static") el.style.position = "relative";
      if (cs.overflow === "visible") el.style.overflow = "hidden";
      const r = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "fx-ripple";
      s.style.left = (e.clientX - r.left) + "px";
      s.style.top = (e.clientY - r.top) + "px";
      el.appendChild(s);
      setTimeout(() => s.remove(), 750);
    });
  }

  let countingUp = false;
  function watchValues(root) {
    const ids = ["ckHeroProfit", "ckHeroRoi", "ckWellRaw", "ckWellOut", "ckWellWater", "ckOutTxt", "ckWatTxt", "ckExYield", "ckPopTemp", "ckPopRh", "ckPopVpd", "ckHdrTempTxt", "ckHdrRhTxt", "ckTrolleysCnt", "ckPackName", "ckSaltTxt"];
    ids.forEach((id) => {
      const el = root.querySelector("#" + id);
      if (!el || el.dataset.fxWatch) return;
      el.dataset.fxWatch = "1";
      let prev = el.textContent;
      new MutationObserver(() => {
        if (countingUp && id === "ckHeroProfit") return;
        if (el.textContent === prev) return;
        prev = el.textContent;
        el.classList.remove("fx-flash");
        void el.offsetWidth;
        el.classList.add("fx-flash");
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  function countUpProfit(root) {
    const el = root.querySelector("#ckHeroProfit");
    if (!el || el.dataset.fxCounted || reduceMotion) return;
    el.dataset.fxCounted = "1";
    const target = el.textContent;
    const num = parseFloat(target.replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", "."));
    if (!isFinite(num) || num <= 0) return;
    const start = performance.now(), dur = 1700;
    let lastSet = target;
    countingUp = true;
    (function step(now) {
      // программа сама сменила сумму (другая фасовка, пересчёт) — уступаем ей
      if (el.textContent !== lastSet) { countingUp = false; return; }
      const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 4);
      lastSet = k < 1 ? "+" + Math.round(num * e).toLocaleString("ru-RU") + ".00 €" : target;
      el.textContent = lastSet;
      if (k < 1) requestAnimationFrame(step); else countingUp = false;
    })(start);
  }

  // =====================================================================
  // 7. Переключатель «3D LIVE» в карточке разреза (сам WebGL — js/chamber-twin-3d.js)
  // =====================================================================
  function mountLiveToggle(root) {
    const twinBtn = root.querySelector(".stage-3d .ck-twin-mode-btn");
    if (!twinBtn || twinBtn.parentElement.querySelector(".fx-mode-btn")) return;
    const btn = document.createElement("button");
    btn.className = "ck-badge fx-mode-btn";
    btn.type = "button";
    btn.title = "Живой 3D-двойник камеры: вращайте мышью, колесо — приближение";
    btn.style.cssText = "cursor:pointer; background:rgba(13,15,23,0.88) !important; border-color:rgba(45,212,191,0.5) !important; color:#5EEAD4 !important;";
    btn.innerHTML = "◆ 3D LIVE";
    const full = document.createElement("button");
    full.className = "ck-badge fx-full-btn";
    full.type = "button";
    full.title = "Во весь экран";
    full.style.cssText = "cursor:pointer; background:rgba(13,15,23,0.88) !important; border-color:rgba(96,165,250,0.4) !important; color:#93C5FD !important;";
    // у .ck-badge display задан с !important — прятать тоже только так
    full.style.setProperty("display", "none", "important");
    full.textContent = "⤢ Экран"; // ⛶ кокпит вырезает как эмодзи, ⤢ — нет
    twinBtn.after(btn, full);
    const stage = root.querySelector(".stage-3d .ck-photo-twin-stage");
    const host = stage && stage.parentElement;
    function setLive(on) {
      if (!window.ArmChamber3D || !host) return;
      const ok = on ? window.ArmChamber3D.show(host) : (window.ArmChamber3D.hide(), true);
      const live = on && ok;
      btn.classList.toggle("on", live);
      full.style.setProperty("display", live ? "inline-flex" : "none", "important");
      if (stage) stage.classList.toggle("fx-hidden-by-live", live);
      try { localStorage.setItem("JURMALCIEMS_FX_LIVE3D", live ? "1" : "0"); } catch (e) {}
    }
    btn.addEventListener("click", (e) => { e.stopPropagation(); setLive(!btn.classList.contains("on")); });
    full.addEventListener("click", (e) => {
      e.stopPropagation();
      const layer = host && host.querySelector(".fx-live3d-layer");
      if (layer && layer.requestFullscreen) layer.requestFullscreen().catch(() => {});
    });
    let saved = null;
    try { saved = localStorage.getItem("JURMALCIEMS_FX_LIVE3D"); } catch (e) {}
    if (saved === "1") setTimeout(() => setLive(true), 400);
  }

  // =====================================================================
  // Сборка: ждём, пока кокпит смонтируется (core-domain.js), и улучшаем его
  // =====================================================================
  function enhance() {
    const pane = document.getElementById("tab-scada");
    const root = document.getElementById("ck-bento-root");
    if (!pane || !root) return false;
    const first = !root.dataset.fxDone;
    root.dataset.fxDone = "1";
    if (first) {
      html.classList.add("fx-intro");
      setTimeout(() => html.classList.remove("fx-intro"), 2400);
    }
    mountAmbient(pane);
    enhanceCards(root);
    root.querySelectorAll(".ck-photo-twin-stage").forEach(mountLivingChamber);
    const candles = root.querySelector("#ckCandlesSvg");
    if (candles) mountLiveCandles(candles);
    enhanceTimer(root);
    enhanceKomet(root);
    enhanceTrolleys(root);
    enhanceOrb(root);
    enableRipples(root);
    watchValues(root);
    if (first) setTimeout(() => countUpProfit(root), 500);
    mountLiveToggle(root);
    return true;
  }

  let tries = 0;
  (function waitForCockpit() {
    if (enhance()) {
      // кокпит может перестроить части при переключениях — догоняем раз в несколько секунд
      setInterval(enhance, 4000);
      return;
    }
    if (++tries < 120) setTimeout(waitForCockpit, 250);
  })();

  window.ArmFx = { enhance, lite, telemetry, addTask, setPaused: (v) => { paused = !!v; } };
})();
