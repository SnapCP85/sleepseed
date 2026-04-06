import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../AppContext';
import { saveHatchedCreature, deleteEgg, createEgg, getActiveEgg, getAllHatchedCreatures } from '../lib/hatchery';
import { resolveNextCreature } from '../lib/creature-helpers';
import { CREATURES } from '../lib/creatures';
import { getDreamKeeperById } from '../lib/dreamkeepers';
import DreamEgg from '../components/onboarding/DreamEgg';
import type { HatchedCreature } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// EggHatchCeremony — 3-page cinematic for post-7-night egg hatch
// ─────────────────────────────────────────────────────────────────────────────
// Page 1: Egg hatches → fireworks → creature revealed
// Page 2: Name the creature
// Page 3: Creature introduction → go home
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  childName: string;
  characterId: string;
  creatureData: {
    creatureType: string;
    name: string;
    nameSuggestions: string[];
    creatureEmoji: string;
    color: string;
    rarity: 'common' | 'rare' | 'legendary';
    personalityTraits: string[];
    virtue: string;
  };
  onComplete: (creature: HatchedCreature) => void;
}

type Page = 'hatch' | 'name' | 'intro';

function hexToRgb(hex: string): string {
  const h = (hex || '#F5B84C').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

/** Renders the DreamKeeper image if available, else emoji fallback */
function CreatureImage({ creatureType, emoji, color, size = 120 }: { creatureType: string; emoji: string; color: string; size?: number }) {
  const dk = getDreamKeeperById(creatureType);
  const rgb = hexToRgb(color);
  if (dk?.imageSrc) {
    return (
      <img
        src={dk.imageSrc}
        alt={dk.name}
        style={{
          width: size, height: size * 1.2, objectFit: 'contain',
          filter: `drop-shadow(0 0 28px rgba(${rgb},.55))`,
        }}
      />
    );
  }
  return (
    <span style={{
      fontSize: size * 0.85, lineHeight: 1,
      filter: `drop-shadow(0 0 20px rgba(${rgb},.5))`,
    }}>
      {emoji}
    </span>
  );
}

export default function EggHatchCeremony({ childName, characterId, creatureData, onComplete }: Props) {
  const { user, setCompanionCreature } = useApp();
  const [page, setPage] = useState<Page>('hatch');
  const [creatureName, setCreatureName] = useState(creatureData.name);
  const [savedCreature, setSavedCreature] = useState<HatchedCreature | null>(null);

  // ── Page 1: Hatch cinematic state ────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eggRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const [eggVisible, setEggVisible] = useState(true);
  const [creatureVisible, setCreatureVisible] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0); // 0=hidden, 1=silhouette, 2=full, 3=cta
  const rgb = hexToRgb(creatureData.color);

  useEffect(() => {
    if (page !== 'hatch') return;
    const timers: number[] = [];

    // Phase 1 (2s): glow intensifies
    timers.push(window.setTimeout(() => {
      if (eggRef.current) eggRef.current.style.filter = `brightness(1.4) drop-shadow(0 0 40px rgba(${rgb},.8))`;
    }, 2000));

    // Phase 2 (4s): max glow
    timers.push(window.setTimeout(() => {
      if (eggRef.current) eggRef.current.style.filter = `brightness(1.8) drop-shadow(0 0 60px rgba(255,248,200,1))`;
    }, 4000));

    // Phase 3 (5.5s): BLOOM + particle burst
    timers.push(window.setTimeout(() => {
      if (bloomRef.current) bloomRef.current.style.background = 'radial-gradient(circle at 50% 40%, rgba(255,248,220,.85), rgba(255,240,200,.3) 40%, transparent 70%)';
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const W = canvasRef.current.width, H = canvasRef.current.height;
          const cx = W / 2, cy = H * 0.45;
          const particles = Array.from({ length: 50 }, () => ({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            life: 1, r: 2 + Math.random() * 4,
            gold: Math.random() > 0.3,
          }));
          function drawBlast() {
            ctx!.clearRect(0, 0, W, H);
            let alive = false;
            particles.forEach(p => {
              p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= 0.018;
              if (p.life > 0) {
                alive = true;
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx!.fillStyle = p.gold ? `rgba(${rgb},${p.life})` : `rgba(255,220,255,${p.life * 0.7})`;
                ctx!.shadowColor = p.gold ? `rgba(${rgb},.8)` : 'rgba(255,180,240,.6)';
                ctx!.shadowBlur = 10;
                ctx!.fill();
              }
            });
            ctx!.shadowBlur = 0;
            if (alive) requestAnimationFrame(drawBlast);
            else ctx!.clearRect(0, 0, W, H);
          }
          requestAnimationFrame(drawBlast);
        }
      }
    }, 5500));

    // Phase 4 (7s): egg hides, creature silhouette
    timers.push(window.setTimeout(() => {
      if (bloomRef.current) bloomRef.current.style.background = 'radial-gradient(circle at 50% 40%, rgba(255,248,220,.06), transparent 70%)';
      setEggVisible(false);
      setCreatureVisible(true);
      setRevealPhase(1);
    }, 7000));

    // Phase 5 (9s): creature full reveal
    timers.push(window.setTimeout(() => {
      setRevealPhase(2);
    }, 9000));

    // Phase 6 (11.5s): CTA
    timers.push(window.setTimeout(() => {
      setRevealPhase(3);
    }, 11500));

    return () => timers.forEach(clearTimeout);
  }, [page, rgb]);

  // ── Save creature on naming ──────────────────────────────────────────────
  const handleNameConfirm = useCallback(async () => {
    if (!user?.id || !creatureName.trim()) return;
    const now = new Date().toISOString();
    const creature: HatchedCreature = {
      id: crypto.randomUUID(),
      userId: user.id,
      characterId,
      name: creatureName.trim(),
      creatureType: creatureData.creatureType,
      creatureEmoji: creatureData.creatureEmoji,
      color: creatureData.color,
      rarity: creatureData.rarity,
      personalityTraits: creatureData.personalityTraits,
      dreamAnswer: '',
      parentSecret: '',
      hatchedAt: now,
      weekNumber: 1,
    };

    // Save to Supabase
    try {
      await saveHatchedCreature(creature);
      // Delete old egg
      await deleteEgg(user.id, characterId);
      // Create new egg for next cycle
      const allHatched = await getAllHatchedCreatures(user.id);
      const hatchedTypes = allHatched.map(c => c.creatureType);
      const available = CREATURES.filter(c => !hatchedTypes.includes(c.id) && c.id !== creatureData.creatureType);
      const nextType = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : CREATURES[0];
      await createEgg(user.id, characterId, nextType.id, 1);
    } catch (e) {
      console.error('[EggHatchCeremony] save failed:', e);
    }

    setSavedCreature(creature);
    setPage('intro');
  }, [user?.id, characterId, creatureName, creatureData]);

  // ── Page 3: Complete ─────────────────────────────────────────────────────
  const handleGoHome = useCallback(() => {
    if (savedCreature) {
      onComplete(savedCreature);
    }
  }, [savedCreature, onComplete]);

  // ── Render ────────────────────────────────────────────────────────────────
  const dk = getDreamKeeperById(creatureData.creatureType);
  const virtueLabel = dk?.virtue || creatureData.virtue;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#030408',
      overflow: 'hidden', zIndex: 300,
      fontFamily: "'Nunito',system-ui,sans-serif", color: '#F4EFE8',
    }}>
      {/* Star field (all pages) */}
      <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} viewBox="0 0 390 844" width="100%" height="100%">
        {Array.from({ length: 60 }, (_, i) => (
          <circle
            key={i}
            cx={(Math.random() * 380 + 5).toFixed(1)}
            cy={(Math.random() * 834 + 5).toFixed(1)}
            r={(Math.random() * 0.7 + 0.2).toFixed(1)}
            fill={`rgba(255,255,255,${(Math.random() * 0.35 + 0.08).toFixed(2)})`}
          />
        ))}
      </svg>

      {/* ═══ PAGE 1: HATCH ═══ */}
      {page === 'hatch' && (
        <>
          <canvas
            ref={canvasRef}
            width={390} height={844}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
          />
          {/* Egg */}
          {eggVisible && (
            <div ref={eggRef} style={{
              position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 5, transition: 'filter 1.5s ease',
            }}>
              <DreamEgg state="hatching" size={160} />
            </div>
          )}
          {/* Bloom */}
          <div ref={bloomRef} style={{
            position: 'absolute', inset: 0, zIndex: 8,
            background: 'radial-gradient(circle at 50% 40%, rgba(255,248,220,0), transparent 70%)',
            pointerEvents: 'none', transition: 'background 1s ease',
          }} />
          {/* Creature reveal */}
          {creatureVisible && (
            <div style={{
              position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 9, textAlign: 'center',
              opacity: revealPhase >= 1 ? 1 : 0,
              filter: revealPhase >= 2
                ? 'none'
                : `brightness(.1) blur(4px) drop-shadow(0 0 40px rgba(${rgb},1))`,
              transition: 'opacity 2s ease, filter 2.5s ease',
              pointerEvents: 'none',
            }}>
              <div style={{ animation: revealPhase >= 2 ? 'ehc-reveal 1.5s ease-out forwards' : 'none' }}>
                <CreatureImage creatureType={creatureData.creatureType} emoji={creatureData.creatureEmoji} color={creatureData.color} size={200} />
              </div>
            </div>
          )}
          {/* Text + CTA */}
          <div style={{
            position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 10,
            textAlign: 'center', padding: '0 32px',
          }}>
            {revealPhase >= 2 && (
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 13,
                color: `rgba(${rgb},.6)`, letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 8,
                opacity: revealPhase >= 2 ? 1 : 0,
                transition: 'opacity 1.5s ease',
              }}>
                {virtueLabel}
              </div>
            )}
            {revealPhase >= 2 && (
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontStyle: 'italic',
                color: 'rgba(244,239,232,.8)', lineHeight: 1.4,
                opacity: revealPhase >= 2 ? 1 : 0,
                transition: 'opacity 1.5s .5s ease',
              }}>
                A new companion has arrived.
              </div>
            )}
            {revealPhase >= 3 && (
              <button
                onClick={() => setPage('name')}
                style={{
                  marginTop: 28, padding: '16px 40px', border: 'none', borderRadius: 16,
                  background: `linear-gradient(135deg, rgba(${rgb},.6), rgba(${rgb},.9) 50%, rgba(${rgb},.6))`,
                  color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Nunito',system-ui,sans-serif",
                  boxShadow: `0 8px 28px rgba(${rgb},.3)`,
                  opacity: revealPhase >= 3 ? 1 : 0,
                  transition: 'opacity 1s ease',
                }}
              >
                Say hello →
              </button>
            )}
          </div>
        </>
      )}

      {/* ═══ PAGE 2: NAME ═══ */}
      {page === 'name' && (
        <div style={{
          position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
          padding: '40px 32px',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 300, height: 300, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb},.15) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Creature */}
          <div style={{ marginBottom: 12, animation: 'ehc-float 4s ease-in-out infinite' }}>
            <CreatureImage creatureType={creatureData.creatureType} emoji={creatureData.creatureEmoji} color={creatureData.color} size={180} />
          </div>

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: `rgba(${rgb},.5)`, letterSpacing: '.1em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            {virtueLabel}
          </div>

          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 300,
            textAlign: 'center', marginBottom: 28, lineHeight: 1.4,
          }}>
            What will you call them?
          </div>

          {/* Name suggestions */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
            marginBottom: 20, maxWidth: 320,
          }}>
            {creatureData.nameSuggestions.map(name => (
              <button
                key={name}
                onClick={() => setCreatureName(name)}
                style={{
                  padding: '8px 18px', borderRadius: 24,
                  background: creatureName === name ? `rgba(${rgb},.15)` : 'rgba(255,255,255,.04)',
                  border: `1px solid ${creatureName === name ? `rgba(${rgb},.4)` : 'rgba(255,255,255,.08)'}`,
                  color: creatureName === name ? `rgba(${rgb},.9)` : 'rgba(244,239,232,.5)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Nunito',sans-serif",
                  transition: 'all .2s',
                }}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <input
            value={creatureName}
            onChange={e => setCreatureName(e.target.value)}
            placeholder="Or type a name..."
            maxLength={20}
            style={{
              width: '100%', maxWidth: 280, padding: '14px 18px', borderRadius: 14,
              border: `1px solid rgba(${rgb},.2)`, background: `rgba(${rgb},.04)`,
              color: '#F4EFE8', fontSize: 16, fontFamily: "'Nunito',sans-serif",
              textAlign: 'center', outline: 'none',
              transition: 'border-color .2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = `rgba(${rgb},.4)`; }}
            onBlur={e => { e.currentTarget.style.borderColor = `rgba(${rgb},.2)`; }}
          />

          {/* Confirm */}
          <button
            onClick={handleNameConfirm}
            disabled={!creatureName.trim()}
            style={{
              marginTop: 28, padding: '16px 48px', border: 'none', borderRadius: 16,
              background: creatureName.trim()
                ? `linear-gradient(135deg, rgba(${rgb},.6), rgba(${rgb},.9) 50%, rgba(${rgb},.6))`
                : 'rgba(255,255,255,.06)',
              color: creatureName.trim() ? '#080200' : 'rgba(244,239,232,.2)',
              fontSize: 16, fontWeight: 700, cursor: creatureName.trim() ? 'pointer' : 'default',
              fontFamily: "'Nunito',sans-serif",
              boxShadow: creatureName.trim() ? `0 8px 28px rgba(${rgb},.3)` : 'none',
              transition: 'all .2s',
            }}
          >
            That{'\u2019'}s their name
          </button>
        </div>
      )}

      {/* ═══ PAGE 3: INTRO ═══ */}
      {page === 'intro' && savedCreature && (
        <div style={{
          position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
          padding: '40px 32px',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 300, height: 300, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb},.12) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Creature */}
          <div style={{
            marginBottom: 12,
            animation: 'ehc-float 4s ease-in-out infinite, ehc-glow-pulse 3s ease-in-out infinite',
          }}>
            <CreatureImage creatureType={creatureData.creatureType} emoji={creatureData.creatureEmoji} color={creatureData.color} size={190} />
          </div>

          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 400,
            color: `rgba(${rgb},.85)`, marginBottom: 8,
          }}>
            {savedCreature.name}
          </div>

          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: `rgba(${rgb},.45)`, letterSpacing: '.1em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            {virtueLabel}
          </div>

          {/* Speech */}
          <div style={{
            padding: '16px 24px', maxWidth: 300,
            background: `rgba(${rgb},.06)`, border: `1px solid rgba(${rgb},.18)`,
            borderRadius: '20px 20px 20px 4px',
            marginBottom: 12,
          }}>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(244,239,232,.75)', lineHeight: 1.6,
            }}>
              {dk?.emotionalLine || `"I'm here now, ${childName}. Let's make stories together."`}
            </div>
          </div>

          <div style={{
            fontFamily: "'Nunito',sans-serif", fontSize: 13,
            color: 'rgba(244,239,232,.4)', textAlign: 'center',
            lineHeight: 1.6, maxWidth: 280, marginBottom: 8,
          }}>
            {savedCreature.name} can now join you in stories.
          </div>

          {/* Traits */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 36,
          }}>
            {creatureData.personalityTraits.slice(0, 3).map(trait => (
              <span key={trait} style={{
                padding: '4px 12px', borderRadius: 20,
                background: `rgba(${rgb},.08)`, border: `1px solid rgba(${rgb},.15)`,
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: `rgba(${rgb},.6)`, letterSpacing: '.03em',
              }}>
                {trait}
              </span>
            ))}
          </div>

          <button
            onClick={handleGoHome}
            style={{
              padding: '16px 48px', border: 'none', borderRadius: 16,
              background: `linear-gradient(135deg, rgba(${rgb},.6), rgba(${rgb},.9) 50%, rgba(${rgb},.6))`,
              color: '#080200', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Nunito',sans-serif",
              boxShadow: `0 8px 28px rgba(${rgb},.3)`,
            }}
          >
            Take me home
          </button>
        </div>
      )}

      {/* Float animation */}
      <style>{`
        @keyframes ehc-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        @keyframes ehc-reveal {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.15); opacity: 1; }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ehc-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(${rgb},.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(${rgb},.6)) drop-shadow(0 0 80px rgba(${rgb},.2)); }
        }
      `}</style>
    </div>
  );
}
