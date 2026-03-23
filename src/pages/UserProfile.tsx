import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { getCharacters, getStories, getNightCards } from '../lib/storage';
import type { Character, SavedStory, SavedNightCard } from '../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.up{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:68px}
.up-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(232,151,42,.08);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.up-nav-title{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--cream)}
.up-nav-r{display:flex;align-items:center;gap:10px}
.up-nav-user{font-size:11px;color:rgba(244,239,232,.25);font-family:var(--mono)}
.up-nav-out{background:transparent;border:1px solid rgba(255,255,255,.07);color:rgba(244,239,232,.32);font-size:11px;cursor:pointer;font-family:var(--sans);padding:5px 13px;border-radius:7px;transition:all .2s}
.up-nav-out:hover{border-color:rgba(255,255,255,.18);color:rgba(244,239,232,.65)}
.up-inner{max-width:860px;margin:0 auto;padding:24px 6% 24px;position:relative;z-index:5}
.up-section{margin-bottom:28px}
.up-sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.04)}
.up-sec-title{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:9px}
.up-sec-count{font-size:10px;color:rgba(244,239,232,.22);font-family:var(--mono);background:rgba(255,255,255,.04);padding:2px 9px;border-radius:50px;border:1px solid rgba(255,255,255,.05)}
.up-sec-link{font-size:12px;color:rgba(232,151,42,.65);cursor:pointer;font-weight:500;background:none;border:none;font-family:var(--sans);transition:color .15s}
.up-sec-link:hover{color:var(--amber)}
.up-empty{font-size:12.5px;color:rgba(244,239,232,.25);font-weight:300;line-height:1.65;font-style:italic;padding:4px 0}
.up-add-btn{background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.16);color:rgba(232,151,42,.72);border-radius:9px;padding:8px 15px;font-size:12px;cursor:pointer;font-family:var(--sans);font-weight:500;transition:all .2s;margin-top:8px}
.up-add-btn:hover{background:rgba(232,151,42,.13);color:var(--amber2)}
.up-char-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;-ms-overflow-style:none;scrollbar-width:none}
.up-char-strip::-webkit-scrollbar{display:none}
.up-char-chip{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:transform .15s;width:66px}
.up-char-chip:hover{transform:translateY(-2px)}
.up-char-av{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid rgba(232,151,42,.12)}
.up-char-nm{font-size:10px;color:rgba(244,239,232,.48);text-align:center;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%}
.up-char-add .up-char-av{background:rgba(232,151,42,.05);border:1.5px dashed rgba(232,151,42,.2)}
.up-char-add .up-char-nm{color:rgba(232,151,42,.45)}
.up-story-item{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:opacity .15s}
.up-story-item:last-child{border-bottom:none}
.up-story-item:hover{opacity:.72}
.up-story-ico{font-size:17px;width:34px;height:34px;background:rgba(255,255,255,.04);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.up-story-info{flex:1;min-width:0}
.up-story-title{font-size:13px;font-weight:500;color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--serif)}
.up-story-meta{font-size:10px;color:rgba(244,239,232,.28);margin-top:2px;font-family:var(--mono)}
.up-story-arrow{font-size:11px;color:rgba(244,239,232,.18);flex-shrink:0}
.up-nc-strip{display:flex;gap:10px;overflow-x:auto;padding:4px 0 8px;-ms-overflow-style:none;scrollbar-width:none}
.up-nc-strip::-webkit-scrollbar{display:none}
.up-nc-pol{flex-shrink:0;background:#F4EFE2;border-radius:3px;padding:8px 8px 22px;cursor:pointer;transition:transform .2s;box-shadow:0 4px 16px rgba(0,0,0,.5)}
.up-nc-pol:hover{transform:translateY(-3px) rotate(0deg) !important}
.up-nc-img{width:88px;aspect-ratio:1;border-radius:2px;overflow:hidden}
.up-nc-img-bg{width:100%;height:100%;background:linear-gradient(145deg,#1A1C2A,#1C1430);display:flex;align-items:center;justify-content:center;font-size:22px}
.up-nc-caption{font-family:Georgia,serif;font-size:8.5px;color:#3A2600;text-align:center;font-style:italic;line-height:1.4;margin-top:7px}
.up-account{background:rgba(255,255,255,.017);border:1px solid rgba(255,255,255,.04);border-radius:14px;padding:16px 20px}
.up-account-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:.5px solid rgba(255,255,255,.04)}
.up-account-row:last-child{border-bottom:none}
.up-account-label{font-size:12px;color:rgba(244,239,232,.35);font-weight:300}
.up-account-value{font-size:12px;color:rgba(244,239,232,.65);font-family:var(--mono)}
.up-bnav{position:fixed;bottom:0;left:0;right:0;height:62px;background:rgba(5,7,16,.98);border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-around;padding:0 8%;z-index:20;backdrop-filter:blur(20px)}
.up-bni{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:58px;padding:3px 0;transition:opacity .15s}
.up-bni:hover{opacity:.75}
.up-bni-ico{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px}
.up-bni-on .up-bni-ico{background:rgba(20,26,50,.9);box-shadow:0 0 10px rgba(232,151,42,.16)}
.up-bni-lbl{font-size:7.5px;font-weight:500;font-family:var(--mono)}
.up-bni-on .up-bni-lbl{color:var(--amber)}
.up-bni:not(.up-bni-on) .up-bni-lbl{color:rgba(255,255,255,.16)}
`;

const ROTS = [-2.1, 1.4, -0.8, 2.2, -1.6, 0.9, -2.8, 1.1];

export default function UserProfile() {
  const { user, logout, setView, setEditingCharacter } = useApp();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories,    setStories]    = useState<SavedStory[]>([]);
  const [nightCards, setNightCards] = useState<SavedNightCard[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCharacters(user.id),
      getStories(user.id),
      getNightCards(user.id),
    ]).then(([chars, strs, ncs]) => {
      setCharacters(chars);
      setStories(strs.slice(0, 5));
      setNightCards(ncs.slice(0, 8));
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="up">
      <style>{CSS}</style>
      <nav className="up-nav">
        <div className="up-nav-title">My Profile</div>
        <div className="up-nav-r">
          <span className="up-nav-user">{user.displayName}</span>
          <button className="up-nav-out" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="up-inner">

        {/* Characters */}
        <div className="up-section">
          <div className="up-sec-head">
            <div className="up-sec-title">
              Characters
              <span className="up-sec-count">{characters.length}</span>
            </div>
            <button className="up-sec-link" onClick={() => setView('characters')}>Manage all</button>
          </div>
          {characters.length === 0 ? (
            <>
              <div className="up-empty">Save your child's details once — used in every story automatically.</div>
              <button className="up-add-btn" onClick={() => { setEditingCharacter(null); setView('onboarding'); }}>
                + Create first character
              </button>
            </>
          ) : (
            <div className="up-char-strip">
              {characters.map(c => (
                <div key={c.id} className="up-char-chip" onClick={() => { setEditingCharacter(c); setView('character-builder'); }}>
                  <div className="up-char-av" style={{ background: c.color }}>
                    {c.photo
                      ? <img src={c.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      : c.emoji}
                  </div>
                  <div className="up-char-nm">{c.name}</div>
                </div>
              ))}
              <div className="up-char-chip up-char-add" onClick={() => { setEditingCharacter(null); setView('onboarding'); }}>
                <div className="up-char-av"><span style={{ fontSize: 18 }}>+</span></div>
                <div className="up-char-nm">Add</div>
              </div>
            </div>
          )}
        </div>

        {/* Story Library */}
        <div className="up-section">
          <div className="up-sec-head">
            <div className="up-sec-title">
              Story Library
              <span className="up-sec-count">{stories.length}</span>
            </div>
            <button className="up-sec-link" onClick={() => setView('story-library')}>See all</button>
          </div>
          {stories.length === 0 ? (
            <div className="up-empty">Your stories will appear here after you create the first one tonight.</div>
          ) : (
            stories.map(s => (
              <div key={s.id} className="up-story-item" onClick={() => setView('story-library')}>
                <div className="up-story-ico">{s.occasion ? '🎉' : '🌙'}</div>
                <div className="up-story-info">
                  <div className="up-story-title">{s.title}</div>
                  <div className="up-story-meta">{s.heroName} · {s.date?.split('T')[0]}</div>
                </div>
                <div className="up-story-arrow">›</div>
              </div>
            ))
          )}
        </div>

        {/* Night Cards */}
        <div className="up-section">
          <div className="up-sec-head">
            <div className="up-sec-title">
              Night Cards
              <span className="up-sec-count">{nightCards.length}</span>
            </div>
            <button className="up-sec-link" onClick={() => setView('nightcard-library')}>See all</button>
          </div>
          {nightCards.length === 0 ? (
            <div className="up-empty">Night Cards are saved at the end of each story — your child's words, captured forever.</div>
          ) : (
            <div className="up-nc-strip">
              {nightCards.map((nc, i) => (
                <div key={nc.id} className="up-nc-pol"
                  style={{ transform: `rotate(${ROTS[i % ROTS.length]}deg)` }}
                  onClick={() => setView('nightcard-library')}>
                  <div className="up-nc-img">
                    {nc.photo
                      ? <img src={nc.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                      : <div className="up-nc-img-bg">{nc.emoji || '🌙'}</div>
                    }
                  </div>
                  <div className="up-nc-caption">{nc.heroName}<br />{nc.date?.split('T')[0]}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="up-section">
          <div className="up-sec-head">
            <div className="up-sec-title">Account</div>
          </div>
          <div className="up-account">
            <div className="up-account-row">
              <div className="up-account-label">Display name</div>
              <div className="up-account-value">{user.displayName}</div>
            </div>
            <div className="up-account-row">
              <div className="up-account-label">Email</div>
              <div className="up-account-value">{user.email || '—'}</div>
            </div>
            <div className="up-account-row">
              <div className="up-account-label">Member since</div>
              <div className="up-account-value">{user.createdAt?.split('T')[0] || '—'}</div>
            </div>
          </div>
        </div>

      </div>

      {/* bottom nav */}
      <div style={{display:'flex',background:'rgba(8,12,24,.97)',borderTop:'1px solid rgba(232,151,42,.07)',padding:'8px 0 6px',position:'fixed',bottom:0,left:0,right:0,zIndex:20,backdropFilter:'blur(16px)'}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',padding:'2px 0'}} onClick={()=>setView('dashboard')}>
          <div style={{fontSize:20,opacity:.5}}>🏠</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.4)'}}>Home</div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',padding:'2px 0'}} onClick={()=>setView('story-library')}>
          <div style={{fontSize:20,opacity:.5}}>📖</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.4)'}}>Stories</div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',marginTop:-18}} onClick={()=>setView('story-configure' as any)}>
          <div style={{width:50,height:50,borderRadius:'50%',background:'linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 16px rgba(200,130,20,.4),0 0 0 3px rgba(8,12,24,.97)'}}>✨</div>
          <div style={{fontSize:9,fontWeight:700,color:'#F5B84C',marginTop:1}}>Create</div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',padding:'2px 0'}} onClick={()=>setView('hatchery')}>
          <div style={{fontSize:20,opacity:.5}}>🥚</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.4)'}}>Hatchery</div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',padding:'2px 0'}} onClick={()=>setView('nightcard-library')}>
          <div style={{fontSize:20,opacity:.5}}>🌙</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.4)'}}>Night Cards</div>
        </div>
      </div>
    </div>
  );
}
