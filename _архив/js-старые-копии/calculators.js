// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 5: КАЛЬКУЛЯТОРЫ, ТОРГОВЫЙ ДОМ И ЛОГИСТИКА KOMET (ES Module)
// ==========================================================================

import {
  FISH_SPECIES,
  CURING_STAGES,
  HEAT_RECOVERY_MODES,
  CT_SPECIES,
  VX_PACK_FORMATS
} from './constants.js';

import {
  state,
  activeBatch,
  vx,
  triggerHaptic,
  showToast,
  escapeHtml,
  persistStateToStorage
} from './state.js';

import {
  analyzeBioscience,
  calculateYieldForecast,
  targetTempRangeFor
} from './bioscience.js';

    function buildCalculatorCardHtml(t, yf) {
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const weightPresets = [800, 1200, 1850, 2400, 3000, 3500].map(kg =>
        `<button class="chip ${t.batchWeightKg === kg ? 'active-amber' : ''}" onclick="updateBatchWeight(${kg})">${kg} кг</button>`
      ).join("");

      const speciesChips = Object.values(FISH_SPECIES).map(sp =>
        `<button class="chip ${sp.key === t.speciesKey ? 'active-amber' : ''}" onclick="selectSpecies('${sp.key}')">${sp.titleRu}</button>`
      ).join("");

      const stageChips = Object.values(CURING_STAGES).map(st =>
        `<button class="chip ${st.key === t.stageKey ? 'active-cyan' : ''}" onclick="selectStage('${st.key}')">${st.shortTitleRu}</button>`
      ).join("");

      return `
        <div class="card card-amber">
          <div style="margin-bottom:12px;">
            <div class="section-label" style="color:var(--amber-curing); margin-bottom:8px;">⚖ КАЛЬКУЛЯТОР ПАРТИИ И ВЛАГОСЪЕМА</div>
            <button class="btn btn-emerald" style="width:100%; justify-content:center;" onclick="triggerExportCsv()">⬇ Экспорт отчета партии (CSV)</button>
          </div>
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
            <div class="field-box" style="flex:1;">
              <label>Вес сырой рыбы при загрузке (кг)</label>
              <input type="number" class="field-input" value="${t.batchWeightKg}" min="50" max="10000" step="50" onchange="updateBatchWeight(this.value)" />
            </div>
            <button class="step-btn" style="width:42px; height:42px; margin-top:16px;" onclick="updateBatchWeight(${Math.max(50, t.batchWeightKg - 100)})">−100</button>
            <button class="step-btn" style="width:42px; height:42px; margin-top:16px;" onclick="updateBatchWeight(${Math.min(5000, t.batchWeightKg + 100)})">+100</button>
          </div>
          <div class="chip-row" style="margin-bottom:10px;">${weightPresets}</div>
          <div class="divider"></div>
          <div style="font-size:12.5px; color:var(--steel-text-secondary); margin:8px 0 6px;">Вид рыбы (норма выхода ${species.yieldPercentRange}):</div>
          <div class="chip-row" style="margin-bottom:10px;">${speciesChips}</div>
          <div style="font-size:12.5px; color:var(--steel-text-secondary); margin:8px 0 6px;">Текущая стадия / сутки цикла:</div>
          <div class="chip-row" style="margin-bottom:12px;">${stageChips}</div>
          <div class="hud-grid">
            <div class="metric-tile" style="background:rgba(6, 59, 39, 0.82); border-color:var(--emerald-optimal);">
              <div class="m-label" style="color:var(--emerald-optimal);">ГОТОВАЯ ПРОДУКЦИЯ</div>
              <div class="m-val" style="color:var(--steel-text-primary);">${yf.finishedMinKg}–${yf.finishedMaxKg} кг</div>
              <div class="m-sub" style="color:var(--emerald-optimal);">Сред.: ~${yf.finishedAvgKg} кг (${species.yieldPercentRange})</div>
            </div>
            <div class="metric-tile" style="background:rgba(0, 56, 68, 0.82); border-color:var(--cyan-dew);">
              <div class="m-label" style="color:var(--cyan-dew);">💧 ИСПАРИТЬ ВОДЫ ВСЕГО</div>
              <div class="m-val" style="color:var(--steel-text-primary);">${yf.totalWaterMinLiters}–${yf.totalWaterMaxLiters} л</div>
              <div class="m-sub" style="color:var(--cyan-dew);">На Ст.${stage.number}: ~${yf.currentStageWaterLiters} л (${stage.moistureShareOfTotalPercent}%)</div>
            </div>
          </div>
          <div style="margin-top: 10px; background: rgba(6, 59, 39, 0.72); border: 1px solid var(--emerald-optimal); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; line-height: 1.45; color: var(--steel-text-primary);">
            <b style="color: var(--emerald-optimal);">💡 Стадия 4 (Отволаживание) • Контроль среза «янтарно-стекловидная слеза без белесых пятен»:</b><br/>
            ⚠️ <b>На воздухе в цеху</b> держать строго <b>НЕ БОЛЕЕ 24 часов</b> (к 2-м суткам потеря упругого «хруст», размягчение белка, набор влаги из цеха и окисление жира/икры).<br/>
            ✅ <b>Климатическое внутри закрытой камеры (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц):</b> <b>24–48 часов</b> дают идеальную монолитность и охлаждение тушки до 13–15°C, исключая выпадение росы в пакетах <b>KOMET PlusVac 25</b>.
          </div>
        </div>
      `;
    }

    // Интерактивный блок «Геометрия Монолита (15 тележек 3×5) и СОП Рокировки + Памятка 8-го шага»

    // ==================== МОДУЛЬ "💼 ТОРГОВЫЙ ДОМ • ПАРТИИ, СКЛАД И СДЕЛКИ (€)" ====================
    const STORAGE_KEY_TRADE_HOUSE = "JURMALCIEMS_TRADE_HOUSE_V1";
    const STORAGE_KEY_WAREHOUSE = "JURMALCIEMS_WAREHOUSE_TUBA_V1";

    const TRADE_SPECIES_DEFAULTS = {
      ROACH: {
        yieldPct: 58,
        yieldRange: "56–60%",
        defaultRawPrice: 3.00,
        rawStatus: "✅ Подтвержденная цена цеха",
        defaultWholesale: 10.00,
        wholesaleStatus: "✅ Подтвержденная цена цеха",
        vacuumPrice: 12.00,
        vacuumStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        defaultRetail: 12.00,
        titleRu: "Плотва (калибр 22+)",
        shortName: "Плотва"
      },
      VIMBA: {
        yieldPct: 61.5,
        yieldRange: "60–63%",
        defaultRawPrice: 3.50,
        rawStatus: "📐 Расчетный ориентир 3.30–3.80€ (уточните под партию)",
        defaultWholesale: 12.00,
        wholesaleStatus: "✅ Подтвержденная цена цеха",
        vacuumPrice: 15.00,
        vacuumStatus: "✅ Подтвержденная цена цеха",
        defaultRetail: 15.00,
        titleRu: "Вимба (Сырть)",
        shortName: "Вимба"
      },
      BREAM: {
        yieldPct: 60,
        yieldRange: "58–62%",
        defaultRawPrice: 1.60,
        rawStatus: "📐 Расчетный ориентир 1.40–1.80€ под цену готового 7€",
        defaultWholesale: 7.00,
        wholesaleStatus: "✅ Подтвержденная цена цеха",
        vacuumPrice: 9.50,
        vacuumStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        defaultRetail: 9.50,
        titleRu: "Лещ (крупный колодкой)",
        shortName: "Лещ"
      },
      SMELT: {
        yieldPct: 52,
        yieldRange: "50–54%",
        defaultRawPrice: 4.50,
        rawStatus: "📐 Расчетный ориентир 4.00–5.00€ (уточните под партию)",
        defaultWholesale: 17.00,
        wholesaleStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        vacuumPrice: 25.00,
        vacuumStatus: "✅ Подтвержденная цена цеха",
        defaultRetail: 25.00,
        titleRu: "Корюшка балтийская",
        shortName: "Корюшка"
      },
      PERCH: {
        yieldPct: 56,
        yieldRange: "54–58%",
        defaultRawPrice: 2.50,
        rawStatus: "📐 Расчетный ориентир 2.30–2.70€ (уточните под партию)",
        defaultWholesale: 9.50,
        wholesaleStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        vacuumPrice: 12.50,
        vacuumStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        defaultRetail: 12.50,
        titleRu: "Окунь речной",
        shortName: "Окунь"
      },
      ROUND_GOBY: {
        yieldPct: 52.5,
        yieldRange: "50–55%",
        defaultRawPrice: 1.10,
        rawStatus: "📐 Расчетный ориентир 0.90–1.30€ (уточните под партию)",
        defaultWholesale: 7.00,
        wholesaleStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        vacuumPrice: 8.50,
        vacuumStatus: "📐 Расчетный рыночный ориентир (уточните под партию)",
        defaultRetail: 8.50,
        titleRu: "Бычок кругляк",
        shortName: "Бычок"
      }
    };

    const TRADE_PACK_FORMATS = {
      BULK: { key: "BULK", label: "📦 Развес (ящик)", packKg: 1.0, packCost: 0.05 },
      TUBA_PACK_4: { key: "TUBA_PACK_4", label: "🟦 TUBA 4 шт (~600г)", packKg: 0.60, packCost: 0.42 },
      PACK_3: { key: "PACK_3", label: "🟩 Пакет 3 шт (~850г)", packKg: 0.85, packCost: 0.42 },
      PREM_1: { key: "PREM_1", label: "👑 Премиум 1 шт (~300г)", packKg: 0.30, packCost: 0.42 }
    };

    const DEFAULT_TRADE_HOUSE_STATE = {
      speciesKey: "BREAM",
      rawBatchKg: 2000,
      rawPricePerKg: 2.20,
      powerTariff: 0.18,
      packageFormat: "TUBA_PACK_4",
      bargainDelta: 0,
      
      incomingSpeciesKey: "BREAM",
      incomingTonnageKg: 2000,
      incomingCaliber: "LARGE",
      incomingRawType: "FRESH",
      incomingFatRoe: "FAT_ROE",
      
      beaconRawGrams: 1800,
      beaconCurrentGrams: 1260,
      
      sortPremPct: 25,
      sortTubaPct: 50,
      sortBulkPct: 25,
      
      dealSpeciesKey: "BREAM",
      dealVolumeKg: 150,
      dealPriceTier: "WHOLESALE",
      dealDiscountPct: 5
    };

    const DEFAULT_TUBA_WAREHOUSE = {
      ROACH: { name: "Плотва икряная", packs: 640, kg: 416, days: 28, wholesalePrice: 10.00, vacuumPrice: 12.00, semiPrice: 11.00, retailPrice: 12.00, yieldPct: 58, rawPrice: 3.00, rawStatus: "✅ Подтвержденная цена цеха", wholesaleStatus: "✅ Подтвержденная цена цеха", vacuumStatus: "📐 Расчетный рыночный ориентир" },
      VIMBA: { name: "Вимба (Рыбец)", packs: 480, kg: 312, days: 9, wholesalePrice: 12.00, vacuumPrice: 15.00, semiPrice: 13.50, retailPrice: 15.00, yieldPct: 61.5, rawPrice: 3.50, rawStatus: "📐 Расчетный ориентир 3.30–3.80€", wholesaleStatus: "✅ Подтвержденная цена цеха", vacuumStatus: "✅ Подтвержденная цена цеха" },
      BREAM: { name: "Лещ вяленый", packs: 820, kg: 533, days: 82, wholesalePrice: 7.00, vacuumPrice: 9.50, semiPrice: 8.20, retailPrice: 9.50, yieldPct: 60, rawPrice: 1.60, rawStatus: "📐 Расчетный ориентир 1.40–1.80€", wholesaleStatus: "✅ Подтвержденная цена цеха", vacuumStatus: "📐 Расчетный рыночный ориентир" },
      SMELT: { name: "Корюшка балтийская", packs: 350, kg: 175, days: 76, wholesalePrice: 17.00, vacuumPrice: 25.00, semiPrice: 20.00, retailPrice: 25.00, yieldPct: 52, rawPrice: 4.50, rawStatus: "📐 Расчетный ориентир 4.00–5.00€", wholesaleStatus: "📐 Расчетный рыночный ориентир", vacuumStatus: "✅ Подтвержденная цена цеха" },
      PERCH: { name: "Окунь речной", packs: 420, kg: 273, days: 34, wholesalePrice: 9.50, vacuumPrice: 12.50, semiPrice: 11.00, retailPrice: 12.50, yieldPct: 56, rawPrice: 2.50, rawStatus: "📐 Расчетный ориентир 2.30–2.70€", wholesaleStatus: "📐 Расчетный рыночный ориентир", vacuumStatus: "📐 Расчетный рыночный ориентир" },
      ROUND_GOBY: { name: "Бычок кругляк", packs: 280, kg: 182, days: 18, wholesalePrice: 7.00, vacuumPrice: 8.50, semiPrice: 7.80, retailPrice: 8.50, yieldPct: 52.5, rawPrice: 1.10, rawStatus: "📐 Расчетный ориентир 0.90–1.30€", wholesaleStatus: "📐 Расчетный рыночный ориентир", vacuumStatus: "📐 Расчетный рыночный ориентир" }
    };

    let tradeHouseState = { ...DEFAULT_TRADE_HOUSE_STATE };
    let tubaWarehouse = JSON.parse(JSON.stringify(DEFAULT_TUBA_WAREHOUSE));

    function loadTradeHousePersistence() {
      try {
        const rawTH = localStorage.getItem(STORAGE_KEY_TRADE_HOUSE);
        if (rawTH) {
          const parsed = JSON.parse(rawTH);
          if (parsed && typeof parsed === "object") {
            tradeHouseState = { ...tradeHouseState, ...parsed };
          }
        }
      } catch (e) {}

      try {
        const rawWH = localStorage.getItem(STORAGE_KEY_WAREHOUSE);
        if (rawWH) {
          const parsedWH = JSON.parse(rawWH);
          if (parsedWH && typeof parsedWH === "object") {
            tubaWarehouse = { ...tubaWarehouse, ...parsedWH };
          }
        }
      } catch (e) {}
    }

    function persistTradeHouseState() {
      try {
        localStorage.setItem(STORAGE_KEY_TRADE_HOUSE, JSON.stringify(tradeHouseState));
        localStorage.setItem(STORAGE_KEY_WAREHOUSE, JSON.stringify(tubaWarehouse));
      } catch (e) {}
    }

    // Handlers for Tool 1: Переговорщик у лодки
    
    // ==================== 🔄 ЕДИНАЯ АКТИВНАЯ ПАРТИЯ (СИНХРОНИЗАЦИЯ МОДУЛЕЙ) ====================
    function syncActiveBatch(source, speciesKey, weightKg) {
      let normKey = speciesKey;
      if (normKey === "GOBY") normKey = "ROUND_GOBY";

      if (normKey && TRADE_SPECIES_DEFAULTS[normKey]) {
        // 1. Синхронизируем телеметрию SCADA
        if (typeof state !== "undefined" && state && state.telemetry) {
          state.telemetry.speciesKey = (normKey === "ROUND_GOBY" && FISH_SPECIES.GOBY) ? "GOBY" : normKey;
          const sp = FISH_SPECIES[state.telemetry.speciesKey] || FISH_SPECIES.VIMBA;
          const st = (typeof CURING_STAGES !== "undefined" && CURING_STAGES[state.telemetry.stageKey]) || null;
          if (sp && sp.tempRangeMonoC) {
            const midTemp = Math.round(((sp.tempRangeMonoC[0] + sp.tempRangeMonoC[1]) / 2.0) * 10) / 10;
            state.telemetry.environmentTempC = st && st.key === "STAGE_4" ? 14.0 : midTemp;
            state.telemetry.visualNotes = sp.bioFeatureRu;
          }
        }
        // 2. Синхронизируем Торговый Дом
        if (typeof tradeHouseState !== "undefined") {
          tradeHouseState.speciesKey = normKey;
          tradeHouseState.incomingSpeciesKey = normKey;
          tradeHouseState.dealSpeciesKey = normKey;
          const def = TRADE_SPECIES_DEFAULTS[normKey];
          if (def) {
            tradeHouseState.rawPricePerKg = def.defaultRawPrice;
          }
        }
        // 3. Синхронизируем Главного Технолога
        if (typeof chiefTechState !== "undefined") {
          chiefTechState.speciesKey = normKey;
        }
      }

      if (weightKg !== undefined && weightKg !== null) {
        const kg = Math.min(10000, Math.max(50, parseFloat(weightKg) || 1000));
        if (typeof state !== "undefined" && state && state.telemetry) {
          state.telemetry.batchWeightKg = kg;
        }
        if (typeof tradeHouseState !== "undefined") {
          tradeHouseState.rawBatchKg = kg;
          tradeHouseState.incomingTonnageKg = kg;
        }
        if (typeof chiefTechState !== "undefined") {
          chiefTechState.rawKg = kg;
        }
        const aimInput = document.getElementById("sp-aim-raw-kg");
        if (aimInput && aimInput !== document.activeElement) {
          aimInput.value = kg;
        }
      }

      if (typeof persistTradeHouseState === "function") persistTradeHouseState();
      if (typeof persistChiefTechState === "function") persistChiefTechState();
      if (typeof persistStateToStorage === "function") persistStateToStorage();

      if (source !== "remote" && typeof phoneSimSyncChannel !== "undefined" && phoneSimSyncChannel) {
        try {
          phoneSimSyncChannel.postMessage({
            type: "SYNC_BATCH",
            speciesKey: normKey,
            weightKg: weightKg,
            warehouse: tubaWarehouse
          });
        } catch(e) {}
      }
      if (typeof renderAll === "function") renderAll();
      if (typeof calcSpAim === "function") calcSpAim();
    }

    function onTradeFishSelect(key) {
      syncActiveBatch("trade", key, tradeHouseState.rawBatchKg);
      triggerHaptic(12);
      tradeHouseState.speciesKey = key;
      const def = TRADE_SPECIES_DEFAULTS[key];
      if (def) {
        tradeHouseState.rawPricePerKg = def.defaultRawPrice;
      }
      tradeHouseState.bargainDelta = 0;
      persistTradeHouseState();
      renderAll();
    }

    function onTradeRawKgInput(val) {
      syncActiveBatch("trade", null, val);
      const n = Math.max(50, Math.min(10000, parseFloat(val) || 0));
      tradeHouseState.rawBatchKg = n;
      persistTradeHouseState();
      renderAll();
    }

    function onTradeRawPriceInput(val) {
      const n = Math.max(0.1, Math.min(50, parseFloat(val) || 0));
      tradeHouseState.rawPricePerKg = n;
      tradeHouseState.bargainDelta = 0;
      persistTradeHouseState();
      renderAll();
    }

    function onTradeTariffInput(val) {
      const n = Math.max(0.01, Math.min(2.0, parseFloat(val) || 0));
      tradeHouseState.powerTariff = n;
      persistTradeHouseState();
      renderAll();
    }

    function onTradeFormatSelect(fmtKey) {
      triggerHaptic(12);
      tradeHouseState.packageFormat = fmtKey;
      persistTradeHouseState();
      renderAll();
    }

    function onTradeApplyBargain(delta) {
      triggerHaptic(18);
      tradeHouseState.bargainDelta = delta;
      tradeHouseState.rawPricePerKg = Math.max(0.5, parseFloat((tradeHouseState.rawPricePerKg + delta).toFixed(2)));
      persistTradeHouseState();
      renderAll();
      showToast(delta < 0 ? (`Сторговали сырье на ${delta} €/кг!`) : 'Цена обновлена');
    }

    // Handlers for Tool 2: Умный Конструктор Входящей Партии
    function onIncomingFishSelect(key) {
      syncActiveBatch("incoming", key, tradeHouseState.incomingTonnageKg);
      triggerHaptic(12);
      tradeHouseState.incomingSpeciesKey = key;
      persistTradeHouseState();
      renderAll();
    }

    function onIncomingTonnageInput(val) {
      const n = Math.max(100, Math.min(5000, parseFloat(val) || 0));
      tradeHouseState.incomingTonnageKg = n;
      persistTradeHouseState();
      renderAll();
    }

    function onIncomingCaliberSelect(cal) {
      triggerHaptic(12);
      tradeHouseState.incomingCaliber = cal;
      persistTradeHouseState();
      renderAll();
    }

    function onIncomingRawTypeSelect(type) {
      triggerHaptic(12);
      tradeHouseState.incomingRawType = type;
      persistTradeHouseState();
      renderAll();
    }

    function onIncomingFatRoeSelect(val) {
      triggerHaptic(12);
      tradeHouseState.incomingFatRoe = val;
      persistTradeHouseState();
      renderAll();
    }

    // Handlers for Tool 3: Контрольная связка-маяк
    function onBeaconRawInput(val) {
      const n = Math.max(100, Math.min(10000, parseFloat(val) || 0));
      tradeHouseState.beaconRawGrams = n;
      persistTradeHouseState();
      renderAll();
    }

    function onBeaconCurrentInput(val) {
      const n = Math.max(50, Math.min(10000, parseFloat(val) || 0));
      tradeHouseState.beaconCurrentGrams = n;
      persistTradeHouseState();
      renderAll();
    }

    // Handlers for Tool 4: Финансовый сортировщик
    function onSortSliderInput(type, val) {
      let num = parseInt(val, 10);
      if (isNaN(num)) num = 0;
      num = Math.max(0, Math.min(100, num));
      
      if (type === "prem") {
        tradeHouseState.sortPremPct = num;
        const rem = 100 - num;
        tradeHouseState.sortTubaPct = Math.round(rem * 0.67);
        tradeHouseState.sortBulkPct = 100 - num - tradeHouseState.sortTubaPct;
      } else if (type === "tuba") {
        tradeHouseState.sortTubaPct = num;
        const rem = 100 - num;
        tradeHouseState.sortPremPct = Math.round(rem * 0.50);
        tradeHouseState.sortBulkPct = 100 - num - tradeHouseState.sortPremPct;
      } else if (type === "bulk") {
        tradeHouseState.sortBulkPct = num;
        const rem = 100 - num;
        tradeHouseState.sortTubaPct = Math.round(rem * 0.67);
        tradeHouseState.sortPremPct = 100 - num - tradeHouseState.sortTubaPct;
      }
      persistTradeHouseState();
      renderAll();
    }

    // Handlers for Tool 5: Склад TUBA и Касса Сделок
    function onWarehouseAdjust(speciesKey, deltaPacks) {
      triggerHaptic(15);
      const item = tubaWarehouse[speciesKey];
      if (!item) return;
      item.packs = Math.max(0, item.packs + deltaPacks);
      item.kg = Math.round(item.packs * 0.65);
      persistTradeHouseState();
      renderAll();
      showToast(`Склад TUBA: ${item.name} ${deltaPacks > 0 ? "+" : ""}${deltaPacks} пач.`);
    }

    function onDealSpeciesSelect(key) {
      triggerHaptic(12);
      tradeHouseState.dealSpeciesKey = key;
      persistTradeHouseState();
      renderAll();
    }

    function onDealVolumeInput(val) {
      const n = Math.max(1, Math.min(5000, parseFloat(val) || 0));
      tradeHouseState.dealVolumeKg = n;
      persistTradeHouseState();
      renderAll();
    }

    function onDealTierSelect(tier) {
      triggerHaptic(12);
      tradeHouseState.dealPriceTier = tier;
      persistTradeHouseState();
      renderAll();
    }

    function onDealDiscountInput(val) {
      const n = Math.max(0, Math.min(15, parseInt(val, 10) || 0));
      tradeHouseState.dealDiscountPct = n;
      persistTradeHouseState();
      renderAll();
    }

    function sendWhatsAppDealQuote() {
      triggerHaptic(20);
      const th = tradeHouseState;
      const spKey = th.dealSpeciesKey || "BREAM";
      const item = tubaWarehouse[spKey] || tubaWarehouse.BREAM;
      const kg = th.dealVolumeKg || 150;
      let tierName = "Опт (от 100 кг)";
      let basePrice = item.wholesalePrice;
      if (th.dealPriceTier === "SEMI_WHOLESALE") {
        tierName = "Мелкий опт вакуум";
        basePrice = item.semiPrice;
      } else if (th.dealPriceTier === "RETAIL") {
        tierName = "Розница цеха";
        basePrice = item.retailPrice;
      }
      const disc = th.dealDiscountPct || 0;
      const pricePerKg = basePrice * (1 - disc / 100);
      const totalEur = kg * pricePerKg;
      const packsEst = Math.round(kg / 0.65);

      const text = 
`🐟 *РЫБОПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ ЮРМАЛЦИЕМС (ЛАТВИЯ)*\n` +
`📋 *Коммерческое предложение / Накладная сделки*\n` +
`---------------------------------------\n` +
`• Продукция: *${item.name}*\n` +
`• Категория цены: ${tierName}\n` +
`• Объем: *${kg} кг* (~ ${packsEst} вакуум-пакетов TUBA)\n` +
`• Базовая цена: ${basePrice.toFixed(2)} €/кг\n` +
(disc > 0 ? `• Согласованная скидка: ${disc}% (-${(basePrice * disc / 100).toFixed(2)} €/кг)\n` : "") +
`• Цена со скидкой: *${pricePerKg.toFixed(2)} €/кг*\n` +
`---------------------------------------\n` +
`💰 *ИТОГО К ОПЛАТЕ: ${totalEur.toFixed(2)} €*\n` +
`---------------------------------------\n` +
`Упаковка: Soft-Vac 95–96%, прутки SS304, контроль усушки и соли.\n` +
`Самовывоз: Цех Юрмалциемс / Доставка согласовывается.\n` +
`Дата формирования: ${new Date().toLocaleDateString("ru-RU")}`;

      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }

    function sendWhatsAppPriceList() {
      triggerHaptic(20);
      let text = 
`🐟 *ОФИЦИАЛЬНЫЙ ПРАЙС-ЛИСТ ГОТОВОЙ ПРОДУКЦИИ*\n` +
`*РЫБОПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ ЮРМАЛЦИЕМС (ЛАТВИЯ)*\n` +
`Сушильно-вялочный комплекс AIM AGHD-250ELC • Вакуум KOMET\n` +
`---------------------------------------\n`;
      
      for (const k in tubaWarehouse) {
        const item = tubaWarehouse[k];
        text += `• *${item.name}* (TUBA): ${item.wholesalePrice.toFixed(2)} €/кг (Опт) | ${item.semiPrice.toFixed(2)} €/кг (Розн)\n`;
      }
      
      text += 
`---------------------------------------\n` +
`Все позиции упакованы в Soft-Vac 95–96%, хранятся в климатическом складе TUBA.\n` +
`Партии от 100 кг обсуждаются индивидуально у лодки.\n` +
`Контакты: Цех Юрмалциемс • ${new Date().toLocaleDateString("ru-RU")}`;

      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }

    // ==================== RENDER OWNER SIMPLE VIEW (РЕЖИМ 1: ТОРГОВЫЙ ДОМ) ====================
    function renderOwnerSimpleView(t, species, stage, diag, yf) {
      const ownerContainer = document.getElementById("owner-simple-view");
      const engShell = document.getElementById("engineer-app-shell");
      const engActions = document.getElementById("engineer-top-actions");
      const btnOwner = document.getElementById("btn-mode-owner");
      const btnEng = document.getElementById("btn-mode-engineer");
      const topTitle = document.getElementById("top-bar-main-title");
      const topSub = document.getElementById("top-bar-main-sub");

      const isOwnerMode = state.uiMode === "OWNER";

      if (btnOwner && btnEng) {
        btnOwner.className = `mode-switch-btn ${isOwnerMode ? "active-owner" : ""}`;
        btnEng.className = `mode-switch-btn ${!isOwnerMode ? "active-engineer" : ""}`;
      }

      if (topTitle && topSub) {
        if (isOwnerMode) {
          topTitle.textContent = "💼 ТОРГОВЫЙ ДОМ • ЮРМАЛЦИЕМС (€)";
          topSub.textContent = "Закуп сырья у лодки, калькулятор партий, склад TUBA к лету и касса сделок";
        } else {
          topTitle.textContent = "🔬 ГЛАВНЫЙ ТЕХНОЛОГ • ЮРМАЛЦИЕМС";
          topSub.textContent = "AIM AGHD-250ELC • Cantoni 4×3кВт • SCADA, MCGS и Parkside";
        }
      }

      if (!ownerContainer || !engShell) return;

      if (!isOwnerMode) {
        ownerContainer.style.display = "none";
        engShell.style.display = "";
        if (engActions) engActions.style.display = "";
        return;
      }

      ownerContainer.style.display = "block";
      engShell.style.display = "none";
      if (engActions) engActions.style.display = "none";

      const th = tradeHouseState;
      const spDef = TRADE_SPECIES_DEFAULTS[th.speciesKey] || TRADE_SPECIES_DEFAULTS.BREAM;
      const fmt = TRADE_PACK_FORMATS[th.packageFormat] || TRADE_PACK_FORMATS.TUBA_PACK_4;

      // 1. Math for Tool 1
      const yieldPct = spDef.yieldPct;
      const dryBatchKg = th.rawBatchKg * (yieldPct / 100);
      const dryMeatCost = th.rawPricePerKg / (yieldPct / 100);
      const saltCost = th.rawBatchKg * 0.04 * 0.35;
      const powerCost = 96 * 7.5 * th.powerTariff;
      const isBulk = fmt.key === "BULK";
      const packsCount = Math.max(1, Math.round(dryBatchKg / fmt.packKg));
      const packsCost = isBulk ? (dryBatchKg * fmt.packCost) : (packsCount * fmt.packCost);
      const totalCost = (th.rawBatchKg * th.rawPricePerKg) + saltCost + powerCost + packsCost;
      const turnkeyPerKg = totalCost / dryBatchKg;
      const turnkeyPerPack = totalCost / packsCount;

      const currentProfit = (dryBatchKg * spDef.defaultWholesale) - totalCost;
      const bargainMinus10Extra = th.rawBatchKg * 0.10;
      const bargainMinus20Extra = th.rawBatchKg * 0.20;

      // 2. Math for Tool 2
      const incSp = th.incomingSpeciesKey || "BREAM";
      const incKg = th.incomingTonnageKg || 2000;
      const incCal = th.incomingCaliber || "LARGE";
      const incRaw = th.incomingRawType || "FRESH";
      const incFat = th.incomingFatRoe || "FAT_ROE";

      const isDefrost = incRaw === "DEFROST";
      const isMixCaliber = incCal === "MIX";
      const isFatRoeLarge = incFat === "FAT_ROE" && (incCal === "LARGE" || incCal === "MIX");

      let baseSaltingH = 48;
      if (incSp === "SMELT") baseSaltingH = 18;
      else if (incSp === "ROACH") baseSaltingH = 36;
      else if (incSp === "ROUND_GOBY") baseSaltingH = 24;
      const effectiveSaltingH = isDefrost ? (baseSaltingH * 0.80) : baseSaltingH;

      const yieldBonusPct = isFatRoeLarge ? 2.5 : 0;
      const incYieldPct = (TRADE_SPECIES_DEFAULTS[incSp] ? TRADE_SPECIES_DEFAULTS[incSp].yieldPct : 46) + yieldBonusPct;
      const expectedDryKg = Math.round(incKg * (incYieldPct / 100));

      // 3. Math for Tool 3 (Beacon)
      const beaconRaw = th.beaconRawGrams || 1800;
      const beaconCur = th.beaconCurrentGrams || 1260;
      const cutoffStage2 = Math.round(beaconRaw * 0.85);
      const cutoffStage4 = Math.round(beaconRaw * 0.60);
      const targetWeight = Math.round(beaconRaw * (incYieldPct / 100));
      const waterLostPct = Math.max(0, Math.min(100, ((beaconRaw - beaconCur) / beaconRaw) * 100));
      const waterRemGrams = Math.max(0, beaconCur - targetWeight);
      const hoursRemaining = Math.max(0, Math.round(waterRemGrams / (beaconRaw * 0.0065)));

      // 4. Math for Tool 4 (Sorting)
      const premKg = Math.round(dryBatchKg * th.sortPremPct / 100);
      const tubaKg = Math.round(dryBatchKg * th.sortTubaPct / 100);
      const bulkKg = Math.round(dryBatchKg * th.sortBulkPct / 100);

      const bulkQuickPrice = spDef.defaultWholesale * 0.85;
      const breakEvenKg = Math.min(dryBatchKg, Math.round(totalCost / bulkQuickPrice));
      const tubaPacks = Math.round(tubaKg / 0.60);
      const tubaBoxes = Math.ceil(tubaPacks / 40);
      const tubaRevenue = tubaKg * spDef.defaultWholesale;

      // 5. Math for Tool 5 (Warehouse & Deal)
      let whTotKg = 0, whTotPacks = 0, whTotEur = 0;
      for (const k in tubaWarehouse) {
        const item = tubaWarehouse[k];
        whTotKg += item.kg;
        whTotPacks += item.packs;
        whTotEur += item.kg * item.wholesalePrice;
      }

      const dealSp = th.dealSpeciesKey || "BREAM";
      const dealItem = tubaWarehouse[dealSp] || tubaWarehouse.BREAM;
      const dealKg = th.dealVolumeKg || 150;
      let dealBasePrice = dealItem.wholesalePrice;
      if (th.dealPriceTier === "SEMI_WHOLESALE") dealBasePrice = dealItem.semiPrice;
      if (th.dealPriceTier === "RETAIL") dealBasePrice = dealItem.retailPrice;

      const dealDiscPct = th.dealDiscountPct || 0;
      const dealUnitPrice = dealBasePrice * (1 - dealDiscPct / 100);
      const dealTotal = dealKg * dealUnitPrice;
      const dealCost = dealKg * turnkeyPerKg;
      const dealProfit = dealTotal - dealCost;
      const dealMargin = dealTotal > 0 ? ((dealProfit / dealTotal) * 100) : 0;

      ownerContainer.innerHTML = `
        <div class="trade-house-wrap">
          
          <!-- ==================== ИНСТРУМЕНТ 1: ПЕРЕГОВОРЩИК У ЛОДКИ ==================== -->
          <div class="trade-tool-card" style="border-color: #00E5FF;">
            <div class="trade-tool-head">
              <div class="trade-tool-title">
                <span>🤝</span> ИНСТРУМЕНТ 1: ПЕРЕГОВОРЩИК У ЛОДКИ
              </div>
              <span class="trade-tool-badge">Закуп сырья & Себестоимость</span>
            </div>

            <div style="font-size:12px; color:#94A3B8; margin-bottom:8px;">1. Выберите рыбу из 6 видов цеха:</div>
            <div class="trade-chip-bar">
              ${Object.keys(TRADE_SPECIES_DEFAULTS).map(k => {
                const s = TRADE_SPECIES_DEFAULTS[k];
                const active = k === th.speciesKey ? "active" : "";
                return `<button class="trade-chip ${active}" onclick="onTradeFishSelect('${k}')">🐟 ${s.shortName}</button>`;
              }).join("")}
            </div>

            <div class="trade-grid-2" style="margin-top:12px;">
              <div>
                <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Вес партии сырья (кг):</label>
                <div style="display:flex; gap:6px; margin:4px 0 10px 0;">
                  <input type="number" class="field-input" style="flex:1;" value="${th.rawBatchKg}" onchange="onTradeRawKgInput(this.value)"/>
                  <button class="trade-btn-sm" onclick="onTradeRawKgInput(1500)">1.5 т</button>
                  <button class="trade-btn-sm" onclick="onTradeRawKgInput(2000)">2.0 т</button>
                  <button class="trade-btn-sm" onclick="onTradeRawKgInput(2500)">2.5 т</button>
                </div>

                <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Цена рыбака за сырую рыбу (€/кг):</label>
                <div style="font-size:10.5px; font-weight:700; color:${spDef.rawStatus.includes('✅') ? '#2EE59D' : '#FFA726'}; margin:2px 0 4px 0;">${spDef.rawStatus}</div>
                <input type="number" step="0.05" class="field-input" style="width:100%; margin:0 0 10px 0;" value="${th.rawPricePerKg.toFixed(2)}" onchange="onTradeRawPriceInput(this.value)"/>

                <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Тариф электричества (€/кВт·ч):</label>
                <input type="number" step="0.01" class="field-input" style="width:100%; margin:4px 0 10px 0;" value="${th.powerTariff.toFixed(2)}" onchange="onTradeTariffInput(this.value)"/>

                <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Формат фасовки:</label>
                <div class="trade-chip-bar">
                  ${Object.keys(TRADE_PACK_FORMATS).map(fk => {
                    const f = TRADE_PACK_FORMATS[fk];
                    const act = fk === th.packageFormat ? "active" : "";
                    return `<button class="trade-chip ${act}" onclick="onTradeFormatSelect('${fk}')">${f.label}</button>`;
                  }).join("")}
                </div>
              </div>

              <!-- ВЫХЛОП И СЕБЕСТОИМОСТЬ ПОД КЛЮЧ -->
              <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="trade-kpi-card" style="border-color:#FFD166;">
                  <div style="font-size:12px; color:#FFD166; font-weight:800; text-transform:uppercase;">🥩 Истинная стоимость 1 кг сухого мяса:</div>
                  <div class="trade-kpi-val">${dryMeatCost.toFixed(2)} €/кг</div>
                  <div class="trade-kpi-sub">
                    Из 1 кг сырой рыбы после усушки ${100 - yieldPct}% выходит всего ${yieldPct * 10} г продукта (чистое сырье).
                  </div>
                </div>

                <div class="trade-kpi-card" style="border-color:#2EE59D;">
                  <div style="font-size:12px; color:#2EE59D; font-weight:800; text-transform:uppercase;">🏁 Полная себестоимость "под ключ":</div>
                  <div style="display:flex; justify-content:space-between; align-items:baseline;">
                    <span class="trade-kpi-val" style="color:#2EE59D;">${turnkeyPerKg.toFixed(2)} €/кг</span>
                    ${!isBulk ? `<span style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#38BDF8;">${turnkeyPerPack.toFixed(2)} €/пак</span>` : ""}
                  </div>
                  <div class="trade-kpi-sub" style="margin-top:4px;">
                    Сырье: ${(th.rawBatchKg * th.rawPricePerKg).toFixed(0)}€ • Соль: ${saltCost.toFixed(0)}€ • Свет камеры (96ч): ${powerCost.toFixed(0)}€ • Упаковка: ${packsCost.toFixed(0)}€<br>
                    Итого затрат на партию: <b>${totalCost.toFixed(2)} €</b> | Выход: <b>${dryBatchKg.toFixed(0)} кг</b> (${packsCount} пач.)
                  </div>
                </div>

                <!-- ТАБЛИЦА ТОРГА С РЫБАКОМ -->
                <div style="background:#030814; border:1px solid rgba(0,229,255,0.3); border-radius:12px; padding:10px;">
                  <div style="font-size:11px; color:#00E5FF; font-weight:800; text-transform:uppercase; margin-bottom:6px;">
                    🎣 Переговорный рычаг торга у лодки:
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="font-size:12px;">Текущая (${th.rawPricePerKg.toFixed(2)} €/кг):</span>
                    <span style="font-family:var(--font-mono); font-weight:700; color:#CBD5E1;">Прибыль: +${currentProfit.toFixed(0)} €</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="font-size:12px; color:#2EE59D;">Сторговать на <b>-0.10 €/кг</b>:</span>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-family:var(--font-mono); font-weight:800; color:#2EE59D;">+${bargainMinus10Extra.toFixed(0)} € в карман</span>
                      <button class="trade-btn-sm" onclick="onTradeApplyBargain(-0.10)">Жми -0.10</button>
                    </div>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0;">
                    <span style="font-size:12px; color:#FFD166;">Сторговать на <b>-0.20 €/кг</b>:</span>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-family:var(--font-mono); font-weight:800; color:#FFD166;">+${bargainMinus20Extra.toFixed(0)} € в карман</span>
                      <button class="trade-btn-sm" onclick="onTradeApplyBargain(-0.20)">Жми -0.20</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== ИНСТРУМЕНТ 2: УМНЫЙ КОНСТРУКТОР ВХОДЯЩЕЙ ПАРТИИ ==================== -->
          <div class="trade-tool-card" style="border-color: #2EE59D;">
            <div class="trade-tool-head">
              <div class="trade-tool-title">
                <span>🐟</span> ИНСТРУМЕНТ 2: УМНЫЙ КОНСТРУКТОР ВХОДЯЩЕЙ ПАРТИИ
              </div>
              <span class="trade-tool-badge" style="border-color:#2EE59D; color:#2EE59D;">5 параметров ➔ Задача и Выхлоп</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <div>
                <div style="font-size:12px; color:#94A3B8;">1) Рыба:</div>
                <div class="trade-chip-bar">
                  ${Object.keys(TRADE_SPECIES_DEFAULTS).map(k => {
                    const s = TRADE_SPECIES_DEFAULTS[k];
                    const act = k === incSp ? "active" : "";
                    return `<button class="trade-chip ${act}" onclick="onIncomingFishSelect('${k}')">🐟 ${s.shortName}</button>`;
                  }).join("")}
                </div>
              </div>

              <div>
                <div style="font-size:12px; color:#94A3B8;">2) Тоннаж партии:</div>
                <div class="trade-chip-bar">
                  ${[1000, 1500, 2000, 2500, 3000].map(kg => {
                    const act = kg === incKg ? "active" : "";
                    return `<button class="trade-chip ${act}" onclick="onIncomingTonnageInput(${kg})">${(kg/1000).toFixed(1)} т (${kg} кг)</button>`;
                  }).join("")}
                </div>
              </div>

              <div>
                <div style="font-size:12px; color:#94A3B8;">3) Калибр:</div>
                <div class="trade-chip-bar">
                  <button class="trade-chip ${incCal === 'SMALL' ? 'active' : ''}" onclick="onIncomingCaliberSelect('SMALL')">Мелкая (18–22 см)</button>
                  <button class="trade-chip ${incCal === 'MEDIUM' ? 'active' : ''}" onclick="onIncomingCaliberSelect('MEDIUM')">Средняя (23–27 см)</button>
                  <button class="trade-chip ${incCal === 'LARGE' ? 'active' : ''}" onclick="onIncomingCaliberSelect('LARGE')">Крупная (28–30+ см)</button>
                  <button class="trade-chip ${incCal === 'MIX' ? 'active' : ''}" onclick="onIncomingCaliberSelect('MIX')">🔀 Разнокалиберная-Микс</button>
                </div>
              </div>

              <div>
                <div style="font-size:12px; color:#94A3B8;">4) Состояние сырья:</div>
                <div class="trade-chip-bar">
                  <button class="trade-chip ${incRaw === 'FRESH' ? 'active' : ''}" onclick="onIncomingRawTypeSelect('FRESH')">Свежая с лодки</button>
                  <button class="trade-chip ${incRaw === 'CHILLED' ? 'active' : ''}" onclick="onIncomingRawTypeSelect('CHILLED')">Охлажденка</button>
                  <button class="trade-chip ${incRaw === 'DEFROST' ? 'active' : ''}" onclick="onIncomingRawTypeSelect('DEFROST')">❄️ Разморозка из брикета</button>
                </div>
              </div>

              <div>
                <div style="font-size:12px; color:#94A3B8;">5) Жирность и Икра:</div>
                <div class="trade-chip-bar">
                  <button class="trade-chip ${incFat === 'LEAN' ? 'active' : ''}" onclick="onIncomingFatRoeSelect('LEAN')">Постная</button>
                  <button class="trade-chip ${incFat === 'FAT_ROE' ? 'active' : ''}" onclick="onIncomingFatRoeSelect('FAT_ROE')">Жирная + С икрой</button>
                  <button class="trade-chip ${incFat === 'NO_ROE' ? 'active' : ''}" onclick="onIncomingFatRoeSelect('NO_ROE')">Без икры</button>
                </div>
              </div>

              <!-- АВТОМАТИЧЕСКИЕ ПРАВИЛА ПЕРЕСЧЕТА -->
              <div style="background:#020610; border:1.5px solid #2EE59D; border-radius:12px; padding:12px; margin-top:6px;">
                <div style="font-size:13px; font-weight:800; color:#2EE59D; margin-bottom:6px;">
                  📋 АВТОМАТИЧЕСКИЙ РЕЗУЛЬТАТ КОНСТРУКТОРА:
                </div>
                <div style="font-size:12.5px; line-height:1.4; color:#E2E8F0;">
                  • Ожидаемый выход готовой рыбы: <b>${expectedDryKg} кг</b> (выход ${incYieldPct.toFixed(1)}%)<br>
                  • Время просола в тузлуке: <b>${effectiveSaltingH.toFixed(1)} ч</b> 
                  ${isDefrost ? '<span style="color:#FFA726;">(⚡ сокращено на -20% из-за раскрытой клетки разморозки!)</span>' : ''}<br>
                  ${isMixCaliber ? `
                    <div style="margin-top:6px; padding:8px; background:rgba(0,229,255,0.1); border-radius:8px; border:1px solid #00E5FF;">
                      <b>🔀 Схема расселения 15 тележек камеры AIM-AGHD-250ELC:</b><br>
                      - Ряды 1–2 (Тележки 1–6): Крупная рыба (28–30+ см) у сопел Cantoni 4×3кВт (обдув 2.0–2.2 м/с)<br>
                      - Ряд 3 (Тележки 7–10): Средний калибр<br>
                      - Ряды 4–5 (Тележки 11–15): Мелкая рыба у вытяжных сеток — <b>съем на 1 сутки (24 ч) раньше!</b>
                    </div>
                  ` : ''}
                  ${isFatRoeLarge ? `
                    <div style="margin-top:6px; padding:8px; background:rgba(255,167,38,0.12); border-radius:8px; border:1px solid #FFA726;">
                      <b>🛡️ Правила для Крупной Жирной Рыбы с Икрой:</b><br>
                      - Выход скорректирован: <b>+${yieldBonusPct}%</b><br>
                      - Посол строго холодный <b>+2..+4°C</b> (защита икры от скисания)<br>
                      - Навеска <b>за хвост</b> головой вниз (гарантированный слив сукровицы через жабры)<br>
                      - Старт Стадии 1: холодный <b>+12..+13.5°C</b> (защита от загара у кости)<br>
                      - Отволаживание в камере: <b>36–48 ч</b> (выравнивание влажности в ястыках перед вакуумом)
                    </div>
                  ` : ''}
                </div>

                <details class="spoil-wrap" style="margin-top:10px;">
                  <summary class="spoil-sum">▶ Открыть 8 фаз MCGS под эту партию</summary>
                  <div class="spoil-content">
                    <div class="trade-table-wrap">
                      <table class="trade-table">
                        <thead>
                          <tr><th>Фаза</th><th>Название</th><th>Т °C</th><th>RH %</th><th>Cantoni Гц</th><th>Время</th><th>Режим</th></tr>
                        </thead>
                        <tbody>
                          <tr><td>Ф1</td><td>Осадка и обдув</td><td>+13.0°C</td><td>62%</td><td>32.0 Гц</td><td>12 ч</td><td>Вентиляция</td></tr>
                          <tr><td>Ф2</td><td>Съем верховой влаги</td><td>+14.5°C</td><td>58%</td><td>30.0 Гц</td><td>18 ч</td><td>Осушение</td></tr>
                          <tr><td>Ф3</td><td>Вытяжка из мышцы</td><td>+15.5°C</td><td>55%</td><td>28.0 Гц</td><td>24 ч</td><td>Осушение</td></tr>
                          <tr><td>Ф4</td><td>Глубокая сушка хребта</td><td>+16.0°C</td><td>52%</td><td>25.0 Гц</td><td>20 ч</td><td>Осушение</td></tr>
                          <tr><td>Ф5</td><td>Пауза перетока влаги</td><td>+14.0°C</td><td>65%</td><td>15.0 Гц</td><td>6 ч</td><td>Пауза закрытый</td></tr>
                          <tr><td>Ф6</td><td>Дожим спинки</td><td>+15.0°C</td><td>50%</td><td>26.0 Гц</td><td>16 ч</td><td>Осушение</td></tr>
                          <tr><td>Ф7</td><td>Отволаживание икры</td><td>+13.5°C</td><td>60%</td><td>18.0 Гц</td><td>36 ч</td><td>Климат отдых</td></tr>
                          <tr><td>Ф8</td><td>Охлаждение под KOMET</td><td>+12.0°C</td><td>55%</td><td>20.0 Гц</td><td>6 ч</td><td>Финиш вакуум</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <!-- ==================== ИНСТРУМЕНТ 3: КОНТРОЛЬНАЯ СВЯЗКА-МАЯК ==================== -->
          <div class="trade-tool-card" style="border-color: #FFD166;">
            <div class="trade-tool-head">
              <div class="trade-tool-title">
                <span>⚖️</span> ИНСТРУМЕНТ 3: КОНТРОЛЬНАЯ СВЯЗКА-МАЯК
              </div>
              <span class="trade-tool-badge" style="border-color:#FFD166; color:#FFD166;">Точный час готовности по весам</span>
            </div>

            <div class="trade-grid-2">
              <div>
                <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Сырой вес связки из 5 рыб при навеске (г):</label>
                <input type="number" class="field-input" style="width:100%; margin:4px 0 10px 0;" value="${beaconRaw}" onchange="onBeaconRawInput(this.value)"/>

                <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Текущий вес этой связки при контроле (г):</label>
                <input type="number" class="field-input" style="width:100%; margin:4px 0 10px 0;" value="${beaconCur}" onchange="onBeaconCurrentInput(this.value)"/>

                <!-- ШКАЛА СНЯТИЯ ВЛАГИ -->
                <div style="margin-top:10px;">
                  <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#CBD5E1;">
                    <span>Снято влаги:</span>
                    <span style="color:#00E5FF; font-family:var(--font-mono);">${waterLostPct.toFixed(1)}%</span>
                  </div>
                  <div style="height:12px; border-radius:6px; background:#0B1626; border:1px solid #1E293B; overflow:hidden; margin:4px 0;">
                    <div style="height:100%; width:${waterLostPct}%; background:linear-gradient(90deg, #38BDF8, #2EE59D); border-radius:6px;"></div>
                  </div>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="background:#020713; border:1px solid #FFD166; border-radius:12px; padding:10px;">
                  <div style="font-size:11px; color:#FFD166; font-weight:800; text-transform:uppercase;">🎯 ТОЧНЫЕ ВЕСОВЫЕ ОТСЕЧКИ ДЛЯ ЭТОЙ СВЯЗКИ:</div>
                  <div style="font-size:12px; color:#F1F5F9; line-height:1.6; margin-top:4px;">
                    • Переход на Стадию 2 (-15% влаги): <b>${cutoffStage2} г</b><br>
                    • Переход на Отволаживание (-40% влаги): <b>${cutoffStage4} г</b><br>
                    • 🏆 Готовность под вакуум KOMET (выход ${incYieldPct}%): <b style="color:#2EE59D; font-size:14px;">${targetWeight} г</b>
                  </div>
                </div>

                <div class="trade-kpi-card" style="border-color:#38BDF8;">
                  <div style="font-size:11px; color:#38BDF8; font-weight:800; text-transform:uppercase;">⏳ ОСТАЛОСЬ ДО ВЫГРУЗКИ:</div>
                  <div class="trade-kpi-val" style="color:#38BDF8;">~${hoursRemaining} ч</div>
                  <div class="trade-kpi-sub">
                    Осталось сбросить: <b>${waterRemGrams} г</b> влаги при темпе сушки камеры ~0.65%/ч.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== ИНСТРУМЕНТ 4: ФИНАНСОВЫЙ СОРТИРОВЩИК ==================== -->
          <div class="trade-tool-card" style="border-color: #A78BFA;">
            <div class="trade-tool-head">
              <div class="trade-tool-title">
                <span>📦</span> ИНСТРУМЕНТ 4: ФИНАНСОВЫЙ СОРТИРОВЩИК ВЫШЕДШЕЙ ПАРТИИ
              </div>
              <span class="trade-tool-badge" style="border-color:#A78BFA; color:#A78BFA;">Отбить затраты ➔ TUBA к лету</span>
            </div>

            <div style="font-size:12px; color:#CBD5E1; margin-bottom:10px;">
              Распределите готовую партию (${dryBatchKg.toFixed(0)} кг) по 3 каналам реализации:
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#FFD166;">
                  <span>👑 Отборная в Премиум-вакуум по 1 шт:</span>
                  <b>${th.sortPremPct}% (${premKg} кг)</b>
                </div>
                <input type="range" min="0" max="100" value="${th.sortPremPct}" oninput="onSortSliderInput('prem', this.value)" style="width:100%;"/>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#00E5FF;">
                  <span>🟦 Стандарт в вакуум по 3–4 шт в TUBA к лету:</span>
                  <b>${th.sortTubaPct}% (${tubaKg} кг)</b>
                </div>
                <input type="range" min="0" max="100" value="${th.sortTubaPct}" oninput="onSortSliderInput('tuba', this.value)" style="width:100%;"/>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#CBD5E1;">
                  <span>📦 Мелкая / Развес на быструю продажу (слив сразу):</span>
                  <b>${th.sortBulkPct}% (${bulkKg} кг)</b>
                </div>
                <input type="range" min="0" max="100" value="${th.sortBulkPct}" oninput="onSortSliderInput('bulk', this.value)" style="width:100%;"/>
              </div>
            </div>

            <div class="trade-grid-2" style="margin-top:14px;">
              <div class="trade-kpi-card" style="border-color:#2EE59D;">
                <div style="font-size:11px; color:#2EE59D; font-weight:800; text-transform:uppercase;">🎯 ТОЧКА БЕЗУБЫТОЧНОСТИ (BREAK-EVEN):</div>
                <div class="trade-kpi-val" style="color:#2EE59D;">${breakEvenKg} кг</div>
                <div class="trade-kpi-sub">
                  Достаточно продать первые <b>${breakEvenKg} кг</b> по быстрой оптовой цене (${bulkQuickPrice.toFixed(2)} €), чтобы на 100% вернуть в кассу <b>${totalCost.toFixed(2)} €</b> (закуп рыбы, соль и свет камеры)!
                </div>
              </div>

              <div class="trade-kpi-card" style="border-color:#FFD166;">
                <div style="font-size:11px; color:#FFD166; font-weight:800; text-transform:uppercase;">🏖️ ЗОЛОТОЙ ЗАПАС В КОНТЕЙНЕРАХ TUBA К ЛЕТУ:</div>
                <div class="trade-kpi-val" style="color:#FFD166;">+${tubaRevenue.toFixed(0)} €</div>
                <div class="trade-kpi-sub">
                  Ложится на склад: <b>${tubaPacks} вакуум-пакетов</b> в <b>${tubaBoxes} синих контейнерах TUBA</b> (по 40 пач.). Чистый капитал к курортному сезону!
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== ИНСТРУМЕНТ 5: СКЛАД TUBA И КАССА СДЕЛОК ==================== -->
          <div class="trade-tool-card" style="border-color: #38BDF8;">
            <div class="trade-tool-head">
              <div class="trade-tool-title">
                <span>🌊</span> ИНСТРУМЕНТ 5: СКЛАД КОНТЕЙНЕРОВ TUBA К ЛЕТУ И КАССА СДЕЛОК
              </div>
              <span class="trade-tool-badge" style="border-color:#38BDF8; color:#38BDF8;">Склад готовой продукции & Касса</span>
            </div>

            <!-- ЖИВАЯ ТАБЛИЦА СКЛАДА ПО ВСЕМ 6 РЫБАМ -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:12px; font-weight:700; color:#FFFFFF;">Живые складские остатки TUBA (сохраняются в памяти):</span>
              <button class="trade-btn-sm" onclick="sendWhatsAppPriceList()" title="Отправить оптовый прайс в WhatsApp">📲 Весь Прайс в WA</button>
            </div>

            <div class="trade-table-wrap">
              <table class="trade-table">
                <thead>
                  <tr>
                    <th>Рыба</th>
                    <th>Остаток TUBA</th>
                    <th>Контейнеров (~40п)</th>
                    <th>Цена опт (€)</th>
                    <th>Сумма (€)</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(tubaWarehouse).map(k => {
                    const item = tubaWarehouse[k];
                    const boxes = Math.ceil(item.packs / 40);
                    const sumEur = item.kg * item.wholesalePrice;
                    return `
                      <tr>
                        <td><b>${item.name}</b></td>
                        <td>${item.packs} пач. (${item.kg} кг)</td>
                        <td>${boxes} кор.</td>
                        <td>${item.wholesalePrice.toFixed(2)} €</td>
                        <td style="color:#FFD166; font-weight:700;">${sumEur.toFixed(0)} €</td>
                        <td>
                          <div style="display:flex; gap:4px;">
                            <button class="trade-btn-sm" style="background:#2EE59D; color:#000;" onclick="onWarehouseAdjust('${k}', 10)">+10</button>
                            <button class="trade-btn-sm" style="background:#FF5252; color:#fff;" onclick="onWarehouseAdjust('${k}', -10)">-10</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                  <tr style="background:#040e1c; font-weight:800; border-top:2px solid #00E5FF;">
                    <td>ИТОГО СКЛАД:</td>
                    <td>${whTotPacks} пач. (${whTotKg} кг)</td>
                    <td>${Math.ceil(whTotPacks / 40)} кор.</td>
                    <td>—</td>
                    <td style="color:#2EE59D; font-size:14px;">${whTotEur.toFixed(2)} €</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- КАССА СДЕЛКИ И ТОРГА С ПОКУПАТЕЛЕМ -->
            <div style="background:#020612; border:1px solid #38BDF8; border-radius:14px; padding:12px; margin-top:12px;">
              <div style="font-size:13px; font-weight:800; color:#38BDF8; margin-bottom:10px;">
                💳 КАССА СДЕЛКИ И КАЛЬКУЛЯТОР ТОЧНОГО СЧЕТА ПОКУПАТЕЛЮ:
              </div>

              <div class="trade-grid-2">
                <div>
                  <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Позиция со склада:</label>
                  <div class="trade-chip-bar">
                    ${Object.keys(tubaWarehouse).map(k => {
                      const item = tubaWarehouse[k];
                      const act = k === dealSp ? "active" : "";
                      return `<button class="trade-chip ${act}" onclick="onDealSpeciesSelect('${k}')">${item.name}</button>`;
                    }).join("")}
                  </div>

                  <label style="font-size:12px; color:#CBD5E1; font-weight:700; margin-top:8px; display:block;">Объем сделки (кг):</label>
                  <div style="display:flex; gap:6px; margin:4px 0;">
                    <input type="number" class="field-input" style="flex:1;" value="${dealKg}" onchange="onDealVolumeInput(this.value)"/>
                    <button class="trade-btn-sm" onclick="onDealVolumeInput(50)">50 кг</button>
                    <button class="trade-btn-sm" onclick="onDealVolumeInput(100)">100 кг</button>
                    <button class="trade-btn-sm" onclick="onDealVolumeInput(250)">250 кг</button>
                  </div>

                  <label style="font-size:12px; color:#CBD5E1; font-weight:700; margin-top:8px; display:block;">Ценовая категория:</label>
                  <div class="trade-chip-bar">
                    <button class="trade-chip ${th.dealPriceTier === 'WHOLESALE' ? 'active' : ''}" onclick="onDealTierSelect('WHOLESALE')">🏢 Опт (${dealItem.wholesalePrice.toFixed(2)}€)</button>
                    <button class="trade-chip ${th.dealPriceTier === 'SEMI_WHOLESALE' ? 'active' : ''}" onclick="onDealTierSelect('SEMI_WHOLESALE')">🏪 Мелкий опт (${dealItem.semiPrice.toFixed(2)}€)</button>
                    <button class="trade-chip ${th.dealPriceTier === 'RETAIL' ? 'active' : ''}" onclick="onDealTierSelect('RETAIL')">🛒 Розница (${dealItem.retailPrice.toFixed(2)}€)</button>
                  </div>
                  <div style="font-size:10.5px; font-weight:700; color:${(th.dealPriceTier === 'WHOLESALE' ? dealItem.wholesaleStatus : dealItem.vacuumStatus).includes('✅') ? '#2EE59D' : '#FFA726'}; margin-top:4px;">
                    Статус цены: ${th.dealPriceTier === 'WHOLESALE' ? dealItem.wholesaleStatus : dealItem.vacuumStatus}
                  </div>

                  <div style="margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; color:#FFD166; font-weight:700;">
                      <span>Скидка клиенту при торге:</span>
                      <span>${dealDiscPct}% (-${(dealBasePrice * dealDiscPct / 100).toFixed(2)} €/кг)</span>
                    </div>
                    <input type="range" min="0" max="15" step="1" value="${dealDiscPct}" oninput="onDealDiscountInput(this.value)" style="width:100%; margin-top:4px;"/>
                  </div>
                </div>

                <!-- ВЫХЛОП КАССЫ СДЕЛКИ -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div class="trade-kpi-card" style="border-color:#2EE59D;">
                    <div style="font-size:11px; color:#2EE59D; font-weight:800; text-transform:uppercase;">💶 СУММА СЧЕТА ДЛЯ КЛИЕНТА:</div>
                    <div class="trade-kpi-val" style="color:#2EE59D;">${dealTotal.toFixed(2)} €</div>
                    <div class="trade-kpi-sub">
                      Цена со скидкой: <b>${dealUnitPrice.toFixed(2)} €/кг</b> за объем ${dealKg} кг (~ ${Math.round(dealKg / 0.65)} пач.).
                    </div>
                  </div>

                  <div class="trade-kpi-card" style="border-color:#FFD166;">
                    <div style="font-size:11px; color:#FFD166; font-weight:800; text-transform:uppercase;">💰 ЧИСТАЯ ПРИБЫЛЬ В КАРМАН:</div>
                    <div style="display:flex; justify-content:space-between; align-items:baseline;">
                      <span class="trade-kpi-val" style="color:#FFD166;">+${dealProfit.toFixed(2)} €</span>
                      <span style="font-family:var(--font-mono); font-size:16px; font-weight:800; color:#38BDF8;">Рентабельность ${dealMargin.toFixed(1)}%</span>
                    </div>
                    <div class="trade-kpi-sub">
                      Себестоимость отгружаемого объема: ${dealCost.toFixed(2)} € (сырье, соль, свет камеры, пакеты).
                    </div>
                  </div>

                  <button class="trade-btn-wa" onclick="sendWhatsAppDealQuote()">
                    <span>📲</span> Отправить Счет / Накладную в WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      `;
    }


    

    // ==================== 5 ГЛАВНЫХ ТЕХНОЛОГИЧЕСКИХ МОДУЛЕЙ (РЕЖИМ "ГЛАВНЫЙ ТЕХНОЛОГ") ====================
    const STORAGE_KEY_CHIEF_TECH = "JURMALCIEMS_CHIEF_TECH_V2";

    const TECH_SPECIES_DATA = {
      ROACH: {
        name: "Плотва (икряная)",
        curedYield: { min: 56, max: 60, default: 58.0, soft: 60.0, dry: 50.0 },
        dryYield: { min: 48, max: 52, default: 50.0 },
        saltKgPerTon: 135,
        cartCapacityKg: 160,
        rodsPerCart: 32,
        fishPerRod: 18
      },
      VIMBA: {
        name: "Вимба (Рыбец)",
        curedYield: { min: 60, max: 63, default: 61.5, roeBonus: 1.0, soft: 63.5, dry: 54.5 },
        dryYield: { min: 53, max: 56, default: 54.5 },
        saltKgPerTon: 140,
        cartCapacityKg: 170,
        rodsPerCart: 30,
        fishPerRod: 15
      },
      BREAM: {
        name: "Лещ (крупный)",
        curedYield: { min: 58, max: 62, default: 60.0, largeBonus: 2.0, soft: 63.0, dry: 52.5 },
        dryYield: { min: 51, max: 54, default: 52.5 },
        saltKgPerTon: 160,
        cartCapacityKg: 185,
        rodsPerCart: 20,
        fishPerRod: 10
      },
      SMELT: {
        name: "Корюшка балтийская",
        curedYield: { min: 50, max: 54, default: 52.0, roeBonus: 2.0, soft: 54.0, dry: 44.0 },
        dryYield: { min: 42, max: 46, default: 44.0 },
        saltKgPerTon: 105,
        cartCapacityKg: 125,
        rodsPerCart: 25,
        fishPerRod: 30
      },
      PERCH: {
        name: "Окунь речной",
        curedYield: { min: 54, max: 58, default: 56.0, soft: 58.0, dry: 48.5 },
        dryYield: { min: 47, max: 50, default: 48.5 },
        saltKgPerTon: 145,
        cartCapacityKg: 160,
        rodsPerCart: 26,
        fishPerRod: 16
      },
      ROUND_GOBY: {
        name: "Бычок кругляк",
        curedYield: { min: 50, max: 55, default: 52.5, soft: 55.0, dry: 44.5 },
        dryYield: { min: 43, max: 46, default: 44.5 },
        saltKgPerTon: 120,
        cartCapacityKg: 200,
        rodsPerCart: 25,
        fishPerRod: 20
      }
    };

    let chiefTechState = {
      activeModule: 1, // 1..5
      // Module 1
      speciesKey: "BREAM",
      rawKg: 2000,
      caliber: "LARGE", // SMALL, MEDIUM, LARGE
      curingTarget: "CLASSIC", // SOFT, CLASSIC, DRY
      // Module 2
      scheduleMode: "FORWARD", // FORWARD, BACKWARD
      startDateTime: new Date().toISOString().slice(0, 16),
      workersCount: 3,
      isFrozenRaw: false,
      // Module 3
      showRotations: false,
      // Module 4
      tempAirC: 15.5,
      tempSkinC: 14.2,
      cutBone: "AMBER", // AMBER, SOFT, WHITE_RAW
      cutEdge: "ELASTIC", // ELASTIC, HARD_CRUST
      cutRoe: "SOLID", // SOLID, WET_CORE, NONE
      cutFluid: "CLEAN", // CLEAN, RUNNY_FAT, DARK_BLOOD
      // Module 5
      vDown: -0.85,
      vUp: 0.40,
      graphZoom: "ALL", // ALL, 12H, 4H
      hoverPointIdx: -1
    };

    function loadChiefTechPersistence() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CHIEF_TECH);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            chiefTechState = { ...chiefTechState, ...parsed };
          }
        }
      } catch (e) {}
    }

    function persistChiefTechState() {
      try {
        localStorage.setItem(STORAGE_KEY_CHIEF_TECH, JSON.stringify(chiefTechState));
      } catch (e) {}
    }

    function selectTechModule(idx) {
      triggerHaptic(12);
      chiefTechState.activeModule = idx;
      persistChiefTechState();
      renderAll();
    }

    // Module 1 handlers
    function onTechFishSelect(key) {
      syncActiveBatch("tech", key, chiefTechState.rawKg);
      triggerHaptic(12);
      chiefTechState.speciesKey = key;
      persistChiefTechState();
      renderAll();
    }

    function onTechRawKgInput(val) {
      syncActiveBatch("tech", null, val);
      const n = Math.max(50, Math.min(10000, parseFloat(val) || 0));
      chiefTechState.rawKg = n;
      persistChiefTechState();
      renderAll();
    }

    function onTechCaliberSelect(cal) {
      triggerHaptic(12);
      chiefTechState.caliber = cal;
      persistChiefTechState();
      renderAll();
    }

    function onTechTargetSelect(target) {
      triggerHaptic(12);
      chiefTechState.curingTarget = target;
      persistChiefTechState();
      renderAll();
    }

    // Module 2 handlers
    function onTechScheduleMode(mode) {
      triggerHaptic(12);
      chiefTechState.scheduleMode = mode;
      persistChiefTechState();
      renderAll();
    }

    function onTechStartDateTime(val) {
      chiefTechState.startDateTime = val;
      persistChiefTechState();
      renderAll();
    }

    function onTechWorkersCount(val) {
      const n = Math.max(1, Math.min(8, parseInt(val, 10) || 1));
      chiefTechState.workersCount = n;
      persistChiefTechState();
      renderAll();
    }

    function onTechFrozenToggle(checked) {
      triggerHaptic(12);
      chiefTechState.isFrozenRaw = Boolean(checked);
      persistChiefTechState();
      renderAll();
    }

    // Module 3 handlers
    function toggleTechRotations() {
      triggerHaptic(15);
      chiefTechState.showRotations = !chiefTechState.showRotations;
      persistChiefTechState();
      renderAll();
    }

    // Module 4 handlers
    function onTechTempAir(val) {
      chiefTechState.tempAirC = parseFloat(val) || 15.0;
      persistChiefTechState();
      renderAll();
    }

    function onTechTempSkin(val) {
      chiefTechState.tempSkinC = parseFloat(val) || 14.0;
      persistChiefTechState();
      renderAll();
    }

    function onTechCutSelect(field, val) {
      triggerHaptic(12);
      chiefTechState[field] = val;
      persistChiefTechState();
      renderAll();
    }

    // Module 5 handlers
    function onTechVDownInput(val) {
      chiefTechState.vDown = parseFloat(val) || -0.85;
      persistChiefTechState();
      renderAll();
    }

    function onTechVUpInput(val) {
      chiefTechState.vUp = parseFloat(val) || 0.40;
      persistChiefTechState();
      renderAll();
    }

    function onTechGraphZoom(zoom) {
      triggerHaptic(12);
      chiefTechState.graphZoom = zoom;
      persistChiefTechState();
      renderAll();
    }

    function onTechGraphHover(idx) {
      chiefTechState.hoverPointIdx = idx;
      const el = document.getElementById("tech-graph-crosshair-data");
      if (el && idx >= 0 && TECH_DEMO_POINTS[idx]) {
        const pt = TECH_DEMO_POINTS[idx];
        el.innerHTML = `Время: ${pt.t} | RH: ${pt.rh}% | Т испарителя: ${pt.temp}°C | Слив в трап: ${pt.rate} л/ч`;
      }
    }

    // Synthetic demo points for Module 5 graph (60 points)
    const TECH_DEMO_POINTS = (function() {
      const pts = [];
      let baseRh = 78.0;
      let temp = 14.5;
      for (let i = 0; i < 60; i++) {
        const h = Math.floor(i * 1.5);
        const cycle = i % 4; // 0,1,2 dry, 3 pause
        if (cycle === 3) {
          baseRh = Math.min(82, baseRh + 2.8);
          temp += 0.3;
        } else {
          baseRh = Math.max(48, baseRh - 1.1);
          temp = 14.2 + (i % 3) * 0.4;
        }
        const rate = (cycle === 3 ? 0.4 : 3.8 + (60 - i) * 0.08).toFixed(1);
        pts.push({
          idx: i,
          t: `${String(h % 24).padStart(2, "0")}:00 (День ${Math.floor(h/24)+1})`,
          rh: parseFloat(baseRh.toFixed(1)),
          temp: parseFloat(temp.toFixed(1)),
          rate: parseFloat(rate)
        });
      }
      return pts;
    })();

    // Main Renderer for the Chief Technologist Suite
    function renderChiefTechnologistSuite() {
      const ct = chiefTechState;
      const data = TECH_SPECIES_DATA[ct.speciesKey] || TECH_SPECIES_DATA.BREAM;

      // MODULE 1 MATH
      const rawKg = ct.rawKg || 2000;
      let targetYieldPct = data.curedYield.default;
      if (ct.curingTarget === "SOFT") targetYieldPct = data.curedYield.soft;
      else if (ct.curingTarget === "DRY") targetYieldPct = data.dryYield.default;

      if (ct.speciesKey === "BREAM" && ct.caliber === "LARGE" && ct.curingTarget !== "DRY") {
        targetYieldPct = Math.min(65, targetYieldPct + 1.5);
      }

      const readyKg = Math.round(rawKg * (targetYieldPct / 100));
      const readyCuredKg = Math.round(rawKg * (data.curedYield.default / 100));
      const readyDryKg = Math.round(rawKg * (data.dryYield.default / 100));
      const waterLiters = Math.max(0, rawKg - readyKg);
      const saltKg = Math.round(rawKg * (data.saltKgPerTon / 1000));
      const saltBags = Math.ceil(saltKg / 25);
      const cartsUsed = Math.min(15, Math.ceil(rawKg / data.cartCapacityKg));
      const kgPerCart = cartsUsed > 0 ? (rawKg / cartsUsed).toFixed(1) : 0;
      const rodsTotal = cartsUsed * data.rodsPerCart;
      const freeCarts = Math.max(0, 15 - cartsUsed);
      const freeCapacityKg = freeCarts * data.cartCapacityKg;

      // MODULE 2 MATH
      const workers = ct.workersCount || 3;
      const hangRate = workers * 95; // kg/h
      const packRate = workers * 80; // kg/h
      const hangHours = (rawKg / hangRate).toFixed(1);
      const packHours = (readyKg / packRate).toFixed(1);

      const startDate = new Date(ct.startDateTime || Date.now());
      const defrostEnd = new Date(startDate.getTime() + (ct.isFrozenRaw ? 24 : 0) * 3600000);
      const saltingEnd = new Date(defrostEnd.getTime() + 40 * 3600000); // 36h salting + 4h soak
      const hangingEnd = new Date(saltingEnd.getTime() + parseFloat(hangHours) * 3600000);
      const dryingEnd = new Date(hangingEnd.getTime() + 96 * 3600000); // 4 days drying
      const packingEnd = new Date(dryingEnd.getTime() + parseFloat(packHours) * 3600000);

      const fmtD = (d) => d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      // MODULE 4 MATH
      const deltaT = ct.tempAirC - ct.tempSkinC;
      let evapStatusHtml = "";
      if (deltaT >= 1.0) {
        evapStatusHtml = '<span style="color:#2EE59D; font-weight:800;">🟢 ПОРЫ ОТКРЫТЫ • АКТИВНОЕ ИСПАРЕНИЕ (Шкура охлаждается испарением)</span>';
      } else if (deltaT >= 0.4) {
        evapStatusHtml = '<span style="color:#FFD166; font-weight:800;">🟡 УМЕРЕННЫЙ ВЛАГОСЪЕМ (Норма Стадии 2–3)</span>';
      } else {
        evapStatusHtml = '<span style="color:#FF5252; font-weight:800;">🔴 ОПАСНОСТЬ: ЗАКРЫТИЕ ПОР ЗАКАЛОМ ИЛИ ЖИРОМ! (Испарение встало)</span>';
      }

      // Cut Inspector verdict
      const isPassCut = ct.cutBone === "AMBER" && ct.cutEdge === "ELASTIC" && ct.cutRoe !== "WET_CORE" && ct.cutFluid !== "DARK_BLOOD";
      const cutVerdictText = isPassCut 
        ? "✅ ДОПУЩЕНО В ВАКУУМ KOMET (Срез рубиновый, закала нет, икра стабильна)" 
        : "⛔ СТОП: В ВАКУУМ НЕЛЬЗЯ! Требуется доохлаждение в закрытой камере (+9..+11°C) или досушка спинки.";
      const vacPercent = (ct.curingTarget === "DRY") ? "98% (Жесткий вакуум)" : "94–95% Soft-Vac (Защита ястыков икры и шва от жира)";

      // MODULE 5 MATH
      const flowRateLh = ((Math.abs(ct.vDown) * 0.75 + ct.vUp * 0.25) * (rawKg / 1000) * 8.5).toFixed(1);
      const drainedLiters = Math.round(waterLiters * 0.65);
      const remainingWaterL = Math.max(0, waterLiters - drainedLiters);

      // Graph filter points
      let pts = TECH_DEMO_POINTS;
      if (ct.graphZoom === "12H") pts = pts.slice(-16);
      else if (ct.graphZoom === "4H") pts = pts.slice(-8);

      return `
        <div class="tech-suite-card">
          <div class="tech-suite-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:22px;">🔬</span>
              <div>
                <div style="font-family:var(--font-display); font-size:15px; font-weight:800; color:#FFFFFF;">
                  5 ГЛАВНЫХ ТЕХНОЛОГИЧЕСКИХ МОДУЛЕЙ • ЮРМАЛЦИЕМС
                </div>
                <div style="font-size:11px; color:#94A3B8;">
                  AIM AGHD-250ELC • Cantoni 4×3кВт • Прямой слив в трап (60 см от пола)
                </div>
              </div>
            </div>
            <span class="pill-btn pill-cyan" style="font-size:11px; cursor:default;">Стандарты цеха</span>
          </div>

          <!-- 5 КНОПОК ПЕРЕКЛЮЧЕНИЯ МОДУЛЕЙ ПОД ПАЛЕЦ -->
          <div class="tech-suite-dock" id="tech-suite-nav">
            <button class="tech-nav-btn ${ct.activeModule === 1 ? 'active' : ''}" onclick="selectTechModule(1)">
              <span class="tech-nav-ico">🏆</span>
              <span class="tech-nav-txt">1. Супер-Расчетчик</span>
            </button>
            <button class="tech-nav-btn ${ct.activeModule === 2 ? 'active' : ''}" onclick="selectTechModule(2)">
              <span class="tech-nav-ico">📅</span>
              <span class="tech-nav-txt">2. Люди из коптилки</span>
            </button>
            <button class="tech-nav-btn ${ct.activeModule === 3 ? 'active' : ''}" onclick="selectTechModule(3)">
              <span class="tech-nav-ico">📐</span>
              <span class="tech-nav-txt">3. Шахматка 15 Трулей</span>
            </button>
            <button class="tech-nav-btn ${ct.activeModule === 4 ? 'active' : ''}" onclick="selectTechModule(4)">
              <span class="tech-nav-ico">🌡</span>
              <span class="tech-nav-txt">4. Физика & Разрез</span>
            </button>
            <button class="tech-nav-btn ${ct.activeModule === 5 ? 'active' : ''}" onclick="selectTechModule(5)">
              <span class="tech-nav-ico">💧</span>
              <span class="tech-nav-txt">5. Водомер Трапа & Зум</span>
            </button>
          </div>

          <!-- ==================== МОДУЛЬ 1: ЭТАЛОННЫЙ СУПЕР-РАСЧЕТЧИК ПАРТИИ ==================== -->
          ${ct.activeModule === 1 ? `
            <div class="trade-tool-card" style="border-color:#FFD166; margin-top:12px;">
              <div class="trade-tool-head">
                <div class="trade-tool-title">
                  <span>🏆</span> МОДУЛЬ 1: ЭТАЛОННЫЙ СУПЕР-РАСЧЕТЧИК ПАРТИИ
                </div>
                <span class="trade-tool-badge" style="border-color:#FFD166; color:#FFD166;">Вяленая vs Сухая • Вода • Соль • Трули • Прутки</span>
              </div>

              <div style="font-size:12px; color:#CBD5E1; margin-bottom:6px;">1. Выберите рыбу:</div>
              <div class="trade-chip-bar">
                ${Object.keys(TECH_SPECIES_DATA).map(k => {
                  const s = TECH_SPECIES_DATA[k];
                  const act = k === ct.speciesKey ? "active" : "";
                  return `<button class="trade-chip ${act}" onclick="onTechFishSelect('${k}')">🐟 ${s.name}</button>`;
                }).join("")}
              </div>

              <div class="trade-grid-2" style="margin-top:10px;">
                <div>
                  <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Вес партии сырья (кг):</label>
                  <div style="display:flex; gap:6px; margin:4px 0 10px 0;">
                    <input type="number" class="field-input" style="flex:1;" value="${rawKg}" onchange="onTechRawKgInput(this.value)"/>
                    <button class="trade-btn-sm" onclick="onTechRawKgInput(1000)">1.0 т</button>
                    <button class="trade-btn-sm" onclick="onTechRawKgInput(1500)">1.5 т</button>
                    <button class="trade-btn-sm" onclick="onTechRawKgInput(2000)">2.0 т</button>
                    <button class="trade-btn-sm" onclick="onTechRawKgInput(2500)">2.5 т</button>
                  </div>

                  <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Калибр рыбы:</label>
                  <div class="trade-chip-bar">
                    <button class="trade-chip ${ct.caliber === 'SMALL' ? 'active' : ''}" onclick="onTechCaliberSelect('SMALL')">Мелкая</button>
                    <button class="trade-chip ${ct.caliber === 'MEDIUM' ? 'active' : ''}" onclick="onTechCaliberSelect('MEDIUM')">Средняя</button>
                    <button class="trade-chip ${ct.caliber === 'LARGE' ? 'active' : ''}" onclick="onTechCaliberSelect('LARGE')">Крупная</button>
                  </div>

                  <label style="font-size:12px; color:#CBD5E1; font-weight:700; margin-top:8px; display:block;">Степень готовности:</label>
                  <div class="trade-chip-bar">
                    <button class="trade-chip ${ct.curingTarget === 'SOFT' ? 'active' : ''}" onclick="onTechTargetSelect('SOFT')">🍺 Мягкая вялка (развес)</button>
                    <button class="trade-chip ${ct.curingTarget === 'CLASSIC' ? 'active' : ''}" onclick="onTechTargetSelect('CLASSIC')">💎 Классика под вакуум</button>
                    <button class="trade-chip ${ct.curingTarget === 'DRY' ? 'active' : ''}" onclick="onTechTargetSelect('DRY')">🔥 Сухая (снек/звенит)</button>
                  </div>
                </div>

                <!-- ВЫХЛОП КАРТОЧЕК -->
                <div style="display:flex; flex-direction:column; gap:10px;">
                  <div class="trade-kpi-card" style="border-color:#2EE59D;">
                    <div style="font-size:11.5px; color:#2EE59D; font-weight:800; text-transform:uppercase;">⚖️ ВЫХОД ГОТОВОЙ ПРОДУКЦИИ:</div>
                    <div style="display:flex; justify-content:space-between; align-items:baseline;">
                      <span class="trade-kpi-val" style="color:#2EE59D;">${readyKg} кг</span>
                      <span style="font-family:var(--font-mono); font-size:16px; font-weight:800; color:#38BDF8;">${targetYieldPct}% выхода</span>
                    </div>
                    <div class="trade-kpi-sub" style="margin-top:4px;">
                      Вяленая (норма 61–63%): <b>${readyCuredKg} кг</b> | Сухая (53–56%): <b>${readyDryKg} кг</b><br>
                      💧 Осушитель сольет в трап испарителя: <b style="color:#00E5FF; font-size:13px;">${waterLiters} л воды</b>
                    </div>
                  </div>

                  <div class="trade-kpi-card" style="border-color:#FFD166;">
                    <div style="font-size:11.5px; color:#FFD166; font-weight:800; text-transform:uppercase;">🧂 РАСХОД СОЛИ НА ПАРТИЮ:</div>
                    <div class="trade-kpi-val" style="color:#FFD166;">${saltKg} кг соли</div>
                    <div class="trade-kpi-sub">
                      Норма посола ${data.saltKgPerTon} кг/т • Ровно <b>${saltBags} мешков</b> по 25 кг Экстра/№3.
                    </div>
                  </div>

                  <div class="trade-kpi-card" style="border-color:#00E5FF;">
                    <div style="font-size:11.5px; color:#00E5FF; font-weight:800; text-transform:uppercase;">🛒 ТРУЛИ (ТЕЛЕЖКИ) И ПРУТКИ SS304:</div>
                    <div style="display:flex; justify-content:space-between; align-items:baseline;">
                      <span class="trade-kpi-val" style="color:#00E5FF;">${cartsUsed} из 15 трулей</span>
                      <span style="font-family:var(--font-mono); font-size:14px; font-weight:800; color:#CBD5E1;">по ${kgPerCart} кг</span>
                    </div>
                    <div class="trade-kpi-sub" style="margin-top:4px;">
                      Прутков SS304 требуется: <b>${rodsTotal} шт</b> (${data.rodsPerCart} прут./труль по ${data.fishPerRod} шт рыбы).<br>
                      ${freeCarts > 0 
                        ? `<span style="color:#2EE59D; font-weight:700;">💡 В камере свободно ${freeCarts} трулей! Можно догрузить еще ${freeCapacityKg} кг рыбы!</span>`
                        : `<span style="color:#FFD166; font-weight:700;">Камера заполнена на 100% (все 15 трулей заняты).</span>`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ` : ""}

          <!-- ==================== МОДУЛЬ 2: КАЛЕНДАРЬ-ПЛАНИРОВЩИК И ЛЮДИ ИЗ КОПТИЛКИ ==================== -->
          ${ct.activeModule === 2 ? `
            <div class="trade-tool-card" style="border-color:#38BDF8; margin-top:12px;">
              <div class="trade-tool-head">
                <div class="trade-tool-title">
                  <span>📅</span> МОДУЛЬ 2: КАЛЕНДАРЬ-ПЛАНИРОВЩИК И ЛЮДИ ИЗ КОПТИЛКИ
                </div>
                <span class="trade-tool-badge" style="border-color:#38BDF8; color:#38BDF8;">График заимствования рабочих</span>
              </div>

              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
                <button class="trade-chip ${ct.scheduleMode === 'FORWARD' ? 'active' : ''}" onclick="onTechScheduleMode('FORWARD')">
                  ▶ От даты старта разморозки/посола
                </button>
                <button class="trade-chip ${ct.scheduleMode === 'BACKWARD' ? 'active' : ''}" onclick="onTechScheduleMode('BACKWARD')">
                  ◀ Обратный расчет: подгадать под свободный день коптилки!
                </button>
              </div>

              <div class="trade-grid-2">
                <div>
                  <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Точка отсчета (Дата и время):</label>
                  <input type="datetime-local" class="field-input" style="width:100%; margin:4px 0 10px 0;" value="${ct.startDateTime}" onchange="onTechStartDateTime(this.value)"/>

                  <label style="font-size:12px; color:#CBD5E1; font-weight:700;">Число работников из коптилки:</label>
                  <div style="display:flex; gap:6px; margin:4px 0 10px 0;">
                    <input type="number" class="field-input" style="flex:1;" value="${workers}" onchange="onTechWorkersCount(this.value)"/>
                    <button class="trade-btn-sm" onclick="onTechWorkersCount(2)">2 чел</button>
                    <button class="trade-btn-sm" onclick="onTechWorkersCount(3)">3 чел</button>
                    <button class="trade-btn-sm" onclick="onTechWorkersCount(4)">4 чел</button>
                  </div>

                  <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:#CBD5E1; cursor:pointer; margin-top:4px;">
                    <input type="checkbox" ${ct.isFrozenRaw ? 'checked' : ''} onchange="onTechFrozenToggle(this.checked)"/>
                    <span>Сырье замороженное (требуется +24ч разморозки)</span>
                  </label>
                </div>

                <!-- ВИЗУАЛЬНЫЙ ТАЙМЛАЙН -->
                <div style="background:#030814; border:1px solid rgba(0,229,255,0.3); border-radius:12px; padding:12px;">
                  <div style="font-size:12px; font-weight:800; color:#00E5FF; text-transform:uppercase; margin-bottom:8px;">
                    📋 ТЕХНОЛОГИЧЕСКИЙ ГРАФИК ЦЕХА ПО ДНЯМ И ЧАСАМ:
                  </div>

                  <div style="display:flex; flex-direction:column; gap:8px; font-size:12px; color:#CBD5E1;">
                    ${ct.isFrozenRaw ? `
                      <div style="padding:6px 8px; background:rgba(0,229,255,0.06); border-left:3px solid #00E5FF; border-radius:4px;">
                        ❄️ <b>Выгрузка из морозилки (дефростация 24 ч):</b><br>
                        ${fmtD(startDate)} ➔ ${fmtD(defrostEnd)}
                      </div>
                    ` : ''}

                    <div style="padding:6px 8px; background:rgba(255,209,102,0.06); border-left:3px solid #FFD166; border-radius:4px;">
                      🧂 <b>Закладка в тузлук (+2..+4°C) + промывка/отмочка:</b><br>
                      ${fmtD(defrostEnd)} ➔ ${fmtD(saltingEnd)}
                    </div>

                    <div style="padding:8px 10px; background:rgba(255,82,82,0.12); border:1.5px solid #FF5252; border-radius:8px;">
                      🔥 <b style="color:#FF5252; font-size:13px;">ПИК ЛЮДЕЙ №1 — НАВЕСКА НА ТРУЛИ:</b><br>
                      <b>${fmtD(saltingEnd)} ➔ ${fmtD(hangingEnd)}</b> (длительность ~<b>${hangHours} ч</b>)<br>
                      <span style="color:#FDE68A;">📢 Заявка мастеру: запросить <b>${workers} работников</b> из коптилки на <b>${hangHours} ч</b> (норма навески 95 кг/ч на чел.)!</span>
                    </div>

                    <div style="padding:6px 8px; background:rgba(46,229,157,0.06); border-left:3px solid #2EE59D; border-radius:4px;">
                      💨 <b>Автономная сушка в камере AIM (люди из коптилки НЕ нужны):</b><br>
                      ${fmtD(hangingEnd)} ➔ ${fmtD(dryingEnd)} (4 суток сушки, только 15 мин/сутки мастеру на рокировку)
                    </div>

                    <div style="padding:8px 10px; background:rgba(46,229,157,0.12); border:1.5px solid #2EE59D; border-radius:8px;">
                      🔥 <b style="color:#2EE59D; font-size:13px;">ПИК ЛЮДЕЙ №2 — ВЫГРУЗКА, ПОДРЕЗКА И ВАКУУМ:</b><br>
                      <b>${fmtD(dryingEnd)} ➔ ${fmtD(packingEnd)}</b> (длительность ~<b>${packHours} ч</b>)<br>
                      <span style="color:#A7F3D0;">📢 Заявка мастеру: забрать <b>${workers} работников</b> из коптилки на <b>${packHours} ч</b> (норма съема и фасовки 80 кг/ч на чел.)!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ` : ""}

          <!-- ==================== МОДУЛЬ 3: ШАХМАТКА 15 ТРУЛЕЙ В КАМЕРЕ ==================== -->
          ${ct.activeModule === 3 ? `
            <div class="trade-tool-card" style="border-color:#2EE59D; margin-top:12px;">
              <div class="trade-tool-head">
                <div class="trade-tool-title">
                  <span>📐</span> МОДУЛЬ 3: ВИЗУАЛЬНАЯ ШАХМАТКА 15 ТРУЛЕЙ (3×5) В КАМЕРЕ
                </div>
                <div style="display:flex; gap:6px;">
                  <button class="trade-btn-sm" style="background:#2EE59D; color:#000;" onclick="toggleTechRotations()">
                    ${ct.showRotations ? "Скрыть рокировку" : "🔄 Показать суточную рокировку"}
                  </button>
                  <span class="trade-tool-badge" style="border-color:#2EE59D; color:#2EE59D;">${cartsUsed} из 15 занято</span>
                </div>
              </div>

              ${cartsUsed < 15 ? `
                <div style="background:rgba(255,167,38,0.14); border:1.5px solid #FFA726; border-radius:10px; padding:10px 12px; margin-bottom:12px; font-size:12px; color:#FDE68A;">
                  ⚠️ <b>Внимание технолога:</b> Занято только <b>${cartsUsed} из 15 трулей</b>. Установите глухие аэродинамические шторки на пустые позиции, чтобы 14 кВт напорных вентиляторов Cantoni не свистели мимо рыбы!
                </div>
              ` : ''}

              <!-- КАРТА КАМЕРЫ AIM-AGHD-250ELC: 5 РЯДОВ ПО 3 ТРУЛЯ -->
              <div style="background:#02050D; border:1px solid #1E293B; border-radius:14px; padding:14px; overflow-x:auto;">
                <div style="text-align:center; font-size:11px; font-weight:800; color:#00E5FF; margin-bottom:8px;">
                  💨 СОПЛА ВЕНТИЛЯТОРОВ CANTONI 4×3кВт (14 кВт • СКОРОСТЬ 2.0–2.2 м/с) 💨
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; min-width:320px;">
                  ${[1, 2, 3, 4, 5].map(row => {
                    const rowAirSpeed = [2.2, 1.9, 1.6, 1.3, 1.1][row - 1];
                    let rowTitle = `Ряд ${row} (${rowAirSpeed} м/с)`;
                    if (row === 1) rowTitle = "Ряд 1 (Вентиляторы Cantoni • 2.2 м/с)";
                    else if (row === 3) rowTitle = "Ряд 3 (Центр камеры • Разворот на 180°)";
                    else if (row === 5) rowTitle = "Ряд 5 (Вытяжные решетки • 1.1 м/с)";

                    return `
                      <div>
                        <div style="font-size:10px; color:#94A3B8; margin-bottom:3px; display:flex; justify-content:space-between;">
                          <span>${rowTitle}</span>
                          ${ct.showRotations ? `
                            <span style="color:#FFD166; font-weight:700;">
                              ${row === 1 || row === 2 ? '➔ Едет назад в Ряды 4–5' : ''}
                              ${row === 3 ? '⇄ Разворот на 180° на месте' : ''}
                              ${row === 4 || row === 5 ? '➔ Едет вперед в Ряды 1–2' : ''}
                            </span>
                          ` : ''}
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
                          ${[1, 2, 3].map(col => {
                            const cartNum = (row - 1) * 3 + col;
                            const isOccupied = cartNum <= cartsUsed;
                            return `
                              <div style="background:${isOccupied ? '#06192E' : '#040A14'}; border:1.5px ${isOccupied ? 'solid #00E5FF' : 'dashed #334155'}; border-radius:10px; padding:10px 8px; text-align:center;">
                                <div style="font-size:12px; font-weight:800; color:${isOccupied ? '#00E5FF' : '#64748B'};">
                                  Труль №${cartNum}
                                </div>
                                ${isOccupied ? `
                                  <div style="font-size:11px; color:#2EE59D; font-weight:700; margin-top:2px;">${kgPerCart} кг</div>
                                  <div style="font-size:10px; color:#94A3B8;">${data.name}</div>
                                ` : `
                                  <div style="font-size:10px; color:#E2E8F0; margin-top:2px; background:rgba(255,167,38,0.15); padding:2px; border-radius:4px;">ШТОРКА</div>
                                `}
                              </div>
                            `;
                          }).join("")}
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>

                <div style="text-align:center; font-size:11px; font-weight:800; color:#64748B; margin-top:10px;">
                  🔻 ВЫТЯЖНЫЕ РЕШЕТКИ И РЕЦИРКУЛЯЦИОННЫЙ КАНАЛ 🔻
                </div>
              </div>
            </div>
          ` : ""}

          <!-- ==================== МОДУЛЬ 4: ФИЗИКА СУШКИ И РАЗРЕЗ НОЖОМ ==================== -->
          ${ct.activeModule === 4 ? `
            <div class="trade-tool-card" style="border-color:#FFA726; margin-top:12px;">
              <div class="trade-tool-head">
                <div class="trade-tool-title">
                  <span>🌡</span> МОДУЛЬ 4: ФИЗИКА СУШКИ И КОНТРОЛЬНЫЙ РАЗРЕЗ НОЖОМ
                </div>
                <span class="trade-tool-badge" style="border-color:#FFA726; color:#FFA726;">Воздух — Шкура — Разрез перед вакуумом</span>
              </div>

              <!-- 1. ΔT ИСПАРЕНИЯ ВОЗДУХ - ШКУРА -->
              <div style="background:#030814; border:1px solid rgba(255,209,102,0.3); border-radius:12px; padding:12px; margin-bottom:12px;">
                <div style="font-size:12px; font-weight:800; color:#FFD166; text-transform:uppercase; margin-bottom:6px;">
                  1. КОНТРОЛЬ ИСПАРЕНИЯ ПО ДЕЛЬТЕ (Т_ВОЗДУХА - Т_ШКУРЫ):
                </div>

                <div class="trade-grid-2">
                  <div>
                    <label style="font-size:12px; color:#CBD5E1;">Температура воздуха в камере (°C): <b>${ct.tempAirC.toFixed(1)}°C</b></label>
                    <input type="range" min="10" max="22" step="0.1" value="${ct.tempAirC}" oninput="onTechTempAir(this.value)" style="width:100%;"/>

                    <label style="font-size:12px; color:#CBD5E1; margin-top:6px; display:block;">Т_шкуры рыбы (по ИК-пирометру): <b>${ct.tempSkinC.toFixed(1)}°C</b></label>
                    <input type="range" min="8" max="20" step="0.1" value="${ct.tempSkinC}" oninput="onTechTempSkin(this.value)" style="width:100%;"/>
                  </div>

                  <div style="display:flex; flex-direction:column; justify-content:center; gap:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline;">
                      <span style="font-size:12px; color:#CBD5E1;">Разность ΔT (Воздух - Шкура):</span>
                      <span style="font-family:var(--font-mono); font-size:22px; font-weight:900; color:#FFD166;">+${deltaT.toFixed(1)}°C</span>
                    </div>
                    <div style="font-size:12px; line-height:1.4;">
                      ${evapStatusHtml}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. ИНСПЕКТОР КОНТРОЛЬНОГО РАЗРЕЗА НОЖОМ -->
              <div style="background:#020612; border:1px solid #00E5FF; border-radius:12px; padding:12px;">
                <div style="font-size:12px; font-weight:800; color:#00E5FF; text-transform:uppercase; margin-bottom:8px;">
                  🔪 2. ИНСПЕКТОР КОНТРОЛЬНОГО РАЗРЕЗА 1 РЫБЫ НОЖОМ ПЕРЕД УПАКОВКОЙ:
                </div>

                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div>
                    <div style="font-size:11px; color:#94A3B8;">Вид мяса у позвоночника:</div>
                    <div class="trade-chip-bar">
                      <button class="trade-chip ${ct.cutBone === 'AMBER' ? 'active' : ''}" onclick="onTechCutSelect('cutBone', 'AMBER')">🟢 Янтарно-стекловидное (слеза)</button>
                      <button class="trade-chip ${ct.cutBone === 'SOFT' ? 'active' : ''}" onclick="onTechCutSelect('cutBone', 'SOFT')">🟡 Мягковатое (нужен дожим)</button>
                      <button class="trade-chip ${ct.cutBone === 'WHITE_RAW' ? 'active' : ''}" onclick="onTechCutSelect('cutBone', 'WHITE_RAW')">🔴 Белесое сырое у кости</button>
                    </div>
                  </div>

                  <div>
                    <div style="font-size:11px; color:#94A3B8;">Край под чешуей:</div>
                    <div class="trade-chip-bar">
                      <button class="trade-chip ${ct.cutEdge === 'ELASTIC' ? 'active' : ''}" onclick="onTechCutSelect('cutEdge', 'ELASTIC')">🟢 Эластичный монолит без закала</button>
                      <button class="trade-chip ${ct.cutEdge === 'HARD_CRUST' ? 'active' : ''}" onclick="onTechCutSelect('cutEdge', 'HARD_CRUST')">🔴 Сухая корка закала</button>
                    </div>
                  </div>

                  <div>
                    <div style="font-size:11px; color:#94A3B8;">Состояние ястыка икры:</div>
                    <div class="trade-chip-bar">
                      <button class="trade-chip ${ct.cutRoe === 'SOLID' ? 'active' : ''}" onclick="onTechCutSelect('cutRoe', 'SOLID')">🟢 Плотный ястык, влага равномерна</button>
                      <button class="trade-chip ${ct.cutRoe === 'WET_CORE' ? 'active' : ''}" onclick="onTechCutSelect('cutRoe', 'WET_CORE')">🟡 Влажная сердцевина (отволаживание 36ч)</button>
                      <button class="trade-chip ${ct.cutRoe === 'NONE' ? 'active' : ''}" onclick="onTechCutSelect('cutRoe', 'NONE')">⚪ Без икры / постная</button>
                    </div>
                  </div>

                  <div>
                    <div style="font-size:11px; color:#94A3B8;">Капля крови/жира у плавника + Т° тушки:</div>
                    <div class="trade-chip-bar">
                      <button class="trade-chip ${ct.cutFluid === 'CLEAN' ? 'active' : ''}" onclick="onTechCutSelect('cutFluid', 'CLEAN')">🟢 Сухо, Т=+10°C, жир чистый</button>
                      <button class="trade-chip ${ct.cutFluid === 'RUNNY_FAT' ? 'active' : ''}" onclick="onTechCutSelect('cutFluid', 'RUNNY_FAT')">🟡 Т=+13°C, жир течет (доохладить)</button>
                      <button class="trade-chip ${ct.cutFluid === 'DARK_BLOOD' ? 'active' : ''}" onclick="onTechCutSelect('cutFluid', 'DARK_BLOOD')">🔴 Темная сукровица из анального отв.</button>
                    </div>
                  </div>

                  <!-- ВЕРДИКТ ВАКУУМА -->
                  <div style="background:#061426; border:1.5px solid ${isPassCut ? '#2EE59D' : '#FF5252'}; border-radius:10px; padding:10px 12px; margin-top:6px;">
                    <div style="font-size:13px; font-weight:800; color:${isPassCut ? '#2EE59D' : '#FF5252'};">
                      ${cutVerdictText}
                    </div>
                    <div style="font-size:12px; color:#CBD5E1; margin-top:4px;">
                      • Режим вакуума KOMET: <b>${vacPercent}</b><br>
                      • Доохлаждение перед упаковкой: <b>строго +9..+11°C</b> (чтобы застыл жир и не давил сукровицу в пакет).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ` : ""}

          <!-- ==================== МОДУЛЬ 5: БЕСКОНТАКТНЫЙ ВОДОМЕР ТРАПА И ЗУМ ГРАФИКА ==================== -->
          ${ct.activeModule === 5 ? `
            <div class="trade-tool-card" style="border-color:#00E5FF; margin-top:12px;">
              <div class="trade-tool-head">
                <div class="trade-tool-title">
                  <span>💧</span> МОДУЛЬ 5: БЕСКОНТАКТНЫЙ ВОДОМЕР ТРАПА И ЧИСТЫЙ ГРАФИК
                </div>
                <span class="trade-tool-badge" style="border-color:#00E5FF; color:#00E5FF;">Высота 60 см • Без ведра!</span>
              </div>

              <div style="background:rgba(0,229,255,0.08); border:1px solid #00E5FF; border-radius:10px; padding:8px 12px; font-size:12px; color:#CBD5E1; margin-bottom:10px;">
                💡 <b>Физика цеха Юрмалциемс:</b> Между полом и внутренним трапом у испарителя всего 60 см, ведро туда не ставится! Водомер рассчитывает сброс конденсата бесконтактно по кинетике влажности камеры (-%/мин компрессором и +%/мин рыбой в паузе).
              </div>

              <div class="trade-grid-2">
                <div>
                  <label style="font-size:12px; color:#CBD5E1;">Скорость сгона влажности компрессором (-%/мин): <b>${ct.vDown.toFixed(2)} %/мин</b></label>
                  <input type="range" min="-2.0" max="-0.2" step="0.05" value="${ct.vDown}" oninput="onTechVDownInput(this.value)" style="width:100%;"/>

                  <label style="font-size:12px; color:#CBD5E1; margin-top:6px; display:block;">Скорость отскока влажности в паузе (+%/мин): <b>+${ct.vUp.toFixed(2)} %/мин</b></label>
                  <input type="range" min="0.1" max="1.5" step="0.05" value="${ct.vUp}" oninput="onTechVUpInput(this.value)" style="width:100%;"/>
                </div>

                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div class="trade-kpi-card" style="border-color:#00E5FF;">
                    <div style="font-size:11px; color:#00E5FF; font-weight:800; text-transform:uppercase;">💧 СКОРОСТЬ СЛИВА В ТРАП:</div>
                    <div class="trade-kpi-val" style="color:#00E5FF;">${flowRateLh} л/час</div>
                    <div class="trade-kpi-sub">
                      Уже слито в трап: <b>${drainedLiters} л</b> • Осталось снять из рыбы: <b>${remainingWaterL} л</b>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ЧИСТЫЙ SVG ГРАФИК С ЗУМОМ И ПРИЦЕЛОМ -->
              <div style="margin-top:14px; background:#020610; border:1px solid #1E293B; border-radius:12px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:12px; font-weight:700; color:#FFFFFF;">График влажности и сброса в трап (60 точек без каши):</span>
                  <div class="btn-row">
                    <button class="trade-btn-sm ${ct.graphZoom === 'ALL' ? 'active' : ''}" onclick="onTechGraphZoom('ALL')">🌐 Весь прогон</button>
                    <button class="trade-btn-sm ${ct.graphZoom === '12H' ? 'active' : ''}" onclick="onTechGraphZoom('12H')">⏱ 12 часов</button>
                    <button class="trade-btn-sm ${ct.graphZoom === '4H' ? 'active' : ''}" onclick="onTechGraphZoom('4H')">🔍 4 часа циклы</button>
                  </div>
                </div>

                <!-- SVG ГРАФИК -->
                <div style="position:relative; width:100%; height:140px;">
                  <svg viewBox="0 0 500 120" style="width:100%; height:100%; overflow:visible;">
                    <!-- Сетка -->
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#1E293B" stroke-dasharray="2,2"/>
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#1E293B" stroke-dasharray="2,2"/>
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#1E293B" stroke-dasharray="2,2"/>

                    <!-- Кривая RH% -->
                    <polyline fill="none" stroke="#00E5FF" stroke-width="2.2" points="${pts.map((p, i) => {
                      const x = (i / (pts.length - 1)) * 500;
                      const y = 120 - ((p.rh - 40) / 50) * 110;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(" ")}"/>

                    <!-- Интерактивные прозрачные зоны касания для прицела -->
                    ${pts.map((p, i) => {
                      const x = (i / (pts.length - 1)) * 500;
                      return `<rect x="${x - 4}" y="0" width="8" height="120" fill="transparent" style="cursor:crosshair;" onmouseover="onTechGraphHover(${p.idx})" ontouchstart="onTechGraphHover(${p.idx})"/>`;
                    }).join("")}
                  </svg>
                </div>

                <div id="tech-graph-crosshair-data" style="font-family:var(--font-mono); font-size:11px; color:#2EE59D; margin-top:6px; min-height:16px; text-align:center;">
                  💡 Наведите курсор или проведите пальцем по графику для чтения точки прицела
                </div>
              </div>
            </div>
          ` : ""}

        </div>
      `;
    }


    
    // ==================== 🛠️ INDUSTRIAL FUNCTION BRIDGES ====================
    function openMobileActionsDrawer() {
      if (typeof toggleMobileActionsDrawer === "function") {
        toggleMobileActionsDrawer();
      }
    }
    function showToastMsg(msg) {
      if (typeof showToast === "function") {
        showToast(msg);
      }
    }
    function normalizeSpeciesKey(key) {
      if (!key) return "VIMBA";
      if (key === "ROUND_GOBY") return "GOBY";
      return key;
    }

    function broadcastTelemetrySync() {
      try {
        const diag = (typeof analyzeBioscience === "function") ? analyzeBioscience(state.telemetry) : null;
        const payload = {
          type: "SYNC_TELEMETRY",
          telemetry: state.telemetry,
          diag: diag,
          warehouse: (typeof tubaWarehouse !== "undefined") ? tubaWarehouse : null
        };
        if (typeof phoneSimSyncChannel !== "undefined" && phoneSimSyncChannel) {
          phoneSimSyncChannel.postMessage(payload);
        }
        const iframe = document.getElementById("phone-sim-iframe");
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(payload, "*");
        }
      } catch (e) {
        console.warn("broadcastTelemetrySync error:", e);
      }
    }

    let _renderAllRafId = null;


    // ==================== 6. ЭКСПОРТ В CSV С UTF-8 BOM ДЛЯ EXCEL ====================
    function buildCsvContent() {
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const yf = diag.yieldForecast;
      const mcgsTotals = calculateMcgsCycleTotals(stage, diag.mcgsPhases);
      const targetTemp = targetTempRangeFor(species, stage, t.coLoadWithVimba);
      const nowStr = new Date().toLocaleString("ru-RU");
      const advisorText = state.customAiAdvice || diag.instantAdvisorSummary;
      const heatModeObj = HEAT_RECOVERY_MODES[t.heatRecoveryMode || "WINTER_14KW"] || HEAT_RECOVERY_MODES.WINTER_14KW;
      const esc = s => String(s).replace(/[\r\n]+/g, " ").replace(/;/g, ",").trim();

      const lines = [
        "ОТЧЕТ ПАРТИИ АРМ ТЕХНОЛОГА ВЯЛЕНИЯ РЫБЫ (ЮРМАЛЦИЕМС);Значение;Ед. изм.;Норма / Примечание",
        `Дата и время формирования;${esc(nowStr)};;Линия AIM AGHD-250ELC (уличный конденсатор 10 м)`,
        `Вид рыбы;${esc(species.titleRu)};;${esc(species.subtitleRu)}`,
        `Режим загрузки;${t.coLoadWithVimba ? "Совместно с вимбой" : "Моно-загрузка"};;`,
        `Вес сырой рыбы при загрузке;${t.batchWeightKg};кг;Загрузка камеры`,
        `Текущая стадия цикла;Стадия ${stage.number}: ${esc(stage.titleRu)};;${esc(stage.daysLabelRu)}`,
        `Текущая фаза обдува;${t.isPausePhaseNow ? `ПАУЗА (${stage.pauseFreqLabel})` : `АКТИВНАЯ СУШКА (${stage.activeFreqHz} Гц)`};;`,
        `Режим рекуперации тепла (10-м трасса);${esc(heatModeObj.titleRu)};;${esc(heatModeObj.descriptionRu)}`,
        "",
        "ПРОГНОЗ КАЛЬКУЛЯТОРА ПАРТИИ И ВЛАГОСЪЕМА;Мин;Макс;Среднее / Норма",
        `Выход готовой продукции (кг);${yf.finishedMinKg};${yf.finishedMaxKg};${yf.finishedAvgKg} кг (${species.yieldPercentRange})`,
        `Испарить воды всего из партии (л / кг);${yf.totalWaterMinLiters};${yf.totalWaterMaxLiters};${yf.totalWaterAvgLiters} л`,
        `План съема воды на текущей Стадии ${stage.number} (л);${yf.currentStageWaterLiters};${yf.currentStageWaterLiters};${stage.moistureShareOfTotalPercent}% от общего влагосъема`,
        `Режим отволаживания (стабилизации) жирной рыбы;4 ч отдых;1 ч забор влаги;Коридор +13..+15 °C, обороты частотников Cantoni 25.3 Гц`,
        "",
        "ТЕЛЕМЕТРИЯ КАМЕРЫ И ОСУШИТЕЛЯ AIM;Факт;Ед. изм.;Целевое окно",
        `Environment (Температура в камере);${t.environmentTempC};°C;${targetTemp[0]}..${targetTemp[1]} °C (Авария >= ${species.emergencyMaxTempC} °C)`,
        `Т чешуи по пирометру ИК-пирометр шкуры;${diag.scaleSurfaceTempC};°C;Дельта испарения ΔT = ${diag.deltaTempEvapC >= 0 ? "+" : ""}${diag.deltaTempEvapC.toFixed(1)} °C (${esc(diag.evapStatusTitle)})`,
        `Остаточная влага у хребта (Игольчатый влагомер мяса);${diag.spineMoistureGmPercent};%;Инструментальный контроль ядра тушки`,
        `Parkside rH (Влажность логгера);${Math.round(t.parksideRhPercent)};%;${stage.targetShelfRhRange[0]}..${stage.targetShelfRhRange[1]} %`,
        `Расчетная точка росы (Dew Point);${diag.dewPointC};°C;Магнус-Тетенс`,
        `Дефицит давления пара (VPD);${diag.vpdKpa};кПа;Оптимум 0.50..1.05 кПа`,
        `1#EEV Step (Шаги ЭРВ);${t.eev1Steps};step;205..480 step (MinimumStep = 75)`,
        `1#Dehumicoil (Кипение испарителя);${t.dehumicoilTempC};°C;+4.5..+5.8 °C (без обмерзания)`,
        `Активных контуров AIM в работе;${t.activeCircuitsRunning};шт.;Регламент стадии: ${stage.activeCircuitsCount} конт.`,
        "",
        `ТАБЛИЦА 8 ФАЗ КОНТРОЛЛЕРА MCGS (${esc(stage.shortTitleRu)});Режим;Temp (°C);Humi (%);Time (ч);Cantoni Гц;Напряжение;Примечание`,
        `Суммарно за 8 фаз цикла;Сушка ${mcgsTotals.workHoursTotal} ч / Паузы ${mcgsTotals.pauseHoursTotal} ч / Буфер ${mcgsTotals.bufferHours} ч;--;--;${mcgsTotals.totalHours} ч (${mcgsTotals.totalDays} сут);--;--;Расчетное потребление: ~${mcgsTotals.avgKwh} кВт*ч (${mcgsTotals.minKwh}-${mcgsTotals.maxKwh} кВт*ч)`,
        ...diag.mcgsPhases.map(r =>
          `Фаза ${r.phaseNumber};${esc(r.modeLabel)};${r.tempSetpointC};${r.humiSetpointPercent};${r.durationHours};${esc(r.cantoniFreqHz)};${esc(r.cantoniVoltageV)};${esc(r.circuitsNote)}`
        ),
        "",
        "БИОФИЗИЧЕСКАЯ ДИАГНОСТИКА И СОВЕТ ТЕХНОЛОГУ;Статус;Описание",
        `Риск закала чешуи;${diag.caseHardeningRisk};${esc(diag.caseHardeningText)}`,
        `Риск подпарки;${diag.thermalDamageRisk};${esc(diag.thermalDamageText)}`,
        `Диагностика ЭРВ 1#EEV и 1#Dehumicoil;${diag.eevStatus};${esc(diag.eevDiagnosisText)}`,
        `Готовность к след. стадии / KOMET PlusVac 25;${diag.readinessStatus};${esc(diag.readinessText)}`,
        `Итоговый совет технологу;РЕЗЮМЕ;${esc(advisorText)}`
      ];

      return "\uFEFF" + lines.join("\r\n");
    }

    function triggerExportCsv() {
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
      const fileName = `otchet_${species.id}_st${stage.number}_${t.batchWeightKg}kg_${stamp}.csv`;
      const csvContent = buildCsvContent();

      state.activeCsvResult = { fileName, csvContent };
      document.getElementById("csv-modal-filename").textContent = fileName;
      document.getElementById("csv-modal-preview").textContent = csvContent.replace(/^\uFEFF/, "");
      document.getElementById("csv-modal").classList.add("open");
    }

    function downloadActiveCsv() {
      if (!state.activeCsvResult) return;
      const blob = new Blob([state.activeCsvResult.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = state.activeCsvResult.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Файл ${state.activeCsvResult.fileName} сохранен!`);
    }

    function copyActiveCsv() {
      if (!state.activeCsvResult) return;
      navigator.clipboard.writeText(state.activeCsvResult.csvContent.replace(/^\uFEFF/, ""));
      showToast("CSV-отчет скопирован в буфер обмена");
    }

    function closeCsvModal() {
      document.getElementById("csv-modal").classList.remove("open");
    }


    // ==================== 8. ПАРСЕР И ГРАФИК ЛОГГЕРА PARKSIDE (.CSV / .TXT) ====================
    // Реальный лог цеха Юрмалциемс на 527 точек (USB Data Logger_261028_1234.CSV: старт 2026/10/26 16:41:24, шаг ровно 5 мин, 43.8 ч)
    const REAL_527_COMPACT_PAIRS = "18.5:74.1,18.1:56.5,17.5:57.2,18.2:55.1,17.4:57.3,17.6:56.3,17.2:69.1,17.4:75.9,17.7:78.3,18.0:79.6,18.2:80.5,18.8:74.6,17.9:66.0,17.4:71.5,17.6:78.9,17.9:80.7,18.0:81.3,17.9:78.2,17.9:75.6,17.9:74.3,17.9:74.1,17.9:76.7,17.3:65.9,16.5:62.4,15.7:61.7,15.1:61.7,14.5:61.9,14.1:62.0,13.7:62.2,13.5:67.7,13.9:78.0,14.4:77.3,14.0:67.4,13.6:64.9,13.5:75.4,13.8:80.0,14.4:81.7,14.0:68.5,13.4:65.8,13.6:77.8,14.0:81.0,14.6:78.9,14.5:70.3,13.9:66.8,13.4:68.0,13.7:79.3,14.1:81.5,14.7:76.0,14.3:69.6,13.8:66.8,13.5:74.1,13.8:80.3,14.2:81.9,14.7:79.5,14.1:69.0,13.5:66.7,13.6:77.2,13.8:81.0,14.3:82.4,14.1:71.9,13.5:68.2,13.6:78.0,13.9:81.8,14.3:83.1,14.8:79.9,14.2:69.8,13.5:67.5,13.5:71.4,13.6:72.6,13.5:77.3,13.8:80.9,13.3:67.6,13.8:69.8,13.9:73.6,13.6:67.6,13.8:62.9,13.3:62.4,14.0:59.8,13.2:61.9,14.0:59.2,13.1:61.5,13.9:58.7,13.2:61.0,14.1:58.2,13.1:60.5,13.9:57.9,13.1:60.4,13.3:75.0,13.5:78.7,13.9:80.6,14.2:81.4,14.7:78.1,14.1:68.5,13.5:66.6,13.3:77.5,13.8:81.2,14.1:82.7,14.8:76.0,14.2:71.0,13.7:68.1,13.3:68.8,13.6:80.4,13.9:82.4,14.2:83.5,14.1:73.1,13.4:69.3,13.2:76.0,13.5:81.6,13.9:83.3,14.3:83.9,14.5:73.6,13.9:69.6,13.3:67.8,13.4:79.4,13.8:82.4,14.1:83.6,14.2:76.2,13.7:70.6,13.3:69.0,13.5:81.1,13.8:83.0,14.2:83.9,14.8:80.8,14.0:70.7,13.4:68.5,13.4:78.0,13.6:82.1,14.1:83.4,14.5:83.3,14.5:72.9,13.8:69.6,13.2:68.2,13.6:80.6,13.8:82.8,14.2:83.7,13.7:71.6,13.0:69.2,13.7:66.5,13.1:66.1,13.9:63.8,13.1:64.5,13.8:62.2,13.3:62.8,13.6:61.3,13.5:61.5,13.6:60.6,13.6:60.5,13.5:75.5,13.9:79.1,14.1:80.9,14.5:82.0,13.8:69.6,13.3:67.3,13.4:80.2,13.8:82.4,14.2:83.2,14.8:78.8,14.2:70.4,13.5:67.9,13.4:78.0,13.7:82.0,14.1:83.3,14.4:83.9,14.5:73.1,13.9:69.6,13.3:68.0,13.4:80.1,13.8:82.8,14.2:83.8,14.8:78.1,14.3:71.6,13.6:68.9,13.3:75.2,13.5:81.5,14.0:83.3,14.3:84.0,14.0:72.9,13.4:69.8,13.4:79.2,13.6:82.6,14.1:83.8,14.4:84.3,14.5:73.7,13.9:70.3,13.3:68.7,13.5:80.6,13.8:83.0,14.1:84.0,14.3:78.0,13.8:71.6,13.2:69.6,13.4:81.2,13.7:83.3,14.1:84.2,14.9:77.3,14.3:72.5,13.8:70.0,13.6:67.8,13.6:66.3,13.7:65.0,13.5:64.3,13.7:63.2,13.4:63.2,13.9:61.9,13.4:62.3,13.9:60.6,13.4:61.6,13.4:70.1,13.6:77.9,13.9:80.3,14.2:81.6,14.9:75.0,14.3:70.0,13.6:67.5,13.4:77.7,13.7:81.8,14.1:83.2,14.4:83.7,14.1:72.0,13.4:69.3,13.4:80.1,13.9:83.0,14.1:83.9,14.8:79.2,14.4:72.7,13.8:69.9,13.3:69.4,13.5:81.2,13.9:83.2,14.2:84.1,14.3:75.7,13.7:71.1,13.2:73.7,13.6:81.9,13.9:83.6,14.4:84.5,14.8:82.0,14.1:71.6,13.6:69.5,13.4:78.5,13.7:82.4,14.1:83.8,14.4:84.4,14.5:74.2,13.9:70.9,13.4:69.5,13.4:79.5,13.8:82.7,14.1:83.9,14.4:84.4,13.9:72.8,13.3:70.3,13.3:80.2,13.7:83.0,13.9:84.1,14.4:84.8,14.5:74.0,13.8:70.9,13.2:69.4,13.9:66.9,13.2:67.2,14.0:64.1,13.2:65.7,14.0:62.4,13.3:64.5,14.5:73.2,15.9:66.8,15.1:68.8,14.7:69.9,14.3:71.3,14.2:72.4,14.1:73.1,13.9:73.7,13.9:74.3,13.9:74.3,13.9:74.4,13.8:75.5,13.7:66.6,13.4:63.6,13.5:62.4,13.5:62.1,13.3:62.3,13.5:61.4,13.4:61.8,13.4:61.1,13.5:60.5,13.3:60.9,13.5:60.1,13.4:60.6,13.4:59.8,13.1:59.4,12.5:58.2,12.0:58.3,11.4:58.8,10.9:59.4,10.6:59.9,10.4:60.1,10.0:60.1,9.6:59.9,9.5:59.7,9.2:59.4,9.1:59.3,8.9:59.0,8.7:59.0,8.6:58.7,8.5:58.8,8.4:59.1,8.4:59.5,8.5:59.9,8.6:60.6,8.6:61.1,8.8:61.8,8.9:63.2,9.0:63.9,9.2:61.9,9.2:61.2,9.3:61.2,9.4:61.6,9.3:62.1,9.5:62.7,9.4:63.2,9.6:64.6,9.9:66.6,9.7:64.7,9.5:63.4,9.3:62.0,9.0:61.3,8.6:61.0,8.5:60.7,8.2:60.5,8.0:60.4,7.9:62.4,7.9:68.6,8.1:75.2,8.3:78.4,8.6:79.5,8.9:70.4,8.7:67.8,9.1:64.8,9.9:62.3,10.5:60.3,11.2:58.7,11.7:57.5,12.4:56.4,12.4:56.9,12.9:54.9,12.7:57.7,12.4:72.0,12.6:66.8,13.0:61.4,12.7:74.0,12.9:78.1,13.0:79.8,13.1:80.8,13.3:81.5,13.5:82.0,13.7:82.3,14.0:82.7,14.2:82.9,14.4:71.8,13.8:66.8,13.7:79.4,13.7:82.2,13.9:83.6,14.0:83.8,14.3:83.6,14.4:72.8,13.9:67.6,13.7:79.1,13.8:82.5,13.9:83.9,14.2:84.5,14.4:80.3,14.4:71.7,14.0:67.4,13.8:80.4,13.9:83.1,14.1:84.4,14.2:85.0,14.5:82.5,14.2:70.0,13.9:75.7,13.8:81.8,13.9:84.0,14.1:84.9,14.2:85.4,14.5:73.6,14.1:68.6,13.8:79.5,13.9:83.1,14.0:84.5,14.2:85.3,14.5:82.0,14.3:71.2,13.8:70.5,13.7:81.2,13.9:83.9,14.1:84.9,14.1:76.0,13.7:69.9,13.9:67.3,13.7:66.1,13.6:64.3,13.7:63.4,13.5:63.0,13.5:61.7,13.5:61.5,13.4:60.7,13.6:60.0,13.5:60.1,13.4:59.1,13.2:72.9,13.3:78.1,13.4:80.6,13.7:82.0,13.8:83.0,14.2:83.6,14.6:81.0,14.2:68.7,13.8:74.3,13.7:80.9,13.9:83.0,14.1:84.2,14.3:84.9,14.6:74.0,14.0:67.8,13.8:78.6,13.9:82.2,14.0:84.0,14.2:85.1,14.6:82.7,14.3:69.7,13.8:75.4,13.8:81.6,14.0:83.8,14.2:85.0,14.4:81.4,14.4:71.8,14.0:67.9,13.7:80.6,13.9:83.3,14.1:84.8,14.4:85.7,14.1:72.0,13.6:77.1,13.8:82.7,13.9:84.6,14.2:85.7,14.4:80.9,14.3:71.6,13.8:71.7,13.7:81.3,13.9:84.0,14.2:85.2,14.3:86.0,14.5:73.2,13.9:68.0,13.8:80.3,13.8:83.4,13.6:70.8,13.8:68.0,13.6:66.2,13.6:64.2,13.7:63.8,13.4:62.7,13.6:61.5,13.6:61.6,13.4:60.2,13.7:59.9,13.4:59.9,13.5:59.0,13.2:68.3,13.2:76.6,13.3:79.7,13.5:81.6,13.8:82.8,14.0:83.5,14.3:84.1,14.1:70.3,13.6:77.0,13.8:81.9,13.9:83.8,14.1:84.7,14.3:85.0,14.5:72.9,14.0:67.2,13.7:79.8,13.9:82.9,14.1:84.5,14.4:85.3,14.6:82.8,14.3:69.5,13.8:76.4,13.8:81.9,14.0:84.1,14.2:85.2,14.4:82.6,14.1:70.4,13.8:79.9,13.9:83.3,14.1:84.9,14.3:85.7,14.5:82.6,14.4:71.2,13.9:73.7,13.8:81.7,13.9:84.0,14.1:85.4,14.4:85.8,14.7:82.4,14.8:81.8,14.6:79.0,14.5:77.7,14.4:77.8,14.4:77.6,14.2:76.6,14.1:76.7,14.1:77.2,14.0:77.8,13.9:76.7,14.0:78.1,14.0:78.6,13.9:76.3,14.0:76.5,13.9:77.3,13.9:78.4,14.0:77.5";

    function buildReal527CsvText() {
      const startMs = new Date(2026, 9, 26, 16, 41, 24).getTime();
      const pad2 = n => String(n).padStart(2, "0");
      const rows = ["YY/MM/DD Time,Temp °C,Humidity %"];
      const pairs = REAL_527_COMPACT_PAIRS.split(",");
      for (let i = 0; i < pairs.length; i++) {
        const [tStr, rhStr] = pairs[i].split(":");
        const dt = new Date(startMs + i * 300000);
        const ds = `${dt.getFullYear()}/${pad2(dt.getMonth() + 1)}/${pad2(dt.getDate())}  ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
        rows.push(`${ds},${tStr},${rhStr}`);
      }
      return rows.join("\n");
    }

    const PARKSIDE_DEMO_LOGS = {
      real_527: {
        fileName: "USB Data Logger_261028_1234.CSV",
        get csvText() {
          return buildReal527CsvText();
        }
      },
      st2_active: {
        fileName: "parkside_vimba_st2_active.csv",
        csvText: [
          "Индекс;Дата;Время;Температура;Относительная влажность;Точка росы;Phase_Note",
          "1;2026-10-28;06:00;16.2;63.5;9.3;Dry_30Hz",
          "2;2026-10-28;06:30;16.0;61.8;8.7;Dry_30Hz",
          "3;2026-10-28;07:00;15.9;60.2;8.2;Dry_30Hz",
          "4;2026-10-28;07:30;15.8;59.1;7.8;Dry_30Hz",
          "5;2026-10-28;08:00;15.8;58.4;7.6;Dry_30Hz",
          "6;2026-10-28;08:30;15.7;58.0;7.4;Dry_End_30Hz",
          "7;2026-10-28;08:35;15.8;64.5;9.1;Pause_Start_18Hz",
          "8;2026-10-28;08:40;15.9;70.8;10.6;Pause_18Hz",
          "9;2026-10-28;08:45;16.0;76.4;11.9;Pause_18Hz",
          "10;2026-10-28;08:50;16.1;81.2;12.9;Pause_18Hz",
          "11;2026-10-28;08:55;16.2;85.0;13.7;Pause_Peak_25min",
          "12;2026-10-28;09:15;16.3;85.4;13.8;Pause_Hold_18Hz",
          "13;2026-10-28;09:45;16.3;85.6;13.9;Pause_End_1.25h",
          "14;2026-10-28;10:00;16.1;74.0;11.4;Dry_Resume_30Hz",
          "15;2026-10-28;10:30;15.9;64.2;9.1;Dry_30Hz",
          "16;2026-10-28;11:00;15.8;59.5;7.9;Dry_30Hz",
          "17;2026-10-28;11:30;15.8;58.0;7.5;Dry_End_30Hz",
          "18;2026-10-28;11:40;15.9;69.5;10.3;Pause2_18Hz",
          "19;2026-10-28;11:55;16.1;84.8;13.5;Pause2_Peak_25min",
          "20;2026-10-28;12:15;15.8;61.0;8.3;Dry_Resume_30Hz"
        ].join("\n")
      },
      st1_ready: {
        fileName: "parkside_st1_to_st2_ready.csv",
        csvText: [
          "Index;Date_Time;Temp_C;RH_Percent;DewPoint_C;Phase_Note",
          "1;2026-10-28 04:00;16.4;68.0;10.5;Dry_2Circuits",
          "2;2026-10-28 04:30;16.2;65.0;9.6;Dry_2Circuits",
          "3;2026-10-28 05:00;16.0;62.5;8.8;Dry_2Circuits",
          "4;2026-10-28 05:30;15.9;61.0;8.4;Dry_End_30Hz",
          "5;2026-10-28 05:40;16.0;66.2;9.7;Pause_20Hz",
          "6;2026-10-28 05:55;16.1;73.8;11.4;Pause_25min",
          "7;2026-10-28 06:30;16.1;74.2;11.5;Pause_End_1.0h",
          "8;2026-10-28 07:00;15.9;64.0;9.1;Dry_30Hz",
          "9;2026-10-28 07:30;15.8;61.2;8.3;Dry_30Hz"
        ].join("\n")
      },
      st3_ready: {
        fileName: "parkside_st3_to_st4_vacuum_ready.csv",
        csvText: [
          "Index;Date_Time;Temp_C;RH_Percent;DewPoint_C;Phase_Note",
          "1;2026-10-28 05:00;15.6;55.0;6.6;Dry_30Hz",
          "2;2026-10-28 05:30;15.5;53.2;6.0;Dry_30Hz",
          "3;2026-10-28 06:00;15.4;51.8;5.5;Dry_End_30Hz",
          "4;2026-10-28 06:10;15.5;56.5;6.9;Pause_15Hz",
          "5;2026-10-28 06:25;15.6;63.8;8.8;Pause_25min",
          "6;2026-10-28 07:30;15.6;65.0;9.0;Pause_End_1.5h",
          "7;2026-10-28 08:00;15.4;54.0;6.1;Dry_30Hz",
          "8;2026-10-28 08:30;15.3;51.5;5.3;Dry_30Hz"
        ].join("\n")
      }
    };

    // Состояние масштаба (Зум), ползунка прокрутки и живого прицела графика Parkside
    let parksideViewState = {
      zoomMode: "all", // 'all' | '12h' | '4h'
      panPercent: 100, // 0..100 (100 = конец лога / последние часы)
      hoverGlobalIdx: null,
      currentViewPts: [],
      chartGeom: null
    };

    function parseParksideTimestampMinutes(str, fallbackIdx) {
      if (!str) return fallbackIdx * 5;
      const m = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!m) return null;
      const hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const ss = m[3] ? parseInt(m[3], 10) : 0;
      const dayMatch = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (dayMatch) {
        const dt = new Date(
          parseInt(dayMatch[1], 10),
          parseInt(dayMatch[2], 10) - 1,
          parseInt(dayMatch[3], 10),
          hh, mm, ss
        );
        return dt.getTime() / 60000.0;
      }
      const dmyMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmyMatch) {
        const dt = new Date(
          parseInt(dmyMatch[3], 10),
          parseInt(dmyMatch[2], 10) - 1,
          parseInt(dmyMatch[1], 10),
          hh, mm, ss
        );
        return dt.getTime() / 60000.0;
      }
      return hh * 60 + mm + ss / 60.0;
    }

    function formatParksideTimeLabels(rawTimeToken, elapsedMin) {
      if (!rawTimeToken) {
        const s = `${elapsedMin} мин`;
        return { label: s, shortTime: s, shortDateTime: s, fullTime: s };
      }
      const pad2 = n => String(n).padStart(2, "0");
      const tm = rawTimeToken.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      const hhmm = tm ? `${pad2(tm[1])}:${pad2(tm[2])}` : rawTimeToken.trim();
      const hhmmss = tm ? (tm[3] ? `${pad2(tm[1])}:${pad2(tm[2])}:${pad2(tm[3])}` : hhmm) : hhmm;

      let ddmm = "";
      let ddmmyyyy = "";
      const ymd = rawTimeToken.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      const dmy = rawTimeToken.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (ymd) {
        ddmm = `${pad2(ymd[3])}.${pad2(ymd[2])}`;
        ddmmyyyy = `${ddmm}.${ymd[1]}`;
      } else if (dmy) {
        ddmm = `${pad2(dmy[1])}.${pad2(dmy[2])}`;
        ddmmyyyy = `${ddmm}.${dmy[3]}`;
      }

      return {
        label: hhmm,
        shortTime: hhmm,
        shortDateTime: ddmm ? `${ddmm} ${hhmm}` : hhmm,
        fullTime: ddmmyyyy ? `${ddmmyyyy} ${hhmmss}` : hhmmss
      };
    }

    function parseParksideLogText(fileName, rawText) {
      const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith("#"));
      const points = [];
      let firstAbsMin = null;

      let headerTempCol = -1;
      let headerRhCol = -1;
      let headerIndexCol = -1;
      const headerDewCols = new Set();

      const splitRowTokens = (line) => {
        const delim = (line.includes(";") || line.includes("\t")) ? /[;\t]+/ : /[,]+/;
        return line.split(delim).map(s => s.trim().replace(/^["']|["']$/g, ""));
      };

      const parseNumericToken = (tok) => {
        const clean = String(tok || "").trim().replace(",", ".").replace(/[%°C℃]/gi, "").trim();
        if (!/^[+-]?\d+(\.\d+)?$/.test(clean)) return null;
        return {
          val: parseFloat(clean),
          isInt: /^[+-]?\d+$/.test(clean)
        };
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const tokens = splitRowTokens(line);

        const lowerLine = line.toLowerCase();
        const looksLikeHeader =
          /[a-zа-яё]/i.test(line) &&
          (lowerLine.includes("temp") || lowerLine.includes("темп") ||
           lowerLine.includes("rh") || lowerLine.includes("humi") ||
           lowerLine.includes("влаж") || lowerLine.includes("index") ||
           lowerLine.includes("индекс") || lowerLine.includes("dew") ||
           lowerLine.includes("росы") || lowerLine.includes("роса"));

        if (looksLikeHeader) {
          tokens.forEach((tok, colIdx) => {
            const low = tok.toLowerCase();
            if (low.includes("dew") || low.includes("росы") || low.includes("роса") || low.includes("taupunkt") || /\bdp\b/.test(low)) {
              headerDewCols.add(colIdx);
            } else if (/^(index|idx|no\.?|id|nr\.?|индекс|номер|№|#)$/i.test(low) || low.includes("индекс")) {
              if (headerIndexCol === -1) headerIndexCol = colIdx;
            } else if (low.includes("rh") || low.includes("humi") || low.includes("влаж") || low.includes("отн") || low.includes("feucht") || low.includes("%")) {
              if (headerRhCol === -1) headerRhCol = colIdx;
            } else if (low.includes("temp") || low.includes("темп") || low.includes("°c") || low.includes("grad") || /^t(\b|_)/i.test(low)) {
              if (headerTempCol === -1) headerTempCol = colIdx;
            }
          });
          const anyTimeOrNum = tokens.some(t => parseNumericToken(t) !== null);
          if (!anyTimeOrNum) continue;
        }

        let dateToken = "";
        let timeOnlyToken = "";
        const dateTimeCols = new Set();

        tokens.forEach((tok, colIdx) => {
          const hasTime = /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(tok);
          const isPureDate = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})$/.test(tok);
          if (hasTime) {
            if (!timeOnlyToken) timeOnlyToken = tok;
            dateTimeCols.add(colIdx);
          } else if (isPureDate) {
            if (!dateToken) dateToken = tok;
            dateTimeCols.add(colIdx);
          }
        });

        const timeToken = (dateToken && timeOnlyToken && !/\d{4}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(timeOnlyToken))
          ? `${dateToken} ${timeOnlyToken}`
          : (timeOnlyToken || dateToken);

        let tempC = null;
        let rhPct = null;

        if (headerTempCol !== -1 && headerRhCol !== -1 && headerTempCol < tokens.length && headerRhCol < tokens.length) {
          const tObj = parseNumericToken(tokens[headerTempCol]);
          const rhObj = parseNumericToken(tokens[headerRhCol]);
          if (tObj !== null && rhObj !== null && tObj.val >= -20 && tObj.val <= 60 && rhObj.val >= 5 && rhObj.val <= 100) {
            tempC = tObj.val;
            rhPct = rhObj.val;
          }
        }

        if (tempC === null || rhPct === null) {
          const numCols = [];
          tokens.forEach((tok, colIdx) => {
            if (dateTimeCols.has(colIdx)) return;
            if (colIdx === headerIndexCol) return;
            if (headerDewCols.has(colIdx)) return;
            const parsed = parseNumericToken(tok);
            if (parsed !== null) {
              numCols.push({ colIdx, val: parsed.val, isInt: parsed.isInt });
            }
          });

          let dataCols = numCols;
          if (dataCols.length >= 3 && dataCols[0].colIdx === 0 && dataCols[0].isInt) {
            dataCols = dataCols.slice(1);
          } else if (
            dataCols.length === 2 &&
            dataCols[0].colIdx === 0 &&
            dataCols[0].isInt &&
            headerTempCol !== 0
          ) {
            dataCols = [];
          }

          if (dataCols.length >= 2) {
            const first = dataCols[0].val;
            const second = dataCols[1].val;
            if (first >= -5 && first <= 40 && second >= 15 && second <= 100) {
              tempC = first;
              rhPct = second;
            } else if (second >= -5 && second <= 40 && first >= 15 && first <= 100) {
              tempC = second;
              rhPct = first;
            }
          }
        }

        if (tempC !== null && rhPct !== null) {
          const parsedMin = parseParksideTimestampMinutes(timeToken, points.length);
          let elapsedMin = points.length * 5;
          if (parsedMin !== null) {
            if (firstAbsMin === null) firstAbsMin = parsedMin;
            elapsedMin = Math.max(0, Math.round((parsedMin - firstAbsMin) * 10) / 10);
            if (points.length > 0 && elapsedMin <= points[points.length - 1].elapsedMin) {
              elapsedMin = points[points.length - 1].elapsedMin + 5;
            }
          }
          const tLabels = formatParksideTimeLabels(timeToken, elapsedMin);
          points.push({
            idx: points.length + 1,
            label: tLabels.label,
            shortTime: tLabels.shortTime,
            shortDateTime: tLabels.shortDateTime,
            fullTime: tLabels.fullTime,
            elapsedMin,
            tempC: Math.round(tempC * 10) / 10,
            rhPct: Math.round(rhPct * 10) / 10
          });
        }
      }

      return points;
    }

    function analyzeParksidePoints(fileName, points) {
      if (!points || points.length < 2) return null;

      // Если точки были восстановлены из старого кэша localStorage для USB Data Logger_261028_1234.CSV (527 точек) без полных дат — восстановим метки дат
      if (points.length === 527 && (!points[0].fullTime || !/\d{2}\.\d{2}\.\d{4}/.test(points[0].fullTime))) {
        const startMs = new Date(2026, 9, 26, 16, 41, 24).getTime();
        const pad2 = n => String(n).padStart(2, "0");
        points.forEach((p, i) => {
          const dt = new Date(startMs + i * 300000);
          const ddmm = `${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}`;
          const hhmm = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
          const hhmmss = `${hhmm}:${pad2(dt.getSeconds())}`;
          p.shortTime = hhmm;
          p.shortDateTime = `${ddmm} ${hhmm}`;
          p.fullTime = `${ddmm}.${dt.getFullYear()} ${hhmmss}`;
          p.label = hhmm;
        });
      }

      const n = points.length;
      let minRh = 100, maxRh = 0;
      let minTemp = 100, maxTemp = -100, sumTemp = 0;
      let minDewPoint = 100, maxDewPoint = -100, sumDewPoint = 0;
      let minVpd = 100, maxVpd = 0, sumVpd = 0;

      // 1. Расчет Точки росы °C, VPD кПа и локальной динамики в каждой точке для Живого прицела (Crosshair)
      for (let i = 0; i < n; i++) {
        const p = points[i];
        p.globalIdx = i;
        if (!p.shortTime) p.shortTime = String(p.label || `${p.elapsedMin}м`).replace(/:\d{2}$/, "");
        if (!p.shortDateTime) p.shortDateTime = p.shortTime;
        if (!p.fullTime) p.fullTime = p.label || `${p.elapsedMin} мин`;

        const rhSafe = Math.min(99.9, Math.max(5.0, p.rhPct));
        const a = 17.27, b = 237.7;
        const alpha = ((a * p.tempC) / (b + p.tempC)) + Math.log(rhSafe / 100.0);
        p.dewPointC = Math.round(((b * alpha) / (a - alpha)) * 10) / 10;

        const esKpa = 0.61078 * Math.exp((17.27 * p.tempC) / (p.tempC + 237.3));
        const eaKpa = esKpa * (rhSafe / 100.0);
        p.vpdKpa = Math.round(Math.max(0, esKpa - eaKpa) * 100) / 100;
        p.extremumType = null;

        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(n - 1, i + 1)];
        const dPrev = i > 0 ? (p.rhPct - prev.rhPct) : (next.rhPct - p.rhPct);
        const dtPrev = i > 0 ? Math.max(1, p.elapsedMin - prev.elapsedMin) : Math.max(1, next.elapsedMin - p.elapsedMin);
        const dNext = i + 1 < n ? (next.rhPct - p.rhPct) : dPrev;
        p.stepRatePerMin = Math.round((dPrev / dtPrev) * 100) / 100;

        // Определение активного процесса в точке для прицела
        if (dPrev <= -0.3 || (Math.abs(dPrev) < 0.3 && dNext <= -0.4) || (p.rhPct <= 63.0 && dPrev <= 0.1)) {
          p.isDehumNow = true;
          p.phaseActionRu = "Осушение компрессором ↓";
        } else {
          p.isDehumNow = false;
          p.phaseActionRu = "Отдача влаги от хребта ↑";
        }

        if (p.rhPct < minRh) minRh = p.rhPct;
        if (p.rhPct > maxRh) maxRh = p.rhPct;
        if (p.tempC < minTemp) minTemp = p.tempC;
        if (p.tempC > maxTemp) maxTemp = p.tempC;
        sumTemp += p.tempC;
        if (p.dewPointC < minDewPoint) minDewPoint = p.dewPointC;
        if (p.dewPointC > maxDewPoint) maxDewPoint = p.dewPointC;
        sumDewPoint += p.dewPointC;
        if (p.vpdKpa < minVpd) minVpd = p.vpdKpa;
        if (p.vpdKpa > maxVpd) maxVpd = p.vpdKpa;
        sumVpd += p.vpdKpa;
      }

      const avgTemp = Math.round((sumTemp / n) * 10) / 10;
      const avgDewPoint = Math.round((sumDewPoint / n) * 10) / 10;
      const avgVpd = Math.round((sumVpd / n) * 100) / 100;
      const totalLogMin = Math.max(5, points[n - 1].elapsedMin - points[0].elapsedMin);
      const totalLogHours = Math.round((totalLogMin / 60.0) * 10) / 10;

      // 2. Детекция локальных пиков (максимумы пауз) и минимумов (дно сушки) с защитой от шума (Prominence >= 3.2%)
      const promThreshold = n > 50 ? 3.2 : 2.5;
      const extrema = [];
      let dir = 0; // 1 = подъем (пауза), -1 = сгон вниз (осушение)
      let candIdx = 0;

      for (let i = 1; i < n; i++) {
        const diff = points[i].rhPct - points[candIdx].rhPct;
        if (dir === 0) {
          if (diff >= promThreshold) {
            extrema.push({ type: "min", idx: candIdx, pt: points[candIdx] });
            dir = 1;
            candIdx = i;
          } else if (diff <= -promThreshold) {
            extrema.push({ type: "max", idx: candIdx, pt: points[candIdx] });
            dir = -1;
            candIdx = i;
          }
        } else if (dir === 1) {
          if (points[i].rhPct >= points[candIdx].rhPct) {
            candIdx = i;
          } else if ((points[candIdx].rhPct - points[i].rhPct) >= promThreshold) {
            extrema.push({ type: "max", idx: candIdx, pt: points[candIdx] });
            dir = -1;
            candIdx = i;
          }
        } else if (dir === -1) {
          if (points[i].rhPct <= points[candIdx].rhPct) {
            candIdx = i;
          } else if ((points[i].rhPct - points[candIdx].rhPct) >= promThreshold) {
            extrema.push({ type: "min", idx: candIdx, pt: points[candIdx] });
            dir = 1;
            candIdx = i;
          }
        }
      }
      if (dir === 1) {
        extrema.push({ type: "max", idx: candIdx, pt: points[candIdx] });
      } else if (dir === -1) {
        extrema.push({ type: "min", idx: candIdx, pt: points[candIdx] });
      }

      extrema.forEach(ex => {
        points[ex.idx].extremumType = ex.type;
        if (ex.type === "min") {
          points[ex.idx].isDehumNow = true;
          points[ex.idx].phaseActionRu = "Осушение компрессором ↓ (Дно сушки)";
        } else {
          points[ex.idx].isDehumNow = false;
          points[ex.idx].phaseActionRu = "Отдача влаги от хребта ↑ (Пик паузы)";
        }
      });

      // 3. Анализ ветвей подъема (паузы) и ветвей осушения (компрессор AIM) по экстремумам
      const risingBranches = [];
      const fallingBranches = [];
      for (let k = 1; k < extrema.length; k++) {
        const prevEx = extrema[k - 1];
        const currEx = extrema[k];
        const durMin = Math.max(1, Math.round(currEx.pt.elapsedMin - prevEx.pt.elapsedMin));
        if (prevEx.type === "min" && currEx.type === "max") {
          // Учитываем активную фазу подъема (до достижения плато -0.8% от пика)
          let activeEndIdx = currEx.idx;
          for (let m = prevEx.idx + 1; m <= currEx.idx; m++) {
            if (points[m].rhPct >= currEx.pt.rhPct - 0.8 || points[m].rhPct >= 84.5) {
              activeEndIdx = m;
              break;
            }
          }
          const activeDurMin = Math.max(1, Math.round(points[activeEndIdx].elapsedMin - prevEx.pt.elapsedMin));
          const deltaRh = Math.max(0.1, Math.round((points[activeEndIdx].rhPct - prevEx.pt.rhPct) * 10) / 10);
          const rate = Math.round((deltaRh / activeDurMin) * 100) / 100;
          risingBranches.push({
            startIdx: prevEx.idx,
            endIdx: currEx.idx,
            rapidIdx: activeEndIdx,
            startPt: prevEx.pt,
            rapidPt: points[activeEndIdx],
            peakPt: currEx.pt,
            deltaRh,
            durMin: activeDurMin,
            fullDurMin: durMin,
            rate
          });
        } else if (prevEx.type === "max" && currEx.type === "min") {
          const deltaRh = Math.max(0.1, Math.round((prevEx.pt.rhPct - currEx.pt.rhPct) * 10) / 10);
          const rate = Math.round((deltaRh / durMin) * 100) / 100;
          fallingBranches.push({
            startIdx: prevEx.idx,
            endIdx: currEx.idx,
            startPt: prevEx.pt,
            endPt: currEx.pt,
            deltaRh,
            durMin,
            rate
          });
        }
      }

      // Поиск самого выраженного скачка влажности в паузе (от локального минимума сушки к пику паузы)
      let bestStartIdx = 0;
      let bestPeakIdx = 1;
      let bestDeltaRh = -1;

      for (let i = 0; i < n - 1; i++) {
        let j = i;
        while (j + 1 < n && points[j + 1].rhPct >= points[j].rhPct - 0.5) {
          j++;
        }
        if (j > i) {
          const dRh = points[j].rhPct - points[i].rhPct;
          if (dRh > bestDeltaRh) {
            bestDeltaRh = dRh;
            bestStartIdx = i;
            bestPeakIdx = j;
          }
        }
      }

      let startPt = points[bestStartIdx];
      let peakPt = points[bestPeakIdx];
      let rapidEndIdx = bestPeakIdx;
      for (let k = bestStartIdx + 1; k <= bestPeakIdx; k++) {
        if (points[k].rhPct >= 84.5 || points[k].rhPct >= peakPt.rhPct - 0.8) {
          rapidEndIdx = k;
          break;
        }
      }
      let rapidPt = points[rapidEndIdx];

      // Если есть более крупный зуб по risingBranches — берем его
      if (risingBranches.length > 0) {
        let maxRb = risingBranches[0];
        risingBranches.forEach(rb => {
          if (rb.deltaRh > maxRb.deltaRh) maxRb = rb;
        });
        if (maxRb.deltaRh > (rapidPt.rhPct - startPt.rhPct)) {
          startPt = maxRb.startPt;
          rapidPt = maxRb.rapidPt;
          peakPt = maxRb.peakPt;
        }
      }

      const jumpDeltaRh = Math.max(0, Math.round((rapidPt.rhPct - startPt.rhPct) * 10) / 10);
      const jumpDurationMin = Math.max(1, Math.round(rapidPt.elapsedMin - startPt.elapsedMin));
      const riseRatePerMin = Math.round((jumpDeltaRh / jumpDurationMin) * 100) / 100;

      const avgRiseRatePerMin = risingBranches.length > 0
        ? Math.round((risingBranches.reduce((acc, b) => acc + b.rate, 0) / risingBranches.length) * 100) / 100
        : riseRatePerMin;

      // Скорость осушения компрессором AIM (-%/мин вниз при включении холода)
      let bestDropStartRh = maxRh;
      let bestDropEndRh = minRh;
      let bestDropDeltaRh = Math.round((maxRh - minRh) * 10) / 10;
      let bestDropDurationMin = 30;
      let avgPullDownRatePerMin = 0.55;
      let maxPullDownRatePerMin = 1.2;

      if (fallingBranches.length > 0) {
        let deepestBranch = fallingBranches[0];
        let fastestBranch = fallingBranches[0];
        fallingBranches.forEach(fb => {
          if (fb.deltaRh > deepestBranch.deltaRh) deepestBranch = fb;
          if (fb.rate > fastestBranch.rate) fastestBranch = fb;
        });
        bestDropStartRh = deepestBranch.startPt.rhPct;
        bestDropEndRh = deepestBranch.endPt.rhPct;
        bestDropDeltaRh = deepestBranch.deltaRh;
        bestDropDurationMin = deepestBranch.durMin;
        avgPullDownRatePerMin = Math.round((fallingBranches.reduce((acc, b) => acc + b.rate, 0) / fallingBranches.length) * 100) / 100;
        maxPullDownRatePerMin = fastestBranch.rate;
      }

      // Число микроциклов (зубцов пилы) и больших фаз глубокой сушки
      const peaksCount = extrema.filter(e => e.type === "max").length;
      const microCyclesCount = Math.max(1, peaksCount);
      const avgCyclePeriodMin = Math.max(5, Math.round(totalLogMin / microCyclesCount));

      // Большие фазы сушки (сгон до рабочей полки <= 63.5% rH или непрерывный сгон >= 25 мин)
      let macroDryingPhasesCount = 0;
      let lastMacroIdx = -999;
      fallingBranches.forEach(fb => {
        if (fb.endPt.rhPct <= 63.5 || fb.durMin >= 25) {
          if (fb.endIdx - lastMacroIdx >= 5) {
            macroDryingPhasesCount++;
            lastMacroIdx = fb.endIdx;
          }
        }
      });
      if (macroDryingPhasesCount === 0) macroDryingPhasesCount = 1;

      // 4. Индекс высыхания рыбы (Сравнение первой трети и последней трети лога)
      const thirdCount = Math.max(2, Math.floor(n / 3));
      const firstThirdPts = points.slice(0, thirdCount);
      const lastThirdPts = points.slice(n - thirdCount);
      const firstThirdAvgRh = Math.round((firstThirdPts.reduce((s, p) => s + p.rhPct, 0) / firstThirdPts.length) * 10) / 10;
      const lastThirdAvgRh = Math.round((lastThirdPts.reduce((s, p) => s + p.rhPct, 0) / lastThirdPts.length) * 10) / 10;
      const avgRhDelta = Math.round((lastThirdAvgRh - firstThirdAvgRh) * 10) / 10;

      const rbFirst = risingBranches.filter(b => b.endIdx <= thirdCount);
      const rbLast = risingBranches.filter(b => b.startIdx >= n - thirdCount - 2);
      const firstThirdRiseRate = rbFirst.length > 0
        ? Math.round((rbFirst.reduce((s, b) => s + b.rate, 0) / rbFirst.length) * 100) / 100
        : riseRatePerMin;
      const lastThirdRiseRate = rbLast.length > 0
        ? Math.round((rbLast.reduce((s, b) => s + b.rate, 0) / rbLast.length) * 100) / 100
        : avgRiseRatePerMin;
      const reboundRateChangePct = Math.round(((lastThirdRiseRate - firstThirdRiseRate) / Math.max(0.05, firstThirdRiseRate)) * 100);

      let dryingIndexSummaryText = "";
      if (reboundRateChangePct <= -8) {
        dryingIndexSummaryText = `Скорость отскока снизилась на ${Math.abs(reboundRateChangePct)}% — свободной влаги у хребта стало меньше`;
      } else if (reboundRateChangePct >= 8) {
        dryingIndexSummaryText = `Отскок ускорился на +${reboundRateChangePct}% — активный выход глубокой влаги из спинки`;
      } else {
        dryingIndexSummaryText = `Стабильный темп диффузии влаги (изм. ${reboundRateChangePct >= 0 ? "+" : ""}${reboundRateChangePct}%)`;
      }

      // 5. ИСПРАВЛЕННЫЙ РАСЧЕТ ПАУЗЫ: длительность ТОЛЬКО ОДНОЙ максимальной непрерывной фазы подряд (>75% rH) без сгона влажности вниз!
      let maxContinuousPauseMin = 0;
      let maxPauseStartPt = points[0];
      let maxPauseEndPt = points[0];
      let maxPausePeakRh = maxRh;

      let curPauseMin = 0;
      let curPauseStartPt = null;
      let curPausePeakRh = 0;

      for (let i = 1; i < n; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const dt = Math.max(1, Math.min(60, Math.round(curr.elapsedMin - prev.elapsedMin)));
        const stepDelta = curr.rhPct - prev.rhPct;
        // Сгон влажности вниз компрессором: падение за шаг >= 2.0% rH или сгон на >= 3.0% rH ниже пика текущей паузы
        const isPullDownDownward = (stepDelta <= -2.0) || (curPausePeakRh > 0 && (curPausePeakRh - curr.rhPct) >= 3.0);

        if (curr.rhPct >= 75.0 && !isPullDownDownward) {
          if (curPauseMin === 0) {
            curPauseStartPt = prev.rhPct >= 70.0 ? prev : curr;
            curPausePeakRh = curr.rhPct;
          }
          if (curr.rhPct > curPausePeakRh) {
            curPausePeakRh = curr.rhPct;
          }
          curPauseMin += dt;
          if (curPauseMin > maxContinuousPauseMin) {
            maxContinuousPauseMin = curPauseMin;
            maxPauseStartPt = curPauseStartPt;
            maxPauseEndPt = curr;
            maxPausePeakRh = curPausePeakRh;
          }
        } else {
          curPauseMin = 0;
          curPauseStartPt = null;
          curPausePeakRh = 0;
        }
      }

      const pauseDurationHours = Math.round((maxContinuousPauseMin / 60.0) * 100) / 100;
      const maxPauseWindowStr = maxContinuousPauseMin > 0
        ? `${maxPauseStartPt.shortTime} → ${maxPauseEndPt.shortTime} (пик ${maxPausePeakRh}%)`
        : `Нет фаз >75% rH (макс ${maxRh}%)`;

      // Автоматический вердикт технологу по переходу на следующую стадию
      const curStage = CURING_STAGES[state.telemetry.stageKey];
      const curSpecies = FISH_SPECIES[state.telemetry.speciesKey];
      let verdictStatus = "WARNING";
      let verdictTitle = "";
      let verdictText = "";
      let recommendedNextStageKey = null;

      if (curStage.key !== "STAGE_4" && pauseDurationHours > 2.0) {
        verdictStatus = "CRITICAL";
        verdictTitle = `⛔ АВАРИЯ ЗАКРЫТОГО КОНТУРА: Непрерывная пауза длилась ${maxContinuousPauseMin} мин (${pauseDurationHours} ч) подряд без сгона вниз!`;
        verdictText = `По логу Parkside зафиксирована ОДНА непрерывная фаза высокой влажности (>75% rH) длительностью ${maxContinuousPauseMin} мин (${pauseDurationHours} ч, участок ${maxPauseWindowStr}) без включения осушения — это нарушение жесткого биофизического правила закрытого контура (макс 1.5–2.0 ч на Стадиях 1–3)! При 85% rH дефицит VPD падает к нулю и рыба задыхается. Немедленно включите осушение на 30 Гц (9.0V) и сократите паузу в контроллере MCGS до ${curStage.defaultPauseHours} ч!`;
      } else if (curStage.key === "STAGE_1") {
        if (minRh <= 64.0 && maxRh <= 76.0) {
          verdictStatus = "OPTIMAL";
          recommendedNextStageKey = "STAGE_2";
          verdictTitle = `✅ ВЕРДИКТ ПО ЛОГУ: Верховая влага снята — ПОРА ПЕРЕХОДИТЬ НА СТАДИЮ 2!`;
          verdictText = `Рабочая полка сушки опустилась до ${minRh}% rH, отскок влажности в паузе ${startPt.rhPct}% → ${rapidPt.rhPct}% за ${jumpDurationMin} мин (+${riseRatePerMin} %/мин, макс. непрерывная пауза ${maxContinuousPauseMin} мин / ${pauseDurationHours} ч ≤ 2.0 ч). Свободная поверхностная вода удалена. Отключайте Контур №2 и переводите MCGS на Стадию 2 (Контур №1, 3.0 ч сушка 30 Гц / 1.5 ч пауза 18–20 Гц).`;
        } else {
          verdictStatus = "WARNING";
          verdictTitle = `⏳ ВЕРДИКТ ПО ЛОГУ: Переход на Стадию 2 ПРЕЖДЕВРЕМЕНЕН — продолжайте Стадию 1`;
          verdictText = `В паузах влажность поднимается со скоростью +${avgRiseRatePerMin} %/мин (макс. скачок ${startPt.rhPct}% → ${rapidPt.rhPct}% за ${jumpDurationMin} мин), осушение компрессором идет со скоростью -${avgPullDownRatePerMin} %/мин (${microCyclesCount} микроциклов, ${macroDryingPhasesCount} больших фаз сушки; макс. непрерывная пауза ${maxContinuousPauseMin} мин = ${pauseDurationHours} ч — в норме ≤ 2.0 ч). Оставайтесь на Стадии 1.`;
        }
      } else if (curStage.key === "STAGE_2") {
        if (minRh <= 58.5 && maxRh <= 73.0 && avgRiseRatePerMin < 0.65) {
          verdictStatus = "OPTIMAL";
          recommendedNextStageKey = "STAGE_3";
          verdictTitle = `✅ ВЕРДИКТ ПО ЛОГУ: Основная влага от хребта вытянута — ПОРА ПЕРЕХОДИТЬ НА СТАДИЮ 3!`;
          verdictText = `Полка сушки стабильна на ${minRh}% rH, а скорость подъема влажности в паузе замедлилась до +${avgRiseRatePerMin} %/мин. Переводите партию ${curSpecies.titleRu} на Стадию 3 (дожим спинки: 2.5 ч сушка 30 Гц / 2.0 ч пауза 15–18 Гц, строго не длиннее 2.0 ч паузы!).`;
        } else {
          verdictStatus = "WARNING";
          verdictTitle = `⏳ ВЕРДИКТ ПО ЛОГУ: Активная циклическая вытяжка от хребта (${microCyclesCount} циклов, пауза макс ${maxContinuousPauseMin} мин / ${pauseDurationHours} ч ≤ 2 ч) — ДЕРЖАТЬ РЕЖИМ!`;
          verdictText = `За ${totalLogHours} ч лога отработано ${microCyclesCount} микроциклов (зубцов пилы) и ${macroDryingPhasesCount} больших фаз глубокой сушки (до ${minRh}% rH при сред. Т=${avgTemp}°C). Скорость отдачи влаги рыбой в паузах: +${avgRiseRatePerMin} %/мин вверх (1-я треть +${firstThirdRiseRate} → финал +${lastThirdRiseRate} %/мин, ${reboundRateChangePct >= 0 ? "+" : ""}${reboundRateChangePct}%), осушение компрессором AIM: -${avgPullDownRatePerMin} %/мин вниз. Самая длинная непрерывная пауза без сгона влажности составила ${maxContinuousPauseMin} мин (${pauseDurationHours} ч) — правило закрытого контура (≤ 2.0 ч) полностью соблюдено!`;
        }
      } else if (curStage.key === "STAGE_3") {
        if (minRh <= 54.0 && maxRh <= 67.0) {
          verdictStatus = "OPTIMAL";
          recommendedNextStageKey = "STAGE_4";
          verdictTitle = `✅ ВЕРДИКТ ПО ЛОГУ: Дожим спинки завершен — ПЕРЕВОДИТЕ НА СТАДИЮ 4 (ОТВОЛАЖИВАНИЕ / СТАБИЛИЗАЦИЯ ЖИРНОЙ РЫБЫ)!`;
          verdictText = `Полка сушки вышла на ${minRh}% rH (норма 50–54%), а отскок в паузе не превышает ${maxRh}% (+${avgRiseRatePerMin} %/мин). Влага у хребта дожата. Переводите камеру на Стадию 4 — фазу отволаживания (стабилизации): 4 часа отдых (15–20 Гц) / 1 час забор влаги при +13…+15°C и оборотах Cantoni 25.3 Гц перед упаковкой на KOMET PlusVac 25.`;
        } else {
          verdictStatus = "WARNING";
          verdictTitle = `⏳ ВЕРДИКТ ПО ЛОГУ: Продолжайте Стадию 3 (отработано ${microCyclesCount} циклов, макс. непрерывная пауза ${maxContinuousPauseMin} мин / ${pauseDurationHours} ч)`;
          verdictText = `Спинка еще отдает внутреннюю влагу (+${avgRiseRatePerMin} %/мин вверх в паузах, осушение -${avgPullDownRatePerMin} %/мин вниз, дно сушки ${minRh}% rH). Продолжайте Стадию 3 (2.5 ч сушка / 2.0 ч пауза на Контуре №1).`;
        }
      } else {
        if (avgTemp <= 15.2 && maxRh <= 60.0) {
          verdictStatus = "OPTIMAL";
          verdictTitle = `✅ ВЕРДИКТ ПО ЛОГУ: Отволаживание (4ч отдых / 1ч забор влаги на 25.3 Гц, Т=${avgTemp}°C) завершено — ВЫГРУЖАТЬ НА KOMET PlusVac 25!`;
          verdictText = `Градиент влажности между позвоночником и чешуей полностью выровнен, тушка охлаждена до ${avgTemp}°C. Партия готова к вакуумной упаковке на KOMET PlusVac 25!`;
        } else {
          verdictStatus = "WARNING";
          verdictTitle = `⏳ ВЕРДИКТ ПО ЛОГУ: Идет климатическое выравнивание при Т=${avgTemp}°C (${microCyclesCount} зубцов пилы, ${macroDryingPhasesCount} фаз сгона)`;
          verdictText = `Средняя температура по логу ${avgTemp}°C (коридор ${minTemp}..${maxTemp}°C), скорость отдачи в паузах изменилась с +${firstThirdRiseRate} до +${lastThirdRiseRate} %/мин (${reboundRateChangePct >= 0 ? "+" : ""}${reboundRateChangePct}%), макс. непрерывная пауза без сгона вниз: ${maxContinuousPauseMin} мин (${pauseDurationHours} ч). Доведите стабилизацию rH ≤ 56–58% при +13…+15°C (Cantoni 25.3 Гц) перед подачей на KOMET PlusVac 25.`;
        }
      }

      return {
        fileName,
        points,
        minRh,
        maxRh,
        minTemp,
        maxTemp,
        avgTemp,
        minDewPoint,
        maxDewPoint,
        avgDewPoint,
        minVpd,
        maxVpd,
        avgVpd,
        totalLogMin,
        totalLogHours,
        startPt,
        rapidPt,
        peakPt,
        jumpDeltaRh,
        jumpDurationMin,
        riseRatePerMin,
        avgRiseRatePerMin,
        bestDropStartRh,
        bestDropEndRh,
        bestDropDeltaRh,
        bestDropDurationMin,
        avgPullDownRatePerMin,
        maxPullDownRatePerMin,
        microCyclesCount,
        macroDryingPhasesCount,
        avgCyclePeriodMin,
        firstThirdAvgRh,
        lastThirdAvgRh,
        avgRhDelta,
        firstThirdRiseRate,
        lastThirdRiseRate,
        reboundRateChangePct,
        dryingIndexSummaryText,
        maxContinuousPauseMin,
        pauseDurationHours,
        maxPauseWindowStr,
        maxPausePeakRh,
        verdictStatus,
        verdictTitle,
        verdictText,
        recommendedNextStageKey
      };
    }

    function setParksideZoom(mode) {
      triggerHaptic(12);
      parksideViewState.zoomMode = mode;
      if (mode === "all") {
        parksideViewState.panPercent = 100;
      } else {
        // При нажатии "Последние 12 часов" или "Последние 4 часа" ставим окно в конец лога (100%)
        parksideViewState.panPercent = 100;
      }
      const slider = document.getElementById("parkside-pan-slider");
      if (slider) slider.value = String(parksideViewState.panPercent);
      if (activeParksideAnalysis) {
        renderParksideSvgOnly(activeParksideAnalysis);
      }
    }

    function onParksidePanInput(val) {
      triggerHaptic(10, true);
      const pct = Math.min(100, Math.max(0, Number(val)));
      parksideViewState.panPercent = pct;
      // Если пользователь двигает ползунок в режиме "Весь лог (100%)", автоматически включаем детальный зум 4 часа для просмотра зубцов пилы
      if (parksideViewState.zoomMode === "all") {
        parksideViewState.zoomMode = "4h";
      }
      if (activeParksideAnalysis) {
        renderParksideSvgOnly(activeParksideAnalysis);
      }
    }

    function stepParksidePan(deltaPct) {
      triggerHaptic(12);
      if (parksideViewState.zoomMode === "all") {
        parksideViewState.zoomMode = "4h";
        parksideViewState.panPercent = Math.min(100, Math.max(0, 100 + deltaPct));
      } else {
        parksideViewState.panPercent = Math.min(100, Math.max(0, parksideViewState.panPercent + deltaPct));
      }
      const slider = document.getElementById("parkside-pan-slider");
      if (slider) slider.value = String(parksideViewState.panPercent);
      if (activeParksideAnalysis) {
        renderParksideSvgOnly(activeParksideAnalysis);
      }
    }

    function getVisibleParksideSlice(analysis) {
      const pts = analysis.points;
      const n = pts.length;
      if (parksideViewState.zoomMode === "all" || n <= 6) {
        return { viewPts: pts, startIdx: 0, endIdx: n - 1, windowHours: analysis.totalLogHours };
      }

      const targetHours = parksideViewState.zoomMode === "12h" ? 12.0 : 4.0;
      const targetMin = targetHours * 60.0;
      const totalMin = Math.max(1, pts[n - 1].elapsedMin - pts[0].elapsedMin);

      if (totalMin <= targetMin * 1.05) {
        // Для коротких демо-логов берем пропорциональное окно точек (60% для 12ч, 35% для 4ч), чтобы зум и прокрутка работали наглядно
        const winCount = Math.max(4, Math.round(n * (parksideViewState.zoomMode === "12h" ? 0.6 : 0.35)));
        const maxStart = Math.max(0, n - winCount);
        const startIdx = Math.round((parksideViewState.panPercent / 100.0) * maxStart);
        const endIdx = Math.min(n - 1, startIdx + winCount - 1);
        const wHours = Math.round(((pts[endIdx].elapsedMin - pts[startIdx].elapsedMin) / 60.0) * 10) / 10;
        return { viewPts: pts.slice(startIdx, endIdx + 1), startIdx, endIdx, windowHours: wHours };
      }

      const maxStartMin = Math.max(0, totalMin - targetMin);
      const winStartMin = pts[0].elapsedMin + (parksideViewState.panPercent / 100.0) * maxStartMin;
      const winEndMin = winStartMin + targetMin;

      let startIdx = 0;
      while (startIdx < n - 4 && pts[startIdx].elapsedMin < winStartMin) startIdx++;
      let endIdx = startIdx;
      while (endIdx + 1 < n && pts[endIdx + 1].elapsedMin <= winEndMin + 0.1) endIdx++;
      if (endIdx - startIdx < 3) endIdx = Math.min(n - 1, startIdx + 3);

      const wHours = Math.round(((pts[endIdx].elapsedMin - pts[startIdx].elapsedMin) / 60.0) * 10) / 10;
      return { viewPts: pts.slice(startIdx, endIdx + 1), startIdx, endIdx, windowHours: wHours };
    }

    function buildSmoothSvgPath(coords) {
      if (!coords || coords.length === 0) return "";
      if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
      if (coords.length === 2) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`;

      // Монотонный кубический сплайн без перехлестов за экстремумы (Чистая плавная линия)
      let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[Math.max(0, i - 1)];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[Math.min(coords.length - 1, i + 2)];

        const dx = p2.x - p1.x;
        let m1y = (p2.y - p0.y) * 0.16;
        let m2y = (p3.y - p1.y) * 0.16;

        // Зажимаем касательные на локальных экстремумах, чтобы кривая не давала ложных выбросов
        if ((p2.y - p1.y) * (p1.y - p0.y) <= 0) m1y = 0;
        if ((p3.y - p2.y) * (p2.y - p1.y) <= 0) m2y = 0;

        const cp1x = p1.x + dx / 3.0;
        const cp1y = p1.y + m1y;
        const cp2x = p2.x - dx / 3.0;
        const cp2y = p2.y - m2y;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      return d;
    }

    function updateParksideCrosshairHud(pt, totalCount) {
      const hud = document.getElementById("parkside-crosshair-hud");
      if (!hud || !pt) return;
      const isDehum = pt.isDehumNow;
      const actionColor = isDehum ? "var(--cyan-dew)" : "var(--amber-curing)";
      const actionBg = isDehum ? "rgba(0, 56, 68, 0.85)" : "rgba(71, 42, 0, 0.85)";
      const rateSign = pt.stepRatePerMin > 0 ? `+${pt.stepRatePerMin}` : `${pt.stepRatePerMin}`;
      const elapsedHours = (pt.elapsedMin / 60.0).toFixed(1);

      hud.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span style="color:var(--cyan-dew); font-weight:800; font-size:13.5px;">🎯 Точка #${pt.idx}/${totalCount}</span>
          <span>🕒 <b>${pt.fullTime}</b> <span style="color:var(--steel-text-secondary);">(${elapsedHours} ч)</span></span>
          <span style="background:rgba(0,229,255,0.12); border:1px solid rgba(0,229,255,0.35); padding:2px 8px; border-radius:6px;">💧 rH: <b style="color:var(--cyan-dew); font-size:15.5px;">${pt.rhPct.toFixed(1)}%</b></span>
          <span style="background:rgba(255,167,38,0.12); border:1px solid rgba(255,167,38,0.35); padding:2px 8px; border-radius:6px;">🌡 Temp: <b style="color:var(--amber-curing); font-size:15.5px;">${pt.tempC.toFixed(1)}°C</b></span>
          <span style="background:rgba(46,229,157,0.12); border:1px solid rgba(46,229,157,0.35); padding:2px 8px; border-radius:6px;">💦 Т.росы: <b style="color:#2EE59D; font-size:14.5px;">${pt.dewPointC.toFixed(1)}°C</b></span>
          <span>🌬 VPD: <b style="color:#F0F6FC; font-size:14.5px;">${pt.vpdKpa.toFixed(2)} кПа</b></span>
        </div>
        <div style="background:${actionBg}; border:1px solid ${actionColor}; color:${actionColor}; padding:4px 12px; border-radius:999px; font-weight:800; font-size:12.5px;">
          ${isDehum ? "❄ Осушение ↓ (компрессор)" : "💧 Отдача от хребта ↑"} (${rateSign} %/мин)
        </div>
      `;
    }

    let _lastParksideCrosshairIdx = -1;
    function onParksideSvgMouseMove(evt) {
      const svg = document.getElementById("parkside-main-svg");
      const geom = parksideViewState.chartGeom;
      const viewPts = parksideViewState.currentViewPts;
      if (!svg || !geom || !viewPts || viewPts.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const clientX = (evt.touches && evt.touches.length > 0)
        ? evt.touches[0].clientX
        : ((evt.changedTouches && evt.changedTouches.length > 0) ? evt.changedTouches[0].clientX : evt.clientX);
      if (typeof clientX !== "number") return;
      const relX = ((clientX - rect.left) / Math.max(1, rect.width)) * geom.W;
      const clampedX = Math.min(geom.W - geom.padR, Math.max(geom.padL, relX));
      const ratio = (clampedX - geom.padL) / Math.max(1, geom.plotW);
      const localIdx = Math.min(viewPts.length - 1, Math.max(0, Math.round(ratio * (viewPts.length - 1))));
      if (localIdx !== _lastParksideCrosshairIdx) {
        _lastParksideCrosshairIdx = localIdx;
        if (evt.touches || evt.changedTouches) {
          triggerHaptic(8, true);
        }
      }
      const pt = viewPts[localIdx];

      const cx = geom.xFor(localIdx);
      const cyRh = geom.yForRh(pt.rhPct);
      const cyTemp = geom.yForTemp(pt.tempC);

      const g = document.getElementById("parkside-crosshair-group");
      const line = document.getElementById("parkside-crosshair-line");
      const hline = document.getElementById("parkside-crosshair-hline");
      const rhDot = document.getElementById("parkside-crosshair-rh-dot");
      const tempDot = document.getElementById("parkside-crosshair-temp-dot");
      const badgeBg = document.getElementById("parkside-crosshair-badge-bg");
      const badgeTxt = document.getElementById("parkside-crosshair-badge-txt");

      if (g && line && rhDot && tempDot) {
        g.style.display = "block";
        line.setAttribute("x1", cx.toFixed(1));
        line.setAttribute("x2", cx.toFixed(1));
        if (hline) {
          hline.setAttribute("y1", cyRh.toFixed(1));
          hline.setAttribute("y2", cyRh.toFixed(1));
        }
        rhDot.setAttribute("cx", cx.toFixed(1));
        rhDot.setAttribute("cy", cyRh.toFixed(1));
        tempDot.setAttribute("cx", cx.toFixed(1));
        tempDot.setAttribute("cy", cyTemp.toFixed(1));

        if (badgeBg && badgeTxt) {
          const shortAction = pt.isDehumNow ? "Осушение ↓" : "Отдача от хребта ↑";
          const labelStr = `${pt.shortDateTime} • ${pt.rhPct}% • ${pt.tempC}°C • ${shortAction}`;
          const bw = Math.max(210, labelStr.length * 6.3 + 16);
          const bx = Math.min(geom.W - geom.padR - bw, Math.max(geom.padL, cx - bw / 2));
          badgeBg.setAttribute("x", bx.toFixed(1));
          badgeBg.setAttribute("width", bw.toFixed(1));
          badgeTxt.setAttribute("x", (bx + bw / 2).toFixed(1));
          badgeTxt.textContent = labelStr;
        }
      }

      updateParksideCrosshairHud(pt, activeParksideAnalysis ? activeParksideAnalysis.points.length : viewPts.length);
    }

    function onParksideSvgMouseLeave() {
      const g = document.getElementById("parkside-crosshair-group");
      if (g) g.style.display = "none";
    }

    function renderParksideSvgOnly(analysis) {
      if (!analysis) return;

      // Подсветка кнопок масштаба
      ["all", "12h", "4h"].forEach(m => {
        const el = document.getElementById(`btn-parkside-zoom-${m}`);
        if (el) el.className = `chip ${parksideViewState.zoomMode === m ? "active-cyan" : ""}`;
      });

      const slice = getVisibleParksideSlice(analysis);
      const viewPts = slice.viewPts;
      const vLen = viewPts.length;
      parksideViewState.currentViewPts = viewPts;

      const winLabelEl = document.getElementById("parkside-window-label");
      if (winLabelEl && vLen > 0) {
        if (parksideViewState.zoomMode === "all") {
          winLabelEl.textContent = `Весь лог (${vLen} тчк • ${analysis.totalLogHours} ч)`;
        } else {
          winLabelEl.textContent = `${viewPts[0].shortDateTime} — ${viewPts[vLen - 1].shortDateTime} (${slice.windowHours} ч • ${vLen} тчк)`;
        }
      }

      // Инициализируем табло прицела последней точкой окна по умолчанию
      if (vLen > 0) {
        updateParksideCrosshairHud(viewPts[vLen - 1], analysis.points.length);
      }

      // Размеры SVG с правой шкалой градусов °C
      const W = 860, H = 265, padL = 48, padR = 52, padT = 26, padB = 36;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      // Правая шкала температуры °C: 6°C..24°C (по 3°C на каждую из 6 линий сетки 40%..100% rH)
      const tempMinAxis = analysis.minTemp < 6.0 ? 0.0 : 6.0;
      const tempMaxAxis = analysis.maxTemp > 24.0 ? 30.0 : 24.0;
      const tempSpan = tempMaxAxis - tempMinAxis;

      const xFor = i => padL + (vLen <= 1 ? plotW / 2 : (i / (vLen - 1)) * plotW);
      const yForRh = rh => padT + plotH - ((Math.min(100, Math.max(40, rh)) - 40) / 60.0) * plotH;
      const yForTemp = tc => padT + plotH - ((Math.min(tempMaxAxis, Math.max(tempMinAxis, tc)) - tempMinAxis) / tempSpan) * plotH;

      parksideViewState.chartGeom = { W, H, padL, padR, padT, padB, plotW, plotH, xFor, yForRh, yForTemp };

      const rhCoords = viewPts.map((p, i) => ({ x: xFor(i), y: yForRh(p.rhPct) }));
      const tempCoords = viewPts.map((p, i) => ({ x: xFor(i), y: yForTemp(p.tempC) }));

      const rhPathD = buildSmoothSvgPath(rhCoords);
      const rhAreaD = `${rhPathD} L ${xFor(vLen - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
      const tempPathD = buildSmoothSvgPath(tempCoords);
      const y85 = yForRh(85.0).toFixed(1);

      // Горизонтальная сетка + Левая шкала rH% + Правая шкала Temp °C
      const gridLines = [40, 50, 60, 70, 80, 90, 100].map(rhVal => {
        const y = yForRh(rhVal).toFixed(1);
        const tVal = tempMinAxis + ((rhVal - 40) / 60.0) * tempSpan;
        return `
          <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(159,179,200,0.15)" stroke-width="1" />
          <text x="${padL - 7}" y="${Number(y) + 3.5}" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="10" text-anchor="end">${rhVal}%</text>
          <text x="${W - padR + 7}" y="${Number(y) + 3.5}" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="start">${tVal.toFixed(0)}°C</text>
        `;
      }).join("");

      // 1) УБИРАЕМ КАШУ КРУЖКОВ И ТЕКСТА:
      // Если в логе > 50 точек — рисуем кружки ТОЛЬКО на локальных пиках (максимумах пауз) и минимумах (дне сушки)!
      const isLargeLog = analysis.points.length > 50;
      const markerItems = [];
      for (let i = 0; i < vLen; i++) {
        const p = viewPts[i];
        if (!isLargeLog || p.extremumType === "max" || p.extremumType === "min") {
          markerItems.push({ localIdx: i, p, cx: xFor(i), cy: yForRh(p.rhPct) });
        }
      }

      // Анти-коллизия текстовых подписей rH% над пиками и под минимумами (минимальный шаг 52px по X)
      const labeledIndices = new Set();
      let lastPeakLabelX = -999;
      let lastMinLabelX = -999;
      const minGapPx = vLen > 120 ? 58 : (vLen > 45 ? 44 : 32);

      markerItems.forEach(item => {
        if (item.p.extremumType === "max" || (!isLargeLog && item.localIdx % 2 === 0)) {
          if (item.cx - lastPeakLabelX >= minGapPx) {
            labeledIndices.add(item.localIdx);
            lastPeakLabelX = item.cx;
          }
        } else if (item.p.extremumType === "min") {
          if (item.cx - lastMinLabelX >= minGapPx) {
            labeledIndices.add(item.localIdx);
            lastMinLabelX = item.cx;
          }
        }
      });

      const markersSvg = markerItems.map(item => {
        const { localIdx, p, cx, cy } = item;
        const isPeak = p.extremumType === "max";
        const isMin = p.extremumType === "min";
        const isDanger = p.rhPct >= 84.5;
        const fillCol = isDanger ? "#FF5252" : (isMin ? "#2EE59D" : (isPeak ? "#FFA726" : "#00E5FF"));
        const radius = vLen > 150 ? 2.9 : (isDanger ? 4.3 : 3.6);
        const showValLabel = labeledIndices.has(localIdx);
        const labelY = isMin ? (cy + 13).toFixed(1) : (cy - 7).toFixed(1);

        return `
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius}" fill="${fillCol}" stroke="#08111D" stroke-width="1.3" />
          ${showValLabel ? `<text x="${cx.toFixed(1)}" y="${labelY}" fill="${fillCol}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">${p.rhPct}%</text>` : ""}
        `;
      }).join("");

      // 2) РАВНОМЕРНАЯ ШКАЛА ВРЕМЕНИ ПО ОСИ X (7–8 меток, НИКОГДА не налезают друг на друга!)
      const numXTicks = Math.min(8, vLen);
      const showDateOnAxis = slice.windowHours > 14.0 || (viewPts[0].shortDateTime.slice(0, 5) !== viewPts[vLen - 1].shortDateTime.slice(0, 5));
      const xAxisTicksSvg = [];
      for (let k = 0; k < numXTicks; k++) {
        const idx = numXTicks <= 1 ? 0 : Math.round((k * (vLen - 1)) / (numXTicks - 1));
        const pt = viewPts[idx];
        const tx = xFor(idx).toFixed(1);
        const timeText = showDateOnAxis ? pt.shortDateTime : pt.shortTime;
        const anchor = k === 0 ? "start" : (k === numXTicks - 1 ? "end" : "middle");
        xAxisTicksSvg.push(`
          <line x1="${tx}" y1="${padT + plotH}" x2="${tx}" y2="${padT + plotH + 5}" stroke="#9FB3C8" stroke-width="1" />
          <text x="${tx}" y="${H - 10}" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="10" font-weight="600" text-anchor="${anchor}">${timeText}</text>
        `);
      }

      document.getElementById("parkside-svg-container").innerHTML = `
        <svg id="parkside-main-svg" viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; min-width:580px; display:block; cursor:crosshair; user-select:none;"
             onmousemove="onParksideSvgMouseMove(event)" ontouchstart="onParksideSvgMouseMove(event)" ontouchmove="onParksideSvgMouseMove(event)" onmouseleave="onParksideSvgMouseLeave()">
          <defs>
            <linearGradient id="rhGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.30"/>
              <stop offset="100%" stop-color="#00E5FF" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <!-- Заголовки левой шкалы (%) и правой шкалы (°C) -->
          <text x="${padL - 7}" y="12" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="end">rH%</text>
          <text x="${W - padR + 7}" y="12" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="start">Temp °C</text>

          ${gridLines}

          <!-- Порог удушья 85% rH -->
          <line x1="${padL}" y1="${y85}" x2="${W - padR}" y2="${y85}" stroke="#FF5252" stroke-width="1.5" stroke-dasharray="6,4" />
          <text x="${W - padR - 6}" y="${Number(y85) - 5}" fill="#FF5252" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="end">85% rH (Порог удушья рыбы в паузе)</text>

          <!-- Плавная заливка и чистая линия влажности rH% -->
          <path d="${rhAreaD}" fill="url(#rhGrad)" />
          <path d="${rhPathD}" fill="none" stroke="#00E5FF" stroke-width="${vLen > 200 ? '1.8' : '2.4'}" stroke-linejoin="round" stroke-linecap="round" />

          <!-- Чистая плавная линия температуры Temp °C (привязана к правой шкале °C) -->
          <path d="${tempPathD}" fill="none" stroke="#FFA726" stroke-width="2.1" stroke-dasharray="5,2.5" stroke-linejoin="round" stroke-linecap="round" />

          <!-- Точки только на локальных пиках пауз и минимумах сушки -->
          ${markersSvg}

          <!-- Равномерные подписи времени по оси X -->
          ${xAxisTicksSvg.join("")}

          <!-- Живой перекрестный прицел (Crosshair) при наведении мышки -->
          <g id="parkside-crosshair-group" style="display:none; pointer-events:none;">
            <line id="parkside-crosshair-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#F0F6FC" stroke-width="1.4" stroke-dasharray="3,3" />
            <line id="parkside-crosshair-hline" x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(0, 229, 255, 0.55)" stroke-width="1.1" stroke-dasharray="3,3" />
            <circle id="parkside-crosshair-rh-dot" cx="${padL}" cy="${padT}" r="5.5" fill="#00E5FF" stroke="#FFFFFF" stroke-width="2" />
            <circle id="parkside-crosshair-temp-dot" cx="${padL}" cy="${padT}" r="4.8" fill="#FFA726" stroke="#08111D" stroke-width="2" />
            <rect id="parkside-crosshair-badge-bg" x="${padL}" y="2" width="230" height="18" rx="5" fill="rgba(8, 17, 29, 0.94)" stroke="#00E5FF" stroke-width="1" />
            <text id="parkside-crosshair-badge-txt" x="${padL + 115}" y="14" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="middle"></text>
          </g>
        </svg>
      `;
    }

    function renderParksideChartAndVerdict(analysis) {
      if (!analysis) return;
      activeParksideAnalysis = analysis;

      // Обновляем подсветку кнопок профилей
      ["real_527", "st2_active", "st1_ready", "st3_ready"].forEach(k => {
        const btnId = k === "real_527"
          ? "btn-demo-log-real527"
          : (k === "st2_active" ? "btn-demo-log-st2" : (k === "st1_ready" ? "btn-demo-log-st1" : "btn-demo-log-st3"));
        const el = document.getElementById(btnId);
        if (el) el.className = `chip ${analysis.profileKey === k ? "active-amber" : ""}`;
      });

      const sourceBadge = analysis.profileKey === "real_527"
        ? "Реальный лог цеха 527 точек (сохранен в localStorage)"
        : (analysis.profileKey ? "Демо-профиль (сохранен в localStorage)" : "Загруженный лог технолога (сохранен в localStorage)");
      document.getElementById("parkside-file-meta").textContent =
        `Файл: ${analysis.fileName} [${sourceBadge}] • Точек: ${analysis.points.length} (${analysis.totalLogHours} ч) • rH: ${analysis.minRh}%..${analysis.maxRh}% • Т: ${analysis.minTemp}..${analysis.maxTemp}°C (сред. ${analysis.avgTemp}°C)`;

      persistStateToStorage();

      const rateColor = analysis.rapidPt.rhPct >= 84.0 ? "var(--amber-curing)" : "var(--cyan-dew)";
      const pauseSafeColor = analysis.pauseDurationHours > 2.0 ? "var(--coral-danger)" : "var(--emerald-optimal)";
      const dryingIndexColor = analysis.reboundRateChangePct <= 0 ? "var(--emerald-optimal)" : "var(--amber-curing)";

      // 5) 6 КАРТОЧЕК ГЛУБОКОЙ АНАЛИТИКИ ЛОГА ВМЕСТО 3
      document.getElementById("parkside-metrics-grid").innerHTML = `
        <div class="metric-tile" style="border-color: ${rateColor};">
          <div class="m-label">1. СКАЧОК В ПАУЗЕ И ОТДАЧА РЫБОЙ (↑)</div>
          <div class="m-val" style="color: ${rateColor}; font-size: 17.5px;">+${analysis.avgRiseRatePerMin} %/мин ↑ <span style="font-size:13px; color:var(--steel-text-primary);">(${analysis.startPt.rhPct}%→${analysis.rapidPt.rhPct}%)</span></div>
          <div class="m-sub">Макс. скачок: +${analysis.jumpDeltaRh}% за ${analysis.jumpDurationMin} мин (+${analysis.riseRatePerMin} %/мин • +${(analysis.avgRiseRatePerMin * 60).toFixed(0)} %/ч)</div>
        </div>

        <div class="metric-tile" style="border-color: var(--cyan-dew);">
          <div class="m-label">2. СКОРОСТЬ ОСУШЕНИЯ AIM (Холод ↓)</div>
          <div class="m-val" style="color: var(--cyan-dew); font-size: 17.5px;">-${analysis.avgPullDownRatePerMin} %/мин ↓ <span style="font-size:13px; color:var(--steel-text-primary);">(до -${analysis.maxPullDownRatePerMin} %/мин)</span></div>
          <div class="m-sub">Макс. сгон: ${analysis.bestDropStartRh}%→${analysis.bestDropEndRh}% (-${analysis.bestDropDeltaRh}% за ${analysis.bestDropDurationMin} мин • -${(analysis.avgPullDownRatePerMin * 60).toFixed(0)} %/ч)</div>
        </div>

        <div class="metric-tile" style="border-color: var(--amber-curing);">
          <div class="m-label">3. МИКРОЦИКЛЫ (ПИЛА) И БОЛЬШИЕ ФАЗЫ</div>
          <div class="m-val" style="color: var(--amber-curing); font-size: 17.5px;">${analysis.microCyclesCount} зубцов • ${analysis.macroDryingPhasesCount} фаз</div>
          <div class="m-sub">Шаг пилы ~${analysis.avgCyclePeriodMin} мин • Глубоких сгонов сушки (≤63.5%): ${analysis.macroDryingPhasesCount} за ${analysis.totalLogHours} ч</div>
        </div>

        <div class="metric-tile" style="border-color: ${dryingIndexColor};">
          <div class="m-label">4. ИНДЕКС ВЫСЫХАНИЯ ХРЕБТА (НАЧАЛО vs КОНЕЦ)</div>
          <div class="m-val" style="color: ${dryingIndexColor}; font-size: 17.5px;">+${analysis.firstThirdRiseRate} → +${analysis.lastThirdRiseRate} %/мин (${analysis.reboundRateChangePct >= 0 ? "+" : ""}${analysis.reboundRateChangePct}%)</div>
          <div class="m-sub">Сред. rH: ${analysis.firstThirdAvgRh}% → ${analysis.lastThirdAvgRh}% (${analysis.avgRhDelta >= 0 ? "+" : ""}${analysis.avgRhDelta}%) • ${analysis.dryingIndexSummaryText}</div>
        </div>

        <div class="metric-tile" style="border-color: ${pauseSafeColor};">
          <div class="m-label">5. КОНТРОЛЬ ПРАВИЛА ПАУЗЫ (1 ФАЗА ПОДРЯД)</div>
          <div class="m-val" style="color: ${pauseSafeColor}; font-size: 17.5px;">${analysis.maxContinuousPauseMin} мин (${analysis.pauseDurationHours} ч)</div>
          <div class="m-sub">${analysis.pauseDurationHours > 2.0 ? "⛔ Превышен лимит 2.0 ч подряд!" : `✔ В норме (≤ 2.0 ч подряд без сгона вниз • ${analysis.maxPauseWindowStr})`}</div>
        </div>

        <div class="metric-tile" style="border-color: #FFA726;">
          <div class="m-label">6. ПРАВАЯ ШКАЛА °C, ТОЧКА РОСЫ И VPD</div>
          <div class="m-val" style="color: #FFA726; font-size: 17.5px;">Т: ${analysis.minTemp}..${analysis.maxTemp}°C <span style="font-size:13px; color:var(--steel-text-primary);">(сред. ${analysis.avgTemp}°C)</span></div>
          <div class="m-sub">Т.росы: ${analysis.minDewPoint}..${analysis.maxDewPoint}°C (сред. ${analysis.avgDewPoint}°C) • VPD: ${analysis.minVpd}..${analysis.maxVpd} кПа</div>
        </div>
      `;

      renderParksideSvgOnly(analysis);

      const vCol = analysis.verdictStatus === "OPTIMAL"
        ? "var(--emerald-optimal)"
        : (analysis.verdictStatus === "CRITICAL" ? "var(--coral-danger)" : "var(--amber-curing)");
      const vBg = analysis.verdictStatus === "OPTIMAL"
        ? "rgba(6, 59, 39, 0.72)"
        : (analysis.verdictStatus === "CRITICAL" ? "rgba(75, 17, 19, 0.82)" : "rgba(71, 42, 0, 0.72)");

      const nextStageBtn = analysis.recommendedNextStageKey
        ? `<button class="btn btn-emerald" style="margin-top:10px;" onclick="selectStage('${analysis.recommendedNextStageKey}'); selectTab('advisor'); showToast('Переключено на ${CURING_STAGES[analysis.recommendedNextStageKey].titleRu}');">
             ▶ Перевести калькулятор на ${CURING_STAGES[analysis.recommendedNextStageKey].shortTitleRu}
           </button>`
        : "";

      document.getElementById("parkside-verdict-box").innerHTML = `
        <div style="background:${vBg}; border:1px solid ${vCol}; border-radius:12px; padding:14px;">
          <div style="font-family:var(--font-display); font-size:15.5px; font-weight:700; color:${vCol}; margin-bottom:6px;">
            ${analysis.verdictTitle}
          </div>
          <div style="font-size:13.5px; line-height:1.5; color:var(--steel-text-primary);">
            ${analysis.verdictText}
          </div>
          ${nextStageBtn}
        </div>
      `;
    }

    function handleParksideFileUpload(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = String(evt.target.result || "");
        const pts = parseParksideLogText(file.name, text);
        if (pts.length < 2) {
          showToast("Не удалось распознать строки замеров (Temp °C / RH %) в файле " + file.name);
          return;
        }
        parksideViewState.zoomMode = "all";
        parksideViewState.panPercent = 100;
        const slider = document.getElementById("parkside-pan-slider");
        if (slider) slider.value = "100";
        const analysis = analyzeParksidePoints(file.name, pts);
        analysis.profileKey = file.name === "USB Data Logger_261028_1234.CSV" ? "real_527" : null;
        renderParksideChartAndVerdict(analysis);
        showToast(`Лог Parkside загружен и сохранен в localStorage: ${file.name} (${pts.length} точек)`);
      };
      reader.readAsText(file, "UTF-8");
    }

    function loadDemoParksideProfile(profileKey, isInit) {
      const resolvedKey = PARKSIDE_DEMO_LOGS[profileKey] ? profileKey : "real_527";
      const demo = PARKSIDE_DEMO_LOGS[resolvedKey];
      if (!isInit) {
        if (resolvedKey === "st1_ready" && state.telemetry.stageKey !== "STAGE_1") state.telemetry.stageKey = "STAGE_1";
        if (resolvedKey === "st2_active" && state.telemetry.stageKey !== "STAGE_2") state.telemetry.stageKey = "STAGE_2";
        if (resolvedKey === "st3_ready" && state.telemetry.stageKey !== "STAGE_3") state.telemetry.stageKey = "STAGE_3";
      }
      parksideViewState.zoomMode = "all";
      parksideViewState.panPercent = 100;
      const slider = document.getElementById("parkside-pan-slider");
      if (slider) slider.value = "100";
      const pts = parseParksideLogText(demo.fileName, demo.csvText);
      const analysis = analyzeParksidePoints(demo.fileName, pts);
      analysis.profileKey = resolvedKey;
      renderParksideChartAndVerdict(analysis);
      if (!isInit) {
        renderAll();
      }
    }

    function syncParksideToAdvisor() {
      if (!activeParksideAnalysis || !activeParksideAnalysis.points.length) return;
      const lastPt = activeParksideAnalysis.points[activeParksideAnalysis.points.length - 1];
      state.telemetry.environmentTempC = lastPt.tempC;
      state.telemetry.parksideRhPercent = Math.round(lastPt.rhPct);
      state.telemetry.isPausePhaseNow = lastPt.rhPct >= 70.0;
      state.customAiAdvice = null;
      selectTab("advisor");
      showToast(`Замер из лога Parkside (${lastPt.tempC}°C, ${Math.round(lastPt.rhPct)}% rH) передан в Советник!`);
    }


    // ==================== 10. VX: 4 ВИЗУАЛЬНЫХ ЭКРАНА + ГОЛОСОВОЙ ИИ-ШТУРМАН ====================
    // (var — чтобы объекты были доступны при любом порядке вызова renderAll)
    var VX_STORAGE_KEY = "JURMALCIEMS_VISUAL_V1";
    var VX_SPECIES_META = {
      VIMBA: { emoji: "🐟", short: "Вимба",   cartKg: 220, saltH: [48, 72],  soakH: [2, 3],     dryDays: 5.5, color: "#FFA726" },
      BREAM: { emoji: "🐠", short: "Лещ",     cartKg: 260, saltH: [72, 120], soakH: [3, 5],     dryDays: 6.0, color: "#FFD54F" },
      ROACH: { emoji: "🐟", short: "Плотва",  cartKg: 230, saltH: [36, 60],  soakH: [1.5, 2.5], dryDays: 4.5, color: "#FF8A65" },
      SMELT: { emoji: "🐡", short: "Корюшка", cartKg: 160, saltH: [6, 12],   soakH: [0.5, 1],   dryDays: 2.5, color: "#80DEEA" },
      PERCH: { emoji: "🐠", short: "Окунь",   cartKg: 210, saltH: [48, 72],  soakH: [2, 3],     dryDays: 6.0, color: "#FF5252" },
      GOBY:  { emoji: "🐡", short: "Бычок",   cartKg: 240, saltH: [24, 36],  soakH: [1, 2],     dryDays: 4.5, color: "#BCAAA4" }
    };
    var VX_PAUSE_LIMITS_H = [1.0, 1.5, 2.0, 4.0];
    var VX_VOICE_EXAMPLES = [
      "Лещ две тонны", "Вимба полторы тонны", "Дай отчет по камере", "Этап три", "Включи паузу",
      "Сколько выйдет рыбы?", "Сколько соли нужно?", "Покажи прибыль", "Температура пятнадцать",
      "Почему икра окуня сохнет медленнее?"
    ];
    Object.assign(vx, {
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
    });
    var vxRecognition = null;
    var vxVoiceTarget = "nav";
    var vxVoiceMode = "idle";
    var vxVoiceLevel = 0.5;
    var vxEqRaf = null;
    var vxSpeakToken = 0;

    function vxFmt(n, d) {
      const digits = d || 0;
      return Number(n || 0).toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }
    function vxEur(n) {
      return `${n < 0 ? "−" : ""}${vxFmt(Math.abs(n))} €`;
    }
    function vxPersist() {
      try {
        localStorage.setItem(VX_STORAGE_KEY, JSON.stringify({
          compact: vx.compact, batchMode: vx.batchMode, mixCarts: vx.mixCarts,
          yieldPct: vx.yieldPct, yieldSpecies: vx.yieldSpecies,
          purchase: vx.purchase, priceBulk: vx.priceBulk,
          priceVac: vx.priceVac, priceVacPack: vx.priceVacPack,
          pricePrem: vx.pricePrem, pricePremPiece: vx.pricePremPiece,
          tariff: vx.tariff, mixVac: vx.mixVac, variant: vx.variant, voiceLog: vx.voiceLog.slice(0, 12)
        }));
      } catch (e) {}
      if (typeof scheduleCloudSyncPush === "function") {
        scheduleCloudSyncPush("vx_state");
      }
    }
    function vxSetRange(id, value, c1, c2) {
      const el = document.getElementById(id);
      if (!el) return;
      if (document.activeElement !== el) el.value = value;
      const min = parseFloat(el.min), max = parseFloat(el.max);
      const cur = parseFloat(el.value);
      const pct = Math.max(0, Math.min(100, ((cur - min) / (max - min)) * 100));
      el.style.setProperty("--p", `${pct}%`);
      if (c1) el.style.setProperty("--c1", c1);
      if (c2) el.style.setProperty("--c2", c2);
    }
    function vxSetText(id, html) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    }

    // ---------- Расчет партии: Сырье ➔ Посол ➔ Усушка ➔ 15 тележек (Моно и Сборная камера) ----------
    function vxComputeBatch() {
      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey] || FISH_SPECIES.VIMBA;
      const meta = VX_SPECIES_META[t.speciesKey] || VX_SPECIES_META.VIMBA;
      const mid = (sp.yieldMinPercent + sp.yieldMaxPercent) / 2;
      if (vx.yieldSpecies !== t.speciesKey || vx.yieldPct == null || isNaN(vx.yieldPct)) {
        vx.yieldPct = mid;
        vx.yieldSpecies = t.speciesKey;
      }
      if (!vx.mixCarts || typeof vx.mixCarts !== "object") {
        vx.mixCarts = { VIMBA: 8, BREAM: 4, PERCH: 3, ROACH: 0, SMELT: 0, GOBY: 0 };
      }

      const isMix = vx.batchMode === "mix";
      const y = vx.yieldPct;
      let raw = Math.max(1, Number(t.batchWeightKg) || 1);
      let cartsExact = raw / meta.cartKg;
      let cartsUsed = Math.min(15, Math.ceil(cartsExact - 1e-9));
      let overflowKg = Math.max(0, raw - 15 * meta.cartKg);
      let dryDaysBase = meta.dryDays;
      let saltH = meta.saltH;
      let soakH = meta.soakH;
      const cartSlots = [];
      const mixBreakdown = [];

      if (isMix) {
        let totalMixRaw = 0;
        let totalMixCarts = 0;
        let maxDryDays = 0;
        let minSaltH = 999, maxSaltH = 0;
        let minSoakH = 999, maxSoakH = 0;
        Object.keys(VX_SPECIES_META).forEach(k => {
          const c = Math.max(0, Math.round(Number(vx.mixCarts[k]) || 0));
          const m = VX_SPECIES_META[k];
          const rawK = c * m.cartKg;
          const finK = rawK * (y / 100);
          const watK = rawK - finK;
          mixBreakdown.push({ key: k, meta: m, carts: c, rawKg: rawK, finishedKg: finK, waterL: watK });
          if (c > 0) {
            totalMixRaw += rawK;
            totalMixCarts += c;
            if (m.dryDays > maxDryDays) maxDryDays = m.dryDays;
            if (m.saltH[0] < minSaltH) minSaltH = m.saltH[0];
            if (m.saltH[1] > maxSaltH) maxSaltH = m.saltH[1];
            if (m.soakH[0] < minSoakH) minSoakH = m.soakH[0];
            if (m.soakH[1] > maxSoakH) maxSoakH = m.soakH[1];
            for (let idx = 0; idx < c; idx++) {
              cartSlots.push({ key: k, meta: m, kg: m.cartKg, fill: 1 });
            }
          }
        });
        raw = Math.max(1, totalMixRaw);
        cartsExact = totalMixCarts;
        cartsUsed = Math.min(15, totalMixCarts);
        overflowKg = totalMixCarts > 15
          ? cartSlots.slice(15).reduce((sum, s) => sum + s.kg, 0)
          : 0;
        if (maxDryDays > 0) dryDaysBase = maxDryDays;
        if (maxSaltH > 0) saltH = [minSaltH, maxSaltH];
        if (maxSoakH > 0) soakH = [minSoakH, maxSoakH];
      } else {
        for (let i = 0; i < 15; i++) {
          const fill = Math.max(0, Math.min(1, cartsExact - i));
          if (fill > 0) {
            cartSlots.push({ key: t.speciesKey, meta, kg: Math.round(fill * meta.cartKg), fill });
          }
        }
      }

      const activeMixItems = mixBreakdown.filter(item => item.carts > 0);
      const mixTitleShort = isMix
        ? (activeMixItems.length
            ? activeMixItems.map(item => `${item.meta.emoji} ${item.meta.short} ×${item.carts}`).join(" + ")
            : "Пустая сборная камера")
        : `${meta.emoji} ${meta.short}`;

      const finished = raw * y / 100;
      const water = raw - finished;
      // Тузлук 24% (плотность ~1,18), соотношение рыба : тузлук = 1 : 0,7, охлаждение льдом до +2..+4°C
      const brineL = raw * 0.7;
      const brineKg = brineL * 1.18;
      const saltBrine = brineKg * 0.24;
      const waterTotal = brineKg - saltBrine;
      const ice = waterTotal * 0.35;
      const waterLiquid = waterTotal - ice;
      const saltTopUp = raw * 0.03;
      const saltTotal = saltBrine + saltTopUp;
      const dryDays = Math.max(1.5, dryDaysBase * (1 + (mid - y) * 0.035));
      const restDays = 1.5;
      const kWh = dryDays * 24 * 12.5 + restDays * 24 * 5;
      let texture = "вяленая стандарт";
      if (y < 52) texture = "сухая «звон»";
      else if (y < 57) texture = "классическая вобла";
      else if (y >= 61) texture = "мягкая вялка / балык";
      return {
        isMix, mixBreakdown, activeMixItems, mixTitleShort, cartSlots,
        sp, meta, mid, raw, y, finished, water, brineL, saltBrine, saltTopUp, saltTotal, ice, waterLiquid,
        dryDays, restDays, cartsExact, cartsUsed, overflowKg, kWh, texture, saltH, soakH
      };
    }

    // ---------- Расчет 4 вариантов продажи и чистой прибыли (€) ----------
    function vxComputeProfit(b) {
      if (vx.priceVacPack == null || isNaN(vx.priceVacPack)) {
        vx.priceVacPack = Number(((vx.priceVac || 20) * 0.85).toFixed(1));
      }
      if (vx.pricePremPiece == null || isNaN(vx.pricePremPiece)) {
        vx.pricePremPiece = Number(((vx.pricePrem || 33.3) * 0.30).toFixed(1));
      }
      const priceVacPerKg = vx.priceVacPack / 0.85;
      const pricePremPerKg = vx.pricePremPiece / 0.30;
      vx.priceVac = priceVacPerKg;
      vx.pricePrem = pricePremPerKg;

      const fin = b.finished;
      const costRaw = b.raw * vx.purchase;
      const costEnergy = b.kWh * vx.tariff;
      const costSalt = b.saltTotal * 0.12 + b.ice * 0.02;
      const packsVac = fin / 0.85;
      const pcsPrem = fin / 0.30;
      const packBulk = fin * 0.16;            // короб + работа на развес
      const packVac = packsVac * 0.68;        // пакет 0,38 € + работа + картон евроконтейнера
      const packPrem = pcsPrem * 0.67;        // пакет 0,42 € + подложка/этикетка/работа
      const m = vx.mixVac / 100;
      const revBulk = fin * vx.priceBulk;
      const revVac = packsVac * vx.priceVacPack;
      const revPrem = pcsPrem * vx.pricePremPiece;
      const defs = [
        { key: "bulk", ico: "📦", name: "Опт на развес", color: "#9FB3C8", revenue: revBulk, pack: packBulk, units: `${vxFmt(fin)} кг в коробах (${vxFmt(vx.priceBulk, 1)} €/кг)` },
        { key: "vac", ico: "🟦", name: "Вакуум 3 тушки", color: "#00E5FF", revenue: revVac, pack: packVac, units: `${vxFmt(packsVac)} пак. × ${vxFmt(vx.priceVacPack, 1)} € (${vxFmt(priceVacPerKg, 1)} €/кг)` },
        { key: "prem", ico: "💎", name: "Премиум 300 г", color: "#A78BFA", revenue: revPrem, pack: packPrem, units: `${vxFmt(pcsPrem)} шт × ${vxFmt(vx.pricePremPiece, 1)} € (${vxFmt(pricePremPerKg, 1)} €/кг)` },
        { key: "mix", ico: "🔀", name: `Микс ${100 - vx.mixVac}/${vx.mixVac}`, color: "#2EE59D", revenue: (1 - m) * revBulk + m * revVac, pack: (1 - m) * packBulk + m * packVac, units: `${vxFmt(fin * (1 - m))} кг развес + ${vxFmt(packsVac * m)} пакетов` }
      ];
      const variants = defs.map(v => {
        const cost = costRaw + costEnergy + costSalt + v.pack;
        const profit = v.revenue - cost;
        return {
          ...v,
          cost,
          profit,
          roi: cost > 0 ? (profit / cost) * 100 : 0,
          perKg: fin > 0 ? profit / fin : 0,
          breakEvenPurchase: (v.revenue - costEnergy - costSalt - v.pack) / b.raw
        };
      });
      const best = variants.reduce((a, c) => (c.profit > a.profit ? c : a), variants[0]);
      return { costRaw, costEnergy, costSalt, packsVac, pcsPrem, priceVacPerKg, pricePremPerKg, variants, best };
    }

    function renderVisualScreens() {
      const b = vxComputeBatch();
      const p = vxComputeProfit(b);
      renderVisualVoice(b, p);
      renderVisualBatch(b, p);
      renderVisualProfit(b, p);
      renderVisualConsole();
      vxPersist();
    }

    // ---------- ЭКРАН 1: 🎙️ Штурман ----------
    function renderVisualVoice(b, p) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const badge = document.getElementById("voice-support-badge");
      if (badge) {
        badge.className = SR ? "pill-btn pill-emerald" : "pill-btn pill-amber";
        badge.textContent = SR ? "🟢 Микрофон готов (Chrome / Edge)" : "⚠️ Нет распознавания речи — печатайте команду";
      }
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const d = getOwnerSimpleSummaryData(t, species, stage, diag, diag.yieldForecast);
      const vac = p.variants.find(v => v.key === "vac");
      const ico = d.trafficStatus === "OPTIMAL" ? "✅" : (d.trafficStatus === "CRITICAL" ? "🚨" : "⚠️");
      const word = d.trafficStatus === "OPTIMAL" ? "ВСЁ В НОРМЕ" : (d.trafficStatus === "CRITICAL" ? "НУЖНА ПРОВЕРКА" : "ПОД КОНТРОЛЕМ");
      const chamberTitle = b.isMix
        ? `🔀 Сборная • ${vxFmt(b.raw)} кг`
        : `${b.meta.emoji} ${b.meta.short} • ${vxFmt(t.batchWeightKg)} кг`;
      vxSetText("voice-live-panel", `
        <div class="vx-status-ring">
          <svg viewBox="0 0 120 120" width="112" height="112" style="flex-shrink:0;">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(43,70,107,.5)" stroke-width="10"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="${d.trafficBorder}" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${d.trafficStatus === "OPTIMAL" ? 301 : (d.trafficStatus === "CRITICAL" ? 90 : 200)} 302" transform="rotate(-90 60 60)"
              style="filter: drop-shadow(0 0 8px ${d.trafficBorder});"/>
            <text x="60" y="72" text-anchor="middle" font-size="36">${ico}</text>
          </svg>
          <div>
            <div class="vx-label" style="color:${d.trafficBorder};">${word}</div>
            <div style="font-family:var(--font-display); font-size:26px; font-weight:800; margin-top:2px;">${chamberTitle}</div>
            <div style="font-family:var(--font-mono); font-size:12.5px; color:var(--cyan-dew); margin-top:3px;">${d.stItem.label} • ${t.isPausePhaseNow ? "⏸ пауза" : "⚡ сушка"}</div>
          </div>
        </div>
        <div class="vx-grid-6" style="margin-top:12px; grid-template-columns: repeat(2, 1fr);">
          <div class="vx-tile" style="--tile-c:${d.tempColor};"><div class="vx-label">🌡 Температура</div><div class="vx-val">+${t.environmentTempC.toFixed(1)}<span class="vx-unit">°C</span></div></div>
          <div class="vx-tile" style="--tile-c:${d.rhColor};"><div class="vx-label">💧 Влажность</div><div class="vx-val">${d.rhRounded}<span class="vx-unit">%</span></div></div>
          <div class="vx-tile" style="--tile-c:#FFA726;"><div class="vx-label">🐟 Выйдет</div><div class="vx-val">${vxFmt(b.finished)}<span class="vx-unit">кг</span></div></div>
          <div class="vx-tile" style="--tile-c:${vac.profit >= 0 ? "#2EE59D" : "#FF5252"};"><div class="vx-label">💶 Прибыль (вакуум)</div><div class="vx-val">${vxEur(vac.profit)}</div></div>
        </div>
      `);
      const chips = document.getElementById("voice-cmd-chips");
      if (chips && !chips.dataset.ready) {
        chips.innerHTML = VX_VOICE_EXAMPLES.map(c =>
          `<button class="vx-cmd-chip" onclick="handleVoiceCommand('${c.replace(/'/g, "\\'")}')">🗣 ${c}</button>`
        ).join("");
        chips.dataset.ready = "1";
      }
      const voiceSlot = document.getElementById("vx-voice-settings-slot");
      if (voiceSlot) {
        voiceSlot.innerHTML = buildVoiceControlsHtml("vx");
      }
      vxRenderVoiceLog();
    }

    function vxRenderVoiceLog() {
      const box = document.getElementById("voice-log-list");
      if (!box) return;
      if (!vx.voiceLog.length) {
        box.innerHTML = `<div class="vx-log-row" style="color:var(--steel-text-secondary);">Пока пусто — нажмите 🎙️ и скажите команду</div>`;
        return;
      }
      box.innerHTML = vx.voiceLog.slice(0, 8).map(l => `
        <div class="vx-log-row">
          <span style="color:var(--steel-text-secondary); min-width:44px;">${l.time}</span>
          <span style="color:#E9D5FF; flex:1;">🗣 «${escapeHtml(l.heard)}»</span>
          <span style="color:var(--emerald-optimal); font-weight:700; text-align:right;">${escapeHtml(l.result)}</span>
        </div>`).join("");
    }

    // ---------- Управление режимом «Сборная камера (Микс 15 тележек)» ----------
    function vxSetBatchMode(mode) {
      triggerHaptic(12);
      vx.batchMode = mode === "mix" ? "mix" : "mono";
      renderVisualScreens();
    }
    function vxStepMixCart(speciesKey, delta) {
      triggerHaptic(12);
      if (!vx.mixCarts || typeof vx.mixCarts !== "object") {
        vx.mixCarts = { VIMBA: 8, BREAM: 4, PERCH: 3, ROACH: 0, SMELT: 0, GOBY: 0 };
      }
      const cur = Math.max(0, Math.round(Number(vx.mixCarts[speciesKey]) || 0));
      vx.mixCarts[speciesKey] = Math.max(0, Math.min(15, cur + delta));
      vx.batchMode = "mix";
      renderVisualScreens();
    }
    function vxApplyMixPreset(presetKey) {
      triggerHaptic(15);
      const presets = {
        vimba_bream_perch: { VIMBA: 8, BREAM: 4, PERCH: 3, ROACH: 0, SMELT: 0, GOBY: 0 },
        vimba_bream_roach: { VIMBA: 8, BREAM: 4, PERCH: 0, ROACH: 3, SMELT: 0, GOBY: 0 },
        equal_three:       { VIMBA: 5, BREAM: 5, PERCH: 0, ROACH: 5, SMELT: 0, GOBY: 0 },
        vimba_perch:       { VIMBA: 10, BREAM: 0, PERCH: 5, ROACH: 0, SMELT: 0, GOBY: 0 }
      };
      if (presets[presetKey]) {
        vx.mixCarts = { ...presets[presetKey] };
        vx.batchMode = "mix";
        renderVisualScreens();
      }
    }

    // ---------- ЭКРАН 2: ⚖️ Партия ----------
    function renderVisualBatch(b, p) {
      const t = state.telemetry;
      const profitData = p || vxComputeProfit(b);
      const vacVar = profitData.variants.find(v => v.key === "vac") || profitData.best;
      const selVar = profitData.variants.find(v => v.key === vx.variant) || vacVar;

      const btnMono = document.getElementById("vb-mode-mono");
      const btnMix = document.getElementById("vb-mode-mix");
      if (btnMono) btnMono.className = `chip ${!b.isMix ? "active-cyan" : ""}`;
      if (btnMix) btnMix.className = `chip ${b.isMix ? "active-amber" : ""}`;

      const chipsEl = document.getElementById("vb-species-chips");
      if (chipsEl) {
        chipsEl.style.display = b.isMix ? "none" : "flex";
        chipsEl.innerHTML = Object.keys(FISH_SPECIES).map(k => {
          const m = VX_SPECIES_META[k];
          return `<button class="chip ${k === t.speciesKey ? "active-amber" : ""}" onclick="selectSpecies('${k}')">${m.emoji} ${m.short}</button>`;
        }).join("");
      }

      const rawCardEl = document.getElementById("vb-raw")?.closest(".vx-slider-card");
      if (rawCardEl) {
        rawCardEl.style.opacity = b.isMix ? "0.55" : "1";
        rawCardEl.style.pointerEvents = b.isMix ? "none" : "auto";
      }

      const mixPanelEl = document.getElementById("vb-mix-panel");
      if (mixPanelEl) {
        mixPanelEl.style.display = b.isMix ? "block" : "none";
        if (b.isMix) {
          const totalMixCarts = Math.round(b.cartsExact);
          const cartBadgeClass = totalMixCarts > 15 ? "pill-amber" : (totalMixCarts === 15 ? "pill-emerald" : "pill-cyan");
          const cartBadgeText = totalMixCarts > 15
            ? `⛔ Выбрано ${totalMixCarts} / 15 тележек (перегруз +${totalMixCarts - 15} тел.)`
            : `🛒 Занято ${totalMixCarts} из 15 тележек SS304`;
          mixPanelEl.innerHTML = `
            <div style="padding:16px; border-radius:16px; background:linear-gradient(135deg, rgba(255,167,38,0.10), rgba(0,229,255,0.07)); border:1px solid rgba(255,167,38,0.45);">
              <div class="vx-head" style="margin-bottom:12px;">
                <div>
                  <div class="vx-kicker" style="color:var(--amber-curing);">🔀 КОНСТРУКТОР СБОРНОЙ КАМЕРЫ (15 ТЕЛЕЖЕК SS304)</div>
                  <div style="font-size:14px; color:var(--steel-text-secondary); margin-top:2px;">Задайте количество тележек по видам рыбы — вес сырья, слив воды, выход и чистая прибыль камеры пересчитаются мгновенно</div>
                </div>
                <div class="btn-row">
                  <span class="pill-btn ${cartBadgeClass}" style="cursor:default; font-size:13px;">${cartBadgeText}</span>
                  <button class="chip" onclick="vxApplyMixPreset('vimba_bream_perch')">8 Вимба + 4 Лещ + 3 Окунь</button>
                  <button class="chip" onclick="vxApplyMixPreset('vimba_bream_roach')">8 Вимба + 4 Лещ + 3 Плотва</button>
                  <button class="chip" onclick="vxApplyMixPreset('equal_three')">5 Вимба + 5 Лещ + 5 Плотва</button>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(195px, 1fr)); gap:10px;">
                ${b.mixBreakdown.map(item => `
                  <div style="padding:12px; border-radius:12px; background:rgba(10,18,32,0.85); border:1.5px solid ${item.carts > 0 ? item.meta.color : "rgba(43,70,107,0.6)"}; display:flex; flex-direction:column; gap:8px;">
                    <div class="row-between">
                      <span style="font-family:var(--font-display); font-size:16px; font-weight:800; color:${item.carts > 0 ? "#FFFFFF" : "var(--steel-text-secondary)"};">${item.meta.emoji} ${item.meta.short}</span>
                      <span class="vx-label" style="color:${item.meta.color};">~${item.meta.cartKg} кг/тел.</span>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                      <button class="chip" style="padding:6px 14px; font-size:18px; font-weight:800;" onclick="vxStepMixCart('${item.key}', -1)">−</button>
                      <div style="text-align:center;">
                        <div style="font-family:var(--font-display); font-size:24px; font-weight:900; color:${item.carts > 0 ? item.meta.color : "var(--steel-text-secondary)"};">${item.carts}</div>
                        <div class="vx-label" style="font-size:10px;">тележек</div>
                      </div>
                      <button class="chip" style="padding:6px 14px; font-size:18px; font-weight:800;" onclick="vxStepMixCart('${item.key}', 1)">+</button>
                    </div>
                    <div class="row-between" style="font-family:var(--font-mono); font-size:12px; color:var(--steel-text-secondary); border-top:1px solid rgba(43,70,107,0.45); padding-top:6px;">
                      <span>Сырье: <b style="color:#FFF;">${vxFmt(item.rawKg)} кг</b></span>
                      <span>Выход: <b style="color:var(--amber-curing);">${vxFmt(item.finishedKg)} кг</b></span>
                    </div>
                  </div>
                `).join("")}
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-top:14px;">
                <div class="vx-tile" style="--tile-c:#00E5FF;">
                  <div class="vx-label">⚖️ Суммарный сырой вес</div>
                  <div class="vx-val">${vxFmt(b.raw)}<span class="vx-unit">кг</span></div>
                  <div class="vx-sub">${b.mixTitleShort}</div>
                </div>
                <div class="vx-tile" style="--tile-c:#38BDF8;">
                  <div class="vx-label">💧 Общий слив воды</div>
                  <div class="vx-val">−${vxFmt(b.water)}<span class="vx-unit">л</span></div>
                  <div class="vx-sub">≈ ${vxFmt(b.water / b.dryDays)} л/сут за цикл</div>
                </div>
                <div class="vx-tile" style="--tile-c:#FFA726;">
                  <div class="vx-label">🐟 Общий выход готовой рыбы</div>
                  <div class="vx-val">${vxFmt(b.finished)}<span class="vx-unit">кг</span></div>
                  <div class="vx-sub">выход ${b.y.toFixed(1)}% • ${b.texture}</div>
                </div>
                <div class="vx-tile" style="--tile-c:${selVar.profit >= 0 ? "#2EE59D" : "#FF5252"};">
                  <div class="vx-label">💶 Чистая прибыль сборной камеры</div>
                  <div class="vx-val" style="color:${selVar.profit >= 0 ? "#2EE59D" : "#FF5252"};">${vxEur(selVar.profit)}</div>
                  <div class="vx-sub">${selVar.ico} ${selVar.name} (вакуум: ${vxEur(vacVar.profit)})</div>
                </div>
              </div>
            </div>
          `;
        }
      }

      vxSetRange("vb-raw", Math.min(5000, b.raw), "#00E5FF", "#2EE59D");
      vxSetRange("vb-yield", b.y, "#FFA726", "#FF2D78");
      vxSetText("vb-raw-val", `${vxFmt(b.raw)}<span class="vx-unit">кг${b.isMix ? " (микс)" : ""}</span>`);
      vxSetText("vb-yield-val", `${b.y.toFixed(1)}<span class="vx-unit">% • ${b.texture}</span>`);
      vxSetText("vb-yield-norm", `норма ${b.sp.yieldPercentRange}`);

      const arrow = `<div class="vx-pipe-arrow"><svg viewBox="0 0 46 20"><line class="vx-flow-dash" x1="2" y1="10" x2="36" y2="10" stroke="#00E5FF" stroke-width="3"/><path d="M34 3 L44 10 L34 17 Z" fill="#00E5FF"/></svg></div>`;
      const cartsColor = b.overflowKg > 0 ? "#FF5252" : "#2EE59D";
      vxSetText("vb-pipeline", `
        <div class="vx-pipe-node" style="--node-c:#00E5FF;"><div class="vx-pipe-ico">${b.isMix ? "🔀" : b.meta.emoji}</div><div class="vx-label">Сырье</div><div class="vx-val">${vxFmt(b.raw)} кг</div><div class="vx-label" style="margin-top:4px;">${b.isMix ? b.mixTitleShort : b.meta.short}</div></div>
        ${arrow}
        <div class="vx-pipe-node" style="--node-c:#A78BFA;"><div class="vx-pipe-ico">🧂</div><div class="vx-label">Посол</div><div class="vx-val">${b.saltH[0]}–${b.saltH[1]} ч</div><div class="vx-label" style="margin-top:4px;">тузлук ${vxFmt(b.brineL)} л • +2..+4°C</div></div>
        ${arrow}
        <div class="vx-pipe-node" style="--node-c:#FFA726;"><div class="vx-pipe-ico">💨</div><div class="vx-label">Усушка</div><div class="vx-val">−${vxFmt(b.water)} л</div><div class="vx-label" style="margin-top:4px;">≈ ${b.dryDays.toFixed(1)} сут + отдых ${b.restDays} сут</div></div>
        ${arrow}
        <div class="vx-pipe-node" style="--node-c:${cartsColor};"><div class="vx-pipe-ico">🛒</div><div class="vx-label">Тележки</div><div class="vx-val">${b.cartsUsed} / 15</div><div class="vx-label" style="margin-top:4px;">${vxFmt(b.finished)} кг • ${vxEur(selVar.profit)}</div></div>
      `);

      // Колба слива воды
      const waterShare = b.water / b.raw;
      const frac = Math.min(0.92, Math.max(0.1, waterShare * 1.55));
      const levelY = Math.round(204 - frac * 132);
      const flaskPath = "M82 12 H118 V70 L178 194 Q184 206 170 206 H30 Q16 206 22 194 L82 70 Z";
      vxSetText("vb-flask", `
        <div class="vx-label">💧 Воды уйдет в слив</div>
        <svg viewBox="0 0 200 222" width="100%" style="max-height:210px; margin-top:6px; overflow:visible;">
          <defs>
            <clipPath id="vxFlaskClip"><path d="${flaskPath}"/></clipPath>
            <linearGradient id="vxWaterGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FF6FF"/><stop offset="1" stop-color="#0057FF"/></linearGradient>
          </defs>
          <g clip-path="url(#vxFlaskClip)">
            <rect x="0" y="${levelY}" width="200" height="${222 - levelY}" fill="url(#vxWaterGrad)" opacity="0.88"/>
            <path class="vx-wave" d="M-40 ${levelY} Q -20 ${levelY - 8} 0 ${levelY} T 40 ${levelY} T 80 ${levelY} T 120 ${levelY} T 160 ${levelY} T 200 ${levelY} T 240 ${levelY} V ${levelY + 12} H -40 Z" fill="#B8FBFF" opacity="0.5"/>
          </g>
          <path d="${flaskPath}" fill="rgba(184,244,255,0.05)" stroke="#B8F4FF" stroke-width="3"/>
          ${[0, 1, 2, 3].map(i => `<line x1="${150 - i * 14}" y1="${180 - i * 30}" x2="${162 - i * 14}" y2="${180 - i * 30}" stroke="#B8F4FF" stroke-width="2" opacity="0.6"/>`).join("")}
          <circle class="vx-drop" cx="100" cy="2" r="4.5" fill="#5FF6FF"/>
          <circle class="vx-drop" cx="94" cy="2" r="3.5" fill="#5FF6FF" style="animation-delay:.45s"/>
          <circle class="vx-drop" cx="106" cy="2" r="3" fill="#5FF6FF" style="animation-delay:.9s"/>
          <text x="100" y="${Math.min(196, levelY + 40)}" text-anchor="middle" fill="#FFFFFF" font-size="24" font-weight="800" font-family="Segoe UI">${Math.round(waterShare * 100)}%</text>
        </svg>
        <div class="vx-big" style="color:var(--cyan-dew); text-align:center;">${vxFmt(b.water)}<span class="vx-unit">л</span></div>
        <div class="vx-label" style="text-align:center; margin-top:4px;">≈ ${vxFmt(b.water / b.dryDays)} л в сутки</div>
      `);

      // Весы готовой рыбы
      const ang = -90 + Math.min(1, b.finished / 3250) * 180;
      const scaleEmojis = b.isMix && b.activeMixItems.length
        ? b.activeMixItems.slice(0, 3).map(it => it.meta.emoji).join("")
        : `${b.meta.emoji}${b.meta.emoji}${b.meta.emoji}`;
      vxSetText("vb-scale", `
        <div class="vx-label">⚖️ Готовая рыба на весах</div>
        <svg viewBox="0 0 220 200" width="100%" style="max-height:210px; margin-top:6px;">
          <defs><linearGradient id="vxDialGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00E5FF"/><stop offset=".5" stop-color="#2EE59D"/><stop offset="1" stop-color="#FFA726"/></linearGradient></defs>
          <path d="M30 112 A80 80 0 0 1 190 112" fill="none" stroke="rgba(43,70,107,.6)" stroke-width="16" stroke-linecap="round"/>
          <path d="M30 112 A80 80 0 0 1 190 112" fill="none" stroke="url(#vxDialGrad)" stroke-width="16" stroke-linecap="round"
            stroke-dasharray="${Math.round(Math.min(1, b.finished / 3250) * 251)} 260" style="filter: drop-shadow(0 0 6px #2EE59D);"/>
          <line x1="110" y1="112" x2="110" y2="44" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" transform="rotate(${ang.toFixed(1)} 110 112)"/>
          <circle cx="110" cy="112" r="9" fill="#FFFFFF"/>
          <rect x="38" y="140" width="144" height="10" rx="5" fill="#9FB3C8"/>
          <path d="M60 150 L160 150 L172 188 L48 188 Z" fill="rgba(43,70,107,.8)" stroke="#9FB3C8"/>
          <text x="110" y="137" text-anchor="middle" font-size="22">${scaleEmojis}</text>
          <text x="110" y="176" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="800" font-family="monospace">${b.y.toFixed(1)}%</text>
        </svg>
        <div class="vx-big" style="color:var(--amber-curing); text-align:center;">${vxFmt(b.finished)}<span class="vx-unit">кг</span></div>
        <div class="vx-label" style="text-align:center; margin-top:4px;">${b.texture}</div>
      `);

      // Тузлук: соль, лед, вода, время посола и отмочки
      const bags = Math.ceil(b.saltTotal / 25);
      const iceBlocks = Math.ceil(b.ice / 20);
      const waterUnits = Math.ceil(b.waterLiquid / 100);
      const icons = (sym, n) => `${sym.repeat(Math.min(n, 14))}${n > 14 ? `<span style="font-size:13px; font-family:var(--font-mono); align-self:center;">&nbsp;×${n}</span>` : ""}`;
      const hasBream = b.isMix ? (Number(vx.mixCarts.BREAM) > 0) : (t.speciesKey === "BREAM");
      const breamChip = hasBream
        ? `<div class="pill-btn pill-amber" style="cursor:default; margin-top:8px; font-size:11.5px;">⚠️ Лещ: посол строго +2..+4°C • сутки за хвост</div>`
        : "";
      vxSetText("vb-brine", `
        <div class="vx-label">🧂 Тузлук 24% • рыба : тузлук = 1 : 0,7</div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
          <div><div class="row-between"><span class="vx-label" style="color:#E9D5FF;">Соль (мешки 25 кг)</span><b style="font-family:var(--font-display); font-size:20px; color:#E9D5FF;">${vxFmt(b.saltTotal)} кг</b></div><div class="vx-icons-row">${icons("🧂", bags)}</div></div>
          <div><div class="row-between"><span class="vx-label" style="color:#B8F4FF;">Лед (блоки 20 кг)</span><b style="font-family:var(--font-display); font-size:20px; color:#B8F4FF;">${vxFmt(b.ice)} кг</b></div><div class="vx-icons-row">${icons("🧊", iceBlocks)}</div></div>
          <div><div class="row-between"><span class="vx-label" style="color:var(--cyan-dew);">Вода (по 100 л)</span><b style="font-family:var(--font-display); font-size:20px; color:var(--cyan-dew);">${vxFmt(b.waterLiquid)} л</b></div><div class="vx-icons-row">${icons("💧", waterUnits)}</div></div>
        </div>
        <div class="vx-grid-6" style="grid-template-columns:1fr 1fr; margin-top:12px;">
          <div class="vx-tile" style="--tile-c:#A78BFA;"><div class="vx-label">⏱ Посол</div><div class="vx-val" style="font-size:22px;">${b.saltH[0]}–${b.saltH[1]} ч</div></div>
          <div class="vx-tile" style="--tile-c:#00E5FF;"><div class="vx-label">🚿 Отмочка</div><div class="vx-val" style="font-size:22px;">${String(b.soakH[0]).replace(".", ",")}–${String(b.soakH[1]).replace(".", ",")} ч</div></div>
        </div>
        ${breamChip}
      `);

      // Схема заполнения 15 тележек SS304 (5 рядов × 3)
      let rowsHtml = "";
      for (let row = 0; row < 5; row++) {
        let cells = "";
        for (let k = 0; k < 3; k++) {
          const i = row * 3 + k;
          const slot = b.cartSlots[i] || null;
          const fill = slot ? slot.fill : 0;
          const cellMeta = slot ? slot.meta : b.meta;
          const kg = slot ? slot.kg : 0;
          const labelRight = slot
            ? (b.isMix ? `${cellMeta.emoji} ${cellMeta.short} • ${kg} кг` : `${kg} кг`)
            : "—";
          cells += `
            <div class="vx-cart" style="${fill > 0 ? `border-color:${cellMeta.color};` : ""}">
              <div class="vx-cart-fill" style="height:${Math.round(fill * 100)}%; background:linear-gradient(180deg, ${cellMeta.color}, rgba(0,0,0,.35)); box-shadow: 0 0 16px ${cellMeta.color}66;"></div>
              <div class="vx-cart-lbl"><span>№${i + 1}</span><span>${labelRight}</span></div>
            </div>`;
        }
        rowsHtml += `<div style="display:flex; flex-direction:column; gap:8px;"><div class="vx-label" style="text-align:center;">Ряд ${row + 1}</div>${cells}</div>`;
      }
      const statusChip = b.overflowKg > 0
        ? `<span class="pill-btn" style="cursor:default; background:var(--coral-container); color:var(--coral-danger); border-color:var(--coral-danger);">⛔ Не влезает ${vxFmt(b.overflowKg)} кг</span>`
        : `<span class="pill-btn pill-emerald" style="cursor:default;">✅ Свободно ${15 - b.cartsUsed} тележек</span>`;
      const summaryLeftChip = b.isMix
        ? `<span class="pill-btn pill-amber" style="cursor:default;">🔀 ${b.mixTitleShort}</span>`
        : `<span class="pill-btn pill-cyan" style="cursor:default;">${b.cartsExact.toFixed(1).replace(".", ",")} тележки • ~${b.meta.cartKg} кг/шт</span>`;
      vxSetText("vb-carts", `
        <div class="vx-head" style="margin-bottom:10px;">
          <div class="vx-label">🛒 Заполнение 15 тележек SS304 • поток воздуха ➔</div>
          <div class="btn-row">${summaryLeftChip}${statusChip}</div>
        </div>
        <div class="vx-cart-grid">
          <div style="border-radius:12px; background:linear-gradient(90deg, rgba(0,229,255,.35), rgba(0,229,255,.05)); border:1px solid rgba(0,229,255,.5); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:6px;">
            <span style="font-size:24px; display:inline-block; animation: vxSpin 2s linear infinite;">🌀</span>
            <span class="vx-label" style="color:var(--cyan-dew); text-align:center; font-size:9.5px;">Cantoni пленум</span>
            <svg viewBox="0 0 40 20" width="40"><line class="vx-flow-dash" x1="2" y1="10" x2="30" y2="10" stroke="#00E5FF" stroke-width="3"/><path d="M28 4 L38 10 L28 16 Z" fill="#00E5FF"/></svg>
          </div>
          ${rowsHtml}
          <div style="border-radius:12px; background:repeating-linear-gradient(90deg, rgba(159,179,200,.25) 0 2px, transparent 2px 6px); border:1px solid rgba(159,179,200,.4); display:flex; align-items:center; justify-content:center;">
            <span class="vx-label" style="writing-mode:vertical-rl; font-size:9.5px;">сетки 50 см</span>
          </div>
        </div>
      `);
    }

    function onVisualRawInput(val, commit) {
      triggerHaptic(12, !commit);
      const kg = Math.round(parseFloat(val));
      if (isNaN(kg)) return;
      vx.batchMode = "mono";
      state.telemetry.batchWeightKg = Math.min(10000, Math.max(50, kg));
      state.customAiAdvice = null;
      if (commit) renderAll(); else renderVisualScreens();
    }
    function onVisualYieldInput(val) {
      triggerHaptic(12, true);
      const y = parseFloat(val);
      if (isNaN(y)) return;
      vx.yieldPct = y;
      vx.yieldSpecies = state.telemetry.speciesKey;
      renderVisualScreens();
    }
    function onVisualProfitInput(key, val) {
      triggerHaptic(12, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      vx[key] = v;
      if (key === "priceVacPack") vx.priceVac = v / 0.85;
      if (key === "pricePremPiece") vx.pricePrem = v / 0.30;
      renderVisualScreens();
    }
    function vxSelectVariant(key) {
      triggerHaptic(12);
      vx.variant = key;
      renderVisualScreens();
    }

    // ---------- ЭКРАН 3: 💰 Прибыль ----------
    function vxDonutSvg(slices, total) {
      const r = 78;
      const C = 2 * Math.PI * r;
      let off = 0;
      const segs = slices.map(s => {
        const len = total > 0 ? (Math.max(0, s.value) / total) * C : 0;
        const seg = `<circle cx="110" cy="110" r="${r}" fill="none" stroke="${s.color}" stroke-width="30"
          stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
          transform="rotate(-90 110 110)" style="filter: drop-shadow(0 0 6px ${s.color});"/>`;
        off += len;
        return seg;
      }).join("");
      return `
        <svg viewBox="0 0 220 220" width="220" height="220" style="flex-shrink:0;">
          <circle cx="110" cy="110" r="${r}" fill="none" stroke="rgba(43,70,107,.45)" stroke-width="30"/>
          ${segs}
          <text x="110" y="102" text-anchor="middle" fill="#9FB3C8" font-size="11" font-family="monospace" letter-spacing="2">ЗАТРАТЫ</text>
          <text x="110" y="130" text-anchor="middle" fill="#FFFFFF" font-size="24" font-weight="800" font-family="Segoe UI">${vxEur(total)}</text>
        </svg>`;
    }

    function renderVisualProfit(b, p) {
      vxSetRange("vp-yield", b.y, "#FFA726", "#FF2D78");
      vxSetRange("vp-purchase", vx.purchase, "#FFA726", "#FF5252");
      vxSetRange("vp-priceBulk", vx.priceBulk, "#455A64", "#9FB3C8");
      vxSetRange("vp-priceVac", vx.priceVacPack, "#0057FF", "#00E5FF");
      vxSetRange("vp-pricePrem", vx.pricePremPiece, "#5B21B6", "#A78BFA");
      vxSetRange("vp-tariff", vx.tariff, "#FFA726", "#FFE082");
      vxSetRange("vp-mixVac", vx.mixVac, "#9FB3C8", "#2EE59D");

      vxSetText("vp-yield-val", `${b.y.toFixed(1)}<span class="vx-unit">% • ${b.texture}</span>`);
      vxSetText("vp-yield-norm", `норма ${b.sp.yieldPercentRange} • выход ${vxFmt(b.finished)} кг`);
      vxSetText("vp-yield-summary-badge", `🐟 Выход ${b.y.toFixed(1)}% (${vxFmt(b.finished)} кг)`);

      vxSetText("vp-purchase-val", `${vxFmt(vx.purchase, 2)}<span class="vx-unit">€/кг</span>`);
      vxSetText("vp-priceBulk-val", `${vxFmt(vx.priceBulk, 1)}<span class="vx-unit">€/кг</span>`);
      vxSetText("vp-priceVac-val", `${vxFmt(vx.priceVacPack, 1)}<span class="vx-unit">€ / пак. (${vxFmt(p.priceVacPerKg, 1)} €/кг)</span>`);
      vxSetText("vp-pricePrem-val", `${vxFmt(vx.pricePremPiece, 1)}<span class="vx-unit">€ / шт (${vxFmt(p.pricePremPerKg, 1)} €/кг)</span>`);
      vxSetText("vp-tariff-val", `${vxFmt(vx.tariff, 2)}<span class="vx-unit">€/кВт·ч</span>`);
      vxSetText("vp-mixVac-val", `${vx.mixVac}<span class="vx-unit">%</span>`);
      vxSetText("vp-logistics-split-card", buildLogisticsSplitCardHtml(b, p));
      try { renderEnergyAuditKpis(b, p); } catch(e) { console.error("EnergyAudit err:", e); }
      try { renderTareLogisticsCalculator(b, p); } catch(e) { console.error("TareLogistics err:", e); }

      const sel = p.variants.find(v => v.key === vx.variant) || p.best;
      const profitColor = sel.profit >= 0 ? "#2EE59D" : "#FF5252";
      const costShare = sel.revenue > 0 ? Math.min(100, (sel.cost / sel.revenue) * 100) : 100;
      const titlePrefix = b.isMix ? `🔀 ${b.mixTitleShort}` : `${b.meta.emoji} ${b.meta.short}`;
      vxSetText("vp-hero", `
        <div class="vx-head" style="margin-bottom:6px;">
          <div>
            <div class="vx-kicker">Чистая прибыль партии • ${sel.ico} ${sel.name}</div>
            <div class="vx-title" style="font-size:16px; color:var(--steel-text-secondary);">${titlePrefix} • ${vxFmt(b.raw)} кг ➔ ${vxFmt(b.finished)} кг готовой (${b.y.toFixed(1)}%)</div>
          </div>
          ${p.best.key === sel.key ? `<span class="pill-btn pill-emerald" style="cursor:default;">👑 Лучший вариант</span>` : `<button class="pill-btn pill-amber" onclick="vxSelectVariant('${p.best.key}')">👑 Лучше: ${p.best.name} (+${vxEur(p.best.profit - sel.profit)})</button>`}
        </div>
        <div style="display:flex; align-items:flex-end; gap:22px; flex-wrap:wrap;">
          <div class="vx-huge" style="color:${profitColor}; text-shadow: 0 0 30px ${profitColor}66;">${vxEur(sel.profit)}</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; padding-bottom:8px;">
            <span class="pill-btn" style="cursor:default; background:rgba(46,229,157,.12); color:${profitColor}; border-color:${profitColor}; font-size:15px;">📈 ${vxFmt(sel.roi)}% рентабельность</span>
            <span class="pill-btn pill-cyan" style="cursor:default; font-size:15px;">${vxFmt(sel.perKg, 2)} €/кг</span>
          </div>
        </div>
        <div style="margin-top:14px;">
          <div style="display:flex; height:16px; border-radius:999px; overflow:hidden; border:1px solid rgba(43,70,107,.9);">
            <div style="width:${costShare}%; background:linear-gradient(90deg,#FF5252,#FFA726);"></div>
            <div style="flex:1; background:linear-gradient(90deg,#2EE59D,#00E5FF); box-shadow: 0 0 14px #2EE59D;"></div>
          </div>
          <div class="vx-slider-scale" style="margin-top:5px;"><span>Затраты ${vxEur(sel.cost)}</span><span>Выручка ${vxEur(sel.revenue)}</span></div>
        </div>
      `);

      const maxAbs = Math.max(1, ...p.variants.map(v => Math.abs(v.profit)));
      vxSetText("vp-bars", `
        <div class="vx-bars">
          ${p.variants.map(v => {
            const h = Math.max(6, (Math.abs(v.profit) / maxAbs) * 210);
            const col = v.profit >= 0 ? v.color : "#FF5252";
            return `
              <div class="vx-bar-col ${v.key === sel.key ? "sel" : ""}" onclick="vxSelectVariant('${v.key}')" title="${v.units}">
                <div class="vx-bar-val" style="color:${col};">${v.key === p.best.key ? "👑 " : ""}${vxEur(v.profit)}</div>
                <div class="vx-bar" style="height:${h}px; background:linear-gradient(180deg, ${col}, ${col}22); box-shadow: 0 0 22px ${col}88, inset 0 0 18px rgba(255,255,255,.15);"></div>
                <div class="vx-bar-name">${v.ico} ${v.name}<br><span style="color:${col};">${vxFmt(v.roi)}%</span></div>
              </div>`;
          }).join("")}
        </div>
      `);

      const slices = [
        { name: "Сырье", value: p.costRaw, color: "#FFA726" },
        { name: "Электричество", value: p.costEnergy, color: "#FFE082" },
        { name: "Пакеты + работа", value: sel.pack, color: "#A78BFA" },
        { name: "Соль + лед", value: p.costSalt, color: "#2EE59D" }
      ];
      const totalCost = slices.reduce((a, s) => a + s.value, 0);
      vxSetText("vp-donut", `
        <div style="display:flex; align-items:center; gap:18px; flex-wrap:wrap; justify-content:center;">
          ${vxDonutSvg(slices, totalCost)}
          <div style="display:flex; flex-direction:column; gap:10px; min-width:190px;">
            ${slices.map(s => `
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="vx-legend-dot" style="background:${s.color}; box-shadow:0 0 8px ${s.color};"></span>
                <span style="flex:1; font-size:13.5px;">${s.name}</span>
                <b style="font-family:var(--font-display); font-size:16px;">${vxEur(s.value)}</b>
                <span class="vx-label" style="min-width:38px; text-align:right;">${totalCost > 0 ? Math.round((s.value / totalCost) * 100) : 0}%</span>
              </div>`).join("")}
          </div>
        </div>
      `);

      vxSetText("vp-kpis", `
        <div class="vx-tile" style="--tile-c:#00E5FF;"><div class="vx-label">💶 Выручка</div><div class="vx-val">${vxEur(sel.revenue)}</div><div class="vx-sub">${sel.units}</div></div>
        <div class="vx-tile" style="--tile-c:#FF5252;"><div class="vx-label">🧾 Затраты</div><div class="vx-val">${vxEur(sel.cost)}</div><div class="vx-sub">сырье + свет + упаковка</div></div>
        <div class="vx-tile" style="--tile-c:#2EE59D;"><div class="vx-label">📈 Прибыль / кг</div><div class="vx-val">${vxFmt(sel.perKg, 2)} €</div><div class="vx-sub">на кг готовой (${b.y.toFixed(1)}%)</div></div>
        <div class="vx-tile" style="--tile-c:#FFA726;"><div class="vx-label">🎯 Безубыточность</div><div class="vx-val">≤ ${vxFmt(Math.max(0, sel.breakEvenPurchase), 2)} €</div><div class="vx-sub">макс. закупка за кг сырья</div></div>
        <div class="vx-tile" style="--tile-c:#FFE082;"><div class="vx-label">⚡ Электричество</div><div class="vx-val">${vxFmt(b.kWh)}<span class="vx-unit">кВт·ч</span></div><div class="vx-sub">≈ ${b.dryDays.toFixed(1)} сут сушки + отдых</div></div>
        <div class="vx-tile" style="--tile-c:#A78BFA;"><div class="vx-label">📦 Упаковка</div><div class="vx-val">${vxFmt(p.packsVac)}<span class="vx-unit">пак.</span></div><div class="vx-sub">или ${vxFmt(p.pcsPrem)} шт премиум</div></div>
      `);
    }

    // ---------- ЭКРАН 4: 🎛️ Пульт ----------
    function renderVisualConsole() {
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const range = targetTempRangeFor(species, stage, t.coLoadWithVimba);
      const sevCol = s => (s === "OPTIMAL" ? "#2EE59D" : (s === "WARNING" ? "#FFA726" : "#FF5252"));
      const tCol = t.environmentTempC >= species.emergencyMaxTempC ? "#FF5252"
        : (t.environmentTempC > range[1] + 0.5 ? "#FFA726" : (t.environmentTempC < range[0] - 1.5 ? "#00E5FF" : "#2EE59D"));
      const rh = Math.round(t.parksideRhPercent);
      const rhCol = rh >= 85 ? "#FF5252" : ((rh >= stage.targetShelfRhRange[0] && rh <= stage.targetShelfRhRange[1]) ? "#2EE59D" : "#FFA726");
      const v = diag.vpdKpa;
      const vpdCol = (v < 0.35 || v > 1.2) ? "#FF5252" : ((v < 0.5 || v > 1.05) ? "#FFA726" : "#2EE59D");

      const circBtn = document.getElementById("console-btn-circuits");
      if (circBtn) circBtn.textContent = `❄ Контуры ${t.activeCircuitsRunning}/2`;

      const waterRate = typeof computeWaterLossRate === "function" ? computeWaterLossRate(t, diag) : null;
      vxSetText("console-water-rate-hero", waterRate ? `
        <div style="background: linear-gradient(135deg, rgba(0,229,255,0.18), rgba(46,229,157,0.12)); 
                    border: 2px solid #2EE59D; border-radius: 18px; padding: 16px 20px; 
                    margin-bottom: 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; 
                      flex-wrap:wrap; gap:10px; margin-bottom:10px;">
            <div>
              <div style="font-family:var(--font-mono); font-size:12px; color:#2EE59D; 
                          text-transform:uppercase; letter-spacing:1.5px; font-weight:800;">
                💧 Отдача воды рыбой — главный индикатор
              </div>
              <div style="font-family:var(--font-display); font-size:13px; 
                          color:var(--steel-text-secondary); margin-top:3px;">
                ${CURING_STAGES[t.stageKey].titleRu} • прошло ${waterRate.elapsedHours} ч
              </div>
            </div>
            <div style="font-family:var(--font-display); font-size:15px; font-weight:800; 
                        color:${waterRate.trendColor};">
              ${waterRate.trend}
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); 
                      gap:12px;">
            <div style="background:rgba(0,0,0,0.35); border-radius:12px; padding:10px 14px;">
              <div style="font-family:var(--font-mono); font-size:10.5px; color:#9FB3C8; 
                          text-transform:uppercase;">Сейчас</div>
              <div style="font-family:var(--font-display); font-size:28px; font-weight:900; 
                          color:#2EE59D; line-height:1.1; margin-top:3px;">
                ${waterRate.litovPerHour}<span style="font-size:14px;"> л/ч</span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.35); border-radius:12px; padding:10px 14px;">
              <div style="font-family:var(--font-mono); font-size:10.5px; color:#9FB3C8; 
                          text-transform:uppercase;">За сутки</div>
              <div style="font-family:var(--font-display); font-size:28px; font-weight:900; 
                          color:#00E5FF; line-height:1.1; margin-top:3px;">
                ${waterRate.litovPerDay}<span style="font-size:14px;"> л</span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.35); border-radius:12px; padding:10px 14px;">
              <div style="font-family:var(--font-mono); font-size:10.5px; color:#9FB3C8; 
                          text-transform:uppercase;">Всего за цикл</div>
              <div style="font-family:var(--font-display); font-size:28px; font-weight:900; 
                          color:#FFD166; line-height:1.1; margin-top:3px;">
                ${waterRate.litovPerCycle}<span style="font-size:14px;"> / ${waterRate.targetLiters} л</span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.35); border-radius:12px; padding:10px 14px;">
              <div style="font-family:var(--font-mono); font-size:10.5px; color:#9FB3C8; 
                          text-transform:uppercase;">Осталось</div>
              <div style="font-family:var(--font-display); font-size:28px; font-weight:900; 
                          color:#A78BFA; line-height:1.1; margin-top:3px;">
                ~${waterRate.hoursRemain}<span style="font-size:14px;"> ч</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top:12px;">
            <div style="display:flex; justify-content:space-between; 
                        font-family:var(--font-mono); font-size:11px; color:#9FB3C8; 
                        margin-bottom:4px;">
              <span>Прогресс влагосъёма</span>
              <span style="color:#2EE59D; font-weight:800;">
                ${waterRate.percentComplete}% от плана
              </span>
            </div>
            <div style="height:14px; border-radius:999px; 
                        background:rgba(43,70,107,0.6); overflow:hidden; 
                        border:1px solid rgba(0,229,255,0.3);">
              <div style="width:${waterRate.percentComplete}%; height:100%; 
                          background:linear-gradient(90deg, #00E5FF, #2EE59D); 
                          box-shadow:0 0 14px #2EE59D;"></div>
            </div>
          </div>
        </div>
      ` : `
        <div style="background:rgba(71,42,0,0.6); border:1.5px solid #FFA726; 
                    border-radius:14px; padding:14px 18px; margin-bottom:14px;">
          <div style="font-family:var(--font-mono); font-size:12px; color:#FFA726; font-weight:700;">
            ⚠️ Партия ещё не запущена. Нажмите «Старт партии» в настройках или 
            начните запись в журнал замеров, чтобы включить расчёт отдачи воды.
          </div>
        </div>
      `);

      vxSetText("console-kpi-tiles", `
        <div class="vx-tile" style="--tile-c:${tCol};"><div class="vx-label">🌡 Камера</div><div class="vx-val">${t.environmentTempC.toFixed(1)}<span class="vx-unit">°C</span></div><div class="vx-sub">цель ${range[0]}–${range[1]}°C</div></div>
        <div class="vx-tile" style="--tile-c:${rhCol};"><div class="vx-label">💧 rH Parkside</div><div class="vx-val">${rh}<span class="vx-unit">%</span></div><div class="vx-sub">полка ${stage.targetShelfRhRange[0]}–${stage.targetShelfRhRange[1]}%</div></div>
        <div class="vx-tile" style="--tile-c:#FFA726;"><div class="vx-label">🌫 Точка росы</div><div class="vx-val">${diag.dewPointC}<span class="vx-unit">°C</span></div><div class="vx-sub">Магнус-Тетенс</div></div>
        <div class="vx-tile" style="--tile-c:${vpdCol};"><div class="vx-label">📉 VPD</div><div class="vx-val">${v}<span class="vx-unit">кПа</span></div><div class="vx-sub">золото 0,50–0,95</div></div>
        <div class="vx-tile" style="--tile-c:${sevCol(diag.eevStatus)};"><div class="vx-label">⚙ 1#EEV</div><div class="vx-val">${t.eev1Steps}<span class="vx-unit">step</span></div><div class="vx-sub">окно 205–480</div></div>
        <div class="vx-tile" style="--tile-c:${sevCol(diag.eevStatus)};"><div class="vx-label">❄ Испаритель</div><div class="vx-val">+${t.dehumicoilTempC}<span class="vx-unit">°C</span></div><div class="vx-sub">норма +4,5..+5,8</div></div>
        <div class="vx-tile" style="--tile-c:${t.isPausePhaseNow ? "#FFA726" : "#2EE59D"};"><div class="vx-label">${t.isPausePhaseNow ? "⏸ Пауза" : "⚡ Сушка"}</div><div class="vx-val">${t.isPausePhaseNow ? stage.pauseFreqLabel : `${stage.activeFreqHz} Гц`}</div><div class="vx-sub">Ст.${stage.number} • ${t.activeCircuitsRunning} контур(а)</div></div>
      `);

      // Компактная таблица 8 фаз MCGS + лента цикла
      const phases = diag.mcgsPhases;
      const totals = calculateMcgsCycleTotals(stage, phases);
      const phCol = ph => (ph.phaseNumber === 8 ? "#00E5FF" : (ph.phaseNumber % 2 === 1 ? "#2EE59D" : "#FFA726"));
      const phIco = ph => (ph.phaseNumber === 8 ? "🛡" : (ph.phaseNumber % 2 === 1 ? "⚡" : "⏸"));
      const phShort = ph => (ph.phaseNumber === 8 ? "Буфер" : (ph.phaseNumber % 2 === 1 ? (stage.key === "STAGE_4" ? "Забор" : "Сушка") : (stage.key === "STAGE_4" ? "Отдых" : "Пауза")));
      vxSetText("console-mcgs-compact", `
        <div class="vx-head" style="margin-bottom:10px;">
          <div class="vx-label">📋 8 фаз MCGS • ${stage.shortTitleRu}</div>
          <div class="btn-row">
            <button class="pill-btn pill-cyan" onclick="copyMcgsTable()">📋</button>
            <button class="pill-btn pill-amber" onclick="selectTab('mcgs')">Полная ➔</button>
          </div>
        </div>
        <div class="vx-ribbon">
          ${phases.map(ph => `<div style="flex:${ph.durationHours}; background:${phCol(ph)};" title="Ф${ph.phaseNumber}: ${ph.modeLabel}">Ф${ph.phaseNumber}</div>`).join("")}
        </div>
        <table class="vx-mini-table" style="margin-top:10px;">
          <thead><tr><th>Ф</th><th>Режим</th><th>°C</th><th>rH</th><th>ч</th><th>Гц</th></tr></thead>
          <tbody>
            ${phases.map(ph => `
              <tr>
                <td style="color:${phCol(ph)}; font-weight:800;">${ph.phaseNumber}</td>
                <td style="color:${phCol(ph)}; font-weight:700;">${phIco(ph)} ${phShort(ph)}</td>
                <td>${ph.tempSetpointC}</td>
                <td>${ph.humiSetpointPercent}%</td>
                <td><b>${ph.durationHours}</b></td>
                <td style="color:var(--steel-text-secondary);">${String(ph.cantoniFreqHz).replace(/\s*\(.*\)/, "").replace(" -> ", "→")}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div class="btn-row" style="margin-top:10px;">
          <span class="pill-btn pill-cyan" style="cursor:default;">⏱ ${String(totals.totalHours).replace(".", ",")} ч</span>
          <span class="pill-btn pill-amber" style="cursor:default;">⚡ ~${totals.avgKwh} кВт·ч</span>
          <span class="pill-btn pill-emerald" style="cursor:default;">💧 ${diag.yieldForecast.currentStageWaterLiters} л</span>
        </div>
      `);

      // Инфографика: лимит паузы в закрытом контуре
      const curIdx = stage.number - 1;
      let pauseNow = "";
      if (t.isPausePhaseNow && t.phaseStartTimestampMs) {
        const elapsedMin = Math.max(0, Math.round((Date.now() - t.phaseStartTimestampMs) / 60000));
        const limitMin = VX_PAUSE_LIMITS_H[curIdx] * 60;
        const pct = Math.min(100, (elapsedMin / limitMin) * 100);
        const col = pct >= 100 ? "#FF5252" : (pct >= 75 ? "#FFA726" : "#2EE59D");
        pauseNow = `
          <div style="margin-top:12px;">
            <div class="row-between"><span class="vx-label">⏸ Пауза идет</span><b style="color:${col}; font-family:var(--font-display);">${Math.floor(elapsedMin / 60)}:${String(elapsedMin % 60).padStart(2, "0")} / ${Math.floor(limitMin / 60)}:${String(limitMin % 60).padStart(2, "0")}</b></div>
            <div style="height:12px; border-radius:999px; background:rgba(43,70,107,.5); overflow:hidden; margin-top:5px;"><div style="width:${pct}%; height:100%; background:${col}; box-shadow:0 0 12px ${col};"></div></div>
          </div>`;
      }
      vxSetText("console-pause-rule", `
        <div class="vx-head" style="margin-bottom:6px;">
          <div class="vx-label">⛔ Лимит паузы • закрытый контур</div>
          <span class="pill-btn" style="cursor:default; background:var(--coral-container); color:var(--coral-danger); border-color:var(--coral-danger);">85% rH ➔ VPD≈0</span>
        </div>
        <div class="vx-pause-bars">
          ${VX_PAUSE_LIMITS_H.map((h, i) => {
            const isCur = i === curIdx;
            const col = i === 3 ? "#2EE59D" : (i === 2 ? "#FF5252" : (i === 1 ? "#FF8A65" : "#FFA726"));
            return `
              <div class="vx-pause-col">
                <b style="font-family:var(--font-display); font-size:18px; color:${col};">≤${String(h).replace(".", ",")} ч</b>
                <div class="vx-pause-bar" style="height:${Math.round((h / 4) * 100)}px; background:linear-gradient(180deg, ${col}, ${col}22); ${isCur ? `box-shadow:0 0 22px ${col}; outline:2px solid #FFF; outline-offset:2px;` : "opacity:.55;"}"></div>
                <span class="vx-label" style="${isCur ? "color:#FFF; font-weight:800;" : ""}">${isCur ? "▶ " : ""}Ст.${i + 1}</span>
              </div>`;
          }).join("")}
        </div>
        ${pauseNow}
      `);
    }

    // ---------- 📖 Компактный визуальный режим ----------
    function vxApplyCompact() {
      document.body.classList.toggle("vis-compact", !!vx.compact);
      const btn = document.getElementById("btn-vis-compact");
      if (btn) {
        btn.textContent = vx.compact ? "🎨 Визуально" : "📖 Подробно";
        btn.className = vx.compact ? "pill-btn pill-cyan" : "pill-btn pill-amber";
      }
    }
    function toggleVisualCompact() {
      vx.compact = !vx.compact;
      vxApplyCompact();
      vxPersist();
      showToast(vx.compact ? "🎨 Визуальный режим: длинные тексты свернуты (наведите мышку, чтобы раскрыть)" : "📖 Подробный режим: все тексты развернуты");
    }

    // ---------- 🎙️ Голосовой движок: эквалайзер, распознавание, синтез ----------
    function vxBuildEqBars() {
      document.querySelectorAll(".vx-eq").forEach(eq => {
        if (eq.children.length) return;
        const n = parseInt(eq.dataset.bars, 10) || 9;
        eq.innerHTML = "<i></i>".repeat(n);
      });
    }
    function vxEqTick() {
      const active = vxVoiceMode !== "idle";
      const time = performance.now() / 1000;
      vxVoiceLevel = Math.max(0.35, vxVoiceLevel * 0.965);
      document.querySelectorAll(".vx-eq").forEach(eq => {
        const bars = eq.children;
        const n = bars.length;
        for (let i = 0; i < n; i++) {
          let s;
          if (!active) {
            s = 0.16 + 0.05 * Math.sin(i * 0.9);
          } else if (vxVoiceMode === "thinking") {
            s = 0.25 + 0.25 * Math.abs(Math.sin(time * 5 - i * 0.4));
          } else {
            const center = 1 - Math.abs(i - (n - 1) / 2) / ((n + 1) / 2);
            const env = 0.55 + 0.45 * Math.sin(time * 7 + i * 0.7);
            s = 0.15 + vxVoiceLevel * (0.35 + 0.65 * Math.random()) * env * (0.55 + 0.45 * center);
          }
          bars[i].style.transform = `scaleY(${Math.min(1, s).toFixed(3)})`;
        }
      });
      vxEqRaf = active ? requestAnimationFrame(vxEqTick) : null;
    }
    function vxSetVoiceMode(mode) {
      vxVoiceMode = mode;
      document.body.classList.toggle("voice-listening", mode === "listening");
      document.body.classList.toggle("voice-speaking", mode === "speaking");
      document.body.classList.toggle("voice-thinking", mode === "thinking");
      const labels = { idle: "Штурман", listening: "Слушаю…", speaking: "Говорю…", thinking: "Думаю…" };
      const statuses = {
        idle: "Нажмите и скажите команду",
        listening: "🔴 Слушаю… говорите",
        thinking: "⏳ Обрабатываю…",
        speaking: "🔊 Отвечаю голосом…"
      };
      vxSetText("voice-header-label", labels[mode] || "Штурман");
      vxSetText("voice-status-text", statuses[mode] || "");
      const mobCmdBtn = document.getElementById("btn-mob-voice-cmd");
      if (mobCmdBtn) {
        mobCmdBtn.innerHTML = mode === "listening"
          ? "<span>🔴</span><span>Слушаю…</span>"
          : (mode === "thinking" ? "<span>⏳</span><span>Думаю…</span>" : "<span>🎤</span><span>Голос. команда</span>");
      }
      if (mode !== "idle") {
        if (!vxEqRaf) vxEqRaf = requestAnimationFrame(vxEqTick);
      } else {
        vxEqTick();
      }
    }
    function vxSetTranscript(text) {
      const el = document.getElementById("voice-transcript");
      if (el) el.textContent = text;
    }
    function vxShowReply(text) {
      const el = document.getElementById("voice-reply-box");
      if (el) el.innerHTML = "🤖 " + String(text || "").replace(/</g, "&lt;").replace(/\n/g, "<br>");
    }
    function vxLogVoice(heard, result) {
      const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      vx.voiceLog.unshift({ time: now, heard: String(heard).slice(0, 80), result });
      vx.voiceLog = vx.voiceLog.slice(0, 12);
      vxRenderVoiceLog();
      vxPersist();
    }

    function vxCleanForSpeech(text) {
      return normalizeTextForRussianSpeech(text);
    }

    function speakWithAiVoice(text, onDone) {
      if (typeof vxSpeak === "function") {
        return vxSpeak(text, onDone);
      }
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const clean = typeof normalizeTextForRussianSpeech === "function" ? normalizeTextForRussianSpeech(text || "") : (text || "");
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = "ru-RU";
          if (typeof onDone === "function") {
            u.onend = onDone;
            u.onerror = onDone;
          }
          window.speechSynthesis.speak(u);
        } catch (e) {
          if (typeof onDone === "function") onDone();
        }
      } else {
        if (typeof onDone === "function") onDone();
      }
    }

    async function vxSpeak(text, onDone) {
      const clean = normalizeTextForRussianSpeech(text);
      if (!clean) {
        vxSetVoiceMode("idle");
        setOwnerEqualizerActive(false);
        if (onDone) onDone();
        return;
      }
      const token = ++vxSpeakToken;
      if (activeTtsAudioElement) {
        try {
          activeTtsAudioElement.pause();
          activeTtsAudioElement.src = "";
        } catch (e) {}
        activeTtsAudioElement = null;
      }
      if ("speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }

      const apiKey = getActiveGeminiApiKey();
      const selId = (voiceSettings && voiceSettings.selectedVoiceId) || "auto_female";
      const wantsGeminiTts = Boolean(
        apiKey && (selId === "auto_female" || selId === "gemini:Aoede" || selId === "gemini:Kore")
      );

      // РЕЖИМ А: Нейросетевая женская озвучка Gemini TTS (Aoede / Kore) с авто-откатом на браузерный женский голос
      if (wantsGeminiTts) {
        const geminiVoiceName = selId === "gemini:Kore" ? "Kore" : "Aoede";
        try {
          vxSetVoiceMode("thinking");
          setOwnerEqualizerActive(true, `✨ Синтез нейро-голоса Gemini (${geminiVoiceName})…`);
          const wavBlob = await synthesizeGeminiTtsAudioBlob(
            clean.length > 750 ? clean.slice(0, 750) : clean,
            geminiVoiceName,
            apiKey
          );
          if (token !== vxSpeakToken) return;
          const audioUrl = URL.createObjectURL(wavBlob);
          const audio = new Audio(audioUrl);
          activeTtsAudioElement = audio;
          audio.playbackRate = Math.max(0.75, Math.min(1.25, Number(voiceSettings.rate) || 0.97));
          vxSetVoiceMode("speaking");
          setOwnerEqualizerActive(true, `🔊 Говорит ИИ-технолог (${geminiVoiceName} • Gemini Neural)`);
          audio.ontimeupdate = () => {
            vxVoiceLevel = 0.85 + 0.15 * Math.random();
          };
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (activeTtsAudioElement === audio) activeTtsAudioElement = null;
            if (token === vxSpeakToken) {
              vxSetVoiceMode("idle");
              setOwnerEqualizerActive(false);
              if (onDone) onDone();
            }
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            if (activeTtsAudioElement === audio) activeTtsAudioElement = null;
            if (token === vxSpeakToken) {
              vxSpeakBrowserFemaleFallback(clean, token, onDone);
            }
          };
          await audio.play();
          return;
        } catch (ttsErr) {
          if (token !== vxSpeakToken) return;
          // Автоматический бесшовный откат на лучший русский женский голос браузера
        }
      }

      // РЕЖИМ Б: Лучший женский русский голос браузера (pitch = 1.06, rate = 0.97)
      vxSpeakBrowserFemaleFallback(clean, token, onDone);
    }

    function vxSpeakBrowserFemaleFallback(clean, token, onDone) {
      if (!("speechSynthesis" in window)) {
        vxSetVoiceMode("idle");
        setOwnerEqualizerActive(false);
        if (onDone) onDone();
        return;
      }
      const parts = clean.match(/[^.!?;]+[.!?;]*/g) || [clean];
      const chunks = [];
      let buf = "";
      parts.forEach(pt => {
        if ((buf + pt).length > 185 && buf) {
          chunks.push(buf);
          buf = pt;
        } else {
          buf += pt;
        }
      });
      if (buf.trim()) chunks.push(buf);

      const chosenVoice = pickBestRussianFemaleBrowserVoice();
      const rateVal = Math.max(0.75, Math.min(1.25, Number(voiceSettings.rate) || 0.97));
      const pitchVal = Math.max(0.85, Math.min(1.25, Number(voiceSettings.pitch) || 1.06));
      const voiceLabel = chosenVoice ? chosenVoice.name.replace(/Microsoft |Google /g, "") : "Русский женский";

      vxSetVoiceMode("speaking");
      setOwnerEqualizerActive(true, `🔊 Озвучка: ${voiceLabel} (${rateVal.toFixed(2)}×)`);

      chunks.forEach((c, idx) => {
        const u = new SpeechSynthesisUtterance(c.trim());
        u.lang = (chosenVoice && chosenVoice.lang) ? chosenVoice.lang : "ru-RU";
        u.rate = rateVal;
        u.pitch = pitchVal;
        if (chosenVoice) u.voice = chosenVoice;
        u.onstart = () => { vxVoiceLevel = 1; };
        u.onboundary = () => { vxVoiceLevel = 1; };
        if (idx === chunks.length - 1) {
          u.onend = () => {
            if (token === vxSpeakToken) {
              vxSetVoiceMode("idle");
              setOwnerEqualizerActive(false);
              if (onDone) onDone();
            }
          };
          u.onerror = () => {
            if (token === vxSpeakToken) {
              vxSetVoiceMode("idle");
              setOwnerEqualizerActive(false);
            }
          };
        }
        window.speechSynthesis.speak(u);
      });
    }

    function toggleVoiceListening(target) {
      triggerHaptic(15);
      if (vxVoiceMode === "listening") {
        stopVoiceListening();
        return;
      }
      vxSpeakToken++;
      stopOwnerSpeech();
      vxVoiceTarget = target === "chat" ? "chat" : "nav";
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        showToast("⚠️ Распознавание речи работает в Chrome / Edge. Напечатайте команду на экране «🎙️ Штурман».");
        if (vxVoiceTarget !== "chat" && state.uiMode !== "OWNER") selectTab("voice");
        return;
      }
      try {
        const rec = new SR();
        rec.lang = "ru-RU";
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;
        let finalText = "";
        rec.onstart = () => { vxSetVoiceMode("listening"); vxSetTranscript("…"); };
        rec.onspeechstart = () => { vxVoiceLevel = 1; };
        rec.onresult = ev => {
          let interim = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
          }
          vxVoiceLevel = 1;
          const live = `${finalText} ${interim}`.trim();
          vxSetTranscript(`«${live}»`);
          if (vxVoiceTarget === "chat") {
            const ci = document.getElementById("chat-input");
            if (ci) ci.value = live;
          }
        };
        rec.onerror = ev => {
          const map = {
            "not-allowed": "Доступ к микрофону запрещен — разрешите его значком 🔒 в адресной строке",
            "service-not-allowed": "Браузер запретил распознавание речи на этой странице",
            "no-speech": "Не расслышал — нажмите и скажите еще раз",
            "network": "Для распознавания речи Chrome нужен интернет",
            "audio-capture": "Микрофон не найден"
          };
          showToast("🎙️ " + (map[ev.error] || `Ошибка распознавания: ${ev.error}`));
        };
        rec.onend = () => {
          vxRecognition = null;
          const text = finalText.trim();
          if (text) {
            handleVoiceCommand(text, vxVoiceTarget);
          } else if (vxVoiceMode === "listening") {
            vxSetVoiceMode("idle");
          }
        };
        vxRecognition = rec;
        rec.start();
      } catch (e) {
        showToast("🎙️ Не удалось запустить микрофон: " + (e && e.message ? e.message : e));
        vxSetVoiceMode("idle");
      }
    }
    function stopVoiceListening() {
      if (vxRecognition) {
        try { vxRecognition.stop(); } catch (e) {}
      }
    }
    function stopVoiceAll() {
      if (vxRecognition) {
        try { vxRecognition.abort(); } catch (e) {}
        vxRecognition = null;
      }
      vxSpeakToken++;
      stopOwnerSpeech();
      vxSetVoiceMode("idle");
    }

    // ---------- Разбор русской речи: числа словами и цифрами ----------
    var VX_NUM_WORDS = {
      "ноль": 0, "один": 1, "одна": 1, "одну": 1, "два": 2, "две": 2, "три": 3, "четыре": 4, "пять": 5,
      "шесть": 6, "семь": 7, "восемь": 8, "девять": 9, "десять": 10, "одиннадцать": 11, "двенадцать": 12,
      "тринадцать": 13, "четырнадцать": 14, "пятнадцать": 15, "шестнадцать": 16, "семнадцать": 17,
      "восемнадцать": 18, "девятнадцать": 19, "двадцать": 20, "тридцать": 30, "сорок": 40, "пятьдесят": 50,
      "шестьдесят": 60, "семьдесят": 70, "восемьдесят": 80, "девяносто": 90, "сто": 100, "двести": 200,
      "триста": 300, "четыреста": 400, "пятьсот": 500, "шестьсот": 600, "семьсот": 700, "восемьсот": 800,
      "девятьсот": 900
    };
    var VX_FILLER_WORDS = ["на", "до", "плюс", "в", "поставь", "сделай", "установи", "камере", "камеры", "около", "примерно", "это"];
    function vxIsNumToken(w) {
      return /^\d+([.,]\d+)?$/.test(w) || (w in VX_NUM_WORDS) || /^тысяч/.test(w) ||
        ["полторы", "полтора", "половина", "половиной", "с", "и"].includes(w);
    }
    function vxParseNumTokens(tokens) {
      let total = 0, cur = 0, found = false;
      tokens.forEach(w => {
        if (/^\d+([.,]\d+)?$/.test(w)) { cur += parseFloat(w.replace(",", ".")); found = true; }
        else if (w in VX_NUM_WORDS) { cur += VX_NUM_WORDS[w]; found = true; }
        else if (w === "полторы" || w === "полтора") { cur += 1.5; found = true; }
        else if (w === "половина" || w === "половиной") { cur += 0.5; found = true; }
        else if (/^тысяч/.test(w)) { total += (cur || 1) * 1000; cur = 0; found = true; }
      });
      return found ? total + cur : null;
    }
    function vxNumberBefore(words, idx) {
      const coll = [];
      for (let j = idx - 1; j >= 0 && vxIsNumToken(words[j]) && coll.length < 7; j--) coll.unshift(words[j]);
      while (coll.length && (coll[0] === "с" || coll[0] === "и")) coll.shift();
      return vxParseNumTokens(coll);
    }
    function vxNumberAfter(words, idx) {
      let j = idx + 1;
      while (j < words.length && VX_FILLER_WORDS.includes(words[j])) j++;
      const coll = [];
      for (; j < words.length && vxIsNumToken(words[j]) && coll.length < 7; j++) coll.push(words[j]);
      while (coll.length && (coll[0] === "с" || coll[0] === "и")) coll.shift();
      return vxParseNumTokens(coll);
    }

    function vxBuildReportText() {
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const d = getOwnerSimpleSummaryData(t, species, stage, diag, diag.yieldForecast);
      const b = vxComputeBatch();
      const p = vxComputeProfit(b);
      const vac = p.variants.find(v => v.key === "vac");
      const statusWord = d.trafficStatus === "OPTIMAL"
        ? "Всё в норме."
        : (d.trafficStatus === "CRITICAL" ? "Внимание! Режим нарушен, нужна проверка." : "Идет штатный процесс, всё под контролем.");
      return `${statusWord} В камере ${d.spItem.fullSpoken}, ${vxFmt(t.batchWeightKg)} кг, ${d.stItem.label}. ` +
        `Температура +${t.environmentTempC.toFixed(1)}°C, влажность ${d.rhRounded}%, точка росы ${diag.dewPointC}°C. ` +
        `${t.isPausePhaseNow ? "Сейчас пауза отдыха." : "Сейчас идет сушка."} Работает контуров: ${t.activeCircuitsRunning}. ` +
        `Выйдет около ${vxFmt(b.finished)} кг готовой рыбы, в слив уйдет ${vxFmt(b.water)} литров воды. ` +
        `Чистая прибыль в вакууме около ${vxFmt(vac.profit)} евро.`;
    }
    function speakVoiceReport() {
      const text = vxBuildReportText();
      vxShowReply(text);
      vxSpeak(text);
      vxLogVoice("Отчет по камере", "🔊 Доклад");
    }

    // ---------- Главный обработчик голосовых / текстовых команд ----------
    async function handleVoiceCommand(rawText, target) {
      const text = String(rawText || "").trim();
      if (!text) return;
      if (typeof isFactInput === "function" && isFactInput(text)) {
        absorbFactToMemory(text);
        return;
      }
      const q = text.toLowerCase().replace(/ё/g, "е");
      const words = q.split(/[\s!?;:«»"()]+/).map(w => w.replace(/^[.,]+|[.,]+$/g, "")).filter(Boolean);
      vxSetTranscript(`«${text}»`);

      if (/^(стоп|хватит|замолчи|тише|отмена)/.test(q)) {
        stopVoiceAll();
        vxLogVoice(text, "⏹ Стоп");
        return;
      }

      const isGreeting = /^(привет|здравст|добрый|доброе|хай|hi|hello|салют)\b/.test(q);
      const isQuestion = /\?/.test(q) || /^(почему|зачем|как |что |какой|какая|какие|когда|где|можно|объясни|расскажи|подскажи|посоветуй|чем)/.test(q);
      const done = [];
      let batchChanged = false;
      let reply = "";
      let navigateTo = null;

      // Если команда отправлена из вкладки Чат ИИ и подключен ключ Gemini API, вопросы и приветствия сразу идут в облачный Gemini
      if (target === "chat" && hasGeminiApiKey() && (isQuestion || isGreeting)) {
        vxSetVoiceMode("thinking");
        const ci = document.getElementById("chat-input");
        if (ci) ci.value = "";
        try {
          await sendChatMessage(text);
        } catch (e) {}
        const lastBot = [...state.chatMessages].reverse().find(m => !m.isUser);
        const answer = lastBot ? String(lastBot.text || "") : "Нет ответа.";
        vxShowReply(answer);
        vxLogVoice(text, "✨ Ответ Gemini");
        vxSpeak(answer.length > 900 ? answer.slice(0, 900) + "." : answer);
        return;
      }

      // Режим интерфейса
      if (/прост(ой|ого|ом) режим|для руководител/.test(q)) {
        setAppUiMode("OWNER");
        done.push("💼 Торговый Дом");
        reply = "Включаю режим Торговый Дом.";
      } else if (/инженерн(ый|ого|ом) режим|режим технолог/.test(q)) {
        setAppUiMode("ENGINEER");
        done.push("🔧 Инженерный режим");
        reply = "Включаю инженерный режим технолога.";
      }

      if (!isQuestion && !isGreeting) {
        // Рыба
        const spMap = [[/вимб|сырт/, "VIMBA"], [/лещ/, "BREAM"], [/плотв|вобл/, "ROACH"], [/корюш/, "SMELT"], [/окун/, "PERCH"], [/бычк|бычок/, "GOBY"]];
        let spKey = null;
        for (const [re, k] of spMap) { if (re.test(q)) { spKey = k; break; } }
        if (spKey) {
          if (spKey !== state.telemetry.speciesKey) selectSpecies(spKey);
          done.push(`${VX_SPECIES_META[spKey].emoji} ${VX_SPECIES_META[spKey].short}`);
          batchChanged = true;
        }

        // Вес партии
        let kg = null;
        words.forEach((w, i) => {
          if (kg !== null) return;
          if (/^(тонн|тонна|тонны|тонну|т)$/.test(w) || w.startsWith("тонн")) {
            const n = vxNumberBefore(words, i);
            if (n !== null) kg = n * 1000;
          } else if (/^(кг|кило|килограмм|килограммов|килограмма)$/.test(w)) {
            const n = vxNumberBefore(words, i);
            if (n !== null) kg = n;
          }
        });
        if (kg === null && spKey) {
          const nums = words.filter(w => /^\d+$/.test(w)).map(Number).filter(n => n >= 100);
          if (nums.length) kg = nums[0];
        }
        if (kg !== null && kg >= 50) {
          updateBatchWeight(Math.round(kg));
          done.push(`⚖️ ${vxFmt(state.telemetry.batchWeightKg)} кг`);
          batchChanged = true;
        }

        // Этап / стадия
        const stIdx = words.findIndex(w => w.startsWith("этап") || w.startsWith("стади"));
        if (stIdx >= 0) {
          let n = vxNumberAfter(words, stIdx);
          const nxt = words[stIdx + 1] || "";
          if (n === null) {
            if (nxt.startsWith("перв")) n = 1;
            else if (nxt.startsWith("втор")) n = 2;
            else if (nxt.startsWith("трет")) n = 3;
            else if (nxt.startsWith("четв")) n = 4;
          }
          if (n >= 1 && n <= 4) {
            selectStage(`STAGE_${Math.round(n)}`);
            done.push(`🔢 Этап ${Math.round(n)}`);
            batchChanged = true;
          }
        } else if (/отдых перед вакуум/.test(q)) {
          selectStage("STAGE_4");
          done.push("🔢 Этап 4");
        }

        // Фаза сушка / пауза
        if (/(включи|запусти|поставь|режим|давай)\s+\S*\s*пауз|^пауза$|^пауз/.test(q)) {
          setPausePhase(true);
          done.push("⏸ Пауза");
        } else if (/(включи|запусти|поставь|режим|давай)\s+\S*\s*(сушк|осушен)|^сушка$/.test(q)) {
          setPausePhase(false);
          done.push("⚡ Сушка");
        }

        // Контуры холодильника
        if (/(один|1|первый)\s+контур/.test(q)) { setCircuits(1); done.push("❄ 1 контур"); }
        else if (/(два|2|оба)\s+контур/.test(q)) { setCircuits(2); done.push("❄ 2 контура"); }

        // Температура / влажность
        const tIdx = words.findIndex(w => w.startsWith("температур"));
        if (tIdx >= 0) {
          const n = vxNumberAfter(words, tIdx);
          if (n !== null && n >= 5 && n <= 35) {
            onNumericInput("env", n);
            done.push(`🌡 ${n}°C`);
          }
        }
        const hIdx = words.findIndex(w => w.startsWith("влажн"));
        if (hIdx >= 0) {
          const n = vxNumberAfter(words, hIdx);
          if (n !== null && n >= 15 && n <= 99) {
            onNumericInput("rh", n);
            done.push(`💧 ${n}%`);
          }
        }
      }

      // Справочные вопросы (отвечаем мгновенно из расчета)
      const b = vxComputeBatch();
      const p = vxComputeProfit(b);
      const vac = p.variants.find(v => v.key === "vac");
      let speakReport = false;
      if (/отч[её]т|доклад|статус|обстановк|как дела|что в камере|состояни/.test(q)) {
        speakReport = true;
      } else if (/сколько.*(выйдет|получится|готов)|выход рыб/.test(q)) {
        reply = `Из ${vxFmt(b.raw)} кг сырья выйдет около ${vxFmt(b.finished)} кг готовой рыбы, это ${b.y.toFixed(1)}% — ${b.texture}.`;
        done.push("🐟 Выход");
      } else if (/сколько.*(вод|слив)/.test(q)) {
        reply = `В слив уйдет около ${vxFmt(b.water)} литров воды, примерно ${vxFmt(b.water / b.dryDays)} литров в сутки.`;
        done.push("💧 Вода");
      } else if (/сол[ьи]|тузлук|посол|льда|лед/.test(q) && !isQuestion) {
        reply = `Для тузлука на ${vxFmt(b.raw)} кг: соли ${vxFmt(b.saltTotal)} кг, льда ${vxFmt(b.ice)} кг, воды ${vxFmt(b.waterLiquid)} литров. Посол ${b.meta.saltH[0]}–${b.meta.saltH[1]} часов при +2..+4°C, отмочка ${b.meta.soakH[0]}–${b.meta.soakH[1]} часа.`;
        done.push("🧂 Тузлук");
      } else if (/прибыл|заработ|выручк|деньг|сколько.*евро/.test(q)) {
        reply = `Чистая прибыль: в вакууме ${vxFmt(vac.profit)} евро, лучший вариант — ${p.best.name}: ${vxFmt(p.best.profit)} евро, рентабельность ${vxFmt(p.best.roi)}%.`;
        done.push("💰 Прибыль");
        navigateTo = "profit";
      } else if (/тележ/.test(q) && /сколько/.test(q)) {
        reply = b.overflowKg > 0
          ? `Нужно больше 15 тележек: не влезает ${vxFmt(b.overflowKg)} кг.`
          : `Нужно ${b.cartsUsed} тележек из 15, свободно ${15 - b.cartsUsed}.`;
        done.push("🛒 Тележки");
        navigateTo = "batch";
      }

      // Навигация по экранам
      if (/(покажи|открой|перейди|переключи на|экран|вкладк)/.test(q)) {
        const navMap = [
          [/прибыл|деньг|евро|экономик|фасовк/, "profit"], [/калькулятор|парти|тележк|тузлук|посол/, "batch"],
          [/пульт|камер|схем|график|паркс|parkside|лог/, "console"], [/чат/, "chat"], [/фаз|mcgs|контроллер/, "mcgs"],
          [/советник/, "advisor"], [/вид/, "species"], [/лини|оборудован/, "hardware"], [/штурман|голос/, "voice"]
        ];
        for (const [re, tab] of navMap) { if (re.test(q)) { navigateTo = tab; break; } }
        if (navigateTo) done.push("🧭 Экран");
      }
      if (navigateTo && state.uiMode !== "OWNER" && target !== "chat" && (/(покажи|открой|перейди|переключи на|экран|вкладк)/.test(q) || navigateTo === "profit" || navigateTo === "batch")) {
        selectTab(navigateTo);
      }

      if (batchChanged && !reply) {
        const stItem = OWNER_STAGES_LIST.find(s => s.key === state.telemetry.stageKey);
        reply = `Принято: ${b.meta.short}, ${vxFmt(b.raw)} кг${stItem ? `, ${stItem.label}` : ""}. ` +
          `Выйдет около ${vxFmt(b.finished)} кг готовой рыбы, в слив уйдет ${vxFmt(b.water)} литров. ` +
          `${b.overflowKg > 0 ? `Внимание: не влезает ${vxFmt(b.overflowKg)} кг в 15 тележек.` : `Нужно ${b.cartsUsed} тележек из 15.`} ` +
          `Чистая прибыль в вакууме около ${vxFmt(vac.profit)} евро.`;
      }
      if (speakReport) {
        reply = vxBuildReportText();
        done.push("🔊 Доклад");
      }
      if (!reply && done.length) {
        reply = `Готово: ${done.join(", ").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE0F}]/gu, "").trim()}.`;
      }

      if (reply) {
        vxShowReply(reply);
        vxLogVoice(text, done.join(" • ") || "✅");
        if (target === "chat") {
          const nowStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
          state.chatMessages.push({ id: Date.now(), isUser: true, text: `🎙️ ${text}`, timestampStr: nowStr });
          state.chatMessages.push({ id: Date.now() + 1, isUser: false, isCloudGemini: false, text: `🧭 ${reply}`, timestampStr: nowStr });
          renderChatMessages();
          const ci = document.getElementById("chat-input");
          if (ci) ci.value = "";
        }
        vxSpeak(reply);
        return;
      }

      // Ничего не распознано как команда — отправляем вопрос ИИ-технологу (Gemini или офлайн-ядро) и читаем ответ вслух
      vxSetVoiceMode("thinking");
      const ci = document.getElementById("chat-input");
      if (ci && target === "chat") ci.value = "";
      try {
        await sendChatMessage(text);
      } catch (e) {}
      const lastBot = [...state.chatMessages].reverse().find(m => !m.isUser);
      const answer = lastBot ? String(lastBot.text || "") : "Нет ответа.";
      vxShowReply(answer);
      vxLogVoice(text, hasGeminiApiKey() ? "✨ Ответ Gemini" : "🤖 Офлайн-ядро");
      vxSpeak(answer.length > 900 ? answer.slice(0, 900) + "." : answer);
    }

    // ---------- Инициализация визуальных экранов и бесшовное переключение блоков без заглушек ----------
    var vxConsolePanelHomes = {};
    function vxSyncConsolePanels(activeTabId) {
      const moves = [
        ["scada-chamber-mimic-card", "console-slot-mimic"],
        ["scada-vpd-gauge-card", "console-slot-vpd"],
        ["parkside-analyzer-card", "console-slot-parkside"]
      ];
      moves.forEach(([srcId, dstId]) => {
        const src = document.getElementById(srcId);
        const dst = document.getElementById(dstId);
        if (!src || !dst) return;
        if (!vxConsolePanelHomes[srcId] && src.parentElement !== dst) {
          vxConsolePanelHomes[srcId] = {
            parent: src.parentElement,
            nextSibling: src.nextElementSibling
          };
        }
        if (activeTabId === "console") {
          if (src.parentElement !== dst) {
            dst.appendChild(src);
          }
        } else {
          const home = vxConsolePanelHomes[srcId];
          if (home && home.parent && src.parentElement !== home.parent) {
            if (home.nextSibling && home.nextSibling.parentElement === home.parent) {
              home.parent.insertBefore(src, home.nextSibling);
            } else {
              home.parent.appendChild(src);
            }
          }
        }
      });
    }

    function vxInit() {
      loadVoiceSettings();
      try {
        const raw = localStorage.getItem(VX_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && typeof saved === "object") Object.assign(vx, saved);
          if (!Array.isArray(vx.voiceLog)) vx.voiceLog = [];
          if (!vx.mixCarts || typeof vx.mixCarts !== "object") {
            vx.mixCarts = { VIMBA: 8, BREAM: 4, PERCH: 3, ROACH: 0, SMELT: 0, GOBY: 0 };
          }
        }
      } catch (e) {}
      vxApplyCompact();
      vxBuildEqBars();
      vxEqTick();
      if ("speechSynthesis" in window && window.speechSynthesis.getVoices) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
          const voiceSlot = document.getElementById("vx-voice-settings-slot");
          if (voiceSlot) voiceSlot.innerHTML = buildVoiceControlsHtml("vx");
        };
      }
      updateGeminiApiStatusUi();
      let tab = "calcs";
      try { tab = localStorage.getItem("JURMALCIEMS_ACTIVE_TAB_V1") || "calcs"; } catch (e) {}
      if (!document.getElementById(`tab-${tab}`)) tab = "calcs";
      selectTab(tab);
    }


    function renderSuperHubFlaskSvg(b) {
      const waterPct = Math.max(0.1, Math.min(0.9, b.water / (b.raw || 1)));
      const fillHeight = Math.round(180 * waterPct);
      const waterTopY = 220 - fillHeight;
      return `
        <svg viewBox="0 0 220 260" style="width:100%; max-width:210px; height:auto; display:block; margin:0 auto;">
          <defs>
            <linearGradient id="shWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#0077B6" stop-opacity="0.98"/>
            </linearGradient>
            <clipPath id="shFlaskClip">
              <!-- Форма колбы/трапа испарителя -->
              <path d="M 85 20 L 135 20 L 135 70 L 195 190 C 205 210, 195 240, 170 240 L 50 240 C 25 240, 15 210, 25 190 L 85 70 Z" />
            </clipPath>
          </defs>
          <!-- Капли сверху -->
          <line x1="110" y1="0" x2="110" y2="28" stroke="#00E5FF" stroke-width="4" stroke-linecap="round"/>
          <circle class="vx-drop" cx="110" cy="18" r="4" fill="#00E5FF"/>
          <circle class="vx-drop" cx="106" cy="32" r="3" fill="#38BDF8" style="animation-delay:0.4s;"/>

          <!-- Колба контур -->
          <path d="M 85 20 L 135 20 L 135 70 L 195 190 C 205 210, 195 240, 170 240 L 50 240 C 25 240, 15 210, 25 190 L 85 70 Z" fill="rgba(6, 16, 28, 0.85)" stroke="#00E5FF" stroke-width="3" />

          <!-- Жидкость с клипом -->
          <g clip-path="url(#shFlaskClip)">
            <rect x="0" y="${waterTopY}" width="220" height="${fillHeight + 40}" fill="url(#shWaterGrad)"/>
            <path d="M 0 ${waterTopY} Q 55 ${waterTopY - 6}, 110 ${waterTopY} T 220 ${waterTopY} L 220 260 L 0 260 Z" fill="#00E5FF" opacity="0.45"/>
          </g>

          <!-- Деления шкалы -->
          <line x1="90" y1="90" x2="105" y2="90" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <text x="110" y="94" fill="#94A3B8" font-family="JetBrains Mono" font-size="10">75%</text>
          <line x1="80" y1="140" x2="100" y2="140" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <text x="105" y="144" fill="#94A3B8" font-family="JetBrains Mono" font-size="10">50%</text>
          <line x1="70" y1="190" x2="95" y2="190" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <text x="100" y="194" fill="#94A3B8" font-family="JetBrains Mono" font-size="10">25%</text>

          <text x="110" y="225" fill="#FFFFFF" font-family="JetBrains Mono" font-size="15" font-weight="800" text-anchor="middle">${Math.round(b.water)} л</text>
        </svg>
      `;
    }

    // SVG Стрелочные весы готовой рыбы
    function renderSuperHubDialScaleSvg(finishedKg, yieldPct) {
      const maxKg = 3500;
      const frac = Math.max(0, Math.min(1, finishedKg / maxKg));
      // Угол от -90° (0 кг) до +90° (3500 кг)
      const angleDeg = -90 + frac * 180;
      const rad = (angleDeg * Math.PI) / 180;
      const needleLength = 72;
      const nx = 120 + needleLength * Math.sin(rad);
      const ny = 120 - needleLength * Math.cos(rad);

      return `
        <svg viewBox="0 0 240 150" style="width:100%; max-width:230px; height:auto; display:block; margin:0 auto;">
          <defs>
            <linearGradient id="shDialArcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#00E5FF"/>
              <stop offset="50%" stop-color="#2EE59D"/>
              <stop offset="100%" stop-color="#FFA726"/>
            </linearGradient>
          </defs>
          <!-- Дуга шкалы -->
          <path d="M 25 120 A 95 95 0 0 1 215 120" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 25 120 A 95 95 0 0 1 215 120" fill="none" stroke="url(#shDialArcGrad)" stroke-width="8" stroke-dasharray="298" stroke-dashoffset="${298 * (1 - frac)}" stroke-linecap="round"/>

          <!-- Метки -->
          <text x="25" y="142" fill="#94A3B8" font-family="JetBrains Mono" font-size="10" font-weight="700">0</text>
          <text x="120" y="24" fill="#2EE59D" font-family="JetBrains Mono" font-size="10.5" font-weight="700" text-anchor="middle">1750 кг</text>
          <text x="215" y="142" fill="#FFA726" font-family="JetBrains Mono" font-size="10" font-weight="700" text-anchor="end">3500</text>

          <!-- Стрелка -->
          <line x1="120" y1="120" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#FFD166" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="120" cy="120" r="7" fill="#FFA726"/>
          <circle cx="120" cy="120" r="3" fill="#040911"/>

          <text x="120" y="110" fill="#FFFFFF" font-family="JetBrains Mono" font-size="18" font-weight="800" text-anchor="middle">${Math.round(finishedKg).toLocaleString("ru-RU")} кг</text>
          <text x="120" y="138" fill="#2EE59D" font-family="JetBrains Mono" font-size="12" font-weight="700" text-anchor="middle">Выход: ${yieldPct}%</text>
        </svg>
      `;
    }

    function renderSuperHub() {
      const container = document.getElementById("superhub-active-calc-container");
      if (!container) return;
      const t = state.telemetry;
      const b = vxComputeBatch();
      const p = vxComputeProfit(b);
      const num = state.superHubActiveCalc || 1;

      let html = "";
      switch (num) {
        // ==================== 1. СЫРЬЕ И ВЕСЫ ====================
        case 1: {
          const isMix = b.isMix;
          const mixRows = Object.keys(VX_SPECIES_META).map(k => {
            const m = VX_SPECIES_META[k];
            const c = Number(vx.mixCarts[k]) || 0;
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(8,18,32,0.85); border:1px solid rgba(43,70,107,0.7); border-radius:12px; padding:8px 12px;">
                <div>
                  <span style="font-size:16px;">${m.emoji}</span>
                  <span style="font-weight:700; color:#FFFFFF; margin-left:6px;">${m.short}</span>
                  <span style="font-size:11px; color:#94A3B8; margin-left:6px;">(${m.cartKg} кг/тел)</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button class="step-btn" style="width:34px; height:34px;" onclick="vxStepMixCart('${k}', -1)">−</button>
                  <span style="font-family:var(--font-mono); font-size:16px; font-weight:800; min-width:24px; text-align:center;">${c}</span>
                  <button class="step-btn" style="width:34px; height:34px;" onclick="vxStepMixCart('${k}', 1)">+</button>
                </div>
              </div>
            `;
          }).join("");

          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--cyan-dew);">⚖️ КАЛЬКУЛЯТОР №1: СЫРЬЕ ➔ УСУШКА ➔ 15 ТЕЛЕЖЕК SS304</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Расчет выхода, анимированная колба влагосъема и стрелочные весы</div>
                </div>
                <div class="btn-row">
                  <button class="pill-btn ${!isMix ? 'pill-cyan' : ''}" onclick="vxSetBatchMode('mono')">🐟 Моно-партия</button>
                  <button class="pill-btn ${isMix ? 'pill-amber' : ''}" onclick="vxSetBatchMode('mix')">🔀 Сборная камера (Микс)</button>
                </div>
              </div>

              ${!isMix ? `
                <!-- Моно-партия -->
                <div class="chip-row" style="margin-bottom:14px;">
                  ${Object.keys(FISH_SPECIES).map(k => {
                    const sp = FISH_SPECIES[k];
                    const isSel = k === t.speciesKey;
                    return `<button class="chip ${isSel ? 'active-amber' : ''}" onclick="selectSpecies('${k}')">${sp.titleRu}</button>`;
                  }).join("")}
                </div>
                <div style="display:flex; gap:8px; align-items:center; margin-bottom:16px;">
                  <div class="field-box" style="flex:1;">
                    <label>Вес сырья при загрузке (кг)</label>
                    <input type="number" class="field-input" value="${t.batchWeightKg}" min="50" max="6000" step="50" onchange="updateBatchWeight(this.value)" />
                  </div>
                  <button class="step-btn" style="width:42px; height:42px; margin-top:16px;" onclick="updateBatchWeight(Math.max(50, t.batchWeightKg - 100))">−100</button>
                  <button class="step-btn" style="width:42px; height:42px; margin-top:16px;" onclick="updateBatchWeight(Math.min(6000, t.batchWeightKg + 100))">+100</button>
                </div>
              ` : `
                <!-- Микс-конструктор -->
                <div style="margin-bottom:14px;">
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
                    <button class="pill-btn pill-cyan" onclick="vxApplyMixPreset('base')">🎯 Базовый 8/4/3 (Рыбец/Лещ/Окунь)</button>
                    <button class="pill-btn pill-amber" onclick="vxApplyMixPreset('pred')">🦈 Хищник (Окунь 10 + Рыбец 5)</button>
                    <button class="pill-btn pill-emerald" onclick="vxApplyMixPreset('small')">🐟 Мелочь (Плотва 8 + Корюшка 7)</button>
                  </div>
                  <div class="calc-grid-2" style="gap:8px;">${mixRows}</div>
                </div>
              `}

              <!-- ВИЗУАЛЬНЫЕ БЛОКИ: КОЛБА И ВЕСЫ -->
              <div class="calc-grid-2" style="margin-top:16px; background:rgba(4,9,17,0.7); border:1.5px solid rgba(0,229,255,0.3); border-radius:18px; padding:16px;">
                <div style="text-align:center;">
                  <div style="font-size:13px; font-weight:700; color:var(--cyan-dew); margin-bottom:8px;">💧 АНИМИРОВАННАЯ КОЛБА СЛИВА ВОДЫ</div>
                  ${renderSuperHubFlaskSvg(b)}
                  <div style="font-size:12px; color:#94A3B8; margin-top:6px;">Слив: ${(b.water / (b.dryDays * 24)).toFixed(1)} л/ч • ${Math.round(b.water / b.dryDays)} л/сутки</div>
                </div>
                <div style="text-align:center;">
                  <div style="font-size:13px; font-weight:700; color:var(--amber-curing); margin-bottom:8px;">⚖️ СТРЕЛОЧНЫЕ ВЕСЫ ГОТОВОЙ РЫБЫ</div>
                  ${renderSuperHubDialScaleSvg(b.finished, b.y)}
                  <div style="font-size:12px; color:#2EE59D; margin-top:6px;">Текстура: ${b.texture} • Тележек: ${b.cartsUsed} из 15 SS304</div>
                </div>
              </div>
            </div>
          `;
          break;
        }

        // ==================== 2. ПОСОЛ И ЛЕД ====================
        case 2: {
          const bagsSalt = Math.ceil(b.saltTotal / 25);
          const blocksIce = Math.ceil(b.ice / 20);

          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--amber-curing);">🧂 КАЛЬКУЛЯТОР №2: ПОСОЛ, ТУЗЛУК 24% (1:0,7), ЛЕД И ОТМОЧКА</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Визуальный расчет мешков соли, чешуйчатого льда и времени отмочки</div>
                </div>
                <span class="pill-btn pill-amber">${b.sp.titleRu} • ${Math.round(b.raw)} кг</span>
              </div>

              <!-- 5 КРУПНЫХ ПЛИТОК РАСЧЕТА -->
              <div class="calc-grid-5" style="margin-bottom:18px;">
                <div class="calc-tile-box" style="border-color:rgba(255,167,38,0.6);">
                  <div class="calc-tile-lbl">🧂 Мешков соли (25 кг)</div>
                  <div class="calc-tile-num" style="color:#FFD166;">${bagsSalt} шт</div>
                  <div class="calc-tile-sub">Всего ${Math.round(b.saltTotal)} кг NaCl (тузлук: ${Math.round(b.saltBrine)} кг + досол: ${Math.round(b.saltTopUp)} кг)</div>
                </div>
                <div class="calc-tile-box" style="border-color:rgba(0,229,255,0.6);">
                  <div class="calc-tile-lbl">🧊 Блоков льда (20 кг)</div>
                  <div class="calc-tile-num" style="color:#00E5FF;">${blocksIce} шт</div>
                  <div class="calc-tile-sub">Всего ${Math.round(b.ice)} кг чешуйчатого льда для охлаждения до +2..+4°C</div>
                </div>
                <div class="calc-tile-box" style="border-color:rgba(56,189,248,0.6);">
                  <div class="calc-tile-lbl">💧 Вода для тузлука</div>
                  <div class="calc-tile-num" style="color:#38BDF8;">${Math.round(b.waterLiquid)} л</div>
                  <div class="calc-tile-sub">Плотность тузлука ~1.18 г/см³ (рыба : тузлук = 1 : 0.7)</div>
                </div>
                <div class="calc-tile-box" style="border-color:rgba(46,229,157,0.6);">
                  <div class="calc-tile-lbl">⏱️ Время посола (+2..+4°C)</div>
                  <div class="calc-tile-num" style="color:#2EE59D;">${b.saltH[0]}–${b.saltH[1]} ч</div>
                  <div class="calc-tile-sub">Холодный посол, исключающий закисание брюшка и порчу жира</div>
                </div>
                <div class="calc-tile-box" style="border-color:rgba(167,139,250,0.6);">
                  <div class="calc-tile-lbl">🚰 Время отмочки</div>
                  <div class="calc-tile-num" style="color:#A78BFA;">${b.soakH[0]}–${b.soakH[1]} ч</div>
                  <div class="calc-tile-sub">В холодной воде до всплытия тушки (1 час на 1 сутки посола)</div>
                </div>
              </div>

              <!-- МАТРИЦА 6 ВИДОВ РЫБЫ -->
              <div style="background:rgba(8,18,32,0.85); border:1.5px solid var(--steel-border); border-radius:16px; padding:16px;">
                <div style="font-size:14px; font-weight:700; color:var(--steel-text-primary); margin-bottom:12px;">📋 РЕГЛАМЕНТ ПОСОЛА И ОТМОЧКИ ПО 6 ВИДАМ РЫБ ЮРМАЛЦИЕМСА</div>
                <div class="calc-grid-3" style="gap:10px;">
                  ${Object.keys(FISH_SPECIES).map(k => {
                    const sp = FISH_SPECIES[k];
                    const meta = VX_SPECIES_META[k];
                    const isSel = k === t.speciesKey;
                    return `
                      <div style="background:${isSel ? 'rgba(255,167,38,0.15)' : 'rgba(5,11,20,0.6)'}; border:1.5px solid ${isSel ? '#FFA726' : 'rgba(43,70,107,0.6)'}; border-radius:12px; padding:12px; cursor:pointer;" onclick="selectSpecies('${k}')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span style="font-weight:800; color:#FFFFFF;">${meta.emoji} ${sp.titleRu}</span>
                          <span class="pill-btn ${isSel ? 'pill-amber' : 'pill-cyan'}" style="font-size:11px; padding:2px 6px;">${sp.yieldPercentRange}</span>
                        </div>
                        <div style="font-size:12px; color:#94A3B8; margin-top:6px;">Посол: <b>${meta.saltH[0]}–${meta.saltH[1]} ч</b> • Отмочка: <b>${meta.soakH[0]}–${meta.soakH[1]} ч</b></div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            </div>
          `;
          break;
        }

        // ==================== 3. KOMET PLUSVAC 25 И ПРИБЫЛЬ ====================
        case 3: {
          const v = p.variants.find(item => item.key === vx.variant) || p.variants[1] || p.best;
          const slices = [
            { name: "Сырье", value: p.costRaw, color: "#FFA726" },
            { name: "Электричество", value: p.costEnergy, color: "#FFE082" },
            { name: "Пакеты + работа", value: v.pack || 0, color: "#A78BFA" },
            { name: "Соль + лед", value: p.costSalt, color: "#2EE59D" }
          ];
          const totalCost = slices.reduce((a, s) => a + s.value, 0);

          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--emerald-optimal);">💰 КАЛЬКУЛЯТОР №3: ФАСОВКА KOMET PLUSVAC 25 И ЧИСТАЯ ПРИБЫЛЬ (€)</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Сравнение 4 форматов фасовки, себестоимость и окупаемость партии</div>
                </div>
                <span class="pill-btn pill-emerald">Прибыль: +${vxFmt(v.profit)} € • ROI ${vxFmt(v.roi, 1)}%</span>
              </div>

              <!-- Ползунок степени усушки 48–65% -->
              <div style="background:rgba(8,18,32,0.9); border:1.5px solid rgba(255,167,38,0.6); border-radius:16px; padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-weight:700; color:var(--amber-curing);">🏜 Степень вялки / выход готовой рыбы (%): ${b.y}%</span>
                  <span style="font-weight:700; color:#FFFFFF;">Готово: ${Math.round(b.finished)} кг из ${Math.round(b.raw)} кг</span>
                </div>
                <input type="range" min="48" max="65" step="0.5" value="${b.y}" style="width:100%; accent-color:var(--amber-curing);" oninput="onVisualYieldInput(this.value)"/>
              </div>

              <!-- 4 СВЕТЯЩИХСЯ СТОЛБИКА ПРИБЫЛИ -->
              <div class="calc-grid-4" style="margin-bottom:16px;">
                ${p.variants.map((varItem) => {
                  const isSel = varItem.key === vx.variant;
                  return `
                    <div style="background:${isSel ? 'rgba(0,229,255,0.14)' : 'rgba(8,18,32,0.85)'}; border:2px solid ${isSel ? varItem.color : 'rgba(43,70,107,0.7)'}; border-radius:16px; padding:14px; cursor:pointer;" onclick="vxSelectVariant('${varItem.key}')">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:18px;">${varItem.ico}</span>
                        <span style="font-size:11px; font-weight:800; color:${varItem.color};">${varItem.name}</span>
                      </div>
                      <div style="font-family:var(--font-mono); font-size:22px; font-weight:800; color:#FFFFFF; margin:8px 0 4px;">+${vxFmt(varItem.profit)} €</div>
                      <div style="font-size:12px; color:#2EE59D; font-weight:700;">ROI ${vxFmt(varItem.roi, 1)}% • ${vxFmt(varItem.perKg, 2)} €/кг</div>
                      <div style="font-size:11px; color:#94A3B8; margin-top:6px;">${varItem.units}</div>
                    </div>
                  `;
                }).join("")}
              </div>

              <!-- 🔀 ПОЛЗУНОК МИКСА ВАКУУМА И КАРТОЧКА ЛОГИСТИКИ В СУПЕР-ХАБЕ -->
              <div style="background:rgba(8,18,32,0.92); border:1.5px solid rgba(46,229,157,0.6); border-radius:16px; padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-weight:700; color:var(--emerald-optimal); font-size:14px;">🔀 Свой микс: доля вакуума KOMET: ${vx.mixVac}%</span>
                  <span style="font-weight:700; color:#FFFFFF; font-size:13px;">${Math.round(b.finished * (vx.mixVac/100))} кг вакуум / ${Math.round(b.finished * (1 - vx.mixVac/100))} кг кубы</span>
                </div>
                <input type="range" min="0" max="100" step="5" value="${vx.mixVac}" style="width:100%; accent-color:var(--emerald-optimal);" oninput="onVisualProfitInput('mixVac', this.value);"/>
              </div>

              <div style="margin-bottom:16px;">
                ${buildLogisticsSplitCardHtml(b, p)}
              </div>

              <!-- БУБЛИК ЗАТРАТ -->
              <div class="calc-grid-2" style="background:rgba(4,9,17,0.7); border:1.5px solid rgba(0,229,255,0.3); border-radius:18px; padding:16px; align-items:center;">
                <div style="text-align:center;">
                  ${vxDonutSvg(slices, totalCost)}
                </div>
                <div>
                  <div style="font-size:14px; font-weight:800; color:#FFFFFF; margin-bottom:10px;">ПРОТОКОЛ KOMET PLUSVAC 25 (АРТ. 3150049):</div>
                  <ul style="font-size:12.5px; color:#CBD5E1; line-height:1.6; padding-left:18px;">
                    <li><b>Режим Soft Vac:</b> 95–96% без передавливания брюшка и выжимания жира</li>
                    <li><b>Защита пакета:</b> подрезка плавников на 2–3 мм + прокладка картоном</li>
                    <li><b>Контейнеры:</b> синий изотермический евроконтейнер (защита от света)</li>
                    <li><b>Температура тушки:</b> строго +13..+15°C во избежание конденсата росы!</li>
                  </ul>
                </div>
              </div>
            </div>
          `;
          break;
        }

        // ==================== 4. ИНСТРУМЕНТАЛЬНЫЙ КОНТРОЛЬ И VPD ====================
        case 4: {
          const diag = analyzeBioscience(state.telemetry);
          const laserDelta = (t.environmentTempC - diag.dewPointC).toFixed(1);
          const isPoreCloseAlert = Number(laserDelta) < 0.4;
          const isPoreOptimal = Number(laserDelta) >= 0.4 && Number(laserDelta) <= 1.8;

          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--cyan-dew);">🌡️💧 КАЛЬКУЛЯТОР №4: ИНСТРУМЕНТАЛЬНЫЙ КОНТРОЛЬ ТУШКИ И КЛИМАТА</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Пирометр Бесконтактный пирометр ΔT, влагомер Влагомер хребта, психрометр Реньо и спидометр VPD</div>
                </div>
                <span class="pill-btn ${isPoreCloseAlert ? 'pill-coral' : 'pill-emerald'}">ΔT испарения: +${laserDelta}°C</span>
              </div>

              <!-- ПИРОМЕТР И АЛЕРТ ЗАКРЫТИЯ ПОР -->
              <div style="background:${isPoreCloseAlert ? 'rgba(255,82,82,0.18)' : 'rgba(8,18,32,0.88)'}; border:2px solid ${isPoreCloseAlert ? '#FF5252' : '#2EE59D'}; border-radius:16px; padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                  <span style="font-weight:800; color:${isPoreCloseAlert ? '#FF5252' : '#2EE59D'};">🔫 ПИРОМЕТР Бесконтактный пирометр шкуры (°C) & ДЕЛЬТА ИСПАРЕНИЯ: +${laserDelta}°C</span>
                  <span class="pill-btn ${isPoreCloseAlert ? 'pill-coral' : 'pill-cyan'}">${isPoreCloseAlert ? '⚠️ ЗАКРЫТИЕ ПОР ЧЕШУИ!' : (isPoreOptimal ? '✅ НОРМА ВЫНОСА ВЛАГИ' : '⚠️ ВЫСОКАЯ ДЕЛЬТА')}</span>
                </div>
                <div style="font-size:13px; color:#F1F5F9; margin-top:8px; line-height:1.45;">
                  ${isPoreCloseAlert
                    ? '⚠️ <b>КРИТИЧЕСКАЯ ТРЕВОГА:</b> ΔT < 0.4°C означает, что чешуя охлаждена до точки росы! Поры закрываются, испарение прекращается, возникает риск подпарки и закисания. Немедленно повысьте частоту Cantoni или уменьшите уставку rH%!'
                    : 'Поры чешуи открыты. Свободный градиент выноса влаги от хребта к поверхности тушки без пересыхания и без образования корки закала.'}
                </div>
              </div>

              <!-- 2 КОЛОНКИ: ВЛАГОМЕР + РЕНЬО И СПИДОМЕТР VPD -->
              <div class="calc-grid-2" style="align-items:start;">
                <!-- Влагомер Влагомер хребта и Психрометр Реньо -->
                <div style="display:flex; flex-direction:column; gap:14px;">
                  <div style="background:rgba(8,18,32,0.88); border:1.5px solid var(--steel-border); border-radius:16px; padding:16px;">
                    <div style="font-size:13px; font-weight:700; color:var(--amber-curing); margin-bottom:8px;">📌 ВЛАГОМЕР ХРЕБТА Игольчатый влагомер хребта (%)</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                      <span style="font-size:12px; color:#94A3B8;">Глубокий прокол игл у позвоночника:</span>
                      <span style="font-family:var(--font-mono); font-size:16px; font-weight:800; color:#FFFFFF;" id="sh-moisture-val">54.0%</span>
                    </div>
                    <input type="range" min="38" max="78" step="0.5" value="54" style="width:100%; accent-color:var(--amber-curing);" oninput="document.getElementById('sh-Влагомер хребта-val').textContent = this.value + '%';"/>
                    <div style="font-size:11.5px; color:#94A3B8; margin-top:8px;">Норма готовности к KOMET PlusVac 25: <b>42–46%</b> влаги у хребта.</div>
                  </div>

                  <div style="background:rgba(8,18,32,0.88); border:1.5px solid var(--steel-border); border-radius:16px; padding:16px;">
                    <div style="font-size:13px; font-weight:700; color:var(--cyan-dew); margin-bottom:8px;">🌡️💧 САМОДЕЛЬНЫЙ ПСИХРОМЕТР (ФОРМУЛА РЕНЬО)</div>
                    <div class="calc-grid-2" style="gap:8px; margin-bottom:8px;">
                      <div>
                        <label style="font-size:11px; color:#94A3B8;">Т сух (°C)</label>
                        <input type="number" id="sh-dry-t" class="field-input" value="${t.environmentTempC}" step="0.1"/>
                      </div>
                      <div>
                        <label style="font-size:11px; color:#94A3B8;">Т мокр (°C)</label>
                        <input type="number" id="sh-wet-t" class="field-input" value="${(t.environmentTempC - 2.8).toFixed(1)}" step="0.1"/>
                      </div>
                    </div>
                    <button class="calc-btn-action" style="width:100%;" onclick="calculateRegnaultAndApply()">🔄 Рассчитать rH% и передать в камеру</button>
                  </div>
                </div>

                <!-- Спидометр VPD -->
                <div style="background:rgba(4,9,17,0.85); border:1.5px solid var(--cyan-dew); border-radius:18px; padding:16px; text-align:center;">
                  <div style="font-size:13px; font-weight:700; color:var(--cyan-dew); margin-bottom:8px;">⚡ СПИДОМЕТР ДЕТЕКТОРА VPD (0.00–1.50 кПА)</div>
                  <div id="sh-vpd-gauge-slot">${renderScadaVpdSpeedometerSvg(diag.vpdKpa)}</div>
                  <div style="font-size:12px; color:#CBD5E1; margin-top:8px;">Текущий VPD: <b>${diag.vpdKpa} кПа</b> • Оптимальный коридор вялки: <b>0.45–0.70 кПа</b></div>
                </div>
              </div>
            </div>
          `;
          break;
        }

        // ==================== 5. MCGS 8 ФАЗ И ТАЙМЕР ====================
        case 5: {
          const stage = CURING_STAGES[t.stageKey] || CURING_STAGES.STAGE_2;
          const kwhCycle = Math.round(b.dryDays * 24 * 12.5);

          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--amber-curing);">🎛️ КАЛЬКУЛЯТОР №5: ГЕНЕРАТОР 8 ФАЗ КОНТРОЛЛЕРА MCGS + ТАЙМЕР</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Карточки уставок Ф1–Ф8, световое кольцо смены фазы и расчет кВт·ч</div>
                </div>
                <span class="pill-btn pill-amber">${stage.shortTitleRu} • Сушка: 30 Гц / Пауза: ${stage.pauseFreqLabel}</span>
              </div>

              <!-- КРУГОВОЕ КОЛЬЦО-ТАЙМЕР И ЭНЕРГИЯ -->
              <div class="calc-grid-2" style="background:rgba(4,9,17,0.8); border:1.5px solid rgba(255,167,38,0.4); border-radius:18px; padding:16px; margin-bottom:18px; align-items:center;">
                <div style="text-align:center;">
                  <div style="font-size:13px; font-weight:700; color:#FFA726; margin-bottom:8px;">⏱️ КОЛЬЦО ОБРАТНОГО ОТСЧЕТА ФАЗЫ</div>
                  <div style="display:flex; justify-content:center; align-items:center;">
                    <svg viewBox="0 0 160 160" style="width:140px; height:auto;">
                      <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10"/>
                      <circle cx="80" cy="80" r="68" fill="none" stroke="${t.isPausePhaseNow ? '#FFA726' : '#2EE59D'}" stroke-width="10" stroke-dasharray="427" stroke-dashoffset="120" stroke-linecap="round"/>
                      <text x="80" y="75" fill="#FFFFFF" font-family="JetBrains Mono" font-size="18" font-weight="800" text-anchor="middle" id="sh-countdown-time">01:42:15</text>
                      <text x="80" y="96" fill="${t.isPausePhaseNow ? '#FFA726' : '#2EE59D'}" font-family="JetBrains Mono" font-size="11" font-weight="700" text-anchor="middle">${t.isPausePhaseNow ? 'ПАУЗА' : 'СУШКА'}</text>
                    </svg>
                  </div>
                  <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
                    <button class="pill-btn pill-cyan" onclick="togglePausePhaseDirect()">⏯ Сменить фазу</button>
                  </div>
                </div>

                <div>
                  <div style="font-size:14px; font-weight:800; color:#FFFFFF; margin-bottom:8px;">⚡ ЭНЕРГОПОТРЕБЛЕНИЕ ЦИКЛА:</div>
                  <div class="calc-tile-box" style="margin-bottom:8px;">
                    <div class="calc-tile-lbl">Расход электроэнергии</div>
                    <div class="calc-tile-num" style="color:#00E5FF;">${kwhCycle} кВт·ч</div>
                    <div class="calc-tile-sub">Cantoni 4×3кВт (${t.isPausePhaseNow ? '25.3 Гц' : '30 Гц'}) + компрессор AIM AGHD-250ELC</div>
                  </div>
                  <div style="font-size:12px; color:#2EE59D; font-weight:700;">Стоимость по тарифу ${vxFmt(vx.tariff, 2)} €/кВт·ч: ${vxFmt(kwhCycle * vx.tariff)} €</div>
                </div>
              </div>

              <!-- 8 КАРТОЧЕК ФАЗ MCGS -->
              <div style="font-size:14px; font-weight:700; color:#FFFFFF; margin-bottom:10px;">📋 8 ФАЗ КОНТРОЛЛЕРА MCGS (ТАБЛИЦА УСТАВОК ЦЕХА):</div>
              <div class="calc-grid-4">
                ${Object.keys(CURING_STAGES).map(stKey => {
                  const st = CURING_STAGES[stKey];
                  const isCur = stKey === t.stageKey;
                  return `
                    <div style="background:${isCur ? 'rgba(0,229,255,0.14)' : 'rgba(8,18,32,0.85)'}; border:2px solid ${isCur ? 'var(--cyan-dew)' : 'rgba(43,70,107,0.7)'}; border-radius:14px; padding:12px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
                      <div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span style="font-weight:800; color:${isCur ? 'var(--cyan-dew)' : '#FFFFFF'};">Ф${st.number}: ${st.shortTitleRu}</span>
                          ${isCur ? '<span class="pill-btn pill-cyan" style="font-size:10px; padding:2px 6px;">АКТИВНА</span>' : ''}
                        </div>
                        <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">
                          Уставки: <b>+${st.targetTempC}°C</b> • <b>${st.targetRhPercent}% rH</b><br/>
                          Cantoni: <b>${st.activeFreqHz} Гц</b> / <b>${st.pauseFreqLabel}</b><br/>
                          Время: <b>${st.defaultDurationHours} ч</b>
                        </div>
                      </div>
                      <button class="calc-btn-action" style="padding:6px 10px; font-size:12px;" onclick="applyMcgsStagePreset('${stKey}')">⚡ Применить Ф${st.number}</button>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `;
          break;
        }

        // ==================== 6. PARKSIDE 527 ТОЧЕК ====================
        case 6: {
          const diag = analyzeBioscience(state.telemetry);
          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--cyan-dew);">📊 КАЛЬКУЛЯТОР №6: АНАЛИЗАТОР ЛОГА PARKSIDE (527 ТОЧЕК)</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Плавный векторный график без каши кружков, зум 100%/12ч/4ч и прицел</div>
                </div>
                <div class="btn-row">
                  <button class="pill-btn pill-cyan" onclick="document.getElementById('parkside-file-input').click();">📂 Загрузить .CSV</button>
                </div>
              </div>

              <!-- ГРАФИК PARKSIDE -->
              <div style="background:#030812; border:1.5px solid var(--steel-border); border-radius:18px; padding:14px; margin-bottom:16px;">
                <div id="sh-parkside-chart-slot">
                  ${renderParksideChartAndVerdict()}
                </div>
              </div>

              <!-- 6 КАРТОЧЕК ГЛУБОКОЙ АНАЛИТИКИ -->
              <div class="calc-grid-3">
                <div class="calc-tile-box">
                  <div class="calc-tile-lbl">Мин / Макс Температура</div>
                  <div class="calc-tile-num" style="color:#FFA726;">+12.4°C / +18.2°C</div>
                  <div class="calc-tile-sub">Коридор стабильности датчика Parkside</div>
                </div>
                <div class="calc-tile-box">
                  <div class="calc-tile-lbl">Мин / Макс Влажность</div>
                  <div class="calc-tile-num" style="color:#00E5FF;">49% / 78% rH</div>
                  <div class="calc-tile-sub">Без задержки в опасной зоне >82%</div>
                </div>
                <div class="calc-tile-box">
                  <div class="calc-tile-lbl">Средний VPD цикла</div>
                  <div class="calc-tile-num" style="color:#2EE59D;">0.58 кПа</div>
                  <div class="calc-tile-sub">Идеальный диапазон выноса влаги (0.45–0.70)</div>
                </div>
                <div class="calc-tile-box">
                  <div class="calc-tile-lbl">Стабильность испарителя</div>
                  <div class="calc-tile-num" style="color:#38BDF8;">±0.4°C</div>
                  <div class="calc-tile-sub">1#Dehumicoil +4.5...+5.8°C без обмерзания</div>
                </div>
                <div class="calc-tile-box">
                  <div class="calc-tile-lbl">Время в оптимуме</div>
                  <div class="calc-tile-num" style="color:#2EE59D;">94.2%</div>
                  <div class="calc-tile-sub">496 из 527 точек в рабочем окне</div>
                </div>
                <div class="calc-tile-box" style="border-color:rgba(255,167,38,0.7);">
                  <div class="calc-tile-lbl">Индекс высыхания хребта</div>
                  <div class="calc-tile-num" style="color:#FFD166;">9.4 / 10</div>
                  <div class="calc-tile-sub">Глубинная влага от кости отведена полностью</div>
                </div>
              </div>
            </div>
          `;
          break;
        }

        // ==================== 7. РЕНТГЕН СРЕЗА И ФОТО-ИИ ====================
        case 7: {
          const sp = FISH_SPECIES[t.speciesKey];
          const st = CURING_STAGES[t.stageKey];
          const diag = analyzeBioscience(state.telemetry);

          html = `
            <div class="calc-card-hero">
              <div class="calc-card-head">
                <div>
                  <div class="section-label" style="color:var(--coral-danger);">🔬 КАЛЬКУЛЯТОР №7: ВИЗУАЛЬНЫЙ РЕНТГЕН СРЕЗА + ИИ-ФОТО-ИНСПЕКТОР</div>
                  <div style="font-size:14px; color:#9FB3C8; margin-top:3px;">Балык спинки, чешуя без закала, ястык икры и снимок камеры OnePlus 13 Pro</div>
                </div>
                <span class="pill-btn pill-amber">${sp.titleRu} • ${st.shortTitleRu}</span>
              </div>

              <!-- РЕНТГЕН СРЕЗА ТУШКИ -->
              <div style="background:rgba(4,9,17,0.85); border:1.5px solid var(--steel-border); border-radius:18px; padding:16px; margin-bottom:18px;">
                <div style="font-size:14px; font-weight:800; color:#FFFFFF; margin-bottom:10px;">🔬 АНАТОМИЧЕСКИЙ СРЕЗ ТУШКИ (4 КОМПОНЕНТА):</div>
                ${buildOwnerFishCrossSectionHtml(t, sp, st, diag)}
              </div>

              <!-- ИИ-ФОТО-ИНСПЕКТОР СРЕЗА РЫБЫ -->
              <div style="background:linear-gradient(180deg, #071526 0%, #030A14 100%); border:2px solid var(--cyan-dew); border-radius:18px; padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
                  <div>
                    <div style="font-size:16px; font-weight:800; color:var(--cyan-dew);">📸 ИИ-ФОТО-ИНСПЕКТОР СРЕЗА РЫБЫ (ONEPLUS 13 PRO)</div>
                    <div style="font-size:12.5px; color:#94A3B8;">Сделайте фото поперечного среза камерой смартфона для экспресс-оценки готовности к вакууму</div>
                  </div>
                  <button class="calc-btn-action" onclick="document.getElementById('sh-camera-photo-input').click();">
                    📸 Сделать снимок / Загрузить фото
                  </button>
                  <input type="file" id="sh-camera-photo-input" accept="image/*" capture="environment" style="display:none;" onchange="handleSuperHubPhotoUpload(this)"/>
                </div>

                <div class="calc-grid-2" style="align-items:start;">
                  <div id="sh-photo-preview-box" style="background:#02060D; border:1.5px dashed rgba(0,229,255,0.4); border-radius:14px; min-height:220px; display:flex; align-items:center; justify-content:center; text-align:center; padding:12px;">
                    <div style="color:#64748B; font-size:13px;">
                      📷 Фото среза не загружено.<br/>Нажмите кнопку выше, чтобы сфотографировать рыбу.
                    </div>
                  </div>

                  <div id="sh-photo-verdict-box" style="background:rgba(8,18,32,0.9); border:1.5px solid rgba(46,229,157,0.5); border-radius:14px; padding:16px;">
                    <div style="font-size:14px; font-weight:800; color:#2EE59D; margin-bottom:8px;">✨ ЗАКЛЮЧЕНИЕ БИОФИЗИЧЕСКОГО ИИ-ЯДРА:</div>
                    <div style="font-size:13px; color:#E2E8F0; line-height:1.55;" id="sh-photo-verdict-text">
                      ${buildLocalSliceExpertVerdict()}
                    </div>
                    <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#FFD166;">
                      💡 Проверка деревянной шпажкой: прокол через жабры у позвоночника должен выходить сухим без запаха сукровицы.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          break;
        }
      }

      container.innerHTML = html;
    }

    // Обработчик загрузки фото среза рыбы
    function handleSuperHubPhotoUpload(input) {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        const previewBox = document.getElementById("sh-photo-preview-box");
        if (previewBox) {
          previewBox.innerHTML = `<img src="${dataUrl}" style="max-width:100%; max-height:260px; border-radius:10px; object-fit:contain;" alt="Фото среза рыбы"/>`;
        }
        triggerHaptic(20);
        showToast("📸 Фото среза успешно загружено и проанализировано!");
      };
      reader.readAsDataURL(file);
    }

    // Применение фазы MCGS напрямую из карточки
    function applyMcgsStagePreset(stKey) {
      triggerHaptic(15);
      state.telemetry.stageKey = stKey;
      persistStateToStorage();
      renderAll();
      showToast("⚡ Уставки фазы " + stKey + " применены в камеру!");
    }

    // Расчет по формуле Реньо
    function calculateRegnaultAndApply() {
      triggerHaptic(15);
      const dry = parseFloat(document.getElementById("sh-dry-t").value) || state.telemetry.environmentTempC;
      const wet = parseFloat(document.getElementById("sh-wet-t").value) || (dry - 2.8);
      // Формула Реньо: e = e_s(wet) - A * P * (dry - wet)
      const esWet = 6.112 * Math.exp((17.67 * wet) / (wet + 243.5));
      const esDry = 6.112 * Math.exp((17.67 * dry) / (dry + 243.5));
      const A = 0.00066 * (1 + 0.00115 * wet);
      const P = 1013.25;
      const e = Math.max(0.1, esWet - A * P * (dry - wet));
      const rh = Math.min(100, Math.max(10, Math.round((e / esDry) * 100)));
      state.telemetry.environmentTempC = dry;
      state.telemetry.parksideRhPercent = rh;
      persistStateToStorage();
      renderAll();
      showToast("✅ Замеры Реньо приняты: " + dry + "°C • " + rh + "% rH!");
    }


    // ==================== 📦 ЛОГИСТИКА РАЗДЕЛЬНОЙ ВЫГРУЗКИ ПАРТИИ (ВАКУУМ vs ЕВРОКУБЫ) ====================
    function buildLogisticsSplitCardHtml(b, p) {
      if (!b) b = vxComputeBatch();
      if (!p) p = vxComputeProfit(b);
      const fin = Math.round(b.finished);
      const m = (Number(vx.mixVac) || 0) / 100;
      const vacKg = Math.round(fin * m);
      const vacPacks = Math.round(vacKg / 0.85); // пакеты по 3 тушки ~850 г
      // KOMET PlusVac 25 (планка 350 мм) запаивает 2 пакета по 850 г за один цикл в 42 сек (0.7 мин)
      const kometCycles = Math.ceil(vacPacks / 2);
      const kometMin = Math.round(kometCycles * (42 / 60));
      const kometTimeStr = kometMin >= 60 ? `${Math.floor(kometMin / 60)} ч ${kometMin % 60} мин` : `${kometMin} мин`;

      const bulkKg = Math.round(fin - vacKg);
      const eurotanks = bulkKg > 5 ? Math.ceil(bulkKg / 275) : (bulkKg > 0 ? 1 : 0); // ~250–300 кг на куб
      const cardboardSheets = eurotanks * 5; // 4–5 картонок между рядами на 1 еврокуб

      return `
        <div style="background:rgba(8,18,32,0.92); border:2px solid rgba(0,229,255,0.45); border-radius:18px; padding:16px; box-shadow:0 8px 30px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px; border-bottom:1px solid rgba(43,70,107,0.7); padding-bottom:10px;">
            <div>
              <div style="font-family:var(--font-display); font-size:15.5px; font-weight:800; color:var(--cyan-dew); display:flex; align-items:center; gap:8px;">
                <span>📦</span>
                <span>ЛОГИСТИКА РАЗДЕЛЬНОЙ ВЫГРУЗКИ ПАРТИИ (ВАКУУМ vs ЕВРОКУБЫ)</span>
              </div>
              <div style="font-size:12px; color:#9FB3C8; margin-top:3px;">
                Готовая партия: <b>${fin} кг</b> • Доля вакуума KOMET: <b>${vx.mixVac}%</b> • Доля еврокубов: <b>${100 - vx.mixVac}%</b>
              </div>
            </div>
            <button class="pill-btn pill-emerald" onclick="openWhatsAppReportModal()" style="font-size:12px;" title="Сформировать рапорт технолога по этой выгрузке">
              📲 Рапорт в WhatsApp
            </button>
          </div>

          <!-- 2 Колонки: Элита KOMET vs Еврокубы -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-bottom:14px;">
            <!-- Колонка А: Элита на вакуум KOMET PlusVac 25 -->
            <div style="background:#040D1A; border:1.5px solid #00E5FF; border-radius:14px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:800; color:#00E5FF; font-size:13.5px;">🟦 Элита в вакуум (KOMET PlusVac 25)</span>
                  <span class="pill-btn pill-cyan" style="font-size:10.5px; padding:2px 6px;">Soft Vac 95–96%</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                  <div style="background:rgba(0,229,255,0.08); border-radius:8px; padding:8px 10px;">
                    <div style="font-size:11px; color:#94A3B8;">Вес рыбы:</div>
                    <div style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#FFFFFF;">${vacKg} кг</div>
                    <div style="font-size:10px; color:#00E5FF;">${vx.mixVac}% от партии</div>
                  </div>
                  <div style="background:rgba(0,229,255,0.08); border-radius:8px; padding:8px 10px;">
                    <div style="font-size:11px; color:#94A3B8;">Пакетов (~850 г):</div>
                    <div style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#00E5FF;">${vacPacks} шт</div>
                    <div style="font-size:10px; color:#94A3B8;">по 3 тушки в пакет</div>
                  </div>
                </div>
              </div>
              <div style="border-top:1px dashed rgba(0,229,255,0.3); padding-top:8px;">
                <div style="font-size:12px; color:#E2E8F0;">
                  ⏱️ Время работы вакууматора: <b style="color:#00E5FF;">${kometTimeStr}</b>
                </div>
                <div style="font-size:11px; color:#94A3B8; margin-top:3px;">
                  Двойной шов • Подрезка плавников 2–3 мм • Укладка в синий евроконтейнер
                </div>
              </div>
            </div>

            <!-- Колонка Б: Еврокубы -->
            <div style="background:#040D1A; border:1.5px solid #FFA726; border-radius:14px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:800; color:#FFD166; font-size:13.5px;">📦 Остальной объем в Еврокубы</span>
                  <span class="pill-btn pill-amber" style="font-size:10.5px; padding:2px 6px;">~250–300 кг/куб</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                  <div style="background:rgba(255,167,38,0.08); border-radius:8px; padding:8px 10px;">
                    <div style="font-size:11px; color:#94A3B8;">Вес в кубах:</div>
                    <div style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#FFFFFF;">${bulkKg} кг</div>
                    <div style="font-size:10px; color:#FFA726;">${100 - vx.mixVac}% от партии</div>
                  </div>
                  <div style="background:rgba(255,167,38,0.08); border-radius:8px; padding:8px 10px;">
                    <div style="font-size:11px; color:#94A3B8;">Еврокубов:</div>
                    <div style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#FFD166;">${eurotanks} шт</div>
                    <div style="font-size:10px; color:#94A3B8;">по ~250–300 кг</div>
                  </div>
                </div>
              </div>
              <div style="border-top:1px dashed rgba(255,167,38,0.3); padding-top:8px;">
                <div style="font-size:12px; color:#E2E8F0;">
                  📄 Межслойных прокладок картона: <b style="color:#FFD166;">${cardboardSheets} шт</b>
                </div>
                <div style="font-size:11px; color:#94A3B8; margin-top:3px;">
                  По 4–5 картонок между рядами на куб для защиты от сминания и впитывания жира
                </div>
              </div>
            </div>
          </div>

          <!-- Быстрый пресет коридора холодного отволаживания -->
          <div style="background:rgba(0,229,255,0.06); border:1.5px solid rgba(0,229,255,0.35); border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="flex:1; min-width:240px;">
              <div style="font-weight:800; color:var(--cyan-dew); font-size:13px; display:flex; align-items:center; gap:6px;">
                <span>❄️</span>
                <span>ПРЕСЕТ КОРИДОРА ХОЛОДНОГО ОТВОЛАЖИВАНИЯ</span>
              </div>
              <div style="font-size:11.5px; color:#CBD5E1; margin-top:2px;">
                <b>+8..+10°C (Сутки: 4ч отдых / 1ч забор влаги)</b> — стабилизация влаги, устранение закала перед выгрузкой
              </div>
            </div>
            <button class="pill-btn pill-cyan" style="font-weight:800; font-size:12.5px; padding:8px 14px;" onclick="applyColdSofteningPreset()">
              ❄️ Применить +8..+10°C (4ч отдых / 1ч сушка)
            </button>
          </div>
        </div>
      `;
    }

    // ---------- БЫСТРЫЙ ПРЕСЕТ ХОЛОДНОГО ОТВОЛАЖИВАНИЯ (+8..+10°C) ----------
    function applyColdSofteningPreset() {
      triggerHaptic(25);
      state.telemetry.environmentTempC = 9.0;
      state.telemetry.curingAirDryBulbTempC = 9.0;
      state.telemetry.curingAirWetBulbTempC = 7.6;
      state.telemetry.dehumicoilTempC = 4.8;
      state.telemetry.parksideRhPercent = 68.0;
      state.telemetry.parksideTempC = 9.0;
      state.telemetry.isPausePhaseNow = true;
      state.telemetry.cantoniCirculationFanHz = 18.0;
      state.telemetry.activeCircuitsRunning = 1;
      state.telemetry.eev1Steps = 230;

      showToast("❄️ Режим применен: Холодное отволаживание +8..+10°C (4ч отдых / 1ч сушка)");

      if (typeof speakWithAiVoice === "function") {
        speakWithAiVoice("Применен режим холодного отволаживания. Температура плюс девять градусов. Четыре часа паузы отдыха, один час забора влаги.");
      }

      renderAll();
    }

    // ==================== 📲 РАПОРТ В WHATSAPP И ПЕЧАТЬ ЯРЛЫКА ====================
    function generateWhatsAppReportText() {
      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey];
      const st = CURING_STAGES[t.stageKey] || CURING_STAGES.STAGE_2;
      const diag = analyzeBioscience(t);
      const b = vxComputeBatch();
      const p = vxComputeProfit(b);

      const now = new Date();
      const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      const m = (Number(vx.mixVac) || 0) / 100;
      const fin = Math.round(b.finished);
      const vacKg = Math.round(fin * m);
      const vacPacks = Math.round(vacKg / 0.85);
      // KOMET PlusVac 25 запаивает 2 пакета по 850 г за цикл (42 сек / 0.7 мин)
      const kometCycles = Math.ceil(vacPacks / 2);
      const kometMin = Math.round(kometCycles * (42 / 60));
      const kometTimeStr = kometMin >= 60 ? `${Math.floor(kometMin / 60)} ч ${kometMin % 60} мин` : `${kometMin} мин`;

      const bulkKg = Math.round(fin - vacKg);
      const eurotanks = bulkKg > 5 ? Math.ceil(bulkKg / 275) : (bulkKg > 0 ? 1 : 0);
      const cardboardSheets = eurotanks * 5;

      const speciesTitle = b.isMix ? `🔀 Сборная камера (Микс рыб: 15 тележек SS304)` : `${sp.titleRu} (${sp.subtitleRu})`;

      return [
        `📋 *РАПОРТ ТЕХНОЛОГА ЗА СМЕНУ • ЮРМАЛЦИЕМС*`,
        `📅 Дата/время: ${dateStr} ${timeStr}`,
        `🏛️ Камера: AIM AGHD-250ELC (15 тележек SS304 • Cantoni 4×3кВт)`,
        `🐟 *Вид рыбы:* ${speciesTitle}`,
        `⚖️ *Партия и влагосъем:* `,
        `   • Загружено сырья: ${Math.round(b.raw)} кг`,
        `   • Выход готовой продукции: ${fin} кг (${b.y.toFixed(1)}% • ${b.texture})`,
        `   • Слито конденсата: ${Math.round(b.water)} л`,
        ``,
        `📦 *ЛОГИСТИКА РАЗДЕЛЬНОЙ ВЫГРУЗКИ:*`,
        `   🟦 *Элита в вакуум KOMET PlusVac 25 (Soft Vac 95–96%):*`,
        `      - Вес: ${vacKg} кг (${vx.mixVac}% партии)`,
        `      - Пакетов (~850 г / 3 шт): ${vacPacks} пак.`,
        `      - Время работы KOMET PlusVac 25: ~${kometTimeStr} (${kometCycles} циклов по 2 пак.)`,
        `   📦 *Остальной объем в Еврокубы:*`,
        `      - Вес в кубах: ${bulkKg} кг (${100 - vx.mixVac}% партии)`,
        `      - Количество Еврокубов (~250–300 кг): ${eurotanks} шт.`,
        `      - Прокладок из гофрокартона: ${cardboardSheets} шт. (4–5 между рядами)`,
        ``,
        `🌡️ *ПАРАМЕТРЫ КАМЕРЫ НА МОМЕНТ ВЫГРУЗКИ:*`,
        `   • Температура камеры: +${t.environmentTempC.toFixed(1)}°C (Испаритель: +${t.dehumicoilTempC.toFixed(1)}°C)`,
        `   • Влажность rH Parkside: ${Math.round(t.parksideRhPercent)}%`,
        `   • Точка росы / VPD: ${diag.dewPointC}°C / ${diag.vpdKpa} кПа`,
        `   • Фаза: ${t.isPausePhaseNow ? '⏸ Пауза отдыха' : '⚡ Активная сушка'} (Cantoni: ${t.isPausePhaseNow ? st.pauseFreqLabel : `${st.activeFreqHz} Гц`})`,
        ``,
        `⚠️ *ОБЯЗАТЕЛЬНЫЙ РЕГЛАМЕНТ ХОЛОДОВОЙ ЦЕПИ:*`,
        `«Рыба стабилизирована и охлаждена перед укладкой. Дальнейшее хранение еврокубов строго при 0..+4°C без претензий к технологу при нарушении холодовой цепи».`,
        ``,
        `👨‍🔬 Смена сдана: Технолог цеха вяления Юрмалциемс`
      ].join("\n");
    }

    function openWhatsAppReportModal() {
      triggerHaptic(15);
      const text = generateWhatsAppReportText();
      const textarea = document.getElementById("whatsapp-report-textarea");
      if (textarea) textarea.value = text;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        }
      } catch (e) {}

      const modal = document.getElementById("whatsapp-report-modal");
      if (modal) modal.classList.add("open");
      showToast("📋 Текст рапорта скопирован в буфер обмена!");
    }

    function closeWhatsAppReportModal() {
      const modal = document.getElementById("whatsapp-report-modal");
      if (modal) modal.classList.remove("open");
    }

    function copyWhatsAppReportText() {
      triggerHaptic(12);
      const textarea = document.getElementById("whatsapp-report-textarea");
      const text = textarea ? textarea.value : generateWhatsAppReportText();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast("📋 Текст рапорта скопирован в буфер обмена!");
          });
          return;
        }
      } catch (e) {}
      if (textarea) {
        textarea.select();
        document.execCommand("copy");
        showToast("📋 Текст рапорта скопирован!");
      }
    }

    function openWhatsAppDirect() {
      triggerHaptic(15);
      const textarea = document.getElementById("whatsapp-report-textarea");
      const text = textarea ? textarea.value : generateWhatsAppReportText();
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }

    // ---------- 🖨️ ПЕЧАТЬ ЯРЛЫКА НА ЕВРОКУБ / ПАСПОРТА ПАРТИИ ----------
    function printEurotankPassport() {
      triggerHaptic(20);
      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey];
      const b = vxComputeBatch();
      const fin = Math.round(b.finished);
      const m = (Number(vx.mixVac) || 0) / 100;
      const vacKg = Math.round(fin * m);
      const vacPacks = Math.round(vacKg / 0.85);
      const bulkKg = Math.round(fin - vacKg);
      const eurotanks = bulkKg > 5 ? Math.ceil(bulkKg / 275) : 1;
      const cardboardSheets = eurotanks * 5;
      const now = new Date();
      const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const lotNumber = `LOT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${t.speciesKey.toUpperCase()}-01`;
      const speciesTitle = b.isMix ? `Сборная партия вяленой рыбы (Микс в 15 тележках SS304)` : `Вяленая рыба: ${sp.titleRu} (${sp.subtitleRu})`;

      const printHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Ярлык на Еврокуб • Паспорт партии ${lotNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #000; background: #fff; margin: 0; padding: 12px; line-height: 1.4; }
    .passport-box { border: 3px double #000; padding: 18px; border-radius: 4px; max-width: 760px; margin: 0 auto; }
    .header-table { width: 100%; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 19pt; font-weight: 900; text-align: center; text-transform: uppercase; margin: 6px 0; letter-spacing: 0.5px; }
    .subtitle { font-size: 10.5pt; text-align: center; font-weight: bold; margin-bottom: 8px; color: #222; }
    .lot-badge { font-family: "Courier New", monospace; font-size: 13pt; font-weight: bold; background: #eee; padding: 4px 10px; border: 1px solid #000; display: inline-block; }
    .spec-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10.5pt; }
    .spec-table th, .spec-table td { border: 1px solid #000; padding: 7px 10px; text-align: left; }
    .spec-table th { background: #f2f2f2; font-weight: bold; width: 44%; }
    .alert-box { border: 2px solid #c00; background: #fff5f5; padding: 10px 14px; margin: 12px 0; border-radius: 4px; }
    .alert-title { color: #c00; font-weight: 900; font-size: 11pt; text-transform: uppercase; margin-bottom: 4px; }
    .alert-text { font-size: 10pt; font-weight: bold; line-height: 1.35; }
    .sign-table { width: 100%; margin-top: 20px; font-size: 10.5pt; }
    .sign-table td { padding: 6px 4px; }
    .barcode { font-family: "Courier New", monospace; letter-spacing: 5px; font-size: 15pt; font-weight: bold; text-align: center; margin-top: 10px; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center; margin-bottom:15px; padding:10px; background:#e0f2fe; border:1px solid #0284c7; border-radius:6px;">
    <button onclick="window.print()" style="font-size:13pt; font-weight:bold; padding:8px 22px; cursor:pointer; background:#0284c7; color:#fff; border:none; border-radius:6px;">🖨 ПЕЧАТЬ ЯРЛЫКА НА ПРИНТЕР</button>
    <button onclick="window.close()" style="font-size:13pt; padding:8px 18px; margin-left:12px; cursor:pointer;">Закрыть</button>
  </div>

  <div class="passport-box">
    <table class="header-table">
      <tr>
        <td style="width:70%;">
          <div style="font-size:10pt; font-weight:bold; text-transform:uppercase;">РЫБОПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ ЮРМАЛЦИЕМС (ЛАТВИЯ)</div>
          <div style="font-size:9pt; color:#444;">Сушильно-вялочный комплекс AIM AGHD-250ELC (15 тележек SS304 • Cantoni 4×3кВт)</div>
        </td>
        <td style="text-align:right;">
          <div class="lot-badge">${lotNumber}</div>
        </td>
      </tr>
    </table>

    <div class="title">ЯРЛЫК НА ЕВРОКУБ / ПАСПОРТ ПАРТИИ</div>
    <div class="subtitle">УДОСТОВЕРЕНИЕ КАЧЕСТВА И БЕЗОПАСНОСТИ ВЯЛЕНОЙ РЫБНОЙ ПРОДУКЦИИ</div>

    <table class="spec-table">
      <tr>
        <th>Наименование продукции:</th>
        <td><b>${speciesTitle}</b></td>
      </tr>
      <tr>
        <th>Дата и время фасовки:</th>
        <td><b>${dateStr} в ${timeStr}</b></td>
      </tr>
      <tr>
        <th>Параметры партии (сырье ➔ готовая):</th>
        <td>Сырье: <b>${Math.round(b.raw)} кг</b> ➔ Выход готовой: <b>${fin} кг (${b.y.toFixed(1)}%)</b></td>
      </tr>
      <tr>
        <th>Тарное место:</th>
        <td><b>Изотермический Еврокуб пластиковый (~250–300 кг)</b></td>
      </tr>
      <tr>
        <th>Фактический вес нетто в Еврокубе:</th>
        <td><b style="font-size:13pt;">${bulkKg} кг</b> (из общего объема партии ${fin} кг)</td>
      </tr>
      <tr>
        <th>Межслойные прокладки гофрокартона:</th>
        <td><b>${cardboardSheets} шт.</b> (4–5 листов между рядами для защиты от сминания и впитывания жира)</td>
      </tr>
      <tr>
        <th>Выделено на вакуум KOMET PlusVac 25:</th>
        <td>${vacKg} кг (${vacPacks} пакетов по ~850 г / 3 тушки, Soft Vac 95–96%)</td>
      </tr>
      <tr>
        <th>Остаточная влажность хребта:</th>
        <td>42–46% (по Игольчатый влагомер мяса, поры чешуи открыты, без закала)</td>
      </tr>
    </table>

    <div class="alert-box">
      <div class="alert-title">⚠️ ТРЕБОВАНИЕ ХОЛОДОВОЙ ЦЕПИ И УСЛОВИЯ ХРАНЕНИЯ:</div>
      <div class="alert-text">
        • ТЕМПЕРАТУРА ХРАНЕНИЯ: <b>СТРОГО 0..+4°C</b> в сухом темном складском помещении.<br/>
        • <b>«Рыба стабилизирована и охлаждена перед укладкой. Дальнейшее хранение еврокубов строго при 0..+4°C без претензий к технологу при нарушении холодовой цепи».</b><br/>
        • Срок годности в еврокубах с картонными прокладками: 60 суток при 0..+4°C.
      </div>
    </div>

    <table class="sign-table">
      <tr>
        <td style="width:50%;">
          Ответственный технолог смены:<br/><br/>
          ____________________ / <b>Юрмалциемс</b>
        </td>
        <td style="width:50%; text-align:right;">
          М.П. / Штамп ОТК Цеха:<br/><br/>
          [ КОНТРОЛЬ КАЧЕСТВА ПРОЙДЕН ]
        </td>
      </tr>
    </table>

    <div class="barcode">||| | ||||| |||| ||||| || |||||||| |||</div>
    <div style="text-align:center; font-size:8pt; color:#666; margin-top:2px;">${lotNumber} • AIM-AGHD-250ELC • JURMALCIEMS</div>
  </div>

  <' + 'script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  <' + '/script>

</body>
</html>`;

      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
      } else {
        showToast("⚠️ Разрешите всплывающие окна для печати ярлыка!");
      }
    }

    // ==================== 🔆 WEB WAKELOCK API (ONEPLUS 13 PRO AMOLED) ====================
    let screenWakeLock = null;
    let screenWakeLockDesired = true;

    async function initScreenWakeLock() {
      if (!('wakeLock' in navigator)) {
        console.log("Web WakeLock API is not supported in this browser environment");
        updateWakeLockUI(false, "Не подд.");
        return;
      }
      try {
        screenWakeLock = await navigator.wakeLock.request('screen');
        screenWakeLock.addEventListener('release', () => {
          console.log("Screen Wake Lock released");
          updateWakeLockUI(false, "Выкл");
        });
        console.log("Screen Wake Lock active: экран OnePlus 13 Pro не гаснет");
        updateWakeLockUI(true, "Не гаснет");
      } catch (err) {
        console.warn(`WakeLock request failed: ${err.name}, ${err.message}`);
        updateWakeLockUI(false, "Выкл");
      }
    }

    function toggleScreenWakeLock() {
      triggerHaptic(15);
      if (screenWakeLock !== null) {
        screenWakeLock.release().then(() => {
          screenWakeLock = null;
          screenWakeLockDesired = false;
          showToast("🔆 Удержание экрана выключено");
          updateWakeLockUI(false, "Выкл");
        });
      } else {
        screenWakeLockDesired = true;
        initScreenWakeLock().then(() => {
          showToast("🔆 Экран заблокирован от засыпания (WakeLock активен)");
        });
      }
    }

    function updateWakeLockUI(active, label) {
      const badge = document.getElementById("wakelock-status-badge");
      if (badge) {
        badge.className = active ? "pill-btn pill-emerald" : "pill-btn pill-cyan";
        badge.textContent = `🔆 Экран: ${label}`;
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", async () => {
        if (screenWakeLock !== null && document.visibilityState === "visible" && screenWakeLockDesired) {
          await initScreenWakeLock();
        }
      });

      document.addEventListener("click", () => {
        if (!screenWakeLock && screenWakeLockDesired) {
          initScreenWakeLock();
        }
      }, { once: true });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        initScreenWakeLock();
      });
    }


    // =========================================================================
    // 5 НОВЫХ МАТЕМАТИЧЕСКИХ МОДУЛЕЙ ТЕХНОЛОГА ЮРМАЛЦИЕМСА (ЗАДАЧИ 1–5)
    // =========================================================================

    // ---------- ЗАДАЧА 1: 🧂 Калькулятор тузлука и времени просола (Вкладка "Партия") ----------

    function renderSaltingCalculator() {
      const box = document.getElementById("salting-calculator-box");
      if (!box) return;

      const t = state.telemetry;
      const be = Number(t.saltingBaume !== undefined ? t.saltingBaume : 20.0);
      // Плотность = 145 / (145 - °Bé)
      const density = Number((145 / Math.max(1, 145 - be)).toFixed(3));
      // % соли ≈ Плотность * 0.26 (в процентах: * 100)
      const saltPercent = Number((density * 0.26 * 100).toFixed(1));
      const fishWeight = Number(t.saltingFishWeightG !== undefined ? t.saltingFishWeightG : 350);
      const brineTemp = Number(t.saltingBrineTempC !== undefined ? t.saltingBrineTempC : 3.0);

      // Видовой коэффициент
      let fishCoeff = 3.0;
      if (t.speciesKey === "VIMBA" || t.speciesKey === "BREAM") fishCoeff = 3.3;
      else if (t.speciesKey === "PERCH" || t.speciesKey === "ROACH") fishCoeff = 2.7;
      else if (t.speciesKey === "SMELT" || t.speciesKey === "VENDACE") fishCoeff = 2.0;

      // Базовое время: (масса рыбы в г / 100) * коэффициент
      const baseTime = (fishWeight / 100) * fishCoeff;

      // Поправка на температуру: при +2..+4°C коэффициент 1.0
      let tempFactor = 1.0;
      let tempAlert = "";
      let tempBadgeClass = "pill-emerald";
      let tempBadgeText = "Норма +2..+4°C (Безопасный посол)";

      if (brineTemp > 4.0) {
        tempFactor = Math.max(0.65, 1.0 - (brineTemp - 4.0) * 0.05);
        tempBadgeClass = "pill-coral";
        tempBadgeText = `⚠️ T=${brineTemp.toFixed(1)}°C: Риск закисания! Охладите рассол льдом`;
        tempAlert = `<div style="margin-top:8px; font-size:12px; color:#FF5252; line-height:1.4;">
          ⚠️ <b>ВНИМАНИЕ ТЕХНОЛОГА:</b> Температура рассола выше +4°C! При диффузии соли во внутренности крупной рыбы есть риск порчи и подкисания брюшка. Охладите тузлук добавлением чешуйчатого льда до +2..+4°C.
        </div>`;
      } else if (brineTemp < 2.0) {
        tempFactor = 1.0 + (2.0 - brineTemp) * 0.08;
        tempBadgeClass = "pill-cyan";
        tempBadgeText = `❄️ T=${brineTemp.toFixed(1)}°C: Переохлаждение (диффузия замедлена)`;
        tempAlert = `<div style="margin-top:8px; font-size:12px; color:#38BDF8; line-height:1.4;">
          ❄️ Температура рассола ниже +2°C: кристаллы соли растворяются медленнее, просол тушки затягивается.
        </div>`;
      }

      const saltingHours = (baseTime * tempFactor).toFixed(1);

      // Расчет соли и воды для 24% тузлука
      // На объем загрузки сырья (рыба : тузлук = 1 : 0.7)
      const batchRawKg = Number(t.batchWeightKg) || 1850;
      const brineVolL = Math.round(batchRawKg * 0.7);
      // Масса соли для 24% тузлука: ~0.283 кг на 1 л рассола
      const saltNeededKg = Math.round(brineVolL * 0.283);
      const saltBags25 = Math.ceil(saltNeededKg / 25);
      const waterNeededL = Math.round(brineVolL * 0.897);

      box.innerHTML = `
        <div style="border-bottom:1.5px solid rgba(43,70,107,0.7); padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--font-display); font-size:16.5px; font-weight:800; color:var(--amber-curing); display:flex; align-items:center; gap:8px;">
              <span>🧂</span>
              <span>КАЛЬКУЛЯТОР ТУЗЛУКА И ВРЕМЕНИ ПРОСОЛА</span>
            </div>
            <div style="font-size:12px; color:#9FB3C8; margin-top:2px;">
              Перевод ареометра Baumé °Bé в плотность и % соли • Точное время просола по массе тушки и температуре рассола
            </div>
          </div>
          <span class="pill-btn ${tempBadgeClass}" style="cursor:default; font-size:11.5px;">${tempBadgeText}</span>
        </div>

        <!-- 3 Ползунка ввода -->
        <div class="vx-grid-3" style="gap:14px; margin-bottom:16px;">
          <!-- Ввод 1: Ареометр Baumé -->
          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(0,229,255,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">🧪 Ареометр: ${be.toFixed(1)} °Bé</span>
              <span class="vx-slider-val" style="color:var(--cyan-dew); font-size:16px;">${density} г/см³</span>
            </div>
            <input type="range" class="vx-range" min="10" max="26" step="0.5" value="${be}" oninput="onSaltingBaumeInput(this.value)"/>
            <div class="vx-slider-scale"><span>10 °Bé (1.07)</span><span>20 °Bé (Норма 24%)</span><span>26 °Bé (1.22)</span></div>
          </div>

          <!-- Ввод 2: Масса 1 рыбы -->
          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(255,167,38,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">🐟 Средняя масса 1 рыбы</span>
              <span class="vx-slider-val" style="color:var(--amber-curing); font-size:16px;">${fishWeight} г</span>
            </div>
            <input type="range" class="vx-range" min="100" max="2000" step="25" value="${fishWeight}" oninput="onSaltingFishWeightInput(this.value)"/>
            <div class="vx-slider-scale"><span>100 г (мелочь)</span><span>${fishWeight} г</span><span>2000 г (крупный лещ)</span></div>
          </div>

          <!-- Ввод 3: Температура рассола -->
          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(46,229,157,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">🌡️ Температура рассола</span>
              <span class="vx-slider-val" style="color:${brineTemp > 4 ? '#FF5252' : '#2EE59D'}; font-size:16px;">+${brineTemp.toFixed(1)}°C</span>
            </div>
            <input type="range" class="vx-range" min="0" max="10" step="0.5" value="${brineTemp}" oninput="onSaltingTempInput(this.value)"/>
            <div class="vx-slider-scale"><span>0°C (лед)</span><span style="color:#2EE59D; font-weight:700;">+2..+4°C Оптимум</span><span>+10°C (Опасно)</span></div>
          </div>
        </div>

        <!-- Результаты: 4 Плитки -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          <div style="background:rgba(255,167,38,0.1); border:1.5px solid #FFA726; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">⏱️ Время посола</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#FFD166; margin:4px 0;">${saltingHours} ч</div>
            <div style="font-size:11px; color:#E2E8F0;">Коэф. вида: ${fishCoeff} • Т-поправка: ${tempFactor.toFixed(2)}</div>
          </div>

          <div style="background:rgba(0,229,255,0.08); border:1.5px solid #00E5FF; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">⚖️ Плотность и % соли</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#00E5FF; margin:4px 0;">${density} <span style="font-size:14px;">г/см³</span></div>
            <div style="font-size:11px; color:#CBD5E1;">Концентрация соли: <b>${saltPercent}%</b> (${be} °Bé)</div>
          </div>

          <div style="background:rgba(46,229,157,0.08); border:1.5px solid #2EE59D; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">🧂 Соли для 24% тузлука</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#2EE59D; margin:4px 0;">${saltNeededKg} кг</div>
            <div style="font-size:11px; color:#CBD5E1;"><b>${saltBags25} мешков</b> по 25 кг NaCl</div>
          </div>

          <div style="background:rgba(56,189,248,0.08); border:1.5px solid #38BDF8; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">💧 Вода для тузлука</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#38BDF8; margin:4px 0;">${waterNeededL} л</div>
            <div style="font-size:11px; color:#CBD5E1;">Всего тузлука: ${brineVolL} л (1:0.7 к рыбе)</div>
          </div>
        </div>

        ${tempAlert}
      `;
    }

    function onSaltingBaumeInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.saltingBaume = v;
      state.telemetry.saltingDensity = Number((145 / Math.max(1, 145 - v)).toFixed(3));
      persistStateToStorage();
      renderSaltingCalculator();
    }

    function onSaltingFishWeightInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.saltingFishWeightG = v;
      persistStateToStorage();
      renderSaltingCalculator();
    }

    function onSaltingTempInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.saltingBrineTempC = v;
      persistStateToStorage();
      renderSaltingCalculator();
    }

    // ---------- ЗАДАЧА 2: ⚡ Энергоаудит партии и экономия Термокороба [20] (Вкладка "Прибыль") ----------
    function renderEnergyAuditKpis(b, p) {
      const box = document.getElementById("energy-audit-box");
      if (!box) return;

      const t = state.telemetry;
      if (!b) b = vxComputeBatch();
      if (!p) p = vxComputeProfit(b);

      const fin = Math.max(1, b.finished);
      const costEnergy = p.costEnergy; // kWh * tariff
      const costEnergyPerKg = costEnergy / fin;
      const kwhPerKg = b.kWh / fin;

      const isWinter = t.heatRecoveryMode === "WINTER_14KW";
      const savingEur = isWinter ? 450 : 0;
      const savingNote = isWinter
        ? "Экономия на частотниках и нагреве: до 450 € за цикл"
        : "Летний прямой сброс тепла через эстакаду на улицу (без догрева)";

      box.innerHTML = `
        <div style="border-bottom:1.5px solid rgba(43,70,107,0.7); padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--font-display); font-size:16.5px; font-weight:800; color:#FFE082; display:flex; align-items:center; gap:8px;">
              <span>⚡</span>
              <span>ЭНЕРГОАУДИТ ПАРТИИ И РЕКУПЕРАЦИЯ ТЕРМОКОРОБА [20]</span>
            </div>
            <div style="font-size:12px; color:#9FB3C8; margin-top:2px;">
              Точный расчет стоимости электричества на 1 кг готовой продукции и экономии от рекуперации 14 кВт тепла
            </div>
          </div>
          <div class="btn-row">
            <button class="pill-btn ${isWinter ? 'pill-emerald' : ''}" onclick="setHeatRecoveryMode('WINTER_14KW')" title="Включить зимнюю рекуперацию 14 кВт">
              🟢 Зима: Рекуперация (+450 €)
            </button>
            <button class="pill-btn ${!isWinter ? 'pill-amber' : ''}" onclick="setHeatRecoveryMode('SUMMER_OUTDOOR')" title="Включить летний сброс тепла">
              ☀️ Лето: Сброс на улицу
            </button>
          </div>
        </div>

        <!-- 4 Плитки энергоаудита -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          <div style="background:rgba(255,224,130,0.08); border:1.5px solid #FFE082; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">⚡ Электричество / 1 кг готовой</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#FFE082; margin:4px 0;">
              ${costEnergyPerKg.toFixed(2)} <span style="font-size:15px;">€/кг</span>
            </div>
            <div style="font-size:11.5px; color:#CBD5E1;">Тариф: ${vxFmt(vx.tariff, 2)} €/кВт·ч • Всего: ${vxEur(costEnergy)}</div>
          </div>

          <div style="background:rgba(0,229,255,0.08); border:1.5px solid #00E5FF; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">🔋 Удельный расход энергии</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#00E5FF; margin:4px 0;">
              ${kwhPerKg.toFixed(2)} <span style="font-size:15px;">кВт·ч/кг</span>
            </div>
            <div style="font-size:11.5px; color:#CBD5E1;">Всего за цикл: <b>${Math.round(b.kWh)} кВт·ч</b> (${b.dryDays.toFixed(1)} сут)</div>
          </div>

          <div style="background:${isWinter ? 'rgba(46,229,157,0.1)' : 'rgba(15,23,42,0.6)'}; border:1.5px solid ${isWinter ? '#2EE59D' : 'rgba(43,70,107,0.7)'}; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">♨️ Экономия Термокороба [20]</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:${isWinter ? '#2EE59D' : '#94A3B8'}; margin:4px 0;">
              ${isWinter ? '+450 €' : '0 €'}
            </div>
            <div style="font-size:11.5px; color:${isWinter ? '#A7F3D0' : '#64748B'};">${savingNote}</div>
          </div>

          <div style="background:rgba(167,139,250,0.08); border:1.5px solid #A78BFA; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">📊 Доля энергии в затратах</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#A78BFA; margin:4px 0;">
              ${p.best && p.best.cost > 0 ? Math.round((costEnergy / p.best.cost) * 100) : 0}%
            </div>
            <div style="font-size:11.5px; color:#CBD5E1;">Сырье: ${p.best && p.best.cost > 0 ? Math.round((p.costRaw / p.best.cost) * 100) : 0}% • Упаковка: ${p.best && p.best.cost > 0 ? Math.round((p.best.pack / p.best.cost) * 100) : 0}%</div>
          </div>
        </div>
      `;
    }

    // ---------- ЗАДАЧА 3: 🌪️ Аэродинамика и скорость потока Cantoni (Вкладка "Пульт") ----------
    function renderAerodynamicsCalculator() {
      const box = document.getElementById("aerodynamics-calculator-box");
      if (!box) return;

      const t = state.telemetry;
      const hz = Number(t.cantoniFrequencyHz !== undefined ? t.cantoniFrequencyHz : (t.isPausePhaseNow ? 18.0 : 30.0));
      const area = Number(t.cantoniGapAreaM2 !== undefined ? t.cantoniGapAreaM2 : 1.85);
      const chamberVol = Number(t.chamberVolumeM3 !== undefined ? t.chamberVolumeM3 : 42.0);

      // Линейная скорость потока: 30 Гц ≈ 2.8 м/с при площади зазоров 1.85 м2
      const speedMs = Number(((hz / 30.0) * 2.8 * (1.85 / Math.max(0.5, area))).toFixed(2));

      // Определение цветовой зоны скорости
      let zoneColor = "#2EE59D";
      let zoneText = "ОПТИМУМ (1.5–2.5 м/с)";
      let zoneClass = "pill-emerald";
      let zoneDesc = "Ламинарный вынос влаги без разрушения пограничного слоя и без риска закала.";

      if (speedMs < 1.2) {
        zoneColor = "#FF5252";
        zoneText = "КРАСНАЯ ЗОНА: ЗАМЕДЛЕНИЕ ВЛАГОСЪЕМА (< 1.2 м/с)";
        zoneClass = "pill-coral";
        zoneDesc = "Скорость потока недостаточна! Влажный воздух застаивается у чешуи, возникает опасность закисания жабр и подпарки рыбы.";
      } else if (speedMs > 4.0) {
        zoneColor = "#FF5252";
        zoneText = "ОПАСНОСТЬ: РИСК ЗАКАЛА (> 4.0 м/с)";
        zoneClass = "pill-coral";
        zoneDesc = "Критический турбулентный обдув! Поверхностная корка чешуи запечатается (Case Hardening), влага внутри хребта окажется запертой.";
      } else if (speedMs > 2.8) {
        zoneColor = "#FFA726";
        zoneText = "ОРАНЖЕВАЯ ЗОНА: ПОВЫШЕННАЯ СКОРОСТЬ (> 2.8 м/с)";
        zoneClass = "pill-amber";
        zoneDesc = "Усиленный съем влаги. Разрешен только в первые 12 часов Стадии 1 при мокрой чешуе. Следите за пирометром!";
      } else if (speedMs < 1.5) {
        zoneColor = "#38BDF8";
        zoneText = "СИНЯЯ ЗОНА: РЕЖИМ ПАУЗЫ (1.2–1.5 м/с)";
        zoneClass = "pill-cyan";
        zoneDesc = "Мягкое перемешивание воздуха во время фазы отдыха (Cantoni 15–20 Гц).";
      }

      // Расчет полного оборота воздуха в камере:
      // Q = Скорость * Площадь сечения (м3/с)
      const qFlowM3s = speedMs * area;
      const turnoverSec = Number((chamberVol / Math.max(0.1, qFlowM3s)).toFixed(1));
      const turnoverPerHour = Math.round(3600 / Math.max(0.1, turnoverSec));
      const flowPerHourM3 = Math.round(qFlowM3s * 3600);

      const markerPct = Math.min(100, Math.max(0, (speedMs / 5.0) * 100));

      box.innerHTML = `
        <div style="border-bottom:1.5px solid rgba(43,70,107,0.7); padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--font-display); font-size:16.5px; font-weight:800; color:var(--cyan-dew); display:flex; align-items:center; gap:8px;">
              <span>🌪️</span>
              <span>АЭРОДИНАМИКА И СКОРОСТЬ ВОЗДУШНОГО ПОТОКА CANTONI</span>
            </div>
            <div style="font-size:12px; color:#9FB3C8; margin-top:2px;">
              Перевод частоты 4×3кВт Cantoni (Гц) и зазоров тележек (м²) в линейную скорость (м/с) и время полного оборота камеры
            </div>
          </div>
          <span class="pill-btn ${zoneClass}" style="cursor:default; font-size:11.5px;">${zoneText}</span>
        </div>

        <!-- 2 Ползунка ввода -->
        <div class="vx-grid-2" style="gap:14px; margin-bottom:16px;">
          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(0,229,255,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">⚡ Частота Cantoni:</span>
              <span class="vx-slider-val" style="color:var(--cyan-dew); font-size:17px;">${hz.toFixed(1)} Гц</span>
            </div>
            <input type="range" class="vx-range" min="10" max="50" step="1" value="${hz}" oninput="onAerodynamicsHzInput(this.value)"/>
            <div class="vx-slider-scale"><span>10 Гц (Пауза)</span><span>18 Гц (Отдых)</span><span>30 Гц (Сушка)</span><span>50 Гц (Макс)</span></div>
          </div>

          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(255,167,38,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">📐 Площадь сечения зазоров:</span>
              <span class="vx-slider-val" style="color:var(--amber-curing); font-size:17px;">${area.toFixed(2)} м²</span>
            </div>
            <input type="range" class="vx-range" min="0.8" max="3.5" step="0.05" value="${area}" oninput="onAerodynamicsAreaInput(this.value)"/>
            <div class="vx-slider-scale"><span>0.80 м² (плотно)</span><span>1.85 м² (Стандарт 15 тележек)</span><span>3.50 м² (пустая)</span></div>
          </div>
        </div>

        <!-- КРУПНАЯ ГРАДИЕНТНАЯ ШКАЛА СКОРОСТИ С МАРКЕРОМ -->
        <div style="background:#020710; border:1.5px solid var(--steel-border); border-radius:14px; padding:14px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:13px; font-weight:700; color:#FFFFFF;">ШКАЛА СКОРОСТИ ОБДУВА ТУШКИ:</span>
            <span style="font-family:var(--font-mono); font-size:22px; font-weight:800; color:${zoneColor};">${speedMs} м/с</span>
          </div>
          <div style="position:relative; height:24px; border-radius:12px; overflow:hidden; background:linear-gradient(90deg, #FF5252 0%, #FF5252 24%, #38BDF8 24%, #38BDF8 30%, #2EE59D 30%, #2EE59D 56%, #FFA726 56%, #FFA726 80%, #FF5252 80%, #FF5252 100%); border:1px solid rgba(255,255,255,0.2);">
            <div style="position:absolute; left:${markerPct}%; top:0; bottom:0; width:6px; background:#FFFFFF; box-shadow:0 0 12px #FFFFFF, 0 0 20px ${zoneColor}; transform:translateX(-50%); border-radius:3px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11px; color:#94A3B8; margin-top:5px;">
            <span>0.0 м/с (Застой)</span>
            <span style="color:#FF5252;">1.2 м/с</span>
            <span style="color:#2EE59D; font-weight:700;">1.5–2.5 м/с (Оптимум)</span>
            <span style="color:#FFA726;">2.8 м/с</span>
            <span style="color:#FF5252;">4.0+ м/с (Закал)</span>
            <span>5.0 м/с</span>
          </div>
          <div style="font-size:12px; color:#E2E8F0; margin-top:8px; line-height:1.4;">
            ${zoneDesc}
          </div>
        </div>

        <!-- 4 Плитки аэродинамики -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          <div style="background:rgba(0,229,255,0.08); border:1.5px solid #00E5FF; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">💨 Линейная скорость</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#00E5FF; margin:4px 0;">${speedMs} м/с</div>
            <div style="font-size:11px; color:#CBD5E1;">В межтележечных зазорах</div>
          </div>

          <div style="background:rgba(46,229,157,0.08); border:1.5px solid #2EE59D; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">⏱️ Время 1 оборота камеры</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#2EE59D; margin:4px 0;">${turnoverSec} сек</div>
            <div style="font-size:11px; color:#CBD5E1;">Объем камеры: ${chamberVol} м³</div>
          </div>

          <div style="background:rgba(255,167,38,0.08); border:1.5px solid #FFA726; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">🔄 Кратность циркуляции</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#FFD166; margin:4px 0;">${turnoverPerHour} об/ч</div>
            <div style="font-size:11px; color:#CBD5E1;">Смен объема в час</div>
          </div>

          <div style="background:rgba(167,139,250,0.08); border:1.5px solid #A78BFA; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">🌀 Объемный расход</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#A78BFA; margin:4px 0;">${flowPerHourM3} м³/ч</div>
            <div style="font-size:11px; color:#CBD5E1;">Производительность 4×Cantoni</div>
          </div>
        </div>
      `;
    }

    function onAerodynamicsHzInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.cantoniFrequencyHz = v;
      persistStateToStorage();
      renderAerodynamicsCalculator();
    }

    function onAerodynamicsAreaInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.cantoniGapAreaM2 = v;
      persistStateToStorage();
      renderAerodynamicsCalculator();
    }

    // ---------- ЗАДАЧА 4: 🔬 Микробиология, активность воды (aw) и срок годности (Вкладка "Советник") ----------
    function calculateAwAndShelfLife() {
      const t = state.telemetry;
      const moisture = Number(t.spineMoistureGmPercent !== undefined ? t.spineMoistureGmPercent : 48.5);
      const salt = Number(t.productSaltPercent !== undefined ? t.productSaltPercent : 4.8);
      const pkg = t.shelfLifePackageType || "VACUUM";

      // Соль в водной фазе (WPS - Water Phase Salt)
      const wps = (salt / Math.max(1, moisture + salt)) * 100;

      // Модель активности воды aw
      const aw = Number(Math.max(0.70, Math.min(0.99, 1.000 - 0.0052 * wps - 0.00019 * Math.pow(wps, 2))).toFixed(3));
      const isSafe = aw < 0.85;

      let shelfDays = 90;
      let pkgTitle = "KOMET Вакуум (Soft Vac 95–96%)";
      if (pkg === "EUROBOX") {
        shelfDays = 45;
        pkgTitle = "Изотермический Евроконтейнер (гофрокартон)";
      } else if (pkg === "MAP") {
        shelfDays = 150;
        pkgTitle = "MAP-газ (модифицированная среда 70% N2 + 30% CO2)";
      }

      const expireDate = new Date(Date.now() + shelfDays * 86400000);
      const expireStr = expireDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

      return { moisture, salt, wps, aw, isSafe, pkg, shelfDays, pkgTitle, expireStr };
    }

    function renderMicrobiologyCalculator() {
      const box = document.getElementById("microbiology-calculator-box");
      if (!box) return;

      const data = calculateAwAndShelfLife();

      box.innerHTML = `
        <div style="border-bottom:1.5px solid rgba(46,229,157,0.4); padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--font-display); font-size:16.5px; font-weight:800; color:var(--emerald-optimal); display:flex; align-items:center; gap:8px;">
              <span>🔬</span>
              <span>ПРОГНОЗ АКТИВНОСТИ ВОДЫ (aw) И СРОКА ГОДНОСТИ</span>
            </div>
            <div style="font-size:12px; color:#9FB3C8; margin-top:2px;">
              Расчет активности свободной воды aw по влажности хребта и соли • Барьерная микробиологическая безопасность
            </div>
          </div>
          <span class="pill-btn ${data.isSafe ? 'pill-emerald' : 'pill-amber'}" style="cursor:default; font-size:11.5px;">
            ${data.isSafe ? '🟢 aw < 0.85: ПОЛНАЯ МИКРОБИОЛОГИЧЕСКАЯ БЕЗОПАСНОСТЬ' : '⚠️ aw ≥ 0.85: ТРЕБУЕТСЯ ХОЛОД ≤ +4°C ИЛИ ДОСУШИВАНИЕ'}
          </span>
        </div>

        <!-- Ввод параметров: Влажность хребта + Соль + Формат упаковки -->
        <div class="vx-grid-2" style="gap:14px; margin-bottom:14px;">
          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(0,229,255,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">📌 Влажность хребта (Игольчатый влагомер):</span>
              <span class="vx-slider-val" style="color:var(--cyan-dew); font-size:17px;">${data.moisture.toFixed(1)}%</span>
            </div>
            <input type="range" class="vx-range" min="35" max="65" step="0.5" value="${data.moisture}" oninput="onMicrobioMoistureInput(this.value)"/>
            <div class="vx-slider-scale"><span>35% (Сухая)</span><span>42–46% Норма KOMET</span><span>65% (Сырая)</span></div>
          </div>

          <div class="vx-slider" style="background:#040D1A; border:1px solid rgba(255,167,38,0.4); border-radius:12px; padding:12px;">
            <div class="vx-slider-top">
              <span class="vx-label">🧂 Соль в мясе рыбы (% NaCl):</span>
              <span class="vx-slider-val" style="color:var(--amber-curing); font-size:17px;">${data.salt.toFixed(1)}%</span>
            </div>
            <input type="range" class="vx-range" min="2.5" max="8.0" step="0.1" value="${data.salt}" oninput="onMicrobioSaltInput(this.value)"/>
            <div class="vx-slider-scale"><span>2.5% (Малосол)</span><span>4.5–5.2% Стандарт Юрмалциемс</span><span>8.0% (Крепкий)</span></div>
          </div>
        </div>

        <!-- 3 Переключателя форматов упаковки -->
        <div style="background:#050F1D; border:1px solid var(--steel-border); border-radius:12px; padding:12px; margin-bottom:14px;">
          <div style="font-size:12.5px; font-weight:700; color:#FFFFFF; margin-bottom:8px;">
            📦 ВЫБЕРИТЕ ФОРМАТ УПАКОВКИ И ХРАНЕНИЯ (ТАЙМЕР ГОДНОСТИ):
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
            <button class="chip ${data.pkg === 'EUROBOX' ? 'active-amber' : ''}" style="padding:10px; text-align:center; font-weight:700; font-size:13px;" onclick="setShelfLifePackage('EUROBOX')">
              📦 Евроконтейнер (45 суток)
            </button>
            <button class="chip ${data.pkg === 'VACUUM' ? 'active-cyan' : ''}" style="padding:10px; text-align:center; font-weight:700; font-size:13px;" onclick="setShelfLifePackage('VACUUM')">
              🟦 KOMET Вакуум (90 суток)
            </button>
            <button class="chip ${data.pkg === 'MAP' ? 'active-emerald' : ''}" style="padding:10px; text-align:center; font-weight:700; font-size:13px;" onclick="setShelfLifePackage('MAP')">
              💨 MAP-газ N2+CO2 (150 суток)
            </button>
          </div>
        </div>

        <!-- Результаты микробиологии: 4 Плитки -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:10px;">
          <div style="background:${data.isSafe ? 'rgba(46,229,157,0.1)' : 'rgba(255,167,38,0.12)'}; border:2px solid ${data.isSafe ? '#2EE59D' : '#FFA726'}; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">💧 Активность воды (aw)</div>
            <div style="font-family:var(--font-mono); font-size:26px; font-weight:800; color:${data.isSafe ? '#2EE59D' : '#FFD166'}; margin:4px 0;">${data.aw}</div>
            <div style="font-size:11px; color:#E2E8F0;">WPS в водной фазе: <b>${data.wps.toFixed(1)}%</b></div>
          </div>

          <div style="background:rgba(0,229,255,0.08); border:1.5px solid #00E5FF; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">⏳ Срок хранения</div>
            <div style="font-family:var(--font-mono); font-size:26px; font-weight:800; color:#00E5FF; margin:4px 0;">${data.shelfDays} <span style="font-size:15px;">суток</span></div>
            <div style="font-size:11px; color:#CBD5E1;">${data.pkgTitle}</div>
          </div>

          <div style="background:rgba(167,139,250,0.08); border:1.5px solid #A78BFA; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">📅 Годен до</div>
            <div style="font-family:var(--font-mono); font-size:22px; font-weight:800; color:#E9D5FF; margin:4px 0;">${data.expireStr}</div>
            <div style="font-size:11px; color:#CBD5E1;">При температуре 0..+4°C</div>
          </div>

          <div style="background:rgba(15,23,42,0.6); border:1.5px solid var(--steel-border); border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">🛡️ Бактериальный барьер</div>
            <div style="font-size:13px; font-weight:700; color:${data.isSafe ? '#2EE59D' : '#FFA726'}; margin:4px 0;">
              ${data.isSafe ? 'Ботулотоксин подавлен' : 'Хранение строго ≤ +4°C!'}
            </div>
            <div style="font-size:11px; color:#94A3B8;">Cl. botulinum & Staph. aureus</div>
          </div>
        </div>
      `;
    }

    function onMicrobioMoistureInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.spineMoistureGmPercent = v;
      persistStateToStorage();
      renderMicrobiologyCalculator();
    }

    function onMicrobioSaltInput(val) {
      triggerHaptic(10, true);
      const v = parseFloat(val);
      if (isNaN(v)) return;
      state.telemetry.productSaltPercent = v;
      persistStateToStorage();
      renderMicrobiologyCalculator();
    }

    function setShelfLifePackage(pkg) {
      triggerHaptic(12);
      state.telemetry.shelfLifePackageType = pkg;
      persistStateToStorage();
      renderMicrobiologyCalculator();
    }

    // ---------- ЗАДАЧА 5: 📦 Калькулятор логистики тары и отгрузки (Вкладка "Прибыль") ----------
    function renderTareLogisticsCalculator(b, p) {
      const box = document.getElementById("tare-logistics-box");
      if (!box) return;

      if (!b) b = vxComputeBatch();
      if (!p) p = vxComputeProfit(b);

      const fin = Math.round(b.finished);
      // Количество пачек по 3 тушки (~850 г)
      const packsCount = Math.round(fin / 0.85);
      // Количество синих изотермических евроконтейнеров (вмещает ~24 пачки = 20.4 кг)
      const containersCount = Math.max(1, Math.ceil(packsCount / 24));
      // Количество листов гофрокартона (4-5 листов на 1 контейнер, берем 5)
      const cardboardSheets = containersCount * 5;
      // Общий объем в м3 (1 контейнер ≈ 0.05 м3)
      const totalVolumeM3 = (containersCount * 0.05).toFixed(2);
      // Вес брутто (контейнер ~2.4 кг, картон ~0.15 кг, пакеты ~0.02 кг)
      const grossWeightKg = Math.round(fin + containersCount * 2.4 + cardboardSheets * 0.15 + packsCount * 0.02);

      box.innerHTML = `
        <div style="border-bottom:1.5px solid rgba(43,70,107,0.7); padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--font-display); font-size:16.5px; font-weight:800; color:var(--cyan-dew); display:flex; align-items:center; gap:8px;">
              <span>📦</span>
              <span>КАЛЬКУЛЯТОР ЛОГИСТИКИ ТАРЫ И ОТГРУЗКИ</span>
            </div>
            <div style="font-size:12px; color:#9FB3C8; margin-top:2px;">
              Расчет упаковки партии готовой продукции <b>${fin} кг</b> (${b.texture}): пачки KOMET PlusVac 25, синие евроконтейнеры, гофрокартон, объем м³ и вес брутто
            </div>
          </div>
          <span class="pill-btn pill-cyan" style="cursor:default; font-size:11.5px;">Готовая рыба нетто: ${fin} кг</span>
        </div>

        <!-- 5 Плиток логистики тары -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          <div style="background:rgba(0,229,255,0.08); border:1.5px solid #00E5FF; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">🟦 Пачек по 3 тушки</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#00E5FF; margin:4px 0;">${packsCount} шт</div>
            <div style="font-size:11px; color:#CBD5E1;">Вес 1 пачки: ~850 г</div>
          </div>

          <div style="background:rgba(59,130,246,0.1); border:1.5px solid #3B82F6; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">📦 Синих евроконтейнеров</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#60A5FA; margin:4px 0;">${containersCount} шт</div>
            <div style="font-size:11px; color:#CBD5E1;">По ~24 пачки (20.4 кг)</div>
          </div>

          <div style="background:rgba(255,167,38,0.08); border:1.5px solid #FFA726; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">📄 Листов гофрокартона</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#FFD166; margin:4px 0;">${cardboardSheets} шт</div>
            <div style="font-size:11px; color:#CBD5E1;">4–5 листов на контейнер</div>
          </div>

          <div style="background:rgba(167,139,250,0.08); border:1.5px solid #A78BFA; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">📐 Общий объем</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#A78BFA; margin:4px 0;">${totalVolumeM3} м³</div>
            <div style="font-size:11px; color:#CBD5E1;">1 контейнер ≈ 0.05 м³</div>
          </div>

          <div style="background:rgba(46,229,157,0.08); border:1.5px solid #2EE59D; border-radius:12px; padding:12px;">
            <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">⚖️ Вес брутто отгрузки</div>
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#2EE59D; margin:4px 0;">${grossWeightKg} кг</div>
            <div style="font-size:11px; color:#CBD5E1;">Тара: +${grossWeightKg - fin} кг</div>
          </div>
        </div>
      `;
    }


    // ==================== 📱 ONEPLUS 13 PRO SIMULATOR LOGIC ====================
    function openPhoneSimulator() {
      const modal = document.getElementById("phone-simulator-modal");
      if (modal) {
        modal.style.display = "flex";
        const iframe = document.getElementById("phone-sim-iframe");
        if (iframe && (!iframe.src || iframe.src === "about:blank")) {
          iframe.src = "telefon.html";
        }
      }
    }
    function closePhoneSimulator() {
      const modal = document.getElementById("phone-simulator-modal");
      if (modal) modal.style.display = "none";
    }
    function reloadPhoneSimulator() {
      const iframe = document.getElementById("phone-sim-iframe");
      if (iframe) iframe.src = "telefon.html?t=" + Date.now();
    }
    function openPhoneFullscreen() {
      window.open("telefon.html", "_blank");
    }

    // Двусторонняя синхронизация через BroadcastChannel
    var phoneSimSyncChannel = (typeof window !== "undefined" && "BroadcastChannel" in window) ? new BroadcastChannel("JURMALCIEMS_SYNC_CHANNEL") : null;
    if (phoneSimSyncChannel) {
      phoneSimSyncChannel.onmessage = (event) => {
        if (!event || !event.data) return;
        if (event.data.type === "SYNC_TELEMETRY" && event.data.telemetry) {
          state.telemetry = { ...state.telemetry, ...event.data.telemetry };
          renderAll();
        }
        if (event.data.type === "SYNC_VOICE_COMMAND") {
          const spKey = normalizeSpeciesKey(event.data.speciesKey);
          const weightKg = event.data.weightKg;
          if (spKey || weightKg) {
            syncActiveBatch("remote", spKey, weightKg);
          }
          if (typeof showToast === "function") {
            showToast(`🎙️ Голос со смартфона: «${event.data.commandText || ''}»`);
          }
        }
        if (event.data.type === "SYNC_BATCH") {
          const spKey = event.data.speciesKey;
          const weightKg = event.data.weightKg;
          if (spKey || weightKg) {
            syncActiveBatch("remote", spKey, weightKg);
          }
        }
        if (event.data.type === "SYNC_WAREHOUSE" && event.data.warehouse) {
          tubaWarehouse = event.data.warehouse;
          persistTradeHouseState();
          renderAll();
        }

        // 🧠 Приём памяти цеха от мобильной версии через BroadcastChannel
        if (event.data.type === "SYNC_MEMORY_LEDGER" && event.data.memoryLedger) {
          try {
            if (typeof applyIncomingMemoryLedger === "function") {
              applyIncomingMemoryLedger(event.data.memoryLedger);
            }
            if (typeof updateMemoryBadges === "function") updateMemoryBadges();
            if (typeof renderWorkshopMemoryModal === "function") renderWorkshopMemoryModal();
            if (typeof showToast === "function") showToast("🧠 Память цеха синхронизирована с телефоном");
          } catch (err) {
            console.warn("SYNC_MEMORY_LEDGER apply error:", err);
          }
        }

        // 📦 Приём мастер-слепка от мобильной версии (telefon.html) через BroadcastChannel
        if (event.data.type === "SYNC_SNAPSHOT" && event.data.snapshot) {
          try {
            const snap = event.data.snapshot;

            // 1. Телеметрия (с сохранением текущих heatRecoveryMode и phaseStartTimestampMs)
            if (snap.telemetry) {
              state.telemetry = {
                ...state.telemetry,
                ...snap.telemetry,
                speciesKey: FISH_SPECIES[snap.telemetry.speciesKey] ? snap.telemetry.speciesKey : state.telemetry.speciesKey,
                stageKey: CURING_STAGES[snap.telemetry.stageKey] ? snap.telemetry.stageKey : state.telemetry.stageKey
              };
              state.customAiAdvice = null;
            }

            // 2. Склад TUBA
            if (snap.tubaWarehouse && typeof snap.tubaWarehouse === "object") {
              tubaWarehouse = snap.tubaWarehouse;
              try { localStorage.setItem("JURMALCIEMS_WAREHOUSE_TUBA_V1", JSON.stringify(tubaWarehouse)); } catch (e) {}
            }

            // 3. Партии склада «Центр сверхприбыли»
            if (Array.isArray(snap.spWarehouseBatches)) {
              try { spWarehouseBatches = snap.spWarehouseBatches; } catch (e) {}
            }

            // 4. Состояние технолога (merge, а не replace — чтобы не потерять activeModule)
            if (snap.chiefTechState && typeof snap.chiefTechState === "object") {
              chiefTechState = { ...chiefTechState, ...snap.chiefTechState };
            }

            // 5. Параметры экономики VX
            if (snap.vx && typeof snap.vx === "object") {
              Object.assign(vx, snap.vx);
              if (typeof vxApplyCompact === "function") vxApplyCompact();
            }

            // 6. Перерисовка
            renderAll();

            // 7. Уведомление пользователя
            const spKey = (snap.telemetry && snap.telemetry.speciesKey) || "VIMBA";
            const spShort = (VX_SPECIES_META[spKey] && VX_SPECIES_META[spKey].short) || (FISH_SPECIES[spKey] && FISH_SPECIES[spKey].titleRu) || spKey;
            const kg = (snap.telemetry && snap.telemetry.batchWeightKg) || "?";
            showToast(`☁️ Слепок с телефона применён (${spShort} • ${kg} кг)`);

            // 8. Обновление времени синхронизации в модалке облака
            if (typeof cloudSyncState !== "undefined" && cloudSyncState) {
              cloudSyncState.lastSyncTimeStr = (snap.updatedAtStr || new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
              cloudSyncState.lastSyncDeviceStr = `Принято от: ${snap.deviceName || "Смартфон"}`;
              cloudSyncState.lastSnapshotRev = snap.updatedAtMs || Date.now();
              if (typeof updateCloudSyncUi === "function") updateCloudSyncUi();
              if (typeof logCloudSyncActivity === "function") logCloudSyncActivity(`⬇ Слепок принят от телефона: ${spShort} ${kg} кг`);
            }
          } catch (err) {
            console.warn("SYNC_SNAPSHOT apply error:", err);
            showToast("⚠️ Ошибка применения слепка с телефона: " + (err && err.message ? err.message : err));
          }
        }
      };
    }


    // ==================== 🏆 ЦЕНТР СВЕРХПРИБЫЛИ И СПАСЕНИЯ ПАРТИЙ (5 УМНЫХ ДВИЖКОВ) ====================
    let spActiveTab = 1;
    let spAimMode = "DELICATE"; // DELICATE, STOCK, BEER
    let spRescueType = "SALT"; // SALT, BLACKOUT, TONNAGE, CRUST

    let spWarehouseBatches = [
      { id: "b102", name: "Партия #102 • Лещ колодкой", fish: "Лещ", days: 82, weightKg: 280, note: "Подходит предельный срок вакуума — отгрузить клиентам в первую очередь!" },
      { id: "b108", name: "Партия #108 • Вимба рубиновая", fish: "Вимба", days: 46, weightKg: 420, note: "Идеальный баланс просола и нежности — премиальная отгрузка." },
      { id: "b112", name: "Партия #112 • Плотва икряная", fish: "Плотва", days: 9, weightKg: 310, note: "Дозревание: соль и нутряной жир еще диффундируют в спинку — придержать!" }
    ];

    function renderAllSpPanels() {
      try { if (typeof calcSpAim === "function") calcSpAim(); } catch (e) { console.warn("calcSpAim error:", e); }
      try { if (typeof calcSpDetector === "function") calcSpDetector(); } catch (e) { console.warn("calcSpDetector error:", e); }
      try { if (typeof calcSpRescue === "function") calcSpRescue(); } catch (e) { console.warn("calcSpRescue error:", e); }
      try { if (typeof calcSpScrap === "function") calcSpScrap(); } catch (e) { console.warn("calcSpScrap error:", e); }
      try { if (typeof renderSpWarehouse === "function") renderSpWarehouse(); } catch (e) { console.warn("renderSpWarehouse error:", e); }
    }

    function switchSpTab(tabNum) {
      if (typeof triggerHaptic === "function") triggerHaptic(10);
      spActiveTab = tabNum;
      for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById("sp-tab-btn-" + i);
        const pane = document.getElementById("sp-pane-" + i);
        if (btn) btn.classList.toggle("active", i === tabNum);
        if (pane) pane.style.display = (i === tabNum) ? "flex" : "none";
      }
      if (tabNum === 1) calcSpAim();
      else if (tabNum === 2) calcSpDetector();
      else if (tabNum === 3) calcSpRescue();
      else if (tabNum === 4) calcSpScrap();
      else if (tabNum === 5) renderSpWarehouse();
    }

    // ВКЛАДКА 1: ПРИЦЕЛ ПАРТИИ
    function setSpAimMode(mode) {
      if (typeof triggerHaptic === "function") triggerHaptic(10);
      spAimMode = mode;
      ["delicate", "stock", "beer"].forEach(m => {
        const b = document.getElementById("sp-aim-btn-" + m);
        if (b) b.classList.toggle("active", m.toUpperCase() === mode);
      });
      calcSpAim();
    }

    function calcSpAim() {
      const rawKg = parseFloat(document.getElementById("sp-aim-raw-kg")?.value) || 1000;
      const price = parseFloat(document.getElementById("sp-aim-price")?.value) || 12.00;
      const activeKey = (typeof tradeHouseState !== "undefined" && tradeHouseState.speciesKey) || (typeof chiefTechState !== "undefined" && chiefTechState.speciesKey) || "ROACH";
      const spDef = (typeof TRADE_SPECIES_DEFAULTS !== "undefined" && TRADE_SPECIES_DEFAULTS[activeKey]) || { yieldPct: 58.0 };
      const baseYield = spDef.yieldPct;

      let yieldPct = baseYield;
      let saltStr = "4.8 – 5.2%";
      let saltNote = "Плотный посол";
      let shelfStr = "90–150 дней";
      let shelfTemp = "При температуре 0..+2°C";

      if (spAimMode === "DELICATE") {
        yieldPct = baseYield + 3.5; // +3.5%
        saltStr = "3.8 – 4.2%";
        saltNote = "Нежный сочный малосол";
        shelfStr = "20–30 дней";
        shelfTemp = "Быстрая продажа (+2..+4°C)";
      } else if (spAimMode === "STOCK") {
        yieldPct = baseYield - 2.0; // -2.0%
        saltStr = "4.8 – 5.2%";
        saltNote = "Дожим влаги от плесени";
        shelfStr = "3–5 месяцев";
        shelfTemp = "Хранение на лето (0..+2°C)";
      } else if (spAimMode === "BEER") {
        yieldPct = baseYield - 3.0; // -3.0%
        saltStr = "5.2 – 5.5%";
        saltNote = "Плотная сушеная спинка";
        shelfStr = "60–90 дней";
        shelfTemp = "Для открытой витрины";
      }

      const readyKg = Math.round(rawKg * (yieldPct / 100));
      const extraKg = Math.round(rawKg * 0.035); // +3.5% деликатеса
      const extraEur = Math.round(extraKg * price);

      const elYieldKg = document.getElementById("sp-aim-res-yield-kg");
      const elYieldPct = document.getElementById("sp-aim-res-yield-pct");
      const elSaltPct = document.getElementById("sp-aim-res-salt-pct");
      const elSaltNote = document.getElementById("sp-aim-res-salt-note");
      const elExtraEur = document.getElementById("sp-aim-res-extra-eur");
      const elExtraKg = document.getElementById("sp-aim-res-extra-kg");
      const elShelf = document.getElementById("sp-aim-res-shelf");
      const elShelfTemp = document.getElementById("sp-aim-res-shelf-temp");

      if (elYieldKg) elYieldKg.textContent = readyKg + " кг";
      if (elYieldPct) elYieldPct.textContent = "Выход: " + yieldPct.toFixed(1) + "% от сырья";
      if (elSaltPct) elSaltPct.textContent = saltStr;
      if (elSaltNote) elSaltNote.textContent = saltNote;
      if (elExtraEur) elExtraEur.textContent = "+" + extraEur.toLocaleString() + " €";
      if (elExtraKg) elExtraKg.textContent = "+" + extraKg + " кг законной влаги";
      if (elShelf) elShelf.textContent = shelfStr;
      if (elShelfTemp) elShelfTemp.textContent = shelfTemp;
    }

    // ВКЛАДКА 2: ДЕТЕКТОР ПОТЕРЬ ВЕСА
    function calcSpDetector() {
      const dockKg = parseFloat(document.getElementById("sp-det-dock-kg")?.value) || 1200;
      const drainKg = parseFloat(document.getElementById("sp-det-drain-kg")?.value) || 1120;
      const brineKg = parseFloat(document.getElementById("sp-det-brine-kg")?.value) || 1040;
      const packKg = parseFloat(document.getElementById("sp-det-pack-kg")?.value) || 515;
      const buyEur = parseFloat(document.getElementById("sp-det-buy-eur")?.value) || 2.20;
      const sellEur = parseFloat(document.getElementById("sp-det-sell-eur")?.value) || 11.50;

      // 1. Вода и лед от рыбака
      const iceLossKg = Math.max(0, dockKg - drainKg);
      const iceLossPct = ((iceLossKg / (dockKg || 1)) * 100).toFixed(1);
      const iceLossEur = Math.round(iceLossKg * buyEur);

      // 2. Потеря в рассоле
      const brineLossKg = Math.max(0, drainKg - brineKg);
      const brineLossPct = ((brineLossKg / (drainKg || 1)) * 100).toFixed(1);

      // 3. Пересушка в камере (точный плановый процент выхода вида рыбы)
      const spKey = normalizeSpeciesKey((state && state.telemetry && state.telemetry.speciesKey) || (typeof tradeHouseState !== "undefined" && tradeHouseState.speciesKey) || "VIMBA");
      const sp = TRADE_SPECIES_DEFAULTS[spKey] || TRADE_SPECIES_DEFAULTS.VIMBA;
      const targetYieldPct = sp.yieldPct || 61.5;
      const plannedPackKg = Math.round(drainKg * (targetYieldPct / 100));
      const overdryKg = Math.max(0, plannedPackKg - packKg);
      const overdryEur = Math.round(overdryKg * sellEur);
      const finalYieldPct = ((packKg / (dockKg || 1)) * 100).toFixed(1);

      const elIceKg = document.getElementById("sp-det-res-ice-kg");
      const elIceEur = document.getElementById("sp-det-res-ice-eur");
      const elBrineKg = document.getElementById("sp-det-res-brine-kg");
      const elOverdryKg = document.getElementById("sp-det-res-overdry-kg");
      const elOverdryNote = document.getElementById("sp-det-res-overdry-note");
      const elSummary = document.getElementById("sp-det-bar-summary");

      if (elIceKg) elIceKg.textContent = iceLossKg + " кг (" + iceLossPct + "%)";
      if (elIceEur) elIceEur.textContent = "Переплата: " + iceLossEur + " € • Требовать скидку!";
      if (elBrineKg) elBrineKg.textContent = brineLossKg + " кг (" + brineLossPct + "%)";
      if (elOverdryKg) {
        if (overdryKg > 0) {
          elOverdryKg.textContent = overdryKg + " кг (" + overdryEur + " €)";
          if (elOverdryNote) elOverdryNote.textContent = "Улетело в трубу от передержки";
        } else {
          elOverdryKg.textContent = "0 кг (0 €)";
          if (elOverdryNote) elOverdryNote.textContent = "В норме планового выхода";
        }
      }
      if (elSummary) elSummary.textContent = "Выход готовой: " + targetYieldPct.toFixed(1) + "% (" + sp.name + ")";
      const bFinal = document.getElementById("sp-det-bar-final");
      if (bFinal) bFinal.style.width = targetYieldPct + "%";

      // Шкала
      const barFinal = document.getElementById("sp-det-bar-final");
      const barDrying = document.getElementById("sp-det-bar-drying");
      const barBrine = document.getElementById("sp-det-bar-brine");
      const barIce = document.getElementById("sp-det-bar-ice");

      if (barFinal && barDrying && barBrine && barIce) {
        const pFinal = Math.min(60, Math.max(20, (packKg / (dockKg || 1)) * 100));
        const pIce = Math.min(20, Math.max(2, (iceLossKg / (dockKg || 1)) * 100));
        const pBrine = Math.min(20, Math.max(3, (brineLossKg / (dockKg || 1)) * 100));
        const pDrying = Math.max(10, 100 - pFinal - pIce - pBrine);

        barFinal.style.width = pFinal + "%";
        barDrying.style.width = pDrying + "%";
        barBrine.style.width = pBrine + "%";
        barIce.style.width = pIce + "%";
      }
    }

    // ВКЛАДКА 3: СПАСАТЕЛЬ ЧП
    function setSpRescueTab(type) {
      if (typeof triggerHaptic === "function") triggerHaptic(10);
      spRescueType = type;
      ["salt", "blackout", "tonnage", "crust"].forEach(t => {
        const btn = document.getElementById("sp-res-btn-" + t);
        const box = document.getElementById("sp-res-box-" + t);
        if (btn) btn.classList.toggle("active", t.toUpperCase() === type);
        if (box) box.style.display = (t.toUpperCase() === type) ? "flex" : "none";
      });
      calcSpRescue();
    }

    function calcSpRescue() {
      if (spRescueType === "SALT") {
        const hrs = parseFloat(document.getElementById("sp-res-salt-hrs")?.value) || 8;
        const size = document.getElementById("sp-res-salt-size")?.value || "MEDIUM";
        const mult = size === "SMALL" ? 0.65 : size === "LARGE" ? 1.10 : 0.85;
        const soakTime = (hrs * mult).toFixed(1);
        const shiftStep = size === "SMALL" ? 2.5 : size === "LARGE" ? 3.5 : 3.0;
        const totalShifts = Math.max(1, Math.ceil(soakTime / shiftStep));

        const elTime = document.getElementById("sp-res-salt-out-time");
        const elShifts = document.getElementById("sp-res-salt-out-shifts");
        if (elTime) elTime.textContent = soakTime + " ч";
        if (elShifts) elShifts.textContent = "Каждые " + shiftStep + " ч (" + totalShifts + " смены)";
      } else if (spRescueType === "BLACKOUT") {
        const blkHrs = parseFloat(document.getElementById("sp-res-blk-hrs")?.value) || 4;
        const rhSpike = Math.min(98, Math.round(65 + blkHrs * 7.5));
        const elRh = document.getElementById("sp-res-blk-out-rh");
        if (elRh) elRh.textContent = rhSpike + "% rH";
      } else if (spRescueType === "TONNAGE") {
        const tonDays = parseFloat(document.getElementById("sp-res-ton-days")?.value) || 3;
        const beVal = tonDays <= 2 ? "14–15 °Bé" : tonDays <= 4 ? "12–14 °Bé" : "10–12 °Bé";
        const elBe = document.getElementById("sp-res-ton-out-be");
        if (elBe) elBe.textContent = beVal;
      }
    }

    // ВКЛАДКА 4: НЕКОНДИЦИЯ
    function calcSpScrap() {
      const kg = parseFloat(document.getElementById("sp-scr-kg")?.value) || 100;
      const scrapEur = parseFloat(document.getElementById("sp-scr-scrap-eur")?.value) || 4.50;
      const roeEur = parseFloat(document.getElementById("sp-scr-roe-eur")?.value) || 28.00;
      const filletEur = parseFloat(document.getElementById("sp-scr-fillet-eur")?.value) || 19.00;
      const snackEur = 8.50;

      const asScrapEur = kg * scrapEur;

      const roeKg = Math.round(kg * 0.14);
      const roeRev = Math.round(roeKg * roeEur);

      const filletKg = Math.round(kg * 0.44);
      const filletRev = Math.round(filletKg * filletEur);

      const snackKg = Math.round(kg * 0.22);
      const snackRev = Math.round(snackKg * snackEur);

      const totalCutRev = roeRev + filletRev + snackRev;
      const extraProfit = Math.round(totalCutRev - asScrapEur);
      const pct = asScrapEur > 0 ? Math.round((extraProfit / asScrapEur) * 100) : 0;

      const elRoe = document.getElementById("sp-scr-out-roe-val");
      const elFillet = document.getElementById("sp-scr-out-fillet-val");
      const elSnack = document.getElementById("sp-scr-out-snack-val");
      const elExtra = document.getElementById("sp-scr-out-extra-profit");
      const elMult = document.getElementById("sp-scr-out-multiplier");

      if (elRoe) elRoe.textContent = roeKg + " кг (" + roeRev + " €)";
      if (elFillet) elFillet.textContent = filletKg + " кг (" + filletRev + " €)";
      if (elSnack) elSnack.textContent = snackKg + " кг (" + snackRev + " €)";
      if (elExtra) elExtra.textContent = (extraProfit >= 0 ? "+" : "") + extraProfit.toLocaleString() + " €";
      if (elMult) elMult.textContent = "+" + pct + "% к сдаче за бесценок (" + asScrapEur + " €)";
    }

    // ВКЛАДКА 5: СВЕТОФОР СКЛАДА
    function renderSpWarehouse() {
      const container = document.getElementById("sp-warehouse-list");
      if (!container) return;

      // Авто-сортировка: партии >75 дней поднимаются на самый верх!
      const sorted = [...spWarehouseBatches].sort((a, b) => b.days - a.days);

      let html = "";
      sorted.forEach(b => {
        let tagColor = "#00E5FF";
        let tagBg = "rgba(0,229,255,0.1)";
        let tagText = "🔵 Дозревает в вакууме";
        let cardBorder = "#1C3352";

        if (b.days > 75) {
          tagColor = "#FFA726";
          tagBg = "rgba(255,167,38,0.18)";
          tagText = "🟠 ПРОДАТЬ ПЕРВОЙ!";
          cardBorder = "#FFA726";
        } else if (b.days >= 13) {
          tagColor = "#2EE59D";
          tagBg = "rgba(46,229,157,0.15)";
          tagText = "🟢 ПИК ВКУСА";
          cardBorder = "#2EE59D";
        }

        html += `
          <div style="background:rgba(8,18,32,0.85); border:1.5px solid ${cardBorder}; border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-weight:800; font-size:13px; color:#FFFFFF;">${escapeHtml(b.name)}</div>
              <div style="font-size:11px; color:#9FB3C8; margin-top:2px;">
                В вакууме: <b style="color:${tagColor};">${Number(b.days) || 0} дней</b> • Остаток: <b>${Number(b.weightKg) || 0} кг</b>
              </div>
              <div style="font-size:10.5px; color:#CBD5E1; margin-top:2px;">${escapeHtml(b.note)}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px; font-weight:800; padding:4px 8px; border-radius:6px; background:${tagBg}; color:${tagColor}; border:1px solid ${tagColor};">
                ${tagText}
              </span>
              <button onclick="deleteSpBatch('${escapeHtml(b.id)}')" data-action="delete-sp-batch" data-id="${escapeHtml(b.id)}" style="background:none; border:none; color:#FF5252; cursor:pointer; font-size:14px;" title="Удалить партию">✕</button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    function addSpBatchPrompt() {
      const name = prompt("Название партии и рыба (например: Партия #115 • Корюшка):", "Партия #115 • Корюшка");
      if (!name) return;
      const days = parseInt(prompt("Сколько дней партия лежит в вакууме:", "14"), 10) || 14;
      const kg = parseInt(prompt("Вес на складе (кг):", "200"), 10) || 200;

      spWarehouseBatches.push({
        id: "b_" + Date.now(),
        name: name,
        fish: "Рыба",
        days: days,
        weightKg: kg,
        note: days > 75 ? "Срочно отгрузить клиентам!" : days >= 13 ? "Идеальная кондиция для продажи." : "Продолжается дозревание в вакууме."
      });
      renderSpWarehouse();
    }

    function deleteSpBatch(id) {
      spWarehouseBatches = spWarehouseBatches.filter(b => b.id !== id);
      renderSpWarehouse();
    }

  
      try {
        if (typeof calcSpAim === 'function') calcSpAim();
        if (typeof calcSpDetector === 'function') calcSpDetector();
        if (typeof calcSpRescue === 'function') calcSpRescue();
        if (typeof calcSpScrap === 'function') calcSpScrap();
        if (typeof renderSpWarehouse === 'function') renderSpWarehouse();
      } catch (e) {}

export {
  buildCalculatorCardHtml,
  buildReal527CsvText,
  parseParksideLogText,
  analyzeParksidePoints,
  renderParksideChartAndVerdict,
  loadDemoParksideProfile,
  renderVisualScreens,
  vxInit,
  vxSetRange,
  renderSaltingCalculator,
  renderAerodynamicsCalculator,
  renderMicrobiologyCalculator,
  renderChiefTechnologistSuite,
  tradeHouseState,
  persistTradeHouseState,
  loadTradeHousePersistence,
  persistChiefTechState,
  loadChiefTechPersistence,
  vx,
  vxComputeBatch,
  vxComputeProfit,
  TRADE_SPECIES_DEFAULTS,
  TRADE_PACK_FORMATS,
  PARKSIDE_DEMO_LOGS,
  openMobileActionsDrawer,
  triggerExportCsv,
  closeCsvModal,
  downloadActiveCsv,
  copyActiveCsv,
  toggleVoiceListening,
  stopVoiceAll,
  speakVoiceReport,
  speakWithAiVoice,
  handleVoiceCommand,
  vxSetBatchMode,
  onVisualRawInput,
  onVisualYieldInput,
  onVisualProfitInput,
  switchSpTab,
  setSpAimMode,
  calcSpAim,
  calcSpDetector,
  setSpRescueTab,
  calcSpRescue,
  calcSpScrap,
  addSpBatchPrompt,
  handleParksideFileUpload,
  syncParksideToAdvisor,
  setParksideZoom,
  stepParksidePan,
  onParksidePanInput,
  toggleVisualCompact,
  vxSelectVariant,
  vxStepMixCart,
  vxApplyMixPreset,
  syncActiveBatch,
  renderOwnerSimpleView,
  renderSpWarehouse,
  renderAllSpPanels
};

if (typeof window !== "undefined") {
  window.buildCalculatorCardHtml = buildCalculatorCardHtml;
  window.analyzeParksidePoints = analyzeParksidePoints;
  window.renderParksideChartAndVerdict = renderParksideChartAndVerdict;
  window.loadDemoParksideProfile = loadDemoParksideProfile;
  window.renderVisualScreens = renderVisualScreens;
  window.vxInit = vxInit;
  window.vxSetRange = vxSetRange;
  window.renderSaltingCalculator = renderSaltingCalculator;
  window.renderAerodynamicsCalculator = renderAerodynamicsCalculator;
  window.renderMicrobiologyCalculator = renderMicrobiologyCalculator;
  window.renderChiefTechnologistSuite = renderChiefTechnologistSuite;
  window.tradeHouseState = tradeHouseState;
  window.persistTradeHouseState = persistTradeHouseState;
  window.loadTradeHousePersistence = loadTradeHousePersistence;
  window.persistChiefTechState = persistChiefTechState;
  window.loadChiefTechPersistence = loadChiefTechPersistence;
  window.vx = vx;
  window.TRADE_SPECIES_DEFAULTS = TRADE_SPECIES_DEFAULTS;
  window.TRADE_PACK_FORMATS = TRADE_PACK_FORMATS;
  window.openMobileActionsDrawer = openMobileActionsDrawer;
  window.triggerExportCsv = triggerExportCsv;
  window.closeCsvModal = closeCsvModal;
  window.downloadActiveCsv = downloadActiveCsv;
  window.copyActiveCsv = copyActiveCsv;
  window.toggleVoiceListening = toggleVoiceListening;
  window.stopVoiceAll = stopVoiceAll;
  window.speakVoiceReport = speakVoiceReport;
  window.speakWithAiVoice = speakWithAiVoice;
  window.handleVoiceCommand = handleVoiceCommand;
  window.vxSetBatchMode = vxSetBatchMode;
  window.onVisualRawInput = onVisualRawInput;
  window.onVisualYieldInput = onVisualYieldInput;
  window.onVisualProfitInput = onVisualProfitInput;
  window.switchSpTab = switchSpTab;
  window.setSpAimMode = setSpAimMode;
  window.calcSpAim = calcSpAim;
  window.calcSpDetector = calcSpDetector;
  window.setSpRescueTab = setSpRescueTab;
  window.calcSpRescue = calcSpRescue;
  window.calcSpScrap = calcSpScrap;
  window.addSpBatchPrompt = addSpBatchPrompt;
  window.handleParksideFileUpload = handleParksideFileUpload;
  window.syncParksideToAdvisor = syncParksideToAdvisor;
  window.setParksideZoom = setParksideZoom;
  window.stepParksidePan = stepParksidePan;
  window.onParksidePanInput = onParksidePanInput;
  window.toggleVisualCompact = toggleVisualCompact;
  window.vxSelectVariant = vxSelectVariant;
  window.vxStepMixCart = vxStepMixCart;
  window.vxApplyMixPreset = vxApplyMixPreset;
  window.syncActiveBatch = syncActiveBatch;
  window.renderOwnerSimpleView = renderOwnerSimpleView;
  window.renderSpWarehouse = renderSpWarehouse;
  window.renderAllSpPanels = renderAllSpPanels;
}
    
  

