import { useEffect, useRef, useState } from 'react';
import DreamEgg from './DreamEgg';
import './onboarding.css';

interface Props {
  childName: string;
  creatureEmoji: string;
  onComplete: () => void;
}

export default function HatchCeremony({ childName, creatureEmoji, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eggRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const creatureRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [eggVisible, setEggVisible] = useState(true);
  const [creatureVisible, setCreatureVisible] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const egg = eggRef.current;

    // Phase 1 (0-2s): heartbeat — DreamEgg handles this via hatching state

    // Phase 2 (2s): glow intensifies
    timers.push(window.setTimeout(() => {
      if (egg) egg.style.filter = 'brightness(1.4) drop-shadow(0 0 40px rgba(246,197,111,.8))';
    }, 2000));

    // Phase 3 (4s): max glow
    timers.push(window.setTimeout(() => {
      if (egg) egg.style.filter = 'brightness(1.8) drop-shadow(0 0 60px rgba(255,248,200,1))';
    }, 4000));

    // Phase 4 (5.5s): BLOOM FLASH + canvas particle burst
    timers.push(window.setTimeout(() => {
      const bloom = bloomRef.current;
      if (bloom) bloom.style.background = 'radial-gradient(circle at 50% 40%, rgba(255,248,220,.85), rgba(255,240,200,.3) 40%, transparent 70%)';

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const W = canvasRef.current.width, H = canvasRef.current.height;
          const cx = W / 2, cy = H * 0.5;
          const particles = Array.from({ length: 40 }, () => ({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 1, r: 2 + Math.random() * 3,
            gold: Math.random() > 0.4,
          }));
          function drawBlast() {
            ctx!.clearRect(0, 0, W, H);
            let alive = false;
            particles.forEach(p => {
              p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= 0.022;
              if (p.life > 0) {
                alive = true;
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx!.fillStyle = p.gold ? `rgba(246,197,111,${p.life})` : `rgba(255,200,240,${p.life * 0.8})`;
                ctx!.shadowColor = p.gold ? 'rgba(246,197,111,.8)' : 'rgba(255,180,240,.8)';
                ctx!.shadowBlur = 8;
                ctx!.fill();
              }
            });
            ctx!.shadowBlur = 0;
            if (alive) requestAnimationFrame(drawBlast);
            else ctx!.clearRect(0, 0, W, H);
          }
          requestAnimationFrame(drawBlast);
        }
      }
    }, 5500));

    // Phase 5 (6.8s): egg hides, creature silhouette
    timers.push(window.setTimeout(() => {
      const bloom = bloomRef.current;
      if (bloom) bloom.style.background = 'radial-gradient(circle at 50% 40%, rgba(255,248,220,.08), transparent 70%)';
      setEggVisible(false);
      setCreatureVisible(true);
    }, 6800));

    // Phase 6 (9s): creature starts revealing
    timers.push(window.setTimeout(() => {
      const creature = creatureRef.current;
      if (creature) creature.style.filter = 'brightness(.45) blur(1.5px) drop-shadow(0 0 28px rgba(246,197,111,.9))';
      if (line1Ref.current) {
        line1Ref.current.textContent = `Hi, ${childName}\u2026`;
        line1Ref.current.style.color = 'rgba(244,239,232,.82)';
      }
    }, 9000));

    // Phase 7 (11s): full reveal + first contact
    timers.push(window.setTimeout(() => {
      const creature = creatureRef.current;
      if (creature) {
        creature.style.filter = 'drop-shadow(0 0 22px rgba(246,197,111,.65))';
        creature.style.animation = 'ob-creatureLookAround 3.5s ease-in-out forwards, ob-floatY 4s 3.5s ease-in-out infinite';
      }
      if (line2Ref.current) {
        line2Ref.current.textContent = "I've been waiting for you.";
        line2Ref.current.style.color = 'rgba(246,197,111,.8)';
      }
    }, 11000));

    // Phase 8 (13.5s): blink + CTA
    timers.push(window.setTimeout(() => {
      const creature = creatureRef.current;
      if (creature) {
        creature.style.animation = 'none';
        creature.style.transform = 'translate(-50%,-50%)';
        void creature.offsetWidth;
        creature.style.animation = 'ob-creatureBlink .4s ease, ob-floatY 4s .5s ease-in-out infinite';
      }
      setCtaVisible(true);
    }, 13500));

    return () => timers.forEach(clearTimeout);
  }, [childName]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#030408', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={345} height={748}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
      />
      {/* Star field */}
      <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} viewBox="0 0 345 748" width="100%" height="100%">
        {Array.from({ length: 65 }, (_, i) => (
          <circle
            key={i}
            cx={(Math.random() * 335 + 5).toFixed(1)}
            cy={(Math.random() * 738 + 5).toFixed(1)}
            r={(Math.random() * 0.75 + 0.2).toFixed(1)}
            fill={`rgba(255,255,255,${(Math.random() * 0.38 + 0.08).toFixed(2)})`}
            style={{ animation: `ob-starTwinkle ${(2 + Math.random() * 3).toFixed(1)}s ${(Math.random() * 2).toFixed(1)}s ease-in-out infinite` }}
          />
        ))}
      </svg>
      {/* Egg — rendered DreamEgg in hatching state */}
      {eggVisible && (
        <div ref={eggRef} style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 5, transition: 'filter 1.5s ease, opacity 1.5s ease',
        }}>
          <DreamEgg state="hatching" size="full" />
        </div>
      )}
      {/* Bloom overlay */}
      <div ref={bloomRef} style={{
        position: 'absolute', inset: 0, zIndex: 8,
        background: 'radial-gradient(circle at 50% 40%, rgba(255,248,220,0), transparent 70%)',
        pointerEvents: 'none', transition: 'background 1s ease',
      }} />
      {/* Creature */}
      {creatureVisible && (
        <div ref={creatureRef} style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 9, fontSize: 108, opacity: 0,
          transition: 'opacity 2s ease, filter 2.5s ease',
          filter: 'brightness(.04) blur(4px) drop-shadow(0 0 40px rgba(246,197,111,1))',
          pointerEvents: 'none',
          animation: 'ob-fadeIn 2s ease forwards',
        }}>
          {creatureEmoji}
        </div>
      )}
      {/* Text */}
      <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, zIndex: 10, textAlign: 'center', padding: '0 32px' }}>
        <div ref={line1Ref} style={{
          fontFamily: "'Fraunces', serif", fontSize: 18, fontStyle: 'italic',
          color: 'rgba(244,239,232,0)', lineHeight: 1.4, transition: 'color 1.4s ease', marginBottom: 8,
        }} />
        <div ref={line2Ref} style={{
          fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 300, fontStyle: 'italic',
          color: 'rgba(246,197,111,0)', lineHeight: 1.4, transition: 'color 1.4s .6s ease',
        }} />
        <div style={{ opacity: ctaVisible ? 1 : 0, transition: 'opacity 1s ease', marginTop: 22 }}>
          <button
            onClick={onComplete}
            className="ob-cta"
            style={{ maxWidth: 300 }}
          >
            Hello, {childName}'s DreamKeeper &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
