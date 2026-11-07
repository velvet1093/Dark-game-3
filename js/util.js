'use strict';
// ---------------------------------------------------------------------------
// Core constants, math helpers and input handling
// ---------------------------------------------------------------------------
const W = 960, H = 540, GROUND = 440, GRAVITY = 1500;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const chance = p => Math.random() < p;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const nowSec = () => performance.now() / 1000;

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// weighted random key from {key: weight}
function weightedPick(weights, allow) {
  let total = 0;
  const keys = [];
  for (const k in weights) {
    if (weights[k] > 0 && (!allow || allow(k))) { total += weights[k]; keys.push(k); }
  }
  if (!keys.length) return null;
  let r = Math.random() * total;
  for (const k of keys) { r -= weights[k]; if (r <= 0) return k; }
  return keys[keys.length - 1];
}

// seeded RNG (mulberry32) for deterministic scenery
function seeded(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

// ---------------------------------------------------------------------------
// Input: keyboard + mouse, with press buffering so combos feel responsive
// ---------------------------------------------------------------------------
const Input = {
  keys: {},
  pressedAt: {},
  bind: {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    light: ['KeyJ', 'Mouse0'],
    heavy: ['KeyK', 'Mouse2'],
    block: ['KeyL', 'KeyC'],
    roll: ['Space'],
    sprint: ['ShiftLeft', 'ShiftRight'],
    flask: ['KeyQ'],
    swap: ['KeyX'],
    tonic: ['KeyT', 'KeyR'],
    interact: ['KeyE'],
    execute: ['KeyF'],
    pause: ['Escape', 'KeyP'],
    confirm: ['Enter', 'KeyE', 'Space', 'Mouse0'],
    back: ['Escape', 'Backspace'],
    mute: ['KeyM'],
  },
  init(target) {
    const block = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    addEventListener('keydown', e => {
      if (block.includes(e.code)) e.preventDefault();
      if (!e.repeat) { this.keys[e.code] = true; this.pressedAt[e.code] = nowSec(); }
      Sfx.init();
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    target.addEventListener('mousedown', e => {
      const c = 'Mouse' + e.button;
      this.keys[c] = true; this.pressedAt[c] = nowSec();
      Sfx.init();
      e.preventDefault();
    });
    addEventListener('mouseup', e => { this.keys['Mouse' + e.button] = false; });
    target.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('blur', () => { this.keys = {}; });
  },
  down(a) { return this.bind[a].some(c => this.keys[c]); },
  // true if the action was pressed within `win` seconds; consumes the press
  take(a, win = 0.2) {
    const t = nowSec();
    for (const c of this.bind[a]) {
      const p = this.pressedAt[c];
      if (p !== undefined && t - p <= win) {
        for (const c2 of this.bind[a]) delete this.pressedAt[c2];
        return true;
      }
    }
    return false;
  },
  clear() { this.pressedAt = {}; },
};
