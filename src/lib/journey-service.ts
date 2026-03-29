import { supabase } from './supabase';
import type { StoryJourney, StorySeries, JourneySummary, StoryJourneyChapter } from './types';

// Helpers to map DB snake_case rows to camelCase types
function rowToJourney(row: Record<string, unknown>, chapters: StoryJourneyChapter[] = []): StoryJourney {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    characterId: row.character_id as string,
    creatureId: row.creature_id as string,
    status: row.status as StoryJourney['status'],
    readNumber: row.read_number as StoryJourney['readNumber'],
    totalReads: 7,
    workingTitle: row.working_title as string,
    finalTitle: row.final_title as string | undefined,
    seriesId: row.series_id as string | null,
    storyBible: (row.story_bible as StoryJourney['storyBible']) || {} as StoryJourney['storyBible'],
    chapters,
    memoryBank: (row.memory_bank as StoryJourney['memoryBank']) || {
      favoriteObjects: [], recurringPlaces: [], recurringPhrases: [],
      emotionalMilestones: [], relationshipMoments: [], sensoryImages: [],
    },
    unresolvedThreads: (row.unresolved_threads as string[]) || [],
    resolvedThreads: (row.resolved_threads as string[]) || [],
    finalBookId: row.final_book_id as string | null,
    spawnedEggId: row.spawned_egg_id as string | null,
    hatchedCreatureId: row.hatched_creature_id as string | null,
    startedFrom: row.started_from as StoryJourney['startedFrom'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: row.completed_at as string | null,
  };
}

export const journeyService = {
  /**
   * Get the single active journey for a specific character.
   * Returns null if no active journey — that means: show "Begin a new book".
   * Journeys persist indefinitely with no penalties for missed nights.
   */
  async getActiveJourney(userId: string, characterId: string): Promise<StoryJourney | null> {
    const { data, error } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', String(characterId))
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return null;

    const { data: chapters } = await supabase
      .from('story_journey_chapters')
      .select('*')
      .eq('story_journey_id', data.id)
      .order('read_number', { ascending: true });

    return rowToJourney(data, chapters || []);
  },

  async getJourneyWithChapters(journeyId: string): Promise<StoryJourney | null> {
    const { data } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();
    if (!data) return null;

    const { data: chapters } = await supabase
      .from('story_journey_chapters')
      .select('*')
      .eq('story_journey_id', journeyId)
      .order('read_number', { ascending: true });

    return rowToJourney(data, chapters || []);
  },

  async getCompletedBooks(userId: string): Promise<StoryJourney[]> {
    const { data } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    return (data || []).map(row => rowToJourney(row));
  },

  async getAllJourneys(userId: string): Promise<StoryJourney[]> {
    const { data } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return (data || []).map(row => rowToJourney(row));
  },

  async getSeries(userId: string): Promise<StorySeries[]> {
    const { data } = await supabase
      .from('story_series')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return (data || []) as StorySeries[];
  },

  async getJourneySummary(journeyId: string): Promise<JourneySummary | null> {
    const { data } = await supabase
      .from('journey_summaries')
      .select('*')
      .eq('story_journey_id', journeyId)
      .single();
    if (!data) return null;
    return {
      id: data.id,
      storyJourneyId: data.story_journey_id,
      userId: data.user_id,
      characterId: data.character_id,
      summaryTitle: data.summary_title,
      emotionalArc: data.emotional_arc || '',
      highlights: data.highlights || [],
      nightCardReel: data.night_card_reel || [],
      unlockedCharacterId: data.unlocked_character_id,
      payload: data.payload || {},
      createdAt: data.created_at,
    };
  },

  /**
   * Archive the current active journey for a character.
   * Used when starting a new book — the old book stays archived, not deleted.
   */
  async archiveJourney(journeyId: string): Promise<void> {
    await supabase
      .from('story_journeys')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', journeyId);
  },
};
