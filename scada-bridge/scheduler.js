// Планировщик рецептов («внешний мозг»). Чистая логика без сети: по времени от старта партии
// определяет стадию, фазу РАБОТА/ПАУЗА и уставки; защиты (оттайка, перегрев, датчик влажности, связь).
// Положение в цикле считается от отметки времени старта, поэтому перезапуск сервера или закрытие
// браузера цикл не сбивает: после рестарта планировщик сразу знает, где он.
"use strict";

const H = 3600000;

function recipeTotalH(r) { return r.stages.reduce((s, x) => s + x.hours, 0); }

// где мы в рецепте через elapsedMs
function position(recipe, elapsedMs) {
  let t = Math.max(0, elapsedMs) / H;
  for (let i = 0; i < recipe.stages.length; i++) {
    const st = recipe.stages[i];
    if (t < st.hours) {
      if (st.holdOnly) return { stageIndex: i, stage: st, phase: "HOLD", phaseLeftH: st.hours - t, stageLeftH: st.hours - t };
      const per = st.workH + st.pauseH;
      const pos = t % per;
      const work = pos < st.workH;
      // хвост стадии: если цикл не успевает закончиться — режем по границе стадии
      const phaseLeft = Math.min(work ? st.workH - pos : per - pos, st.hours - t);
      return { stageIndex: i, stage: st, phase: work ? "WORK" : "PAUSE", phaseLeftH: phaseLeft, stageLeftH: st.hours - t, cycleNo: Math.floor(t / per) + 1 };
    }
    t -= st.hours;
  }
  return { stageIndex: recipe.stages.length, stage: recipe.hold, phase: "HOLD", phaseLeftH: Infinity, stageLeftH: Infinity, finished: true };
}

// уставки для позиции; manual — ручное переопределение технолога (фаза и/или частота) с истечением
function targets(recipe, pos, cfg, overrides) {
  const st = pos.stage;
  let t;
  if (pos.phase === "HOLD") t = { phase: "HOLD", tempC: st.tempC, humi: st.humi || 61, hz: st.hz || 16 };
  else if (pos.phase === "WORK") t = { phase: "WORK", tempC: st.tempC, humi: 20, hz: st.workHz };
  else t = { phase: "PAUSE", tempC: +(st.tempC + (cfg.pauseTempOffsetC || 0)).toFixed(1), humi: 95, hz: st.pauseHz };
  const now = Date.now();
  const o = overrides || {};
  if (o.phase && o.phaseUntil > now && pos.phase !== "HOLD") {
    t = o.phase === "WORK"
      ? { phase: "WORK", tempC: st.tempC, humi: 20, hz: st.workHz }
      : { phase: "PAUSE", tempC: +(st.tempC + (cfg.pauseTempOffsetC || 0)).toFixed(1), humi: 95, hz: st.pauseHz };
    t.manual = true;
  }
  if (o.defrostUntil > now) { t = { phase: "DEFROST", tempC: t.tempC, humi: 95, hz: cfg.protection.defrostHz }; t.protection = "Оттайка испарителя"; }
  if (o.hz && o.hzUntil > now && !t.protection) { t.hz = o.hz; t.manualHz = true; }
  // жёсткие пределы
  const L = cfg.limits;
  t.hz = Math.min(L.hzMax, Math.max(L.hzMin, Number(t.hz) || L.hzMin));
  t.tempC = Math.min(L.tempMaxC, Math.max(L.tempMinC, Number(t.tempC)));
  t.maxTempC = st.maxTempC;
  return t;
}

// защиты по живым данным; возвращает новые тревоги и обновляет overrides (оттайка)
function protect(readings, cfg, prot, overrides, pos) {
  const now = Date.now();
  const alarms = [];
  const P = cfg.protection;
  // 1) обмерзание испарителя: < −3°C дольше 15 мин → пауза-оттайка 20 мин на 30 Гц
  const coil = [readings.dehumicoil1, readings.dehumicoil2].filter((v) => Number.isFinite(v));
  const cold = coil.length && Math.min(...coil) < P.dehumicoilMinC;
  if (cold) { if (!prot.coldSince) prot.coldSince = now; }
  else prot.coldSince = 0;
  if (prot.coldSince && now - prot.coldSince >= P.dehumicoilMinutes * 60000 && !(overrides.defrostUntil > now)) {
    overrides.defrostUntil = now + P.defrostMinutes * 60000;
    prot.coldSince = 0;
    alarms.push({ level: "warn", code: "DEFROST", text: `Испаритель ${Math.min(...coil).toFixed(1)}°C ниже ${P.dehumicoilMinC}°C более ${P.dehumicoilMinutes} мин — пауза-оттайка ${P.defrostMinutes} мин на ${P.defrostHz} Гц` });
  }
  // 2) перегрев камеры выше лимита стадии
  if (Number.isFinite(readings.dryTemp) && pos && pos.stage && pos.stage.maxTempC && readings.dryTemp > pos.stage.maxTempC) {
    alarms.push({ level: "crit", code: "OVERHEAT", text: `Камера +${readings.dryTemp.toFixed(1)}°C выше лимита стадии ${pos.stage.maxTempC}°C («${pos.stage.name}»)` });
  }
  // 3) датчик влажности −999 → работаем по таймеру (планировщик и так по таймеру), тревога
  if (Number.isFinite(readings.dryHumi) && readings.dryHumi <= -900) {
    alarms.push({ level: "crit", code: "HUMI_FAULT", text: "Dry humi fault (−999%) — датчик влажности камеры неисправен, цикл идёт по таймеру" });
  }
  return alarms;
}

module.exports = { position, targets, protect, recipeTotalH, H };
