'use strict';
// ---------------------------------------------------------------------------
// Sir Aldric of Vael — the player knight
// ---------------------------------------------------------------------------
const KNIGHT_STYLE = {
  helm: 'knight', armor: '#6d727b', armorDark: '#464a52', armorLight: '#a1a7af',
  body: '#5b6069', tabard: '#3d3f45', emblem: '#d9cfae', crest: '#6e1016',
  leg: '#585d65', legDark: '#3c4047', boot: '#25272b', bootDark: '#18191c',
  hand: '#34373c', skin: '#c9a68a', belt: '#2a1d14',
  limbW: 7, hipW: 8.5, shW: 11, tabardLen: 16,
  cloak: '#15171c', pauldron: true, kneeCop: true,
};

class Player {
  constructor() {
    this.stats = { vig: 1, end: 1, str: 1 };
    this.level = 1;
    this.embers = 0;
    this.maxFlasks = 3;
    this.weaponId = 'longsword';
    this.owned = ['longsword'];          // weapons the knight carries
    this.weaponLevels = { longsword: 0 }; // honing level per weapon
    this.infection = 0; this.turning = false; this.turnT = 0;  // the Red Weeping in the knight's blood
    this.tonics = 1; this.maxTonics = 3;
    this.reset(200);
  }

  get weapon() { return WEAPONS[this.weaponId]; }
  get weaponLevel() { return this.weaponLevels[this.weaponId] || 0; }
  set weaponLevel(v) { this.weaponLevels[this.weaponId] = v; }
  get idle() { return this.weapon.idleP || PLAYER_IDLE; }

  giveWeapon(id) {
    if (!WEAPONS[id] || this.owned.includes(id)) return false;
    this.owned.push(id); this.weaponLevels[id] = this.weaponLevels[id] || 0;
    return true;
  }
  // cycle to the next weapon carried
  swapWeapon(g) {
    if (this.owned.length < 2) { g.toast('You carry only one weapon.', 2); return; }
    const i = this.owned.indexOf(this.weaponId);
    this.weaponId = this.owned[(i + 1) % this.owned.length];
    this.recalc(); this.combo = 0; this.heavyCombo = 0;
    Sfx.play('clang');
    g.toast(`${this.weapon.name}${this.weaponLevel ? ' +' + this.weaponLevel : ''} · ${this.weapon.kind}`, 1.6);
  }

  recalc() {
    this.maxHp = 100 + (this.stats.vig - 1) * 14;
    this.maxSt = 90 + (this.stats.end - 1) * 9;
    this.dmgMul = (1 + (this.stats.str - 1) * 0.08) * (1 + (this.weaponLevel || 0) * 0.1);
  }

  reset(x) {
    this.recalc();
    this.x = x; this.y = GROUND; this.vx = 0; this.facing = 1;
    this.hp = this.maxHp; this.st = this.maxSt; this.stDelay = 0;
    this.state = 'idle'; this.t = 0; this.phase = '';
    this.flasks = this.maxFlasks;
    this.pose = basePose(this.idle);
    this.joints = solveRig(this.pose);
    this.rot = 0; this.iframe = false; this.blood = 0;
    this.combo = 0; this.heavyCombo = 0; this.move = null; this.hitSet = new Set();
    this.trail = []; this.walkPhase = 0; this.hurtFlash = 0; this.blockT = 0;
    this.lastStep = 0; this.deathT = 0; this.healGlow = 0;
  }

  get dead() { return this.state === 'dead'; }
  get busy() { return !['idle', 'walk', 'run', 'block'].includes(this.state); }

  useSt(n) { this.st -= n; this.stDelay = 0.75; }

  hurtbox() {
    if (this.state === 'dead') return { x: this.x, y: GROUND, w: 0, h: 0 };
    return { x: this.x - 12, y: GROUND - 95, w: 24, h: 95 };
  }

  worldPoint(p) { return { x: this.x + p.x * this.facing, y: this.y + p.y }; }

  swordTip() {
    const j = this.joints, a = this.pose.weap, L = this.weapon.bladeLen;
    return this.worldPoint({ x: j.handF.x + Math.sin(a) * L, y: j.handF.y + Math.cos(a) * L });
  }

  inputDir() { return (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0); }

  update(dt, g) {
    this.t += dt;
    const s = this.state;
    this.stDelay -= dt;
    this.updateInfection(dt, g);
    if (this.stDelay <= 0 && s !== 'attack' && s !== 'roll') {
      this.st = Math.min(this.maxSt, this.st + (s === 'block' ? 20 : s === 'run' ? 0 : 55) * dt * (this.infection > 50 && !this.turning ? 0.8 : 1));
    }
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.healGlow > 0) this.healGlow -= dt;
    if (this.blood > 0) {
      this.blood = Math.max(0, this.blood - dt * 0.012);
      if (this.blood > 0.25 && chance(dt * this.blood * 5)) {
        const tip = this.swordTip(); FX.blood(tip.x, tip.y, Math.PI / 2, 0.2, 30, 1, 0.7);
      }
    }
    const dir = this.inputDir();

    switch (s) {
      case 'idle': case 'walk': case 'run': case 'block': {
        if (Input.take('execute')) { const e = g.findExecutable(); if (e) { g.startExecution(e); return; } }
        if (Input.take('swap')) { this.swapWeapon(g); break; }
        if (Input.take('roll') && this.st > 0) { this.startRoll(dir); break; }
        if (Input.take('light') && this.st > 0) { this.startAttack(Input.down('down') ? 'low' : 'light', dir); break; }
        if (Input.take('heavy') && this.st > 0) { this.startAttack('heavy', dir); break; }
        if (Input.take('tonic')) {
          if (this.tonics > 0) { this.state = 'tonic'; this.t = 0; this.flaskDone = false; }
          else g.toast('You carry no Purging Tonic.', 2);
          break;
        }
        if (Input.take('flask')) {
          if (this.flasks > 0) { this.state = 'flask'; this.t = 0; this.flaskDone = false; }
          else g.toast('Thy vials are empty.', 2);
          break;
        }
        const blocking = Input.down('block') && this.st > 0;
        const sprint = Input.down('sprint') && dir !== 0 && this.st > 1 && !blocking;
        if (blocking) {
          if (s !== 'block') { this.state = 'block'; this.blockT = 0; }
          this.blockT += dt;
        }
        if (dir) this.facing = dir;
        const speed = blocking ? 70 : sprint ? 240 : 140;
        this.vx = dir * speed;
        if (sprint) { this.st -= 20 * dt; this.stDelay = 0.35; }
        this.state = blocking ? 'block' : dir ? (sprint ? 'run' : 'walk') : 'idle';
        if (dir) {
          this.walkPhase += dt * (sprint ? 11 : blocking ? 5 : 8);
          if (Math.floor(this.walkPhase / Math.PI) !== this.lastStep) { this.lastStep = Math.floor(this.walkPhase / Math.PI); Sfx.play(zoneIndex(this.x) > 0 ? 'stepStone' : 'step'); }
        }
        break;
      }
      case 'attack': this.updateAttack(dt, g); break;
      case 'roll': {
        const dur = 0.5, p = this.t / dur;
        this.vx = this.facing * 330 * (1 - p * 0.75);
        this.iframe = this.t > 0.03 && this.t < 0.36;
        if (this.t >= dur) { this.state = 'idle'; this.iframe = false; }
        else if (this.t > dur * (this.weapon.rollAttack ? 0.3 : 0.75)) { // daggers strike straight out of a roll
          if (Input.take('light', 0.25) && this.st > 0) { this.iframe = false; this.startAttack('light', dir); }
        }
        break;
      }
      case 'hurt':
        this.vx *= Math.exp(-dt * 8);
        if (this.t >= this.hurtDur) this.state = 'idle';
        break;
      case 'recoil':
        this.vx *= Math.exp(-dt * 10);
        if (this.t >= 0.45) this.state = 'idle';
        break;
      case 'flask':
        this.vx = dir * 45;
        if (!this.flaskDone && this.t > 0.6) {
          this.flaskDone = true; this.flasks--;
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.42);
          this.healGlow = 0.9; Sfx.play('flask');
          for (let i = 0; i < 14; i++) FX.ember(this.x + rand(-14, 14), GROUND - rand(10, 90));
        }
        if (this.t > 1.05) this.state = 'idle';
        break;
      case 'tonic':
        this.vx = dir * 40;
        if (!this.flaskDone && this.t > 0.6) {
          this.flaskDone = true; this.tonics--;
          const wasTurning = this.turning;
          this.cure(45);
          Sfx.play('tonic');
          for (let i = 0; i < 16; i++) FX.add({ k: 'fy', x: this.x + rand(-14, 14), y: GROUND - rand(10, 90), vx: rand(-10, 10), vy: rand(-40, -10), t: 0, life: rand(0.6, 1.2), ph: rand(0, 6) });
          g.toast(wasTurning ? 'The tonic halts the turning... for now.' : 'The tonic burns going down. The Weeping recedes.', 3);
        }
        if (this.t > 1.05) this.state = 'idle';
        break;
      case 'execute': this.vx = 0; break; // driven by Game
      case 'dead': this.vx = 0; this.deathT += dt; break;
    }
    this.x += this.vx * dt;
    const b = g.bounds();
    this.x = clamp(this.x, b[0], b[1]);
    if (s !== 'execute') this.computePose(dt);
    this.joints = solveRig(this.pose);
    // sword trail
    if (this.state === 'attack' && (this.phase === 'active' || (this.phase === 'wind' && this.t > this.move.windup * 0.7))) {
      const j = this.joints, a = this.pose.weap, L = this.weapon.bladeLen;
      this.trail.push({
        h: this.worldPoint({ x: j.handF.x + Math.sin(a) * 14, y: j.handF.y + Math.cos(a) * 14 }),
        t: this.worldPoint({ x: j.handF.x + Math.sin(a) * L, y: j.handF.y + Math.cos(a) * L }), age: 0,
      });
    }
    for (const tr of this.trail) tr.age += dt;
    while (this.trail.length && this.trail[0].age > 0.12) this.trail.shift();
  }

  startAttack(kind, dir) {
    const Wp = this.weapon;
    let mv;
    if (kind === 'light') { mv = Wp.light[this.combo % Wp.light.length]; this.combo++; this.heavyCombo = 0; }
    else if (kind === 'low') { mv = Wp.low; this.combo = 0; }
    else { mv = Wp.heavy[this.heavyCombo % Wp.heavy.length]; this.heavyCombo++; this.combo = 0; }
    if (dir) this.facing = dir;
    this.move = mv; this.state = 'attack'; this.t = 0; this.phase = 'wind';
    this.hitSet.clear(); this.hitSeg = 0; this.useSt(mv.stamina);
    this.fromPose = Object.assign({}, this.pose);
    this.vx = 0;
  }

  startRoll(dir) {
    if (dir) this.facing = dir;
    this.state = 'roll'; this.t = 0; this.useSt(24); this.combo = 0; this.heavyCombo = 0;
    Sfx.play('roll');
    FX.dust(this.x, GROUND, 4, 12);
  }

  updateAttack(dt, g) {
    const m = this.move, tw = m.windup, ta = m.active, tr = m.recover, t = this.t;
    if (t < tw) {
      this.phase = 'wind'; this.vx *= Math.exp(-dt * 10);
    } else if (t < tw + ta) {
      if (this.phase !== 'active') {
        this.phase = 'active';
        Sfx.play(m.heavy ? 'heavySwing' : 'swing');
        this.vx = this.facing * m.lunge;
      }
      if (m.hits > 1) { // flurries strike several times in one swing
        const seg = Math.floor((t - tw) / (ta / m.hits));
        if (seg !== this.hitSeg) { this.hitSeg = seg; this.hitSet.clear(); if (seg > 0) Sfx.play('swing'); }
      }
      this.checkHits(g);
    } else if (t < tw + ta + tr) {
      this.phase = 'recover';
      this.vx *= Math.exp(-dt * 12);
      if (t > tw + ta + tr * 0.25) {
        const dir = this.inputDir();
        if (Input.take('light', 0.45) && this.st > 0) { this.startAttack(Input.down('down') ? 'low' : 'light', dir); return; }
        if (Input.take('heavy', 0.45) && this.st > 0) { this.startAttack('heavy', dir); return; }
        if (Input.take('roll', 0.3) && this.st > 0) { this.startRoll(dir); return; }
      }
    } else {
      this.state = 'idle'; this.combo = 0; this.heavyCombo = 0; this.phase = '';
    }
  }

  checkHits(g) {
    const m = this.move, f = this.facing;
    const box = {
      x: f > 0 ? this.x + m.box.x0 : this.x - m.box.x1,
      y: GROUND + m.box.y0, w: m.box.x1 - m.box.x0, h: m.box.y1 - m.box.y0,
    };
    for (const e of g.enemies) {
      if (e.dead || e.state === 'executed' || this.hitSet.has(e)) continue;
      if (overlap(box, e.hurtbox())) {
        this.hitSet.add(e);
        const res = e.takeHit({
          dmg: m.damage * this.dmgMul * (this.turning ? 1.25 : 1), poise: m.poise, bleed: m.bleed, sever: m.sever,
          heavy: !!m.heavy, targets: m.targets, low: m === this.weapon.low,
        }, this, g);
        if (res === 'blocked') { this.state = 'recoil'; this.t = 0; this.vx = -f * 120; return; }
        if (m.pin && !e.dead && e.state !== 'executed') { e.vx = f * 330; if (!e.boss) { e.state = 'hurt'; e.st = -0.25; } } // carried along on the point
        if (m.quake) { FX.dust(e.x, GROUND, 14, 30); Sfx.play('slam'); }
        this.blood = Math.min(1, this.blood + (m.heavy ? 0.25 : 0.14));
        FX.addHitstop(m.heavy ? 0.09 : 0.05);
        FX.addShake(m.heavy ? 6 : 3);
      }
    }
  }

  // returns 'dodge' | 'parry' | 'block' | 'hit' | false
  hurt(dmg, src, o = {}) {
    if (this.state === 'dead' || this.state === 'execute') return false;
    if (this.state === 'roll' && this.iframe) return 'dodge';
    const fromDir = Math.sign(src.x - this.x) || 1;
    const facingSrc = fromDir === this.facing;
    const chest = this.worldPoint(this.joints.chest);
    if (this.state === 'block' && facingSrc && !o.unblockable) {
      if (this.blockT < 0.17) {
        Sfx.play('parry');
        FX.sparks(chest.x + this.facing * 18, chest.y - 10, 22);
        FX.addHitstop(0.14); FX.addShake(5);
        FX.text(chest.x, chest.y - 50, 'PARRIED', '#f0e2b6', 18);
        if (src.parried) src.parried();
        this.blockT = 1;
        return 'parry';
      }
      Sfx.play('clang');
      FX.sparks(chest.x + this.facing * 16, chest.y - 8, 10);
      this.useSt((o.poise || 20) * 1.2 + dmg * 0.4);
      if (src.def && !src.def.boss) this.addInfection(dmg * 0.08 * (src.def.infect || 1));
      this.hp -= dmg * 0.12;
      if (this.st <= 0) {
        this.st = 0; this.state = 'hurt'; this.t = 0; this.hurtDur = 0.9; this.vx = -fromDir * 140;
        FX.text(chest.x, chest.y - 50, 'GUARD BROKEN', '#d36a4a', 15);
      } else this.vx = -fromDir * 90;
      if (this.hp <= 0) this.die();
      return 'block';
    }
    this.hp -= dmg;
    this.hurtFlash = 0.25;
    if (src.def && !o.noInfect) this.addInfection(dmg * (src.def.boss ? 0.3 : 0.55) * (src.def.infect || 1));
    Mobile.buzz(o.heavy ? 70 : 35);
    FX.slash(chest.x, chest.y, -fromDir, 14 + dmg * 0.4);
    Sfx.play('hurt'); Sfx.play('splat');
    FX.addShake(o.heavy ? 10 : 6); FX.addHitstop(0.06);
    this.combo = 0; this.heavyCombo = 0; this.move = null; this.iframe = false;
    if (this.hp <= 0) { this.die(); return 'hit'; }
    this.state = 'hurt'; this.t = 0;
    this.hurtDur = o.heavy ? 0.6 : 0.34;
    this.vx = -fromDir * (o.heavy ? 280 : 150);
    return 'hit';
  }

  die() {
    this.hp = 0; this.state = 'dead'; this.t = 0; this.deathT = 0; this.vx = 0;
    const c = this.worldPoint(this.joints.chest);
    FX.blood(c.x, c.y, -Math.PI / 2, 1.3, 300, 40, 1.2);
    FX.pool(this.x - this.facing * 30, 34);
    Sfx.play('death');
  }

  // ------------------------------------------------------------ the Red Weeping
  addInfection(v) {
    if (this.dead || this.turning || v <= 0) return;
    const before = this.infection;
    this.infection = Math.min(100, this.infection + v);
    if (before < 75 && this.infection >= 75) Game.toast('The Weeping spreads in your veins. Seek the Sisters of Saint Ysolde.', 4);
    if (this.infection >= 100) this.startTurning();
  }
  startTurning() {
    this.turning = true; this.turnT = 90;
    Sfx.play('turn');
    Game.showBanner('THE WEEPING TAKES HOLD', 'Find a Sister or drink a Purging Tonic', '#c01818', 4);
    FX.addShake(8);
  }
  // amount: number to subtract, or 'full' for the Sisters' rite
  cure(amount) {
    if (amount === 'full') { this.infection = 0; this.turning = false; return; }
    if (this.turning) { this.turning = false; this.infection = 70; return; }
    this.infection = Math.max(0, this.infection - amount);
  }
  updateInfection(dt, g) {
    if (this.dead) return;
    const beat = this.turning ? 0.55 : this.infection >= 75 ? 1.1 : 0;
    if (beat) {
      this.beatT = (this.beatT || 0) - dt;
      if (this.beatT <= 0) { this.beatT = beat; Sfx.play('heartbeat'); g.pulse = 1; }
    }
    if (this.turning) {
      this.turnT -= dt;
      if (chance(dt * 6)) { const c = this.worldPoint(this.joints.head); FX.blood(c.x, c.y + 4, Math.PI / 2, 0.3, 40, 1, 0.7); }
      if (chance(dt * 0.4)) Sfx.play('whisper');
      if (this.turnT <= 0) g.onPlayerTurned();
    }
  }

  computePose(dt) {
    const s = this.state;
    this.rot = 0;
    if (s === 'attack') {
      const m = this.move, t = this.t;
      if (t < m.windup) this.pose = lerpPose(this.fromPose, m.windP, easeOut(t / m.windup));
      else if (t < m.windup + m.active && m.hits > 1) { // flurry: stab back and forth
        const k = ((t - m.windup) / (m.active / m.hits)) % 1;
        this.pose = lerpPose(m.windP, m.strikeP, k < 0.5 ? easeOut(k * 2) : 1 - easeIn((k - 0.5) * 2));
      }
      else if (t < m.windup + m.active) this.pose = lerpPose(m.windP, m.strikeP, easeOut((t - m.windup) / m.active));
      else this.pose = lerpPose(m.strikeP, basePose(this.idle), easeInOut(clamp((t - m.windup - m.active) / m.recover, 0, 1)));
      return;
    }
    let tgt, k = 1 - Math.exp(-dt * 16);
    switch (s) {
      case 'idle': {
        const b = Math.sin(this.t * 2.2) * 0.03;
        tgt = Object.assign({}, this.idle, { lean: this.idle.lean + b, armF: this.idle.armF + b, weap: this.idle.weap + b * 0.5 });
        break;
      }
      case 'walk': tgt = walkPose(this.idle, this.walkPhase, 0.45, 0.05); break;
      case 'run': tgt = walkPose(Object.assign({}, this.idle, this.weapon.idle ? {} : { armF: 0.9, elbowF: 0.6, weap: 1.75 }), this.walkPhase, 0.75, 0.22); break;
      case 'block': {
        const bp = { lean: -0.06, legF: 0.45, kneeF: 0.45, legB: -0.42, kneeB: 0.25, armF: 1.35, elbowF: 1.25, armB: 1.0, elbowB: 1.3, weap: 2.85, head: 0.05 };
        tgt = Math.abs(this.vx) > 1 ? walkPose(bp, this.walkPhase, 0.25, 0) : bp;
        k = 1 - Math.exp(-dt * 30);
        break;
      }
      case 'roll': {
        const p = clamp(this.t / 0.5, 0, 1);
        this.rot = Math.sin(p * Math.PI) > 0 ? p * Math.PI * 2 : 0;
        tgt = { lean: 0.9, legF: 1.6, kneeF: 2.4, legB: 1.2, kneeB: 2.2, armF: 1.6, elbowF: 1.2, armB: 1.4, elbowB: 1.4, weap: 2.6, head: 0.4 };
        k = 1 - Math.exp(-dt * 40);
        if (p > 0.9) this.rot = 0;
        break;
      }
      case 'hurt': tgt = Object.assign({}, PLAYER_IDLE, { lean: -0.35, head: -0.35, armF: 0.2, elbowF: 0.5, weap: 1.2, legF: 0.4, legB: -0.4 }); break;
      case 'recoil': tgt = Object.assign({}, PLAYER_IDLE, { lean: -0.25, armF: 2.2, elbowF: 0.3, weap: 3.2, legB: -0.5 }); break;
      case 'tonic':
      case 'flask': {
        const drinking = this.t > 0.35 && this.t < 0.85;
        tgt = Object.assign({}, this.idle, { armB: drinking ? 2.4 : 1.2, elbowB: drinking ? 1.9 : 1.3, head: drinking ? -0.35 : 0, lean: drinking ? -0.08 : 0.05 });
        break;
      }
      case 'dead': {
        const p = clamp(this.deathT / 1.1, 0, 1);
        if (p < 0.45) tgt = Object.assign({}, PLAYER_IDLE, { legF: 0.9, kneeF: 2.0, legB: 0.6, kneeB: 2.1, lean: 0.4, armF: 0.1, elbowF: 0.2, weap: 0.3, head: 0.4 });
        else tgt = Object.assign({}, PLAYER_IDLE, { legF: 0.1, kneeF: 0.1, legB: -0.1, kneeB: 0.1, lean: 0, armF: 0.4, elbowF: 0.2, weap: 0.6, head: 0.3 });
        this.rot = p < 0.45 ? 0 : easeIn((p - 0.45) / 0.55) * Math.PI / 2;
        k = 1 - Math.exp(-dt * 6);
        break;
      }
      default: tgt = this.idle;
    }
    blendPose(this.pose, tgt, k);
  }

  draw(ctx, t) {
    const s = this.state;
    // sword trail smear
    if (this.trail.length > 1) {
      ctx.fillStyle = this.blood > 0.3 ? 'rgba(150,40,40,0.28)' : 'rgba(220,220,235,0.22)';
      ctx.beginPath();
      ctx.moveTo(this.trail[0].h.x, this.trail[0].h.y);
      for (const tr of this.trail) ctx.lineTo(tr.t.x, tr.t.y);
      for (let i = this.trail.length - 1; i >= 0; i--) ctx.lineTo(this.trail[i].h.x, this.trail[i].h.y);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 3, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(this.facing, 1);
    if (this.rot) {
      if (s === 'roll') { ctx.translate(0, -24); ctx.rotate(this.rot); ctx.translate(0, 24); }
      else { ctx.translate(-10, -4); ctx.rotate(-this.rot); }
    }
    if (this.hurtFlash > 0) ctx.globalAlpha = 0.7 + Math.sin(this.hurtFlash * 60) * 0.3;
    const wp = this.weapon, blood = this.blood;
    const skin = Skins.style();
    const kst = this.turning ? Object.assign({}, skin, { visor: '#ff2a1a' }) : skin;
    drawHumanoid(ctx, this.joints, this.pose, kst,
      { head: true, armF: true, armB: true, legF: true, legB: true },
      { weapon: c => wp.draw(c, blood), weapon2: wp.draw2 ? (c => wp.draw2(c, blood)) : null, t, sway: clamp(this.vx / 240, -1, 1) * this.facing });
    if (kst.embers) drawEmberCracks(ctx, this.joints, t);
    ctx.globalAlpha = 1;
    if (this.healGlow > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(0, -50, 4, 0, -50, 60);
      gr.addColorStop(0, `rgba(255,200,120,${this.healGlow * 0.35})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gr; ctx.fillRect(-60, -110, 120, 120);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }
}
