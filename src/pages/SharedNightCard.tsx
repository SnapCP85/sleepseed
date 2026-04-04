import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedNightCard } from '../lib/types';
import NightCard from '../features/nightcards/NightCard';

const CSS = `
.snc{min-height:100vh;min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 40%,#0f0a20 100%);display:flex;flex-direction:column;align-items:center;padding:0;font-family:'Nunito',system-ui,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.snc-stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.snc-star{position:absolute;width:1.5px;height:1.5px;border-radius:50%;background:white;animation:sncTwinkle 4s ease-in-out infinite alternate}
@keyframes sncTwinkle{0%,100%{opacity:.1}50%{opacity:.4}}
.snc-content{position:relative;z-index:1;width:100%;max-width:400px;padding:40px 24px 60px;display:flex;flex-direction:column;align-items:center}
.snc-header{text-align:center;margin-bottom:24px;animation:sncFade .6s ease both}
@keyframes sncFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.snc-card-wrap{animation:sncFade .6s .15s ease both;opacity:0;width:100%;display:flex;justify-content:center;margin-bottom:20px}
.snc-context{animation:sncFade .6s .3s ease both;opacity:0;text-align:center;margin-bottom:28px}
.snc-footer{animation:sncFade .6s .45s ease both;opacity:0;text-align:center;width:100%}
.snc-cta{display:inline-block;padding:16px 36px;border-radius:16px;background:linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010);color:#120800;font-size:15px;font-weight:700;text-decoration:none;font-family:'Nunito',sans-serif;transition:transform .15s,filter .15s;box-shadow:0 8px 28px rgba(245,184,76,.25)}
.snc-cta:hover{transform:scale(1.04);filter:brightness(1.1)}
.snc-loading{color:rgba(244,239,232,.4);font-size:14px;padding:80px 24px;text-align:center}
.snc-error{color:rgba(255,140,130,.6);font-size:14px;padding:80px 24px;text-align:center}
`;

// Deterministic stars from card data
function makeStars(seed: string): { x: number; y: number; d: number; dl: number }[] {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i);
  const arr: { x: number; y: number; d: number; dl: number }[] = [];
  for (let i = 0; i < 40; i++) {
    h = (h * 33 + i) >>> 0;
    arr.push({
      x: (h % 1000) / 10, y: ((h >> 10) % 600) / 10,
      d: 3 + (h % 4), dl: (h % 50) / 10,
    });
  }
  return arr;
}

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

        // Parse extra for variant fields (but NOT whisper — private to parent)
        let occasion: string | undefined;
        let nightNumber: number | undefined;
        let creatureEmoji: string | undefined;
        let creatureColor: string | undefined;
        let isOrigin: boolean | undefined;
        let childMood: string | undefined;
        let childAge: string | undefined;
        let bedtimeActual: string | undefined;
        if (cardData.extra && cardData.extra.startsWith('{')) {
          try {
            const p = JSON.parse(cardData.extra);
            if (p.isOrigin) isOrigin = true;
            if (p.occasion) occasion = p.occasion;
            if (p.nightNumber != null) nightNumber = p.nightNumber;
            if (p.creatureEmoji) creatureEmoji = p.creatureEmoji;
            if (p.creatureColor) creatureColor = p.creatureColor;
            if (p.childMood) childMood = p.childMood;
            if (p.childAge) childAge = p.childAge;
            if (p.bedtimeActual) bedtimeActual = p.bedtimeActual;
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
          childMood,
          childAge,
          bedtimeActual,
          // whisper intentionally omitted — private to parent
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="snc"><style>{CSS}</style><div className="snc-loading">{'\uD83C\uDF19'} Loading memory...</div></div>;
  if (error || !card) return <div className="snc"><style>{CSS}</style><div className="snc-error">{error || 'Card not found'}</div></div>;

  const stars = makeStars(card.id);
  const cardDate = (() => {
    try {
      return new Date(card.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return card.date; }
  })();

  return (
    <div className="snc">
      <style>{CSS}</style>

      {/* Stars background */}
      <div className="snc-stars">
        {stars.map((s, i) => (
          <div key={i} className="snc-star" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            animationDuration: `${s.d}s`, animationDelay: `${s.dl}s`,
          }} />
        ))}
      </div>

      <div className="snc-content">
        {/* Header */}
        <div className="snc-header">
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9,
            color: 'rgba(245,184,76,.5)', letterSpacing: '1.5px',
            textTransform: 'uppercase' as const, marginBottom: 8,
          }}>
            A BEDTIME MEMORY
          </div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 300,
            color: '#F4EFE8', lineHeight: 1.3,
          }}>
            {card.heroName}{'\u2019'}s Night Card
          </div>
          <div style={{
            fontFamily: "'Nunito',sans-serif", fontSize: 12,
            color: 'rgba(244,239,232,.35)', marginTop: 6,
          }}>
            {cardDate}
          </div>
        </div>

        {/* Card */}
        <div className="snc-card-wrap">
          <NightCard
            card={card}
            size="full"
            flipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />
        </div>

        {/* Context */}
        <div className="snc-context">
          {card.childMood && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 16 }}>{card.childMood}</span>
              {card.bedtimeActual && (
                <span style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 9,
                  color: 'rgba(244,239,232,.3)',
                }}>{card.bedtimeActual.toLowerCase()}</span>
              )}
            </div>
          )}
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, fontWeight: 300,
            fontStyle: 'italic', color: 'rgba(244,239,232,.35)', lineHeight: 1.6,
          }}>
            Made with love at bedtime
            {card.childAge ? ` \u00B7 ${card.heroName}, age ${card.childAge}` : ''}
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(244,239,232,.15)', marginTop: 4,
            fontFamily: "'DM Mono',monospace",
          }}>
            tap the card to flip it
          </div>
        </div>

        {/* Footer CTA */}
        <div className="snc-footer">
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 16, fontWeight: 300,
            color: 'rgba(244,239,232,.5)', lineHeight: 1.5, marginBottom: 16,
          }}>
            Every night creates a memory<br />worth keeping.
          </div>
          <a className="snc-cta" href="/">
            Start your own bedtime ritual {'\u2192'}
          </a>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 20,
          }}>
            <span style={{ fontSize: 14 }}>{'\uD83C\uDF19'}</span>
            <span style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 13,
              color: 'rgba(244,239,232,.25)',
            }}>SleepSeed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
