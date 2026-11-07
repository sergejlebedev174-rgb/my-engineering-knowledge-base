/**
 * Jūrmalciems ARM — Interactive Engine & 3D Trolley Enhancer for Stitch 3D Realism SCADA Cockpits
 * Works across profit-cockpit.html, calcs-cockpit.html, console-cockpit.html,
 * advisor-cockpit.html, phases-cockpit.html, and aim-cockpit.html (online & file:///).
 */
(function () {
  "use strict";

  function ensureToast() {
    let t = document.getElementById("stitchGlobalToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "stitchGlobalToast";
      t.style.cssText =
        "position:fixed;bottom:20px;right:20px;z-index:9999;padding:12px 18px;border-radius:12px;background:rgba(9,14,25,0.95);border:1px solid rgba(0,240,255,0.45);color:#dee2f2;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;box-shadow:0 12px 32px rgba(0,0,0,0.7),0 0 18px rgba(0,240,255,0.22);display:flex;align-items:center;gap:10px;transform:translateY(80px);opacity:0;transition:all 0.28s ease;pointer-events:none;";
      t.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#00f0ff;box-shadow:0 0 8px #00f0ff;flex-shrink:0;"></span><span id="stitchGlobalToastText">Готово</span>`;
      document.body.appendChild(t);
    }
    return t;
  }

  let toastTimer = null;
  window.stitchNotify = function (msg) {
    const existingToast = document.getElementById("toast");
    const existingMsg = document.getElementById("toastMsg");
    if (existingToast && existingMsg && typeof window.showToast === "function") {
      window.showToast(msg);
      return;
    }
    const t = ensureToast();
    const txt = document.getElementById("stitchGlobalToastText");
    if (txt) txt.textContent = msg;
    t.style.transform = "translateY(0)";
    t.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.transform = "translateY(80px)";
      t.style.opacity = "0";
    }, 3000);
  };

  function upgradeImagesAndTrolleys() {
    let trolleyUrl = window.__TROLLEY_3D_DATA_URL__ || "trolley-3d.png";
    if (typeof window.getTrolley3DDataUrl === "function" && !window.__TROLLEY_3D_DATA_URL__) {
      window.getTrolley3DDataUrl().then((url) => {
        if (url) {
          document.querySelectorAll("img.trolley-3d-img").forEach((im) => { im.src = url; });
        }
      }).catch(() => {});
    }

    document.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      const alt = (img.getAttribute("alt") || "") + " " + (img.getAttribute("data-alt") || "");
      const altLower = alt.toLowerCase();

      // 1. Logo images
      if (
        src.includes("AEtjO1V9-Rjm2xOT5GrxU3do9rsol") ||
        src.includes("AEtjO1XX1tnsMU46Ha4ioBdzkepx") ||
        altLower.includes("logo")
      ) {
        img.src = "img/brand/fish-icon-192.png";
        img.onerror = function () {
          this.onerror = null;
          this.src = "logo-icon.png";
        };
        return;
      }

      // 2. Trolley 3D renders (разрез камеры не трогаем, даже если в подписи есть «trolleys»)
      const isChamberRender = /chamber-3d|aim-3d/.test(src);
      if (
        !isChamberRender && (
        src.includes("AEtjO1UB2F7X1LhUxt7dsyg_BdDyBIcqUgzB22p8Cl71ukPsnB9") ||
        altLower.includes("тележ") ||
        altLower.includes("трул") ||
        altLower.includes("trolley") ||
        img.classList.contains("trolley-3d-img") ||
        img.hasAttribute("data-trolley-3d"))
      ) {
        img.classList.add("trolley-3d-img");
        img.setAttribute("data-trolley-3d", "1");
        if (typeof trolleyUrl === "string") img.src = trolleyUrl;
        return;
      }

      // 3. Fish Cutaway / Tomography fallback for offline file:///
      if (
        src.includes("AB6AXuADKCpPx7446xNCwynwl3lM3l") ||
        src.includes("AB6AXuDDJGsp9zevMVUr1sluOtUXwn") ||
        altLower.includes("срез") ||
        altLower.includes("рыб")
      ) {
        img.onerror = function () {
          this.onerror = null;
          this.src = "vimba-3d.png";
        };
        return;
      }

      // 4. Chamber 3D Cutaway fallback for offline file:///
      if (src.includes("googleusercontent.com")) {
        img.onerror = function () {
          this.onerror = null;
          this.src = "chamber-3d.png";
        };
      }
    });

    // Inject 3D trolley into empty trolley slots (#10..#15) in calcs-cockpit.html if they only have an icon
    document.querySelectorAll(".trolley-card").forEach((card) => {
      if (!card.querySelector("img") && trolleyUrl) {
        const iconSpan = card.querySelector(".material-symbols-outlined");
        if (iconSpan && iconSpan.parentElement) {
          const holder = iconSpan.parentElement;
          holder.innerHTML = `<img data-trolley-3d="1" class="trolley-3d-img w-10 h-10 rounded object-cover opacity-35 grayscale" src="${trolleyUrl}" alt="Труль AISI 304 (Резерв)"/>`;
        }
      }
    });

    // Inject 3D trolley preview card into phases-cockpit.html and aim-cockpit.html 15 Trolleys sections
    document.querySelectorAll("h2, h3, span").forEach((heading) => {
      const txt = (heading.textContent || "").trim();
      if (
        (txt.includes("МОНОЛИТНАЯ ГЕОМЕТРИЯ (15 ТЕЛЕЖЕК") ||
          txt.includes("Матрица 15 Тележек (3×5)") ||
          txt.includes("Physical Trolley Matrix")) &&
        !heading.dataset.trolleyThumbAdded
      ) {
        heading.dataset.trolleyThumbAdded = "1";
        const badge = document.createElement("img");
        badge.className = "trolley-3d-img";
        badge.setAttribute("data-trolley-3d", "1");
        badge.src = trolleyUrl;
        badge.alt = "3D Труль AISI 304";
        badge.style.cssText =
          "width:34px;height:34px;border-radius:8px;object-fit:cover;border:1px solid rgba(0,240,255,0.45);box-shadow:0 0 10px rgba(0,240,255,0.25);margin-left:8px;vertical-align:middle;display:inline-block;";
        heading.appendChild(badge);
      }
    });

    if (typeof window.applyTrolley3DImages === "function") {
      window.applyTrolley3DImages();
    }
  }

  // Вызов функции главного окна АРМ. Напрямую — если можно; при file:// Chrome это запрещает,
  // тогда шлём команду через postMessage (главное окно выполняет её по белому списку в core-domain.js).
  function callParent(cmd, args) {
    if (window.parent === window) return false;
    try {
      const fn = window.parent[cmd];
      if (typeof fn === "function") { fn.apply(window.parent, args || []); return true; }
    } catch (e) { /* другой origin (file://) — ниже отправим сообщение */ }
    try { window.parent.postMessage({ type: "arm-cmd", cmd: cmd, args: args || [] }, "*"); return true; } catch (e) { return false; }
  }
  window.stitchCallParent = callParent;
  const inApp = window.parent !== window;
  if (inApp) {
    document.documentElement.classList.add("in-arm-iframe");
  }
  const DEMO = " — демо-кнопка: связи с контроллером нет, команда никуда не отправлена";

  function wireInteractiveControls() {
    // 1. Wire Console Cockpit (console-cockpit.html) & AIM Cockpit (aim-cockpit.html) & Advisor (advisor-cockpit.html) buttons
    document.querySelectorAll("button").forEach((btn) => {
      if (btn.getAttribute("onclick") || btn.dataset.stitchWired) return;
      const id = btn.id || "";
      if (
        [
          "btn-mono",
          "btn-mix",
          "btn-write-recipe",
          "winterBtn",
          "summerBtn",
          "vfd-plus",
          "vfd-minus",
          "temp-plus",
          "temp-minus",
          "weight-plus-100",
          "weight-minus-100",
          "btn-copy-table",
          "btn-write-mcgs"
        ].includes(id) ||
        btn.classList.contains("species-chip") ||
        btn.classList.contains("preset-pill") ||
        btn.classList.contains("species-btn") ||
        btn.classList.contains("tab-btn")
      ) {
        return;
      }

      btn.dataset.stitchWired = "1";
      btn.addEventListener("click", function () {
        const label = (btn.textContent || "").replace(/\s+/g, " ").trim();
        if (!label) return;

        // Advisor 5 Module Tabs
        if (/^[1-5]\.\s/.test(label) || label.includes("СУПЕР-РАСЧЕТЧИК") || label.includes("ШАХМАТКА 15 ТРУЛЕЙ")) {
          const siblingBtns = btn.parentElement ? Array.from(btn.parentElement.querySelectorAll("button")) : [];
          siblingBtns.forEach((b) => {
            b.className =
              "px-space-md py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-caps text-label-caps flex items-center gap-2 transition-all";
          });
          btn.className =
            "px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-caps text-label-caps font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all";
          window.stitchNotify("Активен технологический модуль: " + label);
          return;
        }

        const low = label.toLowerCase();
        // Реальные действия главного окна АРМ (через callParent). Вне АРМ — честно говорим, что открыть их негде.
        const viaApp = (cmd, args, okMsg) => {
          if (inApp && callParent(cmd, args)) { if (okMsg) window.stitchNotify(okMsg); }
          else window.stitchNotify("«" + label + "» работает внутри АРМ (index.html)");
        };

        if (low.includes("whatsapp")) { viaApp("openWhatsAppReportModal", [], ""); return; }
        if (low.includes("csv") || low.includes("1c") || low.includes("экспорт")) { viaApp("exportAllBatchLogsCsv", [], "Журнал партии выгружается в CSV-файл"); return; }
        if (low.includes("совет ии")) { viaApp("requestAiAdvice", [], "Запрошен совет ИИ — ответ во вкладке «Советник»"); return; }
        if (low.includes("синхрониз")) { viaApp("openCloudSyncModal", [], ""); return; }
        if (low.includes("parkside")) { viaApp("selectTab", ["hardware"], ""); return; }
        if (/^[−-]\s?0\.2°/.test(label)) { viaApp("ckStepTemp", [-0.2], "Уставка температуры −0.2°C"); return; }
        if (/^\+\s?0\.2°/.test(label)) { viaApp("ckStepTemp", [0.2], "Уставка температуры +0.2°C"); return; }
        if (label === "Дашборд") { viaApp("selectTab", ["scada"], ""); return; }
        if (label === "Экономика") { viaApp("selectTab", ["profit"], ""); return; }
        if (label === "3D Двойник") { viaApp("selectTab", ["scada"], ""); callParent("ckSwitchMainDeck", ["sim3d"]); return; }
        const trolleyNo = label.match(/^#(\d{1,2})\b/);
        if (trolleyNo) { viaApp("ckOpenTrolley3DModal", [parseInt(trolleyNo[1], 10), (label.match(/\[(.+?)\]/) || [])[1] || ""], ""); return; }

        // Копирование — по-настоящему: текст ближайшей карточки в буфер обмена
        if (low.includes("копировать")) {
          const card = btn.closest("section, .rounded-xl, .rounded-lg") || document.body;
          const text = (card.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
          if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => window.stitchNotify("Скопировано в буфер обмена"), () => window.stitchNotify("Браузер не разрешил копирование"));
          return;
        }

        // Режимы сушки — меняют фазу в главном окне (это влияет на расчёты и 3D-двойник)
        if (label.includes("Сушка") || label.includes("30 Hz") || label.includes("30 Гц")) {
          viaApp("setPausePhase", [false], "Режим СУШКИ (30 Гц) включён в АРМ. На контроллер команда не передаётся");
          return;
        }
        if (label.includes("Пауза") || label.includes("18 Hz") || label.includes("18-20 Гц")) {
          viaApp("setPausePhase", [true], "Режим ПАУЗЫ (18 Гц) включён в АРМ. На контроллер команда не передаётся");
          return;
        }
        if (label === "Торговый Дом" || label === "Торг") {
          viaApp("setAppUiMode", ["OWNER"], "Переключено в режим: Торговый Дом");
          return;
        }

        // Аварийный стоп и прочие команды «железу»: связи с контроллером нет — не делаем вид, что сработало
        if (label.toUpperCase().includes("СТОП")) {
          window.stitchNotify("⚠ Аварийный стоп выполняется на щите камеры" + DEMO);
          return;
        }
        window.stitchNotify("«" + label + "»" + DEMO);
      });
    });

    // 2. Sync sliders and species chips in calcs-cockpit.html / phases-cockpit.html / profit-cockpit.html with parent & shared bus
    const rawSlider = document.getElementById("raw-slider") || document.getElementById("input-weight");
    const yieldSlider = document.getElementById("yield-slider");
    let currentStitchSpeciesKey = "VIMBA";
    let isApplyingRemoteStitch = false;

    function pushStitchBatchUpdate() {
      if (isApplyingRemoteStitch) return;
      const rawKg = rawSlider ? (parseFloat(rawSlider.value) || 1850) : 1850;
      const yieldPct = yieldSlider ? (parseFloat(yieldSlider.value) || 61.5) : 61.5;
      callParent("syncBatchFromIframe", [{ speciesKey: currentStitchSpeciesKey, rawKg, yieldPct, switchToScada: false }]);
      if (window.ARM_KB && typeof window.ARM_KB.setSharedBatch === "function") {
        window.ARM_KB.setSharedBatch({
          speciesKey: currentStitchSpeciesKey,
          rawKg,
          yieldPct
        }, "stitch-cockpit");
      }
    }

    if (rawSlider) {
      rawSlider.addEventListener("change", pushStitchBatchUpdate);
      rawSlider.addEventListener("input", pushStitchBatchUpdate);
    }
    if (yieldSlider) {
      yieldSlider.addEventListener("change", pushStitchBatchUpdate);
      yieldSlider.addEventListener("input", pushStitchBatchUpdate);
    }

    function updateStitchTomographyVisuals(c) {
      if (!c) return;
      if (typeof window.setCalcsSpecies === "function") {
        window.setCalcsSpecies(c.key, false);
      }
      const cutImgUrl = `img/vyalka/cut-${c.lowerKey}.jpg`;
      document.querySelectorAll('#tomo-scanner-img, img[src*="vimba-3d"], img[src*="cut-"]').forEach((img) => {
        if (img.closest(".bio-matrix-card") || img.id === "bio-lb-img") return;
        img.src = cutImgUrl;
      });
      const aimBadge = document.getElementById("tomo-aim-code");
      if (aimBadge && typeof window.setCalcsSpecies !== "function") {
        aimBadge.textContent = `${c.key}_CUT.AIM`;
      }
      const advSpBadge = document.getElementById("adv-species-label");
      if (advSpBadge) {
        advSpBadge.textContent = (c.fullRu || c.shortRu || "ВИМБА").toUpperCase();
      }
    }

    document.querySelectorAll(".species-chip").forEach((chip) => {
      chip.addEventListener("click", function () {
        if (!window.ARM_KB || isApplyingRemoteStitch) return;
        const rawKey = chip.getAttribute("data-species") || chip.textContent || "";
        const c = window.ARM_KB.getCanonicalSpecies(rawKey);
        if (!c) return;
        currentStitchSpeciesKey = c.key;
        if (yieldSlider && c.yieldNorm) {
          yieldSlider.value = String(c.yieldNorm);
          yieldSlider.dispatchEvent(new Event("input", { bubbles: true }));
        }
        updateStitchTomographyVisuals(c);
        pushStitchBatchUpdate();
      });
    });

    function applySharedBatchToStitchPage(batch) {
      if (!batch || !window.ARM_KB) return;
      const c = window.ARM_KB.getCanonicalSpecies(batch.speciesKey || "VIMBA");
      if (!c) return;
      currentStitchSpeciesKey = c.key;
      isApplyingRemoteStitch = true;
      try {
        if (rawSlider && batch.rawKg && document.activeElement !== rawSlider) {
          rawSlider.value = String(batch.rawKg);
          rawSlider.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (yieldSlider && batch.yieldPct && document.activeElement !== yieldSlider) {
          yieldSlider.value = String(batch.yieldPct);
          yieldSlider.dispatchEvent(new Event("input", { bubbles: true }));
        }
        // Highlight matching species-chip if present
        const chips = document.querySelectorAll(".species-chip");
        if (chips.length) {
          chips.forEach((chip) => {
            const chipSp = window.ARM_KB.normalizeSpeciesKey(chip.getAttribute("data-species") || chip.textContent || "");
            if (chipSp === c.key) {
              chip.className = "species-chip active px-space-md py-1.5 rounded-lg bg-surface-container-high text-primary-container font-headline-md text-body-md flex items-center gap-space-xs shadow-[0_0_10px_rgba(0,240,255,0.25)] transition-all";
            } else {
              chip.className = "species-chip px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-headline-md text-body-md flex items-center gap-space-xs transition-all";
            }
          });
        }
        // Update header batch code badge (#ЮР-408/К-...)
        document.querySelectorAll("span").forEach((spEl) => {
          const txt = (spEl.textContent || "").trim();
          if (/^#ЮР-\d+\/К-/i.test(txt)) {
            spEl.textContent = `#ЮР-408/К-${c.shortRu.toUpperCase()}`;
          }
        });
        updateStitchTomographyVisuals(c);
      } finally {
        isApplyingRemoteStitch = false;
      }
    }

    if (window.ARM_KB) {
      window.ARM_KB.ready.then(() => {
        const shared = window.ARM_KB.getSharedBatch();
        if (shared && shared.updatedAt > 0) {
          applySharedBatchToStitchPage(shared);
        }
      });
      window.ARM_KB.onBatchChange((batch, source) => {
        if (source === "stitch-cockpit") return;
        applySharedBatchToStitchPage(batch);
      });
    }
  }

  function init() {
    upgradeImagesAndTrolleys();
    wireInteractiveControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("load", upgradeImagesAndTrolleys);
})();
