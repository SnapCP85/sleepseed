import { motion } from 'framer-motion';
import DreamEgg from '../../components/onboarding/DreamEgg';

const ease = [0.22, 1, 0.36, 1];

const NIGHTS = [
  {
    night: 1,
    label: 'Tonight',
    title: 'The egg arrives.',
    description: 'A Dream Egg appears. It listens to what your child shares before sleep.',
    eggState: 'idle' as const,
    accent: 'rgba(245,184,76,.5)',
  },
  {
    night: 2,
    label: 'Tomorrow',
    title: 'It starts to listen.',
    description: 'The egg remembers. Cracks begin to form. Something inside is waking up.',
    eggState: 'cracked' as const,
    accent: 'rgba(20,216,144,.5)',
  },
  {
    night: 3,
    label: 'Night 3',
    title: 'It knows who you are.',
    description: 'After three nights of listening, your child\u2019s DreamKeeper is born.',
    eggState: null,
    accent: 'rgba(255,130,184,.5)',
    creature: true,
  },
];

export default function ThreeNightArc() {
  return (
    <section style={{
      position: 'relative', padding: '100px 28px 80px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Section intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease }}
        style={{ textAlign: 'center', marginBottom: 56, maxWidth: 400 }}
      >
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(245,184,76,.45)',
          letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 14,
        }}>
          The 3-night ritual
        </div>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 700, color: '#F4EFE8', lineHeight: 1.2, letterSpacing: -0.5,
        }}>
          Something is forming.
        </div>
      </motion.div>

      {/* Three nights */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 48,
        maxWidth: 340, width: '100%',
      }}>
        {NIGHTS.map((n, i) => (
          <motion.div
            key={n.night}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: i * 0.12, ease }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Egg or creature */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              {n.creature ? (
                <div style={{
                  fontSize: 64, lineHeight: 1,
                  filter: 'drop-shadow(0 0 24px rgba(245,184,76,.5))',
                  animation: 'ob-floatY 4s ease-in-out infinite',
                }}>
                  {'\uD83D\uDC30'}
                </div>
              ) : (
                <div style={{ transform: 'scale(0.55)' }}>
                  <DreamEgg state={n.eggState!} size="sm" />
                </div>
              )}
              {/* Connecting line (not on last) */}
              {i < NIGHTS.length - 1 && (
                <div style={{
                  position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)',
                  width: 1, height: 32,
                  background: 'linear-gradient(to bottom, rgba(245,184,76,.15), transparent)',
                }} />
              )}
            </div>

            {/* Label */}
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.2,
              color: n.accent, textTransform: 'uppercase', marginBottom: 8,
            }}>
              Night {n.night} &middot; {n.label}
            </div>

            {/* Title */}
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700,
              color: '#F4EFE8', lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 8,
            }}>
              {n.title}
            </div>

            {/* Description */}
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(234,242,255,.35)',
              lineHeight: 1.65, maxWidth: 280,
            }}>
              {n.description}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
