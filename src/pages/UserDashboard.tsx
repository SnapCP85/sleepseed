import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../AppContext';
import type { SavedNightCard, Character } from '../lib/types';

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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --teal:#1D9E75;--teal2:#5DCAA5;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.dash{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:24px}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes twk2{0%,100%{opacity:.22}60%{opacity:.04}}
@keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pring{0%,100%{box-shadow:0 0 0 2px rgba(232,151,42,.55)}50%{box-shadow:0 0 0 8px rgba(232,151,42,0)}}
@keyframes pring-t{0%,100%{box-shadow:0 0 0 2px rgba(29,158,117,.55)}50%{box-shadow:0 0 0 8px rgba(29,158,117,0)}}
@keyframes pglow{0%,100%{box-shadow:0 0 6px rgba(176,120,8,.3)}50%{box-shadow:0 0 16px rgba(176,120,8,.75),0 0 28px rgba(176,120,8,.2)}}
@keyframes done-ring{0%,100%{box-shadow:0 0 0 3px rgba(176,120,8,.6),0 0 20px rgba(176,120,8,.3)}50%{box-shadow:0 0 0 7px rgba(176,120,8,0),0 0 28px rgba(176,120,8,.5)}}
@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%,100%{opacity:.04}50%{opacity:.09}}
@keyframes shoot{0%{opacity:.9;width:60px}100%{transform:translate(100px,50px) rotate(18deg);opacity:0;width:2px}}
@keyframes miss-fade{0%{opacity:0;transform:translateY(-4px)}15%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}

.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.dash-star2{position:absolute;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.dash-shoot{position:absolute;height:1.5px;background:linear-gradient(90deg,#F5B84C,transparent);border-radius:1px;animation:shoot 3s ease-out infinite;animation-delay:9s;opacity:0;top:55px;left:80px;transform:rotate(18deg)}
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

/* ── CHILD TABS ── */
.dash-tabs-section{margin-bottom:13px}
.dash-tabs-label{font-size:8.5px;letter-spacing:.07em;color:rgba(255,255,255,.18);font-weight:600;text-transform:uppercase;margin-bottom:8px;font-family:var(--mono)}
.dash-tabs-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.dash-ctab{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:transform .15s}
.dash-ctab:hover{transform:translateY(-2px)}
.dash-cav{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;border:2.5px solid transparent;transition:all .24s;position:relative;overflow:hidden}
.dash-ctab-primary .dash-cav{border-color:var(--amber);animation:pring 2.5s ease-in-out infinite}
.dash-ctab-secondary .dash-cav{border-color:var(--teal);animation:pring-t 2.5s ease-in-out infinite}
.dash-ctab-idle .dash-cav{border-color:rgba(255,255,255,.05);opacity:.48}
.dash-ctab-idle:hover .dash-cav{opacity:.82;border-color:rgba(232,151,42,.25)}
.dash-cbadge{position:absolute;bottom:-2px;right:-2px;width:13px;height:13px;border-radius:50%;border:1.5px solid var(--night);display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;animation:pop .2s ease-out}
.dash-cbadge-1{background:var(--amber);color:#120800}
.dash-cbadge-2{background:var(--teal);color:#E1F5EE}
.dash-cname{font-size:8.5px;font-weight:500}
.dash-ctab-primary .dash-cname{color:var(--amber)}
.dash-ctab-secondary .dash-cname{color:var(--teal2)}
.dash-ctab-idle .dash-cname{color:var(--muted)}
.dash-cadd{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;opacity:.32;transition:opacity .18s}
.dash-cadd:hover{opacity:.72}
.dash-cadd .dash-cav{background:rgba(12,18,36,.9);border:1.5px dashed rgba(232,151,42,.18)}
.dash-cadd .dash-cname{color:var(--muted);font-style:italic;font-size:8.5px}

/* ── FIRST NIGHT WELCOME ── */
.dash-first-night{background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.14);border-radius:16px;padding:14px 18px;margin-bottom:11px;text-align:center}
.dash-fn-icon{font-family:var(--serif);font-size:28px;color:var(--amber2);margin-bottom:7px;line-height:1}
.dash-fn-title{font-family:var(--serif);font-size:15px;color:var(--cream);margin-bottom:5px;font-style:italic}
.dash-fn-sub{font-size:11px;color:rgba(244,239,232,.32);line-height:1.65;font-weight:300}

/* ── GLOW CARD ── */
.dash-glow-card{background:rgba(255,255,255,.016);border:1px solid rgba(255,255,255,.042);border-radius:16px;padding:14px 18px;margin-bottom:11px}
.dash-gc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
.dash-const-name{font-size:9px;color:rgba(90,72,32,.85);font-style:italic;margin-bottom:6px;font-family:var(--serif)}
.dash-gc-right{text-align:right;flex-shrink:0}
.dash-gnum{font-family:var(--serif);font-size:32px;color:var(--amber2);line-height:1;text-shadow:0 0 22px rgba(245,184,76,.42)}
.dash-glbl{font-size:8.5px;color:var(--muted);letter-spacing:.04em;margin-top:1px}
.dash-gc-metrics{display:flex;gap:8px;margin-top:2px}
.dash-gc-metric{flex:1;background:rgba(0,0,0,.2);border-radius:9px;padding:7px 9px}
.dash-gc-metric-lbl{font-size:7.5px;color:rgba(255,255,255,.2);font-family:var(--mono);margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em}
.dash-gc-metric-val{font-size:12px;font-weight:600;color:var(--amber2)}
.dash-gc-metric-val.teal{color:var(--teal2)}
.dash-gc-metric-bar{height:2.5px;background:rgba(255,255,255,.05);border-radius:2px;margin-top:5px;overflow:hidden}
.dash-gc-metric-fill{height:2.5px;border-radius:2px;background:linear-gradient(90deg,#E8972A,#F5B84C);transition:width .6s ease}
.dash-gc-metric-fill.teal{background:linear-gradient(90deg,#5DCAA5,#1D9E75)}

/* ── LAST YEAR ── */
.dash-ly{background:rgba(10,12,24,.97);border:.5px solid rgba(255,255,255,.05);border-left:2.5px solid var(--amber);border-radius:0 10px 10px 0;padding:8px 13px;display:flex;align-items:flex-start;gap:8px;margin-bottom:11px;cursor:pointer;transition:background .18s}
.dash-ly:hover{background:rgba(14,16,30,.97)}
.dash-ly-ico{font-size:10px;color:var(--amber);flex-shrink:0;margin-top:1px}
.dash-ly-text{font-size:10.5px;color:var(--dim);line-height:1.6}
.dash-ly-text em{color:var(--amber2);font-style:italic}

/* ── TONIGHT CARD — normal ── */
.dash-tnc{background:rgba(10,15,34,.98);border-radius:16px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px;position:relative;overflow:hidden;animation:flt 4s ease-in-out infinite;cursor:pointer;transition:border-color .3s,filter .2s}
.dash-tnc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.35),transparent)}
.dash-tnc:hover{filter:brightness(1.06)}
.dash-tnc-sp{position:absolute;top:11px;right:14px;font-size:11px;opacity:.36;pointer-events:none;animation:twk 2.5s ease-in-out infinite}
.dash-tnc-sp2{position:absolute;bottom:12px;right:18px;font-size:8px;opacity:.22;pointer-events:none;animation:twk 3.5s ease-in-out infinite;animation-delay:.9s}
.dash-tnc-lbl{font-size:8px;letter-spacing:.08em;font-weight:600;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:4px;transition:color .3s}
.dash-tnc-dot{width:4px;height:4px;border-radius:50%;animation:twk 2s ease-in-out infinite}
.dash-tnc-q{font-family:var(--serif);font-size:clamp(14px,2vw,18px);color:var(--cream);line-height:1.38;margin-bottom:3px}
.dash-n1{color:var(--amber2);font-style:italic;text-shadow:0 0 12px rgba(245,184,76,.28)}
.dash-n2{color:var(--teal2);font-style:italic;text-shadow:0 0 12px rgba(93,202,165,.28)}
.dash-tnc-sub{font-size:10px;color:var(--muted);font-style:italic}
.dash-tnc-right{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:5px}
.dash-tnc-btn{border:none;border-radius:50px;padding:11px 20px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:var(--sans);white-space:nowrap;transition:filter .2s,transform .15s;letter-spacing:.01em}
.dash-tnc-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.dash-tnc-btn:disabled{opacity:.4;cursor:default;transform:none}
.dash-tnc-sec{font-size:9px;color:rgba(255,255,255,.16);cursor:pointer;background:none;border:none;font-family:var(--sans);white-space:nowrap;transition:color .15s;text-align:right}
.dash-tnc-sec:hover{color:rgba(255,255,255,.36)}

/* ── TONIGHT DONE ── */
.dash-tnc-done{background:rgba(8,18,12,.98);border:1.5px solid #1D9E75;border-radius:16px;padding:18px;margin-bottom:12px;text-align:center;animation:fadein .5s ease-out}
.dash-td-ritual-lbl{font-size:8px;letter-spacing:.1em;color:rgba(29,158,117,.6);font-weight:700;text-transform:uppercase;font-family:var(--mono);margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:5px}
.dash-td-ritual-dot{width:4px;height:4px;border-radius:50%;background:#1D9E75;animation:twk 2s ease-in-out infinite}
.dash-td-star{font-size:36px;color:#D4A028;animation:done-ring 3s ease-in-out infinite;display:inline-block;border-radius:50%;padding:3px;line-height:1;margin-bottom:8px}
.dash-td-title{font-family:var(--serif);font-size:16px;color:var(--cream);margin-bottom:5px;line-height:1.45}
.dash-td-name{color:var(--teal2);font-style:italic}
.dash-td-sub{font-size:10.5px;color:rgba(244,239,232,.32);line-height:1.6;font-style:italic;margin-bottom:9px}
.dash-td-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(29,158,117,.11);border:1px solid rgba(29,158,117,.24);border-radius:20px;padding:4px 12px;font-size:10px;color:var(--teal2);font-weight:500}

/* ── FIRST-TIME WELCOME CARD ── */
.dash-ft-card{background:linear-gradient(135deg,rgba(232,151,42,.07),rgba(232,151,42,.02));border:1px solid rgba(232,151,42,.2);border-radius:15px;padding:14px 16px;margin-bottom:14px;animation:fadein .5s ease-out}
.dash-ft-title{font-family:var(--serif);font-size:17px;color:var(--cream);font-weight:700;margin-bottom:4px;line-height:1.35}
.dash-ft-title em{color:var(--amber2);font-style:italic}
.dash-ft-sub{font-size:11px;color:rgba(244,239,232,.38);line-height:1.65;margin-bottom:10px;font-weight:300}
.dash-ft-btn{background:rgba(232,151,42,.12);border:1px solid rgba(232,151,42,.25);border-radius:9px;padding:8px 16px;font-size:12px;font-weight:500;color:var(--amber);cursor:pointer;font-family:var(--sans);transition:all .18s}
.dash-ft-btn:hover{background:rgba(232,151,42,.2)}

/* ── THREE ACTION CARDS ── */
.dash-ys-wrap{display:flex;gap:8px;margin-bottom:12px}
.dash-ys-card{flex:1;border-radius:12px;padding:11px 9px 10px;cursor:pointer;transition:filter .18s,transform .15s;display:flex;flex-direction:column;align-items:flex-start;min-height:82px;position:relative;overflow:hidden}
.dash-ys-card:hover{filter:brightness(1.12);transform:translateY(-1px)}
.dash-ys-card:active{transform:scale(.97)}
.dash-ys-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px}
.dash-ys-create{background:linear-gradient(145deg,rgba(232,151,42,.14),rgba(200,110,18,.08));border:1px solid rgba(232,151,42,.24)}
.dash-ys-create::before{background:linear-gradient(90deg,transparent,rgba(232,151,42,.5),transparent)}
.dash-ys-library{background:linear-gradient(145deg,rgba(90,120,220,.13),rgba(60,80,180,.07));border:1px solid rgba(100,130,255,.19)}
.dash-ys-library::before{background:linear-gradient(90deg,transparent,rgba(110,140,255,.42),transparent)}
.dash-ys-nc{background:linear-gradient(145deg,rgba(150,90,240,.14),rgba(110,60,200,.08));border:1px solid rgba(160,110,255,.19)}
.dash-ys-nc::before{background:linear-gradient(90deg,transparent,rgba(170,120,255,.42),transparent)}
.dash-ys-icon{font-size:17px;line-height:1;margin-bottom:5px}
.dash-ys-title{font-size:10.5px;font-weight:600;color:var(--cream);line-height:1.2;margin-bottom:2px}
.dash-ys-stat{font-size:8.5px;color:rgba(244,239,232,.3);line-height:1.35;font-family:var(--mono)}

/* ── WEEK ROW ── */
.dash-week{background:rgba(255,255,255,.016);border:1px solid rgba(255,255,255,.042);border-radius:16px;padding:13px 18px}
.dash-week-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:6px}
.dash-week-title{font-size:9px;letter-spacing:.07em;color:rgba(255,255,255,.18);font-weight:600;text-transform:uppercase;font-family:var(--mono)}
.dash-week-right{display:flex;align-items:center;gap:8px}
.dash-week-toggle{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:3px 9px 3px 4px;cursor:pointer;transition:all .18s}
.dash-week-toggle:hover{background:rgba(255,255,255,.07)}
.dash-week-tav{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:600;overflow:hidden;flex-shrink:0}
.dash-week-tname{font-size:8.5px;font-weight:500}
.dash-week-lnk{font-size:9px;color:var(--amber);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.dash-week-lnk:hover{color:var(--amber2)}
.dash-nights{display:flex;justify-content:space-between}
.dash-night{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;position:relative}
.dash-night.tappable{cursor:pointer}
.dash-night.tappable:hover .dash-nc{transform:scale(1.1)}
.dash-nc{width:clamp(32px,5.2vw,42px);height:clamp(32px,5.2vw,42px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(10px,1.7vw,14px);position:relative;transition:transform .15s}
.dash-nc-done{background:#12163A;border:2px solid #C08010;animation:pglow 3.5s ease-in-out infinite}
.dash-nc-missed{background:#070910;border:1.5px dashed #10162A;opacity:.34;cursor:pointer}
.dash-nc-tonight{background:#12163A;border:2px solid var(--amber);animation:pring 2.5s ease-in-out infinite}
.dash-nc-tonight-done{background:#0E1E12;border:2px solid var(--teal);animation:done-ring 3s ease-in-out infinite}
.dash-nc-future{background:#040608;border:.5px solid #080E10}
.dash-nc-badge{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid var(--night);font-size:5.5px;display:flex;align-items:center;justify-content:center}
.dash-nc-badge-gold{background:#B07808;color:#0A0600}
.dash-nc-badge-teal{background:#1D9E75;color:#E1F5EE}
.dash-nd{font-size:8px;font-weight:500;font-family:var(--mono)}
.dash-nd-done{color:#8A6005}.dash-nd-missed{color:#101828}.dash-nd-tonight{color:var(--amber)}.dash-nd-future{color:#080C12}.dash-nd-tdone{color:var(--teal)}
.dash-miss-tooltip{position:absolute;bottom:46px;left:50%;transform:translateX(-50%);background:#0F1328;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:5px 9px;font-size:8.5px;color:var(--dim);white-space:nowrap;font-style:italic;z-index:20;pointer-events:none;animation:miss-fade 2.2s ease-out forwards}

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

/* ── EMPTY WELCOME ── */
.dash-empty-cta{background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.12);border-radius:15px;padding:18px 20px;margin-bottom:14px}
.dash-empty-h{font-family:var(--serif);font-size:17px;color:var(--cream);margin-bottom:6px;font-style:italic}
.dash-empty-sub{font-size:12.5px;color:rgba(244,239,232,.38);margin-bottom:13px;line-height:1.65;font-weight:300}
.dash-empty-btn{background:var(--amber);border:none;border-radius:50px;padding:10px 22px;font-size:13px;font-weight:600;color:#120800;cursor:pointer;font-family:inherit}

@media(max-width:600px){.dash-tnc{flex-direction:column;align-items:flex-start;gap:13px}.dash-tnc-right{width:100%}.dash-tnc-btn{width:100%}}
`;

// ── stars ─────────────────────────────────────────────────────────────────────

const STARS=Array.from({length:26},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*36,
  size:Math.random()<.4?3:2,
  d:(2.5+Math.random()*2.5).toFixed(1)+'s',
  dl:(Math.random()*3).toFixed(1)+'s',t:Math.random()<.5?1:2,
}));

// ── SVG nav icons ─────────────────────────────────────────────────────────────

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

// ── constellation SVG ─────────────────────────────────────────────────────────

function ConstellationSvg({filled,complete}:{filled:number;complete:boolean}){
  const pts=[[9,24],[34,12],[60,18],[96,7],[130,20],[168,12]];
  return(
    <svg width="190" height="34" viewBox="0 0 190 34">
      {pts.slice(0,-1).map((p,i)=>{
        const n=pts[i+1];const a=i<filled-1;
        return<line key={i} x1={p[0]} y1={p[1]} x2={n[0]} y2={n[1]}
          stroke={a?'#2A2E10':'#0A1018'} strokeWidth="1.1" strokeDasharray="2.5,2.5"/>;
      })}
      {pts.map((p,i)=>{
        const f=i<filled;
        return(
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="5.2" fill={f?'#10163A':'#080C18'}
              stroke={f?(complete&&i===filled-1?'#D4A028':'#B07808'):'#0E1626'}
              strokeWidth={f?'1.5':'1'}/>
            {f
              ?<text x={p[0]} y={p[1]+3.2} textAnchor="middle" fontSize="7.5" fill={complete&&i===filled-1?'#D4A028':'#B07808'}>★</text>
              :<circle cx={p[0]} cy={p[1]} r="3.2" fill="none" stroke="#101826" strokeWidth=".7" strokeDasharray="1.5,1.5"/>
            }
          </g>
        );
      })}
    </svg>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function UserDashboard({onSignUp}:{onSignUp:()=>void}){
  const{user,logout,setView,selectedCharacters,setSelectedCharacters,setRitualSeed,setRitualMood,setEditingCharacter}=useApp();
  const[characters,setCharacters]=useState<Character[]>([]);
  const[allCards,setAllCards]=useState<SavedNightCard[]>([]);
  const[loading,setLoading]=useState(true);
  const[weekViewId,setWeekViewId]=useState<string>('');
  const[modalCard,setModalCard]=useState<SavedNightCard|null>(null);
  const[missTooltip,setMissTooltip]=useState<number|null>(null);
  const[storyCount,setStoryCount]=useState(0);
  const missTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isGuest=!!user?.isGuest;

  // detect first-time user — createdAt within 10 minutes of now
  const isNewUser=useMemo(()=>{
    if(!user?.createdAt) return false;
    const created=new Date(user.createdAt).getTime();
    const now=Date.now();
    return (now-created)<10*60*1000;
  },[user?.createdAt]);

  useEffect(()=>{
    if(!user) return;
    import('../lib/storage').then(({getCharacters,getNightCards,getStories})=>{
      Promise.all([getCharacters(user.id),getNightCards(user.id),getStories(user.id)]).then(([chars,cards,stories])=>{
        setCharacters(chars);setAllCards(cards);setStoryCount(stories.length);
        // Auto-select family characters (isFamily or human type as default)
        const familyChars=chars.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human'));
        if(familyChars.length>0){setSelectedCharacters([familyChars[0]]);setWeekViewId(familyChars[0].id);}
        else if(chars.length>0){setSelectedCharacters([chars[0]]);setWeekViewId(chars[0].id);}
        setLoading(false);
      });
    });
  },[user]); // eslint-disable-line

  // Family characters appear in the ritual dashboard tab row
  // Treat human-type characters as family by default when isFamily isn't explicitly set
  const familyChars=useMemo(()=>characters.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human')),[characters]);

  const primary=selectedCharacters[0]??null;
  const secondary=selectedCharacters[1]??null;
  const isMulti=selectedCharacters.length>1;
  const weekChild=characters.find(c=>c.id===weekViewId)??primary;

  const glow   =useMemo(()=>weekChild?calculateGlow(allCards,weekChild.id):0,[allCards,weekChild]);
  const week   =useMemo(()=>weekChild?getWeekNights(allCards,weekChild.id):[]  ,[allCards,weekChild]);
  const lyCard =useMemo(()=>primary?getLastYearCard(allCards,primary.id):null  ,[allCards,primary]);

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
  // New users get a special greeting; returning users get the time-aware one
  const greetEmText=isNewUser?'Welcome to SleepSeed.':greetSuffix==='done'?'Tonight\'s star is saved.':greetSuffix==='welcome'?'Welcome back.':'Bedtime is close.';

  const today=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();
  const hasAnyNights=allCards.length>0;

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

  function tabClass(c:Character){
    const i=selectedCharacters.findIndex(x=>x.id===c.id);
    if(i===0) return 'dash-ctab dash-ctab-primary';
    if(i===1) return 'dash-ctab dash-ctab-secondary';
    return 'dash-ctab dash-ctab-idle';
  }

  function startRitual(){setRitualSeed('');setRitualMood('');setView('ritual-starter');}

  function showMiss(idx:number){
    if(missTimer.current) clearTimeout(missTimer.current);
    setMissTooltip(idx);
    missTimer.current=setTimeout(()=>setMissTooltip(null),2200);
  }

  // avatar background — safe for any colour format
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

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if(!user) return null;

  if(loading) return(
    <div className="dash" style={{minHeight:'100vh'}}>
      <style>{CSS}</style>
      <div className="dash-sky"/>
      <div className="dash-stars">
        {STARS.map(s=>(
          <div key={s.id} className={s.t===1?'dash-star':'dash-star2'}
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
        ))}
      </div>
      <nav className="dash-nav">
        <div className="dash-logo">
          <div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>
          SleepSeed
        </div>
        <div className="dash-nav-tabs">
          {(['home','stories','cards','profile'] as const).map(k=>(
            <div key={k} className={`dash-ntab ${k==='home'?'on':''}`}>
              <div className="dash-ntab-ico">
                {k==='home'&&<IconHome on={k==='home'}/>}
                {k==='stories'&&<IconStories on={false}/>}
                {k==='cards'&&<IconCards on={false}/>}
                {k==='profile'&&<IconProfile on={false}/>}
              </div>
              <div className="dash-ntab-lbl">{k.charAt(0).toUpperCase()+k.slice(1)}</div>
            </div>
          ))}
        </div>
      </nav>
      <div className="dash-inner" style={{paddingTop:20}}>
        <div className="dash-skel" style={{height:22,width:'55%',marginBottom:8}}/>
        <div className="dash-skel" style={{height:12,width:'30%',marginBottom:18}}/>
        <div style={{display:'flex',gap:12,marginBottom:14}}>
          {[0,1].map(i=><div key={i} className="dash-skel" style={{width:42,height:42,borderRadius:'50%'}}/>)}
        </div>
        <div className="dash-skel" style={{height:90,borderRadius:16,marginBottom:11}}/>
        <div className="dash-skel" style={{height:36,borderRadius:10,marginBottom:11}}/>
        <div className="dash-skel" style={{height:120,borderRadius:16,marginBottom:11}}/>
        <div className="dash-skel" style={{height:90,borderRadius:16}}/>
      </div>
    </div>
  );

  // ── FULL RENDER ──────────────────────────────────────────────────────────────
  return(
    <div className="dash">
      <style>{CSS}</style>
      <div className="dash-sky"/>
      <div className="dash-stars">
        {STARS.map(s=>(
          <div key={s.id} className={s.t===1?'dash-star':'dash-star2'}
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
        ))}
        <div className="dash-shoot"/>
      </div>
      <div className="dash-moon-pos">
        <div className="dash-moon-glow"/>
        <div className="dash-moon"><div className="dash-moon-sh"/></div>
      </div>

      {/* ── TOP NAV ── */}
      <nav className="dash-nav">
        <div className="dash-logo">
          <div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>
          SleepSeed
        </div>
        <div className="dash-nav-tabs">
          {[
            {k:'home',   label:'Home',    Icon:IconHome,    view:'dashboard'},
            {k:'stories',label:'Stories', Icon:IconStories, view:'story-library'},
            {k:'cards',  label:'Cards',   Icon:IconCards,   view:'nightcard-library'},
            {k:'profile',label:'Profile', Icon:IconProfile, view:'user-profile'},
          ].map(({k,label,Icon,view:v})=>(
            <div key={k} className={`dash-ntab ${k==='home'?'on':''}`} onClick={()=>setView(v as any)}>
              <div className="dash-ntab-ico"><Icon on={k==='home'}/></div>
              <div className="dash-ntab-lbl">{label}</div>
            </div>
          ))}
        </div>
      </nav>

      <div className="dash-inner">
        {isGuest&&(
          <div className="dash-guest" style={{marginTop:18}}>
            <div className="dash-guest-t">You're in <strong>guest mode.</strong> Stories won't be saved.</div>
            <button className="dash-guest-btn" onClick={onSignUp}>Save my stories →</button>
          </div>
        )}

        {/* greeting */}
        <div className="dash-greet-row">
          <div className="dash-greet">
            {greetWord}{!isGuest&&user.displayName?`, ${user.displayName}`:''}.{' '}
            <em className={greetSuffix==='done'?'done':''}>{greetEmText}</em>
          </div>
          <div className="dash-date">{today}</div>
        </div>

        {/* first-time welcome card */}
        {isNewUser&&!isGuest&&(
          <div className="dash-ft-card">
            <div className="dash-ft-title">Welcome to SleepSeed.<br/>Let's get <em>started.</em></div>
            <div className="dash-ft-sub">Add your child, then begin tonight's ritual — your first story is minutes away.</div>
            <button className="dash-ft-btn" onClick={()=>setView('onboarding-tour')}>Take a quick tour →</button>
          </div>
        )}

        {/* empty state — no characters at all */}
        {characters.length===0&&(
          <div className="dash-empty-cta">
            <div className="dash-empty-h">Welcome to SleepSeed ✦</div>
            <div className="dash-empty-sub">Start by creating your first child character — they'll star in every story.</div>
            <button className="dash-empty-btn" onClick={()=>{setEditingCharacter(null);setView('character-builder');}}>
              + Create first character
            </button>
          </div>
        )}

        {/* child tabs — only family characters */}
        {familyChars.length>0&&(
          <div className="dash-tabs-section">
            <div className="dash-tabs-label">whose story is tonight?</div>
            <div className="dash-tabs-row">
              {familyChars.map(c=>{
                const idx=selectedCharacters.findIndex(x=>x.id===c.id);
                return(
                  <div key={c.id} className={tabClass(c)} onClick={()=>toggleChild(c)}>
                    <div className="dash-cav" style={{background:avatarBg(c.color),color:c.color}}>
                      {c.photo
                        ?<img src={c.photo} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>
                        :c.emoji}
                      {idx>=0&&<div className={`dash-cbadge dash-cbadge-${idx+1}`}>{idx+1}</div>}
                    </div>
                    <div className="dash-cname">{c.name}</div>
                  </div>
                );
              })}
              <div className="dash-cadd" onClick={()=>{setEditingCharacter(null);setView('character-builder');}}>
                <div className="dash-cav"><span style={{fontSize:14,color:'rgba(255,255,255,.2)'}}>+</span></div>
                <div className="dash-cname">add child</div>
              </div>
            </div>
          </div>
        )}

        {/* first night welcome OR glow card */}
        {weekChild&&(
          !hasAnyNights
          ?(
            <div className="dash-first-night">
              <div className="dash-fn-icon">✦</div>
              <div className="dash-fn-title">Plant your first seed tonight</div>
              <div className="dash-fn-sub">Complete tonight's story and your constellation will begin to glow. Every night adds a new star to your sky.</div>
            </div>
          ):(
            <div className="dash-glow-card">
              <div className="dash-gc-top">
                <div>
                  <div className="dash-const-name">
                    ✦ {constName}{constComplete?' · complete!':''}
                  </div>
                  <ConstellationSvg filled={weekDone} complete={constComplete}/>
                </div>
                <div className="dash-gc-right">
                  <div className="dash-gnum">{glow}</div>
                  <div className="dash-glbl">
                    {isMulti?`${weekChild.name}'s glow`:'night glow'}
                  </div>
                </div>
              </div>
              <div className="dash-gc-metrics">
                <div className="dash-gc-metric">
                  <div className="dash-gc-metric-lbl">this week</div>
                  <div className={`dash-gc-metric-val ${weekDone===7?'teal':''}`}>
                    {weekDone} / 7{weekDone===7?' ✦':''}
                  </div>
                  <div className="dash-gc-metric-bar">
                    <div className={`dash-gc-metric-fill ${weekDone===7?'teal':''}`}
                      style={{width:`${glowPct}%`}}/>
                  </div>
                </div>
                <div className="dash-gc-metric">
                  <div className="dash-gc-metric-lbl">
                    {isMulti?`${selectedCharacters.find(c=>c.id!==weekViewId)?.name||'other'}'s glow`:'to next ✦'}
                  </div>
                  {isMulti?(()=>{
                    const other=selectedCharacters.find(c=>c.id!==weekViewId);
                    const otherGlow=other?calculateGlow(allCards,other.id):0;
                    return<>
                      <div className="dash-gc-metric-val teal">{otherGlow} nights</div>
                      <div className="dash-gc-metric-bar">
                        <div className="dash-gc-metric-fill teal" style={{width:`${Math.min(100,Math.round((otherGlow%7)/7*100))}%`}}/>
                      </div>
                    </>;
                  })():(
                    <>
                      <div className="dash-gc-metric-val">
                        {toNextConst===0?'complete!':toNextConst===1?'1 night':`${toNextConst} nights`}
                      </div>
                      <div className="dash-gc-metric-bar">
                        <div className="dash-gc-metric-fill teal"
                          style={{width:`${Math.min(100,Math.round(((7-toNextConst)/7)*100))}%`}}/>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* last year banner */}
        {lyCard&&(
          <div className="dash-ly" onClick={()=>setModalCard(lyCard)}>
            <div className="dash-ly-ico">✦</div>
            <div className="dash-ly-text">
              One year ago tonight, {lyCard.heroName} said:{' '}
              <em>"{lyCard.quote||lyCard.bondingAnswer||lyCard.memory_line||'…'}"</em>
            </div>
          </div>
        )}

        {/* tonight card — normal OR done */}
        {tonightDone?(
          <div className="dash-tnc-done">
            <div className="dash-td-ritual-lbl">
              <div className="dash-td-ritual-dot"/><span>ritual complete</span><div className="dash-td-ritual-dot"/>
            </div>
            <div className="dash-td-star">★</div>
            <div className="dash-td-title">
              Tonight's star is saved.<br/>
              Sleep well, <span className="dash-td-name">{primary?.name}.</span>
            </div>
            {(tonightCard?.quote||tonightCard?.bondingAnswer)&&(
              <div className="dash-td-sub">
                "{tonightCard.quote||tonightCard.bondingAnswer}"
              </div>
            )}
            <div className="dash-td-badge">✦ {glow} nights strong</div>
          </div>
        ):(
          <div className="dash-tnc" style={{border:cardBdr}} onClick={startRitual}>
            <div className="dash-tnc-sp" style={{color:spColor}}>✦</div>
            <div className="dash-tnc-sp2" style={{color:spColor}}>✧</div>
            <div style={{flex:1}}>
              <div className="dash-tnc-lbl" style={{color:lblColor}}>
                <div className="dash-tnc-dot" style={{background:dotColor}}/>
                {isMulti?`tonight's ritual · ${selectedCharacters.length} children`:"tonight's ritual"}
              </div>
              <div className="dash-tnc-q">
                {selectedCharacters.length===0&&'Create a character to get started'}
                {selectedCharacters.length===1&&<>What happened in <span className="dash-n1">{primary?.name}'s</span> world today?</>}
                {selectedCharacters.length===2&&<>What happened in <span className="dash-n1">{primary?.name}</span>{' '}<span style={{color:'rgba(255,255,255,.3)',fontSize:'0.82em',fontStyle:'normal'}}>&</span>{' '}<span className="dash-n2">{secondary?.name}'s</span> world today?</>}
                {selectedCharacters.length>2&&<>{buildPromptText(selectedCharacters)}</>}
              </div>
              <div className="dash-tnc-sub">{subText}</div>
            </div>
            <div className="dash-tnc-right">
              <button className="dash-tnc-btn" style={{background:btnBg,color:btnColor}}
                onClick={e=>{e.stopPropagation();startRitual();}}
                disabled={selectedCharacters.length===0}>
                Begin tonight's ritual ✦
              </button>
            </div>
          </div>
        )}

        {/* ── THREE ACTION CARDS ── */}
        <div className="dash-ys-wrap">
          <div className="dash-ys-card dash-ys-create" onClick={()=>setView('story-configure' as any)}>
            <div className="dash-ys-icon">✨</div>
            <div className="dash-ys-title">Create a story</div>
            <div className="dash-ys-stat">Any story, any time</div>
          </div>
          <div className="dash-ys-card dash-ys-library" onClick={()=>setView('story-library')}>
            <div className="dash-ys-icon">📚</div>
            <div className="dash-ys-title">My Library</div>
            <div className="dash-ys-stat">{storyCount>0?`${storyCount} ${storyCount===1?'story':'stories'} saved`:'No stories yet'}</div>
          </div>
          <div className="dash-ys-card dash-ys-nc" onClick={()=>setView('nightcard-library')}>
            <div className="dash-ys-icon">🌙</div>
            <div className="dash-ys-title">Night Cards</div>
            <div className="dash-ys-stat">{allCards.filter(c=>!c.isOrigin).length>0?`${allCards.filter(c=>!c.isOrigin).length} cards saved`:'Start saving'}</div>
          </div>
        </div>

        {/* this week */}
        {weekChild&&hasAnyNights&&(
          <div className="dash-week">
            <div className="dash-week-hd">
              <div className="dash-week-title">
                {isMulti?`${weekChild.name}'s week`:'this week'}
              </div>
              <div className="dash-week-right">
                {isMulti&&(()=>{
                  const other=selectedCharacters.find(c=>c.id!==weekViewId);
                  return other?(
                    <div className="dash-week-toggle" onClick={()=>setWeekViewId(other.id)}>
                      <div className="dash-week-tav" style={{background:avatarBg(other.color),color:other.color}}>
                        {other.photo
                          ?<img src={other.photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                          :other.emoji}
                      </div>
                      <div className="dash-week-tname" style={{color:other.color}}>{other.name}'s week →</div>
                    </div>
                  ):null;
                })()}
                <button className="dash-week-lnk" onClick={()=>setView('nightcard-library')}>view all →</button>
              </div>
            </div>
            <div className="dash-nights">
              {week.map((n,i)=>{
                const isTodayDone=n.state==='complete'&&n.date.toISOString().split('T')[0]===todayStr;
                return(
                  <div key={i}
                    className={`dash-night ${n.state==='complete'||n.state==='missed'?'tappable':''}`}
                    onClick={()=>{
                      if(n.state==='complete'&&n.card) setModalCard(n.card);
                      else if(n.state==='missed') showMiss(i);
                    }}>
                    <div className={`dash-nc ${
                      n.state==='complete'&&isTodayDone?'dash-nc-tonight-done'
                      :n.state==='complete'?'dash-nc-done'
                      :n.state==='missed'?'dash-nc-missed'
                      :n.state==='tonight'?'dash-nc-tonight'
                      :'dash-nc-future'
                    }`}>
                      {n.state==='complete'&&isTodayDone&&(
                        <><span style={{color:'var(--teal)',textShadow:'0 0 8px rgba(29,158,117,.7)'}}>★</span>
                        <div className="dash-nc-badge dash-nc-badge-teal">♥</div></>
                      )}
                      {n.state==='complete'&&!isTodayDone&&(
                        <><span style={{color:'#B07808',textShadow:'0 0 8px rgba(176,120,8,.7)'}}>★</span>
                        {n.card&&<div className="dash-nc-badge dash-nc-badge-gold">♥</div>}</>
                      )}
                      {n.state==='tonight'&&<span style={{color:'var(--amber)'}}>✦</span>}
                      {missTooltip===i&&<div className="dash-miss-tooltip">The story world held a light for you ✦</div>}
                    </div>
                    <div className={`dash-nd ${
                      n.state==='complete'&&isTodayDone?'dash-nd-tdone'
                      :n.state==='complete'?'dash-nd-done'
                      :n.state==='missed'?'dash-nd-missed'
                      :n.state==='tonight'?'dash-nd-tonight'
                      :'dash-nd-future'
                    }`}>{n.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* night card modal */}
      {modalCard&&(
        <div className="dash-nc-modal-bg" onClick={()=>setModalCard(null)}>
          <div className="dash-nc-modal" onClick={e=>e.stopPropagation()}>
            <div className="dash-nc-modal-top">
              <div className="dash-nc-modal-lbl">✦ Night Card</div>
              <div className="dash-nc-modal-date">{modalCard.date?.split('T')[0]}</div>
              <button className="dash-nc-modal-close" onClick={()=>setModalCard(null)}>×</button>
            </div>
            <div className="dash-nc-modal-body">
              {modalCard.storyTitle&&<><div className="dash-nc-modal-fl">Story</div><div className="dash-nc-modal-fv">{modalCard.storyTitle}</div></>}
              {modalCard.quote&&<><div className="dash-nc-modal-fl">What they said</div><div className="dash-nc-modal-fv">"{modalCard.quote}"</div></>}
              {modalCard.bondingQuestion&&(<>
                <div className="dash-nc-modal-q">"{modalCard.bondingQuestion}"</div>
                {modalCard.bondingAnswer&&<div className="dash-nc-modal-a">{modalCard.bondingAnswer}</div>}
              </>)}
              {!modalCard.quote&&!modalCard.bondingQuestion&&<div className="dash-nc-modal-fv">{modalCard.memory_line||'A night to remember ✦'}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
