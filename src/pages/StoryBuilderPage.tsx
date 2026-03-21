import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import type { BuilderChoices } from '../lib/types';

// ── vibe → AI prompt mapping (matches existing SleepSeedCore storyBrief2 values) ──
const VIBE_TO_FEEL: Record<string, string> = {
  'warm-funny':  'warm and funny, with lots of laughs',
  'calm-cosy':   'calm and cosy, drifting toward sleep',
  'exciting':    'exciting and full of surprises',
  'heartfelt':   'heartfelt and emotionally true',
  'silly':       'completely silly from start to finish',
  'mysterious':  'mysterious with a satisfying ending',
};

// ── vibe → storyBrief1 fallback for free path with no text ──
const VIBE_TO_BRIEF: Record<string, string> = {
  'warm-funny':  'about to go on a warm and funny adventure full of laughs',
  'calm-cosy':   'about to discover something magical and cosy',
  'exciting':    'about to go on a completely made-up adventure',
  'heartfelt':   'on a journey that fills the heart',
  'silly':       'on a silly quest with friends',
  'mysterious':  'about to discover something magical and mysterious',
};

// ── lesson full values (match SleepSeedCore LESSONS_CHARACTER + LESSONS_EMOTIONAL) ──
const LESSON_OPTIONS = [
  { label: '⚔️ Bravery',      value: 'bravery and facing fears — shown through a moment where the hero walks toward the scary thing and discovers it only looked frightening from far away' },
  { label: '💛 Kindness',     value: 'kindness to others — shown through one small, specific act of noticing someone who needed to be seen, and choosing to see them' },
  { label: '💪 Confidence',   value: 'building confidence and self-belief — shown through a moment where the hero doubts themselves completely and then discovers something wonderful they could do all along' },
  { label: '🌀 Worries',      value: 'managing worries and anxiety — shown through a moment where the hero\'s big worried feeling becomes smaller when they name it, breathe through it, or share it with someone they trust' },
  { label: '👫 Friendship',   value: 'being a good friend — shown through listening carefully and showing up exactly when it matters, without being asked' },
  { label: '🔥 Perseverance', value: 'never giving up — shown through a moment of almost-quitting where something small and true gives the hero just enough to try once more' },
  { label: '🌟 Honesty',      value: 'honesty and trust — shown through a moment where telling the truth felt scary but turned out to be the bravest and kindest thing to do' },
  { label: '🤝 Sharing',      value: 'sharing and generosity — shown through a moment where giving something away turns out to fill the giver\'s heart more than keeping it ever could' },
  { label: '😤 Frustration',  value: 'handling frustration and big feelings — shown through a moment where everything goes wrong and the hero finds a way to pause, feel it, and keep going anyway' },
  { label: '🌈 Challenges',   value: 'navigating friendship challenges — shown through a moment of falling out, misunderstanding, or feeling left out, and finding a gentle way back to connection' },
];

const CHAR_OPTIONS = ['👫 Friend','👶 Sibling','🐾 Pet','🧸 Toy','🐉 Dragon','🦊 Fox','🐻 Bear','🦄 Unicorn'];

const OCCASION_OPTIONS = [
  { label: '🎂 Birthday',          value: 'birthday — this is the child\'s special day; weave in one magical gift, one moment of being truly seen and celebrated, and a sense that the whole world quietly knew it was their day' },
  { label: '🎒 First day of school',value: 'first day of school — the child is brave but their tummy feels like butterflies; the story should transform that fluttery feeling into excitement, and end with the world feeling a little more familiar and safe' },
  { label: '👶 New sibling',        value: 'new baby sibling — mixed feelings are real and valid; the story should acknowledge the bigness of change while revealing that love doesn\'t divide, it multiplies' },
  { label: '📦 Moving day',         value: 'moving to a new home — everything familiar has shifted; the story should gently show that home is not a place but the people and love you carry with you' },
  { label: '🌡️ Getting better',     value: 'recovering from being sick — the child has been through something hard; the story should feel like warm soup and a soft blanket — gentle, restorative, full of quiet gratitude for feeling better' },
];

// ── mood from ritual starter → default vibe ──
function moodToVibe(mood: string): string {
  const m: Record<string, string> = {
    '😊': 'warm-funny', '🥺': 'heartfelt', '😂': 'silly', '🦁': 'exciting', '😴': 'calm-cosy',
  };
  return m[mood] || 'warm-funny';
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--teal2:#5DCAA5;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.sb{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:80px}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.sb-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.sb-sky{position:fixed;top:0;left:0;right:0;height:260px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}
.sb-moon-pos{position:fixed;top:68px;right:28px;z-index:2;pointer-events:none}
.sb-moon-glow{position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(245,184,76,.07);top:-9px;left:-9px}
.sb-moon{width:30px;height:30px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden}
.sb-moon-sh{position:absolute;width:29px;height:29px;border-radius:50%;background:#050916;top:-5px;left:-7px}
.sb-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.sb-back{background:transparent;border:none;color:rgba(244,239,232,.35);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s;padding:0}
.sb-back:hover{color:rgba(244,239,232,.7)}
.sb-badge{background:rgba(20,26,50,.9);border:.5px solid rgba(255,255,255,.07);border-radius:20px;padding:4px 12px;font-size:9.5px;color:var(--amber);display:flex;align-items:center;gap:5px;font-family:var(--mono)}
.sb-dot{width:4px;height:4px;border-radius:50%;background:var(--amber);animation:twk 2s ease-in-out infinite}
.sb-inner{max-width:640px;margin:0 auto;padding:0 6% 24px;position:relative;z-index:5}

/* header explainer */
.sb-header{text-align:center;padding:20px 0 16px;border-bottom:.5px solid rgba(255,255,255,.05);margin-bottom:16px}
.sb-header-icon{font-size:24px;margin-bottom:8px;line-height:1}
.sb-header-title{font-family:var(--serif);font-size:clamp(18px,3.5vw,24px);color:var(--cream);font-weight:700;line-height:1.35;margin-bottom:6px}
.sb-header-title em{font-style:italic}
.sb-header-sub{font-size:11.5px;color:rgba(244,239,232,.35);line-height:1.7;max-width:440px;margin:0 auto}
.sb-header-sub strong{color:rgba(244,239,232,.55);font-weight:500}

/* seed card */
.sb-seed-card{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:13px;padding:12px 14px;margin-bottom:16px}
.sb-seed-lbl{font-size:8px;letter-spacing:.07em;color:var(--amber);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:4px}
.sb-seed-txt{font-size:12px;color:var(--dim);line-height:1.65;font-style:italic}
.sb-seed-edit{font-size:9.5px;color:#2A3050;margin-top:6px;cursor:pointer;text-align:right;transition:color .15s;background:none;border:none;font-family:var(--sans)}
.sb-seed-edit:hover{color:#5A6280}

/* unified story box */
.sb-story-box{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;margin-bottom:16px}
.sb-story-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 0}
.sb-story-lbl{font-size:8.5px;color:var(--muted);font-family:var(--mono);letter-spacing:.04em}
.sb-voice-btn{display:flex;align-items:center;gap:5px;border-radius:8px;padding:4px 9px;font-size:10.5px;color:var(--dim);background:rgba(18,22,44,.9);border:.5px solid rgba(232,151,42,.2);cursor:pointer;font-family:var(--sans);transition:all .2s}
.sb-voice-btn:hover{border-color:rgba(232,151,42,.4);color:var(--amber2)}
.sb-vdot{width:5px;height:5px;border-radius:50%;background:var(--amber);flex-shrink:0}
.sb-textarea{width:100%;background:transparent;border:none;outline:none;padding:8px 14px 6px;color:var(--cream);font-size:13px;font-family:var(--sans);resize:none;line-height:1.72;min-height:72px;display:block}
.sb-textarea::placeholder{color:rgba(58,66,112,.6);font-style:italic}
.sb-story-footer{padding:6px 14px 10px;border-top:.5px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.sb-footer-lbl{font-size:9px;color:#2A3050;flex-shrink:0}
.sb-rl-chip{font-size:9.5px;padding:3px 9px;border-radius:20px;border:.5px solid rgba(255,255,255,.07);background:transparent;color:rgba(255,255,255,.28);cursor:pointer;transition:all .15s;font-family:var(--sans)}
.sb-rl-chip.on{background:rgba(232,151,42,.1);border-color:rgba(232,151,42,.4);color:rgba(232,151,42,.9)}

/* section label */
.sb-sec-lbl{font-size:8.5px;letter-spacing:.07em;color:rgba(255,255,255,.22);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:8px}
.sb-required::after{content:' ✦';color:rgba(232,151,42,.55);font-size:7.5px}

/* vibe grid */
.sb-vibe-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:16px}
.sb-vibe-tile{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.06);border-radius:12px;padding:10px 7px 9px;cursor:pointer;transition:all .22s;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.sb-vibe-tile:hover{border-color:rgba(232,151,42,.25);background:rgba(12,16,34,.98)}
.sb-vibe-tile.on{border-color:var(--vc,#E8972A);background:rgba(var(--vr,232,151,42),.07)}
.sb-vt-icon{font-size:17px;line-height:1}
.sb-vt-lbl{font-size:10px;font-weight:600;color:#C8BFB0;line-height:1.2}
.sb-vt-desc{font-size:8px;color:#2A3050;line-height:1.3}
.sb-vibe-tile.on .sb-vt-lbl{color:var(--cream)}
.sb-vibe-tile.on .sb-vt-desc{color:rgba(232,151,42,.55)}

/* level grid */
.sb-level-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-bottom:16px}
.sb-level-tile{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.06);border-radius:11px;padding:10px 12px;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;gap:2px}
.sb-level-tile:hover{border-color:rgba(100,160,255,.28)}
.sb-level-tile.on{border-color:rgba(100,160,255,.55);background:rgba(100,160,255,.07)}
.sb-lt-age{font-size:12px;font-weight:600;color:#C8BFB0}
.sb-level-tile.on .sb-lt-age{color:#a8c8ff}
.sb-lt-grade{font-size:8.5px;color:#2A3050}
.sb-level-tile.on .sb-lt-grade{color:#5a8fb8}

/* length list */
.sb-len-list{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
.sb-len-tile{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.06);border-radius:11px;padding:10px 14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:space-between}
.sb-len-tile:hover{border-color:rgba(232,151,42,.28)}
.sb-len-tile.on{border-color:rgba(232,151,42,.55);background:rgba(232,151,42,.07)}
.sb-len-lbl{font-size:12px;font-weight:600;color:#C8BFB0}
.sb-len-tile.on .sb-len-lbl{color:var(--amber2)}
.sb-len-desc{font-size:9.5px;color:#2A3050}

/* live preview */
.sb-preview{background:linear-gradient(135deg,rgba(232,151,42,.07),rgba(232,151,42,.02));border:1px solid rgba(232,151,42,.2);border-radius:14px;padding:12px 15px;margin-bottom:14px;animation:fadein .3s ease-out}
.sb-prev-lbl{font-size:8px;letter-spacing:.07em;color:rgba(232,151,42,.55);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:6px}
.sb-prev-sentence{font-family:var(--serif);font-size:13px;color:var(--cream);line-height:1.75;font-style:italic}
.sb-prev-name{color:var(--amber2);font-style:italic}
.sb-prev-vibe{color:var(--amber)}
.sb-prev-dots{display:flex;gap:5px;margin-top:8px}
.sb-pdot{width:30px;height:2.5px;border-radius:2px;background:rgba(255,255,255,.07)}
.sb-pdot.f{background:linear-gradient(90deg,var(--amber),var(--amber2))}

/* divider */
.sb-div{height:.5px;background:rgba(255,255,255,.05);margin:12px 0}

/* opt sections */
.sb-opt-toggle{width:100%;background:rgba(255,255,255,.017);border:.5px solid rgba(255,255,255,.055);border-radius:10px;padding:9px 13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;justify-content:space-between;transition:all .18s;margin-bottom:6px;color:rgba(255,255,255,.28)}
.sb-opt-toggle:hover{background:rgba(255,255,255,.03);color:rgba(255,255,255,.48)}
.sb-opt-lbl-txt{font-size:11px}
.sb-opt-r{display:flex;align-items:center;gap:7px}
.sb-opt-bdg{font-size:9px;padding:2px 7px;border-radius:20px;background:rgba(232,151,42,.12);color:var(--amber);font-weight:500}
.sb-opt-inner{background:rgba(8,12,24,.98);border:.5px solid rgba(255,255,255,.05);border-radius:11px;padding:12px 14px;margin-bottom:6px;animation:fadein .2s ease-out}
.sb-opt-row{display:flex;align-items:flex-start;justify-content:space-between;padding:6px 0;border-bottom:.5px solid rgba(255,255,255,.04)}
.sb-opt-row:last-child{border-bottom:none;padding-bottom:0}
.sb-opt-row-lbl{font-size:11px;color:rgba(255,255,255,.38);flex-shrink:0;margin-right:10px;padding-top:2px}
.sb-opt-pills{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
.sb-op{font-size:9.5px;padding:3px 9px;border-radius:20px;border:.5px solid rgba(255,255,255,.07);background:transparent;color:rgba(255,255,255,.28);cursor:pointer;transition:all .15s;font-family:var(--sans)}
.sb-op.on{border-color:var(--amber);background:rgba(232,151,42,.1);color:var(--amber2)}
.sb-char-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px}
.sb-char-pill{font-size:10px;padding:4px 10px;border-radius:20px;border:.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(255,255,255,.35);cursor:pointer;transition:all .15s;font-family:var(--sans);display:flex;align-items:center;gap:3px}
.sb-char-pill:hover{border-color:rgba(255,255,255,.16);color:rgba(255,255,255,.6)}
.sb-chars-added{font-size:10px;color:#80d8a8;min-height:14px;margin-top:4px}
.sb-les-pills{display:flex;flex-wrap:wrap;gap:5px}
.sb-les-pill{font-size:9.5px;padding:3px 9px;border-radius:20px;border:.5px solid rgba(255,255,255,.07);background:transparent;color:rgba(255,255,255,.28);cursor:pointer;transition:all .15s;font-family:var(--sans)}
.sb-les-pill.on{border-color:rgba(76,200,144,.45);background:rgba(76,200,144,.07);color:#80d8a8}
.sb-occ-input{width:100%;background:rgba(255,255,255,.04);border:.5px solid rgba(255,255,255,.08);border-radius:8px;padding:7px 10px;font-size:11.5px;color:var(--cream);font-family:var(--sans);outline:none;margin-top:6px}
.sb-occ-input::placeholder{color:#2A3050;font-style:italic}

/* fixed generate button */
.sb-gen-fixed{position:fixed;bottom:0;left:0;right:0;padding:10px 6% 16px;background:linear-gradient(0deg,#080C18 72%,transparent);z-index:20}
.sb-gen-btn{width:100%;max-width:640px;margin:0 auto;display:flex;border:none;border-radius:14px;padding:15px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);align-items:center;justify-content:center;gap:7px;letter-spacing:.01em;transition:filter .2s,transform .15s}
.sb-gen-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.sb-gen-btn.amber{background:linear-gradient(135deg,#E8972A,#CC7818);color:#120800}
.sb-gen-btn.purple{background:rgba(120,80,240,.18);border:1px solid rgba(160,120,255,.28);color:rgba(190,160,255,.9)}
`;

const STARS_SB = Array.from({ length: 18 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 30,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
}));

const LEN_MAP: Record<string, string> = {
  short: 'a short story — about 3 minutes',
  standard: 'a bedtime book — about 5 minutes',
  long: 'a full adventure — about 8 minutes',
};

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export default function StoryBuilderPage() {
  const {
    setView,
    selectedCharacters, selectedCharacter, setSelectedCharacter,
    ritualSeed, setRitualSeed,
    ritualMood,
    setBuilderChoices,
  } = useApp();

  const primary   = selectedCharacters[0] ?? selectedCharacter ?? null;
  const isRitual  = !!ritualSeed;

  // ── state ──
  const [vibe,     setVibe]     = useState(() => moodToVibe(ritualMood) || 'warm-funny');
  const [level,    setLevel]    = useState('age5');
  const [length,   setLength]   = useState('standard');
  const [brief,    setBrief]    = useState('');
  const [rlChips,  setRlChips]  = useState<string[]>([]);
  const [chars,    setChars]    = useState<string[]>([]);
  const [lessons,  setLessons]  = useState<string[]>([]);
  const [occKey,   setOccKey]   = useState('');
  const [occCustom,setOccCustom]= useState('');
  const [style,    setStyle]    = useState('standard');
  const [pace,     setPace]     = useState('normal');
  const [openSecs, setOpenSecs] = useState<Record<string, boolean>>({});
  const [editingSeed, setEditingSeed] = useState(false);
  const [seedEdit, setSeedEdit] = useState(ritualSeed);

  function toggleSec(k: string) {
    setOpenSecs(p => ({ ...p, [k]: !p[k] }));
  }

  function toggleLesson(val: string) {
    setLessons(ls => ls.includes(val) ? ls.filter(x => x !== val) : [...ls, val]);
  }

  function toggleChar(label: string) {
    setChars(cs => cs.includes(label) ? cs.filter(x => x !== label) : [...cs, label]);
  }

  function toggleRlChip(val: string) {
    setRlChips(cs => {
      const next = cs.includes(val) ? cs.filter(x => x !== val) : [...cs, val];
      // append/remove from brief
      return next;
    });
  }

  const nightLabel = primary ? `${primary.name} · tonight` : 'tonight';

  // ── live preview ──
  const previewVibe = VIBE_TO_FEEL[vibe] ?? vibe;
  const lenText = LEN_MAP[length] ?? '';
  const previewSeed = isRitual
    ? (editingSeed ? seedEdit : ritualSeed)
    : brief;

  const previewAction = isRitual
    ? 'is starring in a story built from today'
    : (brief.trim() ? 'has a story brewing' : (VIBE_TO_BRIEF[vibe] ?? 'is going on an adventure'));

  // ── map chars to extraChars format ──
  const extraCharsForGen = chars.map(c => ({
    id: uid(),
    type: c.toLowerCase().includes('friend') ? 'friend'
      : c.toLowerCase().includes('sibling') ? 'sibling'
      : c.toLowerCase().includes('pet') ? 'pet'
      : c.toLowerCase().includes('toy') ? 'toy'
      : 'friend',
    name: '',
    note: c.replace(/^[^\s]+ /, ''),  // strip emoji
    photo: null,
  }));

  function handleGenerate() {
    const finalSeed = editingSeed || ritualSeed;

    const choices: BuilderChoices = {
      path:          isRitual ? 'ritual' : 'free',
      vibe,
      level,
      length,
      brief:         isRitual ? finalSeed : (brief + (rlChips.length ? ' ' + rlChips.join(', ') : '')),
      chars:         extraCharsForGen,
      lessons:       lessons,
      occasion:      occKey,
      occasionCustom: occCustom,
      style,
      pace,
    };

    setBuilderChoices(choices);
    // Keep seed in context for generating screen echo
    if (isRitual && finalSeed !== ritualSeed) setRitualSeed(finalSeed);
    // Set primary character for SleepSeedCore
    if (primary) setSelectedCharacter(primary);
    setView('story-builder');
  }

  const isAmber = isRitual;
  const btnClass = `sb-gen-btn ${isAmber ? 'amber' : 'purple'}`;
  const btnLabel = `Create ${primary?.name ?? 'tonight'}'s story ✦`;

  return (
    <div className="sb">
      <style>{CSS}</style>
      <div className="sb-sky" />
      {STARS_SB.map(s => (
        <div key={s.id} className="sb-star"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
      ))}
      <div className="sb-moon-pos">
        <div className="sb-moon-glow" />
        <div className="sb-moon"><div className="sb-moon-sh" /></div>
      </div>

      <nav className="sb-nav">
        <button className="sb-back" onClick={() => setView(isRitual ? 'story-handoff' : 'story-handoff')}>← back</button>
        <div className="sb-badge"><div className="sb-dot" />{nightLabel}</div>
      </nav>

      <div className="sb-inner">

        {/* ── HEADER EXPLAINER ── */}
        {isRitual ? (
          <div className="sb-header">
            <div className="sb-header-icon">✨</div>
            <div className="sb-header-title">
              Let's turn today into <em style={{ color: 'var(--amber2)' }}>{primary?.name ?? 'their'}'s</em> story
            </div>
            <div className="sb-header-sub">
              What {primary?.name ?? 'they'} told you tonight becomes the heart of the adventure.
              Choose how it feels and we'll weave the magic.
            </div>
          </div>
        ) : (
          <div className="sb-header">
            <div className="sb-header-icon">🌙</div>
            <div className="sb-header-title">
              What story does <em style={{ color: 'rgba(160,120,255,.9)' }}>{primary?.name ?? 'your child'}</em> want tonight?
            </div>
            <div className="sb-header-sub">
              Invent something together — pick a vibe, tell us what you want, or leave it blank and we'll create something wonderful.
              {ritualSeed && <> <strong>Today's diary entry is already saved ✦</strong></>}
            </div>
          </div>
        )}

        {/* ── SEED CARD (ritual) / STORY BOX (free) ── */}
        {isRitual && (
          <div className="sb-seed-card">
            <div className="sb-seed-lbl">from tonight's diary ✦</div>
            {editingSeed ? (
              <textarea
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: 12, fontFamily: 'var(--sans)', resize: 'none', lineHeight: 1.7, fontStyle: 'italic' }}
                value={seedEdit}
                onChange={e => setSeedEdit(e.target.value)}
                rows={3}
                autoFocus
              />
            ) : (
              <div className="sb-seed-txt">"{ritualSeed.length > 140 ? ritualSeed.slice(0, 140) + '…' : ritualSeed}"</div>
            )}
            <button className="sb-seed-edit" onClick={() => setEditingSeed(p => !p)}>
              {editingSeed ? 'done ✓' : 'edit ✎'}
            </button>
          </div>
        )}

        {!isRitual && (
          <div className="sb-story-box">
            <div className="sb-story-hd">
              <div className="sb-story-lbl">tell us anything — or leave it blank</div>
              <div className="sb-voice-btn"><div className="sb-vdot" />speak</div>
            </div>
            <textarea
              className="sb-textarea"
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder={`e.g. "${primary?.name ?? 'Emma'} and their fox find a secret door under the stairs" or "something funny happens involving a very grumpy cloud"…\n\nLeave this blank and we'll create something wonderful for them.`}
              rows={3}
            />
            <div className="sb-story-footer">
              <div className="sb-footer-lbl">or tonight they're</div>
              {['feeling something big', 'celebrating', 'dealing with something tricky'].map(chip => (
                <button key={chip}
                  className={`sb-rl-chip${rlChips.includes(chip) ? ' on' : ''}`}
                  onClick={() => toggleRlChip(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ① VIBE (merged — was story type + feeling) ── */}
        <div className="sb-sec-lbl sb-required">how should the story feel</div>
        <div className="sb-vibe-grid">
          {[
            { key: 'warm-funny',  icon: '😂', lbl: 'Warm & funny',  desc: 'laughs & delight',  vc: '#E8972A', vr: '232,151,42'   },
            { key: 'calm-cosy',   icon: '🌙', lbl: 'Calm & cosy',   desc: 'drift to sleep',    vc: '#7B9EC8', vr: '123,158,200'  },
            { key: 'exciting',    icon: '⚡', lbl: 'Big adventure', desc: 'action-packed',     vc: '#E8B42A', vr: '232,180,42'   },
            { key: 'heartfelt',   icon: '💛', lbl: 'Heartfelt',     desc: 'tender & true',     vc: '#C85A80', vr: '200,90,128'   },
            { key: 'silly',       icon: '🤪', lbl: 'Totally silly', desc: 'pure chaos',        vc: '#C88A28', vr: '200,138,40'   },
            { key: 'mysterious',  icon: '🔍', lbl: 'Mysterious',    desc: 'wonder & secrets',  vc: '#7B60EC', vr: '123,96,236'   },
          ].map(v => (
            <div key={v.key}
              className={`sb-vibe-tile${vibe === v.key ? ' on' : ''}`}
              style={{ '--vc': v.vc, '--vr': v.vr } as any}
              onClick={() => setVibe(v.key)}>
              <div className="sb-vt-icon">{v.icon}</div>
              <div className="sb-vt-lbl">{v.lbl}</div>
              <div className="sb-vt-desc">{v.desc}</div>
            </div>
          ))}
        </div>

        {/* ── ② READING LEVEL ── */}
        <div className="sb-sec-lbl sb-required">reading level</div>
        <div className="sb-level-grid">
          {[
            { k: 'age3',  age: 'Ages 3–4',  grade: 'Pre-K'         },
            { k: 'age5',  age: 'Ages 5–6',  grade: 'Kindergarten'  },
            { k: 'age7',  age: 'Ages 7–9',  grade: 'Grade 2–3'     },
            { k: 'age10', age: 'Ages 10+',  grade: 'Grade 4+'      },
          ].map(l => (
            <div key={l.k}
              className={`sb-level-tile${level === l.k ? ' on' : ''}`}
              onClick={() => setLevel(l.k)}>
              <div className="sb-lt-age">{l.age}</div>
              <div className="sb-lt-grade">{l.grade}</div>
            </div>
          ))}
        </div>

        {/* ── ③ LENGTH ── */}
        <div className="sb-sec-lbl sb-required">story length</div>
        <div className="sb-len-list">
          {[
            { k: 'short',    lbl: 'Short story',     desc: '~3 min · 8 pages'  },
            { k: 'standard', lbl: 'Bedtime book',    desc: '~5 min · 12 pages' },
            { k: 'long',     lbl: 'Full adventure',  desc: '~8 min · 16 pages' },
          ].map(l => (
            <div key={l.k}
              className={`sb-len-tile${length === l.k ? ' on' : ''}`}
              onClick={() => setLength(l.k)}>
              <span className="sb-len-lbl">{l.lbl}</span>
              <span className="sb-len-desc">{l.desc}</span>
            </div>
          ))}
        </div>

        {/* ── LIVE PREVIEW ── */}
        <div className="sb-preview">
          <div className="sb-prev-lbl">✦ tonight's story</div>
          <div className="sb-prev-sentence">
            <span className="sb-prev-name">{primary?.name ?? 'Your child'}</span>{' '}
            {previewAction}. It should feel{' '}
            <span className="sb-prev-vibe">{previewVibe}</span>.{' '}
            {lenText.charAt(0).toUpperCase() + lenText.slice(1)}.
          </div>
          <div className="sb-prev-dots">
            <div className="sb-pdot f" /><div className="sb-pdot f" /><div className="sb-pdot f" />
          </div>
        </div>

        <div className="sb-div" />

        {/* ── OPTIONAL SECTIONS ── */}

        {/* Characters */}
        <button className="sb-opt-toggle" onClick={() => toggleSec('chars')}>
          <span className="sb-opt-lbl-txt">+ Who's in the story with {primary?.name ?? 'them'}?</span>
          <div className="sb-opt-r">
            {chars.length > 0 && <span className="sb-opt-bdg">{chars.length} added</span>}
            <span>{openSecs.chars ? '−' : '+'}</span>
          </div>
        </button>
        {openSecs.chars && (
          <div className="sb-opt-inner">
            <div className="sb-char-row">
              {CHAR_OPTIONS.map(c => (
                <button key={c}
                  className="sb-char-pill"
                  style={chars.includes(c) ? { borderColor: 'rgba(76,200,144,.45)', color: '#80d8a8' } : {}}
                  onClick={() => toggleChar(c)}>
                  {chars.includes(c) ? '✓ ' : '+ '}{c}
                </button>
              ))}
            </div>
            {chars.length > 0 && (
              <div className="sb-chars-added">✓ {chars.join(', ')}</div>
            )}
          </div>
        )}

        {/* Lessons */}
        <button className="sb-opt-toggle" onClick={() => toggleSec('lessons')}>
          <span className="sb-opt-lbl-txt">+ Weave in a gentle lesson?</span>
          <div className="sb-opt-r">
            {lessons.length > 0 && <span className="sb-opt-bdg">chosen</span>}
            <span>{openSecs.lessons ? '−' : '+'}</span>
          </div>
        </button>
        {openSecs.lessons && (
          <div className="sb-opt-inner">
            <div className="sb-les-pills">
              {LESSON_OPTIONS.map(l => (
                <button key={l.value}
                  className={`sb-les-pill${lessons.includes(l.value) ? ' on' : ''}`}
                  onClick={() => toggleLesson(l.value)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special occasion */}
        <button className="sb-opt-toggle" onClick={() => toggleSec('occ')}>
          <span className="sb-opt-lbl-txt">+ Is tonight a special occasion?</span>
          <div className="sb-opt-r">
            {(occKey || occCustom) && <span className="sb-opt-bdg">set</span>}
            <span>{openSecs.occ ? '−' : '+'}</span>
          </div>
        </button>
        {openSecs.occ && (
          <div className="sb-opt-inner">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {OCCASION_OPTIONS.map(o => (
                <button key={o.value}
                  className={`sb-op${occKey === o.value ? ' on' : ''}`}
                  onClick={() => setOccKey(occKey === o.value ? '' : o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            <input
              className="sb-occ-input"
              placeholder="Or describe your own occasion…"
              value={occCustom}
              onChange={e => setOccCustom(e.target.value)}
            />
          </div>
        )}

        {/* Style & pace */}
        <button className="sb-opt-toggle" onClick={() => toggleSec('style')}>
          <span className="sb-opt-lbl-txt">+ Story style &amp; pace</span>
          <div className="sb-opt-r">
            {(style !== 'standard' || pace !== 'normal') && <span className="sb-opt-bdg">set</span>}
            <span>{openSecs.style ? '−' : '+'}</span>
          </div>
        </button>
        {openSecs.style && (
          <div className="sb-opt-inner">
            <div className="sb-opt-row">
              <div className="sb-opt-row-lbl">Style</div>
              <div className="sb-opt-pills">
                {[
                  { k: 'standard',  l: 'Standard'            },
                  { k: 'rhyming',   l: '🎵 Rhyming'          },
                  { k: 'adventure', l: '🔀 Choose-your-own'  },
                  { k: 'mystery',   l: '🔍 Mystery'          },
                ].map(o => (
                  <button key={o.k}
                    className={`sb-op${style === o.k ? ' on' : ''}`}
                    onClick={() => setStyle(o.k)}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="sb-opt-row">
              <div className="sb-opt-row-lbl">Pace</div>
              <div className="sb-opt-pills">
                {[
                  { k: 'normal',  l: 'Normal'         },
                  { k: 'sleepy',  l: '😴 Extra sleepy' },
                  { k: 'snappy',  l: '⚡ Quick'        },
                ].map(o => (
                  <button key={o.k}
                    className={`sb-op${pace === o.k ? ' on' : ''}`}
                    onClick={() => setPace(o.k)}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* sticky generate button */}
      <div className="sb-gen-fixed">
        <button className={btnClass} onClick={handleGenerate}>
          {btnLabel}
        </button>
      </div>
    </div>
  );
}
