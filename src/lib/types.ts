// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  isGuest?: boolean;
  isSubscribed?: boolean;
  refCode?: string;
}

// ── Character ─────────────────────────────────────────────────────────────────
export type CharacterType = 'human' | 'animal' | 'creature' | 'stuffy' | 'other' | 'parent';
export type ParentRole = 'mom' | 'dad' | 'grandma' | 'grandpa';
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
  ageDescription: string;
  pronouns: Pronoun;
  personalityTags: PersonalityTag[];
  weirdDetail: string;
  currentSituation: string;
  photo?: string;
  color: string;
  emoji: string;
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
  isFamily?: boolean;      // true = parent's child, appears in ritual dashboard
  parentRole?: ParentRole; // only set when type === 'parent'
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
  ageGroup?: string;
  vibe?: string;
  theme?: string;
  mood?: string;
  storyStyle?: string;
  storyLength?: string;
  lessons?: string[];
  isPublic?: boolean;
  librarySlug?: string;
  thumbsUp?: number;
  thumbsDown?: number;
  readCount?: number;
  isStaffPick?: boolean;
}

// ── Library story (public, returned from library queries) ────────────────
export interface LibraryStory {
  id: string;
  userId: string;
  title: string;
  heroName: string;
  characterIds: string[];
  refrain?: string;
  date: string;
  occasion?: string;
  bookData?: any;        // only populated for single story fetch
  isPublic: boolean;
  librarySlug: string;
  ageGroup?: string;
  vibe?: string;
  theme?: string;
  mood?: string;
  storyStyle?: string;
  storyLength?: string;
  lessons?: string[];
  submittedAt?: string;
  thumbsUp: number;
  thumbsDown: number;
  readCount: number;
  conversionCount: number;
  isStaffPick: boolean;
  isBookOfDay: boolean;
  bookOfDayDate?: string;
  submitterDisplayName?: string;
  submitterRefCode?: string;
}

// ── Story vote ───────────────────────────────────────────────────────────
export interface StoryVote {
  id: string;
  storyId: string;
  userId?: string;
  sessionId?: string;
  vote: 1 | -1;
  voteNote?: string;
  createdAt: string;
}

// ── Library favourite ────────────────────────────────────────────────────
export interface LibraryFavourite {
  id: string;
  userId: string;
  storyId: string;
  savedAt: string;
}

// ── User profile (from profiles table) ───────────────────────────────────
export interface UserProfile {
  id: string;
  displayName: string;
  isSubscribed: boolean;
  refCode: string | null;
  rewardsMonthsEarned: number;
  conversionCount: number;
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
  isOrigin?: boolean;   // the Night 0 / "where it began" card
  whisper?: string;     // the closing whisper line
}

// ── Hatchery ─────────────────────────────────────────────────────────────────
export type CreatureRarity = 'common' | 'rare' | 'legendary';

export interface HatchedCreature {
  id: string;
  userId: string;
  characterId: string;
  name: string;
  creatureType: string;    // matches CREATURES[id].id
  creatureEmoji: string;
  color: string;
  rarity: CreatureRarity;
  personalityTraits: string[];
  dreamAnswer: string;     // the night card dream question answer
  parentSecret: string;    // the weirdDetail / parent's secret
  hatchedAt: string;
  photoUrl?: string;       // the family photo from onboarding
  weekNumber: number;
}

export interface HatcheryEgg {
  id: string;
  userId: string;
  characterId: string;
  creatureType: string;
  creatureEmoji: string;
  weekNumber: number;
  startedAt: string;
  createdAt: string;
}

// ── Builder choices (passed from StoryBuilderPage → SleepSeedCore) ───────────
export interface BuilderChoices {
  path: 'ritual' | 'free';
  heroName: string;    // child's name
  heroGender?: string; // 'boy' | 'girl' | ''
  vibe: string;        // 'warm-funny' | 'calm-cosy' | 'exciting' | 'heartfelt' | 'silly' | 'mysterious'
  level: string;       // 'age3' | 'age5' | 'age7' | 'age10'
  length: string;      // 'short' | 'standard' | 'long'
  brief: string;       // free text (free path story description)
  chars: Array<{ type: string; name: string; note: string }>;
  lessons: string[];   // full lesson value strings (long AI-prompt versions)
  occasion: string;
  occasionCustom: string;
  style: string;       // 'standard' | 'rhyming' | 'adventure' | 'mystery'
  pace: string;        // 'normal' | 'sleepy' | 'snappy'
}

// ── App view state ────────────────────────────────────────────────────────────
export type AppView =
  | 'public'              // public homepage
  | 'auth'                // sign in / sign up
  | 'onboarding-welcome'  // full-screen welcome (first visit only)
  | 'onboarding-tour'     // four-beat feature tour
  | 'onboarding-night0'   // Night 0 card creation
  | 'dashboard'           // ritual dashboard (home)
  | 'ritual-starter'      // tonight's story capture screen
  | 'story-wizard'        // unified story creation wizard (ritual + free)
  | 'story-builder'       // SleepSeedCore (generates + reads story)
  | 'user-profile'        // profile: characters + story library + night cards
  | 'characters'          // character library
  | 'character-builder'   // create/edit a character
  | 'story-library'       // my stories
  | 'nightcard-library'  // my night cards
  | 'parent-setup'       // parent onboarding (3 screens, adult)
  | 'onboarding'         // kid onboarding flow (magical)
  | 'first-night'        // post-onboarding choice screen
  | 'hatchery'           // hatchery screen
  | 'library'            // public story library
  | 'library-story'      // single library story reader
  | 'dev-story';         // DEV: story engine test bench
