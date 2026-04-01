import { useState, useMemo } from 'react';
import ElderDreamKeeper from '../components/onboarding/ElderDreamKeeper';
import StarBackground from '../components/onboarding/StarBackground';
import MoonProgress from '../components/onboarding/MoonProgress';
import '../components/onboarding/onboarding.css';

interface StoryPage {
  scene: 'elder' | 'stars' | 'glow';
  text: string;
}

interface Props {
  childName: string;
  onComplete: () => void;
}

/** Night 3 "The Choosing" — hardcoded canonical hatching narrative from v9. */
export default function Night3Story({ childName, onComplete }: Props) {
  const [page, setPage] = useState(0);

  const STORY: StoryPage[] = useMemo(() => [
    { scene: 'elder', text: `"${childName}," the Elder DreamKeeper said quietly. Not like a beginning. Like a continuation. "I need to tell you something true before tonight ends."` },
    { scene: 'stars', text: `"In all the world, there are very few DreamKeepers. They do not choose just anyone. They watch. They listen. They wait until they find a child whose heart is worth growing beside — for the rest of their life."` },
    { scene: 'elder', text: `"What makes a DreamKeeper choose someone?" The Elder smiled. "Not how brave they are. Not how loud. It chooses someone whose inner world is worth living inside. Someone whose stories matter." The Elder looked at ${childName}. "That is why it chose you."` },
    { scene: 'glow', text: `"A DreamKeeper does not just protect your sleep. It carries your memories. It grows alongside you. It will know who you are becoming before you know it yourself. This bond — once made — cannot be undone."` },
    { scene: 'stars', text: `"Every night you come back, it learns something more. Every story you share becomes part of it. One day — many years from now — you will look at it and see pieces of your whole childhood looking back at you."` },
    { scene: 'elder', text: `The Elder reached out and held the egg very gently. The cracks glowed — warm, impatient, almost there. "Tonight, it hatches. And the moment it does — you will have a DreamKeeper. One that is entirely, permanently yours."` },
    { scene: 'glow', text: `"Are you ready, ${childName}?" The egg shook softly in the Elder's hands. Something inside pushed at the shell. A tiny heartbeat. Then a sound — the faintest sound — like a creature taking its very first breath.` },
  ], [childName]);

  const currentPage = STORY[page];
  const isLast = page === STORY.length - 1;

  // Scene backgrounds
  const sceneEl = (() => {
    const base: React.CSSProperties = { position: 'absolute', inset: 0 };
    if (currentPage.scene === 'elder') return (
      <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 35%, rgba(20,10,60,.8), #060912 62%)' }}>
        <StarBackground opacity={0.5} count={24} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(.55) translateY(-20px)', transformOrigin: 'center' }}>
          <ElderDreamKeeper animate={false} />
        </div>
      </div>
    );
    if (currentPage.scene === 'glow') return (
      <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 30%, rgba(60,30,120,.7), #060912 65%)' }}>
        <StarBackground opacity={0.6} count={28} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,197,111,.45), rgba(184,161,255,.2) 60%, transparent)', filter: 'blur(28px)', animation: 'ob-glowPulse 2s ease-in-out infinite' }} />
        </div>
      </div>
    );
    // stars
    return (
      <div style={{ ...base, background: 'radial-gradient(ellipse at 50% 30%, rgba(50,25,110,.85), #060912 65%)' }}>
        <StarBackground opacity={0.7} count={32} />
      </div>
    );
  })();

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#060912', overflow: 'hidden' }}>
      {/* Scene illustration (top 52%) */}
      <div style={{ height: '52%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {sceneEl}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 88, background: 'linear-gradient(to bottom, transparent, #060912)', zIndex: 10 }} />
      </div>
      {/* Text area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px', background: '#060912', position: 'relative' }}>
        <MoonProgress current={page} total={STORY.length} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{
            fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16.5,
            color: 'rgba(244,239,232,.96)', lineHeight: 1.75, letterSpacing: 0.01,
            animation: 'ob-fadeUp .35s ease both',
          }} key={page}>
            {currentPage.text}
          </div>
        </div>
        <div style={{ padding: '0 0 26px' }}>
          {isLast ? (
            <button
              className="ob-cta"
              style={{ background: 'linear-gradient(135deg, rgba(246,197,111,.9), rgba(255,130,184,.7))', color: '#1a0818' }}
              onClick={onComplete}
            >
              Begin the hatching &rarr;
            </button>
          ) : (
            <button className="ob-cta" onClick={() => setPage(p => p + 1)}>Next &rarr;</button>
          )}
        </div>
      </div>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(255,130,184,.55)', letterSpacing: 1 }}>NIGHT 3</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 11, fontStyle: 'italic', color: 'rgba(244,239,232,.4)' }}>The Choosing</div>
      </div>
    </div>
  );
}
