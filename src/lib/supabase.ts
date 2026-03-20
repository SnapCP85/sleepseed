import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth will not work');
}

export const supabase = url && anon
  ? createClient(url, anon)
  : createClient('https://placeholder.supabase.co', 'placeholder');
