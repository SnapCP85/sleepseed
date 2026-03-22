import { useState, useEffect } from 'react';
import { getNightCards, deleteNightCard } from '../../lib/storage';
import type { SavedNightCard } from '../../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Kalam:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.ncl-wrap{min-height:100vh;background:#0B0B1A;font-family:'DM Sans',sans-serif;color:#F0EDE8}
.ncl-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(11,11,26,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px)}
.ncl-nav-left{display:flex;align-items:center;gap:12px}
.ncl-back{background:transparent;border:none;color:rgba(240,237,232,.4);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:color .2s}
.ncl-back:hover{color:rgba(240,237,232,.75)}
.ncl-title{font-family:'Lora',serif;font-size:18px;font-weight:700;color:#F0EDE8}
.ncl-count{font-size:11px;color:rgba(240,237,232,.28);font-family:'DM Mono',monospace;background:rgba(255,255,255,.04);padding:3px 10px;border-radius:50px}
.ncl-inner{max-width:860px;margin:0 auto;padding:28px 24px}
.ncl-empty{text-align:center;padding:80px 24px}
.ncl-empty-icon{font-size:52px;margin-bottom:16px;opacity:.4}
.ncl-empty-h{font-family:'Lora',serif;font-size:22px;font-weight:700;color:#F0EDE8;margin-bottom:8px}
.ncl-empty-sub{font-size:14px;color:rgba(240,237,232,.38);line-height:1.7;max-width:320px;margin:0 auto;font-weight:300}
.ncl-cork{display:flex;flex-wrap:wrap;gap:12px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.04);border-radius:20px;padding:28px 24px;justify-content:flex-start}

/* Polaroid card */
.ncl-pol{background:#F4EFE2;border-radius:4px;padding:10px 10px 28px;cursor:pointer;transition:transform .22s,box-shadow .22s;position:relative}
.ncl-pol:hover{box-shadow:0 16px 48px rgba(0,0,0,.7)!important;z-index:2}
.ncl-pol-photo{width:100%;aspect-ratio:1;border-radius:2px;overflow:hidden;margin-bottom:0}
.ncl-pol-img{width:100%;height:100%;object-fit:cover;display:block}
.ncl-pol-fallback{width:100%;aspect-ratio:1;background:linear-gradient(160deg,#1A1C2E,#22203A);display:flex;align-items:center;justify-content:center;font-size:36px;border-radius:2px}
.ncl-pol-writing{padding:8px 4px 0;display:flex;flex-direction:column;gap:2px}
.ncl-pol-name{font-family:'Kalam',cursive;font-size:11px;color:#3A2800;line-height:1.4;text-align:center;font-weight:700}
.ncl-pol-date{font-family:'DM Mono',monospace;font-size:8px;color:rgba(58,40,0,.4);text-align:center;margin-top:2px}
.ncl-pol-quote{font-family:'Kalam',cursive;font-size:9px;color:rgba(58,40,0,.55);text-align:center;line-height:1.4;margin-top:3px;font-style:italic}
.ncl-pol-del{position:absolute;top:6px;right:6px;background:rgba(239,68,68,.8);border:none;border-radius:50%;width:20px;height:20px;font-size:9px;color:white;cursor:pointer;display:none;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif}
.ncl-pol:hover .ncl-pol-del{display:flex}

/* Detail modal */
.ncl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px)}
.ncl-modal{background:#F4EFE2;border-radius:8px;padding:14px 14px 32px;width:100%;max-width:320px;box-shadow:0 32px 80px rgba(0,0,0,.8);position:relative}
.ncl-modal-close{position:absolute;top:10px;right:10px;background:rgba(58,40,0,.12);border:none;border-radius:50%;width:28px;height:28px;font-size:12px;color:#3A2800;cursor:pointer;font-family:'DM Sans',sans-serif}
.ncl-modal-photo{width:100%;border-radius:3px;overflow:hidden;margin-bottom:12px}
.ncl-modal-photo img{width:100%;display:block}
.ncl-modal-portrait{font-family:'Kalam',cursive;font-size:11px;color:#3A2800;line-height:1.7;padding-bottom:10px;border-bottom:1px solid rgba(58,40,0,.1);margin-bottom:10px}
.ncl-modal-chips{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.ncl-modal-chip{border-radius:5px;padding:6px 10px}
.ncl-modal-chipq{font-size:8px;font-family:'DM Mono',monospace;font-weight:600;opacity:.55;margin-bottom:2px;text-transform:uppercase;letter-spacing:.3px}
.ncl-modal-chipa{font-family:'Kalam',cursive;font-size:11px;line-height:1.45}
.ncl-modal-stamp{font-size:8px;color:rgba(58,40,0,.2);font-family:'DM Mono',monospace;text-align:right;margin-top:6px}
`;

interface Props {
  userId: string;
  onBack: () => void;
}

const ROTATIONS = [-3.2, 1.8, -1.5, 2.8, -2.1, 1.2, -2.8, 0.9, -1.8, 2.4, -0.8, 3.1];
const SIZES = [160, 145, 155, 150, 148, 158];

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
    <div className="ncl-wrap">
      <style>{CSS}</style>

      <nav className="ncl-nav">
        <div className="ncl-nav-left">
          <button className="ncl-back" onClick={onBack}>← Back</button>
          <div className="ncl-title">Night Cards</div>
          <span className="ncl-count">{cards.length}</span>
        </div>
      </nav>

      <div className="ncl-inner">
        {cards.length === 0 ? (
          <div className="ncl-empty">
            <div className="ncl-empty-icon">🌙</div>
            <div className="ncl-empty-h">No Night Cards yet</div>
            <div className="ncl-empty-sub">
              After each story, you'll be prompted to capture the night — their words, the best moment of the day, a photo. They live here.
            </div>
          </div>
        ) : (
          <div className="ncl-cork">
            {cards.map((nc, i) => {
              const rot = ROTATIONS[i % ROTATIONS.length];
              const size = SIZES[i % SIZES.length];
              return (
                <div key={nc.id} className="ncl-pol"
                  style={{
                    width: size, transform: `rotate(${rot}deg)`,
                    boxShadow: `0 ${4 + i % 3 * 2}px ${16 + i % 4 * 4}px rgba(0,0,0,.55)`,
                  }}
                  onClick={() => setViewing(nc)}>
                  {nc.photo
                    ? <div className="ncl-pol-photo"><img className="ncl-pol-img" src={nc.photo} alt="" /></div>
                    : <div className="ncl-pol-fallback">{nc.emoji || '🌙'}</div>}
                  <div className="ncl-pol-writing">
                    <div className="ncl-pol-name">{nc.heroName}</div>
                    <div className="ncl-pol-date">{nc.date}</div>
                    {nc.gratitude && <div className="ncl-pol-quote">"{nc.gratitude.slice(0, 40)}{nc.gratitude.length > 40 ? '…' : ''}"</div>}
                  </div>
                  <button className="ncl-pol-del" onClick={e => handleDelete(e, nc.id)}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {viewing && (
        <div className="ncl-modal-bg" onClick={() => setViewing(null)}>
          <div className="ncl-modal" onClick={e => e.stopPropagation()}>
            <button className="ncl-modal-close" onClick={() => setViewing(null)}>✕</button>
            {viewing.photo && (
              <div className="ncl-modal-photo"><img src={viewing.photo} alt="" style={{ borderRadius: 3 }} /></div>
            )}
            {viewing.memory_line && (
              <div className="ncl-modal-portrait">{viewing.memory_line}</div>
            )}
            <div className="ncl-modal-chips">
              {viewing.bondingAnswer && (
                <div className="ncl-modal-chip" style={{ background: 'rgba(180,120,20,.07)', border: '1px solid rgba(180,120,20,.15)' }}>
                  <div className="ncl-modal-chipq" style={{ color: '#7A5010' }}>{viewing.bondingQuestion || 'Bonding question'}</div>
                  <div className="ncl-modal-chipa" style={{ color: '#4A3000' }}>{viewing.bondingAnswer}</div>
                </div>
              )}
              {viewing.gratitude && (
                <div className="ncl-modal-chip" style={{ background: 'rgba(80,90,160,.06)', border: '1px solid rgba(80,90,160,.14)' }}>
                  <div className="ncl-modal-chipq" style={{ color: '#3A4080' }}>Best three seconds</div>
                  <div className="ncl-modal-chipa" style={{ color: '#2A3060' }}>{viewing.gratitude}</div>
                </div>
              )}
              {viewing.extra && (
                <div className="ncl-modal-chip" style={{ background: 'rgba(20,100,60,.06)', border: '1px solid rgba(20,100,60,.14)' }}>
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
