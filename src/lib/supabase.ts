import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient;
try {
  if (url && anon && anon.startsWith('eyJ')) {
    client = createClient(url, anon);
  } else {
    console.warn('Supabase key missing or invalid — running in local-only mode');
    client = null as any;
  }
} catch (e) {
  console.warn('Supabase init failed:', e);
  client = null as any;
}

export const supabase = client;
export const hasSupabase = !!client;
