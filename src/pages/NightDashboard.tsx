import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import ElderDreamKeeper from '../components/onboarding/ElderDreamKeeper';
import DreamEgg from '../components/onboarding/DreamEgg';
import StarBackground from '../components/onboarding/StarBackground';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import '../components/onboarding/onboarding.css';
import { getRitualState, saveRitualState, completeNight1, completeNight2 } from '../lib/ritualState';
import { saveNightCard, getNightCards } from '../lib/storage';
import type { SavedNightCard } from '../lib/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
  night: 1 | 2 | 3;
  initialScreen?: string;
  onInitialScreenConsumed?: () => void;
  onStartStory: (ritualSeed: string) => void;
  onNightComplete: () => void;
  onCreateAnotherStory?: () => void;
}

// ── Subscreen types ──────────────────────────────────────────────────────────
type N1Screen = 'welcome' | 'lore' | 'share' | 'story' | 'egg-gift' | 'egg-crack' | 'post-story' | 'card' | 'tuck-in';
type N2Screen = 'return' | 'egg' | 'question' | 'pre-story' | 'post-story' | 'card' | 'tuck-in';

// ── Helper ───────────────────────────────────────────────────────────────────
const fadeUp = (delay: number): React.CSSProperties => ({
  animation: `ob-fadeUp 0.6s ${delay}s ease both`, opacity: 0,
});

// ═══════════════════════════════════════════════════════════════════════════
export default function NightDashboard({ night, initialScreen, onInitialScreenConsumed, onStartStory, onNightComplete, onCreateAnotherStory }: Props) {
  const { user } = useApp();

  // Night 1 state — initialize smileAnswer from ritual state if returning from story builder
  const ritualSmile = user ? getRitualState(user.id).smileAnswer || '' : '';
  const [n1Screen, setN1Screen] = useState<N1Screen>((initialScreen as N1Screen) || 'welcome');
  const [smileAnswer, setSmileAnswer] = useState(ritualSmile);
  const [storyPage, setStoryPage] = useState(0);
  const [n1PhotoAdded, setN1PhotoAdded] = useState(false);
  const [n1Photo, setN1Photo] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setN1Photo(reader.result as string); setN1PhotoAdded(true); };
    reader.readAsDataURL(file);
  };

  // Night 2 state
  const [n2Screen, setN2Screen] = useState<N2Screen>((initialScreen as N2Screen) || 'return');
  const [talentAnswer, setTalentAnswer] = useState('');

  // BUG 1 FIX: Clear nightReturnTo after this component has consumed the initialScreen value.
  // This prevents the value from being cleared before the remount reads it.
  useEffect(() => {
    if (initialScreen && onInitialScreenConsumed) {
      onInitialScreenConsumed();
    }
    // Only run on mount — the initial screen has been consumed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get ritual state for context
  const ritual = user ? getRitualState(user.id) : null;
  const rawName = ritual?.childName || '';
  const childName = rawName && rawName !== 'friend' ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Dreamer';

  // ── Night 1: Handle smile selection ────────────────────────────────────
  const [dkReacted, setDkReacted] = useState(false);
  const pickSmile = useCallback((answer: string) => {
    setSmileAnswer(answer);
    // Persist smile answer to ritual state immediately so it survives story-builder navigation
    if (user) {
      const rs = getRitualState(user.id);
      rs.smileAnswer = answer;
      saveRitualState(user.id, rs);
    }
    setTimeout(() => setDkReacted(true), 600);
  }, [user]);

  // ── Night 1: Start story ───────────────────────────────────────────────
  const startN1Story = useCallback(() => {
    onStartStory(`${childName} shared that ${smileAnswer} made them smile today. The Elder DreamKeeper gave them a Dream Egg.`);
  }, [childName, smileAnswer, onStartStory]);

  // ── Night 1: Complete ──────────────────────────────────────────────────
  const completeN1 = useCallback(async () => {
    if (!user) return;
    completeNight1(user.id, smileAnswer);

    // Save Night Card — skip if one already exists for today + night 1 (prevents duplicates with SleepSeedCore)
    const today = new Date().toISOString().split('T')[0];
    try {
      const existing = await getNightCards(user.id);
      const alreadySaved = existing.some(c => c.date === today && c.nightNumber === 1);
      if (!alreadySaved) {
        const card: SavedNightCard = {
          id: crypto.randomUUID?.() || `nc_${Date.now()}`,
          userId: user.id,
          heroName: childName,
          storyTitle: 'The Night Your Dream Egg First Listened',
          characterIds: [],
          headline: 'The Night Your Dream Egg First Listened',
          quote: `Tonight, ${childName} shared that ${smileAnswer} made them smile. The Elder DreamKeeper brought a Dream Egg to begin the journey.`,
          emoji: ritual?.creatureEmoji || '\uD83E\uDD5A',
          photo: n1Photo || undefined,
          date: today,
          isOrigin: true,
          nightNumber: 1,
          creatureEmoji: ritual?.creatureEmoji,
          creatureColor: ritual?.creatureColor,
        };
        await saveNightCard(card);
      }
    } catch (e) { console.error('[night1] saveNightCard failed:', e); }

    onNightComplete();
  }, [user, smileAnswer, childName, ritual, onNightComplete]);

  // ── Night 2: Handle talent selection ───────────────────────────────────
  const [n2Reacted, setN2Reacted] = useState(false);
  const pickTalent = useCallback((answer: string) => {
    setTalentAnswer(answer);
    setTimeout(() => setN2Reacted(true), 600);
  }, []);

  const startN2Story = useCallback(() => {
    onStartStory(`${childName} shared that they're really good at ${talentAnswer}. The Dreamlight is flickering and needs their gift. The egg remembers that ${ritual?.smileAnswer || 'something'} made them smile.`);
  }, [childName, talentAnswer, ritual, onStartStory]);

  const completeN2 = useCallback(async () => {
    if (!user) return;
    completeNight2(user.id, talentAnswer);

    // Save Night Card — skip if one already exists for today + night 2 (prevents duplicates with SleepSeedCore)
    const today = new Date().toISOString().split('T')[0];
    try {
      const existing = await getNightCards(user.id);
      const alreadySaved = existing.some(c => c.date === today && c.nightNumber === 2);
      if (!alreadySaved) {
        const card: SavedNightCard = {
          id: crypto.randomUUID?.() || `nc_${Date.now()}`,
          userId: user.id,
          heroName: childName,
          storyTitle: 'The Night It Remembered Your Smile',
          characterIds: [],
          headline: 'The Night It Remembered Your Smile',
          quote: `${childName} shared something again tonight. The egg is listening more closely now.`,
          emoji: ritual?.creatureEmoji || '\uD83E\uDD5A',
          date: today,
          nightNumber: 2,
          creatureEmoji: ritual?.creatureEmoji,
          creatureColor: ritual?.creatureColor,
        };
        await saveNightCard(card);
      }
    } catch (e) { console.error('[night2] saveNightCard failed:', e); }

    onNightComplete();
  }, [user, talentAnswer, childName, ritual, onNightComplete]);

  // ═══════════════════════════════════════════════════════════════════════
  // NIGHT 1 RENDER
  // ═══════════════════════════════════════════════════════════════════════
  if (night === 1) {
    // ── C1: Welcome ──
    if (n1Screen === 'welcome') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 28%, rgba(50,25,110,.9), #060912 65%)' }}>
          <StarBackground />
          {/* CENTER: Elder */}
          <div className="ob-scene-center" style={{ ...fadeUp(0.2) }}>
            <div style={{ animation: 'ob-elderFloat 4.4s ease-in-out infinite' }}>
              <ElderDreamKeeper animate={false} />
            </div>
          </div>
          {/* BOTTOM: Text + CTA */}
          <div className="ob-scene-bottom" style={{ justifyContent: 'flex-end', paddingBottom: 44 }}>
            <div style={{ ...fadeUp(0.5), width: '100%' }}>
              <div className="ob-ey">Your first night</div>
              <div className="ob-h1" style={{ fontSize: 26, marginBottom: 8 }}>
                "Welcome, <em>{childName}</em>.<br />We have been<br />waiting for you."
              </div>
              <div className="ob-sub" style={{ fontSize: 13, marginBottom: 26 }}>
                The Elder DreamKeeper has a gift — and a story — just for you.
              </div>
              <button className="ob-cta" onClick={() => setN1Screen('lore')}>Begin</button>
            </div>
          </div>
        </div>
      </div>
    );

    // ── C2: Lore ──
    if (n1Screen === 'lore') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 22%, rgba(25,14,70,.88), #060912 55%)' }}>
          <StarBackground opacity={0.65} />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 220, height: 200, background: 'radial-gradient(ellipse at 50% 0%, rgba(246,197,111,.08), transparent 70%)', pointerEvents: 'none' }} />
          {/* CENTER: Elder at natural scale */}
          <div className="ob-scene-center" style={{ top: '12%', height: '32%' }}>
            <div style={{ animation: 'ob-fadeIn .6s ease both' }}>
              <ElderDreamKeeper scale={0.85} />
            </div>
          </div>
          {/* BOTTOM: Speech + CTA */}
          <div className="ob-scene-bottom" style={{ height: '50%', paddingTop: 8 }}>
            <div style={{
              background: 'rgba(184,161,255,.1)', border: '1px solid rgba(184,161,255,.25)',
              borderRadius: '20px 20px 20px 5px', padding: '14px 18px', marginBottom: 12,
              textAlign: 'left', ...fadeUp(0.15), width: '100%',
            }}>
              <div style={{ fontSize: 8.5, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 6 }}>THE ELDER DREAMKEEPER</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5, letterSpacing: -0.1 }}>
                "There are beings called DreamKeepers.<br /><br />
                They don't belong to everyone.<br /><br />
                Each one chooses a single child&hellip; to watch over, learn from, and grow beside."
              </div>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', marginBottom: 16, lineHeight: 1.5, ...fadeUp(0.25) }}>
              "Tonight, your journey begins."
            </div>
            <button className="ob-cta" style={fadeUp(0.35)} onClick={() => setN1Screen('share')}>Tell me more</button>
          </div>
        </div>
      </div>
    );

    // ── C3: Share (what made you smile) ──
    if (n1Screen === 'share') {
      const smileOpts = ['Playing', 'A hug', 'My pet', 'Something silly', 'Being outside', 'Something else'];
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(246,197,111,.07), #060912 54%)' }}>
            <StarBackground opacity={0.55} />
            {/* CENTER: Elder */}
            <div className="ob-scene-center" style={{ top: '8%', height: '30%' }}>
              <div style={{ animation: 'ob-fadeIn .5s ease both' }}>
                <ElderDreamKeeper scale={0.8} />
              </div>
            </div>
            {/* BOTTOM: Speech + Chips + CTA */}
            <div className="ob-scene-bottom" style={{ height: '56%', paddingTop: 4 }}>
              {/* DreamKeeper speech */}
              <div style={{
                background: 'rgba(246,197,111,.08)', border: '1px solid rgba(246,197,111,.2)',
                borderRadius: '20px 20px 20px 5px', padding: '14px 17px', marginBottom: 8,
                textAlign: 'left', width: '100%', ...fadeUp(0.1),
                transition: 'opacity .35s ease',
              }}>
                <div style={{ fontSize: 8, color: 'rgba(246,197,111,.55)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 5 }}>THE DREAMKEEPER</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5, letterSpacing: -0.1 }}>
                  {dkReacted
                    ? '"Hmm\u2026\n\nI think I know where this begins."'
                    : `"Hello, ${childName}.\n\nTell me something \u2014 what made you smile today?"`}
                </div>
              </div>
              {/* Egg listening label */}
              <div style={{ fontSize: 9, color: 'rgba(246,197,111,.35)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, marginBottom: 8, ...fadeUp(0.6) }}>
                THE EGG IS LISTENING TOO
              </div>
              {/* Chips */}
              <div className="ob-chips" style={fadeUp(0.7)}>
                {smileOpts.map(o => (
                  <div
                    key={o}
                    className={`ob-chip ${smileAnswer === o ? 'sel' : ''}`}
                    onClick={() => pickSmile(o)}
                  >{o}</div>
                ))}
              </div>
              {/* CTA */}
              <div style={{
                opacity: dkReacted ? 1 : 0, pointerEvents: dkReacted ? 'auto' : 'none',
                transition: 'opacity .5s ease', width: '100%',
              }}>
                <button className="ob-cta" onClick={() => { setStoryPage(0); setN1Screen('story'); }}>Start tonight's story &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── C4: Story — "The Night You Were Chosen" (built-in lore) ──
    if (n1Screen === 'story') {
      type StoryScene = 'stars' | 'elder' | 'glow' | 'egg';
      const LORE_STORY: { scene: StoryScene; text: string }[] = [
        { scene: 'stars', text: `Long after the lamps were dim and the world had grown quiet, ${childName} noticed a soft golden light drifting through the dark \u2014 like it knew exactly where to go.` },
        { scene: 'elder', text: `The light floated past the window, through the trees, and into a sky full of listening stars. And waiting there, wrapped in moon-glow and feathers of night, stood the Elder DreamKeeper.` },
        { scene: 'elder', text: `\u201cHello, ${childName},\u201d said the Elder in a voice as warm as a blanket. \u201cDreamKeepers watch over children while they sleep. We protect their wonder, keep their memories close, and help brave hearts rest.\u201d` },
        { scene: 'elder', text: `\u201cEvery DreamKeeper belongs to one special child,\u201d the Elder said. \u201cBut first, they must learn who that child is. They listen to stories. They listen to the little truths that make a person who they are.\u201d` },
        { scene: 'elder', text: `The Elder looked closely at ${childName} and smiled softly. \u201cTonight, I heard that something made you smile: ${smileAnswer || 'something beautiful'}. That light belongs to you.\u201d` },
        { scene: 'egg', text: `Then the Elder lifted something glowing from the folds of the night. It was a Dream Egg \u2014 warm, bright, and humming softly, as if a tiny heart inside was already listening.` },
        { scene: 'egg', text: `\u201cInside this egg is a baby DreamKeeper,\u201d the Elder whispered. \u201cRead with it. Tell it about your days. Let it learn your heart. And when it knows who you are, it will hatch and know that it belongs to you.\u201d` },
      ];
      const page = LORE_STORY[storyPage];
      const isLast = storyPage === LORE_STORY.length - 1;

      // Scene backgrounds
      const sceneGradients: Record<StoryScene, string> = {
        stars: 'radial-gradient(ellipse at 50% 30%, rgba(50,25,110,.85), #060912 65%)',
        elder: 'radial-gradient(ellipse at 50% 35%, rgba(20,10,60,.8), #060912 62%)',
        glow: 'radial-gradient(ellipse at 50% 30%, rgba(60,30,120,.7), #060912 65%)',
        egg: 'radial-gradient(ellipse at 50% 35%, rgba(40,20,100,.7), #060912 62%)',
      };

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#060912' }}>
            {/* Top half: scene visual */}
            <div style={{ height: '50%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: sceneGradients[page.scene], transition: 'background .5s ease' }}>
                <StarBackground opacity={0.6} />
                {/* Scene-specific visual */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {page.scene === 'elder' && (
                    <div style={{ transform: 'scale(.55) translateY(-20px)', transformOrigin: 'center' }}>
                      <ElderDreamKeeper animate={false} />
                    </div>
                  )}
                  {page.scene === 'egg' && (
                    <div style={{ position: 'relative', paddingTop: 20 }}>
                      {/* Golden glow behind egg */}
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.18), rgba(184,161,255,.08) 50%, transparent 72%)', filter: 'blur(20px)', animation: 'ob-glowPulse 2.5s ease-in-out infinite' }} />
                      <DreamEgg state="gifted" size="sm" />
                    </div>
                  )}
                  {page.scene === 'stars' && (
                    <div style={{ position: 'relative' }}>
                      {/* Outer golden halo */}
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.18), transparent 70%)', filter: 'blur(20px)', animation: 'ob-glowPulse 5s ease-in-out infinite' }} />
                      {/* Inner orb with golden warmth */}
                      <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.35), rgba(200,210,235,.15) 60%, transparent)', filter: 'blur(12px)', animation: 'ob-glowPulse 3s ease-in-out infinite', position: 'relative', zIndex: 1 }} />
                    </div>
                  )}
                </div>
              </div>
              {/* Bottom fade */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 88, background: 'linear-gradient(to bottom, transparent, #060912)', zIndex: 10 }} />
            </div>
            {/* Bottom half: text + navigation */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px', background: '#060912', position: 'relative' }}>
              {/* Progress dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '8px 0 10px' }}>
                {LORE_STORY.map((_, i) => (
                  <div key={i} style={{
                    width: i === storyPage ? 16 : 7, height: 7, borderRadius: 4,
                    background: i < storyPage ? 'rgba(200,210,235,.55)' : i === storyPage ? '#C8D4E8' : 'rgba(234,242,255,.1)',
                    transition: 'all .3s',
                    ...(i === storyPage ? { animation: 'ob-glowPulse 2.5s ease-in-out infinite' } : {}),
                  }} />
                ))}
              </div>
              {/* Story text */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div key={storyPage} style={{
                  fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16.5,
                  color: 'rgba(244,239,232,.96)', lineHeight: 1.75, letterSpacing: '.01em',
                  animation: 'ob-fadeUp .35s ease both',
                }}>
                  {page.text}
                </div>
              </div>
              {/* CTA */}
              <div style={{ padding: '0 0 26px' }}>
                {isLast ? (
                  <button className="ob-cta" onClick={() => setN1Screen('egg-gift')}>Receive your Dream Egg &rarr;</button>
                ) : (
                  <button className="ob-cta" onClick={() => setStoryPage(p => p + 1)}>Next &rarr;</button>
                )}
              </div>
            </div>
            {/* Top bar overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '20px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(to bottom, rgba(6,9,18,.78), transparent)',
              zIndex: 30, pointerEvents: 'none',
            }}>
              <div
                onClick={() => { if (storyPage > 0) setStoryPage(0); else setN1Screen('share'); }}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.35)',
                  border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'all', cursor: 'pointer',
                }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="rgba(234,242,255,.65)" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 10, fontStyle: 'italic', color: 'rgba(244,239,232,.4)' }}>
                The Night You Were Chosen
              </div>
              <div style={{ width: 34 }} />
            </div>
          </div>
        </div>
      );
    }

    // ── C5: Egg Gift — Elder presents the Dream Egg ──
    if (n1Screen === 'egg-gift') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(40,20,100,.78), #060912 62%)' }}>
          <StarBackground opacity={0.8} />
          {/* TOP: Elder clipped */}
          <div className="ob-scene-top" style={{ height: '18%', justifyContent: 'center' }}>
            <div style={{ width: 210, height: 100, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scale(.46)', transformOrigin: 'bottom center' }}>
                <ElderDreamKeeper animate={false} />
              </div>
            </div>
          </div>
          {/* CENTER: Egg — tappable to advance */}
          <div className="ob-scene-center" style={{ top: '18%', height: '24%' }}>
            <div
              onClick={() => setN1Screen('egg-crack')}
              style={{ animation: 'ob-fadeUp .8s .1s ease both', opacity: 0, cursor: 'pointer', position: 'relative' }}
            >
              {/* Golden glow behind egg */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.15), transparent 70%)', filter: 'blur(18px)', animation: 'ob-glowPulse 2.5s ease-in-out infinite', pointerEvents: 'none' }} />
              <DreamEgg state="gifted" size="sm" />
            </div>
          </div>
          {/* BOTTOM: Speech + echo + tap hint */}
          <div className="ob-scene-bottom" style={{ height: '52%', paddingTop: 4 }}>
            <div style={{
              background: 'rgba(184,161,255,.09)', border: '1px solid rgba(184,161,255,.24)',
              borderRadius: '20px 20px 20px 5px', padding: '12px 16px', marginBottom: 8,
              textAlign: 'left', width: '100%', ...fadeUp(0.2),
            }}>
              <div style={{ fontSize: 8, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 5 }}>THE ELDER DREAMKEEPER</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.48 }}>
                "This egg will become your DreamKeeper. It listens to what you share &mdash; that's how it knows who it belongs to."
              </div>
            </div>
            <div style={{
              padding: '10px 14px', background: 'rgba(184,161,255,.07)', border: '1px solid rgba(184,161,255,.18)',
              borderRadius: 14, marginBottom: 12, textAlign: 'left', width: '100%', ...fadeUp(0.3),
            }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(184,161,255,.55)', letterSpacing: 0.7, marginBottom: 4 }}>THE EGG HEARD YOU</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(234,242,255,.65)', lineHeight: 1.5 }}>
                "You shared that <em style={{ color: '#C8D4E8' }}>{smileAnswer || 'something special'}</em> made you smile. It's holding onto that."
              </div>
            </div>
            {/* Gold text hint instead of button */}
            <div style={{ ...fadeUp(0.5), textAlign: 'center' }}
              onClick={() => setN1Screen('egg-crack')}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(246,197,111,.7)', letterSpacing: 1.8, textTransform: 'uppercase' as const, cursor: 'pointer' }}>
                Tap the egg &uarr;
              </span>
            </div>
          </div>
        </div>
      </div>
    );

    // ── C5: Egg Crack — the egg cracks in response ──
    if (n1Screen === 'egg-crack') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(80,40,180,.26), #060912 58%)' }}>
          <StarBackground opacity={0.75} />
          {/* Elder clipped small at top */}
          <div style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', zIndex: 8, width: 210, height: 110, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scale(.46)', transformOrigin: 'bottom center' }}>
              <ElderDreamKeeper animate={false} />
            </div>
          </div>
          {/* Speech bubble below elder */}
          <div style={{
            position: 'absolute', top: 'calc(6% + 118px)', left: 28, right: 28, zIndex: 8,
            background: 'rgba(184,161,255,.1)', border: '1px solid rgba(184,161,255,.25)',
            borderRadius: '20px 20px 20px 5px', padding: '12px 16px', textAlign: 'left',
            animation: 'ob-fadeUp .8s .6s ease both', opacity: 0,
          }}>
            <div style={{ fontSize: 8, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 5 }}>THE DREAMKEEPER</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.48 }}>
              "That crack appeared because you were here tonight. The egg heard about <em style={{ color: '#C8D4E8' }}>{smileAnswer || 'what you shared'}</em>. It's holding onto that."
            </div>
          </div>
          {/* Egg — cracked state, centered */}
          <div style={{ position: 'absolute', top: '56%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
            <DreamEgg state="cracked" size="sm" />
          </div>
          {/* Progress bar */}
          <div style={{
            position: 'absolute', bottom: 96, left: 28, right: 28, zIndex: 8,
            padding: '10px 14px', background: 'rgba(200,210,235,.06)', border: '1px solid rgba(200,210,235,.15)',
            borderRadius: 12, animation: 'ob-fadeUp .8s 1.2s ease both', opacity: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(200,210,235,.55)', letterSpacing: 0.4 }}>DREAM EGG &middot; NIGHT 1 OF 3</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(234,242,255,.25)' }}>Come back tomorrow</div>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '28%', background: 'linear-gradient(90deg, rgba(200,210,235,.5), #C8D4E8)', borderRadius: 2 }} />
            </div>
          </div>
          {/* Tap hint */}
          <div style={{
            position: 'absolute', bottom: 62, left: 0, right: 0, zIndex: 8, textAlign: 'center',
            animation: 'ob-fadeUp .8s 1.4s ease both', opacity: 0,
          }}>
            <button
              onClick={() => setN1Screen('post-story')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(200,210,235,.65)', letterSpacing: 1.8, textTransform: 'uppercase' as const }}
            >
              Continue &rarr;
            </button>
          </div>
        </div>
      </div>
    );

    // ── C6: Post-story close ("That was your first story together") ──
    if (n1Screen === 'post-story') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 44%, rgba(20,8,55,.98), #030408 70%)' }}>
          <StarBackground opacity={0.55} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 44px', textAlign: 'center' }}>
            <div style={{ ...fadeUp(0.3), marginBottom: 20 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 700, color: 'rgba(244,239,232,.94)', lineHeight: 1.15, letterSpacing: -0.5 }}>
                That was your first<br />story together.
              </div>
            </div>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,.1)', margin: '0 auto 24px', ...fadeUp(1.1) }} />
            <div style={{ ...fadeUp(1.4), marginBottom: 14 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'rgba(246,197,111,.75)', lineHeight: 1.5, letterSpacing: -0.2 }}>
                You stayed.
              </div>
            </div>
            <div style={{ ...fadeUp(2.0), marginBottom: 40 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', lineHeight: 1.65, letterSpacing: -0.1 }}>
                That matters more than you think.
              </div>
            </div>
            <div style={fadeUp(3.2)}>
              <button className="ob-cta" onClick={() => setN1Screen('card')}>Save tonight's memory &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    );

    // ── C8: Night Card ──
    if (n1Screen === 'card') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 26%, rgba(20,80,60,.3), #060912 58%)' }}>
          <StarBackground opacity={0.72} />
          <div className="ob-ct" style={{ paddingTop: 64 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 300, fontStyle: 'italic', color: 'rgba(246,197,111,.55)', lineHeight: 1.7, marginBottom: 18, ...fadeUp(0) }}>
              This moment just happened.<br />Most people would have missed it.
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(111,231,221,.62)', letterSpacing: 1.2, marginBottom: 14, ...fadeUp(0.2) }}>
              ✦ TONIGHT'S MEMORY · SAVED
            </div>
            {/* Night Card preview */}
            <div className="ob-nc" style={{ animation: 'ob-ncReveal .7s .1s cubic-bezier(.2,.8,.3,1) both', width: 244 }}>
              <div className="ob-nc-sky" style={{ height: 124 }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(.45)' }}>
                  <DreamEgg state="cracked" size="sm" />
                </div>
                <div style={{ position: 'absolute', top: 8, left: 10, padding: '3px 8px', background: 'rgba(111,231,221,.2)', border: '1px solid rgba(111,231,221,.4)', borderRadius: 20 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, fontWeight: 600, color: 'rgba(111,231,221,.9)' }}>NIGHT 1 · THE EGG FIRST LISTENED</span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to bottom, transparent, #f8f4ee)' }} />
              </div>
              <div className="ob-nc-paper">
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(26,26,46,.4)', letterSpacing: 0.5, marginBottom: 6 }}>TONIGHT'S MEMORY</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 7 }}>The Night Your Dream Egg First Listened</div>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 9.5, color: 'rgba(26,26,46,.55)', lineHeight: 1.55, marginBottom: 9 }}>
                  "Tonight, {childName} shared that {smileAnswer} made them smile. The Elder DreamKeeper brought a Dream Egg to begin the journey."
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(26,26,46,.38)' }}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(111,231,221,.65)', fontWeight: 600 }}>
                    {childName.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            {/* Photo + Save */}
            <div style={{ ...fadeUp(0.55), width: '100%', marginTop: 6 }}>
              <input type="file" ref={photoInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              {!n1PhotoAdded ? (
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(246,197,111,.06)', border: '1.5px dashed rgba(246,197,111,.24)',
                    borderRadius: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(246,197,111,.12)', border: '1px solid rgba(246,197,111,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>📷</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(246,197,111,.8)' }}>Add a photo — optional</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(234,242,255,.36)', marginTop: 2, letterSpacing: 0.3 }}>TAP TO CAPTURE THIS MOMENT</div>
                  </div>
                </div>
              ) : n1Photo ? (
                <div style={{ width: '100%', marginBottom: 14, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(246,197,111,.2)' }}>
                  <img src={n1Photo} alt="Tonight's moment" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                </div>
              ) : null}
              <button className="ob-cta" onClick={() => setN1Screen('tuck-in')}>Save to collection &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    );

    // ── C9: Tuck in ──
    if (n1Screen === 'tuck-in') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(20,60,50,.35), #060912 62%)' }}>
          <StarBackground opacity={0.88} />
          {/* TOP: Egg breathing — pushed to top 20% */}
          <div className="ob-scene-top" style={{ height: '30%', justifyContent: 'center' }}>
            <div style={{ animation: 'ob-nestSettle .8s ease both' }}>
              <div style={{ animation: 'ob-heartbeat 3.5s ease-in-out infinite', transform: 'scale(.8)' }}>
                <DreamEgg state="cracked" size="sm" />
              </div>
            </div>
          </div>
          {/* BOTTOM: Message + CTA */}
          <div className="ob-scene-bottom" style={{ height: '65%', justifyContent: 'flex-start', paddingTop: 8 }}>
            <div style={{ ...fadeUp(0.3), width: '100%' }}>
              <div className="ob-ey" style={{ marginBottom: 10 }}>Night 1 · Complete</div>
              <div className="ob-h1" style={{ fontSize: 24, marginBottom: 8 }}>
                "Come back tomorrow.<br /><em>It will be different.</em>"
              </div>
              <div className="ob-sub" style={{ fontSize: 13, marginBottom: 6 }}>Every story helps it grow.</div>
              <div style={{
                padding: '11px 14px', background: 'rgba(184,161,255,.07)',
                border: '1px solid rgba(184,161,255,.16)', borderRadius: 14,
                marginBottom: 16, textAlign: 'left',
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(184,161,255,.55)', letterSpacing: 0.5, marginBottom: 4 }}>THE ELDER</div>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(234,242,255,.6)', lineHeight: 1.5 }}>
                  "It heard everything tonight. Rest well, {childName}. When the stars return — it will be waiting."
                </div>
              </div>
              <button className="ob-cta" onClick={completeN1}>Say goodnight</button>
              <div style={{ height: 6 }} />
              <button className="ob-ghost" onClick={() => {
                // Complete the night (save state + card) without navigating to dashboard
                if (user) {
                  completeNight1(user.id, smileAnswer);
                  // Card save is fire-and-forget
                  const today = new Date().toISOString().split('T')[0];
                  getNightCards(user.id).then(existing => {
                    if (!existing.some(c => c.date === today && c.nightNumber === 1)) {
                      saveNightCard({ id: crypto.randomUUID?.() || `nc_${Date.now()}`, userId: user.id, heroName: childName, storyTitle: 'The Night Your Dream Egg First Listened', characterIds: [], headline: 'The Night Your Dream Egg First Listened', quote: `Tonight, ${childName} shared that ${smileAnswer} made them smile.`, emoji: ritual?.creatureEmoji || '\uD83E\uDD5A', date: today, isOrigin: true, nightNumber: 1, creatureEmoji: ritual?.creatureEmoji, creatureColor: ritual?.creatureColor });
                    }
                  }).catch(() => {});
                }
                // Go directly to story creation
                onStartStory(`${childName} just had their first night with their Dream Egg. Create a new bedtime story for them.`);
              }}>Want more? Create a story.</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NIGHT 2 RENDER
  // ═══════════════════════════════════════════════════════════════════════
  if (night === 2) {
    const prevSmile = ritual?.smileAnswer || 'something';

    // ── N2-1: Return ──
    if (n2Screen === 'return') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 28%, rgba(20,50,90,.85), #060912 62%)' }}>
          <StarBackground opacity={0.75} />
          <div className="ob-ct">
            <div style={{ animation: 'ob-fadeIn .6s ease both', marginBottom: 20 }}>
              <div style={{ animation: 'ob-elderFloat 4.4s ease-in-out infinite' }}>
                <ElderDreamKeeper animate={false} />
              </div>
            </div>
            <div style={{ ...fadeUp(0.2), width: '100%' }}>
              <div className="ob-ey">Night 2 · Welcome back</div>
              <div className="ob-h1" style={{ fontSize: 26, marginBottom: 6 }}>
                "Welcome back,<br /><em>{childName}.</em>"
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,242,255,.3)', marginBottom: 14, lineHeight: 1.5 }}>It waited for you.</div>
              {/* Memory callback */}
              <div style={{ background: 'rgba(20,216,144,.09)', border: '1px solid rgba(20,216,144,.22)', borderRadius: 18, padding: '14px 16px', marginBottom: 14, textAlign: 'left' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(20,216,144,.6)', letterSpacing: 0.8, marginBottom: 6 }}>YOUR EGG REMEMBERED</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: 'rgba(244,239,232,.82)', lineHeight: 1.55 }}>
                  "You told me that {prevSmile} made you smile.<br />I've been thinking about that."
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(184,161,255,.07)', border: '1px solid rgba(184,161,255,.15)', borderRadius: 14, marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(234,242,255,.5)', lineHeight: 1.5 }}>
                  "The more you share, the more I understand who you are."
                </div>
              </div>
              <button className="ob-cta" style={{ background: 'linear-gradient(135deg, rgba(20,216,144,.8), rgba(14,190,120,.8))', color: '#061a12', boxShadow: '0 8px 28px rgba(20,216,144,.2)' }} onClick={() => setN2Screen('question')}>
                Continue &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    // ── N2-3: Question ──
    if (n2Screen === 'question') {
      const talentOpts = ['Making things', 'Helping others', 'Running fast', 'Being kind', 'Making people laugh', 'Something else'];
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 14%, rgba(246,197,111,.05), #060912 50%)' }}>
            <StarBackground opacity={0.5} />
            <div className="ob-ct" style={{ padding: '56px 28px 28px', gap: 0, justifyContent: 'flex-start' }}>
              <div style={{ width: 210, height: 100, position: 'relative', overflow: 'hidden', margin: '0 auto 12px', animation: 'ob-fadeIn .4s ease both' }}>
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scale(.4)', transformOrigin: 'bottom center' }}>
                  <ElderDreamKeeper animate={false} />
                </div>
              </div>
              <div style={{
                background: 'rgba(246,197,111,.08)', border: '1px solid rgba(246,197,111,.22)',
                borderRadius: '20px 20px 20px 5px', padding: '14px 16px', marginBottom: 14,
                textAlign: 'left', width: '100%', ...fadeUp(0.1),
              }}>
                <div style={{ fontSize: 8, color: 'rgba(246,197,111,.55)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 6 }}>THE DREAMKEEPER</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5 }}>
                  {n2Reacted
                    ? '"Hmm\u2026\n\nThat matters. I\'ll remember that."'
                    : '"I\'ve been thinking about you since last night.\n\nTell me — what\'s something you\'re really good at?"'}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', width: '100%', marginBottom: 14, ...fadeUp(0.18) }}>
                {talentOpts.map(o => (
                  <button key={o} className={`ob-chip ${talentAnswer === o ? 'sel' : ''}`} onClick={() => pickTalent(o)}>{o}</button>
                ))}
              </div>
              <div style={{ ...fadeUp(0.26), width: '100%' }}>
                <button className="ob-cta" onClick={startN2Story} style={{ opacity: n2Reacted ? 1 : 0.3, pointerEvents: n2Reacted ? 'auto' : 'none' }}>
                  Begin tonight's story &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── N2 post-story ──
    if (n2Screen === 'post-story') return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(14,48,36,.35), #060912 62%)' }}>
          <StarBackground opacity={0.82} />
          <div className="ob-ct">
            <div style={{ animation: 'ob-nestSettle .7s ease both', marginBottom: 20 }}>
              <DreamEgg state="cracked" size="sm" />
            </div>
            <div style={{ ...fadeUp(0.2), width: '100%' }}>
              <div className="ob-ey" style={{ marginBottom: 14 }}>Night 2 · Complete</div>
              <div className="ob-h1" style={{ fontSize: 26, marginBottom: 10 }}>
                "Come back tomorrow.<br /><em>Something is about<br />to change.</em>"
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(20,216,144,.07)', border: '1px solid rgba(20,216,144,.16)', borderRadius: 14, marginBottom: 22, textAlign: 'left' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(20,216,144,.55)', letterSpacing: 0.5, marginBottom: 5 }}>TOMORROW NIGHT</div>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(234,242,255,.6)', lineHeight: 1.55 }}>
                  "Tomorrow night&hellip; I think it may start to open."
                </div>
              </div>
              <button className="ob-cta" onClick={completeN2}>Say goodnight</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NIGHT 3 RENDER
  // ═══════════════════════════════════════════════════════════════════════
  if (night === 3) {
    // ── N3-1: Tonight is different ──
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(60,10,80,.85), #060912 62%)' }}>
          <StarBackground opacity={0.9} />
          <div className="ob-ct" style={{ paddingTop: 52, gap: 0, justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, ...fadeUp(0.2) }}>
              <DreamEgg state="cracked" size="sm" />
            </div>
            <div style={{ ...fadeUp(0.5), width: '100%' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,130,184,.65)', letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 14, textAlign: 'center' }}>
                Night 3 · The Last Night
              </div>
              <div className="ob-h1" style={{ fontSize: 29, marginBottom: 12, textAlign: 'center' }}>
                Tonight<br />is <em>different</em>.
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(234,242,255,.44)', lineHeight: 1.75, marginBottom: 18, textAlign: 'center' }}>
                Three nights of listening.<br />Tonight, your DreamKeeper<br />is ready to be born.
              </div>
              {/* Progress bar */}
              <div style={{ padding: '12px 14px', background: 'rgba(255,130,184,.07)', border: '1px solid rgba(255,130,184,.18)', borderRadius: 14, marginBottom: 18, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(255,130,184,.6)', letterSpacing: 0.5 }}>DREAM EGG PROGRESS</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(255,130,184,.45)' }}>Night 3 of 3 🔥</div>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '94%', background: 'linear-gradient(90deg, rgba(246,197,111,.6), rgba(255,130,184,.8))', borderRadius: 2 }} />
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(234,242,255,.28)', marginTop: 6, letterSpacing: 0.3 }}>Almost ready to hatch</div>
              </div>
              <button
                className="ob-cta"
                style={{ background: 'linear-gradient(135deg, rgba(246,197,111,.9), rgba(255,130,184,.7))', color: '#1a0818' }}
                onClick={() => onStartStory('night3-choosing')}
              >
                Begin the hatching &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Exported sub-screen setters for App.tsx to call after story-builder returns ──
export type { N1Screen, N2Screen };
