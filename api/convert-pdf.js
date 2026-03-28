export const maxDuration = 120;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const key = process.env.ANTHROPIC_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_KEY not set' } });
  }

  try {
    const { text, title, heroName } = req.body;

    if (!text || !title) {
      return res.status(400).json({ error: { message: 'Missing required fields: text, title' } });
    }

    const prompt = `You are converting a children's book into SleepSeed story format.

The story is titled: ${title}
The main character's name is: ${heroName || 'the protagonist'}

Here is the full text extracted from the book:
${text.slice(0, 30000)}

Convert this into the following JSON format:
{
  "title": "${title}",
  "heroName": "${heroName || 'the protagonist'}",
  "pages": [
    { "text": "Page text here..." },
    { "text": "Next page text..." }
  ]
}

Rules:
- Split the text into 6 to 14 pages of natural reading length
- Each page should be 2 to 5 sentences — enough to read aloud in about 20 to 30 seconds
- Clean up any PDF extraction artefacts (hyphenation, odd line breaks, page numbers, headers/footers)
- Preserve the original story's language and tone exactly
- Do not summarise or shorten the content — include all of it
- Return ONLY the JSON object, no other text`;

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const responseText = await upstream.text();
    let data;
    try { data = JSON.parse(responseText); }
    catch (_) {
      return res.status(502).json({ error: { message: `Bad response from Anthropic: ${responseText.slice(0, 200)}` } });
    }

    if (data.error) {
      return res.status(502).json({ error: { message: data.error.message || 'Claude API error' } });
    }

    // Extract the JSON from Claude's response
    const content = data?.content?.[0]?.text || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: { message: 'Claude did not return valid JSON', raw: content.slice(0, 500) } });
    }

    let bookData;
    try { bookData = JSON.parse(jsonMatch[0]); }
    catch (_) {
      return res.status(422).json({ error: { message: 'Failed to parse Claude response as JSON', raw: jsonMatch[0].slice(0, 500) } });
    }

    // Validate structure
    if (!bookData.pages || !Array.isArray(bookData.pages) || bookData.pages.length === 0) {
      return res.status(422).json({ error: { message: 'Converted story has no pages', bookData } });
    }

    return res.status(200).json({ bookData });
  } catch (err) {
    return res.status(500).json({ error: { message: `Conversion failed: ${err.message}` } });
  }
}
