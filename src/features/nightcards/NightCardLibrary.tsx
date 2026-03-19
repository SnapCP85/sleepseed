import { useState, useEffect } from 'react';
import { getNightCards, deleteNightCard } from '../../lib/storage';
import type { SavedNightCard } from '../../lib/types';

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
.ncl-intro{font-size:13px;color:rgba(244,239,232,.38);font-weight:300;margin-bottom:28px;font-style:italic;line-height:1.6}
.ncl-empty{text-align:center;padding:80px 24px}
.ncl-empty-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 20px;opacity:.4}
.ncl-empty-h{font-family:var(--serif);font-size:22px;font-weight:700;color:#F4EFE8;margin-bottom:10px;font-style:italic}
.ncl-empty-sub{font-size:14px;color:rgba(244,239,232,.38);line-height:1.72;max-width:360px;margin:0 auto;font-weight:300}

/* CORKBOARD */
.ncl-cork{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:24px;padding:36px 28px;display:flex;flex-wrap:wrap;gap:16px;justify-content:flex-start;min-height:300px}

/* POLAROID */
.ncl-pol{background:#F4EFE2;border-radius:3px;padding:10px 10px 30px;cursor:pointer;transition:transform .22s,box-shadow .22s,z-index 0s;position:relative;flex-shrink:0}
.ncl-pol:hover{box-shadow:0 20px 56px rgba(0,0,0,.8)!important;z-index:5;transform:rotate(0deg) scale(1.04) translateY(-6px) !important}
.ncl-pol-photo{border-radius:2px;overflow:hidden;margin-bottom:0}
.ncl-pol-img{width:100%;height:100%;object-fit:cover;display:block}
.ncl-pol-fallback{width:100%;height:100%;background:linear-gradient(145deg,#1A1C2A,#201830);display:flex;align-items:center;justify-content:center;font-size:32px}
.ncl-pol-writing{padding:8px 4px 0;text-align:center}
.ncl-pol-name{font-family:Georgia,serif;font-size:11px;color:#3A2600;font-style:italic;line-height:1.4;font-weight:700}
.ncl-pol-date{font-family:var(--mono);font-size:7.5px;color:rgba(58,40,0,.38);margin-top:2px}
.ncl-pol-snip{font-family:Georgia,serif;font-size:8.5px;color:rgba(58,40,0,.5);font-style:italic;margin-top:3px;line-height:1.4}
.ncl-pol-del{position:absolute;top:6px;right:6px;background:rgba(180,50,50,.8);border:none;border-radius:50%;width:20px;height:20px;font-size:9px;color:white;cursor:pointer;display:none;align-items:center;justify-content:center;font-family:var(--sans);transition:opacity .15s;z-index:2}
.ncl-pol:hover .ncl-pol-del{display:flex}

/* DETAIL MODAL */
.ncl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(10px);animation:fadein .2s ease}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.ncl-modal{background:#F4EFE2;border-radius:6px;padding:16px 16px 36px;width:100%;max-width:320px;box-shadow:0 40px 100px rgba(0,0,0,.9);position:relative;animation:slideup .3s cubic-bezier(.22,1,.36,1)}
@keyframes slideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.ncl-modal-close{position:absolute;top:10px;right:10px;background:rgba(58,40,0,.1);border:none;border-radius:50%;width:28px;height:28px;font-size:12px;color:#3A2800;cursor:pointer;font-family:var(--sans);transition:background .15s}
.ncl-modal-close:hover{background:rgba(58,40,0,.18)}
.ncl-modal-photo{width:100%;border-radius:3px;overflow:hidden;margin-bottom:14px}
.ncl-modal-photo img{width:100%;display:block}
.ncl-modal-portrait{font-family:Georgia,serif;font-size:11px;font-style:italic;color:#3A2000;line-height:1.72;border-bottom:1px solid rgba(58,40,0,.09);padding-bottom:11px;margin-bottom:11px}
.ncl-modal-chips{display:flex;flex-direction:column;gap:7px;margin-bottom:11px}
.ncl-modal-chip{border-radius:5px;padding:7px 9px}
.ncl-modal-chipq{font-size:7.5px;font-family:var(--mono);opacity:.5;margin-bottom:3px;text-transform:uppercase;letter-spacing:.3px;font-weight:600}
.ncl-modal-chipa{font-family:Georgia,serif;font-size:11px;font-style:italic;line-height:1.45}
.ncl-modal-stamp{font-size:8px;color:rgba(58,40,0,.2);font-family:var(--mono);text-align:right;margin-top:7px;padding-top:5px;border-top:1px solid rgba(58,40,0,.06)}
`;

const ROTS = [-3.2, 1.8, -1.5, 2.8, -2.1, 1.2, -2.8, 0.9, -1.8, 2.4, -0.8, 3.1];
const SIZES = [150, 138, 145, 142, 148, 135, 152, 140];

interface Props { userId: string; onBack: () => void; }

export default function NightCardLibrary({ userId, onBack }: Props) {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  useEffect(() => { setCards(getNightCards(userId)); }, [userId]);
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Remove this Night Card?')) return;
    deleteNightCard(userId, id);
    setCards(getNightCards(userId));
    if (viewing?.id === id) setViewing(null);
  };

  return (
    <div className="ncl">
      <style>{CSS}</style>
      <nav className="ncl-nav">
        <div className="ncl-nav-left">
          <button className="ncl-back" onClick={onBack}>← Back</button>
          <div className="ncl-title">Night Cards</div>
          <span className="ncl-count">{cards.length}</span>
        </div>
      </nav>
      <div className="ncl-inner">
        {cards.length > 0 && (
          <div className="ncl-intro">
            Every story creates a Night Card — a keepsake of what your child said, felt, and was on that specific night.
          </div>
        )}
        {cards.length === 0 ? (
          <div className="ncl-empty">
            <div className="ncl-empty-moon" />
            <div className="ncl-empty-h">No Night Cards yet.</div>
            <div className="ncl-empty-sub">
              After each story, you'll capture the night — their words, the best moment of the day, a photo. They live here forever.
            </div>
          </div>
        ) : (
          <div className="ncl-cork">
            {cards.map((nc, i) => {
              const sz = SIZES[i % SIZES.length];
              const rot = ROTS[i % ROTS.length];
              return (
                <div key={nc.id} className="ncl-pol"
                  style={{ width: sz, transform: `rotate(${rot}deg)`, boxShadow: `0 ${4 + (i % 3) * 2}px ${18 + (i % 4) * 5}px rgba(0,0,0,.6)` }}
                  onClick={() => setViewing(nc)}>
                  <div className="ncl-pol-photo" style={{ width: '100%', height: sz - 20, aspectRatio: '1' }}>
                    {nc.photo
                      ? <img className="ncl-pol-img" src={nc.photo} alt="" />
                      : <div className="ncl-pol-fallback">{nc.emoji || '🌙'}</div>}
                  </div>
                  <div className="ncl-pol-writing">
                    <div className="ncl-pol-name">{nc.heroName}</div>
                    <div className="ncl-pol-date">{nc.date}</div>
                    {nc.gratitude && <div className="ncl-pol-snip">"{nc.gratitude.slice(0, 36)}{nc.gratitude.length > 36 ? '…' : ''}"</div>}
                  </div>
                  <button className="ncl-pol-del" onClick={e => handleDelete(e, nc.id)}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewing && (
        <div className="ncl-modal-bg" onClick={() => setViewing(null)}>
          <div className="ncl-modal" onClick={e => e.stopPropagation()}>
            <button className="ncl-modal-close" onClick={() => setViewing(null)}>✕</button>
            {viewing.photo && (
              <div className="ncl-modal-photo"><img src={viewing.photo} alt="" style={{ borderRadius: 3 }} /></div>
            )}
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
            <div className="ncl-modal-stamp">🌙 SleepSeed · {viewing.heroName} · {viewing.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}
