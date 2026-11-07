// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС
// БАЗА ЗНАНИЙ: загрузка knowledge/*.js, заметки технолога, поиск, контекст для ИИ
// Подключение: <script src="js/knowledge-base.js"></script> → window.ARM_KB
// ==========================================================================
(function (global) {
  "use strict";

  const KB_FILES = ["species", "stages", "equipment", "marketing", "notes"];
  const NOTES_STORAGE_KEY = "JURMALCIEMS_KB_NOTES_V1"; // { notes: [...], deleted: [id, ...] }
  const MEMORY_STORAGE_KEY = "JURMALCIEMS_AI_MEMORY_V1"; // «Память цеха» из index.html / telefon.html
  const GEMINI_KEY_STORAGE = "GEMINI_API_KEY_JURMALCIEMS";
  const GEMINI_KEY_LEGACY = "JURMALCIEMS_GEMINI_KEY"; // старое имя из telefon.html
  const AI_CONTEXT_BUDGET_CHARS = 12000;

  const TOPICS = {
    species: "Рыба",
    stages: "Стадии",
    equipment: "Оборудование",
    marketing: "Маркетинг",
    notes: "Заметки",
  };
  // тема заметки → раздел, в котором её тоже показывать (технологические заметки находятся через фильтр по рыбе)
  const NOTE_THEME_TO_TOPIC = { оборудование: "equipment", маркетинг: "marketing" };
  const NOTE_STATUSES = ["проверено", "гипотеза", "проверить"];

  const SPECIES_ORDER = ["VIMBA", "BREAM", "ROACH", "SMELT", "PERCH", "ROUND_GOBY"];
  const SPECIES_SHORT = { VIMBA: "Вимба", BREAM: "Лещ", ROACH: "Плотва", SMELT: "Корюшка", PERCH: "Окунь", ROUND_GOBY: "Бычок" };
  const SPECIES_STEMS = {
    VIMBA: ["вимб", "сырт", "рыбец", "рыбц"],
    BREAM: ["лещ"],
    ROACH: ["плотв", "вобл"],
    SMELT: ["корюшк", "корюх"],
    PERCH: ["окун"],
    ROUND_GOBY: ["бычк", "бычок", "кругляк"],
  };
  const STOP_WORDS = new Set(("как что какой какая какие каких сколько почему зачем где когда для при это эта этот или если нужно надо " +
    "можно чем тоже есть быть мне нам наш ваш про под над без после перед очень лучше будет было который которая " +
    "так там тут уже еще ещё все всё весь его она они оно")
    .split(" "));

  // ---------- Загрузка файлов базы ----------
  const scriptSrc = (document.currentScript && document.currentScript.src) || "";
  const rootUrl = scriptSrc.replace(/js\/knowledge-base\.js(\?.*)?$/, "");
  const loadErrors = [];

  const ready = new Promise((resolve) => {
    global.ARM_KNOWLEDGE = global.ARM_KNOWLEDGE || {};
    let left = KB_FILES.length;
    const done = () => { if (--left === 0) resolve(global.ARM_KNOWLEDGE); };
    KB_FILES.forEach((name) => {
      if (global.ARM_KNOWLEDGE[name]) return done();
      const s = document.createElement("script");
      s.src = rootUrl + "knowledge/" + name + ".js";
      s.onload = done;
      s.onerror = () => {
        loadErrors.push(name + ".js");
        console.warn("[База знаний] не загрузился файл", s.src);
        done();
      };
      document.head.appendChild(s);
    });
  });

  const kb = () => global.ARM_KNOWLEDGE || {};

  // ---------- Мелкие помощники ----------
  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
  function normalizeText(s) {
    return String(s || "").toLowerCase().replace(/ё/g, "е");
  }
  function range(v, unit) {
    if (v == null || v === "") return null;
    const u = unit || "";
    return Array.isArray(v) ? v.join("–") + u : v + u;
  }
  function humanKey(k) {
    return String(k).replace(/^_+/, "").replace(/_/g, " ");
  }
  // Универсальная отрисовка значения, которое модуль не знает «в лицо» (новые поля в файлах базы)
  function renderValue(v, indent) {
    const pad = indent || "";
    if (v == null) return "";
    if (Array.isArray(v)) return v.map((x) => pad + "• " + renderValue(x, pad + "  ").trim()).join("\n");
    if (typeof v === "object") {
      return Object.entries(v)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, x]) => {
          const inner = renderValue(x, pad + "  ");
          return typeof x === "object" && x !== null ? `${pad}${humanKey(k)}:\n${inner}` : `${pad}${humanKey(k)}: ${inner}`;
        })
        .join("\n");
    }
    return String(v);
  }
  function speciesName(key) {
    const sp = kb().species && kb().species[key];
    return (sp && sp.название) || SPECIES_SHORT[key] || key || "";
  }
  function detectSpecies(text) {
    const t = normalizeText(text);
    return SPECIES_ORDER.filter((k) => SPECIES_STEMS[k].some((stem) => t.includes(stem)));
  }

  // ---------- Заметки: файл + мои + Память цеха ----------
  function readUserStore() {
    const s = readJson(NOTES_STORAGE_KEY, null);
    return {
      notes: Array.isArray(s && s.notes) ? s.notes : [],
      deleted: Array.isArray(s && s.deleted) ? s.deleted : [],
    };
  }
  function writeUserStore(store) {
    const ok = writeJson(NOTES_STORAGE_KEY, store);
    try { global.dispatchEvent(new CustomEvent("arm-kb-changed")); } catch (e) {}
    return ok;
  }

  function memoryToNotes(ledger) {
    if (!ledger || typeof ledger !== "object") return [];
    const out = [];
    (ledger.learnedRules || []).forEach((r) => {
      if (!r || !r.ruleText) return;
      out.push({
        id: r.id, дата: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : null,
        тема: "технология", рыба: r.speciesKey || null, тип: "правило",
        текст: r.ruleText, источник: "Память цеха", статус: "гипотеза",
      });
    });
    (ledger.batchesHistory || []).forEach((h) => {
      if (!h) return;
      const parts = [h.technologistNote, h.saltingNotes, h.deviationNote].filter(Boolean);
      if (h.rawKg && h.outKg) {
        parts.push(`Сырьё ${h.rawKg} кг → готово ${h.outKg} кг (${h.actualYieldPct}% при норме ${h.standardYieldPct}%)${h.days ? ", " + h.days + " сут" : ""}.`);
      }
      out.push({
        id: h.id, дата: h.date || null, тема: "технология", рыба: h.speciesKey || null, тип: "итог партии",
        текст: parts.join(" "), источник: "Память цеха", статус: "проверено",
      });
    });
    return out.filter((n) => n.id && n.текст);
  }

  function getAllNotes() {
    const fileNotes = ((kb().notes && kb().notes.заметки) || []).map((n) => ({ ...n, _origin: "file" }));
    const store = readUserStore();
    const deleted = new Set(store.deleted);
    const byId = new Map();
    fileNotes.forEach((n) => byId.set(n.id, n));
    memoryToNotes(readJson(MEMORY_STORAGE_KEY, null)).forEach((n) => {
      if (!byId.has(n.id)) byId.set(n.id, { ...n, _origin: "memory" });
    });
    store.notes.forEach((n) => {
      const prev = byId.get(n.id);
      byId.set(n.id, { ...n, _origin: prev ? prev._origin : "user", _edited: !!prev });
    });
    return [...byId.values()]
      .filter((n) => !deleted.has(n.id))
      .sort((a, b) => String(b.дата || "").localeCompare(String(a.дата || "")));
  }

  function saveNote(note) {
    const store = readUserStore();
    const clean = {
      id: note.id || "n_" + Date.now().toString(36),
      дата: note.дата || todayIso(),
      тема: note.тема || "технология",
      рыба: note.рыба || null,
      стадия: note.стадия || null,
      тип: note.тип || "заметка",
      текст: String(note.текст || "").trim(),
      источник: note.источник || "технолог",
      статус: NOTE_STATUSES.includes(note.статус) ? note.статус : "гипотеза",
    };
    if (!clean.текст) return null;
    store.notes = store.notes.filter((n) => n.id !== clean.id).concat(clean);
    store.deleted = store.deleted.filter((id) => id !== clean.id);
    return writeUserStore(store) ? clean : null;
  }

  function deleteNote(id) {
    const store = readUserStore();
    store.notes = store.notes.filter((n) => n.id !== id);
    if (!store.deleted.includes(id)) store.deleted.push(id);
    return writeUserStore(store);
  }

  function stripInternal(n) {
    const out = {};
    Object.keys(n).forEach((k) => { if (!k.startsWith("_")) out[k] = n[k]; });
    return out;
  }

  // Полный файл knowledge/notes.js со всеми заметками — чтобы заменить им старый и сохранить базу навсегда
  function exportNotesFile() {
    const base = kb().notes || {};
    const data = {
      _о_файле: base._о_файле || "Ваши заметки, наблюдения и правила из практики.",
      _обновлено: todayIso(),
      _статусы: base._статусы || "проверено / гипотеза / проверить",
      заметки: getAllNotes().map(stripInternal),
    };
    return "// База знаний АРМ Юрмалциемс • Заметки и правила из практики\n" +
      "// Внутри — обычный JSON. Первые строки не трогать: благодаря им программа читает файл и без сервера.\n" +
      "window.ARM_KNOWLEDGE = window.ARM_KNOWLEDGE || {};\n" +
      "window.ARM_KNOWLEDGE.notes = " + JSON.stringify(data, null, 2) + ";\n";
  }

  // Импорт: экспорт «Памяти цеха» (JSON), файл notes.js или JSON с полем «заметки»
  function importText(text) {
    let data = null;
    const src = String(text || "").trim();
    try {
      data = JSON.parse(src);
    } catch (e) {
      const m = src.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
      if (m) { try { data = JSON.parse(m[1]); } catch (e2) {} }
    }
    if (!data || typeof data !== "object") throw new Error("Файл не похож на заметки или «Память цеха»");
    let incoming = [];
    if (Array.isArray(data.заметки)) incoming = data.заметки;
    else if (Array.isArray(data.batchesHistory) || Array.isArray(data.learnedRules)) incoming = memoryToNotes(data);
    else throw new Error("В файле нет заметок («заметки») и нет «Памяти цеха» (batchesHistory / learnedRules)");
    let count = 0;
    incoming.forEach((n) => { if (n && n.текст && saveNote(n)) count++; });
    return count;
  }

  // ---------- Записи базы (единый список для поиска и показа) ----------
  function speciesEntries() {
    const all = kb().species || {};
    return SPECIES_ORDER.concat(Object.keys(all).filter((k) => !k.startsWith("_") && !SPECIES_ORDER.includes(k)))
      .filter((k) => all[k])
      .map((k) => {
        const s = all[k];
        const disputed = s._спорно || [];
        const dis = (section, except) => disputed
          .filter((p) => p.startsWith(section + ".") && !(except || []).includes(p))
          .map((p) => humanKey(p.split(".")[1]));
        const line = (label, parts, d) => {
          const p = parts.filter(Boolean);
          if (!p.length) return null;
          return `${label}: ${p.join(", ")}${d && d.length ? ` ⚠️спорно (${d.join(", ")})` : ""}`;
        };
        const ra = s.сырьё || {}, po = s.посол || {}, su = s.сушка || {}, vy = s.выход_процент || {}, za = s.загрузка || {}, go = s.готовый_продукт || {};
        const lines = [
          s.кратко,
          line("Сырьё", [ra.калибр, ra.масса_тушки_г && `тушка ~${ra.масса_тушки_г} г`, ra.жирность_процент != null && `жирность ${ra.жирность_процент}%`], dis("сырьё")),
          line("Посол", [range(po.часы, " ч"), po.соль_кг_на_тонну && `${po.соль_кг_на_тонну} кг соли на тонну`, po.отмочка_часы && `отмочка ${range(po.отмочка_часы, " ч")}`], dis("посол")),
          line("Сушка", [
            su.температура_моно_C && `моно ${range(su.температура_моно_C, "°C")}`,
            su.температура_вместе_с_вимбой_C && `вместе с вимбой ${range(su.температура_вместе_с_вимбой_C, "°C")}`,
            su.аварийный_максимум_C != null && `аварийный максимум ${su.аварийный_максимум_C}°C`,
            su.минимальная_rH_на_старте_процент != null && `rH на старте не ниже ${su.минимальная_rH_на_старте_процент}%`,
          ], dis("сушка", ["сушка.длительность"])),
          line("Длительность", [su.длительность], disputed.includes("сушка.длительность") ? ["длительность"] : []),
          line("Выход", [
            vy.мин != null && vy.макс != null && `${vy.мин}–${vy.макс}%`,
            vy.норма != null && `норма ${vy.норма}%`,
            vy.мягкая_вялка != null && `мягкая вялка ${vy.мягкая_вялка}%`,
            vy.сухая_вялка != null && `сухая вялка ${vy.сухая_вялка}%`,
          ], dis("выход_процент")),
          line("Загрузка", [
            za.кг_на_тележку && `${za.кг_на_тележку} кг на тележку`,
            za.прутков_на_тележку && `${za.прутков_на_тележку} прутков на тележку`,
            za.рыб_на_пруток && `${za.рыб_на_пруток} рыб на пруток`,
          ], dis("загрузка")),
          line("Готовый продукт", [go.активность_воды_aw != null && `a_w ${go.активность_воды_aw}`], dis("готовый_продукт")),
          s.особенности && `Особенности: ${s.особенности}`,
          Array.isArray(s.чек_лист_подготовки) && s.чек_лист_подготовки.length && `Подготовка:\n${s.чек_лист_подготовки.map((x) => "• " + x).join("\n")}`,
        ];
        const known = ["название", "кратко", "сырьё", "посол", "сушка", "выход_процент", "загрузка", "готовый_продукт", "особенности", "чек_лист_подготовки"];
        Object.keys(s).filter((x) => !x.startsWith("_") && !known.includes(x)).forEach((x) => lines.push(`${humanKey(x)}: ${renderValue(s[x]).trim()}`));
        return {
          id: "species:" + k, topic: "species", title: s.название || k, species: [k],
          text: lines.filter(Boolean).join("\n"), disputed: disputed.length > 0, origin: "file",
        };
      });
  }

  function stagesEntries() {
    const st = kb().stages || {};
    const out = [];
    Object.entries(st.стадии || {}).forEach(([key, s]) => {
      const lines = [
        s.простыми_словами,
        s.сроки && `Сроки: ${s.сроки}${s.длительность_ч_по_умолчанию ? `, по умолчанию ${s.длительность_ч_по_умолчанию} ч` : ""}`,
        (s.цель_температура_C != null || s.цель_rH_процент != null) && `Цель: ${[s.цель_температура_C != null && s.цель_температура_C + "°C", s.цель_rH_процент != null && "rH " + s.цель_rH_процент + "%"].filter(Boolean).join(", ")}`,
        s.работа_ч != null && `Цикл: работа ${s.работа_ч} ч / пауза ${s.пауза_ч} ч${s.максимальная_пауза_ч ? ` (пауза не больше ${s.максимальная_пауза_ч} ч)` : ""}`,
        s.вентиляторы_работа && `Вентиляторы: работа ${s.вентиляторы_работа}, пауза ${s.вентиляторы_пауза}`,
        s.rH_на_полке_процент && `rH на полке: ${range(s.rH_на_полке_процент, "%")}`,
        s.контуров_AIM && `Контуров AIM: ${s.контуров_AIM}; снимается ${s.доля_снимаемой_влаги_процент}% всей влаги`,
        s.расход_энергии && `Энергия: ${s.расход_энергии}`,
      ];
      out.push({ id: "stage:" + key, topic: "stages", title: s.название || key, species: [], text: lines.filter(Boolean).join("\n"), origin: "file" });
    });
    if (Array.isArray(st.общие_правила) && st.общие_правила.length) {
      out.push({ id: "stage:rules", topic: "stages", title: "Общие правила сушки (закрытый контур)", species: [], text: renderValue(st.общие_правила), origin: "file" });
    }
    if (Array.isArray(st.контроль_готовности) && st.контроль_готовности.length) {
      out.push({ id: "stage:ready", topic: "stages", title: "Контроль готовности среза и упаковки", species: [], text: renderValue(st.контроль_готовности), origin: "file" });
    }
    (st.аварийные_протоколы || []).forEach((p, i) => {
      const text = p.шаги
        ? (p.признаки ? "Признаки:\n" + renderValue(p.признаки) + "\nЧто делать:\n" : "") + renderValue(p.шаги)
        : renderValue(p);
      out.push({ id: "stage:alarm" + i, topic: "stages", title: p.название || "Аварийный протокол", species: [], text, origin: "file" });
    });
    const fw = st.прошивка_MCGS;
    if (fw && typeof fw === "object") {
      const parts = [
        Array.isArray(fw.как_работают_Dehumi_и_PauseD) && "Как работают Dehumi(m) и PauseD(m):\n" + renderValue(fw.как_работают_Dehumi_и_PauseD),
        Array.isArray(fw.причины_пилы) && "Откуда «пила» на графике Parkside:\n" + renderValue(fw.причины_пилы),
      ].filter(Boolean);
      out.push({ id: "stage:mcgs-fw", topic: "stages", title: "Прошивка MCGS: Dehumi(m) / PauseD(m) и «пила»", species: [], text: (fw._статус ? `(${fw._статус})\n` : "") + parts.join("\n"), origin: "file" });
    }
    (st.открытия_производства || []).forEach((p, i) => {
      out.push({ id: "stage:find" + i, topic: "stages", title: p.название || "Открытие производства", species: [], text: renderValue(p.шаги || p), origin: "file" });
    });
    return out;
  }

  function equipmentEntries() {
    const eq = kb().equipment || {};
    const out = [];
    (eq.разделы || []).forEach((r, i) => {
      out.push({ id: "eq:section" + i, topic: "equipment", title: r.название, species: [], text: renderValue(r.пункты || []), origin: "file" });
    });
    (eq.узлы_камеры || []).forEach((u) => {
      const text = [u.описание, u.рабочая_точка && `Рабочая точка: ${u.рабочая_точка}`, u.дополнительно && `Дополнительно: ${u.дополнительно}`].filter(Boolean).join("\n");
      out.push({ id: "eq:node" + u.номер, topic: "equipment", title: u.название, species: [], text, origin: "file" });
    });
    if (Array.isArray(eq.рекуперация_тепла) && eq.рекуперация_тепла.length) {
      out.push({
        id: "eq:heat", topic: "equipment", title: "Рекуперация тепла (зима / лето)", species: [],
        text: eq.рекуперация_тепла.map((h) => `• ${h.режим}: ${h.описание}`).join("\n"), origin: "file",
      });
    }
    return out;
  }

  function marketingEntries() {
    const m = kb().marketing || {};
    const out = [];
    const prices = m.цены_евро_за_кг || {};
    const priceKeys = Object.keys(prices);
    if (priceKeys.length) {
      const text = priceKeys.map((k) => {
        const p = prices[k];
        const part = (label, v, status) => (v == null ? null : `${label} ${v}${status ? ` (${status})` : ""}`);
        return `• ${p.название || speciesName(k)}: ` + [
          part("сырьё", p.сырьё, p.сырьё_статус), part("опт", p.опт, p.опт_статус), part("полуопт", p.полуопт),
          part("вакуум", p.вакуум, p.вакуум_статус), part("розница", p.розница),
        ].filter(Boolean).join(", ");
      }).join("\n");
      out.push({ id: "mk:prices", topic: "marketing", title: "Цены, € за кг", species: priceKeys, text, origin: "file" });
    }
    if (Array.isArray(m.фасовка) && m.фасовка.length) {
      out.push({
        id: "mk:packs", topic: "marketing", title: "Форматы фасовки", species: [],
        text: m.фасовка.map((f) => `• ${f.название}: ${f.вес_кг} кг, упаковка ${f.стоимость_упаковки_евро} €`).join("\n"), origin: "file",
      });
    }
    if (Array.isArray(m.стандарт_упаковки) && m.стандарт_упаковки.length) {
      out.push({ id: "mk:packstd", topic: "marketing", title: "Стандарт упаковки", species: [], text: renderValue(m.стандарт_упаковки), origin: "file" });
    }
    const known = ["цены_евро_за_кг", "фасовка", "стандарт_упаковки"];
    Object.keys(m).filter((k) => !k.startsWith("_") && !known.includes(k)).forEach((k) => {
      const v = m[k];
      const empty = v == null || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
      out.push({
        id: "mk:" + k, topic: "marketing", title: humanKey(k)[0].toUpperCase() + humanKey(k).slice(1), species: [],
        text: empty ? "Пока пусто — добавьте знание с темой «Маркетинг»." : (v && v._статус ? `(${v._статус})\n` : "") + renderValue(v),
        empty, origin: "file",
      });
    });
    return out;
  }

  function noteEntries() {
    return getAllNotes().map((n) => {
      const sp = n.рыба ? [n.рыба] : [];
      const head = [n.тип || "заметка", n.рыба && speciesName(n.рыба), n.стадия].filter(Boolean).join(" • ");
      return {
        id: "note:" + n.id, topic: "notes", theme: n.тема, title: head.charAt(0).toUpperCase() + head.slice(1),
        species: sp, text: n.текст, origin: n._origin, note: n, status: n.статус, date: n.дата, source: n.источник,
      };
    });
  }

  function getEntries() {
    return [].concat(speciesEntries(), stagesEntries(), equipmentEntries(), marketingEntries(), noteEntries());
  }

  // ---------- Поиск ----------
  function queryStems(q) {
    return [...new Set(normalizeText(q)
      .split(/[^a-zа-я0-9.#]+/i)
      .map((w) => w.replace(/^\.+|\.+$/g, ""))
      .filter((w) => (/^\d/.test(w) ? w.length >= 2 : w.length >= 3) && !STOP_WORDS.has(w))
      .map((w) => (/^\d/.test(w) ? w : w.length > 5 ? w.slice(0, -2) : w.length > 3 ? w.slice(0, -1) : w)))];
  }

  function scoreEntry(e, stems, qSpecies) {
    const hayTitle = normalizeText(e.title);
    const hay = hayTitle + "\n" + normalizeText(e.text) + "\n" + normalizeText(e.theme || "");
    let score = 0;
    stems.forEach((s) => {
      if (hayTitle.includes(s)) score += 3;
      else if (hay.includes(s)) score += 1;
    });
    // бонус за рыбу — только записям именно про эту рыбу, а не общим таблицам по всем видам
    if (qSpecies.length && e.species && e.species.length <= 2 && e.species.some((k) => qSpecies.includes(k))) score += 4;
    return score;
  }

  function search(query, opts) {
    const o = opts || {};
    let list = getEntries();
    if (o.topic && o.topic !== "all") {
      list = list.filter((e) => e.topic === o.topic || (e.topic === "notes" && NOTE_THEME_TO_TOPIC[e.theme] === o.topic));
    }
    if (o.species) list = list.filter((e) => e.species && e.species.includes(o.species));
    const stems = queryStems(query);
    if (!stems.length) return list.map((e) => ({ ...e, score: 0 }));
    const qSpecies = detectSpecies(query);
    return list
      .map((e) => ({ ...e, score: scoreEntry(e, stems, qSpecies) }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // ---------- Контекст для ИИ ----------
  function entryToContext(e) {
    const meta = e.topic === "notes"
      ? ` (${[e.status, e.date, e.source].filter(Boolean).join(", ")})`
      : "";
    return `[${TOPICS[e.topic]}] ${e.title}${meta}\n${e.text}`;
  }

  // Подбирает из базы то, что относится к вопросу: карточки нужной рыбы, правила Памяти цеха, проверенные заметки и лучшие совпадения поиска
  function buildAiContext(question, currentSpeciesKey) {
    const all = getEntries().filter((e) => !e.empty);
    const qSpecies = detectSpecies(question);
    const targetSpecies = qSpecies.length ? qSpecies : (currentSpeciesKey ? [currentSpeciesKey === "GOBY" ? "ROUND_GOBY" : currentSpeciesKey] : []);
    const picked = [];
    const seen = new Set();
    let used = 0;
    const add = (e) => {
      if (!e || seen.has(e.id)) return;
      const block = entryToContext(e);
      if (used + block.length > AI_CONTEXT_BUDGET_CHARS) return;
      seen.add(e.id);
      picked.push(e);
      used += block.length + 2;
    };
    all.filter((e) => e.topic === "species" && targetSpecies.includes(e.species[0])).forEach(add);
    all.filter((e) => e.topic === "notes" && e.species.length && targetSpecies.includes(e.species[0])).forEach(add);
    const found = search(question);
    const minScore = found.some((e) => e.score >= 2) ? 2 : 1;
    found.filter((e) => e.score >= minScore).slice(0, 12).forEach(add);
    if (!picked.some((e) => e.id === "stage:rules")) add(all.find((e) => e.id === "stage:rules"));
    // вопросы про контроллер и график — всегда с открытием по прошивке MCGS («пила», чистая пауза)
    if (/mcgs|пил[аеуы]|пауз|dehumi|pause|humi|компрессор|parkside|паркс|график/i.test(String(question || ""))) add(all.find((e) => e.id === "stage:mcgs-fw"));

    const text = picked.length
      ? "=== БАЗА ЗНАНИЙ ЦЕХА ЮРМАЛЦИЕМС (главный источник для ответа) ===\n" +
        "Пометка «⚠️спорно» — значение не подтверждено технологом: если опираешься на него, предупреди.\n" +
        "Заметка со статусом «гипотеза» или «проверить» — не проверена практикой.\n\n" +
        picked.map(entryToContext).join("\n\n") +
        "\n=== КОНЕЦ БАЗЫ ЗНАНИЙ ==="
      : "";
    return { text, used: picked.map((e) => ({ id: e.id, title: `${TOPICS[e.topic]}: ${e.title}` })) };
  }

  // ---------- Gemini ----------
  function getGeminiKey() {
    try {
      const k = localStorage.getItem(GEMINI_KEY_STORAGE) || localStorage.getItem(GEMINI_KEY_LEGACY) || "";
      return k.replace(/^["'\s]+|["'\s]+$/g, "").replace(/[​-‍﻿]/g, "");
    } catch (e) {
      return "";
    }
  }
  function setGeminiKey(key) {
    try {
      const k = String(key || "").trim();
      if (k) localStorage.setItem(GEMINI_KEY_STORAGE, k);
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function callGemini(apiKey, prompt) {
    // В index.html есть полноценный вызов с перебором моделей и адресов — используем его, если он есть
    if (typeof global.callGeminiApiWithFallback === "function") {
      return global.callGeminiApiWithFallback(apiKey, [{ text: prompt }], "gemini-2.5-flash");
    }
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    const isAq = /^AQ\./i.test(apiKey);
    const urls = (m) => {
      const gl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
      const ap = `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent`;
      return isAq ? [ap, gl] : [gl, ap];
    };
    let lastErr = "Не удалось получить ответ от Gemini";
    for (const m of models) {
      for (const url of urls(m)) {
        try {
          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
          });
          const data = await resp.json().catch(() => ({}));
          const root = Array.isArray(data) ? data[0] : data;
          if (!resp.ok || (root && root.error)) {
            lastErr = (root && root.error && root.error.message) || `HTTP ${resp.status}`;
            continue;
          }
          const text = ((root && root.candidates && root.candidates[0] && root.candidates[0].content && root.candidates[0].content.parts) || [])
            .map((p) => p.text || "").join("").trim();
          if (text) return { text, modelUsed: m };
          lastErr = "Пустой ответ модели " + m;
        } catch (e) {
          lastErr = (e && e.message) || "Ошибка сети";
        }
      }
    }
    throw new Error(lastErr);
  }

  async function askAi(question, opts) {
    const o = opts || {};
    const apiKey = getGeminiKey();
    if (!apiKey) throw new Error("Нет ключа Gemini. Введите его в поле «Ключ Gemini» внизу страницы или во вкладке «Чат ИИ».");
    await ready;
    const ctx = buildAiContext(question, o.speciesKey);
    const prompt =
      "Ты — помощник технолога цеха вяления рыбы Юрмалциемс (камера AIM AGHD-250ELC, закрытый контур Cantoni, контроллер MCGS, вакуум KOMET PlusVac 25). " +
      "Отвечай по-русски, коротко и по делу.\n" +
      "Правила ответа:\n" +
      "1. Опирайся в первую очередь на базу знаний цеха ниже.\n" +
      "2. Если в базе ответа нет — так и скажи («в базе этого нет») и дай общий совет с пометкой «общее знание, не из базы».\n" +
      "3. Если записи базы противоречат друг другу или значение помечено «⚠️спорно» — назови оба варианта и посоветуй уточнить у технолога.\n" +
      "4. Никогда не предлагай паузы длиннее 1.5–2.0 ч на стадиях 1–3 (закрытый контур, рыба задыхается).\n" +
      "5. В конце одной строкой перечисли, на какие записи базы опирался.\n\n" +
      (ctx.text || "(База знаний пуста или не загрузилась.)") +
      "\n\nВопрос технолога: " + question;
    const res = await callGemini(apiKey, prompt);
    return { text: res.text, modelUsed: res.modelUsed, used: ctx.used };
  }

  // ---------- Единый источник правды (SSOT) и шина синхронизации партии ----------
  const SHARED_BATCH_STORAGE_KEY = "JURMALCIEMS_SHARED_BATCH_V1";
  const SYNC_CHANNEL_NAME = "JURMALCIEMS_SYNC_CHANNEL";

  function normalizeSpeciesKey(raw) {
    if (!raw) return "VIMBA";
    const s = String(raw).trim().toUpperCase();
    if (s === "VIMBA" || s === "ВИМБА" || s.includes("ВИМБ") || s.includes("СЫРТ") || s.includes("РЫБЕЦ")) return "VIMBA";
    if (s === "BREAM" || s === "ЛЕЩ" || s.includes("ЛЕЩ")) return "BREAM";
    if (s === "ROACH" || s === "ПЛОТВА" || s.includes("ПЛОТВ") || s.includes("ВОБЛ")) return "ROACH";
    if (s === "SMELT" || s === "КОРЮШКА" || s.includes("КОРЮШ")) return "SMELT";
    if (s === "PERCH" || s === "ОКУНЬ" || s.includes("ОКУН")) return "PERCH";
    if (s === "GOBY" || s === "ROUND_GOBY" || s === "ROUNDGOBY" || s === "БЫЧОК" || s.includes("БЫЧ")) return "ROUND_GOBY";
    return SPECIES_ORDER.includes(s) ? s : "VIMBA";
  }

  function toLowerSpeciesKey(raw) {
    const k = normalizeSpeciesKey(raw);
    return k === "ROUND_GOBY" ? "goby" : k.toLowerCase();
  }

  function getCanonicalSpecies(rawKey) {
    const key = normalizeSpeciesKey(rawKey);
    const spRoot = (kb().species && kb().species[key]) || {};
    const mktRoot = (kb().marketing && kb().marketing["цены_евро_за_кг"] && kb().marketing["цены_евро_за_кг"][key]) || {};
    const rawInfo = spRoot["сырьё"] || {};
    const saltInfo = spRoot["посол"] || {};
    const dryInfo = spRoot["сушка"] || {};
    const yieldInfo = spRoot["выход_процент"] || {};
    const loadInfo = spRoot["загрузка"] || {};
    const prodInfo = spRoot["готовый_продукт"] || {};

    const yieldMin = Number(yieldInfo["мин"]) || 58;
    const yieldMax = Number(yieldInfo["макс"]) || 62;
    const yieldNorm = Number(yieldInfo["норма"]) || +((yieldMin + yieldMax) / 2).toFixed(1);
    const saltingHours = Array.isArray(saltInfo["часы"]) ? saltInfo["часы"] : [48, 72];
    const tempMono = Array.isArray(dryInfo["температура_моно_C"]) ? dryInfo["температура_моно_C"] : [15, 16.5];
    const tempWithVimba = Array.isArray(dryInfo["температура_вместе_с_вимбой_C"]) ? dryInfo["температура_вместе_с_вимбой_C"] : tempMono;

    return {
      key,
      lowerKey: toLowerSpeciesKey(key),
      titleRu: spRoot["название"] || SPECIES_SHORT[key] || key,
      shortRu: SPECIES_SHORT[key] || key,
      subtitleRu: spRoot["кратко"] || "",
      caliber: rawInfo["калибр"] || "",
      pieceG: Number(rawInfo["масса_тушки_г"]) || 300,
      fatPercent: Number(rawInfo["жирность_процент"]) || 5.0,
      saltingHours,
      saltingRange: saltingHours.join("–"),
      saltKgPerTon: Number(saltInfo["соль_кг_на_тонну"]) || 140,
      soakHours: Array.isArray(saltInfo["отмочка_часы"]) ? saltInfo["отмочка_часы"] : [2, 3],
      tempRangeMonoC: tempMono,
      tempRangeWithVimbaC: tempWithVimba,
      tempRangeText: `${Number(tempMono[0]).toFixed(1)}–${Number(tempMono[1]).toFixed(1)}°C`,
      emergencyMaxTempC: Number(dryInfo["аварийный_максимум_C"]) || 18.5,
      minStartRhPercent: Number(dryInfo["минимальная_rH_на_старте_процент"]) || 58,
      durationDaysDesc: dryInfo["длительность"] || "",
      yieldMin,
      yieldMax,
      yieldNorm,
      yieldSoft: Number(yieldInfo["мягкая_вялка"]) || (yieldMax + 1),
      yieldDry: Number(yieldInfo["сухая_вялка"]) || (yieldMin - 6),
      yieldRange: `${yieldMin}–${yieldMax}%`,
      normRangeText: `Норма ${yieldMin}–${yieldMax}%`,
      trolleyCapKg: Number(loadInfo["кг_на_тележку"]) || 170,
      rodsPerTrolley: Number(loadInfo["прутков_на_тележку"]) || 25,
      fishPerRod: Number(loadInfo["рыб_на_пруток"]) || 15,
      aw: Number(prodInfo["активность_воды_aw"]) || 0.80,
      rawPriceEur: Number(mktRoot["сырьё"]) || 3.0,
      rawPriceStatus: mktRoot["сырьё_статус"] || "",
      wholesalePriceEur: Number(mktRoot["опт"]) || 10.0,
      wholesaleStatus: mktRoot["опт_статус"] || "",
      semiPriceEur: Number(mktRoot["полуопт"]) || 11.5,
      vacuumPriceEur: Number(mktRoot["вакуум"]) || 15.0,
      vacuumStatus: mktRoot["вакуум_статус"] || "",
      retailPriceEur: Number(mktRoot["розница"]) || Number(mktRoot["вакуум"]) || 15.0,
      bioFeatureRu: spRoot["особенности"] || "",
      prepChecklistRu: Array.isArray(spRoot["чек_лист_подготовки"]) ? spRoot["чек_лист_подготовки"] : [],
    };
  }

  function getAllCanonicalSpecies() {
    const out = {};
    SPECIES_ORDER.forEach((k) => { out[k] = getCanonicalSpecies(k); });
    out.GOBY = out.ROUND_GOBY;
    return out;
  }

  function syncAllPageSpecies(customTargets) {
    if (!kb().species) return;
    const t = customTargets || {};
    const armCoreFish = t.armCoreFish || (global.ARMCore && global.ARMCore.FISH_SPECIES);
    const pageFish = t.pageFish || global.FISH_SPECIES;
    const batchProfiles = t.batchProfiles || global.SPECIES_PROFILES;
    const thSpecies = t.thSpecies || global.TH_SPECIES || global.TRADE_SPECIES_DEFAULTS;
    const ctSpecies = t.ctSpecies || global.CT_SPECIES;
    const techSpecies = t.techSpecies || global.TECH_SPECIES_DATA;

    SPECIES_ORDER.forEach((k) => {
      const c = getCanonicalSpecies(k);
      const aliases = k === "ROUND_GOBY" ? ["ROUND_GOBY", "GOBY"] : [k];

      // 1. ARMCore.FISH_SPECIES (js/core-domain.js)
      if (armCoreFish) {
        aliases.forEach((ak) => {
          if (armCoreFish[ak]) {
            Object.assign(armCoreFish[ak], {
              titleRu: c.titleRu,
              shortRu: c.shortRu,
              standardYield: c.yieldNorm,
              yieldMinPercent: c.yieldMin,
              yieldMaxPercent: c.yieldMax,
              yieldPercentRange: c.yieldRange,
              fatContentPercent: c.fatPercent,
              tempRangeMonoC: c.tempRangeMonoC,
              tempRangeWithVimbaC: c.tempRangeWithVimbaC,
              emergencyMaxTempC: c.emergencyMaxTempC,
              defaultRawPrice: c.rawPriceEur,
              defaultWholesalePrice: c.wholesalePriceEur,
              defaultVacuumPrice: c.vacuumPriceEur,
              saltKgPerTon: c.saltKgPerTon,
              trolleyCapKg: c.trolleyCapKg,
            });
          }
        });
      }

      // 2. FISH_SPECIES (index.html)
      if (pageFish && pageFish !== armCoreFish) {
        aliases.forEach((ak) => {
          if (pageFish[ak]) {
            Object.assign(pageFish[ak], {
              titleRu: c.titleRu,
              subtitleRu: c.subtitleRu || pageFish[ak].subtitleRu,
              tempRangeMonoC: c.tempRangeMonoC,
              tempRangeWithVimbaC: c.tempRangeWithVimbaC,
              emergencyMaxTempC: c.emergencyMaxTempC,
              minStartRhPercent: c.minStartRhPercent,
              durationDaysDesc: c.durationDaysDesc || pageFish[ak].durationDaysDesc,
              yieldMinPercent: c.yieldMin,
              yieldMaxPercent: c.yieldMax,
              yieldPercentRange: c.yieldRange,
              bioFeatureRu: c.bioFeatureRu || pageFish[ak].bioFeatureRu,
              prepChecklistRu: c.prepChecklistRu.length ? c.prepChecklistRu : pageFish[ak].prepChecklistRu,
            });
          }
        });
      }

      // 3. SPECIES_PROFILES (batch-cockpit.html)
      if (batchProfiles && batchProfiles[c.lowerKey]) {
        Object.assign(batchProfiles[c.lowerKey], {
          defaultYield: c.yieldNorm,
          normRange: c.normRangeText,
          pieceG: c.pieceG,
          caliber: c.caliber || batchProfiles[c.lowerKey].caliber,
          saltingRange: c.saltingRange,
          saltKgPerTon: c.saltKgPerTon,
          aw: c.aw,
          priceEurPerKg: c.vacuumPriceEur,
           wholesaleEurPerKg: c.wholesalePriceEur,
          rawCostPerKg: c.rawPriceEur,
          tempRange: c.tempRangeText,
          trolleyCapKg: c.trolleyCapKg,
          rodsPerTrolley: c.rodsPerTrolley,
        });
      }

      // 4. TH_SPECIES / TRADE_SPECIES_DEFAULTS (telefon.html / index.html)
      if (thSpecies) {
        aliases.forEach((ak) => {
          if (thSpecies[ak]) {
            Object.assign(thSpecies[ak], {
              yieldPct: c.yieldNorm,
              yieldRange: c.yieldRange,
              defaultRawPrice: c.rawPriceEur,
              defaultWholesale: c.wholesalePriceEur,
              vacuumPrice: c.vacuumPriceEur,
            });
          }
        });
      }

      // 5. CT_SPECIES (telefon.html)
      if (ctSpecies) {
        aliases.forEach((ak) => {
          if (ctSpecies[ak]) {
            Object.assign(ctSpecies[ak], {
              defaultYield: c.yieldNorm,
              softYield: c.yieldSoft,
              dryYield: c.yieldDry,
              saltKgTon: c.saltKgPerTon,
              cartCapKg: c.trolleyCapKg,
              rodsCart: c.rodsPerTrolley,
            });
          }
        });
      }

      // 6. TECH_SPECIES_DATA (index.html)
      if (techSpecies) {
        aliases.forEach((ak) => {
          if (techSpecies[ak]) {
            if (techSpecies[ak].curedYield) {
              Object.assign(techSpecies[ak].curedYield, {
                min: c.yieldMin,
                max: c.yieldMax,
                default: c.yieldNorm,
                soft: c.yieldSoft,
                dry: c.yieldDry,
              });
            }
            Object.assign(techSpecies[ak], {
              saltKgPerTon: c.saltKgPerTon,
              cartCapacityKg: c.trolleyCapKg,
              rodsPerCart: c.rodsPerTrolley,
              fishPerRod: c.fishPerRod,
            });
          }
        });
      }
    });
  }

  // ---------- Живая синхронизация активной партии между всеми экранами ----------
  const batchListeners = new Set();
  const batchChannel = ("BroadcastChannel" in global) ? new BroadcastChannel(SYNC_CHANNEL_NAME) : null;

  function getSharedBatch() {
    const saved = readJson(SHARED_BATCH_STORAGE_KEY, null);
    const spKey = normalizeSpeciesKey((saved && saved.speciesKey) || "VIMBA");
    const c = kb().species ? getCanonicalSpecies(spKey) : null;
    const defYield = (c && c.yieldNorm) || 61.5;
    return {
      speciesKey: spKey,
      lowerKey: toLowerSpeciesKey(spKey),
      rawKg: Math.min(10000, Math.max(50, Number(saved && saved.rawKg) || 1850)),
      yieldPct: Number(saved && saved.yieldPct) || defYield,
      mode: (saved && saved.mode) === "mixed" ? "mixed" : "mono",
      updatedAt: Number(saved && saved.updatedAt) || 0,
    };
  }

  function notifyBatchListeners(batch, source) {
    batchListeners.forEach((fn) => {
      try { fn(batch, source); } catch (e) { console.warn("[ARM_KB batch listener]", e); }
    });
  }

  function setSharedBatch(patch, source) {
    if (!patch || typeof patch !== "object") return getSharedBatch();
    const cur = getSharedBatch();
    const nextSpKey = patch.speciesKey ? normalizeSpeciesKey(patch.speciesKey) : cur.speciesKey;
    const spChanged = nextSpKey !== cur.speciesKey;
    const c = kb().species ? getCanonicalSpecies(nextSpKey) : null;

    let nextYield = cur.yieldPct;
    if (patch.yieldPct !== undefined && patch.yieldPct !== null && !isNaN(Number(patch.yieldPct))) {
      nextYield = Number(patch.yieldPct);
    } else if (spChanged && c && c.yieldNorm) {
      nextYield = c.yieldNorm;
    }

    const nextRaw = (patch.rawKg !== undefined && patch.rawKg !== null && !isNaN(Number(patch.rawKg)))
      ? Math.min(10000, Math.max(50, Math.round(Number(patch.rawKg))))
      : cur.rawKg;

    const next = {
      speciesKey: nextSpKey,
      lowerKey: toLowerSpeciesKey(nextSpKey),
      rawKg: nextRaw,
      yieldPct: +Number(nextYield).toFixed(1),
      mode: patch.mode ? (patch.mode === "mixed" ? "mixed" : "mono") : cur.mode,
      updatedAt: Date.now(),
    };

    writeJson(SHARED_BATCH_STORAGE_KEY, next);

    const msg = {
      type: "SYNC_BATCH",
      speciesKey: next.speciesKey,
      lowerKey: next.lowerKey,
      weightKg: next.rawKg,
      rawKg: next.rawKg,
      yieldPct: next.yieldPct,
      mode: next.mode,
      source: source || "arm-kb",
      updatedAt: next.updatedAt,
    };

    if (batchChannel) {
      try { batchChannel.postMessage(msg); } catch (e) {}
    }
    if (global.parent && global.parent !== global) {
      try { global.parent.postMessage(msg, "*"); } catch (e) {}
    }
    if (global.document && typeof global.document.querySelectorAll === "function") {
      global.document.querySelectorAll("iframe").forEach((ifr) => {
        try { if (ifr.contentWindow) ifr.contentWindow.postMessage(msg, "*"); } catch (e) {}
      });
    }

    notifyBatchListeners(next, source || "local");
    return next;
  }

  function handleIncomingBatchMessage(data) {
    if (!data || data.type !== "SYNC_BATCH") return;
    const cur = getSharedBatch();
    const spKey = data.speciesKey ? normalizeSpeciesKey(data.speciesKey) : cur.speciesKey;
    const rawKg = Number(data.rawKg || data.weightKg || cur.rawKg) || 1850;
    const c = kb().species ? getCanonicalSpecies(spKey) : null;
    const yieldPct = Number(data.yieldPct) || (spKey !== cur.speciesKey && c ? c.yieldNorm : cur.yieldPct);
    const next = {
      speciesKey: spKey,
      lowerKey: toLowerSpeciesKey(spKey),
      rawKg: Math.min(10000, Math.max(50, Math.round(rawKg))),
      yieldPct: +Number(yieldPct).toFixed(1),
      mode: data.mode === "mixed" ? "mixed" : cur.mode,
      updatedAt: Number(data.updatedAt) || Date.now(),
    };
    writeJson(SHARED_BATCH_STORAGE_KEY, next);
    notifyBatchListeners(next, data.source || "remote");
  }

  if (batchChannel) {
    batchChannel.addEventListener("message", (ev) => {
      if (ev && ev.data) handleIncomingBatchMessage(ev.data);
    });
  }
  if (typeof global.addEventListener === "function") {
    global.addEventListener("message", (ev) => {
      if (ev && ev.data && ev.data.type === "SYNC_BATCH") {
        handleIncomingBatchMessage(ev.data);
      }
    });
    global.addEventListener("storage", (ev) => {
      if (ev && ev.key === SHARED_BATCH_STORAGE_KEY && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          if (parsed) notifyBatchListeners(parsed, "storage");
        } catch (e) {}
      }
    });
  }

  function onBatchChange(fn) {
    if (typeof fn === "function") batchListeners.add(fn);
    return () => batchListeners.delete(fn);
  }

  ready.then(() => {
    syncAllPageSpecies();
    if (global.document && global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", () => syncAllPageSpecies());
    }
  });

  // ---------- Себестоимость партии (marketing.js → «себестоимость») ----------
  // Значения из базы знаний; технолог может поправить их в программе — правки хранятся в localStorage этого компьютера.
  const COST_OVERRIDES_KEY = "JURMALCIEMS_COST_OVERRIDES_V1";
  function getCostOverrides() {
    try { const o = JSON.parse(global.localStorage.getItem(COST_OVERRIDES_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; }
  }
  // patch: { raw: { VIMBA: 1.9 }, tariff: 0.2, ... }; null — вернуть значение базы. opts.silent — без события (ползунки, которые сами перерисуют экран)
  function setCostOverrides(patch, opts) {
    const cur = getCostOverrides();
    const next = Object.assign({}, cur, patch || {});
    if (patch && patch.raw) {
      const raw = {};
      Object.keys(patch.raw).forEach((k) => { raw[normalizeSpeciesKey(k)] = patch.raw[k]; });
      next.raw = Object.assign({}, cur.raw || {}, raw);
    }
    Object.keys(next).forEach((k) => { if (next[k] === null || next[k] === "") delete next[k]; });
    if (next.raw) Object.keys(next.raw).forEach((k) => { if (!(Number(next.raw[k]) > 0)) delete next.raw[k]; });
    try { global.localStorage.setItem(COST_OVERRIDES_KEY, JSON.stringify(next)); } catch (e) {}
    if (!(opts && opts.silent)) { try { global.dispatchEvent(new CustomEvent("arm-cost-changed")); } catch (e) {} }
    return next;
  }
  function resetCostOverrides() {
    try { global.localStorage.removeItem(COST_OVERRIDES_KEY); } catch (e) {}
    try { global.dispatchEvent(new CustomEvent("arm-cost-changed")); } catch (e) {}
  }
  function getCostBase(opts) {
    const cs = (kb().marketing && kb().marketing["себестоимость"]) || {};
    const salt = cs["соль"] || {}, el = cs["электроэнергия"] || {}, pk = cs["упаковка"] || {};
    const pw = el["мощность_кВт"] || {};
    const p1 = pw["стадия_1_два_контура"] || {}, p2 = pw["стадии_2_4_один_контур"] || {};
    const vac = pk["вакуум_KOMET"] || {}, prem = pk["премиум_штучный"] || {}, cube = pk["еврокуб"] || {};
    const o = opts && opts.ignoreOverrides ? {} : getCostOverrides();
    const n = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
    const pick = (key, kbVal, dflt) => (o[key] != null && Number(o[key]) > 0 ? Number(o[key]) : n(kbVal, dflt));
    const kgRange = Array.isArray(cube["кг_на_куб"]) ? cube["кг_на_куб"] : [250, 300];
    const shRange = Array.isArray(cube["листов_картона_на_куб"]) ? cube["листов_картона_на_куб"] : [4, 5];
    const base = {
      saltEurKg: pick("saltEurKg", salt["евро_за_кг"], 0.25),
      saltKgPer100: pick("saltKgPer100", salt["кг_на_100_кг_сырья"], 16),
      tariff: pick("tariff", el["тариф_евро_за_кВт_ч"], 0.18),
      power: {
        st1Dry: n(p1["сушка"], 22.5), st1Pause: n(p1["пауза"], 2.1),
        dry: n(p2["сушка"], 18.0), pause: n(p2["пауза"], 2.0),
      },
      vac: {
        fishPerPack: n(vac["тушек_в_пакете"], 3), packKg: n(vac["вес_пакета_кг"], 0.85),
        eurPerPack: pick("vacEurPack", vac["евро_за_пакет"], 0.45), packsPerMin: pick("vacPacksPerMin", vac["пакетов_в_минуту"], 2),
      },
      prem: { pcKg: n(prem["вес_шт_кг"], 0.3), eurPerPc: pick("premEurPc", prem["евро_за_шт"], 0.42) },
      cube: {
        kgMin: n(kgRange[0], 250), kgMax: n(kgRange[1], 300),
        sheetsMin: n(shRange[0], 4), sheetsMax: n(shRange[1], 5),
        eurPerSheet: pick("sheetEur", cube["евро_за_лист"], 0.8),
      },
      overrides: o,
      fromKb: !!cs["соль"],
    };
    base.cube.kgPerCube = Math.round((base.cube.kgMin + base.cube.kgMax) / 2);
    base.cube.eurPerCube = +(base.cube.sheetsMax * base.cube.eurPerSheet).toFixed(2);
    return base;
  }
  function getRawPrice(speciesKey) {
    const key = normalizeSpeciesKey(speciesKey);
    const o = getCostOverrides();
    if (o.raw && Number(o.raw[key]) > 0) return { eur: Number(o.raw[key]), edited: true };
    const c = getCanonicalSpecies(key);
    return { eur: c.rawPriceEur, edited: false };
  }

  // Часы стадий для расчета энергии: длительность и режим работа/пауза — из stages.js.
  // Стадия 3 без длительности в базе → «Сутки 5–6» = 48 ч; Стадия 4: стандарт 24–48 ч → 36 ч, холодный финиш +8..+10°C → 24 ч.
  function getCycleEnergy(opts) {
    const o = opts || {};
    const cb = getCostBase();
    const st = (kb().stages && kb().stages.стадии) || {};
    const dflt = { STAGE_1: [30, 3.5, 1], STAGE_2: [48, 3, 1.5], STAGE_3: [48, 2.5, 2], STAGE_4: [36, 1, 4] };
    const stages = ["STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"].map((key, i) => {
      const s = st[key] || {};
      let hours = Number(s.длительность_ч_по_умолчанию) > 0 ? Number(s.длительность_ч_по_умолчанию) : dflt[key][0];
      if (key === "STAGE_4") hours = o.stage4Mode === "COLD" ? 24 : 36;
      const w = Number(s.работа_ч) > 0 ? Number(s.работа_ч) : dflt[key][1];
      const p = Number(s.пауза_ч) > 0 ? Number(s.пауза_ч) : dflt[key][2];
      const dryH = hours * w / (w + p), pauseH = hours - dryH;
      const pDry = i === 0 ? cb.power.st1Dry : cb.power.dry;
      const pPause = i === 0 ? cb.power.st1Pause : cb.power.pause;
      const kWh = dryH * pDry + pauseH * pPause;
      return { key, number: i + 1, hours, workH: w, pauseHPerCycle: p, dryH, pauseH, pDry, pPause, kWh };
    });
    const kWh = stages.reduce((s, x) => s + x.kWh, 0);
    const hours = stages.reduce((s, x) => s + x.hours, 0);
    return { stages, kWh, hours, eur: kWh * cb.tariff, tariff: cb.tariff };
  }

  // Раздельная выгрузка: элита в вакуум KOMET + остальное в еврокубы с картоном
  function splitUnload(outKg, vacShare) {
    const cb = getCostBase();
    const share = Math.max(0, Math.min(1, Number(vacShare) || 0));
    const vacKg = Math.round(outKg * share);
    const packs = Math.round(vacKg / cb.vac.packKg);
    const vacMin = packs / cb.vac.packsPerMin;
    const bulkKg = Math.max(0, Math.round(outKg - vacKg));
    const cubes = bulkKg > 0 ? Math.ceil(bulkKg / cb.cube.kgPerCube) : 0;
    const cubesMin = bulkKg > 0 ? Math.ceil(bulkKg / cb.cube.kgMax) : 0;
    const cubesMax = bulkKg > 0 ? Math.ceil(bulkKg / cb.cube.kgMin) : 0;
    return {
      share, vacKg, packs, fish: packs * cb.vac.fishPerPack, vacMin, vacCost: packs * cb.vac.eurPerPack,
      bulkKg, cubes, cubesMin, cubesMax, kgPerCubeNow: cubes ? Math.round(bulkKg / cubes) : 0,
      sheetsMin: cubes * cb.cube.sheetsMin, sheetsMax: cubes * cb.cube.sheetsMax, cubeCost: cubes * cb.cube.eurPerCube,
      base: cb,
    };
  }

  // Деньги партии: выручка по каналу − (сырьё + соль + энергия + упаковка)
  // channel: wholesale | semi | vacuum | retail | mix (mix = доля vacShare в вакуум по цене вакуума, остальное — опт в еврокубах)
  function computeBatchEconomics(opts) {
    const o = opts || {};
    const c = getCanonicalSpecies(o.speciesKey);
    const cb = getCostBase();
    const rawKg = Math.max(0, Number(o.rawKg) || 0);
    const outKg = Math.max(0, Number(o.outKg) || 0);
    const rawPrice = getRawPrice(c.key);
    const rawCost = rawKg * rawPrice.eur;
    const saltKg = rawKg * cb.saltKgPer100 / 100;
    const saltCost = saltKg * cb.saltEurKg;
    const energy = getCycleEnergy({ stage4Mode: o.stage4Mode });
    const ch = o.channel || "vacuum";
    let revenue = 0, packCost = 0, packText = "";
    const cubesFor = (kg) => (kg > 0 ? Math.ceil(kg / cb.cube.kgPerCube) : 0);
    if (ch === "vacuum") {
      const packs = Math.round(outKg / cb.vac.packKg);
      revenue = outKg * c.vacuumPriceEur; packCost = packs * cb.vac.eurPerPack;
      packText = `${packs.toLocaleString("ru-RU")} пак. KOMET × ${cb.vac.eurPerPack.toFixed(2)} €`;
    } else if (ch === "retail") {
      const pcs = Math.round(outKg / cb.prem.pcKg);
      revenue = outKg * c.retailPriceEur; packCost = pcs * cb.prem.eurPerPc;
      packText = `${pcs.toLocaleString("ru-RU")} шт премиум × ${cb.prem.eurPerPc.toFixed(2)} €`;
    } else if (ch === "mix") {
      const sp = splitUnload(outKg, o.vacShare);
      revenue = sp.vacKg * c.vacuumPriceEur + sp.bulkKg * c.wholesalePriceEur;
      packCost = sp.vacCost + sp.cubeCost;
      packText = `${sp.packs} пак. + ${sp.cubes} еврокуб.`;
    } else {
      const cubes = cubesFor(outKg);
      revenue = outKg * (ch === "semi" ? c.semiPriceEur : c.wholesalePriceEur); packCost = cubes * cb.cube.eurPerCube;
      packText = `${cubes} еврокуб. × ${cb.cube.eurPerCube.toFixed(2)} €`;
    }
    const totalCost = rawCost + saltCost + energy.eur + packCost;
    return {
      species: c, channel: ch, rawKg, outKg, revenue, rawPrice, rawCost, saltKg, saltCost, energy, packCost, packText,
      totalCost, profit: revenue - totalCost, costPerKgOut: outKg > 0 ? totalCost / outKg : 0,
      energyPerKgOut: outKg > 0 ? energy.eur / outKg : 0, base: cb,
    };
  }

  global.ARM_KB = {
    getCostBase,
    getCostOverrides,
    setCostOverrides,
    resetCostOverrides,
    getRawPrice,
    getCycleEnergy,
    splitUnload,
    computeBatchEconomics,
    ready,
    loadErrors,
    TOPICS,
    NOTE_STATUSES,
    SPECIES_ORDER,
    speciesName,
    detectSpecies,
    normalizeSpeciesKey,
    toLowerSpeciesKey,
    getCanonicalSpecies,
    getAllCanonicalSpecies,
    syncAllPageSpecies,
    getSharedBatch,
    setSharedBatch,
    onBatchChange,
    getEntries,
    search,
    getAllNotes,
    saveNote,
    deleteNote,
    exportNotesFile,
    importText,
    buildAiContext,
    getGeminiKey,
    setGeminiKey,
    askAi,
  };
})(window);
