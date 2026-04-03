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

// ── Upgraded CSS ─────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--amber:#F5B84C;--teal:#14d890;--cream:#F4EFE8;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes dFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes dFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes dTwinkle{0%,100%{opacity:.05}50%{opacity:.2}}
@keyframes dShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

.dsc{min-height:100dvh;background:linear-gradient(180deg,#060912 0%,#0a0e24 50%,#0f0a20 100%);font-family:var(--sans);color:var(--cream);position:relative;overflow-x:hidden}
.dsc-inner{max-width:960px;margin:0 auto;padding:0 20px 32px;position:relative;z-index:5}
@media(min-width:768px){.dsc-inner{padding:0 40px 32px}}
.dsc-star{position:fixed;border-radius:50%;background:#EEE8FF;pointer-events:none;z-index:0}

/* header */
.dsc-header{padding:48px 0 8px;text-align:center}

/* emotional chips */
.dsc-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px 0 12px;-webkit-overflow-scrolling:touch}
.dsc-chips::-webkit-scrollbar{display:none}
.dsc-chip{flex-shrink:0;padding:8px 16px;border-radius:20px;font-size:12px;font-family:var(--sans);font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.4);transition:all .2s cubic-bezier(.16,1,.3,1);-webkit-tap-highlight-color:transparent;display:flex;align-items:center;gap:5px}
.dsc-chip:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14)}
.dsc-chip.on{background:rgba(245,184,76,.1);border-color:rgba(245,184,76,.3);color:#F5B84C;font-weight:600}

/* search */
.dsc-search{position:relative;margin-bottom:16px}
.dsc-search-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(244,239,232,.25)}
.dsc-search-ico svg{width:14px;height:14px;display:block}
.dsc-search input{width:100%;padding:11px 14px 11px 36px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-size:13px;color:var(--cream);font-family:var(--sans);outline:none;transition:border-color .2s}
.dsc-search input::placeholder{color:rgba(244,239,232,.22)}
.dsc-search input:focus{border-color:rgba(245,184,76,.3)}

/* tonight card */
.dsc-tonight{border-radius:20px;overflow:hidden;cursor:pointer;position:relative;border:1px solid rgba(245,184,76,.12);margin-bottom:20px;transition:transform .2s}
.dsc-tonight:hover{transform:translateY(-2px)}
.dsc-tonight-cover{height:130px;position:relative;overflow:hidden}
.dsc-tonight-glow{position:absolute;top:30%;left:50%;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.12),transparent 70%);transform:translate(-50%,-50%);pointer-events:none}
.dsc-tonight-emoji{position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);font-size:42px;animation:dFloat 4s ease-in-out infinite}
.dsc-tonight-fade{position:absolute;bottom:0;left:0;right:0;height:65%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.9))}
.dsc-tonight-body{position:absolute;bottom:0;left:0;right:0;padding:14px 16px 16px;z-index:2}

/* section */
.dsc-sec{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;margin-top:8px}
.dsc-sec-label{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(244,239,232,.3)}
.dsc-toggle{display:flex;gap:2px;background:rgba(255,255,255,.03);border-radius:10px;padding:2px;border:1px solid rgba(255,255,255,.06)}
.dsc-toggle-btn{padding:5px 12px;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;border:none;font-family:var(--mono);transition:all .18s;color:rgba(244,239,232,.3);background:transparent}
.dsc-toggle-btn.on{background:rgba(245,184,76,.1);color:var(--amber)}

/* story grid */
.dsc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px}
.dsc-card{border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .2s;animation:dFadeUp .4s ease both}
.dsc-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.12)}
.dsc-card-cover{height:90px;position:relative;overflow:hidden}
.dsc-card-emoji{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:26px}
.dsc-card-fade{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg,transparent,rgba(6,9,18,.9))}
.dsc-card-title{position:absolute;bottom:8px;left:10px;right:10px;font-family:var(--serif);font-size:12px;font-weight:600;color:var(--cream);line-height:1.3;z-index:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsc-card-pick{position:absolute;top:6px;left:6px;font-family:var(--mono);font-size:7px;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:8px;background:rgba(245,184,76,.12);border:1px solid rgba(245,184,76,.2);color:#F5B84C;z-index:3}
.dsc-card-meta{padding:10px 10px 9px;display:flex;flex-direction:column;gap:6px}
.dsc-card-hook{font-family:var(--sans);font-size:11px;font-style:italic;color:rgba(244,239,232,.4);line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.dsc-card-bottom{display:flex;align-items:center;justify-content:space-between}
.dsc-card-label{font-family:var(--mono);font-size:8px;letter-spacing:.04em;color:rgba(244,239,232,.25);text-transform:uppercase}
.dsc-card-fav{display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(244,239,232,.18);transition:color .15s;background:none;border:none;padding:2px;font-size:14px}
.dsc-card-fav:hover{color:var(--amber)}
.dsc-card-fav.on{color:#F5B84C}

/* create bridge */
.dsc-create{border-radius:16px;padding:20px;text-align:center;background:rgba(245,184,76,.03);border:1px solid rgba(245,184,76,.1);margin-bottom:20px;cursor:pointer;transition:background .2s}
.dsc-create:hover{background:rgba(245,184,76,.06)}

/* promo */
.dsc-promo{border-radius:16px;padding:18px 20px;text-align:center;margin-bottom:16px}

/* lock */
.dsc-lock{position:relative}
.dsc-lock-over{position:absolute;inset:0;background:rgba(6,9,18,.7);backdrop-filter:blur(6px);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;padding:16px}

/* load more */
.dsc-more{display:flex;justify-content:center;padding:16px 0 24px}
.dsc-more-btn{padding:10px 28px;border-radius:50px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.35);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s}
.dsc-more-btn:hover{border-color:rgba(255,255,255,.16);color:var(--cream)}

/* empty */
.dsc-empty{text-align:center;padding:48px 20px;color:rgba(244,239,232,.35)}
`;

// ── Emotional category chips (deduplicated, with emojis) ─────────────────────

const MOOD_CHIPS = [
  { label: 'All',       emoji: '',   value: '' },
  { label: 'Cozy',      emoji: '🧸', value: 'calm' },
  { label: 'Adventure', emoji: '🗺️', value: 'exciting' },
  { label: 'Funny',     emoji: '😄', value: 'funny' },
  { label: 'Wonder',    emoji: '✨', value: 'heartfelt' },
  { label: 'Brave',     emoji: '🦁', value: 'brave' },
  { label: 'Mystery',   emoji: '🔮', value: 'mysterious' },
  { label: 'Dreamy',    emoji: '🌙', value: 'dreamy' },
];

const AGE_CHIPS = [
  { label: 'All ages', value: '' },
  { label: '3-5',      value: 'age3' },
  { label: '5-7',      value: 'age5' },
  { label: '7-9',      value: 'age7' },
  { label: '9+',       value: 'age10' },
];

const SORT_OPTIONS: { label: string; value: 'recent' | 'popular' | 'thumbs' }[] = [
  { label: 'Recent',    value: 'recent' },
  { label: 'Popular',   value: 'popular' },
  { label: 'Top rated', value: 'thumbs' },
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
  let h = 0;
  for (let i = 0; i < (s.title || '').length; i++) h = (h * 31 + s.title.charCodeAt(i)) | 0;
  return hooks[Math.abs(h) % hooks.length];
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

  useEffect(() => {
    if (!user || user.isGuest) return;
    getCharacters(user.id).then(chars => {
      const family = chars.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
      if (family.length > 0) setActiveChild(family[0]);
    });
  }, [user]);

  useEffect(() => {
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
    const url = new URL(window.location.href);
    url.searchParams.set('library', story.librarySlug);
    window.history.pushState({}, '', url.toString());
  };

  const guestLimit = 5;
  const heroStory = bookOfDay || (staffPicks.length > 0 ? staffPicks[0] : null);
  const staffPickIds = useMemo(() => new Set(staffPicks.map(s => s.id)), [staffPicks]);
  const getPalette = (i: number) => COVER_PALETTES[i % 6];
  const isFiltering = !!search || !!filterMood || !!filterAge;

  // Stars
  const stars = useMemo(() => {
    const arr: { x: number; y: number; s: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 30; i++) arr.push({
      x: Math.random() * 100, y: Math.random() * 40,
      s: 1 + Math.random() * 0.6, d: 3 + Math.random() * 4, dl: Math.random() * 5,
    });
    return arr;
  }, []);

  return (
    <div className="dsc">
      <style>{CSS}</style>

      {/* Ambient stars */}
      {stars.map((s, i) => (
        <div key={i} className="dsc-star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s,
          animation: `dTwinkle ${s.d}s ${s.dl}s ease-in-out infinite`,
        }} />
      ))}

      <div className="dsc-inner">

        {/* ═══ HEADER ═══ */}
        <div className="dsc-header" style={{ animation: 'dFadeUp .5s ease-out' }}>
          <div style={{
            fontFamily: "var(--serif)", fontWeight: 300,
            fontSize: 'clamp(22px,5.5vw,28px)', lineHeight: 1.3,
            marginBottom: 4,
          }}>
            Discover
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 11,
            color: 'rgba(244,239,232,.3)', letterSpacing: '.03em',
          }}>
            Bedtime stories from the SleepSeed library
          </div>
        </div>

        {/* ═══ EMOTIONAL CHIPS ═══ */}
        <div className="dsc-chips" style={{ animation: 'dFadeUp .5s .1s ease-out both' }}>
          {MOOD_CHIPS.map(c => {
            const isActive = c.value === '' ? filterMood === '' : filterMood === c.value;
            return (
              <button
                key={c.value || 'all'}
                className={`dsc-chip${isActive ? ' on' : ''}`}
                onClick={() => setFilterMood(c.value === '' ? '' : (filterMood === c.value ? '' : c.value))}
              >
                {c.emoji && <span>{c.emoji}</span>}
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ═══ AGE CHIPS ═══ */}
        <div className="dsc-chips" style={{ animation: 'dFadeUp .5s .12s ease-out both', paddingTop: 0 }}>
          {AGE_CHIPS.map(c => {
            const isActive = c.value === '' ? filterAge === '' : filterAge === c.value;
            return (
              <button
                key={c.value || 'all-ages'}
                className={`dsc-chip${isActive ? ' on' : ''}`}
                onClick={() => setFilterAge(c.value === '' ? '' : (filterAge === c.value ? '' : c.value))}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ═══ SORT + SEARCH ROW ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, animation: 'dFadeUp .5s .15s ease-out both' }}>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: 2, border: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                  cursor: 'pointer', border: 'none', fontFamily: 'var(--mono)',
                  transition: 'all .18s',
                  color: sortBy === opt.value ? 'var(--amber)' : 'rgba(244,239,232,.3)',
                  background: sortBy === opt.value ? 'rgba(245,184,76,.1)' : 'transparent',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="dsc-search" style={{ flex: 1, marginBottom: 0 }}>
          <span className="dsc-search-ico">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>
            </svg>
          </span>
          <input placeholder="Search stories..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ═══ TONIGHT'S STORY (hero card) ═══ */}
        {heroStory && !isFiltering && (
          <div style={{ animation: 'dFadeUp .5s .2s ease-out both' }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: '.08em',
              textTransform: 'uppercase' as const, color: 'rgba(245,184,76,.5)',
              marginBottom: 8,
            }}>
              Tonight's story
            </div>
            <div className="dsc-tonight" onClick={() => openStory(heroStory)}>
              <div className="dsc-tonight-cover" style={{ background: getPalette(0).bg }}>
                <div className="dsc-tonight-glow" />
                <div className="dsc-tonight-emoji">{(heroStory as any).emoji || '\u{2728}'}</div>
                <div className="dsc-tonight-fade" />
                <div className="dsc-tonight-body">
                  <div style={{
                    fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600,
                    color: 'var(--cream)', lineHeight: 1.3, marginBottom: 4,
                  }}>
                    {heroStory.title}
                  </div>
                  <div style={{
                    fontFamily: "'Lora','Fraunces',Georgia,serif",
                    fontStyle: 'italic', fontSize: 12, color: 'rgba(244,239,232,.45)',
                    lineHeight: 1.4,
                  }}>
                    {pickHook(heroStory)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONVERSION PROMPTS ═══ */}
        {isGuest && !search && (
          <div className="dsc-promo" style={{ background: 'rgba(245,184,76,.03)', border: '1px solid rgba(245,184,76,.12)' }}>
            <div style={{ fontSize: 13, color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 12 }}>
              Create a free account to save favourites and vote
            </div>
            <button
              onClick={() => setView('auth')}
              style={{
                padding: '10px 24px', borderRadius: 50, border: 'none',
                background: 'var(--amber)', color: '#120800',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
              }}
            >
              Sign up free
            </button>
          </div>
        )}
        {isFree && !search && (
          <div className="dsc-promo" style={{ background: 'rgba(20,216,144,.03)', border: '1px solid rgba(20,216,144,.12)' }}>
            <div style={{ fontSize: 13, color: 'rgba(244,239,232,.5)', lineHeight: 1.6, marginBottom: 12 }}>
              Personalise any story — make your child the hero
            </div>
            <button
              onClick={() => setView('public')}
              style={{
                padding: '10px 24px', borderRadius: 50, border: 'none',
                background: 'var(--teal)', color: '#021008',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
              }}
            >
              See Family plan
            </button>
          </div>
        )}

        {/* ═══ CREATE YOUR OWN bridge ═══ */}
        {!isGuest && !isFiltering && (
          <div className="dsc-create" onClick={() => setView('ritual-starter')} style={{ animation: 'dFadeUp .5s .3s ease-out both' }}>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 14, fontWeight: 300,
              color: 'rgba(244,239,232,.55)', marginBottom: 4,
            }}>
              Have your own story to tell tonight?
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: 'rgba(245,184,76,.5)',
              letterSpacing: '.04em',
            }}>
              Create a story {'\u2192'}
            </div>
          </div>
        )}

        {/* ═══ ALL STORIES HEADER ═══ */}
        <div className="dsc-sec" style={{ animation: 'dFadeUp .5s .35s ease-out both' }}>
          <span className="dsc-sec-label">All stories</span>
        </div>

        {/* ═══ STORY GRID ═══ */}
        {loading && stories.length === 0 ? (
          <div className="dsc-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>{'\u{1F319}'}</div>
            <div style={{ fontSize: 14 }}>Loading stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="dsc-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>{'\u{1F4DA}'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, color: 'var(--cream)', marginBottom: 6 }}>No stories found</div>
            <div style={{ fontSize: 13 }}>Try a different search or filter.</div>
          </div>
        ) : (
          <div className="dsc-grid">
            {stories.map((s, i) => {
              const locked = isGuest && i >= guestLimit;
              const palette = getPalette(i);
              const isFav = favSet.has(s.id);
              const isPick = staffPickIds.has(s.id);
              return (
                <div key={s.id} className={locked ? 'dsc-lock' : ''} style={{ animationDelay: `${0.35 + i * 0.04}s` }}>
                  <div className="dsc-card" onClick={() => !locked && openStory(s)} style={locked ? { filter: 'blur(3px)', pointerEvents: 'none' as const } : {}}>
                    <div className="dsc-card-cover" style={{ background: palette.bg }}>
                      <div className="dsc-card-emoji">{(s as any).emoji || '\u{1F4D6}'}</div>
                      <div className="dsc-card-fade" />
                      <div className="dsc-card-title">{s.title}</div>
                      {isPick && <span className="dsc-card-pick">Staff pick</span>}
                    </div>
                    <div className="dsc-card-meta">
                      <div className="dsc-card-hook">{pickHook(s)}</div>
                      <div className="dsc-card-bottom">
                        <span className="dsc-card-label">Read tonight</span>
                        <button className={`dsc-card-fav${isFav ? ' on' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleFav(s.id); }}>
                          {isFav ? '\u2605' : '\u2606'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {locked && (
                    <div className="dsc-lock-over">
                      <div style={{ fontSize: 12, color: 'rgba(244,239,232,.55)', textAlign: 'center', lineHeight: 1.5 }}>Create a free account to read all stories</div>
                      <button onClick={() => setView('auth')} style={{
                        padding: '8px 18px', borderRadius: 50, border: 'none',
                        background: 'var(--amber)', color: '#120800',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
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
          <div className="dsc-more">
            <button className="dsc-more-btn" onClick={loadMore}>Load more stories</button>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        {isSubscribed && (
          <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid rgba(255,255,255,.04)', marginTop: 20 }}>
            <button
              onClick={() => setView('story-library')}
              style={{
                padding: '10px 24px', borderRadius: 50, fontSize: 13, fontWeight: 600,
                border: '1px solid rgba(245,184,76,.2)', background: 'rgba(245,184,76,.04)',
                color: 'var(--amber)', cursor: 'pointer', fontFamily: 'var(--sans)',
                transition: 'background .18s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,184,76,.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,184,76,.04)')}
            >
              Add your story to the library
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
