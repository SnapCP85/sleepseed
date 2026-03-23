import { useState, useEffect, useMemo } from 'react';
import type { User, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, getAllHatchedCreatures, createEgg } from '../lib/hatchery';
import { CREATURES, getCreature } from '../lib/creatures';

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600;1,9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --teal:#1D9E75;--teal2:#5DCAA5;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
@keyframes hTwk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes hTwk2{0%,100%{opacity:.22}60%{opacity:.04}}
@keyframes hFlt{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes hFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes hPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes hPulse{0%,100%{opacity:.12;transform:scale(.97)}50%{opacity:.45;transform:scale(1.03)}}
@keyframes hRock{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
@keyframes hGlow{0%,100%{filter:drop-shadow(0 0 12px var(--cg,rgba(245,184,76,.2)))}50%{filter:drop-shadow(0 0 28px var(--cg,rgba(245,184,76,.5)))}}
@keyframes hShine{0%{left:-100%}100%{left:200%}}

.h{min-height:100vh;background:radial-gradient(ellipse 130% 60% at 50% 0%,#0a0830 0%,#040618 50%,#020410 100%);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;position:relative}
.h-sf{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.h-star{position:absolute;border-radius:50%;background:#EEE8FF;animation:hTwk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.h-star2{position:absolute;border-radius:50%;background:#C8C0B0;animation:hTwk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}

/* nav */
.h-nav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgba(4,6,24,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(96,232,176,.08);position:sticky;top:0;z-index:20}
.h-back{display:flex;align-items:center;gap:6px;background:rgba(96,232,176,.07);border:1px solid rgba(96,232,176,.18);border-radius:50px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;color:rgba(96,232,176,.7);transition:all .2s}
.h-back:hover{background:rgba(96,232,176,.13)}
.h-title{font-family:var(--serif);font-size:16px;color:var(--cream);font-weight:700}
.h-badge{padding:5px 10px;border-radius:50px;background:rgba(96,232,176,.08);border:1px solid rgba(96,232,176,.18);font-size:10.5px;font-weight:800;color:rgba(96,232,176,.65);font-family:var(--mono)}

.h-inner{max-width:440px;margin:0 auto;padding:0 16px 100px;position:relative;z-index:5}
.h-section{font-size:10px;font-weight:800;color:rgba(255,255,255,.22);text-transform:uppercase;letter-spacing:.1em;font-family:var(--mono);margin:20px 0 12px;display:flex;align-items:center;gap:8px}
.h-section::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}

/* ═══════════════════════════════════════════
   CREATURE CARD — the hero of the hatchery
   Vertical, collectible, like a night card
═══════════════════════════════════════════ */
.hc{border-radius:24px;overflow:hidden;position:relative;margin-bottom:16px;animation:hFade .5s ease-out both;cursor:pointer;transition:transform .22s,box-shadow .22s}
.hc:hover{transform:translateY(-3px)}
/* top-edge shine line */
.hc::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;z-index:3;background:linear-gradient(90deg,transparent,var(--cc,rgba(245,184,76,.4)),transparent)}
/* shimmer sweep */
.hc::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.04),transparent);z-index:3;pointer-events:none;animation:hShine 6s ease-in-out infinite}

/* header: rarity band */
.hc-header{padding:10px 16px 0;display:flex;align-items:center;justify-content:space-between}
.hc-rarity{display:flex;align-items:center;gap:4px;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;font-family:var(--mono)}
.hc-week{font-size:9px;font-weight:700;font-family:var(--mono);letter-spacing:.06em}
.hc-new{font-size:7px;font-weight:900;padding:2px 8px;border-radius:10px;font-family:var(--mono)}

/* emoji hero area */
.hc-hero{text-align:center;padding:18px 0 10px;position:relative}
.hc-aura{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:140px;height:140px;border-radius:50%;pointer-events:none;animation:hPulse 4s ease-in-out infinite}
.hc-emoji{font-size:68px;position:relative;z-index:2;animation:hFlt 3.5s ease-in-out infinite;display:inline-block}

/* name + type */
.hc-identity{text-align:center;padding:0 18px 12px}
.hc-name{font-family:'Fraunces',serif;font-size:24px;font-weight:700;line-height:1.15;margin-bottom:2px}
.hc-type{font-size:9.5px;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase}
.hc-desc{font-family:var(--serif);font-size:12.5px;font-style:italic;line-height:1.5;margin-top:6px;padding:0 8px}

/* divider */
.hc-div{height:1px;margin:0 18px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)}

/* dream quote — the heart of the card */
.hc-dream{padding:14px 18px}
.hc-dream-lbl{font-size:8px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.hc-dream-lbl::before{content:'';width:12px;height:1px}
.hc-dream-q{font-family:'Fraunces',serif;font-size:15px;font-style:italic;line-height:1.6}

/* traits */
.hc-traits{padding:0 18px 14px;display:flex;flex-wrap:wrap;gap:6px}
.hc-trait{padding:4px 12px;border-radius:50px;font-size:9.5px;font-weight:700;letter-spacing:.02em}

/* photo strip */
.hc-photo-wrap{position:relative;margin:0 14px 14px;border-radius:14px;overflow:hidden}
.hc-photo{width:100%;display:block;aspect-ratio:4/3;object-fit:cover}
.hc-photo-creature{position:absolute;z-index:2;animation:hFlt 3s ease-in-out infinite;filter:drop-shadow(0 3px 10px rgba(0,0,0,.5))}
.hc-photo-overlay{position:absolute;bottom:0;left:0;right:0;padding:10px 14px;background:linear-gradient(transparent,rgba(0,0,0,.65));z-index:3}
.hc-photo-caption{font-size:10.5px;font-weight:700}

/* secret whisper */
.hc-whisper{padding:0 18px 16px}
.hc-whisper-inner{padding:10px 14px;border-radius:12px;display:flex;align-items:flex-start;gap:8px}
.hc-whisper-ico{font-size:14px;flex-shrink:0;margin-top:1px}
.hc-whisper-text{font-size:11px;font-style:italic;line-height:1.55}

/* footer */
.hc-foot{padding:8px 18px 14px;display:flex;align-items:center;justify-content:space-between}
.hc-date{font-size:9px;font-family:var(--mono);letter-spacing:.04em}
.hc-tap{font-size:9px;font-weight:700}

/* ═══════════════════════════════════════════
   ACTIVE EGG
═══════════════════════════════════════════ */
.h-egg{border-radius:22px;padding:20px;position:relative;overflow:hidden;margin-bottom:14px;animation:hFade .5s ease-out .1s both;text-align:center}
.h-egg::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(245,184,76,.35),transparent)}
.h-egg-emoji{font-size:56px;animation:hRock 2.5s ease-in-out infinite;display:inline-block;margin-bottom:10px;filter:drop-shadow(0 0 16px rgba(245,184,76,.35))}
.h-egg-name{font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:#FFE080;margin-bottom:2px}
.h-egg-sub{font-size:10px;color:rgba(245,184,76,.4);font-family:var(--mono);letter-spacing:.06em;margin-bottom:10px}
.h-egg-bar{height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden;max-width:200px;margin:0 auto}
.h-egg-fill{height:100%;background:linear-gradient(90deg,#F5B84C,#FFE080);border-radius:3px;transition:width .6s ease}
.h-egg-hint{font-size:11px;font-weight:700;color:rgba(245,184,76,.38);margin-top:7px}

/* ═══════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════ */
.h-mod-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(12px);animation:hFade .15s ease}
.h-mod{background:linear-gradient(175deg,#0c1030,#080c20);border-radius:24px;max-width:400px;width:100%;max-height:88vh;overflow-y:auto;animation:hPop .3s ease-out;position:relative;border:1px solid rgba(255,255,255,.06)}
.h-mod::-webkit-scrollbar{display:none}
.h-mod-x{position:sticky;top:0;z-index:5;display:flex;justify-content:flex-end;padding:12px 14px 0}
.h-mod-x button{background:rgba(255,255,255,.06);border:none;width:32px;height:32px;border-radius:50%;color:rgba(255,255,255,.4);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.h-mod-hero{text-align:center;padding:8px 20px 16px}
.h-mod-emoji{font-size:80px;animation:hFlt 3s ease-in-out infinite;display:inline-block;margin-bottom:8px}
.h-mod-name{font-family:'Fraunces',serif;font-size:28px;font-weight:700;margin-bottom:2px}
.h-mod-type{font-size:10px;font-family:var(--mono);letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
.h-mod-rar{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:50px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-family:var(--mono)}
.h-mod-desc{font-family:'Fraunces',serif;font-size:15px;font-style:italic;line-height:1.55;padding:12px 24px 0}
.h-mod-body{padding:16px 20px 20px}
.h-mod-lbl{font-size:8px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.2);margin-bottom:6px}
.h-mod-quote{font-family:'Fraunces',serif;font-size:16px;font-style:italic;line-height:1.6;padding:14px 16px;border-radius:16px;margin-bottom:16px}
.h-mod-traits{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.h-mod-trait{padding:5px 14px;border-radius:50px;font-size:10.5px;font-weight:700}
.h-mod-secret{font-size:12.5px;font-style:italic;line-height:1.6;margin-bottom:16px;padding:12px 14px;border-radius:14px;display:flex;align-items:flex-start;gap:8px}
.h-mod-photo{width:100%;border-radius:14px;margin-bottom:16px;object-fit:cover}
.h-mod-date{font-size:10px;font-family:var(--mono);color:rgba(255,255,255,.2);text-align:center;padding-bottom:8px}

/* empty */
.h-empty{text-align:center;padding:50px 20px}
.h-empty-ico{font-size:52px;margin-bottom:14px}
.h-empty-h{font-family:'Fraunces',serif;font-size:18px;color:var(--cream);margin-bottom:6px;font-style:italic}
.h-empty-sub{font-size:12.5px;color:rgba(244,239,232,.3);line-height:1.65}

/* bottom nav */
.h-bnav{display:flex;background:rgba(4,6,24,.97);border-top:1px solid rgba(96,232,176,.08);padding:10px 0 8px;position:sticky;bottom:0;z-index:20}
.h-bnav-i{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:2px 0}
.h-bnav-ico{font-size:20px;line-height:1}
.h-bnav-lbl{font-size:9.5px;font-weight:800}
.h-bnav-i.on .h-bnav-lbl{color:var(--teal2)}
.h-bnav-i:not(.on) .h-bnav-lbl{color:rgba(255,255,255,.16)}
.h-bnav-i:not(.on) .h-bnav-ico{filter:grayscale(1) opacity(.3)}
`;

// ── Stars ────────────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 45,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
  t: Math.random() < .5 ? 1 : 2,
}));

const RARITY: Record<string, { label: string; icon: string; bg: string; border: string; text: string }> = {
  legendary: { label: 'LEGENDARY', icon: '⭐', bg: 'rgba(245,184,76,.12)', border: 'rgba(245,184,76,.3)', text: '#F5B84C' },
  rare:      { label: 'RARE',      icon: '✦',  bg: 'rgba(180,140,255,.1)', border: 'rgba(180,140,255,.25)', text: '#b48cff' },
  common:    { label: 'COMMON',    icon: '·',  bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.08)', text: 'rgba(255,255,255,.35)' },
};

// ── Component ────────────────────────────────────────────────────────────────

interface HatcheryProps {
  user: User;
  onBack: () => void;
}

export default function Hatchery({ user, onBack }: HatcheryProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [creatures, setCreatures] = useState<HatchedCreature[]>([]);
  const [eggs, setEggs] = useState<Map<string, HatcheryEgg>>(new Map());
  const [allCards, setAllCards] = useState<import('../lib/types').SavedNightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HatchedCreature | null>(null);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }
    const load = async () => {
      const { getCharacters, getNightCards } = await import('../lib/storage');
      const [chars, c, cards] = await Promise.all([
        getCharacters(user.id),
        getAllHatchedCreatures(user.id),
        getNightCards(user.id),
      ]);
      const familyChars = chars.filter(ch => ch.isFamily === true || (ch.isFamily === undefined && ch.type === 'human'));
      setCharacters(familyChars);
      setCreatures(c);
      setAllCards(cards);
      const eggMap = new Map<string, HatcheryEgg>();
      for (const char of familyChars) {
        let egg = await getActiveEgg(user.id, char.id);
        if (!egg) {
          try { const rc = CREATURES[Math.floor(Math.random() * CREATURES.length)]; egg = await createEgg(user.id, char.id, rc.id, 1); } catch {}
        }
        if (egg) eggMap.set(char.id, egg);
      }
      setEggs(eggMap);
      setLoading(false);
    };
    load();
  }, [user.id]); // eslint-disable-line

  const primaryChar = characters[0] ?? null;
  const primaryEgg = primaryChar ? eggs.get(primaryChar.id) ?? null : null;
  const primaryStage = useMemo(() => {
    if (!primaryEgg) return 0;
    const sd = primaryEgg.startedAt.split('T')[0];
    return Math.min(allCards.filter(card => card.characterIds.includes(primaryEgg.characterId) && card.date.split('T')[0] >= sd).length, 7);
  }, [primaryEgg, allCards]);

  const newestId = creatures.length > 0 ? creatures[0].id : null;

  const starField = STARS.map(s => (
    <div key={s.id} className={s.t === 1 ? 'h-star' : 'h-star2'}
      style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
  ));

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="h">
      <style>{CSS}</style>
      <div className="h-sf">{starField}</div>
      <div className="h-nav">
        <div className="h-back" onClick={onBack}>← Home</div>
        <div className="h-title">Your Hatchery</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>
        Loading your companions...
      </div>
    </div>
  );

  // ── Creature Card ──────────────────────────────────────────────────────────

  function CreatureCard({ c, index }: { c: HatchedCreature; index: number }) {
    const def = getCreature(c.creatureType);
    const r = RARITY[c.rarity] || RARITY.common;
    const isNew = c.id === newestId;
    const hatchDate = new Date(c.hatchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <div className="hc" style={{
        background: `linear-gradient(170deg,${c.color}0c,${c.color}04,rgba(4,6,20,.98))`,
        border: `1.5px solid ${c.color}22`,
        boxShadow: `0 4px 24px ${c.color}10,0 0 0 1px ${c.color}08 inset`,
        animationDelay: `${index * 0.08}s`,
        '--cc': `${c.color}50`,
      } as any}
        onClick={() => setSelected(c)}>

        {/* header */}
        <div className="hc-header">
          <div className="hc-rarity" style={{ color: r.text }}>{r.icon} {r.label}</div>
          {isNew && <div className="hc-new" style={{ background: c.color, color: '#0a0300' }}>JUST HATCHED</div>}
          <div className="hc-week" style={{ color: `${c.color}55` }}>Week {c.weekNumber}</div>
        </div>

        {/* emoji hero */}
        <div className="hc-hero">
          <div className="hc-aura" style={{ background: `radial-gradient(circle,${c.color}18,transparent 70%)` }} />
          <div className="hc-emoji" style={{ filter: `drop-shadow(0 6px 20px ${c.color}45)` }}>{c.creatureEmoji}</div>
        </div>

        {/* name */}
        <div className="hc-identity">
          <div className="hc-name" style={{ color: c.color }}>{c.name}</div>
          <div className="hc-type" style={{ color: `${c.color}60` }}>{def.name}</div>
          <div className="hc-desc" style={{ color: `${c.color}88` }}>{def.description}</div>
        </div>

        <div className="hc-div" />

        {/* dream — the emotional center */}
        {c.dreamAnswer && (
          <div className="hc-dream">
            <div className="hc-dream-lbl" style={{ color: `${c.color}40` }}>
              <span style={{ background: `${c.color}30`, display: 'inline' }} />
              First dream
            </div>
            <div className="hc-dream-q" style={{ color: `${c.color}cc` }}>
              "{c.name} dreams about {c.dreamAnswer}"
            </div>
          </div>
        )}

        {/* traits */}
        {c.personalityTraits.length > 0 && (
          <div className="hc-traits">
            {c.personalityTraits.map(t => (
              <div key={t} className="hc-trait" style={{ background: `${c.color}0e`, color: `${c.color}aa`, border: `1px solid ${c.color}18` }}>{t}</div>
            ))}
          </div>
        )}

        {/* photo */}
        {c.photoUrl && (
          <div className="hc-photo-wrap">
            <img className="hc-photo" src={c.photoUrl} alt={c.name} />
            <div className="hc-photo-overlay">
              <div className="hc-photo-caption" style={{ color: `${c.color}cc` }}>The night {c.name} arrived</div>
            </div>
          </div>
        )}

        {/* parent's whisper */}
        {c.parentSecret && (
          <div className="hc-whisper">
            <div className="hc-whisper-inner" style={{ background: `${c.color}06`, border: `1px solid ${c.color}0c` }}>
              <div className="hc-whisper-ico">🤫</div>
              <div className="hc-whisper-text" style={{ color: `${c.color}80` }}>{c.parentSecret}</div>
            </div>
          </div>
        )}

        {/* footer */}
        <div className="hc-foot">
          <div className="hc-date" style={{ color: `${c.color}35` }}>Hatched {hatchDate}</div>
          <div className="hc-tap" style={{ color: `${c.color}40` }}>Tap to visit →</div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h">
      <style>{CSS}</style>
      <div className="h-sf">{starField}</div>

      <div className="h-nav">
        <div className="h-back" onClick={onBack}>← Home</div>
        <div className="h-title">Your Hatchery</div>
        <div className="h-badge">{creatures.length} companion{creatures.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="h-inner">

        {/* active egg — always at the top */}
        {primaryEgg && (
          <>
            <div className="h-section">Next Companion</div>
            <div className="h-egg" style={{
              background: 'linear-gradient(170deg,rgba(245,184,76,.06),rgba(4,6,20,.98))',
              border: '1.5px solid rgba(245,184,76,.14)',
            }}>
              <div className="h-egg-emoji">🥚</div>
              <div className="h-egg-name">Something is growing...</div>
              <div className="h-egg-sub">WEEK {primaryEgg.weekNumber} · {primaryStage} OF 7 NIGHTS</div>
              <div className="h-egg-bar">
                <div className="h-egg-fill" style={{ width: `${Math.round((primaryStage / 7) * 100)}%` }} />
              </div>
              <div className="h-egg-hint">
                {primaryStage >= 7
                  ? 'Ready to hatch!'
                  : `${7 - primaryStage} more bedtime ritual${7 - primaryStage !== 1 ? 's' : ''} to find out who's inside`}
              </div>
            </div>
          </>
        )}

        {/* companions */}
        {creatures.length > 0 && (
          <>
            <div className="h-section">{creatures.length === 1 ? 'Your Companion' : `Your Companions · ${creatures.length}`}</div>
            {creatures.map((c, i) => <CreatureCard key={c.id} c={c} index={i} />)}
          </>
        )}

        {/* empty */}
        {creatures.length === 0 && !primaryEgg && (
          <div className="h-empty">
            <div className="h-empty-ico">🥚</div>
            <div className="h-empty-h">Your hatchery is waiting</div>
            <div className="h-empty-sub">Complete bedtime rituals to hatch your first companion.</div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {selected && (() => {
        const c = selected;
        const def = getCreature(c.creatureType);
        const r = RARITY[c.rarity] || RARITY.common;
        return (
          <div className="h-mod-bg" onClick={() => setSelected(null)}>
            <div className="h-mod" style={{ borderColor: `${c.color}18` }} onClick={e => e.stopPropagation()}>
              <div className="h-mod-x"><button onClick={() => setSelected(null)}>×</button></div>

              <div className="h-mod-hero" style={{ background: `linear-gradient(180deg,${c.color}0c,transparent)` }}>
                <div className="h-mod-emoji" style={{ filter: `drop-shadow(0 8px 24px ${c.color}50)` }}>{c.creatureEmoji}</div>
                <div className="h-mod-name" style={{ color: c.color }}>{c.name}</div>
                <div className="h-mod-type" style={{ color: `${c.color}60` }}>{def.name}</div>
                <div className="h-mod-rar" style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.text }}>
                  {r.icon} {r.label} · Week {c.weekNumber}
                </div>
              </div>

              <div className="h-mod-desc" style={{ color: `${c.color}88`, textAlign: 'center' }}>{def.description}</div>

              <div className="h-mod-body">
                {c.dreamAnswer && (
                  <>
                    <div className="h-mod-lbl">First Dream</div>
                    <div className="h-mod-quote" style={{ background: `${c.color}08`, border: `1px solid ${c.color}12`, color: `${c.color}cc` }}>
                      "{c.name} dreams about {c.dreamAnswer}"
                    </div>
                  </>
                )}

                {c.personalityTraits.length > 0 && (
                  <>
                    <div className="h-mod-lbl">Personality</div>
                    <div className="h-mod-traits">
                      {c.personalityTraits.map(t => (
                        <div key={t} className="h-mod-trait" style={{ background: `${c.color}0e`, color: `${c.color}bb`, border: `1px solid ${c.color}1a` }}>{t}</div>
                      ))}
                    </div>
                  </>
                )}

                {c.parentSecret && (
                  <>
                    <div className="h-mod-lbl">Parent's Whisper</div>
                    <div className="h-mod-secret" style={{ background: `${c.color}06`, border: `1px solid ${c.color}0c`, color: `${c.color}88` }}>
                      <span style={{ flexShrink: 0 }}>🤫</span>
                      <span>{c.parentSecret}</span>
                    </div>
                  </>
                )}

                {c.photoUrl && (
                  <>
                    <div className="h-mod-lbl">The Night We Met</div>
                    <div style={{position:'relative',marginBottom:16,borderRadius:14,overflow:'hidden'}}>
                      <img className="h-mod-photo" src={c.photoUrl} alt={c.name} style={{marginBottom:0}} />
                      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 14px',background:'linear-gradient(transparent,rgba(0,0,0,.55))',zIndex:3}}>
                        <div style={{fontSize:10,fontWeight:700,color:`${c.color}cc`}}>The night {c.name} arrived</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="h-mod-date">
                  Hatched {new Date(c.hatchedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* bottom nav */}
      <div className="h-bnav">
        <div className="h-bnav-i" onClick={onBack}><div className="h-bnav-ico">🏠</div><div className="h-bnav-lbl">Home</div></div>
        <div className="h-bnav-i"><div className="h-bnav-ico">📖</div><div className="h-bnav-lbl">Stories</div></div>
        <div className="h-bnav-i"><div className="h-bnav-ico">🌙</div><div className="h-bnav-lbl">Cards</div></div>
        <div className="h-bnav-i on"><div className="h-bnav-ico">🥚</div><div className="h-bnav-lbl">Hatchery</div></div>
      </div>
    </div>
  );
}
