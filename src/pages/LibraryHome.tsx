import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getLibraryStories, getBookOfDay, getFeaturedLibraryStories, getCharacters } from '../lib/storage';
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

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--night-card:#0f1525;--night-raised:#141a2e;--amber:#F5B84C;--amber-deep:#E8972A;--cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);--teal:#14d890;--purple:#9482ff;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes lFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes shimmer{0%{transform:translateX(-100%)}60%,100%{transform:translateX(200%)}}

.lh{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:80px}

/* nav */
.lh-nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(8,12,24,.92);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.lh-nav-title{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--cream)}
.lh-nav-title span{color:var(--amber)}
.lh-nav-btn{width:34px;height:34px;border-radius:50%;background:rgba(244,239,232,.06);border:none;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:var(--cream-faint);transition:all .18s}
.lh-nav-btn:hover{background:rgba(244,239,232,.1)}

.lh-inner{max-width:600px;margin:0 auto;padding:0 20px}

/* search */
.lh-search{margin:16px 0;background:rgba(13,17,32,.9);border:1px solid rgba(244,239,232,.09);border-radius:14px;padding:11px 14px;display:flex;align-items:center;gap:8px}
.lh-search-ico{font-size:14px;opacity:.3;flex-shrink:0}
.lh-search input{flex:1;background:transparent;border:none;outline:none;font-size:13px;color:var(--cream);font-family:var(--sans)}
.lh-search input::placeholder{color:var(--cream-faint)}

/* filter rows */
.lh-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;margin-bottom:6px;padding-bottom:2px}
.lh-filters::-webkit-scrollbar{display:none}
.lh-pill{flex-shrink:0;padding:6px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(244,239,232,.08);background:transparent;color:var(--cream-faint);transition:all .18s;font-family:var(--sans)}
.lh-pill:hover{border-color:rgba(244,239,232,.15);color:var(--cream-dim)}
.lh-pill.on{border-color:rgba(245,184,76,.5);background:rgba(245,184,76,.1);color:var(--amber)}
.lh-pill.teal.on{border-color:rgba(20,216,144,.5);background:rgba(20,216,144,.1);color:var(--teal)}
.lh-pill.purple.on{border-color:rgba(148,130,255,.5);background:rgba(148,130,255,.1);color:var(--purple)}
.lh-pill.calm.on{border-color:rgba(20,216,144,.5);background:rgba(20,216,144,.1);color:var(--teal)}
.lh-pill.wonder.on{border-color:rgba(148,130,255,.5);background:rgba(148,130,255,.1);color:var(--purple)}

/* hero card — Story of the Night */
.lh-hero{margin:16px 0;border-radius:24px;overflow:hidden;cursor:pointer;min-height:200px;box-shadow:0 12px 40px rgba(0,0,0,.5);position:relative;transition:all .22s;animation:fadeUp .5s ease}
.lh-hero:hover{transform:translateY(-2px);box-shadow:0 16px 50px rgba(0,0,0,.6)}
.lh-hero-badge{position:absolute;top:12px;left:12px;background:rgba(245,184,76,.2);border:1px solid rgba(245,184,76,.35);border-radius:20px;padding:4px 12px;font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--amber);z-index:2;backdrop-filter:blur(8px)}
.lh-hero-content{position:relative;z-index:2;padding:48px 20px 20px}
.lh-hero-emoji{font-size:52px;animation:lFloat 3.5s ease-in-out infinite;margin-bottom:10px;display:inline-block}
.lh-hero-title{font-family:var(--serif);font-size:20px;font-weight:600;color:var(--cream);line-height:1.2;margin-bottom:6px}
.lh-hero-meta{display:flex;gap:6px;align-items:center;margin-bottom:14px}
.lh-hero-chip{font-family:var(--mono);font-size:9px;padding:3px 8px;border-radius:10px;border:1px solid rgba(244,239,232,.1);color:var(--cream-faint)}
.lh-hero-cta{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7a4808,#c4851c,#F5B84C);color:#1a0800;border:none;border-radius:14px;padding:11px 20px;font-family:var(--serif);font-size:14px;font-weight:600;cursor:pointer;position:relative;overflow:hidden;transition:all .18s;margin-bottom:8px}
.lh-hero-cta::after{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);animation:shimmer 3.5s ease-in-out infinite}
.lh-hero-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}
.lh-hero-personalize{display:inline-flex;align-items:center;gap:4px;background:rgba(148,130,255,.18);border:1px solid rgba(148,130,255,.3);border-radius:20px;padding:4px 12px;font-family:var(--sans);font-size:11px;font-weight:600;color:var(--purple);cursor:pointer;transition:all .18s;margin-left:8px}
.lh-hero-personalize:hover{background:rgba(148,130,255,.28)}

/* section */
.lh-sec{margin-top:24px}
.lh-sec-lbl{font-family:var(--mono);font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--cream-faint);margin-bottom:12px;padding:0 2px}

/* staff picks grid */
.lh-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.lh-card{background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:18px;overflow:hidden;cursor:pointer;transition:all .22s;animation:fadeUp .4s ease both}
.lh-card:hover{transform:translateY(-3px);border-color:rgba(244,239,232,.14)}
.lh-card-scene{height:110px;position:relative;overflow:hidden}
.lh-card-scene-overlay{position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(180deg,transparent 50%,rgba(8,12,24,.6) 100%)}
.lh-card-emoji{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px}
.lh-card-info{padding:10px 12px 12px}
.lh-card-title{font-family:var(--serif);font-size:13px;font-weight:500;color:var(--cream);line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lh-card-chips{display:flex;gap:4px;margin-bottom:6px}
.lh-card-chip{font-family:var(--mono);font-size:8px;padding:2px 7px;border-radius:50px;border:1px solid rgba(244,239,232,.1);color:var(--cream-faint)}
.lh-card-cta-row{display:flex;align-items:center;justify-content:space-between;padding:2px 0}
.lh-card-read{font-family:var(--sans);font-size:11px;font-weight:600;color:var(--amber);background:none;border:none;cursor:pointer;padding:0}
.lh-card-personalize{font-size:12px;opacity:.6;cursor:pointer;transition:opacity .15s}
.lh-card-personalize:hover{opacity:1}

/* horizontal shelf */
.lh-shelf{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-ms-overflow-style:none}
.lh-shelf::-webkit-scrollbar{display:none}
.lh-shelf .lh-card{flex-shrink:0;width:140px}
.lh-shelf .lh-card-scene{height:90px}

/* all stories sort tabs */
.lh-sort{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:3px;border:1px solid rgba(244,239,232,.07);margin-bottom:14px}
.lh-sort-btn{flex:1;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:all .15s;color:var(--cream-faint);background:transparent;text-align:center}
.lh-sort-btn.on{background:rgba(245,184,76,.12);color:var(--amber)}

/* promo */
.lh-promo{margin:24px 0;border-radius:16px;padding:20px 22px;text-align:center}
.lh-promo.amber{background:rgba(245,184,76,.04);border:1px solid rgba(245,184,76,.18)}
.lh-promo.teal{background:rgba(20,216,144,.04);border:1px solid rgba(20,216,144,.18)}
.lh-promo-text{font-size:14px;color:var(--cream-dim);line-height:1.65;margin-bottom:12px}
.lh-promo-btn{padding:10px 24px;border-radius:50px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .18s}
.lh-promo-btn.amber{background:var(--amber);color:#120800}
.lh-promo-btn.teal{background:var(--teal);color:#021008}

/* load more */
.lh-more{display:flex;justify-content:center;margin:20px 0 40px}
.lh-more-btn{padding:10px 28px;border-radius:50px;border:1px solid rgba(244,239,232,.1);background:rgba(255,255,255,.03);color:var(--cream-faint);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s}
.lh-more-btn:hover{border-color:rgba(244,239,232,.2);color:var(--cream)}

/* lock */
.lh-lock{position:relative}
.lh-lock-overlay{position:absolute;inset:0;background:rgba(8,12,24,.7);backdrop-filter:blur(6px);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;padding:16px}
.lh-lock-text{font-size:12px;color:var(--cream-dim);text-align:center;line-height:1.5}
.lh-lock-btn{padding:8px 18px;border-radius:50px;border:none;background:var(--amber);color:#120800;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--sans)}

/* empty */
.lh-empty{text-align:center;padding:48px 20px;color:var(--cream-faint)}
.lh-empty-ico{font-size:42px;margin-bottom:12px}
.lh-empty-h{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:6px}

/* footer */
.lh-footer{text-align:center;padding:32px 0;border-top:1px solid rgba(244,239,232,.04);margin-top:40px}
.lh-footer-btn{padding:10px 24px;border-radius:50px;border:1px solid rgba(245,184,76,.25);background:rgba(245,184,76,.06);color:var(--amber);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .18s;margin-bottom:12px}
.lh-footer-btn:hover{background:rgba(245,184,76,.12)}
`;

const MOOD_FILTERS = [
  { emoji: '✨', label: 'All', value: '', cls: '' },
  { emoji: '🌙', label: 'Calm', value: 'calm', cls: 'calm' },
  { emoji: '🌟', label: 'Adventure', value: 'exciting', cls: '' },
  { emoji: '💛', label: 'Funny', value: 'funny', cls: '' },
  { emoji: '🦋', label: 'Wonder', value: 'heartfelt', cls: 'wonder' },
  { emoji: '🦁', label: 'Brave', value: 'brave', cls: '' },
  { emoji: '🌊', label: 'Dreamy', value: 'dreamy', cls: 'teal' },
];

const AGE_FILTERS = [
  { label: 'Ages 3–5', value: 'age3' },
  { label: 'Ages 6–8', value: 'age5' },
  { label: 'Ages 9–11', value: 'age7' },
  { label: 'All Ages', value: '' },
];

const AGE_LABELS: Record<string, string> = {
  age3: 'Ages 3-5', age5: 'Ages 5-7', age7: 'Ages 7-9', age10: 'Ages 9-11',
};

// Mood-based hero card bg colors
const MOOD_COLORS: Record<string, string> = {
  calm: '#0f2040', exciting: '#1a0f3a', funny: '#2a1a10', heartfelt: '#1a0f2a',
  brave: '#2a1018', '': '#0f1a30',
};

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

  const isGuest = !user || user.isGuest;
  const isFree = user && !user.isGuest && !isSubscribed;

  // Load active child for personalization
  useEffect(() => {
    if (!user || user.isGuest) return;
    getCharacters(user.id).then(chars => {
      const family = chars.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
      if (family.length > 0) setActiveChild(family[0]);
    });
  }, [user]);

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
  const heroStory = bookOfDay || (staffPicks.length > 0 ? staffPicks[0] : null);
  const heroMoodColor = MOOD_COLORS[heroStory?.mood || heroStory?.vibe || ''] || MOOD_COLORS[''];

  // Get today's stories
  const todayStr = new Date().toISOString().split('T')[0];
  const newTonight = useMemo(() => stories.filter(s => (s as any).createdAt?.split('T')[0] === todayStr).slice(0, 8), [stories, todayStr]);

  return (
    <div className="lh">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="lh-nav">
        <div className="lh-nav-title">Discover <span>✦</span></div>
        <button className="lh-nav-btn">🔔</button>
      </nav>

      <div className="lh-inner">

        {/* Search */}
        <div className="lh-search">
          <span className="lh-search-ico">🔍</span>
          <input placeholder="Search stories, themes, creatures…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Mood filters (primary) */}
        <div className="lh-filters">
          {MOOD_FILTERS.map(f => (
            <button key={f.value} className={`lh-pill${f.cls ? ' ' + f.cls : ''}${filterMood === f.value ? ' on' : ''}`}
              onClick={() => setFilterMood(filterMood === f.value ? '' : f.value)}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Age filters */}
        <div className="lh-filters" style={{ marginBottom: 0 }}>
          {AGE_FILTERS.map(f => (
            <button key={f.value} className={`lh-pill${filterAge === f.value ? ' on' : ''}`}
              onClick={() => setFilterAge(filterAge === f.value ? '' : f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Story of the Night Hero Card */}
        {heroStory && !search && !filterAge && !filterMood && (
          <div className="lh-hero" onClick={() => openStory(heroStory)}
            style={{ background: `linear-gradient(135deg, ${heroMoodColor}, #0f2040)` }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 70% 30%, rgba(148,130,255,.12), transparent 60%)` }} />
            <div className="lh-hero-badge">✦ Story of the Night</div>
            <div className="lh-hero-content">
              <div className="lh-hero-emoji">📖</div>
              <div className="lh-hero-title">{heroStory.title}</div>
              <div className="lh-hero-meta">
                {heroStory.ageGroup && <span className="lh-hero-chip">{AGE_LABELS[heroStory.ageGroup] || heroStory.ageGroup}</span>}
                {heroStory.mood && <span className="lh-hero-chip">{heroStory.mood}</span>}
              </div>
              <button className="lh-hero-cta" onClick={e => { e.stopPropagation(); openStory(heroStory); }}>
                📖 {activeChild ? `Read for ${activeChild.name}` : 'Read tonight\'s story'}
              </button>
              {activeChild && (
                <span className="lh-hero-personalize">✦ Swap {activeChild.name}'s name in →</span>
              )}
            </div>
          </div>
        )}

        {/* Conversion prompts */}
        {isGuest && !search && (
          <div className="lh-promo amber">
            <div className="lh-promo-text">Create a free account to vote on stories and save your favourites</div>
            <button className="lh-promo-btn amber" onClick={() => setView('auth')}>Sign up free →</button>
          </div>
        )}
        {isFree && !search && (
          <div className="lh-promo teal">
            <div className="lh-promo-text">Upgrade to personalise any story — make your child the hero</div>
            <button className="lh-promo-btn teal" onClick={() => setView('public')}>See Family plan →</button>
          </div>
        )}

        {/* Staff Picks */}
        {staffPicks.length > 0 && !search && !filterAge && !filterMood && (
          <div className="lh-sec">
            <div className="lh-sec-lbl">Staff Picks</div>
            <div className="lh-grid">
              {staffPicks.slice(0, 6).map((s, i) => {
                const seed = sceneSeed(s.title, s.heroName);
                const Scene = getSceneByVibe(seed, s.vibe);
                return (
                  <div key={s.id} className="lh-card" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => openStory(s)}>
                    <div className="lh-card-scene">
                      {(s as any).coverUrl
                        ? <img src={(s as any).coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Scene />}
                      <div className="lh-card-scene-overlay" />
                    </div>
                    <div className="lh-card-info">
                      <div className="lh-card-title">{s.title}</div>
                      <div className="lh-card-chips">
                        {s.ageGroup && <span className="lh-card-chip">{AGE_LABELS[s.ageGroup] || s.ageGroup}</span>}
                        {s.mood && <span className="lh-card-chip">{s.mood}</span>}
                      </div>
                      <div className="lh-card-cta-row">
                        <button className="lh-card-read" onClick={e => { e.stopPropagation(); openStory(s); }}>Read →</button>
                        {activeChild && <span className="lh-card-personalize" title={`Personalise for ${activeChild.name}`}>✦</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Tonight */}
        {newTonight.length > 0 && !search && !filterAge && !filterMood && (
          <div className="lh-sec">
            <div className="lh-sec-lbl">New Tonight</div>
            <div className="lh-shelf">
              {newTonight.map((s, i) => {
                const seed = sceneSeed(s.title, s.heroName);
                const Scene = getSceneByVibe(seed, s.vibe);
                return (
                  <div key={s.id} className="lh-card" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => openStory(s)}>
                    <div className="lh-card-scene"><Scene /></div>
                    <div className="lh-card-info">
                      <div className="lh-card-title">{s.title}</div>
                      <div className="lh-card-cta-row">
                        <button className="lh-card-read" onClick={e => { e.stopPropagation(); openStory(s); }}>Read →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Stories */}
        <div className="lh-sec">
          <div className="lh-sec-lbl">All Stories · {stories.length}</div>
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
                const seed = sceneSeed(s.title, s.heroName);
                const Scene = getSceneByVibe(seed, s.vibe);
                return (
                  <div key={s.id} className={locked ? 'lh-lock' : ''} style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="lh-card" onClick={() => !locked && openStory(s)} style={locked ? { filter: 'blur(3px)', pointerEvents: 'none' as const } : {}}>
                      <div className="lh-card-scene">
                        <Scene />
                        <div className="lh-card-scene-overlay" />
                      </div>
                      <div className="lh-card-info">
                        <div className="lh-card-title">{s.title}</div>
                        <div className="lh-card-chips">
                          {s.ageGroup && <span className="lh-card-chip">{AGE_LABELS[s.ageGroup] || s.ageGroup}</span>}
                          {s.mood && <span className="lh-card-chip">{s.mood}</span>}
                        </div>
                        <div className="lh-card-cta-row">
                          <button className="lh-card-read">Read →</button>
                        </div>
                      </div>
                    </div>
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

        {/* Footer */}
        <footer className="lh-footer">
          {isSubscribed && (
            <button className="lh-footer-btn" onClick={() => setView('story-library')}>
              Add your story to the library →
            </button>
          )}
        </footer>

      </div>
    </div>
  );
}
