import { useState, useEffect, useMemo } from 'react';
import { getStories, deleteStory, getCharacters, submitStoryToLibrary, removeStoryFromLibrary, getFriends, shareStoryWithFriend, getSharedStories, markSharedStoryRead, getNightCards } from '../../lib/storage';
import type { Friend, SharedStory } from '../../lib/storage';
import type { SavedStory, Character, SavedNightCard } from '../../lib/types';
import { useApp } from '../../AppContext';

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

function bookEmoji(title: string): string {
  const BOOK_EMOJIS = ['📖','📕','📗','📘','📙','📓','✨','🌙','⭐','🦊','🐰','🐉','🦉','🐻','🦋'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash) + title.charCodeAt(i);
  return BOOK_EMOJIS[Math.abs(hash) % BOOK_EMOJIS.length];
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060912;--night-mid:#0B1535;--night-card:#0C1840;
  --amber:#F5B84C;--teal:#14d890;--purple:#9A7FD4;--cream:#F4EFE8;
  --r-sm:14px;--r-md:18px;--r-lg:22px;
  --b-hair:0.5px;--b-thin:1px;--b-mid:1.5px;
  --sp-xs:8px;--sp-sm:12px;--sp-md:16px;--sp-lg:20px;
  --serif:'Fraunces',Georgia,serif;
  --sans:'Nunito',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes slFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes slFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slShine{0%{left:-100%}100%{left:200%}}

/* screen wrapper */
.sl{min-height:100vh;background:#060912;font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;padding:0;overflow-x:hidden;-webkit-font-smoothing:antialiased}

/* header */
.sl-header{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 0;margin-bottom:14px}
.sl-header-title{font-family:var(--serif);font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#F4EFE8}
.sl-header-dots{width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(244,239,232,.4);flex-shrink:0;padding:0}

/* child filter pills */
.sl-pills{display:flex;gap:6px;overflow-x:auto;padding:0 20px;margin-bottom:14px;scrollbar-width:none;-ms-overflow-style:none}
.sl-pills::-webkit-scrollbar{display:none}
.sl-pill{flex-shrink:0;padding:6px 13px;border-radius:20px;font-size:10.5px;font-family:var(--mono);cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(234,242,255,.38);transition:all .18s;white-space:nowrap}
.sl-pill:hover{border-color:rgba(255,255,255,.18);color:rgba(234,242,255,.55)}
.sl-pill.on{border-color:rgba(245,184,76,.32);background:rgba(245,184,76,.12);color:#F5B84C}

/* YOUR WORLD section label */
.sl-world-label{font-family:var(--mono);font-size:8px;letter-spacing:.9px;text-transform:uppercase;color:rgba(234,242,255,.22);margin-bottom:10px}

/* identity card */
.sl-identity{position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:22px;background:linear-gradient(135deg,rgba(245,184,76,.1),rgba(12,22,64,.9));border:1px solid rgba(245,184,76,.2);margin-bottom:8px;animation:fadeUp .35s ease both}
.sl-identity-ghost{position:absolute;right:-8px;top:-8px;font-size:60px;opacity:.12;pointer-events:none;line-height:1}
.sl-identity-avatar{width:44px;height:44px;border-radius:50%;border:2px solid var(--amber);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;background:rgba(245,184,76,.08)}
.sl-identity-info{flex:1;min-width:0}
.sl-identity-name{font-family:var(--serif);font-size:14px;font-weight:900;color:var(--cream)}
.sl-identity-label{font-family:var(--mono);font-size:9px;color:rgba(245,184,76,.6);text-transform:uppercase;letter-spacing:.06em;margin-top:1px}
.sl-identity-right{text-align:right;flex-shrink:0}
.sl-identity-count{font-family:var(--serif);font-size:20px;font-weight:900;color:var(--cream);line-height:1}
.sl-identity-count-label{font-family:var(--mono);font-size:7px;color:rgba(245,184,76,.6);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}

/* living stats */
.sl-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:16px}
.sl-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:10px 6px;text-align:center;display:flex;flex-direction:column;align-items:center}
.sl-stat-emoji{font-size:14px;margin-bottom:2px}
.sl-stat-num{font-family:var(--serif);font-size:22px;font-weight:900;color:var(--cream);line-height:1}
.sl-stat-lbl{font-family:var(--mono);font-size:8px;font-weight:600;color:rgba(234,242,255,.35);text-transform:uppercase;letter-spacing:.08em;margin-top:4px}

/* search */
.sl-search{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:11px 14px;font-size:13px;color:var(--cream);outline:none;font-family:inherit;transition:border-color .2s;margin-bottom:16px}
.sl-search:focus{border-color:rgba(245,184,76,.3)}
.sl-search::placeholder{color:rgba(255,255,255,.2)}

/* section labels */
.sl-section-label{font-family:var(--mono);font-size:8px;letter-spacing:.9px;text-transform:uppercase;color:rgba(234,242,255,.22);margin:12px 0 10px 2px}

/* origin story card */
.sl-origin-label{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);margin-bottom:6px}
.sl-origin{position:relative;border-radius:22px;overflow:hidden;cursor:pointer;margin-bottom:16px;animation:fadeUp .4s ease both;border:1px solid rgba(245,184,76,.12)}
.sl-origin-cover{height:96px;position:relative;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#261c08,#16100a)}
.sl-origin-cover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(transparent,rgba(6,9,18,.85))}
.sl-origin-emoji{font-size:42px;animation:slFloat 4s ease-in-out infinite;position:relative;z-index:1;filter:drop-shadow(0 3px 12px rgba(245,184,76,.3))}
.sl-origin-overlay{position:absolute;bottom:10px;left:14px;right:14px;z-index:2}
.sl-origin-title{font-family:var(--serif);font-size:13px;font-weight:900;color:rgba(255,255,255,.92);line-height:1.3}
.sl-origin-meta{font-family:var(--mono);font-size:9px;color:rgba(244,239,232,.32);margin-top:3px}

/* book grid */
.sl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:18px}
.sl-book{border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;background:var(--night-mid);border:1px solid rgba(255,255,255,.07);animation:slFadeIn .4s ease-out both}
.sl-book:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.14)}
.sl-book:active{transform:scale(.97)}
.sl-book::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.03),transparent);pointer-events:none;animation:slShine 8s ease-in-out infinite}

/* book cover */
.sl-book-cover{height:92px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.sl-book-cover-fade{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(transparent,rgba(6,9,18,.7));z-index:1}
.sl-book-cover-title{position:absolute;bottom:7px;left:9px;right:9px;z-index:2;font-family:var(--serif);font-size:11px;font-weight:900;color:rgba(255,255,255,.88);line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sl-book-emoji{font-size:32px;animation:slFloat 4s ease-in-out infinite;position:relative;z-index:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))}

/* book meta strip */
.sl-book-meta{padding:8px 10px 10px;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.sl-book-date{font-family:var(--mono);font-size:8.5px;color:rgba(234,242,255,.3)}
.sl-book-fav{font-size:12px;cursor:pointer;opacity:.25;transition:all .15s;background:none;border:none;padding:1px 2px;margin-left:auto}
.sl-book-fav.on{opacity:1;filter:drop-shadow(0 0 4px rgba(245,184,76,.5))}
.sl-book-fav:hover{transform:scale(1.2)}
.sl-book-child-name{font-family:var(--mono);font-size:8px;color:rgba(234,242,255,.28);width:100%}

/* menu */
.sl-book-menu-btn{position:absolute;top:6px;left:6px;font-size:13px;z-index:3;cursor:pointer;opacity:.2;transition:all .15s;background:none;border:none;color:#F4EFE8;padding:2px 4px;border-radius:6px}
.sl-book-menu-btn:hover{opacity:.6;background:rgba(0,0,0,.3)}
.sl-menu{position:absolute;top:26px;left:6px;background:rgba(6,9,18,.97);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px;z-index:10;min-width:130px;box-shadow:0 12px 40px rgba(0,0,0,.7);backdrop-filter:blur(16px);animation:slFadeIn .15s ease}
.sl-menu-item{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(244,239,232,.6);font-family:inherit;transition:all .12s}
.sl-menu-item:hover{background:rgba(255,255,255,.06);color:#F4EFE8}
.sl-menu-item.danger{color:rgba(255,130,120,.6)}
.sl-menu-item.danger:hover{background:rgba(200,80,80,.1);color:rgba(255,130,120,.9)}

/* public badge */
.sl-public-badge{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:700;padding:2px 8px;border-radius:50px;background:rgba(20,216,144,.12);border:1px solid rgba(20,216,144,.25);color:#14d890;font-family:var(--mono);z-index:2;white-space:nowrap;letter-spacing:.02em}

/* night cards horizontal scroll */
.sl-nc-row{display:flex;gap:8px;overflow-x:auto;padding:4px 0 16px;scrollbar-width:none;-ms-overflow-style:none}
.sl-nc-row::-webkit-scrollbar{display:none}
.sl-nc-card{flex-shrink:0;width:108px;border-radius:14px;padding:10px;background:var(--night-mid);border:1px solid rgba(255,255,255,.08);cursor:pointer;transition:all .18s}
.sl-nc-card:hover{border-color:rgba(255,255,255,.16);transform:translateY(-2px)}
.sl-nc-night{font-family:var(--mono);font-size:8px;color:rgba(234,242,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.sl-nc-quote{font-family:var(--serif);font-size:10px;font-style:italic;color:rgba(234,242,255,.55);line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* shared stories section */
.sl-shared-item{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;cursor:pointer;transition:all .15s}
.sl-shared-item:hover{background:rgba(255,255,255,.04)}

/* empty */
.sl-empty{text-align:center;padding:60px 20px}
.sl-empty-emoji{font-size:56px;margin-bottom:16px;animation:slFloat 3s ease-in-out infinite}
.sl-empty-h{font-family:var(--serif);font-size:20px;font-weight:700;margin-bottom:8px;font-style:italic}
.sl-empty-sub{font-size:13px;color:rgba(234,242,255,.35);line-height:1.65;max-width:280px;margin:0 auto 24px}
.sl-empty-btn{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;border:none;border-radius:50px;padding:14px 32px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(200,130,20,.3);transition:all .2s}
.sl-empty-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}

/* confirm modal */
.sl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);animation:slFadeIn .15s ease}
.sl-confirm{background:var(--night-card);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7)}
.sl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:8px}
.sl-confirm p{font-size:13px;color:rgba(244,239,232,.4);line-height:1.6;margin-bottom:20px}
.sl-confirm-btns{display:flex;gap:10px}
.sl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.sl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
`;

interface Props { userId: string; onBack: () => void; onReadStory: (bookData: any) => void; onCreateStory: () => void; }

export default function StoryLibrary({ userId, onBack, onReadStory, onCreateStory }: Props) {
  const { isSubscribed } = useApp();
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
  const [viewingCard, setViewingCard] = useState<SavedNightCard | null>(null);

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

  const charColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    characters.forEach(c => { m[c.name] = c.color || '#1E1640'; });
    return m;
  }, [characters]);

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

  // Separate origin story
  const originStory = sorted.find(s => (s as any).isOrigin || s.title?.includes('Night You Were Found'));
  const regularStories = sorted.filter(s => s !== originStory);

  // Streak calculation
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

  const favCount = favorites.size;

  const handleDelete = async (story: SavedStory) => {
    await deleteStory(userId, story.id);
    setConfirmDelete(null);
    setMenuOpen(null);
    getStories(userId).then(setStories);
  };

  const COVER_PALETTES = [
    { bg: 'linear-gradient(145deg,#251838,#140d28)', accent: '#b48cff' },
    { bg: 'linear-gradient(145deg,#122038,#080e24)', accent: '#68b8ff' },
    { bg: 'linear-gradient(145deg,#261c08,#16100a)', accent: '#F5B84C' },
    { bg: 'linear-gradient(145deg,#102418,#081410)', accent: '#5DCAA5' },
    { bg: 'linear-gradient(145deg,#28101e,#180812)', accent: '#ff82b8' },
    { bg: 'linear-gradient(145deg,#240c10,#14080a)', accent: '#ff7878' },
  ];

  // Primary character for identity card
  const primaryChar = familyChars.length > 0 ? familyChars[0] : null;
  const primaryHeroName = primaryChar?.name || heroNames[0] || '';

  const renderBook = (s: SavedStory, index: number) => {
    const palette = COVER_PALETTES[index % COVER_PALETTES.length];
    const isFav = favorites.has(s.id);
    const emoji = bookEmoji(s.title);
    const isRitual = !(s as any).isAdventure;

    return (
      <div key={s.id} className="sl-book" style={{ animationDelay: `${index * 0.06}s` }}
        onClick={() => onReadStory(s.bookData)}>
        <div className="sl-book-cover" style={{ background: palette.bg }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${palette.accent}15, transparent 70%)` }} />
          <div className="sl-book-emoji">{emoji}</div>
          <div className="sl-book-cover-fade" />
          <div className="sl-book-cover-title">{s.title}</div>

          <button className="sl-book-menu-btn"
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id); }}>
            &#8942;
          </button>
          {menuOpen === s.id && (
            <div className="sl-menu" onClick={e => e.stopPropagation()}>
              <button className="sl-menu-item" onClick={() => { setMenuOpen(null); onReadStory(s.bookData); }}>📖 Read again</button>
              <button className="sl-menu-item" onClick={async () => {
                setMenuOpen(null);
                const text = `"${s.title}" — a bedtime story for ${s.heroName}\n${s.bookData?.refrain ? `"${s.bookData.refrain}"\n` : ''}\nsleepseed.vercel.app`;
                try { await navigator.share?.({title: s.title, text, url: 'https://sleepseed.vercel.app'}); }
                catch(_) { navigator.clipboard?.writeText(text); }
              }}>📱 Share story</button>
              {isSubscribed && !s.isPublic && (
                <button className="sl-menu-item" onClick={async () => {
                  setMenuOpen(null);
                  try {
                    await submitStoryToLibrary(s.id, userId, { ageGroup: s.ageGroup, vibe: s.vibe, mood: s.mood, storyStyle: s.storyStyle, storyLength: s.storyLength, lessons: s.lessons });
                    getStories(userId).then(setStories);
                  } catch (e) { console.error('Submit to library:', e); }
                }}>📚 Add to library</button>
              )}
              {isSubscribed && s.isPublic && (
                <button className="sl-menu-item" onClick={async () => { setMenuOpen(null); await removeStoryFromLibrary(s.id, userId); getStories(userId).then(setStories); }}>📚 Remove from library</button>
              )}
              {friends.length > 0 && (
                <button className="sl-menu-item" onClick={() => { setMenuOpen(null); setShareTarget(s); setShareMsg(''); setShareSent(false); }}>💌 Send to a friend</button>
              )}
              <button className="sl-menu-item danger" onClick={() => { setMenuOpen(null); setConfirmDelete(s); }}>🗑 Remove</button>
            </div>
          )}

          {s.isPublic && <div className="sl-public-badge">📚 In Library</div>}
        </div>

        <div className="sl-book-meta">
          <span className="sl-book-date">{formatDate(s.date)}</span>
          <button className={`sl-book-fav${isFav ? ' on' : ''}`}
            onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
            {isFav ? '⭐' : '☆'}
          </button>
          <span className="sl-book-child-name">{s.heroName} · {isRitual ? 'Ritual' : 'Adventure'}</span>
        </div>

        {/* Share to Library button */}
        {isSubscribed && !s.isPublic && (
          <div style={{ padding: '0 10px 10px' }}>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await submitStoryToLibrary(s.id, userId, { ageGroup: s.ageGroup, vibe: s.vibe, mood: s.mood, storyStyle: s.storyStyle, storyLength: s.storyLength, lessons: s.lessons });
                  getStories(userId).then(setStories);
                } catch (err) { console.error('Submit to library:', err); }
              }}
              style={{
                width: '100%', padding: '7px 12px', borderRadius: 20,
                background: 'rgba(245,184,76,.12)', border: '1px solid rgba(245,184,76,.3)',
                color: '#F5B84C', fontSize: 10, fontWeight: 700,
                fontFamily: "var(--mono)", letterSpacing: '.04em',
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,184,76,.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,184,76,.12)'; }}
            >
              Share to Library
            </button>
          </div>
        )}
        {s.isPublic && (
          <div style={{ padding: '0 10px 10px' }}>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await removeStoryFromLibrary(s.id, userId);
                getStories(userId).then(setStories);
              }}
              style={{
                width: '100%', padding: '7px 12px', borderRadius: 20,
                background: 'rgba(20,216,144,.08)', border: '1px solid rgba(20,216,144,.25)',
                color: '#14d890', fontSize: 10, fontWeight: 700,
                fontFamily: "var(--mono)", letterSpacing: '.04em',
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,216,144,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,216,144,.08)'; }}
            >
              In Library ✓
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sl" onClick={() => setMenuOpen(null)}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 0', marginBottom: 14 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'background .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(234,242,255,.55)" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(245,184,76,.5)', fontFamily: "var(--mono)", letterSpacing: '1px', marginBottom: 4 }}>LIBRARY</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#F4EFE8', fontFamily: "var(--serif)", letterSpacing: '-.5px' }}>My Stories</div>
        </div>
      </div>

      {/* Child filter tabs */}
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

      {/* YOUR WORLD section */}
      {stories.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div className="sl-world-label">YOUR WORLD</div>

          {/* Creature identity card */}
          {primaryHeroName && (
            <div className="sl-identity">
              <div className="sl-identity-ghost">👻</div>
              <div className="sl-identity-avatar">{bookEmoji(primaryHeroName)}</div>
              <div className="sl-identity-info">
                <div className="sl-identity-name">{primaryHeroName}</div>
                <div className="sl-identity-label">YOUR COMPANION</div>
              </div>
              <div className="sl-identity-right">
                <div className="sl-identity-count">{stories.length}</div>
                <div className="sl-identity-count-label">STORIES</div>
              </div>
            </div>
          )}

          {/* Three stats */}
          <div className="sl-stats">
            <div className="sl-stat">
              <div className="sl-stat-emoji">📖</div>
              <div className="sl-stat-num">{stories.length}</div>
              <div className="sl-stat-lbl">Stories</div>
            </div>
            <div className="sl-stat">
              <div className="sl-stat-emoji">✨</div>
              <div className="sl-stat-num">{nightCards.length}</div>
              <div className="sl-stat-lbl">Memories</div>
            </div>
            <div className="sl-stat">
              <div className="sl-stat-emoji">🔥</div>
              <div className="sl-stat-num">{currentStreak}</div>
              <div className="sl-stat-lbl">Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      {stories.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <input className="sl-search" placeholder="Search your stories..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
        </div>
      )}

      {/* Shared with you */}
      {sharedWithMe.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <div className="sl-section-label">💌 Shared with you</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {sharedWithMe.map(s => (
              <div key={s.id} className="sl-shared-item" style={{
                background: s.read ? 'rgba(255,255,255,.02)' : 'rgba(245,184,76,.04)',
                border: `1px solid ${s.read ? 'rgba(255,255,255,.05)' : 'rgba(245,184,76,.15)'}`,
              }}
                onClick={() => {
                  if (!s.read) markSharedStoryRead(s.id).then(() => setSharedWithMe(prev => prev.map(x => x.id === s.id ? { ...x, read: true } : x)));
                  if (s.bookData) onReadStory(s.bookData);
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(145deg,#251838,#140d28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📖</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F4EFE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.storyTitle}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'rgba(234,242,255,.3)' }}>
                    From {s.fromDisplayName}{s.message ? ` · "${s.message}"` : ''} · {s.sharedAt?.split('T')[0]}
                  </div>
                </div>
                {!s.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5B84C', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      {stories.length === 0 ? (
        <div style={{ padding: '0 20px' }}>
          <div className="sl-empty">
            <div className="sl-empty-emoji">📚</div>
            <div className="sl-empty-h">Your bookshelf is empty</div>
            <div className="sl-empty-sub">Every story you create gets added here — your very own library, ready to read any night.</div>
            <button className="sl-empty-btn" onClick={onCreateStory}>Create your first story ✨</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '0 20px' }}>
          <div className="sl-empty">
            <div className="sl-empty-emoji">🔍</div>
            <div className="sl-empty-h" style={{ fontSize: 16 }}>No stories found</div>
            <div className="sl-empty-sub">Try a different search or filter.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Origin story card */}
          {originStory && !search && filter === 'all' && (
            <div style={{ padding: '0 20px', marginBottom: 16 }}>
              <div className="sl-origin-label">✦ ORIGIN STORY</div>
              <div className="sl-origin" onClick={() => onReadStory(originStory.bookData)}>
                <div className="sl-origin-cover">
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(245,184,76,.15), transparent 70%)' }} />
                  <div className="sl-origin-emoji">{bookEmoji(originStory.title)}</div>
                  <div className="sl-origin-overlay">
                    <div className="sl-origin-title">{originStory.title}</div>
                    <div className="sl-origin-meta">YOUR FIRST STORY · {formatDate(originStory.date)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MY STORIES grid */}
          <div style={{ padding: '0 20px', marginBottom: 18 }}>
            <div className="sl-section-label">MY STORIES</div>
            <div className="sl-grid">
              {regularStories.map((s, i) => renderBook(s, i))}
            </div>
          </div>

          {/* Night Cards horizontal scroll */}
          {nightCards.length > 0 && !search && filter === 'all' && (
            <div style={{ padding: '0 20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="sl-section-label" style={{ margin: 0 }}>NIGHT CARDS</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(234,242,255,.25)', cursor: 'pointer' }}>See all →</span>
              </div>
              <div className="sl-nc-row">
                {nightCards.slice(0, 10).map((nc, i) => {
                  const accent = COVER_PALETTES[i % COVER_PALETTES.length].accent;
                  return (
                    <div key={nc.id || i} className="sl-nc-card" style={{ borderColor: `${accent}30` }}
                      onClick={() => setViewingCard(nc)}>
                      <div className="sl-nc-night" style={{ color: `${accent}99` }}>Night {nightCards.length - i}</div>
                      <div className="sl-nc-quote">{nc.quote || nc.memory_line || '...'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* delete confirmation */}
      {confirmDelete && (
        <div className="sl-confirm-bg" onClick={() => setConfirmDelete(null)}>
          <div className="sl-confirm" onClick={e => e.stopPropagation()}>
            <h3>Remove this story?</h3>
            <p>"{confirmDelete.title}" will be removed from your bookshelf. This can't be undone.</p>
            <div className="sl-confirm-btns">
              <button className="sl-confirm-cancel" onClick={() => setConfirmDelete(null)}>Keep it</button>
              <button className="sl-confirm-del" onClick={() => handleDelete(confirmDelete)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* send to friend modal */}
      {shareTarget && (
        <div className="sl-confirm-bg" onClick={() => setShareTarget(null)}>
          <div className="sl-confirm" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
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
                <button className="sl-confirm-cancel" onClick={() => setShareTarget(null)} style={{ marginTop: 12, width: '100%' }}>Cancel</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <h3>Story sent!</h3>
                <p>They'll see it in their "Shared with you" section.</p>
                <button className="sl-confirm-cancel" onClick={() => setShareTarget(null)} style={{ marginTop: 8, width: '100%' }}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Night card viewer */}
      {viewingCard && (
        <div className="sl-confirm-bg" onClick={() => setViewingCard(null)}>
          <div className="sl-confirm" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '.8px', textTransform: 'uppercase', color: 'rgba(245,184,76,.6)' }}>
                Night Card · {viewingCard.date?.split('T')[0]}
              </div>
              <button onClick={() => setViewingCard(null)} style={{ background: 'none', border: 'none', color: 'rgba(244,239,232,.3)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            {viewingCard.storyTitle && (
              <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 700, color: '#F4EFE8', marginBottom: 8 }}>{viewingCard.storyTitle}</div>
            )}
            {viewingCard.quote && (
              <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic', color: 'rgba(234,242,255,.5)', lineHeight: 1.6, borderLeft: '2px solid rgba(154,127,212,.4)', paddingLeft: 10, marginBottom: 12 }}>
                "{viewingCard.quote}"
              </div>
            )}
            {viewingCard.memory_line && (
              <div style={{ fontSize: 12, color: 'rgba(234,242,255,.4)', lineHeight: 1.6, marginBottom: 12 }}>{viewingCard.memory_line}</div>
            )}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(234,242,255,.2)' }}>
              {viewingCard.heroName}{viewingCard.nightNumber ? ` · Night ${viewingCard.nightNumber}` : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
