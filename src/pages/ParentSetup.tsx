import { useState, useRef, useEffect } from 'react';

export interface ParentSetupResult {
  childName: string;
  childAge: string;
  childPronouns: string;
  parentRole: string;
  parentSecret?: string;
}

interface Props {
  onComplete: (result: ParentSetupResult) => void;
  onSkip?: () => void;
  onSaveLater?: (result: ParentSetupResult) => void;
}

const SECRET_EXAMPLES = [
  'Talks to stuffed animals when nobody is looking',
  'Checks under the bed for friendly monsters every night',
  'Makes up songs about everything, even breakfast',
  'Draws maps of imaginary places on every piece of paper',
];

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --amber:#F5B84C;--amber-deep:#E8972A;
  --night:#080C18;--night-mid:#0D1120;--night-card:#0f1525;
  --cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);
  --teal-bright:#14d890;--purple:#9482ff;
  --ease-out:cubic-bezier(.16,1,.3,1);--ease-spring:cubic-bezier(.34,1.56,.64,1);
  --serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace;
}

@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 24px rgba(245,184,76,.25))}50%{filter:drop-shadow(0 0 48px rgba(245,184,76,.55))}}
@keyframes breathe{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes slideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

.ps{position:fixed;inset:0;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center;overflow-y:auto;overflow-x:hidden}
.ps-inner{width:100%;max-width:430px;min-height:100dvh;display:flex;flex-direction:column;padding:0 28px;position:relative}

/* Progress dots */
.ps-dots{display:flex;gap:8px;justify-content:center;padding:24px 0 0}
.ps-dot{width:7px;height:7px;border-radius:50%;transition:all .35s var(--ease-out)}
.ps-dot--done{background:var(--amber)}
.ps-dot--cur{background:var(--amber);transform:scale(1.5);box-shadow:0 0 8px rgba(245,184,76,.5)}
.ps-dot--future{background:rgba(255,255,255,.1)}

/* Content */
.ps-body{flex:1;display:flex;flex-direction:column;justify-content:center;animation:fadeUp .55s var(--ease-out) both}

/* Typography */
.ps-h{font-family:var(--serif);font-weight:300;font-size:clamp(26px,6vw,32px);line-height:1.25;margin-bottom:12px}
.ps-divider{width:48px;height:1px;background:rgba(245,184,76,.25);margin-bottom:16px}
.ps-sub{font-size:14px;font-weight:300;color:var(--cream-dim);line-height:1.75;margin-bottom:32px}
.ps-label{font-family:var(--mono);font-size:11px;font-weight:400;color:rgba(244,239,232,.35);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;display:block}
.ps-label-lined{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:14px}
.ps-label-lined::before,.ps-label-lined::after{content:'';flex:1;max-width:40px;height:1px;background:rgba(245,184,76,.2)}
.ps-label-lined span{font-family:var(--mono);font-size:11px;font-weight:400;color:rgba(245,184,76,.5);letter-spacing:.06em;text-transform:uppercase}

/* Swipeable cards */
.ps-cards-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:0 0 8px;scrollbar-width:none}
.ps-cards-track::-webkit-scrollbar{display:none}
.ps-card-item{flex:0 0 85%;scroll-snap-align:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:28px 24px;text-align:center}
.ps-card-emoji{font-size:40px;margin-bottom:12px;display:block}
.ps-card-title{font-family:var(--serif);font-weight:400;font-size:18px;margin-bottom:6px}
.ps-card-desc{font-size:13px;font-weight:300;color:var(--cream-dim);line-height:1.6}
.ps-card-dots{display:flex;gap:6px;justify-content:center;padding:12px 0 20px}
.ps-card-dot{width:6px;height:6px;border-radius:50%;transition:all .25s}

/* Science card */
.ps-glass{background:rgba(245,184,76,.04);border:1px solid rgba(245,184,76,.1);border-radius:20px;padding:28px 24px;margin-bottom:24px}
.ps-quote{font-family:var(--serif);font-weight:300;font-size:16px;line-height:1.6;color:var(--cream);margin-bottom:14px}
.ps-glass .ps-divider{margin:0 0 14px}
.ps-glass-body{font-size:13px;font-weight:300;color:var(--cream-dim);line-height:1.7;margin-bottom:16px}
.ps-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(20,216,144,.06);border:1px solid rgba(20,216,144,.15);border-radius:50px;padding:8px 16px;font-size:12px;font-weight:500;color:var(--teal-bright)}

/* Inputs */
.ps-input-serif{width:100%;padding:16px 0;border:none;border-bottom:1.5px solid rgba(255,255,255,.1);background:transparent;color:var(--cream);font-family:var(--serif);font-size:clamp(22px,5vw,28px);font-weight:300;outline:none;transition:border-color .2s;margin-bottom:20px}
.ps-input-serif:focus{border-color:rgba(245,184,76,.4)}
.ps-input-serif::placeholder{color:rgba(255,255,255,.15)}
.ps-ages{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.ps-age{width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:var(--cream-faint);font-size:15px;font-weight:600;cursor:pointer;transition:all .2s var(--ease-out);display:flex;align-items:center;justify-content:center}
.ps-age.on{border-color:var(--amber);background:rgba(245,184,76,.12);color:var(--amber)}
.ps-pronouns{display:flex;gap:8px;margin-bottom:20px}
.ps-roles{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.ps-role{padding:10px 16px;border-radius:50px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:var(--cream-faint);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s var(--ease-out)}
.ps-role.on{border-color:var(--amber);background:rgba(245,184,76,.12);color:var(--amber)}
.ps-role-input{width:100%;padding:10px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--cream);font-family:var(--sans);font-size:14px;font-weight:500;outline:none;transition:border-color .2s;margin-bottom:20px}
.ps-role-input:focus{border-color:rgba(245,184,76,.35)}
.ps-role-input::placeholder{color:rgba(255,255,255,.18)}
.ps-pronoun{padding:10px 18px;border-radius:50px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:var(--cream-faint);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s var(--ease-out)}
.ps-pronoun.on{border-color:var(--amber);background:rgba(245,184,76,.12);color:var(--amber)}
.ps-textarea{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(245,184,76,.12);background:rgba(245,184,76,.03);color:var(--cream);font-family:var(--sans);font-size:14px;font-weight:400;outline:none;resize:none;min-height:100px;transition:border-color .2s;margin-bottom:8px}
.ps-textarea:focus{border-color:rgba(245,184,76,.35)}
.ps-textarea::placeholder{color:rgba(255,255,255,.18)}
.ps-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
.ps-chip{padding:7px 14px;border-radius:50px;border:1px solid rgba(245,184,76,.1);background:rgba(245,184,76,.03);color:rgba(244,239,232,.4);font-size:11px;font-weight:500;cursor:pointer;transition:all .15s}
.ps-chip:hover{background:rgba(245,184,76,.07);color:var(--cream-dim)}

/* Buttons */
.ps-btn{width:100%;padding:17px;border:none;border-radius:14px;font-family:var(--sans);font-size:16px;font-weight:700;cursor:pointer;transition:all .2s var(--ease-out)}
.ps-btn-amber{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;box-shadow:0 6px 24px rgba(200,130,20,.3)}
.ps-btn-amber:hover{filter:brightness(1.1);transform:translateY(-2px)}
.ps-btn-amber:disabled{opacity:.3;cursor:default;transform:none;filter:none}
.ps-skip{background:none;border:none;color:rgba(244,239,232,.25);font-size:12px;font-weight:400;cursor:pointer;margin-top:14px;font-family:var(--sans);transition:color .15s;display:block;width:100%;text-align:center}
.ps-skip:hover{color:rgba(244,239,232,.5)}

/* Handoff */
.ps-moon{font-size:64px;display:block;text-align:center;margin-bottom:20px;filter:drop-shadow(0 0 32px rgba(245,184,76,.4));animation:glowPulse 4s ease-in-out infinite}
.ps-caption{font-family:var(--mono);font-size:11px;font-weight:300;color:rgba(244,239,232,.25);text-align:center;margin-top:16px;letter-spacing:.03em}

/* Back button */
.ps-back{position:absolute;top:20px;left:20px;background:none;border:none;color:rgba(244,239,232,.4);font-size:18px;cursor:pointer;font-family:var(--sans);padding:8px;z-index:10;transition:color .15s;-webkit-tap-highlight-color:transparent}
.ps-back:hover{color:rgba(244,239,232,.65)}
/* Exit link */
.ps-exit{background:none;border:none;color:rgba(244,239,232,.2);font-size:11px;font-weight:400;cursor:pointer;font-family:var(--mono);transition:color .15s;margin-top:20px;letter-spacing:.03em}
.ps-exit:hover{color:rgba(244,239,232,.4)}
/* Ghost button */
.ps-btn-ghost{width:100%;padding:15px;border:1px solid rgba(244,239,232,.15);border-radius:14px;background:transparent;color:rgba(244,239,232,.5);font-family:var(--sans);font-size:14px;font-weight:500;cursor:pointer;transition:all .2s var(--ease-out);margin-top:10px}
.ps-btn-ghost:hover{border-color:rgba(244,239,232,.25);color:rgba(244,239,232,.7)}

/* Beat pills (Moment 1 redesign) */
.ps-pill{display:inline-block;padding:6px 14px;border-radius:50px;border:1px solid rgba(244,239,232,.12);color:rgba(244,239,232,.35);font-family:var(--mono);font-size:11px;font-weight:400;animation:breathe 3s ease-in-out infinite}
.ps-beat-pips{display:flex;gap:6px;justify-content:center;position:absolute;bottom:32px;left:0;right:0}
.ps-beat-pip{width:6px;height:6px;border-radius:50%;transition:all .35s var(--ease-out)}
@keyframes crossfade-in{from{opacity:0}to{opacity:1}}
@keyframes crossfade-out{from{opacity:1}to{opacity:0}}

/* Ambient glow on moment 0 */
.ps-glow{position:fixed;top:20%;left:50%;transform:translateX(-50%);width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.06) 0%,transparent 70%);pointer-events:none;z-index:0}
`;

export default function ParentSetup({ onComplete, onSkip, onSaveLater }: Props) {
  const [moment, setMoment] = useState(0);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPronouns, setChildPronouns] = useState('');
  const [parentRole, setParentRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [parentSecret, setParentSecret] = useState('');
  const [activeCard, setActiveCard] = useState(0);
  const [beat, setBeat] = useState(0);
  const [beatDone, setBeatDone] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalMoments = 6;
  const resolvedRole = parentRole === 'Other' ? customRole.trim() : parentRole;

  // Live clock for Moment 0
  const [clockTime, setClockTime] = useState(() => new Date());
  useEffect(() => {
    if (moment !== 0) return;
    const interval = setInterval(() => setClockTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [moment]);

  const backBtn = (target: number) => (
    <button className="ps-back" onClick={() => setMoment(target)} aria-label="Back">&larr;</button>
  );

  const dots = (
    <div className="ps-dots">
      {Array.from({ length: totalMoments }, (_, i) => (
        <div key={i} className={`ps-dot ${i < moment ? 'ps-dot--done' : i === moment ? 'ps-dot--cur' : 'ps-dot--future'}`} />
      ))}
    </div>
  );

  const handleCardScroll = () => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const cardW = el.scrollWidth / 3;
    const idx = Math.round(el.scrollLeft / cardW);
    setActiveCard(Math.min(2, Math.max(0, idx)));
  };

  // Moment 1 beat logic — must be before any early returns (Rules of Hooks)
  const beatDurations = [4000, 7000, 3500];
  useEffect(() => {
    if (moment !== 1 || beatDone) return;
    if (beat >= 2) { setBeatDone(true); return; }
    const t = setTimeout(() => setBeat(b => b + 1), beatDurations[beat]);
    return () => clearTimeout(t);
  }, [moment, beat, beatDone]);
  useEffect(() => {
    if (moment === 1) { setBeat(0); setBeatDone(false); }
  }, [moment]);

  const advanceBeat = () => {
    if (beat < 2) setBeat(b => b + 1);
    else setBeatDone(true);
  };

  // Moment 0 — The Naming
  if (moment === 0) return (
    <div className="ps">
      <style>{CSS}</style>
      <div className="ps-glow" />
      <div className="ps-inner">
        {dots}
        <div className="ps-body" key="m0" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)',
            margin: '0 auto 14px', animation: 'breathe 2.5s ease-in-out infinite',
            boxShadow: '0 0 16px rgba(245,184,76,.35)',
          }} />
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 100,
            fontSize: 'clamp(64px,14vw,140px)', color: 'var(--cream)',
            lineHeight: 1, letterSpacing: '-.03em', marginBottom: 4, textAlign: 'center',
          }}>
            {clockTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/ ?[AP]M/i, '')}
          </div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)',
            textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 24, textAlign: 'center',
          }}>
            {clockTime.toLocaleTimeString([], { hour: 'numeric', hour12: true }).includes('AM') ? 'AM' : 'PM'}
          </div>
          <div className="ps-h" style={{ textAlign: 'center' }}>Children tell you the real thing right before sleep.</div>
          <div className="ps-divider" />
          <div className="ps-sub" style={{ textAlign: 'center' }}>
            When it's dark. When their guard is finally down. SleepSeed gives you a reason to stay for that moment — and a way to keep it forever.
          </div>
          <button className="ps-btn ps-btn-amber" onClick={() => setMoment(1)}>
            I want that &rarr;
          </button>
          {onSkip && (
            <button className="ps-exit" onClick={onSkip}>Do this later</button>
          )}
        </div>
      </div>
    </div>
  );

  if (moment === 1) {
    return (
      <div className="ps" onClick={advanceBeat} style={{ cursor: 'pointer' }}>
        <style>{CSS}</style>
        <div className="ps-inner">
          {backBtn(0)}
          {dots}
          <div className="ps-body" key={`m1-beat${beat}`} style={{ alignItems: 'center', textAlign: 'center' }}>

            {/* Beat 0: Pills + "Bedtime is a battle. Until it isn't." */}
            {beat === 0 && (
              <div style={{ animation: 'crossfade-in .8s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                  {['just five more minutes', "I'm not tired", 'one more show', "I can't sleep"].map((pill, i) => (
                    <span key={i} className="ps-pill" style={{ animationDelay: `${i * 0.15}s` }}>{pill}</span>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,239,232,.25)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 20 }}>
                  Every parent knows this moment.
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(24px,5.5vw,30px)', color: 'var(--cream)', lineHeight: 1.35 }}>
                  Bedtime is a battle.
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(24px,5.5vw,30px)', color: 'var(--amber)', lineHeight: 1.35 }}>
                  Until it isn't.
                </div>
              </div>
            )}

            {/* Beat 1: Life is loud. SleepSeed is the pause. */}
            {beat === 1 && (
              <div style={{ animation: 'crossfade-in .8s ease both', maxWidth: 340 }}>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(24px,5.5vw,30px)', color: 'var(--cream)', lineHeight: 1.3, marginBottom: 6 }}>
                  Life is loud.
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(24px,5.5vw,30px)', color: 'var(--amber)', lineHeight: 1.3, marginBottom: 24 }}>
                  SleepSeed is the pause.
                </div>
                <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--cream-dim)', lineHeight: 1.8 }}>
                  Every family has a fragmenting force — the phone, Netflix, the endless scroll. SleepSeed gathers your family back to each other every single night, at the moment that matters most.
                </div>
              </div>
            )}

            {/* Beat 2: "SleepSeed delivers the moment. You keep it forever." + Night Card */}
            {beat >= 2 && (
              <div style={{ animation: 'crossfade-in .8s ease both', maxWidth: 360 }}>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px,5vw,28px)', color: 'var(--cream)', lineHeight: 1.3, marginBottom: 6 }}>
                  SleepSeed delivers the moment.
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px,5vw,28px)', color: 'var(--amber)', lineHeight: 1.3, marginBottom: 20 }}>
                  You keep it forever.
                </div>

                {/* Mini night card — tilted, glowing */}
                <div style={{
                  width: 180, margin: '0 auto 24px',
                  transform: 'rotate(-2deg)',
                  filter: 'drop-shadow(0 12px 32px rgba(0,0,0,.5))',
                }}>
                  <div style={{
                    background: '#faf6ee', borderRadius: 6, padding: '10px 10px 20px',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Photo area */}
                    <div style={{
                      width: '100%', aspectRatio: '4/3', borderRadius: 3,
                      background: 'linear-gradient(135deg, #0d1428, #1a1040)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10, position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ fontSize: 28, filter: 'drop-shadow(0 0 12px rgba(245,184,76,.4))' }}>🌙</div>
                      {/* Stars */}
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: '#F5B84C',
                          top: `${20 + i * 25}%`, left: `${15 + i * 30}%`, opacity: 0.5,
                        }} />
                      ))}
                    </div>
                    {/* Card text */}
                    <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 10, color: '#1a0f08', fontWeight: 400, marginBottom: 3, textAlign: 'center' }}>
                      The night it all began
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#999', textAlign: 'center', marginBottom: 4 }}>
                      Night 1 &middot; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 8, color: '#666', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "She said it so quietly — like she already knew."
                    </div>
                    {/* Amber glow at bottom edge */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2,
                      background: 'linear-gradient(90deg, transparent, rgba(245,184,76,.3), transparent)',
                      borderRadius: 1,
                    }} />
                  </div>
                </div>

                {beatDone && (
                  <button className="ps-btn ps-btn-amber" onClick={e => { e.stopPropagation(); setMoment(2); }} style={{ animation: 'fadeUp .5s var(--ease-out)' }}>
                    That's beautiful &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Beat pips */}
          <div className="ps-beat-pips">
            {[0, 1, 2].map(i => (
              <div key={i} className="ps-beat-pip" style={{
                background: i <= beat ? 'var(--amber)' : 'rgba(255,255,255,.1)',
                opacity: i <= beat ? (i === beat ? 1 : 0.4) : 0.2,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Moment 2 — The Science
  if (moment === 2) return (
    <div className="ps">
      <style>{CSS}</style>
      <div className="ps-inner">
        {backBtn(1)}
        {dots}
        <div className="ps-body" key="m2">
          <div className="ps-glass">
            <div className="ps-quote">
              "The 20 minutes before sleep are when children process their biggest feelings. It's when they say the things they've been holding all day."
            </div>
            <div className="ps-divider" />
            <div className="ps-glass-body">
              Researchers call it the "confessional hour." That window is yours. Every single night.
            </div>
            <div className="ps-badge">
              <span style={{ fontSize: 8, color: 'var(--teal-bright)' }}>&#x2B24;</span>
              10 minutes a night. That's all it takes.
            </div>
          </div>

          <button className="ps-btn ps-btn-amber" onClick={() => setMoment(3)}>
            Let's set it up &rarr;
          </button>
        </div>
      </div>
    </div>
  );

  // Moment 3 — Child Setup
  if (moment === 3) return (
    <div className="ps">
      <style>{CSS}</style>
      <div className="ps-inner">
        {backBtn(2)}
        {dots}
        <div className="ps-body" key="m3">
          <div className="ps-label">Step 1 of 2</div>
          <div className="ps-h" style={{ fontSize: 'clamp(22px,5vw,26px)' }}>
            Let's get {childName.trim() ? <span style={{ color: 'var(--amber)' }}>{childName.trim()}</span> : '…'} ready for their first adventure.
          </div>
          <div style={{ height: 8 }} />

          <div className="ps-label">Child's name</div>
          <input
            className="ps-input-serif"
            placeholder="Their first name"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            autoFocus
            aria-label="Child's first name"
          />

          <div className="ps-label">Age</div>
          <div className="ps-ages">
            {['3', '4', '5', '6', '7', '8', '9', '10+'].map(a => (
              <div
                key={a}
                className={`ps-age${childAge === a ? ' on' : ''}`}
                onClick={() => setChildAge(a)}
                role="button"
                tabIndex={0}
                aria-label={`Age ${a}`}
              >{a}</div>
            ))}
          </div>

          <div className="ps-label">Pronouns</div>
          <div className="ps-pronouns">
            {['he/him', 'she/her', 'they/them'].map(p => (
              <div
                key={p}
                className={`ps-pronoun${childPronouns === p ? ' on' : ''}`}
                onClick={() => setChildPronouns(p)}
                role="button"
                tabIndex={0}
                aria-label={p}
              >{p}</div>
            ))}
          </div>

          <div className="ps-label">What does {childName.trim() || 'your child'} call you?</div>
          <div className="ps-roles">
            {['Mom', 'Dad', 'Mama', 'Papa', 'Grandma', 'Grandpa', 'Other'].map(r => (
              <div
                key={r}
                className={`ps-role${parentRole === r ? ' on' : ''}`}
                onClick={() => setParentRole(r)}
                role="button"
                tabIndex={0}
                aria-label={r}
              >{r}</div>
            ))}
          </div>
          {parentRole === 'Other' && (
            <input
              className="ps-role-input"
              placeholder="e.g. Auntie, Nanny, Baba…"
              value={customRole}
              onChange={e => setCustomRole(e.target.value)}
              autoFocus
              aria-label="Custom parent role"
            />
          )}

          <button
            className="ps-btn ps-btn-amber"
            disabled={childName.trim().length < 2 || !childAge || !childPronouns || !resolvedRole}
            onClick={() => setMoment(4)}
          >
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );

  // Moment 4 — Parent's Secret
  if (moment === 4) return (
    <div className="ps">
      <style>{CSS}</style>
      <div className="ps-inner">
        {backBtn(3)}
        {dots}
        <div className="ps-body" key="m4">
          <div className="ps-label-lined">
            <span>Just for you</span>
          </div>
          <div className="ps-h" style={{ textAlign: 'center' }}>
            What's something about {childName.trim()} that makes you smile when they're not looking?
          </div>
          <div className="ps-sub" style={{ textAlign: 'center', color: 'var(--teal-bright)', fontSize: 13 }}>
            We'll weave this into their first story tonight. They'll never know where it came from.
          </div>

          <textarea
            className="ps-textarea"
            placeholder={`${childName.trim()} secretly...`}
            value={parentSecret}
            onChange={e => setParentSecret(e.target.value)}
            rows={3}
            aria-label="Parent's secret about their child"
          />
          <div className="ps-chips">
            {SECRET_EXAMPLES.map((ex, i) => (
              <div key={i} className="ps-chip" onClick={() => setParentSecret(ex)}>{ex}</div>
            ))}
          </div>

          <button className="ps-btn ps-btn-amber" onClick={() => setMoment(5)}>
            {parentSecret.trim().length > 4 ? 'Done \u2192' : 'Done \u2192'}
          </button>
          <button className="ps-skip" onClick={() => { setParentSecret(''); setMoment(5); }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );

  // Moment 5 — The Handoff
  return (
    <div className="ps">
      <style>{CSS}</style>
      <div className="ps-inner">
        {backBtn(4)}
        {dots}
        <div className="ps-body" key="m5" style={{ textAlign: 'center' }}>
          <div className="ps-moon">🌙</div>
          <div className="ps-h" style={{ textAlign: 'center' }}>
            {childName.trim()}'s world is ready.
          </div>
          <div className="ps-sub" style={{ textAlign: 'center' }}>
            Now go get {childName.trim()}.
          </div>

          <button className="ps-btn ps-btn-amber" onClick={() => {
            onComplete({
              childName: childName.trim(),
              childAge,
              childPronouns,
              parentRole: resolvedRole,
              parentSecret: parentSecret.trim() || undefined,
            });
          }}>
            Begin {childName.trim()}'s First Night &rarr;
          </button>
          {onSaveLater && (
            <button className="ps-btn-ghost" onClick={() => {
              onSaveLater({
                childName: childName.trim(),
                childAge,
                childPronouns,
                parentRole: resolvedRole,
                parentSecret: parentSecret.trim() || undefined,
              });
            }}>
              Complete later when {childName.trim()} is present &rarr;
            </button>
          )}
          <div className="ps-caption">This is the part you do together.</div>
        </div>
      </div>
    </div>
  );
}
