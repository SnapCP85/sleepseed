/**
 * seed-demo-showcase.js — Seeds the demo showcase account.
 *
 * Account: demo@sleepseed.app / SleepSeed2026!
 * Child: Adina (age 5, she/her)
 * DreamKeeper: Moonlight the Owl (Wisdom)
 * 14 nights of night cards
 *
 * Run: node scripts/seed-demo-showcase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEMO_EMAIL = 'demo@sleepseed.app';
const DEMO_PASSWORD = 'SleepSeed2026!';

function uid() { return crypto.randomUUID(); }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('🌙 SleepSeed Demo Showcase Seed');
  console.log('================================\n');

  // ── 1. Sign in or create demo user ──
  console.log('1. Setting up demo user...');
  let userId;

  const { data: signIn } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL, password: DEMO_PASSWORD,
  });

  if (signIn?.user) {
    userId = signIn.user.id;
    console.log(`   ✓ Signed in as ${DEMO_EMAIL} (${userId})`);
  } else {
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: DEMO_EMAIL, password: DEMO_PASSWORD,
      options: { data: { display_name: 'Demo Parent' } }
    });
    if (signUpErr) { console.error('   ✗ Sign up failed:', signUpErr.message); process.exit(1); }
    userId = signUp.user.id;
    console.log(`   ✓ Created account (${userId})`);
  }

  // ── 2. Clean existing demo data ──
  console.log('\n2. Cleaning existing demo data...');
  await supabase.from('night_cards').delete().eq('user_id', userId);
  await supabase.from('stories').delete().eq('user_id', userId);
  await supabase.from('hatched_creatures').delete().eq('user_id', userId);
  await supabase.from('hatchery_eggs').delete().eq('user_id', userId);
  await supabase.from('characters').delete().eq('user_id', userId);
  console.log('   ✓ Cleaned');

  // ── 3. Create character: Adina ──
  console.log('\n3. Creating character: Adina...');
  const charId = uid();
  const { error: charErr } = await supabase.from('characters').insert({
    id: charId,
    user_id: userId,
    name: 'Adina',
    type: 'human',
    age_description: '5',
    pronouns: 'she/her',
    personality_tags: ['curious', 'kind', 'imaginative'],
    weird_detail: 'She whispers goodnight to every stuffed animal individually, in order, and gets upset if she skips one.',
    current_situation: 'Started kindergarten this year and is making new friends.',
    color: '#F5B84C',
    emoji: '🌟',
    story_ids: [],
    is_family: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (charErr) console.error('   ✗ Character error:', charErr.message);
  else console.log('   ✓ Adina created');

  // ── 4. Create hatched creature: Moonlight the Owl ──
  console.log('\n4. Creating DreamKeeper: Moonlight the Owl...');
  const moonlightId = uid();
  const { error: creatureErr } = await supabase.from('hatched_creatures').insert({
    id: moonlightId,
    user_id: userId,
    character_id: charId,
    name: 'Moonlight',
    creature_type: 'owl',
    creature_emoji: '🦉',
    color: '#9A7FD4',
    rarity: 'common',
    personality_traits: ['watchful', 'thoughtful', 'quietly knowing'],
    dream_answer: 'I dream about the questions nobody else thinks to ask.',
    parent_secret: 'She whispers goodnight to every stuffed animal individually.',
    hatched_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    week_number: 0,
  });
  if (creatureErr) console.error('   ✗ Creature error:', creatureErr.message);
  else console.log('   ✓ Moonlight 🦉 created');

  // ── 5. Create active egg (Week 2) ──
  console.log('\n5. Creating active egg...');
  await supabase.from('hatchery_eggs').upsert({
    user_id: userId,
    character_id: charId,
    creature_type: 'fox',
    creature_emoji: '🦊',
    week_number: 2,
    started_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  }, { onConflict: 'user_id,character_id' });
  console.log('   ✓ Fox egg (Week 2)');

  // ── 6. Create 14 night cards ──
  console.log('\n6. Creating 14 night cards...');

  const cards = [
    // Week 1: Nights 1-7 (days 14-8 ago)
    {
      day: 14,
      headline: 'The Night She Was Found',
      quote: "I didn't know you were waiting for me.",
      memory_line: 'She held the egg like it was already hers — even before it cracked.',
      whisper: 'Some things find you before you know to look.',
      emoji: '🥚', isOrigin: true, nightNumber: 1,
    },
    {
      day: 13,
      headline: 'She Came Back',
      quote: 'I wanted to see what happened next.',
      memory_line: 'She came back on the second night. Moonlight noticed.',
      whisper: 'The second night is the one that matters.',
      emoji: '🦉', nightNumber: 2,
    },
    {
      day: 12,
      headline: 'The Ladybird on the Window',
      quote: "I didn't want to close the curtain because she was still there.",
      memory_line: 'She waited for a ladybird to leave before closing the window.',
      whisper: 'She treats small creatures like they matter. Because they do.',
      emoji: '🐞', nightNumber: 3,
    },
    {
      day: 11,
      headline: 'The Hard Day at School',
      quote: "Nobody picked me for their team. But I'm okay now.",
      memory_line: 'She said she was okay. But she held on a little longer tonight.',
      whisper: "She carried something heavy all day and still showed up.",
      emoji: '🌙', nightNumber: 4,
    },
    {
      day: 10,
      headline: "The Question That Wouldn't Stop",
      quote: "Why do we have to sleep if the stars are still awake?",
      memory_line: 'She asked Moonlight something even Moonlight couldn\'t answer.',
      whisper: 'The best questions are the ones without answers.',
      emoji: '⭐', nightNumber: 5,
    },
    {
      day: 9,
      headline: 'The Almost-Hatch',
      quote: 'I can hear something inside. Can you?',
      memory_line: 'She pressed her ear against the egg and held her breath.',
      whisper: 'She is learning to listen for things that aren\'t loud.',
      emoji: '🥚', nightNumber: 6,
    },
    {
      day: 8,
      headline: 'Moonlight Was Born',
      quote: "I'm going to call you Moonlight. Because you glow.",
      memory_line: 'She named her DreamKeeper without hesitating — like she\'d been practising.',
      whisper: 'She named it like she already knew. Because she did.',
      emoji: '🦉', nightNumber: 7, streakCount: 7,
    },
    // Week 2: Nights 1-7 (days 7-1 ago)
    {
      day: 7,
      headline: 'The Morning She Remembered',
      quote: 'I thought about the story at breakfast. I told Dad.',
      memory_line: 'The story followed her into the next day.',
      whisper: "Good stories don't end when you close the book.",
      emoji: '☀️', nightNumber: 1,
    },
    {
      day: 6,
      headline: 'The Drawing She Made',
      quote: "This is Moonlight. I made her wings bigger because she deserves it.",
      memory_line: 'She drew her DreamKeeper with wings twice the real size.',
      whisper: 'She sees Moonlight as bigger than Moonlight sees herself.',
      emoji: '🎨', nightNumber: 2,
    },
    {
      day: 5,
      headline: 'The New Friend',
      quote: "Her name is Mila. She likes the same things I like.",
      memory_line: 'She made a friend today. She told Moonlight first.',
      whisper: 'She told the owl before she told anyone else.',
      emoji: '💛', nightNumber: 3,
    },
    {
      day: 4,
      headline: 'The Night It Rained',
      quote: "I like the sound of rain when I'm inside with you.",
      memory_line: 'She found safety in being sheltered.',
      whisper: 'She knows what it feels like to be warm when the world is wet.',
      emoji: '🌧️', nightNumber: 4,
    },
    {
      day: 3,
      headline: 'The Brave Thing',
      quote: "I told my teacher I didn't understand. She helped me.",
      memory_line: 'She asked for help. That was the brave thing.',
      whisper: 'Asking is harder than pretending. She chose asking.',
      emoji: '🌟', nightNumber: 5,
    },
    {
      day: 2,
      headline: 'The Wish on the Ceiling',
      quote: "If I could wish for one thing, I'd wish for this to keep going.",
      memory_line: 'She lay looking at the ceiling and wished for more nights like this.',
      whisper: 'She doesn\'t want the magic to stop. It won\'t.',
      emoji: '✨', nightNumber: 6, streakCount: 13,
    },
    {
      day: 1,
      headline: 'Two Weeks',
      quote: 'Moonlight knows me now. I can tell by the way she looks.',
      memory_line: 'She felt it. The DreamKeeper knowing her.',
      whisper: 'Fourteen nights. She is right. Moonlight does know her now.',
      emoji: '🦉', nightNumber: 7, streakCount: 14,
    },
  ];

  for (const c of cards) {
    const extra = {};
    if (c.isOrigin) extra.isOrigin = true;
    if (c.whisper) extra.whisper = c.whisper;
    if (c.streakCount) extra.streakCount = c.streakCount;
    if (c.nightNumber) extra.nightNumber = c.nightNumber;
    extra.creatureEmoji = '🦉';
    extra.creatureColor = '#9A7FD4';

    const { error } = await supabase.from('night_cards').insert({
      id: uid(),
      user_id: userId,
      hero_name: 'Adina',
      story_title: c.headline,
      character_ids: [charId],
      headline: c.headline,
      quote: c.quote,
      memory_line: c.memory_line,
      emoji: c.emoji,
      date: daysAgo(c.day),
      extra: JSON.stringify(extra),
    });
    if (error) console.error(`   ✗ Night ${15 - c.day}: ${error.message}`);
    else console.log(`   ✓ Night ${15 - c.day}: "${c.headline}"`);
  }

  // ── 7. Create a few saved stories ──
  console.log('\n7. Creating saved stories...');

  const stories = [
    {
      title: 'The Ladybird Who Stayed',
      refrain: 'Small things matter most when you notice them.',
      date: daysAgo(12),
    },
    {
      title: 'Moonlight\'s First Question',
      refrain: 'The best answer is another question.',
      date: daysAgo(10),
    },
    {
      title: 'The Rain Song',
      refrain: 'Safe inside. The whole world singing.',
      date: daysAgo(4),
    },
    {
      title: 'The Wish That Came True',
      refrain: 'She wished for more nights. Here they are.',
      date: daysAgo(2),
    },
  ];

  for (const s of stories) {
    const storyId = uid();
    await supabase.from('stories').insert({
      id: storyId,
      user_id: userId,
      title: s.title,
      hero_name: 'Adina',
      character_ids: [charId],
      refrain: s.refrain,
      date: s.date,
      book_data: {
        title: s.title,
        heroName: 'Adina',
        allChars: [
          { id: 'hero', name: 'Adina', type: 'hero' },
          { id: moonlightId, name: 'Moonlight', type: 'creature', classify: 'owl' },
        ],
        refrain: s.refrain,
        pages: [
          { text: '(Story content — generated during demo flow)' },
        ],
      },
    });
    console.log(`   ✓ "${s.title}"`);
  }

  // ── 8. Set ritual state as complete ──
  console.log('\n8. Ritual state...');
  console.log('   Set these in localStorage after login:');
  console.log(`   sleepseed_parent_setup_${userId} = "1"`);
  console.log(`   sleepseed_onboarding_${userId} = "1"`);
  console.log(`   sleepseed_ritual_complete_${userId} = "1"`);
  console.log(`   sleepseed_ritual_${userId} = ${JSON.stringify({
    currentNight: 3,
    night1Complete: true,
    night2Complete: true,
    night3Complete: true,
    ritualComplete: true,
    eggState: 'hatched',
    smileAnswer: 'when Moonlight looks at me like she knows',
    talentAnswer: 'noticing things nobody else notices',
    creatureName: 'Moonlight',
    creatureEmoji: '🦉',
    creatureColor: '#9A7FD4',
    childName: 'Adina',
  })}`);

  // ── Summary ──
  console.log('\n================================');
  console.log('✅ Demo showcase account ready!');
  console.log(`\nLogin: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`User ID: ${userId}`);
  console.log(`Character: Adina (${charId})`);
  console.log(`DreamKeeper: Moonlight 🦉 (${moonlightId})`);
  console.log(`Night cards: 14`);
  console.log(`Stories: ${stories.length}`);
  console.log(`Active egg: Fox 🦊 (Week 2)`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
