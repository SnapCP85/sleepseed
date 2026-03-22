import { useState, useEffect, useMemo } from 'react';
import { getStories, deleteStory, getCharacters } from '../../lib/storage';
import type { SavedStory, Character } from '../../lib/types';

// ── Date helper ──────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Tonight';
    if (diff === 1) return 'Last night';
    if (diff < 7) return `${diff} nights ago`;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function getExcerpt(bookData: any): string {
  try {
    const pages = bookData?.pages || bookData?.setup_pages || [];
    const first = pages[0];
    if (first?.text) return first.text.slice(0, 120) + (first.text.length > 120 ? '...' : '');
  } catch {}
  return '';
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--cream:#FEF9F2;--ink:#1A1420;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
.sl{min-height:100vh;background:var(--night);font-family:var(--sans);color:#F4EFE8;-webkit-font-smoothing:antialiased}
.sl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:64px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(13,16,24,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.sl-nav-left{display:flex;align-items:center;gap:14px}
.sl-back{background:transparent;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s}
.sl-back:hover{color:rgba(244,239,232,.75)}
.sl-title{font-family:var(--serif);font-size:18px;font-weight:700;color:#F4EFE8}
.sl-count{font-size:10px;color:rgba(244,239,232,.25);font-family:var(--mono);background:rgba(255,255,255,.04);padding:3px 9px;border-radius:50px;border:1px solid rgba(255,255,255,.06)}
.sl-inner{max-width:680px;margin:0 auto;padding:32px 24px}
.sl-empty{text-align:center;padding:80px 24px}
.sl-empty-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 20px;opacity:.4}
.sl-empty-h{font-family:var(--serif);font-size:22px;font-weight:700;color:#F4EFE8;margin-bottom:10px;font-style:italic}
.sl-empty-sub{font-size:14px;color:rgba(244,239,232,.38);line-height:1.72;max-width:340px;margin:0 auto 28px;font-weight:300}
.sl-cta-btn{background:var(--amber);color:var(--ink);border:none;border-radius:50px;padding:14px 36px;font-size:15px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
.sl-cta-btn:hover{background:var(--amber2);transform:translateY(-1px)}
.sl-grid{display:flex;flex-direction:column;gap:12px}
.sl-card{border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)}
.sl-card:hover{background:rgba(255,255,255,.05);border-color:rgba(232,151,42,.2);transform:translateY(-2px);box-shadow:0 8px 28px rgba(232,151,42,.06)}
.sl-card-accent{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:18px 0 0 18px}
.sl-card-body{padding:16px 20px 14px 24px;display:flex;align-items:flex-start;gap:14px}
.sl-card-info{flex:1;min-width:0}
.sl-card-title{font-family:var(--serif);font-size:15px;font-weight:700;color:#F4EFE8;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sl-card-meta{font-size:10px;color:rgba(244,239,232,.32);font-family:var(--mono);display:flex;align-items:center;gap:8px}
.sl-card-excerpt{font-size:12px;color:rgba(244,239,232,.3);font-style:italic;line-height:1.6;margin-top:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-family:var(--serif)}
.sl-card-right{display:flex;align-items:center;gap:6px;flex-shrink:0;padding-top:2px}
.sl-fav-btn{background:none;border:none;font-size:16px;cursor:pointer;padding:4px;transition:transform .15s;opacity:.3}
.sl-fav-btn:hover{transform:scale(1.2)}
.sl-fav-btn.on{opacity:1}
.sl-card-menu-btn{background:none;border:none;color:rgba(244,239,232,.25);font-size:16px;cursor:pointer;padding:4px 6px;border-radius:6px;transition:all .15s}
.sl-card-menu-btn:hover{background:rgba(255,255,255,.06);color:rgba(244,239,232,.6)}
.sl-card-menu{position:absolute;top:40px;right:16px;background:rgba(13,16,24,.97);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:4px;z-index:10;min-width:140px;box-shadow:0 12px 40px rgba(0,0,0,.6);backdrop-filter:blur(16px);animation:slMenuIn .15s ease}
@keyframes slMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.sl-card-menu-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;border:none;background:none;width:100%;text-align:left;color:rgba(244,239,232,.6);font-family:var(--sans);transition:all .12s}
.sl-card-menu-item:hover{background:rgba(255,255,255,.06);color:#F4EFE8}
.sl-card-menu-item.danger{color:rgba(255,140,130,.6)}
.sl-card-menu-item.danger:hover{background:rgba(200,80,80,.1);color:rgba(255,140,130,.9)}
.sl-refrain{padding:10px 20px 10px 24px;border-top:1px solid rgba(255,255,255,.05);font-family:var(--serif);font-size:11.5px;font-style:italic;color:rgba(244,239,232,.3);line-height:1.65;background:rgba(255,255,255,.01)}

/* confirm modal */
.sl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadein .15s ease}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.sl-confirm{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:slideup .2s cubic-bezier(.22,1,.36,1)}
@keyframes slideup{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.sl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;color:#F4EFE8;margin-bottom:8px}
.sl-confirm p{font-size:13px;color:rgba(244,239,232,.4);line-height:1.6;margin-bottom:20px}
.sl-confirm-btns{display:flex;gap:10px}
.sl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.sl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}

/* sections */
.sl-section-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--amber);font-family:var(--mono);margin-bottom:10px;padding-left:4px;font-weight:600}
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
    // Load favorites from localStorage
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

  // Sort: favorites first, then by date descending
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

  const renderCard = (s: SavedStory) => {
    const accent = charColorMap[s.heroName] || '#1E1640';
    const excerpt = getExcerpt(s.bookData);
    const isFav = favorites.has(s.id);
    return (
      <div key={s.id} className="sl-card" onClick={() => onReadStory(s.bookData)}>
        <div className="sl-card-accent" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}88)` }} />
        <div className="sl-card-body">
          <div className="sl-card-info">
            <div className="sl-card-title">{s.title}</div>
            <div className="sl-card-meta">
              <span>{s.heroName}</span>
              <span style={{opacity:.4}}>·</span>
              <span>{formatDate(s.date)}</span>
              {s.occasion && <><span style={{opacity:.4}}>·</span><span>{s.occasion}</span></>}
            </div>
            {excerpt && <div className="sl-card-excerpt">{excerpt}</div>}
          </div>
          <div className="sl-card-right">
            <button className={`sl-fav-btn${isFav ? ' on' : ''}`}
              onClick={e => { e.stopPropagation(); toggleFav(s.id); }}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
              {isFav ? '★' : '☆'}
            </button>
            <button className="sl-card-menu-btn"
              onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id); }}>
              ⋮
            </button>
            {menuOpen === s.id && (
              <div className="sl-card-menu" onClick={e => e.stopPropagation()}>
                <button className="sl-card-menu-item" onClick={() => { setMenuOpen(null); onReadStory(s.bookData); }}>
                  📖 Re-read story
                </button>
                <button className="sl-card-menu-item danger" onClick={() => { setMenuOpen(null); setConfirmDelete(s); }}>
                  🗑 Remove story
                </button>
              </div>
            )}
          </div>
        </div>
        {s.refrain && <div className="sl-refrain">"{s.refrain}"</div>}
      </div>
    );
  };

  return (
    <div className="sl" onClick={() => setMenuOpen(null)}>
      <style>{CSS}</style>
      <nav className="sl-nav">
        <div className="sl-nav-left">
          <button className="sl-back" onClick={onBack}>← Back</button>
          <div className="sl-title">My Library</div>
          <span className="sl-count">{stories.length}</span>
        </div>
      </nav>
      <div className="sl-inner">
        {stories.length > 0 && (
          <div style={{marginBottom:16}}>
            <input placeholder="Search stories..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F4EFE8',outline:'none',marginBottom:10,fontFamily:'inherit'}} />
            {heroNames.length > 1 && (
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <div onClick={()=>setFilter('all')} style={{padding:'5px 14px',borderRadius:50,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${filter==='all'?'rgba(232,151,42,.5)':'rgba(255,255,255,.1)'}`,background:filter==='all'?'rgba(232,151,42,.1)':'rgba(255,255,255,.03)',color:filter==='all'?'#F5B84C':'rgba(244,239,232,.45)',transition:'all .15s'}}>All</div>
                {heroNames.map(n=>(
                  <div key={n} onClick={()=>setFilter(filter===n?'all':n)} style={{padding:'5px 14px',borderRadius:50,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${filter===n?'rgba(232,151,42,.5)':'rgba(255,255,255,.1)'}`,background:filter===n?'rgba(232,151,42,.1)':'rgba(255,255,255,.03)',color:filter===n?'#F5B84C':'rgba(244,239,232,.45)',transition:'all .15s'}}>{n}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {stories.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-moon" />
            <div className="sl-empty-h">Your library is empty.</div>
            <div className="sl-empty-sub">Every story you create is saved here automatically — ready to re-read any night.</div>
            <button className="sl-cta-btn" onClick={onCreateStory}>Create tonight's story</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-h" style={{fontSize:16}}>No stories match your search.</div>
          </div>
        ) : (
          <div className="sl-grid">
            {favStories.length > 0 && otherStories.length > 0 && (
              <div className="sl-section-label">Favorites</div>
            )}
            {favStories.map(renderCard)}
            {favStories.length > 0 && otherStories.length > 0 && (
              <div className="sl-section-label" style={{marginTop:8}}>All Stories</div>
            )}
            {otherStories.map(renderCard)}
          </div>
        )}
      </div>

      {/* Custom delete confirmation */}
      {confirmDelete && (
        <div className="sl-confirm-bg" onClick={() => setConfirmDelete(null)}>
          <div className="sl-confirm" onClick={e => e.stopPropagation()}>
            <h3>Remove this story?</h3>
            <p>"{confirmDelete.title}" will be removed from your library. This can't be undone.</p>
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
