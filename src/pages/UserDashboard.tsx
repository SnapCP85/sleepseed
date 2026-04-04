import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../AppContext';
import type { SavedNightCard, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, createEgg, getAllHatchedCreatures } from '../lib/hatchery';
import { CREATURES, getCreature } from '../lib/creatures';
import { getCharacters, getNightCards, getStories } from '../lib/storage';
import { checkBedtimeReminder, getBedtimeSettings } from '../lib/bedtimeReminder';
import { journeyService } from '../lib/journey-service';
import type { StoryJourney } from '../lib/types';
import StreakBadge from '../components/dashboard/StreakBadge';
import BookHeroCardComponent from '../components/dashboard/BookHeroCard';
import StoryProgressDotsComponent from '../components/dashboard/StoryProgressDots';
import PrimaryCTA from '../components/dashboard/PrimaryCTA';
import SecondaryCTA from '../components/dashboard/SecondaryCTA';
import NightCardDrawer from '../components/dashboard/NightCardDrawer';
import CometSVG from '../components/characters/CometSVG';
import BunnyHoldingEggSVG from '../components/characters/BunnyHoldingEggSVG';

// ── helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: Date) { return d.toISOString().split('T')[0]; }

function hexToRgba(hex: string, a: number): string {
  const c = hex.replace('#','');
  if(c.length !== 6) return `rgba(100,100,180,${a})`;
  const r = parseInt(c.slice(0,2),16);
  const g = parseInt(c.slice(2,4),16);
  const b = parseInt(c.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function cardBelongsTo(card: SavedNightCard, charId: string) {
  return card.characterIds && card.characterIds.includes(charId);
}

function calculateGlow(cards: SavedNightCard[], charId: string): number {
  const dates = new Set(cards.filter(c=>cardBelongsTo(c,charId)).map(c=>c.date.split('T')[0]));
  let streak=0;
  const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<365;i++){
    if(dates.has(dateStr(d))){ streak++; d.setDate(d.getDate()-1); }
    else if(i===0){ d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

type NightState='complete'|'missed'|'tonight'|'future';
interface WeekNight{label:string;date:Date;state:NightState;card?:SavedNightCard}

function getWeekNights(cards: SavedNightCard[], charId: string): WeekNight[] {
  const today=new Date(); today.setHours(0,0,0,0);
  const dow=today.getDay();
  const mon=new Date(today); mon.setDate(today.getDate()-(dow===0?6:dow-1));
  const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return Array.from({length:7},(_,i)=>{
    const d=new Date(mon); d.setDate(mon.getDate()+i);
    const ds=dateStr(d);
    const card=cards.find(c=>cardBelongsTo(c,charId)&&c.date.split('T')[0]===ds);
    const isToday=ds===dateStr(today); const isPast=d<today;
    let state:NightState='future';
    if(isToday) state=card?'complete':'tonight';
    else if(isPast) state=card?'complete':'missed';
    return {label:labels[i],date:d,state,card};
  });
}

function getLastYearCard(cards: SavedNightCard[], charId: string): SavedNightCard|null {
  const ly=new Date(); ly.setFullYear(ly.getFullYear()-1);
  return cards.find(c=>cardBelongsTo(c,charId)&&c.date.split('T')[0]===dateStr(ly))??null;
}

function buildPromptText(sel: Character[]): string {
  if(!sel.length) return "What happened in your child's world today?";
  if(sel.length===1) return `What happened in ${sel[0].name}'s world today?`;
  if(sel.length===2) return `What happened in ${sel[0].name} & ${sel[1].name}'s world today?`;
  const last=sel[sel.length-1];
  return `What happened in ${sel.slice(0,-1).map(c=>c.name).join(', ')} & ${last.name}'s world today?`;
}

const CONSTELLATIONS=[
  'the little fox','the sleeping bear','the river otter','the wandering star',
  'the firefly cloud','the gentle whale','the winter hare','the dreaming owl',
  'the silver deer','the hidden comet','the morning dove','the ancient turtle',
];

function constellationName(weekNum: number): string {
  return CONSTELLATIONS[weekNum % CONSTELLATIONS.length];
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060912;--night-mid:#0B1535;--night-card:#0C1840;
  --amber:#F5B84C;--teal:#14d890;--purple:#9A7FD4;--cream:#F4EFE8;
  --r-sm:14px;--r-md:18px;--r-lg:22px;
  --serif:'Fraunces',Georgia,serif;
  --sans:'Nunito',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}

.dash{min-height:100vh;min-height:100dvh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:100px}
.dash-inner{max-width:480px;margin:0 auto;padding:0 20px 110px;position:relative;z-index:5}

/* ── Animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{transform:translateX(-100%)}60%,100%{transform:translateX(200%)}}
@keyframes dotPulse{0%{box-shadow:0 0 0 0 rgba(245,184,76,.5)}100%{box-shadow:0 0 0 10px rgba(245,184,76,0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes hatchBurst{0%{transform:scale(1)}30%{transform:scale(1.15) rotate(3deg)}60%{transform:scale(1.08) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes skelMove{from{transform:translateX(-100%)}to{transform:translateX(100%)}}

/* ── Skeleton ── */
.dash-skel{background:rgba(255,255,255,.05);border-radius:8px;overflow:hidden;position:relative}
.dash-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 50%,transparent 100%);animation:skelMove 1.6s ease-in-out infinite}

/* ── Guest buttons ── */
.dash-u-btn{width:100%;padding:18px 20px;border:none;border-radius:var(--r-md);cursor:pointer;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;transition:transform .18s,filter .2s;box-shadow:0 1px 0 rgba(255,255,255,.18) inset}
.dash-u-btn:hover{transform:scale(1.02) translateY(-1px);filter:brightness(1.1)}
.dash-u-btn:active{transform:scale(.97)}
.dash-u-btn::after{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.8s ease-in-out infinite}
.dash-u-btn-ico{font-size:28px;flex-shrink:0;position:relative;z-index:1}
.dash-u-btn-texts{flex:1;text-align:left;position:relative;z-index:1}
.dash-u-btn-title{font-size:18px;font-weight:800;display:block;line-height:1.18;margin-bottom:1px}
.dash-u-btn-sub{font-size:10px;font-weight:700;display:block;opacity:.5}
.dash-u-btn-arr{font-size:24px;flex-shrink:0;position:relative;z-index:1;opacity:.38}

/* ── Hatch modal ── */
.dash-hatch-modal{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.88);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;animation:fadein .3s ease}
.dash-hatch-inner{text-align:center;animation:fadein .4s ease-out;max-width:340px;padding:24px}
.dash-hatch-creature{font-size:96px;animation:hatchBurst .6s ease-out;display:inline-block;margin-bottom:18px;filter:drop-shadow(0 0 32px rgba(20,216,144,.6))}
.dash-hatch-title{font-family:var(--serif);font-size:24px;color:var(--cream);margin-bottom:8px;line-height:1.3;font-style:italic}
.dash-hatch-title em{color:#14d890}
.dash-hatch-sub{font-size:13px;color:rgba(244,239,232,.4);line-height:1.65;margin-bottom:20px}
.dash-hatch-btn{padding:16px 32px;border:none;border-radius:var(--r-md);font-size:17px;font-weight:800;cursor:pointer;font-family:var(--serif);background:linear-gradient(135deg,#0a7a50,#14d890 50%,#0a7a50);color:#041a0c;box-shadow:0 8px 28px rgba(20,200,130,.35);transition:transform .18s,filter .18s}
.dash-hatch-btn:hover{transform:scale(1.03) translateY(-1px);filter:brightness(1.08)}

/* ── Night Card Drawer ── */
.nc-drawer-bd{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;transition:opacity .22s;animation:fadein .18s ease}
.nc-drawer{position:fixed;bottom:76px;left:0;right:0;background:#0C1840;border-top:1px solid rgba(255,255,255,.09);border-radius:22px 22px 0 0;z-index:201;max-height:78vh;overflow-y:auto;scrollbar-width:none;animation:sheetUp .28s ease-out;padding-bottom:env(safe-area-inset-bottom,0px)}
.nc-drawer::-webkit-scrollbar{display:none}
@media(min-width:600px){.nc-drawer{left:50%;right:auto;bottom:50%;transform:translateX(-50%) translateY(50%);width:100%;max-width:480px;border-radius:var(--r-lg);max-height:80vh;animation:none;box-shadow:0 24px 80px rgba(0,0,0,.85)}}
.nc-drawer-pill{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.14);margin:12px auto 8px}
@media(min-width:600px){.nc-drawer-pill{display:none}}
`;

// ── component ─────────────────────────────────────────────────────────────────

export default function UserDashboard({onSignUp,onReadStory}:{onSignUp:()=>void;onReadStory?:(book:any)=>void}){
  const{user,logout,setView,selectedCharacters,setSelectedCharacters,setRitualSeed,setRitualMood,setEditingCharacter,setActiveJourneyId}=useApp();
  const[characters,setCharacters]=useState<Character[]>([]);
  const[allCards,setAllCards]=useState<SavedNightCard[]>([]);
  const[loading,setLoading]=useState(true);
  const[weekViewId,setWeekViewId]=useState<string>('');
  const[modalCard,setModalCard]=useState<SavedNightCard|null>(null);
  const[missTooltip,setMissTooltip]=useState<number|null>(null);
  const[storyCount,setStoryCount]=useState(0);
  const[lastStory,setLastStory]=useState<any>(null);
  const[allStories,setAllStories]=useState<any[]>([]);
  const[hoveredStar,setHoveredStar]=useState<number|null>(null);
  const[selectedStar,setSelectedStar]=useState<number|null>(null);
  const[activeEgg,setActiveEgg]=useState<HatcheryEgg|null>(null);
  const[hatchedCreature,setHatchedCreature]=useState<HatchedCreature|null>(null);
  const[creatureAsleep,setCreatureAsleep]=useState(false);
  const[showHatchModal,setShowHatchModal]=useState(false);
  const[activeShardIdx,setActiveShardIdx]=useState<number|null>(null);
  const[shardsInfoOpen,setShardsInfoOpen]=useState(false);
  const[weekInfoOpen,setWeekInfoOpen]=useState(false);
  const[shardsFirstTime,setShardsFirstTime]=useState(false);
  const[myStuffOpen,setMyStuffOpen]=useState(false);
  const[activeJourney,setActiveJourney]=useState<StoryJourney|null>(null);
  const[journeyLoading,setJourneyLoading]=useState(true);
  const missTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isGuest=!!user?.isGuest;

  const isNewUser=useMemo(()=>{
    if(!user?.createdAt) return false;
    const created=new Date(user.createdAt).getTime();
    return (Date.now()-created)<10*60*1000;
  },[user?.createdAt]);

  // Helper to read localStorage instantly (no network)
  const lsGet = <T,>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };

  const userId = user?.id;
  useEffect(()=>{
    if(!userId) return;
    let cancelled = false;

    // ── PHASE 1: Instant render from localStorage (0ms) ──
    const cachedChars = lsGet<Character>(`ss2_chars_${userId}`);
    const cachedCards = lsGet<SavedNightCard>(`ss2_nightcards_${userId}`);
    const cachedStories = lsGet<any>(`ss2_stories_${userId}`);
    if (cachedChars.length > 0 || cachedCards.length > 0) {
      const fc = cachedChars.filter((c: any) => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
      const pri = fc.length > 0 ? fc[0] : cachedChars[0] ?? null;
      setCharacters(cachedChars);
      setAllCards(cachedCards);
      setStoryCount(cachedStories.length);
      setAllStories(cachedStories);
      if (cachedStories.length > 0) { const sorted = [...cachedStories].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')); setLastStory(sorted[0]); }
      if (pri) { setSelectedCharacters(fc.length > 0 ? [fc[0]] : [cachedChars[0]]); setWeekViewId(pri.id); }
      setLoading(false); // Show dashboard immediately with cached data
    }

    // ── PHASE 2: Refresh from Supabase in background ──
    (async () => {
      try {
        const [chars, cards, stories, creatures] = await Promise.all([
          getCharacters(userId),
          getNightCards(userId),
          getStories(userId),
          hasSupabase ? getAllHatchedCreatures(userId) : Promise.resolve([] as HatchedCreature[]),
        ]);
        if (cancelled) return;
        const fc = chars.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
        const pri = fc.length > 0 ? fc[0] : chars.length > 0 ? chars[0] : null;

        let egg: HatcheryEgg | null = null;
        let journey: StoryJourney | null = null;
        if (hasSupabase && pri) {
          egg = await getActiveEgg(userId, pri.id);
          if (!egg) { const rc = CREATURES[Math.floor(Math.random() * CREATURES.length)]; try { egg = await createEgg(userId, pri.id, rc.id, 1); } catch {} }
          try { journey = await journeyService.getActiveJourney(userId, pri.id); } catch {}
        }
        if (cancelled) return;

        setCharacters(chars);
        setAllCards(cards);
        setStoryCount(stories.length);
        setAllStories(stories);
        if (stories.length > 0) { const sorted = [...stories].sort((a, b) => (b.date || '').localeCompare(a.date || '')); setLastStory(sorted[0]); }
        if (creatures.length > 0) setHatchedCreature(creatures[0]);
        if (pri) { setSelectedCharacters(fc.length > 0 ? [fc[0]] : [chars[0]]); setWeekViewId(pri.id); }
        if (egg) setActiveEgg(egg);
        setActiveJourney(journey);
        setJourneyLoading(false);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setLoading(false); setJourneyLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line

  // Journey reload when character switches (only after initial load)
  const primaryForJourney = selectedCharacters[0] ?? null;
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current) { initialLoadDone.current = !loading; return; }
    if (!userId || !primaryForJourney?.id) { setJourneyLoading(false); return; }
    setJourneyLoading(true);
    journeyService.getActiveJourney(userId, primaryForJourney.id)
      .then(j => { setActiveJourney(j); setJourneyLoading(false); })
      .catch(() => setJourneyLoading(false));
  }, [primaryForJourney?.id]); // eslint-disable-line

  const familyChars=useMemo(()=>characters.filter(c=>c.isFamily===true||(c.isFamily===undefined&&c.type==='human')),[characters]);
  const primary=selectedCharacters[0]??null;
  const secondary=selectedCharacters[1]??null;
  const isMulti=selectedCharacters.length>1;
  const weekChild=characters.find(c=>c.id===weekViewId)??primary;

  useEffect(()=>{
    if(!hasSupabase||!user||!primary) return;
    if(activeEgg&&activeEgg.characterId===primary.id) return;
    getActiveEgg(user.id,primary.id).then(egg=>{
      if(egg){setActiveEgg(egg);}
      else{const rc=CREATURES[Math.floor(Math.random()*CREATURES.length)];createEgg(user.id,primary.id,rc.id,1).then(setActiveEgg).catch(()=>{});}
    });
  },[user,primary?.id]); // eslint-disable-line

  const glow=useMemo(()=>weekChild?calculateGlow(allCards,weekChild.id):0,[allCards,weekChild]);
  const week=useMemo(()=>weekChild?getWeekNights(allCards,weekChild.id):[],[allCards,weekChild]);
  const lyCard=useMemo(()=>primary?getLastYearCard(allCards,primary.id):null,[allCards,primary]);

  const eggStage=useMemo(()=>{
    if(!activeEgg) return 0;
    const startDate=activeEgg.startedAt.split('T')[0];
    const count=allCards.filter(card=>card.characterIds.includes(activeEgg.characterId)&&card.date.split('T')[0]>=startDate).length;
    return Math.min(count,7);
  },[activeEgg,allCards]);

  const eggCards=useMemo(()=>{
    if(!activeEgg) return [];
    const startDate=activeEgg.startedAt.split('T')[0];
    return allCards.filter(c=>c.characterIds.includes(activeEgg.characterId)&&c.date.split('T')[0]>=startDate).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,7);
  },[activeEgg,allCards]);

  const weekDone=week.filter(n=>n.state==='complete').length;
  const weekNum=Math.floor(glow/7);
  const constName=constellationName(weekNum);

  const todayStr=dateStr(new Date());
  const tonightDone=!!allCards.find(c=>primary&&cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===todayStr);
  const tonightCard=allCards.find(c=>primary&&cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===todayStr)??null;

  const hour=new Date().getHours();
  const greetWord=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const today=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

  const creatureDef=useMemo(()=>activeEgg?getCreature(activeEgg.creatureType):null,[activeEgg]);
  const tonightLesson=useMemo(()=>(!creatureDef||eggStage>=7)?null:creatureDef.lessonBeats[eggStage]??null,[creatureDef,eggStage]);
  const creatureSpeech=useMemo(()=>{
    if(!hatchedCreature) return '';
    const n=hatchedCreature.name;
    if(tonightDone) return `${n} is fast asleep\u2026 sweet dreams.`;
    if(creatureDef&&eggStage<7) return creatureDef.dailyWisdom[eggStage]??`${n} is ready for tonight!`;
    return `${n} is ready for tonight's adventure!`;
  },[hatchedCreature,tonightDone,creatureDef,eggStage]);

  // ── New computed values ────────────────────────────────────────────────────
  const childName=primary?.name??'your child';
  const barWidth=`${Math.round((eggStage/7)*100)}%`;
  const nightsLeft=Math.max(0,7-eggStage);
  const nightsLeftLabel=nightsLeft===0?'Ready to hatch! \u2726':`${nightsLeft} night${nightsLeft!==1?'s':''} to hatch \u2726`;
  const DAY_NAMES=['M','T','W','T','F','S','S'];

  const totalMemories=useMemo(()=>allCards.filter(c=>primary&&cardBelongsTo(c,primary.id)).length,[allCards,primary]);

  function getMemoryNumber(card: SavedNightCard): number {
    const sorted=allCards.filter(c=>primary&&cardBelongsTo(c,primary.id)).sort((a,b)=>a.date.localeCompare(b.date));
    return sorted.findIndex(c=>c.id===card.id)+1;
  }

  const activeShardCard=useMemo(()=>activeShardIdx!==null?(eggCards[activeShardIdx]??null):null,[activeShardIdx,eggCards]);
  const activeShardStory=useMemo(()=>{
    if(!activeShardCard?.storyId) return null;
    return allStories.find(s=>s.id===activeShardCard.storyId)??null;
  },[activeShardCard,allStories]);
  const activeShardWisdom=useMemo(()=>activeShardIdx===null?null:creatureDef?.dailyWisdom?.[activeShardIdx]??null,[activeShardIdx,creatureDef]);

  // ── Bedtime reminder timer ──────────────────────────────────────────────────
  const [bedtimeToast, setBedtimeToast] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      const fired = checkBedtimeReminder(userId, childName);
      if (fired) { setBedtimeToast(true); setTimeout(() => setBedtimeToast(false), 8000); }
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, childName]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function shardColour(card: SavedNightCard|null): string {
    if(!card) return 'rgba(245,184,76,.5)';
    const vibe=(card as any).vibe??'';
    if(vibe==='silly'||vibe==='warm-funny') return '#FFD060';
    if(vibe==='exciting'||vibe==='adventure') return '#60C8FF';
    if(vibe==='mysterious') return '#C090FF';
    if(vibe==='calm-cosy'||vibe==='heartfelt') return '#F5B84C';
    return '#F5B84C';
  }
  function handleShardTap(index:number,isDone:boolean){if(!isDone)return;setActiveShardIdx(prev=>prev===index?null:index);}
  function closeSheet(){setActiveShardIdx(null);}
  function toggleShardsInfo(){setShardsInfoOpen(p=>!p);}
  function toggleWeekInfo(){setWeekInfoOpen(p=>!p);}
  function shardDateLabel(index:number):string{const card=eggCards[index];if(!card)return '';return new Date(card.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}
  function startRitual(){setRitualSeed('');setRitualMood('');setView('ritual-starter');}
  function toggleChild(c:Character){
    const ids=selectedCharacters.map(x=>x.id);
    if(ids.includes(c.id)){if(selectedCharacters.length===1)return;const next=selectedCharacters.filter(x=>x.id!==c.id);setSelectedCharacters(next);if(weekViewId===c.id)setWeekViewId(next[0]?.id??'');}
    else setSelectedCharacters([...selectedCharacters,c]);
  }
  function showMiss(idx:number){if(missTimer.current)clearTimeout(missTimer.current);setMissTooltip(idx);missTimer.current=setTimeout(()=>setMissTooltip(null),2200);}

  // ── Nav handlers ──────────────────────────────────────────────────────────
  function handleNavCreate(){setMyStuffOpen(false);setView('story-wizard' as any);}
  function handleNavDiscover(){setMyStuffOpen(false);setView('library');}
  function closeMyStuff(){setMyStuffOpen(false);}
  function handleNavMyStuff(){setMyStuffOpen(p=>!p);}
  function handleMyBooks(){closeMyStuff();setView('story-library' as any);}
  function handleNightCards(){closeMyStuff();setView('nightcard-library' as any);}
  function handleHatchery(){closeMyStuff();setView('hatchery');}
  function handleProfile(){setView('user-profile' as any);}
  const showMyStuffDot=useMemo(()=>tonightDone&&!myStuffOpen,[tonightDone,myStuffOpen]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const seen=localStorage.getItem('ss_shards_explained');
    if(!seen){setShardsFirstTime(true);setShardsInfoOpen(true);const t=setTimeout(()=>{setShardsFirstTime(false);setShardsInfoOpen(false);localStorage.setItem('ss_shards_explained','1');},6000);return ()=>clearTimeout(t);}
  },[]);

  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')closeSheet();};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[]);

  // ── Formatted date for greeting ──────────────────────────────────────────
  const greetDate = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

  // ── Bedtime flavour text ─────────────────────────────────────────────────
  const greetFlavour = hour>=20 ? "it's almost bedtime" : hour>=17 ? "it's almost bedtime" : hour>=12 ? "the stars are waiting" : "a new day begins";

  // ── Recent memory cards (for Zone 4) ─────────────────────────────────────
  const recentCards = useMemo(()=>{
    if(!primary) return [];
    return allCards.filter(c=>cardBelongsTo(c,primary.id)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  },[allCards,primary]);

  // ── Creature color helper ────────────────────────────────────────────────
  const creatureColor = creatureDef?.color ?? '#F5B84C';

  // ── Week dots data ───────────────────────────────────────────────────────
  const weekDots = useMemo(()=>{
    const now=new Date();const dow=now.getDay();const mondayOff=(dow+6)%7;
    return Array.from({length:7},(_,i)=>{
      const d=new Date(now);d.setDate(now.getDate()-mondayOff+i);
      const ds=d.toISOString().split('T')[0];const ts=now.toISOString().split('T')[0];
      const isPast=ds<ts;const isToday=ds===ts;
      const done=primary&&allCards.some(c=>cardBelongsTo(c,primary.id)&&c.date.split('T')[0]===ds);
      return {day:DAY_NAMES[i],done,isPast,isToday};
    });
  },[allCards,primary]);

  // ── Derive journey state ─────────────────────────────────────────────────
  const hasActiveJourney = !journeyLoading && activeJourney && (activeJourney.chapters.length > 0 || activeJourney.readNumber >= 1);
  const readNumber = activeJourney?.readNumber ?? 0;

  // ── Drawer state (must be before early returns — React hooks rule) ────────
  const [nightCardDrawerOpen, setNightCardDrawerOpen] = useState(false);
  const [activeDrawerChapter, setActiveDrawerChapter] = useState<number|null>(null);
  const openNightCardDrawer = (i: number) => { setActiveDrawerChapter(i); setNightCardDrawerOpen(true); };

  // ── LOADING ────────────────────────────────────────────────────────────────
  if(!user) return null;
  if(loading) return(
    <div className="dash">
      <style>{CSS}</style>
      <div className="dash-inner" style={{paddingTop:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
          <div>
            <div className="dash-skel" style={{height:12,width:100,borderRadius:4,marginBottom:8}}/>
            <div className="dash-skel" style={{height:30,width:180,borderRadius:8}}/>
          </div>
          <div className="dash-skel" style={{width:90,height:50,borderRadius:18}}/>
        </div>
        <div className="dash-skel" style={{height:200,borderRadius:22,marginBottom:16}}/>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16}}>
          {[0,1,2,3,4,5,6].map(i=>(
            <div key={i} className="dash-skel" style={{width:28,height:28,borderRadius:'50%'}}/>
          ))}
        </div>
        <div className="dash-skel" style={{height:56,borderRadius:18,marginBottom:12}}/>
        <div className="dash-skel" style={{height:52,borderRadius:18}}/>
      </div>
    </div>
  );

  // ── Derived values for shared components ───────────────────────────────────
  const creatureEmoji = hatchedCreature?.creatureEmoji || (activeEgg ? '\uD83E\uDD5A' : '\uD83D\uDCD6');
  const creatureName = creatureDef?.name ?? 'Companion';
  const lastChapter = activeJourney?.chapters[activeJourney.chapters.length - 1];
  const whisperLine = lastChapter?.teaser || creatureSpeech || "Tonight's chapter awaits";

  // ── Greeting row ──────────────────────────────────────────────────────────
  const GreetingRow = ({done}:{done?:boolean}) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',animation:'fadeUp .28s ease both'}}>
      <div>
        {done ? (
          <>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,fontStyle:'italic',color:'rgba(20,216,144,.68)',marginBottom:5}}>
              {readNumber > 0 ? `Read ${readNumber} complete \u2713` : 'Tonight complete \u2713'}
            </div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:30,fontWeight:900,color:'#F4EFE8',lineHeight:1,letterSpacing:'-.6px'}}>Well done, {childName}</div>
          </>
        ) : (
          <>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,fontStyle:'italic',color:'rgba(234,242,255,.4)',marginBottom:5}}>{greetWord},</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:30,fontWeight:900,color:'#F4EFE8',lineHeight:1,letterSpacing:'-.6px'}}>{childName}</div>
          </>
        )}
      </div>
      {glow > 0 ? (
        <StreakBadge count={glow} celebration={done} />
      ) : (
        <div style={{
          display:'flex',alignItems:'center',gap:8,
          padding:'10px 12px',
          background:'rgba(234,242,255,.04)',
          border:'1.5px solid rgba(234,242,255,.09)',
          borderRadius:18,flexShrink:0,
        }}>
          <CometSVG size={20} style={{opacity:.28}} />
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:'rgba(234,242,255,.33)',lineHeight:1.2}}>Start a streak</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:7.5,color:'rgba(234,242,255,.2)',letterSpacing:'.9px',lineHeight:1}}>read every night</span>
          </div>
        </div>
      )}
    </div>
  );

  // ── FULL RENDER ────────────────────────────────────────────────────────────
  return(
    <div className="dash">
      <style>{CSS}</style>

      <div className="dash-inner">
        {/* ── GUEST STATE ── */}
        {isGuest&&(
          <div style={{padding:'24px 0 0'}}>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:48,marginBottom:12}}>🌙</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:'#F4EFE8',lineHeight:1.3,marginBottom:8}}>Tonight could be the night<br/><em style={{color:'#F5B84C'}}>bedtime changes forever.</em></div>
              <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'rgba(234,242,255,.36)',lineHeight:1.65}}>A personalised bedtime story starring your child — written in 60 seconds.</div>
            </div>
            <button className="dash-u-btn" style={{width:'100%',marginBottom:20,background:'linear-gradient(145deg,#a06010,#F5B84C 48%,#a06010)',boxShadow:'0 8px 30px rgba(200,130,20,.42)'}} onClick={()=>setView('story-wizard' as any)}>
              <span className="dash-u-btn-ico">✨</span>
              <span className="dash-u-btn-texts"><span className="dash-u-btn-title" style={{color:'#080200'}}>Try your first story</span><span className="dash-u-btn-sub" style={{color:'rgba(8,2,0,.5)'}}>See the magic — no signup needed</span></span>
              <span className="dash-u-btn-arr" style={{color:'rgba(8,2,0,.38)'}}>→</span>
            </button>
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(245,184,76,.4)',marginBottom:12,fontWeight:600}}>How it works</div>
              {[{ico:'🌙',title:'You share a moment from today',sub:"What happened at school? What made them laugh?"},{ico:'✨',title:'We write their bedtime story',sub:'AI crafts a unique story starring your child.'},{ico:'🥚',title:'A DreamKeeper companion hatches',sub:'Do the ritual 7 nights and a mystery DreamKeeper arrives.'}].map((step,i)=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-start'}}>
                  <div style={{fontSize:24,lineHeight:1,flexShrink:0,marginTop:2}}>{step.ico}</div>
                  <div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,color:'#F4EFE8',marginBottom:2}}>{step.title}</div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(234,242,255,.35)',lineHeight:1.6}}>{step.sub}</div></div>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(245,184,76,.04)',border:'1px solid rgba(245,184,76,.12)',borderRadius:18,padding:'14px 16px',marginBottom:20}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:13,fontStyle:'italic',color:'rgba(234,242,255,.55)',lineHeight:1.65,marginBottom:8}}>"My daughter won't go to bed without checking on her egg first."</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'rgba(234,242,255,.25)'}}>Sarah M. · Mum of two</div>
            </div>
            <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:'16px 18px',textAlign:'center',marginBottom:16}}>
              <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,color:'#F4EFE8',marginBottom:4}}>Ready to keep your stories?</div>
              <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(234,242,255,.3)',lineHeight:1.6,marginBottom:12}}>Create a free account to save stories and unlock Night Cards.</div>
              <button style={{background:'rgba(245,184,76,.1)',border:'1px solid rgba(245,184,76,.25)',borderRadius:50,padding:'10px 24px',fontSize:13,fontWeight:600,color:'#F5B84C',cursor:'pointer',fontFamily:"'Nunito',sans-serif"}} onClick={onSignUp}>Create free account →</button>
            </div>
            <div style={{textAlign:'center',marginBottom:8}}>
              <button style={{background:'none',border:'none',color:'rgba(234,242,255,.25)',fontSize:12,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}} onClick={()=>setView('library')}>Or browse stories from other families →</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STATE A — Active Journey (not tonight done)
            ══════════════════════════════════════════════════════════════════════ */}
        {!isGuest && !tonightDone && hasActiveJourney && activeJourney && (
          <div style={{display:'flex',flexDirection:'column',gap:16,padding:'20px 0 24px'}}>
            <GreetingRow/>
            <BookHeroCardComponent
              title={activeJourney.workingTitle}
              readNumber={readNumber}
              isComplete={false}
              creatureEmoji={creatureEmoji}
              companionName={creatureName}
              whisperLine={whisperLine}
            />
            <StoryProgressDotsComponent
              filled={readNumber - 1}
              tonight={readNumber - 1}
              isComplete={false}
              onDotClick={(i) => openNightCardDrawer(i)}
            />
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <PrimaryCTA
                label={readNumber === 7 ? 'Finish Your Book' : 'Continue Your Book'}
                onClick={()=>{setActiveJourneyId(activeJourney.id);setView('nightly-checkin');}}
              />
              <SecondaryCTA label="One story tonight" onClick={()=>setView('story-wizard' as any)}/>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STATE B — Tonight Complete
            ══════════════════════════════════════════════════════════════════════ */}
        {!isGuest && tonightDone && (
          <div style={{display:'flex',flexDirection:'column',gap:16,padding:'20px 0 24px'}}>
            <GreetingRow done/>
            {hasActiveJourney && activeJourney && (
              <>
                <BookHeroCardComponent
                  title={activeJourney.workingTitle}
                  readNumber={readNumber}
                  isComplete={true}
                  creatureEmoji={creatureEmoji}
                  companionName={creatureName}
                  whisperLine={whisperLine}
                />
                <StoryProgressDotsComponent
                  filled={readNumber}
                  tonight={readNumber - 1}
                  isComplete={true}
                  onDotClick={(i) => openNightCardDrawer(i)}
                />
              </>
            )}

            {/* Tonight's Night Card row */}
            {tonightCard && (
              <div
                onClick={()=>openNightCardDrawer(readNumber > 0 ? readNumber - 1 : 0)}
                style={{
                  display:'flex',alignItems:'center',gap:12,
                  padding:'12px 16px',
                  background:'rgba(20,216,144,.06)',
                  border:'1.5px solid rgba(20,216,144,.2)',
                  borderRadius:18,cursor:'pointer',
                }}
              >
                <div style={{width:38,height:38,borderRadius:14,background:'rgba(20,216,144,.13)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14d890" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8.5,color:'rgba(20,216,144,.62)',letterSpacing:'.6px',textTransform:'uppercase'}}>TONIGHT'S NIGHT CARD</div>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:600,color:'rgba(234,242,255,.82)',marginTop:3}}>{tonightCard.storyTitle||'A night to remember'}</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.25)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            )}

            {/* Sleeping creature — when no active journey */}
            {!hasActiveJourney && hatchedCreature && (
              <div style={{
                background:'linear-gradient(168deg,rgba(4,14,12,.95),rgba(6,16,14,.98))',
                border:'1px solid rgba(20,216,144,.18)',borderRadius:22,
                padding:'24px 20px',textAlign:'center',
              }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:'.06em',padding:'3px 10px',borderRadius:20,background:'rgba(20,216,144,.1)',border:'1px solid rgba(20,216,144,.22)',color:'rgba(20,216,144,.72)'}}>
                    Night {eggStage} of 7
                  </div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:12,fontStyle:'italic',color:'rgba(234,242,255,.28)'}}>
                    {nightsLeftLabel}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:16}}>
                  <div style={{position:'relative',display:'inline-block',marginBottom:8}}>
                    <div style={{fontSize:62,lineHeight:1,filter:'drop-shadow(0 0 20px rgba(20,216,144,.4))'}}>
                      {hatchedCreature.creatureEmoji}
                    </div>
                    <div style={{position:'absolute',top:2,right:-6,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:13,color:'rgba(20,216,144,.5)',pointerEvents:'none'}}>z</div>
                    <div style={{position:'absolute',top:14,right:-14,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:9,color:'rgba(20,216,144,.35)',pointerEvents:'none'}}>z</div>
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:'2px',textTransform:'uppercase',color:'rgba(20,216,144,.4)',marginBottom:4}}>
                    {creatureName}
                  </div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:'#F4EFE8',marginBottom:6}}>
                    {hatchedCreature.name}
                  </div>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,fontStyle:'italic',color:'rgba(255,255,255,.45)',lineHeight:1.6,maxWidth:280}}>
                    "{creatureSpeech}"
                  </div>
                </div>
                {/* Egg progress dots */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
                  {Array.from({length:7},(_,i)=>(
                    <div key={i} style={{
                      width:8,height:8,borderRadius:'50%',
                      background:i<eggStage?'#14d890':'rgba(255,255,255,.08)',
                      boxShadow:i<eggStage?'0 0 6px rgba(20,216,144,.4)':'none',
                      border:i<eggStage?'none':'1px solid rgba(255,255,255,.1)',
                      cursor:i<eggStage?'pointer':'default',
                    }} onClick={()=>i<eggStage&&handleShardTap(i,true)}/>
                  ))}
                </div>
              </div>
            )}

            {/* Streak + Week dots bar */}
            <div style={{
              display:'flex',alignItems:'center',gap:14,
              background:'rgba(13,17,32,.8)',border:'1px solid rgba(234,242,255,.06)',
              borderRadius:20,padding:'14px 16px',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:'rgba(20,216,144,.08)',border:'1px solid rgba(20,216,144,.18)',flexShrink:0}}>
                <span style={{fontSize:14}}>🔥</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:'#14d890'}}>{glow}</span>
                <span style={{fontFamily:"'Nunito',sans-serif",fontSize:10,fontWeight:600,color:'rgba(234,242,255,.6)'}}>night{glow!==1?'s':''}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4,flex:1,justifyContent:'flex-end'}}>
                {weekDots.map((wd,i)=>(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(255,255,255,.2)',width:10,textAlign:'center'}}>{wd.day}</div>
                    <div style={{
                      width:10,height:10,borderRadius:'50%',
                      background:wd.isToday?'rgba(20,216,144,.25)':wd.isPast&&wd.done?'#14d890':wd.isPast&&!wd.done?'rgba(255,60,60,.15)':'rgba(255,255,255,.06)',
                      border:wd.isToday?'1.5px solid rgba(20,216,144,.5)':wd.isPast&&!wd.done?'1px solid rgba(255,60,60,.25)':'1px solid rgba(255,255,255,.08)',
                      boxShadow:wd.isPast&&wd.done?'0 0 6px rgba(20,216,144,.3)':'none',
                    }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-read last story */}
            {lastStory && lastStory.bookData && onReadStory && (
              <div onClick={()=>onReadStory(lastStory.bookData)} style={{
                background:'rgba(10,12,24,.97)',border:'.5px solid rgba(255,255,255,.05)',
                borderLeft:'2.5px solid #14d890',borderRadius:'0 14px 14px 0',
                padding:'10px 14px',display:'flex',alignItems:'center',gap:8,
                cursor:'pointer',
              }}>
                <span style={{fontSize:11,color:'#14d890',flexShrink:0}}>📖</span>
                <span style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(200,191,176,1)',lineHeight:1.5}}>Re-read: <em style={{color:'#14d890',fontStyle:'italic'}}>{lastStory.title}</em></span>
              </div>
            )}

            {/* Recent memories */}
            {recentCards.length > 0 && (
              <div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8.5,letterSpacing:'.9px',textTransform:'uppercase',color:'rgba(234,242,255,.24)',marginBottom:10}}>Recent memories</div>
                <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4}}>
                  {recentCards.map(card=>(
                    <div key={card.id} onClick={()=>setModalCard(card)} style={{
                      flex:'0 0 auto',width:200,
                      background:'linear-gradient(148deg,rgba(8,12,32,.96),rgba(14,18,46,.96))',
                      border:'1px solid rgba(154,127,212,.18)',borderRadius:14,
                      padding:12,cursor:'pointer',
                    }}>
                      <div style={{fontFamily:"'Fraunces',serif",fontSize:12,fontWeight:700,color:'#F4EFE8',lineHeight:1.3,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.storyTitle||'A night to remember'}</div>
                      {card.quote&&<div style={{fontFamily:"'Lora',serif",fontSize:11,fontStyle:'italic',color:'rgba(255,255,255,.45)',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',marginBottom:6}}>"{card.quote}"</div>}
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(255,255,255,.2)'}}>{new Date(card.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MORE TONIGHT? */}
            <div style={{borderTop:'.5px solid rgba(234,242,255,.07)',paddingTop:16}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8.5,color:'rgba(234,242,255,.22)',letterSpacing:'.9px',textTransform:'uppercase',textAlign:'center',marginBottom:8}}>MORE TONIGHT?</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <button onClick={()=>setView('library')} style={{padding:'12px 8px',border:'1px solid rgba(234,242,255,.12)',borderRadius:14,background:'rgba(234,242,255,.04)',color:'rgba(234,242,255,.55)',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>Discover</button>
                <button onClick={()=>setView('story-wizard' as any)} style={{padding:'12px 8px',border:'1px solid rgba(234,242,255,.12)',borderRadius:14,background:'rgba(234,242,255,.04)',color:'rgba(234,242,255,.55)',fontFamily:"'DM Mono',monospace",fontSize:11,cursor:'pointer'}}>Create</button>
              </div>
            </div>

            {/* Quick links */}
            <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:4}}>
              <button onClick={()=>setView('hatchery')} style={{background:'none',border:'none',fontSize:10,color:'rgba(20,216,144,.45)',cursor:'pointer',fontFamily:"'DM Mono',monospace"}}>View hatchery →</button>
              <span style={{color:'rgba(234,242,255,.1)'}}>·</span>
              <button onClick={()=>setView('journey-library')} style={{background:'none',border:'none',fontSize:10,color:'rgba(234,242,255,.25)',cursor:'pointer',fontFamily:"'DM Mono',monospace"}}>Our books →</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STATE C — No Active Journey
            ══════════════════════════════════════════════════════════════════════ */}
        {!isGuest && !tonightDone && !hasActiveJourney && (
          <div style={{display:'flex',flexDirection:'column',padding:'20px 0 24px',minHeight:'calc(100vh - 76px)'}}>
            <GreetingRow/>

            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
              <BunnyHoldingEggSVG size={108} style={{animation:'floatY 5s ease-in-out infinite',marginBottom:14}} />
              <div style={{fontFamily:"'Fraunces',serif",fontSize:31,fontWeight:900,color:'#F4EFE8',lineHeight:1.12,letterSpacing:'-.6px',whiteSpace:'pre-line'}}>{"Your story\nis waiting"}</div>
              <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,fontStyle:'italic',color:'rgba(234,242,255,.36)',marginTop:12,lineHeight:1.62,whiteSpace:'pre-line'}}>{"7 nights \u00b7 1 complete book\none new creature companion"}</div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <PrimaryCTA label="Begin our book" onClick={()=>setView('journey-setup')}/>
              <SecondaryCTA label="One story tonight" onClick={()=>setView('story-wizard' as any)}/>
              <div style={{textAlign:'center',paddingTop:2}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(234,242,255,.2)',letterSpacing:'.4px'}}>Takes about 5 minutes</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS (preserved exactly)
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Night Card modal */}
      {modalCard&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'fadeUp .18s ease'}} onClick={()=>setModalCard(null)}>
          <div style={{background:'#0C1840',border:'1px solid rgba(255,255,255,.09)',borderRadius:22,maxWidth:380,width:'100%',overflow:'hidden',animation:'fadeUp .18s ease'}} onClick={e=>e.stopPropagation()}>
            <div style={{background:'linear-gradient(135deg,#C49018,#A87010)',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:8.5,fontWeight:600,color:'#0A0600',letterSpacing:'.07em',textTransform:'uppercase'}}>Night Card</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:8.5,color:'rgba(10,6,0,.5)'}}>{modalCard.date?.split('T')[0]}</span>
              <button onClick={()=>setModalCard(null)} style={{background:'none',border:'none',fontSize:20,color:'rgba(10,6,0,.4)',cursor:'pointer',lineHeight:1,padding:'0 2px'}}>x</button>
            </div>
            <div style={{padding:'15px 17px'}}>
              {modalCard.storyTitle&&(
                <>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(58,66,112,1)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:4,fontWeight:500}}>Story</div>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'rgba(200,191,176,1)',lineHeight:1.65,fontStyle:'italic',marginBottom:12}}>{modalCard.storyTitle}</div>
                </>
              )}
              {modalCard.quote&&(
                <>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(58,66,112,1)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:4,fontWeight:500}}>What they said</div>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'rgba(200,191,176,1)',lineHeight:1.65,fontStyle:'italic',marginBottom:12}}>"{modalCard.quote}"</div>
                </>
              )}
              {modalCard.bondingQuestion&&(
                <>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:13,color:'#F5B84C',fontStyle:'italic',marginBottom:4}}>"{modalCard.bondingQuestion}"</div>
                  {modalCard.bondingAnswer&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'#F4EFE8',lineHeight:1.6}}>{modalCard.bondingAnswer}</div>}
                </>
              )}
              {!modalCard.quote&&!modalCard.bondingQuestion&&(
                <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'rgba(200,191,176,1)',lineHeight:1.65,fontStyle:'italic',marginBottom:12}}>{modalCard.memory_line||'A night to remember'}</div>
              )}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,marginTop:10,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(255,255,255,.18)'}}>sleepseed.ai</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:11,fontStyle:'italic',color:'rgba(255,255,255,.32)'}}>Memory <em style={{color:'rgba(245,184,76,.65)',fontStyle:'normal',fontWeight:700}}>{getMemoryNumber(modalCard)}</em> &middot; {modalCard.heroName}'s journey</div>
                <div style={{display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:12}}>🔥</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(245,184,76,.35)',letterSpacing:'.05em'}}>{glow} streak</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hatch modal */}
      {showHatchModal&&activeEgg&&(
        <div className="dash-hatch-modal" onClick={()=>setShowHatchModal(false)}>
          <div className="dash-hatch-inner" onClick={e=>e.stopPropagation()}>
            <div className="dash-hatch-creature">{activeEgg.creatureEmoji}</div>
            <div className="dash-hatch-title">A new <em>companion</em> has hatched!</div>
            <div className="dash-hatch-sub">Complete the ritual to name them and welcome them home.</div>
            <button className="dash-hatch-btn" onClick={()=>{setShowHatchModal(false);startRitual();}}>Begin tonight's ritual</button>
          </div>
        </div>
      )}

      {/* Night Card Drawer — new shared component */}
      <NightCardDrawer
        isOpen={nightCardDrawerOpen}
        onClose={()=>setNightCardDrawerOpen(false)}
        chapterIndex={activeDrawerChapter}
        nightCards={eggCards}
        onReadChapter={(i)=>{
          setNightCardDrawerOpen(false);
          const card = eggCards[i];
          if(card?.storyId){
            const story = allStories.find(s=>s.id===card.storyId);
            if(story&&onReadStory) onReadStory(story.bookData);
          }
        }}
      />

      {/* Bedtime toast */}
      {bedtimeToast && (
        <div style={{position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',zIndex:300,
          background:'#0C1840',border:'1px solid rgba(245,184,76,.3)',
          borderRadius:18,padding:'14px 20px',boxShadow:'0 12px 40px rgba(0,0,0,.6)',
          display:'flex',alignItems:'center',gap:12,maxWidth:340,width:'90%',
          animation:'fadeUp .3s ease-out'}}>
          <span style={{fontSize:28}}>🌙</span>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:600,color:'#F4EFE8',marginBottom:2}}>Bedtime!</div>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:'rgba(234,242,255,.6)'}}>It's story time with {childName}.</div>
          </div>
          <button onClick={()=>setBedtimeToast(false)} style={{background:'none',border:'none',color:'rgba(234,242,255,.3)',fontSize:16,cursor:'pointer',marginLeft:'auto',padding:4}}>✕</button>
        </div>
      )}
    </div>
  );
}
