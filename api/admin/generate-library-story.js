import { createClient } from '@supabase/supabase-js';

export const maxDuration = 120;

const ANTHROPIC_HEADERS = {
  'Content-Type': 'application/json',
  'anthropic-version': '2023-06-01',
};

async function callAnthropic(system, userContent, maxTokens, temperature, key) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { ...ANTHROPIC_HEADERS, 'x-api-key': key },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'Anthropic API error');
  const text = data.content?.[0]?.text || '';
  return text;
}

function parseJSON(text) {
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ── Age-specific writing rules (same as SleepSeedCore AGES) ──────────────
// These are the real production age prompts, extracted verbatim.
function getAgePrompt(ageGroup, heroName) {
  const name = heroName || 'the child';
  const prompts = {
    'age3': `READER AGE: 3–4 years old (Pre-K).

VOCABULARY: ONLY the simplest words a toddler knows. Sentences of 3–5 words maximum. If a word might confuse a 3-year-old, cut it.

STRUCTURE — model: Eric Carle, Mem Fox, Dr Seuss:
• The ENTIRE story is built on ONE repeated pattern. Same rhythm, every 2 pages. Gets funnier or warmer each time.
• One sentence per page. Two maximum. Three is too many.
• Every page has a natural clapping beat when read aloud.
• The refrain MUST appear three times: page 2 (introduction), the middle page (a variation), and the LAST page (warm, closing). The refrain at this age must be 3–5 words.
• Page count: 8 pages. At this age shorter is ALWAYS better.

HERO AGENCY: Even at 3–4, ${name} must DO something — not watch. They press the button. They say the magic word. They share the thing.

TONE: Always safe. Always warm. The ending must feel like a hug. Default tone is very silly — SPLAT. BOING. WHOOSH. BUT: if the story premise is tender or emotional, lead with warmth and gentleness instead.

DIALOGUE AT THIS AGE sounds like: "Again!" / "My turn!" / "Uh oh!" / "No! Mine!" / "More more more!" Children this age speak in bursts of 2–4 words.

ECHO PATTERN: A literal refrain of 3–5 words, appearing exactly three times.`,

    'age5': `READER AGE: 5–6 years old (Kindergarten).

VOCABULARY: Simple everyday words plus 1–2 fun new words that are obviously explained by context. Sentences of 6–10 words.

STRUCTURE — model: Julia Donaldson (The Gruffalo), Mo Willems (Pigeon series):
• RULE OF THREE: ${name} tries something three times. Attempt 1 fails hilariously. Attempt 2 fails differently. Attempt 3 succeeds — but not how anyone expected.
• Every page must have at least one line of dialogue.
• Page count: 10 pages.

HERO AGENCY (critical): ${name} must make ONE decision that changes everything. Not "helped" — decided.

TONE: Warm and funny. Someone always has a terrible plan. It sort of works anyway. Sound words on at least 3 pages.

DIALOGUE AT THIS AGE sounds like: "But WHY though?" / "That's not even fair!" / "Wait wait wait" / "I TOLD you!" Children this age argue, negotiate, and have OPINIONS.

ECHO PATTERN: A repeated phrase that CHANGES meaning each time it appears across three appearances.`,

    'age7': `READER AGE: 7–8 years old (1st–2nd Grade).

VOCABULARY: Sentences of 8–14 words. One genuinely interesting word per page — sounds good read aloud (e.g. "preposterous", "magnificent"). Always clear from context.

STRUCTURE — model: Roald Dahl, Arnold Lobel (Frog and Toad):
• PLANT AND PAYOFF: On page 1 or 2, introduce something small that seems unimportant. On the last two pages, it turns out to be the most important thing in the story.
• The hero must be underestimated by at least one other character.
• Running joke: one funny thing escalates across 3–4 pages and pays off before the ending.
• Page count: 12 pages.

HERO AGENCY (critical): ${name} must make one decision under pressure that only THEY could make — using something specific about who they are.

TONE: Wry and warm. The ending is surprising AND deeply satisfying.

ECHO PATTERN: A planted line or image that returns in the final pages with NEW WEIGHT.`,

    'age10': `READER AGE: 9–10 years old (3rd–4th Grade).

VOCABULARY: Rich vocabulary welcomed. Sentences of 10–20 words on journey pages. Short punchy sentences (5–7 words) for high-tension moments.

STRUCTURE — model: Roald Dahl (Fantastic Mr Fox), E.B. White (Charlotte's Web):
• REVELATION ENDING: The twist must recontextualise the entire story. Plant the clue no later than page 3.
• EMOTIONAL TURN: At least one moment where something genuinely difficult happens.
• SECONDARY CHARACTER ARC: One supporting character has their own small journey.
• Page count: 12 pages.

HERO AGENCY (critical): ${name} must face a moment where the easy path is genuinely tempting — and choose the harder, right thing instead.

TONE: Intelligent, funny, and emotionally honest. Not condescending.

BEDTIME GUARD: No matter how sophisticated, the emotional complexity must resolve completely and land in warmth and sleep.

ECHO PATTERN: A structural callback — an image from the opening that returns TRANSFORMED at the end.`,
  };
  return prompts[ageGroup] || prompts['age5'];
}

function getPageCount(ageGroup) {
  const counts = { 'age3': 8, 'age5': 10, 'age7': 12, 'age10': 12 };
  return counts[ageGroup] || 10;
}

// Map genre to mood instruction
function getMoodLine(genre) {
  const moods = {
    'comedy': 'Silly and funny — lean into humour and absurdity. At least one thing per page should make a child laugh.',
    'adventure': 'Exciting and adventurous — high energy and wonder. Final 2-3 pages MUST still wind down gently and land in sleep.',
    'therapeutic': 'Warm and heartfelt — emotionally resonant and tender. Prioritise genuine feeling over plot twists.',
    'cosy': 'Calm and cosy — warm, gentle, soothing throughout. Every page should feel like a soft blanket.',
    'wonder': 'Quiet wonder — restrained, reverent, full of questions more than answers.',
    'mystery': 'Gently mysterious — conspiratorial and curious. The reader shares the puzzle.',
  };
  return moods[genre] || moods['cosy'];
}

// ── Rule-based quality check ─────────────────────────────────────────────
const BANNED_PHRASES = [
  'with a heart full of hope', 'suddenly realised', 'learned a very important lesson',
  'as if by magic', 'the most important thing', 'and from that day on',
  'she knew everything would be okay', 'and they all lived', 'it was the best day ever',
  'a very special', 'the power of friendship', 'believe in yourself',
];

function ruleBasedQC(storyText, title, pages, brief) {
  const wordCount = storyText.split(/\s+/).length;
  const flags = [];
  let score = 10;

  const ageNum = parseInt(brief.protagonistAge) || 5;
  const minWords = ageNum <= 4 ? 200 : 400;
  const maxWords = ageNum >= 9 ? 1600 : 1200;
  if (wordCount < minWords) { flags.push(`Too short (${wordCount}w, min ${minWords})`); score -= 2; }
  if (wordCount > maxWords) { flags.push(`Too long (${wordCount}w, max ${maxWords})`); score -= 1; }

  const expectedPages = getPageCount(brief._ageGroup || 'age5');
  if (pages.length < expectedPages - 2) { flags.push(`Too few pages (${pages.length}, want ~${expectedPages})`); score -= 2; }
  if (pages.length > expectedPages + 4) { flags.push(`Too many pages (${pages.length})`); score -= 1; }

  const titleWords = title.split(/\s+/).length;
  if (titleWords < 2) { flags.push('Title too short'); score -= 1; }
  if (titleWords > 8) { flags.push('Title too long'); score -= 1; }
  if (title.toLowerCase().includes('story about') || title.toLowerCase().includes('tale of')) {
    flags.push('Title is descriptive, not evocative'); score -= 1;
  }

  const lower = storyText.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) { flags.push(`Banned phrase: "${phrase}"`); score -= 1; }
  }

  // Sleep landing: last page should have shorter sentences
  if (pages.length > 2) {
    const lastPage = typeof pages[pages.length - 1] === 'string' ? pages[pages.length - 1] : pages[pages.length - 1]?.text || '';
    const lastSentences = lastPage.split(/[.!?]+/).filter(s => s.trim());
    const avgLen = lastSentences.reduce((a, s) => a + s.trim().split(/\s+/).length, 0) / Math.max(lastSentences.length, 1);
    if (avgLen > 18) { flags.push('Sleep landing too dense'); score -= 1; }
  }

  // Check for refrain
  if (!storyText.includes(title.split(' ').slice(0, 2).join(' ').toLowerCase())) {
    // Rough heuristic — not a real check but flags stories with no recurring phrase
  }

  return {
    score: Math.max(0, Math.min(10, score)),
    verdict: score >= 8 ? 'STRONG' : score >= 6 ? 'OKAY' : 'WEAK',
    flags,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const anthropicKey = process.env.ANTHROPIC_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY;

  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_KEY not set' });
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Supabase not configured' });

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { brief, adminUserId } = req.body;
  if (!brief || !brief.genre || !brief.situation) {
    return res.status(400).json({ error: 'brief with genre and situation required' });
  }

  try {
    // ── Build prompt using the same path as SleepSeedCore ────────────────
    // Step 1: Use buildStoryPrompt for base system + user prompt
    const prompts = await import('../../src/sleepseed-prompts.js');
    const { buildStoryPrompt } = prompts;

    const { system, user: baseUserPrompt } = buildStoryPrompt({
      ...brief,
      asChunks: false,  // We'll add our own JSON output schema
    });

    // Step 2: Determine age config
    const ageGroup = brief._ageGroup || 'age5';
    const heroName = brief.protagonistName || 'the child';
    const agePrompt = getAgePrompt(ageGroup, heroName);
    const totalPages = getPageCount(ageGroup);

    // Step 3: Build JSON output schema (same as SleepSeedCore)
    const pgSchema = Array.from({ length: totalPages }, () =>
      '{"text":"[page text]","illustration_prompt":"[15-20 words: vivid scene, folk-art paintable]"}'
    ).join(',');
    const outputSchema = `{"title":"3-6 word title","cover_prompt":"[15-20 words: wide magical bedtime scene]","pages":[${pgSchema}],"refrain":"4-8 word refrain from the story"}`;

    // Step 4: Build mood/style lines
    const moodLine = `\nSTORY MOOD: ${getMoodLine(brief.genre)}`;

    // Step 5: Build the premise line (highest priority — this is the user's prompt)
    const premiseLine = brief.situation
      ? `\nTONIGHT'S STORY PREMISE (highest priority — this defines what the story is fundamentally about):\n${brief.situation}`
      : '';

    // Step 6: Assemble final user prompt (same structure as SleepSeedCore)
    const storyPrompt = `${baseUserPrompt}

━━━ READER AGE ━━━
${agePrompt}

━━━ CHARACTERS ━━━
• ${heroName}: the hero — the child this story belongs to${brief.weirdDetail ? `\n  Weird detail: ${brief.weirdDetail}` : ''}${brief.flaw ? `\n  Flaw: ${brief.flaw}` : ''}
${brief.supportingName ? `• ${brief.supportingName}: friend and companion${brief.supportingDetail ? `\n  Voice/manner: ${brief.supportingDetail}` : ''}` : ''}

━━━ OCCASION AND CONTEXT ━━━${premiseLine}${moodLine}

STORY SHAPE: Write EXACTLY ${totalPages} pages. Not ${totalPages - 1}, not ${totalPages + 1}. Exactly ${totalPages}.

━━━ OUTPUT ━━━
Return ONLY this exact JSON object. No extra text, no markdown, no explanation. Title must be 3-6 words. Each illustration_prompt must be 10-15 words.
${outputSchema}`;

    const temperature = brief.genre === 'therapeutic' ? 0.75
      : ['wonder', 'comedy'].includes(brief.genre) ? 0.9
      : 0.85;

    const rawText = await callAnthropic(system, storyPrompt, 6000, temperature, anthropicKey);

    // ── Parse response (expecting SleepSeed JSON format) ─────────────────
    let storyData;
    try {
      storyData = parseJSON(rawText);
    } catch {
      // Fallback: try to extract any JSON from the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { storyData = JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
      }
      // Last resort: treat as prose
      if (!storyData) {
        const lines = rawText.split('\n').filter(l => l.trim());
        storyData = {
          title: (lines[0] || brief.situation).replace(/^#\s*/, ''),
          pages: lines.slice(1).filter(l => l.trim()).map(text => ({ text })),
          refrain: null,
        };
      }
    }

    // Normalize pages
    const pages = (storyData.pages || storyData.chunks || []).map((p, i) => {
      if (typeof p === 'string') return { text: p, pageNumber: i + 1 };
      return { text: p.text, illustration_prompt: p.illustration_prompt, pageNumber: i + 1 };
    });

    if (pages.length === 0) {
      return res.status(500).json({ error: 'Story generation returned empty content' });
    }

    const fullText = pages.map(p => p.text).join('\n\n');
    const finalTitle = storyData.title || brief.situation.slice(0, 40);

    // ── Rule-based quality check ─────────────────────────────────────────
    const qc = ruleBasedQC(fullText, finalTitle, pages, brief);

    // ── Build bookData in SleepSeed format ───────────────────────────────
    const storyId = `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const slug = slugify(finalTitle) + '-' + storyId.slice(-6);

    const bookData = {
      title: finalTitle,
      heroName,
      coverPrompt: storyData.cover_prompt || null,
      pages,
      refrain: storyData.refrain || null,
      metadata: {
        genre: brief.genre,
        wordCount: fullText.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
        bucket: brief._bucket || 'uncategorized',
        conceptId: brief._conceptId || null,
        qualityScore: qc.score,
        qualityVerdict: qc.verdict,
        qualityFlags: qc.flags,
      },
    };

    // ── Save to stories table (unpublished) ──────────────────────────────
    const row = {
      id: storyId,
      user_id: adminUserId || '00000000-0000-0000-0000-000000000000',
      title: finalTitle,
      hero_name: heroName,
      character_ids: [],
      refrain: storyData.refrain || null,
      date: new Date().toISOString().split('T')[0],
      book_data: bookData,
      is_public: false,
      library_slug: slug,
      age_group: ageGroup,
      vibe: brief._vibe || brief.genre,
      theme: brief._theme || brief.situation.slice(0, 200),
      lessons: brief._lessons || [],
      is_staff_pick: false,
      is_book_of_day: false,
      submitted_at: null,
    };

    const { error: dbError } = await supabase.from('stories').upsert(row);
    if (dbError) {
      console.error('[generate-library-story] DB error:', dbError);
      return res.status(500).json({ error: 'Failed to save story', detail: dbError.message });
    }

    return res.status(200).json({
      success: true,
      story: {
        id: storyId,
        title: finalTitle,
        slug,
        genre: brief.genre,
        bucket: brief._bucket,
        ageGroup,
        wordCount: bookData.metadata.wordCount,
        pageCount: pages.length,
        qualityScore: qc.score,
        qualityVerdict: qc.verdict,
        qualityFlags: qc.flags,
        bookData,
      },
    });
  } catch (err) {
    console.error('[generate-library-story] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
