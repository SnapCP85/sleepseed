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
  { emoji: '\u{1F680}', label: 'Outer Space', key: 'space' },
  { emoji: '\u{1F30A}', label: 'Deep Ocean', key: 'ocean' },
  { emoji: '\u{1F332}', label: 'Magic Forest', key: 'forest' },
  { emoji: '\u{1F3F0}', label: 'Ancient Castle', key: 'castle' },
  { emoji: '\u{1F30B}', label: 'Volcano Island', key: 'volcano' },
  { emoji: '\u270F\uFE0F', label: 'Somewhere else\u2026', key: 'custom' },
];

const WORLD_DETAILS: Record<string, string[]> = {
  space: [
    'The astronaut only speaks in rhymes',
    "There's a traffic jam between the planets",
    "The moon smells like dad's old car",
  ],
  ocean: [
    'The fish are running a very formal meeting',
    'The treasure chest is full of lost socks',
    'A crab has been waiting here for 200 years',
  ],
  forest: [
    'The trees have been arguing for 100 years',
    'One mushroom knows everything',
    "Something got lost here and it's still looking",
  ],
  castle: [
    'The dragon collects spoons, not gold',
    'The knight is terrified of butterflies',
    'The princess has been awake for 3 days',
  ],
  volcano: [
    'The lava is actually strawberry jam',
    'A flamingo lives at the top',
    'Someone left a shoe here 10 years ago',
  ],
  custom: [
    'Something is not where it should be',
    'One character knows a secret',
    'Things keep going slightly wrong',
  ],
};

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

/* ── Helpers ── */

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
   CSS
   ══════════════════════════════════════════════════════════════════════ */

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#040a16;--amber:#F5B84C;--amber-dk:#a06010;--teal:#14d890;--teal-dk:#0a7a50;
  --purple:#c090ff;--purple-dk:#5010a0;--cream:#f5e8c8;--muted:rgba(255,255,255,.35);
  --card:rgba(6,10,28,.92);--border:rgba(255,255,255,.07);
  --heading:'Fraunces',Georgia,serif;--body:'Nunito',system-ui,sans-serif;
  --cta:'Baloo 2',system-ui,sans-serif;--mono:'DM Mono',monospace;
}
.sc{min-height:100dvh;font-family:var(--body);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
.sc.ritual{background:radial-gradient(ellipse at 50% 0%,#0a1428 0%,#040810 55%,#020406 100%)}
.sc.create{background:radial-gradient(ellipse at 50% 0%,#061820 0%,#030c10 55%,#020408 100%)}

/* animations */
@keyframes floatCreature{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes glowAmber{0%,100%{filter:drop-shadow(0 0 10px rgba(245,184,76,.4))}50%{filter:drop-shadow(0 0 28px rgba(245,184,76,.55))}}
@keyframes glowTeal{0%,100%{filter:drop-shadow(0 0 8px rgba(96,220,160,.35))}50%{filter:drop-shadow(0 0 22px rgba(96,220,160,.5))}}
@keyframes glowPurple{0%,100%{filter:drop-shadow(0 0 8px rgba(160,96,240,.35))}50%{filter:drop-shadow(0 0 22px rgba(160,96,240,.5))}}
@keyframes shimmer{0%{transform:translateX(-130%)}100%{transform:translateX(170%)}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes typingDot{0%,100%{transform:scale(.7)}50%{transform:scale(1)}}
@keyframes waveBar{0%,100%{height:4px}50%{height:18px}}
@keyframes eggRock{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes bubblePop{0%{opacity:0;transform:scale(.94) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes twinkle{0%,100%{opacity:.04;transform:scale(.35)}50%{opacity:.9;transform:scale(1.4)}}
@keyframes waveBarIdle{0%,100%{height:3px;opacity:.28}50%{height:8px;opacity:.62}}
@keyframes pulse{0%,100%{opacity:.15;transform:translateX(-50%) scale(1)}50%{opacity:.45;transform:translateX(-50%) scale(1.1)}}

/* nav */
.sc-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:52px;position:sticky;top:0;z-index:20;background:rgba(4,10,22,.92);backdrop-filter:blur(16px)}
.sc.ritual .sc-nav{border-bottom:1px solid rgba(245,184,76,.07)}
.sc.create .sc-nav{border-bottom:1px solid rgba(20,216,144,.07)}
.sc-logo{font-family:var(--heading);font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;color:var(--cream)}
.sc-logo-moon{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.sc-close{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:6px;line-height:1;transition:color .15s}
.sc-close:hover{color:var(--cream)}

/* inner */
.sc-inner{flex:1;width:100%;max-width:540px;margin:0 auto;padding:0 5% 180px;overflow-x:hidden;position:relative;z-index:5}

/* creature zone */
.sc-creature{display:flex;flex-direction:column;align-items:center;padding:20px 0 4px;animation:slideUp .4s ease both;position:relative}
.sc-creature.create-creature{flex-direction:row;align-items:center;gap:12px;padding:16px 0 4px}
.sc-creature-emoji{font-size:72px;animation:floatCreature 4s ease-in-out infinite}
.sc-creature.create-creature .sc-creature-emoji{font-size:42px}
.sc-creature-glow{animation:glowAmber 3s ease-in-out infinite}
.sc-creature-glow-teal{animation:glowTeal 3s ease-in-out infinite}
.sc-creature-glow-purple{animation:glowPurple 3s ease-in-out infinite}
.sc-creature-name{font-size:9px;font-weight:400;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-family:var(--mono);margin-top:4px}
.sc-creature-type{font-size:8px;color:rgba(255,255,255,.2);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}
.sc-egg{font-size:56px;animation:eggRock 2s ease-in-out infinite;display:inline-block}

/* bubble */
.sc-bubble{position:relative;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:14px 18px;margin:12px 0 18px;text-align:center;animation:bubblePop .4s ease forwards .2s;opacity:0}
.sc-bubble::before{content:'';position:absolute;top:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:7px solid rgba(255,255,255,.1)}
.sc-bubble-text{font-family:var(--body);font-size:13.5px;font-weight:600;color:rgba(255,255,255,.72);line-height:1.6}

/* mode toggle */
.sc-mode{display:flex;gap:8px;margin-bottom:18px}
.sc-mode-btn{flex:1;padding:12px;border-radius:14px;font-family:var(--cta);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;text-align:center;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--muted)}
.sc-mode-btn:hover{border-color:rgba(255,255,255,.15)}
.sc-mode-btn.today-on{background:rgba(245,184,76,.12);border-color:rgba(245,184,76,.4);color:#F5B84C}
.sc-mode-btn.adv-on{background:rgba(160,96,240,.1);border-color:rgba(160,96,240,.4);color:#c090ff}

/* occasion pills */
.sc-occ-label{font-size:9px;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-family:var(--mono);margin-bottom:8px}
.sc-occ-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.sc-occ-row::-webkit-scrollbar{display:none}
.sc-occ{padding:7px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;font-family:var(--body);display:flex;align-items:center;gap:4px;flex-shrink:0}
.sc-occ:hover{border-color:rgba(255,255,255,.18)}
.sc-occ.on{background:rgba(245,184,76,.12);border-color:rgba(245,184,76,.4);color:#F5B84C}

/* voice button */
.sc-voice{width:100%;padding:13px 16px;border-radius:14px;border:1.5px solid rgba(245,184,76,.22);background:rgba(10,15,35,.7);cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:12px;margin-bottom:8px;font-family:var(--body)}
.sc-voice:hover{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.07)}
.sc-voice.rec{border-color:rgba(245,76,76,.6);background:rgba(245,76,76,.05);animation:micPulse 1.2s ease-in-out infinite}
.sc-voice.teal{border-color:rgba(20,216,144,.2);background:rgba(6,20,16,.7)}
.sc-voice.teal:hover{border-color:rgba(20,216,144,.4);background:rgba(20,216,144,.07)}
.sc-voice-icon{font-size:20px;flex-shrink:0}
.sc-voice-text{flex:1;font-size:13px;font-weight:600;color:#F5B84C;text-align:left}
.sc-voice.teal .sc-voice-text{color:#14d890}
.sc-voice.rec .sc-voice-text{color:#FF8070}
.sc-voice-waves{display:flex;align-items:center;gap:2px;flex-shrink:0}
.sc-wave-bar{width:4px;border-radius:2px;background:var(--amber)}
.sc-voice.teal .sc-wave-bar{background:var(--teal)}

/* or divider */
.sc-or{display:flex;align-items:center;gap:10px;margin:10px 0}
.sc-or-line{flex:1;height:1px;background:rgba(255,255,255,.07)}
.sc-or-text{font-size:9px;color:rgba(255,255,255,.2);letter-spacing:.06em;white-space:nowrap}

/* textarea */
.sc-textarea{width:100%;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(245,184,76,.25);background:rgba(245,184,76,.05);color:var(--cream);font-size:13px;font-family:var(--body);font-weight:700;outline:none;resize:none;min-height:60px;line-height:1.65;transition:border-color .2s,box-shadow .2s;margin-bottom:6px}
.sc-textarea:focus{border-color:rgba(245,184,76,.45);box-shadow:0 0 0 3px rgba(245,184,76,.07)}
.sc-textarea::placeholder{color:rgba(255,255,255,.18);font-style:italic}
.sc-textarea.teal{border-color:rgba(20,216,144,.2);background:rgba(255,255,255,.05)}
.sc-textarea.teal:focus{border-color:rgba(20,216,144,.45);box-shadow:0 0 0 3px rgba(20,216,144,.07)}
.sc-textarea.purple{border-color:rgba(160,96,240,.3)}
.sc-textarea.purple:focus{border-color:rgba(160,96,240,.55)}

/* transcript card */
.sc-transcript{background:rgba(245,184,76,.06);border:1px solid rgba(245,184,76,.2);border-radius:14px;padding:11px 14px;margin-bottom:10px;animation:slideUp .25s ease both}
.sc-transcript-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.sc-transcript-label{font-size:9px;font-family:var(--mono);color:var(--amber);letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:4px}
.sc-transcript-edit{font-size:10px;color:rgba(245,184,76,.5);background:none;border:none;cursor:pointer;font-family:var(--body);font-weight:600;transition:color .15s}
.sc-transcript-edit:hover{color:var(--amber)}
.sc-transcript-text{font-family:var(--body);font-size:13px;font-weight:600;color:rgba(255,255,255,.82);line-height:1.6}

/* world grid */
.sc-world-label{font-family:var(--heading);font-style:italic;font-size:15px;color:rgba(255,255,255,.65);text-align:center;margin-bottom:14px}
.sc-world-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.sc-world{height:72px;border-radius:14px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:all .2s}
.sc-world:hover{border-color:rgba(255,255,255,.18)}
.sc-world.on{background:rgba(160,96,240,.1);border-color:rgba(160,96,240,.55)}
.sc-world-emoji{font-size:22px}
.sc-world-name{font-size:11px;font-weight:600;color:var(--muted)}
.sc-world.on .sc-world-name{color:#c090ff}
.sc-world-back{font-size:11px;color:rgba(160,96,240,.5);background:none;border:none;cursor:pointer;font-family:var(--body);font-weight:600;margin-bottom:10px;transition:color .15s}
.sc-world-back:hover{color:var(--purple)}

/* detail chips */
.sc-detail-section{animation:slideUp .3s ease both}
.sc-detail-label{font-size:9px;font-family:var(--mono);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.sc-detail-chips{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.sc-detail-chip{padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);font-family:var(--heading);font-style:italic;font-size:12px;color:var(--muted);cursor:pointer;transition:all .2s;text-align:left}
.sc-detail-chip:hover{border-color:rgba(160,96,240,.25)}
.sc-detail-chip.on{background:rgba(160,96,240,.1);border-color:rgba(160,96,240,.35);color:#c090ff}

/* cast */
.sc-cast-label{font-size:9px;font-family:var(--mono);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;margin-top:18px}
.sc-cast-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.sc-cast-row::-webkit-scrollbar{display:none}
.sc-cast-pill{display:flex;align-items:center;gap:5px;padding:5px 10px 5px 7px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);cursor:pointer;transition:all .2s;flex-shrink:0;white-space:nowrap}
.sc-cast-pill:hover{border-color:rgba(255,255,255,.2)}
.sc-cast-pill.on{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.4)}
.sc-cast-pill.hero{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.4);cursor:default}
.sc-cast-pill.dim{opacity:.4;cursor:not-allowed}
.sc-cast-emoji{font-size:16px;line-height:1}
.sc-cast-name{font-family:var(--cta);font-size:11px;font-weight:600;color:var(--muted)}
.sc-cast-pill.on .sc-cast-name,.sc-cast-pill.hero .sc-cast-name{color:#F5B84C}

/* settings */
.sc-settings-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);cursor:pointer;transition:all .2s;margin-top:16px;margin-bottom:8px}
.sc-settings-trigger:hover{background:rgba(255,255,255,.05)}
.sc-settings-left{font-size:10px;font-family:var(--mono);color:var(--muted);letter-spacing:.05em}
.sc-settings-right{display:flex;align-items:center;gap:8px}
.sc-settings-badges{display:flex;gap:4px;flex-wrap:wrap}
.sc-settings-badge{font-size:9px;padding:2px 7px;border-radius:10px;background:rgba(245,184,76,.1);color:var(--amber);font-family:var(--mono);white-space:nowrap}
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
.sc-spill.on{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.4);color:#F5B84C}
.sc.create .sc-spill.on{background:rgba(20,216,144,.1);border-color:rgba(20,216,144,.4);color:#14d890}

/* CTA */
.sc-cta-wrap{position:fixed;bottom:0;left:0;right:0;padding:10px 5% calc(env(safe-area-inset-bottom,8px) + 12px);z-index:15;display:flex;justify-content:center}
.sc.ritual .sc-cta-wrap{background:linear-gradient(0deg,rgba(2,4,6,.98) 65%,transparent)}
.sc.create .sc-cta-wrap{background:linear-gradient(0deg,rgba(3,12,10,.98) 65%,transparent)}
.sc-cta{width:100%;max-width:540px;padding:16px;border:none;border-radius:16px;cursor:pointer;font-family:var(--cta);transition:all .2s;position:relative;overflow:hidden;text-align:center}
.sc-cta:hover{filter:brightness(1.1);transform:scale(1.02) translateY(-1px)}
.sc-cta:active{transform:scale(.97)}
.sc-cta:disabled{opacity:.35;cursor:not-allowed;transform:none;filter:none}
.sc-cta.amber{background:linear-gradient(145deg,#7a4a08,#F5B84C 48%,#7a4a08);color:#060200;box-shadow:0 10px 35px rgba(200,130,20,.45)}
.sc-cta.teal{background:linear-gradient(145deg,#0a7a50,#14d890 48%,#0a7a50);color:#020c08;box-shadow:0 10px 35px rgba(20,216,144,.35)}
.sc-cta.purple{background:linear-gradient(145deg,#5010a0,#c090ff 48%,#5010a0);color:#0a0020;box-shadow:0 10px 35px rgba(160,96,240,.38)}
.sc-cta-main{font-size:15px;font-weight:700;display:block}
.sc-cta-sub{font-size:10px;font-weight:500;opacity:.7;display:block;margin-top:2px}
.sc-cta::after{content:'';position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmer 3s ease-in-out infinite}
.sc-cta:disabled::after{display:none}

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

  const primaryChar = selectedCharacters[0] ?? selectedCharacter ?? null;
  const childName = primaryChar?.name ?? 'friend';
  const defaultLevel = ageDescToLevel(primaryChar?.ageDescription);

  // ── Data ──
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [creature, setCreature] = useState<HatchedCreature | null>(companionCreature);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [chars, creatures] = await Promise.all([
        getCharacters(user.id),
        primaryChar
          ? getHatchedCreatures(user.id, primaryChar.id)
          : getAllHatchedCreatures(user.id),
      ]);

      if (cancelled) return;

      // Filter to family first; fall back to all
      const family = chars.filter(c => c.isFamily);
      setCharacters(family.length > 0 ? family : chars);

      // Creature for this child, fallback to companion from context
      if (creatures.length > 0) {
        setCreature(creatures[0]);
      } else if (!creature && companionCreature) {
        setCreature(companionCreature);
      } else if (!creature) {
        // Last resort: try all creatures
        const all = await getAllHatchedCreatures(user.id);
        if (!cancelled && all.length > 0) setCreature(all[0]);
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, primaryChar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ritual entry card selection (3-card picker shown before input) ──
  const [ritualEntryDone, setRitualEntryDone] = useState(!isRitual);

  // ── Mode & input state ──
  const [mode, setMode] = useState<'today' | 'adventure'>('today');
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

  // Detect speech API availability
  const hasSpeechAPI = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // ── Star field ──
  useEffect(() => {
    const container = document.getElementById('sc-stars');
    if (!container) return;
    container.innerHTML = '';
    const colours = ['#fff8e0','#e8d8ff','#d0f0e8','#c8e8ff','#ffffff'];
    const count = isRitual ? 55 : 40;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      const sz = Math.random() < .28 ? 2.2 : Math.random() < .6 ? 1.4 : .7;
      const dur = isRitual ? (2.8 + Math.random() * 4).toFixed(1) : (1.8 + Math.random() * 2.5).toFixed(1);
      const delay = (Math.random() * 5).toFixed(1);
      s.style.cssText = ['position:absolute','border-radius:50%',`width:${sz}px`,`height:${sz}px`,`left:${(Math.random()*100).toFixed(1)}%`,`top:${(Math.random()*72).toFixed(1)}%`,`background:${colours[i % colours.length]}`,`animation:twinkle ${dur}s -${delay}s ease-in-out infinite`,'pointer-events:none'].join(';');
      container.appendChild(s);
    }
  }, [isRitual]);

  // ── Inspiration & occasion derived values ──
  const questionBank = entryMode === 'ritual' ? RITUAL_QUESTIONS : CREATE_QUESTIONS;
  const currentQuestion = questionBank[questionIndex % questionBank.length];
  const hasContent = (transcript.trim().length > 3) || (brief.trim().length > 3);
  const showInspiration = !hasContent;
  const showOccasionTag = hasContent && !occasionDismissed;

  const shuffleQuestion = () => setQuestionIndex(i => i + 1);
  const useQuestion = () => { setBrief(currentQuestion); setTranscript(''); };

  const renderInspoQuestion = (q: string): ReactNode => {
    const accentColor = entryMode === 'ritual' ? '#F5B84C' : '#14d890';
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
  const switchMode = useCallback((m: 'today' | 'adventure') => {
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
    if (isListening) { srRef.current?.stop(); setIsListening(false); }
  }, [isListening]);

  // ── Vibe inference (debounced, only when not manual) ──
  const vibeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (manualVibe) return;
    clearTimeout(vibeTimerRef.current);
    const text = mode === 'today' ? (transcript || brief) : adventureDetail;
    if (!text.trim()) { setVibe('calm-cosy'); return; }
    vibeTimerRef.current = setTimeout(() => {
      setVibe(inferVibe(text));
    }, 300);
    return () => clearTimeout(vibeTimerRef.current);
  }, [brief, transcript, adventureDetail, mode, manualVibe]);

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

  // ── Creature display ──
  const cName = creature?.name ?? 'Moonbeam';
  const cEmoji = creature?.creatureEmoji ?? '\u{1F319}';
  const cType = creature?.creatureType ?? '';
  const creatureColor = creature?.color || '#F5B84C';

  // Resolve DreamKeeper image (if available) — same cascade as MySpace
  const cDk = creature
    ? (getDreamKeeperById(creature.creatureType)
       || V1_DREAMKEEPERS.find(dk => dk.emoji === creature.creatureEmoji)
       || null)
    : null;
  const cImageSrc = cDk?.imageSrc;

  // Choose glow class based on mode/color
  const glowClass = isRitual ? 'sc-creature-glow'
    : mode === 'adventure' ? 'sc-creature-glow-purple'
    : creatureColor.toLowerCase().includes('60c8') || creatureColor.toLowerCase().includes('14d8') ? 'sc-creature-glow-teal'
    : 'sc-creature-glow';

  // ── Bubble text ──
  const renderBubbleText = (): ReactNode => {
    const amber = (text: string) => (
      <em style={{ color: '#F5B84C', fontStyle: 'normal', fontWeight: 700 }}>{text}</em>
    );

    if (isListening) return <>I&apos;m listening&hellip; {'\u{1F399}\uFE0F'}</>;

    if (mode === 'today') {
      const hasAny = transcript.trim() || brief.trim();
      if (!hasAny) return (
        <>{childName ? <>{amber(childName)}! </> : null}What happened today worth putting in a story? Could be {amber('anything')} &mdash; big, small, silly, or strange. {'\u{1F319}'}</>
      );
      const words = (transcript || brief).trim().split(/\s+/).slice(0, 4).join(' ');
      return <>Got it! {amber(words + '\u2026')} Ready when you are. {'\u2728'}</>;
    }

    // adventure mode
    if (!worldChoice) return (
      <>Forget today! {amber('Where should we go')} tonight? Pick a world and I&apos;ll write us in. {'\u{1F680}'}</>
    );

    const worldLabel = worldChoice === 'custom'
      ? customWorld || 'your world'
      : WORLDS.find(w => w.key === worldChoice)?.label || worldChoice;

    return <>A story set in {amber(worldLabel)}! Give me one {amber('weird detail')} and we&apos;re off. {'\u2728'}</>;
  };

  // ── Cast helpers ──
  const isHero = (c: Character) => c.id === primaryChar?.id;
  const isInCast = (id: string) => selectedCast.some(c => c.id === id);
  const castCount = selectedCast.length + (creatureSelected && creature ? 1 : 0);
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
  };

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

    // Add creature to chars if selected
    if (creatureSelected && creature) {
      castChars.push({
        type: 'creature',
        name: creature.name,
        note: creature.dreamAnswer
          ? `${creature.name} dreams about ${creature.dreamAnswer}`
          : `${creature.name} is the child's magical companion`,
      });
    }

    // Build brief
    const finalBrief = mode === 'today'
      ? (transcript.trim() || brief.trim() || VIBE_BRIEF[vibe] || 'about to go on an adventure')
      : `Adventure in ${worldChoice === 'custom' ? customWorld : WORLDS.find(w => w.key === worldChoice)?.label || worldChoice}. ${adventureDetail}`.trim();

    const finalVibe = vibe || inferVibe(finalBrief);

    const choices: BuilderChoices = {
      path: mode === 'today' ? 'ritual' : 'free',
      heroName: heroChar?.name || '',
      heroGender: heroChar?.pronouns === 'he/him' ? 'boy'
        : heroChar?.pronouns === 'she/her' ? 'girl' : '',
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
    };

    setSelectedCharacter(heroChar || null);
    setCompanionCreature(creature);
    onGenerate(choices);
  };

  // ── CTA state ──
  const ctaDisabled = mode === 'today'
    ? brief.trim().length < 4 && transcript.trim().length < 4
    : !worldChoice && adventureDetail.trim().length < 4;

  const ctaLabel = isRitual
    ? '\u2726 Write tonight\u2019s story'
    : (mode === 'today' ? 'Let\u2019s make a story! \u2192' : '\u{1F680} Begin the adventure!');
  const ctaColor = isRitual
    ? 'amber'
    : (mode === 'today' ? 'teal' : 'purple');
  const ctaSub = isRitual
    ? `${cName} has been waiting`
    : `${cName} is ready`;

  // ── Settings summary ──
  const summary = settingsSummary(style, length, vibe, level);

  // ── Available detail chips ──
  const detailChips = WORLD_DETAILS[worldChoice] || WORLD_DETAILS.custom;

  // ── Other characters for cast (not the hero) ──
  const otherChars = characters.filter(c => c.id !== primaryChar?.id);

  return (
    <div className={`sc ${isRitual ? 'ritual' : 'create'}`}>
      <style>{CSS}</style>
      <div id="sc-stars" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} />

      {/* ─── NAV ─── */}
      <nav className="sc-nav">
        <div className="sc-logo">
          <div className="sc-logo-moon" />
          SleepSeed
        </div>
        <button className="sc-close" onClick={onBack}>{'\u2715'}</button>
      </nav>

      <div className="sc-inner">

        {/* ─── NIGHT BADGE (ritual only) ─── */}
        {isRitual && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '4px 0 8px',
            animation: 'slideUp .3s ease both',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(245,184,76,.08)',
              border: '1px solid rgba(245,184,76,.18)',
              borderRadius: 20,
              padding: '4px 14px',
            }}>
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#F5B84C',
                animation: 'shimmer 2s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: '.1em',
                textTransform: 'uppercase' as const,
                color: 'rgba(245,184,76,.65)',
              }}>
                {cName} is ready
              </span>
            </div>
          </div>
        )}

        {/* ─── CREATURE ZONE ─── */}
        {isRitual ? (
          <div className="sc-creature">
            {isRitual && (
              <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,76,.1), transparent 70%)', top: -40, left: '50%', transform: 'translateX(-50%)', animation: 'pulse 5s ease-in-out infinite', pointerEvents: 'none' as const, zIndex: 0 }} />
            )}
            {loading ? (
              <div className="sc-egg">{'\u{1F95A}'}</div>
            ) : (
              <>
                {cImageSrc ? (
                  <div style={{ width: 120, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floatCreature 4.5s ease-in-out infinite', position: 'relative' as const, zIndex: 1 }}>
                    <img src={cImageSrc} alt={cName} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(245,184,76,.3))' }} />
                  </div>
                ) : (
                  <div className="sc-creature-emoji" style={{ animation: 'floatCreature 4.5s ease-in-out infinite, glowAmber 4s ease-in-out infinite', position: 'relative' as const, zIndex: 1 }}>{cEmoji}</div>
                )}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'rgba(245,184,76,.55)', marginTop: 4, textAlign: 'center' as const }}>{cName}</div>
                {cType && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.2)', marginTop: 2, textAlign: 'center' as const }}>
                    {cType.charAt(0).toUpperCase() + cType.slice(1).replace(/-/g, ' ')}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="sc-creature create-creature">
            {loading ? (
              <div className="sc-egg" style={{ fontSize: 36 }}>{'\u{1F95A}'}</div>
            ) : (
              <>
                {cImageSrc ? (
                  <div style={{ width: 52, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'floatCreature 3.5s ease-in-out infinite' }}>
                    <img src={cImageSrc} alt={cName} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(20,216,144,.3))' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 42, animation: 'floatCreature 3.5s ease-in-out infinite, glowTeal 3s ease-in-out infinite', display: 'inline-block' }}>{cEmoji}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: 'var(--cream)', lineHeight: 1.3 }}>
                    What kind of story{' '}
                    <em style={{ color: '#14d890', fontStyle: 'italic' }}>tonight?</em>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(20,216,144,.4)', marginTop: 3 }}>
                    {cName} {'\u00B7'} ready to write
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── RITUAL 3-CARD ENTRY (ritual mode, before input) ─── */}
        {isRitual && !ritualEntryDone && (
          <div style={{ animation: 'slideUp .35s ease both', padding: '8px 0 0' }}>
            {/* DreamKeeper message */}
            <div className="sc-bubble" style={{ borderColor: 'rgba(245,184,76,.2)', background: 'rgba(245,184,76,.04)', opacity: 1, animation: 'bubblePop .35s ease forwards', marginBottom: 18 }}>
              <div className="sc-bubble-text">
                What story will we create <em style={{ color: '#F5B84C', fontStyle: 'normal', fontWeight: 700 }}>together</em> tonight?
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Card 1: Tell me about today */}
              <button onClick={() => { setMode('today'); setRitualEntryDone(true); }} style={{
                width: '100%', padding: '18px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                border: '1.5px solid rgba(245,184,76,.2)', background: 'rgba(245,184,76,.06)',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
                fontFamily: "'Nunito',system-ui,sans-serif",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,184,76,.4)'; e.currentTarget.style.background = 'rgba(245,184,76,.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,184,76,.2)'; e.currentTarget.style.background = 'rgba(245,184,76,.06)'; }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{'\u2600\uFE0F'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 600, color: '#F4EFE8', marginBottom: 2 }}>Tell me about today</div>
                  <div style={{ fontSize: 11, color: 'rgba(244,239,232,.4)' }}>Turn something real into tonight's story</div>
                </div>
              </button>

              {/* Card 2: Let's go somewhere */}
              <button onClick={() => { setMode('adventure'); setRitualEntryDone(true); }} style={{
                width: '100%', padding: '18px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                border: '1.5px solid rgba(160,96,240,.2)', background: 'rgba(160,96,240,.06)',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
                fontFamily: "'Nunito',system-ui,sans-serif", position: 'relative',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(160,96,240,.4)'; e.currentTarget.style.background = 'rgba(160,96,240,.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(160,96,240,.2)'; e.currentTarget.style.background = 'rgba(160,96,240,.06)'; }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{'\u{1F680}'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 600, color: '#F4EFE8', marginBottom: 2 }}>Let's go somewhere</div>
                  <div style={{ fontSize: 11, color: 'rgba(244,239,232,.4)' }}>Pick a world for tonight's adventure</div>
                </div>
              </button>

              {/* Card 3: Surprise me */}
              <button onClick={() => {
                setMode('today');
                setBrief(`${cName} picks everything tonight — a surprise adventure just for ${childName}.`);
                setRitualEntryDone(true);
                // Auto-generate after a brief moment
                setTimeout(() => {
                  const heroChar = primaryChar;
                  const castChars: { type: string; name: string; note: string }[] = [];
                  if (creatureSelected && creature) {
                    castChars.push({ type: 'creature', name: creature.name, note: creature.dreamAnswer ? `${creature.name} dreams about ${creature.dreamAnswer}` : `${creature.name} is the child's magical companion` });
                  }
                  onGenerate({
                    path: 'ritual', heroName: heroChar?.name || '', heroGender: heroChar?.pronouns === 'he/him' ? 'boy' : heroChar?.pronouns === 'she/her' ? 'girl' : '',
                    vibe: ['warm-funny', 'calm-cosy', 'exciting', 'heartfelt', 'mysterious'][Math.floor(Math.random() * 5)],
                    level, length, brief: `${cName} picks everything tonight — a surprise adventure just for ${childName}.`,
                    chars: castChars, lessons: [], occasion: '', occasionCustom: '', style: 'standard', pace: 'normal',
                  });
                }, 400);
              }} style={{
                width: '100%', padding: '18px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                border: '1.5px solid rgba(111,231,221,.15)', background: 'rgba(111,231,221,.04)',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
                fontFamily: "'Nunito',system-ui,sans-serif",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(111,231,221,.35)'; e.currentTarget.style.background = 'rgba(111,231,221,.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(111,231,221,.15)'; e.currentTarget.style.background = 'rgba(111,231,221,.04)'; }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{'\u{1F3B2}'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 600, color: '#F4EFE8', marginBottom: 2 }}>Surprise me</div>
                  <div style={{ fontSize: 11, color: 'rgba(244,239,232,.4)' }}>{cName} picks everything tonight</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ─── SPEECH BUBBLE (ritual only, after entry selection) ─── */}
        {isRitual && ritualEntryDone && (
          <div className="sc-bubble" style={{ borderColor: 'rgba(245,184,76,.2)', background: 'rgba(245,184,76,.04)', opacity: 1, animation: 'bubblePop .35s ease forwards' }}>
            <div className="sc-bubble-text">{renderBubbleText()}</div>
          </div>
        )}

        {/* ─── MODE TOGGLE (create only) ─── */}
        {!isRitual && (
          <div className="sc-mode">
            <button
              className={`sc-mode-btn${mode === 'today' ? ' today-on' : ''}`}
              onClick={() => switchMode('today')}
            >
              {'\u2600\uFE0F'} My Day
            </button>
            <button
              className={`sc-mode-btn${mode === 'adventure' ? ' adv-on' : ''}`}
              onClick={() => switchMode('adventure')}
            >
              {'\u2728'} Adventure
            </button>
          </div>
        )}

        {/* ═══ MY DAY INPUT ZONE ═══ */}
        {mode === 'today' && (!isRitual || ritualEntryDone) && (
          <div style={{ animation: 'slideUp .25s ease both' }}>
            {/* Inspiration card */}
            {showInspiration && (
              <div style={{
                background: entryMode === 'ritual'
                  ? 'rgba(245,184,76,.05)'
                  : 'rgba(20,216,144,.04)',
                border: `1px solid ${entryMode === 'ritual'
                  ? 'rgba(245,184,76,.15)'
                  : 'rgba(20,216,144,.14)'}`,
                borderRadius: 14,
                padding: '11px 13px',
                flexShrink: 0,
                animation: 'slideUp .3s ease-out',
                marginBottom: 14,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 8,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase' as const,
                    color: entryMode === 'ritual'
                      ? 'rgba(245,184,76,.45)'
                      : 'rgba(20,216,144,.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    {entryMode === 'ritual' ? '\u2726' : '\u2728'}{' '}
                    Need some inspiration?
                  </div>
                  <button
                    onClick={shuffleQuestion}
                    style={{
                      fontFamily: "'Baloo 2', cursive",
                      fontSize: 10,
                      fontWeight: 700,
                      color: entryMode === 'ritual'
                        ? 'rgba(245,184,76,.4)'
                        : 'rgba(20,216,144,.4)',
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
                    fontFamily: "'Baloo 2', cursive",
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
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  letterSpacing: '.04em',
                  color: entryMode === 'ritual'
                    ? 'rgba(245,184,76,.3)'
                    : 'rgba(20,216,144,.3)',
                }}>
                  {'\u2191'} tap to use {'\u00B7'} {'\u{1F500}'} to see another
                </div>
              </div>
            )}

            {/* Voice button */}
            {hasSpeechAPI && (
              <button
                className={`sc-voice${isListening ? ' rec' : ''}${!isRitual ? ' teal' : ''}`}
                onClick={toggleVoice}
              >
                <span className="sc-voice-icon">{'\u{1F399}\uFE0F'}</span>
                <span className="sc-voice-text">
                  {isListening
                    ? 'Listening\u2026 tap to stop'
                    : isRitual
                      ? `Tell ${cName} out loud`
                      : 'Tap to answer out loud'
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
                    <span className="sc-or-text">
                      {isRitual ? 'or write it down' : 'or type it'}
                    </span>
                    <div className="sc-or-line" />
                  </div>
                )}
                <textarea
                  className={`sc-textarea${!isRitual ? ' teal' : ''}`}
                  rows={2}
                  value={brief}
                  onChange={e => { setBrief(e.target.value); setTranscript(''); }}
                  placeholder="We found a really fat frog under the plant pot\u2026"
                />
              </>
            )}
          </div>
        )}

        {/* ═══ ADVENTURE INPUT ZONE ═══ */}
        {mode === 'adventure' && (!isRitual || ritualEntryDone) && (
          <div style={{ animation: 'slideUp .25s ease both' }}>
            {!showCustomWorldInput ? (
              <>
                <div className="sc-world-label">Where do we go tonight?</div>
                <div className="sc-world-grid">
                  {WORLDS.map(w => (
                    <div
                      key={w.key}
                      className={`sc-world${worldChoice === w.key ? ' on' : ''}`}
                      onClick={() => selectWorld(w.key)}
                    >
                      <span className="sc-world-emoji">{w.emoji}</span>
                      <span className="sc-world-name">{w.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button className="sc-world-back" onClick={() => { setShowCustomWorldInput(false); setWorldChoice(''); setCustomWorld(''); }}>
                  {'\u2190'} choose a world
                </button>
                <textarea
                  className="sc-textarea purple"
                  rows={2}
                  value={customWorld}
                  onChange={e => setCustomWorld(e.target.value)}
                  placeholder="A world where everything is tiny\u2026"
                  autoFocus
                />
              </>
            )}

            {/* Wild detail — after world selected */}
            {worldChoice && (worldChoice !== 'custom' || customWorld.trim()) && (
              <div className="sc-detail-section">
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
                  placeholder="The spaceship smells like dad's old car\u2026"
                />
              </div>
            )}
          </div>
        )}

        {/* ═══ OCCASION TAG ═══ */}
        {showOccasionTag && (
          <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 6,
            animation: 'slideUp .3s ease-out',
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
                fontFamily: "'DM Mono', monospace",
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
                  fontFamily: "'DM Mono', monospace",
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
                const activeColor = entryMode === 'ritual'
                  ? 'rgba(245,184,76,'
                  : 'rgba(20,216,144,';
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
                        ? `1px solid ${activeColor}.38)`
                        : '1px solid rgba(255,255,255,.1)',
                      background: isSelected
                        ? `${activeColor}.1)`
                        : 'rgba(255,255,255,.04)',
                      color: isSelected
                        ? (entryMode === 'ritual' ? '#F5B84C' : '#14d890')
                        : 'rgba(255,255,255,.42)',
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

        {/* ═══ CAST SECTION ═══ */}
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

          {/* Creature pill */}
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

        {/* ═══ COLLAPSED OPTIONS ═══ */}
        <div
          className="sc-settings-trigger"
          onClick={() => setSettingsOpen(prev => !prev)}
          style={!isRitual ? { borderColor: 'rgba(20,216,144,.12)' } : undefined}
        >
          <span className="sc-settings-left">Story options</span>
          <div className="sc-settings-right">
            {summary && !settingsOpen && (
              <div className="sc-settings-badges">
                {summary.split(' \u00B7 ').map(s => (
                  <span
                    key={s}
                    className="sc-settings-badge"
                    style={!isRitual ? {
                      background: 'rgba(20,216,144,.08)',
                      border: '1px solid rgba(20,216,144,.2)',
                      color: 'rgba(20,216,144,.75)',
                    } : undefined}
                  >{s}</span>
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

      </div>

      {/* ─── CTA (hidden during ritual entry card selection) ─── */}
      {(!isRitual || ritualEntryDone) && (
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
