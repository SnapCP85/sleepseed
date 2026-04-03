import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getDreamKeeperById, V1_DREAMKEEPERS, type DreamKeeper } from '../lib/dreamkeepers';
import type { HatchedCreature, SavedNightCard } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// MySpaceHub — Memory center: creature orbit, last night, memories + stories
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.msh{min-height:100vh;min-height:100dvh;background:#060912;font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.msh-inner{max-width:960px;margin:0 auto;padding:0 20px 120px;position:relative;z-index:5}
@media(min-width:768px){.msh-inner{padding:0 40px 120px}}

@keyframes msh-idle{0%,100%{transform:scale(1) translateY(0)}25%{transform:scale(1.01) translateY(-2px)}50%{transform:scale(1.02) translateY(-4px)}75%{transform:scale(1.01) translateY(-2px)}}
@keyframes msh-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes msh-glowPulse{0%,100%{opacity:.3}50%{opacity:.55}}
@keyframes msh-orbit{from{transform:rotate(0deg) translateX(var(--orbit-r)) rotate(0deg)}to{transform:rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg)}}
@keyframes msh-twinkle{0%,100%{opacity:.05}50%{opacity:.2}}
@keyframes msh-modalIn{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes msh-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

/* nav cards */
.msh-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.msh-nav-card{border-radius:16px;padding:16px;cursor:pointer;transition:all .22s;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;position:relative;overflow:hidden;border:1px solid transparent}
.msh-nav-card:hover{transform:translateY(-2px)}
.msh-nav-card::before{content:'';position:absolute;inset:0;border-radius:16px;opacity:0;transition:opacity .22s}
.msh-nav-card:hover::before{opacity:1}

/* last night card */
.msh-lastnight{border-radius:16px;padding:18px 20px;position:relative;overflow:hidden;cursor:pointer;transition:transform .2s}
.msh-lastnight:hover{transform:translateY(-1px)}

/* memory peek */
.msh-peek{display:flex;flex-direction:column;gap:0}
.msh-peek-item{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.03);display:flex;align-items:center;gap:12px;cursor:pointer;transition:background .15s;margin:0 -4px;padding-left:4px;padding-right:4px;border-radius:8px}
.msh-peek-item:hover{background:rgba(255,255,255,.03)}
.msh-peek-item:last-child{border-bottom:none}
`;

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

const ORBIT_COLORS = ['#9A7FD4', '#F5B84C', '#14d890', '#ff82b8', '#82b4ff', '#FFD275', '#C4A7FF'];

function formatCardDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Tonight';
    if (diff === 1) return 'Last night';
    if (diff < 7) return `${diff} nights ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

interface Props {
  onSignUp: () => void;
  onReadStory?: (book: any) => void;
}

export default function MySpaceHub({ onSignUp, onReadStory }: Props) {
  const { user, setView, companionCreature } = useApp();

  const [creatures, setCreatures] = useState<HatchedCreature[]>([]);
  const [recentStories, setRecentStories] = useState<any[]>([]);
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
          getStories(userId), getNightCards(userId), getAllHatchedCreatures(userId),
        ]);
        if (cancelled) return;
        setRecentStories(stories.slice(0, 6));
        setStoryCount(stories.length);
        setAllCards(cards);
        setCreatures(hatched);
      } catch {}
      if (!cancelled) setLoading(false);
    };

    try {
      const stories: any[] = JSON.parse(localStorage.getItem(`ss2_stories_${userId}`) || '[]');
      const cards: SavedNightCard[] = JSON.parse(localStorage.getItem(`ss2_nightcards_${userId}`) || '[]');
      if (stories.length || cards.length) {
        setRecentStories(stories.slice(0, 6));
        setStoryCount(stories.length);
        setAllCards(cards);
        setLoading(false);
      }
    } catch {}

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

  const storyN = primaryCreature
    ? allCards.filter(c => c.characterIds?.includes(primaryCreature.characterId)).length
    : storyCount;
  const growthStage = storyN < 3 ? 'Seedling' : storyN < 7 ? 'Sprout' : storyN < 14 ? 'Blooming' : 'Radiant';

  const orbitCards = useMemo(() => allCards.slice(0, 7), [allCards]);
  const lastNightCard = allCards[0] || null;
  const recentPeek = allCards.slice(1, 4); // next 3 after the featured one

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
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u2728'}</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 300, marginBottom: 12 }}>
            Your space is waiting
          </div>
          <div style={{ fontSize: 14, color: 'rgba(244,239,232,.45)', lineHeight: 1.6, marginBottom: 32 }}>
            Sign up to meet your DreamKeeper and start collecting memories.
          </div>
          <button onClick={onSignUp} style={{
            padding: '16px 40px', border: 'none', borderRadius: 14,
            background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
            color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Nunito',system-ui,sans-serif",
          }}>
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
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300, fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3 }}>
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

        {/* ═══ DREAMKEEPER SCENE ═══ */}
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
                const duration = 40 + i * 5;
                const color = ORBIT_COLORS[i % ORBIT_COLORS.length];
                const hasPhoto = !!card.photo;
                const dotSize = hasPhoto ? 22 : (10 + (i === 0 ? 4 : 0));
                return (
                  <div
                    key={card.id || i}
                    onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }}
                    style={{
                      position: 'absolute', left: '50%', top: '50%',
                      width: dotSize, height: dotSize, marginLeft: -dotSize / 2, marginTop: -dotSize / 2,
                      borderRadius: '50%',
                      background: card.photo ? 'none' : color,
                      boxShadow: card.photo ? `0 0 10px ${color}44` : `0 0 8px ${color}66`,
                      overflow: 'hidden',
                      '--orbit-r': '130px',
                      animation: `msh-orbit ${duration}s linear infinite`,
                      animationDelay: `${-(duration / orbitCards.length) * i}s`,
                      cursor: 'pointer', pointerEvents: 'auto', zIndex: 3,
                      border: card.photo ? `1.5px solid ${color}88` : 'none',
                    } as React.CSSProperties}
                    title={card.headline || card.storyTitle || 'Memory'}
                  >
                    {card.photo && (
                      <img src={card.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    )}
                  </div>
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
              <img src={creatureImageSrc} alt={creatureName} style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: `drop-shadow(0 0 28px rgba(${rgb},.35))`,
              }} />
            ) : (
              <div style={{ fontSize: 72, lineHeight: 1, filter: `drop-shadow(0 0 20px rgba(${rgb},.4))` }}>
                {primaryCreature?.creatureEmoji || dk?.emoji || '\uD83C\uDF19'}
              </div>
            )}
          </div>

          {/* Name + stage */}
          {creatureName && (
            <div style={{ textAlign: 'center', marginTop: 4, position: 'relative', zIndex: 4 }}>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 400, color: '#F4EFE8' }}>
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

          {orbitCards.length > 0 && (
            <div style={{
              textAlign: 'center', marginTop: 10, position: 'relative', zIndex: 4,
              fontFamily: "'DM Mono',monospace", fontSize: 9,
              color: 'rgba(244,239,232,.25)', letterSpacing: '.03em',
            }}>
              Tap the orbs to view memories
            </div>
          )}
        </div>

        {/* ═══ JOURNEY COUNTER ═══ */}
        {storyN > 0 && (
          <div style={{
            animation: 'msh-fadeUp .7s .25s ease-out both',
            textAlign: 'center', margin: '20px 0 6px',
          }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
              color: 'rgba(245,184,76,.5)', letterSpacing: '.01em',
            }}>
              {storyN} {storyN === 1 ? 'night' : 'nights'} of stories together
            </div>
            {/* Journey line */}
            <div style={{
              margin: '10px auto 0', width: '60%', maxWidth: 200, height: 2,
              borderRadius: 1, background: 'rgba(245,184,76,.1)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 1,
                width: `${Math.min(100, (storyN / 30) * 100)}%`,
                background: 'linear-gradient(90deg, rgba(245,184,76,.35), rgba(245,184,76,.7))',
                transition: 'width .8s ease',
              }} />
            </div>
          </div>
        )}

        {/* ═══ NAV CARDS — side by side ═══ */}
        <div className="msh-nav" style={{ animation: 'msh-fadeUp .7s .3s ease-out both', margin: '20px 0' }}>
          {/* Memories */}
          <div
            className="msh-nav-card"
            onClick={() => setView('nightcard-library')}
            style={{
              background: `linear-gradient(160deg, rgba(${rgb},.06), rgba(154,127,212,.04))`,
              borderColor: 'rgba(154,127,212,.15)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(154,127,212,.3)'; e.currentTarget.style.background = `linear-gradient(160deg, rgba(${rgb},.1), rgba(154,127,212,.08))`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(154,127,212,.15)'; e.currentTarget.style.background = `linear-gradient(160deg, rgba(${rgb},.06), rgba(154,127,212,.04))`; }}
          >
            <div style={{ fontSize: 28, marginBottom: 2, filter: 'drop-shadow(0 0 8px rgba(154,127,212,.4))' }}>{'\uD83C\uDF19'}</div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 500, color: '#F4EFE8' }}>
              Memories
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(154,127,212,.55)', letterSpacing: '.04em' }}>
              {allCards.length} night card{allCards.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Stories */}
          <div
            className="msh-nav-card"
            onClick={() => setView('story-library')}
            style={{
              background: 'linear-gradient(160deg, rgba(245,184,76,.04), rgba(255,210,117,.03))',
              borderColor: 'rgba(245,184,76,.12)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,184,76,.28)'; e.currentTarget.style.background = 'linear-gradient(160deg, rgba(245,184,76,.08), rgba(255,210,117,.06))'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,184,76,.12)'; e.currentTarget.style.background = 'linear-gradient(160deg, rgba(245,184,76,.04), rgba(255,210,117,.03))'; }}
          >
            <div style={{ fontSize: 28, marginBottom: 2, filter: 'drop-shadow(0 0 8px rgba(245,184,76,.4))' }}>{'\uD83D\uDCD6'}</div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 500, color: '#F4EFE8' }}>
              Stories
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,184,76,.5)', letterSpacing: '.04em' }}>
              {storyCount} stor{storyCount !== 1 ? 'ies' : 'y'}
            </div>
          </div>
        </div>


        {/* ═══ EMPTY STATE ═══ */}
        {!loading && allCards.length === 0 && recentStories.length === 0 && (
          <div style={{
            animation: 'msh-fadeUp .7s .3s ease-out both',
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 16, padding: '28px 20px', textAlign: 'center',
            marginTop: 8,
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
            padding: 20, animation: 'msh-fadeUp .15s ease',
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

            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 12 }}>
              {selectedCard.creatureEmoji || selectedCard.emoji || dk?.emoji || '\uD83C\uDF19'}
            </div>

            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 400,
              textAlign: 'center', lineHeight: 1.4, marginBottom: 10,
            }}>
              {selectedCard.headline || selectedCard.storyTitle}
            </div>

            {selectedCard.quote && (
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.5)', textAlign: 'center',
                lineHeight: 1.6, marginBottom: 12,
              }}>
                &ldquo;{selectedCard.quote}&rdquo;
              </div>
            )}

            {selectedCard.memory_line && (
              <div style={{
                fontSize: 12, color: 'rgba(244,239,232,.35)', textAlign: 'center',
                lineHeight: 1.6, marginBottom: 8,
              }}>
                {selectedCard.memory_line}
              </div>
            )}

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
