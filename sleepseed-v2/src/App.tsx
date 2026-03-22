import { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import CharacterBuilder from './features/characters/CharacterBuilder';
import CharacterLibrary from './features/characters/CharacterLibrary';
import StoryLibrary from './features/stories/StoryLibrary';
import NightCardLibrary from './features/nightcards/NightCardLibrary';
import SleepSeedCore from './SleepSeedCore';
import type { Character } from './lib/types';

function AppInner() {
  const {
    user, view, setView, logout,
    selectedCharacter, setSelectedCharacter,
    editingCharacter, setEditingCharacter,
  } = useApp();

  // Sub-navigation state for character library
  const [charLibView, setCharLibView] = useState<'library' | 'builder'>('library');

  const goAuth = () => setView('auth');
  const goDashboard = () => setView('dashboard');
  const goStoryBuilder = (char?: Character) => {
    if (char) setSelectedCharacter(char);
    setView('story-builder');
  };
  const goCharacters = () => setView('characters');
  const goNewCharacter = () => {
    setEditingCharacter(null);
    setView('character-builder');
  };
  const goEditCharacter = (c: Character) => {
    setEditingCharacter(c);
    setView('character-builder');
  };
  const goNightCards = () => setView('nightcard-library');
  const goStoryLibrary = () => setView('story-library');

  // ── Public homepage ────────────────────────────────────────────────────────
  if (view === 'public') {
    return (
      <PublicHomepage
        onCreateStory={() => user ? goStoryBuilder() : goAuth()}
        onSignIn={() => setView('auth')}
        onSignUp={() => setView('auth')}
        onNightCards={() => user ? goNightCards() : goAuth()}
        onLibrary={() => user ? goStoryLibrary() : goAuth()}
      />
    );
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (view === 'auth') {
    return <Auth />;
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <UserDashboard
        onCreateStory={() => goStoryBuilder()}
        onViewLibrary={goStoryLibrary}
        onViewNightCards={goNightCards}
        onViewCharacters={goCharacters}
        onNewCharacter={goNewCharacter}
        onSignUp={goAuth}
      />
    );
  }

  // ── Character Library ──────────────────────────────────────────────────────
  if (view === 'characters') {
    return (
      <CharacterLibrary
        userId={user!.id}
        onBack={goDashboard}
        onNew={goNewCharacter}
        onEdit={goEditCharacter}
        onUseInStory={char => goStoryBuilder(char)}
      />
    );
  }

  // ── Character Builder ──────────────────────────────────────────────────────
  if (view === 'character-builder') {
    return (
      <CharacterBuilder
        userId={user!.id}
        initialCharacter={editingCharacter}
        onSaved={() => {
          setEditingCharacter(null);
          // Return to wherever they came from
          setView('characters');
        }}
        onCancel={() => {
          setEditingCharacter(null);
          setView('characters');
        }}
      />
    );
  }

  // ── Story Library ──────────────────────────────────────────────────────────
  if (view === 'story-library') {
    return (
      <StoryLibrary
        userId={user!.id}
        onBack={goDashboard}
        onReadStory={(bookData) => {
          // Pass bookData back through to SleepSeedCore via a bridge
          // For now, navigate to story builder with the book pre-loaded
          setView('story-builder');
        }}
        onCreateStory={() => goStoryBuilder()}
      />
    );
  }

  // ── Night Card Library ─────────────────────────────────────────────────────
  if (view === 'nightcard-library') {
    return (
      <NightCardLibrary
        userId={user!.id}
        onBack={goDashboard}
      />
    );
  }

  // ── Story Builder (existing SleepSeed core) ────────────────────────────────
  if (view === 'story-builder') {
    return (
      <div style={{ position: 'relative' }}>
        {/* Minimal top nav for context */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: 'rgba(6,11,24,.97)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        }}>
          <button
            onClick={goDashboard}
            style={{
              background: 'transparent', border: 'none', color: 'rgba(240,237,232,.4)',
              fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              display: 'flex', alignItems: 'center', gap: 5, transition: 'color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,237,232,.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,237,232,.4)')}
          >
            ← Back to dashboard
          </button>
          <div style={{
            fontFamily: "'Lora',serif", fontSize: 15, fontWeight: 700,
            color: '#F0EDE8', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            🌙 SleepSeed
          </div>
          {user?.isGuest && (
            <div style={{
              marginLeft: 'auto', background: 'rgba(251,191,36,.08)',
              border: '1px solid rgba(251,191,36,.2)', borderRadius: 50,
              padding: '5px 14px', fontSize: 11, color: 'rgba(251,191,36,.8)',
              cursor: 'pointer',
            }} onClick={goAuth}>
              Save your stories — create account
            </div>
          )}
        </div>
        {/* The existing SleepSeed app, completely untouched */}
        <SleepSeedCore
          userId={user?.id}
          isGuest={user?.isGuest}
          preloadedCharacter={selectedCharacter}
          onCharacterSavePrompt={(charData) => {
            // Handled internally in SleepSeedCore for now
          }}
          onStoryReady={(storyData) => {
            // Story is saved via the existing save logic in SleepSeedCore
          }}
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
