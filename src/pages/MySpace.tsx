import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards, getCharacters, saveNightCard as dbSaveNightCard } from '../lib/storage';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getDreamKeeperById, V1_DREAMKEEPERS, type DreamKeeper } from '../lib/dreamkeepers';
import { isRitualComplete, getRitualState } from '../lib/ritualState';
import { journeyService } from '../lib/journey-service';
import type { Character, HatchedCreature, SavedNightCard, StoryJourney } from '../lib/types';
import NightCardComponent from '../features/nightcards/NightCard';

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
.ms-inner{max-width:960px;margin:0 auto;padding:0 24px 32px;position:relative;z-index:5}
@media(min-width:768px){.ms-inner{padding:0 40px 32px}}
.ms-scroll-strip{scrollbar-width:none;-webkit-overflow-scrolling:touch}.ms-scroll-strip::-webkit-scrollbar{display:none}

@keyframes ms-creatureIdle{0%,100%{transform:scale(1) translateY(0)}25%{transform:scale(1.015) translateY(-3px)}50%{transform:scale(1.02) translateY(-5px)}75%{transform:scale(1.015) translateY(-3px)}}
@keyframes ms-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes ms-glowPulse{0%,100%{opacity:.35}50%{opacity:.6}}
@keyframes ms-twinkle{0%,100%{opacity:.12}50%{opacity:.45}}
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

/** Speech bubble from creature — stays visible */
function CreatureGreeting({ childName, creatureName, rgb }: { childName: string; creatureName: string; rgb: string }) {
  const name = childName && childName !== 'friend' && childName !== 'Dreamer' ? childName : null;
  return (
    <div style={{
      marginTop: 8, padding: '10px 16px',
      background: `rgba(${rgb},.08)`, border: `1px solid rgba(${rgb},.2)`,
      borderRadius: '16px 16px 16px 4px', maxWidth: 260, textAlign: 'left',
      animation: 'ms-fadeUp .5s ease-out',
    }}>
      <div style={{
        fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 400,
        fontStyle: 'italic', color: 'rgba(244,239,232,.7)', lineHeight: 1.5,
      }}>
        {name
          ? `"Hi ${name}, I\u2019m here whenever you\u2019re ready."`
          : `"I\u2019m here whenever you\u2019re ready."`}
      </div>
    </div>
  );
}

export default function MySpace({ onSignUp, onReadStory }: Props) {
  const { user, setView, companionCreature, setCompanionCreature, selectedCharacter, setSelectedCharacter, setActiveJourneyId } = useApp();

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
  const [showAllChildren, setShowAllChildren] = useState(false);
  const [viewingCard, setViewingCard] = useState<SavedNightCard | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardReflection, setCardReflection] = useState('');
  const [cardReflectionSaved, setCardReflectionSaved] = useState(false);
  const [activeJourney, setActiveJourney] = useState<StoryJourney | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [morningThought, setMorningThought] = useState('');
  const [morningThoughtSaved, setMorningThoughtSaved] = useState(false);

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

  // ── Journey loading ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !activeChild?.id) { setActiveJourney(null); return; }
    let cancelled = false;
    setJourneyLoading(true);
    journeyService.getActiveJourney(userId, activeChild.id).then(j => {
      if (!cancelled) { setActiveJourney(j); setJourneyLoading(false); }
    }).catch(() => { if (!cancelled) { setActiveJourney(null); setJourneyLoading(false); } });
    return () => { cancelled = true; };
  }, [userId, activeChild?.id]);

  // ── Morning Thought: find last night's card (created <24h ago, no reflection yet) ──
  const lastNightCard = useMemo(() => {
    if (!allCards.length) return null;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    // Find most recent card created within the last 24 hours that has no reflection
    const sorted = [...allCards].sort((a, b) => b.date.localeCompare(a.date));
    for (const card of sorted) {
      const cardTime = new Date(card.date).getTime();
      if (now - cardTime < twentyFourHours && !card.parentReflection) return card;
    }
    return null;
  }, [allCards]);

  // ── Resurfacing: pick one old card to show ──
  const resurfacedCard = useMemo(() => {
    if (allCards.length < 3) return null; // Need some history
    const today = new Date();
    const todayStr = today.toISOString().slice(5, 10); // MM-DD
    const sorted = [...allCards].sort((a, b) => a.date.localeCompare(b.date));

    // Priority 1: Exactly 1 year ago (same month-day)
    const oneYearAgo = sorted.find(c => {
      const cDate = c.date.slice(5, 10);
      const cYear = parseInt(c.date.slice(0, 4));
      return cDate === todayStr && cYear < today.getFullYear();
    });
    if (oneYearAgo) return { card: oneYearAgo, label: 'One year ago tonight' };

    // Priority 2: ~30 days ago (28-32 day window)
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const monthAgo = sorted.find(c => {
      const diff = Math.abs(new Date(c.date).getTime() - thirtyDaysAgo);
      return diff < 2 * 86400000; // within 2-day window
    });
    if (monthAgo) return { card: monthAgo, label: 'About a month ago' };

    // Priority 3: Any card older than 7 days (random, seeded by date)
    const oldCards = sorted.filter(c => Date.now() - new Date(c.date).getTime() > 7 * 86400000);
    if (oldCards.length > 0) {
      const idx = today.getDate() % oldCards.length;
      return { card: oldCards[idx], label: `${Math.round((Date.now() - new Date(oldCards[idx].date).getTime()) / 86400000)} nights ago` };
    }
    return null;
  }, [allCards]);

  const saveMorningThought = useCallback(async () => {
    if (!lastNightCard || !morningThought.trim() || !userId) return;
    const updated = { ...lastNightCard, parentReflection: morningThought.trim() };
    // Update local state
    setAllCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    setMorningThoughtSaved(true);
    // Persist to Supabase
    try { await dbSaveNightCard(updated); } catch (e) { console.error('[MySpace] saveMorningThought failed:', e); }
  }, [lastNightCard, morningThought, userId]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const primaryChild = activeChild || characters.find(c => c.isFamily && c.type === 'human') || characters[0];
  const childName = primaryChild?.name || user?.displayName || 'friend';

  // First-time detection
  const isFirstTime = storyCount === 0 && cardCount === 0;

  // DreamKeeper image lookup — but NOT during the 3-night ritual (before hatch)
  // Show the egg until the ritual is complete, regardless of what companionCreature says
  const ritualDone = userId ? isRitualComplete(userId) : true;
  const ritualState = userId && !ritualDone ? getRitualState(userId) : null;
  const nextRitualNight = ritualState?.currentNight || 1;
  const isPreHatchEgg = !ritualDone || companionCreature?.creatureType === 'spirit' || companionCreature?.creatureEmoji === '\uD83E\uDD5A';
  const dk = isPreHatchEgg ? null : resolveDreamKeeper(companionCreature);
  const creatureImageSrc = dk?.imageSrc;
  const creatureName = isPreHatchEgg ? (companionCreature?.name || 'Dream Egg') : (companionCreature?.name || dk?.name || '');
  const creatureColor = companionCreature?.color || dk?.color || '#F5B84C';
  const creatureEmoji = companionCreature?.creatureEmoji || dk?.emoji || '\uD83C\uDF19';
  const rgb = hexToRgb(creatureColor);

  // ── Collection patterns (emotional analytics) ──
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

    // Monthly digest for last completed month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7); // YYYY-MM
    const lastMonthCards = allCards.filter(c => c.date?.startsWith(lastMonthStr));
    const lastMonthLabel = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      totalMemories: allCards.length,
      topMood: topMood ? { emoji: topMood[0], count: topMood[1] } : null,
      topTags,
      longestStreak: longest,
      lastMonth: lastMonthCards.length > 0 ? { label: lastMonthLabel, count: lastMonthCards.length, cards: lastMonthCards } : null,
    };
  }, [allCards]);

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
    <>
    {/* Ambient stars — rendered outside .ms to avoid stacking context */}
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.s + 0.5, height: s.s + 0.5, borderRadius: '50%',
          background: 'white', opacity: 0.25,
          animation: `ms-twinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}
    </div>
    <div className="ms">
      <style>{CSS}</style>

      <div className="ms-inner">

        {/* ═══ 0. TOP BAR: Child Toggle + Profile ═══ */}
        <div style={{
          position: 'absolute', top: 18, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'ms-fadeUp .5s ease-out',
        }}>
          {/* Child toggle — cycles through children on tap */}
          {hasMultipleChildren ? (
            <button
              onClick={() => {
                const idx = familyChildren.findIndex(c => c.id === activeChild?.id);
                const next = familyChildren[(idx + 1) % familyChildren.length];
                handleChildSwitch(next);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px 6px 8px', borderRadius: 24,
                background: 'rgba(245,184,76,.06)', border: '1px solid rgba(245,184,76,.15)',
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,184,76,.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,184,76,.06)'; }}
            >
              <span style={{ fontSize: 16 }}>{activeChild?.emoji || '\uD83C\uDF19'}</span>
              <span style={{ fontFamily: "'Nunito',system-ui,sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(245,184,76,.8)' }}>{activeChild?.name}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(245,184,76,.5)" strokeWidth="2.5" strokeLinecap="round"><path d="m8 10 4 4 4-4"/></svg>
            </button>
          ) : <div />}
          {/* Profile button */}
          <button
            onClick={() => setView('user-profile')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background .15s, border-color .15s',
              padding: 0, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
            aria-label="Profile settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(244,239,232,.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

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

        {/* Child pills removed — replaced by top-bar toggle */}

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

        {/* ═══ 1c. BIRTHDAY NUDGE ═══ */}
        {activeChild && activeChild.type === 'human' && !activeChild.birthDate && cardCount > 0 && (
          <div
            onClick={() => setView('character-builder')}
            style={{
              animation: 'ms-fadeUp .7s .15s ease-out both',
              margin: '4px 0 8px', padding: '10px 16px',
              background: 'rgba(245,184,76,.04)',
              border: '1px solid rgba(245,184,76,.12)',
              borderRadius: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,184,76,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,184,76,.04)'; }}
          >
            <span style={{ fontSize: 16 }}>{'\uD83C\uDF82'}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 600,
                color: 'rgba(245,184,76,.7)',
              }}>
                Add {childName}{'\u2019'}s birthday
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 9,
                color: 'rgba(244,239,232,.25)', letterSpacing: '.02em', marginTop: 2,
              }}>
                Night Cards will show their exact age — priceless in a few years
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(245,184,76,.4)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
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

          {/* Greeting speech bubble — appears briefly on load */}
          <CreatureGreeting childName={childName} creatureName={creatureName} rgb={rgb} />
        </div>

        {/* ═══ 3. PRIMARY + JOURNEY CTAs ═══ */}
        <div style={{
          margin: '8px 0 28px',
          animation: 'ms-fadeUp .8s .3s ease-out both',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>

          {/* ── Active journey = primary CTA ── */}
          {activeJourney && ritualDone && (() => {
            const lastChapter = activeJourney.chapters?.length
              ? activeJourney.chapters[activeJourney.chapters.length - 1]
              : null;
            const readNum = activeJourney.readNumber ?? 1;
            const progressPct = Math.max(0, Math.min(100, ((readNum - 1) / 7) * 100));
            return (
              <button
                onClick={() => {
                  setActiveJourneyId(activeJourney.id);
                  setView('nightly-checkin');
                }}
                style={{
                  width: '100%', padding: '18px 20px 16px', border: 'none', borderRadius: 16,
                  background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
                  color: '#080200', cursor: 'pointer',
                  fontFamily: "'Nunito',system-ui,sans-serif",
                  animation: 'ms-ctaPulse 3s ease-in-out infinite',
                  transition: 'transform .15s, filter .15s',
                  position: 'relative', overflow: 'hidden', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{'\uD83D\uDCD6'}</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Continue tonight{'\u2019'}s chapter</span>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 600, opacity: .75, marginBottom: 8,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeJourney.workingTitle || 'Your book'}
                </div>
                {/* Progress bar */}
                <div style={{
                  height: 4, borderRadius: 2, background: 'rgba(0,0,0,.15)',
                  marginBottom: 6, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: 'rgba(0,0,0,.35)',
                    width: `${progressPct}%`,
                    transition: 'width .3s ease',
                  }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: .6,
                    fontFamily: "'DM Mono',monospace", letterSpacing: '.03em',
                  }}>
                    Night {readNum} of 7
                  </span>
                  {lastChapter?.teaser && (
                    <span style={{ fontSize: 10, fontStyle: 'italic', opacity: .55, maxWidth: '60%',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {lastChapter.teaser}
                    </span>
                  )}
                </div>
                <span style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'ms-shimmer 3.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              </button>
            );
          })()}

          {/* ── Quick story CTA (primary when no journey, secondary when journey active) ── */}
          <button
            onClick={() => setView(ritualDone ? 'ritual-starter' : 'onboarding-ritual')}
            style={{
              width: '100%', border: 'none', borderRadius: 16,
              cursor: 'pointer', fontFamily: "'Nunito',system-ui,sans-serif",
              transition: 'transform .15s, filter .15s',
              position: 'relative', overflow: 'hidden',
              ...(activeJourney && ritualDone
                ? {
                    // Secondary style when journey is primary
                    padding: '14px 24px',
                    background: 'rgba(245,184,76,.08)',
                    border: '1px solid rgba(245,184,76,.18)',
                    color: 'rgba(245,184,76,.85)', fontSize: 14, fontWeight: 600,
                  }
                : {
                    // Primary gold style (default)
                    padding: '18px 24px',
                    background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
                    color: '#080200', fontSize: 17, fontWeight: 700,
                    animation: 'ms-ctaPulse 3s ease-in-out infinite',
                  }
              ),
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
          >
            {!ritualDone
              ? `Start Ritual Night ${nextRitualNight}`
              : activeJourney
                ? 'Or start a quick story'
                : isFirstTime ? 'Start your first story' : 'Start tonight\u2019s story'
            }
            {!(activeJourney && ritualDone) && (
              <span style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'ms-shimmer 3.5s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
          </button>

          {/* ── Journey invitation (show when no active journey) ── */}
          {!activeJourney && !journeyLoading && (
            <button
              onClick={() => {
                if (!ritualDone) {
                  setView('onboarding-ritual');
                } else {
                  setActiveJourneyId(null);
                  setView('journey-setup');
                }
              }}
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 16,
                background: 'rgba(255,255,255,.025)',
                border: '1px solid rgba(255,255,255,.06)',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: "'Nunito',system-ui,sans-serif",
                transition: 'background .2s, transform .15s, border-color .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{'\uD83D\uDCD6'}</span>
                <span style={{
                  fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 400,
                  color: '#F4EFE8',
                }}>
                  Start a 7-Night Book
                </span>
              </div>
              <div style={{
                fontSize: 12, color: 'rgba(244,239,232,.4)', lineHeight: 1.5,
                paddingLeft: 28,
              }}>
                {!ritualDone
                  ? `Complete your bedtime ritual to unlock \u2014 a personalized book that grows across 7 nights`
                  : creatureName && creatureName !== 'Dream Egg'
                    ? `A story that grows across 7 bedtimes \u2014 with ${creatureName} alongside ${childName}`
                    : `A story that grows across 7 bedtimes \u2014 just for ${childName}`
                }
              </div>
              <div style={{
                display: 'flex', gap: 16, paddingLeft: 28, marginTop: 10,
              }}>
                {[
                  'New chapter every night',
                  'Remembers each session',
                  `${creatureName || 'DreamKeeper'} grows too`,
                ].map((item, i) => (
                  <div key={i} style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(244,239,232,.25)', letterSpacing: '.02em',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ color: `rgba(${rgb},.5)`, fontSize: 8 }}>{'\u2022'}</span>
                    {item}
                  </div>
                ))}
              </div>
            </button>
          )}
        </div>

        {/* ═══ 3a. TONIGHT'S CARD ═══ */}
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const tonightCard = allCards.find(c => c.date?.startsWith(today));
          if (tonightCard) {
            return (
              <div style={{
                animation: 'ms-fadeUp .8s .35s ease-out both', marginBottom: 20,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                }}>
                  <span style={{ fontSize: 13 }}>{'\u2728'}</span>
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 10,
                    color: 'rgba(20,216,144,.55)', letterSpacing: '.06em',
                    textTransform: 'uppercase' as const,
                  }}>Tonight{'\u2019'}s memory</span>
                </div>
                <div
                  onClick={() => setViewingCard(tonightCard)}
                  style={{
                    background: 'rgba(20,216,144,.03)', border: '1px solid rgba(20,216,144,.1)',
                    borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                    transition: 'background .2s, transform .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,216,144,.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,216,144,.03)'; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{
                    fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 500,
                    color: '#F4EFE8', lineHeight: 1.3, marginBottom: 6,
                  }}>
                    {tonightCard.headline}
                  </div>
                  {tonightCard.memory_line && (
                    <div style={{
                      fontFamily: "'Nunito',sans-serif", fontSize: 13,
                      fontStyle: 'italic', color: 'rgba(244,239,232,.45)',
                      lineHeight: 1.5, marginBottom: 8,
                    }}>
                      {tonightCard.memory_line}
                    </div>
                  )}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(244,239,232,.22)',
                  }}>
                    {tonightCard.childMood && <span style={{ fontSize: 13 }}>{tonightCard.childMood}</span>}
                    {tonightCard.bedtimeActual && <span>{tonightCard.bedtimeActual.toLowerCase()}</span>}
                    <span>{tonightCard.creatureEmoji || creatureEmoji}</span>
                    <span>{tonightCard.heroName}</span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* ═══ 3b. MORNING THOUGHT ═══ */}
        {lastNightCard && !morningThoughtSaved && (
          <div style={{
            animation: 'ms-fadeUp .8s .35s ease-out both', marginBottom: 20,
            background: 'rgba(20,216,144,.04)',
            border: '1px solid rgba(20,216,144,.12)',
            borderRadius: 16, padding: '16px 18px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <span style={{ fontSize: 14 }}>{'\uD83D\uDCAD'}</span>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(20,216,144,.55)', letterSpacing: '.04em',
                textTransform: 'uppercase' as const,
              }}>Morning thought</span>
            </div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(244,239,232,.55)', lineHeight: 1.5,
              marginBottom: 12,
            }}>
              Anything from last night you want to remember?
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(244,239,232,.25)', marginBottom: 10,
              fontFamily: "'Nunito',sans-serif",
            }}>
              About: <span style={{ color: 'rgba(245,184,76,.5)' }}>{lastNightCard.headline}</span>
            </div>
            <textarea
              value={morningThought}
              onChange={e => setMorningThought(e.target.value)}
              placeholder="She asked about the story first thing this morning..."
              style={{
                width: '100%', minHeight: 60, padding: '12px 14px',
                borderRadius: 12, border: '1px solid rgba(20,216,144,.15)',
                background: 'rgba(20,216,144,.05)', color: 'rgba(234,242,255,.8)',
                fontSize: 13, fontFamily: "'Nunito',sans-serif",
                resize: 'none', outline: 'none', lineHeight: 1.5,
              }}
              maxLength={280}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={saveMorningThought}
                disabled={!morningThought.trim()}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none',
                  background: morningThought.trim() ? 'rgba(20,216,144,.2)' : 'rgba(255,255,255,.04)',
                  color: morningThought.trim() ? 'rgba(20,216,144,.85)' : 'rgba(244,239,232,.2)',
                  fontSize: 12, fontWeight: 600, cursor: morningThought.trim() ? 'pointer' : 'default',
                  fontFamily: "'Nunito',sans-serif", transition: 'all .2s',
                }}
              >
                Save to last night{'\u2019'}s card
              </button>
            </div>
          </div>
        )}
        {morningThoughtSaved && (
          <div style={{
            animation: 'ms-fadeUp .5s ease-out both', marginBottom: 20,
            background: 'rgba(20,216,144,.06)', border: '1px solid rgba(20,216,144,.15)',
            borderRadius: 16, padding: '14px 18px', textAlign: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(20,216,144,.65)', fontFamily: "'Nunito',sans-serif" }}>
              {'\u2713'} Saved to last night{'\u2019'}s memory
            </span>
          </div>
        )}

        {/* ═══ 3c. RESURFACED MEMORY ═══ */}
        {resurfacedCard && (
          <div style={{
            animation: 'ms-fadeUp .8s .4s ease-out both', marginBottom: 24,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <span style={{ fontSize: 13 }}>{'\uD83D\uDD70'}</span>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
                textTransform: 'uppercase' as const,
              }}>{resurfacedCard.label}</span>
            </div>
            <div
              onClick={() => setViewingCard(resurfacedCard.card)}
              style={{
                background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                transition: 'background .2s, transform .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.025)'; e.currentTarget.style.transform = ''; }}
            >
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 16, fontWeight: 400,
                color: '#F4EFE8', lineHeight: 1.35, marginBottom: 6,
              }}>
                {resurfacedCard.card.headline}
              </div>
              {resurfacedCard.card.memory_line && (
                <div style={{
                  fontFamily: "'Nunito',sans-serif", fontSize: 12,
                  fontStyle: 'italic', color: 'rgba(244,239,232,.4)',
                  lineHeight: 1.5, marginBottom: 8,
                }}>
                  {resurfacedCard.card.memory_line}
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'DM Mono',monospace", fontSize: 9,
                color: 'rgba(244,239,232,.2)',
              }}>
                <span>{resurfacedCard.card.creatureEmoji || creatureEmoji}</span>
                <span>{resurfacedCard.card.heroName}</span>
                <span>{'\u00B7'}</span>
                <span>{new Date(resurfacedCard.card.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {resurfacedCard.card.childMood && <span>{resurfacedCard.card.childMood}</span>}
              </div>
            </div>
          </div>
        )}

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
                  onClick={() => setViewingCard(card)}
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

        {/* ═══ 4c. MONTHLY DIGEST ═══ */}
        {patterns?.lastMonth && (
          <div style={{
            animation: 'ms-fadeUp .8s .55s ease-out both', marginBottom: 20,
            background: 'rgba(154,127,212,.04)', border: '1px solid rgba(154,127,212,.1)',
            borderRadius: 16, padding: '16px 18px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <span style={{ fontSize: 13 }}>{'\uD83D\uDCC5'}</span>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(154,127,212,.55)', letterSpacing: '.04em',
                textTransform: 'uppercase' as const,
              }}>{patterns.lastMonth.label}</span>
            </div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 400,
              color: 'rgba(244,239,232,.6)', lineHeight: 1.4, marginBottom: 8,
            }}>
              {patterns.lastMonth.count} {patterns.lastMonth.count === 1 ? 'night' : 'nights'} of stories
            </div>
            {(() => {
              const mc = patterns.lastMonth!.cards;
              const moods: Record<string, number> = {};
              mc.forEach((c: any) => { if (c.childMood) moods[c.childMood] = (moods[c.childMood] || 0) + 1; });
              const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];
              const tags: Record<string, number> = {};
              mc.forEach((c: any) => { c.tags?.forEach((t: string) => { tags[t] = (tags[t] || 0) + 1; }); });
              const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
              return (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '4px 12px',
                  fontFamily: "'DM Mono',monospace", fontSize: 9,
                  color: 'rgba(244,239,232,.3)',
                }}>
                  {topMood && <span>Most felt: {topMood[0]} ({topMood[1]}x)</span>}
                  {topTags.length > 0 && <span>Themes: {topTags.join(', ')}</span>}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ 4d. PATTERNS ═══ */}
        {patterns && (
          <div style={{
            animation: 'ms-fadeUp .8s .6s ease-out both', marginBottom: 20,
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 16, padding: '16px 18px',
          }}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
              textTransform: 'uppercase' as const, marginBottom: 12,
            }}>
              {childName}{'\u2019'}s patterns
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Total memories */}
              <div style={{
                background: 'rgba(245,184,76,.04)', border: '1px solid rgba(245,184,76,.1)',
                borderRadius: 12, padding: '10px 12px',
              }}>
                <div style={{
                  fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 600,
                  color: 'rgba(245,184,76,.75)', lineHeight: 1,
                }}>{patterns.totalMemories}</div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 8,
                  color: 'rgba(244,239,232,.25)', marginTop: 3, letterSpacing: '.04em',
                }}>memories</div>
              </div>
              {/* Longest streak */}
              <div style={{
                background: 'rgba(245,130,20,.04)', border: '1px solid rgba(245,130,20,.1)',
                borderRadius: 12, padding: '10px 12px',
              }}>
                <div style={{
                  fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 600,
                  color: 'rgba(245,130,20,.75)', lineHeight: 1,
                }}>{patterns.longestStreak}</div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 8,
                  color: 'rgba(244,239,232,.25)', marginTop: 3, letterSpacing: '.04em',
                }}>longest streak</div>
              </div>
              {/* Most common mood */}
              {patterns.topMood && (
                <div style={{
                  background: 'rgba(154,127,212,.04)', border: '1px solid rgba(154,127,212,.1)',
                  borderRadius: 12, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 22, lineHeight: 1 }}>{patterns.topMood.emoji}</div>
                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 8,
                    color: 'rgba(244,239,232,.25)', marginTop: 3, letterSpacing: '.04em',
                  }}>most common mood</div>
                </div>
              )}
              {/* Top themes */}
              {patterns.topTags.length > 0 && (
                <div style={{
                  background: 'rgba(20,216,144,.04)', border: '1px solid rgba(20,216,144,.1)',
                  borderRadius: 12, padding: '10px 12px',
                }}>
                  <div style={{
                    fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 400,
                    color: 'rgba(20,216,144,.65)', lineHeight: 1.3,
                  }}>{patterns.topTags.join(', ')}</div>
                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 8,
                    color: 'rgba(244,239,232,.25)', marginTop: 3, letterSpacing: '.04em',
                  }}>favorite themes</div>
                </div>
              )}
            </div>
          </div>
        )}

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
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(244,239,232,.45)', lineHeight: 1.65,
            }}>
              {creatureName || 'Your DreamKeeper'} has been with {childName} for {storyCount} {storyCount === 1 ? 'night' : 'nights'}
              {cardCount > 0 ? ` and remembers ${cardCount} ${cardCount === 1 ? 'moment' : 'moments'}` : ''}.
            </div>
          )}
        </div>

      </div>

      {/* Night Card detail overlay */}
      {viewingCard && (
        <>
          <div onClick={() => { setViewingCard(null); setCardFlipped(false); setCardReflection(''); setCardReflectionSaved(false); }} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)',
            zIndex: 200, animation: 'ms-fadeUp .2s ease both',
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, pointerEvents: 'none', flexDirection: 'column',
          }}>
            <div style={{
              position: 'absolute', top: '35%', left: '50%',
              transform: 'translate(-50%,-50%)', width: 320, height: 320,
              borderRadius: '50%', pointerEvents: 'none',
              background: 'radial-gradient(circle,rgba(154,127,212,.12) 0%,transparent 70%)',
            }} />
            <div style={{
              pointerEvents: 'all', width: '100%', maxWidth: 300,
              animation: 'ms-fadeUp .3s ease both', position: 'relative', zIndex: 1,
              maxHeight: '85vh', overflowY: 'auto', scrollbarWidth: 'none' as any,
            }}>
              <NightCardComponent card={viewingCard} size="full" flipped={cardFlipped} onFlip={() => setCardFlipped(!cardFlipped)} />

              {/* Context strip */}
              {(viewingCard.storyTitle || viewingCard.childAge || viewingCard.bedtimeActual) && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                  display: 'flex', flexWrap: 'wrap', gap: '3px 8px', justifyContent: 'center',
                  fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(234,242,255,.28)',
                }}>
                  {viewingCard.storyTitle && <span>{'\uD83D\uDCD6'} {viewingCard.storyTitle}</span>}
                  {viewingCard.bedtimeActual && <span>{'\uD83D\uDD70'} {viewingCard.bedtimeActual.toLowerCase()}</span>}
                  {viewingCard.childAge && <span>{viewingCard.heroName}, age {viewingCard.childAge}</span>}
                </div>
              )}

              {/* Flip hint */}
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 9, color: 'rgba(234,242,255,.18)', fontFamily: "'DM Mono',monospace" }}>
                {cardFlipped ? 'tap card to see front' : 'tap card to flip'}
              </div>

              {/* Reflection */}
              {!viewingCard.parentReflection && !cardReflectionSaved && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(20,216,144,.04)', border: '1px solid rgba(20,216,144,.12)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(20,216,144,.5)', fontFamily: "'DM Mono',monospace", letterSpacing: '.4px', marginBottom: 6 }}>{'\uD83D\uDCAD'} ADD A REFLECTION</div>
                  <textarea value={cardReflection} onChange={e => setCardReflection(e.target.value)} placeholder="Anything you remember about this night..." style={{ width: '100%', minHeight: 50, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(20,216,144,.12)', background: 'rgba(20,216,144,.04)', color: 'rgba(234,242,255,.8)', fontSize: 12, fontFamily: "'Nunito',sans-serif", resize: 'none', outline: 'none', lineHeight: 1.5 }} maxLength={280} />
                  <button disabled={!cardReflection.trim()} onClick={async () => {
                    if (!viewingCard || !cardReflection.trim()) return;
                    const updated = { ...viewingCard, parentReflection: cardReflection.trim() };
                    setAllCards(prev => prev.map(c => c.id === updated.id ? updated : c));
                    setViewingCard(updated);
                    setCardReflectionSaved(true);
                    try { await dbSaveNightCard(updated); } catch (e) { console.error('[MySpace] saveReflection:', e); }
                  }} style={{ marginTop: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: cardReflection.trim() ? 'rgba(20,216,144,.2)' : 'rgba(255,255,255,.04)', color: cardReflection.trim() ? 'rgba(20,216,144,.85)' : 'rgba(234,242,255,.2)', fontSize: 11, fontWeight: 600, cursor: cardReflection.trim() ? 'pointer' : 'default', fontFamily: "'Nunito',sans-serif" }}>Save reflection</button>
                </div>
              )}
              {cardReflectionSaved && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: 'rgba(20,216,144,.6)', fontFamily: "'Nunito',sans-serif" }}>{'\u2713'} Reflection saved</div>
              )}
              {viewingCard.parentReflection && !cardReflectionSaved && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(20,216,144,.04)', border: '1px solid rgba(20,216,144,.08)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(20,216,144,.4)', fontFamily: "'DM Mono',monospace", letterSpacing: '.4px', marginBottom: 4 }}>{'\uD83D\uDCAD'} REFLECTION</div>
                  <div style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(234,242,255,.5)', fontFamily: "'Nunito',sans-serif", lineHeight: 1.5 }}>{viewingCard.parentReflection}</div>
                </div>
              )}

              <button
                onClick={() => { setViewingCard(null); setCardFlipped(false); setCardReflection(''); setCardReflectionSaved(false); }}
                style={{
                  width: '100%', marginTop: 12, padding: '11px 8px',
                  borderRadius: 14, border: '1px solid rgba(255,255,255,.12)',
                  background: 'rgba(255,255,255,.06)', color: 'rgba(234,242,255,.6)',
                  fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: 'pointer',
                }}
              >Close</button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
