import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedNightCard } from '../lib/types';
import NightCard from '../features/nightcards/NightCard';

const CSS = `
.snc{min-height:100vh;background:#080C18;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:'Nunito',system-ui,sans-serif}
.snc-loading{color:rgba(244,239,232,.4);font-size:14px}
.snc-error{color:rgba(255,140,130,.6);font-size:14px}
.snc-footer{text-align:center;margin-top:24px}
.snc-footer-txt{color:rgba(244,239,232,.4);font-size:13px;margin-bottom:12px}
.snc-cta{display:inline-block;padding:12px 28px;border-radius:14px;background:linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010);color:#120800;font-size:14px;font-weight:700;text-decoration:none;font-family:'Nunito',sans-serif;transition:transform .15s,filter .15s}
.snc-cta:hover{transform:scale(1.04);filter:brightness(1.1)}
`;

export default function SharedNightCard() {
  const [card, setCard] = useState<SavedNightCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('nc');
    if (!token) { setError('No card token provided'); setLoading(false); return; }

    supabase.from('night_card_shares')
      .select('card_id')
      .eq('share_token', token)
      .single()
      .then(async ({ data, error: err }) => {
        if (err || !data) { setError('Card not found or link expired'); setLoading(false); return; }
        const { data: cardData, error: cardErr } = await supabase
          .from('night_cards')
          .select('id, hero_name, story_title, headline, quote, memory_line, photo_url, emoji, date, extra')
          .eq('id', data.card_id)
          .single();
        if (cardErr || !cardData) { setError('Card not found'); setLoading(false); return; }

        // Parse extra for variant fields (but NOT whisper)
        let occasion: string | undefined;
        let nightNumber: number | undefined;
        let creatureEmoji: string | undefined;
        let creatureColor: string | undefined;
        let isOrigin: boolean | undefined;
        if (cardData.extra && cardData.extra.startsWith('{')) {
          try {
            const p = JSON.parse(cardData.extra);
            if (p.isOrigin) isOrigin = true;
            if (p.occasion) occasion = p.occasion;
            if (p.nightNumber != null) nightNumber = p.nightNumber;
            if (p.creatureEmoji) creatureEmoji = p.creatureEmoji;
            if (p.creatureColor) creatureColor = p.creatureColor;
          } catch {}
        }

        setCard({
          id: cardData.id,
          userId: '',
          heroName: cardData.hero_name,
          storyTitle: cardData.story_title,
          characterIds: [],
          headline: cardData.headline,
          quote: cardData.quote,
          memory_line: cardData.memory_line,
          photo: cardData.photo_url,
          emoji: cardData.emoji,
          date: cardData.date,
          isOrigin,
          occasion,
          nightNumber,
          creatureEmoji,
          creatureColor,
          // whisper intentionally omitted — private to parent
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="snc"><style>{CSS}</style><div className="snc-loading">Loading memory...</div></div>;
  if (error || !card) return <div className="snc"><style>{CSS}</style><div className="snc-error">{error || 'Card not found'}</div></div>;

  return (
    <div className="snc">
      <style>{CSS}</style>
      <NightCard
        card={card}
        size="full"
        flipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
      />
      <div className="snc-footer">
        <div className="snc-footer-txt">This memory was made with SleepSeed {'\uD83C\uDF19'}</div>
        <a className="snc-cta" href="https://sleepseed.vercel.app">
          Start your own bedtime ritual {'\u2192'}
        </a>
      </div>
    </div>
  );
}
