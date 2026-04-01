import { useState, useCallback } from 'react';
import { useApp } from '../AppContext';
import ElderDreamKeeper from '../components/onboarding/ElderDreamKeeper';
import DreamEgg from '../components/onboarding/DreamEgg';
import StarBackground from '../components/onboarding/StarBackground';
import '../components/onboarding/onboarding.css';
import { getRitualState, completeNight1, completeNight2 } from '../lib/ritualState';
import { saveNightCard } from '../lib/storage';
import type { SavedNightCard } from '../lib/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
  night: 1 | 2 | 3;
  initialScreen?: string;
  onStartStory: (ritualSeed: string) => void;
  onNightComplete: () => void;
  onCreateAnotherStory?: () => void;
}

// ── Subscreen types ──────────────────────────────────────────────────────────
type N1Screen = 'welcome' | 'lore' | 'share' | 'pre-story' | 'post-story' | 'card' | 'tuck-in';
type N2Screen = 'return' | 'egg' | 'question' | 'pre-story' | 'post-story' | 'card' | 'tuck-in';

// ── Helper ───────────────────────────────────────────────────────────────────
const fadeUp = (delay: number): React.CSSProperties => ({
  animation: `ob-fadeUp 0.6s ${delay}s ease both`, opacity: 0,
});

// ═══════════════════════════════════════════════════════════════════════════
export default function NightDashboard({ night, initialScreen, onStartStory, onNightComplete, onCreateAnotherStory }: Props) {
  const { user } = useApp();

  // Night 1 state
  const [n1Screen, setN1Screen] = useState<N1Screen>((initialScreen as N1Screen) || 'welcome');
  const [smileAnswer, setSmileAnswer] = useState('');
  const [n1PhotoAdded, setN1PhotoAdded] = useState(false);

  // Night 2 state
  const [n2Screen, setN2Screen] = useState<N2Screen>((initialScreen as N2Screen) || 'return');
  const [talentAnswer, setTalentAnswer] = useState('');

  // Get ritual state for context
  const ritual = user ? getRitualState(user.id) : null;
  const childName = ritual?.childName || 'friend';

  // ── Night 1: Handle smile selection ────────────────────────────────────
  const [dkReacted, setDkReacted] = useState(false);
  const pickSmile = useCallback((answer: string) => {
    setSmileAnswer(answer);
    setTimeout(() => setDkReacted(true), 600);
  }, []);

  // ── Night 1: Start story ───────────────────────────────────────────────
  const startN1Story = useCallback(() => {
    onStartStory(`${childName} shared that ${smileAnswer} made them smile today. The Elder DreamKeeper gave them a Dream Egg.`);
  }, [childName, smileAnswer, onStartStory]);

  // ── Night 1: Complete ──────────────────────────────────────────────────
  const completeN1 = useCallback(async () => {
    if (!user) return;
    completeNight1(user.id, smileAnswer);

    // Save Night Card
    const card: SavedNightCard = {
      id: crypto.randomUUID?.() || `nc_${Date.now()}`,
      userId: user.id,
      heroName: childName,
      storyTitle: 'The Night Your Dream Egg First Listened',
      characterIds: [],
      headline: 'The Night Your Dream Egg First Listened',
      quote: `Tonight, ${childName} shared that ${smileAnswer} made them smile. The Elder DreamKeeper brought a Dream Egg to begin the journey.`,
      emoji: ritual?.creatureEmoji || '\uD83E\uDD5A',
      date: new Date().toISOString().split('T')[0],
      isOrigin: true,
      nightNumber: 1,
      creatureEmoji: ritual?.creatureEmoji,
      creatureColor: ritual?.creatureColor,
    };
    try { await saveNightCard(card); } catch (e) { console.error('[night1] saveNightCard failed:', e); }

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

    const card: SavedNightCard = {
      id: crypto.randomUUID?.() || `nc_${Date.now()}`,
      userId: user.id,
      heroName: childName,
      storyTitle: 'The Night It Remembered Your Smile',
      characterIds: [],
      headline: 'The Night It Remembered Your Smile',
      quote: `${childName} shared something again tonight. The egg is listening more closely now.`,
      emoji: ritual?.creatureEmoji || '\uD83E\uDD5A',
      date: new Date().toISOString().split('T')[0],
      nightNumber: 2,
      creatureEmoji: ritual?.creatureEmoji,
      creatureColor: ritual?.creatureColor,
    };
    try { await saveNightCard(card); } catch (e) { console.error('[night2] saveNightCard failed:', e); }

    onNightComplete();
  }, [user, talentAnswer, childName, ritual, onNightComplete]);

  // ═══════════════════════════════════════════════════════════════════════
  // NIGHT 1 RENDER
  // ═══════════════════════════════════════════════════════════════════════
  if (night === 1) {
    // ── C1: Welcome ──
    if (n1Screen === 'welcome') return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 28%, rgba(50,25,110,.9), #060912 65%)' }}>
          <StarBackground />
          <div style={{ position: 'absolute', top: 72, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5, ...fadeUp(0.2) }}>
            <div style={{ animation: 'ob-elderFloat 4.4s ease-in-out infinite' }}>
              <ElderDreamKeeper animate={false} />
            </div>
          </div>
          <div className="ob-ct bottom" style={{ paddingBottom: 44 }}>
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
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 22%, rgba(25,14,70,.88), #060912 55%)' }}>
          <StarBackground opacity={0.65} />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 220, height: 200, background: 'radial-gradient(ellipse at 50% 0%, rgba(246,197,111,.08), transparent 70%)', pointerEvents: 'none' }} />
          <div className="ob-ct" style={{ paddingTop: 64 }}>
            <div style={{ animation: 'ob-fadeIn .6s ease both', marginBottom: 22 }}>
              <ElderDreamKeeper />
            </div>
            <div style={{
              background: 'rgba(184,161,255,.1)', border: '1px solid rgba(184,161,255,.25)',
              borderRadius: '20px 20px 20px 5px', padding: '18px 20px', marginBottom: 20,
              textAlign: 'left', ...fadeUp(0.15), width: '100%',
            }}>
              <div style={{ fontSize: 8.5, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 8 }}>THE ELDER DREAMKEEPER</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.52, letterSpacing: -0.1 }}>
                "There are beings called DreamKeepers.<br /><br />
                They don't belong to everyone.<br /><br />
                Each one chooses a single child&hellip; to watch over, learn from, and grow beside."
              </div>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', marginBottom: 24, lineHeight: 1.65, ...fadeUp(0.25) }}>
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
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
          <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(246,197,111,.07), #060912 54%)' }}>
            <StarBackground opacity={0.55} />
            <div className="ob-ct" style={{ paddingTop: 52, gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, animation: 'ob-fadeIn .5s ease both' }}>
                <div style={{ transform: 'scale(.72)', transformOrigin: 'bottom center' }}>
                  <ElderDreamKeeper />
                </div>
              </div>
              {/* DreamKeeper speech */}
              <div style={{
                background: 'rgba(246,197,111,.08)', border: '1px solid rgba(246,197,111,.2)',
                borderRadius: '20px 20px 20px 5px', padding: '15px 17px', marginBottom: 10,
                textAlign: 'left', width: '100%', ...fadeUp(0.1),
                transition: 'opacity .35s ease',
              }}>
                <div style={{ fontSize: 8, color: 'rgba(246,197,111,.55)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 6 }}>THE DREAMKEEPER</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5, letterSpacing: -0.1 }}>
                  {dkReacted
                    ? '"Hmm\u2026\n\nI think I know where this begins."'
                    : `"Hello, ${childName}.\n\nTell me something — what made you smile today?"`}
                </div>
              </div>
              {/* Egg listening label */}
              <div style={{ fontSize: 9, color: 'rgba(246,197,111,.35)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, marginBottom: 4, ...fadeUp(0.6) }}>
                THE EGG IS LISTENING TOO
              </div>
              <div style={{ height: 18, marginBottom: 8 }} />
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
                <button className="ob-cta" onClick={startN1Story}>Start tonight's story &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── C7: Post-story close ("That was your first story together") ──
    if (n1Screen === 'post-story') return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
              {!n1PhotoAdded && (
                <div
                  onClick={() => setN1PhotoAdded(true)}
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
              )}
              <button className="ob-cta" onClick={() => setN1Screen('tuck-in')}>Save to collection &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    );

    // ── C9: Tuck in ──
    if (n1Screen === 'tuck-in') return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(20,60,50,.35), #060912 62%)' }}>
          <StarBackground opacity={0.88} />
          <div className="ob-ct">
            <div style={{ animation: 'ob-nestSettle .8s ease both', marginBottom: 8 }}>
              <div style={{ animation: 'ob-heartbeat 3.5s ease-in-out infinite' }}>
                <DreamEgg state="cracked" size="sm" />
              </div>
            </div>
            <div style={{ ...fadeUp(0.3), width: '100%' }}>
              <div className="ob-ey" style={{ marginBottom: 14 }}>Night 1 · Complete</div>
              <div className="ob-h1" style={{ fontSize: 26, marginBottom: 10 }}>
                "Come back tomorrow.<br /><em>It will be different.</em>"
              </div>
              <div className="ob-sub" style={{ fontSize: 13, marginBottom: 6 }}>Every story helps it grow.</div>
              <div style={{
                padding: '12px 16px', background: 'rgba(184,161,255,.07)',
                border: '1px solid rgba(184,161,255,.16)', borderRadius: 14,
                marginBottom: 22, textAlign: 'left',
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(184,161,255,.55)', letterSpacing: 0.5, marginBottom: 5 }}>THE ELDER</div>
                <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(234,242,255,.6)', lineHeight: 1.55 }}>
                  "It heard everything tonight. Rest well, {childName}. When the stars return — it will be waiting."
                </div>
              </div>
              <button className="ob-cta" onClick={completeN1}>Say goodnight</button>
              <div style={{ height: 8 }} />
              {onCreateAnotherStory && (
                <button className="ob-ghost" onClick={onCreateAnotherStory}>Want more? Create a story.</button>
              )}
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
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
