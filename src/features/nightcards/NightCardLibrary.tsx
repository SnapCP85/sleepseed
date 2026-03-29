import { useState, useEffect, useMemo } from 'react';
import { getNightCards, deleteNightCard, saveNightCard } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import type { SavedNightCard, CardVariant } from '../../lib/types';
import { getCardVariant, CARD_VARIANT_STYLES } from '../../lib/types';
import NightCard, { getPinStyle } from './NightCard';

// ── Date helpers ──
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Tonight';
    if (diff === 1) return 'Last night';
    if (diff < 7) return `${diff} nights ago`;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function formatDateLong(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return iso; }
}

function monthLabel(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  catch { return ''; }
}

function formatCardDateShort(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

// ── Variant helpers ──
function getKicker(nc: SavedNightCard, variant: CardVariant, isToday: boolean): { text: string; color: string; dot?: boolean } {
  if (isToday && variant === 'standard') return { text: 'Tonight', color: 'var(--teal)', dot: true };
  switch (variant) {
    case 'origin': return { text: 'First Night Ever', color: 'var(--amber)' };
    case 'journey': return { text: 'Journey Complete', color: 'var(--teal)' };
    case 'occasion': return { text: `\uD83C\uDF89 ${nc.occasion || 'Special'}`, color: 'var(--purple)' };
    case 'streak': return { text: `\uD83D\uDD25 ${nc.streakCount || ''} Night Streak`, color: '#F5821A' };
    default: return { text: `Night ${nc.nightNumber || ''}\u00B7${nc.lessonTheme || nc.storyTitle || ''}`.replace(/\u00B7$/, ''), color: 'var(--cream-faint)' };
  }
}

function getScrapbookBadge(variant: CardVariant, nc: SavedNightCard): { text: string; bg: string; border: string; color: string } | null {
  switch (variant) {
    case 'origin': return { text: '\u2726 Origin', bg: 'rgba(245,184,76,.2)', border: 'rgba(245,184,76,.3)', color: 'var(--amber)' };
    case 'journey': return { text: 'Journey', bg: 'rgba(20,216,144,.15)', border: 'rgba(20,216,144,.25)', color: 'var(--teal)' };
    case 'occasion': return { text: `\uD83C\uDF89 ${nc.occasion || 'Special'}`, bg: 'rgba(148,130,255,.15)', border: 'rgba(148,130,255,.25)', color: 'var(--purple)' };
    case 'streak': return { text: `\uD83D\uDD25 ${nc.streakCount || ''} nights`, bg: 'rgba(245,130,20,.15)', border: 'rgba(245,130,20,.25)', color: '#F5821A' };
    default: return null;
  }
}

// ── Group cards by month ──
function groupByMonth(cards: SavedNightCard[]): { label: string; cards: SavedNightCard[] }[] {
  const groups: { label: string; cards: SavedNightCard[] }[] = [];
  let cur = '';
  for (const nc of cards) {
    const m = monthLabel(nc.date);
    if (m !== cur) { cur = m; groups.push({ label: m, cards: [] }); }
    groups[groups.length - 1].cards.push(nc);
  }
  return groups;
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--night-card:#0f1525;--night-raised:#141a2e;--amber:#F5B84C;--amber-deep:#E8972A;--cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);--teal:#14d890;--purple:#9482ff;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes slideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes ncFloatSmall{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes ncl-fadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@keyframes ncl-cardIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}

.ncl{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:96px}

/* Nav */
.ncl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(6,9,18,.92);position:sticky;top:0;z-index:10;backdrop-filter:blur(20px)}
.ncl-nav-left{display:flex;align-items:center;gap:10px}
.ncl-back{background:transparent;border:none;color:var(--cream-faint);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s}
.ncl-back:hover{color:var(--cream-dim)}
.ncl-title{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--cream)}
.ncl-title span{color:var(--amber)}
.ncl-nav-right{display:flex;align-items:center;gap:8px}
.ncl-nav-btn{width:34px;height:34px;border-radius:50%;background:rgba(244,239,232,.06);border:none;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:var(--cream-faint);transition:all .18s}
.ncl-nav-btn:hover{background:rgba(244,239,232,.1)}

.ncl-inner{max-width:600px;margin:0 auto;padding:0}

/* ── HERO SECTION ── */
.ncl-hero{position:relative;overflow:hidden}
.ncl-hero-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 0%,rgba(154,127,212,.18) 0%,transparent 65%)}
.ncl-hero-inner{position:relative;z-index:1;padding:20px 20px 0}

/* Count statement */
.ncl-count{margin-bottom:16px;animation:fadeUp .4s ease both}
.ncl-count-h{font-family:var(--serif);font-size:24px;font-weight:400;color:var(--cream);line-height:1.2}
.ncl-count-h em{font-style:italic;color:var(--amber)}
.ncl-count-sub{font-family:var(--sans);font-size:12px;color:var(--cream-faint);margin-top:6px}

/* Stats row */
.ncl-stats{display:flex;gap:8px;margin-bottom:18px;animation:fadeUp .4s .05s ease both}
.ncl-stat{flex:1;background:rgba(13,17,32,.85);border:1px solid rgba(244,239,232,.07);border-radius:14px;padding:10px 12px;text-align:center}
.ncl-stat-num{font-family:var(--serif);font-size:20px;font-weight:600;color:var(--amber);display:block;line-height:1}
.ncl-stat-lbl{font-family:var(--mono);font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cream-faint);display:block;margin-top:3px}

/* Latest card strip */
.ncl-latest{animation:fadeUp .4s .1s ease both;background:linear-gradient(165deg,#0f1628 0%,#0d1423 70%,#0c1020 100%);border:1px solid rgba(154,127,212,.18);border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;margin-bottom:18px;transition:border-color .2s,transform .2s}
.ncl-latest:hover{border-color:rgba(154,127,212,.32);transform:translateY(-2px)}
.ncl-latest-thumb{width:56px;height:78px;border-radius:10px;flex-shrink:0;overflow:hidden;transform:rotate(-2deg);box-shadow:0 8px 20px rgba(0,0,0,.5);position:relative}
.ncl-latest-thumb-sky{height:55%;display:flex;align-items:center;justify-content:center;position:relative}
.ncl-latest-thumb-paper{height:45%;padding:3px 4px;display:flex;align-items:flex-start}
.ncl-latest-thumb-hl{font-family:var(--serif);font-size:6.5px;font-weight:600;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ncl-latest-body{flex:1;min-width:0}
.ncl-latest-kicker{display:flex;align-items:center;gap:6px;margin-bottom:5px}
.ncl-latest-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0}
.ncl-latest-kicker-text{font-family:var(--mono);font-size:8px;color:var(--teal);letter-spacing:2px;text-transform:uppercase}
.ncl-latest-hl{font-family:var(--serif);font-size:15px;font-weight:500;color:var(--cream);line-height:1.3;margin-bottom:4px}
.ncl-latest-quote{font-family:var(--serif);font-size:11px;font-weight:300;font-style:italic;color:var(--cream-dim);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ncl-latest-chevron{font-size:16px;color:var(--cream-faint);flex-shrink:0}

/* Search */
.ncl-search{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(244,239,232,.08);border-radius:14px;padding:11px 14px;font-size:13px;color:var(--cream);outline:none;font-family:inherit;transition:border-color .2s;margin-bottom:16px}
.ncl-search:focus{border-color:rgba(245,184,76,.3)}
.ncl-search::placeholder{color:rgba(255,255,255,.2)}

/* View Toggle — 3 options */
.ncl-toggle{display:flex;gap:6px;padding:0 20px;margin-bottom:18px;animation:fadeUp .4s .15s ease both}
.ncl-toggle-btn{flex:1;padding:8px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid rgba(244,239,232,.09);background:rgba(13,17,32,.9);color:var(--cream-faint);transition:all .18s;font-family:var(--sans);text-align:center;letter-spacing:.5px}
.ncl-toggle-btn.on{border-color:rgba(245,184,76,.28);background:rgba(245,184,76,.1);color:var(--amber)}
.ncl-toggle-btn:hover:not(.on){border-color:rgba(244,239,232,.15)}

/* Empty */
.ncl-empty{text-align:center;padding:80px 24px}
.ncl-empty-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 20px;opacity:.4}
.ncl-empty-h{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--cream);margin-bottom:10px;font-style:italic}
.ncl-empty-sub{font-size:14px;color:var(--cream-faint);line-height:1.72;max-width:360px;margin:0 auto;font-weight:300}

/* ── MONTH GROUP ── */
.ncl-month{margin-bottom:24px;animation:fadeUp .4s .2s ease both}
.ncl-month:first-child{animation-delay:.2s}
.ncl-month-header{display:flex;align-items:center;gap:10px;padding:0 20px;margin-bottom:12px}
.ncl-month-label{font-family:var(--serif);font-size:13px;font-weight:400;font-style:italic;color:var(--cream-dim);flex-shrink:0}
.ncl-month-count{font-family:var(--mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cream-faint);background:rgba(244,239,232,.06);border-radius:20px;padding:3px 8px;flex-shrink:0}
.ncl-month-divider{flex:1;height:1px;background:rgba(244,239,232,.06)}

/* ── CORKBOARD ── */
.ncl-cork{margin:0 14px;background:#171008;border:1px solid rgba(245,184,76,.1);border-radius:20px;padding:20px 8px 24px;position:relative;overflow:hidden}
.ncl-cork-texture{position:absolute;inset:0;pointer-events:none;border-radius:20px;background:repeating-linear-gradient(45deg,rgba(245,184,76,.012) 0px,transparent 2px,transparent 8px,rgba(245,184,76,.012) 10px)}
.ncl-cork-grid{display:flex;flex-wrap:wrap;justify-content:space-around;padding:8px 4px;position:relative;z-index:1}
.ncl-cork-card{margin:10px 6px;position:relative;cursor:pointer;transition:transform .25s,box-shadow .25s,z-index 0s;z-index:1}
.ncl-cork-card:hover{z-index:10!important}
.ncl-cork-pol{background:#f5f0e8;border-radius:3px;padding:8px 8px 22px;width:128px;box-shadow:0 6px 20px rgba(0,0,0,.55),0 2px 6px rgba(0,0,0,.3)}
.ncl-cork-pol.origin-bg{background:#fdf8ee}
.ncl-cork-pin{position:absolute;top:-9px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.5);z-index:2}
.ncl-cork-new{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--teal);box-shadow:0 0 8px rgba(20,216,144,.6);z-index:2}
.ncl-cork-img{width:112px;height:92px;border-radius:2px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin:0 auto}
.ncl-cork-img img{width:100%;height:100%;object-fit:cover;display:block}
.ncl-cork-hl{font-family:var(--sans);font-size:8.5px;font-weight:700;color:#3a2010;text-align:center;line-height:1.35;margin-top:6px;padding:0 2px}
.ncl-cork-date{font-family:var(--mono);font-size:7.5px;color:rgba(60,30,10,.42);text-align:center;margin-top:3px}
.ncl-cork-variant-label{font-family:var(--mono);font-size:7px;text-align:center;margin-top:2px;letter-spacing:.04em}
.ncl-cork-footer{font-family:var(--serif);font-size:11px;color:rgba(245,184,76,.45);text-align:center;margin-top:14px;position:relative;z-index:1}

/* ── TIMELINE ── */
.ncl-timeline{padding:0 20px;display:flex;flex-direction:column;gap:10px}
.ncl-tl-card{display:flex;gap:14px;padding:14px;background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:18px;cursor:pointer;transition:all .18s;overflow:hidden}
.ncl-tl-card:hover{transform:translateX(3px);border-color:rgba(244,239,232,.15)}
.ncl-tl-card.origin{border-color:rgba(245,184,76,.22)}
.ncl-tl-photo{width:76px;min-height:86px;border-radius:10px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.ncl-tl-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;border-radius:10px}
.ncl-tl-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.ncl-tl-kicker{font-family:var(--mono);font-size:8px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:5px}
.ncl-tl-kicker-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.ncl-tl-headline{font-family:var(--serif);font-size:14px;font-weight:500;color:var(--cream);line-height:1.3;margin-bottom:5px}
.ncl-tl-quote{font-family:var(--serif);font-size:11px;font-weight:300;font-style:italic;color:var(--cream-dim);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:7px}
.ncl-tl-footer{display:flex;align-items:center;justify-content:space-between}
.ncl-tl-date{font-family:var(--mono);font-size:9px;color:var(--cream-faint)}
.ncl-tl-badge{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:.08em;text-transform:uppercase;background:rgba(245,184,76,.08);border:1px solid rgba(245,184,76,.15);padding:2px 7px;border-radius:6px}
.ncl-tl-share{font-size:14px;cursor:pointer;opacity:.4;transition:opacity .15s;background:none;border:none;color:var(--cream)}
.ncl-tl-share:hover{opacity:.8}

/* ── SCRAPBOOK ── */
.ncl-scrap{padding:0 16px}
.ncl-scrap-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ncl-scrap-card{border-radius:18px;overflow:hidden;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4);transition:transform .2s,box-shadow .2s;position:relative}
.ncl-scrap-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.55)}
.ncl-scrap-full{grid-column:1/-1}
.ncl-scrap-sky{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ncl-scrap-sky-emoji{animation:ncFloatSmall 4s ease-in-out infinite;z-index:2;position:relative}
.ncl-scrap-sky-bleed{position:absolute;bottom:0;left:0;right:0;height:32px;pointer-events:none}
.ncl-scrap-paper{padding:10px 12px 12px}
.ncl-scrap-night-label{font-family:var(--mono);font-size:8px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
.ncl-scrap-headline{font-family:var(--serif);font-weight:600;line-height:1.2}
.ncl-scrap-date{font-family:var(--mono);font-size:8px;color:rgba(60,40,20,.4);margin-top:5px}
.ncl-scrap-quote{font-family:var(--serif);font-style:italic;font-size:10px;color:rgba(60,40,20,.55);margin-top:4px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ncl-scrap-badge{position:absolute;top:10px;left:10px;z-index:5;font-family:var(--mono);font-size:8px;letter-spacing:1.5px;text-transform:uppercase;border-radius:20px;padding:3px 8px}
/* Occasion strip */
.ncl-scrap-occasion{grid-column:1/-1;min-height:90px;display:flex;align-items:center;background:var(--night-card);border:1px solid rgba(244,239,232,.08);border-radius:18px;overflow:hidden;cursor:pointer;transition:transform .2s,border-color .2s}
.ncl-scrap-occasion:hover{transform:translateY(-2px);border-color:rgba(244,239,232,.15)}
.ncl-scrap-occasion-left{width:80px;min-height:90px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:30px}
.ncl-scrap-occasion-body{flex:1;padding:12px 14px}
.ncl-scrap-occasion-kicker{font-family:var(--mono);font-size:8px;text-transform:uppercase;margin-bottom:4px}
.ncl-scrap-occasion-hl{font-family:var(--serif);font-size:13px;font-weight:500;color:var(--cream);line-height:1.3}
.ncl-scrap-occasion-date{font-family:var(--mono);font-size:9px;color:var(--cream-faint);margin-top:5px}

/* ── DETAIL MODAL ── */
.ncl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:100;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;backdrop-filter:blur(8px);animation:fadein .2s ease}
.ncl-modal-actions{display:flex;gap:10px;margin-top:16px;justify-content:center;flex-wrap:wrap}
.ncl-modal-action{padding:9px 14px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .15s;text-align:center;border:1px solid rgba(244,239,232,.15);background:rgba(244,239,232,.06);color:var(--cream-dim);display:flex;align-items:center;gap:5px}
.ncl-modal-action:hover{background:rgba(244,239,232,.12);border-color:rgba(244,239,232,.25)}
.ncl-modal-action.danger{border-color:rgba(200,80,80,.3);color:rgba(255,140,130,.6)}
.ncl-modal-action.danger:hover{background:rgba(200,80,80,.1)}

/* Edit modal */
.ncl-edit-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadein .15s ease}
.ncl-edit{background:#F4EFE2;border-radius:16px;padding:20px;width:100%;max-width:380px;box-shadow:0 40px 100px rgba(0,0,0,.9);animation:slideup .3s cubic-bezier(.22,1,.36,1);max-height:85vh;overflow-y:auto}

/* confirm */
.ncl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadein .15s ease}
.ncl-confirm{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:slideup .2s cubic-bezier(.22,1,.36,1)}
.ncl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:8px}
.ncl-confirm p{font-size:13px;color:var(--cream-faint);line-height:1.6;margin-bottom:20px}
.ncl-confirm-btns{display:flex;gap:10px}
.ncl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.ncl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
`;

const ROTS = [-2.8, 1.5, -1, 2.4, -3.2, 0.8];
const OFFSETS = [0, 5, -3, 7, 2, -4];

interface Props { userId: string; onBack: () => void; filterCharacterId?: string; }

export default function NightCardLibrary({ userId, onBack, filterCharacterId }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<any>({});
  const [viewMode, setViewMode] = useState<'cork' | 'timeline' | 'scrapbook'>('cork');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SavedNightCard | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    getNightCards(userId).then(fetched => {
      const sorted = [...fetched].sort((a, b) => {
        if (a.isOrigin) return -1;
        if (b.isOrigin) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setCards(sorted);
    });
  }, [userId]);

  const displayed = (filterCharacterId
    ? cards.filter(c => c.characterIds?.includes(filterCharacterId))
    : cards
  ).filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.heroName || '').toLowerCase().includes(s)
      || (c.quote || '').toLowerCase().includes(s)
      || (c.bondingAnswer || '').toLowerCase().includes(s)
      || (c.gratitude || '').toLowerCase().includes(s)
      || (c.storyTitle || '').toLowerCase().includes(s)
      || (c.headline || '').toLowerCase().includes(s);
  });

  const childName = cards.length > 0 ? cards.find(c => !c.isOrigin)?.heroName || cards[0]?.heroName || 'your child' : 'your child';
  const todayStr = new Date().toISOString().split('T')[0];
  const latestCard = displayed.find(c => !c.isOrigin) || displayed[0];

  // ── Stats ──
  const stats = useMemo(() => {
    let streak = 0;
    const dates = [...new Set(cards.map(c => c.date?.split?.('T')?.[0]).filter(Boolean))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates.length > 0 && (dates[0] === today || dates[0] === yesterday)) {
      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000);
        if (diff <= 1) streak++; else break;
      }
    }
    let rare = 0, journeyCount = 0;
    cards.forEach(c => {
      const v = getCardVariant(c);
      if (v !== 'standard') rare++;
      if (v === 'journey') journeyCount++;
    });
    return { total: cards.length, streak, rare, journeyCount };
  }, [cards]);

  // ── Month grouping ──
  const monthGroups = useMemo(() => groupByMonth(displayed), [displayed]);

  const handleDelete = async (nc: SavedNightCard) => {
    await deleteNightCard(userId, nc.id);
    const fetched = await getNightCards(userId);
    const sorted = [...fetched].sort((a, b) => {
      if (a.isOrigin) return -1;
      if (b.isOrigin) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setCards(sorted);
    if (viewing?.id === nc.id) setViewing(null);
    setConfirmDelete(null);
  };

  // shareCard is now replaced by openShareMenu (above)

  const openDetail = (nc: SavedNightCard) => { setViewing(nc); setIsFlipped(false); setEditing(false); };
  const [shareMenuCard, setShareMenuCard] = useState<SavedNightCard | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // Generate a shareable link for a card
  const generateShareLink = async (nc: SavedNightCard): Promise<string> => {
    try {
      const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { error } = await supabase.from('night_card_shares').upsert({
        card_id: nc.id, share_token: token, created_at: new Date().toISOString(),
      });
      if (error) { console.error('Share insert error:', error); return ''; }
      return `${window.location.origin}${window.location.pathname}?nc=${token}`;
    } catch (e) { console.error('Share link generation failed:', e); return ''; }
  };

  const shareToGrandparent = async (nc: SavedNightCard) => {
    const url = await generateShareLink(nc);
    if (!url) { alert('Could not create share link. Please try again.'); return; }
    if (navigator.share) {
      try { await navigator.share({ title: `${nc.heroName}'s Night Card`, text: `Look at this bedtime memory from ${nc.heroName}!`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareLink(url);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 3000);
    }
  };

  const openShareMenu = async (nc: SavedNightCard) => {
    // On mobile with native share, use it directly
    if (navigator.share) {
      // Generate image first
      const blob = await generateCardImage(nc);
      if (blob) {
        const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: `Night Card \u2014 ${nc.heroName}` }); return; } catch {}
        }
      }
      // Fallback to URL share
      const url = await generateShareLink(nc);
      if (url) { try { await navigator.share({ title: `${nc.heroName}'s Night Card`, url }); } catch {} }
      return;
    }
    // On desktop, show share menu
    const url = await generateShareLink(nc);
    if (url) { setShareLink(url); setShareMenuCard(nc); }
  };

  // Generate card image as blob (extracted from old shareCard)
  const generateCardImage = (nc: SavedNightCard): Promise<Blob | null> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const W = 600, H = 800;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.fillStyle = '#F4EFE2';
      ctx.fillRect(0, 0, W, H);
      const draw = () => {
        const textY = nc.photo ? 400 : 100;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2A1600';
        ctx.font = 'italic 20px Georgia, serif';
        const words = (nc.quote || '').split(' ');
        let line = '', lineY = textY;
        for (const w of words) {
          const test = line + w + ' ';
          if (ctx.measureText(test).width > W - 80 && line) { ctx.fillText(`"${line.trim()}"`, W / 2, lineY); line = w + ' '; lineY += 28; } else { line = test; }
        }
        if (line.trim()) ctx.fillText(line === words.join(' ') + ' ' ? `"${line.trim()}"` : line.trim(), W / 2, lineY);
        ctx.fillStyle = 'rgba(58,38,0,.4)';
        ctx.font = '600 11px sans-serif';
        ctx.fillText(`${nc.heroName}  \u00B7  ${formatDate(nc.date)}`, W / 2, H - 50);
        ctx.fillStyle = 'rgba(58,38,0,.2)';
        ctx.font = '10px monospace';
        ctx.fillText('SleepSeed', W / 2, H - 28);
        canvas.toBlob(b => resolve(b), 'image/png');
      };
      if (nc.photo) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ph = 360;
          const scale = Math.max(W / img.width, ph / img.height);
          const sw = img.width * scale, sh = img.height * scale;
          ctx.drawImage(img, (W - sw) / 2, 20 + (ph - sh) / 2, sw, sh);
          draw();
        };
        img.onerror = () => draw();
        img.src = nc.photo;
      } else draw();
    });
  };

  const downloadCardImage = async (nc: SavedNightCard) => {
    const blob = await generateCardImage(nc);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nightcard-${nc.heroName}-${nc.date}.png`; a.click();
    URL.revokeObjectURL(url);
  };

  const openPrintView = (nc: SavedNightCard) => {
    window.open(`${window.location.pathname}?printCard=${nc.id}&uid=${userId}`, '_blank');
  };

  // ── Render helpers ──
  const renderMonthHeader = (label: string, count: number) => (
    <div className="ncl-month-header">
      <div className="ncl-month-label">{label}</div>
      <div className="ncl-month-count">{count} card{count !== 1 ? 's' : ''}</div>
      <div className="ncl-month-divider" />
    </div>
  );

  const renderCorkboard = (monthCards: SavedNightCard[]) => (
    <div className="ncl-cork">
      <div className="ncl-cork-texture" />
      <div className="ncl-cork-grid">
        {monthCards.map((nc, i) => {
          const variant = getCardVariant(nc);
          const vs = CARD_VARIANT_STYLES[variant];
          const rot = ROTS[i % ROTS.length];
          const offY = OFFSETS[i % OFFSETS.length];
          const isNew = nc.date.split('T')[0] === todayStr;
          return (
            <div key={nc.id} className="ncl-cork-card" style={{
              transform: `rotate(${rot}deg) translateY(${offY}px)`,
            }} onClick={() => openDetail(nc)}>
              <div className="ncl-cork-pin" style={{ background: getPinStyle(variant) }} />
              {isNew && <div className="ncl-cork-new" />}
              <div className={`ncl-cork-pol${variant === 'origin' ? ' origin-bg' : ''}`}
                style={{ transition: 'transform .25s, box-shadow .25s' }}
                onMouseEnter={e => { (e.currentTarget.parentElement as HTMLElement).style.transform = 'rotate(0deg) translateY(-7px) scale(1.06)'; (e.currentTarget.parentElement as HTMLElement).style.boxShadow = '0 20px 56px rgba(0,0,0,.8)'; }}
                onMouseLeave={e => { (e.currentTarget.parentElement as HTMLElement).style.transform = `rotate(${rot}deg) translateY(${offY}px)`; (e.currentTarget.parentElement as HTMLElement).style.boxShadow = ''; }}>
                <div className="ncl-cork-img" style={{ background: !nc.photo ? vs.skyGradient : undefined }}>
                  {nc.photo
                    ? <img src={nc.photo} alt="" />
                    : <span style={{ fontSize: 34, zIndex: 2 }}>{nc.creatureEmoji || nc.emoji || '\uD83C\uDF19'}</span>}
                </div>
                <div className="ncl-cork-hl">{nc.headline || nc.heroName}</div>
                <div className="ncl-cork-date" style={{
                  color: variant === 'origin' ? 'rgba(180,120,20,.55)' : variant === 'journey' ? 'rgba(14,160,80,.65)' : variant === 'streak' ? 'rgba(180,100,10,.7)' : variant === 'occasion' ? 'rgba(100,80,220,.65)' : undefined,
                }}>{formatDate(nc.date)}</div>
                {variant === 'origin' && <div className="ncl-cork-variant-label" style={{ color: 'rgba(180,120,20,.7)' }}>Origin {'\u2726'}</div>}
                {variant === 'journey' && <div className="ncl-cork-variant-label" style={{ color: 'rgba(14,160,80,.7)' }}>Journey {'\uD83C\uDF1F'}</div>}
                {variant === 'streak' && <div className="ncl-cork-variant-label" style={{ color: 'rgba(180,100,10,.7)' }}>Streak {'\uD83D\uDD25'}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="ncl-cork-footer">tap any card to open</div>
    </div>
  );

  const renderTimeline = (monthCards: SavedNightCard[]) => (
    <div className="ncl-timeline">
      {monthCards.map(nc => {
        const variant = getCardVariant(nc);
        const vs = CARD_VARIANT_STYLES[variant];
        const isNew = nc.date.split('T')[0] === todayStr;
        const kicker = getKicker(nc, variant, isNew);
        return (
          <div key={nc.id} className={`ncl-tl-card${variant === 'origin' ? ' origin' : ''}`} onClick={() => openDetail(nc)}>
            <div className="ncl-tl-photo" style={{ background: vs.skyGradient }}>
              {nc.photo
                ? <img src={nc.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                : <div className="ncl-tl-fallback">{nc.creatureEmoji || nc.emoji || '\uD83C\uDF19'}</div>}
            </div>
            <div className="ncl-tl-body">
              <div className="ncl-tl-kicker" style={{ color: kicker.color }}>
                {kicker.dot && <div className="ncl-tl-kicker-dot" style={{ background: kicker.color }} />}
                {kicker.text}
              </div>
              <div className="ncl-tl-headline">{nc.headline || nc.storyTitle || nc.heroName}</div>
              {nc.quote && <div className="ncl-tl-quote">{'\u201C'}{nc.quote}{'\u201D'}</div>}
              <div className="ncl-tl-footer">
                <div className="ncl-tl-date">{formatDateLong(nc.date)}</div>
                {variant === 'origin'
                  ? <div className="ncl-tl-badge">Origin {'\u2726'}</div>
                  : <button className="ncl-tl-share" onClick={e => { e.stopPropagation(); openShareMenu(nc); }}>{'\u2197'}</button>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderScrapbook = (monthCards: SavedNightCard[]) => {
    // Sort: origin first, then journey/streak, then standard, then occasion last
    const priorityOrder: Record<CardVariant, number> = { origin: 0, journey: 1, streak: 1, standard: 2, occasion: 3 };
    const sorted = [...monthCards].sort((a, b) => priorityOrder[getCardVariant(a)] - priorityOrder[getCardVariant(b)]);
    const occasions = sorted.filter(c => getCardVariant(c) === 'occasion');
    const nonOccasions = sorted.filter(c => getCardVariant(c) !== 'occasion');

    return (
      <div className="ncl-scrap">
        <div className="ncl-scrap-grid">
          {nonOccasions.map((nc, i) => {
            const variant = getCardVariant(nc);
            const vs = CARD_VARIANT_STYLES[variant];
            const badge = getScrapbookBadge(variant, nc);
            const isFull = variant === 'origin' || (variant === 'standard' && nonOccasions.length === 1) ||
              (variant === 'standard' && i === nonOccasions.length - 1 && (nonOccasions.length - (nonOccasions.filter(c => getCardVariant(c) === 'origin').length)) % 2 === 1);
            const emojiSize = variant === 'origin' ? 60 : (variant === 'journey' || variant === 'streak') ? 40 : 30;
            const hlSize = variant === 'origin' ? 16 : (variant === 'journey' || variant === 'streak') ? 14 : 12;
            const skyH = variant === 'origin' ? 140 : (variant === 'journey' || variant === 'streak') ? 120 : 82;

            return (
              <div key={nc.id} className={`ncl-scrap-card${isFull ? ' ncl-scrap-full' : ''}`}
                style={{ minHeight: variant === 'origin' ? 220 : (variant === 'journey' || variant === 'streak') ? 200 : 140 }}
                onClick={() => openDetail(nc)}>
                {badge && (
                  <div className="ncl-scrap-badge" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                    {badge.text}
                  </div>
                )}
                <div className="ncl-scrap-sky" style={{ height: skyH, background: vs.skyGradient }}>
                  {nc.photo
                    ? <img src={nc.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className="ncl-scrap-sky-emoji" style={{ fontSize: emojiSize }}>{nc.creatureEmoji || nc.emoji || '\uD83C\uDF19'}</div>}
                  <div className="ncl-scrap-sky-bleed" style={{ background: `linear-gradient(transparent, ${vs.paperColor})` }} />
                </div>
                <div className="ncl-scrap-paper" style={{ background: vs.paperColor }}>
                  <div className="ncl-scrap-night-label" style={{ color: badge?.color || 'rgba(154,127,212,.7)' }}>
                    Night {nc.nightNumber || ''}{nc.lessonTheme ? ` \u00B7 ${nc.lessonTheme}` : ''}
                  </div>
                  <div className="ncl-scrap-headline" style={{ fontSize: hlSize, color: vs.headlineColor }}>
                    {nc.headline || nc.heroName}
                  </div>
                  <div className="ncl-scrap-date">{formatCardDateShort(nc.date)}</div>
                  {variant === 'origin' && nc.quote && (
                    <div className="ncl-scrap-quote">{'\u201C'}{nc.quote}{'\u201D'}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {occasions.map(nc => {
          const vs = CARD_VARIANT_STYLES.occasion;
          return (
            <div key={nc.id} className="ncl-scrap-occasion" style={{ marginTop: 10 }} onClick={() => openDetail(nc)}>
              <div className="ncl-scrap-occasion-left" style={{ background: vs.skyGradient }}>
                {nc.creatureEmoji || nc.emoji || '\uD83C\uDF89'}
              </div>
              <div className="ncl-scrap-occasion-body">
                <div className="ncl-scrap-occasion-kicker" style={{ color: 'var(--purple)', letterSpacing: '1.5px' }}>
                  {'\uD83C\uDF89'} {nc.occasion || 'Special Occasion'}
                </div>
                <div className="ncl-scrap-occasion-hl">{nc.headline || nc.heroName}</div>
                <div className="ncl-scrap-occasion-date">{formatCardDateShort(nc.date)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const NCL_VARIANT_RGB: Record<string,string> = {
    standard:'154,127,212', origin:'245,184,76', journey:'20,216,144', occasion:'148,130,255', streak:'245,184,76',
  };
  const getV = (card: SavedNightCard): string => {
    if (card.isOrigin) return 'origin';
    if ((card.nightNumber??0)===7) return 'journey';
    if (card.occasion) return 'occasion';
    if ([7,14,30,100].includes(card.streakCount??0)) return 'streak';
    return 'standard';
  };

  const displayCards = filterCharacterId
    ? cards.filter(c => c.characterIds?.includes(filterCharacterId))
    : displayed;

  return (
    <div style={{minHeight:'100dvh',background:'#060912',display:'flex',flexDirection:'column',paddingBottom:76}}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{padding:'20px 20px 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <div style={{fontSize:9,color:'rgba(154,127,212,.6)',fontFamily:"'DM Mono',monospace",letterSpacing:'1px',marginBottom:4}}>MEMORIES</div>
          <div style={{fontSize:26,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",letterSpacing:'-.5px'}}>Night Cards</div>
        </div>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:'50%',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(234,242,255,.45)" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{padding:'0 20px',marginBottom:20}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            [String(displayCards.length),'CARDS'],
            [String(new Set(displayCards.map(c=>c.date?.slice(0,7))).size),'MONTHS'],
            [String(displayCards.filter(c=>c.isOrigin).length),'ORIGIN'],
          ].map(([val,label])=>(
            <div key={label} style={{background:'rgba(154,127,212,.07)',border:'1px solid rgba(154,127,212,.15)',borderRadius:14,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1}}>{val}</div>
              <div style={{fontSize:7,color:'rgba(154,127,212,.5)',fontFamily:"'DM Mono',monospace",letterSpacing:'.7px',marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD GRID ── */}
      <div style={{padding:'0 20px'}}>
        {displayCards.length===0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center',gap:16}}>
            <div style={{fontSize:56}}>🌙</div>
            <div style={{fontSize:22,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1.2}}>No cards yet</div>
            <div style={{fontSize:13,color:'rgba(234,242,255,.36)',fontFamily:"'Nunito',sans-serif",fontStyle:'italic',lineHeight:1.6}}>Finish a story tonight and your first<br/>Night Card will appear here.</div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
            {displayCards.map((card,idx)=>{
              const variant=getV(card);
              const rgb=NCL_VARIANT_RGB[variant]??'154,127,212';
              return (
                <div key={card.id} onClick={()=>setViewing(card)} style={{cursor:'pointer',animation:`ncl-fadeUp .3s ${idx*.04}s ease both`,opacity:0,transform:idx%2===0?'rotate(-.8deg)':'rotate(.8deg)',transition:'transform .2s ease'}}>
                  <div style={{borderRadius:16,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.4),0 2px 8px rgba(0,0,0,.3)'}}>
                    {/* Sky zone */}
                    <div style={{height:120,background:`linear-gradient(145deg,rgba(${rgb},.15),rgba(6,9,18,.95))`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                      <svg style={{position:'absolute',inset:0}} viewBox="0 0 160 120" width="160" height="120">
                        {[...Array(12)].map((_,i)=><circle key={i} cx={(i*37+14)%150} cy={(i*23+8)%100} r={i%3===0?1.2:.6} fill={`rgba(255,255,255,${.2+(i%4)*.1})`}/>)}
                      </svg>
                      <div style={{fontSize:36,position:'relative',zIndex:1}}>{card.creatureEmoji??'🌙'}</div>
                      <div style={{position:'absolute',top:8,left:10,zIndex:2,padding:'3px 8px',background:`rgba(${rgb},.2)`,border:`1px solid rgba(${rgb},.4)`,borderRadius:20}}>
                        <span style={{fontSize:8,fontWeight:600,color:`rgba(${rgb},.95)`,fontFamily:"'DM Mono',monospace",letterSpacing:'.5px'}}>NIGHT {card.nightNumber??idx+1}</span>
                      </div>
                      <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(248,244,238,.95) 100%)'}}/>
                    </div>
                    {/* Paper zone */}
                    <div style={{background:'#f8f4ee',padding:'10px 12px 12px'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#1a1a2e',fontFamily:"'Fraunces',serif",lineHeight:1.3,letterSpacing:'-.1px',marginBottom:6}}>{card.headline??card.storyTitle}</div>
                      {card.quote&&<div style={{fontSize:9.5,color:'rgba(26,26,46,.55)',fontFamily:"'Lora',serif",fontStyle:'italic',lineHeight:1.5,marginBottom:8}}>"{card.quote.slice(0,55)}{card.quote.length>55?'…':''}"</div>}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:8,color:'rgba(26,26,46,.4)',fontFamily:"'DM Mono',monospace"}}>{new Date(card.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                        <div style={{fontSize:8,color:`rgba(${rgb},.7)`,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{card.heroName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SELECTED CARD MODAL ── */}
      {viewing && (
        <>
          <div onClick={()=>setViewing(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:200,animation:'ncl-fadeUp .2s ease both'}}/>
          <div style={{position:'fixed',inset:0,zIndex:201,display:'flex',alignItems:'center',justifyContent:'center',padding:20,pointerEvents:'none'}}>
            <div style={{pointerEvents:'all',width:'100%',maxWidth:300,animation:'ncl-cardIn .3s cubic-bezier(.2,.8,.3,1) both'}}>
              <NightCard card={viewing} size="full" />
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:16}}>
                <button onClick={()=>setViewing(null)} style={{padding:'11px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.06)',color:'rgba(234,242,255,.6)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer'}}>Close</button>
                <button onClick={()=>{if(viewing)openShareMenu(viewing);}} style={{padding:'11px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.06)',color:'rgba(234,242,255,.6)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer'}}>Share</button>
                <button onClick={()=>{if(viewing)openPrintView(viewing);}} style={{padding:'11px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.06)',color:'rgba(234,242,255,.6)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer'}}>Print</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation (kept from existing code) */}
      {confirmDelete && (
        <div className="ncl-confirm-bg" onClick={() => setConfirmDelete(null)}>
          <div className="ncl-confirm" onClick={e => e.stopPropagation()}>
            <h3>Remove this Night Card?</h3>
            <p>{confirmDelete.heroName}'s card from {formatDate(confirmDelete.date)} will be gone forever. This can't be undone.</p>
            <div className="ncl-confirm-btns">
              <button className="ncl-confirm-cancel" onClick={() => setConfirmDelete(null)}>Keep it</button>
              <button className="ncl-confirm-del" onClick={() => handleDelete(confirmDelete)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Share menu (kept from existing code) */}
      {shareMenuCard && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={()=>setShareMenuCard(null)}>
          <div style={{background:'#0C1840',borderRadius:22,padding:24,maxWidth:340,width:'100%'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:700,color:'#F4EFE8',fontFamily:"'Fraunces',serif",marginBottom:12}}>Share this Night Card</div>
            {shareLink && (
              <div style={{background:'rgba(255,255,255,.05)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'rgba(234,242,255,.5)',wordBreak:'break-all',fontFamily:"'DM Mono',monospace",marginBottom:12}}>{shareLink}</div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{navigator.clipboard.writeText(shareLink).catch(()=>{});setShareLinkCopied(true);setTimeout(()=>setShareLinkCopied(false),2000);}} style={{flex:1,padding:'11px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.06)',color:'rgba(234,242,255,.6)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer'}}>{shareLinkCopied?'Copied!':'Copy link'}</button>
              <button onClick={()=>setShareMenuCard(null)} style={{padding:'11px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'transparent',color:'rgba(234,242,255,.4)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer'}}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
