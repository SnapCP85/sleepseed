import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedNightCard } from '../lib/types';
import NightCard from '../features/nightcards/NightCard';

const CSS = `
.fv{min-height:100vh;min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 40%,#0f0a20 100%);font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased}
.fv-inner{max-width:600px;margin:0 auto;padding:24px 20px 80px}
@keyframes fvFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.fv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(min-width:500px){.fv-grid{grid-template-columns:1fr 1fr 1fr}}
`;

function parseExtraFields(extra: string | null): Partial<SavedNightCard> {
  if (!extra || !extra.startsWith('{')) return {};
  try {
    const p = JSON.parse(extra);
    return {
      isOrigin: p.isOrigin || undefined,
      occasion: p.occasion || undefined,
      nightNumber: p.nightNumber ?? undefined,
      creatureEmoji: p.creatureEmoji || undefined,
      creatureColor: p.creatureColor || undefined,
      childMood: p.childMood || undefined,
      childAge: p.childAge || undefined,
      bedtimeActual: p.bedtimeActual || undefined,
      milestone: p.milestone || undefined,
      // whisper intentionally omitted — private
    };
  } catch { return {}; }
}

export default function FamilyView() {
  const [cards, setCards] = useState<SavedNightCard[]>([]);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<SavedNightCard | null>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const token = parts[parts.length - 1];
    if (!token) { setError('No share link provided'); setLoading(false); return; }

    supabase.from('family_shares')
      .select('child_name, card_ids')
      .eq('share_token', token)
      .single()
      .then(async ({ data, error: err }) => {
        if (err || !data) { setError('Share link not found or expired'); setLoading(false); return; }
        setChildName(data.child_name || 'Child');

        const { data: cardRows, error: cardErr } = await supabase
          .from('night_cards')
          .select('*')
          .in('id', data.card_ids || [])
          .order('date', { ascending: false });

        if (cardErr || !cardRows?.length) { setError('No cards found'); setLoading(false); return; }

        const parsed: SavedNightCard[] = cardRows.map((row: any) => ({
          id: row.id,
          userId: '',
          heroName: row.hero_name,
          storyTitle: row.story_title,
          characterIds: [],
          headline: row.headline,
          quote: row.quote,
          memory_line: row.memory_line,
          photo: row.photo_url,
          emoji: row.emoji,
          date: row.date,
          ...parseExtraFields(row.extra),
        }));

        setCards(parsed);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="fv"><style>{CSS}</style>
      <div className="fv-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{'\uD83C\uDF19'}</div>
        <div style={{ color: 'rgba(244,239,232,.4)', fontSize: 14 }}>Loading memories...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="fv"><style>{CSS}</style>
      <div className="fv-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{'\uD83C\uDF19'}</div>
        <div style={{ color: 'rgba(255,140,130,.6)', fontSize: 14 }}>{error}</div>
        <a href="/" style={{ display: 'inline-block', marginTop: 24, padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010)', color: '#120800', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Start your own ritual {'\u2192'}
        </a>
      </div>
    </div>
  );

  return (
    <div className="fv">
      <style>{CSS}</style>
      <div className="fv-inner">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fvFade .5s ease both' }}>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9,
            color: 'rgba(245,184,76,.5)', letterSpacing: '1.5px',
            textTransform: 'uppercase' as const, marginBottom: 8,
          }}>FAMILY MEMORIES</div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 300,
            color: '#F4EFE8', lineHeight: 1.3,
          }}>
            {childName}{'\u2019'}s Night Cards
          </div>
          <div style={{
            fontSize: 13, color: 'rgba(244,239,232,.35)', marginTop: 8,
          }}>
            {cards.length} {cards.length === 1 ? 'memory' : 'memories'} preserved with SleepSeed
          </div>
        </div>

        {/* Card grid */}
        <div className="fv-grid">
          {cards.map((card, i) => (
            <div key={card.id} style={{ animation: `fvFade .4s ${i * .05}s ease both`, opacity: 0 }}>
              <NightCard
                card={card}
                size="mini"
                onTap={() => { setViewing(card); setFlipped(false); }}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40, animation: 'fvFade .5s .3s ease both', opacity: 0 }}>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 14, fontWeight: 300,
            fontStyle: 'italic', color: 'rgba(244,239,232,.35)', lineHeight: 1.6, marginBottom: 16,
          }}>
            Every bedtime creates a memory worth keeping.
          </div>
          <a href="/" style={{
            display: 'inline-block', padding: '14px 32px', borderRadius: 14,
            background: 'linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010)',
            color: '#120800', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            fontFamily: "'Nunito',sans-serif",
          }}>
            Start your own bedtime ritual {'\u2192'}
          </a>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20,
          }}>
            <span style={{ fontSize: 14 }}>{'\uD83C\uDF19'}</span>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 13, color: 'rgba(244,239,232,.2)' }}>SleepSeed</span>
          </div>
        </div>
      </div>

      {/* Card detail modal */}
      {viewing && (
        <>
          <div onClick={() => { setViewing(null); setFlipped(false); }} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 200,
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, pointerEvents: 'none',
          }}>
            <div style={{ pointerEvents: 'all', width: '100%', maxWidth: 300, animation: 'fvFade .3s ease both' }}>
              <NightCard card={viewing} size="full" flipped={flipped} onFlip={() => setFlipped(!flipped)} />
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 9, color: 'rgba(234,242,255,.2)', fontFamily: "'DM Mono',monospace" }}>
                {flipped ? 'tap to see front' : 'tap to flip'}
              </div>
              <button onClick={() => { setViewing(null); setFlipped(false); }} style={{
                width: '100%', marginTop: 10, padding: '11px 8px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)',
                color: 'rgba(234,242,255,.6)', fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: 'pointer',
              }}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
