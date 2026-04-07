import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useApp } from '../AppContext';
import { getCharacters } from '../lib/storage';
import { getHatchedCreatures, getAllHatchedCreatures } from '../lib/hatchery';
import type { BuilderChoices, Character, HatchedCreature } from '../lib/types';
import { getDreamKeeperById, V1_DREAMKEEPERS } from '../lib/dreamkeepers';

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════ */

const RITUAL_QUESTIONS = [
  "Was there a moment today you wanted to hold onto?",
  "Did something happen today that's still sitting with you?",
  "Was anyone kind to them today \u2014 or unkind?",
  "What do you wish you'd said \u2014 or done differently today?",
  "Was there a quiet moment today that mattered more than it looked?",
  "What did they say today that you don't want to forget?",
  "Was there something heavy they carried home today?",
  "What made them laugh today \u2014 really laugh?",
  "Was there a moment today where you saw who they're becoming?",
  "Did anything surprise you about them today?",
];

// DreamKeeper-framed versions of the ritual questions (used in inspiration card)
const RITUAL_QUESTIONS_FRAMED = [
  "Tell me\u2026 was there a moment today you wanted to hold onto?",
  "I can feel it\u2026 did something happen today that's still sitting with you?",
  "I'm curious\u2026 was anyone kind to them today \u2014 or unkind?",
  "Whisper it to me\u2026 what do you wish you'd said or done differently today?",
  "I wonder\u2026 was there a quiet moment today that mattered more than it looked?",
  "Tell me the words\u2026 what did they say today that you don't want to forget?",
  "I'll carry it too\u2026 was there something heavy they brought home today?",
  "I love this one\u2026 what made them laugh today \u2014 really laugh?",
  "Show me\u2026 was there a moment today where you saw who they're becoming?",
  "I'm all ears\u2026 did anything surprise you about them today?",
];

const CREATE_QUESTIONS = [
  "What's something weird your child said this week?",
  "If they could go anywhere impossible tonight, where?",
  "What's a rule at home that would be funny if it were a law?",
  "Name something your child is inexplicably obsessed with right now.",
  "What's the silliest thing that actually happened this week?",
  "If your child had a superpower they don't know about, what is it?",
  "What would they do if they woke up and everything was slightly wrong?",
  "What's something they're convinced is true that definitely isn't?",
  "What would their creature companion say about them right now?",
  "What's the most dramatic thing that happened this week?",
];

const OCCASION_OPTIONS = [
  { emoji: '\u{1F382}', label: 'Birthday' },
  { emoji: '\u{1F614}', label: 'Hard day' },
  { emoji: '\u{1F31F}', label: 'Big win' },
  { emoji: '\u{1F3EB}', label: 'First day' },
  { emoji: '\u2764\uFE0F', label: 'Missing someone' },
  { emoji: '\u{1F3E0}', label: 'New home' },
  { emoji: '\u{1F3E5}', label: 'Feeling sick' },
  { emoji: '\u{1F44F}', label: 'Proud moment' },
];

const WORLDS = [
  { emoji: '\u{1F6CF}\uFE0F', label: 'Blankets', key: 'blankets' },
  { emoji: '\u2601\uFE0F', label: 'Clouds', key: 'clouds' },
  { emoji: '\u{1FAE7}', label: 'Bubbles', key: 'bubbles' },
  { emoji: '\u{1F50D}', label: 'Tiny', key: 'tiny' },
  { emoji: '\u{1FA90}', label: 'Weird', key: 'weird' },
  { emoji: '\u{1F4D6}', label: 'Archive', key: 'archive' },
  { emoji: '\u2728', label: 'Custom', key: 'custom' },
];

const WORLD_DETAILS: Record<string, string[]> = {
  blankets: [
    'The pillows have their own government',
    'A sock has been missing for so long it became a person',
    'The bed is bigger on the inside than the outside',
  ],
  clouds: [
    'Someone is building a bridge that goes nowhere',
    'The clouds taste different depending on who made them',
    'There is a room up here with no floor and no ceiling',
  ],
  bubbles: [
    'A memory keeps replaying but one detail changes each time',
    'Someone left a moment behind and it floated here',
    'The city only exists while someone is remembering it',
  ],
  tiny: [
    'A button thinks it used to be important',
    'The dust under the fridge has its own economy',
    'A paperclip is on a very serious quest',
  ],
  weird: [
    'Gravity works sideways on Tuesdays',
    'The sky is below and the ground is above but nobody mentions it',
    'A door opens into the same room but everything is slightly wrong',
  ],
  archive: [
    'A story that was never finished is trying to find its ending',
    'The shelves rearrange themselves when nobody is looking',
    'One book remembers the reader who loved it most',
  ],
  custom: [
    'Something is not where it should be',
    'One character knows a secret',
    'Things keep going slightly wrong',
  ],
};

const WORLD_DESCRIPTIONS: Record<string, string> = {
  blankets: 'The Kingdom Beneath the Blankets \u2014 a world where cozy, familiar objects become magical. Pillows are territories, blanket folds hide kingdoms, stuffed animals hold office. The emotional core is safety: the feeling that the most magical place in the world is right here, in bed.',
  clouds: "The Cloudmakers' Sky \u2014 a world of impossible structures built from clouds, sky-scaffolding, and architecture that shouldn't stand but does. The emotional core is imagination: the thrill of building something from nothing, of making the impossible feel inevitable.",
  bubbles: 'The City of Floating Moments \u2014 a world where memories drift as soap-bubble-like orbs, each containing a moment that can be entered, replayed, or remixed. The emotional core is memory: the bittersweetness of moments passing and the magic of holding onto them.',
  tiny: 'The Kingdom of Small Things \u2014 a world where everyday objects become characters and miniature adventures unfold on desktops, in drawers, under furniture. A paperclip is a knight, a crumb is a boulder. The emotional core is curiosity: looking closely and discovering that the smallest things have the biggest stories.',
  weird: "Somewhere That Doesn't Make Sense \u2014 a surreal, dream-logic world where the rules change without warning. Gravity is optional, clocks run in spirals, fish walk and birds swim. The emotional core is creativity: the freedom of a place where nonsense is the only sense that matters.",
  archive: 'The Dream Archive \u2014 a vast, quiet library of stories that have been dreamed before, some finished, some not. Books whisper, shelves rearrange, and forgotten tales try to be remembered. The emotional core is meaning: the sense that every story matters, even the ones nobody finished telling.',
};

const WORLD_REACTIONS = [
  "Ooh, I love that one!",
  "Great choice \u2014 let's go!",
  "I've been wanting to go back there\u2026",
  "Perfect. I know just the way in.",
  "That's going to be wild tonight.",
  "I was hoping you'd pick that one!",
  "Alright, hold on tight\u2026",
];

const VIBE_OPTIONS = [
  { key: 'warm-funny', label: 'Funny' },
  { key: 'calm-cosy', label: 'Cosy' },
  { key: 'exciting', label: 'Exciting' },
  { key: 'heartfelt', label: 'Heartfelt' },
  { key: 'mysterious', label: 'Mysterious' },
];

const STYLE_OPTIONS = [
  { key: 'standard', label: 'Story' },
  { key: 'rhyming', label: 'Rhyming' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'mystery', label: 'Mystery' },
];

const LENGTH_OPTIONS = [
  { key: 'short', label: 'Short (~3min)' },
  { key: 'standard', label: 'Standard (~5min)' },
  { key: 'long', label: 'Long (~8min)' },
];

const AGE_OPTIONS = [
  { key: 'age3', label: '3\u20135' },
  { key: 'age5', label: '6\u20138' },
  { key: 'age7', label: '9\u201311' },
  { key: 'age10', label: '11+' },
];

const VIBE_BRIEF: Record<string, string> = {
  'warm-funny': 'about to go on a warm and funny adventure full of laughs',
  'calm-cosy': 'about to discover something magical and cosy',
  'exciting': 'about to go on a completely made-up adventure',
  'heartfelt': 'on a journey that fills the heart',
  'silly': 'on a silly quest with friends',
  'mysterious': 'about to discover something magical and mysterious',
};

const FREE_PLACEHOLDERS = [
  "A dragon who's afraid of toast...",
  "What if the moon fell into a puddle...",
  "A tiny kingdom inside the sock drawer...",
  "A story where everything is backwards...",
  "The socks have a secret meeting every night...",
  "A brave little fox who learns to swim...",
  "What if clouds were actually someone's pillows...",
  "A cat who accidentally becomes a pirate captain...",
];

const MAKE_ANYTHING_CHARS = [
  { key: 'dreamkeeper', label: 'My DreamKeeper', emoji: '' },
  { key: 'someone', label: 'Someone I know', emoji: '\u{1F9D1}' },
  { key: 'pet', label: 'A pet', emoji: '\u{1F43E}' },
  { key: 'silly', label: 'Something silly', emoji: '\u{1F92A}' },
];

/* \u2500\u2500 Helpers \u2500\u2500 */

function ageDescToLevel(desc: string | undefined): string {
  if (!desc) return 'age5';
  const d = desc.toLowerCase().replace(/\s+/g, '');
  if (d.includes('3-5') || d.includes('age3') || d.includes('4-5') || d.includes('age4') || d.includes('3\u20135') || d.includes('4\u20135')) return 'age3';
  if (d.includes('6-8') || d.includes('age6') || d.includes('6\u20138')) return 'age5';
  if (d.includes('9-10') || d.includes('age9') || d.includes('9\u201310') || d.includes('9\u201311')) return 'age7';
  if (d.includes('11') || d.includes('age11') || d.includes('11+')) return 'age10';
  return 'age5';
}

function inferVibe(text: string): string {
  const t = text.toLowerCase();
  if (/funny|laugh|silly|joke|weird|giggl/.test(t)) return 'warm-funny';
  if (/sad|miss|cry|hard|scared|worry|afraid/.test(t)) return 'heartfelt';
  if (/adventure|explore|brave|fight|battle|quest/.test(t)) return 'exciting';
  if (/quiet|sleep|calm|cosy|cozy|night|gentle|soft/.test(t)) return 'calm-cosy';
  if (/mystery|secret|strange|lost|hidden|clue/.test(t)) return 'mysterious';
  return 'calm-cosy';
}

function settingsSummary(style: string, length: string, vibe: string, level: string): string {
  const parts: string[] = [];
  if (style !== 'standard') parts.push(STYLE_OPTIONS.find(s => s.key === style)?.label || '');
  if (length !== 'standard') parts.push(LENGTH_OPTIONS.find(l => l.key === length)?.label?.split(' ')[0] || '');
  const vibeLabel = VIBE_OPTIONS.find(v => v.key === vibe)?.label;
  if (vibe !== 'calm-cosy' && vibeLabel) parts.push(vibeLabel);
  const ageLabel = AGE_OPTIONS.find(a => a.key === level)?.label;
  if (level !== 'age5' && ageLabel) parts.push(ageLabel);
  return parts.filter(Boolean).join(' \u00B7 ');
}

/* ══════════════════════════════════════════════════════════════════════
   CSS \u2014 v7 Design System
   ══════════════════════════════════════════════════════════════════════ */

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--gold:#F6C56F;--gold-dk:#a06010;--purple:#9A7FD4;--purple-lt:#B8A1FF;
  --cyan:#6FE7DD;--dark:#0C1840;--cream:#F4EFE8;--muted:rgba(255,255,255,.35);
  --card:rgba(6,10,28,.92);--border:rgba(255,255,255,.07);
  --heading:'Fraunces',Georgia,serif;--body:'Nunito',system-ui,sans-serif;
  --cta:'Baloo 2',system-ui,sans-serif;--mono:'DM Mono',monospace;
  --lora:'Lora','Fraunces',Georgia,serif;
}
.sc{min-height:100dvh;font-family:var(--body);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
.sc.ritual{background:radial-gradient(ellipse at 50% 0%,#0C1840 0%,#040810 55%,#020408 100%)}
.sc.create{background:radial-gradient(ellipse at 50% 0%,#0C1840 0%,#030c10 55%,#020408 100%)}

/* animations */
@keyframes floatCreature{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes glowGold{0%,100%{filter:drop-shadow(0 0 10px rgba(246,197,111,.4))}50%{filter:drop-shadow(0 0 28px rgba(246,197,111,.55))}}
@keyframes glowPurple{0%,100%{filter:drop-shadow(0 0 8px rgba(154,127,212,.35))}50%{filter:drop-shadow(0 0 22px rgba(154,127,212,.5))}}
@keyframes glowCyan{0%,100%{filter:drop-shadow(0 0 8px rgba(111,231,221,.35))}50%{filter:drop-shadow(0 0 22px rgba(111,231,221,.5))}}
@keyframes shimmer{0%{transform:translateX(-130%)}100%{transform:translateX(170%)}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes typingDot{0%,100%{transform:scale(.7)}50%{transform:scale(1)}}
@keyframes waveBar{0%,100%{height:4px}50%{height:18px}}
@keyframes eggRock{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes bubblePop{0%{opacity:0;transform:scale(.94) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes twinkle{0%,100%{opacity:.04;transform:scale(.35)}50%{opacity:.9;transform:scale(1.4)}}
@keyframes waveBarIdle{0%,100%{height:3px;opacity:.28}50%{height:8px;opacity:.62}}
@keyframes pulse{0%,100%{opacity:.15;transform:translateX(-50%) scale(1)}50%{opacity:.45;transform:translateX(-50%) scale(1.1)}}
@keyframes purpleGlowBorder{0%,100%{border-color:rgba(154,127,212,.2);box-shadow:0 0 0 0 rgba(154,127,212,0)}50%{border-color:rgba(184,161,255,.45);box-shadow:0 0 18px rgba(154,127,212,.12)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes micRipple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.2);opacity:0}}
@keyframes crossfade{from{opacity:0}to{opacity:1}}

/* nav */
.sc-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:52px;position:sticky;top:0;z-index:20;background:rgba(2,4,8,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(246,197,111,.07)}
.sc-logo{font-family:var(--heading);font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;color:var(--cream)}
.sc-logo-moon{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F6C56F,#C87020);flex-shrink:0}
.sc-close{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:6px;line-height:1;transition:color .15s}
.sc-close:hover{color:var(--cream)}

/* inner */
.sc-inner{flex:1;width:100%;max-width:720px;margin:0 auto;padding:0 5% 180px;overflow-x:hidden;position:relative;z-index:5}
@media(min-width:768px){.sc-inner{padding:0 40px 180px}}

/* creature zone */
.sc-creature{display:flex;flex-direction:column;align-items:center;padding:20px 0 4px;animation:slideUp .4s ease both;position:relative}
.sc-creature.create-creature{flex-direction:row;align-items:center;gap:12px;padding:16px 0 4px}
.sc-creature-emoji{font-size:72px;animation:floatCreature 4s ease-in-out infinite}
.sc-creature.create-creature .sc-creature-emoji{font-size:42px}
.sc-egg{font-size:56px;animation:eggRock 2s ease-in-out infinite;display:inline-block}

/* speech bubble */
.sc-bubble{position:relative;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:14px 18px;margin:12px 0 18px;text-align:center;animation:bubblePop .4s ease forwards .2s;opacity:0}
.sc-bubble::before{content:'';position:absolute;top:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:7px solid rgba(255,255,255,.1)}
.sc-bubble-text{font-family:var(--body);font-size:13.5px;font-weight:600;color:rgba(255,255,255,.72);line-height:1.6}

/* v7 entry cards */
.sc-entry-card{
  width:100%;padding:18px 18px;border-radius:16px;cursor:pointer;text-align:left;
  display:flex;align-items:center;gap:14px;transition:all .2s;
  font-family:var(--body);position:relative;overflow:hidden;
}
.sc-entry-card:active{transform:scale(.97);opacity:.9}

/* occasion pills */
.sc-occ-label{font-size:9px;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-family:var(--mono);margin-bottom:8px}
.sc-occ-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.sc-occ-row::-webkit-scrollbar{display:none}
.sc-occ{padding:7px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;font-family:var(--body);display:flex;align-items:center;gap:4px;flex-shrink:0}
.sc-occ:hover{border-color:rgba(255,255,255,.18)}
.sc-occ.on{background:rgba(246,197,111,.12);border-color:rgba(246,197,111,.4);color:#F6C56F}

/* voice button */
.sc-voice{width:100%;padding:13px 16px;border-radius:14px;border:1.5px solid rgba(246,197,111,.22);background:rgba(10,15,35,.7);cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:12px;margin-bottom:8px;font-family:var(--body)}
.sc-voice:hover{border-color:rgba(246,197,111,.4);background:rgba(246,197,111,.07)}
.sc-voice.rec{border-color:rgba(245,76,76,.6);background:rgba(245,76,76,.05);animation:micPulse 1.2s ease-in-out infinite}
.sc-voice-icon{font-size:20px;flex-shrink:0}
.sc-voice-text{flex:1;font-size:13px;font-weight:600;color:#F6C56F;text-align:left}
.sc-voice.rec .sc-voice-text{color:#FF8070}
.sc-voice-waves{display:flex;align-items:center;gap:2px;flex-shrink:0}
.sc-wave-bar{width:4px;border-radius:2px;background:var(--gold)}

/* or divider */
.sc-or{display:flex;align-items:center;gap:10px;margin:10px 0}
.sc-or-line{flex:1;height:1px;background:rgba(255,255,255,.07)}
.sc-or-text{font-size:9px;color:rgba(255,255,255,.2);letter-spacing:.06em;white-space:nowrap}

/* textarea */
.sc-textarea{width:100%;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(246,197,111,.25);background:rgba(246,197,111,.05);color:var(--cream);font-size:13px;font-family:var(--body);font-weight:700;outline:none;resize:none;min-height:60px;line-height:1.65;transition:border-color .2s,box-shadow .2s;margin-bottom:6px}
.sc-textarea:focus{border-color:rgba(246,197,111,.45);box-shadow:0 0 0 3px rgba(246,197,111,.07)}
.sc-textarea::placeholder{color:rgba(255,255,255,.18);font-style:italic}
.sc-textarea.purple{border-color:rgba(154,127,212,.3);background:rgba(154,127,212,.05)}
.sc-textarea.purple:focus{border-color:rgba(184,161,255,.55);box-shadow:0 0 0 3px rgba(154,127,212,.07)}
.sc-textarea.cyan{border-color:rgba(111,231,221,.25);background:rgba(111,231,221,.05)}
.sc-textarea.cyan:focus{border-color:rgba(111,231,221,.45);box-shadow:0 0 0 3px rgba(111,231,221,.07)}

/* transcript card */
.sc-transcript{background:rgba(246,197,111,.06);border:1px solid rgba(246,197,111,.2);border-radius:14px;padding:11px 14px;margin-bottom:10px;animation:slideUp .25s ease both}
.sc-transcript-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.sc-transcript-label{font-size:9px;font-family:var(--mono);color:var(--gold);letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:4px}
.sc-transcript-edit{font-size:10px;color:rgba(246,197,111,.5);background:none;border:none;cursor:pointer;font-family:var(--body);font-weight:600;transition:color .15s}
.sc-transcript-edit:hover{color:var(--gold)}
.sc-transcript-text{font-family:var(--body);font-size:13px;font-weight:600;color:rgba(255,255,255,.82);line-height:1.6}

/* world pills (horizontal scroll) */
.sc-world-scroll{display:flex;gap:8px;overflow-x:auto;padding:4px 0 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.sc-world-scroll::-webkit-scrollbar{display:none}
.sc-world-pill{width:72px;height:72px;border-radius:16px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:all .2s;flex-shrink:0}
.sc-world-pill:hover{border-color:rgba(255,255,255,.18)}
.sc-world-pill.on{background:rgba(154,127,212,.12);border-color:rgba(184,161,255,.55)}
.sc-world-pill-emoji{font-size:22px}
.sc-world-pill-name{font-size:9px;font-weight:700;color:var(--muted);font-family:var(--body)}
.sc-world-pill.on .sc-world-pill-name{color:#B8A1FF}

/* detail chips */
.sc-detail-section{animation:slideUp .3s ease both}
.sc-detail-label{font-size:9px;font-family:var(--mono);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.sc-detail-chips{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.sc-detail-chip{padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);font-family:var(--heading);font-style:italic;font-size:12px;color:var(--muted);cursor:pointer;transition:all .2s;text-align:left}
.sc-detail-chip:hover{border-color:rgba(154,127,212,.25)}
.sc-detail-chip.on{background:rgba(154,127,212,.1);border-color:rgba(184,161,255,.35);color:#B8A1FF}

/* cast */
.sc-cast-label{font-size:9px;font-family:var(--mono);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;margin-top:18px}
.sc-cast-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.sc-cast-row::-webkit-scrollbar{display:none}
.sc-cast-pill{display:flex;align-items:center;gap:5px;padding:5px 10px 5px 7px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);cursor:pointer;transition:all .2s;flex-shrink:0;white-space:nowrap}
.sc-cast-pill:hover{border-color:rgba(255,255,255,.2)}
.sc-cast-pill.on{background:rgba(246,197,111,.1);border-color:rgba(246,197,111,.4)}
.sc-cast-pill.hero{background:rgba(246,197,111,.1);border-color:rgba(246,197,111,.4);cursor:default}
.sc-cast-pill.dim{opacity:.4;cursor:not-allowed}
.sc-cast-emoji{font-size:16px;line-height:1}
.sc-cast-name{font-family:var(--cta);font-size:11px;font-weight:600;color:var(--muted)}
.sc-cast-pill.on .sc-cast-name,.sc-cast-pill.hero .sc-cast-name{color:#F6C56F}

/* settings */
.sc-settings-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);cursor:pointer;transition:all .2s;margin-top:16px;margin-bottom:8px}
.sc-settings-trigger:hover{background:rgba(255,255,255,.05)}
.sc-settings-left{font-size:10px;font-family:var(--mono);color:var(--muted);letter-spacing:.05em}
.sc-settings-right{display:flex;align-items:center;gap:8px}
.sc-settings-badges{display:flex;gap:4px;flex-wrap:wrap}
.sc-settings-badge{font-size:9px;padding:2px 7px;border-radius:10px;background:rgba(246,197,111,.1);color:var(--gold);font-family:var(--mono);white-space:nowrap}
.sc-settings-chevron{font-size:11px;color:var(--muted);transition:transform .2s}
.sc-settings-chevron.open{transform:rotate(180deg)}
.sc-settings-body{overflow:hidden;transition:max-height .3s ease,opacity .2s ease}
.sc-settings-inner{padding:12px 0}
.sc-settings-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
.sc-settings-row:last-child{margin-bottom:0}
.sc-settings-row-label{font-size:11px;color:var(--muted);font-weight:600;min-width:50px;padding-top:7px;flex-shrink:0}
.sc-settings-pills{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.sc-spill{padding:7px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--body);white-space:nowrap}
.sc-spill:hover{border-color:rgba(255,255,255,.18)}
.sc-spill.on{background:rgba(246,197,111,.1);border-color:rgba(246,197,111,.4);color:#F6C56F}

/* CTA */
.sc-cta-wrap{position:fixed;bottom:0;left:0;right:0;padding:10px 5% calc(env(safe-area-inset-bottom,8px) + 12px);z-index:15;display:flex;justify-content:center;background:linear-gradient(0deg,rgba(2,4,8,.98) 65%,transparent)}
.sc-cta{width:100%;max-width:540px;padding:16px;border:none;border-radius:16px;cursor:pointer;font-family:var(--cta);transition:all .2s;position:relative;overflow:hidden;text-align:center}
.sc-cta:hover{filter:brightness(1.1);transform:scale(1.02) translateY(-1px)}
.sc-cta:active{transform:scale(.97)}
.sc-cta:disabled{opacity:.35;cursor:not-allowed;transform:none;filter:none}
.sc-cta.gold{background:linear-gradient(145deg,#7a4a08,#F6C56F 48%,#7a4a08);color:#060200;box-shadow:0 10px 35px rgba(200,130,20,.45)}
.sc-cta.purple{background:linear-gradient(145deg,#5010a0,#B8A1FF 48%,#5010a0);color:#0a0020;box-shadow:0 10px 35px rgba(154,127,212,.38)}
.sc-cta.cyan{background:linear-gradient(145deg,#0a6a5a,#6FE7DD 48%,#0a6a5a);color:#020c08;box-shadow:0 10px 35px rgba(111,231,221,.35)}
.sc-cta-main{font-size:15px;font-weight:700;display:block}
.sc-cta-sub{font-size:10px;font-weight:500;opacity:.7;display:block;margin-top:2px}
.sc-cta::after{content:'';position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmer 3s ease-in-out infinite}
.sc-cta:disabled::after{display:none}

/* make-anything character add buttons */
.sc-ma-char{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;border:1.5px solid rgba(111,231,221,.12);background:rgba(111,231,221,.04);cursor:pointer;transition:all .2s;font-family:var(--body)}
.sc-ma-char:hover{border-color:rgba(111,231,221,.25);background:rgba(111,231,221,.08)}
.sc-ma-char.on{border-color:rgba(111,231,221,.4);background:rgba(111,231,221,.1)}
.sc-ma-char-emoji{font-size:18px;flex-shrink:0}
.sc-ma-char-label{font-size:12px;font-weight:600;color:rgba(255,255,255,.6)}
.sc-ma-char.on .sc-ma-char-label{color:#6FE7DD}

/* large voice button (make anything) */
.sc-voice-lg{
  width:80px;height:80px;border-radius:50%;border:2px solid rgba(111,231,221,.3);
  background:radial-gradient(circle,rgba(111,231,221,.12),rgba(2,4,8,.8));
  cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;
  position:relative;margin:0 auto;
}
.sc-voice-lg:hover{border-color:rgba(111,231,221,.5);background:radial-gradient(circle,rgba(111,231,221,.18),rgba(2,4,8,.8))}
.sc-voice-lg.rec{border-color:rgba(245,76,76,.5);animation:micPulse 1.2s ease-in-out infinite}
.sc-voice-lg::before{content:'';position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(111,231,221,.08);animation:micRipple 2.5s ease-out infinite;pointer-events:none}
.sc-voice-lg.rec::before{border-color:rgba(245,76,76,.15)}

/* hidden voice */
.sc-no-voice{display:none}
`;

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

interface StoryCreatorProps {
  entryMode: 'ritual' | 'create';
  onGenerate: (choices: BuilderChoices) => void;
  onBack: () => void;
}

export default function StoryCreator({ entryMode, onGenerate, onBack }: StoryCreatorProps) {
  const {
    user,
    selectedCharacters, selectedCharacter,
    setSelectedCharacter, setCompanionCreature,
    companionCreature,
  } = useApp();

  const isRitual = entryMode === 'ritual';

  const primaryCharFromCtx = selectedCharacters[0] ?? selectedCharacter ?? null;
  // Re-derive after characters load (context may be empty on "Create" tab entry)
  const [characters, setCharacters] = useState<Character[]>([]);
  const primaryChar = primaryCharFromCtx ?? characters.find(c => c.isFamily) ?? characters[0] ?? null;
  const childName = primaryChar?.name ?? user?.displayName ?? 'friend';
  const defaultLevel = ageDescToLevel(primaryChar?.ageDescription);

  // ── Data ──
  const [loading, setLoading] = useState(true);
  const [creature, setCreature] = useState<HatchedCreature | null>(companionCreature);
  const [companions, setCompanions] = useState<HatchedCreature[]>([]);
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      let chars: Character[] = [];
      let creatures: HatchedCreature[] = [];
      try {
        [chars, creatures] = await Promise.all([
          getCharacters(user.id).catch(() => []),
          primaryChar
            ? getHatchedCreatures(user.id, primaryChar.id).catch(() => [])
            : getAllHatchedCreatures(user.id).catch(() => []),
        ]);
      } catch (e) {
        console.error('[StoryCreator] init failed:', e);
      }

      if (cancelled) return;

      // Filter to family first; fall back to all
      const family = chars.filter(c => c.isFamily);
      setCharacters(family.length > 0 ? family : chars);

      // Separate original DreamKeeper from hatched companions
      if (creatures.length > 0) {
        const original = creatures.find(c => c.isOriginal) || creatures[creatures.length - 1];
        const hatched = creatures.filter(c => c.id !== original.id);
        setCreature(original);
        setCompanions(hatched);
      } else if (!creature && companionCreature) {
        setCreature(companionCreature);
      } else if (!creature) {
        const all = await getAllHatchedCreatures(user.id);
        if (!cancelled && all.length > 0) {
          const original = all.find(c => c.isOriginal) || all[all.length - 1];
          const hatched = all.filter(c => c.id !== original.id);
          setCreature(original);
          setCompanions(hatched);
        }
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, primaryChar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ritual entry card selection (3-card picker shown before input) ──
  const [ritualEntryDone, setRitualEntryDone] = useState(!isRitual);

  // ── Mode & input state ──
  const [mode, setMode] = useState<'today' | 'adventure' | 'free'>('today');
  const [brief, setBrief] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Inspiration & occasion state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [occasionTag, setOccasionTag] = useState('');
  const [occasionDismissed, setOccasionDismissed] = useState(false);

  // Adventure state
  const [worldChoice, setWorldChoice] = useState('');
  const [customWorld, setCustomWorld] = useState('');
  const [showCustomWorldInput, setShowCustomWorldInput] = useState(false);
  const [adventureDetail, setAdventureDetail] = useState('');
  const [worldReaction, setWorldReaction] = useState('');

  // Make Anything state
  const [freeBrief, setFreeBrief] = useState('');
  const [freeTranscript, setFreeTranscript] = useState('');
  const [freeStep, setFreeStep] = useState<1 | 2>(1);
  const [freeChars, setFreeChars] = useState<Array<{ key: string; name: string }>>([]);
  const [freeCharInput, setFreeCharInput] = useState('');
  const [freeCharInputKey, setFreeCharInputKey] = useState('');
  const [freeListening, setFreeListening] = useState(false);
  const [dreamkeeperInStory, setDreamkeeperInStory] = useState(true);
  const [storyForName, setStoryForName] = useState('');  // empty = child (default), custom = gift story
  const [storyForEditing, setStoryForEditing] = useState(false);
  const [freePlaceholderIdx] = useState(() => Math.floor(Math.random() * FREE_PLACEHOLDERS.length));

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vibe, setVibe] = useState('calm-cosy');
  const [manualVibe, setManualVibe] = useState(false);
  const [length, setLength] = useState('standard');
  const [style, setStyle] = useState('standard');
  const [level, setLevel] = useState(defaultLevel);
  const [lessons] = useState<string[]>([]);

  // Cast state
  const [selectedCast, setSelectedCast] = useState<Character[]>(() =>
    primaryChar ? [primaryChar] : []
  );
  const [creatureSelected, setCreatureSelected] = useState(true);

  // Voice ref
  const srRef = useRef<any>(null);
  const freeSrRef = useRef<any>(null);

  // Detect speech API availability
  const hasSpeechAPI = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // ── Star field ──
  useEffect(() => {
    const container = document.getElementById('sc-stars');
    if (!container) return;
    container.innerHTML = '';
    const colours = ['#fff8e0','#e8d8ff','#d0f0e8','#c8e8ff','#ffffff'];
    const count = 55;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      const sz = Math.random() < .28 ? 2.2 : Math.random() < .6 ? 1.4 : .7;
      const dur = (2.8 + Math.random() * 4).toFixed(1);
      const delay = (Math.random() * 5).toFixed(1);
      s.style.cssText = ['position:absolute','border-radius:50%',`width:${sz}px`,`height:${sz}px`,`left:${(Math.random()*100).toFixed(1)}%`,`top:${(Math.random()*72).toFixed(1)}%`,`background:${colours[i % colours.length]}`,`animation:twinkle ${dur}s -${delay}s ease-in-out infinite`,'pointer-events:none'].join(';');
      container.appendChild(s);
    }
  }, []);

  // ── Inspiration & occasion derived values ──
  const questionBank = entryMode === 'ritual' ? RITUAL_QUESTIONS_FRAMED : CREATE_QUESTIONS;
  const questionBankPlain = entryMode === 'ritual' ? RITUAL_QUESTIONS : CREATE_QUESTIONS;
  const currentQuestion = questionBank[questionIndex % questionBank.length];
  const currentQuestionPlain = questionBankPlain[questionIndex % questionBankPlain.length];
  const hasContent = (transcript.trim().length > 3) || (brief.trim().length > 3);
  const showInspiration = !hasContent;
  const showOccasionTag = hasContent && !occasionDismissed;

  const shuffleQuestion = () => setQuestionIndex(i => i + 1);
  const useQuestion = () => { setBrief(currentQuestionPlain); setTranscript(''); };

  const renderInspoQuestion = (q: string): ReactNode => {
    const accentColor = '#F6C56F';
    const highlightMatch = q.match(
      /\b(wanted to hold onto|still sitting with you|unkind|done differently|mattered more|don't want to forget|carried home|really laugh|becoming|surprise you|weird.*said|anywhere impossible|funny if|obsessed|silliest|superpower|slightly wrong|convinced is true|companion say|most dramatic)\b/i
    );
    if (highlightMatch) {
      const phrase = highlightMatch[0];
      const idx = q.indexOf(phrase);
      return (
        <>&ldquo;{q.slice(0, idx)}<em style={{ color: accentColor, fontStyle: 'normal', fontWeight: 800 }}>{phrase}</em>{q.slice(idx + phrase.length)}&rdquo;</>
      );
    }
    return <>&ldquo;{q}&rdquo;</>;
  };

  // ── Mode switch clears relevant state ──
  const switchMode = useCallback((m: 'today' | 'adventure' | 'free') => {
    setMode(m);
    setBrief('');
    setTranscript('');
    setIsEditing(false);
    setAdventureDetail('');
    setWorldChoice('');
    setCustomWorld('');
    setShowCustomWorldInput(false);
    setQuestionIndex(0);
    setOccasionTag('');
    setOccasionDismissed(false);
    setFreeBrief('');
    setFreeTranscript('');
    setFreeStep(1);
    setFreeChars([]);
    setFreeCharInput('');
    setFreeCharInputKey('');
    setStoryForName('');
    setStoryForEditing(false);
    setWorldReaction('');
    if (isListening) { srRef.current?.stop(); setIsListening(false); }
    if (freeListening) { freeSrRef.current?.stop(); setFreeListening(false); }
  }, [isListening, freeListening]);

  // ── Vibe inference (debounced, only when not manual) ──
  const vibeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (manualVibe) return;
    clearTimeout(vibeTimerRef.current);
    const text = mode === 'today' ? (transcript || brief) : mode === 'free' ? (freeTranscript || freeBrief) : adventureDetail;
    if (!text.trim()) { setVibe('calm-cosy'); return; }
    vibeTimerRef.current = setTimeout(() => {
      setVibe(inferVibe(text));
    }, 300);
    return () => clearTimeout(vibeTimerRef.current);
  }, [brief, transcript, adventureDetail, freeBrief, freeTranscript, mode, manualVibe]);

  // ── Voice ──
  const toggleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      srRef.current?.stop();
      setIsListening(false);
      return;
    }
    const sr = new SR();
    sr.continuous = false;
    sr.interimResults = false;
    sr.lang = 'en-US';
    sr.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript || '';
      setTranscript(t);
      setIsEditing(false);
      setIsListening(false);
    };
    sr.onerror = () => setIsListening(false);
    sr.onend = () => setIsListening(false);
    sr.start();
    srRef.current = sr;
    setIsListening(true);
  }, [isListening]);

  // ── Free mode voice ──
  const toggleFreeVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (freeListening) {
      freeSrRef.current?.stop();
      setFreeListening(false);
      return;
    }
    const sr = new SR();
    sr.continuous = false;
    sr.interimResults = false;
    sr.lang = 'en-US';
    sr.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript || '';
      setFreeTranscript(t);
      setFreeListening(false);
    };
    sr.onerror = () => setFreeListening(false);
    sr.onend = () => setFreeListening(false);
    sr.start();
    freeSrRef.current = sr;
    setFreeListening(true);
  }, [freeListening]);

  // ── Creature display ──
  const cName = creature?.name ?? 'Moonbeam';
  const cEmoji = creature?.creatureEmoji ?? '\u{1F319}';
  const cType = creature?.creatureType ?? '';

  // Resolve DreamKeeper image (if available) \u2014 same cascade as MySpace
  const cDk = creature
    ? (getDreamKeeperById(creature.creatureType)
       || V1_DREAMKEEPERS.find(dk => dk.emoji === creature.creatureEmoji)
       || null)
    : null;
  const cImageSrc = cDk?.imageSrc;

  // ── Bubble text ──
  const renderBubbleText = (): ReactNode => {
    const gold = (text: string) => (
      <em style={{ color: '#F6C56F', fontStyle: 'normal', fontWeight: 700 }}>{text}</em>
    );

    if (isListening) return <>I&apos;m listening&hellip; {'\u{1F399}\uFE0F'}</>;

    if (mode === 'today') {
      const hasAny = transcript.trim() || brief.trim();
      if (!hasAny) return (
        <>{childName ? <>{gold(childName)}! </> : null}What happened today worth putting in a story? Could be {gold('anything')} &mdash; big, small, silly, or strange. {'\u{1F319}'}</>
      );
      const words = (transcript || brief).trim().split(/\s+/).slice(0, 4).join(' ');
      return <>Got it! {gold(words + '\u2026')} Ready when you are. {'\u2728'}</>;
    }

    if (mode === 'adventure') {
      if (!worldChoice) return (
        <>{gold('Where should we go')} tonight? Pick a world and I&apos;ll write us in. {'\u{1F680}'}</>
      );

      if (worldReaction) return <>{worldReaction}</>;

      const worldLabel = worldChoice === 'custom'
        ? customWorld || 'your world'
        : WORLDS.find(w => w.key === worldChoice)?.label || worldChoice;

      return <>A story set in {gold(worldLabel)}! Give me one {gold('weird detail')} and we&apos;re off. {'\u2728'}</>;
    }

    // free mode
    if (mode === 'free') {
      const hasFreeContent = freeTranscript.trim() || freeBrief.trim();
      if (!hasFreeContent) return (
        <>Tell me {gold('anything')} {'\u2014'} I'll make it into tonight's story. {'\u2728'}</>
      );
      const words = (freeTranscript || freeBrief).trim().split(/\s+/).slice(0, 4).join(' ');
      return <>Love it! {gold(words + '\u2026')} Ready when you are. {'\u2728'}</>;
    }

    return null;
  };

  // ── Cast helpers ──
  const isHero = (c: Character) => c.id === primaryChar?.id;
  const isInCast = (id: string) => selectedCast.some(c => c.id === id);
  const castCount = selectedCast.length + (creatureSelected && creature ? 1 : 0) + selectedCompanionIds.size;
  const atMax = castCount >= 5;

  const toggleCastChar = (c: Character) => {
    if (isHero(c)) return; // can't deselect hero
    if (isInCast(c.id)) {
      setSelectedCast(prev => prev.filter(x => x.id !== c.id));
    } else if (!atMax) {
      setSelectedCast(prev => [...prev, c]);
    }
  };

  // ── World selection ──
  const selectWorld = (key: string) => {
    if (key === 'custom') {
      setShowCustomWorldInput(true);
      setWorldChoice('custom');
    } else {
      setShowCustomWorldInput(false);
      setWorldChoice(key);
      setCustomWorld('');
    }
    setAdventureDetail('');
    // DreamKeeper reaction
    setWorldReaction(WORLD_REACTIONS[Math.floor(Math.random() * WORLD_REACTIONS.length)]);
    setTimeout(() => setWorldReaction(''), 2500);
  };

  // ── Make Anything char helpers ──
  const addFreeChar = (key: string, name: string) => {
    if (freeChars.some(c => c.key === key)) {
      setFreeChars(prev => prev.filter(c => c.key !== key));
    } else {
      setFreeChars(prev => [...prev, { key, name }]);
    }
  };

  const isFreeCharSelected = (key: string) => freeChars.some(c => c.key === key);

  // ── Generate ──
  const handleGenerate = () => {
    const heroChar = primaryChar;

    // Build chars array (cast minus the hero)
    const castChars = selectedCast
      .filter(c => c.id !== heroChar?.id)
      .map(c => ({
        type: c.type,
        name: c.name,
        note: c.weirdDetail || c.currentSituation || '',
      }));

    // Add DreamKeeper to chars — free mode uses dreamkeeperInStory toggle, other modes use creatureSelected
    const shouldIncludeCreature = mode === 'free' ? dreamkeeperInStory : creatureSelected;
    if (shouldIncludeCreature && creature) {
      castChars.push({
        type: 'creature',
        name: creature.name,
        note: creature.dreamAnswer
          ? `${creature.name} dreams about ${creature.dreamAnswer}`
          : `${creature.name} is the child's magical DreamKeeper`,
      });
    }

    // Add selected hatched companions
    for (const comp of companions) {
      if (selectedCompanionIds.has(comp.id)) {
        castChars.push({
          type: 'creature',
          name: comp.name,
          note: comp.dreamAnswer
            ? `${comp.name} dreams about ${comp.dreamAnswer}`
            : `${comp.name} is a hatched companion creature`,
        });
      }
    }

    // Build brief
    let finalBrief: string;
    if (mode === 'today') {
      finalBrief = transcript.trim() || brief.trim() || VIBE_BRIEF[vibe] || 'about to go on an adventure';
    } else if (mode === 'free') {
      finalBrief = freeTranscript.trim() || freeBrief.trim() || 'a completely original story';
    } else {
      finalBrief = `Adventure in ${worldChoice === 'custom' ? customWorld : WORLDS.find(w => w.key === worldChoice)?.label || worldChoice}. ${WORLD_DESCRIPTIONS[worldChoice] ? `[World: ${WORLD_DESCRIPTIONS[worldChoice]}] ` : ''}${adventureDetail}`.trim();
    }

    const finalVibe = vibe || inferVibe(finalBrief);

    // "Story for" logic: custom name = gift story (child not forced as hero)
    const hasCustomStoryFor = mode === 'free' && storyForName.trim().length > 0;
    const resolvedHeroName = hasCustomStoryFor ? storyForName.trim() : (heroChar?.name || '');
    const resolvedChildIsHero = mode === 'free' ? !hasCustomStoryFor : true;

    const choices: BuilderChoices = {
      path: mode === 'today' ? 'ritual' : 'free',
      heroName: resolvedHeroName,
      heroGender: hasCustomStoryFor ? '' : (heroChar?.pronouns === 'he/him' ? 'boy'
        : heroChar?.pronouns === 'she/her' ? 'girl' : ''),
      vibe: finalVibe,
      level,
      length,
      brief: finalBrief,
      chars: castChars,
      lessons,
      occasion: occasionTag,
      occasionCustom: '',
      style,
      pace: 'normal',
      childIsHero: resolvedChildIsHero,
    };

    setSelectedCharacter(heroChar || null);
    setCompanionCreature(creature);
    onGenerate(choices);
  };

  // ── CTA state ──
  const ctaDisabled = mode === 'today'
    ? brief.trim().length < 4 && transcript.trim().length < 4
    : mode === 'free'
      ? (freeBrief.trim().length < 4 && freeTranscript.trim().length < 4)
      : !worldChoice && adventureDetail.trim().length < 4;

  const ctaLabel = mode === 'today'
    ? '\u2726 Write tonight\u2019s story'
    : mode === 'free'
      ? '\u2728 Let\u2019s make this story'
      : '\u{1F680} Begin the adventure!';
  const ctaColor = mode === 'today'
    ? 'gold'
    : mode === 'free'
      ? 'cyan'
      : 'purple';
  const ctaSub = `${cName} is ready`;

  // ── Settings summary ──
  const summary = settingsSummary(style, length, vibe, level);

  // ── Available detail chips ──
  const detailChips = WORLD_DETAILS[worldChoice] || WORLD_DETAILS.custom;

  // ── Other characters for cast (not the hero) ──
  const otherChars = characters.filter(c => c.id !== primaryChar?.id);

  // ── Free mode has content check ──
  const freeHasContent = freeTranscript.trim().length > 3 || freeBrief.trim().length > 3;

  // ── Stagger delay helper ──
  const stagger = (i: number) => `${i * 60}ms`;

  return (
    <div className={`sc ${isRitual ? 'ritual' : 'create'}`}>
      <style>{CSS}</style>
      <div id="sc-stars" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} />

      {/* Back button */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 20,
      }}>
        <button
          onClick={() => {
            if (isRitual && ritualEntryDone) {
              setRitualEntryDone(false);
              setBrief(''); setTranscript(''); setWorldChoice(''); setCustomWorld('');
              setAdventureDetail(''); setFreeBrief(''); setFreeTranscript('');
              setFreeStep(1); setFreeChars([]);
            } else {
              onBack();
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px 8px 10px', borderRadius: 24,
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
            color: 'rgba(244,239,232,.5)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = 'rgba(244,239,232,.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = 'rgba(244,239,232,.5)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      </div>

      <div className="sc-inner">

        {/* NIGHT BADGE */}
        {isRitual && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '4px 0 8px',
            animation: 'fadeUp .3s ease both',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(246,197,111,.08)',
              border: '1px solid rgba(246,197,111,.18)',
              borderRadius: 20,
              padding: '4px 14px',
            }}>
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#F6C56F',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: '.1em',
                textTransform: 'uppercase' as const,
                color: 'rgba(246,197,111,.65)',
              }}>
                {cName} is ready
              </span>
            </div>
          </div>
        )}

        {/* CREATURE ZONE + SPEECH BUBBLE (above cards) */}
        {(!ritualEntryDone || isRitual) && (
          <div className="sc-creature" style={{ animation: `fadeUp .4s ease both ${stagger(0)}` }}>
            {isRitual && (
              <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.1), transparent 70%)', top: -40, left: '50%', transform: 'translateX(-50%)', animation: 'pulse 5s ease-in-out infinite', pointerEvents: 'none' as const, zIndex: 0 }} />
            )}
            {loading ? (
              <div className="sc-egg">{'\u{1F95A}'}</div>
            ) : (
              <>
                {cImageSrc ? (
                  <div style={{ width: 100, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floatCreature 4.5s ease-in-out infinite', position: 'relative' as const, zIndex: 1 }}>
                    <img src={cImageSrc} alt={cName} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(246,197,111,.3))' }} />
                  </div>
                ) : (
                  <div className="sc-creature-emoji" style={{ animation: 'floatCreature 4.5s ease-in-out infinite, glowGold 4s ease-in-out infinite', position: 'relative' as const, zIndex: 1 }}>{cEmoji}</div>
                )}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'rgba(246,197,111,.55)', marginTop: 4, textAlign: 'center' as const }}>{cName}</div>
                {cType && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.2)', marginTop: 2, textAlign: 'center' as const }}>
                    {cType.charAt(0).toUpperCase() + cType.slice(1).replace(/-/g, ' ')}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* DreamKeeper speech bubble above cards */}
        {isRitual && !ritualEntryDone && (
          <div className="sc-bubble" style={{
            borderColor: 'rgba(246,197,111,.2)',
            background: 'rgba(246,197,111,.04)',
            opacity: 1,
            animation: `bubblePop .35s ease forwards ${stagger(1)}`,
            marginBottom: 18,
          }}>
            <div className="sc-bubble-text" style={{ fontFamily: "var(--lora)", fontStyle: 'italic' }}>
              What kind of story <em style={{ color: '#F6C56F', fontStyle: 'normal', fontWeight: 700 }}>tonight</em>? {cEmoji}
            </div>
          </div>
        )}

        {/* RITUAL 3-CARD ENTRY */}
        {isRitual && !ritualEntryDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Card 1: Tell me about today */}
            <button
              className="sc-entry-card"
              onClick={() => { setMode('today'); setRitualEntryDone(true); }}
              style={{
                border: '1.5px solid rgba(246,197,111,.18)',
                background: 'linear-gradient(135deg, rgba(246,197,111,.08), rgba(12,18,48,.92))',
                animation: `fadeUp .4s ease both ${stagger(2)}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(246,197,111,.4)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(246,197,111,.14), rgba(12,18,48,.92))'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(246,197,111,.18)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(246,197,111,.08), rgba(12,18,48,.92))'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(246,197,111,.08)', border: '1px solid rgba(246,197,111,.12)', flexShrink: 0,
              }}>
                <span style={{ fontSize: 26 }}>{'\u2600\uFE0F'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--heading)", fontSize: 15, fontWeight: 700, color: '#F4EFE8', marginBottom: 2 }}>Tell me about today</div>
                <div style={{ fontSize: 11, color: 'rgba(244,239,232,.4)', fontFamily: 'var(--body)' }}>Turn something real into tonight's story</div>
              </div>
            </button>

            {/* Card 2: Let's go somewhere */}
            <button
              className="sc-entry-card"
              onClick={() => { setMode('adventure'); setRitualEntryDone(true); }}
              style={{
                border: '1.5px solid rgba(154,127,212,.2)',
                background: 'linear-gradient(135deg, rgba(154,127,212,.1), rgba(10,12,42,.92))',
                animation: `fadeUp .4s ease both ${stagger(3)}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(184,161,255,.45)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154,127,212,.16), rgba(10,12,42,.92))'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(154,127,212,.2)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154,127,212,.1), rgba(10,12,42,.92))'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(154,127,212,.08)', border: '1px solid rgba(154,127,212,.12)', flexShrink: 0,
              }}>
                <span style={{ fontSize: 26 }}>{'\u{1F680}'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--heading)", fontSize: 15, fontWeight: 700, color: '#F4EFE8', marginBottom: 2 }}>Let's go somewhere</div>
                <div style={{ fontSize: 11, color: 'rgba(244,239,232,.4)', fontFamily: 'var(--body)' }}>Pick a world for tonight's adventure</div>
              </div>
              {/* MOST FUN badge */}
              <div style={{
                position: 'absolute', top: 10, right: 12,
                background: 'rgba(154,127,212,.2)', border: '1px solid rgba(184,161,255,.3)',
                borderRadius: 8, padding: '2px 8px',
                fontFamily: 'var(--mono)', fontSize: 7, fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase' as const,
                color: '#B8A1FF',
              }}>
                MOST FUN
              </div>
            </button>

            {/* Card 3: Make Any Story */}
            <button
              className="sc-entry-card"
              onClick={() => { setMode('free'); setRitualEntryDone(true); }}
              style={{
                border: '1.5px solid rgba(111,231,221,.12)',
                background: 'rgba(111,231,221,.05)',
                animation: `fadeUp .4s ease both ${stagger(4)}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(111,231,221,.3)'; e.currentTarget.style.background = 'rgba(111,231,221,.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(111,231,221,.12)'; e.currentTarget.style.background = 'rgba(111,231,221,.05)'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(111,231,221,.06)', border: '1px solid rgba(111,231,221,.1)', flexShrink: 0,
              }}>
                <span style={{ fontSize: 26 }}>{'\u2728'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--heading)", fontSize: 15, fontWeight: 700, color: '#F4EFE8', marginBottom: 2 }}>Make Any Story</div>
                <div style={{ fontSize: 11, color: 'rgba(244,239,232,.4)', fontFamily: 'var(--body)' }}>Create a story about anything with anyone you want</div>
              </div>
            </button>
          </div>
        )}

        {/* SPEECH BUBBLE (after entry selection) */}
        {ritualEntryDone && (
          <>
            {/* Inline creature for post-entry */}
            {!isRitual && (
              <div className="sc-creature create-creature" style={{ animation: 'fadeUp .3s ease both' }}>
                {loading ? (
                  <div className="sc-egg" style={{ fontSize: 36 }}>{'\u{1F95A}'}</div>
                ) : (
                  <>
                    {cImageSrc ? (
                      <div style={{ width: 52, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'floatCreature 3.5s ease-in-out infinite' }}>
                        <img src={cImageSrc} alt={cName} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(246,197,111,.3))' }} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 42, animation: 'floatCreature 3.5s ease-in-out infinite, glowGold 3s ease-in-out infinite', display: 'inline-block' }}>{cEmoji}</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--heading)", fontSize: 15, fontWeight: 700, color: 'var(--cream)', lineHeight: 1.3 }}>
                        What kind of story{' '}
                        <em style={{ color: '#F6C56F', fontStyle: 'italic' }}>tonight?</em>
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(246,197,111,.4)', marginTop: 3 }}>
                        {cName} {'\u00B7'} ready to write
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="sc-bubble" style={{
              borderColor: mode === 'free' ? 'rgba(111,231,221,.2)' : mode === 'adventure' ? 'rgba(154,127,212,.2)' : 'rgba(246,197,111,.2)',
              background: mode === 'free' ? 'rgba(111,231,221,.04)' : mode === 'adventure' ? 'rgba(154,127,212,.04)' : 'rgba(246,197,111,.04)',
              opacity: 1,
              animation: 'bubblePop .35s ease forwards',
            }}>
              <div className="sc-bubble-text">{renderBubbleText()}</div>
            </div>
          </>
        )}

        {/* MODE TOGGLE (create only) */}
        {!isRitual && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button
              onClick={() => switchMode('today')}
              style={{
                flex: 1, padding: '12px', borderRadius: 14, fontFamily: 'var(--cta)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                border: mode === 'today' ? '1.5px solid rgba(246,197,111,.4)' : '1.5px solid rgba(255,255,255,.08)',
                background: mode === 'today' ? 'rgba(246,197,111,.12)' : 'rgba(255,255,255,.04)',
                color: mode === 'today' ? '#F6C56F' : 'var(--muted)',
              }}
            >
              {'\u2600\uFE0F'} My Day
            </button>
            <button
              onClick={() => switchMode('adventure')}
              style={{
                flex: 1, padding: '12px', borderRadius: 14, fontFamily: 'var(--cta)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                border: mode === 'adventure' ? '1.5px solid rgba(154,127,212,.4)' : '1.5px solid rgba(255,255,255,.08)',
                background: mode === 'adventure' ? 'rgba(154,127,212,.1)' : 'rgba(255,255,255,.04)',
                color: mode === 'adventure' ? '#B8A1FF' : 'var(--muted)',
              }}
            >
              {'\u{1F680}'} Adventure
            </button>
            <button
              onClick={() => switchMode('free')}
              style={{
                flex: 1, padding: '12px', borderRadius: 14, fontFamily: 'var(--cta)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                border: mode === 'free' ? '1.5px solid rgba(111,231,221,.4)' : '1.5px solid rgba(255,255,255,.08)',
                background: mode === 'free' ? 'rgba(111,231,221,.1)' : 'rgba(255,255,255,.04)',
                color: mode === 'free' ? '#6FE7DD' : 'var(--muted)',
              }}
            >
              {'\u2728'} Anything
            </button>
          </div>
        )}

        {/* ═══ MY DAY INPUT ZONE ═══ */}
        {mode === 'today' && ritualEntryDone && (
          <div style={{ animation: 'fadeUp .3s ease both' }}>
            {/* Inspiration card */}
            {showInspiration && (
              <div style={{
                background: 'rgba(246,197,111,.05)',
                border: '1px solid rgba(246,197,111,.15)',
                borderRadius: 14,
                padding: '11px 13px',
                flexShrink: 0,
                animation: `fadeUp .3s ease-out ${stagger(1)}`,
                marginBottom: 14,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontFamily: "var(--mono)",
                    fontSize: 8,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase' as const,
                    color: 'rgba(246,197,111,.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    {cEmoji}{' '}{cName} suggests asking{'\u2026'}
                  </div>
                  <button
                    onClick={shuffleQuestion}
                    style={{
                      fontFamily: "var(--cta)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(246,197,111,.4)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {'\u{1F500}'} different
                  </button>
                </div>
                <div
                  onClick={useQuestion}
                  style={{
                    fontFamily: "var(--cta)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,.75)',
                    lineHeight: 1.6,
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  {renderInspoQuestion(currentQuestion)}
                </div>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 8,
                  letterSpacing: '.04em',
                  color: 'rgba(246,197,111,.3)',
                }}>
                  {'\u2191'} tap to use {'\u00B7'} {'\u{1F500}'} to see another
                </div>
              </div>
            )}

            {/* Voice button */}
            {hasSpeechAPI && (
              <button
                className={`sc-voice${isListening ? ' rec' : ''}`}
                onClick={toggleVoice}
              >
                <span className="sc-voice-icon">{'\u{1F399}\uFE0F'}</span>
                <span className="sc-voice-text">
                  {isListening
                    ? 'Listening\u2026 tap to stop'
                    : `Tell ${cName} out loud`
                  }
                </span>
                <span className="sc-voice-waves">
                  {[0, .1, .2, .15, .05].map((d, i) => (
                    <span
                      key={i}
                      className="sc-wave-bar"
                      style={{
                        height: 4,
                        animation: isListening
                          ? `waveBar .6s ${d}s ease-in-out infinite`
                          : `waveBarIdle 1.8s ${d * 3}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                </span>
              </button>
            )}

            {/* Transcript card OR textarea */}
            {transcript && !isEditing ? (
              <div className="sc-transcript">
                <div className="sc-transcript-header">
                  <span className="sc-transcript-label">{'\u{1F399}\uFE0F'} Heard</span>
                  <button className="sc-transcript-edit" onClick={() => setIsEditing(true)}>
                    Edit {'\u270F\uFE0F'}
                  </button>
                </div>
                <div className="sc-transcript-text">{transcript}</div>
              </div>
            ) : transcript && isEditing ? (
              <>
                <textarea
                  className="sc-textarea"
                  rows={2}
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  autoFocus
                />
                <button
                  className="sc-transcript-edit"
                  style={{ display: 'block', marginBottom: 8 }}
                  onClick={() => setIsEditing(false)}
                >
                  Done {'\u2713'}
                </button>
              </>
            ) : (
              <>
                {hasSpeechAPI && (
                  <div className="sc-or">
                    <div className="sc-or-line" />
                    <span className="sc-or-text">or write it down</span>
                    <div className="sc-or-line" />
                  </div>
                )}
                <textarea
                  className="sc-textarea"
                  rows={2}
                  value={brief}
                  onChange={e => { setBrief(e.target.value); setTranscript(''); }}
                  placeholder="We found a really fat frog under the plant pot..."
                  style={{
                    caretColor: '#F6C56F',
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* ═══ ADVENTURE INPUT ZONE ═══ */}
        {mode === 'adventure' && ritualEntryDone && (
          <div style={{ animation: 'fadeUp .3s ease both' }}>
            {!showCustomWorldInput ? (
              <>
                <div style={{ fontFamily: 'var(--heading)', fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,.65)', textAlign: 'center', marginBottom: 14 }}>
                  Where should we go tonight?
                </div>
                {/* Horizontal scrolling pills */}
                <div className="sc-world-scroll">
                  {WORLDS.map(w => (
                    <div
                      key={w.key}
                      className={`sc-world-pill${worldChoice === w.key ? ' on' : ''}`}
                      onClick={() => selectWorld(w.key)}
                    >
                      <span className="sc-world-pill-emoji">{w.emoji}</span>
                      <span className="sc-world-pill-name">{w.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setShowCustomWorldInput(false); setWorldChoice(''); setCustomWorld(''); }}
                  style={{
                    fontSize: 11, color: 'rgba(154,127,212,.5)', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--body)', fontWeight: 600, marginBottom: 10, transition: 'color .15s',
                  }}
                >
                  {'\u2190'} choose a world
                </button>
                <textarea
                  className="sc-textarea purple"
                  rows={2}
                  value={customWorld}
                  onChange={e => setCustomWorld(e.target.value)}
                  placeholder="A world where everything is tiny..."
                  autoFocus
                />
              </>
            )}

            {/* Wild detail \u2014 after world selected */}
            {worldChoice && (worldChoice !== 'custom' || customWorld.trim()) && (
              <div className="sc-detail-section" style={{ marginTop: 8 }}>
                <div className="sc-detail-label">One weird detail that has to be in the story</div>
                <div className="sc-detail-chips">
                  {detailChips.map(chip => (
                    <div
                      key={chip}
                      className={`sc-detail-chip${adventureDetail === chip ? ' on' : ''}`}
                      onClick={() => setAdventureDetail(adventureDetail === chip ? '' : chip)}
                    >
                      {chip}
                    </div>
                  ))}
                </div>
                <div className="sc-or">
                  <div className="sc-or-line" />
                  <span className="sc-or-text">or make one up</span>
                  <div className="sc-or-line" />
                </div>
                <textarea
                  className="sc-textarea purple"
                  rows={2}
                  value={detailChips.includes(adventureDetail) ? '' : adventureDetail}
                  onChange={e => setAdventureDetail(e.target.value)}
                  placeholder="The spaceship smells like dad's old car..."
                />
              </div>
            )}
          </div>
        )}

        {/* ═══ MAKE ANY STORY — Single Screen ═══ */}
        {mode === 'free' && ritualEntryDone && (
          <div style={{ animation: 'crossfade .3s ease both' }}>

            {/* Voice / Text Input */}
            {true && (
              <div style={{ animation: 'fadeUp .3s ease both' }}>
                {/* Large voice button */}
                {hasSpeechAPI && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <button
                      className={`sc-voice-lg${freeListening ? ' rec' : ''}`}
                      onClick={toggleFreeVoice}
                    >
                      {freeListening ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {[0, .1, .2, .15, .05].map((d, i) => (
                            <span
                              key={i}
                              style={{
                                width: 4, borderRadius: 2, background: '#FF8070',
                                height: 4, display: 'inline-block',
                                animation: `waveBar .6s ${d}s ease-in-out infinite`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6FE7DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      )}
                    </button>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.08em',
                      textTransform: 'uppercase' as const, color: 'rgba(111,231,221,.4)', marginTop: 8,
                    }}>
                      {freeListening ? 'Listening\u2026 tap to stop' : 'Tap to speak'}
                    </div>
                  </div>
                )}

                {/* Transcript → editable, or type from scratch */}
                {freeTranscript ? (
                  <div style={{ animation: 'fadeUp .25s ease both' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6FE7DD', letterSpacing: '.06em', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {'\u{1F399}\uFE0F'} Heard
                      </div>
                      <button
                        onClick={() => { setFreeBrief(freeTranscript); setFreeTranscript(''); }}
                        style={{
                          fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.04em',
                          color: 'rgba(111,231,221,.5)', background: 'none', border: 'none',
                          cursor: 'pointer', padding: '2px 4px',
                        }}
                      >
                        {'\u270E'} Edit
                      </button>
                    </div>
                    <textarea
                      className="sc-textarea cyan"
                      rows={2}
                      value={freeTranscript}
                      onChange={e => { setFreeBrief(e.target.value); setFreeTranscript(''); }}
                      style={{ caretColor: '#6FE7DD' }}
                    />
                  </div>
                ) : (
                  <>
                    {hasSpeechAPI && (
                      <div className="sc-or">
                        <div className="sc-or-line" />
                        <span className="sc-or-text">or type instead</span>
                        <div className="sc-or-line" />
                      </div>
                    )}
                    <textarea
                      className="sc-textarea cyan"
                      rows={2}
                      value={freeBrief}
                      onChange={e => setFreeBrief(e.target.value)}
                      placeholder={FREE_PLACEHOLDERS[freePlaceholderIdx]}
                      style={{ caretColor: '#6FE7DD' }}
                    />
                  </>
                )}

                {/* Helper text */}
                {!freeHasContent && (
                  <div style={{
                    fontFamily: 'var(--body)', fontSize: 11, color: 'rgba(244,239,232,.3)',
                    textAlign: 'center', marginTop: 8, lineHeight: 1.5,
                  }}>
                    Say anything {'\u2014'} mention anyone you want in the story.
                  </div>
                )}
              </div>
            )}

            {/* Who's this story for? */}
            {freeHasContent && (
              <div style={{
                marginTop: 12, animation: 'fadeUp .3s .05s ease both',
              }}>
                <div
                  onClick={() => { if (!storyForEditing) setStoryForEditing(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
                    border: '1.5px solid rgba(246,197,111,.2)',
                    background: 'rgba(246,197,111,.04)',
                    transition: 'all .2s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{storyForName ? '\u{1F381}' : (primaryChar?.emoji || '\u{1F9D2}')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em',
                      textTransform: 'uppercase' as const,
                      color: 'rgba(246,197,111,.4)', marginBottom: 3,
                    }}>
                      Who's this story for?
                    </div>
                    {storyForEditing ? (
                      <input
                        type="text"
                        value={storyForName}
                        onChange={e => setStoryForName(e.target.value)}
                        onBlur={() => setStoryForEditing(false)}
                        onKeyDown={e => { if (e.key === 'Enter') setStoryForEditing(false); }}
                        placeholder={childName}
                        autoFocus
                        style={{
                          width: '100%', padding: '4px 0', border: 'none',
                          borderBottom: '1.5px solid rgba(246,197,111,.3)',
                          background: 'transparent', outline: 'none',
                          color: '#F6C56F', fontSize: 14, fontWeight: 700,
                          fontFamily: 'var(--body)',
                        }}
                      />
                    ) : (
                      <div style={{
                        fontFamily: 'var(--body)', fontSize: 14, fontWeight: 700,
                        color: '#F6C56F',
                      }}>
                        {storyForName || childName}
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(246,197,111,.35)',
                          marginLeft: 8, letterSpacing: '.04em',
                        }}>
                          {storyForName ? '' : '(tap to change)'}
                        </span>
                      </div>
                    )}
                  </div>
                  {storyForName && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setStoryForName(''); setStoryForEditing(false); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(244,239,232,.25)', fontSize: 14, padding: '2px 4px',
                      }}
                    >{'\u2715'}</button>
                  )}
                </div>
              </div>
            )}

            {/* DreamKeeper Toggle */}
            {creature && freeHasContent && (
              <div
                onClick={() => setDreamkeeperInStory(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 14, marginTop: 12, cursor: 'pointer',
                  border: `1.5px solid ${dreamkeeperInStory ? 'rgba(111,231,221,.25)' : 'rgba(255,255,255,.06)'}`,
                  background: dreamkeeperInStory ? 'rgba(111,231,221,.06)' : 'rgba(255,255,255,.02)',
                  transition: 'all .2s',
                  animation: 'fadeUp .3s .1s ease both',
                }}
              >
                <span style={{ fontSize: 22 }}>{cEmoji || '\u{1F31F}'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700,
                    color: dreamkeeperInStory ? '#6FE7DD' : 'rgba(244,239,232,.4)',
                    transition: 'color .2s',
                  }}>
                    {cName} in this story?
                  </div>
                  {dreamkeeperInStory && (
                    <div style={{
                      fontFamily: 'var(--body)', fontSize: 10, fontStyle: 'italic',
                      color: 'rgba(111,231,221,.4)', marginTop: 2,
                    }}>
                      {creature.dreamAnswer
                        ? `"I dream about ${creature.dreamAnswer}"`
                        : `"I'll be right there with ${childName}."`
                      }
                    </div>
                  )}
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 11, padding: 2,
                  background: dreamkeeperInStory ? 'rgba(111,231,221,.3)' : 'rgba(255,255,255,.08)',
                  transition: 'background .2s',
                  display: 'flex', alignItems: 'center',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: dreamkeeperInStory ? '#6FE7DD' : 'rgba(255,255,255,.2)',
                    transition: 'all .2s',
                    transform: dreamkeeperInStory ? 'translateX(18px)' : 'translateX(0)',
                  }} />
                </div>
              </div>
            )}

            {/* Companion toggles in free mode */}
            {companions.length > 0 && freeHasContent && companions.map(comp => {
              const isSelected = selectedCompanionIds.has(comp.id);
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompanionIds(prev => {
                      const next = new Set(prev);
                      if (next.has(comp.id)) next.delete(comp.id);
                      else next.add(comp.id);
                      return next;
                    });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 14, marginTop: 8, cursor: 'pointer',
                    border: `1.5px solid ${isSelected ? 'rgba(246,197,111,.25)' : 'rgba(255,255,255,.06)'}`,
                    background: isSelected ? 'rgba(246,197,111,.06)' : 'rgba(255,255,255,.02)',
                    transition: 'all .2s',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{comp.creatureEmoji || '✨'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700,
                      color: isSelected ? '#F6C56F' : 'rgba(244,239,232,.4)',
                      transition: 'color .2s',
                    }}>
                      {comp.name} joining too?
                    </div>
                  </div>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11, padding: 2,
                    background: isSelected ? 'rgba(246,197,111,.3)' : 'rgba(255,255,255,.08)',
                    transition: 'background .2s',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: isSelected ? '#F6C56F' : 'rgba(255,255,255,.2)',
                      transition: 'all .2s',
                      transform: isSelected ? 'translateX(18px)' : 'translateX(0)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ OCCASION TAG ═══ */}
        {showOccasionTag && mode === 'today' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 6,
            animation: 'fadeUp .3s ease-out',
            flexShrink: 0,
            marginTop: 10,
            marginBottom: 4,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: "var(--mono)",
                fontSize: 8,
                letterSpacing: '.08em',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,.28)',
              }}>
                Tag this story
              </span>
              <button
                onClick={() => setOccasionDismissed(true)}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 8,
                  color: 'rgba(255,255,255,.2)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '.04em',
                }}
              >
                Skip {'\u2192'}
              </button>
            </div>
            <div style={{
              display: 'flex',
              gap: 5,
              overflowX: 'auto' as const,
              paddingBottom: 2,
              scrollbarWidth: 'none' as const,
            }}>
              {OCCASION_OPTIONS.map(occ => {
                const isSelected = occasionTag === occ.label;
                return (
                  <button
                    key={occ.label}
                    onClick={() => setOccasionTag(isSelected ? '' : occ.label)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 50,
                      fontSize: 10,
                      cursor: 'pointer',
                      border: isSelected
                        ? '1px solid rgba(246,197,111,.38)'
                        : '1px solid rgba(255,255,255,.1)',
                      background: isSelected
                        ? 'rgba(246,197,111,.1)'
                        : 'rgba(255,255,255,.04)',
                      color: isSelected ? '#F6C56F' : 'rgba(255,255,255,.42)',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 700,
                      whiteSpace: 'nowrap' as const,
                      flexShrink: 0,
                      transition: 'all .2s',
                    }}
                  >
                    {occ.emoji} {occ.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CAST SECTION (today & adventure modes) ═══ */}
        {mode !== 'free' && ritualEntryDone && <>
          <div className="sc-cast-label">Who's in the story?</div>
          <div className="sc-cast-row">
            {/* Hero pill (always first, not deselectable) */}
            {primaryChar && (
              <div className="sc-cast-pill hero">
                <span className="sc-cast-emoji">{primaryChar.emoji || '\u{1F9D2}'}</span>
                <span className="sc-cast-name">{primaryChar.name}</span>
              </div>
            )}
            {!primaryChar && (
              <div className="sc-cast-pill hero">
                <span className="sc-cast-emoji">{'\u{1F9D2}'}</span>
                <span className="sc-cast-name">Your child</span>
              </div>
            )}

            {/* DreamKeeper pill */}
            {creature && (
              <div
                className={`sc-cast-pill${creatureSelected ? ' on' : ''}${atMax && !creatureSelected ? ' dim' : ''}`}
                onClick={() => {
                  if (atMax && !creatureSelected) return;
                  setCreatureSelected(prev => !prev);
                }}
              >
                <span className="sc-cast-emoji">{creature.creatureEmoji || '\u{1F31F}'}</span>
                <span className="sc-cast-name">{creature.name}</span>
              </div>
            )}

            {/* Hatched companion pills */}
            {companions.map(comp => {
              const isSelected = selectedCompanionIds.has(comp.id);
              return (
                <div
                  key={comp.id}
                  className={`sc-cast-pill${isSelected ? ' on' : ''}${atMax && !isSelected ? ' dim' : ''}`}
                  onClick={() => {
                    if (atMax && !isSelected) return;
                    setSelectedCompanionIds(prev => {
                      const next = new Set(prev);
                      if (next.has(comp.id)) next.delete(comp.id);
                      else next.add(comp.id);
                      return next;
                    });
                  }}
                >
                  <span className="sc-cast-emoji">{comp.creatureEmoji || '✨'}</span>
                  <span className="sc-cast-name">{comp.name}</span>
                </div>
              );
            })}

            {/* Other characters */}
            {otherChars.map(c => (
              <div
                key={c.id}
                className={`sc-cast-pill${isInCast(c.id) ? ' on' : ''}${atMax && !isInCast(c.id) ? ' dim' : ''}`}
                onClick={() => toggleCastChar(c)}
                title={atMax && !isInCast(c.id) ? 'max 5 characters' : undefined}
              >
                <span className="sc-cast-emoji">{c.emoji || '\u{1F9D2}'}</span>
                <span className="sc-cast-name">{c.name}</span>
              </div>
            ))}
          </div>
        </>}

        {/* ═══ COLLAPSED OPTIONS ═══ */}
        {ritualEntryDone && (
          <>
            <div
              className="sc-settings-trigger"
              onClick={() => setSettingsOpen(prev => !prev)}
            >
              <span className="sc-settings-left">Story options</span>
              <div className="sc-settings-right">
                {summary && !settingsOpen && (
                  <div className="sc-settings-badges">
                    {summary.split(' \u00B7 ').map(s => (
                      <span key={s} className="sc-settings-badge">{s}</span>
                    ))}
                  </div>
                )}
                <span className={`sc-settings-chevron${settingsOpen ? ' open' : ''}`}>
                  {'\u25BE'}
                </span>
              </div>
            </div>

            <div
              className="sc-settings-body"
              style={{
                maxHeight: settingsOpen ? 400 : 0,
                opacity: settingsOpen ? 1 : 0,
              }}
            >
              <div className="sc-settings-inner">
                {/* Length */}
                <div className="sc-settings-row">
                  <span className="sc-settings-row-label">Length</span>
                  <div className="sc-settings-pills">
                    {LENGTH_OPTIONS.map(o => (
                      <button key={o.key} className={`sc-spill${length === o.key ? ' on' : ''}`} onClick={() => setLength(o.key)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Feel */}
                <div className="sc-settings-row">
                  <span className="sc-settings-row-label">Feel</span>
                  <div className="sc-settings-pills">
                    {VIBE_OPTIONS.map(o => (
                      <button key={o.key} className={`sc-spill${vibe === o.key ? ' on' : ''}`} onClick={() => { setVibe(o.key); setManualVibe(true); }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Style */}
                <div className="sc-settings-row">
                  <span className="sc-settings-row-label">Style</span>
                  <div className="sc-settings-pills">
                    {STYLE_OPTIONS.map(o => (
                      <button key={o.key} className={`sc-spill${style === o.key ? ' on' : ''}`} onClick={() => setStyle(o.key)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Age */}
                <div className="sc-settings-row">
                  <span className="sc-settings-row-label">Age</span>
                  <div className="sc-settings-pills">
                    {AGE_OPTIONS.map(o => (
                      <button key={o.key} className={`sc-spill${level === o.key ? ' on' : ''}`} onClick={() => setLevel(o.key)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* CTA (hidden during ritual entry card selection) */}
      {ritualEntryDone && (mode !== 'free' || freeHasContent) && (
        <div className="sc-cta-wrap">
          <button
            className={`sc-cta ${ctaColor}`}
            disabled={ctaDisabled}
            onClick={handleGenerate}
          >
            <span className="sc-cta-main">{ctaLabel}</span>
            <span className="sc-cta-sub">{ctaSub}</span>
          </button>
        </div>
      )}
    </div>
  );
}
