// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 8: ПАМЯТЬ ЦЕХА И САМООБУЧАЮЩИЕСЯ ПРАВИЛА (ES Module)
// ==========================================================================

import {
  FISH_SPECIES,
  TRADE_SPECIES_DEFAULTS
} from './constants.js';

import {
  state,
  vx,
  triggerHaptic,
  showToast,
  escapeHtml
} from './state.js';

import { tradeHouseState } from './calculators.js';

  // ==================== 🧠 ЯДРО «ПАМЯТЬ ЦЕХА ЮРМАЛЦИЕМС» (SILENT MEMORY LEDGER & PROACTIVE TRIGGERS) ====================
  const DEFAULT_WORKSHOP_MEMORY = {
    version: 1,
    batchesHistory: [
      {
        id: "mem_seed_1",
        date: "2026-10-24",
        timestamp: Date.now() - 6 * 86400000,
        speciesKey: "ROACH",
        speciesTitle: "Плотва",
        rawKg: 2000,
        outKg: 1120,
        actualYieldPct: 56.0,
        standardYieldPct: 58.0,
        deltaYieldPct: -2.0,
        days: 5,
        saltingNotes: "Посол 48 часов, плотность тузлука 1.18",
        technologistNote: "Плотва зашло 2000 сняли 1120 кг 5 дней. У поставщика много льда, усушка выше среднего на 2%.",
        deviationNote: "Нижняя граница нормы, усушка выше среднего на 2.0% (риск пересушки спинки)"
      },
      {
        id: "mem_seed_2",
        date: "2026-10-27",
        timestamp: Date.now() - 3 * 86400000,
        speciesKey: "VIMBA",
        speciesTitle: "Вимба (Сырть)",
        rawKg: 1500,
        outKg: 923,
        actualYieldPct: 61.5,
        standardYieldPct: 61.5,
        deltaYieldPct: 0.0,
        days: 7,
        saltingNotes: "Посол 72 часа, классический сухой посол",
        technologistNote: "Вимба 1500 кг выход 923 кг, 7 суток в камере. Эталонная янтарная спинка.",
        deviationNote: "Выход строго по эталону цеха (61.5%)"
      }
    ],
    learnedRules: [
      {
        id: "rule_roach_yield",
        speciesKey: "ROACH",
        ruleText: "У плотвы с повышенной ледяной глазурью выход 56.0% вместо 58.0% (-2.0%). На 4-е сутки контролировать плотность спинки во избежание пересушки.",
        createdAt: Date.now() - 6 * 86400000
      },
      {
        id: "rule_bream_eev",
        speciesKey: "BREAM",
        ruleText: "При сушке крупного леща более 5 суток спинка пересыхает; держать ЭРВ на шаге 120 и не превышать депрессию 2.2°C на Стадии 3.",
        createdAt: Date.now() - 10 * 86400000
      }
    ],
    pendingReminders: [
      {
        id: "rem_roach_initial",
        triggerSpecies: "ROACH",
        triggerStage: null,
        message: "прошлая партия Плотвы (2000 кг, 5 сут) дала выход 1120 кг (56.0% — на грани пересушки). Рекомендуется проверить спинку на 4-е сутки (цель 58% = 1160 кг).",
        suggestedYieldPct: 56.0,
        createdAt: Date.now() - 6 * 86400000,
        dismissed: false
      }
    ]
  };

  const SPECIES_STANDARDS_REF = {
    ROACH: { title: "Плотва", standardYield: 58.0 },
    BREAM: { title: "Лещ", standardYield: 62.0 },
    VIMBA: { title: "Вимба (Сырть)", standardYield: 61.5 },
    PERCH: { title: "Окунь", standardYield: 60.0 },
    SMELT: { title: "Корюшка", standardYield: 55.0 },
    HERRING: { title: "Салака", standardYield: 60.0 },
    ROUND_GOBY: { title: "Бычок", standardYield: 48.0 },
    GOBY: { title: "Бычок", standardYield: 48.0 }
  };

  let workshopMemoryLedger = null;
  let activeProactiveReminder = null;

  function loadWorkshopMemory() {
    try {
      const raw = localStorage.getItem("JURMALCIEMS_AI_MEMORY_V1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.batchesHistory)) {
          workshopMemoryLedger = parsed;
          if (!Array.isArray(workshopMemoryLedger.learnedRules)) workshopMemoryLedger.learnedRules = [];
          if (!Array.isArray(workshopMemoryLedger.pendingReminders)) workshopMemoryLedger.pendingReminders = [];
          updateMemoryBadges();
          return workshopMemoryLedger;
        }
      }
    } catch (e) {}
    workshopMemoryLedger = JSON.parse(JSON.stringify(DEFAULT_WORKSHOP_MEMORY));
    saveWorkshopMemory(workshopMemoryLedger, true);
    updateMemoryBadges();
    return workshopMemoryLedger;
  }

  function saveWorkshopMemory(ledger, skipBroadcast = false) {
    if (!ledger) ledger = workshopMemoryLedger;
    workshopMemoryLedger = ledger;
    try {
      localStorage.setItem("JURMALCIEMS_AI_MEMORY_V1", JSON.stringify(ledger));
    } catch (e) {}
    updateMemoryBadges();
    if (!skipBroadcast) broadcastMemoryUpdate();
  }

  function updateMemoryBadges() {
    const count = (workshopMemoryLedger && workshopMemoryLedger.batchesHistory) ? workshopMemoryLedger.batchesHistory.length : 0;
    const b1 = document.getElementById("memory-count-badge");
    if (b1) b1.textContent = count;
    const b2 = document.getElementById("mob-memory-count-badge");
    if (b2) b2.textContent = count;
    const bc1 = document.getElementById("mem-batches-count");
    if (bc1) bc1.textContent = count;
    const rc1 = document.getElementById("mem-rules-count");
    if (rc1) rc1.textContent = (workshopMemoryLedger && workshopMemoryLedger.learnedRules) ? workshopMemoryLedger.learnedRules.length : 0;
  }

  function broadcastMemoryUpdate() {
    const payload = {
      type: "SYNC_MEMORY_LEDGER",
      memoryLedger: workshopMemoryLedger
    };
    try {
      if (typeof phoneSimSyncChannel !== "undefined" && phoneSimSyncChannel) {
        phoneSimSyncChannel.postMessage(payload);
      }
      if (typeof syncChannel !== "undefined" && syncChannel) {
        syncChannel.postMessage(payload);
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, "*");
      }
    } catch (e) {}
  }

  function applyIncomingMemoryLedger(incoming) {
    if (!incoming || !Array.isArray(incoming.batchesHistory)) return;
    if (!workshopMemoryLedger) loadWorkshopMemory();
    const existingIds = new Set(workshopMemoryLedger.batchesHistory.map(b => b.id));
    incoming.batchesHistory.forEach(b => {
      if (!existingIds.has(b.id)) {
        workshopMemoryLedger.batchesHistory.push(b);
        existingIds.add(b.id);
      }
    });
    if (Array.isArray(incoming.learnedRules)) {
      const existingRules = new Set(workshopMemoryLedger.learnedRules.map(r => r.id));
      incoming.learnedRules.forEach(r => {
        if (!existingRules.has(r.id)) {
          workshopMemoryLedger.learnedRules.push(r);
          existingRules.add(r.id);
        }
      });
    }
    if (Array.isArray(incoming.pendingReminders)) {
      const existingRems = new Set(workshopMemoryLedger.pendingReminders.map(r => r.id));
      incoming.pendingReminders.forEach(r => {
        if (!existingRems.has(r.id)) {
          workshopMemoryLedger.pendingReminders.push(r);
          existingRems.add(r.id);
        }
      });
    }
    saveWorkshopMemory(workshopMemoryLedger, true);
    const curSp = (typeof state !== "undefined" && state && state.telemetry) ? state.telemetry.speciesKey : (document.getElementById("th-species-select")?.value || "VIMBA");
    checkProactiveMemoryReminder(curSp);
  }

  function isFactInput(rawText) {
    const text = String(rawText || "").trim();
    if (!text) return false;
    if (text.includes("?")) return false;

    const lower = text.toLowerCase().replace(/ё/g, "е");

    // 1. Вопросы не являются фактами
    const isQuestion = /(?:^|\s)(?:как|почему|сколько|посоветуй|подскажи|что делать|какой|какая|какие|зачем|что с|куда|когда|можно ли)(?:\s|$|[.,!?])/i.test(lower);
    if (isQuestion) return false;

    // 2. Прямые императивные команды управления камерой не являются фактами
    const isImperativeCommand = /(?:^|\s)(?:поставь|включи|переключи|установи|сделай|запусти|открой|выключи|заглуши|сбрось|стоп|пауза|сушка)(?:\s|$|[.,!?])/i.test(lower);
    if (isImperativeCommand) return false;

    // 3. Маркеры фиксации завершенной партии / прошедшего времени / выхода
    const hasPastBatchMarkers = /(?:зашл[оаи]|заход|взяли|снял[оаи]|снято|съем|выход(?:ом)?|вышл[оаи]|по факту|факт(?:ом)?|готов[оаы][йяе]?|парти[яию] завершен|усушк[аи])/i.test(lower);

    // 4. Маркеры технологических правил и качественных наблюдений цеха
    const hasTechRuleMarkers = /(?:посол|тузлук|отволажив|пересуш|недосуш|задыха|растреск|чешу[яе]|лопнет|липк|солить|гореч|жирност|плесен)/i.test(lower);

    // Наличие вида рыбы
    const hasSpecies = /(?:плотв|лещ|вимб|сырт|окун|корюшк|салак|быч|судак|щук|roach|bream|vimba|perch|smelt|herring|goby)/i.test(lower);

    // Числа (веса или дни)
    const hasNumbers = /\d+/.test(lower);

    // Факт партии: должен содержать вид/числа И обязательный маркер завершения (зашло/сняли/выход/факт/готово)
    if (hasPastBatchMarkers && (hasSpecies || hasNumbers)) {
      return true;
    }

    // Правило цеха: качественное наблюдение цеха по посолу, отволаживанию и т.д.
    if (hasTechRuleMarkers && (hasSpecies || hasNumbers || lower.length > 20)) {
      return true;
    }

    return false;
  }

  function parseFactFromText(rawText, fallbackSpecies = "ROACH") {
    const text = String(rawText || "").trim();
    const lower = text.toLowerCase().replace(/ё/g, "е");

    let speciesKey = fallbackSpecies;
    if (/плотв/i.test(lower)) speciesKey = "ROACH";
    else if (/вимб|сырт/i.test(lower)) speciesKey = "VIMBA";
    else if (/лещ/i.test(lower)) speciesKey = "BREAM";
    else if (/окун/i.test(lower)) speciesKey = "PERCH";
    else if (/корюшк/i.test(lower)) speciesKey = "SMELT";
    else if (/салак|сельд/i.test(lower)) speciesKey = "HERRING";
    else if (/быч/i.test(lower)) speciesKey = "ROUND_GOBY";

    const spMeta = SPECIES_STANDARDS_REF[speciesKey] || SPECIES_STANDARDS_REF.ROACH;
    const standardYield = spMeta.standardYield;

    let days = 5;
    const daysMatch = lower.match(/(\d+)\s*(?:дней|дня|день|сут|суток)/i);
    if (daysMatch) {
      days = parseInt(daysMatch[1], 10);
    } else {
      const onDayMatch = lower.match(/на\s*(\d+)(?:-?[еий])?\s*(?:день|сут)/i);
      if (onDayMatch) days = parseInt(onDayMatch[1], 10);
    }

    let saltingNotes = "";
    const saltMatch = lower.match(/(?:посол|тузлук)[^,.]+/i);
    if (saltMatch) saltingNotes = saltMatch[0].trim();

    let rawKg = null;
    let outKg = null;

    const inOutMatch = lower.match(/(?:зашло|сырь[ея]|заход|взяли)\s*(\d+(?:[.,]\d+)?)\s*(?:т|тонн|тонны|кг)?.*?(?:сняли|выход|готовой|готово)\s*(\d+(?:[.,]\d+)?)\s*(?:т|тонн|тонны|кг)?/i);
    if (inOutMatch) {
      let r = parseFloat(inOutMatch[1].replace(",", "."));
      let o = parseFloat(inOutMatch[2].replace(",", "."));
      if (/зашло\s*\d+(?:[.,]\d+)?\s*(?:т\b|тонн)/i.test(lower) && r < 15) r = r * 1000;
      if (o < 15 && /(?:сняли|выход)\s*\d+(?:[.,]\d+)?\s*(?:т\b|тонн)/i.test(lower)) o = o * 1000;
      rawKg = r;
      outKg = o;
    } else {
      const simpleMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:кг|т|тонн)?.*?(?:выход|сняли)\s*(\d+(?:[.,]\d+)?)\s*(?:кг)?/i);
      if (simpleMatch) {
        let r = parseFloat(simpleMatch[1].replace(",", "."));
        let o = parseFloat(simpleMatch[2].replace(",", "."));
        if (r < 15 && /(\d+(?:[.,]\d+)?)\s*(?:т\b|тонн)/i.test(lower)) r = r * 1000;
        rawKg = r;
        outKg = o;
      } else {
        const nums = [];
        const numMatches = lower.matchAll(/(\d+(?:[.,]\d+)?)\s*(кг|т|тонн)?/gi);
        for (const m of numMatches) {
          let val = parseFloat(m[1].replace(",", "."));
          if (m[2] && /т|тонн/i.test(m[2]) && val < 15) val = val * 1000;
          if (val !== days && val > 20) {
            nums.push(val);
            if (nums.length === 2) break;
          }
        }
        if (nums.length >= 2) {
          rawKg = Math.max(nums[0], nums[1]);
          outKg = Math.min(nums[0], nums[1]);
        } else if (nums.length === 1) {
          rawKg = nums[0];
        }
      }
    }

    let actualYieldPct = null;
    let deltaYieldPct = null;
    let deviationNote = "";

    if (rawKg && outKg && rawKg > 0) {
      actualYieldPct = Math.round((outKg / rawKg) * 1000) / 10;
      deltaYieldPct = Math.round((actualYieldPct - standardYield) * 10) / 10;

      if (deltaYieldPct < -1.0) {
        deviationNote = "Нижняя граница нормы, усушка выше среднего на " + Math.abs(deltaYieldPct).toFixed(1) + "% (риск пересушки спинки)";
      } else if (deltaYieldPct > 1.0) {
        deviationNote = "Выход выше нормы на " + deltaYieldPct.toFixed(1) + "% (повышенная влажность/недосушка)";
      } else {
        deviationNote = "Выход строго в пределах технологической нормы (" + actualYieldPct + "%)";
      }
    }

    return {
      speciesKey,
      speciesTitle: spMeta.title,
      rawKg,
      outKg,
      actualYieldPct,
      standardYieldPct: standardYield,
      deltaYieldPct,
      days,
      saltingNotes,
      technologistNote: text,
      deviationNote
    };
  }

  function absorbFactToMemory(rawText) {
    if (!workshopMemoryLedger) loadWorkshopMemory();
    const curSp = (typeof state !== "undefined" && state && state.telemetry) ? state.telemetry.speciesKey : (document.getElementById("th-species-select")?.value || "ROACH");
    const parsed = parseFactFromText(rawText, curSp);
    if (!parsed || !parsed.speciesKey) return false;

    const now = Date.now();
    const dateStr = new Date(now).toISOString().slice(0, 10);

    const batchId = "mem_b_" + now + "_" + Math.random().toString(36).substr(2, 4);
    const newBatch = {
      id: batchId,
      date: dateStr,
      timestamp: now,
      speciesKey: parsed.speciesKey,
      speciesTitle: parsed.speciesTitle,
      rawKg: parsed.rawKg || 0,
      outKg: parsed.outKg || 0,
      actualYieldPct: parsed.actualYieldPct || 0,
      standardYieldPct: parsed.standardYieldPct,
      deltaYieldPct: parsed.deltaYieldPct || 0,
      days: parsed.days || 5,
      saltingNotes: parsed.saltingNotes || "",
      technologistNote: parsed.technologistNote || rawText,
      deviationNote: parsed.deviationNote || ""
    };
    workshopMemoryLedger.batchesHistory.push(newBatch);

    if (parsed.deltaYieldPct !== null && Math.abs(parsed.deltaYieldPct) >= 1.0) {
      const newRule = {
        id: "rule_" + now,
        speciesKey: parsed.speciesKey,
        ruleText: parsed.speciesTitle + ": факт выхода " + parsed.actualYieldPct + "% вместо нормы " + parsed.standardYieldPct + "% (" + (parsed.deltaYieldPct > 0 ? '+' : '') + parsed.deltaYieldPct + "%). " + (parsed.days ? 'Срок: ' + parsed.days + ' сут. ' : '') + parsed.deviationNote,
        createdAt: now
      };
      workshopMemoryLedger.learnedRules.push(newRule);

      const targetKg = Math.round((parsed.rawKg || 1000) * parsed.standardYieldPct / 100);
      const reminderMsg = "прошлая партия " + parsed.speciesTitle + " (" + parsed.rawKg + " кг, " + (parsed.days || 5) + " сут) дала выход " + parsed.outKg + " кг (" + parsed.actualYieldPct + "% — " + (parsed.deltaYieldPct < 0 ? 'на грани пересушки' : 'влажность выше нормы') + "). Рекомендуется проверить спинку на " + Math.max(1, (parsed.days || 5) - 1) + "-е сутки (цель " + parsed.standardYieldPct + "% = " + targetKg + " кг).";

      workshopMemoryLedger.pendingReminders.forEach(r => {
        if (r.triggerSpecies === parsed.speciesKey) r.dismissed = true;
      });

      workshopMemoryLedger.pendingReminders.push({
        id: "rem_" + now,
        triggerSpecies: parsed.speciesKey,
        triggerStage: null,
        message: reminderMsg,
        suggestedYieldPct: parsed.actualYieldPct,
        createdAt: now,
        dismissed: false
      });
    }

    saveWorkshopMemory(workshopMemoryLedger);

    const toastText = (parsed.rawKg && parsed.outKg)
      ? "🧠 Записано в память цеха: " + parsed.speciesTitle + " " + parsed.rawKg + " ➔ " + parsed.outKg + " кг (" + parsed.actualYieldPct + "%, " + (parsed.days || 5) + " сут). Учту в следующих партиях."
      : "🧠 Записано в память цеха: " + parsed.speciesTitle + ". " + (parsed.deviationNote || 'Заметка сохранена.');

    if (typeof showToast === "function") {
      showToast(toastText);
    }
    if (typeof vxSpeak === "function" && parsed.actualYieldPct) {
      try { vxSpeak("Записано в память: " + parsed.speciesTitle + ", выход " + parsed.actualYieldPct + " процентов."); } catch(e){}
    } else if (typeof speakText === "function" && parsed.actualYieldPct) {
      try { speakText("Записано в память: " + parsed.speciesTitle + ", выход " + parsed.actualYieldPct + " процентов."); } catch(e){}
    }

    if (typeof dismissProactiveBanner === "function") {
      dismissProactiveBanner();
    }

    checkProactiveMemoryReminder(parsed.speciesKey);
    return true;
  }

  function promptQuickFactAbsorption() {
    const sample = "Плотва зашло 2000 сняли 1120 кг 5 дней";
    const val = prompt("🧠 Запись факта партии в память цеха Юрмалциемс:\n(Например: «" + sample + "»)", sample);
    if (val && val.trim()) {
      absorbFactToMemory(val.trim());
    }
  }

  function checkProactiveMemoryReminder(speciesKey, stageNum) {
    if (!workshopMemoryLedger) loadWorkshopMemory();
    const spKey = (typeof normalizeSpeciesKey === "function") ? normalizeSpeciesKey(speciesKey) : speciesKey;

    let reminder = workshopMemoryLedger.pendingReminders.find(r => r.triggerSpecies === spKey && !r.dismissed);
    if (!reminder) {
      const pastBatches = workshopMemoryLedger.batchesHistory.filter(b => b.speciesKey === spKey && Math.abs(b.deltaYieldPct) >= 1.0);
      if (pastBatches.length > 0) {
        const last = pastBatches[pastBatches.length - 1];
        const targetKg = Math.round((last.rawKg || 1000) * last.standardYieldPct / 100);
        reminder = {
          id: "rem_auto_" + last.id,
          triggerSpecies: spKey,
          message: "прошлая партия " + last.speciesTitle + " (" + last.rawKg + " кг, " + last.days + " сут) дала выход " + last.outKg + " кг (" + last.actualYieldPct + "% — " + (last.deltaYieldPct < 0 ? 'на грани пересушки' : 'влажность выше нормы') + "). Рекомендуется проверить спинку на " + Math.max(1, last.days - 1) + "-е сутки (цель " + last.standardYieldPct + "% = " + targetKg + " кг).",
          suggestedYieldPct: last.actualYieldPct,
          dismissed: false
        };
      }
    }

    activeProactiveReminder = reminder;
    renderProactiveBanner(reminder);
  }

  function checkStageMemoryReminder(stageKeyOrNum) {
    if (!workshopMemoryLedger) loadWorkshopMemory();
    const stNum = String(stageKeyOrNum || "").replace(/\D/g, "");
    if (stNum === "3" || stNum === "4") {
      const curSp = (typeof state !== "undefined" && state && state.telemetry) ? state.telemetry.speciesKey : (document.getElementById("th-species-select")?.value || "ROACH");
      const spKey = (typeof normalizeSpeciesKey === "function") ? normalizeSpeciesKey(curSp) : curSp;
      const rule = workshopMemoryLedger.learnedRules.find(r => r.speciesKey === spKey);
      if (rule) {
        if (typeof showToast === "function") {
          showToast("🔔 Опыт цеха (Этап " + stNum + "): " + rule.ruleText);
        }
      }
    }
  }

  function renderProactiveBanner(reminder) {
    const b1 = document.getElementById("proactive-memory-banner");
    const b2 = document.getElementById("mob-proactive-memory-banner");
    const banners = [b1, b2].filter(Boolean);

    if (!reminder || reminder.dismissed) {
      banners.forEach(b => { b.style.display = "none"; b.innerHTML = ""; });
      return;
    }

    const html = `
      <div class="proactive-banner-inner">
        <div class="proactive-banner-icon">🔔</div>
        <div class="proactive-banner-content">
          <div class="proactive-banner-title">ИЗ ПАМЯТИ ЦЕХА ЮРМАЛЦИЕМС:</div>
          <div class="proactive-banner-body">${reminder.message}</div>
        </div>
        <div class="proactive-banner-actions">
          ${reminder.suggestedYieldPct ? `<button class="proactive-btn apply" onclick="applyProactiveYieldCorrection(${reminder.suggestedYieldPct})">Применить ${reminder.suggestedYieldPct}%</button>` : ''}
          <button class="proactive-btn dismiss" onclick="dismissProactiveBanner('${reminder.id || ''}')">Скрыть</button>
        </div>
      </div>
    `;

    banners.forEach(b => {
      b.innerHTML = html;
      b.style.display = "block";
    });
  }

  function dismissProactiveBanner(remId) {
    if (remId && workshopMemoryLedger && Array.isArray(workshopMemoryLedger.pendingReminders)) {
      const r = workshopMemoryLedger.pendingReminders.find(item => item.id === remId);
      if (r) r.dismissed = true;
      saveWorkshopMemory(workshopMemoryLedger, true);
    }
    if (activeProactiveReminder) activeProactiveReminder.dismissed = true;
    renderProactiveBanner(null);
  }

  function applyProactiveYieldCorrection(yieldPct) {
    if (!yieldPct) return;
    if (typeof vx !== "undefined" && vx) {
      vx.yieldPct = yieldPct;
    }
    if (typeof tradeHouseState !== "undefined" && tradeHouseState) {
      tradeHouseState.currentYieldPct = yieldPct;
    }
    const yEl = document.getElementById("th-yield-pct");
    if (yEl) {
      yEl.value = yieldPct;
    }
    const thSpKey = document.getElementById("th-species-select")?.value;
    if (thSpKey && typeof TH_SPECIES !== "undefined" && TH_SPECIES[thSpKey]) {
      TH_SPECIES[thSpKey].yieldPct = yieldPct;
    }

    if (typeof calculateTradeHouseMath === "function") calculateTradeHouseMath();
    if (typeof renderAll === "function") renderAll();
    if (typeof broadcastSync === "function") broadcastSync();

    dismissProactiveBanner();
    if (typeof showToast === "function") {
      showToast("✅ Применена эмпирическая поправка выхода: " + yieldPct + "%");
    }
  }

  function openWorkshopMemoryModal() {
    if (!workshopMemoryLedger) loadWorkshopMemory();
    const m = document.getElementById("workshop-memory-modal");
    if (m) {
      m.style.display = "flex";
      renderWorkshopMemoryModal();
    }
  }

  function closeWorkshopMemoryModal() {
    const m = document.getElementById("workshop-memory-modal");
    if (m) m.style.display = "none";
  }

  function switchMemoryModalTab(tabName) {
    const btnB = document.getElementById("mem-tab-btn-batches");
    const btnR = document.getElementById("mem-tab-btn-rules");
    const paneB = document.getElementById("mem-pane-batches");
    const paneR = document.getElementById("mem-pane-rules");

    if (tabName === "batches") {
      if (btnB) btnB.classList.add("active");
      if (btnR) btnR.classList.remove("active");
      if (paneB) { paneB.style.display = "block"; paneB.classList.add("active"); }
      if (paneR) { paneR.style.display = "none"; paneR.classList.remove("active"); }
    } else {
      if (btnR) btnR.classList.add("active");
      if (btnB) btnB.classList.remove("active");
      if (paneR) { paneR.style.display = "block"; paneR.classList.add("active"); }
      if (paneB) { paneB.style.display = "none"; paneB.classList.remove("active"); }
    }
  }

  function renderWorkshopMemoryModal() {
    if (!workshopMemoryLedger) loadWorkshopMemory();
    updateMemoryBadges();

    const bList = document.getElementById("mem-batches-list");
    if (bList) {
      const batches = [...workshopMemoryLedger.batchesHistory].reverse();
      if (batches.length === 0) {
        bList.innerHTML = `<div style="text-align:center; padding:20px; color:#8B949E; font-size:12px;">Память завершенных партий пуста. Введите данные партии выше или через голосового штурмана.</div>`;
      } else {
        bList.innerHTML = batches.map(b => {
          const isGood = b.deltaYieldPct >= -1.0 && b.deltaYieldPct <= 1.0;
          return `
            <div class="mem-card">
              <button class="mem-card-delete" data-action="delete-batch" data-id="${escapeHtml(b.id)}" onclick="deleteMemoryBatch('${escapeHtml(b.id)}')" title="Удалить запись">✕</button>
              <div class="mem-card-head">
                <span class="mem-card-title">${escapeHtml(b.speciesTitle || b.speciesKey)}</span>
                <span class="mem-card-date">${escapeHtml(b.date || '')}</span>
              </div>
              <div class="mem-card-kpis">
                <span class="mem-kpi-pill">Заход: <b>${Number(b.rawKg || 0)} кг</b></span>
                <span class="mem-kpi-pill">Выход: <b>${Number(b.outKg || 0)} кг</b></span>
                <span class="mem-kpi-pill ${isGood ? 'yield-good' : 'yield-alert'}">Факт: <b>${Number(b.actualYieldPct || 0)}%</b> (норма ${Number(b.standardYieldPct || 0)}%)</span>
                <span class="mem-kpi-pill">Срок: <b>${Number(b.days || 0)} сут.</b></span>
              </div>
              ${b.saltingNotes ? `<div class="mem-card-notes">🧂 <b>Посол:</b> ${escapeHtml(b.saltingNotes)}</div>` : ''}
              ${b.technologistNote ? `<div class="mem-card-notes">📝 <b>Заметка:</b> ${escapeHtml(b.technologistNote)}</div>` : ''}
              ${b.deviationNote ? `<div class="mem-card-deviation">⚠️ <b>Отклонение:</b> ${escapeHtml(b.deviationNote)}</div>` : ''}
            </div>
          `;
        }).join("");
      }
    }

    const rList = document.getElementById("mem-rules-list");
    if (rList) {
      const rules = [...workshopMemoryLedger.learnedRules].reverse();
      if (rules.length === 0) {
        rList.innerHTML = `<div style="text-align:center; padding:20px; color:#8B949E; font-size:12px;">Эмпирические правила еще не сформированы. Система добавит их автоматически при фиксации отклонений.</div>`;
      } else {
        rList.innerHTML = rules.map(r => `
          <div class="mem-card">
            <button class="mem-card-delete" data-action="delete-rule" data-id="${escapeHtml(r.id)}" onclick="deleteMemoryRule('${escapeHtml(r.id)}')" title="Удалить правило">✕</button>
            <div class="mem-card-head">
              <span class="mem-card-title">💡 Правило цеха [${escapeHtml(r.speciesKey)}]</span>
            </div>
            <div class="mem-card-notes" style="font-size:12px; color:#F0F6FC;">${escapeHtml(r.ruleText)}</div>
          </div>
        `).join("");
      }
    }
  }

  function submitQuickFactFromModal() {
    const input = document.getElementById("mem-quick-input");
    if (!input) return;
    const val = input.value.trim();
    if (val) {
      absorbFactToMemory(val);
      input.value = "";
      renderWorkshopMemoryModal();
    }
  }

  function deleteMemoryBatch(batchId) {
    if (!workshopMemoryLedger) return;
    workshopMemoryLedger.batchesHistory = workshopMemoryLedger.batchesHistory.filter(b => b.id !== batchId);
    saveWorkshopMemory(workshopMemoryLedger);
    renderWorkshopMemoryModal();
  }

  function deleteMemoryRule(ruleId) {
    if (!workshopMemoryLedger) return;
    workshopMemoryLedger.learnedRules = workshopMemoryLedger.learnedRules.filter(r => r.id !== ruleId);
    saveWorkshopMemory(workshopMemoryLedger);
    renderWorkshopMemoryModal();
  }

  function exportMemoryLedgerJson() {
    if (!workshopMemoryLedger) loadWorkshopMemory();
    const jsonStr = JSON.stringify(workshopMemoryLedger, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jurmalciems_ai_memory_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === "function") showToast("📤 Память цеха экспортирована в JSON");
  }

  /**
   * 🛡️ Строгая валидация и очистка схемы JSON-слепка памяти цеха Юрмалциемс
   */
  export function validateAndSanitizeMemoryLedger(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Файл не содержит корректного JSON-объекта");
    }

    if (!Array.isArray(data.batchesHistory)) {
      throw new Error("В файле отсутствует обязательный список 'batchesHistory'");
    }

    const sanitizedBatches = [];
    for (let i = 0; i < data.batchesHistory.length; i++) {
      const b = data.batchesHistory[i];
      if (!b || typeof b !== "object") continue;

      const rawKg = Number(b.rawKg);
      const outKg = Number(b.outKg);
      if (!Number.isFinite(rawKg) || rawKg <= 0) {
        throw new Error(`Партия #${b.id || i + 1}: некорректный входящий вес сырья rawKg (${b.rawKg})`);
      }
      if (!Number.isFinite(outKg) || outKg <= 0) {
        throw new Error(`Партия #${b.id || i + 1}: некорректный вес готовой продукции outKg (${b.outKg})`);
      }

      let actualYieldPct = Number(b.actualYieldPct);
      if (!Number.isFinite(actualYieldPct) || actualYieldPct <= 0 || actualYieldPct > 100) {
        actualYieldPct = Math.round((outKg / rawKg) * 1000) / 10;
      }

      const standardYieldPct = Number.isFinite(Number(b.standardYieldPct)) ? Number(b.standardYieldPct) : 60.0;
      const deltaYieldPct = Number.isFinite(Number(b.deltaYieldPct)) ? Number(b.deltaYieldPct) : Math.round((actualYieldPct - standardYieldPct) * 10) / 10;
      const days = Number.isFinite(Number(b.days)) && Number(b.days) > 0 ? Number(b.days) : 5;

      sanitizedBatches.push({
        id: b.id ? String(b.id).slice(0, 80) : `mem_batch_${Date.now()}_${i}`,
        date: b.date ? String(b.date).slice(0, 40) : new Date().toISOString().slice(0, 10),
        timestamp: Number.isFinite(Number(b.timestamp)) ? Number(b.timestamp) : Date.now(),
        speciesKey: b.speciesKey ? String(b.speciesKey).toUpperCase().slice(0, 40) : "VIMBA",
        speciesTitle: b.speciesTitle ? String(b.speciesTitle).slice(0, 80) : (b.speciesKey || "Рыба"),
        rawKg: Math.round(rawKg * 10) / 10,
        outKg: Math.round(outKg * 10) / 10,
        actualYieldPct: Math.round(actualYieldPct * 10) / 10,
        standardYieldPct: Math.round(standardYieldPct * 10) / 10,
        deltaYieldPct: Math.round(deltaYieldPct * 10) / 10,
        days,
        saltingNotes: b.saltingNotes ? String(b.saltingNotes).slice(0, 500) : "",
        technologistNote: b.technologistNote ? String(b.technologistNote).slice(0, 1000) : "",
        deviationNote: b.deviationNote ? String(b.deviationNote).slice(0, 500) : ""
      });
    }

    const sanitizedRules = [];
    if (Array.isArray(data.learnedRules)) {
      for (let j = 0; j < data.learnedRules.length; j++) {
        const r = data.learnedRules[j];
        if (!r || typeof r !== "object") continue;
        const ruleText = r.ruleText ? String(r.ruleText).slice(0, 1500).trim() : "";
        if (!ruleText) continue;

        sanitizedRules.push({
          id: r.id ? String(r.id).slice(0, 80) : `rule_${Date.now()}_${j}`,
          speciesKey: r.speciesKey ? String(r.speciesKey).toUpperCase().slice(0, 40) : "ALL",
          ruleText,
          source: r.source ? String(r.source).slice(0, 80) : "MANUAL",
          timestamp: Number.isFinite(Number(r.timestamp)) ? Number(r.timestamp) : Date.now()
        });
      }
    }

    let sanitizedTubaWarehouse = null;
    if (data.tubaWarehouse && typeof data.tubaWarehouse === "object" && !Array.isArray(data.tubaWarehouse)) {
      sanitizedTubaWarehouse = {};
      for (const [spKey, item] of Object.entries(data.tubaWarehouse)) {
        if (!item || typeof item !== "object") continue;
        const cleanKey = String(spKey).trim().toUpperCase().slice(0, 40);
        sanitizedTubaWarehouse[cleanKey] = {
          name: item.name ? String(item.name).slice(0, 80) : cleanKey,
          packs: Math.max(0, parseInt(item.packs, 10) || 0),
          kg: Math.max(0, Math.round((Number(item.kg) || 0) * 10) / 10),
          days: Math.max(0, parseInt(item.days, 10) || 0),
          wholesalePrice: Math.max(0, Math.round((Number(item.wholesalePrice) || 0) * 100) / 100),
          vacuumPrice: Math.max(0, Math.round((Number(item.vacuumPrice) || 0) * 100) / 100),
          semiPrice: Math.max(0, Math.round((Number(item.semiPrice) || 0) * 100) / 100),
          retailPrice: Math.max(0, Math.round((Number(item.retailPrice) || 0) * 100) / 100),
          yieldPct: Math.min(100, Math.max(0, Math.round((Number(item.yieldPct) || 50) * 10) / 10)),
          rawPrice: Math.max(0, Math.round((Number(item.rawPrice) || 0) * 100) / 100),
          rawStatus: item.rawStatus ? String(item.rawStatus).slice(0, 100) : "",
          wholesaleStatus: item.wholesaleStatus ? String(item.wholesaleStatus).slice(0, 100) : "",
          vacuumStatus: item.vacuumStatus ? String(item.vacuumStatus).slice(0, 100) : ""
        };
      }
    }

    const res = {
      version: Number(data.version) || 1,
      batchesHistory: sanitizedBatches,
      learnedRules: sanitizedRules
    };
    if (sanitizedTubaWarehouse) {
      res.tubaWarehouse = sanitizedTubaWarehouse;
    }
    return res;
  }

  function importMemoryLedgerJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const validated = validateAndSanitizeMemoryLedger(parsed);
        workshopMemoryLedger = validated;
        saveWorkshopMemory(workshopMemoryLedger);
        renderWorkshopMemoryModal();
        if (typeof showToast === "function") showToast("✅ Память цеха успешно проверена и загружена из файла!");
      } catch (err) {
        if (typeof showToast === "function") {
          showToast("⚠️ Ошибка валидации схемы памяти: " + err.message);
        } else {
          alert("Ошибка при валидации схемы JSON-файла: " + err.message);
        }
      } finally {
        if (event.target) event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function clearWorkshopMemory() {
    if (confirm("Вы уверены, что хотите сбросить накопленную память цеха к заводским эталонам?")) {
      workshopMemoryLedger = JSON.parse(JSON.stringify(DEFAULT_WORKSHOP_MEMORY));
      saveWorkshopMemory(workshopMemoryLedger);
      renderWorkshopMemoryModal();
      if (typeof showToast === "function") showToast("🗑️ Память цеха сброшена к эталонам");
    }
  }


  function generateWorkshopKnowledgeSystemPrompt() {
    const ledger = (typeof workshopMemoryLedger !== "undefined" && workshopMemoryLedger) ? workshopMemoryLedger : loadWorkshopMemory();
    const history = (ledger && ledger.batchesHistory) || [];
    const recent5 = history.slice(-5).reverse();
    const rules = (ledger && ledger.learnedRules) || [];

    let memText = "--- АКТУАЛЬНАЯ ПАМЯТЬ ЦЕХА ЮРМАЛЦИЕМС (ИЗ БАЗЫ ЗНАНИЙ): ---\n";
    if (recent5.length === 0) {
      memText += "• База накопленного опыта: типовые партии (Плотва 58%, Вимба 61.5%, Лещ 62%).\n";
    } else {
      recent5.forEach((b, idx) => {
        memText += "• Партия #" + (idx + 1) + " [" + (b.date || 'Недавно') + "]: " + (b.speciesTitle || b.speciesKey) + " — Заход: " + b.rawKg + " кг, Выход: " + b.outKg + " кг (" + b.actualYieldPct + "%, норма " + (b.standardYieldPct || 58) + "%), Срок: " + b.days + " сут. " + (b.technologistNote ? 'Заметка: ' + b.technologistNote + ' ' : '') + (b.deviationNote ? 'Отклонение: ' + b.deviationNote : '') + "\n";
      });
    }
    if (rules.length > 0) {
      memText += "Активные эмпирические правила цеха:\n";
      rules.slice(-5).forEach(r => {
        memText += "  - " + r.ruleText + "\n";
      });
    }
    memText += "---------------------------------------------------------\n";

    const systemRole = "РОЛЬ: Главный технолог вяления рыбы и ведущий инженер по промышленному холоду цеха Юрмалциемс (камера AIM AGHD-250ELC, хладагент R410A, психометрика, энтальпия, влагосъем Cantoni 4х3 кВт, барьеры активности воды a_w ≤ 0.85, защита от ботулизма, фасовка в вакуум KOMET PlusVac 25).\n" +
      "Отвечай строго профессионально, кратко и опирайся на реальный опыт и цифры цеха из блока памяти ниже. Никогда не предлагай паузы длиннее 1.5–2 часов на стадиях 1–3 (при влажности >80% рыба задыхается).\n\n" +
      memText;

    return systemRole;
  }


  // Автозапуск ядра памяти цеха
  try {
    loadWorkshopMemory();
    setTimeout(() => {
      if (typeof state !== "undefined" && state && state.telemetry) {
        checkProactiveMemoryReminder(state.telemetry.speciesKey);
      }
    }, 200);
  } catch(e){}

export {
  loadWorkshopMemory,
  saveWorkshopMemory,
  updateMemoryBadges,
  checkProactiveMemoryReminder,
  openWorkshopMemoryModal,
  closeWorkshopMemoryModal,
  renderWorkshopMemoryModal,
  submitQuickFactFromModal,
  promptQuickFactAbsorption,
  switchMemoryModalTab,
  isFactInput,
  deleteMemoryBatch,
  deleteMemoryRule,
  exportMemoryLedgerJson,
  importMemoryLedgerJson,
  clearWorkshopMemory,
  absorbFactToMemory,
  generateWorkshopKnowledgeSystemPrompt,
  dismissProactiveBanner,
  applyProactiveYieldCorrection,
  workshopMemoryLedger
};

if (typeof window !== "undefined") {
  window.loadWorkshopMemory = loadWorkshopMemory;
  window.saveWorkshopMemory = saveWorkshopMemory;
  window.updateMemoryBadges = updateMemoryBadges;
  window.checkProactiveMemoryReminder = checkProactiveMemoryReminder;
  window.openWorkshopMemoryModal = openWorkshopMemoryModal;
  window.closeWorkshopMemoryModal = closeWorkshopMemoryModal;
  window.renderWorkshopMemoryModal = renderWorkshopMemoryModal;
  window.submitQuickFactFromModal = submitQuickFactFromModal;
  window.promptQuickFactAbsorption = promptQuickFactAbsorption;
  window.switchMemoryModalTab = switchMemoryModalTab;
  window.isFactInput = isFactInput;
  window.deleteMemoryBatch = deleteMemoryBatch;
  window.deleteMemoryRule = deleteMemoryRule;
  window.exportMemoryLedgerJson = exportMemoryLedgerJson;
  window.importMemoryLedgerJson = importMemoryLedgerJson;
  window.validateAndSanitizeMemoryLedger = validateAndSanitizeMemoryLedger;
  window.clearWorkshopMemory = clearWorkshopMemory;
  window.absorbFactToMemory = absorbFactToMemory;
  window.generateWorkshopKnowledgeSystemPrompt = generateWorkshopKnowledgeSystemPrompt;
  window.dismissProactiveBanner = dismissProactiveBanner;
  window.applyProactiveYieldCorrection = applyProactiveYieldCorrection;
}

