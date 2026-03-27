import { useState, useEffect } from 'react';
import { updateUserProfile, updateUserEmail, updateUserPassword, getCharacters } from '../lib/storage';
import type { User, Character } from '../lib/types';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--amber:#E8972A;--amber2:#F5B84C;--cream:#F4EFE8;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.ps{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased}
.ps-inner{max-width:600px;margin:0 auto;padding:32px 24px 80px}
.ps-header{margin-bottom:32px}
.ps-title{font-family:var(--serif);font-size:28px;font-weight:700;color:var(--cream);margin-bottom:4px}
.ps-sub{font-size:13px;color:rgba(244,239,232,.4);font-weight:300}
.ps-section{margin-bottom:28px}
.ps-section-h{font-size:10px;font-family:var(--mono);letter-spacing:1.5px;text-transform:uppercase;color:rgba(232,151,42,.6);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.ps-section-h::before{content:'';width:14px;height:1px;background:rgba(232,151,42,.4)}
.ps-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px}
.ps-field{display:flex;flex-direction:column;gap:5px}
.ps-label{font-size:11px;font-weight:600;color:rgba(244,239,232,.5);text-transform:uppercase;letter-spacing:.5px}
.ps-input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--cream);font-family:var(--sans);outline:none;transition:all .2s}
.ps-input:focus{border-color:rgba(232,151,42,.5);background:rgba(232,151,42,.04)}
.ps-input::placeholder{color:rgba(244,239,232,.25)}
.ps-input:disabled{opacity:.5;cursor:not-allowed}
.ps-row{display:flex;gap:12px;align-items:flex-end}
.ps-row .ps-field{flex:1}
.ps-save{padding:10px 22px;border-radius:50px;border:none;background:var(--amber);color:#1A1420;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .2s;flex-shrink:0}
.ps-save:hover{background:var(--amber2);transform:translateY(-1px)}
.ps-save:disabled{opacity:.4;cursor:not-allowed;transform:none}
.ps-saved{font-size:11px;color:rgba(76,200,144,.8);font-family:var(--mono);display:flex;align-items:center;gap:4px}
.ps-err{font-size:11px;color:rgba(255,120,100,.8);margin-top:4px}
.ps-divider{height:1px;background:rgba(255,255,255,.06);margin:0}
.ps-child-list{display:flex;flex-direction:column;gap:10px}
.ps-child{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;transition:all .15s}
.ps-child:hover{background:rgba(255,255,255,.05)}
.ps-child-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:2px solid rgba(232,151,42,.15)}
.ps-child-info{flex:1;min-width:0}
.ps-child-name{font-size:14px;font-weight:600;color:var(--cream)}
.ps-child-meta{font-size:10px;color:rgba(244,239,232,.35);font-family:var(--mono);margin-top:2px}
.ps-child-edit{padding:6px 14px;border-radius:50px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(244,239,232,.5);font-size:11px;cursor:pointer;font-family:var(--sans);transition:all .15s;flex-shrink:0}
.ps-child-edit:hover{border-color:rgba(232,151,42,.3);color:var(--amber2)}
.ps-add-child{padding:12px;border-radius:12px;border:1.5px dashed rgba(232,151,42,.2);background:rgba(232,151,42,.04);color:rgba(232,151,42,.6);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);text-align:center;transition:all .15s}
.ps-add-child:hover{background:rgba(232,151,42,.08);border-color:rgba(232,151,42,.35);color:var(--amber2)}
.ps-plan{display:flex;align-items:center;justify-content:space-between;padding:16px;background:rgba(232,151,42,.06);border:1px solid rgba(232,151,42,.15);border-radius:14px}
.ps-plan-info{}
.ps-plan-name{font-size:15px;font-weight:700;color:var(--cream)}
.ps-plan-detail{font-size:11px;color:rgba(244,239,232,.4);margin-top:3px}
.ps-plan-btn{padding:9px 20px;border-radius:50px;border:1px solid rgba(232,151,42,.3);background:transparent;color:var(--amber2);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .15s}
.ps-plan-btn:hover{background:rgba(232,151,42,.1)}
.ps-danger{margin-top:40px;padding:20px;background:rgba(200,60,60,.04);border:1px solid rgba(200,60,60,.12);border-radius:14px}
.ps-danger-h{font-size:12px;font-weight:700;color:rgba(255,140,130,.7);margin-bottom:6px}
.ps-danger-sub{font-size:11px;color:rgba(244,239,232,.35);line-height:1.6;margin-bottom:12px}
.ps-danger-btn{padding:9px 20px;border-radius:50px;border:1px solid rgba(200,60,60,.25);background:transparent;color:rgba(255,140,130,.6);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .15s}
.ps-danger-btn:hover{background:rgba(200,60,60,.08);color:rgba(255,140,130,.9)}
.ps-meta{margin-top:28px;text-align:center;font-size:10px;color:rgba(244,239,232,.2);font-family:var(--mono)}
`;

interface Props {
  user: User;
  onBack: () => void;
  onEditCharacter: (c: Character) => void;
  onViewCharacter: (c: Character) => void;
  onNewCharacter: () => void;
  onLogout: () => void;
  onUserUpdated: (u: Partial<User>) => void;
}

export default function ProfileSettings({ user, onBack, onEditCharacter, onViewCharacter, onNewCharacter, onLogout, onUserUpdated }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [children, setChildren] = useState<Character[]>([]);
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getCharacters(user.id).then(c => setChildren(c));
  }, [user.id]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSaving('name'); setError('');
    try {
      await updateUserProfile(user.id, { display_name: displayName.trim() });
      onUserUpdated({ displayName: displayName.trim() });
      setSaved('name');
      setTimeout(() => setSaved(''), 2500);
    } catch (e: any) { setError(e.message || 'Failed to update name'); }
    finally { setSaving(''); }
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) return;
    setSaving('email'); setError('');
    try {
      await updateUserEmail(email.trim());
      onUserUpdated({ email: email.trim() });
      setSaved('email');
      setTimeout(() => setSaved(''), 2500);
    } catch (e: any) { setError(e.message || 'Failed to update email'); }
    finally { setSaving(''); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setSaving('password'); setError('');
    try {
      await updateUserPassword(newPassword);
      setNewPassword(''); setConfirmPassword('');
      setSaved('password');
      setTimeout(() => setSaved(''), 2500);
    } catch (e: any) { setError(e.message || 'Failed to update password'); }
    finally { setSaving(''); }
  };

  return (
    <div className="ps">
      <style>{CSS}</style>
      <div className="ps-inner">

        <div className="ps-header">
          <div className="ps-title">My Profile</div>
          <div className="ps-sub">Manage your account, children, and subscription</div>
        </div>

        {/* ── Account ── */}
        <div className="ps-section">
          <div className="ps-section-h">Account</div>
          <div className="ps-card">
            <div className="ps-row">
              <div className="ps-field">
                <div className="ps-label">Display Name</div>
                <input className="ps-input" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name" />
              </div>
              <button className="ps-save" disabled={saving === 'name' || displayName.trim() === user.displayName}
                onClick={handleSaveName}>
                {saving === 'name' ? '…' : saved === 'name' ? '✓ Saved' : 'Save'}
              </button>
            </div>

            <div className="ps-divider" />

            <div className="ps-row">
              <div className="ps-field">
                <div className="ps-label">Email Address</div>
                <input className="ps-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com" />
              </div>
              <button className="ps-save" disabled={saving === 'email' || email.trim() === user.email}
                onClick={handleSaveEmail}>
                {saving === 'email' ? '…' : saved === 'email' ? '✓ Saved' : 'Save'}
              </button>
            </div>

            <div className="ps-divider" />

            <div className="ps-field">
              <div className="ps-label">Change Password</div>
              <input className="ps-input" type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 characters)" />
            </div>
            {newPassword && (
              <div className="ps-row">
                <div className="ps-field">
                  <input className="ps-input" type="password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
                <button className="ps-save" disabled={saving === 'password' || !newPassword}
                  onClick={handleChangePassword}>
                  {saving === 'password' ? '…' : saved === 'password' ? '✓ Updated' : 'Update'}
                </button>
              </div>
            )}

            {error && <div className="ps-err">{error}</div>}

            <div className="ps-divider" />

            <div className="ps-field">
              <div className="ps-label">Account ID</div>
              <input className="ps-input" value={user.id} disabled style={{ fontSize: 11, fontFamily: 'var(--mono)' }} />
            </div>
            <div className="ps-field">
              <div className="ps-label">Member Since</div>
              <input className="ps-input" value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} disabled />
            </div>
          </div>
        </div>

        {/* ── Children Profiles ── */}
        <div className="ps-section">
          <div className="ps-section-h">Children Profiles</div>
          <div className="ps-card">
            {children.length > 0 ? (
              <div className="ps-child-list">
                {children.map(c => (
                  <div key={c.id} className="ps-child" style={{cursor:'pointer'}} onClick={() => onViewCharacter(c)}>
                    <div className="ps-child-av" style={{ background: c.color || '#1E1640' }}>
                      {c.photo ? <img src={c.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (c.emoji || '🧒')}
                    </div>
                    <div className="ps-child-info">
                      <div className="ps-child-name">{c.name}</div>
                      <div className="ps-child-meta">
                        {c.ageDescription && `${c.ageDescription} · `}{c.pronouns}{c.storyIds?.length ? ` · ${c.storyIds.length} stories` : ''}
                      </div>
                    </div>
                    <button className="ps-child-edit" onClick={e => { e.stopPropagation(); onEditCharacter(c); }}>Edit</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'rgba(244,239,232,.35)', fontSize: 13 }}>
                No children profiles yet
              </div>
            )}
            <div className="ps-add-child" onClick={onNewCharacter}>+ Add a child profile</div>
          </div>
        </div>

        {/* ── Subscription ── */}
        <div className="ps-section">
          <div className="ps-section-h">Subscription & Billing</div>
          <div className="ps-card">
            <div className="ps-plan">
              <div className="ps-plan-info">
                <div className="ps-plan-name">Free Plan</div>
                <div className="ps-plan-detail">3 stories included · Night Cards · Sharing</div>
              </div>
              <button className="ps-plan-btn">Upgrade</button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(244,239,232,.3)', lineHeight: 1.6 }}>
              Upgrade to Pro for unlimited stories, priority generation, annual printed Night Card books, and family sharing.
            </div>
          </div>
        </div>

        {/* ── Preferences ── */}
        <div className="ps-section">
          <div className="ps-section-h">Preferences</div>
          <div className="ps-card">
            <div className="ps-field">
              <div className="ps-label">Default Reading Level</div>
              <select className="ps-input" defaultValue="age5" style={{ cursor: 'pointer' }}>
                <option value="age3">Ages 3–4</option>
                <option value="age5">Ages 5–6</option>
                <option value="age7">Ages 7–8</option>
                <option value="age9">Ages 9–10</option>
              </select>
            </div>
            <div className="ps-field">
              <div className="ps-label">Default Story Length</div>
              <select className="ps-input" defaultValue="standard" style={{ cursor: 'pointer' }}>
                <option value="short">Short (~8 pages)</option>
                <option value="standard">Standard (~12 pages)</option>
                <option value="long">Long (~16 pages)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="ps-danger">
          <div className="ps-danger-h">Danger Zone</div>
          <div className="ps-danger-sub">
            Signing out will keep your account and stories safe. Deleting your account is permanent and removes all stories, Night Cards, and children profiles.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ps-danger-btn" onClick={onLogout}>Sign out</button>
            <button className="ps-danger-btn" style={{ borderColor: 'rgba(200,60,60,.4)' }}
              onClick={() => { if (confirm('Are you sure? This cannot be undone.')) onLogout(); }}>
              Delete account
            </button>
          </div>
        </div>

        <div className="ps-meta">SleepSeed · sleepseed.app</div>
      </div>
    </div>
  );
}
