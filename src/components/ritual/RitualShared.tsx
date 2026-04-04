import { useState } from 'react';
import type { EggVisualState } from '../../lib/ritualState';
import DreamEgg from '../onboarding/DreamEgg';
import type { EggState } from '../onboarding/DreamEgg';
import '../onboarding/onboarding.css';

// ─────────────────────────────────────────────────────────────────────────────
// Shared ritual components — used across all 3 nights
// Now unified with the ob-* CSS system from onboarding.css
// ─────────────────────────────────────────────────────────────────────────────

// RITUAL_CSS is kept for backward compatibility but now only contains
// aliases that map or-* names to ob-* keyframes. This allows existing
// ritual screens to work while we migrate class references.
export const RITUAL_CSS = `
/* or-* → ob-* animation aliases for backward compatibility */
@keyframes or-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes or-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes or-breathe{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes or-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes or-twinkle{0%,100%{opacity:.05}50%{opacity:.35}}
@keyframes or-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes or-slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes or-glowPulse{0%,100%{opacity:.3}50%{opacity:.6}}
`;

// ── Hex to RGBA helper ──────────────────────────────────────────────────────

export function hexToRgba(hex: string, a: number): string {
  if (!hex || hex.length < 7) return `rgba(245,184,76,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(245,184,76,${a})`;
  return `rgba(${r},${g},${b},${a})`;
}

// ── Moon progress ───────────────────────────────────────────────────────────

export function MoonProgress({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current;
        const active = i === current;
        return (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: filled ? '#F5B84C' : active ? 'rgba(245,184,76,.5)' : 'rgba(255,255,255,.1)',
            border: filled || active ? '1.5px solid rgba(245,184,76,.6)' : '1.5px solid rgba(255,255,255,.08)',
            boxShadow: filled ? '0 0 8px rgba(245,184,76,.4)' : 'none',
            transition: 'all .3s',
          }} />
        );
      })}
    </div>
  );
}

// ── Night label ─────────────────────────────────────────────────────────────

export function NightLabel({ night, color }: { night: number; color?: string }) {
  return (
    <div style={{
      fontFamily: "'DM Mono',monospace", fontSize: 10,
      color: color || 'rgba(244,239,232,.35)',
      letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 20,
    }}>
      Night {night}
    </div>
  );
}

// ── Thread (italic narrative text) ──────────────────────────────────────────

export function Thread({ text, color }: { text: string; color?: string }) {
  return (
    <div style={{
      fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
      fontSize: 14, color: color || 'rgba(244,239,232,.45)', lineHeight: 1.7,
      maxWidth: 280, marginBottom: 24,
    }}>
      "{text}"
    </div>
  );
}

// ── Egg display (delegates to DreamEgg) ─────────────────────────────────────

export function EggDisplay({ state, size = 120 }: {
  state: EggVisualState | EggState; size?: number; color?: string;
}) {
  const eggState: EggState = state === 'hatched' ? 'idle' : state as EggState;
  return <DreamEgg state={eggState} size={size} />;
  // Note: DreamEgg uses fixed gold palette from v9 blueprint — color prop intentionally not passed
}

// ── Stars field ─────────────────────────────────────────────────────────────

export function StarField() {
  const [stars] = useState(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      s: 1 + Math.random() * 0.8, d: 2.5 + Math.random() * 3, dl: Math.random() * 4,
    }))
  );
  return (
    <>
      {stars.map((s, i) => (
        <div key={i} className="ob-ritual-star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s,
          animation: `ob-starTwinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── CTA button — unified with ob-cta styling ───────────────────────────────

export function RitualCTA({ label, subtitle, onClick, variant = 'gold', disabled }: {
  label: string; subtitle?: string; onClick: () => void;
  variant?: 'gold' | 'pink'; disabled?: boolean;
}) {
  const bg = variant === 'pink'
    ? 'linear-gradient(135deg, rgba(246,197,111,.9), rgba(255,130,184,.7))'
    : 'linear-gradient(135deg, #F6C56F, #FFDFA3)';

  return (
    <div style={{ width: '100%', maxWidth: 300 }}>
      <button
        onClick={disabled ? undefined : onClick}
        style={{
          position: 'relative',
          width: '100%', padding: '17px 20px', border: 'none', borderRadius: 18,
          background: disabled ? 'rgba(255,255,255,.06)' : bg,
          color: disabled ? 'rgba(244,239,232,.25)' : variant === 'pink' ? '#1a0818' : '#16110A',
          fontSize: 15, fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: "'Fraunces', serif",
          boxShadow: disabled ? 'none' : variant === 'pink'
            ? '0 8px 32px rgba(255,130,184,.25)'
            : '0 8px 32px rgba(246,197,111,.3)',
          letterSpacing: '-0.1px',
          overflow: 'hidden',
          opacity: disabled ? .5 : 1,
          marginBottom: 10,
          transition: 'transform .15s, filter .15s',
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
      >
        {label}
        {!disabled && (
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,.24) 50%, transparent 70%)',
            animation: 'ob-shimmer 5s infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>
      {subtitle && (
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 10,
          color: 'rgba(244,239,232,.3)', textAlign: 'center',
          marginTop: -2, letterSpacing: '.03em',
        }}>{subtitle}</div>
      )}
    </div>
  );
}

// ── Speech bubble ───────────────────────────────────────────────────────────

export function SpeechBubble({ speaker, text, color }: {
  speaker?: string; text: string; color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(184,161,255,.1)', border: '1px solid rgba(184,161,255,.25)',
      borderRadius: '20px 20px 20px 5px', padding: '18px 20px', maxWidth: 310, width: '100%',
      position: 'relative', marginBottom: 12, textAlign: 'left',
    }}>
      {speaker && (
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: color || 'rgba(184,161,255,.6)',
          letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8,
        }}>{speaker}</div>
      )}
      <div style={{
        fontFamily: "'Fraunces', serif", fontWeight: 700,
        fontSize: 15, color: '#F4EFE8', lineHeight: 1.52, letterSpacing: '-0.1px',
      }}>{text}</div>
    </div>
  );
}

// ── Chip grid (for question selection) ──────────────────────────────────────

export function ChipGrid({ options, selected, onSelect, color = '#F5B84C' }: {
  options: { emoji: string; label: string }[];
  selected: string;
  onSelect: (label: string) => void;
  color?: string;
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
      width: '100%', maxWidth: 310, marginBottom: 22,
    }}>
      {options.map((opt, i) => {
        const sel = selected === opt.label;
        return (
          <div key={opt.label} role="button" tabIndex={0}
            onClick={() => onSelect(opt.label)}
            style={{
              padding: '18px 8px 14px', borderRadius: 20, cursor: 'pointer', textAlign: 'center',
              border: `1.5px solid ${sel ? 'rgba(246,197,111,.5)' : 'rgba(184,161,255,.12)'}`,
              background: sel
                ? 'linear-gradient(145deg, rgba(246,197,111,.14), rgba(184,161,255,.08))'
                : 'linear-gradient(145deg, rgba(184,161,255,.06), rgba(6,9,18,.9))',
              boxShadow: sel
                ? '0 4px 20px rgba(246,197,111,.15), inset 0 1px 0 rgba(255,255,255,.08)'
                : 'inset 0 1px 0 rgba(255,255,255,.04)',
              transition: 'all .25s cubic-bezier(.16,1,.3,1)',
              transform: sel ? 'scale(1.04)' : 'scale(1)',
              animation: `ob-fadeUp .35s ${i * .05}s ease-out both`,
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow ring on selected */}
            {sel && <div style={{
              position: 'absolute', inset: -1, borderRadius: 20,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(246,197,111,.12), transparent 70%)',
              pointerEvents: 'none',
            }} />}
            <div style={{
              fontSize: 32, marginBottom: 6, lineHeight: 1,
              filter: sel ? 'drop-shadow(0 0 8px rgba(246,197,111,.4))' : 'none',
              transition: 'filter .25s',
            }}>{opt.emoji}</div>
            <div style={{
              fontSize: 11.5, fontWeight: 700, fontFamily: "'Fraunces', serif",
              color: sel ? 'rgba(246,197,111,.95)' : 'rgba(234,242,255,.5)',
              letterSpacing: '-0.1px', lineHeight: 1.25,
              transition: 'color .25s',
            }}>
              {opt.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mini night card (shown at end of each night) ────────────────────────────

export function MiniNightCard({ title, quote, emoji, nightNumber, color, creatureImageSrc }: {
  title: string; quote: string; emoji: string; nightNumber: number; color?: string; creatureImageSrc?: string;
}) {
  return (
    <div style={{
      width: 244, margin: '0 auto', borderRadius: 18, overflow: 'hidden',
      background: '#f8f4ee', boxShadow: '0 20px 52px rgba(0,0,0,.58)',
      animation: 'ob-slideUp .6s ease-out',
    }}>
      {/* Sky — starfield with DreamEgg */}
      <div style={{
        height: 130, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(165deg, rgba(13,20,40,1) 0%, rgba(26,16,64,.95) 50%, rgba(40,20,80,.8) 100%)',
      }}>
        {/* Tiny stars */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${8 + (i * 29) % 84}%`, top: `${6 + (i * 17) % 60}%`,
            width: 1.5, height: 1.5, borderRadius: '50%', background: 'white',
            opacity: 0.15 + (i % 3) * 0.1,
            animation: `ob-starTwinkle ${2 + i * 0.3}s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
        {/* Centered visual — creature image if provided, otherwise egg */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          animation: 'ob-floatY 4s ease-in-out infinite',
        }}>
          {creatureImageSrc ? (
            <img src={creatureImageSrc} alt="DreamKeeper" style={{
              width: 68, height: 68, objectFit: 'contain',
              filter: 'drop-shadow(0 0 16px rgba(246,197,111,.6)) brightness(1.1)',
            }} />
          ) : (
            <DreamEgg state={nightNumber >= 2 ? 'cracked' : 'idle'} size={48} />
          )}
        </div>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246,197,111,.15), transparent 70%)',
          filter: 'blur(12px)', pointerEvents: 'none',
        }} />
        {/* Fade to paper */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(transparent, #f8f4ee)',
        }} />
        {/* Night badge */}
        <div style={{
          position: 'absolute', top: 8, left: 10,
          padding: '3px 8px', background: 'rgba(246,197,111,.15)',
          border: '1px solid rgba(246,197,111,.3)', borderRadius: 20,
        }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, fontWeight: 600, color: 'rgba(246,197,111,.85)' }}>
            NIGHT {nightNumber}
          </span>
        </div>
      </div>
      {/* Paper */}
      <div style={{ padding: '10px 16px 16px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(60,40,20,.35)',
          letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700,
          color: '#1a0f08', lineHeight: 1.3, marginBottom: 6,
        }}>{title}</div>
        <div style={{
          fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
          fontSize: 10, color: 'rgba(60,40,20,.45)', lineHeight: 1.5,
        }}>"{quote}"</div>
      </div>
    </div>
  );
}
