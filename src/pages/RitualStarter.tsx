import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../AppContext';
import { getNightCards } from '../lib/storage';
import type { SavedNightCard } from '../lib/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: Date) { return d.toISOString().split('T')[0]; }

function cardBelongsTo(card: SavedNightCard, charId: string) {
  return card.characterIds && card.characterIds.includes(charId);
}

function calculateGlow(cards: SavedNightCard[], charId: string): number {
  const dates = new Set(cards.filter(c => cardBelongsTo(c, charId)).map(c => c.date.split('T')[0]));
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    if (dates.has(dateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

// ── question bank (20+ questions) ────────────────────────────────────────────

const QUESTION_BANK = [
  "What was the best part of today?",
  "Was anything hard or scary?",
  "Did anything make them laugh?",
  "What are they thinking about right now?",
  "If today was a story, what would it be called?",
  "What's one thing they wish had gone differently?",
  "Did they learn anything surprising?",
  "What made them feel proud of themselves?",
  "Who did they spend the most time with?",
  "What was the most interesting thing they saw?",
  "Did anything feel unfair today?",
  "What are they looking forward to tomorrow?",
  "Did they help anyone today?",
  "What question do they have that nobody's answered yet?",
  "Was there a moment they felt really happy?",
  "Did anything surprise them?",
  "What's one thing they want to remember about today?",
  "If today had a colour, what would it be?",
  "What was the quietest moment of their day?",
  "If they could tell one person about today, who would it be?",
];

// ── rotating micro-statements ─────────────────────────────────────────────────

const MICRO_STATEMENTS = [
  // Default — V1 + V5 combined (appears most often)
  {
    main: "Right now, as the day winds down, {name} has things on their mind they haven't said yet.",
    sub: "They might say something tonight you'd forget by morning.",
  },
  // V3 — for tired nights
  {
    main: "The day is almost over. This is its best part.",
    sub: "A few minutes of just you and {name}, and a story that belongs to them.",
  },
  // V4 — science/authority
  {
    main: "Before sleep, children process emotion more openly than at any other time.",
    sub: "Stories help them make sense of what they felt today.",
  },
  // V2 — the archive
  {
    main: "What you write here becomes part of who {name} was at this exact age.",
    sub: "A version of them you'll never get back.",
  },
  // V5 alone — direct
  {
    main: "They might say something tonight that you'd otherwise forget by morning.",
    sub: "Write it down. You'll be glad you did.",
  },
];

// weight first statement 3× so it appears most often
const WEIGHTED_STATEMENTS = [
  MICRO_STATEMENTS[0], MICRO_STATEMENTS[0], MICRO_STATEMENTS[0],
  ...MICRO_STATEMENTS.slice(1),
];

function getMicroStatement(nightNum: number, childName: string) {
  const s = WEIGHTED_STATEMENTS[nightNum % WEIGHTED_STATEMENTS.length];
  const replace = (t: string) => t.replace(/{name}/g, childName || 'them');
  return { main: replace(s.main), sub: replace(s.sub) };
}

// ── intro card content ────────────────────────────────────────────────────────

const INTRO_STATEMENT = {
  title: "The best 20 minutes of the day.",
  body: "As the day winds down, {name} has things on their mind they haven't said yet — the small things, the big feelings, the questions they haven't found words for.\n\nThis is the moment they come out. And tonight, whatever they say becomes a story that belongs to them forever.",
  cta: "Begin the ritual ✦",
};

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --teal:#1D9E75;--teal2:#5DCAA5;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.rs{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;position:relative}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes twk2{0%,100%{opacity:.2}60%{opacity:.04}}
@keyframes puls{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes rec{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(.88);opacity:0}70%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
@keyframes intro-in{0%{opacity:0;transform:scale(.96) translateY(12px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes intro-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.96)}}
@keyframes ms-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}

.rs-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.rs-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.rs-sky{position:fixed;top:0;left:0;right:0;height:260px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}
.rs-moon-pos{position:fixed;top:68px;right:28px;z-index:2;pointer-events:none}
.rs-moon-glow{position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(245,184,76,.07);top:-9px;left:-9px}
.rs-moon{width:30px;height:30px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden}
.rs-moon-sh{position:absolute;width:29px;height:29px;border-radius:50%;background:#050916;top:-5px;left:-7px}

/* ── INTRO OVERLAY (Option D) ── */
.rs-intro-overlay{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);background:rgba(5,9,26,.75);transition:opacity .35s ease}
.rs-intro-overlay.leaving{opacity:0;pointer-events:none}
.rs-intro-card{background:rgba(12,16,32,.98);border:1px solid rgba(232,151,42,.2);border-radius:22px;padding:28px 26px;max-width:340px;width:100%;text-align:center;animation:intro-in .4s cubic-bezier(.34,1.26,.64,1) forwards}
.rs-intro-moon{width:44px;height:44px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;margin:0 auto 16px}
.rs-intro-moon-sh{position:absolute;width:42px;height:42px;border-radius:50%;background:#050916;top:-7px;left:-9px}
.rs-intro-title{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--cream);margin-bottom:12px;line-height:1.35}
.rs-intro-body{font-size:13px;color:var(--dim);line-height:1.85;margin-bottom:20px;white-space:pre-line}
.rs-intro-name{color:var(--amber2);font-style:italic}
.rs-intro-cta{background:linear-gradient(135deg,#E8972A,#CC7818);border:none;border-radius:50px;padding:13px 28px;font-size:13.5px;font-weight:600;color:#120800;cursor:pointer;font-family:var(--sans);letter-spacing:.01em;transition:filter .2s,transform .15s;width:100%}
.rs-intro-cta:hover{filter:brightness(1.08);transform:translateY(-1px)}
.rs-intro-skip{font-size:10.5px;color:rgba(255,255,255,.2);margin-top:10px;cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s;display:block;width:100%;text-align:center}
.rs-intro-skip:hover{color:rgba(255,255,255,.4)}

/* ── NAV ── */
.rs-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.rs-back{background:transparent;border:none;color:rgba(244,239,232,.35);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s;padding:0}
.rs-back:hover{color:rgba(244,239,232,.7)}
.rs-nav-right{display:flex;align-items:center;gap:8px}
.rs-night-badge{background:rgba(20,26,50,.9);border:.5px solid rgba(255,255,255,.07);border-radius:20px;padding:4px 12px;font-size:9.5px;color:var(--amber);display:flex;align-items:center;gap:5px;font-family:var(--mono)}
.rs-nb-dot{width:4px;height:4px;border-radius:50%;background:var(--amber);animation:puls 2s ease-in-out infinite}

/* ── CONTENT ── */
.rs-inner{max-width:640px;margin:0 auto;padding:0 6% 56px;position:relative;z-index:5}

/* ── HERO ── */
.rs-hero{padding:22px 0 12px;text-align:center}
.rs-hero-lbl{font-size:8.5px;letter-spacing:.08em;color:var(--amber);font-weight:600;text-transform:uppercase;margin-bottom:7px;font-family:var(--mono)}
.rs-hero-title{font-family:var(--serif);font-size:clamp(21px,3.8vw,28px);color:var(--cream);line-height:1.35;margin-bottom:4px;font-weight:700}
.rs-n1{color:var(--amber2);font-style:italic;text-shadow:0 0 14px rgba(245,184,76,.3)}
.rs-n2{color:var(--teal2);font-style:italic;text-shadow:0 0 14px rgba(93,202,165,.28)}

/* ── MICRO-STATEMENT ── */
.rs-micro{margin:10px auto 14px;max-width:400px;text-align:center;padding:0 4px;animation:ms-in .4s ease-out}
.rs-micro-main{font-family:var(--serif);font-size:13px;color:rgba(244,239,232,.65);line-height:1.6;font-style:italic;margin-bottom:3px}
.rs-micro-sub{font-size:11.5px;color:rgba(244,239,232,.32);line-height:1.6}
.rs-nc-hint{display:inline-flex;align-items:center;gap:4px;background:rgba(232,151,42,.06);border:.5px solid rgba(232,151,42,.18);border-radius:20px;padding:3px 11px;font-size:9px;color:rgba(232,151,42,.7);margin-top:9px;font-family:var(--mono)}

/* ── CAPTURE CARD ── */
.rs-cap-wrap{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:12px}
.rs-cap-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 0}
.rs-cap-lbl{font-size:8.5px;color:var(--muted);letter-spacing:.05em;font-family:var(--mono)}
.rs-voice-btn{display:flex;align-items:center;gap:5px;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:500;cursor:pointer;transition:all .2s;border:.5px solid rgba(232,151,42,.22);background:rgba(18,22,44,.9);color:var(--dim);font-family:var(--sans)}
.rs-voice-btn.listening{border-color:var(--amber);background:rgba(232,151,42,.12);color:var(--amber2);animation:puls .8s ease-in-out infinite}
.rs-voice-btn:hover:not(.listening){border-color:rgba(232,151,42,.4);color:var(--amber2)}
.rs-voice-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);flex-shrink:0}
.rs-voice-dot.rec{animation:rec .6s ease-in-out infinite}
.rs-textarea{width:100%;background:transparent;border:none;outline:none;padding:9px 16px 10px;color:var(--cream);font-size:13.5px;font-family:var(--sans);resize:none;line-height:1.72;min-height:68px;display:block;overflow-y:hidden}
.rs-textarea::placeholder{color:rgba(58,66,112,.6);font-style:italic}

/* ── SEED QUALITY ── */
.rs-seed-quality{display:flex;align-items:center;justify-content:space-between;padding:5px 16px 8px;border-top:.5px solid rgba(255,255,255,.03)}
.rs-sq-bar{flex:1;height:2.5px;background:rgba(255,255,255,.05);border-radius:2px;margin-right:9px;overflow:hidden}
.rs-sq-fill{height:2.5px;border-radius:2px;transition:width .4s ease,background .4s ease}
.rs-sq-lbl{font-size:8.5px;font-family:var(--mono);transition:color .3s;white-space:nowrap;min-width:90px;text-align:right}

/* ── MOOD ROW ── */
.rs-mood-row{display:flex;align-items:center;gap:8px;padding:8px 16px 10px;border-top:.5px solid rgba(255,255,255,.04);flex-wrap:wrap}
.rs-mood-lbl{font-size:9.5px;color:var(--muted);flex-shrink:0}
.rs-moods{display:flex;gap:5px;flex-wrap:wrap}
.rs-mood-pill{border-radius:20px;padding:4px 10px;font-size:10.5px;cursor:pointer;transition:all .2s;border:.5px solid rgba(255,255,255,.06);background:rgba(8,12,24,.9);color:#5A6280;display:flex;align-items:center;gap:4px;font-family:var(--sans)}
.rs-mood-pill.on{border-color:var(--amber);background:rgba(232,151,42,.1);color:var(--amber2)}
.rs-mood-pill:hover:not(.on){border-color:rgba(232,151,42,.22);color:var(--dim)}
.rs-mood-icon{font-size:11px;line-height:1}
.rs-mood-word{font-size:9.5px;font-weight:500}

/* ── QUESTION SECTION ── */
.rs-qs-section{margin-bottom:12px}
.rs-qs-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.rs-qs-label{font-size:8.5px;letter-spacing:.07em;color:rgba(255,255,255,.18);font-weight:600;text-transform:uppercase;font-family:var(--mono)}
.rs-qs-refresh{font-size:10px;color:var(--amber);background:none;border:none;cursor:pointer;font-family:var(--sans);opacity:.7;transition:opacity .15s}
.rs-qs-refresh:hover{opacity:1}
.rs-qlist{display:flex;flex-direction:column;gap:6px}
.rs-qchip{background:rgba(8,12,24,.98);border:.5px solid rgba(255,255,255,.06);border-radius:12px;padding:10px 14px;cursor:pointer;transition:border-color .18s,background .18s;animation:pop .22s ease-out}
.rs-qchip:hover{border-color:rgba(232,151,42,.32);background:rgba(12,16,34,.98)}
.rs-qchip:active{transform:scale(.98)}
.rs-qchip-ask{font-size:8px;color:var(--amber);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;opacity:.8}
.rs-qchip-q{font-size:12px;color:var(--dim);line-height:1.5;font-style:italic}
.rs-qchip-hint{font-size:9px;color:rgba(255,255,255,.14);margin-top:3px}

/* ── EXPAND OPTIONS ── */
.rs-expand-btn{width:100%;text-align:left;background:rgba(255,255,255,.016);border:.5px solid rgba(255,255,255,.05);border-radius:10px;padding:9px 14px;font-size:11px;color:rgba(255,255,255,.28);cursor:pointer;font-family:var(--sans);display:flex;align-items:center;justify-content:space-between;transition:all .18s;margin-bottom:10px}
.rs-expand-btn:hover{background:rgba(255,255,255,.03);color:rgba(255,255,255,.45)}
.rs-expand-inner{background:rgba(8,12,24,.98);border:.5px solid rgba(255,255,255,.05);border-radius:12px;padding:12px 14px;margin-bottom:10px;animation:fadein .2s ease-out}
.rs-opt-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:.5px solid rgba(255,255,255,.04)}
.rs-opt-row:last-child{border-bottom:none}
.rs-opt-lbl{font-size:11px;color:rgba(255,255,255,.38)}
.rs-opt-pills{display:flex;gap:5px;flex-wrap:wrap}
.rs-opt-pill{font-size:9.5px;padding:3px 9px;border-radius:20px;border:.5px solid rgba(255,255,255,.07);background:transparent;color:rgba(255,255,255,.28);cursor:pointer;transition:all .15s;font-family:var(--sans)}
.rs-opt-pill.on{border-color:var(--amber);background:rgba(232,151,42,.1);color:var(--amber2)}

/* ── CTA ── */
.rs-actions{padding-top:2px}
.rs-create-btn{width:100%;border:none;border-radius:14px;padding:15px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;justify-content:center;gap:7px;letter-spacing:.01em;transition:filter .2s,transform .15s,background .3s;margin-bottom:10px}
.rs-create-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.rs-create-btn:disabled{opacity:.4;cursor:default;transform:none}
.rs-create-btn.has-seed{background:linear-gradient(135deg,#E8972A,#CC7818);color:#120800}
.rs-create-btn.no-seed{background:rgba(232,151,42,.15);color:rgba(232,151,42,.8);border:1px solid rgba(232,151,42,.22)}
.rs-create-btn.multi{background:linear-gradient(135deg,#1D9E75,#158C62);color:#E1F5EE}
`;

// ── star positions ────────────────────────────────────────────────────────────

const STARS_RS = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 28,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
  t: Math.random() < .5 ? 1 : 2,
}));

const MOODS = [
  { icon: '🌙', word: 'cozy',   key: 'calm'      },
  { icon: '😂', word: 'silly',  key: 'silly'     },
  { icon: '🦁', word: 'brave',  key: 'exciting'  },
  { icon: '🥺', word: 'tender', key: 'heartfelt' },
  { icon: '😴', word: 'tired',  key: 'calm'      },
];

// ── component ─────────────────────────────────────────────────────────────────

const FIRST_VISIT_KEY = 'rs_intro_seen_v1';

export default function RitualStarter() {
  const {
    user, setView,
    selectedCharacters,
    ritualSeed, setRitualSeed,
    ritualMood, setRitualMood,
    setSelectedCharacter,
  } = useApp();

  const primary   = selectedCharacters[0] ?? null;
  const secondary = selectedCharacters[1] ?? null;
  const isMulti   = selectedCharacters.length > 1;

  const [seed, setSeed]       = useState(ritualSeed || '');
  const [mood, setMood]       = useState(ritualMood || '');
  const [listening, setListening] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [qOffset, setQOffset] = useState(0);
  const [nightNum, setNightNum] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);
  // opt state
  const [optLen, setOptLen]   = useState('regular');
  const [optStyle, setOptStyle] = useState('cozy');
  const [optEnd, setOptEnd]   = useState('hopeful');

  const taRef    = useRef<HTMLTextAreaElement>(null);
  const srRef    = useRef<any>(null);

  // load night count
  useEffect(() => {
    if (!user || !primary) return;
    getNightCards(user.id).then(cards => {
      const g = calculateGlow(cards, primary.id);
      setNightNum(g + 1); // next night = glow + 1
    });
    // show intro if never seen
    const seen = localStorage.getItem(FIRST_VISIT_KEY);
    if (!seen) setShowIntro(true);
  }, [user, primary]); // eslint-disable-line

  // auto-grow textarea
  const growTextarea = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }, []);

  useEffect(() => { growTextarea(); }, [seed, growTextarea]);

  // dismiss intro
  function dismissIntro(skip = false) {
    setIntroLeaving(true);
    localStorage.setItem(FIRST_VISIT_KEY, '1');
    setTimeout(() => setShowIntro(false), 350);
    if (!skip) {
      // brief focus into textarea after overlay dissolves
      setTimeout(() => taRef.current?.focus(), 450);
    }
  }

  // voice to text
  function toggleVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Safari.');
      return;
    }
    if (listening) {
      srRef.current?.stop();
      setListening(false);
      return;
    }
    const sr = new SpeechRecognition();
    sr.continuous = true;
    sr.interimResults = false;
    sr.lang = 'en-US';
    sr.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript).join(' ');
      setSeed(prev => {
        const joined = prev.trim() ? prev.trim() + ' ' + transcript : transcript;
        return joined;
      });
    };
    sr.onerror = () => setListening(false);
    sr.onend   = () => setListening(false);
    sr.start();
    srRef.current = sr;
    setListening(true);
  }

  // question chips — 3 at a time, rotating from bank
  function getThreeQs() {
    const name = primary?.name ?? 'them';
    return [0, 1, 2].map(i => {
      const raw = QUESTION_BANK[(qOffset + i) % QUESTION_BANK.length];
      // personalise with child's name where natural
      return raw.replace(/they/g, name).replace(/them/g, name);
    });
  }

  function addAnswer(q: string) {
    const cur = seed.trim();
    const append = `${primary?.name ?? ''} said: `;
    setSeed(cur ? cur + '\n' + append : append);
    setTimeout(() => taRef.current?.focus(), 50);
  }

  function rotateQs() {
    setQOffset(prev => (prev + 3) % QUESTION_BANK.length);
  }

  // seed quality
  const seedLen = seed.trim().length;
  const sqPct   = Math.min(100, Math.round((seedLen / 100) * 100));
  const sqBg    = seedLen === 0 ? '#2A3050' : seedLen < 25 ? '#3A4270' : seedLen < 80 ? '#E8972A' : '#1D9E75';
  const sqLbl   = seedLen === 0 ? 'add something from today' : seedLen < 25 ? 'keep going…' : seedLen < 80 ? 'good seed ✦' : 'rich seed ✦';
  const sqColor = seedLen === 0 ? '#2A3050' : seedLen < 25 ? '#5A6280' : seedLen < 80 ? '#E8972A' : '#5DCAA5';

  // micro-statement
  const ms = getMicroStatement(nightNum, primary?.name ?? 'them');

  // nav badge text
  const nightLabel = nightNum > 0
    ? `night ${nightNum} · ${primary?.name ?? ''} ✦`
    : primary?.name ? `${primary.name} · tonight` : 'tonight';

  // intro card body text
  const introParsed = INTRO_STATEMENT.body.replace(/{name}/g, `<em>${primary?.name ?? 'your child'}</em>`);

  // CTA label & style
  const ctaClass  = isMulti ? 'rs-create-btn multi' : seed.trim() ? 'rs-create-btn has-seed' : 'rs-create-btn no-seed';
  const ctaLabel  = seed.trim()
    ? 'Create tonight\u2019s story \u2736'
    : 'Surprise us tonight \u2736';

  function handleCreate() {
    setRitualSeed(seed);
    setRitualMood(mood);
    if (primary) setSelectedCharacter(primary);
    setView('story-builder');
  }

  return (
    <div className="rs">
      <style>{CSS}</style>
      <div className="rs-sky"/>
      {STARS_RS.map(s => (
        <div key={s.id} className={s.t === 1 ? 'rs-star' : 'rs-star2'}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any}/>
      ))}
      <div className="rs-moon-pos">
        <div className="rs-moon-glow"/>
        <div className="rs-moon"><div className="rs-moon-sh"/></div>
      </div>

      {/* ── INTRO OVERLAY (Option D — first visit only) ── */}
      {showIntro && (
        <div className={`rs-intro-overlay${introLeaving ? ' leaving' : ''}`}>
          <div className="rs-intro-card">
            <div className="rs-intro-moon"><div className="rs-intro-moon-sh"/></div>
            <div className="rs-intro-title">{INTRO_STATEMENT.title}</div>
            <div className="rs-intro-body"
              dangerouslySetInnerHTML={{ __html: introParsed }}/>
            <button className="rs-intro-cta" onClick={() => dismissIntro(false)}>
              {INTRO_STATEMENT.cta}
            </button>
            <button className="rs-intro-skip" onClick={() => dismissIntro(true)}>
              skip intro
            </button>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="rs-nav">
        <button className="rs-back" onClick={() => setView('dashboard')}>← home</button>
        <div className="rs-nav-right">
          {nightNum > 0 && (
            <div className="rs-night-badge">
              <div className="rs-nb-dot"/>
              {nightLabel}
            </div>
          )}
        </div>
      </nav>

      <div className="rs-inner">

        {/* ── HERO ── */}
        <div className="rs-hero">
          <div className="rs-hero-lbl">tonight's ritual</div>
          <div className="rs-hero-title">
            {selectedCharacters.length === 0 && "What happened in your child's world today?"}
            {selectedCharacters.length === 1 && <>What happened in{' '}<span className="rs-n1">{primary?.name}'s</span> world today?</>}
            {selectedCharacters.length === 2 && <>What happened in{' '}<span className="rs-n1">{primary?.name}</span>{' '}<span style={{ color: 'rgba(255,255,255,.3)', fontStyle: 'normal', fontSize: '.82em' }}>&</span>{' '}<span className="rs-n2">{secondary?.name}'s</span> world today?</>}
            {selectedCharacters.length > 2 && <>What happened in your children's world today?</>}
          </div>

          {/* ── MICRO-STATEMENT (Option B — persistent, rotating) ── */}
          <div className="rs-micro" key={nightNum}>
            <div className="rs-micro-main">{ms.main}</div>
            <div className="rs-micro-sub">{ms.sub}</div>
          </div>

          <div className="rs-nc-hint">✦ saved to tonight's Night Card forever</div>
        </div>

        {/* ── CAPTURE CARD ── */}
        <div className="rs-cap-wrap">
          <div className="rs-cap-header">
            <div className="rs-cap-lbl">in their own words…</div>
            <button
              className={`rs-voice-btn${listening ? ' listening' : ''}`}
              onClick={toggleVoice}>
              <div className={`rs-voice-dot${listening ? ' rec' : ''}`}/>
              {listening ? 'listening…' : 'tap to speak'}
            </button>
          </div>
          <textarea
            ref={taRef}
            className="rs-textarea"
            value={seed}
            onChange={e => setSeed(e.target.value)}
            placeholder={
              primary
                ? `She was nervous about her spelling test… or something funny happened at lunch… or she asked a big question…`
                : `Something happened today worth capturing…`
            }
          />
          {/* Seed quality indicator */}
          <div className="rs-seed-quality">
            <div className="rs-sq-bar">
              <div className="rs-sq-fill" style={{ width: `${sqPct}%`, background: sqBg }}/>
            </div>
            <div className="rs-sq-lbl" style={{ color: sqColor }}>{sqLbl}</div>
          </div>
          {/* Mood row with word labels */}
          <div className="rs-mood-row">
            <div className="rs-mood-lbl">tonight {isMulti ? "they're" : "they're"}</div>
            <div className="rs-moods">
              {MOODS.map(m => (
                <div key={m.key + m.word}
                  className={`rs-mood-pill${mood === m.key ? ' on' : ''}`}
                  onClick={() => setMood(mood === m.key ? '' : m.key)}>
                  <span className="rs-mood-icon">{m.icon}</span>
                  <span className="rs-mood-word">{m.word}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUESTION CHIPS ── */}
        <div className="rs-qs-section">
          <div className="rs-qs-header">
            <div className="rs-qs-label">ask {primary?.name ?? 'them'} one of these</div>
            <button className="rs-qs-refresh" onClick={rotateQs}>different questions →</button>
          </div>
          <div className="rs-qlist">
            {getThreeQs().map((q, i) => (
              <div key={`${qOffset}-${i}`} className="rs-qchip" onClick={() => addAnswer(q)}>
                <div className="rs-qchip-ask">Ask {primary?.name ?? 'them'}</div>
                <div className="rs-qchip-q">"{q}"</div>
                <div className="rs-qchip-hint">tap → adds their answer to your note</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── INLINE STORY OPTIONS ── */}
        <button className="rs-expand-btn" onClick={() => setExpandOpen(p => !p)}>
          <span>story options</span>
          <span style={{ fontSize: 13 }}>{expandOpen ? '−' : '+'}</span>
        </button>
        {expandOpen && (
          <div className="rs-expand-inner">
            {[
              { label: 'Length',  opts: ['short','regular','long'],             val: optLen,   set: setOptLen   },
              { label: 'Style',   opts: ['cozy','adventure','funny','magical'], val: optStyle, set: setOptStyle },
              { label: 'Ending',  opts: ['hopeful','funny','wonder'],           val: optEnd,   set: setOptEnd   },
            ].map(row => (
              <div key={row.label} className="rs-opt-row">
                <div className="rs-opt-lbl">{row.label}</div>
                <div className="rs-opt-pills">
                  {row.opts.map(o => (
                    <button key={o} className={`rs-opt-pill${row.val === o ? ' on' : ''}`}
                      onClick={() => row.set(o)}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="rs-actions">
          <button
            className={ctaClass}
            onClick={handleCreate}
            disabled={selectedCharacters.length === 0}>
            {ctaLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
