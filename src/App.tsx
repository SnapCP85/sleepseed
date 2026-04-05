import { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import MySpace from './pages/MySpace';
import MySpaceHub from './pages/MySpaceHub';
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
import FamilyView from './pages/FamilyView';
import PrintNightCard from './pages/PrintNightCard';
import LibraryHome from './pages/LibraryHome';
import StoryCover from './pages/StoryCover';
import CharacterDetail from './features/characters/CharacterDetail';
import Hatchery from './pages/Hatchery';
import FirstNight from './pages/FirstNight';
import DevStoryTest from './pages/DevStoryTest';
import AdminUploadBook from './pages/AdminUploadBook';
import AdminEditorialConsole from './pages/AdminEditorialConsole';
import JourneyLibrary from './pages/JourneyLibrary';
import CompletedBookReader from './pages/CompletedBookReader';
import MemoryPortrait from './pages/MemoryPortrait';
import { JourneySetup, NightlyCheckIn, ChapterHandoff, BookComplete, MemoryReel, SeriesCreator } from './components/journey';
import { chapterToBookData } from './components/journey/ChapterHandoff';

// Lazy-loaded heavy components — not needed on initial render
const SleepSeedCore = lazy(() => import('./SleepSeedCore'));
const LibraryStoryReader = lazy(() => import('./pages/LibraryStoryReader'));
import { saveCharacter, saveNightCard, saveStory, addFriendByCode, uid } from './lib/storage';
import { saveHatchedCreature, createEgg, getAllHatchedCreatures } from './lib/hatchery';
import type { Character, HatchedCreature, SavedNightCard } from './lib/types';
import DreamKeeperOnboarding from './pages/DreamKeeperOnboarding';
import NewUserFlowTest from './pages/NewUserFlowTest';
import type { DreamKeeperResult } from './pages/DreamKeeperOnboarding';
import { CREATURES } from './lib/creatures';
import AppLayout from './components/AppLayout';
import OnboardingRitual from './pages/OnboardingRitual';
import { initRitualState, isRitualComplete } from './lib/ritualState';
import ParentOnboarding from './pages/ParentOnboarding';
import type { ParentOnboardingResult } from './pages/ParentOnboarding';
import CinematicTransition from './components/onboarding/CinematicTransition';
import NightDashboard from './pages/NightDashboard';
import Night3Story from './pages/Night3Story';
import HatchCeremony from './components/onboarding/HatchCeremony';
import PostHatch from './pages/PostHatch';
import { getRitualState, completeNight3, saveRitualState, createDefaultRitualState } from './lib/ritualState';
import { assignCreature } from './lib/creatureAssignment';
import { V1_DREAMKEEPERS } from './lib/dreamkeepers';
import OnboardingV9Preview from './pages/OnboardingV9Preview';
import OnboardingShell from './components/onboarding/OnboardingShell';
import ErrorBoundary from './components/ErrorBoundary';

// Old BottomNav removed — replaced by src/components/BottomNavigation.tsx via AppLayout

function AppInner() {
  // Shared night card — public, no auth required
  if (new URLSearchParams(window.location.search).get('nc')) return <SharedNightCard />;
  // Family collection view — public, no auth required
  if (window.location.pathname.startsWith('/family/')) return <FamilyView />;
  // Print night card
  if (new URLSearchParams(window.location.search).get('printCard')) return <PrintNightCard />;
  // DEV-only routes — gated behind dev mode to prevent accidental access during demos
  if (import.meta.env.DEV) {
    if (new URLSearchParams(window.location.search).get('view') === 'dev-story') return <DevStoryTest />;
    if (new URLSearchParams(window.location.search).get('view') === 'v9-preview') return <OnboardingV9Preview />;
    if (new URLSearchParams(window.location.search).get('view') === 'dk-test') return (
      <DreamKeeperOnboarding
        childName="Test Child"
        childAge="6"
        childPronouns="they/them"
        onComplete={(result) => { console.log('[dk-test] DreamKeeper selected:', result); alert(`Selected: ${result.dreamKeeper.name} (${result.dreamKeeper.virtue})\nFeeling: ${result.feeling}`); }}
        onBack={() => { window.location.href = window.location.pathname; }}
      />
    );
    if (new URLSearchParams(window.location.search).get('view') === 'new-user-test') {
      return <NewUserFlowTest />;
    }
  }

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
  // v9 onboarding: track which night sub-screen to show after story-builder returns
  // Persisted to sessionStorage so a page refresh during generation doesn't lose the return path
  const [nightReturnTo, _setNightReturnTo] = useState<{ night: 1 | 2 | 3; screen: string } | null>(() => {
    try { const s = sessionStorage.getItem('sleepseed_nightReturnTo'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const setNightReturnTo = (val: { night: 1 | 2 | 3; screen: string } | null) => {
    _setNightReturnTo(val);
    try {
      if (val) sessionStorage.setItem('sleepseed_nightReturnTo', JSON.stringify(val));
      else sessionStorage.removeItem('sleepseed_nightReturnTo');
    } catch {}
  };
  const [viewingCharacter,   setViewingCharacter]   = useState<Character | null>(null);
  // Multi-child: name entry for additional children before DreamKeeper onboarding
  const [addChildName, setAddChildName] = useState<string | null>(null);
  const [addChildNameInput, setAddChildNameInput] = useState('');

  // Demo mode auto-login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') !== 'true') {
      // Clear stale demo flag — but only if current user is NOT the demo user
      const DEMO_UID = '71d31ef2-391b-4bb3-9060-b856560e5739';
      if (user && user.id !== DEMO_UID) {
        try { sessionStorage.removeItem('sleepseed_demo'); } catch {}
      }
      return;
    }
    import('./lib/demo-mode').then(async ({ activateDemo, setDemoLocalStorage, DEMO_EMAIL, DEMO_PASSWORD, initDemoShortcuts }) => {
      activateDemo();
      initDemoShortcuts();
      const DEMO_UID = '71d31ef2-391b-4bb3-9060-b856560e5739';
      // If already logged in as demo user, just set flags
      if (user && user.id === DEMO_UID) { setDemoLocalStorage(user.id); return; }
      // If logged in as someone else, sign out first
      const { supabase } = await import('./lib/supabase');
      if (user && user.id !== DEMO_UID) {
        await supabase.auth.signOut();
      }
      // Login as demo user
      const { data } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (data?.user) {
        setDemoLocalStorage(data.user.id);
        // Remove ?demo=true from URL to prevent reload loop, keep session flag
        const url = new URL(window.location.href);
        url.searchParams.delete('demo');
        window.location.href = url.toString();
      }
    });
  }, [user]);

  // Check for shared story / library links on mount
  const [isSharedStory, setIsSharedStory] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) { setIsSharedStory(true); return; }

    const librarySlug = params.get('library');
    if (librarySlug) { setLibraryStorySlug(librarySlug); setView('story-cover'); return; }

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

  // Story builder handoff state — brief transition before generation starts
  const [storyHandoffDone, setStoryHandoffDone] = useState(true);
  useEffect(() => {
    if (view === 'story-builder' && wizardChoices && !preloadedBook && !activeChapterOutput) {
      setStoryHandoffDone(false);
      const t = setTimeout(() => setStoryHandoffDone(true), 800);
      return () => clearTimeout(t);
    } else {
      setStoryHandoffDone(true);
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── All hooks above this line ─────────────────────────────────────────────

  if (isSharedStory) return <SharedStoryViewer />;
  if (view === 'dev-story') return <DevStoryTest />;
  if (new URLSearchParams(window.location.search).get('view') === 'admin-upload') return <AdminUploadBook />;
  if (new URLSearchParams(window.location.search).get('view') === 'editorial-console') return <AdminEditorialConsole />;

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

  // ── Reliable child profile resolver (avoids "friend" fallback) ───────────
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const resolveChildProfile = (): { childName: string; childAge: string; childPronouns: string } => {
    let result: { childName: string; childAge: string; childPronouns: string } | null = null;
    // 1. React state (freshest if parent just completed onboarding)
    if (parentSetupData?.childName) result = parentSetupData as any;
    // 2. localStorage (survives refresh)
    if (!result && user) {
      try {
        const stored = localStorage.getItem(`sleepseed_child_profile_${user.id}`);
        if (stored) { const p = JSON.parse(stored); if (p?.childName) result = p; }
      } catch {}
    }
    // 3. Ritual state (has childName from initRitualState)
    if (!result && user) {
      const rs = getRitualState(user.id);
      if (rs.childName && rs.childName !== 'friend') result = { childName: rs.childName, childAge: '', childPronouns: 'they/them' };
    }
    // 4. Selected character
    if (!result && selectedCharacter?.name) result = { childName: selectedCharacter.name, childAge: selectedCharacter.ageDescription || '', childPronouns: (selectedCharacter.pronouns || 'they/them') as string };
    // 5. Any family character from characters list in context
    if (!result && selectedCharacters?.length > 0 && selectedCharacters[0]?.name) result = { childName: selectedCharacters[0].name, childAge: selectedCharacters[0].ageDescription || '', childPronouns: (selectedCharacters[0].pronouns || 'they/them') as string };
    // 6. Characters cached in localStorage (covers returning users who skip onboarding)
    if (!result && user) {
      try {
        const cachedChars = JSON.parse(localStorage.getItem(`ss2_chars_${user.id}`) || '[]');
        const familyChar = cachedChars.find((c: any) => c.isFamily && c.type === 'human' && c.name);
        if (familyChar) result = { childName: familyChar.name, childAge: familyChar.ageDescription || '', childPronouns: (familyChar.pronouns || 'they/them') as string };
      } catch {}
    }
    // Always capitalize the name
    if (result) { result.childName = capitalize(result.childName.trim()); return result; }
    return { childName: 'Dreamer', childAge: '', childPronouns: 'they/them' };
  };

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
  const goNewCharacter  = () => { setEditingCharacter(null); setAddChildName(null); setAddChildNameInput(''); setView('onboarding'); };
  const goEditCharacter = (c: Character) => { setEditingCharacter(c); setView('character-builder'); };
  const goNightCards    = (filterId?: string) => { setNightCardFilter(filterId); setView('nightcard-library'); };
  const goStoryLibrary  = () => setView('story-library');
  const goCharacterDetail = (c: Character) => { setViewingCharacter(c); setView('character-detail' as any); };
  const handleNav = (v: string) => {
    clearLibraryUrl();
    if (v === 'ritual-starter') {
      // Create tab — go to ritual story creation
      setPreloadedBook(null);
      setWizardChoices(null);
      setView('ritual-starter');
    } else if (v === 'library') {
      const url = new URL(window.location.href);
      url.search = '?view=library';
      window.history.pushState({}, '', url.pathname + url.search);
      setView('library');
    } else {
      setView(v as any);
    }
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

  // Handle DreamKeeper onboarding completion — save character + creature, route to ritual-starter
  const handleDreamKeeperComplete = async (result: DreamKeeperResult) => {
    if (!user) { setView('dashboard'); return; }

    // Load child profile (same logic as the view === 'onboarding' block)
    let profile = parentSetupData;
    if (!profile) {
      try {
        const stored = localStorage.getItem(`sleepseed_child_profile_${user.id}`);
        if (stored) profile = JSON.parse(stored);
      } catch {}
    }

    const dk = result.dreamKeeper;
    const charId = uid();
    const creatureId = crypto.randomUUID?.() || uid();

    // creatureType must be a valid id from creatures.ts where possible
    // owl, bear, fox, bunny, dragon, cat, turtle all exist in creatures.ts
    // sloth, seal, dog do NOT — use 'spirit' as a neutral fallback
    // (getCreature('spirit') gracefully falls back to CREATURES[0] in Hatchery)
    const creatureTypeIsValid = CREATURES.some(c => c.id === dk.id);
    const creatureType = creatureTypeIsValid ? dk.id : 'spirit';

    // Step 1: Save character — mirrors OnboardingFlow lines 757-772 exactly
    const character: Character = {
      id: charId,
      userId: user.id,
      name: result.childName || profile?.childName || '',
      type: 'human',
      ageDescription: profile?.childAge || '',
      pronouns: (profile?.childPronouns || 'they/them') as any,
      personalityTags: [],
      weirdDetail: profile?.parentSecret || '',
      currentSituation: '',
      color: dk.color,
      emoji: dk.emoji,
      storyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFamily: true,
    };

    // Step 2: Save creature — mirrors OnboardingFlow lines 775-790 exactly
    const creature: HatchedCreature = {
      id: creatureId,
      userId: user.id,
      characterId: charId,
      name: dk.name,
      creatureType,
      creatureEmoji: dk.emoji,
      color: dk.color,
      rarity: 'common',
      personalityTraits: dk.personalityTraits,
      dreamAnswer: result.feeling,
      parentSecret: profile?.parentSecret || '',
      hatchedAt: new Date().toISOString(),
      weekNumber: 1,
    };

    const errors: string[] = [];
    try { await saveCharacter(character); }
    catch (e) { console.error('[dk-onboarding] saveCharacter failed:', e); errors.push('character'); }

    try { await saveHatchedCreature(creature); }
    catch (e) { console.error('[dk-onboarding] saveHatchedCreature failed:', e); errors.push('creature'); }

    if (!errors.includes('character')) {
      try { await createEgg(user.id, charId, creatureType, 1); }
      catch (e) { console.error('[dk-onboarding] createEgg failed:', e); errors.push('egg'); }
    }

    if (errors.length > 0) {
      console.error(`[dk-onboarding] Completed with ${errors.length} failed steps:`, errors);
    } else {
      console.log('[dk-onboarding] All saves completed successfully');
    }

    // Set context state
    setCompanionCreature(creature);
    setSelectedCharacter(character);
    setSelectedCharacters([character]);

    // Mark onboarding done (DreamKeeper selected — but ritual not yet complete)
    try { localStorage.setItem(`sleepseed_onboarding_${user.id}`, '1'); } catch {}

    // Initialize ritual state for the 3-night hatching sequence
    const profile2 = parentSetupData || (() => {
      try { const s = localStorage.getItem(`sleepseed_child_profile_${user.id}`); return s ? JSON.parse(s) : null; } catch { return null; }
    })();
    initRitualState(
      user.id,
      result.childName || profile2?.childName || 'friend',
      dk.name,
      dk.emoji,
      dk.color,
    );

    // Route to 3-night onboarding ritual (Night 1)
    setView('onboarding-ritual');
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

  // Demo mode: set localStorage flags synchronously before flag reads
  if (user && typeof localStorage !== 'undefined') {
    try {
      const isDemoUrl = new URLSearchParams(window.location.search).get('demo') === 'true';
      const isDemoSession = sessionStorage.getItem('sleepseed_demo') === '1';
      if (isDemoUrl || isDemoSession) {
        if (!localStorage.getItem(`sleepseed_onboarding_${user.id}`)) {
          localStorage.setItem(`sleepseed_parent_setup_${user.id}`, '1');
          localStorage.setItem(`sleepseed_onboarding_${user.id}`, '1');
          localStorage.setItem(`sleepseed_ritual_complete_${user.id}`, '1');
        }
      }
    } catch {}
  }

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
    user && !user.isGuest
      ? <AppLayout currentTab="library" onNav={handleNav}><LibraryHome /></AppLayout>
      : <LibraryHome />
  );
  if (view === 'story-cover') return (
    <StoryCover
      slug={libraryStorySlug ?? ''}
      onReadStory={() => setView('library-story')}
    />
  );
  if (view === 'library-story') return (
    user && !user.isGuest
      ? <AppLayout currentTab="library" onNav={handleNav}>
          <Suspense fallback={<div style={{minHeight:'100vh',background:'#060912',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(244,239,232,.3)',fontFamily:'system-ui',fontSize:14}}>Loading story&hellip;</div>}><LibraryStoryReader slug={libraryStorySlug ?? ''} /></Suspense>
        </AppLayout>
      : <Suspense fallback={<div style={{minHeight:'100vh',background:'#060912',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(244,239,232,.3)',fontFamily:'system-ui',fontSize:14}}>Loading story&hellip;</div>}><LibraryStoryReader slug={libraryStorySlug ?? ''} /></Suspense>
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

  // ── Parent Onboarding v9 (cinematic 6-screen flow) ────────────────────
  const handleParentOnboardingV9 = async (result: ParentOnboardingResult) => {
    if (!user) return;
    // Store as ParentSetupResult shape for compatibility
    const compat: ParentSetupResult = {
      childName: result.childName,
      childAge: result.childAge,
      childPronouns: result.childPronouns,
      parentRole: '',
    };
    setParentSetupData(compat);
    try {
      localStorage.setItem(`sleepseed_parent_setup_${user.id}`, '1');
      localStorage.setItem(`sleepseed_child_profile_${user.id}`, JSON.stringify(compat));
    } catch {}

    // Create child character (no creature yet — that happens at hatch)
    const charId = uid();
    const character: Character = {
      id: charId,
      userId: user.id,
      name: result.childName,
      type: 'human',
      ageDescription: result.childAge || '',
      pronouns: (result.childPronouns || 'they/them') as any,
      personalityTags: [],
      weirdDetail: '',
      currentSituation: '',
      color: '#F5B84C',
      emoji: '\uD83C\uDF19',
      storyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFamily: true,
    };
    try { await saveCharacter(character); } catch (e) { console.error('[v9-onboarding] saveCharacter failed:', e); }
    setSelectedCharacter(character);
    setSelectedCharacters([character]);

    // Create initial egg
    try { await createEgg(user.id, charId, 'spirit', 1); } catch (e) { console.error('[v9-onboarding] createEgg failed:', e); }

    // Mark parent setup done + onboarding done (creature not assigned yet, ritual starts)
    try { localStorage.setItem(`sleepseed_onboarding_${user.id}`, '1'); } catch {}

    // Initialize ritual state (creature TBD — will be assigned at hatch based on 3 nights of answers)
    initRitualState(user.id, result.childName, 'Dream Egg', '\uD83E\uDD5A', '#F5B84C');

    // Route to cinematic transition (Elder → name constellation → Night 1)
    setView('cinematic-transition');
  };

  if (view === 'parent-onboarding') return (
    <ParentOnboarding
      onComplete={handleParentOnboardingV9}
      onSaveLater={() => setView('dashboard')}
    />
  );

  // ── Cinematic Transition (Elder → name constellation → Night 1 ritual) ──
  if (view === 'cinematic-transition') {
    return <OnboardingShell><CinematicTransition childName={resolveChildProfile().childName} onComplete={() => setView('onboarding-ritual')} /></OnboardingShell>;
  }

  // ── Night 1 Dashboard ────────────────────────────────────────────────
  if (view === 'night-1') return (
    <OnboardingShell><NightDashboard
      night={1}
      initialScreen={nightReturnTo?.night === 1 ? nightReturnTo.screen : undefined}
      onInitialScreenConsumed={() => setNightReturnTo(null)}
      onStartStory={(ritualSeed) => {
        const cp = resolveChildProfile();
        const heroGender = cp.childPronouns === 'he/him' ? 'boy' : cp.childPronouns === 'she/her' ? 'girl' : '';
        setWizardChoices({
          path: 'ritual',
          heroName: cp.childName,
          heroGender,
          vibe: 'calm-cosy',
          level: cp.childAge ? (parseInt(cp.childAge) <= 5 ? 'age3' : parseInt(cp.childAge) <= 8 ? 'age5' : 'age7') : 'age5',
          length: 'standard',
          brief: ritualSeed,
          chars: [],
          lessons: [],
          occasion: '',
          occasionCustom: '',
          style: 'standard',
          pace: 'sleepy',
        });
        setNightReturnTo({ night: 1, screen: 'egg-gift' });
        setPreloadedBook(null);
        setView('story-builder');
      }}
      onNightComplete={() => {
        setDashKey(k => k + 1);
        setView('dashboard');
      }}
      onCreateAnotherStory={() => {
        setPreloadedBook(null);
        setWizardChoices(null);
        setView('ritual-starter');
      }}
    /></OnboardingShell>
  );

  // ── Night 2 Dashboard ────────────────────────────────────────────────
  if (view === 'night-2') return (
    <OnboardingShell>
    <NightDashboard
      night={2}
      initialScreen={nightReturnTo?.night === 2 ? nightReturnTo.screen : undefined}
      onInitialScreenConsumed={() => setNightReturnTo(null)}
      onStartStory={(ritualSeed) => {
        const cp = resolveChildProfile();
        const heroGender = cp.childPronouns === 'he/him' ? 'boy' : cp.childPronouns === 'she/her' ? 'girl' : '';
        setWizardChoices({
          path: 'ritual',
          heroName: cp.childName,
          heroGender,
          vibe: 'calm-cosy',
          level: cp.childAge ? (parseInt(cp.childAge) <= 5 ? 'age3' : parseInt(cp.childAge) <= 8 ? 'age5' : 'age7') : 'age5',
          length: 'standard',
          brief: ritualSeed,
          chars: [],
          lessons: [],
          occasion: '',
          occasionCustom: '',
          style: 'standard',
          pace: 'sleepy',
        });
        setNightReturnTo({ night: 2, screen: 'post-story' });
        setPreloadedBook(null);
        setView('story-builder');
      }}
      onNightComplete={() => {
        setDashKey(k => k + 1);
        setView('dashboard');
      }}
    /></OnboardingShell>
  );

  // ── Night 3 Dashboard ────────────────────────────────────────────────
  if (view === 'night-3') return (
    <OnboardingShell><NightDashboard
      night={3}
      onStartStory={() => setView('night-3-story' as any)}
      onNightComplete={() => {
        setDashKey(k => k + 1);
        setView('dashboard');
      }}
    /></OnboardingShell>
  );

  // ── Night 3 Story (hardcoded "The Choosing") ─────────────────────────
  if ((view as string) === 'night-3-story') {
    return <OnboardingShell><Night3Story childName={resolveChildProfile().childName} onComplete={() => setView('hatch-ceremony')} /></OnboardingShell>;
  }

  // ── Hatch Ceremony ───────────────────────────────────────────────────
  if (view === 'hatch-ceremony') {
    const profile = resolveChildProfile();
    // Determine creature from 3 nights of answers
    const rs = user ? getRitualState(user.id) : null;
    const assigned = assignCreature(rs?.smileAnswer || '', rs?.talentAnswer || '');

    return <OnboardingShell><HatchCeremony
      childName={profile.childName}
      creatureEmoji={assigned.emoji}
      onComplete={async () => {
        if (!user) { setView('dashboard'); return; }

        // Complete Night 3 ritual
        completeNight3(user.id);
        try { localStorage.setItem(`sleepseed_ritual_complete_${user.id}`, '1'); } catch {}

        // Save hatched creature to Supabase
        const creatureTypeIsValid = CREATURES.some(c => c.id === assigned.id);
        const creatureType = creatureTypeIsValid ? assigned.id : 'spirit';
        const creatureId = crypto.randomUUID?.() || uid();

        // Find the character (first family character)
        let charId = '';
        try {
          const { getCharacters } = await import('./lib/storage');
          const chars = await getCharacters(user.id);
          const familyChar = chars.find(c => c.isFamily);
          if (familyChar) {
            charId = familyChar.id;
            // Update character with creature emoji/color
            familyChar.emoji = assigned.emoji;
            familyChar.color = assigned.color;
            await saveCharacter(familyChar);
          }
        } catch (e) { console.error('[hatch] getCharacters failed:', e); }

        const creature: HatchedCreature = {
          id: creatureId,
          userId: user.id,
          characterId: charId,
          name: rs?.creatureName || assigned.name,
          creatureType,
          creatureEmoji: assigned.emoji,
          color: assigned.color,
          rarity: 'common',
          personalityTraits: assigned.personalityTraits,
          dreamAnswer: rs?.smileAnswer || '',
          parentSecret: '',
          hatchedAt: new Date().toISOString(),
          weekNumber: 1,
        };

        try { await saveHatchedCreature(creature); } catch (e) { console.error('[hatch] saveHatchedCreature failed:', e); }
        setCompanionCreature(creature);

        // Save Night 3 night card
        const nc: SavedNightCard = {
          id: crypto.randomUUID?.() || `nc_${Date.now()}`,
          userId: user.id,
          heroName: profile.childName,
          storyTitle: 'The Night Your DreamKeeper Was Born',
          characterIds: charId ? [charId] : [],
          headline: 'The Night Your DreamKeeper Was Born',
          quote: 'After three nights of listening, it chose to become theirs.',
          emoji: assigned.emoji,
          date: new Date().toISOString().split('T')[0],
          isOrigin: false,
          nightNumber: 3,
          creatureEmoji: assigned.emoji,
          creatureColor: assigned.color,
        };
        try { await saveNightCard(nc); } catch (e) { console.error('[hatch] saveNightCard failed:', e); }

        // Route to post-hatch screens
        setView('post-hatch' as any);
      }}
    /></OnboardingShell>;
  }

  // ── Post-Hatch (first contact → photo card → born card) ──────────────
  if ((view as string) === 'post-hatch') {
    const profile = resolveChildProfile();
    const rs = user ? getRitualState(user.id) : null;
    const assigned = assignCreature(rs?.smileAnswer || '', rs?.talentAnswer || '');
    return <OnboardingShell><PostHatch
      childName={profile.childName}
      creatureEmoji={assigned.emoji}
      creatureName={assigned.name}
      onComplete={() => {
        setDashKey(k => k + 1);
        setView('dashboard');
      }}
    /></OnboardingShell>;
  }

  // Parent setup — clean adult onboarding (LEGACY — kept as fallback)
  if (view === 'parent-setup') return (
    <ParentSetup onComplete={handleParentSetup} onSkip={() => setView('dashboard')} onSaveLater={handleParentSaveLater} />
  );

  // ── DreamKeeper onboarding (V1) ──────────────────────────────────────────
  // Replaces the old creature-grid selection path (OnboardingFlow steps 1-4)
  // for new users. After the child confirms their DreamKeeper, they route
  // directly to ritual-starter to create their first story.
  //
  // OnboardingFlow.tsx is NOT deleted — it remains as:
  //   1. Fallback (revert this block to restore the old flow instantly)
  //   2. Test mode target (?test=onboarding still uses OnboardingFlow)
  //
  // Integration: handleDreamKeeperComplete (above) saves Character +
  // HatchedCreature + Egg, sets companionCreature in context, then routes
  // to ritual-starter. No night card or first story is created here — those
  // come from the normal story creation flow.
  if (view === 'onboarding') {
    // Load child profile from localStorage if not in state
    let profile = parentSetupData;
    if (!profile && user) {
      try {
        const stored = localStorage.getItem(`sleepseed_child_profile_${user.id}`);
        if (stored) profile = JSON.parse(stored);
      } catch {}
    }

    // ── Multi-child: returning parent adding another child ──
    // If onboarding is already done (they have at least 1 child), show a name entry first
    const isReturningParent = onboardingDone && user && !user.isGuest;
    if (isReturningParent && !addChildName) {
      return (
        <div style={{
          minHeight: '100vh', background: 'linear-gradient(180deg,#060912 0%,#0a0e24 40%,#0f0a20 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', fontFamily: "'Nunito',system-ui,sans-serif",
        }}>
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🌙</div>
            <div style={{
              fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 300,
              color: '#F4EFE8', marginBottom: 8, lineHeight: 1.3,
            }}>
              Adding a new dreamer
            </div>
            <div style={{
              fontSize: 14, color: 'rgba(244,239,232,.4)', marginBottom: 32, lineHeight: 1.6,
            }}>
              What's your child's name?
            </div>
            <input
              autoFocus
              value={addChildNameInput}
              onChange={e => setAddChildNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && addChildNameInput.trim()) {
                  setAddChildName(addChildNameInput.trim());
                }
              }}
              placeholder="Their first name"
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 14,
                background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.12)',
                color: '#F4EFE8', fontSize: 20, fontFamily: "'Fraunces',Georgia,serif",
                textAlign: 'center', outline: 'none',
                transition: 'border-color .2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,184,76,.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'}
            />
            <button
              disabled={!addChildNameInput.trim()}
              onClick={() => setAddChildName(addChildNameInput.trim())}
              style={{
                width: '100%', marginTop: 20, padding: '16px 24px', border: 'none', borderRadius: 14,
                background: addChildNameInput.trim()
                  ? 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)'
                  : 'rgba(255,255,255,.06)',
                color: addChildNameInput.trim() ? '#080200' : 'rgba(244,239,232,.25)',
                fontSize: 16, fontWeight: 700, cursor: addChildNameInput.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Nunito',system-ui,sans-serif",
                transition: 'all .2s',
              }}
            >
              Continue
            </button>
            <button
              onClick={() => { setAddChildName(null); setAddChildNameInput(''); setView('dashboard'); }}
              style={{
                marginTop: 14, padding: '10px 20px', background: 'transparent', border: 'none',
                color: 'rgba(244,239,232,.3)', fontSize: 13, cursor: 'pointer',
                fontFamily: "'Nunito',system-ui,sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Use addChildName for returning parents, or profile for first-time
    const childNameForOnboarding = addChildName || profile?.childName || '';

    // Returning parents adding another child → DreamKeeper selection directly
    if (isReturningParent) {
      return <DreamKeeperOnboarding
        childName={childNameForOnboarding}
        onComplete={(result) => {
          setAddChildName(null);
          setAddChildNameInput('');
          handleDreamKeeperComplete(result);
        }}
        onBack={() => { setAddChildName(null); setAddChildNameInput(''); setView('dashboard'); }}
      />;
    }

    // First-time users → full OnboardingFlow (child intro slides first)
    return <OnboardingFlow
      childProfile={profile || { childName: childNameForOnboarding, childAge: '', childPronouns: '', parentRole: '' }}
      onComplete={(result) => {
        handleOnboardingComplete(result);
      }}
    />;
  }

  if (view === 'dashboard') {
    // Auto-route new users straight to onboarding (not dashboard with a prompt)
    // Demo mode: skip all onboarding redirects
    const DEMO_UID = '71d31ef2-391b-4bb3-9060-b856560e5739';
    const isDemo = user?.id === DEMO_UID
      || ((() => { try { return sessionStorage.getItem('sleepseed_demo') === '1' || new URLSearchParams(window.location.search).get('demo') === 'true'; } catch { return false; } })());
    const needsParentSetup = !isDemo && user && !user.isGuest && !parentSetupDone && !onboardingDone;
    const needsChildOnboarding = !isDemo && user && !user.isGuest && parentSetupDone && !onboardingDone;
    if (needsParentSetup) { setView('parent-onboarding'); return null; }
    if (needsChildOnboarding) { setView('onboarding'); return null; }

    // Ritual prompt — shown when DreamKeeper is selected but 3-night ritual is in progress
    const ritualComplete = user && !user.isGuest
      ? !!localStorage.getItem(`sleepseed_ritual_complete_${user.id}`) || isRitualComplete(user.id)
      : true;
    const needsRitual = user && !user.isGuest && onboardingDone && !ritualComplete;

    return (
      <AppLayout currentTab="dashboard" onNav={handleNav}>
        {friendToast}

        {/* Pending setup prompt */}
        {(needsParentSetup || needsChildOnboarding) && (
          <div style={{
            margin: '16px 16px 0', padding: '20px 20px', borderRadius: 16,
            background: 'rgba(245,184,76,.04)', border: '1px solid rgba(245,184,76,.12)',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            transition: 'background .2s',
          }}
            onClick={() => setView(needsParentSetup ? 'parent-onboarding' : 'onboarding')}
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

        {/* Ritual banner removed — MySpace CTA handles ritual routing directly */}

        <MySpace key={dashKey} onSignUp={goAuth} onReadStory={openSavedStory} />
      </AppLayout>
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

  // ── Demo Onboarding Walkthrough (all 3 nights back-to-back) ─────────
  if (view === 'demo-onboarding') {
    // Reset ritual state to Night 1 so the full sequence plays
    if (user) {
      const rs = getRitualState(user.id);
      if (rs.ritualComplete || rs.night1Complete) {
        const fresh = createDefaultRitualState();
        fresh.childName = 'Adina';
        fresh.creatureName = 'Moonlight';
        fresh.creatureEmoji = '🦉';
        fresh.creatureColor = '#9A7FD4';
        saveRitualState(user.id, fresh);
        try { localStorage.removeItem(`sleepseed_ritual_complete_${user.id}`); } catch {}
      }
    }
    return (
      <OnboardingRitual
        demoWalkthrough
        onRitualComplete={async () => {
          // Restore ritual complete state after demo
          if (user) {
            try { localStorage.setItem(`sleepseed_ritual_complete_${user.id}`, '1'); } catch {}
            const { setDemoLocalStorage } = await import('./lib/demo-mode');
            setDemoLocalStorage(user.id);
          }
          setDashKey(k => k + 1);
          setView('dashboard');
        }}
        onExit={() => {
          // In demo mode this shouldn't fire, but just in case
          setDashKey(k => k + 1);
          setView('dashboard');
        }}
      />
    );
  }

  // ── 3-Night Onboarding Ritual ──────────────────────────────────────────
  if (view === 'onboarding-ritual') return (
    <OnboardingRitual
      onRitualComplete={async () => {
        // Ritual complete — mark it and go to dashboard (My Space)
        try { localStorage.setItem(`sleepseed_ritual_complete_${user!.id}`, '1'); } catch {}

        // Update creature name if the user customized it during the naming step
        const freshRitual = getRitualState(user!.id);
        if (freshRitual.creatureName) {
          try {
            const { updateCreatureName } = await import('./lib/hatchery');
            await updateCreatureName(user!.id, freshRitual.creatureName);
            // Update in-memory companion creature too
            if (companionCreature) {
              setCompanionCreature({ ...companionCreature, name: freshRitual.creatureName });
            }
          } catch (e) { console.error('[ritual] updateCreatureName failed:', e); }
        }

        setDashKey(k => k + 1);
        setView('dashboard');
      }}
      onExit={() => {
        // Night 1 or 2 complete — return to dashboard until next session
        setDashKey(k => k + 1);
        setView('dashboard');
      }}
    />
  );

  if (view === 'my-space') return (
    <AppLayout currentTab="my-space" onNav={handleNav}>
      <MySpaceHub onSignUp={goAuth} onReadStory={openSavedStory} />
    </AppLayout>
  );

  if (view === 'hatchery') return (
    <AppLayout currentTab="" onNav={handleNav}>
      <Hatchery user={user!} onBack={goDashboard} />
    </AppLayout>
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
    <AppLayout currentTab="user-profile" onNav={handleNav}>
      <UserProfile />
    </AppLayout>
  );

  if (view === 'characters') return (
    <AppLayout currentTab="user-profile" onNav={handleNav}>
      <CharacterLibrary
        userId={user!.id}
        onBack={goDashboard}
        onNew={goNewCharacter}
        onEdit={goEditCharacter}
        onUseInStory={char => goCharacterDetail(char)}
        onReadStory={openSavedStory}
        onViewNightCards={charId => goNightCards(charId)}
      />
    </AppLayout>
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
    <AppLayout currentTab="my-space" onNav={handleNav}>
      <StoryLibrary
        userId={user!.id}
        onBack={() => setView('my-space')}
        onReadStory={openSavedStory}
        onCreateStory={() => setView('ritual-starter')}
      />
    </AppLayout>
  );

  if (view === 'nightcard-library') return (
    <AppLayout currentTab="my-space" onNav={handleNav}>
      <NightCardLibrary
        userId={user!.id}
        onBack={() => setView('my-space')}
        filterCharacterId={nightCardFilter}
      />
    </AppLayout>
  );

  if ((view as string) === 'memory-portrait') {
    // Use selectedCharacter, editingCharacter, or first family character as the portrait subject
    const portraitChild = selectedCharacter || editingCharacter || null;
    if (portraitChild) return (
      <AppLayout currentTab="my-space" onNav={handleNav}>
        <MemoryPortrait
          child={portraitChild}
          onBack={() => setView('user-profile')}
        />
      </AppLayout>
    );
    // Fallback if no child selected
    setView('user-profile');
    return null;
  }

  if ((view as string) === 'character-detail' && viewingCharacter) return (
    <AppLayout currentTab="user-profile" onNav={handleNav}>
      <CharacterDetail
        character={viewingCharacter}
        userId={user!.id}
        onBack={() => setView('characters')}
        onEdit={goEditCharacter}
        onUseInStory={char => goStoryBuilder(char)}
        onReadStory={openSavedStory}
      />
    </AppLayout>
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

    // Brief handoff transition — DreamKeeper receiving the story seed
    if (!storyHandoffDone) {
      return (
        <div style={{
          minHeight: '100vh', background: '#060912',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, animation: 'fadeIn .3s ease both',
        }}>
          <div style={{ fontSize: 64, animation: 'floatY 3s ease-in-out infinite' }}>
            {companionCreature?.creatureEmoji || '\uD83E\uDD5A'}
          </div>
          <div style={{
            fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 300,
            fontStyle: 'italic', color: 'rgba(244,239,232,.6)', letterSpacing: '-0.2px',
            animation: 'fadeIn .5s .2s ease both', opacity: 0,
          }}>
            {companionCreature?.name || 'Your DreamKeeper'} is listening...
          </div>
          <style>{`
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          `}</style>
        </div>
      );
    }

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
            onGenerateError={() => {
              // If in ritual flow, return to current night instead of generic story-wizard
              if (nightReturnTo) {
                const { night } = nightReturnTo;
                setView(night === 1 ? 'night-1' : night === 2 ? 'night-2' : 'night-3');
                return;
              }
              setView('story-wizard');
            }}
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
              // v9 onboarding: return to the night dashboard post-story screen
              // NOTE: Don't clear nightReturnTo here — NightDashboard needs it on remount.
              // It will be cleared via onInitialScreenConsumed callback after the component reads it.
              if (nightReturnTo) {
                const { night } = nightReturnTo;
                setView(night === 1 ? 'night-1' : night === 2 ? 'night-2' : 'night-3');
                return;
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
    <ErrorBoundary>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </ErrorBoundary>
  );
}
