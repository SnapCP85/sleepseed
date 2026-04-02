import { motion } from 'framer-motion';

interface Props {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function HomepageNav({ onSignIn, onSignUp }: Props) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', maxWidth: 960, margin: '0 auto',
        background: 'rgba(6,9,18,.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,.04)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#F5B84C',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#060912', top: -4, left: -7 }} />
        </div>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: '#F4EFE8', letterSpacing: -0.5 }}>
          SleepSeed
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onSignIn}
          style={{
            background: 'none', border: 'none', color: 'rgba(244,239,232,.5)',
            fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600,
            cursor: 'pointer', padding: '6px 10px',
          }}
        >
          Sign in
        </button>
        <button
          onClick={onSignUp}
          style={{
            padding: '9px 18px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #F5B84C, #FFDFA3)',
            color: '#16110A', fontFamily: "'Fraunces', serif", fontSize: 13,
            fontWeight: 700, cursor: 'pointer', letterSpacing: -0.1,
            boxShadow: '0 4px 16px rgba(245,184,76,.2)',
          }}
        >
          Start free
        </button>
      </div>
    </motion.nav>
  );
}
