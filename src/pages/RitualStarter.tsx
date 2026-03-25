// DEPRECATED — replaced by StoryCreator.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../AppContext';
import { getNightCards, getCharacters } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import type { SavedNightCard, Character, HatchedCreature, BuilderChoices } from '../lib/types';

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

function cardBelongsTo(c: SavedNightCard, id: string) { return c.characterIds?.includes(id); }
function calculateGlow(cards: SavedNightCard[], charId: string): number {
  const dates = new Set(cards.filter(c => cardBelongsTo(c, charId)).map(c => c.date.split('T')[0]));
  let streak = 0; const d = new Date(); d.setHours(0,0,0,0);
  const ds = (dt: Date) => dt.toISOString().split('T')[0];
  for (let i = 0; i < 365; i++) { if (dates.has(ds(d))) { streak++; d.setDate(d.getDate()-1); } else if (i===0) d.setDate(d.getDate()-1); else break; }
  return streak;
}

/* ── Creature question pools ── */
const Q_SILLY = [
  "What's the silliest thing that happened today?",
  "If you could have any superpower just for tonight, what would it be?",
  "What would you do if your shoes could talk?",
  "If today was a sandwich, what would be in it?",
  "What made you laugh the most today?",
];
const Q_BRAVE = [
  "Did you do anything brave today?",
  "What was the hardest part of your day?",
  "If you could go on any adventure tonight, where would we go?",
  "Was there a moment today when you felt really strong?",
  "What's something you want to try but haven't yet?",
];
const Q_GENTLE = [
  "What was the best part of today?",
  "Is there anything on your mind right now?",
  "Who made you feel happy today?",
  "What do you want to dream about?",
  "If today had a colour, what would it be?",
];
const Q_CURIOUS = [
  "What's something interesting you noticed today?",
  "If you could ask the moon one question, what would it be?",
  "What surprised you today?",
  "If today was a story, what would you call it?",
  "What did you wonder about today?",
];

function pickQPool(traits: string[]): string[] {
  const t = (traits||[]).join(' ').toLowerCase();
  if (t.includes('silly')||t.includes('playful')||t.includes('mischiev')) return Q_SILLY;
  if (t.includes('brave')||t.includes('bold')||t.includes('fierce')) return Q_BRAVE;
  if (t.includes('curious')||t.includes('wise')||t.includes('clever')) return Q_CURIOUS;
  return Q_GENTLE;
}

const GREETINGS: Record<string,string[]> = {
  silly: [
    "Hey {c}! Quick, tell me about your day before I forget how to listen!",
    "{c}! I've been waiting ALL day. Spill the beans!",
    "Psst... {c}! I need story fuel. What happened today?",
  ],
  brave: [
    "Hey {c}! Any adventures today? Tell me everything.",
    "{c}, what was the bravest thing you did today?",
    "Ready for tonight's story, {c}? First, tell me about YOUR day!",
  ],
  gentle: [
    "Hey {c}... how was your day? I'd love to hear about it.",
    "{c}, tell me everything. I'm all ears tonight.",
    "Hi {c}. Tell me one thing from today before your story.",
  ],
  curious: [
    "{c}! What was the most interesting thing about today?",
    "Hey {c}, tell me something I don't know about your day!",
    "{c}, I've been curious all day \u2014 what happened?",
  ],
};

function pickGreeting(traits: string[], child: string, n: number): string {
  const t = (traits||[]).join(' ').toLowerCase();
  let pool = GREETINGS.gentle;
  if (t.includes('silly')||t.includes('playful')) pool = GREETINGS.silly;
  else if (t.includes('brave')||t.includes('bold')) pool = GREETINGS.brave;
  else if (t.includes('curious')||t.includes('wise')) pool = GREETINGS.curious;
  return pool[n % pool.length].replace(/{c}/g, child);
}

/* ── Vibes ── */
const VIBES = [
  { key:'warm-funny',  emoji:'\u{1F602}', label:'Funny & warm' },
  { key:'calm-cosy',   emoji:'\u{1F319}', label:'Cosy & calm' },
  { key:'exciting',    emoji:'\u26A1',     label:'Exciting' },
  { key:'heartfelt',   emoji:'\u{1F49B}', label:'Heartfelt' },
  { key:'silly',       emoji:'\u{1F92A}', label:'Totally silly' },
  { key:'mysterious',  emoji:'\u{1F50D}', label:'Mystery' },
];
const VIBE_BRIEF: Record<string,string> = {
  'warm-funny':'about to go on a warm and funny adventure full of laughs',
  'calm-cosy':'about to discover something magical and cosy',
  'exciting':'about to go on a completely made-up adventure',
  'heartfelt':'on a journey that fills the heart',
  'silly':'on a silly quest with friends',
  'mysterious':'about to discover something magical and mysterious',
};

const LESSONS = [
  { label:'Bravery',     emoji:'\u2694\uFE0F', value:'bravery and facing fears \u2014 shown through a moment where the hero walks toward the scary thing and discovers it only looked frightening from far away' },
  { label:'Kindness',    emoji:'\u{1F49B}',    value:'kindness to others \u2014 shown through one small act of noticing someone who needed to be seen' },
  { label:'Confidence',  emoji:'\u{1F4AA}',    value:'building confidence \u2014 shown through a moment where the hero discovers something wonderful they could do all along' },
  { label:'Friendship',  emoji:'\u{1F46B}',    value:'being a good friend \u2014 shown through listening carefully and showing up when it matters' },
  { label:'Big feelings', emoji:'\u{1F300}',    value:"managing big feelings \u2014 shown through a moment where the hero's feeling becomes smaller when they name it or share it" },
];
const STYLES = [
  { key:'standard', label:'Standard' },{ key:'rhyming', label:'Rhyming' },
  { key:'adventure', label:'Choose-your-adventure' },{ key:'mystery', label:'Mystery' },
];

/* ── Cast item ── */
interface CastItem { id:string; type:string; name:string; note:string; emoji:string; isHero:boolean; source:'profile'|'creature'|'new' }
function charToCast(c: Character, hero=false): CastItem {
  const notes = [c.weirdDetail, c.personalityTags?.join(', ')].filter(Boolean).join('. ');
  return { id:c.id, type:c.type||'friend', name:c.name, note:notes, emoji:c.emoji||'\u{1F9D2}', isHero:hero, source:'profile' };
}
function creatureToCast(cr: HatchedCreature): CastItem {
  return { id:cr.id, type:'friend', name:cr.name, note:`a ${cr.creatureType} \u2014 ${cr.personalityTraits?.join(', ')||'magical companion'}`, emoji:cr.creatureEmoji||'\u{1F31F}', isHero:false, source:'creature' };
}

/* ══════════════════════════════════════════════════════════════════════
   CSS
   ══════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--cream:#F4EFE8;--dim:rgba(244,239,232,.45);--border:rgba(255,255,255,.08);--surface:rgba(255,255,255,.04);--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.rs{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}

@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes twk2{0%,100%{opacity:.2}60%{opacity:.04}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes bubblePop{0%{opacity:0;transform:scale(.92) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}

.rs-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.rs-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.rs-sky{position:fixed;top:0;left:0;right:0;height:240px;background:linear-gradient(180deg,#050916,#080C18);z-index:0;pointer-events:none}

/* nav */
.rs-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:52px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.rs-back{background:none;border:none;color:rgba(244,239,232,.35);font-size:13px;cursor:pointer;font-family:var(--sans);font-weight:600;transition:color .15s}
.rs-back:hover{color:var(--cream)}
.rs-night-badge{background:rgba(20,26,50,.9);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:5px 14px;font-size:10px;color:var(--amber);display:flex;align-items:center;gap:5px;font-family:var(--mono);font-weight:600}

/* inner */
.rs-inner{max-width:540px;margin:0 auto;padding:16px 6% 150px;position:relative;z-index:5}

/* creature + bubble */
.rs-creature{display:flex;flex-direction:column;align-items:center;margin-bottom:4px;animation:fadeIn .4s ease both}
.rs-creature-emoji{font-size:56px;animation:float 4s ease-in-out infinite}
.rs-creature-name{font-size:10px;font-weight:700;color:var(--amber2);letter-spacing:.06em;text-transform:uppercase;font-family:var(--mono);margin-top:2px}
.rs-bubble{position:relative;background:rgba(245,184,76,.05);border:1px solid rgba(245,184,76,.15);border-radius:16px;padding:14px 18px;margin:10px 0 16px;text-align:center;animation:bubblePop .35s ease both .15s;opacity:0}
.rs-bubble::after{content:'';position:absolute;top:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:7px solid rgba(245,184,76,.15)}
.rs-bubble-text{font-family:var(--serif);font-size:14px;font-style:italic;color:rgba(244,239,232,.75);line-height:1.55}

/* diary box */
.rs-diary{margin-bottom:16px}
.rs-diary-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);margin-bottom:6px}
.rs-textarea{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid var(--border);background:var(--surface);color:var(--cream);font-size:14px;font-family:var(--sans);outline:none;resize:none;min-height:80px;line-height:1.65;transition:border-color .2s}
.rs-textarea:focus{border-color:rgba(245,184,76,.35)}
.rs-textarea::placeholder{color:rgba(244,239,232,.18);font-style:italic}

/* mic row */
.rs-mic-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:18px}
.rs-mic{width:52px;height:52px;border-radius:50%;border:2px solid rgba(245,184,76,.25);background:rgba(245,184,76,.06);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;transition:all .2s}
.rs-mic:hover{border-color:rgba(245,184,76,.45);transform:scale(1.05)}
.rs-mic.rec{border-color:rgba(220,60,60,.5);background:rgba(220,60,60,.08);animation:micPulse 1s ease-in-out infinite}
.rs-mic-hint{font-size:11px;color:var(--dim);font-weight:500}

/* phase dots */
.rs-dots{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:14px}
.rs-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.1);transition:all .25s}
.rs-dot.active{background:var(--amber);transform:scale(1.4)}
.rs-dot.done{background:var(--teal)}

/* panel (rotating bottom) */
.rs-panel{animation:fadeIn .25s ease both}

/* question chips */
.rs-qchip{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px 16px;cursor:pointer;transition:all .2s;margin-bottom:6px}
.rs-qchip:hover{border-color:rgba(245,184,76,.25);background:rgba(245,184,76,.03)}
.rs-qchip:active{transform:scale(.98)}
.rs-qchip-from{font-size:9px;color:var(--amber);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase;margin-bottom:3px;font-weight:700}
.rs-qchip-q{font-size:13px;color:rgba(244,239,232,.65);line-height:1.5;font-style:italic}
.rs-qs-refresh{font-size:11px;color:rgba(245,184,76,.45);background:none;border:none;cursor:pointer;font-family:var(--sans);font-weight:600;transition:color .15s;margin-bottom:10px;display:block}
.rs-qs-refresh:hover{color:var(--amber2)}

/* vibe grid */
.rs-vibe-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.rs-vibe{padding:20px 12px;border-radius:16px;border:2px solid var(--border);background:var(--surface);text-align:center;cursor:pointer;transition:all .2s}
.rs-vibe:hover{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.06)}
.rs-vibe.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.08)}
.rs-vibe-emoji{font-size:26px;margin-bottom:4px}
.rs-vibe-label{font-size:12px;font-weight:700}
.rs-vibe.on .rs-vibe-label{color:var(--amber2)}

/* cast grid */
.rs-cast-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;margin-bottom:12px}
.rs-cast-card{padding:12px 6px;border-radius:14px;border:2px solid var(--border);background:var(--surface);text-align:center;cursor:pointer;transition:all .2s;position:relative}
.rs-cast-card:hover{border-color:rgba(255,255,255,.15)}
.rs-cast-card.on{border-color:rgba(29,158,117,.4);background:rgba(29,158,117,.06)}
.rs-cast-card .cc-emoji{font-size:24px;margin-bottom:2px}
.rs-cast-card .cc-name{font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rs-cast-card .cc-type{font-size:8px;color:var(--dim);margin-top:1px}
.rs-cast-card .cc-check{position:absolute;top:4px;right:4px;width:16px;height:16px;border-radius:50%;background:var(--teal);color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:700}

/* customize pills */
.rs-section{margin-bottom:16px}
.rs-sec-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);margin-bottom:8px}
.rs-pill-row{display:flex;gap:8px;flex-wrap:wrap}
.rs-pill{padding:10px 16px;border-radius:50px;border:1.5px solid var(--border);background:var(--surface);color:rgba(244,239,232,.5);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
.rs-pill:hover{border-color:rgba(255,255,255,.15)}
.rs-pill.on{border-color:rgba(29,158,117,.4);background:rgba(29,158,117,.08);color:#5DCAA5}
.rs-pill.amber{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.08);color:var(--amber2)}

/* CTA */
.rs-cta-wrap{position:fixed;bottom:0;left:0;right:0;padding:10px 6% calc(env(safe-area-inset-bottom,8px) + 14px);background:linear-gradient(0deg,rgba(8,12,24,.98) 60%,transparent);z-index:15;display:flex;flex-direction:column;align-items:center;gap:6px}
.rs-cta-row{display:flex;gap:8px;width:100%;max-width:540px}
.rs-cta{flex:1;padding:15px;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .2s}
.rs-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}
.rs-cta:disabled{opacity:.3;cursor:not-allowed;transform:none;filter:none}
.rs-cta.primary{background:linear-gradient(135deg,#E8972A,#CC7818);color:#120800;box-shadow:0 4px 20px rgba(232,151,42,.25)}
.rs-cta.secondary{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);color:var(--dim)}
.rs-cta.secondary:hover{border-color:rgba(255,255,255,.2);color:var(--cream)}
.rs-cta-skip{font-size:11px;color:rgba(245,184,76,.4);background:none;border:none;cursor:pointer;font-family:var(--sans);font-weight:600;transition:color .15s}
.rs-cta-skip:hover{color:var(--amber2)}
`;

const STARS = Array.from({length:20},(_,i)=>({ id:i, x:Math.random()*100, y:Math.random()*26, size:Math.random()<.4?3:2, d:(2.5+Math.random()*2.5).toFixed(1)+'s', dl:(Math.random()*3).toFixed(1)+'s', t:Math.random()<.5?1:2 }));

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

interface Props { onGenerate: (choices: BuilderChoices) => void }

export default function RitualStarter({ onGenerate }: Props) {
  const { user, setView, selectedCharacters, setSelectedCharacter, companionCreature } = useApp();
  const primary = selectedCharacters[0] ?? null;
  const childName = primary?.name ?? 'friend';

  // ── Data loading ──
  const [creature, setCreature]     = useState<HatchedCreature|null>(companionCreature);
  const [savedChars, setSavedChars] = useState<Character[]>([]);
  const [savedCreatures, setSavedCreatures] = useState<HatchedCreature[]>([]);
  const [nightNum, setNightNum]     = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    if (primary) getNightCards(user.id).then(cards => setNightNum(calculateGlow(cards, primary.id)+1));
    if (!creature) getAllHatchedCreatures(user.id).then(cs => { if (cs.length) setCreature(cs[0]); });
    getCharacters(user.id).then(setSavedChars);
    getAllHatchedCreatures(user.id).then(setSavedCreatures);
  }, [user?.id, primary]); // eslint-disable-line

  // ── Child profile for reading level ──
  const childAge = (() => { try { const s = localStorage.getItem(`sleepseed_child_profile_${user?.id}`); return s ? JSON.parse(s).ageGroup || 'age5' : 'age5'; } catch { return 'age5'; } })();

  // ── Creature data ──
  const cName = creature?.name ?? 'Moonbeam';
  const cEmoji = creature?.creatureEmoji ?? '\u{1F319}';
  const cTraits = creature?.personalityTraits ?? [];
  const greeting = pickGreeting(cTraits, childName, nightNum);
  const qPool = pickQPool(cTraits);

  // ── State ──
  const [phase, setPhase] = useState(1); // 1=questions, 2=characters, 3=vibe, 4=customize
  const [seed, setSeed]   = useState('');
  const [vibe, setVibe]   = useState('');
  const [length, setLength] = useState('standard');
  const [style, setStyle] = useState('standard');
  const [level, setLevel] = useState(childAge);
  const [lessons, setLessons] = useState<string[]>([]);
  const [cast, setCast]   = useState<CastItem[]>(() => primary ? [charToCast(primary, true)] : []);
  const [qOff, setQOff]   = useState(0);
  const [listening, setListening] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const srRef = useRef<any>(null);

  // auto-grow
  const grow = useCallback(() => { const t = taRef.current; if (!t) return; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }, []);
  useEffect(() => { grow(); }, [seed, grow]);

  // voice
  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { srRef.current?.stop(); setListening(false); return; }
    const sr = new SR(); sr.continuous = true; sr.interimResults = false; sr.lang = 'en-US';
    sr.onresult = (e: any) => { const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' '); setSeed(p => p.trim() ? p.trim() + ' ' + t : t); };
    sr.onerror = () => setListening(false); sr.onend = () => setListening(false);
    sr.start(); srRef.current = sr; setListening(true);
  }

  // questions
  const threeQs = [0,1,2].map(i => qPool[(qOff+i) % qPool.length]);
  function tapQ(q: string) { setSeed(p => { const c = p.trim(); return c ? c + '\n' + childName + ' said: ' : childName + ' said: '; }); setTimeout(() => taRef.current?.focus(), 50); }

  // cast helpers
  const isIn = (id: string) => cast.some(c => c.id === id);
  const toggleCast = (item: CastItem) => {
    if (isIn(item.id)) setCast(c => c.filter(x => x.id !== item.id));
    else if (cast.length < 5) setCast(c => [...c, { ...item, isHero: c.length === 0 }]);
  };
  const toggleLesson = (v: string) => setLessons(ls => ls.includes(v) ? ls.filter(x => x !== v) : [...ls, v]);

  // generate
  function handleGenerate() {
    const hero = cast.find(c => c.isHero);
    const heroName = hero?.name || primary?.name || childName;
    const heroGender = primary?.pronouns === 'she/her' ? 'girl' : primary?.pronouns === 'he/him' ? 'boy' : '';
    const choices: BuilderChoices = {
      path: 'ritual', heroName, heroGender,
      vibe: vibe || 'warm-funny', level, length,
      brief: seed.trim() || VIBE_BRIEF[vibe] || 'about to go on an adventure',
      chars: cast.filter(c => !c.isHero).map(c => ({ type:c.type, name:c.name, note:c.note })),
      lessons, occasion: '', occasionCustom: '', style, pace: 'normal',
    };
    if (primary) setSelectedCharacter(primary);
    onGenerate(choices);
  }

  // navigation
  const canNext = phase === 3 ? !!vibe : true;
  const nextLabel = phase === 4 ? "Create tonight's story" : 'Next';

  function handleNext() {
    if (phase < 4) setPhase(phase + 1);
    else handleGenerate();
  }

  // all available chars/creatures for phase 2
  const availableChars = [
    ...savedChars.filter(c => c.id !== primary?.id).map(c => charToCast(c)),
    ...savedCreatures.map(creatureToCast),
  ];

  return (
    <div className="rs">
      <style>{CSS}</style>
      <div className="rs-sky"/>
      {STARS.map(s => <div key={s.id} className={s.t===1?'rs-star':'rs-star2'} style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>)}

      <nav className="rs-nav">
        <button className="rs-back" onClick={() => setView('dashboard')}>{'\u2190'} home</button>
        {nightNum > 0 && <div className="rs-night-badge">night {nightNum} {'\u00B7'} {childName}</div>}
      </nav>

      <div className="rs-inner">

        {/* Creature + bubble (fades after phase 1) */}
        {phase === 1 && (
          <div style={{transition:'opacity .3s'}}>
            <div className="rs-creature">
              <div className="rs-creature-emoji">{cEmoji}</div>
              <div className="rs-creature-name">{cName}</div>
            </div>
            <div className="rs-bubble">
              <div className="rs-bubble-text">{greeting}</div>
            </div>
          </div>
        )}

        {/* Diary box — ALWAYS visible */}
        <div className="rs-diary">
          {phase > 1 && <div className="rs-diary-label">{cName}'s notes</div>}
          <textarea ref={taRef} className="rs-textarea" value={seed} onChange={e => setSeed(e.target.value)}
            placeholder={`Type what ${childName} says... or tap the mic`} />
        </div>

        {/* Mic */}
        <div className="rs-mic-row">
          <button className={`rs-mic${listening?' rec':''}`} onClick={toggleVoice}>
            {listening ? '\u{1F534}' : '\u{1F399}\uFE0F'}
          </button>
          <div className="rs-mic-hint">{listening ? 'Listening...' : `Let ${childName} talk to ${cName}`}</div>
        </div>

        {/* Phase dots */}
        <div className="rs-dots">
          {[1,2,3,4].map(p => <div key={p} className={`rs-dot${p===phase?' active':p<phase?' done':''}`}/>)}
        </div>

        {/* ═══ PHASE 1: Questions ═══ */}
        {phase === 1 && (
          <div className="rs-panel" key="p1">
            <button className="rs-qs-refresh" onClick={() => setQOff(p => (p+3) % qPool.length)}>
              {cName} asks... (more questions {'\u2192'})
            </button>
            {threeQs.map((q,i) => (
              <div key={`${qOff}-${i}`} className="rs-qchip" onClick={() => tapQ(q)}>
                <div className="rs-qchip-from">{cName} asks</div>
                <div className="rs-qchip-q">"{q}"</div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PHASE 2: Characters ═══ */}
        {phase === 2 && (
          <div className="rs-panel" key="p2">
            <div className="rs-sec-label">Who's in tonight's story?</div>
            {availableChars.length > 0 && (
              <div className="rs-cast-grid">
                {availableChars.map(item => (
                  <div key={item.id} className={`rs-cast-card${isIn(item.id)?' on':''}`} onClick={() => toggleCast(item)}>
                    {isIn(item.id) && <div className="cc-check">{'\u2713'}</div>}
                    <div className="cc-emoji">{item.emoji}</div>
                    <div className="cc-name">{item.name}</div>
                    <div className="cc-type">{item.source==='creature'?'Creature':item.type}</div>
                  </div>
                ))}
              </div>
            )}
            {availableChars.length === 0 && (
              <div style={{fontSize:12,color:'var(--dim)',textAlign:'center',padding:'16px 0'}}>
                No characters yet — you can add them in your profile
              </div>
            )}
          </div>
        )}

        {/* ═══ PHASE 3: Vibe ═══ */}
        {phase === 3 && (
          <div className="rs-panel" key="p3">
            <div className="rs-sec-label">How should tonight's story feel?</div>
            <div className="rs-vibe-grid">
              {VIBES.map(v => (
                <div key={v.key} className={`rs-vibe${vibe===v.key?' on':''}`} onClick={() => setVibe(v.key)}>
                  <div className="rs-vibe-emoji">{v.emoji}</div>
                  <div className="rs-vibe-label">{v.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PHASE 4: Customize ═══ */}
        {phase === 4 && (
          <div className="rs-panel" key="p4">
            <div className="rs-sec-label">Customize (all optional)</div>
            <div className="rs-section">
              <div className="rs-sec-label">Story length</div>
              <div className="rs-pill-row">
                {[{k:'short',l:'Short (~3 min)'},{k:'standard',l:'Standard (~5 min)'},{k:'long',l:'Long (~8 min)'}].map(x => (
                  <button key={x.k} className={`rs-pill${length===x.k?' amber':''}`} onClick={() => setLength(x.k)}>{x.l}</button>
                ))}
              </div>
            </div>
            <div className="rs-section">
              <div className="rs-sec-label">Sneak in a lesson</div>
              <div className="rs-pill-row">
                {LESSONS.map(l => (
                  <button key={l.label} className={`rs-pill${lessons.includes(l.value)?' on':''}`} onClick={() => toggleLesson(l.value)}>{l.emoji} {l.label}</button>
                ))}
              </div>
            </div>
            <div className="rs-section">
              <div className="rs-sec-label">Story style</div>
              <div className="rs-pill-row">
                {STYLES.map(s => (
                  <button key={s.key} className={`rs-pill${style===s.key?' on':''}`} onClick={() => setStyle(s.key)}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className="rs-section">
              <div className="rs-sec-label">Reading level</div>
              <div className="rs-pill-row">
                {['age3','age5','age7','age10'].map(a => (
                  <button key={a} className={`rs-pill${level===a?' amber':''}`} onClick={() => setLevel(a)}>
                    {a==='age3'?'3\u20134':a==='age5'?'5\u20136':a==='age7'?'7\u20138':'9\u201310'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CTA */}
      <div className="rs-cta-wrap">
        <div className="rs-cta-row">
          {phase > 1 && (
            <button className="rs-cta secondary" onClick={() => setPhase(phase-1)}>{'\u2190'} Back</button>
          )}
          <button className="rs-cta primary" disabled={!canNext} onClick={handleNext}>
            {nextLabel}
          </button>
        </div>
        {phase === 3 && (
          <button className="rs-cta-skip" onClick={handleGenerate}>Skip customizing {'\u2014'} create now</button>
        )}
      </div>
    </div>
  );
}
