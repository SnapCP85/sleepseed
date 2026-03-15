export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    anthropic_key_set: !!process.env.ANTHROPIC_KEY,
    anthropic_key_prefix: process.env.ANTHROPIC_KEY?.slice(0, 10) || 'not set',
    elevenlabs_key_set: !!process.env.ELEVENLABS_KEY,
    node_version: process.version,
  });
}
