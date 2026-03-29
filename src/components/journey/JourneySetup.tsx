import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../AppContext';
import { resolveCreatureForRead } from '../../lib/creature-helpers';
import { getCharacters } from '../../lib/storage';
import { getAllHatchedCreatures } from '../../lib/hatchery';
import { journeyService } from '../../lib/journey-service';
import { supabase } from '../../lib/supabase';
import type { Character, HatchedCreature } from '../../lib/types';

// ── Data ─────────────────────────────────────────────────────────────────────

const EMOTIONAL_GOALS = [
  { id: 'calm',       emoji: '🌙', label: 'Calm',       desc: 'Gentle & settling' },
  { id: 'confidence', emoji: '⚡', label: 'Confidence', desc: 'Brave steps & earned wins' },
  { id: 'comfort',    emoji: '🫂', label: 'Comfort',    desc: 'Held & safe, not alone' },
  { id: 'courage',    emoji: '🦁', label: 'Courage',    desc: 'Into the unknown' },
  { id: 'fun',        emoji: '😄', label: 'Fun',        desc: 'Loud, silly, delightful' },
  { id: 'connection', emoji: '🤝', label: 'Connection', desc: 'Warm & close, together' },
  { id: 'wonder',     emoji: '✨', label: 'Wonder',     desc: 'Strange & beautiful' },
];

const WORLDS = [
  { id: 'tiny-kingdom',    emoji: '🐜',  name: 'The Tiny Kingdom',         description: 'A whole civilization living under your floorboards' },
  { id: 'candy-factory',   emoji: '🏭',  name: 'The Candy Factory',        description: "Makes every sweet that ever existed — and some that shouldn't" },
  { id: 'land-of-rainbows',emoji: '🌈',  name: 'The Land of Rainbows',     description: 'Where rainbows are mixed and shipped — currently running low on orange' },
  { id: 'bubble-city',     emoji: '🫧',  name: 'The Bubble City',          description: 'A city floating inside soap bubbles — you have to be very, very careful' },
  { id: 'arcade',          emoji: '🕹️', name: 'The Arcade',               description: "Games that haven't been invented yet — and nobody knows who built it" },
  { id: 'pillow-fort',     emoji: '🏰',  name: 'The Pillow Fort Kingdom',  description: "The world's largest pillow fort, built by children over hundreds of years" },
  { id: 'planet-weird',    emoji: '🛸',  name: 'Planet Weird',             description: 'The planet where everything Earth threw away ended up — they love it' },
  { id: 'custom',          emoji: '🗺️', name: 'Somewhere else...',         description: "We'll build it together" },
];

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
.js-wrap{min-height:100dvh;background:#060912;color:#F4EFE8;font-family:'Nunito',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.js-inner{max-width:480px;margin:0 auto;padding:24px 20px 120px}
.js-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
.js-back{background:none;border:none;color:rgba(244,239,232,.4);cursor:pointer;font-size:14px;font-family:'Nunito',sans-serif;padding:0}
.js-back:hover{color:rgba(244,239,232,.7)}
.js-step{font-size:11px;color:rgba(244,239,232,.25);font-family:'DM Mono',monospace;letter-spacing:.05em}
.js-heading{font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:700;line-height:1.25;margin-bottom:8px}
.js-sub{font-size:14px;color:rgba(244,239,232,.45);margin-bottom:24px;line-height:1.5}
.js-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.js-card{padding:18px 16px;border-radius:14px;border:1.5px solid rgba(244,239,232,.08);background:rgba(255,255,255,.03);cursor:pointer;transition:all .18s;text-align:left;min-height:80px;display:flex;flex-direction:column;gap:4px}
.js-card:hover{border-color:rgba(245,184,76,.2);background:rgba(245,184,76,.04)}
.js-card.sel{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.08)}
.js-card-emoji{font-size:24px;line-height:1;margin-bottom:4px}
.js-card-name{font-family:'Fraunces',Georgia,serif;font-size:14px;font-weight:600;color:#F4EFE8}
.js-card.sel .js-card-name{color:#F5B84C}
.js-card-desc{font-size:12px;color:rgba(244,239,232,.35);line-height:1.4}
.js-card.sel .js-card-desc{color:rgba(245,184,76,.6)}
.js-full{grid-column:1/-1}
.js-input{width:100%;padding:14px 16px;border-radius:12px;border:1.5px solid rgba(244,239,232,.1);background:rgba(255,255,255,.04);color:#F4EFE8;font-size:14px;font-family:'Nunito',sans-serif;outline:none;box-sizing:border-box;transition:border-color .2s}
.js-input:focus{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.03)}
.js-input::placeholder{color:rgba(244,239,232,.25)}
.js-textarea{min-height:90px;resize:vertical;line-height:1.55}
.js-cta{width:100%;padding:16px 24px;border:none;border-radius:14px;background:linear-gradient(135deg,#7a4808,#c4851c,#F5B84C);color:#1a0800;font-family:'Fraunces',Georgia,serif;font-size:16px;font-weight:600;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 6px 24px rgba(245,184,76,.2);transition:transform .18s,filter .18s;margin-top:8px}
.js-cta:hover{transform:translateY(-1px);filter:brightness(1.05)}
.js-cta:active{transform:scale(.98)}
.js-cta::after{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.15),transparent);animation:jsShimmer 3.5s ease-in-out infinite}
@keyframes jsShimmer{0%{transform:translateX(-100%)}60%,100%{transform:translateX(250%)}}
.js-ghost{width:100%;padding:10px;background:none;border:none;color:rgba(244,239,232,.3);font-size:13px;cursor:pointer;font-family:'Nunito',sans-serif;margin-top:8px}
.js-ghost:hover{color:rgba(244,239,232,.5)}
.js-label{font-size:13px;color:rgba(244,239,232,.5);margin-bottom:8px;font-weight:600}
.js-field{margin-bottom:16px}
@keyframes jsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes jsPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
@keyframes jsFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes jsDotFill{from{background:rgba(244,239,232,.08);box-shadow:none}to{background:#F5B84C;box-shadow:0 0 8px rgba(245,184,76,.5)}}
.js-reveal-title{animation:jsFadeIn .6s ease-out both}
.js-reveal-teaser{animation:jsFadeIn .6s ease-out .3s both}
.js-reveal-dots{animation:jsFadeIn .4s ease-out .6s both}
.js-reveal-cta{animation:jsFadeIn .5s ease-out 1.8s both}
.js-dot-fill{animation:jsDotFill .3s ease-out both}
.js-series-banner{background:rgba(245,184,76,.06);border:1px solid rgba(245,184,76,.18);border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
.js-series-label{font-size:11px;color:#F5B84C;font-family:'DM Mono',monospace;margin-bottom:2px}
.js-series-title{color:#F4EFE8;font-size:14px;font-weight:600}
.js-series-close{background:none;border:none;color:rgba(244,239,232,.25);cursor:pointer;font-size:18px;padding:0 0 0 12px}
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function JourneySetup() {
  const {
    user, selectedCharacter, selectedCharacters, companionCreature,
    setView, setActiveJourneyId, setSelectedCharacter, setCompanionCreature,
    activeSeriesId, setActiveSeriesId,
  } = useApp();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [revealed, setRevealed] = useState<{ title: string; teaser: string } | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    emotionalGoal: '',
    world: '',
    worldName: '',
    customWorld: '',
    recentEvent: '',
    specificDetail: '',
    importantThing: '',
  });

  const [seriesContext, setSeriesContext] = useState<{ title: string; coreWorld: string } | null>(null);
  const [resolvedChar, setResolvedChar] = useState<Character | null>(null);
  const [resolvedCreature, setResolvedCreature] = useState<HatchedCreature | null>(null);

  // Load series context
  useEffect(() => {
    if (!activeSeriesId) return;
    supabase.from('story_series').select('title, core_world').eq('id', activeSeriesId).single()
      .then(({ data }) => {
        if (data) {
          setSeriesContext({ title: data.title, coreWorld: data.core_world });
          if (data.core_world) setForm(f => ({ ...f, world: data.core_world, worldName: data.core_world }));
        }
      });
  }, [activeSeriesId]);

  // Resolve character + creature + check for existing journey
  useEffect(() => {
    const char = selectedCharacter || selectedCharacters?.[0] || null;
    const creature = companionCreature || null;
    if (char) setResolvedChar(char);
    if (creature) setResolvedCreature(creature);

    const loadData = async () => {
      if (!user?.id) { setInitLoading(false); return; }

      // Load char/creature if missing
      if (!char || !creature) {
        const [chars, creatures] = await Promise.all([
          char ? [char] : await getCharacters(user.id),
          creature ? [creature] : await getAllHatchedCreatures(user.id),
        ]);
        const family = (chars as Character[]).filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
        const primary = char || family[0] || (chars as Character[])[0] || null;
        const comp = creature || ((creatures as HatchedCreature[]).length > 0 ? (creatures as HatchedCreature[])[0] : null);
        if (primary) { setResolvedChar(primary); setSelectedCharacter(primary); }
        if (comp) { setResolvedCreature(comp); setCompanionCreature(comp); }
      }

      // Active journey guard — redirect if one already exists
      const rc = char || selectedCharacters?.[0];
      if (rc) {
        const existing = await journeyService.getActiveJourney(user.id, rc.id);
        if (existing) {
          setActiveJourneyId(existing.id);
          setView('nightly-checkin');
          return;
        }
      }

      setInitLoading(false);
    };
    loadData();
  }, [user?.id]); // eslint-disable-line

  const childName = resolvedChar?.name || 'your child';

  const loadingSteps = [
    "Building your book's world...",
    "Planting the details that will matter later...",
    "Almost ready...",
  ];

  const handleSubmit = async () => {
    if (!user || !resolvedChar) return;
    setLoading(true);
    setError(null);
    let si = 0;
    setLoadingText(loadingSteps[si]);
    const iv = setInterval(() => { si = Math.min(si + 1, loadingSteps.length - 1); setLoadingText(loadingSteps[si]); }, 2000);

    try {
      const creatureData = resolvedCreature?.creatureType
        ? resolveCreatureForRead(resolvedCreature.creatureType, 1)
        : { name: resolvedCreature?.name || 'companion', virtue: '', storyPersonality: '', lessonBeat: '' };

      const res = await fetch('/api/story-journeys/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          characterId: resolvedChar.id,
          creatureId: resolvedCreature?.creatureType || 'bunny',
          child: {
            name: resolvedChar.name, ageBand: resolvedChar.ageDescription,
            pronouns: resolvedChar.pronouns, traits: resolvedChar.personalityTags,
            weirdDetail: resolvedChar.weirdDetail, currentSituation: resolvedChar.currentSituation,
          },
          creature: { name: resolvedCreature?.name || creatureData.name, virtue: creatureData.virtue, storyPersonality: creatureData.storyPersonality, lessonBeat: creatureData.lessonBeat },
          emotionalGoal: form.emotionalGoal,
          world: form.world === 'custom' ? form.customWorld : (form.worldName || form.world),
          recentEvent: form.recentEvent, specificDetail: form.specificDetail, importantThing: form.importantThing,
          cast: [], seriesId: activeSeriesId || undefined, seriesMode: activeSeriesId ? 'continue_world' : 'fresh',
        }),
      });
      const data = await res.json();
      clearInterval(iv); setLoading(false);
      if (data.error) { setError(data.error); return; }
      if (data.storyJourneyId) {
        setActiveJourneyId(data.storyJourneyId);
        setActiveSeriesId(null);
        if (data.existingJourney) { setView('nightly-checkin'); }
        else { setRevealed({ title: data.workingTitle, teaser: data.teaser }); }
      }
    } catch (e) { clearInterval(iv); setLoading(false); setError(e instanceof Error ? e.message : 'Something went wrong'); }
  };

  // ── Renders ────────────────────────────────────────────────────────────────

  if (initLoading) return (
    <div className="js-wrap" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{CSS}</style>
      <p style={{color:'rgba(244,239,232,.4)'}}>Loading...</p>
    </div>
  );

  if (!resolvedChar) return (
    <div className="js-wrap" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <style>{CSS}</style>
      <p>Complete onboarding first to create your child's profile.</p>
      <button className="js-cta" style={{maxWidth:280}} onClick={()=>setView('parent-setup')}>Set up your child</button>
      <button className="js-ghost" onClick={()=>setView('dashboard')}>Back</button>
    </div>
  );

  if (loading) return (
    <div className="js-wrap" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <style>{CSS}</style>
      <div style={{fontSize:56,animation:'jsFloat 4s ease-in-out infinite,jsPulse 2.5s ease-in-out infinite',marginBottom:28}}>
        {resolvedCreature?.creatureEmoji || '📖'}
      </div>
      <p style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18}}>{loadingText}</p>
    </div>
  );

  if (revealed) return (
    <div className="js-wrap" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <style>{CSS}</style>
      <div style={{textAlign:'center',maxWidth:380,padding:'0 20px'}}>
        <div style={{fontSize:48,marginBottom:20,animation:'jsFloat 5s ease-in-out infinite'}}>{resolvedCreature?.creatureEmoji||'📖'}</div>
        <h1 className="js-reveal-title" style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:26,fontWeight:700,lineHeight:1.2,margin:'0 0 14px'}}>{revealed.title}</h1>
        <p className="js-reveal-teaser" style={{fontFamily:"'Fraunces',Georgia,serif",fontStyle:'italic',color:'rgba(244,239,232,.5)',fontSize:15,margin:'0 0 28px',lineHeight:1.5}}>{revealed.teaser}</p>
        <div className="js-reveal-dots" style={{display:'flex',gap:8,justifyContent:'center',marginBottom:8}}>
          {[1,2,3,4,5,6,7].map((n,i)=>(
            <div key={n} className="js-dot-fill" style={{width:12,height:12,borderRadius:'50%',animationDelay:`${0.7+i*0.12}s`}}/>
          ))}
        </div>
        <p className="js-reveal-dots" style={{fontSize:12,color:'rgba(244,239,232,.3)',fontFamily:"'DM Mono',monospace",marginBottom:32}}>7 nights to complete</p>
        <button className="js-cta js-reveal-cta" onClick={()=>setView('nightly-checkin')}>Begin Read 1 ✦</button>
      </div>
    </div>
  );

  return (
    <div className="js-wrap">
      <style>{CSS}</style>
      <div className="js-inner">
        {/* Nav */}
        <div className="js-nav">
          <button className="js-back" onClick={()=>step>1?setStep(step-1):setView('dashboard')}>
            {step>1?'← Back':'← Dashboard'}
          </button>
          <div className="js-step">Step {step} of 3</div>
        </div>

        {/* Series banner */}
        {seriesContext&&(
          <div className="js-series-banner">
            <div><div className="js-series-label">Continuing</div><div className="js-series-title">{seriesContext.title}</div></div>
            <button className="js-series-close" onClick={()=>{setActiveSeriesId(null);setSeriesContext(null);setForm(f=>({...f,world:'',worldName:''}))}}>✕</button>
          </div>
        )}

        {/* Step 1 — Emotional Goal */}
        {step===1&&(
          <div style={{animation:'jsFadeIn .35s ease-out'}}>
            <h2 className="js-heading">What does {childName} need most in this book?</h2>
            <div className="js-grid">
              {EMOTIONAL_GOALS.map(g=>(
                <button key={g.id} className={`js-card${form.emotionalGoal===g.id?' sel':''}`}
                  onClick={()=>{setForm(f=>({...f,emotionalGoal:g.id}));setTimeout(()=>setStep(2),200);}}>
                  <div className="js-card-emoji">{g.emoji}</div>
                  <div className="js-card-name">{g.label}</div>
                  <div className="js-card-desc">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — World */}
        {step===2&&(
          <div style={{animation:'jsFadeIn .35s ease-out'}}>
            <h2 className="js-heading">Where does this book begin?</h2>
            <p className="js-sub">Pick a world — or make one up</p>
            <div className="js-grid">
              {WORLDS.map(w=>(
                <button key={w.id} className={`js-card${form.world===w.id?' sel':''}${w.id==='custom'?' js-full':''}`}
                  onClick={()=>{
                    setForm(f=>({...f,world:w.id,worldName:w.id==='custom'?'':w.name}));
                    if(w.id!=='custom') setTimeout(()=>setStep(3),200);
                  }}>
                  <div className="js-card-emoji">{w.emoji}</div>
                  <div className="js-card-name">{w.name}</div>
                  <div className="js-card-desc">{w.description}</div>
                </button>
              ))}
            </div>
            {form.world==='custom'&&(
              <div style={{marginTop:14}}>
                <textarea className="js-input js-textarea" value={form.customWorld}
                  onChange={e=>setForm(f=>({...f,customWorld:e.target.value}))}
                  placeholder="Describe the world — the weirder the better..." autoFocus/>
                {form.customWorld.trim().length>2&&(
                  <button className="js-cta" style={{marginTop:12}} onClick={()=>setStep(3)}>Continue</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Make it theirs */}
        {step===3&&(
          <div style={{animation:'jsFadeIn .35s ease-out'}}>
            <h2 className="js-heading">Add something real</h2>
            <p className="js-sub">The real stuff makes it theirs. All optional.</p>

            <div className="js-field">
              <div className="js-label">What's been on {childName}'s mind lately?</div>
              <textarea className="js-input js-textarea" value={form.recentEvent}
                onChange={e=>setForm(f=>({...f,recentEvent:e.target.value}))}
                placeholder="e.g. starting swimming lessons, missing grandma..."/>
            </div>

            <div className="js-field">
              <div className="js-label">One weird or specific detail about this week</div>
              <input className="js-input" value={form.specificDetail}
                onChange={e=>setForm(f=>({...f,specificDetail:e.target.value}))}
                placeholder="e.g. the really fat frog we found"/>
            </div>

            <div className="js-field">
              <div className="js-label">Something {childName} is into right now</div>
              <input className="js-input" value={form.importantThing}
                onChange={e=>setForm(f=>({...f,importantThing:e.target.value}))}
                placeholder="e.g. collecting rocks, making up songs"/>
            </div>

            {error&&(
              <div style={{padding:14,marginBottom:16,background:'rgba(192,64,48,.1)',border:'1px solid rgba(192,64,48,.25)',borderRadius:12,fontSize:13,color:'#f09080',lineHeight:1.5}}>
                Something went wrong — <button onClick={handleSubmit} style={{background:'none',border:'none',color:'#F5B84C',cursor:'pointer',fontWeight:600,fontSize:13,padding:0}}>try again</button>
              </div>
            )}

            <button className="js-cta" onClick={handleSubmit}>Build our book ✦</button>
            <button className="js-ghost" onClick={handleSubmit}>Skip — start with what we have</button>
          </div>
        )}
      </div>
    </div>
  );
}
