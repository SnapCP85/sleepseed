import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getLibraryStories, getBookOfDay, getFeaturedLibraryStories, getCharacters, addToFavourites, removeFromFavourites } from '../lib/storage';
import { getSceneByVibe } from '../lib/storyScenes';
import type { LibraryStory } from '../lib/types';
import type { Character } from '../lib/types';

function strHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function sceneSeed(title: string, heroName: string): number {
  return parseInt(strHash(title + (heroName || '')), 36) || 0;
}

const COVER_PALETTES = [
  { bg: 'linear-gradient(145deg,#251838,#140d28)', accent: '#b48cff' },
  { bg: 'linear-gradient(145deg,#122038,#080e24)', accent: '#68b8ff' },
  { bg: 'linear-gradient(145deg,#261c08,#16100a)', accent: '#F5B84C' },
  { bg: 'linear-gradient(145deg,#102418,#081410)', accent: '#5DCAA5' },
  { bg: 'linear-gradient(145deg,#28101e,#180812)', accent: '#ff82b8' },
  { bg: 'linear-gradient(145deg,#240c10,#14080a)', accent: '#ff7878' },
];

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--amber:#F5B84C;--teal:#14d890;--cream:#F4EFE8;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes lFloat{0%,100%{transform:translateY(0) translate(-50%,-50%)}50%{transform:translateY(-6px) translate(-50%,-50%)}}

.lh{min-height:100dvh;background:#060912;font-family:var(--sans);color:#F4EFE8;padding:0;display:flex;flex-direction:column}

/* header */
.lh-header{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 0;margin-bottom:16px}
.lh-header-title{font-family:var(--serif);font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#F4EFE8}
.lh-header-btn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(234,242,255,.5);transition:all .18s}
.lh-header-btn:hover{border-color:rgba(255,255,255,.2);color:#F4EFE8}
.lh-header-btn svg{width:14px;height:14px}

/* genre pills */
.lh-genres{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;padding:0 20px;margin-bottom:16px}
.lh-genres::-webkit-scrollbar{display:none}
.lh-gpill{flex-shrink:0;padding:6px 13px;border-radius:20px;font-size:10.5px;font-family:var(--mono);cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(234,242,255,.38);transition:all .18s;font-weight:400}
.lh-gpill:hover{border-color:rgba(255,255,255,.18);color:rgba(234,242,255,.55)}
.lh-gpill.on{background:rgba(245,184,76,.12);border-color:rgba(245,184,76,.32);color:#F5B84C;font-weight:600}

/* search */
.lh-search{padding:0 20px;margin-bottom:16px;position:relative}
.lh-search-icon{position:absolute;left:32px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(234,242,255,.3)}
.lh-search-icon svg{width:13px;height:13px;display:block}
.lh-search input{width:100%;padding:10px 12px 10px 32px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);font-size:12px;color:#F4EFE8;font-family:var(--sans);outline:none;transition:border-color .15s}
.lh-search input::placeholder{color:rgba(234,242,255,.3)}
.lh-search input:focus{border-color:rgba(255,255,255,.2)}

/* stats row */
.lh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 20px;margin-bottom:16px}
.lh-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:10px 8px;text-align:center}
.lh-stat-num{font-family:var(--serif);font-size:20px;font-weight:900;color:#F4EFE8;line-height:1.1}
.lh-stat-label{font-family:var(--mono);font-size:7px;letter-spacing:.7px;text-transform:uppercase;color:rgba(234,242,255,.26);margin-top:2px}

/* hero / story of the day */
.lh-hero-label{font-family:var(--mono);font-size:8.5px;letter-spacing:.9px;text-transform:uppercase;color:rgba(20,216,144,.52);margin-bottom:9px;padding:0 20px}
.lh-hero-wrap{padding:0 20px;margin-bottom:16px}
.lh-hero{border-radius:22px;overflow:hidden;cursor:pointer;position:relative;border:1px solid rgba(20,216,144,.16);transition:all .22s;animation:fadeUp .5s ease}
.lh-hero:hover{transform:translateY(-2px)}
.lh-hero-cover{height:112px;position:relative;overflow:hidden}
.lh-hero-glow{position:absolute;top:20%;left:50%;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(20,216,144,.18),transparent 70%);transform:translate(-50%,-50%);pointer-events:none}
.lh-hero-emoji{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;animation:lFloat 3.5s ease-in-out infinite}
.lh-hero-fade{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.85))}
.lh-hero-reads{position:absolute;top:10px;right:12px;font-family:var(--mono);font-size:9px;padding:3px 8px;border-radius:10px;background:rgba(20,216,144,.15);border:1px solid rgba(20,216,144,.25);color:var(--teal)}
.lh-hero-bottom{position:absolute;bottom:0;left:0;right:0;padding:10px 14px 12px;z-index:2}
.lh-hero-title{font-family:var(--serif);font-size:15px;font-weight:900;color:#F4EFE8;line-height:1.25;margin-bottom:2px}
.lh-hero-hook{font-family:var(--sans);font-size:11px;font-style:italic;color:rgba(234,242,255,.5);line-height:1.35}

/* section header with toggle */
.lh-sec-head{display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin-bottom:20px}
.lh-sec-label{font-family:var(--mono);font-size:8.5px;letter-spacing:2px;text-transform:uppercase;color:rgba(234,242,255,.35)}
.lh-toggle{display:flex;gap:2px;background:rgba(255,255,255,.03);border-radius:8px;padding:2px;border:1px solid rgba(255,255,255,.07)}
.lh-toggle-btn{padding:5px 10px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;border:none;font-family:var(--mono);transition:all .15s;color:rgba(234,242,255,.35);background:transparent}
.lh-toggle-btn.on{background:rgba(245,184,76,.12);color:var(--amber)}

/* story grid */
.lh-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 20px;margin-bottom:20px}
.lh-card{border:1px solid rgba(255,255,255,.07);border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s;animation:fadeUp .4s ease both}
.lh-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.14)}
.lh-card-cover{height:88px;position:relative;overflow:hidden}
.lh-card-cover-emoji{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:27px}
.lh-card-cover-fade{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.9))}
.lh-card-cover-title{position:absolute;bottom:6px;left:8px;right:8px;font-family:var(--serif);font-size:11px;font-weight:900;color:#F4EFE8;line-height:1.25;z-index:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lh-card-pick{position:absolute;top:6px;left:6px;font-family:var(--mono);font-size:7px;letter-spacing:.5px;text-transform:uppercase;padding:2px 6px;border-radius:6px;background:rgba(245,184,76,.15);border:1px solid rgba(245,184,76,.25);color:#F5B84C;z-index:3}
.lh-card-meta{padding:9px 10px;background:rgba(0,0,0,.2);display:flex;flex-direction:column;gap:7px}
.lh-card-hook{font-family:var(--sans);font-size:10.5px;font-style:italic;color:rgba(234,242,255,.5);line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.lh-card-bottom{display:flex;align-items:center;justify-content:space-between}
.lh-card-label{font-family:var(--mono);font-size:8px;letter-spacing:.4px;color:rgba(234,242,255,.3);text-transform:uppercase}
.lh-card-star{width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(234,242,255,.2);transition:color .15s;background:none;border:none;padding:0}
.lh-card-star:hover{color:var(--amber)}
.lh-card-star.on{color:#F5B84C}

/* promo */
.lh-promo{margin:16px 20px;border-radius:16px;padding:20px 22px;text-align:center}
.lh-promo.amber{background:rgba(245,184,76,.04);border:1px solid rgba(245,184,76,.18)}
.lh-promo.teal{background:rgba(20,216,144,.04);border:1px solid rgba(20,216,144,.18)}
.lh-promo-text{font-size:14px;color:rgba(234,242,255,.6);line-height:1.65;margin-bottom:12px}
.lh-promo-btn{padding:10px 24px;border-radius:50px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .18s}
.lh-promo-btn.amber{background:var(--amber);color:#120800}
.lh-promo-btn.teal{background:var(--teal);color:#021008}

/* load more */
.lh-more{display:flex;justify-content:center;padding:20px 20px 40px}
.lh-more-btn{padding:10px 28px;border-radius:50px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(234,242,255,.45);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s}
.lh-more-btn:hover{border-color:rgba(255,255,255,.2);color:#F4EFE8}

/* lock */
.lh-lock{position:relative}
.lh-lock-overlay{position:absolute;inset:0;background:rgba(6,9,18,.7);backdrop-filter:blur(6px);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;padding:16px}
.lh-lock-text{font-size:12px;color:rgba(234,242,255,.6);text-align:center;line-height:1.5}
.lh-lock-btn{padding:8px 18px;border-radius:50px;border:none;background:var(--amber);color:#120800;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--sans)}

/* empty */
.lh-empty{text-align:center;padding:48px 20px;color:rgba(234,242,255,.4)}
.lh-empty-ico{font-size:42px;margin-bottom:12px}
.lh-empty-h{font-family:var(--serif);font-size:18px;font-weight:700;color:#F4EFE8;margin-bottom:6px}

/* footer */
.lh-footer{text-align:center;padding:32px 20px;border-top:1px solid rgba(255,255,255,.04);margin-top:40px}
.lh-footer-btn{padding:10px 24px;border-radius:50px;border:1px solid rgba(245,184,76,.25);background:rgba(245,184,76,.06);color:var(--amber);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s;margin-bottom:12px}
.lh-footer-btn:hover{background:rgba(245,184,76,.12)}
`;

const GENRE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Adventure', value: 'exciting' },
  { label: 'Fantasy', value: 'heartfelt' },
  { label: 'Comedy', value: 'funny' },
  { label: 'Magic', value: 'mysterious' },
  { label: 'Wonder', value: 'heartfelt' },
  { label: 'Cozy', value: 'calm' },
  { label: 'Brave', value: 'brave' },
  { label: 'Animals', value: 'dreamy' },
  { label: 'Space', value: 'exciting' },
];

const AGE_LABELS: Record<string, string> = {
  age3: 'Ages 3-5', age5: 'Ages 5-7', age7: 'Ages 7-9', age10: 'Ages 9-11',
};

const MOOD_HOOKS: Record<string, string[]> = {
  calm: ['A gentle tale to drift away with', 'Soft whispers beneath the stars', 'Where quiet dreams take root'],
  exciting: ['An adventure that sparks the imagination', 'Beyond the horizon, wonder awaits', 'What happens when the map runs out?'],
  funny: ['Giggles guaranteed before lights out', 'A twist that no one saw coming', 'Because laughter is the best lullaby'],
  heartfelt: ['A story that warms the heart', 'Where kindness lights the darkest path', 'Some stories stay with you forever'],
  brave: ['Courage blooms in the moonlight', 'A tale of courage under starlight', 'When fear meets a brave little heart'],
  dreamy: ['Float away on a cloud of wonder', 'What happens when dreams escape?', 'A journey through fields of stardust'],
  mysterious: ['Secrets whisper in the starlight', 'Not everything is as it seems', 'A riddle wrapped in moonbeams'],
  '': ['A bedtime story to treasure', 'Tonight belongs to this tale', 'A story waiting just for you'],
};

function pickHook(s: LibraryStory): string {
  const key = s.mood || s.vibe || '';
  const hooks = MOOD_HOOKS[key] || MOOD_HOOKS[''];
  // Deterministic pick based on title hash
  let h = 0;
  for (let i = 0; i < (s.title || '').length; i++) h = (h * 31 + s.title.charCodeAt(i)) | 0;
  return hooks[Math.abs(h) % hooks.length];
}

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
  const [activeChild, setActiveChild] = useState<Character | null>(null);
  const debounceRef = useRef<any>(null);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  const isGuest = !user || user.isGuest;
  const isFree = user && !user.isGuest && !isSubscribed;

  const toggleFav = (storyId: string) => {
    if (!user || user.isGuest) return;
    const next = new Set(favSet);
    if (next.has(storyId)) {
      next.delete(storyId);
      removeFromFavourites(user.id, storyId).catch(() => {});
    } else {
      next.add(storyId);
      addToFavourites(user.id, storyId).catch(() => {});
    }
    setFavSet(next);
  };

  // Load active child for personalization
  useEffect(() => {
    if (!user || user.isGuest) return;
    getCharacters(user.id).then(chars => {
      const family = chars.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
      if (family.length > 0) setActiveChild(family[0]);
    });
  }, [user]);

  // Initial loads — show cached data instantly, refresh in background
  useEffect(() => {
    // Phase 1: instant from cache
    try {
      const cached = JSON.parse(localStorage.getItem('ss_library_cache') || 'null');
      if (cached?.stories?.length) {
        setStories(cached.stories);
        if (cached.bookOfDay) setBookOfDay(cached.bookOfDay);
        if (cached.staffPicks?.length) setStaffPicks(cached.staffPicks);
        setHasMore(cached.stories.length >= 20);
        setLoading(false);
      }
    } catch {}

    // Phase 2: refresh from Supabase
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
      try { localStorage.setItem('ss_library_cache', JSON.stringify({ stories: all.slice(0, 20), bookOfDay: bod, staffPicks: picks.slice(0, 6) })); } catch {}
    });
  }, []);

  // Filter/sort/search changes
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
      ageGroup: filterAge || undefined,
      mood: filterMood || undefined,
      search: search || undefined,
      orderBy: sortBy,
      limit: 20,
      offset: nextPage * 20,
    }).then(data => {
      setStories(prev => [...prev, ...data]);
      setHasMore(data.length >= 20);
      setPage(nextPage);
    });
  };

  const openStory = (story: LibraryStory) => {
    setLibraryStorySlug(story.librarySlug);
    setView('library-story');
    // Persist in URL so refresh works
    const url = new URL(window.location.href);
    url.searchParams.set('library', story.librarySlug);
    window.history.pushState({}, '', url.toString());
  };

  const guestLimit = 5;
  const heroStory = bookOfDay || (staffPicks.length > 0 ? staffPicks[0] : null);

  // Get today's stories
  const todayStr = new Date().toISOString().split('T')[0];
  const newTonight = useMemo(() => stories.filter(s => (s as any).createdAt?.split('T')[0] === todayStr).slice(0, 8), [stories, todayStr]);

  const staffPickIds = useMemo(() => new Set(staffPicks.map(s => s.id)), [staffPicks]);

  const getPalette = (i: number) => COVER_PALETTES[i % 6];

  const isFiltering = !!search || !!filterMood;

  return (
    <div className="lh">
      <style>{CSS}</style>

      {/* HEADER */}
      <header className="lh-header">
        <div className="lh-header-title">Discover</div>
        <button className="lh-header-btn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
            <circle cx="5" cy="4" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="7" cy="12" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </header>

      {/* GENRE PILLS */}
      <div className="lh-genres">
        {GENRE_FILTERS.map((f, i) => {
          const isActive = f.value === '' ? filterMood === '' : filterMood === f.value;
          return (
            <button key={f.label + i} className={`lh-gpill${isActive ? ' on' : ''}`}
              onClick={() => setFilterMood(f.value === '' ? '' : (filterMood === f.value ? '' : f.value))}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH */}
      <div className="lh-search">
        <span className="lh-search-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>
          </svg>
        </span>
        <input placeholder="Search stories, themes, creatures..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* STATS ROW */}
      <div className="lh-stats">
        <div className="lh-stat">
          <div className="lh-stat-num">{stories.length}</div>
          <div className="lh-stat-label">Stories</div>
        </div>
        <div className="lh-stat">
          <div className="lh-stat-num">{newTonight.length}</div>
          <div className="lh-stat-label">Today</div>
        </div>
        <div className="lh-stat">
          <div className="lh-stat-num">{stories.length}</div>
          <div className="lh-stat-label">Reads</div>
        </div>
      </div>

      {/* STORY OF THE DAY */}
      {heroStory && !isFiltering && (
        <>
          <div className="lh-hero-label">STORY OF THE DAY</div>
          <div className="lh-hero-wrap">
            <div className="lh-hero" onClick={() => openStory(heroStory)}>
              <div className="lh-hero-cover" style={{ background: getPalette(0).bg }}>
                <div className="lh-hero-glow" />
                <div className="lh-hero-emoji">{(heroStory as any).emoji || '\u{1F4D6}'}</div>
                <div className="lh-hero-fade" />
                <span className="lh-hero-reads">{(heroStory as any).readCount || stories.length} reads</span>
                <div className="lh-hero-bottom">
                  <div className="lh-hero-title">{heroStory.title}</div>
                  <div className="lh-hero-hook">{pickHook(heroStory)}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CONVERSION PROMPTS */}
      {isGuest && !search && (
        <div className="lh-promo amber">
          <div className="lh-promo-text">Create a free account to vote on stories and save your favourites</div>
          <button className="lh-promo-btn amber" onClick={() => setView('auth')}>Sign up free</button>
        </div>
      )}
      {isFree && !search && (
        <div className="lh-promo teal">
          <div className="lh-promo-text">Upgrade to personalise any story — make your child the hero</div>
          <button className="lh-promo-btn teal" onClick={() => setView('public')}>See Family plan</button>
        </div>
      )}

      {/* ALL STORIES SECTION HEADER */}
      <div className="lh-sec-head">
        <span className="lh-sec-label">ALL STORIES</span>
        <div className="lh-toggle">
          <button className={`lh-toggle-btn${sortBy === 'popular' ? ' on' : ''}`} onClick={() => setSortBy('popular')}>Trending</button>
          <button className={`lh-toggle-btn${sortBy === 'recent' ? ' on' : ''}`} onClick={() => setSortBy('recent')}>New</button>
        </div>
      </div>

      {/* STORY GRID */}
      {loading && stories.length === 0 ? (
        <div className="lh-empty">
          <div className="lh-empty-ico">{'\u{1F319}'}</div>
          <div>Loading stories...</div>
        </div>
      ) : stories.length === 0 ? (
        <div className="lh-empty">
          <div className="lh-empty-ico">{'\u{1F4DA}'}</div>
          <div className="lh-empty-h">No stories found</div>
          <div>Try a different search or filter.</div>
        </div>
      ) : (
        <div className="lh-grid">
          {stories.map((s, i) => {
            const locked = isGuest && i >= guestLimit;
            const palette = getPalette(i);
            const isFav = favSet.has(s.id);
            const isPick = staffPickIds.has(s.id);
            return (
              <div key={s.id} className={locked ? 'lh-lock' : ''} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="lh-card" onClick={() => !locked && openStory(s)} style={locked ? { filter: 'blur(3px)', pointerEvents: 'none' as const } : {}}>
                  <div className="lh-card-cover" style={{ background: palette.bg }}>
                    <div className="lh-card-cover-emoji">{(s as any).emoji || '\u{1F4D6}'}</div>
                    <div className="lh-card-cover-fade" />
                    <div className="lh-card-cover-title">{s.title}</div>
                    {isPick && <span className="lh-card-pick">Staff pick</span>}
                  </div>
                  <div className="lh-card-meta">
                    <div className="lh-card-hook">{pickHook(s)}</div>
                    <div className="lh-card-bottom">
                      <span className="lh-card-label">Read tonight</span>
                      <button className={`lh-card-star${isFav ? ' on' : ''}`}
                        onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
                        {isFav ? '\u2605' : '\u2606'}
                      </button>
                    </div>
                  </div>
                </div>
                {locked && (
                  <div className="lh-lock-overlay">
                    <div className="lh-lock-text">Create a free account to read all stories</div>
                    <button className="lh-lock-btn" onClick={() => setView('auth')}>Sign up free</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !isGuest && stories.length > 0 && (
        <div className="lh-more">
          <button className="lh-more-btn" onClick={loadMore}>Load more stories</button>
        </div>
      )}

      {/* FOOTER */}
      <footer className="lh-footer">
        {isSubscribed && (
          <button className="lh-footer-btn" onClick={() => setView('story-library')}>
            Add your story to the library
          </button>
        )}
      </footer>
    </div>
  );
}
