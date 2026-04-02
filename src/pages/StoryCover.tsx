import { useState, useEffect, useMemo } from 'react';
import { getLibraryStoryBySlug } from '../lib/storage';
import type { LibraryStory } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// StoryCover — Premium landing page for shared story links
// ─────────────────────────────────────────────────────────────────────────────
// Recipients land here first (via /stories/:slug → ?library=slug).
// Shows title, refrain, metadata, and a "Read this story" CTA.
// Emotional, premium, and fast — one screen before the full reader.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.sc-wrap{min-height:100vh;background:#060912;display:flex;flex-direction:column;align-items:center;font-family:'Nunito',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.sc-nav{width:100%;padding:0 6%;height:56px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(6,9,18,.95);backdrop-filter:blur(16px);position:relative;z-index:10}
.sc-logo{display:flex;align-items:center;gap:8px;font-family:'Fraunces',Georgia,serif;font-size:17px;font-weight:700;color:#F4EFE8}
.sc-moon{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.sc-badge{font-size:9px;font-family:'DM Mono',monospace;color:rgba(232,151,42,.55);letter-spacing:1.5px;text-transform:uppercase;background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.15);padding:4px 10px;border-radius:50px}
.sc-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px 60px;max-width:440px;text-align:center;position:relative}
.sc-glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:500px;height:400px;background:radial-gradient(ellipse,rgba(60,30,120,.35) 0%,transparent 70%);pointer-events:none}
.sc-stars{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.sc-star{position:absolute;border-radius:50%;background:#EEE8FF}
@keyframes sc-twinkle{0%,100%{opacity:.12}50%{opacity:.45}}
@keyframes sc-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes sc-moonFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.sc-creature{font-size:56px;margin-bottom:20px;animation:sc-moonFloat 5s ease-in-out infinite,sc-fadeUp .6s ease both;filter:drop-shadow(0 6px 20px rgba(0,0,0,.4))}
.sc-for{font-size:10px;font-family:'DM Mono',monospace;color:rgba(232,151,42,.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;animation:sc-fadeUp .6s .1s ease both;opacity:0}
.sc-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,6vw,36px);font-weight:700;color:#F4EFE8;line-height:1.15;letter-spacing:-.02em;margin-bottom:8px;animation:sc-fadeUp .6s .2s ease both;opacity:0}
.sc-hero{font-size:13px;color:rgba(244,239,232,.42);font-family:'DM Mono',monospace;margin-bottom:24px;animation:sc-fadeUp .6s .3s ease both;opacity:0}
.sc-refrain{padding:16px 20px;background:rgba(245,184,76,.07);border:1px solid rgba(245,184,76,.18);border-radius:16px;margin-bottom:28px;animation:sc-fadeUp .6s .4s ease both;opacity:0}
.sc-refrain-txt{font-family:'Lora','Fraunces',Georgia,serif;font-style:italic;font-size:clamp(13px,3.2vw,16px);color:rgba(240,204,96,.78);line-height:1.65}
.sc-pills{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:28px;animation:sc-fadeUp .6s .5s ease both;opacity:0}
.sc-pill{font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.6px;padding:5px 12px;border-radius:50px;border:1px solid rgba(255,255,255,.1);color:rgba(244,239,232,.5);background:rgba(255,255,255,.04)}
.sc-cta{width:100%;max-width:320px;padding:17px 24px;border-radius:18px;border:none;cursor:pointer;background:#F5B84C;color:#172200;font-size:16px;font-weight:700;font-family:'Fraunces',Georgia,serif;box-shadow:0 8px 28px rgba(245,184,76,.28);transition:all .2s;position:relative;overflow:hidden;animation:sc-fadeUp .6s .6s ease both;opacity:0}
.sc-cta:hover{background:#F8C960;transform:translateY(-1px);box-shadow:0 12px 36px rgba(245,184,76,.35)}
.sc-cta-shimmer{position:absolute;inset:0;background:linear-gradient(108deg,transparent 30%,rgba(255,255,255,.2) 50%,transparent 70%);animation:sc-shine 4.5s infinite;pointer-events:none}
@keyframes sc-shine{0%{transform:translateX(-100%)}50%,100%{transform:translateX(200%)}}
.sc-secondary{margin-top:16px;animation:sc-fadeUp .6s .7s ease both;opacity:0}
.sc-secondary-link{color:rgba(244,239,232,.35);font-size:12px;font-family:'DM Mono',monospace;letter-spacing:.3px;text-decoration:none;cursor:pointer;transition:color .15s;background:none;border:none}
.sc-secondary-link:hover{color:rgba(244,239,232,.55)}
.sc-loading{min-height:100vh;background:#060912;display:flex;align-items:center;justify-content:center;color:rgba(244,239,232,.35);font-family:'DM Mono',monospace;font-size:12px}
.sc-error{min-height:100vh;background:#060912;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:rgba(244,239,232,.5);font-family:'Nunito',sans-serif}
`;

const VIBE_LABELS: Record<string, string> = {
  'calm-cosy': 'Calm & Cosy',
  'warm-funny': 'Warm & Funny',
  'exciting': 'Exciting',
  'heartfelt': 'Heartfelt',
  'mysterious': 'Mysterious',
  'silly': 'Silly',
};

const AGE_LABELS: Record<string, string> = {
  'age3': 'Ages 3–5',
  'age5': 'Ages 5–7',
  'age7': 'Ages 7–9',
  'age10': 'Ages 9–11',
  '3-5': 'Ages 3–5',
  '5-7': 'Ages 5–7',
  '7-9': 'Ages 7–9',
  '9-11': 'Ages 9–11',
};

interface Props {
  slug: string;
  onReadStory: () => void;
}

export default function StoryCover({ slug, onReadStory }: Props) {
  const [story, setStory] = useState<LibraryStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLibraryStoryBySlug(slug)
      .then(s => { if (s) setStory(s); else setError('Story not found'); })
      .catch(() => setError('Could not load story'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Deterministic stars from slug
  const stars = useMemo(() => {
    let h = 5381;
    for (let i = 0; i < slug.length; i++) h = (h * 33) ^ slug.charCodeAt(i);
    return Array.from({ length: 40 }, (_, i) => ({
      x: ((h * (i + 1) * 37) % 1000) / 10,
      y: ((h * (i + 1) * 53) % 1000) / 10,
      s: 1 + ((h * (i + 1)) % 3) * 0.5,
      o: 0.1 + ((h * (i + 1)) % 5) * 0.07,
      d: (((h * (i + 1) * 71) % 1000) / 1000) * 4,
    }));
  }, [slug]);

  if (loading) return <div className="sc-loading"><style>{CSS}</style>Loading story...</div>;
  if (error || !story) return (
    <div className="sc-error">
      <style>{CSS}</style>
      <div style={{ fontSize: 40 }}>🌙</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#F4EFE8' }}>Story not found</div>
      <div style={{ fontSize: 13 }}>{error || 'This story may have been removed.'}</div>
      <a className="sc-secondary-link" href="https://sleepseed.vercel.app" style={{ marginTop: 12 }}>Go to SleepSeed →</a>
    </div>
  );

  const vibeLabel = VIBE_LABELS[story.vibe || ''] || story.vibe;
  const ageLabel = AGE_LABELS[story.ageGroup || ''] || story.ageGroup;

  return (
    <div className="sc-wrap">
      <style>{CSS}</style>

      {/* Nav */}
      <nav className="sc-nav">
        <div className="sc-logo"><div className="sc-moon" />SleepSeed</div>
        <div className="sc-badge">Shared story</div>
      </nav>

      {/* Body */}
      <div className="sc-body">
        {/* Glow */}
        <div className="sc-glow" />

        {/* Stars */}
        <div className="sc-stars">
          {stars.map((s, i) => (
            <div key={i} className="sc-star" style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.s, height: s.s,
              opacity: s.o,
              animation: `sc-twinkle ${3 + s.d}s ${s.d}s ease-in-out infinite`,
            }} />
          ))}
        </div>

        {/* Creature */}
        <div className="sc-creature">🌙</div>

        {/* For label */}
        <div className="sc-for">A bedtime story for</div>

        {/* Title */}
        <div className="sc-title">{story.title}</div>

        {/* Hero name */}
        <div className="sc-hero">{story.heroName}</div>

        {/* Refrain */}
        {story.refrain && (
          <div className="sc-refrain">
            <div className="sc-refrain-txt">"{story.refrain}"</div>
          </div>
        )}

        {/* Pills */}
        <div className="sc-pills">
          {vibeLabel && <div className="sc-pill">{vibeLabel}</div>}
          {ageLabel && <div className="sc-pill">{ageLabel}</div>}
          {story.isStaffPick && <div className="sc-pill" style={{ borderColor: 'rgba(245,184,76,.3)', color: 'rgba(245,184,76,.7)' }}>★ Staff Pick</div>}
        </div>

        {/* CTA */}
        <button className="sc-cta" onClick={onReadStory}>
          <div className="sc-cta-shimmer" />
          <span style={{ position: 'relative', zIndex: 1 }}>Read this story →</span>
        </button>

        {/* Secondary CTA */}
        <div className="sc-secondary">
          <a className="sc-secondary-link" href="https://sleepseed.vercel.app">
            Create your own bedtime story →
          </a>
        </div>
      </div>
    </div>
  );
}
