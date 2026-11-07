// Клиент Modbus для шлюза Delock (Ethernet ↔ RS-485).
// Два режима шлюза:
//   "tcp"          — шлюз сам переводит Modbus TCP → RTU (MBAP-заголовок, порт обычно 502);
//   "rtu-over-tcp" — прозрачный режим: по TCP идут готовые RTU-кадры с CRC.
// Запросы строго по одному (очередь): на шине RS-485 одновременно работает штатная панель MCGS.
"use strict";
const net = require("net");
const { EventEmitter } = require("events");

function crc16(buf) {
  let crc = 0xffff;
  for (const b of buf) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
  }
  return crc;
}
function withCrc(buf) {
  const c = crc16(buf);
  return Buffer.concat([buf, Buffer.from([c & 0xff, c >> 8])]);
}

const EXC = { 1: "недопустимая функция", 2: "недопустимый адрес регистра", 3: "недопустимое значение", 4: "сбой устройства", 6: "устройство занято", 11: "устройство не ответило (шлюз)" };

class ModbusClient extends EventEmitter {
  constructor(opts) {
    super();
    this.host = opts.host;
    this.port = opts.port || 502;
    this.mode = opts.mode || "tcp";
    this.timeoutMs = opts.responseTimeoutMs || 1000;
    this.interFrameMs = opts.interFrameDelayMs || 40; // пауза между запросами — даём шине и MCGS «вздохнуть»
    this.sock = null;
    this.connected = false;
    this.rx = Buffer.alloc(0);
    this.queue = [];
    this.busy = false;
    this.tid = 1;
    this.pending = null;
    this.stats = { ok: 0, timeouts: 0, errors: 0, lastOkAt: 0 };
  }

  connect() {
    if (this.sock) return;
    const s = new net.Socket();
    this.sock = s;
    s.setNoDelay(true);
    s.on("connect", () => { this.connected = true; this.emit("status", true); });
    s.on("data", (d) => { this.rx = Buffer.concat([this.rx, d]); this._tryParse(); });
    const drop = (why) => {
      if (!this.sock) return;
      this.sock.destroy();
      this.sock = null;
      this.connected = false;
      this.rx = Buffer.alloc(0);
      if (this.pending) { const p = this.pending; this.pending = null; clearTimeout(p.timer); p.reject(new Error("связь со шлюзом потеряна: " + why)); }
      this.emit("status", false, why);
      setTimeout(() => this.connect(), 3000);
    };
    s.on("error", (e) => drop(e.code || e.message));
    s.on("close", () => drop("закрыто"));
    // если по адресу никого нет, Windows ждёт ~21 с без ответа — даём 5 с и говорим прямо
    const ct = setTimeout(() => { if (!this.connected && this.sock === s) drop(`по адресу ${this.host}:${this.port} никто не отвечает (5 с) — шлюз выключен, не в этой сети или IP неверный`); }, 5000);
    s.once("connect", () => clearTimeout(ct));
    s.connect(this.port, this.host);
  }

  close() { if (this.sock) { this.sock.removeAllListeners(); this.sock.destroy(); this.sock = null; } this.connected = false; }

  _send(unit, pdu, expect) {
    return new Promise((resolve, reject) => {
      this.queue.push({ unit, pdu, expect, resolve, reject });
      this._pump();
    });
  }

  _pump() {
    if (this.busy || !this.queue.length) return;
    if (!this.connected) {
      const q = this.queue.splice(0);
      q.forEach((r) => r.reject(new Error("нет связи со шлюзом " + this.host + ":" + this.port)));
      return;
    }
    this.busy = true;
    const req = this.queue.shift();
    let frame;
    if (this.mode === "tcp") {
      const tid = (this.tid = (this.tid + 1) & 0xffff);
      req.tid = tid;
      const h = Buffer.alloc(7);
      h.writeUInt16BE(tid, 0); h.writeUInt16BE(0, 2); h.writeUInt16BE(req.pdu.length + 1, 4); h.writeUInt8(req.unit, 6);
      frame = Buffer.concat([h, req.pdu]);
    } else {
      frame = withCrc(Buffer.concat([Buffer.from([req.unit]), req.pdu]));
    }
    this.rx = Buffer.alloc(0);
    req.timer = setTimeout(() => {
      if (this.pending !== req) return;
      this.pending = null;
      this.stats.timeouts++;
      req.reject(new Error(`таймаут ответа (узел ${req.unit})`));
      this._next();
    }, this.timeoutMs);
    this.pending = req;
    this.sock.write(frame);
  }

  _next() { setTimeout(() => { this.busy = false; this._pump(); }, this.interFrameMs); }

  _finish(err, pdu) {
    const req = this.pending;
    if (!req) return;
    this.pending = null;
    clearTimeout(req.timer);
    if (err) { this.stats.errors++; req.reject(err); }
    else { this.stats.ok++; this.stats.lastOkAt = Date.now(); req.resolve(pdu); }
    this._next();
  }

  _tryParse() {
    const req = this.pending;
    if (!req) { this.rx = Buffer.alloc(0); return; }
    if (this.mode === "tcp") {
      if (this.rx.length < 7) return;
      const len = this.rx.readUInt16BE(4);
      if (this.rx.length < 6 + len) return;
      const tid = this.rx.readUInt16BE(0);
      const pdu = this.rx.slice(7, 6 + len);
      this.rx = this.rx.slice(6 + len);
      if (tid !== req.tid) return; // чужой/запоздавший ответ
      return this._checkPdu(req, pdu);
    }
    // RTU: unit fc ... crc
    if (this.rx.length < 5) return;
    const fc = this.rx[1];
    let need;
    if (fc & 0x80) need = 5;
    else if (fc === 3 || fc === 4) need = 5 + this.rx[2];
    else need = 8;
    if (this.rx.length < need) return;
    const fr = this.rx.slice(0, need);
    this.rx = this.rx.slice(need);
    const c = crc16(fr.slice(0, need - 2));
    if (fr[need - 2] !== (c & 0xff) || fr[need - 1] !== c >> 8) return this._finish(new Error("ошибка CRC в ответе"));
    if (fr[0] !== req.unit) return this._finish(new Error(`ответил чужой узел ${fr[0]} (ждали ${req.unit}) — возможна коллизия с MCGS`));
    this._checkPdu(req, fr.slice(1, need - 2));
  }

  _checkPdu(req, pdu) {
    if (pdu[0] & 0x80) return this._finish(new Error(`Modbus-исключение ${pdu[1]}: ${EXC[pdu[1]] || "?"}`));
    if (pdu[0] !== req.pdu[0]) return this._finish(new Error("ответ на другую функцию"));
    this._finish(null, pdu);
  }

  async readRegisters(unit, fc, addr, count) {
    const pdu = Buffer.alloc(5);
    pdu.writeUInt8(fc, 0); pdu.writeUInt16BE(addr, 1); pdu.writeUInt16BE(count, 3);
    const r = await this._send(unit, pdu);
    const out = [];
    for (let i = 0; i < r[1] / 2; i++) out.push(r.readUInt16BE(2 + i * 2));
    return out;
  }
  readHolding(unit, addr, count) { return this.readRegisters(unit, 3, addr, count); }
  readInput(unit, addr, count) { return this.readRegisters(unit, 4, addr, count); }

  async writeSingle(unit, addr, value) {
    const pdu = Buffer.alloc(5);
    pdu.writeUInt8(6, 0); pdu.writeUInt16BE(addr, 1); pdu.writeUInt16BE(value & 0xffff, 3);
    await this._send(unit, pdu);
  }
  async writeMultiple(unit, addr, values) {
    const pdu = Buffer.alloc(6 + values.length * 2);
    pdu.writeUInt8(16, 0); pdu.writeUInt16BE(addr, 1); pdu.writeUInt16BE(values.length, 3); pdu.writeUInt8(values.length * 2, 5);
    values.forEach((v, i) => pdu.writeUInt16BE(v & 0xffff, 6 + i * 2));
    await this._send(unit, pdu);
  }
}

module.exports = { ModbusClient, crc16, withCrc };
