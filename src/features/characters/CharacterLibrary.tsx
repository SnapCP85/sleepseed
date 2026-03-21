import { useState, useEffect } from 'react';
import { getCharacters, deleteCharacter, getStories } from '../../lib/storage';
import type { Character, SavedStory } from '../../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--ink:#1A1420;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
.cl{min-height:100vh;background:var(--night);font-family:var(--sans);color:#F4EFE8;-webkit-font-smoothing:antialiased}
.cl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:64px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(13,16,24,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.cl-nav-left{display:flex;align-items:center;gap:14px}
.cl-back{background:transparent;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s}
.cl-back:hover{color:rgba(244,239,232,.75)}
.cl-title{font-family:var(--serif);font-size:18px;font-weight:700;color:#F4EFE8}
.cl-new-btn{background:var(--amber);color:var(--ink);border:none;border-radius:50px;padding:9px 22px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
.cl-new-btn:hover{background:var(--amber2);transform:translateY(-1px)}
.cl-inner{max-width:660px;margin:0 auto;padding:24px 24px}
.cl-empty{text-align:center;padding:72px 24px}
.cl-empty-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 20px;opacity:.4}
.cl-empty-h{font-family:var(--serif);font-size:22px;font-weight:700;color:#F4EFE8;margin-bottom:10px;font-style:italic}
.cl-empty-sub{font-size:14px;color:rgba(244,239,232,.38);line-height:1.72;max-width:340px;margin:0 auto 28px;font-weight:300}

/* section headers */
.cl-section{margin-bottom:20px}
.cl-section-banner{font-size:8px;letter-spacing:.08em;font-weight:700;text-transform:uppercase;font-family:var(--mono);padding:5px 0 8px;border-bottom:.5px solid rgba(255,255,255,.06);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.cl-family-banner{color:rgba(232,151,42,.55)}
.cl-chars-banner{color:rgba(255,255,255,.2)}

.cl-grid{display:flex;flex-direction:column;gap:12px}
.cl-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;cursor:pointer;transition:all .22s}
.cl-card:hover{background:rgba(255,255,255,.05);border-color:rgba(232,151,42,.22);transform:translateY(-2px);box-shadow:0 8px 28px rgba(232,151,42,.07)}
.cl-card-main{display:flex;align-items:center;gap:16px;padding:18px 20px}
.cl-av{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:2px solid rgba(232,151,42,.15)}
.cl-card-info{flex:1;min-width:0}
.cl-card-name{font-family:var(--serif);font-size:17px;font-weight:700;color:#F4EFE8;margin-bottom:3px}
.cl-card-meta{font-size:11px;color:rgba(244,239,232,.35);font-family:var(--mono)}
.cl-card-actions{display:flex;gap:6px;flex-shrink:0}
.cl-btn{border-radius:9px;padding:6px 13px;font-size:11.5px;cursor:pointer;font-family:var(--sans);font-weight:500;transition:all .2s;border:none}
.cl-edit{background:rgba(232,151,42,.08);border:1px solid rgba(232,151,42,.18);color:rgba(232,151,42,.8)}
.cl-edit:hover{background:rgba(232,151,42,.15);color:var(--amber2)}
.cl-nc-btn{background:rgba(160,120,255,.08);border:1px solid rgba(160,120,255,.2);color:rgba(160,120,255,.75)}
.cl-nc-btn:hover{background:rgba(160,120,255,.15);color:rgba(190,160,255,.95)}
.cl-del-btn{background:rgba(200,80,80,.05);border:1px solid rgba(200,80,80,.14);color:rgba(255,160,160,.6)}
.cl-del-btn:hover{background:rgba(200,80,80,.1)}
.cl-tags-row{display:flex;flex-wrap:wrap;gap:6px;padding:0 20px 14px}
.cl-tag{background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.16);border-radius:50px;padding:3px 11px;font-size:10px;color:rgba(232,151,42,.75);font-weight:500;font-family:var(--mono)}
.cl-weird{padding:12px 20px;border-top:1px solid rgba(255,255,255,.05);font-family:var(--serif);font-size:12px;font-style:italic;color:rgba(244,239,232,.38);line-height:1.65}
.cl-stories-row{border-top:1px solid rgba(255,255,255,.05);padding:12px 20px;background:rgba(255,255,255,.015)}
.cl-stories-lbl{font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(244,239,232,.22);font-family:var(--mono);margin-bottom:8px;font-weight:600}
.cl-story-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:50px;padding:4px 12px;font-size:11px;color:rgba(244,239,232,.5);margin-right:6px;margin-bottom:4px;transition:all .2s;font-family:var(--sans);cursor:pointer}
.cl-story-chip:hover{background:rgba(232,151,42,.1);border-color:rgba(232,151,42,.28);color:var(--amber2)}
`;

const TYPE_LABELS: Record<string, string> = {
  human: 'Child', animal: 'Animal', stuffy: 'Stuffy',
  creature: 'Creature', parent: 'Parent', other: 'Other',
};

interface Props {
  onNew: () => void;
  onEdit: (c: Character) => void;
  onBack: () => void;
  onUseInStory: (c: Character) => void;
  onReadStory: (bookData: any) => void;
  onViewNightCards: (characterId: string) => void;
  userId: string;
}

export default function CharacterLibrary({ onNew, onEdit, onBack, onUseInStory, onReadStory, onViewNightCards, userId }: Props) {
  const [chars, setChars] = useState<Character[]>([]);
  const [stories, setStories] = useState<SavedStory[]>([]);

  useEffect(() => {
    getCharacters(userId).then(setChars);
    getStories(userId).then(setStories);
  }, [userId]);

  const handleDelete = async (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    if (!confirm('Remove this character?')) return;
    await deleteCharacter(userId, charId);
    getCharacters(userId).then(setChars);
  };

  const getCharStories = (c: Character) =>
    stories.filter(s => c.storyIds.includes(s.id) || s.characterIds?.includes(c.id));

  const familyChars = chars.filter(c => c.isFamily === true);
  const otherChars  = chars.filter(c => c.isFamily !== true);

  const renderCard = (c: Character) => {
    const charStories = getCharStories(c);
    return (
      <div key={c.id} className="cl-card" onClick={() => onUseInStory(c)}>
        <div className="cl-card-main">
          <div className="cl-av" style={{ background: c.color }}>
            {c.photo
              ? <img src={c.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : c.emoji}
          </div>
          <div className="cl-card-info">
            <div className="cl-card-name">{c.name}</div>
            <div className="cl-card-meta">
              {TYPE_LABELS[c.type] || 'Other'}
              {c.ageDescription ? ` · ${c.ageDescription}` : ''}
              {' · '}{c.pronouns}
              {charStories.length > 0 && ` · ${charStories.length} ${charStories.length === 1 ? 'story' : 'stories'}`}
            </div>
          </div>
          <div className="cl-card-actions">
            <button className="cl-btn cl-edit" onClick={e => { e.stopPropagation(); onEdit(c); }}>Edit</button>
            <button className="cl-btn cl-nc-btn" onClick={e => { e.stopPropagation(); onViewNightCards(c.id); }}>🌙</button>
            <button className="cl-btn cl-del-btn" onClick={e => handleDelete(e, c.id)}>✕</button>
          </div>
        </div>
        {c.personalityTags.length > 0 && (
          <div className="cl-tags-row">{c.personalityTags.map(t => <span key={t} className="cl-tag">{t}</span>)}</div>
        )}
        {c.weirdDetail && <div className="cl-weird">"{c.weirdDetail}"</div>}
        {charStories.length > 0 && (
          <div className="cl-stories-row">
            <div className="cl-stories-lbl">Appears in</div>
            {charStories.map(s => (
              <span key={s.id} className="cl-story-chip"
                onClick={e => { e.stopPropagation(); onReadStory(s.bookData); }}>
                🌙 {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cl">
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
            <div className="cl-empty-moon" />
            <div className="cl-empty-h">No characters yet.</div>
            <div className="cl-empty-sub">Characters make story creation faster and let the same person appear across many stories.</div>
            <button className="cl-new-btn" onClick={onNew} style={{ padding: '13px 32px', fontSize: 14 }}>Create your first character</button>
          </div>
        ) : (
          <>
            {/* Family section */}
            {familyChars.length > 0 && (
              <div className="cl-section">
                <div className="cl-section-banner cl-family-banner">
                  ✦ my children · story heroes · appear in the ritual
                </div>
                <div className="cl-grid">{familyChars.map(renderCard)}</div>
              </div>
            )}

            {/* Characters section */}
            {otherChars.length > 0 && (
              <div className="cl-section">
                <div className="cl-section-banner cl-chars-banner">
                  characters · appear in stories, not the ritual
                </div>
                <div className="cl-grid">{otherChars.map(renderCard)}</div>
              </div>
            )}

            <button className="cl-new-btn" onClick={onNew}
              style={{ width: '100%', borderRadius: 14, padding: 14, fontSize: 14, marginTop: 8 }}>
              + Add another character
            </button>
          </>
        )}
      </div>
    </div>
  );
}
