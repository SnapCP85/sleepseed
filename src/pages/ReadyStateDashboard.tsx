// ── ReadyStateDashboard ─────────────────────────────────────────────────────
// Shown in place of the regular dashboard when onboarding has not been completed.
// Displays the promise of the product — egg, locked preview cards, single CTA.

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,600;1,9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Baloo+2:wght@700;800&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
@keyframes rsdTwk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes rsdTwk2{0%,100%{opacity:.22}60%{opacity:.04}}
@keyframes rsdRock{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
@keyframes rsdGlow{0%,100%{filter:drop-shadow(0 0 14px rgba(245,184,76,.25))}50%{filter:drop-shadow(0 0 32px rgba(245,184,76,.65))}}
@keyframes rsdFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rsdFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes rsdPulse{0%,100%{opacity:.06;transform:scale(.95)}50%{opacity:.18;transform:scale(1.05)}}
@keyframes rsdShimmer{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}

.rsd{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:24px;position:relative;overflow:hidden}

/* stars */
.rsd-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.rsd-star{position:absolute;border-radius:50%;background:#EEE8FF;animation:rsdTwk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.rsd-star2{position:absolute;border-radius:50%;background:#C8C0B0;animation:rsdTwk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}
.rsd-sky{position:fixed;top:0;left:0;right:0;height:300px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}

/* nav */
.rsd-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:56px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.rsd-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:7px;flex-shrink:0}
.rsd-logo-moon{width:15px;height:15px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;flex-shrink:0}
.rsd-logo-moon-sh{position:absolute;width:14px;height:14px;border-radius:50%;background:#050916;top:-3px;left:-6px}
.rsd-date{font-size:9.5px;color:rgba(244,239,232,.18);font-family:var(--mono)}

/* content */
.rsd-inner{max-width:420px;margin:0 auto;padding:0 5% 24px;position:relative;z-index:5}

/* egg hero */
.rsd-egg-hero{display:flex;flex-direction:column;align-items:center;padding:36px 0 24px;position:relative}
.rsd-egg-aura{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.12),transparent 70%);animation:rsdPulse 3.5s ease-in-out infinite;top:10px}
.rsd-egg-creature-glow{position:absolute;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.06),transparent 70%);filter:blur(20px);top:30px;animation:rsdPulse 4.5s ease-in-out infinite 1s}
.rsd-egg{font-size:88px;position:relative;z-index:2;animation:rsdGlow 3s ease-in-out infinite,rsdRock 2.5s ease-in-out infinite;cursor:default}
.rsd-egg-title{font-family:'Fraunces',serif;font-size:24px;font-weight:700;font-style:italic;color:var(--amber2);margin-top:16px;text-align:center}
.rsd-egg-sub{font-size:14px;color:rgba(244,239,232,.35);margin-top:6px;text-align:center;line-height:1.5;font-weight:300}

/* locked cards */
.rsd-cards{display:flex;flex-direction:column;gap:10px;margin:20px 0 24px}
.rsd-card{position:relative;border-radius:16px;padding:16px 18px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);overflow:hidden}
.rsd-card-frost{position:absolute;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);border-radius:16px;z-index:1}
.rsd-card-lock{position:absolute;top:10px;right:12px;font-size:10px;opacity:.4;z-index:2}
.rsd-card-inner{position:relative;z-index:2;display:flex;align-items:flex-start;gap:12px}
.rsd-card-ico{font-size:24px;flex-shrink:0;margin-top:1px}
.rsd-card-texts{flex:1}
.rsd-card-title{font-size:13px;font-weight:700;color:rgba(244,239,232,.5);margin-bottom:3px}
.rsd-card-desc{font-size:11.5px;color:rgba(244,239,232,.25);line-height:1.5;font-weight:300}

/* CTA */
.rsd-cta{display:block;width:100%;padding:20px 24px;border:none;border-radius:18px;cursor:pointer;position:relative;overflow:hidden;background:linear-gradient(145deg,#a06010,#F5B84C 48%,#a06010);box-shadow:0 8px 32px rgba(200,130,20,.4),0 1px 0 rgba(255,255,255,.18) inset;transition:transform .18s,filter .2s;margin-bottom:6px}
.rsd-cta:hover{transform:scale(1.02) translateY(-2px);filter:brightness(1.1)}
.rsd-cta:active{transform:scale(.97)}
.rsd-cta::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:rsdShimmer 3.8s ease-in-out infinite}
.rsd-cta-title{font-family:'Baloo 2',cursive;font-size:20px;font-weight:800;color:#080200;display:block;line-height:1.2;margin-bottom:2px;position:relative;z-index:1}
.rsd-cta-sub{font-size:11px;font-weight:600;color:rgba(8,2,0,.45);display:block;position:relative;z-index:1}

/* bottom nav */
.rsd-bnav{display:flex;align-items:center;justify-content:center;gap:2px;padding-top:12px}
.rsd-ntab{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 7px;border-radius:10px;min-width:40px}
.rsd-ntab-ico{width:20px;height:20px;flex-shrink:0}
.rsd-ntab-lbl{font-size:7.5px;font-weight:500;letter-spacing:.02em;font-family:var(--mono);color:rgba(255,255,255,.18)}
.rsd-ntab.on .rsd-ntab-lbl{color:var(--amber2)}
`;

// ── Stars ────────────────────────────────────────────────────────────────────

const STARS = Array.from({length:24},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*36,
  size:Math.random()<.4?3:2,
  d:(2.5+Math.random()*2.5).toFixed(1)+'s',
  dl:(Math.random()*3).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
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
  const today = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

  return (
    <div className="rsd">
      <style>{CSS}</style>
      <div className="rsd-sky"/>
      <div className="rsd-stars">
        {STARS.map(s=>(
          <div key={s.id} className={s.t===1?'rsd-star':'rsd-star2'}
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
        ))}
      </div>

      {/* nav */}
      <nav className="rsd-nav">
        <div className="rsd-logo">
          <div className="rsd-logo-moon"><div className="rsd-logo-moon-sh"/></div>
          SleepSeed
        </div>
        <div className="rsd-date">{today}</div>
      </nav>

      <div className="rsd-inner">
        {/* egg hero */}
        <div className="rsd-egg-hero">
          <div className="rsd-egg-aura"/>
          <div className="rsd-egg-creature-glow"/>
          <div className="rsd-egg">🥚</div>
          <div className="rsd-egg-title">Your egg is waiting.</div>
          <div className="rsd-egg-sub">Start your first night to find out what's inside.</div>
        </div>

        {/* locked preview cards */}
        <div className="rsd-cards">
          <div className="rsd-card">
            <div className="rsd-card-frost"/>
            <div className="rsd-card-lock">🔒</div>
            <div className="rsd-card-inner">
              <div className="rsd-card-ico">🌙</div>
              <div className="rsd-card-texts">
                <div className="rsd-card-title">Night Cards</div>
                <div className="rsd-card-desc">Your first card will be captured tonight</div>
              </div>
            </div>
          </div>
          <div className="rsd-card">
            <div className="rsd-card-frost"/>
            <div className="rsd-card-lock">🔒</div>
            <div className="rsd-card-inner">
              <div className="rsd-card-ico">📖</div>
              <div className="rsd-card-texts">
                <div className="rsd-card-title">Stories</div>
                <div className="rsd-card-desc">Personalised stories begin after your first night</div>
              </div>
            </div>
          </div>
          <div className="rsd-card">
            <div className="rsd-card-frost"/>
            <div className="rsd-card-lock">🔒</div>
            <div className="rsd-card-inner">
              <div className="rsd-card-ico">🥚</div>
              <div className="rsd-card-texts">
                <div className="rsd-card-title">Hatchery</div>
                <div className="rsd-card-desc">7 nights hatches your first creature</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button className="rsd-cta" onClick={onBegin}>
          <span className="rsd-cta-title">Start your first night together ✦</span>
          <span className="rsd-cta-sub">Takes about 8 minutes · best done with your child at bedtime</span>
        </button>

        {/* bottom nav */}
        <div className="rsd-bnav">
          <div className="rsd-ntab on">
            <div className="rsd-ntab-ico"><IconHome on={true}/></div>
            <div className="rsd-ntab-lbl">Home</div>
          </div>
          <div className="rsd-ntab">
            <div className="rsd-ntab-ico"><IconStories/></div>
            <div className="rsd-ntab-lbl">Stories</div>
          </div>
          <div className="rsd-ntab">
            <div className="rsd-ntab-ico"><IconCards/></div>
            <div className="rsd-ntab-lbl">Cards</div>
          </div>
          <div className="rsd-ntab">
            <div className="rsd-ntab-ico"><IconProfile/></div>
            <div className="rsd-ntab-lbl">Profile</div>
          </div>
        </div>
      </div>
    </div>
  );
}
