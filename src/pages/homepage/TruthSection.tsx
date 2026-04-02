import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];
const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 } };

export default function TruthSection() {
  return (
    <section style={{
      position: 'relative', padding: '100px 28px', display: 'flex',
      flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      maxWidth: 520, margin: '0 auto',
    }}>
      {/* Soft divider */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.8, ease }}
        style={{
          width: 40, height: 1, marginBottom: 48,
          background: 'linear-gradient(90deg, transparent, rgba(245,184,76,.3), transparent)',
        }}
      />

      {/* The question that fails */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.8, ease }}
        style={{ marginBottom: 32 }}
      >
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(234,242,255,.25)',
          letterSpacing: 0.3, marginBottom: 10,
        }}>
          Every parent asks:
        </div>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(22px, 4.5vw, 30px)',
          fontWeight: 700, color: 'rgba(244,239,232,.8)', lineHeight: 1.3,
          letterSpacing: -0.4,
        }}>
          "How was your day?"
        </div>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(18px, 3.5vw, 24px)',
          fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.3)',
          lineHeight: 1.4, marginTop: 8,
        }}>
          "Fine."
        </div>
      </motion.div>

      {/* The turn */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.8, delay: 0.15, ease }}
        style={{ marginBottom: 36 }}
      >
        <div style={{
          width: 24, height: 1, background: 'rgba(255,255,255,.06)',
          margin: '0 auto 28px',
        }} />
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(16px, 3vw, 20px)',
          fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.38)',
          lineHeight: 1.6, marginBottom: 14,
        }}>
          But at bedtime, she said:
        </div>
      </motion.div>

      {/* The keepsake quote */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.9, delay: 0.3, ease }}
        style={{
          position: 'relative', padding: '28px 24px', borderRadius: 20,
          background: 'linear-gradient(145deg, rgba(154,127,212,.08), rgba(6,9,18,.95))',
          border: '1px solid rgba(154,127,212,.15)',
          maxWidth: 380, width: '100%', marginBottom: 32,
        }}
      >
        {/* Badge */}
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 8.5, letterSpacing: 1,
          color: 'rgba(245,184,76,.5)', marginBottom: 14, textTransform: 'uppercase',
        }}>
          Night 8 &middot; Moon Bunny
        </div>
        {/* Quote */}
        <div style={{
          fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 'clamp(16px, 3vw, 19px)',
          color: 'rgba(244,239,232,.88)', lineHeight: 1.65, letterSpacing: 0.01,
        }}>
          "I was brave like the dragon. Even though my tummy was full of tangled string."
        </div>
        {/* Attribution */}
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(234,242,255,.25)',
          marginTop: 16, letterSpacing: 0.3,
        }}>
          Adina, age 6
        </div>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 200, height: 200, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(154,127,212,.06), transparent 70%)',
          filter: 'blur(20px)',
        }} />
      </motion.div>

      {/* The resolution */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.8, delay: 0.4, ease }}
      >
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(234,242,255,.32)',
          lineHeight: 1.7,
        }}>
          She said this right before sleep.<br />
          Without tonight's ritual, it would already be gone.
        </div>
      </motion.div>
    </section>
  );
}
