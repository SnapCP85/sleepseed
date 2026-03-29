import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Missing Supabase config' });

  try {
    const { userId, characterId, journeyId, title } = req.body;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: journey } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();
    if (!journey) return res.status(404).json({ error: 'Journey not found' });

    const { data: series, error } = await supabase
      .from('story_series')
      .insert({
        user_id: userId,
        character_id: String(characterId),
        title: title || journey.final_title || journey.working_title,
        core_world: journey.story_bible?.coreWorld || journey.story_bible?.core_world || '',
        recurring_characters: journey.story_bible?.allowedCharacters || journey.story_bible?.allowed_characters || [],
        recurring_objects: journey.story_bible?.plantedDetails || journey.story_bible?.planted_details || [],
        recurring_themes: journey.story_bible?.toneProfile || journey.story_bible?.tone_profile || [],
        tone_profile: journey.story_bible?.toneProfile || journey.story_bible?.tone_profile || [],
        book_ids: [journey.final_book_id || journeyId],
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ seriesId: series.id, series });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
