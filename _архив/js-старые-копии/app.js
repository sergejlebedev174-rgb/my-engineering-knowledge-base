// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// ГЛАВНЫЙ ВХОДНОЙ МОДУЛЬ (Application Bootstrap & Entry Point)
// ==========================================================================

import * as Constants from './constants.js';
import * as State from './state.js';
import * as Bioscience from './bioscience.js';
import * as Scada from './scada.js';
import * as Calculators from './calculators.js';
import * as AiVoice from './ai_voice.js';
import * as CloudSync from './cloud_sync.js';
import * as WorkshopMemory from './workshop_memory.js';

// Привязка всех модулей к window для inline HTML-обработчиков (onclick, oninput, onchange)
if (typeof window !== "undefined") {
  const allModules = [Constants, State, Bioscience, Scada, Calculators, AiVoice, CloudSync, WorkshopMemory];
  allModules.forEach(mod => {
    for (const [key, val] of Object.entries(mod)) {
      window[key] = val;
    }
  });
}

let _renderAllRafId = null;

export function renderAll(forceImmediate = false) {
  if (forceImmediate || typeof requestAnimationFrame === "undefined") {
    if (_renderAllRafId) {
      cancelAnimationFrame(_renderAllRafId);
      _renderAllRafId = null;
    }
    _renderAllCore();
    return;
  }
  if (_renderAllRafId) return;
  _renderAllRafId = requestAnimationFrame(() => {
    _renderAllRafId = null;
    _renderAllCore();
  });
}

export function renderAllImmediate() {
  renderAll(true);
}

if (typeof window !== "undefined") {
  window.renderAll = renderAll;
  window.renderAllImmediate = renderAllImmediate;
}

function _renderAllCore() {
  const t = State.state.telemetry;
  const species = Constants.FISH_SPECIES[t.speciesKey];
  const stage = Constants.CURING_STAGES[t.stageKey];
  const diag = Bioscience.analyzeBioscience(t);
  const yf = diag.yieldForecast;
  if (t.targetWaterLiters == null && yf && yf.totalWaterAvgLiters) {
    t.targetWaterLiters = yf.totalWaterAvgLiters;
  }
  const heatModeKey = t.heatRecoveryMode || "WINTER_14KW";
  const heatModeObj = Constants.HEAT_RECOVERY_MODES[heatModeKey] || Constants.HEAT_RECOVERY_MODES.WINTER_14KW;

  // Главный сьют технолога
  const ctSlot = document.getElementById("chief-technologist-suite-slot");
  if (ctSlot && typeof Calculators.renderChiefTechnologistSuite === "function") {
    ctSlot.innerHTML = Calculators.renderChiefTechnologistSuite();
  }

  // 0. Режим руководителя
  Calculators.renderOwnerSimpleView(t, species, stage, diag, yf);
  if (typeof Calculators.renderAllSpPanels === "function") {
    Calculators.renderAllSpPanels();
  }
  if (typeof CloudSync.broadcastTelemetrySync === "function") {
    CloudSync.broadcastTelemetrySync();
  }

  // 1. HUD
  const hudStageTitle = document.getElementById("hud-stage-title");
  if (hudStageTitle) hudStageTitle.textContent = `${stage.titleRu} (${stage.daysLabelRu})`;

  const phaseBadge = document.getElementById("hud-phase-badge");
  if (phaseBadge) {
    if (t.isPausePhaseNow) {
      phaseBadge.className = "pill-btn pill-amber";
      phaseBadge.textContent = `ПАУЗА ${stage.pauseFreqLabel} (${stage.pauseVoltageLabel})`;
    } else {
      phaseBadge.className = "pill-btn pill-emerald";
      phaseBadge.textContent = `СУШКА ${stage.activeFreqHz} Гц (${stage.activeVoltageV}V)`;
    }
  }

  const btnHeatWinter = document.getElementById("chip-heat-winter");
  const btnHeatSummer = document.getElementById("chip-heat-summer");
  const heatNoteEl = document.getElementById("heat-recovery-status-note");
  const heatBadgeEl = document.getElementById("heat-recovery-badge");
  if (btnHeatWinter && btnHeatSummer) {
    const isWinter = heatModeKey === "WINTER_14KW";
    btnHeatWinter.className = `chip ${isWinter ? 'active-emerald' : ''}`;
    btnHeatSummer.className = `chip ${!isWinter ? 'active-amber' : ''}`;
    if (heatNoteEl) heatNoteEl.textContent = heatModeObj.descriptionRu;
    if (heatBadgeEl) {
      heatBadgeEl.className = isWinter ? "pill-btn pill-emerald" : "pill-btn pill-amber";
      heatBadgeEl.textContent = heatModeObj.shortBadgeRu;
    }
  }

  const hudDew = document.getElementById("hud-dewpoint");
  if (hudDew) hudDew.textContent = `${diag.dewPointC}°C`;
  const hudEnv = document.getElementById("hud-env-sub");
  if (hudEnv) hudEnv.textContent = `Env ${t.environmentTempC}°C`;
  const hudVpd = document.getElementById("hud-vpd");
  if (hudVpd) hudVpd.textContent = `${diag.vpdKpa} кПа`;
  const hudRh = document.getElementById("hud-rh-sub");
  if (hudRh) hudRh.textContent = `Parkside ${Math.round(t.parksideRhPercent)}% rH`;

  const vpdTileEl = document.getElementById("hud-vpd-tile");
  const vpdValEl = document.getElementById("hud-vpd");
  const vpdStatusEl = document.getElementById("hud-vpd-status");
  if (vpdTileEl && vpdValEl && vpdStatusEl) {
    if (diag.vpdKpa < 0.35) {
      vpdTileEl.style.borderColor = "var(--coral-danger)";
      vpdTileEl.style.background = "rgba(75, 17, 19, 0.58)";
      vpdValEl.style.color = "var(--coral-danger)";
      vpdStatusEl.style.color = "var(--coral-danger)";
      vpdStatusEl.textContent = "⛔ <0.50 кПа: СЫРОСТЬ / БОЛОТО!";
    } else if (diag.vpdKpa < 0.50) {
      vpdTileEl.style.borderColor = "var(--amber-curing)";
      vpdTileEl.style.background = "rgba(71, 42, 0, 0.52)";
      vpdValEl.style.color = "var(--amber-curing)";
      vpdStatusEl.style.color = "var(--amber-curing)";
      vpdStatusEl.textContent = "⚠️ <0.50 кПа: Сырость / болото";
    } else if (diag.vpdKpa > 1.20) {
      vpdTileEl.style.borderColor = "var(--coral-danger)";
      vpdTileEl.style.background = "rgba(75, 17, 19, 0.58)";
      vpdValEl.style.color = "var(--coral-danger)";
      vpdStatusEl.style.color = "var(--coral-danger)";
      vpdStatusEl.textContent = "⛔ >1.05 кПа: ОПАСНОСТЬ ЗАКАЛА!";
    } else if (diag.vpdKpa > 1.05) {
      vpdTileEl.style.borderColor = "var(--amber-curing)";
      vpdTileEl.style.background = "rgba(71, 42, 0, 0.52)";
      vpdValEl.style.color = "var(--amber-curing)";
      vpdStatusEl.style.color = "var(--amber-curing)";
      vpdStatusEl.textContent = "⚠️ >1.05 кПа: Риск закала";
    } else {
      vpdTileEl.style.borderColor = "rgba(0, 230, 118, 0.55)";
      vpdTileEl.style.background = "rgba(8, 17, 29, 0.72)";
      vpdValEl.style.color = "var(--cyan-dew)";
      vpdStatusEl.style.color = "var(--emerald-optimal)";
      vpdStatusEl.textContent = "✓ Оптимум (0.50–1.05 кПа)";
    }
  }

  Scada.renderPhaseTimerHud();
  Scada.renderScadaChamberMimicSvg(t, stage, species, diag);
  Scada.renderScadaVpdSpeedometerSvg(t, stage, species, diag);

  const inStepWin = t.eev1Steps >= 205 && t.eev1Steps <= 480;
  const inCoilWin = t.dehumicoilTempC >= 4.5 && t.dehumicoilTempC <= 5.8;
  const eevColor = t.eev1Steps < 75 ? "var(--coral-danger)" : (inStepWin && inCoilWin ? "var(--emerald-optimal)" : "var(--amber-curing)");
  const hudEevVal = document.getElementById("hud-eev-val");
  if (hudEevVal) {
    hudEevVal.textContent = `${t.eev1Steps} st`;
    hudEevVal.style.color = eevColor;
  }
  const hudCoilSub = document.getElementById("hud-coil-sub");
  if (hudCoilSub) hudCoilSub.textContent = `Coil +${t.dehumicoilTempC}°C • ${t.activeCircuitsRunning}к`;

  const eevStatusLbl = document.getElementById("hud-eev-status-label");
  if (eevStatusLbl) {
    eevStatusLbl.style.color = eevColor;
    if (t.eev1Steps < 75) eevStatusLbl.textContent = "АВАРИЯ < 75 STEP";
    else if (!inStepWin) eevStatusLbl.textContent = "1#EEV ВНЕ ОКНА 205–480";
    else if (!inCoilWin) eevStatusLbl.textContent = `1#Dehumicoil ${t.dehumicoilTempC}°C (НОРМА +4.5..+5.8°C)`;
    else eevStatusLbl.textContent = `НОРМА: 1#EEV 205–480 & Coil +${t.dehumicoilTempC}°C`;
  }

  const marker = document.getElementById("hud-eev-marker");
  if (marker) {
    const pct = Math.min(98, Math.max(2, (t.eev1Steps / 500) * 100));
    marker.style.left = `${pct}%`;
    marker.style.backgroundColor = eevColor;
  }

  // 2. Presets
  const presetsRow = document.getElementById("presets-row");
  if (presetsRow) {
    presetsRow.innerHTML = Constants.SAMPLE_PRESETS.map((p, idx) => {
      const selected = p.telemetry.speciesKey === t.speciesKey && p.telemetry.stageKey === t.stageKey && p.telemetry.eev1Steps === t.eev1Steps;
      return `<button class="chip ${selected ? 'active-cyan' : ''}" onclick="applyPreset(${idx})">${p.label}</button>`;
    }).join("");
  }

  // 3. Live Input Card
  const liveMini = document.getElementById("live-calc-mini");
  if (liveMini) liveMini.textContent = `Т.росы ${diag.dewPointC}°C • VPD ${diag.vpdKpa} кПа`;
  const advSpecies = document.getElementById("advisor-species-chips");
  if (advSpecies) {
    advSpecies.innerHTML = Object.values(Constants.FISH_SPECIES).map(sp =>
      `<button class="chip ${sp.key === t.speciesKey ? 'active-amber' : ''}" onclick="selectSpecies('${sp.key}')">${sp.titleRu}</button>`
    ).join("");
  }
  const advStage = document.getElementById("advisor-stage-chips");
  if (advStage) {
    advStage.innerHTML = Object.values(Constants.CURING_STAGES).map(st =>
      `<button class="chip ${st.key === t.stageKey ? 'active-cyan' : ''}" style="flex:1; text-align:center;" onclick="selectStage('${st.key}')">Ст.${st.number}</button>`
    ).join("");
  }

  const chipDry = document.getElementById("chip-phase-dry");
  if (chipDry) chipDry.className = `chip ${!t.isPausePhaseNow ? 'active-emerald' : ''}`;
  const chipPause = document.getElementById("chip-phase-pause");
  if (chipPause) chipPause.className = `chip ${t.isPausePhaseNow ? 'active-amber' : ''}`;

  const setVal = (id, v) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = v; };
  setVal("num-env", t.environmentTempC);
  setVal("num-rh", Math.round(t.parksideRhPercent));
  setVal("num-eev", t.eev1Steps);
  setVal("num-coil", t.dehumicoilTempC);
  setVal("rng-env", t.environmentTempC);
  setVal("rng-rh", Math.round(t.parksideRhPercent));
  setVal("rng-eev", t.eev1Steps);
  setVal("rng-coil", t.dehumicoilTempC);

  const tRange = Bioscience.targetTempRangeFor(species, stage, t.coLoadWithVimba);
  const lblEnv = document.getElementById("lbl-slider-env");
  if (lblEnv) lblEnv.textContent = `${t.environmentTempC}°C (норма ${tRange[0]}–${tRange[1]}°C)`;
  const lblRh = document.getElementById("lbl-slider-rh");
  if (lblRh) lblRh.textContent = `${Math.round(t.parksideRhPercent)}% (полка ${stage.targetShelfRhRange[0]}–${stage.targetShelfRhRange[1]}%)`;
  const lblEev = document.getElementById("lbl-slider-eev");
  if (lblEev) {
    lblEev.textContent = `${t.eev1Steps} step (окно 205–480, Min 75)`;
    lblEev.style.color = inStepWin ? "var(--emerald-optimal)" : "var(--coral-danger)";
  }
  const lblCoil = document.getElementById("lbl-slider-coil");
  if (lblCoil) {
    lblCoil.textContent = `+${t.dehumicoilTempC}°C (норма кипения +4.5...+5.8°C)`;
    lblCoil.style.color = inCoilWin ? "var(--emerald-optimal)" : "var(--amber-curing)";
  }

  const circ1 = document.getElementById("chip-circ-1");
  if (circ1) circ1.className = `chip ${t.activeCircuitsRunning === 1 ? 'active-cyan' : ''}`;
  const circ2 = document.getElementById("chip-circ-2");
  if (circ2) circ2.className = `chip ${t.activeCircuitsRunning === 2 ? 'active-cyan' : ''}`;
  const chkCo = document.getElementById("chk-coload-advisor");
  if (chkCo) chkCo.checked = t.coLoadWithVimba;

  // Партия и графики
  Scada.renderBatchDryingCurveSvg(diag);

  // 4 Фазы MCGS
  const calcHtml = Calculators.buildCalculatorCardHtml(t, yf);
  const mcgsSlot = document.getElementById("mcgs-calculator-slot");
  if (mcgsSlot) mcgsSlot.innerHTML = calcHtml;

  const monolithHtml = Bioscience.buildMonolithSopHtml(t);
  const advMono = document.getElementById("advisor-monolith-sop-slot");
  if (advMono) advMono.innerHTML = monolithHtml;
  const mcgsMono = document.getElementById("mcgs-monolith-sop-slot");
  if (mcgsMono) mcgsMono.innerHTML = monolithHtml;

  // Визуальные экраны VX
  try {
    Calculators.renderVisualScreens();
  } catch (e) {
    console.error("renderVisualScreens error:", e);
  }

  // Новые модули (Посол, Аэродинамика, Микробиология)
  try { Calculators.renderSaltingCalculator(); } catch(e) {}
  try { Calculators.renderAerodynamicsCalculator(); } catch(e) {}
  try { Calculators.renderMicrobiologyCalculator(); } catch(e) {}

  // Чат и голосовой статус
  AiVoice.renderChatMessages();
  AiVoice.updateGeminiApiStatusUi();
  const qqRow = document.getElementById("quick-questions-row");
  if (qqRow && qqRow.children.length === 0) {
    qqRow.innerHTML = Constants.QUICK_QUESTIONS.map(q =>
      `<button class="chip" style="color:var(--amber-curing);" data-action="quick-question" data-question="${State.escapeHtml(q)}">${State.escapeHtml(q)}</button>`
    ).join("");
  }

  // Сохранение состояния
  State.persistStateToStorage();
}

// Делегированная обработка действий по data-action
if (typeof document !== "undefined") {
  document.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "delete-batch") {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof WorkshopMemory !== "undefined" && WorkshopMemory.deleteMemoryBatch) {
        WorkshopMemory.deleteMemoryBatch(btn.dataset.id);
      } else if (typeof deleteMemoryBatch === "function") {
        deleteMemoryBatch(btn.dataset.id);
      }
    } else if (action === "delete-rule") {
      evt.preventDefault();
      evt.stopPropagation();
      if (typeof WorkshopMemory !== "undefined" && WorkshopMemory.deleteMemoryRule) {
        WorkshopMemory.deleteMemoryRule(btn.dataset.id);
      } else if (typeof deleteMemoryRule === "function") {
        deleteMemoryRule(btn.dataset.id);
      }
    } else if (action === "quick-question") {
      evt.preventDefault();
      evt.stopPropagation();
      const q = btn.dataset.question || btn.textContent.trim();
      if (typeof AiVoice !== "undefined" && AiVoice.sendChatMessage) {
        AiVoice.sendChatMessage(q);
      } else if (typeof sendChatMessage === "function") {
        sendChatMessage(q);
      }
    } else if (action === "select-species") {
      evt.preventDefault();
      if (typeof selectSpecies === "function") selectSpecies(btn.dataset.speciesKey);
    } else if (action === "select-stage") {
      evt.preventDefault();
      if (typeof selectStage === "function") selectStage(btn.dataset.stageKey);
    } else if (action === "apply-preset") {
      evt.preventDefault();
      if (typeof applyPreset === "function") applyPreset(parseInt(btn.dataset.presetIdx, 10));
    }
  });
}

// ==================== BOOTSTRAP ПРИ DOMContentLoaded ====================
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    try { State.initScreenCalibration(); } catch (e) {}
    try { State.loadPersistedState(); } catch (e) {}
    try { WorkshopMemory.loadWorkshopMemory(); } catch (e) {}
    try { CloudSync.cloudSyncInit(); } catch (e) {}
    try { Calculators.vxInit(); } catch (e) {}
    try { Calculators.renderAllSpPanels(); } catch (e) { console.warn("renderAllSpPanels init error:", e); }

    setInterval(Scada.renderPhaseTimerHud, 1000);

    // Восстановление логгера Parkside
    if (
      State.activeParksideAnalysis &&
      Array.isArray(State.activeParksideAnalysis.points) &&
      State.activeParksideAnalysis.points.length >= 2 &&
      State.activeParksideAnalysis.profileKey !== "st2_active"
    ) {
      const savedProfileKey = State.activeParksideAnalysis.fileName === "USB Data Logger_261028_1234.CSV"
        ? "real_527"
        : (State.activeParksideAnalysis.profileKey || null);
      const restored = Calculators.analyzeParksidePoints(State.activeParksideAnalysis.fileName, State.activeParksideAnalysis.points);
      if (restored) {
        restored.profileKey = savedProfileKey;
        Calculators.renderParksideChartAndVerdict(restored);
      } else {
        Calculators.loadDemoParksideProfile("real_527", true);
      }
    } else {
      Calculators.loadDemoParksideProfile("real_527", true);
    }

    // Первоначальный синхронный рендер
    renderAll(true);

    // Регистрация PWA Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(err => {
          console.warn("ServiceWorker registration error:", err);
        });
      });
    }
  });
}
