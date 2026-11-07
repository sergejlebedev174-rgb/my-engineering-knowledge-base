// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС
// СЛОЙ УДОБСТВА И ПОЛИРОВКИ ИНТЕРФЕЙСА (пара к css/ui-polish.css)
// • длинные тексты сворачиваются до 3 строк с кнопкой «Подробнее»;
//   программа часто перерисовывает блоки — сворачивание срабатывает сразу,
//   без мигания, а развёрнутые тексты запоминаются
// • плавная смена вкладок, заглушка-шиммер пока грузится модуль-iframe
// • аккуратные подсказки вместо системных title, кнопка «наверх»
// Подключается в index.html, telefon.html, knowledge.html. Выключатель: ?ui=0
// ==========================================================================
(function () {
  "use strict";
  if (window.ArmUi || /[?&]ui=0\b/.test(location.search)) return;

  const html = document.documentElement;
  html.classList.add("uix-on");
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverable = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  function storeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // =====================================================================
  // 1. Длинные тексты: 3 строки + «Подробнее»
  // =====================================================================
  const OPEN_KEY = "JURMALCIEMS_UI_OPEN_V1";
  let openList = [];
  try { openList = JSON.parse(storeGet(OPEN_KEY) || "[]"); } catch (e) {}
  const openSet = new Set(Array.isArray(openList) ? openList : []);
  function rememberOpen(hash, open) {
    if (!hash) return;
    if (open) openSet.add(hash); else openSet.delete(hash);
    storeSet(OPEN_KEY, JSON.stringify([...openSet].slice(-300)));
  }

  const LINES = 3;
  const CANDIDATES = "p, div, li, span, dd, blockquote";
  const INLINE_TAGS = /^(B|STRONG|I|EM|SPAN|A|BR|CODE|SMALL|SUP|SUB|MARK|U|S|ABBR|KBD|TIME|IMG|FONT)$/;
  // где сворачивать нельзя: элементы управления, таблицы, чат, свои «зажимы» страниц, компактный дашборд
  const SKIP = "button, input, textarea, select, label, table, pre, svg, [contenteditable='true'], [data-uix-keep], .uix-keep, .uix-tip, " +
    "#chat-messages-box, .chat-box, .entry-text, .answer, .ck-bento-grid, .toast, .toast-popup, .fx-live3d-layer, .fx-callout, nav, header";
  const minLen = () => (innerWidth <= 640 ? 170 : 240);

  function hashText(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36) + "." + s.length;
  }
  function plainText(el) {
    let s = "";
    el.childNodes.forEach((n) => { if (!(n.nodeType === 1 && n.classList.contains("uix-more"))) s += n.textContent; });
    return s.replace(/\s+/g, " ").trim();
  }
  // «лист»: внутри только строчные элементы (жирный, ссылки, переносы) — текст можно резать по строкам
  function isLeaf(el) {
    for (const c of el.children) {
      if (c.classList.contains("uix-more")) continue;
      if (!INLINE_TAGS.test(c.tagName)) return false;
      if (c.tagName !== "BR") {
        const d = getComputedStyle(c).display;
        if (d === "block" || d === "flex" || d === "grid" || d === "table" || d === "list-item") return false;
      }
    }
    return true;
  }

  // скрытые сейчас блоки (неактивная вкладка, закрытое окно) свернём, когда они появятся
  const deferIO = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { deferIO.unobserve(e.target); tryClamp(e.target); } }), { rootMargin: "2000px 0px" })
    : null;

  function unclamp(el) {
    el.classList.remove("uix-clamp", "uix-open");
    ["--uix-h", "--uix-pb", "--uix-cur"].forEach((p) => el.style.removeProperty(p));
    const b = el.querySelector(":scope > .uix-more");
    if (b) b.remove();
    delete el.dataset.uixDone;
    delete el.dataset.uixHash;
  }

  function tryClamp(el) {
    if (el.dataset.uixDone || !el.isConnected) return;
    const text = plainText(el);
    if (text.length < minLen()) return;
    if (el.closest(SKIP) || !isLeaf(el)) { el.dataset.uixDone = "skip"; return; }
    const cs = getComputedStyle(el);
    if (cs.display === "inline" || cs.display === "contents") { el.dataset.uixDone = "skip"; return; }
    if (el.offsetParent === null && cs.position !== "fixed") { if (deferIO) deferIO.observe(el); return; }
    const fs = parseFloat(cs.fontSize) || 13;
    const lh = parseFloat(cs.lineHeight) || fs * 1.4;
    const pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
    const clampH = Math.round(pt + lh * LINES + Math.min(pb, 6));
    // прятать имеет смысл, только если под катом остаётся хотя бы пара строк
    if (el.scrollHeight <= clampH + lh * 1.6) { el.dataset.uixDone = "short"; return; }
    const hash = hashText(text);
    el.dataset.uixDone = "1";
    el.dataset.uixHash = hash;
    if (cs.position === "static") el.style.position = "relative";
    el.style.setProperty("--uix-h", clampH + "px");
    el.style.setProperty("--uix-pb", pb + "px");
    el.classList.add("uix-clamp");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "uix-more";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span>Подробнее</span><i></i>";
    el.appendChild(btn);
    if (openSet.has(hash)) setOpen(el, true, false);
  }

  // мгновенно поставить конечную высоту (без перехода) — если анимация не доиграла
  function snap(el, value) {
    el.style.transition = "none";
    el.style.setProperty("--uix-cur", value);
    void el.offsetHeight;
    el.style.transition = "";
  }

  function setOpen(el, open, animate) {
    const btn = el.querySelector(":scope > .uix-more");
    if (btn) {
      btn.setAttribute("aria-expanded", String(open));
      btn.firstChild.textContent = open ? "Свернуть" : "Подробнее";
    }
    if (!animate || reduce) {
      el.classList.toggle("uix-open", open);
      el.style.setProperty("--uix-cur", open ? "none" : "var(--uix-h)");
      return;
    }
    if (open) {
      el.style.setProperty("--uix-cur", el.offsetHeight + "px");
      el.classList.add("uix-open");
      const full = el.scrollHeight;
      void el.offsetHeight;
      el.style.setProperty("--uix-cur", full + "px");
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        el.removeEventListener("transitionend", done);
        if (el.classList.contains("uix-open")) snap(el, "none");
      };
      el.addEventListener("transitionend", done);
      setTimeout(done, 700);
    } else {
      // от текущей высоты к высоте «зажима» — точными числами, без ожидания следующего кадра
      const target = el.style.getPropertyValue("--uix-h") || "4.6em";
      el.style.transition = "none";
      el.style.setProperty("--uix-cur", el.offsetHeight + "px");
      void el.offsetHeight;
      el.style.transition = "";
      el.classList.remove("uix-open");
      void el.offsetHeight;
      el.style.setProperty("--uix-cur", target);
      // страховка: если анимация не доиграла (вкладка в фоне), фиксируем конечное состояние
      setTimeout(() => { if (!el.classList.contains("uix-open")) snap(el, target); }, 700);
    }
  }

  // перехват на этапе погружения: клик по «Подробнее» не должен запускать обработчики карточки
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".uix-more");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const el = btn.parentElement;
    const open = !el.classList.contains("uix-open");
    setOpen(el, open, true);
    rememberOpen(el.dataset.uixHash, open);
  }, true);

  function consider(el) {
    if (el.dataset.uixDone || el.childElementCount > 40) return;
    if ((el.textContent || "").length < minLen()) return;
    tryClamp(el);
  }
  function scan(root) {
    if (!root || root.nodeType !== 1 || root.closest(".uix-tip")) return;
    if (root.matches(CANDIDATES)) consider(root);
    root.querySelectorAll(CANDIDATES).forEach(consider);
  }

  // программа перерисовывает блоки через innerHTML — сворачиваем новые сразу (в микрозадаче, до отрисовки)
  const pending = new Set();
  let scheduled = false;
  function schedule(n) {
    pending.add(n);
    if (!scheduled) { scheduled = true; queueMicrotask(flush); }
  }
  function flush() {
    scheduled = false;
    const list = [...pending];
    pending.clear();
    list.forEach((n) => { if (n.isConnected) scan(n); });
  }
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (!t || t.closest(".uix-more, .uix-tip")) continue;
      const host = t.closest("[data-uix-done]");
      if (host) {
        if (host.dataset.uixDone === "1") {
          // текст внутри свёрнутого блока заменили целиком — кнопка пропала, сворачиваем заново
          if (!host.querySelector(":scope > .uix-more")) { unclamp(host); schedule(host); }
        } else {
          delete host.dataset.uixDone;
          schedule(host);
        }
      }
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => { if (n.nodeType === 1 && !n.classList.contains("uix-more")) schedule(n); });
      }
    }
  });

  // =====================================================================
  // 2. Плавная смена вкладок (index.html)
  // =====================================================================
  function watchPanes() {
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      let was = pane.classList.contains("active");
      new MutationObserver(() => {
        const now = pane.classList.contains("active");
        if (now && !was) {
          scan(pane);
          if (!reduce) {
            pane.classList.remove("uix-enter");
            void pane.offsetWidth;
            pane.classList.add("uix-enter");
            setTimeout(() => pane.classList.remove("uix-enter"), 600);
          }
        }
        was = now;
      }).observe(pane, { attributes: true, attributeFilter: ["class"] });
    });
  }

  // =====================================================================
  // 3. Заглушка-шиммер, пока грузится модуль во вкладке (iframe)
  // =====================================================================
  function markFrame(f) {
    const src = f.getAttribute("src");
    if (!src || src === "about:blank" || f.dataset.uixSkel === src) return;
    f.dataset.uixSkel = src;
    const host = f.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    let sk = host.querySelector(":scope > .uix-skel");
    if (!sk) {
      sk = document.createElement("div");
      sk.className = "uix-skel";
      sk.innerHTML = "<span><i></i>Загрузка модуля…</span>";
      host.appendChild(sk);
    }
    sk.classList.remove("uix-gone");
    let gone = false;
    const done = () => {
      if (gone) return;
      gone = true;
      sk.classList.add("uix-gone");
      setTimeout(() => { if (sk.classList.contains("uix-gone")) sk.remove(); }, 550);
    };
    f.addEventListener("load", done, { once: true });
    setTimeout(done, 9000);
  }
  function watchFrames() {
    new MutationObserver((muts) => muts.forEach((m) => {
      if (m.type === "attributes" && m.target.tagName === "IFRAME") markFrame(m.target);
      else if (m.type === "childList") m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.tagName === "IFRAME") markFrame(n);
        else n.querySelectorAll("iframe[src]").forEach(markFrame);
      });
    })).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  }

  // =====================================================================
  // 4. Подсказки вместо системных title (только мышь)
  // =====================================================================
  function initTips() {
    if (!hoverable) return;
    const tip = document.createElement("div");
    tip.className = "uix-tip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    let cur = null, timer = 0;
    function hide() {
      clearTimeout(timer);
      tip.classList.remove("on");
      if (cur) {
        if (cur.dataset.uixTitle != null && !cur.hasAttribute("title")) cur.setAttribute("title", cur.dataset.uixTitle);
        delete cur.dataset.uixTitle;
        cur = null;
      }
    }
    function show(el, text) {
      if (!el.isConnected || el !== cur) return;
      tip.textContent = text;
      tip.classList.remove("below");
      tip.style.left = "0px";
      tip.style.top = "0px";
      const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
      let x = r.left + r.width / 2 - t.width / 2;
      x = Math.max(8, Math.min(innerWidth - t.width - 8, x));
      let y = r.top - t.height - 10;
      if (y < 8) { y = r.bottom + 10; tip.classList.add("below"); }
      tip.style.left = x.toFixed(0) + "px";
      tip.style.top = y.toFixed(0) + "px";
      tip.style.setProperty("--ax", Math.max(12, Math.min(t.width - 12, r.left + r.width / 2 - x)).toFixed(0) + "px");
      tip.classList.add("on");
    }
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const el = e.target.closest && e.target.closest("[title]");
      if (!el || el === cur || el === document.documentElement || el === document.body) return;
      hide();
      const text = (el.getAttribute("title") || "").trim();
      if (text.length < 2) return;
      cur = el;
      el.dataset.uixTitle = el.getAttribute("title");
      el.removeAttribute("title"); // иначе поверх всплывёт ещё и системная подсказка
      timer = setTimeout(() => show(el, text), 380);
    });
    document.addEventListener("pointerout", (e) => { if (cur && !cur.contains(e.relatedTarget)) hide(); });
    document.addEventListener("pointermove", () => { if (cur && !cur.isConnected) hide(); }, { passive: true });
    ["pointerdown", "scroll", "keydown", "blur"].forEach((ev) => window.addEventListener(ev, hide, true));
  }

  // =====================================================================
  // 5. Кнопка «наверх» на длинных страницах
  // =====================================================================
  function initTopButton() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "uix-top";
    b.setAttribute("aria-label", "Наверх");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 14 12 8 18 14"/></svg>';
    document.body.appendChild(b);
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
    // поднимаемся над закреплёнными нижними панелями (мобильная навигация, капсула голоса, тосты)
    function place() {
      let bottom = 24;
      for (const x of [innerWidth - 30, innerWidth - 90]) {
        for (const y of [innerHeight - 8, innerHeight - 40, innerHeight - 90]) {
          document.elementsFromPoint(x, y).forEach((el) => {
            if (el === b || b.contains(el)) return;
            for (let n = el; n && n !== document.body && n !== html; n = n.parentElement) {
              const p = getComputedStyle(n).position;
              if (p === "fixed" || p === "sticky") {
                const r = n.getBoundingClientRect();
                if (r.bottom >= innerHeight - 2 && r.height < innerHeight * 0.4) bottom = Math.max(bottom, innerHeight - r.top + 12);
                break;
              }
            }
          });
        }
      }
      b.style.bottom = bottom + "px";
    }
    let ticking = false;
    function update() {
      ticking = false;
      const on = window.scrollY > 700;
      if (on && !b.classList.contains("on")) place();
      b.classList.toggle("on", on);
    }
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", () => { if (b.classList.contains("on")) place(); });
  }

  // =====================================================================
  // 6. Разгрузка шапки и бокового меню (index.html)
  // =====================================================================
  function declutterTopBar() {
    const bar = document.querySelector("header.top-bar");
    if (!bar || bar.dataset.uixLight) return;
    const tools = document.getElementById("vision-tools-wrap");
    if (!tools) return false; // меню «Инструменты» собирается позже — повторим
    bar.dataset.uixLight = "1";
    document.documentElement.classList.add("uix-light-top");

    // поиск — значок и подсказка клавиш
    const search = Array.from(bar.querySelectorAll("button")).find((b) => /Ctrl\+K/.test(b.textContent));
    // значки — SVG: эмодзи в шапке программа вырезает сама (stripWindowsEmojisInNode)
    if (search) search.innerHTML = '<svg class="uix-ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><kbd class="uix-kbd">Ctrl K</kbd>';

    // синхронизация — только огонёк и короткое слово, полный текст в подсказке
    const sync = document.getElementById("btn-cloud-sync-header");
    const syncTxt = document.getElementById("cloud-sync-header-text");
    if (sync && syncTxt) {
      const short = document.createElement("span");
      short.className = "uix-sync-short";
      sync.appendChild(short);
      const upd = () => {
        const t = syncTxt.textContent.trim();
        sync.title = t + " — облачная синхронизация цеха";
        short.textContent = /онлайн|online/i.test(t) ? "Синхр" : /офлайн|offline|нет/i.test(t) ? "Офлайн" : "Синхр";
      };
      upd();
      new MutationObserver(upd).observe(syncTxt, { childList: true, characterData: true, subtree: true });
    }

    // память — значок и число
    const mem = document.getElementById("btn-workshop-memory-top");
    const badge = document.getElementById("memory-count-badge");
    if (mem && badge) {
      mem.textContent = "";
      mem.insertAdjacentHTML("beforeend", '<svg class="uix-ico" viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>');
      mem.append(badge);
      badge.classList.add("uix-count");
    }

    // «Инструменты» → «⋯ Ещё»: настоящее выпадающее меню поверх страницы
    const toggle = tools.querySelector(":scope > button");
    const menu = tools.querySelector(".vision-tools-menu");
    if (toggle && menu) {
      toggle.innerHTML = "<span>⋯</span><span>Ещё</span>";
      toggle.title = "Схема v11, симулятор, Parkside, CSV, ключ ИИ, масштаб, мобильная версия";
      document.body.appendChild(menu); // из шапки с прокруткой — в body, иначе меню обрезается
      menu.classList.add("uix-menu");
      const place = () => {
        const r = toggle.getBoundingClientRect();
        menu.style.top = Math.round(r.bottom + 6) + "px";
        menu.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + "px";
      };
      toggle.onclick = (e) => {
        e.stopPropagation();
        place();
        menu.classList.toggle("open");
      };
      menu.addEventListener("click", (e) => { if (e.target.closest("a, button")) menu.classList.remove("open"); });
      window.addEventListener("resize", () => menu.classList.remove("open"));
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") menu.classList.remove("open"); });
    }
    return true;
  }

  function declutterRail() {
    const rail = document.querySelector("nav.nav-rail");
    const sep = rail && rail.querySelector(".nav-sep");
    if (!rail || !sep || rail.dataset.uixLight) return;
    rail.dataset.uixLight = "1";
    // всё, что ниже разделителя, — в сворачиваемую группу «Ещё»
    const group = document.createElement("div");
    group.className = "uix-rail-more";
    let n = sep.nextElementSibling;
    while (n) { const next = n.nextElementSibling; group.appendChild(n); n = next; }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-item uix-rail-toggle";
    btn.innerHTML = '<span class="nav-emoji">⋯</span><span class="nav-label">Ещё</span>';
    btn.title = "Советник, Фазы, Виды, Чат ИИ, Знания, AIM";
    sep.replaceWith(btn);
    rail.appendChild(group);
    const KEY = "JURMALCIEMS_UI_RAIL_MORE_V1";
    const set = (open, remember) => {
      rail.classList.toggle("uix-more-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector(".nav-label").textContent = open ? "Скрыть" : "Ещё";
      if (remember) storeSet(KEY, open ? "1" : "0");
    };
    btn.addEventListener("click", () => set(!rail.classList.contains("uix-more-open"), true));
    // активная вкладка в скрытой группе — показываем группу и подсвечиваем «Ещё»
    const sync = () => {
      const activeInside = !!group.querySelector(".nav-item.active");
      btn.classList.toggle("uix-has-active", activeInside && !rail.classList.contains("uix-more-open"));
      if (activeInside && !rail.classList.contains("uix-more-open")) set(true, false);
    };
    new MutationObserver(sync).observe(group, { attributes: true, subtree: true, attributeFilter: ["class"] });
    set(storeGet(KEY) === "1", false);
    sync();
  }

  function initDeclutter() {
    declutterRail();
    // меню «Инструменты» строится скриптом шапки по DOMContentLoaded — ждём его
    let tries = 0;
    const t = setInterval(() => {
      if (declutterTopBar() !== false || ++tries > 40) clearInterval(t);
    }, 100);
    document.addEventListener("click", (e) => {
      const m = document.querySelector(".vision-tools-menu.uix-menu.open");
      if (m && !m.contains(e.target)) m.classList.remove("open");
    });
  }

  function init() {
    initDeclutter();
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    watchPanes();
    watchFrames();
    initTips();
    initTopButton();
    // первый проход — когда программа закончила стартовую отрисовку
    setTimeout(() => scan(document.body), 350);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // крупный просмотр картинки (анатомия видов, эталоны) — нажатие или Esc закрывает
  window.armZoomImage = function (src, caption) {
    const lb = document.createElement("div");
    lb.className = "uix-lightbox";
    lb.innerHTML = `<figure><img src="${src}" alt=""/>${caption ? `<figcaption>${String(caption).replace(/</g, "&lt;")}</figcaption>` : ""}</figure>`;
    const close = () => { lb.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    lb.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(lb);
  };

  window.ArmUi = { rescan: () => scan(document.body) };
})();
