// storage.ts — Supabase backend
// All data now lives in Postgres via Supabase.
// Function signatures match the old localStorage version exactly.

import { supabase, hasSupabase } from './supabase';
import type { Character, SavedStory, SavedNightCard, LibraryStory, UserProfile, StoryRole, StoryRoleType } from './types';

// ── Utility ───────────────────────────────────────────────────────────────────

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function strHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++)
    h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function generateLibrarySlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  const suffix = strHash(title + Date.now()).slice(0, 4);
  return `${base}-${suffix}`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  if (data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, display_name: displayName });
  }
  return data.user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

export const signInAsGuest = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// ── Photo upload ──────────────────────────────────────────────────────────────

export const uploadPhoto = async (userId: string, base64: string, name: string): Promise<string> => {
  try {
    const path = `${userId}/${name}_${Date.now()}.jpg`;
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, contentType: 'image/jpeg', base64 }),
    });
    if (!res.ok) return base64;
    const { url } = await res.json();
    return url || base64;
  } catch {
    return base64;
  }
};

// ── localStorage helpers (fallback when Supabase unavailable) ─────────────────
const lsGet = <T>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const lsSet = (key: string, data: any[]) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };
const LS_CHARS = (uid: string) => `ss2_chars_${uid}`;
const LS_STORIES = (uid: string) => `ss2_stories_${uid}`;
const LS_CARDS = (uid: string) => `ss2_nightcards_${uid}`;

// ── Characters ────────────────────────────────────────────────────────────────

const dbToChar = (row: any): Character => ({
  id: row.id, userId: row.user_id, name: row.name, type: row.type,
  ageDescription: row.age_description ?? '', pronouns: row.pronouns ?? 'they/them',
  personalityTags: row.personality_tags ?? [], weirdDetail: row.weird_detail ?? '',
  currentSituation: row.current_situation ?? '', photo: row.photo_url,
  color: row.color ?? '#1E1640', emoji: row.emoji ?? '🌙',
  storyIds: row.story_ids ?? [], createdAt: row.created_at, updatedAt: row.updated_at,
  isFamily: row.is_family ?? undefined,
  parentRole: row.parent_role ?? undefined,
  birthDate: row.birth_date ?? undefined,
});

export const getCharacters = async (userId: string): Promise<Character[]> => {
  const local = lsGet<Character>(LS_CHARS(userId));
  try {
    const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (!error && data?.length) {
      const db = data.map(dbToChar);
      const ids = new Set(local.map(c => c.id));
      const merged = [...local, ...db.filter(c => !ids.has(c.id))];
      if (merged.length > local.length) lsSet(LS_CHARS(userId), merged);
      return merged;
    }
  } catch(e) { console.error('[storage] getCharacters error:', e); }
  return local;
};

export const saveCharacter = async (c: Character): Promise<void> => {
  // localStorage first
  const existing = lsGet<Character>(LS_CHARS(c.userId)).filter(x => x.id !== c.id);
  lsSet(LS_CHARS(c.userId), [{ ...c, updatedAt: new Date().toISOString() }, ...existing]);
  // Supabase sync
  try {
    let photoUrl = c.photo ?? null;
    if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(c.userId, photoUrl, `char_${c.id}`);
    await supabase.from('characters').upsert({
      id: c.id, user_id: c.userId, name: c.name, type: c.type,
      age_description: c.ageDescription, pronouns: c.pronouns,
      personality_tags: c.personalityTags, weird_detail: c.weirdDetail,
      current_situation: c.currentSituation, photo_url: photoUrl,
      color: c.color, emoji: c.emoji, story_ids: c.storyIds,
      is_family: c.isFamily ?? null,
      parent_role: c.parentRole ?? null,
      birth_date: c.birthDate ?? null,
      updated_at: new Date().toISOString(),
    });
  } catch(e) { console.error('[storage] saveCharacter Supabase error:', e); }
};

export const deleteCharacter = async (userId: string, charId: string): Promise<void> => {
  lsSet(LS_CHARS(userId), lsGet<Character>(LS_CHARS(userId)).filter(c => c.id !== charId));
  try { await supabase.from('characters').delete().eq('id', charId).eq('user_id', userId); } catch(e) { console.error('[storage] deleteCharacter error:', e); }
};

export const tagCharacterInStory = async (userId: string, characterId: string, storyId: string): Promise<void> => {
  const chars = await getCharacters(userId);
  const char = chars.find(c => c.id === characterId);
  if (!char || char.storyIds.includes(storyId)) return;
  await saveCharacter({ ...char, storyIds: [...char.storyIds, storyId] });
};

// ── Stories ───────────────────────────────────────────────────────────────────

const dbToStory = (row: any): SavedStory => ({
  id: row.id, userId: row.user_id, title: row.title, heroName: row.hero_name,
  characterIds: row.character_ids ?? [], refrain: row.refrain, date: row.date,
  occasion: row.occasion, bookData: row.book_data,
  ageGroup: row.age_group ?? undefined, vibe: row.vibe ?? undefined,
  theme: row.theme ?? undefined, mood: row.mood ?? undefined,
  storyStyle: row.story_style ?? undefined, storyLength: row.story_length ?? undefined,
  lessons: row.lessons ?? undefined, isPublic: row.is_public ?? false,
  librarySlug: row.library_slug ?? undefined, thumbsUp: row.thumbs_up ?? 0,
  thumbsDown: row.thumbs_down ?? 0, readCount: row.read_count ?? 0,
  isStaffPick: row.is_staff_pick ?? false,
});

export const getStories = async (userId: string): Promise<SavedStory[]> => {
  const local = lsGet<SavedStory>(LS_STORIES(userId));
  try {
    const { data, error } = await supabase.from('stories').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30);
    if (!error && data?.length) {
      const db = data.map(dbToStory);
      const ids = new Set(local.map(s => s.id));
      const merged = [...local, ...db.filter(s => !ids.has(s.id))];
      if (merged.length > local.length) lsSet(LS_STORIES(userId), merged);
      return merged.sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch(e) { console.error('[storage] getStories error:', e); }
  return local.sort((a, b) => b.date.localeCompare(a.date));
};

export const saveStory = async (s: SavedStory): Promise<void> => {
  const existing = lsGet<SavedStory>(LS_STORIES(s.userId)).filter(x => x.id !== s.id);
  lsSet(LS_STORIES(s.userId), [s, ...existing]);
  try {
    const row: any = {
      id: s.id, user_id: s.userId, title: s.title, hero_name: s.heroName,
      character_ids: s.characterIds ?? [], refrain: s.refrain ?? null,
      date: s.date, occasion: s.occasion ?? null, book_data: s.bookData,
    };
    if (s.ageGroup !== undefined) row.age_group = s.ageGroup;
    if (s.vibe !== undefined) row.vibe = s.vibe;
    if (s.theme !== undefined) row.theme = s.theme;
    if (s.mood !== undefined) row.mood = s.mood;
    if (s.storyStyle !== undefined) row.story_style = s.storyStyle;
    if (s.storyLength !== undefined) row.story_length = s.storyLength;
    if (s.lessons !== undefined) row.lessons = s.lessons;
    if (s.coverUrl !== undefined) row.cover_url = s.coverUrl;
    if (s.isPublic !== undefined) row.is_public = s.isPublic;
    if (s.librarySlug !== undefined) row.library_slug = s.librarySlug;
    if (s.isStaffPick !== undefined) row.is_staff_pick = s.isStaffPick;
    await supabase.from('stories').upsert(row);
  } catch(e) { console.error('[storage] saveStory Supabase error:', e); }
};

// ── Private story share tokens ──────────────────────────────────────────────
// Creates a share token for a private story. The story stays private but
// anyone with the token can read it without logging in.
export const createStoryShareToken = async (storyId: string): Promise<string> => {
  const token = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    await supabase.from('story_shares').upsert({
      story_id: storyId,
      share_token: token,
      created_at: new Date().toISOString(),
    });
  } catch (e) { console.error('[storage] createStoryShareToken error:', e); }
  return token;
};

// Fetches a story by its share token — no auth required
export const getStoryByShareToken = async (token: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('story_shares')
      .select('story_id')
      .eq('share_token', token)
      .single();
    if (error || !data) return null;
    const { data: story, error: storyErr } = await supabase
      .from('stories')
      .select('id, title, hero_name, character_ids, refrain, date, book_data')
      .eq('id', data.story_id)
      .single();
    if (storyErr || !story) return null;
    // Strip sensitive data
    const bookData = story.book_data || {};
    delete bookData.parentNote;
    delete bookData.nightCard;
    return {
      id: story.id,
      title: story.title,
      heroName: story.hero_name,
      refrain: story.refrain,
      date: story.date,
      bookData,
    };
  } catch (e) { console.error('[storage] getStoryByShareToken error:', e); return null; }
};

export const deleteStory = async (userId: string, storyId: string): Promise<void> => {
  lsSet(LS_STORIES(userId), lsGet<SavedStory>(LS_STORIES(userId)).filter(s => s.id !== storyId));
  try { await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId); } catch(e) { console.error('[storage] deleteStory error:', e); }
};

// ── Night Cards ───────────────────────────────────────────────────────────────

const dbToCard = (row: any): SavedNightCard => {
  let extra = row.extra ?? undefined;
  let isOrigin: boolean | undefined;
  let whisper: string | undefined;
  let occasion: string | undefined;
  let streakCount: number | undefined;
  let nightNumber: number | undefined;
  let creatureEmoji: string | undefined;
  let creatureColor: string | undefined;
  if (extra && extra.startsWith('{')) {
    try {
      const p = JSON.parse(extra);
      if (p.isOrigin) isOrigin = true;
      if (p.whisper)  whisper  = p.whisper;
      if (p.occasion) occasion = p.occasion;
      if (p.streakCount != null) streakCount = p.streakCount;
      if (p.nightNumber != null) nightNumber = p.nightNumber;
      if (p.creatureEmoji) creatureEmoji = p.creatureEmoji;
      if (p.creatureColor) creatureColor = p.creatureColor;
      if (p.note)     extra    = p.note;
      else            extra    = undefined;
    } catch(_) {}
  }
  return {
    id: row.id, userId: row.user_id, heroName: row.hero_name, storyId: row.story_id,
    storyTitle: row.story_title, characterIds: row.character_ids ?? [],
    headline: row.headline, quote: row.quote, memory_line: row.memory_line,
    bondingQuestion: row.bonding_question, bondingAnswer: row.bonding_answer,
    gratitude: row.gratitude, extra, photo: row.photo_url,
    emoji: row.emoji, date: row.date, isOrigin, whisper,
    occasion, streakCount, nightNumber, creatureEmoji, creatureColor,
    // Phase 1 enrichment — unpacked from extra JSON
    ...(extra && extra.startsWith?.('{') ? {} : {}), // already parsed above
    ...(() => {
      try {
        const p = typeof row.extra === 'string' && row.extra.startsWith('{') ? JSON.parse(row.extra) : {};
        return {
          childMood: p.childMood || undefined,
          childAge: p.childAge || undefined,
          parentReflection: p.parentReflection || undefined,
          tags: p.tags || undefined,
          bedtimeActual: p.bedtimeActual || undefined,
          lessonTheme: p.lessonTheme || undefined,
          milestone: p.milestone || undefined,
          audioClip: p.audioClip || undefined,
          childDrawing: p.childDrawing || undefined,
        };
      } catch { return {}; }
    })(),
  };
};

export const getNightCards = async (userId: string): Promise<SavedNightCard[]> => {
  // Read from v2 key (primary)
  const local = lsGet<SavedNightCard>(LS_CARDS(userId));

  // Also read from v1 key (SleepSeedCore's key) to catch cards that never made it to v2
  let v1Cards: SavedNightCard[] = [];
  try {
    const v1Key = `ss9_u_${userId}_nightcards`;
    const v1Raw = localStorage.getItem(v1Key);
    if (v1Raw) {
      const v1Data = JSON.parse(v1Raw);
      const items = v1Data?.items || (Array.isArray(v1Data) ? v1Data : []);
      v1Cards = items.filter((c: any) => c && c.id);
    }
  } catch(e) { /* ignore parse errors */ }

  // Merge v1 into local (deduplicate by id)
  const localIds = new Set(local.map(c => c.id));
  const fromV1 = v1Cards.filter(c => !localIds.has(c.id));
  const combined = [...local, ...fromV1.map(c => ({
    ...c,
    // Normalize field names (v1 uses bondingQ/bondingA, v2 uses bondingQuestion/bondingAnswer)
    bondingQuestion: (c as any).bondingQuestion || (c as any).bondingQ || undefined,
    bondingAnswer: (c as any).bondingAnswer || (c as any).bondingA || undefined,
    // Strip base64 photos
    photo: (c.photo as any)?.startsWith?.('data:') ? undefined : c.photo,
  } as SavedNightCard))];

  if (fromV1.length > 0) {
    console.log(`[storage] getNightCards: recovered ${fromV1.length} cards from v1 key (total: ${combined.length})`);
    // Persist merged set back to v2 (strip base64)
    const stripped = combined.map(c => ({...c,
      photo: (c.photo as any)?.startsWith?.('data:') ? undefined : c.photo,
    }));
    lsSet(LS_CARDS(userId), stripped);
  }

  // Also fetch from Supabase and merge
  try {
    const { data, error } = await supabase.from('night_cards').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(200);
    if (!error && data?.length) {
      const db = data.map(dbToCard);
      const dbMap = new Map(db.map(c => [c.id, c]));
      // Enrich local cards with Supabase-only fields (childDrawing, photo, parentReflection, audioClip)
      // These are stripped from localStorage to save space but exist in Supabase extra JSON
      const enriched = combined.map(c => {
        const dbCard = dbMap.get(c.id);
        if (!dbCard) return c;
        return {
          ...c,
          childDrawing: c.childDrawing || dbCard.childDrawing,
          photo: c.photo || dbCard.photo,
          parentReflection: c.parentReflection || dbCard.parentReflection,
          audioClip: c.audioClip || dbCard.audioClip,
          whisper: c.whisper || dbCard.whisper,
        };
      });
      // Add cards only in Supabase (not in local)
      const localIds = new Set(combined.map(c => c.id));
      const merged = [...enriched, ...db.filter(c => !localIds.has(c.id))];
      if (merged.length > combined.length) {
        console.log(`[storage] getNightCards: +${merged.length - combined.length} from Supabase (total: ${merged.length})`);
      }
      // Don't write enriched base64 fields back to localStorage (would exceed quota)
      const forStorage = merged.map(c => ({...c,
        childDrawing: (c.childDrawing as any)?.startsWith?.('data:') ? undefined : c.childDrawing,
        photo: (c.photo as any)?.startsWith?.('data:') ? undefined : c.photo,
      }));
      lsSet(LS_CARDS(userId), forStorage);
      return merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
  } catch(e) { console.error('[storage] getNightCards Supabase error:', e); }
  return combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
};

export const saveNightCard = async (nc: SavedNightCard): Promise<void> => {
  // localStorage first — strip base64 data to prevent QuotaExceededError
  const stripBase64 = (c: SavedNightCard): SavedNightCard => ({...c,
    photo: c.photo?.startsWith?.('data:') ? undefined : c.photo,
    childDrawing: (c as any).childDrawing?.startsWith?.('data:') ? undefined : (c as any).childDrawing,
  });
  const existing = lsGet<SavedNightCard>(LS_CARDS(nc.userId)).filter(x => x.id !== nc.id).map(stripBase64);
  const newArr = [stripBase64(nc), ...existing];
  lsSet(LS_CARDS(nc.userId), newArr);
  console.log('[storage] saveNightCard v2 write — key:', LS_CARDS(nc.userId), 'count:', newArr.length);
  // Supabase sync
  try {
    let photoUrl = nc.photo ?? null;
    if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(nc.userId, photoUrl, `nc_${nc.id}`);
    let extraField = nc.extra ?? null;
    if (nc.isOrigin || nc.whisper || nc.occasion || nc.streakCount != null || nc.nightNumber != null || nc.creatureEmoji || nc.creatureColor || nc.childMood || nc.childAge || nc.parentReflection || nc.tags || nc.bedtimeActual || nc.lessonTheme || nc.milestone || nc.audioClip || nc.childDrawing) {
      try {
        const packed: any = {};
        if (nc.isOrigin) packed.isOrigin = true;
        if (nc.whisper)  packed.whisper  = nc.whisper;
        if (nc.occasion) packed.occasion = nc.occasion;
        if (nc.streakCount != null) packed.streakCount = nc.streakCount;
        if (nc.nightNumber != null) packed.nightNumber = nc.nightNumber;
        if (nc.creatureEmoji) packed.creatureEmoji = nc.creatureEmoji;
        if (nc.creatureColor) packed.creatureColor = nc.creatureColor;
        if (nc.childMood) packed.childMood = nc.childMood;
        if (nc.childAge)  packed.childAge  = nc.childAge;
        if (nc.parentReflection) packed.parentReflection = nc.parentReflection;
        if (nc.tags?.length) packed.tags = nc.tags;
        if (nc.bedtimeActual) packed.bedtimeActual = nc.bedtimeActual;
        if (nc.lessonTheme) packed.lessonTheme = nc.lessonTheme;
        if (nc.milestone) packed.milestone = nc.milestone;
        if (nc.audioClip) packed.audioClip = nc.audioClip;
        if (nc.childDrawing) packed.childDrawing = nc.childDrawing;
        if (nc.extra)    packed.note     = nc.extra;
        extraField = JSON.stringify(packed);
      } catch(_) {}
    }
    // First try with storyId, fall back to null if FK constraint fails
    const baseRow = {
      id: nc.id, user_id: nc.userId, hero_name: nc.heroName,
      story_title: nc.storyTitle, character_ids: nc.characterIds ?? [],
      headline: nc.headline, quote: nc.quote, memory_line: nc.memory_line ?? null,
      bonding_question: nc.bondingQuestion ?? null, bonding_answer: nc.bondingAnswer ?? null,
      gratitude: nc.gratitude ?? null, extra: extraField,
      photo_url: photoUrl, emoji: nc.emoji ?? null, date: nc.date,
    };
    let { error: ncErr } = await supabase.from('night_cards').upsert({...baseRow, story_id: nc.storyId ?? null});
    // If FK constraint fails (story not in DB), retry without storyId
    if (ncErr?.code === '23503') {
      console.warn('[storage] storyId FK failed, retrying without storyId');
      ({ error: ncErr } = await supabase.from('night_cards').upsert({...baseRow, story_id: null}));
    }
    if (ncErr) console.error('[storage] saveNightCard Supabase error:', JSON.stringify(ncErr));
    else console.log('[storage] Night Card saved to Supabase:', nc.id, nc.headline);
  } catch (e) { console.error('[storage] saveNightCard exception:', e); }
};

export const deleteNightCard = async (userId: string, cardId: string): Promise<void> => {
  lsSet(LS_CARDS(userId), lsGet<SavedNightCard>(LS_CARDS(userId)).filter(c => c.id !== cardId));
  try { await supabase.from('night_cards').delete().eq('id', cardId).eq('user_id', userId); } catch(e) { console.error('[storage] deleteNightCard error:', e); }
};

// ── Library: DB row mapper ────────────────────────────────────────────────

const dbToLibraryStory = (row: any): LibraryStory => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  heroName: row.hero_name,
  characterIds: row.character_ids ?? [],
  refrain: row.refrain ?? undefined,
  date: row.date,
  occasion: row.occasion ?? undefined,
  bookData: row.book_data ?? undefined,
  isPublic: row.is_public ?? false,
  librarySlug: row.library_slug ?? '',
  ageGroup: row.age_group ?? undefined,
  vibe: row.vibe ?? undefined,
  theme: row.theme ?? undefined,
  mood: row.mood ?? undefined,
  storyStyle: row.story_style ?? undefined,
  storyLength: row.story_length ?? undefined,
  lessons: row.lessons ?? undefined,
  coverUrl: row.cover_url ?? undefined,
  submittedAt: row.submitted_at ?? undefined,
  thumbsUp: row.thumbs_up ?? 0,
  thumbsDown: row.thumbs_down ?? 0,
  readCount: row.read_count ?? 0,
  conversionCount: row.conversion_count ?? 0,
  isStaffPick: row.is_staff_pick ?? false,
  isBookOfDay: row.is_book_of_day ?? false,
  bookOfDayDate: row.book_of_day_date ?? undefined,
  submitterDisplayName: row.profiles?.display_name ?? undefined,
  submitterRefCode: row.profiles?.ref_code ?? undefined,
});

const LIBRARY_LIST_COLS = 'id,user_id,title,hero_name,character_ids,refrain,date,occasion,is_public,library_slug,age_group,vibe,theme,mood,story_style,story_length,lessons,cover_url,submitted_at,thumbs_up,thumbs_down,read_count,conversion_count,is_staff_pick,is_book_of_day,book_of_day_date';
const LIBRARY_FULL_COLS = LIBRARY_LIST_COLS + ',book_data';

// ── Library: queries ─────────────────────────────────────────────────────

export const getLibraryStories = async (filters?: {
  ageGroup?: string;
  vibe?: string;
  mood?: string;
  isStaffPick?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'recent' | 'popular' | 'thumbs';
}): Promise<LibraryStory[]> => {
  let q = supabase.from('stories').select(LIBRARY_LIST_COLS).eq('is_public', true);
  if (filters?.ageGroup) q = q.eq('age_group', filters.ageGroup);
  if (filters?.vibe) q = q.eq('vibe', filters.vibe);
  if (filters?.mood) q = q.eq('mood', filters.mood);
  if (filters?.isStaffPick) q = q.eq('is_staff_pick', true);
  if (filters?.search) q = q.or(`title.ilike.%${filters.search}%,hero_name.ilike.%${filters.search}%`);
  const orderCol = filters?.orderBy === 'popular' ? 'read_count' : filters?.orderBy === 'thumbs' ? 'thumbs_up' : 'submitted_at';
  q = q.order(orderCol, { ascending: false, nullsFirst: false });
  const limit = Math.min(filters?.limit ?? 20, 50);
  q = q.range(filters?.offset ?? 0, (filters?.offset ?? 0) + limit - 1);
  const { data, error } = await q;
  if (error) { console.error('[library] getLibraryStories:', error); return []; }
  return (data ?? []).map(dbToLibraryStory);
};

export const getLibraryStoryBySlug = async (slug: string): Promise<LibraryStory | null> => {
  const { data, error } = await supabase
    .from('stories')
    .select(LIBRARY_FULL_COLS)
    .eq('library_slug', slug)
    .eq('is_public', true)
    .single();
  if (error || !data) return null;
  const story = dbToLibraryStory(data);
  if (story.bookData) {
    delete story.bookData.parentNote;
    delete story.bookData.nightCard;
  }
  // Atomic increment — avoids race condition under concurrent reads
  // Try RPC first, fall back to non-atomic if RPC doesn't exist yet
  supabase.rpc('increment_read_count', { story_id: story.id })
    .then(({ error: rpcErr }) => {
      if (rpcErr) {
        supabase.from('stories')
          .update({ read_count: (story.readCount || 0) + 1 })
          .eq('id', story.id)
          .then(() => {});
      }
    });
  return story;
};

export const getBookOfDay = async (): Promise<LibraryStory | null> => {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('stories')
    .select(LIBRARY_FULL_COLS)
    .eq('is_book_of_day', true)
    .eq('book_of_day_date', today)
    .single();
  if (data) {
    const story = dbToLibraryStory(data);
    if (story.bookData) { delete story.bookData.parentNote; delete story.bookData.nightCard; }
    return story;
  }
  const { data: fallback } = await supabase
    .from('stories')
    .select(LIBRARY_FULL_COLS)
    .eq('is_book_of_day', true)
    .order('book_of_day_date', { ascending: false })
    .limit(1)
    .single();
  if (!fallback) return null;
  const story = dbToLibraryStory(fallback);
  if (story.bookData) { delete story.bookData.parentNote; delete story.bookData.nightCard; }
  return story;
};

export const getFeaturedLibraryStories = async (limit = 5): Promise<LibraryStory[]> => {
  const { data: picks } = await supabase
    .from('stories')
    .select(LIBRARY_LIST_COLS)
    .eq('is_public', true)
    .eq('is_staff_pick', true)
    .order('thumbs_up', { ascending: false })
    .limit(limit);
  const results = (picks ?? []).map(dbToLibraryStory);
  if (results.length >= limit) return results.slice(0, limit);
  const pickIds = results.map(s => s.id);
  const remaining = limit - results.length;
  let q2 = supabase
    .from('stories')
    .select(LIBRARY_LIST_COLS)
    .eq('is_public', true)
    .order('thumbs_up', { ascending: false })
    .limit(remaining);
  if (pickIds.length > 0) q2 = q2.not('id', 'in', `(${pickIds.join(',')})`);
  const { data: popular } = await q2;
  return [...results, ...(popular ?? []).map(dbToLibraryStory)].slice(0, limit);
};

// ── Library: submission ──────────────────────────────────────────────────

export const submitStoryToLibrary = async (
  storyId: string,
  userId: string,
  metadata: {
    ageGroup?: string;
    vibe?: string;
    theme?: string;
    mood?: string;
    storyStyle?: string;
    storyLength?: string;
    lessons?: string[];
  }
): Promise<{ slug: string }> => {
  const { data: existing } = await supabase
    .from('stories')
    .select('title, is_public, library_slug')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();
  if (!existing) throw new Error('Story not found');
  if (existing.is_public && existing.library_slug) return { slug: existing.library_slug };
  const slug = generateLibrarySlug(existing.title);
  const row: any = {
    is_public: true,
    library_slug: slug,
    submitted_at: new Date().toISOString(),
  };
  if (metadata.ageGroup) row.age_group = metadata.ageGroup;
  if (metadata.vibe) row.vibe = metadata.vibe;
  if (metadata.theme) row.theme = metadata.theme;
  if (metadata.mood) row.mood = metadata.mood;
  if (metadata.storyStyle) row.story_style = metadata.storyStyle;
  if (metadata.storyLength) row.story_length = metadata.storyLength;
  if (metadata.lessons) row.lessons = metadata.lessons;
  const { error } = await supabase.from('stories').update(row).eq('id', storyId).eq('user_id', userId);
  if (error) throw error;
  return { slug };
};

export const removeStoryFromLibrary = async (storyId: string, userId: string): Promise<void> => {
  await supabase.from('stories').update({ is_public: false }).eq('id', storyId).eq('user_id', userId);
};

// ── Library: voting ──────────────────────────────────────────────────────

export const voteOnStory = async (
  storyId: string,
  vote: 1 | -1,
  voteNote?: string,
  userId?: string,
  sessionId?: string,
): Promise<void> => {
  const row: any = { story_id: storyId, vote };
  if (userId) row.user_id = userId;
  if (sessionId && !userId) row.session_id = sessionId;
  if (voteNote) row.vote_note = voteNote;
  await supabase.from('story_votes').upsert(row, {
    onConflict: userId ? 'story_id,user_id' : 'story_id,session_id',
  });
  const { data: votes } = await supabase.from('story_votes').select('vote').eq('story_id', storyId);
  const up = (votes ?? []).filter((v: any) => v.vote === 1).length;
  const down = (votes ?? []).filter((v: any) => v.vote === -1).length;
  await supabase.from('stories').update({ thumbs_up: up, thumbs_down: down }).eq('id', storyId);
};

export const getUserVote = async (
  storyId: string,
  userId?: string,
  sessionId?: string,
): Promise<1 | -1 | null> => {
  if (userId) {
    const { data } = await supabase.from('story_votes').select('vote').eq('story_id', storyId).eq('user_id', userId).single();
    return (data?.vote as 1 | -1) ?? null;
  }
  if (sessionId) {
    const { data } = await supabase.from('story_votes').select('vote').eq('story_id', storyId).eq('session_id', sessionId).single();
    return (data?.vote as 1 | -1) ?? null;
  }
  return null;
};

// ── Library: favourites ──────────────────────────────────────────────────

export const addToFavourites = async (userId: string, storyId: string): Promise<void> => {
  await supabase.from('library_favourites').upsert(
    { user_id: userId, story_id: storyId },
    { onConflict: 'user_id,story_id' },
  );
};

export const removeFromFavourites = async (userId: string, storyId: string): Promise<void> => {
  await supabase.from('library_favourites').delete().eq('user_id', userId).eq('story_id', storyId);
};

export const getFavourites = async (userId: string): Promise<LibraryStory[]> => {
  const { data, error } = await supabase
    .from('library_favourites')
    .select('story_id, saved_at, stories!inner(id,user_id,title,hero_name,character_ids,refrain,date,occasion,is_public,library_slug,age_group,vibe,theme,mood,story_style,story_length,lessons,submitted_at,thumbs_up,thumbs_down,read_count,conversion_count,is_staff_pick,is_book_of_day,book_of_day_date)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error || !data) return [];
  return data
    .filter((r: any) => r.stories)
    .map((r: any) => dbToLibraryStory(r.stories));
};

export const isFavourited = async (userId: string, storyId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('library_favourites')
    .select('id')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();
  return !!data;
};

// ── Library: role extraction ─────────────────────────────────────────────

export function extractRoles(bookData: any): StoryRole[] {
  const chars: any[] = bookData?.allChars || [];
  if (chars.length === 0 && bookData?.heroName) {
    return [{
      role: 'protagonist' as StoryRoleType,
      originalName: bookData.heroName,
      displayName: bookData.heroName,
      type: 'hero',
      isSubstitutable: true,
    }];
  }
  return chars.map((c: any) => ({
    role: (c.type === 'hero' ? 'protagonist'
         : c.type === 'creature' ? 'companion'
         : c.type === 'parent' ? 'parent'
         : c.type === 'pet' ? 'pet'
         : 'friend') as StoryRoleType,
    originalName: c.name || '',
    displayName: c.name || '',
    type: c.type || 'friend',
    pronouns: c.gender === 'girl' ? 'she/her'
            : c.gender === 'boy' ? 'he/him'
            : undefined,
    description: c.note || c.classify || undefined,
    isSubstitutable: c.type === 'hero' || c.type === 'creature',
  }));
}

// ── Library: related stories ────────────────────────────────────────────

export const getRelatedStories = async (
  storyId: string,
  mood?: string,
  vibe?: string,
  limit = 6,
): Promise<LibraryStory[]> => {
  if (!hasSupabase) return [];
  try {
    let query = supabase
      .from('stories')
      .select('id,title,hero_name,library_slug,age_group,vibe,mood,thumbs_up,read_count,is_staff_pick,refrain')
      .eq('is_public', true)
      .neq('id', storyId)
      .not('library_slug', 'is', null);

    // Filter by matching mood or vibe for emotional adjacency
    if (mood || vibe) {
      const conditions: string[] = [];
      if (mood) conditions.push(`mood.eq.${mood}`);
      if (vibe) conditions.push(`vibe.eq.${vibe}`);
      query = query.or(conditions.join(','));
    }

    const { data, error } = await query
      .order('read_count', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(dbToLibraryStory);
  } catch (e) {
    console.error('[storage] getRelatedStories error:', e);
    return [];
  }
};

// ── Library: attribution ─────────────────────────────────────────────────

export const recordStoryRead = async (
  storyId: string,
  options: { refCode?: string; userId?: string; sessionId?: string },
): Promise<void> => {
  const row: any = { story_id: storyId };
  if (options.userId) row.reader_user_id = options.userId;
  if (options.sessionId) row.session_id = options.sessionId;
  if (options.refCode) {
    row.ref_code = options.refCode;
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('ref_code', options.refCode)
      .single();
    if (referrer) row.referrer_user_id = referrer.id;
  }
  supabase.from('story_reads').insert(row).then(() => {});
};

export const recordConversion = async (sessionId: string): Promise<void> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: read } = await supabase
    .from('story_reads')
    .select('id, story_id, referrer_user_id')
    .eq('session_id', sessionId)
    .not('ref_code', 'is', null)
    .gte('read_at', sevenDaysAgo)
    .order('read_at', { ascending: false })
    .limit(1)
    .single();
  if (!read) return;
  await supabase.from('story_reads').update({ converted_to_paid: true }).eq('id', read.id);
  if (read.referrer_user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('conversion_count, rewards_months_earned')
      .eq('id', read.referrer_user_id)
      .single();
    if (profile) {
      const newCount = (profile.conversion_count ?? 0) + 1;
      let newRewards = profile.rewards_months_earned ?? 0;
      if (newCount >= 25 && (profile.conversion_count ?? 0) < 25) newRewards += 6;
      else if (newCount >= 5 && (profile.conversion_count ?? 0) < 5) newRewards += 1;
      await supabase.from('profiles').update({
        conversion_count: newCount,
        rewards_months_earned: newRewards,
      }).eq('id', read.referrer_user_id);
    }
  }
};

// ── User profile ─────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_subscribed, ref_code, rewards_months_earned, conversion_count')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    displayName: data.display_name ?? '',
    isSubscribed: data.is_subscribed ?? false,
    refCode: data.ref_code ?? null,
    rewardsMonthsEarned: data.rewards_months_earned ?? 0,
    conversionCount: data.conversion_count ?? 0,
  };
};

export const generateRefCode = async (userId: string): Promise<string> => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const { error } = await supabase.from('profiles').update({ ref_code: code }).eq('id', userId);
    if (!error) return code;
  }
  throw new Error('Failed to generate unique ref code');
};

export const ensureRefCode = async (userId: string): Promise<string> => {
  const profile = await getUserProfile(userId);
  if (profile?.refCode) return profile.refCode;
  return generateRefCode(userId);
};

// ── Friends ──────────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  friendUserId: string;
  friendDisplayName: string;
  createdAt: string;
}

export interface SharedStory {
  id: string;
  fromUser: string;
  fromDisplayName: string;
  toUser: string;
  storyId: string;
  storyTitle: string;
  storyHeroName: string;
  message?: string;
  sharedAt: string;
  read: boolean;
  bookData?: any;
}

/** Add a friend by their ref_code. Returns the friend's display name. */
/** Add friend by code (tables not yet created — throws) */
export const addFriendByCode = async (_myUserId: string, _friendRefCode: string): Promise<{ friendName: string }> => {
  throw new Error('Friends feature is not yet available');
};

/** Get all friends for a user (tables not yet created — returns empty) */
export const getFriends = async (_userId: string): Promise<Friend[]> => {
  return [];
};

/** Share a story with a friend (tables not yet created — no-op) */
export const shareStoryWithFriend = async (
  _fromUserId: string, _toUserId: string, _storyId: string, _message?: string
): Promise<void> => {};

/** Get stories shared with me (tables not yet created — returns empty) */
export const getSharedStories = async (_userId: string): Promise<SharedStory[]> => {
  return [];
};

/** Mark a shared story as read (tables not yet created — no-op) */
export const markSharedStoryRead = async (_sharedId: string): Promise<void> => {};

/** Count unread shared stories (tables not yet created — returns 0) */
export const getUnreadSharedCount = async (_userId: string): Promise<number> => 0;

// ── Legacy stubs (kept so nothing breaks) ────────────────────────────────────
export const getCurrentUser  = () => null;
export const setCurrentUser  = (_u: any) => {};
export const getAllUsers      = () => [];
export const saveUser        = (_u: any) => {};
export const hashPassword    = (_pw: string) => '';
export const createGuestUser = () => ({ id: 'guest_' + Math.random().toString(36).slice(2), email: '', passwordHash: '', displayName: 'Guest', createdAt: new Date().toISOString(), isGuest: true });
