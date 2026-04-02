# SleepSeed Platform Understanding Report
## Complete System + Product Handoff for ChatGPT

**Generated:** April 2026
**Source:** Latest committed code on `feature/onboarding-v9` branch (includes un-deployed v9 onboarding redesign)
**Purpose:** Enable ChatGPT to act as a dedicated expert advisor for strategy, content, design, UX/UI, emotional product design, and growth guidance.

---

## 1. Executive Summary

**SleepSeed** is a ritual-based emotional bonding platform for parents and children, built around the 20 minutes before sleep. It is NOT a generic AI story app. It is a memory creation system disguised as a bedtime experience, centered on a long-term relationship between a child and their DreamKeeper companion creature.

**Stack:** React 18 + TypeScript + Vite, Supabase (auth + Postgres), Anthropic Claude API for story generation, ElevenLabs TTS, deployed on Vercel.

**Current State:** Live at sleepseed-vercel.vercel.app with the original onboarding. A complete cinematic redesign of the onboarding (v9) is built on a feature branch, committed but not yet deployed. The v9 redesign replaces the old form-based parent setup and creature-selection flow with a 3-night narrative hatching ritual.

**Key Product Pillars:**
1. **Ritual** (daily, repeatable, calming)
2. **Emotional bonding** (parent-child-DreamKeeper triangle)
3. **Memory creation** (Night Cards as sacred artifacts)
4. **Continuity** (progression across nights, not isolated sessions)

**The product must feel:** Calm, magical, intentional, personal, slow. Never rushed, never game-like.

---

## 2. Product Positioning & Website Strategy

### Homepage Structure (PublicHomepage.tsx)

The landing page is structured as a conversion funnel with 5 major sections:

**Section 1 — The Hook (Hero)**
- Headline: "Your child will say something **true** tonight."
- Subheadline: "Every night before sleep, there's a window where they'll tell you what they'd never say at dinner. **SleepSeed opens it.**"
- CTA: "Start tonight -- free"
- Social proof: 5-star quote from "Sarah M., Mum of two, 122 nights"
- Floating creature emojis in animated starfield

**Section 2 -- Problem/Solution**
- Left: Parent asks "How was your day?" → child says "Fine." Three conversation failures.
- Right: "They open up to a **trusted friend**, in a story where they're the hero."
- Three feature cards: Companion who asks what you can't / Story built from their real day / Night Card that captures the moment

**Section 3 -- How It Works (3 steps)**
1. Share their day (type what happened)
2. Story appears (personalized, starring them)
3. Night Card saved (keepsake, saved forever)

**Section 4 -- The Experience**
- Interactive 4-scene demo cycling through: the window, the transformation, what she said, saved forever
- Full sample story displayed ("Adina and the Shy Cloud")
- Built-from choices shown: child name, age, creature, vibe, context

**Section 5 -- Social Proof**
- Founder quote from Greg Edelman
- 3 testimonial cards (parent, parent, child therapist)
- 3 Night Card social gallery samples
- Trust signals: Replaces screen time / Data stays private / Pediatrician-informed / Works on any device

**Section 6 -- The Close**
- "These nights are happening **right now.**"
- Pricing: Free ($0, 3 stories + 3 Night Cards) | Family ($6.58/mo, unlimited)
- CTA: "Start tonight -- free"

**Messaging Assessment:**
- **Strengths:** Emotional hook is powerful. Problem/solution contrast is clear. Founder credibility adds trust. Testimonials are specific and credible. Story preview is compelling.
- **Weaknesses:** The DreamKeeper/companion concept isn't explained early enough. The 3-night hatching ritual (the core differentiator) isn't mentioned on the homepage at all. Pricing feels tacked on. The "how it works" is generic (could be any AI story app). Missing: video demo, mobile app store badge, FAQ section.

### Navigation
- Sticky header: Logo + "Sign in" + "Start free"
- Mobile: Sticky footer CTA appears on scroll
- No hamburger menu, no additional pages linked

### Auth Flow
- Email/password signup or guest mode
- "Continue as guest" option (reduced friction)
- Email verification required for full accounts
- No OAuth/social login currently

---

## 3. Full System Map

### Page/Route Architecture

**Public (No Auth):**
| Route | Component | Purpose |
|-------|-----------|---------|
| `public` | PublicHomepage | Marketing/conversion |
| `auth` | Auth | Sign in/up |
| `library` | LibraryHome | Public story browse |
| `library-story` | LibraryStoryReader | Read public stories |
| Shared links | SharedStoryViewer, SharedNightCard | Viral sharing |

**Onboarding (v9, Auth Required):**
| Route | Component | Purpose |
|-------|-----------|---------|
| `parent-onboarding` | ParentOnboarding | 6-screen cinematic parent flow |
| `cinematic-transition` | CinematicTransition | Name constellation + Elder intro |
| `night-1` | NightDashboard(night=1) | Welcome/Lore/Share/Story/Card/Tuck-in |
| `night-2` | NightDashboard(night=2) | Return/Question/Story/Card/Tuck-in |
| `night-3` | NightDashboard(night=3) | Dashboard with egg progress |
| `night-3-story` | Night3Story | Hardcoded "The Choosing" narrative |
| `hatch-ceremony` | HatchCeremony | 14s canvas particle animation |
| `post-hatch` | PostHatch | First Contact/Photo Card/Born Card |

**Post-Onboarding (Auth Required):**
| Route | Component | Nav Tab |
|-------|-----------|---------|
| `dashboard` | MySpace + AppLayout | My Space |
| `library` | LibraryHome | Discover |
| `ritual-starter` | StoryCreator(ritual) | Create |
| `story-wizard` | StoryCreator(create) | Create |
| `story-builder` | SleepSeedCore | (full screen) |
| `user-profile` | UserProfile | Profile |
| `characters` | CharacterLibrary | Profile > |
| `story-library` | StoryLibrary | My Space > |
| `nightcard-library` | NightCardLibrary | My Space > |
| `hatchery` | Hatchery | My Space > |

### Bottom Navigation (4 tabs)
1. **Discover** (book icon) -- Public story library
2. **My Space** (star icon) -- HOME: DreamKeeper + recent content
3. **Create** (plus icon, emphasized) -- Story creation
4. **Profile** (user icon) -- Settings, children, account

### State Management
- **AppContext** -- Global: user, view, selectedCharacter, companionCreature, ritualSeed
- **localStorage** -- Onboarding flags, ritual state, cached data
- **Supabase** -- Characters, stories, night cards, creatures, eggs

### Key localStorage Flags (user-scoped)
| Key | Meaning |
|-----|---------|
| `sleepseed_parent_setup_{userId}` | Parent data collected |
| `sleepseed_child_profile_{userId}` | JSON of child profile |
| `sleepseed_onboarding_{userId}` | DreamKeeper flow completed |
| `sleepseed_ritual_complete_{userId}` | 3-night ritual done |
| `sleepseed_ritual_{userId}` | Full RitualState JSON |

---

## 4. Onboarding Map

### V9 Onboarding (New -- Committed, Not Deployed)

The v9 onboarding is a complete redesign spanning 3 real-world days. It replaces the old form-based flow with a cinematic, narrative-driven experience.

**Day 0: Parent Onboarding (P1-P6)**
```
P1: Battle     -- "Bedtime is a battle. Until it isn't." (pill animation)
P2: Shift      -- "The day pulls you in a thousand directions..." (auto-advance 4.4s)
P3: Cinematic  -- 4-act emotional case (20s total):
                  Act 1: "You're not doing anything wrong"
                  Act 2: "They remember the nights someone made something just for them"
                  Act 3: "It's about sitting with your child... and staying."
                  Act 4: "Each night / You sit together / The DreamKeeper arrives / And it becomes yours"
P4: Commit     -- 3-night promise cards (Tonight / Tomorrow / Night 3)
P5: Future     -- "Three nights from now... they'll be waiting"
P6: Name       -- Child name (required), age (optional), pronouns (optional)
```

**Data collected at P6:** childName, childAge, childPronouns
**On completion:** Character saved to Supabase, egg created, ritual initialized in localStorage

**Cinematic Transition (~16s canvas animation)**
- Child's name rendered as star constellation (dots appear, lines connect, glow)
- "Alright, {childName}... We have been waiting to meet them."
- Elder DreamKeeper rises from bottom

**Night 1 (C1-C9 from v9 design)**
```
C1: Welcome    -- Elder + constellation name. "Welcome, {name}. We have been waiting for you."
C2: Lore       -- Elder speech: "There are beings called DreamKeepers..."
C3: Share      -- "What made you smile today?" (6 chip options)
                  Collects: smileAnswer
C4: Story      -- Routes to SleepSeedCore (ritual mode, Claude generates story from smileAnswer context)
C5: Egg Gift   -- Elder presents egg. "This egg will become your DreamKeeper."
C6: Crack      -- Egg listening state transitions to cracked. "That crack appeared because you were here tonight."
C7: Close      -- "That was your first story together. You stayed."
C8: Night Card -- Memory saved. Badge: "NIGHT 1 - THE EGG FIRST LISTENED"
C9: Tuck-in    -- "Come back tomorrow. It will be different." + "Want more? Create a story."
```
**State after N1:** eggState='cracked', currentNight=2, smileAnswer stored

**Night 2 (N2-1 through N2-7)**
```
N2-1: Return   -- "Welcome back, {name}." Memory callback: "You told me that {smileAnswer} made you smile."
N2-3: Question -- "What's something you're really good at?" (6 chip options)
                  Collects: talentAnswer
N2-4: Story    -- Routes to SleepSeedCore (ritual mode, includes N1 context)
N2-5: Cracks   -- Egg with deeper cracks. "It's learning and remembering more about you."
N2-6: Card     -- Badge: "NIGHT 2 - STILL LISTENING" (teal accent)
N2-7: Tuck-in  -- "Come back tomorrow. Something is about to change."
```
**State after N2:** eggState='hatching', currentNight=3, talentAnswer stored

**Night 3 (N3-1 through Hatch + Post-Hatch)**
```
N3-1: Dashboard -- Egg shaking. "Tonight is different." Progress: 94%.
N3-Story: "The Choosing" -- Hardcoded 7-page canonical narrative:
  Elder explains the permanent bond. DreamKeeper chose this child specifically.
  Final page: "Are you ready? The egg shook softly..."
Hatch Ceremony (14s canvas animation):
  Phase 1-2: Heartbeat + glow intensify
  Phase 3-4: Max brightness + BLOOM FLASH + 40 canvas particles burst
  Phase 5: Egg fades, creature silhouette appears (dark)
  Phase 6-7: Gradual reveal + "Hi, {name}..." + creature looks around
  Phase 8: Blink + "I've been waiting for you." + CTA
Post-Hatch:
  First Contact -- Creature speaks: "{name}, I chose you. I will be your DreamKeeper."
  Photo Card    -- Night Card with badge "NIGHT 3 - HATCHED" (pink accent)
  Born Card     -- "The night your DreamKeeper was born." Final special memory.
```
**State after N3:** eggState='hatched', ritualComplete=true, creature saved to hatched_creatures, companionCreature set in AppContext

### Creature Assignment Logic
The DreamKeeper is NOT chosen by the parent or child. It is derived from 3 nights of answers:
- Night 1 smileAnswer maps to feelings (e.g., "Playing" -> brave, curious)
- Night 2 talentAnswer maps to feelings (e.g., "Being kind" -> safe, calm)
- Feelings are scored against each creature's feelingMatch array
- Highest-scoring creature is assigned
- Future: optional favorite-animal question can override

### Old Onboarding (Still Live, Being Replaced)
- ParentSetup.tsx -- 6-moment form wizard (name, age, pronouns, role, secret, favorites)
- DreamKeeperOnboarding.tsx -- 6-step feeling -> creature selection with reveal animation
- OnboardingRitual.tsx -- 3-night Q&A (simple question per night, no story gen)

**Key differences v9 vs old:**
- Old: Parent picks creature explicitly via feeling selection
- New: Creature assigned algorithmically from child's answers over 3 nights
- Old: Ritual nights are simple Q&A (no story generation)
- New: Nights 1 & 2 generate full AI stories via SleepSeedCore
- Old: Night 3 was another Q&A
- New: Night 3 is a hardcoded canonical story + cinematic hatch ceremony

---

## 5. DreamKeeper System Map

### The 10 V1 DreamKeepers

| ID | Name | Emoji | Color | Virtue | Feeling Match | Emotional Line |
|----|------|-------|-------|--------|---------------|----------------|
| owl | Dusk Owl | owl emoji | #9A7FD4 | Wisdom | curious, calm | "I see you. I see who you really are." |
| bear | Frost Bear | bear emoji | #90C8E8 | Kindness | cozy, safe | "You looked like you could use someone warm." |
| fox | Ember Fox | fox emoji | #FF8264 | Cleverness | curious, brave | "I know a shortcut. Want to see?" |
| bunny | Moon Bunny | bunny emoji | #F5B84C | Courage | safe, brave | "I was scared too, once. Then I found you." |
| dragon | Storm Drake | dragon emoji | #60C8A0 | Resilience | brave, safe | "Whatever happened today, we can handle it." |
| cat | Shadow Cat | cat emoji | #A090D0 | Independence | calm, curious | "You don't have to be like everyone else." |
| turtle | Tide Turtle | turtle emoji | #7EBFA5 | Patience | calm, sleepy | "There's no hurry. I'll be here when you're ready." |
| sloth | Willow Sloth | sloth emoji | #C4A882 | Rest | sleepy, cozy | "Close your eyes. I'll keep watch." |
| seal | Harbor Seal | seal emoji | #8BAEC4 | Joy | cozy, calm | "Did you know the stars come out just for us?" |
| dog | Star Pup | dog emoji | #D4A860 | Loyalty | safe, cozy | "I'm yours. That's it. I'm just yours." |

**Elder DreamKeeper** (system-wide, not selectable): Narrates ritual, appears in cinematic transition and night stories. "A timeless presence that watches over all dreamers."

### Where DreamKeepers Appear
- **MySpace dashboard** -- Centered creature image/emoji with ambient glow, name label, growth stats
- **Story generation** -- Creature injected as companion character in every story
- **Night Cards** -- Creature emoji + color branded on every card
- **Hatchery** -- Constellation visualization, 7-star progress per creature
- **Story library** -- Creature association per story

### Dual Creature Systems
- **creatures.ts** (14 creatures) -- Used by Hatchery, has lesson beats (7 per creature), constellation points, daily wisdom
- **dreamkeepers.ts** (10 creatures) -- Used by onboarding, has feeling matching, personality traits, emotional lines
- IDs overlap where both exist (owl, bear, fox, bunny, dragon, cat)
- 4 creatures only in dreamkeepers.ts (turtle, sloth, seal, dog)
- Both systems coexist; hatched creature goes into `hatched_creatures` table AND sets `companionCreature` in AppContext

---

## 6. Story System Map

### Story Creation Wizard (StoryCreator.tsx)
Two modes:
- **Ritual mode** (`entryMode="ritual"`) -- For bedtime ritual, questions about the day
- **Create mode** (`entryMode="create"`) -- Free-form story creation

### BuilderChoices (the data bridge)
```
path: 'ritual' | 'free'
heroName: string (child's name)
heroGender: 'boy' | 'girl' | ''
vibe: 'warm-funny' | 'calm-cosy' | 'exciting' | 'heartfelt' | 'silly' | 'mysterious'
level: 'age3' | 'age5' | 'age7' | 'age10'
length: 'short' | 'standard' | 'long'
brief: string (context about the day or story premise)
chars: array of cast characters
lessons: string[]
occasion: string
style: 'standard' | 'rhyming' | 'adventure' | 'mystery'
pace: 'normal' | 'sleepy' | 'snappy'
```

### Story Generation (SleepSeedCore.tsx, 4649 lines)
- Receives BuilderChoices as prop
- Auto-triggers generation via useEffect
- Calls `/api/claude` (Anthropic proxy) with constructed prompt
- Returns book data with pages
- Stages: generating -> book (reader) -> nightcard (creation)

### Story Reading Experience
- Top 52%: Scene illustration (6 types: stars, elder, glow, egg, dreamlight, eggcrack)
- Bottom 48%: Story text (Lora serif italic, 16.5px) + moon dots progress + Next button
- Swipe/tap navigation between pages

### Post-Story Night Card Flow
1. Bonding question ("What was the best part?")
2. Optional gratitude/memory input
3. Optional photo capture
4. Claude generates card metadata (headline, quote, memory_line, whisper)
5. Card saved to Supabase

---

## 7. Memory System Map

### Night Cards (Primary Memory Artifact)

**SavedNightCard structure:**
- headline, quote, memory_line, whisper (parent-only)
- bondingQuestion + bondingAnswer
- gratitude, photo
- emoji, date
- isOrigin, nightNumber, streakCount
- creatureEmoji, creatureColor

**Card Variants:**
- Standard (regular)
- Origin ("where it began")
- Journey (multi-night milestone)
- Occasion (birthday, sick day)
- Streak (7, 14, 30, 100 day)

**Where they appear:**
- MySpace dashboard (last 5, horizontal scroll)
- NightCardLibrary (full collection, 3 view modes: cork board / timeline / scrapbook)
- UserProfile (mini grid, last 5)
- SharedNightCard (public sharing)

### Photo System
- Camera capture or file upload
- Base64 during flow, uploaded to Supabase storage on save
- Stamped with creature emoji in corner (Night 3 photo card)

---

## 8. UI/UX Audit

### Design Token System (designTokens.ts)
```
Night: #060912 | Night Mid: #0B1535 | Night Card: #0C1840
Amber: #F5B84C | Teal: #14d890 | Purple: #9A7FD4 | Cream: #F4EFE8
```
V9 onboarding adds: Pink #ff82b8 (Night 3), deeper gradients, more animation variety.

### Font System
- **Fraunces** (serif) -- Headlines, emotional text, CTAs
- **Nunito** (sans) -- Body text, descriptions
- **DM Mono** (mono) -- Labels, badges, meta
- **Lora** (serif italic) -- Story text, whisper lines
- **Patrick Hand** (cursive) -- Story page accents

### Strongest UI
1. **MySpace dashboard** -- Creature-centric, warm, personal. Excellent emotional design.
2. **Hatchery constellation view** -- Stunning SVG visualization of creature progress.
3. **V9 Hatch Ceremony** -- 14s canvas particle animation is cinema-quality.
4. **Night Cards** -- Physical card metaphor with cream paper aesthetic.
5. **V9 Parent cinematic** -- 4-act emotional build is masterful copywriting.

### Weakest UI
1. **Homepage pricing section** -- Feels tacked on, breaks emotional flow.
2. **CharacterLibrary** -- Minimal, functional but not magical.
3. **Empty states** -- Inconsistent quality across views.
4. **StoryLibrary book covers** -- Good but repetitive with 6 palette variations.

### UI Fragmentation
- Old onboarding components (ParentSetup, DreamKeeperOnboarding) use different styling patterns than v9
- Some pages use inline styles exclusively, others mix with CSS classes
- Night Card rendering varies between contexts (mini, full, shared)

---

## 9. Content & Copy Audit

### Homepage Copy
- **Hook:** "Your child will say something true tonight" -- Strong, emotional, specific
- **Problem framing:** "How was your day?" "Fine." -- Instantly relatable
- **Solution:** "They open up to a trusted friend" -- Clear value prop
- **Weakest copy:** How It Works section is generic. Pricing copy is functional but not emotional.

### Onboarding Copy (v9)
- **P1 pills** create visceral recognition ("just five more minutes" -- every parent knows this)
- **P3 "and staying"** is the emotional apex -- 44px gold text, textShadow glow
- **P5 "Three nights from now"** is effective future pacing
- **Night lore** ("DreamKeepers don't belong to everyone") creates exclusivity + wonder
- **Post-story "You stayed"** validates the parent's presence -- emotionally sophisticated

### Tone/Voice
- Parent-facing: Validating, never condescending. "You're not doing anything wrong."
- Child-facing: Warm, magical, unhurried. The Elder speaks with quiet authority.
- System copy: Minimal, monospace, respectful. "THE EGG IS LISTENING TOO"

---

## 10. Technical Context

### Architecture
- Single-page app, NO router library -- all navigation via `view` state variable in AppContext
- ~30 view states in AppView type union
- Lazy loading: SleepSeedCore and LibraryStoryReader
- Two-phase data loading: localStorage cache (instant) -> Supabase refresh (background)

### Integrations
- **Supabase:** Auth, PostgreSQL (characters, stories, night_cards, hatched_creatures, hatchery_eggs, library_stories), Storage (photos)
- **Anthropic Claude:** Story generation + Night Card metadata generation via `/api/claude` serverless proxy
- **ElevenLabs:** TTS narration via `/api/tts`

### Key Tables
| Table | Purpose |
|-------|---------|
| profiles | User profile, subscription, refCode |
| characters | Child characters (name, age, pronouns, personality) |
| hatched_creatures | DreamKeeper instances (linked to character) |
| hatchery_eggs | Active eggs being incubated |
| saved_stories | Generated stories (title, bookData, metadata) |
| saved_night_cards | Night cards (headline, quote, photo, metadata) |
| library_stories | Public story library (ratings, staff picks) |

### Constraints
- No router = URL doesn't reflect current view (except library links)
- Ritual state in localStorage only (no cross-device sync)
- No push notifications (bedtime reminder is in-app only)
- No analytics/event tracking infrastructure

---

## 11. Gap vs. Ideal SleepSeed Vision

### What's Working Well
- Emotional design is genuinely moving (v9 onboarding especially)
- Creature system creates real attachment
- Night Cards as memory artifacts is differentiated and valuable
- Story generation quality from Claude is good
- Two-phase loading provides fast UX
- Bottom nav is intuitive

### Key Gaps

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| Homepage doesn't explain 3-night ritual | Conversion loss -- the core differentiator is hidden | Medium |
| No video/demo on homepage | Hard to convey the experience in text | Medium |
| Ritual state is localStorage-only | Multi-device users lose progress | High |
| No push notifications for bedtime | Retention depends on parent remembering | High |
| No story continuity across nights | Each story is isolated, no narrative arc | High |
| Night Cards can't be exported/printed | The "keep forever" promise needs physical form | Medium |
| No parent-child shared reading mode | Currently one device, one reader | Medium |
| Creature doesn't evolve visually | 10 static emoji creatures, no growth visualization | High |
| No FAQ or help content | New users may have questions | Low |
| Analytics missing entirely | Can't measure conversion, retention, or engagement | Medium |

### Fragmentation Issues
- Old onboarding code still in codebase alongside v9 (technical debt)
- `creatures.ts` and `dreamkeepers.ts` are parallel systems with partial overlap
- Some pages use AppLayout wrapper, others don't (inconsistent nav visibility)
- DEV debug section visible in production UserProfile

---

## 12. ChatGPT Handoff Summary

### What ChatGPT Should Know to Advise Well

1. **SleepSeed is a ritual, not an app.** Every recommendation should reinforce calm, magical, intentional design. No gamification, no dopamine mechanics.

2. **The 3-night onboarding IS the product.** It's not just setup -- it's the emotional foundation. The egg hatching over 3 real days creates the bond.

3. **DreamKeepers are companions, not mascots.** They should feel like a real relationship. The creature speaks, remembers, and grows.

4. **Night Cards are sacred.** They capture unrepeatable moments. They should feel like physical keepsakes, not digital content.

5. **The parent is the hidden user.** The child is the star, but the parent is the buyer, the ritual-keeper, and the one who needs to feel validated ("You stayed.").

6. **The v9 onboarding is the best work in the product.** The cinematic parent flow (P1-P5) and the 3-night hatching arc represent the product's emotional peak. Use this as the quality bar.

7. **The homepage undersells the product.** It describes AI stories but doesn't convey the ritual, the DreamKeeper bond, or the 3-night arc. This is the biggest conversion opportunity.

8. **Retention depends on the nightly return.** The egg visual progression (idle -> cracked -> hatching -> hatched) is the retention hook. After hatching, there's no equivalent pull.

### Strategic Questions for ChatGPT to Help Answer
- How should the homepage communicate the 3-night ritual without overwhelming?
- What is the post-hatching retention mechanism? (Current: just story creation)
- How should creature evolution work long-term?
- What's the right monetization trigger? (Currently: after 3 free stories)
- How should SleepSeed position against generic AI story apps?
- What content strategy builds the library as a discovery channel?

---

## 13. Appendix

### File Reference (Key Files)

**Homepage & Public:**
- `src/pages/PublicHomepage.tsx` -- Landing page
- `src/pages/Auth.tsx` -- Sign in/up
- `src/pages/LibraryHome.tsx` -- Public story library

**V9 Onboarding:**
- `src/pages/ParentOnboarding.tsx` -- 6-screen parent cinematic
- `src/components/onboarding/CinematicTransition.tsx` -- Constellation canvas
- `src/pages/NightDashboard.tsx` -- Night 1/2/3 orchestrator
- `src/pages/Night3Story.tsx` -- "The Choosing" hardcoded narrative
- `src/components/onboarding/HatchCeremony.tsx` -- 14s hatch animation
- `src/pages/PostHatch.tsx` -- First Contact/Cards
- `src/pages/OnboardingV9Preview.tsx` -- Full preview mode (`?view=v9-preview`)

**Shared Components:**
- `src/components/onboarding/ElderDreamKeeper.tsx` -- CSS character
- `src/components/onboarding/DreamEgg.tsx` -- 4-state egg (idle/gifted/listening/cracked)
- `src/components/onboarding/onboarding.css` -- 36 keyframe animations

**Core Systems:**
- `src/lib/ritualState.ts` -- 3-night progression (localStorage)
- `src/lib/creatureAssignment.ts` -- Answer-to-creature matching
- `src/lib/dreamkeepers.ts` -- 10 creature database
- `src/lib/creatures.ts` -- 14 creature database (Hatchery)
- `src/lib/storage.ts` -- Supabase CRUD
- `src/lib/types.ts` -- All TypeScript interfaces

**Post-Onboarding:**
- `src/pages/MySpace.tsx` -- Dashboard
- `src/pages/Hatchery.tsx` -- Creature constellation view
- `src/SleepSeedCore.tsx` -- Story generation engine (4649 lines)
- `src/pages/StoryCreator.tsx` -- Story input wizard

**Routing & State:**
- `src/App.tsx` -- View routing + onboarding handlers
- `src/AppContext.tsx` -- Global state provider

### Deployed vs. Committed Differences

| Feature | Deployed (main) | Committed (feature/onboarding-v9) |
|---------|-----------------|-----------------------------------|
| Parent onboarding | ParentSetup (6-moment form) | ParentOnboarding (6-screen cinematic) |
| Creature selection | DreamKeeperOnboarding (feeling grid) | Automatic (3-night answer algorithm) |
| Ritual nights | OnboardingRitual (simple Q&A) | NightDashboard (story gen + full flow) |
| Night 3 | RitualNight3 (hatching Q&A) | Night3Story + HatchCeremony + PostHatch |
| Dashboard routing | Prompts on dashboard | Routes to night-1/2/3 views |
| OnboardingShell | N/A | Mobile container (430px max, phone frame) |

### Known Issues
1. Ritual state is localStorage-only (no Supabase sync)
2. DEV debug section visible in production UserProfile
3. No error boundaries or error UI
4. Some `any` types in story/book data flows
5. Large components need splitting (SleepSeedCore 4649 lines, NightCardLibrary ~600)
6. No analytics or event tracking
7. Accessibility gaps (missing alt text, ARIA labels)
