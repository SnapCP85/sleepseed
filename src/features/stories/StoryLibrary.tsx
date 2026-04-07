import { useState, useEffect, useMemo, useRef } from 'react';
import { getStories, deleteStory, getCharacters, submitStoryToLibrary, removeStoryFromLibrary, getFriends, shareStoryWithFriend, getSharedStories, markSharedStoryRead, getNightCards } from '../../lib/storage';
import type { Friend, SharedStory } from '../../lib/storage';
import type { SavedStory, Character, SavedNightCard } from '../../lib/types';
import { useApp } from '../../AppContext';
import { generateCoverSVG } from '../../lib/svg-cover-generator';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Tonight';
    if (diff === 1) return 'Last night';
    if (diff < 7) return `${diff} nights ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function shortDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function numberWord(n: number): string {
  const w = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty',
    'Twenty-one','Twenty-two','Twenty-three','Twenty-four','Twenty-five'];
  return n <= 25 ? w[n] : String(n);
}

function vibeToBucket(vibe?: string): string {
  if (!vibe) return 'wonder-cozy';
  const map: Record<string, string> = {
    calm: 'wonder-cozy', cosy: 'wonder-cozy', heartfelt: 'emotional-truth',
    exciting: 'funny-playful', adventure: 'funny-playful',
    funny: 'funny-playful', silly: 'funny-playful',
    mysterious: 'wonder-cozy', dreamy: 'wonder-cozy',
    brave: 'emotional-truth', wonder: 'wonder-cozy',
    therapeutic: 'emotional-truth', comedy: 'funny-playful',
  };
  return map[vibe] || 'wonder-cozy';
}

const VIBE_LABELS: Record<string, string> = {
  calm: 'Cozy', cosy: 'Cozy', heartfelt: 'Heartfelt', exciting: 'Adventure',
  adventure: 'Adventure', funny: 'Funny', silly: 'Silly', mysterious: 'Mystery',
  dreamy: 'Dreamy', brave: 'Brave', wonder: 'Wonder', therapeutic: 'Heartfelt',
  comedy: 'Funny',
};

const AGE_LABELS: Record<string, string> = {
  age3: '3–5', age5: '5–7', age7: '7–9', age10: '9+',
};

function storySubtitle(s: SavedStory): string {
  if (s.refrain) return s.refrain;
  if (s.theme && s.theme.length < 80) return s.theme;
  return '';
}

// ── CSS ──────────────────────────────────────────────────────────────────────
// Uses the ml-* (memory library) design system for visual unity with the Memories page

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ml-night:#060912;--ml-amber:#F5B84C;--ml-amber-deep:#a8782b;--ml-amber-dim:#c99436;
  --ml-teal:#14d890;--ml-purple:#9482ff;--ml-cream:#F4EFE8;--ml-cream-dim:#d8d1c5;
  --ml-ink:#2a2620;--ml-ink-dim:#6b6359;--ml-ink-faint:#9a9185;
  --ml-hairline:rgba(42,38,32,0.09);
  --ml-serif:'Fraunces',Georgia,serif;--ml-sans:'Nunito',system-ui,sans-serif;--ml-mono:'DM Mono',monospace;
}

/* ─── Animations ─── */
@keyframes slFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes slCardIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes slFadein{from{opacity:0}to{opacity:1}}
@keyframes slSlideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slStarBreathe{0%,100%{opacity:.85}50%{opacity:1}}
@keyframes slGlowPulse{0%,100%{opacity:.1}50%{opacity:.2}}
@keyframes slTileIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes slHeroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes slFoilShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

/* ─── Page ─── */
.sl-page{
  min-height:100vh;width:100%;max-width:100vw;font-family:var(--ml-sans);color:var(--ml-cream);-webkit-font-smoothing:antialiased;
  background:
    radial-gradient(ellipse 90% 35% at 50% 0%,#141c30 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 45%,rgba(148,130,255,0.06) 0%,transparent 55%),
    radial-gradient(ellipse 70% 40% at 20% 75%,rgba(245,184,76,0.035) 0%,transparent 60%),
    var(--ml-night);
  padding-bottom:96px;position:relative;overflow-x:hidden;
}
/* Breathing starfield */
.sl-page::before{
  content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
  animation:slStarBreathe 8s ease-in-out infinite;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 8%,rgba(255,255,255,0.6),transparent),
    radial-gradient(1px 1px at 28% 15%,rgba(255,255,255,0.45),transparent),
    radial-gradient(1.5px 1.5px at 45% 10%,rgba(255,255,255,0.55),transparent),
    radial-gradient(1px 1px at 62% 18%,rgba(255,255,255,0.4),transparent),
    radial-gradient(1.5px 1.5px at 78% 6%,rgba(255,255,255,0.55),transparent),
    radial-gradient(1px 1px at 88% 22%,rgba(255,255,255,0.4),transparent),
    radial-gradient(1px 1px at 8% 32%,rgba(255,255,255,0.35),transparent),
    radial-gradient(1.5px 1.5px at 35% 38%,rgba(255,255,255,0.5),transparent),
    radial-gradient(1px 1px at 55% 45%,rgba(255,255,255,0.3),transparent),
    radial-gradient(1.5px 1.5px at 72% 42%,rgba(255,255,255,0.45),transparent),
    radial-gradient(1px 1px at 92% 48%,rgba(255,255,255,0.35),transparent),
    radial-gradient(1px 1px at 18% 58%,rgba(255,255,255,0.35),transparent),
    radial-gradient(1.5px 1.5px at 42% 65%,rgba(255,255,255,0.45),transparent),
    radial-gradient(1px 1px at 68% 72%,rgba(255,255,255,0.3),transparent);
}
.sl-page>*{position:relative;z-index:1}

/* ─── Inner wrapper — single centering container ─── */
.sl-inner{width:100%;max-width:440px;margin:0 auto;padding:0 16px;position:relative;z-index:1;overflow:hidden}

/* ─── Top bar ─── */
.sl-topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 0 28px}
.sl-topbtn{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.08);color:var(--ml-cream-dim);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sl-topbtn:hover{background:rgba(245,184,76,0.08);border-color:rgba(245,184,76,0.3);color:var(--ml-amber)}
.sl-toptitle{font-family:var(--ml-serif);font-weight:400;font-size:18px;color:var(--ml-cream);opacity:.92}

/* ─── Search panel ─── */
.sl-search-panel{overflow:hidden;transition:max-height .35s cubic-bezier(.22,.61,.36,1),opacity .25s ease;opacity:0;max-height:0}
.sl-search-panel.open{max-height:140px;opacity:1;margin-bottom:16px}
.sl-search-input{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(244,239,232,.08);border-radius:14px;padding:11px 14px;font-size:13px;color:var(--ml-cream);outline:none;font-family:var(--ml-sans);transition:border-color .2s}
.sl-search-input:focus{border-color:rgba(245,184,76,.3)}
.sl-search-input::placeholder{color:rgba(255,255,255,.18)}
.sl-filter-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.sl-filter-chip{display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:16px;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);font-family:var(--ml-sans);font-size:11px;font-weight:500;color:rgba(234,242,255,.3)}
.sl-filter-chip.on{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.28);color:#F5B84C;font-weight:600}
.sl-filter-clear{display:flex;align-items:center;padding:5px 10px;border-radius:16px;cursor:pointer;background:rgba(200,80,80,.08);border:1px solid rgba(200,80,80,.2);font-size:9px;color:rgba(255,140,130,.6);font-family:var(--ml-mono)}

/* ─── Narrative band ─── */
.sl-narrative{padding:42px 4px 36px;text-align:center;position:relative}
.sl-narrative::before,.sl-narrative::after{content:'';position:absolute;left:50%;transform:translateX(-50%);width:60px;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.35),transparent)}
.sl-narrative::before{top:12px}
.sl-narrative::after{bottom:12px}
.sl-narrative-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 100% at 50% 50%,rgba(245,184,76,0.04) 0%,transparent 60%)}
.sl-narrative-text{font-family:var(--ml-serif);font-size:15px;line-height:1.6;color:var(--ml-cream);opacity:.78;letter-spacing:-.003em;max-width:340px;margin:0 auto;position:relative;z-index:1}

/* ─── Origin hero ─── */
.sl-origin-hero{text-align:center;padding:4px 0 10px}
.sl-origin-eyebrow{font-family:var(--ml-mono);font-size:9px;letter-spacing:.28em;color:var(--ml-amber);text-transform:uppercase;opacity:.82;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:10px}
.sl-origin-diamond{font-size:5px;opacity:.7}
.sl-origin-reason{font-family:var(--ml-serif);font-style:italic;font-size:16px;line-height:1.5;color:var(--ml-cream);opacity:.82;max-width:300px;margin:0 auto 26px;letter-spacing:-.002em}
.sl-origin-card{
  width:260px;margin:0 auto;border-radius:14px;overflow:hidden;cursor:pointer;
  position:relative;
  animation:slHeroFloat 4s ease-in-out infinite;
  border:1px solid rgba(245,184,76,.12);
  box-shadow:
    0 2px 4px rgba(0,0,0,0.2),
    0 20px 40px -15px rgba(0,0,0,0.5),
    0 40px 80px -25px rgba(0,0,0,0.8),
    0 0 70px -18px rgba(245,184,76,0.3);
  transition:all .4s ease;
}
.sl-origin-card:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(0,0,0,0.2),0 24px 48px -15px rgba(0,0,0,0.55),0 44px 88px -25px rgba(0,0,0,0.85),0 0 80px -16px rgba(245,184,76,0.4)}
.sl-origin-card::after{content:'';position:absolute;inset:-30px;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(245,184,76,0.14) 0%,transparent 65%);pointer-events:none;z-index:-1;animation:slGlowPulse 6s ease-in-out infinite}
.sl-origin-cover{position:relative;overflow:hidden}
.sl-origin-cover svg{display:block;width:100%;height:auto}
.sl-origin-fade{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.92));pointer-events:none}
.sl-origin-body{position:absolute;bottom:0;left:0;right:0;padding:14px 16px 16px;z-index:2}
.sl-origin-badge{display:inline-block;font-family:var(--ml-mono);font-size:7px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:100px;background:rgba(245,184,76,.3);border:0.5px solid rgba(245,184,76,.5);color:rgba(255,243,214,.95);margin-bottom:6px;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.sl-origin-title{font-family:var(--ml-serif);font-size:15px;font-weight:600;color:var(--ml-cream);line-height:1.3}
.sl-origin-meta{font-family:var(--ml-mono);font-size:9px;color:rgba(244,239,232,.4);margin-top:4px}

/* ─── Section headers ─── */
.sl-section{padding:52px 0 22px;text-align:center}
.sl-section-eyebrow{font-family:var(--ml-mono);font-size:8.5px;letter-spacing:.32em;color:var(--ml-amber);text-transform:uppercase;opacity:.8;display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px}
.sl-section-diamond{font-size:4px;opacity:.6}
.sl-section-title{font-family:var(--ml-serif);font-style:italic;font-weight:400;font-size:29px;color:var(--ml-cream);letter-spacing:-.015em;line-height:1.2}
.sl-section-count{font-family:var(--ml-mono);font-size:9px;letter-spacing:.2em;color:var(--ml-cream-dim);opacity:.48;text-transform:uppercase;margin-top:10px}
.sl-section-rule{width:40px;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.3),transparent);margin:14px auto 0}

/* ─── Divider ─── */
.sl-divider{display:flex;align-items:center;justify-content:center;gap:14px;padding:36px 0 0}
.sl-divider-line{flex:0 0 70px;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.3),transparent)}
.sl-divider-orn{color:var(--ml-amber);opacity:.5;font-size:6px;letter-spacing:.4em}

/* ─── Story grid ─── */
.sl-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:6px 0 4px}

/* ─── Story card ─── */
.sl-card{
  border-radius:14px;overflow:hidden;cursor:pointer;position:relative;
  border:1px solid rgba(255,255,255,.05);
  background:rgba(255,255,255,.015);
  transition:all .3s cubic-bezier(.22,.61,.36,1);
}
.sl-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.12);box-shadow:0 12px 28px -8px rgba(0,0,0,.5)}
.sl-card:active{transform:translateY(-1px) scale(.98);transition:transform .12s ease}
.sl-card-cover{position:relative;overflow:hidden}
.sl-card-cover svg{display:block;width:100%;height:auto}
.sl-card-fade{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.88));pointer-events:none}
.sl-card-title{position:absolute;bottom:8px;left:10px;right:10px;font-family:var(--ml-serif);font-size:12.5px;font-weight:600;color:var(--ml-cream);line-height:1.3;z-index:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* card meta */
.sl-card-meta{padding:9px 10px 10px;display:flex;flex-direction:column;gap:5px}
.sl-card-sub{font-family:var(--ml-sans);font-size:11px;font-style:italic;color:rgba(244,239,232,.28);line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.sl-card-row{display:flex;align-items:center;justify-content:space-between;gap:6px}
.sl-card-pills{display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden;align-items:center}
.sl-card-pill{font-family:var(--ml-mono);font-size:8px;letter-spacing:.03em;padding:2px 6px;border-radius:5px;background:rgba(255,255,255,.04);color:rgba(244,239,232,.22);white-space:nowrap;text-transform:uppercase}
.sl-card-date{font-family:var(--ml-mono);font-size:8px;color:rgba(234,242,255,.22);letter-spacing:.05em}
.sl-card-fav{display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(244,239,232,.12);transition:color .15s;background:none;border:none;padding:2px;font-size:15px;flex-shrink:0}
.sl-card-fav:hover{color:var(--ml-amber)}
.sl-card-fav.on{color:#F5B84C}

/* ─── Menu ─── */
.sl-card-menu-btn{position:absolute;top:6px;left:6px;font-size:20px;z-index:3;cursor:pointer;opacity:.55;transition:all .15s;background:rgba(0,0,0,.45);border:none;color:var(--ml-cream);padding:6px 8px;border-radius:8px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);line-height:1}
.sl-card-menu-btn:hover{opacity:.85;background:rgba(0,0,0,.6)}
.sl-menu{position:absolute;top:26px;left:6px;background:rgba(6,9,18,.97);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px;z-index:10;min-width:140px;box-shadow:0 12px 40px rgba(0,0,0,.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);animation:slFadeUp .12s ease}
.sl-menu-item{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(244,239,232,.55);font-family:inherit;transition:all .12s}
.sl-menu-item:hover{background:rgba(255,255,255,.06);color:var(--ml-cream)}
.sl-menu-item.danger{color:rgba(255,130,120,.5)}
.sl-menu-item.danger:hover{background:rgba(200,80,80,.1);color:rgba(255,130,120,.9)}

/* ─── Public badge ─── */
.sl-public-badge{position:absolute;top:7px;right:7px;font-size:7px;font-weight:700;padding:2.5px 8px;border-radius:100px;background:rgba(20,216,144,.12);border:0.5px solid rgba(20,216,144,.22);color:#14d890;font-family:var(--ml-mono);z-index:3;white-space:nowrap;letter-spacing:.02em;text-transform:uppercase;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}

/* ─── Library toggle ─── */
.sl-lib-btn{width:calc(100% - 20px);padding:7px 12px;border-radius:20px;font-size:10px;font-weight:700;font-family:var(--ml-mono);letter-spacing:.04em;cursor:pointer;transition:all .15s;margin:0 10px 10px}
.sl-lib-btn.add{background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.2);color:#F5B84C}
.sl-lib-btn.add:hover{background:rgba(245,184,76,.15)}
.sl-lib-btn.in{background:rgba(20,216,144,.06);border:1px solid rgba(20,216,144,.18);color:#14d890}
.sl-lib-btn.in:hover{background:rgba(20,216,144,.12)}

/* ─── Shared stories ─── */
.sl-shared-item{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;cursor:pointer;transition:all .15s}
.sl-shared-item:hover{background:rgba(255,255,255,.04)}

/* ─── Empty ─── */
.sl-empty{text-align:center;padding:80px 0}

/* ─── Footer ─── */
.sl-footer{text-align:center;padding:80px 0 20px}
.sl-footer-total{font-family:var(--ml-serif);font-style:italic;font-size:15px;color:var(--ml-cream);opacity:.62;margin-bottom:16px;line-height:1.6}
.sl-footer-mark{font-family:var(--ml-mono);font-size:7px;letter-spacing:.3em;text-transform:uppercase;color:var(--ml-cream);opacity:.12}

/* ─── Modals ─── */
.sl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:slFadein .15s ease}
.sl-modal{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:slSlideup .2s cubic-bezier(.22,1,.36,1)}
.sl-modal h3{font-family:var(--ml-serif);font-size:18px;font-weight:700;color:var(--ml-cream);margin-bottom:8px}
.sl-modal p{font-size:13px;color:rgba(244,239,232,.5);line-height:1.6;margin-bottom:20px}
.sl-modal-btns{display:flex;gap:10px}
.sl-modal-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ml-sans)}
.sl-modal-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ml-sans)}
`;

// ── Cover component ──────────────────────────────────────────────────────────

function StoryCover({ title, vibe, mood }: { title: string; vibe?: string; mood?: string }) {
  const bucket = vibeToBucket(vibe || mood);
  const svg = useMemo(() => generateCoverSVG(title, bucket), [title, bucket]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props { userId: string; onBack: () => void; onReadStory: (bookData: any) => void; onCreateStory: () => void; }

export default function StoryLibrary({ userId, onBack, onReadStory, onCreateStory }: Props) {
  const { isSubscribed, user } = useApp();
  const isAdmin = !!(user && !user.isGuest && import.meta.env.VITE_ADMIN_EMAIL && user.email === import.meta.env.VITE_ADMIN_EMAIL);
  const canPublish = isSubscribed || isAdmin;
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [nightCards, setNightCards] = useState<SavedNightCard[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedStory | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [shareTarget, setShareTarget] = useState<SavedStory | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [shareSent, setShareSent] = useState(false);
  const [sharedWithMe, setSharedWithMe] = useState<SharedStory[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const cachedStories = JSON.parse(localStorage.getItem(`ss2_stories_${userId}`) || '[]');
      const cachedChars = JSON.parse(localStorage.getItem(`ss2_chars_${userId}`) || '[]');
      const cachedCards = JSON.parse(localStorage.getItem(`ss2_nightcards_${userId}`) || '[]');
      if (cachedStories.length) setStories(cachedStories);
      if (cachedChars.length) setCharacters(cachedChars);
      if (cachedCards.length) setNightCards(cachedCards);
    } catch {}
    try {
      const fav = JSON.parse(localStorage.getItem(`ss_fav_stories_${userId}`) || '[]');
      setFavorites(new Set(fav));
    } catch {}

    getStories(userId).then(setStories);
    getCharacters(userId).then(setCharacters);
    getNightCards(userId).then(setNightCards);
    getFriends(userId).then(setFriends);
    getSharedStories(userId).then(setSharedWithMe);
  }, [userId]);

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(`ss_fav_stories_${userId}`, JSON.stringify([...next]));
      return next;
    });
  };

  const familyChars = useMemo(() => characters.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human')), [characters]);
  const heroNames = [...new Set(stories.map(s => s.heroName).filter(Boolean))];

  const filtered = stories.filter(s => {
    const matchFilter = filter === 'all' || s.heroName === filter;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.heroName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 1 : 0;
    const bFav = favorites.has(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return (b.date || '').localeCompare(a.date || '');
  });

  const originStory = sorted.find(s => (s as any).isOrigin || s.title?.includes('Night You Were Found'));
  const regularStories = sorted.filter(s => s !== originStory);

  const childNames = useMemo(() => {
    const names = [...new Set(stories.map(s => s.heroName).filter(Boolean))];
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
  }, [stories]);

  const handleDelete = async (story: SavedStory) => {
    await deleteStory(userId, story.id);
    setConfirmDelete(null);
    setMenuOpen(null);
    getStories(userId).then(setStories);
  };

  // ── Render a story card ──────────────────────────────────────────────────

  const renderCard = (s: SavedStory, index: number) => {
    const isFav = favorites.has(s.id);
    const sub = storySubtitle(s);
    const vibeLabel = VIBE_LABELS[s.vibe || s.mood || ''];
    const ageLabel = AGE_LABELS[s.ageGroup || ''];

    return (
      <div key={s.id} className="sl-card"
        style={{ animation: `slTileIn .4s ${index * 0.05}s cubic-bezier(.22,.61,.36,1) both`, opacity: 0 }}
        onClick={() => onReadStory(s.bookData)}>

        <div className="sl-card-cover">
          <StoryCover title={s.title} vibe={s.vibe} mood={s.mood} />
          <div className="sl-card-fade" />
          <div className="sl-card-title">{s.title}</div>

          <button className="sl-card-menu-btn"
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id); }}>
            &#8942;
          </button>
          {menuOpen === s.id && (
            <div className="sl-menu" onClick={e => e.stopPropagation()}>
              <button className="sl-menu-item" onClick={() => { setMenuOpen(null); onReadStory(s.bookData); }}>Read again</button>
              <button className="sl-menu-item" onClick={async () => {
                setMenuOpen(null);
                try {
                  const { createStoryShareToken } = await import('../../lib/storage');
                  const token = await createStoryShareToken(s.id);
                  const shareUrl = `https://sleepseed.app/?story=${token}`;
                  const text = `"${s.title}" — a bedtime story for ${s.heroName}\n${s.bookData?.refrain ? `"${s.bookData.refrain}"\n` : ''}`;
                  try { await navigator.share?.({title: s.title, text, url: shareUrl}); }
                  catch(_) { navigator.clipboard?.writeText(shareUrl); }
                } catch (e) {
                  console.error('Share story:', e);
                  const text = `"${s.title}" — a bedtime story for ${s.heroName}\nsleepseed.app`;
                  navigator.clipboard?.writeText(text);
                }
              }}>Share</button>
              {canPublish && !s.isPublic && (
                <button className="sl-menu-item" onClick={async () => {
                  setMenuOpen(null);
                  try {
                    await submitStoryToLibrary(s.id, userId, { ageGroup: s.ageGroup, vibe: s.vibe, mood: s.mood, storyStyle: s.storyStyle, storyLength: s.storyLength, lessons: s.lessons });
                    setStories(prev => prev.map(st => st.id === s.id ? { ...st, isPublic: true } : st));
                  } catch (e) { console.error('Submit to library:', e); }
                }}>Add to library</button>
              )}
              {canPublish && s.isPublic && (
                <button className="sl-menu-item" onClick={async () => {
                  setMenuOpen(null);
                  await removeStoryFromLibrary(s.id, userId);
                  setStories(prev => prev.map(st => st.id === s.id ? { ...st, isPublic: false } : st));
                }}>Remove from library</button>
              )}
              {friends.length > 0 && (
                <button className="sl-menu-item" onClick={() => { setMenuOpen(null); setShareTarget(s); setShareMsg(''); setShareSent(false); }}>Send to friend</button>
              )}
              <button className="sl-menu-item" onClick={async () => {
                setMenuOpen(null);
                const { generateStoryPdf } = await import('../../lib/shareUtils');
                const bd = s.bookData || {};
                await generateStoryPdf({
                  title: s.title || bd.title || 'Story',
                  heroName: s.heroName || bd.heroName || '',
                  refrain: bd.refrain,
                  pages: bd.pages,
                  isAdventure: bd.isAdventure,
                  setup_pages: bd.setup_pages,
                  path_a: bd.path_a,
                  path_b: bd.path_b,
                });
              }}>Download PDF</button>
              <button className="sl-menu-item danger" onClick={() => { setMenuOpen(null); setConfirmDelete(s); }}>Remove</button>
            </div>
          )}

          {s.isPublic && <div className="sl-public-badge">In Library</div>}
        </div>

        <div className="sl-card-meta">
          {sub && <div className="sl-card-sub">{sub}</div>}
          <div className="sl-card-row">
            <div className="sl-card-pills">
              <span className="sl-card-date">{formatDate(s.date)}</span>
              {vibeLabel && <span className="sl-card-pill">{vibeLabel}</span>}
              {ageLabel && <span className="sl-card-pill">{ageLabel}</span>}
            </div>
            <button className={`sl-card-fav${isFav ? ' on' : ''}`}
              onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
              {isFav ? '★' : '☆'}
            </button>
          </div>
        </div>

        {canPublish && !s.isPublic && (
          <div style={{ padding: '0 10px 10px' }}>
            <button className="sl-lib-btn add"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await submitStoryToLibrary(s.id, userId, { ageGroup: s.ageGroup, vibe: s.vibe, mood: s.mood, storyStyle: s.storyStyle, storyLength: s.storyLength, lessons: s.lessons });
                  setStories(prev => prev.map(st => st.id === s.id ? { ...st, isPublic: true } : st));
                } catch (err) { console.error('Submit to library:', err); }
              }}>
              Share to Library
            </button>
          </div>
        )}
        {canPublish && s.isPublic && (
          <div style={{ padding: '0 10px 10px' }}>
            <button className="sl-lib-btn in"
              onClick={async (e) => {
                e.stopPropagation();
                await removeStoryFromLibrary(s.id, userId);
                setStories(prev => prev.map(st => st.id === s.id ? { ...st, isPublic: false } : st));
              }}>
              In Library ✓
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Page render ────────────────────────────────────────────────────────────

  return (
    <div className="sl-page" onClick={() => setMenuOpen(null)}>
      <style>{CSS}</style>

      <div className="sl-inner">

      {/* ── Top bar ── */}
      <div className="sl-topbar">
        <button className="sl-topbtn" onClick={onBack} aria-label="Back">←</button>
        <div className="sl-toptitle">My Stories</div>
        <button className="sl-topbtn" aria-label="Search and filter"
          onClick={() => { setSearchOpen(v => !v); setTimeout(() => searchRef.current?.focus(), 100); }}>
          {searchOpen ? '✕' : '⋯'}
        </button>
      </div>

      {/* ── Search panel ── */}
      <div className={`sl-search-panel${searchOpen ? ' open' : ''}`}>
        <input ref={searchRef} className="sl-search-input" placeholder="Search stories..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {heroNames.length > 0 && (
          <div className="sl-filter-chips">
            {heroNames.map(n => (
              <div key={n} className={`sl-filter-chip${filter === n ? ' on' : ''}`}
                onClick={() => setFilter(filter === n ? 'all' : n)}>{n}</div>
            ))}
            {filter !== 'all' && (
              <div className="sl-filter-clear" onClick={() => setFilter('all')}>✕ clear</div>
            )}
          </div>
        )}
      </div>

      {/* ── Narrative band ── */}
      {stories.length > 0 && (
        <div className="sl-narrative" style={{ animation: 'slFadeUp .5s .15s ease both', opacity: 0 }}>
          <div className="sl-narrative-glow" />
          <div className="sl-narrative-text">
            <span style={{ color: 'var(--ml-amber)', opacity: 0.95, fontWeight: 500, fontStyle: 'italic' }}>
              {numberWord(stories.length)} stor{stories.length !== 1 ? 'ies' : 'y'}
            </span>
            {childNames ? ` with ${childNames}.` : '.'}
          </div>
        </div>
      )}

      {/* ── Shared with you ── */}
      {sharedWithMe.length > 0 && (
        <div>
          <div className="sl-section" style={{ padding: '20px 0 12px' }}>
            <div className="sl-section-eyebrow">
              <span className="sl-section-diamond">◆</span>
              <span>Shared with you</span>
              <span className="sl-section-diamond">◆</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {sharedWithMe.map(s => (
              <div key={s.id} className="sl-shared-item" style={{
                background: s.read ? 'rgba(255,255,255,.02)' : 'rgba(245,184,76,.04)',
                border: `1px solid ${s.read ? 'rgba(255,255,255,.05)' : 'rgba(245,184,76,.15)'}`,
                borderRadius: 14,
              }}
                onClick={() => {
                  if (!s.read) markSharedStoryRead(s.id).then(() => setSharedWithMe(prev => prev.map(x => x.id === s.id ? { ...x, read: true } : x)));
                  if (s.bookData) onReadStory(s.bookData);
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(145deg,#251838,#140d28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📖</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ml-cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.storyTitle}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--ml-mono)', color: 'rgba(234,242,255,.25)' }}>
                    From {s.fromDisplayName}{s.message ? ` · "${s.message}"` : ''} · {s.sharedAt?.split('T')[0]}
                  </div>
                </div>
                {!s.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ml-amber)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      {stories.length === 0 ? (
        <div className="sl-empty" style={{ animation: 'slFadeUp .4s ease both' }}>
          <div style={{ fontSize: 56, opacity: 0.4, marginBottom: 20 }}>📚</div>
          <div style={{ fontFamily: 'var(--ml-serif)', fontSize: 22, fontWeight: 700, color: 'var(--ml-cream)', marginBottom: 10, fontStyle: 'italic' }}>Your bookshelf is empty</div>
          <div style={{ fontSize: 14, color: 'rgba(244,239,232,0.4)', lineHeight: 1.72, maxWidth: 360, margin: '0 auto 24px', fontWeight: 300 }}>
            Every story you create gets added here — your very own library, ready to read any night.
          </div>
          <button onClick={onCreateStory} style={{
            background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)', color: '#080200',
            border: 'none', borderRadius: 50, padding: '14px 32px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(200,130,20,.25)',
            transition: 'all .2s',
          }}>Create your first story</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="sl-empty" style={{ animation: 'slFadeUp .3s ease both' }}>
          <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ml-serif)', fontSize: 18, color: 'var(--ml-cream)', opacity: 0.6, fontStyle: 'italic' }}>No stories match</div>
          <div style={{ fontSize: 13, color: 'rgba(244,239,232,0.3)', marginTop: 8 }}>Try a different search or clear the filter.</div>
        </div>
      ) : (
        <>
          {/* ── Origin story hero ── */}
          {originStory && !search && filter === 'all' && (
            <div className="sl-origin-hero" style={{ animation: 'slFadeUp .5s .1s ease both', opacity: 0 }}>
              <div className="sl-origin-eyebrow">
                <span className="sl-origin-diamond">◆</span>
                <span>Where it began</span>
                <span className="sl-origin-diamond">◆</span>
              </div>
              <div className="sl-origin-reason">Your very first story together.</div>
              <div className="sl-origin-card" onClick={() => onReadStory(originStory.bookData)}>
                <div className="sl-origin-cover">
                  <StoryCover title={originStory.title} vibe={originStory.vibe} mood={originStory.mood} />
                  <div className="sl-origin-fade" />
                  <div className="sl-origin-body">
                    <div className="sl-origin-badge">◆ Origin Story</div>
                    <div className="sl-origin-title">{originStory.title}</div>
                    <div className="sl-origin-meta">
                      <span style={{ color: 'var(--ml-amber-deep)' }}>◆</span> {originStory.heroName} · {shortDate(originStory.date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Divider before grid ── */}
          <div className="sl-divider">
            <span className="sl-divider-line" />
            <span className="sl-divider-orn">◆ ◆ ◆</span>
            <span className="sl-divider-line" />
          </div>

          {/* ── Section header ── */}
          <div className="sl-section" style={{ animation: 'slFadeUp .4s .2s ease both', opacity: 0 }}>
            <div className="sl-section-eyebrow">
              <span className="sl-section-diamond">◆</span>
              <span>Your Collection</span>
              <span className="sl-section-diamond">◆</span>
            </div>
            <div className="sl-section-title">My Stories</div>
            <div className="sl-section-count">
              {regularStories.length} stor{regularStories.length !== 1 ? 'ies' : 'y'} · {heroNames.length > 0 ? heroNames.join(' & ') : 'Ritual'}
            </div>
            <div className="sl-section-rule" />
          </div>

          {/* ── Story grid ── */}
          <div className="sl-grid">
            {regularStories.map((s, i) => renderCard(s, i))}
          </div>
        </>
      )}

      {/* ── Footer ── */}
      {stories.length > 0 && (
        <div className="sl-footer" style={{ animation: 'slFadeUp .4s .3s ease both', opacity: 0 }}>
          <div className="sl-footer-total">
            <span style={{ color: 'var(--ml-amber)', fontWeight: 500, opacity: 0.95 }}>
              {numberWord(stories.length)} stor{stories.length !== 1 ? 'ies' : 'y'}
            </span> told so far.<br />
            Each one a night remembered.
          </div>
          <div className="sl-footer-mark">SleepSeed</div>
        </div>
      )}

      </div>{/* end .sl-inner */}

      {/* ════════════════════════════════════════════════════════════
         MODALS
         ════════════════════════════════════════════════════════════ */}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="sl-modal-bg" onClick={() => setConfirmDelete(null)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <h3>Remove this story?</h3>
            <p>"{confirmDelete.title}" will be removed from your bookshelf. This can't be undone.</p>
            <div className="sl-modal-btns">
              <button className="sl-modal-cancel" onClick={() => setConfirmDelete(null)}>Keep it</button>
              <button className="sl-modal-del" onClick={() => handleDelete(confirmDelete)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Send to friend modal */}
      {shareTarget && (
        <div className="sl-modal-bg" onClick={() => setShareTarget(null)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
            {!shareSent ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💌</div>
                <h3>Send "{shareTarget.title}"</h3>
                <p>Pick a friend to share this story with.</p>
                <input placeholder="Add a message (optional)" value={shareMsg} onChange={e => setShareMsg(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'var(--ml-cream)', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 12 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {friends.map(f => (
                    <button key={f.id} onClick={async () => {
                      await shareStoryWithFriend(userId, f.friendUserId, shareTarget.id, shareMsg || undefined);
                      setShareSent(true);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', cursor: 'pointer', transition: 'all .15s', width: '100%', textAlign: 'left' as const }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A060,#B07020)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                        {f.friendDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ml-cream)' }}>{f.friendDisplayName}</div>
                      <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(245,184,76,.5)' }}>Send →</div>
                    </button>
                  ))}
                </div>
                <button className="sl-modal-cancel" onClick={() => setShareTarget(null)} style={{ marginTop: 12, width: '100%' }}>Cancel</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <h3>Story sent!</h3>
                <p>They'll see it in their "Shared with you" section.</p>
                <button className="sl-modal-cancel" onClick={() => setShareTarget(null)} style={{ marginTop: 8, width: '100%' }}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
