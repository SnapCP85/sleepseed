import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import RitualStarter from './pages/RitualStarter';
import StoryHandoff from './pages/StoryHandoff';
import StoryBuilderPage from './pages/StoryBuilderPage';
import CharacterBuilder from './features/characters/CharacterBuilder';
import CharacterLibrary from './features/characters/CharacterLibrary';
import StoryLibrary from './features/stories/StoryLibrary';
import NightCardLibrary from './features/nightcards/NightCardLibrary';
import SleepSeedCore from './SleepSeedCore';
import SharedStoryViewer from './pages/SharedStoryViewer';
import type { Character } from './lib/types';

const APP_NAV_CSS = `
.anav{display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:52px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px);font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.anav-logo{font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:7px;cursor:pointer;flex-shrink:0}
.anav-moon{width:14px;height:14px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;flex-shrink:0}
.anav-moon-sh{position:absolute;width:13px;height:13px;border-radius:50%;background:#050916;top:-3px;left:-6px}
.anav-tabs{display:flex;align-items:center;gap:2px}
.anav-tab{display:flex;align-items:center;gap:5px;cursor:pointer;padding:6px 10px;border-radius:9px;transition:background .15s;font-size:11px;font-weight:500;color:rgba(255,255,255,.3);white-space:nowrap}
.anav-tab:hover{background:rgba(255,255,255,.04);color:rgba(255,255,255,.5)}
.anav-tab.on{background:rgba(232,151,42,.08);color:#E8972A}
@media(max-width:480px){.anav{padding:0 3%}.anav-tab{padding:5px 7px;font-size:10px}}
`;

function AppNav({ currentView, onNavigate }: { currentView: string; onNavigate: (v: string) => void }) {
  const tabs = [
    { key: 'dashboard', label: 'Home', icon: '🏠' },
    { key: 'story-library', label: 'Stories', icon: '📖' },
    { key: 'nightcard-library', label: 'Cards', icon: '🌙' },
    { key: 'user-profile', label: 'Profile', icon: '👤' },
  ];
  return (
    <>
      <style>{APP_NAV_CSS}</style>
      <nav className="anav">
        <div className="anav-logo" onClick={() => onNavigate('dashboard')}>
          <div className="anav-moon"><div className="anav-moon-sh" /></div>
          SleepSeed
        </div>
        <div className="anav-tabs">
          {tabs.map(t => (
            <div key={t.key} className={`anav-tab${currentView === t.key ? ' on' : ''}`}
              onClick={() => onNavigate(t.key)}>
              <span>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

function AppInner() {
  const {
    user, view, setView, logout,
    selectedCharacter, setSelectedCharacter,
    selectedCharacters,
    ritualSeed, ritualMood,
    builderChoices,
    editingCharacter, setEditingCharacter,
  } = useApp();

  // Check for shared story link on mount
  const [isSharedStory, setIsSharedStory] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) setIsSharedStory(true);
  }, []);

  // Shared story viewer — no auth required
  if (isSharedStory) return <SharedStoryViewer />;

  const goAuth = () => setView('auth');
  const goDashboard = () => setView('dashboard');
  const goStoryBuilder = (char?: Character) => {
    if (char) setSelectedCharacter(char);
    setView('story-builder');
  };
  const goCharacters = () => setView('characters');
  const goNewCharacter = () => { setEditingCharacter(null); setView('character-builder'); };
  const goEditCharacter = (c: Character) => { setEditingCharacter(c); setView('character-builder'); };
  const goNightCards = () => setView('nightcard-library');
  const goStoryLibrary = () => setView('story-library');

  if (view === 'public') return (
    <PublicHomepage
      onCreateStory={() => user ? goStoryBuilder() : goAuth()}
      onSignIn={() => setView('auth')}
      onSignUp={() => setView('auth')}
      onNightCards={() => user ? goNightCards() : goAuth()}
      onLibrary={() => user ? goStoryLibrary() : goAuth()}
    />
  );

  if (view === 'auth') return <Auth />;

  const nav = user ? <AppNav currentView={view} onNavigate={(v) => setView(v as any)} /> : null;

  if (view === 'dashboard') return (<UserDashboard onSignUp={goAuth} />);

  if (view === 'ritual-starter') return (<>{nav}<RitualStarter /></>);

  if (view === 'story-handoff') return (<>{nav}<StoryHandoff /></>);

  if (view === 'story-configure') return (<>{nav}<StoryBuilderPage /></>);

  if (view === 'user-profile') return (<>{nav}<UserProfile /></>);

  if (view === 'characters') return (
    <>{nav}<CharacterLibrary
      userId={user!.id}
      onBack={goDashboard}
      onNew={goNewCharacter}
      onEdit={goEditCharacter}
      onUseInStory={char => goStoryBuilder(char)}
    /></>
  );

  if (view === 'character-builder') return (
    <>{nav}<CharacterBuilder
      userId={user!.id}
      initialCharacter={editingCharacter}
      onSaved={() => { setEditingCharacter(null); setView('characters'); }}
      onCancel={() => { setEditingCharacter(null); setView('characters'); }}
    /></>
  );

  if (view === 'story-library') return (
    <>{nav}<StoryLibrary
      userId={user!.id}
      onBack={goDashboard}
      onReadStory={() => setView('story-builder')}
      onCreateStory={() => goStoryBuilder()}
    /></>
  );

  if (view === 'nightcard-library') return (
    <>{nav}<NightCardLibrary userId={user!.id} onBack={goDashboard} /></>
  );

  if (view === 'story-builder') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: 'rgba(13,16,24,.97)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,151,42,.1)',
          display: 'flex', alignItems: 'center', gap: 14, padding: '0 6%', height: 64,
        }}>
          <button onClick={goDashboard} style={{
            background: 'transparent', border: 'none', color: 'rgba(244,239,232,.4)',
            fontSize: 13, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
            display: 'flex', alignItems: 'center', gap: 6, transition: 'color .15s', padding: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(244,239,232,.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,232,.4)')}>
            ← Back
          </button>
          <div style={{
            fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 700,
            color: '#F4EFE8', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle at 38% 38%,#F5C060,#C87020)', flexShrink: 0 }} />
            SleepSeed
          </div>
          {user?.isGuest && (
            <div style={{
              marginLeft: 'auto', background: 'rgba(232,151,42,.08)',
              border: '1px solid rgba(232,151,42,.2)', borderRadius: 50,
              padding: '7px 18px', fontSize: 12, color: 'rgba(232,151,42,.75)',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
              fontWeight: 500, transition: 'all .2s',
            }} onClick={goAuth}>
              Save your stories — create free account
            </div>
          )}
        </div>
        <SleepSeedCore
          userId={user?.id}
          isGuest={user?.isGuest}
          preloadedCharacter={selectedCharacters.length > 0 ? selectedCharacters[0] : selectedCharacter}
          ritualSeed={ritualSeed}
          ritualMood={ritualMood}
          builderChoices={builderChoices}
          onCharacterSavePrompt={() => {}}
          onStoryReady={() => {}}
        />
      </div>
    );
  }

  return null;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
