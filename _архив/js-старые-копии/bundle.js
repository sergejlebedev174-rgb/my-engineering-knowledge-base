// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// ЕДИНЫЙ БАНДЛ ДЛЯ РЕЖИМА file:/// (FALLBACK BUNDLE)
// ==========================================================================


    function escapeHtml(str) {
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
    function createKpiTileHtml({
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
    function createCardHtml({
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
    function createPillBadgeHtml({
      text = "",
      type = "optimal",
      icon = "",
      style = "",
      dataAttrs = ""
    } = {}) {
      const styleAttr = style ? ` style="${style}"` : "";
      return `<span class="scada-status-pill status-${type}"${styleAttr}${dataAttrs ? " " + dataAttrs : ""}>${icon ? icon + " " : ""}${text}</span>`;
    }

    if (typeof window !== "undefined") {
      window.escapeHtml = escapeHtml;
      window.createKpiTileHtml = createKpiTileHtml;
      window.createCardHtml = createCardHtml;
      window.createPillBadgeHtml = createPillBadgeHtml;
    }


    
    // ==================== 🎯 КАЛИБРОВКА ЭКРАНА ONEPLUS 13 PRO AMOLED ====================
    const SCREEN_CALIB_PRESETS = [0.70, 0.75, 0.80, 0.85, 1.0];
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

    // ==================== 1. ДОМЕННАЯ МОДЕЛЬ (1:1 С CuringDomain.kt) ====================
    const HEAT_RECOVERY_MODES = {
      WINTER_14KW: {
        key: "WINTER_14KW",
        titleRu: "🟢 Зима: Рекуперация 14 кВт в цех (+35°C над мастером, створки закрыты)",
        shortBadgeRu: "🟢 Зима: 14 кВт в цех (+35°C)",
        descriptionRu: "Термокороб эстакады [20]: створки закрыты — утилизация 14 кВт тепла конденсации на обогрев цеха Юрмалциемс (+35°C над рабочим местом мастера) и удержание рабочего давления нагнетания 22–24 бар."
      },
      SUMMER_OUTDOOR: {
        key: "SUMMER_OUTDOOR",
        titleRu: "☀️ Лето: Сброс тепла на улицу (створки эстакады открыты)",
        shortBadgeRu: "☀️ Лето: Сброс на улицу",
        descriptionRu: "Термокороб эстакады [20]: створки эстакады открыты — полный сброс избыточного тепла конденсации с 10-метровой трассы за пределы цеха."
      }
    };

    const FISH_SPECIES = {
      VIMBA: {
        id: "vimba",
        key: "VIMBA",
        titleRu: "Вимба (Сырть)",
        subtitleRu: "Вялка целиком с икрой и нутряным жиром • Контроль среза «янтарно-стекловидная слеза»",
        tempRangeMonoC: [15.0, 16.5],
        tempRangeWithVimbaC: [15.0, 16.5],
        emergencyMaxTempC: 18.0,
        minStartRhPercent: 58.0,
        durationDaysDesc: "5–6 суток + 24–48 ч отволаживания в закрытой камере (+13…+15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц)",
        yieldMinPercent: 60,
        yieldMaxPercent: 63,
        yieldPercentRange: "60–63%",
        bioFeatureRu: "На 3–4 сутки выход капли нутряного жира через анальное отверстие при усадке брюшка — НОРМА (не подпарка при сухой чешуе). Главное правило контроля среза спинки: «янтарно-стекловидная слеза без белесых пятен». ⚠️ Отволаживание НА ВОЗДУХЕ В ЦЕХУ держать строго НЕ БОЛЕЕ 24 часов (к 2-м суткам теряется упругий «хруст», размягчается белок, идет набор влаги из цеха и окисление жира/икры). ✅ Климатическое отволаживание ВНУТРИ ЗАКРЫТОЙ КАМЕРЫ (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц) за 24–48 часов дает идеальную монолитность и охлаждение тушки до 13–15°C, исключая выпадение росы в вакуум-пакетах KOMET PlusVac 25.",
        prepChecklistRu: [
          "Комбинированная навеска за голову/хвост на прутки SS304",
          "Контроль сухости чешуи на 3–4 сутки при выходе капли жира",
          "Главное правило среза: «янтарно-стекловидная слеза без белесых пятен»",
          "⚠️ На воздухе в цеху отволаживать строго НЕ БОЛЕЕ 24 ч (иначе потеря упругого «хруста», размягчение белка и окисление жира/икры)",
          "✅ Внутри закрытой камеры (13–15°C, 1ч осушение / 4ч отдых 15–20 Гц): 24–48 ч дают монолитность и охлаждение до 13–15°C без росы в пакетах KOMET PlusVac 25"
        ]
      },
      BREAM: {
        id: "bream",
        key: "BREAM",
        titleRu: "Лещ (крупный колодкой)",
        subtitleRu: "Крупный икряной колодкой • Защита от «загара» (+2..+4°C посол, старт +12..+14°C, шпажка) • Контроль среза «слеза»",
        tempRangeMonoC: [12.0, 16.5],
        tempRangeWithVimbaC: [14.0, 16.5],
        emergencyMaxTempC: 18.5,
        minStartRhPercent: 58.0,
        durationDaysDesc: "5–6 суток (Этап 1: холодный старт +12..+14°C) + 24–48 ч отволаживания в закрытой камере (13–15°C, 1ч/4ч)",
        yieldMinPercent: 58,
        yieldMaxPercent: 62,
        yieldPercentRange: "58–62%",
        bioFeatureRu: "⚠️ Крупный икряной лещ колодкой: для защиты от «загара» и запашка у позвоночника и кишки — солить строго при +2..+4°C, первые сутки вешать за хвост (головой вниз) с открытыми жабрами для слива сукровицы из брюха, на Этапе 1 держать холодный старт +12..+14°C, а перед вакуумом проверять проколом деревянной шпажки к позвоночнику и в анальное отверстие! Главное правило контроля среза спинки: «янтарно-стекловидная слеза без белесых пятен». ⚠️ Отволаживание НА ВОЗДУХЕ В ЦЕХУ держать строго НЕ БОЛЕЕ 24 часов. ✅ Климатическое отволаживание ВНУТРИ ЗАКРЫТОЙ КАМЕРЫ (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц) за 24–48 ч обеспечивает идеальную монолитность и охлаждение тушки до 13–15°C без росы в пакетах KOMET PlusVac 25.",
        prepChecklistRu: [
          "⚠️ Крупный икряной лещ колодкой: для защиты от «загара» и запашка у позвоночника и кишки — солить строго при +2..+4°C, первые сутки вешать за хвост (головой вниз) с открытыми жабрами для слива сукровицы из брюха, на Этапе 1 держать холодный старт +12..+14°C, а перед вакуумом проверять проколом деревянной шпажки к позвоночнику и в анальное отверстие!",
          "На старте ОБЯЗАТЕЛЬНО приоткрыть жаберные крышки и повесить за хвост (головой вниз) на 1-е сутки",
          "Главное правило среза спинки: «янтарно-стекловидная слеза без белесых пятен» (без сухого кольца)",
          "⚠️ На воздухе в цеху отволаживать строго НЕ БОЛЕЕ 24 ч (к 2-м суткам потеря упругого «хруста», размягчение белка и окисление жира)",
          "✅ Внутри закрытой камеры (13–15°C, 1ч осушение / 4ч отдых 15–20 Гц): 24–48 ч дают монолитность и защиту от росы в пакетах KOMET PlusVac 25"
        ]
      },
      ROACH: {
        id: "roach",
        key: "ROACH",
        titleRu: "Плотва (калибр 22+)",
        subtitleRu: "Моно-загрузка (каскад) или совместно с вимбой",
        tempRangeMonoC: [17.0, 23.0],
        tempRangeWithVimbaC: [15.5, 17.5],
        emergencyMaxTempC: 24.0,
        minStartRhPercent: 55.0,
        durationDaysDesc: "4–5 суток + 24 ч отволаживания (4ч отдых / 1ч забор влаги при +13…+15°C, 25.3 Гц)",
        yieldMinPercent: 56,
        yieldMaxPercent: 60,
        yieldPercentRange: "56–60%",
        bioFeatureRu: "Моно-загрузка: каскад 20–23°C (старт, Стадия 1) -> 17–19°C (досушка, Стадии 2–3). Совместно с вимбой: 15.5–17.5°C. На финише — стабилизация 4 ч отдых / 1 ч забор влаги (+13…+15°C, Cantoni 25.3 Гц).",
        prepChecklistRu: [
          "Калибровка 22+ см по рамам SS304",
          "При моно-загрузке снизить Т°C с 20–23°C до 17–19°C со 2-й стадии",
          "При загрузке с вимбой держать строго 15.5–17.5°C, финиш +13…+15°C (Cantoni 25.3 Гц)"
        ]
      },
      SMELT: {
        id: "smelt",
        key: "SMELT",
        titleRu: "Корюшка (в т.ч. икряная)",
        subtitleRu: "Ускоренный цикл 2–3 суток, защита от срыва с прутков",
        tempRangeMonoC: [16.0, 22.0],
        tempRangeWithVimbaC: [16.0, 18.0],
        emergencyMaxTempC: 23.0,
        minStartRhPercent: 54.0,
        durationDaysDesc: "Цикл 2–3 суток (первые 3 ч: 20–25 Гц при 18–22°C; стабилизация +13…+15°C на 25.3 Гц)",
        yieldMinPercent: 50,
        yieldMaxPercent: 54,
        yieldPercentRange: "50–54%",
        bioFeatureRu: "Первые 3 часа — обдув 20–25 Гц при 18–22°C (закрепление головы на прутках SS304), далее досушка 16–18°C. Аварийный порог: строго < 23–24°C! Для икряной/жирной корюшки стабилизация: 4 ч отдых / 1 ч забор влаги при +13…+15°C и оборотах Cantoni 25.3 Гц.",
        prepChecklistRu: [
          "Первые 3 часа: частотники 20–25 Гц при 18–22°C для укрепления головы на SS304",
          "АВАРИЙНЫЙ ПОРОГ: строго < 23.0°C (иначе подпарка и обрыв тушки в поддон)",
          "Стабилизация икряной корюшки: 4 ч отдых / 1 ч забор влаги (+13…+15°C, Cantoni 25.3 Гц)"
        ]
      },
      PERCH: {
        id: "perch",
        key: "PERCH",
        titleRu: "Окунь (целиком в чешуе, икряной)",
        subtitleRu: "Панцирная чешуя + плотный ястык икры • Рубиново-стекловидный балык без кольца закала",
        tempRangeMonoC: [15.5, 17.5],
        tempRangeWithVimbaC: [15.5, 17.0],
        emergencyMaxTempC: 19.0,
        minStartRhPercent: 62.0,
        durationDaysDesc: "5–6 суток + 36–48 ч отволаживания в закрытой камере (13–15°C, 1ч/4ч, Cantoni 25.3 Гц)",
        yieldMinPercent: 54,
        yieldMaxPercent: 58,
        yieldPercentRange: "54–58%",
        bioFeatureRu: "Мягкий старт с rH не ниже 60–65% при 15.5–17.5°C — критическая защита плотной панцирной чешуи от блокирующего закала. 💎 Правило цехового среза: Икряной окунь в чешуе: рубиново-стекловидный балык спинки без сухого кольца закала; розовый ястык икры в плотной пленке отдает влагу медленнее спинки — на Стадии 4 в закрытой камере (13–15°C, 1ч/4ч) держать 36–48 ч для перетока влаги из ядра икры в мышцу перед вакуумом.",
        prepChecklistRu: [
          "Стадия 1: держать rH не ниже 60–65% (исключить сухой удар панцирной чешуи)",
          "Регулярные паузы 1.0–1.5 ч (на Ст.1–3 строго НЕ длиннее 1.5–2.0 ч — иначе в закрытом контуре при 85% rH рыба задыхается!)",
          "Температурный коридор строго 15.5–17.5°C",
          "💎 Икряной окунь в чешуе: рубиново-стекловидный балык спинки без сухого кольца закала; розовый ястык икры в плотной пленке отдает влагу медленнее спинки — на Стадии 4 в закрытой камере (13–15°C, 1ч/4ч) держать 36–48 ч для перетока влаги из ядра икры в мышцу перед вакуумом"
        ]
      },
      GOBY: {
        id: "goby",
        key: "GOBY",
        titleRu: "Бычок (балтийский, до 3.5 т)",
        subtitleRu: "Массивная загрузка, переток влаги от толстой шеи к хвосту",
        tempRangeMonoC: [15.0, 18.0],
        tempRangeWithVimbaC: [15.0, 17.0],
        emergencyMaxTempC: 19.5,
        minStartRhPercent: 58.0,
        durationDaysDesc: "4–5 суток (Сутки 1: 2 контура 3.5/1ч; Сутки 2+: 1 контур 3/1.5–2ч)",
        yieldMinPercent: 50,
        yieldMaxPercent: 55,
        yieldPercentRange: "50–55%",
        bioFeatureRu: "Обязательна тщательная смывка слизи. Сутки 1: 2 контура (3.5 ч сушка / 1 ч пауза). Сутки 2+: 1 контур (3 ч сушка / 1.5–2 ч пауза для перетекания влаги из толстой шеи к хвосту).",
        prepChecklistRu: [
          "Тщательная смывка донной слизи перед навеской",
          "Сутки 1 (до 3.5 т): оба контура AIM (21–24 кВт·ч), цикл 3.5 ч / 1.0 ч",
          "Сутки 2+: только Контур №1, паузы 1.5–2.0 ч для выравнивания шеи и хвоста"
        ]
      }
    };

    const CURING_STAGES = {
      STAGE_1: {
        key: "STAGE_1",
        number: 1,
        shortTitleRu: "Ст.1 (3.5ч/1ч)",
        titleRu: "Стадия 1: Съем верховой влаги",
        daysLabelRu: "Сутки 1–2 (первые 24–36 ч)",
        defaultWorkHours: 3.5,
        defaultPauseHours: 1.0,
        activeFreqHz: 30,
        activeVoltageV: 9.0,
        pauseFreqLabel: "20 Гц",
        pauseVoltageLabel: "5.0V",
        targetShelfRhRange: [60.0, 72.0],
        activeCircuitsCount: 2,
        moistureShareOfTotalPercent: 48,
        powerConsumptionKwH: "21–24 кВт·ч (Контуры №1 + №2)"
      },
      STAGE_2: {
        key: "STAGE_2",
        number: 2,
        shortTitleRu: "Ст.2 (3ч/1.5ч)",
        titleRu: "Стадия 2: Вытяжка от хребта",
        daysLabelRu: "Сутки 3–4",
        defaultWorkHours: 3.0,
        defaultPauseHours: 1.5,
        activeFreqHz: 30,
        activeVoltageV: 9.0,
        pauseFreqLabel: "18–20 Гц",
        pauseVoltageLabel: "4.8V",
        targetShelfRhRange: [56.0, 60.0],
        activeCircuitsCount: 1,
        moistureShareOfTotalPercent: 32,
        powerConsumptionKwH: "17–19 кВт·ч (Только Контур №1)"
      },
      STAGE_3: {
        key: "STAGE_3",
        number: 3,
        shortTitleRu: "Ст.3 (2.5ч/2ч)",
        titleRu: "Стадия 3: Финишный дожим спинки",
        daysLabelRu: "Сутки 5–6",
        defaultWorkHours: 2.5,
        defaultPauseHours: 2.0,
        activeFreqHz: 30,
        activeVoltageV: 9.0,
        pauseFreqLabel: "15–18 Гц",
        pauseVoltageLabel: "4.5V",
        targetShelfRhRange: [50.0, 54.0],
        activeCircuitsCount: 1,
        moistureShareOfTotalPercent: 16,
        powerConsumptionKwH: "17–19 кВт·ч (Только Контур №1)"
      },
      STAGE_4: {
        key: "STAGE_4",
        number: 4,
        shortTitleRu: "Ст.4 (1ч/4ч • 25.3 Гц)",
        titleRu: "Стадия 4: Отволаживание (стабилизация) под KOMET PlusVac 25",
        daysLabelRu: "Финал 24–48 ч",
        defaultWorkHours: 1.0,
        defaultPauseHours: 4.0,
        activeFreqHz: 25.3,
        activeVoltageV: 7.6,
        pauseFreqLabel: "15–20 Гц",
        pauseVoltageLabel: "4.5V",
        targetShelfRhRange: [50.0, 56.0],
        activeCircuitsCount: 1,
        moistureShareOfTotalPercent: 4,
        powerConsumptionKwH: "17–19 кВт·ч (Контур №1, 4ч отдых / 1ч забор влаги, Cantoni 25.3 Гц)"
      }
    };

    const SAMPLE_PRESETS = [
      {
        label: "Вимба • Ст.2 (Капля жира)",
        telemetry: {
          speciesKey: "VIMBA",
          batchWeightKg: 1850,
          stageKey: "STAGE_2",
          coLoadWithVimba: true,
          environmentTempC: 15.8,
          parksideRhPercent: 58.0,
          eev1Steps: 315,
          dehumicoilTempC: 5.1,
          scaleSurfaceTempC: 14.5,
          spineMoistureGmPercent: 48.5,
          psychroDryC: 15.8,
          psychroWetC: 11.4,
          vacuumPiecesCount: 100,
          isPausePhaseNow: false,
          activeCircuitsRunning: 1,
          heatRecoveryMode: "WINTER_14KW",
          visualNotes: "3-и сутки: выход капли нутряного жира через анальное отверстие при усадке брюшка, чешуя сухая."
        }
      },
      {
        label: "Лещ колодкой • Ст.4 (Стаб. 25.3 Гц)",
        telemetry: {
          speciesKey: "BREAM",
          batchWeightKg: 2200,
          stageKey: "STAGE_4",
          coLoadWithVimba: true,
          environmentTempC: 13.8,
          parksideRhPercent: 53.5,
          eev1Steps: 260,
          dehumicoilTempC: 4.9,
          scaleSurfaceTempC: 13.6,
          spineMoistureGmPercent: 41.5,
          psychroDryC: 13.8,
          psychroWetC: 9.2,
          vacuumPiecesCount: 100,
          isPausePhaseNow: false,
          activeCircuitsRunning: 1,
          heatRecoveryMode: "WINTER_14KW",
          visualNotes: "Фаза отволаживания жирной рыбы (4 ч отдых / 1 ч забор влаги при +13…+15°C, Cantoni 25.3 Гц), срез спинки однородный «янтарно-стекловидная слеза без белесых пятен»."
        }
      },
      {
        label: "Окунь в чешуе • Ст.1 (Риск закала!)",
        telemetry: {
          speciesKey: "PERCH",
          batchWeightKg: 1600,
          stageKey: "STAGE_1",
          coLoadWithVimba: false,
          environmentTempC: 16.9,
          parksideRhPercent: 54.0,
          eev1Steps: 495,
          dehumicoilTempC: 6.2,
          scaleSurfaceTempC: 16.7,
          spineMoistureGmPercent: 61.0,
          psychroDryC: 16.9,
          psychroWetC: 11.8,
          vacuumPiecesCount: 100,
          isPausePhaseNow: false,
          activeCircuitsRunning: 2,
          heatRecoveryMode: "WINTER_14KW",
          visualNotes: "Панцирная чешуя начинает грубеть, влажность в камере просела ниже 60%, ΔT чешуи < 0.4°C!"
        }
      },
      {
        label: "Корюшка икряная • Ст.1 (Перегрев!)",
        telemetry: {
          speciesKey: "SMELT",
          batchWeightKg: 1400,
          stageKey: "STAGE_1",
          coLoadWithVimba: false,
          environmentTempC: 23.4,
          parksideRhPercent: 66.0,
          eev1Steps: 190,
          dehumicoilTempC: 4.2,
          scaleSurfaceTempC: 23.1,
          spineMoistureGmPercent: 64.0,
          psychroDryC: 23.4,
          psychroWetC: 19.0,
          vacuumPiecesCount: 100,
          isPausePhaseNow: false,
          activeCircuitsRunning: 2,
          heatRecoveryMode: "SUMMER_OUTDOOR",
          visualNotes: "Идет 4-й час цикла, температура в камере подошла к аварийному порогу 23.4°C."
        }
      },
      {
        label: "Бычок балтийский 3.4т • Ст.2",
        telemetry: {
          speciesKey: "GOBY",
          batchWeightKg: 3400,
          stageKey: "STAGE_2",
          coLoadWithVimba: false,
          environmentTempC: 16.5,
          parksideRhPercent: 82.0,
          eev1Steps: 340,
          dehumicoilTempC: 5.3,
          scaleSurfaceTempC: 15.3,
          spineMoistureGmPercent: 52.0,
          psychroDryC: 16.5,
          psychroWetC: 14.6,
          vacuumPiecesCount: 100,
          isPausePhaseNow: true,
          activeCircuitsRunning: 1,
          heatRecoveryMode: "WINTER_14KW",
          visualNotes: "Слизь смыта, идет 20-я минута паузы (переток влаги из толстой шеи к хвосту)."
        }
      }
    ];

    const CHAT_MODELS = [
      { id: "gemini-2.5-flash-lite", titleRu: "Быстрый (Flash-Lite)" },
      { id: "gemini-2.5-flash", titleRu: "Стандарт (3.8 Flash)" },
      { id: "gemini-2.5-pro", titleRu: "Глубокий (4 Argon)" }
    ];

    const QUICK_QUESTIONS = [
      "Какая геометрия Монолита 15 тележек (3×5) и СОП рокировки (Моно vs Совместно с вимбой)?",
      "Какая экономика и протокол Премиум-Вакуума (28–30+ см) на KOMET PlusVac 25 + дооснащение MAP?",
      "Как синхронизировать частотники Hapn HPVF 4.0kW («Одной крутилкой») и защитить от урагана?",
      "Экстренный протокол: как спасти партию в рефконтейнере (+10..+11°C), если потек жир?",
      "Сервисная карта настроек MCGS + Вентиляция VENTS + теплоизоляция ЭРВ K-Flex",
      "Как работать с пирометром ИК-пирометр шкуры (ΔT), влагомером Игольчатый влагомер мяса и психрометром Реньо?"
    ];

    const HARDWARE_SPECS = [
      {
        title: "⚡ Синхронизация двух частотников Hapn HPVF 4.0kW и защита от урагана",
        color: "var(--cyan-dew)",
        bullets: [
          "Схема «Одной крутилкой» (Master → Slave / Ведущий → Ведомый): сигнальная перемычка с аналогового выхода AOV левого ЧП на вход AI1 правого ЧП и объединение GND → GND с полным сохранением 3-позиционного переключателя на дверце щита.",
          "Мониторинг с ноутбука Lenovo Legion: подключение по витой паре к клеммам 485+ / 485- (через промышленный конвертер USB-RS485 или Wi-Fi шлюз Elfin EW11 по протоколу Modbus RTU / TCP).",
          "Защита от балтийских штормов и просадок сети: обязательно включить в параметрах Hapn HPVF 4.0kW функции Auto Restart (3 попытки через 5 секунд после скачка света), Flying Start (подхват вращающегося мотора Cantoni 3 кВт без ошибки OC) и реле аварии TA / TC.",
          "Обязательная теплоизоляция медных труб и датчиков ЭРВ в K-Flex и алюминиевом скотче перед включением вытяжки (исключение ложного перегрева термобаллонов ЭРВ от теплого воздуха цеха)."
        ]
      },
      {
        title: "🛠 Сервисная карта настроек контроллера MCGS + Вентиляция VENTS",
        color: "var(--amber-curing)",
        bullets: [
          "System: Com StopTemp = 80.0°C (оставить), снизить Upper ExTemp со 120.0°C до 95.0°C (защита полиэфирного масла FV68S от гари и коксования, т.к. без обдува выхлоп греется до 77.8°C).",
          "EEV: EEV Cycle = 30 сек, Default Open = 170 шагов (вместо 200 — мягкий пуск без жидкого залива), MinimumStep = 75 шагов, EEV control = 0 (Dew point).",
          "Defrost: DefrostCycle = 40 мин (вместо 50 мин), DefrostTemp = -2.0°C (вместо -5.0°C), выход из разморозки +15.0°C.",
          "Dehumi: Diff HFTemp = 3.0°C, Diff HFHumi = 3% (оптимальный гистерезис осушения — не трогать).",
          "Switch: CondeFan ov = 1 под внешний термостат STC-1000 (+36°C ВКЛ / +28°C ВЫКЛ, удержание 22–24 бар) на катушке пускателя KM4; проверка входов 1#Com high/low = 1 (OFF) и прозвонка датчиков HP1/LP1.",
          "⛔ Unlock = 0: КАТЕГОРИЧЕСКИ НЕ ТРОГАТЬ (встроенный лизинговый таймер блокировки контроллера!).",
          "Синий термостат KTS 011 в левом щите HAPN выставить на +25°C для вытяжки компрессорной ВЕНТС ТТ ПРО 200; дверь компрессорной держать закрытой для сохранения гидрозатвора дренажа (75 л/ч).",
          "Обязательная теплоизоляция медных труб всасывания и датчиков ЭРВ во вспененный каучук K-Flex и алюминиевый скотч перед включением вытяжки компрессорной."
        ]
      },
      {
        title: "🚨 Экстренный протокол: Холодная досушка, если потек жир (Рефконтейнер)",
        color: "var(--coral-danger)",
        bullets: [
          "Раскладка в ящиках строго в 1 слой без соприкосновения тушек друг с другом, брюшки принудительно раскрыты (распорки/шпажки).",
          "Жесткая уставка рефа +10..+11°C: кристаллизация жидкой жировой пленки и образование микротрещин для возобновления выхода влаги (так как при +14°C пластичный жир блокирует поры на 70–80% с риском закисания у кости!).",
          "Влагопоглотители на удержание относительной влажности ≤ 40% rH в рефконтейнере для сохранения дефицита парциального давления пара (VPD) при холодной кристаллизации жира.",
          "Сильный направленный обдув вдоль дна перфорированных ящиков до восстановления матовой поверхности и открытия пор (контроль пирометром Бесконтактный пирометр ΔT ≥ 1.0°C)."
        ]
      },
      {
        title: "🟢 План дооснащения Контура №1 (7 зеленых узлов защиты от залива -20.6°C)",
        color: "var(--emerald-optimal)",
        bullets: [
          "1–2. Байпас горячего газа Danfoss KVC 15/22 [8] (удержание кипения +2°C против провала в -20.6°C) + соленоид отсечки жидкости LLSV Danfoss EVR 10/15 [19] после фильтра DML 164 [10] перед ЭРВ (реализация автоматической откачки Pump-down).",
          "3–4. Увеличенный докипатель 8–10 л [14] вместо штатного 3 л + разборный фильтр НД [13] на всасывании (защита компрессора от влажного хода и гидроудара на 10-метровой трассе).",
          "5–6. Маслоотделитель [3] + обратный клапан NRV [4] на нагнетании (возврат масла в картер и отсечка обратной миграции жидкого фреона с холодной эстакады).",
          "7. Независимое двухблочное реле давления Danfoss KP15 (HP/LP) и дозаправка контура: +2.5–3.0 кг R410A + 150–200 мл полиэфирного масла FV68S.",
          "Термокороб эстакады [20]: переключение «🟢 Зима: Рекуперация 14 кВт в цех (+35°C над мастером, створки закрыты)» / «☀️ Лето: Сброс тепла на улицу (створки эстакады открыты)»."
        ]
      },
      {
        title: "⚙ Осушитель AIM AGHD-250ELC и логика ЭРВ",
        color: "var(--cyan-dew)",
        bullets: [
          "Тепловой насос AIM AGHD-250ELC: заводской моноблок (2 контура × 10 кг R410A) + уличный конденсатор на 10-метровой трассе.",
          "Логика ЭРВ: EEV control = 0 (Dew point), EEV Cycle = 30 сек, Default Open = 170 шагов (вместо 200), MinimumStep = 75 шагов.",
          "Рабочее окно 1#EEV = 205–480 step, кипение испарителя 1#Dehumicoil = +4.5...+5.8°C (без обмерзания; аварийный подхват байпасом Danfoss KVC 15/22 [8] при +2°C).",
          "Энергоменеджмент: 2 контура (21–24 кВт·ч) включаются ТОЛЬКО в первые 24–36 ч (Стадия 1) для съема верховой воды. Со 2-х суток (Стадии 2, 3, 4) работает только Контур №1 (17–19 кВт·ч)."
        ]
      },
      {
        title: "🌬 Аэродинамика камеры (Монолит 3×5) и частотники Cantoni",
        color: "var(--amber-curing)",
        bullets: [
          "Строго закрытый контур (Closed loop) без уличных заслонок. Односторонний продув (Direction = 0: single). Геометрия Монолита 15 тележек (3×5): слева у скоса пленум 50–70 см, справа у сеток буфер 50 см, боковые коридоры перекрыты, брюшки рыбы строго влево (навстречу потоку).",
          "4 осевых вентилятора Cantoni по 3 кВт; рамы и прутки из нержавеющей стали SS304, навеска комбинированная за голову/хвост.",
          "Активная сушка (Стадии 1–3, компрессор ВКЛ): 30 Гц (9.0V).",
          "Фаза отволаживания / стабилизации (Стадия 4): внутри закрытой камеры при 13–15°C (1 час осушение 30/25.3 Гц / 4 часа отдых 15–20 Гц) — 24–48 ч до монолитного среза «янтарно-стекловидная слеза без белесых пятен».",
          "⛔ ЖЕСТКОЕ БИОФИЗИЧЕСКОЕ ПРАВИЛО ЗАКРЫТОГО КОНТУРА: ЗАПРЕЩЕНО делать паузы длиннее 1.5–2.0 часов на Стадиях 1–3 (Ст.1 макс 1.0 ч, Ст.2 макс 1.5 ч, Ст.3 макс 2.0 ч), так как при 85% влажности в закрытой камере рыба задыхается (VPD → 0)!"
        ]
      },
      {
        title: "⚡ Каскадная логика 4-х стадий цикла",
        color: "var(--emerald-optimal)",
        bullets: [
          "Стадия 1 (Сутки 1–2 — Съем верховой влаги): Цикл MCGS 3.5 ч сушка (30 Гц / 9.0V) / 1.0 ч пауза (20 Гц / 5.0V). Работают 2 контура (21–24 кВт·ч).",
          "Стадия 2 (Сутки 3–4 — Вытяжка от хребта): Цикл MCGS 3.0 ч сушка (30 Гц / 9.0V) / 1.5 ч пауза (18–20 Гц / 4.5V). Полка 56–60% rH. Работает Контур №1.",
          "Стадия 3 (Сутки 5–6 — Финишный дожим спинки): Цикл MCGS 2.5 ч сушка (30 Гц / 9.0V) / 2.0 ч пауза (15–18 Гц / 4.5V). Полка 50–54% rH. Работает Контур №1.",
          "Стадия 4 (Финал 24–48 ч — Климатическое отволаживание в закрытой камере под KOMET PlusVac 25): 13–15°C, 1ч осушение (30/25.3 Гц) / 4ч отдых (15–20 Гц). ⚠️ На воздухе в цеху держать строго НЕ БОЛЕЕ 24 часов!"
        ]
      },
      {
        title: "🛡 Контроль среза «янтарно-стекловидная слеза» и упаковка KOMET PlusVac 25",
        color: "var(--cyan-dew)",
        bullets: [
          "Главное правило контроля среза (Вимба, Лещ колодкой): срез спинки должен быть как «янтарно-стекловидная слеза без белесых пятен».",
          "⚠️ ПРЕДУПРЕЖДЕНИЕ (НА ВОЗДУХЕ В ЦЕХУ): отволаживание на воздухе в цеху держать строго НЕ БОЛЕЕ 24 часов! К 2-м суткам теряется упругий «хруст», идет размягчение белка, набор влаги из цеха и окисление жира/икры.",
          "✅ КЛИМАТИЧЕСКОЕ ОТВОЛАЖИВАНИЕ ВНУТРИ ЗАКРЫТОЙ КАМЕРЫ (13–15°C, 1ч осушение 30/25.3 Гц / 4ч отдых 15–20 Гц): 24–48 часов обеспечивают идеальную монолитность и охлаждение тушки до 13–15°C, исключая выпадение росы внутри вакуум-пакетов KOMET PlusVac 25.",
          "Протокол KOMET PlusVac 25 (Арт. 3150049, 2026 г.): Soft Vac 95–96%, подрезка плавников 2–3 мм, 15–20 мин тест на прокол, хранение 0..+4°C в темных ящиках; дооснащение газом (MAP) своими руками за ~150 € (соленоид и редуктор к выходу контроллера Comfort)."
        ]
      }
    ];

    // ==================== 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ И АВТОСОХРАНЕНИЕ LOCALSTORAGE ====================
    const STORAGE_KEY_TELEMETRY = "JURMALCIEMS_TELEMETRY_V1";
    const STORAGE_KEY_BATCH_LOGS = "JURMALCIEMS_BATCH_LOGS_V1";
    const STORAGE_KEY_PARKSIDE_ANALYSIS = "JURMALCIEMS_PARKSIDE_ANALYSIS_V1";

    let activeParksideAnalysis = null;

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

    let state = {
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

function clearBioscienceCache() {
  _bioscienceCache.clear();
  _bioscienceCacheHits = 0;
  _bioscienceCacheMisses = 0;
}

function getBioscienceCacheStats() {
  return {
    size: _bioscienceCache.size,
    hits: _bioscienceCacheHits,
    misses: _bioscienceCacheMisses
  };
}

function computeTelemetryHash(t) {
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

    function analyzeBioscience(t) {
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

    function computeWaterLossRate(t, diag) {
      // Если партия не запущена — вернуть null
      if (!t || !t.batchStartMs) return null;

      const now = Date.now();
      const elapsedMs = Math.max(0, now - t.batchStartMs);
      const elapsedHours = elapsedMs / 3600000;
      const elapsedDays = elapsedHours / 24;

      // Оценка общей длительности цикла (из diag/yf)
      const yf = (diag && diag.yieldForecast) ? diag.yieldForecast : { totalWaterAvgLiters: 480 };
      const stage = (typeof CURING_STAGES !== "undefined" && t.stageKey) ? CURING_STAGES[t.stageKey] : { titleRu: "Сушка" };
      const meta = (typeof VX_SPECIES_META !== 'undefined' && t.speciesKey) ? 
                   VX_SPECIES_META[t.speciesKey] : null;
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

    // ==================== 4. РЕНДЕРИНГ ИНТЕРФЕЙСА И MOBILE FLAGSHIP HUD ====================
    let __lastHapticTimestamp = 0;
    function triggerHaptic(ms = 12, isContinuous = false) {
      try {
        const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        if (isContinuous && now - __lastHapticTimestamp < 45) return;
        __lastHapticTimestamp = now;
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(ms);
        }
      } catch (e) {}
    }

    function toggleMobileActionsDrawer() {
      triggerHaptic(12);
      const backdrop = document.getElementById("mobile-actions-drawer-backdrop");
      if (backdrop) backdrop.classList.toggle("open");
    }

    function closeMobileActionsDrawer() {
      const backdrop = document.getElementById("mobile-actions-drawer-backdrop");
      if (backdrop) backdrop.classList.remove("open");
    }

    function selectMobileMainTab(tabId) {
      triggerHaptic(12);
      closeMobileActionsDrawer();
      selectTab(tabId);
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
    }

    function speakMobileFemaleVoice() {
      triggerHaptic(15);
      if (typeof isOwnerSpeechPlaying !== "undefined" && isOwnerSpeechPlaying) {
        if (typeof stopVoiceAll === "function") stopVoiceAll();
        return;
      }
      if (typeof vxVoiceMode !== "undefined" && vxVoiceMode === "speaking") {
        if (typeof stopVoiceAll === "function") stopVoiceAll();
        return;
      }
      if (typeof speakOwnerReportAloud === "function") {
        speakOwnerReportAloud();
      } else if (typeof speakVoiceReport === "function") {
        speakVoiceReport();
      }
    }

    function openFullscreenMimicModal() {
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

    function closeFullscreenMimicModal() {
      triggerHaptic(10);
      const modal = document.getElementById("mimic-fullscreen-modal");
      if (modal) modal.classList.remove("open");
    }

    let mcgsMobilePhaseFilter = "ALL"; // "ALL" | "DRY" | "PAUSE" | 1..8
    function setMcgsPhaseFilter(filterVal) {
      triggerHaptic(12);
      mcgsMobilePhaseFilter = filterVal;
      renderAll();
      if (typeof checkStageMemoryReminder === "function") checkStageMemoryReminder(stageKey);
    }

    function toggleMobileMcgsTable() {
      triggerHaptic(12);
      document.body.classList.toggle("show-mobile-mcgs-table");
      const isShown = document.body.classList.contains("show-mobile-mcgs-table");
      showToast(isShown ? "📊 Показана полная сводная таблица 8 фаз MCGS" : "📱 Показаны крупные карточки фаз Ф1–Ф8");
    }

    function applyMcgsPhaseToChamber(phaseNumber) {
      triggerHaptic(15);
      const diag = analyzeBioscience(state.telemetry);
      const ph = (diag.mcgsPhases || []).find(p => p.phaseNumber === Number(phaseNumber));
      if (!ph) return;
      state.telemetry.environmentTempC = Number(ph.tempSetpointC);
      state.telemetry.parksideRhPercent = Number(ph.humiSetpointPercent);
      state.telemetry.isPausePhaseNow = (ph.phaseNumber % 2 === 0 && ph.phaseNumber !== 8);
      state.telemetry.phaseStartTimestampMs = Date.now();
      state.customAiAdvice = null;
      renderAll();
      showToast(`▶ Применены уставки Фазы Ф${ph.phaseNumber} (${ph.modeLabel}): Temp ${ph.tempSetpointC}°C, Humi ${ph.humiSetpointPercent}%`);
    }

    function updateMobileHudChrome(t, species, stage, diag) {
      const livePill = document.getElementById("mobile-top-live-pill");
      if (livePill && t) {
        const spEmoji = (typeof VX_SPECIES_META !== "undefined" && VX_SPECIES_META[t.speciesKey]) ? VX_SPECIES_META[t.speciesKey].emoji : "🐟";
        const phIco = t.isPausePhaseNow ? "⏸" : "⚡";
        livePill.textContent = `${spEmoji} ${phIco} +${Number(t.environmentTempC).toFixed(1)}°C • ${Math.round(t.parksideRhPercent)}%`;
      }
      const isOwner = state.uiMode === "OWNER";
      const dOwner = document.getElementById("mob-drawer-mode-owner");
      const dEng = document.getElementById("mob-drawer-mode-engineer");
      if (dOwner) dOwner.className = `mode-switch-btn ${isOwner ? "active-owner" : ""}`;
      if (dEng) dEng.className = `mode-switch-btn ${!isOwner ? "active-engineer" : ""}`;

      const apiTxt = document.getElementById("mob-drawer-api-txt");
      const apiBtn = document.getElementById("mob-drawer-api-btn");
      if (apiTxt && typeof hasGeminiApiKey === "function") {
        const online = hasGeminiApiKey();
        apiTxt.textContent = online ? "🟢 Gemini API (Онлайн)" : "⚪ Ввести ключ Gemini";
        if (apiBtn) apiBtn.style.borderColor = online ? "var(--emerald-optimal)" : "var(--cyan-dew)";
      }

      ["calcs", "advisor", "mcgs", "species", "chat", "hardware"].forEach(id => {
        const btn = document.getElementById(`mob-nav-${id}`);
        if (btn) {
          btn.classList.toggle("active", !isOwner && state.activeTab === id);
        }
      });

      const fsModal = document.getElementById("mimic-fullscreen-modal");
      if (fsModal && fsModal.classList.contains("open")) {
        const srcSvg = document.getElementById("scada-chamber-desktop-svg");
        const slot = document.getElementById("mimic-fullscreen-svg-slot");
        if (srcSvg && slot) {
          slot.innerHTML = srcSvg.outerHTML.replace('id="scada-chamber-desktop-svg"', 'id="scada-chamber-fullscreen-svg" style="width:100%; min-width:860px; height:auto; display:block;"');
        }
      }
    }

    function selectTab(tabId) {
      triggerHaptic(12);
      if (state.uiMode === "OWNER") {
        state.uiMode = "ENGINEER";
      }
      state.activeTab = tabId;
      if (typeof vxSyncConsolePanels === "function") {
        vxSyncConsolePanels(tabId);
      }
      ["voice", "batch", "profit", "console", "calcs", "advisor", "mcgs", "species", "chat", "hardware"].forEach(id => {
        const pane = document.getElementById(`tab-${id}`);
        const nav = document.getElementById(`nav-${id}`);
        const dock = document.getElementById(`dock-${id}`);
        const mobNav = document.getElementById(`mob-nav-${id}`);
        if (pane) pane.classList.toggle("active", id === tabId);
        if (nav) nav.classList.toggle("active", id === tabId);
        if (dock) dock.classList.toggle("active", id === tabId);
        if (mobNav) mobNav.classList.toggle("active", id === tabId);
      });
      try { localStorage.setItem("JURMALCIEMS_ACTIVE_TAB_V1", tabId); } catch (e) {}
      renderAll();
    }

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
    let sliceInspectorState = {
      refMode: "PERCH_SLICE", // 'PERCH_SLICE' | 'VIMBA_PACK_3PCS'
      imageDataUrl: null,
      base64Data: null,
      mimeType: "image/jpeg",
      fileName: null,
      fileSizeKb: 0,
      checks: [true, true, true, true],
      aiVerdictHtml: null,
      isAnalyzing: false
    };

    function setVacuumPackMode(mode) {
      state.telemetry.vacuumPackMode = mode === "SHOP_3PCS" ? "SHOP_3PCS" : "SINGLE_1PC";
      renderAll();
    }

    // Интерактивный «Калькулятор экономики Премиум-Вакуума (Калибр 28–30+ см на KOMET PlusVac 25)» с переключателем формата фасовки
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

    // ==================== 3.9 НОРМАЛИЗАЦИЯ РУССКОЙ РЕЧИ И ДВУХРЕЖИМНЫЙ ЖЕНСКИЙ ГОЛОС (GEMINI TTS AOEDE/KORE + WEB SPEECH) ====================
    var VOICE_SETTINGS_STORAGE_KEY = "JURMALCIEMS_VOICE_SETTINGS_V1";
    var voiceSettings = {
      selectedVoiceId: "auto_female", // "auto_female" | "gemini:Aoede" | "gemini:Kore" | "browser_female" | URI голоса
      rate: 0.97,
      pitch: 1.06,
      autoAnnouncePhaseChange: true,
      lastActiveEngineLabel: "👩 Женский голос готов"
    };
    var activeTtsAudioElement = null;
    var activeOwnerEqInterval = null;

    function loadVoiceSettings() {
      try {
        const raw = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            Object.assign(voiceSettings, parsed);
          }
        }
      } catch (e) {}
    }

    function saveVoiceSettings() {
      try {
        localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify({
          selectedVoiceId: voiceSettings.selectedVoiceId,
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          autoAnnouncePhaseChange: voiceSettings.autoAnnouncePhaseChange
        }));
      } catch (e) {}
    }

    // Полная литературная нормализация технических сокращений перед озвучкой без чтения латиницы по буквам
    function normalizeTextForRussianSpeech(rawText) {
      if (!rawText) return "";
      let s = String(rawText);

      // Убираем эмодзи и спецсимволы разметки
      s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{FE0F}\u{200D}]/gu, " ");
      s = s.replace(/[*_#`>•━┄|«»"()\[\]]/g, " ");

      // Технические узлы и аббревиатуры цеха Юрмалциемс
      s = s.replace(/1\s*#\s*EEV/gi, " электронный расширительный вентиль первого контура ");
      s = s.replace(/2\s*#\s*EEV/gi, " электронный расширительный вентиль второго контура ");
      s = s.replace(/1\s*#\s*Dehumicoil/gi, " испаритель осушителя первого контура ");
      s = s.replace(/2\s*#\s*Dehumicoil/gi, " испаритель осушителя второго контура ");
      s = s.replace(/\bEEV\b/gi, " электронный расширительный вентиль ");
      s = s.replace(/\bЭРВ\b/g, " электронный расширительный вентиль ");
      s = s.replace(/\bDehumicoil\b/gi, " испаритель осушителя ");
      s = s.replace(/ΔT|∆T|\bdT\b/g, " дельта температур ");
      s = s.replace(/\bVPD\b/gi, " дефицит давления пара ");
      s = s.replace(/KOMET\s*PlusVac\s*25/gi, " вакуумный аппарат Комет ПлюсВак двадцать пять ");
      s = s.replace(/\bKOMET\b/gi, " Комет ");
      s = s.replace(/AIM\s*AGHD-250ELC/gi, " осушитель АИМ двести пятьдесят ");
      s = s.replace(/\bAIM\b/gi, " АИМ ");
      s = s.replace(/\bMCGS\b/gi, " контроллер управления ");
      s = s.replace(/\bCantoni\b/gi, " вентиляторы Кантони ");
      s = s.replace(/\bParkside\b/gi, " логгер Парксайд ");
      s = s.replace(/\bИК-пирометр шкуры\b/gi, " пирометр Лазерлайнер ");
      s = s.replace(/Влагомер хребта\s*GMH\s*3810|\bВлагомер хребта\b/gi, " влагомер Грайзингер ");
      s = s.replace(/\bSS304\b/gi, " из нержавеющей стали ");
      s = s.replace(/Soft\s*Vac/gi, " мягкий вакуум ");
      s = s.replace(/\bEnv\b/gi, " температура в камере ");

      // Стадии и этапы
      s = s.replace(/Ст\.?\s*1\s*[–—-]\s*3/gi, " стадии с первой по третью ");
      s = s.replace(/Ст\.?\s*1\s*\.\.\s*4/gi, " стадии с первой по четвертую ");
      s = s.replace(/Ст\.?\s*1\b/gi, " первая стадия ");
      s = s.replace(/Ст\.?\s*2\b/gi, " вторая стадия ");
      s = s.replace(/Ст\.?\s*3\b/gi, " третья стадия ");
      s = s.replace(/Ст\.?\s*4\b/gi, " четвертая стадия ");

      // Диапазоны чисел и знаки температуры
      s = s.replace(/\+(\d+)\s*(?:\.\.|[–—-])\s*\+?(\d+)/g, "от плюс $1 до плюс $2");
      s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:\.\.|[–—-])\s*(\d+(?:[.,]\d+)?)/g, "от $1 до $2");
      s = s.replace(/\+(\d)/g, "плюс $1");
      s = s.replace(/[−-](\d)/g, "минус $1");

      // Дробные числа: 13.6 -> 13 и 6 (чтобы синтезатор не говорил «точка» или «запятая»)
      s = s.replace(/(\d+)[.,](\d+)/g, "$1 и $2");

      // Единицы измерения
      s = s.replace(/%\s*rH\b|\brH\s*%/gi, " процентов относительной влажности ");
      s = s.replace(/\brH\b/gi, " относительной влажности ");
      s = s.replace(/°\s*[CС]/gi, " градусов Цельсия ");
      s = s.replace(/кВт\s*[·*]\s*ч/gi, " киловатт-часов ");
      s = s.replace(/\bкВт\b/gi, " киловатт ");
      s = s.replace(/\bкПа\b/gi, " килопаскаля ");
      s = s.replace(/\bГц\b|\bHz\b/gi, " герц ");
      s = s.replace(/\bstep\b/gi, " шагов ");
      s = s.replace(/%/g, " процентов ");
      s = s.replace(/€/g, " евро ");
      s = s.replace(/л\/сут/gi, " литров в сутки ");
      s = s.replace(/л\/ч/gi, " литров в час ");
      s = s.replace(/%\/мин/gi, " процента в минуту ");
      s = s.replace(/€\/кг/gi, " евро за килограмм ");
      s = s.replace(/\bкг\b/gi, " килограммов ");
      s = s.replace(/(\d)\s*г\b/gi, "$1 граммов ");
      s = s.replace(/(\d)\s*л\b/gi, "$1 литров ");
      s = s.replace(/(\d)\s*ч\b/gi, "$1 часов ");
      s = s.replace(/\bсут\.?\b/gi, " суток ");
      s = s.replace(/\bмин\.?\b/gi, " минут ");
      s = s.replace(/\bсек\.?\b/gi, " секунд ");
      s = s.replace(/\bшт\.?\b/gi, " штук ");
      s = s.replace(/\bпак\.?\b/gi, " пакетов ");
      s = s.replace(/\bтел\.?\b/gi, " тележек ");

      return s.replace(/\s+/g, " ").trim();
    }

    let _aiVoiceCachedList = [];
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const _updateVoiceList = () => {
        try {
          const v = window.speechSynthesis.getVoices();
          if (Array.isArray(v) && v.length > 0) _aiVoiceCachedList = v;
        } catch (e) {}
      };
      _updateVoiceList();
      try {
        if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
          window.speechSynthesis.onvoiceschanged = _updateVoiceList;
        }
        window.speechSynthesis.addEventListener("voiceschanged", _updateVoiceList);
      } catch (e) {}
    }

    function getRussianBrowserVoicesSorted() {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !window.speechSynthesis.getVoices) return [];
      let all = (Array.isArray(_aiVoiceCachedList) && _aiVoiceCachedList.length > 0)
        ? _aiVoiceCachedList
        : (window.speechSynthesis.getVoices() || []);
      if ((!all || all.length === 0) && _aiVoiceCachedList.length > 0) all = _aiVoiceCachedList;
      const ru = all.filter(v => (v.lang && v.lang.toLowerCase().startsWith("ru")) || /russian|русск/i.test(v.name || ""));
      const scoreVoice = v => {
        const nm = String(v.name || "").toLowerCase();
        let sc = 10;
        if (/svetlana/.test(nm)) sc += 120;
        if (/dariya|daria/.test(nm)) sc += 110;
        if (/google\s*русский|google\s*russian/.test(nm)) sc += 105;
        if (/natural|online|neural/.test(nm)) sc += 45;
        if (/milena|katya|irina|elena|tatyana|alena|victoria|female|жен/.test(nm)) sc += 80;
        if (/pavel|dmitry|maxim|yuri|aleksandr|artem|boris|male|муж/.test(nm)) sc -= 90;
        return sc;
      };
      return [...ru].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    }

    function pickBestRussianFemaleBrowserVoice() {
      const sorted = getRussianBrowserVoicesSorted();
      if (!sorted.length) return null;
      if (voiceSettings.selectedVoiceId && !["auto_female", "browser_female", "gemini:Aoede", "gemini:Kore"].includes(voiceSettings.selectedVoiceId)) {
        const exact = sorted.find(v => v.voiceURI === voiceSettings.selectedVoiceId || v.name === voiceSettings.selectedVoiceId);
        if (exact) return exact;
      }
      return sorted[0];
    }

    // Конвертация PCM16 (24000 Гц, 1 канал) из ответа Gemini TTS в воспроизводимый WAV Blob
    function pcm16Base64ToWavBlob(base64Data, sampleRate = 24000) {
      const binStr = atob(base64Data);
      const pcmLen = binStr.length;
      const wavBuffer = new ArrayBuffer(44 + pcmLen);
      const view = new DataView(wavBuffer);
      const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeStr(0, "RIFF");
      view.setUint32(4, 36 + pcmLen, true);
      writeStr(8, "WAVE");
      writeStr(12, "fmt ");
      view.setUint32(16, 16, true); // PCM chunk size
      view.setUint16(20, 1, true);  // AudioFormat = 1 (PCM)
      view.setUint16(22, 1, true);  // NumChannels = 1 (Mono)
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // ByteRate
      view.setUint16(32, 2, true);  // BlockAlign
      view.setUint16(34, 16, true); // BitsPerSample = 16
      writeStr(36, "data");
      view.setUint32(40, pcmLen, true);
      const bytes = new Uint8Array(wavBuffer, 44);
      for (let i = 0; i < pcmLen; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return new Blob([wavBuffer], { type: "audio/wav" });
    }

    async function synthesizeGeminiTtsAudioBlob(cleanSpeechText, voiceName, apiKey) {
      const cleanKey = sanitizeGeminiApiKey(apiKey);
      if (!cleanKey) throw new Error("Ключ не задан");
      const ttsModel = "gemini-2.5-flash-preview-tts";
      const chosenVoice = voiceName === "Kore" ? "Kore" : "Aoede";
      const isAq = /^AQ\./i.test(cleanKey);
      const urls = isAq
        ? [
            `https://aiplatform.googleapis.com/v1/publishers/google/models/${ttsModel}:generateContent`,
            `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent`
          ]
        : [
            `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent`,
            `https://aiplatform.googleapis.com/v1/publishers/google/models/${ttsModel}:generateContent`
          ];

      const payload = JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: `Прочитай мягким, доброжелательным и живым женским голосом на чистом русском языке: ${cleanSpeechText}` }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: chosenVoice
              }
            }
          }
        }
      });

      let lastErr = "";
      for (const url of urls) {
        try {
          const resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": cleanKey
            },
            body: payload
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            lastErr = data?.error?.message || `HTTP ${resp.status}`;
            continue;
          }
          const root = Array.isArray(data) ? data[0] : data;
          const parts = root?.candidates?.[0]?.content?.parts || [];
          const audioPart = parts.find(p => p.inlineData?.data || p.inline_data?.data);
          const inlineObj = audioPart?.inlineData || audioPart?.inline_data;
          if (inlineObj && inlineObj.data) {
            const mime = String(inlineObj.mimeType || inlineObj.mime_type || "audio/L16;rate=24000");
            const rateMatch = mime.match(/rate=(\d+)/i);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
            if (/wav|mp3|ogg/i.test(mime)) {
              const bin = atob(inlineObj.data);
              const u8 = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
              return { blob: new Blob([u8], { type: mime }), voiceUsed: chosenVoice };
            }
            return { blob: pcm16Base64ToWavBlob(inlineObj.data, sampleRate), voiceUsed: chosenVoice };
          }
        } catch (e) {
          lastErr = e?.message || "Network error";
        }
      }
      throw new Error(lastErr || "Gemini TTS недоступен");
    }

    function setOwnerEqualizerActive(isActive, engineLabel) {
      if (engineLabel) {
        voiceSettings.lastActiveEngineLabel = engineLabel;
        const badgeEl = document.getElementById("owner-voice-engine-badge");
        if (badgeEl) badgeEl.textContent = engineLabel;
        const vxBadgeEl = document.getElementById("vx-voice-engine-badge");
        if (vxBadgeEl) vxBadgeEl.textContent = engineLabel;
      }
      if (activeOwnerEqInterval) {
        clearInterval(activeOwnerEqInterval);
        activeOwnerEqInterval = null;
      }
      const updateBars = active => {
        document.querySelectorAll(".owner-eq-bar").forEach((bar, i) => {
          if (!active) {
            bar.style.height = "6px";
            bar.style.opacity = "0.4";
          } else {
            const h = Math.round(8 + Math.abs(Math.sin(Date.now() / 120 + i * 0.65)) * 24 + Math.random() * 10);
            bar.style.height = `${h}px`;
            bar.style.opacity = "1";
          }
        });
      };
      const mobFemaleBtn = document.getElementById("btn-mob-speak-female");
      if (mobFemaleBtn) {
        mobFemaleBtn.textContent = isActive ? "⏹ Стоп" : "🔊 Женский голос";
      }
      if (isActive) {
        vxVoiceLevel = 1;
        updateBars(true);
        if (typeof vxEqTick === "function" && !vxEqRaf) vxEqRaf = requestAnimationFrame(vxEqTick);
        activeOwnerEqInterval = setInterval(() => {
          vxVoiceLevel = 0.85;
          updateBars(true);
        }, 90);
      } else {
        updateBars(false);
      }
    }

    function onVoiceSelectChange(val) {
      voiceSettings.selectedVoiceId = val;
      saveVoiceSettings();
      renderAll();
    }

    function onVoiceRateInput(val) {
      const r = parseFloat(val);
      if (isNaN(r)) return;
      voiceSettings.rate = Math.max(0.75, Math.min(1.35, r));
      saveVoiceSettings();
      document.querySelectorAll(".voice-rate-label").forEach(el => {
        el.textContent = `${voiceSettings.rate.toFixed(2)}×`;
      });
      if (activeTtsAudioElement) {
        activeTtsAudioElement.playbackRate = voiceSettings.rate;
      }
    }

    function toggleAutoPhaseAnnounce(checked) {
      voiceSettings.autoAnnouncePhaseChange = checked !== undefined ? Boolean(checked) : !voiceSettings.autoAnnouncePhaseChange;
      saveVoiceSettings();
      renderAll();
      showToast(voiceSettings.autoAnnouncePhaseChange
        ? "🔔 Включена авто-озвучка при смене фазы Сушка / Отдых"
        : "🔕 Авто-озвучка смены фазы отключена");
    }

    function buildVoiceControlsHtml(prefix) {
      const ruVoices = getRussianBrowserVoicesSorted();
      const sel = voiceSettings.selectedVoiceId || "auto_female";
      const hasKey = hasGeminiApiKey();
      const browserOptions = ruVoices.map(v => {
        const isFemale = /svetlana|dariya|daria|google|milena|katya|irina|elena|tatyana|alena|victoria/i.test(v.name || "");
        const val = v.voiceURI || v.name;
        return `<option value="${val.replace(/"/g, "&quot;")}" ${sel === val ? "selected" : ""}>${isFemale ? "👩 " : "🗣 "}${v.name}</option>`;
      }).join("");

      const eqBarsHtml = Array.from({ length: 22 }, () =>
        `<span class="owner-eq-bar" style="display:inline-block; width:4px; height:6px; border-radius:99px; background:linear-gradient(180deg, #00E5FF, #EC4899); transition:height 90ms ease; opacity:0.4;"></span>`
      ).join("");

      return `
        <div style="background:rgba(8, 17, 29, 0.92); border:1.5px solid rgba(0, 229, 255, 0.4); border-radius:14px; padding:12px 14px; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <span style="font-size:14px; font-weight:800; color:#F8FAFC;">👩 ЖИВОЙ ЖЕНСКИЙ ГОЛОС ОЗВУЧКИ:</span>
            <span id="${prefix}-voice-engine-badge" style="font-family:var(--font-mono); font-size:12px; color:#2EE59D; font-weight:700;">${voiceSettings.lastActiveEngineLabel}</span>
          </div>
          <select class="field-input" style="font-size:14.5px; padding:8px 10px; font-weight:600;" onchange="onVoiceSelectChange(this.value)">
            <option value="auto_female" ${sel === "auto_female" ? "selected" : ""}>✨ Авто: ${hasKey ? "Gemini Neural TTS (Aoede — живой женский)" : "Лучший женский голос браузера (pitch 1.06)"}</option>
            <option value="gemini:Aoede" ${sel === "gemini:Aoede" ? "selected" : ""}>✨ Gemini Neural TTS — Aoede (мягкий женский голос)</option>
            <option value="gemini:Kore" ${sel === "gemini:Kore" ? "selected" : ""}>✨ Gemini Neural TTS — Kore (четкий женский голос)</option>
            <option value="browser_female" ${sel === "browser_female" ? "selected" : ""}>👩 Браузерный женский голос (Svetlana / Google русский / Irina)</option>
            ${browserOptions}
          </select>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:170px;">
              <span style="font-size:13.5px; color:#CBD5E1; white-space:nowrap;">Скорость: <b class="voice-rate-label" style="color:#00E5FF;">${voiceSettings.rate.toFixed(2)}×</b></span>
              <input type="range" min="0.80" max="1.25" step="0.01" value="${voiceSettings.rate}" oninput="onVoiceRateInput(this.value)" style="flex:1; accent-color:#00E5FF;" />
            </div>
            <div style="display:flex; align-items:center; gap:3px; height:32px; padding:0 8px; background:rgba(4,10,20,0.8); border-radius:8px; border:1px solid rgba(236,72,153,0.35);">
              ${eqBarsHtml}
            </div>
          </div>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; font-weight:700; color:#FDE68A;">
            <input type="checkbox" ${voiceSettings.autoAnnouncePhaseChange ? "checked" : ""} onchange="toggleAutoPhaseAnnounce(this.checked)" style="width:18px; height:18px; accent-color:#2EE59D;" />
            <span>🔔 Авто-озвучка при смене фазы Сушка / Отдых</span>
          </label>
        </div>
      `;
    }

    async function runAiSlicePhotoInspection() {
      const apiKey = (localStorage.getItem("GEMINI_API_KEY_JURMALCIEMS") || "").trim();
      const checkedSummary = SLICE_CHECKLIST_ITEMS.map((it, idx) =>
        `${sliceInspectorState.checks[idx] ? "[ДА]" : "[НЕТ]"} ${it.title}`
      ).join("; ");

      if (!apiKey) {
        sliceInspectorState.aiVerdictHtml = buildLocalSliceExpertVerdict();
        renderAll();
        showToast("Сформировано экспертное заключение по чек-листу (для анализа пикселей фото можно также подключить ключ Gemini API)");
        return;
      }

      sliceInspectorState.isAnalyzing = true;
      renderAll();

      try {
        const t = state.telemetry;
        const sp = FISH_SPECIES[t.speciesKey];
        const st = CURING_STAGES[t.stageKey];
        const promptText = `Ты — главный технолог цеха вяления рыбы в Юрмалциемсе (AIM AGHD-250ELC, закрытый контур Cantoni 4×3кВт, вакуум KOMET PlusVac 25). Проведи экспертную инспекцию среза рыбы / вакуумной упаковки. Правило цехового среза икряного окуня: "Икряной окунь в чешуе: рубиново-стекловидный балык спинки без сухого кольца закала; розовый ястык икры в плотной пленке отдает влагу медленнее спинки — на Стадии 4 в закрытой камере (13–15°C, 1ч/4ч) держать 36–48 ч для перетока влаги из ядра икры в мышцу перед вакуумом". Цеховой стандарт фасовки вимбы/окуня: по 3 тушки в гладкий пакет (~800–900 г, Soft Vac 95–96%), укладка в синий изотермический евроконтейнер с прокладкой гофрокартоном от света и проколов. Текущая партия: ${sp.titleRu}, ${st.titleRu}. Отметки технолога по чек-листу: ${checkedSummary}. Оцени по 4 пунктам (1. Рубиновая/янтарная спинка балыка; 2. Отсутствие белого кольца закала под чешуей; 3. Зернистость и влажность ястыка икры; 4. Отсутствие росы в вакуум-пакете и укладка) и дай четкий вердикт в 4–5 предложениях на русском языке.`;

        const parts = [];
        if (sliceInspectorState.base64Data) {
          parts.push({
            inline_data: {
              mime_type: sliceInspectorState.mimeType || "image/jpeg",
              data: sliceInspectorState.base64Data
            }
          });
        }
        parts.push({ text: promptText });

        const result = await callGeminiApiWithFallback(apiKey, parts, state.selectedChatModel || "gemini-2.5-flash");
        sliceInspectorState.isAnalyzing = false;

        const safeReply = result.text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
        sliceInspectorState.aiVerdictHtml = `
          <div style="background:rgba(0, 56, 68, 0.82); border:1.5px solid var(--cyan-dew); border-radius:10px; padding:12px; font-size:13.5px; line-height:1.52;">
            <b style="color:var(--cyan-dew);">✨ ВЕРДИКТ GEMINI VISION AI (${result.modelUsed} • ${sliceInspectorState.fileName ? "ПО ФОТО " + sliceInspectorState.fileName : "ПО ПРОФИЛЮ СРЕЗА"}):</b><br/>
            <div style="margin-top:6px;">${safeReply}</div>
          </div>
        `;
        renderAll();
        showToast(`Получено мультимодальное заключение от ${result.modelUsed}!`);
      } catch (err) {
        sliceInspectorState.isAnalyzing = false;
        const safeErr = String(err?.message || "Ошибка запроса к серверу").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        sliceInspectorState.aiVerdictHtml = `
          <div style="background:rgba(75, 17, 19, 0.86); border:1.5px solid var(--coral-danger); border-radius:10px; padding:12px; font-size:13px; line-height:1.5;">
            <b style="color:var(--coral-danger);">❌ ОШИБКА СЕРВЕРА GEMINI API:</b><br/>
            <div style="margin-top:4px; font-family:var(--font-mono); color:#FFD7D7;">${safeErr}</div>
            ${err?.triedModels ? `<div style="margin-top:4px; font-size:11.5px; color:var(--steel-text-secondary);">Проверенные модели: ${err.triedModels}</div>` : ""}
          </div>
        `;
        renderAll();
        showToast("Сервер Gemini API вернул ошибку — текст выведен на экран");
      }
    }

    function buildPhotoSliceInspectorHtml(t) {
      const isPerchRef = sliceInspectorState.refMode !== "VIMBA_PACK_3PCS";
      const hasUserPhoto = Boolean(sliceInspectorState.imageDataUrl);
      const verdictBox = sliceInspectorState.aiVerdictHtml || buildLocalSliceExpertVerdict();

      const referenceSvgHtml = isPerchRef
        ? `
          <svg viewBox="0 0 420 220" style="width:100%; height:auto; display:block; background:rgba(5, 11, 20, 0.92); border-radius:10px; border:1px solid rgba(255, 167, 38, 0.4);">
            <defs>
              <radialGradient id="rubyFilletGrad" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stop-color="#D50000" stop-opacity="0.92"/>
                <stop offset="65%" stop-color="#8E0000" stop-opacity="0.88"/>
                <stop offset="100%" stop-color="#4A0000" stop-opacity="0.95"/>
              </radialGradient>
              <radialGradient id="roeSacGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FF8A80" stop-opacity="0.95"/>
                <stop offset="70%" stop-color="#E53935" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="#880E4F" stop-opacity="0.95"/>
              </radialGradient>
            </defs>
            <text x="210" y="18" fill="#FFA726" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">ЭТАЛОН ВСКРЫТИЯ: ИКРЯНОЙ ОКУНЬ В ЧЕШУЕ (ЮРМАЛЦИЕМС)</text>
            <!-- Контур среза тушки окуня в панцирной чешуе -->
            <path d="M 105 115 C 105 42, 315 42, 315 115 C 315 178, 260 198, 210 198 C 160 198, 105 178, 105 115 Z" fill="#1B2838" stroke="#2EE59D" stroke-width="2.5" stroke-dasharray="5,2" />
            <!-- Рубиново-стекловидный балык спинки -->
            <path d="M 118 112 C 122 54, 298 54, 302 112 C 275 122, 145 122, 118 112 Z" fill="url(#rubyFilletGrad)" stroke="#FF5252" stroke-width="1.5" />
            <!-- Позвоночник в центре -->
            <circle cx="210" cy="108" r="7" fill="#F0F6FC" stroke="#9FB3C8" stroke-width="2" />
            <!-- Розовый ястык икры в плотной пленке в брюшке -->
            <ellipse cx="210" cy="154" rx="68" ry="32" fill="url(#roeSacGrad)" stroke="#FFD54F" stroke-width="2" />
            <!-- Зернистость икры и стрелки перетока влаги в мышцу (36-48ч Ст.4) -->
            <circle cx="185" cy="150" r="3" fill="#FFCDD2" /><circle cx="200" cy="146" r="3" fill="#FFCDD2" /><circle cx="218" cy="152" r="3" fill="#FFCDD2" /><circle cx="235" cy="148" r="3" fill="#FFCDD2" /><circle cx="208" cy="162" r="3" fill="#FFCDD2" />
            <path d="M 190 132 L 175 95" stroke="#00E5FF" stroke-width="1.8" stroke-dasharray="3,2" />
            <path d="M 230 132 L 245 95" stroke="#00E5FF" stroke-width="1.8" stroke-dasharray="3,2" />
            <!-- Выноски -->
            <text x="210" y="80" fill="#FFFFFF" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">Рубиново-стекловидный балык спинки</text>
            <text x="210" y="157" fill="#FFFFFF" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">Розовый ястык икры в пленке</text>
            <text x="210" y="170" fill="#FFE082" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle">Ст.4: 36–48ч (13–15°C) переток влаги ↑</text>
            <text x="210" y="212" fill="#2EE59D" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">✔ Чешуя без белого кольца закала (Case Hardening = НЕТ)</text>
          </svg>
        `
        : `
          <svg viewBox="0 0 420 220" style="width:100%; height:auto; display:block; background:rgba(5, 11, 20, 0.92); border-radius:10px; border:1px solid rgba(0, 229, 255, 0.4);">
            <text x="210" y="18" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">ЦЕХОВОЙ СТАНДАРТ: ПО 3 ТУШКИ В ПАКЕТ + СИНИЙ ЕВРОКОНТЕЙНЕР</text>
            <!-- Синий изотермический евроконтейнер -->
            <rect x="28" y="30" width="364" height="162" rx="10" fill="#0D47A1" stroke="#42A5F5" stroke-width="3" />
            <!-- Прокладка гофрокартоном внутри контейнера -->
            <rect x="40" y="42" width="340" height="138" rx="6" fill="#8D6E63" stroke="#FFCA28" stroke-width="2" stroke-dasharray="6,3" />
            <text x="210" y="56" fill="#FFF8E1" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" text-anchor="middle">Гофрокартон-прокладка (защита от УФ-света и проколов плавниками)</text>
            <!-- Гладкий вакуум-пакет KOMET PlusVac 25 на 3 тушки (~800-900 г) -->
            <rect x="62" y="64" width="296" height="104" rx="8" fill="rgba(200, 230, 255, 0.16)" stroke="#00E5FF" stroke-width="2" />
            <line x1="74" y1="64" x2="74" y2="168" stroke="#FF5252" stroke-width="2.5" />
            <!-- 3 тушки вимбы в пакете -->
            <ellipse cx="215" cy="86" rx="105" ry="13" fill="#FFA726" fill-opacity="0.75" stroke="#FFE082" stroke-width="1.2" />
            <ellipse cx="215" cy="116" rx="105" ry="13" fill="#FFA726" fill-opacity="0.75" stroke="#FFE082" stroke-width="1.2" />
            <ellipse cx="215" cy="146" rx="105" ry="13" fill="#FFA726" fill-opacity="0.75" stroke="#FFE082" stroke-width="1.2" />
            <text x="215" y="120" fill="#08111D" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="middle">3 тушки (~800–900 г) • Soft Vac 95–96%</text>
            <text x="210" y="210" fill="#2EE59D" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" text-anchor="middle">✔ Охлаждено до 13–15°C: росы и конденсата в пакете НЕТ</text>
          </svg>
        `;

      const photoPreviewHtml = hasUserPhoto
        ? `
          <div style="position:relative; background:rgba(5, 11, 20, 0.95); border:1.5px solid var(--cyan-dew); border-radius:10px; padding:8px; text-align:center;">
            <img src="${sliceInspectorState.imageDataUrl}" alt="Фото среза / вакуум-пакета" style="max-width:100%; max-height:260px; border-radius:8px; object-fit:contain; display:block; margin:0 auto;" />
            <div class="row-between" style="margin-top:8px; font-family:var(--font-mono); font-size:11px; color:var(--cyan-dew);">
              <span>📷 ${sliceInspectorState.fileName} (${sliceInspectorState.fileSizeKb} КБ)</span>
              <button class="chip" style="border-color:var(--coral-danger); color:var(--coral-danger); padding:3px 8px;" onclick="clearSlicePhoto()">✕ Сбросить фото</button>
            </div>
          </div>
        `
        : referenceSvgHtml;

      const checklistHtml = SLICE_CHECKLIST_ITEMS.map((item, idx) => {
        const checked = Boolean(sliceInspectorState.checks[idx]);
        const borderCol = checked ? "rgba(46, 229, 157, 0.55)" : "rgba(255, 82, 82, 0.65)";
        const bgCol = checked ? "rgba(6, 59, 39, 0.45)" : "rgba(75, 17, 19, 0.45)";
        return `
          <label onclick="toggleSliceChecklistItem(${idx}); return false;" style="display:flex; align-items:flex-start; gap:10px; background:${bgCol}; border:1px solid ${borderCol}; border-radius:9px; padding:8px 10px; cursor:pointer; margin-bottom:6px;">
            <input type="checkbox" ${checked ? "checked" : ""} style="width:17px; height:17px; margin-top:2px; accent-color:var(--emerald-optimal); pointer-events:none;" />
            <div style="flex:1;">
              <div style="font-family:var(--font-display); font-size:13px; font-weight:700; color:${checked ? "var(--emerald-optimal)" : "var(--coral-danger)"};">
                ${item.title}
              </div>
              <div style="font-size:12px; color:var(--steel-text-secondary); line-height:1.4; margin-top:2px;">
                ${item.desc}
              </div>
            </div>
          </label>
        `;
      }).join("");

      return `
        <div class="card card-amber" style="border-color: var(--cyan-dew);">
          <div class="row-between" style="margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div class="section-label" style="color: var(--cyan-dew); margin-bottom: 2px;">
                📷 ФОТО-ЭТАЛОН И ИИ-ИНСПЕКТОР СРЕЗА (ЮРМАЛЦИЕМС) • ИКРЯНОЙ ОКУНЬ & ВАКУУМ ВИМБЫ
              </div>
              <div class="section-sub">
                Загрузите фото контрольного вскрытия рыбы или вакуум-пакета со своего ПК, сверьте с цеховым эталоном (рубиновая спинка, отсутствие белого кольца закала, зернистость икры, отсутствие росы) и отправьте на проверку через Gemini Vision API.
              </div>
            </div>
            <div class="btn-row">
              <button class="btn btn-cyan" onclick="document.getElementById('slice-photo-input').click()">
                📂 Выбрать фото среза / пакета с ПК
              </button>
              <button class="btn btn-outline-amber" onclick="promptApiKey()" title="Настроить ключ Gemini API для распознавания фото">
                🔑 Ключ Gemini API
              </button>
            </div>
          </div>

          <!-- Переключатель эталона -->
          <div class="chip-row" style="margin-bottom: 10px;">
            <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--steel-text-secondary); align-self:center;">Эталон для сверки:</span>
            <button class="chip ${isPerchRef ? 'active-amber' : ''}" onclick="selectSliceReferenceMode('PERCH_SLICE')">
              🔪 Икряной окунь в чешуе (Рубиновый балык + розовый ястык икры, 36–48 ч Ст.4)
            </button>
            <button class="chip ${!isPerchRef ? 'active-cyan' : ''}" onclick="selectSliceReferenceMode('VIMBA_PACK_3PCS')">
              📦 Вакуум KOMET PlusVac 25 (По 3 тушки ~800–900 г в синем евроконтейнере с картоном)
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 14px; align-items: start; margin-bottom: 10px;">
            <!-- Левая колонка: Фото с ПК + схема эталона -->
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${photoPreviewHtml}
              ${hasUserPhoto ? referenceSvgHtml : ""}
            </div>

            <!-- Правая колонка: Интерактивный эталонный чек-лист (4 пункта) и кнопка отправки в Gemini API -->
            <div>
              <div style="font-family:var(--font-mono); font-size:11.5px; color:var(--amber-curing); font-weight:700; margin-bottom:6px;">
                📋 ЭТАЛОННЫЙ ЧЕК-ЛИСТ ВСКРЫТИЯ И УПАКОВКИ (НАЖМИТЕ ДЛЯ ПРОВЕРКИ):
              </div>
              ${checklistHtml}
              <div class="btn-row" style="margin-top:8px;">
                <button class="btn btn-emerald" style="width:100%;" onclick="runAiSlicePhotoInspection()">
                  ${sliceInspectorState.isAnalyzing ? "⏳ Анализ снимка в Gemini Vision API..." : "✨ Проверить фото и срез через ИИ-Инспектор (Gemini API)"}
                </button>
              </div>
            </div>
          </div>

          ${verdictBox}
        </div>
      `;
    }

    var lastPhaseCycleIndex = null;

    function announcePhaseChangeIfEnabled(isPauseNow, isManualTrigger) {
      if (!voiceSettings.autoAnnouncePhaseChange) return;
      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey] || FISH_SPECIES.VIMBA;
      const stage = CURING_STAGES[t.stageKey] || CURING_STAGES.STAGE_2;
      const msg = isPauseNow
        ? `Внимание, цех Юрмалциемс. Включена плановая пауза отдыха рыбы для партии ${sp.titleRu}, ${stage.shortTitleRu}. Обороты вентиляторов Кантони снижены до ${stage.pauseFreqLabel}. Длительность паузы — не более ${stage.defaultPauseHours} часов.`
        : `Внимание, цех Юрмалциемс. Включена активная сушка для партии ${sp.titleRu}, ${stage.shortTitleRu}. Частота вентиляторов Кантони — ${stage.activeFreqHz} герц, работает контуров осушения: ${t.activeCircuitsRunning}. Длительность сушки — ${stage.defaultWorkHours} часов.`;
      vxSpeak(msg);
    }

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

    // ==================== 4.0 ПУЛЬТ РУКОВОДИТЕЛЯ / ВИЗУАЛЬНОЕ ТАБЛО ЦЕХА (КРУПНЫЙ ШРИФТ + РЕНТГЕН СРЕЗА + Трап испарителя (60 см от пола) + KOMET + ЖИВОЙ ЖЕНСКИЙ ГОЛОС) ====================
    const OWNER_SPECIES_LIST = [
      { key: "VIMBA", shortName: "Вимба", fullSpoken: "Вимба (Сырть)" },
      { key: "BREAM", shortName: "Лещ", fullSpoken: "Крупный икряной лещ колодкой" },
      { key: "ROACH", shortName: "Плотва", fullSpoken: "Плотва крупная" },
      { key: "SMELT", shortName: "Корюшка", fullSpoken: "Корюшка балтийская" },
      { key: "PERCH", shortName: "Окунь", fullSpoken: "Икряной окунь в чешуе" },
      { key: "GOBY", shortName: "Бычок", fullSpoken: "Бычок балтийский" }
    ];

    const OWNER_STAGES_LIST = [
      { key: "STAGE_1", label: "Этап 1: Первые 2 дня", desc: "Съем первой свободной воды с чешуи и жабр" },
      { key: "STAGE_2", label: "Этап 2: Середина сушки", desc: "Вытяжка основной влаги от позвоночника (3–4 сутки)" },
      { key: "STAGE_3", label: "Этап 3: Досушка спинки", desc: "Финишное уплотнение балыка спинки (5–6 сутки)" },
      { key: "STAGE_4", label: "Этап 4: Отдых перед вакуумом", desc: "Выравнивание влаги и охлаждение тушки перед упаковкой" }
    ];

    function setAppUiMode(mode) {
      triggerHaptic(12);
      state.uiMode = mode === "OWNER" ? "OWNER" : "ENGINEER";
      if (state.uiMode === "ENGINEER") {
        stopOwnerSpeech();
      }
      persistStateToStorage();
      renderAll();
      if (state.uiMode === "OWNER") {
        showToast("💼 Включен Торговый Дом: Закуп, Склад TUBA и Сделки (€)");
      } else {
        showToast("🔬 Включен Инженерный режим: Главный Технолог • Камера и Холод");
      }
    }

    function stopOwnerSpeech() {
      try {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
      try {
        if (activeTtsAudioElement) {
          activeTtsAudioElement.pause();
          activeTtsAudioElement.currentTime = 0;
          activeTtsAudioElement = null;
        }
      } catch (e) {}
      setOwnerEqualizerActive(false);
    }

    function getOwnerSimpleSummaryData(t, species, stage, diag, yf) {
      const spItem = OWNER_SPECIES_LIST.find(s => s.key === species.key) || OWNER_SPECIES_LIST[0];
      const stItem = OWNER_STAGES_LIST.find(s => s.key === stage.key) || OWNER_STAGES_LIST[1];
      const targetTemp = targetTempRangeFor(species, stage, t.coLoadWithVimba);
      const rhRounded = Math.round(t.parksideRhPercent);

      // Оценка температуры простыми словами
      let tempStatusWord = "Норма";
      let tempColor = "#2EE59D";
      let tempDetailRu = `Идеальный коридор для этого этапа: от +${targetTemp[0]} до +${targetTemp[1]}°C. Рыба вялится бережно.`;
      if (t.environmentTempC >= species.emergencyMaxTempC) {
        tempStatusWord = "Слишком тепло — Опасно!";
        tempColor = "#FF5252";
        tempDetailRu = `Температура превысила допустимый порог +${species.emergencyMaxTempC}°C! Нужно срочно усилить охлаждение.`;
      } else if (t.environmentTempC > targetTemp[1] + 0.5) {
        tempStatusWord = "Чуть теплее нормы";
        tempColor = "#FFA726";
        tempDetailRu = `Рекомендуется снизить температуру в камере до +${targetTemp[0]}..+${targetTemp[1]}°C.`;
      } else if (t.environmentTempC < targetTemp[0] - 1.5) {
        tempStatusWord = "Прохладно";
        tempColor = "#00E5FF";
        tempDetailRu = `В камере прохладнее обычного (+${targetTemp[0]}..+${targetTemp[1]}°C), сушка идет чуть медленнее, но безопасно.`;
      }

      // Оценка влажности простыми словами
      let rhStatusWord = "Идет хороший съем воды";
      let rhColor = "#2EE59D";
      let rhDetailRu = `Воздух сухой и чистый (норма полки ${stage.targetShelfRhRange[0]}–${stage.targetShelfRhRange[1]}%), лишняя влага активно уходит из рыбы в слив.`;
      if (rhRounded >= 85) {
        rhStatusWord = "Высокая сырость — пора включить сушку!";
        rhColor = "#FF5252";
        rhDetailRu = `Влажность поднялась до ${rhRounded}%! Рыба отдала много воды в воздух — нужно включить холодильник на осушение.`;
      } else if (t.isPausePhaseNow || rhRounded > stage.targetShelfRhRange[1] + 5) {
        rhStatusWord = t.isPausePhaseNow ? "Рыба отдыхает (влага выходит изнутри)" : "Влажность выше рабочей полки";
        rhColor = "#FFA726";
        rhDetailRu = `Сейчас влага перетекает от позвоночника к чешуе. После короткого отдыха холодильник снова соберет эту воду.`;
      } else if (rhRounded < (stage.targetShelfRhRange[0] - 5)) {
        rhStatusWord = "Воздух слишком сухой";
        rhColor = "#FFA726";
        rhDetailRu = `Влажность опустилась ниже ${stage.targetShelfRhRange[0] - 5}% — дайте рыбе плановый отдых, чтобы чешуя не пересохла.`;
      }

      // Оценка холодильника и обдува простыми словами
      const isTwoCircuits = t.activeCircuitsRunning === 2;
      const circuitsWord = isTwoCircuits ? "Мощный старт — 2 контура" : "Экономичный режим — 1 контур";
      let fridgeWord = "Работает исправно";
      let fridgeColor = "#2EE59D";
      let fridgeDetailRu = t.isPausePhaseNow
        ? `Сейчас плановая пауза отдыха рыбы: холодильник стоит, вентиляторы крутятся тихо и бережно.`
        : `Осушитель собирает воду в канализацию без обмерзания, вентиляторы ровно продувают все 15 тележек.`;
      if (diag.eevStatus === "CRITICAL") {
        fridgeWord = "Требует проверки мастера";
        fridgeColor = "#FF5252";
        fridgeDetailRu = `Холодильная установка зажата или обмерзает — технологу нужно проверить фильтр и настройки холодильника.`;
      } else if (diag.eevStatus === "WARNING") {
        fridgeWord = "Работает с нагрузкой";
        fridgeColor = "#FFA726";
      }

      // Общий светофор (Карточка 1)
      let trafficStatus = "OPTIMAL";
      let trafficBannerTitle = "✅ ВСЁ РАБОТАЕТ ОТЛИЧНО! Рыба сохнет правильно, холодильник в норме";
      let trafficBannerSub = `В камере сейчас: ${spItem.fullSpoken} (${yf.rawWeightKg.toLocaleString("ru-RU")} кг, ${stItem.label.toLowerCase()}). Температура +${t.environmentTempC.toFixed(1)}°C и влажность ${rhRounded}% полностью в порядке — выйдет около ${yf.finishedAvgKg.toLocaleString("ru-RU")} кг отличной вяленой рыбы.`;
      let trafficBg = "linear-gradient(135deg, rgba(6, 78, 52, 0.92) 0%, rgba(4, 47, 32, 0.96) 100%)";
      let trafficBorder = "#2EE59D";
      let trafficTextCol = "#A7F3D0";

      if (t.environmentTempC >= species.emergencyMaxTempC || rhRounded >= 85 || diag.eevStatus === "CRITICAL") {
        trafficStatus = "CRITICAL";
        trafficBannerTitle = "🚨 ВНИМАНИЕ РУКОВОДИТЕЛЯ: Режим в камере нарушен — нужна проверка!";
        trafficBannerSub = `Обнаружено отклонение: температура +${t.environmentTempC.toFixed(1)}°C, влажность ${rhRounded}%. Позовите технолога проверить холодильник и включить активное осушение воздуха!`;
        trafficBg = "linear-gradient(135deg, rgba(110, 18, 24, 0.94) 0%, rgba(68, 10, 14, 0.97) 100%)";
        trafficBorder = "#FF5252";
        trafficTextCol = "#FECACA";
      } else if (
        diag.caseHardeningRisk === "WARNING" ||
        diag.thermalDamageRisk === "WARNING" ||
        t.isPausePhaseNow ||
        rhRounded > stage.targetShelfRhRange[1] + 5
      ) {
        trafficStatus = "WARNING";
        trafficBannerTitle = t.isPausePhaseNow
          ? "⏳ ИДЕТ ПЛАНОВЫЙ ОТДЫХ РЫБЫ: Влага спокойно выходит от хребта к чешуе"
          : "⚠️ РАБОЧИЙ ПРОЦЕСС: Небольшое отклонение от идеальной полки — под контролем";
        trafficBannerSub = t.isPausePhaseNow
          ? `Холодильник временно отключен на паузу отдыха (влажность ${rhRounded}%, температура +${t.environmentTempC.toFixed(1)}°C). Главное правило цеха: пауза отдыха на первых трех этапах не должна длиться дольше полутора–двух часов!`
          : `Партия ${spItem.fullSpoken} (${yf.rawWeightKg.toLocaleString("ru-RU")} кг) продолжает сушку. Проверьте подсказки в памятке ниже.`;
        trafficBg = "linear-gradient(135deg, rgba(110, 62, 4, 0.92) 0%, rgba(66, 36, 2, 0.96) 100%)";
        trafficBorder = "#FFA726";
        trafficTextCol = "#FDE68A";
      }

      // Экономика владельца в евро (Карточка 2)
      const finishedKg = yf.finishedAvgKg;
      const bulkRevenueEur = Math.round(finishedKg * 10);
      const vacuumPacks3PcsCount = Math.max(1, Math.round(finishedKg / 0.85));
      const vacuumPackCostEur = Math.round(finishedKg * 1.40);
      const vacuumWholesaleRevenueEur = Math.round(finishedKg * 20);
      const vacuumWholesaleExtraProfitEur = Math.max(0, vacuumWholesaleRevenueEur - bulkRevenueEur - vacuumPackCostEur);
      const vacuumRetailRevenueEur = Math.round(finishedKg * 33.33);

      // 3 пункта памятки «Что сейчас проверить в цеху» (Карточка 4)
      let checkItems = [];
      if (stage.key === "STAGE_1") {
        checkItems = [
          "1. Первые 2 дня работают оба контура холодильника — проверьте, чтобы вода бодро текла по трубке слива в канализацию (около 250–300 литров в сутки).",
          "2. Жаберные крышки у крупной рыбы должны быть приоткрыты, а брюшки всех рыб на тележках повернуты влево — навстречу потоку воздуха от вентиляторов.",
          "3. Раз в сутки меняйте передние и задние тележки местами (задние ряды перекатить вперед к вентиляторам, а центральный ряд развернуть на месте на 180 градусов)."
        ];
      } else if (stage.key === "STAGE_2") {
        checkItems = [
          "1. На 3–4 сутки верховая вода уже снята: должен работать только один (первый) контур холодильника в экономичном режиме.",
          "2. Если на 3–4 сутки у вимбы или леща показалась капля прозрачного жира у хвоста при сухой чешуе — не пугайтесь, это признак отличной жирной рыбы, а не брак!",
          "3. Следите, чтобы пауза отдыха вентиляторов длилась не дольше полутора часов подряд — в закрытой камере рыбе нужен свежий сухой обдув."
        ];
      } else if (stage.key === "STAGE_3") {
        checkItems = [
          "1. Идет финишный дожим спинки (5–6 сутки): потрогайте спинку у головы — она должна стать упругой и плотной, без мягких сырых провалов у хребта.",
          "2. Сделайте контрольный надрез одной рыбы: спинка вимбы и леща должна светиться как «янтарно-стекловидная слеза», а у окуня — как рубиновый балык без белого сухого ободка под чешуей.",
          "3. Когда влажность в камере уверенно держится на 50–54%, переводите партию на Этап 4 (спокойный отдых и охлаждение перед вакуумом)."
        ];
      } else {
        checkItems = [
          "1. Идет отдых и выравнивание перед вакуумной упаковкой: температура в камере должна быть прохладной (+13..+15°C), чтобы тушка остыла и в пакете никогда не выпала роса.",
          "2. Икряного окуня в чешуе держите на этом этапе в закрытой камере 36–48 часов (1 час сушка / 4 часа отдых), чтобы влага из плотного розового мешочка икры спокойно перешла в спинку.",
          "3. При упаковке на вакуумном аппарате: подрезайте острые плавники на 2–3 мм, фасуйте по 3 тушки в гладкий пакет (~850 г) и укладывайте в синий термоконтейнер, прокладывая слои картоном от света и проколов."
        ];
      }

      return {
        spItem,
        stItem,
        targetTemp,
        rhRounded,
        tempStatusWord,
        tempColor,
        tempDetailRu,
        rhStatusWord,
        rhColor,
        rhDetailRu,
        circuitsWord,
        fridgeWord,
        fridgeColor,
        fridgeDetailRu,
        trafficStatus,
        trafficBannerTitle,
        trafficBannerSub,
        trafficBg,
        trafficBorder,
        trafficTextCol,
        bulkRevenueEur,
        vacuumPacks3PcsCount,
        vacuumWholesaleRevenueEur,
        vacuumWholesaleExtraProfitEur,
        vacuumRetailRevenueEur,
        checkItems
      };
    }

    function speakOwnerReportAloud() {
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      if (typeof checkAndDispatchEmergencyAlarm === "function") checkAndDispatchEmergencyAlarm(diag);
      const yf = diag.yieldForecast;
      const d = getOwnerSimpleSummaryData(t, species, stage, diag, yf);

      const statusSentence = d.trafficStatus === "OPTIMAL"
        ? "Всё работает отлично! Рыба сохнет правильно, холодильник в полной норме."
        : (d.trafficStatus === "CRITICAL"
            ? "Внимание! Обнаружено отклонение режима в камере, требуется проверка холодильника и температуры."
            : "В камере идет штатный рабочий процесс, сейчас фаза отдыха и выравнивания влаги.");

      const breamExtraSpeech = species.key === "BREAM"
        ? " Особое правило для крупного икряного леща колодкой: для защиты от загара у позвоночника солить строго при плюс 2..4 °C, первые сутки вешать за хвост головой вниз с открытыми жабрами для слива сукровицы, на Ст.1 держать холодный старт плюс 12..14 °C, а перед вакуумом проверять проколом деревянной шпажки к позвоночнику и в анальное отверстие."
        : (species.key === "PERCH"
            ? " Особое правило для икряного окуня в чешуе: на Ст.4 в закрытой камере при плюс 13..15 °C держать 36–48 ч для перетока влаги из плотного розового ястыка икры в рубиново-мармеладный балык спинки."
            : "");

      const speechText =
        `Здравствуйте! Докладываю состояние сушильной камеры в цеху Юрмалциемс. ` +
        `${statusSentence} ` +
        `Сейчас в камере: ${d.spItem.fullSpoken}. ` +
        `Загружено сырья: ${yf.rawWeightKg} кг. ` +
        `Идет ${d.stItem.label}. ` +
        `Температура в камере: +${t.environmentTempC.toFixed(1)}°C (${d.tempStatusWord}). ` +
        `Влажность воздуха в камере: ${d.rhRounded}% rH (${d.rhStatusWord}), ΔT чешуи ${diag.deltaTempEvapC.toFixed(1)}°C. ` +
        `Холодильник и обдув: ${d.fridgeWord}, включен ${d.circuitsWord}. ` +
        `Из этой партии выйдет от ${yf.finishedMinKg} до ${yf.finishedMaxKg} кг готовой вяленой рыбы, в среднем ${yf.finishedAvgKg} кг, а в Трап испарителя (60 см от пола) уйдет около ${yf.totalWaterAvgLiters} л воды. ` +
        `По экономике на KOMET PlusVac 25: выйдет ${d.vacuumPacks3PcsCount} пакетов по три тушки, выручка составит около ${d.vacuumWholesaleRevenueEur} €, что дает плюс ${d.vacuumWholesaleExtraProfitEur} € чистой дополнительной прибыли сверх продажи на развес.` +
        breamExtraSpeech;

      vxSpeak(speechText);
      showToast("🔊 Озвучиваю отчет живым женским голосом...");
    }

    // ---------- ВИЗУАЛЬНЫЙ БЛОК А: 🔬 Рентген поперечного среза рыбы (Чешуя • Спинка у хребта • Ястык икры) ----------
    function buildOwnerFishCrossSectionHtml(t, species, stage, diag) {
      const stNum = stage.number;
      const isPerch = species.key === "PERCH";
      const isBream = species.key === "BREAM";
      const isSmelt = species.key === "SMELT";

      // Палитра спинки (балыка) от Ст.1 (бледно-розовая сырая) до Ст.4 (рубиново-мармеладный / янтарно-стекловидный монолит)
      const stageBalykPalettes = {
        1: {
          top: isPerch ? "#F48FB1" : "#FFCCBC",
          mid: isPerch ? "#EC407A" : "#FF8A65",
          core: "#E57373",
          nameRu: "Ст.1: Бледно-розовая сырая мышца (свободная влага 73–76%)",
          descRu: isBream
            ? "⚠️ Крупный лещ колодкой: у хребта самая высокая влажность! Обязателен холодный старт +12..+14°C и слив сукровицы через жабры (навеска за хвост первые сутки), чтобы исключить «загар» у кости."
            : "Идет активный съем первой свободной влаги через открытые поры чешуи и жабры без перегрева тушки."
        },
        2: {
          top: isPerch ? "#E53935" : "#FFB74D",
          mid: isPerch ? "#C62828" : "#FB8C00",
          core: isPerch ? "#EF5350" : "#FF7043",
          nameRu: "Ст.2: Уплотнение мышечных волокон и вытяжка от хребта (62–66%)",
          descRu: "Верховая вода снята, идет глубинная диффузия влаги от позвоночника к чешуе. В паузах влага выходит из ядра к поверхности."
        },
        3: {
          top: isPerch ? "#C62828" : "#FFA726",
          mid: isPerch ? "#8E0000" : "#F57C00",
          core: isPerch ? "#D32F2F" : "#EF6C00",
          nameRu: isPerch
            ? "Ст.3: Формирование плотного рубинового балыка спинки (54–57%)"
            : "Ст.3: Формирование «янтарно-стекловидной слезы» балыка (54–57%)",
          descRu: "Спинка у головы упругая и прозрачная на просвет, но внутри плотной пленки ястыка икры в брюшке еще остается запас влаги."
        },
        4: {
          top: isPerch ? "#B71C1C" : "#FF8F00",
          mid: isPerch ? "#7F0000" : "#E65100",
          core: isPerch ? "#AD1457" : "#F57C00",
          nameRu: isPerch
            ? "Ст.4: Эталон — Рубиново-мармеладный монолит без кольца закала (50–52%)"
            : "Ст.4: Эталон — Янтарно-стекловидный монолит без белесых пятен (50–53%)",
          descRu: isPerch
            ? "✅ Выдержка 36–48 ч в закрытой камере (+13..+15°C, 1ч сушка 25,3 Гц / 4ч отдых): влага из розового ястыка икры полностью перешла в мышцу спинки — ястык плотный и зернистый!"
            : "✅ Влага полностью выровнена между спинкой у хребта и брюшком, тушка охлаждена до +13..+15°C — роса в вакуум-пакете KOMET PlusVac 25 исключена!"
        }
      };
      const pal = stageBalykPalettes[stNum] || stageBalykPalettes[2];

      // Оценка кольца закала под чешуей
      const hasCrustRisk = diag.caseHardeningRisk !== "OPTIMAL" || t.parksideRhPercent < (stage.targetShelfRhRange[0] - 5);
      const scaleRimColor = hasCrustRisk ? "#FF5252" : "#2EE59D";
      const scaleStatusText = hasCrustRisk
        ? `⚠️ Внимание: риск подсыхания чешуи (кольца закала) при влажности ${Math.round(t.parksideRhPercent)}%`
        : `✅ Кольцо закала под чешуей отсутствует • Поры открыты (ΔT = +${diag.deltaTempEvapC.toFixed(1)}°C)`;

      // Риск загара у кости для крупного леща на Ст.1–2 при повышенной температуре
      const breamBoneRisk = isBream && stNum <= 2 && t.environmentTempC > 14.2;

      // Состояние ястыка икры в брюшке
      const roeColorOuter = stNum <= 2 ? "#F48FB1" : (stNum === 3 ? "#F06292" : "#EC407A");
      const roeColorInner = stNum <= 2 ? "#FCE4EC" : (stNum === 3 ? "#F8BBD0" : "#E91E63");
      const roeStatusText = stNum < 4
        ? `Плотная пленка ястыка удерживает влагу (сохнет в 1,8 раза медленнее спинки)`
        : `Зернистый плотный ястык икры (36–48 ч отволаживания выровняли влагу со спинкой)`;

      return `
        <div class="owner-card" style="border-color: #00E5FF; background: linear-gradient(180deg, #0D1B2E 0%, #07101C 100%);">
          <div class="owner-card-title" style="justify-content: space-between; flex-wrap: wrap;">
            <span>🔬 ВИЗУАЛЬНЫЙ РЕНТГЕН ПОПЕРЕЧНОГО СРЕЗА РЫБЫ (ЧЕШУЯ • СПИНКА У ХРЕБТА • ЯСТЫК ИКРЫ)</span>
            <span style="font-size: 16px; color: #00E5FF; font-family: var(--font-mono);">${species.titleRu} • ${stage.shortTitleRu}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; align-items: center;">
            <!-- Интерактивная SVG-анатомия поперечного разреза тушки -->
            <div style="background: #050C16; border: 2px solid #1E3A5F; border-radius: 18px; padding: 14px; position: relative;">
              <svg viewBox="0 0 840 410" style="width: 100%; height: auto; display: block;">
                <defs>
                  <radialGradient id="ownerBalykGrad" cx="50%" cy="42%" r="54%">
                    <stop offset="0%" stop-color="${pal.core}" />
                    <stop offset="55%" stop-color="${pal.mid}" />
                    <stop offset="100%" stop-color="${pal.top}" />
                  </radialGradient>
                  <radialGradient id="ownerRoeGrad" cx="50%" cy="50%" r="52%">
                    <stop offset="0%" stop-color="${roeColorInner}" />
                    <stop offset="100%" stop-color="${roeColorOuter}" />
                  </radialGradient>
                  <filter id="ownerGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <!-- Заголовок внутри рентген-экрана -->
                <text x="22" y="28" fill="#00E5FF" font-size="14" font-weight="800" font-family="monospace">ПОПЕРЕЧНЫЙ РАЗРЕЗ ТУШКИ • ВЛАГА У ХРЕБТА: ${diag.spineMoistureGmPercent}% • ΔT ЧЕШУИ: +${diag.deltaTempEvapC.toFixed(1)}°C</text>

                <!-- Стрелки диффузии паров воды через чешую наружу -->
                ${!hasCrustRisk ? `
                  <g stroke="#00E5FF" stroke-width="2.5" fill="none" opacity="0.85">
                    <path d="M 275 110 C 245 85, 220 70, 195 58" stroke-dasharray="5,4" />
                    <polygon points="195,58 206,57 201,67" fill="#00E5FF" stroke="none" />
                    <path d="M 565 110 C 595 85, 620 70, 645 58" stroke-dasharray="5,4" />
                    <polygon points="645,58 634,57 639,67" fill="#00E5FF" stroke="none" />
                    <path d="M 250 220 C 215 220, 190 220, 165 220" stroke-dasharray="5,4" />
                    <polygon points="165,220 175,215 175,225" fill="#00E5FF" stroke="none" />
                    <path d="M 590 220 C 625 220, 650 220, 675 220" stroke-dasharray="5,4" />
                    <polygon points="675,220 665,215 665,225" fill="#00E5FF" stroke="none" />
                  </g>
                ` : ""}

                <!-- Внешний контур чешуи (отсутствие или риск кольца закала) -->
                <path d="M 420 44 C 545 48, 605 145, 588 258 C 574 338, 505 384, 420 388 C 335 384, 266 338, 252 258 C 235 145, 295 48, 420 44 Z"
                      fill="url(#ownerBalykGrad)"
                      stroke="${scaleRimColor}"
                      stroke-width="${hasCrustRisk ? '8' : '4.5'}"
                      stroke-dasharray="${hasCrustRisk ? '10,5' : 'none'}" />

                <!-- Спинной плавник сверху -->
                <path d="M 406 45 L 420 14 L 434 45 Z" fill="#94A3B8" stroke="${scaleRimColor}" stroke-width="2" />

                <!-- Текстура мышечных сегментов (миомеров) балыка спинки -->
                <path d="M 310 135 Q 420 90 530 135" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2" />
                <path d="M 285 182 Q 420 130 555 182" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2" />

                <!-- Зона риска «загара» у позвоночника крупного леща на Ст.1 -->
                ${breamBoneRisk || (isBream && stNum === 1) ? `
                  <circle cx="420" cy="195" r="46" fill="rgba(255, 82, 82, 0.28)" stroke="#FF5252" stroke-width="2.5" stroke-dasharray="6,4" />
                ` : ""}

                <!-- Позвоночник (хребет) в центре и реберные дуги -->
                <path d="M 420 195 C 360 215, 322 265, 330 330" fill="none" stroke="#F8FAFC" stroke-width="3.5" opacity="0.85" />
                <path d="M 420 195 C 480 215, 518 265, 510 330" fill="none" stroke="#F8FAFC" stroke-width="3.5" opacity="0.85" />
                <circle cx="420" cy="195" r="17" fill="#0F172A" stroke="#F8FAFC" stroke-width="5" />
                <circle cx="420" cy="195" r="6" fill="#38BDF8" />

                <!-- Брюшная полость и парный ястык икры в плотной соединительной пленке -->
                ${!isSmelt ? `
                  <ellipse cx="382" cy="296" rx="44" ry="52" fill="url(#ownerRoeGrad)" stroke="#F48FB1" stroke-width="3.5" />
                  <ellipse cx="458" cy="296" rx="44" ry="52" fill="url(#ownerRoeGrad)" stroke="#F48FB1" stroke-width="3.5" />
                  <!-- Зернистость икры внутри ястыка -->
                  <g fill="rgba(255,255,255,0.48)">
                    <circle cx="368" cy="278" r="4" /><circle cx="388" cy="272" r="4" /><circle cx="396" cy="292" r="4" />
                    <circle cx="372" cy="306" r="4" /><circle cx="388" cy="318" r="4" /><circle cx="446" cy="276" r="4" />
                    <circle cx="466" cy="274" r="4" /><circle cx="472" cy="295" r="4" /><circle cx="450" cy="308" r="4" />
                    <circle cx="464" cy="320" r="4" />
                  </g>
                  <!-- Стрелки перетока влаги из ястыка икры в мышцу спинки (особенно на Ст.3–4) -->
                  <g stroke="#FFD166" stroke-width="2.6" fill="none">
                    <path d="M 375 248 L 352 162" stroke-dasharray="4,3" />
                    <polygon points="352,162 349,173 359,170" fill="#FFD166" stroke="none" />
                    <path d="M 465 248 L 488 162" stroke-dasharray="4,3" />
                    <polygon points="488,162 481,170 491,173" fill="#FFD166" stroke="none" />
                  </g>
                ` : `
                  <ellipse cx="420" cy="296" rx="52" ry="44" fill="url(#ownerRoeGrad)" stroke="#F48FB1" stroke-width="3" />
                `}

                <!-- Выноски с крупными русскими подписями -->
                <!-- 1. Спинка (балык) -->
                <line x1="420" y1="118" x2="625" y2="82" stroke="#FFD166" stroke-width="2" />
                <circle cx="420" cy="118" r="5" fill="#FFD166" />
                <rect x="625" y="54" width="202" height="54" rx="8" fill="rgba(9,19,32,0.92)" stroke="#FFD166" stroke-width="1.5" />
                <text x="635" y="74" fill="#FFD166" font-size="12.5" font-weight="800">1. БАЛЫК СПИНКИ</text>
                <text x="635" y="94" fill="#FFFFFF" font-size="11.5">${stNum === 4 ? (isPerch ? "Рубиновый монолит" : "Янтарная слеза") : `Влага ядра: ${diag.spineMoistureGmPercent}%`}</text>

                <!-- 2. Чешуя (контроль закала) -->
                <line x1="258" y1="168" x2="18" y2="128" stroke="${scaleRimColor}" stroke-width="2" />
                <circle cx="258" cy="168" r="5" fill="${scaleRimColor}" />
                <rect x="14" y="96" width="205" height="54" rx="8" fill="rgba(9,19,32,0.92)" stroke="${scaleRimColor}" stroke-width="1.5" />
                <text x="24" y="116" fill="${scaleRimColor}" font-size="12.5" font-weight="800">2. ЧЕШУЯ И МЕМБРАНА</text>
                <text x="24" y="136" fill="#FFFFFF" font-size="11.5">${hasCrustRisk ? "⚠️ Суховато (риск корки)" : "✅ Без кольца закала"}</text>

                <!-- 3. Позвоночник (хребет и шпажка леща) -->
                <line x1="420" y1="195" x2="18" y2="275" stroke="#38BDF8" stroke-width="2" />
                <rect x="14" y="248" width="212" height="58" rx="8" fill="rgba(9,19,32,0.92)" stroke="#38BDF8" stroke-width="1.5" />
                <text x="24" y="268" fill="#38BDF8" font-size="12.5" font-weight="800">3. ПОЗВОНОЧНИК (ХРЕБЕТ)</text>
                <text x="24" y="288" fill="#FFFFFF" font-size="11.5">${isBream ? "Контроль шпажкой от загара!" : `Вытяжка влаги от кости`}</text>

                <!-- 4. Ястык икры в брюшке -->
                <line x1="468" y1="305" x2="625" y2="305" stroke="#F48FB1" stroke-width="2" />
                <circle cx="468" cy="305" r="5" fill="#F48FB1" />
                <rect x="625" y="274" width="202" height="62" rx="8" fill="rgba(9,19,32,0.92)" stroke="#F48FB1" stroke-width="1.5" />
                <text x="635" y="294" fill="#F48FB1" font-size="12.5" font-weight="800">4. ЯСТЫК ИКРЫ В ПЛЕНКЕ</text>
                <text x="635" y="312" fill="#FFFFFF" font-size="11">Отдает влагу в 1,8× медленнее</text>
                <text x="635" y="327" fill="#FDE68A" font-size="11" font-weight="700">Ст.4: 36–48 ч выравнивания</text>
              </svg>
            </div>

            <!-- Правая панель расшифровки среза по выбранной рыбе и этапу -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="background: #091320; border-left: 5px solid ${pal.top}; border-radius: 14px; padding: 14px 18px;">
                <div style="font-size: 15px; font-weight: 800; color: #FFD166; text-transform: uppercase;">Состояние спинки (балыка) у хребта:</div>
                <div style="font-size: 21px; font-weight: 800; color: #FFFFFF; margin-top: 4px;">${pal.nameRu}</div>
                <div style="font-size: 17.5px; color: #CBD5E1; line-height: 1.45; margin-top: 6px;">${pal.descRu}</div>
              </div>

              <div style="background: #091320; border-left: 5px solid ${scaleRimColor}; border-radius: 14px; padding: 14px 18px;">
                <div style="font-size: 15px; font-weight: 800; color: ${scaleRimColor}; text-transform: uppercase;">Контроль чешуи (защита от кольца закала):</div>
                <div style="font-size: 19px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">${scaleStatusText}</div>
              </div>

              <div style="background: #091320; border-left: 5px solid #F48FB1; border-radius: 14px; padding: 14px 18px;">
                <div style="font-size: 15px; font-weight: 800; color: #F48FB1; text-transform: uppercase;">Состояние икряного мешка (ястыка) и брюшка:</div>
                <div style="font-size: 18.5px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">${roeStatusText}</div>
                <div style="font-size: 16.5px; color: #FDE68A; line-height: 1.4; margin-top: 6px;">
                  • <b>Икряной окунь:</b> 36–48 ч на Этапе 4 (+13..+15°C, 1ч сушка / 4ч отдых) для перетока влаги из икры в мышцу.<br/>
                  • <b>Крупный лещ колодкой:</b> первые сутки вешать <b>за хвост (головой вниз)</b> для слива сукровицы через жабры + прокол <b>деревянной шпажкой</b> перед вакуумом!
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ---------- ВИЗУАЛЬНЫЙ БЛОК Б: 💧 Водный баланс партии и Трап испарителя (60 см от пола) (л) + Световое кольцо-таймер фазы ----------
    function buildOwnerWaterAndTimerVisualHtml(t, species, stage, diag, yf) {
      const totalWaterL = yf.totalWaterAvgLiters;
      const stageWaterL = yf.currentStageWaterLiters;
      const stageSharePct = stage.moistureShareOfTotalPercent;
      const cumulativeShareMap = { STAGE_1: 45, STAGE_2: 75, STAGE_3: 95, STAGE_4: 100 };
      const tankFillPct = cumulativeShareMap[stage.key] || 65;
      const tankLevelY = Math.round(230 - (tankFillPct / 100) * 165);
      const dailyLiters = Math.round(stageWaterL / (stage.number === 1 ? 1.8 : 2.0));
      const hourlyLiters = (dailyLiters / 24).toFixed(1);

      const phaseDurHours = t.isPausePhaseNow ? stage.defaultPauseHours : stage.defaultWorkHours;
      const phaseDurMs = Math.max(60000, phaseDurHours * 3600 * 1000);
      const nowMs = Date.now();
      const elapsedMs = Math.max(0, nowMs - (t.phaseStartTimestampMs || nowMs));
      const remainMs = Math.max(0, phaseDurMs - (elapsedMs % phaseDurMs));
      const progressFrac = Math.max(0, Math.min(1, (elapsedMs % phaseDurMs) / phaseDurMs));
      const nextSwitchDate = new Date(nowMs + remainMs);
      const pad = n => String(Math.floor(n)).padStart(2, "0");
      const countdownStr = `${pad(remainMs / 3600000)}:${pad((remainMs % 3600000) / 60000)}:${pad((remainMs % 60000) / 1000)}`;
      const nextTimeStr = `${pad(nextSwitchDate.getHours())}:${pad(nextSwitchDate.getMinutes())}`;
      const circum = 2 * Math.PI * 82;
      const dash = ((1 - progressFrac) * circum).toFixed(1);
      const ringColor = t.isPausePhaseNow ? "#FFA726" : "#2EE59D";
      const phaseModeTitle = t.isPausePhaseNow
        ? `⏸ ПАУЗА ОТДЫХА (${stage.pauseFreqLabel})`
        : `⚡ АКТИВНАЯ СУШКА (${stage.activeFreqHz} Гц)`;

      return `
        <div class="owner-card" style="border-color: #38BDF8;">
          <div class="owner-card-title">
            <span>💧 ВОДНЫЙ БАЛАНС ПАРТИИ, Трап испарителя (60 см от пола) (Л) И СВЕТОВОЕ КОЛЬЦО-ТАЙМЕР ФАЗЫ</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; align-items: stretch;">
            <!-- Левая часть: Анимированный Внутренний трап испарителя (60 см от пола) (л) -->
            <div style="background: #091320; border: 2px solid #0284C7; border-radius: 18px; padding: 18px; display: flex; gap: 18px; align-items: center; flex-wrap: wrap;">
              <svg viewBox="0 0 210 260" style="width: 175px; height: auto; flex-shrink: 0; margin: 0 auto;">
                <defs>
                  <clipPath id="ownerTankClip">
                    <rect x="28" y="52" width="154" height="182" rx="18" />
                  </clipPath>
                  <linearGradient id="ownerWaterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#38BDF8" />
                    <stop offset="100%" stop-color="#0369A1" />
                  </linearGradient>
                </defs>
                <!-- Трубка слива конденсата сверху от испарителя AIM -->
                <path d="M 105 4 L 105 46" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" />
                <circle class="vx-drop" cx="105" cy="24" r="5" fill="#7DD3FC" />
                <circle class="vx-drop" cx="99" cy="30" r="4" fill="#38BDF8" style="animation-delay:0.45s;" />
                <circle class="vx-drop" cx="111" cy="28" r="4" fill="#38BDF8" style="animation-delay:0.9s;" />

                <g clip-path="url(#ownerTankClip)">
                  <rect x="24" y="${tankLevelY}" width="162" height="${240 - tankLevelY}" fill="url(#ownerWaterGrad)" opacity="0.9" />
                  <path class="vx-wave" d="M -30 ${tankLevelY} Q -5 ${tankLevelY - 8} 20 ${tankLevelY} T 70 ${tankLevelY} T 120 ${tankLevelY} T 170 ${tankLevelY} T 220 ${tankLevelY} V ${tankLevelY + 14} H -30 Z" fill="#BAE6FD" opacity="0.65" />
                </g>

                <!-- Корпус бака и деления литража -->
                <rect x="28" y="52" width="154" height="182" rx="18" fill="rgba(56,189,248,0.05)" stroke="#7DD3FC" stroke-width="3.5" />
                ${[25, 50, 75, 100].map((pct, i) => {
                  const yLine = 220 - i * 40;
                  return `<line x1="154" y1="${yLine}" x2="178" y2="${yLine}" stroke="#BAE6FD" stroke-width="2" />
                          <text x="148" y="${yLine + 4}" fill="#BAE6FD" font-size="11" font-family="monospace" text-anchor="end">${pct}%</text>`;
                }).join("")}
                <text x="105" y="150" text-anchor="middle" fill="#FFFFFF" font-size="25" font-weight="900">${totalWaterL.toLocaleString("ru-RU")} л</text>
                <text x="105" y="172" text-anchor="middle" fill="#E0F2FE" font-size="12" font-weight="700">ВСЕГО В СЛИВ</text>
              </svg>

              <div style="flex: 1; min-width: 210px; display: flex; flex-direction: column; gap: 10px;">
                <div style="font-size: 21px; font-weight: 800; color: #38BDF8;">
                  💧 Слив в трап испарителя: <span style="color:#FFFFFF;">${yf.totalWaterMinLiters.toLocaleString("ru-RU")}–${yf.totalWaterMaxLiters.toLocaleString("ru-RU")} л</span>
                </div>
                <div style="font-size: 18px; color: #E2E8F0; line-height: 1.4;">
                  • Съём на текущем этапе (<b>${stage.shortTitleRu}</b>): <b style="color:#00E5FF;">${stageWaterL.toLocaleString("ru-RU")} л</b> (${stageSharePct}% от всей воды)<br/>
                  • Поток по трубке слива: <b style="color:#2EE59D;">≈ ${dailyLiters} л/сутки</b> (~${hourlyLiters} л/час)
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 4px;">
                  ${[
                    { st: "Ст.1", sh: "45%", k: "STAGE_1" },
                    { st: "Ст.2", sh: "30%", k: "STAGE_2" },
                    { st: "Ст.3", sh: "20%", k: "STAGE_3" },
                    { st: "Ст.4", sh: "5%",  k: "STAGE_4" }
                  ].map(x => `
                    <div style="padding: 8px 6px; border-radius: 10px; text-align: center; background: ${stage.key === x.k ? 'rgba(0,229,255,0.22)' : 'rgba(15,23,42,0.85)'}; border: 1.5px solid ${stage.key === x.k ? '#00E5FF' : '#334155'};">
                      <div style="font-size: 13px; font-weight: 800; color: ${stage.key === x.k ? '#00E5FF' : '#94A3B8'};">${x.st}</div>
                      <div style="font-size: 16px; font-weight: 900; color: #FFFFFF;">${x.sh}</div>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

            <!-- Правая часть: Круговое световое кольцо-таймер текущей фазы (Сушка 30 Гц / Пауза 15–20 Гц) -->
            <div style="background: #091320; border: 2px solid ${ringColor}; border-radius: 18px; padding: 18px; display: flex; gap: 18px; align-items: center; flex-wrap: wrap;">
              <svg viewBox="0 0 210 210" style="width: 175px; height: 175px; flex-shrink: 0; margin: 0 auto;">
                <circle cx="105" cy="105" r="82" fill="none" stroke="rgba(51, 65, 85, 0.55)" stroke-width="15" />
                <circle id="owner-phase-ring-arc" cx="105" cy="105" r="82" fill="none" stroke="${ringColor}" stroke-width="15" stroke-linecap="round"
                        stroke-dasharray="${dash} ${circum.toFixed(1)}" transform="rotate(-90 105 105)"
                        style="filter: drop-shadow(0 0 10px ${ringColor}); transition: stroke-dasharray 0.5s linear;" />
                <text x="105" y="84" text-anchor="middle" fill="${ringColor}" font-size="13" font-weight="800" font-family="monospace">${t.isPausePhaseNow ? "ПАУЗА ОТДЫХА" : "СУШКА 30 ГЦ"}</text>
                <text id="owner-phase-ring-time" x="105" y="116" text-anchor="middle" fill="#FFFFFF" font-size="26" font-weight="900" font-family="monospace">${countdownStr}</text>
                <text id="owner-phase-ring-next" x="105" y="140" text-anchor="middle" fill="#CBD5E1" font-size="12" font-weight="700">Смена фазы в ${nextTimeStr}</text>
              </svg>

              <div style="flex: 1; min-width: 210px; display: flex; flex-direction: column; gap: 10px;">
                <div style="font-size: 21px; font-weight: 800; color: ${ringColor};">
                  ${phaseModeTitle}
                </div>
                <div style="font-size: 17.5px; color: #E2E8F0; line-height: 1.4;">
                  Регламент этапа: <b>${stage.defaultWorkHours} ч Сушка (${stage.activeFreqHz} Гц)</b> / <b>${stage.defaultPauseHours} ч Пауза (${stage.pauseFreqLabel})</b>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="owner-step-btn" style="${!t.isPausePhaseNow ? 'background:#2EE59D; color:#04130D;' : ''}" onclick="setPausePhase(false)">
                    ⚡ Сушка ${stage.activeFreqHz} Гц
                  </button>
                  <button class="owner-step-btn" style="${t.isPausePhaseNow ? 'background:#FFA726; color:#08111D;' : ''}" onclick="setPausePhase(true)">
                    ⏸ Пауза ${stage.pauseFreqLabel}
                  </button>
                  <button class="owner-step-btn" onclick="resetPhaseTimerNow()" title="Перезапустить отсчет текущей фазы">
                    🔄 Сброс
                  </button>
                </div>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:15.5px; font-weight:700; color:#FDE68A; margin-top:2px;">
                  <input type="checkbox" ${voiceSettings.autoAnnouncePhaseChange ? "checked" : ""} onchange="toggleAutoPhaseAnnounce(this.checked)" style="width:19px; height:19px; accent-color:#2EE59D;" />
                  <span>🔔 Авто-озвучка при смене фазы Сушка/Отдых</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ---------- ВИЗУАЛЬНЫЙ БЛОК В: 📦 Фасовка KOMET PlusVac 25 и Синие Евроконтейнеры ----------
    function buildOwnerKometPackagingVisualHtml(t, species, stage, yf, d) {
      const packs3Count = d.vacuumPacks3PcsCount;
      const blueContainersCount = Math.max(1, Math.ceil(packs3Count / 24)); // ~24 пакета по 850 г (~20,4 кг) в синий изотермический евроконтейнер
      const cardboardSheetsCount = blueContainersCount * 5; // по 5 листов гофрокартона на прокладку слоев в контейнере
      const premiumSingleCount = Math.max(1, Math.round(yf.finishedAvgKg / 0.30));

      return `
        <div class="owner-card" style="border-color: #A78BFA; background: linear-gradient(180deg, #111827 0%, #091320 100%);">
          <div class="owner-card-title" style="justify-content: space-between; flex-wrap: wrap;">
            <span>📦 ФАСОВКА KOMET PlusVac 25 И СИНИЕ ЕВРОКОНТЕЙНЕРЫ (РАСЧЕТ ПАЧЕК И ТАРЫ)</span>
            <span style="font-size: 16px; color: #A78BFA; font-family: var(--font-mono);">Мягкий вакуум 95–96% • Тушка +13..+15°C без росы</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; align-items: stretch;">
            <!-- Карточка А: Цеховой стандарт — По 3 тушки в пакет (~850 г) + Синий евроконтейнер с гофрокартоном -->
            <div style="background: #07101E; border: 2px solid #00E5FF; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div style="font-size: 21px; font-weight: 800; color: #00E5FF;">🟦 Стандарт цеха: По 3 тушки в пакет (~850 г)</div>
                <span class="pill-btn pill-cyan" style="font-size: 15px; cursor: default;">${packs3Count.toLocaleString("ru-RU")} пакетов</span>
              </div>

              <!-- SVG иллюстрация: Вакуум-пакет на 3 тушки + Синий термоконтейнер с прокладкой гофрокартоном -->
              <svg viewBox="0 0 540 185" style="width: 100%; height: auto; background: rgba(15,23,42,0.75); border-radius: 12px; border: 1px solid rgba(0,229,255,0.3);">
                <!-- Левая часть: Гладкий пакет KOMET на 3 тушки -->
                <rect x="16" y="18" width="225" height="148" rx="14" fill="rgba(0, 229, 255, 0.08)" stroke="#00E5FF" stroke-width="2.5" stroke-dasharray="6,3" />
                <line x1="26" y1="30" x2="231" y2="30" stroke="#F43F5E" stroke-width="4" />
                <text x="128" y="26" text-anchor="middle" fill="#FDA4AF" font-size="10" font-weight="800" font-family="monospace">ДВОЙНОЙ ШОВ KOMET PLUSVAC 25</text>
                ${[0, 1, 2].map(idx => {
                  const cx = 62 + idx * 66;
                  return `
                    <g transform="translate(${cx}, 96)">
                      <ellipse cx="0" cy="0" rx="22" ry="44" fill="#FFA726" stroke="#FDE68A" stroke-width="2" />
                      <polygon points="-8,42 8,42 14,54 -14,54" fill="#FB923C" />
                      <circle cx="-5" cy="-26" r="3" fill="#0F172A" />
                    </g>
                  `;
                }).join("")}
                <text x="128" y="160" text-anchor="middle" fill="#E0F2FE" font-size="11.5" font-weight="700">3 тушки (~850 г) • Плавники подрезаны 2–3 мм</text>

                <!-- Стрелка укладки -->
                <path d="M 252 92 L 284 92" stroke="#00E5FF" stroke-width="3.5" />
                <polygon points="284,92 274,85 274,99" fill="#00E5FF" />

                <!-- Правая часть: Синий изотермический Евроконтейнер с листами гофрокартона -->
                <rect x="294" y="22" width="230" height="142" rx="12" fill="#1D4ED8" stroke="#60A5FA" stroke-width="3" />
                <rect x="306" y="36" width="206" height="114" rx="6" fill="#0F172A" />
                <!-- Чередование слоев вакуум-пакетов и гофрокартона -->
                <rect x="312" y="42" width="194" height="7" rx="2" fill="#D97706" />
                <rect x="316" y="53" width="186" height="20" rx="4" fill="rgba(0,229,255,0.35)" stroke="#38BDF8" />
                <rect x="312" y="77" width="194" height="7" rx="2" fill="#D97706" />
                <rect x="316" y="88" width="186" height="20" rx="4" fill="rgba(0,229,255,0.35)" stroke="#38BDF8" />
                <rect x="312" y="112" width="194" height="7" rx="2" fill="#D97706" />
                <text x="409" y="138" text-anchor="middle" fill="#FDE68A" font-size="11" font-weight="800">СИНИЙ ЕВРОКОНТЕЙНЕР + КАРТОН</text>
              </svg>

              <div style="font-size: 18px; color: #E2E8F0; line-height: 1.45;">
                • Выйдет пачек по 3 тушки: <b style="color:#00E5FF;">${packs3Count.toLocaleString("ru-RU")} шт.</b> (вес готовой <b>${yf.finishedAvgKg.toLocaleString("ru-RU")} кг</b>)<br/>
                • Нужно синих изотермических евроконтейнеров: <b style="color:#60A5FA;">${blueContainersCount} конт.</b> + <b>${cardboardSheetsCount} листов гофрокартона</b> (защита от света и проколов)<br/>
                • Оптовая выручка в вакууме: <b style="color:#2EE59D;">${d.vacuumWholesaleRevenueEur.toLocaleString("ru-RU")} €</b> (прибавка <b>+${d.vacuumWholesaleExtraProfitEur.toLocaleString("ru-RU")} € чистыми</b>)
              </div>
            </div>

            <!-- Карточка Б: Штучный Премиум калибра 28–30+ см на подложке (~300 г) -->
            <div style="background: #07101E; border: 2px solid #FFA726; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div style="font-size: 21px; font-weight: 800; color: #FFD166;">💎 Штучный Премиум 28–30+ см (на подложке)</div>
                <span class="pill-btn pill-amber" style="font-size: 15px; cursor: default;">${premiumSingleCount.toLocaleString("ru-RU")} шт.</span>
              </div>

              <!-- SVG иллюстрация: Штучная премиум-упаковка 28–30+ см на золотой подложке -->
              <svg viewBox="0 0 540 185" style="width: 100%; height: auto; background: rgba(15,23,42,0.75); border-radius: 12px; border: 1px solid rgba(255,167,38,0.35);">
                <rect x="55" y="24" width="430" height="136" rx="16" fill="rgba(255,213,79,0.08)" stroke="#FFA726" stroke-width="2.5" />
                <rect x="75" y="38" width="390" height="108" rx="10" fill="linear-gradient(90deg, #78350F, #451A03)" stroke="#F59E0B" stroke-width="2" />
                <!-- Отборная тушка 28–30+ см -->
                <path d="M 115 92 C 175 52, 315 54, 395 92 C 415 74, 435 66, 442 66 C 436 88, 436 96, 442 118 C 435 118, 415 110, 395 92 C 315 130, 175 132, 115 92 Z"
                      fill="#F59E0B" stroke="#FEF08A" stroke-width="2.5" />
                <circle cx="145" cy="84" r="4.5" fill="#0F172A" />
                <text x="270" y="97" text-anchor="middle" fill="#08111D" font-size="13" font-weight="900">КАЛИБР 28–30+ СМ • ПРЕМИУМ БАЛЫК (~300 г)</text>
                <text x="270" y="152" text-anchor="middle" fill="#FDE68A" font-size="11.5" font-weight="700">Жесткая подложка золото/серебро • Защита от залома хвоста</text>
              </svg>

              <div style="font-size: 18px; color: #E2E8F0; line-height: 1.45;">
                • Выйдет штучных премиум-упаковок (~300 г): <b style="color:#FFD166;">${premiumSingleCount.toLocaleString("ru-RU")} шт.</b><br/>
                • Режим вакууматора KOMET PlusVac 25: <b>Soft Vac 95–96%</b> (не сплющивает икряное брюшко и не выдавливает жир под пленку)<br/>
                • Выручка при штучной продаже: до <b style="color:#FFA726;">${d.vacuumRetailRevenueEur.toLocaleString("ru-RU")} €</b>
              </div>
            </div>
          </div>

          <!-- 🔀 ИНТЕРАКТИВНЫЙ ПОЛЗУНОК МИКСА ВАКУУМА И ЛОГИСТИКА РАЗДЕЛЬНОЙ ВЫГРУЗКИ В РЕЖИМЕ РУКОВОДИТЕЛЯ -->
          <div style="margin-top:20px; background:#07101E; border:2px solid #2EE59D; border-radius:18px; padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
              <span style="font-size:20px; font-weight:800; color:#2EE59D;">🔀 СВОЙ МИКС: ДОЛЯ ВАКУУМА KOMET PLUSVAC 25</span>
              <span style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#FFFFFF;" id="owner-mixvac-label">${vx.mixVac}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value="${vx.mixVac}" style="width:100%; height:8px; accent-color:#2EE59D; cursor:pointer;" oninput="onVisualProfitInput('mixVac', this.value); const el=document.getElementById('owner-mixvac-label'); if(el) el.textContent=this.value+'%';"/>
            <div style="display:flex; justify-content:space-between; font-size:13px; color:#94A3B8; margin-top:6px;">
              <span>0% (Все в Еврокубы)</span>
              <span>50% / 50%</span>
              <span>100% (Вся партия в вакуум KOMET)</span>
            </div>
          </div>

          <div style="margin-top:16px;">
            ${buildLogisticsSplitCardHtml(vxComputeBatch(), vxComputeProfit(vxComputeBatch()))}
          </div>
        </div>
      `;
    }

    
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

    function renderAll(forceImmediate = false) {
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

    function renderAllImmediate() {
      renderAll(true);
    }

    function _renderAllCore() {
      // Рендер 5 главных технологических модулей
      const ctSlot = document.getElementById("chief-technologist-suite-slot");
      if (ctSlot && typeof renderChiefTechnologistSuite === "function") {
        ctSlot.innerHTML = renderChiefTechnologistSuite();
      }
      const t = state.telemetry;
      const species = FISH_SPECIES[t.speciesKey];
      const stage = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const yf = diag.yieldForecast;
      if (t.targetWaterLiters == null && yf && yf.totalWaterAvgLiters) {
        t.targetWaterLiters = yf.totalWaterAvgLiters;
      }
      const heatModeKey = t.heatRecoveryMode || "WINTER_14KW";
      const heatModeObj = HEAT_RECOVERY_MODES[heatModeKey] || HEAT_RECOVERY_MODES.WINTER_14KW;

      // 0. Рендер простого режима руководителя (и переключение видимости режимов)
      renderOwnerSimpleView(t, species, stage, diag, yf);
      if (typeof renderAllSpPanels === "function") {
        renderAllSpPanels();
      }
      broadcastTelemetrySync();

      // 1. HUD
      document.getElementById("hud-stage-title").textContent = `${stage.titleRu} (${stage.daysLabelRu})`;
      const phaseBadge = document.getElementById("hud-phase-badge");
      if (t.isPausePhaseNow) {
        phaseBadge.className = "pill-btn pill-amber";
        phaseBadge.textContent = `ПАУЗА ${stage.pauseFreqLabel} (${stage.pauseVoltageLabel})`;
      } else {
        phaseBadge.className = "pill-btn pill-emerald";
        phaseBadge.textContent = `СУШКА ${stage.activeFreqHz} Гц (${stage.activeVoltageV}V)`;
      }

      // 1b. Переключатель Термокороба эстакады [20]
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

      document.getElementById("hud-dewpoint").textContent = `${diag.dewPointC}°C`;
      document.getElementById("hud-env-sub").textContent = `Env ${t.environmentTempC}°C`;
      document.getElementById("hud-vpd").textContent = `${diag.vpdKpa} кПа`;
      document.getElementById("hud-rh-sub").textContent = `Parkside ${Math.round(t.parksideRhPercent)}% rH`;

      // Цветная индикация карточки «Дефицит VPD»: < 0.50 кПа (сырость/болото) или > 1.05 кПа (риск закала)
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

      renderPhaseTimerHud();
      renderScadaChamberMimicSvg(t, stage, species, diag);
      renderScadaVpdSpeedometerSvg(t, stage, species, diag);

      const inStepWin = t.eev1Steps >= 205 && t.eev1Steps <= 480;
      const inCoilWin = t.dehumicoilTempC >= 4.5 && t.dehumicoilTempC <= 5.8;
      const eevColor = t.eev1Steps < 75 ? "var(--coral-danger)" : (inStepWin && inCoilWin ? "var(--emerald-optimal)" : "var(--amber-curing)");
      document.getElementById("hud-eev-val").textContent = `${t.eev1Steps} st`;
      document.getElementById("hud-eev-val").style.color = eevColor;
      document.getElementById("hud-coil-sub").textContent = `Coil +${t.dehumicoilTempC}°C • ${t.activeCircuitsRunning}к`;

      const eevStatusLbl = document.getElementById("hud-eev-status-label");
      eevStatusLbl.style.color = eevColor;
      if (t.eev1Steps < 75) eevStatusLbl.textContent = "АВАРИЯ < 75 STEP";
      else if (!inStepWin) eevStatusLbl.textContent = "1#EEV ВНЕ ОКНА 205–480";
      else if (!inCoilWin) eevStatusLbl.textContent = `1#Dehumicoil ${t.dehumicoilTempC}°C (НОРМА +4.5..+5.8°C)`;
      else eevStatusLbl.textContent = `НОРМА: 1#EEV 205–480 & Coil +${t.dehumicoilTempC}°C`;

      const marker = document.getElementById("hud-eev-marker");
      const pct = Math.min(98, Math.max(2, (t.eev1Steps / 500) * 100));
      marker.style.left = `${pct}%`;
      marker.style.backgroundColor = eevColor;

      // 2. Presets
      document.getElementById("presets-row").innerHTML = SAMPLE_PRESETS.map((p, idx) => {
        const selected = p.telemetry.speciesKey === t.speciesKey && p.telemetry.stageKey === t.stageKey && p.telemetry.eev1Steps === t.eev1Steps;
        return `<button class="chip ${selected ? 'active-cyan' : ''}" onclick="applyPreset(${idx})">${p.label}</button>`;
      }).join("");

      // 3. Live Input Card
      document.getElementById("live-calc-mini").textContent = `Т.росы ${diag.dewPointC}°C • VPD ${diag.vpdKpa} кПа`;
      document.getElementById("advisor-species-chips").innerHTML = Object.values(FISH_SPECIES).map(sp =>
        `<button class="chip ${sp.key === t.speciesKey ? 'active-amber' : ''}" onclick="selectSpecies('${sp.key}')">${sp.titleRu}</button>`
      ).join("");
      document.getElementById("advisor-stage-chips").innerHTML = Object.values(CURING_STAGES).map(st =>
        `<button class="chip ${st.key === t.stageKey ? 'active-cyan' : ''}" style="flex:1; text-align:center;" onclick="selectStage('${st.key}')">Ст.${st.number}</button>`
      ).join("");

      document.getElementById("chip-phase-dry").className = `chip ${!t.isPausePhaseNow ? 'active-emerald' : ''}`;
      document.getElementById("chip-phase-pause").className = `chip ${t.isPausePhaseNow ? 'active-amber' : ''}`;

      document.getElementById("num-env").value = t.environmentTempC;
      document.getElementById("num-rh").value = Math.round(t.parksideRhPercent);
      document.getElementById("num-eev").value = t.eev1Steps;
      document.getElementById("num-coil").value = t.dehumicoilTempC;

      document.getElementById("rng-env").value = t.environmentTempC;
      document.getElementById("rng-rh").value = Math.round(t.parksideRhPercent);
      document.getElementById("rng-eev").value = t.eev1Steps;
      document.getElementById("rng-coil").value = t.dehumicoilTempC;

      const tRange = targetTempRangeFor(species, stage, t.coLoadWithVimba);
      document.getElementById("lbl-slider-env").textContent = `${t.environmentTempC}°C (норма ${tRange[0]}–${tRange[1]}°C)`;
      document.getElementById("lbl-slider-rh").textContent = `${Math.round(t.parksideRhPercent)}% (полка ${stage.targetShelfRhRange[0]}–${stage.targetShelfRhRange[1]}%)`;
      const lblEev = document.getElementById("lbl-slider-eev");
      lblEev.textContent = `${t.eev1Steps} step (окно 205–480, Min 75)`;
      lblEev.style.color = inStepWin ? "var(--emerald-optimal)" : "var(--coral-danger)";

      const lblCoil = document.getElementById("lbl-slider-coil");
      lblCoil.textContent = `+${t.dehumicoilTempC}°C (норма кипения +4.5...+5.8°C)`;
      lblCoil.style.color = inCoilWin ? "var(--emerald-optimal)" : "var(--amber-curing)";

      document.getElementById("chip-circ-1").className = `chip ${t.activeCircuitsRunning === 1 ? 'active-cyan' : ''}`;
      document.getElementById("chip-circ-2").className = `chip ${t.activeCircuitsRunning === 2 ? 'active-cyan' : ''}`;
      document.getElementById("chk-coload-advisor").checked = t.coLoadWithVimba;

      // 3b. Пирометр Бесконтактный пирометр шкуры (°C) и влагомер Игольчатый влагомер хребта (%) + ΔT испарения
      const numScaleEl = document.getElementById("num-scale-temp");
      const numSpineEl = document.getElementById("num-spine-moist");
      const deltaPillEl = document.getElementById("pyrometer-delta-pill");
      const deltaAlertEl = document.getElementById("pyrometer-delta-alert");
      if (numScaleEl) numScaleEl.value = diag.scaleSurfaceTempC;
      if (numSpineEl) numSpineEl.value = diag.spineMoistureGmPercent;
      if (deltaPillEl && deltaAlertEl) {
        const dSign = diag.deltaTempEvapC >= 0 ? "+" : "";
        const evCol = diag.evapStatus === "OPTIMAL"
          ? "var(--emerald-optimal)"
          : (diag.evapStatus === "CRITICAL" ? "var(--coral-danger)" : "var(--amber-curing)");
        const evBg = diag.evapStatus === "OPTIMAL"
          ? "rgba(6, 59, 39, 0.68)"
          : (diag.evapStatus === "CRITICAL" ? "rgba(75, 17, 19, 0.78)" : "rgba(71, 42, 0, 0.65)");
        deltaPillEl.className = diag.evapStatus === "OPTIMAL"
          ? "pill-btn pill-emerald"
          : (diag.evapStatus === "CRITICAL" ? "pill-btn pill-amber" : "pill-btn pill-cyan");
        deltaPillEl.textContent = `ΔT = Env ${t.environmentTempC}°C − Чешуя ${diag.scaleSurfaceTempC}°C = ${dSign}${diag.deltaTempEvapC.toFixed(1)}°C`;
        deltaAlertEl.style.borderColor = evCol;
        deltaAlertEl.style.background = evBg;
        deltaAlertEl.innerHTML = `<b style="color:${evCol};">${diag.evapStatusTitle}</b><br/>${diag.evapStatusText}`;
      }

      // 3c. Мини-калькулятор «Самодельный психрометр (Сухой + Мокрый датчик)» по формуле Реньо
      const psyDryInput = document.getElementById("num-psychro-dry");
      const psyWetInput = document.getElementById("num-psychro-wet");
      const psyGrid = document.getElementById("psychro-results-grid");
      const psyBadge = document.getElementById("psychro-summary-badge");
      if (t.psychroDryC === undefined) t.psychroDryC = t.environmentTempC;
      if (t.psychroWetC === undefined) t.psychroWetC = Math.round((t.environmentTempC - 4.0) * 10) / 10;
      if (psyDryInput && document.activeElement !== psyDryInput) psyDryInput.value = t.psychroDryC;
      if (psyWetInput && document.activeElement !== psyWetInput) psyWetInput.value = t.psychroWetC;
      const psyRes = calculateRegnaultPsychrometer(t.psychroDryC, t.psychroWetC);
      if (psyBadge) {
        psyBadge.textContent = `Реньо: rH = ${psyRes.rhPercent}% • Т.росы ${psyRes.dewPointC}°C ▼`;
      }
      if (psyGrid) {
        psyGrid.innerHTML = `
          <div class="metric-tile" style="border-color: var(--cyan-dew); background: rgba(0, 56, 68, 0.68);">
            <div class="m-label" style="color: var(--cyan-dew);">РЕАЛЬНАЯ ВЛАЖНОСТЬ (РЕНЬО)</div>
            <div class="m-val" style="color: var(--cyan-dew); font-size: 18px;">${psyRes.rhPercent}% rH</div>
            <div class="m-sub">ΔT психрометра: ${psyRes.deltaPsyC.toFixed(1)}°C</div>
          </div>
          <div class="metric-tile" style="border-color: var(--emerald-optimal); background: rgba(6, 59, 39, 0.68);">
            <div class="m-label" style="color: var(--emerald-optimal);">ТОЧКА РОСЫ / VPD</div>
            <div class="m-val" style="color: var(--emerald-optimal); font-size: 18px;">${psyRes.dewPointC}°C / ${psyRes.vpdKpa} кПа</div>
            <div class="m-sub">Парц. давление e = ${psyRes.eActualKpa} кПа</div>
          </div>
        `;
      }

      // 4. Advisor Card
      document.getElementById("advisor-card-subtitle").textContent =
        `${species.titleRu}, ${t.batchWeightKg} кг • Ст.${stage.number} • Выход ~${yf.finishedMinKg}–${yf.finishedMaxKg} кг • ${heatModeObj.shortBadgeRu}`;
      document.getElementById("ai-advice-text").textContent = state.customAiAdvice || diag.instantAdvisorSummary;
      document.getElementById("btn-request-ai").textContent = `✨ Совет ИИ (${t.environmentTempC}°C)`;

      // 5. 4-Point Diagnostics Breakdown
      const diagItems = [
        { title: "1. Риск закала чешуи (Case Hardening)", sev: diag.caseHardeningRisk, desc: diag.caseHardeningText },
        { title: "2. Риск подпарки (Денатурация / Т°C)", sev: diag.thermalDamageRisk, desc: diag.thermalDamageText },
        { title: "3. Диагностика 1#EEV (205–480) и 1#Dehumicoil", sev: diag.eevStatus, desc: diag.eevDiagnosisText },
        { title: "4. Переход на след. стадию / KOMET PlusVac 25", sev: diag.readinessStatus, desc: diag.readinessText }
      ];
      document.getElementById("diagnostics-grid").innerHTML = diagItems.map(item => {
        const col = item.sev === "OPTIMAL" ? "var(--emerald-optimal)" : (item.sev === "WARNING" ? "var(--amber-curing)" : "var(--coral-danger)");
        const bg = item.sev === "OPTIMAL" ? "var(--emerald-container)" : (item.sev === "WARNING" ? "var(--amber-container)" : "var(--coral-container)");
        const lbl = item.sev === "OPTIMAL" ? "НОРМА" : (item.sev === "WARNING" ? "КОНТРОЛЬ" : "РИСК / АВАРИЯ");
        const sym = item.sev === "OPTIMAL" ? "✓" : (item.sev === "WARNING" ? "!" : "✕");
        return `
          <div class="diag-card" style="border-color:${col};">
            <div class="diag-icon" style="background:${bg}; color:${col};">${sym}</div>
            <div style="flex:1;">
              <div class="row-between" style="margin-bottom:4px;">
                <span style="font-family:var(--font-display); font-weight:600; font-size:15px;">${item.title}</span>
                <span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:${col};">${lbl}</span>
              </div>
              <div style="font-size:13px; color:rgba(240,246,252,0.88); line-height:1.45;">${item.desc}</div>
            </div>
          </div>
        `;
      }).join("");

      // 5b. Геометрия Монолита (15 тележек 3×5) и СОП Рокировки в Советнике
      const monolithHtml = buildMonolithSopHtml(t);
      const advMonolithSlot = document.getElementById("advisor-monolith-sop-slot");
      if (advMonolithSlot) advMonolithSlot.innerHTML = monolithHtml;

      // 6. SVG-график "Кривая сушки партии" и Журнал замеров логгера Parkside
      renderBatchDryingCurveSvg(diag);
      document.getElementById("log-header-title").textContent = `ЖУРНАЛ ЗАМЕРОВ ЛОГГЕРА PARKSIDE (${state.batchLogs.length})`;
      if (state.batchLogs.length === 0) {
        document.getElementById("batch-logs-list").innerHTML = `
          <div class="card" style="text-align:center; color:var(--steel-text-secondary); padding:18px;">
            Журнал замеров пуст. Нажмите <b>«🔖 Записать замер в журнал логгера Parkside»</b> выше, чтобы добавить текущую точку на кривую сушки партии.
          </div>
        `;
      } else {
        document.getElementById("batch-logs-list").innerHTML = state.batchLogs.map(log => {
          const sp = FISH_SPECIES[log.telemetry.speciesKey] || FISH_SPECIES.VIMBA;
          const st = CURING_STAGES[log.telemetry.stageKey] || CURING_STAGES.STAGE_1;
          return `
            <div class="card">
              <div class="row-between">
                <span style="font-family:var(--font-display); font-weight:700; color:var(--cyan-dew);">
                  ${sp.titleRu} • ${log.telemetry.batchWeightKg} кг • Ст.${st.number}
                </span>
                <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--steel-text-secondary);">${log.timestampStr}</span>
              </div>
              <div style="font-family:var(--font-mono); font-size:11.5px; color:var(--amber-curing); margin:5px 0;">
                Env: ${log.telemetry.environmentTempC}°C | Parkside: ${Math.round(log.telemetry.parksideRhPercent)}% rH | 1#EEV: ${log.telemetry.eev1Steps} st | 1#Dehumicoil: +${log.telemetry.dehumicoilTempC}°C | Т. росы: ${log.dewPointC}°C
              </div>
              <div style="font-size:13px; line-height:1.45;">${escapeHtml(log.adviceText)}</div>
            </div>
          `;
        }).join("");
      }

      // ==================== ВКЛАДКА 2: 8 ФАЗ MCGS ====================
      const calcHtml = buildCalculatorCardHtml(t, yf);
      const mcgsTotals = calculateMcgsCycleTotals(stage, diag.mcgsPhases);
      const fmtComma = n => String(n).replace(".", ",");
      document.getElementById("mcgs-calculator-slot").innerHTML = calcHtml;
      const mcgsMonolithSlot = document.getElementById("mcgs-monolith-sop-slot");
      if (mcgsMonolithSlot) mcgsMonolithSlot.innerHTML = monolithHtml;
      document.getElementById("mcgs-table-header").textContent = `ТАБЛИЦА 8 ФАЗ MCGS • ${stage.shortTitleRu.toUpperCase()}`;
      document.getElementById("mcgs-table-sub").textContent =
        `${species.titleRu} (${t.batchWeightKg} кг → ${yf.finishedMinKg}–${yf.finishedMaxKg} кг) • Общее время 8 фаз: ${fmtComma(mcgsTotals.totalHours)} ч (${fmtComma(mcgsTotals.totalDays)} сут) • ~${mcgsTotals.avgKwh} кВт·ч`;

      const mcgsSummaryBar = document.getElementById("mcgs-cycle-summary-bar");
      if (mcgsSummaryBar) {
        mcgsSummaryBar.innerHTML = `
          <div class="metric-tile" style="border-color: var(--cyan-dew); background: rgba(0, 56, 68, 0.72);">
            <div class="m-label" style="color: var(--cyan-dew);">⏱ ОБЩЕЕ ВРЕМЯ 8 ФАЗ MCGS</div>
            <div class="m-val" style="color: var(--steel-text-primary); font-size: 18px;">${fmtComma(mcgsTotals.totalHours)} ч (${fmtComma(mcgsTotals.totalDays)} сут)</div>
            <div class="m-sub" style="color: var(--cyan-dew);">Сушка: ${fmtComma(mcgsTotals.workHoursTotal)} ч • Паузы: ${fmtComma(mcgsTotals.pauseHoursTotal)} ч • Буфер Ф8: ${fmtComma(mcgsTotals.bufferHours)} ч</div>
          </div>
          <div class="metric-tile" style="border-color: var(--amber-curing); background: rgba(71, 42, 0, 0.65);">
            <div class="m-label" style="color: var(--amber-curing);">⚡ РАСЧЕТНОЕ ПОТРЕБЛЕНИЕ ЗА ЦИКЛ (8 ФАЗ)</div>
            <div class="m-val" style="color: var(--amber-curing); font-size: 18px;">~${mcgsTotals.avgKwh} кВт·ч (${mcgsTotals.minKwh}–${mcgsTotals.maxKwh})</div>
            <div class="m-sub">Сушка: ${mcgsTotals.activeKwRange[0]}–${mcgsTotals.activeKwRange[1]} кВт • Пауза VFD: 1,8–2,4 кВт</div>
          </div>
          <div class="metric-tile" style="border-color: var(--emerald-optimal); background: rgba(6, 59, 39, 0.68);">
            <div class="m-label" style="color: var(--emerald-optimal);">💧 ВЛАГОСЪЕМ ТЕКУЩЕЙ СТАДИИ</div>
            <div class="m-val" style="color: var(--emerald-optimal); font-size: 18px;">~${yf.currentStageWaterLiters} л воды</div>
            <div class="m-sub">${stage.moistureShareOfTotalPercent}% от общего съема (${yf.totalWaterMinLiters}–${yf.totalWaterMaxLiters} л)</div>
          </div>
        `;
      }

      document.getElementById("mcgs-coload-label").textContent = `Совместная загрузка с вимбой (${t.coLoadWithVimba ? "Вкл" : "Моно-режим"})`;
      document.getElementById("chk-coload-mcgs").checked = t.coLoadWithVimba;

      document.getElementById("mcgs-tbody").innerHTML = diag.mcgsPhases.map(p => {
        const isOdd = p.phaseNumber % 2 === 1;
        const col = p.phaseNumber === 8 ? "var(--cyan-dew)" : (isOdd ? "var(--emerald-optimal)" : "var(--amber-curing)");
        return `
          <tr>
            <td style="color:${col}; font-weight:700;">Ф${p.phaseNumber}</td>
            <td style="color:${col}; font-weight:700;">${p.modeLabel}</td>
            <td>${p.tempSetpointC}°C</td>
            <td style="color:${col}; font-weight:700;">${p.humiSetpointPercent}%</td>
            <td>${p.durationHours} ч</td>
            <td>${p.cantoniFreqHz} (${p.cantoniVoltageV})</td>
            <td style="color:var(--steel-text-secondary);">${p.circuitsNote}</td>
          </tr>
        `;
      }).join("");

      const quickSwitcherEl = document.getElementById("mcgs-mobile-quick-switcher");
      if (quickSwitcherEl) {
        const stRow = Object.values(CURING_STAGES).map(st =>
          `<button class="chip ${st.key === t.stageKey ? 'active-cyan' : ''}" style="flex:1; text-align:center; padding:8px 6px; font-weight:800;" onclick="selectStage('${st.key}')">Ст.${st.number}</button>`
        ).join("");
        const phFilterItems = [
          { k: "ALL", lbl: "Все Ф1–Ф8" },
          { k: "DRY", lbl: "⚡ Сушка (Ф1,3,5,7)" },
          { k: "PAUSE", lbl: "⏸ Паузы (Ф2,4,6)" },
          { k: "1", lbl: "Ф1" }, { k: "2", lbl: "Ф2" }, { k: "3", lbl: "Ф3" }, { k: "4", lbl: "Ф4" },
          { k: "5", lbl: "Ф5" }, { k: "6", lbl: "Ф6" }, { k: "7", lbl: "Ф7" }, { k: "8", lbl: "🛡 Ф8 Буфер" }
        ];
        const phRow = phFilterItems.map(it =>
          `<button class="chip ${String(mcgsMobilePhaseFilter) === it.k ? 'active-amber' : ''}" onclick="setMcgsPhaseFilter('${it.k}')">${it.lbl}</button>`
        ).join("");
        quickSwitcherEl.innerHTML = `
          <div style="font-family:var(--font-mono); font-size:11px; color:var(--amber-curing); font-weight:700; margin-bottom:6px;">
            📱 МОБИЛЬНЫЙ ПУЛЬТ 8 ФАЗ MCGS (БЫСТРОЕ ПЕРЕКЛЮЧЕНИЕ ОДНОЙ РУКОЙ У ШКАФА КАМЕРЫ):
          </div>
          <div style="display:flex; gap:6px; margin-bottom:8px;">${stRow}</div>
          <div class="chip-row" style="gap:6px;">${phRow}</div>
        `;
      }

      const filteredMcgsPhases = diag.mcgsPhases.filter(p => {
        const f = String(mcgsMobilePhaseFilter || "ALL");
        if (f === "ALL") return true;
        if (f === "DRY") return p.phaseNumber % 2 === 1 && p.phaseNumber !== 8;
        if (f === "PAUSE") return p.phaseNumber % 2 === 0 && p.phaseNumber !== 8;
        return String(p.phaseNumber) === f;
      });

      document.getElementById("mcgs-cards-list").innerHTML = filteredMcgsPhases.map(p => {
        const isOdd = p.phaseNumber % 2 === 1;
        const col = p.phaseNumber === 8 ? "var(--cyan-dew)" : (isOdd ? "var(--emerald-optimal)" : "var(--amber-curing)");
        const badgeIcon = p.phaseNumber === 8 ? "🛡️ БУФЕР ХРАНЕНИЯ" : (isOdd ? "⚡ АКТИВНАЯ СУШКА" : "⏸ ПАУЗА ВЫРАВНИВАНИЯ");
        return `
          <div class="mcgs-phase-card-pro" style="border-color:${col}; box-shadow: 0 8px 24px rgba(0,0,0,0.65), 0 0 16px ${p.phaseNumber === 8 ? 'rgba(0,229,255,0.14)' : (isOdd ? 'rgba(46,229,157,0.14)' : 'rgba(255,167,38,0.14)')};">
            <div class="row-between" style="margin-bottom:8px; gap:8px;">
              <div>
                <div style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:${col}; letter-spacing:0.6px;">${badgeIcon}</div>
                <div style="font-family:var(--font-display); font-size:19px; font-weight:800; color:#FFFFFF; margin-top:1px;">ФАЗА Ф${p.phaseNumber} • ${p.modeLabel}</div>
              </div>
              <span style="font-family:var(--font-display); font-size:22px; font-weight:900; color:${col}; background:rgba(0,0,0,0.45); border:1.5px solid ${col}; padding:4px 12px; border-radius:999px;">
                ${p.durationHours} ч
              </span>
            </div>
            <div class="mcgs-phase-metrics-row">
              <div class="mcgs-phase-metric-box" style="border-color:rgba(255,167,38,0.45);">
                <div class="mcgs-phase-metric-lbl">🌡 Temp (°C)</div>
                <div class="mcgs-phase-metric-val" style="color:var(--amber-curing);">${p.tempSetpointC}°C</div>
              </div>
              <div class="mcgs-phase-metric-box" style="border-color:rgba(0,229,255,0.45);">
                <div class="mcgs-phase-metric-lbl">💧 Humi (%)</div>
                <div class="mcgs-phase-metric-val" style="color:var(--cyan-dew);">${p.humiSetpointPercent}%</div>
              </div>
              <div class="mcgs-phase-metric-box" style="border-color:rgba(46,229,157,0.45);">
                <div class="mcgs-phase-metric-lbl">⏱ Time (ч)</div>
                <div class="mcgs-phase-metric-val" style="color:var(--emerald-optimal);">${p.durationHours} ч</div>
              </div>
              <div class="mcgs-phase-metric-box" style="border-color:${col};">
                <div class="mcgs-phase-metric-lbl">🌀 Cantoni VFD</div>
                <div class="mcgs-phase-metric-val" style="color:${col}; font-size:15px;">${p.cantoniFreqHz}</div>
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--steel-text-secondary);">${p.cantoniVoltageV}</div>
              </div>
            </div>
            <div style="font-size:12.5px; color:var(--steel-text-primary); line-height:1.42; margin-bottom:10px; background:rgba(4,10,20,0.75); padding:8px 10px; border-radius:8px; border-left:3px solid ${col};">
              ${p.circuitsNote}
            </div>
            <button class="btn btn-outline-cyan" style="width:100%; padding:8px 12px; font-size:12.5px; border-color:${col}; color:${col};" onclick="applyMcgsPhaseToChamber(${p.phaseNumber})">
              ▶ Применить уставки Фазы Ф${p.phaseNumber} (${p.tempSetpointC}°C / ${p.humiSetpointPercent}%) в камеру
            </button>
          </div>
        `;
      }).join("");

      // ==================== ВКЛАДКА 3: 6 ВИДОВ РЫБ ====================
      document.getElementById("species-calculator-slot").innerHTML = calcHtml;
      const speciesVacuumSlot = document.getElementById("species-vacuum-calc-slot");
      if (speciesVacuumSlot) speciesVacuumSlot.innerHTML = buildPremiumVacuumCalculatorHtml(t);
      const speciesPhotoSlot = document.getElementById("species-photo-inspector-slot");
      if (speciesPhotoSlot) speciesPhotoSlot.innerHTML = buildPhotoSliceInspectorHtml(t);
      document.getElementById("species-matrix-header").textContent = `МАТРИЦА 6 ВИДОВ РЫБ (РАСЧЕТ НА ${t.batchWeightKg} КГ СЫРЬЯ)`;
      document.getElementById("species-cards-container").innerHTML = Object.values(FISH_SPECIES).map(sp => {
        const isSel = sp.key === t.speciesKey;
        const spYield = calculateYieldForecast(t.batchWeightKg, sp, stage);
        const spTemp = targetTempRangeFor(sp, stage, t.coLoadWithVimba);
        return `
          <div class="card ${isSel ? 'card-amber' : ''}" style="${isSel ? 'background:var(--baltic-elevated);' : ''}">
            <div class="row-between">
              <div>
                <div style="font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--amber-curing);">${sp.titleRu}</div>
                <div style="font-size:13px; color:var(--steel-text-secondary);">${sp.subtitleRu}</div>
              </div>
              <span class="pill-btn pill-emerald" style="cursor:default;">Выход ${sp.yieldPercentRange}</span>
            </div>
            <div class="hud-grid" style="margin:10px 0;">
              <div class="metric-tile">
                <div class="m-label">Готовая продукция</div>
                <div class="m-val" style="font-size:16px;">${spYield.finishedMinKg}–${spYield.finishedMaxKg} кг</div>
              </div>
              <div class="metric-tile">
                <div class="m-label">Испарить воды</div>
                <div class="m-val" style="font-size:16px; color:var(--cyan-dew);">${spYield.totalWaterMinLiters}–${spYield.totalWaterMaxLiters} л</div>
              </div>
              <div class="metric-tile">
                <div class="m-label">Т°C на Ст.${stage.number}</div>
                <div class="m-val" style="font-size:16px; color:var(--amber-curing);">${spTemp[0]}–${spTemp[1]}°C</div>
              </div>
            </div>
            <div style="font-family:var(--font-mono); font-size:11.5px; color:var(--cyan-dew); margin-bottom:6px;">
              Цикл: ${sp.durationDaysDesc} • Аварийный порог: &lt; ${sp.emergencyMaxTempC}°C
            </div>
            <div style="font-size:13px; line-height:1.45; margin-bottom:8px;">${sp.bioFeatureRu}</div>
            <div class="divider"></div>
            <div>
              ${sp.prepChecklistRu.map(item => `<div class="checklist-item"><span style="color:var(--emerald-optimal);">✔</span><span>${item}</span></div>`).join("")}
            </div>
            <div class="btn-row" style="margin-top:12px;">
              <button class="btn btn-outline-cyan" style="flex:1;" onclick="selectSpecies('${sp.key}'); selectTab('advisor');">▶ В Советник</button>
              <button class="btn btn-amber" style="flex:1;" onclick="selectSpecies('${sp.key}'); selectTab('mcgs');">📊 Таблица 8 фаз</button>
            </div>
          </div>
        `;
      }).join("");

      // ==================== ВКЛАДКА 4: ЧАТ ИИ ====================
      updateGeminiApiStatusUi();
      document.getElementById("chat-context-header").textContent =
        `ЧАТ С ИИ-ТЕХНОЛОГОМ (КОНТЕКСТ: ${species.titleRu.toUpperCase()}, ${t.batchWeightKg} КГ, СТ.${stage.number})`;
      document.getElementById("chat-model-chips").innerHTML = CHAT_MODELS.map(m =>
        `<button class="chip ${state.selectedChatModel === m.id ? 'active-cyan' : ''}" onclick="state.selectedChatModel='${m.id}'; renderAll();">${m.titleRu}</button>`
      ).join("");
      document.getElementById("quick-questions-row").innerHTML = QUICK_QUESTIONS.map((q, i) =>
        `<button class="chip" style="color:var(--amber-curing);" data-action="quick-question" data-question="${escapeHtml(q)}" onclick="sendChatMessage('${q.replace(/'/g, "\\'")}')">${q}</button>`
      ).join("");
      renderChatPhotoPreviewBar();
      renderChatMessages();

      // ==================== ВКЛАДКА 5: ЛИНИЯ AIM ====================
      document.getElementById("hardware-cards-container").innerHTML = HARDWARE_SPECS.map(card => `
        <div class="card" style="border-color:${card.color};">
          <div style="font-family:var(--font-display); font-size:17px; font-weight:700; color:${card.color}; margin-bottom:10px;">
            ${card.title}
          </div>
          ${card.bullets.map(b => `
            <div style="display:flex; gap:8px; margin:6px 0; font-size:13.5px; line-height:1.45;">
              <span style="color:${card.color}; font-weight:700;">•</span>
              <span>${b}</span>
            </div>
          `).join("")}
        </div>
      `).join("");

      // ==================== VX: 4 ВИЗУАЛЬНЫХ ЭКРАНА (Штурман / Партия / Прибыль / Пульт) ====================
      try {
        renderVisualScreens();
      } catch (e) {
        console.error("Ошибка рендера визуальных экранов:", e);
      }

      // Синхронизация мобильной оболочки Mobile Flagship HUD (AMOLED Edition)
      try {
        updateMobileHudChrome(t, species, stage, diag);
      } catch (e) {}

      // Автосохранение в localStorage при любом обновлении состояния
      
      // 5 Новых модулей (Задачи 1, 3, 4)
      try { renderSaltingCalculator(); } catch(e) { console.error("SaltingCalc err:", e); }
      try { renderAerodynamicsCalculator(); } catch(e) { console.error("AerodynamicsCalc err:", e); }
      try { renderMicrobiologyCalculator(); } catch(e) { console.error("MicrobioCalc err:", e); }

      persistStateToStorage();
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

    // ==================== 5. ОБРАБОТЧИКИ СОБЫТИЙ С ТАКТИЛЬНЫМ ОТКЛИКОМ (HAPTIC FEEDBACK) ====================
    function setHeatRecoveryMode(modeKey) {
      triggerHaptic(12);
      state.telemetry.heatRecoveryMode = modeKey;
      state.customAiAdvice = null;
      renderAll();
      const modeObj = HEAT_RECOVERY_MODES[modeKey] || HEAT_RECOVERY_MODES.WINTER_14KW;
      showToast(`Режим рекуперации: ${modeObj.titleRu}`);
    }

    function onNumericInput(field, rawValue) {
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
      renderAll();
    }

    function stepTelemetry(field, delta) {
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
      renderAll();
    }

    function onPsychrometerInput() {
      triggerHaptic(10, true);
      const dryEl = document.getElementById("num-psychro-dry");
      const wetEl = document.getElementById("num-psychro-wet");
      if (!dryEl || !wetEl) return;
      const td = parseFloat(dryEl.value);
      const tw = parseFloat(wetEl.value);
      if (!isNaN(td)) state.telemetry.psychroDryC = Math.round(Math.min(38, Math.max(2, td)) * 10) / 10;
      if (!isNaN(tw)) state.telemetry.psychroWetC = Math.round(Math.min(38, Math.max(0, tw)) * 10) / 10;
      renderAll();
    }

    function applyPsychrometerToAdvisor() {
      triggerHaptic(12);
      const psy = calculateRegnaultPsychrometer(state.telemetry.psychroDryC, state.telemetry.psychroWetC);
      state.telemetry.environmentTempC = psy.dryC;
      state.telemetry.parksideRhPercent = Math.round(psy.rhPercent);
      state.customAiAdvice = null;
      renderAll();
      showToast(`Данные психрометра Реньо переданы в Советник: Т=${psy.dryC}°C, rH=${Math.round(psy.rhPercent)}% (Т.росы ${psy.dewPointC}°C)`);
    }

    function updateVacuumPiecesCount(val) {
      const pcs = parseInt(val, 10);
      if (!isNaN(pcs) && pcs > 0) {
        triggerHaptic(10, true);
        state.telemetry.vacuumPiecesCount = Math.min(50000, Math.max(1, pcs));
        renderAll();
      }
    }

    function updateBatchWeight(val) {
      const kg = parseInt(val, 10);
      if (!isNaN(kg) && kg > 0) {
        triggerHaptic(12, true);
        syncActiveBatch("telemetry", null, kg);
        state.customAiAdvice = null;
        renderAll();
      }
    }

    function setBatchWeight(val) {
      triggerHaptic(12);
      updateBatchWeight(val);
    }

    function stepBatchWeight(delta) {
      triggerHaptic(12);
      const cur = Number(state.telemetry.batchWeightKg || 1850);
      const nextKg = Math.min(10000, Math.max(50, Math.round(cur + Number(delta || 0))));
      updateBatchWeight(nextKg);
    }

    function selectSpecies(speciesKey) {
      triggerHaptic(12);
      syncActiveBatch("telemetry", speciesKey, state.telemetry.batchWeightKg);
      const sp = FISH_SPECIES[speciesKey];
      const st = CURING_STAGES[state.telemetry.stageKey];
      const midTemp = Math.round(((sp.tempRangeMonoC[0] + sp.tempRangeMonoC[1]) / 2.0) * 10) / 10;
      state.telemetry.speciesKey = speciesKey;
      state.telemetry.environmentTempC = st.key === "STAGE_4" ? 14.0 : midTemp;
      state.telemetry.visualNotes = sp.bioFeatureRu;
      state.customAiAdvice = null;
      renderAll();
      if (typeof checkProactiveMemoryReminder === "function") checkProactiveMemoryReminder(speciesKey);
    }

    function selectStage(stageKey) {
      triggerHaptic(12);
      const st = CURING_STAGES[stageKey];
      const sp = FISH_SPECIES[state.telemetry.speciesKey];
      const range = targetTempRangeFor(sp, st, state.telemetry.coLoadWithVimba);
      state.telemetry.stageKey = stageKey;
      state.telemetry.environmentTempC = Math.round(((range[0] + range[1]) / 2.0) * 10) / 10;
      state.telemetry.parksideRhPercent = Math.round((st.targetShelfRhRange[0] + st.targetShelfRhRange[1]) / 2.0);
      state.telemetry.activeCircuitsRunning = st.activeCircuitsCount;
      state.telemetry.phaseStartTimestampMs = Date.now();
      state.customAiAdvice = null;
      if (activeParksideAnalysis && Array.isArray(activeParksideAnalysis.points) && activeParksideAnalysis.points.length >= 2) {
        const prevProfileKey = activeParksideAnalysis.profileKey || null;
        const reanalyzed = analyzeParksidePoints(activeParksideAnalysis.fileName, activeParksideAnalysis.points);
        if (reanalyzed) {
          reanalyzed.profileKey = prevProfileKey;
          renderParksideChartAndVerdict(reanalyzed);
        }
      }
      renderAll();
    }

    function setPausePhase(isPause) {
      triggerHaptic(14);
      const changed = state.telemetry.isPausePhaseNow !== Boolean(isPause);
      state.telemetry.isPausePhaseNow = Boolean(isPause);
      state.telemetry.phaseStartTimestampMs = Date.now();
      lastPhaseCycleIndex = 0;
      state.customAiAdvice = null;
      renderAll();
      if (changed) {
        announcePhaseChangeIfEnabled(Boolean(isPause), true);
      }
    }

    function togglePausePhaseDirect() {
      triggerHaptic(14);
      setPausePhase(!state.telemetry.isPausePhaseNow);
    }

    function setCircuits(count) {
      triggerHaptic(12);
      state.telemetry.activeCircuitsRunning = count;
      state.customAiAdvice = null;
      renderAll();
    }

    function toggleCoLoad(checked) {
      triggerHaptic(12);
      state.telemetry.coLoadWithVimba = checked;
      state.customAiAdvice = null;
      renderAll();
    }

    function applyPreset(idx) {
      triggerHaptic(12);
      state.telemetry = {
        ...SAMPLE_PRESETS[idx].telemetry,
        batchStartMs: Date.now(),
        targetWaterLiters: null,
        controlBundleWeights: []
      };
      state.customAiAdvice = null;
      renderAll();
      showToast(`Применен сценарий: ${SAMPLE_PRESETS[idx].label}`);
    }

    function startBatchNow() {
      state.telemetry.batchStartMs = Date.now();
      const diag = typeof analyzeBioscience === "function" ? analyzeBioscience(state.telemetry) : null;
      state.telemetry.targetWaterLiters = (diag && diag.yieldForecast && diag.yieldForecast.totalWaterAvgLiters) ? diag.yieldForecast.totalWaterAvgLiters : 480;
      if (typeof persistStateToStorage === "function") persistStateToStorage();
      if (typeof renderAll === "function") renderAll();
      if (typeof showToast === "function") showToast("▶ Партия запущена. Расчёт отдачи воды включён.");
    }

    function saveBatchToLog() {
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
      renderAll();
      showToast("Замер записан в журнал Parkside и сохранен в localStorage");
    }

    function clearBatchLogs() {
      if (state.batchLogs.length === 0) {
        showToast("Журнал замеров уже пуст");
        return;
      }
      const ok = confirm(`Вы уверены, что хотите очистить весь журнал замеров логгера Parkside (${state.batchLogs.length} зап.)? Записи будут удалены из localStorage браузера.`);
      if (!ok) return;
      state.batchLogs = [];
      persistStateToStorage();
      renderAll();
      showToast("Журнал замеров логгера Parkside очищен");
    }

    function exportAllBatchLogsCsv() {
      if (state.batchLogs.length === 0) {
        showToast("Журнал замеров пуст — сначала запишите хотя бы один замер!");
        return;
      }
      const esc = s => String(s ?? "").replace(/[\r\n]+/g, " ").replace(/;/g, ",").trim();
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
      const fileName = `parkside_journal_full_${state.batchLogs.length}pts_${stamp}.csv`;

      const chronological = [...state.batchLogs].reverse();
      const lines = [
        "ЖУРНАЛ ЗАМЕРОВ ЛОГГЕРА PARKSIDE — АРМ ТЕХНОЛОГА (ЮРМАЛЦИЕМС);;;;;;;;;;;;;;",
        `Дата выгрузки;${esc(now.toLocaleString("ru-RU"))};Всего записей;${chronological.length};;;;;;;;;;;`,
        "",
        "№;Дата и время замера;Вид рыбы;Вес партии (кг);Стадия;Фаза обдува;Рекуперация (10-м трасса);Environment (°C);Parkside rH (%);Точка росы (°C);VPD (кПа);1#EEV (step);1#Dehumicoil (°C);Контуров AIM;Заключение / Совет технологу",
        ...chronological.map((entry, idx) => {
          const tel = entry.telemetry || {};
          const sp = FISH_SPECIES[tel.speciesKey] || FISH_SPECIES.VIMBA;
          const st = CURING_STAGES[tel.stageKey] || CURING_STAGES.STAGE_1;
          const hm = HEAT_RECOVERY_MODES[tel.heatRecoveryMode || "WINTER_14KW"] || HEAT_RECOVERY_MODES.WINTER_14KW;
          const phaseStr = tel.isPausePhaseNow ? `ПАУЗА (${st.pauseFreqLabel})` : `СУШКА (${st.activeFreqHz} Гц)`;
          return [
            idx + 1,
            esc(entry.timestampStr),
            esc(sp.titleRu),
            tel.batchWeightKg ?? 1850,
            `Ст.${st.number} (${esc(st.shortTitleRu)})`,
            esc(phaseStr),
            esc(hm.shortBadgeRu),
            tel.environmentTempC ?? "",
            Math.round(Number(tel.parksideRhPercent ?? 0)),
            entry.dewPointC ?? "",
            entry.vpdKpa ?? "",
            tel.eev1Steps ?? "",
            tel.dehumicoilTempC ?? "",
            tel.activeCircuitsRunning ?? st.activeCircuitsCount,
            esc(entry.adviceText)
          ].join(";");
        })
      ];

      const csvContent = "\uFEFF" + lines.join("\r\n");
      state.activeCsvResult = { fileName, csvContent };
      document.getElementById("csv-modal-filename").textContent = fileName;
      document.getElementById("csv-modal-preview").textContent = csvContent.replace(/^\uFEFF/, "");
      document.getElementById("csv-modal").classList.add("open");
      downloadActiveCsv();
    }

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

    // ==================== 7. ЧАТ ИИ И СОВЕТНИК ====================
    let pendingChatPhoto = {
      name: "",
      mimeType: "image/jpeg",
      base64Data: "",
      dataUrl: ""
    };

    function getActiveGeminiApiKey() {
      let k = sanitizeGeminiApiKey(localStorage.getItem("GEMINI_API_KEY_JURMALCIEMS") || "");
      if (!k) {
        const inlineEl = document.getElementById("chat-inline-key-input");
        const inlineVal = sanitizeGeminiApiKey(inlineEl ? inlineEl.value : "");
        if (inlineVal && (inlineVal.startsWith("AIza") || inlineVal.startsWith("AQ.") || inlineVal.length >= 18)) {
          k = inlineVal;
          try { localStorage.setItem("GEMINI_API_KEY_JURMALCIEMS", k); } catch (e) {}
        }
      }
      return k;
    }

    function hasGeminiApiKey() {
      return getActiveGeminiApiKey().length > 0;
    }

    function updateGeminiApiStatusUi() {
      const activeKey = getActiveGeminiApiKey();
      const isOnline = activeKey.length > 0;
      const topBtn = document.getElementById("btn-gemini-api-status");
      const chatBadge = document.getElementById("chat-header-api-badge");
      const inlineInput = document.getElementById("chat-inline-key-input");
      const inlineBar = document.getElementById("chat-inline-key-bar");
      const keyTypeLabel = activeKey.startsWith("AQ.")
        ? "AQ. Vertex/Studio"
        : (activeKey.startsWith("AIza") ? "AIza Studio" : "Ключ активен");
      const labelText = isOnline ? `🟢 Gemini API (${keyTypeLabel})` : "⚪ Офлайн-ядро (Ввести ключ)";
      const btnClass = isOnline ? "pill-btn pill-emerald" : "pill-btn pill-cyan";
      const titleText = isOnline
        ? "Ключ Gemini API активен (Онлайн) — нажмите, чтобы изменить, протестировать или отключить"
        : "Работает автономное офлайн-ядро — нажмите, чтобы ввести ключ Gemini API (AIza... или AQ.Ab8RN...)";

      if (topBtn) {
        topBtn.textContent = labelText;
        topBtn.className = btnClass;
        topBtn.title = titleText;
      }
      if (chatBadge) {
        chatBadge.textContent = labelText;
        chatBadge.className = btnClass;
        chatBadge.title = titleText;
      }
      if (inlineInput && document.activeElement !== inlineInput) {
        inlineInput.value = activeKey;
      }
      if (inlineBar) {
        inlineBar.style.borderColor = isOnline ? "rgba(46, 229, 157, 0.55)" : "rgba(0, 229, 255, 0.35)";
        inlineBar.style.background = isOnline ? "rgba(6, 59, 39, 0.32)" : "rgba(0, 229, 255, 0.07)";
      }
    }

    function saveGeminiKeyFromInline() {
      const inlineInput = document.getElementById("chat-inline-key-input");
      const cleaned = sanitizeGeminiApiKey(inlineInput ? inlineInput.value : "");
      if (cleaned) {
        localStorage.setItem("GEMINI_API_KEY_JURMALCIEMS", cleaned);
        if (inlineInput) inlineInput.value = cleaned;
        updateGeminiApiStatusUi();
        renderAll();
        showToast("🟢 Ключ Gemini API сохранен! Облачный ИИ и нейросетевой женский голос активны.");
      } else {
        localStorage.removeItem("GEMINI_API_KEY_JURMALCIEMS");
        updateGeminiApiStatusUi();
        renderAll();
        showToast("⚪ Поле ключа пустое — включен режим «Офлайн-ядро»");
      }
    }

    function clearGeminiKeyFromInline() {
      localStorage.removeItem("GEMINI_API_KEY_JURMALCIEMS");
      const inlineInput = document.getElementById("chat-inline-key-input");
      if (inlineInput) inlineInput.value = "";
      const modalInput = document.getElementById("gemini-key-modal-input");
      if (modalInput) modalInput.value = "";
      updateGeminiApiStatusUi();
      renderAll();
      showToast("⚪ Ключ удален — включен автономный режим «Офлайн-ядро»");
    }

    function toggleInlineKeyVisibility() {
      isGeminiKeyRevealed = !isGeminiKeyRevealed;
      if (typeof triggerHaptic === "function") triggerHaptic(10);
      const modalInp = document.getElementById("gemini-key-modal-input");
      const inlineInp = document.getElementById("chat-inline-key-input");
      const eyeBtn = document.getElementById("btn-toggle-inline-key") || document.getElementById("btn-inline-key-eye");
      const modalEyeBtn = document.getElementById("btn-toggle-key-eye");

      [modalInp, inlineInp].forEach(inp => {
        if (inp) inp.type = isGeminiKeyRevealed ? "text" : "password";
      });

      if (eyeBtn) eyeBtn.textContent = isGeminiKeyRevealed ? "🙈" : "👁";
      if (modalEyeBtn) modalEyeBtn.textContent = isGeminiKeyRevealed ? "🙈 Скрыть" : "👁️ Показать";
    }

    function toggleGeminiKeyVisibility() {
      toggleInlineKeyVisibility();
    }

    function renderChatPhotoPreviewBar() {
      const bar = document.getElementById("chat-photo-preview-bar");
      const attachBtn = document.getElementById("btn-chat-attach-photo");
      if (!bar) return;

      if (!pendingChatPhoto.dataUrl) {
        bar.style.display = "none";
        bar.innerHTML = "";
        if (attachBtn) {
          attachBtn.className = "btn btn-outline-cyan";
          attachBtn.textContent = "📷 Фото";
        }
        return;
      }

      bar.style.display = "flex";
      if (attachBtn) {
        attachBtn.className = "btn btn-emerald";
        attachBtn.textContent = "📷 Фото (1)";
      }

      const isOnline = hasGeminiApiKey();
      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${pendingChatPhoto.dataUrl}" alt="Превью фото" style="width:46px; height:46px; object-fit:cover; border-radius:8px; border:1px solid var(--cyan-dew);" />
          <div>
            <div style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--cyan-dew);">
              📎 Прикреплено фото: ${pendingChatPhoto.name}
            </div>
            <div style="font-size:11.5px; color:${isOnline ? 'var(--emerald-optimal)' : 'var(--amber-curing)'};">
              ${isOnline ? '✔ Ключ активен: фото уйдет в облачный мультимодальный Gemini вместе с вашим вопросом' : '⚠ Для ИИ-разбора фото нажмите «⚪ Офлайн-ядро (Ввести ключ)» в правом верхнем углу'}
            </div>
          </div>
        </div>
        <button class="pill-btn pill-amber" onclick="clearChatAttachedPhoto()" title="Открепить фото">✕ Убрать</button>
      `;
    }

    function handleChatPhotoAttach(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const dataUrl = String(evt.target.result || "");
        const commaIdx = dataUrl.indexOf(",");
        pendingChatPhoto.name = file.name;
        pendingChatPhoto.mimeType = file.type || "image/jpeg";
        pendingChatPhoto.dataUrl = dataUrl;
        pendingChatPhoto.base64Data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : "";
        renderChatPhotoPreviewBar();
        showToast(`Фото прикреплено к вопросу в чате: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }

    function clearChatAttachedPhoto() {
      pendingChatPhoto.name = "";
      pendingChatPhoto.mimeType = "image/jpeg";
      pendingChatPhoto.base64Data = "";
      pendingChatPhoto.dataUrl = "";
      const inp = document.getElementById("chat-photo-input");
      if (inp) inp.value = "";
      renderChatPhotoPreviewBar();
    }

    function renderChatMessages() {
      const box = document.getElementById("chat-messages-box");
      if (!box) return;
      const isOnline = hasGeminiApiKey();

      box.innerHTML = state.chatMessages.map(m => {
        const showCloudBadge = !m.isUser && (m.isCloudGemini === true || (isOnline && m.isCloudGemini !== false));
        const modeBadgeHtml = !m.isUser
          ? (showCloudBadge
              ? `<span style="background:rgba(46, 229, 157, 0.18); border:1px solid var(--emerald-optimal); color:var(--emerald-optimal); padding:2px 9px; border-radius:999px; font-size:11px; font-weight:700;">✨ Ответ облачного Gemini</span>`
              : `<span style="background:rgba(159, 179, 200, 0.14); border:1px solid var(--steel-border); color:var(--steel-text-secondary); padding:2px 9px; border-radius:999px; font-size:11px;">⚪ Автономное офлайн-ядро</span>`)
          : "";

        const photoHtml = m.imageDataUrl
          ? `<div style="margin:6px 0 8px 0;">
               <img src="${m.imageDataUrl}" alt="${escapeHtml(m.imageName || 'Фото из цеха')}" style="max-width:260px; max-height:190px; border-radius:10px; border:1px solid var(--cyan-dew); display:block;" />
               <div style="font-family:var(--font-mono); font-size:10.5px; color:var(--cyan-dew); margin-top:3px;">📷 ${escapeHtml(m.imageName || 'Прикрепленное фото')}</div>
             </div>`
          : "";

        const formattedText = escapeHtml(m.text || "").replace(/\n/g, "<br>");

        return `
          <div class="chat-bubble ${m.isUser ? 'user' : 'bot'}">
            <div class="chat-meta" style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="color:${m.isUser ? 'var(--amber-curing)' : 'var(--cyan-dew)'}; font-weight:700;">
                  ${m.isUser ? '👤 Технолог цеха' : '🤖 ИИ-Советник Юрмалциемс'}
                </span>
                ${modeBadgeHtml}
              </div>
              <span style="color:var(--steel-text-secondary);">${m.timestampStr}</span>
            </div>
            ${photoHtml}
            <div style="line-height:1.5;">${formattedText}</div>
          </div>
        `;
      }).join("");
      box.scrollTop = box.scrollHeight;
    }

    function generateExpertAnswer(question) {
      const q = question.toLowerCase().trim();
      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey];
      const st = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const heatModeObj = HEAT_RECOVERY_MODES[t.heatRecoveryMode || "WINTER_14KW"] || HEAT_RECOVERY_MODES.WINTER_14KW;

      // 1) Приоритетный разбор вопросов про крупного икряного леща колодкой, защиту от «загара» и проверку деревянной шпажкой
      if (
        q.includes("лещ") ||
        q.includes("загар") ||
        q.includes("шпажк") ||
        q.includes("сукровиц") ||
        q.includes("анальн") ||
        q.includes("колодк")
      ) {
        return `🐟 РЕГЛАМЕНТ ПО КРУПНОМУ ИКРЯНОМУ ЛЕЩУ КОЛОДКОЙ (ЗАЩИТА ОТ «ЗАГАРА»):\n` +
          `⚠️ Крупный икряной лещ колодкой: для защиты от «загара» и запашка у позвоночника и кишки — солить строго при +2..+4°C, первые сутки вешать за хвост (головой вниз) с открытыми жабрами для слива сукровицы из брюха, на Этапе 1 держать холодный старт +12..+14°C, а перед вакуумом проверять проколом деревянной шпажки к позвоночнику и в анальное отверстие!\n\n` +
          `📌 На Стадии 4 (отдых перед вакуумом) выдерживать при +13..+15°C в режиме 1 час осушение (25.3 Гц) / 4 часа отдых для выравнивания влаги между толстой спинкой и икряным брюшком перед упаковкой на KOMET PlusVac 25.`;
      }

      // 2) Приоритетный разбор вопросов про икряного окуня, разрез/срез спинки, ястык икры и кольцо закала
      if (
        q.includes("окун") ||
        q.includes("икр") ||
        q.includes("икрян") ||
        q.includes("ястык") ||
        q.includes("разрез") ||
        q.includes("вскрыт") ||
        q.includes("рубин") ||
        q.includes("балык") ||
        q.includes("кольц")
      ) {
        return `🐟 БИОФИЗИКА РАЗРЕЗА ИКРЯНОГО ОКУНЯ В ЧЕШУЕ (ЮРМАЛЦИЕМС):\n` +
          `1️⃣ Рубиново-стекловидный балык спинки без кольца закала: плотная панцирная чешуя окуня при мягком старте на Стадии 1 (rH 60–65%, Т=15.5–17.5°C) работает как естественная мембрана. Влага уходит от хребта плавно, поэтому спинка на срезе получается плотной, прозрачной («рубиново-стекловидный балык») без сухого белого кольца закала под чешуей.\n` +
          `2️⃣ Почему розовый ястык икры сохнет медленнее спинки: икра внутри брюшка закрыта плотной соединительнотканной и жировой пленкой ястыка. Диффузия влаги через оболочку ястыка идет в 1.8–2 раза медленнее, чем из мышечного балыка спинки. Поэтому, когда спинка уже дожата до рабочей полки 52–54% rH, внутри ядра розового ястыка еще остается свободная влага.\n` +
          `3️⃣ Обязательное правило Стадии 4 (36–48 ч перед вакуумом): чтобы выровнять влажность между икрой и мышцей и исключить росу в пакете KOMET PlusVac 25, икряного окуня держат на Стадии 4 в закрытой камере при +13…+15°C в режиме 1 час осушение (25.3 Гц) / 4 часа отдых (15–20 Гц) в течение 36–48 часов. За это время избыток влаги из ядра икры перетекает в подсушенную мышцу спинки, и ястык становится плотным и зернистым!`;
      }

      // 2) Вежливое приветствие офлайн-ядра без шаблона про вимбу
      if (
        q.includes("привет") ||
        q.includes("здравст") ||
        q.includes("добрый") ||
        q.includes("доброе") ||
        q === "хай" ||
        q === "hi" ||
        q === "hello" ||
        q.includes("салют") ||
        q.includes("как подключ") ||
        q.includes("ввести ключ") ||
        q.includes("gemini api")
      ) {
        return `👋 Здравствуйте! Я биофизическое офлайн-ядро АРМ Технолога цеха Юрмалциемс.\n\n` +
          `Я готов ответить на любой вопрос по вскрытию и разрезу икряного окуня (выравнивание влаги между рубиновой спинкой и розовым ястыком икры за 36–48 ч на Стадии 4), вакуумной упаковке по 3 тушки на KOMET PlusVac 25, анализу лога Parkside (527 точек) или настройкам контроллера MCGS.\n\n` +
          `🔑 Чтобы подключить облачный ИИ Google Gemini: нажмите кнопку «⚪ Офлайн-ядро (Ввести ключ)» (🔑 Gemini API) в правом верхнем углу шапки и вставьте ключ API (формата AIzaSy... из Google AI Studio).`;
      }

      if (q.includes("монолит") || q.includes("рокиров") || q.includes("тележ") || q.includes("3×5") || q.includes("3x5") || q.includes("пленум") || q.includes("8-й") || q.includes("8 шаг")) {
        return `📐 ГЕОМЕТРИЯ МОНОЛИТА (15 ТЕЛЕЖЕК 3×5) И СОП РОКИРОВКИ: 1) Буферы: слева у скоса пленум 50–70 см (напор Cantoni 4×3 кВт), справа у сеток буфер 50 см, боковые коридоры наглухо перекрыты шторками, брюшки рыбы ориентированы строго влево (навстречу потоку). 2) СОП Дневной рокировки (Моно-загрузка, напр. Бычок 3.5 т): Ряды 4–5 (тележки 10–15) перекатить вперед на место Рядов 1–2; Ряды 1–2 увезти назад на место Рядов 4–5; центральный Ряд 3 (тележки 7, 8, 9) развернуть на 180° вокруг своей оси на месте! 3) ⛔ При режиме «Совместно с вимбой» (Вимба 2 т в рядах 1–3 + Плотва 1.7 т в рядах 4–5): ПЛОТВА НИКОГДА НЕ ИДЕТ ВПЕРЕД! Рокировка выполняется только внутри зоны вимбы (Ряды 1–2 ↔ Ряд 3), а при готовности плотвы — частичная выгрузка задних рядов 4–5. 4) Памятка по 8-му шагу фиксации (Фаза 8 MCGS): ОБЯЗАТЕЛЕН под вакуум KOMET PlusVac 25, крупный калибр и длительное хранение; ОТКЛЮЧИТЬ, если мелкая рыба уже «звенит», нужна мягкая вялка или дозаривание в гофроящиках.`;
      }
      if (q.includes("премиум") || q.includes("28–30") || q.includes("28-30") || q.includes("257") || q.includes("657") || q.includes("map") || q.includes("газ") || q.includes("komet") || q.includes("вакуум") || q.includes("3 туш") || q.includes("евроконтейн")) {
        return `💎 КАЛЬКУЛЯТОР ПРЕМИУМ-ВАКУУМА (KOMET PlusVac 25): 1) Форматы: Штучная Премиум (по 1 шт, 300 г) или Цеховой стандарт Юрмалциемса (по 3 тушки в гладкий пакет ~800–900 г, укладка в синий изотермический евроконтейнер с прокладкой гофрокартоном от света и проколов). 2) Себестоимость упаковки = 0,42 €/шт (или ~0,38 €/пакет на 3 тушки). 3) Протокол KOMET PlusVac 25 (Арт. 3150049, 2026 г.): Soft Vac 95–96% (чтобы не сплющивало брюшко и не давило жир), подрезка острых плавников на 2–3 мм, 15–20 мин тест на микропрокол на столе, хранение 0..+4°C. 4) Дооснащение газом (MAP) своими руками за ~150 €: подключение соленоида и редуктора пищевой смеси к штатному свободному выходу контроллера Comfort на плате KOMET PlusVac 25.`;
      }
      if (q.includes("hapn") || q.includes("частотник") || q.includes("крутилк") || q.includes("aov") || q.includes("ai1") || q.includes("ураган") || q.includes("flying") || q.includes("legion") || q.includes("485")) {
        return `⚡ СИНХРОНИЗАЦИЯ ЧАСТОТНИКОВ HAPN HPVF 4.0kW И ЗАЩИТА ОТ УРАГАНА: 1) Схема «Одной крутилкой» (Master → Slave): сигнальная перемычка с аналогового выхода AOV левого ЧП на вход AI1 правого ЧП + объединение GND → GND с сохранением штатного 3-позиционного рубильника. 2) Удаленный мониторинг с ноутбука Lenovo Legion: по витой паре на клеммы 485+ / 485- (через свисток USB-RS485 или Wi-Fi шлюз Elfin EW11 по Modbus RTU/TCP). 3) Защита от просадок сети и штормов в Юрмалциемсе: включить в меню ЧП параметры Auto Restart (автоперезапуск после скачка света), Flying Start (безударный подхват вращающегося мотора Cantoni на выбеге) и вывести цепь аварии на релейные контакты TA / TC.`;
      }
      if (q.includes("рефконтейнер") || q.includes("потек жир") || q.includes("спасени") || q.includes("экстрен") || q.includes("кристаллиз") || q.includes("80%")) {
        return `🚨 ЭКСТРЕННЫЙ ПРОТОКОЛ СПАСЕНИЯ ПАРТИИ, ЕСЛИ ПОТЕК ЖИР (РЕФКОНТЕЙНЕР): 1) Немедленно переложить рыбу в рефконтейнер строго в 1 слой на перфорированные ящики без касания тушек друг с другом, брюшки раскрыть распорками. 2) Выставить жесткий температурный режим +10..+11°C: именно при +10..+11°C происходит кристаллизация подкожной жировой пленки и образование микротрещин, через которые возобновляется выход влаги! (При +14°C расплавленный жир блокирует поры чешуи на 80%). 3) Держать влажность в рефконтейнере ≤ 40% rH и дать жесткий направленный обдув вдоль дна ящиков до открытия пор (контроль по пирометру Бесконтактный пирометр ΔT ≥ 0.8–1.0°C).`;
      }
      if (q.includes("ИК-пирометр шкуры") || q.includes("пирометр") || q.includes("Влагомер хребта") || q.includes("3810") || q.includes(" психрометр") || q.includes("реньо") || q.includes("чешу")) {
        return `🔫 ИНСТРУМЕНТАЛЬНЫЙ КОНТРОЛЬ (ИК-пирометр шкуры + Игольчатый влагомер мяса + ПСИХРОМЕТР РЕНЬО): 1) Дельта испарения по пирометру Бесконтактный пирометр ΔT = Environment °C − Т чешуи °C (сейчас ΔT = ${diag.deltaTempEvapC >= 0 ? "+" : ""}${diag.deltaTempEvapC.toFixed(1)}°C): если ΔT ≥ 1.0°C — испарение активное; если на Ст.1–2 ΔT < 0.4°C — ТРЕВОГА «Поры закрылись (закал или жировая пленка), испарение встало!»; если на Ст.4 ΔT < 0.4°C — маркер готовности к выгрузке. 2) Влагомер Игольчатый влагомер мяса измеряет остаточную влагу непосредственно у хребта (сейчас ${diag.spineMoistureGmPercent}%). 3) Самодельный психрометр (Сухой + Мокрый датчик в батисте) считает истинную влажность по формуле Реньо: обязательно обеспечить обдув датчиков ≥ 2 м/с и заливать только дистиллированную воду (защита фитиля от засоления)!`;
      }
      if (q.includes("сервис") || q.includes("mcgs") || q.includes("system") || q.includes("defrost") || q.includes("switch") || q.includes("unlock") || q.includes("stc") || q.includes("вентс") || q.includes("kts") || q.includes("k-flex")) {
        return `🛠 СЕРВИСНАЯ КАРТА НАСТРОЕК КОНТРОЛЛЕРА MCGS + ВЕНТИЛЯЦИЯ VENTS: 1) System: Com StopTemp = 80.0°C, снизить Upper ExTemp со 120.0°C до 95.0°C (защита масла FV68S от гари, т.к. без обдува выхлоп греется до 77.8°C). 2) EEV: EEV Cycle = 30 сек, Default Open = 170 шагов (вместо 200), EEV control = 0 (Dew point), MinimumStep = 75. 3) Defrost: DefrostCycle = 40 мин (вместо 50), DefrostTemp = -2.0°C (вместо -5.0°C), выход +15.0°C. 4) Dehumi: Diff HFTemp = 3.0°C, Diff HFHumi = 3%. 5) Switch: CondeFan ov = 1 под внешний термостат STC-1000 (+36°C ВКЛ / +28°C ВЫКЛ, 22–24 бар) на пускателе KM4; проверка 1#Com high/low = 1 (OFF) и прозвонка HP1/LP1. 6) ⛔ Unlock = 0 — КАТЕГОРИЧЕСКИ НЕ ТРОГАТЬ (лизинговый таймер!). 7) Синий термостат KTS 011 в щите HAPN на +25°C для вытяжки ВЕНТС ТТ ПРО 200; дверь компрессорной закрыта (гидрозатвор дренажа 75 л/ч). 8) Трубки и баллоны датчиков ЭРВ упаковать в теплоизоляцию K-Flex + алюминиевый скотч.`;
      }
      if (q.includes("дооснащ") || q.includes("зелен") || q.includes("kvc") || q.includes("llsv") || q.includes("докипател") || q.includes("pump") || q.includes("kp15") || q.includes("20.6")) {
        return `🟢 План дооснащения Контура №1 (7 зеленых узлов защиты от залива -20.6°C): 1) байпас горячего газа Danfoss KVC 15/22 [8] (кипение +2°C); 2) соленоид отсечки жидкости LLSV Danfoss EVR 10/15 [19] после фильтра DML 164 [10] (Pump-down); 3–4) докипатель 8–10 л [14] вместо 3 л + фильтр НД [13]; 5–6) маслоотделитель [3] + обратный клапан NRV [4] на нагнетании; 7) независимое реле Danfoss KP15 и дозаправка +2.5–3.0 кг R410A + 150–200 мл масла FV68S. Режим Термокороба эстакады [20]: «${heatModeObj.titleRu}».`;
      }
      if (q.includes("слез") || q.includes("срез") || q.includes("25.3") || q.includes("жирн") || q.includes("стабилиз") || q.includes("отволаж") || q.includes("готов")) {
        return `🔪 ЭТАЛОН СРЕЗА И ОТВОЛАЖИВАНИЯ НА СТАДИИ 4 (ЮРМАЛЦИЕМС):\n` +
          `• Для Икряного Окуня в чешуе: рубиново-стекловидный балык спинки без сухого кольца закала; розовый ястык икры в плотной пленке отдает влагу медленнее спинки — на Стадии 4 в закрытой камере (13–15°C, 1ч осушение 25.3 Гц / 4ч отдых 15–20 Гц) держать 36–48 ч для перетока влаги из ядра икры в мышцу перед вакуумом.\n` +
          `• Для Вимбы и Леща: срез спинки «янтарно-стекловидная слеза без белесых пятен», фасовка по 3 тушки в гладкий пакет (~800–900 г) на KOMET PlusVac 25 (Soft Vac 95–96%) после охлаждения тушки до 13–15°C.`;
      }
      if (q.includes("eev") || q.includes("205") || q.includes("эрв") || q.includes("обмерз")) {
        return `В моноблоке AIM AGHD-250ELC ЭРВ работает в режиме Dew point (EEV control = 0) с защитным порогом MinimumStep = 75. Если 1#EEV уходит ниже 205 step (сейчас ${t.eev1Steps} step, 1#Dehumicoil = +${t.dehumicoilTempC}°C), проток R410A зажимается и кипение испарителя падает ниже +4.5°C (при падении к +2°C вступает в работу байпас горячего газа Danfoss KVC [8]). Проверьте чистоту фильтра, скорость вентиляторов Cantoni (на сушке Ст.1–3 — 30 Гц, на стабилизации Ст.4 — 25.3 Гц) и отключите Контур №2 со 2-х суток.`;
      }
      if (q.includes("пауз") || q.includes("85%") || q.includes("скач") || q.includes("1.5") || q.includes("задых") || q.includes("лог") || q.includes("parkside") || q.includes("527")) {
        return `📊 РАЗБОР ЛОГА PARKSIDE (527 ТОЧЕК) И ПРАВИЛО ПАУЗЫ: В реальном логе цеха (43.8 ч, Т=13.6°C, rH 54.9..86%) отработано 62 микроцикла (зубца пилы) и 11 больших фаз сушки. Скорость отдачи влаги от хребта в паузах снизилась с +0.86 %/мин в первой трети до +0.76 %/мин в конце (-12%), а самая длинная непрерывная пауза подряд составила 50 мин (0.83 ч ≤ 2.0 ч). На Стадиях 1–3 паузы длиннее 1.5–2.0 ч в закрытом контуре запрещены, так как при 85% rH дефицит VPD падает к нулю!`;
      }
      return `📌 Биофизическая справка по вашему запросу («${question}»):\n` +
        `• Если вопрос касается икряного окуня: рубиново-стекловидный балык спинки сохнет быстрее, чем розовый ястык икры в плотной пленке, поэтому на Стадии 4 (13–15°C, 1ч осушение / 4ч отдых) его держат 36–48 ч для перетока влаги из ядра икры в мышцу перед вакуумом.\n` +
        `• По текущей выбранной на пульте партии (${sp.titleRu}, ${t.batchWeightKg} кг, ${st.shortTitleRu}): Т=${t.environmentTempC}°C, rH=${t.parksideRhPercent}%, Т.росы=${diag.dewPointC}°C, VPD=${diag.vpdKpa} кПа.`;
    }

    async function sendChatMessage(presetText) {
      const inputEl = document.getElementById("chat-input");
      const sendBtn = document.getElementById("btn-chat-send");
      const rawText = (presetText !== undefined ? presetText : inputEl.value).trim();
      const hasPhoto = Boolean(pendingChatPhoto.base64Data && pendingChatPhoto.dataUrl);

      if (!rawText && !hasPhoto) return;
      if (presetText === undefined && inputEl) inputEl.value = "";

      const nowStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      // Авто-перехват ключа AQ.Ab8RN... / AIzaSy..., если пользователь вставил его прямо в строку чата
      const standaloneKeyMatch = rawText.match(/^(AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z._-]{14,})$/);
      if (standaloneKeyMatch && !hasPhoto) {
        const cleanedKey = sanitizeGeminiApiKey(standaloneKeyMatch[1]);
        localStorage.setItem("GEMINI_API_KEY_JURMALCIEMS", cleanedKey);
        updateGeminiApiStatusUi();
        renderAll();
        state.chatMessages.push({
          id: Date.now(),
          isUser: true,
          text: `🔑 Введен ключ API: ${cleanedKey.slice(0, 9)}...${cleanedKey.slice(-4)}`,
          timestampStr: nowStr
        });
        state.chatMessages.push({
          id: Date.now() + 1,
          isUser: false,
          isCloudGemini: true,
          text: `🟢 Ключ Google Gemini API (${cleanedKey.startsWith("AQ.") ? "формат AQ.Ab8RN... Vertex/AI Studio" : "формат AIzaSy... Google AI Studio"}) успешно сохранен и активирован!\nТеперь напишите ваш вопрос (например, «привет» или «почему розовый ястык икры окуня сохнет медленнее спинки?») — отвечать будет напрямую облачный Gemini без локальных шаблонов.`,
          timestampStr: nowStr
        });
        renderChatMessages();
        showToast("🟢 Ключ Gemini API сохранен из строки чата!");
        return;
      }

      const text = rawText || `Проанализируй прикрепленное фото (${pendingChatPhoto.name}) и дай заключение технолога по срезу рыбы / вакууму / режиму камеры.`;
      const attachedSnapshot = hasPhoto ? { ...pendingChatPhoto } : null;
      if (hasPhoto) {
        clearChatAttachedPhoto();
      }

      state.chatMessages.push({
        id: Date.now(),
        isUser: true,
        text,
        timestampStr: nowStr,
        imageDataUrl: attachedSnapshot ? attachedSnapshot.dataUrl : null,
        imageName: attachedSnapshot ? attachedSnapshot.name : null
      });
      renderChatMessages();

      const apiKey = getActiveGeminiApiKey();
      if (apiKey) {
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.textContent = "⏳ Gemini...";
        }
        try {
          const t = state.telemetry;
          const diag = analyzeBioscience(t);
          const sp = FISH_SPECIES[t.speciesKey];
          const st = CURING_STAGES[t.stageKey];
          const heatModeObj = HEAT_RECOVERY_MODES[t.heatRecoveryMode || "WINTER_14KW"] || HEAT_RECOVERY_MODES.WINTER_14KW;
          const prompt = `Ты — главный технолог цеха вяления рыбы в Юрмалциемсе (AIM AGHD-250ELC + уличный конденсатор на 10-м трассе, рекуперация: ${heatModeObj.titleRu}, закрытый контур Cantoni 4×3кВт, контроллер MCGS, KOMET PlusVac 25).
Правило среза Икряного Окуня в чешуе: рубиново-стекловидный балык спинки без сухого кольца закала; розовый ястык икры в плотной пленке отдает влагу медленнее спинки — на Стадии 4 в закрытой камере (13–15°C, 1ч/4ч) держать 36–48 ч для перетока влаги из ядра икры в мышцу перед вакуумом.
Правило по Крупному Икряному Лещу колодкой: для защиты от «загара» и запашка у позвоночника и кишки — солить строго при +2..+4°C, первые сутки вешать за хвост (головой вниз) с открытыми жабрами для слива сукровицы из брюха, на Этапе 1 держать холодный старт +12..+14°C, а перед вакуумом проверять проколом деревянной шпажки к позвоночнику и в анальное отверстие!
Цеховой стандарт фасовки Вимбы: по 3 тушки в гладкий пакет (~800–900 г, Soft Vac 95–96%), укладка в синий изотермический евроконтейнер с прокладкой гофрокартоном от света и проколов.
ЖЕСТКОЕ БИОФИЗИЧЕСКОЕ ПРАВИЛО ЗАКРЫТОГО КОНТУРА: КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО предлагать паузы длиннее 1.5–2.0 часов на Стадиях 1–3 (Ст.1 макс 1.0 ч, Ст.2 макс 1.5 ч, Ст.3 макс 2.0 ч), так как при закрытом контуре за 25 минут паузы влажность подскакивает до 85% rH, VPD падает к нулю и рыба задыхается!
Контекст пульта (справочно): ${sp.titleRu}, ${t.batchWeightKg} кг, ${st.titleRu}, Env ${t.environmentTempC}°C, Parkside rH ${t.parksideRhPercent}%, точка росы ${diag.dewPointC}°C, VPD ${diag.vpdKpa} кПа, 1#EEV ${t.eev1Steps} step, 1#Dehumicoil +${t.dehumicoilTempC}°C.
${attachedSnapshot ? "К сообщению прикреплено реальное фото из цеха — внимательно осмотри его (срез спинки, наличие/отсутствие кольца закала, ястык икры, плотность вакуум-пакета или экран контроллера MCGS) и " : ""}Ответь прямо, по существу и профессионально по-русски на сообщение пользователя: ${text}`;

          const parts = [];
          if (attachedSnapshot) {
            parts.push({
              inline_data: {
                mime_type: attachedSnapshot.mimeType,
                data: attachedSnapshot.base64Data
              }
            });
          }
          parts.push({ text: prompt });

          const result = await callGeminiApiWithFallback(apiKey, parts, state.selectedChatModel || "gemini-2.5-flash");
          state.chatMessages.push({
            id: Date.now() + 1,
            isUser: false,
            isCloudGemini: true,
            text: result.text,
            timestampStr: `${nowStr} • ${result.modelUsed}`
          });
          renderChatMessages();
          return;
        } catch (err) {
          // НИКАКОЙ тихой подмены шаблоном generateExpertAnswer! Выводим точный текст ошибки сервера Google API:
          const exactErrorBubble = `❌ Ошибка сервера Google Gemini API (data.error.message):\n${err?.message || "Неизвестная ошибка запроса"}\n` +
            (err?.triedModels ? `\n🔎 Проверенные по очереди модели и эндпоинты (с передачей заголовка x-goog-api-key): ${err.triedModels}` : "");
          state.chatMessages.push({
            id: Date.now() + 1,
            isUser: false,
            isCloudGemini: true,
            text: exactErrorBubble,
            timestampStr: nowStr
          });
          renderChatMessages();
          return;
        } finally {
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = "Отправить ➤";
          }
        }
      }

      let reply = generateExpertAnswer(text);
      if (attachedSnapshot) {
        reply = `📷 Фото «${attachedSnapshot.name}» прикреплено к диалогу!\n\nЧтобы облачный ИИ Google Gemini осмотрел ваш снимок, вставьте ваш ключ Gemini API в поле «🔑 Ключ API:» прямо над чатом и нажмите «💾 Сохранить ключ».\n\n📌 Офлайн-разбор по вашему вопросу:\n${generateExpertAnswer(text)}`;
      }
      state.chatMessages.push({
        id: Date.now() + 1,
        isUser: false,
        isCloudGemini: false,
        text: reply,
        timestampStr: nowStr
      });
      renderChatMessages();
    }

    async function requestAiAdvice() {
      const diag = analyzeBioscience(state.telemetry);
      const badge = document.getElementById("ai-advice-badge");
      const apiKey = getActiveGeminiApiKey();

      if (apiKey) {
        badge.textContent = "ОБЛАЧНЫЙ АНАЛИЗ GEMINI AI...";
        try {
          const t = state.telemetry;
          const sp = FISH_SPECIES[t.speciesKey];
          const st = CURING_STAGES[t.stageKey];
          const heatModeObj = HEAT_RECOVERY_MODES[t.heatRecoveryMode || "WINTER_14KW"] || HEAT_RECOVERY_MODES.WINTER_14KW;
          const prompt = `Дай краткий профессиональный совет технологу строго в 3–4 предложениях на русском языке по партии ${sp.titleRu} (${t.batchWeightKg} кг, ${st.titleRu}, рекуперация 10-м трассы: ${heatModeObj.titleRu}): Env ${t.environmentTempC}°C, rH ${t.parksideRhPercent}%, Т.росы ${diag.dewPointC}°C, VPD ${diag.vpdKpa} кПа, 1#EEV ${t.eev1Steps} step, 1#Dehumicoil +${t.dehumicoilTempC}°C, контуров: ${t.activeCircuitsRunning}. Учти подсказку по фазе отволаживания (стабилизации) для жирной рыбы: режим 4 часа отдых / 1 час забор влаги при коридоре +13…+15°C и оборотах частотников Cantoni 25.3 Гц (для икряного окуня — держать 36–48 ч для перетока влаги из розового ястыка икры в рубиновую спинку). ЖЕСТКИЙ ЗАПРЕТ ЗАКРЫТОГО КОНТУРА: никогда не предлагай паузы длиннее 1.5–2.0 часов на Стадиях 1–3, так как при 85% влажности рыба задыхается! Оцени закал/подпарку, работу ЭРВ и готовность к следующей стадии / KOMET PlusVac 25.`;

          const result = await callGeminiApiWithFallback(apiKey, [{ text: prompt }], state.selectedChatModel || "gemini-2.5-flash");
          state.customAiAdvice = result.text;
          badge.textContent = `ЗАКЛЮЧЕНИЕ ИИ-СОВЕТНИКА (GEMINI CLOUD • ${result.modelUsed}):`;
          renderAll();
          showToast(`Получен свежий совет от ${result.modelUsed}`);
          return;
        } catch (err) {
          state.customAiAdvice = `❌ Ошибка сервера Gemini API: ${err?.message || "Неизвестная ошибка"} (Проверены модели: ${err?.triedModels || "gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash"}).`;
          badge.textContent = "ОШИБКА ОТВЕТА СЕРВЕРА GEMINI API:";
          renderAll();
          showToast("Сервер Gemini API вернул ошибку — текст выведен в блоке Советника");
          return;
        }
      }

      state.customAiAdvice = diag.instantAdvisorSummary;
      badge.textContent = "ЗАКЛЮЧЕНИЕ ИИ-СОВЕТНИКА (БИОФИЗИЧЕСКОЕ ЯДРО LIVE):";
      renderAll();
      showToast("Сформировано экспертное заключение по текущим цифрам");
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
    var vx = {
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

    // ==================== 9. МОДАЛЬНОЕ ОКНО ONEPLUS 13 PRO, КЛЮЧ GEMINI И PWA ====================
    let deferredPwaPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const btn = document.getElementById("btn-pwa-install-native");
      if (btn) btn.style.display = "inline-flex";
    });

    async function triggerDeferredPwaInstall() {
      if (!deferredPwaPrompt) {
        showToast("В браузере Chrome нажмите меню «⋮» → «Добавить на главный экран» / «Установить приложение»");
        return;
      }
      deferredPwaPrompt.prompt();
      await deferredPwaPrompt.userChoice;
      deferredPwaPrompt = null;
    }




    if ('serviceWorker' in navigator &&
        (location.protocol === 'http:' || location.protocol === 'https:')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('[SW] register failed:', err);
        });
      });
    }

    function openGeminiKeyModal() {
      const modal = document.getElementById("gemini-key-modal");
      const inp = document.getElementById("gemini-key-modal-input");
      const statusBox = document.getElementById("gemini-key-modal-status");
      const current = getActiveGeminiApiKey();
      if (inp) inp.value = current;
      if (statusBox) {
        statusBox.style.display = "none";
        statusBox.textContent = "";
      }
      if (modal) {
        modal.classList.add("open");
        setTimeout(() => { if (inp) inp.focus(); }, 60);
      }
    }

    function closeGeminiKeyModal() {
      const modal = document.getElementById("gemini-key-modal");
      if (modal) modal.classList.remove("open");
    }

    function saveGeminiKeyFromModal() {
      const inp = document.getElementById("gemini-key-modal-input");
      const cleaned = sanitizeGeminiApiKey(inp ? inp.value : "");
      if (cleaned) {
        localStorage.setItem("GEMINI_API_KEY_JURMALCIEMS", cleaned);
        updateGeminiApiStatusUi();
        renderAll();
        closeGeminiKeyModal();
        showToast("🟢 Ключ Gemini API сохранен — включен режим «Gemini API (Онлайн)»!");
      } else {
        localStorage.removeItem("GEMINI_API_KEY_JURMALCIEMS");
        updateGeminiApiStatusUi();
        renderAll();
        closeGeminiKeyModal();
        showToast("⚪ Включен автономный режим «Офлайн-ядро (Ввести ключ)»");
      }
    }

    function clearGeminiKeyFromModal() {
      localStorage.removeItem("GEMINI_API_KEY_JURMALCIEMS");
      const inp = document.getElementById("gemini-key-modal-input");
      if (inp) inp.value = "";
      const inlineInp = document.getElementById("chat-inline-key-input");
      if (inlineInp) inlineInp.value = "";
      updateGeminiApiStatusUi();
      renderAll();
      closeGeminiKeyModal();
      showToast("⚪ Ключ удален — включен автономный режим «Офлайн-ядро»");
    }

    async function testGeminiKeyFromModal() {
      const inp = document.getElementById("gemini-key-modal-input");
      const statusBox = document.getElementById("gemini-key-modal-status");
      const cleaned = sanitizeGeminiApiKey(inp ? inp.value : "");
      if (!cleaned) {
        if (statusBox) {
          statusBox.style.display = "block";
          statusBox.style.border = "1px solid var(--coral-danger)";
          statusBox.style.background = "rgba(75,17,19,0.5)";
          statusBox.style.color = "var(--coral-danger)";
          statusBox.textContent = "⚠ Сначала вставьте ключ (AIzaSy... или AQ.Ab8RN...) в поле выше.";
        }
        return;
      }
      localStorage.setItem("GEMINI_API_KEY_JURMALCIEMS", cleaned);
      updateGeminiApiStatusUi();
      if (statusBox) {
        statusBox.style.display = "block";
        statusBox.style.border = "1px solid var(--cyan-dew)";
        statusBox.style.background = "rgba(0,229,255,0.12)";
        statusBox.style.color = "var(--cyan-dew)";
        statusBox.textContent = "⏳ Проверяем связь с сервером Google Gemini API...";
      }
      try {
        const res = await callGeminiApiWithFallback(
          cleaned,
          [{ text: "Ответь одной короткой фразой по-русски: связь с АРМ Технолога Юрмалциемс установлена!" }],
          state.selectedChatModel || "gemini-2.5-flash"
        );
        if (statusBox) {
          statusBox.style.border = "1px solid var(--emerald-optimal)";
          statusBox.style.background = "rgba(6,59,39,0.65)";
          statusBox.style.color = "var(--emerald-optimal)";
          statusBox.textContent = `✅ УСПЕШНО (${res.modelUsed}): ${res.text}`;
        }
        renderAll();
        showToast(`🟢 Связь с ${res.modelUsed} подтверждена!`);
      } catch (err) {
        if (statusBox) {
          statusBox.style.border = "1px solid var(--coral-danger)";
          statusBox.style.background = "rgba(75,17,19,0.65)";
          statusBox.style.color = "#FFCDD2";
          statusBox.textContent = `❌ Ошибка сервера: ${err?.message || err}\nПроверены: ${err?.triedModels || ""}`;
        }
      }
    }

    function promptApiKey() {
      openGeminiKeyModal();
    }

    function copyCurrentAdvice() {
      const diag = analyzeBioscience(state.telemetry);
      const text = state.customAiAdvice || diag.instantAdvisorSummary;
      navigator.clipboard.writeText(text);
      showToast("Совет технологу скопирован в буфер обмена");
    }

    function copyMcgsTable() {
      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey];
      const st = CURING_STAGES[t.stageKey];
      const diag = analyzeBioscience(t);
      const yf = diag.yieldForecast;
      const mcgsTotals = calculateMcgsCycleTotals(st, diag.mcgsPhases);
      const lines = [
        "ТАБЛИЦА 8 ФАЗ КОНТРОЛЛЕРА MCGS — ЮРМАЛЦИЕМС (AIM AGHD-250ELC)",
        `Партия: ${sp.titleRu} | Сырье: ${t.batchWeightKg} кг | Стадия: ${st.titleRu}`,
        `Прогноз выхода: ${yf.finishedMinKg}–${yf.finishedMaxKg} кг (${sp.yieldPercentRange}) | Испарить воды: ${yf.totalWaterMinLiters}–${yf.totalWaterMaxLiters} л`,
        `Общее время 8 фаз: ${mcgsTotals.totalHours} ч (${mcgsTotals.totalDays} сут) | Расчетное потребление за цикл: ~${mcgsTotals.avgKwh} кВт·ч (${mcgsTotals.minKwh}–${mcgsTotals.maxKwh} кВт·ч)`,
        "--------------------------------------------------------------------",
        ...diag.mcgsPhases.map(p =>
          `Фаза ${p.phaseNumber} [${p.modeLabel}]: Temp=${p.tempSetpointC}°C | Humi=${p.humiSetpointPercent}% | Time=${p.durationHours}ч | Cantoni=${p.cantoniFreqHz} (${p.cantoniVoltageV}) | ${p.circuitsNote}`
        )
      ];
      navigator.clipboard.writeText(lines.join("\n"));
      showToast("Таблица 8 фаз MCGS скопирована в буфер обмена");
    }

    function showToast(msg) {
      const el = document.getElementById("toast-msg");
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
    }

    // ==================== 11. ☁️ ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ ЦЕХА (LIVE CLOUD SYNC • FIREBASE APPLET + REALTIME RELAY) ====================
    const FIREBASE_APPLET_CONFIG = {
      projectId: "gen-lang-client-0013068271",
      projectNumber: "905371617013",
      storageBucket: "gen-lang-client-0013068271.firebasestorage.app",
      mobileSdkAppId: "1:905371617013:android:1bf95366834f90684567bc",
      packageName: "com.aistudio.fishdrytech.jrmlcm",
      apiKey: "AIzaSyCHMof9e7ewhrFucz9Pe90uMr6hEg8eZYE",
      recaptchaSiteKey: "6LcSRQQuAAAAAEa7g-c7_XiWwVHfmZ8vg4wf_5pz",
      firestoreRestUrl: "https://firestore.googleapis.com/v1/projects/gen-lang-client-0013068271/databases/(default)/documents/jurmalciems_rooms"
    };

    const CLOUD_STORAGE_KEYS = {
      ROOM: "JURMALCIEMS_CLOUD_ROOM_V1",
      AUTO: "JURMALCIEMS_CLOUD_AUTOSYNC_V1",
      CUSTOM_URL: "JURMALCIEMS_CLOUD_CUSTOM_URL_V1",
      DEVICE_ID: "JURMALCIEMS_CLOUD_DEVICE_ID_V1",
      SNAP_PREFIX: "JURMALCIEMS_CLOUD_SNAPSHOT_CACHE_V1_"
    };

    const cloudSyncState = {
      roomCode: "JURMALCIEMS_MAIN",
      autoSync: true,
      customEndpointUrl: "",
      deviceId: "dev_local",
      deviceName: "Ноутбук / ПК",
      status: "ONLINE", // "ONLINE" | "SYNCING" | "OFFLINE"
      backendLabel: "Live Cloud + localStorage",
      lastSyncTimeStr: "--:--:--",
      lastSyncDeviceStr: "Готов к обмену",
      lastSnapshotRev: 0,
      lastFingerprint: "",
      isBooting: true,
      isApplyingRemote: false,
      pushDebounceTimer: null,
      pollIntervalId: null,
      sseSource: null,
      broadcastChannel: null,
      uploadedParksideHashes: new Set(),
      downloadedParksideCache: {},
      activityLog: []
    };

    function detectDeviceLabel() {
      const ua = (navigator && navigator.userAgent) ? navigator.userAgent : "";
      if (/OnePlus/i.test(ua)) return "OnePlus 13 Pro";
      if (/Android/i.test(ua)) return "Смартфон Android";
      if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad";
      if (/Macintosh/i.test(ua)) return "Ноутбук Mac";
      if (/Windows/i.test(ua)) return "Ноутбук Windows";
      return "Устройство цеха";
    }

    function sanitizeCloudRoomCode(raw) {
      const cleaned = String(raw || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 36);
      return cleaned || "JURMALCIEMS_MAIN";
    }

    function getShortRoomBadgeCode(roomCode) {
      const code = sanitizeCloudRoomCode(roomCode);
      if (code === "JURMALCIEMS_MAIN") return "JURMALCIEMS";
      return code.length > 16 ? code.slice(0, 16) : code;
    }


    function generateSecureRoomCode() {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const bytes = new Uint8Array(6);
        crypto.getRandomValues(bytes);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0").toUpperCase()).join("");
        return `JURMALCIEMS_${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
      }
      const rnd = Math.random().toString(36).substring(2, 10).toUpperCase();
      return `JURMALCIEMS_${rnd}`;
    }

    function generateNewSecureRoomCode() {
      const code = generateSecureRoomCode();
      setCloudRoomPreset(code);
      showToast("🎲 Сгенерирован защищенный код: " + code);
    }

    function copyRoomCodeToClipboard() {
      const code = cloudSyncState.roomCode;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          showToast("📋 Код " + code + " скопирован в буфер обмена!");
        }).catch(() => {
          showToast("Код комнаты: " + code);
        });
      } else {
        showToast("Код комнаты: " + code);
      }
    }
    function getRelayTopicForRoom(roomCode) {
      const slug = sanitizeCloudRoomCode(roomCode).toLowerCase().replace(/[^a-z0-9]/g, "_");
      const salt = computeFastHash("JURMALCIEMS_AIM250_SECRET_SALT_2026_" + slug);
      return `arm_jrmlcm_${slug}_${salt}`;
    }

    function computeFastHash(str) {
      const s = String(str || "");
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h.toString(36);
    }

    function encodeCompactParksidePoints(points) {
      if (!Array.isArray(points) || points.length === 0) return "";
      return points.map(p => [
        String(p.fullTime || "").replace(/[|\n\r]/g, " "),
        String(p.shortDateTime || "").replace(/[|\n\r]/g, " "),
        String(p.shortTime || "").replace(/[|\n\r]/g, " "),
        Number(p.tempC || 0).toFixed(1),
        Number(p.rhPct || 0).toFixed(1),
        Math.round(Number(p.elapsedMin || 0))
      ].join("|")).join("\n");
    }

    function decodeCompactParksidePoints(compactCsv) {
      if (!compactCsv || typeof compactCsv !== "string") return [];
      const lines = compactCsv.split("\n").map(l => l.trim()).filter(Boolean);
      const pts = [];
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split("|");
        if (parts.length < 6) continue;
        const tempC = parseFloat(parts[3]);
        const rhPct = parseFloat(parts[4]);
        const elapsedMin = parseFloat(parts[5]);
        if (isNaN(tempC) || isNaN(rhPct)) continue;
        pts.push({
          idx: i + 1,
          fullTime: parts[0] || parts[1] || `${elapsedMin} мин`,
          shortDateTime: parts[1] || parts[2] || `${elapsedMin}м`,
          shortTime: parts[2] || `${elapsedMin}м`,
          label: parts[2] || `${elapsedMin}м`,
          tempC,
          rhPct,
          elapsedMin: isNaN(elapsedMin) ? i * 5 : elapsedMin
        });
      }
      return pts;
    }

    function computeCurrentStateFingerprint() {
      const pk = activeParksideAnalysis
        ? `${activeParksideAnalysis.fileName}|${activeParksideAnalysis.profileKey || "custom"}|${activeParksideAnalysis.points ? activeParksideAnalysis.points.length : 0}|${activeParksideAnalysis.minRh}|${activeParksideAnalysis.maxRh}`
        : "none";
      const vxSnap = {
        batchMode: vx.batchMode,
        mixCarts: vx.mixCarts,
        yieldPct: vx.yieldPct,
        yieldSpecies: vx.yieldSpecies,
        purchase: vx.purchase,
        priceBulk: vx.priceBulk,
        priceVacPack: vx.priceVacPack,
        pricePremPiece: vx.pricePremPiece,
        tariff: vx.tariff,
        mixVac: vx.mixVac,
        variant: vx.variant
      };
      return computeFastHash(JSON.stringify({
        t: state.telemetry,
        v: vxSnap,
        l: (state.batchLogs || []).length,
        l0: (state.batchLogs && state.batchLogs[0]) ? state.batchLogs[0].id : 0,
        p: pk
      }));
    }

    function buildCloudStateSnapshot(includeFullParksideCsv = true) {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      let parksideObj = null;
      if (activeParksideAnalysis && Array.isArray(activeParksideAnalysis.points) && activeParksideAnalysis.points.length >= 2) {
        const compactCsv = encodeCompactParksidePoints(activeParksideAnalysis.points);
        const pointsHash = computeFastHash(`${activeParksideAnalysis.fileName}|${compactCsv}`);
        const isBuiltInDemo = Boolean(activeParksideAnalysis.profileKey && PARKSIDE_DEMO_LOGS[activeParksideAnalysis.profileKey]);
        parksideObj = {
          fileName: activeParksideAnalysis.fileName,
          profileKey: activeParksideAnalysis.profileKey || null,
          pointsCount: activeParksideAnalysis.points.length,
          pointsHash,
          compactCsv: (includeFullParksideCsv || !isBuiltInDemo) ? compactCsv : undefined
        };
      }
      const vxClean = {
        compact: vx.compact,
        batchMode: vx.batchMode,
        mixCarts: vx.mixCarts,
        yieldPct: vx.yieldPct,
        yieldSpecies: vx.yieldSpecies,
        purchase: vx.purchase,
        priceBulk: vx.priceBulk,
        priceVac: vx.priceVac,
        priceVacPack: vx.priceVacPack,
        pricePrem: vx.pricePrem,
        pricePremPiece: vx.pricePremPiece,
        tariff: vx.tariff,
        mixVac: vx.mixVac,
        variant: vx.variant
      };
      const fingerprint = computeCurrentStateFingerprint();
      return {
        schemaVersion: 2,
        roomCode: cloudSyncState.roomCode,
        updatedAtMs: now,
        updatedAtStr: timeStr,
        deviceId: cloudSyncState.deviceId,
        deviceName: cloudSyncState.deviceName,
        fingerprint,
        uiMode: state.uiMode || "ENGINEER",
        tradeHouse: tradeHouseState,
        chiefTech: chiefTechState,
        tubaWarehouse: tubaWarehouse,
        telemetry: { ...state.telemetry },
        vx: vxClean,
        batchLogs: Array.isArray(state.batchLogs) ? state.batchLogs.slice(0, 35) : [],
        parkside: parksideObj
      };
    }

    function logCloudSyncActivity(msg) {
      const nowStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      cloudSyncState.activityLog.unshift(`${nowStr} — ${msg}`);
      cloudSyncState.activityLog = cloudSyncState.activityLog.slice(0, 12);
      const box = document.getElementById("cloud-sync-activity-log");
      if (box) {
        box.innerHTML = cloudSyncState.activityLog.map(line => `<div>${escapeHtml(line)}</div>`).join("");
      }
    }

    function flashCloudHeaderBadge() {
      const btn = document.getElementById("btn-cloud-sync-header");
      if (!btn) return;
      btn.classList.remove("cloud-flash-active");
      void btn.offsetWidth;
      btn.classList.add("cloud-flash-active");
    }

    function updateCloudSyncUi() {
      const btn = document.getElementById("btn-cloud-sync-header");
      const txtEl = document.getElementById("cloud-sync-header-text");
      const shortRoom = getShortRoomBadgeCode(cloudSyncState.roomCode);

      if (btn && txtEl) {
        btn.classList.remove("syncing", "offline");
        if (cloudSyncState.status === "SYNCING") {
          btn.classList.add("syncing");
          txtEl.innerHTML = `🔄 Синхр: ОБМЕН… <span class="cloud-room-suffix">(Код: ${shortRoom})</span>`;
        } else if (cloudSyncState.status === "OFFLINE") {
          btn.classList.add("offline");
          txtEl.innerHTML = `⚠️ Синхр: ОФЛАЙН-КЕШ <span class="cloud-room-suffix">(Код: ${shortRoom})</span>`;
        } else {
          txtEl.innerHTML = `☁️ Синхр: ОНЛАЙН <span class="cloud-room-suffix">(Код: ${shortRoom})</span>`;
        }
      }

      const mobDrawerBtn = document.getElementById("mob-drawer-cloud-btn");
      if (mobDrawerBtn) {
        const stWord = cloudSyncState.status === "ONLINE" ? "ОНЛАЙН" : (cloudSyncState.status === "SYNCING" ? "ОБМЕН…" : "ОФЛАЙН-КЕШ");
        mobDrawerBtn.textContent = `☁️ Синхр: ${stWord} (Код: ${cloudSyncState.roomCode} • ${cloudSyncState.lastSyncTimeStr})`;
      }

      // Модальное окно
      const badgeEl = document.getElementById("cloud-modal-status-badge");
      if (badgeEl) {
        if (cloudSyncState.status === "ONLINE") {
          badgeEl.style.color = "var(--emerald-optimal)";
          badgeEl.textContent = cloudSyncState.autoSync ? "🟢 ОНЛАЙН (Авто 5 сек)" : "🟢 ОНЛАЙН (Ручной)";
        } else if (cloudSyncState.status === "SYNCING") {
          badgeEl.style.color = "var(--cyan-dew)";
          badgeEl.textContent = "🔄 СИНХРОНИЗАЦИЯ…";
        } else {
          badgeEl.style.color = "var(--amber-curing)";
          badgeEl.textContent = "⚠️ ОФЛАЙН (localStorage)";
        }
      }
      const backendSub = document.getElementById("cloud-modal-backend-sub");
      if (backendSub) backendSub.textContent = cloudSyncState.backendLabel;

      const lastTimeEl = document.getElementById("cloud-modal-last-time");
      if (lastTimeEl) lastTimeEl.textContent = cloudSyncState.lastSyncTimeStr;

      const lastDevEl = document.getElementById("cloud-modal-last-device");
      if (lastDevEl) lastDevEl.textContent = cloudSyncState.lastSyncDeviceStr;

      const t = state.telemetry;
      const sp = FISH_SPECIES[t.speciesKey] || FISH_SPECIES.VIMBA;
      const st = CURING_STAGES[t.stageKey] || CURING_STAGES.STAGE_2;
      const spMeta = VX_SPECIES_META[t.speciesKey] || VX_SPECIES_META.VIMBA;

      const telEl = document.getElementById("cloud-modal-snap-telemetry");
      if (telEl) telEl.textContent = `${spMeta.emoji} ${spMeta.short} • ${t.batchWeightKg} кг`;

      const stEl = document.getElementById("cloud-modal-snap-stage");
      if (stEl) stEl.textContent = `Ст.${st.number} • +${Number(t.environmentTempC).toFixed(1)}°C • ${Math.round(t.parksideRhPercent)}% rH`;

      const pkEl = document.getElementById("cloud-modal-snap-parkside");
      if (pkEl) {
        const ptsLen = (activeParksideAnalysis && activeParksideAnalysis.points) ? activeParksideAnalysis.points.length : 0;
        pkEl.textContent = `📈 ${ptsLen} точек (${activeParksideAnalysis ? activeParksideAnalysis.fileName.slice(0, 18) : "нет"})`;
      }

      const logsEl = document.getElementById("cloud-modal-snap-logs");
      if (logsEl) {
        logsEl.textContent = `Записей в журнале: ${(state.batchLogs || []).length}`;
      }

      const inlineRoom = document.getElementById("cloud-modal-room-inline");
      if (inlineRoom) inlineRoom.textContent = cloudSyncState.roomCode;

      const sw = document.getElementById("cloud-sync-auto-switch");
      if (sw) sw.classList.toggle("on", Boolean(cloudSyncState.autoSync));
    }

    async function applyCloudStateSnapshot(snap, sourceLabel = "Облако", forceApply = false) {
      if (!snap || typeof snap !== "object" || !snap.telemetry) return false;
      if (!forceApply && snap.fingerprint && snap.fingerprint === cloudSyncState.lastFingerprint) {
        return false;
      }
      if (!forceApply && snap.updatedAtMs && cloudSyncState.lastSnapshotRev && snap.updatedAtMs < cloudSyncState.lastSnapshotRev) {
        return false;
      }

      cloudSyncState.isApplyingRemote = true;
      try {
        if (snap.memoryLedger && typeof applyIncomingMemoryLedger === "function") {
          applyIncomingMemoryLedger(snap.memoryLedger);
        }
        // 0. Восстанавливаем расширенные контуры (склад TUBA, касса, партии)
        if (snap.tubaWarehouse && typeof snap.tubaWarehouse === "object") {
          tubaWarehouse = snap.tubaWarehouse;
          try { localStorage.setItem("JURMALCIEMS_WAREHOUSE_TUBA_V1", JSON.stringify(tubaWarehouse)); } catch(e){}
        }
        if (snap.spWarehouseBatches && Array.isArray(snap.spWarehouseBatches)) {
          spWarehouseBatches = snap.spWarehouseBatches;
        }
        if (snap.tradeHouseState && typeof snap.tradeHouseState === "object") {
          tradeHouseState = Object.assign(tradeHouseState, snap.tradeHouseState);
        }
        if (snap.chiefTechState && typeof snap.chiefTechState === "object") {
          chiefTechState = Object.assign(chiefTechState, snap.chiefTechState);
        }

        // 1. Применяем телеметрию
        const incomingTel = snap.telemetry;
        state.telemetry = {
          ...state.telemetry,
          ...incomingTel,
          speciesKey: FISH_SPECIES[incomingTel.speciesKey] ? incomingTel.speciesKey : state.telemetry.speciesKey,
          stageKey: CURING_STAGES[incomingTel.stageKey] ? incomingTel.stageKey : state.telemetry.stageKey,
          heatRecoveryMode: HEAT_RECOVERY_MODES[incomingTel.heatRecoveryMode] ? incomingTel.heatRecoveryMode : "WINTER_14KW"
        };
        state.customAiAdvice = null;

        // 2. Применяем параметры визуальных экранов и экономики (vx)
        if (snap.vx && typeof snap.vx === "object") {
          Object.assign(vx, snap.vx);
          if (!vx.mixCarts || typeof vx.mixCarts !== "object") {
            vx.mixCarts = { VIMBA: 8, BREAM: 4, PERCH: 3, ROACH: 0, SMELT: 0, GOBY: 0 };
          }
          vxApplyCompact();
        }

        // 3. Применяем журнал замеров партий
        if (Array.isArray(snap.batchLogs)) {
          state.batchLogs = snap.batchLogs;
        }

        // 4. Применяем лог Parkside (включая 527 точек или любой пользовательский CSV)
        if (snap.parkside && typeof snap.parkside === "object") {
          const pk = snap.parkside;
          const currentPkHash = activeParksideAnalysis && activeParksideAnalysis.points
            ? computeFastHash(`${activeParksideAnalysis.fileName}|${encodeCompactParksidePoints(activeParksideAnalysis.points)}`)
            : "";

          if (pk.pointsHash !== currentPkHash || !activeParksideAnalysis) {
            let restoredPoints = null;
            if (pk.compactCsv && typeof pk.compactCsv === "string") {
              restoredPoints = decodeCompactParksidePoints(pk.compactCsv);
            } else if (pk.pointsHash && cloudSyncState.downloadedParksideCache[pk.pointsHash]) {
              restoredPoints = decodeCompactParksidePoints(cloudSyncState.downloadedParksideCache[pk.pointsHash]);
            } else if (pk.profileKey && PARKSIDE_DEMO_LOGS[pk.profileKey]) {
              const demo = PARKSIDE_DEMO_LOGS[pk.profileKey];
              restoredPoints = parseParksideLogText(demo.fileName, demo.csvText);
            }
            if (restoredPoints && restoredPoints.length >= 2) {
              const analysis = analyzeParksidePoints(pk.fileName || "Parkside_Cloud.csv", restoredPoints);
              if (analysis) {
                analysis.profileKey = pk.profileKey || null;
                renderParksideChartAndVerdict(analysis);
              }
            }
          }
        }

        // 5. Сохраняем в резервный localStorage и обновляем весь экран
        persistStateToStorage();
        vxPersist();
        renderAll();

        cloudSyncState.lastSnapshotRev = snap.updatedAtMs || Date.now();
        cloudSyncState.lastFingerprint = computeCurrentStateFingerprint();
        cloudSyncState.lastSyncTimeStr = snap.updatedAtStr || new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        cloudSyncState.lastSyncDeviceStr = `Принято от: ${snap.deviceName || sourceLabel}`;
        cloudSyncState.status = "ONLINE";

        try {
          localStorage.setItem(CLOUD_STORAGE_KEYS.SNAP_PREFIX + cloudSyncState.roomCode, JSON.stringify(snap));
        } catch (e) {}

        updateCloudSyncUi();
        flashCloudHeaderBadge();
        logCloudSyncActivity(`⬇ Синхронизировано (${snap.deviceName || sourceLabel}): ${FISH_SPECIES[state.telemetry.speciesKey].shortRu} ${state.telemetry.batchWeightKg} кг`);
        return true;
      } finally {
        cloudSyncState.isApplyingRemote = false;
      }
    }

    // ---------- Транспорт 1: Пользовательский Firebase RTDB / Google Apps Script Webhook ----------
    async function pushToCustomCloudEndpoint(snap) {
      const base = (cloudSyncState.customEndpointUrl || "").trim();
      if (!base) return false;
      const room = sanitizeCloudRoomCode(cloudSyncState.roomCode);
      if (/firebaseio\.com|firebasedatabase\.app/i.test(base)) {
        const cleanBase = base.replace(/\/+$/, "").replace(/\.json$/i, "");
        const url = `${cleanBase}/jurmalciems_rooms/${room}.json`;
        const resp = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snap)
        });
        if (!resp.ok) throw new Error(`Firebase RTDB HTTP ${resp.status}`);
        cloudSyncState.backendLabel = "Firebase Realtime DB + localStorage";
        return true;
      } else {
        const resp = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "put", roomCode: room, snapshot: snap })
        });
        if (!resp.ok) throw new Error(`Webhook HTTP ${resp.status}`);
        cloudSyncState.backendLabel = "Cloud Webhook + localStorage";
        return true;
      }
    }

    async function pullFromCustomCloudEndpoint() {
      const base = (cloudSyncState.customEndpointUrl || "").trim();
      if (!base) return null;
      const room = sanitizeCloudRoomCode(cloudSyncState.roomCode);
      if (/firebaseio\.com|firebasedatabase\.app/i.test(base)) {
        const cleanBase = base.replace(/\/+$/, "").replace(/\.json$/i, "");
        const url = `${cleanBase}/jurmalciems_rooms/${room}.json`;
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) throw new Error(`Firebase RTDB HTTP ${resp.status}`);
        const data = await resp.json();
        if (data && data.telemetry) {
          cloudSyncState.backendLabel = "Firebase Realtime DB + localStorage";
          return data;
        }
        return null;
      } else {
        const sep = base.includes("?") ? "&" : "?";
        const resp = await fetch(`${base}${sep}action=get&roomCode=${encodeURIComponent(room)}&_t=${Date.now()}`, { cache: "no-store" });
        if (!resp.ok) throw new Error(`Webhook HTTP ${resp.status}`);
        const data = await resp.json();
        return (data && data.snapshot) ? data.snapshot : (data && data.telemetry ? data : null);
      }
    }

    // ---------- Транспорт 2: Встроенный облачный JSON-релей (Live SSE + HTTP Poll + Чанки Parkside 527 точек) ----------
    async function pushParksideChunksIfNeeded(parksideObj, topicBase) {
      if (!parksideObj || !parksideObj.compactCsv || !parksideObj.pointsHash) return 0;
      const isBuiltIn = Boolean(parksideObj.profileKey && PARKSIDE_DEMO_LOGS[parksideObj.profileKey]);
      if (isBuiltIn) return 0;

      const hash = parksideObj.pointsHash;
      const csv = parksideObj.compactCsv;
      const chunkSize = 2600;
      const totalChunks = Math.ceil(csv.length / chunkSize);

      if (cloudSyncState.uploadedParksideHashes.has(hash)) {
        return totalChunks;
      }

      const pkTopic = `${topicBase}_pk_${hash}`;
      for (let idx = 0; idx < totalChunks; idx++) {
        const part = csv.slice(idx * chunkSize, (idx + 1) * chunkSize);
        const packet = JSON.stringify({ h: hash, i: idx, n: totalChunks, d: part });
        await fetch(`https://ntfy.sh/${pkTopic}`, {
          method: "POST",
          body: packet
        });
      }
      cloudSyncState.uploadedParksideHashes.add(hash);
      cloudSyncState.downloadedParksideCache[hash] = csv;
      return totalChunks;
    }

    async function fetchParksideChunksFromRelay(topicBase, pointsHash, expectedChunks) {
      if (!pointsHash) return null;
      if (cloudSyncState.downloadedParksideCache[pointsHash]) {
        return cloudSyncState.downloadedParksideCache[pointsHash];
      }
      const pkTopic = `${topicBase}_pk_${pointsHash}`;
      const resp = await fetch(`https://ntfy.sh/${pkTopic}/json?poll=1&since=24h`, { cache: "no-store" });
      if (!resp.ok) return null;
      const text = await resp.text();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const partsMap = {};
      let maxN = expectedChunks || 1;
      for (const line of lines) {
        try {
          const env = JSON.parse(line);
          if (env && env.event === "message" && env.message) {
            const inner = JSON.parse(env.message);
            if (inner && inner.h === pointsHash && typeof inner.i === "number") {
              partsMap[inner.i] = inner.d || "";
              if (inner.n) maxN = inner.n;
            }
          }
        } catch (e) {}
      }
      const assembled = [];
      for (let i = 0; i < maxN; i++) {
        if (typeof partsMap[i] !== "string") return null;
        assembled.push(partsMap[i]);
      }
      const fullCsv = assembled.join("");
      cloudSyncState.downloadedParksideCache[pointsHash] = fullCsv;
      return fullCsv;
    }

    async function pushToPublicCloudRelay(snap) {
      const topicBase = getRelayTopicForRoom(cloudSyncState.roomCode);
      const relaySnap = JSON.parse(JSON.stringify(snap));

      if (relaySnap.parkside) {
        const isBuiltIn = Boolean(relaySnap.parkside.profileKey && PARKSIDE_DEMO_LOGS[relaySnap.parkside.profileKey]);
        if (isBuiltIn) {
          delete relaySnap.parkside.compactCsv;
        } else if (relaySnap.parkside.compactCsv) {
          if (relaySnap.parkside.compactCsv.length > 2200) {
            const chunksCount = await pushParksideChunksIfNeeded(relaySnap.parkside, topicBase);
            relaySnap.parkside.chunkCount = chunksCount;
            delete relaySnap.parkside.compactCsv;
          }
        }
      }

      // Ограничиваем размер batchLogs для мгновенного пакета до 12 последних записей
      if (Array.isArray(relaySnap.batchLogs) && relaySnap.batchLogs.length > 12) {
        relaySnap.batchLogs = relaySnap.batchLogs.slice(0, 12);
      }

      const resp = await fetch(`https://ntfy.sh/${topicBase}`, {
        method: "POST",
        body: JSON.stringify(relaySnap)
      });
      if (!resp.ok) throw new Error(`Cloud Relay HTTP ${resp.status}`);
      cloudSyncState.backendLabel = `Live Cloud (${FIREBASE_APPLET_CONFIG.projectId.slice(0, 15)}…)`;
      return true;
    }

    async function pullFromPublicCloudRelay() {
      const topicBase = getRelayTopicForRoom(cloudSyncState.roomCode);
      const resp = await fetch(`https://ntfy.sh/${topicBase}/json?poll=1&since=24h`, { cache: "no-store" });
      if (!resp.ok) throw new Error(`Cloud Relay HTTP ${resp.status}`);
      const rawText = await resp.text();
      const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
      let newestSnap = null;
      for (const line of lines) {
        try {
          const env = JSON.parse(line);
          if (env && env.event === "message" && env.message) {
            const candidate = JSON.parse(env.message);
            if (candidate && candidate.telemetry && candidate.roomCode === cloudSyncState.roomCode) {
              if (!newestSnap || (candidate.updatedAtMs || 0) >= (newestSnap.updatedAtMs || 0)) {
                newestSnap = candidate;
              }
            }
          }
        } catch (e) {}
      }
      if (newestSnap && newestSnap.parkside && !newestSnap.parkside.profileKey && !newestSnap.parkside.compactCsv && newestSnap.parkside.pointsHash) {
        const csv = await fetchParksideChunksFromRelay(topicBase, newestSnap.parkside.pointsHash, newestSnap.parkside.chunkCount || 1);
        if (csv) newestSnap.parkside.compactCsv = csv;
      }
      if (newestSnap) {
        cloudSyncState.backendLabel = `Live Cloud (${FIREBASE_APPLET_CONFIG.projectId.slice(0, 15)}…)`;
      }
      return newestSnap;
    }

    // ---------- Главные функции Push / Pull / AutoSync ----------
    async function pushCloudSyncNow(isManual = false) {
      if (cloudSyncState.isApplyingRemote) return false;
      const snap = buildCloudStateSnapshot(true);

      // 1. Всегда сохраняем резервную копию слепка в localStorage (на случай пропадания интернета в цеху)
      try {
        localStorage.setItem(CLOUD_STORAGE_KEYS.SNAP_PREFIX + cloudSyncState.roomCode, JSON.stringify(snap));
      } catch (e) {}

      // 2. Мгновенная синхронизация между вкладками одного устройства через BroadcastChannel
      if (cloudSyncState.broadcastChannel) {
        try {
          cloudSyncState.broadcastChannel.postMessage(snap);
        } catch (e) {}
      }

      cloudSyncState.status = "SYNCING";
      updateCloudSyncUi();

      try {
        if (cloudSyncState.customEndpointUrl) {
          try {
            await pushToCustomCloudEndpoint(snap);
          } catch (customErr) {
            console.warn("Custom cloud push failed (Firebase 401/network), falling back to public ntfy relay:", customErr);
            await pushToPublicCloudRelay(snap);
          }
        } else {
          await pushToPublicCloudRelay(snap);
        }
        cloudSyncState.status = "ONLINE";
        cloudSyncState.lastSnapshotRev = snap.updatedAtMs;
        cloudSyncState.lastFingerprint = snap.fingerprint;
        cloudSyncState.lastSyncTimeStr = snap.updatedAtStr;
        cloudSyncState.lastSyncDeviceStr = `Отправлено с: ${cloudSyncState.deviceName}`;
        updateCloudSyncUi();
        flashCloudHeaderBadge();
        logCloudSyncActivity(`⬆ Отправлен слепок в комнату ${cloudSyncState.roomCode} (${FISH_SPECIES[state.telemetry.speciesKey].shortRu} ${state.telemetry.batchWeightKg} кг, лог ${snap.parkside ? snap.parkside.pointsCount : 0} тчк)`);
        if (isManual) {
          showToast(`☁️ Данные отправлены в облако (Комната: ${cloudSyncState.roomCode} • ${snap.updatedAtStr})`);
        }
        return true;
      } catch (err) {
        cloudSyncState.status = "OFFLINE";
        cloudSyncState.backendLabel = "Резервный кэш localStorage (Офлайн)";
        cloudSyncState.lastSyncTimeStr = snap.updatedAtStr;
        cloudSyncState.lastSyncDeviceStr = "Сохранено локально (нет сети)";
        updateCloudSyncUi();
        logCloudSyncActivity(`⚠️ Сеть недоступна — слепок сохранен в резервный localStorage (${snap.updatedAtStr})`);
        if (isManual) {
          showToast(`⚠️ Нет связи с облаком — данные надежно сохранены в localStorage и отправятся при появлении сети`);
        }
        return false;
      }
    }

    async function pullCloudSyncNow(isManual = false) {
      if (cloudSyncState.isApplyingRemote) return false;
      if (isManual) {
        cloudSyncState.status = "SYNCING";
        updateCloudSyncUi();
      }
      try {
        let remoteSnap = null;
        if (cloudSyncState.customEndpointUrl) {
          try {
            remoteSnap = await pullFromCustomCloudEndpoint();
          } catch (customErr) {
            console.warn("Custom cloud pull failed (Firebase 401/network), falling back to public ntfy relay:", customErr);
            remoteSnap = await pullFromPublicCloudRelay();
          }
        } else {
          remoteSnap = await pullFromPublicCloudRelay();
        }

        cloudSyncState.status = "ONLINE";
        const nowStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        if (!remoteSnap) {
          cloudSyncState.lastSyncTimeStr = nowStr;
          updateCloudSyncUi();
          if (isManual) {
            showToast(`☁️ Комната ${cloudSyncState.roomCode} пока пуста — отправляем текущие данные в облако...`);
            await pushCloudSyncNow(true);
          }
          return false;
        }

        const applied = await applyCloudStateSnapshot(remoteSnap, remoteSnap.deviceName || "Облако", isManual);
        if (!applied) {
          cloudSyncState.lastSyncTimeStr = nowStr;
          updateCloudSyncUi();
          if (isManual) {
            showToast(`☁️ У вас уже самые свежие данные комнаты ${cloudSyncState.roomCode} (${nowStr})`);
          }
        } else if (isManual) {
          showToast(`☁️ Свежие данные из комнаты ${cloudSyncState.roomCode} загружены (${remoteSnap.updatedAtStr})!`);
        }
        return applied;
      } catch (err) {
        cloudSyncState.status = "OFFLINE";
        cloudSyncState.backendLabel = "Резервный кэш localStorage (Офлайн)";
        updateCloudSyncUi();
        if (isManual) {
          // Пробуем восстановить из локального кэша комнаты
          try {
            const cachedRaw = localStorage.getItem(CLOUD_STORAGE_KEYS.SNAP_PREFIX + cloudSyncState.roomCode);
            if (cachedRaw) {
              const cachedSnap = JSON.parse(cachedRaw);
              await applyCloudStateSnapshot(cachedSnap, "Резерв localStorage", true);
              showToast(`⚠️ Сеть недоступна — восстановлен последний слепок из localStorage`);
              return true;
            }
          } catch (e) {}
          showToast(`⚠️ Нет связи с облаком — работаем из резервного кэша localStorage`);
        }
        return false;
      }
    }

    function scheduleCloudSyncPush(reason) {
      if (cloudSyncState.isBooting || cloudSyncState.isApplyingRemote) return;
      const newFp = computeCurrentStateFingerprint();
      if (newFp === cloudSyncState.lastFingerprint) return;

      // Мгновенно рассылаем соседним вкладкам через BroadcastChannel
      if (cloudSyncState.broadcastChannel) {
        try {
          cloudSyncState.broadcastChannel.postMessage(buildCloudStateSnapshot(true));
        } catch (e) {}
      }

      if (!cloudSyncState.autoSync) return;
      clearTimeout(cloudSyncState.pushDebounceTimer);
      cloudSyncState.pushDebounceTimer = setTimeout(() => {
        pushCloudSyncNow(false);
      }, 650);
    }

    function connectCloudSseStream() {
      if (cloudSyncState.sseSource) {
        try { cloudSyncState.sseSource.close(); } catch (e) {}
        cloudSyncState.sseSource = null;
      }
      if (!cloudSyncState.autoSync || cloudSyncState.customEndpointUrl || typeof EventSource === "undefined") {
        return;
      }
      try {
        const topicBase = getRelayTopicForRoom(cloudSyncState.roomCode);
        const es = new EventSource(`https://ntfy.sh/${topicBase}/sse`);
        es.onmessage = async (evt) => {
          try {
            const data = JSON.parse(evt.data);
            const snap = (data && data.telemetry) ? data : (data && data.message ? JSON.parse(data.message) : null);
            if (snap && snap.telemetry && snap.roomCode === cloudSyncState.roomCode && snap.deviceId !== cloudSyncState.deviceId) {
              if (snap.parkside && !snap.parkside.profileKey && !snap.parkside.compactCsv && snap.parkside.pointsHash) {
                const csv = await fetchParksideChunksFromRelay(topicBase, snap.parkside.pointsHash, snap.parkside.chunkCount || 1);
                if (csv) snap.parkside.compactCsv = csv;
              }
              await applyCloudStateSnapshot(snap, snap.deviceName || "Live SSE", false);
            }
          } catch (e) {}
        };
        cloudSyncState.sseSource = es;
      } catch (e) {}
    }

    function restartCloudAutoSyncTimers() {
      if (cloudSyncState.pollIntervalId) {
        clearInterval(cloudSyncState.pollIntervalId);
        cloudSyncState.pollIntervalId = null;
      }
      if (cloudSyncState.autoSync) {
        cloudSyncState.pollIntervalId = setInterval(() => {
          if (!document.hidden && !cloudSyncState.isApplyingRemote) {
            pullCloudSyncNow(false);
          }
        }, 5000);
        connectCloudSseStream();
      } else if (cloudSyncState.sseSource) {
        try { cloudSyncState.sseSource.close(); } catch (e) {}
        cloudSyncState.sseSource = null;
      }
      updateCloudSyncUi();
    }

    function openCloudSyncModal() {
      triggerHaptic(12);
      const modal = document.getElementById("cloud-sync-modal");
      const roomInp = document.getElementById("cloud-sync-room-input");
      const urlInp = document.getElementById("cloud-sync-custom-url-input");
      if (roomInp) roomInp.value = cloudSyncState.roomCode;
      if (urlInp) urlInp.value = cloudSyncState.customEndpointUrl || "";
      updateCloudSyncUi();
      if (modal) modal.classList.add("open");
    }

    function closeCloudSyncModal() {
      triggerHaptic(10);
      const modal = document.getElementById("cloud-sync-modal");
      if (modal) modal.classList.remove("open");
    }

    function setCloudRoomPreset(presetCode) {
      triggerHaptic(12);
      const inp = document.getElementById("cloud-sync-room-input");
      if (inp) inp.value = presetCode;
      applyCloudRoomCode();
    }

    function applyCloudRoomCode() {
      triggerHaptic(15);
      const inp = document.getElementById("cloud-sync-room-input");
      const newRoom = sanitizeCloudRoomCode(inp ? inp.value : "JURMALCIEMS_MAIN");
      cloudSyncState.roomCode = newRoom;
      if (inp) inp.value = newRoom;
      try {
        localStorage.setItem(CLOUD_STORAGE_KEYS.ROOM, newRoom);
      } catch (e) {}
      cloudSyncState.lastSnapshotRev = 0;
      updateCloudSyncUi();
      restartCloudAutoSyncTimers();
      logCloudSyncActivity(`🔗 Подключена комната цеха: ${newRoom}`);
      showToast(`☁️ Подключена комната синхронизации: ${newRoom}`);
      pullCloudSyncNow(true);
    }

    function toggleCloudAutoSync() {
      triggerHaptic(15);
      cloudSyncState.autoSync = !cloudSyncState.autoSync;
      try {
        localStorage.setItem(CLOUD_STORAGE_KEYS.AUTO, cloudSyncState.autoSync ? "1" : "0");
      } catch (e) {}
      restartCloudAutoSyncTimers();
      logCloudSyncActivity(cloudSyncState.autoSync
        ? "⚡ Включена авто-синхронизация в реальном времени (каждые 5 сек)"
        : "⏸ Авто-синхронизация каждые 5 сек приостановлена");
      showToast(cloudSyncState.autoSync
        ? "⚡ Авто-синхронизация в реальном времени (каждые 5 сек) ВКЛЮЧЕНА"
        : "⏸ Авто-синхронизация отключена (доступен ручной обмен кнопками ⬆ / ⬇)");
    }

    function saveCloudCustomEndpointUrl() {
      triggerHaptic(12);
      const inp = document.getElementById("cloud-sync-custom-url-input");
      const val = String(inp ? inp.value : "").trim();
      cloudSyncState.customEndpointUrl = val;
      try {
        if (val) localStorage.setItem(CLOUD_STORAGE_KEYS.CUSTOM_URL, val);
        else localStorage.removeItem(CLOUD_STORAGE_KEYS.CUSTOM_URL);
      } catch (e) {}
      restartCloudAutoSyncTimers();
      showToast(val
        ? "🔥 Пользовательский URL облачной БД сохранен!"
        : "☁️ Включено встроенное авто-облако Юрмалциемс (Live Cloud Relay)");
      pushCloudSyncNow(true);
    }

    function exportCloudSnapshotFile() {
      triggerHaptic(12);
      const snap = buildCloudStateSnapshot(true);
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Jurmalciems_Cloud_Snapshot_${cloudSyncState.roomCode}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("💾 Полный JSON-слепок цеха (включая 527 точек Parkside) сохранен в файл!");
    }

    function importCloudSnapshotFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(String(evt.target.result || ""));
          if (!parsed || !parsed.telemetry) {
            showToast("⚠️ Файл не содержит корректного слепка состояния АРМ Юрмалциемс");
            return;
          }
          await applyCloudStateSnapshot(parsed, `Файл ${file.name}`, true);
          await pushCloudSyncNow(false);
          showToast(`✅ Слепок из файла ${file.name} применен и отправлен в облако!`);
        } catch (e) {
          showToast("⚠️ Ошибка чтения JSON-файла слепка");
        }
      };
      reader.readAsText(file, "UTF-8");
    }

    function cloudSyncInit() {
      cloudSyncState.deviceName = detectDeviceLabel();
      try {
        let devId = localStorage.getItem(CLOUD_STORAGE_KEYS.DEVICE_ID);
        if (!devId) {
          devId = "dev_" + Math.random().toString(36).slice(2, 9);
          localStorage.setItem(CLOUD_STORAGE_KEYS.DEVICE_ID, devId);
        }
        cloudSyncState.deviceId = devId;

        const savedRoom = localStorage.getItem(CLOUD_STORAGE_KEYS.ROOM);
        if (savedRoom) {
          cloudSyncState.roomCode = sanitizeCloudRoomCode(savedRoom);
        } else {
          const newRoom = generateSecureRoomCode();
          cloudSyncState.roomCode = newRoom;
          localStorage.setItem(CLOUD_STORAGE_KEYS.ROOM, newRoom);
        }

        const savedAuto = localStorage.getItem(CLOUD_STORAGE_KEYS.AUTO);
        if (savedAuto !== null) cloudSyncState.autoSync = savedAuto !== "0";

        const savedUrl = localStorage.getItem(CLOUD_STORAGE_KEYS.CUSTOM_URL);
        if (savedUrl) {
          cloudSyncState.customEndpointUrl = savedUrl;
        } else {
          cloudSyncState.customEndpointUrl = "https://gen-lang-client-0013068271-default-rtdb.firebaseio.com";
          localStorage.setItem(CLOUD_STORAGE_KEYS.CUSTOM_URL, cloudSyncState.customEndpointUrl);
        }
      } catch (e) {}

      if (typeof BroadcastChannel !== "undefined") {
        try {
          cloudSyncState.broadcastChannel = new BroadcastChannel("arm_jurmalciems_cloud_sync_v1");
          cloudSyncState.broadcastChannel.onmessage = (evt) => {
            const snap = evt.data;
            if (snap && snap.roomCode === cloudSyncState.roomCode && snap.deviceId !== cloudSyncState.deviceId) {
              applyCloudStateSnapshot(snap, "Соседняя вкладка", false);
            }
          };
        } catch (e) {}
      }

      window.addEventListener("online", () => {
        logCloudSyncActivity("🌐 Связь с интернетом восстановлена — синхронизируем комнату " + cloudSyncState.roomCode);
        pushCloudSyncNow(false);
      });

      cloudSyncState.lastFingerprint = computeCurrentStateFingerprint();
      cloudSyncState.isBooting = false;
      updateCloudSyncUi();
      restartCloudAutoSyncTimers();

      // При открытии программы сразу проверяем свежие данные в комнате JURMALCIEMS_MAIN
      setTimeout(() => {
        pullCloudSyncNow(false);
      }, 450);
    }

    // Инициализация при загрузке: восстановление из localStorage + 4 визуальных экрана Tesla/SCADA + реальный лог 527 точек + Облачная синхронизация
    loadPersistedState();
    vxInit();
    try {
      if (typeof renderAllSpPanels === "function") renderAllSpPanels();
    } catch (e) { console.warn("renderAllSpPanels init error:", e); }
    setInterval(renderPhaseTimerHud, 1000);
    if (
      activeParksideAnalysis &&
      Array.isArray(activeParksideAnalysis.points) &&
      activeParksideAnalysis.points.length >= 2 &&
      activeParksideAnalysis.profileKey !== "st2_active"
    ) {
      const savedProfileKey = activeParksideAnalysis.fileName === "USB Data Logger_261028_1234.CSV"
        ? "real_527"
        : (activeParksideAnalysis.profileKey || null);
      const restoredAnalysis = analyzeParksidePoints(activeParksideAnalysis.fileName, activeParksideAnalysis.points);
      if (restoredAnalysis) {
        restoredAnalysis.profileKey = savedProfileKey;
        renderParksideChartAndVerdict(restoredAnalysis);
      } else {
        loadDemoParksideProfile("real_527", true);
      }
    } else {
      loadDemoParksideProfile("real_527", true);
    }
    cloudSyncInit();
  
    // ==========================================================================
    // СУПЕР-ХАБ: 7 ГЛАВНЫХ КАЛЬКУЛЯТОРОВ ТЕХНОЛОГА ЮРМАЛЦИЕМС
    // ==========================================================================
    state.superHubActiveCalc = 1;

    function selectSuperHubCalc(num) {
      triggerHaptic(15);
      state.superHubActiveCalc = num;
      for (let i = 1; i <= 7; i++) {
        const btn = document.getElementById("sh-btn-" + i);
        if (btn) btn.classList.toggle("active", i === num);
      }
      renderSuperHub();
      try {
        const activeBtn = document.getElementById("sh-btn-" + num);
        if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch (e) {}
    }

    // SVG Колба слива воды с анимацией волн и капель
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

    document.addEventListener("visibilitychange", async () => {
      if (screenWakeLock !== null && document.visibilityState === "visible" && screenWakeLockDesired) {
        await initScreenWakeLock();
      }
    });

    window.addEventListener("load", () => {
      initScreenWakeLock();
    });

    document.addEventListener("click", () => {
      if (!screenWakeLock && screenWakeLockDesired) {
        initScreenWakeLock();
      }
    }, { once: true });


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
    var currentPhoneSimUrl = "telefon.html";

    function openPhoneSimulator(targetUrl) {
      const modal = document.getElementById("phone-simulator-modal");
      if (modal) {
        modal.style.display = "flex";
        if (targetUrl) {
          switchPhoneSimView(targetUrl);
        } else {
          const iframe = document.getElementById("phone-sim-iframe");
          if (!iframe.src || iframe.src === "about:blank" || iframe.src.endsWith("/")) {
            switchPhoneSimView(currentPhoneSimUrl || "telefon.html");
          }
        }
        if (typeof broadcastTelemetrySync === "function") {
          setTimeout(broadcastTelemetrySync, 50);
        }
      }
    }
    function closePhoneSimulator() {
      const modal = document.getElementById("phone-simulator-modal");
      if (modal) modal.style.display = "none";
    }
    function switchPhoneSimView(url) {
      currentPhoneSimUrl = url;
      const iframe = document.getElementById("phone-sim-iframe");
      if (iframe) {
        iframe.src = url;
      }
      const titleEl = document.getElementById("phone-sim-title-text");
      const btnTech = document.getElementById("sim-tab-tech");
      const btnRybak = document.getElementById("sim-tab-rybak");

      const isRybak = url.includes("rybak.html");
      if (titleEl) {
        titleEl.textContent = isRybak
          ? "OnePlus 13 Pro (412 × 892) • Экран Рыбака"
          : "OnePlus 13 Pro (412 × 892) • Мобильный АРМ";
      }
      if (btnTech) btnTech.classList.toggle("active", !isRybak);
      if (btnRybak) btnRybak.classList.toggle("active", isRybak);

      if (typeof broadcastTelemetrySync === "function") {
        setTimeout(broadcastTelemetrySync, 100);
      }
    }
    function reloadPhoneSimulator() {
      const iframe = document.getElementById("phone-sim-iframe");
      if (iframe) {
        const sep = currentPhoneSimUrl.includes("?") ? "&" : "?";
        iframe.src = currentPhoneSimUrl + sep + "t=" + Date.now();
      }
    }
    function openPhoneFullscreen() {
      window.open(currentPhoneSimUrl, "_blank");
    }

    // Двусторонняя синхронизация через BroadcastChannel
    var phoneSimSyncChannel = ("BroadcastChannel" in window) ? new BroadcastChannel("JURMALCIEMS_SYNC_CHANNEL") : null;
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

        // 🧠 Приём памяти цеха от мобильной версии через BroadcastChannel
        if (event.data.type === "SYNC_MEMORY_LEDGER" && event.data.memoryLedger) {
          try {
            if (typeof applyIncomingMemoryLedger === "function") {
              applyIncomingMemoryLedger(event.data.memoryLedger);
            }
            if (typeof updateMemoryBadges === "function") updateMemoryBadges();
            if (typeof renderWorkshopMemoryModal === "function") renderWorkshopMemoryModal();
            if (typeof showToast === "function") {
              const bCount = (event.data.memoryLedger.batchesHistory || []).length;
              const rCount = (event.data.memoryLedger.learnedRules || []).length;
              showToast(`🧠 Синхронизирована память цеха с телефона (${bCount} партий, ${rCount} правил)`);
            }
          } catch (e) {
            console.warn("SYNC_MEMORY_LEDGER error:", e);
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

    // ==================== 🔑 МАСКИРОВАНИЕ GEMINI API КЛЮЧА ====================
    let isGeminiKeyRevealed = false;
    // Unified with toggleInlineKeyVisibility

    // ==================== 📦 СВОДКА МАСТЕР-СЛЕПКА В WHATSAPP ====================
    
    // ==================== 🏭 UNIFIED WORKSHOP SNAPSHOT & ALARM BRIDGES ====================
    function exportUnifiedWorkshopSnapshot() {
      if (typeof exportCloudSnapshotFile === "function") {
        exportCloudSnapshotFile();
      }
    }

    function importUnifiedWorkshopSnapshot(file) {
      if (typeof importCloudSnapshotFile === "function") {
        importCloudSnapshotFile(file);
      }
    }

    function playIndustrialAlarmSound() {
      if (typeof startScadaEmergencyAudio === "function") {
        startScadaEmergencyAudio();
      }
    }

    function stopIndustrialAlarmSound() {
      if (typeof stopScadaEmergencyAudio === "function") {
        stopScadaEmergencyAudio();
      }
    }

    function sendWhatsAppSnapshotSummary() {
      triggerHaptic(20);
      const t = (typeof state !== "undefined" && state && state.telemetry) ? state.telemetry : { speciesKey: "VIMBA", batchWeightKg: 1000, environmentTempC: 15.8, parksideRhPercent: 58, stageKey: "STAGE_2", isPausePhaseNow: false };
      const spName = (typeof FISH_SPECIES !== "undefined" && FISH_SPECIES[t.speciesKey]) ? FISH_SPECIES[t.speciesKey].titleRu : "Рыба";
      const stName = (typeof CURING_STAGES !== "undefined" && CURING_STAGES[t.stageKey]) ? CURING_STAGES[t.stageKey].titleRu : "Стадия 2";

      let whKg = 0, whPacks = 0, whEur = 0;
      const wh = (typeof tubaWarehouse !== "undefined" && tubaWarehouse) || (typeof mobWarehouse !== "undefined" && mobWarehouse) || {};
      for (const k in wh) {
        whKg += (wh[k].kg || 0);
        whPacks += (wh[k].packs || 0);
        whEur += ((wh[k].kg || 0) * (wh[k].wholesalePrice || 0));
      }

      const text =
`🏭 *АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (СВОДКА ЦЕХА)*\n` +
`AIM AGHD-250ELC • Срез на: ${new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}\n` +
`-----------------------------------------\n` +
`🐟 *Активная партия:* ${spName} (${t.batchWeightKg} кг)\n` +
`📍 *Стадия:* ${stName}\n` +
`🌡️ *Камера:* ${t.environmentTempC}°C | ${t.parksideRhPercent}% rH\n` +
`⚡ *Частотники Cantoni:* ${t.isPausePhaseNow ? 'Пауза (15–20 Гц)' : 'Сушка (30 Гц)'}\n` +
`-----------------------------------------\n` +
`📦 *Склад TUBA:* ${whPacks} пач. (${whKg} кг • ~${Math.ceil(whPacks/40)} кор.)\n` +
`💰 *Оценка запаса:* ${whEur.toLocaleString()} €\n` +
`-----------------------------------------\n` +
`✅ Все контуры в норме. Готово к передаче смены.`;

      const waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
      window.open(waUrl, "_blank");
    }



  

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
  function validateAndSanitizeMemoryLedger(data) {
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

  // Делегированная обработка действий по data-action
  if (typeof document !== "undefined") {
    document.addEventListener("click", (evt) => {
      const btn = evt.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "delete-batch") {
        evt.preventDefault();
        evt.stopPropagation();
        deleteMemoryBatch(btn.dataset.id);
      } else if (action === "delete-rule") {
        evt.preventDefault();
        evt.stopPropagation();
        deleteMemoryRule(btn.dataset.id);
      } else if (action === "quick-question") {
        evt.preventDefault();
        evt.stopPropagation();
        const q = btn.dataset.question || btn.textContent.trim();
        if (typeof sendChatMessage === "function") sendChatMessage(q);
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

  // Явная привязка всех интерактивных обработчиков к window для inline HTML (onclick, onchange, oninput)
  if (typeof window !== "undefined") {
    Object.assign(window, {
      setAppUiMode: typeof setAppUiMode !== "undefined" ? setAppUiMode : undefined,
      selectTab: typeof selectTab !== "undefined" ? selectTab : undefined,
      selectMobileMainTab: typeof selectMobileMainTab !== "undefined" ? selectMobileMainTab : undefined,
      toggleCalibHud: typeof toggleCalibHud !== "undefined" ? toggleCalibHud : undefined,
      applyScreenScale: typeof applyScreenScale !== "undefined" ? applyScreenScale : undefined,
      adjustScreenScale: typeof adjustScreenScale !== "undefined" ? adjustScreenScale : undefined,
      cycleScreenCalibration: typeof cycleScreenCalibration !== "undefined" ? cycleScreenCalibration : undefined,
      initScreenCalibration: typeof initScreenCalibration !== "undefined" ? initScreenCalibration : undefined,
      setPausePhase: typeof setPausePhase !== "undefined" ? setPausePhase : undefined,
      setCircuits: typeof setCircuits !== "undefined" ? setCircuits : undefined,
      setHeatRecoveryMode: typeof setHeatRecoveryMode !== "undefined" ? setHeatRecoveryMode : undefined,
      onNumericInput: typeof onNumericInput !== "undefined" ? onNumericInput : undefined,
      stepTelemetry: typeof stepTelemetry !== "undefined" ? stepTelemetry : undefined,
      onPsychrometerInput: typeof onPsychrometerInput !== "undefined" ? onPsychrometerInput : undefined,
      applyPsychrometerToAdvisor: typeof applyPsychrometerToAdvisor !== "undefined" ? applyPsychrometerToAdvisor : undefined,
      selectSpecies: typeof selectSpecies !== "undefined" ? selectSpecies : undefined,
      selectStage: typeof selectStage !== "undefined" ? selectStage : undefined,
      applyPreset: typeof applyPreset !== "undefined" ? applyPreset : undefined,
      requestAiAdvice: typeof requestAiAdvice !== "undefined" ? requestAiAdvice : undefined,
      copyCurrentAdvice: typeof copyCurrentAdvice !== "undefined" ? copyCurrentAdvice : undefined,
      saveBatchToLog: typeof saveBatchToLog !== "undefined" ? saveBatchToLog : undefined,
      clearBatchLogs: typeof clearBatchLogs !== "undefined" ? clearBatchLogs : undefined,
      exportAllBatchLogsCsv: typeof exportAllBatchLogsCsv !== "undefined" ? exportAllBatchLogsCsv : undefined,
      loadFull4StageDemoBatchLogs: typeof loadFull4StageDemoBatchLogs !== "undefined" ? loadFull4StageDemoBatchLogs : undefined,
      handleParksideFileUpload: typeof handleParksideFileUpload !== "undefined" ? handleParksideFileUpload : undefined,
      loadDemoParksideProfile: typeof loadDemoParksideProfile !== "undefined" ? loadDemoParksideProfile : undefined,
      setParksideZoom: typeof setParksideZoom !== "undefined" ? setParksideZoom : undefined,
      stepParksidePan: typeof stepParksidePan !== "undefined" ? stepParksidePan : undefined,
      onParksidePanInput: typeof onParksidePanInput !== "undefined" ? onParksidePanInput : undefined,
      syncParksideToAdvisor: typeof syncParksideToAdvisor !== "undefined" ? syncParksideToAdvisor : undefined,
      copyMcgsTable: typeof copyMcgsTable !== "undefined" ? copyMcgsTable : undefined,
      applyMcgsPhaseToChamber: typeof applyMcgsPhaseToChamber !== "undefined" ? applyMcgsPhaseToChamber : undefined,
      setMcgsPhaseFilter: typeof setMcgsPhaseFilter !== "undefined" ? setMcgsPhaseFilter : undefined,
      toggleMobileMcgsTable: typeof toggleMobileMcgsTable !== "undefined" ? toggleMobileMcgsTable : undefined,
      openMcgsScreenGuide: typeof openMcgsScreenGuide !== "undefined" ? openMcgsScreenGuide : undefined,
      closeMcgsScreenGuide: typeof closeMcgsScreenGuide !== "undefined" ? closeMcgsScreenGuide : undefined,
      toggleVoiceListening: typeof toggleVoiceListening !== "undefined" ? toggleVoiceListening : undefined,
      stopVoiceAll: typeof stopVoiceAll !== "undefined" ? stopVoiceAll : undefined,
      speakVoiceReport: typeof speakVoiceReport !== "undefined" ? speakVoiceReport : undefined,
      toggleMobileRecording: typeof toggleMobileRecording !== "undefined" ? toggleMobileRecording : undefined,
      speakCurrentKpiReport: typeof speakCurrentKpiReport !== "undefined" ? speakCurrentKpiReport : undefined,
      triggerHaptic: typeof triggerHaptic !== "undefined" ? triggerHaptic : undefined,
      speakWithAiVoice: typeof speakWithAiVoice !== "undefined" ? speakWithAiVoice : undefined,
      handleVoiceCommand: typeof handleVoiceCommand !== "undefined" ? handleVoiceCommand : undefined,
      openCloudSyncModal: typeof openCloudSyncModal !== "undefined" ? openCloudSyncModal : undefined,
      closeCloudSyncModal: typeof closeCloudSyncModal !== "undefined" ? closeCloudSyncModal : undefined,
      openWorkshopMemoryModal: typeof openWorkshopMemoryModal !== "undefined" ? openWorkshopMemoryModal : undefined,
      closeWorkshopMemoryModal: typeof closeWorkshopMemoryModal !== "undefined" ? closeWorkshopMemoryModal : undefined,
      openGeminiKeyModal: typeof openGeminiKeyModal !== "undefined" ? openGeminiKeyModal : undefined,
      closeGeminiKeyModal: typeof closeGeminiKeyModal !== "undefined" ? closeGeminiKeyModal : undefined,
      promptApiKey: typeof promptApiKey !== "undefined" ? promptApiKey : undefined,
      openFullscreenMimicModal: typeof openFullscreenMimicModal !== "undefined" ? openFullscreenMimicModal : undefined,
      closeFullscreenMimicModal: typeof closeFullscreenMimicModal !== "undefined" ? closeFullscreenMimicModal : undefined,
      openWhatsAppReportModal: typeof openWhatsAppReportModal !== "undefined" ? openWhatsAppReportModal : undefined,
      closeWhatsAppReportModal: typeof closeWhatsAppReportModal !== "undefined" ? closeWhatsAppReportModal : undefined,
      printEurotankPassport: typeof printEurotankPassport !== "undefined" ? printEurotankPassport : undefined,
      openMobileActionsDrawer: typeof openMobileActionsDrawer !== "undefined" ? openMobileActionsDrawer : undefined,
      promptQuickFactAbsorption: typeof promptQuickFactAbsorption !== "undefined" ? promptQuickFactAbsorption : undefined,
      dismissProactiveBanner: typeof dismissProactiveBanner !== "undefined" ? dismissProactiveBanner : undefined,
      applyProactiveYieldCorrection: typeof applyProactiveYieldCorrection !== "undefined" ? applyProactiveYieldCorrection : undefined,
      submitQuickFactFromModal: typeof submitQuickFactFromModal !== "undefined" ? submitQuickFactFromModal : undefined,
      switchMemoryModalTab: typeof switchMemoryModalTab !== "undefined" ? switchMemoryModalTab : undefined,
      exportMemoryLedgerJson: typeof exportMemoryLedgerJson !== "undefined" ? exportMemoryLedgerJson : undefined,
      importMemoryLedgerJson: typeof importMemoryLedgerJson !== "undefined" ? importMemoryLedgerJson : undefined,
      clearWorkshopMemory: typeof clearWorkshopMemory !== "undefined" ? clearWorkshopMemory : undefined,
      loadWorkshopMemory: typeof loadWorkshopMemory !== "undefined" ? loadWorkshopMemory : undefined,
      saveWorkshopMemory: typeof saveWorkshopMemory !== "undefined" ? saveWorkshopMemory : undefined,
      updateMemoryBadges: typeof updateMemoryBadges !== "undefined" ? updateMemoryBadges : undefined,
      checkProactiveMemoryReminder: typeof checkProactiveMemoryReminder !== "undefined" ? checkProactiveMemoryReminder : undefined,
      deleteMemoryBatch: typeof deleteMemoryBatch !== "undefined" ? deleteMemoryBatch : undefined,
      deleteMemoryRule: typeof deleteMemoryRule !== "undefined" ? deleteMemoryRule : undefined,
      absorbFactToMemory: typeof absorbFactToMemory !== "undefined" ? absorbFactToMemory : undefined,
      triggerExportCsv: typeof triggerExportCsv !== "undefined" ? triggerExportCsv : undefined,
      downloadActiveCsv: typeof downloadActiveCsv !== "undefined" ? downloadActiveCsv : undefined,
      copyActiveCsv: typeof copyActiveCsv !== "undefined" ? copyActiveCsv : undefined,
      closeCsvModal: typeof closeCsvModal !== "undefined" ? closeCsvModal : undefined,
      sendWhatsAppSnapshotSummary: typeof sendWhatsAppSnapshotSummary !== "undefined" ? sendWhatsAppSnapshotSummary : undefined,
      speakMobileFemaleVoice: typeof speakMobileFemaleVoice !== "undefined" ? speakMobileFemaleVoice : undefined,
      toggleVisualCompact: typeof toggleVisualCompact !== "undefined" ? toggleVisualCompact : undefined,
      openPhoneSimulator: typeof openPhoneSimulator !== "undefined" ? openPhoneSimulator : undefined,
      switchPhoneSimView: typeof switchPhoneSimView !== "undefined" ? switchPhoneSimView : undefined,
      closePhoneSimulator: typeof closePhoneSimulator !== "undefined" ? closePhoneSimulator : undefined,
      selectSuperHubCalc: typeof selectSuperHubCalc !== "undefined" ? selectSuperHubCalc : undefined,
      onVisualRawInput: typeof onVisualRawInput !== "undefined" ? onVisualRawInput : undefined,
      onVisualYieldInput: typeof onVisualYieldInput !== "undefined" ? onVisualYieldInput : undefined,
      onVisualProfitInput: typeof onVisualProfitInput !== "undefined" ? onVisualProfitInput : undefined,
      vxSelectVariant: typeof vxSelectVariant !== "undefined" ? vxSelectVariant : undefined,
      updateBatchWeight: typeof updateBatchWeight !== "undefined" ? updateBatchWeight : undefined,
      updateVacuumPiecesCount: typeof updateVacuumPiecesCount !== "undefined" ? updateVacuumPiecesCount : undefined,
      vxSetBatchMode: typeof vxSetBatchMode !== "undefined" ? vxSetBatchMode : undefined,
      vxStepMixCart: typeof vxStepMixCart !== "undefined" ? vxStepMixCart : undefined,
      vxApplyMixPreset: typeof vxApplyMixPreset !== "undefined" ? vxApplyMixPreset : undefined,
      buildCalculatorCardHtml: typeof buildCalculatorCardHtml !== "undefined" ? buildCalculatorCardHtml : undefined,
      renderAll: typeof renderAll !== "undefined" ? renderAll : undefined,
      renderAllImmediate: typeof renderAllImmediate !== "undefined" ? renderAllImmediate : undefined,
      toggleScadaAlarmMute: typeof toggleScadaAlarmMute !== "undefined" ? toggleScadaAlarmMute : undefined,
      switchSpTab: typeof switchSpTab !== "undefined" ? switchSpTab : undefined,
      setSpAimMode: typeof setSpAimMode !== "undefined" ? setSpAimMode : undefined,
      calcSpAim: typeof calcSpAim !== "undefined" ? calcSpAim : undefined,
      calcSpDetector: typeof calcSpDetector !== "undefined" ? calcSpDetector : undefined,
      setSpRescueTab: typeof setSpRescueTab !== "undefined" ? setSpRescueTab : undefined,
      calcSpRescue: typeof calcSpRescue !== "undefined" ? calcSpRescue : undefined,
      calcSpScrap: typeof calcSpScrap !== "undefined" ? calcSpScrap : undefined,
      addSpBatchPrompt: typeof addSpBatchPrompt !== "undefined" ? addSpBatchPrompt : undefined,
      toggleCoLoad: typeof toggleCoLoad !== "undefined" ? toggleCoLoad : undefined,
      handleSlicePhotoUpload: typeof handleSlicePhotoUpload !== "undefined" ? handleSlicePhotoUpload : undefined,
      toggleInlineKeyVisibility: typeof toggleInlineKeyVisibility !== "undefined" ? toggleInlineKeyVisibility : undefined,
      saveGeminiKeyFromInline: typeof saveGeminiKeyFromInline !== "undefined" ? saveGeminiKeyFromInline : undefined,
      clearGeminiKeyFromInline: typeof clearGeminiKeyFromInline !== "undefined" ? clearGeminiKeyFromInline : undefined,
      handleChatPhotoAttach: typeof handleChatPhotoAttach !== "undefined" ? handleChatPhotoAttach : undefined,
      saveGeminiKeyFromModal: typeof saveGeminiKeyFromModal !== "undefined" ? saveGeminiKeyFromModal : undefined,
      testGeminiKeyFromModal: typeof testGeminiKeyFromModal !== "undefined" ? testGeminiKeyFromModal : undefined,
      clearGeminiKeyFromModal: typeof clearGeminiKeyFromModal !== "undefined" ? clearGeminiKeyFromModal : undefined,
      setCloudRoomPreset: typeof setCloudRoomPreset !== "undefined" ? setCloudRoomPreset : undefined,
      generateNewSecureRoomCode: typeof generateNewSecureRoomCode !== "undefined" ? generateNewSecureRoomCode : undefined,
      copyRoomCodeToClipboard: typeof copyRoomCodeToClipboard !== "undefined" ? copyRoomCodeToClipboard : undefined,
      applyCloudRoomCode: typeof applyCloudRoomCode !== "undefined" ? applyCloudRoomCode : undefined,
      toggleCloudAutoSync: typeof toggleCloudAutoSync !== "undefined" ? toggleCloudAutoSync : undefined,
      pushCloudSyncNow: typeof pushCloudSyncNow !== "undefined" ? pushCloudSyncNow : undefined,
      pullCloudSyncNow: typeof pullCloudSyncNow !== "undefined" ? pullCloudSyncNow : undefined,
      saveCloudCustomEndpointUrl: typeof saveCloudCustomEndpointUrl !== "undefined" ? saveCloudCustomEndpointUrl : undefined,
      exportCloudSnapshotFile: typeof exportCloudSnapshotFile !== "undefined" ? exportCloudSnapshotFile : undefined,
      importCloudSnapshotFile: typeof importCloudSnapshotFile !== "undefined" ? importCloudSnapshotFile : undefined,
      openWhatsAppDirect: typeof openWhatsAppDirect !== "undefined" ? openWhatsAppDirect : undefined,
      copyWhatsAppReportText: typeof copyWhatsAppReportText !== "undefined" ? copyWhatsAppReportText : undefined,
      reloadPhoneSimulator: typeof reloadPhoneSimulator !== "undefined" ? reloadPhoneSimulator : undefined,
      openPhoneFullscreen: typeof openPhoneFullscreen !== "undefined" ? openPhoneFullscreen : undefined,
      renderAllSpPanels: typeof renderAllSpPanels !== "undefined" ? renderAllSpPanels : undefined,
      toggleGeminiKeyVisibility: typeof toggleGeminiKeyVisibility !== "undefined" ? toggleGeminiKeyVisibility : undefined,
      isFactInput: typeof isFactInput !== "undefined" ? isFactInput : undefined,
      absorbFactToMemory: typeof absorbFactToMemory !== "undefined" ? absorbFactToMemory : undefined,
      computeWaterLossRate: typeof computeWaterLossRate !== "undefined" ? computeWaterLossRate : undefined,
      startBatchNow: typeof startBatchNow !== "undefined" ? startBatchNow : undefined
    });
  }

