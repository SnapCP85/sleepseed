import { useState } from 'react';
import { useApp } from '../AppContext';
import { signUp, signIn, signInAsGuest, resetPassword } from '../lib/storage';
import type { User } from '../lib/types';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--ink:#1A1420;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
.auth-page{min-height:100vh;background:var(--night);font-family:var(--sans);display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
.auth-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:64px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(13,16,24,.97);backdrop-filter:blur(16px);position:sticky;top:0;z-index:10}
.auth-logo{font-family:var(--serif);font-size:19px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:9px;cursor:pointer}
.auth-logo-moon{width:21px;height:21px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.auth-back{font-size:13px;color:rgba(244,239,232,.4);cursor:pointer;display:flex;align-items:center;gap:6px;background:none;border:none;font-family:var(--sans);transition:color .15s}
.auth-back:hover{color:rgba(244,239,232,.75)}
.auth-body{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 24px;position:relative;overflow:hidden}
.auth-glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:700px;height:500px;border-radius:50%;background:radial-gradient(ellipse,rgba(232,151,42,.05),transparent 65%);pointer-events:none}
.auth-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:44px 40px;width:100%;max-width:440px;position:relative;z-index:1;animation:slideUp .5s cubic-bezier(.22,1,.36,1) both}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.auth-moon-wrap{text-align:center;margin-bottom:22px;position:relative}
.auth-moon{width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto;box-shadow:0 0 32px 6px rgba(232,151,42,.12)}
.auth-demos{position:absolute;top:-44px;right:-40px;display:flex;gap:6px}
.auth-demo-btn{padding:5px 9px;border-radius:7px;border:1px solid rgba(232,151,42,.18);background:rgba(232,151,42,.05);color:rgba(245,184,76,.6);font-size:9px;font-weight:600;font-family:var(--mono);cursor:pointer;transition:all .2s;text-decoration:none;letter-spacing:.3px;white-space:nowrap}
.auth-demo-btn:hover{background:rgba(232,151,42,.14);border-color:rgba(232,151,42,.4);color:var(--amber2)}
.auth-headline{font-family:var(--serif);font-size:28px;font-weight:700;color:#F4EFE8;text-align:center;margin-bottom:6px;letter-spacing:-.02em}
.auth-headline em{font-style:italic;color:var(--amber2)}
.auth-sub{font-size:13px;color:rgba(244,239,232,.38);text-align:center;font-weight:300;margin-bottom:32px;line-height:1.65}
.auth-tabs{display:flex;background:rgba(255,255,255,.04);border-radius:12px;padding:4px;gap:4px;margin-bottom:28px;border:1px solid rgba(255,255,255,.06)}
.auth-tab{flex:1;padding:10px;border-radius:9px;border:none;cursor:pointer;font-family:var(--sans);font-size:13px;font-weight:500;transition:all .2s;color:rgba(244,239,232,.38);background:transparent}
.auth-tab.on{background:rgba(232,151,42,.14);color:var(--amber2);border:1px solid rgba(232,151,42,.24)}
.auth-field{margin-bottom:16px}
.auth-label{font-size:11px;color:rgba(244,239,232,.38);letter-spacing:.5px;margin-bottom:7px;display:block;font-weight:500;font-family:var(--mono)}
.auth-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:14px 16px;font-size:14px;color:#F4EFE8;font-family:var(--sans);outline:none;transition:all .2s}
.auth-input:focus{border-color:rgba(232,151,42,.45);background:rgba(232,151,42,.03)}
.auth-input::placeholder{color:rgba(244,239,232,.18);font-weight:300}
.auth-err{background:rgba(200,80,80,.08);border:1px solid rgba(200,80,80,.2);border-radius:11px;padding:12px 16px;font-size:12.5px;color:rgba(255,180,180,.9);margin-bottom:18px;line-height:1.55}
.auth-ok{background:rgba(80,180,120,.08);border:1px solid rgba(80,180,120,.2);border-radius:11px;padding:12px 16px;font-size:12.5px;color:rgba(150,230,180,.9);margin-bottom:18px;line-height:1.55}
.auth-btn{width:100%;padding:15px;background:var(--amber);color:var(--ink);border:none;border-radius:13px;font-size:15px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s;margin-top:6px}
.auth-btn:hover{background:var(--amber2);transform:translateY(-1px);box-shadow:0 8px 28px rgba(232,151,42,.25)}
.auth-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
.auth-forgot{text-align:right;margin-top:-10px;margin-bottom:18px}
.auth-forgot button{background:none;border:none;font-size:12px;color:rgba(244,239,232,.3);cursor:pointer;font-family:var(--sans);transition:color .15s}
.auth-forgot button:hover{color:rgba(244,239,232,.6)}
.auth-divider{display:flex;align-items:center;gap:14px;margin:22px 0;color:rgba(244,239,232,.18);font-size:11px;font-family:var(--mono)}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}
.auth-guest{width:100%;padding:14px;background:transparent;border:1px solid rgba(255,255,255,.09);border-radius:13px;color:rgba(244,239,232,.45);font-size:13px;cursor:pointer;font-family:var(--sans);transition:all .2s;display:flex;flex-direction:column;gap:3px;align-items:center}
.auth-guest:hover{border-color:rgba(255,255,255,.18);color:rgba(244,239,232,.7)}
.auth-guest strong{font-size:13px;font-weight:500;color:rgba(244,239,232,.6)}
.auth-guest small{font-size:11px;color:rgba(244,239,232,.28)}
.auth-verify{text-align:center;padding:16px 0}
.auth-verify-icon{font-size:40px;margin-bottom:12px}
.auth-verify-title{font-family:var(--serif);font-size:22px;color:#F4EFE8;margin-bottom:8px}
.auth-verify-sub{font-size:13px;color:rgba(244,239,232,.45);line-height:1.65}
`;

type Screen = 'form' | 'verify' | 'reset-sent';

export default function Auth() {
  const { login, setView } = useApp();
  const [tab,      setTab]     = useState<'signup' | 'signin'>('signup');
  const [screen,   setScreen]  = useState<Screen>('form');
  const [name,     setName]    = useState('');
  const [email,    setEmail]   = useState('');
  const [password, setPassword]= useState('');
  const [confirm,  setConfirm] = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const handleSignup = async () => {
    setError('');
    if (!name.trim())               { setError('Please enter your name.'); return; }
    if (!email.trim() || !password) { setError('Please enter your email and a password.'); return; }
    if (password.length < 6)        { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)        { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const displayName = name.trim();
      const sbUser = await signUp(email.trim().toLowerCase(), password, displayName);
      if (sbUser) {
        if (sbUser.email_confirmed_at || sbUser.confirmed_at) {
          const u: User = { id: sbUser.id, email: sbUser.email ?? '', passwordHash: '', displayName: sbUser.user_metadata?.display_name ?? displayName, createdAt: sbUser.created_at, isGuest: false };
          login(u);
        } else {
          setScreen('verify');
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const sbUser = await signIn(email.trim().toLowerCase(), password);
      if (sbUser) {
        const u: User = { id: sbUser.id, email: sbUser.email ?? '', passwordHash: '', displayName: sbUser.user_metadata?.display_name ?? sbUser.email?.split('@')[0] ?? 'User', createdAt: sbUser.created_at, isGuest: false };
        login(u);
      }
    } catch (e: any) {
      const msg = e.message ?? '';
      if (msg.includes('Invalid login')) setError('Email or password is incorrect.');
      else if (msg.includes('Email not confirmed')) setError('Please check your email and click the confirmation link first.');
      else setError(msg || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setError('Enter your email address above first.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setScreen('reset-sent');
    } catch (e: any) {
      setError(e.message ?? 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const sbUser = await signInAsGuest();
      if (sbUser) {
        const u: User = { id: sbUser.id, email: '', passwordHash: '', displayName: 'Guest', createdAt: sbUser.created_at, isGuest: true };
        login(u);
      }
    } catch (e: any) {
      setError(e.message ?? 'Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') tab === 'signup' ? handleSignup() : handleSignin();
  };

  return (
    <div className="auth-page">
      <style>{CSS}</style>
      <nav className="auth-nav">
        <div className="auth-logo" onClick={() => setView('public')}>
          <div className="auth-logo-moon" /> SleepSeed
        </div>
        <button className="auth-back" onClick={() => setView('public')}>← Back to home</button>
      </nav>
      <div className="auth-body">
        <div className="auth-glow" />
        <div className="auth-card">
          <div className="auth-moon-wrap">
            <div className="auth-moon" />
            <div className="auth-demos">
              <a className="auth-demo-btn" href="/onboarding-demo.html" target="_blank" rel="noopener">Onboarding Demo</a>
              <a className="auth-demo-btn" href="/showcase-demo.html" target="_blank" rel="noopener">Showcase Demo</a>
            </div>
          </div>

          {screen === 'verify' && (
            <div className="auth-verify">
              <div className="auth-verify-icon">✉️</div>
              <div className="auth-verify-title">Check your email</div>
              <div className="auth-verify-sub">We sent a confirmation link to <strong style={{color:'#F4EFE8'}}>{email}</strong>.<br/>Click the link in that email to activate your account, then come back and sign in.</div>
              <button className="auth-btn" style={{marginTop:24}} onClick={() => { setScreen('form'); setTab('signin'); }}>Back to sign in</button>
            </div>
          )}

          {screen === 'reset-sent' && (
            <div className="auth-verify">
              <div className="auth-verify-icon">🔑</div>
              <div className="auth-verify-title">Reset email sent</div>
              <div className="auth-verify-sub">Check your inbox at <strong style={{color:'#F4EFE8'}}>{email}</strong> for a password reset link.</div>
              <button className="auth-btn" style={{marginTop:24}} onClick={() => { setScreen('form'); setError(''); }}>Back to sign in</button>
            </div>
          )}

          {screen === 'form' && (
            <>
              <div className="auth-headline">
                {tab === 'signup' ? <>Tonight's story <em>awaits.</em></> : <>Welcome <em>back.</em></>}
              </div>
              <div className="auth-sub">
                {tab === 'signup' ? 'Create your free account and build your first story in 60 seconds.' : 'Sign in to your stories, characters, and Night Cards.'}
              </div>
              <div className="auth-tabs">
                <button className={`auth-tab${tab === 'signup' ? ' on' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>Create account</button>
                <button className={`auth-tab${tab === 'signin' ? ' on' : ''}`} onClick={() => { setTab('signin'); setError(''); }}>Sign in</button>
              </div>
              {error && <div className="auth-err">{error}</div>}
              {tab === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Your name</label>
                  <input className="auth-input" type="text" placeholder="What should we call you?" value={name} onChange={e => setName(e.target.value)} onKeyDown={onKey} autoFocus />
                </div>
              )}
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey} autoFocus={tab === 'signin'} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey} />
              </div>
              {tab === 'signin' && (
                <div className="auth-forgot">
                  <button type="button" onClick={handleForgot}>Forgot password?</button>
                </div>
              )}
              {tab === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Confirm password</label>
                  <input className="auth-input" type="password" placeholder="Same password again" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={onKey} />
                </div>
              )}
              <button className="auth-btn" disabled={loading} onClick={tab === 'signup' ? handleSignup : handleSignin}>
                {loading ? '…' : tab === 'signup' ? 'Create free account' : 'Sign in'}
              </button>
              <div className="auth-divider">or</div>
              <button className="auth-guest" disabled={loading} onClick={handleGuest}>
                <strong>Continue as guest</strong>
                <small>Try the story builder — no account needed</small>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
