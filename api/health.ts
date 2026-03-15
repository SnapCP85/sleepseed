import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasKey = !!process.env.ANTHROPIC_KEY;
  const keyPrefix = process.env.ANTHROPIC_KEY?.slice(0, 8) || 'not set';
  res.status(200).json({
    status: 'ok',
    anthropic_key_set: hasKey,
    anthropic_key_prefix: keyPrefix,
    node_version: process.version,
  });
}
