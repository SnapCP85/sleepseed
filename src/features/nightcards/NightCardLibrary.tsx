import { useState, useEffect, useMemo } from 'react';
import { getNightCards, deleteNightCard, saveNightCard } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import type { SavedNightCard } from '../../lib/types';
import { getCardVariant } from '../../lib/types';
import NightCard from './NightCard';
import { generateNightCardImage, downloadBlob, generateNightCardBook } from '../../lib/shareUtils';
import { BASE_URL } from '../../lib/config';

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

function monthLabel(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  catch { return ''; }
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

.ncl-inner{max-width:960px;margin:0 auto;padding:0 20px}
@media(min-width:768px){.ncl-inner{padding:0 40px}}

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

/* ── JOURNAL GRID ── */
.ncl-journal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 20px}
.ncl-journal-card{background:rgba(15,21,37,.8);border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
.ncl-journal-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.12);box-shadow:0 12px 32px rgba(0,0,0,.4)}
.ncl-journal-photo{width:100%;height:120px;object-fit:cover;display:block}
.ncl-journal-sky{width:100%;height:120px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.ncl-journal-sky-emoji{font-size:36px;position:relative;z-index:1;animation:ncFloatSmall 4s ease-in-out infinite}
.ncl-journal-sky-stars{position:absolute;inset:0;pointer-events:none}
.ncl-journal-body{padding:10px 12px 12px}
.ncl-journal-hl{font-family:var(--serif);font-size:13px;font-weight:700;color:var(--cream);line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ncl-journal-quote{font-family:var(--serif);font-size:11px;font-style:italic;color:var(--cream-dim);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px}
.ncl-journal-footer{display:flex;align-items:center;justify-content:space-between}
.ncl-journal-date{font-family:var(--mono);font-size:9px;color:var(--cream-faint)}
.ncl-journal-badge{font-family:var(--mono);font-size:7px;letter-spacing:.5px;text-transform:uppercase;padding:2px 7px;border-radius:10px;font-weight:600}

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

interface Props { userId: string; onBack: () => void; filterCharacterId?: string; }

export default function NightCardLibrary({ userId, onBack, filterCharacterId }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SavedNightCard | null>(null);
  const [reflectionInput, setReflectionInput] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  useEffect(() => {
    console.log('[NCLibrary] Loading cards for userId:', userId);

    // ── Reconcile v1 → v2: recover cards that were saved to the v1 key but never made it to v2 ──
    const reconcile = () => {
      try {
        const v1Key = `ss9_u_${userId}_nightcards`;
        const v1Raw = localStorage.getItem(v1Key);
        const v1Data = v1Raw ? JSON.parse(v1Raw) : null;
        const v1Cards: any[] = v1Data?.items || (Array.isArray(v1Data) ? v1Data : []);

        const v2Key = `ss2_nightcards_${userId}`;
        const v2Raw = localStorage.getItem(v2Key);
        const v2Cards: any[] = v2Raw ? JSON.parse(v2Raw) : [];

        console.log('[NCLibrary] v1 count:', v1Cards.length, 'v2 count:', v2Cards.length);

        if (v1Cards.length === 0) return;

        // Strip base64 from both to save space
        const strip = (c: any) => ({...c,
          photo: c.photo?.startsWith?.('data:') ? null : c.photo,
          childDrawing: c.childDrawing?.startsWith?.('data:') ? null : c.childDrawing,
        });

        const v2Ids = new Set(v2Cards.map((c: any) => c.id).filter(Boolean));
        const missing = v1Cards.filter((c: any) => c.id && !v2Ids.has(c.id));

        if (missing.length > 0) {
          const toAdd = missing.map((c: any) => strip({
            id: c.id, userId,
            heroName: c.heroName || '', storyTitle: c.storyTitle || '',
            characterIds: c.characterIds || [],
            headline: c.headline || c.storyTitle || '',
            quote: c.quote || c.bondingAnswer || c.bondingA || '',
            memory_line: c.memory_line || '',
            bondingQuestion: c.bondingQuestion || c.bondingQ || '',
            bondingAnswer: c.bondingAnswer || c.bondingA || '',
            gratitude: c.gratitude || '',
            extra: c.extra || '',
            photo: c.photo || null,
            emoji: c.emoji || '🌙',
            date: c.date || new Date().toISOString().split('T')[0],
            childMood: c.childMood, childAge: c.childAge,
            bedtimeActual: c.bedtimeActual, tags: c.tags,
            milestone: c.milestone, whisper: c.whisper || c.reflection,
            isOrigin: c.isOrigin, creatureEmoji: c.creatureEmoji, creatureColor: c.creatureColor,
            nightNumber: c.nightNumber, streakCount: c.streakCount,
            reflection: c.reflection,
          }));
          const merged = [...v2Cards.map(strip), ...toAdd];
          localStorage.setItem(v2Key, JSON.stringify(merged));
          console.log(`[NCLibrary] RECOVERED ${missing.length} cards from v1 → v2 (total: ${merged.length})`);

          // Push recovered cards to Supabase (fire and forget)
          for (const card of toAdd) {
            const packed: any = {};
            if (card.isOrigin) packed.isOrigin = true;
            if (card.whisper) packed.whisper = card.whisper;
            if (card.creatureEmoji) packed.creatureEmoji = card.creatureEmoji;
            if (card.creatureColor) packed.creatureColor = card.creatureColor;
            if (card.childMood) packed.childMood = card.childMood;
            if (card.childAge) packed.childAge = card.childAge;
            if (card.tags?.length) packed.tags = card.tags;
            if (card.bedtimeActual) packed.bedtimeActual = card.bedtimeActual;
            if (card.nightNumber != null) packed.nightNumber = card.nightNumber;
            if (card.streakCount != null) packed.streakCount = card.streakCount;
            if (card.milestone) packed.milestone = card.milestone;
            supabase.from('night_cards').upsert({
              id: card.id, user_id: userId, hero_name: card.heroName,
              story_id: null, story_title: card.storyTitle,
              character_ids: card.characterIds || [],
              headline: card.headline, quote: card.quote,
              memory_line: card.memory_line || null,
              bonding_question: card.bondingQuestion || null,
              bonding_answer: card.bondingAnswer || null,
              gratitude: card.gratitude || null,
              extra: Object.keys(packed).length ? JSON.stringify(packed) : (card.extra || null),
              photo_url: card.photo || null,
              emoji: card.emoji || '🌙', date: card.date,
            }).then(({ error }) => {
              if (error) console.warn('[NCLibrary] Supabase recovery push failed:', card.id, error.message);
            });
          }
        } else {
          // No missing cards, but still clean base64 from v2 if needed
          const needsClean = v2Cards.some((c: any) => c.photo?.startsWith?.('data:') || c.childDrawing?.startsWith?.('data:'));
          if (needsClean) {
            localStorage.setItem(v2Key, JSON.stringify(v2Cards.map(strip)));
            console.log('[NCLibrary] Cleaned base64 from v2');
          }
        }
      } catch(e) { console.error('[NCLibrary] Reconciliation error:', e); }
    };

    reconcile();

    // Now load cards normally (getNightCards reads v2 + Supabase)
    getNightCards(userId).then(fetched => {
      console.log('[NCLibrary] getNightCards returned:', fetched.length, 'cards');
      const sorted = [...fetched].sort((a, b) => {
        if (a.isOrigin) return -1;
        if (b.isOrigin) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setCards(sorted);
    });
  }, [userId]);

  const [moodFilter, setMoodFilter] = useState('');

  const displayed = (filterCharacterId
    ? cards.filter(c => c.characterIds?.includes(filterCharacterId))
    : cards
  ).filter(c => {
    if (moodFilter && c.childMood !== moodFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.heroName || '').toLowerCase().includes(s)
      || (c.quote || '').toLowerCase().includes(s)
      || (c.bondingAnswer || '').toLowerCase().includes(s)
      || (c.gratitude || '').toLowerCase().includes(s)
      || (c.storyTitle || '').toLowerCase().includes(s)
      || (c.headline || '').toLowerCase().includes(s);
  });

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

  const [shareMenuCard, setShareMenuCard] = useState<SavedNightCard | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Generate a shareable link for a card
  const generateShareLink = async (nc: SavedNightCard): Promise<string> => {
    try {
      const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { error } = await supabase.from('night_card_shares').upsert({
        card_id: nc.id, share_token: token, created_at: new Date().toISOString(),
      });
      if (error) { console.error('Share insert error:', error); return ''; }
      return `${BASE_URL}/?nc=${token}`;
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
    // On mobile with native share, generate image + share
    if (navigator.share) {
      const blob = await generateCardImage(nc);
      if (blob) {
        const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: `Night Card — ${nc.heroName}` }); return; } catch {}
        }
      }
      // Fallback to URL share
      const url = await generateShareLink(nc);
      if (url) { try { await navigator.share({ title: `${nc.heroName}'s Night Card`, url }); } catch {} }
      return;
    }
    // On desktop, show enhanced share menu
    const url = await generateShareLink(nc);
    if (url) { setShareLink(url); setShareMenuCard(nc); }
  };

  // Generate premium card image using shared utility (matches visual design)
  const generateCardImage = (nc: SavedNightCard): Promise<Blob | null> => {
    return generateNightCardImage({
      heroName: nc.heroName,
      headline: nc.headline || nc.storyTitle,
      quote: nc.quote,
      emoji: nc.emoji,
      date: nc.date,
      photo: nc.photo,
      nightNumber: nc.nightNumber,
      creatureEmoji: nc.creatureEmoji,
      creatureColor: nc.creatureColor,
      isOrigin: nc.isOrigin,
    });
  };

  const downloadCardImage = async (nc: SavedNightCard) => {
    const blob = await generateCardImage(nc);
    if (!blob) return;
    downloadBlob(blob, `nightcard-${nc.heroName}-${nc.date}.png`);
  };

  const openPrintView = (nc: SavedNightCard) => {
    window.open(`${window.location.pathname}?printCard=${nc.id}&uid=${userId}`, '_blank');
  };

  const NCL_VARIANT_RGB: Record<string,string> = {
    standard:'154,127,212', origin:'245,184,76', journey:'20,216,144', occasion:'148,130,255', streak:'245,184,76',
  };
  const getV = (card: SavedNightCard): string => {
    if (card.isOrigin) return 'origin';
    if ((card.nightNumber??0)===7) return 'journey';
    if (card.occasion) return 'occasion';
    if ([7,14,30,100].includes(card.streakCount??0)) return 'streak';
    if (card.milestone) return 'milestone';
    return 'standard';
  };

  const displayCards = filterCharacterId
    ? cards.filter(c => c.characterIds?.includes(filterCharacterId))
    : displayed;

  return (
    <div style={{minHeight:'100dvh',background:'#060912',display:'flex',flexDirection:'column',paddingBottom:76}}>
      <style>{CSS}</style>
    <div style={{maxWidth:640,margin:'0 auto',width:'100%'}}>

      {/* ── HEADER ── */}
      <div style={{padding:'20px 20px 0',display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:'50%',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'background .2s'}}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(234,242,255,.55)" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:9,color:'rgba(245,184,76,.5)',fontFamily:"'DM Mono',monospace",letterSpacing:'1px',marginBottom:4}}>MEMORY VAULT</div>
          <div style={{fontSize:24,fontWeight:700,color:'#F4EFE8',fontFamily:"'Fraunces',Georgia,serif",letterSpacing:'-.5px'}}>Night Cards</div>
        </div>
      </div>

      {/* ── VAULT SUMMARY ── */}
      {displayCards.length > 0 && (
        <div style={{padding:'0 20px',marginBottom:16}}>
          <div style={{
            fontFamily:"'Fraunces',Georgia,serif",fontSize:14,fontWeight:300,fontStyle:'italic',
            color:'rgba(244,239,232,.45)',lineHeight:1.6,
          }}>
            {displayCards.length} {displayCards.length===1?'memory':'memories'} preserved
            {stats.streak > 1 ? ` · ${stats.streak} night streak 🔥` : ''}
          </div>
        </div>
      )}

      {/* ── STATS STRIP ── */}
      <div style={{padding:'0 20px',marginBottom:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            [String(displayCards.length),'CARDS'],
            [String(new Set(displayCards.map(c=>c.date?.slice(0,7))).size),'MONTHS'],
            [stats.streak > 0 ? String(stats.streak) : '0','STREAK'],
          ].map(([val,label])=>(
            <div key={label} style={{background:'rgba(154,127,212,.07)',border:'1px solid rgba(154,127,212,.15)',borderRadius:14,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1}}>{val}</div>
              <div style={{fontSize:7,color:'rgba(154,127,212,.5)',fontFamily:"'DM Mono',monospace",letterSpacing:'.7px',marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOOK EXPORT + FAMILY SHARE ── */}
      {displayCards.length >= 3 && (
        <div style={{padding:'0 20px',marginBottom:16,display:'flex',gap:8}}>
          <button
            onClick={async()=>{
              const childName = displayCards[0]?.heroName || 'Child';
              const blob = await generateNightCardBook(childName, displayCards);
              downloadBlob(blob, `${childName}s-Memory-Book.pdf`);
            }}
            style={{
              width:'100%',padding:'12px 16px',borderRadius:14,
              background:'rgba(154,127,212,.06)',border:'1px solid rgba(154,127,212,.15)',
              color:'rgba(154,127,212,.7)',fontSize:12,fontWeight:600,
              fontFamily:"'Nunito',sans-serif",cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              transition:'all .2s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(154,127,212,.12)';e.currentTarget.style.borderColor='rgba(154,127,212,.25)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(154,127,212,.06)';e.currentTarget.style.borderColor='rgba(154,127,212,.15)';}}
          >
            <span style={{fontSize:14}}>{'\uD83D\uDCD6'}</span>
            {'\uD83D\uDCD6'} Memory Book
          </button>
          <button
            onClick={async()=>{
              try{
                const token=crypto.randomUUID?.() || `fam_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                const childName=displayCards[0]?.heroName||'Child';
                // Store all card IDs for this family share
                const cardIds=displayCards.map(c=>c.id);
                await supabase.from('family_shares').upsert({
                  share_token:token,user_id:userId,child_name:childName,
                  card_ids:cardIds,created_at:new Date().toISOString(),
                });
                const url=`${BASE_URL}/family/${token}`;
                if(navigator.share){
                  try{await navigator.share({title:`${childName}'s Night Cards`,text:`See ${childName}'s bedtime memories`,url});return;}catch{}
                }
                await navigator.clipboard.writeText(url).catch(()=>{});
                alert(`Link copied!\n\n${url}\n\nShare this with family to give them read-only access to ${childName}'s Night Cards.`);
              }catch(e){console.error('[NCL] family share failed:',e);alert('Could not create share link.');}
            }}
            style={{
              flex:1,padding:'12px 16px',borderRadius:14,
              background:'rgba(20,216,144,.06)',border:'1px solid rgba(20,216,144,.15)',
              color:'rgba(20,216,144,.7)',fontSize:12,fontWeight:600,
              fontFamily:"'Nunito',sans-serif",cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              transition:'all .2s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(20,216,144,.12)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(20,216,144,.06)';}}
          >
            {'\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67'} Share with Family
          </button>
        </div>
      )}

      {/* ── SEARCH + MOOD FILTER ── */}
      <div style={{padding:'0 20px',marginBottom:16}}>
        <input
          className="ncl-search"
          placeholder="Search memories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{marginBottom:10}}
        />
        {/* Mood filter chips */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[
            {emoji:'😊',label:'happy'},{emoji:'😴',label:'sleepy'},{emoji:'🤗',label:'cozy'},
            {emoji:'😌',label:'calm'},{emoji:'🥰',label:'loved'},{emoji:'😆',label:'silly'},
          ].map(m=>(
            <div key={m.emoji} onClick={()=>setMoodFilter(moodFilter===m.emoji?'':m.emoji)} style={{
              display:'flex',alignItems:'center',gap:4,
              padding:'5px 10px',borderRadius:16,cursor:'pointer',transition:'all .2s',
              background:moodFilter===m.emoji?'rgba(245,184,76,.12)':'rgba(255,255,255,.04)',
              border:`1px solid ${moodFilter===m.emoji?'rgba(245,184,76,.35)':'rgba(255,255,255,.08)'}`,
            }}>
              <span style={{fontSize:14}}>{m.emoji}</span>
              <span style={{fontSize:9,color:moodFilter===m.emoji?'rgba(245,184,76,.8)':'rgba(234,242,255,.3)',fontFamily:"'DM Mono',monospace"}}>{m.label}</span>
            </div>
          ))}
          {moodFilter && (
            <div onClick={()=>setMoodFilter('')} style={{
              display:'flex',alignItems:'center',padding:'5px 10px',borderRadius:16,cursor:'pointer',
              background:'rgba(200,80,80,.08)',border:'1px solid rgba(200,80,80,.2)',
              fontSize:9,color:'rgba(255,140,130,.6)',fontFamily:"'DM Mono',monospace",
            }}>✕ clear</div>
          )}
        </div>
      </div>

      {/* ── CARD GRID ── */}
      {displayCards.length===0 ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center',gap:16}}>
          <div style={{fontSize:56}}>🌙</div>
          <div style={{fontSize:22,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1.2}}>No cards yet</div>
          <div style={{fontSize:13,color:'rgba(234,242,255,.36)',fontFamily:"'Nunito',sans-serif",fontStyle:'italic',lineHeight:1.6}}>Finish a story tonight and your first<br/>Night Card will appear here.</div>
        </div>
      ) : (() => {
        const groups = groupByMonth(displayCards);
        return groups.map(group => (
          <div key={group.label} style={{marginBottom:24}}>
            <div className="ncl-month-header">
              <div className="ncl-month-label">{group.label}</div>
              <div className="ncl-month-count">{group.cards.length} card{group.cards.length !== 1 ? 's' : ''}</div>
              <div className="ncl-month-divider" />
            </div>
            <div className="ncl-journal-grid">
              {group.cards.map((card,idx)=>{
                const variant=getV(card);
                const rgb=NCL_VARIANT_RGB[variant]??'154,127,212';
                const badgeMap: Record<string,{text:string;bg:string;color:string}> = {
                  origin:{text:'Origin',bg:'rgba(245,184,76,.15)',color:'var(--amber)'},
                  journey:{text:'Journey',bg:'rgba(20,216,144,.12)',color:'var(--teal)'},
                  streak:{text:`${card.streakCount||''} Streak`,bg:'rgba(245,130,20,.12)',color:'#F5821A'},
                  occasion:{text:card.occasion||'Special',bg:'rgba(148,130,255,.12)',color:'var(--purple)'},
                  milestone:{text:`${card.milestone||''} Nights`,bg:'rgba(200,140,255,.12)',color:'#C88CFF'},
                };
                const badge = badgeMap[variant] || null;
                return (
                  <div key={card.id} className="ncl-journal-card" onClick={()=>setViewing(card)}
                    style={{animation:`ncl-fadeUp .3s ${idx*.04}s ease both`,opacity:0}}>
                    {/* Photo or gradient sky */}
                    {card.photo ? (
                      <img className="ncl-journal-photo" src={card.photo} alt="" style={{borderRadius:'16px 16px 0 0'}} />
                    ) : (
                      <div className="ncl-journal-sky" style={{background:`linear-gradient(145deg,rgba(${rgb},.18),rgba(6,9,18,.92))`}}>
                        <svg className="ncl-journal-sky-stars" viewBox="0 0 160 120" width="160" height="120">
                          {[...Array(10)].map((_,i)=><circle key={i} cx={(i*37+14)%150} cy={(i*23+8)%110} r={i%3===0?1:.5} fill={`rgba(255,255,255,${.15+(i%4)*.08})`}/>)}
                        </svg>
                        <div className="ncl-journal-sky-emoji">{card.creatureEmoji??'🌙'}</div>
                      </div>
                    )}
                    {/* Body */}
                    <div className="ncl-journal-body">
                      <div className="ncl-journal-hl">{card.headline??card.storyTitle??card.heroName}</div>
                      {card.quote && (
                        <div className="ncl-journal-quote">{'\u201C'}{card.quote}{'\u201D'}</div>
                      )}
                      <div className="ncl-journal-footer">
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          {card.childMood && <span style={{fontSize:11}}>{card.childMood}</span>}
                          <div className="ncl-journal-date">{new Date(card.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                        </div>
                        {badge && (
                          <div className="ncl-journal-badge" style={{background:badge.bg,color:badge.color}}>
                            {badge.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })()}

    </div>{/* end max-width container */}

      {/* ── SELECTED CARD MODAL ── */}
      {viewing && (
        <>
          <div onClick={()=>{setViewing(null);setFlipped(false);}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',zIndex:200,animation:'ncl-fadeUp .25s ease both'}}/>
          <div style={{position:'fixed',inset:0,zIndex:201,display:'flex',alignItems:'center',justifyContent:'center',padding:20,pointerEvents:'none',flexDirection:'column'}}>
            {/* Soft glow behind card */}
            <div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(154,127,212,.12) 0%,transparent 70%)',pointerEvents:'none',animation:'ncl-fadeUp .4s ease both'}}/>
            <div style={{pointerEvents:'all',width:'100%',maxWidth:300,maxHeight:'calc(100vh - 40px)',overflowY:'auto',scrollbarWidth:'none' as any,animation:'ncl-cardIn .35s cubic-bezier(.2,.8,.3,1) both',position:'relative',zIndex:1}}>
              <NightCard card={viewing} size="full" flipped={flipped} onFlip={()=>setFlipped(!flipped)} />

              {/* Context strip below card */}
              {(viewing.storyTitle || viewing.childAge || viewing.bedtimeActual) && (
                <div style={{
                  marginTop:12,padding:'10px 14px',borderRadius:12,
                  background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                  display:'flex',flexWrap:'wrap',gap:'4px 10px',justifyContent:'center',
                  fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(234,242,255,.3)',
                }}>
                  {viewing.storyTitle && <span>📖 {viewing.storyTitle}</span>}
                  {viewing.bedtimeActual && <span>🕐 {viewing.bedtimeActual.toLowerCase()}</span>}
                  {viewing.childAge && <span>{viewing.heroName}, age {viewing.childAge}</span>}
                </div>
              )}

              {/* Flip hint */}
              <div style={{textAlign:'center',marginTop:8,fontSize:9,color:'rgba(234,242,255,.2)',fontFamily:"'DM Mono',monospace"}}>
                {flipped ? 'Tap card to see front' : 'Tap card to flip'}
              </div>

              {/* Add Photo (when card has no photo) */}
              {viewing && !viewing.photo && (
                <div style={{marginTop:10}}>
                  <input type="file" accept="image/*" id="ncl-photo-upload" style={{display:'none'}}
                    onChange={async(e)=>{
                      const f=e.target.files?.[0]; if(!f)return;
                      const reader=new FileReader();
                      reader.onload=async()=>{
                        const dataUrl=reader.result as string;
                        const updated={...viewing,photo:dataUrl};
                        setCards(prev=>prev.map(c=>c.id===updated.id?updated:c));
                        setViewing(updated);
                        try{await saveNightCard(updated);}catch(err){console.error('[NCL] savePhoto:',err);}
                      };
                      reader.readAsDataURL(f);
                    }}
                  />
                  <button onClick={()=>document.getElementById('ncl-photo-upload')?.click()} style={{
                    width:'100%',padding:'10px 14px',borderRadius:12,
                    border:'1px solid rgba(184,161,255,.15)',background:'rgba(184,161,255,.04)',
                    color:'rgba(184,161,255,.6)',fontSize:11,fontWeight:600,
                    fontFamily:"'DM Mono',monospace",cursor:'pointer',textAlign:'center',
                    letterSpacing:'.3px',
                  }}>
                    {'\uD83D\uDCF7'} Add a photo to this memory
                  </button>
                </div>
              )}
              {viewing?.photo && (
                <div style={{marginTop:10,textAlign:'center'}}>
                  <img src={viewing.photo} alt="" style={{maxWidth:'100%',maxHeight:180,borderRadius:12,objectFit:'cover',border:'1px solid rgba(255,255,255,.08)'}}/>
                </div>
              )}

              {/* Thread navigation — prev/next in sequence */}
              {viewing && (() => {
                const idx = displayCards.findIndex(c => c.id === viewing.id);
                const prev = idx < displayCards.length - 1 ? displayCards[idx + 1] : null; // older
                const next = idx > 0 ? displayCards[idx - 1] : null; // newer
                if (!prev && !next) return null;
                return (
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,gap:8}}>
                    <button disabled={!prev} onClick={()=>{if(prev){setViewing(prev);setFlipped(false);setReflectionInput('');setReflectionSaved(false);}}} style={{flex:1,padding:'8px 10px',borderRadius:10,border:'1px solid rgba(255,255,255,.08)',background:prev?'rgba(255,255,255,.04)':'transparent',color:prev?'rgba(234,242,255,.5)':'rgba(234,242,255,.12)',fontSize:10,fontFamily:"'DM Mono',monospace",cursor:prev?'pointer':'default',textAlign:'left'}}>
                      {prev ? `← ${prev.headline?.slice(0,20)||'older'}` : ''}
                    </button>
                    <div style={{fontSize:9,color:'rgba(234,242,255,.2)',fontFamily:"'DM Mono',monospace",flexShrink:0}}>
                      {displayCards.length - idx} of {displayCards.length}
                    </div>
                    <button disabled={!next} onClick={()=>{if(next){setViewing(next);setFlipped(false);setReflectionInput('');setReflectionSaved(false);}}} style={{flex:1,padding:'8px 10px',borderRadius:10,border:'1px solid rgba(255,255,255,.08)',background:next?'rgba(255,255,255,.04)':'transparent',color:next?'rgba(234,242,255,.5)':'rgba(234,242,255,.12)',fontSize:10,fontFamily:"'DM Mono',monospace",cursor:next?'pointer':'default',textAlign:'right'}}>
                      {next ? `${next.headline?.slice(0,20)||'newer'} →` : ''}
                    </button>
                  </div>
                );
              })()}

              {/* Add reflection */}
              {viewing && !viewing.parentReflection && !reflectionSaved && (
                <div style={{marginTop:10,padding:'10px 14px',borderRadius:12,background:'rgba(20,216,144,.04)',border:'1px solid rgba(20,216,144,.12)'}}>
                  <div style={{fontSize:9,color:'rgba(20,216,144,.5)',fontFamily:"'DM Mono',monospace",letterSpacing:'.4px',marginBottom:6}}>{'\uD83D\uDCAD'} ADD A REFLECTION</div>
                  <textarea value={reflectionInput} onChange={e=>setReflectionInput(e.target.value)} placeholder="Anything you remember about this night..." style={{width:'100%',minHeight:50,padding:'10px 12px',borderRadius:10,border:'1px solid rgba(20,216,144,.12)',background:'rgba(20,216,144,.04)',color:'rgba(234,242,255,.8)',fontSize:12,fontFamily:"'Nunito',sans-serif",resize:'none',outline:'none',lineHeight:1.5}} maxLength={280}/>
                  <button disabled={!reflectionInput.trim()} onClick={async()=>{
                    if(!viewing||!reflectionInput.trim())return;
                    const updated={...viewing,parentReflection:reflectionInput.trim()};
                    setCards(prev=>prev.map(c=>c.id===updated.id?updated:c));
                    setViewing(updated);
                    setReflectionSaved(true);
                    try{await saveNightCard(updated);}catch(e){console.error('[NCL] saveReflection:',e);}
                  }} style={{marginTop:6,padding:'7px 14px',borderRadius:8,border:'none',background:reflectionInput.trim()?'rgba(20,216,144,.2)':'rgba(255,255,255,.04)',color:reflectionInput.trim()?'rgba(20,216,144,.85)':'rgba(234,242,255,.2)',fontSize:11,fontWeight:600,cursor:reflectionInput.trim()?'pointer':'default',fontFamily:"'Nunito',sans-serif"}}>Save reflection</button>
                </div>
              )}
              {reflectionSaved && (
                <div style={{marginTop:10,textAlign:'center',fontSize:11,color:'rgba(20,216,144,.6)',fontFamily:"'Nunito',sans-serif"}}>{'\u2713'} Reflection saved</div>
              )}
              {viewing?.parentReflection && !reflectionSaved && (
                <div style={{marginTop:10,padding:'10px 14px',borderRadius:12,background:'rgba(20,216,144,.04)',border:'1px solid rgba(20,216,144,.08)'}}>
                  <div style={{fontSize:9,color:'rgba(20,216,144,.4)',fontFamily:"'DM Mono',monospace",letterSpacing:'.4px',marginBottom:4}}>{'\uD83D\uDCAD'} REFLECTION</div>
                  <div style={{fontSize:12,fontStyle:'italic',color:'rgba(234,242,255,.5)',fontFamily:"'Nunito',sans-serif",lineHeight:1.5}}>{viewing.parentReflection}</div>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
                <button onClick={()=>{setViewing(null);setFlipped(false);setReflectionInput('');setReflectionSaved(false);}} style={{padding:'11px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.06)',color:'rgba(234,242,255,.6)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer'}}>Close</button>
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

      {/* Enhanced share menu */}
      {shareMenuCard && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={()=>{setShareMenuCard(null);setShareMessage('');}}>
          <div style={{background:'#0C1840',borderRadius:22,padding:24,maxWidth:360,width:'100%'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:700,color:'#F4EFE8',fontFamily:"'Fraunces',serif",marginBottom:4}}>Share this Night Card</div>
            <div style={{fontSize:10,color:'rgba(234,242,255,.35)',fontFamily:"'DM Mono',monospace",marginBottom:14}}>{shareMenuCard.heroName}'s memory</div>
            {/* Optional message */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.3)',letterSpacing:'.5px',marginBottom:6}}>Add a message (optional)</div>
              <input type="text" value={shareMessage} onChange={e=>setShareMessage(e.target.value)} placeholder="Look at what we made tonight..." style={{width:'100%',padding:'10px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#F4EFE8',fontSize:13,fontFamily:"'Nunito',sans-serif",outline:'none',transition:'border-color .15s'}} onFocus={e=>{e.currentTarget.style.borderColor='rgba(245,184,76,.3)';}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)';}} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
              <div onClick={()=>{const text=shareMessage?`${shareMessage}\n\n${shareLink}`:shareLink;navigator.clipboard.writeText(text).catch(()=>{});setShareLinkCopied(true);setTimeout(()=>setShareLinkCopied(false),2000);}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'11px 8px',borderRadius:16,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(245,184,76,.85)" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.5)'}}>{shareLinkCopied?'Copied!':'Copy link'}</span>
              </div>
              <div onClick={()=>downloadCardImage(shareMenuCard)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'11px 8px',borderRadius:16,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(232,100,200,.8)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.5)'}}>Save image</span>
              </div>
              <div onClick={()=>{const msg=shareMessage?`${shareMessage}\n\n`:'';window.open('https://wa.me/?text='+encodeURIComponent(`${msg}${shareMenuCard.heroName}'s Night Card\n\n${shareLink}`),'_blank');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'11px 8px',borderRadius:16,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(37,211,102,.8)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.5)'}}>WhatsApp</span>
              </div>
              <div onClick={()=>{setShareMenuCard(null);setShareMessage('');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'11px 8px',borderRadius:16,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.4)" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.4)'}}>Done</span>
              </div>
            </div>
            {shareLinkCopied&&<div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(20,216,144,.8)',textAlign:'center'}}>✓ Link copied</div>}
          </div>
        </div>
      )}
    </div>
  );
}
