// ── ReadyStateDashboard ─────────────────────────────────────────────────────
// Shown in place of the regular dashboard when onboarding has not been completed.
// Displays the promise of the product — egg, locked preview cards, single CTA.

import { useState, useEffect } from 'react';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
/* ═══ CINEMATIC WELCOME — "The Night Something Found You" ═══ */

/* phases controlled by .phase-N class on .rsd */
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.7}}
@keyframes twk2{0%,100%{opacity:.1}60%{opacity:.03}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes rock{0%,100%{transform:rotate(0)}20%{transform:rotate(-5deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(3deg)}}
@keyframes glow{0%,100%{filter:drop-shadow(0 0 16px rgba(245,184,76,.3))}50%{filter:drop-shadow(0 0 40px rgba(245,184,76,.75))}}
@keyframes pulse{0%,100%{opacity:.06;transform:scale(.9)}50%{opacity:.2;transform:scale(1.1)}}
@keyframes ringOut{0%{transform:scale(.5);opacity:.5}100%{transform:scale(2.8);opacity:0}}
@keyframes shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}
@keyframes sparkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1) rotate(180deg)}}

/* trail of light across sky */
@keyframes trail{0%{left:-10%;top:25%;opacity:0;width:4px}10%{opacity:1;width:80px}70%{opacity:.8;width:60px}100%{left:110%;top:15%;opacity:0;width:4px}}
@keyframes trailGlow{0%,100%{box-shadow:none}50%{box-shadow:0 0 20px rgba(245,184,76,.5),0 0 50px rgba(245,184,76,.2)}}

/* egg spiral entry */
@keyframes spiralIn{
  0%{opacity:0;transform:translate(80px,-60px) scale(.2) rotate(-180deg)}
  40%{opacity:1;transform:translate(30px,-20px) scale(.6) rotate(-60deg)}
  70%{transform:translate(-10px,5px) scale(1.1) rotate(10deg)}
  100%{opacity:1;transform:translate(0,0) scale(1) rotate(0)}
}

/* creature peek from edges */
@keyframes peekLeft{0%{opacity:0;transform:translateX(-60px)}100%{opacity:1;transform:translateX(0)}}
@keyframes peekRight{0%{opacity:0;transform:translateX(60px)}100%{opacity:1;transform:translateX(0)}}
@keyframes peekUp{0%{opacity:0;transform:translateY(40px)}100%{opacity:1;transform:translateY(0)}}
@keyframes peekDown{0%{opacity:0;transform:translateY(-40px)}100%{opacity:1;transform:translateY(0)}}

/* title typewriter-ish */
@keyframes titleIn{0%{opacity:0;transform:translateY(12px);letter-spacing:.25em}100%{opacity:1;transform:translateY(0);letter-spacing:.02em}}

/* layout */
.rsd{min-height:100vh;background:#020408;font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;display:flex;flex-direction:column}

/* sky gradient — intensifies over time */
.rsd-sky{position:fixed;inset:0;pointer-events:none;transition:background 2s ease}
.rsd .rsd-sky{background:radial-gradient(ellipse 120% 60% at 50% 30%,#030610,#020408 70%)}
.rsd.phase-2 .rsd-sky{background:radial-gradient(ellipse 130% 65% at 50% 25%,#0a1030,#050916 60%,#020408)}
.rsd.phase-3 .rsd-sky,.rsd.phase-4 .rsd-sky,.rsd.phase-5 .rsd-sky{background:radial-gradient(ellipse 140% 70% at 50% 25%,#0e1440,#060a20 55%,#020408)}

/* stars — appear in phases */
.rsd-stars{position:fixed;inset:0;pointer-events:none;z-index:1}
.rsd-star{position:absolute;border-radius:50%;background:#fff;opacity:0;transition:opacity 1.5s ease}
.rsd-star2{position:absolute;border-radius:50%;background:#E8D8FF;opacity:0;transition:opacity 1.5s ease}
.rsd-star3{position:absolute;border-radius:50%;background:#fde68a;opacity:0;transition:opacity 1.5s ease}
.rsd.phase-2 .rsd-star,.rsd.phase-3 .rsd-star,.rsd.phase-4 .rsd-star,.rsd.phase-5 .rsd-star{animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.rsd.phase-2 .rsd-star2,.rsd.phase-3 .rsd-star2,.rsd.phase-4 .rsd-star2,.rsd.phase-5 .rsd-star2{animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.rsd.phase-3 .rsd-star3,.rsd.phase-4 .rsd-star3,.rsd.phase-5 .rsd-star3{animation:twk var(--d,2.5s) var(--dl,0s) ease-in-out infinite}

/* golden trail of light */
.rsd-trail{position:absolute;height:3px;border-radius:2px;background:linear-gradient(90deg,transparent,#F5B84C,#fde68a,transparent);z-index:2;opacity:0;pointer-events:none;top:25%;left:-10%}
.rsd.phase-3 .rsd-trail{animation:trail 2s cubic-bezier(.4,0,.2,1) forwards,trailGlow 2s ease-in-out forwards}
/* trail sparkle particles left behind */
.rsd-trail-spark{position:absolute;border-radius:50%;background:#F5B84C;pointer-events:none;z-index:2;opacity:0}
.rsd.phase-3 .rsd-trail-spark{animation:sparkle 1.5s ease-in-out var(--dl,0s) forwards}

/* moon */
.rsd-moon-wrap{position:absolute;top:8%;left:50%;transform:translateX(-50%);z-index:3;opacity:0;transition:opacity 1.5s ease}
.rsd.phase-2 .rsd-moon-wrap,.rsd.phase-3 .rsd-moon-wrap,.rsd.phase-4 .rsd-moon-wrap,.rsd.phase-5 .rsd-moon-wrap{opacity:1}
.rsd-moon{width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#F5C060,#C87020);position:relative;overflow:hidden;animation:fadeUp 1.5s ease-out both}
.rsd-moon-sh{position:absolute;width:78px;height:78px;border-radius:50%;background:#050916;top:-12px;left:-16px}
.rsd-moon-ring{position:absolute;width:80px;height:80px;border-radius:50%;border:1px solid rgba(245,184,76,.1);top:0;left:0;opacity:0}
.rsd.phase-4 .rsd-moon-ring,.rsd.phase-5 .rsd-moon-ring{animation:ringOut 4s ease-out infinite}
.rsd-moon-r2{animation-delay:1.5s !important}

/* center stage */
.rsd-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:5;padding:0 24px}

/* egg — hidden until phase 4 */
.rsd-egg-wrap{position:relative;margin-bottom:20px;opacity:0}
.rsd.phase-4 .rsd-egg-wrap,.rsd.phase-5 .rsd-egg-wrap{opacity:1}
.rsd-egg-aura{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.12),transparent 60%);top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 3s ease-in-out infinite}
.rsd-egg-aura2{position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.04),transparent 50%);top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 5s ease-in-out .8s infinite}
.rsd-egg{font-size:110px;position:relative;z-index:2;animation:spiralIn 1.5s cubic-bezier(.22,1,.36,1) both;pointer-events:none}
.rsd.phase-5 .rsd-egg{animation:spiralIn 1.5s cubic-bezier(.22,1,.36,1) both,glow 2.5s ease-in-out 1.5s infinite,rock 2s ease-in-out 1.5s infinite,float 3.5s ease-in-out 1.5s infinite}
.rsd-sparkle{position:absolute;pointer-events:none;z-index:3;opacity:0}
.rsd.phase-5 .rsd-sparkle{animation:sparkle var(--d,2s) ease-in-out var(--dl,0s) infinite}

/* creatures — peek from edges in phase 5 */
.rsd-creatures{position:absolute;inset:0;pointer-events:none;z-index:4}
.rsd-creature{position:absolute;font-size:46px;opacity:0;filter:drop-shadow(0 4px 14px rgba(0,0,0,.4));transition:filter .3s}
.rsd-creature-sparkle{position:absolute;pointer-events:none;font-size:8px;color:rgba(245,184,76,.4);opacity:0}
.rsd.phase-5 .rsd-creature-sparkle{animation:sparkle var(--d,2s) ease-in-out var(--dl,0s) infinite}
.rsd.phase-5 .rsd-c1{animation:peekLeft .8s ease-out forwards,float 3.5s ease-in-out .8s infinite;filter:drop-shadow(0 0 10px rgba(155,127,212,.3))}
.rsd.phase-5 .rsd-c2{animation:peekRight .8s ease-out .2s forwards,float 4s ease-in-out 1s infinite;filter:drop-shadow(0 0 10px rgba(255,130,100,.3))}
.rsd.phase-5 .rsd-c3{animation:peekDown .8s ease-out .4s forwards,float 3.8s ease-in-out 1.2s infinite;filter:drop-shadow(0 0 10px rgba(96,200,160,.3))}
.rsd.phase-5 .rsd-c4{animation:peekRight .8s ease-out .6s forwards,float 4.2s ease-in-out 1.4s infinite;filter:drop-shadow(0 0 10px rgba(232,168,216,.3))}
.rsd.phase-5 .rsd-c5{animation:peekUp .8s ease-out .8s forwards,float 3.6s ease-in-out 1.6s infinite;filter:drop-shadow(0 0 10px rgba(144,200,232,.3))}

/* opening text — phase 1 only */
.rsd-opening{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;opacity:0;transition:opacity 1s ease;pointer-events:none}
.rsd.phase-1 .rsd-opening{opacity:1}
.rsd.phase-2 .rsd-opening,.rsd.phase-3 .rsd-opening{opacity:0}
.rsd-opening-text{font-family:'Fraunces',serif;font-size:24px;font-style:italic;color:rgba(244,239,232,.5);animation:fadeUp 2s ease-out both}

/* narration text — phase 3 */
.rsd-narration{position:absolute;bottom:20%;left:0;right:0;text-align:center;z-index:10;opacity:0;transition:opacity 1s ease;pointer-events:none}
.rsd.phase-3 .rsd-narration{opacity:1}
.rsd.phase-4 .rsd-narration,.rsd.phase-5 .rsd-narration{opacity:0}
.rsd-narration-text{font-family:'Fraunces',serif;font-size:15px;font-style:italic;color:rgba(245,184,76,.5);animation:fadeUp 1s ease-out both}

/* title + CTA — phase 5 only */
.rsd-title{font-family:'Fraunces',serif;font-size:30px;font-weight:700;color:var(--cream);text-align:center;line-height:1.25;opacity:0;margin-bottom:8px}
.rsd-title em{color:var(--amber2);font-style:italic}
.rsd.phase-5 .rsd-title{animation:titleIn 1s ease-out .5s both}
.rsd-sub{font-size:13px;color:rgba(244,239,232,.45);text-align:center;line-height:1.65;opacity:0;max-width:300px;margin-bottom:20px}
.rsd.phase-5 .rsd-sub{animation:fadeUp .6s ease-out 1s both}
.rsd-cta{display:inline-flex;align-items:center;gap:10px;padding:18px 40px;border:none;border-radius:60px;cursor:pointer;position:relative;overflow:hidden;background:linear-gradient(145deg,#a06010,#F5B84C 45%,#f0d060 70%,#a06010);box-shadow:0 8px 32px rgba(200,130,20,.45),0 0 0 1px rgba(255,255,255,.1) inset,0 2px 0 rgba(255,255,255,.2) inset;transition:all .25s;opacity:0;font-family:'Baloo 2',cursive;font-size:18px;font-weight:800;color:#080200;letter-spacing:.02em;text-shadow:0 1px 0 rgba(255,255,255,.15)}
.rsd.phase-5 .rsd-cta{animation:fadeUp .6s ease-out 1.5s both,ctaPulse 3s ease-in-out 2.5s infinite}
@keyframes ctaPulse{0%,100%{box-shadow:0 8px 32px rgba(200,130,20,.45),0 0 0 1px rgba(255,255,255,.1) inset,0 2px 0 rgba(255,255,255,.2) inset}50%{box-shadow:0 8px 40px rgba(200,130,20,.6),0 0 20px rgba(245,184,76,.2),0 0 0 1px rgba(255,255,255,.1) inset,0 2px 0 rgba(255,255,255,.2) inset}}
.rsd-cta:hover{transform:translateY(-3px) scale(1.06);filter:brightness(1.12);box-shadow:0 12px 44px rgba(200,130,20,.6),0 0 24px rgba(245,184,76,.25),0 0 0 1px rgba(255,255,255,.1) inset,0 2px 0 rgba(255,255,255,.2) inset}
.rsd-cta:active{transform:scale(.95)}
.rsd-cta::before{content:'';position:absolute;inset:0;border-radius:60px;background:linear-gradient(180deg,rgba(255,255,255,.12) 0%,transparent 50%);pointer-events:none}
.rsd-cta::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.25),transparent);animation:shimmer 3s ease-in-out infinite}
.rsd-time{font-size:10px;color:rgba(255,255,255,.2);margin-top:8px;opacity:0}
.rsd.phase-5 .rsd-time{animation:fadeUp .5s ease-out 2s both}
`;

// ── Stars ────────────────────────────────────────────────────────────────────

const STARS = Array.from({length:50},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*70,
  size:Math.random()<.15?4:Math.random()<.4?3:2,
  d:(2+Math.random()*3).toFixed(1)+'s',
  dl:(Math.random()*4).toFixed(1)+'s',
  t:Math.random()<.35?1:Math.random()<.7?2:3,
}));

// ── Nav icons (same as UserDashboard) ────────────────────────────────────────

function IconHome({on}:{on:boolean}){
  const c=on?'#E8972A':'rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 10.5L10 4l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1v-6.5z"
      stroke={c} strokeWidth="1.4" fill={on?'rgba(232,151,42,.15)':'none'}/>
  </svg>;
}
function IconStories(){
  const c='rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 3h10a1 1 0 011 1v13l-3-2-3 2-3-2-3 2V4a1 1 0 011-1z" stroke={c} strokeWidth="1.4" fill="none"/>
  </svg>;
}
function IconCards(){
  const c='rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="5" width="12" height="12" rx="1.5" stroke={c} strokeWidth="1.4" fill="none"/>
    <path d="M4 9h12" stroke={c} strokeWidth="1.4"/>
    <circle cx="8" cy="7" r="1" fill={c}/><circle cx="12" cy="7" r="1" fill={c}/>
  </svg>;
}
function IconProfile(){
  const c='rgba(255,255,255,.22)';
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3" stroke={c} strokeWidth="1.4" fill="none"/>
    <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}

// ── Component ────────────────────────────────────────────────────────────────

interface ReadyStateDashboardProps {
  onBegin: () => void;
}

export default function ReadyStateDashboard({ onBegin }: ReadyStateDashboardProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Cinematic sequence: darkness → stars → trail → egg → creatures + CTA
    const timers = [
      setTimeout(() => setPhase(1), 300),    // opening text
      setTimeout(() => setPhase(2), 4000),   // stars + moon appear
      setTimeout(() => setPhase(3), 6000),   // golden trail streaks across
      setTimeout(() => setPhase(4), 8000),   // egg spirals in
      setTimeout(() => setPhase(5), 9500),   // creatures + title + CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`rsd phase-${phase}`}>
      <style>{CSS}</style>

      {/* Sky gradient — intensifies with phases */}
      <div className="rsd-sky"/>

      {/* Stars — appear in phase 2 */}
      <div className="rsd-stars">
        {STARS.map(s=>(
          <div key={s.id} className={s.t===1?'rsd-star':s.t===2?'rsd-star2':'rsd-star3'}
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
        ))}
      </div>

      {/* Golden trail of light — phase 3 */}
      <div className="rsd-trail"/>
      {/* Trail sparkle particles */}
      {[{x:25,y:22,dl:'.4s'},{x:40,y:20,dl:'.7s'},{x:55,y:18,dl:'1s'},{x:70,y:17,dl:'1.3s'},{x:85,y:16,dl:'1.5s'}].map((p,i)=>(
        <div key={i} className="rsd-trail-spark" style={{left:`${p.x}%`,top:`${p.y}%`,width:5,height:5,'--dl':p.dl} as any}/>
      ))}

      {/* Opening text — phase 1 (fades before stars) */}
      <div className="rsd-opening">
        <div className="rsd-opening-text">Tonight, something finds you...</div>
      </div>

      {/* Narration — phase 3 (during trail) */}
      <div className="rsd-narration">
        <div className="rsd-narration-text">A light crossed the sky. It's coming this way.</div>
      </div>

      {/* Moon — phase 2+ */}
      <div className="rsd-moon-wrap">
        <div className="rsd-moon-ring rsd-moon-r1"/>
        <div className="rsd-moon-ring rsd-moon-r2" style={{animationDelay:'1.5s'}}/>
        <div className="rsd-moon"><div className="rsd-moon-sh"/></div>
      </div>

      {/* Center stage */}
      <div className="rsd-stage">
        {/* Egg — phase 4+ */}
        <div className="rsd-egg-wrap">
          <div className="rsd-egg-aura"/>
          <div className="rsd-egg-aura2"/>
          <div className="rsd-egg">🥚</div>
          {/* Sparkles around egg — phase 5 */}
          <div className="rsd-sparkle" style={{top:'5%',right:'-10%',fontSize:16,color:'rgba(245,184,76,.55)','--d':'2s','--dl':'0s'} as any}>✦</div>
          <div className="rsd-sparkle" style={{top:'25%',left:'-12%',fontSize:11,color:'rgba(245,184,76,.4)','--d':'1.8s','--dl':'.5s'} as any}>✧</div>
          <div className="rsd-sparkle" style={{bottom:'18%',right:'-6%',fontSize:13,color:'rgba(93,202,165,.45)','--d':'2.5s','--dl':'1s'} as any}>✦</div>
          <div className="rsd-sparkle" style={{bottom:'12%',left:'-8%',fontSize:9,color:'rgba(180,140,255,.4)','--d':'2.2s','--dl':'1.5s'} as any}>✧</div>
        </div>

        {/* Creatures peek from edges — phase 5 */}
        <div className="rsd-creatures">
          <div className="rsd-creature rsd-c1" style={{top:'35%',left:'3%'}}>🦉
            <div className="rsd-creature-sparkle" style={{top:-4,right:-6,'--d':'1.8s','--dl':'.2s'} as any}>✦</div>
          </div>
          <div className="rsd-creature rsd-c2" style={{top:'30%',right:'3%'}}>🦊
            <div className="rsd-creature-sparkle" style={{top:-2,left:-5,'--d':'2.2s','--dl':'.7s'} as any}>✧</div>
          </div>
          <div className="rsd-creature rsd-c3" style={{top:'12%',left:'20%'}}>🐉
            <div className="rsd-creature-sparkle" style={{bottom:-3,right:-4,'--d':'1.6s','--dl':'1.1s'} as any}>✦</div>
          </div>
          <div className="rsd-creature rsd-c4" style={{bottom:'28%',right:'5%'}}>🦄
            <div className="rsd-creature-sparkle" style={{top:-5,left:-3,'--d':'2s','--dl':'.4s'} as any}>✧</div>
          </div>
          <div className="rsd-creature rsd-c5" style={{bottom:'20%',left:'15%'}}>🐻
            <div className="rsd-creature-sparkle" style={{top:-3,right:-5,'--d':'2.4s','--dl':'1.4s'} as any}>✦</div>
          </div>
        </div>

        {/* Title + CTA — phase 5 */}
        <div className="rsd-title"><em>Welcome to SleepSeed.</em></div>
        <div className="rsd-sub">Something magical found you tonight.</div>
        <button className="rsd-cta" onClick={onBegin}>Your Adventure Starts Here ✦</button>
        <div className="rsd-time">Takes about 5 minutes · best with your child at bedtime</div>
      </div>
    </div>
  );
}
