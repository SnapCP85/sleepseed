# SleepSeed Story Creation System — Full UX/Product Audit

**Generated:** 2026-03-31 | **Based on:** actual source code, not assumptions

---

## 1. Files Involved

### Core creation flow
| File | Role |
|------|------|
| `src/pages/StoryCreator.tsx` (1274 lines) | **The single wizard** for both Ritual and Anytime paths. Receives `entryMode` prop. Contains all constants, UI, state, and the `handleGenerate()` output builder. |
| `src/SleepSeedCore.tsx` (~3600 lines) | **Generation engine + story reader.** Receives `builderChoices` from StoryCreator, auto-triggers `generate()`, shows the animated generation screen, then transitions to the full book reader. Also contains the post-story Night Card creation flow. |
| `src/sleepseed-prompts.js` (~700 lines) | **Prompt assembly.** `buildStoryPrompt(brief)` returns `{ system, user }` for the Anthropic API. Contains `MASTER_SYSTEM_PROMPT`, genre arcs, banned phrases, sleep landing rules. |

### Routing & handoff
| File | Role |
|------|------|
| `src/App.tsx` | Routes `view === 'ritual-starter'` to `<StoryCreator entryMode="ritual">`, routes `view === 'story-wizard'` to `<StoryCreator entryMode="create">`. Both feed `wizardChoices` into `<SleepSeedCore builderChoices={wizardChoices}>` via `view === 'story-builder'`. |
| `src/AppContext.tsx` | Stores `view`, `selectedCharacter`, `selectedCharacters`, `ritualSeed`, `ritualMood`, `companionCreature`. |

### Entry points (what triggers each path)
| Trigger | Path | Source file |
|---------|------|-------------|
| Dashboard primary CTA "Start tonight's story" | **Ritual** | `UserDashboard.tsx:364` → `setView('ritual-starter')` |
| FirstNight "Create another story" | **Ritual** | `App.tsx:539` → `setView('ritual-starter')` |
| StoryLibrary "Create" button | **Ritual** | `App.tsx:622` → `setView('ritual-starter')` |
| BottomNav "Create" tab | **Anytime** | `App.tsx:253` → `goStoryBuilder()` → `setView('story-wizard')` |
| Dashboard "One story tonight" secondary CTA | **Anytime** | `UserDashboard.tsx:564` → `setView('story-wizard')` |
| Dashboard guest "Create your first story" | **Anytime** | `UserDashboard.tsx:510` → `setView('story-wizard')` |
| CharacterDetail "Use in story" | **Anytime** | `App.tsx:645` → `goStoryBuilder(char)` |

### Post-generation screens
| File | Role |
|------|------|
| `src/SleepSeedCore.tsx` (stage `"generating"`) | Animated loading screen with creature, portal, bonding question, progress steps |
| `src/SleepSeedCore.tsx` (stage `"reading"`) | Full book reader (cover, cast page, story pages with SVG scenes, end page) |
| `src/SleepSeedCore.tsx` (Night Card flow, `ncStep` 0-4) | Post-story ritual: bonding question → gratitude → whisper → generating → reveal |
| `src/StoryFeedback.jsx` | Post-story feedback: emoji rating → adaptive dimension question → confirmation |

---

## 2. Ritual Path Flow Map

### Entry
Dashboard → `startRitual()` → clears `ritualSeed` and `ritualMood` → `setView('ritual-starter')`

### Step 1 — StoryCreator (entryMode="ritual")

**Screen: Single scrollable page, no multi-step wizard**

The Ritual path renders the *entire* StoryCreator as one continuous scroll — not steps. Everything is visible or conditionally revealed on one screen.

#### 1a. Night Badge
- **What user sees:** Small amber pill at top: `"{creatureName} is ready"` with pulsing dot
- **Purpose:** Sets emotional tone — creature is waiting
- **Conditional:** Ritual only

#### 1b. Creature Zone (centered, large)
- **What user sees:** Large creature emoji (72px) floating with amber glow, creature name below in mono caps, creature type below that
- **Layout:** Centered column, radial amber glow behind creature
- **Conditional:** Ritual only layout (create mode uses smaller inline row)

#### 1c. Speech Bubble
- **What user sees:** Bubble with dynamic text from creature:
  - Empty state: `"{childName}! What happened today worth putting in a story? Could be anything — big, small, silly, or strange. 🌙"`
  - After input: `"Got it! {first4words}… Ready when you are. ✨"`
- **Conditional:** Ritual only

#### 1d. Inspiration Card (conditional: shown when no input yet)
- **Label:** `"✦ Need some inspiration?"`
- **Shows:** One rotating question from `RITUAL_QUESTIONS` (10 total) with keyword highlighted in amber
- **Controls:** `🔀 different` button (shuffles), tap question to use it as input
- **Hint text:** `"↑ tap to use · 🔀 to see another"`
- **Disappears:** When user has >3 characters of input

#### 1e. Voice Input
- **Button:** `"🎙️ Tell {creatureName} out loud"` with wave bars
- **Conditional:** Only if browser SpeechRecognition API available
- **When recording:** Button turns red, text changes to `"Listening… tap to stop"`, wave bars animate
- **After recording:** Shows transcript card with "Edit ✏️" button

#### 1f. Text Input
- **Divider:** `"— or write it down —"` (only if voice is available)
- **Textarea:** Amber-bordered, placeholder: `"We found a really fat frog under the plant pot…"`
- **Purpose:** Parent types what happened today

#### 1g. Occasion Tag (conditional: shown after input, before dismissal)
- **Label:** `"Tag this story"` with `"Skip →"` button
- **Pills:** 8 horizontal-scroll occasion pills (🎂 Birthday, 😔 Hard day, 🌟 Big win, 🏫 First day, ❤️ Missing someone, 🏠 New home, 🏥 Feeling sick, 👏 Proud moment)
- **Optional:** Can be skipped entirely

#### 1h. Cast Section
- **Label:** `"Who's in the story?"`
- **Pills:** Horizontal scroll of character pills. Hero is always first and locked. Creature pill is toggleable. Other family characters toggleable. Max 5 total.

#### 1i. Settings (collapsed by default)
- **Trigger:** `"Story options ▾"` row with badge summary of non-default settings
- **When expanded:** 4 rows of pills:
  - **Length:** Short (~3min) · Standard (~5min) · Long (~8min)
  - **Feel:** Funny · Cosy · Exciting · Heartfelt · Mysterious
  - **Style:** Story · Rhyming · Adventure · Mystery
  - **Age:** 3–5 · 6–8 · 9–11 · 11+
- **Defaults:** Standard length, Cosy feel (auto-inferred from input), Story style, age from character profile
- **Vibe auto-inference:** Runs on 300ms debounce, disabled when user manually picks a vibe

#### 1j. CTA (fixed bottom)
- **Text:** `"✦ Write tonight's story"` / sub: `"{creatureName} has been waiting"`
- **Color:** Amber gradient with shimmer
- **Disabled when:** Input is less than 4 characters
- **On tap:** Builds `BuilderChoices` → `onGenerate(choices)` → App sets `wizardChoices`, clears `preloadedBook`, navigates to `story-builder`

---

### Step 2 — SleepSeedCore (stage: "generating")

**Triggered automatically.** When `builderChoices` is passed to SleepSeedCore, `doAutoGenerate()` fires in a useEffect (runs once via `hasAutoGenRef`).

#### What user sees:
- **Creature zone:** Large emoji with colored aura (amber → green when bonding answered → teal when ready)
- **Speech bubble:** Dynamic text:
  - Steps 0-1: `"Writing {heroName}'s story right now… ✦"`
  - Step 2: `"Painting the world now… ✦"`
  - Step 3: `"{heroName}'s story is almost ready… ✦"`
  - Ready: `"{heroName}'s story is ready ✦"`
- **Portal:** Miniature animated world (moon, clouds, grass, walking creature, title)
- **Bonding question** (optional, disappears after step 2): `"{creatureName} wants to know"` + question + textarea `"{heroName} said…"` — child can answer during generation
- **Progress steps:** 4-step checklist:
  1. Setting the scene…
  2. Writing the story…
  3. Painting illustrations…
  4. Book is ready!
- **Progress bar:** Percentage fill
- **Auto-advance:** When ready, `"Opening your story…"` text appears, then auto-transitions to reader

#### State flow:
- `stage` = `"generating"` → progress callbacks update `gen.stepIdx` (0-4) and `gen.progress` (0-100)
- On completion: `setBook(parsed)` → `setStage("reading")` → auto-advance to first page

---

### Step 3 — SleepSeedCore (stage: "reading")

Full book reader. Not part of this audit scope (it's the result, not the creation flow). But worth noting: the reader contains the **Night Card flow** (ncStep 0-4) which is the ritual's emotional payoff.

---

## 3. Anytime Story Path Flow Map

### Entry
BottomNav "Create" → `goStoryBuilder()` → clears preloadedBook + wizardChoices → `setView('story-wizard')`

### Step 1 — StoryCreator (entryMode="create")

**Same single-page scroll, but with different layout, colors, and a mode toggle**

#### 1a. Creature Zone (inline, compact)
- **Layout:** Row (not centered column). Creature emoji at 42px with teal glow, inline next to:
  - Heading: `"What kind of story tonight?"` (with "tonight?" in teal italic)
  - Sub: `"{creatureName} · ready to write"` in teal mono
- **No night badge.** No speech bubble.

#### 1b. Mode Toggle (create only)
- **Two buttons side by side:**
  - `"☀️ My Day"` — amber-highlighted when active
  - `"✨ Adventure"` — purple-highlighted when active
- Default: "My Day"
- **Switching modes clears all input state**

#### 1c. If mode = "My Day" (same inputs as Ritual, different theming)

All the same components as Ritual steps 1d-1f but with **teal** accent instead of amber:
- **Inspiration card:** Uses `CREATE_QUESTIONS` (10 different questions, more playful/creative)
- **Voice button:** `"Tap to answer out loud"` (not `"Tell {creature} out loud"`)
- **Textarea:** Teal-bordered
- **Divider:** `"— or type it —"` (not `"— or write it down —"`)

Everything else identical: occasion tag, cast, settings, all the same.

#### 1d. If mode = "Adventure" (entirely different input UI)

**World Grid:**
- **Label:** `"Where do we go tonight?"` (italic serif)
- **2x3 grid** of world cards (72px tall):
  - 🚀 Outer Space
  - 🌊 Deep Ocean
  - 🌲 Magic Forest
  - 🏰 Ancient Castle
  - 🌋 Volcano Island
  - ✏️ Somewhere else… (custom)
- **Selected state:** Purple background + border

**Custom world** (if "Somewhere else" selected):
- Shows `"← choose a world"` back button
- Purple-bordered textarea: `"A world where everything is tiny…"`

**Weird Detail** (appears after world selected):
- **Label:** `"One weird detail that has to be in the story"`
- **3 pre-written detail chips** per world (e.g., for Space: "The astronaut only speaks in rhymes", "There's a traffic jam between the planets", "The moon smells like dad's old car")
- **Divider:** `"— or make one up —"`
- **Purple textarea:** `"The spaceship smells like dad's old car…"`

Then: same cast section and collapsed settings as Ritual.

#### 1e. CTA (fixed bottom)
- **My Day mode:** `"Let's make a story! →"` / sub: `"{creatureName} is ready"` — **teal** gradient
- **Adventure mode:** `"🚀 Begin the adventure!"` / sub: `"{creatureName} is ready"` — **purple** gradient
- **Disabled when (My Day):** Input < 4 characters
- **Disabled when (Adventure):** No world selected AND detail < 4 characters

### Step 2 & 3 — Same as Ritual

Identical `SleepSeedCore` generation and reader. The only difference is in `doAutoGenerate()`:
- **Ritual path:** `storyContext` = user's input (brief), `storyBrief1` = empty
- **Anytime "My Day":** `storyBrief1` = user's input (brief or vibe action), `storyContext` = empty
- **Anytime "Adventure":** `storyBrief1` = `"Adventure in {worldLabel}. {adventureDetail}"`, `adventure` flag = true if style is "adventure"

---

## 4. Shared Screens and Branching Logic

### What is shared (identical components, different styling)

| Component | Ritual | Create (My Day) | Create (Adventure) |
|-----------|--------|------------------|--------------------|
| Inspiration card | ✅ RITUAL_QUESTIONS, amber | ✅ CREATE_QUESTIONS, teal | ❌ Not shown |
| Voice input | ✅ amber, "Tell {creature} out loud" | ✅ teal, "Tap to answer out loud" | ❌ Not shown |
| Text input | ✅ amber border | ✅ teal border | ❌ Replaced by world grid |
| Occasion tag | ✅ | ✅ | ❌ Not shown |
| Cast section | ✅ | ✅ | ✅ |
| Settings collapse | ✅ | ✅ | ✅ |
| CTA bar | ✅ amber | ✅ teal | ✅ purple |
| World grid | ❌ | ❌ | ✅ |
| Detail chips | ❌ | ❌ | ✅ |

### Where they diverge

| Aspect | Ritual | Create |
|--------|--------|--------|
| `entryMode` prop | `'ritual'` | `'create'` |
| `isRitual` variable | `true` | `false` |
| CSS class on root | `.sc.ritual` (amber radial gradient bg) | `.sc.create` (teal radial gradient bg) |
| Night badge | Shown | Hidden |
| Creature zone layout | Centered column, 72px, amber glow | Inline row, 42px, teal glow |
| Speech bubble | Shown (dynamic creature dialogue) | Hidden |
| Mode toggle | Hidden | Shown ("My Day" / "Adventure") |
| Star field count | 55 stars | 40 stars |
| Star twinkle speed | 2.8–6.8s | 1.8–4.3s |
| Question bank | RITUAL_QUESTIONS (reflective, parent-focused) | CREATE_QUESTIONS (playful, child-focused) |
| Voice button text | `"Tell {creature} out loud"` | `"Tap to answer out loud"` |
| Divider text | `"or write it down"` | `"or type it"` |
| CTA text | `"✦ Write tonight's story"` | `"Let's make a story! →"` or `"🚀 Begin the adventure!"` |
| CTA sub | `"{creature} has been waiting"` | `"{creature} is ready"` |

### Where user can back out

- **Nav close button (✕):** Top right, calls `onBack()` → returns to dashboard. Available on both paths.
- **No intermediate back buttons.** It's a single scroll page, not steps.
- **During generation:** Browser beforeunload warning + popstate interception with confirm dialog.

### State storage/passing

1. **StoryCreator** builds a `BuilderChoices` object in `handleGenerate()`
2. **App.tsx** receives it via `onGenerate(choices)`, stores in `wizardChoices` state, clears `preloadedBook`, navigates to `story-builder`
3. **SleepSeedCore** receives `builderChoices` prop, auto-fires `doAutoGenerate()` which maps choices to `generate()` params
4. No localStorage persistence of wizard state — if you leave, it's gone

---

## 5. Current Question/Config System

### RITUAL_QUESTIONS (10 reflective, parent-focused prompts)
```
1. "Was there a moment today you wanted to hold onto?"
2. "Did something happen today that's still sitting with you?"
3. "Was anyone kind to them today — or unkind?"
4. "What do you wish you'd said — or done differently today?"
5. "Was there a quiet moment today that mattered more than it looked?"
6. "What did they say today that you don't want to forget?"
7. "Was there something heavy they carried home today?"
8. "What made them laugh today — really laugh?"
9. "Was there a moment today where you saw who they're becoming?"
10. "Did anything surprise you about them today?"
```

### CREATE_QUESTIONS (10 playful, child-focused prompts)
```
1. "What's something weird your child said this week?"
2. "If they could go anywhere impossible tonight, where?"
3. "What's a rule at home that would be funny if it were a law?"
4. "Name something your child is inexplicably obsessed with right now."
5. "What's the silliest thing that actually happened this week?"
6. "If your child had a superpower they don't know about, what is it?"
7. "What would they do if they woke up and everything was slightly wrong?"
8. "What's something they're convinced is true that definitely isn't?"
9. "What would their creature companion say about them right now?"
10. "What's the most dramatic thing that happened this week?"
```

### OCCASION_OPTIONS (8)
```
🎂 Birthday | 😔 Hard day | 🌟 Big win | 🏫 First day
❤️ Missing someone | 🏠 New home | 🏥 Feeling sick | 👏 Proud moment
```

### WORLDS (6) — Adventure mode only
```
🚀 Outer Space | 🌊 Deep Ocean | 🌲 Magic Forest
🏰 Ancient Castle | 🌋 Volcano Island | ✏️ Somewhere else…
```

### WORLD_DETAILS (3 pre-written chips per world)
```
Space:   "The astronaut only speaks in rhymes" / "There's a traffic jam between the planets" / "The moon smells like dad's old car"
Ocean:   "The fish are running a very formal meeting" / "The treasure chest is full of lost socks" / "A crab has been waiting here for 200 years"
Forest:  "The trees have been arguing for 100 years" / "One mushroom knows everything" / "Something got lost here and it's still looking"
Castle:  "The dragon collects spoons, not gold" / "The knight is terrified of butterflies" / "The princess has been awake for 3 days"
Volcano: "The lava is actually strawberry jam" / "A flamingo lives at the top" / "Someone left a shoe here 10 years ago"
Custom:  "Something is not where it should be" / "One character knows a secret" / "Things keep going slightly wrong"
```

### VIBE_OPTIONS (5)
```
warm-funny → "Funny"
calm-cosy  → "Cosy" (default)
exciting   → "Exciting"
heartfelt  → "Heartfelt"
mysterious → "Mysterious"
```

### STYLE_OPTIONS (4)
```
standard  → "Story" (default)
rhyming   → "Rhyming"
adventure → "Adventure"
mystery   → "Mystery"
```

### LENGTH_OPTIONS (3)
```
short    → "Short (~3min)"
standard → "Standard (~5min)" (default)
long     → "Long (~8min)"
```

### AGE_OPTIONS (4)
```
age3  → "3–5"
age5  → "6–8" (default, auto-set from character profile)
age7  → "9–11"
age10 → "11+"
```

### VIBE_BRIEF (fallback brief text when user gives no input)
```
warm-funny  → "about to go on a warm and funny adventure full of laughs"
calm-cosy   → "about to discover something magical and cosy"
exciting    → "about to go on a completely made-up adventure"
heartfelt   → "on a journey that fills the heart"
silly       → "on a silly quest with friends"
mysterious  → "about to discover something magical and mysterious"
```

### inferVibe() — auto-detects vibe from user text
```
funny/laugh/silly/joke/weird/giggl → warm-funny
sad/miss/cry/hard/scared/worry/afraid → heartfelt
adventure/explore/brave/fight/battle/quest → exciting
quiet/sleep/calm/cosy/cozy/night/gentle/soft → calm-cosy
mystery/secret/strange/lost/hidden/clue → mysterious
fallback → calm-cosy
```

---

## 6. UX Strengths

### What is already strong — preserve these

**1. The creature as narrator/companion.** The creature drives the emotional layer. In Ritual mode, the speech bubble creates a conversational feeling ("What happened today worth putting in a story?"). The creature's name in the CTA sub-text ("Luna has been waiting") creates gentle urgency. This is the product's soul.

**2. The inspiration questions are excellent.** Both sets are specific, evocative, and avoid generic prompts. RITUAL_QUESTIONS hit real emotional moments parents experience. CREATE_QUESTIONS are weird and playful in the right way. The tap-to-use + shuffle mechanic is intuitive.

**3. The world detail chips in Adventure mode.** "The dragon collects spoons, not gold" is genuinely delightful. These pre-written specifics match the prompt system's emphasis on specificity. They lower the creative barrier while maintaining quality.

**4. Vibe auto-inference from text.** Smart. The parent doesn't need to manually pick "heartfelt" — the system detects "sad" or "miss" in their input and adjusts. Falls back gracefully. Manual override available but not forced.

**5. The generation screen is not dead time.** The bonding question during generation ("Luna wants to know…") turns waiting into engagement. The portal animation creates anticipation. The creature aura color-shifts as you answer. This is one of the best parts of the product.

**6. Settings are collapsed by default.** Length/feel/style/age are present but hidden. Defaults are smart (age from profile, vibe auto-inferred). Badge summary shows non-default settings without opening the panel. Power users can customize; everyone else never sees it.

**7. The single-page scroll eliminates step fatigue.** No "next/next/next" wizard. The conditional reveal (inspiration disappears after input, occasion appears after input) creates a natural progression without explicit steps.

**8. Voice input as first-class citizen.** Parents holding a sleepy child can speak instead of type. The transcript card with edit option handles the common case of imperfect speech recognition.

---

## 7. UX Weaknesses / Friction

### What feels too much like a form

**1. The Cast section is always visible and rarely useful.** Most parents have one child. The cast row with hero pill + creature pill + other characters is present every time, even when there are no other characters to select. It looks like a form field requiring attention. For single-child families (the majority), this is noise.

**2. The Settings panel, when opened, is a classic form.** Four rows of pills labeled "Length / Feel / Style / Age" — this is a settings page, not a story creation ritual. The collapsed state is well-designed, but opening it breaks immersion entirely.

**3. Occasion tagging interrupts the flow.** After the parent finishes their emotional input, they're immediately asked to categorize it ("Tag this story"). This is product taxonomy thinking, not user thinking. The parent just poured out a feeling; now they're being asked to label it.

### What is confusing or redundant

**4. Ritual vs. Anytime are nearly identical.** The "My Day" sub-mode of Create is functionally identical to Ritual — same input type (text about today), same generation pipeline, same reader. The only differences are: color theme, question bank, creature layout, and bubble presence. A parent switching between them gets a different aesthetic but the same experience. The product has three paths (Ritual, Create/My Day, Create/Adventure) but presents it as two (Ritual, Create) with a hidden sub-toggle.

**5. Multiple entry points to the same experience create confusion.** The dashboard has "Start tonight's story" (→ Ritual) AND "One story tonight" (→ Anytime). The BottomNav has "Create" (→ Anytime). StoryLibrary has "Create" (→ Ritual). There's no clear mental model for when to use which.

**6. "My Day" mode in Create duplicates Ritual's purpose.** Both ask "what happened today?" Both use the same generation pipeline with `storyContext` vs `storyBrief1` as the only difference. The user can't tell why these are separate.

**7. The Adventure mode is buried.** It's the most distinctive and demo-friendly feature — world selection, weird detail chips — but it's hidden behind: BottomNav → Create → Adventure toggle. A first-time user who taps "Create" sees "My Day" (which looks like Ritual) and might never discover Adventure.

### What likely hurts demo quality

**8. No transition between StoryCreator and SleepSeedCore.** The parent taps the CTA, the entire screen is replaced by the generation screen. There's no visual handoff. The creature was in StoryCreator; now a different creature rendering appears in SleepSeedCore. The context switch is jarring.

**9. The generation screen has too many elements.** Creature zone + speech bubble + portal + bonding question + 4-step checklist + progress bar — all visible simultaneously on a ~400px card. On mobile, this is dense. The bonding question competes with the progress steps for attention.

**10. Loading time with no skip option.** Generation takes 15-30 seconds. The user must wait. The bonding question helps, but once answered (or if they don't want to answer), there's nothing to do but watch the progress bar. No "Skip to story when ready" option.

**11. The creature renders differently in StoryCreator vs SleepSeedCore.** StoryCreator shows the emoji with CSS glow animations. SleepSeedCore shows the emoji with a different aura system, different sizing, different naming style. It doesn't feel like the same entity across screens.

**12. No preview or confirmation before generation.** The parent enters their seed, taps the CTA, and generation starts immediately. There's no "Here's what I'll make" confirmation. If they forgot to change the age or accidentally left the wrong character selected, they have to wait through the full generation to find out.

---

## 8. What Design Input Is Still Needed Before Redesign

### Required
- **Mobile screenshots of both paths** (iPhone SE and iPhone 14 Pro widths). The audit reveals dense conditional UI that may render differently at viewport extremes. Inspect at 375px and 430px.
- **Actual generation timing data.** The generation quality gates (Claude call + quality check + potential regeneration) can take 1-3 API calls. Measure real p50/p90 times to know if the loading screen needs redesign.

### Useful but not blocking
- **Analytics on path usage split.** What percentage of sessions use Ritual vs Create? Within Create, My Day vs Adventure? This determines whether the two-path model is even serving users or just adding confusion.
- **Heatmap or session recordings** of the StoryCreator scroll. Does anyone open Settings? Does anyone use the occasion tag? Does anyone discover Adventure mode?
- **The actual `BuilderChoices` payloads** sent to generation for 20-30 real sessions. Shows what fields users actually fill vs what stays at defaults.

### Not needed
- Component tree diagrams — the routing is simple (`App.tsx` → `StoryCreator` → `SleepSeedCore`, no nested routing)
- API request/response shapes — the prompt assembly in `sleepseed-prompts.js` and the `generate()` function in SleepSeedCore are self-contained
- State management diagrams — it's one Context + local state, no complex store

---

## Summary: The Core Product Question

The current system has **three** creation experiences wearing **two** labels:

1. **Ritual** — "What happened today?" → story (amber, emotional, creature-narrated)
2. **Create / My Day** — "What happened today?" → story (teal, slightly different questions, no creature bubble)
3. **Create / Adventure** — "Pick a world + weird detail" → story (purple, completely different input model)

Paths 1 and 2 are nearly identical in function. Path 3 is genuinely different but is the hardest to find. The redesign should decide: **Is the distinction between Ritual and Anytime meaningful enough to justify two entry points?** Or should there be one entry with the mode toggle (today / adventure) upfront and the emotional/tonal framing applied contextually (time of day, streak state, creature relationship)?
