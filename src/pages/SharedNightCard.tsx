import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedNightCard } from '../lib/types';
import NightCardDetailPaginated from '../features/nightcards/NightCardDetailPaginated';

const CSS = `
.snc{min-height:100vh;min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 40%,#0f0a20 100%);display:flex;flex-direction:column;align-items:center;font-family:'Nunito',system-ui,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.snc-stars{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0}
.snc-star{position:absolute;width:1.5px;height:1.5px;border-radius:50%;background:white;animation:sncTwinkle 4s ease-in-out infinite alternate}
@keyframes sncTwinkle{0%,100%{opacity:.1}50%{opacity:.4}}
@keyframes sncFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.snc-content{position:relative;z-index:1;width:100%;max-width:400px;padding:40px 20px 60px;display:flex;flex-direction:column;align-items:center}
.snc-header{text-align:center;margin-bottom:24px;animation:sncFade .6s ease both}
.snc-card-wrap{animation:sncFade .6s .15s ease both;opacity:0;width:100%;display:flex;justify-content:center;margin-bottom:20px}
.snc-footer{animation:sncFade .6s .3s ease both;opacity:0;text-align:center;width:100%}
.snc-cta{display:inline-block;padding:16px 36px;border-radius:16px;background:linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010);color:#120800;font-size:15px;font-weight:700;text-decoration:none;font-family:'Nunito',sans-serif;transition:transform .15s,filter .15s;box-shadow:0 8px 28px rgba(245,184,76,.25)}
.snc-cta:hover{transform:scale(1.04);filter:brightness(1.1)}
.snc-loading{color:rgba(244,239,232,.4);font-size:14px;padding:80px 24px;text-align:center}
.snc-error{color:rgba(255,140,130,.6);font-size:14px;padding:80px 24px;text-align:center}
`;

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
          .select('id, user_id, hero_name, story_title, headline, quote, memory_line, bonding_question, bonding_answer, gratitude, photo_url, emoji, date, extra')
          .eq('id', data.card_id)
          .single();
        if (cardErr || !cardData) { setError('Card not found'); setLoading(false); return; }

        // Parse all fields from extra JSON
        let parsed: any = {};
        if (cardData.extra && typeof cardData.extra === 'string' && cardData.extra.startsWith('{')) {
          try { parsed = JSON.parse(cardData.extra); } catch {}
        }

        setCard({
          id: cardData.id,
          userId: cardData.user_id || '',
          heroName: cardData.hero_name,
          storyTitle: cardData.story_title,
          characterIds: [],
          headline: cardData.headline,
          quote: cardData.quote,
          memory_line: cardData.memory_line,
          bondingQuestion: cardData.bonding_question,
          bondingAnswer: cardData.bonding_answer,
          gratitude: cardData.gratitude,
          photo: cardData.photo_url,
          emoji: cardData.emoji,
          date: cardData.date,
          isOrigin: parsed.isOrigin || undefined,
          occasion: parsed.occasion || undefined,
          nightNumber: parsed.nightNumber ?? undefined,
          streakCount: parsed.streakCount ?? undefined,
          creatureEmoji: parsed.creatureEmoji || undefined,
          creatureColor: parsed.creatureColor || undefined,
          childMood: parsed.childMood || undefined,
          childAge: parsed.childAge || undefined,
          bedtimeActual: parsed.bedtimeActual || undefined,
          childDrawing: parsed.childDrawing || undefined,
          audioClip: parsed.audioClip || undefined,
          parentReflection: parsed.parentReflection || undefined,
          milestone: parsed.milestone || undefined,
          // whisper intentionally omitted — private to parent
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="snc"><style>{CSS}</style><div className="snc-loading">{'\uD83C\uDF19'} Loading memory...</div></div>;
  if (error || !card) return <div className="snc"><style>{CSS}</style><div className="snc-error">{error || 'Card not found'}</div></div>;

  const stars = makeStars(card.id);

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
        </div>

        {/* Full paginated card */}
        <div className="snc-card-wrap">
          <div style={{ width: '100%', maxWidth: 340 }}>
            <NightCardDetailPaginated
              card={card}
              onClose={() => window.location.href = '/'}
            />
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
