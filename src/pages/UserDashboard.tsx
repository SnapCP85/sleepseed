import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getNightCards, getCharacters } from '../lib/storage';
import type { SavedNightCard, Character } from '../lib/types';

// ── helpers ────────────────────────────────────────────────────────────────────

function dateStr(d: Date) { return d.toISOString().split('T')[0]; }

function cardBelongsTo(card: SavedNightCard, charId: string) {
  return card.characterIds && card.characterIds.includes(charId);
}

function calculateGlow(cards: SavedNightCard[], charId: string): number {
  const dates = new Set(cards.filter(c => cardBelongsTo(c, charId)).map(c => c.date.split('T')[0]));
  let streak = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    if (dates.has(dateStr(d))) { streak++; d.setDate(d.getDate()-1); }
    else if (i === 0) { d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

type NightState = 'complete'|'missed'|'tonight'|'future';
interface WeekNight { label:string; date:Date; state:NightState; card?:SavedNightCard }

function getWeekNights(cards: SavedNightCard[], charId: string): WeekNight[] {
  const today = new Date(); today.setHours(0,0,0,0);
  const dow = today.getDay();
  const monday = new Date(today); monday.setDate(today.getDate()-(dow===0?6:dow-1));
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return Array.from({length:7},(_,i)=>{
    const d=new Date(monday); d.setDate(monday.getDate()+i);
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
  const last=sel[sel.length-1]; const rest=sel.slice(0,-1).map(c=>c.name).join(', ');
  return `What happened in ${rest} & ${last.name}'s world today?`;
}

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--teal2:#5DCAA5;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.dash{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:68px}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes twk2{0%,100%{opacity:.25}60%{opacity:.04}}
@keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pring{0%,100%{box-shadow:0 0 0 2px rgba(232,151,42,.55)}50%{box-shadow:0 0 0 8px rgba(232,151,42,0)}}
@keyframes pring-t{0%,100%{box-shadow:0 0 0 2px rgba(29,158,117,.55)}50%{box-shadow:0 0 0 8px rgba(29,158,117,0)}}
@keyframes pglow{0%,100%{box-shadow:0 0 6px rgba(176,120,8,.3)}50%{box-shadow:0 0 16px rgba(176,120,8,.75),0 0 28px rgba(176,120,8,.25)}}
@keyframes shoot{0%{opacity:.9;width:60px}100%{transform:translate(100px,50px) rotate(18deg);opacity:0;width:2px}}
@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.dash-star2{position:absolute;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.dash-shoot{position:absolute;height:1.5px;background:linear-gradient(90deg,#F5B84C,transparent);border-radius:1px;animation:shoot 3s ease-out infinite;animation-delay:9s;opacity:0;top:55px;left:80px;transform:rotate(18deg)}
.dash-sky{position:fixed;top:0;left:0;right:0;height:300px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}
.dash-moon-pos{position:fixed;top:70px;right:28px;z-index:2;pointer-events:none}
.dash-moon-glow{position:absolute;width:56px;height:56px;border-radius:50%;background:rgba(245,184,76,.07);top:-10px;left:-10px}
.dash-moon{width:34px;height:34px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden}
.dash-moon-sh{position:absolute;width:33px;height:33px;border-radius:50%;background:#050916;top:-6px;left:-8px}
.dash-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(232,151,42,.08);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.dash-logo{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:8px}
.dash-logo-moon{width:17px;height:17px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;flex-shrink:0}
.dash-logo-moon-sh{position:absolute;width:16px;height:16px;border-radius:50%;background:#050916;top:-4px;left:-7px}
.dash-nav-r{display:flex;align-items:center;gap:10px}
.dash-nav-user{font-size:11px;color:rgba(244,239,232,.25);font-family:var(--mono)}
.dash-nav-out{background:transparent;border:1px solid rgba(255,255,255,.07);color:rgba(244,239,232,.32);font-size:11px;cursor:pointer;font-family:var(--sans);padding:5px 13px;border-radius:7px;transition:all .2s}
.dash-nav-out:hover{border-color:rgba(255,255,255,.18);color:rgba(244,239,232,.65)}
.dash-guest{background:rgba(232,151,42,.05);border:1px solid rgba(232,151,42,.14);border-radius:13px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
.dash-guest-t{font-size:12.5px;color:rgba(244,239,232,.5);font-weight:300;line-height:1.5}
.dash-guest-t strong{color:rgba(232,151,42,.85);font-weight:600}
.dash-guest-btn{background:rgba(232,151,42,.12);border:1px solid rgba(232,151,42,.26);color:var(--amber2);border-radius:50px;padding:7px 18px;font-size:12px;font-weight:500;cursor:pointer;font-family:var(--sans);white-space:nowrap;flex-shrink:0}
.dash-inner{max-width:860px;margin:0 auto;padding:0 6% 24px;position:relative;z-index:5}
.dash-greet-row{display:flex;align-items:baseline;justify-content:space-between;padding-top:20px;margin-bottom:14px;flex-wrap:wrap;gap:5px}
.dash-greet{font-family:var(--serif);font-size:clamp(20px,3.5vw,30px);font-weight:700;color:var(--cream);letter-spacing:-.02em;line-height:1.15}
.dash-greet em{font-style:italic;color:var(--amber2)}
.dash-date{font-size:10px;color:rgba(244,239,232,.2);font-family:var(--mono)}
.dash-tabs-section{margin-bottom:14px}
.dash-tabs-label{font-size:9px;letter-spacing:.07em;color:rgba(255,255,255,.2);font-weight:600;text-transform:uppercase;margin-bottom:9px;font-family:var(--mono)}
.dash-tabs-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.dash-ctab{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:transform .15s}
.dash-ctab:hover{transform:translateY(-2px)}
.dash-cav{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;border:2.5px solid transparent;transition:all .25s;position:relative;overflow:hidden}
.dash-ctab-primary .dash-cav{border-color:var(--amber);animation:pring 2.5s ease-in-out infinite}
.dash-ctab-secondary .dash-cav{border-color:var(--teal);animation:pring-t 2.5s ease-in-out infinite}
.dash-ctab-idle .dash-cav{border-color:rgba(255,255,255,.06);opacity:.5}
.dash-ctab-idle:hover .dash-cav{opacity:.85;border-color:rgba(232,151,42,.28)}
.dash-cbadge{position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;border:1.5px solid var(--night);display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:700;animation:pop .2s ease-out forwards}
.dash-cbadge-1{background:var(--amber);color:#120800}
.dash-cbadge-2{background:var(--teal);color:#E1F5EE}
.dash-cname{font-size:9px;font-weight:500}
.dash-ctab-primary .dash-cname{color:var(--amber)}
.dash-ctab-secondary .dash-cname{color:var(--teal2)}
.dash-ctab-idle .dash-cname{color:var(--muted)}
.dash-cadd{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;opacity:.35;transition:opacity .2s}
.dash-cadd:hover{opacity:.8}
.dash-cadd .dash-cav{background:rgba(12,18,36,.9);border:1.5px dashed rgba(232,151,42,.2)}
.dash-cadd .dash-cname{color:var(--muted);font-style:italic;font-size:9px}
.dash-glow-card{background:rgba(255,255,255,.017);border:1px solid rgba(255,255,255,.045);border-radius:17px;padding:15px 20px;margin-bottom:11px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.dash-const-name{font-size:9px;color:rgba(90,72,32,.85);font-style:italic;margin-bottom:7px;font-family:var(--serif)}
.dash-gbar-wrap{height:3px;background:#0A0F1E;border-radius:2px;margin-top:9px;overflow:hidden}
.dash-gbar{height:3px;border-radius:2px;background:linear-gradient(90deg,var(--amber),var(--amber2));transition:width .6s ease}
.dash-gsub{display:flex;justify-content:space-between;margin-top:4px;font-size:8px;color:rgba(255,255,255,.15);font-family:var(--mono)}
.dash-gnum{font-family:var(--serif);font-size:34px;color:var(--amber2);line-height:1;text-shadow:0 0 24px rgba(245,184,76,.45)}
.dash-glbl{font-size:9px;color:var(--muted);letter-spacing:.04em;margin-top:2px}
.dash-ly{background:rgba(10,12,24,.97);border:.5px solid rgba(255,255,255,.05);border-left:2.5px solid var(--amber);border-radius:0 11px 11px 0;padding:8px 14px;display:flex;align-items:flex-start;gap:9px;margin-bottom:11px;cursor:pointer;transition:background .2s}
.dash-ly:hover{background:rgba(14,16,30,.97)}
.dash-ly-ico{font-size:10px;color:var(--amber);flex-shrink:0;margin-top:2px}
.dash-ly-text{font-size:11px;color:var(--dim);line-height:1.6}
.dash-ly-text em{color:var(--amber2);font-style:italic}
.dash-tnc{background:rgba(10,15,34,.98);border-radius:17px;padding:17px 20px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:13px;position:relative;overflow:hidden;animation:flt 4s ease-in-out infinite;cursor:pointer;transition:border-color .3s,filter .2s}
.dash-tnc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.35),transparent)}
.dash-tnc:hover{filter:brightness(1.06)}
.dash-tnc-sp{position:absolute;top:12px;right:15px;font-size:12px;opacity:.38;pointer-events:none;animation:twk 2.5s ease-in-out infinite}
.dash-tnc-sp2{position:absolute;bottom:13px;right:19px;font-size:8px;opacity:.25;pointer-events:none;animation:twk 3.5s ease-in-out infinite;animation-delay:.9s}
.dash-tnc-lbl{font-size:8px;letter-spacing:.08em;font-weight:600;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;transition:color .3s}
.dash-tnc-dot{width:4px;height:4px;border-radius:50%;animation:twk 2s ease-in-out infinite}
.dash-tnc-q{font-family:var(--serif);font-size:clamp(15px,2.2vw,19px);color:var(--cream);line-height:1.38;margin-bottom:4px}
.dash-n1{color:var(--amber2);font-style:italic;text-shadow:0 0 12px rgba(245,184,76,.3)}
.dash-n2{color:var(--teal2);font-style:italic;text-shadow:0 0 12px rgba(93,202,165,.3)}
.dash-tnc-sub{font-size:10px;color:var(--muted);font-style:italic}
.dash-tnc-right{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.dash-tnc-btn{border:none;border-radius:50px;padding:12px 22px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);white-space:nowrap;transition:filter .2s,transform .15s;letter-spacing:.01em}
.dash-tnc-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.dash-tnc-btn:disabled{opacity:.4;cursor:default}
.dash-tnc-sec{font-size:9.5px;color:rgba(255,255,255,.18);cursor:pointer;background:none;border:none;font-family:var(--sans);white-space:nowrap;transition:color .15s}
.dash-tnc-sec:hover{color:rgba(255,255,255,.4)}
.dash-week{background:rgba(255,255,255,.017);border:1px solid rgba(255,255,255,.045);border-radius:17px;padding:14px 20px}
.dash-week-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:6px}
.dash-week-title{font-size:9px;letter-spacing:.07em;color:rgba(255,255,255,.18);font-weight:600;text-transform:uppercase;font-family:var(--mono)}
.dash-week-right{display:flex;align-items:center;gap:10px}
.dash-week-toggle{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:3px 10px 3px 5px;cursor:pointer;transition:all .2s}
.dash-week-toggle:hover{background:rgba(255,255,255,.07)}
.dash-week-tav{width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;overflow:hidden}
.dash-week-tname{font-size:9px;font-weight:500}
.dash-week-lnk{font-size:9.5px;color:var(--amber);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.dash-week-lnk:hover{color:var(--amber2)}
.dash-nights{display:flex;gap:0;justify-content:space-between}
.dash-night{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex:1;transition:transform .15s}
.dash-night:hover .dash-nc{transform:scale(1.1)}
.dash-nc{width:clamp(34px,5.5vw,44px);height:clamp(34px,5.5vw,44px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(11px,1.8vw,15px);position:relative;transition:transform .15s}
.dash-nc-done{background:#12163A;border:2px solid #C08010;animation:pglow 3.5s ease-in-out infinite}
.dash-nc-missed{background:#07090E;border:1.5px dashed #10162A;opacity:.36}
.dash-nc-tonight{background:#12163A;border:2px solid var(--amber);animation:pring 2.5s ease-in-out infinite}
.dash-nc-future{background:#040608;border:.5px solid #08100A}
.dash-nc-badge{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:#B07808;border:2px solid var(--night);font-size:6px;display:flex;align-items:center;justify-content:center;color:#0A0600}
.dash-nd{font-size:8px;font-weight:500;font-family:var(--mono)}
.dash-nd-done{color:#8A6005}.dash-nd-missed{color:#101828}.dash-nd-tonight{color:var(--amber)}.dash-nd-future{color:#080E12}
.dash-nc-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px);animation:fadein .2s ease}
.dash-nc-modal{background:#0F1328;border:1px solid rgba(255,255,255,.08);border-radius:20px;max-width:380px;width:100%;overflow:hidden;animation:fadein .2s ease}
.dash-nc-modal-top{background:linear-gradient(135deg,#C49018,#A87010);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.dash-nc-modal-lbl{font-size:8.5px;font-weight:600;color:#0A0600;letter-spacing:.07em;text-transform:uppercase}
.dash-nc-modal-date{font-size:8.5px;color:rgba(10,6,0,.5);font-family:var(--mono)}
.dash-nc-modal-close{background:none;border:none;font-size:20px;color:rgba(10,6,0,.4);cursor:pointer;line-height:1;padding:0 2px}
.dash-nc-modal-body{padding:16px 18px}
.dash-nc-modal-fl{font-size:8px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;font-weight:500}
.dash-nc-modal-fv{font-size:13px;color:var(--dim);line-height:1.65;font-style:italic;margin-bottom:12px}
.dash-nc-modal-q{font-size:13px;color:var(--amber2);font-family:var(--serif);font-style:italic;margin-bottom:4px}
.dash-nc-modal-a{font-size:13px;color:var(--cream);line-height:1.6}
.dash-bnav{position:fixed;bottom:0;left:0;right:0;height:62px;background:rgba(5,7,16,.98);border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-around;padding:0 8%;z-index:20;backdrop-filter:blur(20px)}
.dash-bni{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:58px;padding:3px 0;transition:opacity .15s}
.dash-bni:hover{opacity:.75}
.dash-bni-ico{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px}
.dash-bni-on .dash-bni-ico{background:rgba(20,26,50,.9);box-shadow:0 0 10px rgba(232,151,42,.16)}
.dash-bni-lbl{font-size:7.5px;font-weight:500;font-family:var(--mono)}
.dash-bni-on .dash-bni-lbl{color:var(--amber)}
.dash-bni:not(.dash-bni-on) .dash-bni-lbl{color:rgba(255,255,255,.16)}
.dash-empty-cta{margin-bottom:14px;background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.13);border-radius:14px;padding:16px 20px}
.dash-empty-h{font-family:var(--serif);font-size:17px;color:var(--cream);margin-bottom:6px}
.dash-empty-sub{font-size:13px;color:rgba(244,239,232,.42);margin-bottom:12px;line-height:1.6;font-weight:300}
.dash-empty-btn{background:var(--amber);border:none;border-radius:50px;padding:10px 22px;font-size:13px;font-weight:600;color:#120800;cursor:pointer;font-family:inherit}
@media(max-width:600px){.dash-tnc{flex-direction:column;align-items:flex-start;gap:14px}.dash-tnc-right{width:100%}.dash-tnc-btn{width:100%}}
`;

// ── stars ─────────────────────────────────────────────────────────────────────

const STARS = Array.from({length:26},(_,i)=>({
  id:i, x:Math.random()*100, y:Math.random()*36,
  size:Math.random()<.4?3:2,
  d:(2.5+Math.random()*2.5).toFixed(1)+'s',
  dl:(Math.random()*3).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
}));

// ── constellation ─────────────────────────────────────────────────────────────

function ConstellationSvg({filled}:{filled:number}) {
  const pts=[[10,26],[38,13],[68,19],[104,8],[140,21],[178,13]];
  return (
    <svg width="200" height="36" viewBox="0 0 200 36">
      {pts.slice(0,-1).map((p,i)=>{
        const n=pts[i+1]; const a=i<filled-1;
        return <line key={i} x1={p[0]} y1={p[1]} x2={n[0]} y2={n[1]}
          stroke={a?'#2A2E10':'#0A1018'} strokeWidth="1.2" strokeDasharray="3,3"/>;
      })}
      {pts.map((p,i)=>{
        const f=i<filled;
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="5.5" fill={f?'#10163A':'#080C18'}
              stroke={f?'#B07808':'#0E1626'} strokeWidth={f?'1.6':'1'}/>
            {f
              ? <text x={p[0]} y={p[1]+3.5} textAnchor="middle" fontSize="8" fill="#B07808">★</text>
              : <circle cx={p[0]} cy={p[1]} r="3.5" fill="none" stroke="#101826" strokeWidth=".8" strokeDasharray="1.5,1.5"/>
            }
          </g>
        );
      })}
    </svg>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function UserDashboard({onSignUp}:{onSignUp:()=>void}) {
  const {user,logout,setView,selectedCharacters,setSelectedCharacters,setRitualSeed,setRitualMood,setEditingCharacter} = useApp();
  const [characters,setCharacters] = useState<Character[]>([]);
  const [allCards,setAllCards]     = useState<SavedNightCard[]>([]);
  const [loading,setLoading]       = useState(true);
  const [weekViewId,setWeekViewId] = useState<string>('');
  const [modalCard,setModalCard]   = useState<SavedNightCard|null>(null);
  const isGuest = !!user?.isGuest;

  useEffect(()=>{
    if(!user) return;
    Promise.all([getCharacters(user.id),getNightCards(user.id)]).then(([chars,cards])=>{
      setCharacters(chars); setAllCards(cards);
      if(chars.length>0){
        setSelectedCharacters([chars[0]]);
        setWeekViewId(chars[0].id);
      }
      setLoading(false);
    });
  },[user]); // eslint-disable-line

  const primary   = selectedCharacters[0]??null;
  const secondary = selectedCharacters[1]??null;
  const isMulti   = selectedCharacters.length>1;
  const weekChild = characters.find(c=>c.id===weekViewId)??primary;

  const glow   = useMemo(()=>weekChild?calculateGlow(allCards,weekChild.id):0,[allCards,weekChild]);
  const week   = useMemo(()=>weekChild?getWeekNights(allCards,weekChild.id):[]  ,[allCards,weekChild]);
  const lyCard = useMemo(()=>primary?getLastYearCard(allCards,primary.id):null  ,[allCards,primary]);

  const weekDone = week.filter(n=>n.state==='complete').length;
  const glowPct  = Math.min(100,Math.round((weekDone/7)*100));

  const hour   = new Date().getHours();
  const greet  = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const today  = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

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

  function startRitual(){ setRitualSeed(''); setRitualMood(''); setView('ritual-starter'); }

  const btnBg    = isMulti?'linear-gradient(135deg,#1D9E75,#158C62)':'linear-gradient(135deg,#E8972A,#CC7818)';
  const btnColor = isMulti?'#E1F5EE':'#120800';
  const dotColor = isMulti?'var(--teal)':'var(--amber)';
  const lblColor = isMulti?'var(--teal2)':'var(--amber)';
  const spColor  = isMulti?'var(--teal2)':'var(--amber2)';
  const cardBdr  = isMulti?'1.5px solid #1D9E75':'1.5px solid var(--amber)';
  const subText  = isMulti?'One story tonight — saved to both profiles':"Ask them — write or speak what they say";

  if(!user||loading) return null;

  return (
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

      {/* nav */}
      <nav className="dash-nav">
        <div className="dash-logo">
          <div className="dash-logo-moon"><div className="dash-logo-moon-sh"/></div>
          SleepSeed
        </div>
        <div className="dash-nav-r">
          {!isGuest&&<span className="dash-nav-user">{user.displayName}</span>}
          <button className="dash-nav-out" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="dash-inner">
        {isGuest&&(
          <div className="dash-guest" style={{marginTop:18}}>
            <div className="dash-guest-t">You're in <strong>guest mode.</strong> Stories won't be saved. Create a free account to keep everything.</div>
            <button className="dash-guest-btn" onClick={onSignUp}>Save my stories →</button>
          </div>
        )}

        {/* greeting */}
        <div className="dash-greet-row">
          <div className="dash-greet">{greet}{!isGuest&&user.displayName?`, ${user.displayName}`:''}.{' '}<em>Bedtime is close.</em></div>
          <div className="dash-date">{today}</div>
        </div>

        {/* empty state */}
        {characters.length===0&&!loading&&(
          <div className="dash-empty-cta">
            <div className="dash-empty-h">Welcome to SleepSeed ✦</div>
            <div className="dash-empty-sub">Start by creating your first character — the child who stars in every story.</div>
            <button className="dash-empty-btn" onClick={()=>{setEditingCharacter(null);setView('character-builder');}}>
              + Create first character
            </button>
          </div>
        )}

        {/* child tabs */}
        {characters.length>0&&(
          <div className="dash-tabs-section">
            <div className="dash-tabs-label">whose story is tonight?</div>
            <div className="dash-tabs-row">
              {characters.map(c=>{
                const idx=selectedCharacters.findIndex(x=>x.id===c.id);
                return (
                  <div key={c.id} className={tabClass(c)} onClick={()=>toggleChild(c)}>
                    <div className="dash-cav" style={{background:c.color+'22',color:c.color}}>
                      {c.photo
                        ? <img src={c.photo} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>
                        : c.emoji}
                      {idx>=0&&<div className={`dash-cbadge dash-cbadge-${idx+1}`}>{idx+1}</div>}
                    </div>
                    <div className="dash-cname">{c.name}</div>
                  </div>
                );
              })}
              <div className="dash-cadd" onClick={()=>{setEditingCharacter(null);setView('character-builder');}}>
                <div className="dash-cav"><span style={{fontSize:15,color:'rgba(255,255,255,.22)'}}>+</span></div>
                <div className="dash-cname">add child</div>
              </div>
            </div>
          </div>
        )}

        {/* glow card */}
        {weekChild&&(
          <div className="dash-glow-card">
            <div style={{flex:1}}>
              <div className="dash-const-name">✦ the little fox · week {Math.floor(glow/7)+1}</div>
              <ConstellationSvg filled={weekDone}/>
              <div className="dash-gbar-wrap" style={{maxWidth:200}}>
                <div className="dash-gbar" style={{width:`${glowPct}%`}}/>
              </div>
              <div className="dash-gsub" style={{maxWidth:200}}>
                <span>{weekDone} of 7 this week</span>
                <span>{7-weekDone>0?`${7-weekDone} nights to complete ✦`:'constellation complete ✦'}</span>
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div className="dash-gnum">{glow}</div>
              <div className="dash-glbl">nights strong ✦</div>
            </div>
          </div>
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

        {/* tonight card */}
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
              {selectedCharacters.length===2&&<>What happened in <span className="dash-n1">{primary?.name}</span>{' '}<span style={{color:'rgba(255,255,255,.35)',fontSize:'0.82em',fontStyle:'normal'}}>&</span>{' '}<span className="dash-n2">{secondary?.name}'s</span> world today?</>}
              {selectedCharacters.length>2&&<>{buildPromptText(selectedCharacters)}</>}
            </div>
            <div className="dash-tnc-sub">{subText}</div>
          </div>
          <div className="dash-tnc-right">
            <button className="dash-tnc-btn" style={{background:btnBg,color:btnColor}}
              onClick={e=>{e.stopPropagation();startRitual();}}
              disabled={selectedCharacters.length===0}>
              Start tonight's story ✦
            </button>
            <button className="dash-tnc-sec"
              onClick={e=>{e.stopPropagation();setView('story-builder');}}>
              create a different story →
            </button>
          </div>
        </div>

        {/* this week */}
        {weekChild&&(
          <div className="dash-week">
            <div className="dash-week-hd">
              <div className="dash-week-title">{isMulti?`${weekChild.name}'s week`:'this week'}</div>
              <div className="dash-week-right">
                {isMulti&&(()=>{
                  const other=selectedCharacters.find(c=>c.id!==weekViewId);
                  return other?(
                    <div className="dash-week-toggle" onClick={()=>setWeekViewId(other.id)}>
                      <div className="dash-week-tav" style={{background:other.color+'33',color:other.color}}>
                        {other.photo
                          ? <img src={other.photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                          : other.emoji}
                      </div>
                      <div className="dash-week-tname" style={{color:other.color}}>{other.name}'s week →</div>
                    </div>
                  ):null;
                })()}
                <button className="dash-week-lnk" onClick={()=>setView('nightcard-library')}>view all →</button>
              </div>
            </div>
            <div className="dash-nights">
              {week.map((n,i)=>(
                <div key={i} className="dash-night" onClick={()=>n.card&&setModalCard(n.card)}>
                  <div className={`dash-nc ${
                    n.state==='complete'?'dash-nc-done'
                    :n.state==='missed'?'dash-nc-missed'
                    :n.state==='tonight'?'dash-nc-tonight'
                    :'dash-nc-future'
                  }`}>
                    {n.state==='complete'&&<><span style={{color:'#B07808',textShadow:'0 0 8px rgba(176,120,8,.7)'}}>★</span><div className="dash-nc-badge">♥</div></>}
                    {n.state==='tonight'&&<span style={{color:'var(--amber)'}}>✦</span>}
                  </div>
                  <div className={`dash-nd ${
                    n.state==='complete'?'dash-nd-done'
                    :n.state==='missed'?'dash-nd-missed'
                    :n.state==='tonight'?'dash-nd-tonight'
                    :'dash-nd-future'
                  }`}>{n.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* bottom nav */}
      <div className="dash-bnav">
        {[
          {icon:'🏠',label:'Home',v:'dashboard'},
          {icon:'📖',label:'Stories',v:'story-library'},
          {icon:'🌙',label:'Cards',v:'nightcard-library'},
          {icon:'👤',label:'Profile',v:'user-profile'},
        ].map(item=>(
          <div key={item.label}
            className={`dash-bni ${item.v==='dashboard'?'dash-bni-on':''}`}
            onClick={()=>setView(item.v as any)}>
            <div className="dash-bni-ico">{item.icon}</div>
            <div className="dash-bni-lbl">{item.label}</div>
          </div>
        ))}
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
