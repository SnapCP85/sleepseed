import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getDreamKeeperById, V1_DREAMKEEPERS, type DreamKeeper } from '../lib/dreamkeepers';
import type { HatchedCreature, SavedNightCard } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// MySpaceHub — "The Creature's Night"
// ─────────────────────────────────────────────────────────────────────────────

type Stage = 'seedling' | 'sprout' | 'blooming' | 'radiant';

function stageFromCount(n: number): Stage {
  if (n < 3) return 'seedling';
  if (n < 7) return 'sprout';
  if (n < 14) return 'blooming';
  return 'radiant';
}

function stageLabel(s: Stage): string {
  return { seedling: 'Seedling', sprout: 'Sprout', blooming: 'Blooming', radiant: 'Radiant' }[s];
}

const NUMBER_WORDS = [
  'Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
  'Seventeen','Eighteen','Nineteen','Twenty','Twenty-one','Twenty-two',
  'Twenty-three','Twenty-four','Twenty-five','Twenty-six','Twenty-seven',
  'Twenty-eight','Twenty-nine','Thirty',
];

function nightsWord(n: number): string {
  return n >= 0 && n <= 30 ? NUMBER_WORDS[n] : String(n);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#9482ff').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveDreamKeeper(creature: HatchedCreature | null): DreamKeeper | null {
  if (!creature) return null;
  const byId = getDreamKeeperById(creature.creatureType);
  if (byId) return byId;
  const byEmoji = V1_DREAMKEEPERS.find(dk => dk.emoji === creature.creatureEmoji);
  if (byEmoji) return byEmoji;
  return V1_DREAMKEEPERS[0];
}

function buildPersonalityLines(c: HatchedCreature): string[] {
  const name = c.name;
  const traits = c.personalityTraits || [];
  const dream = (c.dreamAnswer || '')
    .replace(/^i dream(s?)\s*(about|of)?\s*/i, '')
    .replace(/[.!?]$/, '')
    .trim();
  const lines: string[] = [];
  if (dream) lines.push(`${name} dreams of ${dream}.`);
  if (traits.length >= 2) lines.push(`${name} is ${traits[0]} and ${traits[1]}.`);
  lines.push(`${name} remembers the shape of every silence.`);
  lines.push(`${name} waits for the quiet only you bring.`);
  return lines;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MemoriesObject({ count, creatureEmoji, onOpen }: { count: number; creatureEmoji: string; onOpen: () => void }) {
  const stars = useMemo(() => [
    { top: 14, left: 18, big: true }, { top: 30, left: 48, big: false },
    { top: 10, left: 72, big: true }, { top: 42, left: 82, big: false },
    { top: 24, left: 32, big: false }, { top: 54, left: 58, big: true },
    { top: 62, left: 22, big: false },
  ], []);
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } };
  return (
    <div className="msh-memories" onClick={onOpen} onKeyDown={handleKey} role="button" tabIndex={0} aria-label={`Open Memories, ${count} Night Cards`}>
      <div className="msh-mem-stack" />
      <div className="msh-mem-card">
        <div className="msh-mem-sky">
          {stars.map((s, i) => <span key={i} className={`msh-star${s.big ? ' big' : ''}`} style={{ top: `${s.top}%`, left: `${s.left}%` }} />)}
          <div className="msh-mem-sky-creature">{creatureEmoji}</div>
        </div>
        <div className="msh-mem-body">
          <div className="msh-mem-title">Memories</div>
          <div className="msh-mem-count">{count} night{count !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  );
}

function BookObject({ count, onOpen }: { count: number; onOpen: () => void }) {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } };
  return (
    <div className="msh-book" onClick={onOpen} onKeyDown={handleKey} role="button" tabIndex={0} aria-label={`Open Stories, ${count} Stories`}>
      <div className="msh-book-glow-under" />
      <div className="msh-book-spine" />
      <div className="msh-book-cover">
        <div className="msh-book-ornament">◆ ◆ ◆</div>
        <div className="msh-book-title">Stories</div>
        <div className="msh-book-count">{count} stor{count !== 1 ? 'ies' : 'y'}</div>
      </div>
    </div>
  );
}

function Tracker({ nightCards, stories }: { nightCards: number; stories: number }) {
  return (
    <div className="msh-tracker" role="group" aria-label="Archive totals">
      <div className="msh-tracker-rule" />
      <div className="msh-tracker-row">
        <div className="msh-tracker-group">
          <div className="msh-tracker-num">{nightCards}</div>
          <div className="msh-tracker-label">Night Cards</div>
        </div>
        <div className="msh-tracker-orn" aria-hidden="true">◆</div>
        <div className="msh-tracker-group">
          <div className="msh-tracker-num">{stories}</div>
          <div className="msh-tracker-label">Stories</div>
        </div>
      </div>
      <div className="msh-tracker-rule" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface Props { onSignUp: () => void; onReadStory?: (book: any) => void; }

export default function MySpaceHub({ onSignUp, onReadStory }: Props) {
  const { user, setView, companionCreature } = useApp();
  const [creatures, setCreatures] = useState<HatchedCreature[]>([]);
  const [allCards, setAllCards] = useState<SavedNightCard[]>([]);
  const [storyCount, setStoryCount] = useState(0);
  const [personalityIdx, setPersonalityIdx] = useState(0);
  const [personalityVisible, setPersonalityVisible] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    // Optimistic from localStorage
    try {
      const stories: any[] = JSON.parse(localStorage.getItem(`ss2_stories_${userId}`) || '[]');
      const cards: SavedNightCard[] = JSON.parse(localStorage.getItem(`ss2_nightcards_${userId}`) || '[]');
      if (stories.length || cards.length) {
        setStoryCount(stories.length);
        setAllCards(cards);
      }
    } catch {}

    // Async hydrate
    (async () => {
      try {
        const [stories, cards, hatched] = await Promise.all([
          getStories(userId), getNightCards(userId), getAllHatchedCreatures(userId),
        ]);
        if (cancelled) return;
        setStoryCount(Array.isArray(stories) ? stories.length : 0);
        setAllCards(cards);
        setCreatures(hatched);
      } catch (e) { console.error('MySpaceHub load failed', e); }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // ── Derived ──
  const primaryCreature = companionCreature || creatures[0] || null;
  const dk = resolveDreamKeeper(primaryCreature);
  const creatureImg = dk?.imageSrc;
  const creatureName = primaryCreature?.name || dk?.name || '';
  const creatureColor = primaryCreature?.color || dk?.color || '#F5B84C';
  const creatureEmoji = primaryCreature?.creatureEmoji || dk?.emoji || '🌙';
  const nights = allCards.length;
  const stage = useMemo<Stage>(() => stageFromCount(storyCount), [storyCount]);

  const personalityLines = useMemo(() => primaryCreature ? buildPersonalityLines(primaryCreature) : [], [primaryCreature]);

  const cyclePersonality = () => {
    if (personalityLines.length === 0) return;
    setPersonalityVisible(false);
    setTimeout(() => {
      setPersonalityIdx(i => (i + 1) % personalityLines.length);
      setPersonalityVisible(true);
    }, 300);
  };

  // ── Insights patterns ──
  const patterns = useMemo(() => {
    if (allCards.length < 3) return null;
    // Most common mood
    const moodCounts: Record<string, number> = {};
    allCards.forEach(c => { if (c.childMood) moodCounts[c.childMood] = (moodCounts[c.childMood] || 0) + 1; });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    // Tag frequency
    const tagCounts: Record<string, number> = {};
    allCards.forEach(c => { c.tags?.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    // Longest streak
    const dates = [...new Set(allCards.map(c => c.date?.slice(0, 10)).filter(Boolean))].sort();
    let longest = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000);
      if (diff === 1) { cur++; longest = Math.max(longest, cur); } else { cur = 1; }
    }
    return { totalMemories: allCards.length, topMood: topMood ? { emoji: topMood[0], count: topMood[1] } : null, topTags, longestStreak: longest };
  }, [allCards]);

  const sanctuaryBg = `radial-gradient(circle at 50% 50%, ${hexToRgba(creatureColor, 0.28)} 0%, ${hexToRgba(creatureColor, 0.14)} 22%, ${hexToRgba(creatureColor, 0.06)} 38%, transparent 62%)`;
  const creatureFilter = `drop-shadow(0 0 30px ${hexToRgba(creatureColor, 0.55)}) drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 60px ${hexToRgba(creatureColor, 0.35)})`;

  // ── Guest state ──
  if (!user || user.isGuest) {
    return (
      <div className="msh-root">
        <style>{CSS}</style>
        <div className="msh-guest">
          <div className="msh-guest-title">Your creature is waiting.</div>
          <div className="msh-guest-sub">Sign up to meet your DreamKeeper and begin the ritual.</div>
          <button className="msh-guest-btn" onClick={onSignUp}>Begin →</button>
        </div>
      </div>
    );
  }

  // ── No creature yet ──
  if (!primaryCreature) {
    return (
      <div className="msh-root">
        <style>{CSS}</style>
        <div className="msh-guest">
          <div className="msh-guest-title">No DreamKeeper yet.</div>
          <div className="msh-guest-sub">Complete onboarding to hatch your first companion.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`msh-root msh-stage-${stage}`}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div className="msh-topbar">
        <div className="msh-title">My Space</div>
        <button
          className="msh-top-btn"
          onClick={() => setView('user-profile')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView('user-profile'); } }}
          aria-label="Settings"
        >⚙</button>
      </div>

      {/* Scene */}
      <div className="msh-scene">
        <div className="msh-sanctuary" style={{ background: sanctuaryBg }} />

        {/* Fireflies */}
        {stage !== 'seedling' && <><div className="msh-firefly f1" /><div className="msh-firefly f2" /></>}
        {(stage === 'blooming' || stage === 'radiant') && <><div className="msh-firefly f3" /><div className="msh-firefly f4" /></>}
        {stage === 'radiant' && <><div className="msh-firefly f5" /><div className="msh-firefly f6" /></>}

        {/* Personality line */}
        {personalityLines.length > 0 && (
          <div
            className="msh-personality"
            onClick={cyclePersonality}
            aria-live="polite"
            style={{ opacity: personalityVisible ? 0.72 : 0 }}
          >
            {personalityLines[personalityIdx]}
          </div>
        )}

        {/* Creature row */}
        <div className="msh-creature-row">
          <MemoriesObject count={nights} creatureEmoji={creatureEmoji} onOpen={() => setView('nightcard-library')} />

          <div className="msh-creature-wrap" onClick={cyclePersonality} style={{ filter: creatureFilter }}>
            {creatureImg ? (
              <img src={creatureImg} alt={creatureName} className="msh-creature-img" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="msh-creature-emoji">{creatureEmoji}</div>
            )}
          </div>

          <BookObject count={storyCount} onOpen={() => setView('story-library')} />
        </div>

        {/* Identity */}
        <div className="msh-identity">
          <div className="msh-name">{creatureName}</div>
          <div className="msh-stage">{stageLabel(stage)}</div>
        </div>

        {/* Quiet line */}
        <div className="msh-quiet-line">
          <span className="msh-accent">{nightsWord(nights)} night{nights !== 1 ? 's' : ''}</span> woven together.
        </div>

        {/* Tracker */}
        <Tracker nightCards={nights} stories={storyCount} />

        {/* ═══ Companions ═══ */}
        {creatures.length > 1 && (
          <div className="msh-companions">
            <div className="msh-companions-label">Companions</div>
            <div className="msh-companions-row">
              {creatures.map(c => {
                const isActive = c.id === primaryCreature?.id;
                const cColor = c.color || '#F5B84C';
                return (
                  <div
                    key={c.id}
                    className={`msh-companion-avatar${isActive ? ' active' : ''}`}
                    style={{
                      borderColor: isActive ? cColor : 'rgba(255,255,255,.1)',
                      boxShadow: isActive ? `0 0 12px ${cColor}40` : 'none',
                    }}
                    title={`${c.name} — ${c.creatureEmoji}`}
                  >
                    <span className="msh-companion-emoji">{c.creatureEmoji}</span>
                    <div className="msh-companion-name">{c.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Insights ═══ */}
        {patterns && (
          <div className="msh-insights">
            {/* Growth strip */}
            {allCards.length >= 5 && (
              <div className="msh-growth">
                <div className="msh-insights-label">The journey so far</div>
                <div className="msh-growth-strip">
                  {[...allCards].sort((a, b) => a.date.localeCompare(b.date)).map((card, i, arr) => {
                    const isMilestone = card.milestone || card.isOrigin;
                    const isToday = card.date?.startsWith(new Date().toISOString().slice(0, 10));
                    const h = isMilestone ? 36 : 14 + Math.random() * 14;
                    const bg = card.isOrigin
                      ? 'rgba(245,184,76,.55)'
                      : card.milestone
                      ? 'rgba(200,140,255,.45)'
                      : isToday
                      ? 'rgba(20,216,144,.45)'
                      : card.childMood
                      ? 'rgba(154,127,212,.28)'
                      : 'rgba(244,239,232,.1)';
                    return (
                      <div
                        key={card.id || i}
                        title={card.headline}
                        style={{
                          width: Math.max(4, Math.min(7, 280 / arr.length)),
                          height: h, borderRadius: 2,
                          background: bg, flexShrink: 0,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="msh-growth-range">
                  <span>{(() => { try { return new Date(allCards[allCards.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); } catch { return ''; } })()}</span>
                  <span>today</span>
                </div>
              </div>
            )}

            {/* Patterns grid */}
            <div className="msh-patterns">
              <div className="msh-pattern-card" style={{ background: 'rgba(245,184,76,.03)', borderColor: 'rgba(245,184,76,.1)' }}>
                <div className="msh-pattern-value" style={{ color: 'rgba(245,184,76,.65)' }}>{patterns.totalMemories}</div>
                <div className="msh-pattern-label">memories</div>
              </div>
              <div className="msh-pattern-card" style={{ background: 'rgba(245,130,20,.03)', borderColor: 'rgba(245,130,20,.1)' }}>
                <div className="msh-pattern-value" style={{ color: 'rgba(245,130,20,.65)' }}>{patterns.longestStreak}</div>
                <div className="msh-pattern-label">longest streak</div>
              </div>
              {patterns.topMood && (
                <div className="msh-pattern-card" style={{ background: 'rgba(154,127,212,.03)', borderColor: 'rgba(154,127,212,.1)' }}>
                  <div className="msh-pattern-value">{patterns.topMood.emoji}</div>
                  <div className="msh-pattern-label">most common mood</div>
                </div>
              )}
              {patterns.topTags.length > 0 && (
                <div className="msh-pattern-card" style={{ background: 'rgba(20,216,144,.03)', borderColor: 'rgba(20,216,144,.1)' }}>
                  <div className="msh-pattern-value msh-pattern-tags" style={{ color: 'rgba(20,216,144,.55)' }}>{patterns.topTags.join(', ')}</div>
                  <div className="msh-pattern-label">favorite themes</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
.msh-root {
  --night: #060912;
  --amber: #F5B84C;
  --amber-deep: #a8782b;
  --cream: #F4EFE8;
  --cream-dim: #d8d1c5;
  --ink: #2a2620;
  --ink-faint: #9a9185;
  --purple-soft: #9A7FD4;

  min-height: 100vh;
  background:
    radial-gradient(ellipse 90% 35% at 50% 0%, #141c30 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 45%, rgba(148,130,255,0.06) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 20% 75%, rgba(245,184,76,0.035) 0%, transparent 60%),
    var(--night);
  font-family: 'Nunito', sans-serif;
  color: var(--cream);
  padding: 44px 20px 120px;
  overflow-x: hidden;
  position: relative;
}
.msh-root::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 8%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1px 1px at 28% 15%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.5px 1.5px at 45% 10%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 62% 18%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1.5px 1.5px at 78% 6%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 88% 22%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1px 1px at 8% 32%, rgba(255,255,255,0.3), transparent),
    radial-gradient(1.5px 1.5px at 35% 38%, rgba(255,255,255,0.45), transparent),
    radial-gradient(1.5px 1.5px at 72% 42%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 92% 48%, rgba(255,255,255,0.3), transparent),
    radial-gradient(1.5px 1.5px at 42% 65%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 68% 72%, rgba(255,255,255,0.28), transparent),
    radial-gradient(1.5px 1.5px at 25% 85%, rgba(255,255,255,0.35), transparent);
  pointer-events: none;
  z-index: 0;
}

@keyframes mshFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes mshSanctuaryBreath{0%,100%{opacity:.78;transform:translate(-50%,-52%) scale(1)}50%{opacity:1;transform:translate(-50%,-52%) scale(1.04)}}
@keyframes mshCreatureIdle{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.015)}}
@keyframes mshDrift1{0%,100%{transform:translate(0,0);opacity:.35}50%{transform:translate(18px,-12px);opacity:.95}}
@keyframes mshDrift2{0%,100%{transform:translate(0,0);opacity:.4}50%{transform:translate(-16px,-20px);opacity:.85}}
@keyframes mshDrift3{0%,100%{transform:translate(0,0);opacity:.3}50%{transform:translate(12px,-16px);opacity:.9}}

.msh-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 4px; max-width: 440px; margin: 0 auto;
  position: relative; z-index: 5;
}
.msh-title { font-family: 'Fraunces', serif; font-weight: 400; font-size: 17px; color: var(--cream); opacity: 0.82; }
.msh-top-btn {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.08);
  color: var(--cream-dim); font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}
.msh-top-btn:hover { background: rgba(245,184,76,0.08); border-color: rgba(245,184,76,0.3); color: var(--amber); }

.msh-scene {
  max-width: 440px; margin: 0 auto; position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; padding: 72px 0 40px; min-height: 620px;
}

.msh-sanctuary {
  position: absolute; top: 38%; left: 50%; transform: translate(-50%, -52%);
  width: 480px; height: 480px; pointer-events: none;
  animation: mshSanctuaryBreath 8s ease-in-out infinite; z-index: 1;
}

/* Fireflies */
.msh-firefly { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 8px rgba(245,184,76,0.65), 0 0 16px rgba(245,184,76,0.3); pointer-events: none; z-index: 3; }
.msh-firefly.f1 { top: 28%; left: 22%; animation: mshDrift1 9s ease-in-out infinite; }
.msh-firefly.f2 { top: 48%; left: 78%; animation: mshDrift2 11s ease-in-out infinite; }
.msh-firefly.f3 { top: 62%; left: 18%; animation: mshDrift3 13s ease-in-out infinite; }
.msh-firefly.f4 { top: 20%; left: 72%; animation: mshDrift1 14s ease-in-out infinite 2s; }
.msh-firefly.f5 { top: 72%; left: 64%; animation: mshDrift2 10s ease-in-out infinite 3s; }
.msh-firefly.f6 { top: 40%; left: 12%; animation: mshDrift3 12s ease-in-out infinite 1s; }

/* Personality */
.msh-personality {
  position: relative; z-index: 4; font-family: 'Fraunces', serif;
  font-style: italic; font-size: 14px; line-height: 1.55; color: var(--cream);
  max-width: 300px; text-align: center; margin-bottom: 26px; padding: 0 20px;
  cursor: pointer; transition: opacity 0.3s ease;
}
.msh-personality::before, .msh-personality::after {
  content: ''; display: block; width: 30px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(148,130,255,0.35), transparent);
  margin: 10px auto;
}

/* Creature row */
.msh-creature-row { position: relative; z-index: 4; display: flex; align-items: center; justify-content: center; gap: 14px; padding: 0 4px; }
.msh-creature-wrap { display: flex; align-items: center; justify-content: center; cursor: pointer; animation: mshCreatureIdle 7s ease-in-out infinite; }
.msh-creature-emoji { font-size: 180px; line-height: 1; }
.msh-creature-img { width: 180px; height: 220px; object-fit: contain; }

/* ─── MEMORIES (Night Cards archive) ─── */
.msh-memories {
  position: relative; width: 108px; transform: rotate(4deg); cursor: pointer;
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.72)) drop-shadow(0 5px 10px rgba(0,0,0,0.5)) drop-shadow(0 0 38px rgba(245,184,76,0.35));
}
.msh-memories:hover, .msh-memories:focus-visible { transform: rotate(2deg) translateY(-5px) scale(1.04); outline: none; }
.msh-mem-stack { position: absolute; inset: 0; pointer-events: none; z-index: -1; }
.msh-mem-stack::before, .msh-mem-stack::after {
  content: ''; position: absolute; aspect-ratio: 5/7; border-radius: 5px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 0 0.5px rgba(42,38,32,0.12), 0 10px 18px -8px rgba(0,0,0,0.6);
}
.msh-mem-stack::before { top: 6px; left: 8px; width: 100%; background: #e2d9c7; transform: rotate(3deg); }
.msh-mem-stack::after { top: 3px; left: -4px; width: 100%; background: #ece4d3; transform: rotate(-2.5deg); }
.msh-stage-seedling .msh-mem-stack::before, .msh-stage-seedling .msh-mem-stack::after { display: none; }
.msh-stage-sprout .msh-mem-stack::before { display: none; }
.msh-stage-radiant .msh-memories { filter: drop-shadow(0 22px 34px rgba(0,0,0,0.78)) drop-shadow(0 6px 12px rgba(0,0,0,0.55)) drop-shadow(0 0 48px rgba(245,184,76,0.5)); }

.msh-mem-card {
  position: relative; background: var(--cream);
  background-image: radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,250,240,0.72) 0%, transparent 50%), radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245,184,76,0.05) 0%, transparent 50%);
  border-radius: 5px; padding: 5px 5px 7px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.78), inset 0 0 0 0.5px rgba(42,38,32,0.08);
  aspect-ratio: 5/7; display: flex; flex-direction: column; overflow: hidden;
}
.msh-mem-sky {
  height: 46%; border-radius: 2px; position: relative; overflow: hidden; flex-shrink: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 60%, rgba(245,184,76,0.14) 0%, transparent 60%), linear-gradient(180deg, #0f1733 0%, #1e2452 45%, #3a2859 100%);
}
.msh-mem-sky .msh-star { position: absolute; width: 1px; height: 1px; background: #fff; border-radius: 50%; opacity: 0.75; }
.msh-mem-sky .msh-star.big { width: 1.8px; height: 1.8px; opacity: 0.9; }
.msh-mem-sky-creature { position: absolute; left: 50%; top: 54%; transform: translate(-50%,-50%); font-size: 26px; filter: drop-shadow(0 2px 6px rgba(245,184,76,0.3)); }
.msh-mem-body { flex: 1; padding: 8px 3px 2px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; position: relative; z-index: 1; }
.msh-mem-title { font-family: 'Fraunces', serif; font-style: italic; font-weight: 400; font-size: 13px; color: var(--ink); line-height: 1; letter-spacing: -0.005em; margin-top: 3px; }
.msh-mem-count { font-family: 'DM Mono', monospace; font-size: 5.5px; letter-spacing: 0.2em; color: var(--ink-faint); text-transform: uppercase; padding-top: 4px; border-top: 0.5px solid rgba(42,38,32,0.15); width: 64%; }

/* ─── BOOK (Stories archive) ─── */
.msh-book {
  position: relative; width: 108px; aspect-ratio: 5/7; transform: rotate(-4deg); cursor: pointer;
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.72)) drop-shadow(0 5px 10px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(148,130,255,0.4));
}
.msh-book:hover, .msh-book:focus-visible { transform: rotate(-2deg) translateY(-5px) scale(1.04); outline: none; }
.msh-stage-radiant .msh-book { filter: drop-shadow(0 22px 34px rgba(0,0,0,0.78)) drop-shadow(0 6px 12px rgba(0,0,0,0.55)) drop-shadow(0 0 52px rgba(148,130,255,0.55)); }
.msh-book-spine {
  position: absolute; left: 0; top: 0; bottom: 0; width: 9px;
  background: linear-gradient(90deg, #2a1f48 0%, #3a2d5e 30%, #2a1f48 70%, #1a1238 100%);
  border-radius: 2px 0 0 2px;
  box-shadow: inset -1.5px 0 2px rgba(0,0,0,0.5), inset 1px 0 0 rgba(148,130,255,0.2);
}
.msh-book-spine::after {
  content: ''; position: absolute; inset: 10px 1.5px;
  border-top: 0.5px solid rgba(245,184,76,0.25); border-bottom: 0.5px solid rgba(245,184,76,0.25);
}
.msh-stage-seedling .msh-book-spine::after { display: none; }
.msh-book-cover {
  position: absolute; left: 9px; right: 0; top: 0; bottom: 0;
  background: radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,250,235,0.7) 0%, transparent 50%), linear-gradient(135deg, #f1e8d5 0%, #e5dcc6 100%);
  border-radius: 0 3px 3px 0; padding: 14px 8px 10px;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), inset -1.5px 0 3px rgba(0,0,0,0.1), inset 0 0 0 0.5px rgba(42,38,32,0.08);
  overflow: hidden;
}
.msh-book-cover::after { content: ''; position: absolute; inset: 7px; border: 0.5px solid rgba(168,120,43,0.3); border-radius: 1px; pointer-events: none; }
.msh-book-ornament { font-family: 'DM Mono', monospace; font-size: 5px; letter-spacing: 0.35em; color: var(--amber-deep); opacity: 0.55; position: relative; z-index: 1; }
.msh-book-title { font-family: 'Fraunces', serif; font-style: italic; font-weight: 400; font-size: 13px; color: var(--ink); line-height: 1; letter-spacing: -0.005em; position: relative; z-index: 1; }
.msh-book-count { font-family: 'DM Mono', monospace; font-size: 5.5px; letter-spacing: 0.2em; color: var(--ink-faint); text-transform: uppercase; padding-top: 4px; border-top: 0.5px solid rgba(42,38,32,0.14); width: 62%; position: relative; z-index: 1; }
.msh-book-glow-under { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 130px; height: 20px; background: radial-gradient(ellipse 100% 100% at 50% 0%, rgba(148,130,255,0.22) 0%, transparent 70%); pointer-events: none; z-index: -1; }

/* ─── Identity ─── */
.msh-identity { position: relative; z-index: 4; text-align: center; margin-top: 28px; }
.msh-name { font-family: 'Fraunces', serif; font-weight: 400; font-size: 32px; color: var(--cream); letter-spacing: -0.01em; line-height: 1; }
.msh-stage { font-family: 'Fraunces', serif; font-style: italic; font-size: 14px; color: var(--purple-soft); opacity: 0.78; margin-top: 8px; }

/* ─── Quiet line ─── */
.msh-quiet-line { text-align: center; font-family: 'Fraunces', serif; font-style: italic; font-size: 14px; color: var(--cream); opacity: 0.55; margin-top: 28px; padding: 0 20px; position: relative; z-index: 4; }
.msh-accent { color: var(--amber); opacity: 0.9; font-weight: 500; }

/* ─── Tracker ─── */
.msh-tracker { position: relative; z-index: 4; max-width: 300px; margin: 36px auto 0; padding: 14px 20px; }
.msh-tracker-rule { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(245,184,76,0.35), transparent); }
.msh-tracker-row { display: flex; align-items: center; justify-content: center; gap: 28px; padding: 14px 0; }
.msh-tracker-group { display: flex; flex-direction: column; align-items: center; }
.msh-tracker-num { font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: 22px; color: var(--amber); line-height: 1; letter-spacing: -0.01em; }
.msh-tracker-label { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--cream-dim); opacity: 0.62; margin-top: 5px; }
.msh-tracker-orn { font-size: 7px; color: var(--amber); opacity: 0.55; margin-bottom: 12px; }

/* ─── Guest / Empty ─── */
.msh-guest { max-width: 340px; margin: 100px auto 0; text-align: center; position: relative; z-index: 1; }
.msh-guest-title { font-family: 'Fraunces', serif; font-size: 26px; color: var(--cream); margin-bottom: 12px; }
.msh-guest-sub { font-size: 14px; color: var(--cream-dim); opacity: 0.7; margin-bottom: 28px; line-height: 1.6; }
.msh-guest-btn { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; padding: 14px 26px; background: rgba(245,184,76,0.08); border: 1px solid rgba(245,184,76,0.4); border-radius: 100px; color: var(--amber); cursor: pointer; transition: all 0.4s ease; }
.msh-guest-btn:hover { background: rgba(245,184,76,0.16); color: rgb(255,230,180); }

/* ─── Companions ─── */
.msh-companions { position: relative; z-index: 4; max-width: 340px; margin: 28px auto 0; text-align: center; }
.msh-companions-label {
  font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--cream-dim); opacity: 0.5; margin-bottom: 14px;
}
.msh-companions-row {
  display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;
}
.msh-companion-avatar {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  width: 56px; padding: 8px 0;
  border: 1.5px solid rgba(255,255,255,.1); border-radius: 16px;
  background: rgba(255,255,255,.03);
  transition: all 0.3s ease;
}
.msh-companion-avatar.active {
  background: rgba(245,184,76,.06);
}
.msh-companion-emoji { font-size: 24px; line-height: 1; }
.msh-companion-name {
  font-family: 'DM Mono', monospace; font-size: 7px; letter-spacing: 0.1em;
  color: var(--cream-dim); opacity: 0.6; text-transform: uppercase;
  max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ─── Insights ─── */
.msh-insights { position: relative; z-index: 4; max-width: 340px; margin: 32px auto 0; padding: 0 8px; }
.msh-insights::before {
  content: ''; display: block; width: 30px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245,184,76,0.3), transparent);
  margin: 0 auto 24px;
}
.msh-insights-label {
  font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--cream-dim); opacity: 0.5;
  text-align: center; margin-bottom: 14px;
}
.msh-growth { margin-bottom: 24px; }
.msh-growth-strip {
  display: flex; align-items: flex-end; gap: 3px; height: 48px; padding: 4px 0;
}
.msh-growth-range {
  display: flex; justify-content: space-between;
  font-family: 'DM Mono', monospace; font-size: 7px; letter-spacing: 0.12em;
  color: var(--cream-dim); opacity: 0.35; margin-top: 6px;
}
.msh-patterns {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.msh-pattern-card {
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px; padding: 12px 14px;
  text-align: center;
}
.msh-pattern-value {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 500;
  font-size: 22px; line-height: 1; letter-spacing: -0.01em;
}
.msh-pattern-tags {
  font-size: 13px; font-weight: 400; line-height: 1.3;
}
.msh-pattern-label {
  font-family: 'DM Mono', monospace; font-size: 7px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--cream-dim); opacity: 0.5;
  margin-top: 5px;
}

/* ─── Responsive ─── */
@media (max-width: 480px) {
  .msh-root { padding: 36px 14px 120px; }
  .msh-creature-emoji { font-size: 140px; }
  .msh-creature-img { width: 140px; height: 170px; }
  .msh-sanctuary { width: 380px; height: 380px; }
  .msh-memories, .msh-book { width: 86px; }
  .msh-mem-sky-creature { font-size: 22px; }
  .msh-mem-title, .msh-book-title { font-size: 11.5px; }
  .msh-book-cover { padding: 11px 6px 8px; }
  .msh-creature-row { gap: 8px; }
  .msh-name { font-size: 26px; }
  .msh-tracker-num { font-size: 20px; }
  .msh-tracker-label { font-size: 7px; }
}
`;
