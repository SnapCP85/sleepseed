import { useState, useEffect } from 'react';
import { getNightCards } from '../lib/storage';
import type { SavedNightCard } from '../lib/types';
import NightCard from '../features/nightcards/NightCard';

const CSS = `
@media screen {
  .pnc{min-height:100vh;background:#f8f4ec;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:'Nunito',sans-serif}
  .pnc-btn{margin-top:20px;padding:12px 28px;border-radius:12px;background:#1a0f08;color:#F4EFE8;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:transform .15s}
  .pnc-btn:hover{transform:scale(1.04)}
  .pnc-loading{color:#3a2010;font-size:14px}
}
@media print {
  body{margin:0;padding:0}
  .pnc{padding:0;background:white;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .pnc-btn{display:none!important}
  .nc-perspective{transform:none!important}
  .nc-inner{box-shadow:none!important;border:1px solid #ddd!important}
}
`;

export default function PrintNightCard() {
  const [card, setCard] = useState<SavedNightCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('printCard');
    const userId = params.get('uid');
    if (!cardId || !userId) { setLoading(false); return; }

    getNightCards(userId).then(cards => {
      const found = cards.find(c => c.id === cardId);
      setCard(found || null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="pnc"><style>{CSS}</style><div className="pnc-loading">Loading...</div></div>;
  if (!card) return <div className="pnc"><style>{CSS}</style><div className="pnc-loading">Card not found</div></div>;

  return (
    <div className="pnc">
      <style>{CSS}</style>
      <div style={{ width: 300, height: 420 }}>
        <NightCard card={card} size="full" flipped={false} />
      </div>
      <button className="pnc-btn" onClick={() => window.print()}>
        {'\uD83D\uDDA8\uFE0F'} Print 5{'\u00D7'}7
      </button>
    </div>
  );
}
