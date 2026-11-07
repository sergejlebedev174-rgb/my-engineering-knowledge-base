// Проверка моста на имитаторе: Modbus-сервер (ПЛК узел 1 + Hapn узлы 2, 3) в режимах tcp и rtu-over-tcp,
// запуск партии, запись уставок, сдвиг, ручная частота, пределы, оттайка, датчик −999, сниффер.
"use strict";
const net = require("net");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { crc16, withCrc } = require("../modbus");

const regs = { 1: {}, 2: {}, 3: {} };
const set = (u, a, v) => (regs[u][a] = v < 0 ? v + 65536 : v);
set(1, 10, 158); set(1, 11, 58); set(1, 12, 51); set(1, 13, 48); // dryTemp 15.8, humi 58, coil 5.1/4.8
function handle(unit, pdu) {
  const fc = pdu[0], r = regs[unit];
  if (!r) return null;
  if (fc === 3 || fc === 4) {
    const a = pdu.readUInt16BE(1), n = pdu.readUInt16BE(3);
    const out = Buffer.alloc(2 + n * 2); out[0] = fc; out[1] = n * 2;
    for (let i = 0; i < n; i++) out.writeUInt16BE(r[a + i] || 0, 2 + i * 2);
    return out;
  }
  if (fc === 6) { r[pdu.readUInt16BE(1)] = pdu.readUInt16BE(3); return pdu; }
  return Buffer.from([fc | 0x80, 1]);
}
function sim(port, mode) {
  return net.createServer((s) => {
    let buf = Buffer.alloc(0);
    s.on("error", () => {}); // мост перезапускается — обрыв сокета это норма
    s.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      if (mode === "tcp") {
        while (buf.length >= 7 && buf.length >= 6 + buf.readUInt16BE(4)) {
          const len = buf.readUInt16BE(4), unit = buf[6], pdu = buf.slice(7, 6 + len), tid = buf.readUInt16BE(0);
          buf = buf.slice(6 + len);
          const resp = handle(unit, pdu); if (!resp) continue;
          const h = Buffer.alloc(7); h.writeUInt16BE(tid, 0); h.writeUInt16BE(0, 2); h.writeUInt16BE(resp.length + 1, 4); h[6] = unit;
          s.write(Buffer.concat([h, resp]));
        }
      } else {
        while (buf.length >= 8) {
          const fr = buf.slice(0, 8); buf = buf.slice(8);
          const resp = handle(fr[0], fr.slice(1, 6)); if (resp) s.write(withCrc(Buffer.concat([Buffer.from([fr[0]]), resp])));
        }
      }
    });
  }).listen(port, "127.0.0.1");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (cond, msg) => { console.log((cond ? "  ✔ " : "  ✘ ") + msg); if (!cond) failed++; };

async function runMode(mode, simPort, httpPort) {
  console.log(`\n=== режим шлюза: ${mode} ===`);
  const srv = sim(simPort, mode);
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.example.json"), "utf8"));
  cfg.http = { host: "127.0.0.1", port: httpPort, apiToken: "" };
  cfg.gateway = { host: "127.0.0.1", port: simPort, mode, pollIntervalMs: 2000, responseTimeoutMs: 500, interFrameDelayMs: 5 };
  cfg.sniffer = null;
  cfg.protection.dehumicoilMinutes = 0.05; // 3 с вместо 15 мин — для теста
  Object.assign(cfg.devices.plc.read.dryTemp, { address: 10 });
  Object.assign(cfg.devices.plc.read.dryHumi, { address: 11 });
  Object.assign(cfg.devices.plc.read.dehumicoil1, { address: 12 });
  Object.assign(cfg.devices.plc.read.dehumicoil2, { address: 13 });
  Object.assign(cfg.devices.plc.write.setTemp, { address: 100 });
  Object.assign(cfg.devices.plc.write.setHumi, { address: 101 });
  Object.assign(cfg.devices.vfd1.write.freqSet, { address: 0x2000 });
  Object.assign(cfg.devices.vfd2.write.freqSet, { address: 0x2000 });
  const tmpCfg = path.join(__dirname, `cfg-${mode}.json`);
  fs.writeFileSync(tmpCfg, JSON.stringify(cfg));
  const stateFile = path.join(__dirname, "..", "state.json");
  try { fs.unlinkSync(stateFile); } catch (e) {}
  const proc = spawn(process.execPath, [path.join(__dirname, "..", "server.js"), "--config=" + tmpCfg], { stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; proc.stdout.on("data", (d) => (out += d)); proc.stderr.on("data", (d) => (out += d));
  const base = `http://127.0.0.1:${httpPort}`;
  const post = (p, b) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b || {}) }).then((r) => r.json());
  try {
    await sleep(3500);
    let s = await fetch(base + "/api/state").then((r) => r.json());
    check(s.link.connected, "мост подключился к шлюзу");
    check(Math.abs(s.readings.dryTemp - 15.8) < 0.01 && s.readings.dryHumi === 58, `датчики прочитаны: ${s.readings.dryTemp}°C, ${s.readings.dryHumi}%`);

    s = await post("/api/batch/start", { recipeId: "vimba_bream" });
    check(s.batch && s.batch.phase === "WORK", "партия «вимба/лещ» запущена, фаза РАБОТА");
    check(regs[1][100] === 140 && regs[1][101] === 20, `в ПЛК записано SET Temp ${regs[1][100] / 10}°C, SET Humi ${regs[1][101]}%`);
    check(regs[2][0x2000] === 3000 && regs[3][0x2000] === 3000, `частотники 1# и 2#: ${regs[2][0x2000] / 100} Гц`);

    s = await post("/api/batch/shift", { hours: 3.5 });
    check(s.batch.phase === "PAUSE", `сдвиг +3.5 ч → ПАУЗА (${s.batch.stageName})`);
    check(regs[1][101] === 95 && regs[1][100] === 150 && regs[2][0x2000] === 1800, `пауза: Humi ${regs[1][101]}%, Temp ${regs[1][100] / 10}°C (+1°C чистая пауза), ${regs[2][0x2000] / 100} Гц`);

    let bad = await post("/api/override/hz", { hz: 40 });
    check(!!bad.error, "частота 40 Гц отклонена: " + bad.error);
    s = await post("/api/override/hz", { hz: 22, minutes: 10 });
    check(regs[2][0x2000] === 2200 && regs[3][0x2000] === 2200, "ручная частота 22 Гц записана в оба Hapn");
    await post("/api/override/hz", { hz: "AUTO" });

    set(1, 12, -50); // испаритель −5.0°C
    await sleep(9500);
    s = await fetch(base + "/api/state").then((r) => r.json());
    check(s.batch.phase === "DEFROST" && regs[2][0x2000] === 3000 && regs[1][101] === 95, `обмерзание −5°C → оттайка: Humi ${regs[1][101]}%, ${regs[2][0x2000] / 100} Гц`);
    set(1, 12, 51); await post("/api/defrost/cancel");

    set(1, 11, -999);
    await sleep(2500);
    s = await fetch(base + "/api/state").then((r) => r.json());
    check(s.alarms.some((a) => a.code === "HUMI_FAULT"), "датчик влажности −999 → тревога, цикл по таймеру");
    set(1, 11, 58);

    set(1, 10, 195);
    await sleep(2500);
    s = await fetch(base + "/api/state").then((r) => r.json());
    check(s.alarms.some((a) => a.code === "OVERHEAT"), "камера 19.5°C выше лимита стадии → критическая тревога");
    set(1, 10, 158);

    // перезапуск сервера: цикл продолжается с того же места
    const before = s.batch.elapsedH;
    proc.kill(); await sleep(800);
    const proc2 = spawn(process.execPath, [path.join(__dirname, "..", "server.js"), "--config=" + tmpCfg], { stdio: "ignore" });
    await sleep(3000);
    s = await fetch(base + "/api/state").then((r) => r.json());
    check(s.batch && Math.abs(s.batch.elapsedH - before) < 0.05, `после перезапуска моста партия продолжилась (${s.batch && s.batch.elapsedH.toFixed(2)} ч)`);
    await post("/api/batch/stop");
    proc2.kill();
  } catch (e) {
    check(false, "исключение: " + e.message + "\n" + out.slice(-1500));
    proc.kill();
  }
  srv.close();
  fs.unlinkSync(tmpCfg);
  try { fs.unlinkSync(stateFile); } catch (e) {}
}

function snifferTest() {
  console.log("\n=== сниффер RTU-кадров ===");
  const { Sniffer } = require("../sniffer");
  const sn = new Sniffer({ host: "x", port: 0 });
  const req = withCrc(Buffer.from([1, 3, 0, 10, 0, 2]));
  const resp = withCrc(Buffer.from([1, 3, 4, 0, 158, 0, 58]));
  const wr = withCrc(Buffer.from([1, 6, 0, 100, 0, 165]));
  sn.buf = Buffer.concat([Buffer.from([0x55, 0xaa]), req, resp, wr]); // с мусором в начале
  sn._parse();
  const snap = sn.snapshot();
  check(snap.frames === 3, `разобрано кадров: ${snap.frames}`);
  check(snap.registers.some((r) => r.addr === 10 && r.value === 158), "чтение MCGS: регистр 10 = 158 (15.8°C)");
  check(snap.writes[0] && snap.writes[0].addr === 100 && snap.writes[0].values[0] === 165, "запись MCGS найдена: регистр 100 = 165 → это SET Temp");
}

(async () => {
  snifferTest();
  await runMode("tcp", 15502, 18787);
  await runMode("rtu-over-tcp", 15503, 18788);
  console.log(failed ? `\nПРОВАЛОВ: ${failed}` : "\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ");
  process.exit(failed ? 1 : 0);
})();
