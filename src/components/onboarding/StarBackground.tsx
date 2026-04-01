import { useMemo } from 'react';

/** Star field background — denser version for night screens. */
export default function StarBackground({ opacity = 1, count = 52 }: { opacity?: number; count?: number }) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      cx: (Math.random() * 98 + 1).toFixed(1),
      cy: (Math.random() * 98 + 1).toFixed(1),
      r: (Math.random() * 0.5 + 0.12).toFixed(2),
      op: (Math.random() * 0.38 + 0.08).toFixed(2),
      dur: (2 + Math.random() * 3).toFixed(1),
      del: (Math.random() * 2).toFixed(1),
      key: i,
    })), [count]);

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity }}
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
  );
}
