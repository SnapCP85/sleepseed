import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { getCharacters, ensureRefCode } from '../lib/storage';
import { BASE_URL } from '../lib/config';
import { supabase } from '../lib/supabase';
import { getAllHatchedCreatures } from '../lib/hatchery';
import { getCreature } from '../lib/creatures';
import type { Character, HatchedCreature } from '../lib/types';
import { getBedtimeSettings, saveBedtimeSettings, requestNotificationPermission } from '../lib/bedtimeReminder';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#060912;--night-mid:#0B1535;--night-card:#0C1840;--amber:#F5B84C;--teal:#14d890;--purple:#9A7FD4;--cream:#F4EFE8;--serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;--mono:'DM Mono',monospace}
@keyframes pFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

.pf{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;padding-bottom:20px}
.pf-inner{max-width:500px;margin:0 auto;padding:0 20px;position:relative;z-index:5}

/* Header */
.pf-hdr{padding:20px 20px 0;max-width:500px;margin:0 auto;display:flex;align-items:center;gap:12px}
.pf-back{background:none;border:none;color:rgba(234,242,255,.4);font-size:20px;cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;border-radius:10px;transition:background .15s}
.pf-back:hover{background:rgba(255,255,255,.05)}
.pf-hdr h1{font-family:var(--serif);font-size:24px;font-weight:900;color:var(--cream);letter-spacing:-.5px;margin:0}

/* Section */
.pf-sec{margin-top:20px;animation:pFadeUp .5s .1s ease both}
.pf-sec-lbl{font-family:var(--mono);font-size:8.5px;letter-spacing:.9px;text-transform:uppercase;color:rgba(234,242,255,.24);margin-bottom:10px;padding:0 2px}

/* Children list */
.pf-kid{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(244,239,232,.05);border:1.5px solid rgba(245,184,76,.18);border-radius:22px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.pf-kid:hover{border-color:rgba(245,184,76,.3)}
.pf-kid-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:2px solid rgba(245,184,76,.3)}
.pf-kid-info{flex:1;min-width:0}
.pf-kid-name{font-family:var(--serif);font-size:14px;font-weight:900;color:var(--cream)}
.pf-kid-meta{font-family:var(--mono);font-size:10px;color:rgba(234,242,255,.38);margin-top:2px}
.pf-kid-add{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1.5px dashed rgba(234,242,255,.1);border-radius:18px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.pf-kid-add:hover{border-color:rgba(234,242,255,.2);background:rgba(234,242,255,.02)}

/* Settings links */
.pf-link{background:rgba(244,239,232,.04);border:1px solid rgba(244,239,232,.07);border-radius:18px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:background .15s;margin-bottom:6px}
.pf-link:hover{background:rgba(244,239,232,.06)}
.pf-link-ico{font-size:16px;width:20px;text-align:center;flex-shrink:0}
.pf-link-lbl{font-family:var(--sans);font-size:13px;color:rgba(234,242,255,.6);flex:1}
.pf-link-val{font-family:var(--mono);font-size:10px;color:rgba(234,242,255,.28)}
.pf-link-chev{color:rgba(234,242,255,.24);font-size:14px;flex-shrink:0}
.pf-link.danger .pf-link-lbl{color:rgba(255,90,90,.7)}

/* Dev section */
.pf-dev{border:2px solid rgba(255,60,60,.3);border-radius:14px;padding:14px;background:rgba(255,60,60,.03);margin-top:20px}
`;

export default function UserProfile() {
  const { user, logout, setView, setEditingCharacter, isSubscribed, setIsSubscribed } = useApp();
  const [characters, setCharacters] = useState<Character[]>([]);
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
      getAllHatchedCreatures(user.id),
    ]).then(([chars, crs]) => {
      setCharacters(chars);
      setCreatures(crs);
    });
    ensureRefCode(user.id).then(code => {
      setInviteLink(`${BASE_URL}?friend=${code}`);
    }).catch(() => {});
  }, [user]);

  const familyChars = useMemo(() => characters.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human')), [characters]);

  const childCreatureMap = useMemo(() => {
    const map: Record<string, HatchedCreature | undefined> = {};
    familyChars.forEach(c => {
      map[c.id] = creatures.find(cr => cr.characterId === c.id);
    });
    return map;
  }, [familyChars, creatures]);

  if (!user) return null;

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="pf">
      <style>{CSS}</style>

      {/* Header */}
      <div className="pf-hdr">
        <button className="pf-back" onClick={() => setView('my-space')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1>Settings</h1>
      </div>

      <div className="pf-inner">

        {/* Display name + member info */}
        <div style={{
          textAlign: 'center', padding: '20px 0 4px',
          animation: 'pFadeUp .5s ease both',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px',
            background: 'rgba(245,184,76,.1)', border: '2px solid rgba(245,184,76,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 900, color: 'var(--amber)',
          }}>
            {user.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 900, color: 'var(--cream)' }}>
            {user.displayName || 'Parent'}
          </div>
          {memberSince && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(234,242,255,.25)', letterSpacing: '.8px', textTransform: 'uppercase', marginTop: 4 }}>
              Member since {memberSince}
            </div>
          )}
        </div>

        {/* Children */}
        <div className="pf-sec">
          <div className="pf-sec-lbl">Children</div>
          {familyChars.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(234,242,255,.38)', fontStyle: 'italic', padding: '4px 0 8px' }}>
              Save your child's details once — used in every story automatically.
            </div>
          ) : (
            familyChars.map(c => {
              const cr = childCreatureMap[c.id];
              const crDef = cr ? getCreature(cr.creatureType) : null;
              return (
                <div key={c.id} style={{ marginBottom: 8 }}>
                  <div className="pf-kid" onClick={() => { setEditingCharacter(c); setView('characters'); }}>
                    <div className="pf-kid-av" style={{ background: c.color ? `linear-gradient(145deg,${c.color}30,rgba(12,24,64,.6))` : 'rgba(255,255,255,.06)', borderColor: c.color ? c.color + '50' : 'rgba(245,184,76,.3)' }}>
                      {c.photo ? <img src={c.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (c.emoji || c.name?.charAt(0))}
                    </div>
                    <div className="pf-kid-info">
                      <div className="pf-kid-name">{c.name}</div>
                      <div className="pf-kid-meta">
                        {c.ageDescription ? `Age ${c.ageDescription}` : ''}
                        {cr ? ` \u00B7 ${cr.name}` : ''}
                        {crDef ? ` \u00B7 ${crDef.name}` : ''}
                      </div>
                    </div>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.24)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCharacter(c); setView('memory-portrait' as any); }}
                    style={{
                      width: '100%', padding: '9px 16px', marginTop: -2,
                      borderRadius: '0 0 14px 14px',
                      border: '1px solid rgba(154,127,212,.12)', borderTop: 'none',
                      background: 'rgba(154,127,212,.04)', cursor: 'pointer',
                      fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '.4px',
                      color: 'rgba(154,127,212,.55)', textAlign: 'center',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(154,127,212,.08)'; e.currentTarget.style.color = 'rgba(154,127,212,.75)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(154,127,212,.04)'; e.currentTarget.style.color = 'rgba(154,127,212,.55)'; }}
                  >
                    Memory Portrait
                  </button>
                </div>
              );
            })
          )}
          <div className="pf-kid-add" onClick={() => { setEditingCharacter(null); setView('onboarding'); }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px dashed rgba(234,242,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(234,242,255,.28)', flexShrink: 0 }}>+</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(234,242,255,.38)' }}>Add another child</div>
          </div>
        </div>

        {/* Settings */}
        <div className="pf-sec">
          <div className="pf-sec-lbl">Account</div>

          <div className="pf-link" onClick={() => {
            if (inviteLink) { navigator.clipboard.writeText(inviteLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
          }}>
            <div className="pf-link-ico">🔗</div>
            <div className="pf-link-lbl">{copied ? 'Link copied!' : 'Invite a friend'}</div>
            {copied && <div className="pf-link-val" style={{ color: '#14d890' }}>✓</div>}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.24)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <div className="pf-link" onClick={() => setBedtimeOpen(true)}>
            <div className="pf-link-ico">🔔</div>
            <div className="pf-link-lbl">Bedtime reminder</div>
            <div className="pf-link-val" style={{ color: bedtime.enabled ? '#14d890' : undefined }}>
              {bedtime.enabled ? bedtime.time.replace(/^0/, '') : 'OFF'}
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.24)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <div className="pf-link">
            <div className="pf-link-ico">🌐</div>
            <div className="pf-link-lbl">Language</div>
            <div className="pf-link-val">EN</div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.24)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <div className="pf-link">
            <div className="pf-link-ico">💳</div>
            <div className="pf-link-lbl">Subscription</div>
            <div className="pf-link-val" style={{ color: isSubscribed ? '#14d890' : undefined }}>{isSubscribed ? 'Active' : 'Free'}</div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.24)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <div className="pf-link danger" onClick={logout}>
            <div className="pf-link-ico">🚪</div>
            <div className="pf-link-lbl">Sign out</div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,.24)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>

        {/* Dev subscription toggle */}
        <div className="pf-dev">
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(8px)' }}
          onClick={() => setBedtimeOpen(false)}>
          <div style={{ background: '#0C1840', border: '1px solid rgba(255,255,255,.09)', borderRadius: 22, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.7)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 900, color: '#F4EFE8', marginBottom: 6 }}>Bedtime Reminder</div>
            <div style={{ fontSize: 12, color: 'rgba(234,242,255,.38)', lineHeight: 1.6, marginBottom: 20 }}>
              Get a notification when it's story time. Works while the app is open.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(234,242,255,.6)' }}>Enable reminder</span>
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

            {bedtime.enabled && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(234,242,255,.28)', marginBottom: 8 }}>Remind me at</div>
                <input type="time" value={bedtimeTime} onChange={e => setBedtimeTime(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(245,184,76,.25)',
                    background: 'rgba(245,184,76,.06)', color: '#F5B84C', fontFamily: 'var(--mono)',
                    fontSize: 20, fontWeight: 600, textAlign: 'center', outline: 'none',
                    WebkitAppearance: 'none',
                  }} />
              </div>
            )}

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
                flex: 1, padding: 12, borderRadius: 18, background: '#F5B84C', color: '#172200',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'var(--serif)',
              }}>
                Save
              </button>
              <button onClick={() => setBedtimeOpen(false)} style={{
                padding: '12px 16px', borderRadius: 18, border: '1px solid rgba(244,239,232,.16)',
                background: 'rgba(244,239,232,.06)', color: 'rgba(234,242,255,.6)', fontSize: 13,
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
