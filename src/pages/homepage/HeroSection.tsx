import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  onSignUp: () => void;
}

const ease = [0.22, 1, 0.36, 1];

export default function HeroSection({ onSignUp }: Props) {
  const stars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.35 + 0.05,
      delay: Math.random() * 4,
      duration: 2.5 + Math.random() * 3,
      key: i,
    })), []);

  return (
    <section style={{
      position: 'relative', minHeight: '100vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '120px 28px 80px', overflow: 'hidden', textAlign: 'center',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(245,184,76,.06) 0%, rgba(154,127,212,.04) 40%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'ob-glowPulse 6s ease-in-out infinite',
      }} />

      {/* Stars */}
      {stars.map(s => (
        <div key={s.key} style={{
          position: 'absolute', left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: '50%',
          background: `rgba(255,255,255,${s.opacity})`,
          animation: `ob-starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease }}
        style={{ maxWidth: 560, marginBottom: 20 }}
      >
        <h1 style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 7vw, 58px)',
          fontWeight: 800, color: '#F4EFE8', lineHeight: 1.1, letterSpacing: -1.2,
          margin: 0,
        }}>
          Your child will say something{' '}
          <em style={{ fontStyle: 'italic', color: '#F5B84C' }}>true</em>{' '}
          tonight.
        </h1>
      </motion.div>

      {/* Subline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.7, ease }}
        style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 'clamp(15px, 2.5vw, 18px)',
          color: 'rgba(234,242,255,.42)', lineHeight: 1.7, maxWidth: 440,
          margin: '0 0 36px',
        }}
      >
        Every night before sleep, there's a window where they'll tell you
        what they'd never say at dinner. SleepSeed opens it.
      </motion.p>

      {/* CTA */}
      <motion.button
        onClick={onSignUp}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.0, ease }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative', padding: '17px 36px', borderRadius: 18,
          border: 'none', background: 'linear-gradient(135deg, #F5B84C, #FFDFA3)',
          color: '#16110A', fontFamily: "'Fraunces', serif", fontSize: 16,
          fontWeight: 700, cursor: 'pointer', letterSpacing: -0.1,
          boxShadow: '0 8px 32px rgba(245,184,76,.25)',
          overflow: 'hidden',
        }}
      >
        <span style={{ position: 'relative', zIndex: 1 }}>Start tonight — free</span>
        {/* Shimmer */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%)',
          animation: 'ob-shimmer 5s infinite',
        }} />
      </motion.button>

      {/* Trust note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(234,242,255,.2)',
          letterSpacing: 0.5, marginTop: 16,
        }}
      >
        No credit card required
      </motion.div>
    </section>
  );
}
