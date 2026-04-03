// ─────────────────────────────────────────────────────────────────────────────
// SVG COVER POOL
// 20 pre-built animated SVG covers with vibrant, colorful palettes.
// Assigned to stories by bucket + title hash.
// ─────────────────────────────────────────────────────────────────────────────

type Palette = { bg1: string; bg2: string; accent: string; glow: string; text: string; star: string };

// 12 vibrant palettes — warm, colorful, kid-friendly, NOT all dark
const ALL_PALETTES: Palette[] = [
  // Warm purple night
  { bg1: '#2d1b69', bg2: '#4a2d8a', accent: '#d4a0ff', glow: '#ecd5ff', text: '#f5edff', star: '#e8d0ff' },
  // Deep ocean blue
  { bg1: '#0e2a5c', bg2: '#1a4a8a', accent: '#64c8ff', glow: '#b0e4ff', text: '#e0f4ff', star: '#8ad8ff' },
  // Sunset orange
  { bg1: '#5c2000', bg2: '#8a4420', accent: '#ffb060', glow: '#ffd8a0', text: '#fff0e0', star: '#ffc880' },
  // Forest emerald
  { bg1: '#0a3a20', bg2: '#1a6040', accent: '#50e8a0', glow: '#a0ffd0', text: '#d8ffe8', star: '#70f0b8' },
  // Rose / pink
  { bg1: '#4a1030', bg2: '#6a2050', accent: '#ff80b8', glow: '#ffb8d8', text: '#ffe8f0', star: '#ff98c8' },
  // Golden amber
  { bg1: '#3a2800', bg2: '#5c4010', accent: '#ffc040', glow: '#ffe090', text: '#fff8e0', star: '#ffd060' },
  // Teal / aqua
  { bg1: '#0a2a30', bg2: '#104a58', accent: '#40e0d0', glow: '#90f0e8', text: '#d8fffa', star: '#60e8d8' },
  // Berry / magenta
  { bg1: '#3a0a3a', bg2: '#5c1a5c', accent: '#e060e0', glow: '#f0a0f0', text: '#fce0fc', star: '#e880e8' },
  // Sky blue
  { bg1: '#102050', bg2: '#284080', accent: '#70a8ff', glow: '#a8d0ff', text: '#e0efff', star: '#88baff' },
  // Coral / warm red
  { bg1: '#4a1818', bg2: '#6a2828', accent: '#ff7868', glow: '#ffa898', text: '#ffe8e4', star: '#ff9080' },
  // Lavender
  { bg1: '#281840', bg2: '#3a2860', accent: '#b890ff', glow: '#d4c0ff', text: '#f0e8ff', star: '#c8a8ff' },
  // Mint green
  { bg1: '#0a2820', bg2: '#184838', accent: '#60d8a0', glow: '#a0f0c8', text: '#e0ffe8', star: '#78e0b0' },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapTitle(title: string, max = 18): string[] {
  const words = title.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Star field ───────────────────────────────────────────────────────────
function stars(color: string): string {
  return [[45,30],[310,42],[85,60],[260,22],[180,12],[30,110],[340,100],[150,50],[220,75],[70,88],[290,68],[120,36]]
    .map(([x,y], i) => {
      const r = 1.2 + (i % 3) * 0.6, dur = 2 + (i % 3);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.5"><animate attributeName="opacity" values="0.25;0.85;0.25" dur="${dur}s" begin="${(i*0.4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    }).join('');
}

// ── 20 scene builders — more vibrant, higher opacity, more elements ──────

const scenes: ((p: Palette) => string)[] = [
  // 0 — Glowing lanterns & fireflies
  (p) => `${[70,180,290].map((x,i) => `<g transform="translate(${x},${90+i*18})"><rect x="-8" y="0" width="16" height="20" rx="4" fill="${p.accent}" opacity="0.7"><animate attributeName="y" values="0;-4;0" dur="${3+i}s" repeatCount="indefinite"/></rect><circle cx="0" cy="10" r="12" fill="${p.glow}" opacity="0.35"><animate attributeName="r" values="12;16;12" dur="${2.5+i*.5}s" repeatCount="indefinite"/></circle></g>`).join('')}${[100,160,220,280].map((x,i) => `<circle cx="${x}" cy="${140+i*12}" r="2.5" fill="${p.glow}"><animate attributeName="cx" values="${x};${x+20};${x-12};${x}" dur="${4+i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;1;0.4" dur="${2+i*.3}s" repeatCount="indefinite"/></circle>`).join('')}`,

  // 1 — Big moon garden
  (p) => `<circle cx="280" cy="55" r="35" fill="${p.glow}" opacity="0.5"/><circle cx="280" cy="55" r="28" fill="${p.accent}" opacity="0.25"/>${[60,130,210,290].map((x,i) => `<g transform="translate(${x},${175-i*6})"><line x1="0" y1="0" x2="0" y2="45" stroke="${p.accent}" stroke-width="2.5" opacity="0.5"/><circle cx="0" cy="-4" r="${8+i*3}" fill="${p.accent}" opacity="${.45+i*.08}"><animate attributeName="r" values="${8+i*3};${11+i*3};${8+i*3}" dur="${3+i}s" repeatCount="indefinite"/></circle><circle cx="${4+i*2}" cy="-8" r="${4+i}" fill="${p.glow}" opacity="${.3+i*.06}"><animate attributeName="r" values="${4+i};${6+i};${4+i}" dur="${3.5+i}s" repeatCount="indefinite"/></circle></g>`).join('')}`,

  // 2 — Rolling blanket hills
  (p) => `<path d="M0,170 Q90,130 180,170 Q270,210 360,170 L360,220 L0,220Z" fill="${p.accent}" opacity="0.25"><animate attributeName="d" values="M0,170 Q90,130 180,170 Q270,210 360,170 L360,220 L0,220Z;M0,175 Q90,138 180,165 Q270,200 360,175 L360,220 L0,220Z;M0,170 Q90,130 180,170 Q270,210 360,170 L360,220 L0,220Z" dur="6s" repeatCount="indefinite"/></path><path d="M0,195 Q90,170 180,195 Q270,220 360,195 L360,220 L0,220Z" fill="${p.glow}" opacity="0.15"><animate attributeName="d" values="M0,195 Q90,170 180,195 Q270,220 360,195 L360,220 L0,220Z;M0,190 Q90,175 180,200 Q270,215 360,190 L360,220 L0,220Z;M0,195 Q90,170 180,195 Q270,220 360,195 L360,220 L0,220Z" dur="7s" repeatCount="indefinite"/></path><path d="M120,185 Q150,172 180,178 Q210,184 240,175" stroke="${p.glow}" stroke-width="1.5" fill="none" opacity="0.5" stroke-dasharray="5 5"><animate attributeName="stroke-dashoffset" values="0;10" dur="3s" repeatCount="indefinite"/></path>`,

  // 3 — Cloud train with lit windows
  (p) => `<g><animateTransform attributeName="transform" type="translate" values="-100,0;420,0" dur="18s" repeatCount="indefinite"/><ellipse cx="60" cy="140" rx="45" ry="18" fill="${p.accent}" opacity="0.35"/><ellipse cx="125" cy="138" rx="40" ry="16" fill="${p.accent}" opacity="0.3"/><ellipse cx="180" cy="140" rx="35" ry="14" fill="${p.accent}" opacity="0.25"/><rect x="42" y="132" width="10" height="10" rx="2" fill="${p.glow}" opacity="0.6"/><rect x="62" y="132" width="10" height="10" rx="2" fill="${p.glow}" opacity="0.5"/><rect x="112" y="130" width="10" height="10" rx="2" fill="${p.glow}" opacity="0.55"/></g>${[0,1,2].map(i => `<circle cx="200" cy="${110-i*22}" r="${10+i*6}" fill="${p.glow}" opacity="${.2-.04*i}"><animate attributeName="cy" values="${110-i*22};${95-i*22};${110-i*22}" dur="${4+i}s" repeatCount="indefinite"/><animate attributeName="r" values="${10+i*6};${15+i*6};${10+i*6}" dur="${4+i}s" repeatCount="indefinite"/></circle>`).join('')}`,

  // 4 — Friendly dragon peeking
  (p) => `<g transform="translate(180,135)" opacity="0.85"><ellipse cx="0" cy="35" rx="40" ry="22" fill="${p.accent}" opacity="0.45"/><ellipse cx="-18" cy="5" rx="22" ry="16" fill="${p.accent}" opacity="0.55"><animate attributeName="cx" values="-18;-12;-18" dur="4s" repeatCount="indefinite"/></ellipse><ellipse cx="-24" cy="0" rx="4" ry="3" fill="${p.glow}" opacity="0.8"/><ellipse cx="-12" cy="0" rx="4" ry="3" fill="${p.glow}" opacity="0.8"/><circle cx="-24" cy="0" r="2" fill="${p.bg1}"/><circle cx="-12" cy="0" r="2" fill="${p.bg1}"/><circle cx="-27" cy="9" r="6" fill="#ffaaaa" opacity="0.35"/><circle cx="-9" cy="9" r="6" fill="#ffaaaa" opacity="0.35"/><path d="M35,35 Q55,22 65,38 Q75,54 88,42" stroke="${p.accent}" stroke-width="3.5" fill="none" opacity="0.5"><animate attributeName="d" values="M35,35 Q55,22 65,38 Q75,54 88,42;M35,35 Q55,28 65,32 Q75,48 92,38;M35,35 Q55,22 65,38 Q75,54 88,42" dur="3s" repeatCount="indefinite"/></path></g>${[90,250,300].map((x,i) => `<circle cx="${x}" cy="${195+i*8}" r="4" fill="${p.accent}" opacity="0.25"/>`).join('')}`,

  // 5 — Toast monster with crumbs
  (p) => `<g transform="translate(180,105)"><rect x="-18" y="-22" width="36" height="44" rx="5" fill="#e8c870" opacity="0.75"><animate attributeName="y" values="-22;-34;-22" dur="2s" repeatCount="indefinite"/></rect><rect x="-10" y="-14" width="20" height="10" rx="3" fill="#ffe680" opacity="0.7"><animate attributeName="y" values="-14;-26;-14" dur="2s" repeatCount="indefinite"/></rect></g>${[80,130,230,270].map((x,i) => `<circle cx="${x}" cy="${155+i*10}" r="${2+i%2}" fill="#e8c870" opacity="0.45"><animate attributeName="cy" values="${155+i*10};${142+i*10};${155+i*10}" dur="${3+i*.5}s" repeatCount="indefinite"/></circle>`).join('')}${[110,250].map((x,i) => `<text x="${x}" y="${130+i*28}" font-size="12" fill="${p.glow}" opacity="0.5" font-family="serif"><animate attributeName="opacity" values="0.2;0.6;0.2" dur="${3+i}s" repeatCount="indefinite"/>\u2733</text>`).join('')}`,

  // 6 — Upside-down confetti parade
  (p) => `${[50,110,170,230,290,340].map((x,i) => `<rect x="${x}" y="${180-i*16}" width="5" height="8" rx="1.5" fill="${['#ff6b9d','#64c8ff','#ffe060','#d4a0ff','#50e8a0','#ff9060'][i]}" opacity="0.6" transform="rotate(${i*25},${x},${180-i*16})"><animate attributeName="y" values="${180-i*16};${80-i*16};${180-i*16}" dur="${4+i*.4}s" repeatCount="indefinite"/></rect>`).join('')}<g transform="translate(180,85) scale(1,-1)" opacity="0.35"><circle cx="-24" cy="0" r="6" fill="${p.glow}"/><circle cx="0" cy="0" r="6" fill="${p.accent}"/><circle cx="24" cy="0" r="6" fill="${p.glow}"/></g>`,

  // 7 — Owl on branch with music notes
  (p) => `<g transform="translate(180,110)"><path d="M-90,35 Q-30,28 0,35 Q50,42 90,32" stroke="#5a4030" stroke-width="5" fill="none"/><ellipse cx="0" cy="12" rx="22" ry="26" fill="${p.accent}" opacity="0.55"/><circle cx="-9" cy="4" r="6" fill="${p.glow}" opacity="0.75"/><circle cx="9" cy="4" r="6" fill="${p.glow}" opacity="0.75"/><circle cx="-9" cy="4" r="3" fill="${p.bg1}"/><circle cx="9" cy="4" r="3" fill="${p.bg1}"/><animateTransform attributeName="transform" type="translate" values="180,110;180,104;180,110" dur="2.5s" repeatCount="indefinite"/></g>${[85,260].map((x,i) => `<text x="${x}" y="${95+i*18}" font-size="16" fill="${p.glow}" opacity="0.45" font-family="serif"><animate attributeName="y" values="${95+i*18};${75+i*18};${95+i*18}" dur="${4+i}s" repeatCount="indefinite"/>${['\u266A','\u266B'][i]}</text>`).join('')}`,

  // 8 — Window + bright moon + drifting stars
  (p) => `<rect x="110" y="70" width="140" height="110" rx="6" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.4"/><line x1="180" y1="70" x2="180" y2="180" stroke="${p.accent}" stroke-width="1.2" opacity="0.25"/><circle cx="210" cy="105" r="20" fill="${p.glow}" opacity="0.4"/><circle cx="210" cy="105" r="15" fill="${p.accent}" opacity="0.2"/>${[130,170,220,240].map((x,i) => `<circle cx="${x}" cy="${85+i*18}" r="2" fill="${p.glow}" opacity="0.5"><animate attributeName="cx" values="${x};${x+10};${x}" dur="${5+i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0.7;0.3" dur="${3.5+i}s" repeatCount="indefinite"/></circle>`).join('')}<line x1="105" y1="180" x2="255" y2="180" stroke="${p.accent}" stroke-width="2.5" opacity="0.4"/>`,

  // 9 — Open window + breeze + little frog
  (p) => `<rect x="90" y="72" width="180" height="130" rx="5" stroke="${p.accent}" stroke-width="2.5" fill="none" opacity="0.35"/><line x1="180" y1="72" x2="180" y2="202" stroke="${p.accent}" stroke-width="1.2" opacity="0.2"/><path d="M90,72 Q102,130 90,202" stroke="${p.glow}" stroke-width="2" fill="none" opacity="0.4"><animate attributeName="d" values="M90,72 Q102,130 90,202;M90,72 Q115,130 95,202;M90,72 Q102,130 90,202" dur="4s" repeatCount="indefinite"/></path><g transform="translate(260,195)" opacity="0.6"><ellipse cx="0" cy="0" rx="10" ry="7" fill="${p.accent}"/><circle cx="-5" cy="-5" r="2.5" fill="${p.glow}"/><circle cx="5" cy="-5" r="2.5" fill="${p.glow}"/></g>`,

  // 10 — Warm light under door + cinnamon swirl
  (p) => `<rect x="120" y="90" width="120" height="90" rx="5" fill="${p.glow}" opacity="0.12"/><rect x="110" y="200" width="140" height="6" rx="3" fill="${p.glow}" opacity="0.35"><animate attributeName="opacity" values="0.2;0.45;0.2" dur="3s" repeatCount="indefinite"/></rect><path d="M180,130 Q205,110 215,135 Q225,155 205,165 Q185,175 175,155Z" stroke="${p.accent}" stroke-width="1.5" fill="${p.accent}" fill-opacity="0.1" opacity="0.35"><animate attributeName="opacity" values="0.2;0.4;0.2" dur="5s" repeatCount="indefinite"/></path>`,

  // 11 — Colorful balloons + candle glow
  (p) => `${[110,175,240].map((x,i) => `<g><line x1="${x}" y1="${105+i*4}" x2="${x}" y2="${155+i*4}" stroke="${p.accent}" stroke-width="0.8" opacity="0.35"/><ellipse cx="${x}" cy="${92+i*4}" rx="16" ry="20" fill="${['#ff6b9d','#64c8ff','#d4a0ff'][i]}" opacity="0.45"><animate attributeName="cy" values="${92+i*4};${85+i*4};${92+i*4}" dur="${3+i}s" repeatCount="indefinite"/></ellipse></g>`).join('')}<g transform="translate(175,175)"><rect x="-3" y="0" width="6" height="18" rx="2" fill="#e8c870" opacity="0.6"/><ellipse cx="0" cy="-5" rx="7" ry="10" fill="${p.glow}" opacity="0.4"><animate attributeName="ry" values="10;13;10" dur="2s" repeatCount="indefinite"/></ellipse><circle cx="0" cy="-5" r="22" fill="${p.glow}" opacity="0.08"><animate attributeName="r" values="22;28;22" dur="2.5s" repeatCount="indefinite"/></circle></g>`,

  // 12 — Floating orbs (bright)
  (p) => `${[90,180,270].map((x,i) => `<circle cx="${x}" cy="${120+i*15}" r="${14+i*4}" fill="${p.accent}" opacity="0.2"><animate attributeName="cy" values="${120+i*15};${108+i*15};${120+i*15}" dur="${4+i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.12;0.3;0.12" dur="${4+i}s" repeatCount="indefinite"/></circle><circle cx="${x+15}" cy="${125+i*12}" r="${6+i*2}" fill="${p.glow}" opacity="0.25"><animate attributeName="cy" values="${125+i*12};${115+i*12};${125+i*12}" dur="${3.5+i}s" repeatCount="indefinite"/></circle>`).join('')}`,

  // 13 — Sleeping hills + bright star
  (p) => `<path d="M0,180 Q60,145 120,170 Q180,200 240,160 Q300,130 360,170 L360,220 L0,220Z" fill="${p.accent}" opacity="0.2"/><path d="M0,195 Q90,175 180,195 Q270,215 360,190 L360,220 L0,220Z" fill="${p.glow}" opacity="0.12"/><circle cx="180" cy="60" r="4" fill="${p.glow}" opacity="0.8"><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/><animate attributeName="r" values="4;5;4" dur="3s" repeatCount="indefinite"/></circle>`,

  // 14 — Drifting leaves / petals
  (p) => `${[70,150,240,320].map((x,i) => `<ellipse cx="${x}" cy="${100+i*22}" rx="8" ry="4" fill="${p.accent}" opacity="0.4" transform="rotate(${20+i*18},${x},${100+i*22})"><animate attributeName="cy" values="${100+i*22};${210}" dur="${5+i*1.5}s" repeatCount="indefinite"/><animate attributeName="cx" values="${x};${x+35};${x-15}" dur="${5+i*1.5}s" repeatCount="indefinite"/></ellipse>`).join('')}`,

  // 15 — Gentle rain
  (p) => `${Array.from({length:10},(_, i) => { const x = 30+i*34; return `<line x1="${x}" y1="${65+i*8}" x2="${x-3}" y2="${82+i*8}" stroke="${p.accent}" stroke-width="1.5" opacity="0.3"><animate attributeName="y1" values="${65+i*8};${210};${65+i*8}" dur="${2.5+i*.25}s" repeatCount="indefinite"/><animate attributeName="y2" values="${82+i*8};${227};${82+i*8}" dur="${2.5+i*.25}s" repeatCount="indefinite"/></line>`; }).join('')}`,

  // 16 — Music notes floating
  (p) => `${[80,145,215,280].map((x,i) => `<text x="${x}" y="${110+i*18}" font-size="18" fill="${p.accent}" opacity="0.5" font-family="serif"><animate attributeName="y" values="${110+i*18};${85+i*18};${110+i*18}" dur="${4+i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0.6;0.2" dur="${4+i}s" repeatCount="indefinite"/>${['\u266A','\u266B','\u266C','\u266A'][i]}</text>`).join('')}`,

  // 17 — Concentric ripples
  (p) => `${[0,1,2,3].map(i => `<circle cx="180" cy="150" r="${22+i*28}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="${.3-.05*i}"><animate attributeName="r" values="${22+i*28};${32+i*28};${22+i*28}" dur="${4+i}s" repeatCount="indefinite"/></circle>`).join('')}`,

  // 18 — Aurora / northern lights
  (p) => `<path d="M0,80 Q90,45 180,70 Q270,100 360,60" fill="none" stroke="${p.accent}" stroke-width="25" opacity="0.14"><animate attributeName="d" values="M0,80 Q90,45 180,70 Q270,100 360,60;M0,70 Q90,55 180,85 Q270,88 360,70;M0,80 Q90,45 180,70 Q270,100 360,60" dur="8s" repeatCount="indefinite"/></path><path d="M0,110 Q90,80 180,100 Q270,120 360,90" fill="none" stroke="${p.glow}" stroke-width="18" opacity="0.1"><animate attributeName="d" values="M0,110 Q90,80 180,100 Q270,120 360,90;M0,100 Q90,90 180,110 Q270,110 360,100;M0,110 Q90,80 180,100 Q270,120 360,90" dur="10s" repeatCount="indefinite"/></path>`,

  // 19 — Candle flame with warm glow
  (p) => `<g transform="translate(180,125)"><rect x="-5" y="0" width="10" height="45" rx="3" fill="#e8c870" opacity="0.5"/><ellipse cx="0" cy="-8" rx="10" ry="18" fill="${p.glow}" opacity="0.35"><animate attributeName="ry" values="18;22;18" dur="2s" repeatCount="indefinite"/><animate attributeName="rx" values="10;7;10" dur="3s" repeatCount="indefinite"/></ellipse><circle cx="0" cy="-8" r="28" fill="${p.glow}" opacity="0.1"><animate attributeName="r" values="28;35;28" dur="2.5s" repeatCount="indefinite"/></circle></g>`,
];

// ── Scene assignment — each scene gets a unique palette ──────────────────

function pickPalette(title: string, sceneIdx: number): Palette {
  // Combine title hash + scene index to spread palettes evenly
  const h = hashStr(title);
  return ALL_PALETTES[(h + sceneIdx * 3) % ALL_PALETTES.length];
}

// Preferred scenes per bucket
const BUCKET_SCENES: Record<string, number[]> = {
  'emotional-truth':    [8, 12, 13, 17, 19],
  'wonder-cozy':        [0, 1, 2, 3, 18],
  'funny-playful':      [4, 5, 6, 7, 16],
  'seasonal-milestone': [9, 10, 11, 14, 15],
};

function pickScene(title: string, bucket: string): number {
  const pool = BUCKET_SCENES[bucket] || Object.values(BUCKET_SCENES).flat();
  return pool[hashStr(title) % pool.length];
}

// ── Main export ──────────────────────────────────────────────────────────

export function generateCoverSVG(title: string, bucket: string): string {
  const sceneIdx = pickScene(title, bucket);
  const palette = pickPalette(title, sceneIdx);
  const titleLines = wrapTitle(title);
  const lineHeight = 26;
  const titleY = 48;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="360" height="220">
  <defs>
    <linearGradient id="bg-${sceneIdx}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${palette.bg1}"/>
      <stop offset="100%" stop-color="${palette.bg2}"/>
    </linearGradient>
    <filter id="glow-${sceneIdx}"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="360" height="220" fill="url(#bg-${sceneIdx})"/>
  ${stars(palette.star)}
  ${scenes[sceneIdx](palette)}
  <g filter="url(#glow-${sceneIdx})">
    ${titleLines.map((line, i) =>
      `<text x="180" y="${titleY + i * lineHeight}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="20" font-weight="bold" fill="${palette.text}" opacity="0.92">${escapeXml(line)}</text>`
    ).join('\n    ')}
  </g>
  <text x="180" y="213" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="${palette.text}" opacity="0.2">SleepSeed</text>
</svg>`;
}

export function coverSVGDataUri(title: string, bucket: string): string {
  return `data:image/svg+xml,${encodeURIComponent(generateCoverSVG(title, bucket))}`;
}

export const COVER_POOL_SIZE = scenes.length;
