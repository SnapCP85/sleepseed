// ─────────────────────────────────────────────────────────────────────────────
// AppLayout — Wrapper that renders content + BottomNavigation
// ─────────────────────────────────────────────────────────────────────────────
// Only used for views that should show the bottom nav.
// Adds bottom padding so content isn't hidden behind the fixed nav.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';

interface Props {
  currentTab: string;
  onNav: (viewId: string) => void;
  children: ReactNode;
}

export default function AppLayout({ currentTab, onNav, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#060912' }}>
      <div style={{ paddingBottom: 86 }}>
        {children}
      </div>
      <BottomNavigation current={currentTab} onNav={onNav} />
    </div>
  );
}
