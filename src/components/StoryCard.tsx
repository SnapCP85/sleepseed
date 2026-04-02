import { useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// StoryCard — Premium shareable story artifact
// ─────────────────────────────────────────────────────────────────────────────
// Instagram-ready 4:5 card (~280×350) designed to be screenshot-shared or
// exported. Shows the creature, story title, excerpt quote, child's name,
// night number, and SleepSeed branding.
//
// Not a replacement for Night Cards — Story Cards are about the *story*;
// Night Cards are about the *memory*. They complement each other.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes sc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes sc-shine{0%{transform:translateX(-100%) rotate(15deg)}100%{transform:translateX(200%) rotate(15deg)}}
@keyframes sc-fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
`;

interface Props {
  title: string;
  heroName: string;
  quote?: string;
  creatureEmoji?: string;
  creatureName?: string;
  nightNumber?: number;
  /** Card width — height derived at 5:4 ratio. Default 280. */
  width?: number;
  /** If true, render without animations (for screenshot/export) */
  isStatic?: boolean;
}

export default function StoryCard({
  title,
  heroName,
  quote,
  creatureEmoji = '🌙',
  creatureName = 'SleepSeed',
  nightNumber,
  width = 280,
  isStatic = false,
}: Props) {
  const height = Math.round(width * (350 / 280));

  // Deterministic star positions from title hash
  const stars = useMemo(() => {
    let h = 5381;
    for (let i = 0; i < title.length; i++) h = (h * 33) ^ title.charCodeAt(i);
    return Array.from({ length: 30 }, (_, i) => ({
      x: ((h * (i + 1) * 37) % 1000) / 10,
      y: ((h * (i + 1) * 53) % 600) / 10,
      s: 1 + ((h * (i + 1)) % 3) * 0.4,
      o: 0.15 + ((h * (i + 1)) % 5) * 0.06,
    }));
  }, [title]);

  return (
    <>
      {!isStatic && <style>{CSS}</style>}
      <div
        className="story-card"
        style={{
          width, height, borderRadius: Math.round(width * 0.086),
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(155deg,#0C1840,#1a1060,#0C1840)',
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
          animation: isStatic ? undefined : 'sc-float 6s ease-in-out infinite, sc-fadeUp .6s ease-out',
          fontFamily: "'Nunito',system-ui,sans-serif",
          color: '#F4EFE8',
          flexShrink: 0,
        }}
      >
        {/* Stars */}
        {stars.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.s, height: s.s, borderRadius: '50%',
            background: '#EEE8FF', opacity: s.o,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Shine overlay */}
        {!isStatic && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -20, left: -60,
              width: 40, height: height + 40,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent)',
              animation: 'sc-shine 4s 1s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Creature */}
        <div style={{
          position: 'absolute', top: Math.round(height * 0.12),
          left: '50%', transform: 'translateX(-50%)',
          fontSize: Math.round(width * 0.23), lineHeight: 1, zIndex: 3,
          filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.4))',
          animation: isStatic ? undefined : 'sc-float 5s ease-in-out infinite',
        }}>
          {creatureEmoji}
        </div>

        {/* Content gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '55%', zIndex: 4,
          background: 'linear-gradient(180deg, transparent 0%, rgba(12,24,64,.85) 40%, rgba(12,24,64,.95) 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: `0 ${Math.round(width * 0.07)}px ${Math.round(height * 0.05)}px`,
          zIndex: 6, display: 'flex', flexDirection: 'column',
        }}>
          {/* Meta line */}
          <div style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: Math.max(8, Math.round(width * 0.032)),
            color: 'rgba(244,239,232,.4)',
            letterSpacing: '.06em', textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            {heroName.toUpperCase()}'S STORY
            {nightNumber ? ` · NIGHT ${nightNumber}` : ''}
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif",
            fontSize: Math.max(13, Math.round(width * 0.054)),
            fontWeight: 600, lineHeight: 1.25,
            marginBottom: quote ? 8 : 12,
          }}>
            {title}
          </div>

          {/* Quote */}
          {quote && (
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif",
              fontStyle: 'italic',
              fontSize: Math.max(10, Math.round(width * 0.039)),
              color: 'rgba(244,239,232,.55)',
              lineHeight: 1.5, marginBottom: 12,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}>
              "{quote}"
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(244,239,232,.08)',
            paddingTop: 8, marginTop: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: Math.round(width * 0.05) }}>{creatureEmoji}</span>
              <span style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: Math.max(8, Math.round(width * 0.029)),
                color: 'rgba(244,239,232,.35)', letterSpacing: '.04em',
              }}>
                {creatureName}
              </span>
            </div>
            <span style={{
              fontFamily: "'Fraunces',Georgia,serif",
              fontSize: Math.max(8, Math.round(width * 0.032)),
              color: 'rgba(244,239,232,.25)',
            }}>
              sleepseed
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
