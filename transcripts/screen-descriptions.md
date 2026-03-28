# SleepSeed Current Screens — Exhaustive Descriptions
## Generated from source code analysis, March 2026

---

## SCREEN 1: Public Homepage (Unauthenticated Visitor)

**Background:** Deep navy (#080C18) with radial amber glow at top. Animated star field (50 twinkling white dots). Sticky nav at top: left is "SleepSeed" logo with gold moon circle, right has "Sign in" text link and "Start free ✦" amber pill button.

**Above the fold (Section 1 — "The Hook"):**
- Four floating creature emojis in a row: 🐰 🦊 🐉 🦉 plus a glowing/rocking 🥚
- Main headline in Playfair Display, massive (34-64px): **"Your child will say something *true* tonight."** ("true" is italic amber)
- Subtext: "Every night before sleep, there's a window where they'll tell you what they'd never say at dinner. **SleepSeed opens it.**"
- CTA button: amber gradient pill, "Start tonight — free ✦"
- Social proof: ★★★★★ "Loved by families", then a quote card: *"Bedtime went from something I dreaded to the part of the day we both look forward to most."* — Sarah M. · Mum of two · 122 nights

**Section 2 — Problem + Solution (two columns):**
- Left: "Every night" kicker, then three Q&A rows: "How was your day?" / "Fine." | "Are you nervous about school?" / [shrug] | "What are you thinking about?" / "Nothing." Punchline: **"Children don't open up *on command.*"**
- Right: "SleepSeed" kicker. "They open up to a *trusted friend*, in a story where they're the hero." Three features with emoji icons: 🐰 "A companion who asks what you can't" | ✨ "A story built from their real day" | 🌙 "A Night Card that captures the moment"

**Section 3 — How It Works (3 steps):**
- 📝 "Share their day" | ✨ "Story appears" | 🌙 "Night Card saved"
- Footer: "Ages 3–11 · Works on any device · Ready in 60 seconds"

**Section 4 — The Experience (cinematic demo):**
- Auto-cycling 4-scene stage with dot navigation: "The window" / "The story" / "What she said" / "Saved forever"
- Scene 1: "8:17 PM" / "The day is finally quiet." / "Just you. Just them. Just now."
- Scene 2: "You told us she was nervous about a spelling test..." → "she heard her own name in a story about a brave little cloud."
- Scene 3: Big quote: *"I was brave like the dragon. Even though my tummy was full of tangled string."*
- Scene 4: Night Card polaroid mockup with child photo, quote, metadata

**Story peek:** Parchment-colored card showing a real story excerpt with "Adina and the Shy Cloud", featuring character chips, Moonlight the Owl, and a reading-level story passage.

**Section 5 — Proof:**
- Founder quote: "I built SleepSeed because I was watching unrepeatable moments disappear..." — Greg Edelman · Father of two · Founder
- Three testimonial cards (Sarah M., James K., Dr. Lisa R.)
- Night Card fan (three tilted cards with child photos and quotes)
- Trust badges: 📵 Replaces screen time | 🔒 Data stays private | 🧠 Pediatrician-informed | 📱 Works on any device

**Section 6 — The Close:**
- Rocking/glowing 🥚 emoji
- Headline: "These nights are happening *right now.*"
- CTA: "Start tonight — free ✦"
- Pricing: Free ($0, 3 stories) | Family ($6.58/mo, unlimited)
- Footer: SleepSeed logo, "Bedtime, but magical. Every night.", Privacy/Terms links, © 2026

**Mobile sticky CTA:** Fixed bottom bar appears after scrolling past hero: "Start tonight — free ✦"

**Most prominent element:** The headline "Your child will say something *true* tonight."
**CTA:** "Start tonight — free ✦"
**First-time impression:** An AI bedtime story app that captures what children say before sleep
**Missing:** No video demo, no screenshot of the actual app, no sample audio

---

## SCREEN 2: Main Dashboard (Logged-in Parent)

**Background:** Deep navy (#080C18) with twinkling star field and fixed gradient sky at top.

**Top nav:** Sticky, blurred backdrop. Left: SleepSeed moon logo + wordmark. Right: child name pill (emoji + name), date in DM Mono, purple profile avatar circle with green pip.

**Multi-child selector (if >1 child):** Horizontal row of 48px circular avatars. Active child has 2px amber ring with soft glow. Inactive have subtle border. "+" dashed circle at end to add child.

**Greeting:** DM Mono time label ("Good evening") above Fraunces headline: "Time for *Kelsey's* story 🌙" (active) or "Sweet dreams, *Kelsey.*" (completed, teal).

**Active state (!tonightDone):**
- Creature card (.dash-ac): 24px rounded, dark background with amber aura. Contains:
  - Creature emoji (68px) floating with amber glow
  - "Night X of 7" badge
  - Creature name (Fraunces 20px), type label (DM Mono 8px)
  - Wisdom speech in italic Fraunces with amber left border
- Dream Shards section: info icon trigger, "Shard X of 7 ✦" with 🔥 streak badge
  - Collapsible explain panel with shard colour swatches
  - 7-dot shard track (done/tonight/future states)
  - Progress bar with animated fill
  - Streak row: 🔥 "X nights in a row"
- CTA button: Gold gradient, "✦ Begin tonight's ritual", creature name + "~10 minutes"
- Re-read shortcut (if lastStory exists): amber left-border card with 📖 icon

**Completed state (tonightDone):**
- Celebration header: teal badge "Night X Complete ✦", "Well done, *Kelsey.*", creature heard message
- Sleeping creature zone: large emoji with teal glow, three "z" particles floating
- Teal Dream Shards card: same structure but teal colours, just-earned shard pops
- Tonight's memory card: purple-bordered card with story title, quote, date, "💜 saved"
- View hatchery link

**Bottom nav:** 3-tab bar (74px): Discover (compass SVG) | Create (raised gold 56px circle with star) | My Stuff (treasure chest SVG). Active tab has pill with border. Italic Fraunces labels.

**Most prominent:** The creature emoji floating with glow
**CTA:** "✦ Begin tonight's ritual"
**First-time impression:** A bedtime ritual tracker with a creature companion
**Missing:** No explanation of what "ritual" means to new users

---

## SCREEN 3: Story Creation (StoryCreator.tsx)

**Note:** This is the StoryCreator component, not a "home" stage in SleepSeedCore. It renders when view === 'ritual-starter' (ritual mode) or 'story-wizard' (create mode).

The StoryCreator has two entry modes:
- **Ritual mode:** Focuses on "what happened today" — voice/text input for the day's seed moment
- **Create mode:** Focuses on adventure/world building — choose a setting, add characters

Both modes feature creature companion, character selection, and a CTA to generate.

**Most prominent:** The creature companion and the text input area
**CTA:** "✦ Write tonight's story" (ritual) or "Let's make a story!" (create)

---

## SCREEN 4: About/Marketing Section

This is Sections 2-5 of the PublicHomepage described in Screen 1 above. There is no separate "About" page — the marketing content lives below the fold on the public homepage.

---

## SCREEN 5: Generation Screen (stage==="generating")

**Background:** Dark card (.card) on navy, centred.

**Creature zone:** Creature emoji (58px) with amber aura, floating + glowing. Name below in Fraunces. Aura shifts green when bonding answer typed, teal when ready.

**Speech bubble:** Rounded dark bubble with amber border and tail. Text cycles: "Writing *Kelsey*'s story right now... ✦" → "Painting the world now..." → "*Kelsey*'s story is *ready* ✦". Goes green on bonding reaction, teal on ready.

**Story portal:** 148px circle with:
- Deep blue sky gradient
- Crescent moon bobbing gently
- Two drifting ☁ clouds
- Green ground with animated grass blades
- Creature emoji walking back and forth
- Snail appears if bonding answer given
- Two rotating orbital rings (amber → teal on ready)
- Twinkle stars (22 dots, dynamically generated)
- Story title at bottom
- Vignette shadow around edges

**Luna's thoughts:** Staggered thought cards appearing per step:
- ✓ "Setting: somewhere Kelsey knows well."
- ✓ "The story belongs to Kelsey. Everything else orbits that."
- 💭 "The ending needs to carry them to sleep..." (with thinking dots)

**Step list:** 4 labels with dot indicators: Setting the scene / Writing the story / Painting illustrations / Book is ready!

**Progress bar:** Amber gradient fill animating from 0-100%.

**Bonding question:** Purple card: "Luna wants to know" + question + textarea. Typing answer and blurring triggers reaction.

**Auto-advance:** When all 4 steps complete, "Opening your story..." fades in. After 1.2s, auto-transitions to book.

**Most prominent:** The story portal with the creature walking inside
**CTA:** No button — auto-advances
**First-time impression:** A magical world is being built specifically for your child

---

## SCREEN 6: Book Cover Page

**Container:** book-3d wrapper, min(520px,78vh) height, rounded corners, deep shadow.

**Full bleed illustration:** Animated SVG scene from storyScenes.tsx fills the entire cover. Scene selected by vibe (bedroom, forest, ocean, etc.).

**Top bar:** Semi-transparent gradient. Left: "SleepSeed" in Fraunces. No menu button (removed).

**Bottom gradient:** 55% height gradient from transparent to near-black.

**Cover text (centred at bottom):**
- "✦ · ✦ · ✦" ornament
- Title in Fraunces (18-26px, weight 900)
- "A story for Kelsey"
- "SleepSeed · Made tonight"

**Tapping anywhere** advances to the cast page. No entry buttons (removed).

**Below the book:** Navigation controls (prev/next), page dots, Read Aloud button, voice picker, toolbar with save/download/share/new story.

**Most prominent:** The SVG illustration filling the cover
**Missing:** No explicit "tap to begin" hint

---

## SCREEN 7: Story Page (Mid-read, Page 2-3)

**Layout:** 55/45 split vertically within the book-3d container.

**Top 55% — Illustration area:** SVG scene from storyScenes.tsx with gradient fade at bottom into text zone.

**Bottom 45% — Text area:**
- Page number in Kalam: "· 2 ·"
- Story text in Patrick Hand (14-17px), ink colour on parchment
- Refrain on even pages in Cormorant Garamond italic
- Corner nav labels: "‹ prev" left, "next ›" right (Kalam, very dim)

**Top reading bar:** "Page 2 of 9", dot indicators, no menu.

**Tap zones:** Left 40% goes back, right 40% goes forward.

**No floating pill, no menu button inside the book.**

**Below the book:** Full control bar with Read Aloud, voice, toolbar.

**Most prominent:** The story text in handwriting font
**Missing:** No illustration-per-page (SVG is same scene on every page)

---

## SCREEN 8: The End Ceremony

**Full background:** Radial gradient (deep blue to near-black). Large ghosted creature emoji at 200px, 4% opacity.

**Centre stack:**
- 🌙 emoji (52px) floating + glowing
- "The End." in Fraunces 36px, 900 weight, amber with text shadow
- "Sweet dreams, Kelsey." in Kalam 15px
- Refrain quoted between amber hairlines in Cormorant Garamond italic
- Gold CTA: "✦ Save tonight's Night Card" (shimmer animation)
- "skip for now" link
- "⭐ How was this story?" feedback button
- Library submission card (if applicable)

**Most prominent:** "The End." text
**CTA:** "✦ Save tonight's Night Card"

---

## SCREEN 9: Night Card Input Page (nc-single-page)

**Background:** Dark gradient (deep blue/indigo).

**Top-right:** Creature emoji at 28px, 60% opacity, floating.

**Label:** "✦ Tonight's Night Card" with amber gradient line.

**Question:** Large Fraunces italic (22px): the bonding question from the creature.

**Attribution:** Kalam 12px: "Luna wants to know what Kelsey said"

**Input:** Kalam textarea with amber placeholder: "Kelsey said..."

**Photo choices:** Two side-by-side cards:
- 📸 "Take photo" — opens device camera
- 🖼️ "Upload photo" — opens file picker/gallery

**Photo preview:** If taken/uploaded, shows with ✕ dismiss button.

**Camera mode:** Inline video element with Cancel/Capture buttons.

**CTA:** Gold gradient: "✦ Make our Night Card"

**Skip:** "skip night card" link at bottom.

**Most prominent:** The bonding question in large italic serif
**CTA:** "✦ Make our Night Card"

---

## SCREEN 10: Night Card Reveal

**Generating state:** Creature emoji (72px) floating with glow. "Luna is making your Night Card..." "This only takes a moment ✦"

**Reveal card (.nc-reveal-card):** Dark gradient card with amber border, shadow, entrance animation (scale + translateY).
- Photo zone (145px): uploaded photo or large emoji fallback, with dark gradient overlay and "Tonight" date label
- Body:
  - "✦ Night Card" eyebrow
  - Headline in Fraunces 20px amber
  - Amber gradient rule
  - Quote in Cormorant Garamond italic
  - Memory line in Kalam
  - Whisper reflection in purple card if present
  - Footer: "SleepSeed" brand

**Action row:** Two buttons:
- 🌟 "Share" (amber)
- ✓ "Save & Done" (teal) — saves to Supabase and navigates home

**Rating strip:** "Tonight's story" label + 5 star buttons (tap ≤3 opens feedback)

**Library toggle:** "Share this story with other SleepSeed families?" with toggle switch

**Most prominent:** The Night Card reveal card with headline and quote
**CTA:** "✓ Save & Done"
