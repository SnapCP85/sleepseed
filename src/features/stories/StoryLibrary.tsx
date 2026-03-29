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
:root{--night:#060912;--night-card:#0f1525;--night-raised:#141a2e;--amber:#F5B84C;--amber-deep:#E8972A;--cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);--teal:#14d890;--purple:#9482ff;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes slFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes slFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slShine{0%{left:-100%}100%{left:200%}}

.sl{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:80px}

/* nav */
.sl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(8,12,24,.92);position:sticky;top:0;z-index:10;backdrop-filter:blur(20px)}
.sl-nav-title{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--cream)}
.sl-nav-title span{color:var(--amber)}
.sl-nav-menu{width:34px;height:34px;border-radius:50%;background:rgba(244,239,232,.06);border:none;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;color:var(--cream-faint)}

.sl-inner{max-width:500px;margin:0 auto;padding:0 20px}

/* child filter tabs */
.sl-child-tabs{display:flex;gap:6px;overflow-x:auto;padding:14px 0 16px;scrollbar-width:none;-ms-overflow-style:none}
.sl-child-tabs::-webkit-scrollbar{display:none}
.sl-child-tab{flex-shrink:0;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(244,239,232,.08);background:transparent;color:var(--cream-faint);transition:all .18s;font-family:var(--sans)}
.sl-child-tab:hover{border-color:rgba(244,239,232,.15);color:var(--cream-dim)}
.sl-child-tab.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.1);color:var(--amber)}
.sl-child-tab.purple{border-color:rgba(148,130,255,.4);background:rgba(148,130,255,.1);color:var(--purple)}

/* stats bar */
.sl-stats{display:flex;gap:8px;margin:0 0 20px}
.sl-stat{flex:1;background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:14px;padding:12px 14px;text-align:center}
.sl-stat-num{font-family:var(--serif);font-size:24px;font-weight:600;color:var(--amber)}
.sl-stat-lbl{font-family:var(--sans);font-size:10px;font-weight:600;color:var(--cream-faint);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}

/* search */
.sl-search{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(244,239,232,.08);border-radius:14px;padding:11px 14px;font-size:13px;color:var(--cream);outline:none;font-family:inherit;transition:border-color .2s;margin-bottom:12px}
.sl-search:focus{border-color:rgba(245,184,76,.3)}
.sl-search::placeholder{color:rgba(255,255,255,.2)}

/* origin story card */
.sl-origin{display:flex;align-items:center;gap:16px;padding:16px;background:var(--night-card);border:1px solid rgba(245,184,76,.2);border-radius:20px;cursor:pointer;margin-bottom:16px;transition:all .22s;animation:fadeUp .4s ease both}
.sl-origin:hover{transform:translateY(-2px);border-color:rgba(245,184,76,.35)}
.sl-origin-emoji{font-size:52px;animation:slFloat 4s ease-in-out infinite;flex-shrink:0}
.sl-origin-info{flex:1;min-width:0}
.sl-origin-badge{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin-bottom:4px}
.sl-origin-title{font-family:var(--serif);font-size:14px;font-weight:500;color:var(--cream);line-height:1.3}
.sl-origin-meta{font-family:var(--sans);font-size:11px;color:var(--cream-faint);margin-top:4px}

/* book grid */
.sl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
.sl-book{border-radius:20px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;background:var(--night-card);border:1px solid rgba(244,239,232,.07);animation:slFadeIn .4s ease-out both}
.sl-book:hover{transform:translateY(-4px);border-color:rgba(244,239,232,.14)}
.sl-book:active{transform:scale(.97)}
.sl-book::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.04),transparent);pointer-events:none;animation:slShine 8s ease-in-out infinite}

/* book cover */
.sl-book-cover{height:130px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.sl-book-cover-overlay{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(transparent,rgba(0,0,0,.5));z-index:1}
.sl-book-cover-title{position:absolute;bottom:8px;left:10px;right:10px;z-index:2;font-family:var(--serif);font-size:11px;font-weight:600;color:rgba(255,255,255,.9);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sl-book-emoji{font-size:38px;animation:slFloat 4s ease-in-out infinite;position:relative;z-index:1;filter:drop-shadow(0 3px 8px rgba(0,0,0,.3))}

/* book info area */
.sl-book-info{padding:10px 12px 12px}
.sl-book-meta{display:flex;align-items:center;justify-content:space-between}
.sl-book-date{font-family:var(--mono);font-size:9px;color:var(--cream-faint)}
.sl-book-fav{font-size:14px;cursor:pointer;opacity:.3;transition:all .15s;background:none;border:none;padding:2px}
.sl-book-fav.on{opacity:1;filter:drop-shadow(0 0 4px rgba(245,184,76,.5))}
.sl-book-fav:hover{transform:scale(1.2)}
.sl-book-child{display:flex;align-items:center;gap:4px;margin-top:4px}
.sl-book-child-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.sl-book-child-name{font-family:var(--sans);font-size:10px;color:var(--cream-faint)}

/* menu */
.sl-book-menu-btn{position:absolute;top:8px;left:8px;font-size:14px;z-index:3;cursor:pointer;opacity:.2;transition:all .15s;background:none;border:none;color:#F4EFE8;padding:2px 4px;border-radius:6px}
.sl-book-menu-btn:hover{opacity:.6;background:rgba(0,0,0,.3)}
.sl-menu{position:absolute;top:28px;left:8px;background:rgba(10,8,24,.97);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px;z-index:10;min-width:130px;box-shadow:0 12px 40px rgba(0,0,0,.7);backdrop-filter:blur(16px);animation:slFadeIn .15s ease}
.sl-menu-item{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(244,239,232,.6);font-family:inherit;transition:all .12s}
.sl-menu-item:hover{background:rgba(255,255,255,.06);color:#F4EFE8}
.sl-menu-item.danger{color:rgba(255,130,120,.6)}
.sl-menu-item.danger:hover{background:rgba(200,80,80,.1);color:rgba(255,130,120,.9)}

/* shared stories section */
.sl-shelf-label{font-family:var(--mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--cream-faint);margin:16px 0 10px 4px;font-weight:600}

/* empty */
.sl-empty{text-align:center;padding:60px 20px}
.sl-empty-emoji{font-size:56px;margin-bottom:16px;animation:slFloat 3s ease-in-out infinite}
.sl-empty-h{font-family:var(--serif);font-size:20px;font-weight:700;margin-bottom:8px;font-style:italic}
.sl-empty-sub{font-size:13px;color:var(--cream-faint);line-height:1.65;max-width:280px;margin:0 auto 24px}
.sl-empty-btn{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;border:none;border-radius:50px;padding:14px 32px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(200,130,20,.3);transition:all .2s}
.sl-empty-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}

/* confirm modal */
.sl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);animation:slFadeIn .15s ease}
.sl-confirm{background:rgba(10,8,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7)}
.sl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;margin-bottom:8px}
.sl-confirm p{font-size:13px;color:rgba(244,239,232,.4);line-height:1.6;margin-bottom:20px}
.sl-confirm-btns{display:flex;gap:10px}
.sl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.sl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}

/* public badge */
.sl-public-badge{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:700;padding:3px 10px;border-radius:50px;background:rgba(20,216,144,.15);border:1px solid rgba(20,216,144,.3);color:#14d890;font-family:var(--mono);z-index:2;white-space:nowrap;letter-spacing:.02em}
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

  useEffect(() => {
    getStories(userId).then(setStories);
    getCharacters(userId).then(setCharacters);
    getNightCards(userId).then(setNightCards);
    getFriends(userId).then(setFriends);
    getSharedStories(userId).then(setSharedWithMe);
    try {
      const fav = JSON.parse(localStorage.getItem(`ss_fav_stories_${userId}`) || '[]');
      setFavorites(new Set(fav));
    } catch {}
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
    { bg: 'linear-gradient(145deg,#2a1a40,#1a1030)', accent: '#b48cff' },
    { bg: 'linear-gradient(145deg,#1a2a40,#0a1830)', accent: '#68b8ff' },
    { bg: 'linear-gradient(145deg,#2a2010,#1a1408)', accent: '#F5B84C' },
    { bg: 'linear-gradient(145deg,#1a3028,#0a2018)', accent: '#5DCAA5' },
    { bg: 'linear-gradient(145deg,#301a2a,#200a1a)', accent: '#ff68a8' },
    { bg: 'linear-gradient(145deg,#2a1018,#1a0810)', accent: '#ff6868' },
  ];

  const renderBook = (s: SavedStory, index: number) => {
    const palette = COVER_PALETTES[index % COVER_PALETTES.length];
    const isFav = favorites.has(s.id);
    const emoji = bookEmoji(s.title);
    const childColor = charColorMap[s.heroName] || '#1E1640';
    const isRitual = !(s as any).isAdventure;

    return (
      <div key={s.id} className="sl-book" style={{ animationDelay: `${index * 0.06}s` }}
        onClick={() => onReadStory(s.bookData)}>
        <div className="sl-book-cover" style={{ background: palette.bg }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${palette.accent}15, transparent 70%)` }} />
          <div className="sl-book-emoji">{emoji}</div>
          <div className="sl-book-cover-overlay" />
          <div className="sl-book-cover-title">{s.title}</div>

          <button className="sl-book-menu-btn"
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id); }}>
            ⋮
          </button>
          {menuOpen === s.id && (
            <div className="sl-menu" onClick={e => e.stopPropagation()}>
              <button className="sl-menu-item" onClick={() => { setMenuOpen(null); onReadStory(s.bookData); }}>📖 Read again</button>
              <button className="sl-menu-item" onClick={async () => {
                setMenuOpen(null);
                const text = `"${s.title}" — a bedtime story for ${s.heroName}\n${s.bookData?.refrain ? `"${s.bookData.refrain}"\n` : ''}\nsleepseed-vercel.vercel.app`;
                try { await navigator.share?.({title: s.title, text, url: 'https://sleepseed-vercel.vercel.app'}); }
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

        <div className="sl-book-info">
          <div className="sl-book-meta">
            <div className="sl-book-date">{formatDate(s.date)}</div>
            <button className={`sl-book-fav${isFav ? ' on' : ''}`}
              onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
              {isFav ? '⭐' : '☆'}
            </button>
          </div>
          <div className="sl-book-child">
            <div className="sl-book-child-dot" style={{ background: childColor }} />
            <div className="sl-book-child-name">{s.heroName} · {isRitual ? 'Ritual' : 'Adventure'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sl" onClick={() => setMenuOpen(null)}>
      <style>{CSS}</style>

      <nav className="sl-nav">
        <div className="sl-nav-title">My <span>Books</span></div>
        <button className="sl-nav-menu" onClick={e => e.stopPropagation()}>⋮</button>
      </nav>

      <div className="sl-inner">
        {/* Child filter tabs */}
        {familyChars.length > 0 && (
          <div className="sl-child-tabs">
            <div className={`sl-child-tab${filter === 'all' ? ' purple' : ''}`} onClick={() => setFilter('all')}>🦉 All Children</div>
            {heroNames.map(n => (
              <div key={n} className={`sl-child-tab${filter === n ? ' on' : ''}`}
                onClick={() => setFilter(filter === n ? 'all' : n)}>{n}</div>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        {stories.length > 0 && (
          <div className="sl-stats">
            <div className="sl-stat">
              <div className="sl-stat-num">{stories.length}</div>
              <div className="sl-stat-lbl">Stories</div>
            </div>
            <div className="sl-stat">
              <div className="sl-stat-num">{currentStreak}</div>
              <div className="sl-stat-lbl">Night Streak</div>
            </div>
            <div className="sl-stat">
              <div className="sl-stat-num">{favCount}</div>
              <div className="sl-stat-lbl">Favourites</div>
            </div>
          </div>
        )}

        {/* Search */}
        {stories.length > 0 && (
          <input className="sl-search" placeholder="Search your stories…" value={search}
            onChange={e => setSearch(e.target.value)} />
        )}

        {/* Shared with you */}
        {sharedWithMe.length > 0 && (
          <>
            <div className="sl-shelf-label">💌 Shared with you</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {sharedWithMe.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14,
                  background: s.read ? 'rgba(255,255,255,.02)' : 'rgba(245,184,76,.04)',
                  border: `1px solid ${s.read ? 'rgba(255,255,255,.05)' : 'rgba(245,184,76,.15)'}`,
                  cursor: 'pointer', transition: 'all .15s' }}
                  onClick={() => {
                    if (!s.read) markSharedStoryRead(s.id).then(() => setSharedWithMe(prev => prev.map(x => x.id === s.id ? { ...x, read: true } : x)));
                    if (s.bookData) onReadStory(s.bookData);
                  }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(145deg,#2a1a40,#1a1030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📖</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F4EFE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.storyTitle}</div>
                    <div style={{ fontSize: 10, color: 'rgba(244,239,232,.35)' }}>
                      From {s.fromDisplayName}{s.message ? ` · "${s.message}"` : ''} · {s.sharedAt?.split('T')[0]}
                    </div>
                  </div>
                  {!s.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5B84C', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {stories.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-emoji">📚</div>
            <div className="sl-empty-h">Your bookshelf is empty</div>
            <div className="sl-empty-sub">Every story you create gets added here — your very own library, ready to read any night.</div>
            <button className="sl-empty-btn" onClick={onCreateStory}>Create your first story ✨</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-emoji">🔍</div>
            <div className="sl-empty-h" style={{ fontSize: 16 }}>No stories found</div>
            <div className="sl-empty-sub">Try a different search or filter.</div>
          </div>
        ) : (
          <>
            {/* Origin story — full width */}
            {originStory && !search && filter === 'all' && (
              <div className="sl-origin" onClick={() => onReadStory(originStory.bookData)}>
                <div className="sl-origin-emoji">{bookEmoji(originStory.title)}</div>
                <div className="sl-origin-info">
                  <div className="sl-origin-badge">Origin Story ✦</div>
                  <div className="sl-origin-title">{originStory.title}</div>
                  <div className="sl-origin-meta">{originStory.heroName}'s first story · {formatDate(originStory.date)}</div>
                </div>
              </div>
            )}

            {/* Book grid */}
            <div className="sl-grid">
              {regularStories.map((s, i) => renderBook(s, i))}
            </div>
          </>
        )}
      </div>

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
    </div>
  );
}
