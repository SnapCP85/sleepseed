import { useState } from 'react';
import { useApp } from '../AppContext';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--teal2:#5DCAA5;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.rs{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes twk2{0%,100%{opacity:.22}60%{opacity:.04}}
.rs-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.rs-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.rs-sky{position:fixed;top:0;left:0;right:0;height:260px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}
.rs-moon-pos{position:fixed;top:68px;right:28px;z-index:2;pointer-events:none}
.rs-moon-glow{position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(245,184,76,.07);top:-9px;left:-9px}
.rs-moon{width:30px;height:30px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden}
.rs-moon-sh{position:absolute;width:29px;height:29px;border-radius:50%;background:#050916;top:-5px;left:-7px}
.rs-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(232,151,42,.08);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.rs-back{background:transparent;border:none;color:rgba(244,239,232,.38);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s;padding:0}
.rs-back:hover{color:rgba(244,239,232,.72)}
.rs-badge{background:rgba(20,26,50,.9);border:.5px solid rgba(255,255,255,.08);border-radius:20px;padding:4px 12px;font-size:10px;color:var(--amber);display:flex;align-items:center;gap:5px;font-family:var(--mono)}
.rs-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--amber);animation:twk 2s ease-in-out infinite}
.rs-inner{max-width:640px;margin:0 auto;padding:0 6% 48px;position:relative;z-index:5}
.rs-hero{padding:24px 0 16px;text-align:center}
.rs-hero-lbl{font-size:9px;letter-spacing:.08em;color:var(--amber);font-weight:600;text-transform:uppercase;margin-bottom:8px;font-family:var(--mono)}
.rs-hero-title{font-family:var(--serif);font-size:clamp(22px,4vw,30px);color:var(--cream);line-height:1.35;margin-bottom:5px}
.rs-n1{color:var(--amber2);font-style:italic;text-shadow:0 0 14px rgba(245,184,76,.3)}
.rs-n2{color:var(--teal2);font-style:italic}
.rs-hero-sub{font-size:12px;color:rgba(200,191,176,.65);font-style:italic}
.rs-cap-wrap{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:14px}
.rs-cap-top{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 0}
.rs-cap-lbl{font-size:9px;color:rgba(200,191,176,.55);letter-spacing:.05em;font-family:var(--mono)}
.rs-mic-btn{background:rgba(18,22,44,.9);border:.5px solid rgba(255,255,255,.08);border-radius:8px;padding:5px 10px;font-size:11px;color:var(--dim);display:flex;align-items:center;gap:5px;cursor:pointer;transition:all .2s}
.rs-mic-btn:hover{border-color:rgba(232,151,42,.3);color:var(--amber2)}
.rs-mic-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);flex-shrink:0}
.rs-textarea{width:100%;background:transparent;border:none;outline:none;padding:8px 16px 14px;color:var(--cream);font-size:14px;font-family:var(--sans);resize:none;min-height:76px;line-height:1.7}
.rs-textarea::placeholder{color:rgba(200,191,176,.45);font-style:italic}
.rs-mood-row{display:flex;align-items:center;gap:10px;padding:8px 16px 10px;border-top:.5px solid rgba(255,255,255,.04)}
.rs-mood-lbl{font-size:10px;color:rgba(200,191,176,.55);flex-shrink:0}
.rs-moods{display:flex;gap:6px}
.rs-mood{background:rgba(8,12,24,.9);border:.5px solid rgba(255,255,255,.07);border-radius:8px;padding:5px 8px;font-size:14px;cursor:pointer;transition:all .18s;line-height:1}
.rs-mood.on{background:rgba(18,26,50,.9);border-color:var(--amber);box-shadow:0 0 10px rgba(232,151,42,.25)}
.rs-mood:hover:not(.on){border-color:rgba(232,151,42,.25);background:rgba(14,18,38,.9)}
.rs-qs-section{margin-bottom:14px}
.rs-qs-div{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.rs-qs-line{flex:1;height:.5px;background:rgba(255,255,255,.04)}
.rs-qs-lbl{font-size:9px;color:rgba(200,191,176,.45);white-space:nowrap;font-family:var(--mono)}
.rs-qlist{display:flex;flex-direction:column;gap:5px}
.rs-qchip{background:rgba(8,12,24,.98);border:.5px solid rgba(255,255,255,.05);border-radius:11px;padding:9px 13px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .18s,background .18s}
.rs-qchip:hover{border-color:rgba(232,151,42,.3);background:rgba(12,16,34,.98)}
.rs-qchip:active{background:rgba(14,20,40,.98)}
.rs-qicon{font-size:14px;flex-shrink:0;line-height:1}
.rs-qtext{font-size:12.5px;color:rgba(234,226,212,.82);line-height:1.4}
.rs-actions{padding-top:4px}
.rs-create-btn{width:100%;border:none;border-radius:14px;padding:15px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;justify-content:center;gap:7px;letter-spacing:.01em;transition:filter .2s,transform .15s;margin-bottom:10px}
.rs-create-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.rs-create-btn:disabled{opacity:.4;cursor:default;transform:none}
.rs-cust-link{text-align:center;font-size:11px;color:rgba(255,255,255,.18);cursor:pointer;transition:color .15s;background:none;border:none;font-family:var(--sans);width:100%;padding:4px 0}
.rs-cust-link:hover{color:rgba(255,255,255,.38)}
`;

const MOODS = ['😊','🥺','😂','🦁','😴'];
const QUESTIONS = [
  { icon:'✨', text:'What was the best part of your day?' },
  { icon:'🦁', text:'Was anything hard or scary today?' },
  { icon:'😂', text:'Did anything make you laugh?' },
  { icon:'💭', text:'What are you thinking about right now?' },
  { icon:'🌟', text:'If today was a story, what would it be called?' },
];

const STARS_RS = Array.from({length:20},(_,i)=>({
  id:i, x:Math.random()*100, y:Math.random()*30,
  size:Math.random()<.4?3:2,
  d:(2.5+Math.random()*2.5).toFixed(1)+'s',
  dl:(Math.random()*3).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
}));

export default function RitualStarter() {
  const {setView, selectedCharacters, ritualSeed, setRitualSeed, ritualMood, setRitualMood, setSelectedCharacter} = useApp();
  const [seed, setSeed] = useState(ritualSeed || '');
  const [mood, setMood] = useState(ritualMood || '');

  const primary   = selectedCharacters[0] ?? null;
  const secondary = selectedCharacters[1] ?? null;
  const isMulti   = selectedCharacters.length > 1;

  const badgeText = isMulti
    ? selectedCharacters.map(c => c.name).join(' & ') + ' · tonight'
    : primary ? `${primary.name} · tonight` : 'tonight';

  const btnBg    = isMulti ? 'linear-gradient(135deg,#1D9E75,#158C62)' : 'linear-gradient(135deg,#E8972A,#CC7818)';
  const btnColor = isMulti ? '#E1F5EE' : '#120800';

  function addQuestion(q: string) {
    const current = seed.trim();
    setSeed(current ? current + '\n' + q + ' ' : q + ' ');
  }

  function handleCreate() {
    setRitualSeed(seed);
    setRitualMood(mood);
    // Set primary character for the story builder
    if (primary) setSelectedCharacter(primary);
    setView('story-builder');
  }

  return (
    <div className="rs">
      <style>{CSS}</style>
      <div className="rs-sky"/>
      {STARS_RS.map(s=>(
        <div key={s.id} className={s.t===1?'rs-star':'rs-star2'}
          style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
      ))}
      <div className="rs-moon-pos">
        <div className="rs-moon-glow"/>
        <div className="rs-moon"><div className="rs-moon-sh"/></div>
      </div>

      <nav className="rs-nav">
        <button className="rs-back" onClick={()=>setView('dashboard')}>← home</button>
        <div className="rs-badge"><div className="rs-badge-dot"/>{badgeText}</div>
      </nav>

      <div className="rs-inner">
        <div className="rs-hero">
          <div className="rs-hero-lbl">tonight's story</div>
          <div className="rs-hero-title">
            {selectedCharacters.length === 0 && "What happened in your child's world today?"}
            {selectedCharacters.length === 1 && <>What happened in{' '}<span className="rs-n1">{primary?.name}'s</span> world today?</>}
            {selectedCharacters.length === 2 && <>What happened in{' '}<span className="rs-n1">{primary?.name}</span>{' '}<span style={{color:'rgba(255,255,255,.35)',fontStyle:'normal',fontSize:'0.8em'}}>&</span>{' '}<span className="rs-n2">{secondary?.name}'s</span> world today?</>}
            {selectedCharacters.length > 2 && <>What happened in your children's world today?</>}
          </div>
          <div className="rs-hero-sub">Ask {selectedCharacters.length > 1 ? 'them' : 'them'} — then write or speak what they say</div>
        </div>

        <div className="rs-cap-wrap">
          <div className="rs-cap-top">
            <div className="rs-cap-lbl">in their own words…</div>
            <div className="rs-mic-btn"><div className="rs-mic-dot"/>voice</div>
          </div>
          <textarea
            className="rs-textarea"
            value={seed}
            onChange={e => setSeed(e.target.value)}
            placeholder="She was nervous about her spelling test… something funny happened at lunch… she asked a big question…"
          />
          <div className="rs-mood-row">
            <div className="rs-mood-lbl">tonight {selectedCharacters.length > 1 ? "they're" : "they're"}</div>
            <div className="rs-moods">
              {MOODS.map((m,i) => (
                <div key={i} className={`rs-mood ${mood === m ? 'on' : ''}`} onClick={() => setMood(mood === m ? '' : m)}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rs-qs-section">
          <div className="rs-qs-div">
            <div className="rs-qs-line"/>
            <div className="rs-qs-lbl">ask them one of these</div>
            <div className="rs-qs-line"/>
          </div>
          <div className="rs-qlist">
            {QUESTIONS.map((q,i) => (
              <div key={i} className="rs-qchip" onClick={() => addQuestion(q.text)}>
                <div className="rs-qicon">{q.icon}</div>
                <div className="rs-qtext">"{q.text}"</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rs-actions">
          <button
            className="rs-create-btn"
            style={{background:btnBg, color:btnColor}}
            onClick={handleCreate}
            disabled={selectedCharacters.length === 0}>
            Create tonight's story ✦
          </button>
          <button className="rs-cust-link" onClick={() => setView('story-builder')}>
            customise story options →
          </button>
        </div>
      </div>
    </div>
  );
}
