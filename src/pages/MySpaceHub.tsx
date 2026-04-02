import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getDreamKeeperById, V1_DREAMKEEPERS, type DreamKeeper } from '../lib/dreamkeepers';
import type { HatchedCreature, SavedNightCard } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// MySpaceHub — Personal hub: creature, memory orbit, night cards, stories
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.msh{min-height:100vh;min-height:100dvh;background:#060912;font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.msh-inner{max-width:430px;margin:0 auto;padding:0 20px 120px;position:relative;z-index:5}
.msh-scroll{scrollbar-width:none;-webkit-overflow-scrolling:touch}.msh-scroll::-webkit-scrollbar{display:none}

@keyframes msh-idle{0%,100%{transform:scale(1) translateY(0)}25%{transform:scale(1.01) translateY(-2px)}50%{transform:scale(1.02) translateY(-4px)}75%{transform:scale(1.01) translateY(-2px)}}
@keyframes msh-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes msh-glowPulse{0%,100%{opacity:.3}50%{opacity:.55}}
@keyframes msh-orbit{from{transform:rotate(0deg) translateX(var(--orbit-r)) rotate(0deg)}to{transform:rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg)}}
@keyframes msh-twinkle{0%,100%{opacity:.05}50%{opacity:.2}}
@keyframes msh-modalIn{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
`;

// Resolve HatchedCreature → DreamKeeper image
function resolveDreamKeeper(creature: HatchedCreature | null): DreamKeeper | null {
  if (!creature) return null;
  const byId = getDreamKeeperById(creature.creatureType);
  if (byId) return byId;
  const byEmoji = V1_DREAMKEEPERS.find(dk => dk.emoji === creature.creatureEmoji);
  if (byEmoji) return byEmoji;
  return V1_DREAMKEEPERS[0];
}

function hexToRgb(hex: string): string {
  if (!hex || hex.length < 7) return '245,184,76';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '245,184,76';
  return `${r},${g},${b}`;
}

// Orbit dot colors — soft magical palette
const ORBIT_COLORS = [
  '#9A7FD4', '#F5B84C', '#14d890', '#ff82b8', '#82b4ff', '#FFD275', '#C4A7FF',
];

interface Props {
  onSignUp: () => void;
  onReadStory?: (book: any) => void;
}

export default function MySpaceHub({ onSignUp, onReadStory }: Props) {
  const { user, setView, companionCreature } = useApp();

  const [creatures, setCreatures] = useState<HatchedCreature[]>([]);
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [recentCards, setRecentCards] = useState<SavedNightCard[]>([]);
  const [allCards, setAllCards] = useState<SavedNightCard[]>([]);
  const [storyCount, setStoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<SavedNightCard | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [stories, cards, hatched] = await Promise.all([
          getStories(userId),
          getNightCards(userId),
          getAllHatchedCreatures(userId),
        ]);
        if (cancelled) return;
        setRecentStories(stories.slice(0, 6));
        setStoryCount(stories.length);
        setRecentCards(cards.slice(0, 8));
        setAllCards(cards);
        setCreatures(hatched);
      } catch {}
      if (!cancelled) setLoading(false);
    };

    // Phase 1: instant from localStorage
    try {
      const stories: any[] = JSON.parse(localStorage.getItem(`ss2_stories_${userId}`) || '[]');
      const cards: SavedNightCard[] = JSON.parse(localStorage.getItem(`ss2_nightcards_${userId}`) || '[]');
      if (stories.length || cards.length) {
        setRecentStories(stories.slice(0, 6));
        setStoryCount(stories.length);
        setRecentCards(cards.slice(0, 8));
        setAllCards(cards);
        setLoading(false);
      }
    } catch {}

    // Phase 2: Supabase
    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const primaryCreature = companionCreature || creatures[0] || null;
  const dk = resolveDreamKeeper(primaryCreature);
  const creatureImageSrc = dk?.imageSrc;
  const creatureName = primaryCreature?.name || dk?.name || '';
  const creatureColor = primaryCreature?.color || dk?.color || '#F5B84C';
  const rgb = hexToRgb(creatureColor);

  // Growth stage
  const storyN = primaryCreature
    ? allCards.filter(c => c.characterIds?.includes(primaryCreature.characterId)).length
    : storyCount;
  const growthStage = storyN < 3 ? 'Seedling' : storyN < 7 ? 'Sprout' : storyN < 14 ? 'Blooming' : 'Radiant';

  // Orbit cards — up to 7 most recent night cards
  const orbitCards = useMemo(() => allCards.slice(0, 7), [allCards]);

  // Ambient stars
  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 40; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 50,
      s: 1 + Math.random() * 0.7, d: 3 + Math.random() * 4, dl: Math.random() * 5,
    });
    return arr;
  }, []);

  // ── Guest state ────────────────────────────────────────────────────────────
  if (!user || user.isGuest) {
    return (
      <div className="msh">
        <style>{CSS}</style>
        <div className="msh-inner" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2728;</div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 300,
            marginBottom: 12,
          }}>
            Your space is waiting
          </div>
          <div style={{ fontSize: 14, color: 'rgba(244,239,232,.45)', lineHeight: 1.6, marginBottom: 32 }}>
            Sign up to meet your DreamKeeper and start collecting memories.
          </div>
          <button
            onClick={onSignUp}
            style={{
              padding: '16px 40px', border: 'none', borderRadius: 14,
              background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
              color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Nunito',system-ui,sans-serif",
            }}
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="msh">
      <style>{CSS}</style>

      {/* Ambient stars */}
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s, borderRadius: '50%', background: '#EEE8FF',
          pointerEvents: 'none', zIndex: 0,
          animation: `msh-twinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}

      <div className="msh-inner">

        {/* ═══ HEADER ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 52, marginBottom: 24,
          animation: 'msh-fadeUp .5s ease-out',
        }}>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
            fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3,
          }}>
            My Space
          </div>
          <button
            onClick={() => setView('user-profile')}
            style={{
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12, width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(244,239,232,.4)" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* ═══ HATCHERY — DREAMKEEPER SCENE ═══ */}
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 8,
          animation: 'msh-fadeUp .7s .1s ease-out both',
        }}>
          {/* Glow aura */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 280, height: 280, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb},.15) 0%, rgba(${rgb},.05) 40%, transparent 70%)`,
            animation: 'msh-glowPulse 5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Memory orbit */}
          {orbitCards.length > 0 && (
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%,-50%)',
              width: 280, height: 280, borderRadius: '50%',
              pointerEvents: 'none',
            }}>
              {orbitCards.map((card, i) => {
                const angle = (360 / orbitCards.length) * i;
                const duration = 40 + i * 5;
                const color = ORBIT_COLORS[i % ORBIT_COLORS.length];
                const dotSize = 10 + (i === 0 ? 4 : 0);
                return (
                  <div
                    key={card.id || i}
                    onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }}
                    style={{
                      position: 'absolute', left: '50%', top: '50%',
                      width: dotSize, height: dotSize, marginLeft: -dotSize / 2, marginTop: -dotSize / 2,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 8px ${color}66`,
                      '--orbit-r': '130px',
                      animation: `msh-orbit ${duration}s linear infinite`,
                      animationDelay: `${-(duration / orbitCards.length) * i}s`,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 3,
                    } as React.CSSProperties}
                    title={card.headline || card.storyTitle || 'Memory'}
                  />
                );
              })}
            </div>
          )}

          {/* Creature */}
          <div style={{
            width: 180, height: 220,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'msh-idle 7s ease-in-out infinite',
            position: 'relative', zIndex: 4,
          }}>
            {creatureImageSrc ? (
              <img
                src={creatureImageSrc}
                alt={creatureName}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  filter: `drop-shadow(0 0 28px rgba(${rgb},.35))`,
                }}
              />
            ) : (
              <div style={{
                fontSize: 72, lineHeight: 1,
                filter: `drop-shadow(0 0 20px rgba(${rgb},.4))`,
              }}>
                {primaryCreature?.creatureEmoji || dk?.emoji || '\uD83C\uDF19'}
              </div>
            )}
          </div>

          {/* Name + stage */}
          {creatureName && (
            <div style={{ textAlign: 'center', marginTop: 4, position: 'relative', zIndex: 4 }}>
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 400,
                color: '#F4EFE8',
              }}>
                {creatureName}
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: `rgba(${rgb},.55)`, letterSpacing: '.06em',
                textTransform: 'uppercase', marginTop: 2,
              }}>
                {growthStage} &middot; {storyN} {storyN === 1 ? 'night' : 'nights'}
              </div>
            </div>
          )}
        </div>

        {/* ═══ NIGHT CARDS STRIP ═══ */}
        {recentCards.length > 0 && (
          <div style={{ animation: 'msh-fadeUp .7s .3s ease-out both', marginTop: 28, marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
            }}>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}>
                Night Cards
              </div>
              {allCards.length > 5 && (
                <div
                  onClick={() => setView('nightcard-library')}
                  style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(245,184,76,.4)', cursor: 'pointer',
                    letterSpacing: '.04em',
                  }}
                >
                  See all {allCards.length} &rarr;
                </div>
              )}
            </div>
            <div className="msh-scroll" style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
            }}>
              {recentCards.map((card, i) => (
                <div
                  key={card.id || i}
                  onClick={() => setSelectedCard(card)}
                  style={{
                    flexShrink: 0, width: 140, borderRadius: 14, overflow: 'hidden',
                    cursor: 'pointer', transition: 'transform .15s',
                    border: '1px solid rgba(255,255,255,.06)',
                    background: 'rgba(255,255,255,.02)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <div style={{
                    height: 56, position: 'relative', overflow: 'hidden',
                    background: card.isOrigin
                      ? 'linear-gradient(to bottom, #150e05, #2a1808)'
                      : 'linear-gradient(to bottom, #0d1428, #1a1040)',
                  }}>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)', fontSize: 20,
                    }}>
                      {card.creatureEmoji || card.emoji || dk?.emoji || '\uD83C\uDF19'}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                      background: 'linear-gradient(transparent, rgba(15,10,32,.9))',
                    }} />
                  </div>
                  <div style={{ padding: '7px 10px 9px' }}>
                    <div style={{
                      fontFamily: "'Fraunces',Georgia,serif", fontSize: 11, fontWeight: 400,
                      color: '#F4EFE8', lineHeight: 1.3, marginBottom: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}>
                      {card.headline || card.storyTitle || 'A memory'}
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono',monospace", fontSize: 8,
                      color: 'rgba(244,239,232,.2)',
                    }}>
                      {card.date ? new Date(card.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                      {card.nightNumber ? ` \u00B7 Night ${card.nightNumber}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STORIES STRIP ═══ */}
        {recentStories.length > 0 && (
          <div style={{ animation: 'msh-fadeUp .7s .45s ease-out both', marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
            }}>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}>
                Saved Stories
              </div>
              {storyCount > 4 && (
                <div
                  onClick={() => setView('story-library')}
                  style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(245,184,76,.4)', cursor: 'pointer',
                    letterSpacing: '.04em',
                  }}
                >
                  See all {storyCount} &rarr;
                </div>
              )}
            </div>
            <div className="msh-scroll" style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
            }}>
              {recentStories.map((story, i) => (
                <div
                  key={story.id || i}
                  onClick={() => onReadStory?.(story.bookData)}
                  style={{
                    flexShrink: 0, width: 125, padding: '14px 12px 11px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.06)',
                    cursor: 'pointer',
                    transition: 'background .2s, transform .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ fontSize: 18, marginBottom: 5 }}>
                    {primaryCreature?.creatureEmoji || dk?.emoji || '\uD83C\uDF19'}
                  </div>
                  <div style={{
                    fontFamily: "'Fraunces',Georgia,serif", fontSize: 12, fontWeight: 400,
                    color: '#F4EFE8', lineHeight: 1.35,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  } as React.CSSProperties}>
                    {story.title || 'Untitled'}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(244,239,232,.2)', marginTop: 4,
                  }}>
                    {story.date ? new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {!loading && recentCards.length === 0 && recentStories.length === 0 && (
          <div style={{
            animation: 'msh-fadeUp .7s .3s ease-out both',
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 16, padding: '28px 20px', textAlign: 'center',
            marginTop: 20,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{'\u2728'}</div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 300,
              color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 6,
            }}>
              Your memories will orbit here
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(244,239,232,.2)', letterSpacing: '.03em',
            }}>
              Each story creates a Night Card that joins the constellation
            </div>
          </div>
        )}

      </div>

      {/* ═══ NIGHT CARD MODAL ═══ */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            animation: 'msh-fadeUp .15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: selectedCard.isOrigin
                ? 'linear-gradient(175deg, #150e05, #1a1008)'
                : 'linear-gradient(175deg, #0d1428, #0f0a20)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 22, maxWidth: 380, width: '100%',
              padding: '28px 24px', position: 'relative',
              animation: 'msh-modalIn .25s ease',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedCard(null)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(255,255,255,.06)', border: 'none',
                width: 30, height: 30, borderRadius: '50%',
                color: 'rgba(255,255,255,.4)', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              &times;
            </button>

            {/* Emoji */}
            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 12 }}>
              {selectedCard.creatureEmoji || selectedCard.emoji || dk?.emoji || '\uD83C\uDF19'}
            </div>

            {/* Headline */}
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 400,
              textAlign: 'center', lineHeight: 1.4, marginBottom: 10,
            }}>
              {selectedCard.headline || selectedCard.storyTitle}
            </div>

            {/* Quote */}
            {selectedCard.quote && (
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.5)', textAlign: 'center',
                lineHeight: 1.6, marginBottom: 12,
              }}>
                &ldquo;{selectedCard.quote}&rdquo;
              </div>
            )}

            {/* Memory line */}
            {selectedCard.memory_line && (
              <div style={{
                fontSize: 12, color: 'rgba(244,239,232,.35)', textAlign: 'center',
                lineHeight: 1.6, marginBottom: 8,
              }}>
                {selectedCard.memory_line}
              </div>
            )}

            {/* Meta */}
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9,
              color: 'rgba(244,239,232,.2)', textAlign: 'center', marginTop: 8,
            }}>
              {selectedCard.date ? new Date(selectedCard.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              {selectedCard.nightNumber ? ` \u00B7 Night ${selectedCard.nightNumber}` : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
