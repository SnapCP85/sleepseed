import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import CharacterBuilder from './features/characters/CharacterBuilder';
import CharacterLibrary from './features/characters/CharacterLibrary';
import StoryLibrary from './features/stories/StoryLibrary';
import NightCardLibrary from './features/nightcards/NightCardLibrary';
import SleepSeedCore from './SleepSeedCore';
import SharedStoryViewer from './pages/SharedStoryViewer';
import type { Character } from './lib/types';

const NAV_CSS = `
.pnav{display:flex;align-items:center;gap:0;padding:0 5%;height:52px;background:rgba(13,16,24,.98);border-bottom:1px solid rgba(232,151,42,.1);position:sticky;top:0;z-index:999;backdrop-filter:blur(16px);font-family:'Plus Jakarta Sans',system-ui,sans-serif;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.pnav::-webkit-scrollbar{display:none}
.pnav-logo{display:flex;align-items:center;gap:7px;cursor:pointer;flex-shrink:0;margin-right:8px;padding-right:14px;border-right:1px solid rgba(255,255,255,.07)}
.pnav-moon{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.pnav-brand{font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:700;color:#F4EFE8}
.pnav-links{display:flex;align-items:center;gap:2px;flex:1;min-width:0}
.pnav-link{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;color:rgba(244,239,232,.4);cursor:pointer;transition:all .15s;white-space:nowrap;border:none;background:transparent}
.pnav-link:hover{color:rgba(244,239,232,.75);background:rgba(255,255,255,.05)}
.pnav-link.on{color:rgba(232,151,42,.85);background:rgba(232,151,42,.08)}
.pnav-cta{padding:7px 16px;border-radius:50px;font-size:12px;font-weight:700;color:#1A1420;background:#E8972A;cursor:pointer;transition:all .15s;white-space:nowrap;border:none;flex-shrink:0;margin-left:auto}
.pnav-cta:hover{background:#F5B84C;transform:translateY(-1px)}
.pnav-user{font-size:10px;color:rgba(244,239,232,.25);cursor:pointer;padding:4px 10px;border-radius:6px;transition:color .15s;flex-shrink:0;border:none;background:transparent;white-space:nowrap;margin-left:6px}
.pnav-user:hover{color:rgba(244,239,232,.55)}
@media(max-width:600px){.pnav{padding:0 12px;height:48px}.pnav-link{padding:5px 9px;font-size:11px}.pnav-cta{padding:6px 13px;font-size:11px}.pnav-brand{display:none}}
`;

function ProfileNav({ view, onDashboard, onStories, onCharacters, onNightCards, onCreateStory, userName, onLogout }: {
  view: string;
  onDashboard: () => void;
  onStories: () => void;
  onCharacters: () => void;
  onNightCards: () => void;
  onCreateStory: () => void;
  userName: string;
  onLogout: () => void;
}) {
  return (
    <>
      <style>{NAV_CSS}</style>
      <nav className="pnav">
        <div className="pnav-logo" onClick={onDashboard}>
          <div className="pnav-moon" />
          <div className="pnav-brand">SleepSeed</div>
        </div>
        <div className="pnav-links">
          <button className={`pnav-link${view==='dashboard'?' on':''}`} onClick={onDashboard}>Home</button>
          <button className={`pnav-link${view==='story-library'?' on':''}`} onClick={onStories}>Stories</button>
          <button className={`pnav-link${view==='characters'||view==='character-builder'?' on':''}`} onClick={onCharacters}>Characters</button>
          <button className={`pnav-link${view==='nightcard-library'?' on':''}`} onClick={onNightCards}>Night Cards</button>
        </div>
        <button className="pnav-cta" onClick={onCreateStory}>✨ Make a Story</button>
        <button className="pnav-user" onClick={onLogout}>{userName || 'Account'}</button>
      </nav>
    </>
  );
}

function AppInner() {
  const {
    user, authLoading, view, setView, logout,
    selectedCharacter, setSelectedCharacter,
    editingCharacter, setEditingCharacter,
  } = useApp();

  const [isSharedStory, setIsSharedStory] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) setIsSharedStory(true);
  }, []);

  if (isSharedStory) return <SharedStoryViewer />;

  // Wait for auth to resolve before rendering anything
  if (authLoading) return (
    <div style={{minHeight:'100vh',background:'#0D1018',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:'radial-gradient(circle at 38% 38%,#F5C060,#C87020)',margin:'0 auto 12px'}} />
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:'#F4EFE8'}}>SleepSeed</div>
      </div>
    </div>
  );

  const [preloadedBook, setPreloadedBook] = useState<any>(null);

  const goAuth = () => setView('auth');
  const goDashboard = () => setView('dashboard');
  const goStoryBuilder = (char?: Character) => {
    if (char) setSelectedCharacter(char);
    setPreloadedBook(null);
    setView('story-builder');
  };
  const goCharacters = () => setView('characters');
  const goNewCharacter = () => { setEditingCharacter(null); setView('character-builder'); };
  const goEditCharacter = (c: Character) => { setEditingCharacter(c); setView('character-builder'); };
  const goNightCards = () => setView('nightcard-library');
  const goStoryLibrary = () => setView('story-library');

  if (view === 'public' && user && !user.isGuest) {
    setView('dashboard');
    return null;
  }

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

  // Guard: if any authenticated view but no user, go to auth
  if (!user && view !== 'public') {
    setView('auth');
    return null;
  }

  // All authenticated views get the profile nav
  const showNav = user && ['dashboard','characters','character-builder','story-library','nightcard-library','story-builder'].includes(view);

  const nav = showNav ? (
    <ProfileNav
      view={view}
      onDashboard={goDashboard}
      onStories={goStoryLibrary}
      onCharacters={goCharacters}
      onNightCards={goNightCards}
      onCreateStory={() => goStoryBuilder()}
      userName={user?.displayName || (user?.isGuest ? 'Guest' : '')}
      onLogout={() => { logout(); setView('public'); }}
    />
  ) : null;

  if (view === 'dashboard') return (
    <>{nav}<UserDashboard
      onCreateStory={() => goStoryBuilder()}
      onViewLibrary={goStoryLibrary}
      onViewNightCards={goNightCards}
      onViewCharacters={goCharacters}
      onNewCharacter={goNewCharacter}
      onSignUp={goAuth}
    /></>
  );

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
      onReadStory={(bookData: any) => { setPreloadedBook(bookData); setView('story-builder'); }}
      onCreateStory={() => goStoryBuilder()}
    /></>
  );

  if (view === 'nightcard-library') return (
    <>{nav}<NightCardLibrary userId={user!.id} onBack={goDashboard} /></>
  );

  if (view === 'story-builder') {
    return (
      <div style={{ position: 'relative' }}>
        {nav}
        <SleepSeedCore
          userId={user?.id}
          isGuest={user?.isGuest}
          preloadedCharacter={selectedCharacter}
          preloadedBook={preloadedBook}
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
