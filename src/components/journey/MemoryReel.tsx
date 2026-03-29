import { useEffect, useState } from 'react';
import { useApp } from '../../AppContext';

export default function MemoryReel() {
  const { activeJourneyId, setView, setActiveJourneyId, setActiveCompletedBookId } = useApp();
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [finalBookId, setFinalBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeJourneyId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/story-journeys/${activeJourneyId}/summary`).then(r => r.json()),
      fetch(`/api/story-journeys/${activeJourneyId}`).then(r => r.json()),
    ]).then(([summaryData, journeyData]) => {
      setSummary(summaryData?.error ? null : summaryData);
      setFinalBookId(journeyData?.final_book_id || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeJourneyId]);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading memory reel...
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(244,239,232,.5)' }}>Memory Reel not ready yet.</p>
        <button onClick={() => setView('dashboard')}
          style={{ marginTop: 16, padding: '12px 24px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, cursor: 'pointer', color: '#faf6ee' }}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: '#060912', color: '#faf6ee' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#F5B84C', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>
          Memory Reel
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif", fontSize: 24 }}>
          {summary.summary_title as string || 'Your Book'}
        </h2>
        <p style={{ color: 'rgba(244,239,232,.5)', fontSize: 14, marginTop: 12, lineHeight: 1.6, fontStyle: 'italic' }}>
          {summary.emotional_arc as string}
        </p>
      </div>

      <div>
        {((summary.highlights as Array<Record<string, unknown>>) || []).map((h, i) => (
          <div key={i} style={{
            marginBottom: 16, padding: 20, borderRadius: 12,
            background: 'rgba(10,8,20,.95)', border: '1px solid rgba(245,184,76,.12)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(245,184,76,.6)', fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>
              Read {h.read_number as number}
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, fontFamily: "'Fraunces',Georgia,serif" }}>
              {h.chapter_title as string}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(244,239,232,.6)', lineHeight: 1.5 }}>
              {h.highlight as string}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
        {finalBookId && (
          <button onClick={() => { setActiveCompletedBookId(finalBookId); setView('completed-book-reader'); }}
            style={{ padding: '14px 20px', background: '#F5B84C', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 600, color: '#1a0f08', width: '100%', marginBottom: 12 }}>
            Read our finished book 📖
          </button>
        )}
        <button onClick={async () => {
          const title = summary?.summary_title as string || 'Our Book';
          const arc = summary?.emotional_arc as string || '';
          const text = `"${title}" — a 7-night bedtime book we made together.\n${arc ? arc.split('.')[0] + '.' : ''}\n\nsleepseed-vercel.vercel.app`;
          try { await navigator.share?.({title, text, url: 'https://sleepseed-vercel.vercel.app'}); }
          catch(_) { navigator.clipboard?.writeText(text); }
        }} style={{ padding: '14px 20px', background: 'rgba(245,184,76,.15)', border: '1px solid rgba(245,184,76,.3)', color: '#F5B84C', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 600, width: '100%', marginBottom: 12 }}>
          Share our book ✨
        </button>
        <button onClick={() => { setActiveJourneyId(null); setView('journey-setup'); }}
          style={{ padding: '14px 20px', background: finalBookId ? 'rgba(255,255,255,.08)' : '#F5B84C', border: finalBookId ? '1px solid rgba(255,255,255,.12)' : 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 600, color: finalBookId ? 'rgba(244,239,232,.6)' : '#1a0f08' }}>
          Begin a new book
        </button>
        <button onClick={() => { setActiveJourneyId(null); setView('dashboard'); }}
          style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: 'rgba(244,239,232,.4)', cursor: 'pointer', fontSize: 14 }}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
