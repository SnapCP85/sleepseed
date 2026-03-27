import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getCharacters, getStories, getNightCards, getFriends, ensureRefCode } from '../lib/storage';
import type { Friend } from '../lib/storage';
import { BASE_URL } from '../lib/config';
import { supabase } from '../lib/supabase';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getCreature } from '../lib/creatures';
import type { Character, SavedStory, SavedNightCard, HatchedCreature } from '../lib/types';
import NightCard from '../features/nightcards/NightCard';
import { getBedtimeSettings, saveBedtimeSettings, requestNotificationPermission } from '../lib/bedtimeReminder';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--night-mid:#0D1120;--night-card:#0f1525;--night-raised:#141a2e;--amber:#F5B84C;--amber-deep:#E8972A;--cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.6);--cream-faint:rgba(244,239,232,0.28);--teal:#14d890;--purple:#9482ff;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

.up{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:80px}

/* Nav */
.up-nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;border-bottom:1px solid rgba(245,184,76,.07);background:rgba(8,12,24,.92);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.up-nav-title{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--cream)}
.up-nav-title span{color:var(--amber)}
.up-nav-settings{width:34px;height:34px;border-radius:50%;background:rgba(244,239,232,.06);border:none;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;color:var(--cream-faint);transition:all .18s}
.up-nav-settings:hover{background:rgba(244,239,232,.1);color:var(--cream-dim)}

/* Inner */
.up-inner{max-width:500px;margin:0 auto;padding:0 20px;position:relative;z-index:5}

/* Profile Hero */
.up-hero{text-align:center;padding:28px 0 8px;animation:fadeUp .6s ease}
.up-avatar{width:72px;height:72px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:30px;border:2px solid rgba(245,184,76,.3);box-shadow:0 0 24px rgba(245,184,76,.15)}
.up-hero-name{font-family:var(--serif);font-size:20px;font-weight:600;color:var(--cream);margin-bottom:4px}
.up-hero-since{font-family:var(--mono);font-size:10px;color:var(--cream-faint);letter-spacing:1.5px;text-transform:uppercase}

/* Stats Row */
.up-stats{display:flex;margin:20px 0 0;background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:18px;overflow:hidden;animation:fadeUp .6s .05s ease both}
.up-stat{flex:1;padding:14px 10px;text-align:center}
.up-stat:not(:last-child){border-right:1px solid rgba(244,239,232,.07)}
.up-stat-num{font-family:var(--serif);font-size:22px;font-weight:600;color:var(--amber)}
.up-stat-lbl{font-family:var(--sans);font-size:9px;font-weight:700;color:var(--cream-faint);text-transform:uppercase;margin-top:2px}

/* Section */
.up-sec{margin-top:20px;animation:fadeUp .6s .1s ease both}
.up-sec-lbl{font-family:var(--mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--cream-faint);margin-bottom:10px;padding:0 2px}

/* Memory Grid */
.up-mem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.up-mem-thumb{aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer;position:relative;transition:all .18s}
.up-mem-thumb:hover{transform:scale(1.04)}
.up-mem-thumb-bg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;position:relative}
.up-mem-thumb-bg::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40%;background:linear-gradient(transparent,rgba(0,0,0,.5))}
.up-mem-thumb-title{position:absolute;bottom:4px;left:6px;font-family:var(--sans);font-size:7px;color:rgba(255,255,255,.8);z-index:1}
.up-mem-overflow{aspect-ratio:1;border-radius:10px;border:1.5px dashed rgba(244,239,232,.09);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s}
.up-mem-overflow:hover{border-color:rgba(244,239,232,.2)}
.up-mem-overflow-num{font-family:var(--serif);font-size:18px;font-weight:600;color:var(--amber-deep)}
.up-see-all{width:100%;padding:10px;background:transparent;border:1.5px dashed rgba(244,239,232,.09);border-radius:12px;font-family:var(--sans);font-size:12px;color:var(--cream-faint);cursor:pointer;transition:all .18s;text-align:center}
.up-see-all:hover{border-color:rgba(244,239,232,.18);color:var(--cream-dim)}

/* Children Cards */
.up-child-card{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--night-card);border:1px solid rgba(244,239,232,.07);border-radius:16px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.up-child-card:hover{transform:translateX(2px);border-color:rgba(244,239,232,.14)}
.up-child-av{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.up-child-info{flex:1;min-width:0}
.up-child-name{font-family:var(--serif);font-size:15px;font-weight:500;color:var(--cream)}
.up-child-meta{font-family:var(--sans);font-size:11px;color:var(--cream-faint);margin-top:2px}
.up-child-streak{font-family:var(--mono);font-size:11px;color:var(--amber);display:flex;align-items:center;gap:4px;flex-shrink:0}
.up-child-add{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1.5px dashed rgba(244,239,232,.09);border-radius:16px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.up-child-add:hover{border-color:rgba(244,239,232,.2);background:rgba(244,239,232,.02)}
.up-child-add-av{width:46px;height:46px;border-radius:50%;border:1.5px dashed rgba(244,239,232,.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--cream-faint);flex-shrink:0}
.up-child-add-lbl{font-family:var(--sans);font-size:13px;font-weight:500;color:var(--cream-faint)}

/* Settings List */
.up-settings{display:flex;flex-direction:column;gap:2px}
.up-set-row{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:14px;cursor:pointer;transition:background .15s}
.up-set-row:hover{background:rgba(244,239,232,.04)}
.up-set-ico{font-size:16px;width:20px;text-align:center;flex-shrink:0}
.up-set-lbl{font-family:var(--sans);font-size:13px;font-weight:500;color:var(--cream-dim);flex:1}
.up-set-val{font-family:var(--mono);font-size:10px;color:var(--cream-faint)}
.up-set-divider{height:1px;background:rgba(244,239,232,.04);margin:4px 14px}
.up-set-danger .up-set-lbl{color:rgba(255,90,90,.7)}

/* Dev section */
.up-dev{border:2px solid rgba(255,60,60,.3);border-radius:14px;padding:14px;background:rgba(255,60,60,.03);margin-top:20px}
`;

export default function UserProfile() {
  const { user, logout, setView, setEditingCharacter, isSubscribed, setIsSubscribed } = useApp();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allStories, setAllStories] = useState<SavedStory[]>([]);
  const [allNightCards, setAllNightCards] = useState<SavedNightCard[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [creatures, setCreatures] = useState<HatchedCreature[]>([]);
  const [bedtimeOpen, setBedtimeOpen] = useState(false);
  const [bedtime, setBedtime] = useState(() => user ? getBedtimeSettings(user.id) : { enabled: false, time: '19:30' });
  const [bedtimeTime, setBedtimeTime] = useState(bedtime.time);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCharacters(user.id),
      getStories(user.id),
      getNightCards(user.id),
      getFriends(user.id),
      getAllHatchedCreatures(user.id),
    ]).then(([chars, strs, ncs, frs, crs]) => {
      setCharacters(chars);
      setAllStories(strs);
      setAllNightCards(ncs);
      setFriends(frs);
      setCreatures(crs);
    });
    ensureRefCode(user.id).then(code => {
      setInviteLink(`${BASE_URL}?friend=${code}`);
    }).catch(() => {});
  }, [user]);

  const familyChars = useMemo(() => characters.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human')), [characters]);

  // Streak calculation
  const bestStreak = useMemo(() => {
    const dates = new Set(allNightCards.map(c => c.date.split('T')[0]));
    let best = 0, cur = 0;
    const sorted = [...dates].sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { cur = 1; } else {
        const prev = new Date(sorted[i - 1]); prev.setDate(prev.getDate() + 1);
        cur = prev.toISOString().split('T')[0] === sorted[i] ? cur + 1 : 1;
      }
      if (cur > best) best = cur;
    }
    return best;
  }, [allNightCards]);

  const favCount = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`ss_fav_stories_${user?.id}`) || '[]').length; } catch { return 0; }
  }, [user?.id]);

  // Get creature for each family child
  const childCreatureMap = useMemo(() => {
    const map: Record<string, HatchedCreature | undefined> = {};
    familyChars.forEach(c => {
      map[c.id] = creatures.find(cr => cr.characterId === c.id);
    });
    return map;
  }, [familyChars, creatures]);

  if (!user) return null;

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const displayCards = allNightCards.slice(0, 5);
  const remainingCards = Math.max(0, allNightCards.length - 5);

  return (
    <div className="up">
      <style>{CSS}</style>

      {/* Nav */}
      <nav className="up-nav">
        <div className="up-nav-title">My <span>Space</span></div>
        <button className="up-nav-settings" onClick={() => {}} title="Settings">⚙️</button>
      </nav>

      <div className="up-inner">

        {/* Profile Hero */}
        <div className="up-hero">
          <div className="up-avatar" style={{ background: 'linear-gradient(145deg,#1a1408,#2a1a10)' }}>
            {user.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="up-hero-name">{user.displayName}</div>
          {memberSince && <div className="up-hero-since">Member since {memberSince}</div>}
        </div>

        {/* Stats Row */}
        <div className="up-stats">
          <div className="up-stat">
            <div className="up-stat-num">{allStories.length}</div>
            <div className="up-stat-lbl">Stories</div>
          </div>
          <div className="up-stat">
            <div className="up-stat-num">{bestStreak}</div>
            <div className="up-stat-lbl">Best Streak</div>
          </div>
          <div className="up-stat">
            <div className="up-stat-num">{allNightCards.length}</div>
            <div className="up-stat-lbl">Memories</div>
          </div>
        </div>

        {/* Night Cards — FIRST section */}
        <div className="up-sec">
          <div className="up-sec-lbl">Our Night Cards</div>
          {allNightCards.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--cream-faint)', fontStyle: 'italic', padding: '4px 0' }}>
              Night Cards are saved at the end of each story — your child's words, captured forever.
            </div>
          ) : (
            <>
              <div className="up-mem-grid">
                {displayCards.map(nc => (
                  <div key={nc.id} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                    <NightCard card={nc} size="mini" onTap={() => setView('nightcard-library')} />
                  </div>
                ))}
                {remainingCards > 0 && (
                  <div className="up-mem-overflow" onClick={() => setView('nightcard-library')}>
                    <div className="up-mem-overflow-num">+{remainingCards}</div>
                  </div>
                )}
              </div>
              <button className="up-see-all" onClick={() => setView('nightcard-library')}>
                See all {allNightCards.length} memories →
              </button>
            </>
          )}
        </div>

        {/* Children */}
        <div className="up-sec" style={{ animationDelay: '.15s' }}>
          <div className="up-sec-lbl">Our Children</div>
          {familyChars.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--cream-faint)', fontStyle: 'italic', padding: '4px 0 8px' }}>
              Save your child's details once — used in every story automatically.
            </div>
          ) : (
            familyChars.map(c => {
              const cr = childCreatureMap[c.id];
              const crDef = cr ? getCreature(cr.creatureType) : null;
              // Simple streak for this child
              const childCards = allNightCards.filter(nc => nc.characterIds?.includes(c.id));
              let streak = 0;
              const d = new Date(); d.setHours(0, 0, 0, 0);
              for (let i = 0; i < 365; i++) {
                const ds = d.toISOString().split('T')[0];
                if (childCards.some(nc => nc.date.split('T')[0] === ds)) { streak++; d.setDate(d.getDate() - 1); }
                else if (i === 0) { d.setDate(d.getDate() - 1); }
                else break;
              }
              return (
                <div key={c.id} className="up-child-card" onClick={() => { setView('characters'); }}>
                  <div className="up-child-av" style={{ background: c.color || 'rgba(255,255,255,.06)', border: `2px solid ${c.color ? c.color + '40' : 'rgba(244,239,232,.1)'}` }}>
                    {c.photo ? <img src={c.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (c.emoji || c.name?.charAt(0))}
                  </div>
                  <div className="up-child-info">
                    <div className="up-child-name">{c.name}</div>
                    <div className="up-child-meta">
                      {c.ageDescription ? `Age ${c.ageDescription}` : ''}
                      {cr ? ` · DreamKeeper: ${cr.name}` : ''}
                      {crDef ? ` · Night ${Math.min(childCards.length, 7)}/7` : ''}
                    </div>
                  </div>
                  {streak > 0 && (
                    <div className="up-child-streak">🔥 {streak}</div>
                  )}
                </div>
              );
            })
          )}
          <div className="up-child-add" onClick={() => { setEditingCharacter(null); setView('onboarding'); }}>
            <div className="up-child-add-av">+</div>
            <div className="up-child-add-lbl">+ Add another child</div>
          </div>
        </div>

        {/* Settings */}
        <div className="up-sec" style={{ animationDelay: '.2s' }}>
          <div className="up-sec-lbl">Account</div>
          <div className="up-settings">
            <div className="up-set-row" onClick={() => {
              if (inviteLink) { navigator.clipboard.writeText(inviteLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
            }}>
              <div className="up-set-ico">🔗</div>
              <div className="up-set-lbl">{copied ? 'Link copied!' : 'Invite a friend'}</div>
              {copied && <div className="up-set-val" style={{ color: '#14d890' }}>✓</div>}
            </div>
            <div className="up-set-divider" />
            <div className="up-set-row" onClick={() => setBedtimeOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="up-set-ico">🔔</div>
              <div className="up-set-lbl">Bedtime reminder</div>
              <div className="up-set-val" style={{ color: bedtime.enabled ? '#14d890' : 'var(--cream-faint)' }}>
                {bedtime.enabled ? bedtime.time.replace(/^0/, '') : 'OFF'}
              </div>
            </div>
            <div className="up-set-row">
              <div className="up-set-ico">🌐</div>
              <div className="up-set-lbl">Language</div>
              <div className="up-set-val">EN</div>
            </div>
            <div className="up-set-divider" />
            <div className="up-set-row">
              <div className="up-set-ico">💳</div>
              <div className="up-set-lbl">Subscription</div>
              <div className="up-set-val" style={{ color: isSubscribed ? '#14d890' : 'var(--cream-faint)' }}>{isSubscribed ? 'Active' : 'Free'}</div>
            </div>
            <div className="up-set-row up-set-danger" onClick={logout}>
              <div className="up-set-ico">🚪</div>
              <div className="up-set-lbl">Sign out</div>
            </div>
          </div>
        </div>

        {/* Dev subscription toggle */}
        <div className="up-dev">
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,60,60,.6)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
            DEV ONLY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'rgba(244,239,232,.5)' }}>
              Subscription: <strong style={{ color: isSubscribed ? '#14d890' : 'rgba(244,239,232,.3)' }}>{isSubscribed ? 'Paid' : 'Free'}</strong>
            </div>
            <button style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)',
              color: 'rgba(244,239,232,.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--sans)' }}
              onClick={async () => {
                const next = !isSubscribed;
                setIsSubscribed(next);
                try { await supabase.from('profiles').update({ is_subscribed: next }).eq('id', user.id); } catch {}
              }}>
              Toggle
            </button>
          </div>
        </div>

      </div>

      {/* Bedtime reminder modal */}
      {bedtimeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}
          onClick={() => setBedtimeOpen(false)}>
          <div style={{ background: 'rgba(13,16,24,.98)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.7)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>Bedtime Reminder</div>
            <div style={{ fontSize: 12, color: 'var(--cream-faint)', lineHeight: 1.6, marginBottom: 20 }}>
              Get a notification when it's story time. Works while the app is open.
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--cream-dim)' }}>Enable reminder</span>
              <button onClick={async () => {
                const next = !bedtime.enabled;
                if (next) await requestNotificationPermission();
                const updated = { ...bedtime, enabled: next };
                setBedtime(updated);
                if (user) saveBedtimeSettings(user.id, updated);
              }} style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: bedtime.enabled ? '#14d890' : 'rgba(255,255,255,.15)',
                position: 'relative', transition: 'background .2s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: bedtime.enabled ? 23 : 3, transition: 'left .2s',
                }} />
              </button>
            </div>

            {/* Time picker */}
            {bedtime.enabled && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 8 }}>Remind me at</div>
                <input type="time" value={bedtimeTime} onChange={e => setBedtimeTime(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(245,184,76,.25)',
                    background: 'rgba(245,184,76,.06)', color: 'var(--amber)', fontFamily: 'var(--mono)',
                    fontSize: 20, fontWeight: 600, textAlign: 'center', outline: 'none',
                    WebkitAppearance: 'none',
                  }} />
              </div>
            )}

            {/* Notification permission status */}
            {'Notification' in window && Notification.permission === 'denied' && bedtime.enabled && (
              <div style={{ fontSize: 11, color: 'rgba(255,140,130,.7)', marginBottom: 12, lineHeight: 1.5 }}>
                Notifications are blocked. Open your browser settings and allow notifications for this site.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                const updated = { ...bedtime, time: bedtimeTime };
                setBedtime(updated);
                if (user) saveBedtimeSettings(user.id, updated);
                setBedtimeOpen(false);
              }} style={{
                flex: 1, padding: 12, borderRadius: 12, background: '#E8972A', color: '#120800',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'var(--sans)',
              }}>
                Save
              </button>
              <button onClick={() => setBedtimeOpen(false)} style={{
                padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)',
                background: 'transparent', color: 'rgba(244,239,232,.5)', fontSize: 13,
                cursor: 'pointer', fontFamily: 'var(--sans)',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
