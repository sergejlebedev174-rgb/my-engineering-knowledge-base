// Торговый Дом: три верхних визуальных блока (влагосъём + таймер фазы, срез тушки, фасовка KOMET / TUBA).
// Заменяет черновые блоки Gemini. Все цифры — из базы знаний (knowledge/*.js) или расчёт по модели,
// время — от старта партии по часам компьютера (тот же ключ, что на главной). Связи с контроллером нет —
// и экран так прямо и пишет.
(function () {
  "use strict";
  const CYCLE_KEY = "JURMALCIEMS_CYCLE_START_V1";
  const CYCLE_H = 84;
  const BOUNDS = [0, 12, 38, 72, 84]; // та же 84-часовая модель, что на главной и в симуляторе
  const STAGE_NAMES = ["Подвяливание", "Основная сушка", "Отволаживание", "Финиш"];
  const STAGE_COL = ["#38BDF8", "#2DD4BF", "#FBBF24", "#A78BFA"];
  const DEF = [
    { w: 3.5, p: 1, hzW: "30 Гц", hzP: "20 Гц", share: 48, t: 15.5, rh: 66 },
    { w: 3, p: 1.5, hzW: "30 Гц", hzP: "18–20 Гц", share: 32, t: 15.5, rh: 58 },
    { w: 2.5, p: 2, hzW: "30 Гц", hzP: "15–18 Гц", share: 16, t: 15, rh: 52 },
    { w: 1, p: 4, hzW: "25.3 Гц", hzP: "15–20 Гц", share: 4, t: 14, rh: 55 },
  ];
  // влажность слоёв тушки по стадиям — условная модель (не замер)
  const LAYERS = [[72, 66, 58], [65, 56, 49], [58, 50, 45], [52, 46, 43]];
  const NS = ["VIMBA", "BREAM", "ROACH", "SMELT", "PERCH", "GOBY"];
  const CUT = { VIMBA: "vimba", BREAM: "bream", ROACH: "roach", SMELT: "smelt", PERCH: "perch", GOBY: "goby" };

  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const fmt = (v) => Math.round(v).toLocaleString("ru-RU");
  const hz = (s, d) => (s ? String(s).split("/")[0].trim() : d);

  function stageKb(i) {
    const d = DEF[i];
    let s = null;
    try { s = window.ARM_KNOWLEDGE.stages["стадии"]["STAGE_" + (i + 1)]; } catch (e) {}
    if (!s) return d;
    const rhArr = s["rH_на_полке_процент"];
    return {
      w: num(s["работа_ч"], d.w), p: num(s["пауза_ч"], d.p),
      hzW: hz(s["вентиляторы_работа"], d.hzW), hzP: hz(s["вентиляторы_пауза"], d.hzP),
      share: num(s["доля_снимаемой_влаги_процент"], d.share),
      t: num(s["цель_температура_C"], d.t),
      rh: num(s["цель_rH_процент"], Array.isArray(rhArr) ? (rhArr[0] + rhArr[1]) / 2 : d.rh),
    };
  }
  function stages() {
    const arr = [0, 1, 2, 3].map(stageKb);
    const sum = arr.reduce((a, s) => a + s.share, 0) || 100;
    arr.forEach((s) => (s.frac = s.share / sum));
    return arr;
  }
  function normKey(k) {
    const r = String(k || "VIMBA").toUpperCase();
    return r === "ROUND_GOBY" ? "GOBY" : NS.includes(r) ? r : "VIMBA";
  }
  function canon(k) {
    try { return window.ARM_KB && window.ARM_KB.getCanonicalSpecies ? window.ARM_KB.getCanonicalSpecies(k === "GOBY" ? "ROUND_GOBY" : k) : null; } catch (e) { return null; }
  }
  function cycleHour() {
    try { const s = Number(localStorage.getItem(CYCLE_KEY)); return s > 0 ? Math.max(0, (Date.now() - s) / 3600000) : null; } catch (e) { return null; }
  }
  function stageOf(h) { return h < 12 ? 0 : h < 38 ? 1 : h < 72 ? 2 : 3; }

  // доля снятой влаги к часу h (внутри стадии съём быстрее в начале)
  function cumFrac(h, st) {
    let f = 0;
    for (let i = 0; i < 4; i++) {
      const a = BOUNDS[i], b = BOUNDS[i + 1];
      const x = Math.max(0, Math.min(1, (h - a) / (b - a)));
      f += st[i].frac * (1 - Math.pow(1 - x, 1.5));
    }
    return Math.min(1, f);
  }

  function model(total, fallbackStageNum) {
    const st = stages();
    const h = cycleHour();
    const started = h !== null;
    const hh = started ? Math.min(h, CYCLE_H) : null;
    const si = started ? stageOf(h) : Math.max(0, Math.min(3, (Number(fallbackStageNum) || 2) - 1));
    const s = st[si];
    let drying = true, leftH = s.w, prog = 0;
    if (started) {
      const el = Math.max(0, h - BOUNDS[si]);
      const per = s.w + s.p;
      const pos = el % per;
      drying = pos < s.w;
      const len = drying ? s.w : s.p;
      leftH = drying ? s.w - pos : per - pos;
      prog = Math.max(0, Math.min(1, 1 - leftH / len));
    }
    const removed = started ? total * cumFrac(hh, st) : 0;
    const rate = started && h < CYCLE_H ? Math.max(0, (cumFrac(hh + 0.05, st) - cumFrac(hh, st)) / 0.05 * total) : 0;
    return { st, h, hh, started, si, s, drying, leftH, prog, removed, rate, total, done: started && h >= CYCLE_H };
  }

  function hms(hours) {
    const sec = Math.max(0, Math.round(hours * 3600));
    const H = Math.floor(sec / 3600), M = Math.floor((sec % 3600) / 60), S = sec % 60;
    return (H ? String(H).padStart(2, "0") + ":" : "") + String(M).padStart(2, "0") + ":" + String(S).padStart(2, "0");
  }

  const ICON = {
    drop: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/></svg>',
    scan: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M6 12c2.5-3 7.5-3 10 0-2.5 3-7.5 3-10 0z"/><path d="M16 12l2-1.6v3.2z"/><path d="M3 12h18" opacity=".45"/></svg>',
    box: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  };
  const head = (icon, cls, title, sub, right) => `
    <div class="tfx-head">
      <div class="tfx-head-l">
        <div class="tfx-ico ${cls}">${icon}</div>
        <div><div class="tfx-title">${title}</div><div class="tfx-sub">${sub}</div></div>
      </div>
      <div class="tfx-head-r">${right || ""}</div>
    </div>`;

  // ---------------- график влагосъёма 0–84 ч ----------------
  const GX = (h) => 16 + (h / CYCLE_H) * 300;
  const GY = (f) => 118 - f * 96;
  function curveSvg(m) {
    let d = "";
    for (let h = 0; h <= CYCLE_H; h += 1) d += (h ? " L" : "M") + GX(h).toFixed(1) + " " + GY(cumFrac(h, m.st)).toFixed(1);
    const area = d + ` L${GX(CYCLE_H)} 118 L${GX(0)} 118 Z`;
    let bands = "";
    for (let i = 0; i < 4; i++) {
      const x1 = GX(BOUNDS[i]), x2 = GX(BOUNDS[i + 1]);
      bands += `<rect x="${x1}" y="14" width="${x2 - x1}" height="104" fill="${STAGE_COL[i]}" opacity="${i === m.si ? 0.1 : 0.035}"/>
        <text x="${(x1 + x2) / 2}" y="11" text-anchor="middle" class="tfx-ax ${i === m.si ? "on" : ""}" fill="${STAGE_COL[i]}">СТ.${i + 1}</text>`;
      if (i) bands += `<line x1="${x1}" y1="14" x2="${x1}" y2="118" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 3"/>`;
    }
    const nx = m.started ? GX(m.hh) : -50, ny = m.started ? GY(cumFrac(m.hh, m.st)) : -50;
    return `
      <svg viewBox="0 0 326 132" class="tfx-curve" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tfxArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22D3EE" stop-opacity=".38"/><stop offset="1" stop-color="#2563EB" stop-opacity="0"/></linearGradient>
          <linearGradient id="tfxLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#38BDF8"/><stop offset=".45" stop-color="#2DD4BF"/><stop offset=".85" stop-color="#FBBF24"/><stop offset="1" stop-color="#A78BFA"/></linearGradient>
          <clipPath id="tfxPast"><rect class="tfx-past-clip" x="0" y="0" width="${m.started ? nx : 0}" height="132"/></clipPath>
        </defs>
        ${bands}
        <line x1="16" y1="${GY(0.5)}" x2="316" y2="${GY(0.5)}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
        <text x="318" y="${GY(1) + 3}" class="tfx-ax" fill="#64748B" text-anchor="end">100%</text>
        <text x="318" y="${GY(0.5) - 2}" class="tfx-ax" fill="#64748B" text-anchor="end">50%</text>
        <path d="${area}" fill="url(#tfxArea)" opacity=".35"/>
        <path d="${area}" fill="url(#tfxArea)" clip-path="url(#tfxPast)"/>
        <path d="${d}" fill="none" stroke="rgba(148,163,184,0.35)" stroke-width="1.4" stroke-dasharray="3 4"/>
        <path d="${d}" fill="none" stroke="url(#tfxLine)" stroke-width="2.4" clip-path="url(#tfxPast)" class="tfx-draw" pathLength="1"/>
        <g class="tfx-now" transform="translate(${nx} ${ny})">
          <line x1="0" y1="0" x2="0" y2="${118 - ny}" class="tfx-now-line" stroke="#E0F2FE" stroke-opacity=".35" stroke-dasharray="2 2"/>
          <circle r="9" fill="#22D3EE" opacity=".25" class="tfx-ping"/>
          <circle r="4.2" fill="#22D3EE" stroke="#fff" stroke-width="1.4"/>
        </g>
        <text x="16" y="129" class="tfx-ax" fill="#475569">0 ч</text>
        <text x="${GX(BOUNDS[2])}" y="129" class="tfx-ax" fill="#475569" text-anchor="middle">38</text>
        <text x="${GX(BOUNDS[3])}" y="129" class="tfx-ax" fill="#475569" text-anchor="middle">72</text>
        <text x="316" y="129" class="tfx-ax" fill="#475569" text-anchor="end">84 ч</text>
      </svg>`;
  }

  // ---------------- Блок 1: влагосъём + таймер фазы ----------------
  function water(t, species, stage, diag, yf) {
    const tel = t || (window.state && window.state.telemetry) || {};
    const raw = Math.round(num(tel.batchWeightKg, 1850));
    const out = Math.round(num(yf && yf.finishedAvgKg, raw * 0.615));
    const total = Math.max(0, raw - out);
    const m = model(total, stage && stage.number);
    const C = 289;
    const stageRows = m.st.map((s, i) => {
      const L = Math.round(total * s.frac);
      const state = !m.started ? "" : i < m.si || m.done ? "done" : i === m.si ? "now" : "";
      return `<div class="tfx-stl ${state}" style="--c:${STAGE_COL[i]}"><span>Ст.${i + 1}</span><b>${L} л</b><i>${s.share}%</i></div>`;
    }).join("");
    const fillPct = total ? Math.round((m.removed / total) * 100) : 0;
    const dropDur = m.rate > 0 ? Math.max(0.55, Math.min(4, 18 / m.rate)).toFixed(2) : 0;
    const phaseCol = m.drying ? "#22D3EE" : "#FBBF24";
    const timerInner = m.started && !m.done
      ? `<div class="tfx-digits" data-tfx="left">${hms(m.leftH)}</div><div class="tfx-phase" data-tfx="phase" style="color:${phaseCol}">${m.drying ? "СУШКА • " + m.s.hzW : "ПАУЗА • " + m.s.hzP}</div><div class="tfx-mini">до смены фазы</div>`
      : m.done
        ? `<div class="tfx-digits">ГОТОВО</div><div class="tfx-phase" style="color:#A78BFA">84 ч прошло</div>`
        : `<div class="tfx-digits tfx-dim">--:--</div><div class="tfx-phase" style="color:#64748B">не запущено</div>`;

    return `
      <div class="th-bento-card tfx-card tfx-water" id="tfxWater" data-total="${total}" data-stage="${(stage && stage.number) || 2}">
        ${head(ICON.drop, "c-cyan", "Влагосъём партии и таймер фазы", `Загрузка <b>${fmt(raw)} кг</b> → готовый выход <b class="tc">${fmt(out)} кг</b> • снять всего <b>${fmt(total)} л</b> воды`,
          `<span class="tfx-pill ${m.started ? "" : "off"}">${m.started ? `Ст.${m.si + 1} • ${STAGE_NAMES[m.si]} • <span data-tfx="hour">${m.hh.toFixed(1)}</span> ч из 84` : "Отсчёт партии не запущен"}</span>
           ${m.started ? "" : `<button class="tfx-btn" onclick="window.ArmTradeFx.start()">▶ Старт партии</button>`}`)}
        <div class="tfx-grid3">
          <div class="tfx-panel tfx-trap-wrap">
            <div class="tfx-flask" style="--fill:${fillPct}%; --drop:${dropDur}s">
              <div class="tfx-flask-gloss"></div>
              ${dropDur ? '<i class="tfx-drop d1"></i><i class="tfx-drop d2"></i><i class="tfx-drop d3"></i>' : ""}
              <div class="tfx-liquid" data-tfx="liquid"><svg viewBox="0 0 120 14" preserveAspectRatio="none" class="tfx-wave"><path d="M0,7 Q15,0 30,7 T60,7 T90,7 T120,7 T150,7 T180,7 T210,7 T240,7 L240,14 L0,14 Z"/></svg><span class="tfx-bub b1"></span><span class="tfx-bub b2"></span><span class="tfx-bub b3"></span></div>
              <div class="tfx-tick" style="bottom:75%">75%</div><div class="tfx-tick" style="bottom:50%">50%</div><div class="tfx-tick" style="bottom:25%">25%</div>
              <div class="tfx-flask-val"><b data-tfx="removed">${fmt(m.removed)}</b><span>из ${fmt(total)} л</span></div>
            </div>
            <div class="tfx-trap-info">
              <div class="tfx-kicker">Снято воды • модель</div>
              <div class="tfx-big"><span data-tfx="pct">${fillPct}</span><small>%</small></div>
              <div class="tfx-note">Сейчас ≈ <b data-tfx="rate">${m.rate ? m.rate.toFixed(1) : "0"}</b> л/ч в трап 60 см у V-испарителя</div>
              <div class="tfx-stages">${stageRows}</div>
            </div>
          </div>

          <div class="tfx-panel tfx-timer-wrap">
            <div class="tfx-ring ${m.drying ? "dry" : "pause"}">
              <svg viewBox="0 0 116 116">
                <defs><linearGradient id="tfxRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.drying ? "#2563EB" : "#D97706"}"/><stop offset="1" stop-color="${m.drying ? "#00F0FF" : "#FDE68A"}"/></linearGradient></defs>
                <circle cx="58" cy="58" r="52" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="1 5.8"/>
                <circle cx="58" cy="58" r="46" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="9"/>
                <circle cx="58" cy="58" r="46" fill="none" stroke="url(#tfxRing)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - m.prog)).toFixed(1)}" transform="rotate(-90 58 58)" data-tfx="ring" class="tfx-ring-arc"/>
                <g class="tfx-orbit"><circle cx="58" cy="6" r="2.4" fill="${phaseCol}"/></g>
              </svg>
              <div class="tfx-ring-c">${timerInner}</div>
            </div>
            <div class="tfx-timer-info">
              <div class="tfx-kicker">Регламент стадии • база знаний</div>
              <div class="tfx-reg"><span class="${m.drying ? "on c" : ""}">Сушка ${m.s.w} ч • ${m.s.hzW}</span><span class="${!m.drying ? "on a" : ""}">Пауза ${m.s.p} ч • ${m.s.hzP}</span></div>
              <div class="tfx-kv">
                <div><span>Цель воздуха</span><b>+${m.s.t}°C • ${Math.round(m.s.rh)}%</b></div>
                <div><span>До финиша</span><b data-tfx="finish">${m.started ? (m.done ? "готово" : "≈ " + Math.ceil(CYCLE_H - m.h) + " ч") : "—"}</b></div>
              </div>
              <div class="tfx-honest">○ Таймер по часам компьютера от старта партии • без связи с MCGS</div>
              <div class="tfx-manual">
                <button class="tfx-chip ${!tel.isPausePhaseNow ? "on" : ""}" onclick="if(typeof setScadaPausePhase==='function')setScadaPausePhase(false);" title="Ручная отметка фазы для расчётов программы">Сушка</button>
                <button class="tfx-chip ${tel.isPausePhaseNow ? "on a" : ""}" onclick="if(typeof setScadaPausePhase==='function')setScadaPausePhase(true);" title="Ручная отметка фазы для расчётов программы">Пауза</button>
                <span>ручная отметка</span>
              </div>
            </div>
          </div>

          <div class="tfx-panel tfx-chart-wrap">
            <div class="tfx-chart-top">
              <div class="tfx-kicker">Кривая влагосъёма 0–84 ч</div>
              <div class="tfx-legend"><i class="l1"></i>пройдено <i class="l2"></i>план</div>
            </div>
            ${curveSvg(m)}
            <div class="tfx-chart-kpi">
              <div><span>Сырьё</span><b>${(raw / 1000).toFixed(2)} т</b></div>
              <div><span>Выход</span><b class="tb">${fmt(out)} кг</b></div>
              <div><span>Вода</span><b class="tc">${fmt(total)} л</b></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function tick() {
    const root = document.getElementById("tfxWater");
    if (!root || !root.isConnected) return;
    const total = Number(root.dataset.total) || 0;
    const m = model(total, root.dataset.stage);
    if (!m.started) return;
    if (root.dataset.si && Number(root.dataset.si) !== m.si) { if (typeof window.renderAll === "function") window.renderAll(); return; }
    root.dataset.si = m.si;
    const set = (k, v) => { const el = root.querySelector(`[data-tfx="${k}"]`); if (el && el.textContent !== v) el.textContent = v; };
    if (!m.done) {
      set("left", hms(m.leftH));
      const ph = root.querySelector('[data-tfx="phase"]');
      const wasDry = ph && ph.textContent.indexOf("СУШКА") === 0;
      if (ph && wasDry !== m.drying && typeof window.renderAll === "function") { window.renderAll(); return; }
    }
    set("hour", m.hh.toFixed(1));
    set("removed", fmt(m.removed));
    const pct = total ? Math.round((m.removed / total) * 100) : 0;
    set("pct", String(pct));
    set("rate", m.rate ? m.rate.toFixed(1) : "0");
    const ring = root.querySelector('[data-tfx="ring"]');
    if (ring) ring.setAttribute("stroke-dashoffset", (289 * (1 - m.prog)).toFixed(1));
    const fl = root.querySelector(".tfx-flask");
    if (fl) fl.style.setProperty("--fill", pct + "%");
    const now = root.querySelector(".tfx-now");
    if (now) {
      const nx = GX(m.hh), ny = GY(cumFrac(m.hh, m.st));
      now.setAttribute("transform", `translate(${nx.toFixed(2)} ${ny.toFixed(2)})`);
      const ln = now.querySelector(".tfx-now-line"); if (ln) ln.setAttribute("y2", (118 - ny).toFixed(1));
      const clip = root.querySelector(".tfx-past-clip"); if (clip) clip.setAttribute("width", nx.toFixed(2));
    }
  }

  // ---------------- Блок 2: срез тушки ----------------
  function fish(t, species, stage) {
    const tel = t || (window.state && window.state.telemetry) || {};
    const key = normKey(tel.speciesKey || (window.tradeHouseState && window.tradeHouseState.speciesKey));
    const c = canon(key) || {};
    const sp = species || {};
    const spName = sp.titleRu || c.titleRu || "Вимба";
    const h = cycleHour();
    const si = h !== null ? stageOf(h) : Math.max(0, Math.min(3, ((stage && stage.number) || 2) - 1));
    const [core, mid, surf] = LAYERS[si];
    const tabs = [["VIMBA", "VIMBA", "Вимба"], ["BREAM", "BREAM", "Лещ"], ["ROACH", "ROACH", "Плотва"], ["SMELT", "SMELT", "Корюшка"], ["PERCH", "PERCH", "Окунь"], ["GOBY", "ROUND_GOBY", "Бычок"]]
      .map(([k, tk, l]) => `<button class="tfx-chip ${k === key ? "on" : ""}" onclick="if(window.state&&window.state.telemetry)window.state.telemetry.speciesKey='${k}'; if(typeof onTradeFishSelect==='function')onTradeFishSelect('${tk}'); else if(typeof renderAll==='function')renderAll();">${l}</button>`).join("");
    // метка слоя: точка на тушке + выноска (HTML, чтобы не растягивалась вместе с картинкой)
    const pin = (cls, x, y, dir, label, val) => `
      <div class="tfx-pin ${cls} ${dir}" style="left:${x}%; top:${y}%">
        <i class="tfx-pin-ring"></i><i class="tfx-pin-dot"></i><i class="tfx-pin-lead"></i>
        <span class="tfx-pin-box">${label} <b>${val}%</b></span>
      </div>`;
    const row = (cls, n, title, val, grains, txt, extra) => `
      <div class="tfx-layer ${cls}" onmouseenter="this.closest('.tfx-fish').dataset.hl='${cls}'" onmouseleave="this.closest('.tfx-fish').dataset.hl=''">
        <svg viewBox="0 0 44 44" class="tfx-gauge"><circle cx="22" cy="22" r="18" class="bg"/><circle cx="22" cy="22" r="18" class="fg" stroke-dasharray="113" stroke-dashoffset="${(113 * (1 - val / 100)).toFixed(1)}" transform="rotate(-90 22 22)"/><text x="22" y="25.5" text-anchor="middle">${val}%</text></svg>
        <div class="tfx-layer-b">
          <div class="tfx-layer-t"><span>${n}. ${title}</span><b>${val}% влаги${extra || ""}</b></div>
          <div class="tfx-grains">${Array.from({ length: 15 }, (_, i) => `<i class="${i < grains ? "on" : ""}" style="--i:${i}"></i>`).join("")}</div>
          <div class="tfx-layer-d">${txt}</div>
        </div>
      </div>`;
    const g = (v) => Math.round((v / 80) * 15);
    return `
      <div class="th-bento-card tfx-card tfx-fish" data-hl="">
        ${head(ICON.scan, "c-blue", `Срез тушки • ${spName}${c.caliber ? ` <span class="tfx-cal">${c.caliber}</span>` : ""}`, `Влага по слоям от хребта к чешуе • Ст.${si + 1} «${STAGE_NAMES[si]}» • условная модель по стадии, не замер`,
          tabs + `<button class="tfx-chip g" onclick="const m=document.getElementById('th-bio-matrix-details'); if(m){m.open=true; m.scrollIntoView({behavior:'smooth',block:'start'});}">Матрица 6 рыб ↓</button>`)}
        <div class="tfx-fish-grid">
          <div class="tfx-xray" onclick="if(window.BIO_TOMO&&typeof window.BIO_TOMO.openBioLightbox==='function'){window.BIO_TOMO.openBioLightbox('${key}');}" title="Нажмите — лупа и 3D-разбор">
            <img src="img/vyalka/cut-${CUT[key]}.jpg" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='img/anatomy/${CUT[key]}.jpg';}" alt="Срез ${spName}"/>
            <div class="tfx-xray-tint"></div>
            <div class="tfx-xray-grid"></div>
            <div class="tfx-xray-beam"></div>
            <svg viewBox="0 0 420 265" preserveAspectRatio="none" class="tfx-xray-svg">
              <g class="tfx-diff">
                <path d="M168 112 C200 92 250 94 285 122"/><path d="M168 112 C188 150 230 166 270 160"/><path d="M168 112 C150 84 120 84 92 100"/>
              </g>
            </svg>
            ${pin("core", 40, 42, "up", "Хребет", core)}
            ${pin("mid", 44, 70, "down", "Ястык", mid)}
            ${pin("surf", 68, 46, "right", "Чешуя", surf)}
            <div class="tfx-xtag l">СТ.${si + 1} • ${STAGE_NAMES[si].toUpperCase()}</div>
            <div class="tfx-xtag r">${c.pieceG ? c.pieceG + " г • жир " + c.fatPercent + "%" : ""}</div>
            <div class="tfx-xtag b">ЛУПА ↗</div>
          </div>
          <div class="tfx-layers">
            ${row("core", 1, "Хребет и глубокий балык", core, g(core), "Влага поднимается от кости к спинке во время пауз — поэтому паузы нельзя сокращать.")}
            ${row("mid", 2, "Мышцы и ястык икры", mid, g(mid), "Жир созревает в янтарную «слезу» без окисления при ровной температуре.")}
            ${row("surf", 3, "Чешуя — наружный барьер", surf, g(surf), "Мягкий съём без корки закала: поверхность не должна обгонять хребет.", c.aw ? ` • цель a_w ${c.aw}` : "")}
          </div>
        </div>
      </div>`;
  }

  // ---------------- Блок 3: фасовка ----------------
  function pack(t, species, stage, yf) {
    const tel = t || (window.state && window.state.telemetry) || {};
    const key = normKey(tel.speciesKey || (window.tradeHouseState && window.tradeHouseState.speciesKey));
    const c = canon(key) || {};
    const spName = (species && species.titleRu) || c.titleRu || "Вимба";
    const raw = num(tel.batchWeightKg, 1850);
    const out = Math.round(num(yf && yf.finishedAvgKg, raw * 0.615));
    const vacShare = Math.max(0, Math.min(100, Math.round(num(window.vx && window.vx.mixVac, 70))));
    const bulkShare = 100 - vacShare;
    const vacKg = Math.round((out * vacShare) / 100), bulkKg = Math.max(0, out - vacKg);
    const packs = Math.round(vacKg / 0.85), tuba = bulkKg > 0 ? Math.ceil(bulkKg / 20) : 0;
    const pVac = num(c.vacuumPriceEur, 15), pOpt = num(c.wholesalePriceEur, 12);
    const vacRev = vacKg * pVac, bulkRev = bulkKg * pOpt;
    const btn = (v, l) => `<button class="tfx-chip ${vacShare === v ? "on" : ""}" onclick="if(typeof onVisualProfitInput==='function')onVisualProfitInput('mixVac',${v});">${l}</button>`;
    const layers = [["Пакеты / тушки", "v"], ["Гофрокартон", "k"], ["Пакеты / тушки", "v"], ["Донный картон", "k"]];
    return `
      <div class="th-bento-card tfx-card tfx-pack">
        ${head(ICON.box, "c-amber", "Фасовка партии • KOMET PlusVac 25 и контейнеры TUBA", `Готовый выход <b>${fmt(out)} кг (${spName})</b> • вакуум ${vacShare}% / TUBA ${bulkShare}% • выручка <b class="tc">+${fmt(vacRev + bulkRev)} €</b> <span class="tfx-src">цены из базы знаний</span>`,
          btn(100, "100% вакуум") + btn(70, "Микс 70/30") + btn(50, "Микс 50/50") + `<a class="tfx-chip g" href="vitrina.html" target="_blank" style="text-decoration:none">Витрина для байеров ↗</a>`)}
        <div class="tfx-split">
          <div class="tfx-split-lbl"><span class="v">Вакуум KOMET • ${vacKg} кг • ${packs} пак.</span><span class="a">TUBA • ${bulkKg} кг • ${tuba} конт.</span></div>
          <div class="tfx-split-bar"><i class="v" style="width:${vacShare}%"></i><i class="a" style="width:${bulkShare}%"></i></div>
          <input type="range" min="0" max="100" step="5" value="${vacShare}" oninput="if(typeof onVisualProfitInput==='function')onVisualProfitInput('mixVac',this.value);"/>
        </div>
        <div class="tfx-pack-grid">
          <div class="tfx-pcard v">
            <div class="tfx-pcard-h"><div><div class="tfx-pcard-t">1. Вакуум KOMET PlusVac 25 • PA/PE 90 мкм</div><div class="tfx-pcard-s">${vacKg} кг • <b>${packs} пакетов</b> по 3 тушки (~850 г) • ${pVac} €/кг</div></div><span class="tfx-eur">+${fmt(vacRev)} €</span></div>
            <div class="tfx-vac-row">
              <div class="tfx-vac">
                <img src="img/vyalka/vacuum-pack.jpg" alt="Вяленая рыба в вакуум-пакете" onerror="this.style.display='none'"/>
                <div class="tfx-vac-sheen"></div>
                <div class="tfx-vac-seal"></div>
                <div class="tfx-vac-air">${Array.from({ length: 9 }, (_, i) => `<i style="--y:${12 + i * 9.5}%;--d:${(i * 0.37) % 2.2}s"></i>`).join("")}</div>
                <div class="tfx-vac-frame"></div>
              </div>
              <div class="tfx-vac-spec">
                <div class="tfx-kicker">Протокол KOMET</div>
                <div class="tfx-vac-big">95–96%</div>
                <div class="tfx-vac-lbl">Soft Vac</div>
                <ul><li>плавники подрезать 2–3 мм</li><li>тушка 13–15°C — без росы</li><li>тест на прокол 15–20 мин</li></ul>
              </div>
            </div>
          </div>
          <div class="tfx-pcard a">
            <div class="tfx-pcard-h"><div><div class="tfx-pcard-t">2. Изотермические контейнеры TUBA 600×400</div><div class="tfx-pcard-s">${bulkKg} кг • <b>${tuba} синих евроконтейнеров</b> с гофрокартоном • ${pOpt} €/кг</div></div><span class="tfx-eur a">+${fmt(bulkRev)} €</span></div>
            <div class="tfx-vac-row">
              <div class="tfx-tuba">
                <div class="tfx-tuba-box">
                  <div class="tfx-tuba-rim"></div>
                  ${layers.map(([l, k], i) => `<div class="tfx-tuba-layer ${k}" style="--i:${3 - i}"><span>Слой ${4 - i} • ${l}</span></div>`).join("")}
                </div>
                <div class="tfx-tuba-shadow"></div>
              </div>
              <div class="tfx-vac-spec a">
                <div class="tfx-kicker">Хранение • база</div>
                <div class="tfx-vac-big a">0..+4°C</div>
                <div class="tfx-vac-lbl">в тёмных ящиках</div>
                <ul><li>картон между слоями</li><li>защита от света и проколов</li><li><b>${tuba}</b> конт. по ~20 кг</li></ul>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function start() {
    try { localStorage.setItem(CYCLE_KEY, String(Date.now())); } catch (e) {}
    if (typeof window.ckHomeRefresh === "function") try { window.ckHomeRefresh(); } catch (e) {}
    if (typeof window.renderAll === "function") window.renderAll(true);
  }

  window.ArmTradeFx = { water, fish, pack, start, model };
  setInterval(tick, 1000);
})();
