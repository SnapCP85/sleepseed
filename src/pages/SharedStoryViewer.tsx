import { useState, useEffect, useRef } from 'react';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--cream:#fdf5e0;--parch:#f5e8c0;--ink:#261600;--ink2:#5a380a;--serif2:'Playfair Display',Georgia,serif;--sans2:'Plus Jakarta Sans',system-ui,sans-serif;--mono2:'DM Mono',monospace;}
.sv-wrap{min-height:100vh;background:var(--night);font-family:var(--sans2);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center;padding:0 0 60px}
.sv-nav{width:100%;background:rgba(13,16,24,.97);border-bottom:1px solid rgba(232,151,42,.1);padding:0 6%;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}
.sv-logo{font-family:var(--serif2);font-size:17px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:8px}
.sv-moon{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.sv-badge{font-size:9px;font-family:var(--mono2);color:rgba(232,151,42,.55);letter-spacing:1.5px;text-transform:uppercase;background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.15);padding:4px 10px;border-radius:50px}
.sv-shell{width:100%;max-width:500px;padding:24px 16px 0}
.sv-header{text-align:center;margin-bottom:24px;padding:0 8px}
.sv-for{font-size:9px;font-family:var(--mono2);color:rgba(232,151,42,.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.sv-title{font-family:var(--serif2);font-size:clamp(22px,5vw,32px);font-weight:700;font-style:italic;color:#F4EFE8;line-height:1.15;margin-bottom:6px;letter-spacing:-.02em}
.sv-hero{font-size:13px;color:rgba(244,239,232,.42);font-weight:300;font-family:var(--mono2)}
.sv-book{border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);height:480px;position:relative;background:#0e1428;cursor:pointer;margin-bottom:14px}
.sv-bpage{position:absolute;inset:0;width:100%;height:100%;animation:svFade .3s ease both}
@keyframes svFade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
.sv-cover{background:linear-gradient(160deg,#0a0f28,#14204a,#0e1830);height:100%;display:flex;flex-direction:column}
.sv-cover-art{flex:1;position:relative;overflow:hidden;background:linear-gradient(160deg,#0f1a40,#1a2850)}
.sv-cover-bot{padding:14px 20px 18px;background:linear-gradient(0deg,rgba(8,12,28,.98),rgba(8,12,28,.6));position:relative;z-index:3}
.sv-c-stars{font-size:10px;color:rgba(212,160,48,.45);letter-spacing:8px;text-align:center;margin-bottom:5px}
.sv-c-title{font-family:var(--serif2);font-size:clamp(15px,4vw,22px);font-weight:700;font-style:italic;color:#fae9a8;text-align:center;line-height:1.25;margin-bottom:4px}
.sv-c-for{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6070a0;text-align:center;margin-bottom:5px}
.sv-c-brand{font-family:var(--serif2);font-size:11px;color:rgba(212,160,48,.45);text-align:center}
.sv-story-bg{background:linear-gradient(160deg,#fef8e8,#f5e4b8);height:100%;display:flex;flex-direction:column}
.sv-story-illo{flex:0 0 36%;background:linear-gradient(160deg,#e8ddb0,#d4c890);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.sv-story-text-col{flex:1;min-height:0;padding:14px 18px 10px;display:flex;flex-direction:column;background:linear-gradient(160deg,#fef8e8,#f5e8c0);overflow-y:auto}
.sv-story-text-col::-webkit-scrollbar{width:3px}
.sv-story-text-col::-webkit-scrollbar-thumb{background:rgba(90,56,10,.15);border-radius:99px}
.sv-pgnum{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a5a1a;margin-bottom:7px;flex-shrink:0}
.sv-text{font-family:'Patrick Hand',cursive;font-size:clamp(17px,3.8vw,20px);color:#261600;line-height:1.75;flex:1;min-height:0;overflow-y:auto}
.sv-refrain{font-family:'Kalam',cursive;font-size:10px;color:rgba(90,56,10,.38);text-align:center;font-style:italic;padding:5px 8px;margin-top:4px;border-top:1px solid rgba(90,56,10,.08);line-height:1.5;flex-shrink:0}
.sv-orn{display:flex;align-items:center;justify-content:space-between;margin-top:8px;flex-shrink:0}
.sv-orn-dec{font-size:9px;color:rgba(90,56,10,.28);letter-spacing:4px}
.sv-orn-num{font-family:'Kalam',cursive;font-size:15px;color:rgba(90,56,10,.22)}
.sv-end{background:linear-gradient(160deg,#060b18,#0b1428);height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:28px;text-align:center}
.sv-end-moon{font-size:48px;animation:svFloat 6s ease-in-out infinite}
@keyframes svFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.sv-end-title{font-family:var(--serif2);font-size:28px;font-weight:700;font-style:italic;color:#fae9a8}
.sv-end-refrain{font-family:var(--serif2);font-size:clamp(13px,3.2vw,16px);font-style:italic;color:rgba(240,204,96,.75);line-height:1.72;max-width:280px}
.sv-nav-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.sv-nav-btn{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);color:#F4EFE8;padding:9px 18px;border-radius:10px;font-family:var(--sans2);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.sv-nav-btn:hover:not(:disabled){background:rgba(255,255,255,.13)}
.sv-nav-btn:disabled{opacity:.28;cursor:not-allowed}
.sv-progress{font-size:11px;color:rgba(244,239,232,.38);font-family:var(--mono2);text-align:center;padding:0 8px}
.sv-dots{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:160px}
.sv-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .2s;flex-shrink:0}
.sv-dot.on{background:#F5B84C;transform:scale(1.35)}
.sv-audio-bar{display:flex;gap:8px;justify-content:center;margin-bottom:12px;flex-wrap:wrap}
.sv-play-btn{display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:50px;border:none;background:#E8972A;color:#1A1420;font-family:var(--sans2);font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.sv-play-btn:hover{background:#F5B84C;transform:translateY(-1px)}
.sv-play-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.sv-voice-label{font-size:9.5px;color:rgba(244,239,232,.32);font-family:var(--mono2);text-align:center;margin-bottom:14px}
.sv-mkt{margin-top:24px;width:100%;max-width:500px;padding:0 16px}
.sv-mkt-card{background:rgba(232,151,42,.06);border:1px solid rgba(232,151,42,.15);border-radius:18px;padding:22px 24px;text-align:center;position:relative;overflow:hidden}
.sv-mkt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.3),transparent)}
.sv-mkt-moon{width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 12px;box-shadow:0 0 24px 4px rgba(232,151,42,.1)}
.sv-mkt-h{font-family:var(--serif2);font-size:18px;font-weight:700;color:#F4EFE8;margin-bottom:6px;font-style:italic}
.sv-mkt-sub{font-size:13px;color:rgba(244,239,232,.48);font-weight:300;line-height:1.65;margin-bottom:16px}
.sv-mkt-btn{background:#E8972A;color:#1A1420;border:none;border-radius:50px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--sans2);transition:all .2s}
.sv-mkt-btn:hover{background:#F5B84C;transform:translateY(-1px)}
.sv-mkt-trust{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:12px}
.sv-mkt-ti{font-size:10.5px;color:rgba(244,239,232,.28);font-family:var(--mono2)}
.sv-illo-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;opacity:.25}
.sv-error{text-align:center;padding:80px 24px;color:rgba(244,239,232,.5)}
.sv-error-h{font-family:var(--serif2);font-size:20px;font-weight:700;color:#F4EFE8;margin-bottom:8px}
.sv-shimmer{position:absolute;inset:0;background:linear-gradient(110deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%);background-size:200% 100%;animation:svShimmer 1.6s ease-in-out infinite}
@keyframes svShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

interface SharedStory {
  t: string;   // title
  n: string;   // heroName
  r?: string;  // refrain
  p: { t: string; e?: string }[]; // pages
  pn?: string; // parentNote
  v?: string;  // voiceId (cloned or preset)
  d?: string;  // date
}

export default function SharedStoryViewer() {
  const [story, setStory] = useState<SharedStory | null>(null);
  const [error, setError] = useState('');
  const [pageIdx, setPageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('s');
      if (!encoded) { setError('No story found in this link.'); return; }
      const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
      if (!decoded.t || !decoded.n) { setError('This story link appears to be incomplete.'); return; }
      setStory(decoded);
    } catch {
      setError('This story link could not be read. It may be corrupted or expired.');
    }
  }, []);

  if (error) return (
    <div className="sv-wrap">
      <style>{CSS}</style>
      <nav className="sv-nav">
        <div className="sv-logo"><div className="sv-moon" />SleepSeed</div>
      </nav>
      <div className="sv-error">
        <div style={{ fontSize: 36, marginBottom: 16 }}>🌙</div>
        <div className="sv-error-h">Story not found</div>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>{error}</div>
      </div>
    </div>
  );

  if (!story) return (
    <div className="sv-wrap">
      <style>{CSS}</style>
      <nav className="sv-nav"><div className="sv-logo"><div className="sv-moon" />SleepSeed</div></nav>
      <div style={{ padding: 48, textAlign: 'center', color: 'rgba(244,239,232,.35)', fontFamily: 'var(--mono2)', fontSize: 12 }}>Loading story…</div>
    </div>
  );

  const totalPages = 1 + story.p.length + 1; // cover + pages + end
  const isLast = pageIdx === totalPages - 1;

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
  };

  const getCurrentText = () => {
    if (pageIdx === 0) return `${story.t}. A bedtime story for ${story.n}.`;
    if (isLast) return `The End. Sweet dreams, ${story.n}.`;
    return story.p[pageIdx - 1]?.t || '';
  };

  const handlePlay = async () => {
    if (isPlaying) { stopAudio(); return; }
    if (!story.v) return;
    try {
      setLoadingAudio(true);
      const text = getCurrentText();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: story.v, speed: 1.0 }),
      });
      if (!res.ok) throw new Error('Audio unavailable');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsPlaying(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsPlaying(false); };
      await audio.play();
    } catch { stopAudio(); }
    finally { setLoadingAudio(false); }
  };

  const goPage = (dir: number) => {
    stopAudio();
    setPageIdx(p => Math.max(0, Math.min(totalPages - 1, p + dir)));
  };

  const minRemaining = Math.max(1, Math.ceil((totalPages - 1 - pageIdx) * 0.4));

  const renderPage = () => {
    // Cover
    if (pageIdx === 0) return (
      <div className="sv-bpage sv-cover">
        <div className="sv-cover-art">
          <div className="sv-shimmer" />
          <div className="sv-illo-placeholder">🌙</div>
        </div>
        <div className="sv-cover-bot">
          <div className="sv-c-stars">✦ ★ ✦</div>
          <div className="sv-c-title">{story.t}</div>
          <div className="sv-c-for">A bedtime story for {story.n}</div>
          <div className="sv-c-brand">🌙 SleepSeed</div>
        </div>
      </div>
    );

    // End page
    if (isLast) return (
      <div className="sv-bpage sv-end">
        <div className="sv-end-moon">🌙</div>
        <div className="sv-end-title">The End</div>
        {story.r && <div className="sv-end-refrain">"{story.r}"</div>}
        <div style={{ fontFamily: "'Kalam',cursive", fontSize: 13, color: 'rgba(200,180,255,.6)', lineHeight: 1.7 }}>
          Sweet dreams, {story.n}.<br />
          Tomorrow night, another adventure awaits…
        </div>
        <div style={{ fontFamily: 'var(--serif2)', fontSize: 10, color: 'rgba(232,151,42,.3)', marginTop: 4 }}>
          🌙 SleepSeed
        </div>
      </div>
    );

    // Story page
    const pg = story.p[pageIdx - 1];
    return (
      <div className="sv-bpage sv-story-bg">
        <div className="sv-story-illo">
          <div className="sv-shimmer" />
          <div className="sv-illo-placeholder">✨</div>
        </div>
        <div className="sv-story-text-col">
          <div className="sv-pgnum">Page {pageIdx}</div>
          <div className="sv-text">{pg?.t}</div>
          <div className="sv-orn">
            <div className="sv-orn-dec">✦ ✦ ✦</div>
            <div className="sv-orn-num">{pageIdx}</div>
          </div>
          {story.r && <div className="sv-refrain">✦ {story.r} ✦</div>}
        </div>
      </div>
    );
  };

  const voiceName = story.v ? 'Narrated in a special voice' : null;

  return (
    <div className="sv-wrap">
      <style>{CSS}</style>

      <nav className="sv-nav">
        <div className="sv-logo"><div className="sv-moon" />SleepSeed</div>
        <div className="sv-badge">Shared story</div>
      </nav>

      <div className="sv-shell">
        {/* Header */}
        <div className="sv-header">
          <div className="sv-for">A story for</div>
          <div className="sv-title">{story.t}</div>
          <div className="sv-hero">{story.n}{story.d ? ` · ${story.d}` : ''}</div>
        </div>

        {/* Book */}
        <div className="sv-book">{renderPage()}</div>

        {/* Navigation */}
        <div className="sv-nav-bar">
          <button className="sv-nav-btn" disabled={pageIdx === 0} onClick={() => goPage(-1)}>← Back</button>
          <div className="sv-dots">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} className={`sv-dot${i === pageIdx ? ' on' : ''}`} onClick={() => { if (i <= pageIdx) { stopAudio(); setPageIdx(i); } }} />
            ))}
          </div>
          <button className="sv-nav-btn" disabled={isLast} onClick={() => goPage(1)}>Next →</button>
        </div>

        {/* Progress */}
        <div className="sv-progress" style={{ marginBottom: 10 }}>
          {isLast ? 'The End' : `Page ${pageIdx} of ${totalPages - 1} · ~${minRemaining} min remaining`}
        </div>

        {/* Audio controls */}
        {story.v && (
          <>
            <div className="sv-audio-bar">
              <button className="sv-play-btn" disabled={loadingAudio} onClick={handlePlay}>
                {loadingAudio ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="rgba(26,20,32,.4)" strokeWidth="2"/><path d="M7 2a5 5 0 0 1 5 5" stroke="#1A1420" strokeWidth="2" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur=".8s" repeatCount="indefinite"/></path></svg>
                ) : isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1.5" fill="#1A1420"/><rect x="8" y="2" width="4" height="10" rx="1.5" fill="#1A1420"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="#1A1420"/></svg>
                )}
                {loadingAudio ? 'Loading…' : isPlaying ? 'Pause' : 'Listen to this page'}
              </button>
            </div>
            {voiceName && <div className="sv-voice-label">{voiceName}</div>}
          </>
        )}
      </div>

      {/* Marketing */}
      <div className="sv-mkt">
        <div className="sv-mkt-card">
          <div className="sv-mkt-moon" />
          <div className="sv-mkt-h">Make a story like this<br />for your child.</div>
          <div className="sv-mkt-sub">Personalised bedtime stories starring your child — written in 60 seconds. Every night, a new one. Then a Night Card to keep forever.</div>
          <button className="sv-mkt-btn" onClick={() => window.open('https://sleepseed-vercel.vercel.app', '_blank')}>
            Start free tonight ✨
          </button>
          <div className="sv-mkt-trust">
            <span className="sv-mkt-ti">✓ Free to try</span>
            <span className="sv-mkt-ti">✓ No card needed</span>
            <span className="sv-mkt-ti">✓ 60 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
