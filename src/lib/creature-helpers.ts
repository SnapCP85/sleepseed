// src/lib/creature-helpers.ts
// Client-side creature resolution for passing to API routes.
// API routes cannot import TypeScript files, so this runs on the client.

import { CREATURES } from './creatures';
import type { CreatureDef } from './creatures';

export interface ResolvedCreatureData {
  name: string;
  virtue: string;
  storyPersonality: string;
  lessonBeat: string;
  emoji: string;
  color: string;
  creatureType: string;
}

/**
 * Resolves full creature data for a given creature ID and read number.
 * Call this on the client before making journey API calls.
 */
export function resolveCreatureForRead(
  creatureId: string,
  readNumber: number
): ResolvedCreatureData {
  const creatureDef: CreatureDef | undefined = CREATURES.find(c => c.id === creatureId);

  if (!creatureDef) {
    return {
      name: 'companion',
      virtue: '',
      storyPersonality: '',
      lessonBeat: '',
      emoji: '🌟',
      color: '#F5B84C',
      creatureType: creatureId,
    };
  }

  // Resolve lesson beat for this read number (readNumber 1-7 maps to index 0-6)
  const beatIndex = Math.max(0, readNumber - 1);
  const lessonBeat = Array.isArray(creatureDef.lessonBeats) && creatureDef.lessonBeats[beatIndex]
    ? `Night ${creatureDef.lessonBeats[beatIndex].night}: ${creatureDef.lessonBeats[beatIndex].theme}`
    : '';

  return {
    name: creatureDef.name,
    virtue: creatureDef.virtue,
    storyPersonality: creatureDef.storyPersonality,
    lessonBeat,
    emoji: creatureDef.emoji,
    color: creatureDef.color,
    creatureType: creatureDef.id,
  };
}

/**
 * Resolves the NEXT creature to hatch after book completion.
 * Returns a creature that the character hasn't hatched yet.
 */
export function resolveNextCreature(
  currentCreatureId: string,
  hatchedCreatureTypes: string[]
): {
  creatureType: string;
  name: string;
  nameSuggestions: string[];
  creatureEmoji: string;
  color: string;
  rarity: 'common' | 'rare' | 'legendary';
  personalityTraits: string[];
  virtue: string;
} {
  const allExcluded = new Set([currentCreatureId, ...hatchedCreatureTypes]);
  const available = CREATURES.filter(c => !allExcluded.has(c.id));
  const next = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : CREATURES[0];

  return {
    creatureType: next.id,
    name: next.nameSuggestions.length > 0 ? next.nameSuggestions[0] : next.name,
    nameSuggestions: next.nameSuggestions.slice(0, 4),
    creatureEmoji: next.emoji,
    color: next.color,
    rarity: 'common',
    personalityTraits: next.virtueKeywords,
    virtue: next.virtue,
  };
}
