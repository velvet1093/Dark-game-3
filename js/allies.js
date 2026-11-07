'use strict';
// ---------------------------------------------------------------------------
// Survivors: living NPCs out on the map. Enemies hunt them once the knight is
// close enough to see it happen. Fighters stand their ground and strike back;
// civilians can only cower, and they die if nobody saves them.
// A dead survivor stays dead (saved), and their quest fails.
// ---------------------------------------------------------------------------
const ALLY_DEFS = {
  // ---------------- Brackenford ----------------
  tobias: { name: 'Gate Warden Tobias', fighter: true, hp: 180, dmg: 15, reach: 78, scale: 1.02, weapon: 'spear', shield: true, voice: 130,
    idle: { lean: 0.05, armF: 0.85, elbowF: 0.8, weap: 2.2, armB: 1.15, elbowB: 0.55, legF: 0.35, kneeF: 0.3, legB: -0.3, kneeB: 0.15 }, style: {
      helm: 'kettle', helmCol: '#6a675e', skin: '#c79a7e', eye: '#1a1210', armor: '#5d5a52', armorDark: '#45423c', armorLight: '#7a776e',
      body: '#4a4842', tabard: '#2b4a6b', tabardLen: 16, leg: '#3e3b35', legDark: '#2d2b27', boot: '#221e1a', bootDark: '#181512',
      hand: '#3a3833', limbW: 7, hipW: 8.5, shW: 10.5, belt: '#2a1d14', shield: '#2b4a6b', shieldRim: '#7a776e', emblemCol: '#c9b77a',
    } },
  edric: { name: 'Watchman Edric', fighter: true, hp: 180, dmg: 15, reach: 78, scale: 1.0, weapon: 'spear', shield: true, voice: 120,
    idle: { lean: 0.05, armF: 0.85, elbowF: 0.8, weap: 2.2, armB: 1.15, elbowB: 0.55, legF: 0.35, kneeF: 0.3, legB: -0.3, kneeB: 0.15 }, style: {
      helm: 'kettle', helmCol: '#6a675e', skin: '#c79a7e', eye: '#1a1210', armor: '#5d5a52', armorDark: '#45423c', armorLight: '#7a776e',
      body: '#4a4842', tabard: '#2b4a6b', tabardLen: 16, leg: '#3e3b35', legDark: '#2d2b27', boot: '#221e1a', bootDark: '#181512',
      hand: '#3a3833', limbW: 7, hipW: 8.5, shW: 10.5, belt: '#2a1d14', shield: '#2b4a6b', shieldRim: '#7a776e', emblemCol: '#c9b77a',
    } },
  jory: { name: 'Jory, a refugee', hp: 70, scale: 0.95, wander: true, voice: 190, idle: { lean: 0.08, armF: 0.35, elbowF: 0.5, armB: 0.15, elbowB: 0.5, legF: 0.15, kneeF: 0.1, legB: -0.12, kneeB: 0.1, head: 0.05 },
    style: {
      helm: 'man', hair: '#4a3020', skin: '#c9a68c', armor: '#4a4036', armorDark: '#3a3028', armorLight: '#4a4036',
      body: '#4a4036', tabard: '#3a3028', tabardLen: 10, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#c9a68c', limbW: 6, hipW: 8, shW: 9.5,
    } },
  mags: { name: 'Mags the Baker', hp: 70, scale: 0.92, wander: true, voice: 250, idle: { lean: 0.08, armF: 0.35, elbowF: 0.5, armB: 0.15, elbowB: 0.5, legF: 0.15, kneeF: 0.1, legB: -0.12, kneeB: 0.1, head: 0.05 },
    style: {
      helm: 'kerchief', kerchief: '#8a6a3a', hair: '#8a5a3a', skin: '#d6b29a', armor: '#6a4a3a', armorDark: '#d8ccb0', armorLight: '#6a4a3a',
      body: '#6a4a3a', tabard: '#d8ccb0', tabardLen: 28, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#d6b29a', limbW: 6, hipW: 8, shW: 9.5,
    } },
  reeve: { name: 'Reeve Aldous', hp: 80, scale: 1.0, story: 'reeve', voice: 120,
    idle: { lean: 0.02, armF: 0.6, elbowF: 1.4, armB: 0.5, elbowB: 1.5, legF: 0.15, kneeF: 0.1, legB: -0.12, kneeB: 0.1 },
    style: {
      helm: 'man', hair: '#9a9590', beard: '#a8a49e', skin: '#c49a82', armor: '#5a2a22', armorDark: '#3a1a16', armorLight: '#5a2a22',
      body: '#5a2a22', tabard: '#3a1a16', tabardLen: 30, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#c49a82', limbW: 6.5, emblem: '#d8b860', belt: '#d8b860', hipW: 8, shW: 9.5,
    } },
  garrick: { name: 'Garrick the Smith', hp: 90, scale: 1.08, service: 'smith', weapon: 'hammer', voice: 100,
    idle: { lean: 0.1, armF: 0.4, elbowF: 0.5, weap: 0.5, armB: 0.2, elbowB: 0.6, legF: 0.35, kneeF: 0.3, legB: -0.3, kneeB: 0.15 },
    style: {
      helm: 'man', hair: '#1a1410', beard: '#241a12', scar: true, skin: '#b08a6a', armor: '#b08a6a', armorDark: '#3a2a1c', armorLight: '#b08a6a',
      body: '#4a3626', tabard: '#3a2a1c', tabardLen: 22, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#b08a6a', limbW: 8.5, belt: '#1d140c', hipW: 8, shW: 9.5,
    } },
  fen: { name: 'Old Fen', hp: 60, scale: 0.95, voice: 140,
    idle: { lean: -0.3, head: 0.3, armF: 1.6, elbowF: 1.2, armB: 0.4, elbowB: 0.3, legF: 1.5, kneeF: 0.15, legB: 1.35, kneeB: 0.4 },
    style: {
      helm: 'man', hair: '#6a6a60', beard: '#7a7a70', skin: '#c09078', armor: '#4a3e30', armorDark: '#2e2620', armorLight: '#4a3e30',
      body: '#4a3e30', tabard: '#2e2620', tabardLen: 12, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#c09078', limbW: 6, hipW: 8, shW: 9.5,
    } },
  cass: { name: 'Widow Cass', hp: 60, scale: 0.9, voice: 240,
    idle: { lean: 0.15, head: 0.35, armF: 1.9, elbowF: 1.6, armB: 1.8, elbowB: 1.7, legF: 1.3, kneeF: 2.6, legB: 0.15, kneeB: 2.35 },
    style: {
      helm: 'kerchief', kerchief: '#141214', hair: '#3a2a20', skin: '#ccb09c', armor: '#1e1a1c', armorDark: '#141214', armorLight: '#1e1a1c',
      body: '#1e1a1c', tabard: '#141214', tabardLen: 30, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#ccb09c', limbW: 6, hipW: 8, shW: 9.5,
    } },
  // ---------------- the Sisters of Saint Ysolde ----------------
  agathe: { name: 'Mother Agathe', hp: 70, scale: 1.0, story: 'agathe', voice: 200, idle: { lean: 0.05, armF: 1.25, elbowF: 1.7, armB: 1.15, elbowB: 1.8, legF: 0.12, kneeF: 0.1, legB: -0.1, kneeB: 0.08, head: 0.12 },
    style: {
      helm: 'veil', veil: '#141016', band: '#f4f0ea', hair: '#a8a4a0', eyeCol: '#5a6a8a', skin: '#efd6c6', 
      armor: '#1a161c', armorDark: '#120f14', armorLight: '#2a242e', body: '#1c181e', tabard: '#1c181e', tabardLen: 34,
      leg: '#2a2228', legDark: '#1e181c', boot: '#141014', bootDark: '#0e0b0e', hand: '#efd6c6', limbW: 6, hipW: 8.5, shW: 9.5,
      collar: '#f4f0ea', cuffs: '#f4f0ea', frill: '#f4f0ea', flare: 1.7, lacing: false,
    } },
  elowen: { name: 'Sister Elowen', hp: 70, scale: 1.0, service: 'purify', weapon: 'sisterstaff', voice: 280,
    idle: { lean: 0.04, armF: 0.6, elbowF: 0.9, weap: 0.25, armB: 1.2, elbowB: 1.8, legF: 0.12, kneeF: 0.1, legB: -0.1, kneeB: 0.08, head: 0.1 },
    style: {
      helm: 'veil', veil: '#141016', band: '#f4f0ea', hair: '#ece8f2', eyeCol: '#9a7ad0', skin: '#efd6c6', 
      armor: '#1a161c', armorDark: '#120f14', armorLight: '#2a242e', body: '#1c181e', tabard: '#1c181e', tabardLen: 26,
      leg: '#2a2228', legDark: '#1e181c', boot: '#141014', bootDark: '#0e0b0e', hand: '#efd6c6', limbW: 6, hipW: 8.5, shW: 9.5,
      collar: '#f4f0ea', cuffs: '#f4f0ea', frill: '#f4f0ea', flare: 1.7, lacing: true,
    } },
  maelis: { name: 'Sister Maelis', hp: 70, scale: 1.0, service: 'tonics', voice: 290, idle: { lean: 0.05, armF: 1.25, elbowF: 1.7, armB: 1.15, elbowB: 1.8, legF: 0.12, kneeF: 0.1, legB: -0.1, kneeB: 0.08, head: 0.12 },
    style: {
      helm: 'veil', veil: '#141016', band: '#f4f0ea', hair: '#2a1c18', eyeCol: '#8a3a3a', skin: '#efd6c6', braids: true,
      armor: '#1a161c', armorDark: '#120f14', armorLight: '#2a242e', body: '#1c181e', tabard: '#1c181e', tabardLen: 26,
      leg: '#2a2228', legDark: '#1e181c', boot: '#141014', bootDark: '#0e0b0e', hand: '#efd6c6', limbW: 6, hipW: 8.5, shW: 9.5,
      collar: '#f4f0ea', cuffs: '#f4f0ea', frill: '#f4f0ea', flare: 1.7, lacing: true,
    } },
  // ---------------- the Weeping Mire ----------------
  ysane: { name: 'Sister Ysane', hp: 80, scale: 1.0, quest: 'ysane', serviceAfterQuest: 'purify', voice: 270,
    idle: { lean: 0.1, armF: 0.6, elbowF: 1.6, armB: 0.5, elbowB: 1.7, legF: 0.15, kneeF: 0.1, legB: -0.12, kneeB: 0.1, head: 0.2 },
    style: {
      helm: 'veil', veil: '#141016', band: '#f4f0ea', hair: '#6a3a22', eyeCol: '#4a7a5a', skin: '#efd6c6', braids: true,
      armor: '#1a161c', armorDark: '#120f14', armorLight: '#2a242e', body: '#1c181e', tabard: '#1c181e', tabardLen: 26,
      leg: '#2a2228', legDark: '#1e181c', boot: '#141014', bootDark: '#0e0b0e', hand: '#efd6c6', limbW: 6, hipW: 8.5, shW: 9.5,
      collar: '#f4f0ea', cuffs: '#f4f0ea', frill: '#f4f0ea', flare: 1.7, lacing: true,
    } },
  holt: { name: 'Ferryman Holt', fighter: true, hp: 200, dmg: 17, reach: 80, scale: 1.04, weapon: 'spear', voice: 110,
    idle: { lean: 0.08, armF: 0.85, elbowF: 0.8, weap: 2.3, armB: 0.6, elbowB: 1.0, legF: 0.35, kneeF: 0.3, legB: -0.3, kneeB: 0.15 },
    style: {
      helm: 'man', hair: '#7a7a70', beard: '#8a8a80', skin: '#b8906e', armor: '#3a4030', armorDark: '#2a2e22', armorLight: '#3a4030',
      body: '#3a4030', tabard: '#2a2e22', tabardLen: 14, leg: '#3a3028', legDark: '#2c241e', boot: '#211a14', bootDark: '#18130f',
      hand: '#b8906e', limbW: 6, hipW: 8, shW: 9.5,
    } },
  bram: {
    name: 'Sergeant Bram', fighter: true, hp: 170, dmg: 15, reach: 78, scale: 1.02, weapon: 'spear', shield: true, quest: 'bram',
    idle: { lean: 0.05, armF: 0.85, elbowF: 0.8, weap: 2.2, armB: 1.15, elbowB: 0.55, legF: 0.35, kneeF: 0.3, legB: -0.3, kneeB: 0.15 },
    style: {
      helm: 'kettle', helmCol: '#6a675e', skin: '#c79a7e', eye: '#1a1210', armor: '#5d5a52', armorDark: '#45423c', armorLight: '#7a776e',
      body: '#4a4842', tabard: '#2b4a6b', tabardLen: 16, leg: '#3e3b35', legDark: '#2d2b27', boot: '#221e1a', bootDark: '#181512',
      hand: '#3a3833', limbW: 7, hipW: 8.5, shW: 10.5, belt: '#2a1d14', shield: '#2b4a6b', shieldRim: '#7a776e', emblemCol: '#c9b77a',
    },
    voice: 140,
  },
  odo: {
    name: 'Odo the Sellsword', fighter: true, hp: 210, dmg: 19, reach: 72, scale: 1.08, weapon: 'falchion', quest: 'odo',
    idle: { lean: 0.12, armF: 0.7, elbowF: 0.9, weap: 2.0, armB: 0.2, elbowB: 0.9, legF: 0.4, kneeF: 0.35, legB: -0.35, kneeB: 0.2 },
    style: {
      helm: 'man', skin: '#b8866a', hair: '#3a2416', beard: '#4a2c18', scar: true, armor: '#5a4030', armorDark: '#46321f', armorLight: '#6e5240',
      body: '#4a3626', tabard: '#7a1a18', tabardLen: 14, leg: '#3a2e24', legDark: '#2b221a', boot: '#1e1712', bootDark: '#15100c',
      hand: '#b8866a', limbW: 8, hipW: 9.5, shW: 12, belt: '#1d140c', pauldron: false,
    },
    voice: 110,
  },
  hedda: {
    name: 'Hedda', fighter: false, hp: 95, scale: 0.9, quest: 'hedda',
    idle: { lean: 0.1, armF: 0.6, elbowF: 1.6, armB: 0.5, elbowB: 1.7, legF: 0.15, kneeF: 0.1, legB: -0.12, kneeB: 0.1, head: 0.2 },
    style: {
      helm: 'kerchief', kerchief: '#5a3a4a', hair: '#7a5030', skin: '#d0ad92', armor: '#6b5560', armorDark: '#56434d', armorLight: '#7e6672',
      body: '#6b5560', tabard: '#4a3a40', tabardLen: 30, leg: '#4a3a40', legDark: '#3a2e33', boot: '#241b18', bootDark: '#1b1412',
      hand: '#d0ad92', limbW: 5.5, hipW: 8, shW: 8.5,
    },
    voice: 260,
  },
  anselm: {
    name: 'Brother Anselm', fighter: false, hp: 85, scale: 0.98, quest: 'anselm',
    idle: { lean: 0.2, armF: 1.7, elbowF: 1.7, armB: 1.6, elbowB: 1.8, legF: 0.2, kneeF: 0.15, legB: -0.15, kneeB: 0.1, head: 0.3 },
    style: {
      helm: 'cowl', hood: '#58554f', skin: '#c2a690', armor: '#6a675f', armorDark: '#55524b', armorLight: '#7c7970',
      body: '#6a675f', tabard: '#55524b', tabardLen: 30, leg: '#6a675f', legDark: '#55524b', boot: '#201c18', bootDark: '#18150f',
      hand: '#c2a690', limbW: 6.5, hipW: 9, shW: 10, belt: '#a08a50',
    },
    voice: 170,
  },
};

const ALLY_TALK = {
  // ---------------- Brackenford ----------------
  reeve: {
    first: [
      { who: 'Reeve Aldous', text: 'A knight? Walking in off the road on his own two feet? Then the road isn\'t lost yet.' },
      { who: 'Reeve Aldous', text: 'Aldous, Reeve of Brackenford. We shut the gates the day Hallowmere burned. Nobody infected gets in. Nobody.' },
      { who: 'Reeve Aldous', text: 'The Weeping isn\'t a curse, whatever the Bishop\'s men preached. It\'s a sickness of the blood. One bite, one cut from those things, and it starts creeping through you.' },
      { who: 'Reeve Aldous', text: 'The infected don\'t sleep. Don\'t stop. They hunt, restless and hungry for killing, until something kills them. Every wound they deal makes another of them.' },
      { who: 'Reeve Aldous', text: 'If you\'ve been wounded out there, go to the Chapel of Saint Ysolde at the east end of town. The Sisters can draw the sickness out. Go now, before it\'s too late.' },
    ],
    after: [{ who: 'Reeve Aldous', text: 'Keep your blade clean and your wounds cleaner, knight. The chapel is east, past the smithy.' }],
  },
  agathe: {
    first: [
      { who: 'Mother Agathe', text: 'Peace, child. Come into the light. Let me see your eyes... Yes. The Weeping has found you already. It always does.' },
      { who: 'Mother Agathe', text: 'I am Mother Agathe of the Sisters of Saint Ysolde. Ysolde walked into a plague four hundred years ago and drew it out of the dying with her own blood and prayer.' },
      { who: 'Mother Agathe', text: 'We keep her rite. We cannot cure the Weeping, not truly. But we can draw it out of you, again and again, for as long as you keep coming back to us.' },
      { who: 'Mother Agathe', text: 'The sickness pours from the cathedral, from the Heart of Saint Varn. Bishop Malachar opened something that should have stayed sealed, and all of Vael is bleeding from that wound.' },
      { who: 'Mother Agathe', text: 'Sister Elowen will purify you whenever you need it. Sister Maelis brews tonics to hold the Weeping back on the road.' },
      { who: 'Mother Agathe', text: 'And child... the little light at your shoulder. We call them death-watchers. They follow the doomed. Whatever it tells you, it is not your friend.' },
      { who: 'Lumi', text: 'She\'s just jealous. Nobody watches HER.' },
      { who: 'Mother Agathe', text: 'And if you cross the Mire, look for Sister Ysane. She went to the Drowned Chapel to tend the dying a week ago. She has not come back.' },
    ],
    after: [{ who: 'Mother Agathe', text: 'Ysolde walks with those who bleed for others. Remember that, child.' }],
  },
  elowen: {
    first: [{ who: 'Sister Elowen', text: 'Mother Agathe told me about you. Sit, please. This will sting, and then it will be quiet.' }],
    greet: [{ who: 'Sister Elowen', text: 'Back again, Sir Knight? Let me see the wound.' }],
  },
  maelis: {
    first: [{ who: 'Sister Maelis', text: 'The tonics are bitter. That\'s how you know they work. One will push the Weeping back, even halt a turning, for a while.' }],
    greet: [{ who: 'Sister Maelis', text: 'Need more? Mind the dose. And come back to us, please.' }],
  },
  garrick: {
    first: [{ who: 'Garrick', text: 'That\'s a fine old blade, scarred to the tang. Give me embers for the coals and I\'ll put an edge on it that bites through mail.' }],
    greet: [{ who: 'Garrick', text: 'Back for more steel?' }],
  },
  tobias: { barks: ['Brackenford\'s gates are open to the living. Keep your blade sheathed in town.', 'Saw a carrier burst near the gate last week. Burned my boots after.'] },
  edric: { barks: ['East gate. Hallowmere\'s beyond, what\'s left of it. Mind the fires.', 'If you come back with red in your eyes, I\'ll have to stop you. No offence.'] },
  jory: { barks: ['I came from Hallowmere. My whole street... I watched them turn. Their eyes just filled up red.', 'They don\'t stop, sir. They don\'t ever stop. I hear them scratching at the walls at night.'] },
  mags: { barks: ['Bread\'s half sawdust now, but it\'s warm. Nobody goes hungry while I\'ve an oven.', 'My sister\'s in the chapel infirmary. The Sisters say the Weeping\'s slowed in her. Slowed...'] },
  fen: { barks: ['Drink? No? More for me. Drink keeps the Weeping out, everyone knows that.', 'I seen the Headsman once. Big as a bell tower. Wept like a babe when he swung.'] },
  cass: { barks: ['My husband was bitten bringing in the harvest. The Sisters held it back for a month. Then he stopped coming to the chapel.', 'Don\'t stop going to them, knight. Whatever happens, don\'t stop going.'] },
  holt: { barks: ['Ferried folk across this bog for thirty years. Now I ferry them into the ground.', 'The fat ones, the carriers... don\'t be close when they drop. Their bile gets in you.'] },
  ysane: {
    intro: [
      { who: 'Sister Ysane', text: 'Stay back! I... oh. A knight. Forgive me, I thought you were one of my sisters. The ones who turned.' },
      { who: 'Sister Ysane', text: 'I am Sister Ysane. Three of us came to the Drowned Chapel to nurse the dying. The Weeping took the other two.' },
      { who: 'Sister Ysane', text: 'They\'re still out there, in their habits, with knives. Please... give them rest. I cannot do it myself.' },
    ],
    progress: [{ who: 'Sister Ysane', text: 'They were my sisters. Please, end it quickly for them.' }],
    complete: [
      { who: 'Sister Ysane', text: 'Thank you. Ysolde keep them.' },
      { who: 'Sister Ysane', text: 'Let me repay you the only way I can. Whenever you pass this way, I will draw the Weeping out of you, as they do in Brackenford.' },
      { who: 'Sister Ysane', text: 'Take these too. Tonics I brewed for my sisters. They won\'t need them now. (+2 Purging Tonics)' },
    ],
    after: [{ who: 'Sister Ysane', text: 'Kneel, Sir Knight. Let me see how deep it runs.' }],
  },
  bram: {
    intro: [
      { who: 'Sergeant Bram', text: 'Stay back, they— oh. A knight. A real one. Thank God.' },
      { who: 'Sergeant Bram', text: 'Bram, sergeant of the road watch. What\'s left of it. The rest of my lads are hanging from those gallows.' },
      { who: 'Sergeant Bram', text: 'The hollowed keep crawling up this road. I can hold them a while, not forever. Help me clear them and I\'ll make it worth your while.' },
    ],
    progress: [{ who: 'Sergeant Bram', text: 'There\'s more of them down the road. Watch the ones on the ground. They\'re not dead, just patient.' }],
    complete: [
      { who: 'Sergeant Bram', text: 'That\'s the last of them. You fight like the old Order, sir.' },
      { who: 'Sergeant Bram', text: 'Take these. Wages I\'ll never get to spend, and my old pike. Keep them at the end of it, sir. (+300 Embers, Watchman\'s Pike)' },
    ],
    after: [{ who: 'Sergeant Bram', text: 'I\'ll hold the road now. Go on to Hallowmere. Someone there might still be breathing.' }],
  },
  hedda: {
    intro: [
      { who: 'Hedda', text: 'Please! Please, they\'re coming back, the singing ones, with the knives!' },
      { who: 'Hedda', text: 'I\'m Hedda. My husband kept the mill. They whipped him to death in the square and called it a blessing.' },
      { who: 'Hedda', text: 'Two of them are still hunting me. Please, sir... kill them before they find me.' },
    ],
    progress: [{ who: 'Hedda', text: 'They\'re close, I can hear them singing! Please hurry!' }],
    complete: [
      { who: 'Hedda', text: 'They\'re... gone? Truly?' },
      { who: 'Hedda', text: 'My husband carved this charm for me. It was blessed at the old chapel, before all this. Take it. It\'s all I have.' },
      { who: '', text: 'Received: Mill-Wife\'s Charm. Your vials increase by one.' },
    ],
    after: [{ who: 'Hedda', text: 'I\'ll wait here until dawn. If dawn still comes.' }],
  },
  odo: {
    intro: [
      { who: 'Odo', text: 'Ha! Another fool with a sword. Name\'s Odo. I fight for coin, and the garrison owes me three months of it.' },
      { who: 'Odo', text: 'They turned, see. Weeping and all. Still wearing my pay on their belts.' },
      { who: 'Odo', text: 'Help me cut down the garrison men by the old houses and we split the purse. Fair?' },
    ],
    progress: [{ who: 'Odo', text: 'Keep swinging, knight! Coin doesn\'t loot itself.' }],
    complete: [
      { who: 'Odo', text: 'Now THAT\'s a payday. Here\'s your half, as promised. (+500 Embers)' },
      { who: 'Odo', text: 'If you see a bishop, tell him Odo sends his regards. With a blade.' },
    ],
    after: [{ who: 'Odo', text: 'Don\'t look at me like that. Somebody\'s got to profit from the end of the world.' }],
  },
  anselm: {
    intro: [
      { who: 'Brother Anselm', text: 'Sir knight... do not look at the statues. They weep because they remember.' },
      { who: 'Brother Anselm', text: 'I am Anselm, keeper of the cathedral library. The Bishop tore a page from the Book of Varn before he sealed the doors.' },
      { who: 'Brother Anselm', text: 'It lies somewhere near the doors, past the templars. If you find it, bring it to me. I must know what he hid.' },
    ],
    progress: [{ who: 'Brother Anselm', text: 'The page... it should be further up the steps. Please, find it.' }],
    complete: [
      { who: 'Brother Anselm', text: '"What is a door, if not a thing that opens both ways..." Oh. Oh, Varn forgive us.' },
      { who: 'Brother Anselm', text: 'The Heart is not a relic. It is a gate. Malachar means to open it. Take these, and hurry. (+400 Embers)' },
    ],
    after: [{ who: 'Brother Anselm', text: 'I will pray for you, knight. I fear I pray to something that no longer listens.' }],
  },
};

// what a person says, and what happens afterwards
function allyTalk(a) {
  const d = a.def, f = Game.flags, T = ALLY_TALK[a.id];
  if (d.quest) {
    const r = Quests.talk(a), q = f.quests[d.quest];
    if (d.serviceAfterQuest && q && q.status === 'done' && !r.after) return { lines: r.lines, after: () => Game.openService(d.serviceAfterQuest, a) };
    return r;
  }
  if (d.story) {
    if (!f[d.story]) return { lines: T.first, after: () => { f[d.story] = true; } };
    return { lines: T.after };
  }
  if (d.service) {
    const met = f['met_' + a.id];
    return { lines: met ? T.greet : T.first, after: () => { f['met_' + a.id] = true; Game.openService(d.service, a); } };
  }
  a.bark = (a.bark || 0) + 1;
  return { lines: [{ who: d.name, text: T.barks[(a.bark - 1) % T.barks.length] }] };
}

class Ally {
  constructor(id, spawn, dead) {
    const d = ALLY_DEFS[id];
    this.id = id; this.def = d; this.name = d.name;
    this.homeX = spawn.x; this.x = spawn.x; this.y = GROUND; this.vx = 0;
    this.facing = 1; this.s = d.scale;
    this.maxHp = d.hp; this.hp = d.hp;
    this.state = 'idle'; this.st = 0; this.phase = ''; this.cool = 0.5; this.t = rand(0, 5);
    this.parts = { head: true, armF: true, armB: true, legF: true, legB: true };
    this.pose = basePose(d.idle); this.joints = solveRig(this.pose);
    this.body = { ox: 0, oy: 0, rot: 0 };
    this.dead = false; this.landed = false; this.hurtFlash = 0; this.lastHurt = 99;
    if (dead) { // already slain on an earlier visit: just a corpse
      this.dead = true; this.landed = true; this.body.rot = -Math.PI / 2; this.body.oy = -5; this.state = 'dead';
      this.parts.head = dead !== 'head';
    }
  }

  get fighter() { return this.def.fighter; }

  hurtbox() {
    if (this.dead) return { x: this.x, y: GROUND, w: 0, h: 0 };
    const h = (this.state === 'cower' ? 62 : 95) * this.s;
    return { x: this.x - 13 * this.s, y: GROUND - h, w: 26 * this.s, h };
  }

  worldPoint(p) {
    const c = Math.cos(this.body.rot), s = Math.sin(this.body.rot);
    const rx = p.x * c - p.y * s + this.body.ox, ry = p.x * s + p.y * c + this.body.oy;
    return { x: this.x + rx * this.s * this.facing, y: this.y + ry * this.s };
  }

  nearestFoe(g, range) {
    let best = null, bd = range;
    for (const e of g.enemies) {
      if (e.dead || e.boss || e.state === 'executed' || e.state === 'dormant') continue;
      const d = Math.abs(e.x - this.x);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  update(dt, g) {
    this.t += dt; this.st += dt; this.lastHurt += dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.dead) { this.updateDead(dt); return; }
    const p = g.player;
    const foe = this.nearestFoe(g, this.fighter ? 290 : 230);
    if (!foe && this.lastHurt > 4) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.06 * dt);
    const lo = this.homeX - (this.fighter ? 220 : 70), hi = this.homeX + (this.fighter ? 220 : 70);
    switch (this.state) {
      case 'idle':
      case 'return': {
        const hd = this.homeX - this.x;
        if (Math.abs(hd) > (this.def.wander ? 70 : 6)) { this.facing = Math.sign(hd); this.vx = this.facing * 70; this.state = 'return'; }
        else {
          this.vx = 0; this.state = 'idle';
          if (Math.abs(p.x - this.x) < 160 || !this.def.wander) this.facing = Math.sign(p.x - this.x) || 1;
        }
        if (this.def.wander && Math.abs(p.x - this.x) > 120) { // townsfolk go about their business
          this.wanderT = (this.wanderT || rand(1, 3)) - dt;
          if (this.wanderT <= 0) { this.wanderT = rand(2.5, 5); this.wanderTo = this.homeX + rand(-60, 60); }
          if (this.wanderTo !== undefined && Math.abs(this.wanderTo - this.x) > 6) { this.facing = Math.sign(this.wanderTo - this.x); this.vx = this.facing * 32; this.state = 'idle'; }
        }
        if (foe) { this.state = this.fighter ? 'engage' : 'cower'; this.st = 0; }
        break;
      }
      case 'engage': {
        if (!foe) { this.state = 'idle'; break; }
        const dx = foe.x - this.x, dist = Math.abs(dx);
        this.facing = Math.sign(dx) || this.facing;
        if (dist > this.def.reach * 0.75) this.vx = this.facing * 105; else this.vx = 0;
        this.cool -= dt;
        if (dist < this.def.reach && this.cool <= 0) {
          this.state = 'windup'; this.st = 0; this.phase = 'wind'; this.vx = 0; this.hitDone = false;
          this.motion = pick(['over', 'thrust']);
          this.from = Object.assign({}, this.pose);
          const m = MOTIONS[this.motion];
          this.wind = basePose(Object.assign({}, this.def.idle, m.wind));
          this.strike = basePose(Object.assign({}, this.def.idle, m.strike));
          if (chance(0.3)) Sfx.voice && Sfx.ctx && !Sfx.muted && Sfx.voice(this.def.voice, 0.2, 0.15, [650, 1100]);
        }
        break;
      }
      case 'windup':
        this.vx = 0;
        if (this.st >= 0.5) { this.state = 'attack'; this.st = 0; this.phase = 'active'; Sfx.play('swing'); this.vx = this.facing * 90; }
        break;
      case 'attack': {
        this.vx *= Math.exp(-dt * 8);
        if (!this.hitDone) {
          const box = { x: this.facing > 0 ? this.x : this.x - this.def.reach, y: GROUND - 115, w: this.def.reach, h: 110 };
          for (const e of g.enemies) {
            if (e.dead || e.boss || e.state === 'executed') continue;
            if (overlap(box, e.hurtbox())) {
              this.hitDone = true;
              const r = e.takeHit({ dmg: this.def.dmg, poise: 16, bleed: 18, sever: 0.8, heavy: false, targets: { armF: 2, armB: 2, legF: 1 } }, this, g);
              if (r === 'blocked') { this.state = 'hurt'; this.st = 0; this.vx = -this.facing * 90; }
              break;
            }
          }
        }
        if (this.st >= 0.13 && this.state === 'attack') { this.state = 'recover'; this.st = 0; this.phase = 'recover'; }
        break;
      }
      case 'recover':
        this.vx *= Math.exp(-dt * 8);
        if (this.st >= 0.6) { this.state = 'engage'; this.phase = ''; this.cool = rand(0.5, 1.2); }
        break;
      case 'cower': {
        // civilians shrink away from danger as far as they dare
        if (!foe) { if (this.st > 1) { this.state = 'idle'; } this.vx = 0; break; }
        this.st = 0;
        const dir = Math.sign(this.x - foe.x) || 1;
        this.facing = -dir;
        this.vx = Math.abs(foe.x - this.x) < 130 ? dir * 55 : 0;
        if (chance(dt * 0.6) && !this.screamed) { this.screamed = true; this.scream(); }
        break;
      }
      case 'hurt':
        this.vx *= Math.exp(-dt * 8);
        if (this.st >= 0.4) { this.state = this.fighter ? 'engage' : 'cower'; this.st = 0; this.phase = ''; }
        break;
    }
    this.x += this.vx * dt;
    this.x = clamp(this.x, lo, hi);
    this.computePose(dt);
    this.joints = solveRig(this.pose);
  }

  scream() {
    if (!Sfx.ctx || Sfx.muted) return;
    try { Sfx.voice(this.def.voice * 1.3, 0.5, 0.18, [800, 1400]); } catch (e) { /* ignore */ }
    const c = this.worldPoint(this.joints.head);
    FX.text(c.x, c.y - 24, 'Help!', '#e8d0b0', 13);
  }

  // called by enemies; mirrors Player.hurt
  hurt(dmg, src) {
    if (this.dead) return false;
    const fromDir = Math.sign(src.x - this.x) || 1;
    // fighters raise their guard against some blows
    if (this.fighter && this.state !== 'attack' && this.state !== 'windup' && fromDir === this.facing && chance(0.35)) {
      Sfx.play('clang');
      const c = this.worldPoint(this.joints.chest); FX.sparks(c.x + this.facing * 14, c.y, 8);
      return 'block';
    }
    dmg *= 0.7;
    this.hp -= dmg; this.lastHurt = 0; this.hurtFlash = 0.2;
    const c = this.worldPoint(this.joints.chest);
    FX.slash(c.x, c.y, -fromDir, 12 + dmg * 0.4);
    Sfx.play('splat');
    if (Sfx.ctx && !Sfx.muted) { try { Sfx.voice(this.def.voice, 0.25, 0.2, [700, 1200]); } catch (e) { /* ignore */ } }
    if (this.hp <= 0) { this.die(src, dmg > 18); return 'hit'; }
    this.state = 'hurt'; this.st = 0; this.vx = -fromDir * 110; this.phase = '';
    return 'hit';
  }

  die(src, heavy) {
    this.dead = true; this.hp = 0; this.state = 'dead'; this.st = 0; this.vx = 0;
    const dir = Math.sign(this.x - src.x) || 1;
    this.fallTo = (dir * this.facing > 0 ? 1 : -1) * Math.PI / 2;
    let how = true;
    if (heavy || chance(0.35)) { // a brutal end
      const n = this.worldPoint(this.joints.neck);
      this.parts.head = false; how = 'head';
      FX.addGib({ part: 'head', style: this.def.style, s: this.s, facing: this.facing, x: n.x, y: n.y, vx: dir * rand(80, 200), vy: rand(-620, -420), vr: rand(-12, 12), bleed: 5 });
      FX.gush(n.x, n.y, -Math.PI / 2, 36, 440);
      Sfx.play('sever');
      this.fountain = 2;
    }
    const c = this.worldPoint(this.joints.chest);
    FX.blood(c.x, c.y, -Math.PI / 2, 1.2, 280, 30);
    Sfx.play('enemyDie');
    Game.onAllyDeath(this, how);
  }

  updateDead(dt) {
    if (this.landed && this.st > 1) return;
    const p = clamp(this.st / 0.6, 0, 1);
    this.body.rot = lerp(0, this.fallTo || -Math.PI / 2, easeIn(p));
    this.body.oy = lerp(0, -5, p);
    if (p >= 1 && !this.landed) {
      this.landed = true; FX.dust(this.x, GROUND, 6); Sfx.play('thud');
      const c = this.worldPoint(this.joints.chest); FX.pool(c.x, 34 * this.s);
    }
    if (this.fountain > 0) {
      this.fountain -= dt;
      const n = this.worldPoint(this.joints.neck);
      FX.blood(n.x, n.y, -Math.PI / 2 + this.body.rot * this.facing * 0.9, 0.25, 200 + this.fountain * 120, 2, 1);
    }
  }

  computePose(dt) {
    const d = this.def.idle, s = this.state;
    let tgt, k = 1 - Math.exp(-dt * 12);
    if (s === 'windup') { this.pose = lerpPose(this.from, this.wind, easeOut(clamp(this.st / 0.5, 0, 1))); return; }
    if (s === 'attack') { this.pose = lerpPose(this.wind, this.strike, easeOut(clamp(this.st / 0.13, 0, 1))); return; }
    if (s === 'recover') { this.pose = lerpPose(this.strike, basePose(d), easeInOut(clamp(this.st / 0.6, 0, 1))); return; }
    switch (s) {
      case 'cower':
        tgt = Object.assign({}, d, { lean: 0.55, head: 0.5, armF: 2.6, elbowF: 1.9, armB: 2.4, elbowB: 2.0, legF: 1.0, kneeF: 1.9, legB: 0.2, kneeB: 1.8 });
        tgt.lean += Math.sin(this.t * 22) * 0.03; // trembling
        if (Math.abs(this.vx) > 1) tgt = walkPose(tgt, this.t * 9, 0.35, 0);
        break;
      case 'hurt': tgt = Object.assign({}, d, { lean: -0.4, head: -0.4 }); k = 1 - Math.exp(-dt * 25); break;
      case 'idle': case 'return': case 'engage':
        tgt = Math.abs(this.vx) > 1 ? walkPose(d, this.t * 8, 0.45, 0.05) : d; break;
      default: tgt = Object.assign({}, d, { lean: d.lean + Math.sin(this.t * 2) * 0.03 });
    }
    blendPose(this.pose, tgt, k);
  }

  draw(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.ellipse(this.x, GROUND + 3, (this.dead ? 44 : 18) * this.s, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing * this.s, this.s);
    ctx.translate(this.body.ox, this.body.oy);
    ctx.rotate(this.body.rot);
    if (this.hurtFlash > 0) ctx.globalAlpha = 0.75;
    const w = this.def.weapon;
    drawHumanoid(ctx, this.joints, this.pose, this.def.style, this.parts, { weapon: w ? (c => drawWeaponShape(c, w, 0)) : null, shield: !!this.def.shield, t: t + this.t });
    ctx.restore();
    if (!this.dead && this.hp < this.maxHp) {
      const top = GROUND - 120 * this.s, wdt = 40;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.x - wdt / 2 - 1, top - 1, wdt + 2, 5);
      ctx.fillStyle = '#5aa04a'; ctx.fillRect(this.x - wdt / 2, top, wdt * clamp(this.hp / this.maxHp, 0, 1), 3);
    }
  }
}
