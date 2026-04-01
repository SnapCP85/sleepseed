import { useMemo } from 'react';

type EggState = 'idle' | 'gifted' | 'listening' | 'cracked';
type EggSize = 'sm' | 'full';

const GLOW: Record<EggState, string> = {
  idle: '0 0 40px rgba(246,197,111,.22), 0 0 90px rgba(184,161,255,.14)',
  gifted: '0 0 55px rgba(246,197,111,.32), 0 0 110px rgba(184,161,255,.18)',
  listening: '0 0 62px rgba(246,197,111,.40), 0 0 130px rgba(111,231,221,.2)',
  cracked: '0 0 80px rgba(246,197,111,.52), 0 0 160px rgba(184,161,255,.28)',
};

interface Props {
  state: EggState;
  size?: EggSize;
  interactive?: boolean;
  onClick?: () => void;
}

export default function DreamEgg({ state, size = 'full', interactive, onClick }: Props) {
  const w = size === 'sm' ? 120 : 182;
  const h = size === 'sm' ? 146 : 222;
  const dur = state === 'listening' ? 3 : 3.8;
  const showParticles = state === 'listening' || state === 'cracked';

  const particles = useMemo(() =>
    showParticles ? [0, 1, 2, 3, 4, 5].map(i => ({
      key: i,
      bg: i % 2 === 0 ? '#F6C56F' : '#B8A1FF',
      left: `${20 + i * 11}%`,
      top: `${18 + (i * 13) % 42}%`,
      dur: `${1.8 + i * 0.08}s`,
      del: `${i * 0.16}s`,
    })) : [],
    [showParticles]
  );

  const innerBg = state === 'cracked'
    ? 'radial-gradient(circle at 35% 28%, rgba(255,243,214,1) 0%, rgba(246,197,111,.85) 18%, rgba(184,161,255,.55) 38%, rgba(17,23,53,.96) 72%)'
    : 'radial-gradient(circle at 35% 28%, rgba(255,243,214,.9) 0%, rgba(246,197,111,.7) 15%, rgba(184,161,255,.42) 34%, rgba(17,23,53,.96) 72%)';

  const coreBg = state === 'cracked'
    ? 'radial-gradient(circle, rgba(246,197,111,.88) 0%, rgba(184,161,255,.4) 45%, transparent 74%)'
    : 'radial-gradient(circle, rgba(246,197,111,.58) 0%, rgba(111,231,221,.18) 45%, transparent 74%)';

  // Crack paths for sm / full
  const crackMain = size === 'sm'
    ? 'M62 25 C60 45,70 56,62 68 C55 78,66 88,58 102 C52 112,58 124,52 135'
    : 'M95 38 C92 60,106 74,96 88 C87 100,102 113,91 127 C82 139,97 152,87 167 C80 179,88 194,81 209';
  const crackA = size === 'sm'
    ? 'M57 66 C49 72,48 80,41 84'
    : 'M84 96 C74 103,73 113,63 118';
  const crackB = size === 'sm'
    ? 'M59 88 C68 94,72 102,76 110'
    : 'M88 131 C100 139,108 150,114 160';

  return (
    <div
      onClick={interactive ? onClick : undefined}
      style={{
        position: 'relative', width: w, height: h, margin: '0 auto',
        animation: `ob-floatRot ${dur}s ease-in-out infinite`,
        boxShadow: GLOW[state], borderRadius: 999,
        cursor: interactive ? 'pointer' : undefined,
      }}
    >
      {/* Outer glow */}
      <div style={{
        position: 'absolute', inset: -22, borderRadius: 999,
        background: 'radial-gradient(circle at 50%, rgba(246,197,111,.28) 0%, rgba(184,161,255,.16) 38%, transparent 72%)',
        filter: 'blur(24px)',
        animation: `ob-glowPulse ${state === 'listening' || state === 'cracked' ? 2 : 3}s ease-in-out infinite`,
        pointerEvents: 'none',
      }} />
      {/* Shell */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
        {/* Inner ring */}
        <div style={{ position: 'absolute', inset: 6, borderRadius: 999, border: '1px solid rgba(255,255,255,.09)', background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.01))' }} />
        {/* Gradient fill */}
        <div style={{
          position: 'absolute', inset: 10, borderRadius: 999, background: innerBg,
          animation: `ob-glowPulse ${state === 'listening' ? 2.2 : 2.8}s ease-in-out infinite`,
        }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'radial-gradient(circle at 30% 24%, rgba(255,255,255,.38), transparent 28%)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'radial-gradient(circle at 55% 70%, rgba(111,231,221,.16), transparent 32%)' }} />
        </div>
        {/* Core glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: size === 'sm' ? 84 : 120, height: size === 'sm' ? 84 : 120,
          borderRadius: '50%', background: coreBg, filter: 'blur(20px)',
          animation: `ob-glowPulseF ${state === 'listening' || state === 'cracked' ? 2 : 2.2}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
        {/* Particles */}
        {particles.map(p => (
          <div key={p.key} style={{
            position: 'absolute', width: 7, height: 7, borderRadius: '50%',
            background: p.bg, left: p.left, top: p.top,
            boxShadow: '0 0 10px rgba(246,197,111,.6)',
            animation: `ob-particleLift ${p.dur} ${p.del} ease-out infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        {/* Crack SVG */}
        {state === 'cracked' && (
          <>
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox={`0 0 ${w} ${h}`}>
              <path d={crackMain} fill="none" stroke="rgba(255,223,163,.96)" strokeWidth={size === 'sm' ? 2 : 2.8} strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 12px rgba(246,197,111,.8))', strokeDasharray: 320, animation: 'ob-crackDraw .7s .1s ease both, ob-crackGlow 2.2s .8s ease-in-out infinite' }} />
              <path d={crackA} fill="none" stroke="rgba(255,223,163,.88)" strokeWidth={size === 'sm' ? 1.5 : 2} strokeLinecap="round"
                style={{ strokeDasharray: 80, animation: 'ob-crackDraw .5s .2s ease both' }} />
              <path d={crackB} fill="none" stroke="rgba(255,223,163,.8)" strokeWidth={size === 'sm' ? 1.5 : 2} strokeLinecap="round"
                style={{ strokeDasharray: 80, animation: 'ob-crackDraw .5s .35s ease both' }} />
            </svg>
            {/* Inner light burst */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-58%)',
              width: size === 'sm' ? 42 : 56, height: size === 'sm' ? 36 : 48,
              borderRadius: '50%', background: 'rgba(255,243,214,.55)',
              filter: `blur(${size === 'sm' ? 14 : 20}px)`,
              animation: 'ob-glowPulseF 1.8s ease-in-out infinite', pointerEvents: 'none',
            }} />
          </>
        )}
      </div>
    </div>
  );
}
