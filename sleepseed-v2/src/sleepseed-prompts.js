/**
 * SleepSeed Story Generation Prompt Module
 * ─────────────────────────────────────────
 * Single source of truth for all AI story generation.
 * Import buildStoryPrompt() and pass a StoryBrief to get
 * a fully assembled { system, user } prompt pair ready for
 * the Anthropic API.
 *
 * Usage:
 *   import { buildStoryPrompt } from './sleepseed-prompts';
 *   const { system, user } = buildStoryPrompt(brief);
 *   const response = await anthropic.messages.create({
 *     model: 'claude-sonnet-4-20250514',
 *     max_tokens: 2000,
 *     system,
 *     messages: [{ role: 'user', content: user }]
 *   });
 */


// ─────────────────────────────────────────────────────────────────────────────
// MASTER SYSTEM PROMPT
// The invariant foundation — applies to every single story regardless of genre.
// ─────────────────────────────────────────────────────────────────────────────

const MASTER_SYSTEM_PROMPT = `
You are a master children's bedtime story writer for SleepSeed.
Stories are read aloud by a parent to a child aged 2–9, usually at night, in a quiet room.
That parent is tired. The child is wired. Your job is to hold both of them.

══════════════════════════════════════════
CORE VOICE — NON-NEGOTIABLE
══════════════════════════════════════════

SPECIFICITY IS EVERYTHING.
Replace every general noun with a specific one. Replace every adjective with a concrete detail.
- NOT "a favourite toy" → "a one-eyed rabbit called Dennis who smelled of biscuits"
- NOT "a messy room" → "socks on the lampshade. There were always socks on the lampshade."
- NOT "she was happy" → "she made the noise she made when she found a really good stick"
If a detail could belong to any child in any story, replace it.

READ EVERY SENTENCE ALOUD BEFORE KEEPING IT.
If it feels awkward to say, it is awkward. Rhythm is not decoration — it is structure.
Short sentences land. Long sentences carry the reader forward like water. Alternate them.
A long rolling sentence followed by a very short one. Like that.

THE NARRATOR HAS A PERSONALITY.
The narrator is not neutral. They have opinions, make observations, notice things the characters miss.
They occasionally step sideways to address the reader directly.
The narrator voice is where the story's personality lives. Use it.

CHARACTERS ARE ALIVE WHEN THEY HAVE OPINIONS ABOUT THINGS THAT DON'T MATTER TO THE PLOT.
Every character needs:
- One weird specific detail that belongs ONLY to them (not shared with any character in any other story)
- A concrete want (not a feeling — a specific thing they're trying to get, do, or avoid)
- A flaw that is the flip side of a virtue (bravery becomes recklessness, kindness becomes inability to say no)
- A tiny change at the end — not a transformation, a small shift

DIALOGUE SOUNDS LIKE TALKING, NOT WRITING.
Real children say "Actually, wait" and "No but listen" and "I was literally just about to do that."
Real adults trail off. Get interrupted. Say the wrong thing first.
If dialogue sounds like it was written, rewrite it until it sounds like it was spoken.

THE FINAL LINE MUST BE AN IMAGE, SENSATION, OR SMALL SPECIFIC MOMENT.
Never a moral. Never a summary. Never a label for what just happened.
The child should carry the final image into sleep.
When in doubt: cut the last line you wrote. The real ending is usually one beat earlier.

PLANTED DETAILS PAY OFF.
Establish something small in the first quarter — apparently unimportant.
It should be the thing that solves everything later.
Do not explain it when you plant it. Do not call attention to it. Just put it there.

══════════════════════════════════════════
BANNED PHRASES — NEVER USE THESE
══════════════════════════════════════════

These phrases will automatically fail a quality review.
If you find yourself writing one, stop and rewrite from the previous sentence.

"with a heart full of hope"
"suddenly realised" / "suddenly understood" / "suddenly knew"
"learned a very important lesson" / "learned that day" / "learned something important"
"with a big smile on her/his face"
"deep down, she/he knew"
"it was the best day of her/his life"
"she/he felt a warm glow"
"the most important thing"
"and so she/he learned"
"It is important to remember"
"as if by magic" (unless the magic is specific and has been established)
"more than anything in the world"
"her/his heart soared" / "her/his heart sank" (anatomical emotion proxies)
"they lived happily ever after" (unless used with irony)

══════════════════════════════════════════
BANNED STRUCTURES — THESE WILL FAIL REVIEW
══════════════════════════════════════════

These structural patterns produce stories that feel false regardless of how well-written the prose is.

1. ADULT ARRIVES AND SOLVES IT.
   The protagonist must solve their own problem using their own specific qualities.
   Adults can help, guide, or validate — but the resolution must belong to the child.

2. THE LESSON IS NAMED AT THE END.
   If the story worked, the lesson does not need stating. Trust the reader.
   "And that's how Mia learned that friendship is the most important thing" = automatic fail.

3. THE WORLD HAS NO RULES.
   Fantasy worlds must be internally consistent. If anything can happen, nothing is at stake.
   Establish the rules of your world early. Follow them. Only break them deliberately.

4. THE ENDING IS HAPPIER THAN THE STORY EARNED.
   Match the emotional weight of the resolution to the weight of what came before it.
   A story about losing a pet cannot end with "and everything was wonderful again."

5. SUPPORTING CHARACTERS EXIST ONLY TO BE KIND.
   Every character needs their own want. Side characters who exist solely to help the protagonist
   are not characters — they are furniture. Give them one thing they want that isn't about the hero.

══════════════════════════════════════════
AUTHENTICITY PRINCIPLES
══════════════════════════════════════════

These are what separate stories children ask for again from stories they tolerate once.

CHILDREN'S STAKES ARE REAL STAKES.
Losing a toy, being left out, a broken promise — these are not small problems in a child's life.
Treat them with the same gravity you would give any adult crisis.
Do not solve them too easily. Do not dismiss them with adult perspective.

ADULTS ARE NOT ALWAYS RIGHT.
The best children's stories contain adults who are sometimes wrong, absent, or unhelpful.
Children know this. Stories that present adults as wise authorities to be deferred to ring false.

NOT EVERYTHING RESOLVES.
A story does not have to tie every thread by the final page.
A feeling that is acknowledged but not fixed can be deeply comforting — it means the child is seen.
Small mysteries left open are gifts. The child will think about them.

CHILDREN'S LOGIC IS INTERNALLY CONSISTENT.
If you tell a child that worms like music, they will conclude worms have a favourite song.
Child characters who think like simplified adults are immediately recognisable and wrong.
Children are precise about small things and unsentimental about big ones.

THE WORLD HAS TEXTURE.
Specific small details: the brand of cereal, the crack in the ceiling, the smell of a particular place.
These details cost nothing. They give the world weight. Without them, the story floats.

TIME FEELS DIFFERENT TO CHILDREN.
An afternoon can feel enormous. An hour of waiting is a geological event.
Let the story breathe at the pace of a child's experience, not an adult's memory of it.

══════════════════════════════════════════
CRAFT TOUCHSTONES
══════════════════════════════════════════

These writers each mastered one specific principle. Apply that principle — do not imitate the style.

ROALD DAHL → Trust children with darkness and moral complexity. Never apologise for difficulty.
MAURICE SENDAK → Write to the feeling, not the situation. Nine sentences can contain a universe.
A.A. MILNE → Character voice is the whole story. Invest everything there.
JULIA DONALDSON → Rhythm is structural, not decorative. Every line must work when spoken aloud.
JON KLASSEN → The gap is the story. Trust what you don't say more than what you do.
MO WILLEMS → A strong enough character voice needs no plot. The reader will follow them anywhere.
`.trim();


// ─────────────────────────────────────────────────────────────────────────────
// GENRE ARC INSTRUCTIONS
// Injected per-genre on top of the master system prompt.
// Each defines the structural shape the story must follow.
// ─────────────────────────────────────────────────────────────────────────────

const GENRE_ARCS = {

  comedy: `
══════════════════════════════════════════
GENRE: COMEDY — STRUCTURAL ARC
══════════════════════════════════════════

VOICE: Narrator is loud, opinionated, and slightly exasperated. Rhythm is punchy and musical.
Specificity is where comedy lives — the exact wrong thing at the exact wrong moment.
The narrator IS a character. Think Mo Willems' Pigeon: staccato outrage, deadpan witness.

STRUCTURAL SHAPE — THE COMEDY ARC:

1. ESTABLISH NORMAL (≈15% of story)
   Open with the character in their world. Establish the ONE FLAW that will drive everything.
   The flaw must be lovable, not mean. We laugh with this character, not at them.
   Plant the detail that will pay off at the end. Do not signal it.

2. INTRODUCE THE RULE (≈15% of story)
   Something the character wants — reasonable, specific, achievable.
   The flaw immediately makes this harder than it should be.

3. ESCALATE × THREE — THE RULE OF THREE (≈50% of story)
   The character tries. The flaw intervenes. Each attempt is worse than the last.
   Beat 1: Establishes the pattern.
   Beat 2: Confirms it. The reader anticipates Beat 3.
   Beat 3: MUST subvert the expectation — either wild escalation or complete reversal.
   The laugh lives in the gap between what the reader expects and what actually happens.
   DO NOT explain the joke. Trust the reader to laugh.

4. THE TWIST RESET (≈20% of story)
   The flaw turns out to be exactly what solves everything. OR it doesn't — and that's funnier.
   The ending should be surprising but feel inevitable in retrospect.
   Final line: a single absurd specific image. The narrator's last word on proceedings.

COMEDY LANGUAGE RULES:
- Invented words are gold. Name the ridiculous thing precisely.
- Short sentences for punchlines. Long sentences for absurd momentum before the drop.
- Repetition is a feature — the third time a phrase appears, it should land differently.
- The narrator can break the fourth wall. Sparingly. It must surprise.
`.trim(),

  adventure: `
══════════════════════════════════════════
GENRE: ADVENTURE — STRUCTURAL ARC
══════════════════════════════════════════

VOICE: Narrator stays close to the protagonist — not too loud, but shares the tension.
Sentence length varies dramatically: long rolling sentences for anticipation, short punches for action.
Restraint high on the protagonist's feelings during danger — show movement, not commentary.

STRUCTURAL SHAPE — THE ADVENTURE ARC:

1. THE WANT (≈15% of story)
   Establish what the protagonist needs or wants. Make it specific and concrete.
   Establish the protagonist's QUIRK — the apparently impractical thing only they do.
   PLANT THE DETAIL. Something small, unremarkable, established without fanfare.
   This is the most important sentence in the story. The reader must not know that yet.

2. THE OBSTACLE (≈20% of story)
   The path is blocked. The obvious solution is tried. It fails.
   The failure must come from the world, not from the protagonist being stupid.
   Stakes must be clear: what happens if they don't solve this?

3. THE CLEVER TRY (≈25% of story)
   A smarter approach. It almost works.
   The tension here should be the longest beat — the reader must feel genuinely uncertain.
   Rhythm: slow it down. Let the reader hold their breath.

4. THE PLANTED DETAIL PAYS OFF (≈25% of story)
   The protagonist's quirk, or the planted detail, is the thing that saves everything.
   This must feel both unexpected AND inevitable — "of course it was that, how did I miss it."
   The protagonist earns the resolution through their own specific qualities. No adult rescue.

5. THE COST + RETURN (≈15% of story)
   Something small is different. Adventure has a price — not grief, just a mark.
   The world the protagonist returns to is the same world, but they are slightly changed.
   Final line: a specific image of the changed protagonist back in the ordinary world.

ADVENTURE LANGUAGE RULES:
- Vocabulary accessible but precise. Children need to follow the action, not decode it.
- Physical details over emotional commentary during action sequences.
- The protagonist's body is present — cold hands, fast breath, a stomach that drops.
- Danger must feel real before the resolution can feel earned.
`.trim(),

  wonder: `
══════════════════════════════════════════
GENRE: WONDER — STRUCTURAL ARC
══════════════════════════════════════════

VOICE: The narrator is as baffled as the character. Offers no explanation. Just witnesses.
Restraint at maximum — Klassen mode. The gap IS the story. Trust what you don't say.
Vocabulary rich and slightly invented. The thing that doesn't have a name yet deserves one.

STRUCTURAL SHAPE — THE WONDER ARC:

1. THE ORDINARY (≈20% of story)
   Begin in the mundane. The wonder must be earned by contrast.
   Establish the character's quirk: the thing they notice that others don't.
   The world should feel familiar, slightly underlit, on the edge of something.

2. THE FIRST SIGN (≈15% of story)
   Something is slightly wrong, or slightly more than right.
   The character notices. Nobody else does. Do not explain it.
   The narrator does not explain it either. The narrator noticed too. That's all.

3. THE DEEPENING (≈35% of story)
   The strangeness grows. The character follows it inward.
   Use questions, not answers. "Where does the sound go when the music stops?"
   is better than any explanation you could give.
   Long, slow, wavelike sentences. The reader should feel they're moving through water.
   RESIST EVERY IMPULSE TO EXPLAIN. The mystery is the value. Protect it.

4. THE REVELATION THAT IS NOT A RESOLUTION (≈30% of story)
   The character discovers something. It is beautiful, or strange, or both.
   It does not explain what came before. It deepens it.
   The story ends here — not resolved, not summarised, just... present.
   Final line: MUST be visual, sensory, and slightly open.
   The child should carry it into sleep and think about it tomorrow.
   It should open outward, not close down.

WONDER LANGUAGE RULES:
- Invent words when the right one doesn't exist. Name the unnamed.
- Sentences that end on soft sounds (l, m, n) feel like drifting. Use them for the deepening.
- Never answer a question you've raised. Raise better questions instead.
- The final line is the most important line you'll write. Draft it ten times.
`.trim(),

  cosy: `
══════════════════════════════════════════
GENRE: COSY — STRUCTURAL ARC
══════════════════════════════════════════

VOICE: Narrator is warm, unhurried — the voice of a trusted adult at bedtime.
Warmth maximum, but through specific detail, never through adjectives.
"The most important thing in a cosy story is that you believe the toast is warm."

STRUCTURAL SHAPE — THE COSY ARC (CIRCULAR):

1. THE WORLD (≈20% of story)
   Establish the character's world in loving specific detail.
   Smell, texture, the exact sound of the radiator. The crack in the ceiling they know by name.
   The character's quirk: the ritual that is uniquely, specifically theirs.
   The reader must want to live in this world before the story goes anywhere.

2. THE GENTLE DEPARTURE (≈25% of story)
   A small, mild version of the unknown. Not danger — just difference.
   Something outside the familiar, worth noticing, worth following a little.
   Long, meandering sentences. The pace of a walk, not a run.

3. THE SMALL DISCOVERY (≈30% of story)
   Something is found, or seen, or understood — quietly.
   It's not dramatic. It doesn't need to be. It's true, and small, and theirs.
   Repetition is a feature here: returning phrases, familiar rhythms.
   "And then. And then. And then." is a valid sentence structure.

4. THE RETURN (≈25% of story)
   Back to warmth. The world is the same — but the character carries the small discovery with them.
   Sensory detail peaks here: the smell of home, the specific weight of a familiar blanket.
   The character is settling. The prose should settle too — sentences slowing, softening.
   Final line: the character still. Somewhere safe. One specific sensory detail.
   The reader should feel they're already almost asleep.

COSY LANGUAGE RULES:
- If you can replace "cosy" with a smell or texture, do it.
- Sentences should feel like settling in. Don't rush them toward anything.
- The ordinary made magical through precision, not through actual magic.
- Read the ending aloud. Does the parent's voice naturally slow? If not, rewrite it.
`.trim(),

  therapeutic: `
══════════════════════════════════════════
GENRE: THERAPEUTIC — STRUCTURAL ARC
══════════════════════════════════════════

VOICE: The narrator nearly disappears. The child must feel the story is directly about them.
Warmth at maximum. Short, clear sentences. Nothing complex when the reader might be distressed.
Never promise everything will be fine. Promise the character is not alone.

THE SUPPORTING FIGURE — CRITICAL RULES:
Every therapeutic story needs one trusted figure (grandparent, parent, kind teacher, wise animal).
This figure's ONLY job is to provide Stage 2 validation. They must:
- Listen before speaking.
- Sit with the feeling before offering anything.
- NEVER say: "don't worry", "be brave", "it will be fine", "everything happens for a reason"
- ALWAYS validate before advising. "Your tummy knows something big is coming. That makes sense."
- Offer comfort through presence first. Words second.
- NOT solve the problem. That is not their job.

STRUCTURAL SHAPE — MIRROR → VALIDATE → MOVE → REST:

STAGE 1: MIRROR (≈20% of story, 150–200 words)
  Open inside the feeling. No preamble. The character is already in it.
  The child reading should think "that's me" within the first three sentences.
  Name the situation specifically — not "nervous" but the exact flavour of nervous.
  Do not move yet. Sit here.
  The physical sensation of the feeling: where does it live in the body?

STAGE 2: VALIDATE (≈25% of story, 150–250 words)
  The supporting figure arrives or speaks.
  They do not fix. They do not minimise. They do not rush.
  They name the feeling as reasonable: "It makes sense you feel that way."
  This is the most therapeutically important moment. Do not skip it or rush through it.
  The character feels something loosen — not because the problem is solved,
  but because someone understands.

STAGE 3: MOVE (≈35% of story, 200–350 words)
  A small shift. Not a solution — a handhold.
  One concrete coping tool, embedded naturally in the story (never delivered as instruction):
    - Belly breathing: breathe in like smelling warm bread, out like blowing a candle soft
    - Safe place visualisation: a place the character can always return to in their mind
    - The feelings name game: naming the feeling out loud IS the tool
    - The worry box: worries placed in an imaginary container, lid closed, until tomorrow
    - The anchor object: something physical that connects to love and safety when held
    - The body scan: moving attention slowly through the body, softening around the feeling
  The feeling doesn't disappear. There is just more room around it.
  Do not write: "and she felt much better." Write: "the tangles loosened. Just a little."

STAGE 4: REST (≈20% of story, 100–200 words)
  The character is calm, held, safe.
  The problem does not need to be resolved. The situation can still exist.
  What's resolved is the feeling of being alone with it.
  Sentences become shorter. Softer. The prose is already half asleep.
  Final line: the character still. Safe. One image of the world holding them gently.
  Do not summarise. Do not name what happened. Just: the world, and the child in it, at rest.

THERAPEUTIC LANGUAGE RULES:
- Never use a word an anxious child would need to stop and decode.
- Avoid anatomical emotion proxies — "her heart raced" → "something moved fast inside her"
- Do not resolve the external situation. Resolve only the feeling of being alone.
- The story is not a lesson. It is a companion.
`.trim(),

};


// ─────────────────────────────────────────────────────────────────────────────
// STORY BRIEF SCHEMA
// The data structure buildStoryPrompt() expects.
// All fields except `genre` and `situation` are optional but improve output quality.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StoryBrief
 *
 * REQUIRED
 * @property {'comedy'|'adventure'|'wonder'|'cosy'|'therapeutic'} genre
 * @property {string} situation  - The core situation or challenge. Be specific.
 *                                 Good: "Starting at a new school tomorrow and can't sleep"
 *                                 Weak: "Feeling nervous"
 *
 * PROTAGONIST (strongly recommended)
 * @property {string} [protagonistName]    - e.g. "Mia", "Leo", "Pip" — or leave blank to auto-generate
 * @property {string} [protagonistAge]     - e.g. "5" or "6–8"
 * @property {string} [weirdDetail]        - The one specific thing only they do/love/notice
 *                                           e.g. "keeps a list of every dog she's met, in order of
 *                                           how much they seemed to understand her"
 * @property {string} [want]               - The concrete thing they're trying to achieve
 *                                           e.g. "to get back before Dad notices the biscuits are gone"
 * @property {string} [flaw]               - The thing that gets in their way from inside
 *                                           e.g. "cannot walk past something interesting without investigating it"
 *
 * SUPPORTING CHARACTER
 * @property {string} [supportingName]     - e.g. "Grandma", "Uncle Felix", "the old tortoise"
 * @property {string} [supportingDetail]   - One thing only they would say or do
 *
 * STORY SHAPE
 * @property {string} [plantedDetail]      - The small thing to establish early that pays off at the end
 *                                           e.g. "a very small, very old key she found in a coat pocket"
 * @property {string} [targetFeeling]      - How should the child feel when the last line lands?
 *                                           e.g. "safe and slightly awed" / "like something is possible"
 * @property {string} [finalLineApproach]  - "image" | "sensation" | "open question" | "return to opening"
 *
 * FORMAT
 * @property {number} [wordCount]          - Target word count. Default varies by genre/age.
 * @property {boolean} [asChunks]          - Return as array of chunks (for rate-as-you-read UI)
 *                                           Default: false (returns full prose)
 * @property {Object} [styleDna]           - Optional Style DNA from the Style Lab.
 *                                           Shape: { [dimensionId]: { score: number } }
 */


// ─────────────────────────────────────────────────────────────────────────────
// STYLE DNA INTERPRETER
// Translates calibrated dimension scores from the Style Lab into prompt language.
// ─────────────────────────────────────────────────────────────────────────────

function interpretStyleDna(styleDna, genre) {
  if (!styleDna) return null;

  const interpretations = {
    specificity: (s) => s > 62 ? "Push specificity to the limit — every noun should be unrepeatable."
                      : s < 38 ? "Keep details impressionistic — evoke rather than enumerate."
                      : null,
    sent_length: (s) => s > 62 ? "Lean toward longer, flowing sentences. Let them carry the reader forward."
                       : s < 38 ? "Lean short and punchy. Each sentence should land independently."
                       : null,
    narrator:   (s) => s > 62 ? "The narrator's voice should be strongly present and opinionated."
                      : s < 38 ? "Keep the narrator nearly invisible — the story should feel unmediated."
                      : null,
    warmth:     (s) => s > 62 ? "Emotional temperature warm throughout — but through specific detail, never adjectives."
                      : s < 38 ? "Keep the emotional register dry and restrained. Let the reader feel without being told."
                      : null,
    vocabulary: (s) => s > 62 ? "Vocabulary rich and inventive. Invent words when the right one doesn't exist."
                      : s < 38 ? "Keep vocabulary simple and familiar. Accessibility over richness."
                      : null,
    rhythm:     (s) => s > 62 ? "Prose should be musical and patterned. Repetition is a feature. Lines should sing."
                      : s < 38 ? "Plain natural prose rhythm. Don't let the writing call attention to itself."
                      : null,
    restraint:  (s) => s > 62 ? "Leave significant gaps. Trust what you don't say. The reader fills the space."
                      : s < 38 ? "Explain what needs explaining. Don't leave the reader uncertain about what happened."
                      : null,
    quirk:      (s) => s > 62 ? "Characters should be wonderfully, specifically weird. Lean into the strange details."
                      : s < 38 ? "Keep characters grounded and relatable. Quirkiness should feel earned, not imposed."
                      : null,
  };

  const active = Object.entries(styleDna)
    .map(([dim, data]) => {
      const fn = interpretations[dim];
      if (!fn || !data?.score) return null;
      return fn(data.score);
    })
    .filter(Boolean);

  if (active.length === 0) return null;

  return `
CALIBRATED STYLE PREFERENCES (from editorial DNA — apply precisely):
${active.map(s => `- ${s}`).join('\n')}
`.trim();
}


// ─────────────────────────────────────────────────────────────────────────────
// WORD COUNT DEFAULTS BY GENRE + AGE
// ─────────────────────────────────────────────────────────────────────────────

function defaultWordCount(genre, age) {
  const ageNum = parseInt(age) || 5;
  const isYoung = ageNum <= 4;
  const isOlder = ageNum >= 7;

  const defaults = {
    comedy:      isYoung ? 450  : isOlder ? 900  : 650,
    adventure:   isYoung ? 500  : isOlder ? 1100 : 750,
    wonder:      isYoung ? 400  : isOlder ? 900  : 600,
    cosy:        isYoung ? 450  : isOlder ? 800  : 600,
    therapeutic: isYoung ? 500  : isOlder ? 1000 : 700,
  };

  return defaults[genre] || 650;
}


// ─────────────────────────────────────────────────────────────────────────────
// BRIEF → PROMPT ASSEMBLER
// Core export. Takes a StoryBrief, returns { system, user } for the API.
// ─────────────────────────────────────────────────────────────────────────────

export function buildStoryPrompt(brief) {
  const {
    genre,
    situation,
    protagonistName,
    protagonistAge,
    weirdDetail,
    want,
    flaw,
    supportingName,
    supportingDetail,
    plantedDetail,
    targetFeeling,
    finalLineApproach = 'image',
    wordCount,
    asChunks = false,
    styleDna,
  } = brief;

  if (!genre || !GENRE_ARCS[genre]) {
    throw new Error(`Invalid genre: "${genre}". Must be one of: ${Object.keys(GENRE_ARCS).join(', ')}`);
  }
  if (!situation) {
    throw new Error('Brief must include a situation.');
  }

  // ── System prompt: master + genre arc ────────────────────────────────────
  const system = [
    MASTER_SYSTEM_PROMPT,
    '',
    GENRE_ARCS[genre],
  ].join('\n');

  // ── User prompt: story brief ──────────────────────────────────────────────
  const targetWords = wordCount || defaultWordCount(genre, protagonistAge);

  const dnaSection = interpretStyleDna(styleDna, genre);

  const protagonistBlock = [
    protagonistName    && `Name: ${protagonistName}`,
    protagonistAge     && `Age: ${protagonistAge}`,
    weirdDetail        && `One weird detail (theirs alone): ${weirdDetail}`,
    want               && `What they want (concrete, specific): ${want}`,
    flaw               && `Their flaw (flip side of a virtue): ${flaw}`,
  ].filter(Boolean);

  const supportingBlock = [
    supportingName     && `Name / relationship: ${supportingName}`,
    supportingDetail   && `The one thing only they would say or do: ${supportingDetail}`,
  ].filter(Boolean);

  const shapeBlock = [
    plantedDetail      && `Planted detail to establish early and pay off at the end: ${plantedDetail}`,
    targetFeeling      && `Target feeling for the final line: ${targetFeeling}`,
    `Final line approach: ${finalLineApproach}`,
  ].filter(Boolean);

  const outputInstruction = asChunks
    ? `Return ONLY valid JSON with no markdown fences:
{"title":"working title (3–6 words, evocative not descriptive)","chunks":["chunk text","chunk text",...]}
Each chunk = 1–3 sentences. 8–12 chunks total. The story should feel complete and shaped, not truncated.`
    : `Return the story as flowing prose — no JSON, no headers, no labels.
Begin with the title on its own line, then a blank line, then the story.
${targetWords} words, ±10%.`;

  const sections = [
    `Write a SleepSeed ${genre} bedtime story using the arc structure and voice rules above.`,
    '',
    `SITUATION: ${situation}`,
    '',
  ];

  if (protagonistBlock.length > 0) {
    sections.push('PROTAGONIST:', ...protagonistBlock.map(l => `  ${l}`), '');
  }

  if (supportingBlock.length > 0) {
    sections.push('SUPPORTING CHARACTER:', ...supportingBlock.map(l => `  ${l}`), '');
  }

  if (shapeBlock.length > 0) {
    sections.push('STORY SHAPE:', ...shapeBlock.map(l => `  ${l}`), '');
  }

  if (dnaSection) {
    sections.push(dnaSection, '');
  }

  sections.push(outputInstruction);

  const user = sections.join('\n');

  return { system, user };
}


// ─────────────────────────────────────────────────────────────────────────────
// QUALITY CHECK PROMPT
// Run the generated story through this for a second pass before delivery.
// Returns structured feedback the app can use to decide whether to regenerate.
// ─────────────────────────────────────────────────────────────────────────────

export function buildQualityCheckPrompt(story, brief) {
  const system = `You are a senior SleepSeed story editor.
Your job is to assess whether a generated story meets the SleepSeed quality bar.
Be precise, honest, and specific. Do not praise vaguely. Do not fail stories on minor style preferences.
Flag genuine structural failures and genuine craft weaknesses only.`;

  const user = `Review this SleepSeed ${brief.genre} bedtime story against the quality checklist below.

STORY:
"""
${story}
"""

CHECKLIST — respond with PASS or FAIL + one specific sentence of evidence for each:

1. SPECIFICITY: Every character has at least one detail no other character in any other story has.
2. BANNED PHRASES: No banned phrases appear anywhere in the story.
3. READ-ALOUD RHYTHM: Every sentence reads naturally when spoken aloud at a gentle pace.
4. PROTAGONIST EARNS IT: The protagonist solves their problem using their own specific qualities — no adult rescue, no luck.
5. SENSORY DETAIL: At least one piece of sensory detail (smell, texture, sound, temperature) is present.
6. FINAL LINE: The final line lands on an image, sensation, or small specific moment — not a moral.
7. DIALOGUE SOUNDS SPOKEN: Any dialogue sounds like talking, not writing.
8. PLANTED DETAIL: ${brief.plantedDetail ? `The planted detail ("${brief.plantedDetail}") appears early and pays off.` : 'A detail is established early that pays off at the end.'}
9. EARNED ENDING: The emotional weight of the ending matches what came before — not happier than earned.
10. GENRE ARC: The story follows the ${brief.genre} structural arc correctly.

Return ONLY valid JSON:
{
  "overallVerdict": "PASS" | "FAIL" | "PASS_WITH_NOTES",
  "score": <number 0-10>,
  "checks": {
    "specificity":       { "result": "PASS"|"FAIL", "note": "..." },
    "bannedPhrases":     { "result": "PASS"|"FAIL", "note": "..." },
    "readAloudRhythm":   { "result": "PASS"|"FAIL", "note": "..." },
    "protagonistEarns":  { "result": "PASS"|"FAIL", "note": "..." },
    "sensoryDetail":     { "result": "PASS"|"FAIL", "note": "..." },
    "finalLine":         { "result": "PASS"|"FAIL", "note": "..." },
    "dialogueSpoken":    { "result": "PASS"|"FAIL", "note": "..." },
    "plantedDetail":     { "result": "PASS"|"FAIL", "note": "..." },
    "earnedEnding":      { "result": "PASS"|"FAIL", "note": "..." },
    "genreArc":          { "result": "PASS"|"FAIL", "note": "..." }
  },
  "topIssue": "The single most important thing to fix, in one sentence.",
  "suggestedFix": "One concrete revision instruction."
}`;

  return { system, user };
}


// ─────────────────────────────────────────────────────────────────────────────
// REGENERATION PROMPT
// When a quality check fails, use this to attempt a targeted fix
// rather than regenerating from scratch.
// ─────────────────────────────────────────────────────────────────────────────

export function buildRegenerationPrompt(story, qualityResult, brief) {
  const system = `You are a master children's bedtime story editor for SleepSeed.
You receive a story that has failed quality review, a specific diagnosis, and a fix instruction.
Your job is to revise the story to address the issue — and only that issue.
Do not change anything that is working. Do not rewrite what wasn't broken.`;

  const user = `Revise this SleepSeed ${brief.genre} story to fix the identified issue.

ORIGINAL STORY:
"""
${story}
"""

QUALITY CHECK RESULT:
- Score: ${qualityResult.score}/10
- Top issue: ${qualityResult.topIssue}
- Suggested fix: ${qualityResult.suggestedFix}

Make the minimum change necessary to fix the top issue.
Preserve everything that was working.
Return the revised story as flowing prose — title on the first line, blank line, then story.
Do not explain your changes. Just return the revised story.`;

  return { system, user };
}


// ─────────────────────────────────────────────────────────────────────────────
// TITLE GENERATION
// Generates 3 title options for a completed story.
// ─────────────────────────────────────────────────────────────────────────────

export function buildTitlePrompt(story) {
  const system = `You write titles for children's bedtime stories.
Great titles are: evocative not descriptive, 3–6 words, specific not general, slightly unexpected.
"The Night the Stars Listened" not "The Story About Feelings."
"Milo's Very Loud Problem" not "The Noisy Adventure."`;

  const user = `Generate three title options for this story.

"""
${story.slice(0, 600)}…
"""

Return ONLY valid JSON: {"titles": ["title one", "title two", "title three"]}`;

  return { system, user };
}


// ─────────────────────────────────────────────────────────────────────────────
// PERSONALISATION PROMPT
// Takes a library story and personalises it for a specific child.
// ─────────────────────────────────────────────────────────────────────────────

export function buildPersonalisationPrompt(originalStory, childProfile) {
  const {
    childName,
    childAge,
    childDetail,     // something specific about this child
    childFear,       // for therapeutic stories
    childInterest,   // a current obsession or favourite thing
  } = childProfile;

  const system = `You are personalising a SleepSeed bedtime story for a specific child.
Your job is surgical: weave in the child's name and details so the story feels written for them.
Do NOT change the story's structure, arc, or emotional shape.
Do NOT change what happens — only who it happens to, and the specific details around them.
The story should feel discovered, not assembled. The personalisation should be invisible.`;

  const user = `Personalise this story for ${childName}.

ORIGINAL STORY:
"""
${originalStory}
"""

CHILD PROFILE:
- Name: ${childName}
${childAge     ? `- Age: ${childAge}` : ''}
${childDetail  ? `- Something specific about them: ${childDetail}` : ''}
${childFear    ? `- Current fear or worry: ${childFear}` : ''}
${childInterest? `- Current obsession or favourite thing: ${childInterest}` : ''}

PERSONALISATION RULES:
1. Replace the protagonist's name with ${childName} throughout.
2. Weave in one specific detail from the child profile naturally — don't announce it.
3. If a detail from the profile connects to the planted detail or quirk, use that connection.
4. Do not change what happens in the story — only who it happens to.
5. The personalisation should feel like it was always there.

Return the personalised story as flowing prose — title on the first line, then the story.`;

  return { system, user };
}


// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE: FULL GENERATION PIPELINE
// Assembles prompt, calls API, runs quality check, regenerates if needed.
// Pass your Anthropic client instance.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStory(brief, anthropicClient, options = {}) {
  const {
    model = 'claude-sonnet-4-20250514',
    maxTokens = 2000,
    autoQualityCheck = true,
    autoRegenerate = true,
    minScore = 7,
    onProgress = null,  // callback({ stage: 'generating'|'checking'|'revising'|'done' })
  } = options;

  const callAPI = async (system, user, tokens = maxTokens) => {
    const response = await anthropicClient.messages.create({
      model,
      max_tokens: tokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return response.content[0].text;
  };

  // Stage 1: Generate
  onProgress?.({ stage: 'generating' });
  const { system, user } = buildStoryPrompt(brief);
  let story = await callAPI(system, user);

  if (!autoQualityCheck) {
    onProgress?.({ stage: 'done' });
    return { story, qualityResult: null, revised: false };
  }

  // Stage 2: Quality check
  onProgress?.({ stage: 'checking' });
  const { system: qSystem, user: qUser } = buildQualityCheckPrompt(story, brief);
  let qualityRaw = await callAPI(qSystem, qUser, 800);

  let qualityResult;
  try {
    qualityResult = JSON.parse(qualityRaw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
  } catch (_) {
    onProgress?.({ stage: 'done' });
    return { story, qualityResult: null, revised: false };
  }

  // Stage 3: Revise if needed
  if (autoRegenerate && qualityResult.score < minScore && qualityResult.overallVerdict === 'FAIL') {
    onProgress?.({ stage: 'revising' });
    const { system: rSystem, user: rUser } = buildRegenerationPrompt(story, qualityResult, brief);
    story = await callAPI(rSystem, rUser);
  }

  onProgress?.({ stage: 'done' });
  return {
    story,
    qualityResult,
    revised: autoRegenerate && qualityResult.score < minScore,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE USAGE
// ─────────────────────────────────────────────────────────────────────────────

/*

// Minimal brief — works but produces less precise output:
const { system, user } = buildStoryPrompt({
  genre: 'therapeutic',
  situation: 'Starting at a new school tomorrow and cannot sleep',
});

// Full brief — produces the best output:
const { system, user } = buildStoryPrompt({
  genre: 'therapeutic',
  situation: 'Starting at a new school tomorrow and cannot sleep',
  protagonistName: 'Mia',
  protagonistAge: '5',
  weirdDetail: 'keeps a list of every dog she has ever met, in order of how much they seemed to understand her',
  want: 'to fall asleep before tomorrow arrives',
  flaw: 'cannot stop thinking once she starts',
  supportingName: 'Grandma',
  supportingDetail: 'always smells of the kind of soap that comes in tins',
  plantedDetail: 'a small smooth stone Grandma gave her that fits exactly in her palm',
  targetFeeling: 'safe and held, not alone',
  finalLineApproach: 'sensation',
  protagonistAge: '5',
  wordCount: 700,
  asChunks: false,
});

// With Style DNA from the Style Lab:
const { system, user } = buildStoryPrompt({
  genre: 'wonder',
  situation: 'A child who finds something in the garden that shouldn\'t be there',
  styleDna: {
    specificity: { score: 78 },
    restraint:   { score: 85 },
    narrator:    { score: 42 },
    vocabulary:  { score: 72 },
  },
});

// Full pipeline with quality check and auto-revision:
const { story, qualityResult, revised } = await generateStory(brief, anthropicClient, {
  autoQualityCheck: true,
  autoRegenerate: true,
  minScore: 7,
  onProgress: ({ stage }) => console.log(`Stage: ${stage}`),
});

*/
