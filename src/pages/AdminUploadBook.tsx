import { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { supabase } from '../lib/supabase';
import { saveStory } from '../lib/storage';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

const VIBES = [
  { value: 'calm', label: 'Calm' },
  { value: 'cosy', label: 'Cosy' },
  { value: 'heartfelt', label: 'Heartfelt' },
  { value: 'exciting', label: 'Exciting' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'silly', label: 'Silly' },
  { value: 'funny', label: 'Funny' },
  { value: 'mysterious', label: 'Mysterious' },
];

const AGE_GROUPS = [
  { value: 'age3', label: '2–4 years' },
  { value: 'age5', label: '4–6 years' },
  { value: 'age7', label: '6–8 years' },
  { value: 'age10', label: '8–10+' },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const CSS = `
.au{min-height:100vh;background:#060912;font-family:'Nunito',system-ui,sans-serif;color:#F4EFE8;-webkit-font-smoothing:antialiased}
.au-nav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgba(6,9,18,.95);border-bottom:1px solid rgba(245,184,76,.1);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.au-nav-title{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:#F4EFE8}
.au-nav-title span{color:#F5B84C}
.au-back{background:none;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:inherit}
.au-inner{max-width:560px;margin:0 auto;padding:24px 20px 100px}
.au-h{font-family:'Fraunces',serif;font-size:24px;font-weight:400;margin-bottom:6px}
.au-sub{font-size:13px;color:rgba(244,239,232,.4);margin-bottom:24px}
.au-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px;margin-bottom:16px}
.au-label{font-family:'DM Mono',monospace;font-size:10px;color:rgba(244,239,232,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;display:block}
.au-input{width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#F4EFE8;font-family:inherit;font-size:14px;outline:none;transition:border-color .2s;margin-bottom:14px}
.au-input:focus{border-color:rgba(245,184,76,.4)}
.au-input::placeholder{color:rgba(255,255,255,.18)}
.au-textarea{width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#F4EFE8;font-family:inherit;font-size:13px;outline:none;resize:none;min-height:80px;transition:border-color .2s;margin-bottom:14px}
.au-textarea:focus{border-color:rgba(245,184,76,.4)}
.au-select{width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.1);background:rgba(13,17,32,.9);color:#F4EFE8;font-family:inherit;font-size:14px;outline:none;margin-bottom:14px;cursor:pointer}
.au-btn{width:100%;padding:16px;border:none;border-radius:14px;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
.au-btn-amber{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;box-shadow:0 6px 24px rgba(200,130,20,.3)}
.au-btn-amber:hover{filter:brightness(1.1);transform:translateY(-2px)}
.au-btn-amber:disabled{opacity:.3;cursor:default;transform:none;filter:none}
.au-btn-ghost{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);color:rgba(244,239,232,.5);font-size:13px}
.au-preview{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px;margin-bottom:14px;max-height:400px;overflow-y:auto}
.au-preview-page{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;line-height:1.7;color:rgba(244,239,232,.7)}
.au-preview-page:last-child{border-bottom:none}
.au-preview-num{font-family:'DM Mono',monospace;font-size:9px;color:rgba(245,184,76,.4);margin-bottom:4px}
.au-check{display:flex;align-items:center;gap:10px;margin-bottom:14px;cursor:pointer}
.au-check input{accent-color:#F5B84C;width:16px;height:16px}
.au-check-label{font-size:13px;color:rgba(244,239,232,.6)}
.au-success{text-align:center;padding:40px 20px}
.au-success-ico{font-size:48px;margin-bottom:16px}
.au-success-h{font-family:'Fraunces',serif;font-size:22px;margin-bottom:8px}
.au-success-link{font-family:'DM Mono',monospace;font-size:12px;color:#F5B84C;word-break:break-all}
.au-error{background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.2);border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:13px;color:#ff8080}
.au-loading{text-align:center;padding:40px 20px;color:rgba(244,239,232,.4);font-style:italic}
.au-file-zone{border:2px dashed rgba(245,184,76,.15);border-radius:16px;padding:32px 20px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:14px}
.au-file-zone:hover{border-color:rgba(245,184,76,.3);background:rgba(245,184,76,.02)}
.au-cover-preview{width:120px;height:160px;border-radius:12px;object-fit:cover;border:2px solid rgba(245,184,76,.2);margin-bottom:10px}
`;

export default function AdminUploadBook() {
  const { user, setView } = useApp();

  // Auth guard
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="au">
        <style>{CSS}</style>
        <div className="au-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div className="au-h">Admin Access Required</div>
          <div className="au-sub">This page is restricted to administrators.</div>
          <button className="au-btn au-btn-ghost" onClick={() => setView('dashboard')}>Go home</button>
        </div>
      </div>
    );
  }

  // State
  const [step, setStep] = useState<'upload' | 'metadata' | 'success'>('upload');
  const [converting, setConverting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [bookData, setBookData] = useState<any>(null);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [heroName, setHeroName] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 fields
  const [author, setAuthor] = useState('');
  const [ageGroup, setAgeGroup] = useState('age5');
  const [vibe, setVibe] = useState('calm');
  const [description, setDescription] = useState('');
  const [lessons, setLessons] = useState('');
  const [slug, setSlug] = useState('');
  const [isStaffPick, setIsStaffPick] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [publishedSlug, setPublishedSlug] = useState('');

  // PDF file handler — extract text client-side with pdf.js
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    try {
      // Dynamic import pdf.js from CDN
      const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs' as any);
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      setPdfText(fullText.trim());
      if (!title) {
        // Try to guess title from filename
        const guess = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setTitle(guess);
        setSlug(slugify(guess));
      }
    } catch (err: any) {
      setError(`Failed to read PDF: ${err.message}`);
    }
  };

  // Convert via API
  const handleConvert = async () => {
    if (!pdfText || !title) return;
    setConverting(true);
    setError('');

    try {
      const res = await fetch('/api/convert-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pdfText, title, heroName }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error.message || 'Conversion failed');
        setConverting(false);
        return;
      }

      setBookData(data.bookData);
      setSlug(slugify(title));
      setStep('metadata');
    } catch (err: any) {
      setError(`Conversion failed: ${err.message}`);
    }
    setConverting(false);
  };

  // Cover image handler
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Publish to library
  const handlePublish = async () => {
    if (!bookData || !slug) return;
    setPublishing(true);
    setError('');

    try {
      let coverUrl: string | undefined;

      // Upload cover if provided
      if (coverFile) {
        const path = `${slug}/cover.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('library-covers')
          .upload(path, coverFile, { contentType: coverFile.type, upsert: true });

        if (uploadErr) {
          console.error('[admin] Cover upload failed:', uploadErr);
        } else {
          const { data: urlData } = supabase.storage.from('library-covers').getPublicUrl(path);
          coverUrl = urlData.publicUrl;
        }
      }

      // Save story to database
      const storyId = crypto.randomUUID();
      await saveStory({
        id: storyId,
        userId: user.id,
        title: bookData.title || title,
        heroName: bookData.heroName || heroName,
        characterIds: [],
        date: new Date().toISOString().split('T')[0],
        bookData,
        ageGroup,
        vibe,
        theme: description,
        lessons: lessons.split(',').map((l: string) => l.trim()).filter(Boolean),
        isPublic: true,
        librarySlug: slug,
        coverUrl,
        isStaffPick,
      });

      // Update submitted_at (saveStory doesn't handle this field)
      await supabase.from('stories').update({ submitted_at: new Date().toISOString() }).eq('id', storyId);

      setPublishedSlug(slug);
      setStep('success');
    } catch (err: any) {
      setError(`Publish failed: ${err.message}`);
    }
    setPublishing(false);
  };

  return (
    <div className="au">
      <style>{CSS}</style>
      <nav className="au-nav">
        <button className="au-back" onClick={() => setView('dashboard')}>&larr; Home</button>
        <div className="au-nav-title">Upload <span>Book</span></div>
        <div style={{ width: 60 }} />
      </nav>

      <div className="au-inner">

        {/* ═══════════════════════════════════════════════════════
            STEP 1 — UPLOAD & CONVERT
            ═══════════════════════════════════════════════════════ */}
        {step === 'upload' && (
          <>
            <div className="au-h">Upload a children's book</div>
            <div className="au-sub">Upload a PDF and we'll convert it into SleepSeed story format.</div>

            {error && <div className="au-error">{error}</div>}

            <div className="au-card">
              <input type="file" ref={fileRef} accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
              <div className="au-file-zone" onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F4EFE8', marginBottom: 4 }}>
                  {fileName || 'Select a PDF file'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(244,239,232,.3)' }}>
                  {pdfText ? `${pdfText.length.toLocaleString()} characters extracted` : 'Click to browse'}
                </div>
              </div>

              <label className="au-label">Title</label>
              <input className="au-input" placeholder="The Very Hungry Caterpillar" value={title}
                onChange={e => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }} />

              <label className="au-label">Main character name</label>
              <input className="au-input" placeholder="e.g. Caterpillar, Max, Elmer" value={heroName}
                onChange={e => setHeroName(e.target.value)} />
            </div>

            {converting ? (
              <div className="au-loading">
                <div style={{ fontSize: 28, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>✨</div>
                Converting your book...
              </div>
            ) : (
              <button className="au-btn au-btn-amber" disabled={!pdfText || !title} onClick={handleConvert}>
                Convert Book &rarr;
              </button>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 2 — METADATA & PUBLISH
            ═══════════════════════════════════════════════════════ */}
        {step === 'metadata' && bookData && (
          <>
            <div className="au-h">Review &amp; Publish</div>
            <div className="au-sub">{bookData.pages?.length || 0} pages converted. Review and add metadata.</div>

            {error && <div className="au-error">{error}</div>}

            {/* Page preview */}
            <div className="au-card">
              <label className="au-label">Preview ({bookData.pages?.length} pages)</label>
              <div className="au-preview">
                {bookData.pages?.map((p: any, i: number) => (
                  <div key={i} className="au-preview-page">
                    <div className="au-preview-num">Page {i + 1}</div>
                    {p.text}
                  </div>
                ))}
              </div>
              <button className="au-btn au-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep('upload')}>
                &larr; Re-convert
              </button>
            </div>

            {/* Metadata form */}
            <div className="au-card">
              <label className="au-label">Title</label>
              <input className="au-input" value={title} onChange={e => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }} />

              <label className="au-label">Hero Name</label>
              <input className="au-input" value={heroName} onChange={e => setHeroName(e.target.value)} />

              <label className="au-label">Author</label>
              <input className="au-input" placeholder="Eric Carle" value={author} onChange={e => setAuthor(e.target.value)} />

              <label className="au-label">Age Group</label>
              <select className="au-select" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                {AGE_GROUPS.map(ag => <option key={ag.value} value={ag.value}>{ag.label}</option>)}
              </select>

              <label className="au-label">Vibe (determines cover scene)</label>
              <select className="au-select" value={vibe} onChange={e => setVibe(e.target.value)}>
                {VIBES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>

              <label className="au-label">Description (shown in library)</label>
              <textarea className="au-textarea" placeholder="A classic bedtime story about..." value={description}
                onChange={e => setDescription(e.target.value.slice(0, 200))} maxLength={200} />
              <div style={{ fontSize: 10, color: 'rgba(244,239,232,.2)', textAlign: 'right', marginTop: -10, marginBottom: 10 }}>
                {description.length}/200
              </div>

              <label className="au-label">Lessons / Tags (comma-separated)</label>
              <input className="au-input" placeholder="kindness, courage, nature" value={lessons}
                onChange={e => setLessons(e.target.value)} />

              <label className="au-label">Library Slug</label>
              <input className="au-input" value={slug} onChange={e => setSlug(e.target.value)} />
              <div style={{ fontSize: 10, color: 'rgba(244,239,232,.2)', marginTop: -10, marginBottom: 14 }}>
                /library/{slug}
              </div>

              <label className="au-label">Cover Image (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverSelect}
                style={{ fontSize: 12, color: 'rgba(244,239,232,.5)', marginBottom: 10 }} />
              {coverPreview && (
                <div style={{ marginBottom: 14 }}>
                  <img src={coverPreview} alt="Cover preview" className="au-cover-preview" />
                </div>
              )}

              <div className="au-check" onClick={() => setIsStaffPick(!isStaffPick)}>
                <input type="checkbox" checked={isStaffPick} readOnly />
                <span className="au-check-label">Staff Pick (featured in library)</span>
              </div>
            </div>

            {publishing ? (
              <div className="au-loading">Publishing to library...</div>
            ) : (
              <button className="au-btn au-btn-amber" disabled={!slug} onClick={handlePublish}>
                Publish to Library &rarr;
              </button>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            SUCCESS
            ═══════════════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="au-success">
            <div className="au-success-ico">✅</div>
            <div className="au-success-h">Published to Library!</div>
            <div className="au-sub">Your book is now live in the SleepSeed library.</div>
            <div className="au-success-link">
              <a href={`?library=${publishedSlug}`} style={{ color: '#F5B84C' }}>
                /library/{publishedSlug}
              </a>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button className="au-btn au-btn-ghost" style={{ width: 'auto', padding: '12px 24px' }}
                onClick={() => { setStep('upload'); setBookData(null); setTitle(''); setHeroName(''); setPdfText(''); setFileName(''); setError(''); }}>
                Upload another
              </button>
              <button className="au-btn au-btn-amber" style={{ width: 'auto', padding: '12px 24px' }}
                onClick={() => setView('library')}>
                View Library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
