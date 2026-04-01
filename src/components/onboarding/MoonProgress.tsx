/** 3-moon progress indicator matching v9 moonDots. */
export default function MoonProgress({ current, total = 3 }: { current: number; total?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '8px 0 10px' }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 16 : 7,
            height: 7,
            borderRadius: 4,
            background: i < current
              ? 'rgba(246,197,111,.55)'
              : i === current
                ? '#F6C56F'
                : 'rgba(234,242,255,.1)',
            transition: 'all .3s',
            ...(i === current ? { animation: 'ob-moonPulse 2.5s ease-in-out infinite' } : {}),
          }}
        />
      ))}
    </div>
  );
}
