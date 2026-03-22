import { useState, useEffect } from 'react';
import { getStories, deleteStory } from '../../lib/storage';
import type { SavedStory } from '../../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--cream:#FEF9F2;--parch:#F8F1E4;--ink:#1A1420;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
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
.sl-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s}
.sl-card:hover{background:rgba(255,255,255,.05);border-color:rgba(232,151,42,.2);transform:translateY(-2px);box-shadow:0 8px 28px rgba(232,151,42,.06)}
.sl-card-header{display:flex;align-items:center;gap:14px;padding:16px 20px}
.sl-card-icon{font-size:22px;flex-shrink:0;width:44px;height:44px;background:rgba(255,255,255,.04);border-radius:12px;display:flex;align-items:center;justify-content:center}
.sl-card-info{flex:1;min-width:0}
.sl-card-title{font-family:var(--serif);font-size:15px;font-weight:700;color:#F4EFE8;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sl-card-meta{font-size:10px;color:rgba(244,239,232,.32);font-family:var(--mono)}
.sl-card-actions{display:flex;gap:7px;flex-shrink:0}
.sl-read-btn{background:rgba(232,151,42,.08);border:1px solid rgba(232,151,42,.18);color:rgba(232,151,42,.75);padding:7px 15px;border-radius:9px;font-size:12px;cursor:pointer;font-family:var(--sans);font-weight:500;transition:all .2s}
.sl-read-btn:hover{background:rgba(232,151,42,.15);color:var(--amber2)}
.sl-del-btn{background:rgba(200,80,80,.05);border:1px solid rgba(200,80,80,.14);color:rgba(255,160,160,.6);padding:7px 11px;border-radius:9px;font-size:12px;cursor:pointer;font-family:var(--sans);transition:all .2s}
.sl-del-btn:hover{background:rgba(200,80,80,.1)}
.sl-refrain{padding:11px 20px;border-top:1px solid rgba(255,255,255,.05);font-family:var(--serif);font-size:11.5px;font-style:italic;color:rgba(244,239,232,.35);line-height:1.65;background:rgba(255,255,255,.01)}
`;

interface Props { userId: string; onBack: () => void; onReadStory: (bookData: any) => void; onCreateStory: () => void; }

export default function StoryLibrary({ userId, onBack, onReadStory, onCreateStory }: Props) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  useEffect(() => { getStories(userId).then(setStories); }, [userId]);

  const heroNames = [...new Set(stories.map(s => s.heroName).filter(Boolean))];
  const filtered = stories.filter(s => {
    const matchFilter = filter === 'all' || s.heroName === filter;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.heroName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Remove this story?')) return;
    await deleteStory(userId, id);
    getStories(userId).then(setStories);
  };
  return (
    <div className="sl">
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
            <input placeholder="Search stories…" value={search} onChange={e=>setSearch(e.target.value)}
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
            <button className="sl-cta-btn" onClick={onCreateStory}>Create tonight's story ✨</button>
          </div>
        ) : (
          <div className="sl-grid">
            {filtered.map(s => (
              <div key={s.id} className="sl-card" onClick={() => onReadStory(s.bookData)}>
                <div className="sl-card-header">
                  <div className="sl-card-icon">{s.occasion ? '🎉' : '🌙'}</div>
                  <div className="sl-card-info">
                    <div className="sl-card-title">{s.title}</div>
                    <div className="sl-card-meta">{s.heroName} · {s.date}</div>
                  </div>
                  <div className="sl-card-actions">
                    <button className="sl-read-btn" onClick={e => { e.stopPropagation(); onReadStory(s.bookData); }}>Re-read</button>
                    <button className="sl-del-btn" onClick={e => handleDelete(e, s.id)}>✕</button>
                  </div>
                </div>
                {s.refrain && <div className="sl-refrain">"{s.refrain}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
