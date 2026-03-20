// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  isGuest?: boolean;
}

// ── Character ─────────────────────────────────────────────────────────────────
export type CharacterType = 'human' | 'animal' | 'creature' | 'stuffy' | 'other';
export type Pronoun = 'she/her' | 'he/him' | 'they/them' | 'it/its' | 'other';

export type PersonalityTag =
  | 'brave' | 'shy' | 'curious' | 'silly' | 'kind' | 'stubborn'
  | 'creative' | 'loud' | 'gentle' | 'adventurous' | 'clever' | 'sensitive'
  | 'funny' | 'caring' | 'determined' | 'dreamy';

export interface Character {
  id: string;
  userId: string;
  name: string;
  type: CharacterType;
  ageDescription: string;       // "5 years old" | "a fluffy orange cat" | etc.
  pronouns: Pronoun;
  personalityTags: PersonalityTag[];
  weirdDetail: string;          // The one specific detail that makes them alive
  currentSituation: string;     // What's going on in their life right now (optional)
  photo?: string;               // base64 data URL (optional)
  color: string;                // fallback avatar colour
  emoji: string;                // fallback avatar emoji
  storyIds: string[];           // IDs of stories they appear in
  createdAt: string;
  updatedAt: string;
}

// ── Story (saved) ─────────────────────────────────────────────────────────────
export interface SavedStory {
  id: string;
  userId: string;
  title: string;
  heroName: string;
  characterIds: string[];       // characters used in this story
  refrain?: string;
  date: string;
  occasion?: string;
  bookData: any;                // full book object from the existing engine
}

// ── Night Card (saved) ────────────────────────────────────────────────────────
export interface SavedNightCard {
  id: string;
  userId: string;
  heroName: string;
  storyId?: string;
  storyTitle: string;
  characterIds: string[];
  headline: string;
  quote: string;
  memory_line?: string;
  bondingQuestion?: string;
  bondingAnswer?: string;
  gratitude?: string;
  extra?: string;
  photo?: string;
  emoji?: string;
  date: string;
}

// ── App view state ────────────────────────────────────────────────────────────
export type AppView =
  | 'public'        // public homepage
  | 'auth'          // sign in / sign up
  | 'dashboard'     // user homepage
  | 'story-builder' // create a story (existing SleepSeed core)
  | 'characters'    // character library
  | 'character-builder' // create/edit a character
  | 'story-library' // my stories
  | 'nightcard-library' // my night cards
  | 'profile-settings'; // profile & account settings
