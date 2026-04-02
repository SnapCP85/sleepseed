# Public Story Detail Page + Remix Flow — Design & Implementation Spec

**Status:** Ready for implementation
**Based on:** Complete codebase audit of storage.ts, types.ts, LibraryStoryReader.tsx, LibraryHome.tsx, App.tsx, sleepseed-prompts.js, api/*, vercel.json

---

## 1. PUBLIC STORY DETAIL PAGE — Layout Spec

### Current State → New State

**Currently:** `/stories/:slug` rewrites to `/?library=:slug` which drops the user directly into the full-screen reader (LibraryStoryReader). There is no "detail page" — the cover page inside the reader is the closest thing.

**New:** `/stories/:slug` serves a **standalone story detail page** (`StoryDetailPage.tsx`) with a hero, remix block, and embedded reader. The full reader remains accessible via a "Read now" action.

---

### Page Structure (mobile-first, max-width 540px)

```
┌──────────────────────────────────────────┐
│  Nav: SleepSeed logo · "Discover" link   │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         STORY HERO CARD            │  │
│  │                                    │  │
│  │  [SVG Scene Illustration]          │  │
│  │  Vignette overlay                  │  │
│  │                                    │  │
│  │  Content badge:                    │  │
│  │  "SleepSeed Original" / "Shared    │  │
│  │   by a Family" / "Creator Story"   │  │
│  │                                    │  │
│  │  Title (Fraunces, 26px)            │  │
│  │  "A story for ages 5–8"           │  │
│  │                                    │  │
│  │  [😌 Cosy] [✨ Wonder] pills       │  │
│  │                                    │  │
│  │  Refrain in italic Kalam           │  │
│  │  "And the stars kept listening."   │  │
│  │                                    │  │
│  │  ★ 4.8 · 342 reads · 🔖 Staff Pick │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         REMIX BLOCK                │  │
│  │  (the primary conversion surface)  │  │
│  │                                    │  │
│  │  ✦ "Make this story yours"         │  │
│  │                                    │  │
│  │  "Put [your child's name] at the   │  │
│  │   centre of this adventure."       │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Child's first name           │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ▾ Add a friend, pet, or creature  │  │
│  │  (expandable — see remix flow)     │  │
│  │                                    │  │
│  │  [ ✦ Make this story ours ]        │  │
│  │  (amber CTA, shimmer)             │  │
│  │                                    │  │
│  │  "or read the original →"          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         STORY PREVIEW              │  │
│  │                                    │  │
│  │  First 2-3 pages in a premium      │  │
│  │  reading layout (same typography   │  │
│  │  as the reader: Patrick Hand for   │  │
│  │  body, Kalam for refrain).         │  │
│  │                                    │  │
│  │  Fade-out gradient at the bottom.  │  │
│  │                                    │  │
│  │  [ Continue reading → ]            │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         RELATED STORIES            │  │
│  │                                    │  │
│  │  "More stories like this"          │  │
│  │                                    │  │
│  │  Horizontal scroll of 2-column     │  │
│  │  story cards (reuse COVER_PALETTES │  │
│  │  + floating emoji pattern from     │  │
│  │  LibraryHome).                     │  │
│  │                                    │  │
│  │  Grouped by emotional adjacency:   │  │
│  │  "More cosy stories"               │  │
│  │  "Stories other families remixed"   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         FOOTER CTA                 │  │
│  │                                    │  │
│  │  "Every night is a new story."     │  │
│  │  [ Create yours free → ]           │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### Hero Card — Content Type Labels

Determined by data on the story:

| Condition | Label | Style |
|-----------|-------|-------|
| `story.userId === SYSTEM_USER_ID` or `story.isBookOfDay` | "SleepSeed Original" | Amber badge with ✦ |
| `story.isStaffPick` | "Staff Pick" | Amber badge with ★ |
| Story submitted via `submitStoryToLibrary` by a regular user | "Shared by a Family" | Cream badge with 🌙 |
| (Future) Creator upload | "Creator Story" | Teal badge with ✨ |

### Hero Card — Stats Row

```
★ {rating} · {readCount} reads · {badge}
```

Where `rating` = `thumbsUp / (thumbsUp + thumbsDown)` scaled to 5.0 (show only if 5+ votes). Badge = "Staff Pick" or "Story of the Day" if applicable.

### Hero Card — Mood/Genre Pills

Source: `story.vibe` and `story.mood` mapped to display labels:

```typescript
const VIBE_LABELS: Record<string, { emoji: string; label: string }> = {
  'calm-cosy':   { emoji: '😌', label: 'Cosy' },
  'warm-funny':  { emoji: '😄', label: 'Funny' },
  'exciting':    { emoji: '⚡', label: 'Adventure' },
  'heartfelt':   { emoji: '💛', label: 'Heartfelt' },
  'mysterious':  { emoji: '✨', label: 'Wonder' },
};
```

Also show age band: `story.ageGroup` mapped through `AGE_LABELS`:
```typescript
const AGE_LABELS: Record<string, string> = {
  'age3': 'Ages 3–5',
  'age5': 'Ages 5–8',
  'age7': 'Ages 7–10',
  'age10': 'Ages 9+',
};
```

---

## 2. REMIX FLOW — UX Spec

### Layer 1: Fast Remix (inline on detail page)

Always visible. No auth required. This is the primary conversion surface.

**UI:**
```
┌─────────────────────────────────────────┐
│  ✦ Make this story yours                │
│                                         │
│  "Put your child at the centre          │
│   of this adventure."                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🧒  Child's first name           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ▾ Add someone else to the story        │
│                                         │
│  (expanded:)                            │
│  ┌───────────────────────────────────┐  │
│  │  Type: [Friend] [Sibling] [Pet]   │  │
│  │        [DreamKeeper]              │  │
│  │  Name: ___________                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [ ✦ Make this story ours ]             │
│  shimmer CTA, amber gradient            │
│                                         │
│  "or read the original →"               │
└─────────────────────────────────────────┘
```

**On CTA tap (unauthenticated):**
1. Store remix intent in sessionStorage: `{ storyId, slug, childName, extraChar }`
2. Navigate to auth with return context
3. After auth, resume remix flow

**On CTA tap (authenticated):**
1. Navigate to a new view `story-remix` with the story + remix inputs
2. Show generating screen (reuse the creature generation animation from SleepSeedCore)
3. Call the remix API endpoint (see section below)
4. On completion, show the remixed story in the reader
5. Auto-save as a private story with `remixed_from: originalStoryId`

### Layer 2: Deep Remix (optional expansion)

Accessible from the expanded section of the Fast Remix block OR from a "Customize more" link after the Fast Remix inputs.

**Additional inputs (all optional):**

| Input | UI Control | Maps To |
|-------|-----------|---------|
| Mood adjustment | 5 pill toggles (Cosy/Funny/Exciting/Heartfelt/Wonder) | Overrides story vibe |
| Add someone | Type picker + name input (up to 2 extra characters) | Additional cast |
| "Something from today" | Single-line text input | `childDetail` in personalization prompt |
| World change | Only if story has a clear setting. Dropdown of 6 worlds from StoryCreator | Setting override |

**Deep Remix does NOT regenerate the full story.** It uses `buildPersonalisationPrompt()` (currently unused, already written) to AI-personalize the existing story text. Only a full mood/world change would trigger a new generation via `buildStoryPrompt()`.

---

## 3. COMPONENT STRUCTURE

### New Files

```
src/pages/StoryDetailPage.tsx          ← New: the public story detail page
src/components/story/StoryHeroCard.tsx  ← New: hero card with scene, title, pills, stats
src/components/story/RemixBlock.tsx     ← New: the personalization/remix inline form
src/components/story/StoryPreview.tsx   ← New: first 2-3 pages in reading typography
src/components/story/RelatedStories.tsx ← New: horizontal story card row
api/remix.js                           ← New: server-side personalization endpoint
api/og/[slug].js                       ← New: OG image + meta generation endpoint
```

### Modified Files

```
src/App.tsx                            ← Add 'story-detail' view routing
src/lib/types.ts                       ← Add StoryRoles interface, RemixRequest type
src/lib/storage.ts                     ← Add getRelatedStories(), atomic read_count increment
vercel.json                            ← Update /stories/:slug rewrite to hit OG endpoint for crawlers
```

### Reused Components

```
src/lib/storyScenes.tsx                ← getSceneByVibe() for hero illustration
src/components/dashboard/PrimaryCTA.tsx ← Amber shimmer button
src/features/nightcards/NightCard.tsx   ← (not directly, but same visual language)
```

### Component Hierarchy

```
StoryDetailPage
├── Nav (minimal: logo + "Discover" link)
├── StoryHeroCard
│   ├── Scene illustration (getSceneByVibe)
│   ├── Content type badge
│   ├── Title + age + refrain
│   ├── Vibe/mood pills
│   └── Stats row
├── RemixBlock
│   ├── Child name input
│   ├── Extra character expander (type pills + name)
│   ├── Deep remix expander (mood, detail, world)
│   ├── Primary CTA ("Make this story ours")
│   └── Secondary link ("or read the original")
├── StoryPreview
│   ├── First 2-3 pages in reading typography
│   └── Fade gradient + "Continue reading" CTA
├── RelatedStories
│   └── Horizontal scroll of story cards
└── Footer CTA
```

---

## 4. ROLE-AWARE DATA MODEL

### The Problem

Currently, `book_data.allChars` stores characters by name with a `type` field, but story page text embeds names as literal strings. There's no way to reliably substitute "Mia" → "Sophie" without the naive `string.split().join()` that breaks on "Miami", "Amia", etc.

### Bridge Approach (implement now)

Add a `roles` field to `book_data` at publish time. This is a transformation that happens in `submitStoryToLibrary()` — the existing story text is unchanged, but role metadata is extracted and stored alongside it.

**New field: `book_data.roles`**

```typescript
interface StoryRole {
  role: 'protagonist' | 'companion' | 'friend' | 'parent' | 'pet' | 'creature' | 'worldSpirit';
  originalName: string;          // "Mia"
  displayName: string;           // "Mia" (same initially, changes when remixed)
  type: string;                  // from allChars: "hero", "creature", etc.
  pronouns?: string;             // "she/her", "he/him", "they/them"
  description?: string;          // "a brave girl who collects feathers"
  isSubstitutable: boolean;      // true for protagonist + companion, false for others by default
}
```

**How roles are extracted** (in `submitStoryToLibrary` or a new `extractRoles()` helper):

```typescript
function extractRoles(bookData: any): StoryRole[] {
  const chars = bookData.allChars || [];
  return chars.map(c => ({
    role: c.type === 'hero' ? 'protagonist'
        : c.type === 'creature' ? 'companion'
        : c.type === 'parent' ? 'parent'
        : c.type === 'pet' ? 'pet'
        : 'friend',
    originalName: c.name,
    displayName: c.name,
    type: c.type,
    pronouns: c.gender === 'girl' ? 'she/her'
            : c.gender === 'boy' ? 'he/him'
            : undefined,
    description: c.note || c.classify || undefined,
    isSubstitutable: c.type === 'hero' || c.type === 'creature',
  }));
}
```

### Why Not Tokenize Now

Tokenizing story text (`{{protagonist}} found the key`) would require:
1. Reprocessing every existing story in the database
2. Modifying the story generation output format
3. Changing the reader to detokenize at render time
4. Handling edge cases where names appear in compound words or possessives

This is a significant migration. The bridge approach (role metadata + AI personalization) works now with zero changes to existing stories.

### Personalization Strategy (3 tiers)

| Tier | When | Method | Quality |
|------|------|--------|---------|
| **Instant preview** | User types name in remix block | Client-side word-boundary-aware regex replacement | Good for names, weak for pronouns |
| **AI personalization** | User taps "Make this story ours" | Server-side `buildPersonalisationPrompt()` via `/api/remix` | Excellent — handles pronouns, possessives, context |
| **Full regeneration** | User changes mood/world/adds characters beyond original | Server-side `buildStoryPrompt()` with original story as context | Full quality but slower |

**Improved client-side replacement (Tier 1):**

```typescript
function quickPersonalise(text: string, nameMap: Record<string, string>): string {
  let result = text;
  for (const [orig, replacement] of Object.entries(nameMap)) {
    if (!replacement || replacement === orig) continue;
    // Word-boundary-aware replacement (handles possessives)
    const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    result = result.replace(regex, replacement);
    // Handle possessives: "Mia's" → "Sophie's"
    const possRegex = new RegExp(`\\b${escaped}'s\\b`, 'g');
    result = result.replace(possRegex, `${replacement}'s`);
  }
  return result;
}
```

---

## 5. IMPLEMENTATION PLAN — Priority Order

### Phase 1: OG Meta + API Foundation (Unblocks sharing)

**1a. Create `api/og/[slug].js` — Edge function for social previews**

This is the #1 blocker. Without it, every shared link is dead.

```javascript
// api/og/[slug].js
// Returns HTML with proper OG tags for crawlers
// For normal browsers, redirects to the SPA

export default async function handler(req, res) {
  const { slug } = req.query;
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /bot|crawl|spider|facebook|twitter|slack|discord|telegram|whatsapp|linkedin|pinterest/i.test(ua);

  if (!isCrawler) {
    // Normal browser — redirect to SPA
    res.writeHead(302, { Location: `/?library=${slug}` });
    res.end();
    return;
  }

  // Crawler — return HTML with OG tags
  const story = await fetchStoryMetadata(slug); // Supabase query (no book_data)
  if (!story) { res.status(404).send('Not found'); return; }

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${story.title} — SleepSeed</title>
  <meta property="og:title" content="${story.title}" />
  <meta property="og:description" content="A ${story.vibe || 'bedtime'} story for ${story.ageGroup ? AGE_LABELS[story.ageGroup] : 'all ages'} — on SleepSeed" />
  <meta property="og:image" content="${BASE_URL}/api/og-image/${slug}" />
  <meta property="og:url" content="${BASE_URL}/stories/${slug}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>Redirecting...</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(html);
}
```

**1b. Update `vercel.json` rewrite**

Change from:
```json
{ "source": "/stories/:slug", "destination": "/?library=:slug" }
```
To:
```json
{ "source": "/stories/:slug", "destination": "/api/og/:slug" }
```

Normal browsers get 302 → SPA. Crawlers get HTML with OG tags.

**1c. Create `api/og-image/[slug].js` — Dynamic OG image**

Server-side SVG → PNG rendering for social preview cards. Uses the story's vibe to select a background color, overlays title text.

**1d. Create `api/remix.js` — Server-side personalization endpoint**

```javascript
// POST /api/remix
// Body: { storyId, childName, childAge?, childDetail?, extraChars? }
// Returns: { personalizedBookData, remixId }

export default async function handler(req, res) {
  const { storyId, childName, childAge, childDetail, childInterest, extraChars } = req.body;

  // 1. Fetch the original story
  const story = await getStoryById(storyId);
  if (!story || !story.is_public) return res.status(404).json({ error: 'Story not found' });

  // 2. Extract page texts
  const pages = story.book_data.pages || [];
  const fullText = pages.map(p => p.text).join('\n\n');

  // 3. Call buildPersonalisationPrompt (currently unused — now activated)
  const { system, user } = buildPersonalisationPrompt(fullText, {
    childName,
    childAge,
    childDetail,
    childInterest,
  });

  // 4. Call Claude
  const response = await callClaude(system, user);

  // 5. Split back into pages (match original page count)
  const personalizedPages = splitIntoPages(response, pages.length);

  // 6. Return personalized book data
  res.json({
    personalizedBookData: {
      ...story.book_data,
      title: story.book_data.title, // Keep original title
      heroName: childName,
      pages: personalizedPages,
      remixedFrom: storyId,
    }
  });
}
```

### Phase 2: Story Detail Page (Core UX)

**2a. Create `StoryDetailPage.tsx`**

New page component. Fetches story by slug, renders the hero card, remix block, preview, and related stories. No auth wall before value.

**2b. Create `StoryHeroCard.tsx`**

Renders the SVG scene (via `getSceneByVibe`), title, refrain, pills, stats. Reuses existing design tokens (COLORS, RADIUS from designTokens.ts).

**2c. Create `RemixBlock.tsx`**

The primary conversion surface. Child name input + expandable extra character section + "Make this story ours" CTA. Stores remix intent for unauthenticated users.

**2d. Create `StoryPreview.tsx`**

First 2-3 pages of the story rendered in reading typography (Patrick Hand body text, Kalam refrain). Bottom fade gradient. "Continue reading →" CTA opens the full reader.

**2e. Create `RelatedStories.tsx`**

Fetches related stories via `getRelatedStories(storyId, mood, vibe)` — new storage function that queries stories with matching `mood` or `vibe`, excluding the current story, ordered by `read_count DESC`, limit 6.

**2f. Update `App.tsx` routing**

Add `story-detail` view that renders `StoryDetailPage`. Update the `?library=slug` handler to navigate to `story-detail` instead of directly to the reader.

### Phase 3: Role Metadata + Improved Personalization

**3a. Add `extractRoles()` to storage.ts**

Function that derives `StoryRole[]` from `bookData.allChars`.

**3b. Update `submitStoryToLibrary()` to embed roles**

When a story is published, run `extractRoles()` and store the result in `bookData.roles`.

**3c. Backfill existing public stories**

One-time migration script that reads all public stories, runs `extractRoles()` on their `bookData.allChars`, and writes `bookData.roles` back.

**3d. Update `RemixBlock` to show substitutable roles**

Instead of a single "child name" input, show one input per `isSubstitutable` role: "Who is the hero?" and "Who is their companion?"

**3e. Implement `quickPersonalise()` with word-boundary regex**

Replace the current `string.split().join()` in LibraryStoryReader with the improved word-boundary-aware version for instant preview.

### Phase 4: Polish + Related Features

**4a. "Remixed by N families" counter** — Track remix count on the original story
**4b. Remix attribution** — Show "Based on [original title]" on remixed stories
**4c. Deep remix mood/world override** — When user changes mood or world, route to full regeneration instead of personalization
**4d. Guest remix flow** — Store intent in sessionStorage, resume after auth
**4e. Share card with preview** — Show the user what their social share will look like before sending

---

## 6. BLOCKERS & ARCHITECTURE CHANGES

### Must Resolve Before Phase 1

| Blocker | Resolution | Effort |
|---------|-----------|--------|
| **No SSR for OG tags** | `api/og/[slug].js` Edge Function with crawler detection | 1 day |
| **No cover images** | `api/og-image/[slug].js` generates SVG-based social cards | 1 day |
| **`buildPersonalisationPrompt` unused** | Wire to new `/api/remix` endpoint | 0.5 day |
| **Non-atomic read_count** | Change to `UPDATE stories SET read_count = read_count + 1` in Supabase | 0.5 hour |

### Must Resolve Before Phase 2

| Blocker | Resolution | Effort |
|---------|-----------|--------|
| **No `story-detail` view in App.tsx** | Add view routing + update library slug handler | 0.5 day |
| **No `getRelatedStories()` function** | Add to storage.ts — query by matching mood/vibe | 0.5 day |
| **Genre filter duplicates in LibraryHome** | Fix GENRE_FILTERS to use unique values | 1 hour |

### Must Resolve Before Phase 3

| Blocker | Resolution | Effort |
|---------|-----------|--------|
| **`book_data` has no roles field** | Add `extractRoles()` + backfill migration | 1 day |
| **Naive string replacement** | Replace with `quickPersonalise()` using word-boundary regex | 2 hours |

### No Blockers (Can Start Any Time)

- Related stories component
- Footer CTA
- Stats row with real rating calculation
- Content type badge logic

---

## Design Principles Applied

1. **No auth wall before first value.** The detail page, preview, and remix input are all available to unauthenticated users. Auth is only required at the moment of generating the remix.

2. **The remix block IS the conversion funnel.** Every visitor sees "Put your child in this story" — not buried behind a subscription gate. This is the moment that converts discovery into usage.

3. **Mobile-first density.** The hero card + remix block must fit in the first 1.5 screen heights on an iPhone SE (375px). No wasteful spacing, no decorative-only sections above the fold.

4. **Story experience, not SaaS page.** Dark night-sky backgrounds, SVG scene illustrations, soft animations (floatY, fadeUp), Fraunces headings, DM Mono labels. Every element uses the existing SleepSeed visual language.

5. **Bridge architecture, not big-bang migration.** Role metadata is extracted from existing `allChars`, not a new data model. AI personalization uses the already-written `buildPersonalisationPrompt()`. No changes to the story generation pipeline required.
