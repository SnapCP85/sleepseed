import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Missing Supabase config' });

  try {
    const { id } = req.query;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: journey, error } = await supabase
      .from('story_journeys')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !journey) return res.status(404).json({ error: 'Journey not found' });

    const { data: chapters } = await supabase
      .from('story_journey_chapters')
      .select('*')
      .eq('story_journey_id', id)
      .order('read_number', { ascending: true });

    return res.status(200).json({ ...journey, chapters: chapters || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
