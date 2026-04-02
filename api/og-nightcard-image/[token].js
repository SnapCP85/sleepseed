import { createClient } from '@supabase/supabase-js';

/**
 * Dynamic OG Image for Shared Night Cards
 * Returns a 600×840 SVG social preview card.
 */

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) { res.status(400).send('Missing token'); return; }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) { res.status(500).send('Config error'); return; }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Resolve token → card
  const { data: share } = await supabase
    .from('night_card_shares')
    .select('card_id')
    .eq('share_token', token)
    .single();

  if (!share) { res.status(404).send('Not found'); return; }

  const { data: card } = await supabase
    .from('night_cards')
    .select('hero_name, story_title, headline, quote, emoji, date, extra')
    .eq('id', share.card_id)
    .single();

  if (!card) { res.status(404).send('Not found'); return; }

  // Parse extra for creature info
  let creatureEmoji = card.emoji || '';
  let nightNumber = null;
  let isOrigin = false;
  if (card.extra && card.extra.startsWith('{')) {
    try {
      const p = JSON.parse(card.extra);
      if (p.creatureEmoji) creatureEmoji = p.creatureEmoji;
      if (p.nightNumber != null) nightNumber = p.nightNumber;
      if (p.isOrigin) isOrigin = true;
    } catch {}
  }

  const heroName = card.hero_name || 'A child';
  const headline = card.headline || card.story_title || 'A bedtime memory';
  const quote = (card.quote || '').slice(0, 140);
  const dateStr = card.date || '';

  // Format date
  let dateLabel = dateStr;
  try {
    const d = new Date(dateStr);
    dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {}

  // Deterministic stars from headline
  let hash = 5381;
  for (let i = 0; i < headline.length; i++) hash = (hash * 33) ^ headline.charCodeAt(i);

  const stars = Array.from({ length: 25 }, (_, i) => {
    const x = ((hash * (i + 1) * 37) % 580) + 10;
    const y = ((hash * (i + 1) * 53) % 340) + 10;
    const r = 0.8 + ((hash * (i + 1)) % 3) * 0.3;
    const o = 0.12 + ((hash * (i + 1)) % 5) * 0.05;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#EEE8FF" opacity="${o}"/>`;
  }).join('\n    ');

  // Sky gradient
  const skyColor1 = isOrigin ? '#150e05' : '#0d1428';
  const skyColor2 = isOrigin ? '#2a1808' : '#1a1040';

  // Word-wrap quote for SVG (max ~38 chars per line)
  const wrapText = (text, maxChars) => {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (test.length > maxChars && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines.slice(0, 4);
  };

  const headlineLines = wrapText(headline, 30);
  const quoteLines = wrapText(`"${quote}"`, 36);

  const nightBadge = nightNumber
    ? `<rect x="16" y="16" width="80" height="22" rx="11" fill="rgba(154,127,212,0.2)" stroke="rgba(154,127,212,0.4)" stroke-width="1"/>
       <text x="56" y="31" text-anchor="middle" font-size="9" font-weight="600" fill="rgba(154,127,212,0.9)" font-family="sans-serif" letter-spacing="0.5">NIGHT ${nightNumber}</text>`
    : '';

  const originBadge = isOrigin
    ? `<rect x="210" y="${398 + headlineLines.length * 22 + quoteLines.length * 18 + 20}" width="180" height="22" rx="11" fill="rgba(245,184,76,0.15)"/>
       <text x="300" y="${398 + headlineLines.length * 22 + quoteLines.length * 18 + 35}" text-anchor="middle" font-size="9" font-weight="600" fill="rgba(245,184,76,0.8)" font-family="sans-serif">&#10022; First Night Ever</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyColor1}"/>
      <stop offset="1" stop-color="${skyColor2}"/>
    </linearGradient>
  </defs>

  <!-- Sky zone -->
  <rect width="600" height="378" fill="url(#sky)"/>

  <!-- Stars -->
  <g>
    ${stars}
  </g>

  <!-- Night badge -->
  ${nightBadge}

  <!-- Creature -->
  <text x="300" y="200" text-anchor="middle" font-size="56">${creatureEmoji || '🌙'}</text>

  <!-- Paper zone -->
  <rect y="378" width="600" height="462" fill="${isOrigin ? '#fdf8ee' : '#faf6ee'}"/>

  <!-- Headline -->
  ${headlineLines.map((l, i) =>
    `<text x="300" y="${402 + i * 22}" text-anchor="middle" font-size="16" font-weight="bold" fill="${isOrigin ? '#1a0e04' : '#1a0f08'}" font-family="Georgia,serif">${escapeXml(l)}</text>`
  ).join('\n  ')}

  <!-- Quote -->
  ${quoteLines.map((l, i) =>
    `<text x="300" y="${402 + headlineLines.length * 22 + 20 + i * 18}" text-anchor="middle" font-size="13" font-style="italic" fill="rgba(26,15,8,0.55)" font-family="Georgia,serif">${escapeXml(l)}</text>`
  ).join('\n  ')}

  <!-- Origin badge -->
  ${originBadge}

  <!-- Footer divider -->
  <line x1="40" y1="790" x2="560" y2="790" stroke="rgba(26,15,8,0.08)" stroke-width="0.5"/>

  <!-- Footer -->
  <text x="40" y="810" font-size="10" font-weight="600" fill="rgba(26,15,8,0.35)" font-family="sans-serif">${escapeXml(heroName)}</text>
  <text x="300" y="810" text-anchor="middle" font-size="10" font-weight="600" fill="rgba(26,15,8,0.35)" font-family="sans-serif">${escapeXml(dateLabel)}</text>
  <text x="560" y="810" text-anchor="end" font-size="9" fill="rgba(26,15,8,0.2)" font-family="monospace">SleepSeed</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(svg);
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
