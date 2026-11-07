(function() {
  let cachedDataUrl = null;
  let renderingPromise = null;

  function loadImg(src) {
    return new Promise((res) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = src;
    });
  }

  async function renderTrolleyToCanvas(c) {
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const scaleFactor = W / 1024;
    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);

    const fishImg = await loadImg('vimba-3d.png') || await loadImg('/jurmalciems-arm/vimba-3d.png');
    const bgImg = await loadImg('chamber-3d.png') || await loadImg('/jurmalciems-arm/chamber-3d.png');

    // 1. Dark Industrial Chamber & Wet Concrete Floor Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    bgGrad.addColorStop(0, '#07111a');
    bgGrad.addColorStop(0.58, '#0b1621');
    bgGrad.addColorStop(1, '#04080d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.filter = 'blur(16px) saturate(0.45) contrast(1.25)';
      ctx.drawImage(bgImg, -80, -60, 1184, 736);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(120,160,190,0.06)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(120 + i * 150, 0);
      ctx.lineTo(120 + i * 150, 560);
      ctx.stroke();
    }
    ctx.restore();

    // Left Cyan Studio Rim Glow (#00f0ff)
    const cyanGlow = ctx.createRadialGradient(240, 420, 20, 240, 420, 460);
    cyanGlow.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    cyanGlow.addColorStop(0.5, 'rgba(0, 195, 225, 0.08)');
    cyanGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cyanGlow;
    ctx.fillRect(0, 0, 1024, 1024);

    // Right Amber Studio Rim Glow (#ffb95f)
    const amberGlow = ctx.createRadialGradient(770, 440, 20, 770, 440, 460);
    amberGlow.addColorStop(0, 'rgba(255, 185, 95, 0.23)');
    amberGlow.addColorStop(0.55, 'rgba(245, 158, 11, 0.07)');
    amberGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = amberGlow;
    ctx.fillRect(0, 0, 1024, 1024);

    // Floor Reflection & Contact Shadow
    const floorShadow = ctx.createRadialGradient(500, 825, 30, 500, 825, 360);
    floorShadow.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    floorShadow.addColorStop(0.55, 'rgba(0, 0, 0, 0.65)');
    floorShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorShadow;
    ctx.beginPath();
    ctx.ellipse(500, 825, 370, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    function iso(u, v, z) {
      const cx = 520, cy = 192;
      const ux = -290, uy = 112;
      const vx = 250,  vy = 116;
      const zx = 0,    zy = -585;
      return {
        x: cx + u * ux + v * vx + (1 - z) * (-zx),
        y: cy + u * uy + v * vy + (1 - z) * (-zy)
      };
    }

    function drawSquareTube(p1, p2, width, tint = 'neutral') {
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const grad = ctx.createLinearGradient(
        (p1.x + p2.x) * 0.5 - nx * width * 0.6,
        (p1.y + p2.y) * 0.5 - ny * width * 0.6,
        (p1.x + p2.x) * 0.5 + nx * width * 0.6,
        (p1.y + p2.y) * 0.5 + ny * width * 0.6
      );
      if (tint === 'cyan') {
        grad.addColorStop(0, '#ccfaff');
        grad.addColorStop(0.22, '#6fdbe8');
        grad.addColorStop(0.5, '#476578');
        grad.addColorStop(0.82, '#1d2d3a');
        grad.addColorStop(1, '#58b8c9');
      } else if (tint === 'amber') {
        grad.addColorStop(0, '#ffe4b8');
        grad.addColorStop(0.25, '#cfa063');
        grad.addColorStop(0.55, '#594b3b');
        grad.addColorStop(0.85, '#262019');
        grad.addColorStop(1, '#9c784c');
      } else {
        grad.addColorStop(0, '#d8e4ec');
        grad.addColorStop(0.25, '#8fa3b0');
        grad.addColorStop(0.55, '#455461');
        grad.addColorStop(0.85, '#1e2730');
        grad.addColorStop(1, '#687b8a');
      }
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.strokeStyle = tint === 'cyan' ? 'rgba(180,252,255,0.65)' : tint === 'amber' ? 'rgba(255,224,172,0.55)' : 'rgba(255,255,255,0.42)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p1.x - nx * width * 0.36, p1.y - ny * width * 0.36);
      ctx.lineTo(p2.x - nx * width * 0.36, p2.y - ny * width * 0.36);
      ctx.stroke();
      ctx.restore();
    }

    function drawCaster(pos, scale = 1, tint = 'neutral') {
      const x = pos.x, y = pos.y + 26 * scale;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.beginPath();
      ctx.ellipse(x, y + 20 * scale, 30 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      const wGrad = ctx.createRadialGradient(x - 5 * scale, y - 3 * scale, 2, x, y + 4 * scale, 24 * scale);
      wGrad.addColorStop(0, '#4f5d69');
      wGrad.addColorStop(0.45, '#1f262d');
      wGrad.addColorStop(0.85, '#0d1116');
      wGrad.addColorStop(1, '#2d3742');
      ctx.fillStyle = wGrad;
      ctx.beginPath();
      ctx.arc(x, y + 4 * scale, 21 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tint === 'cyan' ? 'rgba(0,240,255,0.45)' : 'rgba(200,215,225,0.3)';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      ctx.fillStyle = tint === 'cyan' ? '#6d99ab' : '#6b7782';
      ctx.beginPath();
      ctx.moveTo(x - 17 * scale, y - 24 * scale);
      ctx.lineTo(x + 17 * scale, y - 24 * scale);
      ctx.lineTo(x + 10 * scale, y + 6 * scale);
      ctx.lineTo(x - 10 * scale, y + 6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = '#d8e4ec';
      ctx.beginPath();
      ctx.arc(x, y + 3 * scale, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawCuredFish(cx, cy, w, h, angleRad, brightness = 1.0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRad);

      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.beginPath();
      ctx.ellipse(3, 5, w * 0.45, h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.bezierCurveTo(w * 0.55, -h * 0.26, w * 0.50, h * 0.22, w * 0.12, h * 0.38);
      ctx.lineTo(w * 0.30, h * 0.52);
      ctx.lineTo(0, h * 0.42);
      ctx.lineTo(-w * 0.30, h * 0.52);
      ctx.lineTo(-w * 0.12, h * 0.38);
      ctx.bezierCurveTo(-w * 0.50, h * 0.22, -w * 0.55, -h * 0.26, 0, -h * 0.5);
      ctx.closePath();
      ctx.clip();

      const g = ctx.createLinearGradient(-w * 0.5, -h * 0.4, w * 0.5, h * 0.4);
      g.addColorStop(0, '#593614');
      g.addColorStop(0.28, '#a66b28');
      g.addColorStop(0.55, '#dfa14b');
      g.addColorStop(0.78, '#b3752c');
      g.addColorStop(1, '#42250b');
      ctx.fillStyle = g;
      ctx.fillRect(-w, -h, w * 2, h * 2);

      if (fishImg) {
        ctx.globalAlpha = 0.72 * brightness;
        ctx.drawImage(fishImg, -w * 0.78, -h * 0.58, w * 1.56, h * 1.16);
        ctx.globalAlpha = 1.0;
      }

      ctx.strokeStyle = 'rgba(40, 18, 4, 0.35)';
      ctx.lineWidth = 1.1;
      for (let sy = -h * 0.28; sy < h * 0.28; sy += h * 0.085) {
        ctx.beginPath();
        ctx.arc(0, sy, w * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(30, 12, 2, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -h * 0.32, w * 0.26, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();

      const rim = ctx.createLinearGradient(-w * 0.48, 0, w * 0.48, 0);
      rim.addColorStop(0, 'rgba(15, 25, 32, 0.48)');
      rim.addColorStop(0.45, 'rgba(215, 145, 55, 0.08)');
      rim.addColorStop(0.85, 'rgba(255, 208, 128, 0.42)');
      rim.addColorStop(1, 'rgba(255, 232, 175, 0.65)');
      ctx.fillStyle = rim;
      ctx.fillRect(-w, -h, w * 2, h * 2);

      ctx.restore();
    }

    drawCaster(iso(0, 0, 0), 0.86, 'neutral');
    drawCaster(iso(1, 0, 0), 0.96, 'cyan');
    drawCaster(iso(0, 1, 0), 0.96, 'amber');
    drawCaster(iso(1, 1, 0), 1.08, 'cyan');

    drawSquareTube(iso(0, 0, 0), iso(0, 0, 1), 15, 'neutral');
    drawSquareTube(iso(0, 1, 0), iso(0, 1, 1), 17, 'amber');

    for (let i = 0; i < 12; i++) {
      const z = 0.06 + i * 0.056;
      drawSquareTube(iso(0, 0, z), iso(1, 0, z), 4.5, 'cyan');
      drawSquareTube(iso(0, 0, z), iso(0, 1, z), 4.0, 'neutral');
    }

    for (let i = 0; i < 12; i++) {
      const z = 0.06 + i * 0.055;
      const pBL = iso(0.04, 0.20, z);
      const pFL = iso(0.96, 0.20, z);
      const pFR = iso(0.96, 0.98, z);
      const pBR = iso(0.04, 0.98, z);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pBL.x, pBL.y);
      ctx.lineTo(pFL.x, pFL.y);
      ctx.lineTo(pFR.x, pFR.y);
      ctx.lineTo(pBR.x, pBR.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(14, 22, 30, 0.82)';
      ctx.fill();

      ctx.strokeStyle = 'rgba(175, 198, 214, 0.24)';
      ctx.lineWidth = 1;
      for (let m = 1; m <= 9; m++) {
        const f = m / 10;
        const a = iso(0.04 + f * 0.92, 0.20, z);
        const b = iso(0.04 + f * 0.92, 0.98, z);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        const c1 = iso(0.04, 0.20 + f * 0.78, z);
        const d1 = iso(0.96, 0.20 + f * 0.78, z);
        ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(d1.x, d1.y); ctx.stroke();
      }
      ctx.restore();

      for (let rowU = 0; rowU < 2; rowU++) {
        const uPos = 0.64 + rowU * 0.24;
        for (let col = 0; col < 3; col++) {
          const vPos = 0.25 + col * 0.28 + ((i + col) % 2) * 0.025;
          const fp = iso(uPos, vPos, z + 0.012);
          drawCuredFish(fp.x, fp.y, 34, 104, -1.13 + ((i + col) % 3) * 0.03, 0.96 + rowU * 0.08);
        }
      }

      drawSquareTube(pFL, pFR, 5.5, 'amber');
      drawSquareTube(pBL, pFL, 4.5, 'neutral');
    }

    const hangTiers = [
      { zRod: 0.39, count: 4, w: 46, h: 142 },
      { zRod: 0.63, count: 5, w: 42, h: 128 }
    ];
    for (const tier of hangTiers) {
      drawSquareTube(iso(0.05, 0.14, tier.zRod), iso(0.95, 0.14, tier.zRod), 5.5, 'cyan');
      for (let k = 0; k < tier.count; k++) {
        const uPos = 0.16 + (k / (tier.count - 1)) * 0.72;
        const hp = iso(uPos, 0.14, tier.zRod);
        drawCuredFish(hp.x, hp.y + tier.h * 0.46, tier.w, tier.h, 0.03 * ((k % 2) - 0.5), 0.9);
      }
    }

    const topRodsV = [0.16, 0.38, 0.62, 0.84];
    for (let rIdx = 0; rIdx < topRodsV.length; rIdx++) {
      const vPos = topRodsV[rIdx];
      for (let k = 0; k < 6; k++) {
        const uPos = 0.12 + k * 0.152;
        const hp = iso(uPos, vPos, 0.965);
        const fw = 44 + ((k + rIdx) % 2) * 5;
        const fh = 158 + ((k * 3 + rIdx) % 3) * 12;
        ctx.strokeStyle = '#d8e6f0';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(hp.x, hp.y - 4);
        ctx.lineTo(hp.x, hp.y + 14);
        ctx.stroke();

        drawCuredFish(hp.x, hp.y + fh * 0.46, fw, fh, ((k - 2.5) * 0.025), 0.96 + rIdx * 0.04);
      }
      drawSquareTube(iso(0.02, vPos, 0.97), iso(0.98, vPos, 0.97), 6.5, rIdx < 2 ? 'cyan' : 'amber');
    }

    drawSquareTube(iso(0, 0, 0), iso(1, 0, 0), 17, 'cyan');
    drawSquareTube(iso(0, 0, 0), iso(0, 1, 0), 15, 'neutral');
    drawSquareTube(iso(1, 0, 0), iso(1, 1, 0), 19, 'cyan');
    drawSquareTube(iso(0, 1, 0), iso(1, 1, 0), 18, 'amber');

    for (let i = 0; i < 12; i++) {
      const z = 0.06 + i * 0.055;
      drawSquareTube(iso(0, 1, z), iso(1, 1, z), 5.0, 'amber');
    }

    drawSquareTube(iso(1, 0, 0), iso(1, 0, 1), 19, 'cyan');
    drawSquareTube(iso(1, 1, 0), iso(1, 1, 1), 22, 'cyan');

    function drawCornerGusset(pCorner, pUp, pSide, tint) {
      ctx.save();
      ctx.fillStyle = tint === 'cyan' ? '#587e91' : '#6c685e';
      ctx.beginPath();
      ctx.moveTo(pCorner.x, pCorner.y);
      ctx.lineTo(pUp.x, pUp.y);
      ctx.lineTo(pSide.x, pSide.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,245,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    drawCornerGusset(iso(1, 1, 0.01), iso(1, 1, 0.08), iso(0.88, 1, 0.01), 'cyan');
    drawCornerGusset(iso(1, 0, 0.01), iso(1, 0, 0.07), iso(0.88, 0, 0.01), 'cyan');

    const hL0 = iso(0, 0, 0.47);
    const hR0 = iso(1, 0, 0.47);
    const hL1 = { x: hL0.x - 28, y: hL0.y + 13 };
    const hR1 = { x: hR0.x - 28, y: hR0.y + 13 };
    drawSquareTube(hL0, hL1, 11, 'cyan');
    drawSquareTube(hR0, hR1, 11, 'cyan');
    drawSquareTube(hL1, hR1, 14, 'cyan');

    drawSquareTube(iso(0, 0, 1), iso(1, 0, 1), 18, 'cyan');
    drawSquareTube(iso(0, 0, 1), iso(0, 1, 1), 16, 'cyan');
    drawSquareTube(iso(0.50, 0, 1), iso(0.50, 1, 1), 16, 'cyan');
    drawSquareTube(iso(1, 0, 1), iso(1, 1, 1), 20, 'cyan');
    drawSquareTube(iso(0, 1, 1), iso(1, 1, 1), 19, 'amber');

    ctx.restore();
  }

  window.getTrolley3DDataUrl = async function() {
    if (cachedDataUrl) return cachedDataUrl;
    if (renderingPromise) return renderingPromise;
    renderingPromise = (async () => {
      // Фотореалистичный рендер тележки (эскиз Stitch); рисованная версия ниже — запасной вариант.
      // Грузим без crossOrigin: на холст его не рисуем, а при открытии через file:// CORS-проверка не пройдёт
      const photo = await new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = 'trolley-real.jpg';
      });
      if (photo) {
        cachedDataUrl = 'trolley-real.jpg';
        window.__TROLLEY_3D_DATA_URL__ = cachedDataUrl;
        return cachedDataUrl;
      }
      const off = document.createElement('canvas');
      off.width = 640;
      off.height = 640;
      await renderTrolleyToCanvas(off);
      cachedDataUrl = off.toDataURL('image/png');
      window.__TROLLEY_3D_DATA_URL__ = cachedDataUrl;
      return cachedDataUrl;
    })();
    return renderingPromise;
  };

  window.applyTrolley3DImages = async function(rootEl) {
    const dataUrl = await window.getTrolley3DDataUrl();
    const scope = rootEl || document;
    scope.querySelectorAll('img.trolley-3d-img, img[data-trolley-3d="1"], img[src*="trolley-3d.png"]').forEach((img) => {
      if (img.src !== dataUrl) {
        img.src = dataUrl;
      }
    });
    return dataUrl;
  };

  window.mountAndDrawTrolley = async function() {
    let c = document.getElementById('renderTrolleyCanvas');
    if (!c) {
      c = document.createElement('canvas');
      c.id = 'renderTrolleyCanvas';
      c.width = 1024;
      c.height = 1024;
      c.style.cssText = 'position:fixed;top:0;left:0;z-index:999999;width:1024px;height:1024px;';
      document.body.appendChild(c);
    }
    await renderTrolleyToCanvas(c);
    return 'OK';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.applyTrolley3DImages());
  } else {
    window.applyTrolley3DImages();
  }
})();
