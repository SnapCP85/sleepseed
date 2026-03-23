import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import PublicHomepage from './pages/PublicHomepage';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import OnboardingFlow from './pages/OnboardingFlow';
import ReadyStateDashboard from './pages/ReadyStateDashboard';
import type { OnboardingResult } from './pages/OnboardingFlow';
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
import Hatchery from './pages/Hatchery';
import FirstNight from './pages/FirstNight';
import { saveCharacter, saveNightCard } from './lib/storage';
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
.btabs{display:flex;background:rgba(8,12,24,.97);border-top:1px solid rgba(232,151,42,.07);padding:8px 0 6px;position:fixed;bottom:0;left:0;right:0;z-index:20;backdrop-filter:blur(16px)}
.btab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:2px 0;-webkit-tap-highlight-color:transparent}
.btab-ico{font-size:20px;line-height:1}
.btab-lbl{font-size:9px;font-weight:700;letter-spacing:.02em}
.btab.on .btab-lbl{color:#F5B84C}
.btab:not(.on) .btab-lbl{color:rgba(255,255,255,.4)}
.btab:not(.on) .btab-ico{opacity:.5}
.btab-create{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;-webkit-tap-highlight-color:transparent;margin-top:-18px}
.btab-create-btn{width:50px;height:50px;border-radius:50%;background:linear-gradient(145deg,#a06010,#F5B84C 50%,#a06010);display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 16px rgba(200,130,20,.4),0 0 0 3px rgba(8,12,24,.97);transition:transform .18s,filter .15s}
.btab-create-btn:hover{transform:scale(1.08);filter:brightness(1.1)}
.btab-create-btn:active{transform:scale(.93)}
.btab-create-lbl{font-size:9px;font-weight:700;letter-spacing:.02em;color:#F5B84C;margin-top:1px}
`;

function BottomTabs({ current, onNav }: { current: string; onNav: (v: string) => void }) {
  return (
    <>
      <style>{TABS_CSS}</style>
      <div className="btabs">
        <div className={`btab${current==='dashboard'?' on':''}`} onClick={()=>onNav('dashboard')}>
          <div className="btab-ico">🏠</div>
          <div className="btab-lbl">Home</div>
        </div>
        <div className={`btab${current==='story-library'?' on':''}`} onClick={()=>onNav('story-library')}>
          <div className="btab-ico">📖</div>
          <div className="btab-lbl">Stories</div>
        </div>
        <div className="btab-create" onClick={()=>onNav('story-configure')}>
          <div className="btab-create-btn">✨</div>
          <div className="btab-create-lbl">Create</div>
        </div>
        <div className={`btab${current==='hatchery'?' on':''}`} onClick={()=>onNav('hatchery')}>
          <div className="btab-ico">🥚</div>
          <div className="btab-lbl">Hatchery</div>
        </div>
        <div className={`btab${current==='nightcard-library'?' on':''}`} onClick={()=>onNav('nightcard-library')}>
          <div className="btab-ico">🌙</div>
          <div className="btab-lbl">Night Cards</div>
        </div>
      </div>
    </>
  );
}

function AppInner() {
  const {
    user, view, setView, logout,
    selectedCharacter, setSelectedCharacter,
    selectedCharacters, setSelectedCharacters,
    ritualSeed, ritualMood, setRitualSeed,
    builderChoices,
    editingCharacter, setEditingCharacter,
    companionCreature, setCompanionCreature,
  } = useApp();

  const [preloadedBook,      setPreloadedBook]      = useState<any>(null);
  const [lastOnboardingResult, setLastOnboardingResult] = useState<OnboardingResult|null>(null);
  const [nightCardFilter,    setNightCardFilter]    = useState<string | undefined>(undefined);
  const [viewingCharacter,   setViewingCharacter]   = useState<Character | null>(null);

  // Check for shared story link on mount
  const [isSharedStory, setIsSharedStory] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('s')) setIsSharedStory(true);
  }, []);

  if (isSharedStory) return <SharedStoryViewer />;

  // Load companion creature for story builder
  useEffect(() => {
    if (!user || user.isGuest) return;
    import('./lib/hatchery').then(({ getAllHatchedCreatures }) => {
      getAllHatchedCreatures(user.id).then(creatures => {
        if (creatures.length > 0) setCompanionCreature(creatures[0]);
      });
    });
  }, [user]); // eslint-disable-line

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
      const nightCard: SavedNightCard = {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        userId: user.id,
        heroName: result.character.name,
        storyTitle: 'Night 1',
        characterIds: [result.character.id],
        headline: `The night ${result.creature.name} arrived.`,
        quote: result.dreamAnswer,
        memory_line: `${result.character.name} said it so quietly — like they already knew.`,
        emoji: result.creature.creatureEmoji,
        date: new Date().toISOString(),
        isOrigin: true,
        photo: result.photoDataUrl,
      };
      await saveNightCard(nightCard);
    } catch (e) { console.error('[onboarding] saveNightCard failed:', e); }

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

  // Legacy onboarding routes — redirect to dashboard
  if (view === 'onboarding-welcome') { setView('dashboard'); return null; }
  if (view === 'onboarding-tour')    { setView('dashboard'); return null; }
  if (view === 'onboarding-night0')  { setView('dashboard'); return null; }

  // New onboarding flow
  if (view === 'onboarding') return (
    <OnboardingFlow onComplete={handleOnboardingComplete} />
  );

  if (view === 'dashboard') {
    // Show ReadyStateDashboard if onboarding not complete
    if (user && !user.isGuest && !onboardingDone) {
      return <ReadyStateDashboard onBegin={() => setView('onboarding')} />;
    }
    return <UserDashboard onSignUp={goAuth} onReadStory={openSavedStory} />;
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

  if (view === 'hatchery') return <Hatchery user={user!} onBack={goDashboard} />;
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
    <div style={{paddingBottom:70}}>
    <StoryLibrary
      userId={user!.id}
      onBack={goDashboard}
      onReadStory={openSavedStory}
      onCreateStory={() => setView('ritual-starter')}
    />
    <BottomTabs current="story-library" onNav={v=>setView(v as any)} />
    </div>
  );

  if (view === 'nightcard-library') return (
    <div style={{paddingBottom:70}}>
    <NightCardLibrary
      userId={user!.id}
      onBack={goDashboard}
      filterCharacterId={nightCardFilter}
    />
    <BottomTabs current="nightcard-library" onNav={v=>setView(v as any)} />
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
