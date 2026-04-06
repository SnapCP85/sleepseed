import { createClient } from '@supabase/supabase-js';

/**
 * OG Meta Endpoint for Story Detail Pages
 *
 * Crawlers (Facebook, Twitter, Slack, iMessage, etc.) get HTML with proper
 * og:title, og:description, og:image tags for rich social previews.
 *
 * Normal browsers get a 302 redirect to the SPA with ?library=slug.
 */

const AGE_LABELS = {
  age3: 'ages 3–5',
  age5: 'ages 5–8',
  age7: 'ages 7–10',
  age10: 'ages 9+',
};

const VIBE_LABELS = {
  'calm-cosy': 'cosy',
  'warm-funny': 'funny',
  'exciting': 'adventure',
  'heartfelt': 'heartfelt',
  'mysterious': 'wonder',
};

const CRAWLER_PATTERN = /bot|crawl|spider|facebook|twitter|slack|discord|telegram|whatsapp|linkedin|pinterest|preview|embed|curl|wget|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Discordbot/i;

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) { res.status(400).send('Missing slug'); return; }

  const ua = req.headers['user-agent'] || '';
  const isCrawler = CRAWLER_PATTERN.test(ua);

  if (!isCrawler) {
    // Normal browser — redirect to SPA
    res.writeHead(302, { Location: `/?library=${encodeURIComponent(slug)}` });
    res.end();
    return;
  }

  // Crawler — fetch story metadata and return HTML with OG tags
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const baseUrl = process.env.VITE_APP_URL || 'https://sleepseed.app';

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(302, { Location: `/?library=${encodeURIComponent(slug)}` });
    res.end();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: story, error } = await supabase
    .from('stories')
    .select('title, hero_name, age_group, vibe, mood, refrain, read_count, thumbs_up, is_staff_pick, is_book_of_day')
    .eq('library_slug', slug)
    .eq('is_public', true)
    .single();

  if (error || !story) {
    res.writeHead(302, { Location: `/?library=${encodeURIComponent(slug)}` });
    res.end();
    return;
  }

  const title = story.title || 'A SleepSeed Story';
  const heroName = story.hero_name || '';
  const ageLabel = AGE_LABELS[story.age_group] || 'all ages';
  const vibeLabel = VIBE_LABELS[story.vibe] || VIBE_LABELS[story.mood] || 'bedtime';
  const description = story.refrain
    ? `"${story.refrain}" — A ${vibeLabel} story for ${ageLabel}.`
    : `A ${vibeLabel} bedtime story for ${ageLabel} — on SleepSeed.`;
  const ogImageUrl = `${baseUrl}/api/og-image/${encodeURIComponent(slug)}`;
  const canonicalUrl = `${baseUrl}/stories/${encodeURIComponent(slug)}`;

  const badges = [];
  if (story.is_staff_pick) badges.push('Staff Pick');
  if (story.is_book_of_day) badges.push('Story of the Day');
  if (story.read_count > 0) badges.push(`${story.read_count} reads`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — SleepSeed</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="SleepSeed" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": ${JSON.stringify(title)},
    "description": ${JSON.stringify(description)},
    "url": ${JSON.stringify(canonicalUrl)},
    "image": ${JSON.stringify(ogImageUrl)},
    "genre": "Children's bedtime story",
    "audience": {
      "@type": "Audience",
      "audienceType": "Children ${ageLabel}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SleepSeed",
      "url": "${baseUrl}"
    }
  }
  </script>

  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  ${heroName ? `<p>A story for ${escapeHtml(heroName)}</p>` : ''}
  ${badges.length ? `<p>${badges.join(' · ')}</p>` : ''}
  <p><a href="${canonicalUrl}">Read on SleepSeed</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
