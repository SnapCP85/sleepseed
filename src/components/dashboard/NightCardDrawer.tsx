import type { SavedNightCard } from '../../lib/types';
import { getCardVariant } from '../../lib/types';
import { VARIANT_RGB } from '../../lib/designTokens';

interface NightCardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterIndex: number | null;
  nightCards: SavedNightCard[];
  onReadChapter?: (chapterIndex: number) => void;
}

export default function NightCardDrawer({
  isOpen, onClose, chapterIndex, nightCards, onReadChapter,
}: NightCardDrawerProps) {
  const card = chapterIndex !== null ? nightCards[chapterIndex] ?? null : null;
  const variant = card ? getCardVariant(card) : 'standard';
  const rgb = VARIANT_RGB[variant] || VARIANT_RGB.standard;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: isOpen ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,0)',
          zIndex: 200, transition: 'background .28s',
          pointerEvents: isOpen ? 'all' : 'none',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', bottom: 76, left: 0, right: 0,
        zIndex: 201,
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .34s cubic-bezier(.22,.8,.3,1)',
      }}>
        <div style={{
          background: '#0C1840',
          borderTop: '1px solid rgba(255,255,255,.09)',
          borderRadius: '22px 22px 0 0',
          padding: '0 0 20px', overflow: 'hidden',
        }}>
          {/* Drag pill */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,.14)',
            margin: '14px auto 4px',
          }} />

          {card && (
            <>
              {/* Card content */}
              <div style={{
                margin: '12px 20px 0', borderRadius: 18, overflow: 'hidden',
                background: `linear-gradient(148deg,rgba(${rgb},.16),rgba(9,16,52,.98))`,
                border: `1px solid rgba(${rgb},.2)`, padding: 20,
              }}>
                {/* Chapter label */}
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 8.5, fontWeight: 600,
                  color: `rgba(${rgb},1)`, letterSpacing: '1.2px',
                  textTransform: 'uppercase', marginBottom: 12,
                }}>
                  CH. {(chapterIndex ?? 0) + 1} &middot; NIGHT CARD
                </div>

                {/* Illustration zone */}
                <div style={{
                  height: 116, borderRadius: 14,
                  background: 'linear-gradient(180deg,rgba(10,14,32,.9),rgba(6,9,18,.95))',
                  marginBottom: 14, position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* Stars */}
                  {[...Array(12)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${10 + (i * 7.3) % 80}%`,
                      top: `${8 + (i * 11.7) % 60}%`,
                      width: i % 3 === 0 ? 2.5 : 1.5,
                      height: i % 3 === 0 ? 2.5 : 1.5,
                      borderRadius: '50%',
                      background: `rgba(${rgb},.${20 + (i % 4) * 10})`,
                    }} />
                  ))}
                  {/* Moon */}
                  <div style={{
                    position: 'absolute', top: 14, right: 18,
                    width: 22, height: 22, borderRadius: '50%',
                    background: `rgba(${rgb},.25)`,
                    boxShadow: `0 0 20px rgba(${rgb},.15)`,
                  }} />
                  {/* Emoji */}
                  <span style={{ fontSize: 36, position: 'relative', zIndex: 1 }}>
                    {card.emoji || card.creatureEmoji || '🌙'}
                  </span>
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 900,
                  color: '#F4EFE8', lineHeight: 1.25, marginBottom: 10,
                }}>
                  {card.storyTitle || 'A night to remember'}
                </div>

                {/* Quote */}
                {card.quote && (
                  <div style={{
                    borderLeft: `2px solid rgba(${rgb},.4)`, paddingLeft: 12,
                    fontFamily: "'Lora',serif", fontSize: 12.5, fontStyle: 'italic',
                    color: 'rgba(234,242,255,.5)', lineHeight: 1.65, marginBottom: 12,
                  }}>
                    "{card.quote}"
                  </div>
                )}

                {/* Attribution */}
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 9,
                  color: 'rgba(234,242,255,.28)',
                }}>
                  {card.heroName} &middot; Night {card.nightNumber || (chapterIndex ?? 0) + 1}
                </div>
              </div>

              {/* Action row */}
              <div style={{ margin: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={() => onReadChapter?.(chapterIndex ?? 0)}
                  style={{
                    padding: '11px 8px', borderRadius: 14,
                    border: `1.5px solid rgba(${rgb},.26)`,
                    background: `rgba(${rgb},.09)`,
                    color: `rgba(${rgb},1)`,
                    fontFamily: "'DM Mono',monospace", fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Read chapter →
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '11px 8px', borderRadius: 14,
                    border: '1px solid rgba(234,242,255,.1)',
                    background: 'transparent',
                    color: 'rgba(234,242,255,.4)',
                    fontFamily: "'DM Mono',monospace", fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
