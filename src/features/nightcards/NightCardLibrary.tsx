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

function monthLabel(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  catch { return ''; }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--parch:#F8F1E4;--ink:#1A1420;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
.ncl{min-height:100vh;background:var(--night);font-family:var(--sans);color:#F4EFE8;-webkit-font-smoothing:antialiased}
.ncl-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:64px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(13,16,24,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.ncl-nav-left{display:flex;align-items:center;gap:14px}
.ncl-back{background:transparent;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s}
.ncl-back:hover{color:rgba(244,239,232,.75)}
.ncl-title{font-family:var(--serif);font-size:18px;font-weight:700;color:#F4EFE8}
.ncl-count{font-size:10px;color:rgba(244,239,232,.25);font-family:var(--mono);background:rgba(255,255,255,.04);padding:3px 9px;border-radius:50px;border:1px solid rgba(255,255,255,.06)}
.ncl-inner{max-width:920px;margin:0 auto;padding:36px 24px}

/* Toolbar */
.ncl-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.ncl-search{flex:1;min-width:180px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 14px;font-size:13px;color:#F4EFE8;outline:none;font-family:inherit;transition:border-color .2s}
.ncl-search:focus{border-color:rgba(232,151,42,.4)}
.ncl-search::placeholder{color:rgba(244,239,232,.2)}
.ncl-view-toggle{display:flex;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.1);flex-shrink:0}
.ncl-view-btn{padding:7px 14px;font-size:11px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:all .15s;color:rgba(244,239,232,.4);background:rgba(255,255,255,.03)}
.ncl-view-btn.on{color:var(--amber2);background:rgba(232,151,42,.1)}
.ncl-view-btn:hover:not(.on){color:rgba(244,239,232,.7);background:rgba(255,255,255,.06)}

.ncl-intro{font-size:13px;color:rgba(244,239,232,.38);font-weight:300;margin-bottom:24px;font-style:italic;line-height:1.6}
.ncl-empty{text-align:center;padding:80px 24px}
.ncl-empty-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 20px;opacity:.4}
.ncl-empty-h{font-family:var(--serif);font-size:22px;font-weight:700;color:#F4EFE8;margin-bottom:10px;font-style:italic}
.ncl-empty-sub{font-size:14px;color:rgba(244,239,232,.38);line-height:1.72;max-width:360px;margin:0 auto;font-weight:300}

/* CORKBOARD */
.ncl-cork{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:24px;padding:36px 28px;display:flex;flex-wrap:wrap;gap:20px;justify-content:flex-start;min-height:300px}
@media(max-width:600px){.ncl-cork{padding:20px 14px;gap:12px;justify-content:center}}

/* POLAROID */
.ncl-pol{background:#F4EFE2;border-radius:3px;padding:10px 10px 28px;cursor:pointer;transition:transform .22s,box-shadow .22s,z-index 0s;position:relative;flex-shrink:0}
.ncl-pol:hover{box-shadow:0 20px 56px rgba(0,0,0,.8)!important;z-index:5;transform:rotate(0deg) scale(1.04) translateY(-6px) !important}
.ncl-pol-photo{border-radius:2px;overflow:hidden;margin-bottom:0}
.ncl-pol-img{width:100%;height:100%;object-fit:cover;display:block}
.ncl-pol-fallback{width:100%;height:100%;background:linear-gradient(145deg,#1A1C2A,#201830);display:flex;align-items:center;justify-content:center;font-size:36px}
.ncl-pol-writing{padding:8px 4px 0;text-align:center}
.ncl-pol-name{font-family:Georgia,serif;font-size:11.5px;color:#3A2600;font-style:italic;line-height:1.4;font-weight:700}
.ncl-pol-date{font-family:var(--mono);font-size:8px;color:rgba(58,40,0,.35);margin-top:2px}
.ncl-pol-story{font-family:var(--mono);font-size:7px;color:rgba(58,40,0,.28);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ncl-pol-snip{font-family:Georgia,serif;font-size:10.5px;color:rgba(58,40,0,.65);font-style:italic;margin-top:4px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ncl-origin-badge{position:absolute;top:6px;left:6px;background:rgba(232,151,42,.92);border-radius:4px;padding:2px 6px;font-size:6.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#120800;font-family:var(--sans);z-index:2}
.ncl-pol-del{position:absolute;top:6px;right:6px;background:rgba(180,50,50,.8);border:none;border-radius:50%;width:22px;height:22px;font-size:10px;color:white;cursor:pointer;display:none;align-items:center;justify-content:center;font-family:var(--sans);transition:opacity .15s;z-index:2}
.ncl-pol:hover .ncl-pol-del{display:flex}

/* TIMELINE VIEW */
.ncl-timeline{display:flex;flex-direction:column;gap:0}
.ncl-tl-month{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--amber);font-family:var(--mono);margin:20px 0 10px 4px;font-weight:600}
.ncl-tl-month:first-child{margin-top:0}
.ncl-tl-card{display:flex;gap:16px;padding:16px;border-radius:16px;cursor:pointer;transition:all .18s;border:1px solid transparent;margin-bottom:8px}
.ncl-tl-card:hover{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.07)}
.ncl-tl-photo{width:72px;height:72px;border-radius:4px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,.04)}
.ncl-tl-photo img{width:100%;height:100%;object-fit:cover}
.ncl-tl-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;background:linear-gradient(145deg,#1A1C2A,#201830)}
.ncl-tl-body{flex:1;min-width:0}
.ncl-tl-name{font-family:var(--serif);font-size:14px;font-weight:700;color:#F4EFE8;margin-bottom:2px}
.ncl-tl-meta{font-size:9px;color:rgba(244,239,232,.3);font-family:var(--mono);margin-bottom:6px;display:flex;gap:6px}
.ncl-tl-quote{font-family:Georgia,serif;font-size:12px;font-style:italic;color:rgba(244,239,232,.5);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ncl-tl-del{flex-shrink:0;align-self:flex-start;background:none;border:none;color:rgba(244,239,232,.15);font-size:14px;cursor:pointer;padding:4px;transition:color .15s}
.ncl-tl-del:hover{color:rgba(255,140,130,.7)}

/* DETAIL MODAL */
.ncl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(10px);animation:fadein .2s ease}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.ncl-modal{background:#F4EFE2;border-radius:6px;padding:16px 16px 32px;width:100%;max-width:420px;box-shadow:0 40px 100px rgba(0,0,0,.9);position:relative;animation:slideup .3s cubic-bezier(.22,1,.36,1);max-height:90vh;overflow-y:auto}
@keyframes slideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
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

/* confirm modal */
.ncl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadein .15s ease}
.ncl-confirm{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:slideup .2s cubic-bezier(.22,1,.36,1)}
.ncl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;color:#F4EFE8;margin-bottom:8px}
.ncl-confirm p{font-size:13px;color:rgba(244,239,232,.4);line-height:1.6;margin-bottom:20px}
.ncl-confirm-btns{display:flex;gap:10px}
.ncl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.ncl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
`;

const ROTS = [-2.8, 1.6, -1.2, 2.4, -1.8, 0.8, -2.4, 1.0, -1.4, 2.0, -0.6, 2.8];
const SIZES = [190, 178, 185, 180, 192, 175, 195, 182];

interface Props { userId: string; onBack: () => void; filterCharacterId?: string; }

export default function NightCardLibrary({ userId, onBack, filterCharacterId }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<any>({});
  const [viewMode, setViewMode] = useState<'cork' | 'timeline'>('cork');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SavedNightCard | null>(null);
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
    // Generate a shareable image
    const canvas = document.createElement('canvas');
    const W = 600, H = 800;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#F4EFE2';
    ctx.fillRect(0, 0, W, H);

    // Photo area
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

    // Quote
    ctx.fillStyle = '#2A1600';
    ctx.font = 'italic 20px Georgia, serif';
    const words = (nc.quote || '').split(' ');
    let line = '', lineY = textY;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > W - 80 && line) {
        ctx.fillText(`"${line.trim()}"`, W / 2, lineY);
        line = w + ' '; lineY += 28;
      } else { line = test; }
    }
    if (line.trim()) ctx.fillText(line === words.join(' ') + ' ' ? `"${line.trim()}"` : line.trim(), W / 2, lineY);

    // Name + date
    ctx.fillStyle = 'rgba(58,38,0,.4)';
    ctx.font = '600 11px sans-serif';
    ctx.fillText(`${nc.heroName}  ·  ${formatDate(nc.date)}`, W / 2, H - 50);

    // Brand
    ctx.fillStyle = 'rgba(58,38,0,.2)';
    ctx.font = '10px monospace';
    ctx.fillText('SleepSeed', W / 2, H - 28);

    // Share or download
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `Night Card — ${nc.heroName}` }); } catch {}
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name; a.click();
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

  return (
    <div className="ncl">
      <style>{CSS}</style>
      <canvas ref={shareCanvas} style={{display:'none'}} />
      <nav className="ncl-nav">
        <div className="ncl-nav-left">
          <button className="ncl-back" onClick={onBack}>← Back</button>
          <div className="ncl-title">Night Cards</div>
          <span className="ncl-count">{cards.length}</span>
        </div>
      </nav>
      <div className="ncl-inner">
        {filterCharacterId && (
          <div style={{background:'rgba(160,120,255,.06)',border:'.5px solid rgba(160,120,255,.18)',borderRadius:10,padding:'8px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:10,color:'rgba(160,120,255,.75)',fontFamily:'monospace',letterSpacing:'.04em'}}>
              Showing cards for this character only
            </div>
            <button style={{fontSize:10,color:'rgba(160,120,255,.5)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}} onClick={onBack}>← all cards</button>
          </div>
        )}

        {/* Toolbar */}
        {cards.length > 0 && (
          <div className="ncl-toolbar">
            <input className="ncl-search" placeholder="Search cards, quotes, moments..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="ncl-view-toggle">
              <button className={`ncl-view-btn${viewMode === 'cork' ? ' on' : ''}`} onClick={() => setViewMode('cork')}>Corkboard</button>
              <button className={`ncl-view-btn${viewMode === 'timeline' ? ' on' : ''}`} onClick={() => setViewMode('timeline')}>Timeline</button>
            </div>
          </div>
        )}

        {displayed.length > 0 && !search && (
          <div className="ncl-intro">
            {filterCharacterId
              ? `${displayed.length} night ${displayed.length === 1 ? 'card' : 'cards'} for this character`
              : 'Every story creates a Night Card — a keepsake of what your child said, felt, and was on that specific night.'}
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
              const sz = SIZES[i % SIZES.length];
              const rot = ROTS[i % ROTS.length];
              const snippet = nc.quote || nc.gratitude || nc.bondingAnswer || '';
              return (
                <div key={nc.id} className="ncl-pol"
                  style={{ width: sz, transform: nc.isOrigin ? 'rotate(-1deg)' : `rotate(${rot}deg)`, boxShadow: nc.isOrigin ? '0 8px 32px rgba(232,151,42,.25),0 4px 16px rgba(0,0,0,.6)' : `0 ${4 + (i % 3) * 2}px ${18 + (i % 4) * 5}px rgba(0,0,0,.6)` }}
                  onClick={() => setViewing(nc)}>
                  {nc.isOrigin && <div className="ncl-origin-badge">where it began</div>}
                  <div className="ncl-pol-photo" style={{ width: '100%', height: sz - 20, aspectRatio: '1' }}>
                    {nc.photo
                      ? <img className="ncl-pol-img" src={nc.photo} alt="" />
                      : <div className="ncl-pol-fallback">{nc.emoji || '🌙'}</div>}
                  </div>
                  <div className="ncl-pol-writing">
                    <div className="ncl-pol-name">{nc.heroName}</div>
                    <div className="ncl-pol-date">{formatDate(nc.date)}</div>
                    {nc.storyTitle && <div className="ncl-pol-story">{nc.storyTitle}</div>}
                    {snippet && <div className="ncl-pol-snip">"{snippet.slice(0, 55)}{snippet.length > 55 ? '...' : ''}"</div>}
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
                  <div key={nc.id} className="ncl-tl-card" onClick={() => setViewing(nc)}>
                    <div className="ncl-tl-photo">
                      {nc.photo
                        ? <img src={nc.photo} alt="" />
                        : <div className="ncl-tl-fallback">{nc.emoji || '🌙'}</div>}
                    </div>
                    <div className="ncl-tl-body">
                      <div className="ncl-tl-name">{nc.heroName}</div>
                      <div className="ncl-tl-meta">
                        <span>{formatDate(nc.date)}</span>
                        {nc.storyTitle && <><span style={{opacity:.4}}>·</span><span>{nc.storyTitle}</span></>}
                      </div>
                      {nc.quote && <div className="ncl-tl-quote">"{nc.quote}"</div>}
                    </div>
                    <button className="ncl-tl-del" onClick={e => { e.stopPropagation(); setConfirmDelete(nc); }}>✕</button>
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
                  style={{border:'1px solid rgba(80,90,160,.25)',background:'rgba(80,90,160,.06)',color:'rgba(80,90,160,.8)'}}>
                  Share
                </button>
                <button className="ncl-modal-action" onClick={() => { setEditing(true); setEditFields({ headline: viewing.headline || '', quote: viewing.quote || '', memory_line: viewing.memory_line || '', gratitude: viewing.gratitude || '', extra: viewing.extra || '' }); }}
                  style={{border:'1px solid rgba(232,151,42,.25)',background:'rgba(232,151,42,.06)',color:'rgba(232,151,42,.8)'}}>
                  Edit
                </button>
                <button className="ncl-modal-action" onClick={() => setConfirmDelete(viewing)}
                  style={{border:'1px solid rgba(200,80,80,.2)',background:'rgba(200,80,80,.05)',color:'rgba(255,140,130,.6)',flex:'none',padding:'9px 14px'}}>
                  🗑
                </button>
              </div>
            ) : (
              <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
                {[{k:'headline',l:'Headline'},{k:'quote',l:'Quote'},{k:'memory_line',l:'Memory line'},{k:'gratitude',l:'Best three seconds'},{k:'extra',l:'Extra note'}].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:8,color:'rgba(58,40,0,.4)',fontFamily:'monospace',marginBottom:3,textTransform:'uppercase',letterSpacing:'.5px'}}>{f.l}</div>
                    <textarea value={editFields[f.k]||''} onChange={e=>setEditFields({...editFields,[f.k]:e.target.value})}
                      style={{width:'100%',background:'rgba(58,40,0,.04)',border:'1px solid rgba(58,40,0,.12)',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#3A2600',fontFamily:'Georgia,serif',fontStyle:'italic',resize:'none',minHeight:40,lineHeight:1.5,outline:'none'}} />
                  </div>
                ))}
                <div style={{display:'flex',gap:8}}>
                  <button onClick={async () => {
                    const updated = {...viewing,...editFields};
                    await saveNightCard(updated);
                    const fetched = await getNightCards(userId);
                    setCards(fetched);
                    setViewing(updated);
                    setEditing(false);
                  }} style={{flex:1,padding:'10px',borderRadius:8,background:'#E8972A',color:'#120800',fontSize:12,fontWeight:700,cursor:'pointer',border:'none',fontFamily:'inherit'}}>
                    Save changes
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{padding:'10px 14px',borderRadius:8,border:'1px solid rgba(58,40,0,.12)',background:'transparent',color:'rgba(58,40,0,.5)',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="ncl-modal-stamp">SleepSeed · {viewing.heroName} · {formatDate(viewing.date)}{viewing.storyTitle ? ` · ${viewing.storyTitle}` : ''}</div>
          </div>
        </div>
      )}

      {/* Custom delete confirmation */}
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
