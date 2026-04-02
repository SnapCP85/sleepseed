# SleepSeed Surfaces Audit — Night Cards, Library, My Space, Profile

**Generated:** 2026-03-31 | **Based on:** actual source code

---

## 1. FILES INVOLVED

### Night Cards
| File | Role | Status |
|------|------|--------|
| `src/features/nightcards/NightCard.tsx` (319 lines) | Core card component — mini and full sizes, 5 variants, 3D flip, photo/procedural sky | **Production core** |
| `src/features/nightcards/NightCardLibrary.tsx` (722 lines) | Collection screen with grid, search, share, modals | **Production with ~500 lines dead code** |
| `src/components/dashboard/NightCardDrawer.tsx` (165 lines) | Dashboard bottom-sheet card preview | **Production core** |
| `src/pages/SharedNightCard.tsx` (99 lines) | Public share viewer via URL token | **Production** |
| `src/pages/PrintNightCard.tsx` (53 lines) | Print-optimized view | **Production, minimal** |
| `src/pages/OnboardingNightCard.tsx` (439 lines) | Night 0 origin card creation wizard | **Production, API key issue** |

### Library / Discover
| File | Role | Status |
|------|------|--------|
| `src/pages/LibraryHome.tsx` (~400 lines) | Main discover/browse page | **Production core** |
| `src/pages/LibraryStoryReader.tsx` (~800 lines) | Full-screen immersive story reader | **Production core, ~150 lines dead code** |
| `src/sleepseed-library.jsx` (~300 lines) | Standalone marketing page with hardcoded data | **Legacy/prototype — NOT connected to app** |
| `src/components/LanguagePicker.tsx` | Language selection modal | **Production, reusable** |
| `src/components/ReadAloudText.tsx` | Word-highlighting TTS component | **Production, reusable** |
| `src/components/InterlinearText.tsx` | Bilingual sentence display | **Production, reusable** |
| `src/lib/storyScenes.tsx` | 12 animated SVG scene illustrations | **Production, reusable** |

### My Space / Memories
| File | Role | Status |
|------|------|--------|
| `src/features/stories/StoryLibrary.tsx` (597 lines) | Main "My Space" bookshelf | **Production core** |
| `src/pages/JourneyLibrary.tsx` (142 lines) | "My Books" journey list | **Production** |
| `src/pages/CompletedBookReader.tsx` (65 lines) | Completed book loader/redirect | **Production, minimal** |
| `src/components/journey/ChapterHandoff.tsx` (97 lines) | Chapter transition screen | **Production** |
| `src/components/journey/NightlyCheckIn.tsx` (223 lines) | Pre-chapter emotional check-in | **Production** |
| `src/components/journey/JourneySetup.tsx` (368 lines) | 3-step new book wizard | **Production** |
| `src/components/journey/BookComplete.tsx` (244 lines) | End-of-book ceremony + creature hatching | **Production** |
| `src/components/journey/MemoryReel.tsx` (102 lines) | Post-completion journey summary | **Production, minimal** |
| `src/components/journey/SeriesCreator.tsx` (77 lines) | Series continuation chooser | **Production, minimal** |

### Profile
| File | Role | Status |
|------|------|--------|
| `src/pages/UserProfile.tsx` (~350 lines) | Main profile overview | **Production core** |
| `src/pages/ProfileSettings.tsx` (~280 lines) | Account settings page | **Orphaned — unreachable from any navigation** |
| `src/pages/Hatchery.tsx` (~400 lines) | Creature collection / night sky | **Production** |
| `src/features/characters/CharacterBuilder.tsx` (~500 lines) | Character creation/editing form | **Production** |
| `src/features/characters/CharacterDetail.tsx` (~300 lines) | Character profile view | **Production** |
| `src/features/characters/CharacterLibrary.tsx` (~300 lines) | Character list view | **Production** |
| `src/components/characters/BunnyHoldingEggSVG.tsx` | Decorative SVG | **Unused by profile system** |
| `src/components/characters/CometSVG.tsx` | Streak comet icon | **Used by dashboard StreakBadge** |
| `src/components/characters/MoonBunnySVG.tsx` | Decorative SVG | **Unused by profile system** |

### Shared Dependencies
| File | Used By |
|------|---------|
| `src/lib/types.ts` | All surfaces — SavedNightCard, CardVariant, Character, SavedStory, StoryJourney types |
| `src/lib/designTokens.ts` | NightCard, NightCardDrawer — COLORS, VARIANT_RGB, RADIUS, SP |
| `src/lib/storage.ts` | All surfaces — CRUD for characters, stories, night cards, library, friends, sharing |
| `src/lib/creatures.ts` | Hatchery, Journey system — 14 creature definitions with 7 lesson beats each |
| `src/lib/hatchery.ts` | Hatchery, BookComplete — egg and creature CRUD |
| `src/lib/journey-service.ts` | JourneyLibrary, MemoryReel — journey queries |
| `src/lib/translate.ts` | LibraryStoryReader, LanguagePicker — translation API + language persistence |
| `src/lib/bedtimeReminder.ts` | UserProfile — browser notification scheduling (localStorage only) |
| `src/AppContext.tsx` | All surfaces — global state (user, view, characters, creatures, journeys) |
| `src/App.tsx` | All surfaces — routing and view switching |

---

## 2. NIGHT CARDS AUDIT

### User Flow

**Entry points:**
- Dashboard night card tap → NightCardDrawer (preview)
- Dashboard "See memories" → NightCardLibrary (view = `nightcard-library`)
- UserProfile "See all N memories" → NightCardLibrary
- UserProfile mini card grid tap → NightCardLibrary
- Story completion → Night Card creation flow (inside SleepSeedCore, ncStep 0-4)
- Onboarding → OnboardingNightCard (Night 0 origin card)
- Direct URL `?nc=TOKEN` → SharedNightCard
- Direct URL `?printCard=ID&uid=UID` → PrintNightCard

**Main screen (NightCardLibrary):**
1. Header: "MEMORIES" kicker + "Night Cards" title + back chevron
2. Stats strip: 3 columns (Cards / Months / Origin count)
3. 2-column card grid (custom inline thumbnails, NOT using NightCard mini)
4. Empty state: moon + "No cards yet"

**Secondary flows:**
- Card tap → modal with NightCard full size + Close/Share/Print buttons
- Share → native share (mobile) or generated link (desktop) via `night_card_shares` table
- Print → opens new window at `/printCard?...`
- NO edit flow (dead code)
- NO delete flow (dead code — confirmation exists but no trigger)

**Exit:** Back button → dashboard

### Information Architecture

**Strong:**
- The 5-variant system (standard/origin/journey/occasion/streak) with distinct sky gradients, glow colors, and paper tones
- The 3D card flip interaction on full-size cards
- The polaroid aesthetic with sky zone + paper zone
- Photo mode vs procedural sky — both work well
- The whisper as parent-only private content (hidden from shares)

**Weak:**
- The library grid uses custom inline card rendering, not the NightCard mini component — visual inconsistency
- ~500 lines of dead code (corkboard/timeline/scrapbook view modes, search, hero section, latest card strip)
- No edit or delete functionality wired to the UI (state + CSS exists but no buttons)
- Modal doesn't support flip — can't see the back face of a card
- Stats show counts but no streak or rare card numbers (computed but unused)
- No pagination (capped at 30 cards from Supabase)

### Data Model

```typescript
SavedNightCard {
  id, userId, heroName, storyId?, storyTitle, characterIds,
  headline, quote, memory_line?, bondingQuestion?, bondingAnswer?,
  gratitude?, extra? (JSON), photo?, emoji?, date,
  isOrigin?, whisper?, occasion?, streakCount?, nightNumber?,
  creatureEmoji?, creatureColor?, lessonTheme?
}
```

**Variant classification** (`getCardVariant`): `isOrigin` → origin; `nightNumber % 7 === 0` → journey; `occasion` → occasion; `streakCount` in {7,14,30,100} → streak; else → standard

**Storage:** Dual-write (localStorage immediate + Supabase async). Reads merge both. Variant metadata packed into `extra` JSON field for Supabase.

**Inconsistency:** NightCardLibrary has its own `getV()` function that reimplements variant detection, and its own `NCL_VARIANT_RGB` constant duplicating `VARIANT_RGB` from designTokens.

### Card Renderings — 4 Different Implementations

| Location | Uses NightCard component? | Visual |
|----------|--------------------------|--------|
| NightCard full (modal, SharedNightCard) | Yes | Full 300x420, 3D flip, all variant styling |
| NightCard mini (UserProfile grid) | Yes | Thumbnail, sky+paper zones, variant badge |
| NightCardLibrary grid | **No** — custom inline | Different thumbnail with simplified rendering |
| OnboardingNightCard reveal | **No** — custom polaroid | Completely different visual, no variant system |
| NightCardDrawer preview | **No** — custom inline | Card-style preview with stars, different font |

---

## 3. LIBRARY / DISCOVER AUDIT

### User Flow

**Entry points:**
- BottomNav "Discover" tab → LibraryHome (view = `library`)
- URL `?view=library` → LibraryHome
- URL `?library=SLUG` → LibraryStoryReader

**Main screen (LibraryHome):**
1. Header: "Discover" title
2. Genre pills: horizontal scroll (All, Adventure, Fantasy, Comedy, Magic, Wonder, Cozy, Brave, Animals, Space)
3. Search input
4. Stats row: Stories / Today / Reads (3 columns)
5. Story of the Day hero card (hidden when filtering)
6. Conversion prompts (guest: sign up, free: family plan)
7. "ALL STORIES" section with Trending/New toggle
8. 2-column story card grid
9. Load More button
10. Footer: "Add your story to the library" (subscribed only)

**Reader (LibraryStoryReader):**
- Cover page: SVG scene illustration + title + hero name
- Story pages: scene illustration top + page number + text + refrain
- End page: "The End" + vote cards + favourite + share + CTA
- Controls tray: Listen (voice, ambient), Learn (word magic, language, learning mode), Share & Exit
- Navigation: tap zones (left 30% / right 30%), swipe, arrows, dots

**Secondary flows:**
- Genre filter, search, Trending/New sort
- Story of the Day (fetched daily)
- Favourites (star toggle, Supabase-backed)
- Voting (thumbs up/down with optional note)
- Translation (12 languages via Claude API)
- Read-aloud (ElevenLabs + browser speech fallback)
- Personalisation gate (name substitution, subscribed only)
- Sharing (referral code + native share/clipboard)
- PDF picture book mode (canvas rendering, no TTS/translation)

**Exit:** Back to library, or auth (for guests)

### Information Architecture

**Strong:**
- Story of the Day hero card with glow effect creates visual hierarchy
- Genre pills are well-chosen and emotional ("Wonder", "Cozy", "Brave" — not generic categories)
- The reader's v8r feature set is rich: ambient sound (generative Web Audio), word magic (atmospheric word highlighting with haptic), nightfall progression (background darkens as you read), learning mode
- Scene illustrations are high quality (12 unique animated SVGs)
- Read-aloud with word highlighting is polished
- The personalisation gate (enter child's name) is clever — makes library stories feel personal

**Weak:**
- Genre pills have duplicate values: Adventure + Space both map to `exciting`; Fantasy + Wonder both map to `heartfelt`
- `filterAge` state exists but no UI renders it — age filtering is invisible
- Stats row "Reads" shows `stories.length` (same as Stories count) — misleading
- Cover palette is index-based (position in grid), not story-deterministic — same story gets different colors in different positions
- Legacy controls sheet (`sheetOpen`) is dead code (~100 lines)
- `sleepseed-library.jsx` is a completely separate disconnected marketing page (different fonts, colors, data) — potential confusion
- PDF books get a degraded experience (no cover page, no TTS, no translation)
- No keyboard navigation in reader
- Inconsistent favourite gating between end page and controls sheet

### Data Model

```typescript
LibraryStory extends SavedStory {
  conversionCount, isBookOfDay, bookOfDayDate,
  submitterDisplayName, submitterRefCode
}
// bookData contains: title, heroName, pages[], refrain, allChars?
```

**Data loading:** Two-phase — localStorage cache (`ss_library_cache`) for instant paint, then Supabase refresh.

**Reader data:** Single `getLibraryStoryBySlug(slug)` call. Increments `read_count`. Strips `parentNote` and `nightCard` from `bookData` (privacy).

---

## 4. MY SPACE / MEMORIES AUDIT

### User Flow

**Entry points:**
- BottomNav "My Space" → StoryLibrary (view = `story-library`)
- Various nav → JourneyLibrary (view = `journey-library`)
- Dashboard → JourneySetup (view = `journey-setup`)
- Nightly → NightlyCheckIn → ChapterHandoff → story-builder → BookComplete → MemoryReel/SeriesCreator

**Main screen (StoryLibrary):**
1. Header: "My Space" title + three-dot button (non-functional)
2. Child filter pills (horizontal scroll, by hero name)
3. Identity card: avatar, name, "YOUR COMPANION" label, story count
4. Stats grid: Stories / Memories / Streak
5. Search bar
6. "Shared with you" section (friend shares, unread highlighted)
7. Origin story (special wide card, shown without filters)
8. Book grid: 2-column, procedural cover palettes, floating emoji, shimmer
9. Night cards horizontal scroll (up to 10, mini format)

**Per-book context menu:** Read again, Share, Add/Remove from library, Send to friend, Remove

**Journey screens (separate flow):**
- JourneyLibrary: In Progress / Completed tabs
- JourneySetup: 3-step wizard (emotional goal → world → personalization)
- NightlyCheckIn: emotional need + memory + detail → generate chapter
- ChapterHandoff: preview + "Begin tonight's chapter"
- BookComplete: ceremony → creature hatching → naming
- MemoryReel: summary + highlights
- SeriesCreator: 4 continuation options

### Information Architecture

**Strong:**
- Two-phase data loading (localStorage cache → Supabase) eliminates loading flicker
- Procedural cover palettes with floating emoji make the bookshelf visually appealing
- Origin story gets special treatment (wider card, label)
- The 7-night journey system is genuinely unique — progressive storytelling with memory bank, thread tracking, and creature hatching
- Friend sharing with messages is a thoughtful social feature
- BookComplete ceremony (stitching animation → creature hatching → naming) is emotionally resonant

**Weak:**
- **Two disconnected library screens:** StoryLibrary shows standalone stories; JourneyLibrary shows journey books. No unified "all my books" view.
- Three-dot header button has no menu
- Night cards "See all" link has no handler
- Identity card says "YOUR COMPANION" but shows child name (not creature)
- `onBack` prop accepted but never called in StoryLibrary
- `onReadStory` prop accepted but never called in JourneyLibrary
- Favourites are localStorage-only — lost on device switch
- No pagination — all data rendered at once
- `charColorMap` and `favCount` computed but never used
- MemoryReel is a plain vertical list — no "reel" experience
- Series system has no visual presence in either library

### Data Models

**Two parallel systems:**
1. `SavedStory` — standalone stories, loaded via `getStories()`. Has `bookData` (full rendered pages).
2. `StoryJourney` — 7-night multi-chapter books, loaded via `journeyService`. Has `storyBible`, `memoryBank`, chapters. On completion, creates a `SavedStory` with `finalBookId`.

These overlap at the `stories` table level but are presented in completely separate screens.

**Journey data:**
```typescript
StoryJourney {
  id, userId, characterId, creatureId, status, readNumber, totalReads (7),
  workingTitle, storyBible (JSON), memoryBank (JSON),
  unresolvedThreads, resolvedThreads, finalBookId?, finalBookTitle?
}
StoryJourneyChapter {
  journeyId, readNumber, emotionalGoal, fullChapterJson,
  memoryCandidates, unresolvedThreadsAfter, resolvedThreadsInChapter
}
```

---

## 5. PROFILE AUDIT

### User Flow

**Entry points:**
- BottomNav "Profile" → UserProfile (view = `user-profile`)

**Main screen (UserProfile):**
1. Header: "Profile" title
2. Primary child card (avatar, name, age, creature name)
3. Stats grid: Nights / Books / Creatures
4. Night Cards section (up to 5 mini cards + overflow + "See all")
5. Children section (list + "Add another child")
6. Account links: Invite friend, Bedtime reminder, Language (dead), Subscription (dead), Sign out
7. Member since footer
8. DEV ONLY: subscription toggle

**Secondary flows:**
- Primary child card tap → CharacterLibrary
- Night card tap → NightCardLibrary
- Child card tap → CharacterLibrary
- Add child → OnboardingFlow (full flow, not CharacterBuilder)
- Invite friend → clipboard copy
- Bedtime reminder → modal with toggle + time picker
- Sign out → logout

**Hatchery (separate screen):**
1. Star field background (30 decorative stars)
2. Nav: back button + "Your Night Sky" + star count
3. Sky canvas (280px): constellation SVGs with interactive star tooltips
4. Active DreamKeeper card with 7-dot progress
5. Completed creatures grid (2-column)
6. Detail modal: large constellation + all lesson beats

**Character system:**
- CharacterLibrary: split into "My Children" (family) and "Characters" (supporting)
- CharacterBuilder: type grid, avatar (8 colors + photo), name, age, pronouns, 16 personality tags, weird detail
- CharacterDetail: read-only profile with filtered stories + night cards

### Information Architecture

**Strong:**
- The constellation/night sky metaphor in Hatchery is unique and visually distinctive
- 7-star constellations mapping to 7 lesson beats creates a visible progression system
- Interactive star tooltips showing lesson themes + dates ground the abstract in specifics
- Bedtime reminder using browser notifications is a practical feature
- Character personality tags + weird detail provide genuinely useful story generation fuel
- Post-save reveal ceremony in CharacterBuilder is satisfying

**Weak:**
- **ProfileSettings is completely orphaned** — implemented but unreachable from any navigation path
- Language and Subscription links in UserProfile have **no onClick handlers** — dead UI
- `bestStreak` and `favCount` are computed but **never displayed**
- "Add another child" goes to full OnboardingFlow, not the simpler CharacterBuilder
- **Inconsistent family classification:** UserProfile includes `isFamily undefined + human` as family; CharacterLibrary only includes `isFamily === true`
- **Incompatible favourite storage keys:** CharacterDetail uses `ss2_favs_*`; UserProfile reads `ss_fav_stories_*`
- CharacterDetail has no back button in rendered UI
- Hatchery auto-creates eggs with random creature type — no user choice
- Only primary character's egg progress is shown; other characters' eggs exist in state but aren't rendered
- Font inconsistency across Profile surfaces (Fraunces/Nunito vs Playfair Display/Plus Jakarta Sans)
- Delete account in ProfileSettings just calls logout — doesn't actually delete data

### Data Model

```typescript
Character {
  id, name, type (6 types), ageDescription, pronouns, personalityTags (max 5 of 16),
  weirdDetail, currentSituation, photo (base64 or URL), color, emoji,
  storyIds, isFamily, parentRole
}
HatchedCreature {
  id, userId, characterId, name, creatureType, creatureEmoji, color,
  rarity, personalityTraits, dreamAnswer, parentSecret, hatchedAt, photoUrl, weekNumber
}
HatcheryEgg {
  id, userId, characterId, creatureType, creatureEmoji, weekNumber, startedAt, createdAt
}
CreatureDef {
  id, name, emoji, color, description, nameSuggestions, virtue, craft,
  storyPersonality, virtueKeywords,
  constellationPoints (7 [x,y] pairs),
  lessonBeats (7 {night, theme, prompt}),
  dailyWisdom (7 strings)
}
```

---

## 6. SHARED DATA MODELS & DEPENDENCIES

### Core Types (all in `src/lib/types.ts`)

| Type | Fields | Used By |
|------|--------|---------|
| `User` | id, email, displayName, isGuest, isSubscribed, refCode | All surfaces |
| `Character` | 14 fields including personalityTags, weirdDetail, isFamily | Profile, My Space, Story creation |
| `SavedStory` | 20+ fields including bookData (JSON), isPublic, librarySlug | My Space, Library |
| `SavedNightCard` | 22 fields including variant metadata, whisper, photo | Night Cards, Dashboard, Profile |
| `CardVariant` | standard/origin/journey/occasion/streak | Night Cards |
| `HatchedCreature` | 13 fields | Hatchery, Journey, Dashboard |
| `StoryJourney` | 15+ fields including storyBible, memoryBank | Journey system |
| `BuilderChoices` | 13 fields | Story creation → SleepSeedCore |
| `AppView` | 30+ string union | All navigation |

### Storage Pattern

All data follows the dual-write pattern:
1. **Write:** localStorage first (optimistic), then Supabase (async)
2. **Read:** Merge localStorage + Supabase, deduplicate by ID
3. **Cache:** Some surfaces read localStorage first for instant render, then refresh from Supabase

### Supabase Tables Referenced

| Table | Primary Surface |
|-------|----------------|
| `profiles` | Profile, Auth |
| `characters` | Profile, Characters |
| `stories` | My Space, Library |
| `night_cards` | Night Cards |
| `night_card_shares` | Night Card sharing |
| `story_votes` | Library voting |
| `library_favourites` | Library favourites |
| `story_reads` | Library analytics |
| `story_journeys` | Journey system |
| `story_journey_chapters` | Journey system |
| `journey_summaries` | MemoryReel |
| `story_series` | Series continuation |
| `hatched_creatures` | Hatchery |
| `hatchery_eggs` | Hatchery |
| `friends` | Friend sharing |
| `shared_stories` | Friend sharing |

---

## 7. STYLING / DESIGN SYSTEM AUDIT

### Typography

| Font | Weight | Usage |
|------|--------|-------|
| **Fraunces** | 700-800 | Primary serif headings, CTAs, card headlines |
| **Nunito** | 400-700 | Primary sans body text |
| **DM Mono** | 400 | Monospace labels, badges, kickers |
| **Patrick Hand** | — | Story text (handwritten) |
| **Kalam** | — | Cursive accents, refrains |
| **Baloo 2** | 600-700 | CTA buttons |
| **Playfair Display** | — | ProfileSettings headings (inconsistent) |
| **Plus Jakarta Sans** | — | ProfileSettings body (inconsistent) |
| **DM Sans** | — | sleepseed-library.jsx only (marketing) |
| **Lora** | — | NightCardDrawer quotes (inconsistent), sleepseed-library.jsx |

**Inconsistency:** ProfileSettings and NightCardDrawer use different serif/sans stacks than the rest of the app.

### Color System

| Token | Hex | Usage |
|-------|-----|-------|
| `night` | `#060912` | Deepest background |
| `nightMid` | `#0B1535` | Mid background |
| `nightCard` | `#0C1840` | Card backgrounds |
| `nightRaised` | `#141a2e` | Raised surfaces |
| `amber` | `#F5B84C` | Primary accent, ritual mode, CTAs, active states |
| `teal` | `#14d890` | Success, completion, create mode |
| `purple` | `#9A7FD4` | Special variants, adventure mode |
| `cream` | `#F4EFE8` | Primary text, card paper |

**Card variant colors (VARIANT_RGB):**
- Standard: `154,127,212` (lavender)
- Origin: `245,184,76` (gold)
- Journey: `20,216,144` (teal)
- Occasion: `148,130,255` (violet)
- Streak: `245,184,76` (gold)

### Spacing & Radii

| Token | Value |
|-------|-------|
| `RADIUS.sm` | 14px |
| `RADIUS.md` | 18px |
| `RADIUS.lg` | 22px |
| `SP.xs` | 8px |
| `SP.sm` | 12px |
| `SP.md` | 16px |
| `SP.lg` | 20px |

### Styling Approach — Fragmented

Every component injects its own CSS via `<style>{CSS}</style>` template strings in the render. Each uses a unique class prefix:

| Prefix | Component |
|--------|-----------|
| `.nc-` | NightCard |
| `.ncl-` | NightCardLibrary |
| `.sl-` | StoryLibrary |
| `.lh-` | LibraryHome |
| `.lr-` / `.v8r-` | LibraryStoryReader |
| `.pf-` | UserProfile |
| `.ps-` | ProfileSettings |
| `.ns-` | Hatchery |
| `.cb-` | CharacterBuilder |
| `.cd-` | CharacterDetail |
| `.cl-` | CharacterLibrary |
| `.js-` | JourneySetup |
| `.lp-` | LanguagePicker |
| `.ra-` | ReadAloudText |
| `.il-` | InterlinearText |
| `.sf-` | StoryFeedback |

**Problems:**
- Each file re-declares `*,*::before,*::after{box-sizing:border-box}` and `:root` variables
- Multiple identical style blocks injected when multiple instances render
- No deduplication, no CSS modules, no CSS-in-JS library
- `designTokens.ts` exists but most components define their own color constants inline
- Dashboard components use inline styles exclusively; feature modules use CSS strings; reader uses both

### Animation Patterns

Common keyframes used across surfaces:
- `fadeUp` / `fup` / `slideUp` — entrance animations (subtly different timing in each file)
- `twinkle` — star twinkling (redefined in ~5 files)
- `shimmer` — CTA shimmer overlay
- `floatCreature` / `mfloat` / `slFloat` / `ncFloat` — floating elements (all slightly different)
- `polaroidDevelop` — card reveal
- `dotPulse` — active dot indicator

**Problem:** Same conceptual animations redefined with different names, timings, and easings across files.

---

## 8. WHAT MUST BE PRESERVED

### Night Cards
- **5-variant system** with distinct visual identities (sky gradients, glow, paper tone)
- **Sky zone + paper zone** polaroid structure
- **Photo mode** with gradient overlay and grain texture
- **Procedural sky** with twinkling stars and creature
- **3D card flip** interaction
- **Whisper** as private parent content (excluded from shares)
- **Origin card** special treatment (foil shimmer, corner stars)
- **Share token system** via Supabase `night_card_shares`

### Library / Discover
- **Genre pills** that feel emotional not categorical (Wonder, Cozy, Brave)
- **Story of the Day** hero card
- **Scene illustrations** (12 animated SVGs with vibe-based selection)
- **Reader v8r features:** nightfall progression, word magic, ambient sound, learning mode
- **Read-aloud** with word highlighting
- **12-language translation** with interlinear mode
- **Personalisation gate** (name substitution)
- **Voting system** (thumbs up/down with optional note)
- **Two-phase data loading** pattern (instant localStorage paint + Supabase refresh)

### My Space / Memories
- **Procedural cover palettes** with floating emoji
- **Origin story** special treatment
- **7-night journey system** with memory bank and thread tracking
- **BookComplete ceremony** with creature hatching flow
- **Friend sharing** with messages
- **Two-phase data loading**

### Profile
- **Constellation night sky** metaphor in Hatchery
- **7-star constellations** mapping to lesson beats with interactive tooltips
- **Character weird detail** field (feeds into story generation)
- **Personality tags** system (16 options, max 5)
- **Post-save reveal ceremony** in CharacterBuilder
- **Bedtime reminder** with browser notifications

---

## 9. WHAT SHOULD BE REDESIGNED

### Night Cards
- **Consolidate card renderings** — 4 different visual implementations for the same concept
- **Wire edit and delete** — dead code exists, just needs UI triggers
- **Remove ~500 lines dead code** in NightCardLibrary (corkboard/timeline/scrapbook)
- **Enable flip in modal** — currently renders without flip props
- **Add pagination** — currently capped at 30 with no load-more
- **Use NightCard mini** in library grid instead of custom inline thumbnails
- **Fix duplicate constants** — getV(), NCL_VARIANT_RGB mirror canonical versions
- **Fix OnboardingNightCard API call** — missing API key, needs server proxy

### Library / Discover
- **Fix genre filter duplicates** — Adventure/Space both → exciting; Fantasy/Wonder both → heartfelt
- **Wire or remove filterAge** — state exists, no UI
- **Fix stats row** — "Reads" shows story count, not read count
- **Remove dead code** — legacy controls sheet, renderV8rTopBar, renderV8rMoonDots
- **Make cover palette story-deterministic** — currently index-based, changes with sort order
- **Remove or integrate sleepseed-library.jsx** — disconnected marketing page creates confusion
- **Add keyboard navigation** to reader
- **Improve PDF book experience** — currently no cover page, no TTS, no translation

### My Space / Memories
- **Unify the two library screens** — StoryLibrary and JourneyLibrary present disconnected views of the same user's books
- **Wire dead UI** — header three-dot menu, night cards "See all" link
- **Fix identity card** — shows "YOUR COMPANION" but displays child name, not creature
- **Sync favourites to Supabase** — currently localStorage-only
- **Add loading state** — empty state flashes on first visit before Supabase loads
- **Clean up unused computed values** — charColorMap, favCount
- **Improve MemoryReel** — currently a plain list, needs the "reel" experience promised by its name
- **Surface series in library** — series system exists but has no visual presence

### Profile
- **Reconnect or remove ProfileSettings** — fully implemented, completely unreachable
- **Wire Language and Subscription links** — currently dead UI
- **Display bestStreak and favCount** — computed but hidden
- **Fix family classification inconsistency** — UserProfile vs CharacterLibrary disagree
- **Fix favourite key inconsistency** — CharacterDetail and UserProfile use different localStorage keys
- **Add back button to CharacterDetail**
- **Let user choose creature for egg** — currently random
- **Show all characters' egg progress** — currently only primary character visible
- **Resolve font inconsistency** — ProfileSettings uses different font stack

---

## 10. PRODUCT / DEMO RISKS

### Night Cards
- **Modal doesn't flip** — in a demo, you can't show the back of a card from the library
- **No delete path** — cards accumulate with no cleanup option
- **OnboardingNightCard API may fail** — missing auth header for Claude API call
- **Card image generation is basic** — shared images are plain text on cream, don't match actual card design

### Library / Discover
- **Empty library on fresh account** — no stories visible without Book of the Day or staff picks populated in Supabase
- **Stats row misleads** — "Reads" count equals story count, appears broken
- **PDF books lack features** — if a demo story is a PDF, no TTS or translation works
- **Guest lock after 5 cards** — demo browsing is limited
- **ElevenLabs word sync is imprecise** — word highlighting drifts, especially on longer passages

### My Space / Memories
- **Empty state on first visit before Supabase loads** — bookshelf briefly shows "Your bookshelf is empty" even if user has stories (race condition with cache)
- **Two separate library screens** — user may not find their completed journey books in "My Space"
- **No loading indicator** in StoryLibrary — if localStorage cache doesn't exist yet
- **"See all" night cards link does nothing** — dead link visible in demo

### Profile
- **Language and Subscription links are dead** — clicking them does nothing, visible in demo
- **ProfileSettings unreachable** — if someone asks "where do I change my email?" there's no path
- **"Add child" triggers full onboarding** — lengthy flow for what should be a simple add
- **Delete account doesn't delete** — just logs out
- **Hatchery only shows primary character's egg** — multi-child families see incomplete data

### Cross-Surface
- **Font loading** — 11 Google Font families loaded in index.html. Slow first paint on poor connections.
- **CSS duplication** — every component injects its own style block. On pages with multiple components, dozens of redundant style elements exist in the DOM.
- **No responsive breakpoints** — all surfaces are mobile-first with fixed widths. Tablet/desktop views may look awkward.
- **No error boundaries** — any component crash takes down the entire app.
- **30-card/story Supabase limit** — active users may hit the ceiling with no load-more.

---

## 11. WHAT ADDITIONAL INFO IS STILL NEEDED BEFORE REDESIGN

### Truly needed
- **Mobile screenshots at 375px and 430px** for: NightCardLibrary, LibraryHome, StoryLibrary, UserProfile, Hatchery. The code reveals dense layouts but actual visual density depends on data volume — screenshots with 10+ cards/stories would show the real information density.
- **Sample data states**: a Supabase export (or screenshots) showing what a real user with 15+ night cards, 8+ stories, 2 children, 3 creatures, and an active journey looks like across these surfaces. Several screens have empty-state treatments but likely few real-data screenshots exist.

### Useful but not blocking
- **Analytics on feature usage**: Does anyone use the translation system? The ambient sound? Friend sharing? Word magic? This determines what to keep prominent vs. tuck away.
- **Actual ElevenLabs latency data**: How long does TTS take in practice? Affects whether read-aloud feels seamless or broken.

### Not needed
- Component tree diagrams — the routing is simple (App.tsx → view-based switch)
- API response shapes — all documented in this audit
- State management diagrams — single Context + local state per component
- The dead `sleepseed-library.jsx` — confirmed disconnected, can be ignored for redesign
