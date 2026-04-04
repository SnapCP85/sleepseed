import { useState } from 'react';
import { hexToRgba } from './RitualShared';
import '../onboarding/onboarding.css';
import ElderDreamKeeper from '../onboarding/ElderDreamKeeper';
import DreamEgg from '../onboarding/DreamEgg';

// ─────────────────────────────────────────────────────────────────────────────
// RitualStoryViewer — Split-screen story reader matching v9 blueprint
// ─────────────────────────────────────────────────────────────────────────────
// Top half: Scene illustration (Elder, egg, glow, stars, dreamlight)
// Bottom half: Story text + pagination + CTA
// Gradient fade between scene and text areas.
// ─────────────────────────────────────────────────────────────────────────────

export interface StoryPage {
  text: string;
  scene?: 'stars' | 'elder' | 'egg' | 'glow' | 'forest' | 'dreamlight' | 'eggcrack';
}

interface Props {
  pages: StoryPage[];
  title: string;
  emoji: string;
  color?: string;
  nightNumber?: number;
  nightLabel?: string;
  onComplete: () => void;
}

// ── Scene backgrounds ──────────────────────────────────────────────────────

function SceneVisual({ scene, emoji, color }: { scene: string; emoji: string; color: string }) {
  const stars = (count: number, maxY = 280) =>
    Array.from({ length: count }, (_, i) => (
      <circle
        key={i}
        cx={(Math.random() * 335 + 5).toFixed(1)}
        cy={(Math.random() * maxY + 5).toFixed(1)}
        r={(Math.random() * 0.75 + 0.2).toFixed(1)}
        fill={`rgba(255,255,255,${(Math.random() * 0.38 + 0.08).toFixed(2)})`}
        style={{ animation: `ob-starTwinkle ${(2 + Math.random() * 3).toFixed(1)}s ${(Math.random() * 2).toFixed(1)}s ease-in-out infinite` }}
      />
    ));

  const base: React.CSSProperties = { position: 'absolute', inset: 0 };

  if (scene === 'elder') return (
    <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 35%, rgba(20,10,60,.8), #060912 62%)' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 345 388" width="100%" height="100%">{stars(24, 250)}</svg>
      {/* Warm glow behind Elder */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(246,197,111,.12), rgba(184,161,255,.08) 50%, transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none',
        animation: 'ob-glowPulse 3s ease-in-out infinite',
      }} />
      {/* Elder — larger scale with float animation */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: 'scale(.62) translateY(-10px)', transformOrigin: 'center',
        animation: 'ob-elderFloat 4.4s ease-in-out infinite',
      }}>
        <ElderDreamKeeper scale={1} animate={false} />
      </div>
      {/* Floating particles around Elder */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: `${30 + i * 8}%`, left: `${25 + i * 15}%`,
          width: 4 + (i % 2) * 2, height: 4 + (i % 2) * 2,
          borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(246,197,111,.5)' : 'rgba(184,161,255,.5)',
          boxShadow: `0 0 8px ${i % 2 === 0 ? 'rgba(246,197,111,.4)' : 'rgba(184,161,255,.4)'}`,
          animation: `ob-floatY ${2.5 + i * 0.4}s ${i * 0.3}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );

  if (scene === 'egg') return (
    <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 35%, rgba(40,20,100,.7), #060912 62%)' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 345 388" width="100%" height="100%">{stars(26, 240)}</svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
        <DreamEgg state="gifted" size={80} />
      </div>
    </div>
  );

  if (scene === 'eggcrack') return (
    <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 38%, rgba(40,20,100,.6), #060912 65%)' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 345 388" width="100%" height="100%">{stars(22, 245)}</svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
        <DreamEgg state="cracked" size={80} />
      </div>
      {/* Extra glow for crack scene */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10, pointerEvents: 'none' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.3), transparent 70%)', filter: 'blur(14px)', animation: 'ob-glowPulse 2s .4s ease-in-out infinite' }} />
      </div>
    </div>
  );

  if (scene === 'glow') return (
    <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 30%, rgba(60,30,120,.7), #060912 65%)' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 345 388" width="100%" height="100%">{stars(28, 260)}</svg>
      {/* Elder behind glow */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: 'scale(.55) translateY(-10px)', transformOrigin: 'center',
        animation: 'ob-elderFloat 5s ease-in-out infinite',
      }}>
        <ElderDreamKeeper scale={1} animate={false} />
      </div>
      {/* Glow orb in front */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.45), rgba(184,161,255,.2) 60%, transparent)', filter: 'blur(28px)', animation: 'ob-glowPulse 2s ease-in-out infinite' }} />
      </div>
    </div>
  );

  if (scene === 'dreamlight') return (
    <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 38%, rgba(80,40,10,.5), #060912 68%)' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 345 388" width="100%" height="100%">{stars(20, 240)}</svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,180,1) 0%, rgba(246,197,111,.7) 30%, rgba(246,197,111,.2) 60%, transparent)', filter: 'blur(22px)', animation: 'ob-flicker 2.5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 30, height: 30, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,220,1), rgba(246,197,111,.8) 60%)', boxShadow: '0 0 40px rgba(246,197,111,1), 0 0 80px rgba(246,197,111,.5)', animation: 'ob-flicker 2.5s .3s ease-in-out infinite' }} />
      </div>
    </div>
  );

  // Default: stars
  return (
    <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 30%, rgba(50,25,110,.85), #060912 65%)' }}>
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 345 388" width="100%" height="100%">{stars(32, 280)}</svg>
      {/* Floating orb with flicker */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', animation: 'ob-floatY 3.5s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.22), transparent 70%)', filter: 'blur(20px)', animation: 'ob-flicker 3s ease-in-out infinite' }} />
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,248,220,1), rgba(246,197,111,.9) 40%, rgba(246,197,111,.4) 75%, transparent)', boxShadow: '0 0 24px rgba(246,197,111,.9), 0 0 60px rgba(246,197,111,.45)', animation: 'ob-flicker 3s .5s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  );
}

// ── Pagination dots ────────────────────────────────────────────────────────

function PageDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '8px 0 10px' }}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current;
        const active = i === current;
        return (
          <div key={i} style={{
            width: active ? 16 : 7,
            height: 7,
            borderRadius: 4,
            background: filled ? 'rgba(246,197,111,.55)' : active ? '#F6C56F' : 'rgba(234,242,255,.1)',
            transition: 'all .3s',
            ...(active ? { animation: 'ob-moonPulse 2.5s ease-in-out infinite' } : {}),
          }} />
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function RitualStoryViewer({ pages, title, emoji, color = '#F5B84C', nightNumber, nightLabel, onComplete }: Props) {
  const [page, setPage] = useState(0);
  const isLast = page === pages.length - 1;
  const current = pages[page];
  const scene = current.scene || 'stars';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#020408', overflow: 'hidden',
    }}>
    <div style={{
      width: '100%', maxWidth: 430, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#060912', overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Top: Scene illustration (52%) ── */}
      <div key={`scene-${page}`} style={{ height: '52%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <SceneVisual scene={scene} emoji={emoji} color={color} />
        {/* Gradient fade to text area */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 88, background: 'linear-gradient(to bottom, transparent, #060912)', zIndex: 10 }} />
      </div>

      {/* ── Bottom: Text + pagination + CTA (48%) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px', background: '#060912', position: 'relative' }}>
        <PageDots current={page} total={pages.length} color={color} />

        {/* Story text */}
        <div key={`text-${page}`} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{
            fontFamily: "'Lora', serif", fontStyle: 'italic',
            fontSize: 16.5, color: 'rgba(244,239,232,.96)', lineHeight: 1.75,
            letterSpacing: '.01em',
            animation: 'ob-fadeUp .35s ease both',
          }}>
            {current.text}
          </div>
        </div>

        {/* CTA — always gold */}
        <div style={{ padding: '0 0 26px' }}>
          <button
            className="ob-cta"
            onClick={() => isLast ? onComplete() : setPage(p => p + 1)}
          >
            {isLast ? 'Continue →' : 'Next →'}
          </button>
        </div>
      </div>

      {/* ── Top bar overlay ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '52px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(6,9,18,.78), transparent)',
        zIndex: 30, pointerEvents: 'none',
      }}>
        {/* Back button */}
        {page > 0 && (
          <div
            onClick={() => setPage(p => p - 1)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'all', cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="rgba(234,242,255,.65)" strokeWidth={2.2} strokeLinecap="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </div>
        )}
        {page === 0 && <div style={{ width: 34 }} />}

        {/* Title */}
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 10, fontStyle: 'italic', color: 'rgba(244,239,232,.4)' }}>
          {nightLabel || title}
        </div>

        <div style={{ width: 34 }} />
      </div>

      {/* Night label badge */}
      {nightNumber && (
        <div style={{
          position: 'absolute', top: 52, left: 16, zIndex: 31, pointerEvents: 'none',
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          color: nightNumber === 3 ? 'rgba(255,130,184,.55)' : 'rgba(246,197,111,.55)',
          letterSpacing: '1px',
        }}>
          NIGHT {nightNumber}
        </div>
      )}
    </div>
    </div>
  );
}
