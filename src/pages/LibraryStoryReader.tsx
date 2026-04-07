import { useState, useEffect, useRef, useCallback } from 'react';
import ReadAloudText from '../components/ReadAloudText';
import InterlinearText from '../components/InterlinearText';
import LanguagePicker from '../components/LanguagePicker';
import { useApp } from '../AppContext';
import {
  getLibraryStoryBySlug, recordStoryRead, voteOnStory, getUserVote,
  addToFavourites, removeFromFavourites, isFavourited, ensureRefCode,
} from '../lib/storage';
import { getSceneByVibe } from '../lib/storyScenes';
import { BASE_URL } from '../lib/config';
import { translateStory, getSavedLanguage, LANGUAGES } from '../lib/translate';
import type { TranslatedPage } from '../lib/translate';
import type { LibraryStory } from '../lib/types';
import { shareStoryCardForInstagram } from '../lib/shareUtils';

const PRESET_VOICES = [
  {id:"iCrDUkL56s3C8sCRl7wb", name:"Hope",          emoji:"\uD83C\uDFA4\uFE0F", desc:"Warm & clear"},
  {id:"NOpBlnGInO9m6vDvFkFC", name:"Spuds Oxley",   emoji:"\uD83C\uDFAD", desc:"Rich & deep"},
  {id:"4YYIPFl9wE5c4L2eu2Gb", name:"Burt Reynolds",  emoji:"\uD83E\uDD20", desc:"Smooth & warm"},
  {id:"Atp5cNFg1Wj5gyKD7HWV", name:"Natasha",       emoji:"\u2728", desc:"Clear & bright"},
  {id:"eadgjmk4R4uojdsheG9t", name:"Chadwich",      emoji:"\uD83C\uDFA4\uFE0F", desc:"Bold & rich"},
  {id:"bIQlQ61Q7WgbyZAL7IWj", name:"Faith",         emoji:"\uD83C\uDF38", desc:"Warm & gentle"},
];

const SPARKLE_COLORS = ['#F5B84C','#9482ff','#14d890','#F5B84C','#9482ff','#14d890','#F5B84C','#9482ff'];

function strHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/* ════════════════════════════════════════════════════════
   CSS — unified design system
   ════════════════════════════════════════════════════════ */
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060912;--night-mid:#0D1120;--night-card:#0f1525;--night-raised:#141a2e;
  --amber:#F5B84C;--amber-deep:#E8972A;--amber-glow:rgba(245,184,76,0.18);--amber-glow2:rgba(245,184,76,0.08);
  --cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.60);--cream-faint:rgba(244,239,232,0.25);--cream-ghost:rgba(244,239,232,0.10);
  --teal:#14d890;--purple:#9482ff;
  --serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;
  --hand:'Patrick Hand',cursive;--kalam:'Kalam',cursive;--cta:'Baloo 2',system-ui,sans-serif;
}
@keyframes lrSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes lrFadeIn{from{opacity:0}to{opacity:1}}
@keyframes lrFloat{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-10px) rotate(5deg)}}
@keyframes lrSparkle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0)}}
@keyframes lrDotPop{0%{transform:scale(0.7)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes v8r-moonPulse{0%,100%{box-shadow:0 0 4px rgba(245,184,76,.3)}50%{box-shadow:0 0 12px rgba(245,184,76,.7)}}
@keyframes v8r-edgePulse{0%,100%{opacity:0}50%{opacity:1}}
@keyframes v8r-hintFade{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(8px)}}
@keyframes v8r-shareReveal{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes v8r-wordGlow{0%{background:rgba(245,184,76,.5);color:#F5B84C}100%{background:rgba(245,184,76,.11);color:rgba(245,184,76,.92)}}
@keyframes v8r-textIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes v8r-cBounce{0%,100%{transform:translateY(0) rotate(-2deg)}30%{transform:translateY(-14px) rotate(4deg) scale(1.15)}65%{transform:translateY(-5px) rotate(-1deg)}}
@keyframes v8r-cWiggle{0%,100%{transform:rotate(-2deg)}25%{transform:rotate(7deg) scale(1.08)}75%{transform:rotate(-7deg) scale(1.08)}}
@keyframes v8r-seedAppear{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes v8r-seedGlow{0%,100%{box-shadow:0 0 8px rgba(245,184,76,.25)}50%{box-shadow:0 0 28px rgba(245,184,76,.7)}}
@keyframes v8r-soundPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes v8r-nudgePulse{0%,100%{opacity:0}50%{opacity:1}}
.v8r-mw{display:inline;cursor:pointer;color:rgba(245,184,76,.92);background:rgba(245,184,76,.11);border-radius:5px;padding:1px 4px;border-bottom:1.5px solid rgba(245,184,76,.38);transition:background .18s}
.v8r-mw:active{background:rgba(245,184,76,.22)}

/* ── Full-screen reader shell ── */
.lr-reader{position:fixed;inset:0;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;overflow:hidden;z-index:150}

/* ── Progress bar ── */
.lr-pbar{position:absolute;top:0;left:0;height:3px;z-index:30;background:linear-gradient(90deg,#E8972A,#F5B84C);transition:width 0.5s cubic-bezier(0.4,0,0.2,1);border-radius:0 2px 2px 0}

/* ── Top chrome ── */
.lr-top{display:none}
.lr-top>*{pointer-events:auto}
.lr-top-logo{font-family:var(--serif);font-size:14px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:6px;cursor:pointer;opacity:.8}
.lr-top-moon{width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020)}
.lr-top-btn{width:36px;height:36px;border-radius:50%;border:1px solid rgba(244,239,232,.14);background:rgba(6,9,18,.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cream-faint);font-size:16px;transition:all .18s;-webkit-tap-highlight-color:transparent}
.lr-top-btn:hover{background:rgba(244,239,232,.08);color:var(--cream)}

/* ── Bottom chrome ── */
.lr-bot{position:absolute;bottom:0;left:0;right:0;z-index:25;padding:10px 20px max(20px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;gap:12px;pointer-events:none}
.lr-bot>*{pointer-events:auto}
.lr-arrow{width:44px;height:44px;border-radius:50%;border:1px solid rgba(244,239,232,.13);background:rgba(6,9,18,.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cream);font-size:18px;transition:all .18s;flex-shrink:0;-webkit-tap-highlight-color:transparent}
.lr-arrow:disabled{opacity:.18;cursor:default}
.lr-arrow:not(:disabled):hover{background:rgba(244,239,232,.08)}
.lr-dots-wrap{display:flex;gap:6px;align-items:center;justify-content:center;flex:1;min-width:0;overflow:hidden}
.lr-dot2{width:6px;height:6px;border-radius:50%;background:var(--cream-faint);cursor:pointer;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);flex-shrink:0;-webkit-tap-highlight-color:transparent}
.lr-dot2.active{width:18px;border-radius:9px;background:var(--amber);animation:lrDotPop .3s ease}

/* ── Page carousel ── */
.lr-track{display:flex;height:100%;transition:transform 0.42s cubic-bezier(0.4,0,0.2,1);will-change:transform}
.lr-page{width:100vw;height:100dvh;flex-shrink:0;overflow:hidden;position:relative}

/* ── Tap zones ── */
.lr-tap{position:absolute;z-index:5;top:70px;bottom:80px}
.lr-tap-l{left:0;width:30%}
.lr-tap-r{right:0;width:30%}

/* ── Sparkles ── */
.lr-sparkle{position:fixed;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:40;animation:lrSparkle 0.7s ease-out forwards}

/* ── Cover page ── */
.lr-cover{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;overflow:hidden;background:var(--night)}
.lr-cover-scene{position:absolute;inset:0;z-index:0}
.lr-cover-vig{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 30%,rgba(6,9,18,0.6));z-index:1}
.lr-cover-grad{position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,#060912 20%,transparent);z-index:2}
.lr-cover-text{position:absolute;bottom:0;left:0;right:0;z-index:3;padding:0 28px 60px;text-align:center}
.lr-cover-stars{font-size:10px;color:var(--amber);letter-spacing:10px;margin-bottom:10px;opacity:.7}
.lr-cover-title{font-family:var(--serif);font-weight:700;font-size:clamp(26px,7.5vw,38px);color:var(--cream);line-height:1.15;margin-bottom:10px}
.lr-cover-for{font-family:var(--sans);font-size:14px;color:var(--cream-dim)}
.lr-cover-for b{color:var(--amber);font-weight:700}
.lr-cover-brand{font-family:var(--serif);font-size:10px;color:var(--cream-faint);text-transform:uppercase;letter-spacing:.15em;margin-top:14px}

/* ── Story page ── */
.lr-sp{display:flex;flex-direction:column;height:100dvh;overflow:hidden}
.lr-sp-scene{width:100%;aspect-ratio:400/190;max-height:42%;flex-shrink:0;position:relative;overflow:hidden}
.lr-sp-fade{position:absolute;bottom:0;left:0;right:0;height:56px;background:linear-gradient(to top,var(--night),transparent);z-index:1}
.lr-sp-body{flex:1;display:flex;flex-direction:column;padding:16px 28px 0;overflow:hidden}
.lr-sp-pgnum{font-family:var(--kalam);font-weight:300;font-size:12px;color:rgba(245,184,76,.55);text-align:center;margin-bottom:12px;flex-shrink:0}
.lr-sp-text{font-family:var(--hand);font-size:clamp(17px,4.5vw,21px);line-height:1.75;color:var(--cream);flex:1;overflow:hidden}
.lr-sp-refrain{font-family:var(--kalam);font-weight:300;font-size:14px;font-style:italic;color:rgba(245,184,76,.7);text-align:center;padding-top:14px;border-top:1px solid rgba(245,184,76,.12);flex-shrink:0;margin-top:14px}

/* ── End page ── */
.lr-end{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;background:var(--night);padding:60px 32px max(120px,calc(env(safe-area-inset-bottom) + 90px));text-align:center;overflow:hidden}
.lr-end-moon{font-size:54px;animation:lrFloat 5s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(245,184,76,.3));margin-bottom:20px}
.lr-end-title{font-family:var(--serif);font-weight:400;font-style:italic;font-size:34px;color:var(--amber);margin-bottom:16px}
.lr-end-refrain{font-family:var(--kalam);font-weight:300;font-size:15px;font-style:italic;color:var(--cream-dim);line-height:1.7;max-width:280px;margin-bottom:16px}
.lr-end-msg{font-family:var(--sans);font-size:15px;color:var(--cream-dim);line-height:1.75;margin-bottom:28px}
.lr-end-btns{display:flex;flex-direction:column;gap:12px;width:100%;max-width:290px}
.lr-ghost-btn{padding:13px 20px;border-radius:14px;border:1.5px solid rgba(244,239,232,.14);background:rgba(244,239,232,.04);color:var(--cream-dim);font-family:var(--sans);font-size:14px;font-weight:600;cursor:pointer;transition:all .18s;text-align:center;-webkit-tap-highlight-color:transparent}
.lr-ghost-btn:hover{border-color:rgba(244,239,232,.25);color:var(--cream)}

/* ── Controls sheet ── */
.lr-sheet-bg{position:fixed;inset:0;background:rgba(6,9,18,.72);backdrop-filter:blur(4px);z-index:100;animation:lrFadeIn .15s ease}
.lr-sheet{position:fixed;bottom:0;left:0;right:0;z-index:101;background:var(--night-card);border-radius:26px 26px 0 0;max-height:88dvh;display:flex;flex-direction:column;animation:lrSlideUp .25s cubic-bezier(0.22,0.68,0,1.2)}
.lr-sheet-handle{width:38px;height:4px;border-radius:2px;background:rgba(244,239,232,.18);margin:14px auto}
.lr-sheet-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 0 max(28px,env(safe-area-inset-bottom))}
.lr-sheet-section{padding:6px 0}
.lr-sheet-sep{height:6px;background:rgba(244,239,232,.04)}
.lr-sheet-row{display:flex;align-items:center;gap:14px;padding:10px 20px;cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent}
.lr-sheet-row:active{background:rgba(244,239,232,.04)}
.lr-sheet-ico{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.lr-sheet-body{flex:1;min-width:0}
.lr-sheet-label{font-family:var(--sans);font-size:14px;font-weight:700;color:var(--cream)}
.lr-sheet-sub{font-family:var(--sans);font-size:11px;color:var(--cream-dim);margin-top:1px}
.lr-sheet-toggle{width:46px;height:27px;border-radius:14px;background:rgba(244,239,232,.14);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;-webkit-tap-highlight-color:transparent}
.lr-sheet-toggle.on{background:var(--amber)}
.lr-sheet-knob{position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:left 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none}
.lr-sheet-toggle.on .lr-sheet-knob{left:22px}
.lr-sheet-chevron{color:var(--cream-faint);font-size:16px;flex-shrink:0}

/* ── Voice picker sheet ── */
.lr-vpick{position:fixed;bottom:0;left:0;right:0;z-index:201;background:var(--night-card);border-radius:26px 26px 0 0;max-height:75dvh;display:flex;flex-direction:column;animation:lrSlideUp .25s cubic-bezier(0.22,0.68,0,1.2)}
.lr-vpick-list{flex:1;overflow-y:auto;padding:0 8px max(20px,env(safe-area-inset-bottom))}
.lr-vpick-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent}
.lr-vpick-item:active,.lr-vpick-item:hover{background:rgba(244,239,232,.04)}
.lr-vpick-item.sel{background:rgba(245,184,76,.1)}
.lr-vpick-name{font-family:var(--sans);font-size:14px;font-weight:700;color:var(--cream);flex:1}
.lr-vpick-item.sel .lr-vpick-name{color:var(--amber)}
.lr-vpick-desc{font-size:11px;color:var(--cream-faint)}

/* ── Personalisation gate ── */
.lr-gate{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;padding:40px 24px;background:var(--night);animation:lrFadeIn .4s ease}
.lr-gate-scene{width:100%;max-width:360px;height:140px;border-radius:18px;overflow:hidden;margin-bottom:20px}
.lr-gate-h{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--cream);margin-bottom:6px;text-align:center}
.lr-gate-p{font-size:13px;color:var(--cream-dim);margin-bottom:24px;text-align:center;line-height:1.65}
.lr-gate-fields{width:100%;max-width:360px}
.lr-gate-field{margin-bottom:14px}
.lr-gate-lbl{font-size:9px;color:var(--cream-faint);font-family:'DM Mono',monospace;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
.lr-gate-input{width:100%;background:rgba(244,239,232,.04);border:1.5px solid rgba(244,239,232,.1);border-radius:14px;padding:13px 16px;font-size:14px;color:var(--cream);font-family:var(--sans);outline:none;transition:border-color .2s}
.lr-gate-input:focus{border-color:rgba(245,184,76,.4)}
.lr-gate-input::placeholder{color:rgba(244,239,232,.18)}
.lr-gate-btn{width:100%;max-width:360px;padding:15px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--cta);background:linear-gradient(135deg,var(--amber-deep),var(--amber));color:#120800;margin-top:8px;transition:all .18s}
.lr-gate-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.lr-gate-skip{background:none;border:none;color:var(--cream-faint);font-size:12px;cursor:pointer;margin-top:14px;font-family:var(--sans)}

/* ── Loading / error ── */
.lr-load{display:flex;align-items:center;justify-content:center;min-height:100dvh;background:var(--night);color:var(--cream-faint);font-size:14px}
.lr-err{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;background:var(--night);text-align:center;padding:40px 24px}
.lr-err h2{font-family:var(--serif);font-size:20px;color:var(--cream);margin-bottom:8px}
.lr-err p{font-size:13px;color:var(--cream-dim);margin-bottom:20px}

/* ── End page: vote/share/fav/cta cards ── */
.lr-post-card{background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:18px;padding:20px;width:100%;max-width:340px;margin-bottom:14px}
.lr-vote-q{font-family:var(--serif);font-size:15px;font-weight:700;margin-bottom:14px;text-align:center}
.lr-vote-row{display:flex;gap:10px;justify-content:center}
.lr-vote-btn{display:flex;align-items:center;gap:6px;padding:11px 24px;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .18s;border:1.5px solid}
.lr-vote-btn.up{border-color:rgba(245,184,76,.25);background:var(--amber-glow2);color:rgba(245,184,76,.7)}
.lr-vote-btn.up.voted{border-color:var(--amber);background:var(--amber-glow);color:var(--amber)}
.lr-vote-btn.down{border-color:rgba(255,100,100,.2);background:rgba(255,100,100,.04);color:rgba(255,100,100,.5)}
.lr-vote-btn.down.voted{border-color:rgba(255,100,100,.5);background:rgba(255,100,100,.1);color:rgba(255,100,100,.8)}
.lr-vote-note{margin-top:10px}
.lr-vote-note input{width:100%;background:rgba(244,239,232,.04);border:1px solid rgba(244,239,232,.08);border-radius:12px;padding:10px 14px;font-size:12px;color:var(--cream);font-family:var(--sans);outline:none}
.lr-vote-note input::placeholder{color:var(--cream-faint)}
.lr-vote-note-btn{margin-top:6px;padding:8px 18px;border-radius:50px;border:none;background:rgba(255,100,100,.12);color:rgba(255,100,100,.7);font-size:11px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.lr-fav-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;max-width:340px;padding:12px;border-radius:50px;border:1.5px solid rgba(245,184,76,.2);background:var(--amber-glow2);color:rgba(245,184,76,.6);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s;margin-bottom:14px}
.lr-fav-btn.saved{border-color:var(--amber);background:var(--amber-glow);color:var(--amber)}
`;

interface Props { slug: string }

export default function LibraryStoryReader({ slug }: Props) {
  const { user, setView, isSubscribed } = useApp();
  const [story, setStory] = useState<LibraryStory | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // PDF picture book state (must be declared before any early returns)
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const pdfCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Reading state
  const [pageIdx, setPageIdx] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [nameInputs, setNameInputs] = useState<Record<string, string>>({});

  // Post-reading state
  const [myVote, setMyVote] = useState<1 | -1 | null>(null);
  const [localUp, setLocalUp] = useState(0);
  const [localDown, setLocalDown] = useState(0);
  const [showDownNote, setShowDownNote] = useState(false);
  const [downNote, setDownNote] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Language state
  const [lang, setLang] = useState(() => getSavedLanguage().code);
  const [learningMode, setLearningMode] = useState(() => getSavedLanguage().learningMode);
  const [translatedPages, setTranslatedPages] = useState<TranslatedPage[]>([]);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [readAloudActive, setReadAloudActive] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    try {
      // Check for cloned voice first (saved by SleepSeedCore via sSet)
      const clonedRaw = localStorage.getItem('sleepseed_voice_id');
      if (clonedRaw) return clonedRaw;
      // Also check the sSet format used by SleepSeedCore
      const keys = Object.keys(localStorage);
      const voiceKey = keys.find(k => k.includes('voice_id') && !k.includes('sleepseed_voice_id'));
      if (voiceKey) {
        try { const parsed = JSON.parse(localStorage.getItem(voiceKey)!); if (parsed?.id) return parsed.id; } catch {}
      }
      return 'iCrDUkL56s3C8sCRl7wb';
    } catch { return 'iCrDUkL56s3C8sCRl7wb'; }
  });
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [chromeVisible, setChromeVisible] = useState(true);

  // v8r: story reader upgrade state
  const [v8rTrayOpen,      setV8rTrayOpen]      = useState(false);
  const [v8rShareOpen,     setV8rShareOpen]     = useState(false);
  const [v8rLinkCopied,    setV8rLinkCopied]    = useState(false);
  const [v8rWordMagic,     setV8rWordMagic]     = useState(false);
  const [v8rAmbientOn,     setV8rAmbientOn]     = useState(false);
  const [v8rCreatureAnim,  setV8rCreatureAnim]  = useState<'idle'|'bounce'|'wiggle'|'sparkle'>('idle');
  const [v8rIdleTimer,     setV8rIdleTimer]     = useState<ReturnType<typeof setTimeout>|null>(null);
  const v8rAudioCtxRef     = useRef<AudioContext|null>(null);
  const v8rAmbientNodesRef = useRef<{src?:AudioBufferSourceNode;gain?:GainNode}>({});

  const sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sleepseed_sid') : null;
  const refFromUrl = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sleepseed_ref') : null;

  const readerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const chromeFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load story (ALL LOGIC PRESERVED) ──
  useEffect(() => {
    if (!slug) { setError('No story specified.'); setLoading(false); return; }
    getLibraryStoryBySlug(slug).then(s => {
      if (!s) { setError('Story not found.'); setLoading(false); return; }
      setStory(s);
      setLocalUp(s.thumbsUp);
      setLocalDown(s.thumbsDown);
      setLoading(false);
      if (isSubscribed && s.bookData?.allChars?.length > 0) setShowGate(true);
      recordStoryRead(s.id, { refCode: refFromUrl || undefined, userId: user?.id, sessionId: sessionId || undefined });
      document.title = `${s.title} — SleepSeed`;
      setMeta('og:title', s.title);
      setMeta('og:description', `A bedtime story for ages ${s.ageGroup || 'all ages'} — on SleepSeed`);
      setMeta('og:url', `${BASE_URL}/stories/${s.librarySlug}`);
      setMeta('og:type', 'article');
    });
    getUserVote(slug, user?.id, sessionId || undefined).then(v => setMyVote(v));
    return () => { document.title = 'SleepSeed'; };
  }, [slug]); // eslint-disable-line

  useEffect(() => {
    if (story && user && !user.isGuest) {
      isFavourited(user.id, story.id).then(setIsFav);
    }
  }, [story, user]);

  useEffect(() => {
    if (!story || lang === 'en') { setTranslatedPages([]); setTranslateError(''); return; }
    const pgs = story.bookData?.pages || story.bookData?.setup_pages || [];
    if (pgs.length === 0) return;
    setTranslating(true);
    setTranslateError('');
    const pageTexts = pgs.map((p: any) => personalise(p.text || ''));
    translateStory(pageTexts, lang, story.id).then(result => {
      setTranslatedPages(result.pages);
      setTranslating(false);
    }).catch((e) => {
      console.error('[translate]', e);
      setTranslateError('Translation unavailable \u2014 showing English');
      setTranslating(false);
    });
  }, [story, lang]); // eslint-disable-line

  const handleLanguageChange = (newLang: string, newLearn: boolean) => {
    setLang(newLang);
    setLearningMode(newLearn);
  };

  useEffect(() => {
    if (!story) return;
    if (user && !user.isGuest) {
      ensureRefCode(user.id).then(code => {
        setShareLink(`${BASE_URL}/stories/${story.librarySlug}?ref=${code}`);
      }).catch(() => {
        setShareLink(`${BASE_URL}/stories/${story.librarySlug}`);
      });
    } else {
      setShareLink(`${BASE_URL}/stories/${story.librarySlug}`);
    }
  }, [story, user]);

  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };

  const personalise = (text: string): string => {
    let result = text;
    for (const [orig, replacement] of Object.entries(nameMap)) {
      if (replacement && replacement !== orig) {
        result = result.split(orig).join(replacement);
      }
    }
    return result;
  };

  const handleStartReading = () => {
    const map: Record<string, string> = {};
    for (const [orig, val] of Object.entries(nameInputs)) {
      if (val.trim()) map[orig] = val.trim();
    }
    setNameMap(map);
    setShowGate(false);
  };

  // ── All voting/fav/share logic PRESERVED exactly ──
  const handleVote = async (vote: 1 | -1) => {
    if (!user || user.isGuest) return;
    if (vote === -1 && myVote !== -1) { setShowDownNote(true); }
    setMyVote(vote);
    if (vote === 1) { setLocalUp(u => u + (myVote === 1 ? 0 : 1)); if (myVote === -1) setLocalDown(d => d - 1); }
    if (vote === -1) { setLocalDown(d => d + (myVote === -1 ? 0 : 1)); if (myVote === 1) setLocalUp(u => u - 1); }
    await voteOnStory(story!.id, vote, undefined, user.id, sessionId || undefined);
  };

  const handleDownNoteSubmit = async () => {
    if (downNote.trim()) {
      await voteOnStory(story!.id, -1, downNote.trim(), user?.id, sessionId || undefined);
    }
    setShowDownNote(false);
  };

  const toggleFav = async () => {
    if (!user || user.isGuest || !isSubscribed || !story) return;
    if (isFav) { await removeFromFavourites(user.id, story.id); setIsFav(false); }
    else { await addToFavourites(user.id, story.id); setIsFav(true); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: story!.title, text: `A bedtime story: ${story!.title}`, url: shareLink }); } catch {}
    } else { copyLink(); }
  };

  // ── Page navigation ──
  const goPage = useCallback((dir: number) => {
    setPageIdx(p => {
      if (!story) return p;
      const isPdf = !!story.bookData?.pdfUrl;
      const total = isPdf ? (pdfPageCount + 1) : (2 + (story.bookData?.pages || story.bookData?.setup_pages || []).length);
      return Math.max(0, Math.min(total - 1, p + dir));
    });
  }, [story, pdfPageCount]);

  // ── Sparkle on page turn ──
  const emitSparkles = useCallback(() => {
    const el = readerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('div');
      spark.className = 'lr-sparkle';
      const angle = (i / 8) * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      spark.style.cssText = `left:${rect.left + cx}px;top:${rect.top + cy}px;background:${SPARKLE_COLORS[i]};--sx:${Math.cos(angle) * dist}px;--sy:${Math.sin(angle) * dist}px`;
      el.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }, []);

  // Sparkle + chrome on page change
  useEffect(() => {
    if (pageIdx > 0) emitSparkles();
  }, [pageIdx]); // eslint-disable-line

  // ── Chrome auto-fade on story pages ──
  const resetChromeFade = useCallback(() => {
    setChromeVisible(true);
    if (chromeFadeTimer.current) clearTimeout(chromeFadeTimer.current);
    chromeFadeTimer.current = setTimeout(() => setChromeVisible(false), 3500);
  }, []);

  // Touch: swipe + chrome restore
  useEffect(() => {
    const el = readerRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      resetChromeFade();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 45) {
        if (delta < 0) goPage(1);
        else goPage(-1);
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [goPage, resetChromeFade]);

  // ── PDF hooks (must be before early returns — Rules of Hooks) ──
  const isPdfBook = !!story?.bookData?.pdfUrl;
  const pdfUrl = story?.bookData?.pdfUrl;

  useEffect(() => {
    if (!isPdfBook || !pdfUrl) return;
    const loadPdf = async () => {
      try {
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(script);
          });
        }
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        setPdfDoc(pdf);
        setPdfPageCount(pdf.numPages);
        console.log('[reader] PDF loaded:', pdf.numPages, 'pages');
      } catch (e) {
        console.error('[reader] Failed to load PDF:', e);
        setError(`Failed to load picture book: ${(e as any)?.message || 'Unknown error'}`);
      }
    };
    loadPdf();
  }, [isPdfBook, pdfUrl]);

  useEffect(() => {
    if (!pdfDoc || !isPdfBook) return;
    const idx = pageIdx;
    if (idx < 0 || idx >= pdfPageCount) return;
    const renderPdfPage = async (pgIdx: number) => {
      const canvas = pdfCanvasRefs.current.get(pgIdx);
      if (!canvas || canvas.dataset.rendered === String(pgIdx)) return;
      try {
        const page = await pdfDoc.getPage(pgIdx + 1);
        const viewport = page.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
        canvas.dataset.rendered = String(pgIdx);
      } catch (e) { console.error(`[reader] PDF page ${pgIdx} render failed:`, e); }
    };
    renderPdfPage(idx);
    [idx - 1, idx + 1].forEach(i => { if (i >= 0 && i < pdfPageCount) renderPdfPage(i); });
  }, [pdfDoc, pageIdx, pdfPageCount, isPdfBook]);

  // ═══ v8r: story reader upgrade effects + helpers ═══

  // v8r: idle nudge
  useEffect(() => {
    if (v8rIdleTimer) clearTimeout(v8rIdleTimer);
    const el = document.getElementById('v8rIdleNudge');
    if (el) el.style.animation = 'none';
    const t = setTimeout(() => {
      const nudge = document.getElementById('v8rIdleNudge');
      if (nudge) nudge.style.animation = 'v8r-nudgePulse 1.2s ease-in-out 2';
    }, 5000);
    setV8rIdleTimer(t);
    return () => clearTimeout(t);
  }, [pageIdx]); // eslint-disable-line

  // v8r: nightfall progress
  const lrTotalPages = story ? (isPdfBook ? pdfPageCount + 1 : 2 + (story.bookData?.pages || story.bookData?.setup_pages || []).length) : 1;
  const v8rNightProgress = lrTotalPages <= 2 ? 0 : Math.min((pageIdx - 1) / (lrTotalPages - 2), 1);
  const v8rTextBg = `rgb(${Math.round(6 - v8rNightProgress * 3)},${Math.round(9 - v8rNightProgress * 3)},${Math.round(18 - v8rNightProgress * 2)})`;
  const v8rStarOpacity = v8rNightProgress * 0.35;

  // v8r: ambient sound (brown noise — warm, sleep-friendly)
  const v8rStartAmbient = useCallback(() => {
    try {
      if (!v8rAudioCtxRef.current) v8rAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = v8rAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      // Generate brown noise buffer (4 seconds, looped)
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        let last = 0;
        for (let i = 0; i < len; i++) { const white = Math.random() * 2 - 1; last = (last + (0.02 * white)) / 1.02; data[i] = last * 3.5; }
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.8);
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 400;
      src.connect(lpf).connect(gain).connect(ctx.destination);
      src.start();
      v8rAmbientNodesRef.current = { src, gain };
    } catch {}
  }, []);

  const v8rStopAmbient = useCallback(() => {
    const n = v8rAmbientNodesRef.current;
    if (n.gain) { n.gain.gain.setTargetAtTime(0, (v8rAudioCtxRef.current?.currentTime ?? 0), 0.3); }
    setTimeout(() => {
      try { n.src?.stop(); } catch {}
      n.gain?.disconnect();
      v8rAmbientNodesRef.current = {};
      try { v8rAudioCtxRef.current?.suspend(); } catch {}
    }, 800);
  }, []);

  useEffect(() => { if (v8rAmbientOn) v8rStartAmbient(); else v8rStopAmbient(); return v8rStopAmbient; }, [v8rAmbientOn]); // eslint-disable-line
  useEffect(() => { return () => v8rStopAmbient(); }, []); // eslint-disable-line

  // v8r: magic words
  const v8rMagicWords = new Set(['sparkle','shimmer','glow','gleam','glimmer','golden','amber','silver','crystal','jewel','magic','magical','spell','enchant','wish','wonder','dream','dreaming','dreamed','shadow','whisper','whispered','lantern','flame','fire','light','bright','moon','star','stars','constellation','sky','forest','hollow','path','river','bridge','leap','soar','fly','dance','spin','tumble','creature','spirit','ancient','secret','hidden','brave','courage','gentle','kind','bold','silence','still','quiet','hush','soft']);

  const v8rParseText = (text: string): string => {
    if (!v8rWordMagic) return text;
    return text.replace(/\b([A-Za-z']+)\b/g, (word) => {
      if (!v8rMagicWords.has(word.toLowerCase())) return word;
      return `<span class="v8r-mw" onclick="navigator.vibrate?.(6);this.style.animation='v8r-wordGlow .65s ease both';setTimeout(()=>this.style.animation='',700)">${word}</span>`;
    });
  };

  const renderV8rStoryText = (text: string) => {
    const baseStyle: React.CSSProperties = { fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 22, lineHeight: 1.78, letterSpacing: '.012em', color: 'rgba(244,239,232,.97)' };
    if (v8rWordMagic) return <div style={baseStyle} dangerouslySetInnerHTML={{ __html: v8rParseText(text) }} />;
    return <div style={baseStyle}>{text}</div>;
  };

  // v8r: moon dots
  const renderV8rMoonDots = () => {
    const total = Math.min(lrTotalPages, 7);
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 0 11px'}}>
        {[...Array(total)].map((_,i) => {
          const done = i < pageIdx - 1;
          const cur = i === pageIdx - 1;
          return <div key={i} style={{width:9,height:9,borderRadius:'50%',border:'1px solid rgba(245,184,76,.3)',background:done?'#F5B84C':cur?'rgba(245,184,76,.32)':'transparent',transition:'all .5s cubic-bezier(.2,.8,.3,1)',animation:cur?'v8r-moonPulse 2.5s ease-in-out infinite':'none',boxShadow:done?'0 0 6px rgba(245,184,76,.4)':'none'}}/>;
        })}
      </div>
    );
  };

  // v8r: nightfall stars
  const renderV8rNightfallStars = () => v8rStarOpacity < .01 ? null : (
    <svg style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,opacity:v8rStarOpacity}} viewBox="0 0 345 400" width="345" height="400">
      {[...Array(14)].map((_,i) => <circle key={i} cx={(i*31+12)%330} cy={(i*47+8)%380} r={i%3===0?.9:.5} fill={`rgba(255,255,255,${.4+(i%3)*.2})`}/>)}
    </svg>
  );

  // v8r: edge arrows
  const renderV8rEdges = () => (
    <>
      {pageIdx > 0 && <div style={{position:'absolute',top:0,bottom:0,left:0,width:44,zIndex:25,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(to right,rgba(255,255,255,.022),transparent)'}}><svg viewBox="0 0 20 36" width="10" height="18" fill="none" stroke="rgba(234,242,255,.3)" strokeWidth="2" strokeLinecap="round" style={{opacity:.28}}><path d="m14 4-8 14 8 14"/></svg></div>}
      <div style={{position:'absolute',top:0,bottom:0,right:0,width:44,zIndex:25,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(to left,rgba(255,255,255,.022),transparent)'}}><svg viewBox="0 0 20 36" width="10" height="18" fill="none" stroke="rgba(234,242,255,.3)" strokeWidth="2" strokeLinecap="round" style={{opacity:.28}}><path d="m6 4 8 14-8 14"/></svg></div>
      <div id="v8rIdleNudge" style={{position:'absolute',right:0,top:0,bottom:0,width:3,zIndex:28,background:'linear-gradient(to bottom,transparent 20%,rgba(245,184,76,.48) 50%,transparent 80%)',opacity:0,pointerEvents:'none'}}/>
    </>
  );

  // v8r: first page hint
  const renderV8rHint = () => pageIdx !== 1 ? null : (
    <div style={{position:'absolute',bottom:108,left:0,right:0,zIndex:35,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:7,animation:'v8r-hintFade 1s 3.5s ease both'}}>
      <div style={{display:'flex',gap:10}}>
        {['← prev','next →'].map(l=><div key={l} style={{padding:'6px 11px',background:'rgba(0,0,0,.55)',border:'1px solid rgba(255,255,255,.1)',borderRadius:18}}><span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.5)',letterSpacing:'.3px'}}>{l}</span></div>)}
      </div>
    </div>
  );

  // v8r: top bar
  const renderV8rTopBar = () => null;

  // v8r: control tray (library version)
  const renderV8rTray = () => (
    <>
      <div onClick={()=>setV8rTrayOpen(false)} style={{position:'absolute',inset:0,zIndex:58,background:v8rTrayOpen?'rgba(0,0,0,.52)':'rgba(0,0,0,0)',pointerEvents:v8rTrayOpen?'all':'none',transition:'background .28s'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:60,transform:v8rTrayOpen?'translateY(0)':'translateY(100%)',transition:'transform .36s cubic-bezier(.22,.8,.3,1)'}}>
        <div style={{background:'rgba(7,12,36,.97)',borderTop:'.5px solid rgba(255,255,255,.09)',borderRadius:'22px 22px 0 0',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',padding:'12px 18px 28px'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:14}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,.14)'}}/></div>
          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'0 0 8px',paddingLeft:2}}>LISTEN</div>
          <div style={{display:'flex',gap:7,marginBottom:10}}>
            <button onClick={()=>{setReadAloudActive(!readAloudActive);setV8rTrayOpen(false);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:readAloudActive?'rgba(245,184,76,.1)':'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:readAloudActive?'rgba(245,184,76,.8)':'rgba(234,242,255,.48)',letterSpacing:'.2px',textAlign:'center'}}>Story Voice</span>
            </button>
          </div>
          <div onClick={()=>{setV8rAmbientOn(p=>!p);setV8rTrayOpen(false);}} style={{padding:'10px 14px',borderRadius:14,border:v8rAmbientOn?'1px solid rgba(245,184,76,.22)':'1px solid rgba(255,255,255,.07)',background:v8rAmbientOn?'rgba(245,184,76,.08)':'rgba(255,255,255,.04)',display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:10}}>
            <div style={{fontSize:18,lineHeight:1,animation:v8rAmbientOn?'v8r-soundPulse 2s ease-in-out infinite':'none'}}>🌙</div>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:v8rAmbientOn?'rgba(245,184,76,.9)':'rgba(234,242,255,.6)',fontFamily:"'Nunito',sans-serif"}}>Night Sounds</div></div>
            <div style={{width:34,height:20,borderRadius:10,background:v8rAmbientOn?'#F5B84C':'rgba(255,255,255,.08)',position:'relative',transition:'background .2s',flexShrink:0}}><div style={{position:'absolute',top:3,left:v8rAmbientOn?17:3,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/></div>
          </div>
          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'12px 0 8px',paddingLeft:2}}>LEARN</div>
          <div style={{display:'flex',gap:7,marginBottom:10}}>
            <button onClick={()=>{setV8rWordMagic(p=>!p);setV8rTrayOpen(false);navigator.vibrate?.(8);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:v8rWordMagic?'rgba(245,184,76,.1)':'rgba(255,255,255,.04)',cursor:'pointer',position:'relative'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:v8rWordMagic?'rgba(245,184,76,.8)':'rgba(234,242,255,.48)',letterSpacing:'.2px'}}>Word Magic</span>
              {v8rWordMagic&&<div style={{position:'absolute',top:7,right:7,width:6,height:6,borderRadius:'50%',background:'#14d890'}}/>}
            </button>
            <button onClick={()=>{setLangPickerOpen(true);setV8rTrayOpen(false);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:lang!=='en'?'rgba(245,184,76,.1)':'rgba(255,255,255,.04)',cursor:'pointer',position:'relative'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:lang!=='en'?'rgba(245,184,76,.8)':'rgba(234,242,255,.48)',letterSpacing:'.2px'}}>Language</span>
              {lang!=='en'&&<div style={{position:'absolute',top:7,right:7,width:6,height:6,borderRadius:'50%',background:'#14d890'}}/>}
            </button>
            <button onClick={()=>{setLearningMode(!learningMode);setV8rTrayOpen(false);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:learningMode?'rgba(20,216,144,.1)':'rgba(255,255,255,.04)',cursor:'pointer',position:'relative'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:learningMode?'rgba(20,216,144,.8)':'rgba(234,242,255,.48)',letterSpacing:'.2px'}}>Learn Mode</span>
              {learningMode&&<div style={{position:'absolute',top:7,right:7,width:6,height:6,borderRadius:'50%',background:'#14d890'}}/>}
            </button>
          </div>
          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'4px 0 8px',paddingLeft:2}}>SHARE & EXIT</div>
          <div style={{display:'flex',gap:7}}>
            <button onClick={()=>{setV8rTrayOpen(false);setV8rShareOpen(true);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.48)'}}>Share</span>
            </button>
            <button onClick={()=>{setV8rTrayOpen(false);setView('library');}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.48)'}}>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // v8r: share modal (library version) — enhanced with platform options
  const renderV8rShareModal = () => {
    if (!v8rShareOpen) return null;
    const shareBtn = (icon: React.ReactNode, label: string, onClick: ()=>void) => (
      <div onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'11px 8px',borderRadius:16,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
        {icon}
        <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.5)'}}>{label}</span>
      </div>
    );
    return (
      <>
        <div onClick={()=>{setV8rShareOpen(false);setV8rLinkCopied(false);}} style={{position:'absolute',inset:0,zIndex:85,background:'rgba(0,0,0,.72)',animation:'v8r-shareReveal .2s ease both'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:88,background:'#0C1840',borderTop:'1px solid rgba(255,255,255,.09)',borderRadius:'24px 24px 0 0',animation:'v8r-shareReveal .36s cubic-bezier(.22,.8,.3,1) both'}}>
          <div style={{display:'flex',justifyContent:'center',padding:'14px 0 4px'}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,.15)'}}/></div>
          <div style={{padding:'10px 22px 14px',borderBottom:'.5px solid rgba(255,255,255,.07)'}}>
            <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(154,127,212,.6)',letterSpacing:'.8px',marginBottom:4}}>SHARE</div>
            <div style={{fontSize:18,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",letterSpacing:'-.3px',lineHeight:1.2}}>{story?.title??'This story'}</div>
          </div>
          <div style={{padding:'16px 22px 24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:14}}>
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(245,184,76,.85)" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
                v8rLinkCopied?'Copied!':'Copy link',
                ()=>{navigator.clipboard.writeText(shareLink).catch(()=>{});setV8rLinkCopied(true);navigator.vibrate?.(6);}
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(232,100,200,.8)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="18" cy="6" r="1.5" fill="rgba(232,100,200,.8)"/></svg>,
                'Instagram',
                ()=>{shareStoryCardForInstagram({title:story?.title??'',heroName:story?.heroName??'',refrain:story?.refrain,vibe:story?.vibe});setV8rShareOpen(false);}
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="rgba(37,211,102,.8)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
                'WhatsApp',
                ()=>window.open('https://wa.me/?text='+encodeURIComponent(`${story?.title} — a bedtime story\n\n${shareLink}`),'_blank')
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="rgba(234,242,255,.55)"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
                'More',
                handleShare
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:14}}>
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(111,231,221,.85)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                'Save PDF',
                async () => {
                  setV8rShareOpen(false);
                  const { generateStoryPdf } = await import('../lib/shareUtils');
                  const bd = story?.bookData || {};
                  await generateStoryPdf({
                    title: story?.title || bd.title || 'Story',
                    heroName: story?.heroName || bd.heroName || '',
                    refrain: story?.refrain || bd.refrain,
                    pages: bd.pages,
                    isAdventure: bd.isAdventure,
                    setup_pages: bd.setup_pages,
                    path_a: bd.path_a,
                    path_b: bd.path_b,
                  });
                }
              )}
            </div>
            {v8rLinkCopied&&<div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(20,216,144,.8)',textAlign:'center',marginBottom:8}}>✓ Link copied to clipboard</div>}
          </div>
        </div>
      </>
    );
  };

  // ── Loading / Error states ──
  if (loading) return <div className="lr-load"><style>{CSS}</style>Loading story&hellip;</div>;
  if (isPdfBook && !pdfDoc && !error) return <div className="lr-load"><style>{CSS}</style><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:12}}>📖</div>Loading picture book&hellip;</div></div>;
  if (error || !story) return (
    <div className="lr-err">
      <style>{CSS}</style>
      <div style={{ fontSize: 42, marginBottom: 16 }}>{'\uD83C\uDF19'}</div>
      <h2>Story not found</h2>
      <p>{error || 'This story may have been removed.'}</p>
      <button className="lr-ghost-btn" onClick={() => setView('library')}>{'\u2190'} Back to library</button>
    </div>
  );

  // ── Derived state ──
  const pages = isPdfBook ? [] : (story.bookData?.pages || story.bookData?.setup_pages || []);
  const totalPages = isPdfBook ? (pdfPageCount + 1) : (2 + pages.length); // +1 for end page on PDF books
  const isLast = pageIdx === totalPages - 1;
  const isStoryPage = isPdfBook ? (pageIdx >= 0 && pageIdx < pdfPageCount) : (pageIdx >= 1 && !isLast);
  const seed = parseInt(strHash(story.title + (story.heroName || '')), 36) || 0;
  const Scene = getSceneByVibe(seed, story.vibe);
  const displayTitle = personalise(story.title);
  const displayHero = nameMap[story.heroName] || story.heroName;
  const isNotLoggedIn = !user || user.isGuest;
  const isFreeUser = user && !user.isGuest && !isSubscribed;
  const chromeOpacity = isStoryPage ? (chromeVisible ? 1 : 0.25) : 1;

  // ── Personalisation gate ──
  if (showGate) {
    const chars = story.bookData?.allChars || [];
    return (
      <div className="lr-gate">
        <style>{CSS}</style>
        <div className="lr-gate-scene"><Scene /></div>
        <div className="lr-gate-h">Make this story yours</div>
        <div className="lr-gate-p">Swap in your child's name before you start reading</div>
        <div className="lr-gate-fields">
          {chars.map((c: any) => (
            <div className="lr-gate-field" key={c.name}>
              <div className="lr-gate-lbl">{c.type || 'Character'}: {c.name}</div>
              <input className="lr-gate-input" placeholder={c.name}
                value={nameInputs[c.name] || ''}
                onChange={e => setNameInputs(prev => ({ ...prev, [c.name]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button className="lr-gate-btn" onClick={handleStartReading}>Start reading {'\u2192'}</button>
        <button className="lr-gate-skip" onClick={() => setShowGate(false)}>Read as written {'\u2192'}</button>
      </div>
    );
  }

  // ── Build pages array for carousel ──
  const renderCoverPage = () => (
    <div className="lr-page lr-cover" key="cover">
      {story.coverUrl ? (
        <div className="lr-cover-scene" style={{ background: '#000' }}>
          <img src={story.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        </div>
      ) : (
        <div className="lr-cover-scene"><Scene /></div>
      )}
      <div className="lr-cover-vig" />
      <div className="lr-cover-grad" />
      <div className="lr-cover-text">
        <div className="lr-cover-stars">{'\u2726'} {'\u00B7'} {'\u2726'} {'\u00B7'} {'\u2726'}</div>
        <div className="lr-cover-title">{displayTitle}</div>
        <div className="lr-cover-for">A story for <b>{displayHero}</b></div>
        <div className="lr-cover-brand">SleepSeed {story.coverUrl ? '\u00B7 Curated' : '\u00B7 Made tonight'}</div>
      </div>
      {/* Tap zone to advance from cover */}
      <div style={{position:'absolute',inset:0,zIndex:10,cursor:'pointer'}} onClick={()=>goPage(1)} />
    </div>
  );

  const renderStoryPage = (pgIndex: number) => {
    const pg = pages[pgIndex];
    if (!pg) return <div className="lr-page" key={`sp-${pgIndex}`} />;
    const pageText = personalise(pg.text || '');
    const pageNum = pgIndex + 1;
    const translatedPage = translatedPages[pgIndex];
    const isTranslated = lang !== 'en' && translatedPage && translatedPage.sentences.length > 0;
    const showRefrain = story.refrain && (pageNum % 2 === 0 || pgIndex === pages.length - 1);

    return (
      <div className="lr-page lr-sp" key={`sp-${pgIndex}`}>
        <div className="lr-sp-scene">
          <Scene />
          <div className="lr-sp-fade" />
        </div>
        <div className="lr-sp-body">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
            <div className="lr-sp-pgnum" style={{margin:0}}>{'\u00B7'} {pageNum} {'\u00B7'}{isTranslated ? ` ${lang.toUpperCase()}` : ''}</div>
            <button
              onClick={() => {
                if (readAloudActive && pgIndex === pageIdx) {
                  setReadAloudActive(false);
                } else {
                  setReadAloudActive(true);
                  if (pgIndex !== pageIdx) goPage(pgIndex - pageIdx);
                }
              }}
              style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'6px 14px',borderRadius:50,cursor:'pointer',
                border: readAloudActive && pgIndex === pageIdx
                  ? '1px solid rgba(245,184,76,.35)'
                  : '1px solid rgba(255,255,255,.1)',
                background: readAloudActive && pgIndex === pageIdx
                  ? 'rgba(245,184,76,.12)'
                  : 'rgba(255,255,255,.04)',
                transition:'all .2s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={readAloudActive && pgIndex === pageIdx ? '#F5B84C' : 'rgba(244,239,232,.45)'}
                strokeWidth="2" strokeLinecap="round">
                {readAloudActive && pgIndex === pageIdx ? (
                  <>
                    <rect x="6" y="4" width="4" height="16" rx="1" fill={readAloudActive ? '#F5B84C' : 'currentColor'} stroke="none" />
                    <rect x="14" y="4" width="4" height="16" rx="1" fill={readAloudActive ? '#F5B84C' : 'currentColor'} stroke="none" />
                  </>
                ) : (
                  <polygon points="5,3 19,12 5,21" fill="rgba(244,239,232,.45)" stroke="none" />
                )}
              </svg>
              <span style={{
                fontSize:10,fontWeight:700,
                fontFamily:"'Nunito',sans-serif",
                color: readAloudActive && pgIndex === pageIdx ? 'rgba(245,184,76,.9)' : 'rgba(244,239,232,.4)',
              }}>
                {readAloudActive && pgIndex === pageIdx ? 'Stop' : 'Read aloud'}
              </span>
            </button>
          </div>
          {translateError && (
            <div style={{fontSize:11,color:'rgba(180,80,20,.6)',fontStyle:'italic',marginBottom:6}}>{translateError}</div>
          )}
          <div className="lr-sp-text">
            {translating ? (
              <div style={{textAlign:'center',color:'var(--cream-faint)',fontStyle:'italic'}}>Translating{'\u2026'}</div>
            ) : isTranslated && learningMode ? (
              <InterlinearText
                key={`interlinear-${pgIndex}`}
                sentences={translatedPage.sentences}
                theme="dark"
                foreignStyle={{fontFamily:"var(--hand)",fontSize:'clamp(17px,4.5vw,21px)',color:'var(--cream)',lineHeight:1.75}}
                englishStyle={{fontFamily:"var(--sans)",fontSize:'clamp(14px,3.8vw,17px)',color:'rgba(245,184,76,.85)',lineHeight:1.65}}
                autoPlay={readAloudActive && pgIndex === pageIdx}
                onFinish={() => { if (isLast) setReadAloudActive(false); else goPage(1); }}
              />
            ) : isTranslated ? (
              <ReadAloudText
                key={`translated-${pgIndex}`}
                text={translatedPage.sentences.map(s => s.foreign).join(' ')}
                theme="dark"
                className="lr-sp-text-inner"
                hideControls
                autoPlay={readAloudActive && pgIndex === pageIdx}
                onFinish={() => { if (isLast) setReadAloudActive(false); else goPage(1); }}
                voiceId={selectedVoiceId}
              />
            ) : (
              <ReadAloudText
                key={`page-${pgIndex}`}
                text={pageText}
                theme="dark"
                className="lr-sp-text-inner"
                hideControls
                autoPlay={readAloudActive && pgIndex === pageIdx}
                onFinish={() => { if (isLast) setReadAloudActive(false); else goPage(1); }}
                voiceId={selectedVoiceId}
              />
            )}
          </div>
          {showRefrain && <div className="lr-sp-refrain">{'\u201C'}{personalise(story.refrain!)}{'\u201D'}</div>}
        </div>
        {/* Tap zones */}
        <div className="lr-tap lr-tap-l" onClick={() => goPage(-1)} onTouchEnd={e => { e.stopPropagation(); goPage(-1); }} />
        <div className="lr-tap lr-tap-r" onClick={() => goPage(1)} onTouchEnd={e => { e.stopPropagation(); goPage(1); }} />
      </div>
    );
  };

  const renderEndPage = () => (
    <div className="lr-page lr-end" key="end">
      <div className="lr-end-moon">{'\uD83C\uDF19'}</div>
      <div className="lr-end-title">The End</div>
      {story.refrain && <div className="lr-end-refrain">{'\u201C'}{personalise(story.refrain)}{'\u201D'}</div>}
      <div className="lr-end-msg">Sweet dreams, {displayHero}.<br/>Tomorrow night, another adventure awaits{'\u2026'}</div>

      <div className="lr-end-btns">
        {/* Voting */}
        <div className="lr-post-card">
          <div className="lr-vote-q">Did you enjoy this story?</div>
          {isNotLoggedIn ? (
            <div>
              <div className="lr-vote-row">
                <button className="lr-vote-btn up" onClick={() => setView('auth')}>{'\uD83D\uDC4D'} {localUp}</button>
                <button className="lr-vote-btn down" onClick={() => setView('auth')}>{'\uD83D\uDC4E'} {localDown}</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cream-faint)', marginTop: 8, textAlign: 'center' }}>Create a free account to vote</div>
            </div>
          ) : (
            <>
              <div className="lr-vote-row">
                <button className={`lr-vote-btn up${myVote === 1 ? ' voted' : ''}`} onClick={() => handleVote(1)}>{'\uD83D\uDC4D'} {localUp}</button>
                <button className={`lr-vote-btn down${myVote === -1 ? ' voted' : ''}`} onClick={() => handleVote(-1)}>{'\uD83D\uDC4E'} {localDown}</button>
              </div>
              {showDownNote && (
                <div className="lr-vote-note">
                  <input placeholder="What didn't work for you? (optional)" value={downNote} onChange={e => setDownNote(e.target.value)} />
                  <button className="lr-vote-note-btn" onClick={handleDownNoteSubmit}>Submit</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Favourites */}
        {isSubscribed && (
          <button className={`lr-fav-btn${isFav ? ' saved' : ''}`} onClick={toggleFav}>
            {isFav ? '\u2764\uFE0F Saved' : '\uD83E\uDD0D Save to favourites'}
          </button>
        )}

        {/* Share */}
        <button className="lr-ghost-btn" onClick={handleShare}>
          {copied ? '\u2713 Copied!' : '\uD83D\uDCF1 Share this story'}
        </button>

        {/* Download PDF */}
        <button className="lr-ghost-btn" onClick={async () => {
          const { generateStoryPdf } = await import('../lib/shareUtils');
          const bd = story?.bookData || {};
          await generateStoryPdf({
            title: story?.title || bd.title || 'Story',
            heroName: story?.heroName || bd.heroName || '',
            refrain: story?.refrain || bd.refrain,
            pages: bd.pages,
            isAdventure: bd.isAdventure,
            setup_pages: bd.setup_pages,
            path_a: bd.path_a,
            path_b: bd.path_b,
          });
        }}>
          {'\uD83D\uDCC4'} Download PDF
        </button>

        {/* Guest CTA */}
        {(isNotLoggedIn || isFreeUser) && (
          <div className="lr-post-card" style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--serif)',fontSize:17,fontWeight:700,marginBottom:6}}>
              Did {displayHero} feel like your child's story?
            </div>
            <div style={{fontSize:13,color:'var(--cream-dim)',lineHeight:1.65,marginBottom:14}}>
              Put your child's name in every story.
            </div>
            <button className="lr-gate-btn" style={{maxWidth:'100%'}} onClick={() => setView('auth')}>Start free {'\u2192'}</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>

      {/* Language picker modal */}
      <LanguagePicker
        language={lang}
        learningMode={learningMode}
        onChange={handleLanguageChange}
        hideTrigger
        externalOpen={langPickerOpen}
        onClose={() => setLangPickerOpen(false)}
      />

      <div className="lr-reader" ref={readerRef}>
        {/* Progress bar */}
        <div className="lr-pbar" style={{ width: `${totalPages > 1 ? (pageIdx / (totalPages - 1)) * 100 : 0}%` }} />

        {/* Back + Menu buttons */}
        <div style={{position:'absolute',top:0,left:0,right:0,zIndex:70,padding:'max(14px,env(safe-area-inset-top)) 14px 0',display:'flex',alignItems:'center',justifyContent:'space-between',pointerEvents:'none'}}>
          <button onClick={()=>setView('library')} style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',pointerEvents:'all',backdropFilter:'blur(8px)'}}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="rgba(234,242,255,.7)" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={()=>{setV8rTrayOpen(true);setV8rShareOpen(false);}} style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',pointerEvents:'all',backdropFilter:'blur(8px)'}}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="rgba(234,242,255,.7)" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* Tray + Share modal */}
        {renderV8rTray()}
        {renderV8rShareModal()}

        {/* Bottom chrome */}
        <div className="lr-bot" style={{ opacity: chromeOpacity }}>
          <button className="lr-arrow" disabled={pageIdx === 0} onClick={() => goPage(-1)}>{'\u2039'}</button>
          <div className="lr-dots-wrap">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} className={`lr-dot2${i === pageIdx ? ' active' : ''}`}
                onClick={() => setPageIdx(i)} />
            ))}
          </div>
          <button className="lr-arrow" disabled={isLast} onClick={() => goPage(1)}>{'\u203A'}</button>
        </div>

        {/* Page carousel */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="lr-track" style={{ transform: `translateX(${-pageIdx * 100}vw)` }}>
            {isPdfBook ? (
              /* PDF picture book — render each page as a canvas + end page */
              <>
                {Array.from({ length: pdfPageCount }).map((_, i) => (
                  <div key={`pdf-${i}`} className="lr-page" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <canvas
                      ref={el => { if (el) pdfCanvasRefs.current.set(i, el); }}
                      style={{ maxWidth: '100%', maxHeight: '100dvh', objectFit: 'contain' }}
                    />
                    {/* Tap zones */}
                    <div className="lr-tap lr-tap-l" onClick={() => goPage(-1)} />
                    <div className="lr-tap lr-tap-r" onClick={() => goPage(1)} />
                  </div>
                ))}
                {renderEndPage()}
              </>
            ) : (
              <>
                {renderCoverPage()}
                {pages.map((_: any, i: number) => renderStoryPage(i))}
                {renderEndPage()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Controls sheet ── */}
      {sheetOpen && (
        <>
          <div className="lr-sheet-bg" onClick={() => setSheetOpen(false)} />
          <div className="lr-sheet">
            <div className="lr-sheet-handle" />
            <div className="lr-sheet-scroll">
              {/* Section 1: Narration */}
              <div className="lr-sheet-section">
                <div className="lr-sheet-row" onClick={() => setReadAloudActive(r => !r)}>
                  <div className="lr-sheet-ico" style={{background:'rgba(245,184,76,.12)'}}>{'\uD83D\uDD0A'}</div>
                  <div className="lr-sheet-body">
                    <div className="lr-sheet-label">Read Aloud</div>
                    <div className="lr-sheet-sub">{PRESET_VOICES.find(v => v.id === selectedVoiceId)?.name || 'Hope'}</div>
                  </div>
                  <button className={`lr-sheet-toggle${readAloudActive ? ' on' : ''}`} onClick={e => { e.stopPropagation(); setReadAloudActive(r => !r); }}>
                    <div className="lr-sheet-knob" />
                  </button>
                </div>
                <div className="lr-sheet-row" onClick={() => { setSheetOpen(false); setVoicePickerOpen(true); }}>
                  <div className="lr-sheet-ico" style={{background:'rgba(148,130,255,.12)'}}>{'\uD83C\uDFA4\uFE0F'}</div>
                  <div className="lr-sheet-body">
                    <div className="lr-sheet-label">Choose Voice</div>
                    <div className="lr-sheet-sub">6 narrators</div>
                  </div>
                  <div className="lr-sheet-chevron">{'\u203A'}</div>
                </div>
              </div>

              <div className="lr-sheet-sep" />

              {/* Section 2: Language */}
              <div className="lr-sheet-section">
                <div className="lr-sheet-row" onClick={() => { setSheetOpen(false); setLangPickerOpen(true); }}>
                  <div className="lr-sheet-ico" style={{background:'rgba(20,216,144,.12)'}}>{LANGUAGES.find(l => l.code === lang)?.flag || '\uD83C\uDF10'}</div>
                  <div className="lr-sheet-body">
                    <div className="lr-sheet-label">Story Language</div>
                    <div className="lr-sheet-sub">{LANGUAGES.find(l => l.code === lang)?.label || 'English'}</div>
                  </div>
                  <div className="lr-sheet-chevron">{'\u203A'}</div>
                </div>
                {lang !== 'en' && (
                  <div className="lr-sheet-row" onClick={() => setLearningMode(l => !l)}>
                    <div className="lr-sheet-ico" style={{background:'rgba(148,130,255,.12)'}}>{'\uD83D\uDCD6'}</div>
                    <div className="lr-sheet-body">
                      <div className="lr-sheet-label">Learning Mode</div>
                      <div className="lr-sheet-sub">Interlinear translation</div>
                    </div>
                    <button className={`lr-sheet-toggle${learningMode ? ' on' : ''}`} onClick={e => { e.stopPropagation(); setLearningMode(l => !l); }}>
                      <div className="lr-sheet-knob" />
                    </button>
                  </div>
                )}
              </div>

              <div className="lr-sheet-sep" />

              {/* Section 3: Actions */}
              <div className="lr-sheet-section">
                <div className="lr-sheet-row" onClick={() => { setSheetOpen(false); handleShare(); }}>
                  <div className="lr-sheet-ico" style={{background:'rgba(244,239,232,.06)'}}>{'\uD83D\uDD17'}</div>
                  <div className="lr-sheet-body">
                    <div className="lr-sheet-label">{copied ? 'Copied!' : 'Share Story'}</div>
                  </div>
                </div>
                {user && !user.isGuest && (
                  <div className="lr-sheet-row" onClick={() => { toggleFav(); setSheetOpen(false); }}>
                    <div className="lr-sheet-ico" style={{background:'rgba(245,184,76,.12)'}}>{isFav ? '\u2B50' : '\u2606'}</div>
                    <div className="lr-sheet-body">
                      <div className="lr-sheet-label">{isFav ? 'Saved to Favourites' : 'Add to Favourites'}</div>
                    </div>
                  </div>
                )}
                <div className="lr-sheet-row" onClick={() => { setSheetOpen(false); setView('library'); }}>
                  <div className="lr-sheet-ico" style={{background:'rgba(244,239,232,.06)'}}>{'\u2190'}</div>
                  <div className="lr-sheet-body">
                    <div className="lr-sheet-label">Back to Library</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Voice picker sheet ── */}
      {voicePickerOpen && (
        <>
          <div className="lr-sheet-bg" onClick={() => setVoicePickerOpen(false)} />
          <div className="lr-vpick">
            <div className="lr-sheet-handle" />
            <div style={{textAlign:'center',padding:'0 16px 12px'}}>
              <div style={{fontFamily:'var(--sans)',fontSize:16,fontWeight:700,color:'var(--cream)',marginBottom:4}}>Choose a Voice</div>
              <div style={{fontSize:12,color:'var(--cream-faint)'}}>Tap to preview, then close to use</div>
            </div>
            <div className="lr-vpick-list">
              {PRESET_VOICES.map(v => (
                <div key={v.id} className={`lr-vpick-item${selectedVoiceId === v.id ? ' sel' : ''}`}
                  onClick={async () => {
                    setSelectedVoiceId(v.id);
                    try { localStorage.setItem('sleepseed_voice_id', v.id); } catch {}
                    setPreviewingVoice(v.id);
                    try {
                      const res = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: 'Once upon a time, in a land of dreams...', voiceId: v.id, speed: 1.0 }),
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = new Audio(url);
                        a.play();
                        a.onended = () => URL.revokeObjectURL(url);
                      }
                    } catch {}
                    setPreviewingVoice(null);
                  }}>
                  <span style={{fontSize:20,width:32,textAlign:'center'}}>{v.emoji}</span>
                  <div className="lr-vpick-name">{v.name}</div>
                  <div className="lr-vpick-desc">{v.desc}</div>
                  {previewingVoice === v.id && <span style={{fontSize:11,color:'var(--amber)'}}>Playing{'\u2026'}</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
