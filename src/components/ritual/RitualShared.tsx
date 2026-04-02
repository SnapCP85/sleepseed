import { useState } from 'react';
import type { EggVisualState } from '../../lib/ritualState';

// ─────────────────────────────────────────────────────────────────────────────
// Shared ritual components — used across all 3 nights
// ─────────────────────────────────────────────────────────────────────────────

// ── CSS (injected once per night screen) ────────────────────────────────────

export const RITUAL_CSS = `
@keyframes or-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes or-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes or-breathe{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes or-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes or-twinkle{0%,100%{opacity:.05}50%{opacity:.35}}
@keyframes or-glow{0%,100%{filter:drop-shadow(0 0 20px var(--or-glow,rgba(245,184,76,.3)))}50%{filter:drop-shadow(0 0 44px var(--or-glow,rgba(245,184,76,.6)))}}
@keyframes or-crackGlow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes or-hatchPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes or-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes or-particleLift{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(-40px)}}
@keyframes or-slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes or-glowPulse{0%,100%{opacity:.3}50%{opacity:.6}}

.or{position:fixed;inset:0;z-index:1000;background:#060912;font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;overflow-y:auto;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.or-inner{width:100%;max-width:430px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;position:relative;padding:0 24px}
.or-screen{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;z-index:5;padding:32px 0 48px;animation:or-fadeUp .6s ease-out}
.or-star{position:fixed;border-radius:50%;background:#EEE8FF;pointer-events:none;z-index:0}
.or-back{position:absolute;top:20px;left:20px;background:none;border:none;color:rgba(244,239,232,.35);font-size:18px;cursor:pointer;padding:8px;z-index:10;transition:color .15s;font-family:'Nunito',system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.or-back:hover{color:rgba(244,239,232,.6)}
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

export function Thread({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
      fontSize: 14, color: 'rgba(244,239,232,.45)', lineHeight: 1.7,
      maxWidth: 280, marginBottom: 24,
    }}>
      "{text}"
    </div>
  );
}

// ── Egg display ─────────────────────────────────────────────────────────────

export function EggDisplay({ state, size = 120, color = '#F5B84C' }: {
  state: EggVisualState; size?: number; color?: string;
}) {
  const glowIntensity = state === 'idle' ? .22 : state === 'cracked' ? .45 : .6;
  const animation = state === 'hatching'
    ? 'or-hatchPulse 1.6s ease-in-out infinite, or-float 3s ease-in-out infinite'
    : 'or-float 3.8s ease-in-out infinite';

  return (
    <div style={{
      width: size, height: size * 1.22,
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation,
      '--or-glow': hexToRgba(color, .4),
    } as React.CSSProperties}>
      {/* Glow backdrop */}
      <div style={{
        position: 'absolute', inset: -20, borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(color, glowIntensity)} 0%, transparent 70%)`,
        animation: 'or-glowPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Egg SVG */}
      <svg width={size} height={size * 1.22} viewBox="0 0 100 122" fill="none" style={{ position: 'relative', zIndex: 2 }}>
        <defs>
          <radialGradient id={`eggFill-${state}`} cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor={hexToRgba(color, .9)} />
            <stop offset="60%" stopColor={hexToRgba(color, .5)} />
            <stop offset="100%" stopColor={hexToRgba(color, .2)} />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="66" rx="38" ry="50"
          fill={`url(#eggFill-${state})`} stroke={hexToRgba(color, .3)} strokeWidth="1"
        />
        <ellipse cx="50" cy="58" rx="22" ry="28"
          fill={hexToRgba(color, state === 'idle' ? .15 : .3)}
          style={{ filter: 'blur(8px)' }}
        />
        {/* Crack — Night 2+ */}
        {(state === 'cracked' || state === 'hatching') && (
          <path d="M50 20 L48 35 L53 48 L47 58 L52 68"
            stroke={hexToRgba(color, .9)} strokeWidth="2" fill="none" strokeLinecap="round"
            style={{ animation: 'or-crackGlow 2.2s ease-in-out infinite' }}
          />
        )}
        {/* Second crack — Night 3 */}
        {state === 'hatching' && (
          <path d="M68 40 L60 50 L65 62 L58 72"
            stroke={hexToRgba(color, .85)} strokeWidth="1.8" fill="none" strokeLinecap="round"
            style={{ animation: 'or-crackGlow 1.6s .3s ease-in-out infinite' }}
          />
        )}
      </svg>

      {/* Particles */}
      {(state === 'cracked' || state === 'hatching') && (
        <>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              position: 'absolute', width: 4, height: 4, borderRadius: '50%',
              background: i % 2 === 0 ? color : '#B8A1FF',
              boxShadow: `0 0 6px ${i % 2 === 0 ? color : '#B8A1FF'}`,
              left: `${30 + (i * 8)}%`, bottom: `${40 + (i * 5)}%`,
              animation: `or-particleLift ${1.8 + i * 0.08}s ${i * 0.15}s ease-in-out infinite`,
              opacity: state === 'hatching' ? .8 : .5,
              pointerEvents: 'none',
            }} />
          ))}
        </>
      )}
    </div>
  );
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
        <div key={i} className="or-star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s,
          animation: `or-twinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── CTA button ──────────────────────────────────────────────────────────────

export function RitualCTA({ label, subtitle, onClick, variant = 'gold', disabled }: {
  label: string; subtitle?: string; onClick: () => void;
  variant?: 'gold' | 'pink'; disabled?: boolean;
}) {
  const bg = variant === 'pink'
    ? 'linear-gradient(135deg,#b04080,#ff82b8 50%,#b04080)'
    : 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)';

  return (
    <div style={{ width: '100%', maxWidth: 300 }}>
      <button
        onClick={disabled ? undefined : onClick}
        style={{
          width: '100%', padding: '17px 24px', border: 'none', borderRadius: 14,
          background: disabled ? 'rgba(255,255,255,.06)' : bg,
          color: disabled ? 'rgba(244,239,232,.25)' : '#080200',
          fontSize: 16, fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: "'Nunito',system-ui,sans-serif",
          boxShadow: disabled ? 'none' : '0 6px 24px rgba(200,130,20,.3)',
          transition: 'transform .15s, filter .15s',
          position: 'relative', overflow: 'hidden',
          opacity: disabled ? .5 : 1,
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
      >
        {label}
        {!disabled && (
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)',
            backgroundSize: '200% 100%', animation: 'or-shimmer 3.5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>
      {subtitle && (
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 10,
          color: 'rgba(244,239,232,.3)', textAlign: 'center',
          marginTop: 8, letterSpacing: '.03em',
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
      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 16, padding: '18px 22px', maxWidth: 310, width: '100%',
      position: 'relative', marginBottom: 12,
    }}>
      <div style={{
        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
        borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
        borderBottom: '8px solid rgba(255,255,255,.08)',
      }} />
      {speaker && (
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 9, color: color || 'rgba(244,239,232,.3)',
          letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8,
        }}>{speaker}</div>
      )}
      <div style={{
        fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
        fontSize: 15, color: 'rgba(244,239,232,.7)', lineHeight: 1.7,
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
      width: '100%', maxWidth: 300, marginBottom: 28,
    }}>
      {options.map((opt, i) => {
        const sel = selected === opt.label;
        return (
          <div key={opt.label} role="button" tabIndex={0}
            onClick={() => onSelect(opt.label)}
            style={{
              padding: '16px 8px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${sel ? color : 'rgba(255,255,255,.06)'}`,
              background: sel ? hexToRgba(color, .1) : 'rgba(255,255,255,.02)',
              transition: 'all .2s cubic-bezier(.16,1,.3,1)',
              animation: `or-fadeUp .35s ${i * .04}s ease-out both`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 4 }}>{opt.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: sel ? color : 'rgba(244,239,232,.4)' }}>
              {opt.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mini night card (shown at end of each night) ────────────────────────────

export function MiniNightCard({ title, quote, emoji, nightNumber, color }: {
  title: string; quote: string; emoji: string; nightNumber: number; color?: string;
}) {
  return (
    <div style={{
      width: 240, margin: '0 auto', borderRadius: 16, overflow: 'hidden',
      background: '#faf6ee', boxShadow: '0 16px 48px rgba(0,0,0,.5)',
      animation: 'or-slideUp .6s ease-out',
    }}>
      {/* Sky */}
      <div style={{
        height: 100, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(to bottom, #0d1428, #1a1040)',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontSize: 36, animation: 'or-float 4s ease-in-out infinite',
        }}>{emoji}</div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(transparent, #faf6ee)',
        }} />
      </div>
      {/* Paper */}
      <div style={{ padding: '10px 16px 16px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(60,40,20,.35)',
          letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          Night {nightNumber} · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
        <div style={{
          fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 600,
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
