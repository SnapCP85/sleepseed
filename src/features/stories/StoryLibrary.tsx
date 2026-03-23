import { useState, useEffect, useMemo } from 'react';
import { getStories, deleteStory, getCharacters } from '../../lib/storage';
import type { SavedStory, Character } from '../../lib/types';

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

function getExcerpt(bookData: any): string {
  try {
    const pages = bookData?.pages || bookData?.setup_pages || [];
    const first = pages[0];
    if (first?.text) return first.text.slice(0, 90) + (first.text.length > 90 ? '…' : '');
  } catch {}
  return '';
}

// Book spine/cover color palettes based on character color
const BOOK_PALETTES = [
  { bg: 'linear-gradient(145deg,#2a1a40,#1a1030)', spine: '#6a4aaa', accent: '#b48cff' },
  { bg: 'linear-gradient(145deg,#1a2a40,#0a1830)', spine: '#4a7aaa', accent: '#68b8ff' },
  { bg: 'linear-gradient(145deg,#2a2010,#1a1408)', spine: '#8a6a20', accent: '#F5B84C' },
  { bg: 'linear-gradient(145deg,#1a3028,#0a2018)', spine: '#2a8a5a', accent: '#5DCAA5' },
  { bg: 'linear-gradient(145deg,#301a2a,#200a1a)', spine: '#aa4a7a', accent: '#ff68a8' },
  { bg: 'linear-gradient(145deg,#2a1018,#1a0810)', spine: '#aa3a3a', accent: '#ff6868' },
];

const BOOK_EMOJIS = ['📖','📕','📗','📘','📙','📓','✨','🌙','⭐','🦊','🐰','🐉','🦉','🐻','🦋'];

function bookPalette(index: number) {
  return BOOK_PALETTES[index % BOOK_PALETTES.length];
}

function bookEmoji(title: string): string {
  // Deterministic emoji from title
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash) + title.charCodeAt(i);
  return BOOK_EMOJIS[Math.abs(hash) % BOOK_EMOJIS.length];
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes slFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes slShine{0%{left:-100%}100%{left:200%}}

.sl{min-height:100vh;background:radial-gradient(ellipse 130% 50% at 50% 0%,#10082a 0%,#0a0618 40%,#060410 100%);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased}

/* nav */
.sl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:56px;border-bottom:1px solid rgba(180,140,255,.08);background:rgba(10,6,24,.92);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.sl-back{background:none;border:none;color:rgba(244,239,232,.45);font-size:12px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:color .15s;font-weight:600}
.sl-back:hover{color:rgba(244,239,232,.75)}
.sl-header{text-align:center;flex:1}
.sl-header-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700}
.sl-header-count{font-size:10px;color:rgba(244,239,232,.3);font-family:'DM Mono',monospace}

.sl-inner{max-width:500px;margin:0 auto;padding:20px 16px 90px}

/* search */
.sl-search{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:11px 14px;font-size:13px;color:#F4EFE8;outline:none;font-family:inherit;transition:border-color .2s;margin-bottom:12px}
.sl-search:focus{border-color:rgba(180,140,255,.3)}
.sl-search::placeholder{color:rgba(255,255,255,.2)}

/* filter chips */
.sl-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.sl-filter{padding:6px 14px;border-radius:50px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.4);transition:all .18s}
.sl-filter.on{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.1);color:#F5B84C}

/* shelf section */
.sl-shelf-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,184,76,.5);font-family:'DM Mono',monospace;margin:16px 0 10px 4px;font-weight:600}

/* ═══════════════════════════════════════════
   BOOK GRID — bookshelf layout
═══════════════════════════════════════════ */
.sl-shelf{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:8px}

/* individual book */
.sl-book{border-radius:16px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;animation:slFadeIn .4s ease-out both}
.sl-book:hover{transform:translateY(-4px) scale(1.02)}
.sl-book:active{transform:scale(.97)}
/* shimmer */
.sl-book::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.04),transparent);pointer-events:none;animation:slShine 8s ease-in-out infinite}

/* book cover */
.sl-book-cover{aspect-ratio:3/4;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 12px;overflow:hidden}
/* spine edge */
.sl-book-cover::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;border-radius:16px 0 0 16px}
/* top shine */
.sl-book-cover::after{content:'';position:absolute;top:0;left:0;right:0;height:1px}

.sl-book-emoji{font-size:42px;margin-bottom:8px;animation:slFloat 4s ease-in-out infinite;filter:drop-shadow(0 3px 8px rgba(0,0,0,.3))}
.sl-book-title{font-family:'Fraunces',serif;font-size:13px;font-weight:700;text-align:center;line-height:1.3;color:#F4EFE8;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sl-book-hero{font-size:9.5px;font-weight:700;text-align:center;opacity:.5}
.sl-book-date{position:absolute;bottom:8px;right:10px;font-size:8px;font-family:'DM Mono',monospace;opacity:.3}

/* fav star */
.sl-book-fav{position:absolute;top:8px;right:8px;font-size:14px;z-index:2;cursor:pointer;opacity:.3;transition:all .15s;background:none;border:none;padding:2px}
.sl-book-fav.on{opacity:1;filter:drop-shadow(0 0 4px rgba(245,184,76,.5))}
.sl-book-fav:hover{transform:scale(1.2)}

/* menu */
.sl-book-menu-btn{position:absolute;top:8px;left:8px;font-size:14px;z-index:2;cursor:pointer;opacity:.2;transition:all .15s;background:none;border:none;color:#F4EFE8;padding:2px 4px;border-radius:6px}
.sl-book-menu-btn:hover{opacity:.6;background:rgba(0,0,0,.3)}
.sl-menu{position:absolute;top:28px;left:8px;background:rgba(10,8,24,.97);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px;z-index:10;min-width:130px;box-shadow:0 12px 40px rgba(0,0,0,.7);backdrop-filter:blur(16px);animation:slFadeIn .15s ease}
.sl-menu-item{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(244,239,232,.6);font-family:inherit;transition:all .12s}
.sl-menu-item:hover{background:rgba(255,255,255,.06);color:#F4EFE8}
.sl-menu-item.danger{color:rgba(255,130,120,.6)}
.sl-menu-item.danger:hover{background:rgba(200,80,80,.1);color:rgba(255,130,120,.9)}

/* empty */
.sl-empty{text-align:center;padding:60px 20px}
.sl-empty-emoji{font-size:56px;margin-bottom:16px;animation:slFloat 3s ease-in-out infinite}
.sl-empty-h{font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin-bottom:8px;font-style:italic}
.sl-empty-sub{font-size:13px;color:rgba(244,239,232,.35);line-height:1.65;max-width:280px;margin:0 auto 24px}
.sl-empty-btn{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;border:none;border-radius:50px;padding:14px 32px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(200,130,20,.3);transition:all .2s}
.sl-empty-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}

/* shelf decoration — wood grain effect */
.sl-shelf-row{position:relative;padding-bottom:8px;margin-bottom:4px}
.sl-shelf-row::after{content:'';position:absolute;bottom:0;left:-16px;right:-16px;height:8px;background:linear-gradient(180deg,rgba(80,50,20,.15),rgba(60,35,15,.08));border-radius:0 0 4px 4px;border-top:1px solid rgba(120,80,30,.12)}

/* confirm modal */
.sl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);animation:slFadeIn .15s ease}
.sl-confirm{background:rgba(10,8,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7)}
.sl-confirm h3{font-family:'Fraunces',serif;font-size:18px;font-weight:700;margin-bottom:8px}
.sl-confirm p{font-size:13px;color:rgba(244,239,232,.4);line-height:1.6;margin-bottom:20px}
.sl-confirm-btns{display:flex;gap:10px}
.sl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.sl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
`;

interface Props { userId: string; onBack: () => void; onReadStory: (bookData: any) => void; onCreateStory: () => void; }

export default function StoryLibrary({ userId, onBack, onReadStory, onCreateStory }: Props) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedStory | null>(null);

  useEffect(() => {
    getStories(userId).then(setStories);
    getCharacters(userId).then(setCharacters);
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

  const favStories = sorted.filter(s => favorites.has(s.id));
  const otherStories = sorted.filter(s => !favorites.has(s.id));

  const handleDelete = async (story: SavedStory) => {
    await deleteStory(userId, story.id);
    setConfirmDelete(null);
    setMenuOpen(null);
    getStories(userId).then(setStories);
  };

  const renderBook = (s: SavedStory, index: number) => {
    const palette = bookPalette(index);
    const isFav = favorites.has(s.id);
    const emoji = bookEmoji(s.title);
    const coverImg = s.bookData?.coverUrl;

    return (
      <div key={s.id} className="sl-book" style={{ animationDelay: `${index * 0.06}s` }}
        onClick={() => onReadStory(s.bookData)}>
        <div className="sl-book-cover" style={{
          background: coverImg ? `url(${coverImg}) center/cover` : palette.bg,
          borderBottom: `3px solid ${palette.spine}`,
        }}>
          {/* spine */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: `linear-gradient(180deg,${palette.spine},${palette.spine}88)`, borderRadius: '16px 0 0 16px' }} />
          {/* top shine */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${palette.accent}30,transparent)` }} />

          {/* cover overlay for readability when using cover image */}
          {coverImg && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />}

          {/* fav button */}
          <button className={`sl-book-fav${isFav ? ' on' : ''}`}
            onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
            {isFav ? '⭐' : '☆'}
          </button>

          {/* menu button */}
          <button className="sl-book-menu-btn"
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id); }}>
            ⋮
          </button>
          {menuOpen === s.id && (
            <div className="sl-menu" onClick={e => e.stopPropagation()}>
              <button className="sl-menu-item" onClick={() => { setMenuOpen(null); onReadStory(s.bookData); }}>
                📖 Read again
              </button>
              <button className="sl-menu-item danger" onClick={() => { setMenuOpen(null); setConfirmDelete(s); }}>
                🗑 Remove
              </button>
            </div>
          )}

          {/* book content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div className="sl-book-emoji">{emoji}</div>
            <div className="sl-book-title">{s.title}</div>
            <div className="sl-book-hero" style={{ color: palette.accent }}>{s.heroName}</div>
          </div>

          <div className="sl-book-date">{formatDate(s.date)}</div>
        </div>
      </div>
    );
  };

  // group into shelf rows of 2
  function shelfRows(items: SavedStory[], startIndex: number) {
    const rows: SavedStory[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return rows.map((row, ri) => (
      <div key={ri} className="sl-shelf-row">
        <div className="sl-shelf">
          {row.map((s, si) => renderBook(s, startIndex + ri * 2 + si))}
        </div>
      </div>
    ));
  }

  return (
    <div className="sl" onClick={() => setMenuOpen(null)}>
      <style>{CSS}</style>

      <nav className="sl-nav">
        <button className="sl-back" onClick={onBack}>← Home</button>
        <div className="sl-header">
          <div className="sl-header-title">📚 My Bookshelf</div>
          {stories.length > 0 && <div className="sl-header-count">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</div>}
        </div>
        <div style={{ width: 50 }} />
      </nav>

      <div className="sl-inner">
        {/* search + filters */}
        {stories.length > 0 && (
          <>
            <input className="sl-search" placeholder="Search your stories…" value={search}
              onChange={e => setSearch(e.target.value)} />
            {heroNames.length > 1 && (
              <div className="sl-filters">
                <div className={`sl-filter${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>All</div>
                {heroNames.map(n => (
                  <div key={n} className={`sl-filter${filter === n ? ' on' : ''}`}
                    onClick={() => setFilter(filter === n ? 'all' : n)}>{n}</div>
                ))}
              </div>
            )}
          </>
        )}

        {/* empty state */}
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
            {/* favorites shelf */}
            {favStories.length > 0 && otherStories.length > 0 && (
              <div className="sl-shelf-label">⭐ Favorites</div>
            )}
            {favStories.length > 0 && shelfRows(favStories, 0)}

            {/* all stories shelf */}
            {favStories.length > 0 && otherStories.length > 0 && (
              <div className="sl-shelf-label">📖 All Stories</div>
            )}
            {shelfRows(otherStories, favStories.length)}
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
    </div>
  );
}
