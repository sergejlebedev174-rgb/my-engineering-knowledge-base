// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 3: БИОФИЗИЧЕСКОЕ И ПСИХРОМЕТРИЧЕСКОЕ ЯДРО (ES Module)
// ==========================================================================

import {
  FISH_SPECIES,
  CURING_STAGES,
  HEAT_RECOVERY_MODES
} from './constants.js';

import { state } from './state.js';

    // ==================== 3. БИОФИЗИЧЕСКОЕ ЯДРО (CuringBioscienceEngine) ====================
    function calculateMcgsCycleTotals(stage, mcgsPhases) {
      let workHoursTotal = 0;
      let pauseHoursTotal = 0;
      let bufferHours = 0;

      mcgsPhases.forEach(p => {
        const h = Number(p.durationHours || 0);
        if (p.phaseNumber === 8) bufferHours += h;
        else if (p.phaseNumber % 2 === 1) workHoursTotal += h;
        else pauseHoursTotal += h;
      });

      const totalHours = Math.round((workHoursTotal + pauseHoursTotal + bufferHours) * 10) / 10;
      const totalDays = Math.round((totalHours / 24.0) * 100) / 100;

      // Мощность в активных фазах сушки (компрессор + Cantoni VFD)
      const activeKwRange = stage.key === "STAGE_1"
        ? [21.0, 24.0]
        : (stage.key === "STAGE_4" ? [15.5, 17.5] : [17.0, 19.0]);
      // Мощность в паузах (компрессор СТОП, 4 вентилятора Cantoni на 15–20 Гц / 4.5–5.0V по кубическому закону VFD)
      const pauseKwRange = [1.8, 2.4];
      // Мощность в Фазе 8 (Буфер безопасности 12 ч — периодическое поддержание 14.5°C / 55% rH на 15 Гц)
      const bufferKwRange = [4.5, 6.0];

      const minKwh = Math.round(
        workHoursTotal * activeKwRange[0] +
        pauseHoursTotal * pauseKwRange[0] +
        bufferHours * bufferKwRange[0]
      );
      const maxKwh = Math.round(
        workHoursTotal * activeKwRange[1] +
        pauseHoursTotal * pauseKwRange[1] +
        bufferHours * bufferKwRange[1]
      );
      const avgKwh = Math.round((minKwh + maxKwh) / 2.0);

      return {
        totalHours,
        totalDays,
        workHoursTotal: Math.round(workHoursTotal * 10) / 10,
        pauseHoursTotal: Math.round(pauseHoursTotal * 10) / 10,
        bufferHours: Math.round(bufferHours * 10) / 10,
        minKwh,
        maxKwh,
        avgKwh,
        activeKwRange
      };
    }
    function targetTempRangeFor(species, stage, coLoadWithVimba) {
      if (stage.key === "STAGE_4") return [13.0, 15.0];
      if (species.key === "BREAM") {
        return stage.key === "STAGE_1" ? [12.0, 14.0] : [14.5, 16.5];
      }
      if (species.key === "ROACH" && !coLoadWithVimba) {
        return stage.key === "STAGE_1" ? [20.0, 23.0] : [17.0, 19.0];
      }
      if (species.key === "SMELT") {
        return stage.key === "STAGE_1" ? [18.0, 22.0] : [16.0, 18.0];
      }
      return coLoadWithVimba ? species.tempRangeWithVimbaC : species.tempRangeMonoC;
    }

    function calculateYieldForecast(rawWeightKg, species, stage) {
      const safeWeight = Math.max(1, Math.round(rawWeightKg));
      const minOut = Math.round((safeWeight * species.yieldMinPercent) / 100.0);
      const maxOut = Math.round((safeWeight * species.yieldMaxPercent) / 100.0);
      const avgOut = Math.round((minOut + maxOut) / 2.0);
      const minWater = Math.max(0, safeWeight - maxOut);
      const maxWater = Math.max(0, safeWeight - minOut);
      const avgWater = Math.max(0, safeWeight - avgOut);
      const stageWater = Math.round((avgWater * stage.moistureShareOfTotalPercent) / 100.0);
      return {
        rawWeightKg: safeWeight,
        finishedMinKg: minOut,
        finishedMaxKg: maxOut,
        finishedAvgKg: avgOut,
        totalWaterMinLiters: minWater,
        totalWaterMaxLiters: maxWater,
        totalWaterAvgLiters: avgWater,
        currentStageWaterLiters: stageWater
      };
    }

    function generateMcgsTableForStage(t) {
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const range = targetTempRangeFor(species, stage, t.coLoadWithVimba);
      const baseTemp = stage.key === "STAGE_4" ? 14.0 : Math.round(((range[0] + range[1]) / 2.0) * 10) / 10;
      const pauseTemp = Math.round((baseTemp + 0.5) * 10) / 10;
      const activeFreqForPhase1 = stage.key === "STAGE_4"
        ? "25.3 Гц"
        : ((species.key === "SMELT" && stage.key === "STAGE_1") ? "20–25 Гц (первые 3ч) -> 30 Гц" : "30 Гц");
      const activeFreqStandard = stage.key === "STAGE_4" ? "25.3 Гц" : "30 Гц";
      const activeVoltStandard = stage.key === "STAGE_4" ? "7.6V" : "9.0V";
      const pauseVoltage = stage.key === "STAGE_1" ? "5.0V" : "4.5V";
      const circuitsDesc = stage.key === "STAGE_1" ? "2 контура (21–24 кВт·ч)" : "Контур №1 (17–19 кВт·ч)";

      const rows = [];
      for (let phase = 1; phase <= 7; phase++) {
        const isOdd = phase % 2 === 1;
        if (isOdd) {
          rows.push({
            phaseNumber: phase,
            modeLabel: stage.key === "STAGE_4" ? "ЗАБОР ВЛАГИ 1Ч (Ст.4)" : `СУШКА (Ст.${stage.number})`,
            tempSetpointC: baseTemp,
            humiSetpointPercent: 20,
            durationHours: stage.defaultWorkHours,
            cantoniFreqHz: phase === 1 ? activeFreqForPhase1 : activeFreqStandard,
            cantoniVoltageV: activeVoltStandard,
            circuitsNote: stage.key === "STAGE_4"
              ? `${circuitsDesc} • Забор влаги 1ч (Cantoni 25.3 Гц, +13…+15°C)`
              : `${circuitsDesc} • Пуск компрессора`
          });
        } else {
          rows.push({
            phaseNumber: phase,
            modeLabel: stage.key === "STAGE_4" ? "ОТДЫХ 4Ч (Ст.4)" : `ПАУЗА (Ст.${stage.number})`,
            tempSetpointC: pauseTemp,
            humiSetpointPercent: 90,
            durationHours: stage.defaultPauseHours,
            cantoniFreqHz: stage.pauseFreqLabel,
            cantoniVoltageV: pauseVoltage,
            circuitsNote: stage.key === "STAGE_4"
              ? "Стоп компр. • Отдых 4ч (стабилизация жирной рыбы при +13…+15°C)"
              : "Стоп компр. (выравнивание влаги от хребта)"
          });
        }
      }
      rows.push({
        phaseNumber: 8,
        modeLabel: "БУФЕР БЕЗОПАСНОСТИ",
        tempSetpointC: 14.5,
        humiSetpointPercent: 55,
        durationHours: 12.0,
        cantoniFreqHz: "15 Гц",
        cantoniVoltageV: "4.5V",
        circuitsNote: "Удержание партии (+13…+15°C) до прихода технолога / KOMET PlusVac 25"
      });
      return rows;
    }

    // Психрометрическая формула Реньо (Regnault) для вентилируемого психрометра (обдув ≥ 2 м/с)
    function calculateRegnaultPsychrometer(dryC, wetC) {
      const td = Number(dryC ?? 15.8);
      const tw = Math.min(td, Number(wetC ?? 11.4));
      // Давление насыщенного пара при Т сухого и Т мокрого (кПа)
      const esDry = 0.61078 * Math.exp((17.27 * td) / (td + 237.3));
      const esWet = 0.61078 * Math.exp((17.27 * tw) / (tw + 237.3));
      // Константа Реньо A = 0.0007947 °C^-1 при P = 101.325 кПа -> A*P = 0.080523 кПа/°C
      const AP = 0.0007947 * 101.325;
      const eActual = Math.max(0.05, esWet - AP * Math.max(0, td - tw));
      const rhPercent = Math.round(Math.min(100, Math.max(5, (eActual / esDry) * 100)) * 10) / 10;
      const vpdKpa = Math.round(Math.max(0, esDry - eActual) * 100) / 100;
      const a = 17.27, b = 237.7;
      const alpha = ((a * td) / (b + td)) + Math.log(rhPercent / 100.0);
      const dewPointC = Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
      return {
        dryC: Math.round(td * 10) / 10,
        wetC: Math.round(tw * 10) / 10,
        deltaPsyC: Math.round((td - tw) * 10) / 10,
        rhPercent,
        vpdKpa,
        dewPointC,
        eActualKpa: Math.round(eActual * 100) / 100
      };
    }


const _bioscienceCache = new Map();
const MAX_BIOSCIENCE_CACHE_SIZE = 50;
let _bioscienceCacheHits = 0;
let _bioscienceCacheMisses = 0;

export function clearBioscienceCache() {
  _bioscienceCache.clear();
  _bioscienceCacheHits = 0;
  _bioscienceCacheMisses = 0;
}

export function getBioscienceCacheStats() {
  return {
    size: _bioscienceCache.size,
    hits: _bioscienceCacheHits,
    misses: _bioscienceCacheMisses
  };
}

export function computeTelemetryHash(t) {
  if (!t) return "null";
  return [
    t.speciesKey || "VIMBA",
    t.stageKey || "STAGE_2",
    t.batchWeightKg || 1000,
    Number(t.environmentTempC || 15.8).toFixed(1),
    Math.round(Number(t.parksideRhPercent || 58)),
    Number(t.eev1Steps || 320),
    Number(t.dehumicoilTempC || 5.2).toFixed(1),
    t.heatRecoveryMode || "WINTER_14KW",
    t.coLoadWithVimba ? "1" : "0",
    t.isPausePhaseNow ? "1" : "0",
    t.scaleSurfaceTempC !== undefined ? Number(t.scaleSurfaceTempC).toFixed(1) : "-",
    t.spineMoistureGmPercent !== undefined ? Number(t.spineMoistureGmPercent).toFixed(1) : "-"
  ].join("|");
}

    function _analyzeBioscienceCore(t) {
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const temp = Number(t.environmentTempC);
      const rh = Math.min(99, Math.max(10, Number(t.parksideRhPercent)));

      // Инструментальный контроль: инфракрасный пирометр шкуры (Т чешуи °C) и влагомер Игольчатый влагомер хребта (%)
      const scaleSurfaceTempC = Number(t.scaleSurfaceTempC !== undefined ? t.scaleSurfaceTempC : Math.round((temp - 1.3) * 10) / 10);
      const spineMoistureGmPercent = Number(t.spineMoistureGmPercent !== undefined ? t.spineMoistureGmPercent : 48.0);
      const deltaTempEvapC = Math.round((temp - scaleSurfaceTempC) * 10) / 10;

      let evapStatus = "OPTIMAL";
      let evapStatusTitle = "";
      let evapStatusText = "";
      if (deltaTempEvapC >= 1.0) {
        evapStatus = "OPTIMAL";
        evapStatusTitle = `✅ ИСПАРЕНИЕ АКТИВНОЕ (ΔT = +${deltaTempEvapC.toFixed(1)}°C ≥ 1.0°C)`;
        evapStatusText = `инфракрасный пирометр шкуры: чешуя (${scaleSurfaceTempC}°C) холоднее воздуха камеры (${temp}°C) на +${deltaTempEvapC.toFixed(1)}°C — поры открыты, идет интенсивный влагосъем с испарительным охлаждением. Влага у хребта по Игольчатый влагомер мяса: ${spineMoistureGmPercent}%.`;
      } else if ((stage.key === "STAGE_1" || stage.key === "STAGE_2") && deltaTempEvapC < 0.4) {
        evapStatus = "CRITICAL";
        evapStatusTitle = `⛔ ТРЕВОГА (ΔT = ${deltaTempEvapC >= 0 ? "+" : ""}${deltaTempEvapC.toFixed(1)}°C < 0.4°C на Ст.${stage.number}): Поры закрылись (закал или жировая пленка), испарение встало!`;
        evapStatusText = `инфракрасный пирометр шкуры: Т чешуи (${scaleSurfaceTempC}°C) сравнялась с камерой (${temp}°C)! Испарение заблокировано: образовалась корка закала или жировая пленка (при +14°C жир закрывает поры на 80%). Влага у хребта по Игольчатый влагомер мяса: ${spineMoistureGmPercent}%. Если потек жир — немедленно запускайте протокол спасения в рефконтейнере (+10..+11°C, ≤40% rH)!`;
      } else if (stage.key === "STAGE_4" && deltaTempEvapC < 0.4) {
        evapStatus = "OPTIMAL";
        evapStatusTitle = `✅ МАРКЕР ВЫГРУЗКИ НА СТ.4 (ΔT = ${deltaTempEvapC >= 0 ? "+" : ""}${deltaTempEvapC.toFixed(1)}°C < 0.4°C)`;
        evapStatusText = `инфракрасный пирометр шкуры: Т чешуи (${scaleSurfaceTempC}°C) сравнялась с воздухом камеры (${temp}°C, ΔT < 0.4°C) — влагообмен завершен, внутреннее равновесие достигнуто (остаточная влага у хребта по Игольчатый влагомер мяса: ${spineMoistureGmPercent}%). Партия готова к выгрузке на KOMET PlusVac 25!`;
      } else {
        evapStatus = "WARNING";
        evapStatusTitle = `⏳ УМЕРЕННОЕ ИСПАРЕНИЕ (ΔT = ${deltaTempEvapC >= 0 ? "+" : ""}${deltaTempEvapC.toFixed(1)}°C)`;
        evapStatusText = `инфракрасный пирометр шкуры: разница воздух–чешуя составляет ${deltaTempEvapC >= 0 ? "+" : ""}${deltaTempEvapC.toFixed(1)}°C (Env ${temp}°C − Чешуя ${scaleSurfaceTempC}°C). Остаточная влага у хребта по Игольчатый влагомер мяса: ${spineMoistureGmPercent}%. Контролируйте диффузию влаги в паузах.`;
      }

      // Формула Магнуса-Тетенса
      const a = 17.27, b = 237.7;
      const alpha = ((a * temp) / (b + temp)) + Math.log(rh / 100.0);
      const dewPointC = Math.round(((b * alpha) / (a - alpha)) * 10) / 10;

      const esKpa = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
      const eaKpa = esKpa * (rh / 100.0);
      const vpdKpa = Math.round((esKpa - eaKpa) * 100) / 100;

      const yieldForecast = calculateYieldForecast(t.batchWeightKg, species, stage);
      const targetTempRange = targetTempRangeFor(species, stage, t.coLoadWithVimba);
      const targetRhRange = (species.key === "PERCH" && stage.key === "STAGE_1") ? [60.0, 68.0] : stage.targetShelfRhRange;

      // 1. Риск закала
      let caseHardeningRisk = "OPTIMAL";
      let caseHardeningText = `Риск закала минимален: градиент влажности (rH=${rh}%, VPD=${vpdKpa} кПа, ΔT чешуи=${deltaTempEvapC >= 0 ? "+" : ""}${deltaTempEvapC.toFixed(1)}°C) обеспечивает равномерную вытяжку от хребта (Влагомер хребта: ${spineMoistureGmPercent}%) без сухой корки.`;
      if ((stage.key === "STAGE_1" || stage.key === "STAGE_2") && deltaTempEvapC < 0.4) {
        caseHardeningRisk = "CRITICAL";
        caseHardeningText = `${evapStatusTitle} ${evapStatusText}`;
      } else if (!t.isPausePhaseNow && species.key === "PERCH" && stage.key === "STAGE_1" && rh < 60.0) {
        caseHardeningRisk = "CRITICAL";
        caseHardeningText = `Высокий риск закала панцирной чешуи окуня! Parkside rH=${rh}% ниже порога мягкого старта (60–65%). Поверхность закроется коркой, заперев влагу у хребта (Влагомер хребта: ${spineMoistureGmPercent}%).`;
      } else if (!t.isPausePhaseNow && rh < targetRhRange[0] - 5.0) {
        caseHardeningRisk = "CRITICAL";
        caseHardeningText = `Риск поверхностного закала! Влажность rH=${rh}% пересушена относительно полки Стадии ${stage.number} (${targetRhRange[0]}–${targetRhRange[1]}%). Держите регламентную паузу ${stage.defaultPauseHours} ч на 15–20 Гц (ЗАПРЕЩЕНО превышать 1.5–2.0 ч паузы на Ст.1–3, т.к. в закрытом контуре при 85% rH рыба задыхается!).`;
      } else if (!t.isPausePhaseNow && rh < targetRhRange[0]) {
        caseHardeningRisk = "WARNING";
        caseHardeningText = `Умеренный риск сухого кольца (rH=${rh}% чуть ниже полки ${targetRhRange[0]}–${targetRhRange[1]}%, ΔT чешуи=${deltaTempEvapC.toFixed(1)}°C). Контролируйте диффузию влаги от позвоночника в паузах (не длиннее ${stage.defaultPauseHours} ч).`;
      } else if (t.isPausePhaseNow && rh >= 70.0 && rh <= 86.0) {
        caseHardeningRisk = "OPTIMAL";
        caseHardeningText = `Нормальный скачок влажности в паузе (rH=${rh}% за счет выхода внутренней влаги к чешуе, закал отсутствует; помните: пауза на Ст.1–3 строго ≤ 1.5–2.0 ч, иначе при 85% rH рыба задыхается!).`;
      }

      // 2. Риск подпарки
      let thermalDamageRisk = "OPTIMAL";
      let thermalDamageText = `Риск подпарки отсутствует: температура ${temp}°C в целевом окне (${targetTempRange[0]}–${targetTempRange[1]}°C), точка росы ${dewPointC}°C.`;
      if (temp >= species.emergencyMaxTempC) {
        thermalDamageRisk = "CRITICAL";
        thermalDamageText = `АВАРИЙНЫЙ РИСК ПОДПАРКИ! Environment ${temp}°C превысил критический порог ${species.titleRu} (${species.emergencyMaxTempC}°C). Угроза денатурации белка и срыва рыбы с прутков SS304!`;
      } else if (temp > targetTempRange[1] + 0.6) {
        thermalDamageRisk = "WARNING";
        thermalDamageText = `Повышенный температурный фон (${temp}°C при норме ${targetTempRange[0]}–${targetTempRange[1]}°C). В закрытом контуре проверьте частотники Cantoni в паузе (не выше 15–20 Гц / 4.5–5.0V во избежание самонагрева трением воздуха).`;
      } else if (species.key === "VIMBA" && stage.key === "STAGE_2" && temp <= 16.8) {
        thermalDamageRisk = "OPTIMAL";
        thermalDamageText = `Подпарки нет: выход капли нутряного жира у вимбы на 3–4 сутки при Т=${temp}°C и сухой чешуе — технологическая НОРМА при усадке брюшка.`;
      }

      // 3. Проверка 1#EEV и 1#Dehumicoil
      const eevSteps = Number(t.eev1Steps);
      const coilT = Number(t.dehumicoilTempC);
      let eevStatus = "OPTIMAL";
      let eevDiagnosisText = `ЭРВ 1#EEV = ${eevSteps} step работает строго в расчетном окне (205–480 step, Dew point), испаритель 1#Dehumicoil = +${coilT}°C без обмерзания, контуров в работе: ${t.activeCircuitsRunning}.`;
      if (eevSteps < 75) {
        eevStatus = "CRITICAL";
        eevDiagnosisText = `Авария уставки 1#EEV = ${eevSteps} step (ниже жесткого порога MinimumStep = 75)! Риск блокировки протока R410A и обмерзания 1#Dehumicoil (${coilT}°C).`;
      } else if (eevSteps < 205) {
        eevStatus = "WARNING";
        eevDiagnosisText = `1#EEV = ${eevSteps} step зажат ниже рабочего окна (205–480 step), 1#Dehumicoil = ${coilT}°C. Риск ухода испарителя в обмерзание (< +4.5°C).`;
      } else if (eevSteps > 480) {
        eevStatus = "WARNING";
        eevDiagnosisText = `1#EEV = ${eevSteps} step переоткрыт выше окна (205–480 step), 1#Dehumicoil = ${coilT}°C. Недостаточный съем влаги в режиме Dew point (EEV control = 0).`;
      } else if (coilT < 4.5 || coilT > 5.8) {
        eevStatus = "WARNING";
        eevDiagnosisText = `Шаг 1#EEV = ${eevSteps} step в окне (205–480), но температура испарителя 1#Dehumicoil = ${coilT}°C вышла за оптимум (+4.5...+5.8°C).`;
      } else if (t.activeCircuitsRunning !== stage.activeCircuitsCount) {
        eevStatus = "WARNING";
        eevDiagnosisText = `1#EEV = ${eevSteps} step и 1#Dehumicoil = +${coilT}°C в норме, но включено контуров: ${t.activeCircuitsRunning} вместо регламентных ${stage.activeCircuitsCount} для Стадии ${stage.number}!`;
      }

      // 4. Готовность к следующей стадии / KOMET PlusVac 25
      let readinessStatus = "WARNING";
      let readinessText = "";
      const inTemp = temp >= targetTempRange[0] && temp <= targetTempRange[1];
      if (stage.key === "STAGE_1") {
        if (!t.isPausePhaseNow && rh <= 64.0 && inTemp) {
          readinessStatus = "OPTIMAL";
          readinessText = `Верховая влага снята (rH=${rh}%, ΔT чешуи=${deltaTempEvapC.toFixed(1)}°C, влага у хребта по Влагомер хребта=${spineMoistureGmPercent}%, план влагосъема стадии ~${yieldForecast.currentStageWaterLiters} л): партия готова к переходу на Стадию 2 (оставьте только Контур №1 на 17–19 кВт·ч с циклом 3.0 ч сушка / 1.5 ч пауза).`;
        } else {
          readinessText = `Продолжайте Стадию 1 на двух контурах AIM (цикл 3.5 ч работа на 30 Гц / 1.0 ч пауза на 20 Гц, ΔT чешуи=${deltaTempEvapC.toFixed(1)}°C, Влагомер хребта=${spineMoistureGmPercent}%) до снижения полки Parkside rH к 60–64%.`;
        }
      } else if (stage.key === "STAGE_2") {
        if (!t.isPausePhaseNow && rh >= 55.0 && rh <= 60.0 && inTemp) {
          readinessStatus = "OPTIMAL";
          readinessText = `Полка влажности в камере стабилизировалась на ${rh}% (норма 56–60% rH, ΔT чешуи=${deltaTempEvapC.toFixed(1)}°C, Влагомер хребта=${spineMoistureGmPercent}%): рыба готова к переходу на Стадию 3 (финишный дожим спинки: 2.5 ч сушка 30 Гц / 2.0 ч пауза 15–18 Гц).`;
        } else {
          readinessText = `Удерживайте Стадию 2 на Контуре №1 (цикл 3.0 ч сушка / 1.5 ч пауза, ΔT чешуи=${deltaTempEvapC.toFixed(1)}°C, Влагомер хребта=${spineMoistureGmPercent}%) для вытяжки влаги от хребта до достижения устойчивой полки 56–60% rH.`;
        }
      } else if (stage.key === "STAGE_3") {
        if (!t.isPausePhaseNow && rh >= 50.0 && rh <= 54.5 && inTemp) {
          readinessStatus = "OPTIMAL";
          readinessText = `Полка дожима спинки достигнута (rH=${rh}% в коридоре 50–54%, Влагомер хребта=${spineMoistureGmPercent}%): переводите партию на Стадию 4 — климатическое отволаживание ВНУТРИ ЗАКРЫТОЙ КАМЕРЫ (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц, 24–48 ч до среза «янтарно-стекловидная слеза без белесых пятен»). ⚠️ На воздухе в цеху держать строго НЕ БОЛЕЕ 24 часов!`;
        } else {
          readinessText = `Продолжайте Стадию 3 (дожим спинки, 2.5 ч работа / 2.0 ч пауза на Контуре №1, Влагомер хребта=${spineMoistureGmPercent}%) до выхода полки Parkside rH в диапазон 50–54%. Далее обязательна Стадия 4 — климатическое отволаживание в закрытой камере (13–15°C, 1ч осушение / 4ч отдых 15–20 Гц) до среза «янтарно-стекловидная слеза без белесых пятен».`;
        }
      } else {
        const unloadMarkerMsg = deltaTempEvapC < 0.4
          ? `✅ Маркер выгрузки по пирометру ИК-пирометр шкуры подтвержден (ΔT = ${deltaTempEvapC.toFixed(1)}°C < 0.4°C, влага у хребта по Игольчатый влагомер мяса: ${spineMoistureGmPercent}%).`
          : `Текущая ΔT чешуи по ИК-пирометр шкуры = +${deltaTempEvapC.toFixed(1)}°C (маркер полной готовности к выгрузке: ΔT < 0.4°C; Влагомер хребта у хребта: ${spineMoistureGmPercent}%).`;
        if (temp >= 13.0 && temp <= 15.2 && rh >= 50.0 && rh <= 56.5) {
          readinessStatus = "OPTIMAL";
          readinessText = `Климатическое отволаживание ВНУТРИ ЗАКРЫТОЙ КАМЕРЫ (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц, 24–48 ч) завершено (тушка охлаждена до ${temp}°C, rH=${rh}%, срез «янтарно-стекловидная слеза без белесых пятен», выход ${yieldForecast.finishedMinKg}–${yieldForecast.finishedMaxKg} кг) — выпадение росы в пакетах KOMET PlusVac 25 исключено! ${unloadMarkerMsg} ⚠️ На воздухе в цеху держать строго НЕ БОЛЕЕ 24 ч.`;
        } else if (temp > 15.2) {
          readinessText = `Упаковка на KOMET PlusVac 25 преждевременна: при климатическом отволаживании внутри закрытой камеры (1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц) доохладите тушку с ${temp}°C до 13–15°C, чтобы исключить выпадение росы внутри вакуум-пакетов! ${unloadMarkerMsg}`;
        } else {
          readinessText = `Завершите климатическое отволаживание внутри закрытой камеры (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц, 24–48 ч) до среза «янтарно-стекловидная слеза без белесых пятен» перед упаковкой на KOMET PlusVac 25. ${unloadMarkerMsg}`;
        }
      }

      // 5. Итоговое резюме технологу
      const heatModeObj = HEAT_RECOVERY_MODES[t.heatRecoveryMode || "WINTER_14KW"] || HEAT_RECOVERY_MODES.WINTER_14KW;
      let firstSentence = "";
      if (caseHardeningRisk === "CRITICAL" || thermalDamageRisk === "CRITICAL") {
        firstSentence = `Внимание по партии ${species.titleRu} (${t.batchWeightKg} кг, Стадия ${stage.number}, рекуперация: ${heatModeObj.shortBadgeRu}): зафиксирован критический режим (Environment ${temp}°C, Чешуя ИК-пирометр шкуры ${scaleSurfaceTempC}°C [ΔT=${deltaTempEvapC.toFixed(1)}°C], Влагомер хребта ${spineMoistureGmPercent}%, Parkside rH ${rh}%, точка росы ${dewPointC}°C, VPD ${vpdKpa} кПа) — ${thermalDamageRisk === "CRITICAL" ? thermalDamageText : caseHardeningText}`;
      } else if (caseHardeningRisk === "WARNING" || thermalDamageRisk === "WARNING") {
        firstSentence = `Партия ${species.titleRu} (${t.batchWeightKg} кг, Стадия ${stage.number}, рекуперация: ${heatModeObj.shortBadgeRu}) идет с отклонением климата (Environment ${temp}°C, Чешуя ИК-пирометр шкуры ${scaleSurfaceTempC}°C [ΔT=${deltaTempEvapC.toFixed(1)}°C], Влагомер хребта ${spineMoistureGmPercent}%, Parkside rH ${rh}%, точка росы ${dewPointC}°C, VPD ${vpdKpa} кПа): ${thermalDamageRisk !== "OPTIMAL" ? thermalDamageText : caseHardeningText}`;
      } else {
        const vimbaNote = (species.key === "VIMBA" && stage.key === "STAGE_2") ? ", капля жира у анального отверстия при сухой чешуе является нормой" : "";
        firstSentence = `Партия ${species.titleRu} (${t.batchWeightKg} кг, Стадия ${stage.number}, рекуперация: ${heatModeObj.shortBadgeRu}) идет в оптимальном биотехнологическом коридоре (Environment ${temp}°C, Чешуя ИК-пирометр шкуры ${scaleSurfaceTempC}°C [ΔT=+${deltaTempEvapC.toFixed(1)}°C], Влагомер хребта ${spineMoistureGmPercent}%, Parkside rH ${rh}%, точка росы ${dewPointC}°C, VPD ${vpdKpa} кПа): рисков закала и подпарки нет${vimbaNote}.`;
      }

      const instantAdvisorSummary = `${firstSentence} ${eevDiagnosisText} ${readinessText}`;
      const mcgsPhases = generateMcgsTableForStage(t);

      return {
        dewPointC,
        vpdKpa,
        scaleSurfaceTempC,
        spineMoistureGmPercent,
        deltaTempEvapC,
        evapStatus,
        evapStatusTitle,
        evapStatusText,
        yieldForecast,
        caseHardeningRisk,
        caseHardeningText,
        thermalDamageRisk,
        thermalDamageText,
        eevStatus,
        eevDiagnosisText,
        readinessStatus,
        readinessText,
        instantAdvisorSummary,
        mcgsPhases
      };
    }

    export function analyzeBioscience(t) {
      if (!t) return _analyzeBioscienceCore(t);
      const cacheKey = computeTelemetryHash(t);
      if (_bioscienceCache.has(cacheKey)) {
        _bioscienceCacheHits++;
        return _bioscienceCache.get(cacheKey);
      }
      _bioscienceCacheMisses++;
      const result = _analyzeBioscienceCore(t);
      if (_bioscienceCache.size >= MAX_BIOSCIENCE_CACHE_SIZE) {
        const oldestKey = _bioscienceCache.keys().next().value;
        _bioscienceCache.delete(oldestKey);
      }
      _bioscienceCache.set(cacheKey, result);
      return result;
    }

export function computeWaterLossRate(t, diag) {
  // Если партия не запущена — вернуть null
  if (!t || !t.batchStartMs) return null;

  const now = Date.now();
  const elapsedMs = Math.max(0, now - t.batchStartMs);
  const elapsedHours = elapsedMs / 3600000;
  const elapsedDays = elapsedHours / 24;

  // Оценка общей длительности цикла (из diag/yf)
  const yf = (diag && diag.yieldForecast) ? diag.yieldForecast : { totalWaterAvgLiters: 480 };
  const stage = (typeof Constants !== "undefined" && Constants.CURING_STAGES && t.stageKey) 
    ? Constants.CURING_STAGES[t.stageKey] 
    : ((typeof CURING_STAGES !== "undefined" && CURING_STAGES[t.stageKey]) ? CURING_STAGES[t.stageKey] : { titleRu: "Сушка" });
  const meta = (typeof Constants !== "undefined" && Constants.VX_SPECIES_META && t.speciesKey)
    ? Constants.VX_SPECIES_META[t.speciesKey]
    : ((typeof VX_SPECIES_META !== "undefined" && VX_SPECIES_META[t.speciesKey]) ? VX_SPECIES_META[t.speciesKey] : null);
  const dryDaysEst = meta ? meta.dryDays : 5.5;
  const restDaysEst = 1.5;
  const totalDaysEst = dryDaysEst + restDaysEst;
  const totalHoursEst = totalDaysEst * 24;

  // Целевой влагосъём (если не задан — расчётный)
  const targetL = t.targetWaterLiters || yf.totalWaterAvgLiters || 480;

  // Расчёт отдачи по времени (грубая модель, но даёт порядок)
  const progress = Math.min(1, elapsedHours / totalHoursEst);
  const litovPerCycle = targetL * progress;
  const litovPerHour = (elapsedHours > 0.5) ? 
                       (litovPerCycle / elapsedHours) : 0;
  const litovPerDay = litovPerHour * 24;

  // Тренд: сравнить последний час с средним
  // Пока используем плановую скорость как эталон
  const plannedRate = targetL / totalHoursEst;
  let trend = "→ ровно";
  if (litovPerHour > plannedRate * 1.2) trend = "↗ ускоряется";
  else if (litovPerHour < plannedRate * 0.7) trend = "↘ замедляется";

  const percentComplete = Math.round(progress * 100);

  // Осталось до конца (по плану)
  const hoursRemain = Math.max(0, totalHoursEst - elapsedHours);

  return {
    litovPerHour: Math.round(litovPerHour * 10) / 10,
    litovPerDay: Math.round(litovPerDay),
    litovPerCycle: Math.round(litovPerCycle),
    targetLiters: Math.round(targetL),
    percentComplete,
    trend,
    hoursRemain: Math.round(hoursRemain),
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    trendColor: trend === "↗ ускоряется" ? "#2EE59D" : 
                (trend === "↘ замедляется" ? "#FFA726" : "#00E5FF")
  };
}



    function buildMonolithSopHtml(t) {
      const isCoLoad = Boolean(t.coLoadWithVimba);
      const species = FISH_SPECIES[t.speciesKey] || FISH_SPECIES.VIMBA;

      // Строим 5 рядов по 3 тележки (всего 15 тележек)
      const colsHtml = [1, 2, 3, 4, 5].map(rowNum => {
        const c1 = (rowNum - 1) * 3 + 1;
        const c2 = c1 + 1;
        const c3 = c1 + 2;
        const isVimbaZone = isCoLoad && rowNum <= 3;
        const isRoachZone = isCoLoad && rowNum >= 4;
        const colBorder = isCoLoad
          ? (isVimbaZone ? "var(--cyan-dew)" : "var(--coral-danger)")
          : (rowNum <= 2 ? "var(--amber-curing)" : (rowNum === 3 ? "var(--cyan-dew)" : "var(--emerald-optimal)"));
        const colBg = isCoLoad
          ? (isVimbaZone ? "rgba(0, 56, 68, 0.62)" : "rgba(75, 17, 19, 0.62)")
          : "rgba(8, 17, 29, 0.85)";
        const zoneTitle = isCoLoad
          ? (isVimbaZone ? "🐟 Вимба (2 т)" : "⛔ Плотва (1.7 т)")
          : (rowNum <= 2 ? "Напор (Ряд " + rowNum + ")" : (rowNum === 3 ? "🔄 Ось 180°" : "Тыл (Ряд " + rowNum + ")"));
        const actionHint = isCoLoad
          ? (isVimbaZone ? (rowNum <= 2 ? "Рокировка ↔ Ряд 3" : "Рокировка ↔ Ряды 1–2") : "НЕ ИДЕТ ВПЕРЕД! Выгрузка")
          : (rowNum <= 2 ? "Увезти назад → Р4–5" : (rowNum === 3 ? "Разворот 180° на месте" : "Катить вперед → Р1–2"));

        return `
          <div style="flex:1; min-width:112px; background:${colBg}; border:1px solid ${colBorder}; border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:5px;">
            <div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:${colBorder}; text-align:center;">
              РЯД ${rowNum} • ${zoneTitle}
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              ${[c1, c2, c3].map(cartNo => `
                <div style="background:rgba(13,24,40,0.92); border:1px solid rgba(159,179,200,0.28); border-radius:6px; padding:4px 6px; font-family:var(--font-mono); font-size:11px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="color:var(--steel-text-primary); font-weight:700;">Тел. №${cartNo}</span>
                  <span style="color:var(--cyan-dew); font-size:10px;" title="Брюшки рыбы строго влево навстречу потоку">◀🐟 брюшко</span>
                </div>
              `).join("")}
            </div>
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--steel-text-secondary); text-align:center; margin-top:2px;">
              ${actionHint}
            </div>
          </div>
        `;
      }).join("");

      const sopBoxHtml = isCoLoad
        ? `
          <div style="background: rgba(75, 17, 19, 0.78); border: 1.5px solid var(--coral-danger); border-radius: 10px; padding: 12px; margin-top: 10px; font-size: 13px; line-height: 1.5;">
            <div style="font-family: var(--font-display); font-weight: 700; font-size: 14.5px; color: var(--coral-danger); margin-bottom: 4px;">
              ⛔ СОП РОКИРОВКИ «СОВМЕСТНО С ВИМБОЙ» (Вимба 2 т в рядах 1–3 + Плотва 1.7 т в рядах 4–5): ПЛОТВА НИКОГДА НЕ ИДЕТ ВПЕРЕД!
            </div>
            <div>
              • <b>Ряды 1–3 (тележки №1–9, Вимба 2.0 т):</b> рокировка выполняется <b>ТОЛЬКО внутри зоны вимбы (Ряды 1–2 ↔ Ряд 3)</b>.<br/>
              • <b>Ряды 4–5 (тележки №10–15, Плотва 1.7 т):</b> <b style="color: var(--coral-danger);">КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО катить плотву вперед в напорную зону к скосу</b> (иначе пересушка мелкого калибра и сбой гидравлики потока)! При готовности плотвы на 4–5 сутки — выполнить <b>частичную выгрузку задних рядов 4–5</b> и сдвинуть вимбу.
            </div>
          </div>
        `
        : `
          <div style="background: rgba(6, 59, 39, 0.72); border: 1.5px solid var(--emerald-optimal); border-radius: 10px; padding: 12px; margin-top: 10px; font-size: 13px; line-height: 1.5;">
            <div style="font-family: var(--font-display); font-weight: 700; font-size: 14.5px; color: var(--emerald-optimal); margin-bottom: 4px;">
              🔄 СОП СУТОЧНОЙ РОКИРОВКИ (РАЗ В 24Ч • МОНО-ЗАГРУЗКА 15 ТЕЛЕЖЕК 3×5 • ${species.titleRu}, ${t.batchWeightKg} кг):
            </div>
            <div>
              • <b>Шаг 1 (Задние сырые ряды → Вперед):</b> <b>Ряды 4–5 (тележки №10–15)</b> от сеток перекатить вперед к скосу <b>на место Рядов 1–2</b>.<br/>
              • <b>Шаг 2 (Передние подвяленные ряды → Назад):</b> <b>Ряды 1–2 (тележки №1–6)</b> от скоса увезти назад к сеткам <b>на место Рядов 4–5</b>.<br/>
              • <b>Шаг 3 (Центр 180°):</b> Центральный <b>Ряд 3 (тележки №7, 8, 9)</b> — <b style="color: var(--cyan-dew);">развернуть на 180° вокруг своей оси прямо на месте</b>!
            </div>
          </div>
        `;

      return `
        <div class="card card-cyan">
          <div class="row-between" style="margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div class="section-label" style="color: var(--cyan-dew); margin-bottom: 2px;">
                📐 ГЕОМЕТРИЯ МОНОЛИТА (15 ТЕЛЕЖЕК 3×5) И СОП СУТОЧНОЙ РОКИРОВКИ • ПАМЯТКА 8-ГО ШАГА MCGS
              </div>
              <div class="section-sub">
                Аэродинамическая схема расстановки рам SS304, пленумов и регламент суточной перекатки тележек раз в 24ч (${isCoLoad ? 'Режим: Совместно с вимбой' : 'Режим: Моно-загрузка'}).
              </div>
            </div>
            <div class="chip-row">
              <button class="chip ${!isCoLoad ? 'active-emerald' : ''}" onclick="toggleCoLoad(false)">Моно-загрузка (Р4–5 ↔ Р1–2, Р3 180°)</button>
              <button class="chip ${isCoLoad ? 'active-amber' : ''}" onclick="toggleCoLoad(true)">Совместно с вимбой (Вимба Р1–3 + Плотва Р4–5)</button>
            </div>
          </div>

          <!-- Верхняя боковая шторка -->
          <div style="background: rgba(71, 42, 0, 0.55); border: 1px dashed var(--amber-curing); border-radius: 8px; padding: 5px 10px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--amber-curing); margin-bottom: 8px;">
            ⛔ ЛЕВЫЙ/ВЕРХНИЙ БОКОВОЙ КОРИДОР ФИЗИЧЕСКИ ПЕРЕКРЫТ ШТОРКАМИ (нет байпаса воздуха мимо рыбы) • 🐟 БРЮШКИ РЫБЫ ВСЕГДА ВЛЕВО (В ПОТОК)
          </div>

          <!-- Схема: Пленум слева -> 5 рядов по 3 тележки -> Буфер справа -->
          <div style="display: flex; gap: 8px; align-items: stretch; overflow-x: auto; padding-bottom: 4px;">
            <div style="min-width: 115px; background: rgba(0, 56, 68, 0.78); border: 1.5px solid var(--cyan-dew); border-radius: 10px; padding: 10px 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
              <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--cyan-dew);">СЛЕВА У СКОСА</div>
              <div style="font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--steel-text-primary); margin: 4px 0;">ПЛЕНУМ РАЗГОНА<br/>50–70 см</div>
              <div style="font-family: var(--font-mono); font-size: 11px; color: var(--emerald-optimal);">Напор Cantoni ➔<br/>4×3 кВт (30 Гц)</div>
            </div>

            ${colsHtml}

            <div style="min-width: 110px; background: rgba(71, 42, 0, 0.65); border: 1.5px solid var(--amber-curing); border-radius: 10px; padding: 10px 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
              <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--amber-curing);">СПРАВА У СЕТОК</div>
              <div style="font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--steel-text-primary); margin: 4px 0;">БУФЕР<br/>50 см</div>
              <div style="font-family: var(--font-mono); font-size: 11px; color: var(--amber-curing);">➔ Всасывание<br/>AIM AGHD-250ELC</div>
            </div>
          </div>

          <!-- Нижняя боковая шторка -->
          <div style="background: rgba(71, 42, 0, 0.55); border: 1px dashed var(--amber-curing); border-radius: 8px; padding: 5px 10px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--amber-curing); margin-top: 8px;">
            ⛔ ПРАВЫЙ/НИЖНИЙ БОКОВОЙ КОРИДОР ФИЗИЧЕСКИ ПЕРЕКРЫТ ШТОРКАМИ • Весь поток 100% продавливается сквозь монолит 15 тележек (3×5)
          </div>

          ${sopBoxHtml}

          <!-- Памятка по 8-му шагу фиксации (20°C/40% • Фаза 8 MCGS) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-top: 10px;">
            <div style="background: rgba(0, 56, 68, 0.65); border: 1px solid var(--cyan-dew); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; line-height: 1.45;">
              <b style="color: var(--cyan-dew);">✅ КОГДА 8-Й ШАГ ФИКСАЦИИ (20°C/40% • БУФЕР Ф8 MCGS) ОБЯЗАТЕЛЕН:</b><br/>
              • Партия идет <b>под вакуумную упаковку на KOMET PlusVac 25</b> (стабилизация и выравнивание влаги без конденсата и росы в пакете).<br/>
              • <b>Крупный калибр</b> (отборная вимба, лещ 28–30+ см) и закладка на <b>склад / экспорт</b>.
            </div>
            <div style="background: rgba(71, 42, 0, 0.65); border: 1px solid var(--amber-curing); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; line-height: 1.45;">
              <b style="color: var(--amber-curing);">⚠️ КОГДА 8-Й ШАГ ФИКСАЦИИ НУЖНО ОТКЛЮЧИТЬ:</b><br/>
              • <b>Мелкая рыба уже «звенит»</b> (корюшка, мелкая плотва) — лишние часы обдува пересушат хвост.<br/>
              • Требуется <b>мягкая вялка для клиента</b> на развес, либо партия уходит на <b>дозревание в гофрокоробах</b>.
            </div>
          </div>
        </div>
      `;
    }

    // Состояние блока «📷 Фото-Эталон и ИИ-Инспектор среза (Юрмалциемс)»

    function buildPremiumVacuumCalculatorHtml(t) {
      const pcs = Math.max(1, Math.round(Number(t.vacuumPiecesCount || 100)));
      const packMode = t.vacuumPackMode === "SHOP_3PCS" ? "SHOP_3PCS" : "SINGLE_1PC";
      const isShop3Pcs = packMode === "SHOP_3PCS";

      const avgWeightKgPerPiece = 0.30; // ~300 г/шт (в пакете по 3 тушки = ~850–900 г)
      const totalWeightKg = Math.round(pcs * avgWeightKgPerPiece * 10) / 10;
      const packsCount3Pcs = Math.max(1, Math.ceil(pcs / 3.0));

      // Режим 1: Штучная Премиум (по 1 шт, 300 г на подложке) — 0,42 €/шт прямых (42,40 € на 100 шт)
      // Режим 2: Цеховой стандарт Юрмалциемса (По 3 тушки в пакет ~800–900 г в гладком пакете без подложки, укладка в синий изотермический евроконтейнер с прокладкой гофрокартоном)
      // Себестоимость пакета на 3 тушки: гладкий пакет 0,18 € + этикетка 0,06 € + гофрокартон-прокладка в евроконтейнер 0,06 € + работа 0,15 € = 0,45 €/пакет (всего 0,15 €/тушку!)
      const totalPackCostEur = isShop3Pcs ? (packsCount3Pcs * 0.45) : (pcs * 0.424);

      // 1) Общий опт на развес: 10 €/кг * 0.3 кг = 3.00 €/шт (300 € на 100 шт)
      const bulkPricePerPiece = 3.00;
      const bulkRevenueEur = pcs * bulkPricePerPiece;

      // 2) Мелкий опт в вакууме: 6.00 €/шт (или 18.00 € за пакет из 3 тушек ~0.9 кг)
      const smallWholesalePrice = 6.00;
      const smallWholesaleGrossEur = pcs * smallWholesalePrice;
      const smallWholesaleNetAfterPackEur = smallWholesaleGrossEur - totalPackCostEur;
      const smallWholesaleExtraProfitEur = smallWholesaleNetAfterPackEur - bulkRevenueEur;

      // 3) Прямая розница / гастрономия в вакууме: 10.00 €/шт (или 30.00 € за пакет из 3 тушек ~0.9 кг)
      const retailPrice = 10.00;
      const retailGrossEur = pcs * retailPrice;
      const retailNetAfterPackEur = retailGrossEur - totalPackCostEur;
      const retailExtraProfitEur = retailNetAfterPackEur - bulkRevenueEur;

      const fmtEur = val => val.toFixed(2).replace(".", ",") + " €";
      const piecePresets = [50, 100, 250, 500, 1000].map(cnt =>
        `<button class="chip ${pcs === cnt ? 'active-emerald' : ''}" onclick="updateVacuumPiecesCount(${cnt})">${cnt} шт (${Math.round(cnt * 0.3)} кг${isShop3Pcs ? ' • ' + Math.ceil(cnt / 3) + ' пак.' : ''})</button>`
      ).join("");

      const costBreakdownHtml = isShop3Pcs
        ? `
          <div style="background: rgba(0, 56, 68, 0.78); border: 1.5px solid var(--cyan-dew); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-family: var(--font-mono); font-size: 12px; color: var(--steel-text-primary); line-height: 1.5;">
            <b style="color: var(--cyan-dew);">📦 Цеховой стандарт Юрмалциемса (По 3 тушки в пакет ~800–900 г • Всего пакетов: ${packsCount3Pcs} шт):</b><br/>
            Гладкий барьерный пакет PA/PE 90–120 мкм (на 3 тушки): <b>0,18 €</b> • Этикетка: <b>0,06 €</b> • Прокладка гофрокартоном в синий изотермический евроконтейнер (защита от света и проколов): <b>0,06 €</b> • Работа (1 запайка на 3 шт): <b>0,15 €</b> = <b>0,45 €/пакет (всего 0,15 €/тушку!)</b> •
            Итого затраты на ${pcs} тушек (${packsCount3Pcs} пак.): <b style="color: var(--emerald-optimal);">${fmtEur(totalPackCostEur)}</b> (экономия тары в 2,8 раза!)
          </div>
        `
        : `
          <div style="background: rgba(8, 17, 29, 0.88); border: 1px solid var(--steel-border); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-family: var(--font-mono); font-size: 12px; color: var(--steel-text-primary); line-height: 1.5;">
            <b style="color: var(--amber-curing);">📦 Смета штучной Премиум-упаковки (0,42 €/шт прямых + 0,004 € короб = 42,40 € / 100 шт):</b><br/>
            Гладкий вакуум-пакет 90–120 мкм: <b>0,14 €</b> • Этикетка: <b>0,06 €</b> • Подложка золото/серебро: <b>0,10 €</b> • Работа: <b>0,12 €</b> •
            Итого затраты на ${pcs} шт: <b style="color: var(--amber-curing);">${fmtEur(totalPackCostEur)}</b>
          </div>
        `;

      return `
        <div class="card card-cyan" style="border-color: var(--emerald-optimal);">
          <div class="row-between" style="margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div class="section-label" style="color: var(--emerald-optimal); margin-bottom: 2px;">
                💎 КАЛЬКУЛЯТОР ЭКОНОМИКИ ПРЕМИУМ-ВАКУУМА НА KOMET PLUSVAC 25 (1 ШТ ПРЕМИУМ vs ПО 3 ТУШКИ ЦЕХОВОЙ СТАНДАРТ)
              </div>
              <div class="section-sub">
                Переключайте формат фасовки: штучная подарочная на подложке (по 1 шт, 300 г) или цеховой стандарт Юрмалциемса (по 3 тушки ~800–900 г в гладком пакете в синий изотермический евроконтейнер с прокладкой гофрокартоном).
              </div>
            </div>
            <span class="pill-btn pill-emerald" style="cursor:default;">
              ${isShop3Pcs ? `По 3 шт/пакет: 0,45 €/пак (0,15 €/шт)` : `Штучная: 0,42 €/шт (42,40 € / 100 шт)`}
            </span>
          </div>

          <!-- Переключатель формата фасовки -->
          <div style="margin-bottom: 12px;">
            <div style="font-family: var(--font-mono); font-size: 11.5px; color: var(--amber-curing); font-weight: 700; margin-bottom: 6px;">
               ВЫБЕРИТЕ ФОРМАТ ВАКУУМНОЙ ФАСОВКИ НА KOMET PLUSVAC 25:
            </div>
            <div class="chip-row" style="gap: 8px;">
              <button class="chip ${!isShop3Pcs ? 'active-emerald' : ''}" onclick="setVacuumPackMode('SINGLE_1PC')" style="flex: 1; text-align: left; padding: 9px 12px;">
                💎 Штучная Премиум (по 1 шт, 300 г на подложке золото/серебро)
              </button>
              <button class="chip ${isShop3Pcs ? 'active-cyan' : ''}" onclick="setVacuumPackMode('SHOP_3PCS')" style="flex: 1.4; text-align: left; padding: 9px 12px;">
                📦 Цеховой стандарт: По 3 тушки в пакет (~800–900 г в гладком пакете, укладка в синий изотермический евроконтейнер с прокладкой гофрокартоном от света и проколов)
              </button>
            </div>
          </div>

          <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
            <div class="field-box" style="flex:1; min-width:220px;">
              <label>Количество тушек в партии (шт, средн. вес 300 г/шт)</label>
              <input type="number" class="field-input" value="${pcs}" min="10" max="50000" step="10" onchange="updateVacuumPiecesCount(this.value)" />
            </div>
            <button class="step-btn" style="width:48px; height:42px; margin-top:16px;" onclick="updateVacuumPiecesCount(${Math.max(10, pcs - 50)})">−50</button>
            <button class="step-btn" style="width:48px; height:42px; margin-top:16px;" onclick="updateVacuumPiecesCount(${pcs + 50})">+50</button>
            <div style="font-family:var(--font-mono); font-size:12.5px; color:var(--cyan-dew); margin-top:14px; padding:8px 12px; background:rgba(0,56,68,0.65); border-radius:8px; border:1px solid var(--cyan-dew);">
              Вес партии: <b>${String(totalWeightKg).replace(".", ",")} кг</b> (${pcs} тушек${isShop3Pcs ? ` = <b>${packsCount3Pcs} пакетов по 3 шт (~850–900 г)</b>` : ` × 0,30 кг`})
            </div>
          </div>

          <div class="chip-row" style="margin-bottom: 12px;">${piecePresets}</div>

          ${costBreakdownHtml}

          <!-- Сравнение 3 каналов продаж -->
          <div class="hud-grid" style="margin-bottom: 12px;">
            <div class="metric-tile" style="border-color: var(--steel-border); background: rgba(8, 17, 29, 0.78);">
              <div class="m-label">1. В ОБЩЕМ ОПТЕ НА РАЗВЕС (10 €/КГ)</div>
              <div class="m-val" style="font-size: 19px; color: var(--steel-text-primary);">${fmtEur(bulkRevenueEur)}</div>
              <div class="m-sub">По <b>3,00 €/шт</b> (${isShop3Pcs ? '9,00 € за 3 тушки' : '0,3 кг × 10 €/кг'}) • База сравнения</div>
            </div>

            <div class="metric-tile" style="border-color: var(--cyan-dew); background: rgba(0, 56, 68, 0.72);">
              <div class="m-label" style="color: var(--cyan-dew);">2. МЕЛКИЙ ОПТ В ВАКУУМЕ (${isShop3Pcs ? '18,00 €/ПАК 3 ШТ' : '6,00 €/ШТ'})</div>
              <div class="m-val" style="font-size: 19px; color: var(--cyan-dew);">+${fmtEur(smallWholesaleExtraProfitEur)} чистыми</div>
              <div class="m-sub" style="color: var(--steel-text-primary);">Чистая выручка: <b>${fmtEur(smallWholesaleNetAfterPackEur)}</b> (Вал: ${fmtEur(smallWholesaleGrossEur)})</div>
            </div>

            <div class="metric-tile" style="border-color: var(--emerald-optimal); background: rgba(6, 59, 39, 0.78);">
              <div class="m-label" style="color: var(--emerald-optimal);">3. ПРЯМАЯ РОЗНИЦА В ВАКУУМЕ (${isShop3Pcs ? '30,00 €/ПАК 3 ШТ' : '10,00 €/ШТ'})</div>
              <div class="m-val" style="font-size: 19px; color: var(--emerald-optimal);">+${fmtEur(retailExtraProfitEur)} чистыми</div>
              <div class="m-sub" style="color: var(--steel-text-primary);">Чистая выручка: <b>${fmtEur(retailNetAfterPackEur)}</b> (Вал: ${fmtEur(retailGrossEur)})</div>
            </div>
          </div>

          <!-- Протокол KOMET PlusVac 25 и памятка дооснащения газом (MAP) за ~150 € -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
            <div style="background: rgba(6, 59, 39, 0.68); border: 1px solid var(--emerald-optimal); border-radius: 10px; padding: 11px 13px; font-size: 12.5px; line-height: 1.48;">
              <b style="color: var(--emerald-optimal);">🛡 ЦЕХОВОЙ ПРОТОКОЛ KOMET PlusVac 25 (ЮРМАЛЦИЕМС • ПО 3 ТУШКИ И ШТУЧНО):</b><br/>
              • <b>Soft Vac 95–96%:</b> мягкий недотянутый вакуум, чтобы <b>не раздавило икряное брюшко и не выдавило жир</b> из тушки!<br/>
              • <b>Фасовка по 3 тушки (~800–900 г):</b> укладывать в гладкий пакет вальтом (спинка к брюшку), предварительно <b>подрезав острые лучи плавников на 2–3 мм</b>.<br/>
              • <b>Тара цеха:</b> укладка пакетов в <b>синий изотермический евроконтейнер с прокладкой каждого слоя гофрокартоном</b> — 100% защита от окисления жира светом и от проколов пленки при перевозке (хранение 0..+4°C).
            </div>
            <div style="background: rgba(0, 56, 68, 0.68); border: 1px solid var(--cyan-dew); border-radius: 10px; padding: 11px 13px; font-size: 12.5px; line-height: 1.48;">
              <b style="color: var(--cyan-dew);">🔧 ПАМЯТКА: ДООСНАЩЕНИЕ ГАЗОМ (MAP) СВОИМИ РУКАМИ ЗА ~150 €:</b><br/>
              • Наш <b>KOMET PlusVac 25 (Арт. 3150049, 2026 г.)</b> поставляется без заводской газовой рампы, но электронная плата <b>Comfort уже имеет штатный выход управления впрыском газа</b>!<br/>
              • Для самостоятельного дооснащения MAP за <b>~150 €</b>: установить <b>соленоид Camozzi / Festo</b>, пищевой редуктор на баллон (смесь N₂/CO₂) и форсунки, подключив катушку клапана к штатному выходу платы <b>Comfort</b>.
            </div>
          </div>
        </div>
      `;
    }


    // ==================== ИНТЕРАКТИВНЫЙ БЛОК «📷 ФОТО-ЭТАЛОН И ИИ-ИНСПЕКТОР СРЕЗА (ЮРМАЛЦИЕМС)» ====================
    const SLICE_CHECKLIST_ITEMS = [
      {
        title: "1. Рубиновая / янтарно-стекловидная спинка (балык на просвет)",
        desc: "Мышца спинки плотная, полупрозрачная («рубиново-стекловидный балык» у окуня / «янтарная слеза» у вимбы), без белесых сырых пятен у позвоночника."
      },
      {
        title: "2. Отсутствие белого сухого кольца закала (Case Hardening)",
        desc: "По периметру под панцирной чешуей нет пересушенной белой корки (мягкий старт rH ≥ 60–65% на Ст.1 и паузы ≤ 1.5–2 ч отработаны штатно)."
      },
      {
        title: "3. Зернистость и провяленность розового ястыка икры (36–48 ч на Ст.4)",
        desc: "Розовый ястык икры в плотной пленке отдает влагу медленнее спинки — выдержано 36–48 ч на Стадии 4 в закрытой камере (13–15°C, 1ч/4ч) для перетока влаги из ядра икры в мышцу."
      },
      {
        title: "4. Отсутствие росы в вакуум-пакете и укладка в евроконтейнер с картоном",
        desc: "Тушка охлаждена до 13–15°C перед KOMET PlusVac 25 (Soft Vac 95–96%): внутри гладкого пакета (по 3 тушки ~800–900 г) сухо, укладка в синий изотермический евроконтейнер с прокладкой гофрокартоном."
      }
    ];

    function selectSliceReferenceMode(mode) {
      sliceInspectorState.refMode = mode === "VIMBA_PACK_3PCS" ? "VIMBA_PACK_3PCS" : "PERCH_SLICE";
      renderAll();
    }

    function toggleSliceChecklistItem(idx) {
      sliceInspectorState.checks[idx] = !sliceInspectorState.checks[idx];
      sliceInspectorState.aiVerdictHtml = null;
      renderAll();
    }

    function handleSlicePhotoUpload(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const dataUrl = String(evt.target.result || "");
        const commaIdx = dataUrl.indexOf(",");
        sliceInspectorState.imageDataUrl = dataUrl;
        sliceInspectorState.base64Data = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : null;
        sliceInspectorState.mimeType = file.type || "image/jpeg";
        sliceInspectorState.fileName = file.name;
        sliceInspectorState.fileSizeKb = Math.max(1, Math.round(file.size / 1024));
        sliceInspectorState.aiVerdictHtml = null;
        renderAll();
        showToast(`Фото загружено для инспекции: ${file.name} (${sliceInspectorState.fileSizeKb} КБ)`);
      };
      reader.readAsDataURL(file);
    }

    function clearSlicePhoto() {
      sliceInspectorState.imageDataUrl = null;
      sliceInspectorState.base64Data = null;
      sliceInspectorState.fileName = null;
      sliceInspectorState.fileSizeKb = 0;
      sliceInspectorState.aiVerdictHtml = null;
      const inp = document.getElementById("slice-photo-input");
      if (inp) inp.value = "";
      renderAll();
      showToast("Фото сброшено к эталонной схеме среза Юрмалциемса");
    }

    function buildLocalSliceExpertVerdict() {
      const checks = sliceInspectorState.checks;
      const passedCount = checks.filter(Boolean).length;
      const hasPhoto = Boolean(sliceInspectorState.fileName);
      const photoNote = hasPhoto ? `По загруженному снимку <b>${sliceInspectorState.fileName}</b> (${sliceInspectorState.fileSizeKb} КБ)` : "По контрольному чек-листу цеха Юрмалциемс";

      if (passedCount === 4) {
        return `
          <div style="background:rgba(6, 59, 39, 0.78); border:1.5px solid var(--emerald-optimal); border-radius:10px; padding:12px; font-size:13px; line-height:1.5;">
            <b style="color:var(--emerald-optimal); font-size:14px;">✅ ЗАКЛЮЧЕНИЕ ИНСПЕКТОРА СРЕЗА (4/4 КРИТЕРИЕВ ВЫПОЛНЕНО — ЭТАЛОН ЮРМАЛЦИЕМСА):</b><br/>
            ${photoNote}: срез демонстрирует <b>рубиново- / янтарно-стекловидный балык спинки</b> без белого сухого кольца закала под панцирной чешуей. Розовый ястык икры в плотной пленке равномерно отдал избыточную влагу в мышечную ткань за <b>36–48 ч Стадии 4 в закрытой камере (13–15°C, цикл 1ч/4ч на 25.3 Гц)</b>. Охлаждение тушки до 13–15°C полностью исключило выпадение росы внутри гладкого вакуум-пакета <b>KOMET PlusVac 25 (Soft Vac 95–96%)</b>. Партия допущена к фасовке (по 3 тушки ~800–900 г в синий изотермический евроконтейнер с прокладкой гофрокартоном)!
          </div>
        `;
      }

      const issues = [];
      if (!checks[0]) issues.push("• <b>Спинка непрозрачная / матовая:</b> недотянута влага у хребта на Стадии 3 — добавьте 1–2 цикла дожима (2.5 ч сушка 30 Гц / 2.0 ч пауза) до выхода полки на 50–54% rH.");
      if (!checks[1]) issues.push("• <b>Обнаружено белое кольцо закала под чешуей:</b> на старте Стадии 1 влажность падала ниже 60% rH или ΔT чешуи по пирометру ИК-пирометр шкуры < 0.4°C. Увеличьте время выравнивания на Стадии 4 (1ч/4ч при 13–15°C).");
      if (!checks[2]) issues.push("• <b>Ястык икры сыроват в центре:</b> плотная пленка ястыка икряного окуня отдает влагу медленнее спинки! Обязательно продлите <b>Стадию 4 в закрытой камере (13–15°C, 1ч осушение / 4ч отдых) до 36–48 часов</b> для полного перетока влаги из ядра икры в мышцу перед вакуумом.");
      if (!checks[3]) issues.push("• <b>Конденсат / роса в вакуум-пакете или риск прокола:</b> рыба пошла в вакуум теплой (>15.5°C) или без отволаживания в закрытой камере. Охладите тушку до 13–15°C, подрежьте плавники на 2–3 мм, держите Soft Vac 95–96% и прокладывайте ряды в синем евроконтейнере гофрокартоном!");

      return `
        <div style="background:rgba(71, 42, 0, 0.78); border:1.5px solid var(--amber-curing); border-radius:10px; padding:12px; font-size:13px; line-height:1.5;">
          <b style="color:var(--amber-curing); font-size:14px;">⚠️ ЗАКЛЮЧЕНИЕ ИНСПЕКТОРА СРЕЗА (ВЫПОЛНЕНО ${passedCount}/4 КРИТЕРИЕВ — ТРЕБУЕТСЯ КОРРЕКТИРОВКА):</b><br/>
          ${photoNote} выявлены отклонения:<br/>
          ${issues.join("<br/>")}
        </div>
      `;
    }

    function sanitizeGeminiApiKey(rawKey) {
      return String(rawKey || "")
        .replace(/^["'\s]+|["'\s]+$/g, "")
        .replace(/^(Bearer\s+|key=)/i, "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim();
    }

    async function callGeminiApiWithFallback(apiKey, parts, preferredModel) {
      const cleanKey = sanitizeGeminiApiKey(apiKey);
      const modelCandidates = [...new Set([
        preferredModel,
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
      ].filter(Boolean))];

      // Приводим parts к универсальному виду (inlineData + role: "user"), совместимому и с generativelanguage.googleapis.com, и с aiplatform.googleapis.com (для ключей AQ.Ab8RN...)
      const normalizedParts = (parts || []).map(p => {
        if (p.inline_data) {
          return {
            inlineData: {
              mimeType: p.inline_data.mime_type || "image/jpeg",
              data: p.inline_data.data
            }
          };
        }
        return p;
      });

      const isAqScopedKey = /^AQ\./i.test(cleanKey);
      const endpointBuilders = isAqScopedKey
        ? [
            m => ({
              label: `${m} (aiplatform v1)`,
              url: `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent`,
              baseUrl: `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent`
            }),
            m => ({
              label: `${m} (aiplatform v1beta1)`,
              url: `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${m}:generateContent`,
              baseUrl: `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${m}:generateContent`
            }),
            m => ({
              label: `${m} (generativelanguage v1beta)`,
              url: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
              baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`
            })
          ]
        : [
            m => ({
              label: `${m} (generativelanguage v1beta)`,
              url: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
              baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`
            }),
            m => ({
              label: `${m} (generativelanguage v1)`,
              url: `https://generativelanguage.googleapis.com/v1/models/${m}:generateContent`,
              baseUrl: `https://generativelanguage.googleapis.com/v1/models/${m}:generateContent`
            }),
            m => ({
              label: `${m} (aiplatform v1)`,
              url: `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent`,
              baseUrl: `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent`
            })
          ];

      let lastServerErrorMsg = "";
      let triedModelsLog = [];

      const bodyPayload = JSON.stringify({
        contents: [{ role: "user", parts: normalizedParts }]
      });

      for (const modelName of modelCandidates) {
        for (const buildEp of endpointBuilders) {
          const ep = buildEp(modelName);
          try {
            const resp = await fetch(ep.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": cleanKey
              },
              body: bodyPayload
            });

            const data = await resp.json().catch(() => ({}));
            const apiErrorObj = Array.isArray(data) ? data[0]?.error : data?.error;
            if (!resp.ok || apiErrorObj) {
              const errMsg = apiErrorObj?.message || `HTTP ${resp.status} (${resp.statusText || "Error"})`;
              lastServerErrorMsg = errMsg;
              triedModelsLog.push(`${ep.label} -> ${resp.status}`);
              continue;
            }

            const candidateRoot = Array.isArray(data) ? data[0] : data;
            const replyText = (candidateRoot?.candidates?.[0]?.content?.parts || [])
              .map(p => p.text || "")
              .join("")
              .trim();

            if (replyText) {
              return { text: replyText, modelUsed: modelName };
            } else {
              lastServerErrorMsg = "Пустой ответ от модели " + ep.label;
            }
          } catch (netErr) {
            lastServerErrorMsg = netErr?.message || "Ошибка сетевого соединения с сервером Google API";
            triedModelsLog.push(`${ep.label} -> network_error`);
          }
        }
      }

      const err = new Error(lastServerErrorMsg || "Не удалось получить ответ от моделей Gemini");
      err.triedModels = triedModelsLog.join(", ");
      throw err;
    }

export {
  calculateRegnaultPsychrometer,
  calculateYieldForecast,
  targetTempRangeFor,
  buildMonolithSopHtml,
  buildPremiumVacuumCalculatorHtml,
  handleSlicePhotoUpload,
  sanitizeGeminiApiKey,
  callGeminiApiWithFallback
};

if (typeof window !== "undefined") {
  window.analyzeBioscience = analyzeBioscience;
  window.calculateRegnaultPsychrometer = calculateRegnaultPsychrometer;
  window.calculateYieldForecast = calculateYieldForecast;
  window.targetTempRangeFor = targetTempRangeFor;
  window.buildMonolithSopHtml = buildMonolithSopHtml;
  window.buildPremiumVacuumCalculatorHtml = buildPremiumVacuumCalculatorHtml;
  window.clearBioscienceCache = clearBioscienceCache;
  window.getBioscienceCacheStats = getBioscienceCacheStats;
  window.handleSlicePhotoUpload = handleSlicePhotoUpload;
  window.sanitizeGeminiApiKey = sanitizeGeminiApiKey;
  window.computeWaterLossRate = computeWaterLossRate;
  window.callGeminiApiWithFallback = callGeminiApiWithFallback;
}

