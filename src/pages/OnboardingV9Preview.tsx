/**
 * OnboardingV9Preview — standalone screen-by-screen preview of the full v9
 * onboarding flow. No auth required. Forward/back nav overlay.
 *
 * Access via: /?view=v9-preview
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ParentOnboarding from './ParentOnboarding';
import CinematicTransition from '../components/onboarding/CinematicTransition';
import NightDashboard from './NightDashboard';
import Night3Story from './Night3Story';
import HatchCeremony from '../components/onboarding/HatchCeremony';
import PostHatch from './PostHatch';
import '../components/onboarding/onboarding.css';

// All preview screens in order
const SCREEN_IDS = [
  // Parent flow (P2 merged into P3 cinematic — auto-advances like v9)
  'p1-battle', 'p3-cinematic', 'p4-commit', 'p5-future', 'p6-name',
  // Transition
  'cinematic-transition',
  // Night 1 (c0-c8 from v9)
  'n1-welcome', 'n1-lore', 'n1-share',
  'n1-story', 'n1-egg-gift', 'n1-crack',  // c3, c4, c5 from v9
  'n1-post-story', 'n1-card', 'n1-tuck-in',
  // Night 2
  'n2-return', 'n2-question', 'n2-post-story',
  // Night 3
  'n3-dashboard', 'n3-story', 'hatch-ceremony',
  // Post-hatch
  'post-hatch',
] as const;

type ScreenId = typeof SCREEN_IDS[number];

const SCREEN_LABELS: Record<ScreenId, string> = {
  'p1-battle': 'P1 · Battle',
  'p3-cinematic': 'P2-P5 · Cinematic',
  'p4-commit': 'P4 · Commit',
  'p5-future': 'P5 · Future',
  'p6-name': 'P6 · Name',
  'cinematic-transition': '\u25B6 Cinematic Transition',
  'n1-welcome': 'C1 · Welcome',
  'n1-lore': 'C2 · Lore',
  'n1-share': 'C3 · Share',
  'n1-story': 'C4 · Story',
  'n1-egg-gift': 'C5 · Egg Gift',
  'n1-crack': 'C6 · Crack',
  'n1-post-story': 'C7 · Close',
  'n1-card': 'C8 · Night Card',
  'n1-tuck-in': 'C9 · Tuck In',
  'n2-return': 'N2 · Return',
  'n2-question': 'N2 · Question',
  'n2-post-story': 'N2 · Post-Story',
  'n3-dashboard': 'N3 · Dashboard',
  'n3-story': 'N3 · The Choosing',
  'hatch-ceremony': '\u25B6 Hatch Ceremony',
  'post-hatch': 'Post-Hatch',
};

const GROUP_COLORS: Record<string, string> = {
  'P': '#F6C56F',
  'T': '#B8A1FF',
  'N1': '#F6C56F',
  'N2': '#14d890',
  'N3': '#ff82b8',
  'H': '#ff82b8',
};

function getGroup(id: ScreenId): string {
  if (id.startsWith('p')) return 'P';
  if (id === 'cinematic-transition') return 'T';
  if (id.startsWith('n1')) return 'N1';
  if (id.startsWith('n2')) return 'N2';
  if (id.startsWith('n3') || id === 'hatch-ceremony') return 'N3';
  return 'H';
}

// ── Isolated Parent Step Renderer ────────────────────────────────────────────
// The real ParentOnboarding manages its own step state internally.
// For the preview, we render individual steps by wrapping the component
// and intercepting at the right step. Simpler approach: render screen-specific
// mini-components that show the visual without full orchestration.

import WhisperBackground from '../components/onboarding/WhisperBackground';
import StarBackground from '../components/onboarding/StarBackground';
import ElderDreamKeeper from '../components/onboarding/ElderDreamKeeper';
import DreamEgg from '../components/onboarding/DreamEgg';
import MoonProgress from '../components/onboarding/MoonProgress';

const CHILD_NAME = 'Adina';
const SMILE_ANSWER = 'something silly';
const TALENT_ANSWER = 'making things';

const fadeUp = (delay: number): React.CSSProperties => ({
  animation: `ob-fadeUp 0.6s ${delay}s ease both`, opacity: 0,
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function OnboardingV9Preview() {
  const [idx, setIdx] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const screenId = SCREEN_IDS[idx];

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(SCREEN_IDS.length - 1, i + 1)), []);

  // Keyboard nav
  useMemo(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // ── Screen renderer ──────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (screenId) {
      // ── PARENT SCREENS ─────────────────────────────────────────────────
      case 'p1-battle':
        return <P1Battle />;
      case 'p3-cinematic':
        return <P3Cinematic />;
      case 'p4-commit':
        return <P4Commit />;
      case 'p5-future':
        return <P5Future />;
      case 'p6-name':
        return <P6Name />;

      // ── TRANSITION ─────────────────────────────────────────────────────
      case 'cinematic-transition':
        return <CinematicTransition childName={CHILD_NAME} onComplete={next} />;

      // ── NIGHT 1 ────────────────────────────────────────────────────────
      case 'n1-welcome':
        return <N1Welcome />;
      case 'n1-lore':
        return <N1Lore />;
      case 'n1-share':
        return <N1Share />;
      case 'n1-story':
        return <N1Story />;
      case 'n1-egg-gift':
        return <N1EggGift />;
      case 'n1-crack':
        return <N1Crack />;
      case 'n1-post-story':
        return <N1PostStory />;
      case 'n1-card':
        return <N1Card />;
      case 'n1-tuck-in':
        return <N1TuckIn />;

      // ── NIGHT 2 ────────────────────────────────────────────────────────
      case 'n2-return':
        return <N2Return />;
      case 'n2-question':
        return <N2Question />;
      case 'n2-post-story':
        return <N2PostStory />;

      // ── NIGHT 3 ────────────────────────────────────────────────────────
      case 'n3-dashboard':
        return <N3Dashboard />;
      case 'n3-story':
        return <Night3Story childName={CHILD_NAME} onComplete={next} />;
      case 'hatch-ceremony':
        return <HatchCeremony childName={CHILD_NAME} creatureEmoji="🐰" onComplete={next} />;

      // ── POST-HATCH ─────────────────────────────────────────────────────
      case 'post-hatch':
        return <PostHatch childName={CHILD_NAME} creatureEmoji="🐰" creatureName="Moon Bunny" onComplete={() => setIdx(0)} />;

      default:
        return null;
    }
  };

  const groupColor = GROUP_COLORS[getGroup(screenId)] || '#F6C56F';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020408', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Mobile phone container */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 430, height: '100%',
        maxHeight: typeof window !== 'undefined' && window.innerWidth > 480 ? 'min(100vh - 120px, 860px)' : '100%',
        overflow: 'hidden', background: '#060912',
        borderRadius: typeof window !== 'undefined' && window.innerWidth > 480 ? 40 : 0,
        border: typeof window !== 'undefined' && window.innerWidth > 480 ? '1.5px solid rgba(255,255,255,.08)' : 'none',
        boxShadow: typeof window !== 'undefined' && window.innerWidth > 480 ? '0 0 0 1px rgba(255,255,255,.03), 0 60px 140px rgba(0,0,0,.94)' : 'none',
        marginTop: typeof window !== 'undefined' && window.innerWidth > 480 ? 12 : 0,
        contain: 'layout style paint',
        transform: 'translateZ(0)',
        flexShrink: 0,
      }}>
        <div key={screenId} style={{ position: 'absolute', inset: 0 }}>
          {renderScreen()}
        </div>
      </div>

      {/* ── NAV OVERLAY (outside the phone container) ──────────────────── */}
      <div style={{
        width: '100%', maxWidth: 430,
        background: 'rgba(2,4,8,.95)',
        padding: '12px 16px 16px',
        flexShrink: 0,
      }}>
        {/* Screen picker (collapsible) */}
        {navOpen && (
          <div style={{
            marginBottom: 12, maxHeight: 200, overflowY: 'auto',
            display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center',
          }}>
            {SCREEN_IDS.map((id, i) => {
              const gc = GROUP_COLORS[getGroup(id)] || '#F6C56F';
              return (
                <button
                  key={id}
                  onClick={() => { setIdx(i); setNavOpen(false); }}
                  style={{
                    padding: '4px 10px', borderRadius: 14, fontSize: 9,
                    fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
                    border: `1px solid ${i === idx ? gc : 'rgba(255,255,255,.1)'}`,
                    background: i === idx ? `${gc}18` : 'transparent',
                    color: i === idx ? gc : 'rgba(255,255,255,.35)',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {SCREEN_LABELS[id]}
                </button>
              );
            })}
          </div>
        )}

        {/* Main controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={prev} disabled={idx === 0} style={{
            width: 40, height: 40, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)',
            color: idx === 0 ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.7)',
            fontSize: 16, cursor: idx === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ←
          </button>

          <button
            onClick={() => setNavOpen(v => !v)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: `1px solid ${groupColor}33`,
              background: `${groupColor}0D`,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: `${groupColor}AA`, letterSpacing: 0.8 }}>
              {idx + 1} / {SCREEN_IDS.length}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, color: '#F4EFE8', marginTop: 2 }}>
              {SCREEN_LABELS[screenId]}
            </div>
          </button>

          <button onClick={next} disabled={idx === SCREEN_IDS.length - 1} style={{
            width: 40, height: 40, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)',
            color: idx === SCREEN_IDS.length - 1 ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.7)',
            fontSize: 16, cursor: idx === SCREEN_IDS.length - 1 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ISOLATED SCREEN COMPONENTS (static renders of each screen for preview)
// ═══════════════════════════════════════════════════════════════════════════════

function P1Battle() {
  const pillsRef = useRef<HTMLDivElement>(null);
  const [h1Vis, setH1Vis] = useState(false);
  const [h2Vis, setH2Vis] = useState(false);
  const [ctaVis, setCtaVis] = useState(false);

  useEffect(() => {
    const pills = pillsRef.current?.querySelectorAll('.ob-dp-seq');
    if (!pills) return;
    const N = pills.length, STEP = 1100;
    const timers: number[] = [];

    // Sequential pill reveal: each activates, previous dims
    pills.forEach((p, i) => {
      timers.push(window.setTimeout(() => {
        p.classList.add('dp-active');
        if (i > 0) { pills[i - 1].classList.remove('dp-active'); pills[i - 1].classList.add('dp-dim'); }
      }, i * STEP));
    });
    // Last pill dims
    timers.push(window.setTimeout(() => {
      pills[N - 1].classList.remove('dp-active');
      pills[N - 1].classList.add('dp-dim');
    }, N * STEP + 350));
    // Headlines staggered after pills
    const hBase = N * STEP + 1100;
    timers.push(window.setTimeout(() => setH1Vis(true), hBase));
    timers.push(window.setTimeout(() => setH2Vis(true), hBase + 950));
    timers.push(window.setTimeout(() => setCtaVis(true), hBase + 2300));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="ob-slide" style={{ background: 'linear-gradient(180deg, #060912, #080c1a)' }}>
      <WhisperBackground />
      <div className="ob-ct" style={{ padding: '60px 28px 44px', gap: 0, justifyContent: 'center' }}>
        <div ref={pillsRef} style={{ overflow: 'hidden', maxHeight: 120, marginBottom: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center', maxWidth: 290, margin: '0 auto' }}>
            {['just five more minutes', "I'm not tired", 'I need water', 'one more show', "I can't sleep"].map(t => (
              <span key={t} className="ob-dp-seq">{t}</span>
            ))}
          </div>
        </div>
        <div style={{
          opacity: h1Vis ? 1 : 0, transform: h1Vis ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity .9s ease, transform .9s ease', marginBottom: 8, width: '100%',
        }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 200, fontStyle: 'italic', fontSize: 'clamp(34px, 10vw, 46px)', letterSpacing: -2, color: 'rgba(244,239,232,.96)', lineHeight: 1.08 }}>
            Bedtime is a battle.
          </div>
        </div>
        <div style={{
          opacity: h2Vis ? 1 : 0, transform: h2Vis ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity .9s ease, transform .9s ease', marginBottom: 52, width: '100%',
        }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 200, fontStyle: 'italic', fontSize: 'clamp(28px, 8vw, 38px)', letterSpacing: -1.5, color: '#F5B84C', lineHeight: 1 }}>
            Until it isn't.
          </div>
        </div>
        <div style={{ opacity: ctaVis ? 1 : 0, transition: 'opacity .7s ease', width: '100%' }}>
          <button className="ob-cta" style={{ fontSize: 16 }}>Continue</button>
        </div>
      </div>
    </div>
  );
}


function P3Cinematic() {
  // P2 (Shift) is merged in as a pre-act that auto-advances into the 4-act cinematic
  const actsRef = useRef<HTMLDivElement>(null);
  const progbarRef = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const [ctaVis, setCtaVis] = useState(false);

  useEffect(() => {
    const container = actsRef.current;
    if (!container) return;
    const timers: number[] = [];

    // Phase 0: P2 Shift screen (4.4s) then fade out into Act 1
    const p2 = p2Ref.current;
    if (p2) p2.classList.add('live');
    // P2 progress bar
    timers.push(window.setTimeout(() => {
      const bar = progbarRef.current;
      if (!bar) return;
      bar.style.transition = 'none'; bar.style.width = '0%'; bar.offsetWidth;
      bar.style.transition = 'width 4100ms linear'; bar.style.width = '100%';
    }, 200));

    const acts = [
      { id: 'pca1', dur: 5000, exit: 'translateX(-14px)' },
      { id: 'pca2', dur: 5800, exit: 'translateY(-12px)' },
      { id: 'pca3', dur: 5000, exit: 'translateX(-12px)' },
      { id: 'pca4', dur: null as number | null },
    ];

    function setBar(ms: number) {
      const bar = progbarRef.current;
      if (!bar) return;
      bar.style.transition = 'none'; bar.style.width = '0%'; bar.offsetWidth;
      bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%';
    }
    function clearBar() {
      const bar = progbarRef.current;
      if (!bar) return;
      bar.style.transition = 'width .3s ease'; bar.style.width = '0%';
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
          clearBar(); el.classList.remove('live'); el.style.transform = a.exit; el.style.opacity = '0';
          timers.push(window.setTimeout(() => run(i + 1), 260));
        }, a.dur!));
        return;
      }
      timers.push(window.setTimeout(() => setBar(3800), 200));
      ['pca4l1','pca4l2','pca4l2b','pca4l3'].forEach((lid, j) => {
        timers.push(window.setTimeout(() => {
          const ln = container!.querySelector(`#${lid}`) as HTMLElement | null;
          if (ln) { ln.style.opacity = '1'; ln.style.transform = 'translateY(0)'; }
        }, 400 + j * 620));
      });
      timers.push(window.setTimeout(() => {
        const wb = container!.querySelector('#pwarmbloom') as HTMLElement | null;
        if (wb) { wb.style.opacity = '1'; timers.push(window.setTimeout(() => { wb.style.opacity = '0'; }, 1800)); }
      }, 900));
      timers.push(window.setTimeout(() => setCtaVis(true), 2600));
    }

    // After 4.4s, fade out P2 and start Act 1
    timers.push(window.setTimeout(() => {
      if (p2) { p2.classList.remove('live'); p2.style.opacity = '0'; }
      clearBar();
      timers.push(window.setTimeout(() => run(0), 350));
    }, 4400));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(12,7,44,.99), #050710 70%)' }}>
      <WhisperBackground />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.038) 0%, transparent 68%)', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'ob-glowDrift 22s ease-in-out infinite', pointerEvents: 'none' }} />
      <div id="pwarmbloom" style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.08) 0%, transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0, transition: 'opacity 1.2s ease', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 28, left: 32, right: 32, height: 1, background: 'rgba(244,239,232,.06)', zIndex: 10, borderRadius: 1 }}>
        <div ref={progbarRef} style={{ height: '100%', width: '0%', background: 'rgba(246,197,111,.28)', borderRadius: 1 }} />
      </div>
      <div ref={actsRef} style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
        {/* P2 Shift (pre-act, auto-advances after 4.4s) */}
        <div className="ob-ca ca-b" id="p2pre" ref={p2Ref} style={{ textAlign: 'center', padding: '72px 38px 36px' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 700, color: 'rgba(244,239,232,.9)', lineHeight: 1.2, letterSpacing: -0.55, marginBottom: 24, animation: 'ob-fadeUp .7s .3s ease both', opacity: 0 }}>
              The day pulls you<br />in a thousand<br />directions.
            </div>
            <div style={{ width: 28, height: 1, background: 'rgba(246,197,111,.28)', marginBottom: 18, animation: 'ob-fadeUp .7s .8s ease both', opacity: 0 }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.44)', lineHeight: 1.5, letterSpacing: -0.2, animation: 'ob-fadeUp .7s 1.1s ease both', opacity: 0 }}>
              And bedtime&hellip;<br />is the only moment<br />that slows down.
            </div>
          </div>
        </div>
        {/* Act 1 */}
        <div className="ob-ca ca-l" id="pca1" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 600, color: 'rgba(244,239,232,.9)', lineHeight: 1.22, letterSpacing: -0.4, marginBottom: 16 }}>You're not doing<br />anything wrong.</div>
            <div style={{ width: 24, height: 1, background: 'rgba(180,161,255,.28)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.38)', lineHeight: 1.6 }}>This is just how nights<br />feel sometimes.</div>
          </div>
        </div>
        {/* Act 2 */}
        <div className="ob-ca ca-b" id="pca2" style={{ textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', lineHeight: 1.65, marginBottom: 20 }}>Children don't remember<br />the nights they fell asleep quickly.</div>
            <div style={{ width: 28, height: 1, background: 'rgba(246,197,111,.2)', margin: '0 auto 20px' }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 25, fontWeight: 700, color: 'rgba(244,239,232,.92)', lineHeight: 1.22, letterSpacing: -0.4 }}>They remember the nights<br />someone made something<br />just for them.</div>
          </div>
        </div>
        {/* Act 3 */}
        <div className="ob-ca ca-r" id="pca3" style={{ textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.34)', lineHeight: 1.7, marginBottom: 10 }}>This isn't about an app.</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 400, color: 'rgba(244,239,232,.5)', lineHeight: 1.55, marginBottom: 22 }}>It's about sitting with your child<br />at the end of the day&mdash;</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 900, color: '#F6C56F', letterSpacing: -0.9, lineHeight: 1, textShadow: '0 0 48px rgba(246,197,111,.18)' }}>and staying.</div>
          </div>
        </div>
        {/* Act 4 */}
        <div className="ob-ca ca-s" id="pca4" style={{ textAlign: 'center' }}>
          <div style={{ width: '100%' }}>
            <div id="pca4l1" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'rgba(246,197,111,.45)', marginBottom: 28, opacity: 0, transform: 'translateY(8px)', transition: 'opacity .7s ease, transform .7s ease' }}>Each night</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 36 }}>
              {[
                { t: 'You sit together.', w: 700, op: 0.88, id: 'pca4l2', s: false },
                { t: 'The DreamKeeper arrives.', w: 400, op: 0.65, id: 'pca4l2b', s: false },
                { t: 'And it becomes yours.', w: 300, op: 0.45, id: 'pca4l3', s: true },
              ].map((l, i) => (
                <div key={l.id} id={l.id} style={{ opacity: 0, transform: 'translateY(10px)', transition: 'opacity .75s ease, transform .75s ease', padding: i === 0 ? '0 0 18px' : '18px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,.045)' : 'none' }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: l.w, fontStyle: l.s ? 'italic' : 'normal', color: `rgba(244,239,232,${l.op})`, lineHeight: 1.42, letterSpacing: -0.25 }}>{l.t}</div>
                </div>
              ))}
            </div>
            <div style={{ opacity: ctaVis ? 1 : 0, transform: ctaVis ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity .6s ease, transform .6s ease' }}>
              <button className="ob-cta">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function P4Commit() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 24%, rgba(15,8,48,.98), #060912 60%)' }}>
      <WhisperBackground />
      <div className="ob-ct" style={{ padding: '72px 32px 36px', gap: 0 }}>
        <div style={fadeUp(0.1)}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[{ n: '1', label: 'Tonight', active: true }, { n: '2', label: 'Tomorrow', active: false }, { n: '3', label: 'Night 3', active: false, fire: true }].map(night => (
              <div key={night.n} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: night.active ? 'rgba(246,197,111,.1)' : 'rgba(255,255,255,.03)', border: `1px solid ${night.active ? 'rgba(246,197,111,.3)' : 'rgba(255,255,255,.07)'}`, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: night.active ? 'rgba(246,197,111,.9)' : 'rgba(234,242,255,.3)', lineHeight: 1, marginBottom: 3 }}>{night.n}{night.fire ? ' 🔥' : ''}</div>
                <div style={{ fontSize: 8.5, color: `rgba(234,242,255,${night.active ? '.55' : '.22'})`, fontFamily: "'DM Mono', monospace", letterSpacing: 0.4 }}>{night.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...fadeUp(0.35), width: '100%', marginBottom: 24, marginTop: 26 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: 'rgba(244,239,232,.94)', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 18 }}>The first few nights<br />are where something<br />clicks.</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.44)', lineHeight: 1.55 }}>Stay with it for three nights&hellip;<br />and it starts becoming<br />your thing.</div>
        </div>
        <div style={fadeUp(0.6)}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(234,242,255,.2)', letterSpacing: 0.5, marginBottom: 18 }}>3 minutes a night.</div>
          <button className="ob-cta">We'll try 3 nights</button>
        </div>
      </div>
    </div>
  );
}

function P5Future() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 36%, rgba(14,8,46,.99), #060912 66%)' }}>
      <WhisperBackground />
      <div style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%,-50%)', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.04), transparent 68%)', animation: 'ob-whisperPulse 7s ease-in-out infinite', pointerEvents: 'none' }} />
      <div className="ob-ct" style={{ padding: '0 42px', gap: 0 }}>
        <div style={{ ...fadeUp(0.3), width: '100%', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.48)', lineHeight: 1.3, letterSpacing: -0.3 }}>Three nights from now&hellip;</div>
        </div>
        <div style={{ height: 20 }} />
        <div style={{ ...fadeUp(0.8), width: '100%', marginBottom: 62 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: 'rgba(244,239,232,.9)', lineHeight: 1.28, letterSpacing: -0.4 }}>they'll be waiting to see<br />what happens next.</div>
        </div>
        <div style={fadeUp(1.4)}>
          <button className="ob-cta">Continue</button>
        </div>
      </div>
    </div>
  );
}

function P6Name() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(16,10,50,.98), #060912 58%)' }}>
      <WhisperBackground />
      <div className="ob-ct" style={{ padding: '48px 24px 20px', gap: 0, justifyContent: 'flex-start' }}>
        <div style={{ ...fadeUp(0.1), width: '100%', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#F6C56F', letterSpacing: 1.6, textTransform: 'uppercase' as const, marginBottom: 10 }}>The DreamKeeper is waiting</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: 'rgba(244,239,232,.94)', lineHeight: 1.18, letterSpacing: -0.5 }}>This is where it<br />becomes theirs.</div>
        </div>
        <div style={{ ...fadeUp(0.25), width: '100%', marginBottom: 12, position: 'relative' }}>
          <input className="ob-p-input" value={CHILD_NAME} readOnly style={{ fontSize: 22, padding: '14px 16px' }} />
        </div>
        <div style={{ ...fadeUp(0.35), width: '100%', marginBottom: 10 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(234,242,255,.3)', letterSpacing: 0.7, marginBottom: 6, textAlign: 'left' }}>AGE</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['3','4','5','6','7','8','9','10+'].map(age => (
              <div key={age} style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${age==='6'?'rgba(246,197,111,.55)':'rgba(255,255,255,.08)'}`, background: age==='6'?'rgba(246,197,111,.1)':'rgba(255,255,255,.04)', color: age==='6'?'rgba(246,197,111,.92)':'rgba(234,242,255,.5)', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{age}</div>
            ))}
          </div>
        </div>
        <div style={{ ...fadeUp(0.45), width: '100%', marginBottom: 10 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(234,242,255,.3)', letterSpacing: 0.7, marginBottom: 6, textAlign: 'left' }}>PRONOUN</div>
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
            {['he/him','she/her','they/them'].map(p => (
              <div key={p} style={{ padding: '8px 14px', borderRadius: 22, border: `1.5px solid ${p==='she/her'?'rgba(246,197,111,.55)':'rgba(255,255,255,.08)'}`, background: p==='she/her'?'rgba(246,197,111,.1)':'rgba(255,255,255,.04)', color: p==='she/her'?'rgba(246,197,111,.92)':'rgba(234,242,255,.5)', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500 }}>{p}</div>
            ))}
          </div>
        </div>
        <div style={{ ...fadeUp(0.52), width: '100%', marginBottom: 12 }}>
          <div style={{ padding: '9px 14px', background: 'rgba(246,197,111,.07)', border: '1px solid rgba(246,197,111,.16)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14 }}>{'\uD83C\uDF19'}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(246,197,111,.65)', letterSpacing: 0.3 }}>Tonight's story will be made for {CHILD_NAME}</div>
          </div>
        </div>
        <div style={{ ...fadeUp(0.6), width: '100%', flexShrink: 0 }}>
          <button className="ob-cta">Start {CHILD_NAME}'s first night</button>
          <button className="ob-ghost" style={{ marginBottom: 6 }}>Start when they're with you</button>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(234,242,255,.2)', letterSpacing: 0.4, textAlign: 'center' }}>Takes about 3 minutes</div>
        </div>
      </div>
    </div>
  );
}

// ── Night 1 screens ──────────────────────────────────────────────────────────

function N1Welcome() {
  // Constellation name SVG — simple dots+lines spelling the child's name
  const name = CHILD_NAME.toUpperCase();
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 28%, rgba(50,25,110,.9), #060912 65%)' }}>
      <StarBackground />
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5, ...fadeUp(0.2) }}>
        {/* Constellation name */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 4, color: 'rgba(246,197,111,.55)', marginBottom: 12, textAlign: 'center' }}>{name}</div>
        <svg viewBox="0 0 280 20" width="280" height="20" style={{ marginBottom: 16, display: 'block' }}>
          {Array.from({length: 14}, (_, i) => {
            const x = 20 + i * 18 + (Math.sin(i*2.1)*6);
            const y = 4 + Math.sin(i*1.7)*7 + 6;
            return <circle key={i} cx={x} cy={y} r={i%3===0?2.5:1.6} fill={`rgba(246,197,111,${i%3===0?.85:.55})`} style={{animation: `ob-starTwinkle ${(2+i*.3).toFixed(1)}s ${(i*.2).toFixed(1)}s ease-in-out infinite`}} />;
          })}
          {Array.from({length: 10}, (_, i) => {
            const x1 = 20 + i * 18 + (Math.sin(i*2.1)*6);
            const y1 = 4 + Math.sin(i*1.7)*7 + 6;
            const x2 = 20 + (i+1) * 18 + (Math.sin((i+1)*2.1)*6);
            const y2 = 4 + Math.sin((i+1)*1.7)*7 + 6;
            return <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(246,197,111,.22)" strokeWidth=".8" />;
          })}
        </svg>
        <div style={{ animation: 'ob-elderFloat 4.4s ease-in-out infinite', transform: 'scale(0.8)', transformOrigin: 'top center' }}><ElderDreamKeeper animate={false} /></div>
      </div>
      <div className="ob-ct bottom" style={{ paddingBottom: 36 }}>
        <div style={{ ...fadeUp(0.5), width: '100%' }}>
          <div className="ob-ey">Your first night</div>
          <div className="ob-h1" style={{ fontSize: 26, marginBottom: 8 }}>"Welcome, <em>{CHILD_NAME}</em>.<br />We have been<br />waiting for you."</div>
          <div className="ob-sub" style={{ fontSize: 13, marginBottom: 20 }}>The Elder DreamKeeper has a gift — and a story — just for you.</div>
          <button className="ob-cta">Begin</button>
        </div>
      </div>
    </div>
  );
}

function N1Lore() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 22%, rgba(25,14,70,.88), #060912 55%)' }}>
      <StarBackground opacity={0.65} />
      <div className="ob-ct" style={{ paddingTop: 44, justifyContent: 'flex-start' }}>
        <div style={{ animation: 'ob-fadeIn .6s ease both', marginBottom: 14, transform: 'scale(0.7)', transformOrigin: 'top center' }}><ElderDreamKeeper /></div>
        <div style={{ background: 'rgba(184,161,255,.1)', border: '1px solid rgba(184,161,255,.25)', borderRadius: '20px 20px 20px 5px', padding: '14px 16px', marginBottom: 14, textAlign: 'left', ...fadeUp(0.15), width: '100%' }}>
          <div style={{ fontSize: 8.5, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 6 }}>THE ELDER DREAMKEEPER</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.52 }}>"There are beings called DreamKeepers.<br /><br />They don't belong to everyone.<br /><br />Each one chooses a single child&hellip; to watch over, learn from, and grow beside."</div>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', marginBottom: 16, lineHeight: 1.65, ...fadeUp(0.25) }}>"Tonight, your journey begins."</div>
        <button className="ob-cta" style={fadeUp(0.35)}>Tell me more</button>
      </div>
    </div>
  );
}

function N1Share() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(246,197,111,.07), #060912 54%)' }}>
      <StarBackground opacity={0.55} />
      <div className="ob-ct" style={{ paddingTop: 44, gap: 0, justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div style={{ transform: 'scale(.55)', transformOrigin: 'top center' }}><ElderDreamKeeper /></div>
        </div>
        <div style={{ background: 'rgba(246,197,111,.08)', border: '1px solid rgba(246,197,111,.2)', borderRadius: '20px 20px 20px 5px', padding: '12px 14px', marginBottom: 8, textAlign: 'left', width: '100%' }}>
          <div style={{ fontSize: 8, color: 'rgba(246,197,111,.55)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 4 }}>THE DREAMKEEPER</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5 }}>"Hello, {CHILD_NAME}.<br /><br />Tell me something — what made you smile today?"</div>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(246,197,111,.35)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, marginBottom: 8 }}>THE EGG IS LISTENING TOO</div>
        <div className="ob-chips" style={{ marginBottom: 14 }}>
          {['Playing','A hug','My pet','Something silly','Being outside','Something else'].map(o => (
            <div key={o} className={`ob-chip ${o===SMILE_ANSWER?'sel':''}`}>{o}</div>
          ))}
        </div>
        <button className="ob-cta" style={{ flexShrink: 0 }}>Start tonight's story &rarr;</button>
      </div>
    </div>
  );
}

function N1Story() {
  const storyText = `Long after the lamps were dim and the world had grown quiet, ${CHILD_NAME} noticed a soft golden light drifting through the dark — like it knew exactly where to go.`;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#060912' }}>
      <div style={{ height: '52%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(50,25,110,.85), #060912 65%)' }}>
          <StarBackground opacity={0.7} count={32} />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 88, background: 'linear-gradient(to bottom, transparent, #060912)', zIndex: 10 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px', background: '#060912', position: 'relative' }}>
        <MoonProgress current={0} total={7} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16.5, color: 'rgba(244,239,232,.96)', lineHeight: 1.75, letterSpacing: 0.01, animation: 'ob-fadeUp .35s ease both' }}>{storyText}</div>
        </div>
        <div style={{ padding: '0 0 26px' }}><button className="ob-cta">Next &rarr;</button></div>
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(234,242,255,.65)', fontSize: 12 }}>&larr;</span>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 10, fontStyle: 'italic', color: 'rgba(244,239,232,.4)' }}>The Night You Were Chosen</div>
        <div style={{ width: 34 }} />
      </div>
    </div>
  );
}

function N1EggGift() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(40,20,100,.78), #060912 62%)' }}>
      <StarBackground opacity={0.8} />
      <div className="ob-ct" style={{ paddingTop: 44, gap: 0, justifyContent: 'flex-start' }}>
        {/* Elder clipped to 130px */}
        <div style={{ width: 210, height: 110, position: 'relative', overflow: 'hidden', margin: '0 auto 10px' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scale(.52)', transformOrigin: 'bottom center' }}><ElderDreamKeeper animate={false} /></div>
        </div>
        {/* Egg */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, animation: 'ob-eggAppear .8s .1s ease both', opacity: 0 }}>
          <DreamEgg state="gifted" size="sm" />
        </div>
        {/* Speech */}
        <div style={{ background: 'rgba(184,161,255,.09)', border: '1px solid rgba(184,161,255,.24)', borderRadius: '20px 20px 20px 5px', padding: '12px 14px', marginBottom: 8, textAlign: 'left', ...fadeUp(0.2), width: '100%' }}>
          <div style={{ fontSize: 8, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 4 }}>THE ELDER DREAMKEEPER</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5 }}>"This egg will become your DreamKeeper. It listens to what you share — that's how it knows who it belongs to."</div>
        </div>
        {/* Echo card */}
        <div style={{ padding: '10px 14px', background: 'rgba(184,161,255,.07)', border: '1px solid rgba(184,161,255,.18)', borderRadius: 14, marginBottom: 10, textAlign: 'left', ...fadeUp(0.3), width: '100%' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(184,161,255,.55)', letterSpacing: 0.7, marginBottom: 4 }}>THE EGG HEARD YOU</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(234,242,255,.65)', lineHeight: 1.5 }}>"You shared that {SMILE_ANSWER} made you smile. It's holding onto that."</div>
        </div>
        <button className="ob-cta" style={fadeUp(0.4)}>Tap the egg &rarr;</button>
      </div>
    </div>
  );
}

function N1Crack() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(80,40,180,.26), #060912 58%)' }}>
      <StarBackground opacity={0.75} />
      {/* Elder clipped to 110px */}
      <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 8, width: 210, height: 100, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scale(.46)', transformOrigin: 'bottom center' }}><ElderDreamKeeper animate={false} /></div>
      </div>
      {/* Cracked egg centered */}
      <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
        <DreamEgg state="cracked" size="sm" />
      </div>
      {/* Speech */}
      <div style={{ position: 'absolute', top: 148, left: 24, right: 24, zIndex: 8, background: 'rgba(184,161,255,.1)', border: '1px solid rgba(184,161,255,.25)', borderRadius: '20px 20px 20px 5px', padding: '12px 14px', textAlign: 'left' }}>
        <div style={{ fontSize: 8, color: 'rgba(184,161,255,.6)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 4 }}>THE DREAMKEEPER</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5 }}>"That crack appeared because you were here tonight.<br /><br />The egg heard about <em style={{color:'#F6C56F'}}>{SMILE_ANSWER}</em>. It's holding onto that."</div>
      </div>
      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 80, left: 24, right: 24, zIndex: 8, padding: '10px 14px', background: 'rgba(246,197,111,.06)', border: '1px solid rgba(246,197,111,.15)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(246,197,111,.55)', letterSpacing: 0.4 }}>DREAM EGG · NIGHT 1 OF 3</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(234,242,255,.25)' }}>Come back tomorrow</div>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '28%', background: 'linear-gradient(90deg, rgba(246,197,111,.5), #F6C56F)', borderRadius: 2 }} />
        </div>
      </div>
      {/* Hint */}
      <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, zIndex: 8, textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(246,197,111,.65)', letterSpacing: 1.8, textTransform: 'uppercase' as const }}>Tap the egg to continue</div>
      </div>
    </div>
  );
}

function N1PostStory() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 44%, rgba(20,8,55,.98), #030408 70%)' }}>
      <StarBackground opacity={0.55} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 44px', textAlign: 'center' }}>
        {/* Ornament */}
        <div style={{ ...fadeUp(0.1), marginBottom: 28 }}>
          <svg viewBox="0 0 80 20" width="80" height="20" fill="none">
            <line x1="0" y1="10" x2="28" y2="10" stroke="rgba(246,197,111,.28)" strokeWidth=".8"/>
            <circle cx="40" cy="10" r="3.5" fill="rgba(246,197,111,.45)"/><circle cx="40" cy="10" r="2" fill="#F6C56F"/>
            <line x1="52" y1="10" x2="80" y2="10" stroke="rgba(246,197,111,.28)" strokeWidth=".8"/>
          </svg>
        </div>
        <div style={{ ...fadeUp(0.3), marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 700, color: 'rgba(244,239,232,.94)', lineHeight: 1.15, letterSpacing: -0.5 }}>That was your first<br />story together.</div>
        </div>
        <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,.1)', margin: '0 auto 24px', ...fadeUp(0.6) }} />
        <div style={{ ...fadeUp(0.9), marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'rgba(246,197,111,.75)', lineHeight: 1.5 }}>You stayed.</div>
        </div>
        <div style={{ ...fadeUp(1.2), marginBottom: 40 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 300, fontStyle: 'italic', color: 'rgba(234,242,255,.36)', lineHeight: 1.65 }}>That matters more than you think.</div>
        </div>
        <div style={fadeUp(1.8)}>
          <button className="ob-cta">Save tonight's memory &rarr;</button>
        </div>
      </div>
    </div>
  );
}

function N1Card() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 26%, rgba(20,80,60,.3), #060912 58%)' }}>
      <StarBackground opacity={0.72} />
      <div className="ob-ct" style={{ paddingTop: 48, justifyContent: 'flex-start' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'rgba(246,197,111,.55)', lineHeight: 1.7, marginBottom: 12, ...fadeUp(0) }}>
          This moment just happened.<br />Most people would have missed it.
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(111,231,221,.62)', letterSpacing: 1.2, marginBottom: 10, ...fadeUp(0.15) }}>
          ✦ TONIGHT'S MEMORY · SAVED
        </div>
        <div className="ob-nc" style={{ animation: 'ob-ncReveal .7s .1s cubic-bezier(.2,.8,.3,1) both', width: 244 }}>
          <div className="ob-nc-sky" style={{ height: 110 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(.4)' }}><DreamEgg state="cracked" size="sm" /></div>
            <div style={{ position: 'absolute', top: 8, left: 10, padding: '3px 8px', background: 'rgba(111,231,221,.2)', border: '1px solid rgba(111,231,221,.4)', borderRadius: 20 }}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, fontWeight: 600, color: 'rgba(111,231,221,.9)' }}>NIGHT 1 · THE EGG FIRST LISTENED</span></div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to bottom, transparent, #f8f4ee)' }} />
          </div>
          <div className="ob-nc-paper">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(26,26,46,.4)', letterSpacing: 0.5, marginBottom: 4 }}>TONIGHT'S MEMORY</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 12, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 5 }}>The Night Your Dream Egg First Listened</div>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 9, color: 'rgba(26,26,46,.55)', lineHeight: 1.55 }}>"Tonight, {CHILD_NAME} shared that {SMILE_ANSWER} made them smile. The Elder DreamKeeper brought a Dream Egg to begin the journey."</div>
          </div>
        </div>
        {/* Italic below card */}
        <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(234,242,255,.32)', marginBottom: 10, lineHeight: 1.65, ...fadeUp(0.4) }}>
          "Every night you read together, it is saved here — <em style={{color:'rgba(246,197,111,.75)', fontStyle:'italic'}}>forever.</em>"
        </div>
        {/* Photo zone */}
        <div style={{ width: '100%', padding: '10px 12px', background: 'rgba(246,197,111,.06)', border: '1.5px dashed rgba(246,197,111,.24)', borderRadius: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, ...fadeUp(0.5) }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(246,197,111,.12)', border: '1px solid rgba(246,197,111,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>{'\uD83D\uDCF7'}</div>
          <div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: 'rgba(246,197,111,.8)' }}>Add a photo — optional</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(234,242,255,.36)', marginTop: 1, letterSpacing: 0.3 }}>TAP TO CAPTURE THIS MOMENT</div>
          </div>
        </div>
        <button className="ob-cta" style={fadeUp(0.6)}>Save to collection &rarr;</button>
      </div>
    </div>
  );
}

function N1TuckIn() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(20,60,50,.35), #060912 62%)' }}>
      <StarBackground opacity={0.88} />
      <div className="ob-ct">
        <div style={{ animation: 'ob-heartbeat 3.5s ease-in-out infinite', marginBottom: 8 }}><DreamEgg state="cracked" size="sm" /></div>
        <div style={{ ...fadeUp(0.3), width: '100%' }}>
          <div className="ob-ey" style={{ marginBottom: 10 }}>Night 1 · Complete</div>
          <div className="ob-h1" style={{ fontSize: 26, marginBottom: 8 }}>"Come back tomorrow.<br /><em>It will be different.</em>"</div>
          <div className="ob-sub" style={{ fontSize: 13, marginBottom: 6 }}>Every story helps it grow.</div>
          <div style={{ padding: '10px 14px', background: 'rgba(184,161,255,.07)', border: '1px solid rgba(184,161,255,.16)', borderRadius: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(184,161,255,.55)', letterSpacing: 0.5, marginBottom: 4 }}>THE ELDER</div>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(234,242,255,.6)', lineHeight: 1.55 }}>"It heard everything tonight. Rest well, {CHILD_NAME}. When the stars return — it will be waiting."</div>
          </div>
          <button className="ob-cta">Say goodnight</button>
          <div style={{ height: 8 }} />
          <button className="ob-ghost">Want more? Create a story.</button>
        </div>
      </div>
    </div>
  );
}

// ── Night 2 screens ──────────────────────────────────────────────────────────

function N2Return() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 28%, rgba(20,50,90,.85), #060912 62%)' }}>
      <StarBackground opacity={0.75} />
      <div className="ob-ct" style={{ justifyContent: 'flex-start', paddingTop: 44 }}>
        <div style={{ animation: 'ob-elderFloat 4.4s ease-in-out infinite', marginBottom: 12, transform: 'scale(0.75)', transformOrigin: 'top center' }}><ElderDreamKeeper animate={false} /></div>
        <div style={{ ...fadeUp(0.2), width: '100%' }}>
          <div className="ob-ey">Night 2 · Welcome back</div>
          <div className="ob-h1" style={{ fontSize: 26, marginBottom: 6 }}>"Welcome back,<br /><em>{CHILD_NAME}.</em>"</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,242,255,.3)', marginBottom: 10, lineHeight: 1.5 }}>It waited for you.</div>
          <div style={{ background: 'rgba(20,216,144,.09)', border: '1px solid rgba(20,216,144,.22)', borderRadius: 18, padding: '12px 14px', marginBottom: 10, textAlign: 'left' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(20,216,144,.6)', letterSpacing: 0.8, marginBottom: 4 }}>YOUR EGG REMEMBERED</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, color: 'rgba(244,239,232,.82)', lineHeight: 1.55 }}>"You told me that {SMILE_ANSWER} made you smile.<br />I've been thinking about that."</div>
          </div>
          <div style={{ padding: '10px 14px', background: 'rgba(184,161,255,.07)', border: '1px solid rgba(184,161,255,.15)', borderRadius: 14, marginBottom: 14, textAlign: 'left' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(234,242,255,.5)', lineHeight: 1.5 }}>"The more you share, the more I understand who you are."</div>
          </div>
          <button className="ob-cta" style={{ background: 'linear-gradient(135deg, rgba(20,216,144,.8), rgba(14,190,120,.8))', color: '#061a12', boxShadow: '0 8px 28px rgba(20,216,144,.2)' }}>Continue &rarr;</button>
        </div>
      </div>
    </div>
  );
}

function N2Question() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 14%, rgba(246,197,111,.05), #060912 50%)' }}>
      <StarBackground opacity={0.5} />
      <div className="ob-ct" style={{ padding: '44px 24px 20px', gap: 0, justifyContent: 'flex-start' }}>
        <div style={{ width: 210, height: 90, position: 'relative', overflow: 'hidden', margin: '0 auto 8px' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scale(.38)', transformOrigin: 'bottom center' }}><ElderDreamKeeper animate={false} /></div>
        </div>
        <div style={{ background: 'rgba(246,197,111,.08)', border: '1px solid rgba(246,197,111,.22)', borderRadius: '20px 20px 20px 5px', padding: '12px 14px', marginBottom: 10, textAlign: 'left', width: '100%' }}>
          <div style={{ fontSize: 8, color: 'rgba(246,197,111,.55)', fontFamily: "'DM Mono', monospace", letterSpacing: 0.7, marginBottom: 4 }}>THE DREAMKEEPER</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.5 }}>"I've been thinking about you since last night.<br /><br />Tell me — what's something you're really good at?"</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', width: '100%', marginBottom: 12 }}>
          {['Making things','Helping others','Running fast','Being kind','Making people laugh','Something else'].map(o => (
            <button key={o} className={`ob-chip ${o===TALENT_ANSWER?'sel':''}`}>{o}</button>
          ))}
        </div>
        <button className="ob-cta">Begin tonight's story &rarr;</button>
      </div>
    </div>
  );
}

function N2PostStory() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(14,48,36,.35), #060912 62%)' }}>
      <StarBackground opacity={0.82} />
      <div className="ob-ct">
        <div style={{ animation: 'ob-nestSettle .7s ease both', marginBottom: 16 }}><DreamEgg state="cracked" size="sm" /></div>
        <div style={{ ...fadeUp(0.2), width: '100%' }}>
          <div className="ob-ey" style={{ marginBottom: 10 }}>Night 2 · Complete</div>
          <div className="ob-h1" style={{ fontSize: 26, marginBottom: 8 }}>"Come back tomorrow.<br /><em>Something is about<br />to change.</em>"</div>
          <div style={{ padding: '10px 14px', background: 'rgba(20,216,144,.07)', border: '1px solid rgba(20,216,144,.16)', borderRadius: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(20,216,144,.55)', letterSpacing: 0.5, marginBottom: 4 }}>TOMORROW NIGHT</div>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(234,242,255,.6)', lineHeight: 1.55 }}>"Tomorrow night&hellip; I think it may start to open."</div>
          </div>
          <button className="ob-cta">Say goodnight</button>
        </div>
      </div>
    </div>
  );
}

function N3Dashboard() {
  return (
    <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(60,10,80,.85), #060912 62%)' }}>
      <StarBackground opacity={0.9} />
      <div className="ob-ct" style={{ paddingTop: 44, gap: 0, justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, ...fadeUp(0.2) }}><DreamEgg state="cracked" size="sm" /></div>
        <div style={{ ...fadeUp(0.5), width: '100%' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,130,184,.65)', letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 10, textAlign: 'center' }}>Night 3 · The Last Night</div>
          <div className="ob-h1" style={{ fontSize: 28, marginBottom: 10, textAlign: 'center' }}>Tonight<br />is <em>different</em>.</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(234,242,255,.44)', lineHeight: 1.75, marginBottom: 14, textAlign: 'center' }}>Three nights of listening.<br />Tonight, your DreamKeeper<br />is ready to be born.</div>
          <div style={{ padding: '10px 12px', background: 'rgba(255,130,184,.07)', border: '1px solid rgba(255,130,184,.18)', borderRadius: 14, marginBottom: 14, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(255,130,184,.6)' }}>DREAM EGG PROGRESS</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(255,130,184,.45)' }}>Night 3 of 3 {'\uD83D\uDD25'}</div>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '94%', background: 'linear-gradient(90deg, rgba(246,197,111,.6), rgba(255,130,184,.8))', borderRadius: 2 }} />
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(234,242,255,.28)', marginTop: 5, letterSpacing: 0.3 }}>Almost ready to hatch</div>
          </div>
          <button className="ob-cta" style={{ background: 'linear-gradient(135deg, rgba(246,197,111,.9), rgba(255,130,184,.7))', color: '#1a0818' }}>Begin the hatching &rarr;</button>
        </div>
      </div>
    </div>
  );
}
