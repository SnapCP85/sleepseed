export const BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_URL) ||
  'https://sleepseed-vercel.vercel.app';
