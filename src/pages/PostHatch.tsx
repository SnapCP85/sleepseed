import { useState } from 'react';
import StarBackground from '../components/onboarding/StarBackground';
import '../components/onboarding/onboarding.css';

interface Props {
  childName: string;
  creatureEmoji: string;
  creatureName: string;
  onComplete: () => void;
}

const fadeUp = (delay: number): React.CSSProperties => ({
  animation: `ob-fadeUp 0.6s ${delay}s ease both`, opacity: 0,
});

/** Post-hatch flow: First Contact → Photo Card → Born Card */
export default function PostHatch({ childName, creatureEmoji, creatureName, onComplete }: Props) {
  const [screen, setScreen] = useState<'contact' | 'photo-card' | 'born-card'>('contact');

  // ── First Contact ──
  if (screen === 'contact') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(50,20,80,.7), #060912 60%)' }}>
        <StarBackground opacity={0.85} />
        <div className="ob-ct" style={{ paddingTop: 64, justifyContent: 'center' }}>
          <div style={{
            fontSize: 100, lineHeight: 1, display: 'block', textAlign: 'center', width: '100%', marginBottom: 24,
            animation: 'ob-creatureTilt 5s 1s ease-in-out infinite, ob-floatY 4s ease-in-out infinite',
            filter: 'drop-shadow(0 0 28px rgba(246,197,111,.65))',
          }}>
            {creatureEmoji}
          </div>
          {/* Speech bubble */}
          <div style={{
            background: 'rgba(184,161,255,.11)', border: '1px solid rgba(184,161,255,.28)',
            borderRadius: '20px 20px 20px 5px', padding: '18px 20px', marginBottom: 20,
            textAlign: 'left', width: '100%', ...fadeUp(0.2),
          }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(184,161,255,.6)', letterSpacing: 0.7, marginBottom: 7 }}>YOUR DREAMKEEPER</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: '#F4EFE8', lineHeight: 1.48, letterSpacing: -0.1 }}>
              "{childName}, I chose you. I will be your DreamKeeper and always be by your side."
            </div>
          </div>
          <div style={{ ...fadeUp(0.5), width: '100%' }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(234,242,255,.36)', lineHeight: 1.65, marginBottom: 22 }}>
              Your DreamKeeper will be with you in every story, every night. They know your name. They'll never forget it.
            </div>
            <button className="ob-cta" onClick={() => setScreen('photo-card')}>Save tonight's memory &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Photo Night Card ──
  if (screen === 'photo-card') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 26%, rgba(50,10,60,.35), #060912 58%)' }}>
        <StarBackground opacity={0.75} />
        <div className="ob-ct" style={{ paddingTop: 64 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(255,130,184,.65)', letterSpacing: 1.2, marginBottom: 14, ...fadeUp(0) }}>
            ✦ NIGHT 3 · THE HATCHING NIGHT
          </div>
          {/* Night Card */}
          <div className="ob-nc" style={{ animation: 'ob-ncReveal .7s .1s cubic-bezier(.2,.8,.3,1) both', width: 244 }}>
            <div className="ob-nc-sky" style={{ height: 124, background: 'linear-gradient(145deg, rgba(255,130,184,.18), rgba(50,10,60,.95))' }}>
              <div style={{ fontSize: 40, position: 'relative', zIndex: 3, filter: 'drop-shadow(0 0 12px rgba(246,197,111,.7))', animation: 'ob-floatY 4s ease-in-out infinite' }}>
                {creatureEmoji}
              </div>
              <div style={{ position: 'absolute', top: 8, left: 10, padding: '3px 8px', background: 'rgba(255,130,184,.2)', border: '1px solid rgba(255,130,184,.45)', borderRadius: 20 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, fontWeight: 600, color: 'rgba(255,130,184,.95)' }}>NIGHT 3 · HATCHED</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to bottom, transparent, #f8f4ee)' }} />
            </div>
            <div className="ob-nc-paper">
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(26,26,46,.4)', letterSpacing: 0.5, marginBottom: 6 }}>TONIGHT'S MEMORY</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 7 }}>The Night Your DreamKeeper Was Born</div>
              <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 9.5, color: 'rgba(26,26,46,.55)', lineHeight: 1.55, marginBottom: 9 }}>
                "After three nights of listening, it chose to become theirs."
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(26,26,46,.38)' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(255,130,184,.65)', fontWeight: 600 }}>
                  {childName.toUpperCase()} · HATCHED
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...fadeUp(0.55), width: '100%', marginTop: 6 }}>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(234,242,255,.32)', marginBottom: 14, lineHeight: 1.65 }}>
              "This is yours to keep forever."
            </div>
            <button
              className="ob-cta"
              style={{ background: 'linear-gradient(135deg, rgba(246,197,111,.9), rgba(255,130,184,.7))', color: '#1a0818' }}
              onClick={() => setScreen('born-card')}
            >
              Save to collection &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Born Card (final screen) ──
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="ob-slide" style={{ background: 'radial-gradient(ellipse at 50% 26%, rgba(60,10,80,.35), #060912 58%)' }}>
        <StarBackground opacity={0.75} />
        <div className="ob-ct" style={{ paddingTop: 64 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: 'rgba(255,130,184,.65)', letterSpacing: 1.2, marginBottom: 14, ...fadeUp(0) }}>
            ✦ NIGHT 3 · SPECIAL MEMORY
          </div>
          {/* Special card */}
          <div className="ob-nc" style={{ animation: 'ob-ncReveal .8s .1s cubic-bezier(.2,.8,.3,1) both', width: 244 }}>
            <div className="ob-nc-sky" style={{ height: 134, background: 'linear-gradient(145deg, rgba(255,130,184,.2), rgba(60,10,80,.9))' }}>
              <div style={{ fontSize: 52, lineHeight: 1, position: 'relative', zIndex: 3, filter: 'drop-shadow(0 0 12px rgba(246,197,111,.6))', animation: 'ob-floatY 4s ease-in-out infinite' }}>
                {creatureEmoji}
              </div>
              <div style={{ position: 'absolute', top: 8, left: 10, padding: '3px 8px', background: 'rgba(255,130,184,.2)', border: '1px solid rgba(255,130,184,.45)', borderRadius: 20 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, fontWeight: 600, color: 'rgba(255,130,184,.95)' }}>NIGHT 3 · HATCHING</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to bottom, transparent, #f8f4ee)' }} />
            </div>
            <div className="ob-nc-paper">
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(26,26,46,.4)', letterSpacing: 0.5, marginBottom: 6 }}>SPECIAL MEMORY</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 7 }}>The night your DreamKeeper was born</div>
              <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 9.5, color: 'rgba(26,26,46,.55)', lineHeight: 1.55, marginBottom: 9 }}>
                "After three nights of listening, it chose to become theirs."
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(26,26,46,.38)' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: 'rgba(255,130,184,.65)', fontWeight: 600 }}>
                  {childName.toUpperCase()} · HATCHED
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...fadeUp(0.55), width: '100%', marginTop: 6 }}>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(234,242,255,.32)', marginBottom: 18, lineHeight: 1.65 }}>
              "This is yours to keep. A reminder of the night it all began."
            </div>
            <button className="ob-cta" onClick={onComplete}>Begin your journey &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
