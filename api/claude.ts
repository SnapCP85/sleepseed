import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always return JSON — never let Vercel serve its own error page
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const key = process.env.ANTHROPIC_KEY;
  if (!key) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_KEY is not configured. Add it in Vercel → Settings → Environment Variables, then redeploy.' }
    });
  }

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
  } catch (err: any) {
    return res.status(502).json({
      error: { message: `Could not reach Anthropic API: ${err.message}` }
    });
  }

  // Safely parse Anthropic's response
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (_) {
    return res.status(502).json({
      error: { message: `Unexpected response from Anthropic (${response.status}): ${text.slice(0, 200)}` }
    });
  }

  return res.status(response.status).json(data);
}
