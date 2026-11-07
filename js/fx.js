'use strict';
// ---------------------------------------------------------------------------
// Visual effects: blood particles, ground stains, flying limbs (gibs),
// sparks, fire, embers, floating text and screen shake.
// ---------------------------------------------------------------------------
const BLOOD_COLS = ['#8a0303', '#a10d0d', '#6b0000', '#7a0505', '#b01212'];

const FX = {
  parts: [], decals: [], gibs: [], texts: [],
  shake: 0, hitstop: 0,

  reset() { this.parts.length = 0; this.gibs.length = 0; this.texts.length = 0; this.shake = 0; this.hitstop = 0; },
  clearDecals() { this.decals.length = 0; },

  add(p) { if (this.parts.length < 2600) this.parts.push(p); },
  addShake(v) { this.shake = Math.max(this.shake, v); },
  addHitstop(v) { this.hitstop = Math.max(this.hitstop, v); },

  // ang uses screen convention: 0 = right, -PI/2 = up
  blood(x, y, ang, spread, speed, n, size = 1, cols) {
    for (let i = 0; i < n; i++) {
      const a = ang + rand(-spread, spread), v = speed * rand(0.3, 1.1);
      this.add({ k: 'b', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 3, r: rand(1.1, 3.1) * size, gy: rand(-2, 9), col: pick(cols || BLOOD_COLS) });
    }
  },
  mist(x, y, n, dir = 0) {
    for (let i = 0; i < n; i++) {
      this.add({ k: 'm', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: dir * rand(20, 90) + rand(-30, 30), vy: rand(-50, 10), t: 0, life: rand(0.5, 1.1), r: rand(4, 10) });
    }
  },
  // directional slash spray when a blade connects
  slash(x, y, dir, power) {
    this.blood(x, y, dir > 0 ? -0.35 : Math.PI + 0.35, 0.65, 330 + power * 8, Math.round(power), 1);
    this.blood(x, y, -Math.PI / 2, 1.2, 160, Math.round(power * 0.4), 0.8);
    this.mist(x, y, 3, dir);
  },
  // arterial spray (severed limbs, hemorrhage)
  gush(x, y, ang, n, speed = 420) {
    this.blood(x, y, ang, 0.28, speed, n, 1.25);
    this.mist(x, y, 4, Math.cos(ang));
  },
  sparks(x, y, n, dir = 0) {
    for (let i = 0; i < n; i++) {
      const a = (dir ? (dir > 0 ? 0 : Math.PI) : rand(0, Math.PI * 2)) + rand(-1.1, 1.1) - 0.4;
      const v = rand(150, 480);
      this.add({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(0.15, 0.4) });
    }
  },
  dust(x, y, n, spread = 30) {
    for (let i = 0; i < n; i++) this.add({ k: 'd', x: x + rand(-spread, spread), y: y - rand(0, 6), vx: rand(-90, 90), vy: rand(-90, -10), t: 0, life: rand(0.5, 1.1), r: rand(4, 10) });
  },
  fire(x, y) { this.add({ k: 'f', x: x + rand(-6, 6), y, vx: rand(-12, 12), vy: rand(-90, -40), t: 0, life: rand(0.35, 0.8), r: rand(4, 9) }); },
  smoke(x, y) { this.add({ k: 'k', x: x + rand(-10, 10), y, vx: rand(-8, 20), vy: rand(-45, -25), t: 0, life: rand(2, 3.5), r: rand(10, 18) }); },
  ember(x, y) { this.add({ k: 'e', x, y, vx: rand(-20, 30), vy: rand(-80, -30), t: 0, life: rand(1.2, 2.6), ph: rand(0, 6) }); },
  soul(x, y, tx, ty) { this.add({ k: 'o', x, y, tx, ty, vx: rand(-80, 80), vy: rand(-160, -40), t: 0, life: 1.2 }); },
  aura(x, y) { this.add({ k: 'a', x: x + rand(-18, 18), y: y + rand(-20, 20), vx: rand(-10, 10), vy: rand(-70, -30), t: 0, life: rand(0.5, 1), r: rand(3, 7) }); },
  text(x, y, str, col = '#e8d9b0', size = 16, life = 1.4) { this.texts.push({ x, y, str, col, size, t: 0, life }); },

  decal(x, r, y) {
    const gy = y !== undefined ? y : GROUND + rand(-1, 8);
    this.decals.push({ x, y: gy, rx: r * rand(1.4, 2.2), ry: r * rand(0.35, 0.55), col: pick(BLOOD_COLS), a: rand(0.65, 0.9) });
    if (this.decals.length > 1400) this.decals.splice(0, 200);
  },
  pool(x, size) {
    const d = { x, y: GROUND + 4, rx: 4, ry: 1.5, grow: size, col: '#5a0000', a: 0.9 };
    this.decals.push(d);
    return d;
  },

  addGib(g) {
    g.rot = g.rot || 0;
    g.ground = GROUND + rand(-2, 7) - 3;
    g.bleed = g.bleed !== undefined ? g.bleed : 3;
    this.gibs.push(g);
    if (this.gibs.length > 70) this.gibs.shift();
  },

  update(dt) {
    this.shake *= Math.exp(-dt * 9);
    if (this.shake < 0.2) this.shake = 0;
    const P = this.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.t += dt;
      switch (p.k) {
        case 'b':
          p.vy += GRAVITY * 0.92 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.y >= GROUND + p.gy && p.vy > 0) {
            if (chance(0.55)) this.decal(p.x, p.r * rand(0.9, 1.8), GROUND + p.gy);
            P.splice(i, 1); continue;
          }
          break;
        case 'o': { // ember souls homing to a target
          const k = Math.min(1, p.t / p.life);
          p.vx += (p.tx() - p.x) * 18 * k * dt; p.vy += (p.ty() - p.y) * 18 * k * dt;
          p.vx *= 0.96; p.vy *= 0.96;
          p.x += p.vx * dt; p.y += p.vy * dt;
          break;
        }
        case 's': p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; break;
        case 'e': p.x += (p.vx + Math.sin(p.t * 3 + p.ph) * 20) * dt; p.y += p.vy * dt; break;
        default: p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; break;
      }
      if (p.t >= p.life) P.splice(i, 1);
    }
    for (const d of this.decals) if (d.grow && d.rx < d.grow) { d.rx += dt * 9; d.ry = d.rx * 0.28; }
    for (const g of this.gibs) {
      if (!g.rest) {
        g.vy += GRAVITY * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.rot += g.vr * dt;
        if (g.y >= g.ground) {
          g.y = g.ground;
          if (Math.abs(g.vy) > 160) {
            g.vy *= -0.32; g.vx *= 0.55; g.vr *= 0.5;
            this.decal(g.x, rand(5, 9));
            Sfx.play('thud');
            this.blood(g.x, g.y, -Math.PI / 2, 0.9, 140, 5);
          } else {
            g.vy = 0; g.vx = 0; g.rest = true;
            g.rot = Math.round(g.rot / (Math.PI / 2)) * (Math.PI / 2) + (g.part === 'head' ? 0 : Math.PI / 2 * 0);
            if (g.part !== 'weapon' && g.part !== 'shield') this.pool(g.x, rand(10, 18));
          }
        }
      }
      if (g.bleed > 0 && g.part !== 'weapon' && g.part !== 'shield') {
        g.bleed -= dt;
        if (chance(dt * (g.rest ? 6 : 40))) this.blood(g.x, g.y, -Math.PI / 2, 1.2, g.rest ? 60 : 120, 1, 0.8);
      }
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.t += dt; t.y -= 22 * dt;
      if (t.t > t.life) this.texts.splice(i, 1);
    }
  },

  drawDecals(ctx, l, r) {
    for (const d of this.decals) {
      if (d.x + d.rx < l || d.x - d.rx > r) continue;
      ctx.globalAlpha = d.a; ctx.fillStyle = d.col;
      ctx.beginPath(); ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  drawGibs(ctx, l, r) {
    for (const g of this.gibs) {
      if (g.x < l - 60 || g.x > r + 60) continue;
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot); ctx.scale(g.facing * g.s, g.s);
      drawGibPart(ctx, g);
      ctx.restore();
    }
  },

  drawParts(ctx, l, r) {
    ctx.lineCap = 'round';
    for (const p of this.parts) {
      if (p.x < l - 40 || p.x > r + 40) continue;
      const f = p.t / p.life;
      switch (p.k) {
        case 'b':
          ctx.strokeStyle = p.col; ctx.lineWidth = p.r;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.014, p.y - p.vy * 0.014); ctx.stroke();
          break;
        case 'm':
          ctx.globalAlpha = (1 - f) * 0.35; ctx.fillStyle = '#7a0000';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + f), 0, Math.PI * 2); ctx.fill();
          break;
        case 's':
          ctx.globalAlpha = 1 - f; ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); ctx.stroke();
          break;
        case 'd':
          ctx.globalAlpha = (1 - f) * 0.35; ctx.fillStyle = '#5a4a3c';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + f), 0, Math.PI * 2); ctx.fill();
          break;
        case 'k':
          ctx.globalAlpha = (1 - f) * 0.22; ctx.fillStyle = '#1c1616';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + f * 2), 0, Math.PI * 2); ctx.fill();
          break;
        case 'f':
          ctx.globalAlpha = 1 - f; ctx.fillStyle = f < 0.3 ? '#ffd27a' : f < 0.6 ? '#ff7a1a' : '#a3260a';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - f * 0.6), 0, Math.PI * 2); ctx.fill();
          break;
        case 'e':
          ctx.globalAlpha = (1 - f) * (0.6 + Math.sin(p.t * 12) * 0.4); ctx.fillStyle = '#ff9a3a';
          ctx.fillRect(p.x, p.y, 2, 2);
          break;
        case 'o':
          ctx.globalAlpha = 1 - f * 0.5; ctx.fillStyle = '#ffcf7a';
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha *= 0.3; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          break;
        case 'fy': // fairy sparkle
          ctx.globalAlpha = (1 - f) * (0.6 + Math.sin(p.t * 14 + p.ph) * 0.4); ctx.fillStyle = f < 0.4 ? '#ffffff' : (p.color || '#c9b0ff');
          ctx.fillRect(p.x - 0.8, p.y - 2.2, 1.6, 4.4); ctx.fillRect(p.x - 2.2, p.y - 0.8, 4.4, 1.6);
          break;
        case 'a':
          ctx.globalAlpha = (1 - f) * 0.5; ctx.fillStyle = '#c0140f';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - f * 0.5), 0, Math.PI * 2); ctx.fill();
          break;
      }
    }
    ctx.globalAlpha = 1;
  },

  drawTexts(ctx) {
    for (const t of this.texts) {
      const f = t.t / t.life;
      ctx.globalAlpha = f < 0.15 ? f / 0.15 : 1 - Math.max(0, (f - 0.6) / 0.4);
      ctx.font = `${t.size}px ${TITLE_FONT}`; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText(t.str, t.x + 1, t.y + 1);
      ctx.fillStyle = t.col; ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  },
};
