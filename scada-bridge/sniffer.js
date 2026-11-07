// Сниффер шины RS-485: подключается к прозрачному (raw) порту шлюза Delock и разбирает RTU-кадры,
// которыми обмениваются панель MCGS, плата ПЛК и частотники Hapn. Пары «запрос → ответ» превращаются
// в карту регистров: какой узел, какой адрес, какое значение и когда оно менялось.
// Так находим адреса уставок: меняем Temp на панели MCGS → смотрим, какой регистр записан (FC06/FC16).
"use strict";
const net = require("net");
const { crc16 } = require("./modbus");

function crcOk(buf, len) {
  if (buf.length < len) return false;
  const c = crc16(buf.slice(0, len - 2));
  return buf[len - 2] === (c & 0xff) && buf[len - 1] === c >> 8;
}

class Sniffer {
  constructor(opts) {
    this.host = opts.host;
    this.port = opts.port;
    this.sock = null;
    this.running = false;
    this.buf = Buffer.alloc(0);
    this.lastReq = null;
    this.regs = new Map(); // "unit:fc:addr" → { unit, fc, addr, value, changes, history[] }
    this.writes = [];      // последние записи FC06/FC16 (самое ценное для поиска уставок)
    this.frames = 0;
    this.startedAt = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startedAt = Date.now();
    const s = new net.Socket();
    this.sock = s;
    s.on("data", (d) => { this.buf = Buffer.concat([this.buf, d]); this._parse(); });
    s.on("error", () => {});
    s.on("close", () => { this.sock = null; if (this.running) setTimeout(() => { this.running = false; this.start(); }, 3000); });
    s.connect(this.port, this.host);
  }
  stop() { this.running = false; if (this.sock) this.sock.destroy(); this.sock = null; }
  clear() { this.regs.clear(); this.writes = []; this.frames = 0; }

  _parse() {
    // ищем кадр с верным CRC; длины пробуем по типу функции
    let guard = 0;
    while (this.buf.length >= 5 && guard++ < 2000) {
      const b = this.buf, fc = b[1] & 0x7f;
      const cand = [];
      if (b[1] & 0x80) cand.push(5);
      if (fc === 3 || fc === 4) { cand.push(8); cand.push(5 + b[2]); }
      if (fc === 6) cand.push(8);
      if (fc === 16) { cand.push(8); if (b.length >= 7) cand.push(9 + b[6]); }
      let hit = 0;
      for (const L of cand) if (L >= 5 && L <= 260 && crcOk(b, L)) { hit = L; break; }
      if (!hit) {
        if (b.length > 300) this.buf = b.slice(1); // мусор — сдвиг на байт
        else if (cand.every((L) => b.length >= L)) this.buf = b.slice(1);
        else return; // ждём остаток кадра
        continue;
      }
      this._frame(b.slice(0, hit));
      this.buf = b.slice(hit);
    }
  }

  _frame(f) {
    this.frames++;
    const unit = f[0], fc = f[1];
    const now = Date.now();
    if (fc & 0x80) { this.lastReq = null; return; }
    if ((fc === 3 || fc === 4) && f.length === 8 && (!this.lastReq || this.lastReq.done)) {
      this.lastReq = { unit, fc, addr: f.readUInt16BE(2), count: f.readUInt16BE(4), done: false };
      return;
    }
    if ((fc === 3 || fc === 4) && this.lastReq && !this.lastReq.done && this.lastReq.unit === unit && f[2] === this.lastReq.count * 2) {
      const r = this.lastReq;
      r.done = true;
      for (let i = 0; i < r.count; i++) this._val(unit, fc, r.addr + i, f.readUInt16BE(3 + i * 2), now, "read");
      return;
    }
    if (fc === 6 && f.length === 8) {
      const addr = f.readUInt16BE(2), value = f.readUInt16BE(4);
      this._val(unit, 6, addr, value, now, "write");
      this._write(unit, 6, addr, [value], now);
      return;
    }
    if (fc === 16 && f.length > 8) {
      const addr = f.readUInt16BE(2), n = f.readUInt16BE(4);
      const vals = [];
      for (let i = 0; i < n; i++) vals.push(f.readUInt16BE(7 + i * 2));
      vals.forEach((v, i) => this._val(unit, 16, addr + i, v, now, "write"));
      this._write(unit, 16, addr, vals, now);
      return;
    }
    if ((fc === 3 || fc === 4) && f.length === 8) this.lastReq = { unit, fc, addr: f.readUInt16BE(2), count: f.readUInt16BE(4), done: false };
  }

  _write(unit, fc, addr, values, at) {
    this.writes.unshift({ at, unit, fc, addr, values });
    if (this.writes.length > 200) this.writes.length = 200;
  }

  _val(unit, fc, addr, value, at, kind) {
    const space = fc === 4 ? "in" : "hold"; // FC03/06/16 — один набор holding-регистров
    const key = `${unit}:${space}:${addr}`;
    let r = this.regs.get(key);
    if (!r) { r = { unit, space, addr, value, changes: 0, firstAt: at, lastAt: at, written: false, history: [] }; this.regs.set(key, r); }
    if (r.value !== value) { r.changes++; r.history.unshift({ at, value }); if (r.history.length > 20) r.history.length = 20; }
    r.value = value; r.lastAt = at;
    if (kind === "write") r.written = true;
  }

  snapshot() {
    return {
      running: this.running, connected: !!(this.sock && !this.sock.connecting), frames: this.frames, startedAt: this.startedAt,
      writes: this.writes.slice(0, 50),
      registers: [...this.regs.values()].sort((a, b) => a.unit - b.unit || (a.space > b.space ? 1 : -1) || a.addr - b.addr)
        .map((r) => ({ unit: r.unit, space: r.space, addr: r.addr, hex: "0x" + r.addr.toString(16).padStart(4, "0"), value: r.value, signed: r.value > 32767 ? r.value - 65536 : r.value, changes: r.changes, written: r.written, lastAt: r.lastAt, history: r.history.slice(0, 6) })),
    };
  }
}

module.exports = { Sniffer };
