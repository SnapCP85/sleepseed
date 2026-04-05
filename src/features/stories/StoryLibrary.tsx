import { useState, useEffect, useMemo } from 'react';
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

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060912;--night-mid:#0B1535;--night-card:#0C1840;
  --amber:#F5B84C;--teal:#14d890;--purple:#9A7FD4;--cream:#F4EFE8;
  --r-sm:14px;--r-md:18px;--r-lg:22px;
  --serif:'Fraunces',Georgia,serif;
  --sans:'Nunito',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
@keyframes slFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slTwinkle{0%,100%{opacity:.06}50%{opacity:.22}}

/* ── page ─────────────────────────────────────────────────── */
.sl{min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 50%,#0f0a20 100%);font-family:var(--sans);color:var(--cream);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative}
.sl-inner{max-width:960px;margin:0 auto;padding:0 16px 32px;position:relative;z-index:5}
@media(min-width:768px){.sl-inner{padding:0 32px 32px}}
.sl-star{position:fixed;border-radius:50%;background:#EEE8FF;pointer-events:none;z-index:0}

/* ── header ───────────────────────────────────────────────── */
.sl-hdr{display:flex;align-items:center;gap:14px;padding:44px 0 6px}
.sl-back{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .18s}
.sl-back:hover{background:rgba(255,255,255,.08)}
.sl-hdr-label{font-family:var(--mono);font-size:9px;letter-spacing:1px;color:rgba(245,184,76,.45);margin-bottom:3px}
.sl-hdr-title{font-family:var(--serif);font-size:26px;font-weight:900;letter-spacing:-.5px;color:var(--cream)}

/* ── filter pills ─────────────────────────────────────────── */
.sl-pills{display:flex;gap:6px;overflow-x:auto;margin-bottom:16px;scrollbar-width:none;-ms-overflow-style:none;padding:2px 0}
.sl-pills::-webkit-scrollbar{display:none}
.sl-pill{flex-shrink:0;padding:6px 14px;border-radius:20px;font-size:11px;font-family:var(--sans);font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);color:rgba(234,242,255,.32);transition:all .2s;-webkit-tap-highlight-color:transparent}
.sl-pill:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12)}
.sl-pill.on{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.28);color:#F5B84C;font-weight:600}

/* ── identity + stats ─────────────────────────────────────── */
.sl-world{margin-bottom:18px}
.sl-world-label{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(244,239,232,.2);margin-bottom:10px}
.sl-identity{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);margin-bottom:10px;animation:slFadeUp .4s ease both}
.sl-identity-avatar{width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(245,184,76,.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:rgba(245,184,76,.06)}
.sl-identity-info{flex:1;min-width:0}
.sl-identity-name{font-family:var(--serif);font-size:14px;font-weight:700;color:var(--cream)}
.sl-identity-label{font-family:var(--mono);font-size:8px;color:rgba(245,184,76,.4);text-transform:uppercase;letter-spacing:.06em;margin-top:1px}

.sl-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:0}
.sl-stat{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);border-radius:14px;padding:12px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}
.sl-stat-num{font-family:var(--serif);font-size:22px;font-weight:900;color:var(--cream);line-height:1}
.sl-stat-lbl{font-family:var(--mono);font-size:8px;font-weight:600;color:rgba(234,242,255,.25);text-transform:uppercase;letter-spacing:.08em}

/* ── search ───────────────────────────────────────────────── */
.sl-search-wrap{position:relative;margin-bottom:18px}
.sl-search-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(244,239,232,.18)}
.sl-search-ico svg{width:14px;height:14px;display:block}
.sl-search{width:100%;padding:11px 14px 11px 38px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);font-size:13px;color:var(--cream);font-family:var(--sans);outline:none;transition:border-color .2s}
.sl-search:focus{border-color:rgba(245,184,76,.3)}
.sl-search::placeholder{color:rgba(255,255,255,.16)}

/* ── section labels ───────────────────────────────────────── */
.sl-sec{display:flex;align-items:center;justify-content:space-between;margin:20px 0 10px}
.sl-sec-label{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(244,239,232,.2)}

/* ── origin story ─────────────────────────────────────────── */
.sl-origin{border-radius:18px;overflow:hidden;cursor:pointer;position:relative;border:1px solid rgba(245,184,76,.1);margin-bottom:20px;transition:all .22s;animation:slFadeUp .4s ease both}
.sl-origin:hover{transform:translateY(-2px);border-color:rgba(245,184,76,.2)}
.sl-origin-cover{position:relative;overflow:hidden}
.sl-origin-cover svg{display:block;width:100%;height:auto}
.sl-origin-fade{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.92));pointer-events:none}
.sl-origin-body{position:absolute;bottom:0;left:0;right:0;padding:14px 16px 16px;z-index:2}
.sl-origin-badge{display:inline-block;font-family:var(--mono);font-size:7px;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:6px;background:rgba(245,184,76,.12);border:1px solid rgba(245,184,76,.2);color:#F5B84C;margin-bottom:6px}
.sl-origin-title{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);line-height:1.3}
.sl-origin-meta{font-family:var(--mono);font-size:9px;color:rgba(244,239,232,.3);margin-top:4px}

/* ── story grid ───────────────────────────────────────────── */
.sl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
@media(min-width:600px){.sl-grid{gap:14px}}

/* ── story card ───────────────────────────────────────────── */
.sl-card{border:1px solid rgba(255,255,255,.05);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .22s;animation:slFadeUp .4s ease both;position:relative}
.sl-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.12)}
.sl-card-cover{position:relative;overflow:hidden}
.sl-card-cover svg{display:block;width:100%;height:auto}
.sl-card-fade{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.88));pointer-events:none}
.sl-card-title{position:absolute;bottom:8px;left:10px;right:10px;font-family:var(--serif);font-size:12.5px;font-weight:600;color:var(--cream);line-height:1.3;z-index:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* card meta */
.sl-card-meta{padding:9px 10px 10px;display:flex;flex-direction:column;gap:5px}
.sl-card-sub{font-family:var(--sans);font-size:11px;font-style:italic;color:rgba(244,239,232,.28);line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.sl-card-row{display:flex;align-items:center;justify-content:space-between;gap:6px}
.sl-card-pills{display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden}
.sl-card-pill{font-family:var(--mono);font-size:8px;letter-spacing:.03em;padding:2px 6px;border-radius:5px;background:rgba(255,255,255,.04);color:rgba(244,239,232,.25);white-space:nowrap;text-transform:uppercase}
.sl-card-fav{display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(244,239,232,.12);transition:color .15s;background:none;border:none;padding:2px;font-size:15px;flex-shrink:0}
.sl-card-fav:hover{color:var(--amber)}
.sl-card-fav.on{color:#F5B84C}
.sl-card-date{font-family:var(--mono);font-size:8.5px;color:rgba(234,242,255,.22)}

/* ── menu ─────────────────────────────────────────────────── */
.sl-card-menu-btn{position:absolute;top:6px;left:6px;font-size:14px;z-index:3;cursor:pointer;opacity:.18;transition:all .15s;background:rgba(0,0,0,.3);border:none;color:#F4EFE8;padding:2px 5px;border-radius:6px;backdrop-filter:blur(4px)}
.sl-card-menu-btn:hover{opacity:.7;background:rgba(0,0,0,.5)}
.sl-menu{position:absolute;top:26px;left:6px;background:rgba(6,9,18,.97);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px;z-index:10;min-width:140px;box-shadow:0 12px 40px rgba(0,0,0,.7);backdrop-filter:blur(16px);animation:slFadeUp .12s ease}
.sl-menu-item{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(244,239,232,.55);font-family:inherit;transition:all .12s}
.sl-menu-item:hover{background:rgba(255,255,255,.06);color:#F4EFE8}
.sl-menu-item.danger{color:rgba(255,130,120,.5)}
.sl-menu-item.danger:hover{background:rgba(200,80,80,.1);color:rgba(255,130,120,.9)}

/* ── public badge ─────────────────────────────────────────── */
.sl-public-badge{position:absolute;top:7px;right:7px;font-size:7px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(20,216,144,.12);border:1px solid rgba(20,216,144,.22);color:#14d890;font-family:var(--mono);z-index:3;white-space:nowrap;letter-spacing:.02em;text-transform:uppercase;backdrop-filter:blur(4px)}

/* ── library toggle ───────────────────────────────────────── */
.sl-lib-btn{width:100%;padding:7px 12px;border-radius:20px;font-size:10px;font-weight:700;font-family:var(--mono);letter-spacing:.04em;cursor:pointer;transition:all .15s;margin:0 10px 10px}
.sl-lib-btn.add{background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.2);color:#F5B84C}
.sl-lib-btn.add:hover{background:rgba(245,184,76,.15)}
.sl-lib-btn.in{background:rgba(20,216,144,.06);border:1px solid rgba(20,216,144,.18);color:#14d890}
.sl-lib-btn.in:hover{background:rgba(20,216,144,.12)}

/* ── shared stories ───────────────────────────────────────── */
.sl-shared-item{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;cursor:pointer;transition:all .15s}
.sl-shared-item:hover{background:rgba(255,255,255,.04)}

/* ── empty ────────────────────────────────────────────────── */
.sl-empty{text-align:center;padding:60px 20px}
.sl-empty-emoji{font-size:56px;margin-bottom:16px}
.sl-empty-h{font-family:var(--serif);font-size:20px;font-weight:700;margin-bottom:8px;font-style:italic}
.sl-empty-sub{font-size:13px;color:rgba(234,242,255,.3);line-height:1.65;max-width:280px;margin:0 auto 24px}
.sl-empty-btn{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;border:none;border-radius:50px;padding:14px 32px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(200,130,20,.25);transition:all .2s}
.sl-empty-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}

/* ── confirm modal ────────────────────────────────────────── */
.sl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);animation:slFadeUp .12s ease}
.sl-modal{background:var(--night-card);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7)}
.sl-modal h3{font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:8px}
.sl-modal p{font-size:13px;color:rgba(244,239,232,.4);line-height:1.6;margin-bottom:20px}
.sl-modal-btns{display:flex;gap:10px}
.sl-modal-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.sl-modal-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
`;

// ── Cover component ──────────────────────────────────────────────────────────

function StoryCover({ title, vibe, mood }: { title: string; vibe?: string; mood?: string }) {
  const bucket = vibeToBucket(vibe || mood);
  const svg = useMemo(() => generateCoverSVG(title, bucket), [title, bucket]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Starfield ────────────────────────────────────────────────────────────────

function Starfield() {
  const stars = useMemo(() => {
    const s: { x: number; y: number; r: number; d: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const h = ((i * 2654435761) >>> 0);
      s.push({
        x: (h % 100),
        y: ((h >> 8) % 100),
        r: 0.6 + (h % 3) * 0.4,
        d: 3 + (h % 4),
      });
    }
    return s;
  }, []);
  return (
    <>
      {stars.map((s, i) => (
        <div key={i} className="sl-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.r * 2, height: s.r * 2,
          animation: `slTwinkle ${s.d}s ease-in-out ${(i * 0.3) % 4}s infinite`,
        }} />
      ))}
    </>
  );
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedStory | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [shareTarget, setShareTarget] = useState<SavedStory | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [shareSent, setShareSent] = useState(false);
  const [sharedWithMe, setSharedWithMe] = useState<SharedStory[]>([]);

  useEffect(() => {
    // Phase 1: instant from localStorage cache
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

    // Phase 2: refresh from Supabase in background
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
  const primaryChar = familyChars.length > 0 ? familyChars[0] : null;
  const primaryHeroName = primaryChar?.name || heroNames[0] || '';

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

  const currentStreak = useMemo(() => {
    const dates = new Set(nightCards.map(c => c.date.split('T')[0]));
    let streak = 0;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().split('T')[0];
      if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [nightCards]);

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
      <div key={s.id} className="sl-card" style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => onReadStory(s.bookData)}>

        {/* SVG cover */}
        <div className="sl-card-cover">
          <StoryCover title={s.title} vibe={s.vibe} mood={s.mood} />
          <div className="sl-card-fade" />
          <div className="sl-card-title">{s.title}</div>

          {/* Menu button */}
          <button className="sl-card-menu-btn"
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id); }}>
            &#8942;
          </button>
          {menuOpen === s.id && (
            <div className="sl-menu" onClick={e => e.stopPropagation()}>
              <button className="sl-menu-item" onClick={() => { setMenuOpen(null); onReadStory(s.bookData); }}>Read again</button>
              <button className="sl-menu-item" onClick={async () => {
                setMenuOpen(null);
                const text = `"${s.title}" — a bedtime story for ${s.heroName}\n${s.bookData?.refrain ? `"${s.bookData.refrain}"\n` : ''}\nsleepseed.vercel.app`;
                try { await navigator.share?.({title: s.title, text, url: 'https://sleepseed.vercel.app'}); }
                catch(_) { navigator.clipboard?.writeText(text); }
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
              <button className="sl-menu-item danger" onClick={() => { setMenuOpen(null); setConfirmDelete(s); }}>Remove</button>
            </div>
          )}

          {s.isPublic && <div className="sl-public-badge">In Library</div>}
        </div>

        {/* Meta area */}
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

        {/* Library toggle button */}
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
    <div className="sl" onClick={() => setMenuOpen(null)}>
      <style>{CSS}</style>
      <Starfield />

      <div className="sl-inner">

        {/* Header */}
        <div className="sl-hdr">
          <button className="sl-back" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(234,242,255,.5)" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <div className="sl-hdr-label">LIBRARY</div>
            <div className="sl-hdr-title">My Stories</div>
          </div>
        </div>

        {/* Filter pills */}
        {heroNames.length > 0 && (
          <div className="sl-pills">
            <div className={`sl-pill${filter === 'all' ? ' on' : ''}`}
              onClick={() => setFilter('all')}>All</div>
            {heroNames.map(n => (
              <div key={n} className={`sl-pill${filter === n ? ' on' : ''}`}
                onClick={() => setFilter(filter === n ? 'all' : n)}>{n}</div>
            ))}
          </div>
        )}

        {/* Identity + stats */}
        {stories.length > 0 && (
          <div className="sl-world">
            <div className="sl-world-label">Your World</div>

            {primaryHeroName && (
              <div className="sl-identity">
                <div className="sl-identity-avatar">
                  {primaryChar?.emoji || '🌙'}
                </div>
                <div className="sl-identity-info">
                  <div className="sl-identity-name">{primaryHeroName}</div>
                  <div className="sl-identity-label">Your companion</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: 'var(--cream)', lineHeight: 1 }}>{stories.length}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(234,242,255,.25)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>Stories</div>
                </div>
              </div>
            )}

            <div className="sl-stats">
              <div className="sl-stat">
                <div className="sl-stat-num">{stories.length}</div>
                <div className="sl-stat-lbl">Stories</div>
              </div>
              <div className="sl-stat">
                <div className="sl-stat-num">{nightCards.length}</div>
                <div className="sl-stat-lbl">Memories</div>
              </div>
              <div className="sl-stat">
                <div className="sl-stat-num">{currentStreak}</div>
                <div className="sl-stat-lbl">Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {stories.length > 0 && (
          <div className="sl-search-wrap">
            <div className="sl-search-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input className="sl-search" placeholder="Search your stories..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {/* Shared with you */}
        {sharedWithMe.length > 0 && (
          <div>
            <div className="sl-sec"><div className="sl-sec-label">Shared with you</div></div>
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F4EFE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.storyTitle}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'rgba(234,242,255,.25)' }}>
                      From {s.fromDisplayName}{s.message ? ` · "${s.message}"` : ''} · {s.sharedAt?.split('T')[0]}
                    </div>
                  </div>
                  {!s.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5B84C', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        {stories.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-emoji">📚</div>
            <div className="sl-empty-h">Your bookshelf is empty</div>
            <div className="sl-empty-sub">Every story you create gets added here — your very own library, ready to read any night.</div>
            <button className="sl-empty-btn" onClick={onCreateStory}>Create your first story</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-emoji">🔍</div>
            <div className="sl-empty-h" style={{ fontSize: 16 }}>No stories found</div>
            <div className="sl-empty-sub">Try a different search or filter.</div>
          </div>
        ) : (
          <>
            {/* Origin story hero card */}
            {originStory && !search && filter === 'all' && (
              <div style={{ marginBottom: 20 }}>
                <div className="sl-sec"><div className="sl-sec-label">Origin Story</div></div>
                <div className="sl-origin" onClick={() => onReadStory(originStory.bookData)}>
                  <div className="sl-origin-cover">
                    <StoryCover title={originStory.title} vibe={originStory.vibe} mood={originStory.mood} />
                    <div className="sl-origin-fade" />
                    <div className="sl-origin-body">
                      <div className="sl-origin-badge">✦ Your first story</div>
                      <div className="sl-origin-title">{originStory.title}</div>
                      <div className="sl-origin-meta">{originStory.heroName} · {formatDate(originStory.date)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Story grid */}
            <div className="sl-sec"><div className="sl-sec-label">My Stories</div></div>
            <div className="sl-grid">
              {regularStories.map((s, i) => renderCard(s, i))}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

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
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#F4EFE8', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 12 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {friends.map(f => (
                    <button key={f.id} onClick={async () => {
                      await shareStoryWithFriend(userId, f.friendUserId, shareTarget.id, shareMsg || undefined);
                      setShareSent(true);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', cursor: 'pointer', transition: 'all .15s', width: '100%', textAlign: 'left' as const }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A060,#B07020)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                        {f.friendDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F4EFE8' }}>{f.friendDisplayName}</div>
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
