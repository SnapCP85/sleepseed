import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../AppContext';
import type { SavedNightCard, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, createEgg, getAllHatchedCreatures } from '../lib/hatchery';
import { CREATURES, getCreature } from '../lib/creatures';
import { getCharacters, getNightCards, getStories } from '../lib/storage';
import { checkBedtimeReminder, getBedtimeSettings } from '../lib/bedtimeReminder';

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
  --night:#060912;--night-mid:#0D1120;--night-card:#0f1525;--night-raised:#141a2e;
  --amber:#F5B84C;--amber-deep:#E8972A;
  --cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);
  --teal:#14d890;--purple:#9482ff;
  --serif:'Fraunces',Georgia,serif;
  --sans:'Nunito',system-ui,sans-serif;
  --cta:'Baloo 2',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.dash{min-height:100vh;min-height:100dvh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:100px}

/* ── Animations ── */
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shimmer{0%{transform:translateX(-100%)}60%,100%{transform:translateX(200%)}}
@keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(245,184,76,0.4)}50%{box-shadow:0 0 0 6px rgba(245,184,76,0)}}
@keyframes pulse-ring-teal{0%,100%{box-shadow:0 0 0 0 rgba(20,216,144,0.4)}50%{box-shadow:0 0 0 6px rgba(20,216,144,0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes twk{0%,100%{opacity:.15}50%{opacity:.85}}
@keyframes twk2{0%,100%{opacity:.35}60%{opacity:.1}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes hatchBurst{0%{transform:scale(1)}30%{transform:scale(1.15) rotate(3deg)}60%{transform:scale(1.08) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
@keyframes zzz{0%{opacity:0;transform:translate(0,0) scale(.45)}35%{opacity:.78}100%{opacity:0;transform:translate(12px,-20px) scale(1.25)}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes cBreathe{0%,100%{box-shadow:0 0 0 1.5px rgba(255,218,80,.3),0 6px 22px rgba(160,95,0,.65),0 0 32px rgba(245,184,76,.15),inset 0 1px 0 rgba(255,245,160,.25)}50%{box-shadow:0 0 0 1.5px rgba(255,218,80,.48),0 10px 30px rgba(160,95,0,.85),0 0 50px rgba(245,184,76,.28),inset 0 1px 0 rgba(255,245,160,.3)}}
@keyframes skelMove{from{transform:translateX(-100%)}to{transform:translateX(100%)}}

/* ── Stars ── */
.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;border-radius:50%;background:rgba(244,239,232,.65);animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.dash-star2{position:absolute;border-radius:50%;background:rgba(244,239,232,.4);animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.dash-star3{position:absolute;border-radius:50%;background:rgba(244,239,232,.55);animation:twk var(--d,2.5s) var(--dl,0s) ease-in-out infinite}
.dash-sky{position:fixed;top:0;left:0;right:0;height:300px;background:linear-gradient(180deg,#040710 0%,#060912 100%);z-index:0;pointer-events:none}

/* ── Skeleton ── */
.dash-skel{background:rgba(255,255,255,.05);border-radius:8px;overflow:hidden;position:relative}
.dash-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 50%,transparent 100%);animation:skelMove 1.6s ease-in-out infinite}

/* ── Top Nav ── */
.dash-nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;padding-top:env(safe-area-inset-top,0px);height:56px;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.dash-logo{font-family:var(--serif);font-size:15px;font-weight:600;color:var(--cream);display:flex;align-items:center;gap:8px;flex-shrink:0;letter-spacing:.3px}
.dash-logo-moon{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F5B84C,#E8972A);position:relative;flex-shrink:0;box-shadow:0 0 12px rgba(245,184,76,.4)}
.dash-logo-moon-sh{position:absolute;width:18px;height:18px;border-radius:50%;background:var(--night);top:4px;left:8px}
.dash-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,#1a0e32,#2e1858);border:1.5px solid rgba(160,96,240,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .22s;flex-shrink:0;position:relative}
.dash-avatar:hover{border-color:rgba(160,96,240,.62);background:linear-gradient(145deg,#2e1858,#4818a0)}
.dash-avatar-pip{position:absolute;bottom:-1px;right:-1px;width:8px;height:8px;border-radius:50%;background:#14d890;border:1.5px solid var(--night)}

/* ── Inner ── */
.dash-inner{max-width:480px;margin:0 auto;padding:0 20px 110px;position:relative;z-index:5}

/* ══════════════════════════════════════════════════════════════════════════════
   ZONE 1 — Greeting
   ══════════════════════════════════════════════════════════════════════════════ */
.z1-greeting{padding-top:24px;margin-bottom:20px;animation:fadeUp .5s ease-out both}
.z1-time{font-family:var(--serif);font-style:italic;font-size:13px;color:var(--amber);opacity:.75;margin-bottom:6px}
.z1-heading{font-family:var(--serif);font-size:26px;font-weight:400;color:var(--cream);line-height:1.2;letter-spacing:-.02em;margin-bottom:6px}
.z1-heading em{font-style:italic;color:var(--amber)}
.z1-heading em.done{color:var(--teal)}
.z1-date{font-size:12px;color:var(--cream-faint);font-family:var(--mono);letter-spacing:.04em}

/* ══════════════════════════════════════════════════════════════════════════════
   ZONE 2 — Creature Portal
   ══════════════════════════════════════════════════════════════════════════════ */
.z2-portal{border-radius:28px;overflow:hidden;position:relative;padding:32px 24px 28px;margin-bottom:16px;animation:fadeUp .55s ease-out both;animation-delay:.05s}
.z2-portal.amber-mode{background:linear-gradient(168deg,rgba(15,21,37,.95),rgba(10,14,28,.98));border:1px solid rgba(245,184,76,.14)}
.z2-portal.teal-mode{background:linear-gradient(168deg,rgba(4,14,12,.95),rgba(6,16,14,.98));border:1px solid rgba(20,216,144,.18)}

.z2-stage-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.z2-stage-badge{font-family:var(--mono);font-size:10px;letter-spacing:.06em;padding:3px 10px;border-radius:20px;font-weight:500}
.z2-stage-badge.amber{background:rgba(245,184,76,.1);border:1px solid rgba(245,184,76,.22);color:rgba(245,184,76,.72)}
.z2-stage-badge.teal{background:rgba(20,216,144,.1);border:1px solid rgba(20,216,144,.22);color:rgba(20,216,144,.72)}
.z2-nights-left{font-family:var(--serif);font-size:12px;font-style:italic;color:var(--cream-faint)}

.z2-creature-row{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:24px}
.z2-emoji{font-size:68px;line-height:1;display:inline-block;animation:float 5s ease-in-out infinite;margin-bottom:8px}
.z2-emoji.amber{filter:drop-shadow(0 0 24px rgba(245,184,76,.5))}
.z2-emoji.teal{filter:drop-shadow(0 0 24px rgba(20,216,144,.5))}
.z2-type-label{font-family:var(--mono);font-size:9px;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:4px}
.z2-type-label.amber{color:rgba(245,184,76,.4)}
.z2-type-label.teal{color:rgba(20,216,144,.4)}
.z2-creature-name{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--cream);margin-bottom:8px}
.z2-wisdom{font-family:var(--serif);font-size:13px;font-style:italic;color:rgba(255,255,255,.52);line-height:1.6;max-width:320px;margin:0 auto;padding-left:12px;position:relative}
.z2-wisdom::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:2px;border-radius:1px}
.z2-wisdom.amber::before{background:rgba(245,184,76,.28)}
.z2-wisdom.teal::before{background:rgba(20,216,144,.28)}

/* Progress dots */
.z2-dots{display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:24px}
.z2-dot{width:8px;height:8px;border-radius:50%;transition:all .3s}
.z2-dot.done-amber{background:var(--amber);box-shadow:0 0 8px rgba(245,184,76,.45)}
.z2-dot.done-teal{background:var(--teal);box-shadow:0 0 8px rgba(20,216,144,.45)}
.z2-dot.tonight{background:rgba(245,184,76,.2);border:1.5px solid rgba(245,184,76,.5);animation:pulse-ring 2.5s ease-in-out infinite}
.z2-dot.tonight-done{background:rgba(20,216,144,.35);border:1.5px solid rgba(20,216,144,.6);animation:pulse-ring-teal 2.5s ease-in-out infinite}
.z2-dot.future{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1)}
.z2-dot.tappable{cursor:pointer;transition:transform .15s}
.z2-dot.tappable:hover{transform:scale(1.3)}

/* CTA button */
.z2-cta{width:100%;padding:18px 24px;border:none;border-radius:18px;background:linear-gradient(135deg,#7a4808,#c4851c,#F5B84C);color:#1a0800;font-family:var(--serif);font-size:17px;font-weight:600;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(245,184,76,.25);transition:transform .18s,filter .18s}
.z2-cta::after{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.18),transparent);animation:shimmer 3.5s ease-in-out infinite}
.z2-cta:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.08)}
.z2-cta:active{transform:scale(.97)}
.z2-cta-sub{display:block;font-size:10px;font-weight:600;opacity:.5;margin-top:3px;font-family:var(--sans)}

/* ══════════════════════════════════════════════════════════════════════════════
   ZONE 3 — Journey Bar (streak + week)
   ══════════════════════════════════════════════════════════════════════════════ */
.z3-journey{display:flex;align-items:center;gap:14px;margin-bottom:16px;animation:fadeUp .6s ease-out both;animation-delay:.1s;background:rgba(13,17,32,.8);border:1px solid rgba(244,239,232,.06);border-radius:20px;padding:16px 18px}
.z3-streak{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;flex-shrink:0}
.z3-streak.amber{background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.18)}
.z3-streak.teal{background:rgba(20,216,144,.08);border:1px solid rgba(20,216,144,.18)}
.z3-streak-num{font-family:var(--mono);font-size:13px;font-weight:700}
.z3-streak-num.amber{color:var(--amber)}
.z3-streak-num.teal{color:var(--teal)}
.z3-streak-lbl{font-family:var(--sans);font-size:10px;color:var(--cream-dim);font-weight:600}
.z3-week{display:flex;align-items:center;gap:4px;flex:1;justify-content:flex-end}
.z3-week-lbl{font-family:var(--mono);font-size:7px;color:rgba(255,255,255,.2);text-align:center;width:10px;margin-bottom:2px;letter-spacing:0}
.z3-week-col{display:flex;flex-direction:column;align-items:center;gap:2px}
.z3-wdot{width:10px;height:10px;border-radius:50%}
.z3-wdot.done{background:var(--amber);box-shadow:0 0 6px rgba(245,184,76,.3)}
.z3-wdot.done-teal{background:var(--teal);box-shadow:0 0 6px rgba(20,216,144,.3)}
.z3-wdot.tonight{background:rgba(245,184,76,.15);border:1.5px solid rgba(245,184,76,.4);animation:pulse-ring 2.5s ease-in-out infinite}
.z3-wdot.tonight-done{background:rgba(20,216,144,.25);border:1.5px solid rgba(20,216,144,.5)}
.z3-wdot.missed{background:rgba(255,60,60,.15);border:1px solid rgba(255,60,60,.25)}
.z3-wdot.future{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}

/* ══════════════════════════════════════════════════════════════════════════════
   ZONE 4 — Memory Peek
   ══════════════════════════════════════════════════════════════════════════════ */
.z4-memory{margin-bottom:16px;animation:fadeUp .65s ease-out both;animation-delay:.15s}
.z4-label{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:8px}
.z4-cards{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}
.z4-cards::-webkit-scrollbar{display:none}
.z4-card{flex:0 0 auto;width:200px;background:linear-gradient(148deg,rgba(8,12,32,.96),rgba(14,18,46,.96));border:1px solid rgba(160,96,240,.18);border-radius:14px;padding:12px;cursor:pointer;transition:border-color .2s,transform .2s}
.z4-card:hover{border-color:rgba(160,96,240,.35);transform:translateY(-2px)}
.z4-card-title{font-family:var(--serif);font-size:12px;font-weight:700;color:var(--cream);line-height:1.3;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.z4-card-quote{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(255,255,255,.45);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px}
.z4-card-date{font-family:var(--mono);font-size:8px;color:rgba(255,255,255,.2)}
.z4-more{background:none;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 16px;font-family:var(--serif);font-size:12px;font-style:italic;color:var(--cream-dim);cursor:pointer;transition:all .18s;margin-top:8px}
.z4-more:hover{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.18)}

/* ══════════════════════════════════════════════════════════════════════════════
   Done state — creature sleeping
   ══════════════════════════════════════════════════════════════════════════════ */
.done-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(20,216,144,.07);border:1px solid rgba(20,216,144,.24);border-radius:20px;padding:4px 14px;margin-bottom:8px}
.done-badge-dot{width:5px;height:5px;border-radius:50%;background:#14d890;animation:twk 2.2s ease-in-out infinite}
.done-badge-txt{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(20,216,144,.7)}
.done-zzz{position:absolute;font-family:var(--serif);font-style:italic;pointer-events:none}
.done-zzz.z1{font-size:14px;top:6px;right:2px;color:rgba(20,216,144,.52);animation:zzz 3.2s 0s ease-out infinite}
.done-zzz.z2{font-size:10px;top:18px;right:14px;color:rgba(20,216,144,.38);animation:zzz 3.2s 1s ease-out infinite}
.done-zzz.z3{font-size:8px;top:24px;right:4px;color:rgba(20,216,144,.26);animation:zzz 3.2s 2s ease-out infinite}

/* ══════════════════════════════════════════════════════════════════════════════
   Guest state
   ══════════════════════════════════════════════════════════════════════════════ */
.dash-u-btn{width:100%;padding:18px 20px;border:none;border-radius:17px;cursor:pointer;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;transition:transform .18s,filter .2s;box-shadow:0 1px 0 rgba(255,255,255,.18) inset}
.dash-u-btn:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.1)}
.dash-u-btn:active{transform:scale(.97)}
.dash-u-btn::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.8s ease-in-out infinite}
.dash-u-btn-ico{font-size:28px;flex-shrink:0;position:relative;z-index:1}
.dash-u-btn-texts{flex:1;text-align:left;position:relative;z-index:1}
.dash-u-btn-title{font-size:18px;font-weight:800;display:block;line-height:1.18;margin-bottom:1px}
.dash-u-btn-sub{font-size:10px;font-weight:700;display:block;opacity:.5}
.dash-u-btn-arr{font-size:24px;flex-shrink:0;position:relative;z-index:1;opacity:.38}

/* ══════════════════════════════════════════════════════════════════════════════
   Modals — Night Card, Hatch, Shard Sheet
   ══════════════════════════════════════════════════════════════════════════════ */
.dash-nc-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px);animation:fadein .18s ease}
.dash-nc-modal{background:#0F1328;border:1px solid rgba(255,255,255,.07);border-radius:18px;max-width:380px;width:100%;overflow:hidden;animation:fadein .18s ease}
.dash-nc-modal-top{background:linear-gradient(135deg,#C49018,#A87010);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.dash-nc-modal-lbl{font-size:8.5px;font-weight:600;color:#0A0600;letter-spacing:.07em;text-transform:uppercase}
.dash-nc-modal-date{font-size:8.5px;color:rgba(10,6,0,.5);font-family:var(--mono)}
.dash-nc-modal-close{background:none;border:none;font-size:20px;color:rgba(10,6,0,.4);cursor:pointer;line-height:1;padding:0 2px}
.dash-nc-modal-body{padding:15px 17px}
.dash-nc-modal-fl{font-size:8px;color:rgba(58,66,112,1);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;font-weight:500}
.dash-nc-modal-fv{font-size:13px;color:rgba(200,191,176,1);line-height:1.65;font-style:italic;margin-bottom:12px}
.dash-nc-modal-q{font-size:13px;color:var(--amber);font-family:var(--serif);font-style:italic;margin-bottom:4px}
.dash-nc-modal-a{font-size:13px;color:var(--cream);line-height:1.6}

/* Hatch modal */
.dash-hatch-modal{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;animation:fadein .3s ease}
.dash-hatch-inner{text-align:center;animation:fadein .4s ease-out;max-width:340px;padding:24px}
.dash-hatch-creature{font-size:96px;animation:hatchBurst .6s ease-out;display:inline-block;margin-bottom:18px;filter:drop-shadow(0 0 32px rgba(20,216,144,.6))}
.dash-hatch-title{font-family:var(--serif);font-size:24px;color:var(--cream);margin-bottom:8px;line-height:1.3;font-style:italic}
.dash-hatch-title em{color:#14d890}
.dash-hatch-sub{font-size:13px;color:rgba(244,239,232,.4);line-height:1.65;margin-bottom:20px}
.dash-hatch-btn{padding:16px 32px;border:none;border-radius:18px;font-size:17px;font-weight:800;cursor:pointer;font-family:var(--cta);background:linear-gradient(135deg,#0a7a50,#14d890 50%,#0a7a50);color:#041a0c;box-shadow:0 8px 28px rgba(20,200,130,.35);transition:transform .18s,filter .18s}
.dash-hatch-btn:hover{transform:scale(1.03) translateY(-1px);filter:brightness(1.08)}

/* Shard bottom sheet */
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

/* ══════════════════════════════════════════════════════════════════════════════
   Bottom Navbar
   ══════════════════════════════════════════════════════════════════════════════ */
@keyframes pillIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
.dash-navbar{position:fixed;bottom:0;left:0;right:0;height:74px;background:linear-gradient(180deg,rgba(4,6,18,.94) 0%,rgba(6,9,22,.98) 100%);border-top:1px solid rgba(245,184,76,.14);display:flex;align-items:center;justify-content:space-around;padding:0 8px;z-index:30;padding-bottom:max(0px,env(safe-area-inset-bottom))}
.dash-nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;padding:8px 4px 10px;position:relative;border-radius:14px;-webkit-tap-highlight-color:transparent;transition:opacity .15s}
.dash-nav-tab:active{opacity:.65}
.dash-nav-tab svg{opacity:.58;transition:opacity .2s,transform .2s}
.dash-nav-tab-lbl{font-family:var(--serif);font-style:italic;font-size:10px;color:rgba(255,255,255,.48);transition:color .2s;white-space:nowrap;line-height:1}
.dash-nav-tab.on::before{content:'';position:absolute;inset:3px 0px;border-radius:12px;animation:pillIn .2s ease-out}
.dash-nav-tab.on-amber::before{background:rgba(245,184,76,.15);border:1px solid rgba(245,184,76,.22);box-shadow:0 0 12px rgba(245,184,76,.08)}
.dash-nav-tab.on-amber svg{opacity:1;transform:scale(1.08)}
.dash-nav-tab.on-amber .dash-nav-tab-lbl{color:rgba(245,184,76,.95)}
.dash-nav-create{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;-webkit-tap-highlight-color:transparent;margin-top:-16px;padding-bottom:2px}
.dash-nav-create-btn{width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 34% 28%,rgba(255,242,150,.4) 0%,transparent 48%),linear-gradient(148deg,#c08020 0%,#F5B84C 35%,#F0A030 60%,#a06010 100%);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;transition:transform .18s,filter .18s;animation:cBreathe 4s ease-in-out infinite}
.dash-nav-create-btn::before{content:'';position:absolute;top:0;left:0;right:0;height:55%;background:linear-gradient(180deg,rgba(255,250,180,.22) 0%,transparent 100%);border-radius:50% 50% 0 0;pointer-events:none}
.dash-nav-create-btn::after{content:'';position:absolute;top:-20%;left:-65%;width:38%;height:140%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);transform:skewX(-15deg);animation:shimmer 3.4s ease-in-out infinite}
.dash-nav-create-btn:active{transform:scale(.9);filter:brightness(.88)}
.dash-nav-create-lbl{font-family:var(--serif);font-style:italic;font-size:10px;color:rgba(245,184,76,.65);white-space:nowrap;line-height:1}

/* ── Re-read link ── */
.dash-reread{background:rgba(10,12,24,.97);border:.5px solid rgba(255,255,255,.05);border-left:2.5px solid var(--amber);border-radius:0 10px 10px 0;padding:8px 13px;display:flex;align-items:center;gap:8px;margin-bottom:14px;cursor:pointer;transition:background .18s}
.dash-reread:hover{background:rgba(14,16,30,.97)}
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

const NavIconDiscover = ({color='rgba(255,255,255,.9)'}:{color?:string}) => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.4"/><path d="M11 3.5v1M11 17.5v1M3.5 11h1M17.5 11h1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><circle cx="11" cy="11" r="2.5" stroke={color} strokeWidth="1.3"/><path d="M13.5 8.5l-1.2 3.7-3.7 1.2 1.2-3.7z" fill={color}/></svg>
);
const NavIconHome = ({color='rgba(255,255,255,.9)'}:{color?:string}) => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M4 10.5L11 4l7 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/><rect x="8.5" y="14" width="5" height="6" rx="1" stroke={color} strokeWidth="1.3"/><circle cx="14.5" cy="8.5" r="1.8" fill={`${color}30`} stroke={color} strokeWidth=".9"/></svg>
);
const NavIconCreate = () => (
  <svg width="26" height="26" viewBox="0 0 30 30" fill="none" style={{position:'relative',zIndex:2}}><path d="M15 4l2.7 8.2H26l-6.9 5 2.6 8.2L15 20.4l-6.7 5 2.6-8.2L4 12.2h8.3z" fill="rgba(8,4,0,.85)"/></svg>
);
const NavIconMyStuff = ({color='rgba(255,255,255,.9)'}:{color?:string}) => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="3" y="10" width="16" height="10" rx="2" stroke={color} strokeWidth="1.4"/><path d="M3 11a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" stroke={color} strokeWidth="1.4"/><rect x="9.5" y="14" width="3" height="2.5" rx="1" stroke={color} strokeWidth="1.3"/><path d="M3 11h16" stroke={color} strokeWidth="1.4"/></svg>
);
const NavIconProfile = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="#c090ff" strokeWidth="1.2"/><path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#c090ff" strokeWidth="1.2" strokeLinecap="round"/></svg>
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
    Promise.all([
      getCharacters(userId),
      getNightCards(userId),
      getStories(userId),
      hasSupabase ? getAllHatchedCreatures(userId) : Promise.resolve([] as HatchedCreature[]),
    ]).then(async ([chars,cards,stories,creatures])=>{
      const fc=chars.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human'));
      const pri=fc.length>0?fc[0]:chars.length>0?chars[0]:null;
      let egg: HatcheryEgg|null = null;
      if(hasSupabase&&pri){
        egg=await getActiveEgg(userId,pri.id);
        if(!egg){const rc=CREATURES[Math.floor(Math.random()*CREATURES.length)];try{egg=await createEgg(userId,pri.id,rc.id,1);}catch{}}
      }
      setCharacters(chars);setAllCards(cards);setStoryCount(stories.length);
      setAllStories(stories);
      if(stories.length>0){const sorted=[...stories].sort((a,b)=>(b.date||'').localeCompare(a.date||''));setLastStory(sorted[0]);}
      if(creatures.length>0) setHatchedCreature(creatures[0]);
      if(pri){if(fc.length>0){setSelectedCharacters([fc[0]]);setWeekViewId(fc[0].id);}else{setSelectedCharacters([chars[0]]);setWeekViewId(chars[0].id);}}
      if(egg) setActiveEgg(egg);
      setLoading(false);
    });
  },[userId]); // eslint-disable-line

  const familyChars=useMemo(()=>characters.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human')),[characters]);
  const primary=selectedCharacters[0]??null;
  const secondary=selectedCharacters[1]??null;
  const isMulti=selectedCharacters.length>1;
  const weekChild=characters.find(c=>c.id===weekViewId)??primary;

  useEffect(()=>{
    if(!hasSupabase||!user||!primary) return;
    if(activeEgg&&activeEgg.characterId===primary.id) return;
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
  const DAY_NAMES=['M','T','W','T','F','S','S'];

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

  // ── Bedtime reminder timer ──────────────────────────────────────────────────
  const [bedtimeToast, setBedtimeToast] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      const fired = checkBedtimeReminder(userId, childName);
      if (fired) { setBedtimeToast(true); setTimeout(() => setBedtimeToast(false), 8000); }
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [userId, childName]);

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

  // ── Formatted date for greeting ──────────────────────────────────────────
  const greetDate = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

  // ── Bedtime flavour text ─────────────────────────────────────────────────
  const greetFlavour = hour>=20 ? "it's almost bedtime" : hour>=17 ? "it's almost bedtime" : hour>=12 ? "the stars are waiting" : "a new day begins";

  // ── Recent memory cards (for Zone 4) ─────────────────────────────────────
  const recentCards = useMemo(()=>{
    if(!primary) return [];
    return allCards.filter(c=>cardBelongsTo(c,primary.id)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  },[allCards,primary]);

  // ── Creature color helper ────────────────────────────────────────────────
  const creatureColor = creatureDef?.color ?? '#F5B84C';

  // ── Week dots data ───────────────────────────────────────────────────────
  const weekDots = useMemo(()=>{
    const now=new Date();const dow=now.getDay();const mondayOff=(dow+6)%7;
    return Array.from({length:7},(_,i)=>{
      const d=new Date(now);d.setDate(now.getDate()-mondayOff+i);
      const ds=d.toISOString().split('T')[0];const ts=now.toISOString().split('T')[0];
      const isPast=ds<ts;const isToday=ds===ts;
      const done=primary&&allCards.some(c=>cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===ds);
      return {day:DAY_NAMES[i],done,isPast,isToday};
    });
  },[allCards,primary]);

  // ── LOADING ────────────────────────────────────────────────────────────────
  if(!user) return null;
  if(loading) return(
    <div className="dash">
      <style>{CSS}</style>
      <div className="dash-sky"/>
      <div className="dash-stars">{STARS.slice(0,12).map(s=><div key={s.id} className={s.t===1?'dash-star':s.t===2?'dash-star2':'dash-star3'} style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>)}</div>
      <nav className="dash-nav" style={{background:'rgba(4,8,22,.9)',borderBottom:'1px solid rgba(245,184,76,.07)'}}>
        <div className="dash-logo"><div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>SleepSeed</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="dash-skel" style={{width:70,height:24,borderRadius:20}}/>
          <div className="dash-skel" style={{width:60,height:10,borderRadius:4}}/>
        </div>
      </nav>
      <div className="dash-inner">
        <div style={{paddingTop:24,marginBottom:20}}>
          <div className="dash-skel" style={{height:12,width:'55%',marginBottom:8,borderRadius:4}}/>
          <div className="dash-skel" style={{height:26,width:'75%',borderRadius:8,marginBottom:6}}/>
          <div className="dash-skel" style={{height:10,width:'35%',borderRadius:4}}/>
        </div>
        <div className="dash-skel" style={{height:280,borderRadius:20,marginBottom:16}}/>
        <div className="dash-skel" style={{height:36,borderRadius:20,marginBottom:16}}/>
        <div style={{display:'flex',gap:8}}>
          <div className="dash-skel" style={{height:100,flex:1,borderRadius:14}}/>
          <div className="dash-skel" style={{height:100,width:80,borderRadius:14}}/>
        </div>
      </div>
      <div className="dash-navbar" style={{pointerEvents:'none'}}>
        <div className="dash-nav-tab"><NavIconDiscover/><div className="dash-nav-tab-lbl">Discover</div></div>
        <div className="dash-nav-create"><div className="dash-nav-create-btn"><NavIconCreate/></div><div className="dash-nav-create-lbl">Create</div></div>
        <div className="dash-nav-tab"><NavIconHome/><div className="dash-nav-tab-lbl">Home</div></div>
      </div>
    </div>
  );

  // ── FULL RENDER ────────────────────────────────────────────────────────────
  return(
    <div className="dash">
      <style>{CSS}</style>
      <div className="dash-sky"/>
      <div className="dash-stars">{STARS.slice(0,20).map(s=><div key={s.id} className={s.t===1?'dash-star':s.t===2?'dash-star2':'dash-star3'} style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>)}</div>

      {/* ── TOP NAV ── */}
      <nav className="dash-nav" style={{background:tonightDone?'rgba(3,8,18,.92)':'rgba(4,8,22,.9)',borderBottom:tonightDone?'1px solid rgba(20,216,144,.07)':'1px solid rgba(245,184,76,.07)'}}>
        <div className="dash-logo"><div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>SleepSeed</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {primary&&(
            <div style={{display:'flex',alignItems:'center',gap:8,background:`rgba(${hexToRgba(creatureColor,.12).slice(5,-1)})`,border:`1px solid ${hexToRgba(creatureColor,.25)}`,borderRadius:20,padding:'6px 12px 6px 6px',cursor:'pointer',transition:'background .2s'}}
              onClick={()=>{
                if(familyChars.length>1){
                  const idx=familyChars.findIndex(c=>c.id===primary.id);
                  const next=familyChars[(idx+1)%familyChars.length];
                  setSelectedCharacters([next]);setWeekViewId(next.id);
                }
              }}
              onMouseEnter={e=>(e.currentTarget.style.background=hexToRgba(creatureColor,.2))}
              onMouseLeave={e=>(e.currentTarget.style.background=hexToRgba(creatureColor,.12))}>
              <div style={{width:26,height:26,borderRadius:'50%',background:`linear-gradient(135deg,${hexToRgba(creatureColor,.4)},${hexToRgba(creatureColor,.2)})`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                {primary.photo
                  ? <img src={primary.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                  : <span style={{fontSize:14}}>{hatchedCreature?.creatureEmoji||primary.emoji||'\uD83E\uDDD2'}</span>}
              </div>
              <span style={{fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:600,color:'#F4EFE8'}}>{primary.name}</span>
              {familyChars.length>1&&<span style={{fontSize:10,color:'rgba(244,239,232,.4)',marginLeft:2}}>{'\u25BE'}</span>}
            </div>
          )}
          <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(244,239,232,.06)',border:'1px solid rgba(244,239,232,.08)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s',flexShrink:0}}
            onClick={handleProfile}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(244,239,232,.12)';e.currentTarget.style.borderColor='rgba(244,239,232,.18)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(244,239,232,.06)';e.currentTarget.style.borderColor='rgba(244,239,232,.08)';}}>
            <NavIconProfile/>
          </div>
        </div>
      </nav>

      {/* Child switching is handled via the nav child pod — no separate row */}

      <div className="dash-inner">
        {/* ── GUEST STATE ── */}
        {isGuest&&(
          <div style={{padding:'20px 0 0'}}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:12,animation:'float 3.5s ease-in-out infinite',filter:'drop-shadow(0 0 16px rgba(245,184,76,.3))'}}>🌙</div>
              <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--cream)',lineHeight:1.3,marginBottom:6}}>Tonight could be the night<br/><em style={{color:'var(--amber)'}}>bedtime changes forever.</em></div>
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
              <button style={{background:'rgba(245,184,76,.1)',border:'1px solid rgba(245,184,76,.25)',borderRadius:50,padding:'10px 24px',fontSize:13,fontWeight:600,color:'var(--amber)',cursor:'pointer',fontFamily:'var(--sans)'}} onClick={onSignUp}>Create free account →</button>
            </div>
            <div style={{textAlign:'center',marginBottom:8}}><button style={{background:'none',border:'none',color:'rgba(244,239,232,.25)',fontSize:12,cursor:'pointer',fontFamily:'var(--sans)'}} onClick={()=>setView('library')}>Or browse stories from other families →</button></div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ZONE 1 — Greeting
            ══════════════════════════════════════════════════════════════════════ */}
        {!isGuest&&(
          <div className="z1-greeting">
            <div className="z1-time">{greetWord}, {greetFlavour} ✨</div>
            <div className="z1-heading">
              {tonightDone
                ?<>Sweet dreams, <em className="done">{childName}.</em></>
                :<>Ready for <em>{childName}'s</em> story tonight?</>
              }
            </div>
            <div className="z1-date">{greetDate}</div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ACTIVE STATE (tonight not yet done)
            ══════════════════════════════════════════════════════════════════════ */}
        {!isGuest&&!tonightDone&&(
          <>
            {/* ── ZONE 2 — Creature Portal ── */}
            {activeEgg&&hatchedCreature&&creatureDef&&(
              <div className="z2-portal amber-mode" style={{borderColor:hexToRgba(creatureColor,.18)}}>
                {/* Stage row */}
                <div className="z2-stage-row">
                  <div className="z2-stage-badge amber">Night {eggStage+1} of 7</div>
                  <div className="z2-nights-left">{nightsLeftLabel}</div>
                </div>

                {/* Creature display */}
                <div className="z2-creature-row">
                  <div className="z2-emoji amber" style={{filter:`drop-shadow(0 0 18px ${hexToRgba(creatureColor,.4)})`}}>{hatchedCreature.creatureEmoji}</div>
                  <div className="z2-type-label amber" style={{color:hexToRgba(creatureColor,.4)}}>DreamKeeper</div>
                  <div className="z2-creature-name">{hatchedCreature.name}</div>
                  <div className="z2-wisdom amber" style={{'--border-c':hexToRgba(creatureColor,.28)} as any}>
                    <span style={{position:'absolute',left:0,top:2,bottom:2,width:2,borderRadius:1,background:hexToRgba(creatureColor,.28)}}/>
                    "{creatureSpeech}"
                  </div>
                </div>

                {/* Progress dots */}
                <div className="z2-dots">
                  {Array.from({length:7},(_,i)=>{
                    const isDone=i<eggStage;
                    const isTonight=i===eggStage;
                    let cls='future';
                    if(isDone) cls='done-amber tappable';
                    else if(isTonight) cls='tonight';
                    return(
                      <div key={i}
                        className={`z2-dot ${cls}`}
                        onClick={()=>isDone&&handleShardTap(i,true)}
                      />
                    );
                  })}
                </div>

                {/* CTA button */}
                <button className="z2-cta" onClick={startRitual}>
                  Begin tonight's story
                  <span className="z2-cta-sub">{hatchedCreature.name} is waiting · ~10 minutes</span>
                </button>
              </div>
            )}

            {/* No creature yet but has characters */}
            {!hatchedCreature&&familyChars.length>0&&(
              <div style={{marginBottom:16}}>
                <button className="z2-cta" onClick={startRitual}>
                  ✦ Begin tonight's ritual
                  <span className="z2-cta-sub">Your story is waiting · ~10 minutes</span>
                </button>
              </div>
            )}

            {/* No characters at all */}
            {familyChars.length===0&&(
              <div style={{textAlign:'center',marginTop:20,marginBottom:16}}>
                <div style={{fontSize:72,animation:'float 3s ease-in-out infinite',filter:'drop-shadow(0 0 16px rgba(245,184,76,.3))',marginBottom:12}}>🥚</div>
                <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--amber)',marginBottom:10}}>Your adventure begins tonight</div>
                <button className="z2-cta" onClick={()=>{setEditingCharacter(null);setView('onboarding');}}>
                  ✨ Start your first adventure
                  <span className="z2-cta-sub">Create a character and hatch your first DreamKeeper</span>
                </button>
              </div>
            )}

            {/* ── ZONE 3 — Journey Bar ── */}
            {(glow>0||weekDots.length>0)&&(
              <div className="z3-journey">
                <div className="z3-streak amber">
                  <span style={{fontSize:14}}>🔥</span>
                  <span className="z3-streak-num amber">{glow}</span>
                  <span className="z3-streak-lbl">night{glow!==1?'s':''}</span>
                </div>
                <div className="z3-week">
                  {weekDots.map((wd,i)=>{
                    let cls='future';
                    if(wd.isToday) cls=tonightDone?'tonight-done':'tonight';
                    else if(wd.isPast&&wd.done) cls='done';
                    else if(wd.isPast&&!wd.done) cls='missed';
                    return(
                      <div key={i} className="z3-week-col">
                        <div className="z3-week-lbl">{wd.day}</div>
                        <div className={`z3-wdot ${cls}`}/>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Re-read last story ── */}
            {lastStory&&lastStory.bookData&&onReadStory&&(
              <div className="dash-reread" onClick={()=>onReadStory(lastStory.bookData)} style={{position:'relative',zIndex:5}}>
                <span style={{fontSize:10,color:'var(--amber)',flexShrink:0,marginTop:1}}>📖</span>
                <span style={{fontSize:10.5,color:'rgba(200,191,176,1)',lineHeight:1.6}}>Re-read last night: <em style={{color:'var(--amber)',fontStyle:'italic'}}>{lastStory.title}</em></span>
              </div>
            )}

            {/* ── ZONE 4 — Memory Peek ── */}
            {recentCards.length>0&&(
              <div className="z4-memory">
                <div className="z4-label">Recent memories</div>
                <div className="z4-cards">
                  {recentCards.map((card,i)=>(
                    <div key={card.id} className="z4-card" onClick={()=>setModalCard(card)}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                        <span style={{fontSize:16}}>{card.emoji??'📖'}</span>
                      </div>
                      <div className="z4-card-title">{card.storyTitle||'A night to remember'}</div>
                      {card.quote&&<div className="z4-card-quote">"{card.quote}"</div>}
                      <div className="z4-card-date">{new Date(card.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                    </div>
                  ))}
                </div>
                {totalMemories>3&&(
                  <button className="z4-more" onClick={()=>setView('nightcard-library' as any)}>See all memories →</button>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            COMPLETED STATE (tonight done)
            ══════════════════════════════════════════════════════════════════════ */}
        {!isGuest&&tonightDone&&(
          <>
            {/* Done badge */}
            <div style={{textAlign:'center',marginBottom:12}}>
              <div className="done-badge">
                <div className="done-badge-dot"/>
                <span className="done-badge-txt">Night {eggStage} Complete ✦</span>
              </div>
            </div>

            {/* ── ZONE 2 — Creature Portal (teal/done mode) ── */}
            {hatchedCreature&&(
              <div className="z2-portal teal-mode">
                {/* Stage row */}
                <div className="z2-stage-row">
                  <div className="z2-stage-badge teal">Night {eggStage} of 7</div>
                  <div className="z2-nights-left">{nightsLeftLabel}</div>
                </div>

                {/* Sleeping creature */}
                <div className="z2-creature-row">
                  <div style={{position:'relative',display:'inline-block'}}>
                    <div className="z2-emoji teal">{hatchedCreature.creatureEmoji}</div>
                    <div className="done-zzz z1">z</div>
                    <div className="done-zzz z2">z</div>
                    <div className="done-zzz z3">z</div>
                  </div>
                  <div className="z2-type-label teal">DreamKeeper</div>
                  <div className="z2-creature-name">{hatchedCreature.name}</div>
                  <div className="z2-wisdom teal">
                    "{creatureSpeech}"
                  </div>
                </div>

                {/* Progress dots (teal) */}
                <div className="z2-dots">
                  {Array.from({length:7},(_,i)=>{
                    const isDone=i<eggStage;
                    const isJustNow=i===eggStage-1;
                    let cls='future';
                    if(isDone) cls='done-teal tappable';
                    if(isJustNow) cls='tonight-done tappable';
                    return(
                      <div key={i}
                        className={`z2-dot ${cls}`}
                        onClick={()=>isDone&&handleShardTap(i,true)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ZONE 3 — Journey Bar (teal) ── */}
            <div className="z3-journey">
              <div className="z3-streak teal">
                <span style={{fontSize:14}}>🔥</span>
                <span className="z3-streak-num teal">{glow}</span>
                <span className="z3-streak-lbl">night{glow!==1?'s':''}</span>
              </div>
              <div className="z3-week">
                {weekDots.map((wd,i)=>{
                  let cls='future';
                  if(wd.isToday) cls='tonight-done';
                  else if(wd.isPast&&wd.done) cls='done-teal';
                  else if(wd.isPast&&!wd.done) cls='missed';
                  return(
                    <div key={i} className="z3-week-col">
                      <div className="z3-week-lbl">{wd.day}</div>
                      <div className={`z3-wdot ${cls}`}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tonight's memory card */}
            {tonightCard&&(
              <div className="z4-memory" style={{position:'relative',zIndex:5}}>
                <div className="z4-label">✦ Tonight's story</div>
                <div className="z4-cards">
                  <div className="z4-card" style={{width:'100%',flex:'1 1 auto'}} onClick={()=>setModalCard(tonightCard)}>
                    <div style={{display:'flex',gap:8,marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div className="z4-card-title" style={{whiteSpace:'normal',fontSize:13}}>{tonightCard.storyTitle}</div>
                      </div>
                      <div style={{fontSize:20,flexShrink:0}}>{tonightCard.emoji??'📖'}</div>
                    </div>
                    {tonightCard.quote&&<div className="z4-card-quote" style={{WebkitLineClamp:3}}>"{tonightCard.quote}"</div>}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div className="z4-card-date">{new Date(tonightCard.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · Night {eggStage}</div>
                      <div style={{fontSize:11,color:'rgba(20,216,144,.5)'}}>✦ saved</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{textAlign:'center',padding:'6px 0 14px',position:'relative',zIndex:5}}>
              <button style={{fontSize:9,color:'var(--teal)',cursor:'pointer',background:'none',border:'none',fontFamily:'var(--sans)',transition:'color .15s'}} onClick={()=>setView('hatchery')}>View hatchery →</button>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Night Card modal */}
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
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,marginTop:10,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                <div style={{fontFamily:'var(--serif)',fontSize:9,color:'rgba(255,255,255,.18)'}}>sleepseed.ai</div>
                <div style={{fontFamily:'var(--serif)',fontSize:11,fontStyle:'italic',color:'rgba(255,255,255,.32)'}}>Memory <em style={{color:'rgba(245,184,76,.65)',fontStyle:'normal',fontWeight:700}}>{getMemoryNumber(modalCard)}</em> · {modalCard.heroName}'s journey</div>
                <div style={{display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:12}}>🔥</span><span style={{fontFamily:'var(--mono)',fontSize:8,color:'rgba(245,184,76,.35)',letterSpacing:'.05em'}}>{glow} streak</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hatch modal */}
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

      {/* Shard bottom sheet */}
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

      {/* ── BOTTOM NAV BAR ── */}
      <div className="dash-navbar">
        <div className="dash-nav-tab" onClick={handleNavDiscover}>
          <NavIconDiscover/>
          <div className="dash-nav-tab-lbl">Discover</div>
        </div>
        <div className="dash-nav-create" onClick={handleNavCreate}>
          <div className="dash-nav-create-btn"><NavIconCreate/></div>
          <div className="dash-nav-create-lbl">Create</div>
        </div>
        <div className="dash-nav-tab on on-amber">
          <NavIconHome color="rgba(245,184,76,.9)"/>
          <div className="dash-nav-tab-lbl">Home</div>
        </div>
      </div>

      {/* Bedtime toast */}
      {bedtimeToast && (
        <div style={{position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',zIndex:200,
          background:'linear-gradient(135deg,#1a1040,#0d1428)',border:'1px solid rgba(245,184,76,.3)',
          borderRadius:16,padding:'14px 20px',boxShadow:'0 12px 40px rgba(0,0,0,.6)',
          display:'flex',alignItems:'center',gap:12,maxWidth:340,width:'90%',
          animation:'slideup .3s ease-out'}}>
          <span style={{fontSize:28}}>🌙</span>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:600,color:'#F4EFE8',marginBottom:2}}>Bedtime!</div>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:'rgba(244,239,232,.6)'}}>It's story time with {childName}.</div>
          </div>
          <button onClick={()=>setBedtimeToast(false)} style={{background:'none',border:'none',color:'rgba(244,239,232,.3)',fontSize:16,cursor:'pointer',marginLeft:'auto',padding:4}}>✕</button>
        </div>
      )}
    </div>
  );
}
