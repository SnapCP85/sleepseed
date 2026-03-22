import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AppView, Character } from './lib/types';
import { getCurrentUser, setCurrentUser } from './lib/storage';

interface AppCtx {
  user: User | null;
  view: AppView;
  setView: (v: AppView) => void;
  login: (u: User) => void;
  logout: () => void;
  // Passed character for story builder pre-population
  selectedCharacter: Character | null;
  setSelectedCharacter: (c: Character | null) => void;
  // Character being edited
  editingCharacter: Character | null;
  setEditingCharacter: (c: Character | null) => void;
  // After story builder saves a character prompt
  pendingSaveCharacter: Partial<Character> | null;
  setPendingSaveCharacter: (c: Partial<Character> | null) => void;
}

const Ctx = createContext<AppCtx>({} as AppCtx);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('public');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [pendingSaveCharacter, setPendingSaveCharacter] = useState<Partial<Character> | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) { setUser(u); setView('dashboard'); }
  }, []);

  const login = (u: User) => {
    setCurrentUser(u);
    setUser(u);
    setView('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
    setUser(null);
    setSelectedCharacter(null);
    setView('public');
  };

  return (
    <Ctx.Provider value={{
      user, view, setView, login, logout,
      selectedCharacter, setSelectedCharacter,
      editingCharacter, setEditingCharacter,
      pendingSaveCharacter, setPendingSaveCharacter,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => useContext(Ctx);
