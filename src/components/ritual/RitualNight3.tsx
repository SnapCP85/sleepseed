import { useState, useEffect, useRef } from 'react';
import type { RitualState } from '../../lib/ritualState';
import { saveRitualState } from '../../lib/ritualState';
import {
  RITUAL_CSS, StarField, MoonProgress, NightLabel, Thread,
  EggDisplay, RitualCTA, SpeechBubble, MiniNightCard, hexToRgba,
} from './RitualShared';
import RitualStoryViewer, { type StoryPage } from './RitualStoryViewer';
import ElderDreamKeeper from '../onboarding/ElderDreamKeeper';
import CreatureImage from '../onboarding/CreatureImage';
import { V1_DREAMKEEPERS } from '../../lib/dreamkeepers';

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
  userId: string;
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
      text: `"${childName}," the Elder DreamKeeper said quietly. Not like a beginning. Like a continuation. "I need to tell you something true before tonight ends."`,
      scene: 'elder',
    },
    {
      text: `"In all the world, there are very few DreamKeepers. They do not choose just anyone. They watch. They listen. They wait until they find a child whose heart is worth growing beside — for the rest of their life."`,
      scene: 'stars',
    },
    {
      text: `"What makes a DreamKeeper choose someone?" The Elder smiled. "Not how brave they are. Not how loud. It chooses someone whose inner world is worth living inside. Someone whose stories matter." The Elder looked at ${childName}. "That is why it chose you."`,
      scene: 'elder',
    },
    {
      text: `"A DreamKeeper does not just protect your sleep. It carries your memories. It grows alongside you. It will know who you are becoming before you know it yourself. This bond — once made — cannot be undone."`,
      scene: 'glow',
    },
    {
      text: `"Every night you come back, it learns something more. Every story you share becomes part of it. One day — many years from now — you will look at it and see pieces of your whole childhood looking back at you."`,
      scene: 'stars',
    },
    {
      text: `The Elder reached out and held the egg very gently. The cracks glowed — warm, impatient, almost there. "Tonight, it hatches. And the moment it does — you will have a DreamKeeper. One that is entirely, permanently yours."`,
      scene: 'elder',
    },
    {
      text: `"Are you ready, ${childName}?" The egg shook softly in the Elder's hands. Something inside pushed at the shell. A tiny heartbeat. Then a sound — the faintest sound — like a creature taking its very first breath.`,
      scene: 'glow',
    },
  ];
}

// ── Hatch Sequence Component — Grand Finale ─────────────────────────────────

function HatchSequence({ emoji, color, childName, creatureImageSrc, creatureName, onComplete }: {
  emoji: string; color: string; childName: string; creatureImageSrc: string; creatureName: string; onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Multi-phase timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 2000));   // Glow intensifies
    timers.push(setTimeout(() => setPhase(2), 4000));   // Maximum glow
    timers.push(setTimeout(() => setPhase(3), 5500));   // BLOOM FLASH
    timers.push(setTimeout(() => setPhase(4), 7000));   // Creature silhouette
    timers.push(setTimeout(() => setPhase(5), 9000));   // First words + fireworks
    timers.push(setTimeout(() => setPhase(6), 12000));  // Full reveal + CTA
    return () => timers.forEach(clearTimeout);
  }, []);

  // Canvas — fireworks celebration from phase 3 onward
  useEffect(() => {
    if (phase < 3 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const cx = w / 2;
    const cy = h * 0.38;

    interface Spark { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; trail: {x:number;y:number}[] }
    const sparks: Spark[] = [];
    let frame = 0;

    const colors = [color, '#ff82b8', '#F6C56F', '#B8A1FF', '#6FE7DD', '#FFE090', '#fff'];

    function burst(bx: number, by: number, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 1.2 + Math.random() * 3.5;
        sparks.push({
          x: bx, y: by,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.8,
          life: 0, maxLife: 50 + Math.random() * 40,
          size: 1.5 + Math.random() * 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          trail: [],
        });
      }
    }

    // Initial burst from center
    burst(cx, cy, 60);

    let animId: number;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Spawn new bursts periodically (fireworks effect)
      if (frame % 35 === 0 && phase >= 5) {
        const bx = w * 0.2 + Math.random() * w * 0.6;
        const by = h * 0.15 + Math.random() * h * 0.35;
        burst(bx, by, 25 + Math.floor(Math.random() * 20));
      }

      let alive = 0;
      for (const s of sparks) {
        s.life++;
        if (s.life > s.maxLife) continue;
        alive++;
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 6) s.trail.shift();
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.03;
        s.vx *= 0.99;
        const alpha = 1 - s.life / s.maxLife;

        // Draw trail
        for (let t = 0; t < s.trail.length; t++) {
          const ta = alpha * (t / s.trail.length) * 0.4;
          ctx.beginPath();
          ctx.arc(s.trail[t].x, s.trail[t].y, s.size * 0.5 * ta, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = ta;
          ctx.fill();
        }

        // Draw spark
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = s.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (alive > 0 || phase >= 5) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [phase, color]);

  const eggBrightness = phase === 0 ? 1 : phase === 1 ? 1.4 : phase === 2 ? 1.8 : 0;
  const eggShadow = phase === 0 ? 20 : phase === 1 ? 40 : phase === 2 ? 60 : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1002,
      background: '#030408', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{HATCH_CSS}</style>

      <StarField />

      {/* Fireworks canvas — runs from phase 3 onward */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Expanding light rings on bloom */}
      {phase >= 3 && phase < 6 && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', top: '38%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 20, height: 20, borderRadius: '50%',
          border: `2px solid ${hexToRgba(color, .5 - i * .15)}`,
          animation: `hatch-bloom ${2 + i * 0.6}s ${i * 0.4}s ease-out infinite`,
          zIndex: 7, pointerEvents: 'none',
        }} />
      ))}

      {/* Bloom flash */}
      {phase >= 3 && phase < 5 && (
        <div style={{
          position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,248,220,.7) 0%, ${hexToRgba(color, .4)} 25%, rgba(255,255,255,.08) 50%, transparent 70%)`,
          animation: 'hatch-bloom 2.5s ease-out forwards',
          zIndex: 8, pointerEvents: 'none',
        }} />
      )}

      {/* Egg (visible in phases 0-3) */}
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

      {/* Creature PNG — BIG reveal */}
      {phase >= 4 && (
        <div style={{
          position: 'relative', zIndex: 15,
          animation: phase === 4
            ? 'hatch-creatureIn 2s ease-out forwards'
            : phase === 5
              ? 'hatch-lookAround 3s ease-in-out'
              : 'ob-elderFloat 4s ease-in-out infinite',
          filter: phase === 4
            ? `brightness(0.3) blur(2px) drop-shadow(0 0 40px ${hexToRgba(color, .8)})`
            : `brightness(1) drop-shadow(0 0 32px ${hexToRgba(color, .5)})`,
          transition: 'filter 2.5s ease-out',
        }}>
          {/* Celebration glow behind creature */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 280, height: 280, borderRadius: '50%',
            background: `radial-gradient(circle, ${hexToRgba(color, .25)} 0%, rgba(184,161,255,.1) 40%, transparent 70%)`,
            filter: 'blur(20px)', pointerEvents: 'none',
            animation: 'ob-glowPulse 2s ease-in-out infinite',
          }} />
          <CreatureImage src={creatureImageSrc} size={180} color={color} animate={false} glowIntensity={phase >= 5 ? 0.8 : 0.4} />
        </div>
      )}

      {/* Text */}
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0,
        textAlign: 'center', padding: '0 32px', zIndex: 20,
      }}>
        {phase >= 5 && phase < 6 && (
          <div style={{ animation: 'hatch-textIn 1s ease-out' }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300, fontStyle: 'italic',
              fontSize: 24, color: 'rgba(244,239,232,.85)', lineHeight: 1.4,
              textShadow: '0 0 40px rgba(246,197,111,.3)',
            }}>
              "Hi, {childName}…"
            </div>
          </div>
        )}

        {phase >= 6 && (
          <div style={{ animation: 'hatch-textIn 1s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 300, fontStyle: 'italic',
              fontSize: 22, color: 'rgba(244,239,232,.85)', lineHeight: 1.4, marginBottom: 6,
              textShadow: '0 0 40px rgba(246,197,111,.3)',
            }}>
              "I've been waiting for you."
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 11,
              color: hexToRgba(color, .65), letterSpacing: '.1em', textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              {creatureName}
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

export default function RitualNight3({ ritual, userId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
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
  const creatureName = ritual.creatureName || 'your DreamKeeper';
  const smileAnswer = ritual.smileAnswer || 'something special';
  const talentAnswer = ritual.talentAnswer || 'something wonderful';

  // Resolve creature PNG image from emoji
  const creatureMatch = V1_DREAMKEEPERS.find(dk => dk.emoji === emoji);
  const creatureImageSrc = creatureMatch?.imageSrc || '/dreamkeepers/transparent/bunny.png';

  // ── Step 0: Tonight Is Different ───────────────────────────────────────────
  if (step === 0) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <MoonProgress current={2} total={3} />
          <NightLabel night={3} color="rgba(255,130,184,.5)" />
          <Thread text="Your DreamKeeper is trying to reach you…" color="rgba(244,239,232,.85)" />

          <EggDisplay state="hatching" size={130} color={color} />

          <div style={{ marginTop: 24, maxWidth: 300 }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3, marginBottom: 12,
            }}>
              It can't stay inside much <span style={{ color: '#ff82b8' }}>longer</span>
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(246,197,111,.55)', lineHeight: 1.7, marginBottom: 8,
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
            variant="pink"
            onClick={() => setStep(1)}
          />
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500,
            color: '#ff82b8', letterSpacing: '.08em',
            marginTop: -2, textAlign: 'center',
          }}>Tonight everything changes</div>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Pre-Hatch Story ────────────────────────────────────────────────
  if (step === 1) return (
    <RitualStoryViewer
      pages={makeStoryPages(childName)}
      title="The Choosing"
      nightLabel="The Choosing"
      nightNumber={3}
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
      creatureImageSrc={creatureImageSrc}
      creatureName={creatureName}
      onComplete={() => setStep(3)}
    />
  );

  // ── Step 3: Name Your DreamKeeper ──────────────────────────────────────
  if (step === 3) {
    const displayName = customName.trim() || creatureName;
    const handleConfirmName = () => {
      const finalName = customName.trim() || creatureName;
      // Persist custom name into ritual state so it flows through to App.tsx
      const updated = { ...ritual, creatureName: finalName };
      saveRitualState(userId, updated);
      setStep(4);
    };
    return (
      <div className="ob-ritual">
        <style>{RITUAL_CSS}</style>
        <StarField />
        <div className="ob-ritual-inner">
          <div className="ob-ritual-screen" style={{ animation: 'ob-fadeUp .8s ease-out' }}>
            <CreatureImage src={creatureImageSrc} size={130} color={color} animate={true} glowIntensity={0.6} />

            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: hexToRgba(color, .5), letterSpacing: '.08em',
              textTransform: 'uppercase', marginTop: 8, marginBottom: 16,
            }}>
              Your DreamKeeper
            </div>

            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 900,
              fontSize: 'clamp(20px,5vw,25px)', lineHeight: 1.2, marginBottom: 6,
            }}>
              What will you <em style={{ color: '#F6C56F', fontStyle: 'italic' }}>call</em> me?
            </div>

            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 13, color: 'rgba(246,197,111,.5)', lineHeight: 1.5,
              maxWidth: 260, margin: '0 auto 20px',
            }}>
              Give your DreamKeeper a name — this is who they'll be forever.
            </div>

            {/* Name input */}
            <div style={{
              position: 'relative', maxWidth: 260, margin: '0 auto 8px',
            }}>
              <input
                ref={nameInputRef}
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && displayName.length >= 1) handleConfirmName(); }}
                placeholder={creatureName}
                maxLength={24}
                autoFocus
                style={{
                  width: '100%', padding: '14px 18px',
                  borderRadius: 16, border: `1.5px solid ${hexToRgba(color, .3)}`,
                  background: 'rgba(255,255,255,.04)',
                  color: '#F4EFE8', fontSize: 18, fontWeight: 600,
                  fontFamily: "'Fraunces', serif",
                  textAlign: 'center', outline: 'none',
                  transition: 'border-color .2s, box-shadow .2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = hexToRgba(color, .6); e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(color, .15)}`; }}
                onBlur={e => { e.currentTarget.style.borderColor = hexToRgba(color, .3); e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9,
              color: 'rgba(244,239,232,.25)', marginBottom: 20,
            }}>
              {customName.trim() ? '' : `Suggestion: ${creatureName}`}
            </div>

            <RitualCTA
              label={`That's my DreamKeeper ✦`}
              onClick={handleConfirmName}
            />
          </div>
        </div>
      </div>
    );
  }

  // Use the custom name from here onward
  const finalCreatureName = customName.trim() || creatureName;

  // ── Step 4: First Contact — DreamKeeper chose you ──────────────────────
  if (step === 4) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen" style={{ animation: 'ob-fadeUp .8s ease-out' }}>
          {/* Creature image — DreamKeeper PNG */}
          <CreatureImage src={creatureImageSrc} size={140} color={color} animate={true} glowIntensity={0.7} />

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: hexToRgba(color, .6), letterSpacing: '.1em',
            textTransform: 'uppercase', marginBottom: 6, marginTop: 8,
          }}>{finalCreatureName}</div>

          <div style={{
            fontFamily: "'Fraunces', serif", fontWeight: 900,
            fontSize: 'clamp(22px,5.5vw,27px)', lineHeight: 1.12, letterSpacing: '-0.5px', marginBottom: 16,
          }}>
            Your DreamKeeper <em style={{ color: '#F6C56F', fontStyle: 'italic' }}>chose you</em>
          </div>

          <SpeechBubble
            speaker={finalCreatureName.toUpperCase()}
            text={`"${childName}, I've been listening since the very first night. Everything you shared — I kept it safe. Now I'm here, and I'm yours."`}
            color={hexToRgba(color, .5)}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12.5, color: 'rgba(246,197,111,.5)', lineHeight: 1.6,
            maxWidth: 240, margin: '8px auto 12px',
          }}>
            "You told me about {smileAnswer}… and that you're good at {talentAnswer}. I held onto all of it."
          </div>

          <div style={{ marginTop: 8 }}>
            <RitualCTA label="Continue" onClick={() => setStep(5)} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 5: Night Card + Photo ──────────────────────────────────────────
  if (step === 5) return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(255,130,184,.65)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16,
          }}>✦ NIGHT 3 · THE HATCHING NIGHT</div>

          <MiniNightCard
            title="The Night Your DreamKeeper Was Born"
            quote={`After three nights of listening, ${finalCreatureName} chose to become ${childName}'s.`}
            emoji={emoji}
            nightNumber={3}
            color={color}
            creatureImageSrc={creatureImageSrc}
          />

          {/* Photo capture */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result as string); r.readAsDataURL(f); }}} />
          <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result as string); r.readAsDataURL(f); }}} />

          {photo ? (
            <div style={{ position: 'relative', margin: '14px auto', width: 200, height: 150, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(255,130,184,.3)', boxShadow: '0 12px 32px rgba(0,0,0,.5)' }}>
              <img src={photo} alt="Tonight's photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* DreamKeeper overlay on photo */}
              <div style={{
                position: 'absolute', bottom: 6, right: 6,
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(0,0,0,.5)', border: '1.5px solid rgba(246,197,111,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img src={creatureImageSrc} alt={finalCreatureName} style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, margin: '14px auto', justifyContent: 'center' }}>
              <button onClick={() => cameraInputRef.current?.click()} style={{
                padding: '12px 20px', borderRadius: 18, cursor: 'pointer',
                border: '1.5px solid rgba(255,130,184,.3)',
                background: 'linear-gradient(145deg, rgba(255,130,184,.12), rgba(184,161,255,.06))',
                color: 'rgba(255,130,184,.85)', fontSize: 13, fontWeight: 600,
                fontFamily: "'Fraunces', serif",
                boxShadow: '0 4px 16px rgba(255,130,184,.1), inset 0 1px 0 rgba(255,255,255,.06)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>📷 Take a photo</button>
              <button onClick={() => uploadInputRef.current?.click()} style={{
                padding: '12px 20px', borderRadius: 18, cursor: 'pointer',
                border: '1.5px solid rgba(184,161,255,.2)',
                background: 'linear-gradient(145deg, rgba(184,161,255,.08), rgba(6,9,18,.9))',
                color: 'rgba(234,242,255,.55)', fontSize: 13, fontWeight: 600,
                fontFamily: "'Fraunces', serif",
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>📁 Upload</button>
            </div>
          )}

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(246,197,111,.5)', lineHeight: 1.6,
            maxWidth: 260, margin: '4px auto 16px',
          }}>
            This is yours to keep forever.
          </div>

          <RitualCTA label="Save to collection →" variant="pink" onClick={() => setStep(6)} />
        </div>
      </div>
    </div>
  );

  // ── Step 6: Born Card + Completion ─────────────────────────────────────────
  return (
    <div className="ob-ritual">
      <style>{RITUAL_CSS}</style>
      <StarField />
      <div className="ob-ritual-inner">
        <div className="ob-ritual-screen">
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
            quote={`After three nights of listening, ${finalCreatureName} chose to become ${childName}'s.`}
            emoji={emoji}
            nightNumber={3}
            color={color}
            creatureImageSrc={creatureImageSrc}
          />

          <div style={{
            fontFamily: "'Lora','Fraunces',Georgia,serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(246,197,111,.55)', lineHeight: 1.6,
            maxWidth: 260, margin: '8px auto 4px',
          }}>
            "{finalCreatureName} chose you both."
          </div>

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: 'rgba(244,239,232,.75)', marginBottom: 20, letterSpacing: '.03em',
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
