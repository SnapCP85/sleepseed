import type { User, Character, SavedStory, SavedNightCard } from './types';

const PFX = 'ss2_';
const get = <T>(k: string): T | null => { try { const v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : null; } catch { return null; } };
const set = (k: string, v: any) => { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch {} };
const del = (k: string) => { try { localStorage.removeItem(PFX + k); } catch {} };

// ── Auth ──────────────────────────────────────────────────────────────────────
export const getCurrentUser = (): User | null => get<User>('current_user');
export const setCurrentUser = (u: User | null) => u ? set('current_user', u) : del('current_user');

export const getAllUsers = (): User[] => get<User[]>('users') || [];
export const saveUser = (u: User) => {
  const users = getAllUsers().filter(x => x.id !== u.id);
  set('users', [...users, u]);
};

// Simple hash — good enough for localStorage demo
export const hashPassword = (pw: string): string => {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h) + pw.charCodeAt(i); h |= 0; }
  return 'h' + Math.abs(h).toString(36);
};

export const createGuestUser = (): User => ({
  id: 'guest_' + Math.random().toString(36).slice(2),
  email: '',
  passwordHash: '',
  displayName: 'Guest',
  createdAt: new Date().toISOString(),
  isGuest: true,
});

// ── Characters ────────────────────────────────────────────────────────────────
export const getCharacters = (userId: string): Character[] =>
  (get<Character[]>('chars_' + userId) || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const saveCharacter = (c: Character) => {
  const chars = getCharacters(c.userId).filter(x => x.id !== c.id);
  set('chars_' + c.userId, [...chars, { ...c, updatedAt: new Date().toISOString() }]);
};

export const deleteCharacter = (userId: string, charId: string) => {
  set('chars_' + userId, getCharacters(userId).filter(c => c.id !== charId));
};

// ── Stories ───────────────────────────────────────────────────────────────────
export const getStories = (userId: string): SavedStory[] =>
  (get<SavedStory[]>('stories_' + userId) || []).sort((a, b) => b.date.localeCompare(a.date));

export const saveStory = (s: SavedStory) => {
  const stories = getStories(s.userId).filter(x => x.id !== s.id);
  set('stories_' + s.userId, [s, ...stories]);
};

export const deleteStory = (userId: string, storyId: string) => {
  set('stories_' + userId, getStories(userId).filter(s => s.id !== storyId));
};

// ── Night Cards ───────────────────────────────────────────────────────────────
export const getNightCards = (userId: string): SavedNightCard[] =>
  (get<SavedNightCard[]>('nightcards_' + userId) || []).sort((a, b) => b.date.localeCompare(a.date));

export const saveNightCard = (nc: SavedNightCard) => {
  const cards = getNightCards(nc.userId).filter(x => x.id !== nc.id);
  set('nightcards_' + nc.userId, [nc, ...cards]);
};

export const deleteNightCard = (userId: string, cardId: string) => {
  set('nightcards_' + userId, getNightCards(userId).filter(nc => nc.id !== cardId));
};

// ── Tag character to a story ──────────────────────────────────────────────────
export const tagCharacterInStory = (userId: string, characterId: string, storyId: string) => {
  const chars = getCharacters(userId);
  const char = chars.find(c => c.id === characterId);
  if (!char) return;
  if (!char.storyIds.includes(storyId)) {
    saveCharacter({ ...char, storyIds: [...char.storyIds, storyId] });
  }
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
