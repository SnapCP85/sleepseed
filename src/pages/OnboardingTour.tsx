import { useState } from 'react';
import { useApp } from '../AppContext';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.ot{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes hlpulse{0%,100%{box-shadow:0 0 0 0 rgba(232,151,42,0)}50%{box-shadow:0 0 0 5px rgba(232,151,42,.32),0 0 14px rgba(232,151,42,.18)}}
.ot-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.ot-sky{position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#030712 0%,#080C18 55%);z-index:0;pointer-events:none}
.ot-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 24px 0;position:relative;z-index:10;max-width:480px;margin:0 auto;width:100%}
.ot-dots{display:flex;gap:6px}
.ot-dot{height:3px;border-radius:2px;background:rgba(255,255,255,.1);transition:all .3s}
.ot-dot.on{background:var(--amber);width:24px}
.ot-dot.done{background:rgba(232,151,42,.38);width:20px}
.ot-dot.upcoming{width:20px}
.ot-skip{font-size:11px;color:rgba(255,255,255,.22);background:none;border:none;cursor:pointer;font-family:var(--sans);transition:color .15s}
.ot-skip:hover{color:rgba(255,255,255,.5)}
.ot-content{flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 24px 12px;position:relative;z-index:5;max-width:480px;margin:0 auto;width:100%}
.ot-step{display:none;animation:fadein .3s ease-out}
.ot-step.on{display:flex;flex-direction:column}
.ot-label{font-size:8.5px;letter-spacing:.08em;color:rgba(232,151,42,.65);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:8px}
.ot-title{font-family:var(--serif);font-size:clamp(20px,4vw,26px);color:var(--cream);line-height:1.32;margin-bottom:6px;font-weight:700}
.ot-title em{font-style:italic;color:var(--amber2)}
.ot-body{font-size:13px;color:rgba(244,239,232,.42);line-height:1.78;margin-bottom:18px;font-weight:300}
.ot-body strong{color:rgba(244,239,232,.72);font-weight:500}

/* mockup containers */
.ot-mock{background:rgba(255,255,255,.018);border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:14px;margin-bottom:16px;position:relative}
.ot-hl{position:absolute;border-radius:14px;border:2px solid rgba(232,151,42,.7);box-shadow:0 0 0 3px rgba(232,151,42,.12),0 0 18px rgba(232,151,42,.15);animation:hlpulse 2s ease-in-out infinite;pointer-events:none;z-index:2}

/* mock UI atoms */
.mk-ritual{background:rgba(10,15,34,.98);border:1.5px solid var(--amber);border-radius:12px;padding:11px 13px;position:relative;overflow:hidden}
.mk-ritual::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.38),transparent)}
.mk-tag{font-size:7.5px;letter-spacing:.07em;color:var(--amber);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:4px}
.mk-h{font-family:var(--serif);font-size:13px;color:var(--cream);margin-bottom:3px;line-height:1.3}
.mk-sub{font-size:9px;color:var(--muted);font-style:italic;margin-bottom:8px}
.mk-btn{background:linear-gradient(135deg,#E8972A,#CC7818);border-radius:8px;padding:8px;text-align:center;font-size:10.5px;font-weight:600;color:#120800}
.mk-const-name{font-size:8px;color:rgba(90,72,32,.85);font-style:italic;font-family:var(--serif);margin-bottom:5px}
.mk-const-row{display:flex;align-items:center;justify-content:space-between}
.mk-stars{display:flex;gap:3px;align-items:center}
.mk-star{font-size:10px;color:#B07808}
.mk-star.dim{color:#151828;font-size:9px}
.mk-gnum{font-family:var(--serif);font-size:24px;color:var(--amber2);line-height:1}
.mk-gbar{height:2.5px;background:rgba(255,255,255,.05);border-radius:2px;margin:6px 0 3px;overflow:hidden}
.mk-gfill{height:2.5px;background:linear-gradient(90deg,#E8972A,#F5B84C);border-radius:2px}
.mk-gsub{display:flex;justify-content:space-between;font-size:7.5px;color:rgba(255,255,255,.18);font-family:var(--mono)}
.mk-handoff-row{display:flex;gap:6px}
.mk-path{border-radius:10px;padding:9px 10px;flex:1;position:relative;overflow:hidden}
.mk-path-a{background:rgba(10,15,34,.98);border:1.5px solid var(--amber)}
.mk-path-a::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.35),transparent)}
.mk-path-b{background:rgba(14,10,28,.98);border:1.5px solid rgba(120,80,240,.4)}
.mk-path-tag{font-size:7px;font-family:var(--mono);letter-spacing:.06em;font-weight:600;text-transform:uppercase;margin-bottom:3px}
.mk-path-title{font-family:var(--serif);font-size:10.5px;color:var(--cream);margin-bottom:4px;line-height:1.3;font-weight:700}
.mk-path-btn{border:none;border-radius:7px;padding:6px;font-size:9px;font-weight:600;width:100%;cursor:pointer;font-family:var(--sans)}
.mk-nc-strip{display:flex;gap:8px;align-items:flex-start}
.mk-pol{background:#F4EFE2;border-radius:3px;padding:7px 7px 18px;box-shadow:0 4px 14px rgba(0,0,0,.55)}
.mk-pol-img{width:56px;height:46px;background:linear-gradient(135deg,#1A1C2A,#201830);border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:18px}
.mk-pol-cap{font-family:Georgia,serif;font-size:7px;color:#3A2600;text-align:center;font-style:italic;margin-top:5px;line-height:1.3}

.ot-btns{display:flex;gap:8px;padding:0 24px 24px;max-width:480px;margin:0 auto;width:100%;position:relative;z-index:5}
.ot-btn-back{flex:1;background:rgba(255,255,255,.04);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:12px;font-size:12px;color:rgba(255,255,255,.35);cursor:pointer;font-family:var(--sans);transition:all .18s}
.ot-btn-back:hover{color:rgba(255,255,255,.6)}
.ot-btn-next{flex:2;background:linear-gradient(135deg,#E8972A,#CC7818);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:600;color:#120800;cursor:pointer;font-family:var(--sans);transition:filter .18s,transform .15s}
.ot-btn-next:hover{filter:brightness(1.08);transform:translateY(-1px)}
`;

const STARS = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 50,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
}));

const STEPS = [
  {
    label: 'your home',
    title: (<>Every night starts <em>here.</em></>),
    body: <>Your home screen lives and breathes the ritual. <strong>Tonight's story card is always waiting</strong> — one tap and you're in.</>,
    mockup: (
      <div className="ot-mock">
        <div className="ot-hl" style={{ inset: 0 }} />
        <div className="mk-tag">tonight's ritual</div>
        <div className="mk-ritual">
          <div className="mk-tag" style={{ color: 'var(--amber)' }}>✦ tonight's ritual</div>
          <div className="mk-h">What happened in <span style={{ color: '#F5B84C', fontStyle: 'italic' }}>Emma's</span> world today?</div>
          <div className="mk-sub">Ask her — write or speak what she says</div>
          <div className="mk-btn">Start tonight's story ✦</div>
        </div>
      </div>
    ),
  },
  {
    label: 'the glow',
    title: (<>Every night you show up, a <em>star is added.</em></>),
    body: <>Seven nights earns a named constellation — <strong>the little fox, the sleeping bear.</strong> Miss a night? The glow dims gently. It never breaks.</>,
    mockup: (
      <div className="ot-mock">
        <div className="ot-hl" style={{ inset: 0 }} />
        <div className="mk-const-name">✦ the little fox · week 2</div>
        <div className="mk-const-row">
          <div className="mk-stars">
            {['★','★','★','★','★','☆','☆'].map((s, i) => (
              <span key={i} className={`mk-star${i >= 5 ? ' dim' : ''}`}>{s}</span>
            ))}
          </div>
          <div className="mk-gnum">5</div>
        </div>
        <div className="mk-gbar"><div className="mk-gfill" style={{ width: '71%' }} /></div>
        <div className="mk-gsub"><span>5 of 7 this week</span><span>2 nights to complete ✦</span></div>
      </div>
    ),
  },
  {
    label: 'the story',
    title: (<>Tonight's story is built from <em>their day.</em></>),
    body: <>Write what they told you. Choose to weave it into the adventure — or <strong>invent something entirely new together.</strong></>,
    mockup: (
      <div className="ot-mock">
        <div className="ot-hl" style={{ inset: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(18,24,50,.9)', border: '1.5px solid #E8972A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#F5B84C', fontWeight: 600, flexShrink: 0 }}>Em</div>
          <div style={{ fontSize: 9, color: 'rgba(244,239,232,.4)' }}>What happened in <span style={{ color: '#F5B84C' }}>Emma's</span> world today?</div>
        </div>
        <div style={{ background: 'rgba(232,151,42,.05)', border: '.5px solid rgba(232,151,42,.18)', borderRadius: 9, padding: '7px 10px', fontSize: 9.5, color: 'rgba(232,151,42,.8)', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 8 }}>
          "She was nervous about her spelling test…"
        </div>
        <div className="mk-handoff-row">
          <div className="mk-path mk-path-a">
            <div className="mk-path-tag" style={{ color: 'var(--amber)' }}>ritual story</div>
            <div className="mk-path-title">Weave today in</div>
            <button className="mk-path-btn" style={{ background: 'linear-gradient(135deg,#E8972A,#CC7818)', color: '#120800' }}>Create ✦</button>
          </div>
          <div className="mk-path mk-path-b">
            <div className="mk-path-tag" style={{ color: 'rgba(160,120,255,.8)' }}>together</div>
            <div className="mk-path-title">Build something new</div>
            <button className="mk-path-btn" style={{ background: 'rgba(120,80,240,.18)', border: '1px solid rgba(160,120,255,.28)', color: 'rgba(190,160,255,.9)' }}>Invent →</button>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'night cards',
    title: (<>What they say tonight is <em>saved forever.</em></>),
    body: <>After each story, a Night Card captures the best of the moment — a quote, a photo, a memory line. <strong>Your archive grows every night.</strong> One year from now, you'll read them back and feel everything.</>,
    mockup: (
      <div className="ot-mock">
        <div className="ot-hl" style={{ inset: 0 }} />
        <div className="mk-nc-strip">
          {[
            { icon: '🌙', name: 'Emma', date: 'Mar 20', rot: '-2deg' },
            { icon: '✨', name: 'Emma', date: 'Mar 19', rot: '1.5deg', mt: 8 },
            { icon: '🦁', name: 'Emma', date: 'Mar 18', rot: '-2.5deg', mt: 4 },
          ].map((p, i) => (
            <div key={i} className="mk-pol" style={{ transform: `rotate(${p.rot})`, marginTop: p.mt || 0 }}>
              <div className="mk-pol-img">{p.icon}</div>
              <div className="mk-pol-cap">{p.name}<br />{p.date}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function OnboardingTour() {
  const { setView } = useApp();
  const [step, setStep] = useState(0);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else setView('onboarding-night0');
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="ot">
      <style>{CSS}</style>
      <div className="ot-sky" />
      {STARS.map(s => (
        <div key={s.id} className="ot-star"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
      ))}

      <div className="ot-nav">
        <div className="ot-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`ot-dot ${i === step ? 'on' : i < step ? 'done' : 'upcoming'}`} />
          ))}
        </div>
        <button className="ot-skip" onClick={() => setView('onboarding-night0')}>Skip →</button>
      </div>

      <div className="ot-content">
        {STEPS.map((s, i) => (
          <div key={i} className={`ot-step${i === step ? ' on' : ''}`}>
            <div className="ot-label">{s.label}</div>
            <div className="ot-title">{s.title}</div>
            {s.mockup}
            <div className="ot-body">{s.body}</div>
          </div>
        ))}
      </div>

      <div className="ot-btns">
        {step > 0 && (
          <button className="ot-btn-back" onClick={back}>← Back</button>
        )}
        <button className="ot-btn-next" onClick={next}
          style={{ flex: step === 0 ? 3 : 2 }}>
          {isLast ? 'Create my first Night Card ✦' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
