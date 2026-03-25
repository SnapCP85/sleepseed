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
  const [user,                  setUser]                  = useState<User | null>(null);
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
        const isUrlDriven = params.get('view') === 'library' || params.get('library') || params.get('s');
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
      setView('public');
      setAuthLoading(false);
    }
    handlingRef.current = false;
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session, true);
    });

    // Listen for changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip INITIAL_SESSION — we already handled it above
      if (_event === 'INITIAL_SESSION') return;
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
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => useContext(Ctx);
