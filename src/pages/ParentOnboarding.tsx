import { useState, useEffect, useCallback } from 'react';
import WhisperBackground from '../components/onboarding/WhisperBackground';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import '../components/onboarding/onboarding.css';

// ── Types ────────────────────────────────────────────────────────────────────
export interface ParentOnboardingResult {
  childName: string;
  childAge: string;
  childPronouns: string;
}

interface Props {
  onComplete: (result: ParentOnboardingResult) => void;
  onSaveLater?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ParentOnboarding({ onComplete, onSaveLater }: Props) {
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPronouns, setChildPronouns] = useState('');

  // ── Step 0: Staggered hook reveal ─────────────────────────────────────────
  const [hookLine1, setHookLine1] = useState(false);
  const [hookLine2, setHookLine2] = useState(false);
  const [hookLine3, setHookLine3] = useState(false);
  const [hookCta, setHookCta] = useState(false);

  useEffect(() => {
    if (step !== 0) return;
    const timers = [
      window.setTimeout(() => setHookLine1(true), 600),
      window.setTimeout(() => setHookLine2(true), 2200),
      window.setTimeout(() => setHookLine3(true), 4000),
      window.setTimeout(() => setHookCta(true), 5400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ── Name preview update ────────────────────────────────────────────────────
  const nameValid = childName.trim().length >= 2;

  const handleComplete = useCallback(() => {
    if (!nameValid) return;
    const trimmed = childName.trim();
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    onComplete({
      childName: capitalized,
      childAge: childAge || '',
      childPronouns: childPronouns || 'they/them',
    });
  }, [childName, childAge, childPronouns, nameValid, onComplete]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <OnboardingShell>
      {/* ── Step 0: Aspirational Hook ──────────────────────────────────── */}
      {step === 0 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 36%, rgba(14,8,46,.99), #060912 66%)' }}>
          <WhisperBackground />
          <div className="ob-ct" style={{ padding: '0 32px', gap: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>

            {/* Central spark */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#F6C56F', marginBottom: 36,
              boxShadow: '0 0 20px rgba(246,197,111,.5), 0 0 60px rgba(246,197,111,.2)',
              animation: 'ob-breathe 3s ease-in-out infinite',
            }} />

            {/* Hook line 1 */}
            <div style={{
              opacity: hookLine1 ? 1 : 0,
              transform: hookLine1 ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity .9s ease, transform .9s ease',
              marginBottom: 12, width: '100%',
            }}>
              <div style={{
                fontFamily: "'Fraunces', serif", fontWeight: 200, fontStyle: 'italic',
                fontSize: 'clamp(28px, 8vw, 38px)', letterSpacing: -1.5,
                color: 'rgba(244,239,232,.96)', lineHeight: 1.15,
              }}>
                What if bedtime was the moment they{' '}
                <span style={{ color: '#F6C56F' }}>looked forward to</span>{' '}
                most?
              </div>
            </div>

            {/* Hook line 2 — separator + insight */}
            <div style={{
              opacity: hookLine2 ? 1 : 0,
              transform: hookLine2 ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity .9s ease, transform .9s ease',
              marginBottom: 20, width: '100%',
            }}>
              <div style={{ width: 28, height: 1, background: 'rgba(246,197,111,.28)', margin: '16px auto 18px' }} />
              <div style={{
                fontFamily: "'Fraunces', serif", fontWeight: 300, fontStyle: 'italic',
                fontSize: 'clamp(16px, 4.5vw, 20px)', letterSpacing: -0.2,
                color: 'rgba(234,242,255,.44)', lineHeight: 1.55,
              }}>
                Children don't remember the nights they fell asleep quickly.
                They remember the nights someone made something just for them.
              </div>
            </div>

            {/* Hook line 3 — commitment framing */}
            <div style={{
              opacity: hookLine3 ? 1 : 0,
              transform: hookLine3 ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity .8s ease, transform .8s ease',
              marginBottom: 32,
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: 'rgba(246,197,111,.55)', letterSpacing: 1.8,
                textTransform: 'uppercase' as const,
              }}>
                3 NIGHTS &middot; 3 MINUTES EACH
              </div>
            </div>

            {/* CTA */}
            <div style={{ opacity: hookCta ? 1 : 0, transition: 'opacity .7s ease', width: '100%' }}>
              <button className="ob-cta" onClick={() => setStep(1)} style={{ fontSize: 16 }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Child Name + Age + Pronoun ─────────────────────────── */}
      {step === 1 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(16,10,50,.98), #060912 58%)' }}>
          <WhisperBackground />
          <div className="ob-ct" style={{ padding: '56px 28px 36px', gap: 0 }}>

            {/* Back button */}
            <button
              onClick={() => setStep(0)}
              style={{
                position: 'absolute', top: 20, left: 20,
                background: 'none', border: 'none',
                color: 'rgba(244,239,232,.35)', fontSize: 18,
                cursor: 'pointer', padding: 8, zIndex: 10,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              &larr;
            </button>

            {/* Header */}
            <div style={{ width: '100%', marginBottom: 26, textAlign: 'center', animation: 'ob-fadeUp .5s ease both' }}>
              <div style={{
                fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700,
                color: 'rgba(244,239,232,.94)', lineHeight: 1.18, letterSpacing: -0.5, marginBottom: 6,
              }}>
                Your story begins<br />with a name
              </div>
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 13,
                color: 'rgba(234,242,255,.32)', lineHeight: 1.65,
              }}>
                Who is this for?
              </div>
            </div>

            {/* Name input */}
            <div style={{ maxWidth: 300, width: '100%', margin: '0 auto 20px', animation: 'ob-fadeUp .5s .1s ease both' }}>
              <input
                className="ob-p-input"
                placeholder="Their name..."
                value={childName}
                onChange={e => setChildName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Age selector */}
            <div style={{ width: '100%', marginBottom: 16, animation: 'ob-fadeUp .5s .2s ease both' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(234,242,255,.3)', letterSpacing: 0.7, marginBottom: 8, textAlign: 'center' }}>AGE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['3', '4', '5', '6', '7', '8', '9', '10+'].map(age => (
                  <button
                    key={age}
                    onClick={() => setChildAge(age)}
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      border: `1.5px solid ${childAge === age ? 'rgba(246,197,111,.55)' : 'rgba(255,255,255,.08)'}`,
                      background: childAge === age ? 'rgba(246,197,111,.1)' : 'rgba(255,255,255,.04)',
                      color: childAge === age ? 'rgba(246,197,111,.92)' : 'rgba(234,242,255,.5)',
                      fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .18s',
                    }}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Pronoun selector */}
            <div style={{ width: '100%', marginBottom: 20, animation: 'ob-fadeUp .5s .3s ease both' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(234,242,255,.3)', letterSpacing: 0.7, marginBottom: 8, textAlign: 'center' }}>PRONOUN</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[
                  { value: 'he/him', label: 'he/him' },
                  { value: 'she/her', label: 'she/her' },
                  { value: 'they/them', label: 'they/them' },
                ].map(p => (
                  <button
                    key={p.value}
                    onClick={() => setChildPronouns(p.value)}
                    style={{
                      padding: '9px 16px', borderRadius: 22,
                      border: `1.5px solid ${childPronouns === p.value ? 'rgba(246,197,111,.55)' : 'rgba(255,255,255,.08)'}`,
                      background: childPronouns === p.value ? 'rgba(246,197,111,.1)' : 'rgba(255,255,255,.04)',
                      color: childPronouns === p.value ? 'rgba(246,197,111,.92)' : 'rgba(234,242,255,.5)',
                      fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                      cursor: 'pointer', transition: 'all .18s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Magical preview */}
            <div style={{ width: '100%', marginBottom: 22, animation: 'ob-fadeUp .5s .4s ease both' }}>
              <div style={{
                padding: '11px 16px', background: 'rgba(246,197,111,.07)',
                border: '1px solid rgba(246,197,111,.16)', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <div style={{ fontSize: 14, lineHeight: 1 }}>&#10022;</div>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  color: 'rgba(246,197,111,.65)', letterSpacing: 0.3, textAlign: 'center',
                }}>
                  {nameValid
                    ? `A DreamKeeper is waiting for ${childName.trim()}`
                    : "Enter their name to begin"}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ animation: 'ob-fadeUp .5s .5s ease both' }}>
              <button
                className="ob-cta"
                onClick={handleComplete}
                style={{ opacity: nameValid ? 1 : 0.4, pointerEvents: nameValid ? 'auto' : 'none' }}
              >
                Start {nameValid ? `${childName.trim()}'s` : "their"} first night
              </button>
              {onSaveLater && (
                <button className="ob-ghost" onClick={onSaveLater} style={{ marginBottom: 10 }}>
                  Start when they're with you
                </button>
              )}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(234,242,255,.2)', letterSpacing: 0.4 }}>Takes about 3 minutes</div>
            </div>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
