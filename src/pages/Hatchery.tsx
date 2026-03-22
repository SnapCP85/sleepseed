import { useState, useEffect, useMemo } from 'react';
import type { User, Character, HatcheryEgg, HatchedCreature } from '../lib/types';
import { hasSupabase } from '../lib/supabase';
import { getActiveEgg, getAllHatchedCreatures, createEgg } from '../lib/hatchery';
import { CREATURES } from '../lib/creatures';

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--amber:#E8972A;--amber2:#F5B84C;
  --teal:#1D9E75;--teal2:#5DCAA5;
  --cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes twk2{0%,100%{opacity:.22}60%{opacity:.04}}
@keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.72;transform:scale(1.05)}}

.hscr{background:linear-gradient(175deg,#050420 0%,#030315 55%,#020210 100%);min-height:100vh;position:relative;font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased}
.hscr-sf{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.hscr-star{position:absolute;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.hscr-star2{position:absolute;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite}

/* nav */
.hscr-nav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgba(4,6,24,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(96,232,176,.08);position:sticky;top:0;z-index:20}
.hscr-back{display:flex;align-items:center;gap:6px;background:rgba(96,232,176,.07);border:1px solid rgba(96,232,176,.18);border-radius:50px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:800;color:rgba(96,232,176,.7);transition:all .2s;font-family:var(--sans)}
.hscr-back:hover{background:rgba(96,232,176,.13)}
.hscr-title{font-family:var(--serif);font-size:16px;color:var(--cream);font-weight:700}
.hscr-egg-badge{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:50px;background:rgba(245,184,76,.1);border:1px solid rgba(245,184,76,.2);font-size:10.5px;font-weight:800;color:rgba(245,184,76,.75);font-family:var(--mono)}

/* living room */
.hroom{position:relative;height:180px;margin:14px 16px 12px;background:linear-gradient(170deg,#07062a,#04031a,#020210);border:1px solid rgba(255,255,255,.05);border-radius:24px;overflow:hidden;z-index:5}
.hroom-floor{position:absolute;bottom:0;left:0;right:0;height:38px;background:linear-gradient(0deg,rgba(18,10,46,.9),transparent)}
.hroom-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(20px)}
.hc-creature{position:absolute;bottom:16px;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:5}
.hc-e{font-size:38px;line-height:1;animation:flt var(--d,4s) ease-in-out infinite var(--dl,0s)}
.hc-n{font-size:9px;font-weight:800;color:rgba(255,255,255,.5);font-family:var(--sans)}
.hc-sh{width:32px;height:6px;border-radius:50%;background:rgba(0,0,0,.4);margin-top:-3px}
.hroom-locked{position:absolute;bottom:20px;width:42px;height:42px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;font-size:16px;opacity:.18}

/* progress */
.hprog{margin:0 16px 12px;background:rgba(255,255,255,.022);border:1px solid rgba(245,184,76,.11);border-radius:18px;padding:12px 16px;position:relative;z-index:5;animation:fadein .4s ease-out}
.hp-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.hp-lbl{font-size:13px;font-weight:800;color:#FFE080}
.hp-num{font-size:21px;font-weight:800;color:var(--amber2);line-height:1;font-family:var(--serif)}
.hp-bar{height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden}
.hp-fill{height:100%;background:linear-gradient(90deg,#F5B84C,#FFE080);border-radius:3px;transition:width .6s ease}
.hp-hint{font-size:10.5px;font-weight:700;color:rgba(245,184,76,.42);margin-top:5px}

/* grid */
.hgrid-section{padding:0 16px 16px;position:relative;z-index:5;animation:fadein .5s ease-out .1s both}
.hgs-title{font-size:11.5px;font-weight:800;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:9px;font-family:var(--mono)}
.hgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hg{background:rgba(255,255,255,.025);border:1.5px solid rgba(255,255,255,.07);border-radius:17px;padding:12px 9px 10px;text-align:center;position:relative;transition:all .22s}
.hg:hover{transform:scale(1.04);border-color:rgba(245,184,76,.28);background:rgba(245,184,76,.05)}
.hg.new{border-color:rgba(245,184,76,.42);background:rgba(245,184,76,.06);box-shadow:0 0 16px rgba(245,184,76,.14)}
.hg.new::after{content:'NEW';position:absolute;top:4px;left:4px;background:#F5B84C;color:#0a0300;font-size:7px;font-weight:900;padding:1px 5px;border-radius:8px;font-family:var(--mono)}
.hg-rar{position:absolute;top:5px;right:5px;width:13px;height:13px;border-radius:50%;font-size:7px;display:flex;align-items:center;justify-content:center}
.hg-emoji{font-size:30px;line-height:1;margin-bottom:4px;animation:flt var(--d,4s) ease-in-out infinite var(--dl,0s)}
.hg-name{font-size:11px;font-weight:800;color:rgba(255,255,255,.62);margin-bottom:2px}
.hg-wk{font-size:9px;color:rgba(255,255,255,.24);font-weight:700}
.hg-lock{opacity:.18;cursor:default;border-style:dashed}
.hg-lock:hover{transform:none;border-color:rgba(255,255,255,.07);background:transparent}

/* bottom nav */
.hbnav{display:flex;background:rgba(4,6,24,.97);border-top:1px solid rgba(96,232,176,.08);padding:10px 0 8px;position:sticky;bottom:0;z-index:20}
.hbnav-i{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;position:relative;padding:2px 0}
.hbnav-ico{font-size:20px;line-height:1}
.hbnav-lbl{font-size:9.5px;font-weight:800}
.hbnav-i.on .hbnav-lbl{color:var(--teal2)}
.hbnav-i:not(.on) .hbnav-lbl{color:rgba(255,255,255,.16)}
.hbnav-i:not(.on) .hbnav-ico{filter:grayscale(1) opacity(.3)}

/* empty state */
.hscr-empty{text-align:center;padding:40px 20px;position:relative;z-index:5}
.hscr-empty-ico{font-size:48px;margin-bottom:12px}
.hscr-empty-h{font-family:var(--serif);font-size:17px;color:var(--cream);margin-bottom:6px;font-style:italic}
.hscr-empty-sub{font-size:12px;color:rgba(244,239,232,.35);line-height:1.65}
`;

// ── stars ─────────────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 40,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
  t: Math.random() < .5 ? 1 : 2,
}));

// ── room positions ───────────────────────────────────────────────────────────

const ROOM_POSITIONS = [
  { left: 24 },
  { left: 100 },
  { left: 180 },
  { left: 260 },
  { left: 330 },
];

// ── component ────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }
    const load = async () => {
      // Fetch characters, creatures, and night cards
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

      // Fetch active egg for each family character
      const eggMap = new Map<string, HatcheryEgg>();
      for (const char of familyChars) {
        let egg = await getActiveEgg(user.id, char.id);
        if (!egg) {
          try { const rc=CREATURES[Math.floor(Math.random()*CREATURES.length)]; egg = await createEgg(user.id, char.id, rc.id, 1); } catch {}
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
    const startDate = primaryEgg.startedAt.split('T')[0];
    const count = allCards.filter(card =>
      card.characterIds.includes(primaryEgg.characterId) &&
      card.date.split('T')[0] >= startDate
    ).length;
    return Math.min(count, 7);
  }, [primaryEgg, allCards]);

  // Most recent 5 creatures for the living room
  const roomCreatures = creatures.slice(0, 5);
  const lockedSlots = Math.max(0, 5 - roomCreatures.length);

  // Grid: all creatures + locked slots to fill to 9
  const gridLocked = Math.max(0, 9 - creatures.length);

  // Most recently hatched creature (for NEW badge)
  const newestId = creatures.length > 0 ? creatures[0].id : null;

  if (loading) return (
    <div className="hscr">
      <style>{CSS}</style>
      <div className="hscr-sf">
        {STARS.map(s => (
          <div key={s.id} className={s.t === 1 ? 'hscr-star' : 'hscr-star2'}
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
        ))}
      </div>
      <div className="hscr-nav">
        <div className="hscr-back" onClick={onBack}>← Home</div>
        <div className="hscr-title">Your Hatchery</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
        Loading your creatures...
      </div>
    </div>
  );

  return (
    <div className="hscr">
      <style>{CSS}</style>

      {/* star field */}
      <div className="hscr-sf">
        {STARS.map(s => (
          <div key={s.id} className={s.t === 1 ? 'hscr-star' : 'hscr-star2'}
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
        ))}
      </div>

      {/* nav */}
      <div className="hscr-nav">
        <div className="hscr-back" onClick={onBack}>← Home</div>
        <div className="hscr-title">Your Hatchery</div>
        <div className="hscr-egg-badge">
          {primaryEgg ? `${primaryStage} / 7` : '—'}
        </div>
      </div>

      {/* living room */}
      <div className="hroom">
        <div className="hroom-glow" style={{ width: 200, height: 80, top: 8, left: -50, background: 'radial-gradient(ellipse,rgba(245,184,76,.08),transparent 70%)' }} />
        <div className="hroom-glow" style={{ width: 180, height: 70, top: 18, right: -40, background: 'radial-gradient(ellipse,rgba(96,232,176,.07),transparent 70%)' }} />
        <div className="hroom-glow" style={{ width: 160, height: 60, bottom: 5, left: '30%', background: 'radial-gradient(ellipse,rgba(180,140,255,.07),transparent 70%)' }} />
        <div className="hroom-floor" />

        {roomCreatures.map((c, i) => {
          const pos = ROOM_POSITIONS[i];
          const d = (3.5 + i * 0.5).toFixed(1) + 's';
          const dl = (-i * 0.6).toFixed(1) + 's';
          return (
            <div key={c.id} className="hc-creature" style={{ left: pos.left, '--d': d, '--dl': dl } as any}>
              <div className="hc-e" style={{ '--d': d, '--dl': dl } as any}>{c.creatureEmoji}</div>
              <div className="hc-n">{c.name}</div>
              <div className="hc-sh" />
            </div>
          );
        })}

        {Array.from({ length: lockedSlots }, (_, i) => (
          <div key={`lock-${i}`} className="hroom-locked"
            style={{ left: ROOM_POSITIONS[roomCreatures.length + i]?.left ?? 330 }}>
            🔒
          </div>
        ))}
      </div>

      {/* egg progress card */}
      {primaryEgg && (
        <div className="hprog">
          <div className="hp-row">
            <div className="hp-lbl">{primaryEgg.creatureEmoji} {primaryChar?.name}'s Hatchling · Week {primaryEgg.weekNumber}</div>
            <div className="hp-num">{primaryStage}/7</div>
          </div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${Math.round((primaryStage / 7) * 100)}%` }} />
          </div>
          <div className="hp-hint">
            {primaryStage >= 7
              ? 'Ready to hatch!'
              : `${7 - primaryStage} more night${7 - primaryStage !== 1 ? 's' : ''} to hatch your ${primaryEgg.creatureType}!`}
          </div>
        </div>
      )}

      {/* empty state */}
      {creatures.length === 0 && !primaryEgg && (
        <div className="hscr-empty">
          <div className="hscr-empty-ico">🥚</div>
          <div className="hscr-empty-h">Your hatchery is waiting</div>
          <div className="hscr-empty-sub">Complete bedtime rituals to hatch creatures.<br />Each week brings a new egg!</div>
        </div>
      )}

      {/* creature collection grid */}
      {(creatures.length > 0 || primaryEgg) && (
        <div className="hgrid-section">
          <div className="hgs-title">
            All Creatures · {creatures.length} hatched
          </div>
          <div className="hgrid">
            {creatures.map((c, i) => {
              const isNew = c.id === newestId;
              const d = (3.5 + (i % 5) * 0.4).toFixed(1) + 's';
              const dl = (-(i % 5) * 0.5).toFixed(1) + 's';
              return (
                <div key={c.id} className={`hg${isNew ? ' new' : ''}`}>
                  {c.rarity === 'legendary' && (
                    <div className="hg-rar" style={{ background: '#F5B84C', color: '#0a0300' }}>⭐</div>
                  )}
                  {c.rarity === 'rare' && (
                    <div className="hg-rar" style={{ background: 'rgba(180,140,255,.8)', color: '#fff' }}>✦</div>
                  )}
                  <div className="hg-emoji" style={{ '--d': d, '--dl': dl } as any}>{c.creatureEmoji}</div>
                  <div className="hg-name">{c.name}</div>
                  <div className="hg-wk">Week {c.weekNumber}</div>
                </div>
              );
            })}
            {Array.from({ length: gridLocked }, (_, i) => (
              <div key={`gl-${i}`} className="hg hg-lock">
                <div className="hg-emoji" style={{ fontSize: 24, filter: 'grayscale(1) brightness(.3)' }}>🔒</div>
                <div className="hg-name" style={{ color: 'rgba(255,255,255,.18)' }}>Week {creatures.length + i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* bottom nav */}
      <div className="hbnav">
        <div className="hbnav-i" onClick={onBack}>
          <div className="hbnav-ico">🏠</div>
          <div className="hbnav-lbl">Home</div>
        </div>
        <div className="hbnav-i">
          <div className="hbnav-ico">📖</div>
          <div className="hbnav-lbl">Stories</div>
        </div>
        <div className="hbnav-i">
          <div className="hbnav-ico">🌙</div>
          <div className="hbnav-lbl">Cards</div>
        </div>
        <div className="hbnav-i on">
          <div className="hbnav-ico">🥚</div>
          <div className="hbnav-lbl">Hatchery</div>
        </div>
      </div>
    </div>
  );
}
