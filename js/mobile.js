'use strict';
// ---------------------------------------------------------------------------
// Mobile layer: touch controls, fullscreen, landscape lock and haptics.
// Touch input is fed into the same Input key table the keyboard uses, so the
// rest of the game does not care where a press came from.
// Force it on a desktop browser with ?touch in the URL.
// ---------------------------------------------------------------------------
const Mobile = {
  enabled: false,
  tap: null,          // last tap in canvas coordinates, consumed by menus
  stick: null,        // active joystick { id, ox, oy, x, y }
  el: {},

  init(canvas) {
    this.canvas = canvas;
    this.enabled = /[?&]touch\b/.test(location.search) ||
      (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
      ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    if (!this.enabled) return;
    document.body.classList.add('touch');
    this.build();
  },

  // ------------------------------------------------------------ key plumbing
  press(code) {
    if (!Input.keys[code]) Input.pressedAt[code] = nowSec();
    Input.keys[code] = true;
    Sfx.init();
  },
  release(code) { Input.keys[code] = false; },

  buzz(ms) {
    if (this.enabled && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* unsupported */ } }
  },

  takeTap() { const t = this.tap; this.tap = null; return t; },

  toCanvas(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H };
  },

  // ------------------------------------------------------------ fullscreen
  fsSupported() {
    const d = document.documentElement;
    return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !!(d.requestFullscreen || d.webkitRequestFullscreen);
  },
  isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
  enterFullscreen() {
    if (!this.fsSupported() || this.isFullscreen()) return;
    const d = document.documentElement;
    try {
      const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen();
      if (p && p.then) p.then(() => this.lockLandscape()).catch(() => {});
      else this.lockLandscape();
    } catch (e) { /* blocked (e.g. inside a frame) */ }
  },
  exitFullscreen() {
    try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* ignore */ }
  },
  lockLandscape() {
    try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* ignore */ }
  },

  // ------------------------------------------------------------ DOM
  build() {
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div class="zone" id="t-zone"></div>
      <div class="stick" id="t-stick"><div class="knob" id="t-knob"></div></div>
      <div class="top">
        <button class="tb small" id="t-snd" aria-label="Sound">♪</button>
        <button class="tb small" id="t-fs" aria-label="Fullscreen">⛶</button>
        <button class="tb small" data-code="Escape" aria-label="Pause">❚❚</button>
      </div>
      <div class="cluster">
        <button class="tb big" data-code="KeyJ" aria-label="Attack"><span>⚔</span><i>ATTACK</i></button>
        <button class="tb mid heavy" data-code="KeyK" aria-label="Heavy attack"><span>✦</span><i>HEAVY</i></button>
        <button class="tb mid roll" data-code="Space" aria-label="Roll"><span>⟳</span><i>ROLL</i></button>
        <button class="tb mid guard" data-code="KeyL" aria-label="Guard"><span>⛨</span><i>GUARD</i></button>
        <button class="tb mid flask" data-code="KeyQ" aria-label="Drink vial"><span>⚱</span><i id="t-vials">VIAL</i></button>
        <button class="tb mid swap" data-code="KeyX" aria-label="Switch weapon"><span>⇄</span><i id="t-weap">WEAPON</i></button>
        <button class="tb mid tonic" data-code="KeyT" aria-label="Drink tonic"><span>✚</span><i id="t-tonics">TONIC</i></button>
        <button class="tb ctx exec" data-code="KeyF" aria-label="Execute"><span>☠</span><i>EXECUTE</i></button>
        <button class="tb ctx use" data-code="KeyE" aria-label="Interact"><span>✋</span><i id="t-use">USE</i></button>
      </div>
      <div id="rotate"><div><div class="phone"></div><p>Turn your device sideways</p><small>Ashen Oath is played in landscape</small></div></div>`;
    document.body.appendChild(root);
    this.el = {
      root, zone: root.querySelector('#t-zone'), stick: root.querySelector('#t-stick'), knob: root.querySelector('#t-knob'),
      fs: root.querySelector('#t-fs'), vials: root.querySelector('#t-vials'), tonics: root.querySelector('#t-tonics'), weap: root.querySelector('#t-weap'), use: root.querySelector('#t-use'),
      exec: root.querySelector('.exec'), useBtn: root.querySelector('.use'),
    };
    if (!this.fsSupported()) this.el.fs.style.display = 'none';

    // buttons
    root.querySelectorAll('button[data-code]').forEach(b => {
      const code = b.dataset.code;
      const down = e => { e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } b.classList.add('on'); this.press(code); this.firstTouch(); };
      const up = e => { e.preventDefault(); b.classList.remove('on'); this.release(code); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    });
    this.el.snd = root.querySelector('#t-snd');
    this.el.snd.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sfx.init(); Sfx.toggleMute(); });
    this.el.fs.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      if (this.isFullscreen()) this.exitFullscreen(); else this.enterFullscreen();
    });

    // joystick + taps on the open screen
    const z = this.el.zone;
    z.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.firstTouch();
      const p = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY, t: nowSec(), moved: false };
      try { z.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      // only the left half drives the joystick, the right half only taps
      if (e.clientX < innerWidth * 0.5 && !this.stick) {
        this.stick = p;
        const s = this.el.stick.style;
        s.left = `${e.clientX}px`; s.top = `${e.clientY}px`;
        this.el.stick.classList.add('show');
        this.el.knob.style.transform = 'translate(-50%,-50%)';
      } else {
        this.pendingTap = p;
      }
    });
    z.addEventListener('pointermove', e => {
      const s = this.stick;
      if (s && s.id === e.pointerId) { s.x = e.clientX; s.y = e.clientY; this.updateStick(); }
      const t = this.pendingTap;
      if (t && t.id === e.pointerId && Math.hypot(e.clientX - t.ox, e.clientY - t.oy) > 14) t.moved = true;
    });
    const end = e => {
      const s = this.stick;
      if (s && s.id === e.pointerId) {
        const short = nowSec() - s.t < 0.3 && !s.moved;
        this.stick = null; this.updateStick();
        this.el.stick.classList.remove('show');
        if (short && e.type === 'pointerup') this.doTap(e.clientX, e.clientY);
      }
      const t = this.pendingTap;
      if (t && t.id === e.pointerId) {
        this.pendingTap = null;
        if (!t.moved && e.type === 'pointerup') this.doTap(e.clientX, e.clientY);
      }
    };
    z.addEventListener('pointerup', end);
    z.addEventListener('pointercancel', end);

    // stop the browser scrolling / zooming / long-press menus
    for (const ev of ['touchstart', 'touchmove', 'gesturestart', 'dblclick', 'contextmenu']) {
      root.addEventListener(ev, e => e.preventDefault(), { passive: false });
    }
  },

  doTap(cx, cy) {
    this.tap = this.toCanvas(cx, cy);
    this.press('Enter');
    setTimeout(() => this.release('Enter'), 60);
  },

  // the first touch on a phone goes fullscreen + landscape when allowed
  firstTouch() {
    if (this.didFirst) return;
    this.didFirst = true;
    this.enterFullscreen();
  },

  updateStick() {
    const s = this.stick;
    const set = (code, on) => (on ? this.press(code) : this.release(code));
    if (!s) {
      for (const c of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ShiftLeft']) this.release(c);
      return;
    }
    const max = 56;
    let dx = s.x - s.ox, dy = s.y - s.oy;
    const d = Math.hypot(dx, dy);
    if (d > 10) s.moved = true;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    this.el.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    set('ArrowLeft', dx < -16 && ax > ay * 0.5);
    set('ArrowRight', dx > 16 && ax > ay * 0.5);
    set('ArrowDown', dy > 24 && ay > ax * 0.6);
    set('ArrowUp', dy < -24 && ay > ax * 0.6);
    set('ShiftLeft', ax > max * 0.88 && ay < ax * 0.6); // push to the rim to sprint
  },

  // called every frame by the renderer
  sync(g) {
    if (!this.enabled) return;
    const st = g.state;
    if (st !== this.lastState) { this.el.root.dataset.state = st; this.lastState = st; if (st !== 'play') { this.stick = null; this.updateStick(); this.el.stick.classList.remove('show'); } }
    if (st === 'play' && g.player) {
      const p = g.player;
      const ex = !p.busy && !g.exec && !!g.findExecutable();
      this.el.exec.classList.toggle('show', ex);
      const it = !ex && !p.busy && g.interactTarget;
      this.el.useBtn.classList.toggle('show', !!it);
      if (it && this.el.use.textContent !== it.label.split(' ')[0].toUpperCase()) this.el.use.textContent = it.label.split(' ')[0].toUpperCase();
      const v = `VIAL ${p.flasks}`;
      if (this.el.vials.textContent !== v) this.el.vials.textContent = v;
      this.el.weap.parentNode.style.display = p.owned.length > 1 ? 'flex' : 'none';
      const wk = p.weapon.kind.split(' ').pop().toUpperCase();
      if (this.el.weap.textContent !== wk) this.el.weap.textContent = wk;
      const tn = `TONIC ${p.tonics}`;
      if (this.el.tonics.textContent !== tn) this.el.tonics.textContent = tn;
      this.el.tonics.parentNode.classList.toggle('urgent', !!p.turning);
    }
    if (Sfx.muted !== this.lastMute) { this.lastMute = Sfx.muted; this.el.snd.style.opacity = Sfx.muted ? '0.4' : '1'; this.el.snd.textContent = Sfx.muted ? '✕♪' : '♪'; }
    const fs = this.isFullscreen();
    if (fs !== this.lastFs) { this.lastFs = fs; this.el.fs.textContent = fs ? '✕' : '⛶'; }
  },
};
