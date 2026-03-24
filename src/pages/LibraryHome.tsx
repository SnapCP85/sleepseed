import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getLibraryStories, getBookOfDay, getFeaturedLibraryStories } from '../lib/storage';
import { getSceneByVibe } from '../lib/storyScenes';
import type { LibraryStory } from '../lib/types';

function strHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function sceneSeed(title: string, heroName: string): number {
  return parseInt(strHash(title + (heroName || '')), 36) || 0;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#020408;--amber:#F5B84C;--amber-d:#a06010;--teal:#14d890;--teal-d:#0a7a50;--cream:#f5e8c8;--card:rgba(6,10,28,.92);--border:rgba(255,255,255,.07);--serif:'Fraunces',serif;--cta:'Baloo 2',sans-serif;--body:'Nunito',sans-serif;--mono:'DM Mono',monospace}
@keyframes lFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.lh{min-height:100vh;background:var(--night);font-family:var(--body);color:var(--cream);-webkit-font-smoothing:antialiased}

/* nav */
.lh-nav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:56px;border-bottom:1px solid rgba(245,184,76,.08);background:rgba(2,4,8,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}
.lh-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:7px;cursor:pointer}
.lh-logo-moon{width:15px;height:15px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020)}
.lh-nav-right{display:flex;align-items:center;gap:8px}
.lh-nav-btn{padding:7px 16px;border-radius:50px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--body);transition:all .18s;border:none}
.lh-nav-ghost{background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(245,232,200,.5)}
.lh-nav-ghost:hover{border-color:rgba(255,255,255,.2);color:var(--cream)}
.lh-nav-amber{background:var(--amber);color:#120800}
.lh-nav-amber:hover{filter:brightness(1.1)}

/* hero */
.lh-hero{text-align:center;padding:36px 5% 24px;max-width:640px;margin:0 auto}
.lh-hero h1{font-family:var(--serif);font-size:clamp(24px,5vw,36px);font-weight:700;line-height:1.2;margin-bottom:8px}
.lh-hero h1 em{font-style:italic;color:var(--amber)}
.lh-hero p{font-size:14px;color:rgba(245,232,200,.4);line-height:1.65;margin-bottom:20px}
.lh-search{width:100%;max-width:480px;margin:0 auto 14px;position:relative}
.lh-search input{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 14px 12px 38px;font-size:13px;color:var(--cream);font-family:var(--body);outline:none;transition:border-color .2s}
.lh-search input:focus{border-color:rgba(245,184,76,.35)}
.lh-search input::placeholder{color:rgba(255,255,255,.2)}
.lh-search-ico{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;opacity:.3;pointer-events:none}

/* filter pills */
.lh-filters{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:6px}
.lh-pill{padding:6px 14px;border-radius:50px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid rgba(255,255,255,.08);background:transparent;color:rgba(245,232,200,.35);transition:all .18s;font-family:var(--body)}
.lh-pill:hover{color:rgba(245,232,200,.6);border-color:rgba(255,255,255,.15)}
.lh-pill.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.1);color:var(--amber)}
.lh-pill.teal.on{border-color:rgba(20,216,144,.5);background:rgba(20,216,144,.1);color:var(--teal)}

/* section */
.lh-sec{max-width:900px;margin:0 auto;padding:0 5%}
.lh-sec-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;margin-top:28px}
.lh-sec-title{font-family:var(--serif);font-size:18px;font-weight:700}
.lh-sec-count{font-size:10px;color:rgba(245,232,200,.25);font-family:var(--mono)}

/* book of day */
.lh-bod{max-width:900px;margin:20px auto 0;padding:0 5%}
.lh-bod-card{background:var(--card);border:1px solid rgba(245,184,76,.15);border-radius:20px;overflow:hidden;cursor:pointer;transition:all .22s;display:flex;flex-direction:column}
.lh-bod-card:hover{border-color:rgba(245,184,76,.3);transform:translateY(-2px)}
.lh-bod-scene{height:200px;position:relative;overflow:hidden;border-radius:20px 20px 0 0}
.lh-bod-badge{position:absolute;top:12px;right:12px;background:rgba(245,184,76,.15);border:1px solid rgba(245,184,76,.3);border-radius:50px;padding:4px 12px;font-size:9px;font-weight:700;color:var(--amber);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;z-index:2;backdrop-filter:blur(8px)}
.lh-bod-info{padding:16px 18px 18px}
.lh-bod-title{font-family:var(--serif);font-size:clamp(18px,3.5vw,24px);font-weight:700;margin-bottom:4px;line-height:1.25}
.lh-bod-hero{font-size:10px;color:rgba(245,232,200,.35);font-family:var(--mono);margin-bottom:8px}
.lh-bod-excerpt{font-size:13px;color:rgba(245,232,200,.4);line-height:1.65;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lh-bod-cta{display:inline-flex;align-items:center;gap:6px;background:var(--amber);color:#120800;border:none;border-radius:50px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--cta);transition:all .18s}
.lh-bod-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}
.lh-bod-thumbs{font-size:11px;color:rgba(245,232,200,.3);font-family:var(--mono);margin-top:8px}

/* horizontal scroll shelf */
.lh-shelf{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.lh-shelf::-webkit-scrollbar{height:3px}
.lh-shelf::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px}

/* story card */
.lh-card{flex-shrink:0;width:220px;background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .22s;scroll-snap-align:start;animation:lFadeIn .4s ease-out both}
.lh-card:hover{border-color:rgba(245,184,76,.2);transform:translateY(-3px)}
.lh-card-scene{height:120px;position:relative;overflow:hidden}
.lh-card-badges{position:absolute;top:6px;right:6px;display:flex;gap:4px;z-index:2}
.lh-card-badge{font-size:8px;font-weight:700;padding:2px 7px;border-radius:50px;backdrop-filter:blur(8px);letter-spacing:.04em}
.lh-card-badge.staff{background:rgba(245,184,76,.18);border:1px solid rgba(245,184,76,.35);color:var(--amber)}
.lh-card-badge.bod{background:rgba(20,216,144,.15);border:1px solid rgba(20,216,144,.3);color:var(--teal)}
.lh-card-body{padding:10px 12px 12px}
.lh-card-title{font-family:var(--serif);font-size:14px;font-weight:700;line-height:1.3;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lh-card-hero{font-size:9px;color:rgba(245,232,200,.3);font-family:var(--mono);margin-bottom:6px}
.lh-card-tags{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}
.lh-card-tag{font-size:8px;font-weight:700;padding:2px 7px;border-radius:50px;font-family:var(--mono)}
.lh-card-tag.age{background:rgba(245,184,76,.1);border:1px solid rgba(245,184,76,.2);color:var(--amber)}
.lh-card-tag.mood{background:rgba(20,216,144,.08);border:1px solid rgba(20,216,144,.18);color:var(--teal)}
.lh-card-footer{display:flex;align-items:center;gap:6px;font-size:10px;color:rgba(245,232,200,.25);font-family:var(--mono)}

/* grid */
.lh-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
@media(min-width:640px){.lh-grid{grid-template-columns:repeat(3,1fr)}}
.lh-grid .lh-card{width:auto;flex-shrink:unset}

/* sort tabs */
.lh-sort{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:3px;border:1px solid var(--border);margin-bottom:14px}
.lh-sort-btn{flex:1;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;font-family:var(--body);transition:all .15s;color:rgba(245,232,200,.35);background:transparent;text-align:center}
.lh-sort-btn.on{background:rgba(245,184,76,.12);color:var(--amber)}

/* load more */
.lh-more{display:flex;justify-content:center;margin:20px 0 40px}
.lh-more-btn{padding:10px 28px;border-radius:50px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(245,232,200,.5);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--body);transition:all .18s}
.lh-more-btn:hover{border-color:rgba(255,255,255,.2);color:var(--cream)}

/* conversion prompt */
.lh-promo{max-width:900px;margin:24px auto;padding:0 5%}
.lh-promo-card{border-radius:16px;padding:20px 22px;text-align:center}
.lh-promo-card.amber{background:rgba(245,184,76,.04);border:1px solid rgba(245,184,76,.18)}
.lh-promo-card.teal{background:rgba(20,216,144,.04);border:1px solid rgba(20,216,144,.18)}
.lh-promo-text{font-size:14px;color:rgba(245,232,200,.55);line-height:1.65;margin-bottom:12px}
.lh-promo-btn{padding:10px 24px;border-radius:50px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--cta);transition:all .18s}
.lh-promo-btn.amber{background:var(--amber);color:#120800}
.lh-promo-btn.teal{background:var(--teal);color:#021008}

/* lock overlay */
.lh-lock{position:relative}
.lh-lock-overlay{position:absolute;inset:0;background:rgba(2,4,8,.7);backdrop-filter:blur(6px);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;padding:16px}
.lh-lock-text{font-size:12px;color:rgba(245,232,200,.6);text-align:center;line-height:1.5}
.lh-lock-btn{padding:8px 18px;border-radius:50px;border:none;background:var(--amber);color:#120800;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--cta)}

/* footer */
.lh-footer{text-align:center;padding:32px 5%;border-top:1px solid var(--border);margin-top:40px}
.lh-footer-btn{padding:10px 24px;border-radius:50px;border:1px solid rgba(245,184,76,.25);background:rgba(245,184,76,.06);color:var(--amber);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--body);transition:all .18s;margin-bottom:12px}
.lh-footer-btn:hover{background:rgba(245,184,76,.12)}
.lh-footer-links{font-size:11px;color:rgba(245,232,200,.2);font-family:var(--mono)}

/* empty */
.lh-empty{text-align:center;padding:48px 20px;color:rgba(245,232,200,.3)}
.lh-empty-ico{font-size:42px;margin-bottom:12px}
.lh-empty-h{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:6px}
`;

const AGE_FILTERS = [
  { label: 'All ages', value: '' },
  { label: 'Ages 3-5', value: 'age3' },
  { label: 'Ages 6-8', value: 'age5' },
  { label: 'Ages 9-11', value: 'age7' },
];

const MOOD_FILTERS = [
  { label: 'All moods', value: '' },
  { label: 'Calm', value: 'calm' },
  { label: 'Funny', value: 'funny' },
  { label: 'Exciting', value: 'exciting' },
  { label: 'Heartfelt', value: 'heartfelt' },
];

const AGE_LABELS: Record<string, string> = {
  age3: 'Ages 3-5', age5: 'Ages 5-7', age7: 'Ages 7-9', age10: 'Ages 9-11',
};

function StoryCard({ story, onClick, style }: { story: LibraryStory; onClick: () => void; style?: any }) {
  const seed = sceneSeed(story.title, story.heroName);
  const Scene = getSceneByVibe(seed, story.vibe);
  return (
    <div className="lh-card" onClick={onClick} style={style}>
      <div className="lh-card-scene"><Scene /></div>
      <div className="lh-card-body">
        <div className="lh-card-badges">
          {story.isStaffPick && <span className="lh-card-badge staff">Staff Pick</span>}
          {story.isBookOfDay && <span className="lh-card-badge bod">Book of the Day</span>}
        </div>
        <div className="lh-card-title">{story.title}</div>
        <div className="lh-card-hero">A story for {story.heroName}</div>
        <div className="lh-card-tags">
          {story.ageGroup && <span className="lh-card-tag age">{AGE_LABELS[story.ageGroup] || story.ageGroup}</span>}
          {story.mood && <span className="lh-card-tag mood">{story.mood}</span>}
        </div>
        <div className="lh-card-footer">
          <span>👍 {story.thumbsUp}</span>
          {story.readCount > 0 && <span>· {story.readCount} reads</span>}
        </div>
      </div>
    </div>
  );
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
  const debounceRef = useRef<any>(null);

  const isGuest = !user || user.isGuest;
  const isFree = user && !user.isGuest && !isSubscribed;

  // Initial loads
  useEffect(() => {
    setLoading(true);
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
  };

  const guestLimit = 5;

  return (
    <div className="lh">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="lh-nav">
        <div className="lh-logo" onClick={() => setView('public')}>
          <div className="lh-logo-moon" /> SleepSeed
        </div>
        <div className="lh-nav-right">
          {user && !user.isGuest ? (
            <button className="lh-nav-btn lh-nav-ghost" onClick={() => setView('dashboard')}>← Dashboard</button>
          ) : (
            <>
              <button className="lh-nav-btn lh-nav-ghost" onClick={() => setView('public')}>About</button>
              <button className="lh-nav-btn lh-nav-ghost" onClick={() => setView('dashboard')}>Create a story</button>
              <button className="lh-nav-btn lh-nav-amber" onClick={() => setView('auth')}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="lh-hero">
        <h1>Stories for every <em>bedtime.</em></h1>
        <p>Written by SleepSeed families. Loved by children everywhere.</p>
        <div className="lh-search">
          <span className="lh-search-ico">🔍</span>
          <input
            placeholder="Search by title, character, or theme..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="lh-filters">
          {AGE_FILTERS.map(f => (
            <button key={f.value} className={`lh-pill${filterAge === f.value ? ' on' : ''}`}
              onClick={() => setFilterAge(filterAge === f.value ? '' : f.value)}>{f.label}</button>
          ))}
        </div>
        <div className="lh-filters">
          {MOOD_FILTERS.map(f => (
            <button key={f.value} className={`lh-pill teal${filterMood === f.value ? ' on' : ''}`}
              onClick={() => setFilterMood(filterMood === f.value ? '' : f.value)}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* BOOK OF THE DAY */}
      {bookOfDay && !search && !filterAge && !filterMood && (
        <div className="lh-bod">
          <div className="lh-bod-card" onClick={() => openStory(bookOfDay)}>
            <div className="lh-bod-scene">
              {(() => { const S = getSceneByVibe(sceneSeed(bookOfDay.title, bookOfDay.heroName), bookOfDay.vibe); return <S />; })()}
              <div className="lh-bod-badge">Book of the Day</div>
            </div>
            <div className="lh-bod-info">
              <div className="lh-bod-title">{bookOfDay.title}</div>
              <div className="lh-bod-hero">A story for {bookOfDay.heroName}</div>
              {(bookOfDay.bookData?.pages?.[0]?.text || bookOfDay.bookData?.setup_pages?.[0]?.text) && (
                <div className="lh-bod-excerpt">{(bookOfDay.bookData.pages?.[0]?.text || bookOfDay.bookData.setup_pages?.[0]?.text || '').slice(0, 140)}...</div>
              )}
              <button className="lh-bod-cta" onClick={e => { e.stopPropagation(); openStory(bookOfDay); }}>
                Read today's story →
              </button>
              {bookOfDay.thumbsUp > 0 && <div className="lh-bod-thumbs">👍 {bookOfDay.thumbsUp}</div>}
            </div>
          </div>
        </div>
      )}

      {/* STAFF PICKS */}
      {staffPicks.length > 0 && !search && !filterAge && !filterMood && (
        <div className="lh-sec">
          <div className="lh-sec-hd">
            <div className="lh-sec-title">Staff Picks</div>
          </div>
          <div className="lh-shelf">
            {staffPicks.map(s => (
              <StoryCard key={s.id} story={s} onClick={() => openStory(s)} />
            ))}
          </div>
        </div>
      )}

      {/* CONVERSION PROMPT */}
      {isGuest && (
        <div className="lh-promo">
          <div className="lh-promo-card amber">
            <div className="lh-promo-text">Create a free account to vote on stories and save your favourites</div>
            <button className="lh-promo-btn amber" onClick={() => setView('auth')}>Sign up free →</button>
          </div>
        </div>
      )}
      {isFree && (
        <div className="lh-promo">
          <div className="lh-promo-card teal">
            <div className="lh-promo-text">Upgrade to personalise any story — make your child the hero</div>
            <button className="lh-promo-btn teal" onClick={() => setView('public')}>See Family plan →</button>
          </div>
        </div>
      )}

      {/* ALL STORIES */}
      <div className="lh-sec">
        <div className="lh-sec-hd">
          <div className="lh-sec-title">All Stories</div>
          <div className="lh-sec-count">{stories.length} stories</div>
        </div>
        <div className="lh-sort">
          {(['recent', 'popular', 'thumbs'] as const).map(s => (
            <button key={s} className={`lh-sort-btn${sortBy === s ? ' on' : ''}`}
              onClick={() => setSortBy(s)}>
              {s === 'recent' ? 'Recent' : s === 'popular' ? 'Popular' : 'Most Loved'}
            </button>
          ))}
        </div>

        {loading && stories.length === 0 ? (
          <div className="lh-empty">
            <div className="lh-empty-ico">🌙</div>
            <div>Loading stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="lh-empty">
            <div className="lh-empty-ico">📚</div>
            <div className="lh-empty-h">No stories found</div>
            <div>Try a different search or filter.</div>
          </div>
        ) : (
          <div className="lh-grid">
            {stories.map((s, i) => {
              const locked = isGuest && i >= guestLimit;
              return (
                <div key={s.id} className={locked ? 'lh-lock' : ''} style={{ animationDelay: `${i * 0.04}s` }}>
                  <StoryCard story={s} onClick={() => !locked && openStory(s)} style={locked ? { filter: 'blur(3px)', pointerEvents: 'none' } : {}} />
                  {locked && (
                    <div className="lh-lock-overlay">
                      <div className="lh-lock-text">Create a free account to read all stories</div>
                      <button className="lh-lock-btn" onClick={() => setView('auth')}>Sign up free →</button>
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
      </div>

      {/* FOOTER */}
      <footer className="lh-footer">
        {isSubscribed && (
          <button className="lh-footer-btn" onClick={() => setView('story-library')}>
            Add your story to the library →
          </button>
        )}
        <div className="lh-footer-links">
          <span style={{ cursor: 'pointer' }} onClick={() => setView('public')}>Home</span>
        </div>
      </footer>
    </div>
  );
}
