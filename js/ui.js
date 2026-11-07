'use strict';
// ---------------------------------------------------------------------------
// HUD, menus and overlays
// ---------------------------------------------------------------------------
const TITLE_FONT = '"Cinzel", "Trajan Pro", Georgia, serif';
const BODY_FONT = '"IM Fell English", Georgia, "Times New Roman", serif';

const UI = {
  text(ctx, str, x, y, size, col, align = 'center', font = TITLE_FONT, shadow = true) {
    ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillText(str, x + 1.5, y + 1.5); }
    ctx.fillStyle = col; ctx.fillText(str, x, y);
  },

  bar(ctx, x, y, w, h, frac, col, back, lag) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
    if (lag !== undefined && lag > frac) { ctx.fillStyle = '#d8c48a'; ctx.fillRect(x, y, w * clamp(lag, 0, 1), h); }
    ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h / 3);
    ctx.strokeStyle = 'rgba(160,140,110,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
  },

  hud(ctx, g) {
    const p = g.player;
    p.hpLag = p.hpLag === undefined ? p.hp : (p.hpLag > p.hp ? p.hpLag - (p.maxHp * 0.25) / 60 : p.hp);
    const hw = Math.min(620, p.maxHp * 2.1), sw = Math.min(620, p.maxSt * 2.1);
    UI.bar(ctx, 28, 26, hw, 10, p.hp / p.maxHp, '#8e1414', '#2a0808', p.hpLag / p.maxHp);
    UI.bar(ctx, 28, 44, sw, 6, p.st / p.maxSt, '#4e7a3a', '#132010');
    // infection: the Red Weeping in the knight's blood
    const iw = 190, iy = 58, inf = p.turning ? 1 : p.infection / 100;
    const pulse = g.pulse || 0;
    UI.bar(ctx, 28, iy, iw, 5, inf, p.turning ? `rgb(${200 + pulse * 55},20,30)` : inf > 0.75 ? '#a3123a' : '#7a2a6a', '#1a0a14');
    if (inf > 0) { ctx.strokeStyle = 'rgba(255,90,120,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < iw * inf; k += 9) { ctx.moveTo(28 + k, iy + 1); ctx.lineTo(28 + k + 4, iy + 4); } ctx.stroke(); }
    UI.text(ctx, p.turning ? 'TURNING' : `INFECTION ${Math.round(p.infection)}%`, 28 + iw + 10, iy + 6, 10, p.turning ? '#ff4a3a' : '#a8789a', 'left');
    if (p.turning) {
      const m = Math.floor(Math.max(0, p.turnT) / 60), sec = Math.floor(Math.max(0, p.turnT) % 60);
      const big = 1 + pulse * 0.08;
      const ty0 = Mobile.enabled ? H - 54 : (g.bossActive ? H - 110 : H - 80);
      ctx.save(); ctx.translate(W / 2, ty0); ctx.scale(big, big);
      UI.text(ctx, `THE WEEPING TAKES YOU  ${m}:${String(sec).padStart(2, '0')}`, 0, 0, 20, p.turnT < 20 ? '#ff3a2a' : '#e05a4a');
      ctx.restore();
      UI.text(ctx, p.tonics > 0 ? (Mobile.enabled ? 'drink a TONIC or reach a Sister' : 'drink a tonic (T) or reach a Sister') : 'reach a Sister of Saint Ysolde', W / 2, ty0 + 18, 12, '#d8a090', 'center', BODY_FONT);
    }
    // vials
    for (let i = 0; i < p.maxFlasks; i++) {
      const x = 34 + i * 20, y = Mobile.enabled ? 90 : H - 40, full = i < p.flasks;
      ctx.fillStyle = full ? '#d7a85a' : '#2a2620';
      ctx.beginPath(); ctx.moveTo(x - 3, y - 10); ctx.lineTo(x + 3, y - 10); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x + 7, y + 3); ctx.lineTo(x + 7, y + 10); ctx.lineTo(x - 7, y + 10); ctx.lineTo(x - 7, y + 3); ctx.lineTo(x - 3, y - 5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a5040'; ctx.lineWidth = 1; ctx.stroke();
      if (full) { ctx.fillStyle = 'rgba(255,240,200,0.4)'; ctx.fillRect(x - 5, y + 3, 3, 5); }
    }
    if (!Mobile.enabled) UI.text(ctx, 'Q', 34 + p.maxFlasks * 20 + 4, H - 32, 11, '#7a6e5a', 'left');
    // purging tonics
    { const tx0 = 34 + p.maxFlasks * 20 + (Mobile.enabled ? 10 : 22), ty0 = Mobile.enabled ? 90 : H - 40;
      for (let i = 0; i < p.maxTonics; i++) {
        const x = tx0 + i * 15, full = i < p.tonics;
        ctx.fillStyle = full ? '#8ab060' : '#20261a'; rr(ctx, x - 4, ty0 - 6, 8, 15, 2); ctx.fill();
        ctx.fillStyle = full ? '#c8a878' : '#2a2620'; ctx.fillRect(x - 2, ty0 - 9, 4, 3);
      }
      if (!Mobile.enabled) UI.text(ctx, 'T', tx0 + p.maxTonics * 15, H - 32, 11, '#7a6e5a', 'left');
    }
    // weapon
    if (!Mobile.enabled) UI.text(ctx, `${p.weapon.name}${p.weaponLevel ? ' +' + p.weaponLevel : ''} · ${p.weapon.kind}`, 28, H - 58, 12, '#8f8470', 'left', BODY_FONT);
    // embers
    const ex = Mobile.enabled ? W - 150 : W - 30, ey = Mobile.enabled ? 40 : H - 34;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(ex - 130, ey - 20, 136, 30);
    ctx.strokeStyle = 'rgba(160,140,110,0.35)'; ctx.strokeRect(ex - 130, ey - 20, 136, 30);
    ctx.fillStyle = '#ffb35a'; ctx.beginPath(); ctx.arc(ex - 114, ey - 5, 5 + Math.sin(g.time * 4) * 0.8, 0, Math.PI * 2); ctx.fill();
    UI.text(ctx, String(Math.floor(g.emberDisplay)), ex - 2, ey + 1, 18, '#e8d9b0', 'right');
    // boss bar
    if (g.bossActive && g.boss && !g.boss.dead) {
      const b = g.boss, bw = Mobile.enabled ? 440 : 560, bx = (W - bw) / 2, by = Mobile.enabled ? 112 : H - 52;
      b.hpLag = b.hpLag === undefined ? b.hp : (b.hpLag > b.hp ? b.hpLag - (b.maxHp * 0.12) / 60 : b.hp);
      UI.text(ctx, b.def.name, bx, by - 8, 15, '#d8ccb0', 'left');
      UI.bar(ctx, bx, by, bw, 9, b.hp / b.maxHp, '#7e1010', '#200606', b.hpLag / b.maxHp);
      ctx.fillStyle = '#c9a050'; ctx.fillRect(bx, by + 12, bw * clamp(b.posture / b.maxPosture, 0, 1), 2);
    }
    // zone banner
    if (g.banner) {
      const bt = g.banner.t, life = g.banner.life;
      const a = bt < 0.8 ? bt / 0.8 : bt > life - 1 ? (life - bt) : 1;
      ctx.globalAlpha = clamp(a, 0, 1);
      const cy = H * 0.42;
      const grad = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.6)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(W / 2 - 300, cy - 50, 600, 80);
      if (g.banner.sub) UI.text(ctx, g.banner.sub, W / 2, cy - 22, 14, '#9a8a6a');
      UI.text(ctx, g.banner.text, W / 2, cy + 14, 34, g.banner.col || '#e2d4b4');
      ctx.fillStyle = g.banner.col || '#e2d4b4'; ctx.fillRect(W / 2 - 120, cy + 26, 240, 1);
      ctx.globalAlpha = 1;
    }
    // toasts
    let ty = Mobile.enabled ? (g.questNote && !g.banner ? 252 : 186) : 86;
    for (const t of g.toasts) {
      const a = t.t < 0.4 ? t.t / 0.4 : t.t > t.life - 0.6 ? (t.life - t.t) / 0.6 : 1;
      ctx.globalAlpha = clamp(a, 0, 1) * 0.95;
      ctx.font = `15px ${BODY_FONT}`;
      const w = ctx.measureText(t.text).width + 36;
      ctx.fillStyle = 'rgba(8,6,6,0.72)'; ctx.fillRect(W / 2 - w / 2, ty - 18, w, 28);
      ctx.strokeStyle = 'rgba(150,130,100,0.3)'; ctx.strokeRect(W / 2 - w / 2, ty - 18, w, 28);
      UI.text(ctx, t.text, W / 2, ty + 1, 15, '#d9cdb0', 'center', BODY_FONT, false);
      ty += 34;
    }
    ctx.globalAlpha = 1;
    if (Sfx.muted) UI.text(ctx, 'muted (M)', W - 30, H - 64, 11, '#6a6050', 'right');
  },

  // world-space prompts (drawn inside world transform)
  prompt(ctx, x, y, key, label, t, col = '#e2d4b4') {
    ctx.font = `13px ${TITLE_FONT}`;
    const w = ctx.measureText(label).width + 40;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - w / 2, y - 16, w, 24);
    ctx.strokeStyle = 'rgba(150,130,100,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, y - 16, w, 24);
    ctx.fillStyle = col; ctx.fillRect(x - w / 2 + 6, y - 12, 18, 16);
    UI.text(ctx, key, x - w / 2 + 15, y + 1, 12, '#0a0606', 'center', TITLE_FONT, false);
    UI.text(ctx, label, x + 12, y + 1, 13, col, 'center', TITLE_FONT, false);
  },

  executeSigil(ctx, x, y, t) {
    const pulse = 0.6 + Math.sin(t * 8) * 0.4;
    ctx.save(); ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
    g.addColorStop(0, `rgba(220,20,20,${0.5 * pulse})`); g.addColorStop(1, 'rgba(220,20,20,0)');
    ctx.fillStyle = g; ctx.fillRect(-26, -26, 52, 52);
    ctx.globalCompositeOperation = 'source-over';
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = `rgba(230,60,50,${0.7 + pulse * 0.3})`; ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#ffd0c0'; ctx.font = `bold 13px ${TITLE_FONT}`; ctx.textAlign = 'center'; ctx.fillText('F', 0, 5);
    ctx.restore();
    UI.text(ctx, 'EXECUTE', x, y + 26, 11, `rgba(230,80,70,${0.6 + pulse * 0.4})`);
  },

  dialogue(ctx, g) {
    const d = g.dialogue; if (!d) return;
    const line = d.lines[d.i];
    const bx = 120, by = H - 150, bw = W - 240, bh = 112;
    const grad = ctx.createLinearGradient(0, by, 0, by + bh);
    grad.addColorStop(0, 'rgba(6,4,4,0.82)'); grad.addColorStop(1, 'rgba(14,8,8,0.92)');
    ctx.fillStyle = grad; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(160,130,90,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.strokeStyle = 'rgba(160,130,90,0.2)'; ctx.strokeRect(bx + 4.5, by + 4.5, bw - 8, bh - 8);
    if (line.who) UI.text(ctx, line.who, bx + 24, by + 28, 16, line.who === 'Aldric' ? '#a9b4c2' : (line.who === 'Lumi' || line.who === 'Pip') ? '#c9b3ff' : '#c9a35a', 'left');
    ctx.font = `18px ${BODY_FONT}`;
    const shown = line.text.slice(0, Math.floor(d.chars));
    const lines = wrapText(ctx, shown, bw - 48);
    lines.forEach((l, i) => UI.text(ctx, l, bx + 24, by + (line.who ? 54 : 40) + i * 22, 18, line.who ? '#e4dac4' : '#d8b56a', 'left', BODY_FONT));
    if (d.chars >= line.text.length) {
      const a = 0.5 + Math.sin(g.time * 5) * 0.5;
      ctx.fillStyle = `rgba(220,190,130,${a})`;
      ctx.beginPath(); ctx.moveTo(bx + bw - 30, by + bh - 22); ctx.lineTo(bx + bw - 20, by + bh - 22); ctx.lineTo(bx + bw - 25, by + bh - 15); ctx.fill();
    }
  },

  note(ctx, g) {
    const n = g.note; if (!n) return;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    const pw = 460, ph = 420, px = (W - pw) / 2, py = (H - ph) / 2;
    const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    grad.addColorStop(0, '#c8b894'); grad.addColorStop(1, '#a8946c');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(px, py + 6); ctx.lineTo(px + pw * 0.3, py); ctx.lineTo(px + pw * 0.7, py + 4); ctx.lineTo(px + pw, py);
    ctx.lineTo(px + pw - 4, py + ph); ctx.lineTo(px + pw * 0.5, py + ph - 5); ctx.lineTo(px + 3, py + ph); ctx.closePath(); ctx.fill();
    // blood stains
    ctx.fillStyle = 'rgba(110,10,10,0.35)';
    ctx.beginPath(); ctx.ellipse(px + pw - 70, py + ph - 70, 38, 22, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 60, py + 40, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
    UI.text(ctx, n.title, W / 2, py + 44, 20, '#3a1a10', 'center', TITLE_FONT, false);
    ctx.font = `16px ${BODY_FONT}`;
    const lines = wrapText(ctx, n.text, pw - 70);
    lines.forEach((l, i) => UI.text(ctx, l, px + 35, py + 82 + i * 20, 16, '#2a1a12', 'left', BODY_FONT, false));
    UI.text(ctx, Mobile.enabled ? 'tap to close' : '[E] close', W / 2, py + ph + 26, 12, '#9a8a6a');
  },

  // knight skin picker (title or pause)
  skins(ctx, g) {
    ctx.fillStyle = 'rgba(6,4,6,0.94)'; ctx.fillRect(0, 0, W, H);
    UI.text(ctx, 'APPEARANCE', W / 2, 62, 28, '#d8c8a4');
    UI.text(ctx, 'Choose how Sir Aldric looks. Purely cosmetic.', W / 2, 86, 13, '#8a7c62', 'center', BODY_FONT);
    const px = 90, py = 120;
    SKIN_ORDER.forEach((id, i) => {
      const y = py + i * 40, sel = i === g.skinSel, on = Skins.id === id;
      if (sel) { ctx.fillStyle = 'rgba(160,110,50,0.18)'; ctx.fillRect(px - 14, y - 24, 330, 34); }
      UI.text(ctx, (sel ? '›  ' : '   ') + SKINS[id].name, px, y, 18, sel ? '#f0d8a0' : '#b8a888', 'left');
      if (on) UI.text(ctx, 'worn', px + 300, y, 12, '#c9a35a', 'right');
    });
    ctx.fillStyle = 'rgba(165,190,155,0.12)'; ctx.fillRect(76, 375, 330, 40);
    UI.text(ctx, Mobile.enabled ? 'Fairy designs  ›' : '[Q] Fairy designs  ›', 241, 401, 17, '#c4d4b2');
    const id = SKIN_ORDER[g.skinSel];
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(500, 110, 380, 330);
    drawSkinPreview(ctx, id, g.time, 680, 400, 2.6);
    ctx.font = `13px ${BODY_FONT}`;
    wrapText(ctx, SKINS[id].desc, 360).forEach((l, i) => UI.text(ctx, l, 690, 462 + i * 17, 13, '#bfb59d', 'center', BODY_FONT));
    UI.text(ctx, Mobile.enabled ? 'tap a name to wear it  ·  ❚❚ back' : 'W/S choose  ·  E wear  ·  Esc back', W / 2, H - 14, 11, '#6a604c', 'center', BODY_FONT);
  },

  fairyStyles(ctx, g) {
    ctx.fillStyle = '#0c1110'; ctx.fillRect(0,0,W,H);
    UI.text(ctx, '‹ Knight skins', 30, 50, 14, '#9caa97', 'left', BODY_FONT);
    UI.text(ctx, 'FAIRY APPEARANCES', W/2, 49, 25, '#e2d8bf');
    UI.text(ctx, 'She follows for one reason: to see how you die.', W/2, 76, 13, '#91a28f', 'center', BODY_FONT);
    for (const [who,x] of [['lumi',330],['pip',490]]) {
      ctx.fillStyle = g.fairyWho === who ? '#334536' : '#19221d'; ctx.fillRect(x,88,140,36);
      UI.text(ctx, who === 'lumi' ? 'LUMI' : 'PIP', x+70,112,16,g.fairyWho === who ? '#e3deb9' : '#9caa97');
    }
    const pageStart = Math.floor(g.fairySel / 4) * 4;
    FAIRY_ORDER.slice(pageStart, pageStart + 4).forEach((id,i) => {
      const look=FAIRY_LOOKS[id], x=30+i*225, selected=pageStart+i===g.fairySel, worn=FairyStyles.choices[g.fairyWho]===id;
      ctx.fillStyle=selected ? '#202d25' : '#131c17'; ctx.fillRect(x,140,210,328);
      ctx.strokeStyle=selected ? '#bacb9a' : '#354438';ctx.lineWidth=selected ? 1.5 : 1;ctx.strokeRect(x+0.5,140.5,209,327);
      UI.text(ctx, '0'+(i+1)+'  '+look.name, x+105,166,15,selected ? '#f0e0b4' : '#b9c2ad');
      drawFairyPreview(ctx,id,g.time,x+105,282,3.15);
      ctx.font=`12px ${BODY_FONT}`;
      wrapText(ctx,look.desc,180).forEach((line,j)=>UI.text(ctx,line,x+105,320+j*15,12,'#a9b8a6','center',BODY_FONT));
      if (SILK_PALETTES[id]) {
        [look.dress,look.dark,look.trim,look.accent,look.hair,look.wing].forEach((color,j)=>{
          ctx.fillStyle=color;ctx.fillRect(x+63+j*15,345,11,5);
        });
      }
      // The smaller sprite uses gameplay scale, with no extra magnification.
      drawSkinPreview(ctx,Skins.id,1.2,x+60,454,1);
      drawFairyPreview(ctx,id,g.time,x+137,402,1);
      UI.text(ctx,'1× in game',x+142,432,10,'#92a38e','center',BODY_FONT);
      UI.text(ctx,worn ? 'WORN' : selected ? 'Choose' : '',x+142,451,11,worn ? '#e2d39c' : '#c2cfa9');
    });
    UI.text(ctx,['Drowned Silk palettes','Costume studies','Death-watchers','Earlier designs'][Math.floor(pageStart/4)]+'  ·  '+(Math.floor(pageStart/4)+1)+' / '+Math.ceil(FAIRY_ORDER.length/4)+'  ·  More designs ›',W/2,489,12,'#c6c7a0','center',BODY_FONT);
    UI.text(ctx, Mobile.enabled ? 'Tap Lumi or Pip, then a design. Tap the page label for more.' : 'A/D choose  ·  E wear  ·  Q Lumi/Pip  ·  F more designs  ·  Esc back',W/2,502,13,'#a8b69f','center',BODY_FONT);
    UI.text(ctx,'Enlarged detail above · Actual size beside the knight below',W/2,523,11,'#6f836f','center',BODY_FONT);
  },

  serviceMenu(ctx, g) {
    const info = g.serviceInfo(), sv = g.service;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    const pw = 460, ph = 240, px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(12,8,14,0.94)'; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(200,175,255,0.4)'; ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);
    UI.text(ctx, info.title, W / 2, py + 38, 20, '#e0d0f0');
    ctx.font = `13px ${BODY_FONT}`;
    wrapText(ctx, info.sub, pw - 60).forEach((l, i) => UI.text(ctx, l, W / 2, py + 62 + i * 16, 13, '#9a8ab0', 'center', BODY_FONT));
    const p = g.player;
    UI.text(ctx, `Embers ${p.embers}    ·    Infection ${p.turning ? 'TURNING' : Math.round(p.infection) + '%'}    ·    Tonics ${p.tonics}/${p.maxTonics}`, W / 2, py + 98, 12, '#b8a8c8', 'center', BODY_FONT);
    info.opts.forEach((o, i) => {
      const y = py + 116 + i * 36 + 14, sel = i === sv.sel;
      if (sel) { ctx.fillStyle = 'rgba(150,110,200,0.18)'; ctx.fillRect(px + 20, y - 22, pw - 40, 32); }
      UI.text(ctx, (sel ? '›  ' : '   ') + o.label, px + 36, y, 16, o.disabled ? '#5a5260' : sel ? '#f0e0ff' : '#b8a8c8', 'left');
      if (o.value) UI.text(ctx, o.value, px + pw - 36, y, 14, '#d0c0e0', 'right');
    });
    UI.text(ctx, Mobile.enabled ? 'tap to select, tap again to confirm  ·  ❚❚ leave' : 'W/S select  ·  E confirm  ·  Esc leave', W / 2, py + ph - 12, 11, '#6a607a', 'center', BODY_FONT);
  },

  shrineMenu(ctx, g) {
    const m = g.menu; if (!m) return;
    const p = g.player;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    const pw = 400, ph = 300, px = 60, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(10,7,6,0.92)'; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(200,150,80,0.4)'; ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);
    UI.text(ctx, m.shrine.name, px + pw / 2, py + 36, 20, '#e0c48a');
    UI.text(ctx, 'Thy wounds close. Thy vials are filled. The dead rise anew.', px + pw / 2, py + 60, 12, '#8a7c62', 'center', BODY_FONT);
    const cost = g.levelCost();
    UI.text(ctx, `Level ${p.level}    ·    Embers ${p.embers}    ·    Next: ${cost}`, px + pw / 2, py + 90, 13, '#c0b090', 'center', BODY_FONT);
    const opts = g.shrineOptions();
    opts.forEach((o, i) => {
      const y = py + 128 + i * 34, sel = i === m.sel;
      if (sel) { ctx.fillStyle = 'rgba(160,110,50,0.18)'; ctx.fillRect(px + 20, y - 21, pw - 40, 30); }
      UI.text(ctx, (sel ? '›  ' : '   ') + o.label, px + 40, y, 16, o.disabled ? '#5a5244' : sel ? '#f0d8a0' : '#b8a888', 'left');
      if (o.value !== undefined) UI.text(ctx, String(o.value), px + pw - 40, y, 16, '#d0c0a0', 'right');
    });
    UI.text(ctx, Mobile.enabled ? 'tap to select, tap again to confirm  ·  ❚❚ leave' : 'W/S select  ·  E confirm  ·  Esc leave', px + pw / 2, py + ph - 14, 11, '#6a604c', 'center', BODY_FONT);
    // stats panel
    const sx = px + pw + 20, sy = py;
    ctx.fillStyle = 'rgba(10,7,6,0.85)'; ctx.fillRect(sx, sy, 230, 170);
    ctx.strokeStyle = 'rgba(200,150,80,0.25)'; ctx.strokeRect(sx + 0.5, sy + 0.5, 230, 170);
    const rows = [['Health', Math.round(p.maxHp)], ['Stamina', Math.round(p.maxSt)], ['Damage', `×${p.dmgMul.toFixed(2)}`], ['Vials', p.maxFlasks], ['Weapon', p.weapon.name]];
    rows.forEach((r, i) => {
      UI.text(ctx, r[0], sx + 20, sy + 34 + i * 27, 14, '#9a8a6a', 'left', BODY_FONT);
      UI.text(ctx, String(r[1]), sx + 210, sy + 34 + i * 27, 14, '#e0d0b0', 'right', BODY_FONT);
    });
  },

  pause(ctx, g) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
    if (g.pauseView === 'journal') {
      Quests.drawJournal(ctx, g);
      UI.text(ctx, Mobile.enabled ? 'tap to close' : 'E / Esc — close', W / 2, H - 22, 12, '#7a6e5a', 'center', BODY_FONT);
      return;
    }
    UI.text(ctx, 'PAUSED', W / 2, 90, 36, '#d8c8a4');
    const opts = ['Resume', 'Journal', 'Appearance', 'Quit to Title'];
    opts.forEach((o, i) => UI.text(ctx, (i === g.pauseSel ? '›  ' : '') + o, W / 2, 140 + i * 30, 18, i === g.pauseSel ? '#f0d8a0' : '#8a7c62'));
    const ctl = [
      ['A / D', 'Move'], ['Shift', 'Sprint'], ['Space', 'Roll (invulnerable mid-roll)'],
      ['J  /  Left Click', 'Attack (3-hit chain)'], ['K  /  Right Click', 'Heavy attack'], ['S + Attack', 'Hamstring Cut (cripple)'],
      ['Hold L  /  C', 'Guard  (tap just before a hit to parry)'], ['F', 'Execute a weakened foe'],
      ['Q  ·  T', 'Drink a vial  ·  drink a tonic'], ['X  ·  E', 'Switch weapon  ·  interact'], ['M  ·  Esc', 'Mute  ·  pause'],
    ];
    if (Mobile.enabled) ctl.splice(0, ctl.length,
      ['Left stick', 'Walk  (push to the rim to sprint)'], ['⟳ ROLL', 'Roll — invulnerable mid-roll'], ['⚔ ATTACK', 'Attack (3-hit chain)'],
      ['✦ HEAVY', 'Heavy attack'], ['Stick down + ⚔', 'Hamstring Cut (cripple)'], ['⛨ GUARD', 'Hold to block, tap to parry'],
      ['☠ EXECUTE', 'Finish a weakened foe'], ['⚱ VIAL', 'Drink a vial'], ['✚ TONIC  ·  ⇄', 'Purge infection · switch weapon'], ['✋', 'Speak / read / rest'], ['⛶  ❚❚', 'Fullscreen · pause'], ['Tap', 'Continue dialogue']);
    ctl.forEach((c, i) => {
      const col = i < 6 ? 0 : 1;
      const x = col ? W / 2 + 40 : 140, y = 280 + (i % 6) * 29;
      UI.text(ctx, c[0], x, y, 14, '#c9a35a', 'left');
      UI.text(ctx, c[1], x + 150, y, 15, '#bfb59d', 'left', BODY_FONT);
    });
  },

  narration(ctx, g) {
    const n = g.narration;
    ctx.fillStyle = '#050304'; ctx.fillRect(0, 0, W, H);
    const line = n.lines[n.i];
    const a = clamp(n.t / 1.2, 0, 1) * (n.out ? clamp(1 - n.outT / 0.6, 0, 1) : 1);
    ctx.globalAlpha = a;
    const isEnd = line.startsWith('END OF');
    ctx.font = `${isEnd ? 22 : 22}px ${BODY_FONT}`;
    const lines = wrapText(ctx, line, 700);
    const total = lines.length * 32;
    lines.forEach((l, i) => {
      const big = isEnd && i === 0;
      UI.text(ctx, l, W / 2, H / 2 - total / 2 + i * 32 + 16, big ? 34 : 22, big ? '#b8261c' : '#d6c9ae', 'center', big ? TITLE_FONT : BODY_FONT);
    });
    ctx.globalAlpha = 1;
    UI.text(ctx, Mobile.enabled ? 'tap to continue      ❚❚ to skip' : 'E / Enter — continue      Esc — skip', W / 2, H - 30, 11, 'rgba(140,125,100,0.6)', 'center', BODY_FONT);
  },

  death(ctx, g) {
    const t = g.deathT;
    const a = clamp((t - 0.8) / 1.5, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${a * 0.6})`; ctx.fillRect(0, 0, W, H);
    const band = ctx.createLinearGradient(0, H / 2 - 60, 0, H / 2 + 60);
    band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, `rgba(0,0,0,${a * 0.8})`); band.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = band; ctx.fillRect(0, H / 2 - 60, W, 120);
    ctx.globalAlpha = a;
    const sc = 1 + (1 - a) * 0.08;
    ctx.save(); ctx.translate(W / 2, H / 2 + 14); ctx.scale(sc, sc);
    UI.text(ctx, g.turned ? 'THOU HAST TURNED' : 'THY OATH IS BROKEN', 0, 0, 52, '#9a1410');
    if (g.turned) UI.text(ctx, 'The Weeping took you. Your embers are gone.', 0, 34, 14, '#b88a80', 'center', BODY_FONT);
    ctx.restore();
    if (t > 3) UI.text(ctx, Mobile.enabled ? 'tap to rise again' : 'press E to rise again', W / 2, H / 2 + 60, 13, '#8a7a62', 'center', BODY_FONT);
    ctx.globalAlpha = 1;
  },

  title(ctx, g) {
    const t = g.time;
    // background
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050406'); sky.addColorStop(0.6, '#1d0b0e'); sky.addColorStop(1, '#3a1012');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const mg = ctx.createRadialGradient(W * 0.7, 150, 10, W * 0.7, 150, 260);
    mg.addColorStop(0, 'rgba(200,40,30,0.35)'); mg.addColorStop(1, 'rgba(200,40,30,0)');
    ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8a1a14'; ctx.beginPath(); ctx.arc(W * 0.7, 150, 64, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0607';
    drawTree(ctx, 110, H - 70, 300, 5, '#0a0607');
    drawTree(ctx, 860, H - 70, 240, 9, '#0a0607');
    ctx.fillRect(0, H - 72, W, 72);
    // gallows silhouette
    ctx.fillRect(560, H - 300, 7, 230); ctx.fillRect(560, H - 300, 90, 7); ctx.fillRect(640, H - 300, 2, 36);
    ctx.save(); ctx.translate(641, H - 264); ctx.rotate(Math.sin(t * 0.8) * 0.05);
    ctx.fillRect(-5, 0, 10, 34); ctx.fillRect(-4, 34, 3, 28); ctx.fillRect(1, 34, 3, 28); ctx.beginPath(); ctx.arc(0, -3, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // the knight, kneeling on his planted sword
    const kp = basePose({ lean: 0.18 + Math.sin(t * 1.2) * 0.015, head: 0.35, armF: 1.3, elbowF: 0.35, armB: 1.2, elbowB: 0.6, weap: 0.0, legF: 1.25, kneeF: 2.5, legB: 0.1, kneeB: 2.2 });
    const kj = solveRig(kp);
    ctx.save(); ctx.translate(W / 2 - 180, H - 70); ctx.scale(2.1, 2.1);
    const st = Object.assign({}, Skins.style());
    drawHumanoid(ctx, kj, kp, st, { head: true, armF: true, armB: true, legF: true, legB: true }, { weapon: c => WEAPONS.longsword.draw(c, 0.8), t, sway: 0.3 });
    if (st.embers) drawEmberCracks(ctx, kj, t);
    ctx.restore();
    // title
    ctx.save();
    ctx.shadowColor = 'rgba(160,10,10,0.6)'; ctx.shadowBlur = 24;
    UI.text(ctx, 'ASHEN OATH', W / 2 + 120, 150, 72, '#cbbfa4');
    ctx.restore();
    // blood drips from the title
    for (let i = 0; i < 7; i++) {
      const dx = W / 2 + 120 - 210 + i * 66 + ((i * 37) % 20);
      const len = ((t * (18 + i * 5) + i * 40) % 120);
      ctx.fillStyle = '#7a0a0a';
      ctx.fillRect(dx, 158, 2.4, len * 0.6);
      ctx.beginPath(); ctx.arc(dx + 1.2, 158 + len * 0.6, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    UI.text(ctx, 'A Tale of the Red Weeping  ·  Chapter One', W / 2 + 120, 190, 15, '#8a7a62', 'center', BODY_FONT);
    const opts = g.titleOptions();
    opts.forEach((o, i) => {
      const sel = i === g.titleSel;
      UI.text(ctx, (sel ? '›  ' : '') + o.label + (sel ? '  ‹' : ''), W / 2 + 120, 300 + i * 38, sel ? 22 : 19, sel ? '#f0d8a0' : '#7d715c');
    });
    UI.text(ctx, Mobile.enabled ? 'tap to begin · play in landscape · best with sound on' : 'W/S select · Enter confirm · best with sound on', W / 2 + 120, H - 26, 12, '#5a5040', 'center', BODY_FONT);
    Weather.draw(ctx, 1 / 60, 0, 0);
  },
};
