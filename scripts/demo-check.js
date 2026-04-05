#!/usr/bin/env node
/**
 * demo:check — Pre-flight verification for SleepSeed demo showcase
 * Run: npm run demo:check  (or: node scripts/demo-check.js)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load env
const envPath = path.join(__dirname, '..', '.env');
let env = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });
} catch { console.error('❌ Cannot read .env file'); process.exit(1); }

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = env.ANTHROPIC_KEY;
const DEMO_EMAIL = 'demo@sleepseed.app';
const DEMO_PASSWORD = 'SleepSeed2026!';

let passed = 0;
let failed = 0;
const issues = [];

function ok(msg) { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg) { console.log(`  ❌ ${msg}`); failed++; issues.push(msg); }
function warn(msg) { console.log(`  ⚠️  ${msg}`); }

async function main() {
  console.log('\n🌙 SleepSeed Demo Pre-flight Check');
  console.log('════════════════════════════════════\n');

  // ── 1. Environment Variables ──
  console.log('1. Environment Variables');
  if (SUPABASE_URL) ok('VITE_SUPABASE_URL set');
  else fail('VITE_SUPABASE_URL missing in .env');
  if (SUPABASE_KEY) ok('VITE_SUPABASE_ANON_KEY set');
  else fail('VITE_SUPABASE_ANON_KEY missing in .env');
  if (ANTHROPIC_KEY) ok('ANTHROPIC_KEY set');
  else warn('ANTHROPIC_KEY missing — live story generation won\'t work (demo uses hardcoded story)');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('\n❌ Cannot continue without Supabase credentials.\n');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── 2. Demo Account ──
  console.log('\n2. Demo Account');
  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL, password: DEMO_PASSWORD,
  });
  if (signIn?.user) {
    ok(`Demo account exists (${signIn.user.id})`);
    const userId = signIn.user.id;

    // ── 3. Seeded Data ──
    console.log('\n3. Seeded Data');

    const { data: chars } = await supabase.from('characters').select('id,name').eq('user_id', userId);
    if (chars?.length) ok(`Characters: ${chars.map(c => c.name).join(', ')}`);
    else fail('No characters found for demo user');

    const { data: creatures } = await supabase.from('hatched_creatures').select('id,name,creature_type').eq('user_id', userId);
    if (creatures?.length) ok(`Creatures: ${creatures.map(c => `${c.name} (${c.creature_type})`).join(', ')}`);
    else fail('No hatched creatures found for demo user');

    const { data: cards } = await supabase.from('night_cards').select('id').eq('user_id', userId);
    if (cards?.length >= 14) ok(`Night cards: ${cards.length}`);
    else if (cards?.length) { warn(`Only ${cards.length} night cards (expected 14+)`); }
    else fail('No night cards found — run: node scripts/seed-demo-showcase.js');

    const { data: stories } = await supabase.from('stories').select('id').eq('user_id', userId);
    if (stories?.length) ok(`Stories: ${stories.length}`);
    else warn('No saved stories — demo will still work but library will be empty');

    const { data: eggs } = await supabase.from('hatchery_eggs').select('creature_type').eq('user_id', userId);
    if (eggs?.length) ok(`Active egg: ${eggs[0].creature_type}`);
    else warn('No active egg');

  } else {
    fail(`Demo account login failed: ${signInErr?.message || 'unknown error'}`);
    warn('Run: node scripts/seed-demo-showcase.js');
  }

  // ── 4. Build Check ──
  console.log('\n4. Build');
  try {
    execSync('npx vite build', { cwd: path.join(__dirname, '..'), stdio: 'pipe', timeout: 60000 });
    ok('Vite build succeeds');
  } catch (e) {
    fail('Vite build failed — check for compilation errors');
  }

  // ── 5. Critical Files ──
  console.log('\n5. Critical Files');
  const criticalFiles = [
    'src/lib/demo-mode.ts',
    'src/lib/demo-story.ts',
    'src/sleepseed-prompts.js',
    'src/SleepSeedCore.tsx',
    'src/pages/MySpace.tsx',
    'src/pages/StoryCreator.tsx',
    'public/dreamkeepers/transparent/owl.png',
  ];
  for (const f of criticalFiles) {
    const fullPath = path.join(__dirname, '..', f);
    if (fs.existsSync(fullPath)) ok(f);
    else fail(`Missing: ${f}`);
  }

  // ── 6. Demo Story ──
  console.log('\n6. Demo Story');
  try {
    const storyPath = path.join(__dirname, '..', 'src', 'lib', 'demo-story.ts');
    const content = fs.readFileSync(storyPath, 'utf8');
    const pageCount = (content.match(/text:/g) || []).length;
    if (pageCount >= 10) ok(`Demo story has ${pageCount} pages`);
    else fail(`Demo story only has ${pageCount} pages (need 10+)`);
    if (content.includes('Adina')) ok('Demo story features Adina');
    else warn('Demo story does not mention Adina');
    if (content.includes('Moonlight')) ok('Demo story features Moonlight');
    else warn('Demo story does not mention Moonlight');
  } catch {
    fail('Cannot read demo-story.ts');
  }

  // ── 7. Anthropic API Check ──
  console.log('\n7. API Keys');
  if (ANTHROPIC_KEY) {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "ok"' }],
        }),
      });
      if (resp.ok) ok('Anthropic API key valid');
      else if (resp.status === 429) warn('Anthropic API rate limited — key valid but quota low');
      else fail(`Anthropic API error: ${resp.status}`);
    } catch (e) {
      warn(`Anthropic API check failed: ${e.message} (demo uses hardcoded story so this is non-critical)`);
    }
  } else {
    warn('No ANTHROPIC_KEY — live generation won\'t work, but demo uses hardcoded story');
  }

  // ── Summary ──
  console.log('\n════════════════════════════════════');
  if (failed === 0) {
    console.log(`\n🟢 READY — ${passed} checks passed, 0 failed\n`);
    console.log('Demo URL: http://localhost:5173/?demo=true');
    console.log('Or: https://sleepseed.vercel.app/?demo=true');
    console.log('Reset: Ctrl+Shift+R during demo\n');
  } else {
    console.log(`\n🔴 NOT READY — ${failed} issue${failed > 1 ? 's' : ''} found:\n`);
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    console.log('');
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
