'use strict';
// ---------------------------------------------------------------------------
// Enemies: data definitions + one shared AI/damage/dismemberment class.
// ---------------------------------------------------------------------------
const MOTIONS = {
  over: { wind: { armF: 3.3, elbowF: 0.3, weap: 3.6, lean: -0.15 }, strike: { armF: 0.7, elbowF: 0.1, weap: 0.8, lean: 0.35 } },
  thrust: { wind: { armF: 0.5, elbowF: 2.0, weap: 1.57, lean: -0.1 }, strike: { armF: 1.5, elbowF: 0.0, weap: 1.57, lean: 0.3 } },
  rise: { wind: { armF: 0.15, elbowF: 0.2, weap: -0.4, lean: 0.3 }, strike: { armF: 2.7, elbowF: 0.1, weap: 3.2, lean: -0.1 } },
  stab: { wind: { armF: 0.8, elbowF: 1.8, weap: 1.6, lean: 0.1, armB: 0.5, elbowB: 1.8 }, strike: { armF: 1.45, elbowF: 0.1, weap: 1.57, lean: 0.35, armB: 1.2, elbowB: 0.8 } },
  claw: { wind: { armF: 2.5, elbowF: 0.6, weap: 2.5, lean: 0, armB: 2.2, elbowB: 0.6 }, strike: { armF: 1.2, elbowF: 0.1, weap: 1.2, lean: 0.45, armB: 1.0, elbowB: 0.2 } },
  slam: { wind: { armF: 3.4, elbowF: 0.4, weap: 3.9, lean: -0.2, legF: 0.9, kneeF: 1.5, legB: -0.1, kneeB: 1.4 }, strike: { armF: 0.6, elbowF: 0.0, weap: 0.4, lean: 0.55, legF: 0.8, kneeF: 1.0, legB: -0.5, kneeB: 0.6 } },
  crawl: { wind: { armF: 3.0, elbowF: 0.2, armB: 2.9, elbowB: 0.2 }, strike: { armF: 1.9, elbowF: 0.1, armB: 1.8, elbowB: 0.1 } },
};

const ENEMY_DEFS = {
  peasant: {
    name: 'Infected Villager', infect: 1.0, hp: 70, poise: 30, speed: 55, runSpeed: 95, aggro: 300, scale: 0.96, embers: 28,
    weapon: 'club', coolMin: 0.9, coolMax: 2.0, bleedRes: 1.25,
    idle: { lean: 0.38, armF: 0.2, elbowF: 0.35, weap: 0.5, armB: -0.05, elbowB: 0.3, head: 0.25, legF: 0.25, kneeF: 0.35, legB: -0.2, kneeB: 0.3 },
    style: {
      helm: 'bare', skin: '#948f7e', hair: '#241e1a', eye: '#ff2a1a', armor: '#58452f', armorDark: '#43341f', armorLight: '#6b5640',
      body: '#4b3a29', tabard: '#3b2d1f', tabardLen: 12, leg: '#3c3226', legDark: '#2d251c', boot: '#261d16', bootDark: '#1c1510',
      hand: '#948f7e', limbW: 6, hipW: 7.5, shW: 9.5,
    },
    attacks: [
      { id: 'smash', motion: 'over', windup: 0.62, active: 0.14, recover: 0.65, dmg: 15, poise: 20, reach: 64, yTop: -110, range: 58, lunge: 70 },
      { id: 'jab', motion: 'thrust', windup: 0.45, active: 0.12, recover: 0.55, dmg: 11, poise: 14, reach: 60, yTop: -90, range: 54, lunge: 90 },
    ],
  },
  footman: {
    name: 'Infected Garrison', infect: 1.0, hp: 125, poise: 60, speed: 62, runSpeed: 110, aggro: 340, scale: 1.02, embers: 65,
    weapon: 'shortsword', shield: true, blockChance: 0.5, coolMin: 0.8, coolMax: 1.6, bleedRes: 0.9,
    idle: { lean: 0.1, armF: 0.75, elbowF: 0.9, weap: 1.9, armB: 1.15, elbowB: 0.55, legF: 0.35, kneeF: 0.35, legB: -0.3, kneeB: 0.15 },
    style: {
      helm: 'kettle', helmCol: '#55524b', skin: '#878473', eye: '#ff3a1a', armor: '#57544c', armorDark: '#403e38', armorLight: '#76736a',
      body: '#4a4842', tabard: '#2b3542', tabardLen: 16, leg: '#3e3b35', legDark: '#2d2b27', boot: '#221e1a', bootDark: '#181512',
      hand: '#3a3833', limbW: 7, hipW: 8.5, shW: 10.5, belt: '#2a1d14',
      shield: '#4b3321', shieldRim: '#6f6a62', emblemCol: '#7a6a38',
    },
    attacks: [
      { id: 'thrust', motion: 'thrust', windup: 0.5, active: 0.12, recover: 0.55, dmg: 20, poise: 22, reach: 82, yTop: -95, range: 72, lunge: 140 },
      { id: 'cut', motion: 'over', windup: 0.58, active: 0.13, recover: 0.6, dmg: 24, poise: 26, reach: 72, yTop: -115, range: 64, lunge: 90 },
    ],
  },
  flagellant: {
    name: 'Red Flagellant', infect: 1.1, hp: 85, poise: 26, speed: 105, runSpeed: 175, aggro: 380, scale: 0.98, embers: 50,
    weapon: 'knife', dual: true, selfBleed: true, coolMin: 0.5, coolMax: 1.2, bleedRes: 1.4,
    idle: { lean: 0.35, armF: 1.0, elbowF: 1.2, weap: 2.0, armB: 0.8, elbowB: 1.4, weapB: 2.2, legF: 0.4, kneeF: 0.6, legB: -0.3, kneeB: 0.5 },
    style: {
      helm: 'hood', hood: '#420b0b', eye: '#ff4a2a', skin: '#a68d78', armor: '#a68d78', armorDark: '#8a7462', armorLight: '#b9a08a',
      body: '#a68d78', tabard: '#3f0c0c', tabardLen: 18, leg: '#3a1919', legDark: '#2a1212', boot: '#1d1010', bootDark: '#150b0b',
      hand: '#a68d78', limbW: 6, hipW: 7, shW: 9.5, wounds: true, belt: '#1d1010',
    },
    attacks: [
      { id: 'flurry', motion: 'stab', windup: 0.32, active: 0.09, recover: 0.16, dmg: 9, poise: 10, reach: 58, yTop: -95, range: 54, lunge: 140, next: 'flurry2' },
      { id: 'flurry2', motion: 'stab', windup: 0.12, active: 0.09, recover: 0.16, dmg: 9, poise: 10, reach: 58, yTop: -95, range: 0, lunge: 140, next: 'flurry3', chained: true },
      { id: 'flurry3', motion: 'over', windup: 0.18, active: 0.1, recover: 0.6, dmg: 13, poise: 18, reach: 62, yTop: -110, range: 0, lunge: 160, chained: true },
      { id: 'pounce', motion: 'over', windup: 0.45, active: 0.16, recover: 0.7, dmg: 18, poise: 24, reach: 60, yTop: -110, range: 190, minRange: 110, lunge: 420 },
    ],
  },
  plaguedoc: {
    name: 'Beaked Physician', infect: 1.2, hp: 105, poise: 40, speed: 64, runSpeed: 118, aggro: 340, scale: 1.0, embers: 72,
    weapon: 'staff', coolMin: 0.9, coolMax: 1.7, bleedRes: 1.0,
    idle: { lean: 0.22, armF: 0.95, elbowF: 0.55, weap: 2.7, armB: 0.4, elbowB: 1.2, legF: 0.3, kneeF: 0.3, legB: -0.25, kneeB: 0.15, head: 0.15 },
    style: {
      helm: 'beak', eye: '#c8e89a', skin: '#2a211b', armor: '#1c1816', armorDark: '#141110', armorLight: '#2c2622',
      body: '#1d1917', tabard: '#16120f', tabardLen: 34, leg: '#1a1614', legDark: '#121010', boot: '#0e0b0a', bootDark: '#0a0808',
      hand: '#3a3028', limbW: 6.5, hipW: 9, shW: 10.5, belt: '#3a2c1c',
    },
    attacks: [
      { id: 'cane', motion: 'thrust', windup: 0.55, active: 0.13, recover: 0.6, dmg: 18, poise: 20, reach: 94, yTop: -100, range: 84, lunge: 120 },
      { id: 'censer', motion: 'over', windup: 0.62, active: 0.15, recover: 0.65, dmg: 22, poise: 26, reach: 84, yTop: -120, range: 74, lunge: 80 },
    ],
  },
  brute: {
    name: 'Sackhead Butcher', infect: 0.9, hp: 240, poise: 150, speed: 44, runSpeed: 72, aggro: 300, scale: 1.3, embers: 145,
    weapon: 'maul', armor: true, coolMin: 1.1, coolMax: 2.0, bleedRes: 0.85,
    idle: { lean: 0.2, armF: 0.4, elbowF: 0.4, weap: 0.6, armB: 0.2, elbowB: 0.5, legF: 0.4, kneeF: 0.35, legB: -0.35, kneeB: 0.2 },
    style: {
      helm: 'sack', skin: '#a08670', armor: '#a08670', armorDark: '#86705c', armorLight: '#b39a84',
      body: '#5a4632', tabard: '#3d2a1c', tabardLen: 20, leg: '#3a2c20', legDark: '#2a2018', boot: '#1d1610', bootDark: '#15100c',
      hand: '#a08670', limbW: 10, hipW: 14, shW: 15, belly: true, belt: '#1d140c', eye: '#000',
    },
    attacks: [
      { id: 'pound', motion: 'over', windup: 0.95, active: 0.16, recover: 0.9, dmg: 36, poise: 55, reach: 82, yTop: -130, range: 72, lunge: 60, heavy: true, impact: true },
      { id: 'uppercut', motion: 'rise', windup: 0.8, active: 0.16, recover: 0.8, dmg: 28, poise: 45, reach: 78, yTop: -150, range: 68, lunge: 70, heavy: true },
    ],
  },
  templar: {
    name: 'Templar of the Red Lantern', infect: 0.8, hp: 180, poise: 90, speed: 60, runSpeed: 105, aggro: 360, scale: 1.06, embers: 115,
    weapon: 'mace', shield: true, blockChance: 0.65, coolMin: 0.7, coolMax: 1.4, bleedRes: 0.7,
    idle: { lean: 0.08, armF: 0.8, elbowF: 0.9, weap: 2.1, armB: 1.2, elbowB: 0.5, legF: 0.35, kneeF: 0.35, legB: -0.3, kneeB: 0.15 },
    style: {
      helm: 'greathelm', helmCol: '#7a7d84', eye: '#ff3a1a', skin: '#8a8070', armor: '#6e7178', armorDark: '#4c4f55', armorLight: '#9a9da4',
      body: '#5e6168', tabard: '#d8d0c0', tabardLen: 20, emblem: '#9a1010', leg: '#55585e', legDark: '#3c3e43', boot: '#222326', bootDark: '#18191b',
      hand: '#3a3c40', limbW: 7.5, hipW: 9, shW: 11.5, pauldron: true, kneeCop: true, belt: '#2a1d14',
      shield: '#d8d0c0', shieldRim: '#6e7178', emblemCol: '#9a1010', crossShield: true,
    },
    attacks: [
      { id: 'smite', motion: 'over', windup: 0.55, active: 0.13, recover: 0.4, dmg: 26, poise: 30, reach: 74, yTop: -120, range: 66, lunge: 100, next: 'smite2' },
      { id: 'smite2', motion: 'rise', windup: 0.25, active: 0.13, recover: 0.7, dmg: 22, poise: 26, reach: 72, yTop: -130, range: 0, lunge: 110, chained: true },
      { id: 'bash', motion: 'thrust', windup: 0.42, active: 0.12, recover: 0.55, dmg: 15, poise: 30, reach: 62, yTop: -100, range: 56, lunge: 160 },
    ],
  },
  crawler: {
    name: 'Grave Crawler', infect: 1.6, hp: 45, poise: 20, speed: 30, runSpeed: 36, aggro: 260, scale: 0.92, embers: 18,
    legless: true, coolMin: 0.8, coolMax: 1.6, bleedRes: 1.5,
    idle: { lean: 0, armF: 2.6, elbowF: -0.4, armB: 2.6, elbowB: -0.4 },
    style: {
      helm: 'bare', skin: '#7d7a70', hair: '#1a1714', eye: '#ff2a1a', armor: '#7d7a70', armorDark: '#6a675e', armorLight: '#8f8b80',
      body: '#4a4236', tabard: '#2d261c', tabardLen: 8, leg: '#3c3226', legDark: '#2d251c', boot: '#261d16', bootDark: '#1c1510',
      hand: '#7d7a70', limbW: 5.5, hipW: 7, shW: 9, wounds: true,
    },
    attacks: [],
  },
  carrier: { // bloated with the Weeping; bursts when it dies
    name: 'Bloated Carrier', infect: 1.4, hp: 95, poise: 70, speed: 40, runSpeed: 60, aggro: 280, scale: 1.16, embers: 60,
    burst: true, coolMin: 1.0, coolMax: 1.8, bleedRes: 1.3,
    idle: { lean: 0.15, armF: 0.5, elbowF: 0.6, armB: 0.3, elbowB: 0.6, legF: 0.45, kneeF: 0.4, legB: -0.4, kneeB: 0.25, head: 0.3 },
    style: {
      helm: 'bare', skin: '#8a9474', hair: '#2a2a1c', eye: '#ffb030', armor: '#8a9474', armorDark: '#717a5e', armorLight: '#9aa484',
      body: '#5a5a3a', tabard: '#3a3622', tabardLen: 14, leg: '#3c3a28', legDark: '#2c2a1c', boot: '#20201a', bootDark: '#181812',
      hand: '#8a9474', limbW: 8.5, hipW: 13, shW: 13, belly: true, pustules: true,
    },
    attacks: [],
  },
  fallensister: { // a Sister of Saint Ysolde the Weeping took
    name: 'Weeping Sister', infect: 1.2, hp: 92, poise: 30, speed: 100, runSpeed: 165, aggro: 360, scale: 0.96, embers: 70,
    weapon: 'knife', dual: true, coolMin: 0.5, coolMax: 1.1, bleedRes: 1.2,
    idle: { lean: 0.3, armF: 0.9, elbowF: 1.3, weap: 2.0, armB: 0.7, elbowB: 1.4, weapB: 2.2, legF: 0.35, kneeF: 0.4, legB: -0.25, kneeB: 0.3, head: 0.3 },
    style: {
      helm: 'veil', veil: '#141014', band: '#b8aea2', hair: '#cfc8c0', eyeCol: '#ff3020', weeping: true, skin: '#b8a698',
      armor: '#16121a', armorDark: '#0e0b10', armorLight: '#241e28', body: '#18141c', tabard: '#18141c', tabardLen: 34,
      leg: '#141016', legDark: '#0e0b10', boot: '#0a080a', bootDark: '#080608', hand: '#b8a698', limbW: 5.5, hipW: 7.5, shW: 8.5,
      collar: '#a89e92', cuffs: '#a89e92', frill: '#a89e92', blood: true, flare: 1.6, lacing: true,
    },
    attacks: [
      { id: 'rend', motion: 'stab', windup: 0.3, active: 0.09, recover: 0.16, dmg: 10, poise: 10, reach: 58, yTop: -95, range: 54, lunge: 150, next: 'rend2' },
      { id: 'rend2', motion: 'over', windup: 0.16, active: 0.1, recover: 0.55, dmg: 14, poise: 18, reach: 60, yTop: -110, range: 0, lunge: 160, chained: true },
      { id: 'lunge', motion: 'stab', windup: 0.42, active: 0.14, recover: 0.6, dmg: 16, poise: 20, reach: 60, yTop: -100, range: 170, minRange: 100, lunge: 400 },
    ],
  },
  headsman: {
    boss: true, name: 'Gaul, the Penitent Headsman', hp: 1050, poise: 230, speed: 62, runSpeed: 115, aggro: 2000, scale: 1.55, embers: 1500,
    weapon: 'greataxe', coolMin: 0.7, coolMax: 1.5, bleedRes: 0.8,
    idle: { lean: 0.15, armF: 0.5, elbowF: 0.9, weap: 1.7, armB: 0.3, elbowB: 0.9, legF: 0.4, kneeF: 0.4, legB: -0.35, kneeB: 0.2 },
    style: {
      helm: 'exec', hood: '#0e0b0b', eye: '#ff3a1a', skin: '#8f7a68', armor: '#8f7a68', armorDark: '#75624f', armorLight: '#a48c78',
      body: '#2b211c', tabard: '#2c0909', tabardLen: 22, leg: '#241c18', legDark: '#1a1411', boot: '#141010', bootDark: '#0e0b0b',
      hand: '#2a1e18', limbW: 8, hipW: 11, shW: 14, belt: '#120d0b',
    },
    attacks: [
      { id: 'cleave', motion: 'over', windup: 0.85, active: 0.16, recover: 0.8, dmg: 44, poise: 60, reach: 140, yTop: -170, range: 125, lunge: 130, heavy: true, impact: true },
      { id: 'rise', motion: 'rise', windup: 0.7, active: 0.18, recover: 0.75, dmg: 36, poise: 50, reach: 145, yTop: -190, range: 130, lunge: 100, heavy: true },
      { id: 'leap', motion: 'slam', windup: 0.55, active: 0.2, recover: 1.0, dmg: 50, poise: 70, radius: 120, range: 460, minRange: 190, heavy: true, special: 'leap' },
      { id: 'cleave2', motion: 'over', windup: 0.4, active: 0.16, recover: 0.95, dmg: 40, poise: 60, reach: 140, yTop: -170, range: 0, lunge: 160, heavy: true, impact: true, chained: true },
    ],
  },
};

class Enemy {
  constructor(type, spawn) {
    const def = ENEMY_DEFS[type];
    this.def = def; this.kind = type; this.spawn = spawn;
    this.x = spawn.x; this.y = GROUND; this.z = 0; this.vz = 0; this.vx = 0;
    this.facing = spawn.facing || -1; this.s = def.scale;
    this.maxHp = def.hp; this.hp = def.hp;
    this.posture = 0; this.maxPosture = def.poise; this.sinceHit = 99;
    this.bleed = 0;
    this.parts = { head: true, armF: true, armB: true, legF: true, legB: true };
    this.limbHp = { head: def.hp * 0.5, armF: def.hp * 0.36, armB: def.hp * 0.32, legF: def.hp * 0.3, legB: def.hp * 0.3 };
    if (def.boss) this.limbHp = { head: 1e9, armF: 1e9, armB: def.hp * 0.22, legF: 1e9, legB: 1e9 };
    this.stumps = [];
    this.stumpBleed = 0; this.fountain = 0;
    this.state = def.boss ? 'dormant' : 'idle'; this.st = 0; this.atk = null; this.hitDone = false;
    this.cool = rand(0.4, 1.0);
    this.idleMode = spawn.idle || 'stand';
    this.pose = basePose(this.idlePose());
    this.joints = solveRig(this.pose);
    this.body = { ox: 0, oy: 0, rot: 0 };
    this.dead = false; this.deathT = 0; this.fallTo = 0; this.poolRef = null; this.deathDelay = 0;
    this.hasWeapon = true; this.hasShield = !!def.shield;
    this.walkPhase = rand(0, 6); this.flash = 0;
    this.phase2 = false; this.blocking = false; this.speedMul = 1;
    if (def.legless) { // born of the grave: drags itself along on its arms
      this.parts.legF = false; this.parts.legB = false; this.hasWeapon = false;
      this.body = { ox: -44, oy: -6, rot: Math.PI / 2 };
    }
    if (!def.weapon) this.hasWeapon = false;
  }

  get crippled() { return !this.parts.legF || !this.parts.legB; }
  get boss() { return !!this.def.boss; }

  get executable() {
    if (this.dead || this.state === 'executed' || this.state === 'dormant' || this.state === 'defeated' || this.z > 0) return false;
    if (this.boss) return this.state === 'stagger';
    return this.state === 'stagger' || this.hp <= this.maxHp * 0.3 || this.crippled;
  }

  idlePose() {
    const d = this.def.idle;
    if (this.idleMode === 'feed') return Object.assign({}, d, { lean: 1.25, head: 0.4, armF: 1.0, elbowF: 0.3, armB: 0.9, elbowB: 0.2, legF: 1.2, kneeF: 2.2, legB: 0.2, kneeB: 2.1, weap: 0.2 });
    if (this.idleMode === 'pray') return Object.assign({}, d, { lean: 0.15, head: 0.35, armF: 1.9, elbowF: 1.6, armB: 1.8, elbowB: 1.7, legF: 1.3, kneeF: 2.6, legB: 0.15, kneeB: 2.35, weap: 0.2 });
    return d;
  }
  combatPose() { return this.def.idle; }

  hurtbox() {
    if (this.dead) return { x: this.x, y: GROUND, w: 0, h: 0 };
    if (this.crippled) return { x: this.x - 46 * this.s, y: GROUND - 28 * this.s, w: 92 * this.s, h: 28 * this.s };
    const hw = (this.boss ? 18 : 14) * this.s;
    return { x: this.x - hw, y: GROUND - this.z - 98 * this.s, w: hw * 2, h: 98 * this.s };
  }

  worldPoint(p) {
    const c = Math.cos(this.body.rot), s = Math.sin(this.body.rot);
    const rx = p.x * c - p.y * s + this.body.ox, ry = p.x * s + p.y * c + this.body.oy;
    return { x: this.x + rx * this.s * this.facing, y: this.y - this.z + ry * this.s };
  }

  facePlayer(p) { const d = Math.sign(p.x - this.x); if (d) this.facing = d; }

  // ------------------------------------------------------------------ AI
  update(dt, g) {
    const p = g.enemyTarget(this);
    this.target = p;
    if (this.flash > 0) this.flash -= dt;
    if (this.dead) { this.updateDead(dt, g); this.joints = solveRig(this.pose); return; }
    this.st += dt; this.sinceHit += dt;

    // bleeding from stumps
    if (this.stumpBleed > 0 && this.state !== 'executed') {
      this.hp -= this.stumpBleed * dt;
      for (const limb of this.stumps) {
        if (chance(dt * 22)) {
          const wp = this.worldPoint(this.anchor(limb));
          FX.blood(wp.x, wp.y, -Math.PI / 2 + rand(-0.8, 0.8), 0.3, rand(80, 220), 1, 1);
        }
      }
      if (this.hp <= 0) { this.die(g, { dir: -this.facing, bledOut: true }); return; }
    }
    if (this.def.selfBleed && chance(dt * 2)) {
      const c = this.worldPoint(this.joints.chest); FX.blood(c.x, c.y, Math.PI / 2, 0.5, 40, 1, 0.7);
    }
    if (this.hp < this.maxHp * 0.5 && chance(dt * 3)) {
      const c = this.worldPoint(this.joints.chest); FX.blood(c.x + rand(-5, 5), c.y, Math.PI / 2, 0.4, 30, 1, 0.8);
    }
    this.bleed = Math.max(0, this.bleed - 7 * dt);
    if (this.sinceHit > 2 && this.state !== 'stagger') this.posture = Math.max(0, this.posture - this.maxPosture * 0.2 * dt);
    if (this.phase2 && chance(dt * 25)) { const c = this.worldPoint(this.joints.chest); FX.aura(c.x, c.y); }

    const dx = p.x - this.x, dist = Math.abs(dx);
    const spdMul = this.speedMul;
    const aggro = this.def.aggro * 1.15; // the Weeping makes them hunt further
    switch (this.state) {
      case 'dormant': this.vx = 0; break;
      case 'idle':
        this.vx = 0;
        // the infected are restless: they pace and twitch instead of standing still
        if (this.idleMode === 'stand' && !this.boss) {
          this.wanderT = (this.wanderT === undefined ? rand(0.5, 2) : this.wanderT) - dt;
          if (this.wanderT <= 0) { this.wanderT = rand(1.4, 3.4); this.wanderTo = this.spawn.x + rand(-90, 90); }
          if (this.wanderTo !== undefined && Math.abs(this.wanderTo - this.x) > 8) {
            this.facing = Math.sign(this.wanderTo - this.x);
            this.vx = this.facing * this.def.speed * (this.crippled ? 0.6 : 0.5);
            this.walkPhase += dt * Math.abs(this.vx) * 0.06;
          }
        }
        if ((this.kind === 'peasant' || this.kind === 'carrier') && dist < 500 && chance(dt * 0.25)) Sfx.play('groan');
        if (!p.dead && dist < aggro && (dist < aggro * 0.6 || this.facing === Math.sign(dx) || this.sinceHit < 1)) {
          this.state = 'chase'; this.st = 0; this.idleMode = 'stand';
        }
        break;
      case 'return': {
        const hd = this.spawn.x - this.x;
        if (Math.abs(hd) < 6) { this.state = 'idle'; this.vx = 0; this.facing = this.spawn.facing || -1; break; }
        this.facing = Math.sign(hd); this.vx = this.facing * this.def.speed * (this.crippled ? 0.3 : 1);
        if (!p.dead && dist < aggro * 0.6) this.state = 'chase';
        break;
      }
      case 'chase': {
        if (p.dead) { this.state = this.boss ? 'idle' : 'return'; break; }
        if (!this.boss && dist > aggro * 3) { this.state = 'return'; break; }
        this.facePlayer(p);
        const atk = this.chooseAttack(dist);
        const range = this.crippled ? 52 : (this.hasWeapon ? Math.min(...this.def.attacks.filter(a => !a.chained && !a.minRange).map(a => a.range)) : 46);
        let spd = this.crippled ? 26 : (dist > 220 ? this.def.runSpeed : this.def.speed);
        spd *= spdMul;
        // footmen hold their shield up and circle a little
        if (this.def.shield && this.hasShield && !this.crippled && p.state === 'attack' && p.phase === 'wind' && dist < 120 && this.cool > 0 && chance(this.def.blockChance * 0.35)) {
          this.state = 'block'; this.st = 0; this.vx = 0; break;
        }
        const stopAt = this.boss ? 72 : range * 0.8;
        if (dist > stopAt) this.vx = this.facing * spd;
        else if (dist < 30) this.vx = -this.facing * this.def.speed * 0.5;
        else this.vx = 0;
        this.cool -= dt;
        if (this.cool <= 0) {
          if (atk) this.beginAttack(atk);
          else if (this.boss && dist > 200) this.cool = 0.5; // decided to walk instead of leaping
        }
        if (this.def.dual && this.cool > 0.5 && dist < 70 && chance(dt * 0.8)) this.vx = -this.facing * this.def.speed * 1.4;
        if (Math.abs(this.vx) > 0) this.walkPhase += dt * Math.abs(this.vx) * 0.06;
        break;
      }
      case 'windup':
        this.vx *= Math.exp(-dt * 10);
        if (this.atk.special !== 'leap' && this.st < this.atk.windup * 0.5) this.facePlayer(p);
        if (this.st >= this.atk.windup * (this.phase2 ? 0.8 : 1)) {
          this.state = 'attack'; this.st = 0; this.hitDone = false;
          Sfx.play(this.atk.heavy ? 'heavySwing' : 'swing');
          if (this.atk.special === 'leap') {
            this.vz = 640;
            const air = 2 * this.vz / GRAVITY;
            this.vx = clamp((p.x - this.x) / air, -650, 650);
          } else this.vx = this.facing * (this.crippled ? 60 : this.atk.lunge);
        }
        break;
      case 'attack': {
        const a = this.atk;
        if (a.special === 'leap') {
          this.z += this.vz * dt; this.vz -= GRAVITY * dt;
          if (this.z <= 0 && this.vz < 0) {
            this.z = 0; this.vz = 0; this.vx = 0;
            Sfx.play('slam'); FX.addShake(16); FX.dust(this.x, GROUND, 26, 70);
            for (let i = 0; i < 8; i++) FX.decal(this.x + rand(-70, 70), rand(3, 6));
            if (Math.abs(p.x - this.x) < a.radius && !p.dead) p.hurt(a.dmg, this, { poise: a.poise, heavy: true, unblockable: false });
            this.state = 'recover'; this.st = 0;
          }
          break;
        }
        this.vx *= Math.exp(-dt * 7);
        if (!this.hitDone) {
          const box = this.attackBox(a);
          if (overlap(box, p.hurtbox())) {
            const dmg = this.hasWeapon ? a.dmg : a.dmg * 0.45;
            const r = p.hurt(this.crippled ? dmg * 0.6 : dmg, this, { poise: a.poise, heavy: a.heavy });
            if (r && r !== 'dodge') this.hitDone = true;
            if (r === 'hit') { const c = p.worldPoint(p.joints.chest); FX.slash(c.x, c.y, this.facing, 10); }
          }
        }
        if (a.impact && this.st > a.active * 0.6 && !this.impacted) {
          this.impacted = true;
          const tip = this.x + this.facing * a.reach * 0.9;
          FX.dust(tip, GROUND, 12, 20); FX.addShake(8); Sfx.play('slam');
        }
        if (this.st >= a.active) { this.state = 'recover'; this.st = 0; }
        break;
      }
      case 'recover':
        this.vx *= Math.exp(-dt * 8);
        if (this.st >= this.atk.recover * (this.phase2 ? 0.7 : 1)) {
          let next = this.atk.next;
          if (this.boss && this.phase2 && !next && this.atk.id === 'cleave' && chance(0.7)) next = 'cleave2';
          if (this.boss && this.phase2 && !next && this.atk.id === 'rise' && chance(0.5)) next = 'cleave2';
          if (next && !this.crippled && this.hasWeapon) this.beginAttack(this.def.attacks.find(a => a.id === next));
          else { this.state = 'chase'; this.st = 0; this.cool = rand(this.def.coolMin, this.def.coolMax) * (this.phase2 ? 0.6 : 1); }
        }
        break;
      case 'hurt':
        this.vx *= Math.exp(-dt * 9);
        if (this.st >= 0.32) { this.state = 'chase'; this.cool = Math.min(this.cool, rand(0.15, 0.5)); }
        break;
      case 'block':
        this.vx = 0; this.facePlayer(p);
        if (this.st >= 0.9 || !this.hasShield) { this.state = 'chase'; this.cool = rand(0.1, 0.4); }
        break;
      case 'stagger':
        this.vx *= Math.exp(-dt * 6);
        if (this.st >= (this.boss ? 2.6 : 2.2)) { this.state = 'chase'; this.posture = 0; this.cool = 0.4; }
        break;
      case 'falling': // just lost a leg
        this.vx *= Math.exp(-dt * 6);
        this.body.rot = lerp(0, Math.PI / 2, easeIn(clamp(this.st / 0.45, 0, 1)));
        this.body.ox = lerp(0, -44, clamp(this.st / 0.45, 0, 1));
        this.body.oy = lerp(0, -6, clamp(this.st / 0.45, 0, 1));
        if (this.st >= 0.45) { FX.dust(this.x, GROUND, 8); this.state = 'chase'; this.cool = 1; }
        break;
      case 'roar':
        this.vx = 0;
        if (this.st > 0.3 && this.st < 1.4) { FX.addShake(4); }
        if (this.st >= 1.6) { this.state = 'chase'; this.cool = 0.2; }
        break;
      case 'getup':
        this.vx *= Math.exp(-dt * 6);
        if (this.st >= 1.4) { this.state = 'chase'; this.cool = 0.3; }
        break;
      case 'executed': case 'defeated': this.vx = 0; break;
    }

    if (this.state !== 'executed') {
      this.x += this.vx * dt;
      if (this.state !== 'attack' || !this.atk || this.atk.special !== 'leap') {
        if (this.z > 0) { this.z += this.vz * dt; this.vz -= GRAVITY * dt; if (this.z < 0) { this.z = 0; this.vz = 0; } }
      }
    }
    const b = g.enemyBounds(this);
    this.x = clamp(this.x, b[0], b[1]);
    this.computePose(dt);
    this.joints = solveRig(this.pose);
  }

  chooseAttack(dist) {
    if (this.crippled) return dist < 56 ? { id: 'crawlclaw', motion: 'crawl', windup: 0.6, active: 0.14, recover: 0.9, dmg: 8, poise: 8, reach: 58, yTop: -40, range: 54, lunge: 0 } : null;
    if (!this.hasWeapon) return dist < 50 ? { id: 'claw', motion: 'claw', windup: 0.5, active: 0.12, recover: 0.7, dmg: 12, poise: 10, reach: 50, yTop: -100, range: 46, lunge: 120 } : null;
    const opts = this.def.attacks.filter(a => !a.chained && dist <= a.range && dist >= (a.minRange || 0));
    if (!opts.length) return null;
    // the headsman favours his leap when the knight keeps distance
    if (this.boss) {
      const leap = opts.find(a => a.special === 'leap');
      if (leap && dist > 200) return chance(0.5) ? leap : null;
    }
    return pick(opts);
  }

  beginAttack(a) {
    if (!a) return;
    this.atk = a; this.state = 'windup'; this.st = 0; this.hitDone = false; this.impacted = false;
    if (!a.chained) Sfx.play(this.boss ? 'bossGrunt' : 'grunt');
    this.atkFrom = Object.assign({}, this.pose);
    const m = MOTIONS[a.motion];
    this.atkWind = basePose(Object.assign({}, this.combatPose(), m.wind));
    this.atkStrike = basePose(Object.assign({}, this.combatPose(), m.strike));
  }

  attackBox(a) {
    const s = this.s, reach = a.reach * s / (this.boss ? s : 1);
    const near = 0;
    return {
      x: this.facing > 0 ? this.x + near : this.x - reach,
      y: GROUND + (a.yTop || -100) * (this.boss ? 1 : s),
      w: reach, h: -(a.yTop || -100) * (this.boss ? 1 : s),
    };
  }

  parried() {
    if (this.boss) {
      this.posture += this.maxPosture * 0.3;
      if (this.posture >= this.maxPosture) this.stagger();
      else { this.state = 'hurt'; this.st = 0; this.vx = -this.facing * 60; }
      return;
    }
    this.stagger();
  }

  stagger() {
    this.state = 'stagger'; this.st = 0; this.posture = 0; this.vx = -this.facing * 50;
    const c = this.worldPoint(this.joints.head);
    FX.text(c.x, c.y - 26, this.boss ? 'POSTURE BROKEN' : 'STAGGERED', '#e6c47a', 15);
  }

  anchor(limb) {
    const j = this.joints;
    if (limb === 'head') return j.neck;
    if (limb === 'armF' || limb === 'armB') return j.sh;
    return j.hip;
  }

  // ---------------------------------------------------------- damage
  takeHit(m, src, g) {
    if (this.dead || this.state === 'executed' || this.state === 'defeated') return 'none';
    if (this.state === 'dormant') return 'none';
    const fromDir = Math.sign(src.x - this.x) || 1;
    const facingSrc = fromDir === this.facing;
    this.sinceHit = 0;
    const chest = this.worldPoint(this.joints.chest);

    if (this.state === 'block' && facingSrc && this.hasShield && this.parts.armB) {
      Sfx.play('clang');
      const sp = this.worldPoint(this.joints.handB);
      FX.sparks(sp.x, sp.y, 14, -fromDir);
      this.posture += m.poise * (m.heavy ? 1.6 : 0.7);
      if (m.heavy || this.posture >= this.maxPosture) { this.stagger(); return 'guardbreak'; }
      this.st = 0.4;
      return 'blocked';
    }
    if (this.state === 'idle' || this.state === 'return') { this.state = 'chase'; this.idleMode = 'stand'; }

    let dmg = m.dmg;
    if (this.state === 'stagger') dmg *= 1.25;
    this.hp -= dmg;
    this.flash = 0.12;
    this.bleed += m.bleed * (this.def.bleedRes || 1);

    // pick which limb the blade bit into
    const limb = weightedPick(m.targets, k => this.parts[k] && (k !== 'head') && this.limbHp[k] < 1e8);
    const hitPt = limb ? this.worldPoint(this.anchor(limb === 'legF' || limb === 'legB' ? 'legF' : limb === 'head' ? 'head' : 'armF')) : chest;
    const hp2 = limb && (limb === 'legF' || limb === 'legB') ? this.worldPoint(this.joints.kneeF) : limb === 'armF' || limb === 'armB' ? this.worldPoint(this.joints.elbowF) : chest;
    FX.slash(hp2.x || hitPt.x, hp2.y || hitPt.y, src.facing, m.heavy ? 30 : 18);
    Sfx.play('slash');

    if (this.bleed >= 100) {
      this.bleed = 0;
      const hd = this.maxHp * (this.boss ? 0.07 : 0.22);
      this.hp -= hd;
      FX.gush(chest.x, chest.y, -Math.PI / 2 - 0.4 * src.facing, 40, 380);
      FX.gush(chest.x, chest.y, -Math.PI / 2 + 0.6 * src.facing, 30, 300);
      FX.text(chest.x, chest.y - 46, 'HEMORRHAGE', '#d01818', 18);
      Sfx.play('hemorrhage');
      FX.addShake(5);
    }

    if (limb) {
      this.limbHp[limb] -= dmg * m.sever;
      if (this.limbHp[limb] <= 0 && this.hp > 0) this.sever(limb, src.facing, g);
    }

    if (this.hp <= 0) {
      if (this.boss) { this.defeat(g); return 'hit'; }
      // killing blows often take something with them
      const k = weightedPick(Object.assign({ head: m.heavy ? 2 : 0.6 }, m.targets), q => this.parts[q]);
      if (k && chance(m.heavy ? 0.9 : 0.65)) this.sever(k, src.facing, g);
      this.die(g, { dir: src.facing });
      return 'kill';
    }

    if (this.boss && !this.phase2 && this.hp < this.maxHp * 0.5) {
      this.phase2 = true; this.speedMul = 1.25;
      this.state = 'roar'; this.st = 0; Sfx.play('roar');
      g.toast('The Headsman drinks deep of his own wounds...', 3);
      return 'hit';
    }

    this.posture += m.poise;
    if (this.state !== 'stagger' && this.state !== 'falling' && this.state !== 'roar') {
      if (this.posture >= this.maxPosture) this.stagger();
      else if (!this.boss && !this.def.armor && this.state !== 'attack' && !(this.state === 'windup' && this.kind === 'footman' && m.heavy === false && chance(0.25))) {
        this.state = 'hurt'; this.st = 0;
        this.vx = src.facing * (m.heavy ? 170 : 90);
      }
    }
    return 'hit';
  }

  sever(limb, dir, g) {
    if (!this.parts[limb]) return;
    const wp = this.worldPoint(this.anchor(limb));
    const st = this.def.style;
    this.parts[limb] = false;
    this.stumps.push(limb);
    const gib = { part: limb, style: st, s: this.s, facing: this.facing, x: wp.x, y: wp.y, vx: dir * rand(120, 330), vy: rand(-560, -260), vr: rand(-15, 15) * dir, bleed: 3.5 };
    if (limb === 'head') { gib.vy = rand(-700, -480); gib.vx = dir * rand(80, 220); gib.bleed = 5; }
    FX.addGib(gib);
    if (limb === 'armF' && this.hasWeapon) {
      this.hasWeapon = false;
      FX.addGib({ part: 'weapon', weapon: this.def.weapon, style: st, s: this.s, facing: this.facing, x: wp.x + dir * 10, y: wp.y + 10, vx: dir * rand(60, 200), vy: rand(-380, -200), vr: rand(-10, 10), bleed: 0 });
    }
    if (limb === 'armB' && this.hasShield) {
      this.hasShield = false;
      FX.addGib({ part: 'shield', style: st, s: this.s, facing: this.facing, x: wp.x, y: wp.y + 10, vx: dir * rand(40, 150), vy: rand(-300, -150), vr: rand(-6, 6), bleed: 0 });
    }
    const up = -Math.PI / 2;
    FX.gush(wp.x, wp.y, up + (limb === 'head' ? 0 : -dir * 0.5), 34, 460);
    FX.blood(wp.x, wp.y, dir > 0 ? 0 : Math.PI, 0.6, 300, 18);
    Sfx.play('sever');
    FX.addShake(7); FX.addHitstop(0.07);
    this.stumpBleed += this.maxHp * (this.boss ? 0.004 : 0.045);
    if (limb === 'head') this.fountain = 2.2;
    if ((limb === 'legF' || limb === 'legB') && this.stumps.filter(s => s === 'legF' || s === 'legB').length === 1 && !this.dead) {
      this.state = 'falling'; this.st = 0; this.atk = null;
    }
    if (this.boss && limb === 'armB') g.toast("The Headsman's arm falls. He does not seem to notice.", 3);
    else if (!this.boss && limb === 'armF') FX.text(wp.x, wp.y - 30, 'DISARMED', '#c9b98a', 13);
  }

  die(g, o = {}) {
    if (this.dead) return;
    this.dead = true; this.state = 'dead'; this.deathT = 0; this.hp = 0; this.z = 0;
    const dir = o.dir || -this.facing;
    if (this.crippled) this.fallTo = this.body.rot;
    else this.fallTo = (dir * this.facing > 0 ? 1 : -1) * Math.PI / 2;
    this.fallFrom = this.body.rot;
    this.oxFrom = this.body.ox; this.oyFrom = this.body.oy;
    Sfx.play('enemyDie');
    if (this.def.burst) { // the carrier ruptures in a spray of infected bile
      const c = this.worldPoint(this.joints.chest);
      FX.blood(c.x, c.y, -Math.PI / 2, 1.5, 480, 70, 1.4, ['#6b7a2a', '#4a5a18', '#7a0505', '#8a9a3a']);
      FX.mist(c.x, c.y, 10);
      Sfx.play('hemorrhage'); FX.addShake(8);
      const pl = g.player;
      if (!pl.dead && Math.abs(pl.x - this.x) < 110 && pl.state !== 'execute' && !(pl.state === 'roll' && pl.iframe)) {
        pl.addInfection(22);
        pl.hurt(10, this, { noInfect: true });
        FX.text(pl.x, GROUND - 120, 'INFECTED BILE', '#a8c060', 14);
      }
    }
    g.onEnemyKilled(this, o);
  }

  defeat(g) {
    this.hp = 1; this.state = 'defeated'; this.st = 0; this.vx = 0; this.z = 0;
    g.onBossDefeated(this);
  }

  updateDead(dt, g) {
    this.deathT += dt;
    if (this.deathDelay > 0) { this.deathDelay -= dt; this.deathT = 0; }
    else {
      const p = clamp(this.deathT / 0.55, 0, 1);
      this.body.rot = lerp(this.fallFrom, this.fallTo, easeIn(p));
      this.body.oy = lerp(this.oyFrom, -5, p);
      if (p >= 1 && !this.landed) {
        this.landed = true; FX.dust(this.x, GROUND, 6); Sfx.play('step');
        const c = this.worldPoint(this.joints.chest);
        this.poolRef = FX.pool(c.x, rand(26, 40) * this.s);
      }
    }
    this.vx *= Math.exp(-dt * 5);
    this.x += this.vx * dt;
    if (this.fountain > 0) {
      this.fountain -= dt;
      const n = this.joints.neck;
      const wp = this.worldPoint(n);
      const ang = -Math.PI / 2 + this.body.rot * this.facing * 0.9;
      const strength = Math.min(1, this.fountain / 1.2);
      if (chance(0.85)) FX.blood(wp.x, wp.y, ang, 0.25, 200 + 260 * strength * (0.6 + 0.4 * Math.sin(this.deathT * 14)), 2, 1.1);
    }
    if (this.deathT < 4 && this.stumps.length && chance(dt * 10)) {
      const wp = this.worldPoint(this.anchor(pick(this.stumps)));
      FX.blood(wp.x, wp.y, -Math.PI / 2, 0.8, 90, 1);
    }
    this.pose = this.pose || basePose(this.def.idle);
  }

  computePose(dt) {
    const s = this.state;
    let k = 1 - Math.exp(-dt * 12), tgt;
    const cp = this.combatPose();
    if (this.crippled && !['falling', 'executed', 'dead'].includes(s)) {
      // crawling on the ground, dragging itself towards the knight
      const ph = this.walkPhase;
      if (Math.abs(this.vx) > 1) this.walkPhase += dt * 5;
      if (s === 'windup' || s === 'attack' || s === 'recover') {
        tgt = this.atkPoseNow();
      } else {
        tgt = { lean: 0, head: -0.6, armF: 2.6 + Math.sin(ph) * 0.45, elbowF: -0.4, armB: 2.6 - Math.sin(ph) * 0.45, elbowB: -0.4, legF: 0.05, kneeF: 0.1, legB: -0.05, kneeB: 0.1, weap: 2.6 };
      }
      this.body.rot = Math.PI / 2; this.body.ox = -44; this.body.oy = -6;
      blendPose(this.pose, tgt, k);
      return;
    }
    switch (s) {
      case 'dormant': tgt = Object.assign({}, cp, { lean: 0.3, head: 0.5, armF: 0.1, elbowF: 0.1, weap: 0.05, legF: 1.3, kneeF: 2.5, legB: 0.15, kneeB: 2.35 }); break;
      case 'idle': {
        const b = Math.sin(this.st * 2 + this.walkPhase) * 0.04;
        tgt = Object.assign({}, this.idlePose()); tgt.lean += b;
        if (Math.abs(this.vx) > 1) tgt = walkPose(tgt, this.walkPhase, 0.4, 0.05);
        tgt.head = (tgt.head || 0) + (Math.sin(this.st * 23) > 0.96 ? 0.35 : 0); // a sudden twitch
        if (this.idleMode === 'feed') { tgt.armF += Math.sin(this.st * 9) * 0.3; tgt.head += Math.sin(this.st * 9) * 0.1; }
        break;
      }
      case 'chase': case 'return':
        tgt = Math.abs(this.vx) > 1 ? walkPose(cp, this.walkPhase, Math.abs(this.vx) > 120 ? 0.65 : 0.42, Math.abs(this.vx) > 120 ? 0.15 : 0.02) : Object.assign({}, cp, { lean: cp.lean + Math.sin(this.st * 2) * 0.03 });
        break;
      case 'windup': case 'attack': case 'recover':
        tgt = this.atkPoseNow(); k = 1; break;
      case 'block':
        tgt = Object.assign({}, cp, { armB: 1.55, elbowB: 0.3, lean: -0.05, legF: 0.5, kneeF: 0.5, legB: -0.45 }); k = 1 - Math.exp(-dt * 30); break;
      case 'hurt':
        tgt = Object.assign({}, cp, { lean: -0.4, head: -0.4, armF: 0.3, weap: 1.2 }); k = 1 - Math.exp(-dt * 25); break;
      case 'stagger': {
        const w = Math.sin(this.st * 5) * 0.08;
        tgt = Object.assign({}, cp, { lean: -0.3 + w, head: -0.5 + w, armF: 0.15, elbowF: 0.2, weap: 0.35, armB: -0.1, elbowB: 0.2, legF: 0.55, kneeF: 0.8, legB: -0.25, kneeB: 0.5 });
        break;
      }
      case 'falling': tgt = Object.assign({}, cp, { lean: 0.2, armF: 2.2, armB: 2.0 }); break;
      case 'roar': tgt = Object.assign({}, cp, { lean: -0.35, head: -0.6, armF: 2.4, elbowF: 0.6, weap: 3.4, armB: 2.0, elbowB: 0.8, legF: 0.55, legB: -0.5 }); break;
      case 'getup': tgt = Object.assign({}, cp, { lean: 0.6, legF: 1.1, kneeF: 2.0, legB: 0.1, kneeB: 1.8 }); break;
      case 'defeated': tgt = Object.assign({}, cp, { lean: 0.35, head: 0.5, armF: 0.2, elbowF: 0.1, weap: 0.05, armB: 0.1, legF: 1.3, kneeF: 2.5, legB: 0.15, kneeB: 2.35 }); k = 1 - Math.exp(-dt * 4); break;
      case 'executed': return;
      default: tgt = cp;
    }
    blendPose(this.pose, tgt, k);
  }

  atkPoseNow() {
    const a = this.atk; if (!a) return this.combatPose();
    const s = this.state, t = this.st;
    const wmul = this.phase2 ? 0.8 : 1;
    if (s === 'windup') return lerpPose(this.atkFrom, this.atkWind, easeOut(clamp(t / (a.windup * wmul), 0, 1)));
    if (s === 'attack') {
      if (a.special === 'leap') return this.vz > 0 ? this.atkWind : lerpPose(this.atkWind, this.atkStrike, clamp(-this.vz / 500, 0, 1));
      return lerpPose(this.atkWind, this.atkStrike, easeOut(clamp(t / a.active, 0, 1)));
    }
    return lerpPose(this.atkStrike, basePose(this.combatPose()), easeInOut(clamp(t / (a.recover * wmul), 0, 1)));
  }

  draw(ctx, t, showBars) {
    const st = this.def.style;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    const sw = this.crippled || (this.dead && this.landed) ? 46 : 18;
    ctx.beginPath(); ctx.ellipse(this.x, GROUND + 3, sw * this.s * (this.z > 0 ? 0.6 : 1), 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(this.x, this.y - this.z);
    ctx.scale(this.facing * this.s, this.s);
    ctx.translate(this.body.ox, this.body.oy);
    ctx.rotate(this.body.rot);
    const def = this.def;
    const weap = this.hasWeapon ? (c => drawWeaponShape(c, def.weapon, 0)) : null;
    const weap2 = def.dual ? (c => drawWeaponShape(c, def.weapon, 0)) : null;
    // telegraph glint before a strike
    drawHumanoid(ctx, this.joints, this.pose, st, this.parts, { weapon: weap, weapon2: weap2, shield: this.hasShield, t: t + this.walkPhase });
    if (this.state === 'windup' && this.st < 0.2 && this.parts.head) {
      ctx.globalCompositeOperation = 'lighter';
      const h = this.joints.head;
      const gr = ctx.createRadialGradient(h.x + 5, h.y - 1, 0, h.x + 5, h.y - 1, 16);
      gr.addColorStop(0, 'rgba(255,60,30,0.9)'); gr.addColorStop(1, 'rgba(255,60,30,0)');
      ctx.fillStyle = gr; ctx.fillRect(h.x - 12, h.y - 18, 34, 34);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    if (showBars && !this.dead && !this.boss && this.hp < this.maxHp && this.state !== 'executed') {
      const top = this.crippled ? GROUND - 46 : GROUND - this.z - 118 * this.s;
      const w = 44;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.x - w / 2 - 1, top - 1, w + 2, 6);
      ctx.fillStyle = '#7a1010'; ctx.fillRect(this.x - w / 2, top, w * clamp(this.hp / this.maxHp, 0, 1), 4);
      if (this.bleed > 0) { ctx.fillStyle = '#d94a2a'; ctx.fillRect(this.x - w / 2, top + 5, w * clamp(this.bleed / 100, 0, 1), 2); }
    }
  }
}
