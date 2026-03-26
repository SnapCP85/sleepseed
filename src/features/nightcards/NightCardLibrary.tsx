import { useState, useEffect, useRef } from 'react';
import { getNightCards, deleteNightCard, saveNightCard } from '../../lib/storage';
import type { SavedNightCard } from '../../lib/types';

// ── Date helper ──────────────────────────────────────────────────────────────
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--night-card:#0f1525;--amber:#F5B84C;--amber-deep:#E8972A;--cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);--teal:#14d890;--purple:#9482ff;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes slideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

.ncl{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:80px}

/* Nav */
.ncl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(8,12,24,.92);position:sticky;top:0;z-index:10;backdrop-filter:blur(20px)}
.ncl-nav-left{display:flex;align-items:center;gap:10px}
.ncl-back{background:transparent;border:none;color:var(--cream-faint);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s}
.ncl-back:hover{color:var(--cream-dim)}
.ncl-title{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--cream)}
.ncl-title span{color:var(--amber)}
.ncl-nav-right{display:flex;align-items:center;gap:8px}
.ncl-nav-btn{width:34px;height:34px;border-radius:50%;background:rgba(244,239,232,.06);border:none;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:var(--cream-faint);transition:all .18s}
.ncl-nav-btn:hover{background:rgba(244,239,232,.1)}

.ncl-inner{max-width:600px;margin:0 auto;padding:0 20px}

/* Opening Statement */
.ncl-opening{padding:16px 0 14px;animation:fadeUp .6s ease}
.ncl-opening-h{font-family:var(--serif);font-size:22px;font-weight:400;color:var(--cream);line-height:1.35}
.ncl-opening-h em{font-style:italic;color:var(--amber)}
.ncl-opening-sub{font-family:var(--sans);font-size:12px;color:var(--cream-faint);margin-top:6px}

/* View Toggle */
.ncl-toggle{display:flex;gap:6px;margin-bottom:20px}
.ncl-toggle-btn{padding:7px 14px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid rgba(244,239,232,.08);background:var(--night-card);color:var(--cream-faint);transition:all .18s;font-family:var(--sans)}
.ncl-toggle-btn.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.1);color:var(--amber)}
.ncl-toggle-btn:hover:not(.on){border-color:rgba(244,239,232,.15)}

/* Search */
.ncl-search{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(244,239,232,.08);border-radius:14px;padding:11px 14px;font-size:13px;color:var(--cream);outline:none;font-family:inherit;transition:border-color .2s;margin-bottom:16px}
.ncl-search:focus{border-color:rgba(245,184,76,.3)}
.ncl-search::placeholder{color:rgba(255,255,255,.2)}

/* Empty */
.ncl-empty{text-align:center;padding:80px 24px}
.ncl-empty-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 20px;opacity:.4}
.ncl-empty-h{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--cream);margin-bottom:10px;font-style:italic}
.ncl-empty-sub{font-size:14px;color:var(--cream-faint);line-height:1.72;max-width:360px;margin:0 auto;font-weight:300}

/* ── CORKBOARD ── */
.ncl-cork{margin:0 -6px;background:#1a1208;border:1px solid rgba(245,184,76,.1);border-radius:20px;padding:20px 10px 24px;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-around;min-height:300px;position:relative;background-image:repeating-linear-gradient(45deg,transparent,transparent 35px,rgba(245,184,76,.015) 35px,rgba(245,184,76,.015) 70px)}
@media(max-width:600px){.ncl-cork{padding:16px 8px 20px;gap:10px}}

/* Polaroid */
.ncl-pol{background:#f5f0e8;border-radius:3px;padding:8px 8px 22px;cursor:pointer;transition:transform .22s,box-shadow .22s,z-index 0s;position:relative;flex-shrink:0;width:130px}
.ncl-pol:hover{box-shadow:0 20px 56px rgba(0,0,0,.8)!important;z-index:10;transform:rotate(0deg) scale(1.06) translateY(-6px)!important}

/* Push pin */
.ncl-pin{position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4);z-index:3}
.ncl-pin.red{background:radial-gradient(circle at 35% 35%,#e84040,#a02020)}
.ncl-pin.gold{background:radial-gradient(circle at 35% 35%,#F5B84C,#a06010)}

/* New card badge */
.ncl-new-dot{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:var(--teal);box-shadow:0 0 6px rgba(20,216,144,.5);z-index:4}

.ncl-pol-photo{width:114px;height:94px;border-radius:2px;overflow:hidden;margin:0 auto}
.ncl-pol-img{width:100%;height:100%;object-fit:cover;display:block}
.ncl-pol-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px}
.ncl-pol-writing{padding:6px 4px 0;text-align:center}
.ncl-pol-name{font-family:var(--sans);font-size:9px;font-weight:700;color:#3a2010;text-align:center}
.ncl-pol-date{font-family:var(--mono);font-size:8px;color:rgba(60,30,10,.45);text-align:center;margin-top:1px}
.ncl-origin-badge{position:absolute;top:6px;left:6px;background:rgba(232,151,42,.92);border-radius:4px;padding:2px 6px;font-size:6.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#120800;font-family:var(--sans);z-index:2}
.ncl-pol-del{position:absolute;top:6px;right:6px;background:rgba(180,50,50,.8);border:none;border-radius:50%;width:22px;height:22px;font-size:10px;color:white;cursor:pointer;display:none;align-items:center;justify-content:center;font-family:var(--sans);z-index:2}
.ncl-pol:hover .ncl-pol-del{display:flex}

/* ── TIMELINE ── */
.ncl-timeline{display:flex;flex-direction:column;gap:0}
.ncl-tl-month{font-family:var(--mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--amber);margin:20px 0 10px 4px;font-weight:600}
.ncl-tl-month:first-child{margin-top:0}
.ncl-tl-card{display:flex;gap:14px;padding:14px;background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:18px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.ncl-tl-card:hover{transform:translateX(3px);border-color:rgba(244,239,232,.14)}
.ncl-tl-card.origin{border-color:rgba(245,184,76,.2)}
.ncl-tl-photo{width:80px;min-height:88px;border-radius:10px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.ncl-tl-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;border-radius:10px}
.ncl-tl-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.ncl-tl-origin-badge{font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.ncl-tl-headline{font-family:var(--serif);font-size:14px;font-weight:500;color:var(--cream);line-height:1.3;margin-bottom:4px}
.ncl-tl-quote{font-family:var(--serif);font-size:11px;font-weight:300;font-style:italic;color:var(--cream-dim);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px}
.ncl-tl-footer{display:flex;align-items:center;justify-content:space-between}
.ncl-tl-date{font-family:var(--mono);font-size:9px;color:var(--cream-faint)}
.ncl-tl-share{font-size:14px;cursor:pointer;opacity:.4;transition:opacity .15s;background:none;border:none;color:var(--cream)}
.ncl-tl-share:hover{opacity:.8}

/* ── DETAIL MODAL ── */
.ncl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(10px);animation:fadein .2s ease}
.ncl-modal{background:#F4EFE2;border-radius:6px;padding:16px 16px 32px;width:100%;max-width:420px;box-shadow:0 40px 100px rgba(0,0,0,.9);position:relative;animation:slideup .3s cubic-bezier(.22,1,.36,1);max-height:90vh;overflow-y:auto}
.ncl-modal-close{position:absolute;top:10px;right:10px;background:rgba(58,40,0,.1);border:none;border-radius:50%;width:28px;height:28px;font-size:12px;color:#3A2800;cursor:pointer;font-family:var(--sans);transition:background .15s;z-index:2}
.ncl-modal-close:hover{background:rgba(58,40,0,.18)}
.ncl-modal-photo{width:100%;border-radius:4px;overflow:hidden;margin-bottom:14px}
.ncl-modal-photo img{width:100%;display:block;border-radius:3px}
.ncl-modal-headline{font-family:var(--serif);font-size:16px;font-weight:700;color:#2A1600;text-align:center;margin-bottom:6px}
.ncl-modal-quote{font-family:Georgia,serif;font-size:14px;font-style:italic;color:#3A2000;line-height:1.65;text-align:center;margin-bottom:14px;padding:0 8px}
.ncl-modal-portrait{font-family:Georgia,serif;font-size:12px;font-style:italic;color:#3A2000;line-height:1.72;border-bottom:1px solid rgba(58,40,0,.09);padding-bottom:11px;margin-bottom:11px}
.ncl-modal-chips{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.ncl-modal-chip{border-radius:8px;padding:10px 12px}
.ncl-modal-chipq{font-size:8px;font-family:var(--mono);opacity:.5;margin-bottom:4px;text-transform:uppercase;letter-spacing:.3px;font-weight:600}
.ncl-modal-chipa{font-family:Georgia,serif;font-size:12.5px;font-style:italic;line-height:1.5}
.ncl-modal-actions{display:flex;gap:8px;margin-top:12px}
.ncl-modal-action{flex:1;padding:9px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .15s;text-align:center}
.ncl-modal-stamp{font-size:8.5px;color:rgba(58,40,0,.22);font-family:var(--mono);text-align:right;margin-top:10px;padding-top:6px;border-top:1px solid rgba(58,40,0,.06)}

/* confirm */
.ncl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadein .15s ease}
.ncl-confirm{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:slideup .2s cubic-bezier(.22,1,.36,1)}
.ncl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:8px}
.ncl-confirm p{font-size:13px;color:var(--cream-faint);line-height:1.6;margin-bottom:20px}
.ncl-confirm-btns{display:flex;gap:10px}
.ncl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.ncl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
`;

const ROTS = [-2.8, 1.6, -1.2, 2.4, -1.8, 0.8, -2.4, 1.0, -1.4, 2.0, -0.6, 2.8];

interface Props { userId: string; onBack: () => void; filterCharacterId?: string; }

export default function NightCardLibrary({ userId, onBack, filterCharacterId }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<any>({});
  const [viewMode, setViewMode] = useState<'cork' | 'timeline'>('cork');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SavedNightCard | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const shareCanvas = useRef<HTMLCanvasElement>(null);

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

  // Determine primary child name
  const childName = cards.length > 0 ? cards.find(c => !c.isOrigin)?.heroName || cards[0]?.heroName || 'your child' : 'your child';

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

  const shareCard = async (nc: SavedNightCard) => {
    const canvas = document.createElement('canvas');
    const W = 600, H = 800;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#F4EFE2';
    ctx.fillRect(0, 0, W, H);
    if (nc.photo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = nc.photo!; });
        const ph = 360;
        const scale = Math.max(W / img.width, ph / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        ctx.drawImage(img, (W - sw) / 2, 20 + (ph - sh) / 2, sw, sh);
      } catch {}
    }
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
    ctx.fillText(`${nc.heroName}  ·  ${formatDate(nc.date)}`, W / 2, H - 50);
    ctx.fillStyle = 'rgba(58,38,0,.2)';
    ctx.font = '10px monospace';
    ctx.fillText('SleepSeed', W / 2, H - 28);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `Night Card — ${nc.heroName}` }); } catch {}
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  // Group by month for timeline view
  const groupedByMonth: [string, SavedNightCard[]][] = [];
  let currentMonth = '';
  for (const nc of displayed) {
    const m = monthLabel(nc.date);
    if (m !== currentMonth) { currentMonth = m; groupedByMonth.push([m, []]); }
    groupedByMonth[groupedByMonth.length - 1][1].push(nc);
  }

  // Check for "new" cards (today)
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="ncl">
      <style>{CSS}</style>
      <canvas ref={shareCanvas} style={{ display: 'none' }} />

      <nav className="ncl-nav">
        <div className="ncl-nav-left">
          <button className="ncl-back" onClick={onBack}>←</button>
          <div className="ncl-title">Night <span>Cards</span></div>
        </div>
        <div className="ncl-nav-right">
          <button className="ncl-nav-btn" onClick={() => setShowSearch(!showSearch)}>🔍</button>
        </div>
      </nav>

      <div className="ncl-inner">
        {/* Opening Statement */}
        <div className="ncl-opening">
          <div className="ncl-opening-h">
            <em>{cards.length}</em> memories made with {childName} so far
          </div>
          <div className="ncl-opening-sub">Every story leaves a mark. These are yours.</div>
        </div>

        {/* Search (toggleable) */}
        {showSearch && (
          <input className="ncl-search" placeholder="Search cards, quotes, moments..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        )}

        {/* View Toggle */}
        {cards.length > 0 && (
          <div className="ncl-toggle">
            <button className={`ncl-toggle-btn${viewMode === 'cork' ? ' on' : ''}`} onClick={() => setViewMode('cork')}>📌 Corkboard</button>
            <button className={`ncl-toggle-btn${viewMode === 'timeline' ? ' on' : ''}`} onClick={() => setViewMode('timeline')}>📋 Timeline</button>
          </div>
        )}

        {filterCharacterId && (
          <div style={{ background: 'rgba(148,130,255,.06)', border: '.5px solid rgba(148,130,255,.18)', borderRadius: 10, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, color: 'rgba(148,130,255,.75)', fontFamily: 'monospace', letterSpacing: '.04em' }}>
              Showing cards for this character only
            </div>
            <button style={{ fontSize: 10, color: 'rgba(148,130,255,.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={onBack}>← all cards</button>
          </div>
        )}

        {displayed.length === 0 ? (
          <div className="ncl-empty">
            <div className="ncl-empty-moon" />
            <div className="ncl-empty-h">{search ? 'No cards match your search.' : 'No Night Cards yet.'}</div>
            {!search && (
              <div className="ncl-empty-sub">
                After each story, you'll capture the night — their words, the best moment of the day, a photo. They live here forever.
              </div>
            )}
          </div>
        ) : viewMode === 'cork' ? (
          /* ── CORKBOARD VIEW ── */
          <div className="ncl-cork">
            {displayed.map((nc, i) => {
              const rot = ROTS[i % ROTS.length];
              const isNew = nc.date.split('T')[0] === todayStr;
              return (
                <div key={nc.id} className="ncl-pol"
                  style={{
                    transform: nc.isOrigin ? 'rotate(-1deg)' : `rotate(${rot}deg)`,
                    boxShadow: nc.isOrigin
                      ? '0 8px 32px rgba(232,151,42,.25),0 4px 16px rgba(0,0,0,.6)'
                      : `0 ${4 + (i % 3) * 2}px ${18 + (i % 4) * 5}px rgba(0,0,0,.6)`
                  }}
                  onClick={() => setViewing(nc)}>
                  {/* Push pin */}
                  <div className={`ncl-pin ${nc.isOrigin ? 'gold' : 'red'}`} />
                  {isNew && !nc.isOrigin && <div className="ncl-new-dot" />}
                  {nc.isOrigin && <div className="ncl-origin-badge">where it began</div>}
                  <div className="ncl-pol-photo">
                    {nc.photo
                      ? <img className="ncl-pol-img" src={nc.photo} alt="" />
                      : <div className="ncl-pol-fallback" style={{ background: `linear-gradient(145deg,#1A1C2A,#201830)` }}>{nc.emoji || '🌙'}</div>}
                  </div>
                  <div className="ncl-pol-writing">
                    <div className="ncl-pol-name">{nc.headline || nc.heroName}</div>
                    <div className="ncl-pol-date">{formatDate(nc.date)}</div>
                  </div>
                  <button className="ncl-pol-del" onClick={e => { e.stopPropagation(); setConfirmDelete(nc); }}>✕</button>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TIMELINE VIEW ── */
          <div className="ncl-timeline">
            {groupedByMonth.map(([month, ncs]) => (
              <div key={month}>
                <div className="ncl-tl-month">{month}</div>
                {ncs.map(nc => (
                  <div key={nc.id} className={`ncl-tl-card${nc.isOrigin ? ' origin' : ''}`} onClick={() => setViewing(nc)}>
                    <div className="ncl-tl-photo" style={{ background: `linear-gradient(145deg,#1A1C2A,#201830)` }}>
                      {nc.photo
                        ? <img src={nc.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                        : <div className="ncl-tl-fallback">{nc.emoji || '🌙'}</div>}
                    </div>
                    <div className="ncl-tl-body">
                      {nc.isOrigin && <div className="ncl-tl-origin-badge">Origin ✦</div>}
                      <div className="ncl-tl-headline">{nc.headline || nc.storyTitle || nc.heroName}</div>
                      {nc.quote && <div className="ncl-tl-quote">"{nc.quote}"</div>}
                      <div className="ncl-tl-footer">
                        <div className="ncl-tl-date">{formatDateLong(nc.date)}</div>
                        <button className="ncl-tl-share" onClick={e => { e.stopPropagation(); shareCard(nc); }}>↗</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {viewing && (
        <div className="ncl-modal-bg" onClick={() => { setViewing(null); setEditing(false); }}>
          <div className="ncl-modal" onClick={e => e.stopPropagation()}>
            <button className="ncl-modal-close" onClick={() => { setViewing(null); setEditing(false); }}>✕</button>
            {viewing.photo && (
              <div className="ncl-modal-photo"><img src={viewing.photo} alt="" /></div>
            )}
            {viewing.headline && <div className="ncl-modal-headline">{viewing.headline}</div>}
            {viewing.quote && <div className="ncl-modal-quote">"{viewing.quote}"</div>}
            {viewing.memory_line && <div className="ncl-modal-portrait">{viewing.memory_line}</div>}
            <div className="ncl-modal-chips">
              {viewing.bondingAnswer && (
                <div className="ncl-modal-chip" style={{ background: 'rgba(180,120,20,.07)', border: '1px solid rgba(180,120,20,.14)' }}>
                  <div className="ncl-modal-chipq" style={{ color: '#7A5010' }}>{viewing.bondingQuestion || 'Bonding question'}</div>
                  <div className="ncl-modal-chipa" style={{ color: '#4A3000' }}>{viewing.bondingAnswer}</div>
                </div>
              )}
              {viewing.gratitude && (
                <div className="ncl-modal-chip" style={{ background: 'rgba(80,90,160,.06)', border: '1px solid rgba(80,90,160,.13)' }}>
                  <div className="ncl-modal-chipq" style={{ color: '#3A4080' }}>Best three seconds</div>
                  <div className="ncl-modal-chipa" style={{ color: '#2A3060' }}>{viewing.gratitude}</div>
                </div>
              )}
              {viewing.extra && (
                <div className="ncl-modal-chip" style={{ background: 'rgba(20,100,60,.06)', border: '1px solid rgba(20,100,60,.13)' }}>
                  <div className="ncl-modal-chipq" style={{ color: '#0A5030' }}>Also tonight</div>
                  <div className="ncl-modal-chipa" style={{ color: '#083820' }}>{viewing.extra}</div>
                </div>
              )}
            </div>
            {!editing ? (
              <div className="ncl-modal-actions">
                <button className="ncl-modal-action" onClick={() => shareCard(viewing)}
                  style={{ border: '1px solid rgba(80,90,160,.25)', background: 'rgba(80,90,160,.06)', color: 'rgba(80,90,160,.8)' }}>
                  Share
                </button>
                <button className="ncl-modal-action" onClick={() => { setEditing(true); setEditFields({ headline: viewing.headline || '', quote: viewing.quote || '', memory_line: viewing.memory_line || '', gratitude: viewing.gratitude || '', extra: viewing.extra || '' }); }}
                  style={{ border: '1px solid rgba(232,151,42,.25)', background: 'rgba(232,151,42,.06)', color: 'rgba(232,151,42,.8)' }}>
                  Edit
                </button>
                <button className="ncl-modal-action" onClick={() => setConfirmDelete(viewing)}
                  style={{ border: '1px solid rgba(200,80,80,.2)', background: 'rgba(200,80,80,.05)', color: 'rgba(255,140,130,.6)', flex: 'none', padding: '9px 14px' }}>
                  🗑
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ k: 'headline', l: 'Headline' }, { k: 'quote', l: 'Quote' }, { k: 'memory_line', l: 'Memory line' }, { k: 'gratitude', l: 'Best three seconds' }, { k: 'extra', l: 'Extra note' }].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: 8, color: 'rgba(58,40,0,.4)', fontFamily: 'monospace', marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '.5px' }}>{f.l}</div>
                    <textarea value={editFields[f.k] || ''} onChange={e => setEditFields({ ...editFields, [f.k]: e.target.value })}
                      style={{ width: '100%', background: 'rgba(58,40,0,.04)', border: '1px solid rgba(58,40,0,.12)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#3A2600', fontFamily: 'Georgia,serif', fontStyle: 'italic', resize: 'none' as const, minHeight: 40, lineHeight: 1.5, outline: 'none' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    const updated = { ...viewing, ...editFields };
                    await saveNightCard(updated);
                    const fetched = await getNightCards(userId);
                    setCards(fetched);
                    setViewing(updated);
                    setEditing(false);
                  }} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#E8972A', color: '#120800', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                    Save changes
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(58,40,0,.12)', background: 'transparent', color: 'rgba(58,40,0,.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="ncl-modal-stamp">SleepSeed · {viewing.heroName} · {formatDate(viewing.date)}{viewing.storyTitle ? ` · ${viewing.storyTitle}` : ''}</div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
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
    </div>
  );
}
