import { useState, useEffect, lazy, Suspense } from 'react';
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
import StoryCreator from './pages/StoryCreator';
import CharacterBuilder from './features/characters/CharacterBuilder';
import CharacterLibrary from './features/characters/CharacterLibrary';
import StoryLibrary from './features/stories/StoryLibrary';
import NightCardLibrary from './features/nightcards/NightCardLibrary';
import SharedStoryViewer from './pages/SharedStoryViewer';
import SharedNightCard from './pages/SharedNightCard';
import PrintNightCard from './pages/PrintNightCard';
import LibraryHome from './pages/LibraryHome';
import CharacterDetail from './features/characters/CharacterDetail';
import Hatchery from './pages/Hatchery';
import FirstNight from './pages/FirstNight';
import DevStoryTest from './pages/DevStoryTest';
import AdminUploadBook from './pages/AdminUploadBook';
import JourneyLibrary from './pages/JourneyLibrary';
import CompletedBookReader from './pages/CompletedBookReader';
import { JourneySetup, NightlyCheckIn, ChapterHandoff, BookComplete, MemoryReel, SeriesCreator } from './components/journey';
import { chapterToBookData } from './components/journey/ChapterHandoff';

// Lazy-loaded heavy components — not needed on initial render
const SleepSeedCore = lazy(() => import('./SleepSeedCore'));
const LibraryStoryReader = lazy(() => import('./pages/LibraryStoryReader'));
import { saveCharacter, saveNightCard, saveStory, addFriendByCode } from './lib/storage';
import { saveHatchedCreature, createEgg, getAllHatchedCreatures } from './lib/hatchery';
import type { Character, HatchedCreature, SavedNightCard } from './lib/types';

const NAV_CSS = `
.bn5{position:fixed;bottom:0;left:0;right:0;height:76px;background:rgba(7,12,36,.95);border-top:.5px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-around;z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px)}
.bn5-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent}
.bn5-ico{width:46px;height:38px;border-radius:14px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.bn5-tab.on .bn5-ico{background:rgba(245,184,76,.13)}
.bn5-ico:active{transform:scale(.84)}
.bn5-tab svg{color:rgba(234,242,255,.28);transition:color .2s}
.bn5-tab.on svg{color:#F5B84C}
.bn5-tab.on .bn5-lbl{color:#F5B84C}
.bn5-bar{position:absolute;top:-12px;left:50%;transform:translateX(-50%);width:24px;height:3px;border-radius:0 0 4px 4px;background:#F5B84C;opacity:0;transition:opacity .2s}
.bn5-tab.on .bn5-bar{opacity:1}
.bn5-lbl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1px;color:rgba(234,242,255,.28);transition:color .2s;white-space:nowrap;line-height:1}
`;

function BottomNav({ current, onNav }: { current: string; onNav: (v: string) => void }) {
  const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Today', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>
    )},
    { id: 'story-wizard', label: 'Create', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
    )},
    { id: 'library', label: 'Discover', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    )},
    { id: 'story-library', label: 'My Space', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    )},
    { id: 'user-profile', label: 'Profile', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )},
  ];
  return (
    <>
      <style>{NAV_CSS}</style>
      <div className="bn5">
        {tabs.map(t => (
          <div key={t.id} className={`bn5-tab${current === t.id ? ' on' : ''}`} onClick={() => onNav(t.id)}>
            <div className="bn5-bar" />
            <div className="bn5-ico">{t.icon}</div>
            <div className="bn5-lbl">{t.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function AppInner() {
  // Shared night card — public, no auth required
  if (new URLSearchParams(window.location.search).get('nc')) return <SharedNightCard />;
  // Print night card
  if (new URLSearchParams(window.location.search).get('printCard')) return <PrintNightCard />;
  // DEV: instant route — no flash, no auth
  if (new URLSearchParams(window.location.search).get('view') === 'dev-story') return <DevStoryTest />;

  const {
    user, authLoading, view, setView, logout,
    selectedCharacter, setSelectedCharacter,
    selectedCharacters, setSelectedCharacters,
    ritualSeed, ritualMood, setRitualSeed,
    editingCharacter, setEditingCharacter,
    companionCreature, setCompanionCreature,
    libraryStorySlug, setLibraryStorySlug,
    activeChapterOutput, setActiveChapterOutput, activeJourneyId,
    activeCompletedBookId, setActiveCompletedBookId,
  } = useApp();

  const [preloadedBook,      setPreloadedBook]      = useState<any>(null);
  const [dashKey,            setDashKey]            = useState(0);
  const [wizardChoices,      setWizardChoices]      = useState<import('./lib/types').BuilderChoices|null>(null);
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
    if (params.get('view') === 'dev-story') { setView('dev-story'); return; }

    const ref = params.get('ref');
    if (ref) { try { sessionStorage.setItem('sleepseed_ref', ref); } catch {} }

    const friendCode = params.get('friend');
    if (friendCode) {
      try {
        sessionStorage.setItem('sleepseed_pending_friend', friendCode);
        // Friend link doubles as referral — give credit for sign-ups
        sessionStorage.setItem('sleepseed_ref', friendCode);
      } catch {}
    }

    if (!sessionStorage.getItem('sleepseed_sid')) {
      const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { sessionStorage.setItem('sleepseed_sid', sid); } catch {}
    }
  }, []);

  // Test mode state (must be before any conditional returns)
  const [testMode] = useState(() => new URLSearchParams(window.location.search).get('test') === 'onboarding' ? 'onboarding' : null);
  const [testPhase, setTestPhase] = useState<'parent'|'child'|'done'>('parent');
  const [testChildProfile, setTestChildProfile] = useState<ParentSetupResult|null>(null);

  // Load companion creature for story builder
  useEffect(() => {
    if (!user || user.isGuest) return;
    getAllHatchedCreatures(user.id).then(creatures => {
      if (creatures.length > 0) setCompanionCreature(creatures[0]);
    });
  }, [user]); // eslint-disable-line

  // Process pending friend invite after auth
  const [friendAdded, setFriendAdded] = useState<string|null>(null);
  useEffect(() => {
    if (!user || user.isGuest) return;
    const code = sessionStorage.getItem('sleepseed_pending_friend');
    if (!code) return;
    sessionStorage.removeItem('sleepseed_pending_friend');
    // Clean the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('friend');
    window.history.replaceState({}, '', url.toString());
    addFriendByCode(user.id, code).then(({ friendName }) => {
      setFriendAdded(friendName);
      setTimeout(() => setFriendAdded(null), 4000);
    }).catch(e => console.warn('[friends] add failed:', e));
  }, [user]); // eslint-disable-line

  // Clear stale story state whenever entering a fresh creation flow
  useEffect(() => {
    if (view === 'story-wizard' || view === 'ritual-starter') {
      setPreloadedBook(null);
      setWizardChoices(null);
      setActiveChapterOutput(null);
    }
  }, [view]);

  // ── All hooks above this line ─────────────────────────────────────────────

  if (isSharedStory) return <SharedStoryViewer />;
  if (view === 'dev-story') return <DevStoryTest />;
  if (new URLSearchParams(window.location.search).get('view') === 'admin-upload') return <AdminUploadBook />;

  // Test mode pages — render before auth so shareable links work without login
  if (testMode === 'onboarding') {
    if (testPhase === 'parent') return (
      <ParentSetup onComplete={(result) => { setTestChildProfile(result); setTestPhase('child'); }} onSkip={() => setTestPhase('done')} onSaveLater={(result) => { setTestChildProfile(result); setTestPhase('done'); }} />
    );
    if (testPhase === 'child') return (
      <OnboardingFlow childProfile={testChildProfile} onComplete={(result) => { console.log('[test] Onboarding complete:', result); setTestPhase('done'); }} />
    );
    return (
      <div style={{minHeight:'100vh',background:'#060912',color:'#F4EFE8',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',gap:16,padding:24,textAlign:'center'}}>
        <div style={{fontSize:48}}>✅</div>
        <div style={{fontSize:24,fontWeight:700}}>Onboarding test complete!</div>
        <div style={{fontSize:14,color:'rgba(244,239,232,.5)'}}>Check console for the full result object.</div>
        <button onClick={() => { setTestPhase('parent'); setTestChildProfile(null); }} style={{marginTop:16,padding:'12px 28px',borderRadius:12,background:'#E8972A',color:'#1A1420',border:'none',fontSize:14,fontWeight:700,cursor:'pointer'}}>Run again</button>
        <button onClick={() => { window.location.href = window.location.pathname; }} style={{padding:'10px 24px',borderRadius:12,background:'rgba(255,255,255,.06)',color:'rgba(244,239,232,.5)',border:'1px solid rgba(255,255,255,.08)',fontSize:13,cursor:'pointer'}}>Exit test mode</button>
      </div>
    );
  }

  // Show loading screen while auth is resolving — prevents flash of PublicHomepage
  if (authLoading) return (
    <div style={{minHeight:'100vh',background:'#060912',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',alignItems:'center',gap:9,animation:'ssLoadIn .6s ease-out'}}>
        <div style={{width:20,height:20,borderRadius:'50%',background:'#F5B84C',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',width:19,height:19,borderRadius:'50%',background:'#060912',top:-4,left:-7}}/>
        </div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700,color:'#F4EFE8',letterSpacing:'-.02em'}}>SleepSeed</div>
      </div>
      <style>{`@keyframes ssLoadIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );

  const goAuth        = () => setView('auth');
  // Clean library URL params when leaving library views
  const clearLibraryUrl = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('library') || url.searchParams.get('view') === 'library') {
      url.searchParams.delete('library');
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    }
  };
  const goDashboard   = () => { clearLibraryUrl(); setNightCardFilter(undefined); setPreloadedBook(null); setDashKey(k => k + 1); setView('dashboard'); };
  const goStoryBuilder= (char?: Character) => {
    if (char) setSelectedCharacter(char);
    setPreloadedBook(null);
    setWizardChoices(null);
    setView('story-wizard');
  };
  const goNewCharacter  = () => { setEditingCharacter(null); setView('onboarding'); };
  const goEditCharacter = (c: Character) => { setEditingCharacter(c); setView('character-builder'); };
  const goNightCards    = (filterId?: string) => { setNightCardFilter(filterId); setView('nightcard-library'); };
  const goStoryLibrary  = () => setView('story-library');
  const goCharacterDetail = (c: Character) => { setViewingCharacter(c); setView('character-detail' as any); };
  const handleNav = (v: string) => {
    clearLibraryUrl();
    if (v === 'nightcard-library') goNightCards();
    else if (v === 'story-wizard') goStoryBuilder();
    else if (v === 'library') {
      const url = new URL(window.location.href);
      url.search = '?view=library';
      window.history.pushState({}, '', url.pathname + url.search);
      setView('library');
    }
    else setView(v as any);
  };

  // Handle onboarding completion — save character, creature, egg, night card, story
  // Tracks completed steps so partial failures can be diagnosed
  const handleOnboardingComplete = async (result: OnboardingResult) => {
    console.log('[onboarding] handleOnboardingComplete called, user:', user?.id || 'NO USER');
    if (!user) {
      console.error('[onboarding] ABORTED — no user session. Night card and story will NOT be saved.');
      // Still navigate so user isn't stuck — data is in the OnboardingResult for retry
      setLastOnboardingResult(result);
      setView('first-night');
      return;
    }

    const storyId = crypto.randomUUID?.() || `story_${Date.now()}`;
    const errors: string[] = [];

    // Step 1: Character
    try { await saveCharacter(result.character); }
    catch (e) { console.error('[onboarding] saveCharacter failed:', e); errors.push('character'); }

    // Step 2: Hatched creature
    try { await saveHatchedCreature(result.creature); }
    catch (e) { console.error('[onboarding] saveHatchedCreature failed:', e); errors.push('creature'); }

    // Step 3: Egg (only if character saved)
    if (!errors.includes('character')) {
      try { await createEgg(user.id, result.character.id, result.creature.creatureType, 1); }
      catch (e) { console.error('[onboarding] createEgg failed:', e); errors.push('egg'); }
    }

    // Step 4: Night card
    try {
      const fs = result.firstStory;
      const nc = result.nightCard;
      const nightCard: SavedNightCard = {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        userId: user.id,
        storyId,
        heroName: result.character.name,
        storyTitle: fs?.title || 'Night 1',
        characterIds: [result.character.id],
        headline: nc?.headline || fs?.headline || `The night ${result.creature.name} arrived.`,
        quote: nc?.quote || fs?.quote || result.dreamAnswer,
        memory_line: nc?.memory_line || fs?.memoryLine || `${result.character.name} said it so quietly \u2014 like they already knew.`,
        whisper: nc?.whisper,
        emoji: nc?.emoji || result.creature.creatureEmoji,
        date: new Date().toISOString().split('T')[0],
        isOrigin: true,
        photo: nc?.photo || result.photoDataUrl,
        nightNumber: 1,
        streakCount: 1,
        creatureEmoji: result.creature.creatureEmoji,
        creatureColor: result.creature.color,
      };
      console.log('[onboarding] Saving night card:', nightCard.id, nightCard.headline);
      await saveNightCard(nightCard);
      console.log('[onboarding] Night card saved successfully');
    } catch (e) { console.error('[onboarding] saveNightCard failed:', e); errors.push('nightCard'); }

    // Step 5: Story
    if (result.firstStory) {
      try {
        await saveStory({
          id: storyId,
          userId: user.id,
          title: result.firstStory.title,
          heroName: result.character.name,
          characterIds: [result.character.id],
          date: new Date().toISOString(),
          bookData: {
            title: result.firstStory.title,
            pages: result.firstStory.pages || result.firstStory.text.split('\n\n').filter(Boolean).map(p => ({ text: p })),
            creatureName: result.creature.name,
            creatureEmoji: result.creature.creatureEmoji,
          },
        });
      } catch (e) { console.error('[onboarding] saveStory failed:', e); errors.push('story'); }
    }

    if (errors.length > 0) {
      console.error(`[onboarding] Completed with ${errors.length} failed steps:`, errors);
    } else {
      console.log('[onboarding] All 5 saves completed successfully');
    }

    // Always finish — even with partial failures, let the user proceed
    // The data they have is better than being stuck on the onboarding screen
    setCompanionCreature(result.creature);
    setLastOnboardingResult(result);
    try { localStorage.setItem(`sleepseed_onboarding_${user.id}`, '1'); } catch {}
    setView('first-night');
  };

  // Read a saved story directly — sets preloadedBook then routes to story-builder
  const openSavedStory = (bookData: any) => {
    console.log('[stories] Opening saved story:', bookData?.title, 'pages:', bookData?.pages?.length);
    if (!bookData) {
      console.error('[stories] bookData is null/undefined — cannot open story');
      return;
    }
    setPreloadedBook(bookData);
    setWizardChoices(null);           // prevent SleepSeedCore from generating
    setActiveChapterOutput(null);     // prevent chapter conversion override
    setView('story-builder');
  };

  // User-scoped flags
  const onboardingDone = typeof localStorage !== 'undefined' && user
    ? !!localStorage.getItem(`sleepseed_onboarding_${user.id}`)
    : false;
  const parentSetupDone = typeof localStorage !== 'undefined' && user
    ? !!localStorage.getItem(`sleepseed_parent_setup_${user.id}`)
    : false;

  // Handle parent setup completion — go straight to child onboarding
  const handleParentSetup = (result: ParentSetupResult) => {
    if (!user) return;
    setParentSetupData(result);
    try {
      localStorage.setItem(`sleepseed_parent_setup_${user.id}`, '1');
      localStorage.setItem(`sleepseed_child_profile_${user.id}`, JSON.stringify(result));
    } catch {}
    setView('onboarding');
  };

  // Handle "come back later" — save parent data + draft character, go to dashboard
  const handleParentSaveLater = async (result: ParentSetupResult) => {
    if (!user) return;
    setParentSetupData(result);
    try {
      localStorage.setItem(`sleepseed_parent_setup_${user.id}`, '1');
      localStorage.setItem(`sleepseed_child_profile_${user.id}`, JSON.stringify(result));
    } catch {}
    // Save a draft character to Supabase so data persists across devices
    try {
      const { uid } = await import('./lib/storage');
      await saveCharacter({
        id: uid(),
        userId: user.id,
        name: result.childName,
        type: 'human',
        ageDescription: result.childAge,
        pronouns: result.childPronouns as any,
        personalityTags: [],
        weirdDetail: result.parentSecret || '',
        currentSituation: '',
        color: '#F5B84C',
        emoji: '🌙',
        storyIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFamily: true,
      });
    } catch (e) { console.error('[parent-setup] draft character save failed:', e); }
    setView('dashboard');
  };

  // Friend-added toast (renders as overlay on any view)
  const friendToast = friendAdded ? (
    <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:9999,
      background:'rgba(20,216,144,.15)',border:'1px solid rgba(20,216,144,.3)',borderRadius:14,
      padding:'12px 20px',display:'flex',alignItems:'center',gap:10,backdropFilter:'blur(12px)',
      animation:'slideDown .3s ease-out',fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <span style={{fontSize:20}}>🤝</span>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:'#14d890'}}>{friendAdded} added as friend!</div>
        <div style={{fontSize:11,color:'rgba(244,239,232,.4)'}}>You can now share stories with each other.</div>
      </div>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  ) : null;

  // Library views — accessible to everyone (no auth required)
  if (view === 'library') return (
    <div style={{paddingBottom: user && !user.isGuest ? 76 : 0}}>
      <LibraryHome />
      {user && !user.isGuest && <BottomNav current="library" onNav={handleNav} />}
    </div>
  );
  if (view === 'library-story') return (
    <div style={{paddingBottom: user && !user.isGuest ? 76 : 0}}>
      <Suspense fallback={<div style={{minHeight:'100vh',background:'#060912',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(244,239,232,.3)',fontFamily:'system-ui',fontSize:14}}>Loading story&hellip;</div>}><LibraryStoryReader slug={libraryStorySlug ?? ''} /></Suspense>
      {user && !user.isGuest && <BottomNav current="library" onNav={handleNav} />}
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

  // Parent setup — clean adult onboarding
  if (view === 'parent-setup') return (
    <ParentSetup onComplete={handleParentSetup} onSkip={() => setView('dashboard')} onSaveLater={handleParentSaveLater} />
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
    // Pending onboarding prompt — shown when setup is incomplete
    const needsParentSetup = user && !user.isGuest && !parentSetupDone && !onboardingDone;
    const needsChildOnboarding = user && !user.isGuest && parentSetupDone && !onboardingDone;

    return (
      <div style={{paddingBottom:76}}>
        {friendToast}

        {/* Pending setup prompt */}
        {(needsParentSetup || needsChildOnboarding) && (
          <div style={{
            margin: '16px 16px 0', padding: '20px 20px', borderRadius: 16,
            background: 'rgba(245,184,76,.04)', border: '1px solid rgba(245,184,76,.12)',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            transition: 'background .2s',
          }}
            onClick={() => setView(needsParentSetup ? 'parent-setup' : 'onboarding')}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,184,76,.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,184,76,.04)')}
          >
            <div style={{ fontSize: 28, flexShrink: 0 }}>🌙</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Fraunces',Georgia,serif", fontWeight: 400, fontSize: 15,
                color: '#F4EFE8', marginBottom: 3,
              }}>
                {needsParentSetup ? 'Finish setting up' : 'Start your first night together'}
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 11,
                color: 'rgba(244,239,232,.35)',
              }}>
                {needsParentSetup ? 'Takes about 3 minutes' : 'The part you do together \u2014 5 minutes'}
              </div>
            </div>
            <div style={{ color: '#F5B84C', fontSize: 16, flexShrink: 0 }}>&rarr;</div>
          </div>
        )}

        <UserDashboard onSignUp={goAuth} onReadStory={openSavedStory} />
        <BottomNav current="dashboard" onNav={handleNav} />
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
        setDashKey(k => k + 1);
        setView('dashboard');
      }}
    />
  );
  if (view === 'first-night') { setView('dashboard'); return null; }

  if (view === 'hatchery') return (
    <div style={{paddingBottom:76}}>
      <Hatchery user={user!} onBack={goDashboard} />
      <BottomNav current="" onNav={handleNav} />
    </div>
  );

  // ── StoryJourney v3 views ──────────────────────────────────────────────
  if (view === 'journey-setup') return <JourneySetup />;
  if (view === 'nightly-checkin') return <NightlyCheckIn />;
  if (view === 'chapter-handoff') return <ChapterHandoff />;
  if (view === 'book-complete') return <BookComplete />;
  if (view === 'memory-reel') return <MemoryReel />;
  if (view === 'series-creator') return <SeriesCreator />;
  if (view === 'journey-library') return <JourneyLibrary onReadStory={openSavedStory} />;
  if (view === 'completed-book-reader') return <CompletedBookReader />;

  if (view === 'ritual-starter') return (
    <StoryCreator
      entryMode="ritual"
      onGenerate={(choices) => {
        setWizardChoices(choices);
        setPreloadedBook(null);
        setView('story-builder');
      }}
      onBack={() => setView('dashboard')}
    />
  );
  if (view === 'story-wizard') return (
    <StoryCreator
      entryMode="create"
      onGenerate={(choices) => {
        setWizardChoices(choices);
        setPreloadedBook(null);
        setView('story-builder');
      }}
      onBack={() => setView('dashboard')}
    />
  );
  if (view === 'user-profile') return (
    <div style={{paddingBottom:76}}>
      <UserProfile />
      <BottomNav current="user-profile" onNav={handleNav} />
    </div>
  );

  if (view === 'characters') return (
    <><CharacterLibrary
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
    <div style={{paddingBottom:76}}>
    <StoryLibrary
      userId={user!.id}
      onBack={goDashboard}
      onReadStory={openSavedStory}
      onCreateStory={() => setView('ritual-starter')}
    />
    <BottomNav current="story-library" onNav={handleNav} />
    </div>
  );

  if (view === 'nightcard-library') return (
    <div style={{paddingBottom:76}}>
    <NightCardLibrary
      userId={user!.id}
      onBack={goDashboard}
      filterCharacterId={nightCardFilter}
    />
    <BottomNav current="story-library" onNav={handleNav} />
    </div>
  );

  if ((view as string) === 'character-detail' && viewingCharacter) return (
    <><CharacterDetail
      character={viewingCharacter}
      userId={user!.id}
      onBack={() => setView('characters')}
      onEdit={goEditCharacter}
      onUseInStory={char => goStoryBuilder(char)}
      onReadStory={openSavedStory}
    /></>
  );

  if (view === 'story-builder') {
    // Determine what to show in SleepSeedCore:
    // 1. Completed book (already in preloadedBook format — pass directly)
    // 2. Journey chapter (needs conversion via chapterToBookData)
    // 3. Normal preloadedBook or fresh generation
    const isCompletedBook = !!(activeChapterOutput as Record<string, unknown>)?._isCompletedBook;
    const isChapterData = !isCompletedBook && activeChapterOutput && typeof activeChapterOutput === 'object' &&
      ('cover_page' in activeChapterOutput || 'coverPage' in activeChapterOutput ||
       'story_pages' in activeChapterOutput || 'storyPages' in activeChapterOutput);

    const effectivePreloadedBook = (() => {
      if (isCompletedBook && activeChapterOutput) return activeChapterOutput; // already correct format
      if (isChapterData) return chapterToBookData(activeChapterOutput as Record<string, unknown>);
      return preloadedBook;
    })();

    return (
      <div style={{ position: 'relative' }}>
        {/* Top nav hidden — controls are now inside the story reader tray */}
        <div style={{ display: 'none' }}>
          <button onClick={goDashboard}>Back</button>
          <div>SleepSeed</div>
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
        <Suspense fallback={<div style={{minHeight:'100vh',background:'#060912',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(244,239,232,.3)',fontFamily:'system-ui',fontSize:14}}>Loading&hellip;</div>}>
          <SleepSeedCore
            userId={user?.id}
            isGuest={user?.isGuest}
            preloadedCharacter={selectedCharacters.length > 0 ? selectedCharacters[0] : selectedCharacter}
            preloadedBook={effectivePreloadedBook}
            ritualSeed={ritualSeed}
            ritualMood={ritualMood}
            builderChoices={activeChapterOutput ? null : wizardChoices}
            companionCreature={companionCreature}
            onCharacterSavePrompt={() => {}}
            onStoryReady={() => {}}
            onGenerateError={() => setView('story-wizard')}
            onHome={() => {
              const bookObj = effectivePreloadedBook as any;
              // Completed book reader — go back to memory reel or dashboard
              if (bookObj?._isCompletedBook) {
                setActiveChapterOutput(null);
                setActiveCompletedBookId(null);
                setView('dashboard');
                return;
              }
              // Journey chapter — check if book is complete
              if (bookObj?._isJourneyChapter) {
                setActiveChapterOutput(null);
                if (bookObj._isBookComplete) {
                  setView('book-complete');
                  return;
                }
              }
              setView('dashboard');
            }}
          />
        </Suspense>
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
