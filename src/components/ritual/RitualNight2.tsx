import { useState, useEffect, useRef } from 'react';
import type { RitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, ChipGrid, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';
import ElderDreamKeeper from '../onboarding/ElderDreamKeeper';

// ─────────────────────────────────────────────────────────────────────────────
// RitualNight2 — The Night the Egg Remembered
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  ritual: RitualState;
  onComplete: (talentAnswer: string) => void;
  onCreateStory?: () => void;
}

const TALENT_OPTIONS = [
  { emoji: '🎨', label: 'Making things' },
  { emoji: '💛', label: 'Caring for others' },
  { emoji: '💪', label: 'Being brave' },
  { emoji: '🤝', label: 'Being kind' },
  { emoji: '😂', label: 'Making people laugh' },
  { emoji: '✨', label: 'Something only I can do' },
];

function makeStoryPages(childName: string, talent: string): StoryPage[] {
  return [
    {
      text: `The sky above the DreamKeeper's world was darker than usual. The stars were still there — but they'd grown quieter, like they were holding their breath. Like they were waiting for someone.`,
      scene: 'moonlit',
    },
    {
      text: `"${childName}," said the Elder, and something in that voice was different tonight. Not worried, exactly — but careful. "I'm glad you're here. The egg remembered you. The moment you came close, it started glowing."`,
      scene: 'elder',
    },
    {
      text: `"I didn't choose you by accident." The Elder's eyes glowed warm in the dark. "Every DreamKeeper watches over one child. We don't guess. We wait, and we watch, until we see something. And what I saw in you — I've never stopped seeing it."`,
      scene: 'warmth',
    },
    {
      text: `The Elder held the egg gently. It pulsed with warmth — not the cold glow of starlight, but something deeper. Something that came from being held, from being spoken to, from being remembered.`,
      scene: 'egg',
    },
    {
      text: `"You told me you're good at ${talent.toLowerCase()}. I know — I heard it in your heart before you even said it." The Elder smiled. "That kind of gift — real, yours, true — that's exactly what the egg needed to hear tonight."`,
      scene: 'glow',
    },
    {
      text: `${childName} held the egg close. It was warmer now. Heavier. As if everything shared had become part of it — settled in, held tight, kept safe. The egg remembered. And the egg held on tighter.`,
      scene: 'warmth',
    },
    {
      text: `The Elder looked down. There — right at the top of the egg — was a second, new tiny crack. Glowing faintly. "It appeared while you were here tonight," said the Elder quietly. "Something inside heard you. It's starting to wake up. Come back tomorrow, ${childName}."`,
      scene: 'eggcrack',
    },
  ];
}

export default function RitualNight2({ ritual, onComplete, onCreateStory }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [eggReacted, setEggReacted] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

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
  const smileAnswer = ritual.smileAnswer || 'something special';

  // Egg reaction delay
  useEffect(() => {
    if (step === 3) {
      setEggReacted(false);
      const t = setTimeout(() => setEggReacted(true), 1800);
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

  // ── Heartbeat sound for anticipation step ──────────────────────────────────
  useEffect(() => {
    if (step !== 6) return;
    let ctx: AudioContext | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    try {
      ctx = new AudioContext();
      const playBeat = () => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65, ctx.currentTime + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.33);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.18);
        osc2.stop(ctx.currentTime + 0.5);
      };
      const t = setTimeout(() => {
        playBeat();
        intervalId = setInterval(playBeat, 2000);
      }, 800);
      return () => {
        clearTimeout(t);
        if (intervalId) clearInterval(intervalId);
        ctx?.close();
      };
    } catch {
      return () => { ctx?.close(); };
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
                "I held onto what you shared with me…<br />about <em style={{ color: '#F6C56F' }}>{smileAnswer}</em>"
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

  // ── Step 2: Question — "What makes you, you?" ─────────────────────────────
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
            What makes you, you?
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

  // ── Step 4: Story — "The Night the Egg Remembered" ─────────────────────────
  if (step === 4) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName, answer || 'something wonderful')}
      title="The Night the Egg Remembered"
      nightLabel="The Night the Egg Remembered"
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

  // ── Step 6: Anticipation Beat ──────────────────────────────────────────────
  if (step === 6) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            animation: 'ob-heartbeat 2s ease-in-out infinite',
            marginBottom: 24,
          }}>
            <EggDisplay state="hatching" size={130} color={color} />
          </div>

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 16, color: 'rgba(244,239,232,.65)', lineHeight: 1.6,
            maxWidth: 280, textAlign: 'center', marginBottom: 32,
            animation: 'ob-fadeUp .8s .5s ease-out both',
          }}>
            Can you hear it? Something inside is pressing against the shell...
          </div>

          <div style={{ animation: 'ob-fadeUp .8s 1.5s ease-out both', opacity: 0 }}>
            <RitualCTA label="Continue" onClick={() => setStep(7)} />
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
            <MoonProgress current={1} total={3} />

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
                <div style={{ margin: '0 auto 8px', width: 200, height: 150, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(246,197,111,.3)', boxShadow: '0 12px 32px rgba(0,0,0,.5)' }}>
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
                  fontFamily: "'Fraunces', serif",
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
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(20,216,144,.5)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16,
            opacity: cardSaved ? 1 : 0, transition: 'opacity .6s ease',
          }}>Tonight's memory · saved</div>

          <MiniNightCard
            title="The Night the Egg Remembered"
            quote={`${childName} shared something true — ${answer || 'something wonderful'}. The egg pulsed with warmth. A second crack appeared, glowing like a tiny river of gold.`}
            emoji={emoji}
            nightNumber={2}
            color={color}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(246,197,111,.55)', lineHeight: 1.6,
            maxWidth: 260, margin: '14px auto 16px',
            opacity: cardSaved ? 1 : 0, transition: 'opacity .6s .3s ease',
          }}>
            The egg is almost ready. One more night.
          </div>

          <div style={{ opacity: cardSaved ? 1 : 0, transition: 'opacity .6s .5s ease' }}>
            <RitualCTA label="Continue" onClick={() => setStep(9)} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 9: Goodnight ─────────────────────────────────────────────────────
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
                "Can you hear it? It's almost ready to meet you. One more night…"
              </div>
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
