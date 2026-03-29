import { useState } from 'react';
import { useApp } from '../../AppContext';

const OPTIONS = [
  { key: 'continue_world', label: 'Continue this world', desc: 'Same setting, new story' },
  { key: 'continue_characters', label: 'Continue these characters', desc: 'Same cast, new adventure' },
  { key: 'continue_theme', label: 'Continue this theme', desc: 'Same heart, new world' },
  { key: 'fresh', label: 'Start something new', desc: 'Brand new book' },
];

export default function SeriesCreator() {
  const { user, selectedCharacter, selectedCharacters, activeJourneyId, setView, setActiveJourneyId, setActiveSeriesId } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const char = selectedCharacter || selectedCharacters?.[0];

  const handleSelect = async (key: string) => {
    if (key === 'fresh') { setActiveJourneyId(null); setView('journey-setup'); return; }
    if (!user || !char || !activeJourneyId) {
      console.error('[SeriesCreator] Missing:', { userId: user?.id, charId: char?.id, journeyId: activeJourneyId });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/story-series/start-from-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          characterId: char.id,
          journeyId: activeJourneyId,
          seriesMode: key,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.error) { setError(data.error); return; }
      if (data.seriesId) {
        setActiveSeriesId(data.seriesId);
        setActiveJourneyId(null);
        setView('journey-setup');
      }
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Something went wrong');
      console.error(e);
    }
  };

  if (loading) return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Setting up your series...
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#060912', color: '#faf6ee' }}>
      <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(244,239,232,.4)', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}>← Dashboard</button>
      <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", marginBottom: 24 }}>What comes next?</h2>
      {error && <div style={{ padding: 12, marginBottom: 16, background: 'rgba(192,64,48,.12)', border: '1px solid rgba(192,64,48,.28)', borderRadius: 8, fontSize: 13, color: '#f09080' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {OPTIONS.map(o => (
          <button key={o.key} onClick={() => handleSelect(o.key)}
            style={{ padding: '16px 20px', textAlign: 'left', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,184,76,.08)'; e.currentTarget.style.borderColor = 'rgba(245,184,76,.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; }}>
            <div style={{ fontWeight: 600, color: '#faf6ee', marginBottom: 2 }}>{o.label}</div>
            <div style={{ fontSize: 13, color: 'rgba(244,239,232,.4)' }}>{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
