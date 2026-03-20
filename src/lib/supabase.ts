import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder'
);
export const hasSupabase = !!(url && anon);
