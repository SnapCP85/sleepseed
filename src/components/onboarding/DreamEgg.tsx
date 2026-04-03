import { useMemo } from 'react';
import './onboarding.css';

// ─────────────────────────────────────────────────────────────────────────────
// DreamEgg — Multi-layered egg component matching v9 blueprint exactly
// ─────────────────────────────────────────────────────────────────────────────
// Layers (outside → in):
//   1. Outer blur glow (animated pulse)
//   2. Shell border (1px white, rounded)
//   3. Inner border ring (6px inset, gradient top)
//   4. Core gradient fill (cream → gold → purple → deep blue)
//   5. Specular highlight (30% 24%)
//   6. Teal/blue accent (55% 70%)
//   7. Center blur bloom (pulsing)
//   8. Floating particles (gold + purple, lift animation)
//   9. Crack SVG paths (draw-on + glow animations)
//  10. Inner light burst (cracked/hatching states)
// ─────────────────────────────────────────────────────────────────────────────

export type EggState = 'idle' | 'gifted' | 'listening' | 'cracked' | 'hatching' | 'hatched';
type EggSize = 'sm' | 'full' | number;

// Box shadow glow intensity per state — matches v9 blueprint
const GLOW: Record<EggState, string> = {
  idle:      '0 0 40px rgba(246,197,111,.22), 0 0 90px rgba(184,161,255,.14)',
  gifted:    '0 0 55px rgba(246,197,111,.32), 0 0 110px rgba(184,161,255,.18)',
  listening: '0 0 62px rgba(246,197,111,.40), 0 0 130px rgba(111,231,221,.2)',
  cracked:   '0 0 80px rgba(246,197,111,.52), 0 0 160px rgba(184,161,255,.28)',
  hatching:  '0 0 80px rgba(246,197,111,.58), 0 0 160px rgba(184,161,255,.3)',
  hatched:   '0 0 40px rgba(246,197,111,.22), 0 0 90px rgba(184,161,255,.14)',
};

interface Props {
  state: EggState;
  size?: EggSize;
  interactive?: boolean;
  onClick?: () => void;
}

export default function DreamEgg({ state, size = 'full', interactive, onClick }: Props) {
  const w = typeof size === 'number' ? size : size === 'sm' ? 120 : 182;
  const h = Math.round(w * 1.22);
  const dur = (state === 'listening' || state === 'cracked' || state === 'hatching') ? 3 : 3.8;
  const showParticles = state === 'listening' || state === 'cracked' || state === 'hatching';
  const showCracks = state === 'cracked' || state === 'hatching';
  const showCrack2 = state === 'hatching';

  const particles = useMemo(() =>
    showParticles ? [0, 1, 2, 3, 4, 5].map(i => ({
      key: i,
      bg: i % 2 === 0 ? '#F6C56F' : '#B8A1FF',
      shadow: i % 2 === 0 ? 'rgba(246,197,111,.6)' : 'rgba(184,161,255,.6)',
      left: `${20 + i * 11}%`,
      top: `${18 + (i * 13) % 42}%`,
      dur: `${(state === 'hatching' ? 1.6 : 1.8) + i * 0.08}s`,
      del: `${i * 0.16}s`,
    })) : [],
    [showParticles, state]
  );

  // Float animation — hatching adds hatch pulse
  const floatAnim = state === 'hatching'
    ? `ob-hatchHeartbeat 1.6s ease-in-out infinite`
    : `ob-floatRot ${dur}s ease-in-out infinite`;

  // Outer glow pulse speed
  const outerGlowDur = (state === 'listening' || state === 'cracked' || state === 'hatching') ? 2 : 3;

  // Core gradient — richer for cracked/hatching states
  const innerBg = (state === 'cracked' || state === 'hatching')
    ? 'radial-gradient(circle at 35% 28%, rgba(255,243,214,1) 0%, rgba(246,197,111,.85) 18%, rgba(184,161,255,.55) 38%, rgba(17,23,53,.96) 72%)'
    : 'radial-gradient(circle at 35% 28%, rgba(255,243,214,.9) 0%, rgba(246,197,111,.7) 15%, rgba(184,161,255,.42) 34%, rgba(17,23,53,.96) 72%)';

  const coreBg = (state === 'cracked' || state === 'hatching')
    ? 'radial-gradient(circle, rgba(246,197,111,.88) 0%, rgba(184,161,255,.4) 45%, transparent 74%)'
    : 'radial-gradient(circle, rgba(246,197,111,.58) 0%, rgba(111,231,221,.18) 45%, transparent 74%)';

  const innerGlowDur = (state === 'listening' || state === 'cracked') ? 2.2 : state === 'hatching' ? 2 : 2.8;
  const coreGlowDur = (state === 'listening' || state === 'cracked' || state === 'hatching') ? 2 : 2.2;

  // Crack paths (size-dependent) — from v9 blueprint
  const crack1Main = w <= 130
    ? 'M62 25 C60 45,70 56,62 68 C55 78,66 88,58 102 C52 112,58 124,52 135'
    : 'M95 38 C92 60,106 74,96 88 C87 100,102 113,91 127 C82 139,97 152,87 167 C80 179,88 194,81 209';
  const crack1A = w <= 130
    ? 'M57 66 C49 72,48 80,41 84'
    : 'M84 96 C74 103,73 113,63 118';
  const crack1B = w <= 130
    ? 'M59 88 C68 94,72 102,76 110'
    : 'M88 131 C100 139,108 150,114 160';

  // Night 3 second crack — from v9 blueprint dreamEggCracked2
  const crack2Main = w <= 130
    ? 'M78 40 C88 55,82 68,90 80 C98 92,88 105,94 120'
    : 'M118 55 C132 74,124 90,136 108 C148 124,134 140,142 162';
  const crack2A = w <= 130
    ? 'M90 80 C98 86,102 94,106 100'
    : 'M136 108 C148 116,154 128,160 138';

  // Inner light burst size
  const burstW = w <= 130 ? 48 : 64;
  const burstH = w <= 130 ? 42 : 56;
  const burstBlur = w <= 130 ? 16 : 22;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      style={{
        position: 'relative', width: w, height: h, margin: '0 auto',
        animation: floatAnim,
        boxShadow: GLOW[state], borderRadius: 999,
        cursor: interactive ? 'pointer' : undefined,
      }}
    >
      {/* Layer 1: Outer blur glow */}
      <div style={{
        position: 'absolute', inset: -22, borderRadius: 999,
        background: 'radial-gradient(circle at 50%, rgba(246,197,111,.28) 0%, rgba(184,161,255,.16) 38%, transparent 72%)',
        filter: 'blur(24px)',
        animation: `ob-glowPulse ${outerGlowDur}s ease-in-out infinite`,
        pointerEvents: 'none',
      }} />

      {/* Layer 2: Shell border */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>

        {/* Layer 3: Inner border ring */}
        <div style={{
          position: 'absolute', inset: 6, borderRadius: 999,
          border: '1px solid rgba(255,255,255,.09)',
          background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.01))',
        }} />

        {/* Layer 4: Core gradient fill */}
        <div style={{
          position: 'absolute', inset: 10, borderRadius: 999, background: innerBg,
          animation: `ob-glowPulse ${innerGlowDur}s ease-in-out infinite`,
        }}>
          {/* Layer 5: Specular highlight */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 999,
            background: 'radial-gradient(circle at 30% 24%, rgba(255,255,255,.38), transparent 28%)',
          }} />
          {/* Layer 6: Teal/cool accent */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 999,
            background: 'radial-gradient(circle at 55% 70%, rgba(111,231,221,.16), transparent 32%)',
          }} />
        </div>

        {/* Layer 7: Center blur bloom */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: w <= 130 ? 84 : 120, height: w <= 130 ? 84 : 120,
          borderRadius: '50%', background: coreBg, filter: 'blur(20px)',
          animation: `ob-glowPulseF ${coreGlowDur}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />

        {/* Layer 8: Floating particles */}
        {particles.map(p => (
          <div key={p.key} style={{
            position: 'absolute', width: 7, height: 7, borderRadius: '50%',
            background: p.bg, left: p.left, top: p.top,
            boxShadow: `0 0 10px ${p.shadow}`,
            animation: `ob-particleLift ${p.dur} ${p.del} ease-out infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Layer 9: Crack SVGs */}
        {showCracks && (
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox={`0 0 ${w} ${h}`}>
            {/* Primary crack (Night 2+) */}
            <path d={crack1Main} fill="none" stroke="rgba(255,223,163,.96)"
              strokeWidth={w <= 130 ? 2 : 2.8} strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(246,197,111,.8))',
                strokeDasharray: 320,
                animation: 'ob-crackDraw .7s .1s ease both, ob-crackGlow 2.2s .8s ease-in-out infinite',
              }}
            />
            <path d={crack1A} fill="none" stroke="rgba(255,223,163,.88)"
              strokeWidth={w <= 130 ? 1.5 : 2} strokeLinecap="round"
              style={{ strokeDasharray: 80, animation: 'ob-crackDraw .5s .2s ease both' }}
            />
            <path d={crack1B} fill="none" stroke="rgba(255,223,163,.8)"
              strokeWidth={w <= 130 ? 1.5 : 2} strokeLinecap="round"
              style={{ strokeDasharray: 80, animation: 'ob-crackDraw .5s .35s ease both' }}
            />

            {/* Second crack (Night 3 / hatching) */}
            {showCrack2 && (
              <>
                <path d={crack2Main} fill="none" stroke="rgba(255,230,150,.88)"
                  strokeWidth={w <= 130 ? 1.8 : 2.4} strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(246,197,111,.7))',
                    strokeDasharray: 200,
                    animation: 'ob-crack2Appear .8s .3s ease both, ob-crackGlow 2s 1.1s ease-in-out infinite',
                  }}
                />
                <path d={crack2A} fill="none" stroke="rgba(255,220,140,.75)"
                  strokeWidth={w <= 130 ? 1.3 : 1.8} strokeLinecap="round"
                  style={{ strokeDasharray: 80, animation: 'ob-crack2Appear .6s .7s ease both' }}
                />
              </>
            )}
          </svg>
        )}

        {/* Layer 10: Inner light burst (cracked/hatching) */}
        {showCracks && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-58%)',
            width: burstW, height: burstH, borderRadius: '50%',
            background: state === 'hatching' ? 'rgba(255,243,214,.7)' : 'rgba(255,243,214,.55)',
            filter: `blur(${burstBlur}px)`,
            animation: `ob-glowPulseF ${state === 'hatching' ? 1.2 : 1.8}s ease-in-out infinite`,
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  );
}
