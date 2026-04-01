/** Elder DreamKeeper — CSS-rendered character matching v9 exactly.
 *  Props: scale (default 1), animate (default true) */
export default function ElderDreamKeeper({ scale = 1, animate = true }: { scale?: number; animate?: boolean }) {
  const s = (v: number) => v * scale;
  return (
    <div style={{
      position: 'relative', width: s(210), height: s(252),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto',
      ...(animate ? { animation: 'ob-elderFloat 4.5s ease-in-out infinite' } : {}),
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', width: s(230), height: s(230), borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(246,197,111,.50) 0%, rgba(184,161,255,.28) 40%, transparent 68%)',
        filter: `blur(${s(14)}px)`,
        animation: 'ob-glowPulse 3s ease-in-out infinite',
      }} />
      {/* Body */}
      <div style={{
        position: 'relative', width: s(168), height: s(204), borderRadius: s(88),
        background: 'linear-gradient(180deg, #4E3880 0%, #3A2B6A 35%, #1E1848 65%, #0F0E2C 100%)',
        boxShadow: '0 20px 64px rgba(0,0,0,.55), 0 0 40px rgba(180,160,255,.14)',
      }}>
        {/* Hood */}
        <div style={{
          position: 'absolute', top: s(-5), left: '50%', transform: 'translateX(-50%)',
          width: s(154), height: s(66), borderRadius: s(77),
          background: 'linear-gradient(180deg, #5E4494, #3A2E7A)',
        }} />
        {/* Eyes */}
        <div style={{
          position: 'absolute', top: s(36), left: '50%', transform: 'translateX(-50%)',
          width: s(108), display: 'flex', justifyContent: 'space-between',
        }}>
          <div style={{
            width: s(27), height: s(27), borderRadius: '50%', background: '#FFE090',
            boxShadow: '0 0 18px rgba(246,197,111,.9), 0 0 36px rgba(246,197,111,.45)',
            animation: 'ob-eyePulse 2.8s ease-in-out infinite',
          }} />
          <div style={{
            width: s(27), height: s(27), borderRadius: '50%', background: '#FFE090',
            boxShadow: '0 0 18px rgba(246,197,111,.9), 0 0 36px rgba(246,197,111,.45)',
            animation: 'ob-eyePulse 2.8s ease-in-out infinite',
            animationDelay: '0.28s',
          }} />
        </div>
        {/* Mouth */}
        <div style={{
          position: 'absolute', top: s(82), left: '50%', transform: 'translateX(-50%)',
          width: s(28), height: s(12), borderRadius: s(20),
          background: 'rgba(255,255,255,.08)',
        }} />
        {/* Robe */}
        <div style={{
          position: 'absolute', bottom: s(8), left: '50%', transform: 'translateX(-50%)',
          width: s(142), height: s(86), borderRadius: s(75),
          background: 'linear-gradient(180deg, #1A1540, #0D0C28)',
        }} />
      </div>
    </div>
  );
}
