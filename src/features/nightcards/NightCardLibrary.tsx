import { useState, useEffect } from 'react';
import { getNightCards, deleteNightCard, saveNightCard } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import type { SavedNightCard } from '../../lib/types';
import { getCardVariant } from '../../lib/types';
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--night-card:#0f1525;--night-raised:#141a2e;--amber:#F5B84C;--amber-deep:#E8972A;--cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);--teal:#14d890;--purple:#9482ff;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
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
.ncl-opening{padding:16px 0 14px;animation:fadeUp .4s ease}
.ncl-opening-h{font-family:var(--serif);font-size:22px;font-weight:400;color:var(--cream);line-height:1.2}
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
.ncl-cork{margin:0 -6px;background:#1a1208;border:1px solid rgba(245,184,76,.1);border-radius:20px;padding:20px 10px 24px;position:relative;overflow:hidden}
.ncl-cork-texture{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(45deg,rgba(245,184,76,.015) 0px,transparent 2px,transparent 8px,rgba(245,184,76,.015) 10px)}
.ncl-cork-grid{display:flex;flex-wrap:wrap;justify-content:space-around;padding:8px 4px;position:relative;z-index:1}
.ncl-cork-card{margin:8px;position:relative;width:130px}
.ncl-cork-pin{position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4);z-index:3}
.ncl-cork-new{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:var(--teal);box-shadow:0 0 8px rgba(20,216,144,.6);z-index:4}
.ncl-cork-footer{font-family:var(--serif);font-size:12px;color:rgba(245,184,76,.5);text-align:center;margin-top:12px;position:relative;z-index:1}

/* ── TIMELINE ── */
.ncl-timeline{display:flex;flex-direction:column;gap:0;padding:0}
.ncl-tl-month{font-family:var(--mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--amber);margin:20px 0 10px 4px;font-weight:600}
.ncl-tl-month:first-child{margin-top:0}
.ncl-tl-card{display:flex;gap:14px;padding:14px;background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:18px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.ncl-tl-card:hover{transform:translateX(3px);border-color:rgba(244,239,232,.14)}
.ncl-tl-card.origin{border-color:rgba(245,184,76,.2)}
.ncl-tl-photo{width:80px;min-height:88px;border-radius:10px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.ncl-tl-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;border-radius:10px}
.ncl-tl-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.ncl-tl-origin-badge{display:inline-block;font-family:var(--mono);font-size:8px;color:var(--amber);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;background:rgba(245,184,76,.08);padding:2px 7px;border-radius:6px;width:fit-content}
.ncl-tl-headline{font-family:var(--serif);font-size:14px;font-weight:500;color:var(--cream);line-height:1.3;margin-bottom:4px}
.ncl-tl-quote{font-family:var(--serif);font-size:11px;font-weight:300;font-style:italic;color:var(--cream-dim);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px}
.ncl-tl-footer{display:flex;align-items:center;justify-content:space-between}
.ncl-tl-date{font-family:var(--mono);font-size:9px;color:var(--cream-faint)}
.ncl-tl-share{font-size:14px;cursor:pointer;opacity:.4;transition:opacity .15s;background:none;border:none;color:var(--cream)}
.ncl-tl-share:hover{opacity:.8}

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
.ncl-edit-field-label{font-size:8px;color:rgba(58,40,0,.4);font-family:var(--mono);margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
.ncl-edit-field textarea{width:100%;background:rgba(58,40,0,.04);border:1px solid rgba(58,40,0,.12);border-radius:6px;padding:8px 10px;font-size:12px;color:#3A2600;font-family:Georgia,serif;font-style:italic;resize:none;min-height:40px;line-height:1.5;outline:none}

/* confirm */
.ncl-confirm-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadein .15s ease}
.ncl-confirm{background:rgba(13,16,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);animation:slideup .2s cubic-bezier(.22,1,.36,1)}
.ncl-confirm h3{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:8px}
.ncl-confirm p{font-size:13px;color:var(--cream-faint);line-height:1.6;margin-bottom:20px}
.ncl-confirm-btns{display:flex;gap:10px}
.ncl-confirm-cancel{flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(244,239,232,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.ncl-confirm-del{flex:1;padding:12px;border-radius:12px;border:none;background:rgba(200,70,60,.85);color:white;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
`;

const ROTS = [-2.8, 1.5, -1, 2.2, -3, 0.8];
const OFFSETS = [0, 4, -2, 6, 2, -4];

interface Props { userId: string; onBack: () => void; filterCharacterId?: string; }

export default function NightCardLibrary({ userId, onBack, filterCharacterId }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<any>({});
  const [viewMode, setViewMode] = useState<'cork' | 'timeline'>('cork');
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
    ctx.fillText(`${nc.heroName}  \u00B7  ${formatDate(nc.date)}`, W / 2, H - 50);
    ctx.fillStyle = 'rgba(58,38,0,.2)';
    ctx.font = '10px monospace';
    ctx.fillText('SleepSeed', W / 2, H - 28);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `Night Card \u2014 ${nc.heroName}` }); } catch {}
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

  const todayStr = new Date().toISOString().split('T')[0];

  const openDetail = (nc: SavedNightCard) => { setViewing(nc); setIsFlipped(false); setEditing(false); };

  const shareToGrandparent = async (nc: SavedNightCard) => {
    try {
      const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await supabase.from('night_card_shares').upsert({
        card_id: nc.id, share_token: token, created_at: new Date().toISOString(),
      });
      const url = `${window.location.origin}${window.location.pathname}?nc=${token}`;
      if (navigator.share) {
        try { await navigator.share({ title: `${nc.heroName}'s Night Card`, url }); } catch {}
      } else {
        await navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
      }
    } catch (e) { console.error('Share to grandparent failed:', e); alert('Could not create share link.'); }
  };

  const openPrintView = (nc: SavedNightCard) => {
    window.open(`${window.location.pathname}?printCard=${nc.id}&uid=${userId}`, '_blank');
  };

  return (
    <div className="ncl">
      <style>{CSS}</style>

      <nav className="ncl-nav">
        <div className="ncl-nav-left">
          <button className="ncl-back" onClick={onBack}>{'\u2190'}</button>
          <div className="ncl-title">Night <span>Cards</span></div>
        </div>
        <div className="ncl-nav-right">
          <button className="ncl-nav-btn" onClick={() => setShowSearch(!showSearch)}>{'\uD83D\uDD0D'}</button>
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

        {showSearch && (
          <input className="ncl-search" placeholder="Search cards, quotes, moments..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        )}

        {cards.length > 0 && (
          <div className="ncl-toggle">
            <button className={`ncl-toggle-btn${viewMode === 'cork' ? ' on' : ''}`} onClick={() => setViewMode('cork')}>{'\uD83D\uDCCC'} Corkboard</button>
            <button className={`ncl-toggle-btn${viewMode === 'timeline' ? ' on' : ''}`} onClick={() => setViewMode('timeline')}>{'\uD83D\uDCCB'} Timeline</button>
          </div>
        )}

        {filterCharacterId && (
          <div style={{ background: 'rgba(148,130,255,.06)', border: '.5px solid rgba(148,130,255,.18)', borderRadius: 10, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, color: 'rgba(148,130,255,.75)', fontFamily: 'monospace', letterSpacing: '.04em' }}>
              Showing cards for this character only
            </div>
            <button style={{ fontSize: 10, color: 'rgba(148,130,255,.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={onBack}>{'\u2190'} all cards</button>
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
            <div className="ncl-cork-texture" />
            <div className="ncl-cork-grid">
              {displayed.map((nc, i) => {
                const variant = getCardVariant(nc);
                const rot = ROTS[i % ROTS.length];
                const offsetY = OFFSETS[i % OFFSETS.length];
                const isNew = nc.date.split('T')[0] === todayStr;
                return (
                  <div key={nc.id} className="ncl-cork-card" style={{
                    transform: `rotate(${rot}deg) translateY(${offsetY}px)`,
                  }}>
                    <div className="ncl-cork-pin" style={{ background: getPinStyle(variant) }} />
                    {isNew && <div className="ncl-cork-new" />}
                    <NightCard card={nc} size="mini" onTap={() => openDetail(nc)} />
                  </div>
                );
              })}
            </div>
            <div className="ncl-cork-footer">tap any card to open</div>
          </div>
        ) : (
          /* ── TIMELINE VIEW ── */
          <div className="ncl-timeline">
            {groupedByMonth.map(([month, ncs]) => (
              <div key={month}>
                <div className="ncl-tl-month">{month}</div>
                {ncs.map(nc => {
                  const variant = getCardVariant(nc);
                  const skyGradient = variant === 'standard' ? 'linear-gradient(145deg,#0d1428,#1a1040)'
                    : variant === 'origin' ? 'linear-gradient(145deg,#150e05,#2a1808)'
                    : variant === 'journey' ? 'linear-gradient(145deg,#051510,#0a2a1a)'
                    : variant === 'occasion' ? 'linear-gradient(145deg,#1a0520,#2a0a3a)'
                    : 'linear-gradient(145deg,#180808,#2a1005)';
                  return (
                    <div key={nc.id} className={`ncl-tl-card${nc.isOrigin ? ' origin' : ''}`} onClick={() => openDetail(nc)}>
                      <div className="ncl-tl-photo" style={{ background: skyGradient }}>
                        {nc.photo
                          ? <img src={nc.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                          : <div className="ncl-tl-fallback">{nc.creatureEmoji || nc.emoji || '\uD83C\uDF19'}</div>}
                      </div>
                      <div className="ncl-tl-body">
                        {nc.isOrigin && <div className="ncl-tl-origin-badge">Origin {'\u2726'}</div>}
                        <div className="ncl-tl-headline">{nc.headline || nc.storyTitle || nc.heroName}</div>
                        {nc.quote && <div className="ncl-tl-quote">{'\u201C'}{nc.quote}{'\u201D'}</div>}
                        <div className="ncl-tl-footer">
                          <div className="ncl-tl-date">{formatDateLong(nc.date)}</div>
                          <button className="ncl-tl-share" onClick={e => { e.stopPropagation(); shareCard(nc); }}>{'\u2197'}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {viewing && !editing && (
        <div className="ncl-modal-bg" onClick={() => { setViewing(null); setIsFlipped(false); }}>
          <div onClick={e => e.stopPropagation()}>
            <NightCard
              card={viewing}
              size="full"
              flipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
            />
          </div>
          <div className="ncl-modal-actions" onClick={e => e.stopPropagation()}>
            <button className="ncl-modal-action" onClick={() => shareCard(viewing)}>
              {'\uD83D\uDCE4'} Share
            </button>
            <button className="ncl-modal-action" onClick={() => openPrintView(viewing)}>
              {'\uD83D\uDDA8\uFE0F'} Print 5{'\u00D7'}7
            </button>
            <button className="ncl-modal-action" onClick={() => shareToGrandparent(viewing)}>
              {'\uD83C\uDF81'} Send to Grandparent
            </button>
            <button className="ncl-modal-action" onClick={() => {
              setEditing(true);
              setEditFields({
                headline: viewing.headline || '',
                quote: viewing.quote || '',
                memory_line: viewing.memory_line || '',
                gratitude: viewing.gratitude || '',
                extra: viewing.extra || '',
              });
            }}>
              {'\u270F\uFE0F'} Edit
            </button>
            <button className="ncl-modal-action danger" onClick={() => setConfirmDelete(viewing)}>
              {'\uD83D\uDDD1'}
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && viewing && (
        <div className="ncl-edit-bg" onClick={() => setEditing(false)}>
          <div className="ncl-edit" onClick={e => e.stopPropagation()}>
            {[{ k: 'headline', l: 'Headline' }, { k: 'quote', l: 'Quote' }, { k: 'memory_line', l: 'Memory line' }, { k: 'gratitude', l: 'Best three seconds' }, { k: 'extra', l: 'Extra note' }].map(f => (
              <div key={f.k} style={{ marginBottom: 8 }}>
                <div className="ncl-edit-field-label">{f.l}</div>
                <textarea className="ncl-edit-field" value={editFields[f.k] || ''} onChange={e => setEditFields({ ...editFields, [f.k]: e.target.value })}
                  style={{ width: '100%', background: 'rgba(58,40,0,.04)', border: '1px solid rgba(58,40,0,.12)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#3A2600', fontFamily: 'Georgia,serif', fontStyle: 'italic', resize: 'none', minHeight: 40, lineHeight: 1.5, outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={async () => {
                const updated = { ...viewing, ...editFields };
                await saveNightCard(updated);
                const fetched = await getNightCards(userId);
                setCards(fetched);
                setViewing(updated);
                setEditing(false);
              }} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#E8972A', color: '#120800', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                Save changes
              </button>
              <button onClick={() => setEditing(false)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(58,40,0,.12)', background: 'transparent', color: 'rgba(58,40,0,.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
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
