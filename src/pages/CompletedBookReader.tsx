import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { supabase } from '../lib/supabase';

export default function CompletedBookReader() {
  const {
    activeCompletedBookId, setActiveCompletedBookId,
    setActiveChapterOutput, setView,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCompletedBookId) { setError('No book selected'); setLoading(false); return; }
    loadAndNavigate();
  }, [activeCompletedBookId]); // eslint-disable-line

  const loadAndNavigate = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('stories')
        .select('id, title, hero_name, book_data, refrain')
        .eq('id', activeCompletedBookId)
        .single();

      if (dbError || !data) throw new Error('Book not found');

      const bd = data.book_data as Record<string, unknown>;
      const pages = (bd.pages as Array<Record<string, string>> || []).map(p => ({ text: p.text || '' }));

      // Set as activeChapterOutput with _isCompletedBook flag
      // App.tsx will detect this and pass directly as preloadedBook
      setActiveChapterOutput({
        title: data.title || bd.title || 'Our Book',
        heroName: data.hero_name || bd.heroName || '',
        refrain: data.refrain || bd.refrain || '',
        pages,
        allChars: bd.allChars || [],
        _isCompletedBook: true,
        _storyId: data.id,
      });
      setView('story-builder');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load book');
      setLoading(false);
    }
  };

  if (error) return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(244,239,232,.5)' }}>{error}</p>
      <button onClick={() => { setActiveCompletedBookId(null); setView('dashboard'); }}
        style={{ marginTop: 16, padding: '12px 24px', background: '#F5B84C', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#1a0f08' }}>
        Back
      </button>
    </div>
  );

  return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(244,239,232,.4)' }}>Opening your book...</p>
    </div>
  );
}
