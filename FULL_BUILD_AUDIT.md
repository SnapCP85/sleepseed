# SleepSeed Platform -- Full Build Audit

**Generated:** 2026-03-30
**Repo:** https://github.com/SnapCP85/sleepseed.git
**Live:** https://sleepseed.vercel.app
**Stack:** React 18 + Vite 5 + Supabase + Vercel Serverless + Anthropic Claude API + ElevenLabs TTS
**No router library** -- all navigation is state-driven via a single `view` variable in React Context.

---

## TABLE OF CONTENTS

1. [Tech Stack & Configuration](#1-tech-stack--configuration)
2. [Entry Point & Routing](#2-entry-point--routing)
3. [Global State (AppContext)](#3-global-state-appcontext)
4. [Complete View Map](#4-complete-view-map)
5. [User Flow](#5-user-flow)
6. [Page Components](#6-page-components)
7. [Shared Components](#7-shared-components)
8. [Feature Modules](#8-feature-modules)
9. [Core Files](#9-core-files)
10. [Library / Utilities](#10-library--utilities)
11. [API Routes](#11-api-routes)
12. [Supabase Schema](#12-supabase-schema)
13. [Design System](#13-design-system)
14. [Environment Variables](#14-environment-variables)
15. [Architecture Patterns](#15-architecture-patterns)

---

## 1. Tech Stack & Configuration

### package.json
- **Runtime deps:** `react` ^18.3.1, `react-dom` ^18.3.1, `@supabase/supabase-js` ^2.99.3, `jspdf` ^4.2.0
- **Dev deps:** `@vitejs/plugin-react`, `typescript` ^5.5.3, `vite` ^5.4.2, `@vercel/node` ^4.0.0, `@types/react`, `@types/react-dom`
- **Scripts:** `dev` (vite), `build` (vite build), `preview` (vite preview)

### vite.config.ts
- `@vitejs/plugin-react` + custom `apiProxy()` plugin
- **apiProxy():** Dev-only middleware that proxies `/api/claude` to `https://api.anthropic.com/v1/messages` and dynamically imports other `/api/*` serverless functions with mock req/res. Supports `[id]` dynamic segments.
- **define:** Injects `__NARRATOR_VOICE_ID__` from `VITE_NARRATOR_VOICE_ID`

### tsconfig.json
- Target: ES2020, module: ESNext, JSX: react-jsx, **strict: false**

### vercel.json
- **Rewrites:** `/stories/:slug` -> `/?library=:slug`, `/stories` -> `/?view=library`, `/sitemap.xml` -> `/api/sitemap`
- **Cron:** `/api/book-of-day` daily at 06:00 UTC
- **Headers:** `sw.js` and `manifest.json` no-cache

### index.html
- PWA meta tags, standalone capable, theme-color `#060b18`
- 11 Google Fonts: Fraunces, Nunito, DM Mono, Baloo 2, Playfair Display, Plus Jakarta Sans, Patrick Hand, Kalam, Cormorant Garamond, Lora, DM Sans
- Critical CSS keyframes inline (shimmer, floatY, fadeUp, dotPulse, cometPulse, celebrationPop, breathe, polaroidDevelop)
- SW cleanup script (unregisters all existing service workers)

### public/manifest.json
- PWA: standalone, portrait-primary, categories: education/kids/lifestyle
- Icons: `icon.svg`, `icon-maskable.svg`, `moon.svg`

### public/sw.js
- Cache: `sleepseed-v2`, network-first strategy
- Skips API, Anthropic, and ElevenLabs domains

---

## 2. Entry Point & Routing

### src/main.tsx
Minimal bootstrap: renders `<App />` inside `<StrictMode>` into `#root`. No router library.

### src/App.tsx
Structure: `App` renders `<AppProvider><AppInner /></AppProvider>`.

**Pre-render URL interceptions (bypass auth):**
| URL Parameter | Component | Auth Required |
|---|---|---|
| `?nc=...` | `<SharedNightCard />` | No |
| `?printCard=...` | `<PrintNightCard />` | No |
| `?view=dev-story` | `<DevStoryTest />` | No |
| `?view=admin-upload` | `<AdminUploadBook />` | Admin only |

**URL parameter effects on mount:**
| Parameter | Effect |
|---|---|
| `?s=...` | Renders `<SharedStoryViewer />` |
| `?library=SLUG` | Sets `libraryStorySlug`, view to `library-story` |
| `?view=library` | Sets view to `library` |
| `?ref=CODE` | Stores referral code in sessionStorage |
| `?friend=CODE` | Stores friend code, processed after auth |

**Bottom Navigation Bar (5 tabs):**
| Tab | Label | View | Icon |
|---|---|---|---|
| 1 | Today | `dashboard` | Moon (filled) |
| 2 | Create | `story-wizard` | Pen |
| 3 | Discover | `library` | Book |
| 4 | My Space | `story-library` | Star |
| 5 | Profile | `user-profile` | Person |

BottomNav shown on: dashboard, library, library-story, story-library, nightcard-library, user-profile, hatchery.
NOT shown on: public, auth, onboarding, parent-setup, first-night, story-builder, story-wizard, ritual-starter, character views, journey views.

**Local state in AppInner:**
- `preloadedBook` -- book data for SleepSeedCore
- `dashKey` -- key to force UserDashboard re-mount
- `wizardChoices` -- story creation choices from StoryCreator
- `lastOnboardingResult` -- result from onboarding (character, creature, story, night card)
- `parentSetupData` -- parent setup answers (persisted to localStorage)
- `nightCardFilter` -- character ID filter for NightCardLibrary
- `viewingCharacter` -- character for CharacterDetail
- `isSharedStory` -- true if `?s=...` in URL
- `testMode` / `testPhase` / `testChildProfile` -- onboarding test mode

---

## 3. Global State (AppContext)

`AppProvider` wraps the entire app. Consumed via `useApp()` hook.

### State Variables

| Variable | Type | Purpose |
|---|---|---|
| `user` | `User \| null` | Current authenticated user (Supabase) |
| `authLoading` | `boolean` | True while initial auth resolving |
| `view` | `AppView` | **The single routing variable** (30+ possible values) |
| `selectedCharacter` | `Character \| null` | Character chosen for story creation |
| `selectedCharacters` | `Character[]` | Multi-select characters for stories |
| `ritualSeed` | `string` | Text seed/prompt for bedtime ritual |
| `ritualMood` | `string` | Mood for ritual story |
| `editingCharacter` | `Character \| null` | Character being edited |
| `pendingSaveCharacter` | `Partial<Character> \| null` | Character pending save |
| `companionCreature` | `HatchedCreature \| null` | User's hatched creature companion |
| `libraryStorySlug` | `string \| null` | Public library story slug being read |
| `isSubscribed` | `boolean` | Active subscription status |
| `refCode` | `string \| null` | User's referral code |
| `activeJourneyId` | `string \| null` | Currently active StoryJourney ID |
| `activeChapterOutput` | `Record<string, unknown> \| null` | Chapter output data for SleepSeedCore |
| `activeCompletedBookId` | `string \| null` | Completed book being viewed |
| `activeSeriesId` | `string \| null` | Currently active series ID |

### Auth Flow
1. Fast path: reads Supabase session from localStorage directly
2. Full check: `supabase.auth.getSession()` to verify/refresh
3. Listener: `onAuthStateChange` handles sign-in/out/refresh
4. Authenticated non-anonymous: sets user, view to `dashboard` (unless URL overrides)
5. Anonymous/guest: sets user, only switches from `auth` to `dashboard`
6. No session: clears user, sets view to `public`

### Key Functions
- `login(u)` -- sets user + view to `dashboard` instantly
- `logout()` -- calls sbSignOut, clears state, sets view to `public`

---

## 4. Complete View Map

| View | Component | Triggered By | BottomNav |
|---|---|---|---|
| `public` | PublicHomepage | Default (no auth) | No |
| `auth` | Auth | Sign in/up buttons | No |
| `parent-setup` | ParentSetup | Dashboard prompt (no setup done) | No |
| `onboarding` | OnboardingFlow | After parent setup / new character | No |
| `first-night` | FirstNight | After onboarding complete | No |
| `dashboard` | UserDashboard | Auth success, many "back" actions | Today |
| `ritual-starter` | StoryCreator (ritual mode) | FirstNight onStory, StoryLibrary | No |
| `story-wizard` | StoryCreator (create mode) | BottomNav "Create" | Create |
| `story-builder` | SleepSeedCore (lazy) | After story wizard, saved story, journey | No |
| `user-profile` | UserProfile | BottomNav "Profile" | Profile |
| `characters` | CharacterLibrary | Various navigation | No |
| `character-builder` | CharacterBuilder | Edit character | No |
| `character-detail` | CharacterDetail | View character | No |
| `story-library` | StoryLibrary | BottomNav "My Space" | My Space |
| `nightcard-library` | NightCardLibrary | Night card navigation | My Space |
| `library` | LibraryHome | BottomNav "Discover" | Discover |
| `library-story` | LibraryStoryReader (lazy) | `?library=SLUG` | Discover |
| `hatchery` | Hatchery | Dashboard/profile navigation | No |
| `journey-setup` | JourneySetup | Start new book | No |
| `nightly-checkin` | NightlyCheckIn | Continue journey | No |
| `chapter-handoff` | ChapterHandoff | After chapter generated | No |
| `book-complete` | BookComplete | After 7th read | No |
| `memory-reel` | MemoryReel | Post-completion | No |
| `series-creator` | SeriesCreator | Post-completion continue | No |
| `journey-library` | JourneyLibrary | My books navigation | No |
| `completed-book-reader` | CompletedBookReader | Read completed book | No |

**Dead/unimplemented views in AppView type:** `series-library`, `book-library`
**Legacy views (redirect to dashboard):** `onboarding-welcome`, `onboarding-tour`, `onboarding-night0`

---

## 5. User Flow

1. **Landing (`public`)** -- PublicHomepage with marketing, demos, pricing
2. **Auth (`auth`)** -- Email/password sign up or sign in via Supabase. Guest access available.
3. **Dashboard (`dashboard`)** -- If `!parentSetupDone && !onboardingDone`, banner links to `parent-setup`
4. **Parent Setup (`parent-setup`)** -- Collects child name, age (3-10+), pronouns, parent role, optional secret
5. **Onboarding (`onboarding`)** -- Multi-step wizard: creature selection, personality questions, naming, day input, favourite thing, mood, first story generation + reader, Night Card creation
6. **First Night (`first-night`)** -- Post-first-story: "Create another story" or "Tuck into bed"
7. **Dashboard (post-onboarding)** -- Full access to all features via BottomNav

---

## 6. Page Components

### PublicHomepage.tsx
Marketing landing page. 5-section layout: hero with creature emojis + egg animation, problem/solution grid, "How it works" 3-step, cinematic 4-scene auto-cycling demo, founder quote + testimonials + trust badges, pricing cards (free/family), footer.
- **Props:** `onCreateStory, onSignIn, onSignUp, onNightCards, onLibrary`
- **State:** `stickyShow`, `scene` (0-3 auto-cycling)
- **Effects:** 50 star DOM elements, IntersectionObserver for scroll-reveal, hero observer for sticky CTA

### Auth.tsx
Sign up / sign in / password reset / email verification / guest access.
- **State:** `tab` (signup/signin), `screen` (form/verify/reset-sent), form fields, loading, error
- **API:** signUp, signIn, signInAsGuest, resetPassword (all Supabase auth)

### OnboardingFlow.tsx
Multi-step child onboarding wizard. Steps: welcome animation, 3x3 creature grid selection, 3 this-or-that personality questions, creature naming (pixel font constellation display), "tell your creature about today" textarea, favourite thing chips, mood emoji grid, loading, story reader with pages, Night Card creation with photo/selfie, shard celebration.
- **Props:** `onComplete(OnboardingResult), childProfile?`
- **OnboardingResult:** `{ character, creature, dreamAnswer, photoDataUrl, firstStory, nightCard }`
- **API:** Anthropic API direct call for Night Card, uploadPhoto, saveNightCard

### OnboardingWelcome.tsx
Night sky intro screen. 30 twinkling stars, animated crescent moon, "The 20 minutes before sleep are the most important of the day."
- **Navigates to:** `onboarding-tour` or `onboarding-night0`

### OnboardingTour.tsx
4-step product feature tour with static mockup UIs (ritual card, streak system, story builder, Night Card polaroids).
- **State:** `step` (0-3)

### OnboardingNightCard.tsx
"Night 0" card creation. 3 phases: create (mood selector, text, photo), generating (pulsing animation), reveal (confetti + polaroid card).
- **API:** Claude API direct (claude-sonnet-4-20250514), saveNightCard

### ParentSetup.tsx
6-moment wizard: live clock + emotional pitch, 3 auto-advancing beat animations, science quote, child setup form (name, age circles 3-10+, pronoun pills, parent role), parent's secret textarea, handoff screen.
- **Props:** `onComplete(ParentSetupResult), onSkip?, onSaveLater?`
- **ParentSetupResult:** `{ childName, childAge, childPronouns, parentRole, parentSecret? }`

### FirstNight.tsx
Post-first-story decision. Two cards: "Create another story" (dominant) or "Tuck into bed" (with 3-second goodnight animation + floating z particles).
- **Props:** `creature, character, onStory, onSleep`

### UserDashboard.tsx
Main authenticated hub. ~30+ state variables. Two-phase data loading (localStorage cache -> Supabase refresh).
- **Props:** `onSignUp, onReadStory?`
- **Sections:** Time-aware greeting, child avatar selector, constellation glow tracker (weekly), egg hatchery card with 7-shard progress, primary CTA, shard detail bottom sheet, week night dots, bedtime toast, "My Stuff" popup menu, guest upgrade prompts
- **API:** getCharacters, getNightCards, getStories, getAllHatchedCreatures, getActiveEgg, createEgg, journeyService.getActiveJourney, checkBedtimeReminder
- **Child components:** StreakBadge, BookHeroCard, StoryProgressDots, PrimaryCTA, SecondaryCTA, NightCardDrawer, CometSVG, BunnyHoldingEggSVG

### ReadyStateDashboard.tsx
Pre-onboarding cinematic. 5-phase timed animation: opening text -> stars + moon -> golden trail -> egg spirals in -> creatures peek + title + CTA.
- **Props:** `onBegin`

### StoryCreator.tsx
Dual-mode story wizard (ritual/create). Collects: seed text, occasion, world (space/ocean/forest/castle/volcano/custom), vibe (funny/cosy/exciting/heartfelt/mysterious), style (story/rhyming/adventure/mystery), length, age level. Voice recording support.
- **Props:** `entryMode ('ritual'|'create'), onGenerate(BuilderChoices), onBack`
- **Constants:** 10 RITUAL_QUESTIONS, 10 CREATE_QUESTIONS, 8 OCCASION_OPTIONS, 6 WORLDS, 5 VIBE_OPTIONS, 4 STYLE_OPTIONS, 3 LENGTH_OPTIONS, 4 AGE_OPTIONS

### LibraryHome.tsx
Story discovery page. Genre pill scroller (All, Adventure, Fantasy, Comedy, Magic, Wonder, Cozy, Brave, Animals, Space), search, "Story of the Day" hero card, staff picks, 2-column story card grid with procedural cover palettes, favourites.
- **API:** getLibraryStories, getBookOfDay, getFeaturedLibraryStories, getCharacters, favourites CRUD

### LibraryStoryReader.tsx
Full-screen reader. ~30+ state variables. Cover page with scene illustration, page carousel (swipe/tap), read-aloud with voice selection (11Labs + browser speech), language translation with interlinear mode, sharing, voting (thumbs up/down), favouriting, personalisation gate. PDF picture book support. V8 reader features (word magic, ambient mode, creature animation).
- **Props:** `{ slug: string }`
- **API:** getLibraryStoryBySlug, recordStoryRead, voteOnStory, getUserVote, favourites, ensureRefCode, translateStory, ElevenLabs TTS

### JourneyLibrary.tsx
"My Books" page with tabbed view (In Progress / Completed). Journey cards show progress, character name, continue button.
- **Props:** `{ onReadStory? }`
- **API:** journeyService.getCompletedBooks, getAllJourneys, Supabase character lookup

### CompletedBookReader.tsx
Transitional loader. Fetches completed book from Supabase, navigates to story-builder with preloaded data.
- **API:** Direct Supabase query on `stories` table

### ProfileSettings.tsx
Account settings: display name, email, password change, child profiles list with edit/view/add, subscription card, delete account.
- **Props:** `user, onBack, onEditCharacter, onViewCharacter, onNewCharacter, onLogout, onUserUpdated`
- **API:** getCharacters, updateUserProfile, updateUserEmail, updateUserPassword

### UserProfile.tsx
Profile overview. Children cards, 3-column stats, recent Night Cards (polaroid grid, max 5), creatures, bedtime reminder toggle with time picker, invite friends with copy link, settings links.
- **API:** getCharacters, getStories, getNightCards, getFriends, getAllHatchedCreatures, ensureRefCode, bedtime settings CRUD

### Hatchery.tsx
Creature collection. Night sky with constellation SVGs per creature (7-star patterns with interactive hover tooltips showing lesson beats). Active egg card, completed creature gallery (2-column grid), detail modal.
- **Props:** `{ user, onBack }`
- **API:** getCharacters, getNightCards, getAllHatchedCreatures, egg CRUD

### SharedStoryViewer.tsx
Public story viewer for `?s=...` links. Base64-decoded story in book-style reader (cover, story pages, end page). Audio playback. Marketing CTA.

### SharedNightCard.tsx
Public Night Card viewer for `?nc=...` tokens. Fetches via share token from Supabase, renders with NightCard component (tap to flip). Omits whisper (private).
- **API:** Supabase `night_card_shares` + `night_cards` queries

### PrintNightCard.tsx
Print-optimized Night Card for 5x7. Screen mode (centered, print button) and print mode (white background, no chrome).
- **API:** getNightCards (fetches all, filters client-side)

### DevStoryTest.tsx
Developer tool. Configures all story parameters, generates via Claude API, shows prompt preview.
- **API:** `/api/claude` proxy

### AdminUploadBook.tsx
Admin-only (gated by `VITE_ADMIN_EMAIL`). Multi-step: upload (text/picture mode, PDF extraction via pdf.js CDN), metadata (author, age, vibe, description, lessons, slug, staff pick, cover image), success.

---

## 7. Shared Components

### Dashboard Components (`src/components/dashboard/`)

**BookHeroCard.tsx** -- Currently-reading book card. Title, read progress, creature emoji, companion name, whisper line. Stateless.

**NightCardDrawer.tsx** -- Bottom-sheet drawer showing Night Card details. Chapter label, illustration zone with 12 procedural stars, title, quote, action buttons. Slide animation. Stateless.

**PrimaryCTA.tsx** -- Full-width amber button with shimmer overlay animation. `#F5B84C` background. Stateless.

**SecondaryCTA.tsx** -- Full-width ghost button (outline/translucent). Stateless.

**StoryProgressDots.tsx** -- 7-dot progress indicator. Green (done), amber pulsing (current), hollow (future). Press-scale tap targets. Guidance text below.

**StreakBadge.tsx** -- Night streak count with CometSVG icon. Celebration mode with glow + pop animation.

### Journey Components (`src/components/journey/`)

**ChapterHandoff.tsx** -- Transition screen after chapter generation. Shows book title, read number, chapter title, cast. Contains `chapterToBookData()` utility (named export) that converts API chapter JSON to SleepSeedCore format.

**NightlyCheckIn.tsx** -- Pre-story check-in. Emotional need selector (7 options: calm, confidence, comfort, courage, fun, connection, wonder), optional memory/detail inputs, generates chapter via `/api/story-journeys/{id}/read`. Shows loading with "~15 seconds" message.

**SeriesCreator.tsx** -- Post-book-completion. 4 options: continue world, continue characters, continue theme, fresh start. POSTs to `/api/story-series/start-from-book`.

**JourneySetup.tsx** -- 3-step wizard for new 7-night book. Step 1: emotional goal. Step 2: world selection (8 presets + custom). Step 3: personalization (recent event, detail, interest). POSTs to `/api/story-journeys/start`. Shows animated reveal with title, teaser, progress dots.

**BookComplete.tsx** -- End-of-book ceremony. Phases: loading -> stitching -> book_revealed -> hatching (egg shake) -> naming (pills + custom) -> complete (read/share/memory reel/continue/new). POSTs to `/api/story-journeys/{id}/complete`.

**MemoryReel.tsx** -- Post-completion recap. Journey summary with emotional arc and chapter highlights. CTAs: read book, share, start new, dashboard.

### Utility Components (`src/components/`)

**LanguagePicker.tsx** -- Language selection modal. 12 languages (en, es, fr, de, it, pt, ja, zh, ko, ar, hi, he) in 3-column grid. Learning Mode toggle for bilingual display. Dark/light themes.

**ReadAloudText.tsx** -- Word-highlighting TTS. Highlights words one at a time during speech. Two backends: browser speechSynthesis (with onboundary events) and 11Labs TTS via `/api/tts` (with estimated timing). Speed 0.5-1.5x. Play/pause/stop controls.

**InterlinearText.tsx** -- Sentence-by-sentence bilingual display with TTS. Foreign text (large) with English below (small). Sequential sentence playback with 400ms pauses. Speed 0.4-1.3x (slower for learning).

### Character SVGs (`src/components/characters/`)

**BunnyHoldingEggSVG.tsx** -- Bunny holding cracked egg with peeking eyes and teal sprout. Color palette: warm beige (#E8DDD0), pink cheeks (#F5C0A8), amber glow (#F5B84C), teal sprout (#14d890).

**CometSVG.tsx** -- Comet icon with 5 trailing dots + amber head. Optional `cometPulse` animation. Used in StreakBadge.

**MoonBunnySVG.tsx** -- Standalone bunny with whiskers, toe lines. `excited` prop variant (wider smile, arched brows, higher eyes).

---

## 8. Feature Modules

### Characters (`src/features/characters/`)

**CharacterBuilder.tsx** -- Full creation/editing form. Types: child, parent, animal, stuffy, DreamKeeper, other. Avatar with 8 color choices + photo upload. 16 personality tags (max 5). "Weird detail" with rotating examples. Post-save reveal ceremony with sparkle particles.
- **Constants:** 6 CHAR_TYPES, 4 PARENT_ROLES, 5 PRONOUNS, 16 PERSONALITY tags, 8 AVATAR_COLORS, 6 WEIRD_EXAMPLES

**CharacterDetail.tsx** -- Character profile. Avatar, metadata, personality tags, weird detail, filtered story library, night cards, favorites.

**CharacterLibrary.tsx** -- List view. Split into "My Children" (family) and "Characters" (supporting cast). Cards with avatar, metadata, action buttons (Edit, Night Cards, Delete). Expandable with personality tags + story chips.

### Night Cards (`src/features/nightcards/`)

**NightCard.tsx** -- Core component. Two sizes: `full` (300x420px, 3D flip) and `mini` (thumbnail). 5 variants: standard, origin (foil overlay + corner stars), journey, occasion, streak (fire overlay). Front: sky zone (photo or procedural stars/moon/glow/creature) + paper zone (badge, name, headline, memory, footer). Back: ornament, quote, attribution, memory, whisper (premium gated).
- **Exports:** Component + `getPinStyle()` helper

**NightCardLibrary.tsx** -- Full collection screen. 3 view modes: corkboard (polaroid with random rotation/pins), timeline (horizontal with kicker labels), scrapbook (2-column variant-aware grid). Hero section with stats (streak, rare count, journey count). Search, month grouping, detail modal with flip, edit modal, share (native + URL via Supabase `night_card_shares`), delete confirmation.

### Stories (`src/features/stories/`)

**StoryLibrary.tsx** -- "My Space" screen. Identity card for primary character, 3-stat grid, origin story special card, 2-column book grid with procedural cover palettes (6 color schemes), floating emoji, shimmer. Per-book context menu (read, share, add to library, send to friend, remove). Favorites (localStorage). Friend sharing modal. Night card horizontal scroll.

---

## 9. Core Files

### SleepSeedCore.tsx
The main story reader/builder. Handles: story generation (with animated creature + portal loading screen), full reading experience (cover, cast, story pages with SVG illustrations, choices, end ceremony), night card creation flow (question, photo, reveal), voice recording, read-aloud, language switching, warm filter mode, no-screen bedtime mode, auto-advance, sound/music toggles. Two coexisting design systems in CSS: original (`.book-3d`) and new reader (`.ss-reader`). 800+ lines of CSS with 30+ keyframe animations.

### StoryFeedback.jsx
Post-story feedback system. 3 phases: emoji rating (Loved/Good/Not quite), adaptive dimension question, confirmation with re-read check.
- **Style DNA system:** Per-genre profiles across 8 dimensions (specificity, sent_length, narrator, warmth, vocabulary, rhythm, restraint, quirk). Scores 5-95 with decision counts. Rating nudges all dimensions. Dimension answers apply +/-2.5 points. Re-read signal ("gold signal") applies +/-3.5 points to top 4.
- **Exports:** `processFeedbackSignal()`, `selectAdaptiveQuestion()`, `StoryFeedback`, `RereadCheck`, `StoryFeedbackDemo`

### sleepseed-library.jsx
Curated story library. `MODES` (6 genres: Master, Comedy, Adventure, Wonder, Cosy, Therapeutic). `books` array (7+ stories with metadata).

### sleepseed-prompts.js
**Single source of truth for all AI prompts.**
- **`buildStoryPrompt(brief)`** -- Returns `{ system, user }` for Anthropic API
- **`getTonightsSecretPrompt()`** -- Used in NightlyCheckIn
- **MASTER_SYSTEM_PROMPT (~190 lines):** Core Voice (specificity, read-aloud testing, narrator personality, character construction, dialogue quality), Final Line rules (image not moral), Planted Details, Sleep Landing mechanics (sentence length halving, sensory shift, breathing rhythm), Read-Aloud Phonetics, 12 Banned Phrases, 5 Banned Structures (adult-saves-it, named-lesson, no-rules-world, unearned-happiness, furniture-characters), Authenticity Principles, Craft Touchstones (Dahl, Sendak, Milne, Donaldson, Klassen, Willems)
- **GENRE_ARCS:** Per-genre templates (Comedy: 4 beats with Rule of Three, Adventure: 5 beats with planted detail payoff, Wonder, etc.)

### storyScenes.tsx (src/lib/)
12 animated SVG scene illustrations (Bedroom, Forest, Ocean, Arctic, Desert, Treehouse, Space, Candy, Library, Underwater, Castle, Jungle). viewBox 400x190 each. Shared CSS keyframes via `ensureCSS()`.
- **Exports:** `ALL_SCENES`, `getSceneIndex(seed)`, `getSceneComponent(seed)`, `VIBE_SCENES`, `getSceneByVibe(seed, vibe?)`

---

## 10. Library / Utilities

### src/lib/types.ts
All TypeScript types/interfaces:
- `User`, `CharacterType` (6 types), `ParentRole` (4), `Pronoun` (5), `PersonalityTag` (16 values)
- `Character` -- id, name, type, ageDescription, pronouns, personalityTags, weirdDetail, currentSituation, photo, color, emoji, storyIds, isFamily, parentRole
- `SavedStory` -- id, userId, title, heroName, characterIds, refrain, date, occasion, bookData, ageGroup, vibe, theme, mood, storyStyle, storyLength, lessons, isPublic, librarySlug, coverUrl, thumbsUp, thumbsDown, readCount, isStaffPick
- `LibraryStory` -- extends SavedStory with conversionCount, isBookOfDay, submitterDisplayName, submitterRefCode
- `SavedNightCard` -- id, userId, heroName, storyId, storyTitle, characterIds, headline, quote, memory_line, bondingQuestion/Answer, gratitude, extra, photo, emoji, date, isOrigin, whisper, occasion, streakCount, nightNumber, creatureEmoji, creatureColor, lessonTheme
- `CardVariant` -- standard | origin | journey | occasion | streak
- `HatchedCreature` -- id, userId, characterId, name, creatureType, creatureEmoji, color, rarity, personalityTraits, dreamAnswer, parentSecret, hatchedAt, photoUrl, weekNumber
- `HatcheryEgg` -- id, userId, characterId, creatureType, creatureEmoji, weekNumber, startedAt, createdAt
- `BuilderChoices` -- path, heroName, heroGender, vibe, level, length, brief, chars, lessons, occasion, style, pace
- `AppView` -- 30+ view states
- **Journey types:** EmotionalGoal (7 values), StoryJourneyStatus, NightArcEntry, StoryBible, JourneyMemoryBank, StoryJourneyChapter, StoryJourney, StorySeries, JourneyHighlight, JourneySummary, NightlyCheckInInput, StoryBibleInput, ChapterCoverPage, ChapterOpenerCastMember, ChapterOpenerPage, ChapterStoryPage, ChapterOutput
- `getCardVariant(card)` -- determines variant from card properties
- `CARD_VARIANT_STYLES` -- per-variant skyGradient, glowColor, paperColor, borderColor, headlineColor, shadow

### src/lib/supabase.ts
Supabase client instance. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Exports `hasSupabase: boolean`.

### src/lib/config.ts
`BASE_URL` from `VITE_APP_URL` env var, defaults to `https://sleepseed.vercel.app`.

### src/lib/storage.ts (~789 lines)
**Dual-write pattern:** localStorage (immediate) + Supabase (async). Reads merge both.

**Auth:** signUp, signIn, signOut, resetPassword, signInAsGuest, getSession
**Photos:** uploadPhoto (Supabase storage `photos` bucket)
**Characters:** getCharacters, saveCharacter, deleteCharacter, tagCharacterInStory
**Stories:** getStories, saveStory, deleteStory
**Night Cards:** getNightCards, saveNightCard, deleteNightCard (packs metadata into JSON `extra` field)
**Library:** getLibraryStories (paginated/filterable), getLibraryStoryBySlug, getBookOfDay, getFeaturedLibraryStories, submitStoryToLibrary, removeStoryFromLibrary, voteOnStory, getUserVote, favourites CRUD, isFavourited
**Attribution:** recordStoryRead (referral tracking), recordConversion (5 conversions = 1 month, 25 = 6 months)
**Profile:** getUserProfile, generateRefCode, ensureRefCode
**Friends:** addFriendByCode, getFriends, shareStoryWithFriend, getSharedStories, markSharedStoryRead, getUnreadSharedCount
**Utility:** uid() random ID generator

### src/lib/creatures.ts
14 creature definitions. Each has: id, name, emoji, color, description, nameSuggestions, virtue, craft, storyPersonality, virtueKeywords, 7 constellationPoints, 7 lessonBeats (progressive nightly themes), 7 dailyWisdom quotes.

| # | ID | Name | Virtue | Color |
|---|---|---|---|---|
| 1 | bunny | Moon Bunny | Courage | #F5B84C |
| 2 | fox | Ember Fox | Cleverness | #FF8264 |
| 3 | dragon | Storm Drake | Resilience | #60C8A0 |
| 4 | owl | Dusk Owl | Wisdom | #9A7FD4 |
| 5 | bear | Frost Bear | Kindness | #90C8E8 |
| 6 | cat | Shadow Cat | Independence | #A090D0 |
| 7 | wolf | Moon Wolf | Loyalty | #88B0D8 |
| 8 | unicorn | Dream Unicorn | Imagination | #E8A8D8 |
| 9 | panda | Cloud Panda | Patience | #B0A0D8 |
| 10 | deer | Star Deer | Gratitude | #D4A860 |
| 11 | frog | Dream Frog | Joy | #80C870 |
| 12 | otter | River Otter | Friendship | #C8A878 |
| 13 | penguin | Ice Penguin | Honesty | #A0C8E0 |
| 14 | hedgehog | Glow Hog | Vulnerability | #D4A878 |

Exports: `getCreature(id)`, `getCreatureByVirtueKeyword(keyword)`, `getCreatureByVirtue(virtue)`

### src/lib/creature-helpers.ts
- `resolveCreatureForRead(creatureId, readNumber)` -- full creature data for a given read (1-7) including correct lessonBeat
- `resolveNextCreature(currentCreatureId, hatchedTypes[])` -- picks random unhashed creature

### src/lib/hatchery.ts
CRUD for hatched creatures and eggs via Supabase. `getAllHatchedCreatures`, `getHatchedCreatures`, `saveHatchedCreature`, `getActiveEgg`, `createEgg`, `deleteEgg`.

### src/lib/translate.ts
12-language translation service. `translateStory()` calls `/api/claude` with Claude Sonnet for sentence-by-sentence bilingual pairs. In-memory cache. `LANGUAGES` constant, language persistence to localStorage.

### src/lib/bedtimeReminder.ts
Browser notification reminders. Settings in localStorage (`ss_bedtime_{userId}`). `checkBedtimeReminder()` fires notification if within 1 minute of target time, prevents double-fire per day.

### src/lib/journey-service.ts
Client-side journey CRUD via Supabase: `getActiveJourney`, `getJourneyWithChapters`, `getCompletedBooks`, `getAllJourneys`, `getSeries`, `getJourneySummary`, `archiveJourney`.

### src/lib/designTokens.ts
Design system constants:
- `COLORS` -- night, nightMid, nightCard, nightRaised, amber, teal, purple, cream
- `PALETTE` -- 6 gradient backgrounds
- `RADIUS` -- sm/md/lg (14/18/22px)
- `BORDER` -- hair/thin/mid
- `SP` -- xs/sm/md/lg (8/12/16/20px)
- `VARIANT_RGB` -- RGB strings per CardVariant

### src/lib/demo-seeds.ts
5 test story prompts for development.

### src/lib/migrateLocalStorage.ts
One-time migration from localStorage to Supabase. Reads from legacy keys (`ss9_*`, `ss2_*`), deduplicates, writes to Supabase.

---

## 11. API Routes

### GET /api/health
Returns: `{ status, anthropic_key_set, anthropic_key_prefix, elevenlabs_key_set, node_version }`

### POST /api/claude
Generic Anthropic API proxy. Forwards request body to `https://api.anthropic.com/v1/messages`. maxDuration: 60s.

### POST /api/tts
ElevenLabs text-to-speech. Request: `{ text, voiceId?, speed? }`. Returns: `audio/mpeg`. Model: `eleven_turbo_v2_5`. maxDuration: 30s.

### POST/DELETE /api/clone
Voice cloning via ElevenLabs. POST: multipart audio upload -> creates voice. DELETE: removes cloned voice by ID. maxDuration: 30s.

### GET /api/sitemap
Dynamic XML sitemap. Homepage + /stories + all public stories with library_slug. Cache: 1 hour.

### POST /api/book-of-day (Cron: daily 06:00 UTC)
Auto-generates daily "Book of the Day" via Claude. Auth: `x-cron-secret` header. Day-themed (Sun=heartfelt, Mon=adventure, Tue=funny, Wed=calm, Thu=mysterious, Fri=exciting, Sat=cosy). Default hero: "Alex" age 5-7. maxDuration: 60s.

### POST /api/convert-pdf
Converts extracted PDF text into SleepSeed story format via Claude (sonnet, 8000 tokens). Input truncated to 30,000 chars, output 6-14 pages. maxDuration: 120s.

### POST /api/story-journeys/start
Starts new 7-night StoryJourney (or returns existing active one). Generates StoryBible via Claude with quality check. Request: `{ userId, characterId, creatureId, child, creature, emotionalGoal, bookType, world, recentEvent?, specificDetail?, importantThing?, cast?, seriesMode?, seriesId? }`. maxDuration: 60s.

### GET /api/story-journeys/[id]
Fetch journey with all chapters. maxDuration: 30s.

### POST /api/story-journeys/[id]/read
Generate next chapter. Core nightly read endpoint. Builds prompt from bible + memory bank + resolved/unresolved threads. Quality check with surgical fix if needed (up to 3 Claude calls). Classifies memory beats via keyword patterns. Request: `{ need, todayMemory?, specificDetail?, occasion?, cast?, feel?, length?, child, creature }`. maxDuration: 120s.

### POST /api/story-journeys/[id]/complete
Completes 7-night journey. Stitches chapters into full book, generates summary. Requires all 7 chapters. Saves to `stories` + `journey_summaries`. maxDuration: 120s.

### GET /api/story-journeys/[id]/summary
Fetch journey summary. maxDuration: 30s.

### POST /api/story-series/start-from-book
Create StorySeries from completed book. Extracts world/characters/themes from storyBible. maxDuration: 30s.

---

## 12. Supabase Schema

### Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display_name, is_subscribed, ref_code, rewards_months_earned, conversion_count) |
| `characters` | Characters with personality, photos, family status |
| `stories` | All stories (private + public library); book_data JSON |
| `night_cards` | Nightly reflection cards; `extra` JSON field packs metadata |
| `story_votes` | Thumbs up/down on library stories |
| `library_favourites` | Saved favourites |
| `story_reads` | Read tracking with referral attribution |
| `story_journeys` | 7-night journey state (story_bible, memory_bank, threads) |
| `story_journey_chapters` | Individual chapters with full_chapter_json |
| `journey_summaries` | Completion summaries with highlights |
| `story_series` | Series grouping completed books |
| `hatched_creatures` | Earned creatures |
| `hatchery_eggs` | Active eggs (one per user+character) |
| `friends` | Bidirectional friendships (user_a, user_b) |
| `shared_stories` | Stories shared between friends |
| `night_card_shares` | Share tokens for public Night Card viewing |

### Storage Buckets
- `photos` -- Character and night card photos

---

## 13. Design System

### Colors
- **Primary/Amber:** #F5B84C (CTAs, active nav, accents, glow)
- **Teal:** #14d890 (success, completion, hatching)
- **Purple:** #9A7FD4 / #9482ff (special variants, owl creature)
- **Night backgrounds:** #060912 (deepest), #0B1535, #0C1840 (cards), #141a2e (raised)
- **Cream/Text:** #F4EFE8 (primary text), rgba(234,242,255,.28) (muted)

### Typography
- **Fraunces** -- Serif headings, CTAs, display
- **Nunito** -- Sans-serif body text
- **DM Mono** -- Monospace labels, badges, nav
- **Patrick Hand** -- Story text (handwritten feel)
- **Kalam** -- Handwritten accents, refrains
- **Baloo 2, Playfair Display, Plus Jakarta Sans, Cormorant Garamond, Lora, DM Sans** -- Various accent uses

### Radii
- sm: 14px, md: 18px, lg: 22px

### Key Animations
- shimmer (CTA overlay), floatY (floating elements), fadeUp (entrance), dotPulse (current night dot), cometPulse (streak badge), celebrationPop (rewards), breathe (loading), polaroidDevelop (card reveal), ss-twinkle/ss-bob/ss-glow/ss-drift/ss-spin/ss-wave/ss-spark/ss-smoke/ss-aurora (scene illustrations), foil shift (origin cards), and 30+ more in SleepSeedCore

### Styling Approach
Mixed: dashboard components use inline styles, feature modules use embedded `<style>` blocks with BEM-ish class prefixes (`.cb-`, `.cl-`, `.ncl-`, `.sl-`, `.nc-`, `.sf-`, `.js-`, `.ra-`, `.il-`, `.lp-`). No CSS modules or CSS-in-JS libraries.

---

## 14. Environment Variables

| Variable | Context | Purpose |
|---|---|---|
| `ANTHROPIC_KEY` | Server | Anthropic API key |
| `ELEVENLABS_KEY` | Server | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Server | Default narrator voice |
| `VITE_NARRATOR_VOICE_ID` | Build-time | Narrator voice ID |
| `VITE_SUPABASE_URL` | Client + Server | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key |
| `VITE_APP_URL` | Client | Base app URL |
| `CRON_SECRET` | Server | Cron job auth secret |
| `SYSTEM_USER_ID` | Server | User ID for system-generated content |
| `VITE_ADMIN_EMAIL` | Client | Admin email for upload gating |

---

## 15. Architecture Patterns

1. **No router library** -- All navigation via `setView()` from AppContext. No browser history stack management (back button doesn't work except for library URL push).

2. **Dual-write storage** -- All user data writes to localStorage immediately, then Supabase async. Reads merge both sources. Provides offline resilience and instant UI.

3. **Vercel serverless functions** -- Each `.js` file in `api/` is standalone. Vite dev plugin dynamically loads them with mock req/res.

4. **Prompt architecture** -- All AI prompts in `sleepseed-prompts.js`. API routes import it dynamically. Prompt/generation logic is server-side, client just sends parameters.

5. **7-night journey system** -- StoryJourney progresses through 7 reads with shared StoryBible, memory bank, and thread tracking. Each chapter builds on previous context. Completion stitches all into one book.

6. **Creature-virtue alignment** -- 14 creatures, each teaching one moral virtue through progressive 7-night lesson beats injected into story prompts.

7. **Night Card variants** -- 5 visual variants (standard, origin, journey, occasion, streak) with distinct styling tokens. Cards pack metadata into JSON `extra` field for Supabase.

8. **Style DNA adaptive system** -- Per-genre profiles across 8 writing dimensions. Feedback signals adjust scores. Re-reads are the "gold signal". Cross-genre learning at 0.3x weight.

9. **Two-phase data loading** -- Dashboard and StoryLibrary load instantly from localStorage cache, then background refresh from Supabase. Prevents loading flicker.

10. **Lazy loading** -- SleepSeedCore and LibraryStoryReader are lazy-loaded (not needed on initial render).

### Known Issues / Technical Debt
- `character-detail` view is not in the `AppView` union type (cast via `view as string`)
- `series-library` and `book-library` are in AppView type but have no render branches (dead views)
- `goNewCharacter()` navigates to full `onboarding` flow, not standalone `character-builder`
- `tsconfig.json` has `strict: false`
- OnboardingFlow and OnboardingNightCard call Anthropic API directly (not through `/api/claude` proxy)
- Some Night Card operations fetch all cards then filter client-side
- No React Router means no deep linking, browser back, or bookmarkable URLs (except library)
