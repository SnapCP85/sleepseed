import { useState, useEffect } from 'react';
import type { RitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, ChipGrid, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';

// ─────────────────────────────────────────────────────────────────────────────
// RitualNight1 — The Arrival
// ─────────────────────────────────────────────────────────────────────────────
// 9-step sequence:
//   0. Welcome — "Your DreamKeeper is beginning to awaken…"
//   1. Lore — DreamKeepers explained
//   2. Share — "What made you smile today?"
//   3. Egg Responds — DreamKeeper reacts to answer
//   4. Story — "The Night You Were Chosen" (4 pages)
//   5. Egg Gifted — "Your first gift has arrived"
//   6. First Crack — something is happening inside
//   7. Night Card — memory of Night 1
//   8. End Night — goodnight
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  ritual: RitualState;
  onComplete: (smileAnswer: string) => void;
}

const SMILE_OPTIONS = [
  { emoji: '🎮', label: 'Playing' },
  { emoji: '🤗', label: 'A hug' },
  { emoji: '🐾', label: 'My pet' },
  { emoji: '😄', label: 'Something silly' },
  { emoji: '🌳', label: 'Being outside' },
  { emoji: '✨', label: 'Something else' },
];

function makeStoryPages(childName: string, emoji: string): StoryPage[] {
  return [
    {
      text: `Long before ${childName} was born, the DreamKeepers watched over the sleeping world. They waited in the spaces between stars — patient, quiet, listening.`,
      scene: 'stars',
    },
    {
      text: `Each DreamKeeper chooses only one child. Not the loudest, or the bravest, or the cleverest. The one whose dreams sound like music they've been waiting to hear.`,
      scene: 'elder',
    },
    {
      text: `And tonight — after all that waiting — one of them heard ${childName}. Something ${childName} said. Something small and true. And the egg began to glow.`,
      scene: 'egg',
    },
    {
      text: `This is the night it all began. The night ${childName} was chosen. And the DreamKeeper will never forget it.`,
      scene: 'glow',
    },
  ];
}

export default function RitualNight1({ ritual, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [eggReacted, setEggReacted] = useState(false);

  const childName = ritual.childName || 'friend';
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

  // ── Step 0: Welcome ────────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={0} total={3} />
          <NightLabel night={1} />
          <Thread text="Your DreamKeeper is beginning to awaken…" />

          <EggDisplay state="idle" size={120} color={color} />

          <div style={{ marginTop: 28, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3, marginBottom: 12,
            }}>
              You're creating something <span style={{ color }}>special together</span>
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.45)', lineHeight: 1.7, marginBottom: 28,
            }}>
              Inside this egg is a DreamKeeper. It needs both of your voices to begin.
            </div>
          </div>

          <RitualCTA label="Continue the Journey" subtitle="~2 minutes together" onClick={() => setStep(1)} />
        </div>
      </div>
    </div>
  );

  // ── Step 1: Lore ───────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <button className="or-back" onClick={() => setStep(0)}>←</button>
        <div className="or-screen">
          <MoonProgress current={0} total={3} />

          <div style={{ fontSize: 48, marginBottom: 20, animation: 'or-float 5s ease-in-out infinite' }}>
            {emoji}
          </div>

          <SpeechBubble text={`DreamKeepers don't belong to everyone. Each one chooses a single child — to watch over, learn from, and grow beside.`} />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.6,
            maxWidth: 280, margin: '16px auto 28px',
          }}>
            But first, they need to hear your voice.
          </div>

          <RitualCTA label="I'm ready" onClick={() => setStep(2)} />
        </div>
      </div>
    </div>
  );

  // ── Step 2: Share — "What made you smile today?" ───────────────────────────
  if (step === 2) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <button className="or-back" onClick={() => setStep(1)}>←</button>
        <div className="or-screen">
          <MoonProgress current={0} total={3} />

          <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>

          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
            fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
          }}>
            What made you smile today?
          </div>
          <div style={{
            fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.6, marginBottom: 24,
          }}>
            Tell {creatureName} — it wants to know.
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
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={0} total={3} />

          <div style={{
            transition: 'all 1.5s ease-in-out',
            transform: eggReacted ? 'scale(1.08)' : 'scale(1)',
          }}>
            <EggDisplay state="idle" size={130} color={color} />
          </div>

          <div style={{ marginTop: 20, maxWidth: 300, animation: 'or-fadeUp .6s .3s ease-out both' }}>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 12,
            }}>
              You said <span style={{ color, fontWeight: 700 }}>{answer}</span>…
            </div>

            {eggReacted && (
              <div style={{ animation: 'or-fadeUp .5s ease-out' }}>
                <SpeechBubble text={`Hmm… I think I know where this begins.`} />
                <RitualCTA label="Continue" onClick={() => setStep(4)} />
              </div>
            )}

            {!eggReacted && (
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.3)', animation: 'or-breathe 2s ease-in-out infinite',
              }}>The egg is listening…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Story ──────────────────────────────────────────────────────────
  if (step === 4) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName, emoji)}
      title="The Night You Were Chosen"
      emoji={emoji}
      color={color}
      onComplete={() => setStep(5)}
    />
  );

  // ── Step 5: Egg Gifted ─────────────────────────────────────────────────────
  if (step === 5) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={0} total={3} />

          {/* Glow backdrop */}
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 260, height: 260, borderRadius: '50%',
            background: `radial-gradient(circle, ${hexToRgba(color, .12)} 0%, transparent 70%)`,
            pointerEvents: 'none', animation: 'or-glowPulse 4s ease-in-out infinite',
          }} />

          <EggDisplay state="idle" size={140} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300, animation: 'or-slideUp .6s .3s ease-out both' }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              Your first gift has arrived
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.45)', lineHeight: 1.7, marginBottom: 28,
            }}>
              The DreamKeeper heard you. It's choosing you, {childName}. This egg is yours to protect.
            </div>
          </div>

          <RitualCTA label="I'll keep it safe" onClick={() => setStep(6)} />
        </div>
      </div>
    </div>
  );

  // ── Step 6: First Crack ────────────────────────────────────────────────────
  if (step === 6) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={0} total={3} />

          <EggDisplay state="cracked" size={130} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300, animation: 'or-fadeUp .6s .2s ease-out both' }}>
            <Thread text="Something's happening inside…" />

            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,24px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              The egg heard you, {childName}
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7, marginBottom: 24,
            }}>
              A tiny crack. The very first one. Your voice did that.
            </div>
          </div>

          <RitualCTA label="Continue" onClick={() => setStep(7)} />
        </div>
      </div>
    </div>
  );

  // ── Step 7: Night Card ─────────────────────────────────────────────────────
  if (step === 7) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={0} total={3} />

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(20,216,144,.5)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 20,
          }}>Tonight's memory · saved</div>

          <MiniNightCard
            title="The Night You Were Chosen"
            quote={`${childName} said "${answer}" — and the egg began to glow.`}
            emoji={emoji}
            nightNumber={1}
            color={color}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(244,239,232,.3)', lineHeight: 1.6,
            maxWidth: 260, margin: '20px auto 28px',
          }}>
            Every night together creates a memory worth keeping.
          </div>

          <RitualCTA label="Continue" onClick={() => setStep(8)} />
        </div>
      </div>
    </div>
  );

  // ── Step 8: End Night ──────────────────────────────────────────────────────
  return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <EggDisplay state="cracked" size={100} color={color} />

          <div style={{ marginTop: 20, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              Goodnight, {childName}
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7, marginBottom: 8,
            }}>
              Your egg will be here waiting. Come back tomorrow night — it will remember you.
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
        </div>
      </div>
    </div>
  );
}
