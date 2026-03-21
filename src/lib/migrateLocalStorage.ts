/**
 * migrateLocalStorage.ts
 *
 * One-time migration: reads stories + night cards from every localStorage
 * key that SleepSeedCore has historically used and writes them to Supabase.
 *
 * Safe to call on every login — checks a migration flag first and no-ops
 * if already done. Errors are caught per-item so a single bad record
 * doesn't abort the whole migration.
 */

import { saveStory, saveNightCard, getStories, getNightCards } from './storage';
import type { SavedStory, SavedNightCard } from './types';

const MIGRATION_KEY = 'ss_migrated_to_supabase_v1';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function safeDate(raw: any): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  if (typeof raw === 'string' && raw.length >= 10) return raw.slice(0, 10);
  return new Date().toISOString().split('T')[0];
}

// ── Read every relevant localStorage key ─────────────────────────────────────

function readLocalStories(userId: string): SavedStory[] {
  const results: SavedStory[] = [];
  const seen = new Set<string>();

  const add = (items: any[], source: string) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      try {
        const id = item.id || uid();
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          userId,
          title:        item.title        || item.bookData?.title || 'Untitled story',
          heroName:     item.heroName     || item.bookData?.heroName || '',
          characterIds: item.characterIds || [],
          refrain:      item.refrain      || item.bookData?.refrain || undefined,
          date:         safeDate(item.date),
          occasion:     item.occasion     || undefined,
          bookData:     item.bookData     || item,
        });
      } catch (e) {
        console.warn(`[migration] Skipping malformed story from ${source}:`, e);
      }
    }
  };

  // SleepSeedCore internal key: ss9_memories → { items: [...] }
  try {
    const raw = localStorage.getItem('ss9_memories');
    if (raw) {
      const parsed = JSON.parse(raw);
      add(parsed?.items || [], 'ss9_memories');
    }
  } catch (e) { console.warn('[migration] Could not read ss9_memories:', e); }

  // v2 mirror key: ss2_stories_<userId>
  try {
    const raw = localStorage.getItem(`ss2_stories_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      add(Array.isArray(parsed) ? parsed : [], `ss2_stories_${userId}`);
    }
  } catch (e) { console.warn(`[migration] Could not read ss2_stories_${userId}:`, e); }

  return results;
}

function readLocalNightCards(userId: string): SavedNightCard[] {
  const results: SavedNightCard[] = [];
  const seen = new Set<string>();

  const add = (items: any[], source: string) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      try {
        const id = item.id || uid();
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          userId,
          heroName:       item.heroName       || '',
          storyTitle:     item.storyTitle     || item.storyName || '',
          characterIds:   item.characterIds   || [],
          headline:       item.headline       || '',
          quote:          item.quote          || item.bondingA  || item.bondingAnswer || '',
          memory_line:    item.memory_line    || undefined,
          bondingQuestion:item.bondingQuestion|| item.bondingQ  || undefined,
          bondingAnswer:  item.bondingAnswer  || item.bondingA  || undefined,
          gratitude:      item.gratitude      || item.gratitudeA|| undefined,
          extra:          item.extra          || item.extraA    || undefined,
          photo:          item.photo          || undefined,
          emoji:          item.emoji          || '🌙',
          date:           safeDate(item.date),
        });
      } catch (e) {
        console.warn(`[migration] Skipping malformed night card from ${source}:`, e);
      }
    }
  };

  // SleepSeedCore internal key: ss9_nightcards → { items: [...] }
  try {
    const raw = localStorage.getItem('ss9_nightcards');
    if (raw) {
      const parsed = JSON.parse(raw);
      add(parsed?.items || [], 'ss9_nightcards');
    }
  } catch (e) { console.warn('[migration] Could not read ss9_nightcards:', e); }

  // v2 mirror key: ss2_nightcards_<userId>
  try {
    const raw = localStorage.getItem(`ss2_nightcards_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      add(Array.isArray(parsed) ? parsed : [], `ss2_nightcards_${userId}`);
    }
  } catch (e) { console.warn(`[migration] Could not read ss2_nightcards_${userId}:`, e); }

  return results;
}

// ── Main migration function ───────────────────────────────────────────────────

export async function migrateLocalStorageToSupabase(userId: string): Promise<{
  storiesMigrated: number;
  cardsMigrated: number;
  skipped: number;
}> {
  // Already done
  if (localStorage.getItem(MIGRATION_KEY) === userId) {
    return { storiesMigrated: 0, cardsMigrated: 0, skipped: 0 };
  }

  // Nothing in localStorage at all — mark done immediately
  const hasAnyLocal =
    localStorage.getItem('ss9_memories') ||
    localStorage.getItem('ss9_nightcards') ||
    localStorage.getItem(`ss2_stories_${userId}`) ||
    localStorage.getItem(`ss2_nightcards_${userId}`);

  if (!hasAnyLocal) {
    localStorage.setItem(MIGRATION_KEY, userId);
    return { storiesMigrated: 0, cardsMigrated: 0, skipped: 0 };
  }

  console.log('[migration] Starting localStorage → Supabase migration…');

  let storiesMigrated = 0;
  let cardsMigrated = 0;
  let skipped = 0;

  // ── Stories ──
  const localStories = readLocalStories(userId);

  if (localStories.length > 0) {
    // Get IDs already in Supabase to avoid duplicates
    const existing = await getStories(userId);
    const existingIds = new Set(existing.map(s => s.id));

    for (const story of localStories) {
      if (existingIds.has(story.id)) { skipped++; continue; }
      try {
        await saveStory(story);
        storiesMigrated++;
      } catch (e) {
        console.warn('[migration] Failed to save story:', story.id, e);
        skipped++;
      }
    }
  }

  // ── Night Cards ──
  const localCards = readLocalNightCards(userId);

  if (localCards.length > 0) {
    const existing = await getNightCards(userId);
    const existingIds = new Set(existing.map(c => c.id));

    for (const card of localCards) {
      if (existingIds.has(card.id)) { skipped++; continue; }
      try {
        await saveNightCard(card);
        cardsMigrated++;
      } catch (e) {
        console.warn('[migration] Failed to save night card:', card.id, e);
        skipped++;
      }
    }
  }

  // Mark complete for this user
  localStorage.setItem(MIGRATION_KEY, userId);

  console.log(
    `[migration] Done. Stories: ${storiesMigrated}, Night Cards: ${cardsMigrated}, Skipped: ${skipped}`
  );

  return { storiesMigrated, cardsMigrated, skipped };
}
