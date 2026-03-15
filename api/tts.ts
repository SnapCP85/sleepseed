import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voiceId, speed = 1.0 } = req.body;

  // Use the voice ID from the request, or fall back to the configured narrator voice
  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!vid) return res.status(400).json({ error: 'No voice ID configured' });

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_KEY!,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.85,
            style: 0.1,
            speed,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'TTS failed' });
  }
}
