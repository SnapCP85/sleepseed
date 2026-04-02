# SleepSeed Story Generator — Full System Audit

**Generated:** 2026-03-31 | **Source files:** `sleepseed-prompts.js` (1840 lines), `SleepSeedCore.tsx` (generate function lines 2630-2948)

---

## 1. Active Prompts

There are **two completely separate generation systems** in the codebase, each with its own prompt architecture:

### System A: Standalone Story (nightly ritual + anytime story)

Used by `SleepSeedCore.tsx` via `buildStoryPrompt()`. Single Claude call producing one complete story.

**Prompt layers (in order of injection):**

1. **MASTER_SYSTEM_PROMPT** (~190 lines) — invariant craft rules
2. **GENRE_ARCS[genre]** (~50-70 lines per genre) — structural arc for the specific genre
3. **User prompt** — assembled from the brief: situation, protagonist, supporting character, setting, story shape, output format

**System prompt (exact structure):**
```
[MASTER_SYSTEM_PROMPT]
[blank line]
[GENRE_ARCS[genre]]
```

**User prompt (exact structure):**
```
Write a SleepSeed {genre} bedtime story using the arc structure and voice rules above.

SITUATION: {situation text}

PROTAGONIST:
  Name: {name}
  Age: {age}
  One weird detail (theirs alone): {weirdDetail}
  What they want (concrete, specific): {want}
  Their flaw (flip side of a virtue): {flaw}

SUPPORTING CHARACTER:
  Name / relationship: {name}
  The one thing only they would say or do: {detail}

SETTING (make it specific — the reader should smell it):
  Place: {setting}
  Sensory anchor: {anchor}
  Time of day: {time}

STORY SHAPE:
  Planted detail to establish early and pay off at the end: {detail}
  Target feeling for the final line: {feeling}
  Final line approach: {approach}

Return the story as flowing prose — no JSON, no headers, no labels.
Begin with the title on its own line, then a blank line, then the story.
{wordCount} words, ±10%.
```

**However**, SleepSeedCore then **appends additional sections** to the user prompt before sending:
```
[output from buildStoryPrompt().user]

━━━ READER AGE ━━━
[AGE-SPECIFIC RULES — 30-50 lines of detailed age-appropriate writing instructions]

━━━ CHARACTERS ━━━
[All characters with type labels, classify voices, visual descriptions, notes]

━━━ SETTING, OCCASION, AND CONTEXT ━━━
[World setting text OR AI-picks-from-8-settings instruction]
[Story premise / tone / context / guidance / occasion / lessons / mood / pace / style / traits]

[Adventure format OR exact page count instruction]

━━━ OUTPUT ━━━
Return ONLY this exact JSON object...
{"title":"...","cover_prompt":"...","pages":[{"text":"...","illustration_prompt":"..."}...],"refrain":"..."}
```

**Important: The final prompt OVERRIDES the output format** from `buildStoryPrompt()`. The prompts module says "Return flowing prose" but SleepSeedCore appends "Return ONLY this exact JSON object" — the JSON instruction wins because it's last.

### System B: Journey Chapter (7-night serialized book)

Used by the server-side API route `api/story-journeys/[id]/read.js` via `buildJourneyChapterPrompt()`. Each night generates one chapter.

**Prompt layers:**
1. **CRAFT_CORE** (~230 lines) — revised version of master craft rules + age rules + creature integration + genre arcs (condensed) + sleep landing + banned phrases/structures
2. **JOURNEY_ORCHESTRATOR** (~50 lines) — serial mode rules, read-specific rules, continuity rules, memory injection limits
3. **Genre arc injection** (~5-8 lines per genre, condensed)
4. **Read-specific rule** (~2-3 lines, varies by read number 1-7)
5. **Output format** — structured JSON schema for chapter pages + metadata

**User prompt includes:**
- Child profile (name, age, pronouns, personality, parent's secret, current situation)
- Creature (name, virtue, story personality, tonight's lesson beat)
- Story journey (working title, core world, core premise, emotional goal, weekly problem, ending target, tonight's chapter goal, planted details, recurring images, unresolved threads)
- Prior chapter summaries
- Memory bank (6 categories: favorite objects, recurring places, recurring phrases, emotional milestones, relationship moments, sensory images)
- Tonight's inputs (emotional need, primary genre, today memory, specific detail, occasion, cast, length)

### Supporting Prompts (both systems)

| Prompt | Function | Purpose |
|--------|----------|---------|
| `buildQualityCheckPrompt()` | System A | 12-point quality check with 4 structural auto-fails |
| `buildRegenerationPrompt()` | System A | Surgical fix for failed quality checks |
| `buildTitlePrompt()` | System A | Generates 3 title options |
| `buildPersonalisationPrompt()` | Library | Personalizes existing story for a specific child |
| `buildStoryBiblePrompt()` | System B | Generates the 7-night story architecture |
| `buildStoryBibleQualityCheck()` | System B | 8-criterion quality check for story bibles |
| `buildJourneyChapterQualityCheck()` | System B | 15-criterion quality check for chapters |
| `buildBookStitchPrompt()` | System B | Stitches 7 chapters into one complete book |

---

## 2. Generator Rules

### Hard Rules (auto-fail if violated)

**Structural auto-fails (System A quality check):**
1. Protagonist must solve their own problem using their own qualities — no adult rescue, no luck, no coincidence
2. Ending emotional weight must match what came before — not happier than earned
3. Story must follow the genre structural arc with proper stage proportions
4. Final 10-15% must slow the prose (shorter sentences, tactile/auditory sensory shift, breathing rhythm)

**Banned phrases (12+):**
```
"with a heart full of hope"
"suddenly realised" / "suddenly understood" / "suddenly knew"
"learned a very important lesson" / "learned that day"
"with a big smile on her/his face"
"deep down, she/he knew"
"it was the best day of her/his life"
"she/he felt a warm glow"
"the most important thing"
"and so she/he learned"
"as if by magic" (unless specific established magic)
"more than anything in the world"
"her/his heart soared" / "her/his heart sank"
"they lived happily ever after" (unless ironic)
"everything was going to be okay" (as closing beat)
"she/he couldn't help but smile"
"magical adventure"
"she/he took a deep breath" (except invisible belly-breathing in therapeutic)
```

**Banned structures (8):**
1. Adult arrives and solves it
2. Lesson named at end
3. World has no rules
4. Ending happier than earned
5. Supporting characters exist only to be kind
6. Protagonist is passive
7. Creature explains what the story means
8. Problem disappears without cost or change

### Age targeting rules

| Age Band | Sentence Length | Vocabulary | Page Count | Structure Model |
|----------|----------------|------------|------------|-----------------|
| 3-4 | 3-5 words max | Simplest toddler words | 8-10 max | Eric Carle, Mem Fox. ONE repeated pattern. 1-2 sentences per page. |
| 5-6 | 6-10 words | Simple + 1-2 fun new words | 8-12 | Julia Donaldson, Mo Willems. Rule of Three. Dialogue every page. |
| 7-8 | 8-14 words | 1 interesting word per page | 8-16 | Roald Dahl, Arnold Lobel. Plant and payoff. Running joke. |
| 9-10 | 10-20 words | Rich vocabulary | 8-16 | Roald Dahl, A.A. Milne, E.B. White. Revelation ending. Secondary character arc. |

Each age band has detailed rules for: dialogue register, weird detail type, comedy style, and echo/refrain pattern.

### Sleep landing (non-negotiable, every story)

- Final 10-15% of story
- Sentence length halves from middle register
- Paragraph breaks increase
- Sensory shift: visual fades, tactile and auditory rise
- Long vowels: moon, alone, low, warm, slow, home
- Soft consonants: l, m, n, w
- No hard consonants (k, t, p) in the landing
- "Whisper the last three sentences. If wrong whispered, they are wrong."

### Read-aloud phonetics

- No consecutive stressed syllables
- End sleep-approach paragraphs on soft consonants
- No sibilant clusters in quiet passages
- Hard consonants in action, soft consonants in landing

### Creature integration rules (System B)

> "The creature acts. It never explains. Its virtue lives in behavior."

19 virtue-to-behavior mappings defined. Examples:
- Courage: "Hesitates. Goes anyway. Still shaking. Never announces it."
- Kindness: "Notices what nobody else noticed. Acts first. Takes no credit."
- Wisdom: "Asks one question that changes the direction of everything."

### Length configuration

| Setting | Page Count | Adventure Setup | Adventure Resolution | Reading Time |
|---------|------------|-----------------|---------------------|--------------|
| Short | 8 | 4 | 3 | ~3 min |
| Standard | 12 | 6 | 5 | ~5 min |
| Long | 16 | 8 | 7 | ~8 min |

### Word count defaults (System A, by genre × age)

| Genre | Age 3-4 | Age 5-6 | Age 7-8 | Age 9+ |
|-------|---------|---------|---------|--------|
| Comedy | 450 | 650 | 900 | 1100 |
| Adventure | 500 | 750 | 1100 | 1400 |
| Wonder | 400 | 600 | 900 | 1100 |
| Cosy | 450 | 600 | 800 | 1000 |
| Therapeutic | 500 | 700 | 1000 | 1200 |
| Mystery | 500 | 750 | 1100 | 1400 |

---

## 3. Input Map

### Inputs from StoryCreator wizard → SleepSeedCore → Claude

| Input | Variable | Source | Required? | Effect Strength |
|-------|----------|--------|-----------|-----------------|
| **Child's name** | `heroName` | Character profile → AppContext | Yes (falls back to "friend") | **Critical** — protagonist name throughout |
| **Child's age** | `ageGroup` / `level` | Character profile or manual selection | Yes (defaults to "age5") | **Critical** — controls vocabulary, structure, page count, dialogue register |
| **Child's pronouns** | `heroGender` | Character profile | Optional | **Moderate** — pronoun consistency |
| **Parent's seed text** | `brief` / `transcript` | StoryCreator textarea or voice | Optional (falls back to vibe description) | **High** — becomes the `situation` or `storyBrief1` depending on path |
| **Vibe / mood** | `vibe` | Auto-inferred from text or manually selected | Yes (defaults to "calm-cosy") | **High** — determines genre selection (comedy/adventure/cosy/therapeutic/wonder) |
| **Style** | `style` | StoryCreator settings | Optional (defaults to "standard") | **Moderate** — rhyming overrides prose style entirely; mystery changes structure |
| **Length** | `length` | StoryCreator settings | Optional (defaults to "standard") | **Moderate** — controls page count (8/12/16) |
| **Occasion** | `occasionTag` | StoryCreator occasion pills | Optional | **Low-moderate** — injected as "SPECIAL OCCASION" line |
| **World/setting** | `worldChoice` + `customWorld` | StoryCreator adventure mode | Optional | **High when present** — defines the story world; if absent, AI picks from 8 preset settings |
| **Weird detail** | `adventureDetail` | StoryCreator adventure mode detail chips/textarea | Optional | **Moderate** — injected into situation context |
| **Cast characters** | `selectedCast` | StoryCreator cast pills | Optional | **Moderate** — each character gets type label, personality voice, visual description, and story notes |
| **Creature companion** | `companionCreature` | AppContext | Optional | **Moderate** — added as a cast member with name, dream context |
| **Personality tags** | `heroTraits` | Character profile | Optional | **Moderate** — injected as "HERO PERSONALITY" |
| **Character weird detail** | `weirdDetail` from character | Character profile | Optional | **Moderate** — becomes protagonist's "weird specific detail" |
| **Character situation** | `currentSituation` from character | Character profile | Optional | **Low** — injected as additional context |
| **Bonding answer** | `ncBondingA` | Answered during generation loading screen | Optional | **Low for story** (used in Night Card, not story generation) |

### Inputs for Journey chapters (System B)

All of the above, plus:

| Input | Source | Required? | Effect |
|-------|--------|-----------|--------|
| **Emotional need** | NightlyCheckIn (7 options) | Yes (defaults to "calm") | **High** — maps to primary genre |
| **Today's memory** | NightlyCheckIn textarea | Optional | **High** — injected as "What happened today" |
| **Specific detail** | NightlyCheckIn textarea | Optional | **Moderate** — "Specific detail to include" |
| **Story Bible** | Generated on journey start | Yes | **Critical** — core world, premise, emotional goal, planted details, recurring images, night arc |
| **Memory bank** | Accumulated from prior chapters | Auto | **High** — 6 categories of callbacks and echoes |
| **Prior chapter summaries** | Accumulated | Auto | **Moderate** — continuity context |
| **Unresolved/resolved threads** | Accumulated | Auto | **Moderate** — narrative continuity |
| **Lesson beat** | From creature definition, indexed by read number | Auto | **Moderate** — creature's virtue expression for tonight |
| **Read-specific rule** | Hardcoded per read 1-7 | Auto | **High** — defines this chapter's narrative purpose |

### Hidden/inferred inputs

| Input | How inferred | Effect |
|-------|-------------|--------|
| **Genre** | Mapped from vibe via `moodGenreMap` (silly→comedy, exciting→adventure, heartfelt→therapeutic, calm→cosy, mysterious→wonder) | Determines entire structural arc |
| **Setting** | If user provides no world, AI selects from 8 preset settings (Bedroom, Backyard, Road Trip, School, Supermarket, Grandma's House, Park, Kitchen) | Defines the story world |
| **Temperature** | `getTemperature(genre, style)`: rhyming=0.9, therapeutic=0.75, wonder=0.9, default=0.85 | Controls generation randomness |
| **Word count** | `defaultWordCount(genre, age)` — matrix of genre × age | Target story length |
| **Character voices** | 30+ `classifyVoice` entries mapping character types to personality descriptions (mother, father, wizard, cat, dragon, etc.) | Each character gets a behavioral description |

---

## 4. Output Map

### System A: Standalone Story Output

**JSON structure returned by Claude:**
```json
{
  "title": "3-6 word title",
  "cover_prompt": "15-20 words: wide magical bedtime scene",
  "pages": [
    {"text": "page text", "illustration_prompt": "15-20 words: scene description"}
  ],
  "refrain": "4-8 word refrain from the story"
}
```

**Adventure variant:**
```json
{
  "title": "...",
  "cover_prompt": "...",
  "setup_pages": [{"text":"...", "illustration_prompt":"..."}],
  "choice": {
    "question": "exciting choice question",
    "option_a_label": "4-7 words",
    "option_b_label": "4-7 words"
  },
  "path_a": [{"text":"...", "illustration_prompt":"..."}],
  "path_b": [{"text":"...", "illustration_prompt":"..."}],
  "refrain": "..."
}
```

Note: `illustration_prompt` is generated but **never used for actual image generation** — SVG scenes from `storyScenes.tsx` provide all illustrations.

### System B: Journey Chapter Output

```json
{
  "book_title": "",
  "chapter_title": "",
  "read_number": 1,
  "total_reads": 7,
  "cover_page": {"text": "", "illustration_prompt": ""},
  "recap_page": {"text": "", "illustration_prompt": ""},  // reads 2-7 only
  "chapter_opener_page": {
    "title": "",
    "cast": [{"name": "", "role_line": ""}],
    "teaser": "",
    "illustration_prompt": ""
  },
  "story_pages": [{"text": "", "illustration_prompt": ""}],
  "refrain": "",
  "metadata": {
    "chapter_summary": "",
    "memory_beats": [],
    "unresolved_threads": [],
    "resolved_threads": [],
    "characters_used": [],
    "callbacks_used": [],
    "new_planted_details": []
  }
}
```

### Night Card Output (separate generation)

Generated in SleepSeedCore after story reading, not part of story generation:
```json
{
  "headline": "3-6 words capturing tonight's feeling",
  "quote": "best line from story refrain, 8-15 words",
  "memory_line": "one warm sentence weaving child's real words, under 20 words",
  "reflection": "whispered bedtime question, under 12 words",
  "emoji": "one emoji"
}
```

---

## 5. Mode Differences

### Mode 1: Ritual Story

**Entry:** Dashboard → "Start tonight's story" → StoryCreator(entryMode="ritual")

**How prompt differs:**
- `storyContext` = user's seed text (parent's note about today)
- `storyBrief1` = empty
- The seed goes into "ADDITIONAL CONTEXT" section of the prompt
- Creature speech bubble and amber theming create emotional framing, but **the actual prompt sent to Claude is identical** to the My Day path — same `buildStoryPrompt()` call
- Vibe defaults to `calm-cosy` (auto-inferred from text)

### Mode 2: Anytime Story — My Day

**Entry:** BottomNav "Create" → StoryCreator(entryMode="create") → mode="today"

**How prompt differs:**
- `storyBrief1` = user's seed text (becomes "TONIGHT'S STORY PREMISE" — highest priority)
- `storyContext` = empty
- The seed goes into "TONIGHT'S STORY PREMISE" which is labeled "highest priority — this defines what the story is fundamentally about"
- Uses `CREATE_QUESTIONS` instead of `RITUAL_QUESTIONS` for inspiration
- **Functionally identical prompt structure** to Ritual — same `buildStoryPrompt()`, same JSON output schema

### Mode 3: Anytime Story — Adventure

**Entry:** BottomNav "Create" → StoryCreator(entryMode="create") → mode="adventure"

**How prompt differs:**
- `storyBrief1` = `"Adventure in {worldLabel}. {adventureDetail}"`
- `adventure` flag may be set (adds choose-your-adventure format with branching paths)
- World detail from chips/textarea injected into the brief
- When adventure format is active: output schema changes to `setup_pages` + `choice` + `path_a` + `path_b`
- Rhyming style is auto-disabled for adventure format

### Mode 4: Journey Chapter

**Entry:** Dashboard → journey flow → NightlyCheckIn → API route

**Completely separate prompt system:**
- Uses `CRAFT_CORE` + `JOURNEY_ORCHESTRATOR` instead of `MASTER_SYSTEM_PROMPT`
- Genre determined by `mapEmotionalGoalToGenre()` from emotional need selection
- Includes full story bible context, memory bank, prior chapter summaries
- Read-specific rules vary by night (1-7)
- Output includes metadata for continuity tracking
- Quality check has 15 criteria (vs 12 for standalone)

### Mode 5: Onboarding Story

**Entry:** OnboardingFlow → first story generation

**Uses the same System A path** as ritual/anytime — same `buildStoryPrompt()` via SleepSeedCore with `builderChoices` from the onboarding wizard. The onboarding just pre-fills the choices.

### Legacy/Unused

- `generateStory()` convenience pipeline in `sleepseed-prompts.js` — a clean async function that chains generate → quality check → revise. **Never called** by any production code. SleepSeedCore implements its own generation pipeline directly.
- `buildPersonalisationPrompt()` — exists but **never called** in any production code.
- `styleDna` parameter — accepted by `buildStoryPrompt()` but explicitly disabled: `const dnaSection = null;` with comment "Style DNA removed — genre defaults are now strong enough standalone."

---

## 6. Strengths — What the Generator Is Optimized For

### Emotional warmth through specificity
The core prompt philosophy is "specificity is everything." The banned phrases list eliminates generic emotional language. The examples teach by negation: NOT "she was happy" → "she made the noise she made when she found a really good stick." This produces stories that feel written for a specific child.

### Read-aloud quality
Extensive phonetic rules (soft consonants in landing, no sibilant clusters, whisper test) mean the stories are optimized for a parent's voice at bedtime. This is rare in AI story generators.

### Sleep landing
The mandatory sleep landing with specific prose mechanics (halving sentence length, sensory shift, breathing rhythm matching) is a genuine differentiator. Every story is designed to put a child to sleep.

### Genre craft
Six fully developed genre arcs (comedy, adventure, wonder, cosy, therapeutic, mystery) with specific structural percentages, voice rules, and style defaults. The therapeutic arc is particularly strong — mirror → validate → move → rest with embedded coping tools that are shown, never named.

### Age-appropriate writing
Four age bands with detailed, opinionated rules about vocabulary, dialogue register, comedy style, weird detail type, and echo pattern. The age 3-4 rules are genuinely different from 9-10 — not just "use simpler words."

### Creature virtue system
The creature integration rules map 19 virtues to specific behavioral instructions. "Courage: Hesitates. Goes anyway. Still shaking. Never announces it." This prevents didactic creature usage.

### 7-night continuity (System B)
The journey system with story bible, memory bank, thread tracking, and read-specific rules produces genuinely serialized storytelling with callbacks, planted details, and progressive revelation.

### Quality gating
Both systems include quality check prompts with structural auto-fails and craft criteria. Structural failures trigger full regeneration; craft failures trigger surgical fixes.

---

## 7. Limitations / Constraints

### Two divergent prompt systems
System A (standalone) and System B (journey) have **separate but overlapping craft rules**. `MASTER_SYSTEM_PROMPT` and `CRAFT_CORE` cover similar ground with different wording and organization. Changes to writing rules must be made in both places.

### Prompt is extremely long
The final prompt sent to Claude for a standalone story includes: MASTER_SYSTEM_PROMPT (~190 lines) + GENRE_ARC (~60 lines) + user brief + age rules (~30-50 lines) + characters + settings + context + JSON schema = **easily 400-600 lines of instruction**. This approaches effective limits for reliable instruction following.

### Real-life inputs are not strongly preserved
The parent's seed text enters as "ADDITIONAL CONTEXT (incorporate naturally)" or "TONIGHT'S STORY PREMISE" but there's no rule ensuring the specific real-life detail appears verbatim in the story. The prompt says "incorporate naturally" which gives the model latitude to abstract away the specifics. A parent who writes "we found a really fat frog under the plant pot" may get a story about nature exploration rather than specifically about the frog.

### Multiple characters are weakly handled
Each extra character gets a personality voice description, but there's no structural rule about how many characters get meaningful roles. With 4-5 cast members, characters risk becoming "furniture" (exactly what the banned structures prohibit). The prompt doesn't scale its structural expectations based on cast size.

### No memory across standalone stories
System A has no continuity between sessions. Each story is generated from scratch. A child who got a story about their classroom yesterday gets no callbacks tonight. Only System B (journeys) has memory.

### `illustration_prompt` is wasted tokens
Every page generates a 15-20 word illustration prompt that is **never used** — SVG scenes provide illustrations instead. This is ~200 tokens per story spent on unused output.

### Setting selection is binary
Either the user provides a world (adventure mode) or the AI picks from 8 hardcoded real-world settings (bedroom, backyard, road trip, etc.). There's no middle ground for "use this setting but make it magical" or custom settings for standalone stories.

### Word count vs page count conflict
`buildStoryPrompt()` requests a word count ("650 words, ±10%") but SleepSeedCore appends "Write EXACTLY 12 pages" — these can conflict. The page count instruction wins but the word count instruction is still in the prompt, potentially confusing the model.

### Vibe-to-genre mapping is lossy
The mapping from mood to genre (`silly→comedy`, `heartfelt→therapeutic`, `mysterious→wonder`) means the full genre arc is selected from a single adjective. A "heartfelt" story always gets the therapeutic arc (mirror → validate → move → rest) even if the user just meant "warm and emotional" rather than "address a difficult feeling."

### No refrain control
The refrain is generated by the model with minimal guidance ("4-8 word refrain from the story"). Parents can't influence what becomes the recurring phrase. For Night Cards, the refrain becomes the card's quote — so a weak refrain produces a weak card.

### Token limit for stories
Stories are generated with `max_tokens: 4096`. For longer stories (16 pages at age 9-10), this may be tight, especially with the JSON overhead of page objects and illustration prompts.

---

## 8. Product Implications

### What the generator naturally supports well

- **"Tell me about your day" → story** — the ritual flow maps cleanly to the prompt's situation field
- **Single-child stories** — the protagonist system is optimized for one hero
- **Emotional matching** — vibe inference + genre mapping produces stories that match the mood the parent describes
- **Bedtime as the goal** — sleep landing is deeply embedded, not an afterthought
- **Creature as companion** — creature integration rules prevent the creature from becoming didactic
- **Age-appropriate content** — the 4 age bands produce genuinely different stories

### What product ideas conflict with the current generator

- **"Who is in the story" picker with real friend names** — the generator has a `classifyVoice` system for types (mother, wizard, dog) but no system for "this is my child's friend Sarah who is very bossy." Friend names would need personality descriptions to avoid becoming furniture characters.

- **World spirits** — no concept exists in the current prompt. A new character type would need behavioral rules like the creature virtue system.

- **Stronger memory capture** — System A has zero cross-session memory. Adding "remember the frog from last time" would require either: (a) injecting prior story context into the prompt (increases length), or (b) switching all standalone stories to System B's memory bank approach.

- **Remix/share landing pages** — the generator produces structured JSON (pages with text + illustration prompts) but the illustration prompts are unused. For shareable visual stories, either the prompts need to generate real image-generation-ready descriptions, or the SVG scene system needs to produce shareable visuals.

- **Night Card linkage to story** — currently the Night Card prompt receives the refrain and title but the connection is thin. If we want the card to reference a specific story moment (not just the refrain), the story generation would need to flag "the moment worth remembering" as an output field.

### What would need prompt changes

| Feature | Prompt Change Needed |
|---------|---------------------|
| Real friends in stories | Add friend personality description system to character injection. Add structural rules scaling cast expectations by cast size. |
| World spirits | New character type with behavioral rules (like creature virtue system). Injected into CHARACTERS section. |
| Stronger real-life input preservation | Change "incorporate naturally" to "the following detail must appear recognizably in the story: {detail}" |
| Cross-session memory (standalone) | Add PRIOR STORY CONTEXT section to user prompt with summary of last 1-3 stories. Risk: prompt length. |
| Remix system | Add output fields: `key_moment`, `shareable_quote`, `visual_summary` to story JSON |
| Night Card enrichment | Add output field: `night_card_seed` with structured moment + quote + feeling |
| Illustration generation | Replace "illustration_prompt" instructions with actual image-gen-ready descriptions, or remove to save tokens |

---

## 9. What Should Be Revised Before Finalizing the Plan

### Must fix
1. **Remove unused `illustration_prompt`** from output schema (saves ~200 tokens per story, removes conflicting instructions)
2. **Resolve word count vs page count conflict** — pick one instruction, not both
3. **Unify craft rules** — MASTER_SYSTEM_PROMPT and CRAFT_CORE should be one source, not two parallel documents that drift

### Should address
4. **Strengthen real-life input preservation** — if the parent says "frog under the plant pot," the frog should be in the story, not abstracted to "nature"
5. **Add cast-size-aware structural rules** — a story with 5 characters needs different pacing than a story with 1
6. **Make vibe-to-genre mapping more nuanced** — "heartfelt" shouldn't always trigger the full therapeutic arc. Consider: heartfelt-cosy vs heartfelt-therapeutic as a two-step mapping.

### Worth considering
7. **Surface the refrain as a first-class output** — it bridges story → Night Card → memory. Currently it's a low-priority afterthought ("4-8 word refrain from the story")
8. **Add a `key_moment` output field** — a single sentence capturing the story's emotional peak, usable by Night Cards and share pages
9. **Consider whether `generateStory()` pipeline should replace SleepSeedCore's manual pipeline** — the clean async function with quality check + revision exists but is unused
