import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../AppContext';
import { getCharacters } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import type { BuilderChoices, Character, HatchedCreature } from '../lib/types';

/* ══════════════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════════════ */

const VIBES = [
  { key: 'warm-funny',  emoji: '\u{1F602}', label: 'Funny & warm' },
  { key: 'calm-cosy',   emoji: '\u{1F319}', label: 'Cosy & calm' },
  { key: 'exciting',    emoji: '\u26A1',     label: 'Exciting' },
  { key: 'heartfelt',   emoji: '\u{1F49B}', label: 'Heartfelt' },
  { key: 'silly',       emoji: '\u{1F92A}', label: 'Totally silly' },
  { key: 'mysterious',  emoji: '\u{1F50D}', label: 'Mystery' },
];

const VIBE_BRIEF: Record<string, string> = {
  'warm-funny':  'about to go on a warm and funny adventure full of laughs',
  'calm-cosy':   'about to discover something magical and cosy',
  'exciting':    'about to go on a completely made-up adventure',
  'heartfelt':   'on a journey that fills the heart',
  'silly':       'on a silly quest with friends',
  'mysterious':  'about to discover something magical and mysterious',
};

const MOOD_TO_VIBE: Record<string, string> = {
  '\u{1F60A}': 'warm-funny', '\u{1F97A}': 'heartfelt', '\u{1F602}': 'silly',
  '\u{1F981}': 'exciting', '\u{1F634}': 'calm-cosy',
};

const LESSONS = [
  { label: 'Bravery',      emoji: '\u2694\uFE0F', value: 'bravery and facing fears \u2014 shown through a moment where the hero walks toward the scary thing and discovers it only looked frightening from far away' },
  { label: 'Kindness',     emoji: '\u{1F49B}',    value: 'kindness to others \u2014 shown through one small, specific act of noticing someone who needed to be seen, and choosing to see them' },
  { label: 'Confidence',   emoji: '\u{1F4AA}',    value: 'building confidence and self-belief \u2014 shown through a moment where the hero doubts themselves completely and then discovers something wonderful they could do all along' },
  { label: 'Friendship',   emoji: '\u{1F46B}',    value: 'being a good friend \u2014 shown through listening carefully and showing up exactly when it matters, without being asked' },
  { label: 'Perseverance', emoji: '\u{1F525}',    value: 'never giving up \u2014 shown through a moment of almost-quitting where something small and true gives the hero just enough to try once more' },
  { label: 'Big feelings',  emoji: '\u{1F300}',    value: "managing worries and big feelings \u2014 shown through a moment where the hero's big feeling becomes smaller when they name it, breathe through it, or share it with someone they trust" },
];

const NEW_CHAR_TYPES = [
  { label: 'Dragon',  emoji: '\u{1F409}', type: 'friend', autoName: 'Ember' },
  { label: 'Knight',  emoji: '\u2694\uFE0F', type: 'friend', autoName: 'Sir Bramble' },
  { label: 'Fairy',   emoji: '\u{1F9DA}', type: 'friend', autoName: 'Dewdrop' },
  { label: 'Pirate',  emoji: '\u{1F3F4}\u200D\u2620\uFE0F', type: 'friend', autoName: 'Captain Wobbles' },
  { label: 'Robot',   emoji: '\u{1F916}', type: 'friend', autoName: 'Bleep' },
  { label: 'Wizard',  emoji: '\u{1F9D9}', type: 'friend', autoName: 'Fizwick' },
];

const STYLES = [
  { key: 'standard',  label: 'Standard' },
  { key: 'rhyming',   label: 'Rhyming' },
  { key: 'adventure', label: 'Choose-your-adventure' },
  { key: 'mystery',   label: 'Mystery' },
];

const OCCASIONS = [
  { label: 'Birthday',    emoji: '\u{1F382}', value: "birthday \u2014 weave in one magical gift, one moment of being truly seen and celebrated" },
  { label: 'First day',   emoji: '\u{1F392}', value: "first day of school \u2014 transform butterflies into excitement, end with the world feeling more familiar and safe" },
  { label: 'New sibling',  emoji: '\u{1F476}', value: "new baby sibling \u2014 love doesn't divide, it multiplies" },
  { label: 'Moving',       emoji: '\u{1F4E6}', value: "moving to a new home \u2014 home is not a place but the people and love you carry" },
];

/* ══════════════════════════════════════════════════════════════════════
   CAST ITEM — a character/creature added to the story
   ══════════════════════════════════════════════════════════════════════ */
interface CastItem {
  id: string;
  type: string;
  name: string;
  note: string;
  emoji: string;
  isHero: boolean;
  photo?: string;
  source: 'profile' | 'creature' | 'new';
}

function charToCast(c: Character, isHero = false): CastItem {
  const notes = [c.weirdDetail, c.personalityTags?.join(', '), c.currentSituation].filter(Boolean).join('. ');
  return { id: c.id, type: c.type || 'friend', name: c.name, note: notes, emoji: c.emoji || '\u{1F9D2}', isHero, photo: c.photo, source: 'profile' };
}

function creatureToCast(cr: HatchedCreature): CastItem {
  return { id: cr.id, type: 'friend', name: cr.name, note: `a ${cr.creatureType} \u2014 ${cr.personalityTraits?.join(', ') || 'magical companion'}`, emoji: cr.creatureEmoji || '\u{1F31F}', isHero: false, source: 'creature' };
}

/* ══════════════════════════════════════════════════════════════════════
   CSS
   ══════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--cream:#F4EFE8;--dim:rgba(244,239,232,.45);--border:rgba(255,255,255,.08);--surface:rgba(255,255,255,.04);--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.sw{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center}

/* nav */
.sw-nav{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(245,184,76,.08);background:rgba(2,4,8,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}
.sw-logo{font-family:var(--serif);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px;cursor:pointer}
.sw-logo-moon{width:15px;height:15px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020)}
.sw-back{background:none;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:var(--sans);font-weight:600;transition:color .2s}
.sw-back:hover{color:var(--cream)}

/* body */
.sw-body{width:100%;max-width:540px;padding:24px 6% 140px;overflow-x:hidden}

/* step indicator */
.sw-steps{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px}
.sw-step-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.12);transition:all .3s}
.sw-step-dot.active{background:var(--amber);transform:scale(1.4)}
.sw-step-dot.done{background:var(--teal)}

/* headings */
.sw-title{font-family:var(--serif);font-size:clamp(22px,5vw,28px);font-weight:700;text-align:center;margin-bottom:8px;line-height:1.3}
.sw-sub{font-size:13px;color:var(--dim);text-align:center;line-height:1.6;margin-bottom:24px}

/* mic */
.sw-mic-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:20px}
.sw-mic{width:88px;height:88px;border-radius:50%;border:3px solid rgba(245,184,76,.3);background:rgba(245,184,76,.08);display:flex;align-items:center;justify-content:center;font-size:36px;cursor:pointer;transition:all .2s;box-shadow:0 0 40px rgba(245,184,76,.1)}
.sw-mic:hover{border-color:rgba(245,184,76,.5);box-shadow:0 0 60px rgba(245,184,76,.2);transform:scale(1.05)}
.sw-mic.recording{border-color:rgba(220,60,60,.6);background:rgba(220,60,60,.1);box-shadow:0 0 60px rgba(220,60,60,.2);animation:micPulse 1s ease-in-out infinite}
@keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.sw-mic-label{font-size:12px;color:var(--dim);margin-top:10px;font-weight:600}

/* text input */
.sw-or{font-size:11px;color:rgba(244,239,232,.2);text-align:center;margin:12px 0;text-transform:uppercase;letter-spacing:.1em}
.sw-textarea{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid var(--border);background:var(--surface);color:var(--cream);font-size:14px;font-family:var(--sans);outline:none;resize:none;min-height:80px;line-height:1.6;transition:border-color .2s}
.sw-textarea:focus{border-color:rgba(245,184,76,.4)}
.sw-textarea::placeholder{color:rgba(244,239,232,.2)}

/* idea chips */
.sw-ideas{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:16px}
.sw-idea{padding:10px 16px;border-radius:50px;border:1.5px solid var(--border);background:var(--surface);color:rgba(244,239,232,.55);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.sw-idea:hover{border-color:rgba(255,255,255,.18);color:var(--cream)}

/* ritual diary card */
.sw-seed-card{padding:16px;border-radius:16px;border:1px solid rgba(245,184,76,.2);background:rgba(245,184,76,.04);margin-bottom:20px}
.sw-seed-label{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,184,76,.5);margin-bottom:8px}
.sw-seed-text{font-family:var(--serif);font-size:13px;font-style:italic;color:rgba(244,239,232,.7);line-height:1.7}

/* vibe grid */
.sw-vibe-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px}
.sw-vibe{padding:22px 14px;border-radius:16px;border:2px solid var(--border);background:var(--surface);text-align:center;cursor:pointer;transition:all .2s}
.sw-vibe:hover{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.06)}
.sw-vibe.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.08)}
.sw-vibe-emoji{font-size:28px;margin-bottom:6px}
.sw-vibe-label{font-size:13px;font-weight:700}
.sw-vibe.on .sw-vibe-label{color:var(--amber2)}

/* ritual hero */
.sw-ritual-hero{text-align:center;margin-bottom:20px}
.sw-ritual-label{font-size:12px;color:var(--dim);font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:4px}
.sw-ritual-name{font-family:var(--serif);font-size:clamp(32px,7vw,42px);font-weight:700;color:var(--amber2);line-height:1.2;margin-bottom:6px}

/* character cards */
.sw-cast-section{margin-bottom:20px}
.sw-cast-scroll{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;max-width:100%}
.sw-cast-card{padding:14px 8px;border-radius:14px;border:2px solid var(--border);background:var(--surface);text-align:center;cursor:pointer;transition:all .2s;position:relative}
.sw-cast-card:hover{border-color:rgba(255,255,255,.15)}
.sw-cast-card.in-cast{border-color:rgba(29,158,117,.4);background:rgba(29,158,117,.06)}
.sw-cast-card .cc-emoji{font-size:28px;margin-bottom:4px}
.sw-cast-card .cc-name{font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px}
.sw-cast-card .cc-type{font-size:9px;color:var(--dim);margin-top:2px}
.sw-cast-card .cc-check{position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:50%;background:var(--teal);color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:700}

/* cast list (added characters) */
.sw-cast-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.sw-cast-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:var(--surface)}
.sw-cast-row .cr-emoji{font-size:22px;flex-shrink:0}
.sw-cast-row .cr-info{flex:1;min-width:0}
.sw-cast-row .cr-name-input{width:100%;background:none;border:none;color:var(--cream);font-size:14px;font-weight:600;font-family:var(--sans);outline:none;padding:0}
.sw-cast-row .cr-name-input::placeholder{color:rgba(244,239,232,.2)}
.sw-cast-row .cr-note{font-size:10px;color:var(--dim);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sw-cast-row .cr-hero{padding:4px 10px;border-radius:50px;font-size:9px;font-weight:700;cursor:pointer;transition:all .2s;border:1.5px solid;flex-shrink:0}
.sw-cast-row .cr-hero.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.1);color:var(--amber2)}
.sw-cast-row .cr-hero.off{border-color:var(--border);background:none;color:var(--dim)}
.sw-cast-row .cr-del{background:none;border:none;color:rgba(220,80,80,.4);font-size:16px;cursor:pointer;padding:4px 8px;flex-shrink:0;transition:color .2s}
.sw-cast-row .cr-del:hover{color:rgba(220,80,80,.7)}

/* customize section */
.sw-customize-toggle{width:100%;padding:14px;border-radius:14px;border:1.5px solid var(--border);background:var(--surface);color:var(--dim);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s;text-align:center;margin-bottom:16px}
.sw-customize-toggle:hover{border-color:rgba(255,255,255,.15);color:var(--cream)}
.sw-section{margin-bottom:20px}
.sw-sec-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-bottom:10px}
.sw-pill-row{display:flex;gap:8px;flex-wrap:wrap}
.sw-pill{padding:10px 16px;border-radius:50px;border:1.5px solid var(--border);background:var(--surface);color:rgba(244,239,232,.55);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
.sw-pill:hover{border-color:rgba(255,255,255,.15)}
.sw-pill.on{border-color:rgba(29,158,117,.4);background:rgba(29,158,117,.08);color:#5DCAA5}
.sw-pill.amber{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.08);color:var(--amber2)}

/* hero change link */
.sw-hero-toggle{font-size:11px;color:rgba(245,184,76,.5);cursor:pointer;text-align:center;margin-top:8px;transition:color .2s}
.sw-hero-toggle:hover{color:var(--amber2)}

/* CTA */
.sw-cta-wrap{position:fixed;bottom:0;left:0;right:0;padding:12px 6% calc(env(safe-area-inset-bottom,8px) + 16px);background:linear-gradient(0deg,rgba(8,12,24,.98) 60%,transparent);z-index:15;display:flex;flex-direction:column;align-items:center;gap:8px}
.sw-cta{width:100%;max-width:540px;padding:16px;border:none;border-radius:16px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .2s;box-shadow:0 4px 24px rgba(232,151,42,.25)}
.sw-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}
.sw-cta:disabled{opacity:.35;cursor:not-allowed;transform:none;filter:none;box-shadow:none}
.sw-cta.amber{background:linear-gradient(135deg,#E8972A,#CC7818);color:#120800}
.sw-cta.purple{background:linear-gradient(135deg,rgba(140,100,240,.9),rgba(100,60,200,.9));color:#fff}
.sw-cta-skip{width:100%;max-width:540px;padding:12px;border:1.5px solid rgba(245,184,76,.15);border-radius:14px;background:rgba(245,184,76,.03);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);color:rgba(245,184,76,.55);transition:all .2s;text-align:center}
.sw-cta-skip:hover{border-color:rgba(245,184,76,.3);color:var(--amber2)}

/* fade */
@keyframes swFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.sw-fade{animation:swFade .3s ease both}

/* custom char input */
.sw-custom-row{display:flex;gap:8px;margin-top:10px}
.sw-custom-input{flex:1;padding:12px 14px;border-radius:12px;border:1.5px solid var(--border);background:var(--surface);color:var(--cream);font-size:13px;font-family:var(--sans);outline:none}
.sw-custom-input:focus{border-color:rgba(245,184,76,.4)}
.sw-custom-input::placeholder{color:rgba(244,239,232,.2)}
.sw-custom-add{padding:12px 18px;border-radius:12px;border:none;background:rgba(29,158,117,.15);color:#5DCAA5;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .2s}
.sw-custom-add:hover{background:rgba(29,158,117,.25)}
`;

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

interface Props {
  onGenerate: (choices: BuilderChoices) => void;
}

export default function StoryWizard({ onGenerate }: Props) {
  const {
    user, setView,
    selectedCharacters, selectedCharacter, setSelectedCharacter,
    ritualSeed, setRitualSeed, ritualMood,
  } = useApp();

  const isRitual = !!ritualSeed;
  const preChar = selectedCharacters[0] ?? selectedCharacter ?? null;

  // ── Load saved characters & creatures ──
  const [savedChars, setSavedChars] = useState<Character[]>([]);
  const [savedCreatures, setSavedCreatures] = useState<HatchedCreature[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    getCharacters(user.id).then(setSavedChars).catch(() => {});
    getAllHatchedCreatures(user.id).then(setSavedCreatures).catch(() => {});
  }, [user?.id]);

  // ── Child profile for reading level ──
  const childProfile = (() => {
    if (!user) return null;
    try {
      const s = localStorage.getItem(`sleepseed_child_profile_${user.id}`);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  // ── Steps: Ritual = 1 step (vibe), Create = 3 steps ──
  const [step, setStep] = useState(1);
  const totalSteps = isRitual ? 1 : 3;

  // ── Form state ──
  const [brief, setBrief]         = useState(isRitual ? ritualSeed : '');
  const [vibe, setVibe]           = useState(isRitual ? (MOOD_TO_VIBE[ritualMood] || '') : '');
  const [level, setLevel]         = useState(childProfile?.ageGroup || 'age5');
  const [length, setLength]       = useState('standard');
  const [style, setStyle]         = useState('standard');
  const [pace, setPace]           = useState('normal');
  const [lessons, setLessons]     = useState<string[]>([]);
  const [occasion, setOccasion]   = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showHeroChange, setShowHeroChange] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  // ── Cast (characters in the story) ──
  const [cast, setCast] = useState<CastItem[]>(() => {
    if (isRitual && preChar) {
      return [charToCast(preChar, true)];
    }
    return [];
  });

  // ── Voice ──
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<any>(null);

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e: any) => { setBrief(p => p ? p + ' ' + (e.results[0]?.[0]?.transcript || '') : (e.results[0]?.[0]?.transcript || '')); setIsListening(false); };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recRef.current = r; setIsListening(true); r.start();
  }, []);
  const stopVoice = useCallback(() => { recRef.current?.stop(); setIsListening(false); }, []);

  // ── Cast helpers ──
  const isInCast = (id: string) => cast.some(c => c.id === id);
  const toggleCast = (item: CastItem) => {
    if (isInCast(item.id)) {
      setCast(c => c.filter(x => x.id !== item.id));
    } else if (cast.length < 5) {
      setCast(c => {
        const isFirst = c.length === 0;
        return [...c, { ...item, isHero: isFirst }];
      });
    }
  };
  const setHero = (id: string) => setCast(c => c.map(x => ({ ...x, isHero: x.id === id })));
  const removeCast = (id: string) => setCast(c => c.filter(x => x.id !== id));
  const updateCastName = (id: string, name: string) => setCast(c => c.map(x => x.id === id ? { ...x, name } : x));
  const addCustomChar = () => {
    if (!customName.trim()) return;
    const id = 'custom_' + Date.now();
    const isFirst = cast.length === 0;
    setCast(c => [...c, { id, type: 'friend', name: customName.trim(), note: customDesc.trim(), emoji: '\u{1F9D2}', isHero: isFirst, source: 'new' }]);
    setCustomName(''); setCustomDesc('');
  };

  const toggleLesson = (v: string) => setLessons(ls => ls.includes(v) ? ls.filter(x => x !== v) : [...ls, v]);

  // ── Generate ──
  const handleGenerate = () => {
    const hero = cast.find(c => c.isHero);
    const heroName = hero?.name || preChar?.name || childProfile?.childName || 'Hero';
    const heroGender = preChar?.pronouns === 'she/her' ? 'girl' : preChar?.pronouns === 'he/him' ? 'boy' : '';

    const finalBrief = isRitual
      ? brief
      : (brief.trim() || VIBE_BRIEF[vibe] || 'about to go on an adventure');

    const choices: BuilderChoices = {
      path: isRitual ? 'ritual' : 'free',
      heroName,
      heroGender,
      vibe: vibe || 'warm-funny',
      level,
      length,
      brief: finalBrief,
      chars: cast.filter(c => !c.isHero).map(c => ({ type: c.type, name: c.name, note: c.note })),
      lessons,
      occasion: '',
      occasionCustom: occasion,
      style,
      pace,
    };

    if (isRitual) setRitualSeed(brief);
    if (preChar) setSelectedCharacter(preChar);
    onGenerate(choices);
  };

  const canGenerate = !!vibe;
  const heroChar = cast.find(c => c.isHero);

  // ── Render helpers ──
  const renderCharCards = (label: string, items: CastItem[]) => {
    if (items.length === 0) return null;
    return (
      <div style={{marginBottom:12}}>
        <div className="sw-sec-label">{label}</div>
        <div className="sw-cast-scroll">
          {items.map(item => (
            <div key={item.id} className={`sw-cast-card${isInCast(item.id) ? ' in-cast' : ''}`} onClick={() => toggleCast(item)}>
              {isInCast(item.id) && <div className="cc-check">{'\u2713'}</div>}
              <div className="cc-emoji">{item.emoji}</div>
              <div className="cc-name">{item.name}</div>
              <div className="cc-type">{item.source === 'creature' ? 'Creature' : item.type}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCastList = () => {
    if (cast.length === 0) return null;
    return (
      <div className="sw-cast-list">
        {cast.map(c => (
          <div key={c.id} className="sw-cast-row">
            <span className="cr-emoji">{c.emoji}</span>
            <div className="cr-info">
              <input className="cr-name-input" value={c.name} onChange={e => updateCastName(c.id, e.target.value)} placeholder="Name..." maxLength={20} />
              {c.note && <div className="cr-note">{c.note}</div>}
            </div>
            <button className={`cr-hero ${c.isHero ? 'on' : 'off'}`} onClick={() => setHero(c.id)}>
              {c.isHero ? '\u2B50 Hero' : 'Hero'}
            </button>
            <button className="cr-del" onClick={() => removeCast(c.id)}>{'\u2715'}</button>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomizeMore = () => (
    <div className="sw-fade">
      <div className="sw-section">
        <div className="sw-sec-label">Story length</div>
        <div className="sw-pill-row">
          {[{ key:'short',label:'Short (~3 min)' },{ key:'standard',label:'Standard (~5 min)' },{ key:'long',label:'Long (~8 min)' }].map(l => (
            <button key={l.key} className={`sw-pill${length===l.key?' amber':''}`} onClick={()=>setLength(l.key)}>{l.label}</button>
          ))}
        </div>
      </div>
      <div className="sw-section">
        <div className="sw-sec-label">Sneak in a lesson</div>
        <div className="sw-pill-row">
          {LESSONS.map(l => (
            <button key={l.label} className={`sw-pill${lessons.includes(l.value)?' on':''}`} onClick={()=>toggleLesson(l.value)}>{l.emoji} {l.label}</button>
          ))}
        </div>
      </div>
      <div className="sw-section">
        <div className="sw-sec-label">Story style</div>
        <div className="sw-pill-row">
          {STYLES.map(s => (
            <button key={s.key} className={`sw-pill${style===s.key?' on':''}`} onClick={()=>setStyle(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="sw-section">
        <div className="sw-sec-label">Special occasion</div>
        <div className="sw-pill-row">
          {OCCASIONS.map(o => (
            <button key={o.label} className={`sw-pill${occasion===o.value?' on':''}`} onClick={()=>setOccasion(occasion===o.value?'':o.value)}>{o.emoji} {o.label}</button>
          ))}
        </div>
      </div>
      <div className="sw-section">
        <div className="sw-sec-label">Reading level</div>
        <div className="sw-pill-row">
          {['age3','age5','age7','age10'].map(a => (
            <button key={a} className={`sw-pill${level===a?' amber':''}`} onClick={()=>setLevel(a)}>
              {a==='age3'?'3\u20134':a==='age5'?'5\u20136':a==='age7'?'7\u20138':'9\u201310'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     RITUAL PATH — one screen: diary preview + vibe + generate
     ══════════════════════════════════════════════════════════════════ */
  if (isRitual) {
    return (
      <div className="sw">
        <style>{CSS}</style>
        <nav className="sw-nav">
          <div className="sw-logo" onClick={()=>setView('dashboard')}><div className="sw-logo-moon"/>SleepSeed</div>
          <button className="sw-back" onClick={()=>setView('ritual-starter')}>{'\u2190'} Back</button>
        </nav>
        <div className="sw-body">
          <div className="sw-fade">
            <div className="sw-ritual-hero">
              <div className="sw-ritual-label">Tonight's story for</div>
              <div className="sw-ritual-name">{preChar?.name || 'your little one'}</div>
              <div className="sw-hero-toggle" onClick={()=>setShowHeroChange(!showHeroChange)}>
                {showHeroChange ? 'Done' : `${heroChar?.name || preChar?.name} is the hero \u00B7 change?`}
              </div>
            </div>

            {showHeroChange && cast.length > 0 && (
              <div style={{marginBottom:16}}>
                {renderCastList()}
              </div>
            )}

            {/* Diary preview */}
            <div className="sw-seed-card">
              <div className="sw-seed-label">From tonight's diary</div>
              <textarea className="sw-textarea" value={brief} onChange={e=>setBrief(e.target.value)} rows={3} placeholder="What happened today..." style={{border:'none',background:'none',padding:0,minHeight:50}} />
            </div>

            {/* Add companions */}
            {renderCharCards('Add to tonight\'s story', [
              ...savedChars.filter(c => c.id !== preChar?.id).map(c => charToCast(c)),
              ...savedCreatures.map(creatureToCast),
            ])}

            {/* Vibe */}
            <div className="sw-sec-label" style={{marginTop:16}}>How should tonight's story feel?</div>
            <div className="sw-vibe-grid">
              {VIBES.map(v => (
                <div key={v.key} className={`sw-vibe${vibe===v.key?' on':''}`} onClick={()=>setVibe(v.key)}>
                  <div className="sw-vibe-emoji">{v.emoji}</div>
                  <div className="sw-vibe-label">{v.label}</div>
                </div>
              ))}
            </div>

            {/* Customize */}
            {!showCustomize && (
              <button className="sw-customize-toggle" onClick={()=>setShowCustomize(true)}>Customize more {'\u25BE'}</button>
            )}
            {showCustomize && renderCustomizeMore()}
          </div>

          <div className="sw-cta-wrap">
            <button className="sw-cta amber" disabled={!canGenerate} onClick={handleGenerate}>
              Create tonight's story
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     CREATE PATH — 3 steps: Brief, Characters, Vibe
     ══════════════════════════════════════════════════════════════════ */

  const profileChars = savedChars.map(c => charToCast(c));
  const profileCreatures = savedCreatures.map(creatureToCast);

  return (
    <div className="sw">
      <style>{CSS}</style>
      <nav className="sw-nav">
        <div className="sw-logo" onClick={()=>setView('dashboard')}><div className="sw-logo-moon"/>SleepSeed</div>
        <button className="sw-back" onClick={()=>{
          if (step > 1) setStep(step - 1);
          else setView('dashboard');
        }}>{step > 1 ? '\u2190 Back' : '\u2190 Home'}</button>
      </nav>

      <div className="sw-body">
        {/* Step dots */}
        <div className="sw-steps">
          {[1,2,3].map(s => (
            <div key={s} className={`sw-step-dot${s===step?' active':s<step?' done':''}`} />
          ))}
        </div>

        {/* ═══ STEP 1: WHAT ═══ */}
        {step === 1 && (
          <div className="sw-fade" key="s1">
            <div className="sw-title">What's your story about?</div>
            <div className="sw-sub">Describe it, say it, or let us surprise you</div>

            <div className="sw-mic-wrap">
              <button className={`sw-mic${isListening?' recording':''}`} onClick={isListening?stopVoice:startVoice}>
                {isListening ? '\u{1F534}' : '\u{1F399}\uFE0F'}
              </button>
              <div className="sw-mic-label">{isListening ? 'Listening... tap to stop' : 'Tap to tell us'}</div>
            </div>

            <div className="sw-or">or type it</div>

            <textarea className="sw-textarea" value={brief} onChange={e=>setBrief(e.target.value)} rows={3}
              placeholder="A dragon who runs a bakery... two penguins lost on the moon... anything you can imagine" />

            <div className="sw-ideas">
              {[
                { emoji:'\u{1F3EB}', label:'School day', text:'a funny adventure at school where everything goes wrong' },
                { emoji:'\u{1F30C}', label:'Space quest', text:'a journey through space to find a lost star' },
                { emoji:'\u{1F409}', label:'Dragon tale', text:'a dragon who is afraid of absolutely everything' },
                { emoji:'\u{1F3F0}', label:'Castle mystery', text:'a mystery inside an enchanted castle' },
              ].map(i => (
                <button key={i.label} className="sw-idea" onClick={()=>setBrief(i.text)}>{i.emoji} {i.label}</button>
              ))}
            </div>

            <div className="sw-cta-wrap">
              <button className="sw-cta purple" onClick={()=>setStep(2)}>Continue</button>
              {!brief.trim() && (
                <button className="sw-cta-skip" onClick={()=>{ setBrief(''); setStep(2); }}>Surprise me</button>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: WHO ═══ */}
        {step === 2 && (
          <div className="sw-fade" key="s2">
            <div className="sw-title">Who's in your story?</div>
            <div className="sw-sub">Add characters {'\u2014'} the first one is the hero</div>

            {/* Saved characters */}
            {renderCharCards('Your characters', profileChars)}
            {renderCharCards('Your creatures', profileCreatures)}

            {/* New character types */}
            <div style={{marginBottom:12}}>
              <div className="sw-sec-label">Add a new character</div>
              <div className="sw-cast-scroll">
                {NEW_CHAR_TYPES.map(ct => (
                  <div key={ct.label} className="sw-cast-card" onClick={()=>{
                    if (cast.length >= 5) return;
                    const id = 'new_' + Date.now() + '_' + ct.label;
                    const isFirst = cast.length === 0;
                    setCast(c => [...c, { id, type: ct.type, name: ct.autoName, note: ct.label, emoji: ct.emoji, isHero: isFirst, source: 'new' }]);
                  }}>
                    <div className="cc-emoji">{ct.emoji}</div>
                    <div className="cc-name">{ct.autoName}</div>
                    <div className="cc-type">{ct.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom character */}
            <div className="sw-sec-label">Or create your own</div>
            <div className="sw-custom-row">
              <input className="sw-custom-input" placeholder="Character name" value={customName} onChange={e=>setCustomName(e.target.value)} maxLength={20} />
              <button className="sw-custom-add" onClick={addCustomChar}>+ Add</button>
            </div>
            {customName.trim() && (
              <input className="sw-custom-input" style={{marginTop:6,width:'100%'}} placeholder="Description (optional)" value={customDesc} onChange={e=>setCustomDesc(e.target.value)} maxLength={80} />
            )}

            {/* Cast list */}
            {renderCastList()}

            <div className="sw-cta-wrap">
              <button className="sw-cta purple" disabled={cast.length === 0} onClick={()=>setStep(3)}>
                Continue {cast.length > 0 ? `(${cast.length} character${cast.length>1?'s':''})` : ''}
              </button>
              <button className="sw-cta-skip" onClick={()=>setStep(3)}>Skip {'\u2014'} no characters</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: HOW ═══ */}
        {step === 3 && (
          <div className="sw-fade" key="s3">
            <div className="sw-title">How should it feel?</div>
            <div className="sw-sub">Pick the vibe for your story</div>

            <div className="sw-vibe-grid">
              {VIBES.map(v => (
                <div key={v.key} className={`sw-vibe${vibe===v.key?' on':''}`} onClick={()=>setVibe(v.key)}>
                  <div className="sw-vibe-emoji">{v.emoji}</div>
                  <div className="sw-vibe-label">{v.label}</div>
                </div>
              ))}
            </div>

            {!showCustomize && (
              <button className="sw-customize-toggle" onClick={()=>setShowCustomize(true)}>Customize more {'\u25BE'}</button>
            )}
            {showCustomize && renderCustomizeMore()}

            <div className="sw-cta-wrap">
              <button className="sw-cta purple" disabled={!canGenerate} onClick={handleGenerate}>
                Create this story!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
