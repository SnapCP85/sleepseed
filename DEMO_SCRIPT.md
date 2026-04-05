# SleepSeed Demo Script

## Setup (Before the Demo)

1. Run `npm run demo:check` — verify all green
2. Open an **incognito/private browser window** (recommended — avoids session conflicts with your real account)
3. Navigate to `https://sleepseed.vercel.app/?demo=true` (or localhost)
4. Wait for auto-login (< 2 seconds)
5. Verify dashboard shows Adina's data with Moonlight the Owl

**Reset at any time:** `Ctrl + Shift + R`

---

## Demo Flow (8-10 minutes)

### Screen 1: Dashboard (MySpace)

**What they see:** The child's home screen — DreamKeeper creature floating, streak counter, recent stories, night card memories.

**What to say:** "This is Adina's space. She's been using SleepSeed for 14 nights. Her DreamKeeper — Moonlight the Owl — lives here. Every night creates a memory."

**Tap:** Point out the streak, recent stories strip, night card memories.

---

### Screen 2: Make Any Story

**Tap:** "Create" in bottom nav → "Make Any Story"

**What they see:** Single-screen story creator — voice/text input, DreamKeeper toggle, "Who's this for?" field, story options.

**What to say:** "The parent — or the child — says anything. 'A dragon who's afraid of toast.' 'What if the moon fell into a puddle.' Anything."

**Type:** "A story about an owl and a lost star" (or speak it)

**What to say:** "They can choose the vibe — funny, cosy, exciting. Toggle their DreamKeeper in or out. Even make the story for someone else — Grandma, a friend."

**Tap:** "Let's make this story"

---

### Screen 3: Story Generation

**What they see:** Smooth progress animation (< 2 seconds in demo mode)

**What to say:** "In real use, this takes about 15 seconds. The system creates a story blueprint, then writes the prose, then quality-checks it."

---

### Screen 4: Story Reading

**What they see:** Beautiful story pages with the hardcoded demo story — "The Owl and the Lost Star"

**What to say:** "This is the story. Written for Adina. Featuring Moonlight. Every story follows world-class craft rules — specificity, read-aloud rhythm, emotional arc. No two stories are the same."

**Swipe:** Through 3-4 pages to show the prose quality. Read a paragraph aloud if the moment is right.

**What to say:** "The parent reads this to their child. Every night."

---

### Screen 5: End Page + Night Card

**What they see:** "THE END" page with story card, refrain, and feedback buttons.

**What to say:** "After the story, the system creates a Night Card — a memory artifact. The parent can rate the story, share it, or save the memory."

**Tap:** "Save tonight's memory" (or just let them see the Night Card)

---

### Screen 6: Updated Dashboard

**Tap:** Go back to dashboard (Home button or bottom nav)

**What they see:** Updated dashboard with the new story in the recent strip, new night card in memories.

**What to say:** "Every night builds on the last. The streak grows. The memories accumulate. After 14 nights, these parents have a collection of emotional artifacts they'll keep forever."

---

### Screen 7: Night Card Library

**Tap:** "See all" on the night card section, or bottom nav → "My Space" → Night Cards

**What they see:** 14 beautiful night cards in a timeline — each with a headline, quote, and date.

**What to say:** "Each card captures one night. The headline. What the child said. A private whisper only the parent sees. Over time, this becomes a portrait of who your child was at this age."

**Tap:** One card to expand → show the front/back flip, the reflection feature, the photo upload.

---

### Screen 8: Story Library (Discover)

**Tap:** "Discover" in bottom nav

**What they see:** Public story library with curated stories.

**What to say:** "Parents can also browse stories written by others — or share their own to the community."

---

### Screen 9: 7-Night Book (Optional)

**Tap:** The "Start a 7-Night Book" card on the dashboard

**What to say:** "For deeper engagement — a serialized story that unfolds across 7 bedtimes. Same DreamKeeper. Same world. Each night remembers what came before. The child comes back because they want to know what happens next."

---

### Screen 10: Watch Onboarding (Optional)

**Tap:** "Watch Onboarding Experience" button at the bottom of the dashboard

**What they see:** The full parent + child onboarding → 3-night hatching ritual

**What to say:** "This is the first experience. The parent sets up a profile. The child meets an egg. Over three nights, the egg cracks, grows, and hatches into their DreamKeeper. The child names it. That bond drives everything that follows."

**Note:** This plays all 3 nights back-to-back. It takes 5-8 minutes. Only show this if you have time and the audience is engaged.

---

## Recovery Steps

| Problem | What to do |
|---------|-----------|
| App is blank | Press `Ctrl+Shift+R` to reset, or refresh with `?demo=true` |
| Story won't generate | Demo mode should use hardcoded story. Check console for errors. Refresh. |
| Wrong account showing | Clear localStorage, navigate to `?demo=true` |
| Night cards empty | Run `npm run demo:seed` then refresh |
| Something looks broken | Skip that screen. Move to the next talking point. Nobody will notice. |

## Reset Procedure

1. Press `Ctrl + Shift + R` on the keyboard
2. App clears all local data and reloads with demo flag
3. Auto-login happens again (< 2 seconds)
4. All seeded data is still in Supabase — only localStorage was cleared

If Supabase data needs re-seeding: `npm run demo:seed`

---

## Key Numbers to Know

- 14 nights of data seeded
- 4 saved stories
- 1 DreamKeeper: Moonlight the Owl (Wisdom)
- Active egg: Fox (Week 2)
- Demo story: "The Owl and the Lost Star" — 14 pages
- Login: demo@sleepseed.app / SleepSeed2026!
