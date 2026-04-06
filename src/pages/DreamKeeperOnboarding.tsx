import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FEELINGS,
  V1_DREAMKEEPERS,
  matchDreamKeeper,
  getAlternates,
  type DreamKeeper,
  type Feeling,
} from '../lib/dreamkeepers';
import DreamKeeperReveal from '../components/DreamKeeperReveal';

// ─────────────────────────────────────────────────────────────────────────────
// DreamKeeperOnboarding — 7-step emotional onboarding flow
// ─────────────────────────────────────────────────────────────────────────────
// Step 0: Intro moment — "Every dreamer has a DreamKeeper…"
// Step 1: Feeling selection — "How do you want to feel tonight?"
// Step 2: Reveal sequence — 8.5s timed animation (DreamKeeperReveal)
// Step 3: Meet your DreamKeeper — creature speaks, choice buttons
// Step 4: Browse all — 2-column grid (secondary path from step 3)
// Step 5: Confirmation — creature promise + "Start my first story"
// ─────────────────────────────────────────────────────────────────────────────

export interface DreamKeeperResult {
  dreamKeeper: DreamKeeper;
  feeling: string;
  childName: string;
}

interface Props {
  childName: string;
  childAge?: string;
  childPronouns?: string;
  onComplete: (result: DreamKeeperResult) => void;
  onBack?: () => void;
}

// ── Feeling Descriptions ────────────────────────────────────────────────────

const FEELING_DESCRIPTIONS: Record<string, string> = {
  safe: 'like nothing can hurt you',
  calm: 'like a quiet river',
  brave: 'like you can do anything',
  curious: 'like there\'s something to discover',
  cozy: 'like a warm blanket',
  sleepy: 'like floating on a cloud',
};

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes dko-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes dko-scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes dko-breathe{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes dko-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes dko-starTwinkle{0%,100%{opacity:var(--lo,.05)}50%{opacity:var(--hi,.45)}}
@keyframes dko-starTwinkle2{0%,100%{opacity:var(--lo,.12)}60%{opacity:var(--hi,.04)}}
@keyframes dko-sparkIn{0%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.3)}100%{opacity:.8;transform:scale(1)}}
@keyframes dko-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes dko-glowPulse{0%,100%{box-shadow:0 0 30px rgba(var(--dk-rgb,245,184,76),.15)}50%{box-shadow:0 0 60px rgba(var(--dk-rgb,245,184,76),.35)}}
@keyframes dko-chipPop{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1.04)}}
@keyframes dko-cardIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes dko-crossfadeIn{from{opacity:0}to{opacity:1}}
.dko-crossfade{animation:dko-crossfadeIn .8s ease-out}

.dko{position:fixed;inset:0;z-index:1000;background:#060912;font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;overflow-y:auto;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.dko-inner{width:100%;max-width:430px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;position:relative;padding:0 24px}
.dko-screen{flex:1;display:flex;flex-direction:column;position:relative;z-index:5;padding:16px 0 40px}

.dko-star{position:fixed;border-radius:50%;background:#EEE8FF;pointer-events:none;z-index:0}

.dko-back{position:absolute;top:20px;left:20px;background:none;border:none;color:rgba(244,239,232,.35);font-size:18px;cursor:pointer;padding:8px;z-index:10;transition:color .15s;-webkit-tap-highlight-color:transparent;font-family:'Nunito',system-ui,sans-serif}
.dko-back:hover{color:rgba(244,239,232,.6)}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DreamKeeperOnboarding({ childName, onComplete, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [matchedCreature, setMatchedCreature] = useState<DreamKeeper | null>(null);
  const [confirmedCreature, setConfirmedCreature] = useState<DreamKeeper | null>(null);
  const [revealDone, setRevealDone] = useState(false);
  const [meetReady, setMeetReady] = useState(false);

  // Feeling used to arrive at the current match (for the result)
  const [usedFeeling, setUsedFeeling] = useState<string>('safe');

  // ── Stars ──────────────────────────────────────────────────────────────────
  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number; bright: boolean }[] = [];
    for (let i = 0; i < 120; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 100,
      s: 1 + Math.random(), d: 2.5 + Math.random() * 3, dl: Math.random() * 4, bright: false,
    });
    for (let i = 0; i < 12; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 100,
      s: 2 + Math.random(), d: 3 + Math.random() * 3, dl: Math.random() * 3, bright: true,
    });
    return arr;
  }, []);

  const starField = (
    <>
      {stars.map((s, i) => (
        <div key={i} className="dko-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s,
          animation: `${s.bright ? 'dko-starTwinkle2' : 'dko-starTwinkle'} ${s.d}s ${s.dl}s ease-in-out infinite`,
          ...(s.bright ? { background: '#C8C0B0' } : {}),
        } as React.CSSProperties} />
      ))}
    </>
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goStep = useCallback((s: number) => {
    if (s === 3) {
      setMeetReady(false);
      setTimeout(() => setMeetReady(true), 50);
    }
    setStep(s);
  }, []);

  // ── Feeling selection handler ──────────────────────────────────────────────
  const handleFeelingSelect = (feeling: Feeling) => {
    setSelectedFeeling(feeling.id);
  };

  const handleFindDreamKeeper = () => {
    if (!selectedFeeling) return;
    const creature = matchDreamKeeper(selectedFeeling);
    setMatchedCreature(creature);
    setUsedFeeling(selectedFeeling);
    setRevealDone(false);
    goStep(2);
  };

  // ── Browse grid selection ──────────────────────────────────────────────────
  const handleBrowseSelect = (dk: DreamKeeper) => {
    setConfirmedCreature(dk);
    goStep(5);
  };

  // ── "This is my DreamKeeper" from meet step ────────────────────────────────
  const handleConfirmFromMeet = () => {
    if (!matchedCreature) return;
    setConfirmedCreature(matchedCreature);
    goStep(5);
  };

  // ── Final completion ───────────────────────────────────────────────────────
  const handleStartStory = () => {
    if (!confirmedCreature) return;
    onComplete({
      dreamKeeper: confirmedCreature,
      feeling: usedFeeling,
      childName,
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0 — Intro
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <div className="dko">
        <style>{CSS}</style>
        {starField}
        <div className="dko-inner">
          {onBack && <button className="dko-back" onClick={onBack} aria-label="Back">&larr;</button>}
          <div className="dko-screen" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {/* Elder — mysterious silhouette behind the spark */}
            <div style={{
              position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
              width: 280, height: 340, pointerEvents: 'none', zIndex: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'dko-fadeUp 2s 0.4s ease-out both',
            }}>
              <img
                src="/elder/transparent/elder.png"
                alt=""
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  opacity: 0.07,
                  filter: 'blur(2px) brightness(1.2)',
                  maskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, black 30%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, black 30%, transparent 80%)',
                }}
              />
            </div>

            {/* Spark */}
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: '#F6C56F', marginBottom: 32,
              animation: 'dko-sparkIn 1.2s ease-out forwards, dko-breathe 3s 1.2s ease-in-out infinite',
              boxShadow: '0 0 24px rgba(246,197,111,.4)',
              position: 'relative', zIndex: 2,
            }} />

            {/* Title */}
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.4,
              color: '#F4EFE8', maxWidth: 300,
              animation: 'dko-fadeUp .8s .6s ease-out both',
            }}>
              Every dreamer has a DreamKeeper...
            </div>

            {/* Subtitle */}
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif",
              fontStyle: 'italic', fontSize: 14, fontWeight: 400,
              color: 'rgba(244,239,232,.45)', lineHeight: 1.7,
              maxWidth: 280, marginTop: 16,
              animation: 'dko-fadeUp .8s 1.4s ease-out both',
            }}>
              A companion who watches over your dreams and keeps them safe.
            </div>

            {/* CTA */}
            <button
              onClick={() => goStep(1)}
              style={{
                marginTop: 48, padding: '17px 48px', border: 'none', borderRadius: 14,
                background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
                color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Nunito',system-ui,sans-serif",
                boxShadow: '0 6px 24px rgba(200,130,20,.3)',
                animation: 'dko-fadeUp .8s 2s ease-out both',
                transition: 'transform .15s, filter .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Feeling Selection
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="dko">
        <style>{CSS}</style>
        {starField}
        <div className="dko-inner">
          <button className="dko-back" onClick={() => goStep(0)} aria-label="Back">&larr;</button>
          <div className="dko-screen" style={{ justifyContent: 'center', animation: 'dko-fadeUp .4s ease-out' }}>
            {/* Label */}
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 400,
              color: 'rgba(244,239,232,.35)', letterSpacing: '.06em',
              textTransform: 'uppercase', textAlign: 'center', marginBottom: 8,
            }}>
              Your DreamKeeper
            </div>

            {/* Heading */}
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3,
              textAlign: 'center', marginBottom: 6,
            }}>
              Tonight, what would feel best?
            </div>
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif",
              fontStyle: 'italic', fontSize: 13, fontWeight: 400,
              color: 'rgba(244,239,232,.4)', lineHeight: 1.6,
              textAlign: 'center', marginBottom: 24,
            }}>
              Pick the feeling that sounds like tonight
            </div>

            {/* 2x3 Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 10, margin: '0 auto', maxWidth: 340,
            }}>
              {FEELINGS.map((f, i) => {
                const selected = selectedFeeling === f.id;
                return (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFeelingSelect(f)}
                    style={{
                      padding: '20px 12px', borderRadius: 18, cursor: 'pointer',
                      textAlign: 'center', transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                      border: `2px solid ${selected ? `rgba(${f.color},.5)` : 'rgba(255,255,255,.06)'}`,
                      background: selected ? `rgba(${f.color},.12)` : 'rgba(255,255,255,.02)',
                      transform: selected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: selected ? `0 0 24px rgba(${f.color},.2)` : 'none',
                      animation: `dko-cardIn .4s ${0.05 * i}s ease-out both`,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{
                      fontSize: 36, lineHeight: 1, marginBottom: 6,
                      transition: 'transform .25s cubic-bezier(.34,1.56,.64,1)',
                      transform: selected ? 'scale(1.15)' : 'scale(1)',
                    }}>
                      {f.emoji}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: selected ? `rgb(${f.color})` : 'rgba(244,239,232,.5)',
                      transition: 'color .2s',
                    }}>
                      {f.label}
                    </div>
                    {FEELING_DESCRIPTIONS[f.id] && (
                      <div style={{
                        fontSize: 10.5, fontWeight: 400,
                        fontFamily: "'Lora','Fraunces',Georgia,serif",
                        fontStyle: 'italic',
                        color: selected ? `rgba(${f.color},.7)` : 'rgba(244,239,232,.28)',
                        transition: 'color .2s',
                        marginTop: 3, lineHeight: 1.3,
                      }}>
                        {FEELING_DESCRIPTIONS[f.id]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <button
              disabled={!selectedFeeling}
              onClick={handleFindDreamKeeper}
              style={{
                width: '100%', maxWidth: 340, margin: '32px auto 0', padding: '17px',
                border: 'none', borderRadius: 14,
                background: selectedFeeling
                  ? 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)'
                  : 'rgba(255,255,255,.04)',
                color: selectedFeeling ? '#080200' : 'rgba(244,239,232,.2)',
                fontSize: 16, fontWeight: 700, cursor: selectedFeeling ? 'pointer' : 'default',
                fontFamily: "'Nunito',system-ui,sans-serif",
                boxShadow: selectedFeeling ? '0 6px 24px rgba(200,130,20,.3)' : 'none',
                opacity: selectedFeeling ? 1 : .4,
                transition: 'all .3s',
                display: 'block',
              }}
            >
              Find my DreamKeeper {selectedFeeling ? '\u2728' : ''}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Reveal Sequence (delegated to DreamKeeperReveal)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2 && matchedCreature) {
    const alts = getAlternates(usedFeeling, matchedCreature.id);
    return (
      <DreamKeeperReveal
        primary={matchedCreature}
        alternates={alts}
        childName={childName}
        onRevealComplete={() => { setRevealDone(true); goStep(3); }}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Meet Your DreamKeeper
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 3 && matchedCreature) {
    const rgb = hexToRgb(matchedCreature.color);
    return (
      <div className="dko">
        <style>{CSS}</style>
        {starField}
        <div className="dko-inner">
          <div className={`dko-screen${meetReady ? ' dko-crossfade' : ''}`} style={{
            justifyContent: 'center', alignItems: 'center', textAlign: 'center',
            opacity: meetReady ? 1 : 0,
          }}>
            {/* Creature image */}
            <div style={{
              width: 200, height: 240,
              margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'dko-float 4s ease-in-out infinite',
              '--dk-rgb': rgb,
            } as React.CSSProperties}>
              <img src={matchedCreature.imageSrc} alt={matchedCreature.name} style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: `drop-shadow(0 0 30px rgba(${rgb},.35))`,
              }} />
            </div>

            {/* Matched badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `rgba(${rgb},.08)`, border: `1px solid rgba(${rgb},.2)`,
              borderRadius: 50, padding: '5px 14px', marginBottom: 10,
            }}>
              <span style={{ fontSize: 10, color: `rgb(${rgb})` }}>&#10022;</span>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10, color: `rgba(${rgb},.7)`,
                letterSpacing: '.04em',
              }}>Matched for {childName}</span>
            </div>

            {/* Name + virtue */}
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 400,
              color: `rgba(${rgb},.7)`, letterSpacing: '.1em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>
              {matchedCreature.virtue}
            </div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 24, color: '#F4EFE8', marginBottom: 16,
            }}>
              {matchedCreature.name}
            </div>

            {/* Speech bubble */}
            <div style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 16, padding: '20px 24px',
              maxWidth: 320, margin: '0 auto 8px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                borderBottom: '8px solid rgba(255,255,255,.08)',
              }} />
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif",
                fontStyle: 'italic', fontSize: 15, fontWeight: 400,
                color: 'rgba(244,239,232,.7)', lineHeight: 1.7,
              }}>
                "Hi, {childName}... I've been looking for a dreamer just like you."
              </div>
            </div>

            {/* Emotional line */}
            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif",
              fontStyle: 'italic', fontSize: 13, fontWeight: 400,
              color: 'rgba(244,239,232,.4)', lineHeight: 1.6,
              maxWidth: 280, margin: '12px auto 28px',
            }}>
              "{matchedCreature.emotionalLine}"
            </div>

            {/* Primary CTA */}
            <button
              onClick={handleConfirmFromMeet}
              style={{
                width: '100%', maxWidth: 320, padding: '17px', border: 'none', borderRadius: 14,
                background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
                color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Nunito',system-ui,sans-serif",
                boxShadow: '0 6px 24px rgba(200,130,20,.3)',
                transition: 'transform .15s, filter .15s',
                display: 'block', margin: '0 auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
            >
              This is my DreamKeeper
            </button>

            {/* Secondary — show me others */}
            <button
              onClick={() => goStep(4)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(244,239,232,.3)', fontSize: 13, fontWeight: 400,
                cursor: 'pointer', marginTop: 16,
                fontFamily: "'Nunito',system-ui,sans-serif",
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(244,239,232,.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,232,.3)')}
            >
              Meet a few others
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Browse All DreamKeepers
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 4 && matchedCreature) {
    const alts = getAlternates(usedFeeling, matchedCreature.id);
    const browseList = [matchedCreature, ...alts.slice(0, 2)];
    return (
      <div className="dko">
        <style>{CSS}</style>
        {starField}
        <div className="dko-inner">
          <button className="dko-back" onClick={() => goStep(3)} aria-label="Back">&larr;</button>
          <div className="dko-screen" style={{ animation: 'dko-fadeUp .4s ease-out', justifyContent: 'center' }}>
            {/* Heading */}
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 'clamp(20px,5vw,26px)', lineHeight: 1.3,
              textAlign: 'center', marginBottom: 24,
            }}>
              Others who felt your call
            </div>

            {/* Horizontal list cards */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: 12, paddingBottom: 20, width: '100%', maxWidth: 360,
            }}>
              {browseList.map((dk, i) => {
                const rgb = hexToRgb(dk.color);
                const isPrimary = dk.id === matchedCreature.id;
                return (
                  <div
                    key={dk.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleBrowseSelect(dk)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 16px', borderRadius: 18, cursor: 'pointer',
                      border: `1.5px solid ${isPrimary ? `rgba(${rgb},.35)` : 'rgba(255,255,255,.06)'}`,
                      background: isPrimary ? `rgba(${rgb},.06)` : 'rgba(255,255,255,.02)',
                      transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                      animation: `dko-cardIn .4s ${0.06 * i}s ease-out both`,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {/* Image */}
                    <div style={{
                      width: 64, height: 64, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={dk.imageSrc} alt={dk.name} style={{
                        width: '100%', height: '100%', objectFit: 'contain',
                        filter: `drop-shadow(0 0 12px rgba(${rgb},.3))`,
                      }} />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{
                        fontFamily: "'Fraunces',Georgia,serif", fontWeight: 400,
                        fontSize: 16, color: '#F4EFE8', marginBottom: 2,
                      }}>
                        {dk.name}
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono',monospace", fontSize: 9,
                        color: `rgba(${rgb},.6)`, letterSpacing: '.06em',
                        textTransform: 'uppercase', marginBottom: 4,
                      }}>
                        {dk.virtue}
                      </div>
                      <div style={{
                        fontFamily: "'Lora','Fraunces',Georgia,serif",
                        fontStyle: 'italic', fontSize: 12, fontWeight: 400,
                        color: 'rgba(244,239,232,.35)', lineHeight: 1.4,
                      }}>
                        "{dk.emotionalLine}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Try a different feeling */}
            <button
              onClick={() => goStep(1)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(244,239,232,.3)', fontSize: 13, fontWeight: 400,
                cursor: 'pointer', marginTop: 8,
                fontFamily: "'Nunito',system-ui,sans-serif",
                transition: 'color .15s',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(244,239,232,.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,232,.3)')}
            >
              Try a different feeling
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 5 — Confirmation
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 5 && confirmedCreature) {
    const rgb = hexToRgb(confirmedCreature.color);
    return (
      <div className="dko">
        <style>{CSS}</style>
        {starField}
        <div className="dko-inner">
          <div className="dko-screen" style={{
            justifyContent: 'center', alignItems: 'center', textAlign: 'center',
            animation: 'dko-fadeUp .6s ease-out',
          }}>
            {/* Creature image */}
            <div style={{
              width: 190, height: 230,
              margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'dko-float 4s ease-in-out infinite',
              '--dk-rgb': rgb,
            } as React.CSSProperties}>
              <img src={confirmedCreature.imageSrc} alt={confirmedCreature.name} style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: `drop-shadow(0 0 30px rgba(${rgb},.35))`,
              }} />
            </div>

            {/* Name */}
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontWeight: 300,
              fontSize: 22, color: '#F4EFE8', marginBottom: 20,
            }}>
              {confirmedCreature.name}
            </div>

            {/* Promise speech */}
            <div style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 16, padding: '20px 24px',
              maxWidth: 320, margin: '0 auto 12px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                borderBottom: '8px solid rgba(255,255,255,.08)',
              }} />
              <div style={{
                fontFamily: "'Lora','Fraunces',Georgia,serif",
                fontStyle: 'italic', fontSize: 15, fontWeight: 400,
                color: 'rgba(244,239,232,.7)', lineHeight: 1.7,
              }}>
                "Hi, {childName}... I've been waiting for you."
              </div>
            </div>

            <div style={{
              fontFamily: "'Lora','Fraunces',Georgia,serif",
              fontStyle: 'italic', fontSize: 13, fontWeight: 400,
              color: 'rgba(244,239,232,.4)', lineHeight: 1.6,
              maxWidth: 280, margin: '0 auto 36px',
            }}>
              "I'll be with you every night, {childName}."
            </div>

            {/* CTA */}
            <button
              onClick={handleStartStory}
              style={{
                width: '100%', maxWidth: 320, padding: '18px', border: 'none', borderRadius: 14,
                background: 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)',
                color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Nunito',system-ui,sans-serif",
                boxShadow: '0 6px 24px rgba(200,130,20,.3)',
                transition: 'transform .15s, filter .15s',
                display: 'block', margin: '0 auto',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
            >
              Start my first story {'\u2728'}
              {/* Shimmer overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.2) 50%,transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'dko-shimmer 3s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback (should not reach here) ───────────────────────────────────────
  return null;
}
