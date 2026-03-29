interface CometSVGProps {
  size?: number;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function CometSVG({ size = 28, animated = false, className, style }: CometSVGProps) {
  const h = Math.round(size);
  return (
    <svg
      width={h}
      height={h}
      viewBox="0 0 50 50"
      fill="none"
      className={className}
      style={{
        flexShrink: 0,
        ...(animated ? { animation: 'cometPulse 3.5s ease-in-out infinite' } : {}),
        ...style,
      }}
    >
      {/* Trail dots — growing toward bottom-right */}
      <circle cx="8" cy="8" r="1.2" fill="rgba(245,184,76,.18)" />
      <circle cx="13" cy="13" r="1.6" fill="rgba(245,184,76,.22)" />
      <circle cx="18.5" cy="18" r="2" fill="rgba(245,184,76,.28)" />
      <circle cx="24" cy="23.5" r="2.5" fill="rgba(245,184,76,.35)" />
      <circle cx="30" cy="29" r="3.2" fill="rgba(245,184,76,.45)" />
      {/* Head — amber filled circle with white highlight */}
      <circle cx="37" cy="36" r="6.5" fill="#F5B84C" />
      <circle cx="34.5" cy="33.5" r="2.2" fill="rgba(255,255,255,.35)" />
    </svg>
  );
}
