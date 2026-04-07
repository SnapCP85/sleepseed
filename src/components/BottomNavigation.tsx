// ─────────────────────────────────────────────────────────────────────────────
// BottomNavigation — 4-tab mobile-first bottom nav for SleepSeed
// ─────────────────────────────────────────────────────────────────────────────
// Tabs: Today, Discover, Create (emphasized), My Space
// Premium dark glass style with gold accents and generous touch targets.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.ss-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;padding:0 10px env(safe-area-inset-bottom,0px) 10px;background:linear-gradient(to top,#060912 55%,rgba(6,9,18,.97) 75%,rgba(6,9,18,.85) 90%,transparent 100%);padding-top:28px}
@media(min-width:768px){.ss-nav{padding:0 20px env(safe-area-inset-bottom,0px) 20px;padding-top:28px}}
.ss-nav-bar{display:flex;align-items:center;justify-content:space-around;height:72px;border-radius:22px;background:rgba(10,14,32,.98);border:1px solid rgba(245,184,76,.08);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);box-shadow:0 -6px 32px rgba(0,0,0,.6),0 0 0 .5px rgba(245,184,76,.04) inset,0 1px 0 rgba(255,255,255,.03) inset;margin-bottom:8px;max-width:600px;margin-left:auto;margin-right:auto}
.ss-nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;-webkit-tap-highlight-color:transparent;position:relative;padding:8px 0;transition:transform .15s}
.ss-nav-tab:active{transform:scale(.92)}
.ss-nav-ico{width:44px;height:36px;border-radius:14px;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.16,1,.3,1)}
.ss-nav-tab.on .ss-nav-ico{background:rgba(245,184,76,.12);box-shadow:0 0 12px rgba(245,184,76,.08)}
.ss-nav-tab svg{color:rgba(244,239,232,.3);transition:color .3s}
.ss-nav-tab.on svg{color:#F5B84C;filter:drop-shadow(0 0 4px rgba(245,184,76,.25))}
.ss-nav-lbl{font-family:'Nunito',system-ui,sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.02em;color:rgba(244,239,232,.25);transition:color .3s;white-space:nowrap;line-height:1}
.ss-nav-tab.on .ss-nav-lbl{color:rgba(245,184,76,.9)}
.ss-nav-dot{position:absolute;top:2px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:#F5B84C;opacity:0;transition:opacity .3s;box-shadow:0 0 6px rgba(245,184,76,.4)}
.ss-nav-tab.on .ss-nav-dot{opacity:1}
.ss-nav-create .ss-nav-ico{width:52px;height:40px;border-radius:16px;background:linear-gradient(135deg,rgba(245,184,76,.08),rgba(245,184,76,.04));border:1.5px solid rgba(245,184,76,.15);transition:all .3s cubic-bezier(.16,1,.3,1)}
.ss-nav-create.on .ss-nav-ico{background:linear-gradient(135deg,rgba(245,184,76,.2),rgba(245,184,76,.1));border-color:rgba(245,184,76,.35);box-shadow:0 0 20px rgba(245,184,76,.15),0 0 40px rgba(245,184,76,.05)}
.ss-nav-create svg{color:rgba(245,184,76,.5)!important}
.ss-nav-create.on svg{color:#F5B84C!important;filter:drop-shadow(0 0 6px rgba(245,184,76,.4))!important}
`;

interface Props {
  current: string;
  onNav: (viewId: string) => void;
}

export default function BottomNavigation({ current, onNav }: Props) {
  const tabs: { id: string; label: string; className?: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard', label: 'Today',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
        </svg>
      ),
    },
    {
      id: 'library', label: 'Discover',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
    },
    {
      id: 'ritual-starter', label: 'Create', className: 'ss-nav-create',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
    },
    {
      id: 'my-space', label: 'My Space',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
