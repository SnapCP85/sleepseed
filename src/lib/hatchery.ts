import { supabase } from './supabase';
import type { HatchedCreature, HatcheryEgg } from './types';
import { getCreature } from './creatures';

function uid(): string {
  return Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}

const dbToCreature = (row: any): HatchedCreature => ({
  id:                row.id,
  userId:            row.user_id,
  characterId:       row.character_id,
  name:              row.name,
  creatureType:      row.creature_type,
  creatureEmoji:     row.creature_emoji,
  color:             row.color ?? '#F5B84C',
  rarity:            row.rarity ?? 'common',
  personalityTraits: row.personality_traits ?? [],
  dreamAnswer:       row.dream_answer ?? '',
  parentSecret:      row.parent_secret ?? '',
  photoUrl:          row.photo_url ?? undefined,
  weekNumber:        row.week_number ?? 1,
  hatchedAt:         row.hatched_at,
  createdAt:         row.created_at,
});

const dbToEgg = (row: any): HatcheryEgg => ({
  id:            row.id,
  userId:        row.user_id,
  characterId:   row.character_id,
  creatureType:  row.creature_type,
  creatureEmoji: row.creature_emoji,
  weekNumber:    row.week_number ?? 1,
  startedAt:     row.started_at,
  createdAt:     row.created_at,
});

export const getAllHatchedCreatures = async (userId: string): Promise<HatchedCreature[]> => {
  const { data, error } = await supabase
    .from('hatched_creatures')
    .select('*')
    .eq('user_id', userId)
    .order('hatched_at', { ascending: false });
  if (error) { console.error('getAllHatchedCreatures:', error); return []; }
  return (data ?? []).map(dbToCreature);
};

export const getHatchedCreatures = async (userId: string, characterId: string): Promise<HatchedCreature[]> => {
  const { data, error } = await supabase
    .from('hatched_creatures')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .order('hatched_at', { ascending: false });
  if (error) { console.error('getHatchedCreatures:', error); return []; }
  return (data ?? []).map(dbToCreature);
};

export const saveHatchedCreature = async (c: HatchedCreature): Promise<void> => {
  const { error } = await supabase.from('hatched_creatures').upsert({
    id:                 c.id,
    user_id:            c.userId,
    character_id:       c.characterId,
    name:               c.name,
    creature_type:      c.creatureType,
    creature_emoji:     c.creatureEmoji,
    color:              c.color,
    rarity:             c.rarity,
    personality_traits: c.personalityTraits,
    dream_answer:       c.dreamAnswer,
    parent_secret:      c.parentSecret,
    photo_url:          c.photoUrl ?? null,
    week_number:        c.weekNumber,
    hatched_at:         c.hatchedAt,
  });
  if (error) console.error('saveHatchedCreature:', error);
};

export const getActiveEgg = async (userId: string, characterId: string): Promise<HatcheryEgg | null> => {
  const { data, error } = await supabase
    .from('hatchery_eggs')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .maybeSingle();
  if (error) { console.error('getActiveEgg:', error); return null; }
  return data ? dbToEgg(data) : null;
};

export const createEgg = async (
  userId: string,
  characterId: string,
  creatureType: string,
  weekNumber: number
): Promise<HatcheryEgg> => {
  const def = getCreature(creatureType);
  const row = {
    id:             uid(),
    user_id:        userId,
    character_id:   characterId,
    creature_type:  def.id,
    creature_emoji: def.emoji,
    week_number:    weekNumber,
    started_at:     new Date().toISOString(),
    created_at:     new Date().toISOString(),
  };
  const { error } = await supabase.from('hatchery_eggs').upsert(row);
  if (error) console.error('createEgg:', error);
  return dbToEgg(row);
};

export const deleteEgg = async (userId: string, characterId: string): Promise<void> => {
  const { error } = await supabase
    .from('hatchery_eggs')
    .delete()
    .eq('user_id', userId)
    .eq('character_id', characterId);
  if (error) console.error('deleteEgg:', error);
};
