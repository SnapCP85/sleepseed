import { supabase } from './supabase';
import type { HatcheryEgg, HatchedCreature, CreatureRarity, SavedNightCard } from './types';

// ── Creature pool ────────────────────────────────────────────────────────────

const CREATURES = [
  { type: 'Moon Bunny',    emoji: '🐰' },
  { type: 'Star Phoenix',  emoji: '🔥' },
  { type: 'Dream Moth',    emoji: '🦋' },
  { type: 'Ember Fox',     emoji: '🦊' },
  { type: 'Storm Drake',   emoji: '🐉' },
  { type: 'Tide Serpent',  emoji: '🌊' },
  { type: 'Dusk Owl',      emoji: '🦉' },
  { type: 'Frost Wolf',    emoji: '🐺' },
  { type: 'Bloom Sprite',  emoji: '🌸' },
  { type: 'Thunder Pup',   emoji: '⚡' },
  { type: 'Shadow Cat',    emoji: '🌙' },
  { type: 'Comet Deer',    emoji: '✨' },
];

// ── DB row → TypeScript mappers ──────────────────────────────────────────────

const dbToEgg = (row: any): HatcheryEgg => ({
  id: row.id,
  userId: row.user_id,
  characterId: row.character_id,
  creatureType: row.creature_type,
  creatureEmoji: row.creature_emoji,
  weekNumber: row.week_number,
  startedAt: row.started_at,
  createdAt: row.created_at,
});

const dbToCreature = (row: any): HatchedCreature => ({
  id: row.id,
  userId: row.user_id,
  characterId: row.character_id,
  name: row.name,
  creatureType: row.creature_type,
  creatureEmoji: row.creature_emoji,
  rarity: row.rarity,
  weekNumber: row.week_number,
  personalityTraits: row.personality_traits ?? [],
  favouriteQuote: row.favourite_quote ?? undefined,
  hatchedAt: row.hatched_at,
  createdAt: row.created_at,
});

// ── Query functions ──────────────────────────────────────────────────────────

export async function getActiveEgg(userId: string, characterId: string): Promise<HatcheryEgg | null> {
  const { data, error } = await supabase
    .from('hatchery_eggs')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .single();
  if (error || !data) return null;
  return dbToEgg(data);
}

export function getEggStage(egg: HatcheryEgg, nightCards: SavedNightCard[]): number {
  const startDate = egg.startedAt.split('T')[0];
  const count = nightCards.filter(card =>
    card.characterIds.includes(egg.characterId) &&
    card.date.split('T')[0] >= startDate
  ).length;
  return Math.min(count, 7);
}

export async function getHatchedCreatures(userId: string, characterId: string): Promise<HatchedCreature[]> {
  const { data, error } = await supabase
    .from('hatched_creatures')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .order('week_number', { ascending: true });
  if (error || !data) return [];
  return data.map(dbToCreature);
}

export async function getAllHatchedCreatures(userId: string): Promise<HatchedCreature[]> {
  const { data, error } = await supabase
    .from('hatched_creatures')
    .select('*')
    .eq('user_id', userId)
    .order('hatched_at', { ascending: false });
  if (error || !data) return [];
  return data.map(dbToCreature);
}

export async function createEgg(userId: string, characterId: string, weekNumber: number): Promise<HatcheryEgg> {
  const creature = CREATURES[Math.floor(Math.random() * CREATURES.length)];
  const { data, error } = await supabase
    .from('hatchery_eggs')
    .insert({
      user_id: userId,
      character_id: characterId,
      creature_type: creature.type,
      creature_emoji: creature.emoji,
      week_number: weekNumber,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to create egg: ${error?.message}`);
  return dbToEgg(data);
}

export async function hatchEgg(
  egg: HatcheryEgg,
  name: string,
  rarity: CreatureRarity,
  personalityTraits: string[],
  favouriteQuote: string,
): Promise<HatchedCreature> {
  const now = new Date().toISOString();

  // Insert hatched creature
  const { data, error } = await supabase
    .from('hatched_creatures')
    .insert({
      user_id: egg.userId,
      character_id: egg.characterId,
      name,
      creature_type: egg.creatureType,
      creature_emoji: egg.creatureEmoji,
      rarity,
      week_number: egg.weekNumber,
      personality_traits: personalityTraits,
      favourite_quote: favouriteQuote,
      hatched_at: now,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to hatch creature: ${error?.message}`);

  // Delete the old egg
  await supabase
    .from('hatchery_eggs')
    .delete()
    .eq('id', egg.id);

  // Start the next egg automatically
  await createEgg(egg.userId, egg.characterId, egg.weekNumber + 1);

  return dbToCreature(data);
}
