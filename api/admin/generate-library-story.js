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

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin gate
  const adminEmail = process.env.VITE_ADMIN_EMAIL;
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
    // Import the real SleepSeed prompt system
    const prompts = await import('../../src/sleepseed-prompts.js');
    const { buildStoryPrompt, buildQualityCheckPrompt, buildRegenerationPrompt, buildTitlePrompt } = prompts;

    // ── Step 1: Generate story using real SleepSeed generator ────────────
    const { system, user } = buildStoryPrompt({ ...brief, asChunks: true });
    const temperature = brief.genre === 'therapeutic' ? 0.75
      : ['wonder', 'comedy'].includes(brief.genre) ? 0.9
      : 0.85;

    let rawText = await callAnthropic(system, user, 6000, temperature, anthropicKey);
    let storyData;
    try {
      storyData = parseJSON(rawText);
    } catch {
      // If JSON parse fails, treat as prose — wrap in chunks
      const lines = rawText.split('\n').filter(l => l.trim());
      const title = lines[0] || brief.situation;
      storyData = {
        title: title.replace(/^#\s*/, ''),
        chunks: lines.slice(1).filter(l => l.trim()),
      };
    }

    if (!storyData.chunks || storyData.chunks.length === 0) {
      return res.status(500).json({ error: 'Story generation returned empty content' });
    }

    const fullText = storyData.chunks.join('\n\n');

    // ── Step 2: Quality check using real SleepSeed QC ────────────────────
    const { system: qcSystem, user: qcUser } = buildQualityCheckPrompt(fullText, brief);
    const qcRaw = await callAnthropic(qcSystem, qcUser, 1200, 0.3, anthropicKey);
    let qualityResult;
    try {
      qualityResult = parseJSON(qcRaw);
    } catch {
      qualityResult = { overallVerdict: 'PASS_WITH_NOTES', score: 7, topIssue: 'QC parse failed' };
    }

    // ── Step 3: Regenerate if failed ─────────────────────────────────────
    let regenerated = false;
    if (qualityResult.overallVerdict === 'FAIL' && qualityResult.score < 7) {
      const { system: regenSys, user: regenUser } = buildRegenerationPrompt(fullText, qualityResult, brief);
      const revisedRaw = await callAnthropic(regenSys, regenUser, 6000, 0.8, anthropicKey);

      // Re-parse revised story
      const revisedLines = revisedRaw.split('\n').filter(l => l.trim());
      const revisedTitle = revisedLines[0]?.replace(/^#\s*/, '') || storyData.title;
      storyData = {
        title: revisedTitle,
        chunks: revisedLines.slice(1).filter(l => l.trim()),
      };
      regenerated = true;

      // Re-run quality check on revised version
      const revisedFullText = storyData.chunks.join('\n\n');
      const { system: qc2Sys, user: qc2User } = buildQualityCheckPrompt(revisedFullText, brief);
      const qc2Raw = await callAnthropic(qc2Sys, qc2User, 1200, 0.3, anthropicKey);
      try {
        qualityResult = parseJSON(qc2Raw);
      } catch {
        qualityResult = { overallVerdict: 'PASS_WITH_NOTES', score: 7, topIssue: 'QC2 parse failed' };
      }
    }

    // ── Step 4: Generate title options ────────────────────────────────────
    let titleOptions = [storyData.title];
    try {
      const { system: titleSys, user: titleUser } = buildTitlePrompt(fullText);
      const titleRaw = await callAnthropic(titleSys, titleUser, 300, 0.9, anthropicKey);
      const titleData = parseJSON(titleRaw);
      if (titleData.titles?.length > 0) {
        titleOptions = [storyData.title, ...titleData.titles];
      }
    } catch {
      // Keep original title
    }

    // ── Step 5: Build bookData in SleepSeed format ───────────────────────
    const finalTitle = storyData.title;
    const storyId = `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const slug = slugify(finalTitle) + '-' + storyId.slice(-6);

    const bookData = {
      title: finalTitle,
      heroName: brief.protagonistName || 'the child',
      pages: storyData.chunks.map((chunk, i) => ({
        text: chunk,
        pageNumber: i + 1,
      })),
      refrain: storyData.refrain || null,
      metadata: {
        genre: brief.genre,
        wordCount: fullText.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
        bucket: brief._bucket || 'uncategorized',
        conceptId: brief._conceptId || null,
        qualityScore: qualityResult.score,
        qualityVerdict: qualityResult.overallVerdict,
        regenerated,
      },
    };

    // ── Step 6: Save to stories table ────────────────────────────────────
    const row = {
      id: storyId,
      user_id: adminUserId || '00000000-0000-0000-0000-000000000000',
      title: finalTitle,
      hero_name: brief.protagonistName || 'the child',
      character_ids: [],
      date: new Date().toISOString().split('T')[0],
      book_data: bookData,
      is_public: false,  // starts unpublished — admin approves
      library_slug: slug,
      age_group: brief._ageGroup || 'age5',
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
        ageGroup: brief._ageGroup,
        wordCount: bookData.metadata.wordCount,
        pageCount: bookData.pages.length,
        qualityScore: qualityResult.score,
        qualityVerdict: qualityResult.overallVerdict,
        qualityChecks: qualityResult.checks,
        topIssue: qualityResult.topIssue,
        regenerated,
        titleOptions,
        bookData,
      },
    });
  } catch (err) {
    console.error('[generate-library-story] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
