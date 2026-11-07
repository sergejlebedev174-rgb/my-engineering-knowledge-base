// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 4: SCADA МНЕМОСХЕМА, ПРИБОРЫ, ГРАФИКИ И СИРЕНА (ES Module)
// ==========================================================================

import {
  FISH_SPECIES,
  CURING_STAGES,
  HEAT_RECOVERY_MODES,
  SAMPLE_PRESETS
} from './constants.js';

import {
  state,
  triggerHaptic,
  showToast,
  persistStateToStorage,
  activeParksideAnalysis
} from './state.js';

import {
  analyzeBioscience,
  targetTempRangeFor,
  calculateRegnaultPsychrometer
} from './bioscience.js';

let lastPhaseCycleIndex = null;
function announcePhaseChangeIfEnabled(isPause, isStart) {}

    function renderPhaseTimerHud() {
      const t = state.telemetry;
      const stage = CURING_STAGES[t.stageKey] || CURING_STAGES.STAGE_2;
      const phaseDurHours = t.isPausePhaseNow ? stage.defaultPauseHours : stage.defaultWorkHours;
      const phaseDurMs = Math.max(60000, phaseDurHours * 3600 * 1000);
      const nowMs = Date.now();
      if (!t.phaseStartTimestampMs || typeof t.phaseStartTimestampMs !== "number" || t.phaseStartTimestampMs > nowMs + 60000) {
        t.phaseStartTimestampMs = nowMs;
      }

      const elapsedMs = Math.max(0, nowMs - t.phaseStartTimestampMs);
      const cycleIndex = Math.floor(elapsedMs / phaseDurMs);
      if (lastPhaseCycleIndex !== null && cycleIndex > lastPhaseCycleIndex) {
        lastPhaseCycleIndex = cycleIndex;
        t.isPausePhaseNow = !t.isPausePhaseNow;
        t.phaseStartTimestampMs = nowMs;
        persistStateToStorage();
        announcePhaseChangeIfEnabled(t.isPausePhaseNow, false);
      } else {
        lastPhaseCycleIndex = cycleIndex;
      }

      const remainMs = Math.max(0, phaseDurMs - (elapsedMs % phaseDurMs));
      const progressFrac = Math.max(0, Math.min(1, (elapsedMs % phaseDurMs) / phaseDurMs));
      const nextSwitchDate = new Date(nowMs + remainMs);

      const pad = n => String(Math.floor(n)).padStart(2, "0");
      const remH = Math.floor(remainMs / 3600000);
      const remM = Math.floor((remainMs % 3600000) / 60000);
      const remS = Math.floor((remainMs % 60000) / 1000);
      const nextTimeStr = `${pad(nextSwitchDate.getHours())}:${pad(nextSwitchDate.getMinutes())}`;
      const countdownStr = `${pad(remH)}:${pad(remM)}:${pad(remS)}`;

      // Обновление кругового светового кольца-таймера на табло руководителя (если открыто)
      const ownerArc = document.getElementById("owner-phase-ring-arc");
      const ownerTime = document.getElementById("owner-phase-ring-time");
      const ownerNext = document.getElementById("owner-phase-ring-next");
      if (ownerArc) {
        const circum = 2 * Math.PI * 82; // r=82 -> 515.2
        const dash = ((1 - progressFrac) * circum).toFixed(1);
        ownerArc.setAttribute("stroke-dasharray", `${dash} ${circum.toFixed(1)}`);
      }
      if (ownerTime) ownerTime.textContent = countdownStr;
      if (ownerNext) ownerNext.textContent = `Смена фазы в ${nextTimeStr}`;

      const titleEl = document.getElementById("hud-timer-title");
      const mainEl = document.getElementById("hud-timer-main");
      const subEl = document.getElementById("hud-timer-sub");
      const boxEl = document.getElementById("hud-phase-timer-box");
      if (!titleEl || !mainEl || !subEl || !boxEl) return;

      const currentLabel = t.isPausePhaseNow
        ? `ПАУЗА / ОТДЫХ (${stage.pauseFreqLabel} • норма ${phaseDurHours} ч)`
        : `СУШКА (${stage.activeFreqHz} Гц • норма ${phaseDurHours} ч)`;
      const nextLabel = t.isPausePhaseNow ? "переключение на СУШКУ" : "переключение на ОТДЫХ (ПАУЗУ)";

      titleEl.textContent = `⏱ ТАЙМЕР ФАЗЫ: ${t.isPausePhaseNow ? 'ОТДЫХ (ПАУЗА)' : 'АКТИВНАЯ СУШКА'} • СЛЕДУЮЩАЯ СМЕНА В ${nextTimeStr}`;
      titleEl.style.color = t.isPausePhaseNow ? "var(--amber-curing)" : "var(--emerald-optimal)";
      boxEl.style.borderColor = t.isPausePhaseNow ? "rgba(255, 167, 38, 0.55)" : "rgba(0, 230, 118, 0.55)";
      mainEl.textContent = `${currentLabel} → Смена фазы в ${nextTimeStr} (осталось ${countdownStr})`;
      subEl.textContent = `Регламент Ст.${stage.number}: ${stage.defaultWorkHours} ч Сушка / ${stage.defaultPauseHours} ч Отдых (${nextLabel} в ${nextTimeStr})`;
    }

    function resetPhaseTimerNow() {
      state.telemetry.phaseStartTimestampMs = Date.now();
      lastPhaseCycleIndex = 0;
      persistStateToStorage();
      renderPhaseTimerHud();
      showToast("Таймер текущей фазы перезапущен с текущего момента");
    }


    // ==================== 4a. SCADA БЛОК 1: АНИМИРОВАННАЯ SVG-МНЕМОСХЕМА РИЖСКОЙ КАМЕРЫ (CLOSED LOOP) ====================
    function renderScadaChamberMimicSvg(t, stage, species, diag) {
      const wrap = document.getElementById("scada-chamber-mimic-svg-wrap");
      if (!wrap) return;

      const isPause = Boolean(t.isPausePhaseNow);
      const isStage4 = stage.key === "STAGE_4";
      const fanSpeedClass = isPause ? "scada-fan-slow" : (isStage4 ? "scada-fan-med" : "scada-fan-fast");
      const flowSpeedClass = isPause ? "scada-flow-slow" : "scada-flow-fast";
      const fanColor = isPause ? "#FFA726" : "#2EE59D";
      const flowColor = isPause ? "#FFA726" : "#00E5FF";
      const activeFreqStr = isPause
        ? `${stage.pauseFreqLabel} (${stage.pauseVoltageLabel})`
        : `${stage.activeFreqHz} Гц (${stage.activeVoltageV}V)`;
      const airVelStr = isPause ? "0.6–0.8 м/с (Ламинарный отдых)" : (isStage4 ? "2.1 м/с (Бережный)" : "2.8–3.2 м/с (Турбулентный срыв)");
      const coilColor = (t.dehumicoilTempC >= 4.5 && t.dehumicoilTempC <= 5.8) ? "#00E5FF" : (t.dehumicoilTempC < 1.5 ? "#FF5252" : "#FFA726");
      const eevInWin = t.eev1Steps >= 205 && t.eev1Steps <= 480;
      const eevCol = t.eev1Steps < 75 ? "#FF5252" : (eevInWin ? "#2EE59D" : "#FFA726");
      const isWinter = (t.heatRecoveryMode || "WINTER_14KW") === "WINTER_14KW";
      const c2Active = Number(t.activeCircuitsRunning) === 2;

      const btnDry = document.getElementById("scada-btn-dry");
      const btnPause = document.getElementById("scada-btn-pause");
      const btnCirc = document.getElementById("scada-btn-circuits");
      const mainLed = document.getElementById("scada-main-led");
      if (btnDry) {
        btnDry.className = isPause ? "pill-btn pill-cyan" : "pill-btn pill-emerald";
        btnDry.style.opacity = isPause ? "0.72" : "1";
      }
      if (btnPause) {
        btnPause.className = isPause ? "pill-btn pill-amber" : "pill-btn pill-cyan";
        btnPause.style.opacity = isPause ? "1" : "0.72";
      }
      if (btnCirc) {
        btnCirc.textContent = `❄ Контуры R410A: ${t.activeCircuitsRunning}/2`;
        btnCirc.className = c2Active ? "pill-btn pill-emerald" : "pill-btn pill-cyan";
      }
      if (mainLed) {
        mainLed.className = `scada-led ${diag.caseHardeningRisk === "CRITICAL" || t.eev1Steps < 75 ? "scada-led-coral" : (isPause ? "scada-led-amber" : "scada-led-emerald")}`;
      }

      // 4 вентилятора Cantoni 3 кВт по вертикали слева (Y = 78, 134, 190, 246)
      const fansSvg = [78, 134, 190, 246].map((cy, idx) => `
        <g transform="translate(86, ${cy})">
          <circle cx="0" cy="0" r="23" fill="#0B192C" stroke="${fanColor}" stroke-width="2" />
          <circle cx="0" cy="0" r="19" fill="none" stroke="rgba(0,229,255,0.22)" stroke-dasharray="3,3" />
          <g class="scada-fan-rotor ${fanSpeedClass}">
            <path d="M0,0 C-5,-15 5,-15 0,0 M0,0 C13,-7 8,4 0,0 M0,0 C13,8 3,14 0,0 M0,0 C5,15 -5,15 0,0 M0,0 C-13,7 -8,-4 0,0 M0,0 C-13,-8 -3,-14 0,0"
                  fill="${fanColor}" stroke="${fanColor}" stroke-width="4.2" stroke-linecap="round" />
            <line x1="-15" y1="0" x2="15" y2="0" stroke="${fanColor}" stroke-width="2.4" />
            <line x1="0" y1="-15" x2="0" y2="15" stroke="${fanColor}" stroke-width="2.4" />
            <line x1="-11" y1="-11" x2="11" y2="11" stroke="${fanColor}" stroke-width="1.8" />
            <line x1="-11" y1="11" x2="11" y2="-11" stroke="${fanColor}" stroke-width="1.8" />
          </g>
          <circle cx="0" cy="0" r="5" fill="#08111D" stroke="#F0F6FC" stroke-width="1.5" />
          <text x="-32" y="4" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="end">M${idx + 1}</text>
        </g>
      `).join("");

      // 5 рядов тележек SS304 с рыбой (X = 248, 326, 404, 482, 560)
      const cartsSvg = [0, 1, 2, 3, 4].map(colIdx => {
        const x = 242 + colIdx * 78;
        const rowNum = colIdx + 1;
        const isVimbaCo = t.coLoadWithVimba && rowNum <= 3;
        const isRoachCo = t.coLoadWithVimba && rowNum >= 4;
        const frameStroke = t.coLoadWithVimba
          ? (isVimbaCo ? "#00E5FF" : "#FF5252")
          : (rowNum === 3 ? "#00E5FF" : "rgba(159,179,200,0.55)");
        const rowTag = t.coLoadWithVimba
          ? (isVimbaCo ? `Р${rowNum} Вимба` : `Р${rowNum} Плотва`)
          : (rowNum === 3 ? `Р3 (180°)` : `Ряд ${rowNum}`);
        return `
          <g transform="translate(${x}, 66)">
            <rect x="0" y="0" width="64" height="184" rx="6" fill="rgba(13, 27, 46, 0.86)" stroke="${frameStroke}" stroke-width="1.5" />
            <text x="32" y="14" fill="${frameStroke}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">${rowTag}</text>
            <line x1="4" y1="20" x2="60" y2="20" stroke="rgba(159,179,200,0.28)" stroke-width="1" />
            <!-- 3 яруса вешал SS304 с рыбой брюшком влево в поток -->
            ${[42, 92, 142].map((ry, tierIdx) => `
              <line x1="6" y1="${ry - 12}" x2="58" y2="${ry - 12}" stroke="#9FB3C8" stroke-width="1.2" />
              <g transform="translate(12, ${ry})">
                <ellipse cx="8" cy="4" rx="5.5" ry="13" fill="rgba(0, 229, 255, 0.25)" stroke="#00E5FF" stroke-width="1.2" />
                <polygon points="8,17 4,23 12,23" fill="#00E5FF" />
                <ellipse cx="22" cy="4" rx="5.5" ry="13" fill="rgba(46, 229, 157, 0.25)" stroke="#2EE59D" stroke-width="1.2" />
                <polygon points="22,17 18,23 26,23" fill="#2EE59D" />
                <ellipse cx="36" cy="4" rx="5.5" ry="13" fill="rgba(255, 167, 38, 0.25)" stroke="#FFA726" stroke-width="1.2" />
                <polygon points="36,17 32,23 40,23" fill="#FFA726" />
              </g>
            `).join("")}
            <text x="32" y="177" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">SS304 #${colIdx * 3 + 1}..${colIdx * 3 + 3}</text>
          </g>
        `;
      }).join("");

      // Стрелки одностороннего потока воздуха сквозь пленум, тележки SS304 и буфер к испарителю 1#Dehumicoil
      const streamlinesSvg = [86, 134, 182, 230].map((sy, idx) => `
        <path d="M 120 ${sy} L 690 ${sy}" fill="none" stroke="${flowColor}" stroke-width="2.4" stroke-opacity="0.82" class="${flowSpeedClass}" />
        <polygon points="225,${sy} 215,${sy - 4.5} 215,${sy + 4.5}" fill="${flowColor}" />
        <polygon points="395,${sy} 385,${sy - 4.5} 385,${sy + 4.5}" fill="${flowColor}" />
        <polygon points="555,${sy} 545,${sy - 4.5} 545,${sy + 4.5}" fill="${flowColor}" />
        <polygon points="688,${sy} 678,${sy - 4.5} 678,${sy + 4.5}" fill="${flowColor}" />
      `).join("");

      // Капли конденсата с испарителя 1#Dehumicoil (+5.1°C)
      const dropsSvg = [722, 738, 754, 770, 786].map((dx, i) => `
        <g transform="translate(${dx}, 212)">
          <path d="M0,0 C-3.5,5 -4,9 0,11 C4,9 3.5,5 0,0 Z"
                fill="#00E5FF"
                class="scada-condensate-drop ${isPause ? 'slow' : ''}"
                style="animation-delay: ${(i * 0.32).toFixed(2)}s;" />
        </g>
      `).join("");

      // Адаптивный мобильный вид мнемосхемы Рижской камеры (< 820px: крупные вентиляторы Cantoni, тележки SS304 и испаритель без мелкого сплюснутого текста)
      const mobileFansRowSvg = [1, 2, 3, 4].map(mNum => `
        <div style="flex:1; background:rgba(4,10,20,0.95); border:1.5px solid ${fanColor}; border-radius:12px; padding:8px 4px; text-align:center; box-shadow:0 0 12px ${isPause ? 'rgba(255,167,38,0.18)' : 'rgba(46,229,157,0.22)'};">
          <div style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${fanColor}; margin-bottom:4px;">M${mNum} • 3кВт</div>
          <svg viewBox="-28 -28 56 56" style="width:48px; height:48px; margin:0 auto; display:block;">
            <circle cx="0" cy="0" r="24" fill="#06101E" stroke="${fanColor}" stroke-width="2.2" />
            <g class="scada-fan-rotor ${fanSpeedClass}">
              <path d="M0,0 C-5,-16 5,-16 0,0 M0,0 C14,-7 8,4 0,0 M0,0 C14,8 3,15 0,0 M0,0 C5,16 -5,16 0,0 M0,0 C-14,7 -8,-4 0,0 M0,0 C-14,-8 -3,-15 0,0"
                    fill="${fanColor}" stroke="${fanColor}" stroke-width="4.4" stroke-linecap="round" />
              <line x1="-16" y1="0" x2="16" y2="0" stroke="${fanColor}" stroke-width="2.4" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="${fanColor}" stroke-width="2.4" />
            </g>
            <circle cx="0" cy="0" r="5" fill="#08111D" stroke="#FFFFFF" stroke-width="1.5" />
          </svg>
          <div style="font-family:var(--font-mono); font-size:10.5px; color:#F0F6FC; font-weight:700; margin-top:4px;">${isPause ? stage.pauseFreqLabel : `${stage.activeFreqHz} Гц`}</div>
        </div>
      `).join("");

      const mobileCartsGridHtml = [1, 2, 3, 4, 5].map(rNum => {
        const isCenter = rNum === 3;
        const cStroke = t.coLoadWithVimba ? (rNum <= 3 ? "#00E5FF" : "#FF5252") : (isCenter ? "#00E5FF" : "rgba(159,179,200,0.45)");
        const cTitle = t.coLoadWithVimba ? (rNum <= 3 ? `Р${rNum} Вимба` : `Р${rNum} Плотва`) : (isCenter ? "Р3 (Ось 180°)" : `Ряд ${rNum}`);
        return `
          <div style="flex:1; background:rgba(8,18,34,0.92); border:1.5px solid ${cStroke}; border-radius:10px; padding:7px 4px; text-align:center;">
            <div style="font-family:var(--font-mono); font-size:10.5px; font-weight:800; color:${cStroke};">${cTitle}</div>
            <div style="font-size:16px; margin:3px 0;">🐟🐟</div>
            <div style="font-family:var(--font-mono); font-size:9.5px; color:#9FB3C8;">3 тел. SS304</div>
          </div>
        `;
      }).join("");

      wrap.innerHTML = `
        <div id="scada-chamber-mobile-hud">
          <!-- Блок 1: 4 Вентилятора Cantoni 3 кВт -->
          <div style="background:rgba(4,11,22,0.96); border:1.5px solid ${fanColor}; border-radius:14px; padding:10px 12px;">
            <div class="row-between" style="margin-bottom:8px;">
              <span style="font-family:var(--font-display); font-size:14px; font-weight:800; color:${fanColor};">🌀 4× ВЕНТИЛЯТОРА CANTONI 3 КВТ</span>
              <span class="pill-btn ${isPause ? 'pill-amber' : 'pill-emerald'}" style="cursor:default; font-size:11px; padding:3px 9px;">${activeFreqStr}</span>
            </div>
            <div style="display:flex; gap:6px;">${mobileFansRowSvg}</div>
            <div style="font-family:var(--font-mono); font-size:11.5px; color:var(--cyan-dew); margin-top:8px; text-align:center;">
              Поток сквозь пленум 50–70 см: <b>${airVelStr}</b> ➔
            </div>
          </div>

          <!-- Блок 2: Монолит 15 тележек SS304 (5 рядов × 3) -->
          <div style="background:rgba(4,11,22,0.96); border:1.5px solid rgba(0,229,255,0.5); border-radius:14px; padding:10px 12px;">
            <div class="row-between" style="margin-bottom:8px;">
              <span style="font-family:var(--font-display); font-size:14px; font-weight:800; color:var(--cyan-dew);">🛒 МОНОЛИТ 15 ТЕЛЕЖЕК SS304 (3×5)</span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--amber-curing); font-weight:700;">${t.batchWeightKg} кг • Ст.${stage.number}</span>
            </div>
            <div style="display:flex; gap:5px; margin-bottom:8px;">${mobileCartsGridHtml}</div>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; font-family:var(--font-mono); font-size:12px;">
              <div style="background:rgba(0,56,68,0.55); border:1px solid rgba(0,229,255,0.4); border-radius:8px; padding:6px 8px;">🌡 Камера: <b style="color:#FFF;">+${t.environmentTempC}°C</b></div>
              <div style="background:rgba(0,56,68,0.55); border:1px solid rgba(0,229,255,0.4); border-radius:8px; padding:6px 8px;">💧 Parkside: <b style="color:var(--cyan-dew);">${Math.round(t.parksideRhPercent)}% rH</b></div>
              <div style="background:rgba(6,59,39,0.55); border:1px solid rgba(46,229,157,0.4); border-radius:8px; padding:6px 8px;">🔫 Чешуя: <b style="color:var(--emerald-optimal);">${diag.scaleSurfaceTempC}°C</b></div>
              <div style="background:rgba(71,42,0,0.55); border:1px solid rgba(255,167,38,0.4); border-radius:8px; padding:6px 8px;">🐟 Хребет: <b style="color:var(--amber-curing);">${diag.spineMoistureGmPercent}%</b></div>
            </div>
          </div>

          <!-- Блок 3: Испаритель 1#Dehumicoil и контуры R410A -->
          <div style="background:rgba(4,11,22,0.96); border:1.5px solid ${coilColor}; border-radius:14px; padding:10px 12px;">
            <div class="row-between" style="margin-bottom:8px;">
              <span style="font-family:var(--font-display); font-size:14px; font-weight:800; color:${coilColor};">❄ МОНОБЛОК AIM AGHD-250ELC</span>
              <span class="pill-btn pill-cyan" style="cursor:default; font-size:11px; padding:3px 9px;">Контуров R410A: ${t.activeCircuitsRunning}/2</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; text-align:center;">
              <div style="background:rgba(0,56,68,0.68); border:1px solid ${coilColor}; border-radius:10px; padding:8px 6px;">
                <div style="font-family:var(--font-mono); font-size:10px; color:#9FB3C8;">1#Dehumicoil</div>
                <div style="font-family:var(--font-display); font-size:18px; font-weight:800; color:${coilColor}; margin-top:2px;">+${t.dehumicoilTempC}°C</div>
              </div>
              <div style="background:rgba(6,59,39,0.68); border:1px solid ${eevCol}; border-radius:10px; padding:8px 6px;">
                <div style="font-family:var(--font-mono); font-size:10px; color:#9FB3C8;">ЭРВ 1#EEV</div>
                <div style="font-family:var(--font-display); font-size:18px; font-weight:800; color:${eevCol}; margin-top:2px;">${t.eev1Steps} st</div>
              </div>
              <div style="background:rgba(10,22,38,0.88); border:1px solid var(--cyan-dew); border-radius:10px; padding:8px 6px;">
                <div style="font-family:var(--font-mono); font-size:10px; color:#9FB3C8;">💧 Дренаж / Т.росы</div>
                <div style="font-family:var(--font-display); font-size:16px; font-weight:800; color:var(--cyan-dew); margin-top:2px;">${diag.dewPointC}°C</div>
              </div>
            </div>
            <button class="btn btn-cyan" style="width:100%; margin-top:10px; font-weight:800;" onclick="openFullscreenMimicModal()">
              ⛶ Развернуть мнемосхему на весь экран
            </button>
          </div>
        </div>

        <svg id="scada-chamber-desktop-svg" viewBox="0 0 980 315" style="width:100%; height:auto; min-width:740px; display:block;">
          <defs>
            <linearGradient id="scadaChamberGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(0, 229, 255, 0.10)" />
              <stop offset="50%" stop-color="rgba(15, 30, 50, 0.45)" />
              <stop offset="100%" stop-color="rgba(255, 167, 38, 0.12)" />
            </linearGradient>
            <linearGradient id="scadaCoilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(0, 229, 255, 0.45)" />
              <stop offset="100%" stop-color="rgba(0, 110, 180, 0.75)" />
            </linearGradient>
          </defs>

          <!-- Внешний герметичный контур Рижской камеры (Closed Loop) -->
          <rect x="12" y="10" width="956" height="295" rx="14" fill="url(#scadaChamberGrad)" stroke="#2B466B" stroke-width="2" />

          <!-- Верхний рециркуляционный канал возврата осушенного воздуха (AIM -> Cantoni) -->
          <rect x="28" y="18" width="924" height="28" rx="6" fill="rgba(6, 22, 38, 0.92)" stroke="rgba(0, 229, 255, 0.35)" stroke-width="1.2" />
          <path d="M 880 32 L 95 32" fill="none" stroke="#00E5FF" stroke-width="2.2" class="${flowSpeedClass}" />
          <polygon points="120,32 132,27 132,37" fill="#00E5FF" />
          <polygon points="480,32 492,27 492,37" fill="#00E5FF" />
          <polygon points="820,32 832,27 832,37" fill="#00E5FF" />
          <text x="490" y="36" fill="#B8F4FF" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">
            ◀━━ ЗАМКНУТЫЙ КОНТУР РЕЦИРКУЛЯЦИИ (CLOSED LOOP) • ВОЗВРАТ ОСУШЕННОГО ВОЗДУХА ОТ AIM К ВЕНТИЛЯТОРАМ CANTONI ━━◀
          </text>

          <!-- ЛЕВЫЙ БЛОК: 4 ВЕНТИЛЯТОРА CANTONI 3 КВТ + ЧП HAPN HPVF 4.0KW -->
          <rect x="28" y="54" width="114" height="238" rx="10" fill="rgba(8, 17, 29, 0.92)" stroke="${fanColor}" stroke-width="1.8" />
          <text x="85" y="68" fill="${fanColor}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="middle">4×CANTONI 3кВт</text>
          ${fansSvg}
          <rect x="34" y="268" width="102" height="19" rx="4" fill="rgba(0,0,0,0.55)" stroke="${fanColor}" stroke-width="1" />
          <text x="85" y="281" fill="${fanColor}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">${activeFreqStr}</text>

          <!-- ЗОНА ПЛЕНУМА СЛЕВА У СКОСА (50-70 СМ) -->
          <rect x="148" y="54" width="84" height="206" rx="8" fill="rgba(0, 56, 68, 0.36)" stroke="rgba(0, 229, 255, 0.45)" stroke-dasharray="4,3" />
          <text x="190" y="72" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">ПЛЕНУМ</text>
          <text x="190" y="85" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="middle">50–70 см</text>
          <text x="190" y="252" fill="${fanColor}" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">${airVelStr.split(" ")[0]}</text>

          <!-- АНИМИРОВАННЫЕ СТРЕЛКИ ОДНОСТОРОННЕГО ПОТОКА ВОЗДУХА СКВОЗЬ ТЕЛЕЖКИ SS304 -->
          ${streamlinesSvg}

          <!-- МОНОЛИТ 15 ТЕЛЕЖЕК SS304 (5 РЯДОВ × 3 ТЕЛЕЖКИ) -->
          ${cartsSvg}

          <!-- НИЖНЯЯ ИНФОРМАЦИОННАЯ ПАНЕЛЬ КАМЕРЫ ПОД ТЕЛЕЖКАМИ -->
          <rect x="148" y="264" width="540" height="28" rx="6" fill="rgba(6, 18, 32, 0.94)" stroke="rgba(0, 229, 255, 0.4)" />
          <text x="418" y="282" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">
            🌡 Камера: ${t.environmentTempC}°C  |  💧 Parkside: ${Math.round(t.parksideRhPercent)}% rH  |  🔫 Чешуя: ${diag.scaleSurfaceTempC}°C (ΔT ${diag.deltaTempEvapC >= 0 ? '+' : ''}${diag.deltaTempEvapC.toFixed(1)}°C)  |  🐟 Хребет: ${diag.spineMoistureGmPercent}%
          </text>

          <!-- БУФЕР ВСАСЫВАНИЯ СПРАВА У СЕТОК (50 СМ) -->
          <rect x="634" y="54" width="54" height="206" rx="8" fill="rgba(71, 42, 0, 0.35)" stroke="rgba(255, 167, 38, 0.5)" stroke-dasharray="4,3" />
          <text x="661" y="72" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">БУФЕР</text>
          <text x="661" y="85" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="middle">50 см</text>
          <text x="661" y="252" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">У сеток</text>

          <!-- ПРАВЫЙ БЛОК: МОНОБЛОК AIM AGHD-250ELC (ИСПАРИТЕЛЬ 1#DEHUMICOIL + КАПЛИ КОНДЕНСАТА + 1/2 КОНТУРА R410A) -->
          <rect x="696" y="54" width="256" height="238" rx="10" fill="rgba(8, 17, 29, 0.95)" stroke="#00E5FF" stroke-width="1.8" />
          <text x="824" y="70" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">
            МОНОБЛОК AIM AGHD-250ELC
          </text>

          <!-- Испаритель 1#Dehumicoil (+5.1°C) -->
          <rect x="708" y="78" width="92" height="132" rx="7" fill="url(#scadaCoilGrad)" stroke="${coilColor}" stroke-width="2" />
          <text x="754" y="93" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">1#Dehumicoil</text>
          <text x="754" y="111" fill="#08111D" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="700" text-anchor="middle">+${t.dehumicoilTempC}°C</text>
          <!-- Ламели испарителя -->
          ${[122, 134, 146, 158, 170, 182].map(ly => `<line x1="714" y1="${ly}" x2="794" y2="${ly}" stroke="rgba(8,17,29,0.55)" stroke-width="2" />`).join("")}
          <rect x="713" y="188" width="82" height="17" rx="4" fill="#08111D" stroke="${eevCol}" stroke-width="1.2" />
          <text x="754" y="200" fill="${eevCol}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">1#EEV: ${t.eev1Steps} st</text>

          <!-- Анимированные капли конденсата и поддон гидрозатвора (75 л/ч) -->
          ${dropsSvg}
          <path d="M 708 248 L 716 260 L 792 260 L 800 248" fill="rgba(0, 229, 255, 0.25)" stroke="#00E5FF" stroke-width="1.8" />
          <text x="754" y="274" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" text-anchor="middle">💧 Дренаж 75 л/ч</text>
          <text x="754" y="285" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">Т.росы: ${diag.dewPointC}°C</text>

          <!-- Индикатор 1 / 2 контуров R410A + Термокороб [20] -->
          <g transform="translate(810, 78)">
            <!-- Контур №1 R410A -->
            <rect x="0" y="0" width="132" height="62" rx="7" fill="rgba(6, 59, 39, 0.78)" stroke="#2EE59D" stroke-width="1.6" />
            <circle cx="14" cy="15" r="5" fill="#2EE59D" />
            <text x="25" y="18" fill="#2EE59D" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">КОНТУР №1 R410A</text>
            <text x="10" y="34" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="9.5">Статус: ВКЛ (22–24 бар)</text>
            <text x="10" y="49" fill="#B8F4FF" font-family="JetBrains Mono, monospace" font-size="9">KVC [8] + LLSV [19] + 7л</text>

            <!-- Контур №2 R410A -->
            <rect x="0" y="68" width="132" height="62" rx="7"
                  fill="${c2Active ? 'rgba(6, 59, 39, 0.78)' : 'rgba(21, 40, 66, 0.75)'}"
                  stroke="${c2Active ? '#2EE59D' : '#526D82'}" stroke-width="1.6" />
            <circle cx="14" cy="83" r="5" fill="${c2Active ? '#2EE59D' : '#9FB3C8'}" />
            <text x="25" y="86" fill="${c2Active ? '#2EE59D' : '#9FB3C8'}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">КОНТУР №2 R410A</text>
            <text x="10" y="102" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="9.5">
              Статус: ${c2Active ? 'ВКЛ (Пик съема)' : 'СТЭНДБАЙ (Откл)'}
            </text>
            <text x="10" y="117" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="9">
              Активно: ${t.activeCircuitsRunning} из 2 конт.
            </text>

            <!-- Уличный конденсатор 10 м / Термокороб [20] -->
            <rect x="0" y="136" width="132" height="68" rx="7"
                  fill="${isWinter ? 'rgba(6, 59, 39, 0.65)' : 'rgba(71, 42, 0, 0.65)'}"
                  stroke="${isWinter ? '#2EE59D' : '#FFA726'}" stroke-width="1.4" />
            <text x="66" y="151" fill="${isWinter ? '#2EE59D' : '#FFA726'}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">
              ТЕРМОКОРОБ [20] (10м)
            </text>
            <text x="66" y="167" fill="#F0F6FC" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">
              ${isWinter ? '🟢 ЗИМА: +14 кВт В ЦЕХ' : '☀️ ЛЕТО: СБРОС НА УЛИЦУ'}
            </text>
            <text x="66" y="182" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">
              STC-1000: +36°C ВКЛ / +28°C ВЫКЛ
            </text>
            <text x="66" y="196" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">
              Испарить: ~${diag.yieldForecast.currentStageWaterLiters} л (Ст.${stage.number})
            </text>
          </g>
        </svg>
      `;
    }

    // ==================== 4a-2. SCADA БЛОК 2: ПОЛУКРУГЛЫЙ ПРИБОР-СПИДОМЕТР "ДЕТЕКТОР VPD И ЗАКАЛА" ====================
    function renderScadaVpdSpeedometerSvg(t, stage, species, diag) {
      const wrap = document.getElementById("scada-vpd-speedometer-wrap");
      const pillEl = document.getElementById("scada-vpd-zone-pill");
      const ledEl = document.getElementById("scada-vpd-led");

      let telemetry = (t && typeof t === "object") ? t : ((typeof state !== "undefined" && state && state.telemetry) ? state.telemetry : { environmentTempC: 15.8, parksideRhPercent: 58, isPausePhaseNow: false });
      let diagnostics = diag;
      let vpd = 0;

      if (typeof t === "number" || typeof t === "string") {
        vpd = parseFloat(t) || 0;
        if (!diagnostics) {
          diagnostics = (typeof analyzeBioscience === "function") ? analyzeBioscience(telemetry) : { dewPointC: 7.4, deltaTempEvapC: 1.2, vpdKpa: vpd };
        }
      } else {
        if (!diagnostics) {
          diagnostics = (typeof analyzeBioscience === "function") ? analyzeBioscience(telemetry) : { dewPointC: 7.4, deltaTempEvapC: 1.2, vpdKpa: 0.58 };
        }
        vpd = Number(diagnostics.vpdKpa || 0);
      }

      // Шкала прибора: 0.00 .. 1.50 кПа -> угол от -90° (левый край) до +90° (правый край)
      const maxScale = 1.50;
      const clampedVpd = Math.min(maxScale, Math.max(0, vpd));
      const needleDeg = -90 + (clampedVpd / maxScale) * 180;

      let zoneTitle = "";
      let zoneDesc = "";
      let zoneColor = "#2EE59D";
      let pillClass = "pill-btn pill-emerald";
      let ledClass = "scada-led scada-led-emerald";

      if (vpd < 0.45) {
        zoneTitle = "🔵 СИНЯЯ ЗОНА (< 0.45 кПа): ОТДЫХ / ПАУЗА / СЛАБЫЙ СЪЕМ";
        zoneDesc = telemetry.isPausePhaseNow
          ? "Режим паузы (15–20 Гц / 4.5V): влага перераспределяется от позвоночника к чешуе. Следите, чтобы пауза на Ст.1–3 не превышала 1.5–2.0 ч!"
          : "Внимание: дефицит VPD ниже 0.45 кПа в режиме сушки! Воздух перенасыщен влагой («болото»), влагосъем с тушки почти остановлен.";
        zoneColor = "#00B0FF";
        pillClass = "pill-btn pill-cyan";
        ledClass = "scada-led scada-led-cyan";
      } else if (vpd >= 0.50 && vpd <= 0.95) {
        zoneTitle = "🟢 ЗЕЛЕНАЯ ЗОЛОТАЯ ЗОНА (0.50–0.95 кПа): ИДЕАЛЬНЫЙ СЪЕМ ВЛАГИ БЕЗ ЗАКАЛА";
        zoneDesc = "Эталонный баланс капиллярной диффузии и поверхностного испарения! Поры чешуи открыты, влага свободно выходит от хребта без образования белковой корки.";
        zoneColor = "#2EE59D";
        pillClass = "pill-btn pill-emerald";
        ledClass = "scada-led scada-led-emerald";
      } else if (vpd > 1.15) {
        zoneTitle = "🔴 КРАСНАЯ ЗОНА (> 1.15 кПа): ОПАСНОСТЬ ПАНЦИРНОГО ЗАКАЛА ЧЕШУИ!";
        zoneDesc = "ТРЕВОГА ЗАКАЛА (Case Hardening): поверхность сохнет быстрее подвода влаги из ядра! Немедленно поднимите уставку Humi% или переведите камеру в паузу 15–20 Гц.";
        zoneColor = "#FF5252";
        pillClass = "pill-btn pill-amber";
        ledClass = "scada-led scada-led-coral";
      } else {
        zoneTitle = "🟡 БУФЕРНАЯ ЗОНА (КОНТРОЛЬ ПЕРЕХОДА): ПОВЫШЕННОЕ ВНИМАНИЕ";
        zoneDesc = vpd < 0.50
          ? "Пограничный режим (0.45–0.50 кПа): выход из паузы на рабочую полку осушения."
          : "Пограничный режим (0.95–1.15 кПа): форсированный съем влаги. Контролируйте ΔT чешуи пирометром ИК-пирометр шкуры (должно быть ≥ 1.0°C)!";
        zoneColor = "#FFA726";
        pillClass = "pill-btn pill-amber";
        ledClass = "scada-led scada-led-amber";
      }

      if (pillEl) {
        pillEl.className = pillClass;
        pillEl.textContent = `${vpd.toFixed(2)} кПа • ${vpd < 0.45 ? 'СИНЯЯ ЗОНА (ОТДЫХ)' : (vpd <= 0.95 && vpd >= 0.50 ? 'ЗОЛОТАЯ ЗОНА' : (vpd > 1.15 ? 'ОПАСНОСТЬ ЗАКАЛА!' : 'БУФЕР КОНТРОЛЯ'))}`;
      }
      if (ledEl) ledEl.className = ledClass;

      // Полярные координаты для дуг полукруга (центр 210, 178, радиус R=132)
      const cx = 210, cy = 178, R = 132;
      const ptAt = val => {
        const rad = Math.PI - (Math.min(maxScale, Math.max(0, val)) / maxScale) * Math.PI;
        return [cx + R * Math.cos(rad), cy - R * Math.sin(rad)];
      };
      const arcSeg = (v1, v2, color, width) => {
        const [x1, y1] = ptAt(v1);
        const [x2, y2] = ptAt(v2);
        return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="butt" />`;
      };

      const ticksVals = [0.0, 0.25, 0.45, 0.50, 0.75, 0.95, 1.15, 1.50];
      const ticksSvg = ticksVals.map(tv => {
        const rad = Math.PI - (tv / maxScale) * Math.PI;
        const xIn = cx + (R - 14) * Math.cos(rad);
        const yIn = cy - (R - 14) * Math.sin(rad);
        const xOut = cx + (R + 14) * Math.cos(rad);
        const yOut = cy - (R + 14) * Math.sin(rad);
        const xTxt = cx + (R + 30) * Math.cos(rad);
        const yTxt = cy - (R + 30) * Math.sin(rad) + 4;
        const tCol = tv <= 0.45 ? "#00E5FF" : (tv <= 0.95 ? "#2EE59D" : (tv < 1.15 ? "#FFA726" : "#FF5252"));
        return `
          <line x1="${xIn.toFixed(1)}" y1="${yIn.toFixed(1)}" x2="${xOut.toFixed(1)}" y2="${yOut.toFixed(1)}" stroke="#F0F6FC" stroke-width="2" />
          <text x="${xTxt.toFixed(1)}" y="${yTxt.toFixed(1)}" fill="${tCol}" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">${tv.toFixed(2)}</text>
        `;
      }).join("");

      const deltaEvap = Number(diagnostics.deltaTempEvapC || 0);
      const svgGaugeHtml = `
        <div style="background: rgba(5, 11, 20, 0.92); border: 1px solid rgba(0, 229, 255, 0.32); border-radius: 14px; padding: 10px; text-align: center;">
          <svg viewBox="0 0 420 228" style="width: 100%; max-width: 430px; height: auto; margin: 0 auto; display: block;">
            <!-- Фоновая подложка дуги -->
            ${arcSeg(0.0, 1.50, "rgba(43, 70, 107, 0.45)", 24)}
            <!-- 1. Синяя зона (<0.45 кПа — Отдых/Пауза) -->
            ${arcSeg(0.0, 0.45, "#00B0FF", 22)}
            <!-- Переход 0.45..0.50 -->
            ${arcSeg(0.45, 0.50, "#00E5FF", 22)}
            <!-- 2. Зеленая золотая зона (0.50–0.95 кПа — Идеальный съем влаги без закала) -->
            ${arcSeg(0.50, 0.95, "#2EE59D", 24)}
            <!-- Желтая буферная зона (0.95–1.15 кПа) -->
            ${arcSeg(0.95, 1.15, "#FFA726", 22)}
            <!-- 3. Красная зона (>1.15 кПа — Опасность панцирного закала чешуи!) -->
            ${arcSeg(1.15, 1.50, "#FF5252", 24)}

            ${ticksSvg}

            <!-- Подписи зон внутри циферблата -->
            <text x="112" y="138" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">ОТДЫХ/ПАУЗА</text>
            <text x="210" y="88" fill="#2EE59D" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">★ ЗОЛОТАЯ ЗОНА ★</text>
            <text x="312" y="138" fill="#FF5252" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">РИСК ЗАКАЛА!</text>

            <!-- Стрелка спидометра -->
            <g transform="translate(${cx}, ${cy}) rotate(${needleDeg.toFixed(1)})">
              <polygon points="-5,14 0,-122 5,14" fill="${zoneColor}" stroke="#08111D" stroke-width="1.5" />
              <line x1="0" y1="0" x2="0" y2="-118" stroke="#FFFFFF" stroke-width="1.5" />
            </g>
            <circle cx="${cx}" cy="${cy}" r="14" fill="#0F1E32" stroke="${zoneColor}" stroke-width="3" />
            <circle cx="${cx}" cy="${cy}" r="5" fill="#F0F6FC" />

            <!-- Цифровое табло VPD в основании спидометра -->
            <text x="${cx}" y="208" fill="${zoneColor}" font-family="Space Grotesk, sans-serif" font-size="24" font-weight="700" text-anchor="middle">
              VPD = ${vpd.toFixed(2)} кПа
            </text>
            <text x="${cx}" y="223" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="10.5" text-anchor="middle">
              Точка росы: ${diagnostics.dewPointC}°C  |  ΔT чешуи: ${deltaEvap >= 0 ? '+' : ''}${deltaEvap.toFixed(1)}°C  |  Parkside: ${Math.round(telemetry.parksideRhPercent || 58)}% rH
            </text>
          </svg>
        </div>
      `;

      if (typeof t === "number" || typeof t === "string") {
        return svgGaugeHtml;
      }

      const fullHtml = `
        ${svgGaugeHtml}
        <!-- Правая панель расшифровки шкалы и быстрого тестирования зон -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(8, 17, 29, 0.92); border: 1.5px solid ${zoneColor}; border-radius: 12px; padding: 12px 14px;">
            <div style="font-family: var(--font-display); font-size: 14.5px; font-weight: 700; color: ${zoneColor}; margin-bottom: 4px;">
              ${zoneTitle}
            </div>
            <div style="font-size: 13px; line-height: 1.48; color: var(--steel-text-primary);">
              ${zoneDesc}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 6px; font-size: 12px;">
            <div class="scada-zone-pill" style="border-color: rgba(0, 176, 255, 0.55); justify-content: space-between;">
              <span style="color: #00E5FF;">🔵 Синяя зона (&lt; 0.45 кПа): Отдых / Пауза (подход влаги от кости)</span>
              <button class="chip" style="padding: 3px 8px; font-size: 10.5px;" onclick="state.telemetry.environmentTempC=15.0; state.telemetry.parksideRhPercent=82; state.telemetry.isPausePhaseNow=true; renderAll();">Тест 0.31 кПа</button>
            </div>
            <div class="scada-zone-pill" style="border-color: rgba(46, 229, 157, 0.65); justify-content: space-between;">
              <span style="color: #2EE59D;">🟢 Золотая зона (0.50–0.95 кПа): Идеальный съем влаги без закала</span>
              <button class="chip active-emerald" style="padding: 3px 8px; font-size: 10.5px;" onclick="state.telemetry.environmentTempC=15.8; state.telemetry.parksideRhPercent=58; state.telemetry.isPausePhaseNow=false; renderAll();">Тест 0.75 кПа</button>
            </div>
            <div class="scada-zone-pill" style="border-color: rgba(255, 82, 82, 0.65); justify-content: space-between;">
              <span style="color: #FF5252;">🔴 Красная зона (&gt; 1.15 кПа): Опасность панцирного закала чешуи!</span>
              <button class="chip" style="padding: 3px 8px; font-size: 10.5px; border-color: var(--coral-danger); color: var(--coral-danger);" onclick="state.telemetry.environmentTempC=21.5; state.telemetry.parksideRhPercent=42; state.telemetry.isPausePhaseNow=false; renderAll();">Тест 1.48 кПа</button>
            </div>
          </div>
        </div>
      `;

      if (wrap) wrap.innerHTML = fullHtml;
      return fullHtml;
    }
    // ==================== 4b. SCADA БЛОК 3: ИНТЕРАКТИВНЫЙ ГРАФИК "КРИВАЯ СУШКИ ПАРТИИ И ЛОГГЕР PARKSIDE rH%" ====================
    let lastBatchCurvePlotItems = [];
    let batchCurveGeom = null;
    let lastBatchTouchIdx = -1;

    function inspectBatchCurvePoint(idx) {
      const bar = document.getElementById("batch-curve-inspector-bar");
      if (!bar || !lastBatchCurvePlotItems.length) return;
      const pt = lastBatchCurvePlotItems[idx] || lastBatchCurvePlotItems[lastBatchCurvePlotItems.length - 1];
      if (!pt) return;
      const inCorridor = pt.rh >= pt.refMinRh && pt.rh <= pt.refMaxRh;
      const statusCol = pt.rh >= 84 ? "var(--coral-danger)" : (inCorridor ? "var(--emerald-optimal)" : "var(--amber-curing)");
      const statusTxt = pt.rh >= 84
        ? "⛔ ПИК ПАУЗЫ (УДУШЬЕ >=85% rH)"
        : (inCorridor ? `✓ В ЭТАЛОННОМ КОРИДОРЕ (${pt.refMinRh}–${pt.refMaxRh}% rH)` : `⚠️ ОТКЛОНЕНИЕ ОТ КОРИДОРА (${pt.refMinRh}–${pt.refMaxRh}% rH)`);
      bar.innerHTML = `
        <div class="row-between" style="gap: 10px; flex-wrap: wrap;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="color: var(--cyan-dew); font-weight: 800; font-size: 13px;">📍 Точка #${pt.idx} (${pt.label})</span>
            <span style="background:rgba(0,56,68,0.75); border:1px solid #00E5FF; border-radius:8px; padding:3px 9px;">💧 rH: <b style="color:#00E5FF; font-size:15.5px;">${pt.rh}%</b></span>
            <span style="background:rgba(71,42,0,0.75); border:1px solid #FFA726; border-radius:8px; padding:3px 9px;">🌡 Temp: <b style="color:#FFA726; font-size:15.5px;">${pt.temp}°C</b></span>
            <span style="background:rgba(6,59,39,0.75); border:1px solid #00E676; border-radius:8px; padding:3px 9px;">💦 Т.росы: <b style="color:#00E676; font-size:14.5px;">${pt.dew}°C</b></span>
            <span style="background:rgba(15,30,50,0.85); border:1px solid rgba(159,179,200,0.45); border-radius:8px; padding:3px 9px;">🌬 VPD: <b style="color:#FFF; font-size:14.5px;">${pt.vpd} кПа</b></span>
          </div>
          <span style="color: ${statusCol}; font-weight: 800; font-size: 12.5px;">${statusTxt}</span>
        </div>
      `;
    }

    function onBatchCurvePointerMove(evt) {
      const svg = document.getElementById("batch-curve-main-svg");
      const geom = batchCurveGeom;
      const pts = lastBatchCurvePlotItems;
      if (!svg || !geom || !pts || !pts.length) return;

      const touch = (evt.touches && evt.touches[0]) || (evt.changedTouches && evt.changedTouches[0]);
      const clientX = touch ? touch.clientX : evt.clientX;
      if (typeof clientX !== "number") return;

      const rect = svg.getBoundingClientRect();
      const relX = ((clientX - rect.left) / Math.max(1, rect.width)) * geom.W;
      const clampedX = Math.min(geom.W - geom.padR, Math.max(geom.padL, relX));
      const ratio = (clampedX - geom.padL) / Math.max(1, geom.plotW);
      const idx = Math.min(pts.length - 1, Math.max(0, Math.round(ratio * (pts.length - 1))));
      const pt = pts[idx];
      if (!pt) return;

      if (idx !== lastBatchTouchIdx) {
        lastBatchTouchIdx = idx;
        triggerHaptic(8, true);
      }

      const cx = geom.xFor(idx);
      const cyRh = geom.yForRh(pt.rh);
      const cyTemp = geom.yForTemp(pt.temp);
      const cyDew = geom.yForTemp(pt.dew);

      const g = document.getElementById("batch-curve-crosshair-group");
      const line = document.getElementById("batch-curve-crosshair-line");
      const hline = document.getElementById("batch-curve-crosshair-hline");
      const rhDot = document.getElementById("batch-curve-crosshair-rh-dot");
      const tempDot = document.getElementById("batch-curve-crosshair-temp-dot");
      const dewDot = document.getElementById("batch-curve-crosshair-dew-dot");
      const badgeBg = document.getElementById("batch-curve-crosshair-badge-bg");
      const badgeTxt = document.getElementById("batch-curve-crosshair-badge-txt");

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
        if (dewDot) {
          dewDot.setAttribute("cx", cx.toFixed(1));
          dewDot.setAttribute("cy", cyDew.toFixed(1));
        }
        if (badgeBg && badgeTxt) {
          const labelStr = `#${pt.idx} ${pt.label} • rH ${pt.rh}% • ${pt.temp}°C • VPD ${pt.vpd} кПа`;
          const bw = Math.max(220, labelStr.length * 6.4 + 18);
          const bx = Math.min(geom.W - geom.padR - bw, Math.max(geom.padL, cx - bw / 2));
          badgeBg.setAttribute("x", bx.toFixed(1));
          badgeBg.setAttribute("width", bw.toFixed(1));
          badgeTxt.setAttribute("x", (bx + bw / 2).toFixed(1));
          badgeTxt.textContent = labelStr;
        }
      }

      inspectBatchCurvePoint(idx);
    }

    function onBatchCurvePointerLeave() {
      const g = document.getElementById("batch-curve-crosshair-group");
      if (g) g.style.display = "none";
    }

    function loadFull4StageDemoBatchLogs() {
      const spKey = state.telemetry.speciesKey || "VIMBA";
      const wt = state.telemetry.batchWeightKg || 1850;
      const demoStages = [
        { time: "День 1 • 08:00", stageKey: "STAGE_1", temp: 12.2, rh: 72, eev: 310, coil: 5.2, pause: false, note: "Стадия 1 (Отепливание): плавный старт, влага в эталонном коридоре 65–75% rH." },
        { time: "День 1 • 18:00", stageKey: "STAGE_1", temp: 13.0, rh: 66, eev: 295, coil: 5.1, pause: false, note: "Стадия 1 завершена: поверхность чистая без слизи, переход к Стадии 2." },
        { time: "День 2 • 09:00", stageKey: "STAGE_2", temp: 15.6, rh: 60, eev: 280, coil: 5.0, pause: false, note: "Стадия 2 (Интенсивная сушка 2 контура): активный съем влаги в коридоре 50–62% rH." },
        { time: "День 2 • 21:00", stageKey: "STAGE_2", temp: 15.8, rh: 54, eev: 265, coil: 5.1, pause: false, note: "Стадия 2: стабильная полка 54% rH, ΔT чешуи +1.4°C (поры открыты)." },
        { time: "День 3 • 12:00", stageKey: "STAGE_3", temp: 16.4, rh: 53, eev: 245, coil: 5.2, pause: false, note: "Стадия 3 (Выравнивание): подход влаги от хребта, коридор 48–56% rH." },
        { time: "День 4 • 08:00", stageKey: "STAGE_3", temp: 16.8, rh: 49, eev: 235, coil: 5.3, pause: false, note: "Стадия 3 финал: спинка уплотнилась, переход к Стадии 4." },
        { time: "День 4 • 20:00", stageKey: "STAGE_4", temp: 14.5, rh: 46, eev: 225, coil: 5.4, pause: false, note: "Стадия 4 (Закалка и стабилизация 25.3 Гц): стекловидный янтарный срез." },
        { time: "День 5 • 08:00", stageKey: "STAGE_4", temp: 14.0, rh: 43, eev: 220, coil: 5.5, pause: true, note: "Фиксация Ф8 → Выгрузка на упаковку KOMET PlusVac 25 (Soft Vac 95–96%)!" }
      ];

      // state.batchLogs хранит записи от новых к старым (unshift)
      state.batchLogs = demoStages.slice().reverse().map((d, i) => {
        const simTel = {
          ...state.telemetry,
          speciesKey: spKey,
          batchWeightKg: wt,
          stageKey: d.stageKey,
          environmentTempC: d.temp,
          parksideRhPercent: d.rh,
          eev1Steps: d.eev,
          dehumicoilTempC: d.coil,
          isPausePhaseNow: d.pause
        };
        const simDiag = analyzeBioscience(simTel);
        return {
          id: Date.now() - i * 60000,
          timestampStr: d.time,
          telemetry: simTel,
          dewPointC: simDiag.dewPointC,
          vpdKpa: simDiag.vpdKpa,
          adviceText: d.note
        };
      });
      persistStateToStorage();
      renderAll();
      showToast("Построена эталонная кривая сушки по 4 стадиям (от Ст.1 до упаковки KOMET PlusVac 25)");
    }

    function renderBatchDryingCurveSvg(currentDiag) {
      const wrap = document.getElementById("batch-drying-curve-svg-wrap");
      const subEl = document.getElementById("batch-curve-subtitle");
      const inspBar = document.getElementById("batch-curve-inspector-bar");
      if (!wrap) return;

      // Берем точки из state.batchLogs в хронологическом порядке (от старых к новым)
      const chronological = [...state.batchLogs].reverse();

      if (chronological.length === 0) {
        if (subEl) subEl.textContent = "В журнале пока нет записей. Нажмите «➕ Записать текущую точку» или «📊 Показать прогон Ст.1 ➔ KOMET PlusVac 25».";
        if (inspBar) inspBar.textContent = "Журнал пуст — запишите замер или загрузите эталонный прогон по 4 стадиям.";
        wrap.innerHTML = `
          <div style="padding: 24px; text-align: center; font-family: var(--font-mono); font-size: 12.5px; color: var(--steel-text-secondary);">
            Нет записанных точек в <code>state.batchLogs</code>. Нажмите <b>«📊 Показать прогон Ст.1 ➔ KOMET PlusVac 25»</b> выше, чтобы увидеть кривую сушки поверх эталонного коридора 4 стадий.
          </div>
        `;
        return;
      }

      const stageCorridorFor = stageNum => {
        if (stageNum === 1) return [65, 75];
        if (stageNum === 2) return [50, 62];
        if (stageNum === 3) return [48, 56];
        return [40, 50]; // Стадия 4 + упаковка KOMET PlusVac 25
      };

      const plotItems = chronological.map((entry, idx) => {
        const st = CURING_STAGES[entry.telemetry?.stageKey] || CURING_STAGES.STAGE_1;
        const [refMinRh, refMaxRh] = stageCorridorFor(st.number);
        return {
          idx: idx + 1,
          stageNum: st.number,
          label: `${entry.timestampStr.replace(/Сегодня,\s*|Вчера,\s*/i, "")} (Ст.${st.number})`,
          rh: Math.round(Number(entry.telemetry?.parksideRhPercent ?? 58) * 10) / 10,
          temp: Math.round(Number(entry.telemetry?.environmentTempC ?? 15.8) * 10) / 10,
          dew: Math.round(Number(entry.dewPointC ?? 7.5) * 10) / 10,
          vpd: Number(entry.vpdKpa ?? 0.72).toFixed(2),
          refMinRh,
          refMaxRh,
          isLivePreview: false
        };
      });

      // Всегда добавляем крайнюю правую точку «Сейчас Live», если текущие настройки отличаются или в журнале 1 точка
      if (currentDiag) {
        const stNow = CURING_STAGES[state.telemetry.stageKey] || CURING_STAGES.STAGE_1;
        const [refMinRh, refMaxRh] = stageCorridorFor(stNow.number);
        const lastPt = plotItems[plotItems.length - 1];
        if (plotItems.length === 1 || lastPt.rh !== Math.round(state.telemetry.parksideRhPercent) || lastPt.temp !== state.telemetry.environmentTempC) {
          plotItems.push({
            idx: plotItems.length + 1,
            stageNum: stNow.number,
            label: `LIVE Сейчас (Ст.${stNow.number})`,
            rh: Math.round(Number(state.telemetry.parksideRhPercent) * 10) / 10,
            temp: Math.round(Number(state.telemetry.environmentTempC) * 10) / 10,
            dew: Math.round(Number(currentDiag.dewPointC) * 10) / 10,
            vpd: Number(currentDiag.vpdKpa).toFixed(2),
            refMinRh,
            refMaxRh,
            isLivePreview: true
          });
        }
      }

      lastBatchCurvePlotItems = plotItems;

      if (subEl) {
        subEl.textContent = `Точек на графике: ${plotItems.length} (в журнале: ${state.batchLogs.length}) • Эталонный зеленый коридор влажности от Стадии 1 (65–75% rH) до Стадии 4 и упаковки KOMET PlusVac 25 (40–50% rH).`;
      }

      const W = 900, H = 275, padL = 50, padR = 52, padT = 32, padB = 42;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const n = plotItems.length;

      const xFor = i => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
      // Левая шкала: Влажность rH 35%..95%
      const yForRh = rh => padT + plotH - ((Math.min(95, Math.max(35, rh)) - 35) / 60.0) * plotH;
      // Правая шкала: Температура Environment и Точка росы 0°C..26°C
      const yForTemp = tc => padT + plotH - ((Math.min(26, Math.max(0, tc)) - 0) / 26.0) * plotH;

      // Фоновые зоны 4 стадий (Ст.1 -> Ст.2 -> Ст.3 -> Ст.4 + KOMET PlusVac 25)
      const stageBands = [
        { num: 1, title: "СТ.1 ОТЕПЛИВАНИЕ", sub: "Коридор 65–75% rH", minRh: 65, maxRh: 75, x0: padL, x1: padL + plotW * 0.25 },
        { num: 2, title: "СТ.2 ИНТЕНСИВНАЯ СУШКА", sub: "Коридор 50–62% rH", minRh: 50, maxRh: 62, x0: padL + plotW * 0.25, x1: padL + plotW * 0.52 },
        { num: 3, title: "СТ.3 ВЫРАВНИВАНИЕ", sub: "Коридор 48–56% rH", minRh: 48, maxRh: 56, x0: padL + plotW * 0.52, x1: padL + plotW * 0.77 },
        { num: 4, title: "СТ.4 ЗАКАЛКА ➔ KOMET PLUSVAC 25", sub: "Коридор 40–50% rH", minRh: 40, maxRh: 50, x0: padL + plotW * 0.77, x1: padL + plotW }
      ];

      // Строим плавный эталонный коридор (верхняя и нижняя границы по 4 стадиям)
      const corridorTopPts = [
        `${stageBands[0].x0.toFixed(1)},${yForRh(75).toFixed(1)}`,
        `${stageBands[0].x1.toFixed(1)},${yForRh(70).toFixed(1)}`,
        `${stageBands[1].x1.toFixed(1)},${yForRh(60).toFixed(1)}`,
        `${stageBands[2].x1.toFixed(1)},${yForRh(54).toFixed(1)}`,
        `${stageBands[3].x1.toFixed(1)},${yForRh(48).toFixed(1)}`
      ];
      const corridorBotPts = [
        `${stageBands[3].x1.toFixed(1)},${yForRh(40).toFixed(1)}`,
        `${stageBands[2].x1.toFixed(1)},${yForRh(46).toFixed(1)}`,
        `${stageBands[1].x1.toFixed(1)},${yForRh(50).toFixed(1)}`,
        `${stageBands[0].x1.toFixed(1)},${yForRh(62).toFixed(1)}`,
        `${stageBands[0].x0.toFixed(1)},${yForRh(65).toFixed(1)}`
      ];
      const corridorPolygonPoints = [...corridorTopPts, ...corridorBotPts].join(" ");

      const stageZonesSvg = stageBands.map((b, idx) => `
        <rect x="${b.x0.toFixed(1)}" y="${padT}" width="${(b.x1 - b.x0).toFixed(1)}" height="${plotH}"
              fill="${idx % 2 === 0 ? 'rgba(15, 30, 50, 0.32)' : 'rgba(8, 17, 29, 0.32)'}"
              stroke="rgba(159, 179, 200, 0.14)" stroke-dasharray="3,3" />
        <text x="${((b.x0 + b.x1) / 2).toFixed(1)}" y="${padT - 15}" fill="#2EE59D" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">${b.title}</text>
        <text x="${((b.x0 + b.x1) / 2).toFixed(1)}" y="${padT - 4}" fill="#9FB3C8" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">${b.sub}</text>
      `).join("");

      const rhPointsStr = plotItems.map((p, i) => `${xFor(i).toFixed(1)},${yForRh(p.rh).toFixed(1)}`).join(" ");
      const rhAreaStr = `${xFor(0).toFixed(1)},${(padT + plotH).toFixed(1)} ${rhPointsStr} ${xFor(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)}`;
      const tempPointsStr = plotItems.map((p, i) => `${xFor(i).toFixed(1)},${yForTemp(p.temp).toFixed(1)}`).join(" ");
      const dewPointsStr = plotItems.map((p, i) => `${xFor(i).toFixed(1)},${yForTemp(p.dew).toFixed(1)}`).join(" ");

      const gridValuesRh = [40, 50, 60, 70, 85];
      const gridSvg = gridValuesRh.map(rhVal => {
        const y = yForRh(rhVal).toFixed(1);
        const eqTemp = Math.round(((rhVal - 35) / 60.0) * 26);
        const is85 = rhVal === 85;
        return `
          <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"
                stroke="${is85 ? 'rgba(255,82,82,0.65)' : 'rgba(159,179,200,0.14)'}"
                stroke-width="${is85 ? '1.6' : '1'}"
                ${is85 ? 'stroke-dasharray="6,4"' : ''} />
          <text x="${padL - 8}" y="${Number(y) + 4}" fill="${is85 ? '#FF5252' : '#00E5FF'}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="end">${rhVal}%</text>
          <text x="${W - padR + 8}" y="${Number(y) + 4}" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="start">${eqTemp}°C</text>
        `;
      }).join("");

      const nodesSvg = plotItems.map((p, i) => {
        const cx = xFor(i).toFixed(1);
        const cyRh = yForRh(p.rh).toFixed(1);
        const cyTemp = yForTemp(p.temp).toFixed(1);
        const cyDew = yForTemp(p.dew).toFixed(1);
        const showStep = n <= 9 || i === 0 || i === n - 1 || i % Math.ceil(n / 6) === 0;
        const ptFill = p.isLivePreview ? "#2EE59D" : "#00E5FF";
        return `
          <g onmouseenter="inspectBatchCurvePoint(${i})" onclick="inspectBatchCurvePoint(${i})" style="cursor:pointer;">
            <!-- Вертикальная направляющая точки -->
            <line x1="${cx}" y1="${padT}" x2="${cx}" y2="${padT + plotH}" stroke="rgba(0,229,255,0.12)" stroke-width="1" />
            <!-- Точка Parkside rH (%) -->
            <circle class="scada-chart-point" cx="${cx}" cy="${cyRh}" r="${p.isLivePreview ? '6' : '4.8'}" fill="${ptFill}" stroke="#08111D" stroke-width="1.8">
              <title>${p.label}: Влажность Parkside rH = ${p.rh}% (Эталон: ${p.refMinRh}–${p.refMaxRh}%)</title>
            </circle>
            ${showStep ? `<text x="${cx}" y="${Number(cyRh) - 9}" fill="${ptFill}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="middle">${p.rh}%</text>` : ""}

            <!-- Точка Environment (°C) -->
            <circle class="scada-chart-point" cx="${cx}" cy="${cyTemp}" r="4.0" fill="#FFA726" stroke="#08111D" stroke-width="1.5">
              <title>${p.label}: Температура Environment = ${p.temp}°C</title>
            </circle>
            ${showStep ? `<text x="${cx}" y="${Number(cyTemp) - 8}" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">${p.temp}°C</text>` : ""}

            <!-- Точка росы Dew Point (°C) -->
            <circle cx="${cx}" cy="${cyDew}" r="3.4" fill="#00E676" stroke="#08111D" stroke-width="1.4">
              <title>${p.label}: Точка росы = ${p.dew}°C</title>
            </circle>
            ${showStep ? `<text x="${cx}" y="${Number(cyDew) + 13}" fill="#00E676" font-family="JetBrains Mono, monospace" font-size="9" text-anchor="middle">Тр ${p.dew}°</text>` : ""}

            <!-- Подпись времени/стадии по оси X -->
            ${showStep ? `<text x="${cx}" y="${H - 12}" fill="${p.isLivePreview ? '#2EE59D' : '#9FB3C8'}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="${p.isLivePreview ? '700' : '400'}" text-anchor="middle">${p.label}</text>` : ""}
          </g>
        `;
      }).join("");

      batchCurveGeom = { W, H, padL, padR, padT, padB, plotW, plotH, xFor, yForRh, yForTemp };

      wrap.innerHTML = `
        <svg id="batch-curve-main-svg" viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; min-width:640px; display:block; cursor:crosshair; user-select:none;"
             onmousemove="onBatchCurvePointerMove(event)" ontouchstart="onBatchCurvePointerMove(event)" ontouchmove="onBatchCurvePointerMove(event)" onmouseleave="onBatchCurvePointerLeave()">
          <defs>
            <linearGradient id="batchRhGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#00E5FF" stop-opacity="0.02"/>
            </linearGradient>
            <linearGradient id="corridorRefGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#2EE59D" stop-opacity="0.26"/>
              <stop offset="50%" stop-color="#00E5FF" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#2EE59D" stop-opacity="0.30"/>
            </linearGradient>
          </defs>

          <!-- 4 зоны стадий от Стадии 1 до упаковки на KOMET PlusVac 25 -->
          ${stageZonesSvg}

          <!-- Эталонный коридор влажности по 4 стадиям -->
          <polygon points="${corridorPolygonPoints}" fill="url(#corridorRefGrad)" stroke="rgba(46, 229, 157, 0.65)" stroke-width="1.5" stroke-dasharray="5,3" />

          ${gridSvg}

          <!-- Заливка и линия влажности Parkside rH (%) -->
          <polygon points="${rhAreaStr}" fill="url(#batchRhGrad)" />
          <polyline fill="none" stroke="#00E5FF" stroke-width="3.0" points="${rhPointsStr}" />
          <!-- Линия температуры Environment (°C) -->
          <polyline fill="none" stroke="#FFA726" stroke-width="2.4" points="${tempPointsStr}" />
          <!-- Линия точки росы Dew Point (°C) -->
          <polyline fill="none" stroke="#00E676" stroke-width="2.0" stroke-dasharray="5,3" points="${dewPointsStr}" />

          ${nodesSvg}

          <!-- Живой вертикальный прицел (Crosshair) при касании пальцем / наведении мышки -->
          <g id="batch-curve-crosshair-group" style="display:none; pointer-events:none;">
            <line id="batch-curve-crosshair-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="4,3" />
            <line id="batch-curve-crosshair-hline" x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(0, 229, 255, 0.55)" stroke-width="1.1" stroke-dasharray="3,3" />
            <circle id="batch-curve-crosshair-rh-dot" cx="${padL}" cy="${padT}" r="6.2" fill="#00E5FF" stroke="#FFFFFF" stroke-width="2" />
            <circle id="batch-curve-crosshair-temp-dot" cx="${padL}" cy="${padT}" r="5.2" fill="#FFA726" stroke="#08111D" stroke-width="2" />
            <circle id="batch-curve-crosshair-dew-dot" cx="${padL}" cy="${padT}" r="4.5" fill="#00E676" stroke="#08111D" stroke-width="1.8" />
            <rect id="batch-curve-crosshair-badge-bg" x="${padL}" y="2" width="240" height="20" rx="6" fill="rgba(4, 10, 20, 0.96)" stroke="#00E5FF" stroke-width="1.2" />
            <text id="batch-curve-crosshair-badge-txt" x="${padL + 120}" y="15" fill="#FFFFFF" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle"></text>
          </g>
        </svg>
      `;

      inspectBatchCurvePoint(plotItems.length - 1);
    }


    // ==================== 🚨 АВАРИЙНЫЙ АУДИО-СИНТЕЗАТОР (WEB AUDIO API) ====================
    let scadaAudioCtx = null;
    let scadaAlarmOsc1 = null;
    let scadaAlarmOsc2 = null;
    let scadaAlarmGain = null;
    let scadaAlarmInterval = null;
    let isScadaAlarmRinging = false;
    let isScadaAlarmMuted = false;
    let isScadaEmergencyActive = false;

    function initScadaAudioContext() {
      if (!scadaAudioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          scadaAudioCtx = new AudioContextClass();
        }
      }
      if (scadaAudioCtx && scadaAudioCtx.state === "suspended") {
        scadaAudioCtx.resume().catch(() => {});
      }
    }

    function startScadaEmergencyAudio() {
      if (isScadaAlarmRinging || isScadaAlarmMuted) return;
      try {
        initScadaAudioContext();
        if (!scadaAudioCtx) return;

        isScadaAlarmRinging = true;
        scadaAlarmOsc1 = scadaAudioCtx.createOscillator();
        scadaAlarmOsc2 = scadaAudioCtx.createOscillator();
        scadaAlarmGain = scadaAudioCtx.createGain();

        scadaAlarmOsc1.type = "sawtooth";
        scadaAlarmOsc2.type = "sine";
        scadaAlarmOsc1.frequency.setValueAtTime(880, scadaAudioCtx.currentTime);
        scadaAlarmOsc2.frequency.setValueAtTime(660, scadaAudioCtx.currentTime);

        scadaAlarmGain.gain.setValueAtTime(0.12, scadaAudioCtx.currentTime);

        scadaAlarmOsc1.connect(scadaAlarmGain);
        scadaAlarmOsc2.connect(scadaAlarmGain);
        scadaAlarmGain.connect(scadaAudioCtx.destination);

        scadaAlarmOsc1.start();
        scadaAlarmOsc2.start();

        let toggle = false;
        scadaAlarmInterval = setInterval(() => {
          if (!isScadaAlarmRinging || !scadaAudioCtx) return;
          toggle = !toggle;
          const freq1 = toggle ? 880 : 700;
          const freq2 = toggle ? 660 : 520;
          const t = scadaAudioCtx.currentTime;
          scadaAlarmOsc1.frequency.setValueAtTime(freq1, t);
          scadaAlarmOsc2.frequency.setValueAtTime(freq2, t);
        }, 350);
      } catch (e) {
        console.warn("Audio alarm start error:", e);
      }
    }

    function stopScadaEmergencyAudio() {
      isScadaAlarmRinging = false;
      if (scadaAlarmInterval) {
        clearInterval(scadaAlarmInterval);
        scadaAlarmInterval = null;
      }
      try {
        if (scadaAlarmGain && scadaAudioCtx) {
          scadaAlarmGain.gain.setValueAtTime(0, scadaAudioCtx.currentTime);
        }
        if (scadaAlarmOsc1) { scadaAlarmOsc1.stop(); scadaAlarmOsc1.disconnect(); scadaAlarmOsc1 = null; }
        if (scadaAlarmOsc2) { scadaAlarmOsc2.stop(); scadaAlarmOsc2.disconnect(); scadaAlarmOsc2 = null; }
      } catch (e) {}
    }

    function toggleScadaAlarmMute() {
      isScadaAlarmMuted = !isScadaAlarmMuted;
      triggerHaptic(20);
      if (isScadaAlarmMuted) {
        stopScadaEmergencyAudio();
        if (typeof showToast === "function") showToast("🔇 Звук сирены заглушен дежурным технологом");
      } else {
        if (typeof showToast === "function") showToast("🔊 Аварийная сирена активна");
      }
      updateAlarmUiStatus();
    }

    function updateAlarmUiStatus() {
      const btn = document.getElementById("btn-alarm-mute");
      const mobBtn = document.getElementById("mob-alarm-mute-btn");
      const vig = document.getElementById("scada-emergency-vignette");

      [btn, mobBtn].forEach(b => {
        if (!b) return;
        if (isScadaEmergencyActive) {
          b.style.display = "inline-flex";
          if (isScadaAlarmMuted) {
            b.className = "scada-alarm-btn muted";
            b.innerHTML = "<span>🔇</span> <span>Тревога принята</span>";
          } else {
            b.className = "scada-alarm-btn";
            b.innerHTML = "<span>🚨</span> <span>СИРЕНА (MUTE)</span>";
          }
        } else {
          b.style.display = "none";
        }
      });

      if (vig) {
        vig.classList.toggle("active", isScadaEmergencyActive);
      }
    }

    function checkAndDispatchEmergencyAlarm(diag) {
      if (!diag) return;
      const isEmergency = Boolean(
        diag.thermalDamageRisk === "CRITICAL" ||
        diag.caseHardeningRisk === "CRITICAL" ||
        diag.eevStatus === "CRITICAL"
      );

      isScadaEmergencyActive = isEmergency;

      if (isEmergency) {
        if (!isScadaAlarmMuted) {
          startScadaEmergencyAudio();
        }
      } else {
        stopScadaEmergencyAudio();
      }
      updateAlarmUiStatus();
    }


    // ==================== 🎛️ ИНТЕРАКТИВНЫЙ ВИЗУАЛЬНЫЙ ГИД MCGS ====================
    let currentMcgsGuidePhase = 1;

    function openMcgsScreenGuide(phaseNum = 1) {
      triggerHaptic(15);
      initScadaAudioContext();
      currentMcgsGuidePhase = Math.max(1, Math.min(8, parseInt(phaseNum, 10) || 1));

      let modal = document.getElementById("mcgs-screen-guide-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "mcgs-screen-guide-modal";
        document.body.appendChild(modal);
      }

      renderMcgsScreenGuideModal();
      modal.style.display = "flex";
    }

    function closeMcgsScreenGuide() {
      triggerHaptic(10);
      const modal = document.getElementById("mcgs-screen-guide-modal");
      if (modal) modal.remove();
    }

    function renderMcgsScreenGuideModal() {
      const modal = document.getElementById("mcgs-screen-guide-modal");
      if (!modal) return;

      const t = (typeof state !== "undefined" && state && state.telemetry) ? state.telemetry : { speciesKey: "VIMBA", stageKey: "STAGE_2", batchWeightKg: 1000 };
      const diag = (typeof analyzeBioscience === "function") ? analyzeBioscience(t) : null;
      const phases = (diag && diag.mcgsPhases) ? diag.mcgsPhases : (typeof generateMcgsTableForStage === "function" ? generateMcgsTableForStage(t) : []);
      
      const ph = phases.find(p => p.phaseNumber === currentMcgsGuidePhase) || phases[0] || {
        phaseNumber: currentMcgsGuidePhase,
        modeLabel: currentMcgsGuidePhase % 2 === 1 ? "СУШКА" : "ПАУЗА",
        tempSetpointC: 15.8,
        humiSetpointPercent: 58,
        durationHours: 3.5,
        cantoniFreqHz: "30 Гц",
        cantoniVoltageV: "9.0V",
        circuitsNote: "Контур №1"
      };

      const isOdd = ph.phaseNumber % 2 === 1;
      const isBuffer = ph.phaseNumber === 8;
      let modeBadge = isBuffer ? "🛡 БУФЕРНОЕ ХРАНЕНИЕ" : (isOdd ? "⚡ АКТИВНАЯ СУШКА" : "⏸ ОТДЫХ / ПАУЗА");
      let modeCol = isBuffer ? "#00E5FF" : (isOdd ? "#2EE59D" : "#FFA726");
      let invHz = isBuffer ? "15–20 Гц" : (isOdd ? "30 Гц" : "15–20 Гц");
      let invVolt = isBuffer ? "4.5–5.0V" : (isOdd ? "9.0V" : "4.5–5.0V");

      modal.innerHTML = `
        <div class="mcgs-frame-box">
          <div class="mcgs-bezel-head">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:22px;">🎛️</span>
              <div>
                <div style="font-family:var(--font-mono); font-size:13px; font-weight:800; color:#FFF; letter-spacing:0.5px;">
                  ПРОГРАММАТОР ШКАФА MCGS TPC7062Ti
                </div>
                <div style="font-size:11px; color:#9FB3C8;">Сушильно-климатический комплекс AIM AGHD-250ELC</div>
              </div>
            </div>
            <button onclick="closeMcgsScreenGuide()" style="background:none; border:none; color:#FF5252; font-size:22px; cursor:pointer; padding:4px 8px; font-weight:900;">✕</button>
          </div>

          <!-- Переключатель фаз 1..8 -->
          <div style="display:flex; gap:4px; overflow-x:auto; padding:10px 14px 4px 14px; background:#050D18; border-bottom:1px solid #162B45;">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `
              <button onclick="openMcgsScreenGuide(${n})" style="flex:1; min-width:44px; padding:6px 0; border-radius:8px; font-weight:800; font-family:var(--font-mono); font-size:12px; cursor:pointer; background:${n === currentMcgsGuidePhase ? '#00E5FF' : '#0E1E33'}; color:${n === currentMcgsGuidePhase ? '#000' : '#CBD5E1'}; border:1px solid ${n === currentMcgsGuidePhase ? '#00E5FF' : '#1E395B'};">
                Ф${n}
              </button>
            `).join("")}
          </div>

          <!-- Графическая панель HMI MCGS -->
          <div class="mcgs-lcd-screen">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,229,255,0.3); padding-bottom:6px; margin-bottom:10px;">
              <span style="font-family:var(--font-mono); font-size:11px; color:#00E5FF; font-weight:700;">HMI MCGS Embedded • ФАЗА ${ph.phaseNumber}</span>
              <span style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${modeCol}; padding:2px 8px; border-radius:4px; background:rgba(255,255,255,0.06); border:1px solid ${modeCol};">
                ${modeBadge}
              </span>
            </div>

            <div style="font-size:11px; color:#9FB3C8; margin-bottom:10px;">
              Нажмите на сенсорном экране шкафа соответствующие поля и введите точные значения:
            </div>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px;">
              <div class="mcgs-touch-cell" style="border-color:#00E5FF;">
                <div style="font-size:10px; color:#9FB3C8; font-weight:700;">1. ТЕМПЕРАТУРА</div>
                <div style="font-family:var(--font-mono); font-size:22px; font-weight:900; color:#00E5FF; margin:4px 0;">${ph.tempSetpointC}°C</div>
                <div style="font-size:9.5px; color:#CBD5E1;">Ячейка: Temp SP</div>
              </div>
              <div class="mcgs-touch-cell" style="border-color:#38BDF8;">
                <div style="font-size:10px; color:#9FB3C8; font-weight:700;">2. ВЛАЖНОСТЬ</div>
                <div style="font-family:var(--font-mono); font-size:22px; font-weight:900; color:#38BDF8; margin:4px 0;">${ph.humiSetpointPercent}%</div>
                <div style="font-size:9.5px; color:#CBD5E1;">Ячейка: Humi SP</div>
              </div>
              <div class="mcgs-touch-cell" style="border-color:#FFA726;">
                <div style="font-size:10px; color:#9FB3C8; font-weight:700;">3. ВРЕМЯ ФАЗЫ</div>
                <div style="font-family:var(--font-mono); font-size:22px; font-weight:900; color:#FFA726; margin:4px 0;">${ph.durationHours} ч</div>
                <div style="font-size:9.5px; color:#CBD5E1;">Ячейка: Time SP</div>
              </div>
            </div>

            <!-- Шпаргалка системных уставок контроллера -->
            <div style="background:rgba(6,14,24,0.9); border:1px solid #1C3554; border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:5px; font-size:11.5px;">
              <div style="font-weight:800; color:#00E5FF; font-size:11.5px; margin-bottom:2px;">
                ⚙️ ПРОВЕРКА СИСТЕМНЫХ УСТАВОК ШКАФА (AIM 250ELC):
              </div>
              <div style="display:flex; justify-content:space-between; color:#E2E8F0;">
                <span>• ЭРВ (EEV control):</span>
                <b style="font-family:var(--font-mono); color:#2EE59D;">0 (Автоматическое)</b>
              </div>
              <div style="display:flex; justify-content:space-between; color:#E2E8F0;">
                <span>• Стартовое открытие (Default Open):</span>
                <b style="font-family:var(--font-mono); color:#2EE59D;">170 step</b>
              </div>
              <div style="display:flex; justify-content:space-between; color:#E2E8F0;">
                <span>• Железный минимум шагов (MinimumStep):</span>
                <b style="font-family:var(--font-mono); color:#FF5252;">75 step (ЗАПРЕТ НИЖЕ!)</b>
              </div>
              <div style="display:flex; justify-content:space-between; color:#E2E8F0;">
                <span>• Цикл оттайки (DefrostCycle):</span>
                <b style="font-family:var(--font-mono); color:#2EE59D;">40 мин</b>
              </div>
              <div style="border-top:1px dashed #1C3554; padding-top:5px; margin-top:3px; display:flex; justify-content:space-between; color:#E2E8F0;">
                <span>• Напряжение частотника Hapn HPVF 4.0kW:</span>
                <b style="font-family:var(--font-mono); color:${modeCol};">${invVolt} / ${invHz}</b>
              </div>
            </div>
          </div>

          <div style="padding:10px 14px 14px 14px; display:flex; justify-content:flex-end;">
            <button class="mob-action-btn" style="background:#0F2942; border:1px solid #00E5FF; color:#00E5FF; width:auto; padding:8px 18px;" onclick="closeMcgsScreenGuide()">
              ✅ Запомнил уставки • Закрыть
            </button>
          </div>
        </div>
      `;
    }

export function applyPreset(idx) {
  triggerHaptic(14);
  const p = SAMPLE_PRESETS[idx];
  if (!p) return;
  state.telemetry = {
    ...p.telemetry,
    batchStartMs: Date.now(),
    targetWaterLiters: null,
    controlBundleWeights: []
  };
  if (typeof renderAll === "function") renderAll();
  showToast("📌 Применен пресет: " + p.label);
}

export function startBatchNow() {
  state.telemetry.batchStartMs = Date.now();
  const diag = typeof analyzeBioscience === "function" ? analyzeBioscience(state.telemetry) : null;
  state.telemetry.targetWaterLiters = (diag && diag.yieldForecast && diag.yieldForecast.totalWaterAvgLiters) ? diag.yieldForecast.totalWaterAvgLiters : 480;
  if (typeof persistStateToStorage === "function") persistStateToStorage();
  if (typeof renderAll === "function") renderAll();
  if (typeof showToast === "function") showToast("▶ Партия запущена. Расчёт отдачи воды включён.");
}

export function setHeatRecoveryMode(modeKey) {
  triggerHaptic(12);
  state.telemetry.heatRecoveryMode = modeKey;
  if (typeof renderAll === "function") renderAll();
  const obj = HEAT_RECOVERY_MODES[modeKey] || HEAT_RECOVERY_MODES.WINTER_14KW;
  showToast(`♨️ ${obj.shortBadgeRu}: ${obj.titleRu}`);
}

export function setCircuits(num) {
  triggerHaptic(12);
  state.telemetry.activeCircuitsRunning = num;
  if (typeof renderAll === "function") renderAll();
  showToast(`❄️ Включено компрессорных контуров: ${num}к`);
}

export function onNumericInput(field, rawValue) {
  const val = parseFloat(rawValue);
  if (isNaN(val)) return;
  triggerHaptic(12, true);
  state.customAiAdvice = null;
  if (field === "env") state.telemetry.environmentTempC = Math.round(Math.min(35, Math.max(5, val)) * 10) / 10;
  if (field === "rh") state.telemetry.parksideRhPercent = Math.round(Math.min(99, Math.max(15, val)));
  if (field === "eev") state.telemetry.eev1Steps = Math.round(Math.min(500, Math.max(0, val)));
  if (field === "coil") state.telemetry.dehumicoilTempC = Math.round(Math.min(20, Math.max(-10, val)) * 10) / 10;
  if (field === "scaleTemp") state.telemetry.scaleSurfaceTempC = Math.round(Math.min(35, Math.max(2, val)) * 10) / 10;
  if (field === "spineMoist") state.telemetry.spineMoistureGmPercent = Math.round(Math.min(85, Math.max(20, val)) * 10) / 10;
  if (typeof renderAll === "function") renderAll();
}

export function stepTelemetry(field, delta) {
  triggerHaptic(12);
  state.customAiAdvice = null;
  if (field === "env") state.telemetry.environmentTempC = Math.round((state.telemetry.environmentTempC + delta) * 10) / 10;
  if (field === "rh") state.telemetry.parksideRhPercent = Math.min(98, Math.max(20, Math.round(state.telemetry.parksideRhPercent + delta)));
  if (field === "eev") state.telemetry.eev1Steps = Math.min(500, Math.max(0, state.telemetry.eev1Steps + delta));
  if (field === "coil") state.telemetry.dehumicoilTempC = Math.round((state.telemetry.dehumicoilTempC + delta) * 10) / 10;
  if (field === "scaleTemp") {
    const cur = Number(state.telemetry.scaleSurfaceTempC ?? (state.telemetry.environmentTempC - 1.3));
    state.telemetry.scaleSurfaceTempC = Math.round(Math.min(35, Math.max(2, cur + delta)) * 10) / 10;
  }
  if (field === "spineMoist") {
    const curM = Number(state.telemetry.spineMoistureGmPercent ?? 48.0);
    state.telemetry.spineMoistureGmPercent = Math.round(Math.min(85, Math.max(20, curM + delta)) * 10) / 10;
  }
  if (typeof renderAll === "function") renderAll();
}

export function onPsychrometerInput() {
  triggerHaptic(10, true);
  const dryEl = document.getElementById("num-psychro-dry");
  const wetEl = document.getElementById("num-psychro-wet");
  if (!dryEl || !wetEl) return;
  const td = parseFloat(dryEl.value);
  const tw = parseFloat(wetEl.value);
  if (!isNaN(td)) state.telemetry.psychroDryC = Math.round(Math.min(38, Math.max(2, td)) * 10) / 10;
  if (!isNaN(tw)) state.telemetry.psychroWetC = Math.round(Math.min(38, Math.max(0, tw)) * 10) / 10;
  if (typeof renderAll === "function") renderAll();
}

export function applyPsychrometerToAdvisor() {
  triggerHaptic(12);
  const psy = calculateRegnaultPsychrometer(state.telemetry.psychroDryC, state.telemetry.psychroWetC);
  state.telemetry.environmentTempC = psy.dryC;
  state.telemetry.parksideRhPercent = Math.round(psy.rhPercent);
  state.customAiAdvice = null;
  if (typeof renderAll === "function") renderAll();
  showToast(`Данные психрометра Реньо переданы в Советник: Т=${psy.dryC}°C, rH=${Math.round(psy.rhPercent)}% (Т.росы ${psy.dewPointC}°C)`);
}

export function updateVacuumPiecesCount(val) {
  const pcs = parseInt(val, 10);
  if (!isNaN(pcs) && pcs > 0) {
    triggerHaptic(10, true);
    state.telemetry.vacuumPiecesCount = Math.min(50000, Math.max(1, pcs));
    if (typeof renderAll === "function") renderAll();
  }
}

export function updateBatchWeight(val) {
  const kg = parseInt(val, 10);
  if (!isNaN(kg) && kg > 0) {
    triggerHaptic(12, true);
    if (typeof syncActiveBatch === "function") {
      syncActiveBatch("telemetry", null, kg);
    } else {
      state.telemetry.batchWeightKg = kg;
    }
    state.customAiAdvice = null;
    if (typeof renderAll === "function") renderAll();
  }
}

export function setBatchWeight(val) {
  triggerHaptic(12);
  updateBatchWeight(val);
}

export function stepBatchWeight(delta) {
  triggerHaptic(12);
  const cur = Number(state.telemetry.batchWeightKg || 1850);
  const nextKg = Math.min(10000, Math.max(50, Math.round(cur + Number(delta || 0))));
  updateBatchWeight(nextKg);
}

export function selectSpecies(speciesKey) {
  triggerHaptic(12);
  if (typeof syncActiveBatch === "function") {
    syncActiveBatch("telemetry", speciesKey, state.telemetry.batchWeightKg);
  }
  const sp = FISH_SPECIES[speciesKey] || FISH_SPECIES.VIMBA;
  const st = CURING_STAGES[state.telemetry.stageKey] || CURING_STAGES.STAGE_2;
  const midTemp = Math.round(((sp.tempRangeMonoC[0] + sp.tempRangeMonoC[1]) / 2.0) * 10) / 10;
  state.telemetry.speciesKey = speciesKey;
  state.telemetry.environmentTempC = st.key === "STAGE_4" ? 14.0 : midTemp;
  state.telemetry.visualNotes = sp.bioFeatureRu;
  state.customAiAdvice = null;
  if (typeof renderAll === "function") renderAll();
  if (typeof checkProactiveMemoryReminder === "function") checkProactiveMemoryReminder(speciesKey);
}

export function selectStage(stageKey) {
  triggerHaptic(12);
  const st = CURING_STAGES[stageKey] || CURING_STAGES.STAGE_2;
  const sp = FISH_SPECIES[state.telemetry.speciesKey] || FISH_SPECIES.VIMBA;
  const range = targetTempRangeFor(sp, st, state.telemetry.coLoadWithVimba);
  state.telemetry.stageKey = stageKey;
  state.telemetry.environmentTempC = Math.round(((range[0] + range[1]) / 2.0) * 10) / 10;
  state.telemetry.parksideRhPercent = Math.round((st.targetShelfRhRange[0] + st.targetShelfRhRange[1]) / 2.0);
  state.telemetry.activeCircuitsRunning = st.activeCircuitsCount;
  state.telemetry.phaseStartTimestampMs = Date.now();
  state.customAiAdvice = null;
  if (typeof activeParksideAnalysis !== "undefined" && activeParksideAnalysis && Array.isArray(activeParksideAnalysis.points) && activeParksideAnalysis.points.length >= 2) {
    if (typeof analyzeParksidePoints === "function" && typeof renderParksideChartAndVerdict === "function") {
      const prevProfileKey = activeParksideAnalysis.profileKey || null;
      const reanalyzed = analyzeParksidePoints(activeParksideAnalysis.fileName, activeParksideAnalysis.points);
      if (reanalyzed) {
        reanalyzed.profileKey = prevProfileKey;
        renderParksideChartAndVerdict(reanalyzed);
      }
    }
  }
  if (typeof renderAll === "function") renderAll();
}

export function setPausePhase(isPause) {
  triggerHaptic(14);
  const changed = state.telemetry.isPausePhaseNow !== Boolean(isPause);
  state.telemetry.isPausePhaseNow = Boolean(isPause);
  state.telemetry.phaseStartTimestampMs = Date.now();
  lastPhaseCycleIndex = 0;
  state.customAiAdvice = null;
  if (typeof renderAll === "function") renderAll();
  if (changed) {
    announcePhaseChangeIfEnabled(Boolean(isPause), true);
  }
}

export function toggleCoLoad(checked) {
  triggerHaptic(12);
  state.telemetry.coLoadWithVimba = Boolean(checked);
  state.customAiAdvice = null;
  if (typeof renderAll === "function") renderAll();
}

export function saveBatchToLog() {
  const diag = analyzeBioscience(state.telemetry);
  const now = new Date();
  const stamp = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) + " • " +
                now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  state.batchLogs.unshift({
    id: Date.now(),
    timestampStr: stamp,
    telemetry: { ...state.telemetry },
    dewPointC: diag.dewPointC,
    vpdKpa: diag.vpdKpa,
    adviceText: state.customAiAdvice || diag.instantAdvisorSummary
  });
  persistStateToStorage();
  if (typeof renderAll === "function") renderAll();
  showToast("Замер записан в журнал Parkside и сохранен в localStorage");
}

export function clearBatchLogs() {
  if (state.batchLogs.length === 0) {
    showToast("Журнал замеров уже пуст");
    return;
  }
  const ok = confirm(`Вы уверены, что хотите очистить весь журнал замеров логгера Parkside (${state.batchLogs.length} зап.)? Записи будут удалены из localStorage браузера.`);
  if (!ok) return;
  state.batchLogs = [];
  persistStateToStorage();
  if (typeof renderAll === "function") renderAll();
  showToast("Журнал замеров логгера Parkside очищен");
}

export function exportAllBatchLogsCsv() {
  if (state.batchLogs.length === 0) {
    showToast("Журнал замеров пуст — сначала запишите хотя бы один замер!");
    return;
  }
  const esc = s => String(s ?? "").replace(/[\r\n]+/g, " ").replace(/;/g, ",").trim();
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const fileName = `AIM250_PARKSIDE_LOG_${stamp}.csv`;

  const header = [
    "ID",
    "Дата и время",
    "Вид рыбы",
    "Стадия вяления",
    "Фаза обдува",
    "Загрузка (кг)",
    "Т камеры (°C)",
    "Влажность rH (%)",
    "Точка росы (°C)",
    "VPD (кПа)",
    "1#EEV (step)",
    "1#Dehumicoil (°C)",
    "Активных контуров",
    "Вердикт Советника"
  ].join(";");

  const lines = [
    header,
    ...state.batchLogs.map(entry => {
      const sp = FISH_SPECIES[entry.telemetry.speciesKey] || { titleRu: entry.telemetry.speciesKey };
      const st = CURING_STAGES[entry.telemetry.stageKey] || { number: "?", titleRu: entry.telemetry.stageKey };
      const phaseName = entry.telemetry.isPausePhaseNow ? "ПАУЗА" : "СУШКА";
      return [
        entry.id,
        esc(entry.timestampStr),
        esc(sp.titleRu),
        `Стадия ${st.number}: ${esc(st.titleRu)}`,
        phaseName,
        entry.telemetry.batchWeightKg ?? 1850,
        entry.telemetry.environmentTempC ?? 15.8,
        Math.round(entry.telemetry.parksideRhPercent ?? 58),
        entry.dewPointC ?? "",
        entry.vpdKpa ?? "",
        entry.telemetry.eev1Steps ?? 205,
        entry.telemetry.dehumicoilTempC ?? 5.2,
        entry.telemetry.activeCircuitsRunning ?? st.activeCircuitsCount,
        esc(entry.adviceText)
      ].join(";");
    })
  ];

  const csvContent = "\uFEFF" + lines.join("\r\n");
  state.activeCsvResult = { fileName, csvContent };
  const fnEl = document.getElementById("csv-modal-filename");
  const prevEl = document.getElementById("csv-modal-preview");
  const modalEl = document.getElementById("csv-modal");
  if (fnEl) fnEl.textContent = fileName;
  if (prevEl) prevEl.textContent = csvContent.replace(/^\uFEFF/, "");
  if (modalEl) modalEl.classList.add("open");
  if (typeof downloadActiveCsv === "function") downloadActiveCsv();
}

let mcgsMobilePhaseFilter = "ALL";
export function setMcgsPhaseFilter(filterVal) {
  triggerHaptic(12);
  mcgsMobilePhaseFilter = filterVal;
  if (typeof renderAll === "function") renderAll();
  if (typeof checkStageMemoryReminder === "function") checkStageMemoryReminder(state.telemetry.stageKey);
}

export function toggleMobileMcgsTable() {
  triggerHaptic(12);
  document.body.classList.toggle("show-mobile-mcgs-table");
  const isShown = document.body.classList.contains("show-mobile-mcgs-table");
  showToast(isShown ? "📊 Показана полная сводная таблица 8 фаз MCGS" : "📱 Показаны крупные карточки фаз Ф1–Ф8");
}

export function applyMcgsPhaseToChamber(phaseNumber) {
  triggerHaptic(15);
  const diag = analyzeBioscience(state.telemetry);
  const ph = (diag.mcgsPhases || []).find(p => p.phaseNumber === Number(phaseNumber));
  if (!ph) return;
  state.telemetry.environmentTempC = Number(ph.tempSetpointC);
  state.telemetry.parksideRhPercent = Number(ph.humiSetpointPercent);
  state.telemetry.isPausePhaseNow = (ph.phaseNumber % 2 === 0 && ph.phaseNumber !== 8);
  state.telemetry.phaseStartTimestampMs = Date.now();
  state.customAiAdvice = null;
  if (typeof renderAll === "function") renderAll();
  showToast(`▶ Применены уставки Фазы Ф${ph.phaseNumber} (${ph.modeLabel}): Temp ${ph.tempSetpointC}°C, Humi ${ph.humiSetpointPercent}%`);
}

export function openFullscreenMimicModal() {
  triggerHaptic(15);
  const modal = document.getElementById("mimic-fullscreen-modal");
  if (modal) {
    modal.classList.add("open");
    const srcSvg = document.getElementById("scada-chamber-desktop-svg");
    const slot = document.getElementById("mimic-fullscreen-svg-slot");
    if (srcSvg && slot) {
      slot.innerHTML = srcSvg.outerHTML.replace('id="scada-chamber-desktop-svg"', 'id="scada-chamber-fullscreen-svg" style="width:100%; min-width:860px; height:auto; display:block;"');
    }
  }
}

export function closeFullscreenMimicModal() {
  triggerHaptic(10);
  const modal = document.getElementById("mimic-fullscreen-modal");
  if (modal) modal.classList.remove("open");
}

export {
  renderBatchDryingCurveSvg,
  renderPhaseTimerHud,
  resetPhaseTimerNow,
  renderScadaChamberMimicSvg,
  initScadaAudioContext,
  startScadaEmergencyAudio,
  stopScadaEmergencyAudio,
  toggleScadaAlarmMute,
  updateAlarmUiStatus,
  checkAndDispatchEmergencyAlarm,
  openMcgsScreenGuide,
  closeMcgsScreenGuide,
  renderMcgsScreenGuideModal,
  loadFull4StageDemoBatchLogs
};

if (typeof window !== "undefined") {
  window.renderBatchDryingCurveSvg = renderBatchDryingCurveSvg;
  window.renderPhaseTimerHud = renderPhaseTimerHud;
  window.resetPhaseTimerNow = resetPhaseTimerNow;
  window.renderScadaChamberMimicSvg = renderScadaChamberMimicSvg;
  window.initScadaAudioContext = initScadaAudioContext;
  window.startScadaEmergencyAudio = startScadaEmergencyAudio;
  window.stopScadaEmergencyAudio = stopScadaEmergencyAudio;
  window.toggleScadaAlarmMute = toggleScadaAlarmMute;
  window.updateAlarmUiStatus = updateAlarmUiStatus;
  window.checkAndDispatchEmergencyAlarm = checkAndDispatchEmergencyAlarm;
  window.openMcgsScreenGuide = openMcgsScreenGuide;
  window.closeMcgsScreenGuide = closeMcgsScreenGuide;
  window.renderMcgsScreenGuideModal = renderMcgsScreenGuideModal;
  window.applyPreset = applyPreset;
window.startBatchNow = startBatchNow;
  window.setHeatRecoveryMode = setHeatRecoveryMode;
  window.setCircuits = setCircuits;
  window.onNumericInput = onNumericInput;
  window.stepTelemetry = stepTelemetry;
  window.onPsychrometerInput = onPsychrometerInput;
  window.applyPsychrometerToAdvisor = applyPsychrometerToAdvisor;
  window.updateVacuumPiecesCount = updateVacuumPiecesCount;
  window.updateBatchWeight = updateBatchWeight;
  window.setBatchWeight = setBatchWeight;
  window.stepBatchWeight = stepBatchWeight;
  window.selectSpecies = selectSpecies;
  window.selectStage = selectStage;
  window.setPausePhase = setPausePhase;
  window.toggleCoLoad = toggleCoLoad;
  window.saveBatchToLog = saveBatchToLog;
  window.clearBatchLogs = clearBatchLogs;
  window.exportAllBatchLogsCsv = exportAllBatchLogsCsv;
  window.setMcgsPhaseFilter = setMcgsPhaseFilter;
  window.toggleMobileMcgsTable = toggleMobileMcgsTable;
  window.applyMcgsPhaseToChamber = applyMcgsPhaseToChamber;
  window.openFullscreenMimicModal = openFullscreenMimicModal;
  window.closeFullscreenMimicModal = closeFullscreenMimicModal;
  window.loadFull4StageDemoBatchLogs = loadFull4StageDemoBatchLogs;
}
