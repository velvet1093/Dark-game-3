'use strict';
// ---------------------------------------------------------------------------
// Procedural humanoid rig. Every body in the game (knight, foes, NPCs and
// their severed parts) is built from this skeleton.
// Local space: feet on y=0, facing +x. Angles: 0 = straight down,
// +PI/2 = forward, PI = straight up (direction = (sin a, cos a)).
// ---------------------------------------------------------------------------
const RIG = { thigh: 20, shin: 21, torso: 33, neck: 6, headR: 9, upper: 16, fore: 16 };
const LIMBS = ['head', 'armF', 'armB', 'legF', 'legB'];

function basePose(o) {
  const p = { lean: 0, legF: 0.2, kneeF: 0.2, legB: -0.2, kneeB: 0.15, armF: 0.5, elbowF: 0.8, armB: 0.1, elbowB: 0.5, weap: 2.2, head: 0 };
  if (o) Object.assign(p, o);
  return p;
}
function lerpPose(a, b, t) {
  const o = {};
  for (const k in a) o[k] = b[k] === undefined ? a[k] : a[k] + (b[k] - a[k]) * t;
  return o;
}
function blendPose(cur, target, k) {
  for (const key in target) if (cur[key] !== undefined) cur[key] += (target[key] - cur[key]) * k;
}
function walkPose(base, phase, amp, lean) {
  const s = Math.sin(phase), c = Math.cos(phase);
  return Object.assign({}, base, {
    lean: (base.lean || 0) + lean,
    legF: 0.05 + s * amp, legB: 0.05 - s * amp,
    kneeF: 0.15 + Math.max(0, c) * amp * 1.3,
    kneeB: 0.15 + Math.max(0, -c) * amp * 1.3,
    armB: (base.armB || 0) - s * amp * 0.6,
  });
}

function solveRig(p) {
  const R = RIG, sin = Math.sin, cos = Math.cos;
  const kF = { x: sin(p.legF) * R.thigh, y: cos(p.legF) * R.thigh };
  const fF = { x: kF.x + sin(p.legF - p.kneeF) * R.shin, y: kF.y + cos(p.legF - p.kneeF) * R.shin };
  const kB = { x: sin(p.legB) * R.thigh, y: cos(p.legB) * R.thigh };
  const fB = { x: kB.x + sin(p.legB - p.kneeB) * R.shin, y: kB.y + cos(p.legB - p.kneeB) * R.shin };
  const drop = Math.max(fF.y, fB.y, 8);
  const hip = { x: 0, y: -drop };
  const o = q => ({ x: q.x, y: q.y - drop });
  const sh = { x: sin(p.lean) * R.torso, y: hip.y - cos(p.lean) * R.torso };
  const ha = p.lean + p.head;
  const neck = { x: sh.x + sin(ha) * R.neck * 0.6, y: sh.y - cos(ha) * R.neck * 0.6 };
  const head = { x: sh.x + sin(ha) * (R.neck + R.headR), y: sh.y - cos(ha) * (R.neck + R.headR) };
  const elbowF = { x: sh.x + sin(p.armF) * R.upper, y: sh.y + cos(p.armF) * R.upper };
  const handF = { x: elbowF.x + sin(p.armF + p.elbowF) * R.fore, y: elbowF.y + cos(p.armF + p.elbowF) * R.fore };
  const elbowB = { x: sh.x + sin(p.armB) * R.upper, y: sh.y + cos(p.armB) * R.upper };
  const handB = { x: elbowB.x + sin(p.armB + p.elbowB) * R.fore, y: elbowB.y + cos(p.armB + p.elbowB) * R.fore };
  const chest = { x: lerp(hip.x, sh.x, 0.65), y: lerp(hip.y, sh.y, 0.65) };
  return { hip, sh, neck, head, chest, kneeF: o(kF), footF: o(fF), kneeB: o(kB), footB: o(fB), elbowF, handF, elbowB, handB, headAngle: ha };
}

// ---------------------------------------------------------------------------
// drawing primitives
// ---------------------------------------------------------------------------
function seg(ctx, a, b, w, col) {
  ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
function dot(ctx, p, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
function stump(ctx, p, r) {
  dot(ctx, p, r, '#5e0000');
  dot(ctx, { x: p.x + 0.5, y: p.y }, r * 0.7, '#a3121a');
  dot(ctx, { x: p.x + 0.6, y: p.y - 0.4 }, r * 0.28, '#e8dccb');
}
function boot(ctx, knee, foot, col) {
  const dx = foot.x - knee.x, dy = foot.y - knee.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  // toe points forward (perpendicular to shin, towards +x)
  const tx = uy, ty = -ux;
  const sgn = tx >= 0 ? 1 : -1;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(foot.x - ux * 6 - tx * 3 * sgn, foot.y - uy * 6 - ty * 3 * sgn);
  ctx.lineTo(foot.x + tx * 9 * sgn, foot.y + ty * 9 * sgn + 1);
  ctx.lineTo(foot.x + tx * 9 * sgn + ux * 3, foot.y + ty * 9 * sgn + uy * 3 + 1);
  ctx.lineTo(foot.x - tx * 4 * sgn + ux * 3, foot.y - ty * 4 * sgn + uy * 3);
  ctx.closePath(); ctx.fill();
}

function drawLeg(ctx, j, side, st) {
  const knee = j['knee' + side], foot = j['foot' + side];
  const col = side === 'F' ? st.leg : st.legDark;
  seg(ctx, j.hip, knee, st.limbW + 1.5, col);
  seg(ctx, knee, foot, st.limbW, col);
  if (st.grimm) { drawGrimmPlate(ctx, j.hip, knee, st.limbW + 2); drawGrimmPlate(ctx, knee, foot, st.limbW + 1); }
  if (st.wraps) seg(ctx, { x: lerp(knee.x, foot.x, 0.38), y: lerp(knee.y, foot.y, 0.38) }, { x: lerp(knee.x, foot.x, 0.58), y: lerp(knee.y, foot.y, 0.58) }, st.limbW + 0.8, side === 'F' ? st.wraps : st.wrapsDark || st.wraps);
  if (st.kneeCop) dot(ctx, knee, st.limbW * 0.55, side === 'F' ? st.armorLight : st.armor);
  boot(ctx, knee, foot, side === 'F' ? st.boot : st.bootDark);
}
function drawArm(ctx, j, side, st) {
  const sh = j.sh, el = j['elbow' + side], hd = j['hand' + side];
  const col = side === 'F' ? st.armor : st.armorDark;
  seg(ctx, sh, el, st.limbW + 0.5, col);
  seg(ctx, el, hd, st.limbW - 0.5, col);
  if (st.grimm) { drawGrimmPlate(ctx, sh, el, st.limbW + 2); drawGrimmPlate(ctx, el, hd, st.limbW + 1); }
  if (st.wounds) { // whip lashes on bare arms
    ctx.strokeStyle = '#6b0f0f'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lerp(sh.x, el.x, 0.4) - 2, lerp(sh.y, el.y, 0.4)); ctx.lineTo(lerp(sh.x, el.x, 0.4) + 2, lerp(sh.y, el.y, 0.4) + 2); ctx.stroke();
  }
  if (st.pauldron && side === 'F' && !st.grimm) {
    ctx.fillStyle = st.armorLight;
    ctx.beginPath(); ctx.ellipse(sh.x, sh.y + 2, 7, 5.5, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = st.armor; ctx.beginPath(); ctx.ellipse(sh.x, sh.y + 3, 7, 3, 0, 0, Math.PI); ctx.fill();
  }
  if (st.grimm && side === 'F') {
    ctx.fillStyle = '#929b91'; ctx.strokeStyle = '#38453f'; ctx.lineWidth = 0.65;
    ctx.beginPath(); ctx.moveTo(sh.x - 6, sh.y - 3); ctx.lineTo(sh.x + 3, sh.y - 5);
    ctx.lineTo(sh.x + 9, sh.y + 2); ctx.lineTo(sh.x + 5, sh.y + 8);
    ctx.lineTo(sh.x - 5, sh.y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c5c9bb'; ctx.beginPath(); ctx.moveTo(sh.x - 4, sh.y - 2); ctx.lineTo(sh.x + 2, sh.y - 3); ctx.lineTo(sh.x + 7, sh.y + 2); ctx.stroke();
  }
  if (st.cuffs) { // white frilled cuff at the wrist
    const cx = lerp(el.x, hd.x, 0.78), cy = lerp(el.y, hd.y, 0.78);
    dot(ctx, { x: cx, y: cy }, st.limbW * 0.62, st.cuffs);
  }
  dot(ctx, hd, st.limbW * 0.55, st.hand || col);
}

function drawTorso(ctx, j, st, lean) {
  const nx = Math.cos(lean), ny = Math.sin(lean); // perpendicular to torso
  const dx = Math.sin(lean), dy = -Math.cos(lean); // up the torso
  const hip = j.hip, sh = j.sh;
  ctx.fillStyle = st.body;
  ctx.beginPath();
  ctx.moveTo(hip.x - nx * st.hipW, hip.y - ny * st.hipW);
  ctx.lineTo(sh.x - nx * st.shW, sh.y - ny * st.shW);
  ctx.quadraticCurveTo(sh.x + dx * 4, sh.y + dy * 4, sh.x + nx * st.shW, sh.y + ny * st.shW);
  ctx.lineTo(hip.x + nx * st.hipW, hip.y + ny * st.hipW);
  ctx.closePath(); ctx.fill();
  if (st.wounds) {
    ctx.strokeStyle = '#7a1010'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const t = 0.25 + i * 0.17;
      const cx = lerp(hip.x, sh.x, t), cy = lerp(hip.y, sh.y, t);
      ctx.beginPath(); ctx.moveTo(cx - nx * 7 - dx * 2, cy - ny * 7 - dy * 2); ctx.lineTo(cx + nx * 7 + dx * 2, cy + ny * 7 + dy * 2); ctx.stroke();
    }
  }
  if (st.tabard && !st.tasset) {
    const w1 = st.shW * 0.55, w2 = st.hipW * 0.8 * (st.flare || 1), ext = st.tabardLen || 14;
    const bx = hip.x - dx * ext, by = hip.y - dy * ext;
    ctx.fillStyle = st.tabard;
    ctx.beginPath();
    ctx.moveTo(sh.x - nx * w1 + dx * -2, sh.y - ny * w1 + dy * -2);
    ctx.lineTo(sh.x + nx * w1 + dx * -2, sh.y + ny * w1 + dy * -2);
    ctx.lineTo(bx + nx * w2, by + ny * w2);
    ctx.lineTo(bx + nx * w2 * 0.3, by + ny * w2 * 0.3 + 3);
    ctx.lineTo(bx - nx * w2 * 0.2, by - ny * w2 * 0.2 - 1);
    ctx.lineTo(bx - nx * w2, by - ny * w2 + 2);
    ctx.closePath(); ctx.fill();
    if (st.frill) { // frilled white hem
      ctx.fillStyle = st.frill;
      for (let i = 0; i <= 6; i++) { const t2 = i / 6; const fx2 = lerp(bx - nx * w2, bx + nx * w2, t2), fy2 = lerp(by - ny * w2 + 2, by + ny * w2, t2); ctx.beginPath(); ctx.arc(fx2, fy2, 1.8, 0, Math.PI * 2); ctx.fill(); }
    }
    if (st.emblem) { // the Grey Lantern sigil
      const ex = lerp(hip.x, sh.x, 0.62), ey = lerp(hip.y, sh.y, 0.62);
      ctx.fillStyle = st.emblem;
      ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(ex - 0.7, ey - 5.5, 1.4, 3);
    }
  }
  if (st.tasset) { // a cloth hanging from the belt only, over the thighs
    const ext = st.tabardLen || 20, w = st.hipW * 0.62;
    const tx = hip.x + dx * 2 + nx * 1.5, ty = hip.y + dy * 2 + ny * 1.5;
    const bx = tx - dx * ext, by = ty - dy * ext;
    ctx.fillStyle = st.tabard;
    ctx.beginPath(); ctx.moveTo(tx - nx * w, ty - ny * w); ctx.lineTo(tx + nx * w, ty + ny * w);
    ctx.lineTo(bx + nx * w * 1.1, by + ny * w * 1.1);
    for (let i = 1; i < 6; i++) { const k = i / 6; ctx.lineTo(lerp(bx + nx * w * 1.1, bx - nx * w * 1.1, k) - dx * (i % 2 ? -2 : 0), lerp(by + ny * w * 1.1, by - ny * w * 1.1, k) - dy * (i % 2 ? -2 : 0)); }
    ctx.lineTo(bx - nx * w * 1.1, by - ny * w * 1.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); for (const k of [-0.4, 0.1, 0.5]) { ctx.moveTo(tx + nx * w * k, ty + ny * w * k); ctx.lineTo(bx + nx * w * k * 1.1, by + ny * w * k * 1.1); } ctx.stroke();
  }
  if (st.collar) { // white high collar and frilled bib
    const cx = lerp(hip.x, sh.x, 0.82), cy = lerp(hip.y, sh.y, 0.82);
    ctx.fillStyle = st.collar;
    ctx.beginPath();
    ctx.moveTo(sh.x - nx * (st.shW * 0.7), sh.y - ny * (st.shW * 0.7));
    ctx.lineTo(sh.x + nx * (st.shW * 0.7), sh.y + ny * (st.shW * 0.7));
    ctx.lineTo(cx + nx * 3.5 - dx * 7, cy + ny * 3.5 - dy * 7);
    ctx.lineTo(cx - nx * 3.5 - dx * 7, cy - ny * 3.5 - dy * 7);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 4; i++) { const t2 = i / 3; ctx.beginPath(); ctx.arc(lerp(sh.x, cx - dx * 7, t2) + nx * 4, lerp(sh.y, cy - dy * 7, t2) + ny * 4, 1.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2a1a2a'; ctx.fillRect(cx - 0.8 - dx * 2, cy - dy * 2 - 1, 1.6, 4); // ribbon
    if (st.lacing) { // corset lacing
      ctx.strokeStyle = st.collar; ctx.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) { const t2 = 0.18 + i * 0.1; const lx = lerp(hip.x, sh.x, t2), ly = lerp(hip.y, sh.y, t2); ctx.beginPath(); ctx.moveTo(lx - nx * 2.5, ly - ny * 2.5 - 1.5); ctx.lineTo(lx + nx * 2.5, ly + ny * 2.5 + 1.5); ctx.moveTo(lx + nx * 2.5, ly + ny * 2.5 - 1.5); ctx.lineTo(lx - nx * 2.5, ly - ny * 2.5 + 1.5); ctx.stroke(); }
    }
  }
  if (st.blood) { ctx.fillStyle = 'rgba(120,6,6,0.7)'; ctx.beginPath(); ctx.ellipse(lerp(hip.x, sh.x, 0.5) + 2, lerp(hip.y, sh.y, 0.5), 4, 7, 0.3, 0, Math.PI * 2); ctx.fill(); }
  if (st.belly) { // a swollen gut pushing out of the apron
    const cx = lerp(hip.x, sh.x, 0.35) + nx * 2 + 6, cy = lerp(hip.y, sh.y, 0.35);
    ctx.fillStyle = st.skin; ctx.beginPath(); ctx.ellipse(cx, cy, st.hipW * 0.8, st.hipW * 1.0, lean, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(80,20,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 3, cy - 6); ctx.lineTo(cx + 2, cy + 4); ctx.stroke();
    if (st.pustules) for (const [px, py, pr] of [[-3, -4, 2], [3, 2, 2.6], [-1, 6, 1.8], [4, -6, 1.6], [-5, 3, 1.4]]) { dot(ctx, { x: cx + px, y: cy + py }, pr, '#c8b040'); dot(ctx, { x: cx + px - 0.4, y: cy + py - 0.4 }, pr * 0.4, '#f0e090'); }
  }
  if (st.belt) {
    const bx = lerp(hip.x, sh.x, 0.08), by = lerp(hip.y, sh.y, 0.08);
    ctx.strokeStyle = st.belt; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bx - nx * st.hipW, by - ny * st.hipW); ctx.lineTo(bx + nx * st.hipW, by + ny * st.hipW); ctx.stroke();
  }
}

function drawCloak(ctx, j, st, sway, t) {
  const sh = j.sh, hip = j.hip;
  const back = -14 - sway * 10;
  const flutter = Math.sin(t * 6) * 2 + Math.sin(t * 9.7) * 1.5;
  ctx.fillStyle = st.cloak;
  ctx.beginPath();
  ctx.moveTo(sh.x - 2, sh.y - 1);
  ctx.quadraticCurveTo(sh.x - 10, hip.y - 4, hip.x + back + flutter, -6 + Math.abs(sway) * 6);
  ctx.lineTo(hip.x + back * 0.7 + flutter * 0.5, -10 + Math.abs(sway) * 4);
  ctx.lineTo(hip.x + back * 0.45, -4 + Math.abs(sway) * 5);
  ctx.lineTo(hip.x - 4, -12);
  ctx.quadraticCurveTo(hip.x - 2, hip.y, sh.x + 3, sh.y + 2);
  ctx.closePath(); ctx.fill();
  if (st.cloakFur) { // shaggy fur edge on a heavy cloak
    ctx.strokeStyle = st.cloakFurCol || st.cloak; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const k = i / 8, x = lerp(hip.x - 4, hip.x + back + flutter, k), y = lerp(-12, -6 + Math.abs(sway) * 6, k);
      ctx.moveTo(x, y); ctx.lineTo(x - 2 - Math.sin(t * 5 + i) * 1.5, y + 5 + (i % 3));
    }
    ctx.stroke();
  }
}

function drawHead(ctx, c, ang, st, t) {
  const r = RIG.headR;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ang);
  // helms added by skins.js
  if (typeof EXTRA_HELMS !== 'undefined' && EXTRA_HELMS[st.helm]) { EXTRA_HELMS[st.helm](ctx, st, t || 0, r); ctx.restore(); return; }
  switch (st.helm) {
    case 'knight': {
      if (st.crest) { // tattered crest cloth
        const f = Math.sin((t || 0) * 7) * 2;
        ctx.fillStyle = st.crest;
        ctx.beginPath(); ctx.moveTo(-3, -r - 2); ctx.quadraticCurveTo(-12, -r - 6 + f, -20, -r + 6 + f);
        ctx.lineTo(-15, -r + 3 + f); ctx.lineTo(-17, -r + 9 + f); ctx.quadraticCurveTo(-9, -r + 1, -4, -r + 3); ctx.fill();
      }
      ctx.fillStyle = st.armor; rr(ctx, -r, -r - 2, r * 2, r * 2 + 4, 3.5); ctx.fill();
      ctx.fillStyle = st.armorLight; ctx.fillRect(-r + 1, -r - 2, r * 2 - 2, 3);
      ctx.fillStyle = st.armorDark; ctx.fillRect(-r, r - 1, r * 2, 3);
      ctx.fillStyle = '#050505'; ctx.fillRect(0, -3.5, r + 0.5, 2.6);
      ctx.fillStyle = st.visor || '#ffd9a0'; ctx.globalAlpha = st.visor ? 0.95 : 0.35 + Math.sin((t || 0) * 2) * 0.1; ctx.fillRect(r - 3, -3.2, st.visor ? 4 : 2, 2); ctx.globalAlpha = 1;
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < 3; i++) ctx.fillRect(r - 4, 2 + i * 2.2, 1.6, 1.2);
      ctx.strokeStyle = st.armorDark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r - 1, -r); ctx.lineTo(r - 1, r + 1); ctx.stroke();
      break;
    }
    case 'bare': {
      dot(ctx, { x: 0, y: 0 }, r, st.skin);
      ctx.fillStyle = st.hair; ctx.beginPath(); ctx.arc(-2, -2, r, Math.PI * 0.85, Math.PI * 1.75); ctx.fill();
      dot(ctx, { x: 4.5, y: -1.5 }, 2.4, '#1a0d0d');
      dot(ctx, { x: 5, y: -1.5 }, 1.1, st.eye);
      ctx.strokeStyle = '#8a0000'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(4.6, 0.5); ctx.quadraticCurveTo(5.5, 5, 4, 9); ctx.stroke();
      ctx.fillStyle = '#1a0d0d'; ctx.fillRect(5, 4.5, 4, 1.4);
      break;
    }
    case 'kettle': {
      dot(ctx, { x: 0, y: 1 }, r * 0.95, st.skin);
      dot(ctx, { x: 4.5, y: 0 }, 1.2, st.eye);
      ctx.strokeStyle = '#7a0000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4.6, 1); ctx.lineTo(4.2, 7); ctx.stroke();
      ctx.fillStyle = st.helmCol;
      ctx.beginPath(); ctx.ellipse(0, -2, r * 0.95, r * 0.95, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -2, r * 1.65, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.armorLight; ctx.fillRect(-r * 0.9, -4, r * 1.8, 1.2);
      // mail coif
      ctx.fillStyle = st.armor; ctx.fillRect(-r * 0.95, 2, 5, 8);
      break;
    }
    case 'hood': {
      ctx.fillStyle = st.hood;
      ctx.beginPath(); ctx.moveTo(-r - 1, r + 2); ctx.quadraticCurveTo(-r - 3, -r - 4, 2, -r - 9); ctx.quadraticCurveTo(r + 3, -r, r + 1, r + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a0505'; ctx.beginPath(); ctx.ellipse(4, 0, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill();
      dot(ctx, { x: 5.5, y: -1 }, 1.2, st.eye);
      dot(ctx, { x: 3, y: -1 }, 1.0, st.eye);
      ctx.strokeStyle = '#8a0000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(5.5, 0); ctx.lineTo(6, 6); ctx.stroke();
      break;
    }
    case 'exec': {
      ctx.fillStyle = st.hood;
      ctx.beginPath(); ctx.moveTo(-r - 1, r + 3); ctx.lineTo(-r + 1, -r); ctx.quadraticCurveTo(-4, -r - 16, -9, -r - 19);
      ctx.quadraticCurveTo(r + 2, -r - 6, r + 1, -2); ctx.lineTo(r + 2, r + 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(5, -2, 3, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      dot(ctx, { x: 5.5, y: -2 }, 1.2, st.eye);
      ctx.fillStyle = 'rgba(110,0,0,0.6)'; ctx.fillRect(2, 3, 7, 6);
      break;
    }
    case 'cowl': {
      dot(ctx, { x: 1, y: 0 }, r * 0.9, st.skin);
      dot(ctx, { x: 5, y: -1 }, 1, '#2a1a1a');
      ctx.fillStyle = '#9a9a92'; ctx.fillRect(1, 3, 7, 6); // beard
      ctx.fillStyle = st.hood;
      ctx.beginPath(); ctx.moveTo(-r - 2, r + 3); ctx.quadraticCurveTo(-r - 3, -r - 3, 2, -r - 2); ctx.quadraticCurveTo(r + 1, -r, r, -3);
      ctx.lineTo(1, -4); ctx.quadraticCurveTo(-3, 2, -2, r + 3); ctx.closePath(); ctx.fill();
      break;
    }
    case 'veil': { // Sister of Saint Ysolde: black veil, frilled white band, lily, hair beneath
      const hair = st.hair || '#e8e4ec';
      // veil drapes behind the head down past the shoulders
      ctx.fillStyle = st.veil || '#16131a';
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r - 2.5); ctx.quadraticCurveTo(-r - 6, -r, -r - 7, r + 10);
      ctx.lineTo(-r - 1, r + 14); ctx.quadraticCurveTo(-3, r + 2, 2, r + 1); ctx.lineTo(r + 1, -2); ctx.quadraticCurveTo(r, -r - 3, -r * 0.2, -r - 2.5); ctx.fill();
      ctx.strokeStyle = st.veilRim || '#3e3446'; ctx.lineWidth = 0.9; ctx.stroke();
      // long hair falling under the veil (or braids in front)
      ctx.fillStyle = hair;
      ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-6, 8, -4, r + 13); ctx.lineTo(0, r + 10); ctx.quadraticCurveTo(0, 6, 2, 0); ctx.fill();
      // face
      dot(ctx, { x: 0.8, y: 0 }, r * 0.9, st.skin);
      // bangs
      ctx.fillStyle = hair;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -3); ctx.lineTo(-r * 0.4, 2.5); ctx.lineTo(0.5, -2.5); ctx.lineTo(2, 1.5); ctx.lineTo(3.4, -3); ctx.lineTo(5.5, 0.5); ctx.lineTo(r * 0.85, -4); ctx.lineTo(r * 0.7, -7); ctx.lineTo(-r * 0.7, -7); ctx.closePath(); ctx.fill();
      // eye with iris
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(4.6, -0.5, 1.4, 1.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.eyeCol || '#8a6ac0'; ctx.beginPath(); ctx.ellipse(4.9, -0.3, 1.0, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(4.5, -1.4, 0.6, 0.6);
      ctx.strokeStyle = '#1a1014'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(3.1, -1.8); ctx.quadraticCurveTo(4.8, -2.9, 6.4, -1.9); ctx.stroke();
      if (st.weeping) { ctx.strokeStyle = '#8a0000'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(4.8, 1.3); ctx.quadraticCurveTo(5.5, 5, 4.5, 8.5); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(230,140,150,0.45)'; ctx.beginPath(); ctx.ellipse(3.6, 3, 1.4, 0.8, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#9a5a5a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(5.5, 5); ctx.lineTo(7, 4.8); ctx.stroke();
      // frilled white band across the brow
      ctx.fillStyle = st.band || '#f2eee8';
      ctx.beginPath(); ctx.arc(0.5, 0, r + 1.2, Math.PI * 1.08, Math.PI * 1.92); ctx.arc(0.5, 0, r - 1.2, Math.PI * 1.92, Math.PI * 1.08, true); ctx.fill();
      for (let a = 1.1; a < 1.92; a += 0.1) { ctx.beginPath(); ctx.arc(0.5 + Math.cos(a * Math.PI) * (r + 1.3), Math.sin(a * Math.PI) * (r + 1.3), 1, 0, Math.PI * 2); ctx.fill(); }
      // white lily at the side of the veil
      ctx.save(); ctx.translate(-r + 0.5, -r + 2.5);
      ctx.fillStyle = st.band || '#f2eee8';
      for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -2.4, 1.1, 2.4, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(0, 0, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (st.braids) { // dark braid over the shoulder
        ctx.fillStyle = hair;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-0.5 + i * 0.2, r + 2 + i * 3, 1.8, 2, 0.3, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = st.band || '#f2eee8'; ctx.fillRect(-1.5, r + 19, 3, 1.5);
      }
      break;
    }
    case 'man': { // an uncorrupted survivor
      dot(ctx, { x: 0, y: 0 }, r * 0.95, st.skin);
      ctx.fillStyle = st.hair; ctx.beginPath(); ctx.arc(-1, -1.5, r * 0.98, Math.PI * 0.9, Math.PI * 1.9); ctx.fill();
      if (st.beard) { ctx.fillStyle = st.beard; ctx.beginPath(); ctx.moveTo(-2, 2); ctx.quadraticCurveTo(2, 11, 8, 4); ctx.lineTo(8, 1); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill(); }
      dot(ctx, { x: 4.6, y: -1.5 }, 1.1, '#1a1210');
      ctx.strokeStyle = st.hair; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(3, -4); ctx.lineTo(6.5, -4.4); ctx.stroke();
      if (st.scar) { ctx.strokeStyle = '#8a4a40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(5.5, 2); ctx.stroke(); }
      if (st.helmCol) { ctx.fillStyle = st.helmCol; ctx.beginPath(); ctx.ellipse(0, -2, r * 0.98, r * 0.9, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(4, -3, 1.5, 7); }
      break;
    }
    case 'beak': { // plague doctor: brimmed hat, leather mask, long beak, glass eyes
      ctx.fillStyle = '#2a211b'; ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2e25';
      ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(14, -1, 22, 9); ctx.quadraticCurveTo(13, 5, 3, 5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(6, 1); ctx.quadraticCurveTo(13, 2.5, 20, 8); ctx.stroke();
      dot(ctx, { x: 4.5, y: -2.5 }, 2.6, '#6b6a50');
      dot(ctx, { x: 4.8, y: -2.6 }, 1.7, st.eye);
      ctx.fillStyle = '#0c0a09';
      ctx.beginPath(); ctx.ellipse(0, -r + 1, r * 1.9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-r * 0.85, -r - 9, r * 1.7, 10);
      ctx.fillStyle = '#4a1010'; ctx.fillRect(-r * 0.85, -r - 1.5, r * 1.7, 1.6);
      break;
    }
    case 'sack': { // brute: stitched burlap sack, rope at the neck
      ctx.fillStyle = '#6b5a40'; ctx.beginPath(); ctx.ellipse(0, -1, r * 1.05, r * 1.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a3c2a'; ctx.lineWidth = 0.7;
      for (let i = -6; i <= 6; i += 3) { ctx.beginPath(); ctx.moveTo(i, -r); ctx.lineTo(i + 1, r); ctx.stroke(); }
      ctx.strokeStyle = '#1a0c08'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(2.5, -4); ctx.lineTo(6.5, -0.5); ctx.moveTo(6.5, -4); ctx.lineTo(2.5, -0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 4); for (let i = 0; i < 4; i++) { ctx.lineTo(3 + i * 1.6, 4 + (i % 2 ? 1.5 : -1)); } ctx.stroke();
      ctx.fillStyle = 'rgba(110,8,8,0.7)'; ctx.beginPath(); ctx.ellipse(-2, 3, 4, 5, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(-r, r - 1, r * 2, 3);
      break;
    }
    case 'greathelm': { // templar: flat-topped great helm with a cross visor
      ctx.fillStyle = st.helmCol || '#7a7d84'; rr(ctx, -r - 0.5, -r - 3, r * 2 + 1, r * 2 + 6, 1.5); ctx.fill();
      ctx.fillStyle = st.armorLight; ctx.fillRect(-r - 0.5, -r - 3, r * 2 + 1, 2.4);
      ctx.fillStyle = '#060606'; ctx.fillRect(1, -3, r, 2.2); ctx.fillRect(4.5, -3, 2, 9);
      dot(ctx, { x: 6, y: -2 }, 0.9, st.eye);
      ctx.fillStyle = '#8a1010'; ctx.fillRect(-4, -r - 2, 2, 6);
      break;
    }
    case 'kerchief': {
      dot(ctx, { x: 0, y: 0 }, r * 0.88, st.skin);
      dot(ctx, { x: 4, y: -1 }, 1, '#1a1010');
      ctx.fillStyle = st.hair; ctx.beginPath(); ctx.moveTo(-r, -2); ctx.quadraticCurveTo(-r - 4, 8, -r + 2, 12); ctx.lineTo(-3, 4); ctx.fill();
      ctx.fillStyle = st.kerchief; ctx.beginPath(); ctx.arc(0, -1, r * 0.92, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r + 1, -2); ctx.lineTo(-r - 5, 3); ctx.lineTo(-r + 3, 1); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function drawShield(ctx, hand, st) {
  ctx.save(); ctx.translate(hand.x + 3, hand.y - 2);
  ctx.fillStyle = st.shieldRim; ctx.beginPath(); ctx.ellipse(0, 0, 7.5, 19, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = st.shield; ctx.beginPath(); ctx.ellipse(0.5, 0, 6, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = st.emblemCol || '#6e6040'; ctx.fillRect(-1, -9, 3, 18);
  if (st.crossShield) ctx.fillRect(-4.5, -4, 10, 3);
  dot(ctx, { x: 1, y: 0 }, 2.5, st.shieldRim);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(3, -12); ctx.moveTo(-3, 8); ctx.lineTo(4, 12); ctx.stroke();
  ctx.restore();
}

// Weapons wielded by foes & NPCs, drawn from the hand along +y after rotate(-angle)
function drawWeaponShape(ctx, type, blood) {
  switch (type) {
    case 'club':
      ctx.fillStyle = '#3b2a1c';
      ctx.beginPath(); ctx.moveTo(-1.8, -6); ctx.lineTo(1.8, -6); ctx.lineTo(3.8, 32); ctx.lineTo(-3.8, 32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a8070'; ctx.fillRect(3, 22, 3, 1.4); ctx.fillRect(-6, 26, 3, 1.4); ctx.fillRect(2.5, 29, 3, 1.4);
      ctx.fillStyle = '#5a0606'; ctx.fillRect(-3.5, 24, 7, 8);
      break;
    case 'pitchfork':
      ctx.fillStyle = '#4a3a28'; ctx.fillRect(-1.2, -26, 2.4, 70);
      ctx.fillStyle = '#5c5850'; ctx.fillRect(-6, 43, 12, 2);
      for (const x of [-6, -0.8, 4.4]) ctx.fillRect(x, 44, 1.6, 15);
      break;
    case 'shortsword':
      ctx.fillStyle = '#2a1f17'; ctx.fillRect(-1.5, -8, 3, 9);
      ctx.fillStyle = '#5a554c'; ctx.fillRect(-6, 1, 12, 2.2);
      ctx.fillStyle = '#8b8577';
      ctx.beginPath(); ctx.moveTo(-2.4, 3); ctx.lineTo(2.4, 3); ctx.lineTo(1.8, 36); ctx.lineTo(0, 41); ctx.lineTo(-1.8, 36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b4a2a'; ctx.globalAlpha = 0.6; ctx.fillRect(-1.5, 14, 2.5, 9); ctx.globalAlpha = 1;
      break;
    case 'knife':
      ctx.fillStyle = '#2a1a12'; ctx.fillRect(-1.3, -5, 2.6, 6);
      ctx.fillStyle = '#a8a29a';
      ctx.beginPath(); ctx.moveTo(-1.8, 1); ctx.lineTo(1.6, 1); ctx.lineTo(0.8, 17); ctx.lineTo(-1.8, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a0606'; ctx.fillRect(-1.5, 8, 2.6, 7);
      break;
    case 'greataxe':
      ctx.fillStyle = '#24170f'; ctx.fillRect(-1.8, -22, 3.6, 92);
      ctx.fillStyle = '#4a4440';
      ctx.beginPath(); ctx.moveTo(1.5, 46); ctx.lineTo(24, 40); ctx.quadraticCurveTo(31, 58, 25, 80); ctx.lineTo(1.5, 70); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7d7770';
      ctx.beginPath(); ctx.moveTo(24, 40); ctx.quadraticCurveTo(31, 58, 25, 80); ctx.lineTo(21, 78); ctx.quadraticCurveTo(26, 58, 20, 42); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5c0505'; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(14, 50); ctx.lineTo(26, 52); ctx.lineTo(27, 74); ctx.lineTo(16, 66); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a3330'; ctx.fillRect(-3, 44, 6, 28);
      break;
    case 'spear':
      ctx.fillStyle = '#4a3622'; ctx.fillRect(-1.2, -34, 2.4, 82);
      ctx.fillStyle = '#9a968c'; ctx.beginPath(); ctx.moveTo(-2.8, 46); ctx.lineTo(0, 62); ctx.lineTo(2.8, 46); ctx.lineTo(0, 43); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b1010'; ctx.fillRect(-1.8, 40, 3.6, 3);
      break;
    case 'falchion':
      ctx.fillStyle = '#2a1f17'; ctx.fillRect(-1.6, -9, 3.2, 10);
      ctx.fillStyle = '#6a645a'; ctx.fillRect(-6, 1, 12, 2.4);
      ctx.fillStyle = '#a6a196';
      ctx.beginPath(); ctx.moveTo(-2.2, 3); ctx.lineTo(2.2, 3); ctx.lineTo(5, 34); ctx.quadraticCurveTo(2, 42, -2.5, 40); ctx.closePath(); ctx.fill();
      break;
    case 'staff': // plague doctor's hooked cane with a swinging censer
      ctx.fillStyle = '#2a1d14'; ctx.fillRect(-1.2, -30, 2.4, 66);
      ctx.strokeStyle = '#2a1d14'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(-4, 36, 4, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = '#5a5240'; ctx.beginPath(); ctx.arc(-8, 44, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(160,190,120,0.5)'; ctx.beginPath(); ctx.arc(-8, 47, 2.6, 0, Math.PI * 2); ctx.fill();
      break;
    case 'maul':
      ctx.fillStyle = '#3a2816'; ctx.fillRect(-2, -16, 4, 66);
      ctx.fillStyle = '#4a3a2a'; rr(ctx, -11, 46, 22, 18, 3); ctx.fill();
      ctx.fillStyle = '#5a5048'; ctx.fillRect(-11, 49, 22, 3); ctx.fillRect(-11, 58, 22, 3);
      ctx.fillStyle = 'rgba(100,6,6,0.75)'; ctx.fillRect(-11, 52, 10, 12);
      break;
    case 'mace':
      ctx.fillStyle = '#2a2220'; ctx.fillRect(-1.6, -8, 3.2, 40);
      ctx.fillStyle = '#6e6a66'; ctx.beginPath(); ctx.arc(0, 34, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a8680';
      for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(an) * 4, 34 + Math.sin(an) * 4); ctx.lineTo(Math.cos(an + 0.3) * 9, 34 + Math.sin(an + 0.3) * 9); ctx.lineTo(Math.cos(an + 0.6) * 4, 34 + Math.sin(an + 0.6) * 4); ctx.fill(); }
      break;
    case 'sisterstaff': // slim silver staff topped with a lily cross
      ctx.fillStyle = '#b8b4c0'; ctx.fillRect(-0.9, -40, 1.8, 76);
      ctx.fillStyle = '#e8e4f0'; ctx.fillRect(-0.9, -52, 1.8, 14); ctx.fillRect(-5, -47, 10, 1.8);
      ctx.beginPath(); ctx.arc(0, -47, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9a7ad0'; ctx.beginPath(); ctx.arc(0, -47, 1, 0, Math.PI * 2); ctx.fill();
      break;
    case 'hammer':
      ctx.fillStyle = '#3a2816'; ctx.fillRect(-1.4, -6, 2.8, 30);
      ctx.fillStyle = '#4a4744'; ctx.fillRect(-6, 22, 12, 8);
      break;
    case 'shovel':
      ctx.fillStyle = '#4a3a28'; ctx.fillRect(-1.2, -20, 2.4, 52);
      ctx.fillStyle = '#5a5650'; ctx.beginPath(); ctx.moveTo(-5, 31); ctx.lineTo(5, 31); ctx.lineTo(4, 44); ctx.lineTo(0, 47); ctx.lineTo(-4, 44); ctx.closePath(); ctx.fill();
      break;
  }
}

function drawWeaponAt(ctx, hand, ang, fn) {
  ctx.save(); ctx.translate(hand.x, hand.y); ctx.rotate(-ang); fn(ctx); ctx.restore();
}

/**
 * Draw a complete humanoid.
 * opts: { weapon(ctx) | null, weapon2(ctx) | null, shield: bool, t, sway }
 */
function drawHumanoid(ctx, j, pose, st, parts, opts) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const t = opts.t || 0;
  if (parts.legB) drawLeg(ctx, j, 'B', st); else stump(ctx, { x: j.hip.x - 2, y: j.hip.y + 3 }, st.limbW * 0.65);
  if (st.cloak) drawCloak(ctx, j, st, opts.sway || 0, t);
  if (parts.armB) {
    if (opts.weapon2) drawWeaponAt(ctx, j.handB, pose.weapB !== undefined ? pose.weapB : pose.weap, opts.weapon2);
    drawArm(ctx, j, 'B', st);
  }
  const skirted = !!st.flare; // long habits hide the legs
  if (skirted) { if (parts.legF) drawLeg(ctx, j, 'F', st); }
  drawTorso(ctx, j, st, pose.lean);
  if (st.grimm) drawGrimmTorso(ctx, j, pose.lean);
  if (!parts.armB) stump(ctx, { x: j.sh.x - 2, y: j.sh.y + 2 }, st.limbW * 0.6);
  if (!skirted) { if (parts.legF) drawLeg(ctx, j, 'F', st); }
  if (!parts.legF) stump(ctx, { x: j.hip.x + 2, y: j.hip.y + 3 }, st.limbW * 0.65);
  if (st.grimm) drawGrimmMantle(ctx, j, t);
  if (parts.head) drawHead(ctx, j.head, j.headAngle, st, t);
  else stump(ctx, j.neck, 4.5);
  if (opts.shield && parts.armB) drawShield(ctx, j.handB, st);
  if (parts.armF) {
    if (opts.weapon) drawWeaponAt(ctx, j.handF, pose.weap, opts.weapon);
    drawArm(ctx, j, 'F', st);
  } else stump(ctx, { x: j.sh.x + 1, y: j.sh.y + 2 }, st.limbW * 0.6);
}

// Draw a severed part in its own local space (origin = the cut)
function drawGibPart(ctx, g) {
  const st = g.style;
  ctx.lineCap = 'round';
  switch (g.part) {
    case 'head':
      drawHead(ctx, { x: 0, y: -RIG.headR + 2 }, 0, st, 0);
      stump(ctx, { x: 0, y: 2 }, 4);
      break;
    case 'armF': case 'armB': {
      const a = { x: 0, y: 0 }, b = { x: 0, y: RIG.upper }, c = { x: Math.sin(0.5) * RIG.fore, y: RIG.upper + Math.cos(0.5) * RIG.fore };
      seg(ctx, a, b, st.limbW + 0.5, st.armor); seg(ctx, b, c, st.limbW - 0.5, st.armor);
      dot(ctx, c, st.limbW * 0.55, st.hand || st.armor);
      stump(ctx, a, st.limbW * 0.6);
      break;
    }
    case 'legF': case 'legB': {
      const a = { x: 0, y: 0 }, b = { x: 0, y: RIG.thigh }, c = { x: -Math.sin(0.3) * RIG.shin, y: RIG.thigh + Math.cos(0.3) * RIG.shin };
      seg(ctx, a, b, st.limbW + 1.5, st.leg); seg(ctx, b, c, st.limbW, st.leg);
      boot(ctx, b, c, st.boot);
      stump(ctx, a, st.limbW * 0.7);
      break;
    }
    case 'weapon':
      ctx.save(); ctx.translate(0, -15); drawWeaponShape(ctx, g.weapon, 0); ctx.restore();
      break;
    case 'shield':
      drawShield(ctx, { x: -3, y: 2 }, st);
      break;
  }
}
