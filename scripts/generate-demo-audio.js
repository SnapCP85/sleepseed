#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const VOICE_ID = '4oL1QwfSyfa648qRXxaG';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'demo-audio');
const ENV_PATH = path.join(__dirname, '..', '.env');

if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const API_KEY = process.env.ELEVENLABS_API_KEY;

const SCENES = [
  {
    id: 1,
    name: 'The Golden Window',
    text: `There are twenty minutes every night, right before sleep, when your child is more open than any other time of day. The defenses drop. The real stuff comes out. Almost nobody is building for this moment. SleepSeed owns it.`,
  },
  {
    id: 2,
    name: 'Rituals Win',
    text: `Anyone with AI can build a story generator. But Duolingo didn't win because of translation. They won because of the streak. Calm didn't win because of meditation tracks. They won because of the daily ritual. SleepSeed is the ritual platform for families. It creates an experience during the most important twenty minutes of the day, and captures that moment so it's remembered forever. Let me show you what that looks like.`,
  },
  {
    id: 3,
    name: 'The First Night',
    text: `When a family opens SleepSeed, the child sees a golden egg. They touch it. They tell us who the story is for: Adina, age six.

Next, they choose a creature companion. Twenty options. Moon Bunny, Ember Fox, Storm Drake. Pick the one that feels right.

Then the app learns who this child really is. Brave or gentle? Dreamy or adventurous? These shape every story.

Now a moment just for the parent. The screen warms. What's something about your child that only you know? That secret becomes part of the story DNA. It shows up in the right moment, and the parent thinks: how did it know?

The child holds down on the egg. A ring fills. It cracks open. A Moon Bunny tumbles out. They name her Luna. They take a selfie, and the creature is in the photo.

That's the first five minutes. And the child is completely in.`,
  },
  {
    id: 4,
    name: 'Tonight\'s Story',
    text: `Now it's bedtime. The parent types what happened today. She was shy at school. Didn't want to talk to the new kid.

The app knows Adina is six, gentle, and dreamy. It knows Luna is her creature. While the story generates, here's what's happening behind the scenes: a nine hundred line editorial engine. Five genre arcs. A list of banned phrases because real children's literature doesn't use them. A ten point quality check that auto revises anything below the bar. Craft principles from Roald Dahl, Sendak, and Mo Willems. This is not a basic AI prompt. This is a publishing house in code.

In thirty seconds, Adina and the Shy Cloud appears. A story built from her real day. The shy cloud is the new kid at lunch. Luna helps her see it differently. Adina hears her own truth reflected back through a story written just for her.

After the story, a Night Card is captured. A polaroid of tonight. Adina's quote. A memory line the parent will read years from now and remember exactly what she said. Every Night Card can be shared, printed, or saved forever.`,
  },
  {
    id: 5,
    name: 'The World They Return To',
    text: `This is what the parent sees every night. The dashboard. Luna is waiting. The egg is cracking, night five of seven. Two more bedtimes and a new creature hatches. That's why my daughters argue over who goes first.

Below: the story library. Every story saved. The Night Card archive. Every moment captured. And the create button, ready for tonight.

The creature is the reason kids beg to come back. The Night Card is the reason parents never want to stop. And every Night Card, every story, every voice, is built to be shared. A grandparent records their voice once, and their grandchildren hear them reading every night. Forever.

The product is the marketing. Every share brings a new family in.`,
  },
  {
    id: 6,
    name: 'Where We Are',
    text: `I recently went through a divorce. Two daughters, three and six. I felt those moments before sleep slipping away. Nothing like this existed. So I built it. In two weeks. In Wisconsin.

My daughters are the first users. Every night they say, Daddy, can we do SleepSeed? Fifteen families have seen it. All would pay. One mother said, she asked to do it again the next night. She's never once asked for that. Three therapists validated it. One is co-developing therapeutic content. Mary Lake Montessori wants to pilot it. Heritage Elementary's SEL program wants to help shape stories.

Coming next: family case studies, school pilots, story illustrations, voice library for grandparents, character continuity for world building, and a public library of free stories.

Thirty three million families. Seventy million grandparents. Every share expands the market to everyone who loves a child.

Tonight, your child will say something true. Be there for it. Their creature is waiting.

My name is Greg. This is SleepSeed.`,
  },
];

function gen(text, outPath) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.42, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true } });
    const opts = { hostname: 'api.elevenlabs.io', port: 443, path: '/v1/text-to-speech/' + VOICE_ID, method: 'POST', headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Accept: 'audio/mpeg' } };
    const req = https.request(opts, res => {
      if (res.statusCode !== 200) { let e = ''; res.on('data', d => e += d); res.on('end', () => reject(new Error('API ' + res.statusCode + ': ' + e))); return; }
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => { const buf = Buffer.concat(chunks); fs.writeFileSync(outPath, buf); resolve(buf.length); });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function silent(outPath) {
  const b = Buffer.from('SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwBHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64');
  fs.writeFileSync(outPath, b); return b.length;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  // Clean old files
  for (let i = 1; i <= 10; i++) { const f = path.join(OUTPUT_DIR, 'scene-' + i + '.mp3'); if (fs.existsSync(f) && i > SCENES.length) fs.unlinkSync(f); }

  if (!API_KEY) {
    console.warn('\n  No ELEVENLABS_API_KEY. Generating silent placeholders.\n');
    SCENES.forEach(sc => { const sz = silent(path.join(OUTPUT_DIR, 'scene-' + sc.id + '.mp3')); console.log('  [silent] scene-' + sc.id + '.mp3 (' + sz + ' bytes)'); });
    return;
  }
  console.log('\n  Generating narration... Voice: ' + VOICE_ID + '\n');
  for (const sc of SCENES) {
    const p = path.join(OUTPUT_DIR, 'scene-' + sc.id + '.mp3');
    process.stdout.write('  Scene ' + sc.id + ': ' + sc.name + '... ');
    try { const sz = await gen(sc.text, p); console.log((sz / 1024).toFixed(0) + 'KB (~' + Math.round(sz / 16000) + 's)'); }
    catch (e) { console.log('FAILED: ' + e.message); silent(p); }
  }
  console.log('\n  Done.\n');
}
main().catch(e => { console.error(e); process.exit(1); });
