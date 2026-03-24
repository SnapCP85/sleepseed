import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const DAY_THEMES = {
  0: { vibe: 'heartfelt', theme: 'family',     mood: 'calm',       label: 'Sunday Magic' },
  1: { vibe: 'adventure', theme: 'brave',      mood: 'exciting',   label: 'Monday Brave' },
  2: { vibe: 'funny',     theme: 'silly',      mood: 'funny',      label: 'Tuesday Silly' },
  3: { vibe: 'calm',      theme: 'friendship', mood: 'heartfelt',  label: 'Wednesday Kind' },
  4: { vibe: 'mysterious', theme: 'curious',   mood: 'mysterious', label: 'Thursday Wonder' },
  5: { vibe: 'exciting',  theme: 'adventure',  mood: 'exciting',   label: 'Friday Adventure' },
  6: { vibe: 'cosy',      theme: 'magical',    mood: 'calm',       label: 'Saturday Cosy' },
};

export default async function handler(req, res) {
  // Security: cron secret required
  const secret = req.headers['x-cron-secret'] || req.headers['X-Cron-Secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase config' });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const today = new Date().toISOString().split('T')[0];

  // Check if already exists for today
  const { data: existing } = await supabase
    .from('stories')
    .select('id, library_slug')
    .eq('is_book_of_day', true)
    .eq('book_of_day_date', today)
    .single();

  if (existing) {
    return res.status(200).json({ status: 'exists', slug: existing.library_slug });
  }

  const anthropicKey = process.env.ANTHROPIC_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: 'ANTHROPIC_KEY not set' });
  }

  const systemUserId = process.env.SYSTEM_USER_ID;
  if (!systemUserId) {
    return res.status(500).json({ error: 'SYSTEM_USER_ID not set' });
  }

  const dayOfWeek = new Date().getDay();
  const dayTheme = DAY_THEMES[dayOfWeek] || DAY_THEMES[0];

  const system = `You are a master children's bedtime story writer for SleepSeed. Write a personalised bedtime story for a child named Alex. The story should feel ${dayTheme.vibe} with a ${dayTheme.mood} tone. Theme: ${dayTheme.theme}. Target age: 5-7 years old. Length: standard (6-7 pages).

Return ONLY valid JSON with this exact structure:
{
  "title": "Story Title Here",
  "refrain": "A short repeating line that echoes through the story",
  "cover_prompt": "A description for a cover illustration",
  "pages": [
    {"text": "Page 1 text...", "illustration_prompt": "Description of illustration"},
    {"text": "Page 2 text...", "illustration_prompt": "Description of illustration"}
  ]
}

Write 6-7 pages. Each page should be 3-5 sentences. The story must be complete with a satisfying ending. Do not include any text outside the JSON.`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system,
        messages: [{ role: 'user', content: `Write today's Book of the Day: a ${dayTheme.label} story for Alex.` }],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(502).json({ error: data.error?.message || 'Claude API error' });
    }

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    if (!text) return res.status(502).json({ error: 'Empty response from Claude' });

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const story = JSON.parse(jsonStr);

    if (!story.title || !Array.isArray(story.pages) || story.pages.length === 0) {
      return res.status(502).json({ error: 'Invalid story structure' });
    }

    const slug = `book-of-the-day-${today}`;
    const storyId = `bod_${today.replace(/-/g, '')}`;

    const bookData = {
      title: story.title,
      heroName: 'Alex',
      refrain: story.refrain || '',
      allChars: [{ id: 'hero', name: 'Alex', type: 'hero' }],
      pages: story.pages.map(p => ({ text: p.text })),
    };

    const { error: insertError } = await supabase.from('stories').upsert({
      id: storyId,
      user_id: systemUserId,
      title: story.title,
      hero_name: 'Alex',
      character_ids: [],
      refrain: story.refrain || null,
      date: today,
      book_data: bookData,
      is_public: true,
      is_book_of_day: true,
      book_of_day_date: today,
      library_slug: slug,
      age_group: 'age5',
      vibe: dayTheme.vibe,
      mood: dayTheme.mood,
      theme: dayTheme.theme,
      submitted_at: new Date().toISOString(),
    });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({ status: 'created', slug, title: story.title });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
