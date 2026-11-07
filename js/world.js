'use strict';
// ---------------------------------------------------------------------------
// The valley of Vael — level layout, scenery and props
// Five regions, west to east:
//   I   The Weeping Road        0     – 3400
//   II  Brackenford (town)      3400  – 6400   walled, safe, the Chapel of Saint Ysolde
//   III Hallowmere, That Was    6400  – 9800
//   IV  The Weeping Mire        9800  – 12800
//   V   The Steps of Saint Varn 12800 – end    (boss)
// ---------------------------------------------------------------------------
const ZONES = [
  {
    x: 0, num: 'I', name: 'The Weeping Road', kind: 'road',
    sky: ['#09080b', '#24131a', '#4a2224'], far: '#160f13', mid: '#100b0e', near: '#0a0708',
    ground: '#1a1513', groundDark: '#0b0909', weather: 'rain', moon: '#d6c7ae', fog: '90,70,75',
  },
  {
    x: 3400, num: 'II', name: 'Brackenford', kind: 'town',
    sky: ['#06070d', '#141a2a', '#3a2a30'], far: '#0e111a', mid: '#0b0d14', near: '#07080c',
    ground: '#1c1917', groundDark: '#0c0a09', weather: 'rain', moon: '#e6dcc8', fog: '80,80,100',
  },
  {
    x: 6400, num: 'III', name: 'Hallowmere, That Was', kind: 'village',
    sky: ['#0c0505', '#33100a', '#7a2810'], far: '#1c0d0a', mid: '#140908', near: '#0b0605',
    ground: '#1d1411', groundDark: '#0d0807', weather: 'ash', moon: '#e0a070', fog: '120,60,40',
  },
  {
    x: 9800, num: 'IV', name: 'The Weeping Mire', kind: 'mire',
    sky: ['#050806', '#101c14', '#2a3a22'], far: '#0c140e', mid: '#09100b', near: '#060a07',
    ground: '#151b12', groundDark: '#080b07', weather: 'mist', moon: '#b8c890', fog: '90,120,80',
  },
  {
    x: 12800, num: 'V', name: 'The Steps of Saint Varn', kind: 'cathedral',
    sky: ['#040508', '#121722', '#3b151c'], far: '#0e1016', mid: '#0a0b10', near: '#060609',
    ground: '#17161a', groundDark: '#09090b', weather: 'rain', moon: '#b8241c', fog: '70,70,90',
  },
];

const LEVEL = {
  width: 15480,
  bossGate: 14260, arenaEnd: 15260, bossX: 14960, doorX: 15330,
  townSafe: [3420, 6390],          // no infected inside the walls
  chapel: [5860, 6250],            // the Sisters' chapel
  shrines: [
    { id: 0, x: 170, name: 'Wayside Shrine' },
    { id: 1, x: 6640, name: 'Hallowmere Well' },
    { id: 2, x: 13020, name: 'Cathedral Steps' },
    { id: 3, x: 4700, name: 'Brackenford Square' },
    { id: 4, x: 10300, name: 'The Drowned Chapel' },
  ],
  enemies: [
    // I — the road
    { type: 'peasant', x: 1080, idle: 'feed', facing: 1 },
    { type: 'crawler', x: 1260, facing: -1 },
    { type: 'peasant', x: 1520, facing: -1 },
    { type: 'peasant', x: 1960, idle: 'feed', facing: -1 },
    { type: 'peasant', x: 2060, idle: 'pray', facing: -1 },
    { type: 'footman', x: 2480, facing: -1 },
    { type: 'peasant', x: 2760, facing: -1 },
    { type: 'peasant', x: 2850, idle: 'feed', facing: 1 },
    { type: 'crawler', x: 2960, facing: -1 },
    { type: 'flagellant', x: 3160, facing: -1 },
    { type: 'peasant', x: 3290, facing: -1 },
    // III — Hallowmere
    { type: 'crawler', x: 7250, facing: -1 },
    { type: 'footman', x: 7360, facing: -1 },
    { type: 'peasant', x: 7520, idle: 'pray', facing: -1 },
    { type: 'peasant', x: 7590, idle: 'pray', facing: -1 },
    { type: 'flagellant', x: 8060, facing: -1 },
    { type: 'flagellant', x: 8200, facing: -1 },
    { type: 'footman', x: 8520, facing: -1 },
    { type: 'footman', x: 8650, facing: -1 },
    { type: 'peasant', x: 8920, idle: 'feed', facing: -1 },
    { type: 'peasant', x: 8990, idle: 'feed', facing: 1 },
    { type: 'peasant', x: 9060, facing: -1 },
    { type: 'brute', x: 9150, facing: -1 },
    { type: 'plaguedoc', x: 9300, facing: -1 },
    { type: 'flagellant', x: 9440, facing: -1 },
    { type: 'fallensister', x: 9540, facing: -1 },
    { type: 'footman', x: 9660, facing: -1 },
    // IV — the Mire
    { type: 'crawler', x: 9950, facing: -1 },
    { type: 'carrier', x: 10120, facing: -1 },
    { type: 'peasant', x: 10560, idle: 'feed', facing: -1 },
    { type: 'crawler', x: 10640, facing: -1 },
    { type: 'fallensister', x: 11150, facing: -1 },
    { type: 'fallensister', x: 11270, facing: -1 },
    { type: 'carrier', x: 11500, facing: -1 },
    { type: 'flagellant', x: 11650, facing: -1 },
    { type: 'plaguedoc', x: 11800, facing: -1 },
    { type: 'carrier', x: 12160, facing: -1 },
    { type: 'crawler', x: 12250, facing: -1 },
    { type: 'brute', x: 12450, facing: -1 },
    { type: 'footman', x: 12650, facing: -1 },
    // V — the cathedral steps
    { type: 'footman', x: 13360, facing: -1 },
    { type: 'plaguedoc', x: 13470, facing: -1 },
    { type: 'flagellant', x: 13560, idle: 'pray', facing: -1 },
    { type: 'templar', x: 13720, facing: -1 },
    { type: 'fallensister', x: 13820, facing: -1 },
    { type: 'brute', x: 13920, facing: -1 },
    { type: 'templar', x: 14120, facing: -1 },
  ],
  npcs: [
    { id: 'osric', x: 640 },
    { id: 'wren', x: 6930 },
  ],
  // living people: fighters defend themselves, civilians cannot
  allies: [
    { id: 'bram', x: 2350 },
    { id: 'tobias', x: 3530 },
    { id: 'jory', x: 3820 },
    { id: 'mags', x: 4110 },
    { id: 'reeve', x: 4420 },
    { id: 'garrick', x: 5010 },
    { id: 'fen', x: 5300 },
    { id: 'cass', x: 5560 },
    { id: 'agathe', x: 5960 },
    { id: 'elowen', x: 6060 },
    { id: 'maelis', x: 6160 },
    { id: 'edric', x: 6330 },
    { id: 'hedda', x: 7810 },
    { id: 'odo', x: 8420 },
    { id: 'ysane', x: 10950 },
    { id: 'holt', x: 12000 },
    { id: 'anselm', x: 13240 },
  ],
  notes: [
    { id: 'letter', x: 1720 },
    { id: 'notice', x: 3660 },
    { id: 'ysolde', x: 5800 },
    { id: 'deathwatch', x: 5730 },
    { id: 'order', x: 7720 },
    { id: 'hymn', x: 9230 },
    { id: 'journal', x: 10420 },
    { id: 'scripture', x: 13980 },
  ],
  hints: [
    { x: 230, text: 'A / D — walk     Shift — sprint     Space — roll (stay invulnerable mid-roll)', touch: 'Drag on the left to walk — push to the rim to sprint.   ⟳ ROLL dodges blows' },
    { x: 470, text: 'E — speak, read, rest at shrines', touch: '✋ appears near people, notes and shrines' },
    { x: 860, text: 'J / Left Click — attack (chain up to three)     K / Right Click — heavy attack', touch: '⚔ ATTACK chains up to three cuts     ✦ HEAVY cleaves' },
    { x: 1150, text: 'Every wound from the infected feeds the INFECTION bar. If it fills, you will turn unless cured.', touch: 'Every wound from the infected feeds the INFECTION bar. If it fills, you will turn unless cured.' },
    { x: 1400, text: 'Hold L — raise your guard. Guard just before a blow lands to PARRY.', touch: 'Hold ⛨ GUARD to block. Guard just before a blow lands to PARRY.' },
    { x: 1700, text: 'Wounded, staggered or crippled foes can be EXECUTED — press F when the sigil appears.', touch: 'Wounded, staggered or crippled foes can be EXECUTED — tap ☠ when it glows.' },
    { x: 2150, text: 'S + Attack — Hamstring Cut. Take their legs and they will crawl.     Q — drink a vial', touch: 'Hold the stick down + ⚔ — Hamstring Cut. Take their legs.   ⚱ — drink a vial' },
    { x: 2600, text: 'Every cut builds BLEED. Fill the gauge to cause a hemorrhage.' },
    { x: 3480, text: 'Brackenford: the infected cannot pass its walls. Rest, trade, and find the Sisters at the chapel.' },
  ],
  props: [],
  // weapons lying in the world, waiting to be claimed
  weaponPickups: [
    { id: 'daggers', x: 8285 },   // on a dead flagellant by Hedda's barricade
    { id: 'greataxe', x: 12330 }, // buried in the Mire, guarded by a butcher
  ],
};

// Hand-placed props
(function placeProps() {
  const P = LEVEL.props;
  const add = (type, x, o) => P.push(Object.assign({ type, x }, o || {}));
  // --- I: the road
  add('tree', 60, { seed: 3, h: 230 }); add('tree', 420, { seed: 7, h: 190 });
  add('cart', 610); add('tree', 900, { seed: 11, h: 260 });
  add('corpse', 1110, { style: 'peasant', rot: 1 }); add('gibbet', 1330, { seed: 1 });
  add('corpse', 1700, { style: 'footman', rot: -1 }); add('pike', 1830); add('pike', 1870, { empty: true });
  add('tree', 2000, { seed: 21, h: 210 }); add('corpse', 2000, { style: 'peasant', rot: -1 });
  add('gibbet', 2320, { seed: 2 }); add('gibbet', 2600, { seed: 3 }); add('tree', 2700, { seed: 5, h: 240 });
  add('corpse', 2880, { style: 'peasant', rot: 1 }); add('pike', 2960); add('tree', 3080, { seed: 9, h: 200 });
  add('sign', 3250, { text: 'BRACKENFORD' });
  // --- II: Brackenford
  add('townwall', 3420);
  add('lamppost', 3600); add('board', 3660); add('townhouse', 3760, { w: 200, seed: 1 }); add('lamppost', 3930);
  add('townhouse', 4060, { w: 190, seed: 2 }); add('stall', 4230, { col: '#6a2a22' }); add('hall', 4440);
  add('lamppost', 4620); add('well', 4780); add('stall', 4880, { col: '#2a4a5a' }); add('forge', 5040);
  add('lamppost', 5190); add('townhouse', 5300, { w: 220, seed: 3, tavern: true }); add('lamppost', 5450);
  add('grave', 5540, { cross: true }); add('townhouse', 5680, { w: 180, seed: 4 });
  add('chapel', 6050); add('lamppost', 6290); add('townwall', 6390, { east: true });
  add('sign', 6460, { text: 'HALLOWMERE' });
  // --- III: Hallowmere
  add('house', 6480, { w: 210, burning: false }); add('well', 6640);
  add('grave', 6850); add('grave', 6890, { cross: true }); add('grave', 6990); add('grave', 7040, { cross: true }); add('grave', 7085);
  add('house', 7180, { w: 240, burning: true }); add('cage', 7460); add('corpse', 7550, { style: 'footman', rot: 1 });
  add('pike', 7700); add('house', 7880, { w: 220, burning: true }); add('barricade', 7860); add('banner', 8060);
  add('corpse', 8260, { style: 'peasant', rot: -1 }); add('house', 8380, { w: 260, burning: false });
  add('pike', 8480); add('pike', 8520); add('house', 8760, { w: 230, burning: true });
  add('corpse', 8960, { style: 'peasant', rot: 1 }); add('cage', 9150); add('house', 9300, { w: 250, burning: true });
  add('banner', 9560); add('pike', 9700);
  // --- IV: the Mire
  add('tree', 9880, { seed: 31, h: 250 }); add('reeds', 9990); add('bog', 10180, { w: 160 }); add('ruinchapel', 10300);
  add('reeds', 10500); add('tree', 10700, { seed: 33, h: 210 }); add('boardwalk', 10820, { w: 260 }); add('bog', 11050, { w: 120 });
  add('corpse', 11200, { style: 'peasant', rot: -1 }); add('reeds', 11380); add('gibbet', 11560, { seed: 5 }); add('bog', 11720, { w: 200 });
  add('tree', 11900, { seed: 37, h: 270 }); add('boardwalk', 12080, { w: 220 }); add('reeds', 12300); add('cage', 12420);
  add('bog', 12560, { w: 140 }); add('sign', 12720, { text: 'SAINT VARN' });
  // --- V: the cathedral steps
  add('pillar', 12900); add('statue', 13180); add('pillar', 13300); add('candles', 13440); add('pillar', 13640);
  add('statue', 13800); add('pillar', 14000); add('candles', 14120); add('pillar', 14200);
  add('brazier', 14320); add('brazier', 15200); add('statue', 14760, { big: true });
  add('cathedral', LEVEL.doorX);
})();

// ---------------------------------------------------------------------------
// Parallax scenery generated once from a seed
// ---------------------------------------------------------------------------
const Scenery = {
  layers: [],
  build() {
    const rnd = seeded(1093);
    const mk = (factor, gen) => {
      const items = [];
      for (let wx = -400; wx < LEVEL.width + 600; wx += gen.step * (0.6 + rnd() * 0.8)) {
        const x = (wx - W / 2) * factor + W / 2;
        items.push(gen.make(x, ZONES[zoneIndex(wx)].kind, rnd));
      }
      return { factor, items };
    };
    const hills = [];
    for (let x = -200; x < LEVEL.width * 0.12 + W + 400; x += 40) hills.push({ x, h: 60 + Math.sin(x * 0.006) * 30 + rnd() * 25 });
    this.hills = hills;
    this.layers = [
      mk(0.25, {
        step: 180, make: (x, k, r) => {
          if (k === 'road') return { k: r() < 0.6 ? 'ftree' : 'windmill', x, h: 60 + r() * 50 };
          if (k === 'town') return { k: r() < 0.3 ? 'tower' : 'roofs', x, h: 60 + r() * 70, w: 70 + r() * 80 };
          if (k === 'village') return { k: r() < 0.25 ? 'tower' : 'roofs', x, h: 50 + r() * 60, w: 60 + r() * 80 };
          if (k === 'mire') return { k: r() < 0.75 ? 'ftree' : 'windmill', x, h: 50 + r() * 60 };
          return { k: r() < 0.5 ? 'spire' : 'tower', x, h: 140 + r() * 120, w: 30 + r() * 30 };
        },
      }),
      mk(0.5, {
        step: 260, make: (x, k, r) => {
          if (k === 'road') return { k: r() < 0.7 ? 'mtree' : 'gallows', x, h: 120 + r() * 80, seed: Math.floor(r() * 1000) };
          if (k === 'town') return { k: 'house', x, h: 100 + r() * 60, w: 90 + r() * 70, lit: r() < 0.8, warm: true };
          if (k === 'village') return { k: 'house', x, h: 90 + r() * 50, w: 90 + r() * 70, lit: r() < 0.5 };
          if (k === 'mire') return { k: r() < 0.5 ? 'mtree' : 'reedsil', x, h: 110 + r() * 80, seed: Math.floor(r() * 1000) };
          return { k: r() < 0.5 ? 'arch' : 'mtree', x, h: 150 + r() * 80, w: 60 + r() * 40, seed: Math.floor(r() * 1000) };
        },
      }),
    ];
  },
};

function zoneIndex(x) {
  for (let i = ZONES.length - 1; i > 0; i--) if (x >= ZONES[i].x) return i;
  return 0;
}
function zoneKind(x) { return ZONES[zoneIndex(x)].kind; }
function inTown(x) { return x > LEVEL.townSafe[0] && x < LEVEL.townSafe[1]; }

// palette blended across zone borders (400px crossfade)
function zonePalette(x) {
  const i = zoneIndex(x);
  const z = ZONES[i];
  const next = ZONES[i + 1];
  const t = next ? clamp((x - (next.x - 400)) / 400, 0, 1) : 0;
  if (!next || t === 0) return { z, t: 0, mix: k => z[k], mixArr: (k, n) => z[k][n] };
  return { z, t, mix: k => mixHex(z[k], next[k], t), mixArr: (k, n) => mixHex(z[k][n], next[k][n], t) };
}

function drawTree(ctx, x, y, h, seed, col) {
  const r = seeded(seed);
  ctx.strokeStyle = col; ctx.lineCap = 'round';
  const branch = (bx, by, ang, len, w, depth) => {
    const ex = bx + Math.sin(ang) * len, ey = by - Math.cos(ang) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + Math.sin(ang + 0.3) * len * 0.5, by - Math.cos(ang + 0.3) * len * 0.5, ex, ey); ctx.stroke();
    if (depth > 0) {
      const n = 2 + (r() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) branch(ex, ey, ang + (r() - 0.5) * 1.6, len * (0.55 + r() * 0.2), w * 0.62, depth - 1);
    }
  };
  branch(x, y, (r() - 0.5) * 0.2, h * 0.42, h * 0.07, 4);
}

function drawBackground(ctx, camX, t, playerX) {
  const pal = zonePalette(playerX);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.mixArr('sky', 0)); g.addColorStop(0.55, pal.mixArr('sky', 1)); g.addColorStop(1, pal.mixArr('sky', 2));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // moon
  const moonCol = pal.mix('moon');
  const mx = 720 - camX * 0.02, my = 110;
  const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 160);
  mg.addColorStop(0, 'rgba(255,220,190,0.18)'); mg.addColorStop(1, 'rgba(255,220,190,0)');
  ctx.fillStyle = mg; ctx.fillRect(mx - 160, my - 160, 320, 320);
  ctx.fillStyle = moonCol; ctx.beginPath(); ctx.arc(mx, my, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.arc(mx - 12, my - 8, 9, 0, Math.PI * 2); ctx.arc(mx + 14, my + 10, 6, 0, Math.PI * 2); ctx.arc(mx + 5, my - 18, 4, 0, Math.PI * 2); ctx.fill();
  // clouds
  ctx.fillStyle = 'rgba(10,6,8,0.55)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 260 - camX * 0.05 - t * 6) % (W + 400) + W + 400) % (W + 400) - 200;
    ctx.beginPath(); ctx.ellipse(cx, 70 + (i % 3) * 40, 160, 16, 0, 0, Math.PI * 2); ctx.fill();
  }
  // far hills
  ctx.fillStyle = pal.mix('far');
  ctx.beginPath(); ctx.moveTo(0, H);
  const off = camX * 0.12;
  for (const hp of Scenery.hills) {
    const x = hp.x - off;
    if (x < -60 || x > W + 60) continue;
    ctx.lineTo(x, GROUND - 90 - hp.h);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // silhouette layers
  for (let li = 0; li < Scenery.layers.length; li++) {
    const L = Scenery.layers[li];
    ctx.fillStyle = li === 0 ? pal.mix('mid') : pal.mix('near');
    ctx.strokeStyle = ctx.fillStyle;
    const base = li === 0 ? GROUND - 50 : GROUND - 18;
    for (const it of L.items) {
      const x = it.x - camX * L.factor;
      if (x < -200 || x > W + 200) continue;
      drawSilhouette(ctx, it, x, base, t);
    }
    // ground strip for the layer
    ctx.fillRect(0, base, W, H - base);
  }
}

function drawSilhouette(ctx, it, x, base, t) {
  switch (it.k) {
    case 'ftree': drawTree(ctx, x, base, it.h, Math.floor(it.x), ctx.fillStyle); break;
    case 'mtree': drawTree(ctx, x, base, it.h, it.seed, ctx.fillStyle); break;
    case 'windmill': {
      ctx.beginPath(); ctx.moveTo(x - 14, base); ctx.lineTo(x - 8, base - it.h); ctx.lineTo(x + 8, base - it.h); ctx.lineTo(x + 14, base); ctx.fill();
      ctx.lineWidth = 4; const a = t * 0.15;
      for (let i = 0; i < 4; i++) { const an = a + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, base - it.h); ctx.lineTo(x + Math.cos(an) * 46, base - it.h + Math.sin(an) * 46); ctx.stroke(); }
      break;
    }
    case 'roofs':
      ctx.beginPath(); ctx.moveTo(x - it.w / 2, base); ctx.lineTo(x - it.w / 2, base - it.h * 0.6); ctx.lineTo(x, base - it.h); ctx.lineTo(x + it.w / 2, base - it.h * 0.6); ctx.lineTo(x + it.w / 2, base); ctx.fill();
      break;
    case 'tower':
      ctx.fillRect(x - it.w / 4, base - it.h, it.w / 2, it.h);
      ctx.beginPath(); ctx.moveTo(x - it.w / 3, base - it.h); ctx.lineTo(x, base - it.h - it.w * 0.8); ctx.lineTo(x + it.w / 3, base - it.h); ctx.fill();
      break;
    case 'spire':
      ctx.fillRect(x - it.w / 2, base - it.h * 0.6, it.w, it.h * 0.6);
      ctx.beginPath(); ctx.moveTo(x - it.w / 2, base - it.h * 0.6); ctx.lineTo(x, base - it.h - 40); ctx.lineTo(x + it.w / 2, base - it.h * 0.6); ctx.fill();
      ctx.fillRect(x - 1, base - it.h - 60, 2, 22); ctx.fillRect(x - 7, base - it.h - 52, 14, 2);
      break;
    case 'gallows':
      ctx.fillRect(x - 3, base - it.h, 6, it.h); ctx.fillRect(x - 3, base - it.h, 50, 5);
      ctx.fillRect(x + 40, base - it.h, 1.5, 22);
      ctx.save(); ctx.translate(x + 41, base - it.h + 22); ctx.rotate(Math.sin(t * 0.8 + x) * 0.05);
      ctx.fillRect(-4, 0, 8, 26); ctx.fillRect(-3, 26, 2.5, 22); ctx.fillRect(1, 26, 2.5, 22); ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      break;
    case 'house': {
      const hw = it.w / 2;
      ctx.beginPath(); ctx.moveTo(x - hw, base); ctx.lineTo(x - hw, base - it.h * 0.55); ctx.lineTo(x - hw * 0.2, base - it.h); ctx.lineTo(x + hw * 0.3, base - it.h * 0.85); ctx.lineTo(x + hw, base - it.h * 0.55); ctx.lineTo(x + hw, base); ctx.fill();
      if (it.lit) {
        const f = it.warm ? 0.55 + Math.sin(t * 1.3 + x) * 0.05 : 0.5 + Math.sin(t * 7 + x) * 0.2;
        ctx.fillStyle = it.warm ? `rgba(255,196,110,${f})` : `rgba(255,120,40,${f})`; ctx.fillRect(x - hw * 0.5, base - it.h * 0.4, 10, 12); ctx.fillRect(x + hw * 0.3, base - it.h * 0.42, 9, 11);
        ctx.fillStyle = ctx.strokeStyle;
      }
      break;
    }
    case 'reedsil':
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const rx = x + i * 7 - 30, rh = it.h * (0.35 + ((i * 37) % 10) / 22); ctx.beginPath(); ctx.moveTo(rx, base); ctx.quadraticCurveTo(rx + 4, base - rh * 0.6, rx + Math.sin(t + i) * 4 + 3, base - rh); ctx.stroke(); }
      break;
    case 'arch':
      ctx.fillRect(x - it.w / 2, base - it.h, 14, it.h); ctx.fillRect(x + it.w / 2 - 14, base - it.h, 14, it.h);
      ctx.beginPath(); ctx.moveTo(x - it.w / 2, base - it.h); ctx.quadraticCurveTo(x, base - it.h - it.w * 0.7, x + it.w / 2, base - it.h); ctx.lineTo(x + it.w / 2, base - it.h + 14); ctx.quadraticCurveTo(x, base - it.h - it.w * 0.45, x - it.w / 2, base - it.h + 14); ctx.fill();
      break;
  }
}

// Playfield ground with ruts, stones and puddles
const groundDetail = (() => {
  const r = seeded(77); const arr = [];
  for (let x = 0; x < LEVEL.width + 200; x += 18 + r() * 40) arr.push({ x, y: GROUND + 4 + r() * 90, w: 2 + r() * 8, k: r() < 0.08 ? 'puddle' : r() < 0.55 ? 'stone' : 'grass' });
  return arr;
})();

function drawGround(ctx, l, r, playerX) {
  const pal = zonePalette(playerX);
  const g = ctx.createLinearGradient(0, GROUND - 4, 0, H);
  g.addColorStop(0, pal.mix('ground')); g.addColorStop(1, pal.mix('groundDark'));
  ctx.fillStyle = g; ctx.fillRect(l - 20, GROUND - 2, r - l + 40, H - GROUND + 80);
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(l - 20, GROUND - 2, r - l + 40, 2);
  for (const d of groundDetail) {
    if (d.x < l - 30 || d.x > r + 30) continue;
    const zk = zoneKind(d.x), dirt = zk === 'road' || zk === 'mire';
    const zi = dirt ? 0 : 1;
    if (d.k === 'puddle' || (zk === 'mire' && d.k === 'grass' && d.y > GROUND + 40)) {
      ctx.fillStyle = zk === 'mire' ? 'rgba(60,80,40,0.4)' : 'rgba(70,40,45,0.35)'; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.w * 5, d.w * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (d.k === 'stone') {
      ctx.fillStyle = zi === 0 ? 'rgba(0,0,0,0.35)' : 'rgba(80,72,70,0.22)';
      if (zi === 0) { ctx.beginPath(); ctx.ellipse(d.x, d.y, d.w, d.w * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(d.x, d.y, d.w * 3.2, d.w * 0.9);
    } else if (zi === 0 && d.y < GROUND + 30) {
      ctx.strokeStyle = '#1f1a12'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(d.x, GROUND); ctx.lineTo(d.x - 3, GROUND - 7); ctx.moveTo(d.x + 2, GROUND); ctx.lineTo(d.x + 4, GROUND - 6); ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Props on the playfield
// ---------------------------------------------------------------------------
const PROP_CORPSE_POSE = basePose({ lean: 0, armF: 2.6, elbowF: 0.4, armB: 0.9, elbowB: 0.6, legF: 0.3, kneeF: 0.6, legB: -0.1, kneeB: 0.2, head: 0.5 });
const PROP_CORPSE_RIG = solveRig(PROP_CORPSE_POSE);

function drawProp(ctx, p, t, game) {
  const x = p.x, y = GROUND;
  switch (p.type) {
    case 'tree': drawTree(ctx, x, y + 2, p.h, p.seed, '#0d0a0a'); break;
    case 'cart':
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#2a1e15'; ctx.save(); ctx.rotate(-0.12); ctx.fillRect(-50, -34, 90, 10); ctx.fillRect(-50, -46, 6, 14); ctx.fillRect(34, -46, 6, 14); ctx.restore();
      ctx.strokeStyle = '#2a1e15'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-20, -16, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(-20 + Math.cos(a) * 16, -16 + Math.sin(a) * 16); ctx.lineTo(-20 - Math.cos(a) * 16, -16 - Math.sin(a) * 16); ctx.stroke(); }
      ctx.save(); ctx.translate(36, -4); ctx.rotate(1.2); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, -30); ctx.lineTo(80, -6); ctx.stroke();
      ctx.restore();
      break;
    case 'corpse': {
      const st = ENEMY_DEFS[p.style].style;
      ctx.save(); ctx.translate(x, y); ctx.scale(p.rot, 1); ctx.translate(-40, -5); ctx.rotate(Math.PI / 2);
      drawHumanoid(ctx, PROP_CORPSE_RIG, PROP_CORPSE_POSE, st, { head: p.style !== 'footman', armF: true, armB: p.style !== 'peasant', legF: true, legB: true }, { shield: false, t: 0 });
      ctx.restore();
      ctx.fillStyle = 'rgba(80,0,0,0.65)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 38, 6, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'gibbet': {
      ctx.fillStyle = '#16110e'; ctx.fillRect(x - 4, y - 200, 8, 200); ctx.fillRect(x - 4, y - 200, 70, 7);
      ctx.fillRect(x, y - 180, 30, 5); // brace
      ctx.save(); ctx.translate(x + 2, y - 176); ctx.rotate(-0.78); ctx.fillRect(0, 0, 34, 4); ctx.restore();
      ctx.fillStyle = '#2a2420'; ctx.fillRect(x + 56, y - 193, 1.5, 36);
      ctx.save(); ctx.translate(x + 57, y - 157); ctx.rotate(Math.sin(t * 0.9 + p.seed) * 0.06);
      const st = ENEMY_DEFS.peasant.style;
      const hp = basePose({ lean: 0, head: 0.6, armF: 0.05, elbowF: 0.05, armB: -0.05, elbowB: 0.05, legF: 0.05, kneeF: 0.02, legB: -0.03, kneeB: 0.02 });
      const j = solveRig(hp);
      ctx.translate(0, -j.head.y + RIG.headR);
      drawHumanoid(ctx, j, hp, st, { head: true, armF: true, armB: true, legF: true, legB: true }, { t: 0 });
      ctx.restore();
      break;
    }
    case 'pike': {
      ctx.fillStyle = '#1d150f'; ctx.fillRect(x - 2, y - 120, 4, 120);
      ctx.beginPath(); ctx.moveTo(x - 2, y - 120); ctx.lineTo(x, y - 132); ctx.lineTo(x + 2, y - 120); ctx.fill();
      if (!p.empty) {
        drawHead(ctx, { x, y: y - 122 }, 0.3, ENEMY_DEFS.peasant.style, 0);
        ctx.fillStyle = '#5a0000'; ctx.fillRect(x - 2, y - 114, 4, 30);
      }
      break;
    }
    case 'sign':
      ctx.fillStyle = '#1e1610'; ctx.fillRect(x - 3, y - 90, 6, 90);
      ctx.save(); ctx.translate(x, y - 78); ctx.rotate(-0.06);
      ctx.fillStyle = '#2e2218'; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(70, -12); ctx.lineTo(82, 0); ctx.lineTo(70, 12); ctx.lineTo(-6, 12); ctx.fill();
      ctx.fillStyle = '#8a7a5a'; ctx.font = `${p.text.length > 9 ? 8 : 10}px ${TITLE_FONT}`; ctx.textAlign = 'left'; ctx.fillText(p.text, 0, 4);
      ctx.restore();
      break;
    case 'house': {
      const w = p.w, h = 190;
      ctx.fillStyle = '#17100c'; ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#0e0907';
      ctx.beginPath(); ctx.moveTo(x - w / 2 - 14, y - h); ctx.lineTo(x - w * 0.1, y - h - 80); ctx.lineTo(x + w * 0.15, y - h - 60); ctx.lineTo(x + w * 0.25, y - h - 70); ctx.lineTo(x + w / 2 + 14, y - h); ctx.fill();
      ctx.strokeStyle = '#24170f'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.5); ctx.lineTo(x + w / 2, y - h * 0.5);
      ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 4, y - h * 0.5); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w / 4, y - h * 0.5); ctx.stroke();
      // door + windows
      ctx.fillStyle = '#060404'; ctx.fillRect(x - 18, y - 70, 36, 70);
      const fl = p.burning ? 0.6 + Math.sin(t * 13 + x) * 0.25 : 0.12;
      ctx.fillStyle = p.burning ? `rgba(255,${110 + Math.sin(t * 9) * 30},30,${fl})` : '#060404';
      ctx.fillRect(x - w / 2 + 22, y - h * 0.4, 26, 28); ctx.fillRect(x + w / 2 - 48, y - h * 0.4, 26, 28);
      ctx.fillRect(x - 14, y - h + 26, 28, 26);
      break;
    }
    case 'barricade':
      ctx.fillStyle = '#2a1d13';
      ctx.save(); ctx.translate(x, y);
      for (const [dx, a, len] of [[-30, -0.5, 70], [-5, 0.45, 74], [18, -0.35, 60]]) { ctx.save(); ctx.translate(dx, -4); ctx.rotate(a); ctx.fillRect(-len / 2, -4, len, 8); ctx.restore(); }
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-36, -34, 70, 9); ctx.fillRect(-28, -22, 60, 7);
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-14, -46, 4, 46); ctx.fillRect(12, -40, 4, 40);
      ctx.restore();
      break;
    case 'townwall': { // stone curtain wall with an open gatehouse
      const wx = x, e = p.east ? -1 : 1;
      ctx.fillStyle = '#24222a'; ctx.fillRect(wx - 40, y - 230, 80, 230);
      ctx.fillStyle = '#2c2a33'; for (let i = 0; i < 5; i++) ctx.fillRect(wx - 44 + i * 18, y - 246, 12, 18);
      ctx.fillStyle = '#0a0809'; ctx.beginPath(); ctx.moveTo(wx - 24, y); ctx.lineTo(wx - 24, y - 120); ctx.quadraticCurveTo(wx, y - 156, wx + 24, y - 120); ctx.lineTo(wx + 24, y); ctx.fill();
      ctx.strokeStyle = '#3a3638'; ctx.lineWidth = 2; // raised portcullis
      for (let i = -18; i <= 18; i += 9) { ctx.beginPath(); ctx.moveTo(wx + i, y - 150); ctx.lineTo(wx + i, y - 124); ctx.stroke(); }
      ctx.fillStyle = '#5a1418'; ctx.fillRect(wx + e * 30 - 8, y - 210, 16, 44); ctx.fillStyle = '#c9b77a'; ctx.beginPath(); ctx.arc(wx + e * 30, y - 192, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,190,100,${0.75 + Math.sin(t * 9 + x) * 0.15})`; ctx.beginPath(); ctx.arc(wx + 30 * e, y - 120, 4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'townhouse': { // intact timber-framed house with lit windows
      const w = p.w, h = 180;
      ctx.fillStyle = '#2a2420'; ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#1c1612'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 12, y - h); ctx.lineTo(x, y - h - 70); ctx.lineTo(x + w / 2 + 12, y - h); ctx.fill();
      ctx.strokeStyle = '#3b2c20'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.52); ctx.lineTo(x + w / 2, y - h * 0.52); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 4, y - h * 0.52); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w / 4, y - h * 0.52); ctx.stroke();
      ctx.fillStyle = '#120d0a'; ctx.fillRect(x - 16, y - 64, 32, 64);
      const wl = `rgba(255,${190 + (p.seed % 3) * 10},110,${0.75 + Math.sin(t * 1.5 + p.seed) * 0.06})`;
      ctx.fillStyle = wl; ctx.fillRect(x - w / 2 + 20, y - h * 0.4, 24, 24); ctx.fillRect(x + w / 2 - 44, y - h * 0.4, 24, 24); ctx.fillRect(x - 12, y - h + 22, 24, 22);
      ctx.strokeStyle = '#2a1d14'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - w / 2 + 32, y - h * 0.4); ctx.lineTo(x - w / 2 + 32, y - h * 0.4 + 24); ctx.moveTo(x + w / 2 - 32, y - h * 0.4); ctx.lineTo(x + w / 2 - 32, y - h * 0.4 + 24); ctx.stroke();
      if (p.tavern) {
        ctx.fillStyle = '#1a120c'; ctx.fillRect(x + 22, y - 120, 30, 3); ctx.fillRect(x + 50, y - 120, 2, 10);
        ctx.save(); ctx.translate(x + 51, y - 108); ctx.rotate(Math.sin(t * 1.2) * 0.08);
        ctx.fillStyle = '#4a3220'; ctx.fillRect(-14, 0, 28, 18); ctx.fillStyle = '#c9a35a'; ctx.font = `8px ${TITLE_FONT}`; ctx.textAlign = 'center'; ctx.fillText('ALE', 0, 12); ctx.restore();
      }
      break;
    }
    case 'hall': { // the reeve's hall
      ctx.fillStyle = '#2b2622'; ctx.fillRect(x - 120, y - 210, 240, 210);
      ctx.fillStyle = '#1d1814'; ctx.beginPath(); ctx.moveTo(x - 135, y - 210); ctx.lineTo(x, y - 300); ctx.lineTo(x + 135, y - 210); ctx.fill();
      ctx.fillStyle = '#3a2c20'; for (let i = -100; i <= 100; i += 40) ctx.fillRect(x + i - 4, y - 210, 8, 210);
      ctx.fillStyle = '#130e0a'; ctx.fillRect(x - 24, y - 90, 48, 90);
      ctx.fillStyle = 'rgba(255,196,110,0.75)'; ctx.fillRect(x - 70, y - 170, 22, 40); ctx.fillRect(x + 48, y - 170, 22, 40);
      ctx.fillStyle = '#2b4a6b'; ctx.fillRect(x - 10, y - 200, 20, 46); ctx.fillStyle = '#c9b77a'; ctx.beginPath(); ctx.arc(x, y - 182, 5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'stall': // market stall with a striped awning
      ctx.fillStyle = '#2a1d13'; ctx.fillRect(x - 46, y - 80, 4, 80); ctx.fillRect(x + 42, y - 80, 4, 80);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? p.col : '#c8b896'; ctx.beginPath(); ctx.moveTo(x - 50 + i * 17, y - 84); ctx.lineTo(x - 33 + i * 17, y - 84); ctx.lineTo(x - 33 + i * 17, y - 70); ctx.lineTo(x - 50 + i * 17, y - 66); ctx.fill(); }
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x - 46, y - 34, 92, 8);
      ctx.fillStyle = '#7a6a3a'; ctx.beginPath(); ctx.arc(x - 26, y - 38, 6, 0, Math.PI * 2); ctx.arc(x - 12, y - 38, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a2a1a'; ctx.beginPath(); ctx.arc(x + 14, y - 38, 5, 0, Math.PI * 2); ctx.arc(x + 26, y - 38, 5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'lamppost':
      ctx.fillStyle = '#16151a'; ctx.fillRect(x - 2.5, y - 120, 5, 120); ctx.fillRect(x - 2.5, y - 120, 16, 3);
      ctx.fillStyle = '#26252c'; ctx.fillRect(x + 8, y - 117, 10, 14);
      ctx.fillStyle = `rgba(255,200,120,${0.85 + Math.sin(t * 8 + x) * 0.1})`; ctx.fillRect(x + 10, y - 114, 6, 9);
      break;
    case 'board': // notice board
      ctx.fillStyle = '#2a1d13'; ctx.fillRect(x - 26, y - 70, 4, 70); ctx.fillRect(x + 22, y - 70, 4, 70);
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x - 30, y - 92, 60, 40);
      ctx.fillStyle = '#b8ab8c'; ctx.fillRect(x - 24, y - 88, 18, 22); ctx.fillRect(x - 2, y - 86, 22, 16); ctx.fillStyle = '#8a1a14'; ctx.fillRect(x + 4, y - 66, 14, 10);
      break;
    case 'forge': { // smithy with a glowing hearth
      ctx.fillStyle = '#2a2622'; ctx.fillRect(x - 70, y - 150, 140, 150);
      ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.moveTo(x - 80, y - 150); ctx.lineTo(x + 80, y - 150); ctx.lineTo(x + 60, y - 180); ctx.lineTo(x - 60, y - 180); ctx.fill();
      ctx.fillStyle = '#33302c'; ctx.fillRect(x + 30, y - 230, 26, 80);
      const fl = 0.75 + Math.sin(t * 11) * 0.15;
      ctx.fillStyle = `rgba(255,${120 + Math.sin(t * 7) * 30},40,${fl})`; ctx.fillRect(x - 50, y - 70, 50, 34);
      ctx.fillStyle = '#26232a'; ctx.fillRect(x + 6, y - 30, 40, 10); ctx.fillRect(x + 18, y - 20, 16, 20); // anvil
      if (chance(0.15)) FX.ember(x - 25 + rand(-10, 10), y - 74);
      break;
    }
    case 'chapel': { // Chapel of Saint Ysolde
      ctx.fillStyle = '#26232c'; ctx.fillRect(x - 180, y - 250, 360, 250);
      ctx.fillStyle = '#1b1920'; ctx.beginPath(); ctx.moveTo(x - 195, y - 250); ctx.lineTo(x, y - 350); ctx.lineTo(x + 195, y - 250); ctx.fill();
      ctx.fillStyle = '#211f27'; ctx.fillRect(x + 110, y - 420, 60, 170); // bell tower
      ctx.beginPath(); ctx.moveTo(x + 104, y - 420); ctx.lineTo(x + 140, y - 480); ctx.lineTo(x + 176, y - 420); ctx.fill();
      ctx.fillStyle = '#0c0b0f'; ctx.fillRect(x + 126, y - 405, 28, 34);
      ctx.fillStyle = '#6a5a3a'; ctx.beginPath(); ctx.arc(x + 140, y - 384, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(x + 131, y - 384, 18, 6);
      ctx.fillStyle = '#c9b77a'; ctx.fillRect(x + 139, y - 500, 2, 20); ctx.fillRect(x + 133, y - 494, 14, 2);
      // stained-glass rose window
      const rg = ctx.createRadialGradient(x, y - 260, 4, x, y - 260, 38);
      rg.addColorStop(0, '#f0d8a0'); rg.addColorStop(0.5, '#8a5ac0'); rg.addColorStop(1, '#3a2060');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y - 260, 36, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1b1920'; ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x, y - 260); ctx.lineTo(x + Math.cos(a) * 36, y - 260 + Math.sin(a) * 36); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y - 260, 14, 0, Math.PI * 2); ctx.stroke();
      // tall lancet windows
      for (const wx of [x - 130, x - 80, x + 80]) {
        const wg = ctx.createLinearGradient(0, y - 200, 0, y - 110);
        wg.addColorStop(0, '#b090e0'); wg.addColorStop(1, '#f0c890');
        ctx.fillStyle = wg; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(wx - 10, y - 110); ctx.lineTo(wx - 10, y - 185); ctx.quadraticCurveTo(wx, y - 205, wx + 10, y - 185); ctx.lineTo(wx + 10, y - 110); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // open doors with warm candlelight
      const dg = ctx.createLinearGradient(0, y - 140, 0, y);
      dg.addColorStop(0, 'rgba(255,200,120,0.5)'); dg.addColorStop(1, 'rgba(255,220,150,0.85)');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x - 34, y - 110); ctx.quadraticCurveTo(x, y - 150, x + 34, y - 110); ctx.lineTo(x + 34, y); ctx.fill();
      ctx.fillStyle = '#2a1d14'; ctx.fillRect(x - 50, y - 112, 16, 112); ctx.fillRect(x + 34, y - 112, 16, 112);
      ctx.fillStyle = '#e8dcc8'; ctx.font = `10px ${TITLE_FONT}`; ctx.textAlign = 'center'; ctx.fillText('SANCTA YSOLDA', x, y - 158);
      break;
    }
    case 'reeds':
      ctx.strokeStyle = '#1a2214'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 14; i++) { const rx = x + i * 6 - 40, rh = 30 + ((i * 53) % 40); ctx.beginPath(); ctx.moveTo(rx, y + 4); ctx.quadraticCurveTo(rx + 3, y - rh * 0.6, rx + Math.sin(t * 1.4 + i) * 4, y - rh); ctx.stroke(); }
      ctx.fillStyle = '#2a2014'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 30 + i * 18, y - 40 - (i * 11) % 18, 3, 9);
      break;
    case 'bog': { // sickly glowing pool
      const g = ctx.createRadialGradient(x, y + 6, 4, x, y + 6, p.w / 2);
      g.addColorStop(0, `rgba(110,150,60,${0.5 + Math.sin(t * 2 + x) * 0.1})`); g.addColorStop(1, 'rgba(40,60,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + 8, p.w / 2, 10, 0, 0, Math.PI * 2); ctx.fill();
      if (chance(0.03)) FX.add({ k: 'd', x: x + rand(-p.w / 3, p.w / 3), y: y + 4, vx: 0, vy: -20, t: 0, life: 0.8, r: 3 });
      break;
    }
    case 'boardwalk':
      ctx.fillStyle = '#2a2016'; for (let i = 0; i < p.w; i += 14) ctx.fillRect(x - p.w / 2 + i, y - 3, 11, 5);
      ctx.fillStyle = '#1e170f'; for (let i = 0; i < p.w; i += 60) ctx.fillRect(x - p.w / 2 + i, y - 18, 4, 22);
      break;
    case 'ruinchapel':
      ctx.fillStyle = '#1e2420'; ctx.fillRect(x - 150, y - 160, 30, 160); ctx.fillRect(x + 110, y - 210, 34, 210);
      ctx.beginPath(); ctx.moveTo(x - 150, y - 160); ctx.lineTo(x - 120, y - 200); ctx.lineTo(x - 110, y - 160); ctx.fill();
      ctx.fillRect(x + 60, y - 120, 20, 120);
      ctx.strokeStyle = '#1e2420'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x + 127, y - 210, 60, Math.PI, Math.PI * 1.45); ctx.stroke();
      ctx.fillStyle = '#2a3020'; ctx.fillRect(x - 160, y - 8, 320, 8);
      break;
    case 'well':
      ctx.fillStyle = '#2a2624'; ctx.fillRect(x - 32, y - 34, 64, 34);
      ctx.fillStyle = '#383330'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 32 + i * 16 + 1, y - 34, 14, 7);
      ctx.fillStyle = '#1a120c'; ctx.fillRect(x - 30, y - 90, 5, 56); ctx.fillRect(x + 25, y - 90, 5, 56);
      ctx.beginPath(); ctx.moveTo(x - 40, y - 86); ctx.lineTo(x, y - 110); ctx.lineTo(x + 40, y - 86); ctx.fill();
      break;
    case 'grave':
      ctx.fillStyle = '#1a1310'; ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 8, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#231a14';
      if (p.cross) { ctx.fillRect(x - 2, y - 46, 4, 46); ctx.fillRect(x - 12, y - 36, 24, 4); }
      else { ctx.fillStyle = '#2b2826'; rr(ctx, x - 10, y - 34, 20, 34, 8); ctx.fill(); }
      break;
    case 'cage': {
      ctx.fillStyle = '#16110e'; ctx.fillRect(x - 3, y - 230, 6, 230); ctx.fillRect(x - 3, y - 230, 50, 6);
      ctx.save(); ctx.translate(x + 40, y - 224); ctx.rotate(Math.sin(t * 0.7 + x) * 0.05);
      ctx.strokeStyle = '#2c2622'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = -14; i <= 14; i += 7) { ctx.beginPath(); ctx.moveTo(i * 0.6, 22); ctx.quadraticCurveTo(i, 50, i * 0.8, 74); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(0, 22, 9, 3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 74, 12, 3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#b8ad98'; ctx.beginPath(); ctx.arc(-2, 50, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-4, 54, 4, 14); ctx.fillRect(1, 58, 1.5, 14);
      ctx.restore();
      break;
    }
    case 'banner': {
      ctx.fillStyle = '#16110e'; ctx.fillRect(x - 2, y - 220, 4, 220);
      ctx.fillStyle = '#4a0b0b';
      ctx.beginPath(); ctx.moveTo(x + 2, y - 214);
      for (let i = 0; i <= 6; i++) ctx.lineTo(x + 2 + 40 + Math.sin(t * 2 + i) * 3, y - 214 + i * 16);
      ctx.lineTo(x + 30, y - 110); ctx.lineTo(x + 22, y - 126); ctx.lineTo(x + 14, y - 104); ctx.lineTo(x + 2, y - 118); ctx.fill();
      ctx.fillStyle = '#c9b77a'; ctx.beginPath(); ctx.arc(x + 22, y - 180, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a0b0b'; ctx.beginPath(); ctx.arc(x + 22, y - 180, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'pillar':
      ctx.fillStyle = '#16151a'; ctx.fillRect(x - 18, y - 300, 36, 300);
      ctx.fillStyle = '#1e1d23'; ctx.fillRect(x - 24, y - 300, 48, 14); ctx.fillRect(x - 24, y - 16, 48, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 6, y - 286, 12, 270);
      break;
    case 'statue': {
      const s = p.big ? 1.6 : 1;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#25242a'; ctx.fillRect(-22, -40, 44, 40);
      ctx.fillStyle = '#2f2e35';
      ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(-18, -110); ctx.quadraticCurveTo(0, -128, 18, -110); ctx.lineTo(14, -40); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -122, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-22, -104, 44, 6);
      ctx.fillStyle = '#7a0000'; ctx.fillRect(-4, -122, 1.5, 22); ctx.fillRect(3, -122, 1.5, 30);
      ctx.restore();
      break;
    }
    case 'candles':
      for (let i = 0; i < 7; i++) {
        const cx = x + i * 9 - 30, ch = 8 + ((i * 7) % 5) * 3;
        ctx.fillStyle = '#c8bc9e'; ctx.fillRect(cx, y - ch, 4, ch);
        ctx.fillStyle = `rgba(255,190,90,${0.7 + Math.sin(t * 11 + i) * 0.3})`; ctx.beginPath(); ctx.ellipse(cx + 2, y - ch - 4, 1.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'brazier':
      ctx.fillStyle = '#1b1a1e'; ctx.fillRect(x - 3, y - 60, 6, 60); ctx.fillRect(x - 14, y - 4, 28, 4);
      ctx.beginPath(); ctx.moveTo(x - 18, y - 70); ctx.lineTo(x + 18, y - 70); ctx.lineTo(x + 10, y - 56); ctx.lineTo(x - 10, y - 56); ctx.fill();
      break;
    case 'cathedral': {
      const open = game && game.flags.bossDead;
      ctx.fillStyle = '#0f0f13'; ctx.fillRect(x - 130, y - 420, 300, 420);
      ctx.fillStyle = '#16161b';
      ctx.beginPath(); ctx.moveTo(x - 140, y - 420); ctx.lineTo(x + 20, y - 520); ctx.lineTo(x + 180, y - 420); ctx.fill();
      ctx.fillStyle = '#0a0a0d'; ctx.beginPath(); ctx.arc(x + 20, y - 330, 40, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2a1a22'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + 20, y - 330); ctx.lineTo(x + 20 + Math.cos(a) * 40, y - 330 + Math.sin(a) * 40); ctx.stroke(); }
      ctx.fillStyle = 'rgba(150,20,20,0.25)'; ctx.beginPath(); ctx.arc(x + 20, y - 330, 38, 0, Math.PI * 2); ctx.fill();
      // doors
      ctx.fillStyle = '#060507';
      ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x - 40, y - 150); ctx.quadraticCurveTo(x + 20, y - 220, x + 80, y - 150); ctx.lineTo(x + 80, y); ctx.fill();
      if (open) {
        const gl = ctx.createLinearGradient(0, y - 180, 0, y);
        gl.addColorStop(0, 'rgba(160,20,20,0.05)'); gl.addColorStop(1, `rgba(190,30,20,${0.35 + Math.sin(t * 1.4) * 0.12})`);
        ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 30, y - 145); ctx.quadraticCurveTo(x + 20, y - 205, x + 70, y - 145); ctx.lineTo(x + 70, y); ctx.fill();
      } else {
        ctx.fillStyle = '#211812'; ctx.fillRect(x - 34, y - 150, 52, 150); ctx.fillRect(x + 22, y - 150, 52, 150);
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x - 34, y - 100, 108, 6); ctx.fillRect(x - 34, y - 40, 108, 6);
      }
      break;
    }
  }
}

// Shrines: stone altars topped with a grey lantern
function drawShrine(ctx, s, t, kindled, near) {
  const x = s.x, y = GROUND;
  ctx.fillStyle = '#26232a'; ctx.fillRect(x - 26, y - 36, 52, 36);
  ctx.fillStyle = '#322e36'; ctx.fillRect(x - 32, y - 42, 64, 8);
  ctx.fillStyle = '#1b181e'; ctx.fillRect(x - 3, y - 74, 6, 32);
  ctx.fillRect(x - 12, y - 76, 24, 4);
  // lantern
  ctx.fillStyle = '#3a3a40'; ctx.fillRect(x - 9, y - 100, 18, 3); ctx.fillRect(x - 7, y - 97, 14, 20);
  ctx.beginPath(); ctx.moveTo(x - 9, y - 100); ctx.lineTo(x, y - 110); ctx.lineTo(x + 9, y - 100); ctx.fill();
  const f = kindled ? 0.8 + Math.sin(t * 7) * 0.12 + Math.sin(t * 13) * 0.06 : 0.12;
  ctx.fillStyle = kindled ? `rgba(255,190,100,${f})` : 'rgba(120,120,140,0.25)';
  ctx.fillRect(x - 5, y - 95, 10, 16);
  if (kindled) {
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(x, y - 88, 2, x, y - 88, 150);
    gr.addColorStop(0, `rgba(255,170,80,${0.32 * f})`); gr.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - 150, y - 240, 300, 300);
    ctx.globalCompositeOperation = 'source-over';
    if (chance(0.08)) FX.ember(x + rand(-6, 6), y - 92);
  }
  if (near && !kindled) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(200,200,255,${0.08 + Math.sin(t * 3) * 0.04})`;
    ctx.beginPath(); ctx.arc(x, y - 88, 20, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}

// NPCs
const NPC_STYLES = {
  osric: {
    helm: 'cowl', hood: '#3b3127', skin: '#b39882', armor: '#3b3127', armorDark: '#2f271f', armorLight: '#4a3f33',
    body: '#3b3127', tabard: '#2f271f', tabardLen: 26, leg: '#3b3127', legDark: '#2f271f', boot: '#1d1813', bootDark: '#16120e',
    hand: '#b39882', limbW: 7, hipW: 9, shW: 10, belt: '#6a5a40',
  },
  wren: {
    helm: 'kerchief', kerchief: '#6b2a22', hair: '#4a2d18', skin: '#c9a68c', armor: '#57473a', armorDark: '#46392e', armorLight: '#6a5848',
    body: '#625040', tabard: '#3f3328', tabardLen: 18, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
    hand: '#c9a68c', limbW: 5, hipW: 7, shW: 8,
  },
};

function drawNPC(ctx, n, t, game) {
  const x = n.x, y = GROUND;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (n.id === 'osric') {
    // sitting against the cart, clutching his side
    const pose = basePose({ lean: -0.35 + Math.sin(t * 1.3) * 0.02, head: 0.35, armF: 0.6, elbowF: 1.9, armB: 0.3, elbowB: 1.6, legF: 1.5, kneeF: 0.15, legB: 1.35, kneeB: 0.4 });
    const j = solveRig(pose);
    ctx.save(); ctx.translate(x, y + 10); ctx.scale(-1, 1);
    drawHumanoid(ctx, j, pose, NPC_STYLES.osric, { head: true, armF: true, armB: true, legF: true, legB: true }, { t });
    ctx.restore();
    ctx.fillStyle = 'rgba(90,0,0,0.6)'; ctx.beginPath(); ctx.ellipse(x - 6, y + 5, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (n.id === 'wren') {
    const dig = (Math.sin(t * 2.4) + 1) / 2;
    const pose = basePose({ lean: 0.3 + dig * 0.35, head: 0.2, armF: 0.9 + dig * 0.6, elbowF: 0.8 - dig * 0.4, armB: 0.6 + dig * 0.5, elbowB: 1.0, weap: 0.4 + dig * 0.4, legF: 0.45, kneeF: 0.5, legB: -0.3, kneeB: 0.3 });
    const j = solveRig(pose);
    ctx.save(); ctx.translate(x, y); ctx.scale(-0.82, 0.82);
    drawHumanoid(ctx, j, pose, NPC_STYLES.wren, { head: true, armF: true, armB: true, legF: true, legB: true }, { weapon: c => drawWeaponShape(c, 'shovel', 0), t });
    ctx.restore();
    ctx.fillStyle = '#16100c'; ctx.beginPath(); ctx.ellipse(x - 42, y + 2, 26, 6, 0, Math.PI, 0); ctx.fill();
  }
}

// Notes lying on the ground (a pale scrap with a glimmer)
function drawNote(ctx, n, t, read) {
  const x = n.x, y = GROUND;
  ctx.fillStyle = '#b8ab8c'; ctx.save(); ctx.translate(x, y - 2); ctx.rotate(-0.15); ctx.fillRect(-7, -3, 14, 5); ctx.restore();
  if (!read) {
    ctx.globalCompositeOperation = 'lighter';
    const a = 0.25 + Math.sin(t * 3 + x) * 0.15;
    const g = ctx.createRadialGradient(x, y - 6, 0, x, y - 6, 22);
    g.addColorStop(0, `rgba(240,220,170,${a})`); g.addColorStop(1, 'rgba(240,220,170,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 22, y - 28, 44, 44);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Fog wall that seals the boss arena
function drawFogGate(ctx, x, t) {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const yy = GROUND - 30 - i * 45;
    const xx = x + Math.sin(t * 1.3 + i) * 8;
    const g = ctx.createRadialGradient(xx, yy, 2, xx, yy, 70);
    g.addColorStop(0, 'rgba(200,200,215,0.14)'); g.addColorStop(1, 'rgba(200,200,215,0)');
    ctx.fillStyle = g; ctx.fillRect(xx - 70, yy - 70, 140, 140);
  }
  ctx.fillStyle = 'rgba(210,210,230,0.06)'; ctx.fillRect(x - 12, GROUND - 300, 24, 300);
  ctx.globalCompositeOperation = 'source-over';
}

// Weather & lighting overlays (screen space)
const Weather = {
  drops: [], ash: [],
  init() {
    for (let i = 0; i < 160; i++) this.drops.push({ x: rand(0, W), y: rand(0, H), v: rand(600, 900), l: rand(10, 20) });
    for (let i = 0; i < 70; i++) this.ash.push({ x: rand(0, W), y: rand(0, H), v: rand(15, 45), ph: rand(0, 6), r: rand(1, 2.4), hot: chance(0.35) });
  },
  draw(ctx, dt, playerX, camDX) {
    const zi = zoneIndex(playerX);
    const w = ZONES[zi].weather;
    if (w === 'rain') {
      ctx.strokeStyle = 'rgba(170,170,190,0.22)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of this.drops) {
        d.y += d.v * dt; d.x -= d.v * 0.18 * dt + camDX * 0.6;
        if (d.y > H) { d.y = -20; d.x = rand(0, W + 100); }
        if (d.x < -20) d.x += W + 40; if (d.x > W + 40) d.x -= W + 60;
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.18, d.y - d.l);
      }
      ctx.stroke();
    } else if (w === 'mist') {
      // drifting marsh fog and sickly spores
      this.mistX = (this.mistX || 0) + dt * 8 + camDX * 0.3;
      for (let i = 0; i < 5; i++) {
        const mx = ((i * 260 - this.mistX * (1 + i * 0.2)) % (W + 400) + W + 400) % (W + 400) - 200;
        const my = H - 120 + Math.sin(i * 2 + this.mistX * 0.01) * 20;
        const g = ctx.createRadialGradient(mx, my, 10, mx, my, 220);
        g.addColorStop(0, 'rgba(120,150,110,0.12)'); g.addColorStop(1, 'rgba(120,150,110,0)');
        ctx.fillStyle = g; ctx.fillRect(mx - 220, my - 220, 440, 440);
      }
      for (const a of this.ash) {
        a.y -= a.v * 0.3 * dt; a.x += Math.sin(a.ph + a.y * 0.02) * 14 * dt - camDX * 0.5;
        if (a.y < -5) { a.y = H + 5; a.x = rand(0, W); }
        if (a.x < -10) a.x += W + 20; if (a.x > W + 10) a.x -= W + 20;
        ctx.fillStyle = `rgba(170,200,110,${0.25 + Math.sin(a.ph + a.y * 0.05) * 0.2})`;
        ctx.fillRect(a.x, a.y, a.r, a.r);
      }
    } else {
      for (const a of this.ash) {
        a.y += a.v * dt; a.x += Math.sin(a.ph + a.y * 0.02) * 20 * dt - camDX * 0.5;
        if (a.y > H) { a.y = -5; a.x = rand(0, W); }
        if (a.x < -10) a.x += W + 20; if (a.x > W + 10) a.x -= W + 20;
        ctx.fillStyle = a.hot ? `rgba(255,140,60,${0.5 + Math.sin(a.ph + a.y * 0.1) * 0.3})` : 'rgba(150,140,135,0.5)';
        ctx.fillRect(a.x, a.y, a.r, a.r);
      }
    }
  },
};
