// ─────────────────────────────────────────────────────────────────────────────
// BottomNavigation — 4-tab mobile-first bottom nav for SleepSeed
// ─────────────────────────────────────────────────────────────────────────────
// Tabs: Discover, Today, Create (emphasized), My Space
// Premium dark glass style, soft transitions, calm active state.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.ss-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:100;padding:0 12px env(safe-area-inset-bottom,0px) 12px}
.ss-nav-bar{display:flex;align-items:center;justify-content:space-around;height:64px;border-radius:20px;background:rgba(8,12,28,.98);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 -4px 24px rgba(0,0,0,.5),0 0 0 .5px rgba(255,255,255,.04) inset;margin-bottom:6px}
.ss-nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent;position:relative;padding:6px 0}
.ss-nav-ico{width:40px;height:32px;border-radius:12px;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.16,1,.3,1)}
.ss-nav-tab.on .ss-nav-ico{background:rgba(245,184,76,.1)}
.ss-nav-ico:active{transform:scale(.82)}
.ss-nav-tab svg{color:rgba(244,239,232,.22);transition:color .25s}
.ss-nav-tab.on svg{color:#F5B84C}
.ss-nav-lbl{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.04em;color:rgba(244,239,232,.2);transition:color .25s;white-space:nowrap;line-height:1}
.ss-nav-tab.on .ss-nav-lbl{color:rgba(245,184,76,.85)}
.ss-nav-dot{position:absolute;top:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#F5B84C;opacity:0;transition:opacity .25s}
.ss-nav-tab.on .ss-nav-dot{opacity:1}
.ss-nav-create .ss-nav-ico{width:44px;height:34px;border-radius:14px;background:rgba(245,184,76,.06);border:1px solid rgba(245,184,76,.1);transition:all .25s cubic-bezier(.16,1,.3,1)}
.ss-nav-create.on .ss-nav-ico{background:rgba(245,184,76,.15);border-color:rgba(245,184,76,.25);box-shadow:0 0 16px rgba(245,184,76,.12)}
.ss-nav-create svg{color:rgba(245,184,76,.4)!important}
.ss-nav-create.on svg{color:#F5B84C!important}
`;

interface Props {
  current: string;
  onNav: (viewId: string) => void;
}

export default function BottomNavigation({ current, onNav }: Props) {
  const tabs: { id: string; label: string; className?: string; icon: React.ReactNode }[] = [
    {
      id: 'library', label: 'Discover',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
    },
    {
      id: 'dashboard', label: 'Today',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
        </svg>
      ),
    },
    {
      id: 'ritual-starter', label: 'Create', className: 'ss-nav-create',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
    },
    {
      id: 'my-space', label: 'My Space',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 2l1.09 3.36h3.53l-2.86 2.08 1.09 3.36L12 8.72l-2.85 2.08 1.09-3.36-2.86-2.08h3.53z"/>
          <circle cx="5" cy="18" r="1.5"/>
          <circle cx="19" cy="18" r="1.5"/>
          <circle cx="12" cy="20" r="1"/>
          <circle cx="8" cy="15" r="1"/>
          <circle cx="16" cy="15" r="1"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{CSS}</style>
      <nav className="ss-nav">
        <div className="ss-nav-bar">
          {tabs.map(t => (
            <div
              key={t.id}
              className={`ss-nav-tab${t.className ? ` ${t.className}` : ''}${current === t.id ? ' on' : ''}`}
              onClick={() => onNav(t.id)}
              role="button"
              tabIndex={0}
            >
              <div className="ss-nav-dot" />
              <div className="ss-nav-ico">{t.icon}</div>
              <div className="ss-nav-lbl">{t.label}</div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
