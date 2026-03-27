import { useState, useEffect } from 'react';
import { getStories, getNightCards } from '../../lib/storage';
import type { Character, SavedStory, SavedNightCard } from '../../lib/types';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--amber:#E8972A;--amber2:#F5B84C;--cream:#F4EFE8;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.cd{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased}
.cd-inner{max-width:600px;margin:0 auto;padding:28px 24px 80px}
.cd-hero{display:flex;align-items:center;gap:16px;margin-bottom:24px}
.cd-av{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:3px solid rgba(232,151,42,.25);flex-shrink:0;overflow:hidden}
.cd-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.cd-name{font-family:var(--serif);font-size:24px;font-weight:700;color:var(--cream)}
.cd-meta{font-size:11px;color:rgba(244,239,232,.4);font-family:var(--mono);margin-top:3px}
.cd-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.cd-tag{font-size:10px;padding:3px 10px;border-radius:50px;background:rgba(232,151,42,.08);border:1px solid rgba(232,151,42,.18);color:rgba(232,151,42,.7);font-family:var(--sans);font-weight:500}
.cd-detail{font-family:var(--serif);font-size:13px;font-style:italic;color:rgba(244,239,232,.55);line-height:1.65;margin-bottom:20px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px}
.cd-actions{display:flex;gap:8px;margin-bottom:28px}
.cd-edit-btn{padding:9px 20px;border-radius:50px;border:1px solid rgba(232,151,42,.3);background:transparent;color:var(--amber2);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .15s}
.cd-edit-btn:hover{background:rgba(232,151,42,.1)}
.cd-story-btn{padding:9px 20px;border-radius:50px;border:none;background:var(--amber);color:#1A1420;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .15s}
.cd-story-btn:hover{background:var(--amber2);transform:translateY(-1px)}
.cd-section{margin-bottom:28px}
.cd-section-h{font-size:10px;font-family:var(--mono);letter-spacing:1.5px;text-transform:uppercase;color:rgba(232,151,42,.6);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.cd-section-h::before{content:'';width:14px;height:1px;background:rgba(232,151,42,.4)}
.cd-empty{text-align:center;padding:24px 16px;color:rgba(244,239,232,.3);font-size:13px;font-style:italic;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:14px}
.cd-story-list{display:flex;flex-direction:column;gap:8px}
.cd-story-card{display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;cursor:pointer;transition:all .15s}
.cd-story-card:hover{background:rgba(255,255,255,.06);border-color:rgba(232,151,42,.18);transform:translateY(-1px)}
.cd-story-icon{font-size:20px;flex-shrink:0;width:38px;height:38px;background:rgba(255,255,255,.04);border-radius:10px;display:flex;align-items:center;justify-content:center}
.cd-story-info{flex:1;min-width:0}
.cd-story-title{font-family:var(--serif);font-size:14px;font-weight:700;color:var(--cream);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cd-story-date{font-size:10px;color:rgba(244,239,232,.3);font-family:var(--mono)}
.cd-story-fav{font-size:16px;cursor:pointer;flex-shrink:0;transition:transform .15s;padding:4px}
.cd-story-fav:hover{transform:scale(1.2)}
.cd-nc-grid{display:flex;flex-wrap:wrap;gap:10px}
.cd-nc-card{width:calc(50% - 5px);background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:14px;cursor:pointer;transition:all .15s}
.cd-nc-card:hover{background:rgba(255,255,255,.06);border-color:rgba(232,151,42,.18);transform:translateY(-1px)}
.cd-nc-emoji{font-size:22px;margin-bottom:6px}
.cd-nc-headline{font-family:var(--serif);font-size:12px;font-weight:700;font-style:italic;color:var(--cream);margin-bottom:3px;line-height:1.3}
.cd-nc-quote{font-size:10px;color:rgba(244,239,232,.4);font-style:italic;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.cd-nc-date{font-size:9px;color:rgba(244,239,232,.25);font-family:var(--mono);margin-top:6px}
`;

interface Props {
  character: Character;
  userId: string;
  onBack: () => void;
  onEdit: (c: Character) => void;
  onUseInStory: (c: Character) => void;
  onReadStory: (bookData: any) => void;
}

export default function CharacterDetail({ character, userId, onBack, onEdit, onUseInStory, onReadStory }: Props) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [nightCards, setNightCards] = useState<SavedNightCard[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      const allStories = await getStories(userId);
      const allCards = await getNightCards(userId);
      // Filter to stories that include this character
      const charStories = allStories.filter(s =>
        s.characterIds?.includes(character.id) ||
        character.storyIds?.includes(s.id) ||
        s.heroName === character.name
      );
      const charCards = allCards.filter(nc =>
        nc.characterIds?.includes(character.id) ||
        nc.heroName === character.name
      );
      setStories(charStories);
      setNightCards(charCards);
      // Load favorites from localStorage
      try {
        const favs = JSON.parse(localStorage.getItem(`ss2_favs_${userId}_${character.id}`) || '[]');
        setFavorites(new Set(favs));
      } catch(_) {}
    };
    loadData();
  }, [userId, character.id, character.name]);

  const toggleFav = (storyId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      localStorage.setItem(`ss2_favs_${userId}_${character.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  const favStories = stories.filter(s => favorites.has(s.id));
  const c = character;

  return (
    <div className="cd">
      <style>{CSS}</style>
      <div className="cd-inner">

        {/* Hero */}
        <div className="cd-hero">
          <div className="cd-av" style={{ background: c.color || '#1E1640' }}>
            {c.photo ? <img src={c.photo} alt={c.name} /> : (c.emoji || '🧒')}
          </div>
          <div>
            <div className="cd-name">{c.name}</div>
            <div className="cd-meta">
              {c.ageDescription && `${c.ageDescription} · `}{c.pronouns}
              {stories.length > 0 && ` · ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
            </div>
            {c.personalityTags?.length > 0 && (
              <div className="cd-tags">
                {c.personalityTags.map(t => <span key={t} className="cd-tag">{t}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Weird detail */}
        {c.weirdDetail && (
          <div className="cd-detail">"{c.weirdDetail}"</div>
        )}

        {/* Actions */}
        <div className="cd-actions">
          <button className="cd-story-btn" onClick={() => onUseInStory(c)}>✨ New story with {c.name}</button>
          <button className="cd-edit-btn" onClick={() => onEdit(c)}>Edit profile</button>
        </div>

        {/* Favorite Stories */}
        {favStories.length > 0 && (
          <div className="cd-section">
            <div className="cd-section-h">⭐ {c.name}'s Favorites</div>
            <div className="cd-story-list">
              {favStories.map(s => (
                <div key={s.id} className="cd-story-card" onClick={() => onReadStory(s.bookData)}>
                  <div className="cd-story-icon">⭐</div>
                  <div className="cd-story-info">
                    <div className="cd-story-title">{s.title}</div>
                    <div className="cd-story-date">{s.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Library */}
        <div className="cd-section">
          <div className="cd-section-h">📚 {c.name}'s Library</div>
          {stories.length === 0 ? (
            <div className="cd-empty">No stories yet — create {c.name}'s first story!</div>
          ) : (
            <div className="cd-story-list">
              {stories.map(s => (
                <div key={s.id} className="cd-story-card" onClick={() => onReadStory(s.bookData)}>
                  <div className="cd-story-icon">{s.occasion ? '🎉' : '🌙'}</div>
                  <div className="cd-story-info">
                    <div className="cd-story-title">{s.title}</div>
                    <div className="cd-story-date">{s.heroName} · {s.date}{s.refrain ? ` · "${s.refrain}"` : ''}</div>
                  </div>
                  <div className="cd-story-fav" onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
                    {favorites.has(s.id) ? '⭐' : '☆'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Night Cards */}
        <div className="cd-section">
          <div className="cd-section-h">🌙 {c.name}'s Night Cards</div>
          {nightCards.length === 0 ? (
            <div className="cd-empty">No Night Cards yet — they're created after each story.</div>
          ) : (
            <div className="cd-nc-grid">
              {nightCards.map(nc => (
                <div key={nc.id} className="cd-nc-card">
                  <div className="cd-nc-emoji">{nc.emoji || '🌙'}</div>
                  <div className="cd-nc-headline">{nc.headline}</div>
                  <div className="cd-nc-quote">"{nc.quote}"</div>
                  <div className="cd-nc-date">{nc.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
