import { useMemo } from 'react';

/** Whisper background — sparse stars + warm gradient. For parent screens. */
export default function WhisperBackground() {
  const stars = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      cx: (Math.random() * 90 + 5).toFixed(1),
      cy: (Math.random() * 90 + 5).toFixed(1),
      r: (Math.random() * 0.4 + 0.15).toFixed(2),
      op: (Math.random() * 0.38 + 0.08).toFixed(2),
      dur: (2 + Math.random() * 3).toFixed(1),
      del: (Math.random() * 2).toFixed(1),
      key: i,
    })), []);

  return (
    <>
      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.45 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        {stars.map(s => (
          <circle
            key={s.key}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill={`rgba(255,255,255,${s.op})`}
            style={{
              animation: `ob-starTwinkle ${s.dur}s ${s.del}s ease-in-out infinite`,
            }}
          />
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(246,197,111,.018) 0%, transparent 45%)',
        pointerEvents: 'none',
      }} />
    </>
  );
}
