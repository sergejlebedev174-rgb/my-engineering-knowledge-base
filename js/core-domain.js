window.__ARM_CORE_V15__ = true;
(function (global) {
  "use strict";

  const HEAT_RECOVERY_MODES = {
    WINTER_14KW: {
      key: "WINTER_14KW",
      titleRu: "Зима: Рекуперация 14 кВт в цех (+35°C над мастером, створки закрыты)",
      shortBadgeRu: "Зима: 14 кВт в цех (+35°C)",
      descriptionRu: "Термокороб эстакады [20]: створки закрыты — утилизация 14 кВт тепла конденсации на обогрев цеха Юрмалциемс (+35°C над рабочим местом мастера) и удержание рабочего давления нагнетания 22–24 бар."
    },
    SUMMER_OUTDOOR: {
      key: "SUMMER_OUTDOOR",
      titleRu: "Лето: Сброс тепла на улицу (створки эстакады открыты)",
      shortBadgeRu: "Лето: Сброс на улицу",
      descriptionRu: "Термокороб эстакады [20]: створки эстакады открыты — полный сброс избыточного тепла конденсации с 10-метровой трассы за пределы цеха."
    }
  };

  function normalizeSpeciesKey(key) {
    if (!key) return "VIMBA";
    const s = String(key).trim().toUpperCase();
    if (s === "ROUND_GOBY" || s === "ROUNDGOBY" || s === "GOBY" || s === "БЫЧОК") return "ROUND_GOBY";
    if (s === "ROACH" || s === "ПЛОТВА" || s === "ВОБЛА") return "ROACH";
    if (s === "VIMBA" || s === "ВИМБА" || s === "СЫРТЬ") return "VIMBA";
    if (s === "BREAM" || s === "ЛЕЩ") return "BREAM";
    if (s === "PERCH" || s === "ОКУНЬ") return "PERCH";
    if (s === "SMELT" || s === "КОРЮШКА") return "SMELT";
    return s;
  }

  const FISH_SPECIES = {
    VIMBA: { id: "vimba", key: "VIMBA", nameRu: "Вимба (Сырть)", titleRu: "Вимба (Сырть)", shortRu: "Вимба", standardYield: 61.5, yieldMinPercent: 60.0, yieldMaxPercent: 63.0, yieldPercentRange: "60–63%", fatContentPercent: 8.5, cycleDaysTotal: 7, tempRangeMonoC: [15.0, 16.5], tempRangeWithVimbaC: [15.0, 16.5], emergencyMaxTempC: 18.0, defaultRawPrice: 3.50, defaultWholesalePrice: 12.00, defaultVacuumPrice: 15.00 },
    ROACH: { id: "roach", key: "ROACH", nameRu: "Плотва икряная", titleRu: "Плотва (калибр 22+)", shortRu: "Плотва", standardYield: 58.0, yieldMinPercent: 56.0, yieldMaxPercent: 60.0, yieldPercentRange: "56–60%", fatContentPercent: 4.2, cycleDaysTotal: 5, tempRangeMonoC: [17.0, 23.0], tempRangeWithVimbaC: [15.5, 17.5], emergencyMaxTempC: 24.0, defaultRawPrice: 3.00, defaultWholesalePrice: 10.00, defaultVacuumPrice: 12.00 },
    BREAM: { id: "bream", key: "BREAM", nameRu: "Лещ вяленый", titleRu: "Лещ (крупный колодкой)", shortRu: "Лещ", standardYield: 60.0, yieldMinPercent: 58.0, yieldMaxPercent: 62.0, yieldPercentRange: "58–62%", fatContentPercent: 9.0, cycleDaysTotal: 8, tempRangeMonoC: [12.0, 16.5], tempRangeWithVimbaC: [14.0, 16.5], emergencyMaxTempC: 18.5, defaultRawPrice: 1.60, defaultWholesalePrice: 7.00, defaultVacuumPrice: 9.50 },
    PERCH: { id: "perch", key: "PERCH", nameRu: "Окунь речной", titleRu: "Окунь (целиком в чешуе, икряной)", shortRu: "Окунь", standardYield: 56.0, yieldMinPercent: 54.0, yieldMaxPercent: 58.0, yieldPercentRange: "54–58%", fatContentPercent: 2.1, cycleDaysTotal: 4, tempRangeMonoC: [15.5, 17.5], tempRangeWithVimbaC: [15.5, 17.0], emergencyMaxTempC: 19.0, defaultRawPrice: 2.50, defaultWholesalePrice: 9.50, defaultVacuumPrice: 12.50 },
    SMELT: { id: "smelt", key: "SMELT", nameRu: "Корюшка балтийская", titleRu: "Корюшка (в т.ч. икряная)", shortRu: "Корюшка", standardYield: 52.0, yieldMinPercent: 50.0, yieldMaxPercent: 54.0, yieldPercentRange: "50–54%", fatContentPercent: 5.5, cycleDaysTotal: 3, tempRangeMonoC: [16.0, 22.0], tempRangeWithVimbaC: [16.0, 18.0], emergencyMaxTempC: 23.0, defaultRawPrice: 4.50, defaultWholesalePrice: 17.00, defaultVacuumPrice: 25.00 },
    ROUND_GOBY: { id: "round_goby", key: "ROUND_GOBY", nameRu: "Бычок кругляк", titleRu: "Бычок (балтийский, до 3.5 т)", shortRu: "Бычок", standardYield: 52.5, yieldMinPercent: 50.0, yieldMaxPercent: 55.0, yieldPercentRange: "50–55%", fatContentPercent: 3.5, cycleDaysTotal: 4, tempRangeMonoC: [15.0, 18.0], tempRangeWithVimbaC: [15.0, 17.0], emergencyMaxTempC: 19.5, defaultRawPrice: 1.10, defaultWholesalePrice: 7.00, defaultVacuumPrice: 8.50 }
  };
  FISH_SPECIES.GOBY = FISH_SPECIES.ROUND_GOBY;

  const CURING_STAGES = {
    STAGE_1: { key: "STAGE_1", number: 1, titleRu: "Стадия 1: Разгон (0–24ч)", shortTitleRu: "Ст.1 (3.5ч/1ч)", durationHours: 24, moistureShareOfTotalPercent: 48, cantoniFrequencyHz: 30.0 },
    STAGE_2: { key: "STAGE_2", number: 2, titleRu: "Стадия 2: Диффузия (24–72ч)", shortTitleRu: "Ст.2 (3ч/1.5ч)", durationHours: 48, moistureShareOfTotalPercent: 32, cantoniFrequencyHz: 30.0 },
    STAGE_3: { key: "STAGE_3", number: 3, titleRu: "Стадия 3: Доводка (72–120ч)", shortTitleRu: "Ст.3 (2.5ч/2ч)", durationHours: 48, moistureShareOfTotalPercent: 16, cantoniFrequencyHz: 30.0 },
    STAGE_4: { key: "STAGE_4", number: 4, titleRu: "Стадия 4: Финиш (120–168ч)", shortTitleRu: "Ст.4 (1ч/4ч • 15–20 Гц)", durationHours: 48, moistureShareOfTotalPercent: 4, cantoniFrequencyHz: 18.0 }
  };

  function calculatePsychrometrics(tempC, rhPercent) {
    const T = Number(tempC) || 15.8;
    const rh = Math.max(1, Math.min(100, Number(rhPercent) || 58));
    const esKpa = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
    const eaKpa = esKpa * (rh / 100);
    const vpdKpa = Math.max(0, +(esKpa - eaKpa).toFixed(2));
    const gamma = Math.log(rh / 100) + (17.27 * T) / (T + 237.3);
    const dewPointC = +((237.3 * gamma) / (17.27 - gamma)).toFixed(1);
    const absHumidityGm3 = +((2165 * eaKpa) / (T + 273.15)).toFixed(2);
    return { esKpa: +esKpa.toFixed(3), eaKpa: +eaKpa.toFixed(3), vpdKpa, dewPointC, absHumidityGm3 };
  }

  function calculateRegnaultPsychrometer(dryBulbC, wetBulbC) {
    const Td = Number(dryBulbC) || 15.8;
    const Tw = Math.min(Td, Number(wetBulbC != null ? wetBulbC : Td - 4.4));
    const esDry = 0.61078 * Math.exp((17.27 * Td) / (Td + 237.3));
    const esWet = 0.61078 * Math.exp((17.27 * Tw) / (Tw + 237.3));
    const ea = Math.max(0.05, esWet - 0.000662 * 101.325 * (Td - Tw));
    const rhPct = Math.max(5, Math.min(100, +((ea / esDry) * 100).toFixed(1)));
    const vpdKpa = Math.max(0, +(esDry - ea).toFixed(2));
    return { dryBulbC: Td, wetBulbC: Tw, deltaTC: +(Td - Tw).toFixed(1), rhPct, vpdKpa };
  }

  function estimateWaterActivityAw(spineMoisturePercent, saltPercent) {
    const W = Math.max(30, Math.min(80, Number(spineMoisturePercent) || 48.5));
    const S = Math.max(1.5, Math.min(12, Number(saltPercent) || 4.8));
    const aw = 0.824 + (W - 48.5) * 0.0046 - (S - 4.8) * 0.011;
    return +Math.max(0.68, Math.min(0.98, aw)).toFixed(3);
  }

  function computeClosedLoopPid(telInput) {
    const tel = telInput || (window.state && window.state.telemetry) || {};
    const tempC = Number(tel.environmentTempC ?? 15.8);
    const rhPct = Number(tel.parksideRhPercent ?? 58);
    const scaleTempC = Number(tel.scaleSurfaceTempC ?? +(tempC - 1.5).toFixed(1));
    const spineMoist = Number(tel.spineMoisturePercent ?? 48.5);
    const saltPct = Number(tel.productSaltPercent ?? 4.8);
    const isPause = Boolean(tel.isPausePhaseNow);
    const psy = calculatePsychrometrics(tempC, rhPct);
    const reg = calculateRegnaultPsychrometer(tempC, tel.psychroWetC != null ? tel.psychroWetC : +(tempC - 4.4).toFixed(1));
    const aw = estimateWaterActivityAw(spineMoist, saltPct);
    const deltaTSurface = +(tempC - scaleTempC).toFixed(2);
    const pauseRhRisePerMin = 1.08;
    const minutesTo85Rh = isPause ? Math.max(0, Math.round((85 - rhPct) / pauseRhRisePerMin)) : Math.round((85 - 58) / pauseRhRisePerMin);

    let pidMode = "OPTIMAL_DRYING";
    let statusRu = "ОПТИМУМ ДИФФУЗИИ";
    let statusCol = "#2DD4BF";
    let recHz = isPause ? 18.0 : 30.0;
    let recVolts = isPause ? 4.5 : 9.0;
    let recEevSteps = Math.round(Number(tel.eev1Steps ?? 315));

    if (psy.vpdKpa > 1.08 || deltaTSurface > 2.8) {
      pidMode = "ANTI_CASE_HARDENING";
      statusRu = "ЗАЩИТА ОТ ЗАКАЛА (СНИЗИТЬ ПЧ / ПАУЗА)";
      statusCol = "#F43F5E";
      recHz = 18.0;
      recVolts = 4.5;
      recEevSteps = Math.max(205, recEevSteps - 45);
    } else if (psy.vpdKpa < 0.45 || deltaTSurface < 0.4) {
      pidMode = "INTENSIVE_DEHUMIDIFICATION";
      statusRu = "РИСК ПОДПАРКИ (УСИЛИТЬ ОТЖИМ 1#EEV)";
      statusCol = "#F59E0B";
      recHz = 30.0;
      recVolts = 9.0;
      recEevSteps = Math.min(460, recEevSteps + 50);
    } else if (isPause) {
      pidMode = "DIFFUSION_EQUALIZATION";
      statusRu = "ПАУЗА ДИФФУЗИИ (ВЫРАВНИВАНИЕ ВЛАГИ)";
      statusCol = "#38BDF8";
      recHz = 18.0;
      recVolts = 4.5;
    }

    const fanShaftKw30 = +(12.0 * Math.pow(30 / 50, 3)).toFixed(2);
    const fanShaftKwNow = +(12.0 * Math.pow(recHz / 50, 3)).toFixed(2);
    const savedHeatPct = Math.round((1 - Math.pow(18 / 30, 3)) * 1000) / 10;

    return {
      tempC,
      rhPct,
      scaleTempC,
      deltaTSurface,
      vpdKpa: psy.vpdKpa,
      dewPointC: psy.dewPointC,
      absHumidityGm3: psy.absHumidityGm3,
      regnault: reg,
      aw,
      kometReady: aw <= 0.85,
      pauseRhRisePerMin,
      minutesTo85Rh,
      pidMode,
      statusRu,
      statusCol,
      recHz,
      recVolts,
      recEevSteps,
      fanShaftKw30,
      fanShaftKwNow,
      savedHeatPct
    };
  }

  if (typeof global !== "undefined") {
    global.ARMCore = {
      HEAT_RECOVERY_MODES,
      FISH_SPECIES,
      CURING_STAGES,
      normalizeSpeciesKey,
      calculatePsychrometrics,
      calculateRegnaultPsychrometer,
      estimateWaterActivityAw,
      computeClosedLoopPid
    };
  }
})(typeof window !== "undefined" ? window : globalThis);

(function installCockpitBentoMasterV18() {
  if (typeof window === "undefined" || window.__COCKPIT_V18_INSTALLED__) return;
  window.__COCKPIT_V18_INSTALLED__ = true;

  const NAV_RAIL_CONFIG = {
    scada: { label: "SCADA", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    voice: { label: "Штурман", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' },
    calcs: { label: "Расчеты", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>' },
    batch: { label: "Партия", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' },
    profit: { label: "Прибыль €", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    console: { label: "Пульт", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>' },
    advisor: { label: "Советник", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    phases: { label: "Фазы", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    species: { label: "Виды", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>' },
    ai: { label: "Чат ИИ", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    knowledge: { label: "Знания", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    aim: { label: "AIM", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
    kp: { label: "Генератор КП", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
    b2b: { label: "Витрина B2B", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
    cabinet: { label: "Кабинет B2B", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>' }
  };

  let globalVoiceBoost = 1;

  function renderGrainBarHtml(litCount, totalCount, colorClass) {
    const total = totalCount || 15;
    const lit = Math.max(0, Math.min(total, Math.round(Number(litCount) || 0)));
    const cls = colorClass || "blue";
    let html = '<span class="ck-grain-bar">';
    for (let i = 0; i < total; i++) html += `<span class="ck-grain ${i < lit ? cls : ""}"></span>`;
    return html + "</span>";
  }

  function startParticleOrbOnCanvas(cvs) {
    if (!cvs || cvs.dataset.orbRunning === "1") return;
    cvs.dataset.orbRunning = "1";
    const ctx = cvs.getContext("2d");
    let tm = 0;
    function anim() {
      const w = cvs.width, h = cvs.height, cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, w * 0.46);
      g.addColorStop(0, "rgba(29, 78, 216, 0.58)");
      g.addColorStop(0.65, "rgba(30, 58, 138, 0.22)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const bands = 16, ptsPerBand = 62, baseR = w * 0.36;
      for (let b = 0; b < bands; b++) {
        const v = (b / bands) * Math.PI - Math.PI / 2;
        for (let p = 0; p < ptsPerBand; p++) {
          const u = (p / ptsPerBand) * Math.PI * 2;
          const wave = Math.sin(u * 3 + tm * 1.6 + v * 2) * Math.cos(v * 2 - tm) * (w * 0.055) * globalVoiceBoost;
          const r = baseR + wave;
          const x = r * Math.cos(v) * Math.cos(u + tm * 0.4);
          const y = r * Math.sin(v) + Math.sin(u * 2 + tm) * 3.8;
          const z = r * Math.cos(v) * Math.sin(u + tm * 0.4);
          if (z > -22) {
            const a = Math.max(0.12, (z + 45) / 90);
            ctx.fillStyle = z > 14 ? `rgba(103, 232, 249, ${a * 0.95})` : `rgba(59, 130, 246, ${a * 0.65})`;
            ctx.beginPath();
            ctx.arc(cx + x, cy + y, z > 14 ? 1.35 : 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
      tm += 0.025;
      requestAnimationFrame(anim);
    }
    anim();
  }

  const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;
  function stripWindowsEmojisInNode(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], p = n.parentElement;
      if (!p || p.tagName === "SCRIPT" || p.tagName === "STYLE" || p.tagName === "TEXTAREA") continue;
      if (EMOJI_REGEX.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(EMOJI_REGEX, "").replace(/\s{2,}/g, " ");
      }
    }
  }

  window.__ckUseCadView = false;
  window.ckToggleTwinMode = function () {
    window.__ckUseCadView = !window.__ckUseCadView;
    document.querySelectorAll(".ck-photo-view-layer").forEach((el) => {
      el.style.display = window.__ckUseCadView ? "none" : "flex";
    });
    document.querySelectorAll(".ck-cad-view-layer").forEach((el) => {
      el.style.display = window.__ckUseCadView ? "block" : "none";
      if (window.__ckUseCadView) {
        el.querySelectorAll("iframe[data-src]").forEach((ifr) => {
          if (!ifr.getAttribute("src")) {
            ifr.setAttribute("src", ifr.getAttribute("data-src"));
          }
        });
      }
    });
    document.querySelectorAll(".ck-cad-expand-btn").forEach((el) => {
      el.style.setProperty("display", window.__ckUseCadView ? "inline-flex" : "none", "important");
    });
    const pop = document.getElementById("ckPopoverBox");
    if (pop) pop.style.display = window.__ckUseCadView ? "none" : "";
    document.querySelectorAll(".ck-twin-mode-btn").forEach((b) => {
      b.textContent = window.__ckUseCadView ? "3D Фото-Разрез" : "CAD-Чертеж";
    });
  };

  window.ckSwitchMainDeck = function (deckMode) {
    const mode = deckMode || "dashboard";
    const bentoGrid = document.querySelector("#ck-bento-root > .ck-bento-grid");
    let simDeck = document.getElementById("ck-sim3d-deck");
    let cadDeck = document.getElementById("ck-cadmaster-deck");
    const root = document.getElementById("ck-bento-root");

    if (root && !simDeck) {
      simDeck = document.createElement("div");
      simDeck.id = "ck-sim3d-deck";
      simDeck.style.cssText = "display:none; flex:1; min-height:calc(100vh - 118px); border-radius:20px; overflow:hidden; border:1px solid rgba(56,189,248,0.28); background:#06070B; position:relative;";
      simDeck.innerHTML = `<iframe src="AIM_AGHD_250ELC_Visual_Process_Simulator.html" style="width:100%; height:calc(100vh - 118px); border:none; display:block;" title="3D-Симулятор Камеры AIM AGHD-250ELC"></iframe>`;
      root.appendChild(simDeck);
    }

    if (root && !cadDeck) {
      cadDeck = document.createElement("div");
      cadDeck.id = "ck-cadmaster-deck";
      cadDeck.style.cssText = "display:none; flex:1; min-height:calc(100vh - 118px); border-radius:20px; overflow:hidden; border:1px solid rgba(56,189,248,0.28); background:#07080C; position:relative;";
      cadDeck.innerHTML = `<iframe src="AIM_AGHD_250ELC_Master_v11_Interactive.html" style="width:100%; height:calc(100vh - 118px); border:none; display:block;" title="3D/CAD Мастер-Схема Сушильного Комплекса"></iframe>`;
      root.appendChild(cadDeck);
    }

    // 2D CAD P&ID-мнемосхема контура R410A (js/pid-scheme.js)
    let pidDeck = document.getElementById("ck-pid-deck");
    if (root && !pidDeck && mode === "pid") {
      pidDeck = document.createElement("div");
      pidDeck.id = "ck-pid-deck";
      pidDeck.style.cssText = "display:none; flex:1; height:calc(100vh - 118px); min-height:420px; border-radius:20px; overflow:hidden; border:1px solid rgba(0,240,255,0.3); background:#060A12; position:relative; box-shadow:0 0 28px rgba(0,240,255,0.08);";
      root.appendChild(pidDeck);
      if (window.ArmPid) pidDeck._pid = window.ArmPid.mount(pidDeck);
      else pidDeck.innerHTML = '<div style="padding:24px;color:#94A3B8;">Модуль схемы js/pid-scheme.js не загрузился.</div>';
    }

    // у сетки display задан с !important — прятать тоже только так
    if (bentoGrid) {
      if (mode === "dashboard") bentoGrid.style.removeProperty("display");
      else bentoGrid.style.setProperty("display", "none", "important");
    }
    if (simDeck) simDeck.style.display = mode === "sim3d" ? "block" : "none";
    if (cadDeck) cadDeck.style.display = mode === "cadmaster" ? "block" : "none";
    if (pidDeck) pidDeck.style.display = mode === "pid" ? "block" : "none";

    // подсветка активной кнопки режима (инлайн-фон перебивается стилями бейджей — нужен класс)
    [["ckTopBtnDash", mode === "dashboard"], ["ckTopBtnSim", mode === "sim3d" || mode === "cadmaster"], ["ckTopBtnPid", mode === "pid"]].forEach(([id, on]) => {
      const b = document.getElementById(id);
      if (b) { b.classList.add("fx-mode-btn"); b.classList.toggle("on", on); }
    });

    const btnPid = document.getElementById("ckTopBtnPid");
    if (btnPid) {
      btnPid.style.background = mode === "pid" ? "linear-gradient(135deg,#2563EB,#0284C7)" : "transparent";
      btnPid.style.color = mode === "pid" ? "#FFF" : "#94A3B8";
      btnPid.style.borderColor = mode === "pid" ? "rgba(255,255,255,0.25)" : "transparent";
    }

    const btnDash = document.getElementById("ckTopBtnDash");
    const btnSim = document.getElementById("ckTopBtnSim");
    if (btnDash) {
      btnDash.style.background = mode === "dashboard" ? "linear-gradient(135deg,#2563EB,#0284C7)" : "transparent";
      btnDash.style.color = mode === "dashboard" ? "#FFF" : "#94A3B8";
      btnDash.style.borderColor = mode === "dashboard" ? "rgba(255,255,255,0.25)" : "transparent";
    }
    if (btnSim) {
      const is3d = mode === "sim3d" || mode === "cadmaster";
      btnSim.style.background = is3d ? "linear-gradient(135deg,#2563EB,#0284C7)" : "transparent";
      btnSim.style.color = is3d ? "#FFF" : "#94A3B8";
      btnSim.style.borderColor = is3d ? "rgba(255,255,255,0.25)" : "transparent";
    }
  };

  // открыть 2D-схему сразу на нужном узле (из выносок 3D-двойника)
  window.ckOpenPidNode = function (nodeId) {
    window.ckSwitchMainDeck("pid");
    const deck = document.getElementById("ck-pid-deck");
    if (deck && deck._pid && nodeId) deck._pid.select(nodeId, true);
  };

  let ckFanPresetIdx = 0;
  const ckFanPresets = [
    { hz: "30 Hz", hzNum: 30, speed: "2.8 м/с", bottom: "56%", pause: false },
    { hz: "25 Hz", hzNum: 25.3, speed: "2.2 м/с", bottom: "36%", pause: false },
    { hz: "18 Hz", hzNum: 18, speed: "0.8 м/с", bottom: "14%", pause: true }
  ];
  window.ckCycleFanSpeed = function () {
    ckFanPresetIdx = (ckFanPresetIdx + 1) % ckFanPresets.length;
    const pr = ckFanPresets[ckFanPresetIdx];
    document.querySelectorAll(".ck-v-slider-thumb").forEach((t) => { t.style.bottom = pr.bottom; });
    document.querySelectorAll(".ck-v-slider-hz").forEach((el) => { el.innerHTML = "ОБДУВ<br/>" + pr.hz; });
    document.querySelectorAll(".ck-v-slider-spd").forEach((el) => { el.textContent = pr.speed; });
    if (window.state && window.state.telemetry) {
      window.state.telemetry.isPausePhaseNow = pr.pause;
    }
    const dryTile = document.getElementById("ckBtnDry");
    if (dryTile) {
      dryTile.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg><div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Cantoni ${pr.hz}</div><div style="font-size:8.5px; color:#38BDF8;">${pr.speed} • ${pr.pause ? "ПАУЗА" : "ВКЛ"}</div></div>`;
    }
    if (typeof window.ckSyncPidToMainBadges === "function") window.ckSyncPidToMainBadges();
    if (typeof window.setPausePhase === "function") window.setPausePhase(pr.pause);
  };

  function buildBento3DChamberSvg(uidPrefix, clickHandlerName) {
    const p = uidPrefix || "iso";
    const fn = clickHandlerName || "window.ckSelectNode";
    const isCad = Boolean(window.__ckUseCadView);
    return `
      <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; min-height:175px;">
        <div style="position:absolute; bottom:8px; left:8px; z-index:12; display:flex; gap:6px; align-items:center;">
          <button class="ck-badge ck-twin-mode-btn" onclick="window.ckToggleTwinMode()" style="cursor:pointer; background:rgba(13,15,23,0.88) !important; border-color:rgba(96,165,250,0.4) !important; color:#93C5FD !important;">
            ${isCad ? "3D Фото-Разрез" : "CAD-Чертеж"}
          </button>
          <button class="ck-badge ck-cad-expand-btn" onclick="window.ckSwitchMainDeck('cadmaster')" style="display:${isCad ? "inline-flex" : "none"} !important; cursor:pointer; background:rgba(37,99,235,0.28) !important; border-color:rgba(96,165,250,0.6) !important; color:#FFF !important;">
            ⛶ Развернуть CAD (4 Зоны)
          </button>
        </div>
        <div class="ck-v-slider-dock" onclick="window.ckCycleFanSpeed()" title="Нажмите для переключения скорости турбин Cantoni (30 / 25.3 / 18 Гц)">
          <div class="ck-v-slider-hz" style="font-family:var(--font-mono); font-size:8px; font-weight:700; color:#38BDF8; text-align:center; line-height:1.1;">ОБДУВ<br/>30 Hz</div>
          <div style="display:flex; align-items:center; gap:4px; flex:1; width:100%; justify-content:center;">
            <div class="ck-v-slider-track"><div class="ck-v-slider-thumb" style="bottom:56%;"></div></div>
            <div style="display:flex; flex-direction:column; justify-content:space-between; height:85%; font-family:var(--font-mono); font-size:7px; color:#64748B;">
              <span>50</span><span>40</span><span style="color:#38BDF8;font-weight:700;">30</span><span>20</span>
            </div>
          </div>
          <div class="ck-v-slider-spd" style="font-family:var(--font-mono); font-size:8px; color:#CBD5E1;">2.8 м/с</div>
        </div>
        <div class="ck-photo-twin-stage ck-photo-view-layer" style="display:${isCad ? "none" : "flex"};">
          <img src="aim-3d.png" onerror="if(!this.dataset.jpgTried){this.dataset.jpgTried='1';this.src='aim-3d.jpg';}else{window.ckToggleTwinMode();}" class="ck-photo-twin-img" alt="AIM AGHD-250ELC 3D Cutaway"/>
          <div class="ck-photo-hs" style="left:26%; top:21%; --hs-col:#38BDF8; --hs-glow:rgba(56,189,248,0.42);" title="[1] Осевые турбины Cantoni 4×3кВт" onclick="${fn}(0,'Турбины Cantoni 4×3кВт','15.8°C','58% rH','30Гц • 2.8 м/с','8px','8px')"><div class="ck-photo-hs-core"></div></div>
          <div class="ck-photo-hs" style="left:25%; top:52%; --hs-col:#F59E0B; --hs-glow:rgba(245,158,11,0.42);" title="[2] Зона 15 тележек SS304 с рыбой" onclick="${fn}(1,'Зона 15 тележек (Вимба)','15.8°C','58% rH','VPD 0.75 кПа','8px','8px')"><div class="ck-photo-hs-core"></div></div>
          <div class="ck-photo-hs" style="left:52%; top:46%; --hs-col:#38BDF8; --hs-glow:rgba(56,189,248,0.45);" title="[3] Наклонный V-Испаритель 1#Dehumicoil (+5.1°C)" onclick="${fn}(2,'V-Испаритель 1#Dehumicoil','+5.1°C','8.4 бар','Отжим 75 л/ч','8px','8px')"><div class="ck-photo-hs-core"></div></div>
          <div class="ck-photo-hs" style="left:61%; top:48%; --hs-col:#F59E0B; --hs-glow:rgba(245,158,11,0.4);" title="[4] Золотой конденсатор догрева Reheat Coil (+68°C)" onclick="${fn}(3,'Догрев Reheat Coil','+68.0°C','48% rH','ТЭНы 0 кВт','8px','8px')"><div class="ck-photo-hs-core"></div></div>
          <div class="ck-photo-hs" style="left:53%; top:82%; --hs-col:#2DD4BF; --hs-glow:rgba(45,212,191,0.42);" title="[5] Дренажный трап 60 см в полу [21]" onclick="${fn}(4,'Трап слива конденсата [21]','+7.4°C','100% rH','-75.0 л/ч','8px','8px')"><div class="ck-photo-hs-core"></div></div>
          <div class="ck-photo-hs" style="left:77%; top:66%; --hs-col:#F59E0B; --hs-glow:rgba(245,158,11,0.4);" title="[6] Спиральный компрессор Panasonic Scroll R410A" onclick="${fn}(5,'Panasonic Scroll C-SCP400','+68.0°C','24.0 бар','11.4 А • COP 4.2','8px','8px')"><div class="ck-photo-hs-core"></div></div>
          <div class="ck-photo-hs" style="left:79%; top:17%; --hs-col:#2DD4BF; --hs-glow:rgba(45,212,191,0.42);" title="[7] Воздуховод рекуперации +14 кВт в цех [20]" onclick="${fn}(6,'Рекуперация эстакады [20]','+35.0°C','22.8 бар','+14.0 кВт в цех','8px','8px')"><div class="ck-photo-hs-core"></div></div>
        </div>
        <div class="ck-cad-view-layer" style="width:100%; height:100%; min-height:175px; border-radius:12px; overflow:hidden; position:relative; background:#07080C; display:${isCad ? "block" : "none"};">
          <iframe ${isCad ? 'src="AIM_AGHD_250ELC_Master_v11_Interactive.html"' : 'data-src="AIM_AGHD_250ELC_Master_v11_Interactive.html"'} style="width:166.67%; height:166.67%; transform:scale(0.6); transform-origin:0 0; border:none; display:block;" title="CAD-Чертеж AIM AGHD-250ELC"></iframe>
        </div>
      </div>
    `;
  }

  window.ckApplyConsolePidInput = function (field, val) {
    if (!window.state) window.state = { telemetry: {} };
    if (!window.state.telemetry) window.state.telemetry = {};
    const num = parseFloat(val);
    if (!isNaN(num)) window.state.telemetry[field] = num;
    if (typeof window.ckSyncPidToMainBadges === "function") window.ckSyncPidToMainBadges();
    if (typeof window.renderAll === "function") window.renderAll();
  };

  function customGetScadaChamberMimicSvgMarkup(t, stage, species, diag) {
    const tel = (t && typeof t === "object") ? t : ((window.state && window.state.telemetry) || {});
    const sp = species || { titleRu: "Вимба (Сырть)", yieldMinPercent: 60, yieldMaxPercent: 63 };
    const spName = sp.titleRu || sp.nameRu || "Вимба (Сырть)";
    const st = stage || { number: 2, shortTitleRu: "Ст.2 (3ч/1.5ч)" };
    const pid = (window.ARMCore && window.ARMCore.computeClosedLoopPid) ? window.ARMCore.computeClosedLoopPid(tel) : { tempC: 15.8, rhPct: 58, vpdKpa: 0.75, recEevSteps: 315, recHz: 30, recVolts: 9.0 };
    const isWinter = (tel.heatRecoveryMode || "WINTER_14KW") === "WINTER_14KW";
    const rawKg = Number(tel.batchWeightKg || 1850);
    return `
      <div class="ck-cad-mimic-card" style="background:linear-gradient(165deg,#131620 0%,#0D0F17 100%); border:1px solid rgba(255,255,255,0.068); border-radius:22px; padding:16px 18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <div style="font-size:14px; font-weight:700; color:#F8FAFC;">3D/CAD Мастер-Схема Замкнутого Контура • AIM AGHD-250ELC (4 Зоны • 10 Узлов)</div>
            <div class="ck-cad-mimic-sub" style="font-size:11px; color:#64748B; margin-top:2px;">Партия: ${spName} (${rawKg} кг) • ${st.shortTitleRu || "Ст.2"} • Интерактивный чертеж и 3D-Симулятор (0→84ч)</div>
          </div>
          <div style="display:flex; gap:7px; flex-wrap:wrap;">
            <span class="ck-badge ck-cad-mimic-hz" style="color:#38BDF8;">[15] Cantoni: ${pid.recHz} Гц (${pid.recVolts}V)</span>
            <span class="ck-badge ck-cad-mimic-eev" style="color:#F59E0B;">[10] 1#EEV: ${pid.recEevSteps} st</span>
            <span class="ck-badge ck-cad-mimic-rec" style="color:#2DD4BF;">[20] ${isWinter ? "Зима: 14 кВт в цех (+35°C)" : "Лето: Сброс на улицу"}</span>
          </div>
        </div>
        <div style="position:relative; height:640px; background:#07080C; border:1px solid rgba(56,189,248,0.25); border-radius:16px; overflow:hidden;">
          <iframe data-src="AIM_AGHD_250ELC_Master_v11_Interactive.html" style="width:100%; height:100%; border:none; display:block;" title="3D/CAD Мастер-Схема AIM AGHD-250ELC"></iframe>
        </div>
      </div>`;
  }

  function updateMountedCadMimicCardInPlace(container, t, stage, species) {
    const card = container && container.querySelector(".ck-cad-mimic-card");
    if (!card) return false;
    const tel = (t && typeof t === "object") ? t : ((window.state && window.state.telemetry) || {});
    const sp = species || { titleRu: "Вимба (Сырть)" };
    const spName = sp.titleRu || sp.nameRu || "Вимба (Сырть)";
    const st = stage || { number: 2, shortTitleRu: "Ст.2 (3ч/1.5ч)" };
    const pid = (window.ARMCore && window.ARMCore.computeClosedLoopPid) ? window.ARMCore.computeClosedLoopPid(tel) : { recEevSteps: 315, recHz: 30, recVolts: 9.0 };
    const isWinter = (tel.heatRecoveryMode || "WINTER_14KW") === "WINTER_14KW";
    const rawKg = Number(tel.batchWeightKg || 1850);
    const subEl = card.querySelector(".ck-cad-mimic-sub");
    const hzEl = card.querySelector(".ck-cad-mimic-hz");
    const eevEl = card.querySelector(".ck-cad-mimic-eev");
    const recEl = card.querySelector(".ck-cad-mimic-rec");
    if (subEl) subEl.textContent = `Партия: ${spName} (${rawKg} кг) • ${st.shortTitleRu || "Ст.2"} • Интерактивный чертеж и 3D-Симулятор (0→84ч)`;
    if (hzEl) hzEl.textContent = `[15] Cantoni: ${pid.recHz} Гц (${pid.recVolts}V)`;
    if (eevEl) eevEl.textContent = `[10] 1#EEV: ${pid.recEevSteps} st`;
    if (recEl) recEl.textContent = `[20] ${isWinter ? "Зима: 14 кВт в цех (+35°C)" : "Лето: Сброс на улицу"}`;
    return true;
  }

  function customGetScadaVpdSpeedometerSvgMarkup(t, stage, species, diag) {
    const isNumCall = typeof t === "number" || typeof t === "string";
    const tel = (!isNumCall && t && typeof t === "object") ? t : ((window.state && window.state.telemetry) || {});
    const pid = (window.ARMCore && window.ARMCore.computeClosedLoopPid)
      ? window.ARMCore.computeClosedLoopPid(tel)
      : { tempC: 15.8, rhPct: 58, scaleTempC: 14.3, deltaTSurface: 1.5, vpdKpa: 0.75, dewPointC: 7.6, absHumidityGm3: 7.8, aw: 0.824, kometReady: true, minutesTo85Rh: 25, statusRu: "ОПТИМУМ ДИФФУЗИИ", statusCol: "#2DD4BF", recHz: 30, recVolts: 9.0, recEevSteps: 315, fanShaftKwNow: 2.59, savedHeatPct: 81.2 };
    const vpd = isNumCall ? (parseFloat(t) || pid.vpdKpa) : pid.vpdKpa;
    const normRatio = Math.min(1, Math.max(0, vpd / 1.5));
    const dashLen = Math.round(normRatio * 220);
    return `
      <div style="background:linear-gradient(165deg,#131620 0%,#0B0D14 100%); border:1px solid rgba(255,255,255,0.068); border-radius:18px; padding:14px 16px; width:100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:13px; font-weight:700; color:#F8FAFC;">АСУ ТП Замкнутого Цикла • ПИД-Контроллер Влажности и Температуры (VPD + ΔT чешуи + a_w)</div>
            <div style="font-size:10.5px; color:#64748B;">Автоматическое управление 1#EEV (Dew Point = 0) и частотниками Cantoni 4×3кВт по дефициту VPD и ИК-температуре чешуи</div>
          </div>
          <span class="ck-badge" style="color:${pid.statusCol};">● ${pid.statusRu}</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; align-items:center;">
          <div style="position:relative; width:165px; height:125px; margin:0 auto;">
            <svg viewBox="0 0 180 130" style="width:100%; height:100%;">
              <path d="M 20 110 A 70 70 0 0 1 160 110" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="10" stroke-linecap="round"/>
              <path d="M 20 110 A 70 70 0 0 1 160 110" fill="none" stroke="${pid.statusCol}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${dashLen} 240"/>
              <text x="90" y="82" text-anchor="middle" font-family="var(--font-mono)" font-size="24" font-weight="700" fill="#F8FAFC">${vpd.toFixed(2)}</text>
              <text x="90" y="100" text-anchor="middle" font-size="10" fill="#94A3B8">кПа • Дефицит VPD</text>
            </svg>
          </div>
          <div style="display:flex; flex-direction:column; gap:7px;">
            <div style="background:#080A10; border:1px solid rgba(255,255,255,0.065); border-radius:12px; padding:8px 11px;">
              <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#94A3B8;"><span>Точка росы (Td) / Абс. влага</span><strong style="color:#38BDF8; font-family:var(--font-mono);">+${pid.dewPointC}°C • ${pid.absHumidityGm3} г/м³</strong></div>
              <div style="font-size:9.5px; color:#64748B; margin-top:3px;">Градиент воздух–чешуя ΔT: <strong style="color:#F59E0B;">+${pid.deltaTSurface}°C</strong> (Чешуя +${pid.scaleTempC}°C)</div>
            </div>
            <div style="background:#080A10; border:1px solid rgba(255,255,255,0.065); border-radius:12px; padding:8px 11px;">
              <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#94A3B8;"><span>Активность воды a_w (Росс-Чирифе)</span><strong style="color:${pid.kometReady ? "#2DD4BF" : "#F59E0B"}; font-family:var(--font-mono);">${pid.aw} (${pid.kometReady ? "Допуск KOMET OK" : "Сушить < 0.85"})</strong></div>
              <div style="font-size:9.5px; color:#64748B; margin-top:3px;">Прогноз паузы (58%→85% rH): <strong style="color:#38BDF8;">${pid.minutesTo85Rh} мин</strong> (+1.08%/мин)</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:7px;">
            <div style="background:#080A10; border:1px solid rgba(56,189,248,0.22); border-radius:12px; padding:8px 11px;">
              <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#94A3B8;"><span>Уставка ПЧ Cantoni / 1#EEV</span><strong style="color:#38BDF8; font-family:var(--font-mono);">${pid.recHz} Гц (${pid.recVolts}V) • ${pid.recEevSteps} st</strong></div>
              <div style="font-size:9.5px; color:#64748B; margin-top:3px;">Мощность вала (f³): <strong style="color:#2DD4BF;">${pid.fanShaftKwNow} кВт</strong> (экономия тепла в паузе -${pid.savedHeatPct}%)</div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
              <label style="background:#080A10; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:5px 8px; font-size:9.5px; color:#94A3B8;">Т чешуи (°C): <input type="number" step="0.2" value="${pid.scaleTempC}" onchange="window.ckApplyConsolePidInput('scaleSurfaceTempC',this.value)" style="width:52px; background:transparent; border:none; color:#F59E0B; font-family:var(--font-mono); font-weight:700;"/></label>
              <label style="background:#080A10; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:5px 8px; font-size:9.5px; color:#94A3B8;">Влага кости (%): <input type="number" step="0.5" value="${tel.spineMoisturePercent ?? 48.5}" onchange="window.ckApplyConsolePidInput('spineMoisturePercent',this.value)" style="width:52px; background:transparent; border:none; color:#2DD4BF; font-family:var(--font-mono); font-weight:700;"/></label>
            </div>
          </div>
        </div>
      </div>`;
  }

function buildBiometricCrossSectionSvg(coreMoist, midMoist, surfMoist, spKeyArg) {
    const rawKey = String(spKeyArg || (window.state && window.state.telemetry && window.state.telemetry.speciesKey) || "VIMBA").toUpperCase();
    const normKey = rawKey === "ROUND_GOBY" ? "GOBY" : (["VIMBA","BREAM","ROACH","SMELT","PERCH","GOBY"].includes(rawKey) ? rawKey : "VIMBA");
    const cutMeta = {
      VIMBA: { img: "img/vyalka/cut-vimba.jpg", code: "VIMBA_CUT_32.AIM", title: "ВИМБА (СЫРТЬ) • 350 г • 8.5% ЖИР", mm: "184.2 ММ" },
      BREAM: { img: "img/vyalka/cut-bream.jpg", code: "BREAM_CUT_10.AIM", title: "ЛЕЩ КРУПНЫЙ • 850 г • 9.0% ЖИР", mm: "242.0 ММ" },
      ROACH: { img: "img/vyalka/cut-roach.jpg", code: "ROACH_CUT_22.AIM", title: "ПЛОТВА ИКРЯНАЯ • 260 г • 4.2% ЖИР", mm: "162.5 ММ" },
      SMELT: { img: "img/vyalka/cut-smelt.jpg", code: "SMELT_CUT_13.AIM", title: "КОРЮШКА ИКРЯНАЯ • 85 г • 5.5% ЖИР", mm: "118.0 ММ" },
      PERCH: { img: "img/vyalka/cut-perch.jpg", code: "PERCH_CUT_16.AIM", title: "ОКУНЬ (ЦЕЛИКОМ) • 320 г • 2.1% ЖИР", mm: "178.4 ММ" },
      GOBY:  { img: "img/vyalka/cut-goby.jpg",  code: "GOBY_CUT_19.AIM",  title: "БЫЧОК БАЛТИЙСКИЙ • 140 г • 3.5% ЖИР", mm: "134.0 ММ" }
    }[normKey];
    return `
      <div onclick="if(window.BIO_TOMO&&typeof window.BIO_TOMO.openBioLightbox==='function'){window.BIO_TOMO.openBioLightbox('${normKey}');}" title="Нажмите для 5× Спектральной Лупы и 3D-разбора" style="position:relative; border-radius:18px; overflow:hidden; background:radial-gradient(circle at 50% 50%, #101828 0%, #05070D 100%); border:1px solid rgba(56,189,248,0.28); box-shadow:inset 0 1px 0 rgba(255,255,255,0.1), 0 18px 40px rgba(0,0,0,0.88); cursor:zoom-in;">
        <img src="${cutMeta.img}" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='vimba-3d.png';}" style="width:100%; height:265px; object-fit:cover; display:block; filter:saturate(1.1) contrast(1.04); transition:transform 0.45s cubic-bezier(0.16,1,0.3,1);" onmouseover="this.style.transform='scale(1.045)'" onmouseout="this.style.transform='scale(1)'" alt="3D Cutaway ${normKey}"/>
        <div style="position:absolute; left:0; right:0; height:28px; background:linear-gradient(180deg, transparent, rgba(56,189,248,0.22), rgba(0,240,255,0.65), transparent); pointer-events:none; animation:thScanBeam 4.4s ease-in-out infinite;"></div>
        <svg viewBox="0 0 420 265" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;">
          <line x1="210" y1="12" x2="210" y2="253" stroke="rgba(56,189,248,0.18)" stroke-dasharray="3 5"/>
          <line x1="16" y1="132" x2="404" y2="132" stroke="rgba(56,189,248,0.15)" stroke-dasharray="3 5"/>
          <circle cx="205" cy="128" r="76" fill="none" stroke="rgba(56,189,248,0.22)" stroke-dasharray="4 6"/>
        </svg>
        <div style="position:absolute; top:10px; left:10px; background:rgba(6,10,18,0.88); backdrop-filter:blur(10px); border:1px solid rgba(56,189,248,0.45); border-radius:9px; padding:4px 9px; font-family:var(--font-mono); font-size:10px; color:#38BDF8; font-weight:800; box-shadow:0 4px 12px rgba(0,0,0,0.6);">⚛ 3D СРЕЗ: ${cutMeta.mm} • ${cutMeta.code}</div>
        <div style="position:absolute; top:10px; right:10px; background:rgba(6,10,18,0.88); backdrop-filter:blur(10px); border:1px solid rgba(45,212,191,0.45); border-radius:9px; padding:4px 9px; font-family:var(--font-mono); font-size:10px; color:#2DD4BF; font-weight:800; box-shadow:0 4px 12px rgba(0,0,0,0.6);">● ЛАМИНАРНЫЙ РЕЖИМ</div>
        <div style="position:absolute; top:32%; left:34%; background:rgba(7,11,20,0.92); border:1px solid rgba(56,189,248,0.75); border-radius:8px; padding:3px 8px; font-family:var(--font-mono); font-size:10px; font-weight:800; color:#38BDF8; pointer-events:none; box-shadow:0 0 14px rgba(56,189,248,0.35); animation:thPinPulse 2.8s infinite;">● ХРЕБЕТ ${coreMoist}%</div>
        <div style="position:absolute; bottom:17%; left:35%; background:rgba(7,11,20,0.92); border:1px solid rgba(245,158,11,0.8); border-radius:8px; padding:3px 8px; font-family:var(--font-mono); font-size:10px; font-weight:800; color:#FDE68A; pointer-events:none; box-shadow:0 0 14px rgba(245,158,11,0.35);">● ЯСТЫК ИКРЫ ${midMoist}%</div>
        <div style="position:absolute; top:47%; right:10%; background:rgba(7,11,20,0.92); border:1px solid rgba(45,212,191,0.75); border-radius:8px; padding:3px 8px; font-family:var(--font-mono); font-size:10px; font-weight:800; color:#2DD4BF; pointer-events:none; box-shadow:0 0 14px rgba(45,212,191,0.35);">● ЧЕШУЯ ${surfMoist}%</div>
        <div style="position:absolute; bottom:10px; right:10px; background:linear-gradient(135deg,rgba(37,99,235,0.88),rgba(14,165,183,0.88)); border:1px solid rgba(125,211,252,0.75); border-radius:8px; padding:4px 10px; font-family:var(--font-mono); font-size:10px; font-weight:800; color:#FFF; box-shadow:0 4px 14px rgba(0,0,0,0.7);">🔍 5× ЛУПА (КЛИК)</div>
      </div>`;
  }

  function customBuildOwnerFishCrossSectionHtml(t, species, stage, diag) {
    const tel = t || (window.state && window.state.telemetry) || {};
    const rawKey = String(tel.speciesKey || (window.tradeHouseState && window.tradeHouseState.speciesKey) || "VIMBA").toUpperCase();
    const normKey = rawKey === "ROUND_GOBY" ? "GOBY" : (["VIMBA","BREAM","ROACH","SMELT","PERCH","GOBY"].includes(rawKey) ? rawKey : "VIMBA");
    const sp = species || { titleRu: "Вимба (Сырть)" };
    const spName = sp.titleRu || sp.nameRu || "Вимба (Сырть)";
    const st = stage || { number: 2, shortTitleRu: "Ст.2 (3ч/1.5ч)" };
    const coreMoist = st.number === 1 ? 72 : st.number === 2 ? 65 : st.number === 3 ? 58 : 52;
    const midMoist = st.number === 1 ? 66 : st.number === 2 ? 56 : st.number === 3 ? 50 : 46;
    const surfMoist = st.number === 1 ? 58 : st.number === 2 ? 49 : st.number === 3 ? 45 : 43;
    const spTabs = [
      { k: "VIMBA", tk: "VIMBA", lbl: "Вимба" },
      { k: "BREAM", tk: "BREAM", lbl: "Лещ" },
      { k: "ROACH", tk: "ROACH", lbl: "Плотва" },
      { k: "SMELT", tk: "SMELT", lbl: "Корюшка" },
      { k: "PERCH", tk: "PERCH", lbl: "Окунь" },
      { k: "GOBY",  tk: "ROUND_GOBY", lbl: "Бычок" }
    ];
    return `
      <div class="th-bento-card" style="padding:18px 20px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg,rgba(37,99,235,0.28),rgba(14,165,183,0.22)); border:1px solid rgba(56,189,248,0.45); display:grid; place-items:center; font-size:18px; box-shadow:0 0 16px rgba(56,189,248,0.25);">🧬</div>
            <div>
              <div style="font-size:15px; font-weight:800; color:#F8FAFC; letter-spacing:-0.01em;">Биометрический 3D-Рентген Среза Тушки • ${spName}</div>
              <div style="font-size:11px; color:#94A3B8;">Спектральные изотермы диффузии влаги от позвоночника к чешуе • ${st.shortTitleRu || "Ст.2"}</div>
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            ${spTabs.map(item => {
              const isAct = item.k === normKey;
              return `<button class="ck-badge" onclick="if(window.state&&window.state.telemetry)window.state.telemetry.speciesKey='${item.k}'; if(typeof onTradeFishSelect==='function')onTradeFishSelect('${item.tk}'); else if(typeof renderAll==='function')renderAll();" style="cursor:pointer; padding:5px 10px; font-size:11px; font-weight:700; ${isAct ? 'background:linear-gradient(135deg,#2563EB,#0EA5B7); color:#FFF; border-color:#7DD3FC; box-shadow:0 0 14px rgba(56,189,248,0.45);' : 'color:#94A3B8;'}">${item.lbl}</button>`;
            }).join("")}
            <button class="ck-badge" onclick="const m=document.getElementById('th-bio-matrix-details'); if(m){m.open=true; m.scrollIntoView({behavior:'smooth',block:'start'});}" style="cursor:pointer; background:rgba(16,185,129,0.18); border-color:rgba(45,212,191,0.5); color:#2DD4BF; padding:5px 11px; font-weight:800;">⚛ Матрица 6 рыб ↓</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px; align-items:stretch;">
          ${buildBiometricCrossSectionSvg(coreMoist, midMoist, surfMoist, normKey)}
          <div style="display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
            <div style="background:linear-gradient(165deg,#101726 0%,#090C14 100%); border:1px solid rgba(56,189,248,0.25); border-left:3px solid #38BDF8; border-radius:15px; padding:11px 14px; display:flex; align-items:center; gap:12px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);">
              <svg width="44" height="44" viewBox="0 0 44 44" style="flex-shrink:0;">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4"/>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="${Math.round(113 * (1 - coreMoist / 100))}" transform="rotate(-90 22 22)"/>
                <text x="22" y="25" text-anchor="middle" fill="#38BDF8" font-size="10" font-weight="800" font-family="JetBrains Mono">${coreMoist}%</text>
              </svg>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#F8FAFC;"><span>1. Позвоночник и глубокий балык</span><span style="color:#38BDF8; font-family:var(--font-mono);">${coreMoist}% влаги</span></div>
                <div style="margin:5px 0;">${renderGrainBarHtml(11, 15, "blue")}</div>
                <div style="font-size:10.5px; color:#94A3B8;">Капиллярный подъем влаги от кости к спинке во время диффузных пауз.</div>
              </div>
            </div>
            <div style="background:linear-gradient(165deg,#141622 0%,#090C14 100%); border:1px solid rgba(245,158,11,0.25); border-left:3px solid #F59E0B; border-radius:15px; padding:11px 14px; display:flex; align-items:center; gap:12px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);">
              <svg width="44" height="44" viewBox="0 0 44 44" style="flex-shrink:0;">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4"/>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="${Math.round(113 * (1 - midMoist / 100))}" transform="rotate(-90 22 22)"/>
                <text x="22" y="25" text-anchor="middle" fill="#FDE68A" font-size="10" font-weight="800" font-family="JetBrains Mono">${midMoist}%</text>
              </svg>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#F8FAFC;"><span>2. Мышечный слой и ястык икры</span><span style="color:#F59E0B; font-family:var(--font-mono);">${midMoist}% влаги</span></div>
                <div style="margin:5px 0;">${renderGrainBarHtml(9, 15, "amber")}</div>
                <div style="font-size:10.5px; color:#94A3B8;">Равномерная янтарная кристаллизация жира («янтарная слеза») без окисления.</div>
              </div>
            </div>
            <div style="background:linear-gradient(165deg,#0E1822 0%,#080C14 100%); border:1px solid rgba(45,212,191,0.25); border-left:3px solid #2DD4BF; border-radius:15px; padding:11px 14px; display:flex; align-items:center; gap:12px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);">
              <svg width="44" height="44" viewBox="0 0 44 44" style="flex-shrink:0;">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4"/>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#2DD4BF" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="${Math.round(113 * (1 - surfMoist / 100))}" transform="rotate(-90 22 22)"/>
                <text x="22" y="25" text-anchor="middle" fill="#2DD4BF" font-size="10" font-weight="800" font-family="JetBrains Mono">${surfMoist}%</text>
              </svg>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#F8FAFC;"><span>3. Наружный чешуйчатый барьер</span><span style="color:#2DD4BF; font-family:var(--font-mono);">${surfMoist}% • a_w 0.82</span></div>
                <div style="margin:5px 0;">${renderGrainBarHtml(7, 15, "cyan")}</div>
                <div style="font-size:10.5px; color:#94A3B8;">Мягкий ламинарный съем влаги при VPD 0.75 кПа без корки закала.</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function customBuildOwnerKometPackagingVisualHtml(t, species, stage, yf) {
    const tel = t || (window.state && window.state.telemetry) || {};
    const sp = species || { titleRu: "Вимба (Сырть)" };
    const spName = sp.titleRu || sp.nameRu || "Вимба (Сырть)";
    const rawKg = Number(tel.batchWeightKg || 1850);
    const outKg = Number((yf && yf.finishedAvgKg) || Math.round(rawKg * 0.615));
    const vacShare = Number((window.vx && window.vx.mixVac != null) ? window.vx.mixVac : 70);
    const bulkShare = Math.max(0, 100 - vacShare);
    const vacKg = Math.round((outKg * vacShare) / 100), bulkKg = Math.max(0, outKg - vacKg);
    const packsCount = Math.round(vacKg / 0.85), tubaCount = Math.max(1, Math.ceil(bulkKg / 20));
    const vacRev = Math.round(vacKg * 15), bulkRev = Math.round(bulkKg * 12);
    const totalRev = vacRev + bulkRev;
    return `
      <div class="th-bento-card" style="padding:18px 20px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg,rgba(59,130,246,0.28),rgba(245,158,11,0.22)); border:1px solid rgba(96,165,250,0.45); display:grid; place-items:center; font-size:18px;">📦</div>
            <div>
              <div style="font-size:15px; font-weight:800; color:#F8FAFC;">Инженерный CAD-Чертеж Фасовки • KOMET PlusVac 25 vs Контейнер TUBA</div>
              <div style="font-size:11px; color:#94A3B8;">Готовый выход партии: <b style="color:#E2E8F0;">${outKg} кг (${spName})</b> • Вакуум ${vacShare}% (${packsCount} пак.) / TUBA ${bulkShare}% (${tubaCount} конт.) • Выручка: <b style="color:#2DD4BF;">+${totalRev.toLocaleString("ru-RU")} €</b></div>
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="ck-badge" style="cursor:pointer; padding:5px 11px; ${vacShare===100?'background:linear-gradient(135deg,#2563EB,#0EA5B7);color:#FFF;border-color:#7DD3FC;':'color:#60A5FA;'}" onclick="if(typeof onVisualProfitInput==='function')onVisualProfitInput('mixVac',100);">100% Вакуум</button>
            <button class="ck-badge" style="cursor:pointer; padding:5px 11px; ${vacShare===70?'background:linear-gradient(135deg,#2563EB,#0EA5B7);color:#FFF;border-color:#7DD3FC;':'color:#2DD4BF;'}" onclick="if(typeof onVisualProfitInput==='function')onVisualProfitInput('mixVac',70);">Микс 70/30</button>
            <button class="ck-badge" style="cursor:pointer; padding:5px 11px; ${vacShare===50?'background:linear-gradient(135deg,#2563EB,#0EA5B7);color:#FFF;border-color:#7DD3FC;':'color:#F59E0B;'}" onclick="if(typeof onVisualProfitInput==='function')onVisualProfitInput('mixVac',50);">Микс 50/50</button>
          </div>
        </div>

        <div style="margin-bottom:14px; background:#070A12; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px 12px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:5px; font-family:var(--font-mono);">
            <span style="color:#38BDF8;">🔹 ВАКУУМ KOMET: ${vacShare}% (${vacKg} кг • ${packsCount} пач.)</span>
            <span style="color:#F59E0B;">🟧 ЕВРОКОНТЕЙНЕРЫ TUBA: ${bulkShare}% (${bulkKg} кг • ${tubaCount} ящ.)</span>
          </div>
          <div style="display:flex; height:10px; border-radius:999px; overflow:hidden; gap:2px; background:#05080F; margin-bottom:8px;">
            <div class="th-shimmer-bar" style="width:${vacShare}%; background:linear-gradient(90deg,#2563EB,#00F0FF); border-radius:999px; transition:width 0.3s ease;"></div>
            <div class="th-shimmer-bar" style="width:${bulkShare}%; background:linear-gradient(90deg,#D97706,#FBBF24); border-radius:999px; transition:width 0.3s ease;"></div>
          </div>
          <input type="range" min="0" max="100" step="5" value="${vacShare}" style="width:100%;" oninput="if(typeof onVisualProfitInput==='function')onVisualProfitInput('mixVac',this.value);"/>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px;">
          <div style="background:radial-gradient(260px circle at 15% 15%, rgba(56,189,248,0.14), transparent 70%), linear-gradient(165deg,#0E1525 0%,#080B13 100%); border:1px solid rgba(56,189,248,0.32); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:10px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <div style="font-size:13px; font-weight:800; color:#60A5FA;">1. Вакуум KOMET PlusVac 25 (PA/PE 90 мкм)</div>
                <div style="font-size:11px; color:#94A3B8; margin-top:2px;">${vacKg} кг • <b style="color:#E2E8F0;">${packsCount} пакетов</b> по 3 тушки (~850 г)</div>
              </div>
              <span class="ck-badge" style="background:rgba(16,185,129,0.16); border-color:rgba(45,212,191,0.45); color:#2DD4BF; font-size:12px; font-weight:800; padding:4px 10px;">+${vacRev.toLocaleString("ru-RU")} €</span>
            </div>
            <svg viewBox="0 0 380 128" style="width:100%; height:auto; background:#050811; border-radius:12px; border:1px solid rgba(56,189,248,0.2);">
              <defs>
                <linearGradient id="kometPouchGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.18"/>
                  <stop offset="100%" stop-color="#0EA5B7" stop-opacity="0.05"/>
                </linearGradient>
                <linearGradient id="fishGoldGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#D97706"/>
                  <stop offset="50%" stop-color="#FBBF24"/>
                  <stop offset="100%" stop-color="#B45309"/>
                </linearGradient>
              </defs>
              <rect x="16" y="12" width="248" height="104" rx="10" fill="url(#kometPouchGrad)" stroke="#38BDF8" stroke-width="1.6" stroke-dasharray="5 3"/>
              <line x1="34" y1="16" x2="34" y2="112" stroke="#00F0FF" stroke-width="2.5" style="animation:thSealLaser 2s infinite;"/>
              <line x1="40" y1="16" x2="40" y2="112" stroke="#2DD4BF" stroke-width="2" style="animation:thSealLaser 2s infinite 0.4s;"/>
              <g transform="translate(56, 22)">
                <path d="M8,12 C42,2 110,3 158,12 L176,4 L172,20 L158,14 C110,23 42,22 8,12 Z" fill="url(#fishGoldGrad)" opacity="0.9"/>
                <circle cx="22" cy="12" r="2.2" fill="#080B12"/>
              </g>
              <g transform="translate(56, 50)">
                <path d="M8,12 C42,2 110,3 158,12 L176,4 L172,20 L158,14 C110,23 42,22 8,12 Z" fill="url(#fishGoldGrad)" opacity="0.92"/>
                <circle cx="22" cy="12" r="2.2" fill="#080B12"/>
              </g>
              <g transform="translate(56, 78)">
                <path d="M8,12 C42,2 110,3 158,12 L176,4 L172,20 L158,14 C110,23 42,22 8,12 Z" fill="url(#fishGoldGrad)" opacity="0.9"/>
                <circle cx="22" cy="12" r="2.2" fill="#080B12"/>
              </g>
              <rect x="276" y="14" width="90" height="100" rx="9" fill="#0A101D" stroke="rgba(56,189,248,0.35)"/>
              <text x="321" y="32" text-anchor="middle" fill="#64748B" font-size="8.5" font-weight="700" font-family="JetBrains Mono">BUSCH VAC</text>
              <text x="321" y="54" text-anchor="middle" fill="#2DD4BF" font-size="15" font-weight="800" font-family="JetBrains Mono">99.2%</text>
              <text x="321" y="70" text-anchor="middle" fill="#38BDF8" font-size="8.5" font-weight="700" font-family="JetBrains Mono">ШОВ 2×3.5мм</text>
              <rect x="288" y="82" width="66" height="20" rx="5" fill="rgba(45,212,191,0.14)" stroke="rgba(45,212,191,0.4)"/>
              <text x="321" y="95" text-anchor="middle" fill="#2DD4BF" font-size="9" font-weight="800" font-family="JetBrains Mono">БЕЗ ЗАГАРА</text>
            </svg>
          </div>

          <div style="background:radial-gradient(260px circle at 85% 15%, rgba(245,158,11,0.14), transparent 70%), linear-gradient(165deg,#151420 0%,#090B12 100%); border:1px solid rgba(245,158,11,0.32); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:10px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <div style="font-size:13px; font-weight:800; color:#F59E0B;">2. Изотермические контейнеры TUBA (600×400)</div>
                <div style="font-size:11px; color:#94A3B8; margin-top:2px;">${bulkKg} кг • <b style="color:#E2E8F0;">${tubaCount} синих евроконтейнеров</b> с гофрокартоном</div>
              </div>
              <span class="ck-badge" style="background:rgba(245,158,11,0.16); border-color:rgba(245,158,11,0.45); color:#FBBF24; font-size:12px; font-weight:800; padding:4px 10px;">+${bulkRev.toLocaleString("ru-RU")} €</span>
            </div>
            <svg viewBox="0 0 380 128" style="width:100%; height:auto; background:#050811; border-radius:12px; border:1px solid rgba(245,158,11,0.22);">
              <rect x="16" y="12" width="248" height="104" rx="8" fill="rgba(30,58,138,0.28)" stroke="#3B82F6" stroke-width="2"/>
              <rect x="24" y="20" width="232" height="88" rx="5" fill="#070B14" stroke="rgba(96,165,250,0.35)" stroke-width="1"/>
              <line x1="28" y1="40" x2="252" y2="40" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="8 3"/>
              <line x1="28" y1="62" x2="252" y2="62" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="8 3"/>
              <line x1="28" y1="84" x2="252" y2="84" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="8 3"/>
              <text x="140" y="34" text-anchor="middle" fill="#93C5FD" font-size="8.5" font-weight="700" font-family="JetBrains Mono">СЛОЙ 4 • ВАКУУМ-ПАКЕТЫ / ТУШКИ</text>
              <text x="140" y="55" text-anchor="middle" fill="#FDE68A" font-size="8.5" font-weight="700" font-family="JetBrains Mono">СЛОЙ 3 • КРАФТ-ГОФРОКАРТОН</text>
              <text x="140" y="77" text-anchor="middle" fill="#93C5FD" font-size="8.5" font-weight="700" font-family="JetBrains Mono">СЛОЙ 2 • ВАКУУМ-ПАКЕТЫ / ТУШКИ</text>
              <text x="140" y="100" text-anchor="middle" fill="#FDE68A" font-size="8.5" font-weight="700" font-family="JetBrains Mono">СЛОЙ 1 • ДОННЫЙ КАРТОН (20 КГ)</text>
              <rect x="276" y="14" width="90" height="100" rx="9" fill="#0A101D" stroke="rgba(245,158,11,0.35)"/>
              <text x="321" y="32" text-anchor="middle" fill="#64748B" font-size="8.5" font-weight="700" font-family="JetBrains Mono">СКЛАД ЗИМА→ЛЕТО</text>
              <text x="321" y="54" text-anchor="middle" fill="#FBBF24" font-size="14" font-weight="800" font-family="JetBrains Mono">0..+2°C</text>
              <text x="321" y="70" text-anchor="middle" fill="#93C5FD" font-size="8.5" font-weight="700" font-family="JetBrains Mono">ДО 5–6 МЕС.</text>
              <rect x="288" y="82" width="66" height="20" rx="5" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.45)"/>
              <text x="321" y="95" text-anchor="middle" fill="#FBBF24" font-size="9" font-weight="800" font-family="JetBrains Mono">${tubaCount} КОНТ.</text>
            </svg>
          </div>
        </div>
      </div>`;
  }

  function customBuildOwnerWaterAndTimerVisualHtml(t, species, stage, diag, yf) {
    const tel = t || (window.state && window.state.telemetry) || {};
    const rawKg = Number(tel.batchWeightKg || 1850);
    const outKg = Number((yf && yf.finishedAvgKg) || Math.round(rawKg * 0.615));
    const totalWater = Math.max(0, rawKg - outKg);
    const isPause = Boolean(tel.isPausePhaseNow);
    const stNum = Number((stage && stage.number) || 2);
    const fillPct = stNum === 1 ? 45 : stNum === 2 ? 75 : stNum === 3 ? 92 : 98;
    const drainRate = isPause ? "0.8" : (stNum === 1 ? "14.2" : stNum === 2 ? "6.4" : "2.8");
    const awVal = stNum === 1 ? "0.910" : stNum === 2 ? "0.824" : stNum === 3 ? "0.785" : "0.750";
    const tempVal = Number(tel.chamberTempC || 15.8).toFixed(1);
    const rhVal = Math.round(Number(tel.chamberRhPct || 58));
    return `
      <div class="th-bento-card" style="padding:18px 20px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.07);">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg,rgba(37,99,235,0.32),rgba(0,240,255,0.2)); border:1px solid rgba(56,189,248,0.5); display:grid; place-items:center; font-size:18px; box-shadow:0 0 18px rgba(56,189,248,0.3);">💧</div>
            <div>
              <div style="font-size:15px; font-weight:800; color:#F8FAFC; letter-spacing:-0.01em;">Баланс Влагосъема в Трап [21] (60 см) и Таймер Цикла MCGS</div>
              <div style="font-size:11px; color:#94A3B8;">Загрузка: <b style="color:#E2E8F0;">${rawKg} кг</b> → Готовый выход: <b style="color:#2DD4BF;">${outKg} кг</b> • Автосмена: Сушка 3.5ч ↔ Пауза диффузии 1.0ч</div>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button class="ck-badge" onclick="if(typeof setScadaPausePhase==='function')setScadaPausePhase(false);" style="cursor:pointer; padding:6px 12px; font-weight:800; ${!isPause ? 'background:linear-gradient(135deg,#2563EB,#0EA5B7); color:#FFF; border-color:#7DD3FC; box-shadow:0 0 16px rgba(56,189,248,0.45);' : 'color:#94A3B8;'}">⚡ СУШКА 30 ГЦ</button>
            <button class="ck-badge" onclick="if(typeof setScadaPausePhase==='function')setScadaPausePhase(true);" style="cursor:pointer; padding:6px 12px; font-weight:800; ${isPause ? 'background:linear-gradient(135deg,#D97706,#F59E0B); color:#FFF; border-color:#FDE68A; box-shadow:0 0 16px rgba(245,158,11,0.45);' : 'color:#94A3B8;'}">⏸ ПАУЗА 18 ГЦ</button>
            <span class="ck-badge" style="background:rgba(16,185,129,0.15); border-color:rgba(45,212,191,0.45); color:#2DD4BF; padding:6px 12px; font-weight:800;">Слив в трап: -${totalWater} л (-${drainRate} л/ч)</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; align-items:stretch;">
          <div style="background:linear-gradient(165deg,#0D1322 0%,#070A12 100%); border:1px solid rgba(56,189,248,0.22); border-radius:16px; padding:14px; display:flex; align-items:center; gap:14px;">
            <div style="position:relative; width:96px; height:146px; border-radius:14px; background:linear-gradient(180deg,#060A12 0%,#0B1324 100%); border:1.5px solid rgba(56,189,248,0.45); overflow:hidden; flex-shrink:0; box-shadow:inset 0 0 22px rgba(0,240,255,0.16), 0 8px 20px rgba(0,0,0,0.7);">
              <div style="position:absolute; top:10px; left:30%; width:5px; height:8px; border-radius:50%; background:#00F0FF; box-shadow:0 0 8px #00F0FF; animation:thDropFall 1.5s infinite linear;"></div>
              <div style="position:absolute; top:6px; left:58%; width:4px; height:7px; border-radius:50%; background:#38BDF8; box-shadow:0 0 8px #38BDF8; animation:thDropFall 1.8s infinite linear 0.6s;"></div>
              <div style="position:absolute; top:12px; left:44%; width:4px; height:7px; border-radius:50%; background:#2DD4BF; box-shadow:0 0 8px #2DD4BF; animation:thDropFall 1.3s infinite linear 1.1s;"></div>
              <div style="position:absolute; left:0; right:0; bottom:0; height:${fillPct}%; background:linear-gradient(180deg,rgba(0,240,255,0.55) 0%,rgba(37,99,235,0.78) 100%); border-top:2px solid #7DD3FC; transition:height 0.6s ease; box-shadow:0 -4px 16px rgba(0,240,255,0.45);">
                <svg viewBox="0 0 120 14" style="position:absolute; top:-10px; left:-10px; width:140%; height:14px; animation:thWaveSlide 3.2s ease-in-out infinite;">
                  <path d="M0,7 Q15,0 30,7 T60,7 T90,7 T120,7 L120,14 L0,14 Z" fill="rgba(56,189,248,0.65)"/>
                </svg>
              </div>
              <div style="position:absolute; right:5px; top:22%; font-family:var(--font-mono); font-size:8px; color:rgba(226,232,240,0.6);">75% —</div>
              <div style="position:absolute; right:5px; top:48%; font-family:var(--font-mono); font-size:8px; color:rgba(226,232,240,0.6);">50% —</div>
              <div style="position:absolute; right:5px; top:73%; font-family:var(--font-mono); font-size:8px; color:rgba(226,232,240,0.6);">25% —</div>
              <div style="position:absolute; left:0; right:0; bottom:8px; text-align:center; font-family:var(--font-mono); font-size:12px; font-weight:800; color:#FFF; text-shadow:0 1px 6px #000;">-${totalWater} L</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
              <div style="font-size:12px; font-weight:800; color:#38BDF8; text-transform:uppercase; letter-spacing:0.03em;">Гидро-Трап SS304 [21]</div>
              <div style="font-size:10.5px; color:#94A3B8; line-height:1.4;">Напольный лоток 60 см у всасывающих окон V-испарителя (+5.1°C).</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-top:2px;">
                <div style="background:#070A12; border:1px solid rgba(56,189,248,0.22); border-radius:8px; padding:4px 7px; font-family:var(--font-mono); font-size:10px;"><span style="color:#64748B;">Ст.1:</span> <b style="color:#38BDF8;">${Math.round(totalWater*0.45)} л</b></div>
                <div style="background:#070A12; border:1px solid rgba(45,212,191,0.22); border-radius:8px; padding:4px 7px; font-family:var(--font-mono); font-size:10px;"><span style="color:#64748B;">Ст.2:</span> <b style="color:#2DD4BF;">${Math.round(totalWater*0.30)} л</b></div>
                <div style="background:#070A12; border:1px solid rgba(245,158,11,0.22); border-radius:8px; padding:4px 7px; font-family:var(--font-mono); font-size:10px;"><span style="color:#64748B;">Ст.3:</span> <b style="color:#FBBF24;">${Math.round(totalWater*0.20)} л</b></div>
                <div style="background:#070A12; border:1px solid rgba(167,139,250,0.22); border-radius:8px; padding:4px 7px; font-family:var(--font-mono); font-size:10px;"><span style="color:#64748B;">Ст.4:</span> <b style="color:#A78BFA;">${Math.round(totalWater*0.05)} л</b></div>
              </div>
            </div>
          </div>

          <div style="background:linear-gradient(165deg,#0D1322 0%,#070A12 100%); border:1px solid rgba(56,189,248,0.22); border-radius:16px; padding:14px; display:flex; align-items:center; gap:14px;">
            <div style="position:relative; width:118px; height:118px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
              <svg width="118" height="118" viewBox="0 0 116 116" style="transform:rotate(-90deg); filter:drop-shadow(0 0 10px ${isPause ? 'rgba(245,158,11,0.35)' : 'rgba(0,240,255,0.35)'});">
                <defs>
                  <linearGradient id="thMcgsGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${isPause ? '#D97706' : '#2563EB'}"/>
                    <stop offset="100%" stop-color="${isPause ? '#FDE68A' : '#00F0FF'}"/>
                  </linearGradient>
                </defs>
                <circle cx="58" cy="58" r="46" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="9"/>
                <circle cx="58" cy="58" r="46" fill="none" stroke="url(#thMcgsGrad)" stroke-width="9" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="${isPause ? 110 : 72}"/>
              </svg>
              <div style="position:absolute; text-align:center;">
                <div style="font-family:var(--font-mono); font-size:20px; font-weight:800; color:#F8FAFC; letter-spacing:-0.03em;">${isPause ? "00:48" : "01:42"}</div>
                <div style="font-size:8.5px; color:${isPause ? '#FBBF24' : '#38BDF8'}; font-weight:800; text-transform:uppercase; margin-top:2px;">${isPause ? "ПАУЗА • 18 ГЦ" : "СУШКА • 30 ГЦ"}</div>
              </div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; gap:7px;">
              <div>
                <div style="font-size:13px; font-weight:800; color:#F8FAFC;">Таймер Цикла MCGS</div>
                <div style="font-size:10.5px; color:#64748B;">Импульсная защита от закала</div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <div style="background:#070A12; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:6px 8px;">
                  <div style="font-size:9px; color:#64748B;">Активность a_w</div>
                  <div style="font-family:var(--font-mono); font-size:13px; font-weight:800; color:#2DD4BF; margin-top:2px;">${awVal}</div>
                </div>
                <div style="background:#070A12; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:6px 8px;">
                  <div style="font-size:9px; color:#64748B;">Мощность AIM</div>
                  <div style="font-family:var(--font-mono); font-size:13px; font-weight:800; color:#F59E0B; margin-top:2px;">14.0 кВт·ч</div>
                </div>
              </div>
              <div style="font-family:var(--font-mono); font-size:10px; color:#2DD4BF;">● Modbus RTU: Связь стабильна</div>
            </div>
          </div>

          <div style="background:linear-gradient(165deg,#0D1322 0%,#070A12 100%); border:1px solid rgba(56,189,248,0.22); border-radius:16px; padding:14px; display:flex; align-items:center; gap:12px;">
            <div style="display:flex; flex-direction:column; gap:6px; width:108px; flex-shrink:0;">
              <div style="background:#070A12; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:6px 9px;">
                <div style="font-size:9px; color:#64748B;">Сырье в чане</div>
                <div style="font-family:var(--font-mono); font-size:13px; font-weight:800; color:#F8FAFC;">${(rawKg/1000).toFixed(2)} T</div>
              </div>
              <div style="background:#070A12; border:1px solid rgba(56,189,248,0.22); border-radius:10px; padding:6px 9px;">
                <div style="font-size:9px; color:#64748B;">Выход готовой</div>
                <div style="font-family:var(--font-mono); font-size:13px; font-weight:800; color:#60A5FA;">${outKg} кг</div>
              </div>
              <div style="background:#070A12; border:1px solid rgba(45,212,191,0.22); border-radius:10px; padding:6px 9px;">
                <div style="font-size:9px; color:#64748B;">Слив в трап</div>
                <div style="font-family:var(--font-mono); font-size:13px; font-weight:800; color:#2DD4BF;">${totalWater}.0 L</div>
              </div>
            </div>
            <div style="flex:1; position:relative; height:128px; background:#060911; border:1px solid rgba(56,189,248,0.16); border-radius:12px; overflow:hidden; padding:6px;">
              <svg viewBox="0 0 240 110" style="width:100%; height:100%; overflow:visible;">
                <defs>
                  <linearGradient id="thAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.32"/>
                    <stop offset="100%" stop-color="#2563EB" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="28" x2="240" y2="28" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
                <line x1="0" y1="58" x2="240" y2="58" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
                <line x1="0" y1="88" x2="240" y2="88" stroke="rgba(255,255,255,0.05)" stroke-dasharray="3 3"/>
                <g stroke-width="1.5">
                  <line x1="20" y1="72" x2="20" y2="96" stroke="#38BDF8"/><rect x="17" y="78" width="6" height="12" rx="1.5" fill="#38BDF8"/>
                  <line x1="45" y1="60" x2="45" y2="88" stroke="#2DD4BF"/><rect x="42" y="65" width="6" height="15" rx="1.5" fill="#2DD4BF"/>
                  <line x1="70" y1="48" x2="70" y2="76" stroke="#2DD4BF"/><rect x="67" y="52" width="6" height="16" rx="1.5" fill="#2DD4BF"/>
                  <line x1="95" y1="54" x2="95" y2="80" stroke="#F59E0B"/><rect x="92" y="60" width="6" height="12" rx="1.5" fill="#F59E0B"/>
                  <line x1="120" y1="36" x2="120" y2="66" stroke="#2DD4BF"/><rect x="117" y="42" width="6" height="16" rx="1.5" fill="#2DD4BF"/>
                  <line x1="145" y1="28" x2="145" y2="56" stroke="#38BDF8"/><rect x="142" y="34" width="6" height="15" rx="1.5" fill="#38BDF8"/>
                  <line x1="170" y1="22" x2="170" y2="50" stroke="#2DD4BF"/><rect x="167" y="27" width="6" height="16" rx="1.5" fill="#2DD4BF"/>
                  <line x1="195" y1="18" x2="195" y2="44" stroke="#00F0FF"/><rect x="192" y="22" width="6" height="14" rx="1.5" fill="#00F0FF"/>
                </g>
                <path d="M 12 86 Q 45 68, 75 56 T 135 42 T 198 24 L 228 20 L 228 104 L 12 104 Z" fill="url(#thAreaGrad)"/>
                <path d="M 12 86 Q 45 68, 75 56 T 135 42 T 198 24 L 228 20" fill="none" stroke="#00F0FF" stroke-width="2.2"/>
                <circle cx="195" cy="24" r="4.5" fill="#00F0FF" stroke="#FFF" stroke-width="1.5"/>
              </svg>
              <div style="position:absolute; top:8px; right:8px; background:rgba(8,13,24,0.92); border:1px solid rgba(56,189,248,0.45); border-radius:8px; padding:4px 8px; font-family:var(--font-mono); font-size:9.5px; color:#E0F2FE; box-shadow:0 6px 16px rgba(0,0,0,0.65);">
                <div style="color:#64748B; font-size:8px;">ЦИКЛ #42 • ОПТИМУМ</div>
                <div style="font-weight:800; color:#38BDF8;">+${tempVal}°C • ${rhVal}% rH</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function customRenderSuperHubFlaskSvg(arg1, arg2, arg3) {
    let wL = 712, raw = 1850;
    if (arg1 && typeof arg1 === "object") {
      wL = Math.max(0, Math.round(Number(arg1.water) || 712));
      raw = Math.max(1, Math.round(Number(arg1.raw) || 1850));
    } else {
      wL = Math.max(0, Math.round(Number(arg1) || 712));
      raw = Math.max(1, Math.round(Number(arg3 || arg2) || 1850));
    }
    const maxL = Math.max(200, Math.round(raw * 0.55));
    const fillPct = Math.min(88, Math.max(15, Math.round((wL / maxL) * 85)));
    const cylH = 104, fillH = Math.round((cylH * fillPct) / 100), fillY = 14 + (cylH - fillH);
    return `
      <svg viewBox="0 0 200 132" style="width:100%; max-width:185px; height:auto; display:block; margin:0 auto; overflow:visible;">
        <defs><linearGradient id="bentoFlaskCyan" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(56,189,248,0.65)"/><stop offset="100%" stop-color="rgba(37,99,235,0.35)"/></linearGradient></defs>
        <rect x="56" y="12" width="88" height="108" rx="14" fill="#080A10" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>
        <rect x="60" y="${fillY}" width="80" height="${fillH}" rx="10" fill="url(#bentoFlaskCyan)" stroke="#38BDF8" stroke-width="1"/>
        <text x="100" y="72" text-anchor="middle" font-family="var(--font-mono)" font-size="16" font-weight="700" fill="#FFFFFF">-${wL} л</text>
      </svg>`;
  }

  function customRenderSuperHubDialScaleSvg(finishedKg, arg2, arg3) {
    const out = Math.max(0, Math.round(Number(finishedKg) || 1138));
    let yPct = 61.5;
    if (arg3 != null) yPct = Number(arg3) || 61.5;
    else if (arg2 != null && Number(arg2) <= 100) yPct = Number(arg2) || 61.5;
    const dash = Math.round(Math.min(1, Math.max(0.12, out / 3000)) * 195);
    return `
      <svg viewBox="0 0 200 132" style="width:100%; max-width:185px; height:auto; display:block; margin:0 auto; overflow:visible;">
        <path d="M 30 108 A 70 70 0 0 1 170 108" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="11" stroke-linecap="round"/>
        <path d="M 30 108 A 70 70 0 0 1 170 108" fill="none" stroke="#3B82F6" stroke-width="11" stroke-linecap="round" stroke-dasharray="${dash} 225"/>
        <text x="100" y="82" text-anchor="middle" font-family="var(--font-mono)" font-size="20" font-weight="700" fill="#F8FAFC">${out.toLocaleString("ru-RU")}</text>
        <text x="100" y="102" text-anchor="middle" font-size="10" fill="#60A5FA">кг • Выход ${yPct.toFixed(1)}%</text>
      </svg>`;
  }

  function mountMainScadaCockpit() {
    const scadaPane = document.getElementById("tab-scada");
    if (!scadaPane || document.getElementById("ck-bento-root")) return;

    const legacyBackup = document.createElement("div");
    legacyBackup.style.display = "none";
    while (scadaPane.firstChild) legacyBackup.appendChild(scadaPane.firstChild);

    const checkIconSvg = '<div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div><span style="font-size:7.5px;font-family:var(--font-mono);font-weight:800;color:#FFF;letter-spacing:0.04em;">ВЫБРАНО</span>';

    const root = document.createElement("div");
    root.id = "ck-bento-root";
    root.innerHTML = `
      <div class="ck-header-bar">
        <div class="ck-greeting" style="display:flex;align-items:center;gap:11px;">
          <img src="img/brand/fish-icon-192.png" onerror="this.onerror=null;this.src='img/brand/tuba-mark.svg'" style="height:38px;width:38px;border-radius:50%;object-fit:cover;border:1px solid rgba(56,189,248,0.45);box-shadow:0 0 14px rgba(0,240,255,0.35),0 4px 12px rgba(0,0,0,0.65);" alt="Jūrmalciems ARM"/>
          <div>
            <h2>Смена №3 • <span>Юрмалциемс</span> <small style="font-size:10px;font-family:var(--font-mono);background:rgba(45,212,191,0.14);color:#2DD4BF;border:1px solid rgba(45,212,191,0.35);padding:2px 8px;border-radius:999px;">● Активная фаза сушки</small></h2>
            <p>Камера AIM AGHD-250ELC • 4×Cantoni 3кВт (Аэродинамический шлейф) • Контроллер MCGS</p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; background:rgba(10,12,18,0.92); border:1px solid rgba(255,255,255,0.075); border-radius:13px; padding:3px 5px;">
          <button class="ck-badge fx-mode-btn on" id="ckTopBtnDash" style="cursor:pointer; background:linear-gradient(135deg,#2563EB,#0284C7); color:#FFF; border-color:rgba(255,255,255,0.25); padding:5px 11px;" onclick="window.ckSwitchMainDeck('dashboard')">Dashboard</button>
          <button class="ck-badge" id="ckTopBtnSim" style="cursor:pointer; background:transparent; color:#94A3B8; border-color:transparent; padding:5px 11px;" onclick="window.ckSwitchMainDeck('sim3d')">3D Двойник Камеры</button>
          <button class="ck-badge" id="ckTopBtnPid" style="cursor:pointer; background:transparent; color:#94A3B8; border-color:transparent; padding:5px 11px;" onclick="window.ckSwitchMainDeck('pid')" title="2D CAD P&amp;ID-мнемосхема: контур R410A, воздушная петля, конденсат">2D CAD Схема</button>
          <button class="ck-badge" style="cursor:pointer; background:transparent; color:#94A3B8; border-color:transparent; padding:5px 11px;" onclick="window.ckVoiceSpeak()">ИИ-Штурман</button>
          <button class="ck-badge" style="cursor:pointer; background:transparent; color:#38BDF8; border-color:rgba(56,189,248,0.25); padding:5px 11px;" onclick="selectTab('calcs')">Полный АРМ ↗</button>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="display:flex; align-items:center; gap:7px; background:rgba(16,18,26,0.9); border:1px solid rgba(255,255,255,0.068); padding:5px 10px; border-radius:11px; font-size:11.5px; font-weight:600;">
            <span style="width:7px;height:7px;border-radius:50%;background:#F59E0B;box-shadow:0 0 8px #F59E0B;"></span>
            <span id="ckHdrTempTxt">+15.8°C</span><span style="color:#64748B;">|</span><span style="color:#38BDF8;" id="ckHdrRhTxt">58% rH</span>
          </div>
          <div class="ck-thin-clock">
            <div class="ck-thin-clock-time" id="ckLiveTime">19:50</div>
            <div class="ck-thin-clock-date" id="ckLiveDate">Понедельник, 2 Ноября 2026</div>
          </div>
        </div>
      </div>

      <div class="ck-bento-grid">
        <div class="ck-card stage-3d">
          <div class="ck-hdr">
            <div>
              <div class="ck-title">3D Разрез Камеры AIM AGHD-250ELC (15 Тележек SS304)</div>
              <div class="ck-sub" id="ckActiveNodeLbl">Интерактивные точки датчиков ( • ) на контурах и обдуве</div>
            </div>
            <div style="display:flex; gap:5px;">
              <button class="ck-badge" style="cursor:pointer; color:#38BDF8; border-color:rgba(56,189,248,0.3);" onclick="window.ckStepTemp(-0.2)">− 0.2°C</button>
              <button class="ck-badge" style="cursor:pointer; color:#F59E0B; border-color:rgba(245,158,11,0.3);" onclick="window.ckStepTemp(0.2)">+ 0.2°C</button>
            </div>
          </div>
          <div style="position:relative; flex:1; display:flex; align-items:center; justify-content:center; min-height:0; margin:4px 0;">
            <div class="ck-popover" id="ckPopoverBox">
              <div style="padding-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.06);">
                <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600;">
                  <span>Температура</span><span style="font-size:9.5px; color:#64748B;" id="ckPopZone">Зона тележек</span>
                </div>
                <div style="font-size:8.5px; color:#64748B;">Оптимум: 15.0–18.0 °C</div>
                <div style="display:flex; align-items:center; gap:7px; margin-top:3px;">
                  <div class="ck-grain-bar" id="ckTempGrains"></div>
                  <span style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:#F59E0B;" id="ckPopTemp">15.8°C</span>
                </div>
              </div>
              <div style="padding-top:5px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600;">
                  <span>Влажность & VPD</span><span style="font-size:9.5px; color:#2DD4BF;" id="ckPopVpd">0.75 кПа</span>
                </div>
                <div style="font-size:8.5px; color:#64748B;">Коридор: 54–62 % rH</div>
                <div style="display:flex; align-items:center; gap:7px; margin-top:3px;">
                  <div class="ck-grain-bar" id="ckRhGrains"></div>
                  <span style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:#38BDF8;" id="ckPopRh">58%</span>
                </div>
              </div>
            </div>
            ${buildBento3DChamberSvg("mainCockpitIso", "window.ckSelectNode")}
          </div>
          <div class="ck-sys-tiles">
            <div class="ck-sys-btn active" id="ckBtnDry" onclick="this.classList.toggle('active'); if(typeof setScadaPausePhase==='function')setScadaPausePhase(false);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
              <div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Cantoni 30Hz</div><div style="font-size:8.5px; color:#38BDF8;">2.8 м/с • ВКЛ</div></div>
            </div>
            <div class="ck-sys-btn active" id="ckBtnC1" onclick="this.classList.toggle('active'); if(typeof setScadaCircuits==='function')setScadaCircuits(1);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
              <div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Контур #1</div><div style="font-size:8.5px; color:#2DD4BF;">EEV 315 • ВКЛ</div></div>
            </div>
            <div class="ck-sys-btn" id="ckBtnPause" onclick="this.classList.toggle('active'); if(typeof setScadaCircuits==='function')setScadaCircuits(2);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
              <div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Контур #2</div><div style="font-size:8.5px; color:#64748B;">СТЕНДБАЙ</div></div>
            </div>
            <div class="ck-sys-btn active" id="ckBtnC2" onclick="selectTab('console')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Анти-Закал</div><div style="font-size:8.5px; color:#F59E0B;">VPD 0.75 кПа</div></div>
            </div>
          </div>
          <div class="ck-card-footer">
            <span>Слив конденсата: Трап в полу SS304 (60 см)</span>
            <span style="color:#2DD4BF;font-weight:700;">● -6.4 л/ч (-75 л/ч макс.)</span>
          </div>
        </div>

        <!-- ПАРТИЯ СЕЙЧАС: вид, стадия (фото-эталон), ход сушки, коридор вида — всё из общей партии и базы знаний -->
        <div class="ck-card fintech-hero ck-now" id="ckNowCard">
          <div class="ck-hdr">
            <div style="min-width:0;">
              <div class="ck-now-kicker">Партия сейчас</div>
              <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; margin-top:2px;">
                <span class="ck-now-name" id="ckNowName">Вимба</span>
                <span class="ck-badge" id="ckNowKg" style="color:#FDE68A; border-color:rgba(245,158,11,0.35);">1 850 кг</span>
              </div>
              <div class="ck-sub" id="ckNowSub">—</div>
            </div>
            <div class="ck-now-ctrl">
              <button class="ck-badge" onclick="window.ckCycleShift(-1)" title="Партия стартовала на час позже">−1 ч</button>
              <button class="ck-badge" onclick="window.ckCycleShift(1)" title="Партия стартовала на час раньше">+1 ч</button>
              <button class="ck-badge ck-now-start" id="ckNowStartBtn" onclick="window.ckCycleStart()">▶ Старт</button>
            </div>
          </div>
          <div class="ck-now-body">
            <div class="ck-now-photo">
              <img id="ckNowImg" alt="Эталон стадии вяления" onerror="this.style.visibility='hidden'"/>
              <span class="ck-now-sweep"></span>
              <span class="ck-now-tag" id="ckNowPhotoTag">—</span>
            </div>
            <div class="ck-now-info">
              <div class="ck-now-stage" id="ckNowStage">—</div>
              <div class="ck-now-track"><i id="ckNowBar"></i></div>
              <div class="ck-now-eta" id="ckNowEta">—</div>
              <div class="ck-now-tiles">
                <div><span>Сырьё</span><strong id="ckWellRaw">1.85 T</strong></div>
                <div><span>Будет готовой</span><strong id="ckWellOut" style="color:#38BDF8;">1 138 кг</strong></div>
                <div><span>Ушло воды</span><strong id="ckNowGone" style="color:#2DD4BF;">—</strong></div>
              </div>
              <div class="ck-now-check" id="ckNowCheck">—</div>
            </div>
          </div>
          <div class="ck-card-footer">
            <span>Ход сушки — модель 84 ч от старта партии</span>
            <span style="color:#38BDF8;font-weight:700;cursor:pointer;" onclick="window.ckSwitchMainDeck('sim3d')">3D-симулятор →</span>
          </div>
        </div>

        <div class="ck-card" style="display:grid; grid-template-rows:auto 1fr; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px; background:#040508; border:1px solid rgba(56,189,248,0.18); border-radius:15px; padding:8px 12px; cursor:pointer;" onclick="window.ckVoiceSpeak()">
            <canvas id="ckParticleOrb" width="108" height="108" style="width:82px; height:82px; flex-shrink:0;"></canvas>
            <div style="flex:1; min-width:0;">
              <div style="font-size:9px; font-family:var(--font-mono); color:#38BDF8; letter-spacing:0.05em; font-weight:700;">AI VOICE CORE</div>
              <div style="font-size:13.5px; font-weight:700; color:#FFF; margin-top:1px;" id="ckOrbTitle">ИИ-Штурман</div>
              <div style="font-size:9.5px; color:#64748B;">«Штурман, статус?»</div>
              <div id="ckEqBars" style="display:flex; align-items:flex-end; gap:2.5px; height:16px; margin-top:5px;"></div>
            </div>
          </div>
          <!-- ЧТО СДЕЛАТЬ СЕЙЧАС: по стадии, климату и чек-листу вида из базы знаний -->
          <div style="display:flex; flex-direction:column; gap:6px; min-height:0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="ck-title" style="font-size:11.5px;">Что сделать сейчас</span>
              <span class="ck-badge" id="ckTodoBadge" style="color:#38BDF8; border-color:rgba(56,189,248,0.3);">—</span>
            </div>
            <div class="ck-todo" id="ckTodoList"></div>
          </div>
        </div>

        <div class="ck-bottom-split">
          <div class="ck-card">
            <!-- ДЕНЬГИ ПАРТИИ: прибыль = выручка по каналу − (сырьё + соль + энергия + упаковка); цены и себестоимость — knowledge/marketing.js -->
            <div class="ck-hdr">
              <div style="min-width:0;">
                <div class="ck-title">Деньги партии</div>
                <div style="display:flex; align-items:baseline; gap:6px; flex-wrap:wrap; margin-top:2px;">
                  <span class="ck-money-big" id="ckHeroProfit" data-fx-counted="1">—</span>
                  <span class="ck-badge" id="ckHeroRoi" style="color:#2DD4BF; border-color:rgba(45,212,191,0.35);">—</span>
                </div>
                <div class="ck-sub" id="ckMoneySub">прибыль = выручка − сырьё, соль, энергия, упаковка</div>
              </div>
              <span class="ck-badge" id="ckPackName" style="color:#38BDF8; border-color:rgba(56,189,248,0.3);">Вакуум</span>
            </div>
            <div class="ck-pill-bars" id="ckMoneyBars" style="grid-template-columns:repeat(5, 1fr) !important; gap:6px !important;">
              ${[["Опт", 0], ["Полуопт", 1], ["Вакуум", 2], ["Розница", 3], ["Микс", 4]].map(([n, i]) => `
              <div class="ck-bar-col${i === 2 ? " active" : ""}" data-ch="${i}" onclick="window.ckSelectChannel(${i})">
                <span class="ck-bar-val" id="ckBarVal${i}">—</span>
                <div class="ck-bar-body"><div class="ck-bar-inner-rod" id="ckBarRod${i}" style="height:50%;"></div><div class="ck-bar-check-wrap">${checkIconSvg}</div></div>
                <span class="ck-bar-lbl">${n}</span>
              </div>`).join("")}
            </div>
            <div class="ck-card-footer">
              <span id="ckMoneyCostTxt" style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">—</span>
              <span style="color:#38BDF8; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; flex-shrink:0;" onclick="window.ckOpenCostEditor && window.ckOpenCostEditor()" title="Цены сырья, соли, электроэнергии и упаковки (база знаний + ваши правки)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Цены</span>
            </div>
          </div>

          <div class="ck-card">
            <div class="ck-hdr">
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${window.__TROLLEY_3D_DATA_URL__ || 'trolley-real.jpg'}" onerror="this.onerror=null;this.src='trolley-3d.png'" alt="Труль SS304 3D" title="Открыть 3D-инспектор тележки (Труль SS304)" onclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(1,'Ряд А • Вимба')" style="width:30px; height:30px; border-radius:8px; object-fit:cover; border:1px solid rgba(0,240,255,0.45); box-shadow:0 0 10px rgba(0,240,255,0.25); cursor:pointer; flex-shrink:0;"/>
                <div><div class="ck-title">Матрица 15 Тележек</div><div class="ck-sub">3 ряда × 5 трулей SS304</div></div>
              </div>
              <span class="ck-badge" id="ckTrolleysCnt" style="color:#38BDF8; border-color:rgba(56,189,248,0.3); cursor:pointer;" onclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(1,'Ряд А • Вимба')">12 / 15 в работе</span>
            </div>
            <div id="ckHabitRows" style="display:flex; flex-direction:column; gap:7px; margin:auto 0;"></div>
            <div class="ck-card-footer">
              <span id="ckTrolleyCapTxt">Загрузка: — кг/тележку</span>
              <span style="color:#2DD4BF;font-weight:700;cursor:pointer;" onclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(1,'Ряд А • Вимба')">● 3D Труль: OK</span>
            </div>
          </div>
        </div>

        <div class="ck-card">
          <div style="display:grid; grid-template-columns:104px 1fr; gap:12px; align-items:center; flex:1;">
            <div style="position:relative; width:104px; height:104px; display:flex; align-items:center; justify-content:center;">
              <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
                <defs>
                  <linearGradient id="ckTimerRingGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#00F0FF"/>
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6.5"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ckTimerRingGrad)" stroke-width="6.5" stroke-dasharray="205 264" stroke-linecap="round"/>
              </svg>
              <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <span style="font-size:20px; font-weight:800; font-family:var(--font-mono); font-variant-numeric:tabular-nums;" id="ckTimerDigits">— ч</span>
                <span style="font-size:8.5px; color:#38BDF8; font-family:var(--font-mono); font-weight:700;" id="ckTimerSubLbl">ИЗ 84 Ч</span>
              </div>
              <button onclick="window.ckCycleStart()" title="Старт / перезапуск партии" style="position:absolute; bottom:-2px; left:50%; transform:translateX(-50%); width:25px; height:25px; border-radius:50%; border:2px solid #10121A; background:linear-gradient(135deg,#2563EB,#00F0FF); color:#FFF; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 12px rgba(0,240,255,0.5);">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:7px;">
              <div><div class="ck-title">Цикл партии</div><div class="ck-sub" id="ckCycleSub">Партия не запущена — нажмите ▶</div></div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px;">
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:6px 8px; text-align:center;" title="Расчёт по влажности спинки и соли (ARMCore), не замер">
                  <span style="font-size:9px; color:#64748B; display:block;">a_w (расчёт)</span>
                  <strong style="font-family:var(--font-mono); font-size:12px; color:#2DD4BF;" id="ckAwVal">—</strong>
                </div>
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:6px 8px; text-align:center;">
                  <span style="font-size:9px; color:#64748B; display:block;">Цель a_w вида</span>
                  <strong style="font-family:var(--font-mono); font-size:12px; color:#F59E0B;" id="ckAwTarget">—</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="ck-card-footer">
            <span>Время — по часам компьютера, без связи с MCGS</span>
            <span style="color:#38BDF8;" id="ckStartTxt">—</span>
          </div>
        </div>

        <div class="ck-card">
          <div class="ck-hdr">
            <div><div class="ck-title">Калькулятор Партии</div><div class="ck-sub">Сырье → Выход и Посол 20°Bé</div></div>
            <span class="ck-badge" id="ckExYield" style="color:#38BDF8; border-color:rgba(56,189,248,0.3);">61.5% выход</span>
          </div>
          <div style="position:relative; display:flex; flex-direction:column; gap:6px; margin:4px 0;">
            <div style="background:#0B0D14; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:7px 11px;">
              <div style="display:flex; justify-content:space-between; font-size:9.5px; color:#64748B;"><span>Сырье (кг)</span><span>Чан посола</span></div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <input type="number" id="ckRawInp" value="1850" step="50" style="background:transparent !important; border:none !important; box-shadow:none !important; color:#FFF !important; font-family:var(--font-mono); font-size:16px; font-weight:800; width:95px; outline:none;" oninput="window.ckRecalcEx()"/>
                <button id="ckSpeciesBtn" onclick="window.ckStepSpecies()" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#E2E8F0; padding:3px 8px; border-radius:7px; font-size:10.5px; font-weight:600; cursor:pointer;">Вимба ▾</button>
              </div>
            </div>
            <div onclick="window.ckStepSpecies()" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#2563EB,#00F0FF); border:2px solid #10121A; color:#FFF; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 12px rgba(0,240,255,0.5); z-index:4;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </div>
            <div style="background:#0B0D14; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:7px 11px;">
              <div style="display:flex; justify-content:space-between; font-size:9.5px; color:#64748B;"><span>Готовая рыба</span><span id="ckSaltTxt">Соль: 259 кг (11 мешк.)</span></div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <strong style="font-family:var(--font-mono); font-size:16px; color:#38BDF8;" id="ckOutTxt">1 138 кг</strong>
                <span class="ck-badge" style="color:#2DD4BF;" id="ckWatTxt">-712 л усушка</span>
              </div>
            </div>
          </div>
          <button onclick="if(typeof openWhatsAppReportModal==='function')openWhatsAppReportModal();" style="width:100%; height:35px; border-radius:12px; border:1px solid rgba(255,255,255,0.28); background:linear-gradient(90deg,#2563EB 0%,#0891B2 50%,#2563EB 100%); color:#FFF; font-family:var(--font-mono); font-size:11.5px; font-weight:700; cursor:pointer; box-shadow:0 6px 20px rgba(37,99,235,0.55);">Отправить рапорт в WhatsApp</button>
        </div>
      </div>
    `;

    scadaPane.appendChild(root);
    scadaPane.appendChild(legacyBackup);

    window.ckDrawGrains = function (tLit, rLit) {
      let th = "", rh = "";
      for (let i = 0; i < 12; i++) {
        th += '<div class="ck-grain ' + (i < tLit ? "amber" : "") + '"></div>';
        rh += '<div class="ck-grain ' + (i < rLit ? "cyan" : "") + '"></div>';
      }
      const tg = document.getElementById("ckTempGrains"), rg = document.getElementById("ckRhGrains");
      if (tg) tg.innerHTML = th;
      if (rg) rg.innerHTML = rh;
    };
    window.ckDrawGrains(8, 7);

    let hsIdx = 1;
    const hsNodes = [
      { z: "Турбины Cantoni 4×3кВт", t: "15.8°C", rh: "58%", vpd: "2.8 м/с", top: "8px", left: "8px" },
      { z: "Зона 15 тележек (Вимба)", t: "14.5°C", rh: "58%", vpd: "0.75 кПа", top: "8px", left: "8px" },
      { z: "V-Испаритель 1#Dehumicoil", t: "+2.4°C", rh: "8.4 бар", vpd: "Отжим 75 л/ч", top: "8px", left: "8px" },
      { z: "Трап слива конденсата [21]", t: "+7.4°C", rh: "100%", vpd: "712 литров", top: "8px", left: "8px" }
    ];

    window.ckSelectNode = function (idxOrZone, zoneOrT, tOrRh, rhOrVpd, vpdOrTop, topOrLeft, leftArg) {
      let idx = 0, zone = idxOrZone, t = zoneOrT, rh = tOrRh, vpd = rhOrVpd, top = vpdOrTop || "8px", left = topOrLeft || "8px";
      if (typeof idxOrZone === "number") {
        idx = idxOrZone; zone = zoneOrT; t = tOrRh; rh = rhOrVpd; vpd = vpdOrTop; top = topOrLeft || "8px"; left = leftArg || "8px";
      }
      hsIdx = idx;
      const p = document.getElementById("ckPopoverBox");
      if (p) { p.style.top = top; p.style.left = left; }
      const zEl = document.getElementById("ckPopZone");
      if (zEl) zEl.textContent = zone;
      const lbl = document.getElementById("ckActiveNodeLbl");
      if (lbl) lbl.textContent = "Активный узел: " + zone + " (" + vpd + ")";
      const tEl = document.getElementById("ckPopTemp");
      if (tEl) tEl.textContent = t;
      const rEl = document.getElementById("ckPopRh");
      if (rEl) rEl.textContent = rh;
      const vEl = document.getElementById("ckPopVpd");
      if (vEl) vEl.textContent = vpd;
      window.ckDrawGrains(6 + (idx * 2) % 5, 6 + (idx * 3) % 5);
    };

    window.ckCycleHotspot = function () {
      const next = (hsIdx + 1) % hsNodes.length;
      const h = hsNodes[next];
      window.ckSelectNode(next, h.z, h.t, h.rh, h.vpd, h.top, h.left);
    };

    const cSvg = document.getElementById("ckCandlesSvg");
    if (cSvg) {
      let cHtml = "";
      for (let i = 0; i < 24; i++) {
        const x = 8 + i * 13, wv = Math.sin(i * 0.45) * 26 + Math.cos(i * 0.9) * 12;
        const topY = 62 - wv, h = 22 + (i % 4) * 7, isTeal = i % 2 === 0, col = isTeal ? "#2DD4BF" : "#3B82F6";
        cHtml += `<line x1="${x + 2.5}" y1="${topY - 7}" x2="${x + 2.5}" y2="${topY + h + 7}" stroke="${col}" opacity="0.45"/><rect x="${x}" y="${topY}" width="5" height="${h}" rx="2.5" fill="${col}" opacity="${isTeal ? 0.9 : 0.68}"/>`;
      }
      cSvg.innerHTML = cHtml;
    }

    window.ckUpdateTrolleyCount = function () {
      const cnt = document.querySelectorAll("#ckHabitRows .ck-tr-circle.lit-blue, #ckHabitRows .ck-tr-circle.lit-amber").length;
      const badge = document.getElementById("ckTrolleysCnt");
      if (badge) badge.textContent = cnt + " / 15 в работе";
    };

    window.ckOpenTrolley3DModal = function (trolleyNum, rowLabel) {
      let modal = document.getElementById("ckTrolley3DModalOverlay");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "ckTrolley3DModalOverlay";
        modal.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(4,7,13,0.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;";
        modal.onclick = function (ev) { if (ev.target === modal) modal.style.display = "none"; };
        document.body.appendChild(modal);
      }
      const num = trolleyNum || 1;
      const rLbl = rowLabel || "Ряд А • Вимба";
      modal.style.display = "flex";
      modal.innerHTML = `
        <div style="width:100%;max-width:520px;background:linear-gradient(155deg,#131824 0%,#090D16 100%);border:1px solid rgba(0,240,255,0.38);border-radius:20px;padding:18px;box-shadow:0 24px 64px rgba(0,0,0,0.85),0 0 28px rgba(0,240,255,0.18);color:#F8FAFC;font-family:var(--font-sans,sans-serif);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <div style="font-size:10px;font-family:var(--font-mono);color:#00F0FF;letter-spacing:0.08em;text-transform:uppercase;">3D ИНСПЕКТОР • AISI 304 (ISO-22000)</div>
              <div style="font-size:16px;font-weight:800;color:#FFF;margin-top:2px;">Труль (Тележка) №${num} • ${rLbl}</div>
            </div>
            <button onclick="document.getElementById('ckTrolley3DModalOverlay').style.display='none'" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);color:#CBD5E1;width:30px;height:30px;border-radius:8px;cursor:pointer;font-weight:700;">✕</button>
          </div>
          <div style="display:grid;grid-template-columns:200px 1fr;gap:14px;align-items:center;">
            <div style="position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(0,240,255,0.4);box-shadow:0 0 20px rgba(0,240,255,0.22);aspect-ratio:1/1;background:#060A12;">
              <img src="${window.__TROLLEY_3D_DATA_URL__ || 'trolley-real.jpg'}" onerror="this.onerror=null;this.src='trolley-3d.png'" alt="Труль №${num}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
              <span style="position:absolute;top:8px;left:8px;background:rgba(6,10,18,0.88);border:1px solid rgba(0,240,255,0.45);color:#00F0FF;font-family:var(--font-mono);font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;">ТРУЛЬ №${num}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
              <div style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 10px;">
                <div style="color:#94A3B8;font-size:10px;">КОНСТРУКЦИЯ РАМЫ</div>
                <div style="color:#F8FAFC;font-weight:700;margin-top:2px;">Нержавеющая сталь AISI 304 • 14 ярусов</div>
                <div style="color:#38BDF8;font-size:10.5px;margin-top:1px;">Верхний подвес на прутках + 12 сетчатых полок</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div style="background:rgba(0,240,255,0.07);border:1px solid rgba(0,240,255,0.25);border-radius:10px;padding:7px 9px;">
                  <div style="color:#94A3B8;font-size:9.5px;">ЗАГРУЗКА СЫРЬЯ</div>
                  <div style="color:#00F0FF;font-family:var(--font-mono);font-size:14px;font-weight:800;">220 кг</div>
                </div>
                <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.28);border-radius:10px;padding:7px 9px;">
                  <div style="color:#94A3B8;font-size:9.5px;">ВЛАГОСЪЕМ</div>
                  <div style="color:#FBBF24;font-family:var(--font-mono);font-size:14px;font-weight:800;">-0.54 л/ч</div>
                </div>
              </div>
              <button onclick="document.getElementById('ckTrolley3DModalOverlay').style.display='none'; if(typeof selectTab==='function')selectTab('batch');" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid rgba(0,240,255,0.45);background:linear-gradient(90deg,#0284C7,#00F0FF);color:#04080E;font-weight:800;font-size:11.5px;cursor:pointer;">Открыть все 15 трулей во вкладке «Партия» →</button>
            </div>
          </div>
        </div>
      `;
    };

    const hBox = document.getElementById("ckHabitRows");
    if (hBox) {
      const rows = [
        { n: "Ряд А • Вимба", b: "A", l: 5, cls: "lit-blue", bCol: "#38BDF8", offset: 0 },
        { n: "Ряд Б • Вимба", b: "B", l: 4, cls: "lit-blue", bCol: "#38BDF8", offset: 5 },
        { n: "Ряд В • Плотва", b: "C", l: 3, cls: "lit-amber", bCol: "#F59E0B", offset: 10 }
      ];
      hBox.innerHTML = rows.map((r) => {
        let cc = "";
        for (let i = 0; i < 5; i++) {
          const tNum = r.offset + i + 1;
          cc += `<div class="ck-tr-circle ${i < r.l ? r.cls : ""}" title="Труль №${tNum} (${r.n})" onclick="this.classList.toggle('${r.cls}'); window.ckUpdateTrolleyCount();" ondblclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(${tNum},'${r.n}')"></div>`;
        }
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:6px 10px;">
            <span onclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(${r.offset + 1},'${r.n}')" style="display:inline-flex; align-items:center; gap:7px; font-size:11px; font-family:var(--font-mono); color:#E2E8F0; cursor:pointer;" title="Нажмите для 3D-осмотра труля">
              <strong style="width:20px; height:20px; border-radius:6px; background:${r.bCol}22; border:1px solid ${r.bCol}55; color:${r.bCol}; font-size:9.5px; display:inline-flex; align-items:center; justify-content:center;">${r.b}</strong>
              ${r.n}
            </span>
            <div style="display:flex; gap:6px;">${cc}</div>
          </div>`;
      }).join("");
    }

    const eq = document.getElementById("ckEqBars");
    if (eq) {
      for (let i = 0; i < 20; i++) {
        const d = document.createElement("div");
        d.className = "ck-eq-bar-item";
        d.style.cssText = `width:2.5px; height:${4 + (i % 5) * 3}px; background:#38BDF8; border-radius:2px; transition:height 0.15s ease;`;
        eq.appendChild(d);
      }
    }

    startParticleOrbOnCanvas(document.getElementById("ckParticleOrb"));

    window.ckSyncPidToMainBadges = function () {
      if (!window.ARMCore || typeof window.ARMCore.computeClosedLoopPid !== "function") return;
      const tel = (window.state && window.state.telemetry) || {};
      const pid = window.ARMCore.computeClosedLoopPid(tel);
      const tStr = pid.tempC.toFixed(1);
      const pt = document.getElementById("ckPopTemp");
      if (pt) pt.textContent = tStr + "°C";
      const pv = document.getElementById("ckPopVpd");
      if (pv) pv.textContent = pid.vpdKpa.toFixed(2) + " кПа";
      const pr = document.getElementById("ckPopRh");
      if (pr) pr.textContent = Math.round(pid.rhPct) + "%";
      const ht = document.getElementById("ckHdrTempTxt");
      if (ht) ht.textContent = "+" + tStr + "°C";
      const hr = document.getElementById("ckHdrRhTxt");
      if (hr) hr.textContent = Math.round(pid.rhPct) + "% rH";
      const tc = document.getElementById("ckTooltipClim");
      if (tc) tc.textContent = "+" + tStr + "°C • " + Math.round(pid.rhPct) + "% rH";
      const c1 = document.getElementById("ckBtnC1");
      if (c1) {
        c1.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg><div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Контур #1</div><div style="font-size:8.5px; color:#2DD4BF;">EEV ${pid.recEevSteps} • ВКЛ</div></div>`;
      }
      const c2 = document.getElementById("ckBtnC2");
      if (c2) {
        c2.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${pid.statusCol}" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><div><div style="font-size:10px; font-weight:700; color:#F8FAFC;">Анти-Закал</div><div style="font-size:8.5px; color:${pid.statusCol};">VPD ${pid.vpdKpa.toFixed(2)} кПа</div></div>`;
      }
    };

    window.ckStepTemp = function (delta) {
      if (!window.state) window.state = { telemetry: {} };
      if (!window.state.telemetry) window.state.telemetry = {};
      window.state.telemetry.environmentTempC = +(Number(window.state.telemetry.environmentTempC || 15.8) + delta).toFixed(1);
      window.ckSyncPidToMainBadges();
      if (typeof window.renderAll === "function") window.renderAll();
      if (typeof window.ckHomeRefresh === "function") window.ckHomeRefresh();
    };

    window.ckSelectPack = function (name, prof, roi, el) {
      document.querySelectorAll(".ck-bar-col").forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      const pn = document.getElementById("ckPackName");
      if (pn) pn.textContent = name;
      const hp = document.getElementById("ckHeroProfit");
      if (hp) hp.textContent = "+" + prof.toLocaleString("ru-RU") + ".00 €";
      const hr = document.getElementById("ckHeroRoi");
      if (hr) hr.textContent = "+" + roi + "% ROI";
    };

    const ckSpeciesCycle = [
      { key: "VIMBA", btn: "Вимба ▾", yield: 0.615, price: 15.0, saltRatio: 0.140 },
      { key: "BREAM", btn: "Лещ ▾", yield: 0.600, price: 9.5, saltRatio: 0.160 },
      { key: "ROACH", btn: "Плотва ▾", yield: 0.580, price: 12.0, saltRatio: 0.135 },
      { key: "SMELT", btn: "Корюшка ▾", yield: 0.520, price: 25.0, saltRatio: 0.105 },
      { key: "PERCH", btn: "Окунь ▾", yield: 0.560, price: 12.5, saltRatio: 0.145 },
      { key: "ROUND_GOBY", btn: "Бычок ▾", yield: 0.525, price: 8.5, saltRatio: 0.120 }
    ];
    let ckSpIdx = 0;

    function syncCkCycleWithKnowledge() {
      if (!window.ARM_KB || typeof window.ARM_KB.getCanonicalSpecies !== "function") return;
      ckSpeciesCycle.forEach((item) => {
        const c = window.ARM_KB.getCanonicalSpecies(item.key);
        if (c) {
          item.yield = (c.yieldNorm || 60) / 100;
          item.price = c.vacuumPriceEur || item.price;
          item.saltRatio = (c.saltKgPerTon || 140) / 1000;
          item.btn = (c.shortRu || item.key) + " ▾";
        }
      });
    }
    if (window.ARM_KB && window.ARM_KB.ready) {
      window.ARM_KB.ready.then(() => {
        syncCkCycleWithKnowledge();
        window.ckRecalcEx(true);
      });
    }

    window.ckRecalcEx = function (silentSync) {
      syncCkCycleWithKnowledge();
      const inp = document.getElementById("ckRawInp");
      const raw = parseInt(inp ? inp.value : 1850, 10) || 1850;
      const sp = ckSpeciesCycle[ckSpIdx];
      const out = Math.round(raw * sp.yield), wat = raw - out, salt = Math.round(raw * (sp.saltRatio || 0.14));
      const prof = Math.round(out * sp.price);
      const ot = document.getElementById("ckOutTxt"); if (ot) ot.textContent = out.toLocaleString("ru-RU") + " кг";
      const wt = document.getElementById("ckWatTxt"); if (wt) wt.textContent = "-" + wat + " л усушка";
      const st = document.getElementById("ckSaltTxt"); if (st) st.textContent = `Соль: ${salt} кг (${Math.ceil(salt / 25)} мешк.)`;
      const yld = document.getElementById("ckExYield"); if (yld) yld.textContent = (sp.yield * 100).toFixed(1) + "% выход";
      const wr = document.getElementById("ckWellRaw"); if (wr) wr.textContent = (raw / 1000).toFixed(2) + " T";
      const wo = document.getElementById("ckWellOut"); if (wo) wo.textContent = out.toLocaleString("ru-RU") + " кг";
      const ww = document.getElementById("ckWellWater"); if (ww) ww.textContent = wat + ".0 L";
      void prof; // деньги партии считает ckHomeRefresh (выручка − сырьё по каналу продаж)
      if (!silentSync) {
        if (typeof window.updateBatchWeight === "function") window.updateBatchWeight(raw);
        if (window.ARM_KB && typeof window.ARM_KB.setSharedBatch === "function") {
          window.ARM_KB.setSharedBatch({
            speciesKey: sp.key,
            rawKg: raw,
            yieldPct: +(sp.yield * 100).toFixed(1)
          }, "core-domain");
        }
      }
    };

    // ================= ГЛАВНЫЙ ЭКРАН: «Партия сейчас», «Что сделать», «Цикл», «Деньги», тележки =================
    // Источник — общая партия (ARM_KB.getSharedBatch) и база знаний; время цикла — от старта партии
    // по часам компьютера (связи с контроллером нет). Ход сушки — та же 84-часовая модель, что в симуляторе.
    const CYCLE_KEY = "JURMALCIEMS_CYCLE_START_V1";
    const CYCLE_H = 84;
    const STAGES = [
      { to: 12, name: "Подвяливание", short: "СТ.1" },
      { to: 38, name: "Основная сушка", short: "СТ.2" },
      { to: 72, name: "Отволаживание", short: "СТ.3" },
      { to: 999, name: "Финиш", short: "СТ.4" },
    ];
    const PHOTO = [[0, "Свежая / солёная"], [13, "Подвяливание"], [35, "Активное вяление"], [68, "Готовая вяленая"], [84, "Выдержанная"]];
    // канал продаж → цена из marketing.js и вид упаковки: опт/полуопт — еврокубы, вакуум — KOMET, розница — премиум 1 шт,
    // микс — доля элиты в вакуум (ползунок раздельной выгрузки), остальное — опт в еврокубах
    const CHANNELS = [["Опт", "wholesale"], ["Полуопт", "semi"], ["Вакуум", "vacuum"], ["Розница", "retail"], ["Микс", "mix"]];
    let ckChannel = 2;
    let ckRowsKey = "";

    function cycleStart() {
      try { const v = Number(localStorage.getItem(CYCLE_KEY)); return v > 0 ? v : 0; } catch (e) { return 0; }
    }
    function cycleHour() {
      const s = cycleStart();
      return s ? Math.max(0, (Date.now() - s) / 3600000) : null;
    }
    window.ckCycleStart = function () {
      if (cycleStart() && !window.confirm("Перезапустить отсчёт партии с нуля (сейчас)?")) return;
      try { localStorage.setItem(CYCLE_KEY, String(Date.now())); } catch (e) {}
      window.ckHomeRefresh();
    };
    window.ckCycleShift = function (hours) {
      const s = cycleStart() || Date.now();
      try { localStorage.setItem(CYCLE_KEY, String(s - hours * 3600000)); } catch (e) {}
      window.ckHomeRefresh();
    };
    window.ckSelectChannel = function (i) {
      ckChannel = i;
      document.querySelectorAll("#ckMoneyBars .ck-bar-col").forEach((c) => c.classList.toggle("active", Number(c.dataset.ch) === i));
      window.ckHomeRefresh();
    };

    // ---- Окно «Цены»: значения из базы знаний, правки технолога хранятся на этом компьютере ----
    window.ckOpenCostEditor = function () {
      const KB = window.ARM_KB;
      if (!KB || !KB.getCostBase) return;
      const cb = KB.getCostBase();
      const ov = KB.getCostOverrides();
      const species = (KB.SPECIES_ORDER || ["VIMBA", "BREAM", "ROACH", "SMELT", "PERCH", "ROUND_GOBY"]);
      let box = document.getElementById("ckCostEditor");
      if (!box) { box = document.createElement("div"); box.id = "ckCostEditor"; document.body.appendChild(box); }
      const fld = (id, label, val, kbVal, unit, step) => `
        <label class="ckce-f"><span>${label}</span>
          <span class="ckce-in"><input type="number" step="${step || 0.01}" min="0" data-k="${id}" value="${val}" placeholder="${kbVal}"/><i>${unit}</i></span>
          <em>${Number(val) !== Number(kbVal) ? "база: " + kbVal : "из базы"}</em></label>`;
      const kbBase = KB.getCostBase({ ignoreOverrides: true });
      const rawRows = species.map((k) => {
        const c = KB.getCanonicalSpecies(k);
        const cur = KB.getRawPrice(k).eur;
        return fld("raw." + c.key, c.shortRu, cur, c.rawPriceEur, "€/кг", 0.05);
      }).join("");
      box.innerHTML = `<div class="ckce-back" onclick="if(event.target===this)this.parentNode.remove()">
        <div class="ckce-card" role="dialog" aria-label="Цены и себестоимость">
          <div class="ckce-head"><div><b>Цены и себестоимость партии</b><span>Значения из базы знаний (marketing.js). Ваши правки хранятся только на этом компьютере.</span></div>
            <button type="button" onclick="document.getElementById('ckCostEditor').remove()" aria-label="Закрыть">✕</button></div>
          <div class="ckce-sec">Сырьё</div><div class="ckce-grid">${rawRows}</div>
          <div class="ckce-sec">Соль и электроэнергия</div><div class="ckce-grid">
            ${fld("saltEurKg", "Соль", cb.saltEurKg, kbBase.saltEurKg, "€/кг", 0.01)}
            ${fld("saltKgPer100", "Расход соли", cb.saltKgPer100, kbBase.saltKgPer100, "кг/100 кг", 0.5)}
            ${fld("tariff", "Тариф", cb.tariff, kbBase.tariff, "€/кВт·ч", 0.01)}
          </div>
          <div class="ckce-sec">Упаковка</div><div class="ckce-grid">
            ${fld("vacEurPack", "Вакуум KOMET, 3 тушки", cb.vac.eurPerPack, kbBase.vac.eurPerPack, "€/пакет", 0.01)}
            ${fld("vacPacksPerMin", "Скорость KOMET", cb.vac.packsPerMin, kbBase.vac.packsPerMin, "пак/мин", 0.5)}
            ${fld("premEurPc", "Премиум 1 шт ~300 г", cb.prem.eurPerPc, kbBase.prem.eurPerPc, "€/шт", 0.01)}
            ${fld("sheetEur", "Гофрокартон (5 листов/куб)", cb.cube.eurPerSheet, kbBase.cube.eurPerSheet, "€/лист", 0.05)}
          </div>
          <div class="ckce-note">Мощность для расчёта энергии (база): Ст.1 — ${cb.power.st1Dry} кВт сушка / ${cb.power.st1Pause} кВт пауза, Ст.2–4 — ${cb.power.dry} / ${cb.power.pause} кВт.</div>
          <div class="ckce-foot">
            <button type="button" class="ckce-reset">Вернуть значения базы</button>
            <button type="button" class="ckce-save">Сохранить</button>
          </div>
        </div></div>`;
      box.querySelector(".ckce-save").onclick = () => {
        const patch = { raw: {} };
        box.querySelectorAll("input[data-k]").forEach((inp) => {
          const k = inp.dataset.k, v = Number(String(inp.value).replace(",", "."));
          const def = Number(inp.placeholder);
          const val = v > 0 && Math.abs(v - def) > 1e-9 ? v : null;
          if (k.startsWith("raw.")) patch.raw[k.slice(4)] = val; else patch[k] = val;
        });
        // null = «как в базе»: setCostOverrides удаляет такие ключи
        KB.setCostOverrides(patch);
        box.remove();
      };
      box.querySelector(".ckce-reset").onclick = () => { KB.resetCostOverrides(); box.remove(); };
    };
    if (!window.__ckCostHooked) {
      window.__ckCostHooked = true;
      window.addEventListener("arm-cost-changed", () => {
        try { window.ckHomeRefresh && window.ckHomeRefresh(); } catch (e) {}
        try { if (typeof window.renderAll === "function") window.renderAll(true); } catch (e) {}
      });
    }

    function setTxt(id, v) { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; }
    const eur = (v) => (v >= 0 ? "+" : "−") + Math.abs(Math.round(v)).toLocaleString("ru-RU") + " €";

    function todoFor(stage, h, pid, c, rng, sb) {
      const list = [];
      if (h === null) {
        list.push(["info", "Запустить отсчёт партии", "Нажмите ▶ Старт, когда тележки закатили в камеру — экран начнёт вести стадии и сроки."]);
      }
      // климат против коридора вида
      if (rng && pid) {
        if (pid.tempC > (c.emergencyMaxTempC || 99)) list.push(["bad", `Перегрев: +${pid.tempC.toFixed(1)}°C`, `Выше аварийного порога вида ${c.emergencyMaxTempC}°C — снизить температуру.`]);
        else if (pid.tempC > rng[1] + 0.3) list.push(["warn", `Воздух +${pid.tempC.toFixed(1)}°C выше коридора`, `Коридор вида ${rng[0]}–${rng[1]}°C.`]);
        else if (pid.tempC < rng[0] - 1.5) list.push(["warn", `Воздух +${pid.tempC.toFixed(1)}°C ниже коридора`, `Коридор вида ${rng[0]}–${rng[1]}°C.`]);
      }
      if (pid && pid.pidMode === "ANTI_CASE_HARDENING") list.push(["bad", "Риск закала", `VPD ${pid.vpdKpa.toFixed(2)} кПа — снизить ПЧ до ${pid.recHz} Гц или дать паузу.`]);
      if (pid && pid.pidMode === "INTENSIVE_DEHUMIDIFICATION") list.push(["warn", "Риск подпарки", `VPD ${pid.vpdKpa.toFixed(2)} кПа — усилить отжим (1#EEV ${pid.recEevSteps} st).`]);
      if (h !== null) {
        if (stage === 0) list.push(["info", "Снять верховую воду", "Полный обдув, следить за rH на старте не ниже нормы вида."]);
        if (stage === 1) list.push(["info", "Сравнить рыбу с эталоном стадии", "Фото слева — как должна выглядеть партия сейчас."]);
        if (stage === 1 && h > 24) list.push(["info", "Рокировка тележек", "Ряд В сохнет медленнее — поменять с рядом А."]);
        if (stage === 2) list.push(["info", "Режим 1 ч съём / 4 ч отдых", "Выравнивание влаги от хребта к поверхности, 13–15°C."]);
        if (stage === 3) list.push(["ok", "Проверить срез спинки", "«Янтарно-стекловидная слеза без белесых пятен» — готовность к вакууму KOMET."]);
      }
      // чек-лист вида из базы знаний — первый пункт, которого ещё нет
      if (c && c.prepChecklistRu && c.prepChecklistRu.length) {
        const tip = c.prepChecklistRu[Math.min(c.prepChecklistRu.length - 1, h === null ? 0 : stage)];
        list.push(["kb", `Памятка: ${c.shortRu}`, tip]);
      }
      if (!list.some((x) => x[0] === "bad" || x[0] === "warn") && pid) list.push(["ok", "Климат в норме", `VPD ${pid.vpdKpa.toFixed(2)} кПа • ${pid.statusRu.toLowerCase()}`]);
      return list.slice(0, 4);
    }

    window.ckHomeRefresh = function () {
      if (!document.getElementById("ckNowCard")) return;
      const KB = window.ARM_KB;
      const sb = KB && KB.getSharedBatch ? KB.getSharedBatch() : { speciesKey: "VIMBA", lowerKey: "vimba", rawKg: 1850, yieldPct: 61.5, mode: "mono" };
      const c = KB && KB.getCanonicalSpecies ? KB.getCanonicalSpecies(sb.speciesKey) : null;
      const tel = (window.state && window.state.telemetry) || {};
      const pid = window.ARMCore && window.ARMCore.computeClosedLoopPid ? window.ARMCore.computeClosedLoopPid(tel) : null;
      const raw = sb.rawKg, yieldPct = sb.yieldPct || (c ? c.yieldNorm : 60);
      const out = Math.round(raw * yieldPct / 100), water = raw - out;
      // калькулятор партии показывает ту же партию (вид и сырьё), что и остальной экран
      const spI = ckSpeciesCycle.findIndex((x) => x.key === sb.speciesKey);
      const rawInp = document.getElementById("ckRawInp");
      if ((spI >= 0 && spI !== ckSpIdx) || (rawInp && document.activeElement !== rawInp && Number(rawInp.value) !== raw)) {
        if (spI >= 0) ckSpIdx = spI;
        if (rawInp && document.activeElement !== rawInp) rawInp.value = raw;
        syncCkCycleWithKnowledge();
        const spBtn = document.getElementById("ckSpeciesBtn");
        if (spBtn) spBtn.textContent = ckSpeciesCycle[ckSpIdx].btn;
        window.ckRecalcEx(true);
      }
      const h = cycleHour();
      const hh = h === null ? 0 : h;
      const stage = STAGES.findIndex((s) => hh <= s.to);
      const prog = Math.pow(Math.min(1, hh / CYCLE_H), 0.7);
      const pi = hh < 7 ? 0 : hh < 24 ? 1 : hh < 52 ? 2 : hh < 76 ? 3 : 4;
      const rng = c ? (sb.mode === "mixed" ? c.tempRangeWithVimbaC : c.tempRangeMonoC) : null;

      // — Партия сейчас
      setTxt("ckNowName", c ? c.titleRu : sb.speciesKey);
      setTxt("ckNowKg", raw.toLocaleString("ru-RU") + " кг");
      setTxt("ckNowSub", c ? `${c.caliber} • посол ${c.saltingRange} ч • ${sb.mode === "mixed" ? "совместно с вимбой" : "моно-загрузка"}` : "");
      const img = document.getElementById("ckNowImg");
      const src = `img/vyalka/${sb.lowerKey || "vimba"}-${pi}.jpg`;
      if (img && img.getAttribute("src") !== src) { img.style.visibility = ""; img.classList.remove("on"); img.onload = () => img.classList.add("on"); img.src = src; }
      setTxt("ckNowPhotoTag", `Эталон: ${PHOTO[pi][0]} ч — ${PHOTO[pi][1]}`);
      setTxt("ckNowStage", h === null ? "Партия не запущена" : `${STAGES[stage].short} • ${STAGES[stage].name} • ${Math.floor(hh)} ч`);
      const bar = document.getElementById("ckNowBar");
      if (bar) bar.style.width = (Math.min(1, hh / CYCLE_H) * 100).toFixed(1) + "%";
      setTxt("ckNowEta", h === null ? "Нажмите ▶ Старт, когда партия в камере" : hh >= CYCLE_H ? `Цикл ${CYCLE_H} ч пройден — проверить срез и в вакуум` : `До финиша ≈ ${Math.ceil(CYCLE_H - hh)} ч (модель ${CYCLE_H} ч)`);
      setTxt("ckWellRaw", (raw / 1000).toFixed(2) + " т");
      setTxt("ckWellOut", out.toLocaleString("ru-RU") + " кг");
      setTxt("ckNowGone", Math.round(water * prog).toLocaleString("ru-RU") + " из " + water + " л");
      const chk = document.getElementById("ckNowCheck");
      if (chk && pid && rng) {
        const okT = pid.tempC >= rng[0] - 1.5 && pid.tempC <= rng[1] + 0.3;
        chk.className = "ck-now-check " + (okT ? "ok" : "warn");
        chk.textContent = `${okT ? "✓" : "⚠"} Воздух +${pid.tempC.toFixed(1)}°C ${okT ? "в коридоре" : "вне коридора"} вида ${rng[0]}–${rng[1]}°C`;
      }
      const startBtn = document.getElementById("ckNowStartBtn");
      if (startBtn) startBtn.textContent = h === null ? "▶ Старт" : "↺ Заново";

      // — Что сделать сейчас
      const todo = todoFor(h === null ? -1 : stage, h, pid, c, rng, sb);
      const tl = document.getElementById("ckTodoList");
      if (tl) {
        const html = todo.map(([lvl, t, d]) => `<div class="ck-todo-item ${lvl}"><i></i><div><b>${t}</b><span>${d}</span></div></div>`).join("");
        if (tl.innerHTML !== html) tl.innerHTML = html;
      }
      setTxt("ckTodoBadge", h === null ? "Не запущена" : STAGES[stage].name);

      // — Цикл партии
      const ring = document.querySelector("#ckTimerRingGrad");
      const ringCircle = ring && ring.closest("svg").querySelectorAll("circle")[1];
      if (ringCircle) ringCircle.setAttribute("stroke-dasharray", `${(264 * Math.min(1, hh / CYCLE_H)).toFixed(1)} 264`);
      setTxt("ckTimerDigits", h === null ? "— ч" : Math.floor(hh) + " ч");
      setTxt("ckTimerSubLbl", h === null ? "ИЗ 84 Ч" : `${STAGES[stage].short} • ИЗ 84 Ч`);
      const st = cycleStart();
      setTxt("ckCycleSub", h === null ? "Партия не запущена — нажмите ▶" : `${STAGES[stage].name} • до финиша ≈ ${Math.max(0, Math.ceil(CYCLE_H - hh))} ч`);
      setTxt("ckStartTxt", st ? "Старт: " + new Date(st).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
      setTxt("ckAwVal", pid ? pid.aw.toFixed(3) : "—");
      setTxt("ckAwTarget", c ? "≤ " + c.aw.toFixed(2) : "—");

      // — Деньги партии: выручка по каналу − (сырьё + соль + энергия + упаковка), всё из базы знаний
      if (c && KB && KB.computeBatchEconomics) {
        const stage4Mode = (tel && tel.stage4Mode) || "STANDARD";
        const vacShare = window.vx && Number.isFinite(Number(window.vx.mixVac)) ? Number(window.vx.mixVac) / 100 : 0.5;
        const ecos = CHANNELS.map(([, ch]) => KB.computeBatchEconomics({ speciesKey: sb.speciesKey, rawKg: raw, outKg: out, channel: ch, vacShare, stage4Mode }));
        const max = Math.max(...ecos.map((e) => Math.abs(e.profit)), 1);
        ecos.forEach((e, i) => {
          setTxt("ckBarVal" + i, (e.profit >= 0 ? "+" : "−") + (Math.abs(e.profit) / 1000).toFixed(1) + "k€");
          const rod = document.getElementById("ckBarRod" + i);
          if (rod) rod.style.height = Math.max(8, Math.round(Math.abs(e.profit) / max * 92)) + "%";
        });
        const e = ecos[ckChannel] || ecos[2];
        const k = (v) => (v >= 10000 ? (v / 1000).toFixed(1) + "k" : Math.round(v).toLocaleString("ru-RU"));
        setTxt("ckHeroProfit", eur(e.profit));
        setTxt("ckHeroRoi", e.revenue > 0 ? `маржа ${Math.round(e.profit / e.revenue * 100)}%` : "—");
        setTxt("ckPackName", CHANNELS[ckChannel][0] + (e.channel === "mix" ? ` ${Math.round(vacShare * 100)}%` : ""));
        setTxt("ckMoneySub", `выручка ${k(e.revenue)} − затраты ${k(e.totalCost)} € • себест. ${e.costPerKgOut.toFixed(2)} €/кг`);
        setTxt("ckMoneyCostTxt", `сырьё ${k(e.rawCost)}${e.rawPrice.edited ? "*" : ""} • соль ${k(e.saltCost)} • энергия ${k(e.energy.eur)} € (${e.energyPerKgOut.toFixed(2)} €/кг) • упак. ${k(e.packCost)}`);
        const card = document.getElementById("ckMoneyBars");
        if (card) card.title = [
          `Сырьё: ${raw.toLocaleString("ru-RU")} кг × ${e.rawPrice.eur.toFixed(2)} €/кг = ${Math.round(e.rawCost)} €${e.rawPrice.edited ? " (ваша цена)" : ""}`,
          `Соль: ${Math.round(e.saltKg)} кг × ${e.base.saltEurKg.toFixed(2)} € = ${Math.round(e.saltCost)} €`,
          `Энергия: ${Math.round(e.energy.kWh)} кВт·ч за ${e.energy.hours} ч × ${e.base.tariff.toFixed(2)} € = ${Math.round(e.energy.eur)} € (${e.energyPerKgOut.toFixed(3)} €/кг готовой)`,
          `Упаковка: ${e.packText} = ${Math.round(e.packCost)} €`,
          `Выручка: ${Math.round(e.revenue)} €  →  прибыль ${Math.round(e.profit)} €`,
        ].join("\n");
      }

      // — Матрица 15 тележек по кг на тележку из базы знаний
      const cap = c ? c.trolleyCapKg : 170;
      const n = Math.min(15, Math.ceil(raw / cap));
      setTxt("ckTrolleyCapTxt", `Загрузка: ${cap} кг/тележку (база знаний)`);
      const rowsKey = `${n}|${sb.speciesKey}`;
      const hBox2 = document.getElementById("ckHabitRows");
      if (hBox2 && rowsKey !== ckRowsKey) {
        ckRowsKey = rowsKey;
        const name = c ? c.shortRu : "";
        hBox2.innerHTML = ["A", "B", "C"].map((b, ri) => {
          const lit = Math.max(0, Math.min(5, n - ri * 5));
          const rn = `Ряд ${"АБВ"[ri]} • ${name}`;
          let cc = "";
          for (let i = 0; i < 5; i++) {
            const tNum = ri * 5 + i + 1;
            cc += `<div class="ck-tr-circle ${i < lit ? "lit-blue" : ""}" title="Тележка №${tNum} (${rn})" onclick="this.classList.toggle('lit-blue'); window.ckUpdateTrolleyCount();" ondblclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(${tNum},'${rn}')"></div>`;
          }
          return `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:6px 10px;">
            <span onclick="if(window.ckOpenTrolley3DModal)window.ckOpenTrolley3DModal(${ri * 5 + 1},'${rn}')" style="display:inline-flex; align-items:center; gap:7px; font-size:11px; font-family:var(--font-mono); color:#E2E8F0; cursor:pointer;">
              <strong style="width:20px; height:20px; border-radius:6px; background:#38BDF822; border:1px solid #38BDF855; color:#38BDF8; font-size:9.5px; display:inline-flex; align-items:center; justify-content:center;">${b}</strong>${rn}</span>
            <div style="display:flex; gap:6px;">${cc}</div></div>`;
        }).join("");
        window.ckUpdateTrolleyCount();
      }
    };
    ckRowsKey = "";
    if (!window.__ckHomeHooked) {
      window.__ckHomeHooked = true; // кокпит может пересобираться — подписываемся один раз
      if (window.ARM_KB) {
        if (window.ARM_KB.onBatchChange) window.ARM_KB.onBatchChange(() => window.ckHomeRefresh());
        if (window.ARM_KB.ready) window.ARM_KB.ready.then(() => window.ckHomeRefresh());
      }
      setInterval(() => { if (!document.hidden) window.ckHomeRefresh(); }, 20000);
    }
    setTimeout(() => window.ckHomeRefresh(), 0);

    window.ckStepSpecies = function () {
      syncCkCycleWithKnowledge();
      ckSpIdx = (ckSpIdx + 1) % ckSpeciesCycle.length;
      const sp = ckSpeciesCycle[ckSpIdx];
      const btn = document.getElementById("ckSpeciesBtn");
      if (btn) btn.textContent = sp.btn;
      window.ckRecalcEx(true);
      if (typeof window.selectSpecies === "function") window.selectSpecies(sp.key);
      const inp = document.getElementById("ckRawInp");
      const raw = parseInt(inp ? inp.value : 1850, 10) || 1850;
      if (window.ARM_KB && typeof window.ARM_KB.setSharedBatch === "function") {
        window.ARM_KB.setSharedBatch({
          speciesKey: sp.key,
          rawKg: raw,
          yieldPct: +(sp.yield * 100).toFixed(1)
        }, "core-domain");
      }
    };

    window.ckSetHeroFromShared = function (speciesKey, rawKg, yieldPct) {
      syncCkCycleWithKnowledge();
      const normKey = window.ARMCore ? window.ARMCore.normalizeSpeciesKey(speciesKey) : "VIMBA";
      const idx = ckSpeciesCycle.findIndex((x) => x.key === normKey);
      if (idx !== -1) {
        ckSpIdx = idx;
        if (yieldPct && !isNaN(Number(yieldPct))) {
          ckSpeciesCycle[ckSpIdx].yield = Number(yieldPct) / 100;
        }
        const btn = document.getElementById("ckSpeciesBtn");
        if (btn) btn.textContent = ckSpeciesCycle[ckSpIdx].btn;
      }
      const inp = document.getElementById("ckRawInp");
      if (inp && rawKg && document.activeElement !== inp) {
        inp.value = String(Math.round(Number(rawKg)));
      }
      window.ckRecalcEx(true);
    };

    let ckTimerPaused = false;
    window.ckToggleTimerPause = function () {
      ckTimerPaused = !ckTimerPaused;
      const lbl = document.getElementById("ckTimerSubLbl");
      if (lbl) lbl.textContent = ckTimerPaused ? "ПАУЗА • 18ГЦ" : "СУШКА • 30ГЦ";
      if (typeof window.setPausePhase === "function") window.setPausePhase(ckTimerPaused);
    };

    window.ckVoiceSpeak = function () {
      globalVoiceBoost = 2.2;
      const orbT = document.getElementById("ckOrbTitle");
      if (orbT) orbT.textContent = "Доклад активен...";
      document.querySelectorAll(".ck-eq-bar-item").forEach((b) => {
        b.style.height = `${6 + Math.random() * 12}px`;
        b.style.background = "#00F0FF";
      });
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        // доклад по текущим данным, а не по зашитым цифрам
        const pid = window.ARMCore.computeClosedLoopPid((window.state && window.state.telemetry) || {});
        const cntTxt = (document.getElementById("ckTrolleysCnt") || {}).textContent || "";
        const inWork = parseInt(cntTxt, 10);
        const prof = ((document.getElementById("ckHeroProfit") || {}).textContent || "").replace("€", "евро");
        const msg = new SpeechSynthesisUtterance(`Кокпит Юрмалциемс. Температура плюс ${pid.tempC.toFixed(1)} градусов, влажность ${Math.round(pid.rhPct)} процентов.` +
          (isFinite(inWork) ? ` В работе тележек: ${inWork} из пятнадцати.` : "") + (prof ? ` Прогноз чистой прибыли ${prof}.` : ""));
        msg.lang = "ru-RU";
        msg.onend = function () {
          globalVoiceBoost = 1;
          if (orbT) orbT.textContent = "ИИ-Штурман";
          document.querySelectorAll(".ck-eq-bar-item").forEach((b, i) => {
            b.style.height = `${4 + (i % 5) * 3}px`;
            b.style.background = "#38BDF8";
          });
        };
        window.speechSynthesis.speak(msg);
      }
    };
  }

  const SUBTAB_TITLES = {
    "tab-voice": { title: "Голосовой ИИ-Штурман", sub: "Речевое управление партией и голосовой доклад телеметрии AIM AGHD-250ELC" },
    "tab-calcs": { title: "Классические модули • 7 калькуляторов", sub: "Сырьё и весы • Посол • Фасовка и прибыль • Замеры и VPD • Стадии и энергия • Лог Parkside • Срез" },
    "tab-batch": { title: "Конвейер Партии и Матрица 15 Тележек SS304", sub: "Баланс влагосъема в трап • Раскладка по трулям • Калькулятор тузлука и льда" },
    "tab-profit": { title: "Прибыль партии • классические модули", sub: "Варианты сбыта • себестоимость • раздельная выгрузка KOMET / еврокубы" },
    "tab-console": { title: "Пульт камеры • классические модули", sub: "Климат и VPD • отдача воды (оценка) • 8 фаз MCGS • работа и паузы • лог Parkside" },
    "tab-advisor": { title: "Советник технолога • классические модули", sub: "Замеры и совет • журнал • график людей • 15 тележек • срез перед вакуумом • aw" },
    "tab-mcgs": { title: "Фазы Влагосъема и Климатическое Отволаживание", sub: "Биофизический регламент закрытого контура • Стадия 4 перед вакуумом KOMET" },
    "tab-species": { title: "Виды рыбы • классические модули", sub: "Матрица 6 видов • паспорт вида из базы знаний • фото среза" },
    "tab-chat": { title: "Нейросетевой ИИ-Технолог Цеха", sub: "Диагностика режима сушки, среза балыка и логов Parkside в реальном времени" },
    "tab-hardware": { title: "Анализатор Телеметрии Логгера Parkside (.CSV)", sub: "Глубокая аналитика 527 точек • Скорость сгона влаги и контроль пауз диффузии" },
    "owner-simple-view": { title: "Торговый Дом • Юрмалциемс", sub: "Переговорщик у лодки • 3D-Рентген среза • Чертеж KOMET vs TUBA • Склад и Касса" }
  };

  function injectBrandLogosAndFavicon() {
    if (!document.getElementById("ck-brand-favicon")) {
      const link = document.createElement("link");
      link.id = "ck-brand-favicon";
      link.rel = "icon";
      link.type = "image/png";
      link.href = "img/brand/fish-icon-64.png";
      document.head.appendChild(link);
    }
    const topTitle = document.querySelector(".top-bar .top-bar-title");
    if (topTitle && !topTitle.querySelector(".ck-topbar-logo")) {
      const img = document.createElement("img");
      img.className = "ck-topbar-logo";
      img.src = "img/brand/fish-icon-192.png";
      img.onerror = function () { this.onerror = null; this.src = "logo-icon.png"; };
      img.alt = "Jūrmalciems ARM";
      img.style.cssText = "width:28px;height:28px;border-radius:8px;object-fit:cover;border:1px solid rgba(56,189,248,0.45);box-shadow:0 0 12px rgba(56,189,248,0.28);flex-shrink:0;";
      topTitle.insertBefore(img, topTitle.firstChild);
    }
  }

  const STITCH_COCKPITS = [
    { paneId: "tab-calcs", src: "calcs-cockpit.html", title: "Расчёт партии • 15 тележек" },
    { paneId: "tab-profit", src: "profit-cockpit.html", title: "Прибыль партии • каналы продажи и фасовка" },
    { paneId: "tab-console", src: "console-cockpit.html", title: "Пульт камеры • климат, VPD, фазы MCGS и паузы" },
    { paneId: "tab-advisor", src: "advisor-cockpit.html", title: "Советник технолога • заключение, замеры тушки и срез" },
    { paneId: "tab-mcgs", src: "phases-cockpit.html", title: "8 фаз MCGS • таблица для контроллера и цикл по стадиям" },
    { paneId: "tab-hardware", src: "aim-cockpit.html", title: "Цифровой Двойник AIM AGHD-250ELC и Телеметрия Партии • 3D SCADA" },
    { paneId: "tab-b2b", src: "tuba-b2b.html", title: "B2B Витрина • Золотой Стандарт Балтийского Вяления SIA “TUBA”" },
    { paneId: "tab-cabinet", src: "client-cabinet.html", title: "B2B Кабинет Клиента • ВетИС & Онлайн-Телеметрия" },
    { paneId: "tab-kp", src: "kp-generator.html", title: "Инженерный B2B Калькулятор & Генератор КП (WhatsApp / PDF)" }
  ];

  window.ckSwitchTabMode = function (paneId, mode) {
    const pane = document.getElementById(paneId);
    if (!pane) return;
    const iframeWrap = pane.querySelector(".ck-stitch-iframe-box");
    const legacyWrap = pane.querySelector(".ck-legacy-pane-wrap");
    const btn3d = document.getElementById("ckBtn3D_" + paneId);
    const btnLeg = document.getElementById("ckBtnLeg_" + paneId);
    if (mode === "legacy") {
      if (iframeWrap) iframeWrap.style.display = "none";
      if (legacyWrap) {
        legacyWrap.style.display = "block";
        legacyWrap.querySelectorAll("iframe[data-src]").forEach((ifr) => {
          if (!ifr.getAttribute("src")) {
            ifr.setAttribute("src", ifr.getAttribute("data-src"));
          }
        });
      }
      if (btn3d) {
        btn3d.style.background = "rgba(30,41,59,0.7)";
        btn3d.style.color = "#94A3B8";
        btn3d.style.borderColor = "rgba(148,163,184,0.25)";
        btn3d.style.boxShadow = "none";
      }
      if (btnLeg) {
        btnLeg.style.background = "#00f0ff";
        btnLeg.style.color = "#002022";
        btnLeg.style.borderColor = "#00f0ff";
        btnLeg.style.boxShadow = "0 0 12px rgba(0,240,255,0.3)";
      }
      if (typeof window.applyTrolley3DImages === "function") window.applyTrolley3DImages();
    } else {
      if (iframeWrap) iframeWrap.style.display = "block";
      if (legacyWrap) legacyWrap.style.display = "none";
      if (btn3d) {
        btn3d.style.background = "#00f0ff";
        btn3d.style.color = "#002022";
        btn3d.style.borderColor = "#00f0ff";
        btn3d.style.boxShadow = "0 0 12px rgba(0,240,255,0.3)";
      }
      if (btnLeg) {
        btnLeg.style.background = "rgba(30,41,59,0.7)";
        btnLeg.style.color = "#94A3B8";
        btnLeg.style.borderColor = "rgba(148,163,184,0.25)";
        btnLeg.style.boxShadow = "none";
      }
    }
  };

  function mountBatchCockpitV19() {
    const batchPane = document.getElementById("tab-batch");
    if (batchPane) {
      let root = batchPane.querySelector("#ck-batch-v19-root");
      if (!root) {
        batchPane.style.padding = "0";
        batchPane.innerHTML = `
          <div id="ck-batch-v19-root" style="width:100%; height:calc(100vh - 60px); max-height:calc(100vh - 60px); min-height:540px; border-radius:16px; overflow:hidden; border:1px solid rgba(0,240,255,0.22); background:#0e131e; box-shadow:0 20px 50px rgba(0,0,0,0.65);">
            <iframe id="ckBatchIframeV19" data-src="batch-cockpit.html" style="width:100%; height:100%; min-height:540px; border:none; display:block; background:#0e131e;" title="Конвейер партии"></iframe>
          </div>
        `;
      }
      const isVisible =
        batchPane.classList.contains("active") ||
        batchPane.style.display === "block" ||
        getComputedStyle(batchPane).display !== "none";
      if (isVisible) {
        const ifr = batchPane.querySelector("#ckBatchIframeV19");
        if (ifr && !ifr.getAttribute("src")) {
          ifr.setAttribute("src", ifr.getAttribute("data-src") || "batch-cockpit.html");
        }
      }
    }

    STITCH_COCKPITS.forEach((cfg) => {
      const pane = document.getElementById(cfg.paneId);
      if (!pane) return;
      let shell = pane.querySelector(".ck-stitch-cockpit-shell");
      if (!shell) {
        const legacyWrap = document.createElement("div");
        legacyWrap.className = "ck-legacy-pane-wrap";
        legacyWrap.style.display = "none";
        legacyWrap.style.width = "100%";
        while (pane.firstChild) {
          legacyWrap.appendChild(pane.firstChild);
        }

        shell = document.createElement("div");
        shell.className = "ck-stitch-cockpit-shell";
        shell.style.width = "100%";
        shell.innerHTML = `
          <div class="ck-stitch-modebar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;height:38px;min-height:38px;padding:0 12px;margin-bottom:6px;border-radius:12px;background:rgba(14,19,30,0.92);border:1px solid rgba(0,240,255,0.22);box-shadow:0 6px 18px rgba(0,0,0,0.4);box-sizing:border-box;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:7px;height:7px;border-radius:50%;background:#00f0ff;box-shadow:0 0 8px #00f0ff;flex-shrink:0;"></span>
              <span style="font-size:12px;font-weight:700;color:#F8FAFC;letter-spacing:-0.01em;">${cfg.title}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <button type="button" onclick="window.ckSwitchTabMode('${cfg.paneId}','3d')" id="ckBtn3D_${cfg.paneId}" style="padding:3px 10px;border-radius:7px;font-size:10.5px;font-weight:700;background:#00f0ff;color:#002022;border:1px solid #00f0ff;cursor:pointer;box-shadow:0 0 10px rgba(0,240,255,0.3);">3D SCADA Кокпит</button>
              <button type="button" onclick="window.ckSwitchTabMode('${cfg.paneId}','legacy')" id="ckBtnLeg_${cfg.paneId}" style="padding:3px 10px;border-radius:7px;font-size:10.5px;font-weight:600;background:rgba(30,41,59,0.7);color:#94A3B8;border:1px solid rgba(148,163,184,0.25);cursor:pointer;">Классические модули АРМ</button>
            </div>
          </div>
          <div class="ck-stitch-iframe-box" style="width:100%; height:calc(100vh - 104px); max-height:calc(100vh - 104px); min-height:500px; border-radius:16px; overflow:hidden; border:1px solid rgba(0,240,255,0.22); background:#0e131e; box-shadow:0 20px 50px rgba(0,0,0,0.65);">
            <iframe class="ck-stitch-iframe" data-src="${cfg.src}" style="width:100%; height:100%; min-height:500px; border:none; display:block; background:#0e131e;" title="${cfg.title}"></iframe>
          </div>
        `;
        pane.appendChild(shell);
        pane.appendChild(legacyWrap);
      }

      const isVisible =
        pane.classList.contains("active") ||
        pane.style.display === "block" ||
        getComputedStyle(pane).display !== "none";
      if (isVisible) {
        const ifr = shell.querySelector(".ck-stitch-iframe");
        if (ifr && !ifr.getAttribute("src")) {
          ifr.setAttribute("src", ifr.getAttribute("data-src") || cfg.src);
        }
      }
    });
  }

  window.syncBatchFromIframe = function (payload) {
    if (!payload) return;
    const rawKg = Number(payload.rawKg || payload.weightKg) || 1850;
    const spKey = payload.speciesKey || "vimba";
    const core = window.ARMCore || {};
    const normKey = core.normalizeSpeciesKey ? core.normalizeSpeciesKey(spKey) : String(spKey).toUpperCase();
    const spObj = (core.FISH_SPECIES && (core.FISH_SPECIES[normKey] || core.FISH_SPECIES.VIMBA)) || { standardYield: 61.5 };
    const yieldPct = Number(payload.yieldPct) || spObj.standardYield || 61.5;
    const fishSelectMap = {
      VIMBA: "vimba",
      BREAM: "bream",
      ROACH: "roach",
      SMELT: "smelt",
      PERCH: "perch",
      ROUND_GOBY: "goby",
      GOBY: "goby"
    };
    const rawInp = document.getElementById("ckRawInput") || document.getElementById("ckRawInp");
    const fishSel = document.getElementById("ckFishSelect");
    if (rawInp && document.activeElement !== rawInp) rawInp.value = String(rawKg);
    if (fishSel && fishSelectMap[normKey]) {
      fishSel.value = fishSelectMap[normKey];
    }
    if (typeof window.ckSetHeroFromShared === "function") {
      window.ckSetHeroFromShared(normKey, rawKg, yieldPct);
    }
    if (typeof window.ckRecalcWidget === "function") {
      window.ckRecalcWidget();
    }
    if (typeof window.syncActiveBatch === "function") {
      window.syncActiveBatch("remote", normKey, rawKg);
    } else if (window.state && window.state.telemetry) {
      window.state.telemetry.speciesKey = normKey;
      window.state.telemetry.batchWeightKg = rawKg;
    }
    const readyKg = Math.round(rawKg * (yieldPct / 100));
    const drainL = Math.max(0, Math.round(rawKg - readyKg));
    const elTons = document.getElementById("ckRawTonsVal");
    const elReady = document.getElementById("ckReadyKgVal");
    const elDrain = document.getElementById("ckDrainLVal");
    const elYieldBadge = document.getElementById("ckCalcYieldBadge");
    if (elTons) elTons.textContent = (rawKg / 1000).toFixed(2) + " т";
    if (elReady) elReady.textContent = readyKg.toLocaleString("ru-RU") + " кг";
    if (elDrain) elDrain.textContent = drainL.toFixed(1) + " L";
    if (elYieldBadge) elYieldBadge.textContent = yieldPct.toFixed(1) + "% выход";

    updateSubtabBannerBadges();

    if (window.ARM_KB && typeof window.ARM_KB.setSharedBatch === "function" && payload._fromSharedBus !== true) {
      window.ARM_KB.setSharedBatch({
        speciesKey: normKey,
        rawKg: rawKg,
        yieldPct: yieldPct,
        mode: payload.mode || "mono"
      }, "iframe-bridge");
    }

    if (payload.switchToScada && typeof window.selectTab === "function") {
      window.selectTab("scada");
    }
  };

  if (window.ARM_KB && typeof window.ARM_KB.onBatchChange === "function") {
    window.ARM_KB.onBatchChange((batch, source) => {
      if (source === "core-domain" || source === "iframe-bridge") return;
      window.syncBatchFromIframe(Object.assign({}, batch, { _fromSharedBus: true }));
    });
  }

  function injectSubtabCockpitBanners() {
    Object.keys(SUBTAB_TITLES).forEach((paneId) => {
      if (paneId === "tab-batch") return;
      const pane = document.getElementById(paneId);
      if (!pane || pane.querySelector(".ck-subtab-banner")) return;
      const info = SUBTAB_TITLES[paneId];
      const banner = document.createElement("div");
      banner.className = "ck-subtab-banner";
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="img/brand/fish-icon-192.png" onerror="this.onerror=null;this.src='img/brand/tuba-mark.svg'" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1px solid rgba(96,165,250,0.4); box-shadow:0 4px 14px rgba(37,99,235,0.35); flex-shrink:0;" alt="Logo"/>
          <div>
            <div style="font-size:15px; font-weight:700; color:#F8FAFC; letter-spacing:-0.02em;">${info.title}</div>
            <div style="font-size:11px; color:#64748B; margin-top:1px;">${info.sub}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="ck-badge ck-live-batch" style="color:#F59E0B;">Вимба • 1 850 кг</span>
          <span class="ck-badge ck-live-clim" style="color:#2DD4BF;">+15.8°C • 58% rH • 0.75 кПа</span>
          <span class="ck-badge ck-live-profit" style="color:#60A5FA;">Прибыль: +19 237 €</span>
          <button class="ck-badge" style="cursor:pointer; background:rgba(37,99,235,0.18); color:#FFF; border-color:rgba(96,165,250,0.4); padding:5px 11px;" onclick="if(typeof setAppUiMode==='function' && document.body.classList.contains('mode-owner')) setAppUiMode('ENGINEER'); if(typeof selectTab==='function') selectTab('scada');">← В 3D-Кокпит</button>
        </div>`;
      const targetContainer = pane.querySelector(".ck-legacy-pane-wrap") || pane;
      targetContainer.insertBefore(banner, targetContainer.firstChild);
    });
    updateSubtabBannerBadges();
  }

  // Плашки в шапках вкладок показывают текущую партию и климат, а не застывшие цифры
  function updateSubtabBannerBadges() {
    const core = window.ARMCore;
    if (!core) return;
    const tel = (window.state && window.state.telemetry) || {};
    const spKey = core.normalizeSpeciesKey(tel.speciesKey || "VIMBA");
    const sp = core.FISH_SPECIES[spKey] || core.FISH_SPECIES.VIMBA;
    const kg = Math.round(Number(tel.batchWeightKg || 1850));
    const pid = core.computeClosedLoopPid(tel);
    const batchTxt = `${sp.shortRu} • ${kg.toLocaleString("ru-RU")} кг`;
    const climTxt = `+${pid.tempC.toFixed(1)}°C • ${Math.round(pid.rhPct)}% rH • ${pid.vpdKpa.toFixed(2)} кПа`;
    const heroEl = document.getElementById("ckHeroProfit");
    const profitTxt = heroEl ? `Прибыль: ${heroEl.textContent.trim()}` : null;
    document.querySelectorAll(".ck-live-batch").forEach((el) => { if (el.textContent !== batchTxt) el.textContent = batchTxt; });
    document.querySelectorAll(".ck-live-clim").forEach((el) => { if (el.textContent !== climTxt) el.textContent = climTxt; });
    if (profitTxt) document.querySelectorAll(".ck-live-profit").forEach((el) => { if (el.textContent !== profitTxt) el.textContent = profitTxt; });
  }
  window.ckUpdateSubtabBadges = updateSubtabBannerBadges;

  // Команды из страниц-кокпитов (iframe). При открытии через file:// Chrome запрещает iframe
  // напрямую вызывать функции главного окна, поэтому они шлют postMessage — выполняем только из белого списка.
  const IFRAME_COMMANDS = ["openWhatsAppReportModal", "exportAllBatchLogsCsv", "requestAiAdvice", "ckStepTemp", "openCloudSyncModal",
    "selectTab", "setPausePhase", "syncBatchFromIframe", "setAppUiMode", "ckOpenTrolley3DModal", "ckSwitchMainDeck",
    "setMcgsProtocol", "copyMcgsTable", "broadcastTelemetrySync", "ckOpenCostEditor", "printEurotankPassport", "setHeatRecoveryMode",
    "triggerExportCsv", "saveBatchToLog", "ckSwitchTabMode", "toggleCoLoad"];
  window.addEventListener("message", (ev) => {
    const d = ev.data;
    if (!d || d.type !== "arm-cmd" || !IFRAME_COMMANDS.includes(d.cmd)) return;
    const fn = window[d.cmd];
    if (typeof fn === "function") {
      try { fn.apply(window, Array.isArray(d.args) ? d.args : []); } catch (e) { console.warn("[arm-cmd]", d.cmd, e); }
    }
  });

  function fixParksideAndSpeciesSvgs() {
    document.querySelectorAll("#parkside-svg-container svg, #sh-parkside-chart-slot svg").forEach((svg) => {
      const texts = Array.from(svg.querySelectorAll("text"));
      const peakLabels = [];
      texts.forEach((t) => {
        const s = (t.textContent || "").trim();
        if (s.includes("Порог задутия") || s.includes("85% rH")) {
          t.setAttribute("x", "66");
          t.setAttribute("text-anchor", "start");
          const curY = parseFloat(t.getAttribute("y") || "48");
          if (curY > 36) t.setAttribute("y", String(curY - 10));
        } else if (/^\d+(\.\d+)?%$/.test(s)) {
          peakLabels.push(t);
        }
      });
      let lastX = -999;
      peakLabels.forEach((lbl) => {
        const x = parseFloat(lbl.getAttribute("x") || "0");
        if (Math.abs(x - lastX) < 34) lbl.style.display = "none";
        else { lbl.style.display = ""; lastX = x; }
      });
    });

    const speciesPane = document.getElementById("tab-species");
    if (speciesPane) {
      speciesPane.querySelectorAll("svg").forEach((svg) => {
        const txt = svg.textContent || "";
        if (txt.includes("Рубиново-стекловидный") || txt.includes("Розовый ястык икры")) {
          const parent = svg.parentElement;
          if (parent && !parent.dataset.xrayUpgraded) {
            parent.dataset.xrayUpgraded = "1";
            parent.innerHTML = buildBiometricCrossSectionSvg(58, 52, 46);
          }
        }
      });
    }
  }

  function scrubLegacyInlineStyles() {
    const panes = document.querySelectorAll('[id^="tab-"]:not(#tab-scada):not(#tab-batch)');
    panes.forEach((pane) => {
      pane.querySelectorAll("[style]").forEach((el) => {
        if (
          el.classList.contains("ck-grain") ||
          el.classList.contains("vx-bar") ||
          el.classList.contains("vx-mic-orb") ||
          el.classList.contains("ck-tr-circle")
        ) return;
        const st = el.getAttribute("style") || "";
        if (/#00f5d4|#00e5ff|#00bbf9|#a855f7|#10b981|#2ee59d|#ef4444|rgba\(\s*0\s*,\s*245\s*,\s*212|rgba\(\s*0\s*,\s*229\s*,\s*255|rgba\(\s*16\s*,\s*185\s*,\s*129/i.test(st)) {
          el.style.borderColor = "rgba(255, 255, 255, 0.072)";
          el.style.boxShadow = "none";
        }
        const txt = (el.textContent || "").trim();
        if (/^Ф[1-8]$/.test(txt)) {
          const isPauseSeg = txt === "Ф2" || txt === "Ф4" || txt === "Ф6";
          el.style.background = isPauseSeg ? "rgba(245, 158, 11, 0.16)" : "rgba(37, 99, 235, 0.22)";
          el.style.color = isPauseSeg ? "#FDE68A" : "#93C5FD";
          el.style.border = isPauseSeg ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(96, 165, 250, 0.35)";
        }
      });
    });
  }

  function installFunctionOverrides() {
    window.getScadaChamberMimicSvgMarkup = customGetScadaChamberMimicSvgMarkup;
    window.renderScadaChamberMimicSvg = function (t, stage, species, diag) {
      const container = document.getElementById("scada-chamber-mimic-svg-container");
      if (!container) return;
      if (!updateMountedCadMimicCardInPlace(container, t, stage, species)) {
        container.innerHTML = customGetScadaChamberMimicSvgMarkup(t, stage, species, diag);
      }
    };
    window.getScadaVpdSpeedometerSvgMarkup = customGetScadaVpdSpeedometerSvgMarkup;
    // Торговый Дом: новые блоки из js/trade-fx.js (честные источники + анимации); старые — запасной вариант
    const TFX = window.ArmTradeFx;
    window.buildOwnerFishCrossSectionHtml = (TFX && TFX.fish) || customBuildOwnerFishCrossSectionHtml;
    window.buildOwnerKometPackagingVisualHtml = (TFX && TFX.pack) || customBuildOwnerKometPackagingVisualHtml;
    window.buildOwnerWaterAndTimerVisualHtml = (TFX && TFX.water) || customBuildOwnerWaterAndTimerVisualHtml;
    // Колба и весы «Классических модулей» теперь свои (index.html, анимированные, шкала = полная камера) — не подменяем

    if (typeof window._renderAllCore === "function" && !window._renderAllCore.__ckWrappedV18) {
      const origRenderCore = window._renderAllCore;
      const wrappedCore = function () {
        installFunctionOverrides();
        const res = origRenderCore.apply(this, arguments);
        normalizeAllTabsToBento();
        updateSubtabBannerBadges();
        return res;
      };
      wrappedCore.__ckWrappedV18 = true;
      window._renderAllCore = wrappedCore;
    }

    if (typeof window.selectTab === "function" && !window.selectTab.__ckWrappedV18) {
      const origSelectTab = window.selectTab;
      const wrappedSelectTab = function (tabKey) {
        let key = tabKey;
        if (key === "phases" && document.getElementById("tab-mcgs")) key = "mcgs";
        if (key === "ai" && document.getElementById("tab-chat")) key = "chat";
        if (key === "aim" && document.getElementById("tab-hardware")) key = "hardware";
        const res = origSelectTab.call(this, key);
        normalizeAllTabsToBento();
        return res;
      };
      wrappedSelectTab.__ckWrappedV18 = true;
      window.selectTab = wrappedSelectTab;
    }
  }

  let _isNormalizing = false;
  // Полный проход по всем вкладкам тяжёлый (в т.ч. очистка эмодзи во всех текстах), а вызывается
  // на каждый клик и каждую перерисовку — не чаще раза в 400 мс, последний вызов всегда доходит
  let _normLastRun = 0, _normTimer = 0;
  function normalizeAllTabsToBento() {
    const now = Date.now();
    if (now - _normLastRun < 400) {
      if (!_normTimer) _normTimer = setTimeout(() => { _normTimer = 0; normalizeAllTabsToBento(); }, 400 - (now - _normLastRun));
      return;
    }
    _normLastRun = now;
    normalizeAllTabsToBentoNow();
  }
  window.normalizeAllTabsToBento = normalizeAllTabsToBento;
  window.normalizeAllTabsToBentoNow = normalizeAllTabsToBentoNow;
  function normalizeAllTabsToBentoNow() {
    if (_isNormalizing) return;
    _isNormalizing = true;
    try {
      const cssLink = document.querySelector('link[href*="cyber-scada.css"]');
      if (cssLink && cssLink.parentElement === document.head && document.head.lastElementChild !== cssLink) {
        document.head.appendChild(cssLink);
      }

      installFunctionOverrides();
      injectBrandLogosAndFavicon();
      mountMainScadaCockpit();
      mountBatchCockpitV19();
      injectSubtabCockpitBanners();

      document.querySelectorAll(".nav-rail .nav-item").forEach((btn) => {
        const id = (btn.id || "").toLowerCase();
        const oc = (btn.getAttribute("onclick") || "").toLowerCase();
        const txt = (btn.textContent || "").toLowerCase();
        let key = null;
        if (id.includes("knowledge") || oc.includes("knowledge")) key = "knowledge";
        else if (id.includes("scada") || oc.includes("scada")) key = "scada";
        else if (id.includes("voice") || oc.includes("voice") || txt.includes("штурман")) key = "voice";
        else if (id.includes("calc") || oc.includes("calc") || txt.includes("калькул") || txt.includes("расчет")) key = "calcs";
        else if (id.includes("batch") || oc.includes("batch") || txt.includes("партия")) key = "batch";
        else if (id.includes("profit") || oc.includes("profit") || txt.includes("прибыль")) key = "profit";
        else if (id.includes("console") || oc.includes("console") || txt.includes("пульт")) key = "console";
        else if (id.includes("advisor") || oc.includes("advisor") || txt.includes("советник")) key = "advisor";
        else if (id.includes("phase") || id.includes("mcgs") || oc.includes("mcgs") || oc.includes("phase") || txt.includes("фазы")) key = "phases";
        else if (id.includes("species") || oc.includes("species") || txt.includes("виды")) key = "species";
        else if (id.includes("ai") || id.includes("chat") || oc.includes("chat") || oc.includes("ai") || txt.includes("чат")) key = "ai";
        else if (id.includes("aim") || id.includes("hardware") || oc.includes("hardware") || oc.includes("aim") || txt.includes("aim")) key = "aim";
        else if (id.includes("kp") || oc.includes("kp") || txt.includes("кп") || txt.includes("генератор")) key = "kp";
        else if (id.includes("b2b") || oc.includes("b2b") || txt.includes("витрина") || txt.includes("tuba")) key = "b2b";
        else if (id.includes("cabinet") || oc.includes("cabinet") || txt.includes("кабинет")) key = "cabinet";

        if (key && NAV_RAIL_CONFIG[key] && !btn.dataset.bentoNavReady) {
          btn.dataset.bentoNavReady = "1";
          btn.innerHTML = `<span class="nav-emoji" style="display:flex;align-items:center;justify-content:center;">${NAV_RAIL_CONFIG[key].svg}</span><span class="nav-label">${NAV_RAIL_CONFIG[key].label}</span>`;
        }
      });

      const micOrbBtn = document.querySelector("#tab-voice .vx-mic-orb, .vx-mic-orb");
      if (micOrbBtn && !micOrbBtn.querySelector("#ckVoiceMicCanvas")) {
        micOrbBtn.innerHTML = `<canvas id="ckVoiceMicCanvas" width="152" height="152" style="width:148px; height:148px; border-radius:50%; pointer-events:none; display:block;"></canvas>`;
        startParticleOrbOnCanvas(document.getElementById("ckVoiceMicCanvas"));
      }

      document.querySelectorAll(".vx-icons-row").forEach((row) => {
        const id = (row.id || "").toLowerCase();
        const txt = (row.textContent || "");
        let col = "amber";
        if (id.includes("ice") || txt.includes("🧊")) col = "cyan";
        else if (id.includes("water") || txt.includes("💧")) col = "blue";
        if (!row.querySelector(".ck-grain-bar")) {
          row.innerHTML = renderGrainBarHtml(13, 18, col);
        }
      });

      const vbFlask = document.getElementById("vb-flask");
      if (vbFlask && typeof window.vxComputeBatch === "function") {
        const b = window.vxComputeBatch();
        vbFlask.innerHTML = customRenderSuperHubFlaskSvg(b);
      }
      const vbScale = document.getElementById("vb-scale");
      if (vbScale && typeof window.vxComputeBatch === "function") {
        const b = window.vxComputeBatch();
        vbScale.innerHTML = customRenderSuperHubDialScaleSvg(b.finished, b.y);
      }

      const shParksideSlot = document.getElementById("sh-parkside-chart-slot");
      if (shParksideSlot && (!shParksideSlot.innerHTML.trim() || shParksideSlot.textContent.includes("undefined"))) {
        const srcSvg = document.getElementById("parkside-svg-container");
        if (srcSvg && srcSvg.innerHTML.trim()) {
          shParksideSlot.innerHTML = srcSvg.innerHTML;
        }
      }

      if (!document.getElementById("ck-draw-trolley-script") && typeof window.applyTrolley3DImages !== "function") {
        const s = document.createElement("script");
        s.id = "ck-draw-trolley-script";
        s.src = "js/draw-trolley.js";
        s.onload = function () {
          if (typeof window.applyTrolley3DImages === "function") window.applyTrolley3DImages();
        };
        document.head.appendChild(s);
      }

      // Upgrade any legacy Труль / Тележки cards with trolley-3d.png if not already upgraded
      document.querySelectorAll(".trade-kpi-card, .vx-pipe-node").forEach((card) => {
        if (card.dataset.trolleyImgInjected) return;
        const txt = card.textContent || "";
        if (txt.includes("ТРУЛИ (ТЕЛЕЖКИ)") && !card.querySelector("img")) {
          card.dataset.trolleyImgInjected = "1";
          card.style.display = "flex";
          card.style.gap = "12px";
          card.style.alignItems = "center";
          const wrap = document.createElement("div");
          wrap.style.cssText = "flex:1;min-width:0;";
          while (card.firstChild) wrap.appendChild(card.firstChild);
          const img = document.createElement("img");
          img.className = "trolley-3d-img";
          img.setAttribute("data-trolley-3d", "1");
          img.src = window.__TROLLEY_3D_DATA_URL__ || "trolley-3d.png";
          img.alt = "Труль SS304";
          img.style.cssText = "width:72px;height:72px;border-radius:10px;object-fit:cover;border:1px solid rgba(0,240,255,0.45);box-shadow:0 0 14px rgba(0,240,255,0.28);flex-shrink:0;";
          card.appendChild(img);
          card.appendChild(wrap);
        } else if (card.classList.contains("vx-pipe-node") && txt.includes("Тележки") && !card.querySelector("img")) {
          card.dataset.trolleyImgInjected = "1";
          const ico = card.querySelector(".vx-pipe-ico");
          if (ico) {
            ico.innerHTML = `<img data-trolley-3d="1" class="trolley-3d-img" src="${window.__TROLLEY_3D_DATA_URL__ || 'trolley-3d.png'}" alt="Труль SS304" style="width:32px;height:32px;border-radius:7px;object-fit:cover;border:1px solid rgba(0,240,255,0.4);display:inline-block;vertical-align:middle;"/>`;
          }
        }
      });

      // Also upgrade any Труль №1..15 cells in Module 3 (Шахматка 15 Трулей) if rendered by legacy index.html
      const advPane = document.getElementById("tab-advisor");
      if (advPane) {
        advPane.querySelectorAll("div").forEach((div) => {
          if (div.dataset.trulCellUpgraded) return;
          const firstChild = div.firstElementChild;
          if (
            firstChild &&
            !div.querySelector("img") &&
            !(div.parentElement && div.parentElement.querySelector("img")) &&
            /^Труль №\d+$/.test((firstChild.textContent || "").trim())
          ) {
            div.dataset.trulCellUpgraded = "1";
            const isOcc = !(div.textContent || "").includes("ШТОРКА");
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.gap = "10px";
            div.style.textAlign = "left";
            const wrap = document.createElement("div");
            wrap.style.cssText = "flex:1;min-width:0;";
            while (div.firstChild) wrap.appendChild(div.firstChild);
            const img = document.createElement("img");
            img.className = "trolley-3d-img";
            img.setAttribute("data-trolley-3d", "1");
            img.src = window.__TROLLEY_3D_DATA_URL__ || "trolley-3d.png";
            img.alt = "Труль SS304";
            img.style.cssText = `width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid ${isOcc ? "rgba(0,240,255,0.45)" : "rgba(100,116,139,0.3)"};${isOcc ? "box-shadow:0 0 10px rgba(0,240,255,0.22);" : "filter:grayscale(1) opacity(0.42);"}flex-shrink:0;`;
            div.appendChild(img);
            div.appendChild(wrap);
          }
        });
      }

      if (typeof window.applyTrolley3DImages === "function") {
        window.applyTrolley3DImages();
      }

      fixParksideAndSpeciesSvgs();
      scrubLegacyInlineStyles();
      stripWindowsEmojisInNode(document.querySelector(".top-bar"));
      document.querySelectorAll('.tab-pane, [id^="tab-"], #owner-simple-view').forEach((pane) => {
        stripWindowsEmojisInNode(pane);
      });
    } catch (e) {
      console.warn("[Cockpit V18] normalize warning:", e);
    } finally {
      _isNormalizing = false;
    }
  }

  document.addEventListener("mousemove", (e) => {
    const card = e.target && e.target.closest ? e.target.closest(".ck-card, .card, .vx-glass, .sp-hub-card") : null;
    if (card) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  });

  function updateCockpitClock() {
    const el = document.getElementById("ckLiveTime");
    if (!el) return;
    const now = new Date();
    el.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }
  setInterval(updateCockpitClock, 10000);

  function fullBootV18() {
    installFunctionOverrides();
    normalizeAllTabsToBento();
    updateCockpitClock();
    setTimeout(() => {
      installFunctionOverrides();
      if (typeof window._renderAllCore === "function") {
        try { window._renderAllCore(); } catch (e) {}
      }
      normalizeAllTabsToBento();
      updateCockpitClock();
    }, 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fullBootV18);
  } else {
    fullBootV18();
  }

  window.addEventListener("load", fullBootV18);

  document.addEventListener("click", () => {
    requestAnimationFrame(normalizeAllTabsToBento);
  });
})();
