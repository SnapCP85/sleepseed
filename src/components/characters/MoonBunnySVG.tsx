interface MoonBunnySVGProps {
  size?: number;
  excited?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function MoonBunnySVG({ size = 70, excited = false, className, style }: MoonBunnySVGProps) {
  const w = size;
  const h = Math.round(size * 118 / 100);

  const mouthPath = excited
    ? 'M43 66 Q47 72 50 68 Q53 72 57 66'
    : 'M44 66 Q47 70.5 50 68 Q53 70.5 56 66';
  const browL = excited ? 'M32 40 Q37 36 43 39' : 'M33 41 Q38 38 43 40.5';
  const browR = excited ? 'M57 39 Q63 36 68 40' : 'M57 40.5 Q62 38 67 41';
  const eyeY = excited ? 49 : 51;

  return (
    <svg width={w} height={h} viewBox="0 0 100 118" fill="none" className={className} style={style}>
      {/* Left ear */}
      <ellipse cx="33" cy="22" rx="10" ry="24" fill="#E8DDD0" />
      <ellipse cx="33" cy="22" rx="6" ry="18" fill="#F5C0A8" opacity=".45" />
      {/* Right ear */}
      <ellipse cx="67" cy="22" rx="10" ry="24" fill="#E8DDD0" />
      <ellipse cx="67" cy="22" rx="6" ry="18" fill="#F5C0A8" opacity=".45" />
      {/* Body */}
      <ellipse cx="50" cy="72" rx="28" ry="30" fill="#F0E6DA" />
      {/* Belly */}
      <ellipse cx="50" cy="78" rx="18" ry="18" fill="#FAF4EC" opacity=".6" />
      {/* Head */}
      <circle cx="50" cy="52" r="22" fill="#F0E6DA" />
      {/* Cheeks */}
      <circle cx="34" cy="58" r="5" fill="#F5C0A8" opacity=".3" />
      <circle cx="66" cy="58" r="5" fill="#F5C0A8" opacity=".3" />
      {/* Eyes */}
      <circle cx="40" cy={eyeY} r="3.5" fill="#2A1A12" />
      <circle cx="60" cy={eyeY} r="3.5" fill="#2A1A12" />
      <circle cx="41.2" cy={eyeY - 1} r="1.2" fill="#FFF" opacity=".75" />
      <circle cx="61.2" cy={eyeY - 1} r="1.2" fill="#FFF" opacity=".75" />
      {/* Brows */}
      <path d={browL} stroke="#8B7355" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d={browR} stroke="#8B7355" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="50" cy="59" rx="2.8" ry="2" fill="#D4A088" />
      {/* Mouth */}
      <path d={mouthPath} stroke="#8B7355" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Whiskers */}
      <line x1="22" y1="55" x2="34" y2="57" stroke="#C4B8A8" strokeWidth=".7" opacity=".5" />
      <line x1="22" y1="60" x2="34" y2="60" stroke="#C4B8A8" strokeWidth=".7" opacity=".5" />
      <line x1="78" y1="55" x2="66" y2="57" stroke="#C4B8A8" strokeWidth=".7" opacity=".5" />
      <line x1="78" y1="60" x2="66" y2="60" stroke="#C4B8A8" strokeWidth=".7" opacity=".5" />
      {/* Arms */}
      <ellipse cx="26" cy="75" rx="7" ry="5" fill="#E8DDD0" transform="rotate(-15 26 75)" />
      <ellipse cx="74" cy="75" rx="7" ry="5" fill="#E8DDD0" transform="rotate(15 74 75)" />
      {/* Feet */}
      <ellipse cx="38" cy="100" rx="9" ry="5" fill="#E8DDD0" />
      <ellipse cx="62" cy="100" rx="9" ry="5" fill="#E8DDD0" />
      {/* Toe lines */}
      <line x1="34" y1="99" x2="34" y2="102" stroke="#C4B8A8" strokeWidth=".6" opacity=".4" />
      <line x1="38" y1="99.5" x2="38" y2="103" stroke="#C4B8A8" strokeWidth=".6" opacity=".4" />
      <line x1="62" y1="99.5" x2="62" y2="103" stroke="#C4B8A8" strokeWidth=".6" opacity=".4" />
      <line x1="66" y1="99" x2="66" y2="102" stroke="#C4B8A8" strokeWidth=".6" opacity=".4" />
    </svg>
  );
}
