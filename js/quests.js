'use strict';
// ---------------------------------------------------------------------------
// Quests: a main story quest and side quests from the survivors.
// Each quest is a list of steps. Step kinds:
//   talk / return : speak with the quest giver
//   kill          : slay `count` foes of `kinds` between x0..x1
//   note          : read a lore note
//   auto          : main-quest steps derived from story flags
// Progress lives in Game.flags.quests so it is saved with everything else.
// ---------------------------------------------------------------------------
const QUESTS = {
  main: {
    title: 'The Ashen Oath', main: true,
    steps: [
      { kind: 'auto', text: 'Speak with the dying monk on the road', x: 640, done: f => f.osric },
      { kind: 'auto', text: 'Reach the walled town of Brackenford', x: 3440, done: f => f.reached_town },
      { kind: 'auto', text: 'Speak with Reeve Aldous in the square', x: 4420, done: f => f.reeve },
      { kind: 'auto', text: 'Seek Mother Agathe at the Chapel of Saint Ysolde', x: 5960, done: f => f.agathe },
      { kind: 'auto', text: 'Reach the village of Hallowmere', x: 6440, done: f => f.reached_village },
      { kind: 'auto', text: 'Find the gravedigger in Hallowmere', x: 6930, done: f => f.wren },
      { kind: 'auto', text: 'Cross the Weeping Mire', x: 9820, done: f => f.reached_mire },
      { kind: 'auto', text: 'Climb to the Steps of Saint Varn', x: 12820, done: f => f.reached_cathedral },
      { kind: 'auto', text: 'Defeat Gaul, the Penitent Headsman', x: 14960, done: f => f.bossDead },
      { kind: 'auto', text: 'Descend into the crypt beneath the cathedral', x: 15350, done: f => f.ended },
    ],
  },
  bram: {
    title: 'Last of the Watch', giver: 'bram',
    steps: [
      { kind: 'talk', text: 'Speak with Sergeant Bram by the gallows', x: 2350 },
      { kind: 'kill', text: 'Clear the infected from the road', kinds: ['peasant', 'crawler'], count: 3, x0: 2300, x1: 3350, x: 2850 },
      { kind: 'return', text: 'Return to Sergeant Bram', x: 2350 },
    ],
    reward: { embers: 300, weapon: 'spear' },
  },
  hedda: {
    title: 'The Widow at the Barricade', giver: 'hedda',
    steps: [
      { kind: 'talk', text: 'Speak with Hedda behind the barricade', x: 7810 },
      { kind: 'kill', text: 'Slay the flagellants hunting Hedda', kinds: ['flagellant'], count: 2, x0: 7700, x1: 8500, x: 8120 },
      { kind: 'return', text: 'Tell Hedda she is safe', x: 7810 },
    ],
    reward: { flask: 1 },
  },
  odo: {
    title: 'A Sellsword\'s Price', giver: 'odo',
    steps: [
      { kind: 'talk', text: 'Speak with Odo the sellsword', x: 8420 },
      { kind: 'kill', text: 'Cut down the turned garrison with Odo', kinds: ['footman'], count: 2, x0: 8300, x1: 9000, x: 8600 },
      { kind: 'return', text: 'Collect your share from Odo', x: 8420 },
    ],
    reward: { embers: 500 },
  },
  ysane: {
    title: 'The Lost Sister', giver: 'ysane',
    steps: [
      { kind: 'talk', text: 'Find Sister Ysane near the Drowned Chapel', x: 10950 },
      { kind: 'kill', text: 'Give rest to the Weeping Sisters', kinds: ['fallensister'], count: 2, x0: 11000, x1: 11400, x: 11210 },
      { kind: 'return', text: 'Return to Sister Ysane', x: 10950 },
    ],
    reward: { tonics: 2 },
  },
  anselm: {
    title: 'The Torn Page', giver: 'anselm',
    steps: [
      { kind: 'talk', text: 'Speak with Brother Anselm by the weeping statue', x: 13240 },
      { kind: 'note', text: 'Find the torn page of scripture up the steps', note: 'scripture', x: 13980 },
      { kind: 'return', text: 'Bring the page to Brother Anselm', x: 13240 },
    ],
    reward: { embers: 400 },
  },
};
const QUEST_ORDER = ['main', 'bram', 'hedda', 'odo', 'ysane', 'anselm'];

const Quests = {
  ensure(flags) {
    flags.quests = flags.quests || {};
    flags.dead = flags.dead || {};
    if (!flags.quests.main) flags.quests.main = { step: 0, count: 0, status: 'active' };
  },
  q(id) { return Game.flags.quests[id]; },
  step(id) { const s = this.q(id); return s && QUESTS[id].steps[s.step]; },

  start(id) {
    const g = Game;
    g.flags.quests[id] = { step: 1, count: 0, status: 'active' };
    g.flags.focus = id;
    this.notify('NEW QUEST', QUESTS[id].title);
    this.enterStep(id);
  },

  // a step just became current: count what is already done
  enterStep(id) {
    const s = this.q(id), st = this.step(id);
    if (!st) return;
    if (st.kind === 'kill') {
      s.count = Game.enemies.filter(e => e.dead && st.kinds.includes(e.kind) && e.spawn.x >= st.x0 && e.spawn.x <= st.x1).length;
      if (s.count >= st.count) this.advance(id);
    } else if (st.kind === 'note' && Game.flags.notes[st.note]) this.advance(id);
  },

  advance(id) {
    const s = this.q(id);
    s.step++; s.count = 0;
    Game.flags.focus = id;
    if (s.step >= QUESTS[id].steps.length) { s.status = 'done'; return; }
    this.notify('QUEST UPDATED', this.step(id).text);
    this.enterStep(id);
    Game.saveGame();
  },

  complete(id) {
    const s = this.q(id), Q = QUESTS[id], p = Game.player;
    s.status = 'done'; s.step = Q.steps.length;
    if (Q.reward) {
      if (Q.reward.embers) p.embers += Q.reward.embers;
      if (Q.reward.flask) { p.maxFlasks += Q.reward.flask; p.flasks += Q.reward.flask; }
      if (Q.reward.tonics) p.tonics = Math.min(p.maxTonics, p.tonics + Q.reward.tonics);
      if (Q.reward.weapon) Game.giveWeapon(Q.reward.weapon);
    }
    if (Game.flags.focus === id) Game.flags.focus = null;
    this.notify('QUEST COMPLETE', Q.title, '#e8c070');
    Sfx.play('fairyJoin');
    Game.saveGame();
  },

  fail(id, why) {
    const s = this.q(id);
    if (!s || s.status !== 'active') {
      Game.flags.quests[id] = { step: 0, count: 0, status: 'failed', why };
    } else { s.status = 'failed'; s.why = why; }
    if (Game.flags.focus === id) Game.flags.focus = null;
    this.notify('QUEST FAILED', `${QUESTS[id].title}: ${why}`, '#c84a3a');
  },

  notify(head, text, col) {
    Game.questNote = { head, text, col: col || '#d8c8a0', t: 0, life: 3.6 };
    if (head !== 'QUEST COMPLETE') Sfx.play('page');
  },

  // main quest follows the story flags
  syncMain() {
    const f = Game.flags, s = f.quests.main;
    if (s.status !== 'active') return;
    let n = 0;
    while (n < QUESTS.main.steps.length && QUESTS.main.steps[n].done(f)) n++;
    if (n > s.step) {
      s.step = n;
      if (n >= QUESTS.main.steps.length) { s.status = 'done'; this.notify('QUEST COMPLETE', QUESTS.main.title, '#e8c070'); }
      else this.notify('QUEST UPDATED', QUESTS.main.steps[n].text);
    }
  },

  onKill(e) {
    for (const id of QUEST_ORDER) {
      const s = this.q(id), st = this.step(id);
      if (!s || s.status !== 'active' || !st || st.kind !== 'kill') continue;
      if (!st.kinds.includes(e.kind) || e.spawn.x < st.x0 || e.spawn.x > st.x1) continue;
      s.count++;
      if (s.count >= st.count) this.advance(id);
      else this.notify('QUEST UPDATED', `${st.text}  (${s.count}/${st.count})`);
    }
  },

  onNote(noteId) {
    for (const id of QUEST_ORDER) {
      const s = this.q(id), st = this.step(id);
      if (s && s.status === 'active' && st && st.kind === 'note' && st.note === noteId) this.advance(id);
    }
  },

  // talking to a survivor drives their quest; returns the lines to say
  talk(ally) {
    const id = ally.def.quest, s = this.q(id), T = ALLY_TALK[ally.id];
    if (!s) return { lines: T.intro, after: () => this.start(id) };
    if (s.status === 'done') return { lines: T.after };
    if (s.status === 'failed') return { lines: T.after };
    const st = this.step(id);
    if (st.kind === 'return') return { lines: T.complete, after: () => this.complete(id) };
    return { lines: T.progress };
  },

  // quest marker shown above a survivor: '!' new, '?' ready to turn in
  marker(ally) {
    if (!ally.def.quest) return ally.def.story && !Game.flags[ally.def.story] ? '!' : null;
    const s = this.q(ally.def.quest);
    if (!s) return '!';
    if (s.status === 'active' && this.step(ally.def.quest).kind === 'return') return '?';
    return null;
  },

  // the quest whose objective arrow is shown
  focusId() {
    const f = Game.flags;
    if (f.focus && f.quests[f.focus] && f.quests[f.focus].status === 'active') return f.focus;
    return f.quests.main.status === 'active' ? 'main' : null;
  },

  stepLabel(id) {
    const s = this.q(id), st = this.step(id);
    if (!st) return '';
    return st.kind === 'kill' ? `${st.text}  (${s.count}/${st.count})` : st.text;
  },

  // ---------------------------------------------------------------- UI
  drawTracker(ctx, g) {
    const right = !Mobile.enabled, x = right ? W - 28 : 28, y0 = right ? 40 : 124;
    const rows = [];
    const main = g.flags.quests.main;
    if (main.status === 'active') rows.push({ id: 'main' });
    const fid = this.focusId();
    if (fid && fid !== 'main') rows.push({ id: fid });
    let y = y0;
    for (const r of rows) {
      const Q = QUESTS[r.id];
      ctx.font = `12px ${TITLE_FONT}`;
      const label = this.stepLabel(r.id);
      ctx.font = `13px ${BODY_FONT}`;
      const w = Math.max(ctx.measureText(label).width, 120) + 30;
      const bx = right ? x - w + 6 : x - 6, al = right ? 'right' : 'left', tx = right ? x - 2 : x + 2;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(bx, y - 13, w, 38);
      ctx.fillStyle = Q.main ? '#c9a35a' : '#a8b4d0'; ctx.fillRect(right ? bx + w - 2 : bx, y - 13, 2, 38);
      UI.text(ctx, (Q.main ? '◆ ' : '◇ ') + Q.title.toUpperCase(), tx, y, 11, Q.main ? '#c9a35a' : '#a8b4d0', al);
      UI.text(ctx, label, tx, y + 17, 13, '#e2d8c2', al, BODY_FONT);
      y += 44;
    }
    // notification
    const n = g.questNote;
    if (n && !g.banner && g.state !== 'pause') {
      const a = n.t < 0.3 ? n.t / 0.3 : n.t > n.life - 0.6 ? (n.life - n.t) / 0.6 : 1;
      ctx.globalAlpha = clamp(a, 0, 1);
      const cy = Mobile.enabled ? 200 : H * 0.37;
      const grad = ctx.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.7)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(W / 2 - 260, cy - 26, 520, 52);
      UI.text(ctx, n.head, W / 2, cy - 6, 13, n.col);
      UI.text(ctx, n.text, W / 2, cy + 15, 16, '#ece2cc', 'center', BODY_FONT);
      ctx.globalAlpha = 1;
    }
  },

  // arrow at the screen edge pointing toward the focused objective
  drawArrow(ctx, g) {
    const id = this.focusId(); if (!id) return;
    const st = this.step(id); if (!st || st.x === undefined) return;
    const sx = (st.x - g.viewL) / (g.viewR - g.viewL) * W;
    if (sx > 30 && sx < W - 30) return;
    const left = sx <= 30, x = left ? 26 : W - 26, y = H * 0.55;
    const pulse = 0.65 + Math.sin(g.time * 5) * 0.35;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = QUESTS[id].main ? '#d9b360' : '#a8b4d0';
    ctx.beginPath();
    if (left) { ctx.moveTo(-12, 0); ctx.lineTo(4, -11); ctx.lineTo(4, 11); }
    else { ctx.moveTo(12, 0); ctx.lineTo(-4, -11); ctx.lineTo(-4, 11); }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  drawJournal(ctx, g) {
    UI.text(ctx, 'JOURNAL', W / 2, 70, 28, '#d8c8a4');
    let y = 110;
    for (const id of QUEST_ORDER) {
      const s = g.flags.quests[id]; if (!s) continue;
      const Q = QUESTS[id];
      const col = s.status === 'done' ? '#8a9a6a' : s.status === 'failed' ? '#b0453a' : Q.main ? '#d9b360' : '#a8b4d0';
      const tag = s.status === 'done' ? '  — complete' : s.status === 'failed' ? `  — failed: ${s.why || ''}` : '';
      UI.text(ctx, Q.title.toUpperCase() + tag, 120, y, 14, col, 'left');
      y += 20;
      const last = s.status === 'failed' ? s.step : Math.min(s.step, Q.steps.length - 1);
      for (let i = 0; i <= last && i < Q.steps.length; i++) {
        const done = i < s.step || s.status === 'done';
        const cur = i === s.step && s.status === 'active';
        const txt = (done ? '✓  ' : cur ? '›  ' : '   ') + (cur ? this.stepLabel(id) : Q.steps[i].text);
        UI.text(ctx, txt, 140, y, 13, done ? '#7d7564' : cur ? '#ece2cc' : '#8a7c62', 'left', BODY_FONT);
        y += 17;
        if (y > H - 50) return;
      }
      y += 8;
    }
  },
};
