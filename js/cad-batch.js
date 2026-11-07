// ==========================================================================
// 🧊 CAD МАСТЕР-СХЕМА AIM AGHD-250ELC • ПАРТИЯ И ЖИВЫЕ ПОТОКИ
// 1) Под схемой — блок «Партия в камере» (общий модуль js/sim-batch.js):
//    вид, сырьё, паспорт по базе знаний, стеллаж 15 тележек, шкала часов 0→84.
// 2) На самой схеме: рыба в тележках окрашивается по виду и ходу сушки и
//    покачивается на прутках; заголовок зоны I показывает текущую партию;
//    поверх — слой частиц: воздух по камере и колонне AIM, туман испарения,
//    капли конденсата с V-испарителя, фреон по трубам, тёплый воздух термо-короба.
// Режимы «Сушка / Пауза / Финиш» меняют скорость, «Потоки 3D: ВЫКЛ» — гасит слой.
// Выключатель анимаций: ?fx=0
// ==========================================================================
/* global NODES_DB, currentNode, selectNode, isWinter */
(function () {
  "use strict";
  const B = window.ArmBatch;
  const board = document.getElementById("svgBoard");
  const svg = document.getElementById("master-svg");
  if (!B || !board || !svg) return;

  const FX = B.isOn();
  let hour = 26; // середина основной сушки — рыба уже золотится

  const stageOf = (h) => (h <= 12 ? 1 : h <= 38 ? 2 : h <= 72 ? 3 : 4);
  const STAGE_NAMES = ["", "Подвяливание", "Основная сушка", "Отволаживание", "Финиш"];

  // ---------- рыба на схеме: каждая тушка — отдельно, чтобы качалась сама по себе ----------
  const fishDef = svg.querySelector("#fishRow path");
  let fishPaths = [];
  if (fishDef) {
    const parts = fishDef.getAttribute("d").split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
    const g = fishDef.parentNode;
    fishDef.remove();
    parts.forEach((d, i) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "cad-fish");
      p.setAttribute("fill", "#F59E0B");
      p.setAttribute("fill-opacity", "0.88");
      p.setAttribute("stroke", "#FDE68A");
      p.setAttribute("stroke-width", "0.5");
      p.style.animationDelay = (-i * 0.53).toFixed(2) + "s";
      g.appendChild(p);
      fishPaths.push(p);
    });
  }

  const st = document.createElement("style");
  st.textContent = `
    #master-svg .cad-fish { transform-box: fill-box; transform-origin: 50% 0; animation: cadFishSway 3.4s ease-in-out infinite; transition: fill 0.8s ease; }
    @keyframes cadFishSway { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
    #svgBoard.flow-paused .cad-fish { animation-play-state: paused; }
    #cadFxCanvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
    #svgBoard.flow-paused #cadFxCanvas { display: none; }
    .sb-wrap { margin: 0 auto; }
    @media print { #cadFxCanvas, .sb-wrap { display: none !important; } }
    @media (prefers-reduced-motion: reduce) { #master-svg .cad-fish { animation: none; } }
  `;
  document.head.appendChild(st);

  // заголовок зоны I
  const zoneTitle = Array.from(svg.querySelectorAll("text")).find((t) => /^ЗОНА 15 ТЕЛЕЖЕК/.test(t.textContent.trim()));

  function syncSvg(s) {
    const look = B.LOOK[s.sp] || B.LOOK.vimba;
    const t = Math.min(1, s.prog * 1.05);
    const col = B.mix(look.tint, "#D97706", t);
    const edge = B.mix(look.belly, "#FDE68A", t);
    fishPaths.forEach((p) => { p.setAttribute("fill", col); p.setAttribute("stroke", edge); });
    if (zoneTitle) {
      const name = s.c ? s.c.shortRu.toUpperCase() : s.sp.toUpperCase();
      zoneTitle.textContent = `ПАРТИЯ: ${name} • ${s.raw.toLocaleString("ru-RU")} кг • ${s.trolleys} ИЗ 15 ТЕЛЕЖЕК • ${hour} ч (${STAGE_NAMES[stageOf(hour)]})`;
    }
    const passLoad = document.getElementById("svgPassLoad");
    if (passLoad) {
      const spShort = s.c ? s.c.shortRu : s.sp;
      passLoad.textContent = `• Загрузка (${spShort}): ${s.raw.toLocaleString("ru-RU")} кг (${s.trolleys} из 15 тел.)`;
    }
    const passWater = document.getElementById("svgPassWater");
    if (passWater) {
      passWater.textContent = `• Влагосъем: до 75 л/ч (${Math.round(s.water).toLocaleString("ru-RU")} л за цикл)`;
    }
    // узел [2] инспектора — про текущую партию
    if (typeof NODES_DB !== "undefined" && NODES_DB[2]) {
      const now = Math.round(s.water * s.prog);
      NODES_DB[2].metric = `${s.raw.toLocaleString("ru-RU")} кг • ${s.trolleys}/15 тел.`;
      NODES_DB[2].desc = `Партия: ${s.c ? s.c.titleRu : s.sp}, ${s.raw.toLocaleString("ru-RU")} кг сырья на ${s.trolleys} тележках по ${s.cap} кг. ` +
        `К ${hour} ч ушло ≈ ${now} л воды из ${Math.round(s.water)} л; к финишу ≈ ${Math.round(s.raw * s.yieldPct / 100).toLocaleString("ru-RU")} кг готовой (выход ${s.yieldPct.toFixed(1)}%). ` +
        `Пленум разгона 70 см слева и буфер 50 см справа исключают байпас воздуха мимо продукта.`;
      NODES_DB[2].grains = Math.max(1, Math.round(15 * s.trolleys / 15));
      if (typeof currentNode !== "undefined" && currentNode === 2 && typeof selectNode === "function") selectNode(2);
    }
  }

  B.mount({
    source: "cad-master",
    after: board,
    sweepHost: board,
    controls: true,
    getHour: () => hour,
    setHour(h) { hour = h; B.render(); },
    getStage: () => stageOf(hour),
    getAirT: () => parseFloat(((document.getElementById("hdrClimVal") || {}).textContent || "").replace(",", ".").match(/-?[\d.]+/)),
    onRender: syncSvg,
    onTrolley(t) {
      if (typeof selectNode === "function") selectNode(2);
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set("inspTitle", `[2] Тележка №${t.n} • Ряд ${t.rowName} — ${t.title}`);
      set("inspDesc", t.desc);
      set("inspMetricTxt", `${t.moist}% влага • ${t.waterGone} л ушло • ${t.finalKg} кг готовой`);
      const bar = document.getElementById("inspGrainBar");
      if (bar) bar.innerHTML = Array.from({ length: 15 }, (_, i) => `<span class="grain-dot ${i < Math.round((t.moist / 80) * 15) ? "amber" : ""}"></span>`).join("");
      const insp = document.querySelector(".hud-inspector-bar");
      if (insp) insp.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });

  // ---------- слой частиц поверх схемы (координаты — как у SVG 1800×830) ----------
  if (!FX) return;
  const cv = document.createElement("canvas");
  cv.id = "cadFxCanvas";
  cv.width = 1800; cv.height = 830;
  board.appendChild(cv);
  const ctx = cv.getContext("2d");

  function sprite(rgb, r) {
    const s = document.createElement("canvas");
    s.width = s.height = r * 2;
    const g = s.getContext("2d");
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, `rgba(${rgb},0.95)`); gr.addColorStop(0.35, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    return s;
  }
  const S = {
    warm: sprite("251,191,36", 10), air: sprite("186,230,253", 10), cold: sprite("56,189,248", 10),
    humid: sprite("226,232,240", 10), hot: sprite("248,113,113", 10), liq: sprite("253,224,71", 10),
    mist: sprite("220,240,255", 26), teal: sprite("45,212,191", 12),
  };

  // маршруты воздуха (ломаные в координатах схемы)
  const AIR = [
    // подача: из колонны AIM по верху камеры влево, вниз по пленуму, сквозь тележки вправо, к всасыванию
    { pts: [[860, 200], [560, 205], [110, 205], [62, 260], [62, 690], [95, 700]], spr: "warm", n: 7, sp: 0.0035 },
    { pts: [[860, 225], [560, 222], [120, 222], [70, 300], [70, 420], [110, 428], [540, 432], [575, 720], [600, 760]], spr: "warm", n: 8, sp: 0.003 },
    { pts: [[75, 520], [110, 561], [540, 565], [575, 740], [620, 780]], spr: "air", n: 6, sp: 0.004 },
    { pts: [[75, 600], [110, 650], [540, 650], [580, 770], [640, 790]], spr: "air", n: 5, sp: 0.004 },
    // колонна AIM: снизу вверх — влажный → холодный после V-испарителя → тёплый после догрева
    { pts: [[620, 790], [640, 700], [650, 600], [650, 470], [655, 360], [660, 250], [700, 160], [860, 200]], spr: "col", n: 8, sp: 0.0035 },
    { pts: [[760, 790], [770, 700], [780, 600], [790, 470], [800, 360], [810, 250], [830, 170], [860, 205]], spr: "col", n: 8, sp: 0.0035 },
  ];
  AIR.forEach((r) => {
    let L = 0; r.seg = [];
    for (let i = 1; i < r.pts.length; i++) { const d = Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]); r.seg.push(d); L += d; }
    r.len = L;
    r.dots = Array.from({ length: r.n }, (_, i) => ({ t: i / r.n + Math.random() * 0.05 }));
  });
  function at(r, t) {
    let d = t * r.len;
    for (let i = 0; i < r.seg.length; i++) {
      if (d <= r.seg[i]) { const f = d / r.seg[i], a = r.pts[i], b = r.pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      d -= r.seg[i];
    }
    return r.pts[r.pts.length - 1];
  }

  // фреон: точки по трубам с бегущей штриховкой (их цвет берём у трубы под ней)
  const PIPES = Array.from(svg.querySelectorAll("path.flow-anim")).map((p) => {
    let len = 0;
    try { len = p.getTotalLength(); } catch (e) {}
    if (!len) return null;
    const base = (p.previousElementSibling && p.previousElementSibling.getAttribute("stroke")) || "";
    const spr = /EF4444/i.test(base) ? S.hot : /0284C7/i.test(base) ? S.cold : S.liq;
    const pts = [];
    for (let i = 0; i <= 90; i++) { const q = p.getPointAtLength((len * i) / 90); pts.push([q.x, q.y]); }
    const n = Math.max(3, Math.round(len / 120));
    return { pts, spr, dots: Array.from({ length: n }, (_, i) => ({ t: i / n })) };
  }).filter(Boolean);

  // туман над тележками
  const mist = Array.from({ length: 46 }, () => resetMist({}, true));
  function resetMist(m, init) {
    m.x = 110 + Math.random() * 430; m.y = 380 + Math.random() * 300;
    m.life = init ? Math.random() : 0; m.sp = 0.004 + Math.random() * 0.004;
    m.vx = 0.4 + Math.random() * 0.5; m.vy = -(0.12 + Math.random() * 0.2); m.s = 16 + Math.random() * 26;
    return m;
  }
  // капли конденсата: с низа V-испарителя в поддон
  const drops = Array.from({ length: 18 }, () => resetDrop({}, true));
  function resetDrop(d, init) {
    d.x = 592 + Math.random() * 228; d.y = init ? 664 + Math.random() * 30 : 664; d.vy = 0.3 + Math.random() * 0.4;
    d.wait = init ? Math.random() * 40 : Math.random() * 30;
    return d;
  }
  const ripples = [];

  function modeK() {
    if (document.getElementById("btnPause18")?.classList.contains("active")) return 0.3;
    if (document.getElementById("btnFinish25")?.classList.contains("active")) return 0.62;
    return 1;
  }

  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden || t - last < 30 || board.classList.contains("flow-paused")) return;
    last = t;
    const k = modeK();
    const stg = stageOf(hour);
    const wet = stg === 1 ? 1 : stg === 2 ? 0.72 : stg === 3 ? 0.4 : 0.18; // сколько влаги ещё уходит
    ctx.clearRect(0, 0, 1800, 830);

    // тёплое свечение над рыбой
    const br = 0.5 + 0.5 * Math.sin(t / 1700);
    const gl = ctx.createRadialGradient(330, 520, 30, 330, 520, 300);
    gl.addColorStop(0, `rgba(251,191,36,${0.05 + 0.04 * br})`); gl.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = gl; ctx.fillRect(40, 220, 580, 560);

    ctx.globalCompositeOperation = "lighter";
    // туман испарения
    const mc = Math.round(mist.length * wet);
    for (let i = 0; i < mc; i++) {
      const m = mist[i];
      m.life += m.sp; m.x += m.vx * k; m.y += m.vy;
      if (m.life >= 1 || m.x > 560) resetMist(m, false);
      ctx.globalAlpha = Math.sin(m.life * Math.PI) * 0.2;
      ctx.drawImage(S.mist, m.x - m.s, m.y - m.s, m.s * 2, m.s * 2);
    }
    // воздух
    AIR.forEach((r) => {
      r.dots.forEach((d) => {
        d.t = (d.t + r.sp * (0.35 + 0.65 * k)) % 1;
        const [x, y] = at(r, d.t);
        let spr = S[r.spr] || S.air;
        if (r.spr === "col") spr = y > 664 ? S.humid : y > 460 ? S.cold : S.warm;
        ctx.globalAlpha = 0.85 * Math.min(1, Math.sin(d.t * Math.PI) * 3);
        ctx.drawImage(spr, x - 9, y - 9, 18, 18);
      });
    });
    // фреон
    PIPES.forEach((p) => {
      p.dots.forEach((d) => {
        d.t = (d.t + 0.004 * (0.4 + 0.6 * k)) % 1;
        const f = d.t * (p.pts.length - 1), i = Math.floor(f), fr = f - i;
        const a = p.pts[i], b = p.pts[Math.min(p.pts.length - 1, i + 1)];
        ctx.globalAlpha = 0.95;
        ctx.drawImage(p.spr, a[0] + (b[0] - a[0]) * fr - 8, a[1] + (b[1] - a[1]) * fr - 8, 16, 16);
      });
    });
    // термо-короб: зимой тёплый воздух уходит в цех (влево к стене), летом — наружу вверх
    const winter = typeof isWinter === "undefined" ? true : isWinter;
    for (let i = 0; i < 6; i++) {
      const ph = ((t / 2600) + i / 6) % 1;
      const x0 = i % 2 ? 1664 : 1588;
      const x = winter ? x0 - ph * 150 : x0 + Math.sin(ph * 6 + i) * 6;
      const y = winter ? 219 + Math.sin(ph * 5 + i) * 10 : 219 - ph * 120;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.5;
      ctx.drawImage(winter ? S.warm : S.hot, x - 12, y - 12, 24, 24);
    }
    ctx.globalCompositeOperation = "source-over";

    // капли конденсата и круги в поддоне — частота по этапу и режиму
    const dc = Math.max(3, Math.round(drops.length * wet * (0.3 + 0.7 * k)));
    ctx.fillStyle = "rgba(125,211,252,0.9)";
    for (let i = 0; i < dc; i++) {
      const d = drops[i];
      if (d.wait > 0) { d.wait -= 1; continue; }
      d.vy += 0.25; d.y += d.vy;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.ellipse(d.x, d.y, 1.6, 2.6 + d.vy * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      if (d.y >= 698) { ripples.push({ x: d.x, r: 1, a: 0.8 }); resetDrop(d, false); }
    }
    ctx.strokeStyle = "#7DD3FC"; ctx.lineWidth = 1;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]; r.r += 0.5; r.a -= 0.04;
      if (r.a <= 0) { ripples.splice(i, 1); continue; }
      ctx.globalAlpha = r.a;
      ctx.beginPath(); ctx.ellipse(r.x, 703, r.r * 1.8, r.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();
