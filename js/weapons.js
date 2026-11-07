'use strict';
// ---------------------------------------------------------------------------
// WEAPON REGISTRY
// Every weapon is pure data + a draw function. To add a new weapon in a
// future update, call registerWeapon({...}) with the same shape as the
// longsword below, then give it to the player (Player.weaponId = 'id').
//
// Move fields:
//   stamina, damage, poise (posture dmg), bleed (bleed buildup), sever (limb dmg mult)
//   windup / active / recover   timings in seconds
//   lunge                      forward velocity during the active frames
//   box {x0,x1,y0,y1}          hitbox relative to the player's feet (facing right)
//   targets {limb: weight}     which limbs this swing tends to cut
//   wind / strike              partial poses (see rig.js) for the animation
// ---------------------------------------------------------------------------
const PLAYER_IDLE = { lean: 0.05, legF: 0.28, kneeF: 0.3, legB: -0.25, kneeB: 0.12, armF: 0.55, elbowF: 1.05, armB: 0.05, elbowB: 0.5, weap: 2.35, head: 0 };

const WEAPONS = {};

function registerWeapon(def) {
  // each weapon may have its own resting stance; moves are built on top of it
  const base = Object.assign({}, PLAYER_IDLE, def.idle || {});
  def.idleP = basePose(base);
  const norm = m => {
    m.windP = basePose(Object.assign({}, base, m.wind));
    m.strikeP = basePose(Object.assign({}, base, m.strike));
    return m;
  };
  def.light.forEach(norm);
  def.heavy.forEach(norm);
  norm(def.low);
  for (const k in def.executions) {
    const e = def.executions[k];
    e.windP = basePose(Object.assign({}, base, e.wind));
    e.strikeP = basePose(Object.assign({}, base, e.strike));
  }
  WEAPONS[def.id] = def;
  return def;
}

registerWeapon({
  id: 'longsword',
  name: 'Oathkeeper',
  kind: 'Longsword',
  desc: 'The sword of the Grey Lantern. Its edge was blessed to part the wicked from their sins. Now it mostly parts them from their limbs.',
  bladeLen: 56,

  light: [
    {
      name: 'Descending Cut', stamina: 15, damage: 22, poise: 18, bleed: 24, sever: 1.0,
      windup: 0.15, active: 0.11, recover: 0.3, lunge: 110,
      box: { x0: 4, x1: 84, y0: -118, y1: -18 },
      targets: { head: 1, armF: 3, armB: 2 },
      wind: { armF: 3.4, elbowF: 0.4, weap: 3.9, lean: -0.12, legF: 0.35, legB: -0.3 },
      strike: { armF: 0.9, elbowF: 0.1, weap: 0.65, lean: 0.3, legF: 0.55, kneeF: 0.55, legB: -0.5 },
    },
    {
      name: 'Rising Cut', stamina: 15, damage: 22, poise: 18, bleed: 24, sever: 1.0,
      windup: 0.13, active: 0.11, recover: 0.3, lunge: 100,
      box: { x0: 4, x1: 82, y0: -125, y1: -25 },
      targets: { armF: 3, armB: 3, head: 1 },
      wind: { armF: 0.25, elbowF: 0.2, weap: -0.35, lean: 0.25, legF: 0.45, kneeF: 0.5, legB: -0.35 },
      strike: { armF: 2.7, elbowF: 0.2, weap: 3.05, lean: -0.12, legF: 0.3, legB: -0.4 },
    },
    {
      name: 'Lunging Thrust', stamina: 18, damage: 28, poise: 24, bleed: 34, sever: 0.7,
      windup: 0.18, active: 0.1, recover: 0.4, lunge: 210,
      box: { x0: 10, x1: 96, y0: -95, y1: -45 },
      targets: { head: 1, armF: 1, armB: 1 },
      wind: { armF: 0.45, elbowF: 2.2, weap: 1.6, lean: -0.18, legF: 0.2, legB: -0.5 },
      strike: { armF: 1.55, elbowF: 0.02, weap: 1.57, lean: 0.38, legF: 0.75, kneeF: 0.65, legB: -0.65 },
    },
  ],

  heavy: [
    {
      name: 'Oathbreaker', heavy: true, stamina: 32, damage: 48, poise: 46, bleed: 42, sever: 1.9,
      windup: 0.44, active: 0.13, recover: 0.5, lunge: 150,
      box: { x0: 0, x1: 92, y0: -130, y1: 0 },
      targets: { head: 3, armF: 2, armB: 2 },
      wind: { armF: 3.6, elbowF: 0.6, weap: 4.25, lean: -0.32, legF: 0.15, legB: -0.25 },
      strike: { armF: 0.8, elbowF: 0.0, weap: 0.85, lean: 0.48, legF: 0.75, kneeF: 0.75, legB: -0.7 },
    },
    {
      name: 'Rising Cleave', heavy: true, stamina: 30, damage: 44, poise: 42, bleed: 40, sever: 1.8,
      windup: 0.38, active: 0.13, recover: 0.5, lunge: 130,
      box: { x0: 0, x1: 90, y0: -135, y1: -10 },
      targets: { armF: 3, armB: 3, head: 1 },
      wind: { armF: -0.6, elbowF: 0.3, weap: -0.9, lean: 0.35, legF: 0.6, kneeF: 0.8, legB: -0.3, kneeB: 0.4 },
      strike: { armF: 2.9, elbowF: 0.15, weap: 3.4, lean: -0.2, legF: 0.3, legB: -0.5 },
    },
  ],

  // S + Attack: a crouching cut aimed at the legs
  low: {
    name: 'Hamstring Cut', stamina: 17, damage: 18, poise: 16, bleed: 28, sever: 1.25,
    windup: 0.17, active: 0.11, recover: 0.36, lunge: 120,
    box: { x0: 4, x1: 86, y0: -55, y1: 4 },
    targets: { legF: 4, legB: 1 },
    wind: { armF: 2.1, elbowF: 0.3, weap: 2.6, lean: 0.0, legF: 0.5, kneeF: 0.9, legB: -0.3, kneeB: 0.8 },
    strike: { armF: 1.0, elbowF: 0.05, weap: 1.05, lean: 0.6, legF: 0.95, kneeF: 1.4, legB: -0.25, kneeB: 1.3 },
  },

  // Executions (F on a staggered / crippled / near-dead foe)
  executions: {
    decap: {
      wind: { armF: 3.5, elbowF: 0.5, weap: 4.5, lean: -0.25, legF: 0.2, legB: -0.3 },
      strike: { armF: 1.7, elbowF: 0.05, weap: 1.75, lean: 0.35, legF: 0.7, kneeF: 0.5, legB: -0.6 },
      windT: 0.42, strikeT: 0.52, end: 1.6,
    },
    impale: {
      wind: { armF: 0.4, elbowF: 2.3, weap: 1.57, lean: -0.25, legF: 0.2, legB: -0.5 },
      strike: { armF: 1.5, elbowF: 0.05, weap: 1.57, lean: 0.4, legF: 0.75, kneeF: 0.6, legB: -0.65 },
      windT: 0.38, strikeT: 0.46, ripT: 1.05, end: 1.7,
    },
    downstab: {
      wind: { armF: 3.0, elbowF: 0.6, weap: 3.14, lean: -0.1, legF: 0.3, legB: -0.3 },
      strike: { armF: 1.1, elbowF: 0.1, weap: 0.12, lean: 0.75, legF: 0.9, kneeF: 1.3, legB: -0.4, kneeB: 0.9 },
      windT: 0.4, strikeT: 0.5, end: 1.4,
    },
  },

  draw(ctx, blood) {
    const L = this.bladeLen;
    // grip & pommel
    ctx.fillStyle = '#2b1b12'; ctx.fillRect(-1.6, -10, 3.2, 11);
    ctx.fillStyle = '#7d7a70'; ctx.beginPath(); ctx.arc(0, -11, 2.6, 0, Math.PI * 2); ctx.fill();
    // crossguard
    ctx.fillStyle = '#8c897f'; ctx.fillRect(-8, 1, 16, 2.6);
    ctx.fillStyle = '#5c5a52'; ctx.fillRect(-8, 3, 16, 0.8);
    // blade
    ctx.fillStyle = '#c3c6cc';
    ctx.beginPath(); ctx.moveTo(-2.4, 3.5); ctx.lineTo(2.4, 3.5); ctx.lineTo(1.9, L - 6); ctx.lineTo(0, L); ctx.lineTo(-1.9, L - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9ebef'; ctx.fillRect(-0.4, 5, 0.9, L - 12); // fuller shine
    if (blood > 0.02) {
      const len = L * Math.min(1, 0.25 + blood * 0.8);
      ctx.fillStyle = `rgba(125,6,10,${0.55 + blood * 0.4})`;
      ctx.beginPath(); ctx.moveTo(-2.3, L - len); ctx.lineTo(2.3, L - len * 0.8); ctx.lineTo(1.9, L - 6); ctx.lineTo(0, L); ctx.lineTo(-1.9, L - 6); ctx.closePath(); ctx.fill();
    }
  },
});


// ---------------------------------------------------------------------------
// BARROW CLEAVER — greataxe. Slow, two-handed, brutal. Every swing breaks
// shields (heavy) and bites deep into limbs.
// ---------------------------------------------------------------------------
registerWeapon({
  id: 'greataxe', name: 'Barrow Cleaver', kind: 'Greataxe', bladeLen: 66,
  desc: 'A woodsman\'s axe hammered into a war-cleaver by some desperate garrison smith. Slow, and utterly final.',
  idle: { armF: 0.45, elbowF: 0.9, weap: 2.05, armB: 0.65, elbowB: 1.0, lean: 0.1, legF: 0.35, kneeF: 0.35, legB: -0.3 },
  light: [
    {
      name: 'Overhead Chop', heavy: true, stamina: 24, damage: 36, poise: 38, bleed: 30, sever: 2.2,
      windup: 0.34, active: 0.14, recover: 0.48, lunge: 120,
      box: { x0: 0, x1: 100, y0: -132, y1: 2 }, targets: { head: 3, armF: 2, armB: 2 },
      wind: { armF: 3.5, elbowF: 0.5, weap: 4.1, lean: -0.25, armB: 3.2, elbowB: 0.6, legF: 0.2, legB: -0.3 },
      strike: { armF: 0.7, elbowF: 0.0, weap: 0.75, lean: 0.5, armB: 0.6, elbowB: 0.2, legF: 0.7, kneeF: 0.7, legB: -0.6 },
    },
    {
      name: 'Rising Reap', heavy: true, stamina: 22, damage: 34, poise: 34, bleed: 30, sever: 2.0,
      windup: 0.3, active: 0.14, recover: 0.48, lunge: 110,
      box: { x0: 0, x1: 98, y0: -138, y1: -8 }, targets: { armF: 3, armB: 3, head: 1 },
      wind: { armF: -0.5, elbowF: 0.3, weap: -0.8, lean: 0.35, armB: -0.3, elbowB: 0.4, legF: 0.6, kneeF: 0.8, legB: -0.3, kneeB: 0.4 },
      strike: { armF: 2.8, elbowF: 0.15, weap: 3.3, lean: -0.2, armB: 2.5, elbowB: 0.3, legF: 0.3, legB: -0.5 },
    },
  ],
  heavy: [
    {
      name: 'Executioner\'s Arc', heavy: true, stamina: 40, damage: 68, poise: 85, bleed: 45, sever: 3.0, quake: true,
      windup: 0.72, active: 0.16, recover: 0.7, lunge: 170,
      box: { x0: 0, x1: 106, y0: -142, y1: 4 }, targets: { head: 4, armF: 2, armB: 2 },
      wind: { armF: 3.8, elbowF: 0.7, weap: 4.6, lean: -0.4, armB: 3.4, elbowB: 0.7, legF: 0.1, legB: -0.3 },
      strike: { armF: 0.55, elbowF: 0.0, weap: 0.5, lean: 0.6, armB: 0.5, elbowB: 0.1, legF: 0.85, kneeF: 0.9, legB: -0.75 },
    },
  ],
  low: {
    name: 'Shin Splitter', heavy: true, stamina: 22, damage: 30, poise: 30, bleed: 32, sever: 2.6,
    windup: 0.3, active: 0.13, recover: 0.5, lunge: 110,
    box: { x0: 0, x1: 98, y0: -60, y1: 4 }, targets: { legF: 4, legB: 2 },
    wind: { armF: 2.2, elbowF: 0.3, weap: 2.8, lean: 0.0, armB: 2.0, elbowB: 0.4, legF: 0.5, kneeF: 0.9, legB: -0.3, kneeB: 0.8 },
    strike: { armF: 1.0, elbowF: 0.05, weap: 1.1, lean: 0.65, armB: 1.0, elbowB: 0.2, legF: 0.95, kneeF: 1.4, legB: -0.25, kneeB: 1.3 },
  },
  executions: {
    decap: { wind: { armF: 3.6, elbowF: 0.5, weap: 4.4, lean: -0.3, armB: 3.3 }, strike: { armF: 1.0, elbowF: 0.05, weap: 1.05, lean: 0.55, armB: 0.9, legF: 0.7, kneeF: 0.6, legB: -0.6 }, windT: 0.5, strikeT: 0.62, end: 1.8 },
    impale: { wind: { armF: 3.4, elbowF: 0.5, weap: 4.1, lean: -0.25, armB: 3.1 }, strike: { armF: 1.25, elbowF: 0.05, weap: 1.35, lean: 0.45, armB: 1.1, legF: 0.7, legB: -0.6 }, windT: 0.46, strikeT: 0.56, ripT: 1.1, end: 1.75 },
    downstab: { wind: { armF: 3.4, elbowF: 0.6, weap: 3.9, lean: -0.15, armB: 3.1 }, strike: { armF: 0.9, elbowF: 0.1, weap: 0.3, lean: 0.75, armB: 0.8, legF: 0.9, kneeF: 1.3, legB: -0.4, kneeB: 0.9 }, windT: 0.46, strikeT: 0.56, end: 1.5 },
  },
  draw(ctx, blood) {
    ctx.fillStyle = '#2e2016'; ctx.fillRect(-1.9, -16, 3.8, 74);           // haft
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-2.3, -16, 4.6, 6); ctx.fillRect(-2.2, 8, 4.4, 3); // grip wraps
    ctx.fillStyle = '#5a5552';                                              // bearded blade on the leading (-x) side
    ctx.beginPath(); ctx.moveTo(-1.5, 46); ctx.lineTo(-20, 40); ctx.quadraticCurveTo(-30, 54, -24, 72); ctx.lineTo(-12, 62); ctx.lineTo(-1.5, 62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a958d';                                              // bright cutting edge
    ctx.beginPath(); ctx.moveTo(-20, 40); ctx.quadraticCurveTo(-30, 54, -24, 72); ctx.lineTo(-21, 69); ctx.quadraticCurveTo(-26, 54, -17.5, 42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3e3a37'; ctx.fillRect(-3, 44, 6, 20); ctx.fillRect(1.5, 50, 6, 6); // socket and back spike
    if (blood > 0.02) {
      ctx.fillStyle = `rgba(125,6,10,${0.5 + blood * 0.45})`;
      ctx.beginPath(); ctx.moveTo(-14, 48); ctx.lineTo(-26, 52); ctx.quadraticCurveTo(-29, 62, -24, 72); ctx.lineTo(-14, 64); ctx.closePath(); ctx.fill();
    }
  },
});

// ---------------------------------------------------------------------------
// WATCHMAN'S PIKE — spear. Long reach; thrusts pierce every foe in the line,
// and the charging impale carries them along on the point.
// ---------------------------------------------------------------------------
registerWeapon({
  id: 'spear', name: 'Watchman\'s Pike', kind: 'Spear', bladeLen: 94,
  desc: 'The road watch\'s ash-hafted pike. Keep them at the end of it and they never reach you.',
  idle: { armF: 1.0, elbowF: 0.6, weap: 1.42, armB: 0.85, elbowB: 0.95, lean: 0.08, legF: 0.4, kneeF: 0.4, legB: -0.35 },
  light: [
    {
      name: 'Thrust', stamina: 13, damage: 20, poise: 16, bleed: 22, sever: 0.5, pierce: true,
      windup: 0.13, active: 0.1, recover: 0.26, lunge: 90,
      box: { x0: 20, x1: 132, y0: -96, y1: -50 }, targets: { head: 1, armF: 1 },
      wind: { armF: 0.6, elbowF: 1.8, weap: 1.5, lean: -0.12, armB: 0.5, elbowB: 1.6 },
      strike: { armF: 1.55, elbowF: 0.02, weap: 1.55, lean: 0.3, armB: 1.4, elbowB: 0.3, legF: 0.6, kneeF: 0.5, legB: -0.55 },
    },
    {
      name: 'High Thrust', stamina: 13, damage: 21, poise: 16, bleed: 24, sever: 0.6, pierce: true,
      windup: 0.13, active: 0.1, recover: 0.26, lunge: 90,
      box: { x0: 20, x1: 130, y0: -118, y1: -70 }, targets: { head: 3, armF: 1 },
      wind: { armF: 0.8, elbowF: 1.8, weap: 1.75, lean: -0.12, armB: 0.7, elbowB: 1.6 },
      strike: { armF: 1.8, elbowF: 0.02, weap: 1.8, lean: 0.25, armB: 1.65, elbowB: 0.3, legF: 0.6, kneeF: 0.5, legB: -0.55 },
    },
    {
      name: 'Sweeping Cut', stamina: 16, damage: 24, poise: 22, bleed: 26, sever: 1.0,
      windup: 0.2, active: 0.12, recover: 0.36, lunge: 70,
      box: { x0: 0, x1: 122, y0: -122, y1: -10 }, targets: { armF: 2, armB: 2, head: 1 },
      wind: { armF: 2.6, elbowF: 0.3, weap: 3.2, lean: -0.05, armB: 2.2, elbowB: 0.4 },
      strike: { armF: 0.8, elbowF: 0.1, weap: 0.9, lean: 0.3, armB: 0.6, elbowB: 0.3, legF: 0.55, kneeF: 0.5, legB: -0.5 },
    },
  ],
  heavy: [
    {
      name: 'Charging Impale', stamina: 32, damage: 44, poise: 55, bleed: 34, sever: 0.6, pierce: true, pin: true,
      windup: 0.36, active: 0.18, recover: 0.5, lunge: 340,
      box: { x0: 20, x1: 138, y0: -100, y1: -45 }, targets: { head: 1, armF: 1 },
      wind: { armF: 0.4, elbowF: 2.2, weap: 1.55, lean: -0.2, armB: 0.3, elbowB: 2.0, legF: 0.1, legB: -0.6 },
      strike: { armF: 1.55, elbowF: 0.0, weap: 1.57, lean: 0.45, armB: 1.45, elbowB: 0.1, legF: 0.85, kneeF: 0.7, legB: -0.75 },
    },
  ],
  low: {
    name: 'Knee Thrust', stamina: 14, damage: 18, poise: 14, bleed: 24, sever: 1.3, pierce: true,
    windup: 0.15, active: 0.1, recover: 0.32, lunge: 90,
    box: { x0: 20, x1: 128, y0: -56, y1: 2 }, targets: { legF: 4, legB: 2 },
    wind: { armF: 0.3, elbowF: 1.6, weap: 1.2, legF: 0.5, kneeF: 0.9, legB: -0.3, kneeB: 0.8, armB: 0.3, elbowB: 1.5 },
    strike: { armF: 1.2, elbowF: 0.05, weap: 1.25, lean: 0.55, legF: 0.9, kneeF: 1.3, legB: -0.3, kneeB: 1.2, armB: 1.1, elbowB: 0.3 },
  },
  executions: {
    decap: { wind: { armF: 0.8, elbowF: 2.0, weap: 1.8, lean: -0.2, armB: 0.7, elbowB: 1.9 }, strike: { armF: 1.85, elbowF: 0.02, weap: 1.85, lean: 0.35, armB: 1.7, elbowB: 0.2, legF: 0.7, legB: -0.6 }, windT: 0.36, strikeT: 0.44, end: 1.5 },
    impale: { wind: { armF: 0.4, elbowF: 2.2, weap: 1.55, lean: -0.25, armB: 0.3, elbowB: 2.0 }, strike: { armF: 1.5, elbowF: 0.05, weap: 1.57, lean: 0.4, armB: 1.4, elbowB: 0.1, legF: 0.75, kneeF: 0.6, legB: -0.65 }, windT: 0.36, strikeT: 0.44, ripT: 1.05, end: 1.7 },
    downstab: { wind: { armF: 2.9, elbowF: 0.5, weap: 3.1, lean: -0.1, armB: 2.6, elbowB: 0.6 }, strike: { armF: 1.0, elbowF: 0.1, weap: 0.1, lean: 0.7, armB: 0.9, elbowB: 0.2, legF: 0.9, kneeF: 1.3, legB: -0.4, kneeB: 0.9 }, windT: 0.4, strikeT: 0.5, end: 1.4 },
  },
  draw(ctx, blood) {
    ctx.fillStyle = '#4c3824'; ctx.fillRect(-1.3, -42, 2.6, 124);          // ash haft
    ctx.fillStyle = '#6a5a48'; ctx.fillRect(-1.6, -42, 3.2, 4);
    ctx.fillStyle = '#3a3a3c'; ctx.fillRect(-2, 78, 4, 6);                   // socket
    ctx.fillStyle = '#b8bbc0';                                               // leaf-shaped head
    ctx.beginPath(); ctx.moveTo(-1.6, 83); ctx.quadraticCurveTo(-4.2, 90, 0, 100); ctx.quadraticCurveTo(4.2, 90, 1.6, 83); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4e6ea'; ctx.fillRect(-0.3, 85, 0.7, 12);
    ctx.fillStyle = '#6e1016'; ctx.beginPath(); ctx.moveTo(-1.5, 76); ctx.lineTo(-5, 84 + Math.sin(Date.now() / 300) * 1.5); ctx.lineTo(-1, 80); ctx.fill(); // pennon tassel
    if (blood > 0.02) { ctx.fillStyle = `rgba(125,6,10,${0.55 + blood * 0.4})`; ctx.beginPath(); ctx.moveTo(-2.4, 88); ctx.quadraticCurveTo(-3, 94, 0, 100); ctx.quadraticCurveTo(3, 94, 2.4, 88); ctx.closePath(); ctx.fill(); }
  },
});

// ---------------------------------------------------------------------------
// MERCY & MALICE — twin daggers. Very fast, bleed-heavy, and able to strike
// straight out of a roll.
// ---------------------------------------------------------------------------
const drawDagger = (ctx, blood, tint) => {
  ctx.fillStyle = '#2a1a12'; ctx.fillRect(-1.2, -6, 2.4, 7);
  ctx.fillStyle = tint; ctx.fillRect(-4, 1, 8, 1.8);
  ctx.fillStyle = '#c4c6cc';
  ctx.beginPath(); ctx.moveTo(-1.8, 3); ctx.lineTo(1.8, 3); ctx.lineTo(1.2, 19); ctx.lineTo(0, 24); ctx.lineTo(-1.2, 19); ctx.closePath(); ctx.fill();
  if (blood > 0.02) { ctx.fillStyle = `rgba(125,6,10,${0.55 + blood * 0.4})`; ctx.beginPath(); ctx.moveTo(-1.6, 12); ctx.lineTo(1.6, 12); ctx.lineTo(1.2, 19); ctx.lineTo(0, 24); ctx.lineTo(-1.2, 19); ctx.closePath(); ctx.fill(); }
};
registerWeapon({
  id: 'daggers', name: 'Mercy & Malice', kind: 'Twin Daggers', bladeLen: 24, rollAttack: true,
  desc: 'A flagellant\'s pair of knives, one blessed, one not. Neither cares which you use.',
  idle: { armF: 0.95, elbowF: 1.6, weap: 2.6, armB: 0.8, elbowB: 1.7, lean: 0.18, legF: 0.4, kneeF: 0.5, legB: -0.35, kneeB: 0.3 },
  light: [
    { name: 'Slash', stamina: 9, damage: 11, poise: 8, bleed: 30, sever: 0.7, windup: 0.07, active: 0.08, recover: 0.17, lunge: 70,
      box: { x0: 4, x1: 64, y0: -112, y1: -30 }, targets: { armF: 2, armB: 2, head: 1 },
      wind: { armF: 2.4, elbowF: 0.6, weap: 2.9, lean: 0.0, armB: 0.5 }, strike: { armF: 1.0, elbowF: 0.2, weap: 0.9, lean: 0.3, armB: 1.0, elbowB: 1.2 } },
    { name: 'Backhand', stamina: 9, damage: 11, poise: 8, bleed: 30, sever: 0.7, windup: 0.07, active: 0.08, recover: 0.17, lunge: 70,
      box: { x0: 4, x1: 64, y0: -118, y1: -34 }, targets: { armF: 2, armB: 2, head: 1 },
      wind: { armF: 0.2, elbowF: 0.3, weap: -0.2, lean: 0.25, armB: 2.2, elbowB: 0.6 }, strike: { armF: 2.2, elbowF: 0.2, weap: 2.6, lean: 0.0, armB: 0.8, elbowB: 0.3 } },
    { name: 'Stab', stamina: 9, damage: 12, poise: 9, bleed: 32, sever: 0.5, windup: 0.08, active: 0.08, recover: 0.18, lunge: 90,
      box: { x0: 8, x1: 66, y0: -100, y1: -50 }, targets: { head: 1, armF: 1 },
      wind: { armF: 0.7, elbowF: 1.9, weap: 1.6, armB: 0.6, elbowB: 1.9 }, strike: { armF: 1.5, elbowF: 0.05, weap: 1.57, lean: 0.35, armB: 1.3, elbowB: 0.4, legF: 0.6, kneeF: 0.5, legB: -0.5 } },
    { name: 'Twin Stab', stamina: 12, damage: 16, poise: 14, bleed: 42, sever: 0.8, windup: 0.11, active: 0.09, recover: 0.3, lunge: 130,
      box: { x0: 8, x1: 70, y0: -104, y1: -46 }, targets: { head: 2, armF: 1, armB: 1 },
      wind: { armF: 0.5, elbowF: 2.0, weap: 1.6, armB: 0.4, elbowB: 2.1, lean: -0.1 }, strike: { armF: 1.55, elbowF: 0.05, weap: 1.57, armB: 1.5, elbowB: 0.05, lean: 0.4, legF: 0.7, kneeF: 0.6, legB: -0.6 } },
  ],
  heavy: [
    { name: 'Bloodletting Flurry', stamina: 26, damage: 11, poise: 12, bleed: 38, sever: 0.6, hits: 3,
      windup: 0.2, active: 0.36, recover: 0.38, lunge: 60,
      box: { x0: 6, x1: 66, y0: -108, y1: -40 }, targets: { armF: 2, armB: 2, head: 1 },
      wind: { armF: 0.6, elbowF: 1.9, weap: 1.6, armB: 0.5, elbowB: 2.0 }, strike: { armF: 1.5, elbowF: 0.1, weap: 1.55, armB: 1.45, elbowB: 0.2, lean: 0.35 } },
  ],
  low: {
    name: 'Tendon Cut', stamina: 10, damage: 10, poise: 8, bleed: 36, sever: 1.7, windup: 0.1, active: 0.09, recover: 0.26, lunge: 90,
    box: { x0: 4, x1: 64, y0: -56, y1: 4 }, targets: { legF: 4, legB: 2 },
    wind: { armF: 2.0, elbowF: 0.3, weap: 2.5, legF: 0.5, kneeF: 0.9, legB: -0.3, kneeB: 0.8 },
    strike: { armF: 1.0, elbowF: 0.05, weap: 1.0, lean: 0.65, legF: 0.95, kneeF: 1.4, legB: -0.25, kneeB: 1.3 },
  },
  executions: {
    decap: { wind: { armF: 2.6, elbowF: 0.6, weap: 3.0, lean: -0.1, armB: 1.2 }, strike: { armF: 1.6, elbowF: 0.1, weap: 1.7, lean: 0.3, armB: 1.4, elbowB: 0.6 }, windT: 0.3, strikeT: 0.38, end: 1.4 },
    impale: { wind: { armF: 0.5, elbowF: 2.0, weap: 1.6, armB: 0.4, elbowB: 2.1, lean: -0.15 }, strike: { armF: 1.5, elbowF: 0.05, weap: 1.57, armB: 1.45, elbowB: 0.05, lean: 0.4, legF: 0.7, legB: -0.6 }, windT: 0.3, strikeT: 0.38, ripT: 0.95, end: 1.5 },
    downstab: { wind: { armF: 2.9, elbowF: 0.5, weap: 3.1, armB: 2.7, elbowB: 0.5, lean: -0.1 }, strike: { armF: 1.0, elbowF: 0.1, weap: 0.15, armB: 0.9, elbowB: 0.1, lean: 0.75, legF: 0.9, kneeF: 1.3, legB: -0.4, kneeB: 0.9 }, windT: 0.32, strikeT: 0.42, end: 1.3 },
  },
  draw(ctx, blood) { drawDagger(ctx, blood, '#c9b77a'); },
  draw2(ctx, blood) { drawDagger(ctx, blood * 0.7, '#5a2a2a'); },
});

// where each weapon can be found (picked up from the world, a quest, or the smith)
const WEAPON_SOURCES = {
  longsword: 'Carried from the river ford.',
  spear: 'Sergeant Bram\'s reward, or Garrick the Smith sells one.',
  daggers: 'On a dead flagellant in Hallowmere, near the barricade.',
  greataxe: 'Buried in the Weeping Mire, past the Drowned Chapel.',
};
