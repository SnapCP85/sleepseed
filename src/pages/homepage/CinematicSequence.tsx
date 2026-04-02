import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FRAMES = [
  { text: 'Every night before sleep, there\u2019s a window.', duration: 4200 },
  { text: 'They\u2019ll tell you things they\u2019d never say at dinner.', duration: 4800 },
  { text: 'But only if someone is listening the right way.', duration: 4500 },
  { text: 'SleepSeed opens that window.', duration: 4000, accent: true },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function CinematicSequence() {
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Start animation when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  // Auto-advance frames
  useEffect(() => {
    if (!started) return;
    const dur = FRAMES[frame].duration;
    setProgress(0);
    // Animate progress bar
    const startT = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startT;
      setProgress(Math.min(elapsed / dur, 1));
      if (elapsed < dur) raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);

    const timer = setTimeout(() => {
      if (frame < FRAMES.length - 1) setFrame(f => f + 1);
    }, dur);

    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [frame, started]);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative', minHeight: '60vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 36px', overflow: 'hidden',
      }}
    >
      {/* Ambient drift glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,184,76,.03) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        animation: 'ob-glowDrift 22s ease-in-out infinite', pointerEvents: 'none',
      }} />

      {/* Frame text */}
      <div style={{ position: 'relative', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 480 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={frame}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease }}
            style={{ textAlign: 'center' }}
          >
            <p style={{
              fontFamily: "'Fraunces', serif",
              fontSize: FRAMES[frame].accent ? 'clamp(26px, 5vw, 36px)' : 'clamp(20px, 4vw, 28px)',
              fontWeight: FRAMES[frame].accent ? 700 : 300,
              fontStyle: FRAMES[frame].accent ? 'normal' : 'italic',
              color: FRAMES[frame].accent ? '#F5B84C' : 'rgba(244,239,232,.65)',
              lineHeight: 1.4, letterSpacing: -0.3, margin: 0,
              textShadow: FRAMES[frame].accent ? '0 0 40px rgba(245,184,76,.15)' : 'none',
            }}>
              {FRAMES[frame].text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 32, left: 36, right: 36,
        height: 1, background: 'rgba(244,239,232,.06)', borderRadius: 1,
      }}>
        <motion.div
          style={{
            height: '100%', borderRadius: 1,
            background: 'rgba(245,184,76,.28)',
            width: `${progress * 100}%`,
          }}
        />
      </div>

      {/* Frame dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 32 }}>
        {FRAMES.map((_, i) => (
          <div key={i} style={{
            width: i === frame ? 16 : 6, height: 6, borderRadius: 3,
            background: i <= frame ? 'rgba(245,184,76,.5)' : 'rgba(234,242,255,.1)',
            transition: 'all .4s ease',
          }} />
        ))}
      </div>
    </section>
  );
}
