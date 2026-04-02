/** Elder DreamKeeper — image-based character using /elder/transparent/elder.png.
 *  Replaces the old CSS-rendered version. Same props interface so all call sites work unchanged.
 *  Props: scale (default 1), animate (default true) */
export default function ElderDreamKeeper({ scale = 1, animate = true }: { scale?: number; animate?: boolean }) {
  const w = 210 * scale;
  const h = 252 * scale;
  const glowSize = 240 * scale;
  const imgW = 190 * scale;

  return (
    <div style={{
      position: 'relative',
      width: w,
      height: h,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      ...(animate ? { animation: 'ob-elderFloat 4.5s ease-in-out infinite' } : {}),
    }}>
      {/* Ambient glow — matches the image's blue-purple-gold palette */}
      <div style={{
        position: 'absolute',
        width: glowSize,
        height: glowSize,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(184,161,255,.35) 0%, rgba(246,197,111,.18) 35%, transparent 68%)',
        filter: `blur(${18 * scale}px)`,
        animation: 'ob-glowPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* The Elder image */}
      <img
        src="/elder/transparent/elder.png"
        alt="The Elder DreamKeeper"
        draggable={false}
        style={{
          position: 'relative',
          width: imgW,
          height: 'auto',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'drop-shadow(0 8px 32px rgba(120,100,200,.4)) drop-shadow(0 0 18px rgba(184,161,255,.25))',
        }}
      />

      {/* Subtle eye glow overlay — positioned at the Elder's eye level (~35% from top) */}
      <div style={{
        position: 'absolute',
        top: `${32 * scale}%`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 60 * scale,
        height: 20 * scale,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(246,197,111,.3) 0%, transparent 70%)',
        animation: 'ob-eyePulse 2.8s ease-in-out infinite',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }} />
    </div>
  );
}
