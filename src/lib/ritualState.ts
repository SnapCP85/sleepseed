// ─────────────────────────────────────────────────────────────────────────────
// Ritual State — 3-Night Onboarding Progression System
// ─────────────────────────────────────────────────────────────────────────────
// Tracks the child's progress through the 3-night DreamKeeper hatching ritual.
// Persisted to localStorage keyed by userId. Survives page refresh, app close,
// and multi-day gaps between sessions.
//
// Night 1: Welcome → Share → Story → Egg gifted → First crack
// Night 2: Return (memory callback) → Question → Story → Stronger cracks
// Night 3: Tonight is different → Story → Cinematic hatch → Born
// ─────────────────────────────────────────────────────────────────────────────

export type EggVisualState = 'idle' | 'cracked' | 'hatching' | 'hatched';

export interface RitualState {
  /** Which ritual night the user is currently on (1, 2, or 3) */
  currentNight: 1 | 2 | 3;

  /** Whether each night has been completed */
  night1Complete: boolean;
  night2Complete: boolean;
  night3Complete: boolean;

  /** Whether the full 3-night ritual is done */
  ritualComplete: boolean;

  /** Egg visual progression */
  eggState: EggVisualState;

  /** Night 1: What made you smile today? */
  smileAnswer?: string;

  /** Night 2: What are you really good at? */
  talentAnswer?: string;

  /** DreamKeeper name (from DreamKeeperOnboarding) */
  creatureName?: string;

  /** DreamKeeper emoji */
  creatureEmoji?: string;

  /** DreamKeeper color (hex) */
  creatureColor?: string;

  /** Child's name */
  childName?: string;

  /** Timestamps for each completed night */
  night1CompletedAt?: string;
  night2CompletedAt?: string;
  night3CompletedAt?: string;
}

// ── Storage key ─────────────────────────────────────────────────────────────

function storageKey(userId: string): string {
  return `sleepseed_ritual_${userId}`;
}

// ── Default state ───────────────────────────────────────────────────────────

export function createDefaultRitualState(): RitualState {
  return {
    currentNight: 1,
    night1Complete: false,
    night2Complete: false,
    night3Complete: false,
    ritualComplete: false,
    eggState: 'idle',
    childName: '',
    creatureName: '',
    creatureEmoji: '',
    creatureColor: '',
  };
}

// ── Read ────────────────────────────────────────────────────────────────────

export function getRitualState(userId: string): RitualState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as RitualState;
      // Defensive: ensure required fields exist
      return {
        ...createDefaultRitualState(),
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('[ritual] Failed to read ritual state:', e);
  }
  return createDefaultRitualState();
}

// ── Write ───────────────────────────────────────────────────────────────────

export function saveRitualState(userId: string, state: RitualState): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch (e) {
    console.error('[ritual] Failed to save ritual state:', e);
  }
}

// ── Night completion helpers ────────────────────────────────────────────────

export function completeNight1(userId: string, smileAnswer: string): RitualState {
  const state = getRitualState(userId);
  state.night1Complete = true;
  state.smileAnswer = smileAnswer;
  state.eggState = 'cracked';
  state.currentNight = 2;
  state.night1CompletedAt = new Date().toISOString();
  saveRitualState(userId, state);
  return state;
}

export function completeNight2(userId: string, talentAnswer: string): RitualState {
  const state = getRitualState(userId);
  state.night2Complete = true;
  state.talentAnswer = talentAnswer;
  state.eggState = 'hatching';
  state.currentNight = 3;
  state.night2CompletedAt = new Date().toISOString();
  saveRitualState(userId, state);
  return state;
}

export function completeNight3(userId: string): RitualState {
  const state = getRitualState(userId);
  state.night3Complete = true;
  state.ritualComplete = true;
  state.eggState = 'hatched';
  state.night3CompletedAt = new Date().toISOString();
  saveRitualState(userId, state);
  return state;
}

// ── Initialize ritual with DreamKeeper info ─────────────────────────────────

export function initRitualState(
  userId: string,
  childName: string,
  creatureName: string,
  creatureEmoji: string,
  creatureColor: string,
): RitualState {
  const existing = getRitualState(userId);

  // If ritual is already in progress or complete, don't reset
  if (existing.night1Complete || existing.ritualComplete) {
    // Just update creature/child info in case it changed
    existing.childName = childName;
    existing.creatureName = creatureName;
    existing.creatureEmoji = creatureEmoji;
    existing.creatureColor = creatureColor;
    saveRitualState(userId, existing);
    return existing;
  }

  const state: RitualState = {
    ...createDefaultRitualState(),
    childName,
    creatureName,
    creatureEmoji,
    creatureColor,
  };
  saveRitualState(userId, state);
  return state;
}

// ── Query helpers ───────────────────────────────────────────────────────────

export function isRitualComplete(userId: string): boolean {
  return getRitualState(userId).ritualComplete;
}

export function getCurrentRitualNight(userId: string): 1 | 2 | 3 {
  return getRitualState(userId).currentNight;
}
