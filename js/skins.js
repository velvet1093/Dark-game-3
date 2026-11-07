'use strict';
// ---------------------------------------------------------------------------
// KNIGHT SKINS
// A skin is just a style object for the knight's rig. The original Grey
// Lantern look stays the default; others are picked from Appearance in the
// title or pause menu, and the choice is remembered on this device.
// To add a skin: add an entry to SKINS (any helm below, or one from rig.js).
// ---------------------------------------------------------------------------

// heavy fur mantle across the shoulders, drawn in head space (shoulders at y≈+9)
function drawFurMantle(ctx, st, t) {
  ctx.fillStyle = st.fur;
  ctx.beginPath(); ctx.moveTo(-15, 7);
  const tufts = [[-17, 22], [-13, 18], [-11, 27], [-7, 20], [-4, 28], [0, 21], [3, 27], [6, 19], [9, 24], [11, 14]];
  for (const [x, y] of tufts) ctx.lineTo(x, y + Math.sin(t * 3 + x * 0.7) * 0.8);
  ctx.quadraticCurveTo(12, 6, 5, 5); ctx.quadraticCurveTo(-5, 3, -15, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = st.furLight || st.fur; ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) { const x = -14 + i * 2.2; ctx.moveTo(x, 6 + (i % 3)); ctx.lineTo(x - 1 + Math.sin(t * 2 + i), 14 + (i % 4) * 2); }
  ctx.stroke();
  for (let x = -14; x <= 10; x += 2.6) { ctx.fillStyle = st.fur; ctx.beginPath(); ctx.arc(x, 6 + Math.sin(x) * 1.1, 2.8, 0, Math.PI * 2); ctx.fill(); }
}

// Grimm-specific detailing shares the player's animated joints and hitboxes.
function drawGrimmMantle(ctx, j, t) {
  ctx.save(); ctx.translate(j.sh.x - 2, j.sh.y - 6);
  ctx.fillStyle = '#777976'; ctx.strokeStyle = '#292d2c'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-17, -2);
  for (const [x, y] of [[-23,4],[-19,4],[-27,13],[-21,10],[-23,20],[-16,15],[-14,24],[-9,16],[-5,21],[0,12],[5,19],[8,11],[15,18],[13,9],[22,14],[18,5],[23,6],[15,-2],[6,-5]]) {
    ctx.lineTo(x, y + Math.sin(t * 3 + x) * 0.5);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Many short, directional tufts instead of the previous long straight fringe.
  for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) {
    const x = -18 + i * 3, y = row * 4 + Math.abs(x) * 0.12;
    ctx.strokeStyle = (row + i) % 3 ? '#4b514f' : '#b4b5ac'; ctx.lineWidth = 0.65;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sign(x) * 2, y + 4 + i % 3); ctx.stroke();
  }
  ctx.restore();
}

function drawGrimmTorso(ctx, j, lean) {
  ctx.save(); ctx.translate(j.sh.x, j.sh.y); ctx.rotate(lean);
  const metal = ctx.createLinearGradient(-10, 0, 11, 0);
  metal.addColorStop(0, '#434b49'); metal.addColorStop(0.55, '#a1a69f'); metal.addColorStop(1, '#535f5c');
  ctx.fillStyle = metal; ctx.strokeStyle = '#303b38'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(-10, 1); ctx.lineTo(9, 1); ctx.lineTo(8, 17);
  ctx.lineTo(2, 26); ctx.lineTo(-7, 21); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c3c6b9'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(1, 4); ctx.lineTo(2, 18); ctx.lineTo(-4, 22); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const y = 23 + i * 3;
    ctx.fillStyle = i % 2 ? '#878e85' : '#616e67';
    ctx.beginPath(); ctx.moveTo(-8, y - 2); ctx.lineTo(7, y); ctx.lineTo(8, y + 3); ctx.lineTo(-8, y + 1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#35413c'; ctx.stroke();
  }
  ctx.strokeStyle = '#332e26'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-9, 29); ctx.lineTo(9, 25); ctx.stroke();
  ctx.strokeStyle = '#d3c4a0'; ctx.lineWidth = 0.8; ctx.strokeRect(-1, 25.4, 3.5, 3.1);
  ctx.restore();
}

// Etched plate edges follow each moving limb segment.
function drawGrimmPlate(ctx, a, b, width) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  if (len < 1) return;
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
  const g = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  g.addColorStop(0, '#3e4b47'); g.addColorStop(0.45, '#939e92'); g.addColorStop(1, '#53635b');
  ctx.fillStyle = g; ctx.strokeStyle = '#2c3933'; ctx.lineWidth = 0.55;
  ctx.beginPath(); ctx.moveTo(-width / 2, 2); ctx.lineTo(width / 2, 1);
  ctx.lineTo(width * 0.36, len - 2); ctx.lineTo(0, len); ctx.lineTo(-width * 0.4, len - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#bdc3b2'; ctx.lineWidth = 0.55;
  ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, len - 4); ctx.stroke();
  ctx.strokeStyle = '#36443c';
  for (let i = 0; i < 3; i++) { const y = len - 5 - i * 2; ctx.beginPath(); ctx.moveTo(-width * 0.3, y); ctx.lineTo(width * 0.3, y + 0.6); ctx.stroke(); }
  ctx.restore();
}

const EXTRA_HELMS = {
  // Closed, angular helm: narrow cut vents rather than an open cage visor.
  grimm(ctx, st, t, r) {
    const wave = Math.sin(t * 3) * 2;
    // Torn cloth crest, split into long curling ribbons.
    for (let i = 0; i < 3; i++) {
      const tipX = -24 - i * 5, tipY = -r - 20 - (i % 2) * 9;
      ctx.fillStyle = ['#747671', '#454b48', '#969991'][i];
      ctx.beginPath(); ctx.moveTo(-2 + i, -r - 3);
      ctx.bezierCurveTo(-7 - i * 3, -r - 21, tipX + 2, tipY + 14 + wave, tipX, tipY);
      ctx.lineTo(tipX + 1, tipY + 6);
      ctx.bezierCurveTo(tipX + 4, tipY + 17 + wave, -7 - i * 3, -r - 16, i, -r - 3);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#252b28'; ctx.lineWidth = 0.55; ctx.stroke();
      ctx.strokeStyle = '#afb1a5'; ctx.lineWidth = 0.45;
      ctx.beginPath(); ctx.moveTo(-1 + i, -r - 8); ctx.bezierCurveTo(-9 - i * 3, -r - 19, tipX + 3, tipY + 16 + wave, tipX + 1, tipY + 5); ctx.stroke();
    }
    // Steel dome, pointed crown and a projecting wedge-shaped faceplate.
    const metal = ctx.createLinearGradient(-r, 0, r + 3, 0);
    metal.addColorStop(0, '#4e5653'); metal.addColorStop(0.55, '#a3aaa4'); metal.addColorStop(0.63, '#c6cbbd'); metal.addColorStop(1, '#717c77');
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.moveTo(-r - 1, 0); ctx.lineTo(-r + 1, -r - 3);
    ctx.quadraticCurveTo(-4, -r - 7, 2, -r - 6); ctx.lineTo(r, -r + 1);
    ctx.lineTo(r + 3, 2); ctx.lineTo(r, r + 3); ctx.lineTo(1, r + 7);
    ctx.lineTo(-r, r + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#242c29'; ctx.lineWidth = 0.9; ctx.stroke();
    // Center seam and narrow eye slit follow the pointed visor.
    ctx.strokeStyle = st.armorLight; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(1, -r - 5); ctx.lineTo(2, -2); ctx.lineTo(r + 2, 1); ctx.stroke();
    ctx.strokeStyle = '#151d1a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-r + 1, -1); ctx.lineTo(2, -3); ctx.lineTo(r + 1, -1); ctx.stroke();
    // Tapered black ventilation cuts, closed steel between each one.
    ctx.fillStyle = '#1a231f';
    for (let i = 0; i < 5; i++) {
      const x = -5.5 + i * 3.1, y = 1.1 + Math.abs(i - 2) * 0.25;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1.1, y - 0.7);
      ctx.lineTo(x + 0.3, y + 5.2 - Math.abs(i - 2) * 0.6); ctx.lineTo(x - 0.5, y + 3.8); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = '#4d5951'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-r, 2); ctx.lineTo(1, r + 2); ctx.lineTo(r + 2, 2);
    ctx.moveTo(1, r + 2); ctx.lineTo(1, r + 7); ctx.stroke();
    ctx.fillStyle = '#353e37'; ctx.beginPath(); ctx.arc(-r + 0.4, -1.4, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c0c6b7'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-4, -5); ctx.moveTo(5, 4); ctx.lineTo(6, 2); ctx.stroke();
    // Overlapping gorget plates.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? '#6d786d' : '#8d9688';
      ctx.beginPath(); ctx.moveTo(-7, r + 3 + i * 2); ctx.lineTo(0, r + 7 + i * 2);
      ctx.lineTo(7, r + 2 + i * 2); ctx.lineTo(5, r + 7 + i * 2); ctx.lineTo(0, r + 10 + i * 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#303c33'; ctx.lineWidth = 0.5; ctx.stroke();
    }
  },
  // rounded close helm with a slatted visor and a tall streaming plume
  closehelm(ctx, st, t, r) {
    if (st.fur) drawFurMantle(ctx, st, t);
    // plume streaming back from the crown
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const k = i / 15, sway = Math.sin(t * 3 + i * 0.5) * 3;
      ctx.strokeStyle = i % 3 ? st.plume : st.plumeLight; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(-1 + k * 2, -r - 2);
      ctx.quadraticCurveTo(-6 - k * 6, -r - 13 - k * 3, -22 - k * 10 + sway, -r + 1 + k * 14 + sway * 0.5);
      ctx.stroke();
    }
    // dome
    ctx.fillStyle = st.armor; ctx.beginPath(); ctx.arc(0.5, -1, r + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st.armorLight; ctx.beginPath(); ctx.arc(0.5, -1, r + 1, Math.PI * 1.1, Math.PI * 1.7); ctx.arc(0.5, -1, r - 1.6, Math.PI * 1.7, Math.PI * 1.1, true); ctx.fill();
    // visor: a lifting faceplate with three slats
    ctx.fillStyle = st.armorLight;
    ctx.beginPath(); ctx.moveTo(-1, -5.5); ctx.quadraticCurveTo(r + 3, -6, r + 2.5, 1); ctx.quadraticCurveTo(r + 2, r + 1, 1, r + 2.5); ctx.lineTo(-1, -5.5); ctx.fill();
    ctx.fillStyle = st.visor ? st.visor : '#0a0a0b';
    for (const y of [-3.6, -1.4, 0.8]) ctx.fillRect(2.5, y, r - 1.5, 1.1);
    ctx.strokeStyle = st.armorDark; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-1, -5.5); ctx.quadraticCurveTo(r + 3, -6, r + 2.5, 1); ctx.stroke();
    ctx.fillStyle = st.armorDark; ctx.beginPath(); ctx.arc(-1, -1.2, 1.5, 0, Math.PI * 2); ctx.fill(); // visor pivot
    ctx.fillStyle = st.armor; ctx.fillRect(-r + 1, r + 1, r * 2 - 2, 3); // gorget
    if (st.pendant) { // the Grey Lantern on a chain at the throat
      ctx.strokeStyle = '#b89a50'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-3, r + 3); ctx.quadraticCurveTo(1, r + 9, 5, r + 3); ctx.stroke();
      ctx.fillStyle = '#d8c27a'; ctx.fillRect(0.4, r + 6.5, 2.2, 3); ctx.fillStyle = '#fff2c0'; ctx.fillRect(0.9, r + 7.2, 1.2, 1.4);
    }
  },
  // bucket helm with a cross visor under a rough hood
  pilgrim(ctx, st, t, r) {
    if (st.mantle) {
      ctx.fillStyle = st.mantle;
      ctx.beginPath(); ctx.moveTo(-12, 8);
      for (const [x, y] of [[-15, 26], [-11, 21], [-8, 29], [-4, 22], [0, 28], [4, 21], [8, 26], [10, 17]]) ctx.lineTo(x, y + Math.sin(t * 3 + x) * 0.8);
      ctx.quadraticCurveTo(10, 9, 4, 8); ctx.quadraticCurveTo(-4, 6, -12, 8); ctx.fill();
    }
    if (st.fur) drawFurMantle(ctx, st, t);
    if (st.hood) {
      ctx.fillStyle = st.hood;
      ctx.beginPath(); ctx.moveTo(-r - 5, r + 7); ctx.quadraticCurveTo(-r - 7, -r - 6, 0, -r - 7); ctx.quadraticCurveTo(r + 4, -r - 5, r + 3, -1); ctx.lineTo(r + 1, r + 4); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = st.armor; rr(ctx, -r + 1, -r - 1, r * 2 - 1, r * 2 + 4, 2.5); ctx.fill();
    ctx.fillStyle = st.armorLight; ctx.fillRect(-r + 1, -r - 1, r * 2 - 1, 2);
    ctx.fillStyle = '#060606'; ctx.fillRect(0, -3.4, r, 2.4); ctx.fillRect(4.4, -3.4, 1.6, 10);
    for (let i = 0; i < 3; i++) ctx.fillRect(r - 4, 2 + i * 2.2, 1.4, 1.1);
    if (st.visor) { ctx.fillStyle = st.visor; ctx.globalAlpha = 0.6 + Math.sin(t * 5) * 0.3; ctx.fillRect(1, -3, r - 1, 1.6); ctx.globalAlpha = 1; }
    if (st.hood) {
      ctx.fillStyle = st.hood;
      ctx.beginPath(); ctx.moveTo(-r - 2, -r + 2); ctx.quadraticCurveTo(0, -r - 8, r + 3, -r + 1); ctx.lineTo(r + 1, -r + 3.5); ctx.quadraticCurveTo(0, -r - 3.5, -r, -r + 4); ctx.closePath(); ctx.fill();
    }
  },
  // T-slit barbute over a mail hood
  barbute(ctx, st, t, r) {
    ctx.fillStyle = st.mail;
    ctx.beginPath(); ctx.moveTo(-r - 3, r + 9); ctx.quadraticCurveTo(-r - 4, -r - 2, 0, -r - 3); ctx.quadraticCurveTo(r + 3, -r - 2, r + 2, r + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = -r; y < r + 8; y += 2) for (let x = -r - 2; x < r + 2; x += 2) ctx.fillRect(x + (y % 4 ? 1 : 0), y, 0.8, 0.8);
    ctx.fillStyle = st.armor;
    ctx.beginPath(); ctx.moveTo(-r + 0.5, r + 2); ctx.lineTo(-r, -2); ctx.quadraticCurveTo(-r + 1, -r - 2, 1, -r - 2); ctx.quadraticCurveTo(r + 1, -r - 1, r + 1, 0); ctx.lineTo(r + 0.5, r + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = st.armorLight; ctx.fillRect(-r + 1, -r - 1, r * 2 - 1, 1.6);
    ctx.fillStyle = st.visor || '#050505'; ctx.fillRect(1, -3.4, r, 2.2); ctx.fillRect(5.2, -3.4, 2.4, 9);
    ctx.fillStyle = 'rgba(90,40,20,0.45)'; ctx.beginPath(); ctx.ellipse(-3, 2, 3, 4, 0.3, 0, Math.PI * 2); ctx.fill();
  },
};

const SKINS = {
  grimm: {
    name: 'Mossbound', desc: 'A pointed closed helm with cut visor vents and a torn streaming crest. Layered moss-grey plate beneath a broad, shaggy fur mantle, worn by a knight who has slept in the barrows too long.',
    style: Object.assign({}, KNIGHT_STYLE, {
      helm: 'grimm', grimm: true, fur: '#85897a', furLight: '#bec1aa',
      armor: '#899587', armorDark: '#46564a', armorLight: '#c5cbbb', body: '#667464',
      tabard: '#a8ab91', tabardLen: 28, tasset: true, emblem: null, crest: null,
      leg: '#818e7d', legDark: '#3e5144', boot: '#657765', bootDark: '#34483a',
      hand: '#8f938b', cloak: '#2b2e2c', cloakFur: true, cloakFurCol: '#64675e', belt: '#39352e',
    }),
  },
  lantern: {
    name: 'Grey Lantern', desc: 'The armour Sir Aldric rode out in. Great helm with a torn crest, steel plate, the lantern sigil on a grey tabard.',
    style: KNIGHT_STYLE,
  },
  vigil: {
    name: 'Plumed Vigil', desc: 'Polished plate and a slatted close helm with a long sea-glass plume, under a heavy wolf-fur mantle and cloak. Red-wrapped greaves, and the Order\'s lantern on a chain at the throat.',
    style: Object.assign({}, KNIGHT_STYLE, {
      helm: 'closehelm', plume: '#2f9a8a', plumeLight: '#8fe0d4', fur: '#3b3a3c', furLight: '#67636a', pendant: true,
      armor: '#c9ccd1', armorDark: '#8c9097', armorLight: '#eef0f2', body: '#d0d3d8',
      tabard: '#5c4840', tasset: true, tabardLen: 26, emblem: null,
      leg: '#c4c7cc', legDark: '#93979e', boot: '#d8dade', bootDark: '#a9acb1', wraps: '#6e1c1c', wrapsDark: '#4e1414',
      hand: '#7c7f84', cloak: '#29282c', cloakFur: true, cloakFurCol: '#45434a', belt: '#4a2a1e', crest: null,
    }),
  },
  mourning: {
    name: 'Mourning Knight', desc: 'Black plate under a heavy hood and a ragged fur mantle, with a long tattered cloak.',
    style: Object.assign({}, KNIGHT_STYLE, {
      helm: 'pilgrim', hood: '#151314', fur: '#262220', furLight: '#3a3430',
      armor: '#3a3b3e', armorDark: '#242527', armorLight: '#55575b', body: '#2e2f32',
      tabard: '#1a1617', emblem: null, leg: '#333437', legDark: '#232426', boot: '#141415', bootDark: '#0e0e0f',
      cloak: '#0f0d0e', cloakFur: true, cloakFurCol: '#1d1a19', crest: null, pauldron: false, belt: '#3a1a14',
    }),
  },
  warden: {
    name: 'Barrow Warden', desc: 'Rust-dark iron, a T-slit barbute over a mail hood, and a filthy grey tabard.',
    style: Object.assign({}, KNIGHT_STYLE, {
      helm: 'barbute', mail: '#56524c', armor: '#4a4540', armorDark: '#2f2b28', armorLight: '#6a645c', body: '#403b36',
      tabard: '#3a3634', emblem: null, leg: '#3e3934', legDark: '#2a2622', cloak: '#1c1a19', crest: null,
    }),
  },
  ashborn: {
    name: 'Ashborn', desc: 'Charred black plate split by ember cracks that glow from within, and a burning visor.',
    style: Object.assign({}, KNIGHT_STYLE, {
      helm: 'pilgrim', visor: '#ff8a2a', embers: true,
      armor: '#1e1c1c', armorDark: '#141313', armorLight: '#2e2a28', body: '#1a1818',
      tabard: '#2a1410', emblem: null, leg: '#1c1a1a', legDark: '#121111', boot: '#0e0d0d', bootDark: '#0a0909',
      cloak: '#140d0b', crest: null,
    }),
  },
};
const SKIN_ORDER = ['lantern', 'vigil', 'mourning', 'warden', 'ashborn', 'grimm'];

const Skins = {
  id: 'lantern',
  load() { const v = store.get('ashenOath.skin'); if (v && SKINS[v]) this.id = v; },
  set(id) { if (SKINS[id]) { this.id = id; store.set('ashenOath.skin', id); } },
  style() { return SKINS[this.id].style; },
};
Skins.load();

// glowing cracks for the Ashborn skin, drawn over the rig in the same space
function drawEmberCracks(ctx, j, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(255,${120 + Math.sin(t * 6) * 30},40,${0.75 + Math.sin(t * 4) * 0.2})`; ctx.lineWidth = 0.9;
  const seg2 = (a, b, k) => { ctx.moveTo(lerp(a.x, b.x, k), lerp(a.y, b.y, k)); ctx.lineTo(lerp(a.x, b.x, k + 0.18) + 1.5, lerp(a.y, b.y, k + 0.18) + 0.5); ctx.lineTo(lerp(a.x, b.x, k + 0.3) - 1, lerp(a.y, b.y, k + 0.3)); };
  ctx.beginPath();
  seg2(j.hip, j.sh, 0.2); seg2(j.hip, j.sh, 0.55); seg2(j.sh, j.elbowF, 0.3); seg2(j.hip, j.kneeF, 0.35); seg2(j.kneeF, j.footF, 0.3);
  ctx.stroke();
  ctx.restore();
}

// preview pose for menus: breathing with a sword cut every few seconds
function skinPreviewPose(t) {
  const m = WEAPONS.longsword.light[0], cyc = t % 3.4;
  if (cyc > 2.4) {
    const k = cyc - 2.4;
    if (k < 0.16) return lerpPose(basePose(PLAYER_IDLE), m.windP, easeOut(k / 0.16));
    if (k < 0.28) return lerpPose(m.windP, m.strikeP, easeOut((k - 0.16) / 0.12));
    return lerpPose(m.strikeP, basePose(PLAYER_IDLE), easeInOut(Math.min(1, (k - 0.28) / 0.5)));
  }
  const b = Math.sin(t * 2.2) * 0.03;
  return basePose(Object.assign({}, PLAYER_IDLE, { lean: PLAYER_IDLE.lean + b, armF: PLAYER_IDLE.armF + b }));
}
function drawSkinPreview(ctx, id, t, x, y, s) {
  const pose = skinPreviewPose(t), j = solveRig(pose), st = SKINS[id].style;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 3 * s, 22 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(s, s);
  drawHumanoid(ctx, j, pose, st, { head: true, armF: true, armB: true, legF: true, legB: true },
    { weapon: c => WEAPONS.longsword.draw(c, 0.4), t, sway: 0.25 + Math.sin(t * 0.9) * 0.15 });
  if (st.embers) drawEmberCracks(ctx, j, t);
  ctx.restore();
}
