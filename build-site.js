// Сборка сайта для клиентов: node build-site.js
// Берёт паспорта видов из базы знаний (knowledge/*.js) и контакты (marketing.js → «витрина_для_байеров»),
// пишет site/data.js и копирует фото в site/assets/. Цены на сайт НЕ попадают (решение: «по запросу»).
// Папку site/ целиком загружают на хостинг.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const SITE = path.join(ROOT, "site");
const ASSETS = path.join(SITE, "assets");
fs.mkdirSync(ASSETS, { recursive: true });

const ctx = { window: {} };
vm.createContext(ctx);
["species", "stages", "marketing"].forEach((n) => vm.runInContext(fs.readFileSync(path.join(ROOT, "knowledge", n + ".js"), "utf8"), ctx));
const K = ctx.window.ARM_KNOWLEDGE;

const ORDER = ["VIMBA", "BREAM", "ROACH", "SMELT", "PERCH", "ROUND_GOBY"];
const FILE = { VIMBA: "vimba", BREAM: "bream", ROACH: "roach", SMELT: "smelt", PERCH: "perch", ROUND_GOBY: "goby" };
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

const species = ORDER.map((key) => {
  const s = K.species[key] || {};
  const raw = s["сырьё"] || {}, salt = s["посол"] || {}, dry = s["сушка"] || {}, y = s["выход_процент"] || {}, prod = s["готовый_продукт"] || {};
  return {
    key, file: FILE[key],
    caliber: raw["калибр"] || "",
    pieceG: num(raw["масса_тушки_г"]),
    fat: num(raw["жирность_процент"]),
    yieldMin: num(y["мин"]), yieldMax: num(y["макс"]),
    aw: num(prod["активность_воды_aw"]),
    saltH: Array.isArray(salt["часы"]) ? salt["часы"] : null,
    tempC: Array.isArray(dry["температура_моно_C"]) ? dry["температура_моно_C"] : null,
  };
});

const shop = (K.marketing && K.marketing["витрина_для_байеров"]) || {};
const data = {
  builtAt: new Date().toISOString().slice(0, 10),
  company: shop["компания"] || "SIA “TUBA”",
  email: shop["email"] || "",
  phone: shop["телефон_whatsapp"] || "",
  address: shop["адрес"] || "",
  certs: (shop["сертификаты"] || []).filter((c) => c["подтверждено"]).map((c) => ({ name: c["название"], no: c["номер"] || "" })),
  group: shop["группа"] ? {
    name: shop["группа"]["название"], site: shop["группа"]["сайт"], since: shop["группа"]["с_года"], founded: shop["группа"]["группа_создана"],
    address: shop["группа"]["адрес"], species: shop["группа"]["видов_рыбы_в_группе"],
  } : null,
  species,
};
fs.writeFileSync(path.join(SITE, "data.js"), "// Создано build-site.js из базы знаний — не править вручную\nwindow.SITE_DATA = " + JSON.stringify(data, null, 1) + ";\n");

// фото: стадии 0–4 и срез каждого вида, вакуум, продукт
const copy = [];
species.forEach((s) => { for (let i = 0; i < 5; i++) copy.push(`${s.file}-${i}.jpg`); copy.push(`cut-${s.file}.jpg`); });
copy.push("reefer.jpg");
// реальные фото цеха (site/assets/real) делает отдельный скрипт: tools/web-photos.ps1 из папки «фото-для-клиентов»
let n = 0;
copy.forEach((f) => {
  const src = path.join(ROOT, "img", "vyalka", f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(ASSETS, f)); n++; } else console.log("нет файла:", f);
});
console.log(`site/data.js: ${species.length} видов • контакты: ${data.company} ${data.email || "(нет e-mail)"} • сертификатов подтверждено: ${data.certs.length}`);
console.log(`site/assets: скопировано фото ${n}`);
