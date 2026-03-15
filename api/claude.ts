import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const key = process.env.ANTHROPIC_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_KEY not set in environment variables' } });
  }

  // req.body can be a string or object depending on Vercel's parser
  let bodyStr: string;
  try {
    bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  } catch (e: any) {
    return res.status(400).json({ error: { message: 'Failed to read request body' } });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: bodyStr,
    });

    const text = await upstream.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return res.status(502).json({
        error: { message: `Non-JSON from Anthropic (${upstream.status}): ${text.slice(0, 200)}` }
      });
    }

    return res.status(upstream.status).json(data);

  } catch (err: any) {
    return res.status(502).json({ error: { message: `Fetch failed: ${err.message}` } });
  }
}
