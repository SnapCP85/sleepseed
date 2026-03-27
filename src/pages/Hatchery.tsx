import { useState, useEffect, useMemo } from 'react';
import type { User, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, getAllHatchedCreatures, createEgg } from '../lib/hatchery';
import { CREATURES, getCreature } from '../lib/creatures';
import type { CreatureDef } from '../lib/creatures';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@keyframes nsTwk{0%,100%{opacity:.1}50%{opacity:.8}}
@keyframes nsTwk2{0%,100%{opacity:.3}60%{opacity:.08}}
@keyframes nsFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes nsPulse{0%,100%{r:3.5}50%{r:5}}
@keyframes nsGlow{0%,100%{opacity:.4}50%{opacity:1}}

.ns{min-height:100vh;background:radial-gradient(ellipse 130% 55% at 50% 0%,#050920 0%,#030610 45%,#020408 100%);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased}
.ns-sf{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.ns-star{position:absolute;border-radius:50%;background:#fff;animation:nsTwk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.ns-star2{position:absolute;border-radius:50%;background:#E8D8FF;animation:nsTwk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}

.ns-nav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgba(4,6,16,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(245,184,76,.06);position:sticky;top:0;z-index:20}
.ns-back{background:rgba(245,184,76,.07);border:1px solid rgba(245,184,76,.18);border-radius:50px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;color:rgba(245,184,76,.6);transition:all .2s;font-family:inherit}
.ns-back:hover{background:rgba(245,184,76,.13)}
.ns-title{font-family:'Fraunces',serif;font-size:18px;font-weight:700}
.ns-badge{padding:4px 10px;border-radius:50px;background:rgba(245,184,76,.06);border:1px solid rgba(245,184,76,.12);font-size:10px;font-weight:800;color:rgba(245,184,76,.5);font-family:'DM Mono',monospace}

.ns-inner{max-width:500px;margin:0 auto;padding:0 16px 100px;position:relative;z-index:5}

/* Sky canvas */
.ns-sky{position:relative;height:280px;margin:16px 0 6px;background:radial-gradient(ellipse 100% 80% at 50% 20%,rgba(20,14,60,.5),transparent 70%);border:1px solid rgba(245,184,76,.05);border-radius:24px;overflow:hidden}
.ns-sky-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:14px;font-style:italic;color:rgba(255,255,255,.12)}

/* Star tooltip */
.ns-tip{position:absolute;z-index:30;background:rgba(4,6,16,.95);border:1px solid rgba(245,184,76,.25);border-radius:10px;padding:8px 12px;pointer-events:none;white-space:nowrap;animation:nsFade .15s ease}
.ns-tip-lesson{font-family:'Fraunces',serif;font-size:11px;font-style:italic;color:rgba(245,232,200,.8);margin-bottom:2px}
.ns-tip-date{font-size:8px;color:rgba(245,232,200,.3);font-family:'DM Mono',monospace}

/* Section */
.ns-sec{font-size:9px;font-weight:800;color:rgba(245,184,76,.35);text-transform:uppercase;letter-spacing:.1em;font-family:'DM Mono',monospace;margin:20px 0 12px;display:flex;align-items:center;gap:8px}
.ns-sec::after{content:'';flex:1;height:1px;background:rgba(245,184,76,.06)}

/* Active dreamkeeper card */
.ns-active{border-radius:20px;padding:16px;position:relative;overflow:hidden;animation:nsFade .4s ease both}
.ns-active::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px}

/* Completed cards grid */
.ns-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.ns-card{border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;animation:nsFade .4s ease-out both}
.ns-card:hover{transform:translateY(-3px) scale(1.02)}
.ns-card-sky{height:110px;position:relative;display:flex;align-items:center;justify-content:center}
.ns-card-info{padding:10px 12px 12px;text-align:center}
.ns-card-name{font-family:'Fraunces',serif;font-size:14px;font-weight:700;margin-bottom:2px}
.ns-card-virtue{font-size:8px;font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase}

/* Detail modal */
.ns-mod-bg{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(12px);animation:nsFade .15s ease}
.ns-mod{background:linear-gradient(175deg,#080c24,#040818);border-radius:24px;max-width:420px;width:100%;max-height:88vh;overflow-y:auto;position:relative;border:1px solid rgba(255,255,255,.06);animation:nsFade .25s ease}
.ns-mod::-webkit-scrollbar{display:none}

/* Empty */
.ns-empty{text-align:center;padding:40px 20px}
.ns-empty-ico{font-size:48px;margin-bottom:12px}
.ns-empty-h{font-family:'Fraunces',serif;font-size:17px;margin-bottom:6px;font-style:italic}
.ns-empty-sub{font-size:12px;color:rgba(244,239,232,.3);line-height:1.65}
`;

const BG_STARS = Array.from({length:30},(_,i)=>({
  id:i, x:Math.random()*100, y:Math.random()*45,
  size:Math.random()<.3?3:2,
  d:(2+Math.random()*3).toFixed(1)+'s',
  dl:(Math.random()*4).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
}));

// Render a constellation SVG — shows stars, lines, and handles hover/tap
function ConstellationSVG({ def, color, filled, size=100, onStarHover, onStarLeave, interactive=false }: {
  def: CreatureDef; color: string; filled: number; size?: number;
  onStarHover?: (idx: number, x: number, y: number) => void;
  onStarLeave?: () => void;
  interactive?: boolean;
}) {
  const pts = def.constellationPoints;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{display:'block'}}>
      {/* Lines between consecutive filled stars */}
      {pts.slice(0,-1).map(([x1,y1],i) => {
        if (i >= filled - 1) return null;
        const [x2,y2] = pts[i+1];
        return <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth="0.8" strokeOpacity={0.4}
          strokeDasharray="2,2" />;
      })}
      {/* Stars */}
      {pts.map(([x,y],i) => {
        const lit = i < filled;
        const isNext = i === filled;
        return (
          <g key={i}
            onMouseEnter={interactive && lit ? (e) => {
              const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
              if (rect && onStarHover) onStarHover(i, rect.left + (x/100)*rect.width, rect.top + (y/100)*rect.height);
            } : undefined}
            onMouseLeave={interactive ? onStarLeave : undefined}
            onClick={interactive && lit ? (e) => {
              e.stopPropagation();
              const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
              if (rect && onStarHover) onStarHover(i, rect.left + (x/100)*rect.width, rect.top + (y/100)*rect.height);
            } : undefined}
            style={{cursor: interactive && lit ? 'pointer' : 'default'}}
          >
            {/* Glow */}
            {lit && <circle cx={x} cy={y} r={8} fill={color} opacity={0.08} />}
            {/* Star */}
            <circle cx={x} cy={y}
              r={lit ? 4 : isNext ? 3 : 2}
              fill={lit ? color : isNext ? `${color}40` : 'rgba(255,255,255,.08)'}
              stroke={lit ? color : 'none'} strokeWidth={lit ? 0.5 : 0} strokeOpacity={0.6}
              style={isNext ? {animation:'nsPulse 2.5s ease-in-out infinite'} : undefined}
            />
            {/* Twinkle on lit stars */}
            {lit && <circle cx={x} cy={y} r={1.5} fill="white" opacity={0.6}
              style={{animation:`nsGlow ${(2+i*0.3).toFixed(1)}s ease-in-out infinite`}} />}
          </g>
        );
      })}
    </svg>
  );
}

interface HatcheryProps { user: User; onBack: () => void; }

export default function Hatchery({ user, onBack }: HatcheryProps) {
  const [creatures,setCreatures]=useState<HatchedCreature[]>([]);
  const [characters,setCharacters]=useState<Character[]>([]);
  const [eggs,setEggs]=useState<Map<string,HatcheryEgg>>(new Map());
  const [allCards,setAllCards]=useState<import('../lib/types').SavedNightCard[]>([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<HatchedCreature|null>(null);
  const [tipStar,setTipStar]=useState<{idx:number;x:number;y:number;creatureId:string}|null>(null);

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
  const primaryDef=primaryEgg?getCreature(primaryEgg.creatureType):null;
  const primaryStage=useMemo(()=>{
    if(!primaryEgg)return 0;
    const sd=primaryEgg.startedAt.split('T')[0];
    return Math.min(allCards.filter(c=>c.characterIds.includes(primaryEgg.characterId)&&c.date.split('T')[0]>=sd).length,7);
  },[primaryEgg,allCards]);

  const totalStars = creatures.length * 7 + primaryStage;

  const starField = BG_STARS.map(s=>(
    <div key={s.id} className={s.t===1?'ns-star':'ns-star2'}
      style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
  ));

  if(loading) return(
    <div className="ns"><style>{CSS}</style><div className="ns-sf">{starField}</div>
      <div className="ns-nav"><div className="ns-back" onClick={onBack}>← Home</div><div className="ns-title">Your Night Sky</div><div style={{width:60}}/></div>
      <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,.15)',fontSize:13}}>Loading your sky...</div>
    </div>
  );

  return(
    <div className="ns">
      <style>{CSS}</style>
      <div className="ns-sf">{starField}</div>

      <div className="ns-nav">
        <div className="ns-back" onClick={onBack}>← Home</div>
        <div className="ns-title">Your Night Sky</div>
        <div className="ns-badge">{totalStars} star{totalStars!==1?'s':''}</div>
      </div>

      <div className="ns-inner">
        {/* ════════════════════════════════════
            THE SKY — all completed constellations
        ════════════════════════════════════ */}
        <div className="ns-sky">
          {creatures.length === 0 && !primaryEgg && (
            <div className="ns-sky-empty">Your constellations will appear here...</div>
          )}

          {/* Completed constellations — positioned across the sky */}
          {creatures.map((c, i) => {
            const def = getCreature(c.creatureType);
            const cols = Math.min(creatures.length, 3);
            const row = Math.floor(i / cols);
            const col = i % cols;
            const xPct = 10 + (col / Math.max(cols, 1)) * 70;
            const yPct = 15 + row * 45;
            return (
              <div key={c.id} style={{
                position:'absolute', left:`${xPct}%`, top:`${yPct}%`,
                transform:'translate(-50%,-50%)',
                cursor:'pointer',
              }} onClick={()=>setSelected(c)}>
                <ConstellationSVG def={def} color={c.color} filled={7} size={80}
                  interactive onStarHover={(idx,x,y)=>setTipStar({idx,x,y,creatureId:c.creatureType})}
                  onStarLeave={()=>setTipStar(null)} />
                <div style={{textAlign:'center',marginTop:2}}>
                  <div style={{fontSize:9,fontWeight:700,color:`${c.color}88`,fontFamily:"'DM Mono',monospace"}}>{c.name}</div>
                  <div style={{fontSize:7,color:`${c.color}44`,fontFamily:"'DM Mono',monospace"}}>{def.virtue}</div>
                </div>
              </div>
            );
          })}

          {/* Active egg constellation — partially traced, in a visible spot */}
          {primaryEgg && primaryDef && (
            <div style={{
              position:'absolute',
              right: creatures.length > 0 ? '12%' : '50%',
              bottom: creatures.length > 0 ? '15%' : '50%',
              transform: creatures.length > 0 ? 'none' : 'translate(50%,50%)',
            }}>
              <ConstellationSVG def={primaryDef} color={primaryDef.color} filled={primaryStage} size={70} />
              <div style={{textAlign:'center',marginTop:2}}>
                <div style={{fontSize:8,color:`${primaryDef.color}55`,fontFamily:"'DM Mono',monospace"}}>
                  {primaryStage}/7
                </div>
              </div>
            </div>
          )}

          {/* Star tooltip */}
          {tipStar && (()=>{
            const def = getCreature(tipStar.creatureId);
            const beat = def.lessonBeats[tipStar.idx];
            if (!beat) return null;
            return (
              <div className="ns-tip" style={{
                left: tipStar.x - 100, top: tipStar.y - 60,
                position:'fixed',
              }}>
                <div className="ns-tip-lesson">{beat.theme}</div>
                <div className="ns-tip-date">Night {tipStar.idx + 1} of 7</div>
              </div>
            );
          })()}
        </div>

        <div style={{textAlign:'center',fontSize:11,color:'rgba(245,232,200,.2)',fontFamily:"'DM Mono',monospace",marginBottom:4}}>
          {totalStars} star{totalStars!==1?'s':''} · {creatures.length} constellation{creatures.length!==1?'s':''}
        </div>

        {/* ════════════════════════════════════
            ACTIVE DREAMKEEPER
        ════════════════════════════════════ */}
        {primaryEgg && primaryDef && (
          <>
            <div className="ns-sec">Active Dreamkeeper</div>
            <div className="ns-active" style={{
              background:`linear-gradient(170deg,${primaryDef.color}08,rgba(4,6,16,.98))`,
              border:`1.5px solid ${primaryDef.color}18`,
            }}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,
                background:`linear-gradient(90deg,transparent,${primaryDef.color}30,transparent)`}}/>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{fontSize:42,lineHeight:1,flexShrink:0,
                  filter:`drop-shadow(0 0 10px ${primaryDef.color}40)`}}>
                  {primaryDef.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:primaryDef.color,marginBottom:1}}>
                    {primaryDef.craftName}
                  </div>
                  <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:`${primaryDef.color}55`,
                    letterSpacing:'.06em',textTransform:'uppercase',marginBottom:6}}>
                    Dreamkeeper of {primaryDef.virtue}
                  </div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:11,fontStyle:'italic',
                    color:`${primaryDef.color}aa`,lineHeight:1.5}}>
                    "{primaryDef.dailyWisdom[primaryStage] ?? primaryDef.dailyWisdom[0]}"
                  </div>
                </div>
              </div>
              {/* Progress dots */}
              <div style={{display:'flex',gap:5,justifyContent:'center',marginTop:12}}>
                {Array.from({length:7},(_,i)=>{
                  const done=i<primaryStage;const isNext=i===primaryStage;
                  return(
                    <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <div style={{
                        width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:done?11:10,transition:'all .3s',
                        background:done?`${primaryDef.color}18`:isNext?`${primaryDef.color}08`:'rgba(255,255,255,.02)',
                        border:done?`2px solid ${primaryDef.color}55`:isNext?`2px solid ${primaryDef.color}30`:'1.5px dashed rgba(255,255,255,.06)',
                        boxShadow:isNext?`0 0 8px ${primaryDef.color}20`:'none',
                      }}>{done?'✦':isNext?'·':'·'}</div>
                      <div style={{fontSize:7,color:done?`${primaryDef.color}55`:'rgba(255,255,255,.1)',
                        fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                        {i+1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════
            COLLECTION — completed Dreamkeeper cards
        ════════════════════════════════════ */}
        {creatures.length > 0 && (
          <>
            <div className="ns-sec">Your Dreamkeepers · {creatures.length}</div>
            <div className="ns-grid">
              {creatures.map((c,i)=>{
                const def=getCreature(c.creatureType);
                return(
                  <div key={c.id} className="ns-card" style={{
                    background:`linear-gradient(170deg,${c.color}0a,${c.color}04,rgba(4,4,16,.98))`,
                    border:`1.5px solid ${c.color}18`,
                    animationDelay:`${i*0.06}s`,
                  }} onClick={()=>setSelected(c)}>
                    <div className="ns-card-sky" style={{background:`radial-gradient(ellipse at 50% 40%,${c.color}0c,transparent 70%)`}}>
                      <ConstellationSVG def={def} color={c.color} filled={7} size={90} />
                    </div>
                    <div className="ns-card-info">
                      <div style={{fontSize:22,marginBottom:4}}>{c.creatureEmoji}</div>
                      <div className="ns-card-name" style={{color:c.color}}>{c.name}</div>
                      <div className="ns-card-virtue" style={{color:`${c.color}55`}}>
                        {def.craftName} · {def.virtue}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {creatures.length===0&&!primaryEgg&&(
          <div className="ns-empty">
            <div className="ns-empty-ico">🌙</div>
            <div className="ns-empty-h">Your sky is waiting</div>
            <div className="ns-empty-sub">Complete bedtime rituals to trace your first constellation and hatch your first Dreamkeeper.</div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════
          DETAIL MODAL — full Dreamkeeper card
      ════════════════════════════════════ */}
      {selected&&(()=>{
        const c=selected;
        const def=getCreature(c.creatureType);
        return(
          <div className="ns-mod-bg" onClick={()=>setSelected(null)}>
            <div className="ns-mod" style={{borderColor:`${c.color}18`}} onClick={e=>e.stopPropagation()}>
              {/* Close */}
              <div style={{display:'flex',justifyContent:'flex-end',padding:'12px 14px 0'}}>
                <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,.06)',border:'none',width:32,height:32,borderRadius:'50%',color:'rgba(255,255,255,.4)',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>x</button>
              </div>

              {/* Constellation + creature */}
              <div style={{textAlign:'center',padding:'0 20px 16px'}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
                  <ConstellationSVG def={def} color={c.color} filled={7} size={120}
                    interactive onStarHover={(idx,x,y)=>setTipStar({idx,x,y,creatureId:c.creatureType})}
                    onStarLeave={()=>setTipStar(null)} />
                </div>
                <div style={{fontSize:48,marginBottom:4}}>{c.creatureEmoji}</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:c.color,marginBottom:2}}>{c.name}</div>
                <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:'.1em',textTransform:'uppercase',
                  color:`${c.color}55`,marginBottom:4}}>
                  {def.craftName} · Dreamkeeper of {def.virtue}
                </div>
                <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:'rgba(255,255,255,.2)'}}>
                  Hatched {new Date(c.hatchedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                </div>
              </div>

              {/* 7 lessons */}
              <div style={{padding:'0 20px 20px'}}>
                <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",letterSpacing:'.1em',textTransform:'uppercase',
                  color:`${c.color}35`,marginBottom:10,fontWeight:700}}>
                  7 Lessons of {def.virtue}
                </div>
                {def.lessonBeats.map((beat,i)=>(
                  <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                    <div style={{
                      width:22,height:22,borderRadius:'50%',flexShrink:0,marginTop:1,
                      background:`${c.color}15`,border:`1.5px solid ${c.color}35`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,color:c.color,
                    }}>✦</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--cream)',marginBottom:1}}>{beat.theme}</div>
                      <div style={{fontSize:10,color:'rgba(244,239,232,.3)',lineHeight:1.5}}>Night {beat.night}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Personality traits */}
              {c.personalityTraits.length>0&&(
                <div style={{padding:'0 20px 16px',display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center'}}>
                  {c.personalityTraits.map(t=>(
                    <div key={t} style={{padding:'3px 10px',borderRadius:50,fontSize:9,fontWeight:700,
                      background:`${c.color}0c`,color:`${c.color}88`,border:`1px solid ${c.color}15`}}>{t}</div>
                  ))}
                </div>
              )}

              {/* Photo */}
              {c.photoUrl&&(
                <div style={{padding:'0 20px 20px'}}>
                  <img src={c.photoUrl} alt={c.name} style={{width:'100%',borderRadius:14,objectFit:'cover'}}/>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
