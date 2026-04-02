import { createClient } from '@supabase/supabase-js';

/**
 * Dynamic OG Image Generator
 *
 * Generates a 1200x630 SVG social preview card for a story,
 * served as image/svg+xml. Social platforms that require PNG
 * will render the SVG — most modern platforms (Twitter, Facebook,
 * Slack, Discord, iMessage) handle SVG fine.
 *
 * If PNG is required later, wrap this in a Satori + Resvg pipeline.
 */

const VIBE_COLORS = {
  'calm-cosy':  { bg1: '#0a1428', bg2: '#060912', accent: '#F5B84C', glow: 'rgba(245,184,76,.15)' },
  'warm-funny': { bg1: '#1a1028', bg2: '#0e0818', accent: '#ff82b8', glow: 'rgba(255,130,184,.12)' },
  'exciting':   { bg1: '#0a1830', bg2: '#060c18', accent: '#68b8ff', glow: 'rgba(104,184,255,.12)' },
  'heartfelt':  { bg1: '#1a0e20', bg2: '#0e0618', accent: '#b48cff', glow: 'rgba(180,140,255,.12)' },
  'mysterious': { bg1: '#081820', bg2: '#040c14', accent: '#5DCAA5', glow: 'rgba(93,202,165,.12)' },
};

const VIBE_LABELS = {
  'calm-cosy': 'Cosy',
  'warm-funny': 'Funny',
  'exciting': 'Adventure',
  'heartfelt': 'Heartfelt',
  'mysterious': 'Wonder',
};

const AGE_LABELS = {
  age3: 'Ages 3–5',
  age5: 'Ages 5–8',
  age7: 'Ages 7–10',
  age10: 'Ages 9+',
};

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) { res.status(400).send('Missing slug'); return; }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).send('Server misconfigured');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: story } = await supabase
    .from('stories')
    .select('title, hero_name, age_group, vibe, mood, refrain, is_staff_pick, is_book_of_day')
    .eq('library_slug', slug)
    .eq('is_public', true)
    .single();

  if (!story) {
    res.status(404).send('Story not found');
    return;
  }

  const vibe = story.vibe || story.mood || 'calm-cosy';
  const colors = VIBE_COLORS[vibe] || VIBE_COLORS['calm-cosy'];
  const vibeLabel = VIBE_LABELS[vibe] || 'Bedtime Story';
  const ageLabel = AGE_LABELS[story.age_group] || 'All Ages';
  const title = truncate(story.title || 'A SleepSeed Story', 50);
  const refrain = story.refrain ? truncate(story.refrain, 60) : '';
  const badge = story.is_staff_pick ? 'Staff Pick' : story.is_book_of_day ? 'Story of the Day' : '';

  // Generate stars (deterministic from title hash)
  const hash = simpleHash(title);
  const stars = Array.from({ length: 25 }, (_, i) => {
    const seed = (hash + i * 7919) % 10000;
    return {
      x: 100 + (seed % 1000),
      y: 40 + ((seed * 3) % 500),
      r: 0.8 + (seed % 3) * 0.5,
      opacity: 0.2 + (seed % 5) * 0.12,
    };
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${colors.glow}" />
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bg1}" />
      <stop offset="100%" stop-color="${colors.bg2}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />

  <!-- Stars -->
  ${stars.map(s => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="white" opacity="${s.opacity}" />`).join('\n  ')}

  <!-- Moon -->
  <circle cx="1050" cy="120" r="36" fill="#F5C060" opacity="0.25" />
  <circle cx="1050" cy="120" r="28" fill="${colors.bg2}" />
  <circle cx="1040" cy="112" r="28" fill="#F5C060" opacity="0.3" />

  <!-- Badge -->
  ${badge ? `
  <rect x="80" y="60" width="${badge.length * 10 + 32}" height="28" rx="14" fill="${colors.accent}" opacity="0.15" />
  <text x="96" y="79" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="${colors.accent}" letter-spacing="1">${escSvg(badge.toUpperCase())}</text>
  ` : ''}

  <!-- Vibe + Age pills -->
  <text x="80" y="${badge ? 120 : 80}" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="${colors.accent}" letter-spacing="0.5" opacity="0.7">${escSvg(vibeLabel)} · ${escSvg(ageLabel)}</text>

  <!-- Title -->
  <text x="80" y="${badge ? 180 : 140}" font-family="Georgia, serif" font-size="48" font-weight="700" fill="#F4EFE8" letter-spacing="-0.5">
    ${wrapTitle(title, 42).map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 56}">${escSvg(line)}</tspan>`).join('')}
  </text>

  <!-- Refrain -->
  ${refrain ? `
  <text x="80" y="${badge ? 300 : 260}" font-family="Georgia, serif" font-size="20" font-style="italic" fill="rgba(244,239,232,0.45)" letter-spacing="0.2">"${escSvg(refrain)}"</text>
  ` : ''}

  <!-- Divider -->
  <rect x="80" y="${badge ? 340 : 300}" width="120" height="1" fill="${colors.accent}" opacity="0.25" />

  <!-- Hero line -->
  ${story.hero_name ? `
  <text x="80" y="${badge ? 375 : 335}" font-family="system-ui, sans-serif" font-size="16" fill="rgba(244,239,232,0.35)">A story for ${escSvg(story.hero_name)}</text>
  ` : ''}

  <!-- Brand -->
  <circle cx="96" cy="575" r="10" fill="#C87020" />
  <text x="114" y="580" font-family="Georgia, serif" font-size="16" font-weight="700" fill="rgba(244,239,232,0.5)">SleepSeed</text>

  <!-- CTA hint -->
  <text x="1120" y="580" font-family="system-ui, sans-serif" font-size="13" fill="${colors.accent}" opacity="0.5" text-anchor="end">Read tonight</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(svg);
}

function escSvg(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

function wrapTitle(title, maxCharsPerLine) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // Max 3 lines
}

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}
