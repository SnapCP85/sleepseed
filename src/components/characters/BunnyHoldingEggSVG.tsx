interface BunnyHoldingEggSVGProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function BunnyHoldingEggSVG({ size = 110, className, style }: BunnyHoldingEggSVGProps) {
  const w = size;
  const h = Math.round(size * 132 / 100);

  return (
    <svg width={w} height={h} viewBox="0 0 100 132" fill="none" className={className} style={style}>
      {/* Left ear */}
      <ellipse cx="33" cy="18" rx="9" ry="22" fill="#E8DDD0" />
      <ellipse cx="33" cy="18" rx="5.5" ry="16" fill="#F5C0A8" opacity=".4" />
      {/* Right ear */}
      <ellipse cx="67" cy="18" rx="9" ry="22" fill="#E8DDD0" />
      <ellipse cx="67" cy="18" rx="5.5" ry="16" fill="#F5C0A8" opacity=".4" />
      {/* Body */}
      <ellipse cx="50" cy="68" rx="26" ry="28" fill="#F0E6DA" />
      {/* Belly */}
      <ellipse cx="50" cy="74" rx="17" ry="16" fill="#FAF4EC" opacity=".5" />
      {/* Head */}
      <circle cx="50" cy="48" r="20" fill="#F0E6DA" />
      {/* Cheeks */}
      <circle cx="35" cy="54" r="4.5" fill="#F5C0A8" opacity=".28" />
      <circle cx="65" cy="54" r="4.5" fill="#F5C0A8" opacity=".28" />
      {/* Eyes */}
      <circle cx="42" cy="47" r="3" fill="#2A1A12" />
      <circle cx="58" cy="47" r="3" fill="#2A1A12" />
      <circle cx="43" cy="46" r="1.1" fill="#FFF" opacity=".7" />
      <circle cx="59" cy="46" r="1.1" fill="#FFF" opacity=".7" />
      {/* Nose */}
      <ellipse cx="50" cy="53" rx="2.5" ry="1.8" fill="#D4A088" />
      {/* Mouth */}
      <path d="M45 56 Q47.5 59.5 50 57.5 Q52.5 59.5 55 56" stroke="#8B7355" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Arms wrapping under egg */}
      <path d="M28 72 Q22 80 28 92 Q32 97 40 98" stroke="#E8DDD0" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M72 72 Q78 80 72 92 Q68 97 60 98" stroke="#E8DDD0" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Paw tips */}
      <circle cx="40" cy="98" r="4" fill="#E8DDD0" />
      <circle cx="60" cy="98" r="4" fill="#E8DDD0" />
      {/* --- THE EGG --- */}
      <ellipse cx="50" cy="90" rx="16" ry="20" fill="#FDF8EE" />
      {/* Egg speckles */}
      <circle cx="42" cy="82" r="1.2" fill="#E8D8C4" opacity=".5" />
      <circle cx="56" cy="78" r="1" fill="#E8D8C4" opacity=".5" />
      <circle cx="47" cy="96" r="1.3" fill="#E8D8C4" opacity=".4" />
      <circle cx="58" cy="94" r=".9" fill="#E8D8C4" opacity=".45" />
      {/* Crack line */}
      <path d="M42 88 L46 84 L44 80 L48 77" stroke="#D4C4A8" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Amber glow from crack */}
      <ellipse cx="46" cy="83" rx="4" ry="3" fill="#F5B84C" opacity=".2" />
      {/* Peeking eyes inside crack */}
      <circle cx="44.5" cy="82.5" r="1.5" fill="#2A1A12" />
      <circle cx="48" cy="82.5" r="1.5" fill="#2A1A12" />
      <circle cx="44.8" cy="82" r=".6" fill="#FFF" opacity=".7" />
      <circle cx="48.3" cy="82" r=".6" fill="#FFF" opacity=".7" />
      {/* Teal sprout on top */}
      <path d="M50 70 Q48 65 50 61 Q52 65 50 70" fill="#14d890" opacity=".7" />
      <path d="M50 64 Q54 60 56 62" stroke="#14d890" strokeWidth="1" fill="none" opacity=".5" strokeLinecap="round" />
      {/* Tiny egg feet */}
      <ellipse cx="44" cy="109" rx="4" ry="2.5" fill="#FDF8EE" />
      <ellipse cx="56" cy="109" rx="4" ry="2.5" fill="#FDF8EE" />
      {/* Bunny feet behind egg */}
      <ellipse cx="36" cy="112" rx="8" ry="4.5" fill="#E8DDD0" />
      <ellipse cx="64" cy="112" rx="8" ry="4.5" fill="#E8DDD0" />
    </svg>
  );
}
