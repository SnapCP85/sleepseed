import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return res.status(500).json({ error: 'Missing credentials' });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const { path, contentType, base64 } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!path || !base64) return res.status(400).json({ error: 'Missing path or base64 data' });

    // Decode base64 to buffer
    const dataPrefix = base64.indexOf(',');
    const raw = dataPrefix >= 0 ? base64.slice(dataPrefix + 1) : base64;
    const buffer = Buffer.from(raw, 'base64');

    const { error } = await supabase.storage.from('photos').upload(path, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
