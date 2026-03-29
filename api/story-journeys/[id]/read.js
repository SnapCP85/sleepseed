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
  if (!resp.ok) throw new Error(data.error?.message || 'Anthropic API error');
  const text = data.content?.[0]?.text || '{}';
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

function classifyAndMergeMemoryBank(existing, newBeats) {
  const bank = {
    favoriteObjects: [...(existing.favoriteObjects || [])],
    recurringPlaces: [...(existing.recurringPlaces || [])],
    recurringPhrases: [...(existing.recurringPhrases || [])],
    emotionalMilestones: [...(existing.emotionalMilestones || [])],
    relationshipMoments: [...(existing.relationshipMoments || [])],
    sensoryImages: [...(existing.sensoryImages || [])],
  };

  const MAX_PER_CATEGORY = 5;
  const keywords = {
    favoriteObjects: /button|key|stone|ring|jar|lantern|acorn|feather|coin|shell|hat|boot|sock|map|book|toy|bag|cloth|needle/i,
    recurringPlaces: /forest|path|door|tree|meadow|cave|hill|river|ocean|garden|room|house|tower|bridge|field|pond|shore/i,
    recurringPhrases: /\bsaid\b|whispered|always|every time|the kind of|whenever|the way that/i,
    emotionalMilestones: /first time|finally|realised|understood|brave|scared|cried|laughed|proud|alone|together/i,
    relationshipMoments: /together|held|hugged|beside|found each other|shared|told|showed|waited for/i,
  };

  for (const beat of (newBeats || [])) {
    if (!beat || typeof beat !== 'string') continue;
    let placed = false;
    for (const [category, pattern] of Object.entries(keywords)) {
      if (pattern.test(beat) && !bank[category].includes(beat)) {
        if (bank[category].length < MAX_PER_CATEGORY) {
          bank[category].push(beat);
        } else {
          bank[category] = [...bank[category].slice(1), beat];
        }
        placed = true;
        break;
      }
    }
    if (!placed && !bank.sensoryImages.includes(beat)) {
      if (bank.sensoryImages.length < MAX_PER_CATEGORY) {
        bank.sensoryImages.push(beat);
      } else {
        bank.sensoryImages = [...bank.sensoryImages.slice(1), beat];
      }
    }
  }
  return bank;
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
    const {
      need, todayMemory, specificDetail, occasion, cast, feel, length,
      child, creature,
    } = req.body;

    if (!journeyId) return res.status(400).json({ error: 'Journey ID required' });
    if (!need) return res.status(400).json({ error: 'tonight.need is required' });

    const { data: journey, error: journeyError } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();
    if (journeyError || !journey) return res.status(404).json({ error: 'Journey not found' });

    const { data: chapters } = await supabase
      .from('story_journey_chapters')
      .select('read_number, chapter_title, summary, recap_text, teaser')
      .eq('story_journey_id', journeyId)
      .order('read_number', { ascending: true });

    const prompts = await import('../../../src/sleepseed-prompts.js');
    const {
      buildJourneyChapterPrompt,
      buildJourneyChapterQualityCheck,
      mapEmotionalGoalToGenre,
      getTemperature,
    } = prompts;

    const { primaryGenre } = mapEmotionalGoalToGenre(need, todayMemory, occasion);

    const input = {
      child: {
        name: child?.name || 'the child',
        ageBand: child?.ageBand || child?.ageDescription || '6-8',
        pronouns: child?.pronouns || 'they/them',
        traits: child?.traits || child?.personalityTags || [],
        weirdDetail: specificDetail || child?.weirdDetail,
        currentSituation: child?.currentSituation,
      },
      creature: {
        name: creature?.name || 'companion',
        virtue: creature?.virtue || '',
        storyPersonality: creature?.storyPersonality || '',
        lessonBeat: creature?.lessonBeat || '',
      },
      journey: {
        readNumber: journey.read_number,
        workingTitle: journey.working_title,
        storyBible: journey.story_bible || {},
        chapters: (chapters || []).map(c => ({
          readNumber: c.read_number,
          summary: c.summary || '',
        })),
        memoryBank: journey.memory_bank || {},
        unresolvedThreads: journey.unresolved_threads || [],
        resolvedThreads: journey.resolved_threads || [],
      },
      tonight: {
        need,
        primaryGenre,
        todayMemory,
        specificDetail,
        occasion,
        cast,
        feel,
        length: length || 'standard',
      },
    };

    const { system, user } = buildJourneyChapterPrompt(input);
    const temperature = getTemperature(primaryGenre);
    let chapter = await callAnthropic(system, user, 4096, temperature, anthropicKey);

    const { system: qcSys, user: qcUser } = buildJourneyChapterQualityCheck(chapter, journey.read_number);
    const qcResult = await callAnthropic(qcSys, qcUser, 600, 0.3, anthropicKey);

    if (qcResult.structural_fail || qcResult.revision_type === 'full_regenerate') {
      const revisedUser = user + `\n\nQUALITY REVISION REQUIRED:\n${qcResult.revision_notes}`;
      chapter = await callAnthropic(system, revisedUser, 4096, temperature, anthropicKey);
    } else if (qcResult.revision_type === 'surgical' && qcResult.revision_notes) {
      const surgicalSys = `You are making surgical improvements to a children's bedtime chapter. Apply only the specified changes. Preserve everything else. Return the complete improved chapter as valid JSON only.`;
      const surgicalUser = `CHAPTER:\n${JSON.stringify(chapter)}\n\nIMPROVEMENTS NEEDED:\n${qcResult.revision_notes}`;
      chapter = await callAnthropic(surgicalSys, surgicalUser, 4096, 0.7, anthropicKey);
    }

    const metadata = chapter.metadata || {};
    const newMemoryBank = classifyAndMergeMemoryBank(
      journey.memory_bank || {},
      metadata.memory_beats || []
    );
    const newUnresolvedThreads = metadata.unresolved_threads || [];
    const updatedResolvedThreads = [
      ...(journey.resolved_threads || []),
      ...(metadata.resolved_threads || []),
    ];
    const isBookComplete = journey.read_number === 7;
    const nextReadNumber = isBookComplete ? 7 : journey.read_number + 1;

    const { error: chapterError } = await supabase
      .from('story_journey_chapters')
      .insert({
        story_journey_id: journeyId,
        read_number: journey.read_number,
        chapter_title: chapter.chapter_title || chapter.chapterTitle || '',
        recap_text: chapter.recap_page?.text || '',
        teaser: chapter.chapter_opener_page?.teaser || chapter.chapterOpenerPage?.teaser || '',
        summary: metadata.chapter_summary || metadata.chapterSummary || '',
        mood_input: need,
        today_input: todayMemory || null,
        specific_detail_used: specificDetail || null,
        characters_used: metadata.characters_used || metadata.charactersUsed || [],
        memory_candidates: metadata.memory_beats || metadata.memoryBeats || [],
        unresolved_threads_after: newUnresolvedThreads,
        resolved_threads_in_chapter: metadata.resolved_threads || metadata.resolvedThreads || [],
        callbacks_used: metadata.callbacks_used || metadata.callbacksUsed || [],
        new_planted_details: metadata.new_planted_details || metadata.newPlantedDetails || [],
        full_chapter_json: chapter,
      });
    if (chapterError) throw chapterError;

    await supabase
      .from('story_journeys')
      .update({
        read_number: nextReadNumber,
        memory_bank: newMemoryBank,
        unresolved_threads: newUnresolvedThreads,
        resolved_threads: updatedResolvedThreads,
        status: isBookComplete ? 'completed' : 'active',
        completed_at: isBookComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', journeyId);

    return res.status(200).json({
      storyJourneyId: journeyId,
      readNumber: journey.read_number,
      chapter,
      isBookComplete,
      nextReadNumber: isBookComplete ? null : nextReadNumber,
    });

  } catch (error) {
    console.error('[story-journeys/read]', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
