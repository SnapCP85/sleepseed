import { useState, useEffect, useMemo } from 'react';
import type { DreamKeeper } from '../lib/dreamkeepers';

// ─────────────────────────────────────────────────────────────────────────────
// DreamKeeperReveal — The ~8.5s reveal sequence
// ─────────────────────────────────────────────────────────────────────────────
// Shows:
//   Phase 1 (0-2s):   Dark field, tiny spark, ambient stars
//   Phase 2 (2-4.5s): Primary creature emerges from blur
//   Phase 3 (4.5-6s): Two alternates appear dimly at sides
//   Phase 4 (6-8.5s): Text appears — "This one feels right for you, {name}…"
//   Phase 5 (8.5s+):  onRevealComplete fires
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  primary: DreamKeeper;
  alternates: [DreamKeeper, DreamKeeper];
  childName: string;
  onRevealComplete: () => void;
}

const REVEAL_CSS = `
@keyframes dkr-spark{0%{opacity:0;transform:scale(0)}30%{opacity:1;transform:scale(1.2)}60%{opacity:.7;transform:scale(.9)}100%{opacity:0;transform:scale(2)}}
@keyframes dkr-emerge{0%{opacity:0;filter:blur(24px);transform:scale(.7)}60%{opacity:.8;filter:blur(6px);transform:scale(1.02)}100%{opacity:1;filter:blur(0);transform:scale(1)}}
@keyframes dkr-altIn{0%{opacity:0;filter:blur(16px);transform:scale(.6)}100%{opacity:.35;filter:blur(3px);transform:scale(.85)}}
@keyframes dkr-textIn{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
@keyframes dkr-glow{0%,100%{box-shadow:0 0 40px rgba(var(--dk-rgb),.15)}50%{box-shadow:0 0 80px rgba(var(--dk-rgb),.35)}}
@keyframes dkr-starTwinkle{0%,100%{opacity:.08}50%{opacity:.45}}
`;

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function DreamKeeperReveal({ primary, alternates, childName, onRevealComplete }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);    // spark
    const t2 = setTimeout(() => setPhase(2), 2000);   // primary emerges
    const t3 = setTimeout(() => setPhase(3), 4500);   // alternates
    const t4 = setTimeout(() => setPhase(4), 6000);   // text
    const t5 = setTimeout(() => onRevealComplete(), 8500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onRevealComplete]);

  const rgb = hexToRgb(primary.color);

  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 60; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 100,
      s: 1 + Math.random(), d: 2.5 + Math.random() * 3, dl: Math.random() * 4,
    });
    return arr;
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#020408',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      '--dk-rgb': rgb,
    } as React.CSSProperties}>
      <style>{REVEAL_CSS}</style>

      {/* Star field */}
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'fixed', left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s, borderRadius: '50%', background: '#EEE8FF',
          pointerEvents: 'none', zIndex: 0,
          animation: `dkr-starTwinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}

      {/* Spark */}
      {phase >= 1 && phase < 3 && (
        <div style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: primary.color, zIndex: 5,
          animation: 'dkr-spark 1.8s ease-out forwards',
        }} />
      )}

      {/* Alternates (flanking) */}
      {phase >= 3 && (
        <>
          <div style={{
            position: 'absolute', left: '6%', top: '50%', transform: 'translateY(-50%)',
            width: 100, height: 130, zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'dkr-altIn 1.2s ease-out forwards',
          }}>
            <img src={alternates[0].imageSrc} alt={alternates[0].name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(255,255,255,.1))' }} />
          </div>
          <div style={{
            position: 'absolute', right: '6%', top: '50%', transform: 'translateY(-50%)',
            width: 100, height: 130, zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'dkr-altIn 1.2s .2s ease-out forwards', opacity: 0,
          }}>
            <img src={alternates[1].imageSrc} alt={alternates[1].name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(255,255,255,.1))' }} />
          </div>
        </>
      )}

      {/* Primary creature */}
      {phase >= 2 && (
        <div style={{
          width: 220, height: 270,
          zIndex: 10, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: `dkr-emerge 2.2s ease-out forwards`,
        }}>
          <img src={primary.imageSrc} alt={primary.name} style={{
            width: '100%', height: '100%', objectFit: 'contain',
            filter: `drop-shadow(0 0 40px rgba(${rgb},.4))`,
          }} />
        </div>
      )}

      {/* Text */}
      {phase >= 4 && (
        <div style={{
          marginTop: 32, textAlign: 'center', zIndex: 10,
          animation: 'dkr-textIn .8s ease-out forwards',
        }}>
          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif",
            fontStyle: 'italic', fontSize: 17, fontWeight: 400,
            color: 'rgba(244,239,232,.7)', lineHeight: 1.7,
            maxWidth: 300, margin: '0 auto',
          }}>
            This one feels right for you, {childName}...
          </div>
        </div>
      )}
    </div>
  );
}
