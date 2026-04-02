// ─────────────────────────────────────────────────────────────────────────────
// DreamKeeper System — V1 Onboarding Set
// ─────────────────────────────────────────────────────────────────────────────
// Separate from creatures.ts (which remains untouched).
// The onboarding uses this file. The Hatchery continues using creatures.ts.
// Where IDs overlap (owl, bear, fox, bunny, dragon, cat), they share the same
// id string so downstream systems can cross-reference.
// ─────────────────────────────────────────────────────────────────────────────

export interface DreamKeeper {
  id: string;                 // matches creatures.ts id where overlap exists
  name: string;               // e.g. "Moon Bunny"
  animal: string;             // e.g. "bunny"
  emoji: string;              // system emoji
  color: string;              // hex color
  imageSrc: string;            // path to transparent PNG in /public/dreamkeepers/transparent/
  virtue: string;             // one-word virtue
  virtueDescription: string;  // short sentence describing how the virtue shows up
  emotionalLine: string;      // the line the creature speaks on reveal
  feelingMatch: string[];     // which feeling IDs this creature matches (primary first)
  personalityTraits: string[];// 3 short traits
}

export interface Feeling {
  id: string;
  emoji: string;
  label: string;
  color: string;  // RGB string for styling (e.g. "246,197,111")
}

// ── Feelings (the child picks one during onboarding) ────────────────────────

export const FEELINGS: Feeling[] = [
  { id: 'safe',    emoji: '\u{1F6E1}\uFE0F', label: 'Safe',    color: '246,197,111' },
  { id: 'calm',    emoji: '\u{1F30A}',        label: 'Calm',    color: '154,180,220' },
  { id: 'brave',   emoji: '\u{1F981}',        label: 'Brave',   color: '111,231,221' },
  { id: 'curious', emoji: '\u{1F52D}',        label: 'Curious', color: '184,161,255' },
  { id: 'cozy',    emoji: '\u{1F9F8}',        label: 'Cozy',    color: '245,140,80'  },
  { id: 'sleepy',  emoji: '\u{1F4A4}',        label: 'Sleepy',  color: '200,170,220' },
];

// ── V1 DreamKeeper Set (10 approved creatures) ──────────────────────────────

export const V1_DREAMKEEPERS: DreamKeeper[] = [
  // ── Existing creatures (IDs match creatures.ts) ───────────────────────────
  {
    id: 'owl',
    name: 'Dusk Owl',
    animal: 'owl',
    emoji: '🦉',
    color: '#9A7FD4',
    imageSrc: '/dreamkeepers/transparent/owl.png',
    virtue: 'Wisdom',
    virtueDescription: 'Asks one question that changes the direction of everything.',
    emotionalLine: 'I see you. I see who you really are.',
    feelingMatch: ['curious', 'calm'],
    personalityTraits: ['watchful', 'thoughtful', 'quietly knowing'],
  },
  {
    id: 'bear',
    name: 'Frost Bear',
    animal: 'bear',
    emoji: '🐻',
    color: '#90C8E8',
    imageSrc: '/dreamkeepers/transparent/bear.png',
    virtue: 'Kindness',
    virtueDescription: 'Notices what nobody else noticed. Acts first. Takes no credit.',
    emotionalLine: 'You looked like you could use someone warm.',
    feelingMatch: ['cozy', 'safe'],
    personalityTraits: ['gentle', 'steady', 'warm'],
  },
  {
    id: 'fox',
    name: 'Ember Fox',
    animal: 'fox',
    emoji: '🦊',
    color: '#FF8264',
    imageSrc: '/dreamkeepers/transparent/fox.png',
    virtue: 'Cleverness',
    virtueDescription: 'Sees solutions others miss. Sometimes too clever for their own good.',
    emotionalLine: 'I know a shortcut. Want to see?',
    feelingMatch: ['curious', 'brave'],
    personalityTraits: ['quick-witted', 'playful', 'resourceful'],
  },
  {
    id: 'bunny',
    name: 'Moon Bunny',
    animal: 'bunny',
    emoji: '🐰',
    color: '#F5B84C',
    imageSrc: '/dreamkeepers/transparent/bunny.png',
    virtue: 'Courage',
    virtueDescription: 'Hesitates. Goes anyway. Still shaking. Never announces it.',
    emotionalLine: 'I was scared too, once. Then I found you.',
    feelingMatch: ['safe', 'brave'],
    personalityTraits: ['timid', 'warm', 'quietly brave'],
  },
  {
    id: 'dragon',
    name: 'Storm Drake',
    animal: 'dragon',
    emoji: '🐉',
    color: '#60C8A0',
    imageSrc: '/dreamkeepers/transparent/dragon.png',
    virtue: 'Resilience',
    virtueDescription: 'Gets knocked down a lot. Always gets back up. Has a quiet stubbornness that looks like strength.',
    emotionalLine: 'Whatever happened today \u2014 we can handle it.',
    feelingMatch: ['brave', 'safe'],
    personalityTraits: ['fierce', 'tender', 'stubborn'],
  },
  {
    id: 'cat',
    name: 'Shadow Cat',
    animal: 'cat',
    emoji: '🐱',
    color: '#A090D0',
    imageSrc: '/dreamkeepers/transparent/cat.png',
    virtue: 'Independence',
    virtueDescription: 'Walks their own path. Comfortable being different. Not rebellious \u2014 just quietly certain.',
    emotionalLine: 'You don\u2019t have to be like everyone else. That\u2019s the best part.',
    feelingMatch: ['calm', 'curious'],
    personalityTraits: ['independent', 'perceptive', 'quietly certain'],
  },

  // ── New creatures (V1 additions) ──────────────────────────────────────────
  {
    id: 'turtle',
    name: 'Tide Turtle',
    animal: 'turtle',
    emoji: '🐢',
    color: '#7EBFA5',
    imageSrc: '/dreamkeepers/transparent/turtle.png',
    virtue: 'Patience',
    virtueDescription: 'Knows that good things come to those who breathe. Never rushes. Never panics.',
    emotionalLine: 'There\u2019s no hurry. I\u2019ll be here when you\u2019re ready.',
    feelingMatch: ['calm', 'sleepy'],
    personalityTraits: ['unhurried', 'grounded', 'deeply calm'],
  },
  {
    id: 'sloth',
    name: 'Willow Sloth',
    animal: 'sloth',
    emoji: '🦥',
    color: '#C4A882',
    imageSrc: '/dreamkeepers/transparent/sloth.png',
    virtue: 'Rest',
    virtueDescription: 'Understands that slowing down is not giving up. Treats stillness as strength.',
    emotionalLine: 'Close your eyes. I\u2019ll keep watch.',
    feelingMatch: ['sleepy', 'cozy'],
    personalityTraits: ['gentle', 'unhurried', 'deeply present'],
  },
  {
    id: 'seal',
    name: 'Harbor Seal',
    animal: 'seal',
    emoji: '🦭',
    color: '#8BAEC4',
    imageSrc: '/dreamkeepers/transparent/seal.png',
    virtue: 'Joy',
    virtueDescription: 'Finds delight in puddles, waves, and the sound of laughing. Reminds you that fun is allowed.',
    emotionalLine: 'Did you know the stars come out just for us?',
    feelingMatch: ['cozy', 'calm'],
    personalityTraits: ['playful', 'joyful', 'effortlessly warm'],
  },
  {
    id: 'dog',
    name: 'Star Pup',
    animal: 'dog',
    emoji: '🐕',
    color: '#D4A860',
    imageSrc: '/dreamkeepers/transparent/dog.png',
    virtue: 'Loyalty',
    virtueDescription: 'Shows up. Every single time. No matter what. That\u2019s the whole thing.',
    emotionalLine: 'I\u2019m yours. That\u2019s it. I\u2019m just yours.',
    feelingMatch: ['safe', 'cozy'],
    personalityTraits: ['devoted', 'enthusiastic', 'endlessly faithful'],
  },
];

// ── Elder DreamKeeper (system-wide presence, NOT selectable) ────────────────

export const ELDER_DREAMKEEPER = {
  name: 'The Elder',
  imageSrc: '/elder/transparent/elder.png',
  description: 'A timeless presence that watches over all dreamers. Not a creature to be chosen \u2014 a presence to be felt.',
  rules: [
    'Never introduced directly \u2014 the Elder is noticed, not announced',
    'Appears only in the memory layer and rare emotionally meaningful moments',
    'No emoji, no selection card \u2014 felt, not seen',
    'Speaks only through Night Card memory lines and milestone reflections',
    'First rendered appearance ships post-V1 as a Night Card memory line variant',
  ],
};

// ── Matching logic ──────────────────────────────────────────────────────────

/**
 * Returns the primary DreamKeeper match for a given feeling.
 * Each feeling maps to the creature whose feelingMatch lists that feeling first.
 * Fallback: Moon Bunny (safe default).
 */
export function matchDreamKeeper(feelingId: string): DreamKeeper {
  // Primary match: creature whose FIRST feelingMatch entry is this feeling
  const primary = V1_DREAMKEEPERS.find(dk => dk.feelingMatch[0] === feelingId);
  if (primary) return primary;

  // Secondary match: creature that has this feeling anywhere in their list
  const secondary = V1_DREAMKEEPERS.find(dk => dk.feelingMatch.includes(feelingId));
  if (secondary) return secondary;

  // Fallback: Moon Bunny
  return V1_DREAMKEEPERS.find(dk => dk.id === 'bunny')!;
}

/**
 * Returns two alternate DreamKeepers for the reveal flanking animation.
 * These are creatures that also match the feeling but aren't the primary.
 */
export function getAlternates(feelingId: string, primaryId: string): [DreamKeeper, DreamKeeper] {
  const others = V1_DREAMKEEPERS.filter(dk =>
    dk.id !== primaryId && dk.feelingMatch.includes(feelingId)
  );

  // If not enough feeling matches, pick from full list
  const pool = others.length >= 2
    ? others
    : V1_DREAMKEEPERS.filter(dk => dk.id !== primaryId);

  return [pool[0], pool[1] || pool[pool.length - 1]];
}

/**
 * Find a DreamKeeper by ID. Returns undefined if not in V1 set.
 */
export function getDreamKeeperById(id: string): DreamKeeper | undefined {
  return V1_DREAMKEEPERS.find(dk => dk.id === id);
}
