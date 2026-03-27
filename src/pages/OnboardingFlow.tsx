import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { uid } from '../lib/storage';
import { CREATURES, getCreature } from '../lib/creatures';
import type { Character, PersonalityTag, HatchedCreature, SavedNightCard } from '../lib/types';

// ── Result type ──────────────────────────────────────────────────────────────

export interface OnboardingResult {
  character: Character;
  creature: HatchedCreature;
  dreamAnswer: string;
  photoDataUrl?: string;
  firstStory?: { title: string; text: string; headline: string; quote: string; memoryLine: string };
  nightCard?: Partial<SavedNightCard>;
}

export interface ChildProfile {
  childName: string;
  childAge: string;
  childPronouns: string;
  parentSecret?: string;
}

interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
  childProfile?: ChildProfile | null;
}

// ── DreamKeeper grid: first 9 creatures ──────────────────────────────────────

const GRID_CREATURES = CREATURES.slice(0, 9);

// ── Personality questions ────────────────────────────────────────────────────

const THIS_OR_THAT = [
  { q: 'Are you more\u2026', a: '🌲 A big adventure outside', b: '🛋️ A cozy night inside' },
  { q: 'Would you rather be\u2026', a: '🗺️ The first one to explore', b: '📚 The one who knows all the secrets' },
  { q: 'When something is hard, you\u2026', a: '⚡ Charge straight through it', b: '🔍 Find the clever way around it' },
];

// ── Star name constellation ──────────────────────────────────────────────────

const PIXEL_FONT: Record<string, number[][]> = (() => {
  // 5-row bitmaps for A-Z (3px wide each)
  const raw: Record<string, string[]> = {
    A: ['010','101','111','101','101'], B: ['110','101','110','101','110'],
    C: ['011','100','100','100','011'], D: ['110','101','101','101','110'],
    E: ['111','100','110','100','111'], F: ['111','100','110','100','100'],
    G: ['011','100','101','101','011'], H: ['101','101','111','101','101'],
    I: ['111','010','010','010','111'], J: ['111','001','001','101','010'],
    K: ['101','110','100','110','101'], L: ['100','100','100','100','111'],
    M: ['101','111','101','101','101'], N: ['101','111','111','101','101'],
    O: ['010','101','101','101','010'], P: ['110','101','110','100','100'],
    Q: ['010','101','101','011','001'], R: ['110','101','110','101','101'],
    S: ['011','100','010','001','110'], T: ['111','010','010','010','010'],
    U: ['101','101','101','101','010'], V: ['101','101','101','010','010'],
    W: ['101','101','101','111','101'], X: ['101','101','010','101','101'],
    Y: ['101','101','010','010','010'], Z: ['111','001','010','100','111'],
  };
  const result: Record<string, number[][]> = {};
  for (const [ch, rows] of Object.entries(raw)) {
    result[ch] = [];
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '1') result[ch].push([c, r]);
      }
    });
  }
  return result;
})();

function getNameStars(name: string): { x: number; y: number }[] {
  const chars = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
  if (!chars.length) return [];
  const stars: { x: number; y: number }[] = [];
  let offsetX = 0;
  chars.forEach(ch => {
    const pts = PIXEL_FONT[ch] || [];
    pts.forEach(([cx, cy]) => stars.push({ x: offsetX + cx, y: cy }));
    offsetX += 4; // 3 wide + 1 gap
  });
  // Normalize to 0-100 range
  const maxX = Math.max(...stars.map(s => s.x), 1);
  const maxY = Math.max(...stars.map(s => s.y), 1);
  return stars.map(s => ({
    x: 15 + (s.x / maxX) * 70,
    y: 25 + (s.y / maxY) * 50,
  }));
}

// ── Story template ───────────────────────────────────────────────────────────

function buildStory(vars: {
  CHILD_NAME: string; DK_NAME: string; CREATURE_TYPE: string; ARTICLE: string;
  CREATURE_EMOJI: string; FAV_THING: string; MOOD: string; DAY_DETAIL: string;
  PARENT_ROLE: string; PARENT_SECRET_PHRASE: string;
}): { cover: string; pages: string[] } {
  const v = vars;
  const favMap: Record<string, string> = {
    '🐾 Animals': 'warm fur and soft pawprints',
    '🚀 Space': 'stardust and rocket fuel',
    '🎨 Drawing': 'fresh paint and coloured pencils',
    '🎵 Music': 'humming melodies and gentle rhythms',
    '🧱 Building': 'wooden blocks and grand designs',
    '✨ Magic': 'sparkles and whispered spells',
    '🗺️ Adventure': 'wild paths and faraway places',
    '🦕 Dinosaurs': 'ancient footprints and rumbling roars',
  };
  const favSmell = favMap[v.FAV_THING] || 'something wonderful and familiar';
  const moodLower = (v.MOOD || 'happy').toLowerCase().replace(/^./, '');

  return {
    cover: `The Night You Were Found`,
    pages: [
      // Page 1
      `There is a place that exists only after dark.\n\nYou can't find it on any map. You won't see it from any window. It appears when the last light goes off and the world holds its breath.\n\nThat place is called the SleepSeed. And tonight, for the very first time, it was waiting for ${v.CHILD_NAME}.`,
      // Page 2
      `The stars came first.\n\nThey appeared one by one — not scattered the way stars usually are, but carefully, like someone was placing them on purpose.\n\n${v.CHILD_NAME} watched as they arranged themselves into something familiar. Something that looked, quite exactly, like their own name.\n\n"They've been spelling it every night," said a voice nearby. "Waiting for you to notice."`,
      // Page 3
      `${v.CHILD_NAME} turned around.\n\nThere, sitting on a soft patch of moonlight, was ${v.ARTICLE} ${v.CREATURE_TYPE}. Not a regular one — this one had eyes like lanterns and a coat that shimmered faintly, as though it had been dusted with something old and golden.\n\n"I know you," it said. "I've known you for a while. I just had to wait until you were ready."\n\n"Ready for what?"\n\n"To be found. I find the ones who have really good stories inside them. You have a very good one."`,
      // Page 4
      `"What's your name?" asked ${v.CHILD_NAME}.\n\n"That's for you to decide. I've been waiting a long time for the right person to name me."\n\nAnd so ${v.CHILD_NAME} thought carefully and said the name that felt exactly right.\n\n"${v.DK_NAME}," said ${v.CHILD_NAME}.\n\n"That's it," said ${v.DK_NAME}. "That's been my name my whole life. I just didn't know it until now."`,
      // Page 5
      `They walked through the SleepSeed — through fields that smelled like ${favSmell}, past trees that whispered old lullabies, under a sky so full of stars it seemed to hum.\n\n${v.DK_NAME} asked questions.\n\n"You seemed ${moodLower} today," it said. "${v.DAY_DETAIL}"\n\n"Yes," said ${v.CHILD_NAME}. "How did you know?"\n\n"Because I pay attention. That's what I'm for. I'm the one who always pays attention to you."`,
      // Page 6
      `Near the end of their walk, ${v.DK_NAME} stopped. It reached behind a star and pulled out an egg.\n\n"This is yours," said ${v.DK_NAME}. "Come back every night. Bring me your day."\n\n"And what happens?"\n\n"Something hatches. Something wonderful. But only if you come back."`,
      // Page 7
      `${v.CHILD_NAME} held the egg carefully on the walk home.\n\nThe SleepSeed grew quieter — the way a song does near its last note.\n\n"Will I see you again tomorrow?"\n\n"Every night. Same stars. Same sky. Just bring your day, and I'll turn it into something beautiful."`,
      // Page 8
      `When ${v.CHILD_NAME} got back, the most ordinary, wonderful thing was waiting.\n\n${v.PARENT_ROLE} was there — in that soft light that only exists right before you close your eyes.\n\n${v.PARENT_ROLE} reached out a hand — ${v.PARENT_SECRET_PHRASE} — and ${v.CHILD_NAME} took it.\n\n${v.PARENT_ROLE} tucked ${v.CHILD_NAME} in. Smoothed the blanket. Leaned down close.\n\n"I love you."\n\n"I love you."\n\n"Goodnight."\n\n"Goodnight."`,
      // Page 9
      `${v.PARENT_ROLE} stood up slowly. Walked to the door. Reached for the light. And stopped.\n\nJust for a moment they turned back and looked.\n\n${v.CHILD_NAME}, sleeping. Small face. Slow breathing.\n\nAnd there, curled up on the floor beside the bed — was ${v.DK_NAME}.\n\nKeeping watch. The way it always would.`,
      // Page 10 (italic amber closing)
      `This is what matters.\n\nAnd this memory is what they held onto forever.\n\nThe egg on the nightstand glowed once — soft and gold.\n\n✦ The End ✦\n\nNight 1 of ${v.CHILD_NAME}'s story. There are many more to come.`,
    ],
  };
}

// ── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MSGS = (name: string) => [
  `Adding ${name} as the hero\u2026`,
  `Weaving in today's adventure\u2026`,
  `Making ${name}'s DreamKeeper shine\u2026`,
  `Sprinkling in the magic\u2026`,
];

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --amber:#F5B84C;--amber-deep:#E8972A;
  --night:#080C18;--night-mid:#0D1120;--night-card:#0f1525;
  --cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);
  --teal-bright:#14d890;--purple:#9482ff;
  --ease-out:cubic-bezier(.16,1,.3,1);--ease-spring:cubic-bezier(.34,1.56,.64,1);
  --serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace;
}

@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 16px rgba(245,184,76,.25))}50%{filter:drop-shadow(0 0 36px rgba(245,184,76,.6))}}
@keyframes eggFloat{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-8px)}}
@keyframes creatureFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes creaturePop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}50%{transform:translate(-50%,-50%) scale(1.4)}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes shardPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes breathe{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes sparkleOrbit{0%{transform:rotate(0deg) translateX(56px) rotate(0deg)}100%{transform:rotate(360deg) translateX(56px) rotate(-360deg)}}
@keyframes sleepFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)}}
@keyframes polaroidDrop{from{opacity:0;transform:rotate(4deg) translateY(-20px) scale(.9)}to{opacity:1;transform:rotate(1deg) translateY(0) scale(1)}}
@keyframes twinkle{0%,100%{opacity:var(--lo,.05)}50%{opacity:var(--hi,.5)}}
@keyframes twinkle2{0%,100%{opacity:var(--lo,.15)}60%{opacity:var(--hi,.04)}}
@keyframes slideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
@keyframes eggShakeSlow{0%,100%{transform:translate(-50%,-50%) rotate(0)}25%{transform:translate(-50%,-50%) rotate(-3deg)}75%{transform:translate(-50%,-50%) rotate(3deg)}}
@keyframes eggShakeFast{0%,100%{transform:translate(-50%,-50%) rotate(0)}20%{transform:translate(-50%,-50%) rotate(-6deg)}40%{transform:translate(-50%,-50%) rotate(6deg)}60%{transform:translate(-50%,-50%) rotate(-6deg)}80%{transform:translate(-50%,-50%) rotate(6deg)}}
@keyframes eggShakeIntense{0%,100%{transform:translate(-50%,-50%) rotate(0) scale(1.05)}16%{transform:translate(-50%,-50%) rotate(-8deg) scale(1.08)}33%{transform:translate(-50%,-50%) rotate(8deg) scale(1.05)}50%{transform:translate(-50%,-50%) rotate(-8deg) scale(1.08)}66%{transform:translate(-50%,-50%) rotate(8deg) scale(1.05)}83%{transform:translate(-50%,-50%) rotate(-8deg) scale(1.08)}}
@keyframes burst{0%{transform:scale(0);opacity:1}100%{transform:scale(3);opacity:0}}
@keyframes dotPulse{0%,80%,100%{opacity:.3}40%{opacity:1}}

/* Root */
.ob{position:fixed;inset:0;z-index:1000;background:var(--night);font-family:var(--sans);color:var(--cream);overflow-y:auto;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.ob-inner{width:100%;max-width:430px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;position:relative;padding:0 24px}

/* Stars */
.ob-star{position:fixed;border-radius:50%;background:#EEE8FF;pointer-events:none;z-index:0}
.ob-star--sm{animation:twinkle var(--d,3s) var(--dl,0s) ease-in-out infinite}
.ob-star--lg{animation:twinkle2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite;background:#C8C0B0}

/* Screen container */
.ob-screen{flex:1;display:flex;flex-direction:column;position:relative;z-index:5;padding:16px 0 40px}

/* Typography */
.ob-h{font-family:var(--serif);font-weight:300;font-size:clamp(24px,5.5vw,30px);line-height:1.3;margin-bottom:10px}
.ob-sub{font-size:14px;font-weight:300;color:var(--cream-dim);line-height:1.7;margin-bottom:20px}
.ob-label{font-family:var(--mono);font-size:11px;font-weight:400;color:rgba(244,239,232,.35);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}
.ob-counter{font-family:var(--mono);font-size:11px;color:rgba(244,239,232,.3);text-align:center;margin-bottom:12px}

/* CTA button */
.ob-btn{width:100%;padding:17px;border:none;border-radius:14px;font-family:var(--sans);font-size:16px;font-weight:700;cursor:pointer;transition:all .2s var(--ease-out);margin-top:auto}
.ob-btn-amber{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;box-shadow:0 6px 24px rgba(200,130,20,.3)}
.ob-btn-amber:hover{filter:brightness(1.1);transform:translateY(-2px)}
.ob-btn-amber:disabled{opacity:.3;cursor:default;transform:none;filter:none}
.ob-btn-ghost{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);color:var(--cream-faint);font-size:14px;font-weight:500}
.ob-btn-ghost:hover{background:rgba(255,255,255,.07)}
.ob-skip{background:none;border:none;color:rgba(244,239,232,.25);font-size:12px;font-weight:400;cursor:pointer;margin-top:12px;font-family:var(--sans);transition:color .15s;display:block;width:100%;text-align:center}
.ob-skip:hover{color:rgba(244,239,232,.5)}

/* Creature grid */
.ob-cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0 16px}
.ob-ccard{border-radius:16px;padding:12px 4px 10px;text-align:center;cursor:pointer;border:2px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);transition:all .25s var(--ease-out);position:relative;overflow:hidden}
.ob-ccard:hover{background:rgba(255,255,255,.05);transform:scale(1.03)}
.ob-ccard:active{transform:scale(.95)}
.ob-ccard.on{border-color:var(--amber);background:rgba(245,184,76,.1);transform:scale(1.08);box-shadow:0 0 24px rgba(245,184,76,.2)}
.ob-ccard-emoji{font-size:40px;line-height:1;margin-bottom:4px;transition:all .3s}
.ob-ccard.on .ob-ccard-emoji{filter:drop-shadow(0 0 8px rgba(245,184,76,.4))}
.ob-ccard-name{font-size:9px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.04em}
.ob-ccard.on .ob-ccard-name{color:var(--amber)}

/* This-or-that */
.ob-tot-card{width:100%;padding:20px;border-radius:16px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:center;font-size:16px;font-weight:600;color:var(--cream);transition:all .2s var(--ease-out);font-family:var(--sans)}
.ob-tot-card:hover{background:rgba(255,255,255,.06);transform:scale(1.02)}
.ob-tot-card:active{transform:scale(.97)}
.ob-tot-or{font-family:var(--mono);font-size:11px;color:var(--cream-faint);text-align:center;padding:8px 0;text-transform:uppercase;letter-spacing:.1em}

/* Pips */
.ob-pips{display:flex;gap:6px;justify-content:center;margin-bottom:16px}
.ob-pip{width:8px;height:8px;border-radius:50%;transition:all .3s}

/* Input */
.ob-input{width:100%;padding:16px 0;border:none;border-bottom:1.5px solid rgba(255,255,255,.1);background:transparent;color:var(--cream);font-family:var(--serif);font-size:clamp(22px,5vw,28px);font-weight:300;outline:none;transition:border-color .2s;text-align:center}
.ob-input:focus{border-color:rgba(245,184,76,.4)}
.ob-input::placeholder{color:rgba(255,255,255,.15)}

/* Chips */
.ob-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 0 16px}
.ob-chip{padding:12px 18px;border-radius:14px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:center;font-size:14px;font-weight:500;transition:all .2s var(--ease-out)}
.ob-chip:hover{background:rgba(255,255,255,.06)}
.ob-chip.on{border-color:var(--amber);background:rgba(245,184,76,.1);color:var(--amber)}

/* Mood faces */
.ob-moods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0 16px}
.ob-mood{padding:14px 8px;border-radius:14px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:center;transition:all .2s var(--ease-out)}
.ob-mood:hover{background:rgba(255,255,255,.06)}
.ob-mood.on{border-color:var(--amber);background:rgba(245,184,76,.1)}
.ob-mood-emoji{font-size:28px;margin-bottom:4px}
.ob-mood-label{font-size:11px;font-weight:600;color:var(--cream-faint)}
.ob-mood.on .ob-mood-label{color:var(--amber)}

/* Textarea */
.ob-textarea{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--cream);font-family:var(--sans);font-size:14px;font-weight:400;outline:none;resize:none;min-height:80px;transition:border-color .2s;margin-bottom:12px}
.ob-textarea:focus{border-color:rgba(245,184,76,.4)}
.ob-textarea::placeholder{color:rgba(255,255,255,.18)}

/* Speech bubble */
.ob-bubble{position:relative;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;margin-top:12px}
.ob-bubble::before{content:'';position:absolute;top:-8px;left:50%;transform:translateX(-50%);border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid rgba(255,255,255,.08)}
.ob-bubble-text{font-size:14px;font-weight:300;color:var(--cream-dim);line-height:1.7;font-style:italic}

/* Loading dots */
.ob-dots-load{display:flex;gap:6px;justify-content:center;margin:12px 0}
.ob-dot-load{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:dotPulse 1.4s ease-in-out infinite}
.ob-dot-load:nth-child(2){animation-delay:.2s}
.ob-dot-load:nth-child(3){animation-delay:.4s}

/* Lullaby card */
.ob-lullaby{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:20px;margin-top:24px;text-align:center}
.ob-lullaby-text{font-family:var(--serif);font-style:italic;font-weight:300;font-size:13px;color:var(--cream-dim);line-height:1.8}
.ob-shards{display:flex;gap:8px;justify-content:center;margin-top:14px}
.ob-shard{width:10px;height:10px;border-radius:50%;border:1.5px solid rgba(245,184,76,.15);transition:all .3s}
.ob-shard.on{background:var(--amber);border-color:var(--amber);box-shadow:0 0 8px rgba(245,184,76,.4);animation:shardPop .4s var(--ease-spring)}
.ob-shard-label{font-family:var(--mono);font-size:10px;color:rgba(244,239,232,.25);margin-top:8px}

/* Reader */
.ob-reader{position:fixed;inset:0;z-index:1100;background:var(--night-card);overflow:hidden}
.ob-reader-topbar{position:absolute;top:0;left:0;right:0;z-index:30;padding:52px 24px 16px;background:linear-gradient(to bottom,#0f1525 60%,transparent)}
.ob-reader-progress{position:absolute;top:0;left:0;height:2px;background:var(--amber);transition:width .3s var(--ease-out)}
.ob-reader-eyebrow{font-family:var(--mono);font-size:10px;color:rgba(245,184,76,.5);margin-bottom:4px}
.ob-reader-title{font-family:var(--serif);font-weight:300;font-size:17px;color:var(--cream)}
.ob-reader-page-num{font-family:var(--mono);font-size:11px;color:rgba(244,239,232,.3)}
.ob-reader-track{display:flex;height:100%;transition:transform .4s var(--ease-out)}
.ob-reader-page{flex:0 0 100%;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center}
.ob-reader-scroll{max-width:380px;width:100%;padding:96px 28px 140px;overflow:hidden;display:flex;flex-direction:column;justify-content:center}
.ob-reader-text{font-family:var(--serif);font-size:15px;font-weight:300;line-height:1.72;color:var(--cream);white-space:pre-line}
.ob-reader-dialogue{font-family:var(--serif);font-style:italic;font-size:14px;font-weight:300;line-height:1.6;color:var(--cream-dim);border-left:2px solid rgba(245,184,76,.25);padding-left:16px;margin:16px 0}
.ob-reader-closing{font-family:var(--serif);font-style:italic;font-size:15px;font-weight:300;line-height:1.8;color:var(--amber);text-align:center}
.ob-reader-nav{position:absolute;bottom:0;left:0;right:0;z-index:30;padding:24px 24px 48px;background:linear-gradient(to top,#0f1525 70%,transparent);display:flex;align-items:center;justify-content:space-between}
.ob-reader-nav-btn{width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--cream);font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.ob-reader-nav-btn:hover{background:rgba(255,255,255,.08)}
.ob-reader-nav-btn:disabled{opacity:.2;cursor:default}
.ob-reader-nav-btn--amber{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);border:none;color:#080200}
.ob-reader-center{display:flex;flex-direction:column;align-items:center;gap:2px}
.ob-reader-center-emoji{font-size:24px}
.ob-reader-center-label{font-family:var(--mono);font-size:9px;color:rgba(244,239,232,.3)}

/* Cover page */
.ob-cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 28px;gap:16px}
.ob-cover-eyebrow{font-family:var(--mono);font-size:11px;color:rgba(245,184,76,.5);letter-spacing:.1em}
.ob-cover-title{font-family:var(--serif);font-weight:300;font-size:clamp(28px,6vw,36px);line-height:1.2;color:var(--cream)}
.ob-cover-creature{font-size:56px;animation:creatureFloat 3s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(245,184,76,.3))}
.ob-cover-sub{font-size:13px;font-weight:300;color:var(--cream-dim)}

/* Night card capture */
.ob-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.ob-photo-opt{padding:24px 12px;border-radius:16px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:center;transition:all .2s var(--ease-out)}
.ob-photo-opt:hover{background:rgba(255,255,255,.06)}
.ob-photo-opt-emoji{font-size:28px;margin-bottom:6px}
.ob-photo-opt-label{font-size:12px;font-weight:500;color:var(--cream-dim)}

/* Polaroid */
.ob-polaroid{background:#fff;border-radius:4px;padding:12px 12px 28px;max-width:260px;margin:16px auto;transform:rotate(1deg);box-shadow:0 8px 32px rgba(0,0,0,.4);animation:polaroidDrop .5s var(--ease-out) both}
.ob-polaroid-photo{width:100%;aspect-ratio:1;background:var(--night-card);border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:48px;overflow:hidden}
.ob-polaroid-photo img{width:100%;height:100%;object-fit:cover}
.ob-polaroid-title{font-family:var(--serif);font-size:13px;color:#1a1420;margin-top:10px;text-align:center}
.ob-polaroid-date{font-family:var(--mono);font-size:9px;color:#999;text-align:center;margin-top:2px}
.ob-polaroid-quote{font-style:italic;font-size:11px;color:#666;text-align:center;margin-top:6px;line-height:1.5}

/* Shard celebration */
.ob-shard-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:20px;margin:16px 0;text-align:center}
.ob-shard-ring{width:80px;height:80px;margin:0 auto 12px;position:relative}
.ob-shard-slots{display:flex;gap:8px;justify-content:center;margin:10px 0}
.ob-shard-slot{width:10px;height:10px;border-radius:50%;border:1.5px solid rgba(245,184,76,.15)}
.ob-shard-slot.on{background:var(--amber);border-color:var(--amber);box-shadow:0 0 6px rgba(245,184,76,.4)}
.ob-how-shards{display:flex;flex-direction:column;gap:12px;margin:16px 0;text-align:left}
.ob-how-shard{display:flex;gap:10px;align-items:flex-start}
.ob-how-shard-ico{font-size:16px;flex-shrink:0;line-height:1.4}
.ob-how-shard-text{font-size:12px;font-weight:400;color:var(--cream-dim);line-height:1.5}

/* Caption */
.ob-caption{font-family:var(--mono);font-size:11px;font-weight:300;color:rgba(244,239,232,.25);text-align:center;margin-top:14px}
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete, childProfile }: OnboardingFlowProps) {
  const { user } = useApp();

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  // Phase 0 — Welcome
  const [welcomePhase, setWelcomePhase] = useState<'title' | 'stars' | 'egg' | 'text'>('title');
  const [eggTapped, setEggTapped] = useState(false);

  // Phase 1 — DreamKeeper
  const [selectedCreatureId, setSelectedCreatureId] = useState('');
  const [totRound, setTotRound] = useState(0);
  const [totAnswers, setTotAnswers] = useState<string[]>([]);
  const [hatchProgress, setHatchProgress] = useState(0);
  const [hatched, setHatched] = useState(false);
  const [creatureName, setCreatureName] = useState('');
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase 2 — Questions
  const [favThing, setFavThing] = useState('');
  const [mood, setMood] = useState('');
  const [dayDetail, setDayDetail] = useState('');

  // Phase 3 — Story Gen
  const [storyReady, setStoryReady] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showReadyBtn, setShowReadyBtn] = useState(false);
  const [parentSecretPhrase, setParentSecretPhrase] = useState('');

  // Phase 4 — Reader
  const [rPage, setRPage] = useState(0);
  const [readAloud, setReadAloud] = useState(false);

  // Phase 5 — Night Card
  const [ncPhoto, setNcPhoto] = useState<string | undefined>();
  const [ncMemory, setNcMemory] = useState('');
  const [ncGenerated, setNcGenerated] = useState<{ headline: string; quote: string; memory_line: string; whisper: string } | null>(null);
  const [ncRevealed, setNcRevealed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const childName = childProfile?.childName || '';
  const childAge = childProfile?.childAge || '';
  const childPronouns = childProfile?.childPronouns || '';
  const parentSecret = childProfile?.parentSecret || '';

  const selectedCreature = selectedCreatureId ? getCreature(selectedCreatureId) : null;
  const creatureEmoji = selectedCreature?.emoji || '🥚';
  const creatureType = selectedCreature?.name.split(' ').pop()?.toLowerCase() || 'creature';
  const creatureArticle = /^[aeiou]/i.test(creatureType) ? 'an' : 'a';

  const parentRole = childPronouns === 'he/him' ? 'Dad' : childPronouns === 'she/her' ? 'Mum' : 'Parent';
  const fallbackSecretPhrase = 'the way they always did, at the end of every long and beautiful day';

  // Map personality answers to tags
  const personalityTags: PersonalityTag[] = useMemo(() => {
    const tagMap: Record<string, PersonalityTag> = {
      '🌲 A big adventure outside': 'adventurous',
      '🛋️ A cozy night inside': 'gentle',
      '🗺️ The first one to explore': 'brave',
      '📚 The one who knows all the secrets': 'curious',
      '⚡ Charge straight through it': 'determined',
      '🔍 Find the clever way around it': 'clever',
    };
    return totAnswers.map(a => tagMap[a]).filter(Boolean) as PersonalityTag[];
  }, [totAnswers]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goNext = useCallback(() => { setDirection('left'); setStep(s => s + 1); }, []);
  const goBack = useCallback(() => { setDirection('right'); setStep(s => Math.max(0, s - 1)); }, []);

  // ── Stars (ambient) ────────────────────────────────────────────────────
  const stars = useMemo(() => {
    const arr: { x: number; y: number; size: number; d: number; dl: number; bright: boolean }[] = [];
    for (let i = 0; i < 180; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random(), d: 2.5 + Math.random() * 3, dl: Math.random() * 4, bright: false,
    });
    for (let i = 0; i < 18; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 2 + Math.random(), d: 3 + Math.random() * 3, dl: Math.random() * 3, bright: true,
    });
    return arr;
  }, []);

  const starField = (
    <>
      {stars.map((s, i) => (
        <div key={i} className={`ob-star ${s.bright ? 'ob-star--lg' : 'ob-star--sm'}`}
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            '--d': `${s.d}s`, '--dl': `${s.dl}s`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );

  // ── Phase 0: Welcome animation sequence ─────────────────────────────────
  useEffect(() => {
    if (step !== 0) return;
    const t1 = setTimeout(() => setWelcomePhase('stars'), 1200);
    const totalStars = getNameStars(childName).length;
    const starDuration = totalStars > 0 ? 3800 : 800;
    const t2 = setTimeout(() => setWelcomePhase('egg'), 1200 + starDuration + 200);
    const t3 = setTimeout(() => setWelcomePhase('text'), 1200 + starDuration + 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [step, childName]);

  // ── Phase 3: Story generation timer + parent secret API call ─────────
  useEffect(() => {
    if (step !== 9) return;
    const t = setTimeout(() => setTimerDone(true), 6000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== 9) return;
    const msgInterval = setInterval(() => setLoadingMsgIdx(i => (i + 1) % 4), 2000);
    return () => clearInterval(msgInterval);
  }, [step]);

  // Generate parent secret phrase via Claude
  useEffect(() => {
    if (step !== 9) return;
    if (parentSecretPhrase) return; // already generated

    const generatePhrase = async () => {
      if (!parentSecret) {
        setParentSecretPhrase(fallbackSecretPhrase);
        setStoryReady(true);
        return;
      }
      try {
        const prompt = `You are completing ONE sentence in a children's bedtime story.\nThe sentence reads: "${childName} took ${parentRole}'s hand — [YOUR PHRASE HERE] — the way they always did."\nThe parent wrote this about their child: "${parentSecret}"\nWrite the bracketed portion as a single warm, specific, story-like phrase (8–15 words).\nOutput ONLY the phrase, no punctuation before or after, no explanation.`;
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 60,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const data = await res.json();
        const phrase = data?.content?.[0]?.text?.trim() || fallbackSecretPhrase;
        setParentSecretPhrase(phrase);
      } catch {
        setParentSecretPhrase(fallbackSecretPhrase);
      }
      setStoryReady(true);
    };
    generatePhrase();
  }, [step]); // eslint-disable-line

  // Show button when both conditions met
  useEffect(() => {
    if (timerDone && storyReady && step === 9) {
      const t = setTimeout(() => setShowReadyBtn(true), 2000);
      return () => clearTimeout(t);
    }
  }, [timerDone, storyReady, step]);

  // ── Build story data ───────────────────────────────────────────────────
  const storyData = useMemo(() => {
    const moodText = mood || 'happy';
    const detail = dayDetail.trim() || `It must have been a big day.`;
    return buildStory({
      CHILD_NAME: childName,
      DK_NAME: creatureName || 'your DreamKeeper',
      CREATURE_TYPE: creatureType,
      ARTICLE: creatureArticle,
      CREATURE_EMOJI: creatureEmoji,
      FAV_THING: favThing,
      MOOD: moodText,
      DAY_DETAIL: detail,
      PARENT_ROLE: parentRole,
      PARENT_SECRET_PHRASE: parentSecretPhrase || fallbackSecretPhrase,
    });
  }, [childName, creatureName, creatureType, creatureArticle, creatureEmoji, favThing, mood, dayDetail, parentRole, parentSecretPhrase]);

  // ── Hold-to-hatch handlers ──────────────────────────────────────────────
  const startHold = useCallback(() => {
    if (hatched) return;
    if (drainRef.current) { clearInterval(drainRef.current); drainRef.current = null; }
    holdRef.current = setInterval(() => {
      setHatchProgress(p => {
        const next = Math.min(p + 1.2, 100);
        if (next >= 100) {
          if (holdRef.current) clearInterval(holdRef.current);
          holdRef.current = null;
          setHatched(true);
          setTimeout(() => goNext(), 800);
        }
        return next;
      });
    }, 30);
  }, [hatched, goNext]);

  const stopHold = useCallback(() => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
    if (!hatched) {
      drainRef.current = setInterval(() => {
        setHatchProgress(p => {
          const next = Math.max(p - 0.8, 0);
          if (next <= 0 && drainRef.current) { clearInterval(drainRef.current); drainRef.current = null; }
          return next;
        });
      }, 30);
    }
  }, [hatched]);

  useEffect(() => {
    return () => {
      if (holdRef.current) clearInterval(holdRef.current);
      if (drainRef.current) clearInterval(drainRef.current);
    };
  }, []);

  // ── Night card generation ───────────────────────────────────────────────
  const generateNightCard = async () => {
    setNcRevealed(false);
    try {
      const prompt = `Generate a Night Card for a child's first bedtime story experience.\nChild's name: ${childName}\nStory title: "The Night You Were Found"\nParent's memory note: "${ncMemory}"\n\nReturn a JSON object with these fields:\n- headline: 3-6 words, warm title for this night\n- quote: 12-20 word sentence capturing the spirit of tonight\n- memory_line: 10-16 words, a gift to their future self\n- whisper: 8-14 words, a closing line for the parent\n\nReturn ONLY the JSON object, no explanation.`;
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setNcGenerated(parsed);
      } else {
        setNcGenerated({
          headline: 'The night it all began',
          quote: `${childName} met ${creatureName} and nothing was ever quite the same.`,
          memory_line: 'This was the first night. Every night after will build on this one.',
          whisper: 'You showed up. That\'s the whole thing.',
        });
      }
    } catch {
      setNcGenerated({
        headline: 'The night it all began',
        quote: `${childName} met ${creatureName} and nothing was ever quite the same.`,
        memory_line: 'This was the first night. Every night after will build on this one.',
        whisper: 'You showed up. That\'s the whole thing.',
      });
    }
    setNcRevealed(true);
  };

  // ── Photo handlers ─────────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      await new Promise(r => setTimeout(r, 500));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      stream.getTracks().forEach(t => t.stop());
      setNcPhoto(dataUrl);
    } catch {
      // Fallback to file picker
      fileRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNcPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Completion handler ─────────────────────────────────────────────────
  const handleComplete = () => {
    if (!user || !selectedCreature) return;
    const charId = uid();
    const character: Character = {
      id: charId,
      userId: user.id,
      name: childName,
      type: 'human',
      ageDescription: childAge,
      pronouns: childPronouns as any,
      personalityTags,
      weirdDetail: parentSecret || '',
      currentSituation: '',
      color: selectedCreature.color,
      emoji: creatureEmoji,
      storyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFamily: true,
    };

    const creature: HatchedCreature = {
      id: crypto.randomUUID?.() || uid(),
      userId: user.id,
      characterId: charId,
      name: creatureName,
      creatureType: selectedCreature.id,
      creatureEmoji: selectedCreature.emoji,
      color: selectedCreature.color,
      rarity: 'common',
      personalityTraits: personalityTags.map(String),
      dreamAnswer: dayDetail || favThing,
      parentSecret: parentSecret || '',
      hatchedAt: new Date().toISOString(),
      photoUrl: ncPhoto,
      weekNumber: 1,
    };

    const storyText = storyData.pages.join('\n\n');

    onComplete({
      character,
      creature,
      dreamAnswer: dayDetail || favThing,
      photoDataUrl: ncPhoto,
      firstStory: {
        title: storyData.cover,
        text: storyText,
        headline: ncGenerated?.headline || `The night ${creatureName} arrived.`,
        quote: ncGenerated?.quote || `${childName} met ${creatureName} and nothing was ever quite the same.`,
        memoryLine: ncGenerated?.memory_line || 'This was the first night.',
      },
      nightCard: ncGenerated ? {
        headline: ncGenerated.headline,
        quote: ncGenerated.quote,
        memory_line: ncGenerated.memory_line,
        whisper: ncGenerated.whisper,
        photo: ncPhoto,
        emoji: creatureEmoji,
      } : undefined,
    });
  };

  // ── Name stars for welcome ──────────────────────────────────────────────
  const nameStars = useMemo(() => getNameStars(childName), [childName]);

  // ── Render helpers ──────────────────────────────────────────────────────
  const animClass = direction === 'left' ? 'slideLeft' : 'slideRight';

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0 — Welcome (Phase 0)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    const totalStars = nameStars.length;
    const stepDelay = totalStars > 1 ? (3.8 - 0.3) / (totalStars - 1) : 0;

    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {/* WELCOME text */}
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 'clamp(32px,8vw,42px)', fontWeight: 300,
              color: 'var(--amber)', letterSpacing: '.06em',
              opacity: welcomePhase === 'title' ? 1 : 0.3,
              transition: 'opacity .8s',
              marginBottom: 24,
            }}>WELCOME</div>

            {/* Star constellation of name */}
            {(welcomePhase === 'stars' || welcomePhase === 'egg' || welcomePhase === 'text') && (
              <svg viewBox="0 0 100 100" style={{ width: 240, height: 120, margin: '0 auto 20px' }}>
                {nameStars.map((s, i) => (
                  <circle key={i} cx={s.x} cy={s.y} r="1.5" fill="var(--amber)">
                    <animate attributeName="opacity" from="0" to="1" begin={`${0.3 + i * stepDelay}s`} dur="0.3s" fill="freeze" />
                    <animate attributeName="r" from="0" to="1.5" begin={`${0.3 + i * stepDelay}s`} dur="0.3s" fill="freeze" />
                  </circle>
                ))}
              </svg>
            )}

            {/* Egg */}
            {(welcomePhase === 'egg' || welcomePhase === 'text') && (
              <div
                style={{
                  fontSize: 64, cursor: 'pointer',
                  animation: 'scaleIn .5s var(--ease-spring), glowPulse 3s ease-in-out .5s infinite',
                  marginBottom: 8,
                }}
                onClick={() => { setEggTapped(true); setTimeout(goNext, 400); }}
                role="button"
                tabIndex={0}
                aria-label="Tap the egg"
              >🥚</div>
            )}

            {/* Tap hint */}
            {welcomePhase === 'text' && !eggTapped && (
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(244,239,232,.3)',
                animation: 'breathe 2s ease-in-out infinite', marginBottom: 16,
              }}>Tap the egg</div>
            )}

            {/* Story intro text */}
            {welcomePhase === 'text' && (
              <div style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                fontSize: 15, color: 'var(--cream-dim)', lineHeight: 1.7,
                maxWidth: 320, textAlign: 'center',
                animation: 'fadeUp .6s var(--ease-out)',
              }}>
                Something has been waiting for you, {childName}. It arrived last night, while you were sleeping.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Creature Selection (Phase 1A)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-inner">
        <div className="ob-screen" key="s1" style={{ animation: `${animClass} .4s var(--ease-out)` }}>
          <div className="ob-label" style={{ textAlign: 'center' }}>Your DreamKeeper</div>
          <div className="ob-h" style={{ textAlign: 'center' }}>
            The egg is stirring. Which one calls to you?
          </div>

          <div className="ob-cgrid">
            {GRID_CREATURES.map(c => (
              <div
                key={c.id}
                className={`ob-ccard${selectedCreatureId === c.id ? ' on' : ''}`}
                onClick={() => setSelectedCreatureId(c.id)}
                role="button"
                tabIndex={0}
                aria-label={c.name}
              >
                <div className="ob-ccard-emoji">{c.emoji}</div>
                <div className="ob-ccard-name">{c.name.split(' ').pop()}</div>
              </div>
            ))}
          </div>

          <button
            className="ob-btn ob-btn-amber"
            disabled={!selectedCreatureId}
            onClick={goNext}
          >
            {selectedCreatureId ? 'I choose this one! \u2192' : 'Choose a DreamKeeper \u2192'}
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — This-or-That Personality (Phase 1B)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    const round = THIS_OR_THAT[totRound];
    const isPurple = totRound === 2;
    const accentColor = isPurple ? 'var(--purple)' : 'var(--amber)';

    const pick = (answer: string) => {
      const next = [...totAnswers, answer];
      setTotAnswers(next);
      if (totRound < 2) {
        setTimeout(() => setTotRound(r => r + 1), 550);
      } else {
        setTimeout(goNext, 550);
      }
    };

    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" key={`s2-${totRound}`} style={{ justifyContent: 'center', animation: `${animClass} .35s var(--ease-out)` }}>
            <div className="ob-pips">
              {[0, 1, 2].map(i => (
                <div key={i} className="ob-pip" style={{
                  background: i < totRound ? accentColor : i === totRound ? accentColor : 'rgba(255,255,255,.1)',
                  opacity: i <= totRound ? 1 : 0.3,
                  transform: i === totRound ? 'scale(1.3)' : 'scale(1)',
                }} />
              ))}
            </div>

            <div className="ob-h" style={{ textAlign: 'center', fontSize: 'clamp(20px,5vw,24px)' }}>
              {round.q}
            </div>
            <div style={{ height: 20 }} />

            <div className="ob-tot-card" onClick={() => pick(round.a)} role="button" tabIndex={0}
              style={{ borderColor: isPurple ? 'rgba(148,130,255,.15)' : undefined }}>
              {round.a}
            </div>
            <div className="ob-tot-or" style={{ color: isPurple ? 'var(--purple)' : undefined }}>or</div>
            <div className="ob-tot-card" onClick={() => pick(round.b)} role="button" tabIndex={0}
              style={{ borderColor: isPurple ? 'rgba(148,130,255,.15)' : undefined }}>
              {round.b}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Hold to Hatch (Phase 1C)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 3) {
    const eggAnim = hatchProgress > 80 ? 'eggShakeIntense .2s linear infinite'
      : hatchProgress > 55 ? 'eggShakeFast .3s linear infinite'
      : hatchProgress > 30 ? 'eggShakeSlow .5s linear infinite'
      : 'eggFloat 3s ease-in-out infinite';
    const glowOpacity = Math.min(hatchProgress / 100, 0.7);

    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" key="s3" style={{ justifyContent: 'center', alignItems: 'center', animation: `${animClass} .4s var(--ease-out)` }}>
            <div className="ob-sub" style={{ textAlign: 'center', maxWidth: 300, marginBottom: 40 }}>
              The egg knows who you are now. Hold it until it's ready.
            </div>

            {/* Egg + ring wrapper */}
            <div style={{ width: 170, height: 170, position: 'relative', margin: '0 auto 40px' }}
              onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
              onTouchStart={startHold} onTouchEnd={stopHold}
              role="button" tabIndex={0} aria-label="Hold the egg to hatch it"
            >
              {/* SVG ring */}
              <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200 }}
                viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="3" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--amber)" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - hatchProgress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset .1s', filter: `drop-shadow(0 0 ${8 + glowOpacity * 20}px rgba(245,184,76,${glowOpacity}))` }}
                  transform="rotate(-90 50 50)" />
              </svg>

              {/* Glow */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 120, height: 120, borderRadius: '50%',
                background: `radial-gradient(circle, rgba(245,184,76,${glowOpacity * 0.3}) 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Egg / Burst / Creature */}
              {hatched ? (
                <>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    fontSize: 56, animation: 'burst .4s ease-out forwards',
                    pointerEvents: 'none',
                  }}>💥</div>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    fontSize: 64, animation: 'creaturePop .5s var(--ease-spring) .3s both',
                  }}>{creatureEmoji}</div>
                </>
              ) : (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  fontSize: 64, animation: eggAnim,
                  cursor: 'pointer', userSelect: 'none',
                }}>🥚</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Name Your Creature (Phase 1D)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 4) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-inner">
        <div className="ob-screen" key="s4" style={{ justifyContent: 'center', alignItems: 'center', animation: `${animClass} .4s var(--ease-out)` }}>
          <div style={{ fontSize: 72, animation: 'creatureFloat 3s ease-in-out infinite', marginBottom: 16 }}>
            {creatureEmoji}
          </div>
          <div className="ob-sub" style={{ textAlign: 'center', maxWidth: 300 }}>
            This is your very own DreamKeeper. What will you name them?
          </div>
          <input
            className="ob-input"
            placeholder="Their name"
            value={creatureName}
            onChange={e => setCreatureName(e.target.value)}
            autoFocus
            aria-label="Name your DreamKeeper"
          />
          <div style={{ height: 24 }} />
          <button className="ob-btn ob-btn-amber" disabled={creatureName.trim().length < 1} onClick={goNext}>
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 5 — DreamKeeper Introduction (Phase 1E)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 5) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-inner">
        <div className="ob-screen" key="s5" style={{ justifyContent: 'center', animation: `${animClass} .4s var(--ease-out)` }}>
          {/* Creature + name row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              fontSize: 80, position: 'relative',
              filter: 'drop-shadow(0 0 24px rgba(245,184,76,.35))',
              animation: 'creatureFloat 3s ease-in-out infinite',
            }}>{creatureEmoji}</div>
            <div style={{
              fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 20,
              color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.04em',
            }}>{creatureName}</div>
          </div>

          {/* Speech bubble */}
          <div className="ob-bubble">
            <div className="ob-bubble-text">
              That's me! I've been waiting for you, {childName}. I knew you'd come. Every night, you bring me your day — and I'll turn it into something wonderful.
            </div>
          </div>

          <div style={{ height: 24 }} />
          <button className="ob-btn ob-btn-amber" onClick={goNext}>Let's go &rarr;</button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 6 — Question 1: Favourite thing (Phase 2)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 6) {
    const options = ['🐾 Animals', '🚀 Space', '🎨 Drawing', '🎵 Music', '🧱 Building', '✨ Magic', '🗺️ Adventure', '🦕 Dinosaurs'];
    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" key="s6" style={{ animation: `${animClass} .4s var(--ease-out)` }}>
            <div style={{ textAlign: 'center', fontSize: 40, animation: 'creatureFloat 3s ease-in-out infinite', margin: '8px 0 12px' }}>
              {creatureEmoji}
            </div>
            <div className="ob-counter">Question 1 of 3</div>
            <div className="ob-h" style={{ textAlign: 'center', fontSize: 'clamp(20px,5vw,24px)' }}>
              What's your favourite thing right now?
            </div>

            <div className="ob-chips">
              {options.map(o => (
                <div key={o} className={`ob-chip${favThing === o ? ' on' : ''}`} onClick={() => setFavThing(o)}
                  role="button" tabIndex={0}>{o}</div>
              ))}
            </div>

            <button className="ob-btn ob-btn-amber" disabled={!favThing} onClick={goNext}>
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 7 — Question 2: Mood (Phase 2)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 7) {
    const moods = [
      { emoji: '😄', label: 'Happy' }, { emoji: '🤪', label: 'Silly' }, { emoji: '😴', label: 'Tired' },
      { emoji: '🤩', label: 'Excited' }, { emoji: '🥰', label: 'Cozy' }, { emoji: '😢', label: 'Sad' },
    ];
    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" key="s7" style={{ animation: `${animClass} .4s var(--ease-out)` }}>
            <div style={{ textAlign: 'center', fontSize: 40, animation: 'creatureFloat 3s ease-in-out infinite', margin: '8px 0 12px' }}>
              {creatureEmoji}
            </div>
            <div className="ob-counter">Question 2 of 3</div>
            <div className="ob-h" style={{ textAlign: 'center', fontSize: 'clamp(20px,5vw,24px)' }}>
              How are you feeling right now?
            </div>

            <div className="ob-moods">
              {moods.map(m => (
                <div key={m.label} className={`ob-mood${mood === m.label ? ' on' : ''}`} onClick={() => setMood(m.label)}
                  role="button" tabIndex={0} aria-label={m.label}>
                  <div className="ob-mood-emoji">{m.emoji}</div>
                  <div className="ob-mood-label">{m.label}</div>
                </div>
              ))}
            </div>

            <button className="ob-btn ob-btn-amber" disabled={!mood} onClick={goNext}>
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 8 — Question 3: Day Detail (Phase 2)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 8) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-inner">
        <div className="ob-screen" key="s8" style={{ animation: `${animClass} .4s var(--ease-out)` }}>
          <div style={{ textAlign: 'center', fontSize: 40, animation: 'creatureFloat 3s ease-in-out infinite', margin: '8px 0 12px' }}>
            {creatureEmoji}
          </div>
          <div className="ob-counter">Question 3 of 3</div>
          <div className="ob-h" style={{ textAlign: 'center', fontSize: 'clamp(20px,5vw,24px)' }}>
            What's making you feel {mood.toLowerCase()} today?
          </div>

          <textarea
            className="ob-textarea"
            placeholder="Tell me about your day..."
            value={dayDetail}
            onChange={e => setDayDetail(e.target.value)}
            rows={3}
            aria-label="Tell me about your day"
          />

          <button className="ob-btn ob-btn-amber" onClick={goNext}>
            Let's take our first adventure together &rarr;
          </button>
          <button className="ob-skip" onClick={goNext}>Skip</button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 9 — Story Generating (Phase 3)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 9) {
    const msgs = LOADING_MSGS(childName);
    const bothReady = timerDone && storyReady;
    const titleText = bothReady ? 'Ready. 🌙' : `${childName}'s story is Loading\u2026`;

    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" key="s9" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {/* Creature with sparkles */}
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
              <div style={{ fontSize: 72, lineHeight: 1 }}>{creatureEmoji}</div>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--amber)',
                  animation: `sparkleOrbit 3s linear ${i * 1}s infinite`,
                  opacity: bothReady ? 0 : 1, transition: 'opacity .5s',
                }} />
              ))}
            </div>

            {/* Title */}
            <div style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(22px,5vw,28px)', lineHeight: 1.3,
              color: bothReady ? 'var(--amber)' : 'var(--cream)',
              filter: bothReady ? 'drop-shadow(0 0 16px rgba(245,184,76,.4))' : 'none',
              transition: 'all .6s',
              marginBottom: 12,
            }}>{titleText}</div>

            {/* Rotating message + dots — hidden after ready */}
            {!bothReady && (
              <div style={{ minHeight: 40 }}>
                <div key={loadingMsgIdx} style={{
                  fontSize: 13, fontWeight: 300, color: 'var(--cream-dim)',
                  animation: 'fadeUp .4s var(--ease-out)',
                }}>{msgs[loadingMsgIdx]}</div>
                <div className="ob-dots-load" style={{ marginTop: 12 }}>
                  <div className="ob-dot-load" /><div className="ob-dot-load" /><div className="ob-dot-load" />
                </div>
              </div>
            )}

            {/* Ready button — fades in */}
            {showReadyBtn && (
              <div style={{ animation: 'fadeUp .5s var(--ease-out)', marginTop: 16 }}>
                <button className="ob-btn ob-btn-amber" style={{ maxWidth: 320 }} onClick={goNext}>
                  Get cozy. Start your story &rarr;
                </button>
              </div>
            )}

            {/* Lullaby card */}
            <div className="ob-lullaby">
              <div className="ob-lullaby-text">
                One egg for {childName}, one egg for two,<br />
                Seven nights of stories, then something brand new.<br />
                Keep it close, keep it warm, come back every night —<br />
                And on the seventh evening, something hatches in the light.
              </div>
              <div className="ob-shards">
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className={`ob-shard${i === 0 ? ' on' : ''}`} />
                ))}
              </div>
              <div className="ob-shard-label">Night 1 of 7 — your first shard</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 10 — Story Reader (Phase 4)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 10) {
    const totalPages = 11; // 0=cover + 10 pages
    const isCover = rPage === 0;
    const isLast = rPage === 10;
    const progressPct = rPage === 0 ? 0 : (rPage / 10) * 100;

    // Parse pages: split dialogue from narrative
    const renderPage = (pageText: string, pageIdx: number) => {
      if (pageIdx === 10) {
        // Last page — italic amber closing
        return (
          <div className="ob-reader-scroll">
            <div className="ob-reader-closing">{pageText}</div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 36, animation: 'glowPulse 3s ease-in-out infinite', marginBottom: 16 }}>{creatureEmoji}</div>
              <button className="ob-btn ob-btn-amber" style={{ maxWidth: 300 }} onClick={goNext}>
                Capture this night &rarr;
              </button>
            </div>
          </div>
        );
      }

      const paragraphs = pageText.split('\n\n');
      return (
        <div className="ob-reader-scroll">
          {paragraphs.map((p, i) => {
            // Detect dialogue: starts with " or contains speaking pattern
            const isDialogue = /^[""\u201C]/.test(p.trim()) || /^"/.test(p.trim());
            return isDialogue
              ? <div key={i} className="ob-reader-dialogue">{p}</div>
              : <div key={i} className="ob-reader-text" style={{ marginBottom: 16 }}>{p}</div>;
          })}
        </div>
      );
    };

    // Toggle read-aloud
    const toggleReadAloud = () => {
      if (readAloud) {
        speechSynthesis.cancel();
        setReadAloud(false);
      } else {
        if (rPage >= 1 && rPage <= 10) {
          const text = storyData.pages[rPage - 1];
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.onend = () => setReadAloud(false);
          speechSynthesis.speak(utterance);
          setReadAloud(true);
        }
      }
    };

    return (
      <div className="ob-reader">
        <style>{CSS}</style>

        {/* Progress rail */}
        <div className="ob-reader-progress" style={{ width: `${progressPct}%` }} />

        {/* Top bar — hidden on cover */}
        <div className="ob-reader-topbar" style={{ opacity: isCover ? 0 : 1, pointerEvents: isCover ? 'none' : 'auto', transition: 'opacity .3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="ob-reader-eyebrow">✦ Your first story</div>
              <div className="ob-reader-title">{storyData.cover}</div>
            </div>
            <div className="ob-reader-page-num">{rPage} / 10</div>
          </div>
        </div>

        {/* Page track */}
        <div className="ob-reader-track" style={{ transform: `translateX(-${rPage * 100}%)`, width: `${totalPages * 100}%` }}>
          {/* Cover */}
          <div className="ob-reader-page">
            <div className="ob-cover">
              <div className="ob-cover-eyebrow">✦ Night 1 ✦</div>
              <div className="ob-cover-title">{storyData.cover}</div>
              <div className="ob-cover-creature">{creatureEmoji}</div>
              <div className="ob-cover-sub">A story written just for {childName}</div>
            </div>
          </div>

          {/* Story pages 1-10 */}
          {storyData.pages.map((text, i) => (
            <div key={i} className="ob-reader-page">
              {renderPage(text, i + 1)}
            </div>
          ))}
        </div>

        {/* Bottom nav — hidden on last page */}
        <div className="ob-reader-nav" style={{ display: isLast ? 'none' : undefined }}>
          <button
            className="ob-reader-nav-btn"
            disabled={isCover}
            onClick={() => { speechSynthesis.cancel(); setReadAloud(false); setRPage(p => Math.max(0, p - 1)); }}
            aria-label="Previous page"
          >&larr;</button>

          {/* Center: creature + read aloud */}
          {!isCover && (
            <div className="ob-reader-center" onClick={toggleReadAloud} style={{ cursor: 'pointer' }}
              role="button" tabIndex={0} aria-label="Toggle read aloud">
              <div className="ob-reader-center-emoji">{creatureEmoji}</div>
              <div className="ob-reader-center-label">{readAloud ? 'reading...' : 'read aloud'}</div>
            </div>
          )}

          {isCover ? (
            <button className="ob-btn ob-btn-amber" style={{ maxWidth: 220, marginTop: 0 }}
              onClick={() => setRPage(1)}>
              Begin the story &rarr;
            </button>
          ) : (
            <button
              className="ob-reader-nav-btn ob-reader-nav-btn--amber"
              onClick={() => { speechSynthesis.cancel(); setReadAloud(false); setRPage(p => Math.min(10, p + 1)); }}
              aria-label="Next page"
            >&rarr;</button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 11 — Night Card Capture (Phase 5)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 11) {
    const canSubmit = ncMemory.trim().length > 0 || ncPhoto;

    if (ncRevealed && ncGenerated) {
      // Polaroid reveal
      return (
        <div className="ob">
          <style>{CSS}</style>
          {starField}
          <div className="ob-inner">
            <div className="ob-screen" key="s11r" style={{ justifyContent: 'center', alignItems: 'center' }}>
              <div className="ob-polaroid">
                <div className="ob-polaroid-photo">
                  {ncPhoto ? <img src={ncPhoto} alt="Tonight" /> : creatureEmoji}
                </div>
                <div className="ob-polaroid-title">{ncGenerated.headline}</div>
                <div className="ob-polaroid-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="ob-polaroid-quote">"{ncGenerated.quote}"</div>
              </div>

              <button className="ob-btn ob-btn-amber" style={{ maxWidth: 320, marginTop: 24 }} onClick={goNext}>
                Continue &rarr;
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        <div className="ob-inner">
          <div className="ob-screen" key="s11" style={{ animation: `${animClass} .4s var(--ease-out)` }}>
            <div className="ob-h" style={{ textAlign: 'center' }}>
              Let's remember our first night and when we met.
            </div>
            <div className="ob-sub" style={{ textAlign: 'center' }}>
              A moment this good deserves to be kept.
            </div>

            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
              onChange={handleFileUpload} />

            <div className="ob-photo-grid">
              <div className="ob-photo-opt" onClick={handleTakePhoto} role="button" tabIndex={0} aria-label="Take a photo">
                <div className="ob-photo-opt-emoji">📸</div>
                <div className="ob-photo-opt-label">Take a photo together now</div>
              </div>
              <div className="ob-photo-opt" onClick={() => fileRef.current?.click()} role="button" tabIndex={0} aria-label="Upload a photo">
                <div className="ob-photo-opt-emoji">🖼️</div>
                <div className="ob-photo-opt-label">Upload a photo from today</div>
              </div>
            </div>

            {ncPhoto && (
              <div style={{ textAlign: 'center', margin: '8px 0 12px' }}>
                <img src={ncPhoto} alt="Preview" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(245,184,76,.2)' }} />
              </div>
            )}

            <div className="ob-label">One thing you loved about tonight</div>
            <textarea
              className="ob-textarea"
              placeholder="The way they looked at me when..."
              value={ncMemory}
              onChange={e => setNcMemory(e.target.value)}
              rows={3}
              aria-label="One thing you loved about tonight"
            />

            <button className="ob-btn ob-btn-amber" onClick={generateNightCard}
              disabled={!canSubmit}>
              Make our night card &rarr;
            </button>
            <button className="ob-skip" onClick={goNext}>Skip for tonight</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 12 — First Shard (Phase 6)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 12) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-inner">
        <div className="ob-screen" key="s12" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', animation: `${animClass} .4s var(--ease-out)` }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{creatureEmoji}</div>
          <div className="ob-label" style={{ textAlign: 'center' }}>✦ Night 1 complete</div>
          <div className="ob-h" style={{ textAlign: 'center' }}>You earned your first shard! ✨</div>

          {/* Egg card */}
          <div className="ob-shard-card">
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 10px' }}>
              <svg viewBox="0 0 100 100" style={{ width: 80, height: 80 }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="4" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--amber)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - 1 / 7)}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(245,184,76,.4))' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 36 }}>🥚</div>
            </div>

            <div className="ob-shard-slots">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`ob-shard-slot${i === 0 ? ' on' : ''}`} />
              ))}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,239,232,.3)', marginTop: 6 }}>
              1 of 7 shards collected
            </div>
          </div>

          {/* How shards work */}
          <div className="ob-how-shards">
            <div className="ob-how-shard">
              <div className="ob-how-shard-ico">🌙</div>
              <div className="ob-how-shard-text">Every night you do the ritual, you earn one shard.</div>
            </div>
            <div className="ob-how-shard">
              <div className="ob-how-shard-ico">✦</div>
              <div className="ob-how-shard-text">Collect all 7 shards — one per night — and the egg is ready.</div>
            </div>
            <div className="ob-how-shard">
              <div className="ob-how-shard-ico">🥚</div>
              <div className="ob-how-shard-text">On the 7th night, your egg hatches revealing a new DreamKeeper.</div>
            </div>
          </div>

          <button className="ob-btn ob-btn-amber" onClick={goNext}>
            Can't wait for tomorrow &rarr;
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 13 — See You Tomorrow (Phase 7)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 13) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-inner">
        <div className="ob-screen" key="s13" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', animation: `${animClass} .4s var(--ease-out)` }}>
          <div style={{ fontSize: 56, animation: 'sleepFloat 4s ease-in-out infinite', marginBottom: 4 }}>
            {creatureEmoji}
          </div>
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
            fontSize: 14, color: 'var(--amber)', marginBottom: 20,
          }}>z z z</div>

          <div className="ob-h" style={{ textAlign: 'center' }}>
            That was Night One. You'll remember this one.
          </div>
          <div className="ob-sub" style={{ textAlign: 'center' }}>
            {creatureName} is already curled up beside your bed, keeping watch.
          </div>

          {/* Mini polaroid */}
          <div className="ob-polaroid" style={{ transform: 'rotate(1deg)', maxWidth: 200 }}>
            <div className="ob-polaroid-photo" style={{ fontSize: 36 }}>
              {ncPhoto ? <img src={ncPhoto} alt="Tonight" /> : creatureEmoji}
            </div>
            <div className="ob-polaroid-title" style={{ fontSize: 11 }}>{storyData.cover}</div>
            <div className="ob-polaroid-date">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {ncGenerated?.quote && (
              <div className="ob-polaroid-quote" style={{ fontSize: 10 }}>"{ncGenerated.quote}"</div>
            )}
          </div>

          <button className="ob-btn ob-btn-amber" style={{ marginTop: 20 }} onClick={handleComplete}>
            See what we made &rarr;
          </button>
          <div className="ob-caption">This is the part you did together.</div>
        </div>
      </div>
    </div>
  );

  // Fallback
  return null;
}
