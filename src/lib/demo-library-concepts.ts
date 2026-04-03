// ─────────────────────────────────────────────────────────────────────────────
// DEMO LIBRARY CONCEPTS
// Rich StoryBrief objects for the 4 library buckets.
// Each concept is designed to produce the highest-quality output from the
// SleepSeed generator by providing specific, evocative inputs.
// ─────────────────────────────────────────────────────────────────────────────

export type LibraryBucket = 'emotional-truth' | 'wonder-cozy' | 'funny-playful' | 'seasonal-milestone';

export interface LibraryConcept {
  id: string;
  bucket: LibraryBucket;
  label: string;              // short display name
  ageGroup: string;           // age3, age5, age7, age10
  vibe: string;               // maps to library vibe filter
  lessons: string[];
  featured: boolean;          // candidate for Book of the Day
  brief: {
    genre: 'comedy' | 'adventure' | 'wonder' | 'cosy' | 'therapeutic' | 'mystery';
    situation: string;
    protagonistName: string;
    protagonistAge: string;
    weirdDetail: string;
    want: string;
    flaw: string;
    supportingName?: string;
    supportingDetail?: string;
    setting: string;
    sensoryAnchor: string;
    timeOfDay: string;
    plantedDetail: string;
    targetFeeling: string;
    finalLineApproach: 'image' | 'sensation' | 'open question' | 'return to opening';
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUCKET A: EMOTIONAL TRUTH
// ═══════════════════════════════════════════════════════════════════════════

const emotionalTruth: LibraryConcept[] = [
  {
    id: 'et-bedtime-nerves',
    bucket: 'emotional-truth',
    label: 'Bedtime Nerves',
    ageGroup: 'age5',
    vibe: 'heartfelt',
    lessons: ['courage', 'self-soothing', 'bedtime'],
    featured: true,
    brief: {
      genre: 'therapeutic',
      situation: 'A child who keeps calling out from bed because the dark feels too big tonight — not monsters, just the bigness of the quiet when everyone else seems far away',
      protagonistName: 'Iris',
      protagonistAge: '5',
      weirdDetail: 'counts the stripes on her pillowcase every night before sleeping — she knows there are seventeen but checks anyway',
      want: 'to feel like the dark is small enough to hold instead of the other way around',
      flaw: 'believes that if she stops paying attention to everything at once, something will go wrong',
      setting: 'A bedroom at the top of a narrow staircase where the landing light makes a triangle on the ceiling',
      sensoryAnchor: 'the warm-bread smell from downstairs where someone left the oven door open',
      timeOfDay: 'just past bedtime, the house still making settling noises',
      plantedDetail: 'a tiny glow-in-the-dark star stuck to her thumbnail from an old sticker sheet',
      targetFeeling: 'held — like the dark is a blanket, not a room',
      finalLineApproach: 'sensation',
    },
  },
  {
    id: 'et-first-day',
    bucket: 'emotional-truth',
    label: 'First Day of School',
    ageGroup: 'age5',
    vibe: 'heartfelt',
    lessons: ['courage', 'new beginnings', 'belonging'],
    featured: false,
    brief: {
      genre: 'therapeutic',
      situation: 'Tomorrow is the first day at a new school and the child has been pretending all week that she is fine but tonight in bed it all comes loose',
      protagonistName: 'Wren',
      protagonistAge: '6',
      weirdDetail: 'always ties her left shoe first and if she accidentally does the right one she has to start over',
      want: 'to know that someone at the new school will notice her on the first day',
      flaw: 'rehearses conversations in her head so much that when real ones happen she forgets her lines',
      supportingName: 'Grandpa Len',
      supportingDetail: 'sends voice messages where he narrates what the birds outside his window are doing like it is breaking news',
      setting: 'A bedroom shared with an older sibling who is already asleep and breathing slow',
      sensoryAnchor: 'the tick of the radiator expanding — three clicks then silence then three more',
      timeOfDay: 'the hour when streetlights make the curtains glow amber',
      plantedDetail: 'a small flat stone from the beach that Grandpa Len said holds one emergency wish',
      targetFeeling: 'like the morning will come and she will walk through the gate and it will be okay — not perfect, just okay',
      finalLineApproach: 'image',
    },
  },
  {
    id: 'et-missing-someone',
    bucket: 'emotional-truth',
    label: 'Missing Someone',
    ageGroup: 'age7',
    vibe: 'heartfelt',
    lessons: ['grief', 'memory', 'connection'],
    featured: true,
    brief: {
      genre: 'wonder',
      situation: 'A child misses someone who used to be there at bedtime and is trying to remember exactly what their voice sounded like when they said goodnight',
      protagonistName: 'Theo',
      protagonistAge: '7',
      weirdDetail: 'collects the little metal tabs from juice cartons and keeps them in a tin that used to hold cough drops',
      want: 'to hear the voice one more time — not a recording, the real one, the one that had warm edges',
      flaw: 'holds onto things so tight that his hands get tired but he will not put them down',
      setting: 'A window seat where the curtain makes a room within a room, facing a garden where the swing still sways sometimes in wind',
      sensoryAnchor: 'the cedar smell of a jumper that still lives folded in a drawer',
      timeOfDay: 'the blue hour — not dark yet but not light, the sky the colour of held breath',
      plantedDetail: 'a crease in the windowsill where someone once pressed a coin for luck and the mark is still there',
      targetFeeling: 'that love does not need a voice to be heard — it lives in the places it was',
      finalLineApproach: 'return to opening',
    },
  },
  {
    id: 'et-feeling-left-out',
    bucket: 'emotional-truth',
    label: 'Feeling Left Out',
    ageGroup: 'age7',
    vibe: 'heartfelt',
    lessons: ['belonging', 'friendship', 'self-worth'],
    featured: false,
    brief: {
      genre: 'therapeutic',
      situation: 'At the park today everyone paired up for a game and the child was the one left standing — not picked last, just not picked, which felt worse',
      protagonistName: 'Juno',
      protagonistAge: '8',
      weirdDetail: 'draws tiny maps on the back of her hand in blue pen — imaginary places she names after moods',
      want: 'to stop feeling like she is standing slightly outside a window looking in at a warm room',
      flaw: 'would rather be invisible than risk being seen and not wanted',
      supportingName: 'a stray cat called Postbox',
      supportingDetail: 'sits on the same fence every evening and blinks slowly like he has all the time in the world for you',
      setting: 'The space between the garden shed and the fence where nobody looks but the light is golden at this hour',
      sensoryAnchor: 'warm brick against her back and the green smell of cut grass',
      timeOfDay: 'late golden hour, shadows getting long and soft',
      plantedDetail: 'a map she drew on her hand this morning of a place called Belonging — she almost washed it off',
      targetFeeling: 'that some people are quiet rooms and that is its own kind of warmth',
      finalLineApproach: 'image',
    },
  },
  {
    id: 'et-being-brave',
    bucket: 'emotional-truth',
    label: 'Being Brave',
    ageGroup: 'age5',
    vibe: 'heartfelt',
    lessons: ['courage', 'growth', 'trying'],
    featured: false,
    brief: {
      genre: 'adventure',
      situation: 'A child who said she would do the thing tomorrow and now tomorrow is tonight and the brave feeling she had when she said it has completely gone',
      protagonistName: 'Nell',
      protagonistAge: '5',
      weirdDetail: 'talks to her toes when she is nervous — she believes the left ones are braver',
      want: 'to find the brave feeling again — it was here this morning, she is sure of it',
      flaw: 'makes promises to herself faster than she can keep them',
      setting: 'A hallway at night where the coats on the hooks look like tall quiet people listening',
      sensoryAnchor: 'the rubbery smell of wellington boots and the coolness of tile under bare feet',
      timeOfDay: 'deep bedtime, the house gone still',
      plantedDetail: 'a red button on her favourite coat that is loose and wobbles when she touches it — brave things wobble too',
      targetFeeling: 'that brave is not the absence of wobble — brave is walking while wobbling',
      finalLineApproach: 'sensation',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BUCKET B: WONDER / COZY
// ═══════════════════════════════════════════════════════════════════════════

const wonderCozy: LibraryConcept[] = [
  {
    id: 'wc-lantern-woods',
    bucket: 'wonder-cozy',
    label: 'Lantern Woods',
    ageGroup: 'age5',
    vibe: 'cosy',
    lessons: ['wonder', 'nature', 'quiet joy'],
    featured: true,
    brief: {
      genre: 'wonder',
      situation: 'Every night after the last light goes off, a forest grows between the floorboards of a bedroom — small enough to miss, big enough to get lost in',
      protagonistName: 'Pip',
      protagonistAge: '5',
      weirdDetail: 'whispers goodnight to every object in his room in the same order and gets very upset if he misses one',
      want: 'to follow the smallest light he has ever seen to wherever it is going',
      flaw: 'cannot resist investigating, even when staying still would be wiser',
      setting: 'A forest the size of a bedroom where the trees are made of pencils and the lanterns are fireflies resting',
      sensoryAnchor: 'the woody, graphite smell of pencil shavings and the warmth of tiny light',
      timeOfDay: 'the hour when the room stops being a room and starts being something else',
      plantedDetail: 'a firefly that blinks in a pattern — three short, one long — like it is trying to say a word',
      targetFeeling: 'wonder — the kind that makes you breathe more slowly',
      finalLineApproach: 'image',
    },
  },
  {
    id: 'wc-moon-garden',
    bucket: 'wonder-cozy',
    label: 'Moon Garden',
    ageGroup: 'age3',
    vibe: 'calm',
    lessons: ['wonder', 'patience', 'growing'],
    featured: false,
    brief: {
      genre: 'cosy',
      situation: 'A garden that only blooms when the moon looks directly at it — and tonight the moon is looking',
      protagonistName: 'Lumi',
      protagonistAge: '4',
      weirdDetail: 'carries a small watering can everywhere, even to bed, just in case something needs growing',
      want: 'to see the biggest flower open — the one that has been waiting all month',
      flaw: 'so impatient she tries to open buds with her fingers',
      setting: 'A garden behind a blue gate where the flowers are made of moonlight and the paths are made of soft dust',
      sensoryAnchor: 'cool damp earth and the faint sweetness of jasmine that only comes out at night',
      timeOfDay: 'full moon, everything silver and slow',
      plantedDetail: 'a seed she planted three weeks ago that has not grown yet — she checks every night',
      targetFeeling: 'that some beautiful things need you to wait for them',
      finalLineApproach: 'image',
    },
  },
  {
    id: 'wc-blanket-kingdom',
    bucket: 'wonder-cozy',
    label: 'Blanket Kingdom',
    ageGroup: 'age3',
    vibe: 'cosy',
    lessons: ['imagination', 'safety', 'home'],
    featured: false,
    brief: {
      genre: 'cosy',
      situation: 'Under the blanket is a whole kingdom — it has always been there but tonight is the first time the child notices the door',
      protagonistName: 'Dot',
      protagonistAge: '3',
      weirdDetail: 'puts her stuffed rabbit in charge of guarding her pillow every single night',
      want: 'to find out where the warm wind is coming from under the blanket',
      flaw: 'gets so excited she forgets to be gentle',
      supportingName: 'General Buttons (her rabbit)',
      supportingDetail: 'has one ear longer than the other and has never once abandoned his post',
      setting: 'The Blanket Kingdom — a place of soft hills, warm valleys, and a river made of the sound of someone humming',
      sensoryAnchor: 'the laundered cotton warmth and the weight of a tucked-in blanket',
      timeOfDay: 'just tucked in, the sheets still cool at the edges',
      plantedDetail: 'a loose thread at the blanket edge that is actually a path',
      targetFeeling: 'that bed is the safest, cosiest kingdom there is',
      finalLineApproach: 'sensation',
    },
  },
  {
    id: 'wc-sleepy-cloud-train',
    bucket: 'wonder-cozy',
    label: 'Sleepy Cloud Train',
    ageGroup: 'age5',
    vibe: 'calm',
    lessons: ['wonder', 'letting go', 'sleep'],
    featured: false,
    brief: {
      genre: 'wonder',
      situation: 'A train made of clouds arrives at the end of every bed at exactly the right time and goes to exactly the right place — wherever that is tonight',
      protagonistName: 'Marlo',
      protagonistAge: '5',
      weirdDetail: 'always checks his ticket even though it says the same thing every night: "Where you need to go"',
      want: 'to stay awake long enough to see where the train actually goes',
      flaw: 'fights sleep like it is a contest he can win',
      setting: 'A station made of pillows and fog, where the platform is the edge of the mattress and the conductor is made of yawns',
      sensoryAnchor: 'the rocking, cotton-soft motion of a train on cloud tracks and the sound of far-off wind chimes',
      timeOfDay: 'deep night, the hour when thoughts go soft',
      plantedDetail: 'a window on the train that shows a different dream every time he blinks',
      targetFeeling: 'that letting go of the day is not losing it — it is putting it somewhere safe',
      finalLineApproach: 'sensation',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BUCKET C: FUNNY / PLAYFUL
// ═══════════════════════════════════════════════════════════════════════════

const funnyPlayful: LibraryConcept[] = [
  {
    id: 'fp-shy-dragon',
    bucket: 'funny-playful',
    label: 'Shy Dragon',
    ageGroup: 'age5',
    vibe: 'funny',
    lessons: ['shyness', 'friendship', 'being yourself'],
    featured: false,
    brief: {
      genre: 'comedy',
      situation: 'A dragon who is supposed to be terrifying but is actually so shy that every time someone looks at him he turns invisible — which is very inconvenient because he is also lost',
      protagonistName: 'Ember',
      protagonistAge: '6',
      weirdDetail: 'his fire comes out as warm hiccups and he always apologises to whatever he accidentally toasts',
      want: 'to ask someone for directions home without disappearing the moment they make eye contact',
      flaw: 'so worried about being scary that he makes himself harder to find than any actual scary thing',
      supportingName: 'a very small, very confident hedgehog called Brisket',
      supportingDetail: 'walks directly toward anything frightening because she assumes it is probably more scared of her',
      setting: 'A village where all the houses are painted different colours and the lampposts hum lullabies',
      sensoryAnchor: 'the smoky-sweet smell of accidentally toasted acorns',
      timeOfDay: 'early evening, when the sky is the colour of a peach',
      plantedDetail: 'a trail of tiny scorch marks that Ember leaves behind without realising — his footprints',
      targetFeeling: 'that being shy does not mean being invisible, and being visible is survivable',
      finalLineApproach: 'image',
    },
  },
  {
    id: 'fp-toast-monster',
    bucket: 'funny-playful',
    label: 'Toast-Loving Monster',
    ageGroup: 'age3',
    vibe: 'silly',
    lessons: ['sharing', 'manners', 'friendship'],
    featured: false,
    brief: {
      genre: 'comedy',
      situation: 'A monster who lives under the bed has been stealing toast from the kitchen every night and today he got caught because he left a trail of crumbs from the toaster to the bed',
      protagonistName: 'Crumb',
      protagonistAge: '4',
      weirdDetail: 'rates every piece of toast on a scale of one to ten and keeps the scores in a tiny notebook written in jam',
      want: 'one more piece of toast — specifically the corner piece with the most butter — before anyone finds his notebook',
      flaw: 'absolutely cannot be quiet when eating something he loves — he hums and his tail thumps the floor',
      setting: 'A kitchen at midnight where the fridge hums and the moonlight makes the countertop look like a stage',
      sensoryAnchor: 'the warm yeasty smell of toast and the click of a toaster lever',
      timeOfDay: 'midnight — the toast hour',
      plantedDetail: 'a single toast crumb on the child\'s pillow that nobody can explain',
      targetFeeling: 'that some friends find you through crumbs',
      finalLineApproach: 'image',
    },
  },
  {
    id: 'fp-upside-down-parade',
    bucket: 'funny-playful',
    label: 'Upside-Down Parade',
    ageGroup: 'age5',
    vibe: 'silly',
    lessons: ['silliness', 'perspective', 'joy'],
    featured: true,
    brief: {
      genre: 'comedy',
      situation: 'A parade that only happens on ceilings — the marching band plays upside down, the confetti falls up, and nobody is quite sure who organised it but it happens every Tuesday at bedtime',
      protagonistName: 'Flip',
      protagonistAge: '6',
      weirdDetail: 'can only see the parade when she hangs her head off the edge of the bed — which her parents keep telling her not to do',
      want: 'to join the parade but she cannot figure out how to get to the ceiling without gravity noticing',
      flaw: 'makes plans that are three steps too complicated when the simple answer is right there',
      supportingName: 'a moth called Gerald',
      supportingDetail: 'has been to every parade and critiques the drumming with great authority',
      setting: 'The ceiling of a bedroom that, from upside down, looks like a grand boulevard with cornicing for buildings and a light fitting for a fountain',
      sensoryAnchor: 'the blood-rush of hanging upside down and the distant tinkle of tiny brass instruments',
      timeOfDay: 'Tuesday bedtime, obviously',
      plantedDetail: 'a piece of upside-down confetti that sticks to her nose and refuses to fall',
      targetFeeling: 'that the world looks completely different from a new angle — and sometimes that is all you need',
      finalLineApproach: 'return to opening',
    },
  },
  {
    id: 'fp-hiccup-owl',
    bucket: 'funny-playful',
    label: 'Hiccup Owl',
    ageGroup: 'age3',
    vibe: 'funny',
    lessons: ['patience', 'helping', 'accepting imperfection'],
    featured: false,
    brief: {
      genre: 'comedy',
      situation: 'An owl who is supposed to sing the lullaby that puts the forest to sleep has the hiccups and every time she tries to sing, a hiccup comes out instead — and hiccups are the opposite of sleepy',
      protagonistName: 'Olive',
      protagonistAge: '4',
      weirdDetail: 'her hiccups come in different sizes — small ones ruffle feathers, medium ones shake branches, and the big ones make stars blink',
      want: 'to finish just one lullaby — one complete song — before the whole forest gives up and stays awake all night',
      flaw: 'tries so hard to stop the hiccups that she hiccups more',
      supportingName: 'a very sleepy dormouse called Pillow',
      supportingDetail: 'keeps falling asleep mid-sentence and finishing the sentence in his dreams, out loud, and wrong',
      setting: 'A forest where every creature is waiting to sleep and the branches make a kind of amphitheatre around Olive\'s singing branch',
      sensoryAnchor: 'the pine-and-cold-air smell of night forest and the soft rustle of things trying not to move',
      timeOfDay: 'that exact moment when the forest should be going to sleep but is not',
      plantedDetail: 'the dormouse\'s half-asleep mumble that accidentally finishes Olive\'s lullaby',
      targetFeeling: 'that sometimes the imperfect thing is the perfect thing',
      finalLineApproach: 'sensation',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BUCKET D: SEASONAL / MILESTONE
// ═══════════════════════════════════════════════════════════════════════════

const seasonalMilestone: LibraryConcept[] = [
  {
    id: 'sm-spring-night',
    bucket: 'seasonal-milestone',
    label: 'Spring Night',
    ageGroup: 'age5',
    vibe: 'calm',
    lessons: ['change', 'growth', 'seasons'],
    featured: false,
    brief: {
      genre: 'wonder',
      situation: 'The first warm night of spring when the window is open for the first time in months and the whole world sounds different',
      protagonistName: 'Rowan',
      protagonistAge: '5',
      weirdDetail: 'keeps a list of the first things he hears through the open window each spring — this year he is ready',
      want: 'to hear something he has never heard before — the one new sound that means spring has really arrived',
      flaw: 'listens so hard for the extraordinary that he nearly misses the ordinary beautiful things',
      setting: 'A bedroom with the window cracked open for the first time since October, curtain lifting in slow breath',
      sensoryAnchor: 'the wet-earth, green-shoot smell of spring after rain and the coolness of outside air on warm skin',
      timeOfDay: 'just after dark, the sky still holding the last blue',
      plantedDetail: 'a frog that makes one sound — just one — at the exact moment Rowan stops trying to hear',
      targetFeeling: 'that new beginnings often arrive quietly',
      finalLineApproach: 'sensation',
    },
  },
  {
    id: 'sm-holiday-eve',
    bucket: 'seasonal-milestone',
    label: 'Holiday Eve',
    ageGroup: 'age5',
    vibe: 'cosy',
    lessons: ['anticipation', 'family', 'presence'],
    featured: false,
    brief: {
      genre: 'cosy',
      situation: 'The night before the holiday when the house smells like baking and there are sounds from downstairs and the child is supposed to be asleep but the excitement is a physical thing in her chest',
      protagonistName: 'Esme',
      protagonistAge: '5',
      weirdDetail: 'counts her breaths in twos when she is excited because odd numbers feel too fast',
      want: 'to make tonight last — to hold the before-feeling because she suspects it might be the best part',
      flaw: 'so focused on what is coming next that she almost misses what is happening now',
      setting: 'A house on the eve of something — lights on downstairs, whispered preparations, the clink of things being arranged',
      sensoryAnchor: 'cinnamon, warm butter, and the particular silence between footsteps when someone is trying to be quiet',
      timeOfDay: 'the night before — the longest, most delicious night of the year',
      plantedDetail: 'a crack of light under the door that widens and narrows as people pass — a rhythm, like breathing',
      targetFeeling: 'that the waiting is part of the gift',
      finalLineApproach: 'sensation',
    },
  },
  {
    id: 'sm-sibling-arrival',
    bucket: 'seasonal-milestone',
    label: 'New Sibling',
    ageGroup: 'age5',
    vibe: 'heartfelt',
    lessons: ['change', 'love expanding', 'identity'],
    featured: false,
    brief: {
      genre: 'therapeutic',
      situation: 'There is a new baby in the house and everything has changed shape — the routines, the noise level, where people sit, and especially bedtime, which used to be just theirs',
      protagonistName: 'Kit',
      protagonistAge: '5',
      weirdDetail: 'makes a small "hmm" sound before every sentence, like he is checking the words are right before letting them out',
      want: 'to know that bedtime still belongs to him — that this one thing has not been given away',
      flaw: 'keeps his feelings so organised that when a big one arrives it has nowhere to go',
      supportingName: 'Mum',
      supportingDetail: 'still does the thing where she traces a letter on his back and he has to guess which one — she has not forgotten',
      setting: 'A bedroom that used to be only his and now has a cot in the corner that was not there last month',
      sensoryAnchor: 'the new-laundry smell of baby things mixed with his familiar room',
      timeOfDay: 'bedtime, the baby asleep for once, the house holding its breath',
      plantedDetail: 'Mum\'s finger tracing a letter on his back — the same letter every night since he was small',
      targetFeeling: 'that love does not divide when someone new arrives — it builds a new room',
      finalLineApproach: 'sensation',
    },
  },
  {
    id: 'sm-birthday-before-bed',
    bucket: 'seasonal-milestone',
    label: 'Birthday Before Bed',
    ageGroup: 'age5',
    vibe: 'heartfelt',
    lessons: ['growing up', 'gratitude', 'time'],
    featured: false,
    brief: {
      genre: 'cosy',
      situation: 'It is the last hour of a birthday and the child does not want it to end — the cake is eaten, the presents are opened, the people have gone home, and now it is just her and the quiet and one more year',
      protagonistName: 'Hana',
      protagonistAge: '6',
      weirdDetail: 'keeps every birthday candle in a drawer, lined up by year, because each one held a wish',
      want: 'to feel like turning a year older does not mean losing the year she just had',
      flaw: 'tries to hold onto everything at once instead of letting things become memories',
      setting: 'A living room after a party — streamers drooping, one balloon on the ceiling, the table cleared except for a plate with cake crumbs',
      sensoryAnchor: 'the sweet wax smell of a just-blown-out candle and the tired warmth after a big day',
      timeOfDay: 'late — past bedtime — the last light on in the house',
      plantedDetail: 'the birthday candle, still warm, going into the drawer with the others',
      targetFeeling: 'that growing up is not losing things — it is carrying them forward',
      finalLineApproach: 'return to opening',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_CONCEPTS: LibraryConcept[] = [
  ...emotionalTruth,
  ...wonderCozy,
  ...funnyPlayful,
  ...seasonalMilestone,
];

export const CONCEPTS_BY_BUCKET: Record<LibraryBucket, LibraryConcept[]> = {
  'emotional-truth': emotionalTruth,
  'wonder-cozy': wonderCozy,
  'funny-playful': funnyPlayful,
  'seasonal-milestone': seasonalMilestone,
};

export const BUCKET_LABELS: Record<LibraryBucket, string> = {
  'emotional-truth': 'Emotional Truth',
  'wonder-cozy': 'Wonder & Cozy',
  'funny-playful': 'Funny & Playful',
  'seasonal-milestone': 'Seasonal & Milestone',
};

export function getFeaturedCandidates(): LibraryConcept[] {
  return ALL_CONCEPTS.filter(c => c.featured);
}
