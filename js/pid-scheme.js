// ==========================================================================
// 🧭 2D CAD P&ID-МНЕМОСХЕМА • AIM AGHD-250ELC (по эскизу Stitch «3D Twin ↔ 2D CAD»)
// Контур хладагента R410A (компрессор → догрев-конденсатор → ресивер → фильтр →
// смотровое стекло → 1#EEV → V-испаритель → отделитель → компрессор),
// воздушная петля камеры и сбор конденсата. Потоки анимированы, узлы кликабельны.
// Цифры — из телеметрии АРМ и расчёта ядра ARMCore; где датчика нет — так и написано.
// API: window.ArmPid.mount(host, { compact }) → { destroy() }
// ==========================================================================
(function () {
  "use strict";
  if (window.ArmPid) return;

  const NS = "http://www.w3.org/2000/svg";

  const CSS = `
.arm-pid { position: relative; width: 100%; height: 100%; min-height: 220px; background:
  radial-gradient(90% 70% at 50% 35%, rgba(0,240,255,0.06), transparent 70%), #060A12; border-radius: inherit; overflow: hidden;
  font-family: var(--font-mono, 'JetBrains Mono', Consolas, monospace); color: #CFE9F5; user-select: none; }
.arm-pid svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.arm-pid .pid-grid { stroke: rgba(0,240,255,0.06); stroke-width: 1; }
.arm-pid .pid-grid.major { stroke: rgba(0,240,255,0.11); }
.arm-pid .pid-pipe { fill: none; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
.arm-pid .pid-pipe.hot { stroke: #7C3A12; } .arm-pid .pid-pipe.liq { stroke: #6B4A12; } .arm-pid .pid-pipe.cold { stroke: #0F3E63; } .arm-pid .pid-pipe.cond { stroke: #0E4A55; stroke-width: 2.2; }
.arm-pid .pid-flow { fill: none; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 6 12; animation: pidFlow 0.9s linear infinite; }
.arm-pid .pid-flow.hot { stroke: #FF8A3D; } .arm-pid .pid-flow.liq { stroke: #FBBF24; } .arm-pid .pid-flow.cold { stroke: #38BDF8; } .arm-pid .pid-flow.cond { stroke: #67E8F9; stroke-dasharray: 2 9; animation-duration: 1.6s; }
.arm-pid .pid-air { fill: none; stroke: rgba(0,240,255,0.10); stroke-width: 34; stroke-linejoin: round; }
.arm-pid .pid-air-flow { fill: none; stroke: rgba(125,244,255,0.55); stroke-width: 1.4; stroke-dasharray: 2 16; stroke-linecap: round; animation: pidFlow 0.7s linear infinite; }
@keyframes pidFlow { to { stroke-dashoffset: -18; } }
.arm-pid.paused .pid-flow, .arm-pid.paused .pid-air-flow { animation-duration: 3.2s; }
.arm-pid .pid-node { cursor: pointer; }
.arm-pid .pid-node .pid-body { fill: #0B1422; stroke: #2B5878; stroke-width: 1.6; transition: stroke 0.2s, fill 0.2s; }
.arm-pid .pid-node:hover .pid-body, .arm-pid .pid-node.sel .pid-body { stroke: #00F0FF; fill: #0E1D30; }
.arm-pid .pid-node.sel .pid-halo { opacity: 1; }
.arm-pid .pid-halo { fill: rgba(0,240,255,0.04); stroke: #00F0FF; stroke-width: 1.2; opacity: 0; transition: opacity 0.25s; stroke-dasharray: 5 4; animation: pidAnts 0.9s linear infinite; }
@keyframes pidAnts { to { stroke-dashoffset: -9; } }
@keyframes pidSpin { to { transform: rotate(360deg); } }
.arm-pid .pid-sym { fill: none; stroke: #7DD3FC; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
.arm-pid .pid-sym.amber { stroke: #FBBF24; } .arm-pid .pid-sym.hot { stroke: #FB923C; } .arm-pid .pid-sym.cold { stroke: #60A5FA; }
.arm-pid .pid-lbl { fill: #9FB8CC; font-size: 10px; font-weight: 600; letter-spacing: 0.02em; }
.arm-pid .pid-lbl.big { fill: #E2F4FF; font-size: 11.5px; font-weight: 800; }
.arm-pid .pid-tag { fill: #00F0FF; font-size: 9px; font-weight: 800; }
.arm-pid .pid-val { fill: #FBBF24; font-size: 11px; font-weight: 800; }
.arm-pid .pid-val.c { fill: #38BDF8; } .arm-pid .pid-val.g { fill: #34D399; } .arm-pid .pid-val.m { fill: #64748B; font-weight: 600; }
.arm-pid .pid-rot { transform-box: fill-box; transform-origin: center; animation: pidSpin 0.8s linear infinite; }
.arm-pid.paused .pid-rot { animation-duration: 3s; }
.arm-pid .pid-drop { animation: pidDrop 1.5s cubic-bezier(0.55,0,0.9,0.5) infinite; }
.arm-pid.paused .pid-drop { animation-duration: 4.5s; }
@keyframes pidDrop { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(26px); opacity: 0; } }
.arm-pid .pid-pulse { animation: pidPulse 2.2s ease-in-out infinite; }
@keyframes pidPulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
.arm-pid .pid-scan { animation: pidScan 7s linear infinite; }
@keyframes pidScan { from { transform: translateX(-60px); } to { transform: translateX(960px); } }
.arm-pid .pid-info { position: absolute; z-index: 3; right: 12px; top: 12px; width: min(270px, 60%); padding: 10px 12px; border-radius: 12px;
  background: rgba(8,14,24,0.86); border: 1px solid rgba(0,240,255,0.32); box-shadow: 0 12px 32px rgba(0,0,0,0.6), 0 0 18px rgba(0,240,255,0.14);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); font-size: 11px; opacity: 0; transform: translateY(-6px) scale(0.98); pointer-events: none;
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1); }
.arm-pid .pid-info.on { opacity: 1; transform: none; pointer-events: auto; }
.arm-pid .pid-info h4 { margin: 0 0 6px; font-size: 11.5px; color: #E2F4FF; letter-spacing: 0.03em; display: flex; justify-content: space-between; gap: 8px; }
.arm-pid .pid-info h4 button { background: none; border: 0; color: #94A3B8; cursor: pointer; font-size: 13px; line-height: 1; padding: 0 2px; }
.arm-pid .pid-info .row { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.06); }
.arm-pid .pid-info .row span:first-child { color: #8BA3B8; font-family: var(--font-sans, Inter, sans-serif); }
.arm-pid .pid-info .row b { color: #00F0FF; } .arm-pid .pid-info .row b.a { color: #FBBF24; } .arm-pid .pid-info .row b.m { color: #64748B; font-weight: 600; }
.arm-pid .pid-info .src { margin-top: 6px; font-size: 9.5px; color: #64748B; font-family: var(--font-sans, Inter, sans-serif); line-height: 1.35; }
.arm-pid .pid-legend { position: absolute; left: 12px; bottom: 10px; z-index: 2; display: flex; flex-wrap: wrap; gap: 10px; font-size: 9.5px; color: #8BA3B8; pointer-events: none; }
.arm-pid .pid-legend i { display: inline-block; width: 16px; height: 3px; border-radius: 2px; margin-right: 5px; vertical-align: middle; }
.arm-pid .pid-scroll { position: absolute; inset: 0; }
.arm-pid.compact .pid-scroll { overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
.arm-pid.compact svg { position: relative; width: 900px; height: 461px; }
/* разрез: трубы, воздух, рыба, вентиляторы, конденсат, пар */
.arm-pid .pid-pipe-base { fill: none; stroke: #05070B; stroke-width: 11; stroke-linecap: round; stroke-linejoin: round; }
.arm-pid .pid-pipe-base.cold { stroke: #0F172A; stroke-width: 15; }
.arm-pid .pid-pipe.hot { stroke: #B91C1C; stroke-width: 6.5; } .arm-pid .pid-pipe.liq { stroke: #C2410C; stroke-width: 6; } .arm-pid .pid-pipe.cold { stroke: #0369A1; stroke-width: 6.5; }
.arm-pid .pid-flow.hot { stroke: #FECACA; } .arm-pid .pid-flow.liq { stroke: #FDE68A; } .arm-pid .pid-flow.cold { stroke: #BAE6FD; }
.arm-pid .pid-flow { stroke-width: 1.8; }
.arm-pid .pid-airline { fill: none; stroke-width: 1.4; stroke-dasharray: 3 16; stroke-linecap: round; animation: pidFlow 1.2s linear infinite; }
.arm-pid .pid-airline.warm { stroke: rgba(251,191,36,0.45); } .arm-pid .pid-airline.cold { stroke: rgba(125,211,252,0.35); }
.arm-pid .pid-air { pointer-events: none; }
.arm-pid.paused .pid-air-g { opacity: 0.35; }
.arm-pid .pid-fish { transform-box: view-box; animation: pidSway 3.4s ease-in-out infinite; }
@keyframes pidSway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
.arm-pid .pid-fan { transform-box: fill-box; transform-origin: center; animation: pidSpin var(--fan-dur, 0.6s) linear infinite; }
.arm-pid .pid-breathe { animation: pidBreath 5s ease-in-out infinite; }
@keyframes pidBreath { 0%,100% { opacity: 0.75; } 50% { opacity: 1; } }
.arm-pid .pid-led { filter: drop-shadow(0 0 4px #FFC46B); }
.arm-pid .pid-heat { animation: pidPulse 2.4s ease-in-out infinite; mix-blend-mode: screen; }
.arm-pid .pid-mist, .arm-pid .pid-steam { transform-box: fill-box; transform-origin: center; }
.arm-pid .pid-mist { pointer-events: none; animation: pidMist var(--d, 5s) ease-out var(--dl, 0s) infinite; opacity: 0; }
@keyframes pidMist { 0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 25% { opacity: 0.32; } 100% { transform: translate(46px, -80px) scale(1.7); opacity: 0; } }
.arm-pid.paused .pid-mist { animation-duration: 9s; }
.arm-pid .pid-drop2 { animation: pidFall 1.45s cubic-bezier(0.55, 0, 0.9, 0.5) var(--dl, 0s) infinite; }
@keyframes pidFall { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(118px); opacity: 1; } }
.arm-pid.paused .pid-drop2 { animation-duration: 4s; }
.arm-pid .pid-ripple { transform-box: fill-box; transform-origin: center; animation: pidRipple 1.45s ease-out var(--dl, 0s) infinite; }
@keyframes pidRipple { 0% { transform: scale(0.2); opacity: 0.9; } 100% { transform: scale(1.5); opacity: 0; } }
.arm-pid .pid-steam { animation: pidSteam 4s ease-out var(--dl, 0s) infinite; opacity: 0; }
@keyframes pidSteam { 0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 20% { opacity: 0.4; } 100% { transform: translate(40px, -40px) scale(2.2); opacity: 0; } }
.arm-pid .pid-vib { animation: pidVib 0.12s linear infinite; }
@keyframes pidVib { 0%,100% { transform: translate(0, 0); } 50% { transform: translate(0.6px, -0.4px); } }
.arm-pid .pid-needle { animation: pidNeedle 2.6s ease-in-out infinite; }
@keyframes pidNeedle { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(4deg); } }
.arm-pid .pid-blink { animation: pidBlink 1.6s steps(2) var(--dl, 0s) infinite; }
@keyframes pidBlink { 50% { opacity: 0.25; } }
.arm-pid .pid-twinkle { animation: pidPulse 1.8s ease-in-out var(--dl, 0s) infinite; }
.arm-pid .pid-level { animation: pidLevel 3s ease-in-out infinite; }
@keyframes pidLevel { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
.arm-pid .pid-leader { fill: none; stroke-width: 1.2; stroke-dasharray: 4 4; opacity: 0.7; animation: pidFlow 1.4s linear infinite; }
.arm-pid .pid-ping { transform-box: fill-box; transform-origin: center; animation: pidPing 2.2s ease-out infinite; }
@keyframes pidPing { 0% { transform: scale(0.7); opacity: 0.6; } 100% { transform: scale(1.9); opacity: 0; } }
.arm-pid .pid-num { fill: #FFF; font: 800 11px var(--font-sans, Inter, sans-serif); }
.arm-pid .pid-lbl2 { fill: #FFF; font: 800 11px var(--font-sans, Inter, sans-serif); letter-spacing: 0.02em; }
.arm-pid .pid-val2 { font: 700 10px var(--font-mono, monospace); }
.arm-pid .pid-big { fill: #FFF; font: 800 15px var(--font-mono, monospace); paint-order: stroke; stroke: #0B3B5C; stroke-width: 4px; }
.arm-pid .pid-plate { fill: #0B1220; font: 800 9px var(--font-sans, Inter, sans-serif); }
.arm-pid .pid-tag { fill: #00F0FF; font: 800 12px var(--font-mono, monospace); }
.arm-pid.compact .pid-legend { display: none; }
.arm-pid.compact .pid-info { width: calc(100% - 24px); right: 12px; left: 12px; top: auto; bottom: 12px; }
@media (prefers-reduced-motion: reduce) { .arm-pid * { animation: none !important; } }
`;

  function injectCss() {
    if (document.getElementById("arm-pid-style")) return;
    const st = document.createElement("style");
    st.id = "arm-pid-style";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------- данные ----------
  function num(id) {
    const el = document.getElementById(id);
    const m = el && el.textContent.match(/-?\d+(?:[.,]\d+)?/);
    return m ? parseFloat(m[0].replace(",", ".")) : null;
  }

  function telemetry() {
    const st = (window.state && window.state.telemetry) || {};
    // телефон: живые цифры его климат-карточки приоритетнее
    const tTel = num("mob-bento-temp"), rTel = num("mob-bento-rh");
    const tel = Object.assign({}, st);
    if (tTel != null) tel.environmentTempC = tTel;
    if (rTel != null) tel.parksideRhPercent = rTel;
    const pause = Boolean(tel.isPausePhaseNow) || document.body.classList.contains("chamber-paused");
    tel.isPausePhaseNow = pause;
    let pid = null;
    try { pid = window.ARMCore && window.ARMCore.computeClosedLoopPid ? window.ARMCore.computeClosedLoopPid(tel) : null; } catch (e) {}
    const fx = window.ArmFx && window.ArmFx.telemetry ? window.ArmFx.telemetry() : null;
    return {
      tempC: pid ? pid.tempC : Number(tel.environmentTempC || 15.8),
      rh: pid ? Math.round(pid.rhPct) : Math.round(Number(tel.parksideRhPercent || 58)),
      vpd: pid ? pid.vpdKpa : null,
      dew: pid ? pid.dewPointC : null,
      coil: Number(tel.dehumicoilTempC != null ? tel.dehumicoilTempC : 5.1),
      eev: pid ? pid.recEevSteps : Number(tel.eev1Steps || 315),
      hz: fx ? fx.fanHz : (pid ? pid.recHz : 30),
      fanKw: pid ? pid.fanShaftKwNow : null,
      status: pid ? pid.statusRu : "",
      statusCol: pid ? pid.statusCol : "#2DD4BF",
      pause,
    };
  }

  const f1 = (v) => (v == null || isNaN(v) ? "—" : (v >= 0 ? "+" : "") + Number(v).toFixed(1));
  const f2 = (v) => (v == null || isNaN(v) ? "—" : Number(v).toFixed(2));

  // описание узлов: что показываем и откуда это число
  const NODES = {
    comp: { t: "Компрессор Scroll • Panasonic C-SCP400H38A", rows: (d) => [
      ["Хладагент", "R410A • 2×10 кг", "a"], ["Режим", d.pause ? "пауза диффузии" : "работа"], ["Давление нагнетания", "датчика нет", "m"]],
      src: "Модель и заправка — паспорт AIM AGHD-250ELC. Давления в АРМ не передаются." },
    reheat: { t: "Догрев-конденсатор (Reheat)", rows: (d) => [
      ["Назначение", "возврат тепла в воздух"], ["Воздух после догрева", "датчика нет", "m"], ["Экономия тепла в паузе", "≈81%", "a"]],
      src: "Конденсатор отдаёт тепло сжатия воздуху камеры — осушение без охлаждения рыбы." },
    recv: { t: "Ресивер жидкого R410A", rows: () => [["Функция", "запас жидкости"], ["Уровень", "датчика нет", "m"]], src: "Схемный элемент контура." },
    filter: { t: "Фильтр-осушитель + смотровое стекло", rows: () => [["Функция", "влага / пузыри в жидкости"], ["Состояние", "визуально по стеклу", "m"]], src: "Проверка — глазами на месте." },
    eev: { t: "Электронный ТРВ 1#EEV", rows: (d) => [["Шаг клапана", d.eev + " st", "a"], ["Диапазон", "205 – 460 st"], ["Логика", d.status || "—"]],
      src: "Шаг — рекомендация ПИД-логики ядра ARMCore по VPD и ΔT поверхности, не замер с контроллера." },
    evap: { t: "V-испаритель 1#Dehumicoil", rows: (d) => [["Температура ламелей", f1(d.coil) + " °C"], ["Точка росы воздуха", f1(d.dew) + " °C"],
      d.dew == null ? ["Ламели и роса", "—"]
        : d.dew > d.coil ? ["Ламели холоднее росы на", (d.dew - d.coil).toFixed(1) + " °C", "a"]
        : ["Ламели теплее росы — влага не выпадает", (d.coil - d.dew).toFixed(1) + " °C", "a"]],
      src: "Ламели холоднее точки росы → влага выпадает конденсатом. Точка росы — расчёт по T и rH." },
    cond: { t: "Сбор конденсата → трап 60 см", rows: (d) => [["Поддон", "под V-испарителем"], ["Расход", "датчика нет", "m"], ["Капли", d.pause ? "реже (пауза)" : "идёт отжим"]],
      src: "Скорость влагосъёма в АРМ сейчас не измеряется." },
    fans: { t: "4 × Cantoni 3 кВт (обдув тележек)", rows: (d) => [["Частота ПЧ", d.hz + " Гц", "a"], ["Мощность на валу", d.fanKw == null ? "—" : d.fanKw + " кВт"], ["Режим", d.pause ? "пауза" : "сушка"]],
      src: "Гц — уставка АРМ; кВт — расчёт по закону куба от 12 кВт при 50 Гц." },
    recovery: { t: "Воздуховод рекуперации тепла в цех", rows: () => [["Назначение", "избыток тепла конденсации → цех"], ["Мощность", "≈14 кВт (паспорт)", "a"], ["Замер", "датчика нет", "m"]],
      src: "Паспортное значение AIM AGHD-250ELC; летом тепло сбрасывается наружу." },
    chamber: { t: "Камера сушки • 15 тележек", rows: (d) => [["Температура", f1(d.tempC) + " °C"], ["Влажность", d.rh + " %"], ["VPD", f2(d.vpd) + " кПа", "a"], ["Статус", d.status || "—"]],
      src: "T и rH — телеметрия АРМ; VPD и статус — расчёт ядра ARMCore." },
  };

  // ---------- рисование ----------
  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------- рисование: инженерный разрез в боковой проекции (по мотивам 3D-фоторазреза) ----------
  // Слева — тоннель сушки с турбинами в потолке и 4 тележками рыбы (видимый ряд из 15),
  // в центре — V-испаритель, поддон, трап и золотой догрев, справа — машинный отсек AIM
  // (компрессор, ресивер, фильтр, манометры, щит) и воздуховод рекуперации.
  const W = 1600, H = 820;

  function build(svg) {
    const defs = el("defs", {}, svg);
    const grad = (id, stops, attrs, kind) => {
      const g = el(kind || "linearGradient", Object.assign({ id }, attrs || {}), defs);
      stops.forEach(([o, c, op]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": op == null ? 1 : op }, g));
      return g;
    };
    const H_ = { x1: 0, y1: 0, x2: 1, y2: 0 }, V_ = { x1: 0, y1: 0, x2: 0, y2: 1 }, R_ = { cx: 0.5, cy: 0.5, r: 0.5 };
    grad("pgSteel", [[0, "#4B5563"], [0.2, "#D1D9E2"], [0.5, "#7C8896"], [0.8, "#E2E8F0"], [1, "#4B5563"]], H_);
    grad("pgSteelV", [[0, "#E2E8F0"], [0.45, "#8A96A3"], [1, "#3F4955"]], V_);
    grad("pgChamber", [[0, "#2B1E0D"], [0.5, "#17110A"], [1, "#0A0B0F"]], V_);
    grad("pgLedWash", [[0, "#FFC46B", 0.32], [1, "#FFC46B", 0]], V_);
    grad("pgFish", [[0, "#6B2A0E"], [0.3, "#C2670A"], [0.55, "#FCD98A"], [0.78, "#D97706"], [1, "#6B2A0E"]], H_);
    grad("pgIce", [[0, "#0B3B5C"], [0.45, "#38BDF8"], [0.8, "#BAE6FD"], [1, "#F0F9FF"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad("pgGold", [[0, "#6B2F0A"], [0.28, "#E0880B"], [0.5, "#FDE68A"], [0.72, "#E0880B"], [1, "#6B2F0A"]], H_);
    grad("pgHeat", [[0, "#EF4444", 0], [0.5, "#F97316", 0.45], [1, "#EF4444", 0]], H_);
    grad("pgBlack", [[0, "#030406"], [0.32, "#2E333C"], [0.48, "#7B8290"], [0.6, "#2A2E36"], [1, "#030406"]], H_);
    grad("pgShadow", [[0, "#000", 0.75], [1, "#000", 0]], R_, "radialGradient");
    grad("pgFloor", [[0, "#151C2A"], [1, "#04060A"]], V_);
    grad("pgGlass", [[0, "#A5D8FF", 0.10], [0.5, "#A5D8FF", 0.02], [1, "#A5D8FF", 0.07]], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad("pgFace", [[0, "#FFFFFF"], [0.8, "#E2E8F0"], [1, "#94A3B8"]], R_, "radialGradient");
    grad("pgHub", [[0, "#FFFFFF"], [0.5, "#94A3B8"], [1, "#1E293B"]], { cx: 0.35, cy: 0.35, r: 0.7 }, "radialGradient");
    grad("pgMist", [[0, "#F0F9FF", 0.9], [0.5, "#E0F2FE", 0.35], [1, "#E0F2FE", 0]], R_, "radialGradient");
    grad("pgWater",[[0, "#67E8F9", 0.9], [1, "#0E7490", 0.9]], V_);
    [["pgDotC", "#E0F2FE", "#38BDF8"], ["pgDotW", "#FFF7D6", "#F59E0B"], ["pgDotH", "#FFE4E6", "#EF4444"], ["pgDotL", "#FEF9C3", "#EAB308"]].forEach(([id, a, b]) =>
      grad(id, [[0, a, 1], [0.35, b, 0.85], [1, b, 0]], R_, "radialGradient"));

    const hatch = el("pattern", { id: "pgHatch", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 8, height: 8, fill: "#1B2433" }, hatch);
    el("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#2F3D52", "stroke-width": 2.5 }, hatch);
    const fins = el("pattern", { id: "pgFins", width: 5, height: 5, patternUnits: "userSpaceOnUse" }, defs);
    el("line", { x1: 0, y1: 0, x2: 0, y2: 5, stroke: "rgba(255,255,255,0.32)", "stroke-width": 1 }, fins);
    const grid = el("pattern", { id: "pgGrid", width: 40, height: 40, patternUnits: "userSpaceOnUse" }, defs);
    el("path", { d: "M40 0H0V40", fill: "none", stroke: "rgba(0,240,255,0.045)" }, grid);

    // тушка, подвешенная за хвост
    const fishS = el("symbol", { id: "pgFishS", viewBox: "-8 0 16 44", overflow: "visible" }, defs);
    el("path", { d: "M0,0 L-5,8 L0,5.5 L5,8 Z", fill: "#8A3B0C" }, fishS);
    el("path", { d: "M0,5 C6.5,10 7,26 4,36 C2,42 -2,42 -4,36 C-7,26 -6.5,10 0,5 Z", fill: "url(#pgFish)", stroke: "rgba(60,25,5,0.65)", "stroke-width": 0.6 }, fishS);
    el("path", { d: "M-2.5,13 Q0.5,22 -1.5,31", stroke: "rgba(255,240,200,0.5)", "stroke-width": 0.8, fill: "none" }, fishS);
    el("circle", { cx: -1.6, cy: 37.5, r: 1.1, fill: "#140C05" }, fishS);

    const nodes = {};
    function node(id, x, y, w, h) {
      const g = el("g", { class: "pid-node", "data-id": id, tabindex: "0" }, svg);
      el("rect", { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: 12, class: "pid-halo" }, g);
      nodes[id] = g;
      return g;
    }
    function movers(parent, d, n, dur, fill, r) {
      for (let i = 0; i < n; i++) {
        const c = el("circle", { r: r || 4, fill, class: "pid-air" }, parent);
        el("animateMotion", { dur: dur + "s", repeatCount: "indefinite", begin: (-(i * dur) / n).toFixed(2) + "s", path: d }, c);
      }
    }
    function callout(x, y, n, title, col, w) {
      const g = el("g", { class: "pid-callout", transform: `translate(${x},${y})` }, svg);
      el("circle", { cx: 0, cy: 0, r: 15, fill: col, opacity: 0.25, class: "pid-ping" }, g);
      el("circle", { cx: 0, cy: 0, r: 11, fill: "#070912", stroke: col, "stroke-width": 2.2 }, g);
      el("text", { x: 0, y: 4, "text-anchor": "middle", class: "pid-num" }, g, String(n));
      el("rect", { x: 16, y: -16, width: w || 200, height: 32, rx: 7, fill: "rgba(7,9,18,0.9)", stroke: col, "stroke-opacity": 0.6 }, g);
      el("text", { x: 25, y: -2, class: "pid-lbl2" }, g, title);
      return el("text", { x: 25, y: 11, class: "pid-val2", fill: col }, g, "");
    }
    const leader = (d, col) => el("path", { d, class: "pid-leader", stroke: col }, svg);

    // фон, сетка, пол
    el("rect", { width: W, height: H, fill: "#06080D" }, svg);
    el("rect", { width: W, height: H, fill: "url(#pgGrid)" }, svg);
    el("rect", { x: 0, y: 700, width: W, height: 120, fill: "url(#pgFloor)" }, svg);
    el("line", { x1: 0, y1: 700, x2: W, y2: 700, stroke: "rgba(148,163,184,0.35)", "stroke-width": 1.5 }, svg);
    el("text", { x: 24, y: 32, class: "pid-tag" }, svg, "2D CAD • РАЗРЕЗ: КАМЕРА 15 ТЕЛЕЖЕК + AIM AGHD-250ELC • R410A");

    // ===== ТОННЕЛЬ СУШКИ =====
    el("rect", { x: 40, y: 110, width: 870, height: 590, fill: "url(#pgHatch)", stroke: "#475569", "stroke-width": 1.5 }, svg);
    el("rect", { x: 60, y: 130, width: 850, height: 560, fill: "url(#pgChamber)" }, svg);
    el("rect", { x: 60, y: 130, width: 850, height: 102, fill: "#0A0E15" }, svg); // пленум
    el("rect", { x: 889, y: 145, width: 22, height: 72, fill: "#0A0E15" }, svg);    // проём подачи из AIM
    el("rect", { x: 889, y: 590, width: 22, height: 98, fill: "#0A0E15" }, svg);    // всасывание в AIM
    el("rect", { x: 60, y: 232, width: 850, height: 8, fill: "url(#pgSteelV)" }, svg);
    el("rect", { x: 80, y: 240, width: 790, height: 3, fill: "#FFD9A0", class: "pid-led" }, svg);
    el("rect", { x: 60, y: 243, width: 850, height: 170, fill: "url(#pgLedWash)", class: "pid-breathe" }, svg);
    // линии тока в тоннеле: по пленуму влево, вниз у стены, сквозь тележки вправо
    [190, 205].forEach((y) => el("path", { d: `M 880,${y} L 100,${y}`, class: "pid-airline warm" }, svg));
    el("path", { d: "M 92,215 L 92,660", class: "pid-airline warm" }, svg);
    [360, 450, 540, 630].forEach((y) => el("path", { d: `M 100,${y} L 885,${y}`, class: "pid-airline cold" }, svg));

    // [1] турбины Cantoni в потолочном пленуме
    const fansG = node("fans", 150, 140, 620, 86);
    const fanRotors = [];
    [190, 370, 550, 730].forEach((x) => {
      el("circle", { cx: x, cy: 183, r: 39, fill: "#05070B", stroke: "url(#pgSteel)", "stroke-width": 6 }, fansG);
      [30, 21].forEach((r) => el("circle", { cx: x, cy: 183, r, fill: "none", stroke: "rgba(203,213,225,0.25)", "stroke-width": 1 }, fansG));
      const rot = el("g", { class: "pid-fan" }, fansG);
      for (let b = 0; b < 5; b++) {
        el("path", { d: `M ${x},${183} C ${x + 8},${183 - 10} ${x + 26},${183 - 18} ${x + 30},${183 - 6} C ${x + 22},${183 - 2} ${x + 10},${183 + 2} ${x},${183} Z`,
          fill: "#7DD3FC", "fill-opacity": 0.85, transform: `rotate(${b * 72} ${x} 183)` }, rot);
      }
      el("circle", { cx: x, cy: 183, r: 7, fill: "url(#pgHub)" }, rot);
      fanRotors.push(rot);
    });

    // [2] тележки SS304 с рыбой (видимый ряд из 15)
    const chG = node("chamber", 130, 292, 740, 400);
    [140, 330, 520, 710].forEach((x0, ti) => {
      el("ellipse", { cx: x0 + 75, cy: 694, rx: 88, ry: 8, fill: "url(#pgShadow)" }, chG);
      el("rect", { x: x0, y: 296, width: 6, height: 380, fill: "url(#pgSteel)" }, chG);
      el("rect", { x: x0 + 144, y: 296, width: 6, height: 380, fill: "url(#pgSteel)" }, chG);
      el("rect", { x: x0, y: 294, width: 150, height: 6, fill: "url(#pgSteelV)" }, chG);
      el("rect", { x: x0, y: 660, width: 150, height: 6, fill: "url(#pgSteelV)" }, chG);
      for (let k = 0; k < 7; k++) {
        const ry = 322 + k * 46;
        el("rect", { x: x0 + 4, y: ry, width: 142, height: 3, fill: "#CBD5E1", opacity: 0.8 }, chG);
        for (let j = 0; j < 6; j++) {
          const u = el("use", { href: "#pgFishS", x: x0 + 6 + j * 23, y: ry + 1, width: 19, height: 42, class: "pid-fish" }, chG);
          u.style.animationDelay = (-((ti * 7 + k * 3 + j * 5) % 17) * 0.21).toFixed(2) + "s";
          // точка подвеса — абсолютно: у <use> c x/y в Chrome fill-box считается неверно и рыба «разъезжается»
          u.style.transformOrigin = `${x0 + 6 + j * 23 + 9.5}px ${ry + 1}px`;
        }
      }
      [x0 + 14, x0 + 136].forEach((cx) => {
        el("circle", { cx, cy: 684, r: 9, fill: "#111318", stroke: "#64748B", "stroke-width": 2 }, chG);
        el("circle", { cx, cy: 684, r: 3, fill: "#94A3B8" }, chG);
      });
    });
    // испарение с рыбы
    for (let i = 0; i < 16; i++) {
      const m = el("ellipse", { cx: 160 + ((i * 97) % 680), cy: 380 + ((i * 53) % 260), rx: 20, ry: 12, fill: "url(#pgMist)", class: "pid-mist" }, svg);
      m.style.setProperty("--d", (4.5 + (i % 4)) + "s");
      m.style.setProperty("--dl", (-i * 0.6).toFixed(1) + "s");
    }

    // ===== КОЛОННА ОСУШЕНИЯ =====
    el("rect", { x: 910, y: 130, width: 300, height: 570, fill: "#090D14", stroke: "#334155", "stroke-width": 1.5 }, svg);
    el("rect", { x: 905, y: 140, width: 280, height: 80, fill: "#0E1420", stroke: "#334155" }, svg); // верхний короб возврата
    el("rect", { x: 1135, y: 140, width: 50, height: 182, fill: "#0E1420", stroke: "#334155" }, svg);

    // [3] V-испаритель
    const evG = node("evap", 930, 286, 160, 282);
    [["928,300 970,300 1013,560 994,560"], ["1050,300 1092,300 1026,560 1007,560"]].forEach(([pts]) => {
      el("polygon", { points: pts, fill: "url(#pgIce)", stroke: "#7DD3FC", "stroke-width": 1.5 }, evG);
      el("polygon", { points: pts, fill: "url(#pgFins)" }, evG);
    });
    for (let i = 0; i < 10; i++) {
      const s = el("circle", { cx: 950 + (i % 2 ? 100 : 0) + (i % 2 ? -1 : 1) * i * 4.5, cy: 315 + i * 23, r: 1.8, fill: "#FFFFFF", class: "pid-twinkle" }, evG);
      s.style.setProperty("--dl", (-i * 0.37).toFixed(2) + "s");
    }
    el("rect", { x: 1000, y: 288, width: 20, height: 10, rx: 2, fill: "#D4A017", stroke: "#FDE68A" }, evG); // распределитель-«паук»
    const coilVal = el("text", { x: 1010, y: 440, "text-anchor": "middle", class: "pid-big" }, evG, "—");
    // поддон
    el("path", { d: "M 982,566 L 1040,566 L 1034,580 L 988,580 Z", fill: "url(#pgSteelV)", stroke: "#94A3B8" }, evG);

    // [5] трап и капли
    const cdG = node("cond", 984, 586, 54, 186);
    for (let i = 0; i < 5; i++) {
      const d = el("ellipse", { cx: 998 + i * 6, cy: 584, rx: 2, ry: 3.2, fill: "#7DD3FC", class: "pid-drop2" }, cdG);
      d.style.setProperty("--dl", (-i * 0.29).toFixed(2) + "s");
    }
    el("rect", { x: 984, y: 702, width: 54, height: 66, fill: "url(#pgSteel)", stroke: "#475569" }, cdG);
    el("ellipse", { cx: 1011, cy: 704, rx: 27, ry: 6, fill: "url(#pgWater)" }, cdG);
    for (let i = 0; i < 3; i++) {
      const r = el("ellipse", { cx: 1004 + i * 7, cy: 704, rx: 14, ry: 3, fill: "none", stroke: "#A5F3FC", "stroke-width": 1, class: "pid-ripple" }, cdG);
      r.style.setProperty("--dl", (-i * 0.45).toFixed(2) + "s");
    }

    // [4] догрев (золотой конденсатор)
    const rhG = node("reheat", 1135, 320, 50, 282);
    el("rect", { x: 1135, y: 320, width: 50, height: 280, rx: 4, fill: "url(#pgGold)", stroke: "#F59E0B", "stroke-width": 1.5 }, rhG);
    el("rect", { x: 1135, y: 320, width: 50, height: 280, rx: 4, fill: "url(#pgFins)" }, rhG);
    el("rect", { x: 1120, y: 320, width: 80, height: 280, fill: "url(#pgHeat)", class: "pid-heat" }, rhG);
    for (let y = 335; y < 600; y += 26) el("path", { d: `M 1135,${y} q -8,6.5 0,13 M 1185,${y + 13} q 8,6.5 0,13`, stroke: "#B45309", "stroke-width": 2.5, fill: "none" }, rhG);

    // воздух: тоннель (тёплый) → колонна вниз-вверх через V (холодный) → догрев (горячий) → пленум
    const airG = el("g", { class: "pid-air-g" }, svg);
    [360, 450, 540, 630].forEach((y, i) => movers(airG, `M 1150,178 L 900,184 L 120,186 Q 92,192 92,224 L 92,${y} L 880,${y} L 924,648`, 5, 10 + i * 0.6, "url(#pgDotW)", 5));
    movers(airG, "M 924,648 L 928,300 Q 960,262 1000,302 L 1010,540 L 1060,612 L 1160,602", 6, 4.2, "url(#pgDotC)", 5);
    movers(airG, "M 1160,602 L 1160,330 L 1160,182 L 1150,176", 6, 3, "url(#pgDotH)", 5);

    // ===== ТРУБЫ ФРЕОНА =====
    const PIPES = [
      ["hot", "M 1290,532 L 1290,470 L 1185,470"],
      ["liq", "M 1160,600 L 1160,640 L 1472,640 L 1472,600"],
      ["liq", "M 1472,420 L 1472,310 L 1112,310 L 1020,296"],
      ["cold", "M 950,300 L 950,272 L 1330,272 L 1330,548"],
    ];
    const pipeG = el("g", {}, svg);
    PIPES.forEach(([k, d]) => {
      el("path", { d, class: "pid-pipe-base " + k }, pipeG);
      el("path", { d, class: "pid-pipe " + k }, pipeG);
      el("path", { d, class: "pid-flow " + k }, pipeG);
      movers(pipeG, d, 3, k === "hot" ? 1.6 : 2.6, k === "hot" ? "url(#pgDotH)" : k === "cold" ? "url(#pgDotC)" : "url(#pgDotL)", 4);
    });

    // [7] 1#EEV
    const eevG = node("eev", 1084, 266, 34, 52);
    el("rect", { x: 1088, y: 300, width: 26, height: 18, rx: 3, fill: "#D4A017", stroke: "#FDE68A" }, eevG);
    el("rect", { x: 1092, y: 270, width: 18, height: 30, rx: 4, fill: "#0B0F16", stroke: "#FBBF24", "stroke-width": 1.5 }, eevG);
    el("circle", { cx: 1101, cy: 280, r: 3, fill: "#FBBF24", class: "pid-twinkle" }, eevG);
    const eevVal = el("text", { x: 1120, y: 292, class: "pid-val2", fill: "#FBBF24" }, eevG, "—");

    // ===== МАШИННЫЙ ОТСЕК AIM =====
    el("rect", { x: 1205, y: 252, width: 360, height: 10, fill: "url(#pgSteelV)" }, svg);
    el("rect", { x: 1210, y: 262, width: 350, height: 438, fill: "#0A0E15", stroke: "#64748B", "stroke-width": 3 }, svg);
    el("text", { x: 1385, y: 690, "text-anchor": "middle", class: "pid-tag", opacity: 0.6 }, svg, "AIM AGHD-250ELC • R410A • 2×10 кг");

    // манометры HP / LP
    [[1250, 380, "HP"], [1300, 380, "LP"]].forEach(([cx, cy, t]) => {
      el("circle", { cx, cy, r: 21, fill: "url(#pgFace)", stroke: "url(#pgSteel)", "stroke-width": 4 }, svg);
      for (let a = -120; a <= 120; a += 30) {
        const r1 = 14, r2 = 17, rad = (a - 90) * Math.PI / 180;
        el("line", { x1: cx + Math.cos(rad) * r1, y1: cy + Math.sin(rad) * r1, x2: cx + Math.cos(rad) * r2, y2: cy + Math.sin(rad) * r2, stroke: "#334155", "stroke-width": 1 }, svg);
      }
      const n = el("line", { x1: cx, y1: cy, x2: cx + (t === "HP" ? 10 : -8), y2: cy - 11, stroke: "#DC2626", "stroke-width": 1.8, "stroke-linecap": "round", class: "pid-needle" }, svg);
      n.style.transformOrigin = `${cx}px ${cy}px`;
      el("circle", { cx, cy, r: 2.5, fill: "#111" }, svg);
      el("text", { x: cx, y: cy + 36, "text-anchor": "middle", class: "pid-val2", fill: "#94A3B8" }, svg, t + " — бар");
    });

    // [6] компрессор Panasonic Scroll
    const cpG = node("comp", 1246, 520, 92, 172);
    el("ellipse", { cx: 1290, cy: 694, rx: 56, ry: 8, fill: "url(#pgShadow)" }, cpG);
    const vib = el("g", { class: "pid-vib" }, cpG);
    el("rect", { x: 1252, y: 560, width: 76, height: 124, rx: 10, fill: "url(#pgBlack)" }, vib);
    el("path", { d: "M 1252,568 Q 1252,528 1290,528 Q 1328,528 1328,568 Z", fill: "url(#pgBlack)" }, vib);
    el("rect", { x: 1262, y: 600, width: 56, height: 18, rx: 2, fill: "#E5E7EB" }, vib);
    el("text", { x: 1290, y: 613, "text-anchor": "middle", class: "pid-plate" }, vib, "Panasonic");
    el("rect", { x: 1244, y: 680, width: 92, height: 8, rx: 2, fill: "#334155" }, cpG);

    // [9] ресивер
    const rvG = node("recv", 1452, 416, 40, 188);
    el("rect", { x: 1455, y: 420, width: 34, height: 180, rx: 17, fill: "url(#pgBlack)", stroke: "#475569" }, rvG);
    el("rect", { x: 1466, y: 466, width: 12, height: 104, rx: 3, fill: "#05070B", stroke: "#94A3B8", "stroke-width": 0.8 }, rvG);
    el("rect", { x: 1467, y: 500, width: 10, height: 69, fill: "#F59E0B", opacity: 0.9, class: "pid-level" }, rvG);

    // [8] фильтр-осушитель + смотровое стекло
    const flG = node("filter", 1360, 298, 84, 24);
    el("rect", { x: 1400, y: 302, width: 42, height: 16, rx: 8, fill: "#1F2937", stroke: "#94A3B8" }, flG);
    el("circle", { cx: 1372, cy: 310, r: 9, fill: "#0B0F16", stroke: "#D4A017", "stroke-width": 2 }, flG);
    el("circle", { cx: 1372, cy: 310, r: 4, fill: "#34D399", class: "pid-twinkle" }, flG);

    // щит управления с индикаторами
    el("rect", { x: 1500, y: 300, width: 48, height: 100, rx: 4, fill: "#CBD5E1", opacity: 0.92 }, svg);
    ["#22C55E", "#22C55E", "#F59E0B", "#38BDF8", "#EF4444"].forEach((c, i) => {
      const l = el("circle", { cx: 1512 + (i % 3) * 12, cy: 318 + Math.floor(i / 3) * 16, r: 3.5, fill: c, class: "pid-blink" }, svg);
      l.style.setProperty("--dl", (-i * 0.4) + "s");
    });
    el("rect", { x: 1210, y: 262, width: 350, height: 438, fill: "url(#pgGlass)", "pointer-events": "none" }, svg);

    // [10] воздуховод рекуперации с рёбрами и паром
    const rcG = node("recovery", 1396, 70, 204, 190);
    const duct = "M 1420,256 L 1420,160 Q 1420,104 1478,100 L 1600,100";
    el("path", { d: duct, fill: "none", stroke: "#334155", "stroke-width": 50, "stroke-linecap": "butt" }, rcG);
    el("path", { d: duct, fill: "none", stroke: "url(#pgSteel)", "stroke-width": 44 }, rcG);
    for (let i = 0; i < 9; i++) {
      const y = 240 - i * 16;
      if (y > 150) el("line", { x1: 1398, y1: y, x2: 1442, y2: y, stroke: "rgba(30,41,59,0.6)", "stroke-width": 2 }, rcG);
    }
    for (let x = 1496; x < 1600; x += 16) el("line", { x1: x, y1: 78, x2: x, y2: 122, stroke: "rgba(30,41,59,0.6)", "stroke-width": 2 }, rcG);
    for (let i = 0; i < 5; i++) {
      const s = el("ellipse", { cx: 1560, cy: 100, rx: 12, ry: 8, fill: "#FED7AA", class: "pid-steam" }, rcG);
      s.style.setProperty("--dl", (-i * 0.8) + "s");
    }

    // выноски с номерами (как на 3D-фоторазрезе)
    const hzVal = callout(160, 68, 1, "ТУРБИНЫ CANTONI 4×3 кВт", "#38BDF8", 210);
    leader("M 171,80 L 190,144", "#38BDF8");
    const chT = callout(430, 268, 2, "15 ТЕЛЕЖЕК SS304", "#FBBF24", 200);
    const evapLbl = callout(700, 74, 3, "V-ИСПАРИТЕЛЬ 1#DEHUMICOIL", "#38BDF8", 236);
    leader("M 940,90 L 990,296", "#38BDF8");
    const rhLbl = callout(1010, 22, 4, "ДОГРЕВ REHEAT COIL", "#F59E0B", 190);
    leader("M 1170,38 L 1160,322", "#F59E0B");
    const cdLbl = callout(1048, 786, 5, "ТРАП 60 СМ • КОНДЕНСАТ", "#2DD4BF", 206);
    const cpLbl = callout(1340, 732, 6, "PANASONIC SCROLL", "#EF4444", 180);
    leader("M 1340,720 L 1310,688", "#EF4444");
    const rcLbl = callout(1250, 40, 7, "РЕКУПЕРАЦИЯ В ЦЕХ", "#2DD4BF", 186);
    evapLbl.textContent = "кипение ниже точки росы → конденсат";
    rhLbl.textContent = "горячий газ R410A греет воздух";
    cdLbl.textContent = "отжатая влага в трап";
    cpLbl.textContent = "R410A • сжатие пара";
    rcLbl.textContent = "≈14 кВт • паспорт";

    return { nodes, eevVal, coilVal, chT, hzVal, fanRotors };
  }

  function mount(host, opts) {
    if (!host) return null;
    injectCss();
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "arm-pid" + (opts.compact ? " compact" : "");
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": "P&ID-схема контура R410A и воздушной петли" });
    // на телефоне схема шире экрана — листается пальцем вбок
    const scroller = document.createElement("div");
    scroller.className = "pid-scroll";
    scroller.appendChild(svg);
    wrap.appendChild(scroller);
    const info = document.createElement("div");
    info.className = "pid-info";
    wrap.appendChild(info);
    const legend = document.createElement("div");
    legend.className = "pid-legend";
    legend.innerHTML = '<span><i style="background:#FF8A3D"></i>горячий газ</span><span><i style="background:#FBBF24"></i>жидкость</span>' +
      '<span><i style="background:#38BDF8"></i>всасывание</span><span><i style="background:#67E8F9"></i>конденсат</span>' +
      '<span><i style="background:rgba(0,240,255,0.35)"></i>воздух</span><span>• нажмите на узел</span>';
    wrap.appendChild(legend);
    host.appendChild(wrap);

    const refs = build(svg);
    let selected = null;

    function renderInfo() {
      if (!selected) { info.classList.remove("on"); return; }
      const d = telemetry();
      const n = NODES[selected];
      info.innerHTML = `<h4><span>${n.t}</span><button type="button" aria-label="Закрыть">✕</button></h4>` +
        n.rows(d).map(([k, v, c]) => `<div class="row"><span>${k}</span><b class="${c || ""}">${v}</b></div>`).join("") +
        `<div class="src">${n.src}</div>`;
      info.querySelector("button").onclick = () => select(null);
      info.classList.add("on");
    }

    function select(id, force) {
      selected = id === selected && !force ? null : id;
      Object.keys(refs.nodes).forEach((k) => refs.nodes[k].classList.toggle("sel", k === selected));
      renderInfo();
    }

    svg.addEventListener("click", (e) => {
      const n = e.target.closest && e.target.closest(".pid-node");
      select(n ? n.getAttribute("data-id") : null);
    });
    svg.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const n = e.target.closest && e.target.closest(".pid-node");
      if (n) { e.preventDefault(); select(n.getAttribute("data-id")); }
    });

    function update() {
      if (!wrap.isConnected) return;
      if (wrap.offsetParent === null) return;
      const d = telemetry();
      wrap.classList.toggle("paused", d.pause);
      refs.eevVal.textContent = "1#EEV " + d.eev + " st";
      refs.coilVal.textContent = f1(d.coil) + "°C";
      refs.chT.textContent = f1(d.tempC) + "°C • " + d.rh + "% • VPD " + f2(d.vpd);
      refs.hzVal.textContent = d.hz + " Гц • " + (d.pause ? "пауза" : "сушка");
      // скорость крыльчаток — от частоты ПЧ (30 Гц ≈ 0.6 с на оборот в мультипликации)
      wrap.style.setProperty("--fan-dur", (0.6 * 30 / Math.max(5, d.pause ? 8 : d.hz)).toFixed(2) + "s");
      if (selected) renderInfo();
    }
    update();
    const timer = setInterval(update, 1500);

    if (opts.select) select(opts.select);
    // на узком экране сразу показываем середину: испаритель, EEV и догрев
    if (opts.compact) requestAnimationFrame(() => {
      scroller.scrollLeft = Math.max(0, 900 * (1010 / W) - scroller.clientWidth / 2);
    });

    return {
      el: wrap,
      select,
      destroy() { clearInterval(timer); wrap.remove(); },
    };
  }

  // описание узла для других экранов (выноски 3D-двойника)
  function describe(id) {
    const n = NODES[id];
    if (!n) return null;
    return { title: n.t, rows: n.rows(telemetry()), src: n.src };
  }

  window.ArmPid = { mount, telemetry, describe };
})();
