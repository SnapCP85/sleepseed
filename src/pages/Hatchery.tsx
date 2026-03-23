import { useState, useEffect, useMemo } from 'react';
import type { User, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, getAllHatchedCreatures, createEgg } from '../lib/hatchery';
import { CREATURES, getCreature } from '../lib/creatures';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600;1,9..144,700&family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes hTwk{0%,100%{opacity:.15}50%{opacity:.85}}
@keyframes hTwk2{0%,100%{opacity:.35}60%{opacity:.1}}
@keyframes hFlt{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes hFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes hPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes hPulse{0%,100%{opacity:.1;transform:scale(.97)}50%{opacity:.4;transform:scale(1.03)}}
@keyframes hRock{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
@keyframes hShine{0%{left:-100%}100%{left:200%}}
@keyframes hBounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.05)}}

.h{min-height:100vh;background:radial-gradient(ellipse 130% 55% at 50% 0%,#0a0830 0%,#060418 45%,#030210 100%);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased}
.h-sf{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.h-star{position:absolute;border-radius:50%;background:#fff;animation:hTwk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.h-star2{position:absolute;border-radius:50%;background:#E8D8FF;animation:hTwk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}

/* nav */
.h-nav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgba(6,4,24,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(180,140,255,.08);position:sticky;top:0;z-index:20}
.h-back{background:rgba(180,140,255,.07);border:1px solid rgba(180,140,255,.18);border-radius:50px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;color:rgba(180,140,255,.7);transition:all .2s}
.h-back:hover{background:rgba(180,140,255,.13)}
.h-title{font-family:'Fraunces',serif;font-size:18px;font-weight:700}
.h-badge{padding:5px 10px;border-radius:50px;background:rgba(180,140,255,.08);border:1px solid rgba(180,140,255,.15);font-size:10px;font-weight:800;color:rgba(180,140,255,.6);font-family:'DM Mono',monospace}

.h-inner{max-width:460px;margin:0 auto;padding:0 16px 100px;position:relative;z-index:5}

/* ═══════════════════════════════════════════
   MEADOW — all creatures hanging out
═══════════════════════════════════════════ */
.h-meadow{position:relative;height:200px;margin:16px 0 12px;background:linear-gradient(170deg,#08062a,#050318,#030212);border:1px solid rgba(180,140,255,.06);border-radius:24px;overflow:hidden}
.h-meadow-floor{position:absolute;bottom:0;left:0;right:0;height:50px;background:linear-gradient(0deg,rgba(20,12,50,.9),transparent)}
.h-meadow-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(20px)}
.h-meadow-creature{position:absolute;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:3px;z-index:5;cursor:pointer;transition:transform .25s}
.h-meadow-creature:hover{transform:translateY(-8px) scale(1.1)}
.h-meadow-emoji{line-height:1;animation:hBounce var(--d,4s) ease-in-out infinite var(--dl,0s)}
.h-meadow-name{font-size:9px;font-weight:800;color:rgba(255,255,255,.55);font-family:'Baloo 2',cursive}
.h-meadow-shadow{width:28px;height:6px;border-radius:50%;background:rgba(0,0,0,.35);margin-top:-2px}
.h-meadow-egg{position:absolute;top:14px;right:14px;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:6;background:rgba(0,0,0,.25);border-radius:14px;padding:8px 10px;border:1px solid rgba(245,184,76,.15)}
.h-meadow-egg-emoji{font-size:28px;animation:hRock 2.5s ease-in-out infinite;filter:drop-shadow(0 0 8px rgba(245,184,76,.3))}
.h-meadow-egg-label{font-size:8px;color:rgba(245,184,76,.5);font-weight:700;font-family:'DM Mono',monospace}
.h-meadow-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;color:rgba(255,255,255,.15);font-style:italic;font-family:'Fraunces',serif}

/* section label */
.h-section{font-size:10px;font-weight:800;color:rgba(180,140,255,.4);text-transform:uppercase;letter-spacing:.1em;font-family:'DM Mono',monospace;margin:18px 0 12px;display:flex;align-items:center;gap:8px}
.h-section::after{content:'';flex:1;height:1px;background:rgba(180,140,255,.06)}

/* ═══════════════════════════════════════════
   CREATURE PORTRAIT GRID — collectible cards
═══════════════════════════════════════════ */
.h-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}

.h-portrait{border-radius:20px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;animation:hFade .4s ease-out both}
.h-portrait:hover{transform:translateY(-4px) scale(1.02)}
.h-portrait:active{transform:scale(.96)}
.h-portrait::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.03),transparent);pointer-events:none;animation:hShine 7s ease-in-out infinite}

.h-portrait-top{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:12px}
.h-portrait-aura{position:absolute;width:100px;height:100px;border-radius:50%;animation:hPulse 4s ease-in-out infinite;pointer-events:none}
.h-portrait-emoji{font-size:56px;position:relative;z-index:2;animation:hFlt var(--d,3.5s) ease-in-out infinite var(--dl,0s)}
.h-portrait-rarity{position:absolute;top:8px;right:8px;padding:2px 8px;border-radius:10px;font-size:7px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-family:'DM Mono',monospace;z-index:3}
.h-portrait-new{position:absolute;top:8px;left:8px;padding:2px 8px;border-radius:10px;font-size:7px;font-weight:900;font-family:'DM Mono',monospace;z-index:3}

.h-portrait-info{padding:10px 12px 12px;text-align:center}
.h-portrait-name{font-family:'Fraunces',serif;font-size:16px;font-weight:700;line-height:1.2;margin-bottom:2px}
.h-portrait-type{font-size:9px;font-family:'DM Mono',monospace;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
.h-portrait-traits{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}
.h-portrait-trait{padding:2px 8px;border-radius:50px;font-size:8px;font-weight:700}
.h-portrait-dream{font-family:'Fraunces',serif;font-size:11px;font-style:italic;line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* egg card in grid */
.h-egg-card{border-radius:20px;border:1.5px dashed rgba(245,184,76,.2);background:rgba(245,184,76,.03);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;aspect-ratio:3/4;cursor:default}
.h-egg-card-emoji{font-size:44px;animation:hRock 2.5s ease-in-out infinite;filter:drop-shadow(0 0 12px rgba(245,184,76,.3));margin-bottom:8px}
.h-egg-card-title{font-family:'Fraunces',serif;font-size:13px;font-weight:700;color:rgba(245,184,76,.6);margin-bottom:4px}
.h-egg-card-bar{width:80%;height:4px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;margin:6px auto}
.h-egg-card-fill{height:100%;background:linear-gradient(90deg,#F5B84C,#FFE080);border-radius:2px}
.h-egg-card-hint{font-size:10px;color:rgba(245,184,76,.35);font-weight:700}

/* ═══════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════ */
.h-mod-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(12px);animation:hFade .15s ease}
.h-mod{background:linear-gradient(175deg,#0c1030,#080c20);border-radius:24px;max-width:400px;width:100%;max-height:88vh;overflow-y:auto;animation:hPop .3s ease-out;position:relative;border:1px solid rgba(255,255,255,.06)}
.h-mod::-webkit-scrollbar{display:none}
.h-mod-x{position:sticky;top:0;z-index:5;display:flex;justify-content:flex-end;padding:12px 14px 0}
.h-mod-x button{background:rgba(255,255,255,.06);border:none;width:32px;height:32px;border-radius:50%;color:rgba(255,255,255,.4);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.h-mod-hero{text-align:center;padding:8px 20px 16px}
.h-mod-emoji{font-size:80px;animation:hFlt 3s ease-in-out infinite;display:inline-block;margin-bottom:8px}
.h-mod-name{font-family:'Fraunces',serif;font-size:28px;font-weight:700;margin-bottom:2px}
.h-mod-type{font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
.h-mod-rar{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:50px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-family:'DM Mono',monospace}
.h-mod-desc{font-family:'Fraunces',serif;font-size:15px;font-style:italic;line-height:1.55;padding:12px 24px 0}
.h-mod-body{padding:16px 20px 20px}
.h-mod-lbl{font-size:8px;font-family:'DM Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.2);margin-bottom:6px}
.h-mod-quote{font-family:'Fraunces',serif;font-size:16px;font-style:italic;line-height:1.6;padding:14px 16px;border-radius:16px;margin-bottom:16px}
.h-mod-traits{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.h-mod-trait{padding:5px 14px;border-radius:50px;font-size:10.5px;font-weight:700}
.h-mod-secret{font-size:12.5px;font-style:italic;line-height:1.6;margin-bottom:16px;padding:12px 14px;border-radius:14px;display:flex;align-items:flex-start;gap:8px}
.h-mod-photo{width:100%;border-radius:14px;margin-bottom:16px;object-fit:cover}
.h-mod-date{font-size:10px;font-family:'DM Mono',monospace;color:rgba(255,255,255,.2);text-align:center;padding-bottom:8px}

/* empty */
.h-empty{text-align:center;padding:50px 20px}
.h-empty-ico{font-size:56px;margin-bottom:14px;animation:hFlt 3s ease-in-out infinite}
.h-empty-h{font-family:'Fraunces',serif;font-size:18px;margin-bottom:6px;font-style:italic}
.h-empty-sub{font-size:13px;color:rgba(244,239,232,.3);line-height:1.65}

/* bottom nav */
.h-bnav{display:flex;background:rgba(6,4,24,.97);border-top:1px solid rgba(180,140,255,.06);padding:8px 0 6px;position:fixed;bottom:0;left:0;right:0;z-index:20;backdrop-filter:blur(16px)}
.h-bnav-i{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:2px 0}
.h-bnav-ico{font-size:20px;line-height:1}
.h-bnav-lbl{font-size:9px;font-weight:700}
.h-bnav-i.on .h-bnav-lbl{color:#b48cff}
.h-bnav-i:not(.on) .h-bnav-lbl{color:rgba(255,255,255,.35)}
.h-bnav-i:not(.on) .h-bnav-ico{opacity:.45}
`;

const STARS = Array.from({length:35},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*45,
  size:Math.random()<.3?4:Math.random()<.6?3:2,
  d:(2+Math.random()*3).toFixed(1)+'s',
  dl:(Math.random()*4).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
}));

const MEADOW_POSITIONS = [
  {left:'8%',d:'3.8s',dl:'0s',sz:38},
  {left:'28%',d:'4.2s',dl:'-.6s',sz:36},
  {left:'50%',d:'3.5s',dl:'-1.2s',sz:40},
  {left:'72%',d:'4s',dl:'-.3s',sz:36},
  {left:'90%',d:'3.6s',dl:'-1s',sz:34},
];

const RARITY: Record<string,{label:string;icon:string;bg:string;border:string;text:string}> = {
  legendary:{label:'LEGENDARY',icon:'⭐',bg:'rgba(245,184,76,.12)',border:'rgba(245,184,76,.3)',text:'#F5B84C'},
  rare:{label:'RARE',icon:'✦',bg:'rgba(180,140,255,.1)',border:'rgba(180,140,255,.25)',text:'#b48cff'},
  common:{label:'COMMON',icon:'·',bg:'rgba(255,255,255,.04)',border:'rgba(255,255,255,.08)',text:'rgba(255,255,255,.35)'},
};

interface HatcheryProps { user: User; onBack: () => void; }

export default function Hatchery({ user, onBack }: HatcheryProps) {
  const [characters,setCharacters]=useState<Character[]>([]);
  const [creatures,setCreatures]=useState<HatchedCreature[]>([]);
  const [eggs,setEggs]=useState<Map<string,HatcheryEgg>>(new Map());
  const [allCards,setAllCards]=useState<import('../lib/types').SavedNightCard[]>([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<HatchedCreature|null>(null);

  useEffect(()=>{
    if(!hasSupabase){setLoading(false);return;}
    const load=async()=>{
      const{getCharacters,getNightCards}=await import('../lib/storage');
      const[chars,c,cards]=await Promise.all([getCharacters(user.id),getAllHatchedCreatures(user.id),getNightCards(user.id)]);
      const familyChars=chars.filter(ch=>ch.isFamily===true||(ch.isFamily===undefined&&ch.type==='human'));
      setCharacters(familyChars);setCreatures(c);setAllCards(cards);
      const eggMap=new Map<string,HatcheryEgg>();
      for(const char of familyChars){
        let egg=await getActiveEgg(user.id,char.id);
        if(!egg){try{const rc=CREATURES[Math.floor(Math.random()*CREATURES.length)];egg=await createEgg(user.id,char.id,rc.id,1);}catch{}}
        if(egg)eggMap.set(char.id,egg);
      }
      setEggs(eggMap);setLoading(false);
    };
    load();
  },[user.id]);

  const primaryChar=characters[0]??null;
  const primaryEgg=primaryChar?eggs.get(primaryChar.id)??null:null;
  const primaryStage=useMemo(()=>{
    if(!primaryEgg)return 0;
    const sd=primaryEgg.startedAt.split('T')[0];
    return Math.min(allCards.filter(c=>c.characterIds.includes(primaryEgg.characterId)&&c.date.split('T')[0]>=sd).length,7);
  },[primaryEgg,allCards]);
  const newestId=creatures.length>0?creatures[0].id:null;

  const starField=STARS.map(s=>(
    <div key={s.id} className={s.t===1?'h-star':'h-star2'}
      style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
  ));

  if(loading)return(
    <div className="h"><style>{CSS}</style><div className="h-sf">{starField}</div>
      <div className="h-nav"><div className="h-back" onClick={onBack}>← Home</div><div className="h-title">Your Hatchery</div><div style={{width:60}}/></div>
      <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,.2)',fontSize:13}}>Loading your companions...</div>
    </div>
  );

  return(
    <div className="h">
      <style>{CSS}</style>
      <div className="h-sf">{starField}</div>

      <div className="h-nav">
        <div className="h-back" onClick={onBack}>← Home</div>
        <div className="h-title">🏠 Your Hatchery</div>
        <div className="h-badge">{creatures.length} friend{creatures.length!==1?'s':''}</div>
      </div>

      <div className="h-inner">
        {/* ── MEADOW — creatures hanging out together ── */}
        <div className="h-meadow">
          <div className="h-meadow-glow" style={{width:180,height:70,top:10,left:-40,background:'radial-gradient(ellipse,rgba(180,140,255,.07),transparent 70%)'}}/>
          <div className="h-meadow-glow" style={{width:160,height:60,top:20,right:-30,background:'radial-gradient(ellipse,rgba(245,184,76,.06),transparent 70%)'}}/>
          <div className="h-meadow-glow" style={{width:140,height:50,bottom:20,left:'35%',background:'radial-gradient(ellipse,rgba(96,232,176,.05),transparent 70%)'}}/>
          <div className="h-meadow-floor"/>

          {creatures.length===0&&!primaryEgg&&(
            <div className="h-meadow-empty">Your friends will gather here…</div>
          )}

          {creatures.slice(0,5).map((c,i)=>{
            const pos=MEADOW_POSITIONS[i];
            return(
              <div key={c.id} className="h-meadow-creature" style={{left:pos.left}} onClick={()=>setSelected(c)}>
                <div className="h-meadow-emoji" style={{fontSize:pos.sz,'--d':pos.d,'--dl':pos.dl,filter:`drop-shadow(0 4px 12px ${c.color}40)`} as any}>{c.creatureEmoji}</div>
                <div className="h-meadow-name" style={{color:`${c.color}aa`}}>{c.name}</div>
                <div className="h-meadow-shadow"/>
              </div>
            );
          })}

          {primaryEgg&&(
            <div className="h-meadow-egg">
              <div className="h-meadow-egg-emoji">🥚</div>
              <div className="h-meadow-egg-label">Week {primaryEgg.weekNumber}</div>
            </div>
          )}
        </div>

        {/* ── EGG PROGRESS (if active) ── */}
        {primaryEgg&&(
          <>
            <div className="h-section">Growing</div>
            <div className="h-egg-card" style={{aspectRatio:'auto',padding:16,marginBottom:12}}>
              <div className="h-egg-card-emoji">🥚</div>
              <div className="h-egg-card-title">Something is growing…</div>
              <div className="h-egg-card-bar"><div className="h-egg-card-fill" style={{width:`${Math.round((primaryStage/7)*100)}%`}}/></div>
              <div className="h-egg-card-hint">{primaryStage>=7?'Ready to hatch!':` ${7-primaryStage} more night${7-primaryStage!==1?'s':''} · ${primaryStage}/7`}</div>
            </div>
          </>
        )}

        {/* ── PORTRAIT GRID ── */}
        {creatures.length>0&&(
          <>
            <div className="h-section">{creatures.length===1?'Your Friend':`Your Friends · ${creatures.length}`}</div>
            <div className="h-grid">
              {creatures.map((c,i)=>{
                const def=getCreature(c.creatureType);
                const r=RARITY[c.rarity]||RARITY.common;
                const isNew=c.id===newestId;
                return(
                  <div key={c.id} className="h-portrait" style={{
                    background:`linear-gradient(170deg,${c.color}10,${c.color}05,rgba(4,4,20,.98))`,
                    border:`1.5px solid ${c.color}20`,
                    animationDelay:`${i*0.07}s`,
                  }} onClick={()=>setSelected(c)}>
                    <div className="h-portrait-top" style={{background:`linear-gradient(180deg,${c.color}0a,transparent)`}}>
                      <div className="h-portrait-aura" style={{background:`radial-gradient(circle,${c.color}15,transparent 70%)`}}/>
                      <div className="h-portrait-emoji" style={{'--d':`${3.5+i*.3}s`,'--dl':`${-i*.4}s`,filter:`drop-shadow(0 5px 16px ${c.color}40)`} as any}>{c.creatureEmoji}</div>
                      <div className="h-portrait-rarity" style={{background:r.bg,border:`1px solid ${r.border}`,color:r.text}}>{r.icon} {r.label}</div>
                      {isNew&&<div className="h-portrait-new" style={{background:c.color,color:'#0a0300'}}>NEW</div>}
                    </div>
                    <div className="h-portrait-info">
                      <div className="h-portrait-name" style={{color:c.color}}>{c.name}</div>
                      <div className="h-portrait-type" style={{color:`${c.color}55`}}>{def.name}</div>
                      {c.personalityTraits.length>0&&(
                        <div className="h-portrait-traits">
                          {c.personalityTraits.slice(0,3).map(t=>(
                            <div key={t} className="h-portrait-trait" style={{background:`${c.color}0c`,color:`${c.color}88`,border:`1px solid ${c.color}15`}}>{t}</div>
                          ))}
                        </div>
                      )}
                      {c.dreamAnswer&&(
                        <div className="h-portrait-dream" style={{color:`${c.color}77`}}>
                          "{c.name} dreams about {c.dreamAnswer}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* next egg slot */}
              {primaryEgg&&(
                <div className="h-egg-card">
                  <div className="h-egg-card-emoji">🥚</div>
                  <div className="h-egg-card-title">Week {primaryEgg.weekNumber}</div>
                  <div className="h-egg-card-hint">{primaryStage}/7 nights</div>
                </div>
              )}
            </div>
          </>
        )}

        {creatures.length===0&&!primaryEgg&&(
          <div className="h-empty">
            <div className="h-empty-ico">🥚</div>
            <div className="h-empty-h">Your hatchery is waiting</div>
            <div className="h-empty-sub">Complete bedtime rituals to hatch your first friend.</div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {selected&&(()=>{
        const c=selected;const def=getCreature(c.creatureType);const r=RARITY[c.rarity]||RARITY.common;
        return(
          <div className="h-mod-bg" onClick={()=>setSelected(null)}>
            <div className="h-mod" style={{borderColor:`${c.color}18`}} onClick={e=>e.stopPropagation()}>
              <div className="h-mod-x"><button onClick={()=>setSelected(null)}>×</button></div>
              <div className="h-mod-hero" style={{background:`linear-gradient(180deg,${c.color}0c,transparent)`}}>
                <div className="h-mod-emoji" style={{filter:`drop-shadow(0 8px 24px ${c.color}50)`}}>{c.creatureEmoji}</div>
                <div className="h-mod-name" style={{color:c.color}}>{c.name}</div>
                <div className="h-mod-type" style={{color:`${c.color}60`}}>{def.name}</div>
                <div className="h-mod-rar" style={{background:r.bg,border:`1px solid ${r.border}`,color:r.text}}>{r.icon} {r.label} · Week {c.weekNumber}</div>
              </div>
              <div className="h-mod-desc" style={{color:`${c.color}88`,textAlign:'center'}}>{def.description}</div>
              <div className="h-mod-body">
                {c.dreamAnswer&&(<><div className="h-mod-lbl">First Dream</div>
                  <div className="h-mod-quote" style={{background:`${c.color}08`,border:`1px solid ${c.color}12`,color:`${c.color}cc`}}>"{c.name} dreams about {c.dreamAnswer}"</div></>)}
                {c.personalityTraits.length>0&&(<><div className="h-mod-lbl">Personality</div>
                  <div className="h-mod-traits">{c.personalityTraits.map(t=>(<div key={t} className="h-mod-trait" style={{background:`${c.color}0e`,color:`${c.color}bb`,border:`1px solid ${c.color}1a`}}>{t}</div>))}</div></>)}
                {c.parentSecret&&(<><div className="h-mod-lbl">Parent's Whisper</div>
                  <div className="h-mod-secret" style={{background:`${c.color}06`,border:`1px solid ${c.color}0c`,color:`${c.color}88`}}><span>🤫</span><span>{c.parentSecret}</span></div></>)}
                {c.photoUrl&&(<><div className="h-mod-lbl">The Night We Met</div>
                  <div style={{position:'relative',marginBottom:16,borderRadius:14,overflow:'hidden'}}>
                    <img className="h-mod-photo" src={c.photoUrl} alt={c.name} style={{marginBottom:0}}/>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 14px',background:'linear-gradient(transparent,rgba(0,0,0,.55))',zIndex:3}}>
                      <div style={{fontSize:10,fontWeight:700,color:`${c.color}cc`}}>The night {c.name} arrived</div></div></div></>)}
                <div className="h-mod-date">Hatched {new Date(c.hatchedAt).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* bottom nav */}
      <div className="h-bnav">
        <div className="h-bnav-i" onClick={onBack}><div className="h-bnav-ico">🏠</div><div className="h-bnav-lbl">Home</div></div>
        <div className="h-bnav-i"><div className="h-bnav-ico">📖</div><div className="h-bnav-lbl">Stories</div></div>
        <div className="h-bnav-i on"><div className="h-bnav-ico">🥚</div><div className="h-bnav-lbl">Hatchery</div></div>
        <div className="h-bnav-i"><div className="h-bnav-ico">🌙</div><div className="h-bnav-lbl">Night Cards</div></div>
      </div>
    </div>
  );
}
