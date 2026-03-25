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
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

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
    let data;
    try { data = JSON.parse(text); }
    catch (_) {
      return res.status(502).json({ error: { message: `Bad response from Anthropic (${upstream.status}): ${text.slice(0,200)}` } });
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: { message: `Fetch failed: ${err.message}` } });
  }
}
