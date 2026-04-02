import { createClient } from '@supabase/supabase-js';

/**
 * OG Meta Endpoint for Shared Night Cards
 *
 * Crawlers get HTML with OG tags for rich social previews.
 * Normal browsers get a 302 redirect to the SPA with ?nc=token.
 */

const CRAWLER_PATTERN = /bot|crawl|spider|facebook|twitter|slack|discord|telegram|whatsapp|linkedin|pinterest|preview|embed|curl|wget|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot/i;

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) { res.status(400).send('Missing token'); return; }

  const ua = req.headers['user-agent'] || '';
  const isCrawler = CRAWLER_PATTERN.test(ua);

  if (!isCrawler) {
    res.writeHead(302, { Location: `/?nc=${encodeURIComponent(token)}` });
    res.end();
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const baseUrl = process.env.VITE_APP_URL || 'https://sleepseed.vercel.app';

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(302, { Location: `/?nc=${encodeURIComponent(token)}` });
    res.end();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look up the share token → card_id
  const { data: share, error: shareErr } = await supabase
    .from('night_card_shares')
    .select('card_id')
    .eq('share_token', token)
    .single();

  if (shareErr || !share) {
    res.writeHead(302, { Location: `/?nc=${encodeURIComponent(token)}` });
    res.end();
    return;
  }

  // Fetch the card (only public-safe fields — never whisper)
  const { data: card, error: cardErr } = await supabase
    .from('night_cards')
    .select('hero_name, story_title, headline, quote, emoji, date')
    .eq('id', share.card_id)
    .single();

  if (cardErr || !card) {
    res.writeHead(302, { Location: `/?nc=${encodeURIComponent(token)}` });
    res.end();
    return;
  }

  const title = `${card.hero_name}'s Night Card`;
  const description = card.quote
    ? `"${card.quote.slice(0, 120)}${card.quote.length > 120 ? '...' : ''}" — A bedtime memory on SleepSeed.`
    : `A bedtime memory from ${card.hero_name} — made with SleepSeed.`;
  const canonicalUrl = `${baseUrl}/nightcard/${token}`;
  const ogImageUrl = `${baseUrl}/api/og-nightcard-image/${token}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title} — SleepSeed</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}"/>
  <meta property="og:url" content="${canonicalUrl}"/>
  <meta property="og:image" content="${ogImageUrl}"/>
  <meta property="og:image:width" content="600"/>
  <meta property="og:image:height" content="840"/>
  <meta property="og:site_name" content="SleepSeed"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}"/>
  <meta name="twitter:image" content="${ogImageUrl}"/>

  <link rel="canonical" href="${canonicalUrl}"/>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p><a href="${baseUrl}">SleepSeed — Bedtime stories that become memories</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
