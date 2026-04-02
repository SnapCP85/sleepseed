import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [step, setStep] = useState(0); // 0-5 maps to P1-P6
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPronouns, setChildPronouns] = useState('');

  // ── Step 0 (P1): Battle pills ──────────────────────────────────────────
  const pillsRef = useRef<HTMLDivElement>(null);
  const [p0HeadlineVisible, setP0HeadlineVisible] = useState(false);
  const [p0SubVisible, setP0SubVisible] = useState(false);
  const [p0CtaVisible, setP0CtaVisible] = useState(false);

  useEffect(() => {
    if (step !== 0) return;
    const pills = pillsRef.current?.querySelectorAll('.ob-dp-seq');
    if (!pills) return;
    const N = pills.length;
    const STEP = 1100;
    const timers: number[] = [];

    pills.forEach((p, i) => {
      timers.push(window.setTimeout(() => {
        p.classList.add('dp-active');
        if (i > 0) {
          pills[i - 1].classList.remove('dp-active');
          pills[i - 1].classList.add('dp-dim');
        }
      }, i * STEP));
    });

    // Last pill dims
    timers.push(window.setTimeout(() => {
      pills[N - 1].classList.remove('dp-active');
      pills[N - 1].classList.add('dp-dim');
    }, N * STEP + 350));

    // Headlines appear
    const hBase = N * STEP + 1100;
    timers.push(window.setTimeout(() => setP0HeadlineVisible(true), hBase));
    timers.push(window.setTimeout(() => setP0SubVisible(true), hBase + 950));
    timers.push(window.setTimeout(() => setP0CtaVisible(true), hBase + 2300));

    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ── Step 1 (P2): Auto-advance ──────────────────────────────────────────
  const [p1Progress, setP1Progress] = useState(false);
  useEffect(() => {
    if (step !== 1) return;
    const t1 = window.setTimeout(() => setP1Progress(true), 80);
    const t2 = window.setTimeout(() => setStep(2), 4400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step]);

  // ── Step 2 (P3): Cinematic acts ────────────────────────────────────────
  const actsRef = useRef<HTMLDivElement>(null);
  const progbarRef = useRef<HTMLDivElement>(null);
  const [p2CtaVisible, setP2CtaVisible] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    setP2CtaVisible(false);
    const container = actsRef.current;
    if (!container) return;

    const acts = [
      { id: 'ca1', dur: 5000, exit: 'translateX(-14px)' },
      { id: 'ca2', dur: 5800, exit: 'translateY(-12px)' },
      { id: 'ca3', dur: 5000, exit: 'translateX(-12px)' },
      { id: 'ca4', dur: null as number | null },
    ];
    const timers: number[] = [];

    function setBar(ms: number) {
      const bar = progbarRef.current;
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.width = '0%';
      bar.offsetWidth; // reflow
      bar.style.transition = `width ${ms}ms linear`;
      bar.style.width = '100%';
    }
    function clearBar() {
      const bar = progbarRef.current;
      if (!bar) return;
      bar.style.transition = 'width .3s ease';
      bar.style.width = '0%';
    }

    function run(i: number) {
      if (i >= acts.length) return;
      const a = acts[i];
      const el = container!.querySelector(`#${a.id}`) as HTMLElement | null;
      if (!el) return;
      el.classList.add('live');

      if (a.dur !== null) {
        timers.push(window.setTimeout(() => setBar(a.dur! - 400), 200));
        timers.push(window.setTimeout(() => {
          clearBar();
          el.classList.remove('live');
          el.style.transform = a.exit;
          el.style.opacity = '0';
          timers.push(window.setTimeout(() => run(i + 1), 260));
        }, a.dur!));
        return;
      }

      // Act 4 — stagger lines
      timers.push(window.setTimeout(() => setBar(3800), 200));
      ['ca4l1', 'ca4l2', 'ca4l2b', 'ca4l3'].forEach((lid, j) => {
        timers.push(window.setTimeout(() => {
          const ln = container!.querySelector(`#${lid}`) as HTMLElement | null;
          if (ln) { ln.style.opacity = '1'; ln.style.transform = 'translateY(0)'; }
        }, 400 + j * 620));
      });

      // Warmbloom
      timers.push(window.setTimeout(() => {
        const wb = container!.querySelector('#warmbloom') as HTMLElement | null;
        if (wb) { wb.style.opacity = '1'; timers.push(window.setTimeout(() => { wb.style.opacity = '0'; }, 1800)); }
      }, 900));

      // CTA
      timers.push(window.setTimeout(() => setP2CtaVisible(true), 2600));
    }

    timers.push(window.setTimeout(() => run(0), 350));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ── Common fade helper ─────────────────────────────────────────────────
  const fadeUp = (delay: number): React.CSSProperties => ({
    animation: `ob-fadeUp 0.6s ${delay}s ease both`,
    opacity: 0,
  });

  // ── Name preview update ────────────────────────────────────────────────
  const nameValid = childName.trim().length >= 2;

  const handleComplete = useCallback(() => {
    if (!nameValid) return;
    onComplete({
      childName: childName.trim(),
      childAge: childAge || '',
      childPronouns: childPronouns || 'they/them',
    });
  }, [childName, childAge, childPronouns, nameValid, onComplete]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <OnboardingShell>
      {/* ── P1: Battle ──────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="ob-slide" style={{ background: 'linear-gradient(180deg, #060912, #080c1a)' }}>
          <WhisperBackground />
          <div className="ob-ct" style={{ padding: '60px 28px 44px', gap: 0, justifyContent: 'center' }}>
            {/* Pills */}
            <div ref={pillsRef} style={{ overflow: 'hidden', maxHeight: 120, marginBottom: 28 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center', maxWidth: 290, margin: '0 auto' }}>
                {['just five more minutes', "I'm not tired", 'I need water', 'one more show', "I can't sleep"].map(t => (
                  <span key={t} className="ob-dp-seq">{t}</span>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div style={{
              opacity: p0HeadlineVisible ? 1 : 0,
              transform: p0HeadlineVisible ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity .9s ease, transform .9s ease',
              marginBottom: 8, width: '100%',
            }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 200, fontStyle: 'italic', fontSize: 'clamp(34px, 10vw, 46px)', letterSpacing: -2, color: 'rgba(244,239,232,.96)', lineHeight: 1.08 }}>
                Bedtime is a battle.
              </div>
            </div>
            <div style={{
              opacity: p0SubVisible ? 1 : 0,
              transform: p0SubVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity .9s ease, transform .9s ease',
              marginBottom: 52, width: '100%',
            }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 200, fontStyle: 'italic', fontSize: 'clamp(28px, 8vw, 38px)', letterSpacing: -1.5, color: '#F5B84C', lineHeight: 1 }}>
                Until it isn't.
              </div>
            </div>

            {/* CTA */}
            <div style={{ opacity: p0CtaVisible ? 1 : 0, transition: 'opacity .7s ease', width: '100%' }}>
              <button className="ob-cta" onClick={() => setStep(1)} style={{ fontSize: 16 }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── P2: Shift (auto-advance) ────────────────────────────────── */}
      {step === 1 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(18,11,52,.98), #060912 58%)' }}>
          <WhisperBackground />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 180, height: 140, background: 'radial-gradient(ellipse, rgba(246,197,111,.025), transparent 70%)', pointerEvents: 'none' }} />
          <div className="ob-ct" style={{ padding: '72px 38px 36px', gap: 0 }}>
            <div style={fadeUp(0.3)}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 700, color: 'rgba(244,239,232,.9)', lineHeight: 1.2, letterSpacing: -0.55 }}>
                The day pulls you<br />in a thousand<br />directions.
              </div>
            </div>
            <div style={{ ...fadeUp(1.1), width: '100%', marginBottom: 54, marginTop: 24 }}>
              <div style={{ width: 28, height: 1, background: 'rgba(246,197,111,.28)', marginBottom: 18 }} />
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.44)', lineHeight: 1.5, letterSpacing: -0.2 }}>
                And bedtime&hellip;<br />is the only moment<br />that slows down.
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 28, left: 32, right: 32, height: 1, background: 'rgba(244,239,232,.06)', borderRadius: 1 }}>
            <div style={{
              height: '100%', width: p1Progress ? '100%' : '0%',
              background: 'rgba(246,197,111,.28)', borderRadius: 1,
              transition: p1Progress ? 'width 4100ms linear' : 'none',
            }} />
          </div>
        </div>
      )}

      {/* ── P3: Cinematic (4 acts) ──────────────────────────────────── */}
      {step === 2 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(12,7,44,.99), #050710 70%)' }}>
          <WhisperBackground />
          {/* Ambient glow */}
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.038) 0%, transparent 68%)', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'ob-glowDrift 22s ease-in-out infinite', pointerEvents: 'none' }} />
          {/* Warmbloom */}
          <div id="warmbloom" style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.08) 0%, transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0, transition: 'opacity 1.2s ease', pointerEvents: 'none' }} />
          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 28, left: 32, right: 32, height: 1, background: 'rgba(244,239,232,.06)', zIndex: 10, borderRadius: 1 }}>
            <div ref={progbarRef} style={{ height: '100%', width: '0%', background: 'rgba(246,197,111,.28)', borderRadius: 1, transition: 'none' }} />
          </div>
          {/* Acts */}
          <div ref={actsRef} style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
            {/* Act 1 */}
            <div className="ob-ca ca-l" id="ca1" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 600, color: 'rgba(244,239,232,.9)', lineHeight: 1.22, letterSpacing: -0.4, marginBottom: 16 }}>
                  You're not doing<br />anything wrong.
                </div>
                <div style={{ width: 24, height: 1, background: 'rgba(180,161,255,.28)', margin: '0 auto 16px' }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.38)', lineHeight: 1.6, letterSpacing: -0.1 }}>
                  This is just how nights<br />feel sometimes.
                </div>
              </div>
            </div>
            {/* Act 2 */}
            <div className="ob-ca ca-b" id="ca2" style={{ textAlign: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', lineHeight: 1.65, letterSpacing: -0.1, marginBottom: 20 }}>
                  Children don't remember<br />the nights they fell asleep quickly.
                </div>
                <div style={{ width: 28, height: 1, background: 'rgba(246,197,111,.2)', margin: '0 auto 20px' }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 25, fontWeight: 700, color: 'rgba(244,239,232,.92)', lineHeight: 1.22, letterSpacing: -0.4 }}>
                  They remember the nights<br />someone made something<br />just for them.
                </div>
              </div>
            </div>
            {/* Act 3 */}
            <div className="ob-ca ca-r" id="ca3" style={{ textAlign: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.34)', lineHeight: 1.7, letterSpacing: -0.15, marginBottom: 10 }}>
                  This isn't about an app.
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 400, color: 'rgba(244,239,232,.5)', lineHeight: 1.55, letterSpacing: -0.2, marginBottom: 22 }}>
                  It's about sitting with your child<br />at the end of the day&mdash;
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 900, color: '#F6C56F', letterSpacing: -0.9, lineHeight: 1, textShadow: '0 0 48px rgba(246,197,111,.18)' }}>
                  and staying.
                </div>
              </div>
            </div>
            {/* Act 4 */}
            <div className="ob-ca ca-s" id="ca4" style={{ textAlign: 'center' }}>
              <div style={{ width: '100%' }}>
                <div id="ca4l1" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'rgba(246,197,111,.45)', marginBottom: 28, opacity: 0, transform: 'translateY(8px)', transition: 'opacity .7s ease, transform .7s ease' }}>
                  Each night
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 36 }}>
                  {[
                    { t: 'You sit together.', w: 700, op: 0.88, id: 'ca4l2', s: false },
                    { t: 'The DreamKeeper arrives.', w: 400, op: 0.65, id: 'ca4l2b', s: false },
                    { t: 'And it becomes yours.', w: 300, op: 0.45, id: 'ca4l3', s: true },
                  ].map((l, i) => (
                    <div key={l.id} id={l.id} style={{
                      opacity: 0, transform: 'translateY(10px)',
                      transition: 'opacity .75s ease, transform .75s ease',
                      padding: i === 0 ? '0 0 18px' : '18px 0',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,.045)' : 'none',
                    }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: l.w, fontStyle: l.s ? 'italic' : 'normal', color: `rgba(244,239,232,${l.op})`, lineHeight: 1.42, letterSpacing: -0.25 }}>
                        {l.t}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ opacity: p2CtaVisible ? 1 : 0, transform: p2CtaVisible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity .6s ease, transform .6s ease' }}>
                  <button className="ob-cta" onClick={() => setStep(3)}>Continue</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── P4: Commit (3-night promise) ────────────────────────────── */}
      {step === 3 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 24%, rgba(15,8,48,.98), #060912 60%)' }}>
          <WhisperBackground />
          <div className="ob-ct" style={{ padding: '72px 32px 36px', gap: 0 }}>
            <div style={fadeUp(0.1)}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[
                  { n: '1', label: 'Tonight', active: true },
                  { n: '2', label: 'Tomorrow', active: false },
                  { n: '3', label: 'Night 3', active: false, fire: true },
                ].map(night => (
                  <div key={night.n} style={{
                    flex: 1, padding: '12px 8px', borderRadius: 14,
                    background: night.active ? 'rgba(246,197,111,.1)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${night.active ? 'rgba(246,197,111,.3)' : 'rgba(255,255,255,.07)'}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: night.active ? 'rgba(246,197,111,.9)' : 'rgba(234,242,255,.3)', lineHeight: 1, marginBottom: 3 }}>
                      {night.n}{night.fire ? ' \uD83D\uDD25' : ''}
                    </div>
                    <div style={{ fontSize: 8.5, color: `rgba(234,242,255,${night.active ? '.55' : '.22'})`, fontFamily: "'DM Mono', monospace", letterSpacing: 0.4 }}>
                      {night.label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...fadeUp(0.35), width: '100%', marginBottom: 24, marginTop: 26 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: 'rgba(244,239,232,.94)', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 18 }}>
                The first few nights<br />are where something<br />clicks.
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.44)', lineHeight: 1.55, letterSpacing: -0.15 }}>
                Stay with it for three nights&hellip;<br />and it starts becoming<br />your thing.
              </div>
            </div>
            <div style={fadeUp(1)}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(234,242,255,.2)', letterSpacing: 0.5, marginBottom: 18 }}>3 minutes a night.</div>
              <button className="ob-cta" onClick={() => setStep(4)}>We'll try 3 nights</button>
            </div>
          </div>
        </div>
      )}

      {/* ── P5: Future pacing ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 36%, rgba(14,8,46,.99), #060912 66%)' }}>
          <WhisperBackground />
          <div style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%,-50%)', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.04), transparent 68%)', animation: 'ob-whisperPulse 7s ease-in-out infinite', pointerEvents: 'none' }} />
          <div className="ob-ct" style={{ padding: '0 42px', gap: 0 }}>
            <div style={{ ...fadeUp(0.3), width: '100%', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.48)', lineHeight: 1.3, letterSpacing: -0.3 }}>
                Three nights from now&hellip;
              </div>
            </div>
            <div style={{ height: 20 }} />
            <div style={{ ...fadeUp(1.5), width: '100%', marginBottom: 62 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: 'rgba(244,239,232,.9)', lineHeight: 1.28, letterSpacing: -0.4 }}>
                they'll be waiting to see<br />what happens next.
              </div>
            </div>
            <div style={fadeUp(2.8)}>
              <button className="ob-cta" onClick={() => setStep(5)}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── P6: Name + Age + Pronoun entry ──────────────────────────── */}
      {step === 5 && (
        <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(16,10,50,.98), #060912 58%)' }}>
          <WhisperBackground />
          <div className="ob-ct" style={{ padding: '72px 28px 36px', gap: 0 }}>
            <div style={{ ...fadeUp(0.1), width: '100%', marginBottom: 26, textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#F6C56F', letterSpacing: 1.6, textTransform: 'uppercase' as const, marginBottom: 12 }}>
                The DreamKeeper is waiting
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: 'rgba(244,239,232,.94)', lineHeight: 1.18, letterSpacing: -0.5, marginBottom: 8 }}>
                This is where it<br />becomes theirs.
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(234,242,255,.32)', lineHeight: 1.65 }}>
                Their name shapes the story.<br />It lives in every night.
              </div>
            </div>

            {/* Name input with corner brackets */}
            <div style={{ ...fadeUp(0.3), width: '100%', marginBottom: 16, position: 'relative' }}>
              {/* Corner brackets */}
              {[
                { top: -5, left: -5, borderTop: '1.5px solid rgba(246,197,111,.28)', borderLeft: '1.5px solid rgba(246,197,111,.28)', borderRadius: '3px 0 0 0' },
                { top: -5, right: -5, borderTop: '1.5px solid rgba(246,197,111,.28)', borderRight: '1.5px solid rgba(246,197,111,.28)', borderRadius: '0 3px 0 0' },
                { bottom: -5, left: -5, borderBottom: '1.5px solid rgba(246,197,111,.28)', borderLeft: '1.5px solid rgba(246,197,111,.28)', borderRadius: '0 0 0 3px' },
                { bottom: -5, right: -5, borderBottom: '1.5px solid rgba(246,197,111,.28)', borderRight: '1.5px solid rgba(246,197,111,.28)', borderRadius: '0 0 3px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 12, height: 12, ...s } as React.CSSProperties} />
              ))}
              <input
                className="ob-p-input"
                placeholder="Their name..."
                value={childName}
                onChange={e => setChildName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Age selector */}
            <div style={{ ...fadeUp(0.4), width: '100%', marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(234,242,255,.3)', letterSpacing: 0.7, marginBottom: 8, textAlign: 'left' }}>AGE</div>
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
            <div style={{ ...fadeUp(0.48), width: '100%', marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(234,242,255,.3)', letterSpacing: 0.7, marginBottom: 8, textAlign: 'left' }}>PRONOUN</div>
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

            {/* Preview */}
            <div style={{ ...fadeUp(0.55), width: '100%', marginBottom: 22 }}>
              <div style={{ padding: '11px 16px', background: 'rgba(246,197,111,.07)', border: '1px solid rgba(246,197,111,.16)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 16, lineHeight: 1 }}>&#10022;</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(246,197,111,.65)', letterSpacing: 0.3 }}>
                  {nameValid
                    ? `Tonight's story will be made for ${childName.trim()}`
                    : "Enter their name to begin"}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={fadeUp(0.65)}>
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
