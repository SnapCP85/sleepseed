import './onboarding.css';

// ─────────────────────────────────────────────────────────────────────────────
// CreatureImage — Renders DreamKeeper PNG with glow and animation
// ─────────────────────────────────────────────────────────────────────────────
// Replaces emoji usage in post-hatch screens. Uses the transparent PNG images
// from public/dreamkeepers/transparent/*.png.
//
// Usage:
//   <CreatureImage src="/dreamkeepers/transparent/bunny.png" size={120} />
//   <CreatureImage src={dreamKeeper.imageSrc} size={80} color="#F6C56F" />
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Path to PNG, e.g. "/dreamkeepers/transparent/owl.png" */
  src: string;
  /** Display size in px (width = height) */
  size?: number;
  /** Glow color — defaults to gold */
  color?: string;
  /** Float animation — defaults to true */
  animate?: boolean;
  /** Additional glow intensity (0-1) */
  glowIntensity?: number;
}

export default function CreatureImage({
  src,
  size = 100,
  color = '#F6C56F',
  animate = true,
  glowIntensity = 0.5,
}: Props) {
  const rgb = hexToRgb(color);

  return (
    <div style={{
      position: 'relative',
      width: size + 40,
      height: size + 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
    }}>
      {/* Glow halo */}
      <div style={{
        position: 'absolute',
        width: size + 60,
        height: size + 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},${glowIntensity * 0.4}) 0%, rgba(184,161,255,${glowIntensity * 0.16}) 45%, transparent 70%)`,
        filter: 'blur(16px)',
        animation: 'ob-glowPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Character image */}
      <img
        src={src}
        alt="DreamKeeper"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          position: 'relative',
          zIndex: 2,
          filter: `drop-shadow(0 0 18px rgba(${rgb},${glowIntensity}))`,
          animation: animate ? 'ob-elderFloat 4.5s ease-in-out infinite' : undefined,
        }}
      />
    </div>
  );
}

function hexToRgb(hex: string): string {
  if (!hex || hex.length < 7) return '246,197,111';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '246,197,111';
  return `${r},${g},${b}`;
}
