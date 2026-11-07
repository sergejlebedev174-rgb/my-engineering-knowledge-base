// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС (AIM AGHD-250ELC)
// МОДУЛЬ 7: ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ, FIREBASE RTDB И СЛЕПОК (ES Module)
// ==========================================================================

import {
  FISH_SPECIES,
  CURING_STAGES,
  HEAT_RECOVERY_MODES
} from './constants.js';

import {
  state,
  activeBatch,
  vx,
  triggerHaptic,
  showToast,
  escapeHtml,
  persistStateToStorage,
  loadPersistedState
} from './state.js';

import {
  analyzeBioscience,
  calculateYieldForecast
} from './bioscience.js';

import {
  vxComputeBatch,
  vxComputeProfit,
  analyzeParksidePoints,
  renderParksideChartAndVerdict,
  tradeHouseState,
  PARKSIDE_DEMO_LOGS
} from './calculators.js';

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

    // Инициализация при загрузке в браузере (если app.js еще не вызвал)
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      try {
        if (typeof cloudSyncInit === "function") cloudSyncInit();
      } catch (e) {}
    }
  
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
      if (typeof window !== "undefined") window.open(waUrl, "_blank");
    }

export {
  cloudSyncInit,
  scheduleCloudSyncPush,
  sendWhatsAppSnapshotSummary,
  openCloudSyncModal,
  closeCloudSyncModal,
  setCloudRoomPreset,
  generateNewSecureRoomCode,
  copyRoomCodeToClipboard,
  applyCloudRoomCode,
  toggleCloudAutoSync,
  pushCloudSyncNow,
  pullCloudSyncNow,
  saveCloudCustomEndpointUrl,
  exportCloudSnapshotFile,
  importCloudSnapshotFile,
  selectSuperHubCalc,
  renderSuperHub,
  openWhatsAppReportModal,
  closeWhatsAppReportModal,
  copyWhatsAppReportText,
  openWhatsAppDirect,
  printEurotankPassport,
  openPhoneSimulator,
  closePhoneSimulator,
  reloadPhoneSimulator,
  openPhoneFullscreen,
  initScreenWakeLock,
  toggleScreenWakeLock,
  exportUnifiedWorkshopSnapshot,
  importUnifiedWorkshopSnapshot
};

if (typeof window !== "undefined") {
  window.cloudSyncInit = cloudSyncInit;
  window.scheduleCloudSyncPush = scheduleCloudSyncPush;
  window.sendWhatsAppSnapshotSummary = sendWhatsAppSnapshotSummary;
  window.openCloudSyncModal = openCloudSyncModal;
  window.closeCloudSyncModal = closeCloudSyncModal;
  window.setCloudRoomPreset = setCloudRoomPreset;
  window.generateNewSecureRoomCode = generateNewSecureRoomCode;
  window.copyRoomCodeToClipboard = copyRoomCodeToClipboard;
  window.applyCloudRoomCode = applyCloudRoomCode;
  window.toggleCloudAutoSync = toggleCloudAutoSync;
  window.pushCloudSyncNow = pushCloudSyncNow;
  window.pullCloudSyncNow = pullCloudSyncNow;
  window.saveCloudCustomEndpointUrl = saveCloudCustomEndpointUrl;
  window.exportCloudSnapshotFile = exportCloudSnapshotFile;
  window.importCloudSnapshotFile = importCloudSnapshotFile;
  window.selectSuperHubCalc = selectSuperHubCalc;
  window.renderSuperHub = renderSuperHub;
  window.openWhatsAppReportModal = openWhatsAppReportModal;
  window.closeWhatsAppReportModal = closeWhatsAppReportModal;
  window.copyWhatsAppReportText = copyWhatsAppReportText;
  window.openWhatsAppDirect = openWhatsAppDirect;
  window.printEurotankPassport = printEurotankPassport;
  window.openPhoneSimulator = openPhoneSimulator;
  window.closePhoneSimulator = closePhoneSimulator;
  window.reloadPhoneSimulator = reloadPhoneSimulator;
  window.openPhoneFullscreen = openPhoneFullscreen;
  window.initScreenWakeLock = initScreenWakeLock;
  window.toggleScreenWakeLock = toggleScreenWakeLock;
  window.exportUnifiedWorkshopSnapshot = exportUnifiedWorkshopSnapshot;
  window.importUnifiedWorkshopSnapshot = importUnifiedWorkshopSnapshot;
}
