import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getNightCards, deleteNightCard, saveNightCard } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import type { SavedNightCard } from '../../lib/types';
import { getCardVariant, CARD_VARIANT_STYLES } from '../../lib/types';
import NightCardDetailPaginated from './NightCardDetailPaginated';
import { generateNightCardImage, downloadBlob, generateNightCardBook } from '../../lib/shareUtils';
import { BASE_URL } from '../../lib/config';

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const TILT_CLASSES = ['tilt-l','tilt-r','tilt-ll','tilt-rr','','tilt-l','tilt-rr','tilt-r','tilt-ll'] as const;

function numberWord(n: number): string {
  const w = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty',
    'Twenty-one','Twenty-two','Twenty-three','Twenty-four','Twenty-five','Twenty-six','Twenty-seven',
    'Twenty-eight','Twenty-nine','Thirty','Thirty-one'];
  return n <= 31 ? w[n] : String(n);
}

function shortDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Tonight';
    if (diff === 1) return 'Last night';
    if (diff < 7) return `${diff} nights ago`;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

/* ─── Bucket grouping ─── */
interface Bucket { key: string; eyebrow: string; title: string; count: string; cards: SavedNightCard[]; pinned?: boolean }

function groupIntoBuckets(cards: SavedNightCard[]): Bucket[] {
  if (cards.length === 0) return [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const sorted = [...cards].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Early days: only pin when we have enough history
  const chronological = [...cards].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const shouldPin = cards.length > 20;
  const earlyIds = shouldPin ? new Set(chronological.slice(0, Math.min(10, chronological.length)).map(c => c.id)) : new Set<string>();
  const earlyCards = shouldPin ? chronological.filter(c => earlyIds.has(c.id)) : [];
  const restCards = sorted.filter(c => !earlyIds.has(c.id));

  const buckets: Bucket[] = [];
  const thisWeek: SavedNightCard[] = [];
  const earlierMonth: SavedNightCard[] = [];
  const byMonth = new Map<string, SavedNightCard[]>();

  for (const card of restCards) {
    const d = new Date(card.date);
    if (d >= weekAgo) thisWeek.push(card);
    else if (d >= monthStart) earlierMonth.push(card);
    else {
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(card);
    }
  }

  const makeDateRange = (cards: SavedNightCard[]) => {
    const dates = cards.map(c => new Date(c.date).getTime());
    const oldest = shortDate(new Date(Math.min(...dates)).toISOString());
    const newest = shortDate(new Date(Math.max(...dates)).toISOString());
    return oldest === newest ? oldest : `${oldest} – ${newest}`;
  };

  if (thisWeek.length > 0) buckets.push({
    key: 'this-week', eyebrow: 'This Week', title: 'This week',
    count: `${thisWeek.length} night${thisWeek.length !== 1 ? 's' : ''} · ${makeDateRange(thisWeek)}`,
    cards: thisWeek,
  });

  if (earlierMonth.length > 0) buckets.push({
    key: 'earlier-month', eyebrow: 'Earlier', title: 'Earlier this month',
    count: `${earlierMonth.length} night${earlierMonth.length !== 1 ? 's' : ''} · ${makeDateRange(earlierMonth)}`,
    cards: earlierMonth,
  });

  for (const [key, mc] of [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    const d = new Date(mc[0].date);
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const yearSuffix = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
    buckets.push({
      key, eyebrow: `In ${monthName}`, title: `${monthName}${yearSuffix}`,
      count: `${mc.length} night${mc.length !== 1 ? 's' : ''} · ${makeDateRange(mc)}`,
      cards: mc,
    });
  }

  if (earlyCards.length > 0) buckets.push({
    key: 'early-days', eyebrow: 'Always Pinned', title: 'The early days',
    count: `The first ${earlyCards.length} nights · ${makeDateRange(earlyCards)}`,
    cards: earlyCards, pinned: true,
  });

  // Small collection: one bucket
  if (restCards.length === 0 && earlyCards.length === 0 && cards.length > 0) {
    return [{ key: 'all', eyebrow: 'Your Nights',
      title: cards.length <= 7 ? 'The first week' : 'The early days',
      count: `${cards.length} night${cards.length !== 1 ? 's' : ''} · ${makeDateRange(cards)}`,
      cards: sorted,
    }];
  }

  return buckets;
}

/* ─── Tonight's Thread ─── */
function selectThreadCard(cards: SavedNightCard[]): { card: SavedNightCard; reason: string } | null {
  if (cards.length === 0) return null;
  // Single card — show it as the hero
  if (cards.length === 1) return { card: cards[0], reason: 'Where it all began.' };

  const now = new Date();
  const todayMD = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // Rule 1: Anniversary
  const anniversary = cards.find(c => {
    const d = new Date(c.date);
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === todayMD && d.getFullYear() < now.getFullYear();
  });
  if (anniversary) return { card: anniversary, reason: `A year ago tonight, ${new Date(anniversary.date).getFullYear()}.` };

  // Rule 2: Cold card (not viewed in 30+ days)
  const viewedMap = getViewedMap();
  if (cards.length > 5) {
    const cold = cards.find(c => {
      const lv = viewedMap[c.id];
      return !lv || (now.getTime() - lv) > 30 * 86400000;
    });
    if (cold) return { card: cold, reason: `This one's been waiting.` };
  }

  // Rule 3: Origin (if < 60 days old)
  const origin = cards.find(c => c.isOrigin);
  if (origin && Math.floor((now.getTime() - new Date(origin.date).getTime()) / 86400000) < 60)
    return { card: origin, reason: 'Where it all began.' };

  // Rule 4: Most recent milestone
  const milestone = cards.find(c => c.milestone || c.isOrigin);
  if (milestone) return { card: milestone, reason: 'A night worth remembering.' };

  // Rule 5: Most recent with whisper
  const withWhisper = cards.find(c => c.whisper);
  if (withWhisper) return { card: withWhisper, reason: 'You wrote something that night.' };

  // Fallback
  return cards.length >= 2 ? { card: cards[1], reason: 'Not long ago.' } : null;
}

/* ─── Rediscovery dust ─── */
const VIEWED_KEY = 'ss_card_views';
function getViewedMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(VIEWED_KEY) || '{}'); } catch { return {}; }
}
function markViewed(id: string) {
  const m = getViewedMap(); m[id] = Date.now();
  try { localStorage.setItem(VIEWED_KEY, JSON.stringify(m)); } catch {}
}
function isCardCold(id: string): boolean {
  const m = getViewedMap(); const l = m[id]; return !l || (Date.now() - l) > 30 * 86400000;
}

/* ═══════════════════════════════════════════════════════════
   CSS  — Premium visual pass
   ═══════════════════════════════════════════════════════════ */
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ml-night:#060912;--ml-amber:#F5B84C;--ml-amber-deep:#a8782b;--ml-amber-dim:#c99436;
  --ml-teal:#14d890;--ml-purple:#9482ff;--ml-cream:#F4EFE8;--ml-cream-dim:#d8d1c5;
  --ml-ink:#2a2620;--ml-ink-dim:#6b6359;--ml-ink-faint:#9a9185;
  --ml-hairline:rgba(42,38,32,0.09);
  --ml-serif:'Fraunces',Georgia,serif;--ml-sans:'Nunito',system-ui,sans-serif;--ml-mono:'DM Mono',monospace;
}

/* ─── Animations ─── */
@keyframes mlFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes mlCardIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes mlFadein{from{opacity:0}to{opacity:1}}
@keyframes mlSlideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes mlDustBreathe{0%,100%{opacity:.65}50%{opacity:1}}
@keyframes mlFoilShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes mlHeroFloat{0%,100%{transform:rotate(-1deg) translateY(0)}50%{transform:rotate(-1deg) translateY(-3px)}}
@keyframes mlStarBreathe{0%,100%{opacity:.85}50%{opacity:1}}
@keyframes mlGlowPulse{0%,100%{opacity:.1}50%{opacity:.2}}
@keyframes mlTileIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}

/* ─── Page ─── */
.ml-page{
  min-height:100vh;width:100%;max-width:100vw;font-family:var(--ml-sans);color:var(--ml-cream);-webkit-font-smoothing:antialiased;
  background:
    radial-gradient(ellipse 90% 35% at 50% 0%,#141c30 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 45%,rgba(148,130,255,0.06) 0%,transparent 55%),
    radial-gradient(ellipse 70% 40% at 20% 75%,rgba(245,184,76,0.035) 0%,transparent 60%),
    var(--ml-night);
  padding-bottom:96px;position:relative;overflow-x:hidden;
}
/* Starfield — breathing */
.ml-page::before{
  content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
  animation:mlStarBreathe 8s ease-in-out infinite;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 8%,rgba(255,255,255,0.6),transparent),
    radial-gradient(1px 1px at 28% 15%,rgba(255,255,255,0.45),transparent),
    radial-gradient(1.5px 1.5px at 45% 10%,rgba(255,255,255,0.55),transparent),
    radial-gradient(1px 1px at 62% 18%,rgba(255,255,255,0.4),transparent),
    radial-gradient(1.5px 1.5px at 78% 6%,rgba(255,255,255,0.55),transparent),
    radial-gradient(1px 1px at 88% 22%,rgba(255,255,255,0.4),transparent),
    radial-gradient(1px 1px at 8% 32%,rgba(255,255,255,0.35),transparent),
    radial-gradient(1.5px 1.5px at 35% 38%,rgba(255,255,255,0.5),transparent),
    radial-gradient(1px 1px at 55% 45%,rgba(255,255,255,0.3),transparent),
    radial-gradient(1.5px 1.5px at 72% 42%,rgba(255,255,255,0.45),transparent),
    radial-gradient(1px 1px at 92% 48%,rgba(255,255,255,0.35),transparent),
    radial-gradient(1px 1px at 18% 58%,rgba(255,255,255,0.35),transparent),
    radial-gradient(1.5px 1.5px at 42% 65%,rgba(255,255,255,0.45),transparent),
    radial-gradient(1px 1px at 68% 72%,rgba(255,255,255,0.3),transparent);
}
.ml-page>*{position:relative;z-index:1}

/* ─── Inner wrapper — single centering container ─── */
.ml-inner{width:100%;max-width:440px;margin:0 auto;padding:0 16px;position:relative;z-index:1;overflow:hidden}

/* ─── Top bar ─── */
.ml-topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 0 28px}
.ml-topbtn{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.08);color:var(--ml-cream-dim);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.ml-topbtn:hover{background:rgba(245,184,76,0.08);border-color:rgba(245,184,76,0.3);color:var(--ml-amber)}
.ml-toptitle{font-family:var(--ml-serif);font-weight:400;font-size:18px;color:var(--ml-cream);opacity:.92}

/* ─── Search panel ─── */
.ml-search-panel{overflow:hidden;transition:max-height .35s cubic-bezier(.22,.61,.36,1),opacity .25s ease;opacity:0;max-height:0}
.ml-search-panel.open{max-height:120px;opacity:1;margin-bottom:16px}
.ml-search-input{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(244,239,232,.08);border-radius:14px;padding:11px 14px;font-size:13px;color:var(--ml-cream);outline:none;font-family:var(--ml-sans);transition:border-color .2s}
.ml-search-input:focus{border-color:rgba(245,184,76,.3)}
.ml-search-input::placeholder{color:rgba(255,255,255,.18)}
.ml-mood-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.ml-mood-chip{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:16px;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);font-family:var(--ml-mono);font-size:9px;color:rgba(234,242,255,.3)}
.ml-mood-chip.on{background:rgba(245,184,76,.12);border-color:rgba(245,184,76,.35);color:rgba(245,184,76,.8)}
.ml-mood-clear{display:flex;align-items:center;padding:5px 10px;border-radius:16px;cursor:pointer;background:rgba(200,80,80,.08);border:1px solid rgba(200,80,80,.2);font-size:9px;color:rgba(255,140,130,.6);font-family:var(--ml-mono)}

/* ─── Loading ─── */
.ml-loading{text-align:center;padding:100px 0}

/* ─── Thread (hero) ─── */
.ml-thread{text-align:center;padding:4px 0 40px}
.ml-thread-eyebrow{font-family:var(--ml-mono);font-size:9px;letter-spacing:.28em;color:var(--ml-amber);text-transform:uppercase;opacity:.82;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:10px}
.ml-thread-diamond{font-size:5px;opacity:.7}
.ml-thread-reason{font-family:var(--ml-serif);font-style:italic;font-size:16px;line-height:1.5;color:var(--ml-cream);opacity:.82;max-width:300px;margin:0 auto 26px;letter-spacing:-.002em}
.ml-thread-card{
  width:230px;margin:0 auto;background:var(--ml-cream);
  background-image:radial-gradient(ellipse 120% 80% at 50% 0%,rgba(255,250,240,0.7) 0%,transparent 50%),radial-gradient(ellipse 100% 60% at 50% 100%,rgba(245,184,76,0.05) 0%,transparent 50%);
  border-radius:9px;padding:9px;position:relative;cursor:pointer;
  animation:mlHeroFloat 4s ease-in-out infinite;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.8),
    inset 0 0 0 0.5px rgba(42,38,32,0.06),
    0 2px 4px rgba(0,0,0,0.2),
    0 20px 40px -15px rgba(0,0,0,0.5),
    0 40px 80px -25px rgba(0,0,0,0.8),
    0 0 70px -18px rgba(245,184,76,0.3);
  transition:box-shadow .5s ease;
}
.ml-thread-card:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,0.8),inset 0 0 0 0.5px rgba(42,38,32,0.06),0 2px 4px rgba(0,0,0,0.2),0 24px 48px -15px rgba(0,0,0,0.55),0 44px 88px -25px rgba(0,0,0,0.85),0 0 80px -16px rgba(245,184,76,0.4)}
.ml-thread-card::after{content:'';position:absolute;inset:-30px;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(245,184,76,0.14) 0%,transparent 65%);pointer-events:none;z-index:-1;animation:mlGlowPulse 6s ease-in-out infinite}
.ml-thread-sky{width:100%;height:175px;border-radius:4px;overflow:hidden;position:relative;box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center}
.ml-thread-sky img{width:100%;height:100%;object-fit:cover;display:block}
.ml-thread-sky::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.5),transparent);pointer-events:none}
.ml-thread-creature{position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);font-size:72px;filter:drop-shadow(0 4px 12px rgba(245,184,76,0.3));z-index:2}
.ml-thread-seal{position:absolute;top:10px;right:10px;font-family:var(--ml-mono);font-size:7.5px;letter-spacing:.13em;color:rgba(255,243,214,0.95);background:linear-gradient(135deg,rgba(245,184,76,0.32),rgba(168,120,43,0.25));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:3px 8px 3px 7px;border-radius:100px;text-transform:uppercase;border:0.5px solid rgba(245,184,76,0.4);text-shadow:0 1px 2px rgba(0,0,0,0.4);z-index:3}
.ml-thread-photo-overlay{position:absolute;inset:0;background:radial-gradient(ellipse 140% 90% at 50% 50%,transparent 55%,rgba(0,0,0,0.2) 100%),linear-gradient(180deg,rgba(0,0,0,0.25) 0%,transparent 25%,transparent 75%,rgba(0,0,0,0.15) 100%);pointer-events:none}
.ml-thread-paper{padding:11px 6px 4px;text-align:center}
.ml-thread-headline{font-family:var(--ml-serif);font-size:14px;font-weight:500;line-height:1.25;color:var(--ml-ink);letter-spacing:-.005em}
.ml-thread-whisper{font-family:'Kalam',cursive;font-size:12px;line-height:1.3;color:var(--ml-ink);margin-top:6px;opacity:.95}
.ml-thread-meta{margin-top:9px;padding-top:7px;border-top:1px solid var(--ml-hairline);font-family:var(--ml-mono);font-size:7.5px;letter-spacing:.14em;color:var(--ml-ink-faint);text-transform:uppercase}

/* ─── Narrative band ─── */
.ml-narrative{padding:42px 4px 36px;text-align:center;position:relative}
.ml-narrative::before,.ml-narrative::after{content:'';position:absolute;left:50%;transform:translateX(-50%);width:60px;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.35),transparent)}
.ml-narrative::before{top:12px}
.ml-narrative::after{bottom:12px}
.ml-narrative-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 100% at 50% 50%,rgba(245,184,76,0.04) 0%,transparent 60%)}
.ml-narrative-text{font-family:var(--ml-serif);font-size:15px;line-height:1.6;color:var(--ml-cream);opacity:.78;letter-spacing:-.003em;max-width:340px;margin:0 auto;position:relative;z-index:1}
.ml-narrative-sub{font-family:var(--ml-serif);font-style:italic;font-size:14px;color:var(--ml-cream);opacity:.52;margin-top:6px;display:block}

/* ─── Bucket ─── */
.ml-bucket{padding:8px 0 4px}
.ml-bucket-head{text-align:center;padding:52px 0 22px}
.ml-bucket-eyebrow{font-family:var(--ml-mono);font-size:8.5px;letter-spacing:.32em;color:var(--ml-amber);text-transform:uppercase;opacity:.8;display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px}
.ml-bucket-diamond{font-size:4px;opacity:.6}
.ml-bucket-title{font-family:var(--ml-serif);font-style:italic;font-weight:400;font-size:29px;color:var(--ml-cream);letter-spacing:-.015em;line-height:1.2}
.ml-bucket-count{font-family:var(--ml-mono);font-size:9px;letter-spacing:.2em;color:var(--ml-cream-dim);opacity:.48;text-transform:uppercase;margin-top:10px}
.ml-bucket-rule{width:40px;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.3),transparent);margin:14px auto 0}

/* ─── Grid ─── */
.ml-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:6px 0 4px;overflow:hidden}

/* ─── Tile ─── */
.ml-tile{
  --tilt:0deg;
  background:var(--ml-cream);
  background-image:radial-gradient(ellipse 120% 80% at 50% 0%,rgba(255,250,240,0.7) 0%,transparent 50%),radial-gradient(ellipse 100% 60% at 50% 100%,rgba(245,184,76,0.035) 0%,transparent 50%);
  border-radius:7px;padding:8px 8px 10px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.75),
    inset 0 0 0 0.5px rgba(42,38,32,0.06),
    0 1px 2px rgba(0,0,0,0.25),
    0 8px 16px -6px rgba(0,0,0,0.4),
    0 20px 40px -14px rgba(0,0,0,0.5);
  position:relative;cursor:pointer;aspect-ratio:5/7;display:flex;flex-direction:column;min-width:0;
  transform:rotate(var(--tilt));
  transition:transform .5s cubic-bezier(.22,.61,.36,1),box-shadow .4s ease;
}
.ml-tile::before{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.13 0 0 0 0 0.1 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.04;mix-blend-mode:multiply;pointer-events:none;border-radius:inherit}
.ml-tile:hover{transform:translateY(-5px) rotate(0deg);box-shadow:inset 0 1px 0 rgba(255,255,255,0.75),inset 0 0 0 0.5px rgba(42,38,32,0.06),0 1px 3px rgba(0,0,0,0.3),0 12px 24px -6px rgba(0,0,0,0.45),0 28px 56px -14px rgba(0,0,0,0.55)}
.ml-tile:active{transform:translateY(-2px) rotate(0deg) scale(.97);transition:transform .12s ease}
.ml-tile.tilt-l{--tilt:-1.4deg}.ml-tile.tilt-r{--tilt:1.2deg}.ml-tile.tilt-ll{--tilt:-0.6deg}.ml-tile.tilt-rr{--tilt:0.5deg}

.ml-tile-sky{height:54%;border-radius:3px;position:relative;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.ml-tile-star{position:absolute;width:1.5px;height:1.5px;background:#fff;border-radius:50%;opacity:.7}
.ml-tile-star.big{width:2px;height:2px}
.ml-tile-creature{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);font-size:34px;filter:drop-shadow(0 3px 8px rgba(245,184,76,0.22));z-index:2}
.ml-tile-photo{width:100%;height:100%;object-fit:cover;display:block}
.ml-tile-photo-overlay{position:absolute;inset:0;background:radial-gradient(ellipse 140% 90% at 50% 50%,transparent 50%,rgba(0,0,0,0.22) 100%),linear-gradient(180deg,rgba(0,0,0,0.2) 0%,transparent 20%,transparent 80%,rgba(0,0,0,0.12) 100%);pointer-events:none}
.ml-tile-sky::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.35),transparent);pointer-events:none;z-index:3}
.ml-tile-badge{position:absolute;top:6px;right:6px;font-family:var(--ml-mono);font-size:6.5px;letter-spacing:.1em;color:rgba(255,255,255,0.88);background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:2.5px 6px;border-radius:100px;text-transform:uppercase;border:0.5px solid rgba(255,255,255,0.1);z-index:3}
.ml-tile-dust{position:absolute;top:7px;left:7px;width:5px;height:5px;border-radius:50%;background:var(--ml-amber);box-shadow:0 0 6px rgba(245,184,76,0.55),0 0 12px rgba(245,184,76,0.3);animation:mlDustBreathe 4s ease-in-out infinite;z-index:3}

.ml-tile-paper{flex:1;padding:9px 3px 2px;display:flex;flex-direction:column;justify-content:space-between;position:relative;z-index:1}
.ml-tile-text{flex:1}
.ml-tile-headline{font-family:var(--ml-serif);font-size:11.5px;font-weight:500;line-height:1.22;color:var(--ml-ink);letter-spacing:-.003em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ml-tile-whisper{font-family:'Kalam',cursive;font-size:10px;line-height:1.25;color:var(--ml-ink);margin-top:5px;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ml-tile-meta{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:5px;border-top:1px solid var(--ml-hairline)}
.ml-tile-dots{display:flex;gap:3px;align-items:center}
.ml-tile-dot{width:2.5px;height:2.5px;border-radius:50%;background:var(--ml-ink-faint);opacity:.35}
.ml-tile-dot.active{background:var(--ml-amber-deep);opacity:.85}
.ml-tile-date{font-family:var(--ml-mono);font-size:6.5px;color:var(--ml-ink-faint);letter-spacing:.1em;text-transform:uppercase}

/* ─── Tile variants ─── */
.ml-tile.origin{box-shadow:inset 0 1px 0 rgba(255,245,215,0.9),inset 0 0 0 0.5px rgba(245,184,76,0.35),0 1px 3px rgba(0,0,0,0.3),0 12px 24px -8px rgba(0,0,0,0.5),0 24px 48px -12px rgba(0,0,0,0.55),0 0 35px -8px rgba(245,184,76,0.35)}
.ml-tile.origin .ml-tile-sky{background:linear-gradient(180deg,#1a0f33 0%,#3a1e52 45%,#5a2c4a 100%)}
.ml-tile.origin .ml-tile-sky::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(245,184,76,0.18) 48%,rgba(148,130,255,0.2) 52%,transparent 65%);background-size:250% 250%;animation:mlFoilShift 7s ease-in-out infinite;mix-blend-mode:screen;pointer-events:none;z-index:1}
.ml-tile.origin .ml-tile-badge{background:rgba(245,184,76,0.35);border-color:rgba(245,184,76,0.6);color:rgb(255,243,214)}
.ml-tile.milestone{box-shadow:inset 0 1px 0 rgba(255,245,215,0.9),inset 0 0 0 0.5px rgba(245,184,76,0.4),0 1px 3px rgba(0,0,0,0.3),0 14px 28px -10px rgba(0,0,0,0.55),0 28px 56px -14px rgba(0,0,0,0.6),0 0 48px -10px rgba(245,184,76,0.45)}
.ml-tile.milestone .ml-tile-sky{background:linear-gradient(180deg,#1e1428 0%,#3a2245 45%,#5a3050 100%)}
.ml-tile.milestone .ml-tile-sky::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 100% 60% at 50% 100%,rgba(245,184,76,0.25),transparent 70%);pointer-events:none;z-index:1}
.ml-tile.milestone .ml-tile-badge{background:rgba(245,184,76,0.4);border-color:rgba(245,184,76,0.65);color:rgb(255,243,214)}
.ml-tile.journey .ml-tile-sky{background:linear-gradient(180deg,#0a2028 0%,#14383e 45%,#1a4245 100%)}
.ml-tile.journey .ml-tile-badge{background:rgba(20,216,144,0.22);border-color:rgba(20,216,144,0.45)}
.ml-tile.streak .ml-tile-sky{background:linear-gradient(180deg,#2a1408 0%,#4a2410 45%,#6a3010 100%)}
.ml-tile.streak .ml-tile-badge{background:rgba(245,120,40,0.28);border-color:rgba(245,140,60,0.5)}

/* ─── Divider ─── */
.ml-divider{display:flex;align-items:center;justify-content:center;gap:14px;padding:36px 0 0}
.ml-divider-line{flex:0 0 70px;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.3),transparent)}
.ml-divider-orn{color:var(--ml-amber);opacity:.5;font-size:6px;letter-spacing:.4em}

/* ─── Load more ─── */
.ml-loadmore{padding:36px 0 0}
.ml-loadmore-inner{display:flex;align-items:center;gap:16px;cursor:pointer;transition:opacity .3s}
.ml-loadmore-inner:hover{opacity:.9}
.ml-loadmore-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,0.25),transparent)}
.ml-loadmore-text{font-family:var(--ml-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--ml-amber);opacity:.7;white-space:nowrap;transition:opacity .3s}
.ml-loadmore-inner:hover .ml-loadmore-text{opacity:1}

/* ─── Footer ─── */
.ml-footer{text-align:center;padding:80px 0 20px}
.ml-footer-total{font-family:var(--ml-serif);font-style:italic;font-size:15px;color:var(--ml-cream);opacity:.62;margin-bottom:26px;line-height:1.6}
.ml-footer-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:40px}
.ml-footer-btn{font-family:var(--ml-mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;padding:11px 17px;background:rgba(245,184,76,0.05);border:1px solid rgba(245,184,76,0.22);border-radius:100px;color:var(--ml-amber);cursor:pointer;transition:all .35s}
.ml-footer-btn:hover{background:rgba(245,184,76,0.12);border-color:rgba(245,184,76,0.5);color:rgb(255,230,180)}
.ml-footer-mark{font-family:var(--ml-mono);font-size:7px;letter-spacing:.3em;text-transform:uppercase;color:var(--ml-cream);opacity:.12}

/* ─── Empty ─── */
.ml-empty{text-align:center;padding:80px 0}

/* ─── Modals ─── */
.ml-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:mlFadein .15s ease}
.ml-confirm{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:mlSlideup .2s cubic-bezier(.22,1,.36,1)}
.ml-confirm h3{font-family:var(--ml-serif);font-size:18px;font-weight:700;color:var(--ml-cream);margin-bottom:8px}
.ml-confirm p{font-size:13px;color:rgba(244,239,232,.5);line-height:1.6;margin-bottom:20px}
.ml-confirm-btns{display:flex;gap:10px}
.ml-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ml-sans)}
.ml-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ml-sans)}

/* ─── More button (anchored to card) ─── */
.ml-more-trigger{
  display:flex;align-items:center;justify-content:center;gap:6px;
  margin:10px auto 0;padding:10px 20px;
  background:rgba(245,184,76,0.08);border:1px solid rgba(245,184,76,0.25);
  border-radius:100px;cursor:pointer;transition:all .3s;
  font-family:var(--ml-mono);font-size:9px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--ml-amber);opacity:.85;
}
.ml-more-trigger:hover{background:rgba(245,184,76,0.15);border-color:rgba(245,184,76,0.45);opacity:1}
.ml-more-trigger .ml-more-dots{font-size:14px;letter-spacing:3px;line-height:1}

/* ─── Action sheet (bottom slide-up) ─── */
.ml-actions-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:350;animation:mlFadein .15s ease}
.ml-actions-sheet{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:351;
  width:100%;max-width:440px;
  background:linear-gradient(180deg,#131828 0%,#0c1018 100%);
  border-radius:22px 22px 0 0;padding:12px 20px 32px;
  animation:mlSlideup .3s cubic-bezier(.22,1,.36,1);
}
.ml-actions-handle{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.12);margin:0 auto 16px}
.ml-actions-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.ml-actions-item{
  display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:14px 4px;border-radius:14px;border:none;background:transparent;
  cursor:pointer;transition:all .2s;
}
.ml-actions-item:hover{background:rgba(255,255,255,.05)}
.ml-actions-item .ml-ai{font-size:20px;line-height:1}
.ml-actions-item .ml-al{font-family:var(--ml-mono);font-size:7.5px;letter-spacing:.06em;text-transform:uppercase;color:rgba(234,242,255,.45);white-space:nowrap}
.ml-actions-item:hover .ml-al{color:rgba(234,242,255,.7)}
.ml-actions-item.danger .ml-al{color:rgba(255,140,130,.35)}
.ml-actions-item.danger:hover{background:rgba(200,80,80,.06)}
.ml-actions-item.danger:hover .ml-al{color:rgba(255,140,130,.6)}
.ml-actions-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 0}

/* ─── Edit sheet ─── */
.ml-edit-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:400;display:flex;align-items:flex-end;justify-content:center;padding:0;animation:mlFadein .2s ease}
.ml-edit-sheet{width:100%;max-width:440px;background:linear-gradient(180deg,#0f1525 0%,#0a0e1a 100%);border-radius:22px 22px 0 0;padding:20px 24px 36px;animation:mlSlideup .3s cubic-bezier(.22,1,.36,1);max-height:85dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;scroll-padding-bottom:120px}
.ml-edit-input:focus,.ml-edit-textarea:focus{scroll-margin-bottom:120px}
.ml-edit-handle{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.12);margin:0 auto 18px}
.ml-edit-title{font-family:var(--ml-serif);font-size:18px;font-weight:500;color:var(--ml-cream);margin-bottom:4px}
.ml-edit-sub{font-family:var(--ml-mono);font-size:9px;color:rgba(234,242,255,.3);letter-spacing:.1em;margin-bottom:20px}
.ml-edit-field{margin-bottom:16px}
.ml-edit-label{font-family:var(--ml-mono);font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:rgba(245,184,76,.6);margin-bottom:6px;display:block}
.ml-edit-input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--ml-cream);font-size:14px;font-family:var(--ml-serif);outline:none;transition:border-color .2s;line-height:1.4}
.ml-edit-input:focus{border-color:rgba(245,184,76,.3)}
.ml-edit-input.whisper-font{font-family:'Kalam',cursive;font-size:15px}
.ml-edit-textarea{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--ml-cream);font-size:13px;font-family:var(--ml-sans);outline:none;transition:border-color .2s;resize:none;min-height:80px;line-height:1.5}
.ml-edit-textarea:focus{border-color:rgba(245,184,76,.3)}
.ml-edit-actions{display:flex;gap:10px;margin-top:20px}
.ml-edit-save{flex:1;padding:14px;border-radius:14px;border:none;background:rgba(245,184,76,.15);color:var(--ml-amber);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ml-sans);transition:all .2s}
.ml-edit-save:hover{background:rgba(245,184,76,.25)}
.ml-edit-save:disabled{opacity:.3;cursor:default}
.ml-edit-cancel{flex:1;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(234,242,255,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--ml-sans);transition:all .2s}
.ml-edit-cancel:hover{background:rgba(255,255,255,.04)}
.ml-edit-hint{font-family:var(--ml-mono);font-size:8px;color:rgba(234,242,255,.2);margin-top:4px;letter-spacing:.05em}
`;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

interface Props { userId: string; onBack: () => void; filterCharacterId?: string; }

export default function NightCardLibrary({ userId, onBack, filterCharacterId }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SavedNightCard | null>(null);
  const [reflectionInput, setReflectionInput] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [visibleBuckets, setVisibleBuckets] = useState(2);
  const [shareMenuCard, setShareMenuCard] = useState<SavedNightCard | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editWhisper, setEditWhisper] = useState('');
  const [editReflection, setEditReflection] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load cards ──
  useEffect(() => {
    try {
      const v1Key = `ss9_u_${userId}_nightcards`;
      const v1Raw = localStorage.getItem(v1Key);
      const v1Data = v1Raw ? JSON.parse(v1Raw) : null;
      const v1Cards: any[] = v1Data?.items || (Array.isArray(v1Data) ? v1Data : []);
      const v2Key = `ss2_nightcards_${userId}`;
      const v2Raw = localStorage.getItem(v2Key);
      const v2Cards: any[] = v2Raw ? JSON.parse(v2Raw) : [];
      if (v1Cards.length > 0) {
        const strip = (c: any) => ({...c, photo: c.photo?.startsWith?.('data:') ? null : c.photo, childDrawing: c.childDrawing?.startsWith?.('data:') ? null : c.childDrawing});
        const v2Ids = new Set(v2Cards.map((c: any) => c.id).filter(Boolean));
        const missing = v1Cards.filter((c: any) => c.id && !v2Ids.has(c.id));
        if (missing.length > 0) {
          const toAdd = missing.map((c: any) => strip({
            id: c.id, userId, heroName: c.heroName || '', storyTitle: c.storyTitle || '',
            characterIds: c.characterIds || [], headline: c.headline || c.storyTitle || '',
            quote: c.quote || c.bondingAnswer || c.bondingA || '', memory_line: c.memory_line || '',
            bondingQuestion: c.bondingQuestion || c.bondingQ || '', bondingAnswer: c.bondingAnswer || c.bondingA || '',
            gratitude: c.gratitude || '', extra: c.extra || '', photo: c.photo || null,
            emoji: c.emoji || '🌙', date: c.date || new Date().toISOString().split('T')[0],
            childMood: c.childMood, childAge: c.childAge, bedtimeActual: c.bedtimeActual,
            tags: c.tags, milestone: c.milestone, whisper: c.whisper || c.reflection,
            isOrigin: c.isOrigin, creatureEmoji: c.creatureEmoji, creatureColor: c.creatureColor,
            nightNumber: c.nightNumber, streakCount: c.streakCount,
          }));
          localStorage.setItem(v2Key, JSON.stringify([...v2Cards.map(strip), ...toAdd]));
          for (const card of toAdd) {
            const packed: any = {};
            if (card.isOrigin) packed.isOrigin = true;
            if (card.whisper) packed.whisper = card.whisper;
            if (card.creatureEmoji) packed.creatureEmoji = card.creatureEmoji;
            if (card.creatureColor) packed.creatureColor = card.creatureColor;
            if (card.childMood) packed.childMood = card.childMood;
            if (card.nightNumber != null) packed.nightNumber = card.nightNumber;
            if (card.streakCount != null) packed.streakCount = card.streakCount;
            if (card.milestone) packed.milestone = card.milestone;
            supabase.from('night_cards').upsert({
              id: card.id, user_id: userId, hero_name: card.heroName, story_title: card.storyTitle,
              character_ids: card.characterIds || [], headline: card.headline, quote: card.quote,
              memory_line: card.memory_line || null, bonding_question: card.bondingQuestion || null,
              bonding_answer: card.bondingAnswer || null, gratitude: card.gratitude || null,
              extra: Object.keys(packed).length ? JSON.stringify(packed) : (card.extra || null),
              photo_url: card.photo || null, emoji: card.emoji || '🌙', date: card.date,
            }).then(({ error }) => { if (error) console.warn('[ML] recovery push:', error.message); });
          }
        }
      }
    } catch(e) { console.error('[ML] Reconciliation:', e); }

    getNightCards(userId).then(fetched => {
      setCards([...fetched].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });
  }, [userId]);

  // ── Derived data ──
  const displayCards = useMemo(() => {
    let filtered = filterCharacterId ? cards.filter(c => c.characterIds?.includes(filterCharacterId)) : cards;
    if (moodFilter) filtered = filtered.filter(c => c.childMood === moodFilter);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c =>
        (c.heroName||'').toLowerCase().includes(s) || (c.quote||'').toLowerCase().includes(s)
        || (c.bondingAnswer||'').toLowerCase().includes(s) || (c.storyTitle||'').toLowerCase().includes(s)
        || (c.headline||'').toLowerCase().includes(s) || (c.whisper||'').toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [cards, filterCharacterId, search, moodFilter]);

  const allBuckets = useMemo(() => groupIntoBuckets(displayCards), [displayCards]);
  const shownBuckets = allBuckets.slice(0, visibleBuckets);
  const hasMore = visibleBuckets < allBuckets.length;
  const thread = useMemo(() => selectThreadCard(displayCards), [displayCards]);

  const childNames = useMemo(() => {
    const names = [...new Set(cards.map(c => c.heroName).filter(Boolean))];
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
  }, [cards]);

  // Narrative sub-line
  const narrativeSub = useMemo(() => {
    if (displayCards.length === 0) return '';
    const recent = displayCards[0];
    if (recent?.whisper) return `"${recent.whisper}"`;
    const streak = (() => {
      const dates = [...new Set(cards.map(c => c.date?.split?.('T')?.[0]).filter(Boolean))].sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
      if (dates.length === 0 || (dates[0] !== today && dates[0] !== yesterday)) return 0;
      let s = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        if (Math.round((new Date(dates[i]).getTime() - new Date(dates[i+1]).getTime()) / 86400000) <= 1) s++; else break;
      }
      return s;
    })();
    if (streak > 3) return `${streak} nights in a row.`;
    return '';
  }, [displayCards, cards]);

  // ── Actions ──
  const openCard = useCallback((card: SavedNightCard) => {
    markViewed(card.id);
    setViewing(card); setReflectionInput(''); setReflectionSaved(false); setActionsOpen(false); setEditing(false);
  }, []);

  const closeCard = useCallback(() => {
    setViewing(null); setReflectionInput(''); setReflectionSaved(false); setActionsOpen(false); setEditing(false);
  }, []);

  const handleDelete = async (nc: SavedNightCard) => {
    await deleteNightCard(userId, nc.id);
    const fetched = await getNightCards(userId);
    setCards([...fetched].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (viewing?.id === nc.id) setViewing(null);
    setConfirmDelete(null);
  };

  const generateShareLinkFn = async (nc: SavedNightCard): Promise<string> => {
    try {
      const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await supabase.from('night_card_shares').upsert({ card_id: nc.id, share_token: token, created_at: new Date().toISOString() });
      return `${BASE_URL}/?nc=${token}`;
    } catch { return ''; }
  };

  const openShareMenu = async (nc: SavedNightCard) => {
    // Always generate the share link first so recipients get the full interactive card
    const url = await generateShareLinkFn(nc);
    if (navigator.share) {
      // Share the link (with optional image attachment)
      const shareData: ShareData = { title: `${nc.heroName}'s Night Card`, url: url || undefined, text: `${nc.headline || nc.storyTitle} — a bedtime memory` };
      const blob = await generateNightCardImage({ heroName: nc.heroName, headline: nc.headline || nc.storyTitle, quote: nc.quote, emoji: nc.emoji, date: nc.date, photo: nc.photo, nightNumber: nc.nightNumber, creatureEmoji: nc.creatureEmoji, creatureColor: nc.creatureColor, isOrigin: nc.isOrigin, whisper: nc.whisper });
      if (blob) {
        const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) shareData.files = [file];
      }
      try { await navigator.share(shareData); } catch {}
      return;
    }
    if (url) { setShareLink(url); setShareMenuCard(nc); }
  };

  const openPrintView = (nc: SavedNightCard) => window.open(`${window.location.pathname}?printCard=${nc.id}&uid=${userId}`, '_blank');

  const openEdit = useCallback(() => {
    if (!viewing) return;
    setEditHeadline(viewing.headline || '');
    setEditWhisper(viewing.whisper || '');
    setEditReflection(viewing.parentReflection || '');
    setEditing(true);
  }, [viewing]);

  const saveEdit = useCallback(async () => {
    if (!viewing) return;
    const updated = {
      ...viewing,
      headline: editHeadline.trim() || viewing.headline,
      whisper: editWhisper.trim() || undefined,
      parentReflection: editReflection.trim() || undefined,
    };
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    setViewing(updated);
    setEditing(false);
    try { await saveNightCard(updated); } catch (e) { console.error('[ML] saveEdit:', e); }
  }, [viewing, editHeadline, editWhisper, editReflection]);

  // ── Tile render ──
  function renderTile(card: SavedNightCard, bucketIdx: number, cardIdx: number) {
    const variant = getCardVariant(card);
    const tilt = TILT_CLASSES[(bucketIdx * 7 + cardIdx) % TILT_CLASSES.length];
    const hasPhoto = !!(card.photo && card.photo.length > 0 && card.photo !== '[uploaded]');
    const creatureEmoji = card.creatureEmoji || card.emoji || '🌙';
    const cold = isCardCold(card.id) && displayCards.length > 5;
    const vs = CARD_VARIANT_STYLES[variant];

    const badgeText = variant === 'origin' ? '◆ Origin'
      : variant === 'milestone' ? `◆ ${card.milestone || card.nightNumber || ''}`
      : variant === 'journey' ? `✦ ${card.nightNumber || ''}`
      : variant === 'streak' ? `🔥 ${card.streakCount || ''}`
      : `Night ${card.nightNumber || ''}`;

    const stars = Array.from({length: 5}, (_, i) => {
      const seed = (card.id || '').charCodeAt(i % (card.id || 'x').length) || 42;
      const top = 8 + ((seed * (i+1) * 7) % 30);
      const left = 10 + ((seed * (i+3) * 13) % 80);
      return <span key={i} className={`ml-tile-star${i%3===0?' big':''}`} style={{ top: `${top}%`, left: `${left}%` }} />;
    });

    return (
      <div key={card.id} className={`ml-tile ${variant} ${tilt}`} onClick={() => openCard(card)}
        style={{ animation: `mlTileIn .4s ${cardIdx * 0.06}s cubic-bezier(.22,.61,.36,1) both`, opacity: 0 }}>
        <div className="ml-tile-sky" style={!hasPhoto ? { background: vs.skyGradient } : undefined}>
          {hasPhoto ? (
            <><img className="ml-tile-photo" src={card.photo} alt="" loading="lazy" /><div className="ml-tile-photo-overlay" /></>
          ) : (
            <>{stars}<div className="ml-tile-creature">{creatureEmoji}</div></>
          )}
          <div className="ml-tile-badge">{badgeText}</div>
          {cold && <div className="ml-tile-dust" />}
        </div>
        <div className="ml-tile-paper">
          <div className="ml-tile-text">
            <div className="ml-tile-headline">{card.headline || card.storyTitle || card.heroName}</div>
            {card.whisper && <div className="ml-tile-whisper">{card.whisper}</div>}
          </div>
          <div className="ml-tile-meta">
            <div className="ml-tile-dots">
              <span className={`ml-tile-dot${card.photo?' active':''}`} />
              <span className={`ml-tile-dot${card.audioClip?' active':''}`} />
              <span className={`ml-tile-dot${card.childDrawing?' active':''}`} />
              <span className={`ml-tile-dot${card.parentReflection?' active':''}`} />
            </div>
            <div className="ml-tile-date">{shortDate(card.date)}</div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════
  //  RENDER
  // ═════════════════════════════

  return (
    <div className="ml-page">
      <style>{CSS}</style>

      <div className="ml-inner">

      {/* ── Top bar ── */}
      <div className="ml-topbar">
        <button className="ml-topbtn" onClick={onBack} aria-label="Back">←</button>
        <div className="ml-toptitle">Memories</div>
        <button className="ml-topbtn" aria-label="Search and filter" onClick={() => { setSearchOpen(v => !v); setTimeout(() => searchRef.current?.focus(), 100); }}>
          {searchOpen ? '✕' : '⋯'}
        </button>
      </div>

      {/* ── Search panel ── */}
      <div className={`ml-search-panel${searchOpen ? ' open' : ''}`}>
        <input ref={searchRef} className="ml-search-input" placeholder="Search memories..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="ml-mood-chips">
          {[{e:'😊',l:'happy'},{e:'😴',l:'sleepy'},{e:'🤗',l:'cozy'},{e:'😌',l:'calm'},{e:'🥰',l:'loved'},{e:'😆',l:'silly'}].map(m => (
            <div key={m.e} className={`ml-mood-chip${moodFilter===m.e?' on':''}`} onClick={() => setMoodFilter(moodFilter===m.e?'':m.e)}>
              <span style={{fontSize:14}}>{m.e}</span><span>{m.l}</span>
            </div>
          ))}
          {moodFilter && <div className="ml-mood-clear" onClick={() => setMoodFilter('')}>✕ clear</div>}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="ml-loading">
          <div style={{ fontFamily: 'var(--ml-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ml-cream)', opacity: 0.5 }}>
            Loading memories…
          </div>
        </div>
      )}

      {/* ── Thread hero ── */}
      {!loading && thread && (
        <div className="ml-thread" style={{ animation: 'mlFadeUp .5s .1s ease both', opacity: 0 }}>
          <div className="ml-thread-eyebrow">
            <span className="ml-thread-diamond">◆</span>
            <span>Tonight's thread</span>
            <span className="ml-thread-diamond">◆</span>
          </div>
          <div className="ml-thread-reason">{thread.reason}</div>
          <div className="ml-thread-card" onClick={() => openCard(thread.card)}>
            <div className="ml-thread-sky" style={{ background: CARD_VARIANT_STYLES[getCardVariant(thread.card)].skyGradient }}>
              {thread.card.photo && thread.card.photo !== '[uploaded]' ? (
                <><img src={thread.card.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /><div className="ml-thread-photo-overlay" /></>
              ) : (
                <div className="ml-thread-creature">{thread.card.creatureEmoji || thread.card.emoji || '🌙'}</div>
              )}
              <div className="ml-thread-seal">Night {thread.card.nightNumber || 1}</div>
            </div>
            <div className="ml-thread-paper">
              <div className="ml-thread-headline">{thread.card.headline}</div>
              {thread.card.whisper && <div className="ml-thread-whisper">{thread.card.whisper}</div>}
              <div className="ml-thread-meta">
                <span style={{ color: 'var(--ml-amber-deep)' }}>◆</span> {shortDate(thread.card.date)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Narrative band ── */}
      {!loading && displayCards.length > 0 && (
        <div className="ml-narrative" style={{ animation: 'mlFadeUp .5s .2s ease both', opacity: 0 }}>
          <div className="ml-narrative-glow" />
          <div className="ml-narrative-text">
            <span style={{ color: 'var(--ml-amber)', opacity: 0.95, fontWeight: 500, fontStyle: 'italic' }}>
              {numberWord(displayCards.length)} night{displayCards.length !== 1 ? 's' : ''}
            </span>
            {childNames ? ` with ${childNames}.` : '.'}
            {narrativeSub && <span className="ml-narrative-sub">{narrativeSub}</span>}
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && displayCards.length === 0 && !search && !moodFilter && (
        <div className="ml-empty" style={{ animation: 'mlFadeUp .4s ease both' }}>
          <div style={{ fontSize: 56, opacity: 0.4, marginBottom: 20 }}>🌙</div>
          <div style={{ fontFamily: 'var(--ml-serif)', fontSize: 22, fontWeight: 700, color: 'var(--ml-cream)', marginBottom: 10, fontStyle: 'italic' }}>No cards yet</div>
          <div style={{ fontSize: 14, color: 'rgba(244,239,232,0.4)', lineHeight: 1.72, maxWidth: 360, margin: '0 auto', fontWeight: 300 }}>
            Finish a story tonight and your first Night Card will appear here.
          </div>
        </div>
      )}

      {/* ── No results (search/filter active) ── */}
      {!loading && displayCards.length === 0 && (search || moodFilter) && (
        <div className="ml-empty" style={{ animation: 'mlFadeUp .3s ease both' }}>
          <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ml-serif)', fontSize: 18, color: 'var(--ml-cream)', opacity: 0.6, fontStyle: 'italic' }}>No memories match</div>
          <div style={{ fontSize: 13, color: 'rgba(244,239,232,0.3)', marginTop: 8 }}>Try a different search or clear the filter.</div>
        </div>
      )}

      {/* ── Buckets ── */}
      {shownBuckets.map((bucket, bIdx) => (
        <div key={bucket.key}>
          {bIdx > 0 && (
            <div className="ml-divider">
              <span className="ml-divider-line" />
              <span className="ml-divider-orn">◆ ◆ ◆</span>
              <span className="ml-divider-line" />
            </div>
          )}
          <div className="ml-bucket">
            <div className="ml-bucket-head" style={{ animation: `mlFadeUp .4s ${0.2 + bIdx * 0.1}s ease both`, opacity: 0 }}>
              <div className="ml-bucket-eyebrow">
                <span className="ml-bucket-diamond">◆</span>
                <span>{bucket.pinned ? 'Always Pinned' : bucket.eyebrow}</span>
                <span className="ml-bucket-diamond">◆</span>
              </div>
              <div className="ml-bucket-title">{bucket.title}</div>
              <div className="ml-bucket-count">{bucket.count}</div>
              <div className="ml-bucket-rule" />
            </div>
          </div>
          <div className="ml-grid">
            {bucket.cards.map((card, i) => renderTile(card, bIdx, i))}
          </div>
        </div>
      ))}

      {/* ── Load more ── */}
      {hasMore && (
        <div className="ml-loadmore" onClick={() => setVisibleBuckets(v => v + 2)}>
          <div className="ml-loadmore-inner">
            <span className="ml-loadmore-line" />
            <span className="ml-loadmore-text">Earlier memories</span>
            <span className="ml-loadmore-line" />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      {!loading && displayCards.length > 0 && (
        <div className="ml-footer" style={{ animation: 'mlFadeUp .4s .3s ease both', opacity: 0 }}>
          <div className="ml-footer-total">
            <span style={{ color: 'var(--ml-amber)', fontWeight: 500, opacity: 0.95 }}>
              {numberWord(displayCards.length)} night{displayCards.length !== 1 ? 's' : ''}
            </span> held so far.<br />
            The beginning of something long.
          </div>
          <div className="ml-footer-actions">
            {displayCards.length >= 3 && (
              <>
                <button className="ml-footer-btn" onClick={async () => {
                  const name = displayCards[0]?.heroName || 'Child';
                  const blob = await generateNightCardBook(name, displayCards);
                  downloadBlob(blob, `${name}s-Memory-Book.pdf`);
                }}>Memory book →</button>
                <button className="ml-footer-btn" onClick={async () => {
                  try {
                    const token = crypto.randomUUID?.() || `fam_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                    const name = displayCards[0]?.heroName || 'Child';
                    await supabase.from('family_shares').upsert({ share_token: token, user_id: userId, child_name: name, card_ids: displayCards.map(c => c.id), created_at: new Date().toISOString() });
                    const url = `${BASE_URL}/family/${token}`;
                    if (navigator.share) { try { await navigator.share({ title: `${name}'s Night Cards`, url }); } catch {} }
                    else { await navigator.clipboard.writeText(url).catch(() => {}); alert(`Family link copied!\n${url}`); }
                  } catch (e) { console.error('Family share error:', e); }
                }}>Share with family →</button>
              </>
            )}
          </div>
          <div className="ml-footer-mark">SleepSeed</div>
        </div>
      )}

      </div>{/* end .ml-inner */}

      {/* ── Detail modal ── */}
      {viewing && (
        <>
          <div onClick={closeCard} style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,18,.95)', zIndex: 200, animation: 'mlFadein .25s ease both' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(154,127,212,.12) 0%,transparent 70%)', pointerEvents: 'none', animation: 'mlFadeUp .4s ease both' }} />
            <div style={{ pointerEvents: 'all', width: '100%', maxWidth: 340, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', scrollbarWidth: 'none' as any, animation: 'mlCardIn .35s cubic-bezier(.2,.8,.3,1) both', position: 'relative', zIndex: 1 }}>
              <NightCardDetailPaginated card={viewing} onClose={closeCard} />

              {/* ── "More" trigger button ── */}
              <button className="ml-more-trigger" onClick={() => setActionsOpen(true)}>
                <span className="ml-more-dots">···</span>
                <span>Actions</span>
              </button>

              {/* Hidden file input for photo (always present) */}
              <input type="file" accept="image/*" id="ml-photo-upload" style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const updated = { ...viewing, photo: reader.result as string };
                    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
                    setViewing(updated); setActionsOpen(false);
                    try { await saveNightCard(updated); } catch (err) { console.error('[ML] savePhoto:', err); }
                  };
                  reader.readAsDataURL(f);
                }}
              />

              {/* ── Thread nav ── */}
              {(() => {
                const idx = displayCards.findIndex(c => c.id === viewing.id);
                const prev = idx < displayCards.length - 1 ? displayCards[idx + 1] : null;
                const next = idx > 0 ? displayCards[idx - 1] : null;
                if (!prev && !next) return null;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8 }}>
                    <button disabled={!prev} onClick={() => { if (prev) openCard(prev); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: prev ? 'rgba(255,255,255,.04)' : 'transparent', color: prev ? 'rgba(234,242,255,.5)' : 'rgba(234,242,255,.12)', fontSize: 10, fontFamily: "'DM Mono',monospace", cursor: prev ? 'pointer' : 'default', textAlign: 'left' }}>
                      {prev ? `← ${prev.headline?.slice(0, 20) || 'older'}` : ''}
                    </button>
                    <div style={{ fontSize: 9, color: 'rgba(234,242,255,.2)', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{displayCards.length - idx} of {displayCards.length}</div>
                    <button disabled={!next} onClick={() => { if (next) openCard(next); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: next ? 'rgba(255,255,255,.04)' : 'transparent', color: next ? 'rgba(234,242,255,.5)' : 'rgba(234,242,255,.12)', fontSize: 10, fontFamily: "'DM Mono',monospace", cursor: next ? 'pointer' : 'default', textAlign: 'right' }}>
                      {next ? `${next.headline?.slice(0, 20) || 'newer'} →` : ''}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* ── Action sheet ── */}
      {actionsOpen && viewing && (
        <>
          <div className="ml-actions-bg" onClick={() => setActionsOpen(false)} />
          <div className="ml-actions-sheet">
            <div className="ml-actions-handle" />
            <div className="ml-actions-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <button className="ml-actions-item" onClick={() => { setActionsOpen(false); openEdit(); }}>
                <span className="ml-ai">✏️</span><span className="ml-al">Edit</span>
              </button>
              <button className="ml-actions-item" onClick={() => { document.getElementById('ml-photo-upload')?.click(); }}>
                <span className="ml-ai">📷</span><span className="ml-al">{viewing.photo ? 'Photo' : 'Add photo'}</span>
              </button>
              <button className="ml-actions-item" onClick={() => { setActionsOpen(false); openShareMenu(viewing); }}>
                <span className="ml-ai">↗️</span><span className="ml-al">Share</span>
              </button>
              <button className="ml-actions-item" onClick={async () => {
                setActionsOpen(false);
                try {
                  const token = crypto.randomUUID?.() || `fam_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                  const name = viewing.heroName || 'Child';
                  await supabase.from('family_shares').upsert({ share_token: token, user_id: userId, child_name: name, card_ids: [viewing.id], created_at: new Date().toISOString() });
                  const url = `${BASE_URL}/family/${token}`;
                  if (navigator.share) { try { await navigator.share({ title: `${name}'s Night Card`, url }); } catch {} }
                  else { await navigator.clipboard.writeText(url).catch(() => {}); alert(`Family link copied!\n${url}`); }
                } catch (e) { console.error('Family share error:', e); }
              }}>
                <span className="ml-ai">👨‍👩‍👧</span><span className="ml-al">Family</span>
              </button>
              <button className="ml-actions-item" onClick={() => { setActionsOpen(false); openPrintView(viewing); }}>
                <span className="ml-ai">🖨️</span><span className="ml-al">Print</span>
              </button>
              <button className="ml-actions-item danger" onClick={() => { setActionsOpen(false); setConfirmDelete(viewing); }}>
                <span className="ml-ai">🗑️</span><span className="ml-al">Remove</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Edit sheet ── */}
      {editing && viewing && (
        <div className="ml-edit-bg" onClick={() => setEditing(false)}>
          <div className="ml-edit-sheet" onClick={e => e.stopPropagation()}>
            <div className="ml-edit-handle" />
            <div className="ml-edit-title">Edit this memory</div>
            <div className="ml-edit-sub">{viewing.heroName} · {shortDate(viewing.date)}</div>

            <div className="ml-edit-field">
              <label className="ml-edit-label">Headline</label>
              <input className="ml-edit-input" value={editHeadline} onChange={e => setEditHeadline(e.target.value)} placeholder="What happened tonight..." maxLength={80} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              <div className="ml-edit-hint">The title on the front of the card</div>
            </div>

            <div className="ml-edit-field">
              <label className="ml-edit-label">Whisper</label>
              <input className="ml-edit-input whisper-font" value={editWhisper} onChange={e => setEditWhisper(e.target.value)} placeholder="What you want to remember..." maxLength={100} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              <div className="ml-edit-hint">Your private note — the handwritten line</div>
            </div>

            <div className="ml-edit-field">
              <label className="ml-edit-label">Reflection</label>
              <textarea className="ml-edit-textarea" value={editReflection} onChange={e => setEditReflection(e.target.value)} placeholder="Anything you want to remember about this night..." maxLength={280} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              <div className="ml-edit-hint">A longer thought — shown on the diary page</div>
            </div>

            <div className="ml-edit-actions">
              <button className="ml-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
              <button className="ml-edit-save" onClick={saveEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="ml-confirm-bg" onClick={() => setConfirmDelete(null)}>
          <div className="ml-confirm" onClick={e => e.stopPropagation()}>
            <h3>Remove this Night Card?</h3>
            <p>{confirmDelete.heroName}'s card from {formatDate(confirmDelete.date)} will be gone forever. This can't be undone.</p>
            <div className="ml-confirm-btns">
              <button className="ml-confirm-cancel" onClick={() => setConfirmDelete(null)}>Keep it</button>
              <button className="ml-confirm-del" onClick={() => handleDelete(confirmDelete)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share menu (desktop) ── */}
      {shareMenuCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => { setShareMenuCard(null); setShareMessage(''); }}>
          <div style={{ background: '#0C1840', borderRadius: 22, padding: 24, maxWidth: 360, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F4EFE8', fontFamily: "'Fraunces',serif", marginBottom: 4 }}>Share this Night Card</div>
            <div style={{ fontSize: 10, color: 'rgba(234,242,255,.35)', fontFamily: "'DM Mono',monospace", marginBottom: 14 }}>{shareMenuCard.heroName}'s memory</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: 'rgba(234,242,255,.3)', letterSpacing: '.5px', marginBottom: 6 }}>Add a message (optional)</div>
              <input type="text" value={shareMessage} onChange={e => setShareMessage(e.target.value)} placeholder="Look at what we made tonight..." style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#F4EFE8', fontSize: 13, fontFamily: "'Nunito',sans-serif", outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
              <div onClick={() => { const text = shareMessage ? `${shareMessage}\n\n${shareLink}` : shareLink; navigator.clipboard.writeText(text).catch(() => {}); setShareLinkCopied(true); setTimeout(() => setShareLinkCopied(false), 2000); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px 8px', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>🔗</span>
                <span style={{ fontSize: 8, fontFamily: "'DM Mono',monospace", color: 'rgba(234,242,255,.5)' }}>{shareLinkCopied ? 'Copied!' : 'Copy link'}</span>
              </div>
              <div onClick={async () => { const blob = await generateNightCardImage({ heroName: shareMenuCard.heroName, headline: shareMenuCard.headline || shareMenuCard.storyTitle, quote: shareMenuCard.quote, emoji: shareMenuCard.emoji, date: shareMenuCard.date, photo: shareMenuCard.photo, nightNumber: shareMenuCard.nightNumber, creatureEmoji: shareMenuCard.creatureEmoji, creatureColor: shareMenuCard.creatureColor, isOrigin: shareMenuCard.isOrigin }); if (blob) downloadBlob(blob, `nightcard-${shareMenuCard.heroName}-${shareMenuCard.date}.png`); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px 8px', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>💾</span>
                <span style={{ fontSize: 8, fontFamily: "'DM Mono',monospace", color: 'rgba(234,242,255,.5)' }}>Save image</span>
              </div>
              <div onClick={() => { setShareMenuCard(null); setShareMessage(''); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px 8px', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>✕</span>
                <span style={{ fontSize: 8, fontFamily: "'DM Mono',monospace", color: 'rgba(234,242,255,.4)' }}>Done</span>
              </div>
            </div>
            {shareLinkCopied && <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: 'rgba(20,216,144,.8)', textAlign: 'center' }}>✓ Link copied</div>}
          </div>
        </div>
      )}
    </div>
  );
}
