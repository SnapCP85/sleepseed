import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { journeyService } from '../lib/journey-service';
import { supabase } from '../lib/supabase';
import type { StoryJourney } from '../lib/types';

// Book reading is handled by CompletedBookReader via setActiveCompletedBookId

type LibraryTab = 'books' | 'journeys';

export default function JourneyLibrary({ onReadStory }: { onReadStory?: (bookData: any) => void }) {
  const { user, setView, setActiveJourneyId, setActiveCompletedBookId } = useApp();
  const [tab, setTab] = useState<LibraryTab>('journeys');
  const [completedBooks, setCompletedBooks] = useState<StoryJourney[]>([]);
  const [allJourneys, setAllJourneys] = useState<StoryJourney[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      journeyService.getCompletedBooks(user.id),
      journeyService.getAllJourneys(user.id),
    ]).then(([books, journeys]) => {
      setCompletedBooks(books);
      setAllJourneys(journeys);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  const [characterNames, setCharacterNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = [...new Set(allJourneys.map(j => j.characterId).filter(Boolean))];
    if (ids.length === 0) return;
    supabase
      .from('characters')
      .select('id, name')
      .in('id', ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((c: { id: string; name: string }) => { map[c.id] = c.name; });
          setCharacterNames(map);
        }
      });
  }, [allJourneys]);

  const activeJourneys = allJourneys.filter(j => j.status === 'active');

  const tabStyle = (t: LibraryTab): React.CSSProperties => ({
    padding: '8px 16px',
    background: tab === t ? '#F5B84C' : 'transparent',
    border: tab === t ? 'none' : '1px solid rgba(255,255,255,.15)',
    borderRadius: 20,
    cursor: 'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#1a0f08' : 'rgba(244,239,232,.5)',
    fontSize: 13,
  });

  if (loading) return <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee' }}>Loading your books...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: '#060912', color: '#faf6ee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif" }}>My Books</h2>
        <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(244,239,232,.4)' }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('journeys')} onClick={() => setTab('journeys')}>
          In Progress {activeJourneys.length > 0 ? `(${activeJourneys.length})` : ''}
        </button>
        <button style={tabStyle('books')} onClick={() => setTab('books')}>
          Completed {completedBooks.length > 0 ? `(${completedBooks.length})` : ''}
        </button>
      </div>

      {tab === 'journeys' && (
        <div>
          {activeJourneys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(244,239,232,.4)' }}>
              <p>No books in progress.</p>
              <button onClick={() => setView('journey-setup')}
                style={{ padding: '12px 24px', background: '#F5B84C', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: 16, color: '#1a0f08' }}>
                Begin a book
              </button>
            </div>
          ) : (
            activeJourneys.map(j => (
              <div key={j.id} style={{ background: 'rgba(10,8,20,.95)', border: '1px solid rgba(245,184,76,.18)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(245,184,76,.7)', marginBottom: 4 }}>Read {j.readNumber} of 7</div>
                <h3 style={{ margin: '0 0 8px', color: '#faf6ee' }}>{j.workingTitle}</h3>
                <p style={{ fontSize: 13, color: 'rgba(244,239,232,.4)', margin: '0 0 12px' }}>
                  For {characterNames[j.characterId] || 'your child'} · Started {new Date(j.createdAt).toLocaleDateString()}
                </p>
                <button onClick={() => { setActiveJourneyId(j.id); setView('nightly-checkin'); }}
                  style={{ padding: '8px 16px', background: '#F5B84C', color: '#1a0f08', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Continue
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'books' && (
        <div>
          {completedBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(244,239,232,.4)' }}>
              <p>No completed books yet.</p>
              <p style={{ fontSize: 13 }}>Complete a 7-read journey to create your first book.</p>
            </div>
          ) : (
            completedBooks.map(j => (
              <div key={j.id} style={{ background: 'rgba(10,8,20,.95)', border: '1px solid rgba(20,216,144,.18)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(20,216,144,.7)', marginBottom: 4 }}>
                  Completed {j.completedAt ? new Date(j.completedAt).toLocaleDateString() : ''}
                </div>
                <h3 style={{ margin: '0 0 8px', color: '#faf6ee' }}>{j.finalTitle || j.workingTitle}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {j.finalBookId && (
                    <button onClick={() => {
                      setActiveCompletedBookId(j.finalBookId!);
                      setView('completed-book-reader');
                    }} style={{ padding: '8px 16px', background: 'rgba(245,184,76,.2)', border: '1px solid rgba(245,184,76,.3)', color: '#F5B84C', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Read book
                    </button>
                  )}
                  <button onClick={() => { setActiveJourneyId(j.id); setView('memory-reel'); }}
                    style={{ padding: '8px 16px', background: 'rgba(154,127,212,.2)', border: '1px solid rgba(154,127,212,.3)', color: '#c8b8ff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                    Memory Reel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
