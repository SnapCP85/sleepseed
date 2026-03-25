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

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,700&family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
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
.dash{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:100px}
@keyframes twk{0%,100%{opacity:.15}50%{opacity:.85}}
@keyframes twk2{0%,100%{opacity:.35}60%{opacity:.1}}
@keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pring{0%,100%{box-shadow:0 0 0 2px rgba(232,151,42,.55)}50%{box-shadow:0 0 0 8px rgba(232,151,42,0)}}
@keyframes pring-t{0%,100%{box-shadow:0 0 0 2px rgba(29,158,117,.55)}50%{box-shadow:0 0 0 8px rgba(29,158,117,0)}}
@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}
@keyframes miss-fade{0%{opacity:0;transform:translateY(-4px)}15%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
@keyframes hatchBurst{0%{transform:scale(1)}30%{transform:scale(1.15) rotate(3deg)}60%{transform:scale(1.08) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
@keyframes gA{0%,100%{filter:drop-shadow(0 0 14px rgba(245,184,76,.5))}50%{filter:drop-shadow(0 0 40px rgba(245,184,76,1))}}
@keyframes gT{0%,100%{filter:drop-shadow(0 0 12px rgba(20,216,144,.45))}50%{filter:drop-shadow(0 0 38px rgba(20,216,144,.95))}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes zzz{0%{opacity:0;transform:translate(0,0) scale(.45)}35%{opacity:.78}100%{opacity:0;transform:translate(12px,-20px) scale(1.25)}}
@keyframes cel{0%{transform:scale(0) rotate(-20deg);opacity:0}55%{transform:scale(1.14) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes progFill{from{width:0}to{width:var(--pw)}}
@keyframes au{0%,100%{opacity:.07;transform:translateX(-50%) scale(1)}50%{opacity:.24;transform:translateX(-50%) scale(1.08)}}
@keyframes iconPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}

.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;border-radius:50%;background:#fff;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.dash-star2{position:absolute;border-radius:50%;background:#E8D8FF;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.dash-star3{position:absolute;border-radius:50%;background:#fde68a;animation:twk var(--d,2.5s) var(--dl,0s) ease-in-out infinite}
.dash-sky{position:fixed;top:0;left:0;right:0;height:300px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}

/* ── TOP NAV ── */
.dash-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:56px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.dash-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:7px;flex-shrink:0}
.dash-logo-moon{width:15px;height:15px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;flex-shrink:0}
.dash-logo-moon-sh{position:absolute;width:14px;height:14px;border-radius:50%;background:#050916;top:-3px;left:-6px}
.dash-nav-child{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:4px 10px 4px 7px;cursor:pointer}
.dash-nav-child-name{font-family:var(--cta);font-size:11px;font-weight:800;color:rgba(255,255,255,.6)}

/* ── SKELETON ── */
.dash-skel{background:rgba(255,255,255,.04);border-radius:8px;animation:shimmer 1.5s ease-in-out infinite}

/* ── CONTENT ── */
.dash-inner{max-width:860px;margin:0 auto;padding:0 5% 24px;position:relative;z-index:5}
.dash-greet-row{padding-top:18px;margin-bottom:10px;position:relative;z-index:5}
.dash-greet-time{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,184,76,.44);margin-bottom:3px}
.dash-greet{font-family:var(--serif);font-size:clamp(19px,3.2vw,28px);font-weight:700;color:var(--cream);letter-spacing:-.02em;line-height:1.2}
.dash-greet em{font-style:italic;color:var(--amber2)}
.dash-greet em.done{color:var(--teal2)}
.dash-date{font-size:9px;color:rgba(244,239,232,.18);font-family:var(--mono);letter-spacing:.05em}

/* guest */
.dash-guest{background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.13);border-radius:12px;padding:11px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.dash-u-btn{width:100%;padding:18px 20px;border:none;border-radius:17px;cursor:pointer;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;transition:transform .18s,filter .2s;box-shadow:0 1px 0 rgba(255,255,255,.18) inset}
.dash-u-btn:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.1)}
.dash-u-btn:active{transform:scale(.97)}
.dash-u-btn::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.8s ease-in-out infinite}
.dash-u-btn-ico{font-size:28px;flex-shrink:0;position:relative;z-index:1}
.dash-u-btn-texts{flex:1;text-align:left;position:relative;z-index:1}
.dash-u-btn-title{font-size:18px;font-weight:800;display:block;line-height:1.18;margin-bottom:1px}
.dash-u-btn-sub{font-size:10px;font-weight:700;display:block;opacity:.5}
.dash-u-btn-arr{font-size:24px;flex-shrink:0;position:relative;z-index:1;opacity:.38}

/* ── PODS ── */
.dash-pods{display:flex;gap:8px;padding:0 0 6px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.dash-pod{flex:0 0 auto;min-width:80px;max-width:140px;border-radius:20px;padding:10px 10px 9px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;border:2px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);transition:all .28s}
.dash-pod.on{transform:scale(1.05);box-shadow:0 0 20px rgba(245,184,76,.2),0 0 0 1px rgba(245,184,76,.1) inset}
.dash-pod-emoji{font-size:32px;line-height:1;transition:all .25s}
.dash-pod.on .dash-pod-emoji{filter:drop-shadow(0 0 11px rgba(245,184,76,.4));animation:flt 3.5s ease-in-out infinite}
.dash-pod-name{font-size:12px;font-weight:800;color:rgba(255,255,255,.5);transition:color .25s}
.dash-pod.on .dash-pod-name{color:#FFE080}

/* ── CREATURE CARD ── */
.dash-ac{border-radius:24px;overflow:hidden;position:relative;background:rgba(6,10,30,.88);border:1px solid rgba(245,184,76,.11);padding:18px 16px 16px;margin-bottom:10px}
.dash-ac-aura{position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.06),transparent 70%);top:-70px;left:50%;animation:au 7s ease-in-out infinite;pointer-events:none;transform:translateX(-50%)}
.dash-ac-aura.teal{background:radial-gradient(circle,rgba(20,216,144,.07),transparent 70%)}
.dash-ac-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.dash-ac-emowrap{position:relative;flex-shrink:0}
.dash-ac-emo{font-size:68px;line-height:1;display:inline-block;animation:flt 5s ease-in-out infinite,gA 5s ease-in-out infinite}
.dash-ac-emo.teal{animation:flt 5s ease-in-out infinite,gT 4.5s ease-in-out infinite}
.dash-ac-stagebadge{position:absolute;bottom:-2px;right:-4px;background:linear-gradient(135deg,#8a4a08,#F5B84C);border-radius:10px;padding:2px 7px;font-family:var(--mono);font-size:7.5px;color:#020100;letter-spacing:.04em;font-weight:500}
.dash-ac-cname{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--cream);margin-bottom:2px;line-height:1.1}
.dash-ac-ctype{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,184,76,.42);margin-bottom:7px}
.dash-ac-ctype.teal{color:rgba(20,216,144,.42)}
.dash-ac-wisdom{font-family:var(--serif);font-size:12px;font-style:italic;color:rgba(255,255,255,.56);line-height:1.65;border-left:2px solid rgba(245,184,76,.28);padding-left:9px}
.dash-ac-wisdom.teal{border-left-color:rgba(20,216,144,.28)}

/* ── INFO ICON ── */
.dash-info-trigger{display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none;-webkit-user-select:none;padding:2px 0;transition:opacity .18s}
.dash-info-trigger:hover{opacity:.82}
.dash-info-lbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.09em;text-transform:uppercase;transition:color .18s}
.dash-info-lbl.amber{color:rgba(245,184,76,.5)}
.dash-info-lbl.teal{color:rgba(20,216,144,.45)}
.dash-info-lbl.muted{color:rgba(255,255,255,.22)}
.dash-info-ico{width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:8px;font-weight:700;cursor:pointer;transition:all .18s;flex-shrink:0;line-height:1}
.dash-info-ico.amber{border:1px solid rgba(245,184,76,.35);background:rgba(245,184,76,.08);color:rgba(245,184,76,.6)}
.dash-info-ico.teal{border:1px solid rgba(20,216,144,.35);background:rgba(20,216,144,.08);color:rgba(20,216,144,.6)}
.dash-info-ico.muted{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:rgba(255,255,255,.35)}
.dash-info-ico.open{background:rgba(245,184,76,.18);border-color:rgba(245,184,76,.65);color:rgba(245,184,76,.95)}
.dash-info-ico.open.muted{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.35);color:rgba(255,255,255,.7)}
.dash-info-ico.first-time{animation:iconPulse 1.4s ease-in-out 3;background:rgba(245,184,76,.14);border-color:rgba(245,184,76,.5)}

/* ── EXPLAIN PANEL ── */
.dash-explain{overflow:hidden;max-height:0;opacity:0;transition:max-height .32s cubic-bezier(.4,0,.2,1),opacity .28s ease}
.dash-explain.open{max-height:400px;opacity:1}
.dash-explain-inner{border-radius:13px;padding:12px 13px;margin-bottom:9px;position:relative;overflow:hidden}
.dash-explain-inner.amber{background:rgba(245,184,76,.05);border:1px solid rgba(245,184,76,.18)}
.dash-explain-inner.teal{background:rgba(20,216,144,.05);border:1px solid rgba(20,216,144,.18)}
.dash-explain-inner.muted{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}
.dash-exp-title{font-family:var(--serif);font-size:12.5px;font-weight:700;color:var(--cream);margin-bottom:8px;display:flex;align-items:center;gap:6px}
.dash-exp-row{display:flex;align-items:flex-start;gap:9px;margin-bottom:6px}
.dash-exp-ico{width:18px;height:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;margin-top:2px;border-radius:50%}
.dash-exp-txt{font-family:var(--serif);font-size:11.5px;font-style:italic;color:rgba(255,255,255,.62);line-height:1.6}
.dash-exp-txt em{font-style:normal;font-weight:700;color:var(--amber2)}
.dash-exp-txt em.teal{color:#14d890}
.dash-exp-divider{height:1px;background:rgba(255,255,255,.07);margin:8px 0}
.dash-exp-sublbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.09em;text-transform:uppercase;color:rgba(245,184,76,.4);margin-bottom:5px}
.dash-exp-sublbl.muted{color:rgba(255,255,255,.2)}
.dash-exp-swatches{display:flex;gap:6px;flex-wrap:wrap}
.dash-swatch{display:flex;align-items:center;gap:4px}
.dash-sw-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dash-sw-txt{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.38);letter-spacing:.03em}
.dash-exp-legend{display:flex;flex-direction:column;gap:4px}
.dash-leg-row{display:flex;align-items:center;gap:7px}
.dash-leg-ico{font-size:13px;flex-shrink:0;width:18px;text-align:center}
.dash-leg-txt{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.38);letter-spacing:.03em}
.dash-exp-dismiss{width:100%;margin-top:8px;padding:6px;background:none;border:1px solid rgba(245,184,76,.15);border-radius:8px;font-family:var(--serif);font-size:10px;font-style:italic;color:rgba(245,184,76,.45);cursor:pointer;transition:all .18s}
.dash-exp-dismiss.muted{border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.3)}
.dash-exp-dismiss:hover{background:rgba(245,184,76,.06);color:rgba(245,184,76,.7)}
.dash-first-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(245,184,76,.1);border:1px solid rgba(245,184,76,.28);border-radius:20px;padding:3px 10px;margin-bottom:8px}
.dash-first-badge-dot{width:4px;height:4px;border-radius:50%;background:var(--amber2);animation:twk 2s ease-in-out infinite}
.dash-first-badge-txt{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,184,76,.65)}

/* ── SHARD TRACK ── */
.dash-shard-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.dash-shard-pos{font-family:var(--serif);font-size:10px;font-style:italic;color:rgba(245,184,76,.62);cursor:pointer;transition:color .18s}
.dash-shard-pos.teal{color:rgba(20,216,144,.6)}
.dash-shard-wrap{position:relative;flex-shrink:0}
.dash-shard{width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;transition:transform .18s,box-shadow .18s}
.dash-shard.done{border:2px solid rgba(245,184,76,.5);background:rgba(245,184,76,.12)}
.dash-shard.done.teal{border-color:rgba(20,216,144,.55);background:rgba(20,216,144,.12)}
.dash-shard.tonight{border:2px solid rgba(245,184,76,.42);background:rgba(245,184,76,.07);animation:pring 2.5s ease-in-out infinite}
.dash-shard.tonight-done{border:2px solid rgba(20,216,144,.72);background:rgba(20,216,144,.18);animation:pop .5s ease .1s both}
.dash-shard.future{background:rgba(245,184,76,.02);border:1.5px dashed rgba(245,184,76,.14);cursor:default}
.dash-shard.future.teal{background:rgba(20,216,144,.02);border-color:rgba(20,216,144,.12)}
.dash-shard.tapped{transform:scale(.9);box-shadow:0 0 0 3px rgba(20,216,144,.35)}
.dash-shard:hover:not(.future){transform:scale(1.14)}
.dash-shard-conn{flex:1;height:1px;background:rgba(245,184,76,.1)}
.dash-shard-conn.teal{background:rgba(20,216,144,.1)}

/* Progress bar */
.dash-progbar{height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;margin-bottom:9px}
.dash-progfill{height:100%;background:linear-gradient(90deg,#8a4808,#F5B84C);border-radius:3px;--pw:0%;width:0;animation:progFill 1.4s ease .6s forwards}
.dash-progfill.teal{background:linear-gradient(90deg,#0a7a50,#14d890)}

/* Streak row */
.dash-streak{display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(245,184,76,.04);border-radius:12px;border:1px solid rgba(245,184,76,.1)}
.dash-streak.teal{background:rgba(20,216,144,.04);border-color:rgba(20,216,144,.1)}
.dash-streak-txt{font-family:var(--cta);font-size:12px;font-weight:800;color:rgba(245,184,76,.76);flex:1}
.dash-streak-txt.teal{color:rgba(20,216,144,.74)}
.dash-streak-num{font-family:var(--serif);font-size:17px;font-weight:700;color:#14d890}

/* ── RITUAL CTA ── */
.dash-ritual-cta{width:100%;padding:17px;border:none;border-radius:20px;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:var(--cta);font-size:17px;font-weight:800;cursor:pointer;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;box-shadow:0 12px 44px rgba(200,130,20,.48);transition:transform .18s,filter .18s;margin-bottom:10px}
.dash-ritual-cta::after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.5s ease-in-out infinite}
.dash-ritual-cta:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.08)}
.dash-ritual-cta:active{transform:scale(.97)}

/* ── WEEK BAR ── */
.dash-wkbar{margin-bottom:10px}
.dash-wkbar-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.dash-wkbar-meta{font-family:var(--mono);font-size:8px;letter-spacing:.04em}
.dash-wkbar-meta.amber{color:rgba(245,184,76,.45)}
.dash-wkbar-meta.teal{color:rgba(20,216,144,.5)}
.dash-wkdays{display:flex;gap:4px}
.dash-wkday{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.dash-wkday-name{font-family:var(--mono);font-size:7px;color:rgba(255,255,255,.2);letter-spacing:.02em}
.dash-wkday-bar{height:36px;width:100%;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .3s}
.dash-wkday-bar.done{background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.3)}
.dash-wkday-bar.today{background:rgba(245,184,76,.04);border:1.5px solid rgba(245,184,76,.42);animation:pring 2.5s ease-in-out infinite;font-size:9px;color:rgba(245,184,76,.5)}
.dash-wkday-bar.today-done{background:rgba(20,216,144,.08);border:1.5px solid rgba(20,216,144,.45)}
.dash-wkday-bar.missed{background:rgba(255,50,50,.03);border:1px solid rgba(255,60,60,.12);font-size:9px;color:rgba(255,80,80,.3)}
.dash-wkday-bar.future{background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.08)}

/* ── DONE HEADER ── */
.dash-done-hd{padding:12px 0 6px;text-align:center}
.dash-done-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(20,216,144,.07);border:1px solid rgba(20,216,144,.24);border-radius:20px;padding:4px 14px;margin-bottom:9px}
.dash-done-badge-dot{width:5px;height:5px;border-radius:50%;background:#14d890;animation:twk 2.2s ease-in-out infinite}
.dash-done-badge-txt{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.7)}
.dash-done-title{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--cream);line-height:1.2;margin-bottom:4px}
.dash-done-title em{color:#14d890;font-style:italic}
.dash-done-sub{font-family:var(--sans);font-size:11.5px;color:rgba(255,255,255,.34);line-height:1.55}

/* Creature zone */
.dash-done-cz{display:flex;flex-direction:column;align-items:center;position:relative;padding:8px 0 4px}
.dash-done-aura{position:absolute;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle,rgba(20,216,144,.09),transparent 70%);top:-40px;left:50%;animation:au 5.5s ease-in-out infinite;pointer-events:none}
.dash-done-emowrap{position:relative;display:inline-block}
.dash-done-emo{font-size:76px;line-height:1;display:inline-block;animation:flt 5s ease-in-out infinite,gT 4.5s ease-in-out infinite;position:relative;z-index:2}
.dash-zzz-p{position:absolute;font-family:var(--serif);font-style:italic;pointer-events:none}
.dash-zzz-p.z1{font-size:14px;top:6px;right:2px;color:rgba(20,216,144,.52);animation:zzz 3.2s 0s ease-out infinite}
.dash-zzz-p.z2{font-size:10px;top:18px;right:14px;color:rgba(20,216,144,.38);animation:zzz 3.2s 1s ease-out infinite}
.dash-zzz-p.z3{font-size:8px;top:24px;right:4px;color:rgba(20,216,144,.26);animation:zzz 3.2s 2s ease-out infinite}
.dash-done-cname{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);margin-top:6px}
.dash-done-cstage{font-family:var(--mono);font-size:8px;letter-spacing:.09em;text-transform:uppercase;color:rgba(20,216,144,.46);margin-top:3px}

/* ── MEMORY CARD ── */
.dash-memory{margin-bottom:10px}
.dash-memory-lbl{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:7px}
.dash-memory-card{background:linear-gradient(148deg,rgba(8,12,32,.96),rgba(14,18,46,.96));border:1px solid rgba(160,96,240,.2);border-radius:18px;padding:14px;position:relative;overflow:hidden;cursor:pointer;transition:border-color .2s}
.dash-memory-card:hover{border-color:rgba(160,96,240,.38)}
.dash-memory-card-sh{position:absolute;inset:0;background:linear-gradient(138deg,transparent 38%,rgba(160,96,240,.04) 50%,transparent 62%);pointer-events:none}
.dash-memory-title{font-family:var(--serif);font-size:13px;font-weight:700;color:var(--cream);line-height:1.35;margin-bottom:8px}
.dash-memory-quote{font-family:var(--serif);font-size:12.5px;font-style:italic;color:rgba(255,255,255,.68);line-height:1.68;border-left:2px solid rgba(160,96,240,.4);padding-left:10px;margin-bottom:10px}
.dash-memory-date{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.22);letter-spacing:.04em}

/* ── RE-READ ── */
.dash-ly{background:rgba(10,12,24,.97);border:.5px solid rgba(255,255,255,.05);border-left:2.5px solid var(--amber);border-radius:0 10px 10px 0;padding:8px 13px;display:flex;align-items:flex-start;gap:8px;margin-bottom:11px;cursor:pointer;transition:background .18s}
.dash-ly:hover{background:rgba(14,16,30,.97)}
.dash-ly-ico{font-size:10px;color:var(--amber);flex-shrink:0;margin-top:1px}
.dash-ly-text{font-size:10.5px;color:var(--dim);line-height:1.6}
.dash-ly-text em{color:var(--amber2);font-style:italic}
.dash-week-lnk{font-size:9px;color:var(--amber);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.dash-week-lnk:hover{color:var(--amber2)}

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

/* ── HATCH MODAL ── */
.dash-hatch-modal{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;animation:fadein .3s ease}
.dash-hatch-inner{text-align:center;animation:fadein .4s ease-out;max-width:340px;padding:24px}
.dash-hatch-creature{font-size:96px;animation:hatchBurst .6s ease-out;display:inline-block;margin-bottom:18px;filter:drop-shadow(0 0 32px rgba(20,216,144,.6))}
.dash-hatch-title{font-family:var(--serif);font-size:24px;color:var(--cream);margin-bottom:8px;line-height:1.3;font-style:italic}
.dash-hatch-title em{color:#14d890}
.dash-hatch-sub{font-size:13px;color:rgba(244,239,232,.4);line-height:1.65;margin-bottom:20px}
.dash-hatch-btn{padding:16px 32px;border:none;border-radius:18px;font-size:17px;font-weight:800;cursor:pointer;font-family:var(--cta);background:linear-gradient(135deg,#0a7a50,#14d890 50%,#0a7a50);color:#041a0c;box-shadow:0 8px 28px rgba(20,200,130,.35);transition:transform .18s,filter .18s}
.dash-hatch-btn:hover{transform:scale(1.03) translateY(-1px);filter:brightness(1.08)}

/* ── BOTTOM SHEET ── */
.dash-sheet-bd{position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:60;animation:fadein .22s ease}
.dash-sheet{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(168deg,#080c24,#060a1c);border-radius:22px 22px 0 0;border:1px solid rgba(160,96,240,.22);z-index:61;max-height:78vh;overflow-y:auto;scrollbar-width:none;animation:sheetUp .28s ease-out;padding-bottom:env(safe-area-inset-bottom,0px)}
.dash-sheet::-webkit-scrollbar{display:none}
@media(min-width:600px){.dash-sheet{left:50%;right:auto;bottom:50%;transform:translateX(-50%) translateY(50%);width:100%;max-width:480px;border-radius:22px;max-height:80vh;animation:none;box-shadow:0 24px 80px rgba(0,0,0,.85),0 0 0 1px rgba(160,96,240,.25)}}
.dash-sheet-handle{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.15);margin:12px auto 8px}
@media(min-width:600px){.dash-sheet-handle{display:none}}
.dash-sh-hd{padding:0 16px 12px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:flex-start;justify-content:space-between}
.dash-sh-night{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.65);display:block;margin-bottom:3px}
.dash-sh-memory{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(255,255,255,.35)}
.dash-sh-memory em{color:rgba(245,184,76,.7);font-style:normal;font-weight:700}
.dash-sh-close{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.07);border:none;color:rgba(255,255,255,.4);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .18s}
.dash-sh-close:hover{background:rgba(255,255,255,.13)}
.dash-sh-wisdom{padding:12px 16px;display:flex;align-items:flex-start;gap:10px;background:rgba(20,216,144,.04);border-bottom:1px solid rgba(255,255,255,.05)}
.dash-sh-wis-lbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.45);margin-bottom:4px}
.dash-sh-wis-txt{font-family:var(--serif);font-size:13px;font-style:italic;color:rgba(255,255,255,.72);line-height:1.6}
.dash-sh-photo{margin:12px 16px 0;border-radius:14px;overflow:hidden;position:relative}
.dash-sh-photo-add{margin:12px 16px 0;background:rgba(255,255,255,.02);border:1.5px dashed rgba(245,184,76,.2);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s}
.dash-sh-photo-add:hover{background:rgba(245,184,76,.04);border-color:rgba(245,184,76,.35)}
.dash-sh-pa-ico{width:44px;height:44px;border-radius:13px;background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.dash-sh-pa-title{font-family:var(--cta);font-size:13px;font-weight:800;color:rgba(255,255,255,.52);margin-bottom:3px}
.dash-sh-pa-sub{font-family:var(--sans);font-size:10.5px;color:rgba(255,255,255,.26);line-height:1.45}
.dash-sh-story{padding:12px 16px}
.dash-sh-sec-lbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:7px}
.dash-sh-story-card{background:rgba(255,255,255,.03);border:1px solid rgba(160,96,240,.18);border-radius:13px;padding:12px}
.dash-sh-story-title{font-family:var(--serif);font-size:13px;font-weight:700;color:var(--cream);line-height:1.3;margin-bottom:7px}
.dash-sh-refrain{font-family:var(--serif);font-size:12px;font-style:italic;color:rgba(255,255,255,.58);line-height:1.65;border-left:2px solid rgba(160,96,240,.38);padding-left:9px;margin-bottom:10px}
.dash-sh-read-btn{width:100%;padding:11px;border:none;border-radius:12px;background:rgba(160,96,240,.12);border:1px solid rgba(160,96,240,.32);color:#c090ff;font-family:var(--cta);font-size:12.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;position:relative;overflow:hidden}
.dash-sh-read-btn::after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.1),transparent);animation:shimmer 3s ease-in-out infinite}
.dash-sh-read-btn:hover{background:rgba(160,96,240,.22);border-color:rgba(160,96,240,.5);transform:translateY(-1px)}
.dash-sh-no-story{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(255,255,255,.28);text-align:center;padding:6px 0}
.dash-sh-bond{padding:0 16px 16px}
.dash-sh-bond-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:11px 13px}
.dash-sh-bq{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(255,255,255,.38);margin-bottom:6px;line-height:1.5}
.dash-sh-ba{font-family:var(--sans);font-size:13px;font-weight:700;color:rgba(255,255,255,.75);line-height:1.5}

/* ── PROFILE AVATAR ── */
.dash-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,#1a0e32,#2e1858);border:1.5px solid rgba(160,96,240,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .22s;flex-shrink:0;position:relative}
.dash-avatar:hover{border-color:rgba(160,96,240,.62);background:linear-gradient(145deg,#2e1858,#4818a0)}
.dash-avatar-pip{position:absolute;bottom:-1px;right:-1px;width:8px;height:8px;border-radius:50%;background:#14d890;border:1.5px solid var(--night)}

/* ── NEW NAV BAR ── */
.dash-navbar{position:fixed;bottom:0;left:0;right:0;height:72px;background:linear-gradient(180deg,rgba(2,4,12,.94) 0%,rgba(4,6,18,.98) 100%);border-top:1px solid rgba(255,255,255,.06);backdrop-filter:blur(24px);display:flex;align-items:center;justify-content:space-around;padding:4px 6px 0;z-index:30;padding-bottom:max(4px,env(safe-area-inset-bottom))}
.dash-navbar::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,.14),transparent)}
.dash-nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;padding:10px 4px 12px;transition:all .2s;-webkit-tap-highlight-color:transparent;position:relative;border-radius:14px}
.dash-nav-tab svg{transition:opacity .2s,transform .2s;opacity:.28}
.dash-nav-tab-lbl{font-family:var(--mono);font-size:7.5px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.22);transition:color .2s;white-space:nowrap}
.dash-nav-tab.on::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:24px;height:2px;border-radius:0 0 2px 2px}
.dash-nav-tab.on-amber{background:rgba(245,184,76,.06)}
.dash-nav-tab.on-amber::after{background:linear-gradient(90deg,transparent,#F5B84C,transparent)}
.dash-nav-tab.on-amber svg{opacity:1}
.dash-nav-tab.on-amber .dash-nav-tab-lbl{color:rgba(245,184,76,.82)}
.dash-nav-tab.on-purple{background:rgba(160,96,240,.06)}
.dash-nav-tab.on-purple::after{background:linear-gradient(90deg,transparent,#c090ff,transparent)}
.dash-nav-tab.on-purple svg{opacity:1}
.dash-nav-tab.on-purple .dash-nav-tab-lbl{color:rgba(160,96,240,.78)}
.dash-nav-tab:active svg{transform:scale(.88)}

/* ── CENTRE CREATE ── */
.dash-nav-create{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;-webkit-tap-highlight-color:transparent;margin-top:-20px;padding-bottom:4px;position:relative}
.dash-nav-create-ring{position:absolute;width:70px;height:70px;border-radius:50%;pointer-events:none;box-shadow:0 0 0 1px rgba(245,184,76,.14),0 0 28px rgba(245,184,76,.2),0 0 56px rgba(245,184,76,.08);animation:pglow 3.5s ease-in-out infinite}
@keyframes pglow{0%,100%{box-shadow:0 0 0 1px rgba(245,184,76,.14),0 0 28px rgba(245,184,76,.2)}50%{box-shadow:0 0 0 1px rgba(245,184,76,.22),0 0 38px rgba(245,184,76,.45)}}
.dash-nav-create-btn{width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 38% 32%,rgba(255,235,140,.35) 0%,transparent 60%),linear-gradient(145deg,#b07018,#F5B84C 42%,#c88020 68%,#a06010);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;transition:transform .18s,filter .18s;box-shadow:0 0 0 1.5px rgba(255,230,120,.28),0 6px 20px rgba(180,110,10,.6),inset 0 1px 0 rgba(255,240,160,.22)}
.dash-nav-create-btn::after{content:'';position:absolute;top:-20%;left:-60%;width:40%;height:140%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.17),transparent);transform:skewX(-15deg);animation:shimmer 3.2s ease-in-out infinite}
.dash-nav-create-btn:active{transform:scale(.91);filter:brightness(.88)}
.dash-nav-create-lbl{font-family:var(--serif);font-size:9px;font-style:italic;color:rgba(245,184,76,.52);letter-spacing:.01em;white-space:nowrap}

/* unread dot */
.dash-nav-unread{position:absolute;top:10px;right:calc(50% - 16px);width:7px;height:7px;border-radius:50%;background:#c090ff;border:1.5px solid var(--night);animation:twk 2s ease-in-out infinite}

/* ── MY STUFF SHEET ── */
.dash-ms-bd{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:60;animation:fadein .22s ease}
.dash-ms-sheet{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(175deg,#080b20 0%,#06091a 100%);border-radius:24px 24px 0 0;border-top:1px solid rgba(255,255,255,.07);z-index:61;padding-bottom:max(16px,env(safe-area-inset-bottom));animation:sheetUp .28s cubic-bezier(.22,.68,0,1.2);overflow:hidden}
.dash-ms-sheet::before{content:'';position:absolute;top:0;left:25%;right:25%;height:1px;background:linear-gradient(90deg,transparent,rgba(160,96,240,.35),transparent)}
@media(min-width:600px){.dash-ms-sheet{left:50%;right:auto;bottom:50%;transform:translateX(-50%) translateY(50%);width:100%;max-width:420px;border-radius:24px;animation:none;box-shadow:0 24px 80px rgba(0,0,0,.85),0 0 0 1px rgba(160,96,240,.22)}.dash-ms-sheet::before{display:none}}
.dash-ms-handle{width:32px;height:3px;border-radius:2px;background:rgba(255,255,255,.12);margin:13px auto 10px}
@media(min-width:600px){.dash-ms-handle{display:none}}
.dash-ms-hd{display:flex;align-items:center;justify-content:space-between;padding:2px 18px 14px;border-bottom:1px solid rgba(255,255,255,.05)}
.dash-ms-title{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--cream);font-style:italic}
.dash-ms-close{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.35);font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s}
.dash-ms-close:hover{background:rgba(255,255,255,.11);color:rgba(255,255,255,.6)}
.dash-ms-row{display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;transition:background .18s;border-bottom:1px solid rgba(255,255,255,.04);position:relative;overflow:hidden}
.dash-ms-row:last-child{border-bottom:none}
.dash-ms-row:hover{background:rgba(255,255,255,.03)}
.dash-ms-row:active{background:rgba(255,255,255,.06)}
.dash-ms-row::before{content:'';position:absolute;left:0;top:18%;bottom:18%;width:2.5px;border-radius:2px;opacity:0;transition:opacity .2s}
.dash-ms-row:hover::before{opacity:1}
.dash-ms-row.books::before{background:#F5B84C}
.dash-ms-row.cards::before{background:#c090ff}
.dash-ms-row.hatch::before{background:#14d890}
.dash-ms-ico{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.dash-ms-label{flex:1}
.dash-ms-row-title{font-family:var(--serif);font-size:14px;font-weight:700;color:var(--cream);margin-bottom:2px}
.dash-ms-row-sub{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.26);letter-spacing:.04em}
.dash-ms-badge{padding:2px 9px;border-radius:20px;font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:.04em;flex-shrink:0}
.dash-ms-arr{font-size:14px;color:rgba(255,255,255,.18);flex-shrink:0}

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

// ── Nav SVG icons ─────────────────────────────────────────────────────────────

const NavIconDiscover = ({color='rgba(255,255,255,.55)'}:{color?:string}) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.2"/><path d="M11 3v1M11 18v1M3 11h1M18 11h1" stroke={color} strokeWidth="1.2" strokeLinecap="round"/><circle cx="11" cy="11" r="2.5" stroke={color} strokeWidth="1.2"/><path d="M13.5 8.5l-1.2 3.7-3.7 1.2 1.2-3.7z" fill={color}/></svg>
);
const NavIconCreate = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{position:'relative',zIndex:2}}><path d="M15 4l2.7 8.2H26l-6.9 5 2.6 8.2L15 20.4l-6.7 5 2.6-8.2L4 12.2h8.3z" fill="rgba(10,5,0,.85)"/></svg>
);
const NavIconMyStuff = ({color='rgba(255,255,255,.55)'}:{color?:string}) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="10" width="16" height="10" rx="2" stroke={color} strokeWidth="1.2"/><path d="M3 11a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" stroke={color} strokeWidth="1.2"/><rect x="9.5" y="14" width="3" height="2.5" rx="1" stroke={color} strokeWidth="1.1"/><path d="M3 11h16" stroke={color} strokeWidth="1.2"/><circle cx="7" cy="15.5" r=".8" fill={color} opacity=".3"/><circle cx="15" cy="15.5" r=".8" fill={color} opacity=".3"/></svg>
);
const NavIconProfile = ({color='#c090ff'}:{color?:string}) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke={color} strokeWidth="1.2"/><path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>
);
const NavIconBooks = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="3" width="14" height="16" rx="1.5" stroke="#F5B84C" strokeWidth="1.2"/><path d="M7 8h8M7 11h8M7 14h5" stroke="#F5B84C" strokeWidth="1.1" strokeLinecap="round"/><path d="M4 3h1.5" stroke="#F5B84C" strokeWidth="1.4" strokeLinecap="round"/></svg>
);
const NavIconNightCards = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="12" rx="2" stroke="#c090ff" strokeWidth="1.2"/><path d="M3 9h16" stroke="#c090ff" strokeWidth="1.1"/><circle cx="7" cy="7" r="1.2" fill="#c090ff" opacity=".6"/><path d="M12 12a2.5 2.5 0 1 1 2.5-2.5 1.8 1.8 0 0 0-2.5 2.5z" fill="rgba(160,96,240,.5)" stroke="#c090ff" strokeWidth=".8"/></svg>
);
const NavIconHatchery = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3C7.5 3 5 6.5 5 10.5 5 15 7.5 19 11 19c3.5 0 6-4 6-8.5C17 6.5 14.5 3 11 3z" stroke="#14d890" strokeWidth="1.2"/><path d="M9 13l2-2.5 2 1.5" stroke="#14d890" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="10" r="1.5" fill="rgba(20,216,144,.5)"/></svg>
);

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
  const[activeShardIdx,setActiveShardIdx]=useState<number|null>(null);
  const[shardsInfoOpen,setShardsInfoOpen]=useState(false);
  const[weekInfoOpen,setWeekInfoOpen]=useState(false);
  const[shardsFirstTime,setShardsFirstTime]=useState(false);
  const[myStuffOpen,setMyStuffOpen]=useState(false);
  const missTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isGuest=!!user?.isGuest;

  const isNewUser=useMemo(()=>{
    if(!user?.createdAt) return false;
    const created=new Date(user.createdAt).getTime();
    return (Date.now()-created)<10*60*1000;
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
      const fc=chars.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human'));
      if(fc.length>0){setSelectedCharacters([fc[0]]);setWeekViewId(fc[0].id);}
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

  useEffect(()=>{
    if(!hasSupabase||!user||!primary) return;
    getActiveEgg(user.id,primary.id).then(egg=>{
      if(egg){setActiveEgg(egg);}
      else{const rc=CREATURES[Math.floor(Math.random()*CREATURES.length)];createEgg(user.id,primary.id,rc.id,1).then(setActiveEgg).catch(()=>{});}
    });
  },[user,primary?.id]); // eslint-disable-line

  const glow=useMemo(()=>weekChild?calculateGlow(allCards,weekChild.id):0,[allCards,weekChild]);
  const week=useMemo(()=>weekChild?getWeekNights(allCards,weekChild.id):[],[allCards,weekChild]);
  const lyCard=useMemo(()=>primary?getLastYearCard(allCards,primary.id):null,[allCards,primary]);

  const eggStage=useMemo(()=>{
    if(!activeEgg) return 0;
    const startDate=activeEgg.startedAt.split('T')[0];
    const count=allCards.filter(card=>card.characterIds.includes(activeEgg.characterId)&&card.date.split('T')[0]>=startDate).length;
    return Math.min(count,7);
  },[activeEgg,allCards]);

  const eggCards=useMemo(()=>{
    if(!activeEgg) return [];
    const startDate=activeEgg.startedAt.split('T')[0];
    return allCards.filter(c=>c.characterIds.includes(activeEgg.characterId)&&c.date.split('T')[0]>=startDate).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,7);
  },[activeEgg,allCards]);

  const weekDone=week.filter(n=>n.state==='complete').length;
  const weekNum=Math.floor(glow/7);
  const constName=constellationName(weekNum);

  const todayStr=dateStr(new Date());
  const tonightDone=!!allCards.find(c=>primary&&cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===todayStr);
  const tonightCard=allCards.find(c=>primary&&cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===todayStr)??null;

  const hour=new Date().getHours();
  const greetWord=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const today=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

  const creatureDef=useMemo(()=>activeEgg?getCreature(activeEgg.creatureType):null,[activeEgg]);
  const tonightLesson=useMemo(()=>(!creatureDef||eggStage>=7)?null:creatureDef.lessonBeats[eggStage]??null,[creatureDef,eggStage]);
  const creatureSpeech=useMemo(()=>{
    if(!hatchedCreature) return '';
    const n=hatchedCreature.name;
    if(tonightDone) return `${n} is fast asleep\u2026 sweet dreams.`;
    if(creatureDef&&eggStage<7) return creatureDef.dailyWisdom[eggStage]??`${n} is ready for tonight!`;
    return `${n} is ready for tonight's adventure!`;
  },[hatchedCreature,tonightDone,creatureDef,eggStage]);

  // ── New computed values ────────────────────────────────────────────────────
  const childName=primary?.name??'your child';
  const barWidth=`${Math.round((eggStage/7)*100)}%`;
  const nightsLeft=Math.max(0,7-eggStage);
  const nightsLeftLabel=nightsLeft===0?'Ready to hatch! \u2726':`${nightsLeft} night${nightsLeft!==1?'s':''} to hatch \u2726`;
  const DAY_NAMES=['MON','TUE','WED','THU','FRI','SAT','SUN'];

  const totalMemories=useMemo(()=>allCards.filter(c=>primary&&cardBelongsTo(c,primary.id)).length,[allCards,primary]);

  function getMemoryNumber(card: SavedNightCard): number {
    const sorted=allCards.filter(c=>primary&&cardBelongsTo(c,primary.id)).sort((a,b)=>a.date.localeCompare(b.date));
    return sorted.findIndex(c=>c.id===card.id)+1;
  }

  const activeShardCard=useMemo(()=>activeShardIdx!==null?(eggCards[activeShardIdx]??null):null,[activeShardIdx,eggCards]);
  const activeShardStory=useMemo(()=>{
    if(!activeShardCard?.storyId) return null;
    return allStories.find(s=>s.id===activeShardCard.storyId)??null;
  },[activeShardCard,allStories]);
  const activeShardWisdom=useMemo(()=>activeShardIdx===null?null:creatureDef?.dailyWisdom?.[activeShardIdx]??null,[activeShardIdx,creatureDef]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function shardColour(card: SavedNightCard|null): string {
    if(!card) return 'rgba(245,184,76,.5)';
    const vibe=(card as any).vibe??'';
    if(vibe==='silly'||vibe==='warm-funny') return '#FFD060';
    if(vibe==='exciting'||vibe==='adventure') return '#60C8FF';
    if(vibe==='mysterious') return '#C090FF';
    if(vibe==='calm-cosy'||vibe==='heartfelt') return '#F5B84C';
    return '#F5B84C';
  }
  function handleShardTap(index:number,isDone:boolean){if(!isDone)return;setActiveShardIdx(prev=>prev===index?null:index);}
  function closeSheet(){setActiveShardIdx(null);}
  function toggleShardsInfo(){setShardsInfoOpen(p=>!p);}
  function toggleWeekInfo(){setWeekInfoOpen(p=>!p);}
  function shardDateLabel(index:number):string{const card=eggCards[index];if(!card)return '';return new Date(card.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}
  function startRitual(){setRitualSeed('');setRitualMood('');setView('ritual-starter');}
  function toggleChild(c:Character){
    const ids=selectedCharacters.map(x=>x.id);
    if(ids.includes(c.id)){if(selectedCharacters.length===1)return;const next=selectedCharacters.filter(x=>x.id!==c.id);setSelectedCharacters(next);if(weekViewId===c.id)setWeekViewId(next[0]?.id??'');}
    else setSelectedCharacters([...selectedCharacters,c]);
  }
  function showMiss(idx:number){if(missTimer.current)clearTimeout(missTimer.current);setMissTooltip(idx);missTimer.current=setTimeout(()=>setMissTooltip(null),2200);}

  // ── Nav handlers ──────────────────────────────────────────────────────────
  function handleNavCreate(){setMyStuffOpen(false);setView('story-wizard' as any);}
  function handleNavDiscover(){setMyStuffOpen(false);setView('library');}
  function closeMyStuff(){setMyStuffOpen(false);}
  function handleNavMyStuff(){setMyStuffOpen(p=>!p);}
  function handleMyBooks(){closeMyStuff();setView('story-library' as any);}
  function handleNightCards(){closeMyStuff();setView('nightcard-library' as any);}
  function handleHatchery(){closeMyStuff();setView('hatchery');}
  function handleProfile(){setView('user-profile' as any);}
  const showMyStuffDot=useMemo(()=>tonightDone&&!myStuffOpen,[tonightDone,myStuffOpen]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const seen=localStorage.getItem('ss_shards_explained');
    if(!seen){setShardsFirstTime(true);setShardsInfoOpen(true);const t=setTimeout(()=>{setShardsFirstTime(false);setShardsInfoOpen(false);localStorage.setItem('ss_shards_explained','1');},6000);return ()=>clearTimeout(t);}
  },[]);

  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')closeSheet();};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[]);

  // ── Shard track renderer (shared between active & done) ────────────────────
  function renderShardTrack(tealMode:boolean){
    return(
      <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:9}}>
        {Array.from({length:7},(_,i)=>{
          const isDone=tealMode?(i<eggStage):(i<eggStage);
          const isJustNow=tealMode&&i===eggStage-1;
          const isTonight=!tealMode&&i===eggStage;
          const isFuture=tealMode?(i>=eggStage):(!isDone&&!isTonight);
          const colour=shardColour(eggCards[i]??null);
          const tappable=isDone;
          const isTapped=activeShardIdx===i;
          let cls='future';
          if(isJustNow) cls='tonight-done';
          else if(isDone) cls='done';
          else if(isTonight) cls='tonight';
          if(tealMode&&isDone&&!isJustNow) cls='done teal';
          if(tealMode&&isFuture) cls='future teal';
          return(
            <React.Fragment key={i}>
              <div className="dash-shard-wrap">
                <div className={`dash-shard ${cls}${isTapped?' tapped':''}`}
                  style={(isDone||isJustNow)?{borderColor:colour,background:colour+'22',cursor:'pointer'}:undefined}
                  onClick={()=>handleShardTap(i,tappable)}>
                  {(isDone||isJustNow)?'\u2726':isTonight?'\u00B7':'\u00B7'}
                </div>
              </div>
              {i<6&&<div className={`dash-shard-conn${tealMode?' teal':''}`}/>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ── Week bar renderer (shared) ─────────────────────────────────────────────
  function renderWeekBar(){
    return(
      <div className="dash-wkdays">
        {Array.from({length:7},(_,i)=>{
          const now=new Date();const dow=now.getDay();const mondayOff=(dow+6)%7;
          const d=new Date(now);d.setDate(now.getDate()-mondayOff+i);
          const ds=d.toISOString().split('T')[0];const ts=now.toISOString().split('T')[0];
          const isPast=ds<ts;const isToday=ds===ts;
          const done=primary&&allCards.some(c=>cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===ds);
          const cls=isToday?(tonightDone?'today-done':'today'):isPast&&done?'done':isPast?'missed':'future';
          return(
            <div key={i} className="dash-wkday">
              <div className="dash-wkday-name">{DAY_NAMES[i]}</div>
              <div className={`dash-wkday-bar ${cls}`}>
                {done||(isToday&&tonightDone)?'\u2B50':cls==='missed'?'\u2715':cls==='today'?'\u2726':''}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if(!user) return null;
  if(loading) return(
    <div className="dash" style={{minHeight:'100vh'}}>
      <style>{CSS}</style>
      <div className="dash-sky"/>
      <div className="dash-stars">{STARS.map(s=><div key={s.id} className={s.t===1?'dash-star':s.t===2?'dash-star2':'dash-star3'} style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>)}</div>
      <nav className="dash-nav"><div className="dash-logo"><div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>SleepSeed</div></nav>
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
      <div className="dash-sky"/>
      <div className="dash-stars">{STARS.slice(0,20).map(s=><div key={s.id} className={s.t===1?'dash-star':s.t===2?'dash-star2':'dash-star3'} style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>)}</div>

      {/* NAV */}
      <nav className="dash-nav" style={{background:tonightDone?'rgba(3,8,18,.92)':'rgba(4,8,22,.9)',borderBottom:tonightDone?'1px solid rgba(20,216,144,.07)':'1px solid rgba(245,184,76,.07)'}}>
        <div className="dash-logo"><div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>SleepSeed</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {primary&&<div className="dash-nav-child"><span style={{fontSize:14}}>{primary.emoji||'\uD83E\uDDD2'}</span><span className="dash-nav-child-name">{primary.name}</span></div>}
          <div className="dash-date">{today}</div>
          <div className="dash-avatar" onClick={handleProfile} title="Profile & settings"><NavIconProfile/><div className="dash-avatar-pip"/></div>
        </div>
      </nav>

      {familyChars.length>1&&(
        <div style={{padding:'10px 5% 0',position:'relative',zIndex:5}}>
          <div className="dash-pods">
            {familyChars.map(c=>{const isOn=primary?.id===c.id;return(
              <div key={c.id} className={`dash-pod${isOn?' on':''}`} onClick={()=>{setSelectedCharacters([c]);setWeekViewId(c.id);}}>
                <div className="dash-pod-emoji">{c.emoji||'\uD83E\uDDD2'}</div>
                <div className="dash-pod-name">{c.name}</div>
              </div>
            );})}
          </div>
        </div>
      )}

      <div className="dash-inner">
        {/* GUEST */}
        {isGuest&&(
          <div style={{padding:'20px 0 0'}}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:12,animation:'flt 3.5s ease-in-out infinite',filter:'drop-shadow(0 0 16px rgba(245,184,76,.3))'}}>🌙</div>
              <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--cream)',lineHeight:1.3,marginBottom:6}}>Tonight could be the night<br/><em style={{color:'var(--amber2)'}}>bedtime changes forever.</em></div>
              <div style={{fontSize:13,color:'rgba(244,239,232,.35)',lineHeight:1.65}}>A personalised bedtime story starring your child — written in 60 seconds.</div>
            </div>
            <button className="dash-u-btn" style={{width:'100%',marginBottom:20,background:'linear-gradient(145deg,#a06010,#F5B84C 48%,#a06010)',boxShadow:'0 8px 30px rgba(200,130,20,.42)'}} onClick={()=>setView('story-wizard' as any)}>
              <span className="dash-u-btn-ico">✨</span>
              <span className="dash-u-btn-texts"><span className="dash-u-btn-title" style={{color:'#080200'}}>Try your first story</span><span className="dash-u-btn-sub" style={{color:'rgba(8,2,0,.5)'}}>See the magic — no signup needed</span></span>
              <span className="dash-u-btn-arr" style={{color:'rgba(8,2,0,.38)'}}>→</span>
            </button>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,fontFamily:'var(--mono)',letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(245,184,76,.4)',marginBottom:12,fontWeight:600}}>How it works</div>
              {[{ico:'🌙',title:'You share a moment from today',sub:"What happened at school? What made them laugh?"},{ico:'✨',title:'We write their bedtime story',sub:'AI crafts a unique story starring your child.'},{ico:'🥚',title:'A DreamKeeper companion hatches',sub:'Do the ritual 7 nights and a mystery DreamKeeper arrives.'}].map((step,i)=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start'}}>
                  <div style={{fontSize:24,lineHeight:1,flexShrink:0,marginTop:2}}>{step.ico}</div>
                  <div><div style={{fontSize:13,fontWeight:700,color:'var(--cream)',marginBottom:2}}>{step.title}</div><div style={{fontSize:11,color:'rgba(244,239,232,.35)',lineHeight:1.6}}>{step.sub}</div></div>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(245,184,76,.04)',border:'1px solid rgba(245,184,76,.12)',borderRadius:16,padding:'14px 16px',marginBottom:20}}>
              <div style={{fontFamily:'var(--serif)',fontSize:13,fontStyle:'italic',color:'rgba(244,239,232,.55)',lineHeight:1.65,marginBottom:8}}>"My daughter won't go to bed without checking on her egg first."</div>
              <div style={{fontSize:10,color:'rgba(244,239,232,.25)',fontFamily:'var(--mono)'}}>Sarah M. · Mum of two</div>
            </div>
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,padding:'16px 18px',textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--cream)',marginBottom:4}}>Ready to keep your stories?</div>
              <div style={{fontSize:11,color:'rgba(244,239,232,.3)',lineHeight:1.6,marginBottom:12}}>Create a free account to save stories and unlock Night Cards.</div>
              <button style={{background:'rgba(245,184,76,.1)',border:'1px solid rgba(245,184,76,.25)',borderRadius:50,padding:'10px 24px',fontSize:13,fontWeight:600,color:'var(--amber2)',cursor:'pointer',fontFamily:'var(--sans)'}} onClick={onSignUp}>Create free account →</button>
            </div>
            <div style={{textAlign:'center',marginBottom:8}}><button style={{background:'none',border:'none',color:'rgba(244,239,232,.25)',fontSize:12,cursor:'pointer',fontFamily:'var(--sans)'}} onClick={()=>setView('library')}>Or browse stories from other families →</button></div>
          </div>
        )}

        {/* GREETING */}
        {!isGuest&&(
          <div className="dash-greet-row">
            <div className="dash-greet-time">{greetWord}</div>
            <div className="dash-greet">
              {tonightDone?<>Sweet dreams, <em className="done">{childName}.</em></>:<>Time for <em>{childName}'s</em> story 🌙</>}
            </div>
          </div>
        )}

        {/* ══════════ ACTIVE STATE ══════════ */}
        {!isGuest&&!tonightDone&&(
          <>
            {/* CREATURE + SHARDS CARD */}
            {activeEgg&&hatchedCreature&&creatureDef&&(
              <div className="dash-ac">
                <div className="dash-ac-aura"/>
                <div className="dash-ac-top">
                  <div className="dash-ac-emowrap">
                    <div className="dash-ac-emo">{hatchedCreature.creatureEmoji}</div>
                    <div className="dash-ac-stagebadge">Night {eggStage+1} of 7</div>
                  </div>
                  <div style={{flex:1,minWidth:0,paddingTop:4}}>
                    <div className="dash-ac-cname">{hatchedCreature.name}</div>
                    <div className="dash-ac-ctype">{creatureDef.name} · {childName}'s companion</div>
                    <div className="dash-ac-wisdom">"{creatureSpeech}"</div>
                  </div>
                </div>

                <div>
                  {shardsFirstTime&&<div className="dash-first-badge"><div className="dash-first-badge-dot"/><span className="dash-first-badge-txt">New · Dream Shards</span></div>}
                  <div className="dash-shard-hd">
                    <div className="dash-info-trigger" onClick={toggleShardsInfo}>
                      <span className="dash-info-lbl amber">Dream Shards</span>
                      <div className={`dash-info-ico amber${shardsInfoOpen?' open':''}${shardsFirstTime?' first-time':''}`}>{shardsInfoOpen?'✕':'ⓘ'}</div>
                    </div>
                    <div className="dash-shard-pos" onClick={toggleShardsInfo}>Shard {eggStage} of 7 ✦</div>
                  </div>

                  <div className={`dash-explain${shardsInfoOpen?' open':''}`}>
                    <div className="dash-explain-inner amber">
                      <div className="dash-exp-title">✦ What are Dream Shards?</div>
                      <div className="dash-exp-row"><div className="dash-exp-ico" style={{border:'2px solid rgba(245,184,76,.5)',background:'rgba(245,184,76,.12)'}}>✦</div><div className="dash-exp-txt">Each completed ritual earns {hatchedCreature.name} <em>one Dream Shard.</em> Collect all 7 and a new creature hatches.</div></div>
                      <div className="dash-exp-row"><div className="dash-exp-ico" style={{border:'2px solid rgba(96,200,255,.45)',background:'rgba(96,200,255,.1)'}}>✦</div><div className="dash-exp-txt">Shard <em>colours</em> reflect the mood of that night's story. Tap any completed shard to revisit that memory.</div></div>
                      <div className="dash-exp-divider"/>
                      <div className="dash-exp-sublbl">Shard colours</div>
                      <div className="dash-exp-swatches">
                        {[['#F5B84C','Heartfelt'],['#60C8FF','Adventure'],['#C090FF','Mysterious'],['#FFD060','Funny'],['#14d890','Cosy']].map(([c,l])=>(
                          <div key={l} className="dash-swatch"><div className="dash-sw-dot" style={{background:c}}/><div className="dash-sw-txt">{l}</div></div>
                        ))}
                      </div>
                      <button className="dash-exp-dismiss" onClick={()=>{setShardsInfoOpen(false);setShardsFirstTime(false);localStorage.setItem('ss_shards_explained','1');}}>Got it ✓</button>
                    </div>
                  </div>

                  {renderShardTrack(false)}

                  <div className="dash-progbar"><div className="dash-progfill" style={{'--pw':barWidth} as any}/></div>

                  <div className="dash-streak">
                    <span style={{fontSize:15}}>🔥</span>
                    <span className="dash-streak-txt">{glow>0?`${glow} night${glow!==1?'s':''} in a row`:'Complete tonight to start your streak'}</span>
                    {glow>1&&<span className="dash-streak-num">{glow}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* NO CREATURE */}
            {!hatchedCreature&&familyChars.length>0&&(
              <button className="dash-ritual-cta" onClick={startRitual}>
                <span style={{fontSize:17,fontWeight:800,fontFamily:'var(--cta)'}}>✦ Begin tonight's ritual</span>
                <span style={{fontSize:9.5,fontWeight:600,opacity:.58,marginTop:3,fontFamily:'var(--sans)'}}>Your story is waiting · ~10 minutes</span>
              </button>
            )}

            {/* NO CHARACTERS */}
            {familyChars.length===0&&(
              <div style={{textAlign:'center',marginTop:20}}>
                <div style={{fontSize:72,animation:'flt 3s ease-in-out infinite',filter:'drop-shadow(0 0 16px rgba(245,184,76,.3))',marginBottom:12}}>🥚</div>
                <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--amber2)',marginBottom:10}}>Your adventure begins tonight</div>
                <button className="dash-ritual-cta" onClick={()=>{setEditingCharacter(null);setView('onboarding');}}>
                  <span style={{fontSize:17,fontWeight:800,fontFamily:'var(--cta)'}}>✨ Start your first adventure</span>
                  <span style={{fontSize:9.5,fontWeight:600,opacity:.58,marginTop:3,fontFamily:'var(--sans)'}}>Create a character and hatch your first Dreamkeeper</span>
                </button>
              </div>
            )}

            {/* CTA */}
            {hatchedCreature&&(
              <button className="dash-ritual-cta" onClick={startRitual}>
                <span style={{fontSize:17,fontWeight:800,fontFamily:'var(--cta)'}}>✦ Begin tonight's ritual</span>
                <span style={{fontSize:9.5,fontWeight:600,opacity:.58,marginTop:3,fontFamily:'var(--sans)'}}>{hatchedCreature.name} is waiting · ~10 minutes</span>
              </button>
            )}

            {/* WEEK BAR */}
            <div className="dash-wkbar">
              <div className="dash-wkbar-hd">
                <div className="dash-info-trigger" onClick={toggleWeekInfo}>
                  <span className="dash-info-lbl muted">This week</span>
                  <div className={`dash-info-ico muted${weekInfoOpen?' open muted':''}`}>{weekInfoOpen?'✕':'ⓘ'}</div>
                </div>
                <div className="dash-wkbar-meta amber">· Memory {totalMemories}</div>
              </div>
              <div className={`dash-explain${weekInfoOpen?' open':''}`}>
                <div className="dash-explain-inner muted">
                  <div className="dash-exp-title">📅 This week's ritual</div>
                  <div className="dash-exp-row"><div className="dash-exp-ico" style={{fontSize:13}}>⭐</div><div className="dash-exp-txt" style={{color:'rgba(255,255,255,.62)'}}>Shows Monday to Sunday. Each bar is one night — fill means ritual completed.</div></div>
                  <div className="dash-exp-row"><div className="dash-exp-ico" style={{fontSize:13}}>✦</div><div className="dash-exp-txt" style={{color:'rgba(255,255,255,.62)'}}>Tonight's bar pulses. After the ritual it turns <em className="teal">teal</em>.</div></div>
                  <div className="dash-exp-divider"/><div className="dash-exp-sublbl muted">Legend</div>
                  <div className="dash-exp-legend">
                    <div className="dash-leg-row"><div className="dash-leg-ico">⭐</div><div className="dash-leg-txt">Ritual completed</div></div>
                    <div className="dash-leg-row"><div className="dash-leg-ico" style={{fontSize:11,color:'rgba(245,184,76,.5)'}}>✦</div><div className="dash-leg-txt">Tonight · not yet</div></div>
                    <div className="dash-leg-row"><div className="dash-leg-ico" style={{fontSize:10,color:'rgba(255,80,80,.4)'}}>✕</div><div className="dash-leg-txt">Missed night</div></div>
                  </div>
                  <button className="dash-exp-dismiss muted" onClick={toggleWeekInfo}>Got it ✓</button>
                </div>
              </div>
              {renderWeekBar()}
            </div>

            {/* RE-READ */}
            {lastStory&&lastStory.bookData&&onReadStory&&(
              <div className="dash-ly" onClick={()=>onReadStory(lastStory.bookData)} style={{position:'relative',zIndex:5}}>
                <span className="dash-ly-ico">📖</span>
                <span className="dash-ly-text">Re-read last night: <em>{lastStory.title}</em></span>
              </div>
            )}
          </>
        )}

        {/* ══════════ COMPLETED STATE ══════════ */}
        {!isGuest&&tonightDone&&(
          <>
            <div className="dash-done-hd">
              <div className="dash-done-badge"><div className="dash-done-badge-dot"/><span className="dash-done-badge-txt">Night {eggStage} Complete ✦</span></div>
              <div className="dash-done-title">Well done, <em>{childName}.</em></div>
              <div className="dash-done-sub">{hatchedCreature?.name??'Your companion'} heard every word of your story tonight.</div>
            </div>

            {hatchedCreature&&(
              <div className="dash-done-cz">
                <div className="dash-done-aura" style={{transform:'translateX(-50%)'}}/>
                <div className="dash-done-emowrap">
                  <div className="dash-done-emo">{hatchedCreature.creatureEmoji}</div>
                  <div className="dash-zzz-p z1">z</div><div className="dash-zzz-p z2">z</div><div className="dash-zzz-p z3">z</div>
                </div>
                <div className="dash-done-cname">{hatchedCreature.name}</div>
                <div className="dash-done-cstage">{creatureDef?.name??''} · Night {eggStage} of 7</div>
              </div>
            )}

            {/* TEAL SHARDS CARD */}
            <div className="dash-ac" style={{background:'rgba(4,14,12,.9)',borderColor:'rgba(20,216,144,.15)'}}>
              <div className="dash-ac-aura teal"/>
              <div className="dash-shard-hd">
                <div className="dash-info-trigger" onClick={toggleShardsInfo}>
                  <span className="dash-info-lbl teal">Dream Shards</span>
                  <div className={`dash-info-ico teal${shardsInfoOpen?' open':''}`}>{shardsInfoOpen?'✕':'ⓘ'}</div>
                </div>
                <div className="dash-shard-pos teal">Shard {eggStage} of 7 ✦</div>
              </div>
              <div className={`dash-explain${shardsInfoOpen?' open':''}`}>
                <div className="dash-explain-inner teal">
                  <div className="dash-exp-title">✦ Dream Shards</div>
                  <div className="dash-exp-row"><div className="dash-exp-ico" style={{border:'2px solid rgba(20,216,144,.5)',background:'rgba(20,216,144,.12)'}}>✦</div><div className="dash-exp-txt">Collect all 7 and a new creature hatches in the Hatchery.</div></div>
                  <div className="dash-exp-row"><div className="dash-exp-ico" style={{border:'2px solid rgba(20,216,144,.4)',background:'rgba(20,216,144,.08)'}}>✦</div><div className="dash-exp-txt">Tap any completed shard ✦ to open that night's memory.</div></div>
                  <button className="dash-exp-dismiss" style={{borderColor:'rgba(20,216,144,.15)',color:'rgba(20,216,144,.45)'}} onClick={toggleShardsInfo}>Got it ✓</button>
                </div>
              </div>

              {renderShardTrack(true)}
              <div className="dash-progbar"><div className="dash-progfill teal" style={{'--pw':barWidth} as any}/></div>
              <div className="dash-streak teal">
                <span style={{fontSize:15}}>🔥</span>
                <span className="dash-streak-txt teal">{glow>1?`${glow} nights in a row — keep it going!`:'First night complete — come back tomorrow!'}</span>
                {glow>0&&<span className="dash-streak-num">{glow}</span>}
              </div>
            </div>

            {/* TONIGHT'S MEMORY */}
            {tonightCard&&(
              <div className="dash-memory" style={{position:'relative',zIndex:5}}>
                <div className="dash-memory-lbl">✦ Tonight's story</div>
                <div className="dash-memory-card" onClick={()=>setModalCard(tonightCard)}>
                  <div className="dash-memory-card-sh"/>
                  <div style={{display:'flex',gap:8,marginBottom:9}}>
                    <div className="dash-memory-title" style={{flex:1}}>{tonightCard.storyTitle}</div>
                    <div style={{fontSize:20,flexShrink:0}}>{tonightCard.emoji??'📖'}</div>
                  </div>
                  {tonightCard.quote&&<div className="dash-memory-quote">"{tonightCard.quote}"</div>}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div className="dash-memory-date">{new Date(tonightCard.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · Night {eggStage}</div>
                    <div style={{fontSize:11,color:'rgba(160,96,240,.5)'}}>💜 saved</div>
                  </div>
                </div>
              </div>
            )}

            {/* TEAL WEEK BAR */}
            <div className="dash-wkbar">
              <div className="dash-wkbar-hd">
                <div className="dash-info-trigger" onClick={toggleWeekInfo}>
                  <span className="dash-info-lbl muted">This week</span>
                  <div className={`dash-info-ico muted${weekInfoOpen?' open muted':''}`}>{weekInfoOpen?'✕':'ⓘ'}</div>
                </div>
                <div className="dash-wkbar-meta teal">· Memory {totalMemories}</div>
              </div>
              <div className={`dash-explain${weekInfoOpen?' open':''}`}>
                <div className="dash-explain-inner muted">
                  <div className="dash-exp-title">📅 This week's ritual</div>
                  <div className="dash-exp-row"><div className="dash-exp-ico" style={{fontSize:13}}>⭐</div><div className="dash-exp-txt" style={{color:'rgba(255,255,255,.62)'}}>Each bar is one night. Fill means ritual completed.</div></div>
                  <div className="dash-exp-row"><div className="dash-exp-ico" style={{fontSize:13}}>📊</div><div className="dash-exp-txt" style={{color:'rgba(255,255,255,.62)'}}>"Memory {totalMemories}" is your all-time count — every ritual ever completed.</div></div>
                  <button className="dash-exp-dismiss muted" onClick={toggleWeekInfo}>Got it ✓</button>
                </div>
              </div>
              {renderWeekBar()}
            </div>

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
              {modalCard.bondingQuestion&&(<><div className="dash-nc-modal-q">"{modalCard.bondingQuestion}"</div>{modalCard.bondingAnswer&&<div className="dash-nc-modal-a">{modalCard.bondingAnswer}</div>}</>)}
              {!modalCard.quote&&!modalCard.bondingQuestion&&<div className="dash-nc-modal-fv">{modalCard.memory_line||'A night to remember'}</div>}
              {/* Memory footer */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,marginTop:10,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:9,color:'rgba(255,255,255,.18)'}}>sleepseed.ai</div>
                <div style={{fontFamily:'var(--serif)',fontSize:11,fontStyle:'italic',color:'rgba(255,255,255,.32)'}}>Memory <em style={{color:'rgba(245,184,76,.65)',fontStyle:'normal',fontWeight:700}}>{getMemoryNumber(modalCard)}</em> · {modalCard.heroName}'s journey</div>
                <div style={{display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:12}}>🔥</span><span style={{fontFamily:'var(--mono)',fontSize:8,color:'rgba(245,184,76,.35)',letterSpacing:'.05em'}}>{glow} streak</span></div>
              </div>
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
            <button className="dash-hatch-btn" onClick={()=>{setShowHatchModal(false);startRitual();}}>Begin tonight's ritual</button>
          </div>
        </div>
      )}

      {/* SHARD BOTTOM SHEET */}
      {activeShardIdx!==null&&activeShardCard&&(
        <>
          <div className="dash-sheet-bd" onClick={closeSheet}/>
          <div className="dash-sheet">
            <div className="dash-sheet-handle"/>
            <div className="dash-sh-hd">
              <div>
                <span className="dash-sh-night">✦ Night {activeShardIdx+1} of 7 · {shardDateLabel(activeShardIdx)}</span>
                <div className="dash-sh-memory">Memory <em>{getMemoryNumber(activeShardCard)}</em> · {activeShardCard.heroName}'s journey</div>
              </div>
              <button className="dash-sh-close" onClick={closeSheet}>✕</button>
            </div>
            {activeShardWisdom&&hatchedCreature&&(
              <div className="dash-sh-wisdom">
                <div style={{fontSize:27,lineHeight:1,flexShrink:0,marginTop:2}}>{hatchedCreature.creatureEmoji}</div>
                <div><div className="dash-sh-wis-lbl">{hatchedCreature.name}'s wisdom that night</div><div className="dash-sh-wis-txt">"{activeShardWisdom}"</div></div>
              </div>
            )}
            {activeShardCard.photo?(
              <div className="dash-sh-photo"><img src={activeShardCard.photo} alt={`${activeShardCard.heroName} · Night ${activeShardIdx+1}`} style={{width:'100%',height:145,objectFit:'cover',display:'block',borderRadius:14}}/></div>
            ):(
              <div className="dash-sh-photo-add">
                <div className="dash-sh-pa-ico">📷</div>
                <div><div className="dash-sh-pa-title">Add a photo of {activeShardCard.heroName}</div><div className="dash-sh-pa-sub">Make this night a memory worth keeping forever</div></div>
              </div>
            )}
            <div className="dash-sh-story">
              <div className="dash-sh-sec-lbl">Tonight's story</div>
              {activeShardCard.storyTitle?(
                <div className="dash-sh-story-card">
                  <div className="dash-sh-story-title">{activeShardCard.storyTitle}</div>
                  {activeShardCard.quote&&<div className="dash-sh-refrain">"{activeShardCard.quote}"</div>}
                  {activeShardStory&&onReadStory?(<button className="dash-sh-read-btn" onClick={()=>{closeSheet();onReadStory(activeShardStory.bookData);}}>📖 Read this story again →</button>):(<div className="dash-sh-no-story">Story not available to re-read</div>)}
                </div>
              ):(<div className="dash-sh-no-story">No story recorded for this night</div>)}
            </div>
            {(activeShardCard.bondingQuestion||activeShardCard.bondingAnswer)&&(
              <div className="dash-sh-bond">
                <div className="dash-sh-sec-lbl">What {activeShardCard.heroName} said</div>
                <div className="dash-sh-bond-card">
                  {activeShardCard.bondingQuestion&&<div className="dash-sh-bq">{activeShardCard.bondingQuestion}</div>}
                  {activeShardCard.bondingAnswer&&<div className="dash-sh-ba">"{activeShardCard.bondingAnswer}"</div>}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MY STUFF SHEET ── */}
      {myStuffOpen&&(
        <>
          <div className="dash-ms-bd" onClick={closeMyStuff}/>
          <div className="dash-ms-sheet">
            <div className="dash-ms-handle"/>
            <div className="dash-ms-hd">
              <div className="dash-ms-title">My Stuff</div>
              <button className="dash-ms-close" onClick={closeMyStuff}>✕</button>
            </div>
            <div className="dash-ms-row books" onClick={handleMyBooks}>
              <div className="dash-ms-ico" style={{background:'rgba(245,184,76,.08)',border:'1px solid rgba(245,184,76,.18)'}}><NavIconBooks/></div>
              <div className="dash-ms-label"><div className="dash-ms-row-title">My Books</div><div className="dash-ms-row-sub">Stories your family has made</div></div>
              {storyCount>0&&<div className="dash-ms-badge" style={{background:'rgba(245,184,76,.1)',border:'1px solid rgba(245,184,76,.22)',color:'rgba(245,184,76,.72)'}}>{storyCount}</div>}
              <div className="dash-ms-arr">›</div>
            </div>
            <div className="dash-ms-row cards" onClick={handleNightCards}>
              <div className="dash-ms-ico" style={{background:'rgba(160,96,240,.08)',border:'1px solid rgba(160,96,240,.18)'}}><NavIconNightCards/></div>
              <div className="dash-ms-label"><div className="dash-ms-row-title">Night Cards</div><div className="dash-ms-row-sub">{primary?.name??'Your child'}'s bedtime memories</div></div>
              {showMyStuffDot&&<div className="dash-ms-badge" style={{background:'rgba(160,96,240,.1)',border:'1px solid rgba(160,96,240,.22)',color:'#c090ff'}}>1 new</div>}
              <div className="dash-ms-arr">›</div>
            </div>
            <div className="dash-ms-row hatch" onClick={handleHatchery}>
              <div className="dash-ms-ico" style={{background:'rgba(20,216,144,.06)',border:'1px solid rgba(20,216,144,.18)'}}><NavIconHatchery/></div>
              <div className="dash-ms-label"><div className="dash-ms-row-title">Hatchery</div><div className="dash-ms-row-sub">Creatures {primary?.name??'your child'} has earned</div></div>
              <div className="dash-ms-arr">›</div>
            </div>
          </div>
        </>
      )}

      {/* ── BOTTOM NAV BAR ── */}
      {/* BottomTabs replaced by dash-navbar inside UserDashboard.tsx */}
      <div className="dash-navbar">
        <div className="dash-nav-tab" onClick={handleNavDiscover}>
          <NavIconDiscover/>
          <div className="dash-nav-tab-lbl">Discover</div>
        </div>
        <div className="dash-nav-create" onClick={handleNavCreate}>
          <div className="dash-nav-create-ring"/>
          <div className="dash-nav-create-btn"><NavIconCreate/></div>
          <div className="dash-nav-create-lbl">Create a story</div>
        </div>
        <div className={`dash-nav-tab${myStuffOpen?' on on-purple':''}`} onClick={handleNavMyStuff}>
          <NavIconMyStuff color={myStuffOpen?'rgba(160,96,240,.85)':'rgba(255,255,255,.55)'}/>
          <div className="dash-nav-tab-lbl">My Stuff</div>
          {showMyStuffDot&&!myStuffOpen&&<div className="dash-nav-unread"/>}
        </div>
      </div>
    </div>
  );
}
