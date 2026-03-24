import { useState } from 'react';
import type { HatchedCreature, Character } from '../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600;1,9..144,700&family=Baloo+2:wght@600;700;800&family=Nunito:wght@600;700;800&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@keyframes fnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes fnPulse{0%,100%{filter:drop-shadow(0 0 16px var(--cg,rgba(245,184,76,.3)))}50%{filter:drop-shadow(0 0 36px var(--cg,rgba(245,184,76,.6)))}}
@keyframes fnFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fnTwk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes fnTwk2{0%,100%{opacity:.2}60%{opacity:.04}}
@keyframes fnDrift{from{opacity:0;transform:translateY(0)}50%{opacity:1}to{opacity:0;transform:translateY(-30px)}}

.fn{position:fixed;inset:0;z-index:1000;background:radial-gradient(ellipse 130% 65% at 50% 0%,#0a1030 0%,#040818 50%,#020410 100%);font-family:'Nunito',sans-serif;color:#F4EFE8;overflow-y:auto;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
.fn-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:fnTwk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none}
.fn-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:fnTwk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite;pointer-events:none}
.fn-inner{max-width:380px;width:100%;text-align:center;position:relative;z-index:5;animation:fnFadeIn .5s ease-out}
.fn-emoji{font-size:120px;line-height:1;animation:fnFloat 3.5s ease-in-out infinite,fnPulse 3s ease-in-out infinite;margin-bottom:16px;display:inline-block}
.fn-name{font-family:'Fraunces',serif;font-size:32px;font-weight:700;margin-bottom:4px}
.fn-sub{font-size:14px;color:rgba(244,239,232,.45);line-height:1.6;margin-bottom:28px;font-weight:600;padding:0 10px}

.fn-option{width:100%;border-radius:20px;padding:20px;cursor:pointer;transition:all .22s;margin-bottom:12px;display:flex;align-items:center;gap:14px;text-align:left;border:none;font-family:'Nunito',sans-serif}
.fn-option:hover{transform:translateY(-2px);filter:brightness(1.08)}
.fn-option:active{transform:scale(.97)}
.fn-opt-ico{font-size:36px;flex-shrink:0}
.fn-opt-texts{flex:1}
.fn-opt-title{font-family:'Baloo 2',cursive;font-size:18px;font-weight:800;line-height:1.2;margin-bottom:2px}
.fn-opt-sub{font-size:11.5px;font-weight:600;opacity:.55;line-height:1.4}

/* goodnight overlay */
.fn-goodnight{position:fixed;inset:0;z-index:1001;background:radial-gradient(ellipse 130% 65% at 50% 0%,#0a0830 0%,#040618 50%,#020410 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;animation:fnFadeIn .6s ease-out}
.fn-gn-emoji{font-size:100px;opacity:.4;animation:fnFloat 4s ease-in-out infinite;margin-bottom:20px}
.fn-gn-text{font-family:'Fraunces',serif;font-size:24px;font-style:italic;color:rgba(244,239,232,.5);line-height:1.5;text-align:center;margin-bottom:6px}
.fn-gn-sub{font-size:13px;color:rgba(244,239,232,.25);margin-bottom:24px}
.fn-gn-zzz{position:absolute;font-size:16px;color:rgba(245,184,76,.3);animation:fnDrift 2.5s ease-out infinite}
`;

const STARS = Array.from({length:20},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*50,
  size:Math.random()<.4?3:2,
  d:(2.5+Math.random()*2.5).toFixed(1)+'s',
  dl:(Math.random()*3).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
}));

interface FirstNightProps {
  creature: HatchedCreature;
  character: Character;
  onStory: () => void;
  onSleep: () => void;
}

export default function FirstNight({ creature, character, onStory, onSleep }: FirstNightProps) {
  const [goingToSleep, setGoingToSleep] = useState(false);

  const handleSleep = () => {
    setGoingToSleep(true);
    setTimeout(() => onSleep(), 3000);
  };

  return (
    <div className="fn">
      <style>{CSS}</style>
      {STARS.map(s=>(
        <div key={s.id} className={s.t===1?'fn-star':'fn-star2'}
          style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
      ))}

      {goingToSleep && (
        <div className="fn-goodnight">
          {/* floating zzz */}
          {[{x:35,d:'2.5s',dl:'0s'},{x:55,d:'2.8s',dl:'.8s'},{x:45,d:'2.2s',dl:'1.5s'}].map((z,i)=>(
            <div key={i} className="fn-gn-zzz" style={{left:`${z.x}%`,top:'35%',animationDuration:z.d,animationDelay:z.dl}}>z</div>
          ))}
          <div className="fn-gn-emoji">{creature.creatureEmoji}</div>
          <div className="fn-gn-text">Sweet dreams…</div>
          <div className="fn-gn-text" style={{fontSize:18,color:'rgba(244,239,232,.3)'}}>see you tomorrow</div>
          <div className="fn-gn-sub">{creature.name} is already asleep 🌙</div>
        </div>
      )}

      <div className="fn-inner">
        <div className="fn-emoji" style={{'--cg':`${creature.color}50`} as any}>
          {creature.creatureEmoji}
        </div>
        <div className="fn-name" style={{color:creature.color}}>
          {creature.name} is ready!
        </div>
        <div className="fn-sub">
          Your first adventure is in the books! What's next?
        </div>

        {/* Option 1: Story — DOMINANT */}
        <button className="fn-option" style={{
          background:`linear-gradient(145deg,${creature.color}18,${creature.color}0a)`,
          border:`2px solid ${creature.color}40`,
          color:'#F4EFE8',
          padding:'24px 20px',
          boxShadow:`0 8px 32px ${creature.color}20`,
        }} onClick={onStory}>
          <div className="fn-opt-ico" style={{fontSize:42}}>📖</div>
          <div className="fn-opt-texts">
            <div className="fn-opt-title" style={{color:creature.color,fontSize:20}}>
              Create another story with {creature.name}!
            </div>
            <div className="fn-opt-sub">
              Go on a new adventure tonight ✦
            </div>
          </div>
          <div style={{fontSize:24,color:`${creature.color}60`,flexShrink:0}}>→</div>
        </button>

        {/* Option 2: Sleep — secondary */}
        <button className="fn-option" style={{
          background:'rgba(255,255,255,.02)',
          border:'1px solid rgba(255,255,255,.06)',
          color:'#F4EFE8',
          padding:'14px 20px',
        }} onClick={handleSleep}>
          <div className="fn-opt-ico" style={{fontSize:24}}>🌙</div>
          <div className="fn-opt-texts">
            <div className="fn-opt-title" style={{color:'rgba(255,255,255,.4)',fontSize:14}}>
              Tuck {creature.name} into bed
            </div>
            <div className="fn-opt-sub" style={{opacity:.3}}>
              Say goodnight — you'll see each other tomorrow
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
