import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards, getCharacters } from '../lib/storage';
import type { SavedStory, SavedNightCard, Character } from '../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--cream:#FEF9F2;--parch:#F8F1E4;--ink:#1A1420;--ink2:#4A4058;--ink3:#8A7898;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
.dash{min-height:100vh;background:var(--night);font-family:var(--sans);color:#F4EFE8;-webkit-font-smoothing:antialiased}

/* STARS */
.dash-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.dash-star{position:absolute;border-radius:50%;background:#FFF8E8;animation:twk var(--d,4s) var(--dl,0s) ease-in-out infinite}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.4}}

/* NAV */
.dash-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:64px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(13,16,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}
.dash-logo{font-family:var(--serif);font-size:19px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:9px;cursor:pointer}
.dash-logo-moon{width:21px;height:21px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.dash-nav-links{display:flex;gap:4px}
.dash-nl{background:transparent;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:var(--sans);font-weight:400;padding:8px 14px;border-radius:8px;transition:all .15s}
.dash-nl:hover{color:rgba(244,239,232,.8);background:rgba(255,255,255,.05)}
.dash-nl.active{color:var(--amber2);background:rgba(232,151,42,.08)}
.dash-nav-right{display:flex;align-items:center;gap:12px}
.dash-user{font-size:12px;color:rgba(244,239,232,.35);font-family:var(--mono)}
.dash-logout{background:transparent;border:1px solid rgba(255,255,255,.09);color:rgba(244,239,232,.4);font-size:12px;cursor:pointer;font-family:var(--sans);padding:7px 16px;border-radius:8px;transition:all .2s}
.dash-logout:hover{border-color:rgba(255,255,255,.2);color:rgba(244,239,232,.7)}

/* GUEST BANNER */
.guest-banner{background:rgba(232,151,42,.06);border:1px solid rgba(232,151,42,.18);border-radius:14px;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:0}
.guest-banner-text{font-size:13px;color:rgba(244,239,232,.6);font-weight:300;line-height:1.55}
.guest-banner-text strong{color:rgba(232,151,42,.88);font-weight:600}
.guest-banner-btn{background:rgba(232,151,42,.15);border:1px solid rgba(232,151,42,.3);color:var(--amber2);border-radius:50px;padding:9px 22px;font-size:13px;font-weight:500;cursor:pointer;font-family:var(--sans);white-space:nowrap;transition:all .2s;flex-shrink:0}
.guest-banner-btn:hover{background:rgba(232,151,42,.22)}

/* HERO */
.dash-hero{padding:52px 6% 44px;position:relative;z-index:1;max-width:1100px;margin:0 auto;width:100%}
.dash-greeting{font-family:var(--serif);font-size:clamp(32px,4.5vw,48px);font-weight:700;color:#F4EFE8;margin-bottom:6px;letter-spacing:-.03em;line-height:1.12}
.dash-greeting em{font-style:italic;color:var(--amber2)}
.dash-day{font-size:14px;color:rgba(244,239,232,.38);font-weight:300;margin-bottom:36px;font-family:var(--mono)}

/* CREATE CTA */
.dash-cta{background:rgba(232,151,42,.06);border:1px solid rgba(232,151,42,.2);border-radius:22px;padding:30px 36px;display:flex;align-items:center;justify-content:space-between;gap:24px;cursor:pointer;transition:all .22s;position:relative;overflow:hidden}
.dash-cta::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.35),transparent)}
.dash-cta:hover{background:rgba(232,151,42,.1);transform:translateY(-2px);box-shadow:0 12px 36px rgba(232,151,42,.1)}
.dash-cta-label{font-size:10px;font-family:var(--mono);letter-spacing:2px;text-transform:uppercase;color:rgba(232,151,42,.55);margin-bottom:8px}
.dash-cta-h{font-family:var(--serif);font-size:24px;font-weight:700;color:#F4EFE8;margin-bottom:5px;letter-spacing:-.02em}
.dash-cta-sub{font-size:13px;color:rgba(244,239,232,.42);font-weight:300}
.dash-cta-btn{background:var(--amber);color:var(--ink);border:none;border-radius:50px;padding:14px 30px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);white-space:nowrap;flex-shrink:0;transition:all .2s}
.dash-cta-btn:hover{background:var(--amber2)}

/* GRID */
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:1100px;margin:0 auto;padding:0 6% 80px;position:relative;z-index:1}
.dash-sec{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:20px;overflow:hidden;transition:border-color .2s}
.dash-sec:hover{border-color:rgba(255,255,255,.1)}
.dash-sec.wide{grid-column:1 / -1}
.dash-sec-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.05)}
.dash-sec-title{font-family:var(--serif);font-size:15px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:9px}
.dash-sec-count{font-size:10px;color:rgba(244,239,232,.25);font-family:var(--mono);background:rgba(255,255,255,.04);padding:3px 9px;border-radius:50px;border:1px solid rgba(255,255,255,.06)}
.dash-sec-link{font-size:12px;color:rgba(232,151,42,.65);cursor:pointer;font-weight:500;transition:color .15s;background:none;border:none;font-family:var(--sans)}
.dash-sec-link:hover{color:var(--amber)}
.dash-sec-body{padding:16px 22px}
.dash-empty{font-size:12.5px;color:rgba(244,239,232,.25);font-weight:300;padding:10px 0;line-height:1.65;font-style:italic}
.dash-add-btn{background:rgba(232,151,42,.08);border:1px solid rgba(232,151,42,.18);color:rgba(232,151,42,.75);border-radius:10px;padding:9px 16px;font-size:12px;cursor:pointer;font-family:var(--sans);font-weight:500;transition:all .2s;margin-top:8px}
.dash-add-btn:hover{background:rgba(232,151,42,.14);color:var(--amber2)}

/* Characters strip */
.char-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;-ms-overflow-style:none;scrollbar-width:none}
.char-strip::-webkit-scrollbar{display:none}
.char-chip{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:transform .15s;width:68px}
.char-chip:hover{transform:translateY(-2px)}
.char-av{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid rgba(232,151,42,.15)}
.char-nm{font-size:10px;color:rgba(244,239,232,.5);text-align:center;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%}
.char-chip-add .char-av{background:rgba(232,151,42,.06);border:1.5px dashed rgba(232,151,42,.25)}
.char-chip-add .char-nm{color:rgba(232,151,42,.5)}

/* Stories list */
.story-item{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:opacity .15s}
.story-item:last-child{border-bottom:none}
.story-item:hover{opacity:.75}
.story-ico{font-size:18px;width:34px;height:34px;background:rgba(255,255,255,.04);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.story-info{flex:1;min-width:0}
.story-title{font-size:13px;font-weight:500;color:#F4EFE8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--serif)}
.story-meta{font-size:10px;color:rgba(244,239,232,.3);margin-top:2px;font-family:var(--mono)}
.story-arrow{font-size:11px;color:rgba(244,239,232,.2);flex-shrink:0}

/* Night cards polaroid strip */
.nc-strip{display:flex;gap:10px;overflow-x:auto;padding:4px 0 8px;-ms-overflow-style:none;scrollbar-width:none}
.nc-strip::-webkit-scrollbar{display:none}
.nc-pol-mini{flex-shrink:0;background:#F4EFE2;border-radius:3px;padding:8px 8px 22px;cursor:pointer;transition:transform .2s;box-shadow:0 4px 16px rgba(0,0,0,.5)}
.nc-pol-mini:hover{transform:translateY(-3px) rotate(0deg) !important}
.nc-pol-img{width:90px;aspect-ratio:1;border-radius:2px;overflow:hidden;margin-bottom:0}
.nc-pol-img-bg{width:100%;height:100%;background:linear-gradient(145deg,#1A1C2A,#1C1430);display:flex;align-items:center;justify-content:center;font-size:22px;position:relative}
.nc-pol-caption{font-family:Georgia,serif;font-size:8.5px;color:#3A2600;text-align:center;font-style:italic;line-height:1.4;margin-top:7px}

@media(max-width:900px){.dash-grid{grid-template-columns:1fr}.dash-sec.wide{grid-column:1}}
@media(max-width:640px){.dash-nav .dash-nav-links{display:none}.dash-cta{flex-direction:column;align-items:flex-start;gap:16px}.dash-cta-btn{width:100%}}
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
    setNightCards(getNightCards(user.id).slice(0, 8));
    setCharacters(getCharacters(user.id).slice(0, 8));
  }, [user]);

  if (!user) return null;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isGuest = !!user.isGuest;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const ROTS = [-3.2, 1.8, -1.5, 2.8, -2.1, 1.2, -2.8, 0.9];
  const stars = Array.from({ length: 50 }, (_, i) => ({
    l: `${(i * 17.3 + 7) % 100}%`, t: `${(i * 13.7 + 11) % 100}%`,
    s: 0.4 + (i % 3) * 0.5, d: `${3 + (i % 2)}s`, dl: `${(i * 0.4) % 4}s`,
  }));

  return (
    <div className="dash">
      <style>{CSS}</style>

      <div className="dash-stars">
        {stars.map((s, i) => (
          <div key={i} className="dash-star" style={{ left: s.l, top: s.t, width: `${s.s}px`, height: `${s.s}px`, '--d': s.d, '--dl': s.dl } as any} />
        ))}
      </div>

      <nav className="dash-nav">
        <div className="dash-logo" onClick={() => setView('public')}>
          <div className="dash-logo-moon" /> SleepSeed
        </div>
        <div className="dash-nav-links">
          <button className="dash-nl active">Home</button>
          <button className="dash-nl" onClick={onViewCharacters}>Characters</button>
          <button className="dash-nl" onClick={onViewLibrary}>My Library</button>
          <button className="dash-nl" onClick={onViewNightCards}>Night Cards</button>
        </div>
        <div className="dash-nav-right">
          {isGuest
            ? <button className="dash-logout" onClick={onSignUp}>Create account</button>
            : <><span className="dash-user">{user.displayName}</span><button className="dash-logout" onClick={logout}>Sign out</button></>
          }
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 6% 0', position: 'relative', zIndex: 1 }}>
        {isGuest && (
          <div className="guest-banner">
            <div className="guest-banner-text">
              You're in <strong>guest mode.</strong> Stories won't be saved between sessions. Create a free account to keep everything.
            </div>
            <button className="guest-banner-btn" onClick={onSignUp}>Save my stories →</button>
          </div>
        )}
      </div>

      <div className="dash-hero">
        <div className="dash-greeting">
          {greet}{!isGuest ? `, ${user.displayName}` : ''}. <em>Bedtime is close.</em>
        </div>
        <div className="dash-day">{today}</div>
        <div className="dash-cta" onClick={onCreateStory}>
          <div>
            <div className="dash-cta-label">Story builder</div>
            <div className="dash-cta-h">Create tonight's story</div>
            <div className="dash-cta-sub">Personalised for your child — ready in 60 seconds</div>
          </div>
          <button className="dash-cta-btn" onClick={e => { e.stopPropagation(); onCreateStory(); }}>Build a story ✨</button>
        </div>
      </div>

      <div className="dash-grid">
        {/* Characters */}
        <div className="dash-sec">
          <div className="dash-sec-head">
            <div className="dash-sec-title">
              Characters <span className="dash-sec-count">{characters.length}</span>
            </div>
            <button className="dash-sec-link" onClick={onViewCharacters}>See all</button>
          </div>
          <div className="dash-sec-body">
            {characters.length === 0 ? (
              <>
                <div className="dash-empty">Save your child's details once, use them in every story. Characters track which books they appear in.</div>
                <button className="dash-add-btn" onClick={onNewCharacter}>+ Create first character</button>
              </>
            ) : (
              <div className="char-strip">
                {characters.map(c => (
                  <div key={c.id} className="char-chip" onClick={onCreateStory}>
                    <div className="char-av" style={{ background: c.color }}>
                      {c.photo ? <img src={c.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : c.emoji}
                    </div>
                    <div className="char-nm">{c.name}</div>
                  </div>
                ))}
                <div className="char-chip char-chip-add" onClick={onNewCharacter}>
                  <div className="char-av"><span style={{ fontSize: 18 }}>+</span></div>
                  <div className="char-nm">Add</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stories */}
        <div className="dash-sec">
          <div className="dash-sec-head">
            <div className="dash-sec-title">
              My Library <span className="dash-sec-count">{stories.length}</span>
            </div>
            <button className="dash-sec-link" onClick={onViewLibrary}>See all</button>
          </div>
          <div className="dash-sec-body">
            {stories.length === 0
              ? <div className="dash-empty">Your stories will appear here after you create the first one tonight.</div>
              : stories.map(s => (
                <div key={s.id} className="story-item" onClick={onViewLibrary}>
                  <div className="story-ico">{s.occasion ? '🎉' : '🌙'}</div>
                  <div className="story-info">
                    <div className="story-title">{s.title}</div>
                    <div className="story-meta">{s.heroName} · {s.date}</div>
                  </div>
                  <div className="story-arrow">›</div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Night Cards — full width */}
        <div className="dash-sec wide">
          <div className="dash-sec-head">
            <div className="dash-sec-title">
              Night Cards <span className="dash-sec-count">{nightCards.length}</span>
            </div>
            <button className="dash-sec-link" onClick={onViewNightCards}>See all</button>
          </div>
          <div className="dash-sec-body">
            {nightCards.length === 0 ? (
              <div className="dash-empty">Night Cards are created at the end of each story — capturing what your child said, the best three seconds, and a photo of the moment.</div>
            ) : (
              <div className="nc-strip">
                {nightCards.map((nc, i) => (
                  <div key={nc.id} className="nc-pol-mini" onClick={onViewNightCards}
                    style={{ transform: `rotate(${ROTS[i % ROTS.length]}deg)` }}>
                    <div className="nc-pol-img">
                      {nc.photo
                        ? <img src={nc.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                        : <div className="nc-pol-img-bg">{nc.emoji || '🌙'}</div>
                      }
                    </div>
                    <div className="nc-pol-caption">{nc.heroName}<br />{nc.date}</div>
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
