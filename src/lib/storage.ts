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
    try { await supabase.from('profiles').upsert({ id: data.user.id, display_name: displayName }); } catch(_) {}
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

export const updateUserProfile = async (userId: string, data: { display_name?: string }) => {
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...data });
  if (error) console.error('updateUserProfile:', error);
  // Also update Supabase auth metadata
  if (data.display_name) {
    await supabase.auth.updateUser({ data: { display_name: data.display_name } });
  }
};

export const updateUserEmail = async (newEmail: string) => {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
};

export const updateUserPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const deleteUserAccount = async () => {
  // Sign out — actual account deletion requires server-side admin
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

// ── Characters (localStorage primary, Supabase sync) ─────────────────────────

const LS_CHARS = (uid: string) => `ss2_chars_${uid}`;

const lsGetChars = (userId: string): Character[] => {
  try { return JSON.parse(localStorage.getItem(LS_CHARS(userId)) || '[]'); } catch { return []; }
};
const lsSetChars = (userId: string, chars: Character[]) => {
  try { localStorage.setItem(LS_CHARS(userId), JSON.stringify(chars)); } catch {}
};

const dbToChar = (row: any): Character => ({
  id: row.id, userId: row.user_id, name: row.name, type: row.type,
  ageDescription: row.age_description ?? '', pronouns: row.pronouns ?? 'they/them',
  personalityTags: row.personality_tags ?? [], weirdDetail: row.weird_detail ?? '',
  currentSituation: row.current_situation ?? '', photo: row.photo_url,
  color: row.color ?? '#1E1640', emoji: row.emoji ?? '🌙',
  storyIds: row.story_ids ?? [], createdAt: row.created_at, updatedAt: row.updated_at,
});

export const getCharacters = async (userId: string): Promise<Character[]> => {
  const local = lsGetChars(userId);
  try {
    const { data } = await supabase.from('characters').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (data?.length) {
      const dbChars = data.map(dbToChar);
      const localIds = new Set(local.map(c => c.id));
      const merged = [...local, ...dbChars.filter(c => !localIds.has(c.id))];
      if (merged.length > local.length) lsSetChars(userId, merged);
      return merged;
    }
  } catch {}
  return local;
};

export const saveCharacter = async (c: Character): Promise<void> => {
  // Always save to localStorage first
  const existing = lsGetChars(c.userId);
  const filtered = existing.filter(x => x.id !== c.id);
  lsSetChars(c.userId, [{ ...c, updatedAt: new Date().toISOString() }, ...filtered]);
  // Best-effort Supabase sync
  try {
    let photoUrl = c.photo ?? null;
    if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(c.userId, photoUrl, `char_${c.id}`);
    await supabase.from('characters').upsert({
      id: c.id, user_id: c.userId, name: c.name, type: c.type,
      age_description: c.ageDescription, pronouns: c.pronouns,
      personality_tags: c.personalityTags, weird_detail: c.weirdDetail,
      current_situation: c.currentSituation, photo_url: photoUrl,
      color: c.color, emoji: c.emoji, story_ids: c.storyIds,
      updated_at: new Date().toISOString(),
    });
  } catch {}
};

export const deleteCharacter = async (userId: string, charId: string): Promise<void> => {
  lsSetChars(userId, lsGetChars(userId).filter(c => c.id !== charId));
  try { await supabase.from('characters').delete().eq('id', charId).eq('user_id', userId); } catch {}
};

export const tagCharacterInStory = async (userId: string, characterId: string, storyId: string): Promise<void> => {
  const chars = await getCharacters(userId);
  const char = chars.find(c => c.id === characterId);
  if (!char || char.storyIds.includes(storyId)) return;
  await saveCharacter({ ...char, storyIds: [...char.storyIds, storyId] });
};

// ── Stories (localStorage primary, Supabase sync) ────────────────────────────

const LS_STORIES = (uid: string) => `ss2_stories_${uid}`;

const lsGetStories = (userId: string): SavedStory[] => {
  try { return JSON.parse(localStorage.getItem(LS_STORIES(userId)) || '[]'); } catch { return []; }
};
const lsSetStories = (userId: string, stories: SavedStory[]) => {
  try { localStorage.setItem(LS_STORIES(userId), JSON.stringify(stories)); } catch {}
};

export const getStories = async (userId: string): Promise<SavedStory[]> => {
  // Always return from localStorage (reliable)
  const local = lsGetStories(userId);
  // Best-effort: try Supabase too and merge any missing
  try {
    const { data } = await supabase.from('stories').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (data?.length) {
      const dbStories = data.map((row: any): SavedStory => ({
        id: row.id, userId: row.user_id, title: row.title, heroName: row.hero_name,
        characterIds: row.character_ids ?? [], refrain: row.refrain, date: row.date,
        occasion: row.occasion, bookData: row.book_data,
      }));
      // Merge: add any from DB not in local
      const localIds = new Set(local.map(s => s.id));
      const merged = [...local, ...dbStories.filter(s => !localIds.has(s.id))];
      if (merged.length > local.length) lsSetStories(userId, merged);
      return merged.sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch {}
  return local.sort((a, b) => b.date.localeCompare(a.date));
};

export const saveStory = async (s: SavedStory): Promise<void> => {
  // Always save to localStorage first
  const existing = lsGetStories(s.userId);
  const filtered = existing.filter(x => x.id !== s.id);
  lsSetStories(s.userId, [s, ...filtered]);
  // Best-effort Supabase sync
  try {
    await supabase.from('stories').upsert({
      id: s.id, user_id: s.userId, title: s.title, hero_name: s.heroName,
      character_ids: s.characterIds ?? [], refrain: s.refrain ?? null,
      date: s.date, occasion: s.occasion ?? null, book_data: s.bookData,
    });
  } catch {}
};

export const deleteStory = async (userId: string, storyId: string): Promise<void> => {
  lsSetStories(userId, lsGetStories(userId).filter(s => s.id !== storyId));
  try { await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId); } catch {}
};

// ── Night Cards (localStorage primary, Supabase sync) ────────────────────────

const LS_CARDS = (uid: string) => `ss2_nightcards_${uid}`;

const lsGetCards = (userId: string): SavedNightCard[] => {
  try { return JSON.parse(localStorage.getItem(LS_CARDS(userId)) || '[]'); } catch { return []; }
};
const lsSetCards = (userId: string, cards: SavedNightCard[]) => {
  try { localStorage.setItem(LS_CARDS(userId), JSON.stringify(cards)); } catch {}
};

const dbToCard = (row: any): SavedNightCard => ({
  id: row.id, userId: row.user_id, heroName: row.hero_name, storyId: row.story_id,
  storyTitle: row.story_title, characterIds: row.character_ids ?? [],
  headline: row.headline, quote: row.quote, memory_line: row.memory_line,
  bondingQuestion: row.bonding_question, bondingAnswer: row.bonding_answer,
  gratitude: row.gratitude, extra: row.extra, photo: row.photo_url,
  emoji: row.emoji, date: row.date,
});

export const getNightCards = async (userId: string): Promise<SavedNightCard[]> => {
  const local = lsGetCards(userId);
  try {
    const { data } = await supabase.from('night_cards').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (data?.length) {
      const dbCards = data.map(dbToCard);
      const localIds = new Set(local.map(c => c.id));
      const merged = [...local, ...dbCards.filter(c => !localIds.has(c.id))];
      if (merged.length > local.length) lsSetCards(userId, merged);
      return merged.sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch {}
  return local.sort((a, b) => b.date.localeCompare(a.date));
};

export const saveNightCard = async (nc: SavedNightCard): Promise<void> => {
  // Always save to localStorage first
  const existing = lsGetCards(nc.userId);
  const filtered = existing.filter(x => x.id !== nc.id);
  lsSetCards(nc.userId, [nc, ...filtered]);
  // Best-effort Supabase sync
  try {
    let photoUrl = nc.photo ?? null;
    if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(nc.userId, photoUrl, `nc_${nc.id}`);
    await supabase.from('night_cards').upsert({
      id: nc.id, user_id: nc.userId, hero_name: nc.heroName, story_id: nc.storyId ?? null,
      story_title: nc.storyTitle, character_ids: nc.characterIds ?? [],
      headline: nc.headline, quote: nc.quote, memory_line: nc.memory_line ?? null,
      bonding_question: nc.bondingQuestion ?? null, bonding_answer: nc.bondingAnswer ?? null,
      gratitude: nc.gratitude ?? null, extra: nc.extra ?? null,
      photo_url: photoUrl, emoji: nc.emoji ?? null, date: nc.date,
    });
  } catch {}
};

export const deleteNightCard = async (userId: string, cardId: string): Promise<void> => {
  lsSetCards(userId, lsGetCards(userId).filter(c => c.id !== cardId));
  try { await supabase.from('night_cards').delete().eq('id', cardId).eq('user_id', userId); } catch {}
};

// ── Legacy stubs (kept so nothing breaks) ────────────────────────────────────
export const getCurrentUser  = () => null;
export const setCurrentUser  = (_u: any) => {};
export const getAllUsers      = () => [];
export const saveUser        = (_u: any) => {};
export const hashPassword    = (_pw: string) => '';
export const createGuestUser = () => ({ id: 'guest_' + Math.random().toString(36).slice(2), email: '', passwordHash: '', displayName: 'Guest', createdAt: new Date().toISOString(), isGuest: true });
