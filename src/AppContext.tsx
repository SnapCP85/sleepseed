import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AppView, Character, BuilderChoices } from './lib/types';
import { supabase } from './lib/supabase';
import { signOut as sbSignOut } from './lib/storage';

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
  builderChoices: BuilderChoices | null;
  setBuilderChoices: (c: BuilderChoices | null) => void;
  editingCharacter: Character | null;
  setEditingCharacter: (c: Character | null) => void;
  pendingSaveCharacter: Partial<Character> | null;
  setPendingSaveCharacter: (c: Partial<Character> | null) => void;
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
  const [view,                  setView]                  = useState<AppView>('public');
  const [selectedCharacter,     setSelectedCharacter]     = useState<Character | null>(null);
  const [selectedCharacters,    setSelectedCharacters]    = useState<Character[]>([]);
  const [ritualSeed,            setRitualSeed]            = useState<string>('');
  const [ritualMood,            setRitualMood]            = useState<string>('');
  const [builderChoices,        setBuilderChoices]        = useState<BuilderChoices | null>(null);
  const [editingCharacter,      setEditingCharacter]      = useState<Character | null>(null);
  const [pendingSaveCharacter,  setPendingSaveCharacter]  = useState<Partial<Character> | null>(null);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = toAppUser(session.user);
        setUser(u);
        setView('dashboard');
      }
      setAuthLoading(false);
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = toAppUser(session.user);
        setUser(u);
        if (view === 'public' || view === 'auth') setView('dashboard');
      } else {
        setUser(null);
        setView('public');
      }
      setAuthLoading(false);
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
      builderChoices, setBuilderChoices,
      editingCharacter, setEditingCharacter,
      pendingSaveCharacter, setPendingSaveCharacter,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => useContext(Ctx);
