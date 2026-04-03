import { useState, useEffect, useRef } from 'react';
import type { RitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, ChipGrid, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';
import ElderDreamKeeper from '../onboarding/ElderDreamKeeper';

// ─────────────────────────────────────────────────────────────────────────────
// RitualNight2 — The Deepening
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
      text: `The sky above the DreamKeeper's world was darker than usual. The stars were still there — but they'd grown quieter, like they were holding their breath. Like they were waiting for someone.`,
      scene: 'stars',
    },
    {
      text: `"${childName}," said the DreamKeeper, and something in that voice was different tonight. Not worried, exactly — but careful. "I'm glad you're here. There's something I need to tell you. Something I've been thinking about since the moment I first found you."`,
      scene: 'elder',
    },
    {
      text: `"I didn't choose you by accident." The DreamKeeper's eyes glowed warm in the dark. "Every DreamKeeper watches over one child. We don't guess. We wait, and we watch, until we see something. And what I saw in you — I've never stopped seeing it."`,
      scene: 'elder',
    },
    {
      text: `"The Dreamlight keeps the dreams of every sleeping child warm. It's kept burning for a thousand years. But tonight, it's flickering." The DreamKeeper paused. "It goes out when children forget the gifts inside them. And I need someone to remind it what those gifts feel like."`,
      scene: 'dreamlight',
    },
    {
      text: `"You told me you're good at ${talent.toLowerCase()}. I know — I heard it in your heart before you even said it." The DreamKeeper smiled. "That kind of gift — real, yours, true — that's exactly what the Dreamlight needs to feel tonight. Only you can do this."`,
      scene: 'glow',
    },
    {
      text: `${childName} stood before the Dreamlight. It flickered once — waiting. Then ${childName} shared the gift. And the flame burned brighter than it had in years, stretching out across the sleeping world and finding its way into a thousand quiet dreams at once.`,
      scene: 'stars',
    },
    {
      text: `The DreamKeeper looked down. There — right at the top of the egg — was a second, new tiny crack. Glowing faintly. "It appeared while you were here tonight," said the DreamKeeper quietly. "Something inside heard you. It's starting to wake up. Come back tomorrow, ${childName}. I think it's almost ready."`,
      scene: 'eggcrack',
    },
  ];
}

export default function RitualNight2({ ritual, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [eggReacted, setEggReacted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const childName = ritual.childName || 'friend';
  const emoji = ritual.creatureEmoji || '🌙';
  const color = ritual.creatureColor || '#F5B84C';
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
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
          <MoonProgress current={1} total={3} />
          <NightLabel night={2} />
          <Thread text="Your DreamKeeper is starting to understand you…" />

          <div style={{ marginBottom: 20 }}>
            <EggDisplay state="cracked" size={110} color={color} />
          </div>

          <div style={{ maxWidth: 300, marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 900,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.14, letterSpacing: '-0.5px', marginBottom: 16,
            }}>
              It remembered you, <span style={{ color }}>{childName}</span>
            </div>

            {/* Memory callback box */}
            <div style={{
              background: 'rgba(246,197,111,.05)', border: '1px solid rgba(246,197,111,.12)',
              borderRadius: 18, padding: '12px 16px', marginBottom: 12, textAlign: 'center',
              animation: 'ob-fadeUp .5s .4s ease-out both',
            }}>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: 'rgba(246,197,111,.4)',
                letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5,
              }}>YOUR DREAMKEEPER HELD ONTO SOMETHING</div>
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(244,239,232,.55)', lineHeight: 1.55,
              }}>
                "I held onto what you shared together…<br />about <em style={{ color: '#F6C56F' }}>{smileAnswer}</em>"
              </div>
            </div>

            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 13, color: 'rgba(244,239,232,.28)', lineHeight: 1.6, marginBottom: 20,
            }}>
              "I'm starting to understand you…"
            </div>
          </div>

          <RitualCTA label="Continue the Journey" subtitle="Just a few more nights together" onClick={() => setStep(1)} />
        </div>
      </div>
    </div>
  );

  // ── Step 1: Egg Progression ────────────────────────────────────────────────
  if (step === 1) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <button className="ob-ritual-back" onClick={() => setStep(0)}>←</button>
        <div className="ob-ritual-screen" style={{ justifyContent: 'flex-start', paddingTop: 56 }}>
          <MoonProgress current={1} total={3} />

          <div style={{ marginBottom: 20 }}>
            <EggDisplay state="cracked" size={120} color={color} />
          </div>

          <div style={{ maxWidth: 300, marginBottom: 20 }}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: hexToRgba(color, .5), letterSpacing: '.04em', marginBottom: 8,
            }}>Night 2 of 3</div>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300,
              fontSize: 'clamp(18px,4.5vw,22px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              It remembers something about you
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7,
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
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <button className="ob-ritual-back" onClick={() => setStep(1)}>←</button>
        <div className="ob-ritual-screen">
          <MoonProgress current={1} total={3} />

          <div style={{
            fontFamily: "'Fraunces', serif", fontWeight: 300,
            fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 6,
          }}>
            What are you really good at?
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(246,197,111,.45)',
            letterSpacing: '.5px', marginBottom: 16,
          }}>
            THE EGG IS LISTENING
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
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen" style={{ justifyContent: 'flex-start', paddingTop: 56 }}>
          <MoonProgress current={1} total={3} />

          <div style={{
            transition: 'all 1.5s ease-in-out',
            transform: eggReacted ? 'scale(1.08)' : 'scale(1)',
            marginBottom: 16,
          }}>
            <EggDisplay state="cracked" size={110} color={color} />
          </div>

          <div style={{ maxWidth: 300 }}>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 12,
            }}>
              You said <span style={{ color, fontWeight: 700 }}>{answer}</span>…
            </div>

            {eggReacted && (
              <div style={{ animation: 'ob-fadeUp .5s ease-out' }}>
                <SpeechBubble speaker="THE ELDER DREAMKEEPER" text="That's the gift. I can feel it becoming part of the egg. It's learning who you are." />
                <RitualCTA label="Begin tonight's story →" onClick={() => setStep(4)} />
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

  // ── Step 4: Story — "The Dreamlight" ───────────────────────────────────────
  if (step === 4) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName, answer || 'something wonderful')}
      title="The Dreamlight Called Your Name"
      nightLabel="The Dreamlight Called Your Name"
      nightNumber={2}
      emoji={emoji}
      color={color}
      onComplete={() => setStep(5)}
    />
  );

  // ── Step 5: Stronger Cracks ────────────────────────────────────────────────
  if (step === 5) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen" style={{ justifyContent: 'flex-start', paddingTop: 56 }}>
          <MoonProgress current={1} total={3} />

          <div style={{ marginBottom: 16 }}>
            <EggDisplay state="hatching" size={110} color={color} />
          </div>

          <div style={{ maxWidth: 300, marginBottom: 16 }}>
            <Thread text="It's learning who you are…" />
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,24px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              The cracks are getting stronger
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.7,
            }}>
              You told it about <span style={{ color }}>{smileAnswer}</span> and about <span style={{ color }}>{answer || 'something wonderful'}</span>. It's becoming part of who your DreamKeeper will be.
            </div>
          </div>

          <RitualCTA label="Continue" onClick={() => setStep(6)} />
        </div>
      </div>
    </div>
  );

  // ── Step 6: Night Card + Photo ──────────────────────────────────────────
  if (step === 6) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(20,216,144,.5)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16,
          }}>Tonight's memory · saved</div>

          <MiniNightCard
            title="The Night of the Dreamlight"
            quote={`${childName} shared a gift — ${answer || 'something wonderful'} — and the Dreamlight burned brighter.`}
            emoji={emoji}
            nightNumber={2}
            color={color}
          />

          {/* Photo capture */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result as string); r.readAsDataURL(f); }}} />
          <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result as string); r.readAsDataURL(f); }}} />

          {photo ? (
            <div style={{ margin: '14px auto', width: 200, height: 150, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(246,197,111,.3)', boxShadow: '0 12px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)' }}>
              <img src={photo} alt="Tonight's photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, margin: '14px auto', justifyContent: 'center' }}>
              <button onClick={() => cameraInputRef.current?.click()} style={{
                padding: '12px 20px', borderRadius: 18, cursor: 'pointer',
                border: '1.5px solid rgba(246,197,111,.3)',
                background: 'linear-gradient(145deg, rgba(246,197,111,.12), rgba(184,161,255,.06))',
                color: 'rgba(246,197,111,.85)', fontSize: 13, fontWeight: 600,
                fontFamily: "'Fraunces', serif", letterSpacing: '-0.1px',
                boxShadow: '0 4px 16px rgba(246,197,111,.1), inset 0 1px 0 rgba(255,255,255,.06)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>📷 Take a photo</button>
              <button onClick={() => uploadInputRef.current?.click()} style={{
                padding: '12px 20px', borderRadius: 18, cursor: 'pointer',
                border: '1.5px solid rgba(184,161,255,.2)',
                background: 'linear-gradient(145deg, rgba(184,161,255,.08), rgba(6,9,18,.9))',
                color: 'rgba(234,242,255,.55)', fontSize: 13, fontWeight: 600,
                fontFamily: "'Fraunces', serif", letterSpacing: '-0.1px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>📁 Upload</button>
            </div>
          )}

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(246,197,111,.55)', lineHeight: 1.6,
            maxWidth: 260, margin: '4px auto 16px',
          }}>
            Every night together creates a memory worth keeping.
          </div>

          <RitualCTA label="Continue" onClick={() => setStep(7)} />
        </div>
      </div>
    </div>
  );

  // ── Step 7: Goodnight ─────────────────────────────────────────────────────
  return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <EggDisplay state="hatching" size={100} color={color} />

          <div style={{ marginTop: 20, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3, marginBottom: 8,
            }}>
              Goodnight, {childName}
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(246,197,111,.55)', lineHeight: 1.7, marginBottom: 4,
            }}>
              Your egg is almost ready. Come back tomorrow night.
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: 'rgba(255,130,184,.4)', marginBottom: 20, letterSpacing: '.03em',
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
