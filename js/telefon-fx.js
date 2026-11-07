// ==========================================================================
// 📱 TELEFON FX — оживление телефонной версии (telefon.html)
// Слой поверх дизайна: живой фон, 3D-появление и наклон карточек, рисующиеся
// волны климата, наполняющиеся кольца, поток воздуха / фреона / конденсата
// на схеме камеры, волна от пальца на кнопках, «капля» в нижнем доке.
// Логику программы не трогает. Выключатель: ?fx=0  →  window.ArmTelFx
// ==========================================================================
(function () {
  "use strict";

  if (/[?&]fx=0\b/.test(location.search)) return;

  const doc = document;
  const root = doc.documentElement;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("tfx");

  function svgEl(tag, attrs, parent) {
    const el = doc.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function onceAnim(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener("animationend", function done() {
      el.classList.remove(cls);
      el.removeEventListener("animationend", done);
    });
  }

  // ---------- 1. Живой фон ----------
  let dust = null;

  function buildAmbient() {
    if (doc.getElementById("tfx-ambient")) return;
    const amb = doc.createElement("div");
    amb.id = "tfx-ambient";
    amb.setAttribute("aria-hidden", "true");
    amb.innerHTML =
      '<div class="tfx-aurora a1"></div><div class="tfx-aurora a2"></div>' +
      '<div class="tfx-aurora a3"></div><div class="tfx-floor"></div>';
    doc.body.insertBefore(amb, doc.body.firstChild);
    if (!reduced) dust = startDust(amb);
  }

  // Пылинки / водяная взвесь: 34 точки, один rAF, ~30 кадров/с, стоп при скрытой вкладке
  function startDust(host) {
    const cv = doc.createElement("canvas");
    host.appendChild(cv);
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0;
    const parts = [];

    // заранее нарисованный «светлячок» — дешевле, чем shadowBlur
    const spr = doc.createElement("canvas");
    spr.width = spr.height = 32;
    const sc = spr.getContext("2d");
    const g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(180,240,255,0.9)");
    g.addColorStop(0.25, "rgba(0,229,255,0.35)");
    g.addColorStop(1, "rgba(0,229,255,0)");
    sc.fillStyle = g;
    sc.fillRect(0, 0, 32, 32);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    for (let i = 0; i < 34; i++) {
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 4 + Math.random() * 9,
        vy: -(0.08 + Math.random() * 0.25),
        vx: (Math.random() - 0.5) * 0.12,
        ph: Math.random() * Math.PI * 2,
        a: 0.25 + Math.random() * 0.5
      });
    }

    let last = 0, raf = 0, running = true;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return;
      const dt = Math.min(3, (t - last) / 16.7);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.ph += 0.02 * dt;
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(p.ph) * 0.15) * dt;
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.ph * 1.7));
        ctx.drawImage(spr, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    }
    raf = requestAnimationFrame(frame);

    function setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) { last = 0; raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    }
    doc.addEventListener("visibilitychange", () => setRunning(!doc.hidden));
    return { setRunning };
  }

  // ---------- 2. Верхняя панель ----------
  function decorateTopBar() {
    // значок бренда — живая неоновая рыба вместо эмодзи
    const icon = doc.querySelector(".mob-brand-icon");
    if (icon && window.ArmFish && !icon.querySelector("svg")) {
      icon.innerHTML = window.ArmFish.svg({ size: 26, mini: true });
      icon.classList.add("tfx-emblem");
      icon.title = "Юрмалциемс";
    }
    const bar = doc.querySelector(".mob-top-bar");
    if (bar && !bar.querySelector(".tfx-scanbeam")) {
      const beam = doc.createElement("span");
      beam.className = "tfx-scanbeam";
      bar.appendChild(beam);
    }
  }

  // ---------- 3. Карточки: появление, блик, наклон ----------
  const CARD_SEL = ".bento-card-blue, .bento-card-gold, .mob-card, .sp-hub-card, .trade-tool-card, .trade-kpi-card, .mem-card";
  let revealIO = null;

  function prepCard(card) {
    if (card.dataset.tfx) return;
    card.dataset.tfx = "1";
    card.classList.add("tfx-card");
    if (getComputedStyle(card).position === "static") card.style.position = "relative";

    const sheen = doc.createElement("span");
    sheen.className = "tfx-sheen";
    sheen.setAttribute("aria-hidden", "true");
    const glare = doc.createElement("span");
    glare.className = "tfx-glare";
    glare.setAttribute("aria-hidden", "true");
    card.appendChild(sheen);
    card.appendChild(glare);

    // Появление — только для карточек ниже первого экрана, чтобы старт был мгновенным
    if (!reduced && revealIO) {
      const r = card.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.9 || r.height === 0) {
        card.classList.add("tfx-pre");
        revealIO.observe(card);
      } else {
        card.classList.add("tfx-shine");
      }
    }
    bindTilt(card);
  }

  function reveal(card) {
    card.classList.add("tfx-in");
    const clear = (e) => {
      if (e && e.target !== card) return;
      card.classList.remove("tfx-pre", "tfx-in");
      card.removeEventListener("transitionend", clear);
    };
    card.addEventListener("transitionend", clear);
    setTimeout(clear, 1200);
    if (card.querySelector(".tfx-wave-line")) drawClimate(card);
  }

  function bindTilt(card) {
    if (reduced) return;
    let raf = 0, px = 0, py = 0, active = false;
    function apply() {
      raf = 0;
      const r = card.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (px - r.left) / r.width));
      const ny = Math.min(1, Math.max(0, (py - r.top) / r.height));
      // большие карточки наклоняем меньше, чтобы не «плыло»
      const k = r.height > 360 ? 2.5 : 5;
      card.style.setProperty("--tfx-ry", ((nx - 0.5) * k).toFixed(2) + "deg");
      card.style.setProperty("--tfx-rx", ((0.5 - ny) * k).toFixed(2) + "deg");
      card.style.setProperty("--tfx-gx", (nx * 100).toFixed(1) + "%");
      card.style.setProperty("--tfx-gy", (ny * 100).toFixed(1) + "%");
    }
    function start(e) {
      if (e.pointerType === "mouse" && e.buttons !== 1) return;
      // ползунки и поля ввода не наклоняем
      if (e.target.closest("input, select, textarea, svg, .tfx-no-tilt")) return;
      active = true;
      px = e.clientX; py = e.clientY;
      card.classList.remove("tfx-untilt");
      card.classList.add("tfx-tilting");
      apply();
    }
    function move(e) {
      if (!active) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }
    function end() {
      if (!active) return;
      active = false;
      card.classList.remove("tfx-tilting");
      card.classList.add("tfx-untilt");
      setTimeout(() => card.classList.remove("tfx-untilt"), 520);
    }
    card.addEventListener("pointerdown", start, { passive: true });
    card.addEventListener("pointermove", move, { passive: true });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => card.addEventListener(ev, end, { passive: true }));
  }

  function scanCards() {
    doc.querySelectorAll(CARD_SEL).forEach(prepCard);
  }

  // ---------- 4. Климат: волны, кольца, цифры ----------
  function enhanceClimate() {
    const temp = doc.getElementById("mob-bento-temp");
    const card = temp && temp.closest(".bento-card-blue");
    if (!card || card.dataset.tfxClimate) return;
    card.dataset.tfxClimate = "1";

    const svg = card.querySelector('svg[viewBox="0 0 260 50"]');
    if (svg) {
      const paths = svg.querySelectorAll("path");
      paths.forEach((p) => {
        if (p.getAttribute("fill") === "none") {
          p.classList.add("tfx-wave-line");
          let len = 400;
          try { len = Math.ceil(p.getTotalLength()) + 2; } catch (e) {}
          p.style.setProperty("--tfx-len", len);
          // мягкое свечение линии — широкая полупрозрачная копия под ней
          const glow = p.cloneNode(false);
          glow.removeAttribute("id");
          glow.setAttribute("stroke-width", "6");
          glow.setAttribute("stroke-opacity", "0.18");
          glow.setAttribute("stroke-linecap", "round");
          p.parentNode.insertBefore(glow, p);
          // светящаяся точка, бегущая по линии
          const dot = svgEl("circle", { r: "2.6", fill: "#FFFFFF", opacity: "0.95" }, svg);
          const halo = svgEl("circle", { r: "6", fill: p.getAttribute("stroke"), opacity: "0.35" }, svg);
          [halo, dot].forEach((c, i) => {
            const am = svgEl("animateMotion", {
              dur: "5.2s",
              repeatCount: "indefinite",
              path: p.getAttribute("d"),
              begin: p.getAttribute("stroke") === "#A78BFA" ? "-2.6s" : "0s"
            }, c);
            am.setAttribute("rotate", "0");
          });
        } else {
          p.classList.add("tfx-wave-area");
        }
      });
      // вертикальная линия-сканер
      const defs = svgEl("defs", {}, svg);
      const lg = svgEl("linearGradient", { id: "tfxScanGrad", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
      svgEl("stop", { offset: "0", "stop-color": "#00E5FF", "stop-opacity": "0" }, lg);
      svgEl("stop", { offset: "0.85", "stop-color": "#00E5FF", "stop-opacity": "0.16" }, lg);
      svgEl("stop", { offset: "1", "stop-color": "#00E5FF", "stop-opacity": "0" }, lg);
      svgEl("rect", { x: "0", y: "0", width: "10", height: "50", fill: "url(#tfxScanGrad)", class: "tfx-wave-scan" }, svg);
    }

    // кольца: наполняются с нуля, вокруг — дышащий ореол
    [["mob-bento-vpd-ring", "rgba(245,158,11,0.45)"], ["mob-bento-pwr-ring", "rgba(16,185,129,0.45)"]].forEach(([id, c]) => {
      const ring = doc.getElementById(id);
      if (!ring) return;
      const box = ring.closest("svg") && ring.closest("svg").parentElement;
      if (box) {
        box.classList.add("tfx-ring");
        box.style.setProperty("--tfx-ring-c", c);
      }
      if (!reduced) {
        const target = ring.getAttribute("stroke-dasharray");
        ring.dataset.tfxTarget = target;
        ring.setAttribute("stroke-dasharray", "0, 100");
      }
    });

    const r = card.getBoundingClientRect();
    if (reduced || r.top < window.innerHeight * 0.9 && r.height > 0) drawClimate(card);
    else if (!card.classList.contains("tfx-pre")) {
      const io = new IntersectionObserver((ents) => {
        if (ents.some((e) => e.isIntersecting)) { io.disconnect(); drawClimate(card); }
      }, { threshold: 0.2 });
      io.observe(card);
    }
  }

  function drawClimate(card) {
    if (card.dataset.tfxDrawn) return;
    card.dataset.tfxDrawn = "1";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.classList.add("tfx-drawn");
      ["mob-bento-vpd-ring", "mob-bento-pwr-ring"].forEach((id) => {
        const ring = doc.getElementById(id);
        // если программа уже успела выставить новое значение — его и оставляем
        if (ring && ring.dataset.tfxTarget && ring.getAttribute("stroke-dasharray") === "0, 100") {
          ring.setAttribute("stroke-dasharray", ring.dataset.tfxTarget);
        }
      });
      countUp(doc.getElementById("mob-bento-temp"));
      countUp(doc.getElementById("mob-bento-rh"));
    }));
  }

  // Счётчик: «набегает» к реальному числу, формат строки сохраняется
  const counting = new WeakSet();
  function countUp(el) {
    if (!el || reduced) return;
    const txt = el.textContent;
    const m = txt.match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return;
    const target = parseFloat(m[0].replace(",", "."));
    const dec = (m[0].split(/[.,]/)[1] || "").length;
    const pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
    const from = target * 0.6;
    const t0 = performance.now(), dur = 1100;
    counting.add(el);
    let written = txt;
    function step(t) {
      // программа сама поменяла текст — уступаем ей
      if (el.textContent !== written) { counting.delete(el); return; }
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      written = k < 1 ? pre + (from + (target - from) * e).toFixed(dec) + post : txt;
      el.textContent = written;
      if (k < 1) requestAnimationFrame(step);
      else counting.delete(el);
    }
    requestAnimationFrame(step);
  }

  // Вспышка у цифр при обновлении значения
  const FLASH_IDS = ["mob-bento-temp", "mob-bento-rh", "mob-bento-vpd", "mob-bento-pwr", "mob-bento-press", "mob-bento-speed",
    "mob-slider-temp-val", "mob-slider-rh-val"];
  function watchNumbers() {
    const mo = new MutationObserver((list) => {
      const seen = new Set();
      for (const rec of list) {
        const el = rec.target.nodeType === 3 ? rec.target.parentElement : rec.target;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        if (counting.has(el)) continue;
        // при перетаскивании ползунка не мигаем каждый кадр
        if (el._tfxT && performance.now() - el._tfxT < 450) continue;
        el._tfxT = performance.now();
        onceAnim(el, "tfx-flash");
      }
    });
    const opts = { childList: true, characterData: true, subtree: true };
    FLASH_IDS.forEach((id) => { const el = doc.getElementById(id); if (el) mo.observe(el, opts); });
    doc.querySelectorAll(".sp-box-val").forEach((el) => mo.observe(el, opts));
  }

  // ---------- 5. Схема камеры ----------
  function enhanceChamber() {
    const svg = doc.querySelector('#tech-pane-ct-scada svg[viewBox="0 0 620 220"]');
    if (!svg || svg.dataset.tfx) return;
    svg.dataset.tfx = "1";

    const defs = svg.querySelector("defs") || svgEl("defs", {}, svg);
    // объём тележек: свет сверху, тень снизу
    const top = svgEl("linearGradient", { id: "tfxTrolleyLight", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
    svgEl("stop", { offset: "0", "stop-color": "#FFFFFF", "stop-opacity": "0.16" }, top);
    svgEl("stop", { offset: "0.35", "stop-color": "#FFFFFF", "stop-opacity": "0.02" }, top);
    svgEl("stop", { offset: "1", "stop-color": "#000000", "stop-opacity": "0.35" }, top);
    const shadow = svgEl("radialGradient", { id: "tfxShadow", cx: "0.5", cy: "0.5", r: "0.5" }, defs);
    svgEl("stop", { offset: "0", "stop-color": "#000000", "stop-opacity": "0.75" }, shadow);
    svgEl("stop", { offset: "1", "stop-color": "#000000", "stop-opacity": "0" }, shadow);
    const sweep = svgEl("linearGradient", { id: "tfxSweepGrad", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
    svgEl("stop", { offset: "0", "stop-color": "#FFF7D6", "stop-opacity": "0" }, sweep);
    svgEl("stop", { offset: "0.5", "stop-color": "#FFF7D6", "stop-opacity": "0.22" }, sweep);
    svgEl("stop", { offset: "1", "stop-color": "#FFF7D6", "stop-opacity": "0" }, sweep);
    const hub = svgEl("radialGradient", { id: "tfxHub", cx: "0.35", cy: "0.35", r: "0.7" }, defs);
    svgEl("stop", { offset: "0", "stop-color": "#FFFFFF" }, hub);
    svgEl("stop", { offset: "0.5", "stop-color": "#94A3B8" }, hub);
    svgEl("stop", { offset: "1", "stop-color": "#1E293B" }, hub);
    const coilGlow = svgEl("radialGradient", { id: "tfxCoilGlow", cx: "0.5", cy: "0.5", r: "0.5" }, defs);
    svgEl("stop", { offset: "0", "stop-color": "#38BDF8", "stop-opacity": "0.55" }, coilGlow);
    svgEl("stop", { offset: "1", "stop-color": "#38BDF8", "stop-opacity": "0" }, coilGlow);
    const trolleyClip = svgEl("clipPath", { id: "tfxTrolleyClip" }, defs);

    // тележки
    const trolleys = Array.from(svg.children).filter((g) => g.tagName === "g" && /translate\((180|234|288|342|396),\s*(32|80|128)\)/.test(g.getAttribute("transform") || ""));
    trolleys.forEach((g) => {
      const m = g.getAttribute("transform").match(/translate\((\d+),\s*(\d+)\)/);
      const x = +m[1], y = +m[2];
      // тень на полу под тележкой (вставляем под неё)
      const sh = svgEl("ellipse", { cx: x + 24, cy: y + 44, rx: 26, ry: 4, fill: "url(#tfxShadow)" });
      svg.insertBefore(sh, g);
      svgEl("rect", { x: "0", y: "0", width: "48", height: "42", rx: "3", fill: "url(#tfxTrolleyLight)", "pointer-events": "none" }, g);
      svgEl("rect", { x: x, y: y, width: "48", height: "42", rx: "3" }, trolleyClip);
    });

    // ступица вентиляторов — металл, вокруг — пульсирующее кольцо
    svg.querySelectorAll("g.anim-fan-spin").forEach((fan, i) => {
      const hubC = fan.querySelector("circle");
      if (hubC) hubC.setAttribute("fill", "url(#tfxHub)");
      const host = fan.parentNode;
      const ringC = host.querySelector("circle");
      const arrow = host.querySelector("polygon");
      const col = arrow ? arrow.getAttribute("fill") : "#38BDF8";
      const pulse = svgEl("circle", { cx: "0", cy: "0", r: "28", fill: "none", stroke: col, "stroke-width": "1.5", class: "tfx-pulse-soft" });
      pulse.style.animationDelay = (i * 0.6) + "s";
      host.insertBefore(pulse, ringC.nextSibling);
    });

    // слой потока поверх тележек
    const flow = svgEl("g", { "pointer-events": "none" });
    const coilG = Array.from(svg.children).find((g) => (g.getAttribute("transform") || "").indexOf("translate(460, 30)") === 0);
    svg.insertBefore(flow, coilG || null);

    // линии тока воздуха — в проходах между рядами тележек
    [[28, "#00E5FF", ""], [77, "#00E5FF", ""], [125, "#00E5FF", ""], [174, "#00E5FF", "slow"]].forEach(([y, c, sp]) => {
      svgEl("path", {
        d: `M 150,${y} C 220,${y - 3} 300,${y + 3} 380,${y - 2} S 440,${y + 2} 456,${y}`,
        fill: "none", stroke: c, "stroke-width": "1.2", "stroke-opacity": "0.55", "stroke-linecap": "round",
        class: "tfx-flow-dash " + sp
      }, flow);
    });

    // частицы воздуха (летят от турбин через тележки к змеевику)
    const lanes = [28, 52, 77, 101, 125, 149, 174];
    lanes.forEach((y, li) => {
      for (let k = 0; k < 2; k++) {
        const c = svgEl("circle", { cx: 148, cy: y + (k ? 3 : -2), r: k ? 1.4 : 2, fill: k ? "#BAF4FF" : "#00E5FF", class: "tfx-air" }, flow);
        const dur = 2.1 + ((li * 7 + k * 3) % 5) * 0.25;
        c.style.setProperty("--tfx-dur", dur + "s");
        c.style.setProperty("--tfx-delay", (-(li * 0.37 + k * dur / 2)).toFixed(2) + "s");
        c.style.setProperty("--tfx-dist", "306px");
      }
    });

    // световой блик, проходящий по рыбе (только в пределах тележек)
    // клип — на группе, иначе он уезжал бы вместе с анимированным прямоугольником
    const sweepG = svgEl("g", { "clip-path": "url(#tfxTrolleyClip)" }, flow);
    svgEl("rect", { x: "60", y: "28", width: "70", height: "146", fill: "url(#tfxSweepGrad)", class: "tfx-light-sweep" }, sweepG);

    // змеевик: свечение и бегущий хладагент
    if (coilG) {
      const glow = svgEl("ellipse", { cx: "17", cy: "70", rx: "34", ry: "86", fill: "url(#tfxCoilGlow)", class: "tfx-pulse-soft" });
      coilG.insertBefore(glow, coilG.firstChild);
      const coilPath = coilG.querySelector("path");
      if (coilPath) {
        const f = svgEl("path", { d: coilPath.getAttribute("d"), fill: "none", stroke: "#FDE68A", "stroke-width": "1.2", "stroke-linecap": "round", class: "tfx-coil-flow" }, coilG);
        f.setAttribute("stroke-opacity", "0.9");
      }
      // трубка слива конденсата к колбе
      svgEl("path", { d: "M 494,62 L 528,62 L 528,76", fill: "none", stroke: "#253F5E", "stroke-width": "2", "stroke-linejoin": "round" }, svg);
    }

    // колба: капли сверху и волна на поверхности воды
    const flask = Array.from(svg.children).find((g) => (g.getAttribute("transform") || "").indexOf("translate(515, 80)") === 0);
    if (flask) {
      const fclip = svgEl("clipPath", { id: "tfxFlaskClip" }, defs);
      svgEl("path", { d: "M 1,16 L 25,16 L 25,54 Q 25,59 13,59 Q 1,59 1,54 Z" }, fclip);
      const wave = svgEl("g", { "clip-path": "url(#tfxFlaskClip)" });
      const liquid = flask.querySelector("path");
      flask.insertBefore(wave, liquid ? liquid.nextSibling : null);
      svgEl("path", {
        d: "M -24,22 q 6,-3 12,0 t 12,0 t 12,0 t 12,0 t 12,0 t 12,0 L 48,30 L -24,30 Z",
        fill: "#A5F3FC", opacity: "0.55", class: "tfx-liquid-wave"
      }, wave);
      // пузырьки
      for (let i = 0; i < 3; i++) {
        const b = svgEl("circle", { cx: 6 + i * 7, cy: 54, r: 1.1, fill: "#E0FFFF", opacity: "0.8" }, wave);
        svgEl("animate", { attributeName: "cy", values: "56;24", dur: (2.4 + i * 0.7) + "s", begin: (-i * 0.9) + "s", repeatCount: "indefinite" }, b);
        svgEl("animate", { attributeName: "opacity", values: "0;0.9;0", dur: (2.4 + i * 0.7) + "s", begin: (-i * 0.9) + "s", repeatCount: "indefinite" }, b);
      }
      for (let i = 0; i < 2; i++) {
        const d = svgEl("ellipse", { cx: "13", cy: "-4", rx: "1.6", ry: "2.4", fill: "#67E8F9", class: "tfx-drip" }, flask);
        d.style.setProperty("--tfx-delay", (-i * 0.95) + "s");
      }
    }

    // фреон: бегущий поток + пульсирующие узлы (горячий / холодный)
    const freon = Array.from(svg.querySelectorAll(":scope > path")).find((p) => (p.getAttribute("d") || "").indexOf("M 60,186") === 0);
    if (freon) {
      const f = svgEl("path", { d: freon.getAttribute("d"), fill: "none", stroke: "#38BDF8", "stroke-width": "1.4", "stroke-opacity": "0.85", "stroke-linecap": "round", class: "tfx-freon-flow" });
      svg.insertBefore(f, freon.nextSibling);
      [[270, "#EF4444"], [380, "#38BDF8"]].forEach(([cx, col], i) => {
        const p = svgEl("circle", { cx: cx, cy: 198, r: 3.5, fill: "none", stroke: col, "stroke-width": "1.2", class: "tfx-node-pulse" });
        p.style.animationDelay = (i * 0.9) + "s";
        svg.insertBefore(p, f.nextSibling);
      });
    }

    // лёгкие «сканлайны» монитора поверх схемы
    const pat = svgEl("pattern", { id: "tfxScan", width: "4", height: "4", patternUnits: "userSpaceOnUse" }, defs);
    svgEl("rect", { x: "0", y: "0", width: "4", height: "1", fill: "#FFFFFF", opacity: "0.025" }, pat);
    svgEl("rect", { x: "0", y: "0", width: "620", height: "220", fill: "url(#tfxScan)", "pointer-events": "none" }, svg);

    // схема вне экрана или вкладка скрыта — анимации на паузе
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => svg.classList.toggle("tfx-offscreen", !e.isIntersecting));
    });
    io.observe(svg);

    // нажатие на тележку → карточка с фотореалистичным рендером
    trolleys.forEach((g) => {
      const m = g.getAttribute("transform").match(/translate\((\d+),\s*(\d+)\)/);
      const col = (+m[1] - 180) / 54, row = (+m[2] - 32) / 48;
      g.classList.add("tfx-trolley");
      g.addEventListener("click", () => openTrolleySheet(row * 5 + col + 1, row));
    });

    addPidToggle(svg);
  }

  // ---------- 5б. Переключатель «Схема камеры ↔ контур P&ID» ----------
  function addPidToggle(svg) {
    const card = svg.closest(".bento-card-blue");
    const schemeBox = svg.parentElement;
    const head = card && card.firstElementChild;
    if (!card || !head || head.querySelector(".tfx-seg")) return;
    const seg = doc.createElement("div");
    seg.className = "tfx-seg";
    seg.innerHTML = '<button type="button" class="on" data-v="scheme">Схема</button><button type="button" data-v="pid">P&amp;ID</button><i></i>';
    const right = head.lastElementChild;
    head.insertBefore(seg, right);
    let pidBox = null;
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const pid = b.dataset.v === "pid";
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      seg.classList.toggle("right", pid);
      if (pid && !pidBox) {
        pidBox = doc.createElement("div");
        pidBox.className = "tfx-pid-box";
        schemeBox.parentNode.insertBefore(pidBox, schemeBox.nextSibling);
        if (window.ArmPid) window.ArmPid.mount(pidBox, { compact: true });
        else pidBox.textContent = "Модуль схемы не загрузился.";
      }
      schemeBox.style.display = pid ? "none" : "";
      if (pidBox) {
        pidBox.style.display = pid ? "" : "none";
        if (pid) onceAnim(pidBox, "tfx-enter");
      }
      if (!pid) onceAnim(schemeBox, "tfx-enter");
    });
  }

  // ---------- 5в. Карточка тележки (рендер из эскиза Stitch) ----------
  let sheet = null;
  function openTrolleySheet(n, row) {
    if (!sheet) {
      sheet = doc.createElement("div");
      sheet.className = "tfx-sheet";
      sheet.innerHTML = '<div class="tfx-sheet-bg"></div><div class="tfx-sheet-card" role="dialog" aria-label="Тележка"></div>';
      doc.body.appendChild(sheet);
      sheet.querySelector(".tfx-sheet-bg").addEventListener("click", closeTrolleySheet);
    }
    const card = sheet.querySelector(".tfx-sheet-card");
    const t = window.ArmPid ? window.ArmPid.telemetry() : null;
    const rowName = ["Ряд А", "Ряд Б", "Ряд В"][row] || "";
    const photo = window.__TROLLEY_3D_DATA_URL__ || "trolley-real.jpg";
    card.innerHTML = `
      <div class="tfx-grab"></div>
      <div class="tfx-sheet-head">
        <div><div class="tfx-sheet-kicker">ТЕЛЕЖКА AISI 304 • ${rowName}</div><div class="tfx-sheet-title">Труль №${n}</div></div>
        <button type="button" class="tfx-sheet-x" aria-label="Закрыть">✕</button>
      </div>
      <div class="tfx-photo tfx-card"><img src="${photo}" alt="Тележка с рыбой" onerror="this.onerror=null;this.src='trolley-3d.png'"/><span class="tfx-photo-sweep"></span><span class="tfx-glare"></span>
        <span class="tfx-photo-tag">№${String(n).padStart(2, "0")}</span></div>
      <div class="tfx-sheet-grid">
        <div><span>Воздух в камере</span><b>${t ? (t.tempC >= 0 ? "+" : "") + t.tempC.toFixed(1) + "°C" : "—"}</b></div>
        <div><span>Влажность</span><b>${t ? t.rh + "%" : "—"}</b></div>
        <div><span>VPD</span><b class="a">${t && t.vpd != null ? t.vpd.toFixed(2) + " кПа" : "—"}</b></div>
      </div>
      <div class="tfx-sheet-note">Подвес на прутках сверху + сетчатые полки. Климат — общий для камеры: отдельных датчиков на тележках нет.</div>
      <button type="button" class="tfx-sheet-go">♟️ Открыть «15 Трулей» →</button>`;
    card.querySelector(".tfx-sheet-x").onclick = closeTrolleySheet;
    card.querySelector(".tfx-sheet-go").onclick = () => {
      closeTrolleySheet();
      if (typeof window.selectTechSubTab === "function") window.selectTechSubTab("ct-chess");
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
    };
    bindTilt(card.querySelector(".tfx-photo"));
    sheet.classList.add("on");
  }
  function closeTrolleySheet() {
    if (sheet) sheet.classList.remove("on");
  }
  doc.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTrolleySheet(); });

  // ---------- 6. Кнопки: волна от пальца ----------
  const RIPPLE_SEL = ".scada-ctrl-btn, .sp-tab-btn, .sp-choice-btn, .mob-dock-item, .mob-pill-tab, .mob-mode-btn";
  function bindRipples() {
    doc.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest && e.target.closest(RIPPLE_SEL);
      if (!btn || reduced) return;
      if (!btn.classList.contains("tfx-ripple-host")) {
        const cs = getComputedStyle(btn);
        if (cs.position === "static") btn.style.position = "relative";
        btn.classList.add("tfx-ripple-host");
      }
      const r = btn.getBoundingClientRect();
      const s = doc.createElement("span");
      s.className = "tfx-ripple";
      s.style.left = (e.clientX - r.left) + "px";
      s.style.top = (e.clientY - r.top) + "px";
      s.style.setProperty("--tfx-rs", (Math.max(r.width, r.height) / 16 * 2.4).toFixed(1));
      btn.appendChild(s);
      setTimeout(() => s.remove(), 700);
      if (btn.classList.contains("scada-ctrl-btn")) onceAnim(btn.querySelector("span"), "tfx-pop");
    }, { passive: true });
  }

  // ---------- 7. Нижний док ----------
  let dockGlow = null;
  function positionDockGlow(animate) {
    const dock = doc.getElementById("mobile-bottom-dock");
    if (!dock) return;
    const act = dock.querySelector(".mob-dock-item.active");
    if (!dockGlow) {
      dockGlow = doc.createElement("span");
      dockGlow.className = "tfx-dock-glow";
      dockGlow.setAttribute("aria-hidden", "true");
      dock.insertBefore(dockGlow, dock.firstChild);
    }
    if (!act) { dockGlow.style.opacity = "0"; return; }
    if (!animate) dockGlow.style.transition = "none";
    dockGlow.style.opacity = "1";
    dockGlow.style.width = act.offsetWidth + "px";
    dockGlow.style.transform = "translateX(" + act.offsetLeft + "px)";
    if (!animate) { void dockGlow.offsetWidth; dockGlow.style.transition = ""; }
  }

  function watchDock() {
    const dock = doc.getElementById("mobile-bottom-dock");
    if (!dock) return;
    positionDockGlow(false);
    const mo = new MutationObserver((list) => {
      let moved = false;
      list.forEach((rec) => {
        if (rec.attributeName === "class" && rec.target.classList.contains("mob-dock-item")) {
          moved = true;
          if (rec.target.classList.contains("active") && !(rec.oldValue || "").includes("active")) onceAnim(rec.target, "tfx-bounce");
        }
      });
      if (moved) positionDockGlow(true);
    });
    dock.querySelectorAll(".mob-dock-item").forEach((b) => mo.observe(b, { attributes: true, attributeFilter: ["class"], attributeOldValue: true }));
    window.addEventListener("resize", () => positionDockGlow(false), { passive: true });
  }

  // ---------- 8. Смена экранов и подвкладок ----------
  function watchViews() {
    const targets = [doc.getElementById("view-trading-house"), doc.getElementById("view-technologist")]
      .concat(Array.from(doc.querySelectorAll(".mob-tech-pane, .sp-panel")));
    const mo = new MutationObserver((list) => {
      list.forEach((rec) => {
        const el = rec.target;
        const was = /display:\s*none/.test(rec.oldValue || "");
        if (was && el.style.display !== "none") {
          onceAnim(el, "tfx-enter");
          // новые карточки на показанном экране — с бликом
          el.querySelectorAll(".tfx-card").forEach((c) => {
            const r = c.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) onceAnim(c, "tfx-shine");
          });
        }
      });
    });
    targets.forEach((t) => t && mo.observe(t, { attributes: true, attributeFilter: ["style"], attributeOldValue: true }));
  }

  // ---------- 9. Тост ----------
  function watchToast() {
    let t = doc.getElementById("toast-msg");
    const hook = (el) => {
      new MutationObserver(() => onceAnim(el, "tfx-toast-in")).observe(el, { childList: true, characterData: true, subtree: true });
    };
    if (t) { hook(t); return; }
    // тост создаётся при первом показе
    const mo = new MutationObserver(() => {
      t = doc.getElementById("toast-msg");
      if (t) { mo.disconnect(); hook(t); onceAnim(t, "tfx-toast-in"); }
    });
    mo.observe(doc.body, { childList: true });
  }

  // ---------- Запуск ----------
  function init() {
    if (!reduced && "IntersectionObserver" in window) {
      revealIO = new IntersectionObserver((ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting) { revealIO.unobserve(e.target); reveal(e.target); }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    }
    buildAmbient();
    decorateTopBar();
    enhanceClimate();
    enhanceChamber();
    scanCards();
    watchNumbers();
    bindRipples();
    watchDock();
    watchViews();
    watchToast();

    // карточки, которые программа дорисует позже (память цеха, модалки)
    let pending = 0;
    new MutationObserver(() => {
      if (pending) return;
      pending = setTimeout(() => { pending = 0; scanCards(); }, 300);
    }).observe(doc.body, { childList: true, subtree: true });
  }

  window.ArmTelFx = {
    version: "1.0",
    pauseAmbient(on) { if (dust) dust.setRunning(!on); },
    refreshDock() { positionDockGlow(true); }
  };

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
