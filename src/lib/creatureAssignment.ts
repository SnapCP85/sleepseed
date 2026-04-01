/**
 * Creature Assignment — derives a DreamKeeper from 3 nights of answers.
 *
 * If a favorite animal question is added later, that answer takes priority.
 * Otherwise, the system uses the smile + talent answers to match a creature
 * based on keyword/feeling alignment with V1_DREAMKEEPERS.
 */

import { V1_DREAMKEEPERS, type DreamKeeper } from './dreamkeepers';

// Keyword → feeling mapping for answer analysis
const ANSWER_FEELINGS: Record<string, string[]> = {
  // Smile answers
  'Playing': ['brave', 'curious'],
  'A hug': ['safe', 'cozy'],
  'My pet': ['cozy', 'calm'],
  'Something silly': ['curious', 'cozy'],
  'Being outside': ['brave', 'curious'],
  'Something else': ['calm', 'safe'],
  // Talent answers
  'Making things': ['curious', 'brave'],
  'Helping others': ['safe', 'cozy'],
  'Running fast': ['brave', 'curious'],
  'Being kind': ['safe', 'calm'],
  'Making people laugh': ['cozy', 'curious'],
  'Something wonderful': ['calm', 'sleepy'],
};

/**
 * Assign a DreamKeeper based on the child's 3 nights of answers.
 * @param smileAnswer - Night 1 answer ("what made you smile")
 * @param talentAnswer - Night 2 answer ("what are you good at")
 * @param favoriteAnimal - Optional: if the child picked a favorite animal, use that directly
 */
export function assignCreature(
  smileAnswer: string,
  talentAnswer: string,
  favoriteAnimal?: string,
): DreamKeeper {
  // If favorite animal was explicitly chosen, find matching creature
  if (favoriteAnimal) {
    const match = V1_DREAMKEEPERS.find(dk =>
      dk.animal.toLowerCase() === favoriteAnimal.toLowerCase() ||
      dk.id.toLowerCase() === favoriteAnimal.toLowerCase()
    );
    if (match) return match;
  }

  // Score each creature based on feeling alignment
  const feelingScores: Record<string, number> = {};

  // Accumulate feelings from answers
  [smileAnswer, talentAnswer].forEach(answer => {
    const feelings = ANSWER_FEELINGS[answer] || ['calm', 'safe'];
    feelings.forEach((f, idx) => {
      feelingScores[f] = (feelingScores[f] || 0) + (idx === 0 ? 2 : 1);
    });
  });

  // Score each creature
  let bestCreature = V1_DREAMKEEPERS[0];
  let bestScore = -1;

  V1_DREAMKEEPERS.forEach(dk => {
    let score = 0;
    dk.feelingMatch.forEach((feeling, idx) => {
      const weight = idx === 0 ? 3 : 1; // Primary feeling matters more
      score += (feelingScores[feeling] || 0) * weight;
    });
    if (score > bestScore) {
      bestScore = score;
      bestCreature = dk;
    }
  });

  return bestCreature;
}
