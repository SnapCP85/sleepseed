export interface CreatureDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  nameSuggestions: string[];
}

export const CREATURES: CreatureDef[] = [
  { id:'bunny',       name:'Moon Bunny',    emoji:'🐰', color:'#F5B84C', description:'soft, moonlit, impossibly fluffy',       nameSuggestions:['Luna','Mochi','Pip','Star'] },
  { id:'fox',         name:'Ember Fox',     emoji:'🦊', color:'#FF8264', description:'clever, warm, a little mischievous',      nameSuggestions:['Ember','Russet','Maple','Blaze'] },
  { id:'dragon',      name:'Storm Drake',   emoji:'🐉', color:'#60C8A0', description:'fierce, magical, secretly gentle',        nameSuggestions:['Zephyr','Sprig','Kite','Ember'] },
  { id:'owl',         name:'Dusk Owl',      emoji:'🦉', color:'#9A7FD4', description:'wise, watchful, full of secrets',         nameSuggestions:['Sage','Dusk','Merlin','Hoot'] },
  { id:'bear',        name:'Frost Bear',    emoji:'🐻', color:'#90C8E8', description:'cosy, strong, warmth itself',             nameSuggestions:['Frost','Birch','Cloud','Pudding'] },
  { id:'cat',         name:'Shadow Cat',    emoji:'🐱', color:'#A090D0', description:'curious, independent, secretly snuggly', nameSuggestions:['Misty','Nimbus','Pixel','Wisp'] },
  { id:'wolf',        name:'Moon Wolf',     emoji:'🐺', color:'#88B0D8', description:'loyal, fierce, runs with the stars',      nameSuggestions:['Ash','Gale','Storm','Silver'] },
  { id:'unicorn',     name:'Dream Unicorn', emoji:'🦄', color:'#E8A8D8', description:'magical, rare, makes wishes real',        nameSuggestions:['Aurora','Shimmer','Opal','Celestia'] },
  { id:'panda',       name:'Cloud Panda',   emoji:'🐼', color:'#B0A0D8', description:'gentle giant, nap champion',             nameSuggestions:['Mochi','Bao','Nori','Snowdrop'] },
  { id:'deer',        name:'Star Deer',     emoji:'🦌', color:'#D4A860', description:'graceful, gentle, golden light',          nameSuggestions:['Fawn','Maple','Solstice','Flicker'] },
  { id:'frog',        name:'Dream Frog',    emoji:'🐸', color:'#80C870', description:'happy, bouncy, always optimistic',        nameSuggestions:['Mossy','Puddle','Dewdrop','Lily'] },
  { id:'otter',       name:'River Otter',   emoji:'🦦', color:'#C8A878', description:'playful, curious, loves everything',      nameSuggestions:['Pebble','Kelp','Ripple','Dew'] },
  { id:'penguin',     name:'Ice Penguin',   emoji:'🐧', color:'#A0C8E0', description:'waddly, funny, surprisingly brave',       nameSuggestions:['Pebble','Floe','Blizzard','Nook'] },
  { id:'hedgehog',    name:'Glow Hog',      emoji:'🦔', color:'#D4A878', description:'shy at first, heart of gold',             nameSuggestions:['Prickle','Bramble','Acorn','Noodle'] },
  { id:'lion',        name:'Sun Lion',      emoji:'🦁', color:'#F0B840', description:'born to lead, loves cuddles secretly',    nameSuggestions:['Soleil','Mane','Kibo','Zuri'] },
  { id:'turtle',      name:'Tide Turtle',   emoji:'🐢', color:'#88C8A0', description:'old soul, patient, full of wisdom',       nameSuggestions:['Coral','Tide','Mossy','Shelly'] },
  { id:'elephant',    name:'Cloud Elephant',emoji:'🐘', color:'#B0C8E0', description:'big-hearted, never forgets a friend',     nameSuggestions:['Nimbus','Cinder','Petal','Rogue'] },
  { id:'axolotl',     name:'Star Axolotl',  emoji:'🐠', color:'#F09898', description:'the rarest find, uniquely magical',       nameSuggestions:['Lotl','Gilly','Bloop','Frilly'] },
  { id:'koala',       name:'Gum Koala',     emoji:'🐨', color:'#B0C0D0', description:'peaceful, expert napper, dreamy',         nameSuggestions:['Euca','Snoozy','Foggy','Bluegum'] },
  { id:'hummingbird', name:'Bloom Bird',    emoji:'🐦', color:'#F080A0', description:'lightning-fast, tiny heart, pure joy',   nameSuggestions:['Zinnia','Flutter','Nectar','Jewel'] },
];

export const getCreature = (id: string): CreatureDef =>
  CREATURES.find(c => c.id === id) ?? CREATURES[0];
