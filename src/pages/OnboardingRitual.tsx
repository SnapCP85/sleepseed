import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import {
  getRitualState,
  completeNight1,
  completeNight2,
  completeNight3,
  type RitualState,
} from '../lib/ritualState';
import { saveNightCard } from '../lib/storage';
import type { SavedNightCard } from '../lib/types';
import RitualNight1 from '../components/ritual/RitualNight1';
import RitualNight2 from '../components/ritual/RitualNight2';
import RitualNight3 from '../components/ritual/RitualNight3';

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingRitual — Master orchestrator for the 3-night hatching ritual
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onRitualComplete: () => void;
  onExit: () => void;
}

/** Save a ritual night card to storage (best-effort, non-blocking) */
function saveRitualNightCard(
  userId: string,
  nightNumber: number,
  title: string,
  headline: string,
  quote: string,
  ritual: RitualState,
) {
  const card: SavedNightCard = {
    id: crypto.randomUUID?.() || `ritual_n${nightNumber}_${Date.now()}`,
    userId,
    heroName: ritual.childName || '',
    storyTitle: title,
    characterIds: [],
    headline,
    quote,
    memory_line: headline,
    emoji: ritual.creatureEmoji || '🌙',
    date: new Date().toISOString().split('T')[0],
    isOrigin: nightNumber === 1,
    nightNumber,
    streakCount: nightNumber,
    creatureEmoji: ritual.creatureEmoji || '🌙',
    creatureColor: ritual.creatureColor || '#F5B84C',
  };
  saveNightCard(card).catch(e => console.error(`[ritual] Night ${nightNumber} card save failed:`, e));
}

export default function OnboardingRitual({ onRitualComplete, onExit, demoWalkthrough }: Props & { demoWalkthrough?: boolean }) {
  const { user } = useApp();
  const [ritual, setRitual] = useState<RitualState | null>(null);

  useEffect(() => {
    if (!user) return;
    setRitual(getRitualState(user.id));
  }, [user]);

  if (!user || !ritual) return null;

  if (ritual.ritualComplete) {
    onRitualComplete();
    return null;
  }

  const currentNight = ritual.currentNight;

  if (currentNight === 1) {
    return (
      <RitualNight1
        ritual={ritual}
        onComplete={(smileAnswer) => {
          const updated = completeNight1(user.id, smileAnswer);
          setRitual(updated);

          // Save Night 1 card
          saveRitualNightCard(
            user.id, 1,
            'The Night You Were Chosen',
            'The Night You Were Chosen',
            `${ritual.childName || 'They'} said "${smileAnswer}" — and the egg began to glow.`,
            ritual,
          );

          if (demoWalkthrough) { /* continue to night 2 — don't exit */ }
          else onExit();
        }}
      />
    );
  }

  if (currentNight === 2) {
    return (
      <RitualNight2
        ritual={ritual}
        onComplete={(talentAnswer) => {
          const updated = completeNight2(user.id, talentAnswer);
          setRitual(updated);

          // Save Night 2 card
          saveRitualNightCard(
            user.id, 2,
            'The Night of the Dreamlight',
            'The Night of the Dreamlight',
            `${ritual.childName || 'They'} shared a gift — ${talentAnswer} — and the Dreamlight burned brighter.`,
            ritual,
          );

          if (demoWalkthrough) { /* continue to night 3 — don't exit */ }
          else onExit();
        }}
      />
    );
  }

  if (currentNight === 3) {
    return (
      <RitualNight3
        ritual={ritual}
        userId={user.id}
        onComplete={() => {
          // Re-read ritual state to get the custom name from the naming step
          const freshRitual = getRitualState(user.id);
          const updated = completeNight3(user.id);
          // Preserve the custom name through completion
          if (freshRitual.creatureName) updated.creatureName = freshRitual.creatureName;
          setRitual(updated);

          // Save Night 3 card (hatching)
          saveRitualNightCard(
            user.id, 3,
            'The Night Your DreamKeeper Was Born',
            'The Night Your DreamKeeper Was Born',
            `After three nights of listening, ${updated.creatureName || ritual.creatureName || 'the DreamKeeper'} chose to become ${ritual.childName || 'theirs'}'s.`,
            ritual,
          );

          onRitualComplete();
        }}
      />
    );
  }

  return null;
}
