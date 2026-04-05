// ─────────────────────────────────────────────────────────────────────────────
// Demo Mode — Activated via ?demo=true
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_USER_ID = '71d31ef2-391b-4bb3-9060-b856560e5739';
export const DEMO_EMAIL = 'demo@sleepseed.app';
export const DEMO_PASSWORD = 'SleepSeed2026!';

/** Check if demo mode is active */
export function isDemoMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('demo') === 'true'
      || sessionStorage.getItem('sleepseed_demo') === '1';
  } catch { return false; }
}

/** Persist demo flag for the session */
export function activateDemo(): void {
  try { sessionStorage.setItem('sleepseed_demo', '1'); } catch {}
}

/** Clear demo flag */
export function deactivateDemo(): void {
  try { sessionStorage.removeItem('sleepseed_demo'); } catch {}
}

/** Set all localStorage flags needed for a fully onboarded demo user */
export function setDemoLocalStorage(userId: string): void {
  try {
    localStorage.setItem(`sleepseed_parent_setup_${userId}`, '1');
    localStorage.setItem(`sleepseed_onboarding_${userId}`, '1');
    localStorage.setItem(`sleepseed_ritual_complete_${userId}`, '1');
    localStorage.setItem(`sleepseed_ritual_${userId}`, JSON.stringify({
      currentNight: 3,
      night1Complete: true,
      night2Complete: true,
      night3Complete: true,
      ritualComplete: true,
      eggState: 'hatched',
      smileAnswer: 'when Moonlight looks at me like she knows',
      talentAnswer: 'noticing things nobody else notices',
      creatureName: 'Moonlight',
      creatureEmoji: '🦉',
      creatureColor: '#9A7FD4',
      childName: 'Adina',
    }));
  } catch {}
}

/** Reset demo to clean state — only clears DEMO user data, not other accounts */
export function resetDemo(): void {
  deactivateDemo();
  // Only clear localStorage keys for the demo user ID — never touch other accounts
  const DEMO_UID = '71d31ef2-391b-4bb3-9060-b856560e5739';
  try {
    const keys = Object.keys(localStorage).filter(k =>
      k.includes(DEMO_UID) || k === 'sleepseed_demo'
    );
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
  window.location.href = window.location.pathname + '?demo=true';
}

/** Keyboard shortcut listener for demo reset (Ctrl+Shift+R) */
export function initDemoShortcuts(): void {
  if (!isDemoMode()) return;
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      resetDemo();
    }
  });
}
