'use strict';
// ---------------------------------------------------------------------------
// Procedural audio — every sound and every note of music is synthesized with
// WebAudio. No audio files.
//   Sfx   : one-shot sound effects + weather/fire ambience
//   Music : a small step sequencer with crossfading tracks per area
// ---------------------------------------------------------------------------
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const Sfx = {
  ctx: null, out: null, sfxBus: null, muted: false, noiseBuf: null, ambience: null,
  vol: 0.6, lastPlay: {},

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.out = c.createGain();
      this.out.gain.value = this.muted ? 0 : this.vol;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      this.out.connect(comp); comp.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = 1; this.sfxBus.connect(this.out);
      const len = c.sampleRate * 2;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
      // shared hall reverb (used by music and a few effects)
      const rl = Math.floor(c.sampleRate * 3.2);
      const ir = c.createBuffer(2, rl, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = ir.getChannelData(ch);
        for (let i = 0; i < rl; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.6);
      }
      this.reverb = c.createConvolver(); this.reverb.buffer = ir;
      this.reverbOut = c.createGain(); this.reverbOut.gain.value = 0.5;
      this.reverb.connect(this.reverbOut); this.reverbOut.connect(this.out);
      this.sfxVerb = c.createGain(); this.sfxVerb.gain.value = 0.18; this.sfxVerb.connect(this.reverb);
      this.sfxBus.connect(this.sfxVerb);
      Music.attach(c, this.out, this.reverb);
    } catch (e) { this.ctx = null; }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.out) this.out.gain.value = this.muted ? 0 : this.vol;
    return this.muted;
  },

  noise(o) {
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + o.dur);
    f.Q.value = o.q || 1;
    const g = c.createGain(); const a = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.5, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus);
    s.start(t, Math.random()); s.stop(t + o.dur + 0.05);
  },

  tone(o) {
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.freqTo) osc.frequency.exponentialRampToValueAtTime(o.freqTo, t + o.dur);
    const g = c.createGain(); const a = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(o.bus || this.sfxBus);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  },

  // a short "voiced" grunt: sawtooth through vowel formants
  voice(f0, dur, vol, formants, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.7, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const fq of formants) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 6;
      o.connect(bp); bp.connect(g);
    }
    g.connect(this.sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  },

  // minimum spacing per sound so swarms of particles don't machine-gun audio
  limits: { step: 0.06, thud: 0.08, splat: 0.05, slash: 0.04, crackle: 0.05, groan: 0.5, grunt: 0.12, fairy: 0.25, drip: 0.08, ember: 0.1 },

  play(name) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime, lim = this.limits[name];
    if (lim && this.lastPlay[name] && now - this.lastPlay[name] < lim) return;
    this.lastPlay[name] = now;
    const fn = this.lib[name];
    if (fn) { try { fn.call(this); } catch (e) { /* ignore audio errors */ } }
  },

  lib: {
    swing() { this.noise({ dur: 0.2, freq: 700, freqTo: 2800, q: 1.4, vol: 0.3, attack: 0.05 }); },
    heavySwing() { this.noise({ dur: 0.34, freq: 260, freqTo: 1600, q: 1.1, vol: 0.45, attack: 0.1 }); },
    slash() {
      this.noise({ dur: 0.1, freq: 2400, q: 0.8, vol: 0.45 });
      this.noise({ dur: 0.26, type: 'lowpass', freq: 800, freqTo: 180, vol: 0.6 });
      this.tone({ freq: 130, freqTo: 45, dur: 0.16, type: 'sine', vol: 0.5 });
      this.noise({ dur: 0.18, type: 'bandpass', freq: 420, q: 3, vol: 0.25, delay: 0.03 }); // wet squelch
    },
    splat() { this.noise({ dur: 0.32, type: 'lowpass', freq: 900, freqTo: 160, vol: 0.5, attack: 0.01 }); },
    sever() {
      this.noise({ dur: 0.07, type: 'highpass', freq: 3200, vol: 0.45 });
      this.noise({ dur: 0.45, type: 'lowpass', freq: 1300, freqTo: 140, vol: 0.75 });
      this.tone({ freq: 90, freqTo: 30, dur: 0.32, type: 'triangle', vol: 0.6 });
      this.noise({ dur: 0.05, type: 'bandpass', freq: 1800, q: 4, vol: 0.4, delay: 0.02 }); // bone crack
      this.noise({ dur: 0.6, type: 'bandpass', freq: 600, freqTo: 250, q: 2, vol: 0.3, delay: 0.08 }); // spurt
    },
    clang() {
      this.tone({ freq: 1650, dur: 0.45, type: 'triangle', vol: 0.22 });
      this.tone({ freq: 2470, dur: 0.3, type: 'sine', vol: 0.16 });
      this.noise({ dur: 0.09, type: 'highpass', freq: 4000, vol: 0.4 });
    },
    parry() {
      this.tone({ freq: 2100, dur: 0.7, type: 'triangle', vol: 0.3 });
      this.tone({ freq: 3150, dur: 0.6, type: 'sine', vol: 0.2 });
      this.tone({ freq: 4200, dur: 0.4, type: 'sine', vol: 0.12 });
      this.noise({ dur: 0.12, type: 'highpass', freq: 3500, vol: 0.5 });
    },
    hurt() {
      this.voice(150, 0.28, 0.35, [700, 1200]);
      this.noise({ dur: 0.2, type: 'lowpass', freq: 700, vol: 0.5 });
    },
    roll() {
      this.noise({ dur: 0.32, type: 'lowpass', freq: 520, vol: 0.32, attack: 0.05 });
      this.tone({ freq: 300, dur: 0.08, type: 'square', vol: 0.03, delay: 0.1 }); // armour rattle
      this.tone({ freq: 410, dur: 0.06, type: 'square', vol: 0.03, delay: 0.22 });
    },
    step() { this.noise({ dur: 0.05, type: 'lowpass', freq: 320, vol: 0.12 }); },
    stepStone() { this.noise({ dur: 0.04, type: 'bandpass', freq: 1400, q: 2, vol: 0.08 }); this.noise({ dur: 0.05, type: 'lowpass', freq: 260, vol: 0.1 }); },
    thud() { this.noise({ dur: 0.12, type: 'lowpass', freq: 380, vol: 0.32 }); },
    flask() {
      this.noise({ dur: 0.25, type: 'bandpass', freq: 900, q: 5, vol: 0.12 }); // gulp
      this.tone({ freq: 660, dur: 0.6, type: 'sine', vol: 0.12, attack: 0.05, delay: 0.15 });
      this.tone({ freq: 990, dur: 0.8, type: 'sine', vol: 0.09, attack: 0.1, delay: 0.27 });
      this.tone({ freq: 1320, dur: 0.9, type: 'sine', vol: 0.06, attack: 0.1, delay: 0.39 });
    },
    death() {
      this.voice(120, 0.9, 0.3, [600, 1000]);
      this.tone({ freq: 110, freqTo: 36, dur: 1.8, type: 'sawtooth', vol: 0.2, attack: 0.05 });
      this.noise({ dur: 1.4, type: 'lowpass', freq: 500, freqTo: 80, vol: 0.4 });
      [146.8, 174.6, 220, 277.2].forEach((f, i) => this.tone({ freq: f, dur: 5, type: 'sine', vol: 0.12, delay: 0.7 + i * 0.05, attack: 0.4 }));
    },
    enemyDie() {
      this.voice(210, 0.6, 0.22, [500, 900]);
      this.noise({ dur: 0.4, type: 'lowpass', freq: 400, vol: 0.3 });
    },
    grunt() { this.voice(rand(150, 210), 0.22, 0.2, [600, 1050]); },
    groan() { this.voice(rand(90, 120), 0.9, 0.12, [450, 800]); },
    bossGrunt() { this.voice(85, 0.4, 0.35, [500, 850]); this.noise({ dur: 0.3, type: 'lowpass', freq: 300, vol: 0.2 }); },
    roar() {
      this.voice(70, 1.5, 0.45, [400, 700, 2400]);
      this.tone({ freq: 72, freqTo: 55, dur: 1.4, type: 'sawtooth', vol: 0.3, attack: 0.1 });
      this.noise({ dur: 1.3, type: 'bandpass', freq: 380, q: 0.7, vol: 0.5, attack: 0.15 });
    },
    slam() {
      this.tone({ freq: 62, freqTo: 24, dur: 0.7, type: 'sine', vol: 0.9 });
      this.noise({ dur: 0.65, type: 'lowpass', freq: 320, freqTo: 60, vol: 0.85 });
      this.noise({ dur: 0.4, type: 'bandpass', freq: 2000, q: 1, vol: 0.15, delay: 0.05 }); // debris
    },
    shrine() {
      [262, 330, 392, 523, 659].forEach((f, i) =>
        this.tone({ freq: f, dur: 2.6, type: 'sine', vol: 0.08, attack: 0.3, delay: i * 0.09 }));
      this.noise({ dur: 1.2, type: 'highpass', freq: 5000, vol: 0.05, attack: 0.3 });
    },
    kindle() {
      this.noise({ dur: 0.6, type: 'bandpass', freq: 1200, freqTo: 400, q: 1, vol: 0.3, attack: 0.02 });
      this.tone({ freq: 196, dur: 3, type: 'sine', vol: 0.15, attack: 0.05, delay: 0.1 });
    },
    ui() { this.tone({ freq: 420, dur: 0.06, type: 'square', vol: 0.04 }); },
    confirm() { this.tone({ freq: 523, dur: 0.15, type: 'triangle', vol: 0.08 }); this.tone({ freq: 784, dur: 0.2, type: 'triangle', vol: 0.06, delay: 0.06 }); },
    page() { this.noise({ dur: 0.25, type: 'highpass', freq: 2500, vol: 0.12, attack: 0.05 }); },
    bell() {
      this.tone({ freq: 98, dur: 5, type: 'sine', vol: 0.32, attack: 0.01 });
      this.tone({ freq: 196, dur: 4, type: 'sine', vol: 0.14, attack: 0.01 });
      this.tone({ freq: 293, dur: 3, type: 'sine', vol: 0.07, attack: 0.01 });
      this.tone({ freq: 466, dur: 2, type: 'sine', vol: 0.04, attack: 0.01 });
    },
    execute() {
      this.tone({ freq: 55, freqTo: 28, dur: 0.9, type: 'sine', vol: 0.9 });
      this.noise({ dur: 0.12, type: 'highpass', freq: 2500, vol: 0.5 });
      this.noise({ dur: 0.7, type: 'lowpass', freq: 1100, freqTo: 120, vol: 0.8 });
      this.tone({ freq: 1200, freqTo: 300, dur: 0.6, type: 'sine', vol: 0.05, delay: 0.05 }); // eerie sting
    },
    ember() { this.tone({ freq: 880, freqTo: 1500, dur: 0.25, type: 'sine', vol: 0.06 }); },
    hemorrhage() {
      this.noise({ dur: 0.6, type: 'lowpass', freq: 1500, freqTo: 120, vol: 0.8 });
      this.tone({ freq: 70, freqTo: 35, dur: 0.5, type: 'sine', vol: 0.6 });
    },
    drip() { this.tone({ freq: rand(900, 1400), freqTo: 300, dur: 0.08, type: 'sine', vol: 0.03 }); },
    crackle() { this.noise({ dur: rand(0.02, 0.05), type: 'highpass', freq: rand(1500, 4000), vol: rand(0.04, 0.12) }); },
    // fairy: a sparkly rising arpeggio
    fairy() {
      [1568, 1976, 2349, 3136].forEach((f, i) => this.tone({ freq: f * rand(0.99, 1.01), dur: 0.35, type: 'sine', vol: 0.05, delay: i * 0.05 }));
    },
    fairyJoin() {
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => this.tone({ freq: f, dur: 0.9, type: 'sine', vol: 0.07, delay: i * 0.09, attack: 0.02 }));
    },
    giggle() { // a small, delighted laugh
      [2350, 2100, 2450, 2000, 2300].forEach((f, i) => this.tone({ freq: f, freqTo: f * 0.85, dur: 0.09, type: 'sine', vol: 0.05, delay: i * 0.08 }));
    },
    heartbeat() {
      this.tone({ freq: 55, freqTo: 40, dur: 0.16, type: 'sine', vol: 0.5 });
      this.tone({ freq: 50, freqTo: 36, dur: 0.18, type: 'sine', vol: 0.35, delay: 0.18 });
    },
    whisper() {
      for (let i = 0; i < 3; i++) this.noise({ dur: rand(0.2, 0.4), type: 'bandpass', freq: rand(1500, 3200), q: 8, vol: 0.06, delay: i * 0.18, attack: 0.08 });
    },
    turn() {
      this.voice(65, 1.6, 0.4, [380, 650, 2200]);
      this.tone({ freq: 45, freqTo: 30, dur: 2, type: 'sawtooth', vol: 0.2, attack: 0.1 });
      this.noise({ dur: 1.5, type: 'lowpass', freq: 600, freqTo: 100, vol: 0.4 });
    },
    tonic() {
      this.noise({ dur: 0.3, type: 'bandpass', freq: 800, q: 4, vol: 0.12 });
      this.tone({ freq: 440, freqTo: 220, dur: 0.6, type: 'triangle', vol: 0.08, delay: 0.2 });
      this.noise({ dur: 0.5, type: 'highpass', freq: 3000, vol: 0.06, delay: 0.3, attack: 0.1 });
    },
    purify() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ freq: f, dur: 3, type: 'sine', vol: 0.07, attack: 0.4, delay: i * 0.12 }));
      this.noise({ dur: 2, type: 'highpass', freq: 6000, vol: 0.05, attack: 0.5 });
      this.voice(330, 2.4, 0.06, [800, 1150]);
    },
    coin() { this.tone({ freq: 1800, dur: 0.12, type: 'square', vol: 0.03 }); this.tone({ freq: 2400, dur: 0.2, type: 'sine', vol: 0.05, delay: 0.06 }); },
    anvil() { this.tone({ freq: 1400, dur: 0.6, type: 'triangle', vol: 0.2 }); this.tone({ freq: 2200, dur: 0.4, type: 'sine', vol: 0.12 }); this.noise({ dur: 0.06, type: 'highpass', freq: 3000, vol: 0.3 }); },
    door() {
      this.noise({ dur: 2.2, type: 'bandpass', freq: 180, freqTo: 90, q: 3, vol: 0.4, attack: 0.3 });
      this.tone({ freq: 55, dur: 2.5, type: 'sawtooth', vol: 0.06, attack: 0.4 });
    },
  },

  // low drone + wind + rain under the music
  startAmbience() {
    if (!this.ctx || this.ambience) return;
    try {
      const c = this.ctx;
      const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.out);
      g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 4);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; lp.connect(g);
      [55, 55.6].forEach(f => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); });
      // wind
      const n = c.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.6;
      const wg = c.createGain(); wg.gain.value = 0.35;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.09;
      const lfoG = c.createGain(); lfoG.gain.value = 220;
      lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
      n.connect(bp); bp.connect(wg); wg.connect(g); n.start();
      // rain hiss (volume follows the weather)
      const r = c.createBufferSource(); r.buffer = this.noiseBuf; r.loop = true;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
      this.rainGain = c.createGain(); this.rainGain.gain.value = 0;
      r.connect(hp); hp.connect(this.rainGain); this.rainGain.connect(this.out); r.start();
      this.ambience = g;
    } catch (e) { /* ignore */ }
  },
  setRain(v) {
    if (this.rainGain) this.rainGain.gain.setTargetAtTime(v * 0.05, this.ctx.currentTime, 0.8);
  },
};

// ---------------------------------------------------------------------------
// Music: tracks are functions called once per eighth note.
// ---------------------------------------------------------------------------
const CH = { // chords as MIDI notes
  Dm: [50, 57, 62, 65], Bb: [46, 53, 58, 62], Gm: [43, 50, 55, 58], A: [45, 52, 57, 61], C: [48, 55, 60, 64], F: [41, 48, 53, 57],
  Em: [40, 47, 52, 55], Fm: [41, 48, 53, 56], Dsd: [39, 45, 51, 54], Am: [45, 52, 57, 60], E: [40, 47, 52, 56],
  D: [50, 57, 62, 66], G: [43, 50, 55, 59], Bm: [47, 54, 59, 62], Amaj: [45, 52, 57, 61],
};

const Music = {
  ctx: null, bus: null, current: null, name: null, timer: null, intensity: 0, vol: 0.42,

  attach(ctx, out, reverb) {
    this.ctx = ctx;
    this.bus = ctx.createGain(); this.bus.gain.value = this.vol;
    this.bus.connect(out);
    const send = ctx.createGain(); send.gain.value = 0.55; this.bus.connect(send); send.connect(reverb);
    if (this.wanted) { const w = this.wanted; this.wanted = null; this.play(w); }
  },

  // crossfade to a track (null = silence)
  play(name) {
    if (!this.ctx) { this.wanted = name; return; }
    if (name === this.name) return;
    const c = this.ctx, t = c.currentTime;
    if (this.current) {
      const old = this.current;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0.0001, t + 2.2);
      old.dead = true;
      setTimeout(() => { try { old.gain.disconnect(); } catch (e) { /* gone */ } }, 3500);
    }
    this.name = name;
    this.current = null;
    if (!name || !TRACKS[name]) return;
    const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.bus);
    g.gain.linearRampToValueAtTime(1, t + (name === 'boss' ? 0.6 : 2.5));
    this.current = { name, gain: g, def: TRACKS[name], step: 0, next: t + 0.1 };
    if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
  },

  setIntensity(v) { this.intensity = v; },

  tick() {
    const cur = this.current;
    if (!cur || cur.dead || !this.ctx) return;
    const c = this.ctx;
    const eighth = 30 / cur.def.bpm;
    while (cur.next < c.currentTime + 0.25) {
      try { cur.def.step.call(this, cur.step, cur.next, cur.gain, eighth); } catch (e) { /* ignore */ }
      cur.step++; cur.next += eighth;
    }
  },

  // ---------------- instruments ----------------
  env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  },
  pad(notes, t, dur, bus, vol = 0.05, cutoff = 900) {
    const c = this.ctx;
    const g = c.createGain(); this.env(g, t, dur * 0.35, vol, dur * 0.9);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = 0.5;
    lp.connect(g); g.connect(bus);
    for (const m of notes) for (const det of [-7, 7]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + dur * 1.3 + 0.1);
    }
  },
  choir(m, t, dur, bus, vol = 0.04) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m);
    const vib = c.createOscillator(); vib.frequency.value = 5.2; const vg = c.createGain(); vg.gain.value = 4;
    vib.connect(vg); vg.connect(o.detune);
    const g = c.createGain(); this.env(g, t, dur * 0.4, vol, dur * 0.8);
    for (const [f, q] of [[730, 8], [1090, 9], [2440, 10]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      o.connect(bp); bp.connect(g);
    }
    g.connect(bus);
    o.start(t); vib.start(t); o.stop(t + dur * 1.3 + 0.1); vib.stop(t + dur * 1.3 + 0.1);
  },
  pluck(m, t, bus, vol = 0.07, decay = 1.4) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = mtof(m + 12);
    const g = c.createGain(); this.env(g, t, 0.004, vol, decay);
    const g2 = c.createGain(); g2.gain.value = 0.3;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus);
    o.start(t); o2.start(t); o.stop(t + decay + 0.1); o2.stop(t + decay + 0.1);
  },
  bell(m, t, bus, vol = 0.06) {
    const c = this.ctx;
    for (const [r, a, d] of [[1, 1, 4], [2.76, 0.4, 2.5], [5.4, 0.2, 1.4], [0.5, 0.5, 5]]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * r;
      const g = c.createGain(); this.env(g, t, 0.003, vol * a, d);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.1);
    }
  },
  drum(t, bus, vol = 0.5, pitch = 70) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(pitch * 2, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.5, t + 0.35);
    const g = c.createGain(); this.env(g, t, 0.003, vol, 0.45);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.5);
    this.hit(t, bus, vol * 0.25, 600, 0.12);
  },
  hit(t, bus, vol, freq, dur, type = 'lowpass') {
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = Sfx.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); this.env(g, t, 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  bass(m, t, dur, bus, vol = 0.12) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(160, t + dur);
    const g = c.createGain(); this.env(g, t, 0.01, vol, dur);
    o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.1);
  },
};

// Each track: bpm and a step(i, time, bus, eighthSeconds) called per eighth note.
const TRACKS = {
  // Title: slow D-minor lament, choir and bells
  title: {
    bpm: 52, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Dm, CH.Bb, CH.Gm, CH.A];
      const ch = prog[bar % 4];
      if (pos === 0) {
        this.pad(ch.slice(0, 3), t, e * 8, bus, 0.045, 700);
        this.choir(ch[3] + 12, t, e * 8, bus, 0.035);
        if (bar % 2 === 0) this.bell(ch[0] + 24, t, bus, 0.05);
      }
      const mel = [74, 72, 70, 69, 70, 69, 67, 69, 65, 67, 69, 72, 70, 69, 67, 65];
      if (pos % 2 === 0 && (pos === 0 || chance(0.55))) this.pluck(mel[(bar * 4 + pos / 2) % mel.length], t, bus, 0.05, 2);
    },
  },
  // Zone I: lonely harp over a drone
  road: {
    bpm: 66, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Dm, CH.C, CH.Bb, CH.A];
      const ch = prog[Math.floor(bar / 2) % 4];
      if (i % 32 === 0) this.pad([38, 45], t, e * 32, bus, 0.035, 400);
      if (pos === 0 && bar % 2 === 0) this.pad(ch.slice(1), t, e * 16, bus, 0.022, 600);
      const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[3], ch[1] + 12];
      if (chance(0.62)) this.pluck(arp[pos], t, bus, 0.045, 1.8);
      if (pos === 0 && bar % 8 === 7) this.bell(74, t, bus, 0.03);
    },
  },
  // Zone II: burning village — tremolo strings in E phrygian, distant toll
  village: {
    bpm: 72, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Em, CH.Fm, CH.Em, CH.Dsd];
      const ch = prog[bar % 4];
      for (let k = 0; k < 2; k++) { // tremolo: two strokes per eighth
        const tt = t + k * e / 2;
        this.pad([ch[0], ch[1]], tt, e * 0.45, bus, 0.03, 700);
      }
      if (pos === 0) this.pad(ch.slice(2), t, e * 8, bus, 0.025, 1100);
      if (pos === 0 && bar % 4 === 0) this.bell(43, t, bus, 0.09);
      if ((pos === 0 || pos === 3 || pos === 6) && bar % 2 === 1) this.drum(t, bus, 0.18, 55);
      if (pos === 4 && chance(0.5)) this.choir(ch[3] + 12, t, e * 4, bus, 0.025);
    },
  },
  // Zone III: cathedral — choir and organ, very slow
  cathedral: {
    bpm: 48, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Am, CH.F, CH.Dm, CH.E];
      const ch = prog[bar % 4];
      if (pos === 0) {
        this.pad([ch[0] - 12, ch[0]], t, e * 8, bus, 0.04, 500);
        ch.slice(1).forEach(m => this.choir(m + 12, t, e * 8, bus, 0.022));
        if (bar % 4 === 0) this.bell(57 + 12, t, bus, 0.06);
      }
      if (pos === 4 && chance(0.4)) this.bell(ch[3] + 24, t, bus, 0.02);
    },
  },
  // Boss: Gaul — taiko, ostinato bass, choir stabs; intensity 1 in phase two
  boss: {
    bpm: 134, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Dm, CH.Dm, CH.Bb, CH.A];
      const ch = prog[bar % 4];
      const kick = [1, 0, 0, 1, 0, 0, 1, 0];
      if (kick[pos]) this.drum(t, bus, 0.45, 60);
      if (pos === 2 || pos === 6) this.hit(t, bus, 0.18, 1800, 0.18, 'bandpass');
      if (Music.intensity > 0) { this.hit(t, bus, 0.05, 7000, 0.04, 'highpass'); if (pos === 7) this.drum(t, bus, 0.3, 90); }
      const ost = [0, 0, 12, 0, 3, 0, 1, -1];
      this.bass(ch[0] - 12 + ost[pos], t, e * 0.9, bus, 0.1);
      if (pos === 0) {
        ch.forEach(m => this.choir(m + 12, t, e * 6, bus, 0.03));
        this.pad(ch.slice(1), t, e * 8, bus, 0.03, 1400);
      }
      if (Music.intensity > 0 && pos % 2 === 0) this.pluck(ch[(pos / 2) % 4] + 24, t, bus, 0.04, 0.3);
    },
  },
  // Shrine: warm D major, the one gentle place
  shrine: {
    bpm: 58, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.D, CH.G, CH.Bm, CH.Amaj];
      const ch = prog[bar % 4];
      if (pos === 0) this.pad(ch, t, e * 8, bus, 0.03, 1200);
      const arp = [0, 1, 2, 3, 2, 1, 2, 3];
      this.pluck(ch[arp[pos]] + 12, t, bus, 0.035, 1.6);
      if (pos === 0 && bar % 4 === 0) this.bell(ch[0] + 24, t, bus, 0.03);
    },
  },
  // Brackenford: a lute and a low fiddle, the last warm place in Vael
  town: {
    bpm: 84, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Am, CH.F, CH.C, CH.E];
      const ch = prog[bar % 4];
      const pat = [0, 2, 1, 2, 3, 2, 1, 2];
      this.pluck(ch[pat[pos]] + 12, t, bus, pos === 0 ? 0.06 : 0.04, 0.9);
      if (pos === 0) { this.pad([ch[0] - 12, ch[0]], t, e * 8, bus, 0.025, 500); this.bass(ch[0] - 12, t, e * 3, bus, 0.05); }
      if (pos === 4) this.bass(ch[2] - 24, t, e * 3, bus, 0.04);
      const mel = [76, 74, 72, 71, 72, 69, 71, 68];
      if (bar % 2 === 1 && pos % 4 === 0) this.choir(mel[(bar + pos / 4) % 8], t, e * 4, bus, 0.018);
    },
  },
  // The Mire: a sick drone, dissonant bells, things moving in the reeds
  mire: {
    bpm: 50, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      if (i % 32 === 0) { this.pad([33, 40, 46], t, e * 32, bus, 0.04, 300); }
      if (pos === 0 && bar % 2 === 0) this.bell(chance(0.5) ? 63 : 64, t, bus, 0.035);
      if (pos === 4 && chance(0.35)) this.bell(70 + (chance(0.5) ? 1 : 0), t, bus, 0.02);
      if (chance(0.12)) this.hit(t, bus, 0.04, 2500, 0.3, 'bandpass');
      if (pos === 0 && bar % 4 === 3) this.choir(58, t, e * 8, bus, 0.02);
    },
  },
  // The chapel: the Sisters sing
  chapel: {
    bpm: 54, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.D, CH.Bm, CH.G, CH.Amaj];
      const ch = prog[bar % 4];
      if (pos === 0) {
        ch.slice(1).forEach(m => this.choir(m + 12, t, e * 8, bus, 0.026));
        this.choir(ch[0] + 24, t, e * 8, bus, 0.018);
        this.pad([ch[0] - 12], t, e * 8, bus, 0.03, 500);
        if (bar % 4 === 0) this.bell(ch[0] + 24, t, bus, 0.04);
      }
    },
  },
  // After the Headsman falls: a requiem
  requiem: {
    bpm: 44, step(i, t, bus, e) {
      const bar = Math.floor(i / 8), pos = i % 8;
      const prog = [CH.Dm, CH.F, CH.C, CH.D];
      const ch = prog[bar % 4];
      if (pos === 0) { ch.slice(1).forEach(m => this.choir(m + 12, t, e * 8, bus, 0.022)); this.pad([ch[0] - 12], t, e * 8, bus, 0.035, 400); }
    },
  },
};
