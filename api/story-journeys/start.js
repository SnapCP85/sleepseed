import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

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
    const {
      userId, characterId, creatureId,
      child, creature,
      emotionalGoal, bookType, world,
      recentEvent, specificDetail, importantThing,
      cast, seriesMode, seriesId,
    } = req.body;

    if (!userId || !characterId || !creatureId) {
      return res.status(400).json({ error: 'Missing required fields: userId, characterId, creatureId' });
    }

    // 1. Check for existing active journey — one per character, persists indefinitely
    const { data: existingJourney } = await supabase
      .from('story_journeys')
      .select('id, working_title, read_number, story_bible')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingJourney) {
      return res.status(200).json({
        storyJourneyId: existingJourney.id,
        workingTitle: existingJourney.working_title,
        readNumber: existingJourney.read_number,
        storyBible: existingJourney.story_bible,
        existingJourney: true,
      });
    }

    // 2. Import prompt functions from sleepseed-prompts.js
    const prompts = await import('../../src/sleepseed-prompts.js');
    const { buildStoryBiblePrompt, buildStoryBibleQualityCheck, mapEmotionalGoalToGenre } = prompts;

    // 3. Map emotional goal to genre
    const { primaryGenre, toneBlend } = mapEmotionalGoalToGenre(emotionalGoal, recentEvent);

    // 4. Generate StoryBible
    const bibleInput = {
      child: { ...child },
      creature: { ...creature },
      starter: {
        emotionalGoal,
        primaryGenre,
        bookType: bookType || toneBlend,
        world,
        recentEvent,
        specificDetail,
        importantThing,
        cast,
        seriesMode: seriesMode || 'fresh',
      },
    };

    const { system: bibleSystem, user: bibleUser } = buildStoryBiblePrompt(bibleInput);
    let bible = await callAnthropic(bibleSystem, bibleUser, 2500, 0.8, anthropicKey);

    // 5. Quality check
    const { system: qcSystem, user: qcUser } = buildStoryBibleQualityCheck(bible);
    const qcResult = await callAnthropic(qcSystem, qcUser, 600, 0.3, anthropicKey);

    // 6. Regenerate if quality check fails
    if (!qcResult.pass && qcResult.revision_notes) {
      const revisedInput = {
        ...bibleInput,
        starter: { ...bibleInput.starter, revisionNotes: qcResult.revision_notes },
      };
      const { system: revSys, user: revUser } = buildStoryBiblePrompt(revisedInput);
      bible = await callAnthropic(revSys, revUser, 2500, 0.8, anthropicKey);
    }

    // 7. Generate teaser sentence for the reveal moment
    const worldSnippet = (bible.core_world || '').split(',')[0].toLowerCase().replace('a ', '').replace('an ', '');
    const teaser = `A story about ${child.name} and ${creature.name} in ${worldSnippet}.`;

    // 8. Persist story_journey row
    const { data: journey, error } = await supabase
      .from('story_journeys')
      .insert({
        user_id: userId,
        character_id: String(characterId),
        creature_id: String(creatureId),
        status: 'active',
        read_number: 1,
        working_title: bible.working_title || 'Untitled Book',
        started_from: seriesMode && seriesMode !== 'fresh' ? 'series' : 'ritual',
        story_bible: bible,
        series_id: seriesId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      storyJourneyId: journey.id,
      workingTitle: bible.working_title,
      teaser,
      readNumber: 1,
      storyBible: bible,
      existingJourney: false,
    });

  } catch (error) {
    console.error('[story-journeys/start]', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
