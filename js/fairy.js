'use strict';
// ---------------------------------------------------------------------------
// Animated death-watcher appearances, shared by the gallery and gameplay.
// Choices are cosmetic and saved independently for Lumi and Pip.
// ---------------------------------------------------------------------------
const FAIRY_LOOKS = {
  motley: { name: 'Copper Jester', desc: 'Rust and petrol motley. Your death is her punchline.', outfit: 'jester', kind: 'butterfly', malice: 'grin', dress: '#c77948', dark: '#294e55', trim: '#e4c591', accent: '#79aeb1', hair: '#493b41', hairDark: '#2c3039', wing: '#80aaa4', vein: '#476b72', glow: '186,154,108', eye: '#dfbb70', outline: '#303741' },
  silk: { name: 'Drowned Silk', desc: 'Sea-blue wrap robes, porcelain trim and a golden obi.', outfit: 'robe', kind: 'dragonfly', malice: 'grin', dress: '#417f90', dark: '#263d60', trim: '#d8e4df', accent: '#d8b66b', hair: '#acbfcf', hairDark: '#657d9d', wing: '#88b9c9', vein: '#4d7d9c', glow: '125,186,218', eye: '#d8ab67', outline: '#27364b' },
  velvet: { name: 'Velvet Wake', desc: 'Plum tailcoat, silver cravat, fitted trousers and boots.', outfit: 'coat', kind: 'carrion', malice: 'grin', dress: '#835a8c', dark: '#302c45', trim: '#d3d3de', accent: '#a9a2c7', hair: '#e2d8d9', hairDark: '#a796b0', wing: '#9c88bb', vein: '#68608c', glow: '174,145,212', eye: '#d992b2', outline: '#31293e' },
  saffron: { name: 'Saffron Hex', desc: 'Ochre patchwork poncho, soot-black hat and bloomers.', outfit: 'witch', kind: 'thorn', malice: 'grin', dress: '#c19b45', dark: '#39373d', trim: '#e0ce91', accent: '#cc7655', hair: '#d5c7b3', hairDark: '#9a8d84', wing: '#c5ac77', vein: '#907551', glow: '211,175,102', eye: '#c7784d', outline: '#3b3433' },
  briar: { name: 'Briar Grin', desc: 'A sweet smile that widens when you bleed.', kind: 'dragonfly', malice: 'grin', dress: '#83a565', dark: '#344b3e', trim: '#d2d5ad', accent: '#9b5d65', hair: '#c3da96', hairDark: '#708a63', wing: '#98b681', vein: '#526753', glow: '165,199,120', eye: '#d2a453', outline: '#293b31' },
  shroud: { name: 'Shroud Moth', desc: 'Funeral lace. She came dressed for your ending.', kind: 'butterfly', malice: 'veil', dress: '#b4b7b2', dark: '#41464e', trim: '#ddd9c7', accent: '#8c6a87', hair: '#e0e1cd', hairDark: '#959a9a', wing: '#babdb5', vein: '#676d73', glow: '183,192,199', eye: '#cf94ae', outline: '#343b43' },
  carrion: { name: 'Carrion Bell', desc: 'A bone mask and a bell for your last breath.', kind: 'carrion', malice: 'mask', dress: '#636970', dark: '#292d37', trim: '#d4c8a9', accent: '#b6a06a', hair: '#afb4b2', hairDark: '#636d78', wing: '#5f6878', vein: '#9b9da1', glow: '136,152,185', eye: '#dfb96b', outline: '#222735' },
  widow: { name: "Widow's Spark", desc: 'She counts your remaining heartbeats.', kind: 'thorn', malice: 'hood', dress: '#944b5d', dark: '#402c3a', trim: '#c9aa9b', accent: '#b89e69', hair: '#cdbda9', hairDark: '#867386', wing: '#bc7b8b', vein: '#75485e', glow: '202,120,146', eye: '#f2b585', outline: '#322934' },

  verdant: { name: 'Verdant Maid', desc: 'Long green hair, frilled headband and dragonfly wings.', kind: 'dragonfly', dress: '#91bc66', dark: '#3e6549', trim: '#e2e8c4', accent: '#a8c9cc', hair: '#d0e9a0', hairDark: '#7fa766', wing: '#b3db98', vein: '#65845d', glow: '167,222,128', eye: '#62884e', outline: '#344b36' },
  moonlace: { name: 'Moonlace', desc: 'Silver hair, violet lace and butterfly wings.', kind: 'butterfly', dress: '#b4a3cf', dark: '#514460', trim: '#efdfec', accent: '#60506f', hair: '#f0e9e4', hairDark: '#afa6bf', wing: '#c4b4dd', vein: '#7b658f', glow: '198,177,235', eye: '#9281b5', outline: '#3e334b' },
  rose: { name: 'Thorn Rose', desc: 'Wine-red braids, thorn crown and pointed rose wings.', kind: 'thorn', dress: '#a65570', dark: '#512c40', trim: '#d5a0a9', accent: '#b38b62', hair: '#784459', hairDark: '#3e2c3c', wing: '#d793a4', vein: '#914f6b', glow: '229,139,163', eye: '#bb7d94', outline: '#422b38' },
  wisp: { name: 'Lantern Wisp', desc: 'Golden hair, a bellflower dress and amber moth wings.', kind: 'moth', dress: '#e1cea0', dark: '#65513f', trim: '#fff0ca', accent: '#dba257', hair: '#f1d997', hairDark: '#bd955e', wing: '#e4be78', vein: '#91714b', glow: '255,205,119', eye: '#ac793c', outline: '#493b30' },
};
// Color studies inherit Drowned Silk's clothing, wings, animation and expression.
const SILK_PALETTES = {
  silkJade: { name: 'Jade & Bone', desc: 'Jade robes, bone trim, plum sash and ink-black hair.', dress: '#558b75', dark: '#253d39', trim: '#e3dfc4', accent: '#8c586f', hair: '#39474a', hairDark: '#242c34', wing: '#93c5a4', vein: '#537f6c', glow: '142,199,164', eye: '#d4b678', outline: '#283b35' },
  silkCrimson: { name: 'Crimson Mourning', desc: 'Wine-red robes, antique gold and silver-white hair.', dress: '#9c4c62', dark: '#3c2938', trim: '#e4cebd', accent: '#c7a467', hair: '#e3d9d6', hairDark: '#ab9ba8', wing: '#ca9ba9', vein: '#8d5c73', glow: '214,145,169', eye: '#c88e7c', outline: '#422e3c' },
  silkMidnight: { name: 'Midnight Wisteria', desc: 'Indigo robes, lavender trim, silver sash and dusk hair.', dress: '#565c98', dark: '#2b2b4c', trim: '#c6b8df', accent: '#c5cadc', hair: '#45435f', hairDark: '#2a2a42', wing: '#a19bcf', vein: '#69668f', glow: '154,150,222', eye: '#d8a6c4', outline: '#2d2b46' },
  silkEmber: { name: 'Porcelain Ember', desc: 'Ivory robes, charcoal folds, vermilion sash and ash hair.', dress: '#dfd5ba', dark: '#46434a', trim: '#f1e6cd', accent: '#b85a48', hair: '#cbbd9f', hairDark: '#92857a', wing: '#ddc79a', vein: '#a39479', glow: '224,199,150', eye: '#b57459', outline: '#413c3a' },
};
for (const [id,palette] of Object.entries(SILK_PALETTES)) FAIRY_LOOKS[id] = Object.assign({},FAIRY_LOOKS.silk,palette);
const FAIRY_ORDER = [...Object.keys(SILK_PALETTES), 'motley', 'silk', 'velvet', 'saffron', 'briar', 'shroud', 'carrion', 'widow', 'verdant', 'moonlace', 'rose', 'wisp'];
// A fairy is roughly half the previous height, on both desktop and mobile.
const FAIRY_GAME_SCALE = 0.56;
const FAIRY_STYLE_VERSION = 2;
const FairyStyles = {
  choices: { lumi: 'silkCrimson', pip: 'shroud' },
  load() {
    const saved = store.get('ashenOath.fairies');
    for (const who of ['lumi', 'pip']) if (saved && FAIRY_LOOKS[saved[who]]) this.choices[who] = saved[who];
    // Apply the chosen release look once, including existing game saves.
    // Later cosmetic choices remain independent of story progress.
    if (!saved || saved.version !== FAIRY_STYLE_VERSION) {
      this.choices.lumi = 'silkCrimson';
      this.save();
    }
  },
  save() { store.set('ashenOath.fairies', Object.assign({ version: FAIRY_STYLE_VERSION }, this.choices)); },
  set(who, id) {
    if (!Object.hasOwn(this.choices, who) || !FAIRY_LOOKS[id]) return;
    this.choices[who] = id; this.save();
  },
};
FairyStyles.load();

class Fairy {
  constructor(id, name, home) {
    this.id = id; this.name = name;
    this.home = home;               // NPC she keeps company with (or null when following)
    this.x = home ? home.x + 30 : 0; this.y = GROUND - 100;
    this.vx = 0; this.vy = 0; this.facing = -1;
    this.mode = home ? 'npc' : 'follow';
    this.t = Math.random() * 10;
    this.bubble = null;             // { text, t, life }
    this.greeted = false; this.greetT = 0;
    this.hintCd = 0;
  }

  say(text, life = 4.5, quiet = false) {
    this.bubble = { text, t: 0, life };
    if (!quiet) Sfx.play('fairy');
  }

  update(dt, g) {
    this.t += dt;
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.life) this.bubble = null; }
    this.hintCd -= dt;
    const p = g.player;
    this.delighted = p.dead || p.hp < p.maxHp * 0.3;
    let tx, ty;
    if (this.mode === 'npc') {
      const h = this.home;
      tx = h.x + Math.sin(this.t * 0.8) * 34 + 6;
      ty = GROUND - 92 + Math.sin(this.t * 1.7) * 10;
      const near = Math.abs(p.x - h.x) < 230 && !p.dead;
      if (near && !this.greeted && !g.flags[h.id]) {
        this.greeted = true; this.greetT = 3.5;
        this.say(this.greeting(), 4.5);
      }
      if (this.greetT > 0) { // fly over to the knight to wave him down
        this.greetT -= dt;
        tx = p.x - p.facing * 10 + Math.sin(this.t * 3) * 10; ty = GROUND - 128 + Math.sin(this.t * 4) * 5;
      }
    } else {
      // following: hover behind the knight's shoulder, higher when blades are out
      const danger = g.enemies.some(e => !e.dead && Math.abs(e.x - p.x) < 200 && e.state !== 'dormant' && e.state !== 'idle');
      tx = p.x - p.facing * (danger ? 60 : 34) + Math.sin(this.t * 1.1) * 8;
      ty = GROUND - (danger ? 158 : 112) + Math.sin(this.t * 2.2) * 7;
      if (p.hp < p.maxHp * 0.3 && !p.dead) { // drifts in close to watch
        tx = p.x + p.facing * 22 + Math.sin(this.t * 2) * 4; ty = GROUND - 120 + Math.sin(this.t * 3) * 3;
      }
      if (p.dead) { // circles the body, delighted
        tx = p.x + Math.cos(this.t * 2.4) * 34; ty = GROUND - 50 + Math.sin(this.t * 4.8) * 12;
        if (!this.sawDeath) {
          this.sawDeath = true; Sfx.play('giggle');
          this.say(pick(Game.turned ? ['You turned! You actually turned! Oh, your face!', 'So that\'s what it looks like from the inside.'] :
            ['Oh! Oh, that was a good one.', 'There it is. There it is!', 'Again! Do it again!', 'I knew you would. I just knew it.']), 3.5, true);
        }
      } else this.sawDeath = false;
      if (g.bossActive) { tx = LEVEL.bossGate - 46 + Math.sin(this.t) * 10; ty = GROUND - 120 + Math.sin(this.t * 2) * 8; }
    }
    // springy flight
    const k = 7, damp = 4.5;
    this.vx += ((tx - this.x) * k - this.vx * damp) * dt;
    this.vy += ((ty - this.y) * k - this.vy * damp) * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (Math.abs(this.vx) > 12) this.facing = Math.sign(this.vx);
    else if (this.mode === 'follow') this.facing = p.facing;
    else this.facing = Math.sign(p.x - this.x) || -1;
    if (chance(dt * 8)) FX.add({ k: 'fy', color: this.look.wing, x: this.x + rand(-3, 3), y: this.y + rand(-2, 5), vx: rand(-10, 10) - this.vx * 0.1, vy: rand(5, 30), t: 0, life: rand(0.5, 1.1), ph: rand(0, 6) });
  }

  greeting() {
    if (this.id === 'lumi') return 'Sir Knight! Over here! The old monk is dying. Come and watch with me!';
    return 'Careful, she bites. Wren, I mean. I only watch.';
  }

  get look() { return FAIRY_LOOKS[this.previewLook || FairyStyles.choices[this.id] || 'briar']; }

  // The same renderer is used for every preview and the live companions.
  draw(ctx, t) {
    const L = this.look, T = this.t, kind = L.kind;
    const rose = kind === 'thorn', moon = kind === 'butterfly', wisp = kind === 'moth';
    const sway = Math.sin(T * 2.3) * 2, flap = 0.55 + Math.abs(Math.sin(T * 22)) * 0.45;
    const stroke = (w = 0.55, color = L.outline) => { ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke(); };
    const ellipse = (x, y, rx, ry, color, angle = 0) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); ctx.fill();
    };
    const path = (points, color, w = 0.55) => {
      ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      ctx.closePath(); ctx.fill(); stroke(w);
    };
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.scale(this.facing * FAIRY_GAME_SCALE, FAIRY_GAME_SCALE);
    const halo = ctx.createRadialGradient(0, -22, 2, 0, -22, 43);
    halo.addColorStop(0, `rgba(${L.glow},0.16)`); halo.addColorStop(1, `rgba(${L.glow},0)`);
    ctx.fillStyle = halo; ctx.fillRect(-48,-72,96,96);
    ctx.rotate(clamp(this.vx / 600,-0.2,0.2) * this.facing);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Four independently flapping wings. Each costume has a different outline.
    for (const side of [-1,1]) {
      ctx.save(); ctx.translate(-2,-30); ctx.scale(side * flap,1);
      for (const lower of [false,true]) {
        ctx.save(); ctx.rotate(lower ? 0.6 : -0.25);
        const length = lower ? 29 : 39;
        const gradient = ctx.createLinearGradient(0,0,length,-16);
        gradient.addColorStop(0,L.trim + '60'); gradient.addColorStop(1,L.wing + 'c0');
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(0,0);
        if (moon) {
          ctx.bezierCurveTo(10,-23,30,-32,length,-25);
          for (let i=0;i<5;i++) ctx.quadraticCurveTo(length-i*3+2,-18+i*5,length-i*4-3,-15+i*5);
          ctx.quadraticCurveTo(9,8,0,0);
        } else if (wisp) {
          ctx.bezierCurveTo(14,-24,31,-29,length,-24); ctx.lineTo(length-4,-12);
          ctx.quadraticCurveTo(length-1,-7,length-9,-5); ctx.quadraticCurveTo(18,10,0,0);
        } else if (kind === 'carrion') {
          ctx.bezierCurveTo(8,-24,25,-26,length,-31);
          for (let i=0;i<6;i++) {ctx.lineTo(length-i*4,-19+i*4);ctx.lineTo(length-i*4-7,-16+i*3);}
          ctx.quadraticCurveTo(8,10,0,0);
        } else if (rose) {
          ctx.quadraticCurveTo(15,-17,length,-28); ctx.lineTo(length-12,-6);
          ctx.lineTo(length-8,-7); ctx.lineTo(17,3); ctx.lineTo(18,7); ctx.closePath();
        } else {
          ctx.bezierCurveTo(8,-10,27,-19,length,-14); ctx.bezierCurveTo(34,-4,12,4,0,0);
        }
        ctx.closePath(); ctx.fill(); stroke(0.6,L.vein);
        // Fine veins branch along the wing, visible in the enlarged preview.
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(length-3,moon || rose || wisp ? -23 : -13);
        for(let i=1;i<6;i++) {
          const x=i*5, y=-x*0.5;
          ctx.moveTo(x,y); ctx.lineTo(x+2,y-5); ctx.lineTo(x+7,y-8);
          ctx.moveTo(x,y); ctx.lineTo(x+5,y+4);
        }
        stroke(0.3,L.vein);
        if (moon || wisp) {
          for(let i=0;i<6;i++) ellipse(19+i*2.5,-17+i*2.5,0.75,1,L.trim);
          if(wisp) { ellipse(28,-16,4,5,L.dark,-0.4); ellipse(28,-16,2.7,3.5,L.accent,-0.4); ellipse(28,-16,1.2,2,L.trim,-0.4); }
        }
        ctx.restore();
      }
      ctx.restore();
    }
    // Long flowing locks, broken into strands instead of one solid wedge.
    for (let i=0;i<(L.outfit === 'coat' || L.outfit === 'jester' ? 3 : 6);i++) {
      const x=-8+i*2.5, drift=sway*(0.5+i*0.18);
      ctx.fillStyle=i%2 ? L.hair : L.hairDark;
      ctx.beginPath(); ctx.moveTo(x,-47);
      ctx.bezierCurveTo(x-10,-32,x+drift-12,-14,x+drift-5,L.outfit === 'coat' || L.outfit === 'jester' ? -22+i*2 : rose ? -10 : 2+i%3);
      ctx.quadraticCurveTo(x+drift+3,-10,x+3,-33); ctx.closePath(); ctx.fill(); stroke(0.35);
    }
    if(rose) {
      for(let i=0;i<10;i++) { ellipse(-10+sway+i*0.35,-30+i*2.7,2.2,2.1,i%2 ? L.hair : L.hairDark,0.4); }
      path([[-8+sway,-5],[-12+sway,-1],[-10+sway,0],[-7+sway,-2]],L.accent);
    }
    // Bent knees and small pointed feet, with a gentle swimming movement.
    for(const side of [-1,1]) {
      ctx.save(); ctx.translate(side*2.2,-5);ctx.rotate(side*0.22+Math.sin(T*2.5+side)*0.12);
      const skin=L.outfit || moon || rose ? L.dark : '#eed8bf';
      ctx.strokeStyle=L.outline;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*2,9);ctx.lineTo(side*3+2,17);ctx.lineTo(side*3+4,17.5);ctx.stroke();
      ctx.strokeStyle=skin;ctx.lineWidth=2;ctx.stroke();
      if(rose) {ctx.strokeStyle=L.trim;ctx.lineWidth=0.45;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-1+i*0.5,7+i*2);ctx.lineTo(3+i*0.5,9+i*2);ctx.stroke();}}
      ctx.restore();
    }
    if (L.malice === 'veil' || L.malice === 'mask') {
      for (const side of [-1,1]) {
        path([[side*5,-30],[side*11,-25],[side*(14+sway),6],[side*9,1],[side*7,8],[side*4,-12]], L.dark);
      }
    }
    if (L.outfit) {
      drawFairyOutfit(ctx,L,T);
    } else {
    // Opaque fitted bodice, shaped waist, and distinct layered skirts.
    const hem=moon ? 5 : wisp ? 1 : -4;
    const dress=ctx.createLinearGradient(-9,0,9,0);dress.addColorStop(0,L.dark);dress.addColorStop(0.55,L.dress);dress.addColorStop(1,L.dark);
    ctx.fillStyle=dress;ctx.beginPath();ctx.moveTo(-4,-31);ctx.lineTo(4,-31);ctx.lineTo(3,-20);
    ctx.bezierCurveTo(5,-15,10,-7,11,hem);ctx.quadraticCurveTo(0,hem+5,-11,hem);
    ctx.bezierCurveTo(-9,-10,-4,-16,-3,-20);ctx.closePath();ctx.fill();stroke();
    if (moon || wisp) {
      // Lace tiers and bellflower skirts have curved hems, not leaf petals.
      for (let layer=0;layer<3;layer++) {
        const y=-13+layer*6, width=6+layer*2.5;
        ctx.fillStyle=layer%2 ? L.trim : L.dress;
        ctx.beginPath();ctx.moveTo(-width+2,y-5);ctx.quadraticCurveTo(0,y-1,width-2,y-5);
        ctx.lineTo(width,y+4);ctx.quadraticCurveTo(0,y+8,-width,y+4);ctx.closePath();ctx.fill();stroke(0.4);
        for(let i=0;i<9;i++) {
          const x=-width+i*width/4;
          ctx.beginPath();ctx.arc(x,y+4+Math.sin(i/8*Math.PI)*2.5,0.85,0,Math.PI);stroke(0.45,L.trim);
        }
        for(let i=-1;i<=1;i++) {
          ctx.beginPath();ctx.moveTo(i*3,y);ctx.quadraticCurveTo(i*4,y+2,i*5,y+3);stroke(0.3,L.dark);
        }
      }
    } else {
      for(let layer=0;layer<3;layer++) {
        const y=-15+layer*5, width=5+layer*2.5;
        for(let i=0;i<5;i++) {
          const x=(i-2)*width*0.45;
          ctx.fillStyle=(i+layer)%2 ? L.dress : L.trim;
          ctx.beginPath();ctx.moveTo(x,-20+layer*4);
          ctx.quadraticCurveTo(x+4,y,x+2,y+(rose ? 6 : 4));ctx.quadraticCurveTo(x-3,y+3,x-2,y-2);ctx.closePath();ctx.fill();stroke(0.3);
        }
      }
    }
    if(moon || wisp) {
      ctx.strokeStyle=L.trim;ctx.lineWidth=0.6;
      for(let i=0;i<11;i++) {ctx.beginPath();ctx.arc(-10+i*2,hem+1+Math.sin(i/10*Math.PI)*2,1.2,0,Math.PI);ctx.stroke();}
    }
    path([[-4,-29],[4,-29],[3,-20],[-3,-20]],moon ? L.dark : L.dress);
    ctx.beginPath();for(let i=0;i<4;i++){const y=-28+i*2;ctx.moveTo(-1.7,y);ctx.lineTo(1.7,y+2);ctx.moveTo(1.7,y);ctx.lineTo(-1.7,y+2);}stroke(0.45,L.trim);
    if(wisp) path([[-5,-33],[0,-30],[5,-33],[8,-25],[2,-26],[0,-23],[-6,-26]],L.dark);
    }
    // One arm waves during speech; the lantern remains attached to the hand.
    for(const side of [-1,1]) {
      ctx.save();ctx.translate(side*4,-31);
      ctx.rotate(side===1 && this.bubble ? -1.8+Math.sin(T*9)*0.2 : side*-0.5);
      ellipse(0,1,1.7,2.5,L.outfit || moon || rose ? L.dress : '#efd9c4');
      if (L.outfit) {
        const wide = L.outfit === 'robe';
        path([[-2,0],[2,0],[wide ? 5 : 2.2,wide ? 11 : 8],[-(wide ? 5 : 2.2),wide ? 12 : 8]],side === -1 ? L.dark : L.dress);
        ctx.beginPath();ctx.moveTo(wide ? -5 : -2.2,wide ? 10 : 7);ctx.lineTo(wide ? 5 : 2.2,wide ? 10 : 7);stroke(0.8,L.trim);
      }
      ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(side*1.5,7);ctx.lineTo(0,12);stroke(2,L.outfit || rose ? L.dark : '#efd9c4');
      ellipse(0,12,1.1,1.3,'#efd9c4');
      if(wisp && side===-1) {
        ctx.beginPath();ctx.arc(0,15,2,Math.PI,0);stroke(0.65,L.accent);
        path([[-2.5,16],[2.5,16],[3,22],[-3,22]],L.dark);
        ctx.fillStyle='#ffe3a0';ctx.fillRect(-1.6,17,3.2,4);
        ctx.beginPath();ctx.moveTo(0,17);ctx.lineTo(0,21);stroke(0.5,L.accent);
        const light=ctx.createRadialGradient(0,19,1,0,19,11);light.addColorStop(0,'#ffce6e66');light.addColorStop(1,'#ffce6e00');ctx.fillStyle=light;ctx.fillRect(-11,8,22,22);
      }
      ctx.restore();
    }
    // Smaller face with a defined chin, pointed ears and side-swept bangs.
    ellipse(0,-34,1.7,3.5,'#efd9c4');
    path([[4,-41],[11,-44],[6,-37]],'#efd9c4');
    ctx.fillStyle='#efd9c4';ctx.beginPath();ctx.ellipse(0,-41,5.8,6.5,0,0,Math.PI*2);ctx.fill();stroke();
    const blink=T%4.3<0.13;
    for(const [x,r] of [[-1.4,1.15],[3.1,1.5]]) {
      if(!blink){ellipse(x,-40.2,r,1.9,'#fff5e6');ellipse(x+0.2,-40,r*0.7,1.6,L.eye);ellipse(x+0.3,-40,0.4,1.2,L.outline);ellipse(x-0.2,-40.8,0.35,0.5,'#fff9ea');}
      ctx.beginPath();ctx.moveTo(x-r,-41.4);ctx.quadraticCurveTo(x,-42.2,x+r+0.5,-41.3);stroke(0.65);
    }
    if (L.malice) {
      ctx.fillStyle = '#6d3546';ctx.beginPath();ctx.moveTo(-0.3,-37.5);
      ctx.quadraticCurveTo(2,-35.8,4.6,-38);ctx.quadraticCurveTo(2,-33.8+(this.delighted ? 0.8 : 0),-0.3,-37.5);ctx.fill();
      ctx.beginPath();ctx.moveTo(0.2,-37.3);ctx.quadraticCurveTo(2,-36.3,4,-37.6);stroke(this.delighted ? 0.85 : 0.5,L.trim);
      for (const x of [-1.4,3.1]) {ctx.beginPath();ctx.moveTo(x-1.4,-42);ctx.lineTo(x+1.2,-41.5);stroke(0.7,L.outline);}
    } else {
      ctx.beginPath();ctx.moveTo(0.8,-36.6);ctx.quadraticCurveTo(2,-35.5+(this.bubble ? 1 : 0),3,-36.8);stroke(0.45,'#9e6164');
    }
    ctx.fillStyle=L.hair;ctx.beginPath();ctx.moveTo(-6,-38);
    ctx.bezierCurveTo(-10,-53,9,-54,7,-40);ctx.lineTo(4,-44);ctx.lineTo(3,-40);ctx.lineTo(0,-45);ctx.lineTo(-1,-40);ctx.lineTo(-4,-43);
    ctx.lineTo(-5,-31);ctx.lineTo(-8+sway*0.3,-26);ctx.closePath();ctx.fill();stroke();
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-4+i*2,-48);ctx.quadraticCurveTo(-3+i*2,-46,-4+i*2,-42);stroke(0.3,L.hairDark);}
    // Recognizable headpieces at native gameplay size.
    if (L.outfit) {
      drawFairyHeadwear(ctx,L,T);
    } else if (L.malice === 'veil' || L.malice === 'hood') {
      const hood=L.malice === 'hood';
      ctx.fillStyle=L.dark;ctx.beginPath();ctx.moveTo(-10,-27);ctx.quadraticCurveTo(-13,-52,-1,-55);ctx.quadraticCurveTo(13,-52,10,-29);ctx.lineTo(6,-32);ctx.quadraticCurveTo(7,-47,0,-49);ctx.quadraticCurveTo(-7,-47,-6,-32);ctx.closePath();ctx.fill();stroke(0.65);
      if (!hood) {
        ctx.fillStyle=L.trim+'99';ctx.beginPath();ctx.moveTo(-7,-44);ctx.lineTo(7,-44);ctx.lineTo(9,-29);ctx.lineTo(3,-31);ctx.lineTo(-3,-28);ctx.lineTo(-9,-30);ctx.closePath();ctx.fill();
        for(let i=-6;i<=6;i+=2){ctx.beginPath();ctx.moveTo(i,-44);ctx.lineTo(i+1,-30);stroke(0.3,L.vein);}
        ellipse(3,-40,0.9,0.7,this.delighted ? '#f1a0bb' : L.eye);
      } else {
        path([[-7,-33],[0,-30],[7,-33],[10,-26],[3,-24],[-4,-25],[-10,-26]],L.dark);
        ellipse(3,-40.5,1.1,0.7,L.eye);
      }
    } else if (L.malice === 'mask') {
      path([[-6,-46],[0,-48],[6,-45],[7,-38],[2,-34],[-5,-37]],L.trim);
      ellipse(-2,-41.5,1.8,1.2,L.dark,-0.25);ellipse(3,-41.5,2,1.2,L.dark,0.25);
      ellipse(3.4,-41.4,0.65,0.55,L.eye);path([[0,-40],[2,-37],[-1,-37]],L.dark,0.3);
      for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-2+i*1.5,-36.8);ctx.lineTo(-2+i*1.5,-35.3);stroke(0.45,L.dark);}
      path([[-7,-47],[-12,-55],[-5,-51],[0,-53],[5,-50],[9,-54],[8,-46]],L.dark);
    } else if(rose) {
      ctx.beginPath();ctx.arc(0,-41,7.3,Math.PI,Math.PI*2);stroke(0.8,L.accent);
      for(let i=0;i<5;i++) {const x=-6+i*3;path([[x,-47],[x+1,-51],[x+2,-47]],L.dark,0.3);}
      for(let i=0;i<5;i++)ellipse(-5+Math.cos(i*1.26)*1.5,-45+Math.sin(i*1.26)*1.5,1.6,1.1,L.dress,i);ellipse(-5,-45,0.8,0.8,L.trim);
    } else if(wisp) {
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*3,-47);ctx.quadraticCurveTo(side*4,-55,side*8,-53);stroke(0.65,L.accent);ellipse(side*8,-53,0.8,1.4,L.trim);}
    } else {
      ctx.beginPath();ctx.arc(0,-41,7.2,Math.PI*1.07,Math.PI*1.92);stroke(2,L.trim);
      for(let i=0;i<9;i++){const a=Math.PI*(1.07+i*0.105);ellipse(Math.cos(a)*7.8,-41+Math.sin(a)*7.8,0.85,1.2,L.trim,a);}
      for(const side of [-1,1]){path([[side*6,-45],[side*12,-48],[side*10,-42]],L.accent);path([[side*7,-44],[side*10+sway,-36],[side*8+sway,-37]],L.accent);}
    }
    if (L.malice === 'mask' || L.malice === 'hood') {
      ctx.beginPath();ctx.moveTo(5,-24);ctx.lineTo(12,-10);stroke(0.6,L.accent);
      if (L.malice === 'mask') {
        path([[10,-10],[14,-10],[15,-5],[9,-5]],L.accent);ellipse(12,-4.5,0.9,0.9,L.trim);
      } else {
        path([[10,-11],[15,-11],[14,-9],[11,-6],[10,-4],[15,-4],[14,-6],[11,-9]],L.trim,0.35);
        ctx.beginPath();ctx.moveTo(10,-11);ctx.lineTo(15,-11);ctx.moveTo(10,-4);ctx.lineTo(15,-4);stroke(0.8,L.accent);
      }
    }
    ctx.restore();
  }

  drawBubble(ctx) {
    const b = this.bubble; if (!b) return;
    const a = b.t < 0.2 ? b.t / 0.2 : b.t > b.life - 0.4 ? (b.life - b.t) / 0.4 : 1;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.font = `12px ${BODY_FONT}`;
    const lines = wrapText(ctx, b.text, 190);
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 18, h = lines.length * 15 + 22;
    const x = clamp(this.x - w / 2, Game.viewL + 6, Game.viewR - w - 6), y = this.y - 40 - h;
    ctx.fillStyle = 'rgba(28,18,42,0.88)';
    rr(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(200,175,255,0.75)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.x - 4, y + h); ctx.lineTo(this.x, y + h + 9); ctx.lineTo(this.x + 4, y + h); ctx.closePath();
    ctx.fillStyle = 'rgba(28,18,42,0.88)'; ctx.fill();
    ctx.fillStyle = '#c9b3ff'; ctx.font = `bold 9px ${TITLE_FONT}`; ctx.textAlign = 'left';
    ctx.fillText(this.name.toUpperCase(), x + 9, y + 12);
    ctx.font = `12px ${BODY_FONT}`; ctx.fillStyle = '#efe8ff';
    lines.forEach((l, i) => ctx.fillText(l, x + 9, y + 27 + i * 15));
    ctx.globalAlpha = 1;
  }
}

// Costume silhouettes are separate from the older petal and lace dresses.
function drawFairyOutfit(ctx,L,t) {
  const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.strokeStyle=L.outline;ctx.lineWidth=0.5;ctx.stroke();};
  const line=(a,b,color=L.trim,w=0.55)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();};
  const dot=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  if(L.outfit==='jester') {
    // Split-color fitted motley, jagged peplum, and mismatched puffed shorts.
    poly([[-4,-32],[4,-32],[5,-20],[9,-10],[4,-13],[0,-8],[-4,-13],[-9,-10],[-4,-20]],L.dark);
    poly([[0,-31],[4,-31],[4,-20],[8,-11],[4,-13],[0,-8]],L.dress);
    poly([[-6,-14],[0,-13],[-1,-4],[-6,-5],[-8,-8]],L.dress);
    poly([[0,-13],[6,-14],[8,-8],[6,-4],[1,-4]],L.dark);
    for(let i=0;i<4;i++){const y=-28+i*4;poly([[-2,y-2],[0,y],[ -2,y+2],[-4,y]],L.accent);poly([[2,y-1],[4,y+1],[2,y+3],[0,y+1]],L.trim);}
    poly([[-6,-33],[0,-30],[6,-33],[4,-28],[0,-29],[-4,-28]],L.trim);
    for(const x of [-7,0,7])dot(x,x===0?-8:-11,1,L.accent);
  } else if(L.outfit==='robe') {
    // A wrapped robe with one trailing panel and a wide obi tied behind it.
    poly([[-5,-32],[4,-32],[6,-20],[8,6],[2,3],[-5,7],[-8,-4],[-4,-20]],L.dress);
    poly([[3,-31],[-4,-21],[-7,3],[-2,5],[3,-20],[5,-28]],L.trim);
    poly([[-5,-30],[4,-22],[2,-20],[-5,-27]],L.dark);
    poly([[-5,-21],[5,-21],[5,-16],[-5,-16]],L.accent);
    poly([[-5,-19],[-13,-23],[-12,-14],[-5,-17]],L.dark);
    poly([[-6,-18],[-12,-13],[-13,1],[-8,-5]],L.accent);
    for(const x of [-3,1,5])line([x,-12],[x+1,2],L.dark,0.4);
    for(let i=0;i<3;i++){dot(4,-9+i*4,0.8,L.trim);line([3,-8+i*4],[5,-6+i*4],L.accent,0.4);}
  } else if(L.outfit==='coat') {
    // Tailcoat: long split tails, narrow waistcoat and a bright silver cravat.
    poly([[-5,-32],[5,-32],[5,-18],[10,4],[3,0],[0,-13],[-4,5],[-10,1],[-5,-18]],L.dark);
    poly([[-4,-30],[4,-30],[4,-15],[-4,-15]],L.dress);
    poly([[-4,-33],[0,-29],[-2,-20],[-6,-28]],L.accent);
    poly([[4,-33],[0,-29],[2,-20],[6,-28]],L.accent);
    poly([[-1.8,-33],[2,-33],[1,-29],[2,-24],[0,-26],[-1.5,-24],[-0.7,-29]],L.trim);
    for(let i=0;i<3;i++)dot(0,-22+i*3,0.65,L.trim);
    line([-5,-16],[5,-16],L.accent,0.9);
    for(const x of [-7,7])line([x,-7],[x*1.2,0],L.dress,0.8);
    // High boot cuffs read distinctly below the coat tails.
    poly([[-6,4],[-2,4],[-1,12],[-4,11]],L.dark);
    poly([[2,4],[6,4],[8,12],[4,12]],L.dark);
    line([-6,4],[-2,4],L.accent);line([2,4],[6,4],L.accent);
  } else if(L.outfit==='witch') {
    // Broad triangular poncho, contrasting patches and scalloped bloomers.
    poly([[-5,-16],[5,-16],[7,-5],[2,-2],[0,-6],[-3,-2],[-7,-5]],L.dark);
    poly([[-3,-33],[4,-33],[13,-13],[7,-15],[3,-10],[-1,-14],[-7,-11],[-13,-16]],L.dress);
    poly([[-9,-21],[-4,-22],[-3,-17],[-8,-16]],L.accent);
    poly([[3,-19],[8,-20],[10,-15],[5,-14]],L.dark);
    for(let i=0;i<4;i++)line([-9+i*1.4,-21],[-8.5+i*1.4,-22.4],L.trim,0.4);
    for(let i=0;i<4;i++)dot(-1,-29+i*3,0.65,L.dark);
    poly([[-4,-33],[3,-33],[5,-29],[-3,-28]],L.dark);
    line([-3,-14],[2,-11],L.trim,0.7);
  }
}

function drawFairyHeadwear(ctx,L,t) {
  const poly=(p,color)=>{ctx.fillStyle=color;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.strokeStyle=L.outline;ctx.lineWidth=0.55;ctx.stroke();};
  const dot=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  const sway=Math.sin(t*3)*1.2;
  if(L.outfit==='jester') {
    poly([[-7,-46],[-8,-56],[-14+sway,-57],[-10+sway,-60],[-3,-53],[0,-56],[5,-53],[11-sway,-59],[14-sway,-55],[8,-52],[7,-46]],L.dark);
    poly([[0,-56],[5,-53],[11-sway,-59],[14-sway,-55],[8,-52],[7,-46],[0,-47]],L.dress);
    dot(-14+sway,-57,1.3,L.trim);dot(14-sway,-55,1.3,L.trim);
    poly([[-7,-46],[0,-48],[7,-46],[6,-44],[-6,-44]],L.accent);
  } else if(L.outfit==='robe') {
    // Swept-up knot, two fine gold pins and a ribbon down the back.
    dot(-5,-49,3,L.hairDark);dot(-5,-50,2,L.hair);
    ctx.strokeStyle=L.accent;ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(-11,-48);ctx.lineTo(1,-52);ctx.moveTo(-10,-51);ctx.lineTo(1,-49);ctx.stroke();
    dot(-11,-48,0.9,L.trim);dot(1,-49,0.7,L.trim);
    poly([[-7,-47],[-11,-42],[-10+sway,-28],[-8+sway,-32],[-8,-42]],L.accent);
  } else if(L.outfit==='coat') {
    // Tilted little top hat, a silver band and black feather.
    poly([[-8,-48],[-8,-59],[3,-60],[5,-49]],L.dark);
    poly([[-8,-51],[4,-52],[5,-49],[-8,-48]],L.accent);
    poly([[-12,-48],[9,-51],[10,-48],[-10,-45]],L.dark);
    poly([[-8,-54],[-14,-60],[-11,-53]],L.dress);
    dot(-6,-51,0.8,L.trim);
  } else if(L.outfit==='witch') {
    // A low crooked witch hat; its height stays within the small sprite budget.
    poly([[-8,-47],[-6,-54],[-2,-62],[7,-59],[1,-57],[6,-48]],L.dark);
    poly([[-7,-50],[5,-51],[6,-48],[-8,-47]],L.accent);
    poly([[-14,-46],[0,-49],[13,-46],[7,-43],[-9,-43]],L.dark);
    poly([[-1,-50],[2,-50],[2,-47],[-1,-47]],L.trim);
  }
}

const FairyPreviews = FAIRY_ORDER.map(id => {
  const fairy = new Fairy('lumi', '', null); fairy.previewLook = id;
  return fairy;
});
function drawFairyPreview(ctx, id, t, x, y, scale = 1) {
  const fairy = FairyPreviews[FAIRY_ORDER.indexOf(id)];
  if (!fairy) return;
  fairy.t = t; fairy.x = 0; fairy.y = Math.sin(t * 2) * 2; fairy.facing = 1;
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale); fairy.draw(ctx,t); ctx.restore();
}

// Lumi's advice once she travels with the knight. Each fires once (or on a cooldown).
// Lumi's "advice". She wants him alive only until the death is worth watching.
const FAIRY_HINTS = {
  shrine: () => 'A lantern shrine. Rest if you like. It means I get to watch you die again later.',
  exec: () => Mobile.enabled ? "It's staggering! Tap the skull. I want to see what's inside." : "It's staggering! Press F. I want to see what's inside.",
  lowhp: () => Mobile.enabled ? "So much red... Not yet, though. Drink your little jar. It's too early to end." : "So much red... Not yet, though. Drink a vial (Q). It's too early to end.",
  novial: () => 'No vials left? Oh. Oh, this is going to be good.',
  note: () => "Someone wrote something before they died. Read it. Last words are my favourite.",
  zone_town: () => 'Brackenford. So many people, all huddled together. When the Weeping gets in, it will be wonderful.',
  zone_village: () => 'Hallowmere! I watched it burn. The screaming went on for days.',
  zone_mire: () => 'The Mire. Things drown here slowly. Stay near the fat ones when they burst, it\'s pretty.',
  zone_cathedral: () => 'Can you hear the Heart? Every beat is someone dying. It sounds like a lullaby.',
  infect: () => 'Your veins are going red. Go and let the Sisters scrub it out... I\'d rather you die as yourself. It\'s more tragic.',
  turning: () => "You're turning! I've never watched a knight turn before. Drink something or don't. Either way, I'm watching!",
  gate: () => "He's behind the fog. I'll wait out here and listen. Scream loudly, please.",
  respawn: () => 'You died! Again! Get up, get up, I want to watch that part again. Your embers are where you fell.',
  bossdead: () => 'Oh, that was beautiful. Did you see his face at the end? I\'ll remember that one.',
  shield: () => 'That one hides behind his shield. Hit it hard. I want to hear it crack.',
  help: () => "Someone's being torn apart over there! Hurry, or we'll miss it!",
  cripple: () => 'He lost a leg! Look at him crawl. Don\'t finish him too quickly.',
};

