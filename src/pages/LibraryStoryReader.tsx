import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import {
  getLibraryStoryBySlug, recordStoryRead, voteOnStory, getUserVote,
  addToFavourites, removeFromFavourites, isFavourited, ensureRefCode,
} from '../lib/storage';
import { getSceneByVibe } from '../lib/storyScenes';
import { BASE_URL } from '../lib/config';
import type { LibraryStory } from '../lib/types';

function strHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700&family=DM+Mono:wght@400&family=Patrick+Hand&family=Kalam:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#020408;--amber:#F5B84C;--amber-d:#a06010;--teal:#14d890;--cream:#f5e8c8;--card:rgba(6,10,28,.92);--border:rgba(255,255,255,.07);--serif:'Fraunces',serif;--cta:'Baloo 2',sans-serif;--body:'Nunito',sans-serif;--mono:'DM Mono',monospace;--hand:'Patrick Hand',cursive;--kalam:'Kalam',cursive}
@keyframes lrFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.lr{min-height:100vh;background:var(--night);font-family:var(--body);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center}

/* nav */
.lr-nav{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:56px;border-bottom:1px solid rgba(245,184,76,.08);background:rgba(2,4,8,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}
.lr-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:7px;cursor:pointer}
.lr-logo-moon{width:15px;height:15px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020)}
.lr-back{background:none;border:none;color:rgba(245,232,200,.4);font-size:12px;cursor:pointer;font-family:var(--body);display:flex;align-items:center;gap:5px;font-weight:600;transition:color .15s}
.lr-back:hover{color:var(--cream)}

/* upgrade banner */
.lr-upgrade{width:100%;max-width:540px;background:rgba(20,216,144,.05);border:1px solid rgba(20,216,144,.15);border-radius:12px;padding:10px 16px;margin:12px 16px 0;display:flex;align-items:center;justify-content:space-between;gap:10px}
.lr-upgrade-text{font-size:11px;color:rgba(20,216,144,.7);line-height:1.5}
.lr-upgrade-x{background:none;border:none;color:rgba(255,255,255,.2);cursor:pointer;font-size:14px;padding:2px 6px}

/* personalisation gate */
.lr-gate{width:100%;max-width:540px;padding:28px 20px;text-align:center;animation:lrFade .4s ease both}
.lr-gate h2{font-family:var(--serif);font-size:22px;font-weight:700;margin-bottom:6px}
.lr-gate p{font-size:13px;color:rgba(245,232,200,.4);margin-bottom:20px;line-height:1.65}
.lr-gate-field{margin-bottom:12px;text-align:left}
.lr-gate-label{font-size:9px;color:rgba(245,232,200,.35);font-family:var(--mono);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
.lr-gate-input{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;font-size:14px;color:var(--cream);font-family:var(--body);outline:none;transition:border-color .2s}
.lr-gate-input:focus{border-color:rgba(245,184,76,.4)}
.lr-gate-input::placeholder{color:rgba(255,255,255,.18)}
.lr-gate-btn{width:100%;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--cta);transition:all .2s;background:linear-gradient(135deg,var(--amber-d),var(--amber));color:#120800;margin-top:8px}
.lr-gate-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.lr-gate-skip{background:none;border:none;color:rgba(245,232,200,.3);font-size:12px;cursor:pointer;margin-top:12px;font-family:var(--body)}
.lr-gate-skip:hover{color:rgba(245,232,200,.6)}

/* book shell */
.lr-shell{width:100%;max-width:540px;padding:16px 16px 0}
.lr-book{border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);height:500px;position:relative;background:#0a0e1c;cursor:pointer;margin-bottom:10px}
.lr-page{position:absolute;inset:0;width:100%;height:100%;animation:lrFade .3s ease both}

/* cover */
.lr-cover{height:100%;display:flex;flex-direction:column}
.lr-cover-scene{flex:1;position:relative;overflow:hidden}
.lr-cover-bot{padding:16px 20px 20px;background:linear-gradient(0deg,rgba(2,4,8,.98),rgba(2,4,8,.5));position:relative;z-index:3}
.lr-cover-stars{font-size:10px;color:rgba(245,184,76,.4);letter-spacing:8px;text-align:center;margin-bottom:4px}
.lr-cover-title{font-family:var(--serif);font-size:clamp(16px,4.5vw,24px);font-weight:700;font-style:italic;color:#fae9a8;text-align:center;line-height:1.25;margin-bottom:4px}
.lr-cover-for{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);font-family:var(--mono);text-align:center;margin-bottom:4px}
.lr-cover-brand{font-family:var(--serif);font-size:11px;color:rgba(245,184,76,.4);text-align:center}

/* story page */
.lr-story{height:100%;display:flex;flex-direction:column}
.lr-story-scene{flex:0 0 220px;position:relative;overflow:hidden}
.lr-story-text{flex:1;min-height:0;padding:14px 18px 10px;display:flex;flex-direction:column;background:linear-gradient(160deg,#fef8e8,#f5e8c0);overflow-y:auto}
.lr-story-text::-webkit-scrollbar{width:3px}
.lr-story-text::-webkit-scrollbar-thumb{background:rgba(90,56,10,.15);border-radius:99px}
.lr-pgnum{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a5a1a;margin-bottom:7px;flex-shrink:0}
.lr-text{font-family:var(--hand);font-size:clamp(17px,3.8vw,20px);color:#261600;line-height:1.75;flex:1}
.lr-refrain{font-family:var(--kalam);font-size:10px;color:rgba(90,56,10,.38);text-align:center;font-style:italic;padding:5px 8px;margin-top:4px;border-top:1px solid rgba(90,56,10,.08);line-height:1.5;flex-shrink:0}

/* end page */
.lr-end{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:28px;background:linear-gradient(160deg,#020408,#0a1020)}
.lr-end-moon{font-size:48px}
.lr-end-title{font-family:var(--serif);font-size:28px;font-weight:700;font-style:italic;color:#fae9a8}
.lr-end-msg{font-family:var(--kalam);font-size:14px;color:rgba(200,190,255,.6);text-align:center;line-height:1.7}

/* nav bar */
.lr-nav-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.lr-nav-btn{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);color:var(--cream);padding:9px 18px;border-radius:10px;font-family:var(--body);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.lr-nav-btn:hover:not(:disabled){background:rgba(255,255,255,.13)}
.lr-nav-btn:disabled{opacity:.28;cursor:not-allowed}
.lr-dots{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:180px}
.lr-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .2s;flex-shrink:0}
.lr-dot.on{background:var(--amber);transform:scale(1.35)}
.lr-progress{font-size:11px;color:rgba(245,232,200,.3);font-family:var(--mono);text-align:center;margin-bottom:10px}

/* post-reading */
.lr-post{width:100%;max-width:540px;padding:0 16px 60px}

/* voting */
.lr-vote{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;text-align:center;margin-bottom:14px;animation:lrFade .3s ease both}
.lr-vote-q{font-family:var(--serif);font-size:15px;font-weight:700;margin-bottom:12px}
.lr-vote-row{display:flex;gap:10px;justify-content:center}
.lr-vote-btn{display:flex;align-items:center;gap:6px;padding:10px 22px;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--body);transition:all .18s;border:1.5px solid}
.lr-vote-btn.up{border-color:rgba(245,184,76,.25);background:rgba(245,184,76,.06);color:rgba(245,184,76,.7)}
.lr-vote-btn.up.voted{border-color:var(--amber);background:rgba(245,184,76,.15);color:var(--amber)}
.lr-vote-btn.down{border-color:rgba(255,100,100,.2);background:rgba(255,100,100,.04);color:rgba(255,100,100,.5)}
.lr-vote-btn.down.voted{border-color:rgba(255,100,100,.5);background:rgba(255,100,100,.1);color:rgba(255,100,100,.8)}
.lr-vote-btn:hover{transform:translateY(-1px)}
.lr-vote-note{margin-top:10px}
.lr-vote-note input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--cream);font-family:var(--body);outline:none}
.lr-vote-note input::placeholder{color:rgba(255,255,255,.2)}
.lr-vote-note-btn{margin-top:6px;padding:7px 16px;border-radius:50px;border:none;background:rgba(255,100,100,.12);color:rgba(255,100,100,.7);font-size:11px;font-weight:600;cursor:pointer;font-family:var(--body)}

/* fav */
.lr-fav{display:flex;justify-content:center;margin-bottom:14px}
.lr-fav-btn{display:flex;align-items:center;gap:6px;padding:10px 22px;border-radius:50px;border:1.5px solid rgba(245,184,76,.2);background:rgba(245,184,76,.05);color:rgba(245,184,76,.6);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--body);transition:all .18s}
.lr-fav-btn.saved{border-color:var(--amber);background:rgba(245,184,76,.12);color:var(--amber)}

/* share */
.lr-share{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px;animation:lrFade .3s ease both}
.lr-share-title{font-family:var(--serif);font-size:15px;font-weight:700;margin-bottom:12px;text-align:center}
.lr-share-preview{background:rgba(2,4,8,.8);border:1px solid rgba(245,184,76,.15);border-radius:14px;overflow:hidden;margin-bottom:12px}
.lr-share-preview-scene{height:100px;position:relative;overflow:hidden}
.lr-share-preview-body{padding:10px 14px}
.lr-share-preview-t{font-family:var(--serif);font-size:13px;font-weight:700;margin-bottom:2px}
.lr-share-preview-ex{font-family:var(--serif);font-size:11px;font-style:italic;color:rgba(245,232,200,.35);line-height:1.5;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lr-share-preview-brand{font-size:9px;color:rgba(245,184,76,.3);font-family:var(--mono)}
.lr-share-btns{display:flex;gap:8px;justify-content:center}
.lr-share-btn{display:flex;align-items:center;gap:5px;padding:9px 18px;border-radius:50px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(245,232,200,.5);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--body);transition:all .18s}
.lr-share-btn:hover{border-color:rgba(255,255,255,.2);color:var(--cream)}
.lr-share-btn.copied{border-color:rgba(20,216,144,.4);color:var(--teal);background:rgba(20,216,144,.06)}
.lr-share-hint{font-size:10px;color:rgba(245,232,200,.2);text-align:center;margin-top:8px}

/* cta card */
.lr-cta{background:rgba(245,184,76,.05);border:1px solid rgba(245,184,76,.2);border-radius:16px;padding:22px;text-align:center;margin-bottom:14px}
.lr-cta h3{font-family:var(--serif);font-size:17px;font-weight:700;margin-bottom:4px}
.lr-cta p{font-size:13px;color:rgba(245,232,200,.4);line-height:1.65;margin-bottom:14px}
.lr-cta-btn{padding:12px 28px;border:none;border-radius:50px;background:var(--amber);color:#120800;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--cta);transition:all .18s}
.lr-cta-btn:hover{filter:brightness(1.1)}

/* loading */
.lr-loading{text-align:center;padding:80px 24px;color:rgba(245,232,200,.3)}
.lr-error{text-align:center;padding:80px 24px}
.lr-error h2{font-family:var(--serif);font-size:20px;color:var(--cream);margin-bottom:8px}
.lr-error p{font-size:13px;color:rgba(245,232,200,.4);margin-bottom:16px}
`;

interface Props { slug: string }

export default function LibraryStoryReader({ slug }: Props) {
  const { user, setView, isSubscribed } = useApp();
  const [story, setStory] = useState<LibraryStory | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Reading state
  const [pageIdx, setPageIdx] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [nameInputs, setNameInputs] = useState<Record<string, string>>({});
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  // Post-reading state
  const [myVote, setMyVote] = useState<1 | -1 | null>(null);
  const [localUp, setLocalUp] = useState(0);
  const [localDown, setLocalDown] = useState(0);
  const [showDownNote, setShowDownNote] = useState(false);
  const [downNote, setDownNote] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sleepseed_sid') : null;
  const refFromUrl = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sleepseed_ref') : null;

  // Load story
  useEffect(() => {
    if (!slug) { setError('No story specified.'); setLoading(false); return; }
    getLibraryStoryBySlug(slug).then(s => {
      if (!s) { setError('Story not found.'); setLoading(false); return; }
      setStory(s);
      setLocalUp(s.thumbsUp);
      setLocalDown(s.thumbsDown);
      setLoading(false);
      // Show personalisation gate for paid users
      if (isSubscribed && s.bookData?.allChars?.length > 0) setShowGate(true);
      // Record read
      recordStoryRead(s.id, { refCode: refFromUrl || undefined, userId: user?.id, sessionId: sessionId || undefined });
      // OG tags
      document.title = `${s.title} — SleepSeed`;
      setMeta('og:title', s.title);
      setMeta('og:description', `A bedtime story for ages ${s.ageGroup || 'all ages'} — on SleepSeed`);
      setMeta('og:url', `${BASE_URL}/stories/${s.librarySlug}`);
      setMeta('og:type', 'article');
    });
    // Load vote
    getUserVote(slug, user?.id, sessionId || undefined).then(v => setMyVote(v));
    // Load fav
    if (user && !user.isGuest) {
      // We need the story id but don't have it yet — will check after story loads
    }
    return () => { document.title = 'SleepSeed'; };
  }, [slug]); // eslint-disable-line

  // Check fav after story loads
  useEffect(() => {
    if (story && user && !user.isGuest) {
      isFavourited(user.id, story.id).then(setIsFav);
    }
  }, [story, user]);

  // Build share link
  useEffect(() => {
    if (!story) return;
    if (user && !user.isGuest) {
      ensureRefCode(user.id).then(code => {
        setShareLink(`${BASE_URL}/stories/${story.librarySlug}?ref=${code}`);
      }).catch(() => {
        setShareLink(`${BASE_URL}/stories/${story.librarySlug}`);
      });
    } else {
      setShareLink(`${BASE_URL}/stories/${story.librarySlug}`);
    }
  }, [story, user]);

  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };

  // Personalisation: replace names in text
  const personalise = (text: string): string => {
    let result = text;
    for (const [orig, replacement] of Object.entries(nameMap)) {
      if (replacement && replacement !== orig) {
        result = result.split(orig).join(replacement);
      }
    }
    return result;
  };

  const handleStartReading = () => {
    const map: Record<string, string> = {};
    for (const [orig, val] of Object.entries(nameInputs)) {
      if (val.trim()) map[orig] = val.trim();
    }
    setNameMap(map);
    setShowGate(false);
  };

  if (loading) return <div className="lr"><style>{CSS}</style><div className="lr-loading">Loading story...</div></div>;
  if (error || !story) return (
    <div className="lr">
      <style>{CSS}</style>
      <nav className="lr-nav">
        <div className="lr-logo" onClick={() => setView('library')}><div className="lr-logo-moon" /> SleepSeed</div>
      </nav>
      <div className="lr-error">
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌙</div>
        <h2>Story not found</h2>
        <p>{error || 'This story may have been removed.'}</p>
        <button className="lr-nav-btn" onClick={() => setView('library')}>← Back to library</button>
      </div>
    </div>
  );

  const pages = story.bookData?.pages || [];
  const totalPages = 2 + pages.length; // cover + pages + end
  const isLast = pageIdx === totalPages - 1;
  const seed = parseInt(strHash(story.title + (story.heroName || '')), 36) || 0;
  const Scene = getSceneByVibe(seed, story.vibe);
  const displayTitle = personalise(story.title);
  const displayHero = nameMap[story.heroName] || story.heroName;

  const goPage = (dir: number) => setPageIdx(p => Math.max(0, Math.min(totalPages - 1, p + dir)));

  const handleVote = async (vote: 1 | -1) => {
    if (!user || user.isGuest) return;
    if (vote === -1 && myVote !== -1) { setShowDownNote(true); }
    setMyVote(vote);
    if (vote === 1) { setLocalUp(u => u + (myVote === 1 ? 0 : 1)); if (myVote === -1) setLocalDown(d => d - 1); }
    if (vote === -1) { setLocalDown(d => d + (myVote === -1 ? 0 : 1)); if (myVote === 1) setLocalUp(u => u - 1); }
    await voteOnStory(story.id, vote, undefined, user.id, sessionId || undefined);
  };

  const handleDownNoteSubmit = async () => {
    if (downNote.trim()) {
      await voteOnStory(story.id, -1, downNote.trim(), user?.id, sessionId || undefined);
    }
    setShowDownNote(false);
  };

  const toggleFav = async () => {
    if (!user || user.isGuest || !isSubscribed) return;
    if (isFav) { await removeFromFavourites(user.id, story.id); setIsFav(false); }
    else { await addToFavourites(user.id, story.id); setIsFav(true); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: story.title, text: `A bedtime story: ${story.title}`, url: shareLink }); } catch {}
    } else { copyLink(); }
  };

  // Personalisation gate
  if (showGate) {
    const chars = story.bookData?.allChars || [];
    return (
      <div className="lr">
        <style>{CSS}</style>
        <nav className="lr-nav">
          <div className="lr-logo" onClick={() => setView('library')}><div className="lr-logo-moon" /> SleepSeed</div>
          <button className="lr-back" onClick={() => setView('library')}>← Library</button>
        </nav>
        <div className="lr-gate">
          <div style={{ height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}><Scene /></div>
          <h2>Make this story yours</h2>
          <p>Swap in your child's name before you start reading</p>
          {chars.map((c: any) => (
            <div className="lr-gate-field" key={c.name}>
              <div className="lr-gate-label">{c.type || 'Character'}: {c.name}</div>
              <input className="lr-gate-input" placeholder={c.name}
                value={nameInputs[c.name] || ''}
                onChange={e => setNameInputs(prev => ({ ...prev, [c.name]: e.target.value }))} />
            </div>
          ))}
          <button className="lr-gate-btn" onClick={handleStartReading}>Start reading →</button>
          <button className="lr-gate-skip" onClick={() => setShowGate(false)}>Read as written →</button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Cover
    if (pageIdx === 0) return (
      <div className="lr-page lr-cover">
        <div className="lr-cover-scene"><Scene /></div>
        <div className="lr-cover-bot">
          <div className="lr-cover-stars">* * *</div>
          <div className="lr-cover-title">{displayTitle}</div>
          <div className="lr-cover-for">A bedtime story for {displayHero}</div>
          <div className="lr-cover-brand">SleepSeed</div>
        </div>
      </div>
    );

    // End page
    if (isLast) return (
      <div className="lr-page lr-end">
        <div className="lr-end-moon">🌙</div>
        <div className="lr-end-title">The End</div>
        {story.refrain && (
          <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'rgba(240,204,96,.7)', lineHeight: 1.7, maxWidth: 280, textAlign: 'center' }}>
            "{personalise(story.refrain)}"
          </div>
        )}
        <div className="lr-end-msg">Sweet dreams, {displayHero}.<br />Tomorrow night, another adventure awaits...</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: 'rgba(245,184,76,.3)', marginTop: 4 }}>SleepSeed</div>
      </div>
    );

    // Story page
    const pg = pages[pageIdx - 1];
    if (!pg) return null;
    return (
      <div className="lr-page lr-story">
        <div className="lr-story-scene"><Scene /></div>
        <div className="lr-story-text">
          <div className="lr-pgnum">Page {pageIdx}</div>
          <div className="lr-text">{personalise(pg.text || '')}</div>
          {story.refrain && <div className="lr-refrain">* {personalise(story.refrain)} *</div>}
        </div>
      </div>
    );
  };

  const isNotLoggedIn = !user || user.isGuest;
  const isFreeUser = user && !user.isGuest && !isSubscribed;

  return (
    <div className="lr">
      <style>{CSS}</style>

      <nav className="lr-nav">
        <div className="lr-logo" onClick={() => setView('library')}><div className="lr-logo-moon" /> SleepSeed</div>
        <button className="lr-back" onClick={() => setView('library')}>← Library</button>
      </nav>

      {/* Upgrade banner for free/guest */}
      {(isNotLoggedIn || isFreeUser) && showUpgradeBanner && (
        <div className="lr-upgrade">
          <div className="lr-upgrade-text">
            {isNotLoggedIn ? 'Sign up to vote and save favourites →' : 'Upgrade to personalise this story for your child →'}
          </div>
          <button className="lr-upgrade-x" onClick={() => setShowUpgradeBanner(false)}>x</button>
        </div>
      )}

      {/* Book */}
      <div className="lr-shell">
        <div className="lr-book" onClick={() => goPage(1)}>
          {renderPage()}
        </div>

        <div className="lr-nav-bar">
          <button className="lr-nav-btn" disabled={pageIdx === 0} onClick={() => goPage(-1)}>← Back</button>
          <div className="lr-dots">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} className={`lr-dot${i === pageIdx ? ' on' : ''}`} onClick={() => setPageIdx(i)} />
            ))}
          </div>
          <button className="lr-nav-btn" disabled={isLast} onClick={() => goPage(1)}>Next →</button>
        </div>

        <div className="lr-progress">
          {isLast ? 'The End' : `Page ${pageIdx} of ${totalPages - 1}`}
        </div>
      </div>

      {/* Post-reading section — only after reaching end */}
      {isLast && (
        <div className="lr-post">

          {/* Voting */}
          <div className="lr-vote">
            <div className="lr-vote-q">Did you enjoy this story?</div>
            {isNotLoggedIn ? (
              <div>
                <div className="lr-vote-row">
                  <button className="lr-vote-btn up" onClick={() => setView('auth')}>👍 {localUp}</button>
                  <button className="lr-vote-btn down" onClick={() => setView('auth')}>👎 {localDown}</button>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(245,232,200,.3)', marginTop: 8 }}>Create a free account to vote</div>
              </div>
            ) : (
              <>
                <div className="lr-vote-row">
                  <button className={`lr-vote-btn up${myVote === 1 ? ' voted' : ''}`} onClick={() => handleVote(1)}>👍 {localUp}</button>
                  <button className={`lr-vote-btn down${myVote === -1 ? ' voted' : ''}`} onClick={() => handleVote(-1)}>👎 {localDown}</button>
                </div>
                {showDownNote && (
                  <div className="lr-vote-note">
                    <input placeholder="What didn't work for you? (optional)" value={downNote} onChange={e => setDownNote(e.target.value)} />
                    <button className="lr-vote-note-btn" onClick={handleDownNoteSubmit}>Submit</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Favourites — paid only */}
          {isSubscribed && (
            <div className="lr-fav">
              <button className={`lr-fav-btn${isFav ? ' saved' : ''}`} onClick={toggleFav}>
                {isFav ? '❤️ Saved' : '🤍 Save to favourites'}
              </button>
            </div>
          )}

          {/* Share */}
          <div className="lr-share">
            <div className="lr-share-title">Share this story</div>
            <div className="lr-share-preview">
              <div className="lr-share-preview-scene"><Scene /></div>
              <div className="lr-share-preview-body">
                <div className="lr-share-preview-t">{story.title}</div>
                {pages[0]?.text && (
                  <div className="lr-share-preview-ex">{pages[0].text.slice(0, 100)}...</div>
                )}
                <div className="lr-share-preview-brand">SleepSeed · Read the full story →</div>
              </div>
            </div>
            <div className="lr-share-btns">
              <button className={`lr-share-btn${copied ? ' copied' : ''}`} onClick={copyLink}>
                {copied ? '✓ Copied!' : '📋 Copy link'}
              </button>
              <button className="lr-share-btn" onClick={handleShare}>📱 Share</button>
            </div>
            {user && !user.isGuest && (
              <div className="lr-share-hint">Earn rewards when friends join →</div>
            )}
          </div>

          {/* Conversion CTA — guests and free users */}
          {(isNotLoggedIn || isFreeUser) && (
            <div className="lr-cta">
              <h3>Did {displayHero} feel like your child's story?</h3>
              <p>Put your child's name in every story.</p>
              <button className="lr-cta-btn" onClick={() => setView('auth')}>Start free →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
