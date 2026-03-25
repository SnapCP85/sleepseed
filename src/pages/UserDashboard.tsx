import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../AppContext';
import type { SavedNightCard, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, createEgg, getAllHatchedCreatures } from '../lib/hatchery';
import { CREATURES, getCreature } from '../lib/creatures';
import { getCharacters, getNightCards, getStories } from '../lib/storage';

// ── helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: Date) { return d.toISOString().split('T')[0]; }

function hexToRgba(hex: string, a: number): string {
  const c = hex.replace('#','');
  if(c.length !== 6) return `rgba(100,100,180,${a})`;
  const r = parseInt(c.slice(0,2),16);
  const g = parseInt(c.slice(2,4),16);
  const b = parseInt(c.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function cardBelongsTo(card: SavedNightCard, charId: string) {
  return card.characterIds && card.characterIds.includes(charId);
}

function calculateGlow(cards: SavedNightCard[], charId: string): number {
  const dates = new Set(cards.filter(c=>cardBelongsTo(c,charId)).map(c=>c.date.split('T')[0]));
  let streak=0;
  const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<365;i++){
    if(dates.has(dateStr(d))){ streak++; d.setDate(d.getDate()-1); }
    else if(i===0){ d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

type NightState='complete'|'missed'|'tonight'|'future';
interface WeekNight{label:string;date:Date;state:NightState;card?:SavedNightCard}

function getWeekNights(cards: SavedNightCard[], charId: string): WeekNight[] {
  const today=new Date(); today.setHours(0,0,0,0);
  const dow=today.getDay();
  const mon=new Date(today); mon.setDate(today.getDate()-(dow===0?6:dow-1));
  const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return Array.from({length:7},(_,i)=>{
    const d=new Date(mon); d.setDate(mon.getDate()+i);
    const ds=dateStr(d);
    const card=cards.find(c=>cardBelongsTo(c,charId)&&c.date.split('T')[0]===ds);
    const isToday=ds===dateStr(today); const isPast=d<today;
    let state:NightState='future';
    if(isToday) state=card?'complete':'tonight';
    else if(isPast) state=card?'complete':'missed';
    return {label:labels[i],date:d,state,card};
  });
}

function getLastYearCard(cards: SavedNightCard[], charId: string): SavedNightCard|null {
  const ly=new Date(); ly.setFullYear(ly.getFullYear()-1);
  return cards.find(c=>cardBelongsTo(c,charId)&&c.date.split('T')[0]===dateStr(ly))??null;
}

function buildPromptText(sel: Character[]): string {
  if(!sel.length) return "What happened in your child's world today?";
  if(sel.length===1) return `What happened in ${sel[0].name}'s world today?`;
  if(sel.length===2) return `What happened in ${sel[0].name} & ${sel[1].name}'s world today?`;
  const last=sel[sel.length-1];
  return `What happened in ${sel.slice(0,-1).map(c=>c.name).join(', ')} & ${last.name}'s world today?`;
}

const CONSTELLATIONS=[
  'the little fox','the sleeping bear','the river otter','the wandering star',
  'the firefly cloud','the gentle whale','the winter hare','the dreaming owl',
  'the silver deer','the hidden comet','the morning dove','the ancient turtle',
];

function constellationName(weekNum: number): string {
  return CONSTELLATIONS[weekNum % CONSTELLATIONS.length];
}

function shardColour(card: SavedNightCard | null): string {
  if (!card) return 'rgba(245,184,76,.5)';
  const vibe = (card as any).vibe || '';
  if (vibe === 'warm-funny' || vibe === 'silly') return '#FFD060';
  if (vibe === 'exciting' || vibe === 'adventure') return '#60C8FF';
  if (vibe === 'heartfelt' || vibe === 'calm-cosy') return '#F5B84C';
  if (vibe === 'mysterious') return '#C090FF';
  return '#F5B84C';
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,700&family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --teal:#1D9E75;--teal2:#5DCAA5;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Fraunces',Georgia,serif;
  --sans:'Nunito',system-ui,sans-serif;
  --cta:'Baloo 2',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.dash{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:80px}
@keyframes twk{0%,100%{opacity:.15}50%{opacity:.85}}
@keyframes twk2{0%,100%{opacity:.35}60%{opacity:.1}}
@keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pring{0%,100%{box-shadow:0 0 0 2px rgba(232,151,42,.55)}50%{box-shadow:0 0 0 8px rgba(232,151,42,0)}}
@keyframes pring-t{0%,100%{box-shadow:0 0 0 2px rgba(29,158,117,.55)}50%{box-shadow:0 0 0 8px rgba(29,158,117,0)}}
@keyframes pglow{0%,100%{box-shadow:0 0 6px rgba(176,120,8,.3)}50%{box-shadow:0 0 16px rgba(176,120,8,.75),0 0 28px rgba(176,120,8,.2)}}
@keyframes done-ring{0%,100%{box-shadow:0 0 0 3px rgba(176,120,8,.6),0 0 20px rgba(176,120,8,.3)}50%{box-shadow:0 0 0 7px rgba(176,120,8,0),0 0 28px rgba(176,120,8,.5)}}
@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}
@keyframes shoot{0%{opacity:.9;width:60px}100%{transform:translate(100px,50px) rotate(18deg);opacity:0;width:2px}}
@keyframes miss-fade{0%{opacity:0;transform:translateY(-4px)}15%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
@keyframes starPulse{0%,100%{opacity:.5}50%{opacity:.9}}
@keyframes nextPulse{0%,100%{opacity:.15}50%{opacity:.35}}
@keyframes hatchBurst{0%{transform:scale(1)}30%{transform:scale(1.15) rotate(3deg)}60%{transform:scale(1.08) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
@keyframes eggRock{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
@keyframes eggGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(245,184,76,.2))}50%{filter:drop-shadow(0 0 22px rgba(245,184,76,.55))}}

@keyframes gA{0%,100%{filter:drop-shadow(0 0 14px rgba(245,184,76,.5))}50%{filter:drop-shadow(0 0 40px rgba(245,184,76,1))}}
@keyframes gT{0%,100%{filter:drop-shadow(0 0 12px rgba(20,216,144,.45))}50%{filter:drop-shadow(0 0 38px rgba(20,216,144,.95))}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes zzz{0%{opacity:0;transform:translate(0,0) scale(.45)}35%{opacity:.78}100%{opacity:0;transform:translate(12px,-20px) scale(1.25)}}
@keyframes cel{0%{transform:scale(0) rotate(-20deg);opacity:0}55%{transform:scale(1.14) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes progFill{from{width:0}to{width:var(--pw)}}
@keyframes au{0%,100%{opacity:.07;transform:translateX(-50%) scale(1)}50%{opacity:.24;transform:translateX(-50%) scale(1.08)}}

.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;border-radius:50%;background:#fff;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.dash-star2{position:absolute;border-radius:50%;background:#E8D8FF;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.dash-star3{position:absolute;border-radius:50%;background:#fde68a;animation:twk var(--d,2.5s) var(--dl,0s) ease-in-out infinite}
.dash-shoot{position:absolute;height:1.5px;border-radius:1px;pointer-events:none;opacity:0}
@keyframes shoot1{0%{opacity:.9;width:70px;transform:translate(0,0) rotate(22deg)}100%{opacity:0;width:2px;transform:translate(120px,55px) rotate(22deg)}}
@keyframes shoot2{0%{opacity:.8;width:55px;transform:translate(0,0) rotate(-15deg)}100%{opacity:0;width:2px;transform:translate(-90px,70px) rotate(-15deg)}}
@keyframes shoot3{0%{opacity:.85;width:60px;transform:translate(0,0) rotate(35deg)}100%{opacity:0;width:2px;transform:translate(100px,80px) rotate(35deg)}}
.dash-shoot1{background:linear-gradient(90deg,#F5B84C,#fde68a,transparent);animation:shoot1 2.5s ease-out infinite;animation-delay:4s;top:12%;left:15%}
.dash-shoot2{background:linear-gradient(90deg,#b48cff,#E8D8FF,transparent);animation:shoot2 3s ease-out infinite;animation-delay:11s;top:8%;right:10%}
.dash-shoot3{background:linear-gradient(90deg,#5DCAA5,#80FFD0,transparent);animation:shoot3 2.8s ease-out infinite;animation-delay:18s;top:22%;left:55%}
.dash-sky{position:fixed;top:0;left:0;right:0;height:300px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}
.dash-moon-pos{position:fixed;top:68px;right:24px;z-index:2;pointer-events:none}
.dash-moon-glow{position:absolute;width:52px;height:52px;border-radius:50%;background:rgba(245,184,76,.07);top:-9px;left:-9px}
.dash-moon{width:32px;height:32px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden}
.dash-moon-sh{position:absolute;width:31px;height:31px;border-radius:50%;background:#050916;top:-5px;left:-8px}

/* ── TOP NAV ── */
.dash-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:56px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.dash-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:7px;flex-shrink:0}
.dash-logo-moon{width:15px;height:15px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;flex-shrink:0}
.dash-logo-moon-sh{position:absolute;width:14px;height:14px;border-radius:50%;background:#050916;top:-3px;left:-6px}
.dash-nav-tabs{display:flex;align-items:center;gap:2px}
.dash-ntab{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:5px 7px;border-radius:10px;transition:background .18s;min-width:40px}
.dash-ntab:hover{background:rgba(255,255,255,.04)}
.dash-ntab.on{background:rgba(232,151,42,.08)}
.dash-ntab-ico{width:20px;height:20px;flex-shrink:0}
.dash-ntab-lbl{font-size:7.5px;font-weight:500;letter-spacing:.02em;font-family:var(--mono)}
.dash-ntab.on .dash-ntab-lbl{color:var(--amber)}
.dash-ntab:not(.on) .dash-ntab-lbl{color:rgba(255,255,255,.18)}

/* ── SKELETON ── */
.dash-skel{background:rgba(255,255,255,.04);border-radius:8px;animation:shimmer 1.5s ease-in-out infinite}

/* ── CONTENT ── */
.dash-inner{max-width:860px;margin:0 auto;padding:0 5% 24px;position:relative;z-index:5}
.dash-greet-row{display:flex;align-items:baseline;justify-content:space-between;padding-top:20px;margin-bottom:14px;flex-wrap:wrap;gap:5px}
.dash-greet{font-family:var(--serif);font-size:clamp(19px,3.2vw,28px);font-weight:700;color:var(--cream);letter-spacing:-.02em;line-height:1.2}
.dash-greet em{font-style:italic;color:var(--amber2)}
.dash-greet em.done{color:var(--teal2)}
.dash-date{font-size:9.5px;color:rgba(244,239,232,.18);font-family:var(--mono)}

/* guest */
.dash-guest{background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.13);border-radius:12px;padding:11px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.dash-guest-t{font-size:12px;color:rgba(244,239,232,.5);font-weight:300;line-height:1.5}
.dash-guest-t strong{color:rgba(232,151,42,.85);font-weight:600}
.dash-guest-btn{background:rgba(232,151,42,.11);border:1px solid rgba(232,151,42,.24);color:var(--amber2);border-radius:50px;padding:6px 16px;font-size:11.5px;font-weight:500;cursor:pointer;font-family:var(--sans);white-space:nowrap;flex-shrink:0}

/* ── CHARACTER PODS ── */
.dash-pods{display:flex;gap:8px;padding:0 0 6px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.dash-pod{flex:0 0 auto;min-width:80px;max-width:140px;border-radius:20px;padding:10px 10px 9px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;border:2px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);transition:all .28s;position:relative;overflow:hidden}
.dash-pod.on{transform:scale(1.05);box-shadow:0 0 20px var(--pod-shadow,rgba(245,184,76,.2)),0 0 0 1px var(--pod-inset,rgba(245,184,76,.1)) inset}
.dash-pod-emoji{font-size:32px;line-height:1;transition:all .25s}
.dash-pod.on .dash-pod-emoji{filter:drop-shadow(0 0 11px var(--pod-shadow,rgba(245,184,76,.4)));animation:flt 3.5s ease-in-out infinite}
.dash-pod-name{font-size:12px;font-weight:800;color:rgba(255,255,255,.5);transition:color .25s}
.dash-pod.on .dash-pod-name{color:var(--pod-name,#FFE080)}

/* ── EMPTY WELCOME ── */
.dash-empty-cta{background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.12);border-radius:15px;padding:18px 20px;margin-bottom:14px}
.dash-empty-h{font-family:var(--serif);font-size:17px;color:var(--cream);margin-bottom:6px;font-style:italic}
.dash-empty-sub{font-size:12.5px;color:rgba(244,239,232,.38);margin-bottom:13px;line-height:1.65;font-weight:300}
.dash-empty-btn{background:var(--amber);border:none;border-radius:50px;padding:10px 22px;font-size:13px;font-weight:600;color:#120800;cursor:pointer;font-family:inherit}

/* ── LAST YEAR ── */
.dash-ly{background:rgba(10,12,24,.97);border:.5px solid rgba(255,255,255,.05);border-left:2.5px solid var(--amber);border-radius:0 10px 10px 0;padding:8px 13px;display:flex;align-items:flex-start;gap:8px;margin-bottom:11px;cursor:pointer;transition:background .18s}
.dash-ly:hover{background:rgba(14,16,30,.97)}
.dash-ly-ico{font-size:10px;color:var(--amber);flex-shrink:0;margin-top:1px}
.dash-ly-text{font-size:10.5px;color:var(--dim);line-height:1.6}
.dash-ly-text em{color:var(--amber2);font-style:italic}

/* ── U-BTN (kept for guest) ── */
.dash-u-btn{width:100%;padding:18px 20px;border:none;border-radius:17px;cursor:pointer;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;transition:transform .18s,filter .2s;box-shadow:0 1px 0 rgba(255,255,255,.18) inset}
.dash-u-btn:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.1)}
.dash-u-btn:active{transform:scale(.97)}
.dash-u-btn:disabled{opacity:.4;cursor:default;transform:none;filter:none}
.dash-u-btn::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.8s ease-in-out infinite}
.dash-u-btn-ico{font-size:28px;flex-shrink:0;position:relative;z-index:1}
.dash-u-btn-texts{flex:1;text-align:left;position:relative;z-index:1}
.dash-u-btn-title{font-size:18px;font-weight:800;display:block;line-height:1.18;margin-bottom:1px}
.dash-u-btn-sub{font-size:10px;font-weight:700;display:block;opacity:.5}
.dash-u-btn-arr{font-size:24px;flex-shrink:0;position:relative;z-index:1;opacity:.38}

/* ── NC MODAL ── */
.dash-nc-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px);animation:fadein .18s ease}
.dash-nc-modal{background:#0F1328;border:1px solid rgba(255,255,255,.07);border-radius:18px;max-width:380px;width:100%;overflow:hidden;animation:fadein .18s ease}
.dash-nc-modal-top{background:linear-gradient(135deg,#C49018,#A87010);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.dash-nc-modal-lbl{font-size:8.5px;font-weight:600;color:#0A0600;letter-spacing:.07em;text-transform:uppercase}
.dash-nc-modal-date{font-size:8.5px;color:rgba(10,6,0,.5);font-family:var(--mono)}
.dash-nc-modal-close{background:none;border:none;font-size:20px;color:rgba(10,6,0,.4);cursor:pointer;line-height:1;padding:0 2px}
.dash-nc-modal-body{padding:15px 17px}
.dash-nc-modal-fl{font-size:8px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;font-weight:500}
.dash-nc-modal-fv{font-size:13px;color:var(--dim);line-height:1.65;font-style:italic;margin-bottom:12px}
.dash-nc-modal-q{font-size:13px;color:var(--amber2);font-family:var(--serif);font-style:italic;margin-bottom:4px}
.dash-nc-modal-a{font-size:13px;color:var(--cream);line-height:1.6}

.dash-miss-tooltip{position:absolute;bottom:46px;left:50%;transform:translateX(-50%);background:#0F1328;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:5px 9px;font-size:8.5px;color:var(--dim);white-space:nowrap;font-style:italic;z-index:20;pointer-events:none;animation:miss-fade 2.2s ease-out forwards}

/* ── WEEK LINK ── */
.dash-week-lnk{font-size:9px;color:var(--amber);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.dash-week-lnk:hover{color:var(--amber2)}

/* ── NAV CHILD PILL ── */
.dash-tb-child{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:4px 10px 4px 7px;cursor:pointer}
.dash-tb-cem{font-size:14px}
.dash-tb-cn{font-family:var(--cta);font-size:11px;font-weight:800;color:rgba(255,255,255,.6)}

.dash-greet-time{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,184,76,.44);margin-bottom:3px}

/* ── ACTIVE CREATURE CARD ── */
.dash-ac{border-radius:24px;overflow:hidden;position:relative;background:rgba(6,10,30,.88);border:1px solid rgba(245,184,76,.11);padding:18px 16px 16px;margin-bottom:10px;animation:slideUp .5s ease both .08s;opacity:0;animation-fill-mode:forwards}
.dash-ac-aura{position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.06),transparent 70%);top:-70px;left:50%;animation:au 7s ease-in-out infinite;pointer-events:none;transform:translateX(-50%)}
.dash-ac-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.dash-ac-emowrap{position:relative;flex-shrink:0}
.dash-ac-emo{font-size:68px;line-height:1;display:inline-block;animation:flt 5s ease-in-out infinite,gA 5s ease-in-out infinite}
.dash-ac-stagebadge{position:absolute;bottom:-2px;right:-4px;background:linear-gradient(135deg,#8a4a08,#F5B84C);border-radius:10px;padding:2px 7px;font-family:var(--mono);font-size:7.5px;color:#020100;letter-spacing:.04em;font-weight:500}
.dash-ac-ci{flex:1;min-width:0;padding-top:4px}
.dash-ac-cname{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--cream);margin-bottom:2px;line-height:1.1}
.dash-ac-ctype{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,184,76,.42);margin-bottom:7px}
.dash-ac-wisdom{font-family:var(--serif);font-size:12px;font-style:italic;color:rgba(255,255,255,.56);line-height:1.65;border-left:2px solid rgba(245,184,76,.28);padding-left:9px}

/* ── EVOLUTION SECTION ── */
.dash-evo{margin-top:14px}
.dash-evo-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.dash-evo-lbl{font-family:var(--mono);font-size:8px;letter-spacing:.09em;text-transform:uppercase;color:rgba(245,184,76,.4)}
.dash-evo-next{font-family:var(--serif);font-size:10px;font-style:italic;color:rgba(245,184,76,.62)}
.dash-evo-track{display:flex;gap:4px;align-items:center;margin-bottom:10px}
.dash-shard{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;transition:all .3s}
.dash-shard.done{border:2px solid rgba(245,184,76,.5);background:rgba(245,184,76,.1)}
.dash-shard.tonight{border:2px solid rgba(245,184,76,.42);background:rgba(245,184,76,.07);animation:pring 2.5s ease-in-out infinite}
.dash-shard.tonightdone{border:2px solid rgba(29,158,117,.55);background:rgba(29,158,117,.12);animation:pring-t 2.4s ease-in-out infinite}
.dash-shard.future{background:rgba(245,184,76,.02);border:1.5px dashed rgba(245,184,76,.15)}
.dash-shard-conn{flex:1;height:1px;background:rgba(245,184,76,.1)}

/* ── PROGRESS BAR ── */
.dash-progbar-lbls{display:flex;justify-content:space-between;margin-bottom:4px}
.dash-progbar-lbl{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.22);letter-spacing:.03em}
.dash-progbar-lbl.hi{color:rgba(245,184,76,.55)}
.dash-progbar{height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;margin-bottom:10px}
.dash-progbar-fill{height:100%;background:linear-gradient(90deg,#8a4808,#F5B84C);border-radius:3px;--pw:0%;width:0;animation:progFill 1.4s ease .6s forwards}

/* ── STREAK ROW ── */
.dash-streak{display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(245,184,76,.04);border-radius:12px;border:1px solid rgba(245,184,76,.1)}
.dash-streak-fire{font-size:15px}
.dash-streak-txt{font-family:var(--cta);font-size:12px;font-weight:800;color:rgba(245,184,76,.76);flex:1}
.dash-streak-best{font-family:var(--mono);font-size:8px;color:rgba(245,184,76,.38);letter-spacing:.04em}

/* ── ACTIVE CTA ── */
.dash-ritual-cta{width:100%;padding:17px;border:none;border-radius:20px;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:var(--cta);font-size:17px;font-weight:800;cursor:pointer;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;box-shadow:0 12px 44px rgba(200,130,20,.48);transition:transform .18s,filter .18s}
.dash-ritual-cta::after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.5s ease-in-out infinite}
.dash-ritual-cta:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.08)}
.dash-ritual-cta:active{transform:scale(.97)}
.dash-ritual-cta-main{font-size:17px;font-weight:800}
.dash-ritual-cta-sub{font-size:9.5px;font-weight:600;opacity:.58;margin-top:3px;font-family:var(--sans)}

/* ── WEEK STRIP ── */
.dash-week-strip{padding:8px 0 14px}
.dash-week-strip-lbl{font-family:var(--mono);font-size:8px;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:8px}
.dash-wdays{display:flex;gap:4px;justify-content:space-between}
.dash-wday{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.dash-wday-n{font-family:var(--mono);font-size:7.5px;color:rgba(255,255,255,.22);letter-spacing:.03em}
.dash-wday-d{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px}
.dash-wday-d.dn{background:rgba(245,184,76,.14);border:1.5px solid rgba(245,184,76,.42)}
.dash-wday-d.td{background:rgba(245,184,76,.07);border:2px solid rgba(245,184,76,.42);animation:pring 2.5s ease-in-out infinite}
.dash-wday-d.td-done{background:rgba(29,158,117,.1);border:2px solid rgba(29,158,117,.5);animation:pring-t 2.4s ease-in-out infinite}
.dash-wday-d.ms{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09)}
.dash-wday-d.ft{background:transparent;border:1px dashed rgba(255,255,255,.09)}

/* ── COMPLETED SCREEN ── */
.dash-done-hd{padding:12px 0 6px;text-align:center;animation:slideUp .5s ease both}
.dash-done-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(20,216,144,.07);border:1px solid rgba(20,216,144,.24);border-radius:20px;padding:4px 14px;margin-bottom:9px}
.dash-done-badge-dot{width:5px;height:5px;border-radius:50%;background:#14d890;animation:twk 2.2s ease-in-out infinite}
.dash-done-badge-txt{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.7)}
.dash-done-title{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--cream);line-height:1.2;margin-bottom:4px}
.dash-done-title em{color:#14d890;font-style:italic}
.dash-done-sub{font-family:var(--sans);font-size:11.5px;color:rgba(255,255,255,.34);line-height:1.55}

/* ── DONE CREATURE ZONE ── */
.dash-done-cz{display:flex;flex-direction:column;align-items:center;position:relative;padding:8px 0 4px}
.dash-done-aura{position:absolute;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle,rgba(20,216,144,.09),transparent 70%);top:-40px;left:50%;animation:au 5.5s ease-in-out infinite;pointer-events:none}
.dash-done-emowrap{position:relative;display:inline-block}
.dash-done-emo{font-size:76px;line-height:1;display:inline-block;animation:flt 5s ease-in-out infinite,gT 4.5s ease-in-out infinite;position:relative;z-index:2}
.dash-zzz-particle{position:absolute;font-family:var(--serif);font-style:italic;pointer-events:none}
.dash-zzz-particle.z1{font-size:14px;top:6px;right:2px;color:rgba(20,216,144,.52);animation:zzz 3.2s 0s ease-out infinite}
.dash-zzz-particle.z2{font-size:10px;top:18px;right:14px;color:rgba(20,216,144,.38);animation:zzz 3.2s 1s ease-out infinite}
.dash-zzz-particle.z3{font-size:8px;top:24px;right:4px;color:rgba(20,216,144,.26);animation:zzz 3.2s 2s ease-out infinite}
.dash-done-cname{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);margin-top:6px}
.dash-done-cstage{font-family:var(--mono);font-size:8px;letter-spacing:.09em;text-transform:uppercase;color:rgba(20,216,144,.46);margin-top:3px}

/* ── DONE EVOLUTION CARD ── */
.dash-done-evo{background:rgba(20,216,144,.05);border:1px solid rgba(20,216,144,.15);border-radius:18px;padding:13px 15px;margin-bottom:10px}
.dash-done-evo-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.dash-done-evo-lbl{font-family:var(--serif);font-size:12px;font-style:italic;color:rgba(255,255,255,.54)}
.dash-done-evo-n{font-family:var(--mono);font-size:8.5px;color:rgba(20,216,144,.54);letter-spacing:.04em}
.dash-done-shard{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.dash-done-shard.dn{background:rgba(20,216,144,.14);border:2px solid rgba(20,216,144,.5)}
.dash-done-shard.jn{background:rgba(20,216,144,.2);border:2px solid rgba(20,216,144,.72);animation:cel .6s ease .2s both}
.dash-done-shard.ft{background:rgba(255,255,255,.02);border:1.5px dashed rgba(255,255,255,.14)}
.dash-done-shard-conn{flex:1;height:1px;background:rgba(20,216,144,.1)}
.dash-done-streak{display:flex;align-items:center;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(20,216,144,.1)}
.dash-done-streak-fire{font-size:15px}
.dash-done-streak-txt{font-family:var(--cta);font-size:12px;font-weight:800;color:rgba(20,216,144,.74);flex:1}
.dash-done-streak-num{font-family:var(--serif);font-size:18px;font-weight:700;color:#14d890}

/* ── TONIGHT'S MEMORY CARD ── */
.dash-memory{margin-bottom:12px;animation:slideUp .5s ease both .3s;opacity:0;animation-fill-mode:forwards}
.dash-memory-lbl{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:7px}
.dash-memory-card{background:linear-gradient(148deg,rgba(8,12,32,.96),rgba(14,18,46,.96));border:1px solid rgba(160,96,240,.2);border-radius:18px;padding:14px;overflow:hidden;position:relative;cursor:pointer;transition:border-color .2s}
.dash-memory-card:hover{border-color:rgba(160,96,240,.38)}
.dash-memory-card-sh{position:absolute;inset:0;background:linear-gradient(138deg,transparent 38%,rgba(160,96,240,.04) 50%,transparent 62%);pointer-events:none}
.dash-memory-title{font-family:var(--serif);font-size:13px;font-weight:700;color:var(--cream);line-height:1.35;flex:1;margin-right:8px}
.dash-memory-quote{font-family:var(--serif);font-size:12.5px;font-style:italic;color:rgba(255,255,255,.68);line-height:1.68;border-left:2px solid rgba(160,96,240,.4);padding-left:10px;margin-bottom:10px}
.dash-memory-quote em{color:#c090ff;font-style:normal;font-weight:700}
.dash-memory-date{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.22);letter-spacing:.04em}

/* ── BOTTOM TABS ── */
.dash-tabs{display:flex;background:rgba(3,6,14,.97);border-top:1px solid rgba(255,255,255,.07);padding:8px 0 6px;position:fixed;bottom:0;left:0;right:0;z-index:20;backdrop-filter:blur(16px)}
.dash-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:2px 0;transition:all .15s;-webkit-tap-highlight-color:transparent}
.dash-tab-ico{font-size:19px;line-height:1}
.dash-tab-lbl{font-size:9px;font-weight:700;font-family:var(--mono);letter-spacing:.02em}
.dash-tab.on .dash-tab-lbl{color:var(--amber2)}
.dash-tab.on-t .dash-tab-lbl{color:#14d890}
.dash-tab:not(.on):not(.on-t) .dash-tab-lbl{color:rgba(255,255,255,.35)}
.dash-tab:not(.on):not(.on-t) .dash-tab-ico{opacity:.45}
.dash-tab-pip{width:4px;height:4px;border-radius:50%;background:var(--amber2);animation:pring 2.2s ease-in-out infinite;margin-top:2px}

/* ── HATCH MODAL ── */
.dash-hatch-modal{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;animation:fadein .3s ease}
.dash-hatch-inner{text-align:center;animation:fadein .4s ease-out;max-width:340px;padding:24px}
.dash-hatch-creature{font-size:96px;animation:hatchBurst .6s ease-out;display:inline-block;margin-bottom:18px;filter:drop-shadow(0 0 32px rgba(20,216,144,.6))}
.dash-hatch-title{font-family:var(--serif);font-size:24px;color:var(--cream);margin-bottom:8px;line-height:1.3;font-style:italic}
.dash-hatch-title em{color:#14d890}
.dash-hatch-sub{font-size:13px;color:rgba(244,239,232,.4);line-height:1.65;margin-bottom:20px}
.dash-hatch-btn{padding:16px 32px;border:none;border-radius:18px;font-size:17px;font-weight:800;cursor:pointer;font-family:var(--cta);background:linear-gradient(135deg,#0a7a50,#14d890 50%,#0a7a50);color:#041a0c;box-shadow:0 8px 28px rgba(20,200,130,.35);transition:transform .18s,filter .18s}
.dash-hatch-btn:hover{transform:scale(1.03) translateY(-1px);filter:brightness(1.08)}

/* ── SHARD WRAP — needed for tooltip positioning ── */
.dash-shard-wrap{position:relative;flex-shrink:0}

/* SHARD TOOLTIP */
.dash-shard-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(6,12,26,.97);border:1px solid rgba(20,216,144,.28);border-radius:10px;padding:5px 10px;white-space:nowrap;pointer-events:none;z-index:50;min-width:76px;text-align:center;animation:tipIn .18s ease-out}
.dash-shard-tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid rgba(20,216,144,.28)}
.dash-shard-tip-date{font-family:var(--mono);font-size:8px;color:rgba(20,216,144,.7);letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:2px}
.dash-shard-tip-hint{font-family:var(--serif);font-size:9.5px;font-style:italic;color:rgba(255,255,255,.45)}
@keyframes tipIn{from{opacity:0;transform:translateX(-50%) translateY(5px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* SHARD active/tapped state */
.dash-shard.tapped{transform:scale(.9);box-shadow:0 0 0 3px rgba(20,216,144,.35)}

/* SHEET BACKDROP */
.dash-sheet-bd{position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:60;animation:fadein .22s ease}

/* BOTTOM SHEET */
.dash-sheet{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(168deg,#080c24,#060a1c);border-radius:22px 22px 0 0;border-top:1px solid rgba(160,96,240,.22);z-index:61;max-height:78vh;overflow-y:auto;scrollbar-width:none;animation:sheetUp .28s ease-out;padding-bottom:env(safe-area-inset-bottom,0px)}
.dash-sheet::-webkit-scrollbar{display:none}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.dash-sheet-handle{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.15);margin:12px auto 8px}

/* SHEET HEADER */
.dash-sh-hd{padding:0 16px 12px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
.dash-sh-night{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.62)}
.dash-sh-close{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.07);border:none;color:rgba(255,255,255,.4);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .18s;flex-shrink:0}
.dash-sh-close:hover{background:rgba(255,255,255,.13)}

/* SHEET WISDOM */
.dash-sh-wisdom{padding:12px 16px;display:flex;align-items:flex-start;gap:10px;background:rgba(20,216,144,.04);border-bottom:1px solid rgba(255,255,255,.05)}
.dash-sh-wis-emo{font-size:28px;line-height:1;flex-shrink:0;margin-top:2px}
.dash-sh-wis-lbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.45);margin-bottom:4px}
.dash-sh-wis-txt{font-family:var(--serif);font-size:13px;font-style:italic;color:rgba(255,255,255,.72);line-height:1.6}

/* SHEET PHOTO */
.dash-sh-photo{margin:12px 16px 0;border-radius:14px;overflow:hidden;position:relative}

/* SHEET PHOTO ADD PROMPT */
.dash-sh-photo-add{margin:12px 16px 0;background:rgba(255,255,255,.02);border:1.5px dashed rgba(245,184,76,.18);border-radius:14px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .2s}
.dash-sh-photo-add:hover{background:rgba(245,184,76,.04);border-color:rgba(245,184,76,.32)}
.dash-sh-pa-ico{width:40px;height:40px;border-radius:11px;background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.18);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.dash-sh-pa-title{font-family:var(--cta);font-size:12px;font-weight:800;color:rgba(255,255,255,.5);margin-bottom:2px}
.dash-sh-pa-sub{font-family:var(--sans);font-size:9.5px;color:rgba(255,255,255,.24);line-height:1.4}

/* SHEET STORY SECTION */
.dash-sh-story{padding:12px 16px}
.dash-sh-sec-lbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:7px}
.dash-sh-story-card{background:rgba(255,255,255,.03);border:1px solid rgba(160,96,240,.18);border-radius:13px;padding:12px;position:relative;overflow:hidden}
.dash-sh-story-title{font-family:var(--serif);font-size:13px;font-weight:700;color:var(--cream);line-height:1.3;margin-bottom:8px}
.dash-sh-story-refrain{font-family:var(--serif);font-size:12px;font-style:italic;color:rgba(255,255,255,.6);line-height:1.65;border-left:2px solid rgba(160,96,240,.38);padding-left:9px;margin-bottom:10px}
.dash-sh-story-refrain em{color:#c090ff;font-style:normal;font-weight:700}

/* READ STORY BUTTON */
.dash-sh-read-btn{width:100%;padding:11px;border:none;border-radius:12px;background:rgba(160,96,240,.12);border:1px solid rgba(160,96,240,.32);color:#c090ff;font-family:var(--cta);font-size:12.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;position:relative;overflow:hidden}
.dash-sh-read-btn::after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.1),transparent);animation:shimmer 3s ease-in-out infinite}
.dash-sh-read-btn:hover{background:rgba(160,96,240,.22);border-color:rgba(160,96,240,.5);transform:translateY(-1px)}
.dash-sh-read-btn:active{transform:scale(.97)}

/* NO STORY STATE */
.dash-sh-no-story{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(255,255,255,.28);text-align:center;padding:8px 0}

/* SHEET BONDING */
.dash-sh-bond{padding:0 16px 16px}
.dash-sh-bond-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:11px 13px}
.dash-sh-bq{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(255,255,255,.4);margin-bottom:6px;line-height:1.5}
.dash-sh-ba{font-family:var(--sans);font-size:12.5px;font-weight:600;color:rgba(255,255,255,.75);line-height:1.5}

@media(max-width:600px){.dash-pods{gap:6px}.dash-pod{min-width:72px}}
`;

// ── stars ─────────────────────────────────────────────────────────────────────

const STARS=Array.from({length:45},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*50,
  size:Math.random()<.2?4:Math.random()<.5?3:2,
  d:(2+Math.random()*3).toFixed(1)+'s',
  dl:(Math.random()*4).toFixed(1)+'s',
  t:Math.random()<.4?1:Math.random()<.75?2:3,
}));

// ── SVG nav icons (kept for loading skeleton) ────────────────────────────────

function IconHome({on}:{on:boolean}){
  const c=on?'#E8972A':'rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 10.5L10 4l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1v-6.5z"
      stroke={c} strokeWidth="1.4" fill={on?'rgba(232,151,42,.15)':'none'}/>
  </svg>;
}
function IconStories({on}:{on:boolean}){
  const c=on?'#E8972A':'rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 3h10a1 1 0 011 1v13l-3-2-3 2-3-2-3 2V4a1 1 0 011-1z" stroke={c} strokeWidth="1.4" fill={on?'rgba(232,151,42,.1)':'none'}/>
  </svg>;
}
function IconCards({on}:{on:boolean}){
  const c=on?'#E8972A':'rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="5" width="12" height="12" rx="1.5" stroke={c} strokeWidth="1.4" fill={on?'rgba(232,151,42,.1)':'none'}/>
    <path d="M4 9h12" stroke={c} strokeWidth="1.4"/>
    <circle cx="8" cy="7" r="1" fill={c}/><circle cx="12" cy="7" r="1" fill={c}/>
  </svg>;
}
function IconProfile({on}:{on:boolean}){
  const c=on?'#E8972A':'rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3" stroke={c} strokeWidth="1.4" fill={on?'rgba(232,151,42,.1)':'none'}/>
    <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function UserDashboard({onSignUp,onReadStory}:{onSignUp:()=>void;onReadStory?:(book:any)=>void}){
  const{user,logout,setView,selectedCharacters,setSelectedCharacters,setRitualSeed,setRitualMood,setEditingCharacter}=useApp();
  const[characters,setCharacters]=useState<Character[]>([]);
  const[allCards,setAllCards]=useState<SavedNightCard[]>([]);
  const[loading,setLoading]=useState(true);
  const[weekViewId,setWeekViewId]=useState<string>('');
  const[modalCard,setModalCard]=useState<SavedNightCard|null>(null);
  const[missTooltip,setMissTooltip]=useState<number|null>(null);
  const[storyCount,setStoryCount]=useState(0);
  const[lastStory,setLastStory]=useState<any>(null);
  const[allStories,setAllStories]=useState<any[]>([]);
  const[hoveredStar,setHoveredStar]=useState<number|null>(null);
  const[selectedStar,setSelectedStar]=useState<number|null>(null);
  const[activeEgg,setActiveEgg]=useState<HatcheryEgg|null>(null);
  const[hatchedCreature,setHatchedCreature]=useState<HatchedCreature|null>(null);
  const[creatureAsleep,setCreatureAsleep]=useState(false);
  const[showHatchModal,setShowHatchModal]=useState(false);
  const missTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isGuest=!!user?.isGuest;

  // detect first-time user — createdAt within 10 minutes of now
  const isNewUser=useMemo(()=>{
    if(!user?.createdAt) return false;
    const created=new Date(user.createdAt).getTime();
    const now=Date.now();
    return (now-created)<10*60*1000;
  },[user?.createdAt]);

  const userId = user?.id;
  useEffect(()=>{
    if(!userId) return;
    Promise.all([getCharacters(userId),getNightCards(userId),getStories(userId)]).then(([chars,cards,stories])=>{
      setCharacters(chars);setAllCards(cards);setStoryCount(stories.length);
      setAllStories(stories);
      if(stories.length>0){
        const sorted=[...stories].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
        setLastStory(sorted[0]);
      }
      const familyChars=chars.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human'));
      if(familyChars.length>0){setSelectedCharacters([familyChars[0]]);setWeekViewId(familyChars[0].id);}
      else if(chars.length>0){setSelectedCharacters([chars[0]]);setWeekViewId(chars[0].id);}
      setLoading(false);
    });
    if(hasSupabase) getAllHatchedCreatures(userId).then(creatures=>{
      if(creatures.length>0) setHatchedCreature(creatures[0]);
    });
  },[userId]); // eslint-disable-line

  const familyChars=useMemo(()=>characters.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human')),[characters]);

  const primary=selectedCharacters[0]??null;
  const secondary=selectedCharacters[1]??null;
  const isMulti=selectedCharacters.length>1;
  const weekChild=characters.find(c=>c.id===weekViewId)??primary;

  // Fetch active egg for the primary character
  useEffect(()=>{
    if(!hasSupabase||!user||!primary) return;
    getActiveEgg(user.id,primary.id).then(egg=>{
      if(egg){setActiveEgg(egg);}
      else{const rc=CREATURES[Math.floor(Math.random()*CREATURES.length)];createEgg(user.id,primary.id,rc.id,1).then(setActiveEgg).catch(()=>{});}
    });
  },[user,primary?.id]); // eslint-disable-line

  const glow   =useMemo(()=>weekChild?calculateGlow(allCards,weekChild.id):0,[allCards,weekChild]);
  const week   =useMemo(()=>weekChild?getWeekNights(allCards,weekChild.id):[]  ,[allCards,weekChild]);
  const lyCard =useMemo(()=>primary?getLastYearCard(allCards,primary.id):null  ,[allCards,primary]);

  const _realEggStage=useMemo(()=>{
    if(!activeEgg) return 0;
    const startDate=activeEgg.startedAt.split('T')[0];
    const count=allCards.filter(card=>
      card.characterIds.includes(activeEgg.characterId)&&
      card.date.split('T')[0]>=startDate
    ).length;
    return Math.min(count,7);
  },[activeEgg,allCards]);
  const eggStage = _realEggStage;

  const _realEggCards = useMemo(()=>{
    if(!activeEgg) return [];
    const startDate=activeEgg.startedAt.split('T')[0];
    return allCards
      .filter(c=>c.characterIds.includes(activeEgg.characterId)&&c.date.split('T')[0]>=startDate)
      .sort((a,b)=>a.date.localeCompare(b.date))
      .slice(0,7);
  },[activeEgg,allCards]);
  const eggCards = _realEggCards;

  const weekDone=week.filter(n=>n.state==='complete').length;
  const glowPct =Math.min(100,Math.round((weekDone/7)*100));
  const weekNum =Math.floor(glow/7);
  const constName=constellationName(weekNum);
  const constComplete=weekDone===7;
  const toNextConst=Math.max(0,7-(glow%7));

  // tonight done = today's ritual completed
  const todayStr=dateStr(new Date());
  const tonightDone=!!allCards.find(c=>primary&&cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===todayStr);
  const tonightCard=allCards.find(c=>primary&&cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===todayStr)??null;

  // time-aware greeting
  const hour=new Date().getHours();
  let greetLine:'morning'|'afternoon'|'evening'|'late'='evening';
  if(hour<12) greetLine='morning';
  else if(hour<17) greetLine='afternoon';
  else if(hour>=22) greetLine='late';
  const greetWord=greetLine==='morning'?'Good morning':greetLine==='afternoon'?'Good afternoon':'Good evening';
  let greetSuffix:'done'|'close'|'welcome'='close';
  if(tonightDone) greetSuffix='done';
  else if(hour<17) greetSuffix='welcome';
  const greetEmText=isNewUser?'Welcome to SleepSeed.':greetSuffix==='done'?'Tonight\'s star is saved.':greetSuffix==='welcome'?'Welcome back.':'Bedtime is close.';

  const today=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();
  const hasAnyNights=allCards.length>0;

  function putToBed(){
    if(creatureAsleep) return;
    setCreatureAsleep(true);
  }

  function toggleChild(c:Character){
    const ids=selectedCharacters.map(x=>x.id);
    if(ids.includes(c.id)){
      if(selectedCharacters.length===1) return;
      const next=selectedCharacters.filter(x=>x.id!==c.id);
      setSelectedCharacters(next);
      if(weekViewId===c.id) setWeekViewId(next[0]?.id??'');
    } else {
      setSelectedCharacters([...selectedCharacters,c]);
    }
  }

  function startRitual(){setRitualSeed('');setRitualMood('');setView('ritual-starter');}

  function showMiss(idx:number){
    if(missTimer.current) clearTimeout(missTimer.current);
    setMissTooltip(idx);
    missTimer.current=setTimeout(()=>setMissTooltip(null),2200);
  }

  function avatarBg(color:string):string{
    if(!color||!color.startsWith('#')) return 'rgba(100,100,180,.2)';
    return hexToRgba(color,.2);
  }

  const btnBg    =isMulti?'linear-gradient(135deg,#1D9E75,#158C62)':'linear-gradient(135deg,#E8972A,#CC7818)';
  const btnColor =isMulti?'#E1F5EE':'#120800';
  const dotColor =isMulti?'var(--teal)':'var(--amber)';
  const lblColor =isMulti?'var(--teal2)':'var(--amber)';
  const spColor  =isMulti?'var(--teal2)':'var(--amber2)';
  const cardBdr  =isMulti?'1.5px solid #1D9E75':'1.5px solid var(--amber)';
  const subText  =isMulti?'One story tonight — saved to both profiles':"Ask them — write or speak what they say";

  const creatureDef = useMemo(()=>{
    if(!activeEgg) return null;
    return getCreature(activeEgg.creatureType);
  },[activeEgg]);

  const tonightLesson = useMemo(()=>{
    if(!creatureDef || eggStage >= 7) return null;
    return creatureDef.lessonBeats[eggStage] ?? null;
  },[creatureDef, eggStage]);

  const creatureSpeech = useMemo(()=>{
    if(!hatchedCreature) return '';
    const n = hatchedCreature.name;
    if(tonightDone) return `${n} is fast asleep\u2026 sweet dreams.`;
    if(creatureDef && eggStage < 7) {
      return creatureDef.dailyWisdom[eggStage] ?? `${n} is ready for tonight!`;
    }
    return `${n} is ready for tonight's adventure!`;
  },[hatchedCreature,tonightDone,creatureDef,eggStage]);

  // ── New helpers for redesign ──────────────────────────────────────────────
  const childName = primary?.name ?? 'your child';
  const barWidth = `${Math.round((eggStage / 7) * 100)}%`;
  const nightsLeft = Math.max(0, 7 - eggStage);
  const nightsLeftLabel = nightsLeft === 0
    ? 'Ready to hatch!'
    : `${nightsLeft} night${nightsLeft !== 1 ? 's' : ''} to evolve`;
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // ── Shard interaction state ───────────────────────────────────────────────
  const [activeShardIdx, setActiveShardIdx] = useState<number | null>(null);

  const activeShardCard = useMemo(() =>
    activeShardIdx !== null ? (eggCards[activeShardIdx] ?? null) : null,
    [activeShardIdx, eggCards]
  );

  const activeShardStory = useMemo(() => {
    if (!activeShardCard?.storyId) return null;
    return allStories.find(s => s.id === activeShardCard.storyId) ?? null;
  }, [activeShardCard, allStories]);

  const activeShardWisdom = useMemo(() => {
    if (activeShardIdx === null) return null;
    return creatureDef?.dailyWisdom?.[activeShardIdx] ?? null;
  }, [activeShardIdx, creatureDef]);

  const handleShardTap = (index: number, isDone: boolean) => {
    if (!isDone) return;
    setActiveShardIdx(activeShardIdx === index ? null : index);
  };

  const closeSheet = () => setActiveShardIdx(null);

  const shardTooltipLabel = (index: number): string => {
    const card = eggCards[index];
    if (!card) return '';
    const d = new Date(card.date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Close sheet on unmount
  useEffect(() => {
    return () => setActiveShardIdx(null);
  }, []);

  // Close sheet on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if(!user) return null;

  if(loading) return(
    <div className="dash" style={{minHeight:'100vh'}}>
      <style>{CSS}</style>
      <div className="dash-sky"/>
      <div className="dash-stars">
        {STARS.map(s=>(
          <div key={s.id} className={s.t===1?'dash-star':s.t===2?'dash-star2':'dash-star3'}
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
        ))}
      </div>
      <nav className="dash-nav">
        <div className="dash-logo">
          <div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>
          SleepSeed
        </div>
      </nav>
      <div className="dash-inner" style={{paddingTop:20}}>
        <div className="dash-skel" style={{height:22,width:'55%',marginBottom:8}}/>
        <div className="dash-skel" style={{height:12,width:'30%',marginBottom:18}}/>
        <div className="dash-skel" style={{height:180,borderRadius:24,marginBottom:11}}/>
        <div className="dash-skel" style={{height:56,borderRadius:20,marginBottom:11}}/>
        <div className="dash-skel" style={{height:60,borderRadius:16}}/>
      </div>
    </div>
  );

  // ── FULL RENDER ────────────────────────────────────────────────────────────
  return(
    <div className="dash">
      <style>{CSS}</style>

      {/* STAR FIELD */}
      <div className="dash-sky"/>
      <div className="dash-stars">
        {STARS.slice(0,20).map(s=>(
          <div key={s.id} className={s.t===1?'dash-star':s.t===2?'dash-star2':'dash-star3'}
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
        ))}
      </div>

      {/* NAV */}
      <nav className="dash-nav" style={{
        background: tonightDone ? 'rgba(3,8,18,.92)' : 'rgba(4,8,22,.9)',
        borderBottom: tonightDone ? '1px solid rgba(20,216,144,.07)' : '1px solid rgba(245,184,76,.07)',
      }}>
        <div className="dash-logo">
          <div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>
          SleepSeed
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {primary && (
            <div className="dash-tb-child" onClick={()=>familyChars.length>1?null:null}>
              <span className="dash-tb-cem">{primary.emoji || '\uD83E\uDDD2'}</span>
              <span className="dash-tb-cn">{primary.name}</span>
            </div>
          )}
          <div style={{fontFamily:'var(--mono)',fontSize:8,color:'rgba(255,255,255,.22)',letterSpacing:'.05em'}}>
            {today}
          </div>
        </div>
      </nav>

      {/* MULTI-CHILD PODS */}
      {familyChars.length > 1 && (
        <div style={{padding:'10px 5% 0',position:'relative',zIndex:5}}>
          <div className="dash-pods">
            {familyChars.map(c=>{
              const isOn=primary?.id===c.id;
              return(
                <div key={c.id} className={`dash-pod${isOn?' on':''}`}
                  onClick={()=>{setSelectedCharacters([c]);setWeekViewId(c.id);}}>
                  <div className="dash-pod-emoji">{c.emoji||'\uD83E\uDDD2'}</div>
                  <div className="dash-pod-name">{c.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dash-inner">

        {/* ══════════════════════════════════════════
            GUEST EXPERIENCE
        ══════════════════════════════════════════ */}
        {isGuest&&(
          <div style={{padding:'20px 0 0'}}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:12,animation:'flt 3.5s ease-in-out infinite',
                filter:'drop-shadow(0 0 16px rgba(245,184,76,.3))'}}>🌙</div>
              <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--cream)',lineHeight:1.3,marginBottom:6}}>
                Tonight could be the night<br/><em style={{color:'var(--amber2)'}}>bedtime changes forever.</em>
              </div>
              <div style={{fontSize:13,color:'rgba(244,239,232,.35)',lineHeight:1.65}}>
                A personalised bedtime story starring your child — written in 60 seconds.
              </div>
            </div>
            <button className="dash-u-btn" style={{
              width:'100%',marginBottom:20,
              background:'linear-gradient(145deg,#a06010,#F5B84C 48%,#a06010)',
              boxShadow:'0 8px 30px rgba(200,130,20,.42)',
            }} onClick={()=>setView('story-wizard' as any)}>
              <span className="dash-u-btn-ico">✨</span>
              <span className="dash-u-btn-texts">
                <span className="dash-u-btn-title" style={{color:'#080200'}}>Try your first story</span>
                <span className="dash-u-btn-sub" style={{color:'rgba(8,2,0,.5)'}}>See the magic — no signup needed</span>
              </span>
              <span className="dash-u-btn-arr" style={{color:'rgba(8,2,0,.38)'}}>→</span>
            </button>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,fontFamily:'var(--mono)',letterSpacing:'.1em',textTransform:'uppercase',
                color:'rgba(245,184,76,.4)',marginBottom:12,fontWeight:600}}>How it works</div>
              {[
                {ico:'🌙',title:'You share a moment from today',sub:"What happened at school? What made them laugh? What's on their mind?"},
                {ico:'✨',title:'We write their bedtime story',sub:'AI crafts a unique story starring your child — with their name, their world, their feelings.'},
                {ico:'🥚',title:'A DreamKeeper companion hatches',sub:'Do the ritual 7 nights in a row and a mystery DreamKeeper arrives — theirs to keep forever.'},
              ].map((step,i)=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start'}}>
                  <div style={{fontSize:24,lineHeight:1,flexShrink:0,marginTop:2}}>{step.ico}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--cream)',marginBottom:2}}>{step.title}</div>
                    <div style={{fontSize:11,color:'rgba(244,239,232,.35)',lineHeight:1.6}}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(245,184,76,.04)',border:'1px solid rgba(245,184,76,.12)',borderRadius:16,padding:'14px 16px',marginBottom:20}}>
              <div style={{fontFamily:'var(--serif)',fontSize:13,fontStyle:'italic',color:'rgba(244,239,232,.55)',lineHeight:1.65,marginBottom:8}}>
                "My daughter won't go to bed without checking on her egg first. Bedtime went from something I dreaded to the best twenty minutes of our day."
              </div>
              <div style={{fontSize:10,color:'rgba(244,239,232,.25)',fontFamily:'var(--mono)'}}>Sarah M. · Mum of two</div>
            </div>
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,padding:'16px 18px',textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--cream)',marginBottom:4}}>Ready to keep your stories?</div>
              <div style={{fontSize:11,color:'rgba(244,239,232,.3)',lineHeight:1.6,marginBottom:12}}>
                Create a free account to save every story, build your DreamKeeper collection, and unlock Night Cards.
              </div>
              <button style={{background:'rgba(245,184,76,.1)',border:'1px solid rgba(245,184,76,.25)',borderRadius:50,padding:'10px 24px',fontSize:13,fontWeight:600,color:'var(--amber2)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all .18s'}} onClick={onSignUp}>
                Create free account →
              </button>
            </div>
            <div style={{textAlign:'center',marginBottom:8}}>
              <button style={{background:'none',border:'none',color:'rgba(244,239,232,.25)',fontSize:12,cursor:'pointer',fontFamily:'var(--sans)',transition:'color .15s'}} onClick={()=>setView('library')}>
                Or browse stories from other families →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            LOGGED-IN: GREETING
        ══════════════════════════════════════════ */}
        {!isGuest&&(
          <div style={{paddingTop:18,marginBottom:10,position:'relative',zIndex:5}}>
            <div className="dash-greet-time">{greetWord}</div>
            <div className="dash-greet">
              {tonightDone
                ? <>Sweet dreams, <em className="done">{childName}.</em></>
                : <>Time for <em>{childName}'s</em> story 🌙</>
              }
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            ACTIVE STATE (!tonightDone)
        ══════════════════════════════════════════ */}
        {!isGuest && !tonightDone && (
          <>
            {/* CREATURE + EVOLUTION CARD */}
            {activeEgg && hatchedCreature && creatureDef && (
              <div className="dash-ac">
                <div className="dash-ac-aura"/>
                <div className="dash-ac-top">
                  <div className="dash-ac-emowrap">
                    <div className="dash-ac-emo">{hatchedCreature.creatureEmoji}</div>
                    <div className="dash-ac-stagebadge">Night {eggStage+1} of 7</div>
                  </div>
                  <div className="dash-ac-ci">
                    <div className="dash-ac-cname">{hatchedCreature.name}</div>
                    <div className="dash-ac-ctype">{creatureDef.name} · {childName}'s companion</div>
                    <div className="dash-ac-wisdom">"{creatureSpeech}"</div>
                  </div>
                </div>

                <div className="dash-evo">
                  <div className="dash-evo-hd">
                    <div className="dash-evo-lbl">Dream Shards</div>
                    <div className="dash-evo-next">{nightsLeftLabel}</div>
                  </div>

                  <div className="dash-evo-track">
                    {Array.from({length:7},(_,i)=>{
                      const isDone=i<eggStage;
                      const isTonight=i===eggStage&&!tonightDone;
                      const isFuture=!isDone&&!isTonight;
                      const card=eggCards[i]??null;
                      const colour=isDone?shardColour(card):'rgba(245,184,76,.5)';
                      const tappable=isDone;
                      const isTapped=activeShardIdx===i;
                      return(
                        <React.Fragment key={i}>
                          <div className="dash-shard-wrap">
                            {tappable&&isTapped&&(
                              <div className="dash-shard-tip">
                                <span className="dash-shard-tip-date">{shardTooltipLabel(i)}</span>
                                <span className="dash-shard-tip-hint">tap to open ✦</span>
                              </div>
                            )}
                            <div className={`dash-shard ${isDone?'done':isTonight?'tonight':'future'}${isTapped?' tapped':''}`}
                              style={isDone?{borderColor:colour,background:colour+'22',cursor:'pointer'}:undefined}
                              onClick={()=>handleShardTap(i,tappable)}>
                              {isDone?'✦':isTonight?'·':'·'}
                            </div>
                          </div>
                          {i<6&&<div className="dash-shard-conn"/>}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className="dash-progbar-lbls">
                    <span className="dash-progbar-lbl">Shard 1</span>
                    <span className="dash-progbar-lbl hi">{eggStage} of 7 collected</span>
                    <span className="dash-progbar-lbl">Hatch →</span>
                  </div>
                  <div className="dash-progbar">
                    <div className="dash-progbar-fill" style={{'--pw':barWidth} as any}/>
                  </div>

                  <div className="dash-streak">
                    <span className="dash-streak-fire">🔥</span>
                    <span className="dash-streak-txt">
                      {glow>0?`${glow} night${glow!==1?'s':''} in a row`:'Start your streak tonight'}
                    </span>
                    {glow>0&&<span className="dash-streak-best">streak: {glow}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* NO CREATURE — first time with characters */}
            {!hatchedCreature && familyChars.length > 0 && (
              <button className="dash-ritual-cta" style={{marginBottom:12}} onClick={startRitual}>
                <span className="dash-ritual-cta-main">✦ Begin tonight's ritual</span>
                <span className="dash-ritual-cta-sub">Your story is waiting · ~10 minutes</span>
              </button>
            )}

            {/* NO CHARACTERS */}
            {familyChars.length === 0 && (
              <div style={{textAlign:'center',marginTop:20}}>
                <div style={{fontSize:72,animation:'flt 3s ease-in-out infinite',filter:'drop-shadow(0 0 16px rgba(245,184,76,.3))',marginBottom:12}}>🥚</div>
                <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--amber2)',marginBottom:10}}>Your adventure begins tonight</div>
                <button className="dash-ritual-cta" onClick={()=>{setEditingCharacter(null);setView('onboarding');}}>
                  <span className="dash-ritual-cta-main">✨ Start your first adventure</span>
                  <span className="dash-ritual-cta-sub">Create a character and hatch your first Dreamkeeper</span>
                </button>
              </div>
            )}

            {/* CTA — when creature exists */}
            {hatchedCreature && (
              <div style={{position:'relative',zIndex:5,marginBottom:10}}>
                <button className="dash-ritual-cta" onClick={startRitual}>
                  <span className="dash-ritual-cta-main">✦ Begin tonight's ritual</span>
                  <span className="dash-ritual-cta-sub">{hatchedCreature.name} is waiting · ~10 minutes</span>
                </button>
              </div>
            )}

            {/* WEEK STRIP */}
            {week.length>0&&(
              <div className="dash-week-strip" style={{position:'relative',zIndex:5}}>
                <div className="dash-week-strip-lbl">This week</div>
                <div className="dash-wdays">
                  {week.map((n,i)=>{
                    const isDone=n.state==='complete';
                    const isTonight2=n.state==='tonight';
                    const isMissed=n.state==='missed';
                    const dayClass=isDone?'dn':isTonight2?'td':isMissed?'ms':'ft';
                    return(
                      <div key={i} className="dash-wday"
                        style={{cursor:isDone&&n.card?'pointer':'default'}}
                        onClick={()=>isDone&&n.card?setModalCard(n.card):isMissed?showMiss(i):null}>
                        <div className="dash-wday-n">{n.label}</div>
                        <div className={`dash-wday-d ${dayClass}`}>
                          {isDone?'⭐':isTonight2?'✦':''}
                        </div>
                        {missTooltip===i&&isMissed&&(
                          <div className="dash-miss-tooltip">missed this night</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RE-READ SHORTCUT */}
            {lastStory&&lastStory.bookData&&onReadStory&&(
              <div className="dash-ly" onClick={()=>onReadStory(lastStory.bookData)}
                style={{position:'relative',zIndex:5}}>
                <span className="dash-ly-ico">📖</span>
                <span className="dash-ly-text">Re-read last night: <em>{lastStory.title}</em></span>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            COMPLETED STATE (tonightDone)
        ══════════════════════════════════════════ */}
        {!isGuest && tonightDone && (
          <>
            {/* CELEBRATION HEADER */}
            <div className="dash-done-hd">
              <div className="dash-done-badge">
                <div className="dash-done-badge-dot"/>
                <span className="dash-done-badge-txt">Night {eggStage} Complete ✦</span>
              </div>
              <div className="dash-done-title">
                Well done, <em>{childName}.</em>
              </div>
              <div className="dash-done-sub">
                {hatchedCreature?.name ?? 'Your companion'} heard every word of your story tonight.
              </div>
            </div>

            {/* CREATURE CELEBRATION */}
            {hatchedCreature && (
              <div className="dash-done-cz">
                <div className="dash-done-aura" style={{transform:'translateX(-50%)'}}/>
                <div className="dash-done-emowrap">
                  <div className="dash-done-emo">{hatchedCreature.creatureEmoji}</div>
                  <div className="dash-zzz-particle z1">z</div>
                  <div className="dash-zzz-particle z2">z</div>
                  <div className="dash-zzz-particle z3">z</div>
                </div>
                <div className="dash-done-cname">{hatchedCreature.name}</div>
                <div className="dash-done-cstage">{creatureDef?.name ?? ''} · Night {eggStage} of 7</div>
              </div>
            )}

            {/* DONE EVOLUTION CARD */}
            <div className="dash-done-evo" style={{position:'relative',zIndex:5}}>
              <div className="dash-done-evo-hd">
                <span className="dash-done-evo-lbl">Dream Shards ✦</span>
                <span className="dash-done-evo-n">{nightsLeftLabel}</span>
              </div>
              <div className="dash-evo-track">
                {Array.from({length:7},(_,i)=>{
                  const wasDoneBefore=i<eggStage-1;
                  const isJustNow=i===eggStage-1;
                  const isDone=wasDoneBefore||isJustNow;
                  const isFutureD=i>=eggStage;
                  const card=eggCards[i]??null;
                  const colour=shardColour(card);
                  const tappable=isDone;
                  const isTapped=activeShardIdx===i;
                  return(
                    <React.Fragment key={i}>
                      <div className="dash-shard-wrap">
                        {tappable&&isTapped&&(
                          <div className="dash-shard-tip">
                            <span className="dash-shard-tip-date">{shardTooltipLabel(i)}</span>
                            <span className="dash-shard-tip-hint">tap to open ✦</span>
                          </div>
                        )}
                        <div className={`dash-done-shard ${isJustNow?'jn':wasDoneBefore?'dn':'ft'}${isTapped?' tapped':''}`}
                          style={isDone?{borderColor:colour,background:colour+'22',cursor:'pointer'}:undefined}
                          onClick={()=>handleShardTap(i,tappable)}>
                          {isDone?'✦':'·'}
                        </div>
                      </div>
                      {i<6&&<div className="dash-done-shard-conn"/>}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="dash-done-streak">
                <span className="dash-done-streak-fire">🔥</span>
                <span className="dash-done-streak-txt">
                  {glow>1?`${glow} nights in a row — keep it going!`:'First night complete — come back tomorrow!'}
                </span>
                {glow>0&&<span className="dash-done-streak-num">{glow}</span>}
              </div>
            </div>

            {/* TONIGHT'S STORY MEMORY */}
            {tonightCard && (
              <div className="dash-memory" style={{position:'relative',zIndex:5}}>
                <div className="dash-memory-lbl">✦ Tonight's story</div>
                <div className="dash-memory-card" onClick={()=>setModalCard(tonightCard)}>
                  <div className="dash-memory-card-sh"/>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:9}}>
                    <div className="dash-memory-title">{tonightCard.storyTitle}</div>
                    <div style={{fontSize:18,flexShrink:0}}>{tonightCard.emoji ?? '📖'}</div>
                  </div>
                  {tonightCard.quote && (
                    <div className="dash-memory-quote">"{tonightCard.quote}"</div>
                  )}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div className="dash-memory-date">
                      {new Date(tonightCard.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · Night {eggStage}
                    </div>
                    <div style={{fontSize:11,color:'rgba(160,96,240,.5)'}}>💜 saved</div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW HATCHERY */}
            <div style={{textAlign:'center',padding:'6px 0 14px',position:'relative',zIndex:5}}>
              <button className="dash-week-lnk" onClick={()=>setView('hatchery')}>View hatchery →</button>
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {modalCard&&(
        <div className="dash-nc-modal-bg" onClick={()=>setModalCard(null)}>
          <div className="dash-nc-modal" onClick={e=>e.stopPropagation()}>
            <div className="dash-nc-modal-top">
              <div className="dash-nc-modal-lbl">Night Card</div>
              <div className="dash-nc-modal-date">{modalCard.date?.split('T')[0]}</div>
              <button className="dash-nc-modal-close" onClick={()=>setModalCard(null)}>x</button>
            </div>
            <div className="dash-nc-modal-body">
              {modalCard.storyTitle&&<><div className="dash-nc-modal-fl">Story</div><div className="dash-nc-modal-fv">{modalCard.storyTitle}</div></>}
              {modalCard.quote&&<><div className="dash-nc-modal-fl">What they said</div><div className="dash-nc-modal-fv">"{modalCard.quote}"</div></>}
              {modalCard.bondingQuestion&&(<>
                <div className="dash-nc-modal-q">"{modalCard.bondingQuestion}"</div>
                {modalCard.bondingAnswer&&<div className="dash-nc-modal-a">{modalCard.bondingAnswer}</div>}
              </>)}
              {!modalCard.quote&&!modalCard.bondingQuestion&&<div className="dash-nc-modal-fv">{modalCard.memory_line||'A night to remember'}</div>}
            </div>
          </div>
        </div>
      )}

      {showHatchModal&&activeEgg&&(
        <div className="dash-hatch-modal" onClick={()=>setShowHatchModal(false)}>
          <div className="dash-hatch-inner" onClick={e=>e.stopPropagation()}>
            <div className="dash-hatch-creature">{activeEgg.creatureEmoji}</div>
            <div className="dash-hatch-title">A new <em>companion</em> has hatched!</div>
            <div className="dash-hatch-sub">Complete the ritual to name them and welcome them home.</div>
            <button className="dash-hatch-btn" onClick={()=>{setShowHatchModal(false);startRitual();}}>
              Begin tonight's ritual
            </button>
          </div>
        </div>
      )}

      {/* SHARD BOTTOM SHEET */}
      {activeShardIdx !== null && activeShardCard && (
        <>
          <div className="dash-sheet-bd" onClick={closeSheet}/>
          <div className="dash-sheet">
            <div className="dash-sheet-handle"/>
            <div className="dash-sh-hd">
              <span className="dash-sh-night">
                ✦ Night {activeShardIdx + 1}
                {' · '}
                {new Date(activeShardCard.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
              </span>
              <button className="dash-sh-close" onClick={closeSheet}>✕</button>
            </div>

            {activeShardWisdom && hatchedCreature && (
              <div className="dash-sh-wisdom">
                <div className="dash-sh-wis-emo">{hatchedCreature.creatureEmoji}</div>
                <div>
                  <div className="dash-sh-wis-lbl">{hatchedCreature.name}'s wisdom that night</div>
                  <div className="dash-sh-wis-txt">"{activeShardWisdom}"</div>
                </div>
              </div>
            )}

            {activeShardCard.photo ? (
              <div className="dash-sh-photo">
                <img src={activeShardCard.photo}
                  alt={`${activeShardCard.heroName} · Night ${activeShardIdx + 1}`}
                  style={{width:'100%',height:145,objectFit:'cover',display:'block',borderRadius:14}}/>
              </div>
            ) : (
              <div className="dash-sh-photo-add">
                <div className="dash-sh-pa-ico">📷</div>
                <div>
                  <div className="dash-sh-pa-title">Add a photo of {activeShardCard.heroName}</div>
                  <div className="dash-sh-pa-sub">Make this night a memory worth keeping forever</div>
                </div>
              </div>
            )}

            <div className="dash-sh-story">
              <div className="dash-sh-sec-lbl">Tonight's story</div>
              {activeShardCard.storyTitle ? (
                <div className="dash-sh-story-card">
                  <div className="dash-sh-story-title">{activeShardCard.storyTitle}</div>
                  {activeShardCard.quote && (
                    <div className="dash-sh-story-refrain">"{activeShardCard.quote}"</div>
                  )}
                  {activeShardStory && onReadStory ? (
                    <button className="dash-sh-read-btn" onClick={()=>{closeSheet();onReadStory(activeShardStory.bookData);}}>
                      📖 Read this story again →
                    </button>
                  ) : (
                    <div className="dash-sh-no-story">Story not available to re-read</div>
                  )}
                </div>
              ) : (
                <div className="dash-sh-no-story">No story recorded for this night</div>
              )}
            </div>

            {(activeShardCard.bondingQuestion || activeShardCard.bondingAnswer) && (
              <div className="dash-sh-bond">
                <div className="dash-sh-sec-lbl">What {activeShardCard.heroName} said</div>
                <div className="dash-sh-bond-card">
                  {activeShardCard.bondingQuestion && (
                    <div className="dash-sh-bq">{activeShardCard.bondingQuestion}</div>
                  )}
                  {activeShardCard.bondingAnswer && (
                    <div className="dash-sh-ba">"{activeShardCard.bondingAnswer}"</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* BOTTOM TABS */}
      <div className="dash-tabs">
        <div className={`dash-tab ${!tonightDone?'on':'on-t'}`}>
          <div className="dash-tab-ico">🏠</div>
          <div className="dash-tab-lbl">Home</div>
          {!tonightDone&&<div className="dash-tab-pip"/>}
        </div>
        <div className="dash-tab" onClick={()=>setView('story-wizard' as any)}>
          <div className="dash-tab-ico">✨</div>
          <div className="dash-tab-lbl">Create</div>
        </div>
        <div className="dash-tab" onClick={()=>setView('library')}>
          <div className="dash-tab-ico">📚</div>
          <div className="dash-tab-lbl">Library</div>
        </div>
        <div className="dash-tab" onClick={()=>setView('hatchery')}>
          <div className="dash-tab-ico">🥚</div>
          <div className="dash-tab-lbl">Hatchery</div>
        </div>
      </div>
    </div>
  );
}
