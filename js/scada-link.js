// АРМ ↔ SCADA-мост Modbus (scada-bridge/server.js). Браузер сам не умеет говорить Modbus TCP,
// поэтому данные идут через локальный сервер: поток /api/stream (SSE) + команды POST.
// Пока моста нет — значок «Modbus: нет связи», программа работает как раньше (ручной ввод).
(function () {
  "use strict";
  const URL_KEY = "JURMALCIEMS_SCADA_URL", TOKEN_KEY = "JURMALCIEMS_SCADA_TOKEN", LIVE_KEY = "JURMALCIEMS_SCADA_LIVE";
  const ls = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  let base = ls(URL_KEY, "http://localhost:8787").replace(/\/+$/, "");
  let snap = null, online = false, es = null, recipes = [], lastRender = 0, open = false;

  const css = `
  .scl-pill{position:fixed;left:14px;bottom:14px;z-index:9000;display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;cursor:pointer;
    font:700 11.5px var(--font-mono,ui-monospace,monospace);color:#CBD5E1;background:rgba(7,10,18,.92);border:1px solid rgba(148,163,184,.3);box-shadow:0 8px 24px rgba(0,0,0,.6);backdrop-filter:blur(8px)}
  .scl-pill i{width:9px;height:9px;border-radius:50%;background:#64748B}
  .scl-pill.on i{background:#2DD4BF;box-shadow:0 0 10px #2DD4BF;animation:sclPulse 2s infinite}
  .scl-pill.alarm{border-color:#F87171;color:#FECACA;animation:sclBlink 1s steps(2) infinite}.scl-pill.alarm i{background:#F87171;box-shadow:0 0 12px #F87171}
  @keyframes sclPulse{50%{opacity:.45}}@keyframes sclBlink{50%{background:rgba(127,29,29,.9)}}
  .scl-panel{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);z-index:9500;overflow:auto;padding:16px;color:#E2E8F0;
    background:linear-gradient(165deg,#0D1322,#060910);border-left:1px solid rgba(56,189,248,.35);box-shadow:-20px 0 60px rgba(0,0,0,.7);
    transform:translateX(105%);transition:transform .35s cubic-bezier(.16,1,.3,1);font:13px/1.45 "Segoe UI",system-ui,sans-serif}
  .scl-panel.open{transform:none}
  .scl-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.scl-h b{font-size:16px}
  .scl-x{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#CBD5E1;border-radius:9px;width:32px;height:32px;cursor:pointer}
  .scl-sec{margin:14px 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#38BDF8}
  .scl-box{background:#070A12;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px}
  .scl-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.scl-grid div{background:#070A12;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:6px 9px}
  .scl-grid span{display:block;font-size:10px;color:#64748B}.scl-grid b{font:800 15px var(--font-mono,ui-monospace,monospace)}.scl-grid em{font-style:normal;font-size:10px;color:#475569}
  .scl-btn{cursor:pointer;border-radius:10px;padding:8px 12px;font-weight:800;font-size:12px;border:1px solid rgba(56,189,248,.5);background:rgba(56,189,248,.12);color:#7DD3FC;margin:0 6px 6px 0}
  .scl-btn.a{border-color:rgba(245,158,11,.55);background:rgba(245,158,11,.12);color:#FCD34D}.scl-btn.r{border-color:rgba(248,113,113,.55);background:rgba(248,113,113,.1);color:#FCA5A5}
  .scl-btn.on{background:linear-gradient(135deg,#2563EB,#0EA5B7);color:#fff;border-color:#7DD3FC}
  .scl-alarm{border:1px solid #F87171;background:rgba(127,29,29,.35);border-radius:10px;padding:7px 10px;margin-bottom:6px;font-size:12.5px}
  .scl-alarm.warn{border-color:#F59E0B;background:rgba(120,53,15,.35)}
  .scl-phase{font:800 22px var(--font-mono,ui-monospace,monospace)}.scl-phase.WORK{color:#22D3EE}.scl-phase.PAUSE{color:#FBBF24}.scl-phase.DEFROST{color:#F87171}.scl-phase.HOLD{color:#A78BFA}
  .scl-prog{height:6px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;margin:8px 0}.scl-prog i{display:block;height:100%;background:linear-gradient(90deg,#2563EB,#22D3EE,#FBBF24)}
  .scl-ev{font:11px var(--font-mono,ui-monospace,monospace);color:#94A3B8;border-bottom:1px solid rgba(255,255,255,.04);padding:3px 0}
  .scl-in{width:100%;background:#050810;border:1px solid rgba(148,163,184,.3);color:#E2E8F0;border-radius:8px;padding:7px 9px;font:600 13px ui-monospace,monospace}
  .scl-note{font-size:11.5px;color:#94A3B8;line-height:1.45}.scl-note b{color:#E2E8F0}
  select.scl-in{margin-bottom:6px}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const pill = document.createElement("div");
  pill.className = "scl-pill"; pill.title = "Пульт Modbus (SCADA-мост)";
  pill.innerHTML = '<i></i><span>Modbus: нет связи</span>';
  const panel = document.createElement("div");
  panel.className = "scl-panel";
  const attach = () => { if (!document.body) return setTimeout(attach, 50); document.body.appendChild(pill); document.body.appendChild(panel); };
  attach();
  pill.onclick = () => { open = !open; panel.classList.toggle("open", open); render(); };

  function api(path, body) {
    return fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", "X-Arm-Token": ls(TOKEN_KEY, "") }, body: JSON.stringify(body || {}) })
      .then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error); if (j.serverTime) { snap = j; render(); } return j; });
  }
  const fail = (e) => window.showToast ? window.showToast("⚠️ Modbus: " + e.message) : alert(e.message);

  function connect() {
    if (es) es.close();
    try { es = new EventSource(base + "/api/stream"); } catch (e) { return; }
    es.onmessage = (ev) => { online = true; try { snap = JSON.parse(ev.data); } catch (e) { return; } applyLive(); render(); };
    es.onerror = () => { online = false; render(); };
    fetch(base + "/api/recipes").then((r) => r.json()).then((r) => { recipes = r; render(); }).catch(() => {});
  }

  // живые данные → телеметрия программы (только датчики, у которых задан адрес)
  function applyLive() {
    if (!snap || ls(LIVE_KEY, "1") !== "1") return;
    const S = window.state, t = S && S.telemetry;
    if (!t) return;
    const r = snap.readings || {};
    const ok = (v) => Number.isFinite(v);
    if (ok(r.dryTemp)) t.environmentTempC = Math.round(r.dryTemp * 10) / 10;
    if (ok(r.dryHumi) && r.dryHumi >= 0 && r.dryHumi <= 100) t.parksideRhPercent = Math.round(r.dryHumi);
    if (ok(r.dehumicoil1)) t.dehumicoilTempC = Math.round(r.dehumicoil1 * 10) / 10;
    if (ok(r.eev1)) t.eev1Steps = Math.round(r.eev1);
    if (snap.batch) {
      t.isPausePhaseNow = snap.batch.phase !== "WORK";
      t.cantoniFrequencyHz = snap.batch.targets.hz;
      // главная «Цикл партии» считает время от того же старта
      try { localStorage.setItem("JURMALCIEMS_CYCLE_START_V1", String(snap.batch.startedAt - snap.batch.shiftMs)); } catch (e) {}
    }
    t.liveSource = "modbus";
    if (Date.now() - lastRender > 15000) {
      lastRender = Date.now();
      if (typeof window.renderAll === "function") window.renderAll();
      if (typeof window.ckHomeRefresh === "function") window.ckHomeRefresh();
    }
  }

  const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d == null ? 1 : d) : "—");
  const hm = (min) => (min == null ? "∞" : min >= 60 ? `${Math.floor(min / 60)} ч ${String(min % 60).padStart(2, "0")} мин` : `${min} мин`);
  const PH = { WORK: "РАБОТА • сушка", PAUSE: "ПАУЗА • отдых", DEFROST: "ОТТАЙКА", HOLD: "УДЕРЖАНИЕ" };

  function render() {
    const alarm = snap && snap.alarms && snap.alarms.some((a) => a.level === "crit");
    pill.className = "scl-pill" + (online && snap && snap.link.connected ? " on" : "") + (alarm ? " alarm" : "");
    pill.querySelector("span").textContent = !online ? "Modbus: нет моста" : !snap.link.connected ? "Modbus: нет шлюза" : alarm ? "Modbus: ТРЕВОГА" : snap.batch ? `Modbus • ${PH[snap.batch.phase] || snap.batch.phase}` : "Modbus: связь";
    if (!open) return;
    if (!online || !snap) {
      panel.innerHTML = `<div class="scl-h"><b>Пульт Modbus</b><button class="scl-x" data-x>✕</button></div>
        <div class="scl-box scl-note">Мост не отвечает по адресу <b>${base}</b>.<br>На компьютере в комнате мастера запустите <b>scada-bridge\\start-scada.bat</b>. Без моста программа работает как раньше — на ручном вводе.</div>
        <div class="scl-sec">Адрес моста</div><input class="scl-in" data-url value="${base}"/>
        <div class="scl-sec">Токен (если задан в config.json)</div><input class="scl-in" data-tok value="${ls(TOKEN_KEY, "")}"/>
        <p><button class="scl-btn" data-save>Подключить</button></p>`;
      return bind();
    }
    const s = snap, b = s.batch, r = s.readings || {}, m = (s.mapped && s.mapped.plc && s.mapped.plc.read) || {};
    const cell = (k, label, unit, d) => `<div><span>${label}</span><b>${m[k] === false ? "—" : fmt(r[k], d)}${m[k] === false ? "" : unit}</b>${m[k] === false ? "<em>адрес не задан</em>" : ""}</div>`;
    const unmappedW = Object.entries(s.mapped || {}).flatMap(([d, x]) => Object.entries(x.write || {}).filter(([, v]) => !v).map(([k]) => `${d}.${k}`));
    panel.innerHTML = `
      <div class="scl-h"><b>Пульт Modbus • камера AIM</b><button class="scl-x" data-x>✕</button></div>
      <div class="scl-note">Шлюз ${s.link.host}:${s.link.port} • ${s.link.connected ? '<b style="color:#2DD4BF">связь есть</b>' : '<b style="color:#F87171">нет связи</b>'} • запись в ПЛК ${s.writeEnabled ? '<b style="color:#FBBF24">включена</b>' : "выключена"}</div>
      ${unmappedW.length ? `<div class="scl-alarm warn">Не заданы адреса записи: ${unmappedW.join(", ")} — эти уставки мост не отправляет. Найдите их на странице «Поиск регистров».</div>` : ""}
      ${(s.alarms || []).map((a) => `<div class="scl-alarm ${a.level}">${a.level === "crit" ? "🚨" : "⚠️"} ${a.text}</div>`).join("")}
      <div class="scl-sec">Партия (таймер на сервере — закрытие браузера его не сбивает)</div>
      <div class="scl-box">${b ? `
        <div style="font-weight:800">${b.recipeName}</div>
        <div class="scl-note">${b.stageName}${b.cycleNo ? ` • цикл ${b.cycleNo}` : ""}</div>
        <div class="scl-phase ${b.phase}">${PH[b.phase] || b.phase}</div>
        <div class="scl-note">до смены фазы: <b>${hm(b.phaseLeftMin)}</b> • уставки: <b>${b.targets.tempC}°C • Humi ${b.targets.humi}% • ${b.targets.hz} Гц</b>${b.targets.manual ? " • ручная фаза" : ""}${b.targets.manualHz ? " • ручная частота" : ""}</div>
        <div class="scl-prog"><i style="width:${Math.min(100, b.elapsedH / b.totalH * 100).toFixed(1)}%"></i></div>
        <div class="scl-note">${b.elapsedH.toFixed(1)} ч из ${b.totalH} ч • старт ${new Date(b.startedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${b.finished ? " • рецепт пройден, удержание" : ""}</div>
        <p style="margin:8px 0 0"><button class="scl-btn" data-shift="-1">−1 ч</button><button class="scl-btn" data-shift="1">+1 ч</button><button class="scl-btn r" data-stop>Стоп партии</button></p>`
      : `<select class="scl-in" data-rec>${recipes.map((x) => `<option value="${x.id}">${x.name}</option>`).join("")}</select>
        <button class="scl-btn on" data-start>▶ Старт партии по рецепту</button>
        <div class="scl-note">Перед стартом на панели MCGS: <b>Фаза 1, Time 999 ч, Dehumi(m) = 0, PauseD(m) = 60</b> — тогда при Humi 95% компрессор стоит всю паузу (правило чистой паузы).</div>`}</div>
      ${b ? `<div class="scl-sec">Ручное управление</div><div class="scl-box">
        <button class="scl-btn ${b.targets.manual && b.phase === "WORK" ? "on" : ""}" data-ph="WORK">Сушка 30 мин</button><button class="scl-btn a ${b.targets.manual && b.phase === "PAUSE" ? "on" : ""}" data-ph="PAUSE">Пауза 30 мин</button><button class="scl-btn" data-ph="AUTO">По рецепту</button>
        <div class="scl-note" style="margin-top:6px">Частота Cantoni (оба Hapn): <b data-hzv>${b.targets.hz} Гц</b> — только 15–30 Гц, без реверса</div>
        <input type="range" min="15" max="30" step="0.5" value="${b.targets.hz}" data-hz style="width:100%"/>
        <button class="scl-btn" data-hzauto>Частота по рецепту</button>${s.overrides && s.overrides.defrostUntil > Date.now() ? '<button class="scl-btn r" data-defr>Прервать оттайку</button>' : ""}
      </div>` : ""}
      <div class="scl-sec">Датчики ПЛК</div>
      <div class="scl-grid">${cell("dryTemp", "Dry temp (камера)", "°C")}${cell("dryHumi", "Dry humi", "%", 0)}${cell("dehumicoil1", "1#Dehumicoil", "°C")}${cell("dehumicoil2", "2#Dehumicoil", "°C")}${cell("exhaust", "Exhaust", "°C")}${cell("environment", "Environment (цех)", "°C")}${cell("eev1", "1#EEV", " st", 0)}${cell("eev2", "2#EEV", " st", 0)}</div>
      <div class="scl-note" style="margin-top:4px">OutTemp и 2#Outcoil неисправны — не читаются.</div>
      <div class="scl-sec">Журнал моста</div>
      <div class="scl-box">${(s.events || []).slice(0, 14).map((e) => `<div class="scl-ev">${new Date(e.at).toLocaleTimeString("ru-RU")} ${e.kind} ${e.text}</div>`).join("")}</div>
      <p class="scl-note"><a href="${base}/scanner" target="_blank" style="color:#7DD3FC">Поиск регистров (сканер / сниффер) →</a> • <label><input type="checkbox" data-live ${ls(LIVE_KEY, "1") === "1" ? "checked" : ""}/> подставлять живые данные в программу</label></p>`;
    bind();
  }

  function bind() {
    const q = (s) => panel.querySelector(s);
    const x = q("[data-x]"); if (x) x.onclick = () => { open = false; panel.classList.remove("open"); };
    const sv = q("[data-save]"); if (sv) sv.onclick = () => { base = q("[data-url]").value.trim().replace(/\/+$/, ""); try { localStorage.setItem(URL_KEY, base); localStorage.setItem(TOKEN_KEY, q("[data-tok]").value.trim()); } catch (e) {} connect(); };
    const stt = q("[data-start]"); if (stt) stt.onclick = () => {
      const id = q("[data-rec]").value, name = (recipes.find((r) => r.id === id) || {}).name;
      if (confirm(`Запустить партию «${name}»?\nМост начнёт записывать уставки Temp / Humi и частоту в ПЛК и частотники.`)) api("/api/batch/start", { recipeId: id }).catch(fail);
    };
    const stp = q("[data-stop]"); if (stp) stp.onclick = () => { if (confirm("Остановить партию? Мост перестанет управлять, MCGS останется на последних записанных уставках.")) api("/api/batch/stop").catch(fail); };
    panel.querySelectorAll("[data-shift]").forEach((el) => (el.onclick = () => api("/api/batch/shift", { hours: Number(el.dataset.shift) }).catch(fail)));
    panel.querySelectorAll("[data-ph]").forEach((el) => (el.onclick = () => api("/api/override/phase", { phase: el.dataset.ph, minutes: 30 }).catch(fail)));
    const hz = q("[data-hz]"); if (hz) { hz.oninput = () => (q("[data-hzv]").textContent = hz.value + " Гц"); hz.onchange = () => api("/api/override/hz", { hz: Number(hz.value), minutes: 60 }).catch(fail); }
    const ha = q("[data-hzauto]"); if (ha) ha.onclick = () => api("/api/override/hz", { hz: "AUTO" }).catch(fail);
    const df = q("[data-defr]"); if (df) df.onclick = () => api("/api/defrost/cancel").catch(fail);
    const lv = q("[data-live]"); if (lv) lv.onchange = () => { try { localStorage.setItem(LIVE_KEY, lv.checked ? "1" : "0"); } catch (e) {} };
  }

  // кнопки главного экрана: при живом мосте ±1 ч сдвигает таймер на сервере, ▶ открывает выбор рецепта
  function wrap() {
    if (typeof window.ckCycleShift === "function" && !window.ckCycleShift.__scl) {
      const orig = window.ckCycleShift;
      window.ckCycleShift = function (h) { if (online && snap && snap.batch) return api("/api/batch/shift", { hours: h }).catch(fail); return orig.apply(this, arguments); };
      window.ckCycleShift.__scl = true;
    }
    if (typeof window.ckCycleStart === "function" && !window.ckCycleStart.__scl) {
      const orig = window.ckCycleStart;
      window.ckCycleStart = function () { if (online && snap && snap.link) { open = true; panel.classList.add("open"); return render(); } return orig.apply(this, arguments); };
      window.ckCycleStart.__scl = true;
    }
  }
  setInterval(wrap, 2000);
  window.ArmScada = { get snap() { return snap; }, get online() { return online; }, open: () => { open = true; panel.classList.add("open"); render(); }, api };
  connect();
})();
