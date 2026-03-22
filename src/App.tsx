import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import OnboardingWelcome from './pages/OnboardingWelcome';
import OnboardingTour from './pages/OnboardingTour';
import OnboardingNightCard from './pages/OnboardingNightCard';
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
import CharacterDetail from './features/characters/CharacterDetail';
import type { Character } from './lib/types';

const NAV_CSS = `
.anav{display:flex;align-items:center;gap:0;padding:0 5%;height:50px;border-bottom:1px solid rgba(232,151,42,.12);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px);font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.anav-logo{font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:7px;cursor:pointer;flex-shrink:0;margin-right:12px;padding-right:14px;border-right:1px solid rgba(255,255,255,.08)}
.anav-moon{width:14px;height:14px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;flex-shrink:0}
.anav-moon-sh{position:absolute;width:13px;height:13px;border-radius:50%;background:#050916;top:-3px;left:-6px}
.anav-tabs{display:flex;align-items:center;gap:3px;flex:1;min-width:0}
.anav-tab{padding:7px 14px;border-radius:9px;font-size:12px;font-weight:600;color:rgba(244,239,232,.35);cursor:pointer;transition:all .15s;white-space:nowrap;border:1px solid transparent;background:transparent}
.anav-tab:hover{color:rgba(244,239,232,.7);background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08)}
.anav-tab.on{color:#E8972A;background:rgba(232,151,42,.1);border-color:rgba(232,151,42,.25)}
@media(max-width:480px){.anav{padding:0 3%}.anav-tab{padding:5px 9px;font-size:10px}}
`;

function AppNav({ currentView, onNav }: { currentView: string; onNav: (v: string) => void }) {
  return (
    <>
      <style>{NAV_CSS}</style>
      <nav className="anav">
        <div className="anav-logo" onClick={() => onNav('dashboard')}>
          <div className="anav-moon"><div className="anav-moon-sh" /></div>
          SleepSeed
        </div>
        <div className="anav-tabs">
          {[
            { key: 'dashboard', label: '🏠 Home' },
            { key: 'story-library', label: '📖 Stories' },
            { key: 'nightcard-library', label: '🌙 Night Cards' },
            { key: 'characters', label: '👤 Characters' },
          ].map(t => (
            <div key={t.key} className={`anav-tab${currentView === t.key ? ' on' : ''}`}
              onClick={() => onNav(t.key)}>{t.label}</div>
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

  const [preloadedBook,      setPreloadedBook]      = useState<any>(null);
  const [nightCardFilter,    setNightCardFilter]    = useState<string | undefined>(undefined);
  const [viewingCharacter,   setViewingCharacter]   = useState<Character | null>(null);

  // Check for shared story link on mount
  const [isSharedStory, setIsSharedStory] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) setIsSharedStory(true);
  }, []);

  if (isSharedStory) return <SharedStoryViewer />;

  const goAuth        = () => setView('auth');
  const goDashboard   = () => { setNightCardFilter(undefined); setView('dashboard'); };
  const goStoryBuilder= (char?: Character) => {
    if (char) setSelectedCharacter(char);
    setPreloadedBook(null);
    setView('story-builder');
  };
  const goNewCharacter  = () => { setEditingCharacter(null); setView('character-builder'); };
  const goEditCharacter = (c: Character) => { setEditingCharacter(c); setView('character-builder'); };
  const goNightCards    = (filterId?: string) => { setNightCardFilter(filterId); setView('nightcard-library'); };
  const goStoryLibrary  = () => setView('story-library');
  const goCharacterDetail = (c: Character) => { setViewingCharacter(c); setView('character-detail' as any); };
  const handleNav = (v: string) => {
    if (v === 'nightcard-library') goNightCards();
    else setView(v as any);
  };

  // Read a saved story directly — sets preloadedBook then routes to story-builder
  const openSavedStory = (bookData: any) => {
    setPreloadedBook(bookData);
    setView('story-builder');
  };

  // User-scoped onboarding flag
  const onboardingDone = typeof localStorage !== 'undefined' && user
    ? !!localStorage.getItem(`sleepseed_onboarding_${user.id}`)
    : false;

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

  // Onboarding views — persist across tab switches
  const isOnboardingView = ['onboarding-welcome','onboarding-tour','onboarding-night0'].includes(view);
  if (isOnboardingView && user) {
    try { localStorage.setItem(`ss_onboarding_step_${user.id}`, view); } catch {}
  }
  if (view === 'onboarding-welcome') return <OnboardingWelcome />;
  if (view === 'onboarding-tour')    return <OnboardingTour />;
  if (view === 'onboarding-night0')  return <OnboardingNightCard />;

  if (view === 'dashboard') {
    // Skip walkthrough — dashboard has "Take a quick tour" for new users
    return <UserDashboard onSignUp={goAuth} onReadStory={openSavedStory} />;
  }

  if (view === 'ritual-starter') return <RitualStarter />;
  if (view === 'story-handoff')  return <StoryHandoff />;
  if (view === 'story-configure') return <StoryBuilderPage />;
  if (view === 'user-profile')   return <UserProfile />;

  if (view === 'characters') return (
    <><AppNav currentView="characters" onNav={handleNav} />
    <CharacterLibrary
      userId={user!.id}
      onBack={goDashboard}
      onNew={goNewCharacter}
      onEdit={goEditCharacter}
      onUseInStory={char => goCharacterDetail(char)}
      onReadStory={openSavedStory}
      onViewNightCards={charId => goNightCards(charId)}
    /></>
  );

  if (view === 'character-builder') return (
    <CharacterBuilder
      userId={user!.id}
      initialCharacter={editingCharacter}
      onSaved={() => { setEditingCharacter(null); setView('characters'); }}
      onCancel={() => { setEditingCharacter(null); setView('characters'); }}
    />
  );

  if (view === 'story-library') return (
    <><AppNav currentView="story-library" onNav={handleNav} />
    <StoryLibrary
      userId={user!.id}
      onBack={goDashboard}
      onReadStory={openSavedStory}
      onCreateStory={() => setView('ritual-starter')}
    /></>
  );

  if (view === 'nightcard-library') return (
    <><AppNav currentView="nightcard-library" onNav={handleNav} />
    <NightCardLibrary
      userId={user!.id}
      onBack={goDashboard}
      filterCharacterId={nightCardFilter}
    /></>
  );

  if ((view as string) === 'character-detail' && viewingCharacter) return (
    <><AppNav currentView="characters" onNav={handleNav} />
    <CharacterDetail
      character={viewingCharacter}
      userId={user!.id}
      onBack={() => setView('characters')}
      onEdit={goEditCharacter}
      onUseInStory={char => goStoryBuilder(char)}
      onReadStory={openSavedStory}
    /></>
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
          preloadedBook={preloadedBook}
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
