export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const key = process.env.ELEVENLABS_KEY;
  if (!key) {
    console.error('[TTS] ELEVENLABS_KEY not set in environment');
    return res.status(500).json({ error: { message: 'ELEVENLABS_KEY not set' } });
  }

  try {
    const { text, voiceId, speed } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const vid = voiceId || process.env.ELEVENLABS_VOICE_ID;
    if (!vid) return res.status(400).json({ error: { message: 'No voice ID' } });

    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.1, speed: speed || 1.0 },
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(upstream.status).json({ error: { message: err.slice(0, 200) } });
    }

    const buffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
