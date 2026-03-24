import { useState } from 'react';
import type { Pronoun } from '../lib/types';

export interface ParentSetupResult {
  childName: string;
  childAge: string;
  childPronouns: Pronoun;
  parentSecret: string;
}

interface Props {
  displayName: string;
  onComplete: (result: ParentSetupResult) => void;
}

const SECRET_EXAMPLES = [
  "She talks to her stuffed animals when nobody is looking",
  "He checks under the bed for friendly monsters every night",
  "She makes up songs about everything, even breakfast",
  "He draws maps of imaginary places on every piece of paper",
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--cream:#F4EFE8;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--serif:'Playfair Display',Georgia,serif;--mono:'DM Mono',monospace}

@keyframes psFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes psFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

.ps{min-height:100vh;font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
.ps-default{background:var(--night)}
.ps-warm{background:radial-gradient(ellipse 130% 65% at 50% 0%,#1a0e08,#100806 50%,#080404)}

.ps-nav{height:56px;display:flex;align-items:center;padding:0 6%;border-bottom:1px solid rgba(255,255,255,.05);background:rgba(8,12,24,.85);backdrop-filter:blur(16px)}
.ps-logo{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:8px}
.ps-logo-moon{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#F5C060,#C87020);flex-shrink:0}

.ps-body{flex:1;display:flex;align-items:center;justify-content:center;padding:24px}
.ps-card{max-width:440px;width:100%;animation:psFadeIn .5s ease-out}

.ps-steps{display:flex;gap:8px;margin-bottom:28px}
.ps-step{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.06);overflow:hidden}
.ps-step-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#a06010,#F5B84C);transition:width .4s ease}

.ps-h{font-family:var(--serif);font-size:28px;font-weight:700;line-height:1.2;margin-bottom:8px}
.ps-h em{font-style:italic;color:var(--amber2)}
.ps-sub{font-size:14px;color:rgba(244,239,232,.45);line-height:1.7;margin-bottom:28px;font-weight:300}
.ps-h-warm{font-family:'Fraunces',serif;font-size:24px;font-weight:700;font-style:italic;line-height:1.3;margin-bottom:8px;color:var(--amber2)}
.ps-sub-warm{font-size:14px;color:rgba(244,239,232,.4);line-height:1.7;margin-bottom:24px;font-weight:300}

.ps-label{font-size:11px;color:rgba(244,239,232,.35);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;display:block}
.ps-input{width:100%;padding:14px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--cream);font-family:var(--sans);font-size:16px;font-weight:500;outline:none;transition:border-color .2s;margin-bottom:16px}
.ps-input:focus{border-color:rgba(245,184,76,.35)}
.ps-input::placeholder{color:rgba(255,255,255,.18)}
.ps-textarea{width:100%;padding:12px 16px;border-radius:12px;border:1.5px solid rgba(245,184,76,.15);background:rgba(245,184,76,.04);color:var(--cream);font-family:var(--sans);font-size:14px;font-weight:500;outline:none;resize:none;min-height:90px;transition:border-color .2s;margin-bottom:8px}
.ps-textarea:focus{border-color:rgba(245,184,76,.35)}
.ps-textarea::placeholder{color:rgba(255,255,255,.2)}

.ps-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.ps-pill{padding:8px 16px;border-radius:50px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(244,239,232,.45);font-size:13px;font-weight:600;cursor:pointer;transition:all .18s}
.ps-pill.on{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.1);color:#F5B84C}

.ps-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.ps-chip{padding:6px 12px;border-radius:50px;border:1px solid rgba(245,184,76,.12);background:rgba(245,184,76,.04);color:rgba(244,239,232,.4);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
.ps-chip:hover{background:rgba(245,184,76,.08);color:rgba(244,239,232,.6)}

.ps-btn{width:100%;padding:16px;border:none;border-radius:14px;font-family:var(--sans);font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px}
.ps-btn-primary{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;box-shadow:0 6px 24px rgba(200,130,20,.3)}
.ps-btn-primary:hover{filter:brightness(1.1);transform:translateY(-2px)}
.ps-btn-primary:disabled{opacity:.3;cursor:default;transform:none;filter:none}
.ps-skip{background:none;border:none;color:rgba(244,239,232,.25);font-size:12px;font-weight:500;cursor:pointer;margin-top:12px;font-family:var(--sans);transition:color .15s;display:block;width:100%;text-align:center}
.ps-skip:hover{color:rgba(244,239,232,.5)}

.ps-how{display:flex;flex-direction:column;gap:16px;margin-bottom:28px}
.ps-how-item{display:flex;align-items:flex-start;gap:14px}
.ps-how-ico{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.ps-how-text{flex:1}
.ps-how-title{font-size:14px;font-weight:700;color:var(--cream);margin-bottom:2px}
.ps-how-desc{font-size:12.5px;color:rgba(244,239,232,.4);line-height:1.55}

.ps-ready-preview{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:20px;margin-bottom:24px;text-align:center}
.ps-ready-emoji{font-size:56px;animation:psFloat 3s ease-in-out infinite;display:inline-block;margin-bottom:10px}
.ps-ready-name{font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:4px}
.ps-ready-detail{font-size:12px;color:rgba(244,239,232,.35);font-family:var(--mono)}
`;

export default function ParentSetup({ displayName, onComplete }: Props) {
  const [screen, setScreen] = useState(0);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPronouns, setChildPronouns] = useState<Pronoun>('she/her');
  const [parentSecret, setParentSecret] = useState('');

  const firstName = displayName?.split(' ')[0] || '';
  const stepCount = 4;
  const stepProgress = (s: number) => Array.from({length:stepCount},(_,i)=>({done:i<s,current:i===s}));

  const stepsBar = (s: number) => (
    <div className="ps-steps">
      {stepProgress(s).map((p,i) => (
        <div key={i} className="ps-step">
          <div className="ps-step-fill" style={{width:p.done?'100%':p.current?'50%':'0%'}}/>
        </div>
      ))}
    </div>
  );

  // Screen 0: Welcome
  if (screen === 0) return (
    <div className="ps ps-default">
      <style>{CSS}</style>
      <div className="ps-nav"><div className="ps-logo"><div className="ps-logo-moon"/>SleepSeed</div></div>
      <div className="ps-body">
        <div className="ps-card">
          {stepsBar(0)}
          <div className="ps-h">Welcome{firstName?`, ${firstName}`:''} <em>✦</em></div>
          <div className="ps-sub">Here's what happens when you open SleepSeed at bedtime tonight.</div>
          <div className="ps-how">
            <div className="ps-how-item">
              <div className="ps-how-ico" style={{background:'rgba(245,184,76,.08)',border:'1px solid rgba(245,184,76,.15)'}}>🌙</div>
              <div className="ps-how-text">
                <div className="ps-how-title">A bedtime story from their day</div>
                <div className="ps-how-desc">A personalised story starring your child appears in seconds.</div>
              </div>
            </div>
            <div className="ps-how-item">
              <div className="ps-how-ico" style={{background:'rgba(96,232,176,.06)',border:'1px solid rgba(96,232,176,.12)'}}>🥚</div>
              <div className="ps-how-text">
                <div className="ps-how-title">A creature companion that grows</div>
                <div className="ps-how-desc">Your child hatches a creature tonight. After 7 nights, a new one hatches.</div>
              </div>
            </div>
            <div className="ps-how-item">
              <div className="ps-how-ico" style={{background:'rgba(180,140,255,.06)',border:'1px solid rgba(180,140,255,.12)'}}>💛</div>
              <div className="ps-how-text">
                <div className="ps-how-title">Night Cards capture what they say</div>
                <div className="ps-how-desc">A growing archive of what your child said before sleep.</div>
              </div>
            </div>
          </div>
          <button className="ps-btn ps-btn-primary" onClick={() => setScreen(1)}>
            Set up your child's profile →
          </button>
          <div style={{fontSize:11,color:'rgba(255,255,255,.2)',textAlign:'center',marginTop:10,fontFamily:'var(--mono)'}}>
            Takes about 60 seconds
          </div>
        </div>
      </div>
    </div>
  );

  // Screen 1: Child Profile (no secret — moved to screen 2)
  if (screen === 1) return (
    <div className="ps ps-default">
      <style>{CSS}</style>
      <div className="ps-nav"><div className="ps-logo"><div className="ps-logo-moon"/>SleepSeed</div></div>
      <div className="ps-body">
        <div className="ps-card">
          {stepsBar(1)}
          <div className="ps-h">Tell us about <em>your child</em></div>
          <div className="ps-sub">This shapes every story, creature, and Night Card.</div>

          <div className="ps-label">Child's first name</div>
          <input className="ps-input" placeholder="Their first name" value={childName}
            onChange={e => setChildName(e.target.value)} autoFocus />

          <div className="ps-label">Age</div>
          <div className="ps-pills">
            {['3-4','4-5','5-6','7-8','9-10','11+'].map(a => (
              <div key={a} className={`ps-pill${childAge===a?' on':''}`}
                onClick={() => setChildAge(a)}>{a}</div>
            ))}
          </div>

          <div className="ps-label">Pronouns</div>
          <div className="ps-pills" style={{marginBottom:8}}>
            {(['she/her','he/him','they/them'] as const).map(p => (
              <div key={p} className={`ps-pill${childPronouns===p?' on':''}`}
                onClick={() => setChildPronouns(p)}>{p}</div>
            ))}
          </div>

          <button className="ps-btn ps-btn-primary" disabled={childName.length < 2 || !childAge}
            onClick={() => setScreen(2)}>
            Continue →
          </button>
          <button className="ps-skip" onClick={() => setScreen(0)}>← Back</button>
        </div>
      </div>
    </div>
  );

  // Screen 2: Parent's Secret — own screen, warm amber background
  if (screen === 2) return (
    <div className="ps ps-warm">
      <style>{CSS}</style>
      <div className="ps-nav"><div className="ps-logo"><div className="ps-logo-moon"/>SleepSeed</div></div>
      <div className="ps-body">
        <div className="ps-card">
          {stepsBar(2)}
          <div className="ps-h-warm">One quiet thing about {childName}.</div>
          <div className="ps-sub-warm">
            What's something about {childName} that makes you smile when they're not looking? We'll weave it into their stories.
          </div>

          <textarea className="ps-textarea" placeholder={`${childName} secretly talks to stuffed animals when nobody is watching...`}
            value={parentSecret} onChange={e => setParentSecret(e.target.value)} rows={3} />
          <div className="ps-chips">
            {SECRET_EXAMPLES.map((ex,i) => (
              <div key={i} className="ps-chip" onClick={() => setParentSecret(ex)}>{ex.slice(0,38)}…</div>
            ))}
          </div>

          <button className="ps-btn ps-btn-primary" onClick={() => setScreen(3)}>
            {parentSecret.length > 4 ? 'Keep this safe →' : 'Skip for now →'}
          </button>
          <button className="ps-skip" onClick={() => setScreen(1)}>← Back</button>
        </div>
      </div>
    </div>
  );

  // Screen 3: Ready
  return (
    <div className="ps ps-default">
      <style>{CSS}</style>
      <div className="ps-nav"><div className="ps-logo"><div className="ps-logo-moon"/>SleepSeed</div></div>
      <div className="ps-body">
        <div className="ps-card">
          {stepsBar(3)}
          <div className="ps-h">You're all set <em>✦</em></div>
          <div className="ps-sub">
            Tonight at bedtime, open SleepSeed with {childName}. The magic takes about 5 minutes.
          </div>

          <div className="ps-ready-preview">
            <div className="ps-ready-emoji">🥚</div>
            <div className="ps-ready-name">{childName}'s egg is waiting</div>
            <div className="ps-ready-detail">Age {childAge} · {childPronouns}</div>
          </div>

          <button className="ps-btn ps-btn-primary" onClick={() => {
            onComplete({ childName, childAge, childPronouns, parentSecret });
          }}>
            Got it — take me to my dashboard ✦
          </button>
          <button className="ps-skip" onClick={() => setScreen(2)}>← Back</button>
        </div>
      </div>
    </div>
  );
}
