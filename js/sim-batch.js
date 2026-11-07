// ==========================================================================
// 🐟 ПАРТИЯ В КАМЕРЕ • общий модуль (3D-симулятор, CAD Мастер-схема)
// Паспорт партии по базе знаний (knowledge/species.js): живая рыба выбранного
// вида (сохнет: серебро → янтарь, усадка), расчёт загрузки 15 тележек, выход,
// усушка по часам цикла; стеллаж 3×5 с влажностью рядов.
// В симуляторе подключается сам (+ туман и частицы на фоторазрезе);
// другие страницы вызывают window.ArmBatch.mount(адаптер). Выключатель анимаций: ?fx=0
// ==========================================================================
(function () {
  "use strict";
  if (window.SimBatch) return;

  const FX = !/[?&]fx=0\b/.test(location.search);
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // ---------- облик видов: только форма и окрас (цифры — из базы знаний) ----------
  const LOOK = {
    vimba: { L: 230, H: 54, head: 0.24, tail: 0.17, back: "#5B6B7A", belly: "#E2E8F0", fin: "#94A3B8", tint: "#C7D2FE" },
    bream: { L: 220, H: 92, head: 0.2, tail: 0.18, back: "#4B5563", belly: "#E5E7EB", fin: "#6B7280", tint: "#E5E7EB", hump: 1 },
    roach: { L: 210, H: 62, head: 0.22, tail: 0.17, back: "#475569", belly: "#F1F5F9", fin: "#EF4444", tint: "#FECACA" },
    smelt: { L: 230, H: 34, head: 0.2, tail: 0.15, back: "#6EE7B7", belly: "#F0FDFA", fin: "#99F6E4", tint: "#A7F3D0", slim: 1 },
    perch: { L: 210, H: 66, head: 0.26, tail: 0.16, back: "#3F6212", belly: "#FEF9C3", fin: "#F97316", tint: "#BEF264", stripes: 1, spiny: 1 },
    goby: { L: 205, H: 58, head: 0.34, tail: 0.15, back: "#57534E", belly: "#D6D3D1", fin: "#78716C", tint: "#D6D3D1", bighead: 1 },
  };
  const AMBER = { back: "#7C2D12", belly: "#F59E0B", fin: "#B45309" };

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }

  function fishSvg(sp) {
    const f = LOOK[sp] || LOOK.vimba;
    const L = f.L, H = f.H, x0 = 20, cy = 60;
    const hx = x0 + L * f.head, tx = x0 + L * (1 - f.tail);
    const top = cy - H / 2 - (f.hump ? 8 : 0), bot = cy + H / 2;
    const body = `M ${x0},${cy} C ${x0 + 6},${cy - H * 0.42} ${hx},${top} ${x0 + L * 0.5},${top} ` +
      `C ${tx - 20},${top + 4} ${tx},${cy - H * 0.18} ${tx},${cy} ` +
      `C ${tx},${cy + H * 0.2} ${tx - 24},${bot - 2} ${x0 + L * 0.5},${bot} ` +
      `C ${hx},${bot} ${x0 + 4},${cy + H * 0.38} ${x0},${cy} Z`;
    const tail = `M ${tx - 2},${cy} L ${x0 + L + 4},${cy - H * 0.42} Q ${x0 + L - 8},${cy} ${x0 + L + 4},${cy + H * 0.42} Z`;
    const dorsal = f.spiny
      ? `M ${x0 + L * 0.34},${top + 3} L ${x0 + L * 0.38},${top - 20} L ${x0 + L * 0.44},${top - 16} L ${x0 + L * 0.5},${top - 18} L ${x0 + L * 0.56},${top - 12} L ${x0 + L * 0.6},${top + 2} Z`
      : `M ${x0 + L * 0.42},${top + 2} L ${x0 + L * 0.5},${top - 16} L ${x0 + L * 0.62},${top + 4} Z`;
    const pelvic = `M ${x0 + L * 0.42},${bot - 2} L ${x0 + L * 0.47},${bot + 12} L ${x0 + L * 0.53},${bot - 1} Z`;
    const anal = `M ${x0 + L * 0.66},${bot - 6} L ${x0 + L * 0.7},${bot + 9} L ${x0 + L * 0.77},${bot - 8} Z`;
    const pect = `M ${hx + 6},${cy + 4} Q ${hx + 26},${cy + 16} ${hx + 30},${cy + 8} Z`;
    const gill = `M ${hx},${cy - H * 0.36} Q ${hx + 10},${cy} ${hx},${cy + H * 0.36}`;
    const eyeX = x0 + L * f.head * 0.45, eyeY = cy - H * (f.bighead ? 0.16 : 0.12);
    const eyeR = f.bighead ? 7 : f.slim ? 4.5 : 5.5;
    let stripes = "";
    if (f.stripes) for (let i = 0; i < 6; i++) {
      const sx = x0 + L * (0.3 + i * 0.085);
      stripes += `<path d="M ${sx},${top + 4} Q ${sx + 4},${cy} ${sx - 2},${cy + H * 0.28}" stroke="rgba(20,30,10,0.55)" stroke-width="6" stroke-linecap="round" fill="none"/>`;
    }
    let scales = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
      const sx = hx + 14 + c * ((tx - hx - 30) / 9) + (r % 2) * 6, sy = cy - H * 0.22 + r * H * 0.2;
      scales += `<path d="M ${sx},${sy} q 5,4 0,8" stroke="rgba(255,255,255,0.18)" stroke-width="1" fill="none"/>`;
    }
    return `<svg viewBox="0 0 280 130" class="sb-fish-svg" aria-hidden="true">
  <defs>
    <linearGradient id="sbBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="sb-c-back"/><stop offset="0.55" class="sb-c-mid"/><stop offset="1" class="sb-c-belly"/>
    </linearGradient>
    <linearGradient id="sbSheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="sbClip"><path d="${body}"/></clipPath>
    <radialGradient id="sbShadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="${x0 + L * 0.5}" cy="${bot + 26}" rx="${L * 0.42}" ry="6" fill="url(#sbShadow)" class="sb-fish-shadow"/>
  <g class="sb-fish-body">
    <path d="${tail}" class="sb-fin"/>
    <path d="${dorsal}" class="sb-fin"/>
    <path d="${anal}" class="sb-fin"/>
    <path d="${pelvic}" class="sb-fin"/>
    <path d="${body}" fill="url(#sbBody)" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
    <g clip-path="url(#sbClip)">
      ${stripes}${scales}
      <path d="M ${x0 + 10},${cy - 2} Q ${x0 + L * 0.5},${cy - H * 0.1} ${tx},${cy - 2}" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" fill="none"/>
      <rect class="sb-fish-sheen" x="-60" y="0" width="60" height="130" fill="url(#sbSheen)" opacity="0.5"/>
      <rect class="sb-fish-dry" x="0" y="0" width="280" height="130" fill="#7C2D12" opacity="0"/>
    </g>
    <path d="${gill}" stroke="rgba(0,0,0,0.35)" stroke-width="1.6" fill="none"/>
    <path d="${pect}" class="sb-fin" opacity="0.85"/>
    <circle cx="${eyeX}" cy="${eyeY}" r="${eyeR}" fill="#0B1220" stroke="#E2E8F0" stroke-width="1.6"/>
    <circle cx="${eyeX + 1.5}" cy="${eyeY - 1.5}" r="${eyeR * 0.3}" fill="#fff"/>
    <g class="sb-fish-drops"></g>
  </g>
</svg>`;
  }

  // ---------- стиль ----------
  const CSS = `
.sb-wrap { width: 100%; max-width: 1820px; display: grid; grid-template-columns: minmax(250px, 0.9fr) minmax(300px, 1.25fr) minmax(320px, 1.25fr); gap: 10px; }
@media (max-width: 1280px) { .sb-wrap { grid-template-columns: 1fr; } }
.sb-card { position: relative; overflow: hidden; background: linear-gradient(165deg, #11141E 0%, #090B12 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; }
.sb-card::before { content: ""; position: absolute; left: 10%; right: 10%; top: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent); }
.sb-title { font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
.sb-badge { padding: 2px 7px; border-radius: 6px; font-size: 9.5px; font-family: var(--font-mono); background: rgba(245,158,11,0.15); color: #FBBF24; white-space: nowrap; }
.sb-badge.cy { background: rgba(56,189,248,0.15); color: #38BDF8; } .sb-badge.warn { background: rgba(244,63,94,0.18); color: #FDA4AF; }
/* рыба */
.sb-fish-stage { position: relative; height: 150px; border-radius: 12px; background: radial-gradient(70% 80% at 50% 40%, rgba(245,158,11,0.10), transparent 70%), #070912; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.sb-fish-stage::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px); pointer-events: none; }
.sb-fish-svg { height: 100%; width: auto; max-width: 92%; overflow: visible; }
.sb-fish-svg .sb-fin { fill: var(--sb-fin); opacity: 0.9; transition: fill 0.8s ease; }
.sb-fish-svg .sb-c-back { stop-color: var(--sb-back); transition: stop-color 0.8s ease; }
.sb-fish-svg .sb-c-mid { stop-color: var(--sb-mid); transition: stop-color 0.8s ease; }
.sb-fish-svg .sb-c-belly { stop-color: var(--sb-belly); transition: stop-color 0.8s ease; }
.sb-fish-body { transform-box: view-box; transform-origin: 140px 60px; animation: sbSway 4.2s ease-in-out infinite; transition: scale 0.8s ease; }
@keyframes sbSway { 0%,100% { rotate: -1.4deg; translate: 0 1px; } 50% { rotate: 1.4deg; translate: 0 -2px; } }
.sb-fish-sheen { animation: sbSheen 3.8s ease-in-out infinite; }
@keyframes sbSheen { 0%, 30% { transform: translateX(0); } 80%, 100% { transform: translateX(360px); } }
.sb-fish-shadow { animation: sbShadow 4.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes sbShadow { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(0.92); } }
.sb-drop { animation: sbVapor var(--d, 2.6s) ease-out var(--dl, 0s) infinite; }
@keyframes sbVapor { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 20% { opacity: 0.9; } 100% { transform: translateY(-46px) scale(1.4); opacity: 0; } }
/* фото стадий вяления (img/vyalka/<вид>-0..4.jpg: 0, 13, 35, 68, 84 ч) + зум и лупа */
.sb-photo { position: relative; height: 260px; border-radius: 12px; overflow: hidden; background: #070912; border: 1px solid rgba(245,158,11,0.25); box-shadow: inset 0 0 40px rgba(0,0,0,0.6); cursor: zoom-in; user-select: none; }
.sb-photo.zoomed { cursor: grab; border-color: rgba(56,189,248,0.55); }
.sb-photo.zoomed:active { cursor: grabbing; }
.sb-photo-stage { position: absolute; inset: 0; transform-origin: 0 0; transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1); will-change: transform; }
.sb-photo-stage.dragging { transition: none; }
.sb-photo-bg { position: absolute; inset: -20px; width: calc(100% + 40px); height: calc(100% + 40px); object-fit: cover; filter: blur(16px) brightness(0.45) saturate(1.2); pointer-events: none; }
.sb-photo-img { position: absolute; top: 0; left: 50%; height: 100%; width: auto; transform: translateX(-50%) scale(1.02); opacity: 0; transition: opacity 0.9s ease; box-shadow: 0 0 40px rgba(0,0,0,0.7); animation: sbKen 12s ease-in-out infinite alternate; pointer-events: none; }
.sb-photo.zoomed .sb-photo-img { animation-play-state: paused; }
.sb-photo-img.on { opacity: 1; }
@keyframes sbKen { from { transform: translateX(-50%) scale(1.02); } to { transform: translateX(-50%) scale(1.08) translateY(-1.5%); } }
.sb-photo-sweep { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(105deg, transparent 38%, rgba(255,236,200,0.14) 50%, transparent 62%); transform: translateX(-100%); animation: sbPhotoSweep 5.5s ease-in-out 1s infinite; }
@keyframes sbPhotoSweep { 0% { transform: translateX(-100%); } 45%, 100% { transform: translateX(100%); } }
.sb-photo-tag { position: absolute; left: 8px; top: 8px; padding: 3px 8px; border-radius: 7px; font: 800 10px var(--font-mono); color: #FDE68A; background: rgba(6,8,14,0.85); border: 1px solid rgba(245,158,11,0.45); z-index: 4; pointer-events: none; }
.sb-photo-zoom-hud { position: absolute; right: 8px; top: 8px; display: flex; align-items: center; gap: 3px; background: rgba(6,8,14,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.14); border-radius: 7px; padding: 2px 4px; z-index: 5; }
.sb-photo-zoom-hud button { background: transparent; color: #CBD5E1; border: none; border-radius: 5px; padding: 2px 5px; font: 800 10px var(--font-mono); cursor: pointer; transition: 0.15s; }
.sb-photo-zoom-hud button:hover { background: rgba(245,158,11,0.22); color: #FDE68A; }
.sb-photo-zoom-hud b { font: 800 9.5px var(--font-mono); color: #38BDF8; padding: 0 3px; }
.sb-photo-steps { position: absolute; left: 8px; right: 8px; bottom: 8px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; z-index: 5; }
.sb-photo-steps button { height: 22px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: rgba(6,8,14,0.78); color: #94A3B8; font: 800 9px var(--font-mono); cursor: pointer; padding: 0; transition: 0.2s; }
.sb-photo-steps button:hover { color: #FFF; border-color: rgba(245,158,11,0.6); }
.sb-photo-steps button.on { color: #04080E; background: linear-gradient(135deg, #FBBF24, #F59E0B); border-color: #FDE68A; box-shadow: 0 0 10px rgba(245,158,11,0.5); }
.sb-photo-steps button.done { color: #FDE68A; }
.sb-prod { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 10.5px; color: #94A3B8; }
.sb-prod button { width: 54px; height: 38px; padding: 0; border-radius: 7px; overflow: hidden; border: 1px solid rgba(245,158,11,0.35); background: #070912; cursor: zoom-in; transition: transform 0.2s, box-shadow 0.2s; }
.sb-prod button:hover { transform: translateY(-2px); box-shadow: 0 0 12px rgba(245,158,11,0.35); }
.sb-prod img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sb-lightbox { position: fixed; inset: 0; z-index: 100000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px; background: rgba(2,4,8,0.92); backdrop-filter: blur(12px); animation: sbFade 0.25s ease; user-select: none; }
.sb-lb-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: min(980px, 100%); margin-bottom: 10px; padding: 8px 14px; border-radius: 12px; background: rgba(15,18,28,0.92); border: 1px solid rgba(245,158,11,0.35); color: #F8FAFC; font-size: 12px; font-weight: 700; flex-wrap: wrap; }
.sb-lb-ctrls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sb-lb-btn { background: #0A0D15; color: #CBD5E1; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 5px 10px; font: 700 11px var(--font-mono); cursor: pointer; transition: 0.15s; }
.sb-lb-btn:hover, .sb-lb-btn.on { border-color: rgba(245,158,11,0.65); color: #FDE68A; background: rgba(245,158,11,0.16); }
.sb-lb-stage { position: relative; width: min(980px, 100%); height: min(76vh, 720px); border-radius: 16px; overflow: hidden; background: radial-gradient(circle at 50% 50%, #131826 0%, #05070C 100%); border: 1px solid rgba(245,158,11,0.4); box-shadow: 0 24px 60px rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; cursor: zoom-in; }
.sb-lb-stage.zoomed { cursor: grab; }
.sb-lb-stage.zoomed:active { cursor: grabbing; }
.sb-lb-img { max-width: 100%; max-height: 100%; object-fit: contain; transform-origin: center center; transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1); will-change: transform; pointer-events: none; }
.sb-lb-img.dragging { transition: none; }
@keyframes sbFade { from { opacity: 0; } } @keyframes sbZoomIn { from { transform: scale(0.92); opacity: 0; } }
.sb-fish-cap { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 11px; color: #94A3B8; }
.sb-fish-cap b { font-family: var(--font-mono); color: #FDE68A; }
.sb-name { font-size: 15px; font-weight: 800; color: #FFF; margin: 2px 0 2px; }
.sb-sub { font-size: 10.5px; color: #94A3B8; line-height: 1.35; }
/* паспорт */
.sb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.sb-cell { background: #070912; border: 1px solid rgba(255,255,255,0.05); border-radius: 9px; padding: 6px 8px; min-width: 0; }
.sb-cell span { display: block; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.02em; }
.sb-cell b { display: block; font-family: var(--font-mono); font-size: 13px; color: #F8FAFC; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-cell b.a { color: #FBBF24; } .sb-cell b.c { color: #38BDF8; } .sb-cell b.g { color: #34D399; } .sb-cell b.r { color: #FDA4AF; }
.sb-raw { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.sb-raw input { width: 92px; background: #070912; border: 1px solid rgba(245,158,11,0.4); color: #FDE68A; border-radius: 8px; padding: 4px 8px; font: 700 13px var(--font-mono); user-select: text; }
.sb-raw button { background: #0A0D15; color: #CBD5E1; border: 1px solid rgba(255,255,255,0.12); border-radius: 7px; padding: 4px 8px; font-weight: 800; cursor: pointer; }
.sb-raw button:hover { border-color: rgba(245,158,11,0.6); color: #FDE68A; }
.sb-raw label { font-size: 10.5px; color: #94A3B8; }
.sb-progress { margin-top: 8px; }
.sb-progress-top { display: flex; justify-content: space-between; font-size: 10px; color: #94A3B8; margin-bottom: 4px; }
.sb-progress-top b { font-family: var(--font-mono); color: #2DD4BF; }
.sb-bar { position: relative; height: 10px; border-radius: 6px; background: #070912; border: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
.sb-bar i { position: absolute; inset: 0 auto 0 0; width: 0; border-radius: 6px; background: linear-gradient(90deg, #38BDF8, #2DD4BF, #F59E0B); transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }
.sb-bar i::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent); width: 40%; animation: sbBarShine 2.2s linear infinite; }
@keyframes sbBarShine { from { transform: translateX(-100%); } to { transform: translateX(260%); } }
.sb-note { margin-top: 6px; font-size: 9.5px; color: #64748B; line-height: 1.35; }
/* стеллаж */
.sb-rack { display: grid; grid-template-columns: auto repeat(5, 1fr); gap: 6px; align-items: stretch; }
.sb-row-lbl { font-size: 9px; font-weight: 800; color: #64748B; display: flex; align-items: center; justify-content: center; writing-mode: vertical-rl; transform: rotate(180deg); }
.sb-tr { position: relative; height: 66px; border-radius: 8px; background: #070912; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.sb-tr:hover { transform: translateY(-2px); border-color: rgba(245,158,11,0.55); box-shadow: 0 6px 16px rgba(0,0,0,0.5), 0 0 12px rgba(245,158,11,0.18); }
.sb-tr.empty { opacity: 0.4; cursor: default; }
.sb-tr.empty:hover { transform: none; box-shadow: none; border-color: rgba(255,255,255,0.07); }
.sb-tr .sb-tr-fill { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: linear-gradient(0deg, rgba(56,189,248,0.32), rgba(56,189,248,0.04)); transition: height 0.7s cubic-bezier(0.22,1,0.36,1); }
.sb-tr .sb-tr-rods { position: absolute; inset: 6px 6px 16px; display: flex; flex-direction: column; justify-content: space-between; }
.sb-tr .sb-tr-rod { height: 9px; display: flex; justify-content: space-around; align-items: flex-start; border-top: 1px solid rgba(203,213,225,0.35); }
.sb-tr .sb-f { width: 3px; height: 8px; border-radius: 2px 2px 3px 3px; background: var(--sb-fc, #CBD5E1); transform-origin: 50% 0; animation: sbHang 2.6s ease-in-out infinite; animation-delay: var(--dl, 0s); }
@keyframes sbHang { 0%,100% { rotate: -6deg; } 50% { rotate: 6deg; } }
.sb-tr .sb-tr-no { position: absolute; left: 5px; bottom: 2px; font: 800 9px var(--font-mono); color: #94A3B8; }
.sb-tr .sb-tr-m { position: absolute; right: 5px; bottom: 2px; font: 800 9px var(--font-mono); color: #38BDF8; }
.sb-tr.part .sb-tr-no::after { content: " ½"; color: #FBBF24; }
.sb-rack-foot { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 10px; color: #94A3B8; flex-wrap: wrap; }
.sb-rack-foot b { font-family: var(--font-mono); color: #FDE68A; }
.sb-fan-arrow { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; font-size: 9px; color: #38BDF8; font-weight: 700; }
.sb-fan-arrow i { flex: 1; height: 2px; background: repeating-linear-gradient(90deg, #38BDF8 0 8px, transparent 8px 14px); background-size: 28px 2px; animation: sbAir 0.8s linear infinite; opacity: 0.7; }
@keyframes sbAir { to { background-position: 28px 0; } }
.sb-flash { animation: sbFlash 0.6s ease-out 1; }
@keyframes sbFlash { 0% { text-shadow: 0 0 12px currentColor; transform: scale(1.06); } 100% { text-shadow: none; transform: none; } }
.sb-stage-sweep { position: absolute; inset: 0; pointer-events: none; z-index: 19; background: linear-gradient(100deg, transparent 30%, rgba(56,189,248,0.18) 50%, transparent 70%); transform: translateX(-100%); }
.sb-stage-sweep.go { animation: sbSweep 1.1s cubic-bezier(0.4,0,0.2,1) 1; }
@keyframes sbSweep { to { transform: translateX(100%); } }
/* свои кнопки вида и шкала часов (CAD-схема) */
.sb-ctrl { display: flex; flex-direction: column; gap: 7px; margin-bottom: 9px; padding: 8px; border-radius: 10px; background: #070912; border: 1px solid rgba(255,255,255,0.06); }
.sb-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.sb-chip { background: #0A0D15; color: #94A3B8; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 4px 9px; font-size: 10.5px; font-weight: 700; cursor: pointer; transition: 0.18s; font-family: inherit; }
.sb-chip:hover { color: #FFF; border-color: rgba(245,158,11,0.5); }
.sb-chip.on { background: rgba(245,158,11,0.18); color: #FDE68A; border-color: rgba(245,158,11,0.55); box-shadow: 0 0 12px rgba(245,158,11,0.25); }
.sb-time { display: flex; align-items: center; gap: 8px; }
.sb-time input { flex: 1; accent-color: #38BDF8; cursor: pointer; }
.sb-time b { font: 800 12px var(--font-mono); color: #38BDF8; min-width: 38px; text-align: right; }
.sb-play { background: linear-gradient(135deg, #2DD4BF, #0D9488); color: #041412; border: 1px solid rgba(153,246,228,0.6); border-radius: 8px; padding: 4px 10px; font-size: 10.5px; font-weight: 800; cursor: pointer; white-space: nowrap; font-family: inherit; }
.sb-play.on { background: linear-gradient(135deg, #F43F5E, #BE123C); color: #FFF; border-color: rgba(253,164,175,0.6); }
@media (prefers-reduced-motion: reduce) { .sb-wrap *, .sb-stage-sweep { animation: none !important; } }
`;

  // ---------- разметка ----------
  function build() {
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    const wrap = document.createElement("div");
    wrap.className = "sb-wrap";
    wrap.id = "simBatch";
    wrap.innerHTML = `
      <div class="sb-card">
        <div class="sb-title"><span>РЫБА ПАРТИИ • СУШКА НА ГЛАЗАХ</span><span class="sb-badge" id="sbFishBadge">—</span></div>
        <div class="sb-photo" id="sbPhoto" title="Колесо мыши / кнопки — приблизить рыбу • Двойной клик или 🔍 — крупный осмотр">
          <div class="sb-photo-stage" id="sbPhotoStage">
            <img class="sb-photo-bg" id="sbPhotoBg" alt="" aria-hidden="true"/>
            <img class="sb-photo-img a" alt="Стадия вяления"/><img class="sb-photo-img b" alt=""/>
          </div>
          <span class="sb-photo-sweep"></span>
          <span class="sb-photo-tag" id="sbPhotoTag">—</span>
          <div class="sb-photo-zoom-hud" id="sbPhotoZoomHud">
            <button type="button" data-z="-0.4" title="Отдалить">−</button>
            <b id="sbPhotoZoomBadge">1.0×</b>
            <button type="button" data-z="0.4" title="Приблизить">+</button>
            <button type="button" data-z="reset" title="Сброс масштаба">1×</button>
            <button type="button" data-z="expand" title="Открыть крупно во весь экран">🔍</button>
          </div>
          <div class="sb-photo-steps" id="sbPhotoSteps"></div>
        </div>
        <div class="sb-fish-stage" id="sbFishStage" style="display:none"></div>
        <div class="sb-name" id="sbName">—</div>
        <div class="sb-sub" id="sbSubtitle"></div>
        <div class="sb-fish-cap"><span>Тушка сейчас ≈ <b id="sbPieceNow">—</b></span><span>Цвет: <b id="sbColorTxt">серебро</b></span></div>
        <div class="sb-prod"><span>Анатомия и продукт:</span>
          <button type="button" id="sbAnatBtn" data-src="img/anatomy/vimba.jpg" title="Анатомический разрез вида"><img id="sbAnatImg" src="img/anatomy/vimba.jpg" alt="Анатомический разрез"/></button>
          <button type="button" data-src="img/vyalka/product-1.webp"><img src="img/vyalka/product-1.webp" alt="Готовая вяленая рыба с икрой"/></button>
          <button type="button" data-src="img/vyalka/product-2.webp"><img src="img/vyalka/product-2.webp" alt="Вяленая вимба с икрой на сланце"/></button>
          <button type="button" id="sbOpenBioMatrixBtn" title="Открыть 3D-томографию и сравнение 6 видов рыб" style="width:auto;padding:0 10px;background:rgba(56,189,248,0.14);border-color:rgba(56,189,248,0.45);color:#7DD3FC;font-size:10px;font-weight:800;letter-spacing:0.03em;display:inline-flex;align-items:center;gap:4px;">⚛ 3D Анализ 6 рыб</button>
        </div>
      </div>
      <div class="sb-card">
        <div class="sb-title"><span>ПАСПОРТ ПАРТИИ</span><span class="sb-badge cy" id="sbModeBadge">МОНО</span></div>
        <div class="sb-raw">
          <label for="sbRawInput">Сырьё, кг:</label>
          <button type="button" data-d="-100">−100</button>
          <input id="sbRawInput" type="number" min="50" max="10000" step="10"/>
          <button type="button" data-d="100">+100</button>
          <span class="sb-badge" id="sbCapBadge">—</span>
        </div>
        <div class="sb-grid">
          <div class="sb-cell"><span>Калибр</span><b id="sbCaliber">—</b></div>
          <div class="sb-cell"><span>Тушка / жир</span><b id="sbPiece">—</b></div>
          <div class="sb-cell"><span>Рыб в партии ≈</span><b class="c" id="sbCount">—</b></div>
          <div class="sb-cell"><span>Тележек</span><b class="a" id="sbTrolleys">—</b></div>
          <div class="sb-cell"><span>Коридор T вида</span><b id="sbTemp">—</b></div>
          <div class="sb-cell"><span>Посол</span><b id="sbSalt">—</b></div>
          <div class="sb-cell"><span>Выход (норма)</span><b class="g" id="sbYield">—</b></div>
          <div class="sb-cell"><span>Готовой к финишу</span><b class="g" id="sbFinal">—</b></div>
          <div class="sb-cell"><span>Цель aw</span><b id="sbAw">—</b></div>
        </div>
        <div class="sb-progress">
          <div class="sb-progress-top"><span>Ушло воды к <b id="sbHour">0 ч</b>: <b id="sbWaterNow">0 л</b> из <b id="sbWaterAll">0 л</b></span><span>Масса сейчас <b id="sbMassNow">—</b></span></div>
          <div class="sb-bar"><i id="sbWaterBar"></i></div>
        </div>
        <div class="sb-note" id="sbNote">Цифры вида — из базы знаний (knowledge/species.js). Ход сушки — модель 84-часового цикла симулятора.</div>
      </div>
      <div class="sb-card">
        <div class="sb-title"><span>СТЕЛЛАЖ 15 ТЕЛЕЖЕК SS304</span><span class="sb-badge cy" id="sbRackBadge">—</span></div>
        <div class="sb-rack" id="sbRack"></div>
        <div class="sb-rack-foot"><span>Ряд А у турбин сохнет быстрее, ряд В — медленнее (модель обдува)</span><span>Нажмите на тележку — подробности</span></div>
      </div>`;
    const anchor = adapter.anchor;
    if (adapter.after) adapter.after.insertAdjacentElement("afterend", wrap);
    else anchor.parentNode.insertBefore(wrap, anchor);

    // Контейнер матрицы «БИОЛОГИЧЕСКИЙ АНАЛИЗ И СРАВНЕНИЕ ВЯЛЕНЫХ РЫБ» (6 видов 3D-томографии)
    const bioMount = document.createElement("div");
    bioMount.id = "simBatchBioMount";
    bioMount.style.cssText = "width:100%;max-width:1820px;margin:10px auto 0;";
    wrap.insertAdjacentElement("afterend", bioMount);
    function mountBioSection() {
      if (window.BIO_TOMO && typeof window.BIO_TOMO.renderBioGrid === "function") {
        window.BIO_TOMO.renderBioGrid(bioMount);
      }
    }
    if (window.BIO_TOMO) {
      mountBioSection();
    } else {
      const sc = document.createElement("script");
      sc.src = "js/bio-tomography.js";
      sc.onload = mountBioSection;
      document.head.appendChild(sc);
    }

    // стеллаж
    const rack = wrap.querySelector("#sbRack");
    let html = '<div class="sb-fan-arrow">ТУРБИНЫ CANTONI → ПОТОК ВОЗДУХА СКВОЗЬ РЯДЫ → V-ИСПАРИТЕЛЬ<i></i></div>';
    ["А", "Б", "В"].forEach((r, ri) => {
      html += `<div class="sb-row-lbl">РЯД ${r}</div>`;
      for (let c = 0; c < 5; c++) {
        const n = ri * 5 + c + 1;
        let rods = "";
        for (let k = 0; k < 4; k++) {
          rods += '<div class="sb-tr-rod">';
          for (let f = 0; f < 6; f++) rods += `<span class="sb-f" style="--dl:${(-((n * 7 + k * 3 + f) % 13) * 0.2).toFixed(1)}s"></span>`;
          rods += "</div>";
        }
        html += `<div class="sb-tr" data-n="${n}" data-row="${ri}"><div class="sb-tr-fill"></div><div class="sb-tr-rods">${rods}</div><span class="sb-tr-no">№${n}</span><span class="sb-tr-m"></span></div>`;
      }
    });
    rack.innerHTML = html;
    rack.addEventListener("click", (e) => {
      const t = e.target.closest(".sb-tr");
      if (!t || t.classList.contains("empty")) return;
      openTrolley(+t.dataset.n, +t.dataset.row);
    });

    // фото стадий: кнопки 0 / 13 / 35 / 68 / 84 ч + режим 3D-томографии среза
    const steps = wrap.querySelector("#sbPhotoSteps");
    steps.innerHTML = PHOTO_STAGES.map((p, i) => `<button type="button" data-i="${i}" title="${p.name}">${p.h} ч</button>`).join("") +
      `<button type="button" data-cut="3d" title="3D-томография анатомического среза рыбы" style="color:#7DD3FC;border-color:rgba(56,189,248,0.45);">⚛ 3D</button>`;
    steps.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.cut === "3d") {
        photoTomoMode = !photoTomoMode;
        photoKey = "";
        renderPhoto(state());
        return;
      }
      photoTomoMode = false;
      if (adapter.setHour) adapter.setHour(PHOTO_STAGES[+b.dataset.i].h);
    });
    // если фото вида нет — показываем нарисованную рыбу
    wrap.querySelectorAll(".sb-photo-img").forEach((img) => img.addEventListener("error", () => {
      if (!img.getAttribute("src")) return;
      wrap.querySelector("#sbPhoto").style.display = "none";
      wrap.querySelector("#sbFishStage").style.display = "";
    }));

    // ---------- инспектор-лупа и зум для рыбы на карточке + полноэкранный лайтбокс ----------
    const photoBox = wrap.querySelector("#sbPhoto");
    const photoStage = wrap.querySelector("#sbPhotoStage");
    const zoomBadge = wrap.querySelector("#sbPhotoZoomBadge");
    let pScale = 1, pPanX = 0, pPanY = 0, pDrag = false, pSx = 0, pSy = 0, pOx = 0, pOy = 0, pMoved = false;

    function clampPhotoPan() {
      if (pScale <= 1.02) { pScale = 1; pPanX = 0; pPanY = 0; return; }
      const r = photoBox.getBoundingClientRect();
      const minX = -(r.width * (pScale - 1)), minY = -(r.height * (pScale - 1));
      pPanX = Math.max(minX, Math.min(0, pPanX));
      pPanY = Math.max(minY, Math.min(0, pPanY));
    }
    function applyPhotoTransform(smooth = true) {
      clampPhotoPan();
      photoStage.classList.toggle("dragging", !smooth);
      photoStage.style.transform = `translate3d(${pPanX}px, ${pPanY}px, 0) scale(${pScale})`;
      if (zoomBadge) zoomBadge.textContent = pScale.toFixed(1) + "×";
      photoBox.classList.toggle("zoomed", pScale > 1.02);
    }
    function setPhotoZoom(nextScale, fx, fy) {
      const old = pScale;
      pScale = Math.max(1, Math.min(4, nextScale));
      if (pScale <= 1.02) { pScale = 1; pPanX = 0; pPanY = 0; applyPhotoTransform(true); return; }
      const r = photoBox.getBoundingClientRect();
      const cx = typeof fx === "number" ? fx : r.width / 2;
      const cy = typeof fy === "number" ? fy : r.height / 2;
      const sx = (cx - pPanX) / old, sy = (cy - pPanY) / old;
      pPanX = cx - sx * pScale;
      pPanY = cy - sy * pScale;
      applyPhotoTransform(true);
    }

    function openFishLightbox(initialSrc, customCaption) {
      const s = state();
      const curImg = photoBox.querySelector(".sb-photo-img.on") || photoBox.querySelector(".sb-photo-img");
      const src = initialSrc || (curImg && curImg.getAttribute("src")) || `img/vyalka/${s.sp}-${photoIdx(s.hour)}.jpg`;
      const spTitle = s.c ? s.c.titleRu : s.sp.toUpperCase();
      const stgIdx = photoIdx(s.hour);
      const caption = customCaption || `${spTitle} • ${PHOTO_STAGES[stgIdx].h} ч (${PHOTO_STAGES[stgIdx].name})`;

      const lb = document.createElement("div");
      lb.className = "sb-lightbox";
      const isStagePhoto = !initialSrc;
      lb.innerHTML = `
        <div class="sb-lb-top" onclick="event.stopPropagation()">
          <div>
            <span style="color:#FDE68A;margin-right:8px;">🐟 ДЕТАЛЬНЫЙ ОСМОТР ТУШКИ:</span>
            <span id="sbLbTitle">${caption}</span>
          </div>
          <div class="sb-lb-ctrls">
            ${isStagePhoto ? `<button type="button" class="sb-lb-btn ${photoTomoMode ? "on" : ""}" data-stg="cut" style="color:#7DD3FC;border-color:rgba(56,189,248,0.45);">⚛ 3D Разрез</button>` + PHOTO_STAGES.map((p, idx) => `<button type="button" class="sb-lb-btn ${!photoTomoMode && idx === stgIdx ? "on" : ""}" data-stg="${idx}">${p.h}ч</button>`).join("") : ""}
            <button type="button" class="sb-lb-btn" data-act="zout">−</button>
            <span id="sbLbScale" style="font-family:var(--font-mono);color:#38BDF8;min-width:38px;text-align:center;">1.0×</span>
            <button type="button" class="sb-lb-btn" data-act="zin">+</button>
            <button type="button" class="sb-lb-btn" data-act="zreset">100%</button>
            <button type="button" class="sb-lb-btn" data-act="close" style="color:#FDA4AF;border-color:rgba(244,63,94,0.4);">✕ Закрыть (ESC)</button>
          </div>
        </div>
        <div class="sb-lb-stage" id="sbLbStage" onclick="event.stopPropagation()" title="Колесо мыши — зум до 5× • Перетаскивание мышью — осмотр чешуи и среза">
          <img class="sb-lb-img" id="sbLbImg" src="${src}" alt="${caption}"/>
        </div>`;

      const lbStage = lb.querySelector("#sbLbStage");
      const lbImg = lb.querySelector("#sbLbImg");
      const lbScaleEl = lb.querySelector("#sbLbScale");
      const lbTitleEl = lb.querySelector("#sbLbTitle");
      let lScale = 1, lX = 0, lY = 0, lDrag = false, lSx = 0, lSy = 0, lOx = 0, lOy = 0;

      function applyLb(smooth = true) {
        if (lScale <= 1.02) { lScale = 1; lX = 0; lY = 0; }
        lbImg.classList.toggle("dragging", !smooth);
        lbImg.style.transform = `translate3d(${lX}px, ${lY}px, 0) scale(${lScale})`;
        lbScaleEl.textContent = lScale.toFixed(1) + "×";
        lbStage.classList.toggle("zoomed", lScale > 1.02);
      }
      function zoomLb(next) {
        lScale = Math.max(1, Math.min(5, next));
        applyLb(true);
      }

      lbStage.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        zoomLb(lScale * (ev.deltaY < 0 ? 1.22 : 0.82));
      }, { passive: false });

      lbStage.addEventListener("dblclick", () => zoomLb(lScale > 1.1 ? 1 : 2.5));
      lbStage.addEventListener("mousedown", (ev) => {
        if (lScale <= 1.02) return;
        lDrag = true; lSx = ev.clientX; lSy = ev.clientY; lOx = lX; lOy = lY;
      });
      const onMove = (ev) => {
        if (!lDrag) return;
        lX = lOx + (ev.clientX - lSx);
        lY = lOy + (ev.clientY - lSy);
        applyLb(false);
      };
      const onUp = () => { lDrag = false; };
      const onKey = (ev) => { if (ev.key === "Escape") closeLb(); };
      function closeLb() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("keydown", onKey);
        lb.remove();
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("keydown", onKey);
      lb.addEventListener("click", closeLb);

      lb.querySelector(".sb-lb-ctrls").addEventListener("click", (ev) => {
        const b = ev.target.closest("button");
        if (!b) return;
        if (b.dataset.act === "zin") zoomLb(lScale + 0.5);
        else if (b.dataset.act === "zout") zoomLb(lScale - 0.5);
        else if (b.dataset.act === "zreset") zoomLb(1);
        else if (b.dataset.act === "close") closeLb();
        else if (b.dataset.stg !== undefined) {
          const curS = state();
          if (b.dataset.stg === "cut") {
            photoTomoMode = true;
            lbImg.src = `img/vyalka/cut-${curS.sp}.jpg`;
            lbTitleEl.textContent = `${curS.c ? curS.c.titleRu : curS.sp.toUpperCase()} • ⚛ 3D ТОМОГРАФИЯ СРЕЗА (SPECTRAL SCAN)`;
            lb.querySelectorAll("[data-stg]").forEach((btn) => btn.classList.toggle("on", btn.dataset.stg === "cut"));
            renderPhoto(curS);
          } else {
            photoTomoMode = false;
            const idx = +b.dataset.stg;
            lbImg.src = `img/vyalka/${curS.sp}-${idx}.jpg`;
            lbTitleEl.textContent = `${curS.c ? curS.c.titleRu : curS.sp.toUpperCase()} • ${PHOTO_STAGES[idx].h} ч (${PHOTO_STAGES[idx].name})`;
            lb.querySelectorAll("[data-stg]").forEach((btn) => btn.classList.toggle("on", btn.dataset.stg !== "cut" && +btn.dataset.stg === idx));
            if (adapter.setHour) adapter.setHour(PHOTO_STAGES[idx].h);
          }
        }
      });

      document.body.appendChild(lb);
    }

    wrap.querySelector("#sbPhotoZoomHud").addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.target.closest("button");
      if (!b) return;
      const z = b.dataset.z;
      if (z === "reset") setPhotoZoom(1);
      else if (z === "expand") openFishLightbox();
      else setPhotoZoom(pScale + parseFloat(z));
    });

    photoBox.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = photoBox.getBoundingClientRect();
      setPhotoZoom(pScale * (e.deltaY < 0 ? 1.2 : 0.84), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    photoBox.addEventListener("mousedown", (e) => {
      if (e.target.closest(".sb-photo-steps") || e.target.closest(".sb-photo-zoom-hud")) return;
      pMoved = false;
      if (pScale <= 1.02) return;
      pDrag = true; pSx = e.clientX; pSy = e.clientY; pOx = pPanX; pOy = pPanY;
    });
    window.addEventListener("mousemove", (e) => {
      if (!pDrag) return;
      if (Math.hypot(e.clientX - pSx, e.clientY - pSy) > 3) pMoved = true;
      pPanX = pOx + (e.clientX - pSx);
      pPanY = pOy + (e.clientY - pSy);
      applyPhotoTransform(false);
    });
    window.addEventListener("mouseup", () => { pDrag = false; });

    photoBox.addEventListener("click", (e) => {
      if (e.target.closest(".sb-photo-steps") || e.target.closest(".sb-photo-zoom-hud") || pMoved) return;
      const r = photoBox.getBoundingClientRect();
      if (pScale <= 1.02) setPhotoZoom(2.2, e.clientX - r.left, e.clientY - r.top);
    });
    photoBox.addEventListener("dblclick", (e) => {
      if (e.target.closest(".sb-photo-steps") || e.target.closest(".sb-photo-zoom-hud")) return;
      openFishLightbox();
    });

    // готовый продукт — крупно по нажатию с поддержкой зума
    wrap.querySelector(".sb-prod").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.id === "sbOpenBioMatrixBtn") {
        const bm = document.getElementById("simBatchBioMount");
        if (bm) bm.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (window.BIO_TOMO) window.BIO_TOMO.openBioLightbox(state().sp, "sheet");
        return;
      }
      const imgEl = b.querySelector("img");
      openFishLightbox(b.dataset.src, imgEl ? imgEl.alt : "Готовый продукт");
    });

    // сырьё
    const inp = wrap.querySelector("#sbRawInput");
    const commit = (v) => {
      const kg = Math.min(10000, Math.max(50, Math.round(Number(v) || 0)));
      if (window.ARM_KB && window.ARM_KB.setSharedBatch) window.ARM_KB.setSharedBatch({ rawKg: kg }, adapter.source || "batch");
    };
    inp.addEventListener("change", () => commit(inp.value));
    wrap.querySelectorAll(".sb-raw button").forEach((b) => b.addEventListener("click", () => commit((Number(inp.value) || 0) + Number(b.dataset.d))));

    // свои кнопки вида и шкала часов — для страниц, где их нет (CAD-схема)
    if (adapter.controls) {
      const box = document.createElement("div");
      box.className = "sb-ctrl";
      box.innerHTML = '<div class="sb-chips" id="sbChips">' +
        SPECIES.map(([k, n]) => `<button type="button" class="sb-chip" data-sp="${k}">${n}</button>`).join("") + "</div>" +
        '<div class="sb-time"><button type="button" class="sb-play" id="sbPlay">▶ АВТО-ЦИКЛ</button>' +
        '<input type="range" id="sbHourRange" min="0" max="84" step="1"/><b id="sbHourLbl">00 ч</b></div>';
      const passport = wrap.children[1];
      passport.insertBefore(box, passport.querySelector(".sb-raw"));
      box.querySelector("#sbChips").addEventListener("click", (e) => {
        const b = e.target.closest(".sb-chip");
        if (b && window.ARM_KB) window.ARM_KB.setSharedBatch({ speciesKey: b.dataset.sp }, adapter.source || "batch");
      });
      const range = box.querySelector("#sbHourRange");
      range.addEventListener("input", () => adapter.setHour(+range.value));
      let timer = null;
      box.querySelector("#sbPlay").addEventListener("click", (e) => {
        const btn = e.currentTarget;
        if (timer) { clearInterval(timer); timer = null; btn.classList.remove("on"); btn.textContent = "▶ АВТО-ЦИКЛ"; return; }
        btn.classList.add("on"); btn.textContent = "❚❚ ПАУЗА ЦИКЛА";
        timer = setInterval(() => adapter.setHour((adapter.getHour() + 1) % 85), 400);
      });
    }

    // волна при смене этапа
    let sweep = null;
    if (adapter.sweepHost) {
      sweep = document.createElement("div");
      sweep.className = "sb-stage-sweep";
      adapter.sweepHost.appendChild(sweep);
    }
    return { wrap, sweep };
  }

  const PHOTO_STAGES = [
    { h: 0, name: "Свежая / солёная" }, { h: 13, name: "Подвяливание" }, { h: 35, name: "Активное вяление" },
    { h: 68, name: "Готовая вяленая" }, { h: 84, name: "Выдержанная (финиш)" },
  ];
  // ближайшая стадия фото к текущему часу
  const photoIdx = (h) => (h < 7 ? 0 : h < 24 ? 1 : h < 52 ? 2 : h < 76 ? 3 : 4);
  let photoKey = "";
  let photoTomoMode = false;

  function renderPhoto(s) {
    const box = document.getElementById("sbPhoto");
    if (!box || box.style.display === "none") return;
    const i = photoIdx(s.hour);
    const key = photoTomoMode ? `cut-${s.sp}` : `${s.sp}-${i}`;
    const src = `img/vyalka/${key}.jpg`;
    if (key !== photoKey) {
      photoKey = key;
      // плавная смена: новое фото во «второй» слой, затем меняем слои местами
      const imgs = box.querySelectorAll(".sb-photo-img");
      const cur = box.querySelector(".sb-photo-img.on") || imgs[1];
      const next = cur === imgs[0] ? imgs[1] : imgs[0];
      next.onload = () => { next.classList.add("on"); cur.classList.remove("on"); };
      next.src = src;
      document.getElementById("sbPhotoBg").src = src;
    }
    const anat = `img/anatomy/${s.sp}.jpg`;
    const ab = document.getElementById("sbAnatBtn");
    if (ab && ab.dataset.src !== anat) { ab.dataset.src = anat; document.getElementById("sbAnatImg").src = anat; }
    const tag = document.getElementById("sbPhotoTag");
    if (tag) {
      tag.textContent = photoTomoMode
        ? `⚛ 3D ТОМОГРАФИЯ СРЕЗА • SPECTRAL SCAN`
        : `${PHOTO_STAGES[i].h} ч — ${PHOTO_STAGES[i].name}`;
    }
    box.querySelectorAll(".sb-photo-steps button").forEach((b, k) => {
      if (b.dataset.cut === "3d") {
        b.classList.toggle("on", photoTomoMode);
      } else {
        b.classList.toggle("on", !photoTomoMode && k === i);
        b.classList.toggle("done", !photoTomoMode && k < i);
      }
    });
  }

  const SPECIES = [["vimba", "Вимба"], ["bream", "Лещ"], ["roach", "Плотва"], ["smelt", "Корюшка"], ["perch", "Окунь"], ["goby", "Бычок"]];

  // ---------- расчёт ----------
  let ui = null, lastSp = null, lastStage = null, adapter = null;
  const ROW_K = [1.08, 1.0, 0.92]; // модель: ряд у турбин сохнет быстрее

  // партия по умолчанию — общая партия программы (её же видят калькуляторы и кокпит)
  function shared() {
    return window.ARM_KB && window.ARM_KB.getSharedBatch ? window.ARM_KB.getSharedBatch() : { lowerKey: "vimba", rawKg: 1850, yieldPct: 0, mode: "mono" };
  }

  function canon() {
    const sp = adapter.getSpecies ? adapter.getSpecies() : shared().lowerKey;
    const c = window.ARM_KB && window.ARM_KB.getCanonicalSpecies ? window.ARM_KB.getCanonicalSpecies(sp) : null;
    return { sp, c };
  }

  function state() {
    const { sp, c } = canon();
    const sb = shared();
    const raw = adapter.getRaw ? adapter.getRaw() : sb.rawKg;
    const hour = adapter.getHour();
    const yieldPct = (adapter.getYield ? adapter.getYield() : sb.yieldPct) || (c ? c.yieldNorm : 60);
    const water = raw * (1 - yieldPct / 100);
    const prog = Math.pow(Math.min(1, hour / 84), 0.7); // та же кривая, что и «Слив в трап»
    const cap = c ? c.trolleyCapKg : 170;
    const need = raw / cap;
    return { sp, c, raw, hour, yieldPct, water, prog, cap, need, trolleys: Math.min(15, Math.ceil(need)) };
  }

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (!el || el.textContent === txt) return;
    el.textContent = txt;
    if (FX && !reduced) { el.classList.remove("sb-flash"); void el.offsetWidth; el.classList.add("sb-flash"); }
  }

  function renderFish(s) {
    const stage = document.getElementById("sbFishStage");
    if (lastSp !== s.sp) {
      stage.innerHTML = fishSvg(s.sp);
      lastSp = s.sp;
      const drops = stage.querySelector(".sb-fish-drops");
      for (let i = 0; i < 7; i++) {
        const d = document.createElementNS(NS, "circle");
        d.setAttribute("cx", String(60 + i * 26));
        d.setAttribute("cy", String(44 + (i % 3) * 8));
        d.setAttribute("r", "2.2");
        d.setAttribute("fill", "#BAE6FD");
        d.setAttribute("class", "sb-drop");
        d.style.setProperty("--d", (2.2 + (i % 4) * 0.5) + "s");
        d.style.setProperty("--dl", (-i * 0.45) + "s");
        drops.appendChild(d);
      }
    }
    const look = LOOK[s.sp] || LOOK.vimba;
    // сушка: серебро → янтарь; усадка по уходу воды
    const t = Math.min(1, s.prog * 1.05);
    const svg = stage.querySelector("svg");
    svg.style.setProperty("--sb-back", mix(look.back, AMBER.back, t));
    svg.style.setProperty("--sb-mid", mix(look.tint, "#D97706", t));
    svg.style.setProperty("--sb-belly", mix(look.belly, AMBER.belly, t * 0.9));
    svg.style.setProperty("--sb-fin", mix(look.fin, AMBER.fin, t));
    const body = svg.querySelector(".sb-fish-body");
    body.style.scale = String(1 - (1 - s.yieldPct / 100) * s.prog * 0.3);
    svg.querySelector(".sb-fish-dry").setAttribute("opacity", (t * 0.22).toFixed(2));
    // испарение: на старте пар идёт сильно, к финишу — почти нет
    const drops = svg.querySelector(".sb-fish-drops");
    drops.style.opacity = String(Math.max(0.08, 1 - s.prog));
    setText("sbColorTxt", t < 0.25 ? "серебро" : t < 0.55 ? "золотится" : t < 0.85 ? "янтарь" : "янтарь, финиш");
  }

  function render() {
    if (!ui) return;
    const s = state();
    const c = s.c;
    const stageNow = adapter.getStage ? adapter.getStage() : 1;

    renderFish(s);
    renderPhoto(s);
    if (adapter.controls) {
      document.querySelectorAll("#sbChips .sb-chip").forEach((b) => b.classList.toggle("on", b.dataset.sp === s.sp));
      const range = document.getElementById("sbHourRange");
      if (range && document.activeElement !== range) range.value = s.hour;
      setText("sbHourLbl", (s.hour < 10 ? "0" : "") + s.hour + " ч");
    }
    setText("sbFishBadge", c ? c.shortRu.toUpperCase() : s.sp.toUpperCase());
    setText("sbName", c ? c.titleRu : s.sp);
    setText("sbSubtitle", c ? c.subtitleRu : "");
    const piece = c ? c.pieceG : 300;
    setText("sbPieceNow", Math.round(piece * (1 - (1 - s.yieldPct / 100) * s.prog)) + " г из " + piece + " г");

    const inp = document.getElementById("sbRawInput");
    if (document.activeElement !== inp) inp.value = s.raw;
    const mode = adapter.getMode ? adapter.getMode() : shared().mode;
    setText("sbModeBadge", mode === "mixed" ? "СОВМЕСТНО С ВИМБОЙ" : "МОНО-ЗАГРУЗКА");
    const capMax = s.cap * 15;
    const capEl = document.getElementById("sbCapBadge");
    capEl.className = "sb-badge" + (s.raw > capMax ? " warn" : "");
    setText("sbCapBadge", s.raw > capMax ? `⚠ больше ${capMax.toLocaleString("ru-RU")} кг (15 тел.)` : `ёмкость ${capMax.toLocaleString("ru-RU")} кг`);

    setText("sbCaliber", c ? c.caliber : "—");
    setText("sbPiece", c ? `${c.pieceG} г / ${c.fatPercent}%` : "—");
    setText("sbCount", Math.round(s.raw * 1000 / piece).toLocaleString("ru-RU") + " шт");
    setText("sbTrolleys", `${s.trolleys} из 15 • ${s.cap} кг`);
    const rng = c ? (mode === "mixed" ? c.tempRangeWithVimbaC : c.tempRangeMonoC) : null;
    const tEl = document.getElementById("sbTemp");
    setText("sbTemp", rng ? `${rng[0]}–${rng[1]}°C` : "—");
    // проверка: воздух этапа в коридоре вида?
    const tAir = adapter.getAirT ? adapter.getAirT() : NaN;
    const out = rng && !isNaN(tAir) && (tAir < rng[0] - 1.5 || tAir > (c.emergencyMaxTempC || 99));
    tEl.className = out ? "r" : "";
    tEl.title = out ? `Воздух этапа +${tAir}°C вне коридора вида` : "";
    setText("sbSalt", c ? `${c.saltingRange} ч • ${c.saltKgPerTon} кг/т` : "—");
    setText("sbYield", s.yieldPct.toFixed(1) + " %");
    setText("sbFinal", Math.round(s.raw * s.yieldPct / 100).toLocaleString("ru-RU") + " кг");
    setText("sbAw", c ? "≤ " + c.aw.toFixed(2) : "—");

    const now = Math.round(s.water * s.prog);
    setText("sbHour", (s.hour < 10 ? "0" : "") + s.hour + " ч");
    setText("sbWaterNow", now.toLocaleString("ru-RU") + " л");
    setText("sbWaterAll", Math.round(s.water).toLocaleString("ru-RU") + " л");
    setText("sbMassNow", Math.round(s.raw - now).toLocaleString("ru-RU") + " кг");
    document.getElementById("sbWaterBar").style.width = (s.prog * 100).toFixed(1) + "%";

    // стеллаж
    const fishCol = (LOOK[s.sp] || LOOK.vimba).tint;
    let filled = 0;
    document.querySelectorAll("#sbRack .sb-tr").forEach((tr) => {
      const n = +tr.dataset.n, row = +tr.dataset.row;
      const loaded = n <= s.trolleys;
      const part = loaded && n === s.trolleys && s.need % 1 > 0.01 && s.need < 15;
      tr.classList.toggle("empty", !loaded);
      tr.classList.toggle("part", part);
      const p = Math.min(1, s.prog * ROW_K[row]);
      // влажность поверхности: от стартовой к финишной (этапы симулятора 65% → 44%)
      const moist = Math.round(65 - (65 - 44) * p);
      tr.querySelector(".sb-tr-fill").style.height = loaded ? Math.round((moist / 80) * 100) + "%" : "0";
      tr.querySelector(".sb-tr-m").textContent = loaded ? moist + "%" : "";
      tr.style.setProperty("--sb-fc", mix(fishCol.length === 7 ? fishCol : "#CBD5E1", "#F59E0B", p));
      if (loaded) filled++;
    });
    setText("sbRackBadge", `${filled} В РАБОТЕ`);

    // волна по фоторазрезу при смене этапа
    if (ui.sweep && lastStage !== null && lastStage !== stageNow && FX && !reduced) {
      ui.sweep.classList.remove("go"); void ui.sweep.offsetWidth; ui.sweep.classList.add("go");
    }
    lastStage = stageNow;
    if (adapter.onRender) adapter.onRender(s);
  }

  function openTrolley(n, row) {
    const s = state();
    const c = s.c;
    const kg = n < s.trolleys || s.need >= 15 ? s.cap : Math.round(s.raw - s.cap * (s.trolleys - 1));
    const p = Math.min(1, s.prog * ROW_K[row]);
    const piece = c ? c.pieceG : 300;
    const rowName = ["А", "Б", "В"][row];
    adapter.onTrolley({
      n, row, rowName, kg,
      species: c ? c.titleRu : s.sp,
      title: `${c ? c.titleRu : s.sp} • ${kg} кг сырья`,
      desc: `≈ ${Math.round(kg * 1000 / piece)} рыб на ${c ? c.rodsPerTrolley : "—"} прутках (до ${c ? c.fishPerRod : "—"} на пруток). ` +
        `Ряд ${["А — первым под потоком турбин, сохнет быстрее", "Б — середина потока", "В — в конце потока, сохнет медленнее; кандидат на рокировку"][row]}. Влажность — модель обдува, не замер.`,
      moist: Math.round(65 - 21 * p),
      waterGone: Math.round(kg * (1 - s.yieldPct / 100) * p),
      finalKg: Math.round(kg * s.yieldPct / 100),
    });
  }

  function mount(ad) {
    if (ui) return;
    adapter = ad;
    ui = build();
    render();
    if (window.ARM_KB) {
      if (window.ARM_KB.onBatchChange) window.ARM_KB.onBatchChange(() => render());
      if (window.ARM_KB.ready) window.ARM_KB.ready.then(render);
    }
  }

  // ---------- анимации на фоторазрезе симулятора ----------
  function startFx() {
    if (!FX || reduced) return;
    const stage = document.getElementById("zoomStage");
    const cv = document.createElement("canvas");
    cv.width = 1376; cv.height = 768;
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    stage.insertBefore(cv, document.getElementById("particle-canvas"));
    const ctx = cv.getContext("2d");

    // заранее нарисованные спрайты — дешевле, чем размытие на каждом кадре
    function sprite(rgb, r) {
      const s = document.createElement("canvas");
      s.width = s.height = r * 2;
      const g = s.getContext("2d");
      const gr = g.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, `rgba(${rgb},0.9)`); gr.addColorStop(0.35, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
      return s;
    }
    const sMist = sprite("220,240,255", 24), sAir = sprite("125,211,252", 10), sWarm = sprite("251,191,36", 10), sHot = sprite("248,113,113", 10), sTeal = sprite("45,212,191", 10);

    // туман испарения над тележками: поднимается и сносится потоком к испарителю
    const mist = Array.from({ length: 70 }, () => resetMist({}, true));
    function resetMist(m, init) {
      m.x = 150 + Math.random() * 400; m.y = 300 + Math.random() * 320;
      m.life = init ? Math.random() : 0; m.sp = 0.003 + Math.random() * 0.004;
      m.vx = 0.35 + Math.random() * 0.5; m.vy = -(0.15 + Math.random() * 0.25); m.s = 14 + Math.random() * 26;
      return m;
    }

    // частицы по линиям потока (SVG-пути слоя CAD)
    const paths = Array.from(document.querySelectorAll("#cad-flows-layer path")).map((p) => {
      let len = 0;
      try { len = p.getTotalLength(); } catch (e) {}
      const col = p.getAttribute("stroke") || "";
      const spr = /EF4444|F97316/i.test(col) ? sHot : /2DD4BF/i.test(col) ? sTeal : /F59E0B/i.test(col) ? sWarm : sAir;
      const pts = [];
      for (let i = 0; i <= 80; i++) { const q = p.getPointAtLength((len * i) / 80); pts.push([q.x, q.y]); }
      return { pts, spr, dots: Array.from({ length: 5 }, (_, i) => ({ t: i / 5 + Math.random() * 0.1 })) };
    }).filter((p) => p.pts.length > 1);

    let last = 0, t0 = performance.now();
    function frame(t) {
      requestAnimationFrame(frame);
      if (document.hidden || t - last < 30) return;
      last = t;
      ctx.clearRect(0, 0, 1376, 768);
      const stg = typeof currentStage !== "undefined" ? currentStage : 1;
      const k = stg === 1 ? 1 : stg === 2 ? 0.72 : stg === 3 ? 0.4 : 0.18;
      const flows = typeof isFlowsEnabled === "undefined" || isFlowsEnabled;

      // тёплое «дыхание» света над рыбой
      const breathe = 0.5 + 0.5 * Math.sin((t - t0) / 1600);
      const g = ctx.createRadialGradient(350, 450, 20, 350, 450, 260);
      g.addColorStop(0, `rgba(251,191,36,${0.06 + 0.05 * breathe})`);
      g.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = g; ctx.fillRect(80, 180, 560, 540);

      ctx.globalCompositeOperation = "lighter";
      const mCount = Math.round(mist.length * k);
      for (let i = 0; i < mCount; i++) {
        const m = mist[i];
        m.life += m.sp;
        m.x += m.vx; m.y += m.vy;
        if (m.life >= 1 || m.x > 620) resetMist(m, false);
        const a = Math.sin(m.life * Math.PI) * 0.22;
        ctx.globalAlpha = a;
        ctx.drawImage(sMist, m.x - m.s, m.y - m.s, m.s * 2, m.s * 2);
      }
      if (flows) {
        paths.forEach((p) => {
          p.dots.forEach((d) => {
            d.t = (d.t + 0.006 * (0.5 + k)) % 1;
            const f = d.t * (p.pts.length - 1), i = Math.floor(f), fr = f - i;
            const a = p.pts[i], b = p.pts[Math.min(p.pts.length - 1, i + 1)];
            const x = a[0] + (b[0] - a[0]) * fr, y = a[1] + (b[1] - a[1]) * fr;
            ctx.globalAlpha = 0.9 * Math.sin(d.t * Math.PI);
            ctx.drawImage(p.spr, x - 10, y - 10, 20, 20);
          });
        });
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    requestAnimationFrame(frame);
  }

  // ---------- подключение к 3D-симулятору (его глобальные currentHour/currentStage/…) ----------
  /* global currentSpecies, currentHour, currentStage, currentBatchKg, currentBatchYield, currentBatchMode, selectNodeAndZoom */
  function initSimulator() {
    const vp = document.getElementById("viewportWrap");
    const grid = document.querySelector(".bento-macro-grid");
    if (!vp || !grid || typeof currentHour === "undefined") return;
    mount({
      source: "simulator",
      anchor: grid,
      sweepHost: vp,
      getHour: () => currentHour,
      setHour(h) {
        const sl = document.getElementById("hourSlider");
        if (sl) sl.value = h;
        if (typeof window.onSliderChange === "function") window.onSliderChange(h);
      },
      getStage: () => currentStage,
      getSpecies: () => currentSpecies,
      getRaw: () => currentBatchKg,
      getYield: () => currentBatchYield,
      getMode: () => currentBatchMode,
      getAirT: () => parseFloat((((document.getElementById("kpiAirIn") || {}).textContent || "").match(/[\d.]+/) || [])[0]),
      onTrolley(t) {
        if (typeof selectNodeAndZoom === "function") selectNodeAndZoom("trolleys");
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set("drawerTag", `ТЕЛЕЖКА №${t.n} • РЯД ${t.rowName}`);
        set("drawerTitle", t.title);
        set("drawerDesc", t.desc);
        set("dStat1", t.kg + " кг");
        set("dStat2", t.moist + "% влага");
        set("dStat3", t.waterGone + " л ушло");
        set("dStat4", t.finalKg + " кг готовой");
      },
    });
    const orig = window.updateAll;
    if (typeof orig === "function") {
      window.updateAll = function () { orig.apply(this, arguments); render(); };
    }
    startFx();
  }

  // общий модуль: паспорт партии, рыба вида, стеллаж — на любой странице через свой «адаптер»
  window.ArmBatch = { mount, render, fishSvg, LOOK, AMBER, mix, isOn: () => FX && !reduced };
  window.SimBatch = { render };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSimulator);
  else initSimulator();
})();
