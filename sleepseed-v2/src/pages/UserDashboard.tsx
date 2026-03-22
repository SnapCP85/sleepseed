import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards, getCharacters } from '../lib/storage';
import type { SavedStory, SavedNightCard, Character } from '../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Kalam:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.dash-wrap{min-height:100vh;background:#0B0B1A;font-family:'DM Sans',sans-serif;color:#F0EDE8}
.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;background:white;border-radius:50%;animation:twk 4s ease-in-out infinite}
@keyframes twk{0%,100%{opacity:.06}50%{opacity:.4}}

/* Nav */
.dash-nav{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(11,11,26,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}
.dash-logo{font-family:'Lora',serif;font-size:19px;font-weight:700;color:#F0EDE8;display:flex;align-items:center;gap:8px;cursor:pointer}
.dash-nav-links{display:flex;gap:6px}
.dash-nav-link{background:transparent;border:none;color:rgba(240,237,232,.42);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:400;padding:8px 14px;border-radius:8px;transition:all .15s}
.dash-nav-link:hover{color:rgba(240,237,232,.8);background:rgba(255,255,255,.05)}
.dash-nav-link.active{color:#C084FC;background:rgba(168,85,247,.1)}
.dash-nav-right{display:flex;align-items:center;gap:10px}
.dash-user-badge{font-size:12px;color:rgba(240,237,232,.38);font-weight:300}
.dash-logout{background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(240,237,232,.38);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:7px 14px;border-radius:8px;transition:all .2s}
.dash-logout:hover{border-color:rgba(255,255,255,.2);color:rgba(240,237,232,.65)}

/* Hero */
.dash-hero{padding:48px 32px 40px;position:relative;z-index:1;max-width:860px;margin:0 auto}
.dash-greeting{font-family:'Lora',serif;font-size:36px;font-weight:700;color:#F0EDE8;margin-bottom:6px;letter-spacing:-.4px}
.dash-greeting em{font-style:italic;color:rgba(251,191,36,.85)}
.dash-sub{font-size:15px;color:rgba(240,237,232,.42);font-weight:300;margin-bottom:32px}

/* Create story CTA */
.dash-cta{background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(168,85,247,.1));border:1px solid rgba(168,85,247,.3);border-radius:20px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all .22s;margin-bottom:32px;position:relative;overflow:hidden}
.dash-cta::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.4),transparent)}
.dash-cta:hover{background:linear-gradient(135deg,rgba(124,58,237,.25),rgba(168,85,247,.15));transform:translateY(-2px);box-shadow:0 12px 36px rgba(124,58,237,.2)}
.dash-cta-left{}
.dash-cta-label{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(192,132,252,.6);margin-bottom:8px}
.dash-cta-h{font-family:'Lora',serif;font-size:24px;font-weight:700;color:#F0EDE8;margin-bottom:4px}
.dash-cta-sub{font-size:13px;color:rgba(240,237,232,.42);font-weight:300}
.dash-cta-btn{background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;border:none;border-radius:50px;padding:13px 28px;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;flex-shrink:0}

/* Sections */
.dash-sections{max-width:860px;margin:0 auto;padding:0 32px 80px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
.dash-section{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:20px;overflow:hidden;transition:all .2s}
.dash-section:hover{border-color:rgba(255,255,255,.1)}
.dash-section-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.05)}
.dash-section-title{font-family:'Lora',serif;font-size:15px;font-weight:700;color:#F0EDE8;display:flex;align-items:center;gap:8px}
.dash-section-count{font-size:10px;color:rgba(240,237,232,.25);font-family:'DM Mono',monospace;background:rgba(255,255,255,.04);padding:3px 8px;border-radius:50px}
.dash-section-link{font-size:11px;color:rgba(168,85,247,.7);cursor:pointer;font-weight:500;transition:color .15s}
.dash-section-link:hover{color:#A855F7}
.dash-section-body{padding:14px 20px}
.dash-section-empty{font-size:12px;color:rgba(240,237,232,.25);font-weight:300;padding:12px 0;line-height:1.6;font-style:italic}
.dash-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:opacity .15s}
.dash-item:last-child{border-bottom:none}
.dash-item:hover{opacity:.8}
.dash-item-icon{font-size:18px;flex-shrink:0;width:32px;height:32px;background:rgba(255,255,255,.04);border-radius:8px;display:flex;align-items:center;justify-content:center}
.dash-item-text{flex:1;min-width:0}
.dash-item-title{font-size:13px;font-weight:500;color:#F0EDE8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Lora',serif}
.dash-item-meta{font-size:10px;color:rgba(240,237,232,.3);margin-top:1px}
.dash-item-arrow{font-size:10px;color:rgba(240,237,232,.2);flex-shrink:0}

/* NC mini polaroid */
.dash-nc-thumb{width:36px;height:36px;border-radius:3px;background:#F4EFE2;padding:3px 3px 8px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.dash-nc-img{width:100%;height:100%;border-radius:1px;object-fit:cover}

/* Character cards */
.dash-char-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.dash-char-card{flex-shrink:0;width:72px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:transform .15s}
.dash-char-card:hover{transform:translateY(-2px)}
.dash-char-avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid rgba(168,85,247,.2)}
.dash-char-name{font-size:10px;color:rgba(240,237,232,.55);text-align:center;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%}

/* Guest banner */
.dash-guest-banner{background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:14px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;max-width:860px;margin-left:auto;margin-right:auto;position:relative;z-index:1}
.dash-guest-text{font-size:13px;color:rgba(240,237,232,.65);line-height:1.5;font-weight:300}
.dash-guest-text strong{color:rgba(251,191,36,.9);font-weight:600}
.dash-guest-btn{background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.35);color:rgba(251,191,36,.9);border-radius:50px;padding:9px 20px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:all .2s}
.dash-guest-btn:hover{background:rgba(251,191,36,.22)}
`;

interface Props {
  onCreateStory: () => void;
  onViewLibrary: () => void;
  onViewNightCards: () => void;
  onViewCharacters: () => void;
  onNewCharacter: () => void;
  onSignUp: () => void;
}

export default function UserDashboard({ onCreateStory, onViewLibrary, onViewNightCards, onViewCharacters, onNewCharacter, onSignUp }: Props) {
  const { user, logout, setView } = useApp();
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [nightCards, setNightCards] = useState<SavedNightCard[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (!user) return;
    setStories(getStories(user.id).slice(0, 5));
    setNightCards(getNightCards(user.id).slice(0, 5));
    setCharacters(getCharacters(user.id).slice(0, 8));
  }, [user]);

  if (!user) return null;

  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isGuest = user.isGuest;

  // Generate star positions
  const stars = Array.from({ length: 50 }, (_, i) => ({
    left: `${(i * 17.3 + 7) % 100}%`,
    top: `${(i * 13.7 + 11) % 100}%`,
    size: 0.5 + (i % 3) * 0.5,
    delay: `${(i * 0.4) % 4}s`,
    dur: `${3 + (i % 2)}s`,
  }));

  return (
    <div className="dash-wrap">
      <style>{CSS}</style>

      <div className="dash-stars">
        {stars.map((s, i) => (
          <div key={i} className="dash-star" style={{
            left: s.left, top: s.top,
            width: `${s.size}px`, height: `${s.size}px`,
            animationDelay: s.delay, animationDuration: s.dur,
          }} />
        ))}
      </div>

      {/* Nav */}
      <nav className="dash-nav">
        <div className="dash-logo" onClick={() => setView('public')}>🌙 SleepSeed</div>
        <div className="dash-nav-links">
          <button className="dash-nav-link active">Home</button>
          <button className="dash-nav-link" onClick={onViewCharacters}>Characters</button>
          <button className="dash-nav-link" onClick={onViewLibrary}>My Library</button>
          <button className="dash-nav-link" onClick={onViewNightCards}>Night Cards</button>
        </div>
        <div className="dash-nav-right">
          {isGuest
            ? <button className="dash-guest-btn" style={{ padding: '7px 16px', fontSize: 12 }} onClick={onSignUp}>Create account</button>
            : <><span className="dash-user-badge">{user.displayName}</span><button className="dash-logout" onClick={logout}>Sign out</button></>
          }
        </div>
      </nav>

      {/* Guest banner */}
      {isGuest && (
        <div style={{ padding: '20px 32px 0', position: 'relative', zIndex: 1 }}>
          <div className="dash-guest-banner">
            <div className="dash-guest-text">
              You're in <strong>guest mode</strong>. Stories and Night Cards won't be saved between sessions.
              Create a free account to keep everything.
            </div>
            <button className="dash-guest-btn" onClick={onSignUp}>Save my stories →</button>
          </div>
        </div>
      )}

      {/* Hero + CTA */}
      <div className="dash-hero">
        <div className="dash-greeting">
          {timeGreet}{!isGuest ? `, ${user.displayName}` : ''}.{' '}
          <em>Bedtime is close.</em>
        </div>
        <div className="dash-sub">What's tonight's story?</div>

        <div className="dash-cta" onClick={onCreateStory}>
          <div className="dash-cta-left">
            <div className="dash-cta-label">Story builder</div>
            <div className="dash-cta-h">Create tonight's story</div>
            <div className="dash-cta-sub">Personalised, ready in 60 seconds</div>
          </div>
          <button className="dash-cta-btn" onClick={e => { e.stopPropagation(); onCreateStory(); }}>
            Build a story ✨
          </button>
        </div>
      </div>

      {/* Sections grid */}
      <div className="dash-sections">

        {/* Characters */}
        <div className="dash-section">
          <div className="dash-section-header">
            <div className="dash-section-title">🧸 My Characters
              <span className="dash-section-count">{characters.length}</span>
            </div>
            <span className="dash-section-link" onClick={onViewCharacters}>See all</span>
          </div>
          <div className="dash-section-body">
            {characters.length === 0 ? (
              <>
                <div className="dash-section-empty">
                  Save your child's details once, use them in every story — and track all the books they appear in.
                </div>
                <button onClick={onNewCharacter} style={{
                  background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.2)',
                  color: '#C084FC', borderRadius: 10, padding: '9px 16px', fontSize: 12,
                  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, marginTop: 4,
                }}>+ Create first character</button>
              </>
            ) : (
              <div className="dash-char-row">
                {characters.map(c => (
                  <div key={c.id} className="dash-char-card" onClick={onCreateStory}>
                    <div className="dash-char-avatar" style={{ background: c.color }}>
                      {c.photo
                        ? <img src={c.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : <span>{c.emoji}</span>}
                    </div>
                    <div className="dash-char-name">{c.name}</div>
                  </div>
                ))}
                <div className="dash-char-card" onClick={onNewCharacter}>
                  <div className="dash-char-avatar" style={{ background: 'rgba(168,85,247,.1)', border: '1px dashed rgba(168,85,247,.3)' }}>
                    <span style={{ fontSize: 16 }}>+</span>
                  </div>
                  <div className="dash-char-name" style={{ color: 'rgba(192,132,252,.6)' }}>Add</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stories */}
        <div className="dash-section">
          <div className="dash-section-header">
            <div className="dash-section-title">📚 My Library
              <span className="dash-section-count">{stories.length}</span>
            </div>
            <span className="dash-section-link" onClick={onViewLibrary}>See all</span>
          </div>
          <div className="dash-section-body">
            {stories.length === 0
              ? <div className="dash-section-empty">Your stories will appear here after you create the first one.</div>
              : stories.map(s => (
                <div key={s.id} className="dash-item" onClick={onViewLibrary}>
                  <div className="dash-item-icon">🌙</div>
                  <div className="dash-item-text">
                    <div className="dash-item-title">{s.title}</div>
                    <div className="dash-item-meta">{s.heroName} · {s.date}</div>
                  </div>
                  <div className="dash-item-arrow">›</div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Night Cards */}
        <div className="dash-section" style={{ gridColumn: '1 / -1' }}>
          <div className="dash-section-header">
            <div className="dash-section-title">🌙 Night Cards
              <span className="dash-section-count">{nightCards.length}</span>
            </div>
            <span className="dash-section-link" onClick={onViewNightCards}>See all</span>
          </div>
          <div className="dash-section-body">
            {nightCards.length === 0 ? (
              <div className="dash-section-empty">
                Night Cards are created at the end of each story — capturing what your child said, the best three seconds of the day, and a photo of the moment.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {nightCards.map(nc => (
                  <div key={nc.id} onClick={onViewNightCards} style={{
                    flexShrink: 0, cursor: 'pointer', width: 110,
                    background: '#F4EFE2', borderRadius: 4, padding: '8px 8px 20px',
                    boxShadow: '0 4px 16px rgba(0,0,0,.55)',
                    transform: `rotate(${(Math.random() - 0.5) * 4}deg)`,
                    transition: 'transform .2s',
                  }}>
                    {nc.photo
                      ? <img src={nc.photo} style={{ width: '100%', aspectRatio: '1', borderRadius: 2, objectFit: 'cover', display: 'block', marginBottom: 6 }} alt="" />
                      : <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg,#1A1C2E,#22203A)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 6 }}>{nc.emoji || '🌙'}</div>
                    }
                    <div style={{ fontFamily: "'Kalam',cursive", fontSize: 9, color: '#3A2800', lineHeight: 1.4, textAlign: 'center' }}>
                      {nc.heroName}<br />{nc.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
