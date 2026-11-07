// ==========================================================================
// 🐟 ЗНАК SIA “TUBA” / ЮРМАЛЦИЕМС — «многослойный биометрический» (по эскизу технолога, 2026-11)
// Изогнутая рыба: тёмное стекло тела, бирюзовый неоновый контур, оранжевые сегменты-пластины,
// лучистые плавники, светящийся глаз-датчик. Три вида:
//   ArmFish.svg({ size })            — техно-логотип с радарными кольцами (заставка);
//   ArmFish.svg({ size, plain:true }) — знак без колец (крупно на страницах);
//   ArmFish.svg({ size, mini:true })  — значок для шапки, вкладки браузера, телефона.
// Заставка при открытии программы — один раз за сеанс, нажатие пропускает. ?fx=0 или ?splash=0 — без неё.
// Статичные копии знака для сайта и иконок: img/brand/tuba-mark.svg, img/brand/tuba-techno.svg.
// ==========================================================================
(function () {
  "use strict";
  if (window.ArmFish) return;

  let uid = 0;

  // Геометрия знака (viewBox 0 0 120 120): голова слева внизу, хвост вверху справа
  const BODY = "M12 78 C16 60 32 46 52 43 C68 40 80 34 88 22 L99 27 C96 46 86 62 72 72 C58 82 40 90 24 89 C16 88 13 83 12 78 Z";
  const TAIL = "M88 22 L81 3 L94 13 L110 8 L99 27 Z";
  const DORSAL = "M47 44 L56 25 L77 36 L68 40 Z";
  const PECTORAL = "M32 79 L27 95 L45 86 Z";
  const ANAL = "M60 79 L63 94 L76 73 Z";

  function svg(opts) {
    opts = opts || {};
    const id = "af" + (++uid);
    const mini = !!opts.mini;
    const plain = !!opts.plain || mini;
    const size = opts.size || 120;
    const glow = mini ? "" : ` filter="url(#${id}c)"`;
    const glowO = mini ? "" : ` filter="url(#${id}a)"`;
    return `<svg class="arm-fish${mini ? " mini" : ""}" width="${size}" height="${size}" viewBox="${plain ? "5 -1 108 108" : "0 0 120 120"}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
  ${mini ? "" : `<filter id="${id}c" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b1"/><feGaussianBlur stdDeviation="0.9" result="b2"/><feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${id}a" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`}
  <linearGradient id="${id}g" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#7df4ff"/><stop offset=".55" stop-color="#22d3ee"/><stop offset="1" stop-color="#0e7490"/></linearGradient>
  <linearGradient id="${id}o" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#f59e0b"/><stop offset=".6" stop-color="#ffb95f"/><stop offset="1" stop-color="#ffe0a3"/></linearGradient>
  <linearGradient id="${id}d" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#0b2a3a"/><stop offset=".45" stop-color="#0d3b4f"/><stop offset="1" stop-color="#06131c"/></linearGradient>
  <radialGradient id="${id}e" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#7df4ff"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
  <clipPath id="${id}k"><path d="${BODY}"/></clipPath>
</defs>
${plain ? "" : `<g class="af-ring"><circle cx="60" cy="60" r="56" fill="none" stroke="#22d3ee" stroke-dasharray="3 7" stroke-opacity=".45" stroke-width="1.1"/><circle cx="60" cy="60" r="51" fill="none" stroke="#ffb95f" stroke-dasharray="1.5 11" stroke-opacity=".4" stroke-width=".9"/></g>
<g opacity=".4" stroke="#22d3ee" stroke-width="1.2"><line x1="60" y1="1" x2="60" y2="9"/><line x1="60" y1="111" x2="60" y2="119"/><line x1="1" y1="60" x2="9" y2="60"/><line x1="111" y1="60" x2="119" y2="60"/></g>
<g class="af-radar"><path d="M60 60 L60 4 A56 56 0 0 1 100 20 Z" fill="url(#${id}g)" opacity=".10"/></g>`}
<g class="af-body">
  <g class="af-tail">
    <path d="${TAIL}" fill="url(#${id}d)" stroke="url(#${id}o)" stroke-width="${mini ? 2.4 : 1.4}" stroke-linejoin="round"${glowO}/>
    ${mini ? "" : `<g stroke="#ffb95f" stroke-width=".7" opacity=".75"><line x1="92" y1="21" x2="84" y2="6"/><line x1="93" y1="20" x2="89" y2="8"/><line x1="95" y1="21" x2="104" y2="10"/><line x1="96" y1="23" x2="108" y2="10"/></g>`}
  </g>
  <g class="af-fin">
    <path d="${DORSAL}" fill="url(#${id}d)" stroke="url(#${id}o)" stroke-width="${mini ? 2.2 : 1.3}" stroke-linejoin="round"${glowO}/>
    ${mini ? "" : `<g stroke="#ffb95f" stroke-width=".6" opacity=".7"><line x1="51" y1="42" x2="56" y2="28"/><line x1="57" y1="41" x2="63" y2="30"/><line x1="63" y1="40" x2="71" y2="34"/></g>`}
  </g>
  <path d="${PECTORAL}" fill="url(#${id}d)" stroke="#22d3ee" stroke-width="${mini ? 2 : 1.1}" stroke-linejoin="round" opacity=".95"/>
  <path d="${ANAL}" fill="url(#${id}d)" stroke="#ffb95f" stroke-width="${mini ? 2 : 1.1}" stroke-linejoin="round" opacity=".9"/>
  <path d="${BODY}" fill="${mini ? `url(#${id}g)` : `url(#${id}d)`}"/>
  ${mini ? `<path d="M30 72 C48 66 70 58 92 27" fill="none" stroke="#06131c" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>
  <path d="M33 52 C50 44 70 41 86 28" fill="none" stroke="#ffb95f" stroke-width="3.4" stroke-linecap="round"/>` : `
  <g clip-path="url(#${id}k)">
    <path d="M8 62 C40 44 70 36 104 8 L104 40 C70 60 40 72 8 84 Z" fill="#22d3ee" opacity=".11"/>
    <g fill="none" stroke-width="1" stroke-linecap="round">
      <path d="M44 45 C47 58 47 72 43 86" stroke="#ffb95f" opacity=".85"/>
      <path d="M56 43 C59 56 59 69 55 82" stroke="#22d3ee" opacity=".55"/>
      <path d="M68 41 C71 51 71 62 66 75" stroke="#ffb95f" opacity=".8"/>
      <path d="M80 35 C83 43 83 53 78 63" stroke="#22d3ee" opacity=".55"/>
      <path d="M90 26 C91 33 91 41 88 49" stroke="#ffb95f" opacity=".7"/>
    </g>
    <g fill="#7df4ff" opacity=".35"><rect x="48" y="57" width="6" height="2" rx="1"/><rect x="60" y="54" width="5" height="2" rx="1"/><rect x="71" y="49" width="4" height="2" rx="1"/></g>
  </g>
  <path class="af-flow" d="M30 72 C48 66 70 58 92 27" fill="none" stroke="#7df4ff" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="3 5"${glow}/>
  <path d="M33 52 C50 44 70 41 86 28" fill="none" stroke="url(#${id}o)" stroke-width="1.8" stroke-linecap="round"${glowO}/>
  <path d="M30 55 C37 64 37 77 31 87" fill="none" stroke="#22d3ee" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`}
  <path class="af-wire" d="${BODY}" fill="none" stroke="#22d3ee" stroke-width="${mini ? 2.6 : 1.5}" stroke-linejoin="round"${glow}/>
  <g transform="translate(21 71)">
    ${mini ? "" : `<circle r="8" fill="url(#${id}e)" opacity=".7" class="af-eye"/>`}
    <circle r="${mini ? 4.6 : 3.9}" fill="#06131c" stroke="#7df4ff" stroke-width="${mini ? 1.8 : 1.3}"/>
    <circle class="af-eye" r="${mini ? 2 : 1.8}" fill="#7df4ff"${glow}/>
    <circle cx="-.6" cy="-.6" r=".7" fill="#fff"/>
  </g>
  ${mini ? "" : `<path d="M13 79 L19 80" stroke="#7df4ff" stroke-width="1.1" stroke-linecap="round"/>`}
</g>
</svg>`;
  }

  const CSS = `
.arm-fish .af-body { animation: afBreath 4s ease-in-out infinite; transform-origin: 60px 60px; }
.arm-fish .af-tail { animation: afTail 2.4s ease-in-out infinite; transform-origin: 94px 25px; }
.arm-fish .af-fin { animation: afFin 3s ease-in-out infinite; transform-origin: 60px 48px; }
.arm-fish .af-ring { animation: afRing 6s ease-in-out infinite; transform-origin: 60px 60px; }
.arm-fish .af-radar { animation: afRadar 4s linear infinite; transform-origin: 60px 60px; }
.arm-fish .af-wire { animation: afWire 3s ease-in-out infinite; }
.arm-fish .af-flow { animation: afFlow 1.4s linear infinite; }
.arm-fish .af-eye { animation: afEye 2.2s ease-in-out infinite; }
.arm-fish.mini .af-body { animation-duration: 3.2s; }
@keyframes afBreath { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-2px) rotate(-1.5deg); } }
@keyframes afTail { 0%,100% { transform: rotate(0); } 50% { transform: rotate(7deg); } }
@keyframes afFin { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-5deg) scale(.97); } }
@keyframes afRing { 0%,100% { transform: scale(1) rotate(0); opacity: .55; } 50% { transform: scale(1.03) rotate(180deg); opacity: .95; } }
@keyframes afRadar { to { transform: rotate(360deg); } }
@keyframes afWire { 0%,100% { stroke-opacity: .7; } 50% { stroke-opacity: 1; } }
@keyframes afFlow { to { stroke-dashoffset: -16; } }
@keyframes afEye { 0%,100% { opacity: 1; } 50% { opacity: .45; } }

#arm-splash { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  background: radial-gradient(60% 50% at 50% 45%, rgba(0,240,255,0.10), transparent 70%), radial-gradient(40% 30% at 50% 60%, rgba(255,185,95,0.06), transparent 70%),
    repeating-linear-gradient(0deg, rgba(34,211,238,.035) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(34,211,238,.035) 0 1px, transparent 1px 44px), #04070D;
  color: #DFF8FF; font-family: 'JetBrains Mono', Consolas, monospace; cursor: pointer; transition: opacity .6s ease, transform .8s cubic-bezier(.16,1,.3,1); }
#arm-splash.out { opacity: 0; transform: scale(1.06); pointer-events: none; }
#arm-splash .as-emb { width: min(46vw, 230px); height: auto; filter: drop-shadow(0 0 22px rgba(0,240,255,.35)); animation: asIn 1s cubic-bezier(.16,1,.3,1) both; }
#arm-splash .as-emb { position: relative; width: min(62vw, 360px); filter: drop-shadow(0 0 30px rgba(0,240,255,.28)); }
#arm-splash .as-emb svg, #arm-splash .as-emb img { width: 100%; height: auto; display: block; }
#arm-splash .as-emb img { mix-blend-mode: screen; -webkit-mask: radial-gradient(closest-side, #000 72%, transparent); mask: radial-gradient(closest-side, #000 72%, transparent); animation: asIn 1s cubic-bezier(.16,1,.3,1) both, asFloat 4s 1s ease-in-out infinite; }
#arm-splash .as-eye { position: absolute; left: 18.5%; top: 75%; width: 9%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(160,250,255,.95), rgba(0,240,255,.35) 45%, transparent 70%); mix-blend-mode: screen; animation: asEye 1.6s ease-in-out infinite; pointer-events: none; }
@keyframes asFloat { 50% { transform: translateY(-6px) rotate(-1deg); } }
@keyframes asEye { 50% { transform: scale(1.5); opacity: .55; } }
#arm-splash .as-t { font-size: clamp(15px, 3.4vw, 22px); font-weight: 800; letter-spacing: .18em; text-align: center; background: linear-gradient(90deg, #7df4ff, #fff, #ffb95f); -webkit-background-clip: text; background-clip: text; color: transparent; animation: asUp .9s .25s cubic-bezier(.16,1,.3,1) both; }
#arm-splash .as-s { font-size: clamp(9px, 2.2vw, 11px); letter-spacing: .22em; color: #5EC8D8; text-transform: uppercase; animation: asUp .9s .4s cubic-bezier(.16,1,.3,1) both; }
#arm-splash .as-bar { width: min(56vw, 260px); height: 2px; border-radius: 2px; background: rgba(0,240,255,.12); overflow: hidden; animation: asUp .9s .5s both; }
#arm-splash .as-bar i { display: block; height: 100%; width: 40%; background: linear-gradient(90deg, transparent, #00f0ff, #ffb95f, transparent); animation: asBar 1.1s ease-in-out infinite; }
#arm-splash .as-h { position: absolute; bottom: max(18px, env(safe-area-inset-bottom)); font-size: 9.5px; color: #3E6676; letter-spacing: .12em; }
@keyframes asIn { from { opacity: 0; transform: scale(.7) rotate(-8deg); } }
@keyframes asUp { from { opacity: 0; transform: translateY(10px); } }
@keyframes asBar { from { transform: translateX(-110%); } to { transform: translateX(260%); } }
@media (prefers-reduced-motion: reduce) { .arm-fish *, #arm-splash * { animation: none !important; } }
`;

  function injectCss() {
    if (document.getElementById("arm-fish-style")) return;
    const st = document.createElement("style");
    st.id = "arm-fish-style";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  injectCss();

  // ---------- заставка ----------
  function splash() {
    const q = location.search;
    if (/[?&](fx|splash)=0\b/.test(q)) return;
    let embedded = false;
    try { embedded = window.top !== window; } catch (e) { embedded = true; }
    if (embedded) return;
    try { if (sessionStorage.getItem("ARM_SPLASH_SEEN")) return; sessionStorage.setItem("ARM_SPLASH_SEEN", "1"); } catch (e) {}

    const sp = document.createElement("div");
    sp.id = "arm-splash";
    sp.setAttribute("role", "presentation");
    sp.innerHTML = `<div class="as-emb"><img src="img/brand/fish-3d.png" alt="" onerror="this.parentNode.innerHTML=window.ArmFish?ArmFish.svg({size:230}):\x27\x27"/><i class="as-eye"></i></div>
      <div class="as-t">АРМ ТЕХНОЛОГА</div>
      <div class="as-s">SIA “TUBA” • Юрмалциемс • AIM AGHD-250ELC</div>
      <div class="as-bar"><i></i></div>
      <div class="as-h">нажмите, чтобы пропустить</div>`;
    // скрипт стоит в <head>: ждём появления <body> (вставка прямо в <html> вешала страницу)
    (function attach() {
      if (document.body) document.body.appendChild(sp);
      else setTimeout(attach, 0);
    })();

    const t0 = performance.now();
    let gone = false;
    function hide() {
      if (gone) return;
      gone = true;
      sp.classList.add("out");
      setTimeout(() => sp.remove(), 800);
    }
    sp.addEventListener("click", hide);
    const done = () => setTimeout(hide, Math.max(0, 1500 - (performance.now() - t0)));
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    setTimeout(hide, 3800); // страховка, если страница грузится долго
  }

  window.ArmFish = { svg, splash };
  splash();
})();
