import { useState, useEffect, useRef } from 'react';
import type { RitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, ChipGrid, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';
import ElderDreamKeeper from '../onboarding/ElderDreamKeeper';

// ─────────────────────────────────────────────────────────────────────────────
// RitualNight1 — The Arrival
// ─────────────────────────────────────────────────────────────────────────────
// 10-step sequence:
//   0. Welcome — "Your DreamKeeper is beginning to awaken…"
//   1. Lore — DreamKeepers explained
//   2. Share — "What made you smile today?"
//   3. Egg Responds — DreamKeeper reacts to answer
//   4. Story — "The Night You Were Chosen" (7 pages)
//   5. Egg Gifted — "Your first gift has arrived"
//   6. First Crack — something is happening inside
//   7. Photo — capture this moment
//   8. Night Card — memory of Night 1
//   9. End Night — goodnight
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  ritual: RitualState;
  onComplete: (smileAnswer: string) => void;
  onCreateStory?: () => void;
}

const SMILE_OPTIONS = [
  { emoji: '🎮', label: 'Playing' },
  { emoji: '🤗', label: 'A hug' },
  { emoji: '🐾', label: 'My pet' },
  { emoji: '😄', label: 'Something silly' },
  { emoji: '🌳', label: 'Being outside' },
  { emoji: '✨', label: 'Something else' },
];

// Answer-responsive glow colors for the egg
const ANSWER_GLOWS: Record<string, string> = {
  'Playing': 'rgba(100,180,255,.25)',
  'A hug': 'rgba(255,180,200,.25)',
  'My pet': 'rgba(180,220,140,.25)',
  'Something silly': 'rgba(255,220,100,.25)',
  'Being outside': 'rgba(140,220,180,.25)',
  'Something else': 'rgba(200,180,255,.25)',
};

function makeStoryPages(childName: string, smileAnswer: string): StoryPage[] {
  return [
    {
      text: `Long after the lamps were dim and the world had grown quiet, ${childName} noticed a soft golden light drifting through the dark — like it knew exactly where to go.`,
      scene: 'stars',
    },
    {
      text: `The light floated past the window, through the trees, and into a sky full of listening stars. And waiting there, wrapped in moon-glow and feathers of night, stood the Elder DreamKeeper.`,
      scene: 'elder',
    },
    {
      text: `"Hello, ${childName}." The Elder's voice was like a blanket pulled close. "DreamKeepers watch over children while they sleep. We protect their wonder, keep their memories close, and help brave hearts rest."`,
      scene: 'elder',
    },
    {
      text: `"One child. That's all we get." The Elder's eyes were steady. "Each DreamKeeper belongs to one special child. But first, they must learn who that child is. They listen to stories. They listen to the little truths that make a person who they are."`,
      scene: 'elder',
    },
    {
      text: `The Elder looked closely at ${childName} and smiled softly. "Tonight, I heard that something made you smile: ${smileAnswer}. That light belongs to you."`,
      scene: 'glow',
    },
    {
      text: `Then the Elder lifted something glowing from the folds of the night. It was a Dream Egg — warm, bright, and humming softly, as if a tiny heart inside was already listening.`,
      scene: 'egg',
    },
    {
      text: `"Inside this egg is a baby DreamKeeper," the Elder whispered. "Read with it. Tell it about your days. Let it learn your heart. And when it knows who you are, it will hatch and know that it belongs to you."`,
      scene: 'egg',
    },
  ];
}

export default function RitualNight1({ ritual, onComplete, onCreateStory }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [eggReacted, setEggReacted] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Resolve child name
  const childName = ritual.childName || (() => {
    try {
      const keys = Object.keys(localStorage);
      const profileKey = keys.find(k => k.startsWith('sleepseed_child_profile_'));
      if (profileKey) { const p = JSON.parse(localStorage.getItem(profileKey)!); return p?.childName; }
    } catch {}
    return 'Dreamer';
  })();
  const emoji = ritual.creatureEmoji || '🌙';
  const color = ritual.creatureColor || '#F5B84C';
  const creatureName = ritual.creatureName || 'your DreamKeeper';

  // Egg reaction delay on step 3
  useEffect(() => {
    if (step === 3) {
      setEggReacted(false);
      const t = setTimeout(() => setEggReacted(true), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Card saved animation on step 8 (Night Card)
  useEffect(() => {
    if (step === 8) {
      setCardSaved(false);
      const t = setTimeout(() => setCardSaved(true), 1200);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ── Step 0: Welcome ────────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />
          <NightLabel night={1} />
          <Thread text="Your DreamKeeper is beginning to awaken…" />

          <div style={{ marginBottom: 16 }}>
            <EggDisplay state="idle" size={110} color={color} />
          </div>

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(246,197,111,.45)', letterSpacing: '1.2px', marginBottom: 6 }}>YOUR FIRST NIGHT</div>

          <div style={{ maxWidth: 300, marginBottom: 10 }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 900,
              fontSize: 'clamp(22px,5.5vw,26px)', lineHeight: 1.14, letterSpacing: '-0.5px', marginBottom: 10,
            }}>
              You're creating something<br /><em style={{ color: '#F6C56F', fontStyle: 'italic' }}>special together</em>
            </div>
            <div style={{
              fontFamily: "'Lora', serif", fontStyle: 'italic',
              fontSize: 13.5, color: 'rgba(234,242,255,.32)', lineHeight: 1.65, maxWidth: 240, margin: '0 auto',
            }}>
              Inside this egg is a DreamKeeper.<br />It needs both of your voices to begin.
            </div>
          </div>

          <RitualCTA label="Continue the Journey" subtitle="~2 minutes together" onClick={() => setStep(1)} />
        </div>
      </div>
    </div>
  );

  // ── Step 1: Lore ───────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <button className="ob-ritual-back" onClick={() => setStep(0)}>←</button>
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />

          <div style={{ animation: 'ob-fadeIn .6s ease both', marginBottom: 8 }}>
            <ElderDreamKeeper scale={0.48} animate={true} />
          </div>

          <SpeechBubble
            speaker="THE ELDER DREAMKEEPER"
            text={`"There are beings called DreamKeepers.\n\nThey don't belong to everyone.\n\nEach one chooses a single child… to watch over, learn from, and grow beside."`}
          />

          <div style={{
            fontFamily: "'Fraunces', serif", fontStyle: 'italic',
            fontSize: 14, color: 'rgba(234,242,255,.36)', lineHeight: 1.65,
            maxWidth: 280, margin: '16px auto 24px',
            animation: 'ob-fadeUp .5s .25s ease both', opacity: 0,
          }}>
            "Tonight, your journey begins."
          </div>

          <RitualCTA label="Tell me more" onClick={() => setStep(2)} />
        </div>
      </div>
    </div>
  );

  // ── Step 2: Share — "What made you smile today?" ───────────────────────────
  if (step === 2) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <button className="ob-ritual-back" onClick={() => setStep(1)}>←</button>
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />

          <div style={{
            fontFamily: "'Fraunces', serif", fontWeight: 300,
            fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 6,
          }}>
            What made you smile today?
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(246,197,111,.45)',
            letterSpacing: '.5px', marginBottom: 16,
          }}>
            THE EGG IS LISTENING
          </div>

          {/* Answer-responsive egg glow */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {answer && ANSWER_GLOWS[answer] && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 140, height: 140, borderRadius: '50%',
                background: `radial-gradient(circle, ${ANSWER_GLOWS[answer]}, transparent 70%)`,
                filter: 'blur(16px)', pointerEvents: 'none',
                animation: 'ob-glowPulse 2s ease-in-out infinite',
                transition: 'background .5s ease',
              }} />
            )}
            <EggDisplay state="idle" size={70} color={color} />
          </div>

          <ChipGrid options={SMILE_OPTIONS} selected={answer} onSelect={setAnswer} color={color} />

          <RitualCTA
            label={answer ? 'Tell the egg ✦' : 'Choose one above'}
            disabled={!answer}
            onClick={() => { if (answer) setStep(3); }}
          />
        </div>
      </div>
    </div>
  );

  // ── Step 3: Egg Responds ───────────────────────────────────────────────────
  if (step === 3) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />

          <div style={{ marginBottom: 4 }}>
            <ElderDreamKeeper scale={0.45} animate={true} />
          </div>

          <div style={{ maxWidth: 300, animation: 'ob-fadeUp .6s .3s ease-out both' }}>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 16,
            }}>
              You said <span style={{ color, fontWeight: 700 }}>{answer}</span>…
            </div>

            {eggReacted && (
              <div style={{ animation: 'ob-fadeUp .5s ease-out' }}>
                <SpeechBubble text={`Hmm… I think I know where this begins.`} />
                <div style={{ marginTop: 16 }}>
                  <RitualCTA label="Continue" onClick={() => setStep(4)} />
                </div>
              </div>
            )}

            {!eggReacted && (
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.3)', animation: 'ob-breathe 2s ease-in-out infinite',
              }}>The Elder is listening…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Story ──────────────────────────────────────────────────────────
  if (step === 4) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName, answer || 'something special')}
      title="The Night You Were Chosen"
      nightLabel="The Night You Were Chosen"
      nightNumber={1}
      emoji={emoji}
      color={color}
      onComplete={() => setStep(5)}
    />
  );

  // ── Step 5: Egg Gifted — Elder presenting egg toward reader ─────────────
  if (step === 5) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />

          <div style={{ position: 'relative', marginBottom: 10 }}>
            <ElderDreamKeeper scale={0.48} animate={true} />
            <div style={{
              position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              zIndex: 2, cursor: 'pointer',
            }} onClick={() => setStep(6)}>
              <EggDisplay state="gifted" size={50} color={color} />
            </div>
          </div>

          <SpeechBubble
            speaker="THE ELDER DREAMKEEPER"
            text={`"This egg will become your DreamKeeper. It listens to what you share — that's how it knows who it belongs to."`}
          />

          <div style={{
            padding: '8px 14px', background: 'rgba(184,161,255,.07)',
            border: '1px solid rgba(184,161,255,.18)', borderRadius: 14,
            marginBottom: 8, textAlign: 'left', width: '100%', maxWidth: 310,
          }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(184,161,255,.55)', letterSpacing: '.7px', marginBottom: 4 }}>THE EGG HEARD YOU</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(234,242,255,.65)', lineHeight: 1.5 }}>
              "You shared that {answer || 'something special'} made you smile. It's holding onto that."
            </div>
          </div>

          <RitualCTA label="Tap the egg →" onClick={() => setStep(6)} />
        </div>
      </div>
    </div>
  );

  // ── Step 6: First Crack — tappable egg ──────────────────────────────────
  if (step === 6) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />

          <SpeechBubble
            speaker="THE ELDER DREAMKEEPER"
            text={`"That crack appeared because you were here tonight. The egg heard about ${answer || 'something special'}. It's holding onto that."`}
          />

          <div onClick={() => setStep(7)} style={{
            cursor: 'pointer', marginTop: 4, marginBottom: 4,
            animation: 'ob-heartbeat 3.5s ease-in-out infinite',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <EggDisplay state="cracked" size={110} color={color} />
          </div>

          <div style={{
            width: '100%', maxWidth: 260, padding: '8px 14px',
            background: 'rgba(246,197,111,.06)', border: '1px solid rgba(246,197,111,.15)',
            borderRadius: 12, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(246,197,111,.55)', letterSpacing: '.4px' }}>DREAM EGG · NIGHT 1 OF 3</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(234,242,255,.25)' }}>Come back tomorrow</div>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '28%', background: 'linear-gradient(90deg, rgba(246,197,111,.5), #F6C56F)', borderRadius: 2 }} />
            </div>
          </div>

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: 'rgba(246,197,111,.65)', letterSpacing: '1.8px', textTransform: 'uppercase',
          }}>
            Tap the egg to continue
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 7: Photo Capture ──────────────────────────────────────────────────
  if (step === 7) {
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="ob-ritual">
        <style>{RITUAL_CSS}</style>
        <StarField />
        <div className="ob-ritual-inner">
          <div className="ob-ritual-screen">
            <MoonProgress current={0} total={3} />

            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              Capture this moment
            </div>
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 13, color: 'rgba(244,239,232,.35)', lineHeight: 1.6,
              maxWidth: 260, margin: '0 auto 24px',
            }}>
              Years from now, you'll have this.
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
            <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

            {photo ? (
              <>
                <div style={{ margin: '0 auto 8px', width: 200, height: 150, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(246,197,111,.3)', boxShadow: '0 12px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)' }}>
                  <img src={photo} alt="Tonight's photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(20,216,144,.08)', border: '1px solid rgba(20,216,144,.2)',
                  borderRadius: 50, padding: '5px 14px', marginBottom: 16,
                }}>
                  <span style={{ fontSize: 10, color: '#14d890' }}>✓</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#14d890', letterSpacing: '.04em' }}>Moment saved</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button onClick={() => cameraInputRef.current?.click()} style={{
                  padding: '14px 32px', borderRadius: 18, cursor: 'pointer',
                  border: '1.5px solid rgba(246,197,111,.3)',
                  background: 'linear-gradient(145deg, rgba(246,197,111,.12), rgba(184,161,255,.06))',
                  color: 'rgba(246,197,111,.85)', fontSize: 14, fontWeight: 600,
                  fontFamily: "'Fraunces', serif", letterSpacing: '-0.1px',
                  boxShadow: '0 4px 16px rgba(246,197,111,.1), inset 0 1px 0 rgba(255,255,255,.06)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>📷 Take a photo</button>
                <button onClick={() => uploadInputRef.current?.click()} style={{
                  background: 'none', border: 'none',
                  color: 'rgba(234,242,255,.4)', fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Nunito',system-ui,sans-serif",
                }}>or choose from photos</button>
              </div>
            )}

            <button onClick={() => setStep(8)} style={{
              background: 'none', border: 'none',
              color: 'rgba(244,239,232,.25)', fontSize: 12, cursor: 'pointer',
              fontFamily: "'Nunito',system-ui,sans-serif", marginBottom: 16,
            }}>Skip for now</button>

            {photo && <RitualCTA label="Continue" onClick={() => setStep(8)} />}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 8: Night Card ─────────────────────────────────────────────────────
  if (step === 8) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <MoonProgress current={0} total={3} />

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(20,216,144,.5)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 20,
            opacity: cardSaved ? 1 : 0, transition: 'opacity .6s ease',
          }}>Tonight's memory · saved</div>

          <MiniNightCard
            title="The Night You Were Chosen"
            quote={`${childName} said "${answer || 'something special'}" made them smile — and deep inside the egg, something stirred. A tiny glow. A first connection.`}
            emoji={emoji}
            nightNumber={1}
            color={color}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(246,197,111,.55)', lineHeight: 1.6,
            maxWidth: 260, margin: '14px auto 20px',
            opacity: cardSaved ? 1 : 0, transition: 'opacity .6s .3s ease',
          }}>
            Your first night together, remembered forever.
          </div>

          <div style={{ opacity: cardSaved ? 1 : 0, transition: 'opacity .6s .5s ease' }}>
            <RitualCTA label="Continue" onClick={() => setStep(9)} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 9: End Night — Goodnight ──────────────────────────────────────────
  return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <EggDisplay state="cracked" size={100} color={color} />

          <div style={{ marginTop: 20, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              Goodnight, {childName}
            </div>

            {/* Elder whisper box */}
            <div style={{
              background: 'rgba(184,161,255,.07)', border: '1px solid rgba(184,161,255,.15)',
              borderRadius: 16, padding: '14px 18px', marginBottom: 16,
              textAlign: 'left',
            }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(184,161,255,.45)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>THE ELDER WHISPERS</div>
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.55)', lineHeight: 1.6,
              }}>
                "Sleep well, {childName}. The egg will dream about what you shared tonight."
              </div>
            </div>

            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(244,239,232,.2)', marginBottom: 28, letterSpacing: '.03em',
            }}>
              Night 1 complete · Night 2 waits tomorrow
            </div>
          </div>

          <RitualCTA
            label="Goodnight ✦"
            subtitle="Sweet dreams"
            onClick={() => onComplete(answer || 'something special')}
          />

          {onCreateStory && (
            <button onClick={onCreateStory} style={{
              background: 'none', border: 'none',
              color: 'rgba(246,197,111,.45)', fontSize: 13, cursor: 'pointer',
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              marginTop: 16,
            }}>Want more? Create your own story</button>
          )}
        </div>
      </div>
    </div>
  );
}
