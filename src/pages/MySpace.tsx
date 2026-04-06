import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getStories, getNightCards, getCharacters } from '../lib/storage';
import { getAllHatchedCreatures, getActiveEgg, createEgg } from '../lib/hatchery';
import { CREATURES } from '../lib/creatures';
import type { HatcheryEgg } from '../lib/types';
import { getDreamKeeperById, V1_DREAMKEEPERS, type DreamKeeper } from '../lib/dreamkeepers';
import { isRitualComplete, getRitualState } from '../lib/ritualState';
import { journeyService } from '../lib/journey-service';
import type { Character, HatchedCreature, SavedNightCard, StoryJourney } from '../lib/types';
import NightCardComponent from '../features/nightcards/NightCard';
import NightCardDetailPaginated from '../features/nightcards/NightCardDetailPaginated';
import DreamEgg from '../components/onboarding/DreamEgg';
import type { EggState } from '../components/onboarding/DreamEgg';

// ─────────────────────────────────────────────────────────────────────────────
// MySpace — The "Today" tab. Calm, focused, ritual-first.
// ─────────────────────────────────────────────────────────────────────────────
// One layout for all times of day. Creature → CTA → Tonight's card →
// Resurfaced memory → Memory strip. That's it.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onSignUp: () => void;
  onReadStory?: (book: any) => void;
  onHatchReady?: (childName: string, characterId: string) => void;
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
`;

// Resolve a HatchedCreature to a DreamKeeper with a valid imageSrc.
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

/** Calculate consecutive-day streak from night cards (most recent backwards). */
function calcStreak(cards: { date: string }[]): number {
  if (!cards.length) return 0;
  const dates = [...new Set(cards.map(c => c.date?.slice(0, 10)).filter(Boolean))].sort().reverse();
  if (!dates.length) return 0;

  const toDay = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.floor(new Date(y, m - 1, d).getTime() / 86400000);
  };

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

/** Pick a greeting line based on card count + time of day */
function pickGreeting(name: string | null, creatureName: string, cardCount: number): string {
  const h = new Date().getHours();
  const isEvening = h >= 17;

  if (cardCount === 0) {
    return name
      ? `"${name}, tonight is the beginning of something."`
      : `"Tonight is the beginning of something."`;
  }
  if (cardCount < 5) {
    return isEvening
      ? (name ? `"Hi ${name}, I\u2019m here whenever you\u2019re ready."` : `"I\u2019m here whenever you\u2019re ready."`)
      : (name ? `"${name}, I kept watch while you slept."` : `"I kept watch while you slept."`);
  }
  // 5+ cards — rotate through variants by day-of-year
  const variants = name ? [
    `"Hi ${name}. I\u2019ve been thinking about you."`,
    `"Another night together, ${name}. I wouldn\u2019t miss it."`,
    `"${name}, do you remember our first story? I do."`,
    `"I\u2019m always here, ${name}. That\u2019s the deal."`,
    `"Ready when you are, ${name}. No rush."`,
    `"${name}. Let\u2019s make tonight a good one."`,
    `"The quiet before the story is my favorite part."`,
    `"Every night with you feels like the first one."`,
  ] : [
    `"I\u2019ve been thinking about you."`,
    `"Another night together. I wouldn\u2019t miss it."`,
    `"Do you remember our first story? I do."`,
    `"Ready when you are. No rush."`,
    `"Let\u2019s make tonight a good one."`,
    `"The quiet before the story is my favorite part."`,
    `"Every night feels like the first one."`,
    `"I\u2019m always here. That\u2019s the deal."`,
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return variants[dayOfYear % variants.length];
}

/** Speech bubble from creature */
function CreatureGreeting({ childName, creatureName, rgb, cardCount }: { childName: string; creatureName: string; rgb: string; cardCount: number }) {
  const name = childName && childName !== 'friend' && childName !== 'Dreamer' ? childName : null;
  const line = pickGreeting(name, creatureName, cardCount);
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
        {line}
      </div>
    </div>
  );
}

export default function MySpace({ onSignUp, onReadStory, onHatchReady }: Props) {
  const { user, setView, companionCreature, setCompanionCreature, selectedCharacter, setSelectedCharacter, setActiveJourneyId } = useApp();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [allStories, setAllStories] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [allCreatures, setAllCreatures] = useState<HatchedCreature[]>([]);
  const [storyCount, setStoryCount] = useState(0);
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewingCard, setViewingCard] = useState<SavedNightCard | null>(null);
  const [activeJourney, setActiveJourney] = useState<StoryJourney | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [activeEgg, setActiveEgg] = useState<HatcheryEgg | null>(null);

  const userId = user?.id;

  // ── Data loading ──────────────────────────────────────────────────────────
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
      setRecentCards(cards.slice(-5).reverse());
      setCardCount(cards.length);
      setStreak(calcStreak(cards));
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId]);

  // ── Multi-child: family characters ────────────────────────────────────────
  const familyChildren = useMemo(
    () => characters.filter(c => c.isFamily && c.type === 'human'),
    [characters],
  );
  const hasMultipleChildren = familyChildren.length > 1;

  const activeChild = useMemo(() => {
    if (selectedCharacter && familyChildren.some(c => c.id === selectedCharacter.id)) {
      return selectedCharacter;
    }
    return familyChildren[0] || characters[0] || null;
  }, [selectedCharacter, familyChildren, characters]);

  useEffect(() => {
    if (!activeChild || !hasMultipleChildren) return;
    const childId = activeChild.id;
    const filteredCards = allCards.filter(
      c => !c.characterIds?.length || c.characterIds.includes(childId) || c.heroName === activeChild.name
    );
    const filteredStories = allStories.filter(
      s => !s.characterIds?.length || s.characterIds.includes(childId) || s.heroName === activeChild.name
    );
    setStoryCount(filteredStories.length);
    setRecentCards(filteredCards.slice(-5).reverse());
    setCardCount(filteredCards.length);
    setStreak(calcStreak(filteredCards));

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

  // ── Ritual state (needed early for egg loading) ────────────────────────────
  const ritualDone = userId ? isRitualComplete(userId) : true;

  // ── Egg loading (hatchery progress) ───────────────────────────────────────
  useEffect(() => {
    if (!userId || !activeChild?.id || !ritualDone) { setActiveEgg(null); return; }
    let cancelled = false;
    (async () => {
      let egg = await getActiveEgg(userId, activeChild.id);
      if (!egg) {
        const rc = CREATURES[Math.floor(Math.random() * CREATURES.length)];
        try { egg = await createEgg(userId, activeChild.id, rc.id, 1); } catch {}
      }
      if (!cancelled) setActiveEgg(egg);
    })();
    return () => { cancelled = true; };
  }, [userId, activeChild?.id, ritualDone]);

  // ── Egg stage: count night cards since egg started ────────────────────────
  const eggStage = useMemo(() => {
    if (!activeEgg || !activeChild) return 0;
    const startDate = activeEgg.startedAt.split('T')[0];
    const count = allCards.filter(card =>
      (!card.characterIds?.length || card.characterIds.includes(activeEgg.characterId) || card.heroName === activeChild.name) &&
      card.date.split('T')[0] >= startDate
    ).length;
    return Math.min(count, 7);
  }, [activeEgg, allCards, activeChild]);

  const eggCards = useMemo(() => {
    if (!activeEgg || !activeChild) return [];
    const startDate = activeEgg.startedAt.split('T')[0];
    return allCards
      .filter(card =>
        (!card.characterIds?.length || card.characterIds.includes(activeEgg.characterId) || card.heroName === activeChild.name) &&
        card.date.split('T')[0] >= startDate
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 7);
  }, [activeEgg, allCards, activeChild]);

  // ── Resurfacing: pick one old card to show ────────────────────────────────
  const resurfacedCard = useMemo(() => {
    if (allCards.length < 3) return null;
    const today = new Date();
    const todayStr = today.toISOString().slice(5, 10);
    const todayFull = today.toISOString().slice(0, 10);
    const sorted = [...allCards].sort((a, b) => a.date.localeCompare(b.date));

    let lastSurfacedId = '';
    let lastSurfacedDate = '';
    try {
      const stored = JSON.parse(localStorage.getItem(`ss2_resurface_${userId}`) || '{}');
      lastSurfacedId = stored.cardId || '';
      lastSurfacedDate = stored.date || '';
    } catch {}

    if (lastSurfacedDate === todayFull && lastSurfacedId) {
      const cached = allCards.find(c => c.id === lastSurfacedId);
      if (cached) {
        const daysAgo = Math.round((Date.now() - new Date(cached.date).getTime()) / 86400000);
        return { card: cached, label: daysAgo > 360 ? 'One year ago tonight' : daysAgo > 25 ? 'About a month ago' : `${daysAgo} nights ago` };
      }
    }

    const pick = (card: any, label: string) => {
      try { localStorage.setItem(`ss2_resurface_${userId}`, JSON.stringify({ cardId: card.id, date: todayFull })); } catch {}
      return { card, label };
    };

    const oneYearAgo = sorted.find(c => {
      const cDate = c.date.slice(5, 10);
      const cYear = parseInt(c.date.slice(0, 4));
      return cDate === todayStr && cYear < today.getFullYear();
    });
    if (oneYearAgo) return pick(oneYearAgo, 'One year ago tonight');

    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const monthAgo = sorted.find(c => {
      const diff = Math.abs(new Date(c.date).getTime() - thirtyDaysAgo);
      return diff < 2 * 86400000 && c.id !== lastSurfacedId;
    });
    if (monthAgo) return pick(monthAgo, 'About a month ago');

    const oldCards = sorted.filter(c => Date.now() - new Date(c.date).getTime() > 7 * 86400000 && c.id !== lastSurfacedId);
    if (oldCards.length > 0) {
      const idx = today.getDate() % oldCards.length;
      const card = oldCards[idx];
      const daysAgo = Math.round((Date.now() - new Date(card.date).getTime()) / 86400000);
      return pick(card, `${daysAgo} nights ago`);
    }
    return null;
  }, [allCards, userId]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const primaryChild = activeChild || characters.find(c => c.isFamily && c.type === 'human') || characters[0];
  const childName = primaryChild?.name || user?.displayName || 'friend';
  const isFirstTime = storyCount === 0 && cardCount === 0;

  const ritualState = userId && !ritualDone ? getRitualState(userId) : null;
  const nextRitualNight = ritualState?.currentNight || 1;

  // If ritual is done but companionCreature is null, try resolving from ritual state
  const ritualState2 = userId && ritualDone && !companionCreature ? getRitualState(userId) : null;
  const ritualFallbackDk = ritualState2?.creatureEmoji ? V1_DREAMKEEPERS.find(dk => dk.emoji === ritualState2.creatureEmoji) : null;
  const effectiveCompanion = companionCreature || (ritualFallbackDk ? {
    id: 'ritual-fallback',
    name: ritualState2?.creatureName || ritualFallbackDk.name,
    creatureEmoji: ritualFallbackDk.emoji,
    creatureType: ritualFallbackDk.animal,
    color: ritualState2?.creatureColor || ritualFallbackDk.color,
  } as HatchedCreature : null);

  const isPreHatchEgg = !ritualDone || effectiveCompanion?.creatureType === 'spirit' || effectiveCompanion?.creatureEmoji === '\uD83E\uDD5A';
  const dk = isPreHatchEgg ? null : resolveDreamKeeper(effectiveCompanion);
  const creatureImageSrc = dk?.imageSrc;
  const creatureName = isPreHatchEgg ? (effectiveCompanion?.name || 'Dream Egg') : (effectiveCompanion?.name || dk?.name || '');
  const creatureColor = effectiveCompanion?.color || dk?.color || '#F5B84C';
  const creatureEmoji = isPreHatchEgg ? '\uD83E\uDD5A' : (effectiveCompanion?.creatureEmoji || dk?.emoji || '\uD83C\uDF19');
  const rgb = hexToRgb(creatureColor);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ── Stars ─────────────────────────────────────────────────────────────────
  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 50; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 60,
      s: 1 + Math.random() * 0.8, d: 3 + Math.random() * 4, dl: Math.random() * 5,
    });
    return arr;
  }, []);

  // ── Guest state — functional guest dashboard ──────────────────────────────
  if (!user || user.isGuest) {
    return (
      <div className="ms">
        <style>{CSS}</style>
        <div className="ms-inner" style={{ paddingTop: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌙</div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 400,
            marginBottom: 8, color: '#F4EFE8', letterSpacing: '-.5px',
          }}>
            Welcome to SleepSeed
          </div>
          <div style={{ fontSize: 14, color: 'rgba(244,239,232,.4)', lineHeight: 1.7, marginBottom: 36, maxWidth: 280, margin: '0 auto 36px' }}>
            Personalised bedtime stories — written in seconds, read together, remembered forever.
          </div>

          {/* Try a story */}
          <button
            onClick={() => setView('ritual-starter')}
            style={{
              width: '100%', maxWidth: 300, padding: '18px 32px', border: 'none', borderRadius: 16,
              background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
              color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Nunito',system-ui,sans-serif",
              boxShadow: '0 6px 24px rgba(200,130,20,.3)',
              marginBottom: 14, display: 'block', marginLeft: 'auto', marginRight: 'auto',
            }}
          >
            Try a bedtime story
          </button>

          {/* Browse library */}
          <button
            onClick={() => setView('library')}
            style={{
              width: '100%', maxWidth: 300, padding: '14px 32px', borderRadius: 16,
              border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)',
              color: 'rgba(244,239,232,.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Nunito',system-ui,sans-serif",
              marginBottom: 40, display: 'block', marginLeft: 'auto', marginRight: 'auto',
            }}
          >
            Browse the story library
          </button>

          {/* Sign up CTA */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 28 }}>
            <div style={{ fontSize: 12, color: 'rgba(244,239,232,.3)', marginBottom: 12, fontFamily: "'DM Mono',monospace", letterSpacing: '.5px' }}>
              Want to save your stories?
            </div>
            <button
              onClick={onSignUp}
              style={{
                padding: '12px 32px', borderRadius: 12,
                border: '1px solid rgba(245,184,76,.25)', background: 'rgba(245,184,76,.06)',
                color: '#F5B84C', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Nunito',system-ui,sans-serif",
              }}
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Ambient stars */}
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
            {greeting}, <span style={{ color: 'rgba(245,184,76,.85)' }}>{childName}</span>
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 11,
            color: 'rgba(245,184,76,.5)', marginTop: 6, letterSpacing: '.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span>
              {cardCount > 0
                ? `Night ${cardCount + 1}`
                : 'This is where your memories will live'
              }
            </span>
            {streak > 1 && (
              <span style={{
                color: 'rgba(245,184,76,.6)',
                ...(streak >= 7 ? { animation: 'ms-streakGlow 3s ease-in-out infinite' } : {}),
              }}>
                {'\uD83C\uDF19'} {streak} nights strong
              </span>
            )}
          </div>
        </div>

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

          {/* Creature image, DreamEgg, or emoji fallback */}
          <div style={{
            width: 200, height: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...(!isPreHatchEgg ? { animation: 'ms-creatureIdle 7s ease-in-out infinite' } : {}),
            position: 'relative', zIndex: 2,
          }}>
            {isPreHatchEgg ? (
              <DreamEgg
                state={(ritualState?.eggState as EggState) || 'idle'}
                size={160}
              />
            ) : creatureImageSrc ? (
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

          {/* Shard tracker — 7-night egg progress card */}
          {activeEgg && ritualDone && !isPreHatchEgg && (
            <div style={{
              marginTop: 18, width: '100%', maxWidth: 280,
              background: 'linear-gradient(168deg, rgba(4,14,12,.92), rgba(6,16,14,.96))',
              border: '1px solid rgba(20,216,144,.15)',
              borderRadius: 18, padding: '16px 18px 14px',
              animation: 'ms-fadeUp .6s .2s ease-out both',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Subtle inner glow */}
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 200, height: 80, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(20,216,144,.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Top row: egg emoji + badge + nights left */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12, position: 'relative', zIndex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 20,
                    filter: 'drop-shadow(0 0 8px rgba(20,216,144,.3))',
                  }}>{'\uD83E\uDD5A'}</span>
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    letterSpacing: '.06em', padding: '3px 9px', borderRadius: 20,
                    background: 'rgba(20,216,144,.08)', border: '1px solid rgba(20,216,144,.18)',
                    color: 'rgba(20,216,144,.65)',
                  }}>
                    Night {eggStage} of 7
                  </span>
                </div>
                <span style={{
                  fontFamily: "'Fraunces',Georgia,serif", fontSize: 11,
                  fontStyle: 'italic', color: 'rgba(20,216,144,.35)',
                }}>
                  {eggStage >= 7 ? 'Ready!' : `${7 - eggStage} to hatch`}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 3, background: 'rgba(255,255,255,.06)',
                overflow: 'hidden', marginBottom: 10, position: 'relative', zIndex: 1,
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: eggStage >= 7
                    ? 'linear-gradient(90deg, #0a9a5a, #14d890, #0a9a5a)'
                    : 'linear-gradient(90deg, rgba(20,216,144,.4), #14d890)',
                  width: `${Math.round((eggStage / 7) * 100)}%`,
                  transition: 'width .4s ease',
                  boxShadow: eggStage > 0 ? '0 0 8px rgba(20,216,144,.3)' : 'none',
                }} />
              </div>

              {/* 7 shard dots */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, position: 'relative', zIndex: 1,
              }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const filled = i < eggStage;
                  const card = filled ? eggCards[i] : null;
                  const isNext = i === eggStage;
                  return (
                    <div
                      key={i}
                      onClick={() => { if (card) setViewingCard(card); }}
                      style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: filled ? '#14d890' : isNext ? 'rgba(20,216,144,.15)' : 'rgba(255,255,255,.05)',
                        boxShadow: filled ? '0 0 6px rgba(20,216,144,.45)' : 'none',
                        border: filled ? '1px solid rgba(20,216,144,.5)' : isNext ? '1px solid rgba(20,216,144,.25)' : '1px solid rgba(255,255,255,.08)',
                        cursor: filled ? 'pointer' : 'default',
                        transition: 'all .25s ease',
                        ...(isNext ? { animation: 'ms-glowPulse 3s ease-in-out infinite' } : {}),
                      }}
                    />
                  );
                })}
              </div>

              {/* Hatch button when ready */}
              {eggStage >= 7 && onHatchReady && (
                <button
                  onClick={() => onHatchReady(childName, activeChild?.id || '')}
                  style={{
                    width: '100%', marginTop: 12, padding: '10px 20px',
                    border: 'none', borderRadius: 14,
                    background: 'linear-gradient(135deg, #0a7a50, #14d890 50%, #0a7a50)',
                    color: '#030408', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Nunito',sans-serif",
                    boxShadow: '0 6px 20px rgba(20,216,144,.3), inset 0 1px 0 rgba(255,255,255,.2)',
                    transition: 'transform .15s, filter .15s',
                    position: 'relative', zIndex: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
                >
                  Your egg is ready {'\u2014'} hatch now {'\u2728'}
                </button>
              )}
            </div>
          )}

          {/* Greeting bubble */}
          <CreatureGreeting childName={childName} creatureName={creatureName} rgb={rgb} cardCount={cardCount} />
        </div>

        {/* ═══ 3. PRIMARY CTA (single smart button, always) ═══ */}
        <div style={{
          margin: '8px 0 16px',
          animation: 'ms-fadeUp .8s .3s ease-out both',
        }}>
          <button
            onClick={() => {
              if (!ritualDone) { setView('onboarding-ritual'); return; }
              if (activeJourney) { setActiveJourneyId(activeJourney.id); setView('nightly-checkin'); return; }
              setView('ritual-starter');
            }}
            style={{
              width: '100%', padding: '22px 24px 20px', border: 'none', borderRadius: 18,
              background: 'linear-gradient(160deg, #8a5a10 0%, #c8891a 20%, #F5B84C 50%, #c8891a 80%, #8a5a10 100%)',
              color: '#0a0600', cursor: 'pointer',
              fontFamily: "'Fraunces',Georgia,serif",
              animation: 'ms-ctaPulse 3s ease-in-out infinite',
              transition: 'transform .2s ease, filter .2s ease',
              position: 'relative', overflow: 'hidden', textAlign: 'center',
              boxShadow: '0 8px 32px rgba(200,130,20,.3), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -1px 0 rgba(0,0,0,.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'; e.currentTarget.style.filter = 'brightness(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
          >
            <div style={{
              fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.3,
            }}>
              {!ritualDone
                ? `Begin Ritual Night ${nextRitualNight}`
                : activeJourney
                  ? `Continue tonight\u2019s chapter`
                  : isFirstTime ? 'Begin your first story' : 'Read together tonight'
              }
            </div>
            {activeJourney && ritualDone && (
              <div style={{
                fontSize: 11, fontWeight: 400, opacity: .6, marginTop: 4,
                fontFamily: "'DM Mono',monospace", letterSpacing: '.03em',
              }}>
                {activeJourney.workingTitle || 'Your book'} — Night {activeJourney.readNumber ?? 1} of 7
              </div>
            )}
            {/* Progress bar for journey */}
            {activeJourney && ritualDone && (() => {
              const progressPct = Math.max(0, Math.min(100, (((activeJourney.readNumber ?? 1) - 1) / 7) * 100));
              return (
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,.15)', marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'rgba(0,0,0,.35)', width: `${progressPct}%`, transition: 'width .3s ease' }} />
                </div>
              );
            })()}
            <span style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'ms-shimmer 3.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          </button>
        </div>

        {/* ═══ 3b. JOURNEY INVITATION (subtle, when no active journey) ═══ */}
        {!activeJourney && !journeyLoading && ritualDone && !isFirstTime && (
          <div style={{
            animation: 'ms-fadeUp .8s .35s ease-out both',
            marginBottom: 28,
          }}>
            <button
              onClick={() => { setActiveJourneyId(null); setView('journey-setup'); }}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                background: 'rgba(255,255,255,.02)',
                border: '1px solid rgba(255,255,255,.06)',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: "'Nunito',system-ui,sans-serif",
                transition: 'background .2s, transform .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{'\uD83D\uDCD6'}</span>
                <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 400, color: 'rgba(244,239,232,.6)' }}>
                  Start a 7-Night Book
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(244,239,232,.3)', lineHeight: 1.5, paddingLeft: 28 }}>
                {creatureName && creatureName !== 'Dream Egg'
                  ? `A story that grows across 7 bedtimes \u2014 with ${creatureName} alongside ${childName}`
                  : `A story that grows across 7 bedtimes \u2014 just for ${childName}`
                }
              </div>
            </button>
          </div>
        )}

        {/* ═══ 4. TONIGHT'S CARD (rendered as actual Night Card) ═══ */}
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const tonightCard = allCards.find(c => c.date?.startsWith(today));
          if (!tonightCard) return null;
          return (
            <div style={{
              animation: 'ms-fadeUp .8s .35s ease-out both',
              marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{
                width: 30, height: 1, margin: '0 auto 20px',
                background: 'linear-gradient(90deg, transparent, rgba(20,216,144,.3), transparent)',
              }} />
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 300,
                fontStyle: 'italic', color: 'rgba(245,184,76,.6)', marginBottom: 14,
                textAlign: 'center',
              }}>
                Tonight{'\u2019'}s memory
              </div>
              <div
                onClick={() => setViewingCard(tonightCard)}
                style={{
                  width: 160, cursor: 'pointer',
                  filter: 'drop-shadow(0 12px 28px rgba(0,0,0,.5)) drop-shadow(0 0 20px rgba(20,216,144,.12))',
                }}
              >
                <NightCardComponent card={tonightCard} size="mini" />
              </div>
            </div>
          );
        })()}

        {/* ═══ 5. RESURFACED MEMORY (proper card) ═══ */}
        {resurfacedCard && (
          <div style={{ animation: 'ms-fadeUp .8s .4s ease-out both', marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <span style={{ fontSize: 12 }}>{resurfacedCard.card.creatureEmoji || creatureEmoji}</span>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(244,239,232,.28)', letterSpacing: '.06em',
                textTransform: 'uppercase' as const,
              }}>{resurfacedCard.label}</span>
            </div>
            <div
              onClick={() => setViewingCard(resurfacedCard.card)}
              style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                transition: 'background .2s, transform .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.transform = ''; }}
            >
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, fontWeight: 500,
                color: '#F4EFE8', lineHeight: 1.35, marginBottom: 6,
              }}>
                {resurfacedCard.card.headline}
              </div>
              {resurfacedCard.card.memory_line && (
                <div style={{
                  fontFamily: "'Nunito',sans-serif", fontSize: 13,
                  fontStyle: 'italic', color: 'rgba(244,239,232,.4)',
                  lineHeight: 1.5, marginBottom: 8,
                }}>
                  {resurfacedCard.card.memory_line}
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'DM Mono',monospace", fontSize: 9,
                color: 'rgba(244,239,232,.18)',
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

        {/* ═══ 6. MEMORY STRIP (horizontal scroll) ═══ */}
        {recentCards.length > 0 && (
          <div style={{ animation: 'ms-fadeUp .8s .5s ease-out both', marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
            }}>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: 'rgba(245,184,76,.5)', letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}>
                Memories
              </div>
              {cardCount > 3 && (
                <div
                  onClick={() => setView('nightcard-library')}
                  style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(245,184,76,.35)', cursor: 'pointer',
                    letterSpacing: '.04em',
                  }}
                >
                  See all {cardCount} {'\u2192'}
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
                      {card.creatureEmoji || card.emoji || creatureEmoji}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                      background: 'linear-gradient(transparent, rgba(15,10,32,.9))',
                    }} />
                  </div>
                  <div style={{ padding: '7px 9px 9px' }}>
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
                      color: 'rgba(244,239,232,.18)',
                    }}>
                      {card.date ? new Date(card.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ 7. CREATURE GROWTH LINE ═══ */}
        {cardCount >= 3 && (
          <div style={{
            animation: 'ms-fadeUp .8s .55s ease-out both',
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 16, padding: '18px 20px', textAlign: 'center',
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(245,184,76,.7)', lineHeight: 1.6,
            }}>
              {creatureName || 'Your DreamKeeper'} remembers {cardCount} {cardCount === 1 ? 'night' : 'nights'} with {childName}.
            </div>
            {(() => {
              const withContent = allCards.filter((c: any) => c.bondingAnswer || c.memory_line);
              const highlight = withContent.length > 0
                ? withContent[Math.floor(Date.now() / 86400000) % withContent.length]
                : null;
              if (!highlight) return null;
              const verb = highlight.childMood === '\uD83D\uDE06' ? 'The silliest' : highlight.childMood === '\uD83D\uDE0C' ? 'The calmest' : highlight.childMood === '\uD83E\uDD70' ? 'The most loving' : highlight.isOrigin ? 'The very first' : 'A favorite';
              return (
                <div style={{
                  fontFamily: "'Nunito',sans-serif", fontSize: 12,
                  color: 'rgba(244,239,232,.5)', fontStyle: 'italic', lineHeight: 1.5,
                  marginTop: 6,
                }}>
                  {verb} was: "{highlight.headline}"
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ 8. MEMORY VAULT LINK ═══ */}
        {cardCount > 0 && (
          <div
            onClick={() => setView('nightcard-library')}
            style={{
              animation: 'ms-fadeUp .8s .6s ease-out both',
              textAlign: 'center', padding: '8px 0 16px', cursor: 'pointer',
            }}
          >
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(245,184,76,.35)', letterSpacing: '.04em',
              borderBottom: '1px solid rgba(245,184,76,.12)', paddingBottom: 2,
              transition: 'color .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(245,184,76,.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,184,76,.35)'; }}
            >
              {childName}{'\u2019'}s Memory Vault {'\u2014'} {cardCount} {cardCount === 1 ? 'night' : 'nights'} {'\u2192'}
            </span>
          </div>
        )}

        {/* First-time empty state */}
        {isFirstTime && (
          <div style={{
            animation: 'ms-fadeUp .8s .4s ease-out both', marginBottom: 28,
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 16, padding: '20px 24px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(245,184,76,.55)', lineHeight: 1.6,
              marginBottom: 6,
            }}>
              {creatureName && creatureName !== 'Dream Egg'
                ? `${creatureName} is waiting for your first story together.`
                : 'Your DreamKeeper is waiting for your first story.'}
            </div>
            <div style={{
              fontFamily: "'Nunito',sans-serif", fontSize: 12,
              color: 'rgba(244,239,232,.3)', lineHeight: 1.5,
            }}>
              Every night creates a memory worth keeping.
            </div>
          </div>
        )}

      </div>

      {/* Night Card detail — paginated swipe viewer */}
      {viewingCard && (
        <>
          <div
            onClick={() => setViewingCard(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
              zIndex: 200,
            }}
          />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, pointerEvents: 'none',
          }}>
            <div style={{ pointerEvents: 'all', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' as any }}>
              <NightCardDetailPaginated
                card={viewingCard}
                onClose={() => setViewingCard(null)}
                onOpenStory={(card) => {
                  setViewingCard(null);
                  if (card.storyId && onReadStory) {
                    const story = allStories.find(s => s.id === card.storyId);
                    if (story?.bookData) onReadStory(story.bookData);
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
