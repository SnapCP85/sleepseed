import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getLibraryStories, getBookOfDay, getFeaturedLibraryStories, addToFavourites, removeFromFavourites } from '../lib/storage';
import { generateCoverSVG } from '../lib/svg-cover-generator';
import type { LibraryStory } from '../lib/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function vibeToBucket(vibe?: string): string {
  if (!vibe) return 'wonder-cozy';
  const map: Record<string, string> = {
    calm: 'wonder-cozy', cosy: 'wonder-cozy', heartfelt: 'emotional-truth',
    exciting: 'funny-playful', adventure: 'funny-playful',
    funny: 'funny-playful', silly: 'funny-playful',
    mysterious: 'wonder-cozy', dreamy: 'wonder-cozy',
    brave: 'emotional-truth', wonder: 'wonder-cozy',
    therapeutic: 'emotional-truth', comedy: 'funny-playful',
  };
  return map[vibe] || 'wonder-cozy';
}

const AGE_LABELS: Record<string, string> = {
  age3: '3–5', age5: '5–7', age7: '7–9', age10: '9+',
};

const VIBE_LABELS: Record<string, string> = {
  calm: 'Cozy', cosy: 'Cozy', heartfelt: 'Heartfelt', exciting: 'Adventure',
  adventure: 'Adventure', funny: 'Funny', silly: 'Silly', mysterious: 'Mystery',
  dreamy: 'Dreamy', brave: 'Brave', wonder: 'Wonder', therapeutic: 'Heartfelt',
  comedy: 'Funny',
};

function subtitle(s: LibraryStory): string {
  if (s.refrain) return s.refrain;
  if (s.theme && s.theme.length < 80) return s.theme;
  const hooks: Record<string, string[]> = {
    calm: ['A gentle tale to drift away with', 'Soft whispers beneath the stars'],
    exciting: ['An adventure that sparks wonder', 'Beyond the horizon, magic awaits'],
    funny: ['Giggles guaranteed before lights out', 'A twist no one saw coming'],
    heartfelt: ['A story that warms the heart', 'Some stories stay with you forever'],
    brave: ['Courage blooms in the moonlight', 'When fear meets a brave little heart'],
    dreamy: ['Float away on a cloud of wonder', 'A journey through fields of stardust'],
    mysterious: ['Secrets whisper in the starlight', 'Not everything is as it seems'],
  };
  const key = s.mood || s.vibe || '';
  const pool = hooks[key] || hooks['calm'] || ['A bedtime story to treasure'];
  let h = 0;
  for (let i = 0; i < (s.title || '').length; i++) h = (h * 31 + s.title.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--amber:#F5B84C;--teal:#14d890;--cream:#F4EFE8;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes dFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes dTwinkle{0%,100%{opacity:.05}50%{opacity:.2}}

.lb{min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 50%,#0f0a20 100%);font-family:var(--sans);color:var(--cream);position:relative;overflow-x:hidden}
.lb-inner{max-width:960px;margin:0 auto;padding:0 16px 32px;position:relative;z-index:5}
@media(min-width:768px){.lb-inner{padding:0 32px 32px}}
.lb-star{position:fixed;border-radius:50%;background:#EEE8FF;pointer-events:none;z-index:0}

/* header */
.lb-hdr{padding:44px 0 6px;text-align:center}

/* filter bar */
.lb-bar{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:12px 14px;margin-bottom:14px}
.lb-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.lb-bar-row:last-child{margin-bottom:0}

/* search */
.lb-search{position:relative;flex:1}
.lb-search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(244,239,232,.22)}
.lb-search-ico svg{width:14px;height:14px;display:block}
.lb-search input{width:100%;padding:9px 14px 9px 34px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);font-size:13px;color:var(--cream);font-family:var(--sans);outline:none;transition:border-color .2s}
.lb-search input::placeholder{color:rgba(244,239,232,.18)}
.lb-search input:focus{border-color:rgba(245,184,76,.3)}

/* chips */
.lb-chips{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;flex:1}
.lb-chips::-webkit-scrollbar{display:none}
.lb-chip{flex-shrink:0;padding:6px 12px;border-radius:18px;font-size:11px;font-family:var(--sans);font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);color:rgba(244,239,232,.32);transition:all .2s;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;gap:3px}
.lb-chip:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12)}
.lb-chip.on{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.28);color:#F5B84C;font-weight:600}

/* surprise button */
.lb-surprise{flex-shrink:0;padding:6px 14px;border-radius:18px;font-size:11px;font-family:var(--sans);font-weight:600;cursor:pointer;border:1px solid rgba(201,160,255,.2);background:rgba(201,160,255,.06);color:#c9a0ff;transition:all .2s;display:flex;align-items:center;gap:4px;-webkit-tap-highlight-color:transparent}
.lb-surprise:hover{background:rgba(201,160,255,.12);border-color:rgba(201,160,255,.35)}

/* tonight hero */
.lb-hero{border-radius:18px;overflow:hidden;cursor:pointer;position:relative;border:1px solid rgba(245,184,76,.1);margin-bottom:20px;transition:transform .2s}
.lb-hero:hover{transform:translateY(-2px)}
.lb-hero-cover{position:relative;overflow:hidden}
.lb-hero-cover svg{display:block;width:100%;height:auto}
.lb-hero-fade{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.92));pointer-events:none}
.lb-hero-body{position:absolute;bottom:0;left:0;right:0;padding:16px 18px 18px;z-index:2}

/* section label */
.lb-sec{display:flex;align-items:center;justify-content:space-between;margin:18px 0 10px}
.lb-sec-label{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(244,239,232,.25)}

/* staff picks scroll */
.lb-picks{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding:0 0 16px;-webkit-overflow-scrolling:touch}
.lb-picks::-webkit-scrollbar{display:none}
.lb-pick{flex-shrink:0;width:200px;border-radius:14px;overflow:hidden;cursor:pointer;border:1px solid rgba(245,184,76,.1);transition:all .2s;position:relative}
.lb-pick:hover{transform:translateY(-2px);border-color:rgba(245,184,76,.2)}
.lb-pick-cover{position:relative;overflow:hidden}
.lb-pick-cover svg{display:block;width:100%;height:auto}
.lb-pick-fade{position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.88));pointer-events:none}
.lb-pick-title{position:absolute;bottom:8px;left:10px;right:10px;font-family:var(--serif);font-size:13px;font-weight:600;color:var(--cream);line-height:1.25;z-index:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lb-pick-badge{position:absolute;top:7px;left:7px;font-family:var(--mono);font-size:7px;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:6px;background:rgba(245,184,76,.12);border:1px solid rgba(245,184,76,.18);color:#F5B84C;z-index:3}

/* story grid */
.lb-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
@media(min-width:600px){.lb-grid{gap:14px}}

/* story card */
.lb-card{border:1px solid rgba(255,255,255,.05);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .22s;animation:dFadeUp .4s ease both}
.lb-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.12)}
.lb-card-cover{position:relative;overflow:hidden}
.lb-card-cover svg{display:block;width:100%;height:auto}
.lb-card-fade{position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.88));pointer-events:none}
.lb-card-title{position:absolute;bottom:8px;left:10px;right:10px;font-family:var(--serif);font-size:12.5px;font-weight:600;color:var(--cream);line-height:1.3;z-index:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lb-card-meta{padding:9px 10px 10px;display:flex;flex-direction:column;gap:5px}
.lb-card-sub{font-family:var(--sans);font-size:11px;font-style:italic;color:rgba(244,239,232,.32);line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.lb-card-row{display:flex;align-items:center;justify-content:space-between;gap:6px}
.lb-card-pills{display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden}
.lb-card-pill{font-family:var(--mono);font-size:8px;letter-spacing:.03em;padding:2px 6px;border-radius:5px;background:rgba(255,255,255,.04);color:rgba(244,239,232,.28);white-space:nowrap;text-transform:uppercase}
.lb-card-fav{display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(244,239,232,.15);transition:color .15s;background:none;border:none;padding:2px;font-size:15px;flex-shrink:0}
.lb-card-fav:hover{color:var(--amber)}
.lb-card-fav.on{color:#F5B84C}
.lb-card-dl{display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(244,239,232,.15);transition:color .15s;background:none;border:none;padding:2px;font-size:13px;flex-shrink:0}
.lb-card-dl:hover{color:var(--amber)}

/* sort toggle */
.lb-sort{display:flex;gap:2px;background:rgba(255,255,255,.025);border-radius:9px;padding:2px;border:1px solid rgba(255,255,255,.05);flex-shrink:0}
.lb-sort-btn{padding:5px 9px;border-radius:7px;font-size:9px;font-weight:600;cursor:pointer;border:none;font-family:var(--mono);transition:all .18s;color:rgba(244,239,232,.22);background:transparent}
.lb-sort-btn.on{background:rgba(245,184,76,.08);color:var(--amber)}

/* age pills inline */
.lb-age-pills{display:flex;gap:3px;flex-shrink:0}
.lb-age-pill{padding:5px 9px;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.05);font-family:var(--mono);transition:all .18s;color:rgba(244,239,232,.22);background:transparent}
.lb-age-pill.on{background:rgba(126,200,227,.1);border-color:rgba(126,200,227,.25);color:#7ec8e3}

/* promo */
.lb-promo{border-radius:14px;padding:18px 20px;text-align:center;margin-bottom:16px}

/* lock */
.lb-lock{position:relative}
.lb-lock-over{position:absolute;inset:0;background:rgba(6,9,18,.7);backdrop-filter:blur(6px);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;padding:16px}

/* create bridge */
.lb-create{border-radius:14px;padding:18px;text-align:center;background:rgba(245,184,76,.02);border:1px solid rgba(245,184,76,.08);margin-bottom:18px;cursor:pointer;transition:background .2s}
.lb-create:hover{background:rgba(245,184,76,.05)}

/* load more */
.lb-more{display:flex;justify-content:center;padding:16px 0 24px}
.lb-more-btn{padding:10px 28px;border-radius:50px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);color:rgba(244,239,232,.3);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s}
.lb-more-btn:hover{border-color:rgba(255,255,255,.14);color:var(--cream)}

.lb-empty{text-align:center;padding:48px 20px;color:rgba(244,239,232,.3)}
`;

// ── Mood / age chips ─────────────────────────────────────────────────────────

const MOOD_CHIPS = [
  { label: 'All',       emoji: '',   value: '' },
  { label: 'Cozy',      emoji: '\u{1F9F8}', value: 'calm' },
  { label: 'Adventure', emoji: '\u{1F5FA}\uFE0F', value: 'exciting' },
  { label: 'Funny',     emoji: '\u{1F604}', value: 'funny' },
  { label: 'Wonder',    emoji: '\u2728', value: 'heartfelt' },
  { label: 'Brave',     emoji: '\u{1F981}', value: 'brave' },
  { label: 'Mystery',   emoji: '\u{1F52E}', value: 'mysterious' },
  { label: 'Dreamy',    emoji: '\u{1F319}', value: 'dreamy' },
];

const AGE_CHIPS = [
  { label: 'All ages', value: '' },
  { label: '3–5',      value: 'age3' },
  { label: '5–7',      value: 'age5' },
  { label: '7–9',      value: 'age7' },
  { label: '9+',       value: 'age10' },
];

const SORT_OPTIONS: { label: string; value: 'recent' | 'popular' | 'thumbs' }[] = [
  { label: 'Recent',  value: 'recent' },
  { label: 'Popular', value: 'popular' },
  { label: 'Top',     value: 'thumbs' },
];

// ── Cover renderer ───────────────────────────────────────────────────────────

function StoryCover({ story }: { story: LibraryStory }) {
  if (story.coverUrl) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <img
          src={story.coverUrl}
          alt={story.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  const bucket = (story as any).bookData?.metadata?.bucket || vibeToBucket(story.vibe || story.mood);
  const svg = useMemo(() => generateCoverSVG(story.title, bucket), [story.title, bucket]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LibraryHome() {
  const { user, setView, setLibraryStorySlug, isSubscribed } = useApp();
  const [stories, setStories] = useState<LibraryStory[]>([]);
  const [bookOfDay, setBookOfDay] = useState<LibraryStory | null>(null);
  const [staffPicks, setStaffPicks] = useState<LibraryStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'thumbs'>('recent');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const debounceRef = useRef<any>(null);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  const isGuest = !user || user.isGuest;
  const isFree = user && !user.isGuest && !isSubscribed;

  const toggleFav = (storyId: string) => {
    if (!user || user.isGuest) return;
    const next = new Set(favSet);
    if (next.has(storyId)) { next.delete(storyId); removeFromFavourites(user.id, storyId).catch(() => {}); }
    else { next.add(storyId); addToFavourites(user.id, storyId).catch(() => {}); }
    setFavSet(next);
  };

  useEffect(() => {
    Promise.all([
      getBookOfDay(),
      getFeaturedLibraryStories(10),
      getLibraryStories({ limit: 20, orderBy: 'recent' }),
    ]).then(([bod, picks, all]) => {
      setBookOfDay(bod);
      setStaffPicks(picks);
      setStories(all);
      setHasMore(all.length >= 20);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setPage(0);
      getLibraryStories({
        ageGroup: filterAge || undefined,
        mood: filterMood || undefined,
        search: search || undefined,
        orderBy: sortBy,
        limit: 20,
        offset: 0,
      }).then(data => {
        setStories(data);
        setHasMore(data.length >= 20);
        setLoading(false);
      });
    }, search ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, filterAge, filterMood, sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    getLibraryStories({
      ageGroup: filterAge || undefined, mood: filterMood || undefined,
      search: search || undefined, orderBy: sortBy,
      limit: 20, offset: nextPage * 20,
    }).then(data => {
      setStories(prev => [...prev, ...data]);
      setHasMore(data.length >= 20);
      setPage(nextPage);
    });
  };

  const surpriseMe = () => {
    const pool = stories.length > 0 ? stories : staffPicks;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    openStory(pick);
  };

  const openStory = (story: LibraryStory) => {
    setLibraryStorySlug(story.librarySlug);
    setView('library-story');
    const url = new URL(window.location.href);
    url.searchParams.set('library', story.librarySlug);
    window.history.pushState({}, '', url.toString());
  };

  const guestLimit = 5;
  const heroStory = bookOfDay || (staffPicks.length > 0 ? staffPicks[0] : null);
  const staffPickIds = useMemo(() => new Set(staffPicks.map(s => s.id)), [staffPicks]);
  const isFiltering = !!search || !!filterMood || !!filterAge;

  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 25; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 35,
      s: 1 + Math.random() * 0.5, d: 3 + Math.random() * 4, dl: Math.random() * 5,
    });
    return arr;
  }, []);

  return (
    <div className="lb">
      <style>{CSS}</style>

      {stars.map((s, i) => (
        <div key={i} className="lb-star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s,
          animation: `dTwinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}

      <div className="lb-inner">

        {/* ═══ HEADER ═══ */}
        <div className="lb-hdr" style={{ animation: 'dFadeUp .5s ease-out' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3, marginBottom: 3 }}>
            Discover
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,239,232,.25)', letterSpacing: '.03em' }}>
            Bedtime stories from the SleepSeed library
          </div>
        </div>

        {/* ═══ FILTER BAR ═══ */}
        <div className="lb-bar" style={{ animation: 'dFadeUp .5s .1s ease-out both' }}>
          {/* Row 1: Search + Surprise Me */}
          <div className="lb-bar-row">
            <div className="lb-search">
              <span className="lb-search-ico">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
                </svg>
              </span>
              <input placeholder="Search stories..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="lb-surprise" onClick={surpriseMe}>
              <span>{'\u2728'}</span> Surprise me
            </button>
          </div>

          {/* Row 2: Mood chips */}
          <div className="lb-bar-row">
            <div className="lb-chips">
              {MOOD_CHIPS.map(c => (
                <button
                  key={c.value || 'all'}
                  className={`lb-chip${(c.value === '' ? filterMood === '' : filterMood === c.value) ? ' on' : ''}`}
                  onClick={() => setFilterMood(c.value === '' ? '' : (filterMood === c.value ? '' : c.value))}
                >
                  {c.emoji && <span>{c.emoji}</span>}
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Age + Sort */}
          <div className="lb-bar-row">
            <div className="lb-age-pills">
              {AGE_CHIPS.map(c => (
                <button
                  key={c.value || 'all-ages'}
                  className={`lb-age-pill${(c.value === '' ? filterAge === '' : filterAge === c.value) ? ' on' : ''}`}
                  onClick={() => setFilterAge(c.value === '' ? '' : (filterAge === c.value ? '' : c.value))}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div className="lb-sort">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} className={`lb-sort-btn${sortBy === opt.value ? ' on' : ''}`} onClick={() => setSortBy(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ TONIGHT'S STORY (compact card) ═══ */}
        {heroStory && !isFiltering && (
          <div style={{ animation: 'dFadeUp .5s .2s ease-out both', marginBottom: 8 }}>
            <div className="lb-sec" style={{ marginTop: 0 }}>
              <span className="lb-sec-label" style={{ color: 'rgba(245,184,76,.4)' }}>Tonight's story</span>
            </div>
            <div
              onClick={() => openStory(heroStory)}
              style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 12px', borderRadius: 14,
                border: '1px solid rgba(245,184,76,.12)',
                background: 'rgba(245,184,76,.03)',
                cursor: 'pointer', transition: 'transform .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ width: 80, flexShrink: 0, borderRadius: 10, overflow: 'hidden' }}>
                <StoryCover story={heroStory} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 600, color: 'var(--cream)', lineHeight: 1.25, marginBottom: 3 }}>
                  {heroStory.title}
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontStyle: 'italic', fontSize: 11, color: 'rgba(244,239,232,.35)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {subtitle(heroStory)}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(245,184,76,.5)', letterSpacing: '.04em', flexShrink: 0 }}>
                READ {'\u2192'}
              </div>
            </div>
          </div>
        )}

        {/* ═══ GUEST PROMO ═══ */}
        {isGuest && !search && (
          <div className="lb-promo" style={{ background: 'rgba(245,184,76,.025)', border: '1px solid rgba(245,184,76,.1)' }}>
            <div style={{ fontSize: 13, color: 'rgba(244,239,232,.45)', lineHeight: 1.6, marginBottom: 10 }}>
              Create a free account to save favourites and vote
            </div>
            <button onClick={() => setView('auth')} style={{
              padding: '9px 22px', borderRadius: 50, border: 'none',
              background: 'var(--amber)', color: '#120800',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
            }}>
              Sign up free
            </button>
          </div>
        )}
        {isFree && !search && (
          <div className="lb-promo" style={{ background: 'rgba(20,216,144,.025)', border: '1px solid rgba(20,216,144,.1)' }}>
            <div style={{ fontSize: 13, color: 'rgba(244,239,232,.45)', lineHeight: 1.6, marginBottom: 10 }}>
              Personalise any story — make your child the hero
            </div>
            <button onClick={() => setView('public')} style={{
              padding: '9px 22px', borderRadius: 50, border: 'none',
              background: 'var(--teal)', color: '#021008',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
            }}>
              See Family plan
            </button>
          </div>
        )}

        {/* ═══ STAFF PICKS (horizontal scroll) ═══ */}
        {staffPicks.length > 0 && !isFiltering && (
          <div style={{ animation: 'dFadeUp .5s .25s ease-out both' }}>
            <div className="lb-sec">
              <span className="lb-sec-label">Staff picks</span>
            </div>
            <div className="lb-picks">
              {staffPicks.map(s => (
                <div key={s.id} className="lb-pick" onClick={() => openStory(s)}>
                  <div className="lb-pick-cover">
                    <StoryCover story={s} />
                    <div className="lb-pick-fade" />
                    <div className="lb-pick-title">{s.title}</div>
                    <span className="lb-pick-badge">Staff pick</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CREATE BRIDGE ═══ */}
        {!isGuest && !isFiltering && (
          <div className="lb-create" onClick={() => setView('ritual-starter')} style={{ animation: 'dFadeUp .5s .3s ease-out both' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 300, color: 'rgba(244,239,232,.5)', marginBottom: 3 }}>
              Have your own story to tell tonight?
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(245,184,76,.4)', letterSpacing: '.04em' }}>
              Create a story {'\u2192'}
            </div>
          </div>
        )}

        {/* ═══ ALL STORIES ═══ */}
        <div className="lb-sec" style={{ animation: 'dFadeUp .5s .32s ease-out both' }}>
          <span className="lb-sec-label">All stories</span>
        </div>

        {loading && stories.length === 0 ? (
          <div className="lb-empty">
            <div style={{ fontSize: 32, marginBottom: 10 }}>{'\u{1F319}'}</div>
            <div style={{ fontSize: 13 }}>Loading stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="lb-empty">
            <div style={{ fontSize: 32, marginBottom: 10 }}>{'\u{1F4DA}'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>No stories found</div>
            <div style={{ fontSize: 12 }}>Try a different search or filter.</div>
          </div>
        ) : (
          <div className="lb-grid">
            {stories.map((s, i) => {
              const locked = isGuest && i >= guestLimit;
              const isFav = favSet.has(s.id);
              const isPick = staffPickIds.has(s.id);
              return (
                <div key={s.id} className={locked ? 'lb-lock' : ''} style={{ animationDelay: `${0.32 + i * 0.03}s` }}>
                  <div className="lb-card" onClick={() => !locked && openStory(s)} style={locked ? { filter: 'blur(3px)', pointerEvents: 'none' as const } : {}}>
                    <div className="lb-card-cover" style={{ position: 'relative' }}>
                      <StoryCover story={s} />
                      <div className="lb-card-fade" />
                      <div className="lb-card-title">{s.title}</div>
                      {isPick && <span className="lb-pick-badge">Staff pick</span>}
                    </div>
                    <div className="lb-card-meta">
                      <div className="lb-card-sub">{subtitle(s)}</div>
                      <div className="lb-card-row">
                        <div className="lb-card-pills">
                          {s.ageGroup && AGE_LABELS[s.ageGroup] && (
                            <span className="lb-card-pill">{AGE_LABELS[s.ageGroup]}</span>
                          )}
                          {(s.vibe || s.mood) && VIBE_LABELS[s.vibe || s.mood || ''] && (
                            <span className="lb-card-pill">{VIBE_LABELS[s.vibe || s.mood || '']}</span>
                          )}
                        </div>
                        <button className="lb-card-dl"
                          title="Download PDF"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const { getLibraryStoryBySlug } = await import('../lib/storage');
                            const { generateStoryPdf } = await import('../lib/shareUtils');
                            const full = await getLibraryStoryBySlug(s.librarySlug);
                            if (!full?.bookData) { alert('Could not load story data.'); return; }
                            const bd = full.bookData;
                            await generateStoryPdf({
                              title: full.title || s.title || 'Story',
                              heroName: full.heroName || s.heroName || '',
                              refrain: bd.refrain,
                              pages: bd.pages,
                              isAdventure: bd.isAdventure,
                              setup_pages: bd.setup_pages,
                              path_a: bd.path_a,
                              path_b: bd.path_b,
                            });
                          }}>
                          {'\u2B07'}
                        </button>
                        <button className={`lb-card-fav${isFav ? ' on' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
                          {isFav ? '\u2605' : '\u2606'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {locked && (
                    <div className="lb-lock-over">
                      <div style={{ fontSize: 12, color: 'rgba(244,239,232,.5)', textAlign: 'center', lineHeight: 1.5 }}>Create a free account to read all stories</div>
                      <button onClick={() => setView('auth')} style={{
                        padding: '7px 16px', borderRadius: 50, border: 'none',
                        background: 'var(--amber)', color: '#120800',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
                      }}>
                        Sign up free
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasMore && !isGuest && stories.length > 0 && (
          <div className="lb-more">
            <button className="lb-more-btn" onClick={loadMore}>Load more stories</button>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        {isSubscribed && (
          <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,.03)', marginTop: 16 }}>
            <button
              onClick={() => setView('story-library')}
              style={{
                padding: '9px 22px', borderRadius: 50, fontSize: 12, fontWeight: 600,
                border: '1px solid rgba(245,184,76,.15)', background: 'rgba(245,184,76,.03)',
                color: 'var(--amber)', cursor: 'pointer', fontFamily: 'var(--sans)',
                transition: 'background .18s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,184,76,.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,184,76,.03)')}
            >
              Add your story to the library
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
