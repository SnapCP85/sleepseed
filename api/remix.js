import { createClient } from '@supabase/supabase-js';

/**
 * Story Remix API
 *
 * Takes a public story ID + child profile, returns a personalized version
 * using the buildPersonalisationPrompt from sleepseed-prompts.js.
 *
 * POST /api/remix
 * Body: { storyId, childName, childAge?, childDetail?, childInterest?, childFear? }
 * Returns: { title, heroName, pages, refrain, remixedFrom }
 */

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { storyId, childName, childAge, childDetail, childInterest, childFear } = req.body || {};

  if (!storyId || !childName?.trim()) {
    res.status(400).json({ error: 'storyId and childName are required' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  // 1. Fetch the original story
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: story, error: fetchErr } = await supabase
    .from('stories')
    .select('id, title, hero_name, book_data, refrain, age_group, vibe, mood')
    .eq('id', storyId)
    .eq('is_public', true)
    .single();

  if (fetchErr || !story) {
    res.status(404).json({ error: 'Story not found or not public' });
    return;
  }

  const bookData = story.book_data;
  if (!bookData?.pages?.length) {
    res.status(400).json({ error: 'Story has no pages' });
    return;
  }

  // 2. Build the personalization prompt (activating the unused buildPersonalisationPrompt)
  const pages = bookData.pages;
  const fullText = `${bookData.title}\n\n${pages.map(p => p.text || '').join('\n\n')}`;

  const { system, user } = buildPersonalisationPrompt(fullText, {
    childName: childName.trim(),
    childAge: childAge || undefined,
    childDetail: childDetail || undefined,
    childInterest: childInterest || undefined,
    childFear: childFear || undefined,
  });

  // 3. Call Claude
  let personalizedText;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[remix] Claude error:', response.status, errBody);
      res.status(502).json({ error: 'Story generation failed' });
      return;
    }

    const result = await response.json();
    personalizedText = result.content?.[0]?.text || '';
  } catch (e) {
    console.error('[remix] API call failed:', e);
    res.status(502).json({ error: 'Story generation failed' });
    return;
  }

  if (!personalizedText.trim()) {
    res.status(502).json({ error: 'Empty response from AI' });
    return;
  }

  // 4. Split the personalized text back into pages
  // The AI returns: title on first line, blank line, then prose.
  // We split into the same number of pages as the original.
  const lines = personalizedText.split('\n').filter(l => l.trim());
  const personalizedTitle = lines[0] || bookData.title;
  const proseLines = lines.slice(1);
  const prose = proseLines.join('\n');

  // Split prose into N chunks matching original page count
  const originalPageCount = pages.length;
  const personalizedPages = splitIntoPages(prose, originalPageCount);

  // 5. Build the remixed book data
  const remixedBookData = {
    title: personalizedTitle,
    heroName: childName.trim(),
    pages: personalizedPages.map(text => ({ text })),
    refrain: bookData.refrain || '',
    allChars: updateChars(bookData.allChars, story.hero_name, childName.trim()),
    remixedFrom: storyId,
    remixedFromTitle: story.title,
    remixedFromSlug: undefined, // Caller can set this from the story's librarySlug
  };

  res.status(200).json(remixedBookData);
}

/**
 * Split a prose text into N roughly equal pages.
 * Splits on paragraph boundaries (double newlines) first,
 * then on sentence boundaries if needed.
 */
function splitIntoPages(prose, targetCount) {
  if (targetCount <= 1) return [prose];

  // Try paragraph-based splitting first
  const paragraphs = prose.split(/\n\s*\n/).filter(p => p.trim());

  if (paragraphs.length >= targetCount) {
    // Group paragraphs into targetCount chunks
    const chunkSize = Math.ceil(paragraphs.length / targetCount);
    const pages = [];
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      pages.push(paragraphs.slice(i, i + chunkSize).join('\n\n'));
    }
    // Merge any extras into the last page
    while (pages.length > targetCount) {
      const extra = pages.pop();
      pages[pages.length - 1] += '\n\n' + extra;
    }
    return pages;
  }

  // Fallback: split by sentences
  const sentences = prose.match(/[^.!?]+[.!?]+/g) || [prose];
  const sentencesPerPage = Math.ceil(sentences.length / targetCount);
  const pages = [];
  for (let i = 0; i < sentences.length; i += sentencesPerPage) {
    pages.push(sentences.slice(i, i + sentencesPerPage).join(' ').trim());
  }
  while (pages.length > targetCount) {
    const extra = pages.pop();
    pages[pages.length - 1] += ' ' + extra;
  }
  return pages;
}

/**
 * Update the allChars array with the new protagonist name.
 */
function updateChars(allChars, originalHeroName, newHeroName) {
  if (!Array.isArray(allChars)) return [{ id: 'hero', name: newHeroName, type: 'hero' }];
  return allChars.map(c => {
    if (c.type === 'hero' || c.name === originalHeroName) {
      return { ...c, name: newHeroName };
    }
    return c;
  });
}

/**
 * Inline copy of buildPersonalisationPrompt from sleepseed-prompts.js
 * (API routes can't import ES modules from src/ in the Vercel serverless environment)
 */
function buildPersonalisationPrompt(originalStory, childProfile) {
  const { childName, childAge, childDetail, childFear, childInterest } = childProfile;

  const system = `You are personalising a SleepSeed bedtime story for a specific child.
Your job is surgical: weave in the child's name and details so the story feels written for them.
Do NOT change the story's structure, arc, or emotional shape.
Do NOT change what happens — only who it happens to, and the specific details around them.
The story should feel discovered, not assembled. The personalisation should be invisible.`;

  const user = `Personalise this story for ${childName}.

ORIGINAL STORY:
"""
${originalStory}
"""

CHILD PROFILE:
- Name: ${childName}
${childAge     ? `- Age: ${childAge}` : ''}
${childDetail  ? `- Something specific about them: ${childDetail}` : ''}
${childFear    ? `- Current fear or worry: ${childFear}` : ''}
${childInterest? `- Current obsession or favourite thing: ${childInterest}` : ''}

PERSONALISATION RULES:
1. Replace the protagonist's name with ${childName} throughout.
2. Weave in one specific detail from the child profile naturally — don't announce it.
3. If a detail from the profile connects to the planted detail or quirk, use that connection.
4. Do not change what happens in the story — only who it happens to.
5. The personalisation should feel like it was always there.

Return the personalised story as flowing prose — title on the first line, then the story.
Keep the same number of natural page breaks (blank lines between sections) as the original.`;

  return { system, user };
}
