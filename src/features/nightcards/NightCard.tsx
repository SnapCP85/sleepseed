import { useMemo } from 'react';
import type { SavedNightCard, CardVariant } from '../../lib/types';
import { getCardVariant, CARD_VARIANT_STYLES } from '../../lib/types';

const CSS = `
@keyframes ncFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(-3deg)}}
@keyframes ncTwinkle{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes ncFoil{from{transform:translateX(-10%) translateY(-5%)}to{transform:translateX(10%) translateY(5%)}}

.nc-perspective{perspective:1200px;display:inline-block}
.nc-inner{position:relative;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.4,.2,.2,1);border-radius:20px}
.nc-inner.flipped{transform:rotateY(180deg)}
.nc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:20px;overflow:hidden;display:flex;flex-direction:column}
.nc-front{z-index:2}
.nc-back{transform:rotateY(180deg);z-index:1}

/* Sky zone */
.nc-sky{position:relative;height:218px;flex-shrink:0;overflow:hidden}
.nc-sky-photo{width:100%;height:100%;object-fit:cover;display:block}
.nc-sky-photo-overlay{position:absolute;inset:0;pointer-events:none}
.nc-sky-grain{position:absolute;inset:0;opacity:.06;pointer-events:none;background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.nc-sky-date{position:absolute;bottom:8px;right:10px;font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,160,50,.75);text-shadow:0 0 8px rgba(255,120,0,.4);z-index:3}
.nc-sky-creature{position:absolute;bottom:-22px;left:18px;font-size:44px;z-index:10;animation:ncFloat 4s ease-in-out infinite;transform:rotate(-3deg);filter:drop-shadow(0 4px 12px rgba(0,0,0,.4))}
.nc-sky-creature-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:64px;animation:ncFloat 4s ease-in-out infinite;z-index:3}
.nc-sky-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:140px;border-radius:50%;filter:blur(40px);opacity:.28;z-index:1}
.nc-sky-bleed{position:absolute;bottom:0;left:0;right:0;height:60px;z-index:2;pointer-events:none}

/* Stars */
.nc-star{position:absolute;width:2px;height:2px;border-radius:50%;background:white;animation:ncTwinkle 4s ease-in-out infinite alternate}

/* Constellation */
.nc-constellation{position:absolute;inset:0;z-index:2;pointer-events:none}

/* Paper zone */
.nc-paper{flex:1;display:flex;flex-direction:column;min-height:0}
.nc-paper-inner{flex:1;display:flex;flex-direction:column}
.nc-badge-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.nc-badge-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.02em}
.nc-badge-date{font-family:'DM Mono',monospace;font-size:8px;color:rgba(60,40,20,.38)}
.nc-child-name{font-family:'Fraunces',serif;font-size:10px;font-weight:300;font-style:italic;color:rgba(60,40,20,.45);margin-bottom:4px}
.nc-headline{font-family:'Fraunces',serif;font-size:18px;font-weight:600;line-height:1.2;margin-bottom:4px}
.nc-memory{font-family:'Nunito',sans-serif;font-size:10px;font-weight:500;font-style:italic;color:rgba(60,40,20,.5);line-height:1.5}
.nc-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(60,40,20,.1);padding-top:9px;margin-top:auto}
.nc-footer-left{display:flex;align-items:center;gap:4px}
.nc-footer-keeper{font-family:'DM Mono',monospace;font-size:8px;color:rgba(60,40,20,.4);text-transform:uppercase}
.nc-footer-brand{font-family:'Fraunces',serif;font-size:9px;color:rgba(60,40,20,.28)}

/* Origin foil */
.nc-foil{position:absolute;inset:0;background:linear-gradient(135deg,transparent 20%,rgba(245,184,76,.06) 30%,rgba(255,255,255,.08) 40%,transparent 50%,rgba(148,130,255,.05) 60%,transparent 70%);background-size:200% 200%;animation:ncFoil 5s ease-in-out infinite alternate;pointer-events:none;z-index:5;border-radius:20px}
.nc-corner{position:absolute;font-family:'Fraunces',serif;font-size:10px;color:rgba(245,184,76,.4);z-index:6}
.nc-corner-tl{top:10px;left:10px}.nc-corner-tr{top:10px;right:10px}.nc-corner-bl{bottom:10px;left:10px}.nc-corner-br{bottom:10px;right:10px}

/* Back face */
.nc-back-ornament{text-align:center;margin-bottom:10px}
.nc-back-ornament-emoji{font-size:20px}
.nc-back-ornament-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:rgba(60,40,20,.38);margin-top:4px}
.nc-back-quote-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;margin:0 6px;border-left:2px solid rgba(60,40,20,.1);border-right:2px solid rgba(60,40,20,.1);padding:16px 12px}
.nc-back-bigquote{position:absolute;top:4px;left:8px;font-family:'Playfair Display',serif;font-size:56px;color:rgba(60,40,20,.08);line-height:1}
.nc-back-quote-text{font-family:'Fraunces',serif;font-size:14px;font-weight:400;font-style:italic;color:#2a1a0e;line-height:1.65;text-align:center;position:relative;z-index:1}
.nc-back-attribution{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;color:rgba(60,40,20,.4);margin-top:10px;text-align:center}
.nc-back-divider{position:relative;height:1px;background:rgba(60,40,20,.12);margin:12px 0}
.nc-back-divider-star{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:rgba(60,40,20,.3);line-height:1}
.nc-back-memory{font-family:'Nunito',sans-serif;font-size:10px;font-weight:500;font-style:italic;color:rgba(60,40,20,.5);text-align:center;line-height:1.5}
.nc-back-whisper{background:rgba(245,184,76,.07);border:1px dashed rgba(60,40,20,.14);border-radius:10px;padding:8px 12px;text-align:center;margin-top:11px}
.nc-back-whisper-label{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:2px;text-transform:uppercase;color:rgba(60,40,20,.35);display:block;margin-bottom:3px}
.nc-back-whisper-text{font-family:'Fraunces',serif;font-size:10px;font-weight:300;font-style:italic;color:rgba(60,40,20,.55);line-height:1.45}
.nc-back-whisper-locked{cursor:pointer;opacity:.7}
.nc-back-whisper-locked:hover{opacity:1}
.nc-back-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(60,40,20,.1);margin-top:11px;padding-top:9px}
.nc-back-footer-story{font-family:'Fraunces',serif;font-size:9px;font-style:italic;color:rgba(60,40,20,.38)}
.nc-back-footer-night{font-family:'DM Mono',monospace;font-size:8px;color:rgba(60,40,20,.28);text-transform:uppercase}
.nc-back-photo-thumb{position:absolute;top:22px;left:20px;width:52px;height:44px;border-radius:6px;overflow:hidden;border:1.5px solid rgba(60,40,20,.12);box-shadow:0 3px 10px rgba(0,0,0,.25);z-index:2}
.nc-back-photo-thumb img{width:100%;height:100%;object-fit:cover}

/* ── MINI CARD ── */
.nc-mini{border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;position:relative}
.nc-mini:hover{transform:translateY(-6px) scale(1.03)}
.nc-mini-sky{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.nc-mini-sky-bleed{position:absolute;bottom:0;left:0;right:0;height:30%;pointer-events:none}
.nc-mini-paper{display:flex;flex-direction:column;justify-content:center}
.nc-mini-headline{font-family:'Fraunces',serif;font-size:8px;font-weight:600;color:#1a0f08;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nc-mini-date{font-family:'DM Mono',monospace;font-size:6.5px;color:rgba(60,40,20,.4);margin-top:2px}
.nc-mini-badge{position:absolute;top:4px;right:4px;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;z-index:3}

/* Streak overlay */
.nc-streak-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,100,20,.08),transparent 50%,rgba(255,160,20,.06));pointer-events:none;z-index:2}
`;

interface NightCardProps {
  card: SavedNightCard;
  size: 'full' | 'mini';
  onTap?: () => void;
  flipped?: boolean;
  onFlip?: () => void;
  isPremium?: boolean;
  onWhisperTap?: () => void;
  childAge?: string;
}

const STAR_POSITIONS = [
  { top: '12%', left: '15%', delay: '0s' }, { top: '8%', left: '55%', delay: '0.6s' },
  { top: '25%', left: '80%', delay: '1.2s' }, { top: '40%', left: '10%', delay: '0.3s' },
  { top: '35%', left: '65%', delay: '1.8s' }, { top: '18%', left: '35%', delay: '0.9s' },
  { top: '50%', left: '45%', delay: '1.5s' }, { top: '30%', left: '90%', delay: '2.1s' },
  { top: '15%', left: '70%', delay: '0.4s' }, { top: '45%', left: '25%', delay: '1.1s' },
  { top: '55%', left: '75%', delay: '1.7s' }, { top: '22%', left: '50%', delay: '2.4s' },
];

function formatCardDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' \u00B7 ' + d.getFullYear();
  } catch { return iso; }
}

function formatDateStamp(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd} ${mm} ${d.getFullYear()}`;
  } catch { return iso; }
}

function getBadgeLabel(card: SavedNightCard, variant: CardVariant): { text: string; color: string } {
  switch (variant) {
    case 'origin': return { text: '\u2726 Origin Night \u00B7 First Story', color: 'rgba(180,120,20,0.7)' };
    case 'journey': return { text: `\uD83C\uDF1F Journey Complete \u00B7 ${card.nightNumber || 7}/7`, color: 'rgba(14,160,80,0.8)' };
    case 'occasion': return { text: `\uD83C\uDF89 ${card.occasion || 'Special'}`, color: 'rgba(100,80,220,0.7)' };
    case 'streak': return { text: `\uD83D\uDD25 ${card.streakCount || ''} Night Streak \u00B7 Milestone`, color: 'rgba(180,100,10,0.8)' };
    case 'milestone': return { text: `\u2728 ${card.milestone || ''} Nights \u00B7 Milestone`, color: 'rgba(200,140,255,0.8)' };
    default: return { text: `Night ${card.nightNumber || ''} \u00B7 ${card.storyTitle || ''}`, color: `${card.creatureColor || '#9A7FD4'}a6` };
  }
}

function getMiniBadge(variant: CardVariant): { emoji: string; bg: string } | null {
  switch (variant) {
    case 'origin': return { emoji: '\u2726', bg: 'rgba(245,184,76,0.85)' };
    case 'journey': return { emoji: '\uD83C\uDF1F', bg: 'rgba(20,216,144,0.8)' };
    case 'occasion': return { emoji: '\uD83C\uDF89', bg: 'rgba(148,130,255,0.8)' };
    case 'streak': return { emoji: '\uD83D\uDD25', bg: 'rgba(245,130,20,0.85)' };
    case 'milestone': return { emoji: '\u2728', bg: 'rgba(200,140,255,0.85)' };
    default: return null;
  }
}

function getPinStyle(variant: CardVariant): string {
  if (variant === 'origin') return 'radial-gradient(circle at 35% 35%, #ffd080, #c08040)';
  if (variant === 'journey') return 'radial-gradient(circle at 35% 35%, #80ffcc, #40a080)';
  if (variant === 'occasion') return 'radial-gradient(circle at 35% 35%, #c0a0ff, #8060c0)';
  if (variant === 'streak') return 'radial-gradient(circle at 35% 35%, #ffb060, #c07020)';
  return 'radial-gradient(circle at 35% 35%, #ff9090, #c84040)';
}

export { getPinStyle };

export default function NightCard({ card, size, onTap, flipped, onFlip, isPremium, onWhisperTap, childAge }: NightCardProps) {
  const variant = useMemo(() => getCardVariant(card), [card]);
  const vs = CARD_VARIANT_STYLES[variant];
  const hasPhoto = !!(card.photo && card.photo.length > 0);
  const creatureEmoji = card.creatureEmoji || card.emoji || '\uD83C\uDF19';
  const creatureColor = card.creatureColor || vs.glowColor;

  if (size === 'mini') {
    const badge = getMiniBadge(variant);
    return (
      <>
        <style>{CSS}</style>
        <div className="nc-mini" onClick={onTap} style={{
          width: '100%', aspectRatio: '5/7',
          boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
          border: `1.5px solid ${vs.borderColor}`,
        }}>
          {badge && (
            <div className="nc-mini-badge" style={{ background: badge.bg }}>
              <span style={{ fontSize: 8, lineHeight: 1 }}>{badge.emoji}</span>
            </div>
          )}
          <div className="nc-mini-sky" style={{ height: '55%', background: vs.skyGradient }}>
            {hasPhoto
              ? <img src={card.photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 26, zIndex: 2 }}>{creatureEmoji}</span>}
            <div className="nc-mini-sky-bleed" style={{ background: `linear-gradient(transparent, ${vs.paperColor})` }} />
          </div>
          <div className="nc-mini-paper" style={{ height: '45%', background: vs.paperColor, padding: '6px 8px' }}>
            <div className="nc-mini-headline">{card.headline || card.heroName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              {card.childMood && <span style={{ fontSize: 9 }}>{card.childMood}</span>}
              <div className="nc-mini-date">{formatCardDate(card.date)}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── FULL SIZE ──
  const badge = getBadgeLabel(card, variant);

  return (
    <>
      <style>{CSS}</style>
      <div className="nc-perspective" onClick={onFlip} style={{ cursor: 'pointer' }}>
        <div className={`nc-inner${flipped ? ' flipped' : ''}`} style={{
          width: 300, height: 420, borderRadius: 20,
          border: `1.5px solid ${vs.borderColor}`,
          boxShadow: vs.shadow,
        }}>
          {/* ── FRONT FACE ── */}
          <div className="nc-face nc-front" style={{ background: vs.paperColor }}>
            {/* Sky zone */}
            <div className="nc-sky" style={{ background: hasPhoto ? '#000' : vs.skyGradient }}>
              {hasPhoto ? (
                <>
                  <img className="nc-sky-photo" src={card.photo} alt="" loading="lazy" />
                  <div className="nc-sky-photo-overlay" style={{ background: `linear-gradient(to bottom, transparent 40%, ${vs.paperColor} 100%)` }} />
                  <div className="nc-sky-grain" />
                  <div className="nc-sky-date">{formatDateStamp(card.date)}</div>
                  <div className="nc-sky-creature" style={{
                    filter: `drop-shadow(0 4px 12px rgba(0,0,0,.4)) drop-shadow(0 0 16px ${creatureColor}80)`,
                  }}>{creatureEmoji}</div>
                </>
              ) : (
                <>
                  {/* Stars */}
                  {STAR_POSITIONS.map((s, i) => (
                    <div key={i} className="nc-star" style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
                  ))}
                  {/* Constellation glow */}
                  <div className="nc-sky-glow" style={{ background: vs.glowColor }} />
                  {/* Creature */}
                  <div className="nc-sky-creature-center" style={{
                    filter: `drop-shadow(0 4px 12px rgba(0,0,0,.4)) drop-shadow(0 0 16px ${creatureColor}80)`,
                  }}>{creatureEmoji}</div>
                  <div className="nc-sky-bleed" style={{ background: `linear-gradient(transparent, ${vs.paperColor})` }} />
                </>
              )}
              {variant === 'streak' && <div className="nc-streak-overlay" />}
            </div>

            {/* Paper zone */}
            <div className="nc-paper" style={{
              background: vs.paperColor,
              padding: hasPhoto ? '28px 18px 18px 72px' : '16px 18px 18px 18px',
            }}>
              <div className="nc-paper-inner">
                <div className="nc-badge-row">
                  <div className="nc-badge-label" style={{ color: badge.color }}>{badge.text}</div>
                  <div className="nc-badge-date">{formatCardDate(card.date)}</div>
                </div>
                <div className="nc-child-name">{card.heroName}'s card</div>
                <div className="nc-headline" style={{ color: vs.headlineColor }}>{card.headline}</div>
                {card.memory_line && <div className="nc-memory">{card.memory_line}</div>}
                {/* Mood + time badge */}
                {(card.childMood || card.bedtimeActual) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                    fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(60,40,20,.35)',
                    letterSpacing: '.02em',
                  }}>
                    {card.childMood && <span style={{ fontSize: 12 }}>{card.childMood}</span>}
                    {card.childMood && card.bedtimeActual && <span>{'\u00B7'}</span>}
                    {card.bedtimeActual && <span>{card.bedtimeActual.toLowerCase()}</span>}
                  </div>
                )}
                <div className="nc-footer">
                  <div className="nc-footer-left">
                    <span style={{ fontSize: 14 }}>{creatureEmoji}</span>
                    <span className="nc-footer-keeper">{card.heroName}</span>
                  </div>
                  <span className="nc-footer-brand">SleepSeed</span>
                </div>
              </div>
            </div>

            {/* Origin card treatments */}
            {variant === 'origin' && (
              <>
                <div className="nc-foil" />
                <div className="nc-corner nc-corner-tl">{'\u2726'}</div>
                <div className="nc-corner nc-corner-tr">{'\u2726'}</div>
                <div className="nc-corner nc-corner-bl">{'\u2726'}</div>
                <div className="nc-corner nc-corner-br">{'\u2726'}</div>
              </>
            )}
          </div>

          {/* ── BACK FACE ── */}
          <div className="nc-face nc-back" style={{ background: vs.paperColor, padding: '26px 22px 20px' }}>
            {hasPhoto && (
              <div className="nc-back-photo-thumb">
                <img src={card.photo} alt="" loading="lazy" />
              </div>
            )}
            <div style={{ marginLeft: hasPhoto ? 60 : 0, textAlign: hasPhoto ? 'left' : 'center' }}>
              <div className="nc-back-ornament">
                <div className="nc-back-ornament-emoji">{creatureEmoji}</div>
                <div className="nc-back-ornament-label">{card.heroName} {'\u00B7'} Night {card.nightNumber || '1'} of 7</div>
              </div>
            </div>

            <div className="nc-back-quote-wrap">
              <div className="nc-back-bigquote">{'\u201C'}</div>
              <div className="nc-back-quote-text">{card.quote}</div>
              <div className="nc-back-attribution">{'\u2014'} {card.heroName}{(childAge || card.childAge) ? `, age ${childAge || card.childAge}` : ''}</div>
            </div>

            <div className="nc-back-divider">
              <span className="nc-back-divider-star" style={{ background: vs.paperColor, padding: '0 6px' }}>{'\u2726'}</span>
            </div>

            {card.memory_line && <div className="nc-back-memory">{card.memory_line}</div>}

            {/* Story context strip */}
            {(card.storyTitle || card.bedtimeActual || card.childAge) && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '4px 8px', justifyContent: 'center',
                margin: '8px 0 4px', fontFamily: "'DM Mono',monospace", fontSize: 8,
                color: 'rgba(60,40,20,.32)', letterSpacing: '.02em',
              }}>
                {card.storyTitle && <span>{'\uD83D\uDCD6'} {card.storyTitle}</span>}
                {card.bedtimeActual && <span>{'\uD83D\uDD70'} {card.bedtimeActual.toLowerCase()}</span>}
                {card.childAge && <span>{card.heroName}, age {card.childAge}</span>}
              </div>
            )}

            {card.whisper ? (
              <div className="nc-back-whisper">
                <span className="nc-back-whisper-label">{'\uD83E\uDD2B'} Parent's Whisper</span>
                <span className="nc-back-whisper-text">{card.whisper}</span>
              </div>
            ) : null}

            {/* Child drawing */}
            {card.childDrawing && (
              <div style={{
                textAlign: 'center', marginTop: 6,
                background: 'rgba(20,216,144,.04)', border: '1px solid rgba(20,216,144,.1)',
                borderRadius: 10, padding: '6px 8px',
              }}>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '1.5px',
                  textTransform: 'uppercase' as const, color: 'rgba(20,216,144,.35)', marginBottom: 4,
                }}>{card.heroName}{'\u2019'}s drawing</div>
                <img src={card.childDrawing} alt="Drawing" style={{
                  width: '100%', maxWidth: 120, borderRadius: 6,
                  border: '1px solid rgba(20,216,144,.08)',
                }} />
              </div>
            )}

            {/* Voice clip */}
            {card.audioClip && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(154,127,212,.06)', border: '1px solid rgba(154,127,212,.12)',
                borderRadius: 10, padding: '6px 10px', marginTop: 6,
              }}>
                <span style={{ fontSize: 12 }}>{'\uD83C\uDFA4'}</span>
                <audio src={card.audioClip} controls style={{ flex: 1, height: 28, opacity: 0.7 }} />
              </div>
            )}

            {/* Morning reflection */}
            {card.parentReflection && (
              <div style={{
                background: 'rgba(20,216,144,.06)', border: '1px dashed rgba(20,216,144,.15)',
                borderRadius: 10, padding: '7px 12px', textAlign: 'center', marginTop: 6,
              }}>
                <span style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: '2px',
                  textTransform: 'uppercase' as const, color: 'rgba(20,216,144,.4)', display: 'block', marginBottom: 3,
                }}>{'\uD83D\uDCAD'} Morning thought</span>
                <span style={{
                  fontFamily: "'Fraunces',serif", fontSize: 10, fontWeight: 300,
                  fontStyle: 'italic', color: 'rgba(60,40,20,.5)', lineHeight: 1.45,
                }}>{card.parentReflection}</span>
              </div>
            )}

            <div className="nc-back-footer">
              <span className="nc-back-footer-story">{card.childMood ? `${card.childMood} ${card.heroName}` : card.storyTitle}</span>
              <span className="nc-back-footer-night">Night {card.nightNumber || '1'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
