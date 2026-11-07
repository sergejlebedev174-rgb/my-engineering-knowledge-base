// АРМ Юрмалциемс • SCADA-мост Modbus (Node.js, без внешних библиотек).
// Запуск: node server.js   (или start-scada.bat — с автоперезапуском)
// API для index.html: http://<host>:8787/api/... • поток данных: /api/stream (Server-Sent Events)
// Страница поиска регистров: http://<host>:8787/scanner
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { ModbusClient } = require("./modbus");
const { Sniffer } = require("./sniffer");
const S = require("./scheduler");

const DIR = __dirname;
const argCfg = process.argv.find((a) => a.startsWith("--config="));
const CFG_FILE = argCfg ? path.resolve(argCfg.slice(9)) : (fs.existsSync(path.join(DIR, "config.json")) ? path.join(DIR, "config.json") : path.join(DIR, "config.example.json"));
const cfg = JSON.parse(fs.readFileSync(CFG_FILE, "utf8"));
const recipes = JSON.parse(fs.readFileSync(path.join(DIR, "recipes.json"), "utf8")).recipes;
const STATE_FILE = path.join(DIR, "state.json");
const LOG_DIR = path.join(DIR, "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// ---------- состояние (переживает перезапуск) ----------
let state = { batch: null, overrides: {}, lastApplied: null, lastAppliedAt: 0 };
try { state = Object.assign(state, JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))); } catch (e) {}
function save() { try { fs.writeFileSync(STATE_FILE + ".tmp", JSON.stringify(state, null, 1)); fs.renameSync(STATE_FILE + ".tmp", STATE_FILE); } catch (e) { log("ERR", "state.json: " + e.message); } }
setInterval(save, 30000);

const readings = {};       // последние значения датчиков
const readMeta = {};       // время и ошибки по каждому каналу
const alarms = [];         // активные тревоги {code, level, text, since}
const events = [];         // журнал событий для интерфейса
const prot = { coldSince: 0 };

function log(kind, text) {
  const line = `${new Date().toISOString()} ${kind} ${text}`;
  console.log(line);
  events.unshift({ at: Date.now(), kind, text });
  if (events.length > 200) events.length = 200;
  try { fs.appendFileSync(path.join(LOG_DIR, `events-${new Date().toISOString().slice(0, 10)}.log`), line + "\n"); } catch (e) {}
}

// ---------- Modbus ----------
// gateway.host — только IP шлюза Delock (например 192.168.8.60), без http:// и без :порта
(function checkGatewayHost() {
  let h = String(cfg.gateway.host || "").trim().replace(/^[a-z]+:\/\//i, "").replace(/\/.*$/, "");
  const m = h.match(/^(.+):(\d+)$/);
  if (m) { h = m[1]; console.log(`ВНИМАНИЕ: в gateway.host был указан порт — использую host ${h}, порт берётся из gateway.port (${cfg.gateway.port})`); }
  const self = (h === "127.0.0.1" || h === "localhost") && (!m || Number(m[2]) === cfg.http.port);
  if (self) console.log("ОШИБКА В config.json: gateway.host указывает на сам мост (127.0.0.1). Нужен IP шлюза Delock в сети цеха — его видно в MikroTik (IP → DHCP Server → Leases).");
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) console.log(`ВНИМАНИЕ: gateway.host «${h}» не похож на IP-адрес. Впишите IP шлюза Delock, например 192.168.8.60.`);
  cfg.gateway.host = h;
})();
const mb = new ModbusClient(cfg.gateway);
// одинаковую ошибку связи не печатаем каждые 3 с — только при смене причины и раз в минуту
let lastLinkMsg = "", lastLinkAt = 0;
mb.on("status", (ok, why) => {
  const msg = ok ? `шлюз ${cfg.gateway.host}:${cfg.gateway.port} подключен (${cfg.gateway.mode})` : `шлюз отключен: ${why || ""}`;
  if (ok || msg !== lastLinkMsg || Date.now() - lastLinkAt > 60000) { log("LINK", msg); lastLinkMsg = msg; lastLinkAt = Date.now(); }
});
mb.connect();
let sniffer = cfg.sniffer && cfg.sniffer.port ? new Sniffer(cfg.sniffer) : null;

const DEV = cfg.devices || {};
function decode(raw, ch) {
  let v = raw;
  if (ch.signed && v > 32767) v -= 65536;
  return v / (ch.scale || 1);
}
function encode(value, ch) {
  let v = Math.round(value * (ch.scale || 1));
  return v < 0 ? v + 65536 : v;
}

async function poll() {
  for (const [devName, dev] of Object.entries(DEV)) {
    for (const [key, ch] of Object.entries(dev.read || {})) {
      if (ch.address == null) continue;
      const id = devName === "plc" ? key : `${devName}.${key}`;
      try {
        const [raw] = await mb.readRegisters(dev.unit, ch.fc || 3, ch.address, 1);
        readings[id] = decode(raw, ch);
        readMeta[id] = { at: Date.now(), raw, err: null };
      } catch (e) {
        readMeta[id] = Object.assign(readMeta[id] || {}, { err: e.message, errAt: Date.now() });
      }
    }
  }
}

// ---------- запись уставок ----------
async function writeChannel(devName, key, value) {
  const dev = DEV[devName];
  const ch = dev && dev.write && dev.write[key];
  if (!ch || ch.address == null) return { skipped: "адрес не задан в config.json" };
  if (!cfg.writeEnabled) { log("DRY", `${devName}.${key} = ${value} (writeEnabled=false — не отправлено)`); return { skipped: "writeEnabled=false" }; }
  await mb.writeSingle(dev.unit, ch.address, encode(value, ch));
  return { ok: true };
}

async function applyTargets(t, why) {
  const L = cfg.limits;
  if (!(t.hz >= L.hzMin && t.hz <= L.hzMax)) throw new Error("частота вне пределов " + t.hz);
  const jobs = [["plc", "setTemp", t.tempC], ["plc", "setHumi", t.humi], ["vfd1", "freqSet", t.hz], ["vfd2", "freqSet", t.hz]];
  const res = {};
  for (const [d, k, v] of jobs) {
    try { res[`${d}.${k}`] = await writeChannel(d, k, v); }
    catch (e) { res[`${d}.${k}`] = { error: e.message }; raise("WRITE_" + d + k, "crit", `Запись ${d}.${k} = ${v} не прошла: ${e.message}`); }
  }
  state.lastApplied = { phase: t.phase, tempC: t.tempC, humi: t.humi, hz: t.hz };
  state.lastAppliedAt = Date.now();
  log("WRITE", `${why}: ${t.phase} • Temp ${t.tempC}°C • Humi ${t.humi}% • ${t.hz} Гц → ${Object.entries(res).map(([k, r]) => `${k}:${r.ok ? "ok" : r.skipped ? "—" : "ОШИБКА"}`).join(" ")}`);
  save();
  return res;
}

// ---------- тревоги ----------
function raise(code, level, text) {
  const a = alarms.find((x) => x.code === code);
  if (a) { a.text = text; a.lastAt = Date.now(); return; }
  alarms.push({ code, level, text, since: Date.now(), lastAt: Date.now() });
  log(level === "crit" ? "ALARM" : "WARN", text);
  if (level === "crit") notify(`🚨 Юрмалциемс: ${text}`);
}
function clearAlarm(code) {
  const i = alarms.findIndex((x) => x.code === code);
  if (i >= 0) { log("OK", "снята тревога: " + alarms[i].text); alarms.splice(i, 1); }
}
let lastNotify = 0;
function notify(text) {
  const tg = cfg.telegram || {};
  if (!tg.botToken || !tg.chatId) return;
  if (Date.now() - lastNotify < 60000) return; // не чаще раза в минуту
  lastNotify = Date.now();
  const body = JSON.stringify({ chat_id: tg.chatId, text });
  const req = https.request({ host: "api.telegram.org", path: `/bot${tg.botToken}/sendMessage`, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } });
  req.on("error", (e) => log("ERR", "Telegram: " + e.message));
  req.end(body);
}

// ---------- главный цикл ----------
function currentRecipe() { return state.batch && recipes.find((r) => r.id === state.batch.recipeId); }
function batchView() {
  const r = currentRecipe();
  if (!r) return null;
  const elapsed = Date.now() - state.batch.startedAt + (state.batch.shiftMs || 0);
  const pos = S.position(r, elapsed);
  const t = S.targets(r, pos, cfg, state.overrides);
  return { recipeId: r.id, recipeName: r.name, startedAt: state.batch.startedAt, shiftMs: state.batch.shiftMs || 0, elapsedH: elapsed / S.H, totalH: S.recipeTotalH(r),
    stageIndex: pos.stageIndex, stageName: pos.stage.name, stages: r.stages.map((s) => ({ name: s.name, hours: s.hours })),
    phase: t.phase, phaseLeftMin: Number.isFinite(pos.phaseLeftH) ? Math.round(pos.phaseLeftH * 60) : null, cycleNo: pos.cycleNo || null, finished: !!pos.finished,
    targets: t, pos };
}

async function tick() {
  // связь
  const lastOk = mb.stats.lastOkAt;
  const anyMapped = Object.values(DEV).some((d) => Object.values(d.read || {}).some((c) => c.address != null));
  if (anyMapped && (!lastOk || Date.now() - lastOk > cfg.protection.commLossAlarmSec * 1000)) raise("COMM", "crit", `Нет ответа от ПЛК/частотников более ${cfg.protection.commLossAlarmSec} с (шлюз ${cfg.gateway.host})`);
  else clearAlarm("COMM");

  const bv = batchView();
  const found = S.protect(readings, cfg, prot, state.overrides, bv && bv.pos);
  ["DEFROST", "OVERHEAT", "HUMI_FAULT"].forEach((c) => { const f = found.find((a) => a.code === c); if (f) raise(c, f.level, f.text); else if (c !== "DEFROST" || !(state.overrides.defrostUntil > Date.now())) clearAlarm(c); });

  if (!bv) return;
  const t = bv.targets;
  const la = state.lastApplied;
  const changed = !la || la.phase !== t.phase || la.tempC !== t.tempC || la.humi !== t.humi || la.hz !== t.hz;
  const stale = Date.now() - state.lastAppliedAt > (cfg.reassertMinutes || 10) * 60000;
  if (changed || stale) {
    try { await applyTargets(t, changed ? `смена: ${bv.stageName}` : "подтверждение уставок"); }
    catch (e) { raise("APPLY", "crit", "Уставки не применены: " + e.message); }
  }
}

let busyLoop = false;
async function loop() {
  if (busyLoop) return;
  busyLoop = true;
  try { await poll(); await tick(); journal(); broadcast(); } catch (e) { log("ERR", e.stack || e.message); }
  busyLoop = false;
}
setInterval(loop, Math.max(2000, cfg.gateway.pollIntervalMs || 5000));
setTimeout(loop, 1500);

let lastJournal = 0;
function journal() {
  if (Date.now() - lastJournal < 60000) return;
  lastJournal = Date.now();
  const f = path.join(LOG_DIR, `readings-${new Date().toISOString().slice(0, 10)}.csv`);
  const keys = ["dryTemp", "dryHumi", "environment", "exhaust", "dehumicoil1", "dehumicoil2", "eev1", "eev2", "vfd1.freqOut", "vfd2.freqOut"];
  if (!fs.existsSync(f)) fs.writeFileSync(f, "time;" + keys.join(";") + ";phase;setTemp;setHumi;setHz\n");
  const la = state.lastApplied || {};
  const bv = batchView();
  fs.appendFileSync(f, [new Date().toISOString(), ...keys.map((k) => (readings[k] ?? "")), bv ? bv.phase : "", la.tempC ?? "", la.humi ?? "", la.hz ?? ""].join(";") + "\n");
}

// ---------- HTTP: REST + SSE ----------
const clients = new Set();
function snapshot() {
  const bv = batchView();
  if (bv) delete bv.pos;
  return {
    serverTime: Date.now(), link: { connected: mb.connected, host: cfg.gateway.host, port: cfg.gateway.port, mode: cfg.gateway.mode, stats: mb.stats },
    writeEnabled: !!cfg.writeEnabled, readings, readMeta, batch: bv, lastApplied: state.lastApplied, lastAppliedAt: state.lastAppliedAt,
    overrides: state.overrides, alarms, events: events.slice(0, 40), limits: cfg.limits,
    mapped: Object.fromEntries(Object.entries(DEV).map(([d, dev]) => [d, { read: Object.fromEntries(Object.entries(dev.read || {}).map(([k, c]) => [k, c.address != null])), write: Object.fromEntries(Object.entries(dev.write || {}).map(([k, c]) => [k, c.address != null])) }])),
  };
}
function broadcast() {
  const msg = `data: ${JSON.stringify(snapshot())}\n\n`;
  clients.forEach((res) => { try { res.write(msg); } catch (e) {} });
}

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((ok) => { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { ok({}); } }); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,X-Arm-Token" });
    return res.end();
  }
  const p = url.pathname;
  // токен обязателен для команд, если задан в config.json (нужно при доступе не с этого компьютера)
  const token = cfg.http && cfg.http.apiToken;
  if (req.method === "POST" && token && req.headers["x-arm-token"] !== token && url.searchParams.get("token") !== token) return send(res, 401, { error: "нужен токен X-Arm-Token" });
  try {
    if (p === "/" || p === "/scanner") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(fs.readFileSync(path.join(DIR, "scanner.html")));
    }
    if (p === "/api/state") return send(res, 200, snapshot());
    if (p === "/api/recipes") return send(res, 200, recipes);
    if (p === "/api/stream") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": "*" });
      res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    if (req.method !== "POST") return send(res, 404, { error: "нет такого адреса" });
    const b = await body(req);

    if (p === "/api/batch/start") {
      const r = recipes.find((x) => x.id === b.recipeId);
      if (!r) return send(res, 400, { error: "нет рецепта " + b.recipeId });
      const startStage = Math.max(0, Math.min(r.stages.length - 1, Number(b.stageIndex) || 0));
      const skipMs = r.stages.slice(0, startStage).reduce((s, x) => s + x.hours, 0) * S.H;
      state.batch = { recipeId: r.id, startedAt: Date.now() - skipMs, shiftMs: 0, note: b.note || "" };
      state.overrides = {}; state.lastApplied = null;
      log("BATCH", `старт: ${r.name}${startStage ? ` (со стадии ${startStage + 1})` : ""}`);
      save(); await loop();
      return send(res, 200, snapshot());
    }
    if (p === "/api/batch/stop") {
      if (state.batch) log("BATCH", "партия остановлена технологом — MCGS остаётся на последних записанных уставках");
      state.batch = null; state.overrides = {}; save(); broadcast();
      return send(res, 200, snapshot());
    }
    if (p === "/api/batch/shift") {
      if (!state.batch) return send(res, 400, { error: "партия не запущена" });
      const h = Math.max(-24, Math.min(24, Number(b.hours) || 0));
      state.batch.shiftMs = (state.batch.shiftMs || 0) + h * S.H;
      log("BATCH", `сдвиг цикла ${h > 0 ? "+" : ""}${h} ч`);
      save(); await loop();
      return send(res, 200, snapshot());
    }
    if (p === "/api/override/phase") {
      // ручная фаза на N минут (по умолчанию до конца текущей фазы рецепта, не больше 4 ч)
      const min = Math.max(1, Math.min(240, Number(b.minutes) || 30));
      if (b.phase === "AUTO") { delete state.overrides.phase; delete state.overrides.phaseUntil; }
      else { state.overrides.phase = b.phase === "WORK" ? "WORK" : "PAUSE"; state.overrides.phaseUntil = Date.now() + min * 60000; }
      log("MANUAL", b.phase === "AUTO" ? "фаза: снова по рецепту" : `фаза вручную: ${state.overrides.phase} на ${min} мин`);
      save(); await loop();
      return send(res, 200, snapshot());
    }
    if (p === "/api/override/hz") {
      if (b.hz === null || b.hz === "AUTO") { delete state.overrides.hz; delete state.overrides.hzUntil; log("MANUAL", "частота: снова по рецепту"); }
      else {
        const hz = Number(b.hz);
        if (!(hz >= cfg.limits.hzMin && hz <= cfg.limits.hzMax)) return send(res, 400, { error: `частота только ${cfg.limits.hzMin}–${cfg.limits.hzMax} Гц` });
        state.overrides.hz = hz; state.overrides.hzUntil = Date.now() + Math.max(5, Math.min(240, Number(b.minutes) || 60)) * 60000;
        log("MANUAL", `частота вручную: ${hz} Гц`);
      }
      save(); await loop();
      return send(res, 200, snapshot());
    }
    if (p === "/api/defrost/cancel") { delete state.overrides.defrostUntil; clearAlarm("DEFROST"); save(); await loop(); return send(res, 200, snapshot()); }
    if (p === "/api/scan") {
      // разовое чтение диапазона для поиска адресов (FC03/FC04)
      const unit = Number(b.unit) || 1, fc = Number(b.fc) === 4 ? 4 : 3;
      const from = Math.max(0, Number(b.from) || 0), count = Math.max(1, Math.min(500, Number(b.count) || 50));
      const out = [];
      for (let a = from; a < from + count; a += 10) {
        const n = Math.min(10, from + count - a);
        try { const v = await mb.readRegisters(unit, fc, a, n); v.forEach((x, i) => out.push({ addr: a + i, value: x, signed: x > 32767 ? x - 65536 : x })); }
        catch (e) { out.push({ addr: a, error: e.message, block: n }); }
      }
      return send(res, 200, { unit, fc, from, count, values: out });
    }
    if (p === "/api/write-raw") {
      // ручная запись одного регистра — только для проверки найденного адреса (FC06), с подтверждением
      if (!cfg.writeEnabled) return send(res, 400, { error: "writeEnabled=false" });
      if (b.confirm !== "ДА") return send(res, 400, { error: "нужно подтверждение confirm: 'ДА'" });
      const unit = Number(b.unit), addr = Number(b.addr), value = Number(b.value);
      if (![unit, addr, value].every(Number.isFinite)) return send(res, 400, { error: "unit/addr/value" });
      await mb.writeSingle(unit, addr, value < 0 ? value + 65536 : value);
      log("WRITE", `ручная запись: узел ${unit}, регистр ${addr} = ${value}`);
      return send(res, 200, { ok: true });
    }
    if (p === "/api/sniffer") {
      if (!sniffer) return send(res, 400, { error: "сниффер не настроен (config.json → sniffer)" });
      if (b.action === "start") sniffer.start();
      if (b.action === "stop") sniffer.stop();
      if (b.action === "clear") sniffer.clear();
      return send(res, 200, sniffer.snapshot());
    }
    return send(res, 404, { error: "нет такой команды" });
  } catch (e) {
    log("ERR", p + ": " + e.message);
    return send(res, 500, { error: e.message });
  }
});
server.listen(cfg.http.port, cfg.http.host, () => {
  log("START", `SCADA-мост слушает http://${cfg.http.host}:${cfg.http.port} • конфиг ${path.basename(CFG_FILE)} • запись ${cfg.writeEnabled ? "ВКЛЮЧЕНА" : "выключена"}`);
  if (state.batch) log("BATCH", "продолжаю партию после перезапуска: " + (currentRecipe() || {}).name);
});
process.on("SIGINT", () => { save(); process.exit(0); });
