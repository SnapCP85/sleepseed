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

  if (view === 'dashboard') return (
    <UserDashboard
      onSignUp={goAuth}
    />
  );

  if (view === 'ritual-starter') return <RitualStarter />;

  if (view === 'story-handoff') return <StoryHandoff />;

  if (view === 'story-configure') return <StoryBuilderPage />;

  if (view === 'user-profile') return <UserProfile />;

  if (view === 'characters') return (
    <CharacterLibrary
      userId={user!.id}
      onBack={goDashboard}
      onNew={goNewCharacter}
      onEdit={goEditCharacter}
      onUseInStory={char => goStoryBuilder(char)}
    />
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
    <StoryLibrary
      userId={user!.id}
      onBack={goDashboard}
      onReadStory={() => setView('story-builder')}
      onCreateStory={() => goStoryBuilder()}
    />
  );

  if (view === 'nightcard-library') return (
    <NightCardLibrary userId={user!.id} onBack={goDashboard} />
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
