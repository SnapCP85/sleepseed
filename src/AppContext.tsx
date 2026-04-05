import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { User, AppView, Character, HatchedCreature } from './lib/types';
import { supabase } from './lib/supabase';
import { signOut as sbSignOut, getUserProfile } from './lib/storage';
import { migrateLocalStorageToSupabase } from './lib/migrateLocalStorage';

interface AppCtx {
  user: User | null;
  authLoading: boolean;
  view: AppView;
  setView: (v: AppView) => void;
  login: (u: User) => void;
  logout: () => void;
  selectedCharacter: Character | null;
  setSelectedCharacter: (c: Character | null) => void;
  selectedCharacters: Character[];
  setSelectedCharacters: (cs: Character[]) => void;
  ritualSeed: string;
  setRitualSeed: (s: string) => void;
  ritualMood: string;
  setRitualMood: (m: string) => void;
  editingCharacter: Character | null;
  setEditingCharacter: (c: Character | null) => void;
  pendingSaveCharacter: Partial<Character> | null;
  setPendingSaveCharacter: (c: Partial<Character> | null) => void;
  companionCreature: HatchedCreature | null;
  setCompanionCreature: (c: HatchedCreature | null) => void;
  libraryStorySlug: string | null;
  setLibraryStorySlug: (s: string | null) => void;
  isSubscribed: boolean;
  setIsSubscribed: (v: boolean) => void;
  refCode: string | null;
  setRefCode: (v: string | null) => void;
  activeJourneyId: string | null;
  setActiveJourneyId: (id: string | null) => void;
  activeChapterOutput: Record<string, unknown> | null;
  setActiveChapterOutput: (c: Record<string, unknown> | null) => void;
  activeCompletedBookId: string | null;
  setActiveCompletedBookId: (id: string | null) => void;
  activeSeriesId: string | null;
  setActiveSeriesId: (id: string | null) => void;
}

const Ctx = createContext<AppCtx>({} as AppCtx);

// Convert a Supabase user to the app's User shape
const toAppUser = (sbUser: any): User => ({
  id:           sbUser.id,
  email:        sbUser.email ?? '',
  passwordHash: '',                                          // not used with Supabase
  displayName:  sbUser.user_metadata?.display_name
                ?? sbUser.email?.split('@')[0]
                ?? 'Guest',
  createdAt:    sbUser.created_at,
  isGuest:      sbUser.is_anonymous ?? false,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user,                  setUserRaw]               = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  const setUser = (u: User | null) => { userRef.current = u; setUserRaw(u); };
  const [authLoading,           setAuthLoading]           = useState(true);
  const [view,                  setViewRaw]               = useState<AppView>('public');
  const viewRef = useRef<AppView>('public');
  const setView = (v: AppView) => { viewRef.current = v; setViewRaw(v); };
  const [selectedCharacter,     setSelectedCharacter]     = useState<Character | null>(null);
  const [selectedCharacters,    setSelectedCharacters]    = useState<Character[]>([]);
  const [ritualSeed,            setRitualSeed]            = useState<string>('');
  const [ritualMood,            setRitualMood]            = useState<string>('');
  const [editingCharacter,      setEditingCharacter]      = useState<Character | null>(null);
  const [pendingSaveCharacter,  setPendingSaveCharacter]  = useState<Partial<Character> | null>(null);
  const [companionCreature,    setCompanionCreature]    = useState<HatchedCreature | null>(null);
  const [libraryStorySlug,    setLibraryStorySlug]    = useState<string | null>(null);
  const [isSubscribed,        setIsSubscribed]        = useState(false);
  const [refCode,             setRefCode]             = useState<string | null>(null);
  const [activeJourneyId,     setActiveJourneyId]     = useState<string | null>(null);
  const [activeChapterOutput, setActiveChapterOutput] = useState<Record<string, unknown> | null>(null);
  const [activeCompletedBookId, setActiveCompletedBookId] = useState<string | null>(null);
  const [activeSeriesId,     setActiveSeriesId]     = useState<string | null>(null);

  const profileLoadedRef = useRef<string | null>(null);
  const migrationDoneRef = useRef<string | null>(null);

  const loadProfile = (userId: string) => {
    if (profileLoadedRef.current === userId) return;
    profileLoadedRef.current = userId;
    getUserProfile(userId).then(profile => {
      if (profile) {
        setIsSubscribed(profile.isSubscribed);
        setRefCode(profile.refCode);
      }
    }).catch(() => { profileLoadedRef.current = null; });
  };

  const runMigration = (userId: string) => {
    if (migrationDoneRef.current === userId) return;
    migrationDoneRef.current = userId;
    migrateLocalStorageToSupabase(userId).catch(e =>
      console.warn('[AppContext] Migration error:', e)
    );
  };

  const handlingRef = useRef(false);
  const handleSession = async (session: any, isInitial: boolean) => {
    // Prevent duplicate handling from overlapping auth events
    if (handlingRef.current && !isInitial) return;
    handlingRef.current = true;

    if (session?.user) {
      const u = toAppUser(session.user);
      if (!session.user.is_anonymous) {
        // Set user + view IMMEDIATELY so UI shows dashboard fast
        setUser(u);
        const params = new URLSearchParams(window.location.search);
        const isUrlDriven = params.get('view') === 'library' || params.get('library') || params.get('s') || params.get('story');
        if (!isUrlDriven) {
          if (isInitial || viewRef.current === 'public' || viewRef.current === 'auth') {
            setView('dashboard');
          }
        }
        setAuthLoading(false);
        // Load profile in background — don't block UI
        if (profileLoadedRef.current !== session.user.id) {
          profileLoadedRef.current = session.user.id;
          getUserProfile(session.user.id).then(profile => {
            if (profile) { setIsSubscribed(profile.isSubscribed); setRefCode(profile.refCode); }
          }).catch(() => { profileLoadedRef.current = null; });
          runMigration(session.user.id);
        }
      } else {
        setUser(u);
        if (viewRef.current === 'auth') setView('dashboard');
        setAuthLoading(false);
      }
    } else {
      setUser(null);
      setIsSubscribed(false);
      setRefCode(null);
      profileLoadedRef.current = null;
      migrationDoneRef.current = null;
      // Don't overwrite URL-driven views (shared stories, library) with 'public'
      const params = new URLSearchParams(window.location.search);
      const isUrlDriven = params.get('library') || params.get('s') || params.get('nc') || params.get('story');
      if (!isUrlDriven && (viewRef.current === 'public' || viewRef.current === 'auth' || viewRef.current === 'dashboard')) {
        setView('public');
      }
      setAuthLoading(false);
    }
    handlingRef.current = false;
  };

  useEffect(() => {
    // ── FAST PATH: Read cached session from localStorage instantly ──
    // Supabase stores its session in localStorage. Reading it directly
    // avoids the network round-trip of getSession() which can take 2-5s.
    try {
      const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (storageKey) {
        const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
        // Supabase stores session at different paths depending on version
        const cached = raw?.currentSession || raw;
        if (cached?.user) {
          handleSession(cached, true);
        }
      }
    } catch {}

    // ── FULL CHECK: Verify with Supabase (refreshes token if needed) ──
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only process if we got a definitive answer — don't log out on network errors
      // If there's no session but we had a cached one, Supabase may be refreshing the token
      if (session) {
        handleSession(session, true);
      } else if (!userRef.current) {
        // Only set to logged-out if we don't already have a cached user
        handleSession(null, true);
      }
    }).catch(() => {
      // Network error — keep existing state, don't log out
    });

    // Listen for changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'INITIAL_SESSION') return;
      // Don't log out on SIGNED_OUT if it might be a token refresh race
      if (_event === 'SIGNED_OUT' && userRef.current) {
        // Verify: re-check session before logging out
        supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
          if (!freshSession) handleSession(null, false);
        }).catch(() => {});
        return;
      }
      handleSession(session, false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (u: User) => {
    // Called directly after signUp/signIn — onAuthStateChange also fires
    // but this gives instant UI update without waiting for the event
    setUser(u);
    setView('dashboard');
  };

  const logout = async () => {
    await sbSignOut();
    setUser(null);
    setSelectedCharacter(null);
    setView('public');
  };

  return (
    <Ctx.Provider value={{
      user, authLoading, view, setView, login, logout,
      selectedCharacter, setSelectedCharacter,
      selectedCharacters, setSelectedCharacters,
      ritualSeed, setRitualSeed,
      ritualMood, setRitualMood,
      editingCharacter, setEditingCharacter,
      pendingSaveCharacter, setPendingSaveCharacter,
      companionCreature, setCompanionCreature,
      libraryStorySlug, setLibraryStorySlug,
      isSubscribed, setIsSubscribed,
      refCode, setRefCode,
      activeJourneyId, setActiveJourneyId,
      activeChapterOutput, setActiveChapterOutput,
      activeCompletedBookId, setActiveCompletedBookId,
      activeSeriesId, setActiveSeriesId,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => useContext(Ctx);
