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

// ── Characters ────────────────────────────────────────────────────────────────

const dbToChar = (row: any): Character => ({
  id: row.id, userId: row.user_id, name: row.name, type: row.type,
  ageDescription: row.age_description ?? '', pronouns: row.pronouns ?? 'they/them',
  personalityTags: row.personality_tags ?? [], weirdDetail: row.weird_detail ?? '',
  currentSituation: row.current_situation ?? '', photo: row.photo_url,
  color: row.color ?? '#1E1640', emoji: row.emoji ?? '🌙',
  storyIds: row.story_ids ?? [], createdAt: row.created_at, updatedAt: row.updated_at,
});

export const getCharacters = async (userId: string): Promise<Character[]> => {
  const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) { console.error('getCharacters:', error); return []; }
  return (data ?? []).map(dbToChar);
};

export const saveCharacter = async (c: Character): Promise<void> => {
  let photoUrl = c.photo ?? null;
  if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(c.userId, photoUrl, `char_${c.id}`);
  const { error } = await supabase.from('characters').upsert({
    id: c.id, user_id: c.userId, name: c.name, type: c.type,
    age_description: c.ageDescription, pronouns: c.pronouns,
    personality_tags: c.personalityTags, weird_detail: c.weirdDetail,
    current_situation: c.currentSituation, photo_url: photoUrl,
    color: c.color, emoji: c.emoji, story_ids: c.storyIds,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('saveCharacter:', error);
};

export const deleteCharacter = async (userId: string, charId: string): Promise<void> => {
  const { error } = await supabase.from('characters').delete().eq('id', charId).eq('user_id', userId);
  if (error) console.error('deleteCharacter:', error);
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
  const { data, error } = await supabase.from('stories').select('*').eq('user_id', userId).order('date', { ascending: false });
  if (error) { console.error('getStories:', error); return []; }
  return (data ?? []).map(dbToStory);
};

export const saveStory = async (s: SavedStory): Promise<void> => {
  const { error } = await supabase.from('stories').upsert({
    id: s.id, user_id: s.userId, title: s.title, hero_name: s.heroName,
    character_ids: s.characterIds ?? [], refrain: s.refrain ?? null,
    date: s.date, occasion: s.occasion ?? null, book_data: s.bookData,
  });
  if (error) console.error('saveStory:', error);
};

export const deleteStory = async (userId: string, storyId: string): Promise<void> => {
  const { error } = await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId);
  if (error) console.error('deleteStory:', error);
};

// ── Night Cards ───────────────────────────────────────────────────────────────

const dbToCard = (row: any): SavedNightCard => ({
  id: row.id, userId: row.user_id, heroName: row.hero_name, storyId: row.story_id,
  storyTitle: row.story_title, characterIds: row.character_ids ?? [],
  headline: row.headline, quote: row.quote, memory_line: row.memory_line,
  bondingQuestion: row.bonding_question, bondingAnswer: row.bonding_answer,
  gratitude: row.gratitude, extra: row.extra, photo: row.photo_url,
  emoji: row.emoji, date: row.date,
});

export const getNightCards = async (userId: string): Promise<SavedNightCard[]> => {
  const { data, error } = await supabase.from('night_cards').select('*').eq('user_id', userId).order('date', { ascending: false });
  if (error) { console.error('getNightCards:', error); return []; }
  return (data ?? []).map(dbToCard);
};

export const saveNightCard = async (nc: SavedNightCard): Promise<void> => {
  let photoUrl = nc.photo ?? null;
  if (photoUrl && photoUrl.startsWith('data:')) photoUrl = await uploadPhoto(nc.userId, photoUrl, `nc_${nc.id}`);
  const { error } = await supabase.from('night_cards').upsert({
    id: nc.id, user_id: nc.userId, hero_name: nc.heroName, story_id: nc.storyId ?? null,
    story_title: nc.storyTitle, character_ids: nc.characterIds ?? [],
    headline: nc.headline, quote: nc.quote, memory_line: nc.memory_line ?? null,
    bonding_question: nc.bondingQuestion ?? null, bonding_answer: nc.bondingAnswer ?? null,
    gratitude: nc.gratitude ?? null, extra: nc.extra ?? null,
    photo_url: photoUrl, emoji: nc.emoji ?? null, date: nc.date,
  });
  if (error) console.error('saveNightCard:', error);
};

export const deleteNightCard = async (userId: string, cardId: string): Promise<void> => {
  const { error } = await supabase.from('night_cards').delete().eq('id', cardId).eq('user_id', userId);
  if (error) console.error('deleteNightCard:', error);
};

// ── Legacy stubs (kept so nothing breaks) ────────────────────────────────────
export const getCurrentUser  = () => null;
export const setCurrentUser  = (_u: any) => {};
export const getAllUsers      = () => [];
export const saveUser        = (_u: any) => {};
export const hashPassword    = (_pw: string) => '';
export const createGuestUser = () => ({ id: 'guest_' + Math.random().toString(36).slice(2), email: '', passwordHash: '', displayName: 'Guest', createdAt: new Date().toISOString(), isGuest: true });
