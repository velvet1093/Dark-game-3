'use strict';
// ---------------------------------------------------------------------------
// Game controller: states, loop, camera, executions, saving, rendering
// ---------------------------------------------------------------------------
const STEP = 1 / 60;
const SAVE_KEY = 'ashenOath.save.v2'; // v2: the expanded valley (town, Mire, infection)

const Game = {
  state: 'title', time: 0, acc: 0, last: 0,
  player: null, enemies: [], boss: null,
  cam: { x: 0, zoom: 1, ex: W / 2, ey: H / 2, prevX: 0 },
  flags: { notes: {} }, kindled: new Set(), shrine: 0, stain: null,
  arena: null, bossActive: false, exec: null, slow: null, pending: null,
  toasts: [], banner: null, hintsShown: new Set(), zonesShown: new Set(), curZone: 0,
  dialogue: null, note: null, menu: null, narration: null,
  fairies: [], fairyShown: new Set(), fairyCd: {}, viewL: 0, viewR: W,
  titleSel: 0, pauseSel: 0, deathT: 0, fadeAlpha: 0, emberDisplay: 0, interactTarget: null,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    if (window.visualViewport) visualViewport.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => setTimeout(() => this.resize(), 100));
    Input.init(this.canvas);
    Mobile.init(this.canvas);
    Scenery.build();
    Weather.init();
    this.player = new Player();
    this.save = store.get(SAVE_KEY);
    requestAnimationFrame(ts => { this.last = ts; this.loop(ts); });
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vw = window.visualViewport ? visualViewport.width : innerWidth;
    const vh = window.visualViewport ? visualViewport.height : innerHeight;
    const k = Math.min(vw / W, vh / H);
    this.canvas.style.width = `${W * k}px`;
    this.canvas.style.height = `${H * k}px`;
    this.canvas.width = Math.round(W * k * dpr);
    this.canvas.height = Math.round(H * k * dpr);
    this.scale = k * dpr;
  },

  loop(ts) {
    const real = Math.min(0.05, Math.max(0, (ts - this.last) / 1000));
    this.last = ts;
    this.acc += real;
    let n = 0;
    while (this.acc >= STEP && n < 5) { this.step(STEP); this.acc -= STEP; n++; }
    if (n === 5) this.acc = 0;
    this.render(real);
    requestAnimationFrame(t => this.loop(t));
  },

  // ------------------------------------------------------------ states
  step(dt) {
    this.time += dt;
    if (Input.take('mute', 0.1)) Sfx.toggleMute();
    this.updateMusic();
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter(t => t.t < t.life);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.life) this.banner = null; }
    if (this.pulse) this.pulse = Math.max(0, this.pulse - dt * 3);
    if (this.questNote && !this.banner) { this.questNote.t += dt; if (this.questNote.t > this.questNote.life) this.questNote = null; }
    if (this.fadeAlpha > 0) this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 0.8);
    if (this.player) this.emberDisplay += (this.player.embers - this.emberDisplay) * Math.min(1, dt * 6);

    switch (this.state) {
      case 'title': this.updateTitle(); break;
      case 'narration': this.updateNarration(dt); break;
      case 'play': this.updatePlay(dt); break;
      case 'dialogue': this.updateDialogue(dt); break;
      case 'note':
        FX.update(dt);
        if (Input.take('interact') || Input.take('back') || Input.take('confirm')) { this.note = null; this.state = 'play'; Input.clear(); }
        break;
      case 'menu': this.updateMenu(); FX.update(dt); break;
      case 'service': this.updateService(); FX.update(dt); break;
      case 'pause': this.updatePause(); break;
      case 'skins': this.updateSkins(); break;
      case 'fairies': this.updateFairyStyles(); break;
      case 'dead': this.updateDead(dt); break;
      case 'cutscene': this.updateCutscene(dt); break;
    }
  },

  titleOptions() {
    const o = [];
    if (this.save) o.push({ label: 'Continue', fn: () => this.continueGame() });
    o.push({ label: 'New Game', fn: () => this.newGame() });
    o.push({ label: 'Appearance', fn: () => this.openSkins('title') });
    return o;
  },

  updateTitle() {
    const opts = this.titleOptions();
    if (Input.take('up')) { this.titleSel = (this.titleSel + opts.length - 1) % opts.length; Sfx.play('ui'); }
    if (Input.take('down')) { this.titleSel = (this.titleSel + 1) % opts.length; Sfx.play('ui'); }
    this.titleSel = clamp(this.titleSel, 0, opts.length - 1);
    const tap = Mobile.takeTap();
    if (tap) {
      const i = Math.round((tap.y - 293) / 38);
      if (i >= 0 && i < opts.length && Math.abs(tap.x - (W / 2 + 120)) < 170) this.titleSel = i;
    }
    if (Input.take('confirm')) { Sfx.play('confirm'); Input.clear(); opts[this.titleSel].fn(); }
  },

  newGame() {
    store.del(SAVE_KEY); this.save = null;
    this.player = new Player();
    this.flags = { notes: {} }; this.kindled = new Set([0]); this.shrine = 0; this.stain = null;
    Quests.ensure(this.flags);
    this.hintsShown = new Set(); this.zonesShown = new Set(); this.fairyShown = new Set(); this.fairyCd = {};
    FX.clearDecals();
    Sfx.startAmbience();
    this.startNarration(STORY.intro, () => {
      this.setupRun(0);
      this.state = 'play';
      this.saveGame();
    });
  },

  continueGame() {
    const s = this.save;
    this.player = new Player();
    const p = this.player;
    p.stats = Object.assign({ vig: 1, end: 1, str: 1 }, s.stats); p.level = s.level || 1;
    p.embers = s.embers || 0; p.maxFlasks = s.maxFlasks || 3;
    p.owned = (s.owned || ['longsword']).filter(id => WEAPONS[id]); if (!p.owned.length) p.owned = ['longsword'];
    p.weaponLevels = s.weaponLevels || { longsword: s.weaponLevel || 0 };
    p.weaponId = p.owned.includes(s.weaponId) ? s.weaponId : 'longsword';
    p.infection = s.infection || 0; p.turning = !!s.turning; p.turnT = s.turnT || 90;
    p.tonics = s.tonics !== undefined ? s.tonics : 1; p.maxTonics = s.maxTonics || 3;
    this.flags = Object.assign({ notes: {} }, s.flags || {});
    Quests.ensure(this.flags);
    this.kindled = new Set(s.kindled || [0]); this.shrine = s.shrine || 0; this.stain = s.stain || null;
    this.hintsShown = new Set(LEVEL.hints.map((h, i) => i)); this.zonesShown = new Set(); this.fairyShown = new Set(); this.fairyCd = {};
    FX.clearDecals();
    Sfx.startAmbience();
    this.setupRun(this.shrine);
    this.state = 'play';
  },

  saveGame() {
    const p = this.player;
    this.save = {
      v: 1, shrine: this.shrine, kindled: [...this.kindled], stats: p.stats, level: p.level,
      embers: p.embers, maxFlasks: p.maxFlasks, flags: this.flags, stain: this.stain,
      owned: p.owned, weaponId: p.weaponId, weaponLevels: p.weaponLevels, infection: p.infection, turning: p.turning, turnT: p.turnT, tonics: p.tonics, maxTonics: p.maxTonics,
    };
    store.set(SAVE_KEY, this.save);
  },

  setupRun(shrineId) {
    const sh = LEVEL.shrines[shrineId];
    this.player.reset(sh.x + 44);
    this.spawnEnemies();
    FX.reset();
    this.exec = null; this.slow = null; this.pending = null; this.arena = null; this.bossActive = false;
    this.dialogue = null; this.note = null; this.menu = null;
    this.cam.x = clamp(this.player.x - W / 2, 0, LEVEL.width - W); this.cam.prevX = this.cam.x;
    this.cam.zoom = 1;
    this.curZone = zoneIndex(this.player.x);
    this.zonesShown.add(this.curZone);
    this.fadeAlpha = 1;
    this.emberDisplay = this.player.embers;
    this.spawnFairies();
    this.allies = LEVEL.allies.map(a => new Ally(a.id, a, this.flags.dead[a.id]));
    Input.clear();
  },

  spawnFairies() {
    const npc = id => LEVEL.npcs.find(n => n.id === id);
    const lumi = new Fairy('lumi', 'Lumi', this.flags.lumi ? null : npc('osric'));
    if (this.flags.lumi) { lumi.x = this.player.x - 30; lumi.y = GROUND - 110; }
    this.fairies = [lumi, new Fairy('pip', 'Pip', npc('wren'))];
  },

  joinLumi() {
    const lumi = this.fairies.find(f => f.id === 'lumi');
    this.flags.lumi = true;
    if (lumi) { lumi.mode = 'follow'; lumi.home = null; lumi.say('Lead on, Sir Knight! I can\'t wait to see how it ends.', 3.5, true); }
    Sfx.play('fairyJoin');
    this.toast('Lumi follows you now. She wants to be there when you die.', 4);
  },

  updateFairies(dt) { for (const f of this.fairies) f.update(dt, this); },

  fairyHints() {
    const lumi = this.fairies.find(f => f.mode === 'follow'), p = this.player;
    if (!lumi || p.dead || this.state !== 'play') return;
    if (lumi.bubble || lumi.hintCd > 0 || this.banner) return;
    const hint = (key, repeat) => {
      if (!repeat && this.fairyShown.has(key)) return false;
      if (repeat && (this.fairyCd[key] || 0) > this.time) return false;
      this.fairyShown.add(key); if (repeat) this.fairyCd[key] = this.time + repeat;
      lumi.say(FAIRY_HINTS[key]()); lumi.hintCd = 6; return true;
    };
    const near = (x, r) => Math.abs(p.x - x) < r;
    if (!p.busy && this.findExecutable() && hint('exec')) return;
    if (p.hp < p.maxHp * 0.3 && (p.flasks > 0 ? hint('lowhp', 25) : hint('novial'))) return;
    if (this.allies && this.allies.some(a => !a.dead && near(a.x, 640) && (a.state === 'cower' || a.state === 'engage' || a.state === 'hurt')) && hint('help', 30)) return;
    if (this.respawnHint && this.stain) { this.respawnHint = false; this.fairyShown.delete('respawn'); if (hint('respawn')) return; }
    if (LEVEL.shrines.some(s => !this.kindled.has(s.id) && near(s.x, 170)) && hint('shrine')) return;
    if (this.allNotes().some(n => !this.flags.notes[n.id] && near(n.x, 130)) && hint('note')) return;
    if (this.enemies.some(e => !e.dead && e.crippled && near(e.x, 260)) && hint('cripple')) return;
    if (this.enemies.some(e => !e.dead && e.hasShield && e.state === 'chase' && near(e.x, 200)) && hint('shield')) return;
    if (p.turning && hint('turning', 20)) return;
    if (p.infection >= 50 && !p.turning && hint('infect')) return;
    const zk = zoneKind(p.x);
    if (zk !== 'road' && hint('zone_' + zk)) return;
    if (!this.flags.bossDead && near(LEVEL.bossGate, 230) && hint('gate')) return;
    if (this.flags.bossDead && hint('bossdead')) return;
  },

  updateMusic() {
    const s = this.state;
    let m = null;
    if (s === 'title' || ((s === 'skins' || s === 'fairies') && this.skinReturn === 'title')) m = 'title';
    else if (s === 'narration') m = this.narration && this.narration.lines === STORY.ending ? 'requiem' : 'title';
    else if (s === 'menu') m = 'shrine';
    else if (s === 'dead' || s === 'cutscene') m = null;
    else if (this.player) {
      const p = this.player, z = zoneIndex(p.x);
      if (this.bossActive && this.boss && !this.boss.dead && !(s === 'dialogue' && this.boss.state === 'standing')) m = 'boss';
      else if (this.flags.bossDead && z === 2) m = 'requiem';
      else if (p.x > LEVEL.chapel[0] - 60 && p.x < LEVEL.chapel[1] + 40) m = 'chapel';
      else if (LEVEL.shrines.some(sh => this.kindled.has(sh.id) && Math.abs(p.x - sh.x) < 150)) m = 'shrine';
      else m = ZONES[z].kind;
    }
    Music.play(m);
    Music.setIntensity(this.boss && this.boss.phase2 ? 1 : 0);
    const wz = this.player && s !== 'title' ? ZONES[zoneIndex(this.player.x)].weather : 'rain';
    Sfx.setRain(wz === 'rain' && s !== 'narration' ? 1 : 0);
  },

  spawnEnemies() {
    this.enemies = LEVEL.enemies.map(s => new Enemy(s.type, s));
    this.boss = null;
    if (!this.flags.bossDead) {
      this.boss = new Enemy('headsman', { x: LEVEL.bossX, facing: -1 });
      this.enemies.push(this.boss);
    }
  },

  allNotes() {
    const n = LEVEL.notes.slice();
    if (this.flags.confession) n.push({ id: 'confession', x: this.flags.confessionX || LEVEL.bossX });
    return n;
  },

  toast(text, life = 4) {
    if (this.toasts.some(t => t.text === text)) return;
    this.toasts.push({ text, t: 0, life });
    if (this.toasts.length > 3) this.toasts.shift();
  },
  showBanner(text, sub, col, life = 4.5) { this.banner = { text, sub, col, t: 0, life }; },

  bounds() {
    if (this.arena) return [this.arena[0] + 16, this.arena[1]];
    return [20, this.flags.bossDead ? LEVEL.doorX + 40 : LEVEL.arenaEnd];
  },
  enemyBounds(e) {
    if (e.boss) return [LEVEL.bossGate + 30, LEVEL.arenaEnd - 10];
    // the town walls keep the infected out
    if (e.spawn.x < LEVEL.townSafe[0]) return [20, LEVEL.townSafe[0] - 20];
    return [LEVEL.townSafe[1] + 20, LEVEL.bossGate - 30];
  },

  // ------------------------------------------------------------ play
  updatePlay(dt) {
    const p = this.player;
    if (Input.take('pause', 0.1)) { this.state = 'pause'; this.pauseSel = 0; return; }
    if (this.pending) {
      this.pending.t -= dt;
      if (this.pending.t <= 0) { const f = this.pending.fn; this.pending = null; f(); if (this.state !== 'play') return; }
    }
    if (FX.hitstop > 0) { FX.hitstop -= dt; this.updateCamera(dt); return; }
    let wdt = dt;
    if (this.slow) { this.slow.t -= dt; wdt *= this.slow.scale; if (this.slow.t <= 0) this.slow = null; }

    if (this.exec) this.updateExecution(wdt);

    this.interactTarget = null;
    if (!p.busy && !this.exec) {
      const it = this.nearestInteract();
      this.interactTarget = it;
      if (it && Input.take('interact')) { this.interact(it); return; }
    }

    p.update(wdt, this);
    for (const e of this.enemies) e.update(wdt, this);
    for (const a of this.allies) a.update(wdt, this);
    this.separateEnemies();
    this.updateFairies(wdt);
    this.fairyHints();
    FX.update(wdt);
    this.updateWorldFx(wdt);
    this.updateCamera(wdt);
    this.checkProgress();

    if (p.dead) { this.state = 'dead'; this.deathT = 0; this.onPlayerDeath(); }
  },

  checkProgress() {
    const p = this.player;
    // lost embers
    if (this.stain && Math.abs(p.x - this.stain.x) < 26 && !p.dead) {
      p.embers += this.stain.amount;
      FX.text(p.x, GROUND - 120, `+${this.stain.amount} recovered`, '#ffcf7a', 15, 2);
      for (let i = 0; i < 16; i++) FX.soul(this.stain.x + rand(-10, 10), GROUND - 10, () => p.x, () => GROUND - 50);
      Sfx.play('ember');
      this.stain = null; this.saveGame();
    }
    // zones
    const z = zoneIndex(p.x);
    this.flags['reached_' + ZONES[z].kind] = true;
    Quests.syncMain();
    if (z !== this.curZone) {
      this.curZone = z;
      if (!this.zonesShown.has(z)) { this.zonesShown.add(z); this.showBanner(ZONES[z].name, ZONES[z].num); }
    }
    // tutorial hints
    LEVEL.hints.forEach((h, i) => {
      if (!this.hintsShown.has(i) && p.x > h.x) { this.hintsShown.add(i); this.toast(Mobile.enabled && h.touch ? h.touch : h.text, 7); }
    });
    // boss arena
    if (!this.flags.bossDead && !this.bossActive && p.x > LEVEL.bossGate + 14 && this.boss) this.startBossIntro();
  },

  separateEnemies() {
    const E = this.enemies;
    for (let i = 0; i < E.length; i++) {
      const a = E[i]; if (a.dead || a.state === 'executed') continue;
      for (let j = i + 1; j < E.length; j++) {
        const b = E[j]; if (b.dead || b.state === 'executed') continue;
        const d = b.x - a.x, min = 26 * (a.s + b.s) / 2;
        if (Math.abs(d) < min) {
          const push = (min - Math.abs(d)) / 2 * (d >= 0 ? 1 : -1);
          a.x -= push; b.x += push;
        }
      }
    }
  },

  updateWorldFx(dt) {
    const l = this.cam.x - 100, r = this.cam.x + W + 100;
    for (const pr of LEVEL.props) {
      if (pr.x < l - 200 || pr.x > r + 200) continue;
      if (pr.type === 'house' && pr.burning) {
        const w = pr.w;
        if (chance(dt * 30)) FX.fire(pr.x - w / 2 + 35 + (chance(0.5) ? 0 : w - 70), GROUND - 190 * 0.4 + 6);
        if (chance(dt * 26)) FX.fire(pr.x + rand(-w / 2, w / 2), GROUND - 200 - rand(0, 40));
        if (chance(dt * 6)) FX.smoke(pr.x + rand(-w / 3, w / 3), GROUND - 240);
        if (chance(dt * 5)) FX.ember(pr.x + rand(-w / 2, w / 2), GROUND - 220);
        if (Math.abs(pr.x - this.player.x) < 320 && chance(dt * 9)) Sfx.play('crackle');
      }
      if (pr.type === 'brazier' && chance(dt * 40)) FX.fire(pr.x, GROUND - 70);
    }
  },

  updateCamera(dt) {
    const p = this.player;
    let target = p.x - W / 2 + p.facing * 70;
    if (this.state === 'cutscene' && this.boss) target = (p.x + this.boss.x) / 2 - W / 2;
    if (this.arena) target = clamp(target, this.arena[0] - 60, this.arena[1] + 140 - W);
    target = clamp(target, 0, LEVEL.width - W);
    this.cam.prevX = this.cam.x;
    this.cam.x += (target - this.cam.x) * (1 - Math.exp(-dt * 4.5));
    const ez = this.exec ? 1.4 : 1;
    this.cam.zoom += (ez - this.cam.zoom) * (1 - Math.exp(-dt * (this.exec ? 6 : 3)));
    if (this.exec) {
      this.cam.ex = (p.x + this.exec.e.x) / 2;
      this.cam.ey = GROUND - 80;
    }
  },

  // ------------------------------------------------------------ interaction
  // a weapon found in the world, a quest reward, or bought
  giveWeapon(id) {
    const p = this.player;
    if (!p.giveWeapon(id)) return;
    this.flags['took_' + id] = true;
    this.showBanner('WEAPON ACQUIRED', WEAPONS[id].name + ' · ' + WEAPONS[id].kind, '#d8c08a', 3.5);
    this.toast(Mobile.enabled ? 'Tap ⇄ to switch weapons.' : 'Press X to switch weapons.', 4);
    Sfx.play('anvil');
    this.saveGame();
  },

  nearestInteract() {
    const p = this.player;
    for (const w of LEVEL.weaponPickups) if (!p.owned.includes(w.id) && !this.flags['took_' + w.id] && Math.abs(p.x - w.x) < 44) return { kind: 'weapon', obj: w, x: w.x, y: GROUND - 110, label: 'Take ' + WEAPONS[w.id].name };
    for (const s of LEVEL.shrines) if (Math.abs(p.x - s.x) < 46) return { kind: 'shrine', obj: s, x: s.x, y: GROUND - 132, label: this.kindled.has(s.id) ? 'Rest' : 'Kindle the lantern' };
    for (const a of this.allies) if (Math.abs(p.x - a.x) < 60) return { kind: 'ally', obj: a, x: a.x, y: GROUND - 140, label: a.dead ? 'Examine' : 'Speak' };
    for (const n of LEVEL.npcs) if (Math.abs(p.x - n.x) < 70) return { kind: 'npc', obj: n, x: n.x, y: GROUND - 120, label: 'Speak' };
    for (const n of this.allNotes()) if (Math.abs(p.x - n.x) < 36) return { kind: 'note', obj: n, x: n.x, y: GROUND - 50, label: 'Read' };
    if (this.flags.bossDead && Math.abs(p.x - (LEVEL.doorX + 20)) < 70) return { kind: 'door', x: LEVEL.doorX + 20, y: GROUND - 240, label: 'Descend into the crypt' };
    return null;
  },

  interact(it) {
    const p = this.player;
    p.vx = 0; p.state = 'idle';
    if (it.kind === 'shrine') this.restAt(it.obj);
    else if (it.kind === 'ally') {
      const a = it.obj;
      if (a.dead) { this.toast(`${a.name} lies still in the mud. You were too late.`, 4); return; }
      p.facing = Math.sign(a.x - p.x) || 1; a.facing = -p.facing;
      const r = allyTalk(a);
      this.startDialogue(r.lines, () => { if (r.after) r.after(); this.saveGame(); });
    } else if (it.kind === 'npc') {
      p.facing = Math.sign(it.obj.x - p.x) || 1;
      const id = it.obj.id;
      if (!this.flags[id]) this.startDialogue(STORY[id], () => { this.flags[id] = true; if (id === 'osric') this.joinLumi(); this.saveGame(); });
      else this.startDialogue(STORY[id + 'Repeat']);
    } else if (it.kind === 'note') {
      this.note = STORY.notes[it.obj.id];
      this.flags.notes[it.obj.id] = true;
      Quests.onNote(it.obj.id);
      this.state = 'note'; Sfx.play('page'); Input.clear();
    } else if (it.kind === 'weapon') {
      this.giveWeapon(it.obj.id);
    } else if (it.kind === 'door') {
      Sfx.play('door'); Sfx.play('bell');
      Music.play('requiem');
      this.flags.ended = true; Quests.syncMain(); this.saveGame();
      this.startNarration(STORY.ending, () => { this.state = 'title'; this.titleSel = 0; this.save = store.get(SAVE_KEY); });
    }
  },

  restAt(s) {
    const p = this.player;
    if (!this.kindled.has(s.id)) {
      this.kindled.add(s.id);
      this.showBanner('LANTERN KINDLED', '', '#e8b860', 3);
      Sfx.play('kindle');
    }
    Sfx.play('shrine');
    this.shrine = s.id;
    p.hp = p.maxHp; p.st = p.maxSt; p.flasks = p.maxFlasks;
    this.spawnEnemies();
    this.bossActive = false; this.arena = null;
    this.menu = { shrine: s, sel: 0 };
    this.state = 'menu';
    this.saveGame();
    Input.clear();
  },

  levelCost() { const l = this.player.level; return Math.round(90 + l * l * 7 + l * 35); },

  shrineOptions() {
    const p = this.player, c = this.levelCost(), can = p.embers >= c;
    return [
      { label: 'Vigor  (health)', value: p.stats.vig, stat: 'vig', disabled: !can },
      { label: 'Endurance  (stamina)', value: p.stats.end, stat: 'end', disabled: !can },
      { label: 'Strength  (damage)', value: p.stats.str, stat: 'str', disabled: !can },
      { label: 'Leave the shrine' },
    ];
  },

  updateMenu() {
    const opts = this.shrineOptions(), m = this.menu;
    if (Input.take('up')) { m.sel = (m.sel + opts.length - 1) % opts.length; Sfx.play('ui'); }
    if (Input.take('down')) { m.sel = (m.sel + 1) % opts.length; Sfx.play('ui'); }
    const leave = () => { this.menu = null; this.state = 'play'; Input.clear(); };
    const tap = Mobile.takeTap();
    if (tap) {
      const i = Math.round((tap.y - (H - 300) / 2 - 122) / 34);
      const inRow = i >= 0 && i < opts.length && tap.x > 80 && tap.x < 440;
      if (!inRow || i !== m.sel) { if (inRow) { m.sel = i; Sfx.play('ui'); } Input.clear(); return; }
    }
    if (Input.take('back')) { leave(); return; }
    if (Input.take('confirm')) {
      const o = opts[m.sel];
      if (!o.stat) { leave(); return; }
      if (o.disabled) { Sfx.play('ui'); return; }
      const p = this.player;
      p.embers -= this.levelCost();
      p.stats[o.stat]++; p.level++;
      p.recalc(); p.hp = p.maxHp; p.st = p.maxSt;
      Sfx.play('confirm');
      this.saveGame();
    }
  },

  openSkins(ret) {
    this.skinReturn = ret; this.skinSel = Math.max(0, SKIN_ORDER.indexOf(Skins.id));
    this.state = 'skins'; Sfx.play('page'); Input.clear();
  },
  updateSkins() {
    if (Input.take('flask')) { this.openFairyStyles(); return; }
    const n = SKIN_ORDER.length;
    if (Input.take('up')) { this.skinSel = (this.skinSel + n - 1) % n; Sfx.play('ui'); }
    if (Input.take('down')) { this.skinSel = (this.skinSel + 1) % n; Sfx.play('ui'); }
    const back = () => { this.state = this.skinReturn; Input.clear(); };
    const tap = Mobile.takeTap();
    if (tap) {
      if (tap.x >= 76 && tap.x <= 406 && tap.y >= 375 && tap.y <= 415) { this.openFairyStyles(); return; }
      const i = Math.round((tap.y - 113) / 40);
      if (i >= 0 && i < n && tap.x > 60 && tap.x < 430) { this.skinSel = i; Skins.set(SKIN_ORDER[i]); Sfx.play('confirm'); }
      Input.clear(); return;
    }
    if (Input.take('back') || Input.take('pause', 0.1)) { back(); return; }
    if (Input.take('confirm')) { Skins.set(SKIN_ORDER[this.skinSel]); Sfx.play('confirm'); }
  },

  openFairyStyles() {
    this.fairyWho = 'lumi'; this.fairySel = FAIRY_ORDER.indexOf(FairyStyles.choices.lumi);
    this.state = 'fairies'; Input.clear(); Sfx.play('page');
  },
  updateFairyStyles() {
    const chooseWho = who => {
      const page = Math.floor(this.fairySel / 4), saved = FAIRY_ORDER.indexOf(FairyStyles.choices[who]);
      this.fairyWho = who; this.fairySel = Math.floor(saved / 4) === page ? saved : page * 4; Sfx.play('ui');
    };
    if (Input.take('back') || Input.take('pause', 0.1)) { this.state = 'skins'; Input.clear(); return; }
    if (Input.take('flask') || Input.take('up') || Input.take('down')) chooseWho(this.fairyWho === 'lumi' ? 'pip' : 'lumi');
    if (Input.take('execute')) { this.fairySel = (this.fairySel + 4) % FAIRY_ORDER.length; Sfx.play('page'); }
    if (Input.take('left')) this.fairySel = (this.fairySel + FAIRY_ORDER.length - 1) % FAIRY_ORDER.length;
    if (Input.take('right')) this.fairySel = (this.fairySel + 1) % FAIRY_ORDER.length;
    const pageStart = Math.floor(this.fairySel / 4) * 4;
    const equip = () => { FairyStyles.set(this.fairyWho, FAIRY_ORDER[this.fairySel]); Sfx.play('confirm'); };
    const tap = Mobile.takeTap();
    if (tap) {
      if (tap.x < 155 && tap.y < 75) { this.state = 'skins'; Input.clear(); return; }
      if (tap.y >= 474 && tap.y <= 494) {
        this.fairySel = (pageStart + 4) % FAIRY_ORDER.length; Input.clear(); Sfx.play('page'); return;
      }
      if (tap.y >= 88 && tap.y <= 124) {
        if (tap.x >= 330 && tap.x <= 470) chooseWho('lumi');
        else if (tap.x >= 490 && tap.x <= 630) chooseWho('pip');
      } else if (tap.y >= 140 && tap.y <= 468) {
        const i = Math.floor((tap.x - 30) / 225);
        if (i >= 0 && i < 4 && tap.x <= 30 + i * 225 + 210) { this.fairySel = pageStart + i; equip(); }
      }
      Input.clear(); return;
    }
    if (Input.take('confirm')) equip();
  },

  updatePause() {
    if (this.pauseView === 'journal') {
      Mobile.takeTap();
      if (Input.take('confirm') || Input.take('back') || Input.take('pause', 0.1)) { this.pauseView = null; Sfx.play('ui'); }
      return;
    }
    if (Input.take('up')) { this.pauseSel = (this.pauseSel + 3) % 4; Sfx.play('ui'); }
    if (Input.take('down')) { this.pauseSel = (this.pauseSel + 1) % 4; Sfx.play('ui'); }
    if (Input.take('pause', 0.1)) { this.state = 'play'; Input.clear(); return; }
    const tap = Mobile.takeTap();
    if (tap) {
      const i = Math.round((tap.y - 134) / 30);
      if (i >= 0 && i < 4 && Math.abs(tap.x - W / 2) < 140) this.pauseSel = i;
      else { Input.clear(); return; }
    }
    if (Input.take('confirm')) {
      if (this.pauseSel === 0) { this.state = 'play'; Input.clear(); }
      else if (this.pauseSel === 2) { this.openSkins('pause'); }
      else if (this.pauseSel === 1) { this.pauseView = 'journal'; Sfx.play('page'); }
      else { this.saveGame(); this.state = 'title'; this.titleSel = 0; Input.clear(); }
    }
  },

  // ------------------------------------------------------------ dialogue / narration
  startDialogue(lines, onDone) {
    this.dialogue = { lines, i: 0, chars: 0, onDone };
    this.applyLineReward(lines[0]);
    this.state = 'dialogue'; Input.clear();
  },

  applyLineReward(line) {
    if (!line.reward || line.given) return;
    const p = this.player;
    if (line.reward === 'flask' && !this.flags.osricFlask) { this.flags.osricFlask = true; p.maxFlasks++; p.flasks++; Sfx.play('flask'); }
    if (line.reward === 'embers' && !this.flags.wrenCoins) { this.flags.wrenCoins = true; p.embers += 200; Sfx.play('ember'); }
  },

  updateDialogue(dt) {
    const d = this.dialogue;
    const line = d.lines[d.i];
    d.chars = Math.min(line.text.length, d.chars + dt * 55);
    FX.update(dt);
    if (this.boss && this.bossActive) this.boss.update(dt, this);
    this.updateFairies(dt);
    this.updateCamera(dt);
    if (Input.take('confirm') || Input.take('interact')) {
      if (d.chars < line.text.length) d.chars = line.text.length;
      else {
        d.i++; d.chars = 0; Sfx.play('ui');
        if (d.i >= d.lines.length) {
          this.dialogue = null; this.state = 'play'; Input.clear();
          if (d.onDone) d.onDone();
        } else this.applyLineReward(d.lines[d.i]);
      }
    }
  },

  startNarration(lines, onDone) {
    this.narration = { lines, i: 0, t: 0, out: false, outT: 0, onDone };
    this.state = 'narration'; Input.clear();
  },

  updateNarration(dt) {
    const n = this.narration;
    n.t += dt;
    if (Input.take('back')) { this.narration = null; n.onDone(); return; }
    if (!n.out && n.t > 0.6 && Input.take('confirm')) { n.out = true; n.outT = 0; }
    if (n.out) {
      n.outT += dt;
      if (n.outT >= 0.6) {
        n.i++; n.t = 0; n.out = false;
        if (n.i >= n.lines.length) { this.narration = null; n.onDone(); }
      }
    }
  },

  // ------------------------------------------------------------ boss
  startBossIntro() {
    const b = this.boss;
    this.bossActive = true;
    this.arena = [LEVEL.bossGate, LEVEL.arenaEnd];
    this.state = 'cutscene'; this.cutT = 0;
    this.player.vx = 0; this.player.state = 'idle';
    b.state = 'dormant';
    Sfx.play('bell');
    Input.clear();
  },

  updateCutscene(dt) {
    this.cutT += dt;
    const b = this.boss, p = this.player;
    p.computePose(dt); p.joints = solveRig(p.pose);
    if (this.cutT > 1.2 && b.state === 'dormant') { b.state = 'standing'; }
    b.update(dt, this);
    this.updateFairies(dt);
    FX.update(dt);
    this.updateWorldFx(dt);
    this.updateCamera(dt);
    if (this.cutT > 2.4) {
      const lines = this.flags.bossIntroSeen ? STORY.bossIntroShort : STORY.bossIntro;
      this.startDialogue(lines, () => {
        this.flags.bossIntroSeen = true;
        b.state = 'roar'; b.st = 0; Sfx.play('roar');
        this.showBanner(b.def.name.split(',')[0].toUpperCase(), 'The Penitent Headsman', '#c8a070', 3.5);
      });
    }
  },

  onBossDefeated(b) {
    Sfx.play('roar');
    FX.addShake(8);
    this.pending = {
      t: 1.4, fn: () => this.startDialogue(STORY.bossDeath, () => {
        b.die(this, { dir: -b.facing });
      }),
    };
  },

  onBossDead(o) {
    this.flags.bossDead = true;
    if (o && o.execution) { this.flags.confession = true; this.flags.confessionX = clamp(this.boss.x, LEVEL.bossGate + 80, LEVEL.arenaEnd - 80); }
    this.bossActive = false; this.arena = null;
    this.showBanner('HEADSMAN FELLED', '', '#b82a1c', 5);
    Sfx.play('bell');
    this.pending = { t: 4, fn: () => this.toast('The doors of Saint Varn stand open.', 5) };
    this.saveGame();
  },

  // enemies hunt whoever is nearest: the knight, or a survivor once the knight is close enough to see it
  enemyTarget(e) {
    const p = this.player;
    if (e.boss || !this.allies) return p;
    let best = p.dead ? null : p, bd = best ? Math.abs(p.x - e.x) : 1e9;
    for (const a of this.allies) {
      if (a.dead || Math.abs(p.x - a.x) > 640) continue;
      const d = Math.abs(a.x - e.x);
      if (d < bd - 24 && d < e.def.aggro) { best = a; bd = d; }
    }
    return best || p;
  },

  onAllyDeath(a, how) {
    this.flags.dead[a.id] = how === 'head' ? 'head' : true;
    const s = this.flags.quests[a.def.quest];
    if (!s || s.status === 'active') Quests.fail(a.def.quest, `${a.name} was slain`);
    this.toast(`${a.name} has been slain.`, 4);
    const lumi = this.fairies.find(f => f.mode === 'follow');
    if (lumi) { lumi.say(pick(['Oh! Did you see that? Did you SEE that?', `${a.name} made such a sound.`, 'We were too late. What a pity. Again?']), 4); Sfx.play('giggle'); }
    this.saveGame();
  },

  onEnemyKilled(e, o) {
    Quests.onKill(e);
    const p = this.player;
    let amt = e.def.embers;
    if (o.execution) amt = Math.round(amt * 1.25);
    p.embers += amt;
    const c = e.worldPoint(e.joints.chest);
    FX.text(c.x, c.y - 40, `+${amt}`, '#ffcf7a', 14);
    for (let i = 0; i < Math.min(14, 3 + amt / 10); i++) FX.soul(c.x, c.y, () => p.x, () => GROUND - 55);
    setTimeout(() => Sfx.play('ember'), 500);
    if (e.boss) this.onBossDead(o);
  },

  // ------------------------------------------------------------ death
  // the Weeping finishes what the wounds began
  onPlayerTurned() {
    const p = this.player;
    if (p.dead) return;
    this.turned = true;
    p.turning = false;
    p.embers = 0; // a turned knight keeps nothing
    p.hp = 0; p.state = 'dead'; p.t = 0; p.deathT = 0; p.vx = 0;
    const c = p.worldPoint(p.joints.head);
    FX.blood(c.x, c.y, -Math.PI / 2, 1.4, 320, 50, 1.2);
    Sfx.play('turn');
    this.exec = null; this.slow = null;
    this.state = 'dead'; this.deathT = 0;
    this.saveGame();
  },

  // ------------------------------------------------------------ services (Sisters, smith)
  openService(kind, ally) {
    this.service = { kind, ally, sel: 0 };
    this.state = 'service'; Input.clear();
  },
  serviceInfo() {
    const p = this.player, k = this.service.kind;
    if (k === 'purify') {
      const need = p.infection > 0 || p.turning;
      return {
        title: 'The Rite of Saint Ysolde', sub: this.service.ally.name + ' draws the Weeping out with blessed water and prayer.',
        opts: [
          { label: 'Receive the Rite', value: p.turning ? 'TURNING' : `${Math.round(p.infection)}%`, disabled: !need, fn: () => {
            p.cure('full'); p.hp = p.maxHp; Sfx.play('purify'); FX.addShake(2);
            for (let i = 0; i < 24; i++) FX.add({ k: 'fy', x: p.x + rand(-20, 20), y: GROUND - rand(0, 110), vx: rand(-15, 15), vy: rand(-50, -10), t: 0, life: rand(0.8, 1.6), ph: rand(0, 6) });
            this.toast('The Weeping leaves you. For now.', 3); this.saveGame();
          } },
          { label: 'Leave' },
        ],
      };
    }
    if (k === 'tonics') {
      const cost = 120;
      return {
        title: 'Purging Tonics', sub: 'Each tonic pushes the infection back, and halts a turning for a time.',
        opts: [
          { label: 'Buy a Purging Tonic', value: `${cost} embers   (${p.tonics}/${p.maxTonics})`, disabled: p.embers < cost || p.tonics >= p.maxTonics, fn: () => {
            p.embers -= cost; p.tonics++; Sfx.play('coin'); this.saveGame();
          } },
          { label: 'Leave' },
        ],
      };
    }
    if (k === 'smith') {
      const lvl = p.weaponLevel, cost = Math.round(250 * Math.pow(lvl + 1, 1.6));
      return {
        title: 'Garrick\'s Forge', sub: 'Each honing adds a tenth to every blow of the weapon in your hand: ' + p.weapon.name + '. Switch weapons (X) to hone another.',
        opts: [
          { label: lvl >= 5 ? `${p.weapon.name} is honed to perfection` : `Hone ${p.weapon.name} to +${lvl + 1}`, value: lvl >= 5 ? '' : `${cost} embers`, disabled: lvl >= 5 || p.embers < cost, fn: () => {
            p.embers -= cost; p.weaponLevel++; p.recalc(); Sfx.play('anvil'); this.toast(`${p.weapon.name} +${p.weaponLevel}`, 2); this.saveGame();
          } },
          ...(p.owned.includes('spear') ? [] : [{ label: 'Buy a Watchman\'s Pike', value: '600 embers', disabled: p.embers < 600, fn: () => {
            p.embers -= 600; this.giveWeapon('spear'); Sfx.play('coin');
          } }]),
          { label: 'Leave' },
        ],
      };
    }
    return { title: '', sub: '', opts: [{ label: 'Leave' }] };
  },
  updateService() {
    const sv = this.service, info = this.serviceInfo(), opts = info.opts;
    if (Input.take('up')) { sv.sel = (sv.sel + opts.length - 1) % opts.length; Sfx.play('ui'); }
    if (Input.take('down')) { sv.sel = (sv.sel + 1) % opts.length; Sfx.play('ui'); }
    const leave = () => { this.service = null; this.state = 'play'; Input.clear(); };
    const tap = Mobile.takeTap();
    if (tap) {
      const i = Math.round((tap.y - (H - 240) / 2 - 116) / 36);
      const inRow = i >= 0 && i < opts.length && tap.x > W / 2 - 220 && tap.x < W / 2 + 220;
      if (!inRow || i !== sv.sel) { if (inRow) { sv.sel = i; Sfx.play('ui'); } Input.clear(); return; }
    }
    if (Input.take('back') || Input.take('pause', 0.1)) { leave(); return; }
    if (Input.take('confirm')) {
      const o = opts[sv.sel];
      if (!o.fn) { leave(); return; }
      if (o.disabled) { Sfx.play('ui'); return; }
      o.fn();
    }
  },

  onPlayerDeath() {
    const p = this.player;
    if (this.turned) { this.saveGame(); return; }
    this.stain = p.embers > 0 ? { x: p.x, amount: p.embers } : null;
    p.embers = 0;
    this.exec = null; this.slow = null;
    this.saveGame();
  },

  updateDead(dt) {
    this.deathT += dt;
    this.player.update(dt, this);
    for (const e of this.enemies) e.update(dt, this);
    for (const a of this.allies) a.update(dt, this);
    this.updateFairies(dt);
    FX.update(dt);
    this.updateWorldFx(dt);
    this.updateCamera(dt);
    if (this.deathT > 3 && (Input.take('confirm') || Input.take('interact'))) {
      const p = this.player;
      if (this.turned) { p.infection = 50; p.turning = false; this.turned = false; }
      else if (p.turning) { p.turning = false; p.infection = 90; }
      this.setupRun(this.shrine);
      this.state = 'play';
      this.respawnHint = true;
      this.saveGame();
    }
  },

  // ------------------------------------------------------------ executions
  findExecutable() {
    const p = this.player;
    let best = null, bd = 1e9;
    for (const e of this.enemies) {
      if (!e.executable) continue;
      const dx = e.x - p.x, ad = Math.abs(dx);
      const reach = e.crippled ? 84 : 64 + e.s * 16;
      if (ad > reach) continue;
      if (Math.sign(dx) !== p.facing && ad > 34 && !e.crippled) continue;
      if (ad < bd) { bd = ad; best = e; }
    }
    return best;
  },

  startExecution(e) {
    const p = this.player;
    const dir = Math.sign(e.x - p.x) || p.facing;
    p.facing = dir;
    const type = e.crippled ? 'downstab' : e.boss ? (e.hp <= e.maxHp * 0.25 ? 'decap' : 'impale') : pick(['decap', 'impale', 'decap']);
    const ex = p.weapon.executions[type];
    p.state = 'execute'; p.t = 0; p.vx = 0; p.trail = [];
    e.state = 'executed'; e.st = 0; e.vx = 0; e.atk = null;
    if (!e.crippled) {
      e.facing = -dir;
      p.x = e.x - dir * (type === 'impale' ? 46 + e.s * 10 : 42 + e.s * 14);
      e.pose = basePose(Object.assign({}, e.def.idle, { lean: -0.25, head: -0.4, armF: 0.2, elbowF: 0.2, weap: 0.4, armB: 0.0, elbowB: 0.2, legF: 0.45, kneeF: 0.6, legB: -0.25, kneeB: 0.4 }));
      e.joints = solveRig(e.pose);
    } else p.x = e.x - dir * 14;
    this.exec = { e, type, ex, t: 0, struck: false, ripped: false, lethal: !e.boss || type === 'decap', from: Object.assign({}, p.pose) };
    Sfx.play('heavySwing');
    Input.clear();
  },

  updateExecution(dt) {
    const x = this.exec, p = this.player, e = x.e, ex = x.ex;
    x.t += dt;
    const t = x.t;
    if (t < ex.windT) p.pose = lerpPose(x.from, ex.windP, easeOut(t / ex.windT));
    else if (t < ex.strikeT) p.pose = lerpPose(ex.windP, ex.strikeP, easeOut((t - ex.windT) / (ex.strikeT - ex.windT)));
    else if (x.type === 'impale' && t < ex.ripT) {
      const lift = clamp((t - ex.strikeT) / 0.3, 0, 1);
      p.pose = Object.assign({}, ex.strikeP, { armF: ex.strikeP.armF + lift * 0.35, weap: ex.strikeP.weap + lift * 0.3, lean: ex.strikeP.lean - lift * 0.1 });
      if (!e.dead) e.z = lift * 12;
    } else {
      const start = x.type === 'impale' ? ex.ripT : ex.strikeT + 0.45;
      p.pose = lerpPose(ex.strikeP, basePose(p.idle), easeInOut(clamp((t - start) / 0.5, 0, 1)));
    }
    p.joints = solveRig(p.pose);
    if (!x.struck && t >= ex.strikeT - 0.03) { x.struck = true; this.execStrike(); }
    if (x.type === 'impale' && x.struck && !x.ripped && t >= ex.ripT) { x.ripped = true; this.execRip(); }
    // flick the blood from the blade
    if (!x.flicked && t > ex.end - 0.35) {
      x.flicked = true;
      const tip = p.swordTip(); FX.blood(tip.x, tip.y, p.facing > 0 ? 0.3 : Math.PI - 0.3, 0.3, 260, 10);
    }
    if (t >= ex.end) { p.state = 'idle'; p.t = 0; this.exec = null; }
  },

  execStrike() {
    const x = this.exec, p = this.player, e = x.e, dir = p.facing;
    Sfx.play('execute'); Sfx.play('sever');
    Mobile.buzz([40, 30, 80]);
    FX.addShake(14);
    this.slow = { t: 0.5, scale: 0.22 };
    p.blood = 1;
    const c = e.worldPoint(e.joints.chest);
    if (x.type === 'decap') {
      e.sever('head', dir, this);
      e.fountain = 2.6;
      e.deathDelay = 0.75;
      e.die(this, { dir, execution: true });
    } else if (x.type === 'impale') {
      FX.gush(c.x + dir * 12, c.y, dir > 0 ? -0.15 : Math.PI + 0.15, 46, 520);
      FX.blood(c.x, c.y, -Math.PI / 2, 1, 220, 20);
      if (!x.lethal) {
        e.hp -= e.maxHp * 0.22;
        FX.text(c.x, c.y - 60, 'IMPALED', '#d01818', 18);
      }
    } else {
      FX.blood(c.x, c.y, -Math.PI / 2, 0.6, 460, 55, 1.2);
      FX.mist(c.x, c.y, 8);
      e.die(this, { dir, execution: true });
    }
    if (x.lethal) {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12);
      p.healGlow = 0.5;
      FX.text(c.x, c.y - 70, 'EXECUTED', '#c41a12', 20, 1.8);
    }
  },

  execRip() {
    const x = this.exec, p = this.player, e = x.e, dir = p.facing;
    const c = e.worldPoint(e.joints.chest);
    FX.gush(c.x, c.y, dir > 0 ? Math.PI + 0.35 : -0.35, 34, 380);
    FX.gush(c.x, c.y, dir > 0 ? -0.3 : Math.PI + 0.3, 24, 300);
    Sfx.play('sever'); FX.addShake(8);
    e.z = 0;
    if (x.lethal) { e.vx = dir * 240; e.die(this, { dir, execution: true }); }
    else { e.state = 'getup'; e.st = 0; e.vx = dir * 220; e.posture = 0; }
  },

  // ------------------------------------------------------------ render
  render(realDt) {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (this.state === 'title' || ((this.state === 'skins' || this.state === 'fairies') && this.skinReturn === 'title')) { UI.title(ctx, this); if (this.state === 'skins') UI.skins(ctx, this); if (this.state === 'fairies') UI.fairyStyles(ctx, this); Mobile.sync(this); return; }
    if (this.state === 'narration') { UI.narration(ctx, this); Mobile.sync(this); return; }

    const p = this.player, t = this.time;
    const sx = FX.shake ? rand(-FX.shake, FX.shake) : 0, sy = FX.shake ? rand(-FX.shake, FX.shake) * 0.6 : 0;
    drawBackground(ctx, this.cam.x, t, p.x);

    const z = this.cam.zoom, b = clamp((z - 1) / 0.4, 0, 1);
    const cx = lerp(this.cam.x + W / 2, this.cam.ex, b), cy = lerp(H / 2, this.cam.ey, b);
    const l = cx - W / 2 / z - 40, r = cx + W / 2 / z + 40;
    this.viewL = l + 40; this.viewR = r - 40;
    ctx.save();
    ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(z, z); ctx.translate(-cx, -cy);

    drawGround(ctx, l, r, p.x);
    // warm light pools from fires, drawn on the ground layer
    ctx.globalCompositeOperation = 'lighter';
    for (const pr of LEVEL.props) {
      if (pr.x < l - 300 || pr.x > r + 300) continue;
      const glow = { lamppost: [GROUND - 110, 130, '255,190,110', 0.2], forge: [GROUND - 55, 170, '255,120,40', 0.22], chapel: [GROUND - 80, 280, '255,200,140', 0.16],
        bog: [GROUND + 4, 120, '120,170,70', 0.14], townwall: [GROUND - 120, 110, '255,190,110', 0.16], townhouse: [GROUND - 80, 150, '255,190,110', 0.08] }[pr.type];
      if (glow) {
        const [gy, rad, col, a0] = glow, gx = pr.type === 'lamppost' ? pr.x + 13 : pr.x;
        const gr2 = ctx.createRadialGradient(gx, gy, 6, gx, gy, rad);
        gr2.addColorStop(0, `rgba(${col},${a0 + Math.sin(t * 7 + pr.x) * 0.02})`); gr2.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gr2; ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
      }
      if ((pr.type === 'house' && pr.burning) || pr.type === 'brazier') {
        const fy = pr.type === 'brazier' ? GROUND - 70 : GROUND - 120;
        const rad = pr.type === 'brazier' ? 160 : 260;
        const fl = 0.16 + Math.sin(t * 9 + pr.x) * 0.03;
        const gr = ctx.createRadialGradient(pr.x, fy, 10, pr.x, fy, rad);
        gr.addColorStop(0, `rgba(255,120,40,${fl})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = gr; ctx.fillRect(pr.x - rad, fy - rad, rad * 2, rad * 2);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    FX.drawDecals(ctx, l, r);

    for (const pr of LEVEL.props) if (pr.x > l - 300 && pr.x < r + 300) drawProp(ctx, pr, t, this);
    for (const s of LEVEL.shrines) if (s.x > l - 200 && s.x < r + 200) drawShrine(ctx, s, t, this.kindled.has(s.id), this.interactTarget && this.interactTarget.obj === s);
    for (const n of this.allNotes()) if (n.x > l && n.x < r) drawNote(ctx, n, t, this.flags.notes[n.id]);
    for (const w of LEVEL.weaponPickups) { // weapons waiting to be claimed, blade-down in the earth
      if (p.owned.includes(w.id) || this.flags['took_' + w.id] || w.x < l - 80 || w.x > r + 80) continue;
      const wd = WEAPONS[w.id], gy = GROUND - wd.bladeLen * 0.62;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(w.x, GROUND - 30, 2, w.x, GROUND - 30, 60);
      gl.addColorStop(0, `rgba(255,220,150,${0.22 + Math.sin(t * 3) * 0.08})`); gl.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = gl; ctx.fillRect(w.x - 60, GROUND - 90, 120, 120); ctx.restore();
      drawWeaponAt(ctx, { x: w.x, y: gy }, 0.12, c => wd.draw(c, 0.3));
      if (wd.draw2) drawWeaponAt(ctx, { x: w.x + 10, y: gy + 4 }, -0.2, c => wd.draw2(c, 0.3));
      if (chance(0.06)) FX.ember(w.x + rand(-8, 8), GROUND - 10);
    }
    for (const n of LEVEL.npcs) if (n.x > l - 100 && n.x < r + 100) drawNPC(ctx, n, t, this);
    // lost embers
    if (this.stain && this.stain.x > l && this.stain.x < r) {
      const sx2 = this.stain.x;
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(sx2, GROUND - 6, 0, sx2, GROUND - 6, 34);
      gr.addColorStop(0, `rgba(255,120,60,${0.5 + Math.sin(t * 4) * 0.2})`); gr.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = gr; ctx.fillRect(sx2 - 34, GROUND - 40, 68, 68);
      ctx.globalCompositeOperation = 'source-over';
      if (chance(0.15)) FX.ember(sx2 + rand(-8, 8), GROUND - 4);
    }

    // enemies: corpses first, then the living
    for (const e of this.enemies) if (e.dead && e.x > l - 120 && e.x < r + 120) e.draw(ctx, t, false);
    FX.drawGibs(ctx, l, r);
    for (const a of this.allies) if (a.x > l - 120 && a.x < r + 120) a.draw(ctx, t);
    for (const e of this.enemies) if (!e.dead && e.x > l - 120 && e.x < r + 120) e.draw(ctx, t, true);
    for (const a of this.allies) {
      if (a.dead || a.x < l || a.x > r) continue;
      const mk = Quests.marker(a);
      if (mk) UI.text(ctx, mk, a.x, GROUND - 130 * a.s + Math.sin(t * 4) * 3, 24, mk === '!' ? '#f0c060' : '#c8d8ff');
    }
    p.draw(ctx, t);
    for (const f of this.fairies) if (f.x > l - 60 && f.x < r + 60) f.draw(ctx, t);
    FX.drawParts(ctx, l, r);

    if (!this.flags.bossDead) {
      if (LEVEL.bossGate > l - 50 && LEVEL.bossGate < r + 50) drawFogGate(ctx, LEVEL.bossGate, t);
      if (this.arena) drawFogGate(ctx, LEVEL.arenaEnd + 20, t + 2);
    }

    // prompts
    if (this.state === 'play' && !p.busy && !this.exec) {
      const ex = this.findExecutable();
      if (ex) {
        const hy = ex.crippled ? GROUND - 60 : GROUND - ex.z - 128 * ex.s;
        UI.executeSigil(ctx, ex.x, hy, t);
      } else if (this.interactTarget && !Mobile.enabled) {
        const it = this.interactTarget;
        UI.prompt(ctx, it.x, it.y, 'E', it.label, t);
      }
    }
    FX.drawTexts(ctx);
    if (this.state !== 'cutscene') for (const f of this.fairies) f.drawBubble(ctx);
    ctx.restore();

    // screen-space atmosphere
    Weather.draw(ctx, realDt, p.x, this.cam.x - this.cam.prevX);
    const fogCol = ZONES[zoneIndex(p.x)].fog;
    const fg = ctx.createLinearGradient(0, GROUND - 120, 0, H);
    fg.addColorStop(0, `rgba(${fogCol},0)`); fg.addColorStop(1, `rgba(${fogCol},0.13)`);
    ctx.fillStyle = fg; ctx.fillRect(0, GROUND - 120, W, H);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (!p.dead && (p.infection > 60 || p.turning)) {
      // the Weeping creeping in at the edges of sight, throbbing with the heartbeat
      const k = p.turning ? 0.45 + (this.pulse || 0) * 0.3 : (p.infection - 60) / 40 * 0.3 + (this.pulse || 0) * 0.08;
      const ig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.85);
      ig.addColorStop(0, 'rgba(90,0,30,0)'); ig.addColorStop(1, `rgba(110,0,40,${k})`);
      ctx.fillStyle = ig; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = `rgba(140,10,40,${k * 0.9})`; ctx.lineWidth = 1.5;
      const vr = seeded(7);
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const side = i % 4, a = vr();
        let x0 = side === 0 ? 0 : side === 1 ? W : a * W, y0 = side === 2 ? 0 : side === 3 ? H : a * H;
        ctx.moveTo(x0, y0);
        for (let j = 0; j < 4; j++) { x0 += (W / 2 - x0) * 0.12 + (vr() - 0.5) * 30; y0 += (H / 2 - y0) * 0.12 + (vr() - 0.5) * 30; ctx.lineTo(x0, y0); }
      }
      ctx.stroke();
    }
    if (p.hp < p.maxHp * 0.3 && !p.dead) {
      const a = (0.25 + Math.sin(t * 5) * 0.12) * (1 - p.hp / (p.maxHp * 0.3));
      const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
      rg.addColorStop(0, 'rgba(120,0,0,0)'); rg.addColorStop(1, `rgba(120,0,0,${a + 0.2})`);
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }
    // cinematic bars during executions & cutscenes
    const bars = this.state === 'cutscene' || (this.state === 'dialogue' && this.bossActive) ? 1 : b;
    if (bars > 0.01) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 44 * bars); ctx.fillRect(0, H - 44 * bars, W, 44 * bars); }

    if (this.state !== 'cutscene') { UI.hud(ctx, this); if (this.flags.quests && this.state !== 'dead') { Quests.drawTracker(ctx, this); if (this.state === 'play') Quests.drawArrow(ctx, this); } }
    if (this.state === 'dialogue') UI.dialogue(ctx, this);
    if (this.state === 'note') UI.note(ctx, this);
    if (this.state === 'menu') UI.shrineMenu(ctx, this);
    if (this.state === 'service') UI.serviceMenu(ctx, this);
    if (this.state === 'pause') UI.pause(ctx, this);
    if (this.state === 'fairies') UI.fairyStyles(ctx, this);
    if (this.state === 'skins') UI.skins(ctx, this);
    if (this.state === 'dead') UI.death(ctx, this);
    if (this.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`; ctx.fillRect(0, 0, W, H); }
    Mobile.sync(this);
  },
};

window.addEventListener('load', () => {
  const start = () => Game.init();
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(start);
  } else start();
});
