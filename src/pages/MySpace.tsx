import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards, getCharacters } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getDreamKeeperById, V1_DREAMKEEPERS, type DreamKeeper } from '../lib/dreamkeepers';
import type { Character, HatchedCreature } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// MySpace — The child's calm, magical home screen
// ─────────────────────────────────────────────────────────────────────────────
// Replaces the old dashboard UI. Centered on the DreamKeeper as a living
// companion. Emotional, not informational.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onSignUp: () => void;
  onReadStory?: (book: any) => void;
}

const CSS = `
.ms{min-height:100vh;min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 40%,#0f0a20 100%);font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.ms-inner{max-width:430px;margin:0 auto;padding:0 24px 32px;position:relative;z-index:5}
.ms-scroll-strip{scrollbar-width:none;-webkit-overflow-scrolling:touch}.ms-scroll-strip::-webkit-scrollbar{display:none}

@keyframes ms-creatureIdle{0%,100%{transform:scale(1) translateY(0)}25%{transform:scale(1.015) translateY(-3px)}50%{transform:scale(1.02) translateY(-5px)}75%{transform:scale(1.015) translateY(-3px)}}
@keyframes ms-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes ms-glowPulse{0%,100%{opacity:.35}50%{opacity:.6}}
@keyframes ms-twinkle{0%,100%{opacity:.05}50%{opacity:.22}}
@keyframes ms-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes ms-ctaPulse{0%,100%{box-shadow:0 6px 28px rgba(200,130,20,.25)}50%{box-shadow:0 8px 36px rgba(200,130,20,.42)}}
@keyframes ms-streakGlow{0%,100%{box-shadow:0 0 6px rgba(245,184,76,.25)}50%{box-shadow:0 0 14px rgba(245,184,76,.5)}}

.ms-child-toggle{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:4px;animation:ms-fadeUp .5s ease-out}
.ms-child-pill{display:flex;align-items:center;gap:5px;padding:5px 12px 5px 8px;border-radius:20px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;transition:all .2s;font-family:'Nunito',system-ui,sans-serif;font-size:12px;font-weight:600;color:rgba(244,239,232,.45)}
.ms-child-pill:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.15)}
.ms-child-pill.ms-active{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.35);color:#F5B84C}
.ms-child-pill .ms-pill-emoji{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;background:rgba(255,255,255,.06)}
.ms-child-pill.ms-active .ms-pill-emoji{background:rgba(245,184,76,.15)}
`;

// Resolve a HatchedCreature to a DreamKeeper with a valid imageSrc.
// Tries: exact ID → emoji match → default (owl).
function resolveDreamKeeper(creature: HatchedCreature | null): DreamKeeper | null {
  if (!creature) return null;
  // 1. Primary: match by creatureType (id)
  const byId = getDreamKeeperById(creature.creatureType);
  if (byId) return byId;
  // 2. Fallback: match by emoji
  const byEmoji = V1_DREAMKEEPERS.find(dk => dk.emoji === creature.creatureEmoji);
  if (byEmoji) return byEmoji;
  // 3. Default: owl (always exists)
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

/** Calculate consecutive-day streak from night cards (most recent backwards). */
function calcStreak(cards: { date: string }[]): number {
  if (!cards.length) return 0;
  // Unique dates (YYYY-MM-DD), sorted descending
  const dates = [...new Set(cards.map(c => c.date?.slice(0, 10)).filter(Boolean))].sort().reverse();
  if (!dates.length) return 0;

  const toDay = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.floor(new Date(y, m - 1, d).getTime() / 86400000);
  };

  // The most recent card must be today or yesterday to count
  const todayDay = toDay(new Date().toISOString().slice(0, 10));
  const latestDay = toDay(dates[0]);
  if (todayDay - latestDay > 1) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    if (toDay(dates[i - 1]) - toDay(dates[i]) === 1) streak++;
    else break;
  }
  return streak;
}

export default function MySpace({ onSignUp, onReadStory }: Props) {
  const { user, setView, companionCreature, setCompanionCreature, selectedCharacter, setSelectedCharacter } = useApp();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [allStories, setAllStories] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [allCreatures, setAllCreatures] = useState<HatchedCreature[]>([]);
  const [storyCount, setStoryCount] = useState(0);
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  // ── Data loading (same two-phase pattern as UserDashboard) ──────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    // Phase 1: instant from localStorage
    try {
      const chars: Character[] = JSON.parse(localStorage.getItem(`ss2_chars_${userId}`) || '[]');
      const stories: any[] = JSON.parse(localStorage.getItem(`ss2_stories_${userId}`) || '[]');
      const cards: any[] = JSON.parse(localStorage.getItem(`ss2_nightcards_${userId}`) || '[]');
      if (chars.length || stories.length || cards.length) {
        setCharacters(chars);
        setAllStories(stories);
        setAllCards(cards);
        setStoryCount(stories.length);
        setRecentStories(stories.slice(-5).reverse());
        setRecentCards(cards.slice(-5).reverse());
        setCardCount(cards.length);
        setStreak(calcStreak(cards));
        setLoading(false);
      }
    } catch {}

    // Phase 2: refresh from Supabase
    Promise.all([
      getCharacters(userId),
      getStories(userId),
      getNightCards(userId),
      getAllHatchedCreatures(userId),
    ]).then(([chars, stories, cards, creatures]) => {
      if (cancelled) return;
      setCharacters(chars);
      setAllStories(stories);
      setAllCards(cards);
      setAllCreatures(creatures);
      setStoryCount(stories.length);
      setRecentStories(stories.slice(-5).reverse());
      setRecentCards(cards.slice(-5).reverse());
      setCardCount(cards.length);
      setStreak(calcStreak(cards));
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId]);

  // ── Multi-child: family characters ─────────────────────────────────────────
  const familyChildren = useMemo(
    () => characters.filter(c => c.isFamily && c.type === 'human'),
    [characters],
  );
  const hasMultipleChildren = familyChildren.length > 1;

  // Determine which child is active — default to selectedCharacter or first family child
  const activeChild = useMemo(() => {
    if (selectedCharacter && familyChildren.some(c => c.id === selectedCharacter.id)) {
      return selectedCharacter;
    }
    return familyChildren[0] || characters[0] || null;
  }, [selectedCharacter, familyChildren, characters]);

  // When active child changes, update filtered data
  useEffect(() => {
    if (!activeChild || !hasMultipleChildren) return;
    // Filter stories and cards by the active child's character ID
    const childId = activeChild.id;
    const filteredStories = allStories.filter(
      s => !s.characterIds?.length || s.characterIds.includes(childId) || s.heroName === activeChild.name
    );
    const filteredCards = allCards.filter(
      c => !c.characterIds?.length || c.characterIds.includes(childId) || c.heroName === activeChild.name
    );
    setStoryCount(filteredStories.length);
    setRecentStories(filteredStories.slice(-5).reverse());
    setRecentCards(filteredCards.slice(-5).reverse());
    setCardCount(filteredCards.length);
    setStreak(calcStreak(filteredCards));

    // Switch companion creature to match active child
    const childCreature = allCreatures.find(cr => cr.characterId === childId);
    if (childCreature && childCreature.id !== companionCreature?.id) {
      setCompanionCreature(childCreature);
    }
  }, [activeChild?.id, hasMultipleChildren, allStories, allCards, allCreatures]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChildSwitch = (child: Character) => {
    setSelectedCharacter(child);
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const primaryChild = activeChild || characters.find(c => c.isFamily && c.type === 'human') || characters[0];
  const childName = primaryChild?.name || user?.displayName || 'friend';

  // First-time detection
  const isFirstTime = storyCount === 0 && cardCount === 0;

  // DreamKeeper image lookup — resolves by ID, emoji, or falls back to default
  const dk = resolveDreamKeeper(companionCreature);
  const creatureImageSrc = dk?.imageSrc;
  const creatureName = companionCreature?.name || dk?.name || '';
  const creatureColor = companionCreature?.color || dk?.color || '#F5B84C';
  const creatureEmoji = companionCreature?.creatureEmoji || dk?.emoji || '🌙';
  const rgb = hexToRgb(creatureColor);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ── Stars ──────────────────────────────────────────────────────────────────
  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 50; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 60,
      s: 1 + Math.random() * 0.8, d: 3 + Math.random() * 4, dl: Math.random() * 5,
    });
    return arr;
  }, []);

  // ── Guest state ────────────────────────────────────────────────────────────
  if (!user || user.isGuest) {
    return (
      <div className="ms">
        <style>{CSS}</style>
        <div className="ms-inner" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 300,
            marginBottom: 12,
          }}>
            Your space is waiting
          </div>
          <div style={{ fontSize: 14, color: 'rgba(244,239,232,.45)', lineHeight: 1.6, marginBottom: 32 }}>
            Sign up to meet your DreamKeeper and start your story.
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
    <div className="ms">
      <style>{CSS}</style>

      {/* Ambient stars */}
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s, borderRadius: '50%', background: '#EEE8FF',
          pointerEvents: 'none', zIndex: 0,
          animation: `ms-twinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}

      <div className="ms-inner">

        {/* ═══ 1. HEADER ═══ */}
        <div style={{
          paddingTop: 52, marginBottom: 8, textAlign: 'center',
          animation: 'ms-fadeUp .6s ease-out',
        }}>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
            fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3,
          }}>
            {greeting}, {childName}
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 11,
            color: 'rgba(244,239,232,.3)', marginTop: 6, letterSpacing: '.03em',
          }}>
            {storyCount > 0
              ? `${storyCount} ${storyCount === 1 ? 'story' : 'stories'} so far`
              : 'This is where your stories will live'
            }
          </div>
        </div>

        {/* ═══ 1a. CHILD TOGGLE (multi-child) ═══ */}
        {hasMultipleChildren && (
          <div className="ms-child-toggle" style={{ paddingTop: 4, marginBottom: 6 }}>
            {familyChildren.map(child => (
              <div
                key={child.id}
                className={`ms-child-pill${activeChild?.id === child.id ? ' ms-active' : ''}`}
                onClick={() => handleChildSwitch(child)}
              >
                <span className="ms-pill-emoji">{child.emoji || '🌙'}</span>
                <span>{child.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* ═══ 1b. STREAK PILL ═══ */}
        {streak > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            marginBottom: 4, marginTop: 2,
            animation: 'ms-fadeUp .7s .1s ease-out both',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(245,184,76,.08)',
              border: '1px solid rgba(245,184,76,.15)',
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(245,184,76,.7)', letterSpacing: '.03em',
              ...(streak >= 7 ? { animation: 'ms-streakGlow 3s ease-in-out infinite' } : {}),
            }}>
              <span style={{ fontSize: 11, lineHeight: 1 }}>{'\uD83D\uDD25'}</span>
              <span>{streak} night streak</span>
            </div>
          </div>
        )}

        {/* ═══ 2. DREAMKEEPER SCENE ═══ */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          margin: '16px 0 20px', position: 'relative',
          animation: 'ms-fadeUp .8s .15s ease-out both',
        }}>
          {/* Glow backdrop */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 240, height: 240, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb},${isFirstTime ? '.18' : '.1'}) 0%, transparent 70%)`,
            animation: 'ms-glowPulse 5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Creature image or emoji fallback */}
          <div style={{
            width: 200, height: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ms-creatureIdle 7s ease-in-out infinite',
            position: 'relative', zIndex: 2,
          }}>
            {creatureImageSrc ? (
              <img
                src={creatureImageSrc}
                alt={creatureName}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  filter: `drop-shadow(0 0 ${isFirstTime ? '32' : '24'}px rgba(${rgb},${isFirstTime ? '.45' : '.3'}))`,
                }}
              />
            ) : (
              <div style={{
                fontSize: 80, lineHeight: 1,
                filter: `drop-shadow(0 0 20px rgba(${rgb},.4))`,
              }}>
                {creatureEmoji}
              </div>
            )}
          </div>

          {/* Creature name */}
          {creatureName && (
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: `rgba(${rgb},.6)`, letterSpacing: '.08em',
              textTransform: 'uppercase', marginTop: 4,
            }}>
              {creatureName}
            </div>
          )}
        </div>

        {/* ═══ 3. PRIMARY CTA ═══ */}
        <div style={{
          margin: '8px 0 28px',
          animation: 'ms-fadeUp .8s .3s ease-out both',
        }}>
          <button
            onClick={() => setView('ritual-starter')}
            style={{
              width: '100%', padding: '18px 24px', border: 'none', borderRadius: 16,
              background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
              color: '#080200', fontSize: 17, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Nunito',system-ui,sans-serif",
              animation: 'ms-ctaPulse 3s ease-in-out infinite',
              transition: 'transform .15s, filter .15s',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
          >
            {isFirstTime ? 'Start your first story' : 'Start tonight\u2019s story'}
            <span style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'ms-shimmer 3.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          </button>
        </div>

        {/* ═══ 4. MEMORY STRIP ═══ */}
        {recentStories.length > 0 && (
          <div style={{ animation: 'ms-fadeUp .8s .45s ease-out both', marginBottom: 28 }}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              Recent stories
            </div>
            <div className="ms-scroll-strip" style={{
              display: 'flex', gap: 10, overflowX: 'auto',
              paddingBottom: 4,
            }}>
              {recentStories.map((story, i) => (
                <div
                  key={story.id || i}
                  onClick={() => onReadStory?.(story.bookData)}
                  style={{
                    flexShrink: 0, width: 130, padding: '14px 14px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.06)',
                    cursor: 'pointer',
                    transition: 'background .2s, transform .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>
                    {creatureEmoji}
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

        {/* ═══ 4b. NIGHT CARD MEMORIES ═══ */}
        {recentCards.length > 0 ? (
          <div style={{ animation: 'ms-fadeUp .8s .5s ease-out both', marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
            }}>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}>
                Tonight's memories
              </div>
              {cardCount > 3 && (
                <div
                  onClick={() => setView('nightcard-library')}
                  style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(245,184,76,.4)', cursor: 'pointer',
                    letterSpacing: '.04em',
                  }}
                >
                  See all {cardCount} →
                </div>
              )}
            </div>
            <div className="ms-scroll-strip" style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
            }}>
              {recentCards.map((card: any, i: number) => (
                <div
                  key={card.id || i}
                  onClick={() => setView('nightcard-library')}
                  style={{
                    flexShrink: 0, width: 150, borderRadius: 14, overflow: 'hidden',
                    cursor: 'pointer', transition: 'transform .15s',
                    border: '1px solid rgba(255,255,255,.06)',
                    background: 'rgba(255,255,255,.02)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  {/* Mini sky */}
                  <div style={{
                    height: 60, position: 'relative', overflow: 'hidden',
                    background: card.isOrigin
                      ? 'linear-gradient(to bottom, #150e05, #2a1808)'
                      : 'linear-gradient(to bottom, #0d1428, #1a1040)',
                  }}>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)', fontSize: 22,
                    }}>
                      {card.creatureEmoji || card.emoji || creatureEmoji}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                      background: 'linear-gradient(transparent, rgba(15,10,32,.9))',
                    }} />
                  </div>
                  {/* Info */}
                  <div style={{ padding: '8px 10px 10px' }}>
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
                      {card.nightNumber ? ` · Night ${card.nightNumber}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isFirstTime ? (
          <div style={{
            animation: 'ms-fadeUp .8s .5s ease-out both', marginBottom: 28,
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 16, padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌙</div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
              color: 'rgba(244,239,232,.45)', lineHeight: 1.6, marginBottom: 4,
            }}>
              Your first memory will appear here tonight
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(244,239,232,.2)', letterSpacing: '.03em',
            }}>
              Every story creates a Night Card worth keeping
            </div>
          </div>
        ) : null}

        {/* ═══ 5. GROWTH SECTION ═══ */}
        <div style={{
          animation: 'ms-fadeUp .8s .6s ease-out both',
          background: 'rgba(255,255,255,.02)',
          border: '1px solid rgba(255,255,255,.05)',
          borderRadius: 16, padding: '18px 20px',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          {isFirstTime ? (
            <>
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 300,
                color: 'rgba(244,239,232,.5)', lineHeight: 1.6,
              }}>
                {creatureName
                  ? `${creatureName} is waiting for its first story`
                  : 'Your DreamKeeper is waiting for its first story'}
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(244,239,232,.2)', marginTop: 8, letterSpacing: '.03em',
              }}>
                Every night together makes the bond stronger
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 300,
                color: 'rgba(244,239,232,.6)', marginBottom: 6,
              }}>
                {creatureName ? `${creatureName} is growing` : 'Your DreamKeeper is growing'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                <div>
                  <div style={{
                    fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 400,
                    color: creatureColor,
                  }}>
                    {storyCount}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(244,239,232,.25)', letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}>
                    {storyCount === 1 ? 'Night' : 'Nights'}
                  </div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
                <div>
                  <div style={{
                    fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 400,
                    color: creatureColor,
                  }}>
                    {cardCount}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(244,239,232,.25)', letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}>
                    {cardCount === 1 ? 'Memory' : 'Memories'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
