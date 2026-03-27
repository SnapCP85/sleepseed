// ── Bedtime Reminder ──
// Uses Browser Notifications API + localStorage persistence.
// Works when the app/PWA tab is open.

const LS_KEY = (userId: string) => `ss_bedtime_${userId}`;

export interface BedtimeSettings {
  enabled: boolean;
  time: string; // "HH:MM" 24h format
  lastFiredDate?: string; // "YYYY-MM-DD" to prevent double-fire
}

export function getBedtimeSettings(userId: string): BedtimeSettings {
  try {
    const raw = localStorage.getItem(LS_KEY(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, time: '19:30' };
}

export function saveBedtimeSettings(userId: string, settings: BedtimeSettings): void {
  try { localStorage.setItem(LS_KEY(userId), JSON.stringify(settings)); } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function fireBedtimeNotification(childName: string): void {
  if (!canNotify()) return;
  try {
    new Notification('Bedtime with SleepSeed 🌙', {
      body: `It's story time! ${childName} is waiting for tonight's adventure.`,
      icon: '/favicon.svg',
      tag: 'bedtime-reminder',
      requireInteraction: true,
    });
  } catch {
    // Safari may not support Notification constructor in some contexts
  }
}

// Call this from a setInterval in the dashboard.
// Returns true if the notification was fired this tick.
export function checkBedtimeReminder(userId: string, childName: string): boolean {
  const settings = getBedtimeSettings(userId);
  if (!settings.enabled) return false;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Already fired today
  if (settings.lastFiredDate === todayStr) return false;

  const [h, m] = settings.time.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const targetMins = h * 60 + m;

  // Fire if we're within 1 minute of the target time
  if (nowMins >= targetMins && nowMins <= targetMins + 1) {
    fireBedtimeNotification(childName);
    saveBedtimeSettings(userId, { ...settings, lastFiredDate: todayStr });
    return true;
  }

  return false;
}
