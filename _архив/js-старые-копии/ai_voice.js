// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 6: РЕЧЕВОЙ ШТУРМАН И ИИ-СОВЕТНИК GEMINI (ES Module)
// ==========================================================================

import {
  FISH_SPECIES,
  CURING_STAGES,
  HEAT_RECOVERY_MODES,
  CHAT_MODELS,
  QUICK_QUESTIONS
} from './constants.js';

import {
  state,
  vx,
  triggerHaptic,
  showToast,
  escapeHtml
} from './state.js';

import {
  analyzeBioscience,
  calculateYieldForecast,
  targetTempRangeFor
} from './bioscience.js';

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

    let isGeminiKeyRevealed = false;
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


    // ==================== 9. МОДАЛЬНОЕ ОКНО ONEPLUS 13 PRO, КЛЮЧ GEMINI И PWA ====================
    let deferredPwaPrompt = null;
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        const btn = document.getElementById("btn-pwa-install-native");
        if (btn) btn.style.display = "inline-flex";
      });
    }

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

    // showToast imported from state.js


    // ==================== 🔑 МАСКИРОВАНИЕ GEMINI API КЛЮЧА ====================
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

    function speakCurrentKpiReport() {
      triggerHaptic(15);
      if (typeof speakVoiceReport === "function") {
        speakVoiceReport();
      } else if (typeof speakMobileFemaleVoice === "function") {
        speakMobileFemaleVoice();
      }
    }

export {
  renderChatMessages,
  updateGeminiApiStatusUi,
  sendChatMessage,
  buildPhotoSliceInspectorHtml,
  buildVoiceControlsHtml,
  announcePhaseChangeIfEnabled,
  runAiSlicePhotoInspection,
  toggleGeminiKeyVisibility,
  triggerDeferredPwaInstall,
  requestAiAdvice,
  openGeminiKeyModal,
  closeGeminiKeyModal,
  saveGeminiKeyFromModal,
  clearGeminiKeyFromModal,
  testGeminiKeyFromModal,
  promptApiKey,
  copyCurrentAdvice,
  copyMcgsTable,
  toggleInlineKeyVisibility,
  saveGeminiKeyFromInline,
  clearGeminiKeyFromInline,
  handleChatPhotoAttach,
  clearChatAttachedPhoto,
  onVoiceSelectChange,
  onVoiceRateInput,
  toggleAutoPhaseAnnounce,
  getActiveGeminiApiKey,
  hasGeminiApiKey,
  speakMobileFemaleVoice,
  speakCurrentKpiReport
};

if (typeof window !== "undefined") {
  window.renderChatMessages = renderChatMessages;
  window.updateGeminiApiStatusUi = updateGeminiApiStatusUi;
  window.sendChatMessage = sendChatMessage;
  window.buildPhotoSliceInspectorHtml = buildPhotoSliceInspectorHtml;
  window.buildVoiceControlsHtml = buildVoiceControlsHtml;
  window.announcePhaseChangeIfEnabled = announcePhaseChangeIfEnabled;
  window.runAiSlicePhotoInspection = runAiSlicePhotoInspection;
  window.toggleGeminiKeyVisibility = toggleGeminiKeyVisibility;
  window.triggerDeferredPwaInstall = triggerDeferredPwaInstall;
  window.requestAiAdvice = requestAiAdvice;
  window.openGeminiKeyModal = openGeminiKeyModal;
  window.closeGeminiKeyModal = closeGeminiKeyModal;
  window.saveGeminiKeyFromModal = saveGeminiKeyFromModal;
  window.clearGeminiKeyFromModal = clearGeminiKeyFromModal;
  window.testGeminiKeyFromModal = testGeminiKeyFromModal;
  window.promptApiKey = promptApiKey;
  window.copyCurrentAdvice = copyCurrentAdvice;
  window.copyMcgsTable = copyMcgsTable;
  window.toggleInlineKeyVisibility = toggleInlineKeyVisibility;
  window.saveGeminiKeyFromInline = saveGeminiKeyFromInline;
  window.clearGeminiKeyFromInline = clearGeminiKeyFromInline;
  window.handleChatPhotoAttach = handleChatPhotoAttach;
  window.clearChatAttachedPhoto = clearChatAttachedPhoto;
  window.onVoiceSelectChange = onVoiceSelectChange;
  window.onVoiceRateInput = onVoiceRateInput;
  window.toggleAutoPhaseAnnounce = toggleAutoPhaseAnnounce;
  window.getActiveGeminiApiKey = getActiveGeminiApiKey;
  window.hasGeminiApiKey = hasGeminiApiKey;
  window.speakMobileFemaleVoice = speakMobileFemaleVoice;
  window.speakCurrentKpiReport = speakCurrentKpiReport;
}
