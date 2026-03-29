import { createClient } from '@supabase/supabase-js';

export const maxDuration = 120;

async function callAnthropic(system, userContent, maxTokens, temperature, key) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': key,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'Anthropic error');
  const text = data.content?.[0]?.text || '{}';
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_KEY not set' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Missing Supabase config' });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const journeyId = req.query.id;
    const { heroName, characterId, userId, newCreatureData } = req.body;

    const { data: journey } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();
    if (!journey) return res.status(404).json({ error: 'Journey not found' });

    const { data: chapters } = await supabase
      .from('story_journey_chapters')
      .select('read_number, chapter_title, summary, full_chapter_json')
      .eq('story_journey_id', journeyId)
      .order('read_number', { ascending: true });

    if (!chapters || chapters.length < 7) {
      return res.status(400).json({ error: 'Journey not complete — fewer than 7 chapters found' });
    }

    const prompts = await import('../../../src/sleepseed-prompts.js');
    const { buildBookStitchPrompt } = prompts;

    const chapterData = chapters.map(c => ({
      chapterTitle: c.chapter_title,
      summary: c.summary,
      storyPages: c.full_chapter_json?.story_pages || c.full_chapter_json?.storyPages || [],
    }));

    const { system: stitchSys, user: stitchUser } = buildBookStitchPrompt({
      journey: {
        workingTitle: journey.working_title,
        storyBible: journey.story_bible || {},
      },
      chapters: chapterData,
    });

    const stitchedBook = await callAnthropic(stitchSys, stitchUser, 6000, 0.7, anthropicKey);

    const today = new Date().toISOString().split('T')[0];
    const storyId = `journey_${journeyId.replace(/-/g, '').slice(0, 16)}_${Date.now()}`;
    const bookData = {
      title: stitchedBook.final_title || journey.working_title,
      heroName: heroName || 'the child',
      refrain: stitchedBook.final_refrain || '',
      allChars: [{ id: 'hero', name: heroName || 'the child', type: 'hero' }],
      pages: (stitchedBook.full_book_pages || []).map(p => ({ text: p.text })),
      dedicationLine: stitchedBook.dedication_line,
      journeyId,
    };

    const { data: savedBook, error: storyError } = await supabase
      .from('stories')
      .insert({
        id: storyId,
        user_id: journey.user_id,
        title: stitchedBook.final_title || journey.working_title,
        hero_name: heroName || 'the child',
        character_ids: [String(journey.character_id)],
        refrain: stitchedBook.final_refrain || null,
        date: today,
        book_data: bookData,
        is_public: false,
        cover_url: null,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (storyError) console.error('[complete] story insert error:', storyError);

    // Creature is saved by the client after the child names it (BookComplete.tsx)
    // newCreatureData is used for journey_summaries.unlocked_character_id only

    const summarySystem = `Generate a journey summary for a completed 7-read children's book. Return JSON only. No preamble.`;
    const summaryUser = `Book: "${stitchedBook.final_title}"
Emotional goal: ${journey.story_bible?.emotionalGoal || journey.story_bible?.emotional_goal || ''}
Chapters: ${chapters.map(c => `Read ${c.read_number}: ${c.summary}`).join(' | ')}
Memory highlights: ${JSON.stringify(stitchedBook.memory_highlights || [])}

Return JSON:
{
  "summary_title": "",
  "emotional_arc": "2-3 sentences about the emotional journey of this book",
  "highlights": [
    {"read_number": 1, "chapter_title": "", "highlight": "one sentence"}
  ]
}`;

    let summaryData = { summary_title: stitchedBook.final_title, emotional_arc: '', highlights: [] };
    try {
      summaryData = await callAnthropic(summarySystem, summaryUser, 1000, 0.7, anthropicKey);
    } catch (e) {
      console.error('[complete] summary generation error:', e);
    }

    const { data: journeySummary } = await supabase
      .from('journey_summaries')
      .insert({
        story_journey_id: journeyId,
        user_id: journey.user_id,
        character_id: String(journey.character_id),
        summary_title: summaryData.summary_title || stitchedBook.final_title || journey.working_title,
        emotional_arc: summaryData.emotional_arc || '',
        highlights: summaryData.highlights || [],
        night_card_reel: [],
        unlocked_character_id: newCreatureData?.creatureType || null,
        payload: {
          stitchedBook,
          seriesHooks: stitchedBook.series_hooks || [],
        },
      })
      .select('id')
      .single();

    await supabase
      .from('story_journeys')
      .update({
        status: 'completed',
        final_title: stitchedBook.final_title || journey.working_title,
        final_book_id: savedBook?.id || storyId,
        hatched_creature_id: newCreatureData?.creatureType || null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', journeyId);

    return res.status(200).json({
      finalBookId: savedBook?.id || storyId,
      hatchedCreatureId: newCreatureData?.creatureType || null,
      hatchedCreature: newCreatureData || null,
      journeySummaryId: journeySummary?.id || null,
      finalTitle: stitchedBook.final_title || journey.working_title,
      dedicationLine: stitchedBook.dedication_line || '',
      seriesHooks: stitchedBook.series_hooks || [],
    });

  } catch (error) {
    console.error('[story-journeys/complete]', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
