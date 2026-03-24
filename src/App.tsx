import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import OnboardingFlow from './pages/OnboardingFlow';
import ReadyStateDashboard from './pages/ReadyStateDashboard';
import ParentSetup from './pages/ParentSetup';
import type { ParentSetupResult } from './pages/ParentSetup';
import type { OnboardingResult, ChildProfile } from './pages/OnboardingFlow';
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
import LibraryHome from './pages/LibraryHome';
import LibraryStoryReader from './pages/LibraryStoryReader';
import CharacterDetail from './features/characters/CharacterDetail';
import Hatchery from './pages/Hatchery';
import FirstNight from './pages/FirstNight';
import { saveCharacter, saveNightCard, saveStory } from './lib/storage';
import { saveHatchedCreature, createEgg } from './lib/hatchery';
import type { Character, HatchedCreature, SavedNightCard } from './lib/types';

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

const TABS_CSS = `
.btabs{display:flex;align-items:flex-end;background:rgba(6,10,20,.97);border-top:1px solid rgba(245,184,76,.06);padding:6px 0 max(6px,env(safe-area-inset-bottom));position:fixed;bottom:0;left:0;right:0;z-index:20;backdrop-filter:blur(20px)}
.btab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:6px 0 2px;-webkit-tap-highlight-color:transparent;transition:all .2s}
.btab-ico{width:24px;height:24px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.btab-ico svg{transition:all .2s}
.btab:not(.on) .btab-ico svg{opacity:.35}
.btab.on .btab-ico svg{opacity:1;filter:drop-shadow(0 0 6px rgba(245,184,76,.4))}
.btab-lbl{font-size:10px;font-weight:700;letter-spacing:.03em;font-family:'Plus Jakarta Sans',system-ui,sans-serif;transition:color .2s}
.btab.on .btab-lbl{color:#F5B84C}
.btab:not(.on) .btab-lbl{color:rgba(255,255,255,.28)}
.btab:hover{transform:scale(1.08)}
.btab:hover:not(.on) .btab-ico svg{opacity:.6}
.btab:hover:not(.on) .btab-lbl{color:rgba(255,255,255,.5)}
.btab:active{transform:scale(.92)}
.btab-create{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent;margin-top:-22px}
.btab-create-btn{width:52px;height:52px;border-radius:50%;background:linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(200,130,20,.45),0 0 0 3px rgba(6,10,20,.97);transition:transform .18s,filter .15s}
.btab-create-btn svg{width:24px;height:24px}
.btab-create-btn:hover{transform:scale(1.08);filter:brightness(1.1)}
.btab-create-btn:active{transform:scale(.9)}
.btab-create-lbl{font-size:10px;font-weight:700;letter-spacing:.03em;color:#F5B84C;margin-top:1px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
`;

const DiscoverIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9"
      stroke={active ? '#F5B84C' : '#F4EFE8'} strokeWidth="1.8"
      fill={active ? 'rgba(245,184,76,.08)' : 'none'} />
    <path d="M14.5 9.5l-1.2 3.8-3.8 1.2 1.2-3.8 3.8-1.2Z"
      stroke={active ? '#F5B84C' : '#F4EFE8'} strokeWidth="1.5" strokeLinejoin="round"
      fill={active ? 'rgba(245,184,76,.25)' : 'none'} />
    <circle cx="12" cy="12" r="1.2" fill={active ? '#F5B84C' : '#F4EFE8'} />
  </svg>
);

const MyStuffIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4"
      stroke={active ? '#F5B84C' : '#F4EFE8'} strokeWidth="1.8"
      fill={active ? 'rgba(245,184,76,.15)' : 'none'} />
    <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"
      stroke={active ? '#F5B84C' : '#F4EFE8'} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 3.5l1.5 1L18 3"
      stroke={active ? '#F5B84C' : '#F4EFE8'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CreateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3l2.1 6.5H21l-5.6 4 2.2 6.5L12 16l-5.6 4 2.2-6.5L3 9.5h6.9L12 3Z"
      fill="#120800" stroke="#120800" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

function BottomTabs({ current, onNav }: { current: string; onNav: (v: string) => void }) {
  const isLib = current === 'library';
  const isMe = current === 'user-profile';
  return (
    <>
      <style>{TABS_CSS}</style>
      <div className="btabs">
        <div className={`btab${isLib?' on':''}`} onClick={()=>onNav('library')}>
          <div className="btab-ico"><DiscoverIcon active={isLib} /></div>
          <div className="btab-lbl">Discover</div>
        </div>
        <div className="btab-create" onClick={()=>onNav('story-configure')}>
          <div className="btab-create-btn"><CreateIcon /></div>
          <div className="btab-create-lbl">Create</div>
        </div>
        <div className={`btab${isMe?' on':''}`} onClick={()=>onNav('user-profile')}>
          <div className="btab-ico"><MyStuffIcon active={isMe} /></div>
          <div className="btab-lbl">My Stuff</div>
        </div>
      </div>
    </>
  );
}

function AppInner() {
  const {
    user, authLoading, view, setView, logout,
    selectedCharacter, setSelectedCharacter,
    selectedCharacters, setSelectedCharacters,
    ritualSeed, ritualMood, setRitualSeed,
    builderChoices,
    editingCharacter, setEditingCharacter,
    companionCreature, setCompanionCreature,
    libraryStorySlug, setLibraryStorySlug,
  } = useApp();

  const [preloadedBook,      setPreloadedBook]      = useState<any>(null);
  const [lastOnboardingResult, setLastOnboardingResult] = useState<OnboardingResult|null>(null);
  const [parentSetupData,   setParentSetupData]   = useState<ParentSetupResult|null>(() => {
    // Load from localStorage if available
    if (!user) return null;
    try {
      const stored = localStorage.getItem(`sleepseed_child_profile_${user.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [nightCardFilter,    setNightCardFilter]    = useState<string | undefined>(undefined);
  const [viewingCharacter,   setViewingCharacter]   = useState<Character | null>(null);

  // Check for shared story / library links on mount
  const [isSharedStory, setIsSharedStory] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) { setIsSharedStory(true); return; }

    const librarySlug = params.get('library');
    if (librarySlug) { setLibraryStorySlug(librarySlug); setView('library-story'); return; }

    if (params.get('view') === 'library') { setView('library'); return; }

    const ref = params.get('ref');
    if (ref) { try { sessionStorage.setItem('sleepseed_ref', ref); } catch {} }

    if (!sessionStorage.getItem('sleepseed_sid')) {
      const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { sessionStorage.setItem('sleepseed_sid', sid); } catch {}
    }
  }, []);

  // Test mode state (must be before any conditional returns)
  const [testMode] = useState(() => new URLSearchParams(window.location.search).get('test') === 'onboarding');
  const [testPhase, setTestPhase] = useState<'parent'|'child'|'done'>('parent');
  const [testChildProfile, setTestChildProfile] = useState<ParentSetupResult|null>(null);

  // Load companion creature for story builder
  useEffect(() => {
    if (!user || user.isGuest) return;
    import('./lib/hatchery').then(({ getAllHatchedCreatures }) => {
      getAllHatchedCreatures(user.id).then(creatures => {
        if (creatures.length > 0) setCompanionCreature(creatures[0]);
      });
    });
  }, [user]); // eslint-disable-line

  // ── All hooks above this line ─────────────────────────────────────────────

  if (isSharedStory) return <SharedStoryViewer />;

  // Show loading screen while auth is resolving — prevents flash of PublicHomepage
  if (authLoading) return (
    <div style={{minHeight:'100vh',background:'#080C18',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12,animation:'pulse 2s ease-in-out infinite'}}>🌙</div>
        <div style={{color:'rgba(244,239,232,.3)',fontSize:13,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>Loading...</div>
        <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}`}</style>
      </div>
    </div>
  );

  // Test mode: ?test=onboarding bypasses auth
  if (testMode) {
    if (testPhase === 'parent') return (
      <ParentSetup displayName="Greg" onComplete={(result) => { setTestChildProfile(result); setTestPhase('child'); }} />
    );
    if (testPhase === 'child') return (
      <OnboardingFlow childProfile={testChildProfile} onComplete={(result) => { console.log('[test] Onboarding complete:', result); setTestPhase('done'); }} />
    );
    return (
      <div style={{minHeight:'100vh',background:'#080C18',color:'#F4EFE8',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',gap:16,padding:24,textAlign:'center'}}>
        <div style={{fontSize:48}}>✅</div>
        <div style={{fontSize:24,fontWeight:700}}>Onboarding test complete!</div>
        <div style={{fontSize:14,color:'rgba(244,239,232,.5)'}}>Check console for the full result object.</div>
        <button onClick={() => { setTestPhase('parent'); setTestChildProfile(null); }} style={{marginTop:16,padding:'12px 28px',borderRadius:12,background:'#E8972A',color:'#1A1420',border:'none',fontSize:14,fontWeight:700,cursor:'pointer'}}>Run again</button>
        <button onClick={() => { window.location.href = window.location.pathname; }} style={{padding:'10px 24px',borderRadius:12,background:'rgba(255,255,255,.06)',color:'rgba(244,239,232,.5)',border:'1px solid rgba(255,255,255,.08)',fontSize:13,cursor:'pointer'}}>Exit test mode</button>
      </div>
    );
  }

  const goAuth        = () => setView('auth');
  const goDashboard   = () => { setNightCardFilter(undefined); setView('dashboard'); };
  const goStoryBuilder= (char?: Character) => {
    if (char) setSelectedCharacter(char);
    setPreloadedBook(null);
    setView('story-builder');
  };
  const goNewCharacter  = () => { setEditingCharacter(null); setView('onboarding'); };
  const goEditCharacter = (c: Character) => { setEditingCharacter(c); setView('character-builder'); };
  const goNightCards    = (filterId?: string) => { setNightCardFilter(filterId); setView('nightcard-library'); };
  const goStoryLibrary  = () => setView('story-library');
  const goCharacterDetail = (c: Character) => { setViewingCharacter(c); setView('character-detail' as any); };
  const handleNav = (v: string) => {
    if (v === 'nightcard-library') goNightCards();
    else setView(v as any);
  };

  // Handle onboarding completion — save character, creature, egg, night card
  const handleOnboardingComplete = async (result: OnboardingResult) => {
    if (!user) return;

    // Each save is independent — don't let one failure block others
    try { await saveCharacter(result.character); }
    catch (e) { console.error('[onboarding] saveCharacter failed:', e); }

    try { await saveHatchedCreature(result.creature); }
    catch (e) { console.error('[onboarding] saveHatchedCreature failed:', e); }

    try { await createEgg(user.id, result.character.id, result.creature.creatureType, 2); }
    catch (e) { console.error('[onboarding] createEgg failed:', e); }

    try {
      const fs = result.firstStory;
      const nightCard: SavedNightCard = {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        userId: user.id,
        heroName: result.character.name,
        storyTitle: fs?.title || 'Night 1',
        characterIds: [result.character.id],
        headline: fs?.headline || `The night ${result.creature.name} arrived.`,
        quote: fs?.quote || result.dreamAnswer,
        memory_line: fs?.memoryLine || `${result.character.name} said it so quietly — like they already knew.`,
        emoji: result.creature.creatureEmoji,
        date: new Date().toISOString(),
        isOrigin: true,
        photo: result.photoDataUrl,
      };
      await saveNightCard(nightCard);
    } catch (e) { console.error('[onboarding] saveNightCard failed:', e); }

    // Save first story to library
    if (result.firstStory) {
      try {
        await saveStory({
          id: crypto.randomUUID?.() || `story_${Date.now()}`,
          userId: user.id,
          title: result.firstStory.title,
          heroName: result.character.name,
          characterIds: [result.character.id],
          date: new Date().toISOString(),
          bookData: {
            title: result.firstStory.title,
            pages: result.firstStory.text.split('\n\n').filter(Boolean).map(p => ({ text: p })),
            creatureName: result.creature.name,
            creatureEmoji: result.creature.creatureEmoji,
          },
        });
      } catch (e) { console.error('[onboarding] saveStory failed:', e); }
    }

    // Always finish — set creature, flag, navigate to first-night choice
    setCompanionCreature(result.creature);
    setLastOnboardingResult(result);
    try { localStorage.setItem(`sleepseed_onboarding_${user.id}`, '1'); } catch {}
    setView('first-night');
  };

  // Read a saved story directly — sets preloadedBook then routes to story-builder
  const openSavedStory = (bookData: any) => {
    setPreloadedBook(bookData);
    setView('story-builder');
  };

  // User-scoped flags
  const onboardingDone = typeof localStorage !== 'undefined' && user
    ? !!localStorage.getItem(`sleepseed_onboarding_${user.id}`)
    : false;
  const parentSetupDone = typeof localStorage !== 'undefined' && user
    ? !!localStorage.getItem(`sleepseed_parent_setup_${user.id}`)
    : false;

  // Handle parent setup completion
  const handleParentSetup = (result: ParentSetupResult) => {
    if (!user) return;
    setParentSetupData(result);
    // Store in localStorage so kid onboarding can read it
    try {
      localStorage.setItem(`sleepseed_parent_setup_${user.id}`, '1');
      localStorage.setItem(`sleepseed_child_profile_${user.id}`, JSON.stringify(result));
    } catch {}
    setView('dashboard');
  };

  // Library views — accessible to everyone (no auth required)
  if (view === 'library') return (
    <div style={{paddingBottom: user && !user.isGuest ? 70 : 0}}>
      <LibraryHome />
      {user && !user.isGuest && <BottomTabs current="library" onNav={v => setView(v as any)} />}
    </div>
  );
  if (view === 'library-story') return (
    <div style={{paddingBottom: user && !user.isGuest ? 70 : 0}}>
      <LibraryStoryReader slug={libraryStorySlug ?? ''} />
      {user && !user.isGuest && <BottomTabs current="library" onNav={v => setView(v as any)} />}
    </div>
  );

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

  // Legacy onboarding routes — redirect to dashboard
  if (view === 'onboarding-welcome') { setView('dashboard'); return null; }
  if (view === 'onboarding-tour')    { setView('dashboard'); return null; }
  if (view === 'onboarding-night0')  { setView('dashboard'); return null; }

  // Parent setup — clean adult onboarding (3 screens)
  if (view === 'parent-setup') return (
    <ParentSetup displayName={user?.displayName||''} onComplete={handleParentSetup} />
  );

  // Kid onboarding — magical experience with child present
  if (view === 'onboarding') {
    // Load child profile from localStorage if not in state
    let profile = parentSetupData;
    if (!profile && user) {
      try {
        const stored = localStorage.getItem(`sleepseed_child_profile_${user.id}`);
        if (stored) profile = JSON.parse(stored);
      } catch {}
    }
    return <OnboardingFlow onComplete={handleOnboardingComplete} childProfile={profile} />;
  }

  if (view === 'dashboard') {
    // New user: parent setup not done → send to parent setup
    if (user && !user.isGuest && !parentSetupDone && !onboardingDone) {
      return <ParentSetup displayName={user.displayName||''} onComplete={handleParentSetup} />;
    }
    // Parent setup done but kid onboarding not done → show dashboard with egg/begin button
    // (the existing dashboard handles this state — shows egg + "Begin your first night")
    return (
      <div style={{paddingBottom:70}}>
        <UserDashboard onSignUp={goAuth} onReadStory={openSavedStory} />
        <BottomTabs current="dashboard" onNav={v=>setView(v as any)} />
      </div>
    );
  }

  if (view === 'first-night' && lastOnboardingResult) return (
    <FirstNight
      creature={lastOnboardingResult.creature}
      character={lastOnboardingResult.character}
      onStory={() => {
        setSelectedCharacters([lastOnboardingResult.character]);
        setSelectedCharacter(lastOnboardingResult.character);
        setRitualSeed('');
        // Skip the ritual intro tutorial — they just completed onboarding
        try { localStorage.setItem('rs_intro_seen_v1', '1'); } catch {}
        setView('ritual-starter');
      }}
      onSleep={() => {
        setView('dashboard');
      }}
    />
  );
  if (view === 'first-night') { setView('dashboard'); return null; }

  if (view === 'hatchery') return (
    <div style={{paddingBottom:70}}>
      <Hatchery user={user!} onBack={goDashboard} />
      <BottomTabs current="" onNav={v=>setView(v as any)} />
    </div>
  );
  if (view === 'ritual-starter') return <RitualStarter />;
  if (view === 'story-handoff')  return <StoryHandoff />;
  if (view === 'story-configure') return <StoryBuilderPage />;
  if (view === 'user-profile') return (
    <div style={{paddingBottom:70}}>
      <UserProfile />
      <BottomTabs current="user-profile" onNav={v=>setView(v as any)} />
    </div>
  );

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
    <div style={{paddingBottom:70}}>
    <StoryLibrary
      userId={user!.id}
      onBack={goDashboard}
      onReadStory={openSavedStory}
      onCreateStory={() => setView('ritual-starter')}
    />
    <BottomTabs current="user-profile" onNav={v=>setView(v as any)} />
    </div>
  );

  if (view === 'nightcard-library') return (
    <div style={{paddingBottom:70}}>
    <NightCardLibrary
      userId={user!.id}
      onBack={goDashboard}
      filterCharacterId={nightCardFilter}
    />
    <BottomTabs current="user-profile" onNav={v=>setView(v as any)} />
    </div>
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
          companionCreature={companionCreature}
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
