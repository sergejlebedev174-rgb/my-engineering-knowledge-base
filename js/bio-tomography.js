/**
 * ЮРМАЛЦИЕМС АРМ • БИОЛОГИЧЕСКИЙ АНАЛИЗ И СРАВНЕНИЕ ВЯЛЕНЫХ РЫБ (3D ТОМОГРАФИЯ 6 ВИДОВ)
 * Интерактивная матрица 2×3 3D-разрезов (Spectral Scan) + 5× инспектор + переключение фаз сушки (0..84ч).
 */
(function () {
  'use strict';

  var SPECIES_ORDER = ['bream', 'roach', 'smelt', 'vimba', 'perch', 'goby'];

  var BIO_SPECIES = {
    bream: {
      key: 'bream',
      kbCode: 'BREAM',
      headerTitle: '3D ТОМОГРАФИЯ СУШИ',
      aimCode: 'BREAM_CUT_10.AIM',
      title: 'ЛЕЩ КРУПНЫЙ (колодкой)',
      weightG: 850,
      fatPct: '9.0%',
      statsLine: '850 г, 9.0% жирность',
      cutImg: 'img/vyalka/cut-bream.jpg',
      stages: [
        { h: 0,  label: '0 ч — Сырец',       img: 'img/vyalka/bream-stage-1-raw.jpg' },
        { h: 13, label: '13 ч — Подвялка',    img: 'img/vyalka/bream-stage-2-13h.jpg' },
        { h: 35, label: '35 ч — Усушка',      img: 'img/vyalka/bream-stage-3-35h.jpg' },
        { h: 68, label: '68 ч — Дозревание',  img: 'img/vyalka/bream-stage-4-68h.jpg' },
        { h: 84, label: '84 ч — Финиш',       img: 'img/vyalka/bream-stage-5-84h.jpg' }
      ],
      callouts: [
        { label: 'ЛЕЩ КРУПНЫЙ (КОЛОДКОЙ)', tone: 'amber', pos: 'top-left', desc: 'Массивный спинной балык 42 мм, требует ступенчатой отволожки 4ч/1ч' },
        { label: 'ИКРЯНОЙ МЕШОК (ЯСТЫК)',  tone: 'cyan',  pos: 'bottom-left', desc: 'Крупный ястык удерживает влагу до 72–96 ч цикла' },
        { label: 'СПИННОЙ БАЛЫК',          tone: 'amber', pos: 'top-right', desc: 'Пропитка мышечных волокон липидами 9.0% при T ≤ 17°C' }
      ],
      cycleHours: 96,
      targetAw: '0.80',
      tempRange: '14–17°C',
      bioSummary: 'Самая массивная тушка (850 г, 9.0% жирность). Выраженный градиент влаги от хребта и крупного ястыка к чешуе — обязательна импульсная отволожка 4ч/1ч.'
    },
    roach: {
      key: 'roach',
      kbCode: 'ROACH',
      headerTitle: 'ПЛОТВА ИКРЯНАЯ',
      aimCode: 'ROACH_CUT_22.AIM',
      title: 'ПЛОТВА ИКРЯНАЯ',
      weightG: 260,
      fatPct: '4.2%',
      statsLine: '260 г, 4.2% жирность',
      cutImg: 'img/vyalka/cut-roach.jpg',
      stages: [
        { h: 0,  label: '0 ч — Сырец',       img: 'img/vyalka/roach-stage-1-raw.jpg' },
        { h: 13, label: '13 ч — Подвялка',    img: 'img/vyalka/roach-stage-2-13h.jpg' },
        { h: 35, label: '35 ч — Усушка',      img: 'img/vyalka/roach-stage-3-35h.jpg' },
        { h: 68, label: '68 ч — Дозревание',  img: 'img/vyalka/roach-stage-4-68h.jpg' },
        { h: 84, label: '84 ч — Финиш',       img: 'img/vyalka/roach-stage-5-84h.jpg' }
      ],
      callouts: [
        { label: 'ЯНТАРНАЯ КРИСТАЛЛИЗАЦИЯ ЖИРА', tone: 'amber', pos: 'top-left', desc: 'Полупрозрачная янтарная спинка без окисления липидов' },
        { label: 'ИКРЯНОЙ МЕШОК (ЯСТЫК)',        tone: 'cyan',  pos: 'bottom-left', desc: 'Плотный оранжевый ястык сохнет на 6% медленнее балыка' },
        { label: 'РЕБЕРНАЯ ДУГА',                tone: 'amber', pos: 'top-right', desc: 'Контроль активности воды a_w ≤ 0.79 у позвоночника' }
      ],
      cycleHours: 72,
      targetAw: '0.79',
      tempRange: '15–17°C',
      bioSummary: 'Классическая балтийская икряная вобла/плотва (260 г, 4.2% жирность). При T 15–17°C икра приобретает плотную янтарно-рубиновую структуру.'
    },
    smelt: {
      key: 'smelt',
      kbCode: 'SMELT',
      headerTitle: 'КОРЮШКА ИКРЯНАЯ',
      aimCode: 'SMELT_CUT_13.AIM',
      title: 'КОРЮШКА ИКРЯНАЯ',
      weightG: 85,
      fatPct: '5.5%',
      statsLine: '85 г, 5.5% жирность',
      cutImg: 'img/vyalka/cut-smelt.jpg',
      stages: [
        { h: 0,  label: '0 ч — Сырец',       img: 'img/vyalka/smelt-stage-1-raw.jpg' },
        { h: 13, label: '13 ч — Подвялка',    img: 'img/vyalka/smelt-stage-2-13h.jpg' },
        { h: 35, label: '35 ч — Усушка',      img: 'img/vyalka/smelt-stage-3-35h.jpg' },
        { h: 68, label: '68 ч — Дозревание',  img: 'img/vyalka/smelt-stage-4-68h.jpg' },
        { h: 84, label: '84 ч — Финиш',       img: 'img/vyalka/smelt-stage-5-84h.jpg' }
      ],
      callouts: [
        { label: 'ЯНТАРНАЯ КРИСТАЛЛИЗАЦИЯ ЖИРА', tone: 'amber', pos: 'top-left', desc: 'Сквозная просвечиваемость тушки («золотая рыбка»)' },
        { label: 'ИКРЯНОЙ МЕШОК (ЯСТЫК)',        tone: 'cyan',  pos: 'bottom-left', desc: 'Икра занимает до 35% объёма брюшной полости' },
        { label: 'ХРЕБТОВАЯ КОСТЬ',              tone: 'amber', pos: 'bottom-right', desc: 'Быстрый отвод свободной влаги за 48 часов' }
      ],
      cycleHours: 48,
      targetAw: '0.78',
      tempRange: '14–16°C',
      bioSummary: 'Малый калибр (85 г, 5.5% жирность) с высоким процентом икры. Тонкая кожа отдаёт влагу стремительно — критично не пересушить хвост на финальной фазе.'
    },
    vimba: {
      key: 'vimba',
      kbCode: 'VIMBA',
      headerTitle: 'ВИМБА (СЫРТЬ)',
      aimCode: 'VIMBA_CUT_32.AIM',
      title: 'ВИМБА (СЫРТЬ)',
      weightG: 350,
      fatPct: '8.5%',
      statsLine: '350 г, 8.5% жирность',
      cutImg: 'img/vyalka/cut-vimba.jpg',
      stages: [
        { h: 0,  label: '0 ч — Сырец',       img: 'img/vyalka/vimba-stage-1-raw.jpg' },
        { h: 13, label: '13 ч — Подвялка',    img: 'img/vyalka/vimba-stage-2-13h.jpg' },
        { h: 35, label: '35 ч — Усушка',      img: 'img/vyalka/vimba-stage-3-35h.jpg' },
        { h: 68, label: '68 ч — Дозревание',  img: 'img/vyalka/vimba-stage-4-68h.jpg' },
        { h: 84, label: '84 ч — Финиш',       img: 'img/vyalka/vimba-stage-5-84h.jpg' }
      ],
      callouts: [
        { label: 'ЯНТАРНАЯ КРИСТАЛЛИЗАЦИЯ ЖИРА', tone: 'amber', pos: 'top-left', desc: 'Эффект «янтарной слезы» при T ≤ 16.5°C' },
        { label: 'СПИННОЙ БАЛЫК',                tone: 'amber', pos: 'top-right', desc: 'Равномерная пропитка волокон жиром 8.5%' },
        { label: 'ИКРЯНОЙ МЕШОК (ЯСТЫК)',        tone: 'cyan',  pos: 'bottom-left', desc: 'Деликатесный ястык без разрыва оболочки' }
      ],
      cycleHours: 84,
      targetAw: '0.81',
      tempRange: '15–16.5°C',
      bioSummary: 'Флагманский деликатес Юрмалциемса (350 г, 8.5% жирность). Холодный контур AIM AGHD-250ELC (≤16.5°C) удерживает липиды внутри волокон.'
    },
    perch: {
      key: 'perch',
      kbCode: 'PERCH',
      headerTitle: 'ОКУНЬ (целиком)',
      aimCode: 'PERCH_CUT_16.AIM',
      title: 'ОКУНЬ (целиком)',
      weightG: 320,
      fatPct: '2.1%',
      statsLine: '320 г, 2.1% жирность',
      cutImg: 'img/vyalka/cut-perch.jpg',
      stages: [
        { h: 0,  label: '0 ч — Сырец',       img: 'img/vyalka/perch-stage-1-raw.jpg' },
        { h: 13, label: '13 ч — Подвялка',    img: 'img/vyalka/perch-stage-2-13h.jpg' },
        { h: 35, label: '35 ч — Усушка',      img: 'img/vyalka/perch-stage-3-35h.jpg' },
        { h: 68, label: '68 ч — Дозревание',  img: 'img/vyalka/perch-stage-4-68h.jpg' },
        { h: 84, label: '84 ч — Финиш',       img: 'img/vyalka/perch-stage-5-84h.jpg' }
      ],
      callouts: [
        { label: 'ИКРЯНОЙ МЕШОК',    tone: 'cyan',  pos: 'top-left', desc: 'Внутренняя полость под защитой плотных ребер' },
        { label: 'ХРЕБТОВАЯ КОСТЬ',  tone: 'amber', pos: 'top-right', desc: 'Постное мышечное ядро (2.1% жирность)' },
        { label: 'ПАНЦИРНАЯ ЧЕШУЯ',  tone: 'amber', pos: 'bottom-right', desc: 'Ктеноидная чешуя создаёт диффузионный барьер' }
      ],
      cycleHours: 78,
      targetAw: '0.79',
      tempRange: '16–18°C',
      bioSummary: 'Постное плотное мясо (320 г, 2.1% жирность) в плотной ктеноидной («панцирной») чешуе. Требует активного обдува 30 Гц и пауз отволожки.'
    },
    goby: {
      key: 'goby',
      kbCode: 'ROUND_GOBY',
      headerTitle: 'БЫЧОК БАЛТИЙСКИЙ',
      aimCode: 'GOBY_CUT_19.AIM',
      title: 'БЫЧОК БАЛТИЙСКИЙ',
      weightG: 140,
      fatPct: '3.5%',
      statsLine: '140 г, 3.5% жирность',
      cutImg: 'img/vyalka/cut-goby.jpg',
      stages: [
        { h: 0,  label: '0 ч — Сырец',       img: 'img/vyalka/goby-stage-1-raw.jpg' },
        { h: 13, label: '13 ч — Подвялка',    img: 'img/vyalka/goby-stage-2-13h.jpg' },
        { h: 35, label: '35 ч — Усушка',      img: 'img/vyalka/goby-stage-3-35h.jpg' },
        { h: 68, label: '68 ч — Дозревание',  img: 'img/vyalka/goby-stage-4-68h.jpg' },
        { h: 84, label: '84 ч — Финиш',       img: 'img/vyalka/goby-stage-5-84h.jpg' }
      ],
      callouts: [
        { label: 'ЯНТАРНАЯ КРИСТАЛЛИЗАЦИЯ ЖИРА', tone: 'amber', pos: 'top-left', desc: 'Упругий плотный балык с золотистым срезом' },
        { label: 'ХРЕБТОВАЯ КОСТЬ',              tone: 'amber', pos: 'bottom-right', desc: 'Крупная голова и толстый позвоночник — контроль у жаберной крышки' }
      ],
      cycleHours: 60,
      targetAw: '0.78',
      tempRange: '16–18°C',
      bioSummary: 'Балтийский бычок-кругляк (140 г, 3.5% жирность). Массивная передняя часть тушки требует тщательной продувки жаберной зоны.'
    }
  };

  function injectStyles() {
    if (document.getElementById('bio-tomo-styles')) return;
    var st = document.createElement('style');
    st.id = 'bio-tomo-styles';
    st.textContent = [
      '.bio-tomo-section {',
      '  background: linear-gradient(180deg, #0d111d 0%, #101524 100%);',
      '  border: 1px solid rgba(56, 189, 248, 0.22);',
      '  border-radius: 16px;',
      '  padding: 20px 22px 24px;',
      '  margin: 18px 0;',
      '  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06);',
      '  color: #e2e8f0;',
      '  font-family: "Inter", "Plus Jakarta Sans", system-ui, sans-serif;',
      '}',
      '.bio-tomo-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 16px;',
      '  flex-wrap: wrap;',
      '  margin-bottom: 18px;',
      '  padding-bottom: 12px;',
      '  border-bottom: 1px solid rgba(148, 163, 184, 0.14);',
      '}',
      '.bio-tomo-main-title {',
      '  margin: 0;',
      '  font-size: clamp(18px, 2.1vw, 28px);',
      '  font-weight: 800;',
      '  letter-spacing: 0.06em;',
      '  text-transform: uppercase;',
      '  color: #d8f3ff;',
      '  text-shadow: 0 0 24px rgba(56, 189, 248, 0.35);',
      '  font-family: "Space Grotesk", "Playfair Display", Georgia, serif;',
      '}',
      '.bio-tomo-header-controls {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  flex-wrap: wrap;',
      '}',
      '.bio-tomo-pill {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 6px 12px;',
      '  border-radius: 8px;',
      '  font-size: 11px;',
      '  font-weight: 700;',
      '  letter-spacing: 0.05em;',
      '  text-transform: uppercase;',
      '  background: rgba(15, 23, 42, 0.85);',
      '  border: 1px solid rgba(56, 189, 248, 0.3);',
      '  color: #7dd3fc;',
      '  cursor: pointer;',
      '  transition: all 0.18s ease;',
      '}',
      '.bio-tomo-pill:hover, .bio-tomo-pill.active {',
      '  background: rgba(56, 189, 248, 0.18);',
      '  border-color: #38bdf8;',
      '  color: #fff;',
      '  box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);',
      '}',
      '.bio-tomo-grid {',
      '  display: grid;',
      '  grid-template-columns: repeat(3, minmax(0, 1fr));',
      '  gap: 14px;',
      '}',
      '@media (max-width: 1120px) {',
      '  .bio-tomo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }',
      '}',
      '@media (max-width: 720px) {',
      '  .bio-tomo-grid { grid-template-columns: 1fr; }',
      '}',
      '.bio-tomo-card {',
      '  background: #171a26;',
      '  border: 1px solid rgba(148, 163, 184, 0.16);',
      '  border-radius: 12px;',
      '  padding: 10px 12px 14px;',
      '  display: flex;',
      '  flex-direction: column;',
      '  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;',
      '  position: relative;',
      '  overflow: hidden;',
      '}',
      '.bio-tomo-card:hover {',
      '  border-color: rgba(56, 189, 248, 0.55);',
      '  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 22px rgba(56, 189, 248, 0.14);',
      '  transform: translateY(-2px);',
      '}',
      '.bio-tomo-card.is-selected {',
      '  border-color: #22d3ee;',
      '  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.45), 0 14px 36px rgba(6, 182, 212, 0.22);',
      '}',
      '.bio-card-top {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 8px;',
      '  margin-bottom: 8px;',
      '  padding: 2px 2px;',
      '}',
      '.bio-card-top-left {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 7px;',
      '  font-size: 13px;',
      '  font-weight: 700;',
      '  letter-spacing: 0.03em;',
      '  color: #cbd5e1;',
      '  text-transform: uppercase;',
      '}',
      '.bio-atom-icon {',
      '  color: #38bdf8;',
      '  font-size: 15px;',
      '  line-height: 1;',
      '  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6));',
      '}',
      '.bio-card-aim-code {',
      '  font-family: "JetBrains Mono", monospace;',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  color: #94a3b8;',
      '  letter-spacing: 0.04em;',
      '}',
      '.bio-card-viewport {',
      '  position: relative;',
      '  width: 100%;',
      '  aspect-ratio: 320 / 230;',
      '  background: #020810;',
      '  border-radius: 8px;',
      '  overflow: hidden;',
      '  border: 1px solid rgba(56, 189, 248, 0.18);',
      '  cursor: zoom-in;',
      '  user-select: none;',
      '}',
      '.bio-card-viewport img {',
      '  width: 100%;',
      '  height: 100%;',
      '  object-fit: cover;',
      '  display: block;',
      '  transform-origin: center center;',
      '  transition: transform 0.18s ease-out;',
      '}',
      '.bio-card-viewport::after {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  background: linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.07) 50%, transparent 100%);',
      '  background-size: 100% 200%;',
      '  pointer-events: none;',
      '}',
      '.bio-card-zoom-hud {',
      '  position: absolute;',
      '  bottom: 7px;',
      '  right: 7px;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  background: rgba(5, 10, 20, 0.84);',
      '  border: 1px solid rgba(56, 189, 248, 0.32);',
      '  border-radius: 6px;',
      '  padding: 3px 6px;',
      '  z-index: 4;',
      '  backdrop-filter: blur(6px);',
      '}',
      '.bio-zoom-btn {',
      '  background: rgba(30, 41, 59, 0.85);',
      '  border: 1px solid rgba(148, 163, 184, 0.25);',
      '  color: #e2e8f0;',
      '  font-family: "JetBrains Mono", monospace;',
      '  font-size: 10px;',
      '  font-weight: 700;',
      '  padding: 2px 6px;',
      '  border-radius: 4px;',
      '  cursor: pointer;',
      '}',
      '.bio-zoom-btn:hover {',
      '  background: rgba(56, 189, 248, 0.25);',
      '  border-color: #38bdf8;',
      '  color: #fff;',
      '}',
      '.bio-card-stage-strip {',
      '  display: none;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 4px;',
      '  margin-top: 7px;',
      '  padding: 4px;',
      '  background: rgba(9, 13, 24, 0.85);',
      '  border-radius: 6px;',
      '  border: 1px solid rgba(56, 189, 248, 0.16);',
      '}',
      '.bio-tomo-card.show-stages .bio-card-stage-strip {',
      '  display: flex;',
      '}',
      '.bio-stage-chip {',
      '  flex: 1;',
      '  text-align: center;',
      '  font-family: "JetBrains Mono", monospace;',
      '  font-size: 10px;',
      '  font-weight: 700;',
      '  padding: 4px 4px;',
      '  border-radius: 4px;',
      '  background: rgba(30, 41, 59, 0.65);',
      '  color: #94a3b8;',
      '  border: 1px solid transparent;',
      '  cursor: pointer;',
      '  transition: all 0.15s ease;',
      '}',
      '.bio-stage-chip:hover {',
      '  color: #e2e8f0;',
      '  border-color: rgba(56, 189, 248, 0.35);',
      '}',
      '.bio-stage-chip.active {',
      '  background: rgba(245, 158, 11, 0.22);',
      '  color: #fbbf24;',
      '  border-color: rgba(245, 158, 11, 0.65);',
      '}',
      '.bio-stage-chip.is-3d.active {',
      '  background: rgba(34, 211, 238, 0.2);',
      '  color: #67e8f9;',
      '  border-color: rgba(34, 211, 238, 0.65);',
      '}',
      '.bio-card-footer {',
      '  text-align: center;',
      '  padding-top: 11px;',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  gap: 3px;',
      '}',
      '.bio-card-species-name {',
      '  font-size: 18px;',
      '  font-weight: 800;',
      '  color: #7dd3fc;',
      '  letter-spacing: 0.02em;',
      '  line-height: 1.2;',
      '  text-shadow: 0 0 14px rgba(56, 189, 248, 0.25);',
      '  cursor: pointer;',
      '}',
      '.bio-card-species-name:hover {',
      '  color: #bae6fd;',
      '}',
      '.bio-card-stats {',
      '  font-size: 15px;',
      '  font-weight: 700;',
      '  color: #fbbf24;',
      '  letter-spacing: 0.01em;',
      '}',
      '.bio-card-actions {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 10px;',
      '  margin-top: 4px;',
      '}',
      '.bio-card-phases-btn {',
      '  background: transparent;',
      '  border: 1px solid rgba(148, 163, 184, 0.22);',
      '  color: #94a3b8;',
      '  font-size: 10.5px;',
      '  font-weight: 700;',
      '  letter-spacing: 0.08em;',
      '  text-transform: uppercase;',
      '  padding: 3px 10px;',
      '  border-radius: 5px;',
      '  cursor: pointer;',
      '  transition: all 0.15s ease;',
      '}',
      '.bio-card-phases-btn:hover, .bio-tomo-card.show-stages .bio-card-phases-btn {',
      '  color: #38bdf8;',
      '  border-color: rgba(56, 189, 248, 0.55);',
      '  background: rgba(56, 189, 248, 0.1);',
      '}',
      '.bio-card-select-btn {',
      '  background: rgba(34, 211, 238, 0.1);',
      '  border: 1px solid rgba(34, 211, 238, 0.32);',
      '  color: #67e8f9;',
      '  font-size: 10.5px;',
      '  font-weight: 700;',
      '  letter-spacing: 0.05em;',
      '  text-transform: uppercase;',
      '  padding: 3px 10px;',
      '  border-radius: 5px;',
      '  cursor: pointer;',
      '  transition: all 0.15s ease;',
      '}',
      '.bio-card-select-btn:hover, .bio-tomo-card.is-selected .bio-card-select-btn {',
      '  background: rgba(34, 211, 238, 0.25);',
      '  border-color: #22d3ee;',
      '  color: #fff;',
      '}',
      /* Lightbox modal for 5x Spectral Scan & Full Sheet */
      '.bio-lightbox-backdrop {',
      '  position: fixed;',
      '  inset: 0;',
      '  background: rgba(3, 7, 15, 0.92);',
      '  backdrop-filter: blur(12px);',
      '  z-index: 99999;',
      '  display: none;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 20px;',
      '}',
      '.bio-lightbox-backdrop.open {',
      '  display: flex;',
      '}',
      '.bio-lightbox-dialog {',
      '  width: min(1220px, 96vw);',
      '  max-height: 92vh;',
      '  background: #0d1322;',
      '  border: 1px solid rgba(56, 189, 248, 0.45);',
      '  border-radius: 16px;',
      '  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.85);',
      '  display: flex;',
      '  flex-direction: column;',
      '  overflow: hidden;',
      '}',
      '.bio-lightbox-head {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 12px;',
      '  padding: 12px 18px;',
      '  background: #131b2e;',
      '  border-bottom: 1px solid rgba(148, 163, 184, 0.18);',
      '  flex-wrap: wrap;',
      '}',
      '.bio-lightbox-stage {',
      '  position: relative;',
      '  flex: 1;',
      '  min-height: 480px;',
      '  max-height: 72vh;',
      '  background: #020710;',
      '  overflow: hidden;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  cursor: grab;',
      '}',
      '.bio-lightbox-stage.dragging { cursor: grabbing; }',
      '.bio-lightbox-stage img {',
      '  max-width: 100%;',
      '  max-height: 68vh;',
      '  object-fit: contain;',
      '  transform-origin: center center;',
      '  transition: transform 0.08s ease-out;',
      '  user-select: none;',
      '}',
      '.bio-lightbox-foot {',
      '  padding: 12px 18px;',
      '  background: #111827;',
      '  border-top: 1px solid rgba(148, 163, 184, 0.16);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 14px;',
      '  flex-wrap: wrap;',
      '  font-size: 12px;',
      '  color: #cbd5e1;',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function getActiveSpeciesKey() {
    try {
      if (window.ARM_KB && typeof window.ARM_KB.getSharedBatch === 'function') {
        var b = window.ARM_KB.getSharedBatch();
        if (b && b.speciesKey && BIO_SPECIES[b.speciesKey]) return b.speciesKey;
      }
      var raw = localStorage.getItem('jurmalciems_shared_batch_v1');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.speciesKey && BIO_SPECIES[parsed.speciesKey]) return parsed.speciesKey;
      }
    } catch (e) {}
    return 'vimba';
  }

  function selectSpeciesEverywhere(speciesKey) {
    if (!BIO_SPECIES[speciesKey]) return;
    try {
      if (window.ARM_KB && typeof window.ARM_KB.setSharedBatch === 'function') {
        window.ARM_KB.setSharedBatch({ speciesKey: speciesKey });
      } else {
        localStorage.setItem('jurmalciems_shared_batch_v1', JSON.stringify({ speciesKey: speciesKey }));
      }
    } catch (e) {}

    if (typeof window.selectBatchSpecies === 'function') {
      try { window.selectBatchSpecies(speciesKey); } catch (e) {}
    }

    document.querySelectorAll('.bio-tomo-card').forEach(function (card) {
      var k = card.getAttribute('data-species');
      card.classList.toggle('is-selected', k === speciesKey);
      var btn = card.querySelector('.bio-card-select-btn');
      if (btn) {
        btn.textContent = (k === speciesKey) ? '✓ Активна в партии' : 'Выбрать в партию';
      }
    });
  }

  /* ── 5× Spectral Lightbox Inspector ── */
  var lbState = {
    open: false,
    speciesKey: 'vimba',
    mode: '3d', // '3d' | 'sheet' | stage index
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    startX: 0,
    startY: 0
  };

  function ensureLightbox() {
    var existing = document.getElementById('bioTomoLightbox');
    if (existing) return existing;

    var wrap = document.createElement('div');
    wrap.id = 'bioTomoLightbox';
    wrap.className = 'bio-lightbox-backdrop';
    wrap.innerHTML = [
      '<div class="bio-lightbox-dialog" role="dialog" aria-modal="true">',
      '  <div class="bio-lightbox-head">',
      '    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">',
      '      <span class="bio-atom-icon">⚛</span>',
      '      <strong id="bioLbTitle" style="color:#7dd3fc;font-size:15px;letter-spacing:0.04em;">ВИМБА (СЫРТЬ)</strong>',
      '      <span id="bioLbAim" class="bio-card-aim-code" style="background:rgba(56,189,248,0.12);padding:3px 8px;border-radius:5px;color:#38bdf8;">VIMBA_CUT_32.AIM</span>',
      '      <span id="bioLbStats" style="color:#fbbf24;font-weight:700;font-size:13px;">350 г, 8.5% жирность</span>',
      '    </div>',
      '    <div id="bioLbSpeciesTabs" style="display:flex;gap:5px;flex-wrap:wrap;"></div>',
      '    <div style="display:flex;align-items:center;gap:6px;">',
      '      <button type="button" class="bio-zoom-btn" id="bioLbZoomOut">−</button>',
      '      <span id="bioLbZoomVal" style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#38bdf8;min-width:38px;text-align:center;">1.0×</span>',
      '      <button type="button" class="bio-zoom-btn" id="bioLbZoomIn">+</button>',
      '      <button type="button" class="bio-zoom-btn" id="bioLbZoomReset">1×</button>',
      '      <button type="button" class="bio-zoom-btn" id="bioLbFullSheet" title="Показать общую сводную матрицу 6 рыб">Матрица 6 рыб</button>',
      '      <button type="button" class="bio-zoom-btn" id="bioLbClose" style="background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.5);color:#fca5a5;">✕ Закрыть</button>',
      '    </div>',
      '  </div>',
      '  <div class="bio-lightbox-stage" id="bioLbStage">',
      '    <img id="bioLbImg" src="img/vyalka/cut-vimba.jpg" alt="3D Томография" draggable="false" />',
      '  </div>',
      '  <div class="bio-lightbox-foot">',
      '    <div id="bioLbBioSummary" style="flex:1;min-width:240px;color:#cbd5e1;line-height:1.45;"></div>',
      '    <div id="bioLbStageBtns" style="display:flex;gap:5px;flex-wrap:wrap;"></div>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(wrap);

    var stage = wrap.querySelector('#bioLbStage');
    var img = wrap.querySelector('#bioLbImg');

    function applyLbTransform() {
      if (lbState.zoom <= 1.02) {
        lbState.panX = 0;
        lbState.panY = 0;
      }
      img.style.transform = 'translate(' + lbState.panX.toFixed(1) + 'px,' + lbState.panY.toFixed(1) + 'px) scale(' + lbState.zoom.toFixed(2) + ')';
      var zv = wrap.querySelector('#bioLbZoomVal');
      if (zv) zv.textContent = lbState.zoom.toFixed(1) + '×';
    }

    function setLbZoom(z) {
      lbState.zoom = Math.max(1, Math.min(5, z));
      applyLbTransform();
    }

    wrap.querySelector('#bioLbZoomIn').addEventListener('click', function () { setLbZoom(lbState.zoom + 0.5); });
    wrap.querySelector('#bioLbZoomOut').addEventListener('click', function () { setLbZoom(lbState.zoom - 0.5); });
    wrap.querySelector('#bioLbZoomReset').addEventListener('click', function () { setLbZoom(1); });
    wrap.querySelector('#bioLbFullSheet').addEventListener('click', function () {
      lbState.mode = 'sheet';
      lbState.zoom = 1;
      lbState.panX = 0;
      lbState.panY = 0;
      renderLightboxContent();
    });
    wrap.querySelector('#bioLbClose').addEventListener('click', function () {
      wrap.classList.remove('open');
      lbState.open = false;
    });
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) {
        wrap.classList.remove('open');
        lbState.open = false;
      }
    });

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaY < 0 ? 0.35 : -0.35;
      setLbZoom(lbState.zoom + delta);
    }, { passive: false });

    stage.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      lbState.dragging = true;
      lbState.startX = e.clientX - lbState.panX;
      lbState.startY = e.clientY - lbState.panY;
      stage.classList.add('dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!lbState.dragging) return;
      if (lbState.zoom <= 1.02) return;
      lbState.panX = e.clientX - lbState.startX;
      lbState.panY = e.clientY - lbState.startY;
      applyLbTransform();
    });
    window.addEventListener('mouseup', function () {
      if (lbState.dragging) {
        lbState.dragging = false;
        stage.classList.remove('dragging');
      }
    });
    stage.addEventListener('dblclick', function () {
      setLbZoom(lbState.zoom > 1.5 ? 1 : 2.6);
    });

    return wrap;
  }

  function renderLightboxContent() {
    var wrap = ensureLightbox();
    var sp = BIO_SPECIES[lbState.speciesKey] || BIO_SPECIES.vimba;
    var img = wrap.querySelector('#bioLbImg');
    var titleEl = wrap.querySelector('#bioLbTitle');
    var aimEl = wrap.querySelector('#bioLbAim');
    var statsEl = wrap.querySelector('#bioLbStats');
    var sumEl = wrap.querySelector('#bioLbBioSummary');
    var tabsEl = wrap.querySelector('#bioLbSpeciesTabs');
    var stagesEl = wrap.querySelector('#bioLbStageBtns');

    if (lbState.mode === 'sheet') {
      titleEl.textContent = 'БИОЛОГИЧЕСКИЙ АНАЛИЗ И СРАВНЕНИЕ ВЯЛЕНЫХ РЫБ (6 ВИДОВ)';
      aimEl.textContent = 'SPECTRAL_MATRIX_6X.AIM';
      statsEl.textContent = 'Полная сводная таблица 3D-томографии';
      img.src = 'img/vyalka/bio-analysis-grid.jpg';
      sumEl.textContent = 'Сравнительная 3D-томография всех 6 промышленных видов рыб цеха Юрмалциемс: от мелкой корюшки (85 г) до крупного леща колодкой (850 г). Используйте колесо мыши для приближения до 5.0×.';
    } else {
      titleEl.textContent = sp.title;
      aimEl.textContent = sp.aimCode;
      statsEl.textContent = sp.statsLine + ' • Цикл ' + sp.cycleHours + ' ч • Цель a_w ≤ ' + sp.targetAw;
      if (lbState.mode === '3d') {
        img.src = sp.cutImg;
      } else {
        var stObj = sp.stages[Number(lbState.mode)] || sp.stages[4];
        img.src = stObj.img;
      }
      sumEl.textContent = sp.bioSummary;
    }

    img.style.transform = 'translate(' + lbState.panX.toFixed(1) + 'px,' + lbState.panY.toFixed(1) + 'px) scale(' + lbState.zoom.toFixed(2) + ')';
    wrap.querySelector('#bioLbZoomVal').textContent = lbState.zoom.toFixed(1) + '×';

    tabsEl.innerHTML = SPECIES_ORDER.map(function (k) {
      var item = BIO_SPECIES[k];
      var active = (lbState.mode !== 'sheet' && lbState.speciesKey === k) ? ' active' : '';
      return '<button type="button" class="bio-stage-chip is-3d' + active + '" data-lb-sp="' + k + '" style="padding:4px 8px;">' + item.title.split(' ')[0] + '</button>';
    }).join('');

    tabsEl.querySelectorAll('[data-lb-sp]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lbState.speciesKey = btn.getAttribute('data-lb-sp');
        if (lbState.mode === 'sheet') lbState.mode = '3d';
        lbState.zoom = 1;
        lbState.panX = 0;
        lbState.panY = 0;
        renderLightboxContent();
      });
    });

    var stageButtonsHtml = '<button type="button" class="bio-stage-chip is-3d' + (lbState.mode === '3d' ? ' active' : '') + '" data-lb-mode="3d" style="padding:5px 10px;">⚛ 3D Разрез</button>';
    sp.stages.forEach(function (st, idx) {
      var act = (String(lbState.mode) === String(idx)) ? ' active' : '';
      stageButtonsHtml += '<button type="button" class="bio-stage-chip' + act + '" data-lb-mode="' + idx + '" style="padding:5px 9px;">' + st.h + ' ч</button>';
    });
    stagesEl.innerHTML = stageButtonsHtml;

    stagesEl.querySelectorAll('[data-lb-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.getAttribute('data-lb-mode');
        lbState.mode = (m === '3d') ? '3d' : Number(m);
        lbState.zoom = 1;
        lbState.panX = 0;
        lbState.panY = 0;
        renderLightboxContent();
      });
    });
  }

  function openBioLightbox(speciesKey, mode) {
    injectStyles();
    var wrap = ensureLightbox();
    lbState.speciesKey = speciesKey && BIO_SPECIES[speciesKey] ? speciesKey : getActiveSpeciesKey();
    lbState.mode = mode || '3d';
    lbState.zoom = 1;
    lbState.panX = 0;
    lbState.panY = 0;
    renderLightboxContent();
    wrap.classList.add('open');
    lbState.open = true;
  }

  /* ── Render 6-Card Grid into a Mount Element ── */
  function renderBioGrid(mountEl, options) {
    if (!mountEl) return;
    injectStyles();
    var opts = options || {};
    var activeKey = getActiveSpeciesKey();

    var html = [
      '<section class="bio-tomo-section" aria-label="Биологический анализ и сравнение вяленых рыб">',
      '  <div class="bio-tomo-header">',
      '    <div>',
      '      <h2 class="bio-tomo-main-title">БИОЛОГИЧЕСКИЙ АНАЛИЗ И СРАВНЕНИЕ ВЯЛЕНЫХ РЫБ</h2>',
      '      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">3D-томография мышечной ткани, хребтовой кости, ястыка и янтарной кристаллизации жира • Нажмите на рыбу для 5× зума или выбора партии</div>',
      '    </div>',
      '    <div class="bio-tomo-header-controls">',
      '      <button type="button" class="bio-tomo-pill active" data-bio-global-mode="3d">⚛ 3D Томография (6 рыб)</button>',
      '      <button type="button" class="bio-tomo-pill" data-bio-global-mode="stages">⏱ Показать фазы сушки (0–84 ч)</button>',
      '      <button type="button" class="bio-tomo-pill" data-bio-open-sheet="1">🖼 Сводный эталон (Full HD)</button>',
      '    </div>',
      '  </div>',
      '  <div class="bio-tomo-grid">'
    ];

    SPECIES_ORDER.forEach(function (key) {
      var sp = BIO_SPECIES[key];
      var isSel = (key === activeKey);
      html.push(
        '<article class="bio-tomo-card' + (isSel ? ' is-selected' : '') + '" data-species="' + key + '">',
        '  <div class="bio-card-top">',
        '    <div class="bio-card-top-left"><span class="bio-atom-icon">⚛</span><span>' + sp.headerTitle + '</span></div>',
        '    <span class="bio-card-aim-code">' + sp.aimCode + '</span>',
        '  </div>',
        '  <div class="bio-card-viewport" data-viewport-sp="' + key + '" title="Колесо мыши — зум • Клик — открыть 5× инспектор">',
        '    <img src="' + sp.cutImg + '" alt="' + sp.title + '" loading="lazy" draggable="false" />',
        '    <div class="bio-card-zoom-hud">',
        '      <button type="button" class="bio-zoom-btn" data-card-z="out" title="Уменьшить">−</button>',
        '      <span class="bio-zoom-btn" data-card-z="val" style="pointer-events:none;color:#38bdf8;">1.0×</span>',
        '      <button type="button" class="bio-zoom-btn" data-card-z="in" title="Приблизить">+</button>',
        '      <button type="button" class="bio-zoom-btn" data-card-z="max" title="Открыть 5× инспектор">🔍 5×</button>',
        '    </div>',
        '  </div>',
        '  <div class="bio-card-stage-strip">',
        '    <button type="button" class="bio-stage-chip is-3d active" data-stage-mode="3d">3D Срез</button>',
        '    <button type="button" class="bio-stage-chip" data-stage-mode="0">0ч</button>',
        '    <button type="button" class="bio-stage-chip" data-stage-mode="1">13ч</button>',
        '    <button type="button" class="bio-stage-chip" data-stage-mode="2">35ч</button>',
        '    <button type="button" class="bio-stage-chip" data-stage-mode="3">68ч</button>',
        '    <button type="button" class="bio-stage-chip" data-stage-mode="4">84ч</button>',
        '  </div>',
        '  <div class="bio-card-footer">',
        '    <div class="bio-card-species-name" data-select-sp="' + key + '">' + sp.title + '</div>',
        '    <div class="bio-card-stats">' + sp.statsLine + '</div>',
        '    <div class="bio-card-actions">',
        '      <button type="button" class="bio-card-phases-btn" data-toggle-phases="' + key + '">ФАЗЫ СУШКИ</button>',
        '      <button type="button" class="bio-card-select-btn" data-select-sp="' + key + '">' + (isSel ? '✓ Активна в партии' : 'Выбрать в партию') + '</button>',
        '    </div>',
        '  </div>',
        '</article>'
      );
    });

    html.push('  </div>', '</section>');
    mountEl.innerHTML = html.join('\n');

    /* Wire up per-card interactivity */
    mountEl.querySelectorAll('.bio-tomo-card').forEach(function (card) {
      var key = card.getAttribute('data-species');
      var sp = BIO_SPECIES[key];
      var vp = card.querySelector('.bio-card-viewport');
      var img = vp.querySelector('img');
      var zVal = vp.querySelector('[data-card-z="val"]');
      var zScale = 1;
      var panX = 0, panY = 0;
      var currentMode = '3d';

      function updateCardZoom() {
        if (zScale <= 1.02) { panX = 0; panY = 0; }
        img.style.transform = 'translate(' + panX.toFixed(1) + 'px,' + panY.toFixed(1) + 'px) scale(' + zScale.toFixed(2) + ')';
        if (zVal) zVal.textContent = zScale.toFixed(1) + '×';
      }

      vp.addEventListener('wheel', function (e) {
        e.preventDefault();
        zScale = Math.max(1, Math.min(4, zScale + (e.deltaY < 0 ? 0.3 : -0.3)));
        updateCardZoom();
      }, { passive: false });

      vp.querySelectorAll('[data-card-z]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var act = btn.getAttribute('data-card-z');
          if (act === 'in') { zScale = Math.min(4, zScale + 0.5); updateCardZoom(); }
          else if (act === 'out') { zScale = Math.max(1, zScale - 0.5); updateCardZoom(); }
          else if (act === 'max') { openBioLightbox(key, currentMode); }
        });
      });

      vp.addEventListener('click', function () {
        openBioLightbox(key, currentMode);
      });

      /* Toggle phases strip */
      var phasesBtn = card.querySelector('[data-toggle-phases]');
      if (phasesBtn) {
        phasesBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          card.classList.toggle('show-stages');
        });
      }

      /* Stage chip switching inside card */
      card.querySelectorAll('[data-stage-mode]').forEach(function (chip) {
        chip.addEventListener('click', function (e) {
          e.stopPropagation();
          var m = chip.getAttribute('data-stage-mode');
          currentMode = (m === '3d') ? '3d' : Number(m);
          card.querySelectorAll('[data-stage-mode]').forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          if (currentMode === '3d') {
            img.src = sp.cutImg;
          } else {
            var stObj = sp.stages[currentMode] || sp.stages[4];
            img.src = stObj.img;
          }
          zScale = 1;
          updateCardZoom();
        });
      });

      /* Select species buttons */
      card.querySelectorAll('[data-select-sp]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          selectSpeciesEverywhere(key);
          if (typeof opts.onSelectSpecies === 'function') {
            opts.onSelectSpecies(key, sp);
          }
        });
      });
    });

    /* Global header buttons */
    var openSheetBtn = mountEl.querySelector('[data-bio-open-sheet]');
    if (openSheetBtn) {
      openSheetBtn.addEventListener('click', function () {
        openBioLightbox(getActiveSpeciesKey(), 'sheet');
      });
    }

    mountEl.querySelectorAll('[data-bio-global-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var gm = btn.getAttribute('data-bio-global-mode');
        mountEl.querySelectorAll('[data-bio-global-mode]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        mountEl.querySelectorAll('.bio-tomo-card').forEach(function (card) {
          if (gm === 'stages') {
            card.classList.add('show-stages');
          } else {
            var cutChip = card.querySelector('[data-stage-mode="3d"]');
            if (cutChip) cutChip.click();
            card.classList.remove('show-stages');
          }
        });
      });
    });
  }

  /* Auto-mount on DOMContentLoaded if #bioAnalysisMount exists */
  function autoInit() {
    var mount = document.getElementById('bioAnalysisMount');
    if (mount) renderBioGrid(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.BIO_TOMO = {
    SPECIES_ORDER: SPECIES_ORDER,
    BIO_SPECIES: BIO_SPECIES,
    renderBioGrid: renderBioGrid,
    openBioLightbox: openBioLightbox,
    selectSpeciesEverywhere: selectSpeciesEverywhere
  };
})();
