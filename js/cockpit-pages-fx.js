// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС
// ЖИВАЯ ГРАФИКА СТРАНИЦ-КОКПИТОВ (пара к css/cockpit-pages-fx.css)
// Подключается в profit / calcs / console / advisor / phases / aim-cockpit.html.
// Сам находит на странице графики, приборы, кольца, рендеры, полосы и числа
// и оживляет их, не трогая разметку и логику страниц. Выключатель: ?fx=0
// ==========================================================================
(function () {
  "use strict";
  if (window.ArmPagesFx || /[?&]fx=0\b/.test(location.search)) return;

  const html = document.documentElement;
  if (window.parent !== window) {
    html.classList.add("in-arm-iframe");
  }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = reduce || (navigator.hardwareConcurrency || 8) <= 4;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const SVGNS = "http://www.w3.org/2000/svg";
  html.classList.add("pfx-on");

  const rand = (a, b) => a + Math.random() * (b - a);
  const cls = (el) => (typeof el.className === "string" ? el.className : (el.className && el.className.baseVal) || "");

  // ---------- запуск эффекта, когда элемент впервые показался на экране ----------
  // (страницы живут во вкладках-iframe: пока вкладка скрыта, анимация ждёт)
  const pending = new Map();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const fns = pending.get(e.target) || [];
      pending.delete(e.target);
      fns.forEach((fn) => { try { fn(); } catch (err) { console.warn("[PagesFx]", err); } });
    });
  }, { threshold: 0.15 }) : null;
  function onView(el, fn) {
    if (!io || reduce) { fn(); return; }
    if (!pending.has(el)) { pending.set(el, []); io.observe(el); }
    pending.get(el).push(fn);
  }
  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  // ---------- общий цикл для холстов: работает, только пока холст виден ----------
  const loops = new Set();
  let raf = 0, last = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (document.visibilityState === "visible") loops.forEach((l) => { if (l.visible) l.fn(dt, now / 1000); });
    raf = requestAnimationFrame(tick);
  }
  function addLoop(el, fn) {
    const l = { fn, visible: false };
    loops.add(l);
    if (io) new IntersectionObserver((es) => es.forEach((e) => { l.visible = e.isIntersecting; })).observe(el);
    else l.visible = true;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  // =====================================================================
  // 1. Фон
  // =====================================================================
  function mountAmbient() {
    if (document.querySelector(".pfx-ambient")) return;
    const a = document.createElement("div");
    a.className = "pfx-ambient";
    a.innerHTML = '<i class="pfx-blob b1"></i><i class="pfx-blob b2"></i><i class="pfx-grid"></i>' + (lite ? "" : '<i class="pfx-scanline"></i>');
    document.body.insertBefore(a, document.body.firstChild);
  }

  // =====================================================================
  // 2. Карточки: появление из глубины, блик и кромка за курсором
  // =====================================================================
  function isCard(el) {
    const c = cls(el);
    return /\brounded-(lg|xl|2xl)\b/.test(c) && /\bbg-(surface|\[)/.test(c) && el.offsetWidth > 200 && el.offsetHeight > 100;
  }
  function enhanceCards() {
    const cards = [...document.querySelectorAll("div, section, article")].filter((el) => !el.dataset.pfxCard && isCard(el));
    let order = 0;
    cards.forEach((card) => {
      card.dataset.pfxCard = "1";
      if (getComputedStyle(card).position === "static") card.style.position = "relative";
      const glare = document.createElement("i");
      glare.className = "pfx-glare";
      card.appendChild(glare);
      card.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
        card.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
        card.style.setProperty("--pfx-g", "1");
      });
      card.addEventListener("pointerleave", () => card.style.setProperty("--pfx-g", "0"));
      // появляются только верхнеуровневые карточки — вложенные едут вместе с родителем
      if (card.parentElement && card.parentElement.closest("[data-pfx-card]")) return;
      if (reduce) return;
      card.classList.add("pfx-card", "pfx-wait");
      card.style.setProperty("--pfx-d", ((order++ % 6) * 0.08).toFixed(2) + "s");
      onView(card, () => {
        card.classList.add("pfx-show");
        nextFrame(() => card.classList.remove("pfx-wait"));
        setTimeout(() => card.classList.remove("pfx-card", "pfx-show"), 1800);
      });
    });
  }

  // =====================================================================
  // 3. SVG: линии графиков, площади, точки, дуги приборов, кольца
  // =====================================================================
  let uid = 0;
  function parseArc(d) {
    const m = (d || "").match(/M\s*([\d.\-]+)[ ,]+([\d.\-]+)\s*A\s*([\d.]+)[ ,]+[\d.]+[ ,]+\d[ ,]+\d[ ,]+\d[ ,]+([\d.\-]+)[ ,]+([\d.\-]+)/i);
    return m ? { x0: +m[1], y0: +m[2], r: +m[3], x1: +m[4], y1: +m[5] } : null;
  }
  function drawOn(p, delay) {
    let len = 0;
    try { len = p.getTotalLength(); } catch (e) { return; }
    if (!len || reduce) return;
    p.style.strokeDasharray = len.toFixed(1);
    p.style.strokeDashoffset = len.toFixed(1);
    onView(p.ownerSVGElement || p, () => {
      p.style.transition = `stroke-dashoffset 1.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay || 0}s`;
      nextFrame(() => { p.style.strokeDashoffset = "0"; });
      // убираем временные стили, чтобы страница могла сама менять линию
      setTimeout(() => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; p.style.transition = ""; }, 1900 + (delay || 0) * 1000);
    });
  }
  function addRunner(svg, path, color) {
    if (lite) return;
    if (!path.id) path.id = "pfxPath" + (++uid);
    const make = (r, op) => {
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("r", r);
      c.setAttribute("fill", color);
      c.setAttribute("opacity", op);
      c.setAttribute("class", "pfx-runner");
      const am = document.createElementNS(SVGNS, "animateMotion");
      am.setAttribute("dur", "4.8s");
      am.setAttribute("repeatCount", "indefinite");
      am.setAttribute("begin", "2s");
      const mp = document.createElementNS(SVGNS, "mpath");
      mp.setAttribute("href", "#" + path.id);
      am.appendChild(mp);
      c.appendChild(am);
      svg.appendChild(c);
    };
    make(6, 0.18);
    make(2.4, 0.95);
  }
  function addNeedle(svg, track, value) {
    const a = parseArc(value.getAttribute("d"));
    const t = parseArc(track.getAttribute("d"));
    if (!a || !t || a.x0 !== t.x0 || a.y0 !== t.y0) return;
    const cx = t.x0 + t.r, cy = t.y0;
    const target = (Math.atan2(a.y1 - cy, a.x1 - cx) * 180) / Math.PI;
    // стрелка-указатель на внешнем поясе шкалы: в центре прибора стоит цифра, её не перекрываем
    const R0 = cx + t.r * 0.5, R1 = cx + t.r * 0.86, hw = t.r * 0.035;
    const col = "#ffb95f";
    const g = document.createElementNS(SVGNS, "g");
    g.innerHTML =
      `<line x1="${R0}" y1="${cy}" x2="${R1}" y2="${cy}" stroke="${col}" stroke-width="${(t.r * 0.1).toFixed(1)}" stroke-linecap="round" opacity="0.2"/>` +
      `<polygon points="${R0},${cy - hw} ${R1},${cy} ${R0},${cy + hw}" fill="${col}"/>` +
      `<circle cx="${R0}" cy="${cy}" r="${(hw * 1.5).toFixed(1)}" fill="#0b101b" stroke="${col}" stroke-width="${(t.r * 0.025).toFixed(1)}"/>`;
    const idle = document.createElementNS(SVGNS, "g");
    idle.appendChild(g);
    idle.style.transformOrigin = `${cx}px ${cy}px`;
    svg.appendChild(idle);
    let ang = -180, vel = 0;
    const set = () => g.setAttribute("transform", `rotate(${ang.toFixed(2)} ${cx} ${cy})`);
    set();
    // стрелка «живого» прибора: разгоняется, перелетает отметку и успокаивается
    onView(svg, () => {
      if (reduce) { ang = target; set(); return; }
      let t0 = performance.now();
      (function spring(now) {
        const dt = Math.min(0.033, (now - t0) / 1000); t0 = now;
        vel += (-(ang - target) * 55 - vel * 5.2) * dt;
        ang += vel * dt;
        set();
        if (Math.abs(ang - target) > 0.05 || Math.abs(vel) > 0.05) requestAnimationFrame(spring);
        else { ang = target; set(); idle.classList.add("pfx-needle-idle"); }
      })(t0);
    });
  }
  function enhanceSvgs() {
    document.querySelectorAll("svg").forEach((svg) => {
      if (svg.dataset.pfx || svg.closest(".pfx-ambient")) return;
      svg.dataset.pfx = "1";
      const vb = (svg.getAttribute("viewBox") || svg.getAttribute("viewbox") || "").split(/[ ,]+/).map(Number);
      const vbW = vb[2] || 0;
      if (vbW < 60) return; // иконки
      const paths = [...svg.querySelectorAll("path")];
      const arcs = paths.filter((p) => /A\s*[\d.]/i.test(p.getAttribute("d") || "") && Number(p.getAttribute("stroke-width") || 0) >= 6);
      const lines = paths.filter((p) => p.getAttribute("fill") === "none" && !arcs.includes(p));
      const areas = paths.filter((p) => /^url\(/.test(p.getAttribute("fill") || ""));

      // прибор: первая толстая дуга — шкала, остальные (с той же начальной точкой) — значения
      if (arcs.length >= 2) {
        const track = arcs[0];
        arcs.slice(1).forEach((p, i) => drawOn(p, 0.15 + i * 0.1));
        const value = arcs.slice(1).reverse().find((p) => {
          const a = parseArc(p.getAttribute("d")), t = parseArc(track.getAttribute("d"));
          return a && t && a.x0 === t.x0 && a.y0 === t.y0;
        });
        if (value) addNeedle(svg, track, value);
      }
      areas.forEach((p) => onView(svg, () => nextFrame(() => p.classList.add("pfx-area", "pfx-in"))));
      areas.forEach((p) => p.classList.add("pfx-area"));
      lines.forEach((p, i) => {
        drawOn(p, i * 0.25);
        const stroke = p.getAttribute("stroke");
        const color = stroke && stroke !== "currentColor" ? stroke : getComputedStyle(p).color || "#00f0ff";
        if (vbW >= 250) addRunner(svg, p, color);
      });
      // конечные точки графиков — расходящееся кольцо
      if (lines.length) {
        [...svg.querySelectorAll("circle")].filter((c) => Number(c.getAttribute("r")) <= 5 && !c.closest("g.pfx-runner")).forEach((c) => {
          if (c.classList.contains("pfx-runner")) return;
          const ring = c.cloneNode(false);
          ring.removeAttribute("class");
          const fill = c.getAttribute("fill");
          ring.setAttribute("fill", "none");
          ring.setAttribute("stroke", fill && fill !== "currentColor" ? fill : getComputedStyle(c).color || "#00f0ff");
          ring.setAttribute("stroke-width", "1.2");
          ring.setAttribute("class", "pfx-ping");
          c.parentNode.insertBefore(ring, c);
        });
      }
      // кольца и сегменты пончика: заполняются от нуля, сегменты — по очереди
      let seg = 0;
      svg.querySelectorAll("circle[stroke-dasharray]").forEach((c) => {
        const parts = (c.getAttribute("stroke-dasharray") || "").split(/[ ,]+/).map(Number).filter((n) => !isNaN(n));
        if (!parts.length || reduce) return;
        const off = c.getAttribute("stroke-dashoffset") || "0";
        if (parts.length === 1) {
          c.style.strokeDashoffset = String(parts[0]);
          onView(svg, () => {
            c.style.transition = "stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s";
            nextFrame(() => { c.style.strokeDashoffset = off; });
            setTimeout(() => { c.style.strokeDashoffset = ""; c.style.transition = ""; }, 2200);
          });
        } else {
          const d = 0.15 + seg++ * 0.22;
          c.style.strokeDasharray = `0 ${parts[1]}`;
          onView(svg, () => {
            c.style.transition = `stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1) ${d}s`;
            nextFrame(() => { c.style.strokeDasharray = `${parts[0]} ${parts[1]}`; });
            setTimeout(() => { c.style.strokeDasharray = ""; c.style.transition = ""; }, 1500 + d * 1000);
          });
        }
      });
    });
  }

  // =====================================================================
  // 4. 3D-рендеры: камера — ламинарный поток и луч; срез рыбы — томограф
  // =====================================================================
  function prepHost(img) {
    const host = img.parentElement;
    if (!host) return null;
    host.classList.add("pfx-img-host");
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    return host;
  }
  function livingChamber(img) {
    const host = prepHost(img);
    if (!host || host.querySelector(".pfx-sweep")) return;
    img.classList.add("pfx-ken");
    const sweep = document.createElement("i");
    sweep.className = "pfx-sweep";
    host.appendChild(sweep);
    if (lite) return;
    // ламинарный обдув сквозь тележки: тонкие светящиеся струи слева направо
    const cvs = document.createElement("canvas");
    cvs.className = "pfx-flow";
    img.after(cvs);
    const ctx = cvs.getContext("2d");
    const streams = Array.from({ length: 70 }, () => ({ x: Math.random(), y: rand(0.22, 0.86), v: rand(0.06, 0.13), len: rand(0.03, 0.09), a: rand(0.12, 0.38), ph: rand(0, 6.28), w: rand(0.6, 1.8), cold: Math.random() < 0.3 }));
    addLoop(host, (dt, t) => {
      const W = host.clientWidth, H = host.clientHeight;
      if (!W || !H) return;
      if (cvs.width !== Math.round(W * DPR)) { cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR); }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      streams.forEach((s) => {
        s.x += s.v * dt;
        if (s.x - s.len > 1) { s.x = -rand(0, 0.2); s.y = rand(0.22, 0.86); }
        const y = (s.y + Math.sin(t * 1.3 + s.ph + s.x * 6) * 0.012) * H;
        const x1 = s.x * W, x0 = (s.x - s.len) * W;
        const edge = Math.min(1, s.x * 5, (1.05 - s.x) * 4);
        const rgb = s.cold ? "110,210,255" : "220,240,255";
        ctx.lineWidth = s.w;
        ctx.strokeStyle = `rgba(${rgb},${(s.a * 0.3 * edge).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo((x0 + x1) / 2, y); ctx.stroke();
        ctx.strokeStyle = `rgba(${rgb},${(s.a * edge).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, y); ctx.lineTo(x1, y); ctx.stroke();
      });
    });
  }
  function tomography(img) {
    const host = prepHost(img);
    if (!host || host.querySelector(".pfx-scan")) return;
    img.classList.add("pfx-ken");
    const holo = document.createElement("i");
    holo.className = "pfx-holo";
    const scan = document.createElement("i");
    scan.className = "pfx-scan";
    scan.innerHTML = '<span class="pfx-scan-tag">SPECTRAL SCAN</span>';
    host.append(holo, scan);
    const setH = () => host.style.setProperty("--pfx-h", (host.clientHeight + 10) + "px");
    setH();
    if ("ResizeObserver" in window) new ResizeObserver(setH).observe(host);
  }
  function enhanceImages() {
    document.querySelectorAll("img").forEach((img) => {
      if (img.dataset.pfx) return;
      const src = img.getAttribute("src") || "";
      const run = () => {
        if (img.offsetWidth < 220 || img.offsetHeight < 120) return;
        img.dataset.pfx = "1";
        if (/chamber-3d|aim-3d/.test(src)) livingChamber(img);
        else if (/vimba-3d|cut-/.test(src)) tomography(img);
      };
      if (img.complete) run(); else img.addEventListener("load", run, { once: true });
    });
  }

  // =====================================================================
  // 5. Полосы прогресса, колба трапа, столбики фасовки, ряды мешков
  // =====================================================================
  function enhanceBars() {
    document.querySelectorAll('[style*="width"]').forEach((el) => {
      if (el.dataset.pfxBar) return;
      const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*width:\s*([\d.]+)%/);
      if (!m || el.offsetHeight > 14 || el.offsetHeight < 2 || el.children.length) return;
      el.dataset.pfxBar = "1";
      const target = m[1] + "%";
      if (el.offsetWidth > 36 && !lite) {
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        el.style.overflow = "hidden";
        const sh = document.createElement("i");
        sh.className = "pfx-shine";
        sh.style.setProperty("--pfx-d", rand(0, 2).toFixed(2) + "s");
        el.appendChild(sh);
      }
      if (reduce) return;
      el.style.width = "0%";
      onView(el, () => {
        el.style.transition = "width 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.25s";
        nextFrame(() => { el.style.width = target; });
        setTimeout(() => { el.style.transition = ""; }, 1900);
      });
    });
    // колба трапа: вертикальная заливка в узком сосуде
    document.querySelectorAll('[style*="height"]').forEach((el) => {
      if (el.dataset.pfxLiquid) return;
      const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*height:\s*([\d.]+)%/);
      const vessel = el.parentElement;
      if (!m || !vessel || vessel.offsetWidth > 110 || vessel.offsetHeight < 60 || getComputedStyle(vessel).overflow !== "hidden") return;
      el.dataset.pfxLiquid = "1";
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.insertAdjacentHTML("afterbegin", '<i class="pfx-liquid-wave"></i><i class="pfx-liquid-wave w2"></i>' +
        Array.from({ length: 6 }, () => `<i class="pfx-bubble" style="--x:${rand(10, 85).toFixed(0)}%;--s:${rand(2, 4.5).toFixed(1)}px;--t:${rand(2, 4).toFixed(2)}s;--dl:${rand(0, 3).toFixed(2)}s;--w:${rand(-4, 4).toFixed(0)}px;--rise:-${Math.round(vessel.offsetHeight * 0.55)}px"></i>`).join(""));
      if (reduce) return;
      const target = m[1] + "%";
      el.style.height = "0%";
      onView(el, () => {
        el.style.transition = "height 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s";
        nextFrame(() => { el.style.height = target; });
      });
    });
    // столбики вариантов фасовки (profit-cockpit): вырастают по очереди, блик бежит вверх
    document.querySelectorAll(".variant-col").forEach((col, i) => {
      if (col.dataset.pfx) return;
      col.dataset.pfx = "1";
      const track = col.querySelector("div.relative.overflow-hidden, div.overflow-hidden");
      const bar = track && track.firstElementChild;
      if (!bar) return;
      const sh = document.createElement("i");
      sh.className = "pfx-shine-v";
      sh.style.setProperty("--pfx-d", (i * 0.45).toFixed(2) + "s");
      track.appendChild(sh);
      if (reduce) return;
      bar.classList.add("pfx-bar", "pfx-wait");
      bar.style.setProperty("--pfx-d", (0.15 + i * 0.13).toFixed(2) + "s");
      onView(col, () => { bar.classList.add("pfx-show"); nextFrame(() => bar.classList.remove("pfx-wait")); });
    });
    // ряды одинаковых «точек» (мешки соли и т.п.): заполняются по одной
    document.querySelectorAll("div, span").forEach((box) => {
      if (box.dataset.pfxPop || box.children.length < 8) return;
      const kids = [...box.children];
      // все — маленькие пустые «плитки», и большинство одного вида (последний мешок может быть неполным)
      if (!kids.every((k) => k.offsetWidth > 0 && k.offsetWidth <= 22 && k.offsetHeight <= 22 && !k.textContent.trim())) return;
      const freq = {};
      kids.forEach((k) => { const c = cls(k); freq[c] = (freq[c] || 0) + 1; });
      if (Math.max(...Object.values(freq)) < 8) return;
      box.dataset.pfxPop = "1";
      kids.forEach((k, i) => k.style.setProperty("--i", String(i)));
      if (reduce) return;
      box.classList.add("pfx-pop-group", "pfx-wait");
      onView(box, () => { box.classList.add("pfx-show"); nextFrame(() => box.classList.remove("pfx-wait")); });
    });
  }

  // =====================================================================
  // 6. Числа: счётчик при появлении и вспышка при смене значения
  // =====================================================================
  function firstNumberNode(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (/\d/.test(w.currentNode.nodeValue)) return w.currentNode;
    return null;
  }
  function countUp(el) {
    const node = firstNumberNode(el);
    if (!node || /\d:\d/.test(node.nodeValue)) return; // время «01:42» не трогаем
    const original = node.nodeValue;
    const m = original.match(/(\d{1,3}(?:[ \u00a0]\d{3})+|\d+)([.,]\d+)?/);
    if (!m) return;
    const intPart = m[1], frac = m[2] || "";
    const grouped = /[ \u00a0]/.test(intPart);
    const sep = frac ? frac[0] : ".";
    const decimals = frac ? frac.length - 1 : 0;
    const value = parseFloat(intPart.replace(/[ \u00a0]/g, "") + (frac ? "." + frac.slice(1) : ""));
    if (!isFinite(value) || value === 0) return;
    const fmt = (v) => {
      let s = v.toFixed(decimals);
      let [i, f] = s.split(".");
      if (grouped) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
      return f ? i + sep + f : i;
    };
    const pre = original.slice(0, m.index), post = original.slice(m.index + m[0].length);
    let lastSet = original;
    onView(el, () => {
      if (reduce) return;
      const t0 = performance.now(), dur = 1300 + Math.min(900, String(Math.round(value)).length * 120);
      (function step(now) {
        if (node.nodeValue !== lastSet) return; // страница сама обновила число — уступаем
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        lastSet = k < 1 ? pre + fmt(value * e) + post : original;
        node.nodeValue = lastSet;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
  function enhanceNumbers() {
    document.querySelectorAll(".font-metric-display, .font-metric-lg").forEach((el) => {
      if (el.dataset.pfxNum) return;
      el.dataset.pfxNum = "1";
      countUp(el);
      let prev = el.textContent, quiet = true;
      setTimeout(() => { quiet = false; prev = el.textContent; }, 3500);
      new MutationObserver(() => {
        if (quiet || el.textContent === prev) return;
        prev = el.textContent;
        el.classList.remove("pfx-flash"); void el.offsetWidth; el.classList.add("pfx-flash");
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  // =====================================================================
  // 7. Светодиоды статуса, активная фаза MCGS, волна при нажатии
  // =====================================================================
  function enhanceLeds() {
    document.querySelectorAll('[class*="rounded-full"]').forEach((el) => {
      if (el.dataset.pfxLed || el.children.length || el.textContent.trim()) return;
      const c = cls(el);
      // только «живые» светодиоды (со свечением или пульсом), а не точки легенды
      if (!/\bbg-/.test(c) || !/shadow|animate-pulse/.test(c) || /animate-ping/.test(c) || el.offsetWidth > 11 || el.offsetHeight > 11 || el.offsetWidth < 4) return;
      el.dataset.pfxLed = "1";
      el.classList.add("pfx-led");
      el.style.setProperty("--pfx-led", getComputedStyle(el).backgroundColor);
    });
    document.querySelectorAll("tr").forEach((tr) => {
      if (/АКТИВН|ACTIVE/i.test(tr.textContent) && !tr.querySelector("th")) tr.classList.add("pfx-row-active");
    });
  }
  function enableRipples() {
    document.addEventListener("pointerdown", (e) => {
      const el = e.target.closest && e.target.closest("button, .variant-col, .trolley-card");
      if (!el || reduce) return;
      const cs = getComputedStyle(el);
      if (cs.position === "static") el.style.position = "relative";
      if (cs.overflow === "visible") el.style.overflow = "hidden";
      const r = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "pfx-ripple";
      s.style.left = (e.clientX - r.left) + "px";
      s.style.top = (e.clientY - r.top) + "px";
      el.appendChild(s);
      setTimeout(() => s.remove(), 750);
    });
  }

  function init() {
    mountAmbient();
    enhanceCards();
    enhanceSvgs();
    enhanceImages();
    enhanceBars();
    enhanceNumbers();
    enhanceLeds();
    enableRipples();
  }
  // Вкладка-iframe может грузиться скрытой (display:none) — тогда у элементов нулевые размеры.
  // Ждём, пока страница реально появится на экране, и только тогда ищем, что оживлять.
  let started = false;
  function start() {
    if (started) return;
    if (!document.body || document.body.clientWidth === 0) {
      if ("ResizeObserver" in window && document.body) {
        const ro = new ResizeObserver(() => { if (document.body.clientWidth > 0) { ro.disconnect(); start(); } });
        ro.observe(document.body);
      } else setTimeout(start, 500);
      return;
    }
    started = true;
    init();
    // страницы дорисовывают части своими скриптами — догоняем новые элементы
    setTimeout(() => { enhanceSvgs(); enhanceImages(); enhanceBars(); enhanceNumbers(); enhanceLeds(); }, 1200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 60));
  else setTimeout(start, 60);

  window.ArmPagesFx = { refresh: init };
})();
