export const maxDuration = 30;

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const key = process.env.ELEVENLABS_KEY;
  if (!key) return res.status(500).json({ error: { message: 'ELEVENLABS_KEY not set' } });

  // DELETE — remove a cloned voice
  if (req.method === 'DELETE') {
    const voiceId = req.query?.voice_id;
    if (!voiceId) return res.status(400).json({ error: { message: 'voice_id required' } });
    try {
      await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'DELETE',
        headers: { 'xi-api-key': key },
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message } });
    }
  }

  // POST — clone a voice from uploaded audio
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  // Collect raw request body (multipart FormData)
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);
  const contentType = req.headers['content-type'] || '';

  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: { message: 'Expected multipart/form-data' } });
  }

  try {
    const upstream = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'content-type': contentType,
      },
      body: rawBody,
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); }
    catch (_) { return res.status(502).json({ error: { message: `ElevenLabs error: ${text.slice(0, 200)}` } }); }

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: { message: `Upload failed: ${err.message}` } });
  }
}
