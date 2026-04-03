import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getNightCards, getStories } from '../lib/storage';
import { getRitualState } from '../lib/ritualState';
import { getDreamKeeperById, V1_DREAMKEEPERS } from '../lib/dreamkeepers';
import { getAllHatchedCreatures } from '../lib/hatchery';
import type { SavedNightCard, Character, HatchedCreature } from '../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// MemoryPortrait — A gentle, private parent view of what SleepSeed
// is learning about their child through nights together.
//
// This is NOT a dashboard or analytics view.
// This is a living portrait — calm, editorial, keepsake-like.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.mp{min-height:100vh;min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 40%,#0d0820 100%);font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased}
.mp-inner{max-width:600px;margin:0 auto;padding:0 24px 60px}
@keyframes mp-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes mp-glowPulse{0%,100%{opacity:.3}50%{opacity:.55}}
`;

interface Props {
  child: Character;
  onBack: () => void;
}

interface PortraitData {
  lightsThemUp: string[];
  growingInto: string[];
  keepsReturning: string[];
  recentMoments: { text: string; date: string; emoji?: string }[];
}

function extractPortrait(
  cards: SavedNightCard[],
  stories: any[],
  ritualState: any,
  childName: string,
): PortraitData {
  // Mine data from Night Cards
  const lightsThemUp: string[] = [];
  const growingInto: string[] = [];
  const keepsReturning: string[] = [];
  const recentMoments: { text: string; date: string; emoji?: string }[] = [];

  // From ritual answers
  if (ritualState?.smileAnswer) {
    lightsThemUp.push(ritualState.smileAnswer);
  }
  if (ritualState?.talentAnswer) {
    growingInto.push(ritualState.talentAnswer);
  }

  // From Night Cards (newest first)
  const sorted = [...cards].sort((a, b) => b.date.localeCompare(a.date));

  for (const card of sorted) {
    // Recent moments from card headlines + quotes
    if (recentMoments.length < 5 && card.headline && !card.headline.startsWith('The Night')) {
      recentMoments.push({
        text: card.headline,
        date: card.date,
        emoji: card.creatureEmoji || card.emoji,
      });
    }

    // Mine bonding answers for what lights them up
    if (card.bondingAnswer?.trim() && lightsThemUp.length < 5) {
      lightsThemUp.push(card.bondingAnswer.trim());
    }

    // Mine gratitude for joyful moments
    if (card.gratitude?.trim() && lightsThemUp.length < 5) {
      if (!lightsThemUp.includes(card.gratitude.trim())) {
        lightsThemUp.push(card.gratitude.trim());
      }
    }

    // Mine quotes for recurring themes
    if (card.quote?.trim() && keepsReturning.length < 6) {
      // Extract short, meaningful phrases
      const q = card.quote.trim();
      if (q.length < 80 && !q.startsWith('Tonight,')) {
        keepsReturning.push(q);
      }
    }

    // Memory lines can suggest strengths
    if (card.memory_line?.trim() && growingInto.length < 4) {
      const m = card.memory_line.trim();
      if (m.length < 80) {
        growingInto.push(m);
      }
    }
  }

  // From story titles — recurring themes
  const titleWords = stories
    .map(s => s.title || '')
    .join(' ')
    .toLowerCase();
  const themeWords = ['brave', 'kind', 'curious', 'gentle', 'strong', 'magical', 'silly', 'cozy', 'dream'];
  for (const w of themeWords) {
    if (titleWords.includes(w) && !keepsReturning.some(k => k.toLowerCase().includes(w))) {
      keepsReturning.push(w.charAt(0).toUpperCase() + w.slice(1) + ' stories');
      if (keepsReturning.length >= 6) break;
    }
  }

  return {
    lightsThemUp: lightsThemUp.slice(0, 5),
    growingInto: growingInto.slice(0, 4),
    keepsReturning: keepsReturning.slice(0, 6),
    recentMoments: recentMoments.slice(0, 5),
  };
}

function PortraitSection({ label, children, delay = 0 }: { label: string; children: React.ReactNode; delay?: number }) {
  return (
    <div style={{
      marginBottom: 28,
      animation: `mp-fadeUp .6s ${delay}s ease both`,
      opacity: 0,
    }}>
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px',
        textTransform: 'uppercase', color: 'rgba(246,197,111,.45)',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 12, height: 1, background: 'rgba(246,197,111,.3)' }} />
        {label}
      </div>
      {children}
    </div>
  );
}

function PortraitPill({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '7px 14px', margin: '0 6px 6px 0',
      borderRadius: 20, background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.08)',
      fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 300,
      fontStyle: 'italic', color: 'rgba(244,239,232,.65)', lineHeight: 1.4,
    }}>
      {text}
    </span>
  );
}

function MomentCard({ text, date, emoji }: { text: string; date: string; emoji?: string }) {
  const formatted = (() => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return date; }
  })();
  return (
    <div style={{
      padding: '14px 16px', marginBottom: 8,
      background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
      borderRadius: 14, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>
        {emoji || '\uD83C\uDF19'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 400,
          color: 'rgba(244,239,232,.7)', lineHeight: 1.45, marginBottom: 4,
        }}>
          {text}
        </div>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(244,239,232,.2)',
          letterSpacing: '.3px',
        }}>
          {formatted}
        </div>
      </div>
    </div>
  );
}

export default function MemoryPortrait({ child, onBack }: Props) {
  const { user, companionCreature } = useApp();
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  const childName = child.name || 'your child';

  // Resolve DreamKeeper
  const dk = companionCreature
    ? (getDreamKeeperById(companionCreature.creatureType)
       || V1_DREAMKEEPERS.find(d => d.emoji === companionCreature.creatureEmoji)
       || null)
    : null;
  const creatureName = companionCreature?.name || dk?.name || 'the DreamKeeper';
  const creatureEmoji = companionCreature?.creatureEmoji || dk?.emoji || '\uD83C\uDF19';

  // Load data
  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getNightCards(userId),
      getStories(userId),
    ]).then(([c, s]) => {
      // Filter to this child
      const childCards = c.filter(
        card => !card.characterIds?.length || card.characterIds.includes(child.id) || card.heroName === child.name
      );
      const childStories = s.filter(
        story => !story.characterIds?.length || story.characterIds.includes(child.id) || story.heroName === child.name
      );
      setCards(childCards);
      setStories(childStories);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, child.id, child.name]);

  const ritualState = userId ? getRitualState(userId) : null;

  const portrait = useMemo(
    () => extractPortrait(cards, stories, ritualState, childName),
    [cards, stories, ritualState, childName],
  );

  const isEmpty = portrait.lightsThemUp.length === 0
    && portrait.growingInto.length === 0
    && portrait.keepsReturning.length === 0
    && portrait.recentMoments.length === 0;

  return (
    <div className="mp">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        padding: '20px 24px 0', maxWidth: 600, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'rgba(234,242,255,.4)',
            fontSize: 20, cursor: 'pointer', padding: 6, borderRadius: 10,
          }}
        >
          &larr;
        </button>
        <div style={{
          fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 700,
          color: '#F4EFE8', letterSpacing: '-0.3px',
        }}>
          Memory Portrait
        </div>
      </div>

      <div className="mp-inner" style={{ paddingTop: 28 }}>

        {/* Private label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 16,
          background: 'rgba(154,127,212,.08)', border: '1px solid rgba(154,127,212,.18)',
          marginBottom: 20,
          animation: 'mp-fadeUp .5s ease both',
        }}>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="rgba(154,127,212,.6)" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{
            fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(154,127,212,.6)',
            letterSpacing: '.5px',
          }}>PRIVATE FOR PARENTS</span>
        </div>

        {/* Intro */}
        <div style={{
          marginBottom: 32,
          animation: 'mp-fadeUp .6s .1s ease both', opacity: 0,
        }}>
          <div style={{
            fontSize: 40, marginBottom: 12, lineHeight: 1,
            filter: 'drop-shadow(0 0 20px rgba(246,197,111,.3))',
          }}>
            {creatureEmoji}
          </div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 300,
            color: '#F4EFE8', lineHeight: 1.35, marginBottom: 8, letterSpacing: '-0.3px',
          }}>
            {childName}'s portrait
          </div>
          <div style={{
            fontFamily: "'Nunito',system-ui,sans-serif", fontSize: 13,
            color: 'rgba(244,239,232,.35)', lineHeight: 1.6,
          }}>
            A living reflection shaped by your nights together.
          </div>
          {cards.length > 0 && (
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(244,239,232,.3)', marginTop: 12,
            }}>
              {creatureName} is slowly getting to know {childName}.
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '40px 0',
            fontFamily: "'DM Mono',monospace", fontSize: 11,
            color: 'rgba(244,239,232,.2)',
          }}>
            Loading...
          </div>
        )}

        {/* Empty state */}
        {!loading && isEmpty && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 20,
            animation: 'mp-fadeUp .6s .2s ease both', opacity: 0,
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>{creatureEmoji}</div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 16, fontWeight: 300,
              fontStyle: 'italic', color: 'rgba(244,239,232,.5)', lineHeight: 1.6,
              maxWidth: 280, margin: '0 auto',
            }}>
              After a few more nights together, SleepSeed will begin shaping a Memory Portrait here.
            </div>
          </div>
        )}

        {/* Portrait sections */}
        {!loading && !isEmpty && (
          <>
            {portrait.lightsThemUp.length > 0 && (
              <PortraitSection label="What lights them up" delay={0.2}>
                <div>
                  {portrait.lightsThemUp.map((item, i) => (
                    <PortraitPill key={i} text={item} />
                  ))}
                </div>
                <div style={{
                  fontFamily: "'Nunito',system-ui,sans-serif", fontSize: 12,
                  color: 'rgba(244,239,232,.25)', marginTop: 8, fontStyle: 'italic',
                }}>
                  SleepSeed has noticed these seem to light {childName} up.
                </div>
              </PortraitSection>
            )}

            {portrait.growingInto.length > 0 && (
              <PortraitSection label="What they're growing into" delay={0.3}>
                <div>
                  {portrait.growingInto.map((item, i) => (
                    <PortraitPill key={i} text={item} />
                  ))}
                </div>
                <div style={{
                  fontFamily: "'Nunito',system-ui,sans-serif", fontSize: 12,
                  color: 'rgba(244,239,232,.25)', marginTop: 8, fontStyle: 'italic',
                }}>
                  Strengths and moments of growth, gathered gently over time.
                </div>
              </PortraitSection>
            )}

            {portrait.keepsReturning.length > 0 && (
              <PortraitSection label="What keeps returning" delay={0.4}>
                <div>
                  {portrait.keepsReturning.map((item, i) => (
                    <PortraitPill key={i} text={item} />
                  ))}
                </div>
                <div style={{
                  fontFamily: "'Nunito',system-ui,sans-serif", fontSize: 12,
                  color: 'rgba(244,239,232,.25)', marginTop: 8, fontStyle: 'italic',
                }}>
                  Phrases, themes, and ideas that {childName} keeps returning to.
                </div>
              </PortraitSection>
            )}

            {portrait.recentMoments.length > 0 && (
              <PortraitSection label="Recent remembered moments" delay={0.5}>
                {portrait.recentMoments.map((m, i) => (
                  <MomentCard key={i} text={m.text} date={m.date} emoji={m.emoji} />
                ))}
              </PortraitSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}
