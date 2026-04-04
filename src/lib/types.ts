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
  birthDate?: string;      // ISO date string (YYYY-MM-DD) for age calculation on Night Cards
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
  coverUrl?: string;            // cover image URL from library-covers bucket
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
  coverUrl?: string;     // cover image URL for uploaded books
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

// ── Story role metadata (for personalization / remix) ────────────────────
export type StoryRoleType = 'protagonist' | 'companion' | 'friend' | 'parent' | 'pet' | 'creature' | 'worldSpirit';

export interface StoryRole {
  role: StoryRoleType;
  originalName: string;
  displayName: string;
  type: string;               // from allChars: "hero", "creature", etc.
  pronouns?: string;          // "she/her", "he/him", "they/them"
  description?: string;
  isSubstitutable: boolean;   // true for protagonist + companion
}

// ── Remix request ────────────────────────────────────────────────────────
export interface RemixRequest {
  storyId: string;
  childName: string;
  childAge?: string;
  childDetail?: string;
  childInterest?: string;
  childFear?: string;
  extraChars?: { type: string; name: string }[];
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
  isOrigin?: boolean;       // the Night 0 / "where it began" card
  whisper?: string;         // the closing whisper line
  occasion?: string;        // birthday, christmas, halloween, etc.
  streakCount?: number;     // current streak at time of creation
  nightNumber?: number;     // DreamKeeper night (1–7)
  creatureEmoji?: string;   // creature emoji for card display
  creatureColor?: string;   // creature color for card display
  lessonTheme?: string;     // e.g. "Courage", "Kindness" — from DreamKeeper arc
  // ── Phase 1 enrichment fields ──
  childMood?: string;       // emoji mood at bedtime (😊😴🤗😌🥰😆)
  childAge?: string;        // age at time of card creation (e.g. "4 years, 3 months")
  parentReflection?: string; // morning-after thought added by parent
  tags?: string[];          // auto-generated emotional themes
  bedtimeActual?: string;   // time the story was read (HH:MM)
  milestone?: number;       // milestone number (10, 25, 50, 100, etc.) — set when this card IS the milestone
  audioClip?: string;       // URL to voice recording (Supabase storage)
  childDrawing?: string;    // data URL of child's drawing/scribble
}

// ── Night Card variant system ────────────────────────────────────────────────
export type CardVariant = 'standard' | 'origin' | 'journey' | 'occasion' | 'streak' | 'milestone';

// Milestone thresholds for total Night Card count
export const MILESTONE_THRESHOLDS = [10, 25, 50, 100, 200, 365] as const;

export function getCardVariant(card: SavedNightCard): CardVariant {
  if (card.isOrigin === true) return 'origin';
  if (card.nightNumber === 7 || (card.nightNumber && card.nightNumber % 7 === 0)) return 'journey';
  if (card.occasion && card.occasion !== '') return 'occasion';
  if (card.streakCount === 7 || card.streakCount === 14 ||
      card.streakCount === 30 || card.streakCount === 100) return 'streak';
  if (card.milestone) return 'milestone';
  return 'standard';
}

export const CARD_VARIANT_STYLES: Record<CardVariant, {
  skyGradient: string; glowColor: string; paperColor: string;
  borderColor: string; headlineColor: string;
  shadow: string;
}> & Record<string, any> = {
  standard: {
    skyGradient: 'linear-gradient(to bottom, #0d1428, #1a1040)',
    glowColor: '#9A7FD4', paperColor: '#faf6ee',
    borderColor: 'rgba(154,127,212,0.2)', headlineColor: '#1a0f08',
    shadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(154,127,212,0.15)',
  },
  origin: {
    skyGradient: 'linear-gradient(to bottom, #150e05, #2a1808)',
    glowColor: '#F5B84C', paperColor: '#fdf8ee',
    borderColor: 'rgba(245,184,76,0.35)', headlineColor: '#1a0e04',
    shadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(245,184,76,0.2)',
  },
  journey: {
    skyGradient: 'linear-gradient(to bottom, #051510, #0a2a1a)',
    glowColor: '#14d890', paperColor: '#f0faf5',
    borderColor: 'rgba(20,216,144,0.3)', headlineColor: '#071a10',
    shadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(20,216,144,0.18)',
  },
  occasion: {
    skyGradient: 'linear-gradient(to bottom, #1a0520, #2a0a3a)',
    glowColor: '#9482ff', paperColor: '#faf6ff',
    borderColor: 'rgba(148,130,255,0.3)', headlineColor: '#100820',
    shadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(148,130,255,0.18)',
  },
  streak: {
    skyGradient: 'linear-gradient(to bottom, #180808, #2a1005)',
    glowColor: '#F5B84C', paperColor: '#fef8f0',
    borderColor: 'rgba(245,130,20,0.4)', headlineColor: '#1a0f08',
    shadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(245,130,20,0.22)',
  },
  milestone: {
    skyGradient: 'linear-gradient(to bottom, #0a0520, #1a0840)',
    glowColor: '#E0A0FF', paperColor: '#faf6ff',
    borderColor: 'rgba(200,140,255,0.35)', headlineColor: '#150830',
    shadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 50px rgba(200,140,255,0.25)',
  },
};

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

// ── Time Capsule ─────────────────────────────────────────────────────────────
export interface TimeCapsule {
  id: string;
  userId: string;
  childName: string;
  cardIds: string[];          // IDs of sealed Night Cards
  sealedAt: string;           // ISO date
  openDate: string;           // ISO date — when capsule can be opened
  title: string;              // e.g. "Sofia's First Year"
  opened?: boolean;           // true after parent opens it
  openedAt?: string;          // ISO date when opened
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
  childIsHero?: boolean; // false = story follows the user's prompt directive, child not forced as protagonist
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
  | 'onboarding-ritual'  // 3-night DreamKeeper hatching ritual
  | 'hatchery'           // hatchery screen
  | 'library'            // public story library
  | 'library-story'      // single library story reader
  | 'dev-story'          // DEV: story engine test bench
  | 'journey-setup'
  | 'nightly-checkin'
  | 'chapter-handoff'
  | 'book-complete'
  | 'memory-reel'
  | 'series-creator'
  | 'journey-library'
  | 'series-library'
  | 'book-library'
  | 'completed-book-reader'
  // ── Onboarding v9 ──
  | 'parent-onboarding'    // new cinematic parent flow (P1-P6)
  | 'night-1'              // Night 1 dashboard + story + card
  | 'night-2'              // Night 2 dashboard + story + card
  | 'night-3'              // Night 3 dashboard + story + hatch
  | 'hatch-ceremony'       // Night 3 canvas hatch cinematic
  | 'cinematic-transition' // Elder → egg → Night 1 bridge
  | 'story-cover'          // shared story landing page (before reader)
  | 'my-space';            // personal hub — creature, memories, stories

// ══════════════════════════════════════════════════════════════════════════════
// SLEEPSEED v3 — STORYJOURNEY SYSTEM TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type EmotionalGoal =
  | 'calm'
  | 'confidence'
  | 'comfort'
  | 'courage'
  | 'fun'
  | 'connection'
  | 'wonder'

export type StoryJourneyStatus = 'active' | 'completed' | 'archived'

export interface NightArcEntry {
  readNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7
  purpose: string
  chapterGoal: string
}

export interface StoryBible {
  coreWorld: string
  corePremise: string
  emotionalGoal: string
  weeklyProblem: string
  endingTarget: string
  primaryGenre: string
  toneProfile: string[]
  genreBlend: string[]
  plantedDetails: string[]
  recurringImages: string[]
  allowedCharacters: string[]
  seriesEligible: boolean
  nightArc: NightArcEntry[]
  doNotDo: string[]
}

export interface JourneyMemoryBank {
  favoriteObjects: string[]
  recurringPlaces: string[]
  recurringPhrases: string[]
  emotionalMilestones: string[]
  relationshipMoments: string[]
  sensoryImages: string[]
}

export interface StoryJourneyChapter {
  id?: string
  readNumber: number
  chapterTitle: string
  recapText: string
  teaser: string
  summary: string
  storyId?: string
  moodInput?: string
  todayInput?: string
  specificDetailUsed?: string
  charactersUsed: string[]
  memoryCandidates: string[]
  unresolvedThreadsAfter: string[]
  resolvedThreadsInChapter: string[]
  callbacksUsed: string[]
  newPlantedDetails: string[]
  fullChapterJson?: Record<string, unknown>
  createdAt: string
}

export interface StoryJourney {
  id: string
  userId: string
  characterId: string
  creatureId: string
  status: StoryJourneyStatus
  readNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7
  totalReads: 7
  workingTitle: string
  finalTitle?: string
  seriesId?: string | null
  storyBible: StoryBible
  chapters: StoryJourneyChapter[]
  memoryBank: JourneyMemoryBank
  unresolvedThreads: string[]
  resolvedThreads: string[]
  finalBookId?: string | null
  spawnedEggId?: string | null
  hatchedCreatureId?: string | null
  startedFrom: 'ritual' | 'create' | 'series'
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

export interface StorySeries {
  id: string
  userId: string
  characterId: string
  title: string
  coreWorld: string
  recurringCharacters: string[]
  recurringObjects: string[]
  recurringThemes: string[]
  toneProfile: string[]
  bookIds: string[]
  createdAt: string
  updatedAt: string
}

export interface JourneyHighlight {
  readNumber: number
  chapterTitle: string
  highlight: string
}

export interface JourneySummary {
  id: string
  storyJourneyId: string
  userId: string
  characterId: string
  summaryTitle: string
  emotionalArc: string
  highlights: JourneyHighlight[]
  nightCardReel: string[]
  unlockedCharacterId?: string
  payload: Record<string, unknown>
  createdAt: string
}

export interface NightlyCheckInInput {
  need: EmotionalGoal
  todayMemory?: string
  specificDetail?: string
  occasion?: string
  cast?: string[]
  feel?: string
  length?: 'short' | 'standard' | 'long'
}

export interface StoryBibleInput {
  emotionalGoal: EmotionalGoal
  primaryGenre: string
  bookType: string[]
  world: string
  recentEvent?: string
  specificDetail?: string
  importantThing?: string
  cast?: string[]
  seriesMode?: 'fresh' | 'continue_world' | 'continue_series'
  seriesId?: string
  revisionNotes?: string
}

export interface ChapterCoverPage {
  text: string
  illustrationPrompt: string
}

export interface ChapterOpenerCastMember {
  name: string
  roleLine: string
}

export interface ChapterOpenerPage {
  title: string
  cast: ChapterOpenerCastMember[]
  teaser: string
  illustrationPrompt: string
}

export interface ChapterStoryPage {
  text: string
  illustrationPrompt: string
}

export interface ChapterOutput {
  bookTitle: string
  chapterTitle: string
  readNumber: number
  totalReads: 7
  coverPage: ChapterCoverPage
  recapPage?: ChapterCoverPage
  chapterOpenerPage: ChapterOpenerPage
  storyPages: ChapterStoryPage[]
  refrain: string
  metadata: {
    chapterSummary: string
    memoryBeats: string[]
    unresolvedThreads: string[]
    resolvedThreads: string[]
    charactersUsed: string[]
    callbacksUsed: string[]
    newPlantedDetails: string[]
  }
}
