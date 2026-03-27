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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400&family=Patrick+Hand&family=Kalam:wght@300;400;700&display=swap');
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

/* ── Full-screen reader shell ── */
.lr-reader{position:fixed;inset:0;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;overflow:hidden;z-index:50}

/* ── Progress bar ── */
.lr-pbar{position:absolute;top:0;left:0;height:3px;z-index:30;background:linear-gradient(90deg,#E8972A,#F5B84C);transition:width 0.5s cubic-bezier(0.4,0,0.2,1);border-radius:0 2px 2px 0}

/* ── Top chrome ── */
.lr-top{position:absolute;top:0;left:0;right:0;z-index:25;padding:max(14px,env(safe-area-inset-top)) 20px 14px;display:flex;align-items:center;justify-content:space-between;transition:opacity 0.4s ease;pointer-events:none}
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
.lr-page{width:100%;height:100dvh;flex-shrink:0;overflow:hidden;position:relative}

/* ── Tap zones ── */
.lr-tap{position:absolute;z-index:15;top:70px;bottom:80px}
.lr-tap-l{left:0;width:40%}
.lr-tap-r{right:0;width:40%}

/* ── Sparkles ── */
.lr-sparkle{position:fixed;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:40;animation:lrSparkle 0.7s ease-out forwards}

/* ── Cover page ── */
.lr-cover{display:flex;flex-direction:column;height:100dvh;overflow:hidden;background:var(--night)}
.lr-cover-scene{position:absolute;inset:0;z-index:0}
.lr-cover-vig{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 30%,rgba(6,9,18,0.6));z-index:1}
.lr-cover-grad{position:absolute;bottom:0;left:0;right:0;height:65%;background:linear-gradient(to top,#060912 35%,transparent);z-index:2}
.lr-cover-text{position:absolute;bottom:0;left:0;right:0;z-index:3;padding:0 28px 108px;text-align:center}
.lr-cover-stars{font-size:10px;color:var(--amber);letter-spacing:10px;margin-bottom:10px;opacity:.7}
.lr-cover-title{font-family:var(--serif);font-weight:700;font-size:clamp(26px,7.5vw,38px);color:var(--cream);line-height:1.15;margin-bottom:10px}
.lr-cover-for{font-family:var(--sans);font-size:14px;color:var(--cream-dim)}
.lr-cover-for b{color:var(--amber);font-weight:700}
.lr-cover-brand{font-family:var(--serif);font-size:10px;color:var(--cream-faint);text-transform:uppercase;letter-spacing:.15em;margin-top:14px}

/* ── Story page ── */
.lr-sp{display:flex;flex-direction:column;height:100dvh;overflow:hidden}
.lr-sp-scene{height:46%;flex-shrink:0;position:relative;overflow:hidden}
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
    try { return localStorage.getItem('sleepseed_voice_id') || 'iCrDUkL56s3C8sCRl7wb'; } catch { return 'iCrDUkL56s3C8sCRl7wb'; }
  });
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [chromeVisible, setChromeVisible] = useState(true);

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
    setReadAloudActive(false);
    setPageIdx(p => {
      if (!story) return p;
      const pgs = story.bookData?.pages || story.bookData?.setup_pages || [];
      const total = 2 + pgs.length;
      return Math.max(0, Math.min(total - 1, p + dir));
    });
  }, [story]);

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

  // ── Loading / Error states ──
  if (loading) return <div className="lr-load"><style>{CSS}</style>Loading story\u2026</div>;
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
  const pages = story.bookData?.pages || story.bookData?.setup_pages || [];
  const totalPages = 2 + pages.length;
  const isLast = pageIdx === totalPages - 1;
  const isStoryPage = pageIdx >= 1 && !isLast;
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
      <div className="lr-cover-scene"><Scene /></div>
      <div className="lr-cover-vig" />
      <div className="lr-cover-grad" />
      <div className="lr-cover-text">
        <div className="lr-cover-stars">{'\u2726'} {'\u00B7'} {'\u2726'} {'\u00B7'} {'\u2726'}</div>
        <div className="lr-cover-title">{displayTitle}</div>
        <div className="lr-cover-for">A story for <b>{displayHero}</b></div>
        <div className="lr-cover-brand">SleepSeed {'\u00B7'} Made tonight</div>
      </div>
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
          <div className="lr-sp-pgnum">{'\u00B7'} {pageNum} {'\u00B7'}{isTranslated ? ` ${lang.toUpperCase()}` : ''}</div>
          {translateError && (
            <div style={{fontSize:11,color:'rgba(180,80,20,.6)',fontStyle:'italic',marginBottom:6}}>{translateError}</div>
          )}
          <div className="lr-sp-text">
            {translating ? (
              <div style={{textAlign:'center',color:'var(--cream-faint)',fontStyle:'italic'}}>Translating\u2026</div>
            ) : isTranslated && learningMode ? (
              <InterlinearText
                sentences={translatedPage.sentences}
                theme="light"
                foreignStyle={{fontFamily:"var(--hand)",fontSize:'clamp(17px,4.5vw,21px)',color:'var(--cream)',lineHeight:1.75}}
                englishStyle={{fontFamily:"var(--sans)"}}
                autoPlay={readAloudActive}
                onFinish={() => setReadAloudActive(false)}
              />
            ) : isTranslated ? (
              <ReadAloudText
                text={translatedPage.sentences.map(s => s.foreign).join(' ')}
                theme="dark"
                className="lr-sp-text-inner"
                autoPlay={readAloudActive}
                onFinish={() => setReadAloudActive(false)}
                voiceId={selectedVoiceId}
              />
            ) : (
              <ReadAloudText
                text={pageText}
                theme="dark"
                className="lr-sp-text-inner"
                autoPlay={readAloudActive}
                onFinish={() => setReadAloudActive(false)}
                voiceId={selectedVoiceId}
              />
            )}
          </div>
          {showRefrain && <div className="lr-sp-refrain">{'\u201C'}{personalise(story.refrain!)}{'\u201D'}</div>}
        </div>
        {/* Tap zones */}
        <div className="lr-tap lr-tap-l" onTouchEnd={e => { e.stopPropagation(); goPage(-1); }} />
        <div className="lr-tap lr-tap-r" onTouchEnd={e => { e.stopPropagation(); goPage(1); }} />
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

        {/* Top chrome */}
        <div className="lr-top" style={{ opacity: chromeOpacity }}>
          <div className="lr-top-logo" onClick={() => setView('library')}>
            <div className="lr-top-moon" /> SleepSeed
          </div>
          <button className="lr-top-btn" onClick={() => setSheetOpen(true)}>{'\u22EF'}</button>
        </div>

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
          <div className="lr-track" style={{ transform: `translateX(${-pageIdx * 100}%)` }}>
            {renderCoverPage()}
            {pages.map((_: any, i: number) => renderStoryPage(i))}
            {renderEndPage()}
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
                  {previewingVoice === v.id && <span style={{fontSize:11,color:'var(--amber)'}}>Playing\u2026</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
