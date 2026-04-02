/**
 * seed-demo.js — Seeds the demo account with 20 nights of realistic data.
 * Run: node scripts/seed-demo.js
 *
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load env vars from .env
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

function uid() {
  return crypto.randomUUID();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('🌙 SleepSeed Demo Seed Script');
  console.log('================================\n');

  // 1. Sign in or create demo user
  console.log('1. Setting up demo user...');
  let userId;

  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signIn?.user) {
    userId = signIn.user.id;
    console.log(`   ✓ Signed in as ${DEMO_EMAIL} (${userId})`);
  } else {
    console.log(`   Creating new account...`);
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      options: { data: { display_name: 'Demo Parent' } }
    });
    if (signUpErr) { console.error('   ✗ Sign up failed:', signUpErr.message); process.exit(1); }
    userId = signUp.user.id;
    console.log(`   ✓ Created account ${DEMO_EMAIL} (${userId})`);
  }

  // 2. Create character: Sofia
  console.log('\n2. Creating character: Sofia...');
  const charId = uid();
  const { error: charErr } = await supabase.from('characters').upsert({
    id: charId,
    user_id: userId,
    name: 'Sofia',
    type: 'human',
    age_description: '6',
    pronouns: 'she/her',
    personality_tags: ['curious', 'kind', 'brave'],
    weird_detail: 'She carries small things in her pockets to keep them safe.',
    current_situation: '',
    color: '#F5B84C',
    emoji: '🌟',
    story_ids: [],
    is_family: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (charErr) console.error('   ✗ Character error:', charErr.message);
  else console.log('   ✓ Sofia created');

  // 3. Create hatched creatures
  console.log('\n3. Creating hatched creatures...');

  // Original DreamKeeper: Ember the Fox (from onboarding)
  const emberId = uid();
  await supabase.from('hatched_creatures').upsert({
    id: emberId, user_id: userId, character_id: charId,
    name: 'Ember', creature_type: 'fox', creature_emoji: '🦊',
    color: '#FF8264', rarity: 'common',
    personality_traits: ['curious', 'kind', 'brave'],
    dream_answer: 'I want to see what happens next.',
    parent_secret: 'She carries small things in her pockets to keep them safe.',
    hatched_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    week_number: 0,
  });
  console.log('   ✓ Ember the Fox (original DreamKeeper)');

  // Week 1: Luma the Butterfly
  const lumaId = uid();
  await supabase.from('hatched_creatures').upsert({
    id: lumaId, user_id: userId, character_id: charId,
    name: 'Luma', creature_type: 'unicorn', creature_emoji: '🦋',
    color: '#E8A8D8', rarity: 'common',
    personality_traits: ['gentle', 'caring'],
    dream_answer: 'She kept something safe.',
    parent_secret: '',
    hatched_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    week_number: 1,
  });
  console.log('   ✓ Luma the Butterfly (Week 1)');

  // Week 2: Grove the Bear
  const groveId = uid();
  await supabase.from('hatched_creatures').upsert({
    id: groveId, user_id: userId, character_id: charId,
    name: 'Grove', creature_type: 'bear', creature_emoji: '🐻',
    color: '#90C8E8', rarity: 'rare',
    personality_traits: ['brave', 'determined'],
    dream_answer: 'She showed up on the hard days.',
    parent_secret: '',
    hatched_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    week_number: 2,
  });
  console.log('   ✓ Grove the Bear (Week 2, rare)');

  // 4. Create active egg (Week 3 — Owl, 6 shards)
  console.log('\n4. Creating active egg (Owl, 6/7 shards)...');
  await supabase.from('hatchery_eggs').upsert({
    user_id: userId,
    character_id: charId,
    creature_type: 'owl',
    creature_emoji: '🦉',
    week_number: 3,
    started_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  }, { onConflict: 'user_id,character_id' });
  console.log('   ✓ Owl egg created (Week 3)');

  // 5. Create 20 night cards
  console.log('\n5. Creating 20 night cards...');

  const cards = [
    { day: 20, headline: 'The Night She Was Found', quote: "I didn't know you were waiting for me.", memory_line: 'She held the egg like it was already hers.', whisper: 'Some things find you before you know to look.', emoji: '🥚', isOrigin: true, nightNumber: 1 },
    { day: 19, headline: 'She Came Back', quote: 'I wanted to see what happened next.', memory_line: 'She came back. Ember noticed.', whisper: "The second night is the one that matters.", emoji: '🦊', nightNumber: 2 },
    { day: 18, headline: 'The Caterpillar in the Pocket', quote: "I kept it safe all day so nobody would step on it.", memory_line: 'She carried something small and fragile and kept it alive.', whisper: 'She is the kind of person who protects small things.', emoji: '🐛', nightNumber: 3 },
    { day: 17, headline: 'The Hard Day', quote: "Nothing went right but I still came.", memory_line: 'Even when the day was hard, she showed up.', whisper: "Showing up on hard days is the whole thing.", emoji: '🌙', nightNumber: 4 },
    { day: 16, headline: "The Question She Couldn't Answer", quote: "I don't know why I felt that way. I just did.", memory_line: "She sat with not-knowing and that was enough.", whisper: "Not every feeling needs a reason. Some just need a witness.", emoji: '💭', nightNumber: 5 },
    { day: 15, headline: 'The Night Before the Egg', quote: 'Do you think it knows I\'m waiting?', memory_line: 'She talked to the egg before it hatched.', whisper: "She already loved it before she knew what it was.", emoji: '🥚', nightNumber: 6 },
    { day: 14, headline: 'The Night Something Hatched', quote: "She's real. I gave her a name.", memory_line: "She named the thing she'd been waiting for.", whisper: 'Named things become real. She knew this instinctively.', emoji: '🦋', nightNumber: 7, streakCount: 7 },
    { day: 13, headline: 'The Morning She Remembered', quote: 'I thought about the story at breakfast.', memory_line: 'The story followed her into the next day.', whisper: "Good stories don't end when you close the book.", emoji: '☀️', nightNumber: 1 },
    { day: 12, headline: 'The Brave Thing at Lunch', quote: "I sat with the new girl. She didn't have anyone.", memory_line: 'She saw someone alone and chose not to walk past.', whisper: 'The bravest thing is often the smallest thing.', emoji: '🍎', nightNumber: 2 },
    { day: 11, headline: 'Week Two', quote: 'Ember remembered the caterpillar tonight.', memory_line: 'She noticed the DreamKeeper was paying attention.', whisper: 'Ten nights. She is becoming someone who keeps promises.', emoji: '🦊', nightNumber: 3, streakCount: 10 },
    { day: 10, headline: 'The Secret She Kept', quote: "I can't tell you. But it's a good one.", memory_line: "She had something she wasn't ready to share yet.", whisper: "Some things are yours alone for a while. That's allowed.", emoji: '🤫', nightNumber: 4 },
    { day: 9, headline: 'The Rain Night', quote: "I like the sound of rain when I'm inside.", memory_line: 'She found safety in being sheltered.', whisper: "She knows what it feels like to be warm when the world is wet.", emoji: '🌧️', nightNumber: 5 },
    { day: 8, headline: 'The Fight With Her Friend', quote: "We're okay now. We figured it out ourselves.", memory_line: 'She solved something hard without help.', whisper: 'She is more capable than she knows.', emoji: '🤝', nightNumber: 6 },
    { day: 7, headline: 'Two Weeks', quote: "I didn't think I'd still be doing this.", memory_line: 'She surprised herself by staying.', whisper: 'Fourteen nights. The ritual belongs to her now.', emoji: '✨', nightNumber: 7, streakCount: 14 },
    { day: 6, headline: 'When She Was Tired But Came Anyway', quote: "I almost didn't. But Ember was waiting.", memory_line: 'She came because someone was expecting her.', whisper: "She showed up for the relationship. That's love.", emoji: '🌙', nightNumber: 1 },
    { day: 5, headline: "The Thing She's Good At", quote: "My teacher said I'm really good at noticing things.", memory_line: 'Someone named something true about her today.', whisper: 'She is good at noticing. The DreamKeeper noticed that first.', emoji: '🌟', nightNumber: 2 },
    { day: 4, headline: 'The Dream She Remembered', quote: 'There were no sharks. Just us and the fish.', memory_line: 'Even her dreams are becoming safe places.', whisper: 'The ocean in her dream had no monsters. Only wonder.', emoji: '🐠', nightNumber: 3 },
    { day: 3, headline: 'The Night She Asked About Stars', quote: "Are the stars always there even when we can't see them?", memory_line: 'She asked the kind of question that stays with you.', whisper: 'Yes. Always. Even on the cloudy nights.', emoji: '⭐', nightNumber: 4 },
    { day: 2, headline: 'Almost Twenty', quote: 'How many nights have we done this now?', memory_line: 'She is counting. She knows this matters.', whisper: "She started keeping track. That means she wants to keep going.", emoji: '🦊', nightNumber: 5, streakCount: 19 },
    { day: 1, headline: 'Twenty Nights', quote: 'Ember knows me now. I can tell.', memory_line: 'She felt it. The DreamKeeper knowing her.', whisper: 'Twenty nights. She is right. Ember does know her now.', emoji: '🌙', nightNumber: 6, streakCount: 20 },
  ];

  for (const c of cards) {
    const extra = {};
    if (c.isOrigin) extra.isOrigin = true;
    if (c.whisper) extra.whisper = c.whisper;
    if (c.streakCount) extra.streakCount = c.streakCount;
    if (c.nightNumber) extra.nightNumber = c.nightNumber;
    extra.creatureEmoji = c.day > 14 ? '🦊' : c.day > 7 ? '🐻' : '🦉';
    extra.creatureColor = c.day > 14 ? '#FF8264' : c.day > 7 ? '#90C8E8' : '#9A7FD4';

    const { error } = await supabase.from('night_cards').insert({
      id: uid(),
      user_id: userId,
      hero_name: 'Sofia',
      story_title: c.headline,
      character_ids: [charId],
      headline: c.headline,
      quote: c.quote,
      memory_line: c.memory_line,
      emoji: c.emoji,
      date: daysAgo(c.day),
      extra: JSON.stringify(extra),
    });
    if (error) console.error(`   ✗ Night ${21 - c.day}: ${error.message}`);
    else console.log(`   ✓ Night ${21 - c.day}: "${c.headline}"`);
  }

  // 6. Set localStorage flags
  console.log('\n6. Summary');
  console.log('================================');
  console.log(`User ID: ${userId}`);
  console.log(`Character: Sofia (${charId})`);
  console.log(`Creatures: Ember 🦊, Luma 🦋, Grove 🐻`);
  console.log(`Active egg: Owl 🦉 (6/7 shards)`);
  console.log(`Night cards: 20`);
  console.log(`\nLogin: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log('\nSet these in localStorage after login:');
  console.log(`  sleepseed_parent_setup_${userId} = "1"`);
  console.log(`  sleepseed_onboarding_${userId} = "1"`);
  console.log('\n✅ Demo account ready!');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
