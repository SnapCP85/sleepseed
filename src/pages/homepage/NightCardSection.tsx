import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

export default function NightCardSection() {
  return (
    <section style={{
      position: 'relative', padding: '80px 28px 100px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(111,231,221,.04), transparent 70%)',
        filter: 'blur(30px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease }}
        style={{ textAlign: 'center', marginBottom: 36, maxWidth: 360 }}
      >
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(111,231,221,.5)',
          letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 14,
        }}>
          Night Cards
        </div>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(22px, 4.5vw, 28px)',
          fontWeight: 700, color: '#F4EFE8', lineHeight: 1.25, letterSpacing: -0.4,
        }}>
          What they said before sleep &mdash; saved forever.
        </div>
      </motion.div>

      {/* The Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, delay: 0.1, ease }}
        style={{
          width: 280, borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)',
        }}
      >
        {/* Sky */}
        <div style={{
          height: 130, position: 'relative',
          background: 'linear-gradient(145deg, rgba(154,127,212,.15), rgba(6,9,18,.95))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Stars */}
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${8 + Math.random() * 84}%`,
              top: `${8 + Math.random() * 74}%`,
              width: Math.random() * 1.2 + 0.4,
              height: Math.random() * 1.2 + 0.4,
              borderRadius: '50%',
              background: `rgba(255,255,255,${(Math.random() * 0.35 + 0.08).toFixed(2)})`,
            }} />
          ))}
          {/* Creature */}
          <div style={{
            fontSize: 32, filter: 'drop-shadow(0 0 10px rgba(245,184,76,.5))',
            animation: 'ob-floatY 4s ease-in-out infinite', position: 'relative', zIndex: 2,
          }}>
            {'\uD83D\uDC30'}
          </div>
          {/* Badge */}
          <div style={{
            position: 'absolute', top: 10, left: 12, padding: '3px 9px',
            background: 'rgba(111,231,221,.15)', border: '1px solid rgba(111,231,221,.35)',
            borderRadius: 20,
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 7.5, fontWeight: 600,
              color: 'rgba(111,231,221,.85)',
            }}>
              NIGHT 8 &middot; MOON BUNNY
            </span>
          </div>
          {/* Gradient to paper */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
            background: 'linear-gradient(to bottom, transparent, #f8f4ee)',
          }} />
        </div>

        {/* Paper */}
        <div style={{ background: '#f8f4ee', padding: '16px 20px 20px' }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(26,26,46,.35)',
            letterSpacing: 0.5, marginBottom: 8,
          }}>
            TONIGHT'S MEMORY
          </div>
          <div style={{
            fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13.5,
            color: 'rgba(26,26,46,.7)', lineHeight: 1.6, marginBottom: 14,
          }}>
            "I was brave like the dragon. Even though my tummy was full of tangled string."
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(26,26,46,.3)',
            }}>
              Mar 29, 2026
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 8, fontWeight: 600,
              color: 'rgba(111,231,221,.6)',
            }}>
              ADINA
            </div>
          </div>
        </div>
      </motion.div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{
          fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13,
          color: 'rgba(234,242,255,.28)', lineHeight: 1.65, marginTop: 24,
          textAlign: 'center', maxWidth: 300,
        }}
      >
        One day she'll be 16 and you'll open this card.
        You'll remember exactly how her voice sounded.
      </motion.div>
    </section>
  );
}
