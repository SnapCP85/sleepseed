import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const baseUrl = process.env.VITE_APP_URL || 'https://sleepseed-vercel.vercel.app';

  if (!supabaseUrl || !supabaseKey) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send('Missing Supabase config');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: stories } = await supabase
    .from('stories')
    .select('library_slug, submitted_at')
    .eq('is_public', true)
    .not('library_slug', 'is', null)
    .order('submitted_at', { ascending: false });

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/stories</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>`;

  if (stories) {
    for (const s of stories) {
      const lastmod = s.submitted_at ? s.submitted_at.split('T')[0] : today;
      xml += `
  <url>
    <loc>${baseUrl}/stories/${s.library_slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    }
  }

  xml += `
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(xml);
}
