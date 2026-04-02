# SleepSeed Public Library — Architecture Audit

**Generated:** 2026-03-31 | **Source files:** `storage.ts`, `types.ts`, `LibraryHome.tsx`, `LibraryStoryReader.tsx`, `SharedStoryViewer.tsx`, `api/book-of-day.js`, `api/sitemap.js`, `api/convert-pdf.js`, `vercel.json`, `index.html`, `sleepseed-prompts.js`

---

## 1. DATA STRUCTURE

### Primary Table: `stories`

A single Supabase table stores **both** private and public stories. Public stories are distinguished by `is_public = true` and a non-null `library_slug`.

**Full column set:**
```
id                TEXT PK
user_id           TEXT (FK to profiles)
title             TEXT
hero_name         TEXT
character_ids     JSONB (array of character ID strings)
refrain           TEXT nullable
date              TEXT (ISO date string)
occasion          TEXT nullable
book_data         JSONB (the entire story — see below)
age_group         TEXT nullable ('age3','age5','age7','age10')
vibe              TEXT nullable
theme             TEXT nullable
mood              TEXT nullable
story_style       TEXT nullable
story_length      TEXT nullable
lessons           JSONB nullable (array of strings)
cover_url         TEXT nullable
is_public         BOOLEAN default false
library_slug      TEXT nullable UNIQUE
submitted_at      TIMESTAMPTZ nullable
thumbs_up         INTEGER default 0
thumbs_down       INTEGER default 0
read_count        INTEGER default 0
conversion_count  INTEGER default 0
is_staff_pick     BOOLEAN default false
is_book_of_day    BOOLEAN default false
book_of_day_date  TEXT nullable ('YYYY-MM-DD')
```

### `book_data` JSON Shape

The `book_data` column is typed as `any` (no schema enforcement). Actual shape depends on the generation mode:

**Standard story:**
```json
{
  "title": "The Night the Stars Listened",
  "heroName": "Mia",
  "allChars": [
    {"id": "hero", "name": "Mia", "type": "hero", "gender": "girl"},
    {"id": "abc123", "name": "Luna", "type": "creature", "note": "..."}
  ],
  "refrain": "And the stars kept listening.",
  "pages": [
    {"text": "Page 1 text content..."}
  ]
}
```

**Adventure (choose-your-own) story:**
```json
{
  "title": "...",
  "heroName": "...",
  "allChars": [...],
  "isAdventure": true,
  "refrain": "...",
  "setup_pages": [{"text": "..."}],
  "choice": {
    "question": "Which path does Mia take?",
    "option_a_label": "The glowing door",
    "option_b_label": "The quiet garden"
  },
  "path_a": [{"text": "..."}],
  "path_b": [{"text": "..."}]
}
```

**Private stories also contain (stripped before public serving):**
```json
{
  "parentNote": "...",     // Parent's seed text — STRIPPED on public read
  "nightCard": {...}       // Night Card data — STRIPPED on public read
}
```

### Role-Based Character Mapping

**Partial.** The `allChars` array stores character metadata but mapping is basic:

| Field | Stored | Purpose |
|-------|--------|---------|
| `id` | Yes | Unique ID or "hero" for protagonist |
| `name` | Yes | Display name |
| `type` | Yes | "hero", "creature", "parent", "pet", "toy", "friend" |
| `gender` | Sometimes | "boy", "girl", or empty |
| `classify` | Sometimes | Sub-type like "mother", "wizard", "dragon" |
| `note` | Sometimes | Context for the character |

**No formal role abstraction exists.** Characters are stored as they were at generation time — there's no concept of "the protagonist role" that could be remapped to a different name. The hero is identified by `type: "hero"` in `allChars` and by the top-level `heroName` field, but the actual story text embeds names literally.

### Supporting Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `story_votes` | id, story_id, user_id, session_id, vote (1/-1), vote_note, created_at | Per-user thumbs up/down |
| `library_favourites` | id, user_id, story_id, saved_at | User bookmarks |
| `story_reads` | id, story_id, reader_user_id, session_id, ref_code, referrer_user_id, read_at, converted_to_paid | Read tracking with referral attribution |
| `profiles` | id, display_name, is_subscribed, ref_code, rewards_months_earned, conversion_count | User profiles (joined for referrals) |

---

## 2. STORAGE & ACCESS

### Where Public Stories Live

Single `stories` table in Supabase. Public stories are gated by `is_public = true` in every query. The `library_slug` column provides URL-friendly identifiers.

### Query Patterns

**List queries** (browsing) use a reduced column set (`LIBRARY_LIST_COLS`) that **excludes `book_data`** — the full story content is never loaded for the grid. This is a deliberate bandwidth optimization since `book_data` can be 10-50KB per story.

**Single story queries** (reading) use `LIBRARY_FULL_COLS` which includes `book_data`.

### Indexing / Search

**Current search:** Supabase `ilike` on two columns:
```sql
.or('title.ilike.%{search}%,hero_name.ilike.%{search}%')
```
This is a **case-insensitive pattern match** — not full-text search. No Supabase text search index, no tsvector, no pg_trgm.

**Filter columns with likely indexes:**
- `is_public` (every query filters on this)
- `library_slug` (unique constraint = index)
- `is_book_of_day` + `book_of_day_date`
- `is_staff_pick`

**Sorting options:**
| UI Label | Column | Direction |
|----------|--------|-----------|
| "New" (default) | `submitted_at` | DESC |
| "Trending" | `read_count` | DESC |
| (unused) | `thumbs_up` | DESC |

**Pagination:** Offset-based via `.range(offset, offset + limit - 1)`, limit capped at 50.

### Caching

**Client-side localStorage cache** (key: `ss_library_cache`):
- Stores first 20 stories, bookOfDay, and first 6 staff picks
- Written on successful Supabase fetch
- Read on mount for **instant first paint** before Supabase response arrives
- No TTL — stale until next fetch

No server-side caching, no CDN caching for queries, no Redis layer.

---

## 3. SHARING FLOW

### Private → Public Publishing

**Function:** `submitStoryToLibrary(storyId, userId, metadata)`

**Flow:**
1. Verifies the story exists and belongs to the user
2. If already public with a slug, returns existing slug immediately (idempotent)
3. Generates slug: `generateLibrarySlug(title)` → lowercase, strip special chars, collapse spaces to dashes, truncate to 50 chars, append 4-char DJB2 hash
4. Updates the story row: `is_public = true`, `library_slug = slug`, `submitted_at = now()`
5. Optionally sets metadata: `age_group`, `vibe`, `theme`, `mood`, `story_style`, `story_length`, `lessons`
6. Returns `{ slug }`

**Unpublishing:** `removeStoryFromLibrary(storyId, userId)` sets `is_public = false` but **does not clear `library_slug`** — the slug is "reserved" permanently. This prevents URL reuse.

### Sanitization on Read

When a public story is fetched via `getLibraryStoryBySlug()`, two fields are **deleted** from the returned `bookData`:
```javascript
delete data.bookData.parentNote;   // Parent's seed text
delete data.bookData.nightCard;    // Night Card data
```

These are the only transformations. The story text itself, character names, and all page content are served exactly as generated.

### No Content Moderation

There is **no moderation pipeline**. Any subscribed user can publish any generated story directly to the public library. No review queue, no content scanning, no approval flow.

### Two Separate Sharing Mechanisms

**1. Library sharing (URL-based):**
- Stories get a permanent URL: `/stories/{slug}`
- Vercel rewrite: `/stories/:slug` → `/?library=:slug`
- The SPA reads the query param and renders the reader

**2. Direct story sharing (base64-encoded):**
- SharedStoryViewer (`?s=` parameter) decodes base64 → JSON
- The story is **embedded in the URL itself** — no database lookup
- Shape: `{ t: title, n: heroName, p: [{text}], r: refrain }`
- This is used for sharing private stories that aren't in the library
- URLs can be extremely long (entire story text in base64)

---

## 4. PERSONALIZATION SYSTEM

### Current Implementation: Client-Side String Replacement

**Gating:** Only shown if `isSubscribed === true` AND `story.bookData.allChars.length > 0`

**Flow:**
1. Reader shows a "personalisation gate" before the story
2. For each character in `allChars`, an input field is shown with the original name as placeholder
3. User types replacement names
4. On "Start reading", a `nameMap` is built: `{ "Mia": "Sophie", "Luna": "Sparkle" }`
5. Every page text is processed through `personalise()`:
   ```javascript
   const personalise = (text) => {
     let result = text;
     for (const [orig, replacement] of Object.entries(nameMap)) {
       if (replacement && replacement !== orig) {
         result = result.split(orig).join(replacement);
       }
     }
     return result;
   };
   ```
6. Title, refrain, hero display name also go through `personalise()`

**Limitations:**
- **Naive string replacement** — `"Mia"` in `"Miami"` would become `"Sophieami"` (no word boundary check)
- **Client-side only** — the personalized version is never saved, never shareable
- **No pronoun handling** — replacing a girl character with a boy name doesn't update she/her → he/him
- **No AI involvement** — `buildPersonalisationPrompt()` exists in `sleepseed-prompts.js` but is **never called anywhere**. It was designed to use Claude for surgical name substitution with context awareness, but the implementation uses simple string replacement instead.
- **Subscribed-only** — free users and guests never see the gate

### buildPersonalisationPrompt() (unused)

Exists in `sleepseed-prompts.js` but is dead code. It takes:
- `originalStory` — the full text
- `childProfile` — `{ childName, childAge, childDetail, childFear, childInterest }`

It instructs Claude to:
1. Replace protagonist name throughout
2. Weave in one specific detail from the child profile
3. Not change what happens — only who it happens to
4. Make personalisation "feel like it was always there"

This is significantly more sophisticated than the current string replacement but is not implemented.

---

## 5. DISCOVERY SYSTEM

### Browse Page (LibraryHome.tsx)

**Genre Filters (10 pills):**
```javascript
const GENRE_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Adventure', value: 'exciting' },
  { label: 'Fantasy',   value: 'exciting' },     // DUPLICATE of Adventure
  { label: 'Comedy',    value: 'warm-funny' },
  { label: 'Magic',     value: 'mysterious' },
  { label: 'Wonder',    value: 'heartfelt' },
  { label: 'Cozy',      value: 'calm-cosy' },
  { label: 'Brave',     value: 'exciting' },      // TRIPLICATE
  { label: 'Animals',   value: '' },               // NO FILTER (same as All)
  { label: 'Space',     value: 'exciting' },       // QUADRUPLICATE
];
```

Adventure, Fantasy, Brave, and Space all filter to `mood = 'exciting'`. Animals filters to nothing. Only 4 of 10 pills produce unique filter values.

**Search:** Full-width text input, 300ms debounce, searches `title` and `hero_name` via `ilike`.

**Sort:** Two-way toggle:
- "Trending" → `order by read_count DESC`
- "New" → `order by submitted_at DESC`

**Story of the Day:** Fetched via `getBookOfDay()`. Rendered as a large hero card at the top. Hidden when any filter or search is active. Falls back to first staff pick if no book-of-day exists for today.

**Staff Picks:** Fetched via `getFeaturedLibraryStories(10)`. Shown inline with a "Staff Pick" badge on matching cards in the grid.

**Favourites:** Star toggle on each card. Stored in Supabase `library_favourites` table. Toggle is optimistic (updates UI before server response).

**Stats Row:** Three columns:
| Label | Value | Actual Source |
|-------|-------|---------------|
| "Stories" | `stories.length` | Count of loaded stories |
| "Today" | `1` or `0` | Whether bookOfDay exists |
| "Reads" | `stories.length` | **Bug: same as Stories count** |

**Guest Gating:** After the 5th story card, a blurred overlay with "Sign up free" CTA appears. Guest users cannot favourite, vote, or access the full library.

**Cover Palette:** 6 fixed gradient+accent pairs cycled by **grid index** (`i % 6`):
```javascript
const COVER_PALETTES = [
  { bg: 'linear-gradient(145deg,#251838,#140d28)', accent: '#b48cff' },  // purple
  { bg: 'linear-gradient(145deg,#122038,#080e24)', accent: '#68b8ff' },  // blue
  { bg: 'linear-gradient(145deg,#261c08,#16100a)', accent: '#F5B84C' },  // amber
  { bg: 'linear-gradient(145deg,#102418,#081410)', accent: '#5DCAA5' },  // green
  { bg: 'linear-gradient(145deg,#28101e,#180812)', accent: '#ff82b8' },  // pink
  { bg: 'linear-gradient(145deg,#240c10,#14080a)', accent: '#ff7878' },  // red
];
```
Because the index changes when sort order changes, the **same story gets different colors** in different views.

**Pagination:** "Load more" button, offset-based, 20 per page, max 50 per query.

### Ranking Logic

No algorithmic ranking. Stories are either:
- Sorted by `read_count DESC` ("Trending") — a simple popularity sort
- Sorted by `submitted_at DESC` ("New") — reverse chronological

No decay function, no engagement-weighted scoring, no freshness boost, no personalized recommendations.

---

## 6. LIMITATIONS

### SEO Indexing

| Requirement | Status |
|-------------|--------|
| Per-story URLs | ✅ `/stories/{slug}` via Vercel rewrite |
| XML sitemap | ✅ `/api/sitemap` with all public story slugs |
| Per-story OG meta tags | ❌ **Static generic tags only.** `index.html` has hardcoded `og:title: "SleepSeed"`. |
| Dynamic OG injection | ❌ Client-side `setMeta()` in LibraryStoryReader runs after hydration — **crawlers never see story-specific tags** |
| Server-side rendering | ❌ Pure SPA — `/stories/:slug` serves identical `index.html` for every story |
| `og:image` | ❌ No image tag at all — not even a generic one |
| Structured data (JSON-LD) | ❌ None |
| Canonical URLs | ❌ None |

**Result:** Sharing a SleepSeed library story on social media shows "SleepSeed — Personalised AI bedtime stories" with no story title, no preview image, and no story-specific description. This completely breaks viral sharing.

### Viral Sharing

| Requirement | Status |
|-------------|--------|
| Shareable URLs with previews | ❌ No OG tags (see above) |
| Story cover images | ❌ `cover_url` column exists but is always null for generated stories (only used for admin-uploaded books) |
| Referral tracking | ✅ `ref_code` parameter tracked in `story_reads`, conversion attribution system in place |
| Share rewards | ✅ Referral system: 5 conversions = 1 free month, 25 = 6 months |
| Native share API | ✅ Used in reader for link/text sharing |
| Embeddable story cards | ❌ None |
| Social preview cards | ❌ None |

### Personalization at Scale

| Requirement | Status |
|-------------|--------|
| Name substitution | ⚠️ Client-side string replacement (no word boundaries, no pronouns) |
| Pronoun handling | ❌ Not implemented |
| AI-powered personalization | ❌ Prompt exists (`buildPersonalisationPrompt`) but is unused |
| Saveable personalized versions | ❌ Personalisation is ephemeral — lost on page refresh |
| Shareable personalized versions | ❌ Cannot share a personalized story |
| Role-based character system | ❌ Characters are stored by name, not by role |

### Moderation

| Requirement | Status |
|-------------|--------|
| Content review before publishing | ❌ None — direct publish |
| Automated content scanning | ❌ None |
| Report mechanism | ❌ None (only thumbs down with note) |
| Admin review queue | ❌ None |
| Takedown capability | ⚠️ Admin can set `is_public = false` directly in Supabase |

---

## 7. PERFORMANCE & SCALABILITY

### Current Bottlenecks

**1. Vote recount is O(n):**
Every single vote triggers:
```
SELECT * FROM story_votes WHERE story_id = X
→ count up/down in JavaScript
→ UPDATE stories SET thumbs_up = N, thumbs_down = M WHERE id = X
```
At 10,000 votes per story, every new vote reads all 10,000 rows.

**2. Read count increment is non-atomic:**
```javascript
const currentCount = data.readCount || 0;
await supabase.from('stories').update({ read_count: currentCount + 1 });
```
This is a classic read-then-write race condition. Under concurrent reads, counts will be lost.

**3. No pagination in several surfaces:**
- StoryLibrary loads ALL stories at once
- NightCardLibrary loads ALL cards at once (capped at 30 by Supabase query)
- LibraryHome uses offset pagination but caps at 50 per query

**4. `book_data` JSONB is unbounded:**
No size limit or schema validation. A malformed or extremely large `book_data` could slow queries or crash the client.

**5. ilike search is unindexed:**
`title.ilike.%{search}%` performs a sequential scan. At 10,000+ stories, this becomes slow.

**6. Client-side localStorage cache has no size limit:**
`ss_library_cache` stores 20 stories' metadata. If stories have large metadata, localStorage could fill up (5MB browser limit).

### Scaling Risks

| Stories in Library | Expected Issue |
|--------------------|---------------|
| 100 | No issues |
| 1,000 | ilike search starts lagging (~200ms) |
| 10,000 | Vote recount becomes expensive; offset pagination degrades; search needs full-text index |
| 100,000 | Need cursor-based pagination; need materialized view for trending; need CDN for story content |

---

## 8. RECOMMENDATIONS

### For Role-Based Substitution

**Current state:** Characters are stored by name in `allChars`, and names are hardcoded into page text.

**Required changes:**
1. Add a `roles` array to `book_data`:
   ```json
   "roles": [
     {"role": "protagonist", "originalName": "Mia", "type": "child", "pronouns": "she/her"},
     {"role": "companion", "originalName": "Luna", "type": "creature"},
     {"role": "parent", "originalName": "Grandma", "type": "parent"}
   ]
   ```
2. Store page text with role tokens instead of literal names: `"{{protagonist}} found the key"` — this enables clean substitution without regex hacks
3. OR: use the existing `buildPersonalisationPrompt()` to generate AI-personalized versions server-side and cache them

### For SEO Pages

**Required changes:**
1. Add a Vercel Edge Function or serverless function at `/stories/[slug]` that:
   - Fetches story metadata from Supabase
   - Returns an HTML page with proper `<title>`, `og:title`, `og:description`, `og:image`, `og:url`, JSON-LD structured data
   - Either SSR the full page or serve a minimal HTML shell that crawlers can read
2. Generate or serve a cover image per story (static SVG render, or pre-generated PNG stored in `cover_url`)
3. Add canonical URL tags
4. Consider ISR (Incremental Static Regeneration) for high-traffic stories

### For Remix System

**Required changes:**
1. Add a `remixed_from` column to `stories` table (FK to original story ID)
2. Add a "Remix this story" CTA in the reader that:
   - Copies the `book_data` structure
   - Opens a simplified editor (swap names, adjust details, change ending)
   - Saves as a new story with attribution
3. Consider using `buildPersonalisationPrompt()` for AI-assisted remixing
4. Track remix chains for discovery ("12 families have made this story their own")

### For Viral Sharing Loops

**Required changes (priority order):**

1. **Per-story OG tags** — the single highest-impact change. Without this, every social share is dead on arrival. Requires an Edge Function or SSR middleware.

2. **Story cover images** — generate a 1200x630 OG image per story using:
   - The story's SVG scene (from `getSceneByVibe()`)
   - Title text overlay
   - SleepSeed branding
   - Store in Supabase storage or generate on-the-fly with a serverless image endpoint

3. **Share CTA with preview card** — show the user what the share will look like before they send it

4. **Referral landing page** — when someone clicks a shared link, show "Sophie's family loved this story" before the reader opens. This increases the emotional hook.

5. **"Made for your child" gate** — instead of the current personalisation gate (subscribed only), show it to everyone as a viral hook: "Enter your child's name to read a story made for them." This becomes the conversion moment.

### Additional Technical Recommendations

| Issue | Fix |
|-------|-----|
| Vote recount O(n) | Use Supabase RPC with `increment` or a PostgreSQL trigger on `story_votes` that maintains counts |
| Read count race condition | Use `UPDATE stories SET read_count = read_count + 1` (atomic increment) |
| ilike search | Add `pg_trgm` extension + GIN index on title, or use Supabase full-text search |
| Genre filter duplicates | Deduplicate GENRE_FILTERS — only 4 unique values among 10 pills |
| Stats row bug | "Reads" should show `bookOfDay?.readCount` or total reads, not story count |
| Cover palette instability | Hash story ID for palette selection instead of grid index |
| `book_data` typing | Add a Zod or JSON schema validator for story ingestion |
| `submitterDisplayName` | Join to `profiles` table in library queries, or remove the dead field |
| Missing `cover_url` in getFavourites | Add `cover_url` to the favourites join select |

---

## Summary: Architecture Readiness

| Capability | Current State | Effort to Add |
|------------|---------------|---------------|
| Basic public library | ✅ Working | — |
| Browse with filters | ⚠️ Working but filters are broken (duplicates, dead pills) | Low |
| Read stories | ✅ Working with rich reader | — |
| Vote/favourite | ✅ Working (scalability concerns) | — |
| Name personalization | ⚠️ Basic string replacement, subscribed only | Medium |
| Role-based substitution | ❌ Not implemented | High (data model change) |
| SEO / OG tags | ❌ Not implemented | Medium (Edge Function) |
| Cover image generation | ❌ Not implemented | Medium |
| Viral sharing previews | ❌ Not implemented | Medium (depends on OG + cover image) |
| AI personalization | ❌ Prompt exists, not wired | Medium |
| Content moderation | ❌ Not implemented | Medium-High |
| Remix system | ❌ Not implemented | High |
| Full-text search | ❌ Not implemented | Low (Supabase extension) |
| Trending algorithm | ❌ Simple read_count sort | Medium |
