import { useState, useEffect } from 'react';
import { getCharacters, deleteCharacter, getStories } from '../../lib/storage';
import type { Character, SavedStory } from '../../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.cl-wrap{min-height:100vh;background:#0B0B1A;font-family:'DM Sans',sans-serif;color:#F0EDE8}
.cl-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(11,11,26,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px)}
.cl-nav-left{display:flex;align-items:center;gap:12px}
.cl-back{background:transparent;border:none;color:rgba(240,237,232,.4);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px;transition:color .2s}
.cl-back:hover{color:rgba(240,237,232,.75)}
.cl-title{font-family:'Lora',serif;font-size:18px;font-weight:700;color:#F0EDE8}
.cl-new-btn{background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;border:none;border-radius:50px;padding:9px 20px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.cl-new-btn:hover{opacity:.9;transform:translateY(-1px)}
.cl-inner{max-width:600px;margin:0 auto;padding:28px 24px}
.cl-empty{text-align:center;padding:64px 24px}
.cl-empty-icon{font-size:48px;margin-bottom:16px;opacity:.5}
.cl-empty-h{font-family:'Lora',serif;font-size:20px;font-weight:700;color:#F0EDE8;margin-bottom:8px}
.cl-empty-sub{font-size:14px;color:rgba(240,237,232,.42);line-height:1.7;max-width:320px;margin:0 auto 24px;font-weight:300}
.cl-grid{display:flex;flex-direction:column;gap:12px}
.cl-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s}
.cl-card:hover{background:rgba(255,255,255,.05);border-color:rgba(168,85,247,.25);transform:translateY(-2px)}
.cl-card-main{display:flex;align-items:center;gap:16px;padding:18px}
.cl-avatar{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;border:2px solid rgba(168,85,247,.2)}
.cl-card-info{flex:1;min-width:0}
.cl-card-name{font-family:'Lora',serif;font-size:17px;font-weight:700;color:#F0EDE8;margin-bottom:3px}
.cl-card-meta{font-size:12px;color:rgba(240,237,232,.38);font-weight:300}
.cl-card-actions{display:flex;gap:6px;flex-shrink:0}
.cl-edit-btn{background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);color:#C084FC;padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;transition:all .2s}
.cl-edit-btn:hover{background:rgba(168,85,247,.15)}
.cl-del-btn{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);color:rgba(252,165,165,.7);padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.cl-del-btn:hover{background:rgba(239,68,68,.12)}
.cl-tags-row{display:flex;flex-wrap:wrap;gap:5px;padding:0 18px 14px}
.cl-tag{background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.18);border-radius:50px;padding:3px 10px;font-size:10px;color:rgba(192,132,252,.8);font-weight:500}
.cl-stories-row{border-top:1px solid rgba(255,255,255,.05);padding:12px 18px;background:rgba(255,255,255,.015)}
.cl-stories-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,237,232,.25);font-family:'DM Mono',monospace;margin-bottom:8px}
.cl-story-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:50px;padding:4px 12px;font-size:11px;color:rgba(240,237,232,.55);margin-right:6px;margin-bottom:4px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.cl-story-chip:hover{background:rgba(255,255,255,.07);color:rgba(240,237,232,.8)}
.cl-weird-detail{padding:10px 18px;border-top:1px solid rgba(255,255,255,.05);font-family:'Lora',serif;font-size:12px;font-style:italic;color:rgba(240,237,232,.38);line-height:1.6}
`;

interface Props {
  onNew: () => void;
  onEdit: (c: Character) => void;
  onBack: () => void;
  onUseInStory: (c: Character) => void;
  userId: string;
}

export default function CharacterLibrary({ onNew, onEdit, onBack, onUseInStory, userId }: Props) {
  const [chars, setChars] = useState<Character[]>([]);
  const [stories, setStories] = useState<SavedStory[]>([]);

  useEffect(() => {
    setChars(getCharacters(userId));
    setStories(getStories(userId));
  }, [userId]);

  const handleDelete = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    if (!confirm('Remove this character?')) return;
    deleteCharacter(userId, charId);
    setChars(getCharacters(userId));
  };

  const getCharStories = (c: Character) =>
    stories.filter(s => c.storyIds.includes(s.id) || s.characterIds?.includes(c.id));

  const typeLabelMap: Record<string, string> = {
    human: 'Person', animal: 'Animal', stuffy: 'Stuffy', creature: 'Creature', other: 'Other'
  };

  return (
    <div className="cl-wrap">
      <style>{CSS}</style>
      <nav className="cl-nav">
        <div className="cl-nav-left">
          <button className="cl-back" onClick={onBack}>← Back</button>
          <div className="cl-title">My Characters</div>
        </div>
        <button className="cl-new-btn" onClick={onNew}>+ New character</button>
      </nav>

      <div className="cl-inner">
        {chars.length === 0 ? (
          <div className="cl-empty">
            <div className="cl-empty-icon">🧸</div>
            <div className="cl-empty-h">No characters yet</div>
            <div className="cl-empty-sub">
              Characters make story creation faster — and let the same person appear across many stories, building their own library over time.
            </div>
            <button className="cl-new-btn" onClick={onNew} style={{ padding: '12px 28px', fontSize: 14 }}>
              Create your first character
            </button>
          </div>
        ) : (
          <div className="cl-grid">
            {chars.map(c => {
              const charStories = getCharStories(c);
              return (
                <div key={c.id} className="cl-card" onClick={() => onUseInStory(c)}>
                  <div className="cl-card-main">
                    <div className="cl-avatar" style={{ background: c.color }}>
                      {c.photo
                        ? <img src={c.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : <span>{c.emoji}</span>}
                    </div>
                    <div className="cl-card-info">
                      <div className="cl-card-name">{c.name}</div>
                      <div className="cl-card-meta">
                        {typeLabelMap[c.type]}{c.ageDescription ? ` · ${c.ageDescription}` : ''} · {c.pronouns}
                        {charStories.length > 0 && ` · ${charStories.length} ${charStories.length === 1 ? 'story' : 'stories'}`}
                      </div>
                    </div>
                    <div className="cl-card-actions">
                      <button className="cl-edit-btn" onClick={e => { e.stopPropagation(); onEdit(c); }}>Edit</button>
                      <button className="cl-del-btn" onClick={e => handleDelete(e, c.id)}>✕</button>
                    </div>
                  </div>

                  {c.personalityTags.length > 0 && (
                    <div className="cl-tags-row">
                      {c.personalityTags.map(t => <span key={t} className="cl-tag">{t}</span>)}
                    </div>
                  )}

                  {c.weirdDetail && (
                    <div className="cl-weird-detail">"{c.weirdDetail}"</div>
                  )}

                  {charStories.length > 0 && (
                    <div className="cl-stories-row">
                      <div className="cl-stories-label">Appears in</div>
                      {charStories.map(s => (
                        <span key={s.id} className="cl-story-chip" onClick={e => e.stopPropagation()}>
                          🌙 {s.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: 8 }}>
              <button className="cl-new-btn" onClick={onNew} style={{ width: '100%', borderRadius: 14, padding: '14px', fontSize: 14 }}>
                + Add another character
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
