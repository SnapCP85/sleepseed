import { motion } from 'framer-motion';
import ElderDreamKeeper from '../../components/onboarding/ElderDreamKeeper';

const ease = [0.22, 1, 0.36, 1];

interface Props {
  onSignUp: () => void;
}

export default function FinalCTA({ onSignUp }: Props) {
  return (
    <section style={{
      position: 'relative', padding: '80px 28px 60px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', overflow: 'hidden',
    }}>
      {/* Elder — atmospheric, partially faded */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.4, ease }}
        style={{ marginBottom: 24, opacity: 0.55, transform: 'scale(0.65)', transformOrigin: 'center' }}
      >
        <ElderDreamKeeper scale={0.65} animate />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease }}
        style={{ marginBottom: 12, maxWidth: 420 }}
      >
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 5vw, 34px)',
          fontWeight: 700, color: '#F4EFE8', lineHeight: 1.2, letterSpacing: -0.5,
        }}>
          Tonight, they'll say something worth remembering.
        </div>
      </motion.div>

      {/* Subline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
        style={{ marginBottom: 32 }}
      >
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 300,
          fontStyle: 'italic', color: 'rgba(234,242,255,.35)', lineHeight: 1.6,
        }}>
          Will you be listening?
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        onClick={onSignUp}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.25, ease }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative', padding: '17px 40px', borderRadius: 18,
          border: 'none', background: 'linear-gradient(135deg, #F5B84C, #FFDFA3)',
          color: '#16110A', fontFamily: "'Fraunces', serif", fontSize: 16,
          fontWeight: 700, cursor: 'pointer', letterSpacing: -0.1,
          boxShadow: '0 8px 32px rgba(245,184,76,.25)',
          overflow: 'hidden', marginBottom: 16,
        }}
      >
        <span style={{ position: 'relative', zIndex: 1 }}>Start tonight — free</span>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%)',
          animation: 'ob-shimmer 5s infinite',
        }} />
      </motion.button>

      {/* Trust line */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(234,242,255,.18)',
          letterSpacing: 0.5, marginBottom: 40,
        }}
      >
        Free to start &middot; No card needed
      </motion.div>

      {/* Footer */}
      <div style={{
        width: '100%', maxWidth: 520, padding: '24px 0 0',
        borderTop: '1px solid rgba(255,255,255,.04)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 12, color: 'rgba(234,242,255,.2)',
        }}>
          SleepSeed &middot; Bedtime, but magical.
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(234,242,255,.12)',
          letterSpacing: 0.3,
        }}>
          &copy; 2026 SleepSeed
        </div>
      </div>
    </section>
  );
}
