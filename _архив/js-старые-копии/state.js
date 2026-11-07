// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 2: СОСТОЯНИЕ, ХРАНИЛИЩЕ И УТИЛИТЫ (ES Module)
// ==========================================================================

import {
  SCREEN_CALIB_PRESETS,
  HEAT_RECOVERY_MODES,
  FISH_SPECIES,
  CURING_STAGES,
  SAMPLE_PRESETS,
  CHAT_MODELS
} from './constants.js';


export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 📊 Реюзабельный генератор KPI-плитки (метрики)
 */
export function createKpiTileHtml({
  label = "",
  value = "",
  sub = "",
  borderColor = "",
  bg = "",
  valueColor = "",
  labelColor = "",
  subColor = "",
  fontSize = "",
  icon = "",
  style = "",
  dataAttrs = ""
} = {}) {
  const styles = [];
  if (borderColor) styles.push(`border-color: ${borderColor}`);
  if (bg) styles.push(`background: ${bg}`);
  if (style) styles.push(style);
  const styleAttr = styles.length > 0 ? ` style="${styles.join("; ")}"` : "";

  const valStyles = [];
  if (fontSize) valStyles.push(`font-size: ${fontSize}`);
  if (valueColor) valStyles.push(`color: ${valueColor}`);
  const valStyleAttr = valStyles.length > 0 ? ` style="${valStyles.join("; ")}"` : "";

  const labelStyleAttr = labelColor ? ` style="color: ${labelColor};"` : "";
  const subStyleAttr = subColor ? ` style="color: ${subColor};"` : "";

  return `
    <div class="metric-tile"${styleAttr}${dataAttrs ? " " + dataAttrs : ""}>
      ${label ? `<div class="m-label"${labelStyleAttr}>${icon ? icon + " " : ""}${label}</div>` : ""}
      <div class="m-val"${valStyleAttr}>${value}</div>
      ${sub ? `<div class="m-sub"${subStyleAttr}>${sub}</div>` : ""}
    </div>
  `.trim();
}

/**
 * 🃏 Реюзабельный генератор карточки
 */
export function createCardHtml({
  title = "",
  subtitle = "",
  badgeText = "",
  badgeClass = "scada-status-pill",
  bodyHtml = "",
  borderColor = "",
  bg = "",
  actionsHtml = "",
  className = "panel-card",
  style = "",
  dataAttrs = ""
} = {}) {
  const styles = [];
  if (borderColor) styles.push(`border-color: ${borderColor}`);
  if (bg) styles.push(`background: ${bg}`);
  if (style) styles.push(style);
  const styleAttr = styles.length > 0 ? ` style="${styles.join("; ")}"` : "";

  let headerHtml = "";
  if (title || subtitle || badgeText || actionsHtml) {
    headerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div>
          ${title ? `<b style="font-size:13.5px; color:var(--steel-text-primary);">${title}</b>` : ""}
          ${subtitle ? `<div style="font-size:11.5px; color:var(--steel-text-secondary); margin-top:2px;">${subtitle}</div>` : ""}
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${badgeText ? `<span class="${badgeClass}">${badgeText}</span>` : ""}
          ${actionsHtml || ""}
        </div>
      </div>
    `;
  }

  return `
    <div class="${className}"${styleAttr}${dataAttrs ? " " + dataAttrs : ""}>
      ${headerHtml}
      ${bodyHtml}
    </div>
  `.trim();
}

/**
 * 🏷️ Реюзабельный генератор бейджа (статус-пилл)
 */
export function createPillBadgeHtml({
  text = "",
  type = "optimal",
  icon = "",
  style = "",
  dataAttrs = ""
} = {}) {
  const styleAttr = style ? ` style="${style}"` : "";
  return `<span class="scada-status-pill status-${type}"${styleAttr}${dataAttrs ? " " + dataAttrs : ""}>${icon ? icon + " " : ""}${text}</span>`;
}


    
    // ==================== 🎯 КАЛИБРОВКА ЭКРАНА ONEPLUS 13 PRO AMOLED ====================
    // SCREEN_CALIB_PRESETS imported from constants.js
    function getInitialScale() {
      const saved = localStorage.getItem("arm_ui_scale");
      if (saved) return parseFloat(saved);
      return 1.0;
    }
    function applyScreenScale(val, showToast) {
      const scale = Math.min(Math.max(Number(val) || 1.0, 0.60), 1.25);
      document.documentElement.style.setProperty("--arm-ui-scale", scale);
      if (scale !== 1.0) { document.body.style.zoom = scale; } else { document.body.style.zoom = ""; }
      localStorage.setItem("arm_ui_scale", scale.toString());

      const txt1 = document.getElementById("calib-scale-txt");
      if (txt1) txt1.textContent = Math.round(scale * 100) + "%";
      const txt2 = document.getElementById("calib-hud-percent");
      if (txt2) txt2.textContent = Math.round(scale * 100) + "%";

      document.querySelectorAll(".calib-preset-btn").forEach(btn => {
        const p = parseFloat(btn.textContent) / 100;
        if (Math.abs(p - scale) < 0.02) {
          btn.style.borderColor = "#FFA726";
          btn.style.background = "rgba(255, 167, 38, 0.25)";
          btn.style.color = "#FFFFFF";
        } else {
          btn.style.borderColor = "#1E3554";
          btn.style.background = "#0B1626";
          btn.style.color = "#9FB3C8";
        }
      });

      if (showToast && typeof showToastMsg === "function") {
        showToastMsg("🎯 Калибровка экрана: " + Math.round(scale * 100) + "% (OnePlus 13 Pro AMOLED)");
      }
    }
    function adjustScreenScale(delta) {
      const current = parseFloat(localStorage.getItem("arm_ui_scale") || (getInitialScale().toString()));
      const next = Math.round((current + delta) * 100) / 100;
      applyScreenScale(next, true);
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15);
    }
    function cycleScreenCalibration() {
      toggleCalibHud();
    }
    function toggleCalibHud(force) {
      const hud = document.getElementById("screen-calib-floating-hud");
      if (!hud) return;
      if (typeof force === "boolean") {
        hud.style.display = force ? "flex" : "none";
      } else {
        hud.style.display = (hud.style.display === "none") ? "flex" : "none";
      }
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12);
    }
    function initScreenCalibration() {
      const scale = getInitialScale();
      applyScreenScale(scale, false);
    }


    // ==================== 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ И АВТОСОХРАНЕНИЕ LOCALSTORAGE ====================
    const STORAGE_KEY_TELEMETRY = "JURMALCIEMS_TELEMETRY_V1";
    const STORAGE_KEY_BATCH_LOGS = "JURMALCIEMS_BATCH_LOGS_V1";
    const STORAGE_KEY_PARKSIDE_ANALYSIS = "JURMALCIEMS_PARKSIDE_ANALYSIS_V1";

    export let activeParksideAnalysis = null;

    const DEFAULT_BATCH_LOGS = [
      {
        id: 4,
        timestampStr: "Сегодня, 08:30",
        telemetry: { ...SAMPLE_PRESETS[0].telemetry, environmentTempC: 15.8, parksideRhPercent: 58.0, stageKey: "STAGE_2" },
        dewPointC: 7.5,
        vpdKpa: 0.75,
        adviceText: "Партия Вимба (Сырть) (1950 кг, Стадия 2) идет в оптимальном биотехнологическом коридоре (Environment 15.8°C, Parkside rH 58%, точка росы 7.5°C, VPD 0.75 кПа): рисков закала и подпарки нет, капля жира у анального отверстия при сухой чешуе является нормой."
      },
      {
        id: 3,
        timestampStr: "Сегодня, 05:15",
        telemetry: { ...SAMPLE_PRESETS[0].telemetry, environmentTempC: 16.1, parksideRhPercent: 84.0, isPausePhaseNow: true, stageKey: "STAGE_2" },
        dewPointC: 13.4,
        vpdKpa: 0.29,
        adviceText: "Пауза Стадии 2 (25-я минута, Cantoni 18 Гц): выход влаги от хребта поднял Parkside rH до 84% (точка росы 13.4°C). Паузу держать строго не более 1.5 ч!"
      },
      {
        id: 2,
        timestampStr: "Вчера, 21:00",
        telemetry: { ...SAMPLE_PRESETS[0].telemetry, environmentTempC: 16.0, parksideRhPercent: 62.0, activeCircuitsRunning: 2, stageKey: "STAGE_1" },
        dewPointC: 8.7,
        vpdKpa: 0.69,
        adviceText: "Завершение Стадии 1 (2 контура AIM): верховая влага снята до полки 62% rH (точка росы 8.7°C), переход на Стадию 2 (только Контур №1)."
      },
      {
        id: 1,
        timestampStr: "Вчера, 09:00",
        telemetry: { ...SAMPLE_PRESETS[0].telemetry, environmentTempC: 16.4, parksideRhPercent: 71.0, activeCircuitsRunning: 2, stageKey: "STAGE_1" },
        dewPointC: 11.1,
        vpdKpa: 0.54,
        adviceText: "Старт Стадии 1 (2 контура AIM, Cantoni 30 Гц): активный съем верховой свободной влаги при Т=16.4°C, rH=71%, точка росы 11.1°C."
      }
    ];

    export let state = {
      uiMode: "ENGINEER",
      activeTab: "advisor",
      telemetry: {
        ...SAMPLE_PRESETS[0].telemetry,
        batchWeightKg: 1850,
        heatRecoveryMode: "WINTER_14KW",
        saltingBaume: 20.0,
        saltingDensity: 1.16,
        saltingFishWeightG: 350,
        saltingBrineTempC: 3.0,
        cantoniFrequencyHz: 30.0,
        cantoniGapAreaM2: 1.85,
        chamberVolumeM3: 42.0,
        productSaltPercent: 4.8,
        shelfLifePackageType: "VACUUM",
        batchStartMs: null,
        targetWaterLiters: null,
        controlBundleWeights: []
      },
      customAiAdvice: null,
      selectedChatModel: CHAT_MODELS[1].id,
      activeCsvResult: null,
      batchLogs: [...DEFAULT_BATCH_LOGS],
      chatMessages: [
        {
          id: 1,
          isUser: false,
          timestampStr: "Готов к работе",
          text: "👋 ИИ-технолог Юрмалциемса на связи. Спросите текстом, 📷 фото или 🎙️ голосом: режим, MCGS, срез, вакуум, лог Parkside."
        }
      ]
    };

    function loadPersistedState() {
      loadTradeHousePersistence();
      loadChiefTechPersistence();
      try {
        initScreenCalibration();
        if (typeof selectTab === "function") selectTab("calcs");
        const savedMode = localStorage.getItem("JURMALCIEMS_UI_MODE_V1");
        if (savedMode === "OWNER" || savedMode === "ENGINEER") {
          state.uiMode = savedMode;
        }
      } catch (e) {}

      try {
        const rawTel = localStorage.getItem(STORAGE_KEY_TELEMETRY);
        if (rawTel) {
          const parsedTel = JSON.parse(rawTel);
          if (parsedTel && typeof parsedTel === "object") {
            state.telemetry = {
              saltingBaume: 20.0,
              saltingDensity: 1.16,
              saltingFishWeightG: 350,
              saltingBrineTempC: 3.0,
              cantoniFrequencyHz: 30.0,
              cantoniGapAreaM2: 1.85,
              chamberVolumeM3: 42.0,
              productSaltPercent: 4.8,
              shelfLifePackageType: "VACUUM",
              batchStartMs: null,
              targetWaterLiters: null,
              controlBundleWeights: [],
              ...state.telemetry,
              ...parsedTel,
              speciesKey: FISH_SPECIES[parsedTel.speciesKey] ? parsedTel.speciesKey : state.telemetry.speciesKey,
              stageKey: CURING_STAGES[parsedTel.stageKey] ? parsedTel.stageKey : state.telemetry.stageKey,
              heatRecoveryMode: HEAT_RECOVERY_MODES[parsedTel.heatRecoveryMode] ? parsedTel.heatRecoveryMode : "WINTER_14KW"
            };
          }
        }
        if (!state.telemetry.batchStartMs && rawTel) {
          state.telemetry.batchStartMs = Date.now();
          if (typeof persistStateToStorage === "function") persistStateToStorage();
        }
      } catch (e) {}

      try {
        const rawLogs = localStorage.getItem(STORAGE_KEY_BATCH_LOGS);
        if (rawLogs !== null) {
          const parsedLogs = JSON.parse(rawLogs);
          if (Array.isArray(parsedLogs)) {
            state.batchLogs = parsedLogs;
          }
        }
      } catch (e) {}

      try {
        const rawParkside = localStorage.getItem(STORAGE_KEY_PARKSIDE_ANALYSIS);
        if (rawParkside) {
          const parsedParkside = JSON.parse(rawParkside);
          if (
            parsedParkside &&
            typeof parsedParkside === "object" &&
            Array.isArray(parsedParkside.points) &&
            parsedParkside.points.length >= 2
          ) {
            activeParksideAnalysis = parsedParkside;
          }
        }
      } catch (e) {}
    }

    function persistStateToStorage() {
      try {
        persistTradeHouseState();
        persistChiefTechState();
        localStorage.setItem("JURMALCIEMS_UI_MODE_V1", state.uiMode || "ENGINEER");
        localStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(state.telemetry));
        localStorage.setItem(STORAGE_KEY_BATCH_LOGS, JSON.stringify(state.batchLogs));
        if (activeParksideAnalysis && Array.isArray(activeParksideAnalysis.points) && activeParksideAnalysis.points.length >= 2) {
          localStorage.setItem(STORAGE_KEY_PARKSIDE_ANALYSIS, JSON.stringify(activeParksideAnalysis));
        }
      } catch (e) {}
      if (typeof scheduleCloudSyncPush === "function") {
        scheduleCloudSyncPush("telemetry_or_parkside");
      }
    }

    function resetToDemoDefaults() {
      const ok = confirm(
        "Сбросить все текущие данные (настройки телеметрии, журнал замеров и загруженный лог Parkside) к исходному демо-профилю st2_active?"
      );
      if (!ok) return;
      try {
        localStorage.removeItem(STORAGE_KEY_TELEMETRY);
        localStorage.removeItem(STORAGE_KEY_BATCH_LOGS);
        localStorage.removeItem(STORAGE_KEY_PARKSIDE_ANALYSIS);
      } catch (e) {}

      state.telemetry = { ...SAMPLE_PRESETS[0].telemetry, batchWeightKg: 1850, heatRecoveryMode: "WINTER_14KW" };
      state.batchLogs = [...DEFAULT_BATCH_LOGS];
      state.customAiAdvice = null;
      activeParksideAnalysis = null;

      loadDemoParksideProfile("st2_active", true);
      renderAll();
      showToast("Данные сброшены к эталонному демо-профилю (st2_active)");
    }


export let activeBatch = {
  speciesKey: "VIMBA",
  weightKg: 1000,
  incomingPricePerKg: 3.50,
  wholesalePricePerKg: 12.00,
  vacuumPricePerKg: 15.00,
  semiPricePerKg: 13.50,
  retailPricePerKg: 15.00,
  yieldPct: 61.5,
  sourceModule: "INITIAL_DEFAULT"
};

export let vx = {
  compact: true,
  batchMode: "mono",
  mixCarts: { VIMBA: 8, BREAM: 4, PERCH: 3, ROACH: 0, SMELT: 0, GOBY: 0 },
  yieldPct: null,
  yieldSpecies: null,
  purchase: 1.2,
  priceBulk: 10,
  priceVac: 20,
  priceVacPack: 17.0,
  pricePrem: 33.3,
  pricePremPiece: 10.0,
  tariff: 0.18,
  mixVac: 50,
  variant: "vac",
  voiceLog: []
};

let __lastHapticTimestamp = 0;
export function triggerHaptic(ms = 12, isContinuous = false) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  if (!isContinuous && now - __lastHapticTimestamp < 45) return;
  __lastHapticTimestamp = now;
  try {
    navigator.vibrate(ms);
  } catch (e) {}
}

export function showToast(msg) {
  let el = document.getElementById("scada-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "scada-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  if (typeof window !== "undefined") {
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }
}

export function selectTab(tabId) {
  triggerHaptic(10);
  state.activeTab = tabId;
  const tabs = ["simple-owner", "advisor", "mcgs", "species", "chat", "hardware", "tradehouse", "chief-tech", "memory"];
  tabs.forEach(id => {
    const pane = document.getElementById(`tab-${id}`);
    const nav = document.getElementById(`nav-${id}`);
    const dock = document.getElementById(`dock-${id}`);
    const mobNav = document.getElementById(`mob-nav-${id}`);
    if (pane) pane.style.display = id === tabId ? "block" : "none";
    if (nav) nav.className = `nav-btn ${id === tabId ? "active" : ""}`;
    if (dock) dock.className = `dock-btn ${id === tabId ? "active" : ""}`;
    if (mobNav) mobNav.className = `mob-nav-btn ${id === tabId ? "active" : ""}`;
  });
  if (typeof renderAll === "function") renderAll();
}

export function selectMobileMainTab(tabId) {
  selectTab(tabId);
}

export function toggleMobileActionsDrawer() {
  triggerHaptic(12);
  const backdrop = document.getElementById("mobile-actions-drawer-backdrop");
  if (backdrop) backdrop.classList.toggle("open");
}

export function closeMobileActionsDrawer() {
  const backdrop = document.getElementById("mobile-actions-drawer-backdrop");
  if (backdrop) backdrop.classList.remove("open");
}

export function openFullscreenMimicModal() {
  triggerHaptic(14);
  const modal = document.getElementById("mimic-fullscreen-modal");
  if (modal) {
    modal.classList.add("open");
    const srcSvg = document.getElementById("scada-chamber-desktop-svg");
    const slot = document.getElementById("mimic-fullscreen-svg-slot");
    if (srcSvg && slot) slot.innerHTML = srcSvg.outerHTML;
  }
}

export function closeFullscreenMimicModal() {
  triggerHaptic(10);
  const modal = document.getElementById("mimic-fullscreen-modal");
  if (modal) modal.classList.remove("open");
}

export function setAppUiMode(mode) {
  triggerHaptic(12);
  state.uiMode = mode === "OWNER" ? "OWNER" : "ENGINEER";
  localStorage.setItem("JURMALCIEMS_UI_MODE_V1", state.uiMode);
  if (typeof renderAll === "function") renderAll();
  showToast(state.uiMode === "OWNER" ? "👔 Режим: Торговый дом и Руководитель" : "🔬 Режим: Главный технолог и SCADA");
}

export {
  loadPersistedState,
  persistStateToStorage,
  resetToDemoDefaults,
  getInitialScale,
  applyScreenScale,
  adjustScreenScale,
  cycleScreenCalibration,
  toggleCalibHud,
  initScreenCalibration
};

if (typeof window !== "undefined") {
  window.state = state;
  window.activeBatch = activeBatch;
  window.escapeHtml = escapeHtml;
  window.createKpiTileHtml = createKpiTileHtml;
  window.createCardHtml = createCardHtml;
  window.createPillBadgeHtml = createPillBadgeHtml;
  window.loadPersistedState = loadPersistedState;
  window.persistStateToStorage = persistStateToStorage;
  window.resetToDemoDefaults = resetToDemoDefaults;
  window.getInitialScale = getInitialScale;
  window.applyScreenScale = applyScreenScale;
  window.adjustScreenScale = adjustScreenScale;
  window.cycleScreenCalibration = cycleScreenCalibration;
  window.toggleCalibHud = toggleCalibHud;
  window.initScreenCalibration = initScreenCalibration;
}
