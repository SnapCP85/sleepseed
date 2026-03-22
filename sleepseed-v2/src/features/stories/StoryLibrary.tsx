import { useState, useEffect } from 'react';
import { getStories, deleteStory } from '../../lib/storage';
import type { SavedStory } from '../../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.sl-wrap{min-height:100vh;background:#0B0B1A;font-family:'DM Sans',sans-serif;color:#F0EDE8}
.sl-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(11,11,26,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px)}
.sl-nav-left{display:flex;align-items:center;gap:12px}
.sl-back{background:transparent;border:none;color:rgba(240,237,232,.4);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:color .2s}
.sl-back:hover{color:rgba(240,237,232,.75)}
.sl-title{font-family:'Lora',serif;font-size:18px;font-weight:700;color:#F0EDE8}
.sl-count{font-size:11px;color:rgba(240,237,232,.28);font-family:'DM Mono',monospace;background:rgba(255,255,255,.04);padding:3px 10px;border-radius:50px}
.sl-inner{max-width:680px;margin:0 auto;padding:28px 24px}
.sl-empty{text-align:center;padding:80px 24px}
.sl-empty-icon{font-size:52px;margin-bottom:16px;opacity:.4}
.sl-empty-h{font-family:'Lora',serif;font-size:22px;font-weight:700;color:#F0EDE8;margin-bottom:8px}
.sl-empty-sub{font-size:14px;color:rgba(240,237,232,.38);line-height:1.7;max-width:320px;margin:0 auto 28px;font-weight:300}
.sl-grid{display:flex;flex-direction:column;gap:10px}
.sl-card{border-radius:16px;overflow:hidden;border:1px solid rgba(160,120,255,.15);cursor:pointer;transition:all .22s;background:linear-gradient(135deg,rgba(13,21,53,.97),rgba(22,16,48,.9))}
.sl-card:hover{border-color:rgba(168,85,247,.35);transform:translateY(-2px);box-shadow:0 8px 28px rgba(124,58,237,.15)}
.sl-card-header{display:flex;align-items:center;gap:12px;padding:14px 16px}
.sl-card-icon{font-size:22px;flex-shrink:0}
.sl-card-info{flex:1;min-width:0}
.sl-card-title{font-family:'Lora',serif;font-size:14px;font-weight:700;color:#F0EDE8;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sl-card-meta{font-size:10px;color:rgba(240,237,232,.32)}
.sl-card-actions{display:flex;gap:6px;flex-shrink:0}
.sl-read-btn{background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.25);color:#C084FC;padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;transition:all .2s}
.sl-read-btn:hover{background:rgba(168,85,247,.18)}
.sl-del-btn{background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.15);color:rgba(252,165,165,.65);padding:6px 10px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.sl-del-btn:hover{background:rgba(239,68,68,.1)}
.sl-refrain{padding:10px 16px;border-top:1px solid rgba(168,85,247,.08);font-family:'Lora',serif;font-size:11px;font-style:italic;color:rgba(200,180,255,.55);line-height:1.6}
`;

interface Props {
  userId: string;
  onBack: () => void;
  onReadStory: (bookData: any) => void;
  onCreateStory: () => void;
}

export default function StoryLibrary({ userId, onBack, onReadStory, onCreateStory }: Props) {
  const [stories, setStories] = useState<SavedStory[]>([]);

  useEffect(() => { setStories(getStories(userId)); }, [userId]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Remove this story?')) return;
    deleteStory(userId, id);
    setStories(getStories(userId));
  };

  return (
    <div className="sl-wrap">
      <style>{CSS}</style>
      <nav className="sl-nav">
        <div className="sl-nav-left">
          <button className="sl-back" onClick={onBack}>← Back</button>
          <div className="sl-title">My Library</div>
          <span className="sl-count">{stories.length}</span>
        </div>
      </nav>

      <div className="sl-inner">
        {stories.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-icon">📚</div>
            <div className="sl-empty-h">Your library is empty</div>
            <div className="sl-empty-sub">Every story you create is saved here automatically — ready to re-read any night.</div>
            <button onClick={onCreateStory} style={{
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: 'white', border: 'none',
              borderRadius: 50, padding: '13px 32px', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>Create tonight's story ✨</button>
          </div>
        ) : (
          <div className="sl-grid">
            {stories.map(s => (
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
