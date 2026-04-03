import { useState, useEffect } from 'react';
import { ALL_CONCEPTS, BUCKET_LABELS, CONCEPTS_BY_BUCKET, type LibraryConcept, type LibraryBucket } from '../lib/demo-library-concepts';
import { generateCoverSVG } from '../lib/svg-cover-generator';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface GeneratedStory {
  id: string;
  title: string;
  slug: string;
  genre: string;
  bucket: string;
  ageGroup: string;
  wordCount: number;
  pageCount: number;
  qualityScore: number;
  qualityVerdict: string;
  qualityFlags: string[];
  bookData: any;
  status: 'generating' | 'review' | 'approved' | 'published' | 'rejected';
  featured: boolean;
  conceptId?: string;
}

type Tab = 'generate' | 'review' | 'library' | 'featured';

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0d0d1a 0%, #1a1033 100%)',
    color: '#e8e0f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '16px',
  } as React.CSSProperties,
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#c9a0ff',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
  } as React.CSSProperties,
  tab: (active: boolean) => ({
    padding: '10px 20px',
    borderRadius: '8px 8px 0 0',
    background: active ? 'rgba(201,160,255,0.15)' : 'transparent',
    color: active ? '#c9a0ff' : '#8a7a9a',
    border: 'none',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    fontSize: '14px',
    borderBottom: active ? '2px solid #c9a0ff' : '2px solid transparent',
    transition: 'all 0.2s',
  }) as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
  button: (variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => {
    const colors = {
      primary: { bg: '#7c5cbf', hover: '#9b7dd4' },
      secondary: { bg: 'rgba(255,255,255,0.08)', hover: 'rgba(255,255,255,0.15)' },
      danger: { bg: '#8b3a3a', hover: '#a84a4a' },
      success: { bg: '#3a7a4a', hover: '#4a9a5a' },
    };
    return {
      padding: '8px 16px',
      borderRadius: '8px',
      background: colors[variant].bg,
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      transition: 'background 0.2s',
    } as React.CSSProperties;
  },
  badge: (color: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    background: color,
    color: '#fff',
    marginRight: '6px',
  }) as React.CSSProperties,
  input: {
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    color: '#e8e0f0',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    color: '#e8e0f0',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,
  progressBar: (pct: number) => ({
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: '12px',
  }) as React.CSSProperties,
  progressFill: (pct: number) => ({
    height: '100%',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, #7c5cbf, #c9a0ff)',
    borderRadius: '2px',
    transition: 'width 0.5s',
  }) as React.CSSProperties,
  qualityBadge: (score: number) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    background: score >= 8 ? '#2a6a3a' : score >= 6 ? '#6a5a2a' : '#6a2a2a',
    color: '#fff',
  }) as React.CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EDITORIAL CONSOLE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminEditorialConsole() {
  const [tab, setTab] = useState<Tab>('generate');
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [error, setError] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Get current user ID for story ownership
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminUserId(data.user.id);
    });
    // Also listen for auth state changes (login after page load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setAdminUserId(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load existing library stories from Supabase
  useEffect(() => {
    loadExistingStories();
  }, []);

  async function loadExistingStories() {
    try {
      const { data, error: dbErr } = await supabase
        .from('stories')
        .select('*')
        .like('id', 'lib-%')
        .order('created_at', { ascending: false });

      if (dbErr) throw dbErr;
      if (!data) return;

      const mapped: GeneratedStory[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.library_slug,
        genre: row.book_data?.metadata?.genre || row.vibe || 'unknown',
        bucket: row.book_data?.metadata?.bucket || 'uncategorized',
        ageGroup: row.age_group || 'age5',
        wordCount: row.book_data?.metadata?.wordCount || 0,
        pageCount: row.book_data?.pages?.length || 0,
        qualityScore: row.book_data?.metadata?.qualityScore || 0,
        qualityVerdict: row.book_data?.metadata?.qualityVerdict || 'unknown',
        qualityFlags: row.book_data?.metadata?.qualityFlags || [],
        bookData: row.book_data,
        status: row.is_public ? 'published' : row.submitted_at ? 'approved' : 'review',
        featured: row.is_staff_pick || row.is_book_of_day || false,
        conceptId: row.book_data?.metadata?.conceptId,
      }));

      setStories(mapped);
    } catch (e: any) {
      console.error('Failed to load stories:', e);
    }
  }

  // ── Generate a single story from a concept ─────────────────────────────
  async function generateStory(concept: LibraryConcept): Promise<GeneratedStory | null> {
    try {
      const resp = await fetch('/api/admin/generate-library-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          brief: {
            ...concept.brief,
            _bucket: concept.bucket,
            _conceptId: concept.id,
            _ageGroup: concept.ageGroup,
            _vibe: concept.vibe,
            _theme: concept.label,
            _lessons: concept.lessons,
          },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const story = data.story;

      return {
        ...story,
        qualityFlags: story.qualityFlags || [],
        status: 'review' as const,
        featured: concept.featured,
        conceptId: concept.id,
      };
    } catch (e: any) {
      console.error(`Failed to generate story for ${concept.id}:`, e);
      setError(`Failed: ${concept.label} — ${e.message}`);
      return null;
    }
  }

  // ── Auto-seed with configurable batch size ──────────────────────────────
  const [batchSize, setBatchSize] = useState(1);

  async function autoSeed() {
    setGenerating(true);
    setError(null);

    // Get remaining concepts (not yet generated)
    const remaining = ALL_CONCEPTS.filter(c => !stories.some(s => s.conceptId === c.id));
    const batch = remaining.slice(0, batchSize);

    if (batch.length === 0) {
      setProgress({ current: 0, total: 0, label: 'All concepts already generated' });
      setGenerating(false);
      return;
    }

    setProgress({ current: 0, total: batch.length, label: 'Starting...' });
    let generated = 0;

    for (let i = 0; i < batch.length; i++) {
      const concept = batch[i];
      setProgress({ current: i + 1, total: batch.length, label: `Generating: ${concept.label}` });
      const story = await generateStory(concept);
      if (story) {
        generated++;
        setStories(prev => [...prev, story]);
      }
    }

    setProgress({ current: batch.length, total: batch.length, label: `Done! ${generated}/${batch.length} generated` });
    setGenerating(false);
  }

  // ── Guided single generation ───────────────────────────────────────────
  const [guidedForm, setGuidedForm] = useState({
    topic: '',
    bucket: 'wonder-cozy' as LibraryBucket,
    genre: 'wonder' as string,
    ageGroup: 'age5',
    tone: '',
    notes: '',
  });

  async function generateGuided() {
    setGenerating(true);
    setError(null);
    setProgress({ current: 0, total: 1, label: 'Generating custom story...' });

    const brief = {
      genre: guidedForm.genre,
      situation: guidedForm.topic || 'A child discovers something magical at bedtime',
      protagonistAge: guidedForm.ageGroup === 'age3' ? '4' : guidedForm.ageGroup === 'age7' ? '7' : guidedForm.ageGroup === 'age10' ? '10' : '5',
      _bucket: guidedForm.bucket,
      _ageGroup: guidedForm.ageGroup,
      _vibe: guidedForm.genre,
      _theme: guidedForm.topic.slice(0, 200),
      _lessons: [],
    };

    try {
      const resp = await fetch('/api/admin/generate-library-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, adminUserId }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const story: GeneratedStory = {
        ...data.story,
        qualityFlags: data.story.qualityFlags || [],
        status: 'review' as const,
        featured: false,
      };

      setStories(prev => [...prev, story]);
      setProgress({ current: 1, total: 1, label: 'Done!' });
    } catch (e: any) {
      setError(e.message);
    }

    setGenerating(false);
  }

  // ── Story actions ──────────────────────────────────────────────────────
  async function approveStory(id: string) {
    await supabase.from('stories').update({ submitted_at: new Date().toISOString() }).eq('id', id);
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  }

  async function publishStory(id: string) {
    await supabase.from('stories').update({
      is_public: true,
      submitted_at: new Date().toISOString(),
    }).eq('id', id);
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: 'published' } : s));
  }

  async function unpublishStory(id: string) {
    await supabase.from('stories').update({ is_public: false }).eq('id', id);
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  }

  async function rejectStory(id: string) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
  }

  async function toggleFeatured(id: string) {
    const story = stories.find(s => s.id === id);
    if (!story) return;
    const newVal = !story.featured;
    await supabase.from('stories').update({ is_staff_pick: newVal }).eq('id', id);
    setStories(prev => prev.map(s => s.id === id ? { ...s, featured: newVal } : s));
  }

  async function setBookOfDay(id: string) {
    // Clear existing book of day
    await supabase.from('stories').update({ is_book_of_day: false }).neq('id', id);
    await supabase.from('stories').update({
      is_book_of_day: true,
      book_of_day_date: new Date().toISOString().split('T')[0],
    }).eq('id', id);
    setStories(prev => prev.map(s => ({
      ...s,
      featured: s.id === id ? true : s.featured,
    })));
  }

  async function regenerateStory(storyId: string) {
    const story = stories.find(s => s.id === storyId);
    if (!story || !story.conceptId) return;
    const concept = ALL_CONCEPTS.find(c => c.id === story.conceptId);
    if (!concept) return;

    // Remove old
    await supabase.from('stories').delete().eq('id', storyId);
    setStories(prev => prev.filter(s => s.id !== storyId));

    // Regenerate
    setGenerating(true);
    setProgress({ current: 0, total: 1, label: `Regenerating: ${story.title}` });
    const newStory = await generateStory(concept);
    if (newStory) {
      setStories(prev => [...prev, newStory]);
    }
    setGenerating(false);
  }

  async function updateTitle(id: string, newTitle: string) {
    await supabase.from('stories').update({ title: newTitle }).eq('id', id);
    setStories(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  }

  // ── Computed ───────────────────────────────────────────────────────────
  const reviewStories = stories.filter(s => s.status === 'review');
  const approvedStories = stories.filter(s => s.status === 'approved' || s.status === 'published');
  const featuredStories = stories.filter(s => s.featured);
  const bucketCounts = Object.keys(BUCKET_LABELS).reduce((acc, b) => {
    acc[b] = stories.filter(s => s.bucket === b && s.status !== 'rejected').length;
    return acc;
  }, {} as Record<string, number>);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Editorial Console</div>
          <div style={{ fontSize: '12px', color: '#8a7a9a', marginTop: '4px' }}>
            Demo Library Seeder & Publisher
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#8a7a9a' }}>
            {stories.filter(s => s.status !== 'rejected').length} stories |{' '}
            {stories.filter(s => s.status === 'published').length} published
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {(['generate', 'review', 'library', 'featured'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'generate' ? `Generate` : t === 'review' ? `Review (${reviewStories.length})` : t === 'library' ? `Library (${approvedStories.length})` : `Featured (${featuredStories.length})`}
          </button>
        ))}
      </div>

      {/* Error */}
      {/* Auth warning */}
      {!adminUserId && (
        <div style={{ ...S.card, background: 'rgba(180,140,40,0.15)', borderColor: 'rgba(180,140,40,0.3)' }}>
          <span style={{ fontSize: '13px' }}>Not logged in — stories will fail to save. Log in first, then refresh this page.</span>
        </div>
      )}

      {error && (
        <div style={{ ...S.card, background: 'rgba(139,58,58,0.2)', borderColor: 'rgba(139,58,58,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px' }}>{error}</span>
            <button style={S.button('secondary')} onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Progress */}
      {generating && (
        <div style={S.card}>
          <div style={{ fontSize: '13px', color: '#c9a0ff' }}>{progress.label}</div>
          <div style={{ fontSize: '11px', color: '#8a7a9a', marginTop: '4px' }}>
            {progress.current} / {progress.total}
          </div>
          <div style={S.progressBar(0)}>
            <div style={S.progressFill(progress.total ? (progress.current / progress.total) * 100 : 0)} />
          </div>
        </div>
      )}

      {/* Tab content */}
      {tab === 'generate' && <GenerateTab
        generating={generating}
        onAutoSeed={autoSeed}
        onGenerateGuided={generateGuided}
        guidedForm={guidedForm}
        setGuidedForm={setGuidedForm}
        bucketCounts={bucketCounts}
        existingConceptIds={stories.map(s => s.conceptId).filter(Boolean) as string[]}
        batchSize={batchSize}
        setBatchSize={setBatchSize}
      />}
      {tab === 'review' && <ReviewTab
        stories={reviewStories}
        onApprove={approveStory}
        onReject={rejectStory}
        onRegenerate={regenerateStory}
        onToggleFeatured={toggleFeatured}
        onUpdateTitle={updateTitle}
      />}
      {tab === 'library' && <LibraryTab
        stories={approvedStories}
        onPublish={publishStory}
        onUnpublish={unpublishStory}
        onToggleFeatured={toggleFeatured}
        onSetBookOfDay={setBookOfDay}
        onRegenerate={regenerateStory}
      />}
      {tab === 'featured' && <FeaturedTab
        stories={featuredStories}
        allStories={approvedStories}
        onSetBookOfDay={setBookOfDay}
        onToggleFeatured={toggleFeatured}
      />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE TAB
// ═══════════════════════════════════════════════════════════════════════════

function GenerateTab({
  generating, onAutoSeed, onGenerateGuided, guidedForm, setGuidedForm, bucketCounts, existingConceptIds, batchSize, setBatchSize,
}: {
  generating: boolean;
  onAutoSeed: () => void;
  onGenerateGuided: () => void;
  guidedForm: any;
  setGuidedForm: (f: any) => void;
  bucketCounts: Record<string, number>;
  existingConceptIds: string[];
  batchSize: number;
  setBatchSize: (n: number) => void;
}) {
  const remainingConcepts = ALL_CONCEPTS.filter(c => !existingConceptIds.includes(c.id));

  return (
    <div>
      {/* Auto Seeder */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Auto Seeder</div>
            <div style={{ fontSize: '12px', color: '#8a7a9a', marginTop: '4px' }}>
              {remainingConcepts.length} of {ALL_CONCEPTS.length} concepts remaining across 4 buckets
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#8a7a9a', whiteSpace: 'nowrap' }}>Batch size</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 3, 5, 10, remainingConcepts.length].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(n => (
                  <button
                    key={n}
                    style={{
                      ...S.button(batchSize === n ? 'primary' : 'secondary'),
                      padding: '4px 10px', fontSize: '12px', minWidth: '32px',
                    }}
                    onClick={() => setBatchSize(n)}
                    disabled={generating}
                  >
                    {n === remainingConcepts.length && n > 10 ? 'All' : n}
                  </button>
                ))}
              </div>
            </div>
            <button
              style={{ ...S.button('primary'), opacity: generating || remainingConcepts.length === 0 ? 0.5 : 1, padding: '10px 20px', fontSize: '14px' }}
              onClick={onAutoSeed}
              disabled={generating || remainingConcepts.length === 0}
            >
              {generating ? 'Generating...' : remainingConcepts.length === 0 ? 'All Done' : `Generate ${Math.min(batchSize, remainingConcepts.length)}`}
            </button>
          </div>
        </div>

        {/* Bucket progress */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {(Object.entries(BUCKET_LABELS) as [LibraryBucket, string][]).map(([key, label]) => {
            const total = CONCEPTS_BY_BUCKET[key].length;
            const done = bucketCounts[key] || 0;
            return (
              <div key={key} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#c9a0ff' }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{done}/{total}</div>
                <div style={S.progressBar(0)}>
                  <div style={S.progressFill((done / total) * 100)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Concept list */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Concepts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ALL_CONCEPTS.map(c => {
              const exists = existingConceptIds.includes(c.id);
              return (
                <span
                  key={c.id}
                  style={{
                    ...S.badge(exists ? '#2a6a3a' : 'rgba(255,255,255,0.1)'),
                    opacity: exists ? 1 : 0.6,
                  }}
                >
                  {exists ? '\u2713 ' : ''}{c.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guided Generator */}
      <div style={S.card}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Guided Generator</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#8a7a9a', display: 'block', marginBottom: '4px' }}>Topic / Situation</label>
            <input
              style={S.input}
              placeholder="e.g., A child who talks to the moon..."
              value={guidedForm.topic}
              onChange={e => setGuidedForm({ ...guidedForm, topic: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8a7a9a', display: 'block', marginBottom: '4px' }}>Bucket</label>
            <select
              style={S.select}
              value={guidedForm.bucket}
              onChange={e => setGuidedForm({ ...guidedForm, bucket: e.target.value })}
            >
              {Object.entries(BUCKET_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8a7a9a', display: 'block', marginBottom: '4px' }}>Genre</label>
            <select
              style={S.select}
              value={guidedForm.genre}
              onChange={e => setGuidedForm({ ...guidedForm, genre: e.target.value })}
            >
              {['comedy', 'adventure', 'wonder', 'cosy', 'therapeutic', 'mystery'].map(g => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8a7a9a', display: 'block', marginBottom: '4px' }}>Age Group</label>
            <select
              style={S.select}
              value={guidedForm.ageGroup}
              onChange={e => setGuidedForm({ ...guidedForm, ageGroup: e.target.value })}
            >
              <option value="age3">3-5</option>
              <option value="age5">5-7</option>
              <option value="age7">7-9</option>
              <option value="age10">9+</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '11px', color: '#8a7a9a', display: 'block', marginBottom: '4px' }}>Notes (optional)</label>
          <input
            style={S.input}
            placeholder="Additional guidance for the generator..."
            value={guidedForm.notes}
            onChange={e => setGuidedForm({ ...guidedForm, notes: e.target.value })}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <button
            style={{ ...S.button('primary'), opacity: generating ? 0.5 : 1 }}
            onClick={onGenerateGuided}
            disabled={generating || !guidedForm.topic}
          >
            Generate Story
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════

function ReviewTab({
  stories, onApprove, onReject, onRegenerate, onToggleFeatured, onUpdateTitle,
}: {
  stories: GeneratedStory[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  if (stories.length === 0) {
    return (
      <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '14px', color: '#8a7a9a' }}>No stories in review queue</div>
        <div style={{ fontSize: '12px', color: '#6a5a7a', marginTop: '8px' }}>
          Generate stories from the Generate tab to populate the queue
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: '13px', color: '#8a7a9a', marginBottom: '16px' }}>
        {stories.length} stories awaiting review
      </div>
      <div style={S.grid}>
        {stories.map(story => (
          <div key={story.id} style={S.card}>
            {/* Cover from pool */}
            <div
              style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}
              dangerouslySetInnerHTML={{ __html: generateCoverSVG(story.title, story.bucket) }}
            />

            {/* Title */}
            {editTitle === story.id ? (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onUpdateTitle(story.id, titleDraft); setEditTitle(null); }
                    if (e.key === 'Escape') setEditTitle(null);
                  }}
                  autoFocus
                />
                <button style={S.button('success')} onClick={() => { onUpdateTitle(story.id, titleDraft); setEditTitle(null); }}>Save</button>
              </div>
            ) : (
              <div
                style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', cursor: 'pointer' }}
                onClick={() => { setEditTitle(story.id); setTitleDraft(story.title); }}
                title="Click to edit title"
              >
                {story.title}
              </div>
            )}

            {/* Metadata */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              <span style={S.badge('rgba(124,92,191,0.4)')}>{story.genre}</span>
              <span style={S.badge('rgba(255,255,255,0.1)')}>{story.bucket}</span>
              <span style={S.badge('rgba(255,255,255,0.08)')}>{story.ageGroup}</span>
              <span style={S.badge('rgba(255,255,255,0.08)')}>{story.wordCount}w</span>
              <span style={S.badge('rgba(255,255,255,0.08)')}>{story.pageCount}p</span>
            </div>

            {/* Quality */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={S.qualityBadge(story.qualityScore)}>
                {story.qualityVerdict} {story.qualityScore}/10
              </span>
              {story.featured && <span style={S.badge('#2a6a3a')}>Featured candidate</span>}
            </div>

            {/* Quality flags */}
            {story.qualityFlags?.length > 0 && (
              <div style={{ fontSize: '11px', color: '#c9a0ff', marginBottom: '8px' }}>
                {story.qualityFlags.map((f, i) => <div key={i} style={{ marginBottom: '2px' }}>{f}</div>)}
              </div>
            )}

            {/* Expand/collapse story text */}
            <button
              style={{ ...S.button('secondary'), fontSize: '11px', marginBottom: '12px' }}
              onClick={() => setExpanded(expanded === story.id ? null : story.id)}
            >
              {expanded === story.id ? 'Hide Preview' : 'Preview Story'}
            </button>

            {expanded === story.id && (
              <div style={{
                maxHeight: '300px', overflow: 'auto', fontSize: '12px', lineHeight: '1.6',
                padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                marginBottom: '12px',
              }}>
                {story.bookData?.pages?.map((p: any, i: number) => (
                  <p key={i} style={{ marginBottom: '8px' }}>{p.text}</p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button style={S.button('success')} onClick={() => onApprove(story.id)}>Approve</button>
              <button style={S.button('danger')} onClick={() => onReject(story.id)}>Reject</button>
              {story.conceptId && (
                <button style={S.button('secondary')} onClick={() => onRegenerate(story.id)}>Regenerate</button>
              )}
              <button
                style={S.button(story.featured ? 'primary' : 'secondary')}
                onClick={() => onToggleFeatured(story.id)}
              >
                {story.featured ? 'Unfeature' : 'Feature'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIBRARY TAB
// ═══════════════════════════════════════════════════════════════════════════

function LibraryTab({
  stories, onPublish, onUnpublish, onToggleFeatured, onSetBookOfDay, onRegenerate,
}: {
  stories: GeneratedStory[];
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onSetBookOfDay: (id: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? stories
    : filter === 'published' ? stories.filter(s => s.status === 'published')
    : filter === 'unpublished' ? stories.filter(s => s.status === 'approved')
    : stories.filter(s => s.bucket === filter);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'published', 'unpublished', ...Object.keys(BUCKET_LABELS)].map(f => (
          <button
            key={f}
            style={S.tab(filter === f)}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'published' ? 'Published' : f === 'unpublished' ? 'Unpublished' : BUCKET_LABELS[f as LibraryBucket] || f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '40px', color: '#8a7a9a' }}>
          No stories in this category
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map(story => (
            <div key={story.id} style={S.card}>
              <div
                style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}
                dangerouslySetInnerHTML={{ __html: generateCoverSVG(story.title, story.bucket) }}
              />
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>{story.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                <span style={S.badge(story.status === 'published' ? '#2a6a3a' : '#6a5a2a')}>
                  {story.status}
                </span>
                <span style={S.badge('rgba(124,92,191,0.4)')}>{story.genre}</span>
                <span style={S.badge('rgba(255,255,255,0.08)')}>{story.ageGroup}</span>
                <span style={S.qualityBadge(story.qualityScore)}>QC {story.qualityScore}/10</span>
                {story.featured && <span style={S.badge('#c9a020')}>Featured</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#8a7a9a', marginBottom: '12px' }}>
                {story.wordCount} words | {story.pageCount} pages | {story.bucket}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {story.status !== 'published' ? (
                  <button style={S.button('success')} onClick={() => onPublish(story.id)}>Publish</button>
                ) : (
                  <button style={S.button('secondary')} onClick={() => onUnpublish(story.id)}>Unpublish</button>
                )}
                <button
                  style={S.button(story.featured ? 'primary' : 'secondary')}
                  onClick={() => onToggleFeatured(story.id)}
                >
                  {story.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button style={S.button('secondary')} onClick={() => onSetBookOfDay(story.id)}>
                  Book of Day
                </button>
                {story.conceptId && (
                  <button style={S.button('secondary')} onClick={() => onRegenerate(story.id)}>Regen</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURED TAB
// ═══════════════════════════════════════════════════════════════════════════

function FeaturedTab({
  stories, allStories, onSetBookOfDay, onToggleFeatured,
}: {
  stories: GeneratedStory[];
  allStories: GeneratedStory[];
  onSetBookOfDay: (id: string) => void;
  onToggleFeatured: (id: string) => void;
}) {
  return (
    <div>
      <div style={S.card}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Featured Stories & Book of the Day</div>
        <div style={{ fontSize: '12px', color: '#8a7a9a', marginBottom: '16px' }}>
          Featured stories appear prominently in the library. Book of the Day is the hero card.
        </div>

        {stories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8a7a9a' }}>
            No featured stories yet. Feature stories from the Review or Library tabs.
          </div>
        ) : (
          <div style={S.grid}>
            {stories.map(story => (
              <div key={story.id} style={{ ...S.card, border: '1px solid rgba(201,160,255,0.2)' }}>
                <div
                  style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}
                  dangerouslySetInnerHTML={{ __html: generateCoverSVG(story.title, story.bucket) }}
                />
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>{story.title}</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={S.badge('rgba(124,92,191,0.4)')}>{story.genre}</span>
                  <span style={S.badge('rgba(255,255,255,0.08)')}>{story.ageGroup}</span>
                  <span style={S.qualityBadge(story.qualityScore)}>QC {story.qualityScore}/10</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.button('primary')} onClick={() => onSetBookOfDay(story.id)}>
                    Set as Book of Day
                  </button>
                  <button style={S.button('secondary')} onClick={() => onToggleFeatured(story.id)}>
                    Unfeature
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick-feature from approved stories */}
      {allStories.filter(s => !s.featured).length > 0 && (
        <div style={{ ...S.card, marginTop: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Quick Feature</div>
          <div style={{ fontSize: '12px', color: '#8a7a9a', marginBottom: '12px' }}>
            Click to feature any approved/published story:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allStories.filter(s => !s.featured).map(story => (
              <button
                key={story.id}
                style={S.button('secondary')}
                onClick={() => onToggleFeatured(story.id)}
              >
                {story.title} ({story.qualityScore}/10)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
