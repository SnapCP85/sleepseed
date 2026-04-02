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
      {/* Ambient glow removed — was visible as a disk through the Elder image */}

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

      {/* Eye glow and ambient disk removed — were visible through Elder image */}
    </div>
  );
}
