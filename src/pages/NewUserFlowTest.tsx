import { useState, useCallback } from 'react';
import ParentSetup from './ParentSetup';
import type { ParentSetupResult } from './ParentSetup';
import DreamKeeperOnboarding from './DreamKeeperOnboarding';
import type { DreamKeeperResult } from './DreamKeeperOnboarding';
import RitualNight1 from '../components/ritual/RitualNight1';
import RitualNight2 from '../components/ritual/RitualNight2';
import RitualNight3 from '../components/ritual/RitualNight3';
import MySpace from './MySpace';
import StoryCreator from './StoryCreator';
import AppLayout from '../components/AppLayout';
import {
  createDefaultRitualState,
  type RitualState,
} from '../lib/ritualState';

// ─────────────────────────────────────────────────────────────────────────────
// NewUserFlowTest — Full onboarding experience test page
// ─────────────────────────────────────────────────────────────────────────────
// No auth required. Simulates the complete new-user journey:
//
//   0. Parent Setup
//   1. DreamKeeper Onboarding
//   2. Ritual Night 1 (Welcome → Share → Story → Egg → Crack → Card → End)
//   3. Ritual Night 2 (Return → Question → Story → Cracks → Card → End)
//   4. Ritual Night 3 (Tonight → Story → Hatch → Contact → Born)
//   5. My Space (post-ritual, first-time)
//   6. Create Flow (3-card entry)
//
// Persistent dev bar at top allows jumping to any step.
// Usage: http://localhost:5173/?view=new-user-test
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'parent-setup', label: 'Parent', short: 'P' },
  { id: 'dreamkeeper', label: 'DreamKeeper', short: 'DK' },
  { id: 'night-1', label: 'Night 1', short: 'N1' },
  { id: 'night-2', label: 'Night 2', short: 'N2' },
  { id: 'night-3', label: 'Night 3', short: 'N3' },
  { id: 'my-space', label: 'My Space', short: 'MS' },
  { id: 'create', label: 'Create', short: 'CR' },
] as const;

type StepId = typeof STEPS[number]['id'];

const DEV_BAR_CSS = `
.dev-bar{position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(6,9,18,.95);border-bottom:1px solid rgba(245,184,76,.2);padding:6px 10px;display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;backdrop-filter:blur(12px)}
.dev-bar-label{font-size:9px;color:rgba(245,184,76,.5);letter-spacing:.06em;margin-right:4px;flex-shrink:0}
.dev-bar-steps{display:flex;gap:3px;flex:1;overflow-x:auto;scrollbar-width:none}
.dev-bar-steps::-webkit-scrollbar{display:none}
.dev-step{padding:4px 8px;border-radius:6px;font-size:9px;cursor:pointer;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.35);transition:all .15s;white-space:nowrap;flex-shrink:0}
.dev-step:hover{border-color:rgba(255,255,255,.18);color:rgba(244,239,232,.6)}
.dev-step.on{background:rgba(245,184,76,.12);border-color:rgba(245,184,76,.4);color:#F5B84C}
.dev-step.done{background:rgba(20,216,144,.06);border-color:rgba(20,216,144,.2);color:rgba(20,216,144,.6)}
.dev-nav{display:flex;gap:4px;flex-shrink:0}
.dev-nav-btn{padding:4px 10px;border-radius:6px;font-size:10px;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(244,239,232,.4);font-family:'DM Mono',monospace;transition:all .15s}
.dev-nav-btn:hover{border-color:rgba(255,255,255,.2);color:rgba(244,239,232,.7)}
.dev-nav-btn:disabled{opacity:.25;cursor:default}
.dev-exit{padding:4px 8px;border-radius:6px;font-size:9px;cursor:pointer;border:1px solid rgba(255,80,80,.2);background:rgba(255,80,80,.06);color:rgba(255,80,80,.5);font-family:'DM Mono',monospace;transition:all .15s;flex-shrink:0}
.dev-exit:hover{border-color:rgba(255,80,80,.4);color:rgba(255,80,80,.8)}
`;

export default function NewUserFlowTest() {
  const [step, setStep] = useState<StepId>('parent-setup');
  const [childProfile, setChildProfile] = useState<ParentSetupResult>({
    childName: 'Adina', childAge: '6', childPronouns: 'she/her', parentRole: 'Dad',
  });
  const [dkResult, setDkResult] = useState<DreamKeeperResult | null>(null);
  const [ritual, setRitual] = useState<RitualState>(() => ({
    ...createDefaultRitualState(),
    childName: 'Adina',
  }));

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const canBack = stepIndex > 0;
  const canForward = stepIndex < STEPS.length - 1;

  const goStep = useCallback((id: StepId) => {
    setStep(id);
    window.scrollTo(0, 0);
  }, []);

  const goBack = () => { if (canBack) goStep(STEPS[stepIndex - 1].id); };
  const goForward = () => { if (canForward) goStep(STEPS[stepIndex + 1].id); };

  // Build ritual state for whichever night we're viewing
  const ritualForNight = (night: 1 | 2 | 3): RitualState => {
    const dk = dkResult?.dreamKeeper;
    return {
      ...ritual,
      currentNight: night,
      childName: childProfile.childName || 'Adina',
      creatureName: dk?.name || ritual.creatureName || 'Moon Bunny',
      creatureEmoji: dk?.emoji || ritual.creatureEmoji || '🐰',
      creatureColor: dk?.color || ritual.creatureColor || '#F5B84C',
      // Simulate completed prior nights
      night1Complete: night > 1,
      night2Complete: night > 2,
      smileAnswer: night > 1 ? (ritual.smileAnswer || 'Something silly') : ritual.smileAnswer,
      talentAnswer: night > 2 ? (ritual.talentAnswer || 'Being kind') : ritual.talentAnswer,
      eggState: night === 1 ? 'idle' : night === 2 ? 'cracked' : 'hatching',
    };
  };

  // ── Dev bar ────────────────────────────────────────────────────────────────

  const devBar = (
    <>
      <style>{DEV_BAR_CSS}</style>
      <div className="dev-bar">
        <div className="dev-bar-label">TEST</div>
        <div className="dev-bar-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`dev-step${s.id === step ? ' on' : i < stepIndex ? ' done' : ''}`}
              onClick={() => goStep(s.id)}
            >
              {s.short}: {s.label}
            </div>
          ))}
        </div>
        <div className="dev-nav">
          <button className="dev-nav-btn" disabled={!canBack} onClick={goBack}>← Back</button>
          <button className="dev-nav-btn" disabled={!canForward} onClick={goForward}>Next →</button>
        </div>
        <button className="dev-exit" onClick={() => { window.location.href = window.location.pathname; }}>✕</button>
      </div>
    </>
  );

  const spacer = <div style={{ height: 38 }} />;

  // ── Step 0: Parent Setup ───────────────────────────────────────────────────

  if (step === 'parent-setup') {
    return (
      <>
        {devBar}
        <ParentSetup
          onComplete={(result) => {
            setChildProfile(result);
            setRitual(r => ({ ...r, childName: result.childName }));
            goStep('dreamkeeper');
          }}
          onSkip={() => goStep('dreamkeeper')}
          onSaveLater={(result) => {
            setChildProfile(result);
            setRitual(r => ({ ...r, childName: result.childName }));
            goStep('dreamkeeper');
          }}
        />
      </>
    );
  }

  // ── Step 1: DreamKeeper Onboarding ─────────────────────────────────────────

  if (step === 'dreamkeeper') {
    return (
      <>
        {devBar}
        <DreamKeeperOnboarding
          childName={childProfile.childName || 'Adina'}
          childAge={childProfile.childAge}
          childPronouns={childProfile.childPronouns}
          onComplete={(result) => {
            setDkResult(result);
            setRitual(r => ({
              ...r,
              childName: result.childName,
              creatureName: result.dreamKeeper.name,
              creatureEmoji: result.dreamKeeper.emoji,
              creatureColor: result.dreamKeeper.color,
            }));
            goStep('night-1');
          }}
          onBack={() => goStep('parent-setup')}
        />
      </>
    );
  }

  // ── Step 2: Ritual Night 1 ─────────────────────────────────────────────────

  if (step === 'night-1') {
    return (
      <>
        {devBar}
        <RitualNight1
          ritual={ritualForNight(1)}
          onComplete={(smileAnswer) => {
            setRitual(r => ({ ...r, smileAnswer, night1Complete: true, eggState: 'cracked', currentNight: 2 }));
            goStep('night-2');
          }}
        />
      </>
    );
  }

  // ── Step 3: Ritual Night 2 ─────────────────────────────────────────────────

  if (step === 'night-2') {
    return (
      <>
        {devBar}
        <RitualNight2
          ritual={ritualForNight(2)}
          onComplete={(talentAnswer) => {
            setRitual(r => ({ ...r, talentAnswer, night2Complete: true, eggState: 'hatching', currentNight: 3 }));
            goStep('night-3');
          }}
        />
      </>
    );
  }

  // ── Step 4: Ritual Night 3 ─────────────────────────────────────────────────

  if (step === 'night-3') {
    return (
      <>
        {devBar}
        <RitualNight3
          ritual={ritualForNight(3)}
          userId="test-user"
          onComplete={() => {
            setRitual(r => ({ ...r, night3Complete: true, ritualComplete: true, eggState: 'hatched' }));
            goStep('my-space');
          }}
        />
      </>
    );
  }

  // ── Step 5: My Space (post-ritual) ─────────────────────────────────────────

  if (step === 'my-space') {
    return (
      <>
        {devBar}{spacer}
        <AppLayout currentTab="dashboard" onNav={(v) => {
          if (v === 'ritual-starter') goStep('create');
          else console.log('[test] Nav:', v);
        }}>
          <MySpace
            onSignUp={() => {}}
            onReadStory={(book) => console.log('[test] Read story:', book)}
          />
        </AppLayout>
      </>
    );
  }

  // ── Step 6: Create Flow ────────────────────────────────────────────────────

  if (step === 'create') {
    return (
      <>
        {devBar}
        <StoryCreator
          entryMode="ritual"
          onGenerate={(choices) => {
            console.log('[test] Generate:', choices);
            alert(`Story would generate:\n\nPath: ${choices.path}\nHero: ${choices.heroName}\nVibe: ${choices.vibe}\nBrief: ${choices.brief?.slice(0, 80)}...\n\n(Test mode — no actual generation)`);
          }}
          onBack={() => goStep('my-space')}
        />
      </>
    );
  }

  return null;
}
