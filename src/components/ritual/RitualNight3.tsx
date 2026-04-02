import { useState, useEffect, useRef } from 'react';
import type { RitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';

// ─────────────────────────────────────────────────────────────────────────────
// RitualNight3 — The Hatching
// ─────────────────────────────────────────────────────────────────────────────
// 5-step sequence:
//   0. Tonight Is Different — urgency, egg shaking
//   1. Pre-Hatch Story — "The Bond" (4 pages)
//   2. Cinematic Hatch Sequence — multi-phase animation
//   3. First Contact — DreamKeeper speaks
//   4. Born Card — memory + completion
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  ritual: RitualState;
  onComplete: () => void;
}

// ── Hatch sequence CSS (only loaded for step 2) ─────────────────────────────

const HATCH_CSS = `
@keyframes hatch-heartbeat{0%,100%{transform:scale(1)}25%{transform:scale(1.06)}50%{transform:scale(.98)}75%{transform:scale(1.03)}}
@keyframes hatch-bloom{0%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(2)}}
@keyframes hatch-creatureIn{from{opacity:0;transform:translateY(20px) scale(.8)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes hatch-textIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes hatch-lookAround{0%{transform:rotate(0) translateX(0)}25%{transform:rotate(-8deg) translateX(-6px)}50%{transform:rotate(0) translateX(0)}75%{transform:rotate(8deg) translateX(6px)}100%{transform:rotate(0) translateX(0)}}
@keyframes hatch-blink{0%,42%,46%,100%{transform:scaleY(1)}44%{transform:scaleY(.1)}}
@keyframes hatch-particle{0%{opacity:0;transform:translateY(0) scale(0)}20%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-80px) scale(.5)}}
`;

function makeStoryPages(childName: string): StoryPage[] {
  return [
    {
      text: `Every DreamKeeper watches over one child. They don't choose by accident. They listen, for as long as it takes, until they hear the one voice that was meant for them.`,
      scene: 'stars',
    },
    {
      text: `"What I saw in you — I've never stopped seeing it. From the very first night, I knew."`,
      scene: 'elder',
    },
    {
      text: `A DreamKeeper carries your memories. It grows alongside you. It will know who you are becoming before you know it yourself.`,
      scene: 'glow',
    },
    {
      text: `This bond — once made — cannot be undone. One day, ${childName}, you will look at it and see pieces of your whole childhood looking back at you.`,
      scene: 'egg',
    },
  ];
}

// ── Hatch Sequence Component ────────────────────────────────────────────────

function HatchSequence({ emoji, color, childName, onComplete }: {
  emoji: string; color: string; childName: string; onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Multi-phase timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Phase 0: Heartbeat (0-2s)
    // Phase 1: Glow intensifies (2s)
    timers.push(setTimeout(() => setPhase(1), 2000));
    // Phase 2: Maximum glow (4s)
    timers.push(setTimeout(() => setPhase(2), 4000));
    // Phase 3: Bloom flash + particles (5.5s)
    timers.push(setTimeout(() => setPhase(3), 5500));
    // Phase 4: Creature emerges (7s)
    timers.push(setTimeout(() => setPhase(4), 7000));
    // Phase 5: First words (9s)
    timers.push(setTimeout(() => setPhase(5), 9000));
    // Phase 6: Full reveal + CTA (11.5s)
    timers.push(setTimeout(() => setPhase(6), 11500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Canvas particle burst on phase 3
  useEffect(() => {
    if (phase !== 3 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const cx = w / 2;
    const cy = h * 0.4;

    interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }
    const particles: Particle[] = [];

    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      const isPink = Math.random() < 0.4;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5,
        life: 0, maxLife: 40 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: isPink ? '#ff82b8' : color,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // gravity
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (alive > 0) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [phase, color]);

  const eggBrightness = phase === 0 ? 1 : phase === 1 ? 1.4 : phase === 2 ? 1.8 : 0;
  const eggShadow = phase === 0 ? 20 : phase === 1 ? 40 : phase === 2 ? 60 : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1002,
      background: '#040610', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{HATCH_CSS}</style>

      {/* Stars */}
      <StarField />

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Bloom flash */}
      {phase >= 3 && phase < 5 && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${hexToRgba(color, .6)} 0%, rgba(255,255,255,.15) 30%, transparent 70%)`,
          animation: 'hatch-bloom 2s ease-out forwards',
          zIndex: 8, pointerEvents: 'none',
        }} />
      )}

      {/* Egg (visible in phases 0-2) */}
      {phase < 4 && (
        <div style={{
          position: 'relative', zIndex: 5,
          animation: phase < 3 ? 'hatch-heartbeat 1.6s ease-in-out infinite' : undefined,
          opacity: phase >= 3 ? 0 : 1,
          transition: 'opacity 1s ease-out',
          filter: `brightness(${eggBrightness}) drop-shadow(0 0 ${eggShadow}px ${hexToRgba(color, .5)})`,
        }}>
          <EggDisplay state="hatching" size={140} color={color} />
        </div>
      )}

      {/* Creature (visible from phase 4) */}
      {phase >= 4 && (
        <div style={{
          position: 'relative', zIndex: 15,
          fontSize: 100, lineHeight: 1,
          animation: phase === 4
            ? 'hatch-creatureIn 1.5s ease-out forwards'
            : phase === 5
              ? 'hatch-lookAround 3.5s ease-in-out'
              : 'or-float 4s ease-in-out infinite',
          filter: phase === 4
            ? `brightness(0.5) drop-shadow(0 0 20px ${hexToRgba(color, .3)})`
            : `brightness(1) drop-shadow(0 0 24px ${hexToRgba(color, .4)})`,
          transition: 'filter 2s ease-out',
        }}>
          <div style={{ animation: phase >= 6 ? 'hatch-blink 4s 2s ease-in-out infinite' : undefined }}>
            {emoji}
          </div>
        </div>
      )}

      {/* Text */}
      <div style={{
        position: 'absolute', bottom: 110, left: 0, right: 0,
        textAlign: 'center', padding: '0 32px', zIndex: 20,
      }}>
        {phase >= 5 && phase < 6 && (
          <div style={{ animation: 'hatch-textIn .8s ease-out' }}>
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 18, color: 'rgba(244,239,232,.7)', lineHeight: 1.6,
            }}>
              "Hi, {childName}…"
            </div>
          </div>
        )}

        {phase >= 6 && (
          <div style={{ animation: 'hatch-textIn .8s ease-out' }}>
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 18, color: 'rgba(244,239,232,.7)', lineHeight: 1.6, marginBottom: 4,
            }}>
              "I've been waiting for you."
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: hexToRgba(color, .5), letterSpacing: '.06em', textTransform: 'uppercase',
              marginBottom: 24,
            }}>
              {/* creature name will show here once we have it */}
            </div>
            <RitualCTA label="Meet your DreamKeeper ✦" onClick={onComplete} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RitualNight3({ ritual, onComplete }: Props) {
  const [step, setStep] = useState(0);

  const childName = ritual.childName || 'friend';
  const emoji = ritual.creatureEmoji || '🌙';
  const color = ritual.creatureColor || '#F5B84C';
  const creatureName = ritual.creatureName || 'your DreamKeeper';
  const smileAnswer = ritual.smileAnswer || 'something special';
  const talentAnswer = ritual.talentAnswer || 'something wonderful';

  // ── Step 0: Tonight Is Different ───────────────────────────────────────────
  if (step === 0) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={2} total={3} />
          <NightLabel night={3} color="rgba(255,130,184,.5)" />
          <Thread text="Your DreamKeeper is trying to reach you…" />

          <EggDisplay state="hatching" size={130} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3, marginBottom: 12,
            }}>
              It can't stay inside much <span style={{ color: '#ff82b8' }}>longer</span>
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(244,239,232,.45)', lineHeight: 1.7, marginBottom: 8,
            }}>
              Three nights of listening. Three nights of growing. Tonight, it becomes yours.
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,.06)',
              marginBottom: 24, overflow: 'hidden',
            }}>
              <div style={{
                width: '94%', height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #F5B84C, #ff82b8)',
                transition: 'width .8s ease-out',
              }} />
            </div>
          </div>

          <RitualCTA
            label="Help it hatch together"
            subtitle="Tonight everything changes"
            variant="pink"
            onClick={() => setStep(1)}
          />
        </div>
      </div>
    </div>
  );

  // ── Step 1: Pre-Hatch Story ────────────────────────────────────────────────
  if (step === 1) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName)}
      title="The Bond"
      emoji={emoji}
      color={color}
      onComplete={() => setStep(2)}
    />
  );

  // ── Step 2: Cinematic Hatch Sequence ───────────────────────────────────────
  if (step === 2) return (
    <HatchSequence
      emoji={emoji}
      color={color}
      childName={childName}
      onComplete={() => setStep(3)}
    />
  );

  // ── Step 3: First Contact ──────────────────────────────────────────────────
  if (step === 3) return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen" style={{ animation: 'or-fadeUp .8s ease-out' }}>
          {/* Creature */}
          <div style={{
            fontSize: 100, lineHeight: 1, marginBottom: 12,
            animation: 'or-float 4s ease-in-out infinite',
            filter: `drop-shadow(0 0 30px ${hexToRgba(color, .35)})`,
          }}>{emoji}</div>

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: hexToRgba(color, .6), letterSpacing: '.1em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>{creatureName}</div>

          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
            fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3, marginBottom: 20,
          }}>
            You brought your DreamKeeper to <span style={{ color }}>life</span>
          </div>

          <SpeechBubble
            speaker={creatureName}
            text={`I chose you, ${childName}. I will be your DreamKeeper and always be by your side.`}
            color={hexToRgba(color, .5)}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 13, color: 'rgba(244,239,232,.4)', lineHeight: 1.6,
            maxWidth: 280, margin: '8px auto 12px',
          }}>
            "You told me about {smileAnswer} that made you smile… and that you're good at {talentAnswer}. I held onto all of it."
          </div>

          <div style={{ marginTop: 16 }}>
            <RitualCTA label="Continue" onClick={() => setStep(4)} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Born Card + Completion ─────────────────────────────────────────
  return (
    <div className="or">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="or-inner">
        <div className="or-screen">
          <MoonProgress current={3} total={3} />

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(20,216,144,.08)', border: '1px solid rgba(20,216,144,.2)',
            borderRadius: 50, padding: '6px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 10, color: '#14d890' }}>✓</span>
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#14d890',
              letterSpacing: '.04em',
            }}>Night 3 complete</span>
          </div>

          <MiniNightCard
            title="The Night Your DreamKeeper Was Born"
            quote={`After three nights of listening, ${creatureName} chose to become ${childName}'s.`}
            emoji={emoji}
            nightNumber={3}
            color={color}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(244,239,232,.35)', lineHeight: 1.6,
            maxWidth: 260, margin: '16px auto 4px',
          }}>
            "Your DreamKeeper chose you both."
          </div>

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: 'rgba(244,239,232,.2)', marginBottom: 28, letterSpacing: '.03em',
          }}>
            Three nights. One creature. Yours forever.
          </div>

          <RitualCTA
            label="Begin your journey together ✦"
            onClick={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
