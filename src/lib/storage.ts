// storage.ts — Supabase backend
// All data now lives in Postgres via Supabase.
// Function signatures match the old localStorage version exactly.

import { supabase } from './supabase';
import type { Character, SavedStory, SavedNightCard } from './types';

// ── Utility ───────────────────────────────────────────────────────────────────

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

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
    const res  = await fetch(base64);
    const blob = await res.blob();
    const path = `${userId}/${name}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) return base64;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
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
  } catch {}
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
      updated_at: new Date().toISOString(),
    });
  } catch {}
};

export const deleteCharacter = async (userId: string, charId: string): Promise<void> => {
  lsSet(LS_CHARS(userId), lsGet<Character>(LS_CHARS(userId)).filter(c => c.id !== charId));
  try { await supabase.from('characters').delete().eq('id', charId).eq('user_id', userId); } catch {}
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
});

export const getStories = async (userId: string): Promise<SavedStory[]> => {
  const local = lsGet<SavedStory>(LS_STORIES(userId));
  try {
    const { data, error } = await supabase.from('stories').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (!error && data?.length) {
      const db = data.map(dbToStory);
      const ids = new Set(local.map(s => s.id));
      const merged = [...local, ...db.filter(s => !ids.has(s.id))];
      if (merged.length > local.length) lsSet(LS_STORIES(userId), merged);
      return merged.sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch {}
  return local.sort((a, b) => b.date.localeCompare(a.date));
};

export const saveStory = async (s: SavedStory): Promise<void> => {
  const existing = lsGet<SavedStory>(LS_STORIES(s.userId)).filter(x => x.id !== s.id);
  lsSet(LS_STORIES(s.userId), [s, ...existing]);
  try {
    await supabase.from('stories').upsert({
      id: s.id, user_id: s.userId, title: s.title, hero_name: s.heroName,
      character_ids: s.characterIds ?? [], refrain: s.refrain ?? null,
      date: s.date, occasion: s.occasion ?? null, book_data: s.bookData,
    });
  } catch {}
};

export const deleteStory = async (userId: string, storyId: string): Promise<void> => {
  lsSet(LS_STORIES(userId), lsGet<SavedStory>(LS_STORIES(userId)).filter(s => s.id !== storyId));
  try { await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId); } catch {}
};

// ── Night Cards ───────────────────────────────────────────────────────────────

const dbToCard = (row: any): SavedNightCard => {
  let extra = row.extra ?? undefined;
  let isOrigin: boolean | undefined;
  let whisper: string | undefined;
  if (extra && extra.startsWith('{')) {
    try {
      const p = JSON.parse(extra);
      if (p.isOrigin) isOrigin = true;
      if (p.whisper)  whisper  = p.whisper;
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
  };
};

export const getNightCards = async (userId: string): Promise<SavedNightCard[]> => {
  const local = lsGet<SavedNightCard>(LS_CARDS(userId));
  try {
    const { data, error } = await supabase.from('night_cards').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (!error && data?.length) {
      const db = data.map(dbToCard);
      const ids = new Set(local.map(c => c.id));
      const merged = [...local, ...db.filter(c => !ids.has(c.id))];
      if (merged.length > local.length) lsSet(LS_CARDS(userId), merged);
      return merged.sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch {}
  return local.sort((a, b) => b.date.localeCompare(a.date));
};

export const saveNightCard = async (nc: SavedNightCard): Promise<void> => {
  // localStorage first
  const existing = lsGet<SavedNightCard>(LS_CARDS(nc.userId)).filter(x => x.id !== nc.id);
  lsSet(LS_CARDS(nc.userId), [nc, ...existing]);
  // Supabase sync
  try {
    let photoUrl = nc.photo ?? null;
    if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(nc.userId, photoUrl, `nc_${nc.id}`);
    let extraField = nc.extra ?? null;
    if (nc.isOrigin || nc.whisper) {
      try {
        const packed: any = {};
        if (nc.isOrigin) packed.isOrigin = true;
        if (nc.whisper)  packed.whisper  = nc.whisper;
        if (nc.extra)    packed.note     = nc.extra;
        extraField = JSON.stringify(packed);
      } catch(_) {}
    }
    const { error: ncErr } = await supabase.from('night_cards').upsert({
      id: nc.id, user_id: nc.userId, hero_name: nc.heroName, story_id: nc.storyId ?? null,
      story_title: nc.storyTitle, character_ids: nc.characterIds ?? [],
      headline: nc.headline, quote: nc.quote, memory_line: nc.memory_line ?? null,
      bonding_question: nc.bondingQuestion ?? null, bonding_answer: nc.bondingAnswer ?? null,
      gratitude: nc.gratitude ?? null, extra: extraField,
      photo_url: photoUrl, emoji: nc.emoji ?? null, date: nc.date,
    });
    if (ncErr) console.error('[storage] saveNightCard Supabase error:', ncErr);
    else console.log('[storage] Night Card saved to Supabase:', nc.id);
  } catch (e) { console.error('[storage] saveNightCard exception:', e); }
};

export const deleteNightCard = async (userId: string, cardId: string): Promise<void> => {
  lsSet(LS_CARDS(userId), lsGet<SavedNightCard>(LS_CARDS(userId)).filter(c => c.id !== cardId));
  try { await supabase.from('night_cards').delete().eq('id', cardId).eq('user_id', userId); } catch {}
};

// ── Legacy stubs (kept so nothing breaks) ────────────────────────────────────
export const getCurrentUser  = () => null;
export const setCurrentUser  = (_u: any) => {};
export const getAllUsers      = () => [];
export const saveUser        = (_u: any) => {};
export const hashPassword    = (_pw: string) => '';
export const createGuestUser = () => ({ id: 'guest_' + Math.random().toString(36).slice(2), email: '', passwordHash: '', displayName: 'Guest', createdAt: new Date().toISOString(), isGuest: true });
