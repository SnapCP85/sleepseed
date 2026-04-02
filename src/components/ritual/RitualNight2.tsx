import { useState, useEffect } from 'react';
import type { RitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, ChipGrid, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';

// ─────────────────────────────────────────────────────────────────────────────
// RitualNight2 — The Deepening
// ─────────────────────────────────────────────────────────────────────────────
// 7-step sequence:
//   0. Return — Memory callback ("You told me…")
//   1. Egg Progression — visual check-in
//   2. Question — "What are you really good at?"
//   3. Egg Responds — DreamKeeper reacts to answer
//   4. Story — "The Dreamlight" (5 pages)
//   5. Stronger Cracks — egg is learning
//   6. Night Card + End Night
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  ritual: RitualState;
  onComplete: (talentAnswer: string) => void;
}

const TALENT_OPTIONS = [
  { emoji: '🎨', label: 'Making things' },
  { emoji: '💛', label: 'Helping others' },
  { emoji: '🏃', label: 'Running fast' },
  { emoji: '🤝', label: 'Being kind' },
  { emoji: '😂', label: 'Making people laugh' },
  { emoji: '✨', label: 'Something wonderful' },
];

function makeStoryPages(childName: string, talent: string): StoryPage[] {
  return [
    {
      text: `Deep beneath the dreaming world, there's a light. Not a candle, not a star — something older. They call it the Dreamlight.`,
      scene: 'dreamlight',
    },
    {
      text: `It keeps the dreams of every sleeping child warm. It's been burning for a thousand years. But tonight, it's flickering.`,
      scene: 'glow',
    },
    {
      text: `The Dreamlight goes out when children forget the gifts inside them. The things that make them who they are. The things only they can do.`,
      scene: 'stars',
    },
    {
      text: `But ${childName} hasn't forgotten. ${childName} knows about ${talent.toLowerCase()}. And that gift — that light — is exactly what the Dreamlight needs.`,
      scene: 'dreamlight',
    },
    {
      text: `${childName} stood before the Dreamlight and shared the gift. And the flame burned brighter than it had in years. Something inside the egg heard — and began to wake up.`,
      scene: 'egg',
    },
  ];
}

export default function RitualNight2({ ritual, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [eggReacted, setEggReacted] = useState(false);

  const childName = ritual.childName || 'friend';
  const emoji = ritual.creatureEmoji || '🌙';
  const color = ritual.creatureColor || '#F5B84C';
  const creatureName = ritual.creatureName || 'your DreamKeeper';
  const smileAnswer = ritual.smileAnswer || 'something special';

  // Egg reaction delay
  useEffect(() => {
    if (step === 3) {
      setEggReacted(false);
      const t = setTimeout(() => setEggReacted(true), 1800);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ── Step 0: Return — Memory Callback ───────────────────────────────────────
  if (step === 0) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={1} total={3} />
          <NightLabel night={2} />
          <Thread text="Your DreamKeeper is starting to understand you…" />

          <EggDisplay state="cracked" size={120} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 16,
            }}>
              It remembered you, <span style={{ color }}>{childName}</span>
            </div>

            {/* Memory callback box */}
            <div style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 16, padding: '16px 18px', marginBottom: 16, textAlign: 'left',
              animation: 'or-fadeUp .5s .4s ease-out both',
            }}>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(244,239,232,.3)',
                letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8,
              }}>Your DreamKeeper held onto something</div>
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.6)', lineHeight: 1.6,
              }}>
                "I held onto what you shared together… about <span style={{ color }}>{smileAnswer}</span>"
              </div>
            </div>

            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 13, color: 'rgba(244,239,232,.35)', lineHeight: 1.6, marginBottom: 28,
            }}>
              "The more you share, the more I understand who you are."
            </div>
          </div>

          <RitualCTA label="Continue the Journey" subtitle="Just a few more nights together" onClick={() => setStep(1)} />
        </div>
      </div>
    </div>
  );

  // ── Step 1: Egg Progression ────────────────────────────────────────────────
  if (step === 1) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <button className="or-back" onClick={() => setStep(0)}>←</button>
        <div className="or-screen">
          <MoonProgress current={1} total={3} />

          <EggDisplay state="cracked" size={140} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: hexToRgba(color, .5), letterSpacing: '.04em', marginBottom: 8,
            }}>Night 2 of 3</div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(18px,4.5vw,22px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              It remembers something about you
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7, marginBottom: 28,
            }}>
              The cracks are spreading. The glow is getting stronger. It's growing because of the time you've spent together.
            </div>
          </div>

          <RitualCTA label="Continue" onClick={() => setStep(2)} />
        </div>
      </div>
    </div>
  );

  // ── Step 2: Question — "What are you really good at?" ──────────────────────
  if (step === 2) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <button className="or-back" onClick={() => setStep(1)}>←</button>
        <div className="or-screen">
          <MoonProgress current={1} total={3} />

          <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>

          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
            fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
          }}>
            What's something you're really good at?
          </div>
          <div style={{
            fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.6, marginBottom: 24,
          }}>
            {creatureName} wants to learn more about you.
          </div>

          <ChipGrid options={TALENT_OPTIONS} selected={answer} onSelect={setAnswer} color={color} />

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
          <MoonProgress current={1} total={3} />

          <div style={{
            transition: 'all 1.5s ease-in-out',
            transform: eggReacted ? 'scale(1.08)' : 'scale(1)',
          }}>
            <EggDisplay state="cracked" size={130} color={color} />
          </div>

          <div style={{ marginTop: 20, maxWidth: 300, animation: 'or-fadeUp .6s .3s ease-out both' }}>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 12,
            }}>
              You said <span style={{ color, fontWeight: 700 }}>{answer}</span>…
            </div>

            {eggReacted && (
              <div style={{ animation: 'or-fadeUp .5s ease-out' }}>
                <SpeechBubble text="That's the gift. I can feel it becoming part of me." />
                <RitualCTA label="Continue" onClick={() => setStep(4)} />
              </div>
            )}

            {!eggReacted && (
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.3)', animation: 'or-breathe 2s ease-in-out infinite',
              }}>The egg is absorbing that…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Story — "The Dreamlight" ───────────────────────────────────────
  if (step === 4) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName, answer || 'something wonderful')}
      title="The Dreamlight"
      emoji={emoji}
      color={color}
      onComplete={() => setStep(5)}
    />
  );

  // ── Step 5: Stronger Cracks ────────────────────────────────────────────────
  if (step === 5) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={1} total={3} />

          <EggDisplay state="hatching" size={130} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300, animation: 'or-fadeUp .6s .2s ease-out both' }}>
            <Thread text="It's learning who you are…" />
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,24px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              The cracks are getting stronger
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7, marginBottom: 8,
            }}>
              You told it about <span style={{ color }}>{smileAnswer}</span> and about <span style={{ color }}>{answer || 'something wonderful'}</span>. It's becoming part of who your DreamKeeper will be.
            </div>
          </div>

          <RitualCTA label="Continue" onClick={() => setStep(6)} />
        </div>
      </div>
    </div>
  );

  // ── Step 6: Night Card + End ───────────────────────────────────────────────
  return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(20,216,144,.5)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 20,
          }}>Tonight's memory · saved</div>

          <MiniNightCard
            title="The Night of the Dreamlight"
            quote={`${childName} shared a gift — ${answer || 'something wonderful'} — and the Dreamlight burned brighter.`}
            emoji={emoji}
            nightNumber={2}
            color={color}
          />

          <div style={{ marginTop: 20, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(18px,4.5vw,22px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              Goodnight, {childName}
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7, marginBottom: 4,
            }}>
              Your egg is almost ready. Come back tomorrow night.
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(255,130,184,.4)', marginBottom: 28, letterSpacing: '.03em',
            }}>
              Tomorrow night, everything changes.
            </div>
          </div>

          <RitualCTA
            label="Goodnight ✦"
            subtitle="Night 2 complete"
            onClick={() => onComplete(answer || 'something wonderful')}
          />
        </div>
      </div>
    </div>
  );
}
