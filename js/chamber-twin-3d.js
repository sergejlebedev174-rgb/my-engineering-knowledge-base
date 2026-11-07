// ==========================================================================
// 🌊 АРМ ТЕХНОЛОГА • ЮРМАЛЦИЕМС
// ЖИВОЙ 3D-ДВОЙНИК КАМЕРЫ AIM AGHD-250ELC (WebGL, three.js r128)
// Тоннель SS304, 15 тележек с рыбой, 4×Cantoni, V-испаритель, догрев, компрессор,
// замкнутый поток воздуха и конденсат. Значения на выносках — из телеметрии АРМ.
// Движок three.js лежит в js/vendor/three/ (работает без интернета); CDN — только запасной путь.
// API: window.ArmChamber3D.show(hostElement) / .hide()
// ==========================================================================
(function () {
  "use strict";
  if (window.ArmChamber3D) return;

  // локальные копии сверены по SHA-256 с реестром jsDelivr (three@0.128.0)
  const selfSrc = (document.currentScript && document.currentScript.src) || "";
  const LOCAL = selfSrc.replace(/chamber-twin-3d\.js(\?.*)?$/, "vendor/three/");
  const CDN = "https://cdn.jsdelivr.net/npm/three@0.128.0/";
  const LIBS = [
    { local: "three.min.js", cdn: "build/three.min.js" },
    { local: "OrbitControls.js", cdn: "examples/js/controls/OrbitControls.js" },
  ];
  const lite = (window.ArmFx && window.ArmFx.lite) || (navigator.hardwareConcurrency || 8) <= 4;

  let libsPromise = null;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("не загрузился " + src));
      document.head.appendChild(s);
    });
  }
  // сначала своя копия из папки программы, при её отсутствии — CDN
  async function loadLib(lib) {
    if (LOCAL) { try { await loadScript(LOCAL + lib.local); return; } catch (e) { /* нет локальной копии */ } }
    await loadScript(CDN + lib.cdn);
  }
  function loadLibs() {
    if (!libsPromise) {
      libsPromise = (async () => {
        if (!window.THREE) await loadLib(LIBS[0]);
        if (!window.THREE.OrbitControls) { try { await loadLib(LIBS[1]); } catch (e) { /* без вращения мышью */ } }
        return window.THREE;
      })();
      libsPromise.catch(() => { libsPromise = null; });
    }
    return libsPromise;
  }

  let layer = null, msgEl = null, tagsBox = null, hudEl = null;
  let app = null;
  let visible = false;

  function telemetry() {
    if (window.ArmFx && window.ArmFx.telemetry) return window.ArmFx.telemetry();
    const tel = (window.state && window.state.telemetry) || {};
    return { tempC: Number(tel.environmentTempC || 15.8), rh: Math.round(tel.parksideRhPercent || 58), coil: Number(tel.dehumicoilTempC || 5.1), fanHz: 30, pause: !!tel.isPausePhaseNow, vpd: 0.75 };
  }

  // =====================================================================
  // Текстуры, нарисованные кодом (никаких внешних картинок)
  // =====================================================================
  function canvasTex(T, w, h, draw, opts) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    if (!opts || opts.srgb !== false) t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  function brushedSteel(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#c9d0d8"); g.addColorStop(0.5, "#aeb6bf"); g.addColorStop(1, "#c3cad2");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const y = Math.random() * h, a = Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,50,60,${a})`;
      ctx.fillRect(0, y, w, Math.random() * 1.4);
    }
    // стыки сэндвич-панелей и заклёпки
    for (let x = 0; x <= w; x += w / 4) {
      ctx.fillStyle = "rgba(20,26,34,0.55)"; ctx.fillRect(x - 1.5, 0, 3, h);
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x + 1.5, 0, 1, h);
      for (let y = 18; y < h; y += 64) {
        ctx.fillStyle = "rgba(30,36,44,0.6)"; ctx.beginPath(); ctx.arc(x + 8, y, 2.2, 0, 6.28); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(x + 7.4, y - 0.6, 0.9, 0, 6.28); ctx.fill();
      }
    }
  }
  function floorGrid(ctx, w, h) {
    ctx.fillStyle = "#0a0e15"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(120,150,180,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.strokeStyle = "rgba(56,189,248,0.22)"; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.strokeStyle = "rgba(56,189,248,0.07)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
  }
  function coilFins(base, line, frost) {
    return (ctx, w, h) => {
      ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 3) { ctx.fillStyle = line; ctx.fillRect(x, 0, 1, h); }
      for (let y = 10; y < h; y += 26) { ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, y, w, 3); ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(0, y + 3, w, 1); }
      if (frost) for (let i = 0; i < 1400; i++) { ctx.fillStyle = `rgba(235,248,255,${Math.random() * 0.35})`; ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    };
  }
  function fishSkin(ctx, w, h) {
    // по u — вокруг тушки: спинка темнее, бока золотые; по v — от головы к хвосту
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#f1b35a"); g.addColorStop(0.25, "#c98432"); g.addColorStop(0.5, "#5a3a1c"); g.addColorStop(0.75, "#c98432"); g.addColorStop(1, "#f1b35a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 5) for (let x = (y / 5) % 2 ? 3 : 0; x < w; x += 6) {
      ctx.fillStyle = "rgba(255,230,170,0.16)"; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 3.14); ctx.fill();
    }
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, "rgba(40,20,5,0.45)"); v.addColorStop(0.2, "rgba(0,0,0,0)"); v.addColorStop(0.85, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(40,20,5,0.35)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }
  function glowDot(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function labelTex(text, sub, col) {
    return (ctx, w, h) => {
      ctx.fillStyle = "#0d1016"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = "#e8eef5"; ctx.font = "bold 44px Segoe UI, Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h * 0.42);
      ctx.fillStyle = col; ctx.font = "bold 22px Consolas, monospace"; ctx.fillText(sub, w / 2, h * 0.75);
    };
  }
  function gaugeFace(ctx, w, h) {
    ctx.fillStyle = "#f4f6f8"; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 2, 0, 6.28); ctx.fill();
    ctx.strokeStyle = "#1f2937"; ctx.lineWidth = 3;
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * w * 0.38, h / 2 + Math.sin(a) * h * 0.38); ctx.lineTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * h * 0.45); ctx.stroke();
    }
    ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.42, Math.PI * 1.9, Math.PI * 2.25); ctx.stroke();
  }

  // =====================================================================
  // Сцена
  // =====================================================================
  function buildApp(T, host) {
    const C = (hex) => new T.Color(hex).convertSRGBToLinear();
    const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.75));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !lite;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new T.Scene();
    scene.background = C("#05070c");
    scene.fog = new T.FogExp2(C("#05070c"), 0.042);

    // окружение для отражений металла: «студия» с софтбоксами
    const pmrem = new T.PMREMGenerator(renderer);
    const envScene = new T.Scene();
    const roomMat = new T.MeshBasicMaterial({ color: C("#1a2230"), side: T.BackSide });
    envScene.add(new T.Mesh(new T.BoxGeometry(30, 14, 30), roomMat));
    [[0, 6.5, 0, 14, 0.2, 6, "#ffffff", 3.2], [-12, 3, 0, 0.2, 6, 12, "#9fd8ff", 1.6], [12, 3, 0, 0.2, 6, 12, "#ffd9a8", 1.4], [0, 3, -14, 10, 5, 0.2, "#cfe8ff", 1.1]].forEach(([x, y, z, sx, sy, sz, col, k]) => {
      const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k) }));
      m.position.set(x, y, z); envScene.add(m);
    });
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    pmrem.dispose();

    const camera = new T.PerspectiveCamera(36, 1, 0.1, 90);
    camera.position.set(11.5, 1.6, 15.5);
    // точка взгляда — центр всего комплекса (тоннель + блок AIM), камера на уровне глаз, как на рендере
    const target = new T.Vector3(1.0, 1.35, 0);
    camera.lookAt(target);

    let controls = null;
    if (T.OrbitControls) {
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.copy(target);
      controls.minDistance = 4;
      controls.maxDistance = 22;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enablePan = false;
    }

    // ---------- материалы ----------
    const steelTex = canvasTex(T, 512, 512, brushedSteel);
    steelTex.anisotropy = maxAniso;
    const steel = new T.MeshStandardMaterial({ map: steelTex, metalness: 0.86, roughness: 0.34, envMapIntensity: 1.15 });
    const steelDark = new T.MeshStandardMaterial({ color: C("#6b7682"), metalness: 0.9, roughness: 0.28 });
    const steelBright = new T.MeshStandardMaterial({ color: C("#d9dfe6"), metalness: 1, roughness: 0.18 });
    const rubber = new T.MeshStandardMaterial({ color: C("#16181c"), metalness: 0, roughness: 0.8 });
    const copper = new T.MeshStandardMaterial({ color: C("#c27a45"), metalness: 1, roughness: 0.26 });
    const insul = new T.MeshStandardMaterial({ color: C("#e7ebef"), metalness: 0, roughness: 0.75 });
    const blackGloss = new T.MeshPhysicalMaterial({ color: C("#0e0f12"), metalness: 0.3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 });
    const floorTex = canvasTex(T, 256, 256, floorGrid);
    floorTex.repeat.set(24, 24); floorTex.anisotropy = maxAniso;
    // пол — тёмный полированный бетон: отражает студию слабо, иначе центр кадра «выгорает»
    const floorMat = new T.MeshStandardMaterial({ map: floorTex, metalness: 0.3, roughness: 0.5, envMapIntensity: 0.3 });
    const glowTex = canvasTex(T, 128, 128, glowDot);

    const add = (geo, mat, x, y, z, opt) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (opt && opt.rot) m.rotation.set(opt.rot[0], opt.rot[1], opt.rot[2]);
      m.castShadow = !(opt && opt.noCast);
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    const box = (sx, sy, sz) => new T.BoxGeometry(sx, sy, sz);
    const glow = (x, y, z, size, col, op) => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: C(col), transparent: true, opacity: op == null ? 0.8 : op, blending: T.AdditiveBlending, depthWrite: false }));
      s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s); return s;
    };

    // ---------- пол цеха ----------
    const floor = add(new T.PlaneGeometry(60, 60), floorMat, 0, 0, 0, { rot: [-Math.PI / 2, 0, 0], noCast: true });
    floor.receiveShadow = true;

    // ---------- тоннель сушки (передняя стена и половина потолка срезаны) ----------
    const X0 = -4.25, X1 = 2.95, H = 3.05, Z0 = -1.75, Z1 = 1.75;
    add(box(X1 - X0 + 0.3, 0.1, Z1 - Z0 + 0.3), steelDark, (X0 + X1) / 2, 0.05, 0);
    const back = add(box(X1 - X0, H, 0.12), steel, (X0 + X1) / 2, H / 2 + 0.1, Z0);
    back.material = steel.clone(); back.material.map = steelTex.clone(); back.material.map.needsUpdate = true; back.material.map.repeat.set(3, 1);
    const left = add(box(0.12, H, Z1 - Z0), steel, X0, H / 2 + 0.1, 0);
    left.material = steel.clone(); left.material.map = steelTex.clone(); left.material.map.needsUpdate = true; left.material.map.repeat.set(1.5, 1);
    add(box(X1 - X0, 0.12, (Z1 - Z0) * 0.55), steel, (X0 + X1) / 2, H + 0.16, Z0 + (Z1 - Z0) * 0.275);
    // рёбра каркаса
    [[X0, Z1], [X0, Z0], [X1, Z0]].forEach(([x, z]) => add(box(0.09, H + 0.2, 0.09), steelBright, x, H / 2 + 0.1, z));
    add(box(X1 - X0, 0.09, 0.09), steelBright, (X0 + X1) / 2, H + 0.2, Z0);
    add(box(0.09, 0.09, Z1 - Z0), steelBright, X0, H + 0.2, 0);
    add(box(X1 - X0, 0.08, 0.08), steelBright, (X0 + X1) / 2, 0.12, Z1);

    // фальшпотолок-пленум (задняя половина — передняя срезана, чтобы видеть вентиляторы) и световые линии
    const FC_D = (Z1 - Z0) * 0.62, FC_Z = Z0 + FC_D / 2 + 0.05;
    add(box(X1 - X0 - 0.3, 0.06, FC_D), steelDark, (X0 + X1) / 2 - 0.05, 2.62, FC_Z);
    add(box(X1 - X0 - 0.3, 0.12, 0.05), steelBright, (X0 + X1) / 2 - 0.05, 2.6, FC_Z + FC_D / 2);
    const ledMat = new T.MeshStandardMaterial({ color: C("#ffe2b8"), emissive: C("#ffcf8f"), emissiveIntensity: 2.4 });
    [FC_Z + FC_D / 2 - 0.12, Z0 + 0.25].forEach((z) => {
      add(box(X1 - X0 - 0.8, 0.04, 0.08), ledMat, (X0 + X1) / 2, 2.57, z, { noCast: true });
      for (let x = X0 + 0.9; x < X1 - 0.5; x += 1.4) glow(x, 2.5, z, 1.7, "#ffcf8f", 0.4);
    });

    // ---------- 4 осевых вентилятора Cantoni ----------
    const fans = [];
    const bladeGeo = new T.BoxGeometry(0.4, 0.02, 0.13);
    bladeGeo.translate(0.22, 0, 0);
    const FAN_Z = FC_Z + 0.15;
    [-3.0, -1.6, -0.2, 1.2].forEach((x) => {
      const g = new T.Group();
      g.position.set(x, 2.5, FAN_Z);
      const ring = new T.Mesh(new T.TorusGeometry(0.5, 0.05, 12, 48), steelBright);
      ring.rotation.x = Math.PI / 2; g.add(ring);
      const hub = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.12, 20), blackGloss); g.add(hub);
      const rotor = new T.Group();
      for (let b = 0; b < 5; b++) {
        const bl = new T.Mesh(bladeGeo, steelDark);
        bl.rotation.y = (b / 5) * Math.PI * 2;
        bl.rotation.x = 0.35;
        rotor.add(bl);
      }
      g.add(rotor);
      for (let r = 0.15; r < 0.5; r += 0.11) {
        const guard = new T.Mesh(new T.TorusGeometry(r, 0.006, 6, 40), steelBright);
        guard.rotation.x = Math.PI / 2; guard.position.y = -0.08; g.add(guard);
      }
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      scene.add(g);
      fans.push(rotor);
      glow(x, 2.32, FAN_Z, 0.9, "#7dd3fc", 0.14);
    });

    // ---------- 15 тележек SS304 с рыбой (как на панели: 5 + 4 + 3 в работе) ----------
    const rowsLoaded = [5, 4, 3];
    const trolleyPicks = [];
    const posts = [], rods = [], wheels = [], fishM = [], fishC = [];
    const tmpM = new T.Matrix4(), tmpQ = new T.Quaternion(), tmpS = new T.Vector3(), tmpP = new T.Vector3(), tmpE = new T.Euler();
    const pushM = (arr, x, y, z, sx, sy, sz, rx, ry, rz) => {
      tmpE.set(rx || 0, ry || 0, rz || 0); tmpQ.setFromEuler(tmpE);
      tmpP.set(x, y, z); tmpS.set(sx, sy, sz);
      arr.push(new T.Matrix4().compose(tmpP.clone(), tmpQ.clone(), tmpS.clone()));
    };
    const TW = 0.88, TD = 0.72, TH = 1.95, BASE = 0.2;
    const LEVELS = 7, PER_ROD = 6;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = -3.35 + col * 1.08, cz = -1.08 + row * 1.08;
        const n = row * 5 + col + 1;
        const loaded = col < rowsLoaded[row];
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
          pushM(posts, cx + sx * TW / 2, BASE + TH / 2, cz + sz * TD / 2, 0.035, TH, 0.035);
          pushM(wheels, cx + sx * (TW / 2 - 0.06), 0.1, cz + sz * (TD / 2 - 0.06), 0.09, 0.05, 0.09, Math.PI / 2, 0, 0);
        });
        [BASE + 0.05, BASE + TH].forEach((y) => {
          pushM(posts, cx, y, cz - TD / 2, TW, 0.03, 0.03); pushM(posts, cx, y, cz + TD / 2, TW, 0.03, 0.03);
          pushM(posts, cx - TW / 2, y, cz, 0.03, 0.03, TD); pushM(posts, cx + TW / 2, y, cz, 0.03, 0.03, TD);
        });
        for (let lv = 0; lv < LEVELS; lv++) {
          const y = BASE + 0.48 + lv * 0.235;
          [-0.17, 0.17].forEach((dz) => {
            // цилиндр вытянут по Y: длина прутка идёт в Y-масштаб, затем поворот вдоль тележки
            pushM(rods, cx, y, cz + dz, 0.012, TW, 0.012, 0, 0, Math.PI / 2);
            if (!loaded) return;
            for (let f = 0; f < PER_ROD; f++) {
              const fx = cx - TW / 2 + 0.1 + f * ((TW - 0.2) / (PER_ROD - 1));
              const s = 0.85 + Math.random() * 0.3;
              pushM(fishM, fx + (Math.random() - 0.5) * 0.02, y - 0.15 * s, cz + dz, s, s, s, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.7 + Math.PI / 2, (Math.random() - 0.5) * 0.08);
              const tone = row === 2 ? new T.Color().setHSL(0.09, 0.35, 0.62 + Math.random() * 0.1) : new T.Color().setHSL(0.085 + Math.random() * 0.02, 0.6, 0.55 + Math.random() * 0.1);
              fishC.push(tone.convertSRGBToLinear());
            }
          });
        }
        const pick = new T.Mesh(box(TW, TH, TD), new T.MeshBasicMaterial({ visible: false }));
        pick.position.set(cx, BASE + TH / 2, cz);
        pick.userData = { trolley: n, row: ["Ряд А • Вимба", "Ряд Б • Вимба", "Ряд В • Плотва"][row], loaded };
        scene.add(pick);
        trolleyPicks.push(pick);
      }
    }
    const inst = (geo, mat, list, colors) => {
      const m = new T.InstancedMesh(geo, mat, list.length);
      list.forEach((mx, i) => m.setMatrixAt(i, mx));
      if (colors) colors.forEach((c, i) => m.setColorAt(i, c));
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    inst(new T.BoxGeometry(1, 1, 1), steelBright, posts);
    inst(new T.CylinderGeometry(1, 1, 1, 8), steelBright, rods);
    inst(new T.CylinderGeometry(1, 1, 1, 16), rubber, wheels);
    // тушка: тело вращения, сплюснутое с боков, + хвостовой плавник
    const prof = [[0, -0.14], [0.018, -0.132], [0.036, -0.105], [0.047, -0.06], [0.05, -0.01], [0.045, 0.04], [0.034, 0.08], [0.02, 0.108], [0.009, 0.12], [0.004, 0.128]].map(([r, y]) => new T.Vector2(r, y));
    const fishGeo = new T.LatheGeometry(prof, 14);
    fishGeo.scale(1, 1, 0.42);
    const tailGeo = new T.ConeGeometry(0.045, 0.07, 3);
    tailGeo.rotateZ(Math.PI); tailGeo.scale(1, 1, 0.18); tailGeo.translate(0, 0.155, 0);
    const skin = canvasTex(T, 256, 128, fishSkin);
    const fishMat = new T.MeshStandardMaterial({ map: skin, metalness: 0.25, roughness: 0.42, envMapIntensity: 0.9 });
    inst(fishGeo, fishMat, fishM, fishC);
    inst(tailGeo, new T.MeshStandardMaterial({ color: C("#8a5a26"), metalness: 0.2, roughness: 0.5 }), fishM);

    // ---------- блок AIM AGHD-250ELC ----------
    const U0 = 3.05, U1 = 5.7, UH = 3.05;
    add(box(U1 - U0, 0.12, Z1 - Z0), steelDark, (U0 + U1) / 2, 0.06, 0);
    const uBack = add(box(U1 - U0, UH, 0.08), steel, (U0 + U1) / 2, UH / 2 + 0.1, Z0);
    uBack.material = steel.clone(); uBack.material.map = steelTex.clone(); uBack.material.map.needsUpdate = true; uBack.material.map.repeat.set(1.2, 1);
    add(box(0.08, UH, Z1 - Z0), steel, U1, UH / 2 + 0.1, 0);
    add(box(U1 - U0, 0.1, Z1 - Z0), steel, (U0 + U1) / 2, UH + 0.15, 0);
    add(box(0.06, UH, Z1 - Z0), steelDark, 4.62, UH / 2 + 0.1, -0.02).material = new T.MeshStandardMaterial({ color: C("#55606c"), metalness: 0.85, roughness: 0.4, transparent: true, opacity: 0.35 });
    [[U0, Z1], [U1, Z1], [U1, Z0], [U0, Z0]].forEach(([x, z]) => add(box(0.08, UH + 0.2, 0.08), steelBright, x, UH / 2 + 0.1, z));
    [UH + 0.2, 0.12].forEach((y) => { add(box(U1 - U0, 0.08, 0.08), steelBright, (U0 + U1) / 2, y, Z1); add(box(0.08, 0.08, Z1 - Z0), steelBright, U1, y, 0); });
    // стекло с бликом
    add(box(U1 - U0 - 0.1, UH - 0.1, 0.02), new T.MeshPhysicalMaterial({ color: C("#a5d8ff"), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.07, clearcoat: 1 }), (U0 + U1) / 2, UH / 2 + 0.1, Z1, { noCast: true });

    // V-испаритель (синие ламели с инеем) и золотой догрев
    const evapTex = canvasTex(T, 256, 256, coilFins("#3f7fb8", "rgba(200,230,255,0.55)", true));
    evapTex.repeat.set(3, 1);
    const evapMat = new T.MeshStandardMaterial({ map: evapTex, metalness: 0.6, roughness: 0.45, emissive: C("#1e6fd9"), emissiveIntensity: 0.32 });
    [-1, 1].forEach((s) => add(box(0.1, 2.0, Z1 - Z0 - 0.3), evapMat, 3.62 + s * 0.2, 1.75, 0, { rot: [0, 0, s * 0.2] }));
    add(box(0.75, 0.06, Z1 - Z0 - 0.25), steelBright, 3.62, 0.66, 0);
    const reheatTex = canvasTex(T, 256, 256, coilFins("#b8862b", "rgba(255,230,150,0.6)", false));
    reheatTex.repeat.set(3, 1);
    add(box(0.16, 2.1, Z1 - Z0 - 0.3), new T.MeshStandardMaterial({ map: reheatTex, metalness: 0.85, roughness: 0.3, emissive: C("#ff7a2e"), emissiveIntensity: 0.22 }), 4.25, 1.65, 0);
    const evapGlow = glow(3.62, 1.6, 1.2, 2.6, "#3b9bff", 0.32);
    const heatGlow = glow(4.25, 1.6, 1.2, 2.4, "#ff8a3d", 0.26);

    // компрессор Panasonic, ресиверы, манометры, медная обвязка
    add(new T.CylinderGeometry(0.3, 0.3, 0.78, 40), blackGloss, 5.1, 0.55, 0.35);
    add(new T.SphereGeometry(0.3, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), blackGloss, 5.1, 0.94, 0.35);
    const plate = add(new T.PlaneGeometry(0.34, 0.12), new T.MeshBasicMaterial({ map: canvasTex(T, 256, 96, labelTex("Panasonic", "C-SCP400H38A", "#38bdf8")) }), 5.1, 0.7, 0.66, { noCast: true });
    plate.material.toneMapped = false;
    add(new T.CylinderGeometry(0.12, 0.12, 0.55, 28), blackGloss, 5.42, 1.75, -0.6);
    add(new T.CylinderGeometry(0.1, 0.1, 0.5, 28), blackGloss, 5.45, 0.5, -0.95);
    const gauges = [];
    [[4.95, 2.05], [5.22, 2.05]].forEach(([x, y]) => {
      add(new T.CylinderGeometry(0.1, 0.1, 0.05, 32), steelBright, x, y, 1.1, { rot: [Math.PI / 2, 0, 0] });
      const face = add(new T.CircleGeometry(0.085, 32), new T.MeshBasicMaterial({ map: canvasTex(T, 128, 128, gaugeFace) }), x, y, 1.13, { noCast: true });
      face.material.toneMapped = false;
      const needle = add(box(0.004, 0.07, 0.004), new T.MeshBasicMaterial({ color: C("#111111") }), x, y, 1.135, { noCast: true });
      needle.geometry.translate(0, 0.03, 0);
      gauges.push(needle);
    });
    const pipe = (pts, r, mat) => add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2]))), 64, r, 10, false), mat, 0, 0, 0);
    pipe([[5.1, 1.0, 0.35], [5.1, 1.5, 0.4], [4.8, 2.3, 0.9], [4.4, 2.5, 0.9], [4.25, 2.55, 0.6]], 0.03, copper);
    pipe([[4.25, 0.7, 0.7], [4.6, 0.55, 0.9], [5.4, 0.9, 0.9], [5.42, 1.5, -0.4]], 0.025, copper);
    pipe([[5.42, 2.0, -0.6], [5.3, 2.4, 0.2], [4.95, 2.4, 1.0], [3.62, 2.65, 1.0], [3.62, 2.65, 0.4]], 0.022, copper);
    pipe([[3.7, 0.8, 0.9], [4.7, 0.35, 1.0], [5.0, 0.3, 0.6], [5.05, 0.4, 0.35]], 0.04, insul);
    // щит управления с индикаторами
    add(box(0.05, 0.9, 0.55), new T.MeshStandardMaterial({ color: C("#cfd5dc"), metalness: 0.5, roughness: 0.35 }), U1 - 0.06, 2.1, 1.0);
    const leds = [];
    ["#22c55e", "#22c55e", "#f59e0b", "#ef4444", "#38bdf8"].forEach((col, i) => {
      leds.push({ s: glow(U1 - 0.1, 2.35 - i * 0.12, 0.85 + (i % 2) * 0.18, 0.16, col, 0.9), base: 0.9, ph: Math.random() * 6 });
    });
    // табличка на блоке
    const np = add(new T.PlaneGeometry(0.9, 0.24), new T.MeshBasicMaterial({ map: canvasTex(T, 512, 136, labelTex("AIM AGHD-250ELC", "R410A • 2×10 KG • DEW POINT", "#2dd4bf")) }), (U0 + U1) / 2, UH - 0.15, Z1 + 0.02, { noCast: true });
    np.material.toneMapped = false;

    // воздуховод рекуперации с рёбрами
    const ductCurve = new T.CatmullRomCurve3([new T.Vector3(5.1, UH + 0.15, 0), new T.Vector3(5.1, 3.75, 0), new T.Vector3(5.5, 4.1, 0), new T.Vector3(6.6, 4.15, 0)]);
    add(new T.TubeGeometry(ductCurve, 64, 0.32, 24, false), steelBright, 0, 0, 0);
    for (let i = 0.08; i < 1; i += 0.09) {
      const p = ductCurve.getPointAt(i), tg = ductCurve.getTangentAt(i);
      const rib = new T.Mesh(new T.TorusGeometry(0.33, 0.015, 6, 32), steelDark);
      rib.position.copy(p); rib.lookAt(p.clone().add(tg)); scene.add(rib);
    }
    const ductEnd = ductCurve.getPointAt(1);

    // термо-короб эстакады [20] (ППУ) на конце воздуховода + термостат STC-1000
    const ppu = new T.MeshStandardMaterial({ color: C("#d9d2b8"), metalness: 0.15, roughness: 0.75 });
    add(box(0.9, 0.72, 0.86), ppu, ductEnd.x + 0.42, ductEnd.y, 0);
    add(box(0.92, 0.05, 0.88), steelDark, ductEnd.x + 0.42, ductEnd.y + 0.38, 0);
    add(box(0.16, 0.2, 0.05), new T.MeshStandardMaterial({ color: C("#111827"), metalness: 0.3, roughness: 0.5 }), ductEnd.x + 0.3, ductEnd.y - 0.08, 0.45);
    const stcLed = glow(ductEnd.x + 0.3, ductEnd.y - 0.06, 0.48, 0.14, "#ef4444", 0.9);
    leds.push({ s: stcLed, base: 0.9, ph: 1.3 });
    // вытяжка компрессорной VENTS TT PRO 200 (канальный вентилятор на стене)
    const vents = add(new T.CylinderGeometry(0.17, 0.17, 0.42, 32), new T.MeshStandardMaterial({ color: C("#e5e7eb"), metalness: 0.55, roughness: 0.35 }), 6.0, 2.9, -0.9, { rot: [0, 0, Math.PI / 2] });
    add(new T.CylinderGeometry(0.1, 0.1, 0.5, 24), steelBright, 6.42, 2.9, -0.9, { rot: [0, 0, Math.PI / 2] });
    const ventsBlades = add(new T.CircleGeometry(0.15, 6), new T.MeshBasicMaterial({ color: C("#94a3b8"), transparent: true, opacity: 0.55 }), 5.78, 2.9, -0.9, { rot: [0, -Math.PI / 2, 0], noCast: true });

    // трап в полу
    add(new T.CylinderGeometry(0.2, 0.17, 0.32, 32, 1, true), steelBright, 3.3, 0.16, 2.2);
    add(new T.CircleGeometry(0.42, 32), new T.MeshStandardMaterial({ color: C("#2a3138"), metalness: 0.9, roughness: 0.3 }), 3.3, 0.012, 2.2, { rot: [-Math.PI / 2, 0, 0], noCast: true });

    // ---------- свет ----------
    scene.add(new T.HemisphereLight(C("#5b7fa8"), C("#0b0d12"), 0.85));
    const fill = new T.DirectionalLight(C("#cfe8ff"), 0.45); fill.position.set(3, 4, 10); scene.add(fill);
    const key = new T.SpotLight(C("#ffd9b0"), 2.2, 18, Math.PI / 4.2, 0.55, 1.4);
    key.position.set(-0.6, 6.5, 3.2); key.target.position.set(-0.6, 0, -0.3);
    key.castShadow = !lite; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; key.shadow.radius = 4;
    scene.add(key, key.target);
    const inner1 = new T.PointLight(C("#ffcf8f"), 1.1, 6, 2); inner1.position.set(-2.4, 2.3, 0); scene.add(inner1);
    const inner2 = new T.PointLight(C("#ffcf8f"), 0.9, 6, 2); inner2.position.set(0.8, 2.3, 0); scene.add(inner2);
    const coldL = new T.PointLight(C("#3b9bff"), 1.4, 5, 2); coldL.position.set(3.62, 1.5, 0.9); scene.add(coldL);
    const warmL = new T.PointLight(C("#ff8a3d"), 1.1, 5, 2); warmL.position.set(4.3, 1.5, 0.9); scene.add(warmL);
    const rim = new T.DirectionalLight(C("#7dd3fc"), 0.5); rim.position.set(-6, 5, -8); scene.add(rim);

    // ---------- замкнутый поток воздуха ----------
    // пленум → вниз у левой стены → сквозь тележки → V-испаритель (холод) → догрев (тепло) → вверх → пленум
    const loop = new T.CatmullRomCurve3([
      new T.Vector3(3.3, 2.75, 0), new T.Vector3(1.0, 2.8, 0), new T.Vector3(-2.0, 2.8, 0), new T.Vector3(-3.85, 2.55, 0),
      new T.Vector3(-3.9, 1.6, 0), new T.Vector3(-3.0, 1.15, 0), new T.Vector3(-1.0, 1.15, 0), new T.Vector3(1.4, 1.15, 0),
      new T.Vector3(2.95, 1.2, 0), new T.Vector3(3.45, 2.1, 0), new T.Vector3(3.62, 1.0, 0), new T.Vector3(3.95, 0.85, 0),
      new T.Vector3(4.25, 1.6, 0), new T.Vector3(4.15, 2.6, 0),
    ], true, "catmullrom", 0.5);
    const LOOP_PTS = loop.getSpacedPoints(600);
    const N = lite ? 1100 : 2600;
    const pPos = new Float32Array(N * 3), pCol = new Float32Array(N * 3);
    const pS = new Float32Array(N), pSpd = new Float32Array(N), pOy = new Float32Array(N), pOz = new Float32Array(N);
    for (let i = 0; i < N; i++) { pS[i] = Math.random(); pSpd[i] = 0.035 + Math.random() * 0.03; pOy[i] = Math.random() * 2 - 1; pOz[i] = Math.random() * 2 - 1; }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute("position", new T.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new T.BufferAttribute(pCol, 3));
    const pMat = new T.PointsMaterial({ size: 0.1, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true, opacity: 0.85 });
    const points = new T.Points(pGeo, pMat);
    points.frustumCulled = false;
    scene.add(points);
    const cAir = C("#b9e6ff"), cCold = C("#2f8bff"), cWarm = C("#ff7a2e"), cTmp = new T.Color();

    // испарение с рыбы
    const MN = lite ? 260 : 620;
    const mPos = new Float32Array(MN * 3), mLife = new Float32Array(MN), mBase = new Float32Array(MN * 3);
    const resetMist = (i) => {
      const t = trolleyPicks[Math.floor(Math.random() * trolleyPicks.length)];
      mBase[i * 3] = t.position.x + (Math.random() - 0.5) * TW;
      mBase[i * 3 + 1] = BASE + 0.4 + Math.random() * 1.6;
      mBase[i * 3 + 2] = t.position.z + (Math.random() - 0.5) * TD;
      mLife[i] = 0;
    };
    for (let i = 0; i < MN; i++) { resetMist(i); mLife[i] = Math.random(); }
    const mGeo = new T.BufferGeometry();
    mGeo.setAttribute("position", new T.BufferAttribute(mPos, 3));
    const mist = new T.Points(mGeo, new T.PointsMaterial({ size: 0.05, map: glowTex, color: C("#d6f1ff"), transparent: true, opacity: 0.32, depthWrite: false, blending: T.AdditiveBlending }));
    mist.frustumCulled = false;
    scene.add(mist);

    // конденсат: капли с испарителя в поддон и всплески
    const dropMat = new T.MeshStandardMaterial({ color: C("#bfe6ff"), metalness: 0.1, roughness: 0.05, emissive: C("#3b9bff"), emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
    const drops = Array.from({ length: 7 }, (_, i) => {
      const m = new T.Mesh(new T.SphereGeometry(0.022, 10, 8), dropMat);
      m.scale.set(1, 1.5, 1);
      scene.add(m);
      const ring = new T.Mesh(new T.RingGeometry(0.02, 0.03, 24), new T.MeshBasicMaterial({ color: C("#9fd8ff"), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; scene.add(ring);
      return { m, ring, z: -1.2 + i * 0.4, y: 0.78, vy: 0, wait: Math.random() * 1.5, splash: -1 };
    });

    // пар из воздуховода
    const smoke = Array.from({ length: lite ? 6 : 12 }, (_, i) => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: C("#cbd5e1"), transparent: true, opacity: 0, depthWrite: false }));
      scene.add(s);
      return { s, t: i / 12 };
    });

    // ---------- HTML-выноски с телеметрией ----------
    const TAGS = [
      { id: "fans", p: [-1.6, 2.95, -0.2], c: "#38BDF8" },
      { id: "fish", p: [-2.3, 2.35, 1.3], c: "#FBBF24" },
      { id: "coil", p: [3.45, 2.95, 1.5], c: "#60A5FA" },
      { id: "reheat", p: [4.35, 3.55, 0.9], c: "#FB923C" },
      { id: "comp", p: [5.1, 1.25, 0.7], c: "#A78BFA" },
      { id: "duct", p: [6.3, 4.6, 0], c: "#2DD4BF" },
      { id: "eev", p: [4.95, 2.45, 1.05], c: "#FBBF24" },
      { id: "box20", p: [7.05, 4.75, 0.35], c: "#2DD4BF" },
      { id: "vents", p: [6.0, 3.25, -0.9], c: "#E2E8F0" },
      { id: "mcgs", p: [5.62, 2.75, 1.1], c: "#A78BFA" },
      { id: "refit", p: [5.45, 0.95, -1.15], c: "#34D399" },
    ].map((t) => {
      // маркер-«горячая точка» + подпись над ним; по нажатию — панель телеметрии
      const el = document.createElement("div");
      el.className = "fx-live3d-tag fx-hs";
      el.style.setProperty("--c", t.c);
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      const dot = document.createElement("span");
      dot.className = "fx-hs-dot";
      dot.style.setProperty("--c", t.c);
      tagsBox.appendChild(dot);
      tagsBox.appendChild(el);
      const open = (e) => { e.stopPropagation(); openFlyout(t.id); };
      el.addEventListener("click", open);
      dot.addEventListener("click", open);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFlyout(t.id); } });
      return { ...t, v: new T.Vector3(t.p[0], t.p[1], t.p[2]), el, dot, sx: 0, sy: 0 };
    });

    // ---------- панель «Телеметрия в реальном времени» (HUD Flyout по эскизу Stitch) ----------
    const HS_TO_PID = { fans: "fans", fish: "chamber", coil: "evap", reheat: "reheat", comp: "comp", duct: "reheat", eev: "eev", box20: "recovery", refit: "recv" };
    const HS_EXTRA = {
      duct: { title: "Воздуховод рекуперации", rows: [["Назначение", "сброс / возврат тепла"], ["Мощность рекуперации", "≈14 кВт (паспорт)", "a"]], src: "Паспортное значение AIM AGHD-250ELC." },
      box20: { title: "Термо-короб эстакады [20]", rows: [["Зима", "14 кВт в цех над комнатой мастера", "a"], ["Лето", "сброс на улицу"], ["STC-1000", "обратная труба Ø20 мм, разрыв KM4"], ["Уставки", "ВКЛ +36°C / ВЫКЛ +28°C", "a"], ["Давление", "держит 22–24 бар"]], src: "Настройка цеха • база знаний «Линия AIM», узел [10]." },
      vents: { title: "Вытяжка VENTS TT PRO 200", rows: [["Расход", "1040 м³/ч", "a"], ["Термостат", "KTS 011 в щите HAPN: +25°C"], ["Шибер улицы", "закрыт"], ["Тройник", "открыт в цех"], ["Дверь компрессорной", "закрыта — слив 75 л/ч через гидрозатвор"]], src: "Настройка цеха • база знаний «Линия AIM», узел [11]." },
      mcgs: { title: "Сервисная карта MCGS", rows: [["System", "Com StopTemp 80°C • Upper ExTemp 95°C (было 120)"], ["Defrost", "Cycle 40 мин • Temp −2.0°C"], ["EEV", "Default 170 (было 200) • Min 75 • control 0 (Dew point)"], ["Switch", "CondeFan ov = 1"], ["Unlock", "0 — НЕ ТРОГАТЬ!", "a"]], src: "Уставки контроллера — вводятся вручную, связи программы с MCGS нет." },
      refit: { title: "ТЗ холодильщикам: 7 узлов Контура №1", rows: [["Байпас", "Danfoss KVC 15/22 [8] (+2°C)"], ["Pump-down", "LLSV EVR 10/15 [19] после DML 164"], ["Докипатель", "8–10 л [14] вместо 3 л + фильтр НД [13]"], ["Нагнетание", "маслоотделитель [3] + NRV [4]"], ["Защита", "реле KP15"], ["Дозаправка", "+2.5–3 кг R410A + 150–200 мл FV68S", "a"], ["Трасса 10 м", "2×Ø30 + 2×Ø20 мм"]], src: "План дооснащения от залива −20.6°C • база знаний, узел [13]." },
    };
    const fly = document.createElement("div");
    fly.className = "fx-hs-fly";
    layer.appendChild(fly);
    const leadSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    leadSvg.setAttribute("class", "fx-hs-lead");
    const leadPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    leadSvg.appendChild(leadPath);
    layer.appendChild(leadSvg);
    let flyId = null;

    function flyHtml(id) {
      const pidId = HS_TO_PID[id];
      const d = HS_EXTRA[id] || (window.ArmPid && window.ArmPid.describe(pidId));
      const tl = telemetry();
      const info = d || { title: id, rows: [["T / rH", `${tl.tempC.toFixed(1)}°C · ${tl.rh}%`]], src: "" };
      return `<div class="fx-hs-fly-head"><span>${info.title}</span><button type="button" class="fx-hs-x" aria-label="Закрыть">✕</button></div>
        <div class="fx-hs-fly-sub">${HS_EXTRA[id] && id !== "duct" ? "НАСТРОЙКИ И УЗЛЫ ЦЕХА" : "ТЕЛЕМЕТРИЯ В РЕАЛЬНОМ ВРЕМЕНИ"}</div>` +
        info.rows.map(([k, v, c]) => `<div class="fx-hs-row"><span>${k}</span><b class="${c || ""}">${v}</b></div>`).join("") +
        (info.src ? `<div class="fx-hs-src">${info.src}</div>` : "") +
        (typeof window.ckOpenPidNode === "function" && HS_TO_PID[id] ? `<button type="button" class="fx-hs-go">2D CAD-схема узла →</button>` : "");
    }
    function renderFly() {
      if (!flyId) return;
      fly.innerHTML = flyHtml(flyId);
      fly.querySelector(".fx-hs-x").onclick = (e) => { e.stopPropagation(); closeFlyout(); };
      const go = fly.querySelector(".fx-hs-go");
      if (go) go.onclick = (e) => {
        e.stopPropagation();
        const id = HS_TO_PID[flyId];
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        closeFlyout();
        window.ckOpenPidNode(id);
      };
    }
    function openFlyout(id) {
      if (flyId === id) { closeFlyout(); return; }
      flyId = id;
      // панель справа (слева — плашки климата карточки); если точка под панелью — уводим панель вниз/вверх
      const tg0 = TAGS.find((x) => x.id === id);
      const underPanel = !!tg0 && tg0.sx > layer.clientWidth - 330;
      fly.classList.toggle("bottom", underPanel && tg0.sy < layer.clientHeight * 0.5);
      TAGS.forEach((t) => { t.el.classList.toggle("sel", t.id === id); t.dot.classList.toggle("sel", t.id === id); });
      renderFly();
      fly.classList.remove("on"); void fly.offsetWidth; fly.classList.add("on");
      layer.classList.add("fx-hs-open");
      if (controls) controls.autoRotate = false;
    }
    function closeFlyout() {
      flyId = null;
      fly.classList.remove("on");
      layer.classList.remove("fx-hs-open");
      TAGS.forEach((t) => { t.el.classList.remove("sel"); t.dot.classList.remove("sel"); });
    }
    const flyTimer = setInterval(renderFly, 1500);
    function updateTagText() {
      const tl = telemetry();
      const txt = {
        fans: `CANTONI 4×3кВт <b>${tl.fanHz} Гц</b>`,
        fish: `15 ТЕЛЕЖЕК <b>${tl.tempC.toFixed(1)}°C · ${tl.rh}%</b>`,
        coil: `1#DEHUMICOIL <b>+${tl.coil.toFixed(1)}°C</b>`,
        reheat: `REHEAT <b>+68°C</b>`,
        comp: `SCROLL R410A <b>24.0 бар</b>`,
        duct: `РЕКУПЕРАЦИЯ <b>+14 кВт</b>`,
        eev: `1#EEV <b>${tl.eev || 315} st</b>`,
        box20: `ТЕРМОКОРОБ [20] <b>STC +36/+28°C</b>`,
        vents: `VENTS TT PRO 200 <b>1040 м³/ч</b>`,
        mcgs: `MCGS <b>сервисная карта</b>`,
        refit: `ТЗ КОНТУР №1 <b>7 узлов</b>`,
      };
      TAGS.forEach((t) => { const h = txt[t.id]; if (t.el.innerHTML !== h) t.el.innerHTML = h; });
      hudEl.innerHTML = `<span class="dot"></span>LIVE • AIM AGHD-250ELC • VPD ${Number(tl.vpd).toFixed(2)} кПа • ${tl.pause ? "ПАУЗА ДИФФУЗИИ" : "СУШКА"}`;
    }
    updateTagText();
    const tagTimer = setInterval(updateTagText, 1200);
    const proj = new T.Vector3();

    // ---------- клик по тележке → 3D-инспектор кокпита ----------
    const ray = new T.Raycaster(), mouse = new T.Vector2();
    let downAt = null;
    renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; if (controls) controls.autoRotate = false; });
    renderer.domElement.addEventListener("pointerup", (e) => {
      if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) { downAt = null; return; }
      downAt = null;
      const r = renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects(trolleyPicks)[0];
      if (!hit && flyId) { closeFlyout(); return; }
      if (hit && typeof window.ckOpenTrolley3DModal === "function") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        window.ckOpenTrolley3DModal(hit.object.userData.trolley, hit.object.userData.row);
      }
    });
    let idleTimer = null;
    renderer.domElement.addEventListener("pointerup", () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (controls) controls.autoRotate = true; }, 6000);
    });

    // ---------- размер и цикл ----------
    function resize() {
      const w = host.clientWidth || 300, h = host.clientHeight || 200;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1.2 ? 48 : 36;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const clock = new T.Clock();
    const introFrom = camera.position.clone();
    // на узкой карточке отъезжаем дальше, чтобы тоннель и блок AIM помещались целиком
    const aspect0 = (host.clientWidth || 300) / (host.clientHeight || 200);
    const introTo = new T.Vector3(2.4, 2.75, 10.6).sub(target).multiplyScalar(aspect0 < 1.4 ? 1.45 : aspect0 < 1.9 ? 1.12 : 1).add(target);
    let introT = 0, fanK = 1, raf = 0, running = false;

    function frame() {
      raf = requestAnimationFrame(frame);
      if (document.visibilityState !== "visible" || !host.isConnected || host.offsetParent === null) return;
      const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
      const tl = telemetry();
      fanK += ((tl.pause ? 0.25 : tl.fanHz / 30) - fanK) * 0.04;

      if (introT < 1) {
        introT = Math.min(1, introT + dt / 2.6);
        const e = 1 - Math.pow(1 - introT, 3);
        camera.position.lerpVectors(introFrom, introTo, e);
        camera.lookAt(target);
      }
      if (controls && introT >= 1) controls.update();

      fans.forEach((r, i) => { r.rotation.y += dt * (14 + i * 0.6) * fanK; });

      // поток: позиция на петле + разброс по сечению (шире всего — в зоне тележек)
      for (let i = 0; i < N; i++) {
        pS[i] = (pS[i] + pSpd[i] * dt * fanK) % 1;
        const s = pS[i];
        const p = LOOP_PTS[Math.floor(s * (LOOP_PTS.length - 1))];
        const inTrolleys = p.x > -3.6 && p.x < 2.9 && p.y < 1.6;
        const inPlenum = p.y > 2.6 && p.x < 3.2;
        const sy = inTrolleys ? 0.85 : inPlenum ? 0.1 : 0.32;
        const sz = inTrolleys || inPlenum ? 1.45 : 1.25;
        const o = i * 3;
        pPos[o] = p.x + Math.sin(t * 0.7 + i) * 0.04;
        pPos[o + 1] = p.y + pOy[i] * sy + (inTrolleys ? 0.3 : 0);
        pPos[o + 2] = pOz[i] * sz;
        // цвет: холод у испарителя, тепло у догрева, иначе — воздух
        let col = cAir;
        if (p.x > 3.2 && p.x < 4.0) col = cCold;
        else if (p.x >= 4.0 && p.x < 4.5) col = cWarm;
        cTmp.copy(col).multiplyScalar(inTrolleys ? 0.75 : 1.15);
        pCol[o] = cTmp.r; pCol[o + 1] = cTmp.g; pCol[o + 2] = cTmp.b;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;

      for (let i = 0; i < MN; i++) {
        mLife[i] += dt * 0.28;
        if (mLife[i] > 1) resetMist(i);
        const o = i * 3, l = mLife[i];
        mPos[o] = mBase[o] + l * 0.35 * fanK;
        mPos[o + 1] = mBase[o + 1] + l * 0.25;
        mPos[o + 2] = mBase[o + 2] + Math.sin(t + i) * 0.03;
      }
      mGeo.attributes.position.needsUpdate = true;

      drops.forEach((d) => {
        if (d.splash >= 0) {
          d.splash += dt * 1.8;
          d.ring.material.opacity = 0.6 * (1 - d.splash);
          d.ring.scale.setScalar(1 + d.splash * 6);
          if (d.splash >= 1) { d.splash = -1; d.wait = 0.2 + Math.random() * (tl.pause ? 3 : 1.2); d.ring.material.opacity = 0; }
          d.m.visible = false;
          return;
        }
        if (d.wait > 0) { d.wait -= dt; d.m.visible = false; d.y = 0.78; d.vy = 0; return; }
        d.m.visible = true;
        d.vy -= 9.8 * dt * 0.5; d.y += d.vy * dt;
        d.m.position.set(3.62, d.y, d.z);
        if (d.y <= 0.7) { d.splash = 0; d.ring.position.set(3.62, 0.7, d.z); }
      });

      smoke.forEach((sm) => {
        sm.t = (sm.t + dt * 0.12) % 1;
        sm.s.position.set(ductEnd.x + sm.t * 2.2, ductEnd.y + sm.t * 0.7 + Math.sin(sm.t * 6 + t) * 0.06, Math.sin(sm.t * 4) * 0.2);
        const sc = 0.4 + sm.t * 1.9;
        sm.s.scale.set(sc, sc, 1);
        sm.s.material.opacity = Math.sin(sm.t * Math.PI) * 0.16;
      });

      evapGlow.material.opacity = 0.26 + 0.08 * Math.sin(t * 1.4);
      heatGlow.material.opacity = 0.22 + 0.07 * Math.sin(t * 1.1 + 1);
      leds.forEach((l) => { l.s.material.opacity = l.base * (0.55 + 0.45 * (Math.sin(t * 3 + l.ph) > 0.2 ? 1 : 0.3)); });
      gauges.forEach((g, i) => { g.rotation.z = -0.6 - i * 0.5 + Math.sin(t * 0.8 + i) * 0.03; });
      ventsBlades.rotation.z = t * 9; // крыльчатка вытяжки VENTS

      renderer.render(scene, camera);

      const w = host.clientWidth, h = host.clientHeight;
      TAGS.forEach((tg) => {
        proj.copy(tg.v).project(camera);
        const behind = proj.z > 1;
        tg.sx = (proj.x * 0.5 + 0.5) * w;
        tg.sy = (-proj.y * 0.5 + 0.5) * h;
        const op = behind ? "0" : "1";
        tg.el.style.opacity = op;
        tg.dot.style.opacity = op;
        // подпись — над маркером, маркер — в самой точке узла
        tg.el.style.transform = `translate(${tg.sx.toFixed(1)}px, ${(tg.sy - 16).toFixed(1)}px)`;
        tg.dot.style.transform = `translate(${tg.sx.toFixed(1)}px, ${tg.sy.toFixed(1)}px)`;
      });

      // выноска от выбранной точки к панели
      if (flyId) {
        const tg = TAGS.find((x) => x.id === flyId);
        const fr = fly.getBoundingClientRect(), lr = layer.getBoundingClientRect();
        const fx = fr.left - lr.left, fy = fr.top - lr.top + 22;
        if (tg.sx < fx - 10) {
          const midX = Math.max(tg.sx + 20, fx - 40);
          leadPath.setAttribute("d", `M ${tg.sx.toFixed(1)} ${tg.sy.toFixed(1)} L ${midX.toFixed(1)} ${fy.toFixed(1)} L ${fx.toFixed(1)} ${fy.toFixed(1)}`);
        } else {
          // точка над/под панелью — короткая вертикальная выноска к ближнему краю
          const ey = tg.sy < fr.top - lr.top ? fr.top - lr.top : fr.bottom - lr.top;
          leadPath.setAttribute("d", `M ${tg.sx.toFixed(1)} ${tg.sy.toFixed(1)} L ${tg.sx.toFixed(1)} ${ey.toFixed(1)}`);
        }
        leadSvg.style.setProperty("--c", tg.c);
      }
    }

    return {
      start() { if (running) return; running = true; clock.getDelta(); frame(); },
      stop() { running = false; cancelAnimationFrame(raf); },
      dispose() {
        this.stop(); ro.disconnect(); clearInterval(tagTimer); clearInterval(flyTimer);
        fly.remove(); leadSvg.remove();
        renderer.dispose(); renderer.domElement.remove();
      },
    };
  }

  // =====================================================================
  // Показ / скрытие
  // =====================================================================
  function ensureLayer(host) {
    if (layer && layer.parentElement === host) return;
    if (layer) layer.remove();
    layer = document.createElement("div");
    layer.className = "fx-live3d-layer";
    layer.innerHTML = '<div class="fx-live3d-hud"></div><div class="fx-live3d-tags"></div><div class="fx-live3d-msg">Загружаю 3D-движок…</div>';
    host.appendChild(layer);
    hudEl = layer.querySelector(".fx-live3d-hud");
    tagsBox = layer.querySelector(".fx-live3d-tags");
    msgEl = layer.querySelector(".fx-live3d-msg");
    if (app) { app.dispose(); app = null; }
  }

  function show(host) {
    if (!host) return false;
    ensureLayer(host);
    layer.classList.add("on");
    visible = true;
    if (app) { app.start(); return true; }
    let webgl = false;
    try { const c = document.createElement("canvas"); webgl = !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) {}
    if (!webgl) { msgEl.textContent = "Видеокарта или браузер не поддерживают WebGL — 3D-двойник недоступен."; return true; }
    msgEl.style.display = "flex";
    msgEl.textContent = "Загружаю 3D-движок…";
    loadLibs().then((T) => {
      if (!visible || app) return;
      try {
        app = buildApp(T, layer);
        msgEl.style.display = "none";
        app.start();
      } catch (e) {
        console.error("[3D-двойник]", e);
        msgEl.textContent = "Не удалось построить 3D-сцену: " + e.message;
      }
    }).catch(() => {
      msgEl.textContent = "3D-движок не загрузился: нет файлов js/vendor/three/ и нет интернета. Вернитесь к фото-разрезу кнопкой «3D LIVE».";
    });
    return true;
  }

  function hide() {
    visible = false;
    if (layer) layer.classList.remove("on");
    if (app) app.stop();
    if (document.fullscreenElement === layer) document.exitFullscreen().catch(() => {});
  }

  window.ArmChamber3D = { show, hide };
})();
