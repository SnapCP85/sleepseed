import { useApp } from '../../AppContext';

/**
 * Converts a journey chapter JSON (from the API) into the book format
 * that SleepSeedCore's preloadedBook mechanism expects.
 */
function chapterToBookData(chapter: Record<string, unknown>): Record<string, unknown> {
  const bookTitle = (chapter.book_title || chapter.bookTitle) as string || 'Tonight\'s Book';
  const chapterTitle = (chapter.chapter_title || chapter.chapterTitle) as string || '';
  const readNumber = (chapter.read_number || chapter.readNumber) as number || 1;
  const refrain = (chapter.refrain || '') as string;
  const coverPage = (chapter.cover_page || chapter.coverPage) as Record<string, string> | undefined;
  const recapPage = (chapter.recap_page || chapter.recapPage) as Record<string, string> | undefined;
  const openerPage = (chapter.chapter_opener_page || chapter.chapterOpenerPage) as Record<string, unknown> | undefined;
  const storyPages = (chapter.story_pages || chapter.storyPages) as Array<Record<string, string>> | undefined;

  // Build unified pages array matching SleepSeedCore's expected format: [{text: string}]
  const pages: Array<{ text: string }> = [];

  // Cover page
  if (coverPage?.text) {
    pages.push({ text: coverPage.text });
  }

  // Recap page (Reads 2-7)
  if (recapPage?.text && readNumber > 1) {
    pages.push({ text: recapPage.text });
  }

  // Chapter opener
  if (openerPage) {
    const cast = (openerPage.cast as Array<Record<string, string>> || []);
    const castText = cast.map(m => `${m.name} — ${m.role_line || m.roleLine || ''}`).join('\n');
    const title = openerPage.title as string || chapterTitle;
    const teaser = openerPage.teaser as string || '';
    const parts = [title, castText, teaser].filter(Boolean);
    pages.push({ text: parts.join('\n\n') });
  }

  // Story pages
  if (Array.isArray(storyPages)) {
    storyPages.forEach(p => {
      if (p.text) pages.push({ text: p.text });
    });
  }

  return {
    title: `${bookTitle} — ${chapterTitle}`,
    heroName: '', // filled by SleepSeedCore from preloadedCharacter
    refrain,
    pages,
    allChars: [],
    // Journey metadata — SleepSeedCore doesn't use these but they persist
    _isJourneyChapter: true,
    _readNumber: readNumber,
    _isBookComplete: readNumber === 7,
    _chapterTitle: chapterTitle,
    _bookTitle: bookTitle,
  };
}

export default function ChapterHandoff() {
  const { activeChapterOutput, setView, setActiveChapterOutput } = useApp();
  const chapter = activeChapterOutput as Record<string, unknown> | null;

  const handleBeginReading = () => {
    // ChapterHandoff doesn't set preloadedBook directly — it navigates to
    // story-builder. App.tsx handles the conversion (see below).
    setView('story-builder');
  };

  // Expose the converter for App.tsx to use
  (ChapterHandoff as any).chapterToBookData = chapterToBookData;

  return (
    <div style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <h2>{(chapter?.book_title || chapter?.bookTitle) as string || 'Tonight\'s Book'}</h2>
      <p>Read {(chapter?.read_number || chapter?.readNumber) as number} of 7</p>
      <h3>{(chapter?.chapter_title || chapter?.chapterTitle) as string || ''}</h3>
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        {((chapter?.chapter_opener_page as Record<string, unknown>)?.cast as Array<Record<string, string>> || []).map((member, i) => (
          <p key={i} style={{ fontSize: 14 }}><strong>{member.name}</strong> — {member.role_line || member.roleLine}</p>
        ))}
      </div>
      <button onClick={handleBeginReading} style={{ padding: '14px 32px', fontSize: 16, display: 'block', width: '100%', marginBottom: 8 }}>
        Begin tonight's chapter
      </button>
      <button onClick={() => setView('dashboard')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
        Not tonight
      </button>
    </div>
  );
}

// Named export so App.tsx can use the converter directly
export { chapterToBookData };
