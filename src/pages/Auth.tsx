import { useState } from 'react';
import { useApp } from '../AppContext';
import { getAllUsers, saveUser, hashPassword, uid, createGuestUser } from '../lib/storage';
import type { User } from '../lib/types';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
.auth-wrap{min-height:100vh;background:#0B0B1A;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden}
.auth-glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:600px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.08),transparent 65%);pointer-events:none}
.auth-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:40px 36px;width:100%;max-width:420px;position:relative;z-index:1}
.auth-logo{font-family:'Lora',serif;font-size:22px;font-weight:700;color:#F0EDE8;text-align:center;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px}
.auth-tagline{font-size:13px;color:rgba(240,237,232,.38);text-align:center;margin-bottom:32px;font-weight:300}
.auth-tabs{display:flex;background:rgba(255,255,255,.04);border-radius:12px;padding:4px;margin-bottom:28px;gap:4px}
.auth-tab{flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;transition:all .2s;color:rgba(240,237,232,.45);background:transparent}
.auth-tab.on{background:rgba(168,85,247,.2);color:#C084FC;border:1px solid rgba(168,85,247,.3)}
.auth-field{margin-bottom:16px}
.auth-label{font-size:11px;color:rgba(240,237,232,.45);letter-spacing:.5px;margin-bottom:6px;display:block;font-weight:500}
.auth-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 16px;font-size:14px;color:#F0EDE8;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.auth-input:focus{border-color:rgba(168,85,247,.5)}
.auth-input::placeholder{color:rgba(240,237,232,.2)}
.auth-btn{width:100%;padding:14px;background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;border:none;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-top:8px}
.auth-btn:hover{opacity:.9;transform:translateY(-1px)}
.auth-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.auth-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 14px;font-size:12px;color:rgba(252,165,165,.9);margin-bottom:16px;line-height:1.5}
.auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:rgba(240,237,232,.2);font-size:11px}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07)}
.auth-guest{width:100%;padding:12px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:rgba(240,237,232,.5);font-size:13px;font-weight:400;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.auth-guest:hover{border-color:rgba(255,255,255,.2);color:rgba(240,237,232,.75)}
.auth-back{display:flex;align-items:center;gap:6px;background:transparent;border:none;color:rgba(240,237,232,.35);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:20px;padding:0;transition:color .2s}
.auth-back:hover{color:rgba(240,237,232,.65)}
`;

export default function Auth() {
  const { login, setView } = useApp();
  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = () => {
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords don\'t match.'); return; }
    const existing = getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) { setError('An account with this email already exists. Sign in instead.'); return; }
    setLoading(true);
    const user: User = {
      id: uid(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    saveUser(user);
    setTimeout(() => { setLoading(false); login(user); }, 400);
  };

  const handleSignin = () => {
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    const user = getAllUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      setError('Email or password is incorrect.'); return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); login(user); }, 300);
  };

  const handleGuest = () => {
    const guest = createGuestUser();
    login(guest);
  };

  return (
    <div className="auth-wrap">
      <style>{CSS}</style>
      <div className="auth-glow" />
      <div className="auth-card">
        <button className="auth-back" onClick={() => setView('public')}>← Back to home</button>
        <div className="auth-logo">🌙 SleepSeed</div>
        <div className="auth-tagline">Bedtime stories, made for your child.</div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'signup' ? ' on' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>Create account</button>
          <button className={`auth-tab${tab === 'signin' ? ' on' : ''}`} onClick={() => { setTab('signin'); setError(''); }}>Sign in</button>
        </div>

        {error && <div className="auth-err">{error}</div>}

        <div className="auth-field">
          <label className="auth-label">Email address</label>
          <input className="auth-input" type="email" placeholder="you@email.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'signup' ? handleSignup() : handleSignin())} />
        </div>
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'}
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'signup' ? handleSignup() : handleSignin())} />
        </div>
        {tab === 'signup' && (
          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <input className="auth-input" type="password" placeholder="Same password again"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()} />
          </div>
        )}

        <button className="auth-btn" disabled={loading}
          onClick={tab === 'signup' ? handleSignup : handleSignin}>
          {loading ? '…' : tab === 'signup' ? 'Create free account' : 'Sign in'}
        </button>

        <div className="auth-divider">or</div>
        <button className="auth-guest" onClick={handleGuest}>
          Continue as guest — try it first
        </button>
      </div>
    </div>
  );
}
