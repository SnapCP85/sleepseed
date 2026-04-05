-- Run this in Supabase SQL Editor to create the story_shares table
-- This enables private story sharing via short token URLs

CREATE TABLE IF NOT EXISTS story_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id text NOT NULL,
  share_token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Allow anonymous reads (shared stories must be viewable without login)
ALTER TABLE story_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read story shares" ON story_shares
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create story shares" ON story_shares
  FOR INSERT WITH CHECK (true);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_story_shares_token ON story_shares (share_token);

-- Also ensure stories table allows anonymous SELECT for shared stories
-- (The existing RLS should already handle this, but verify)
-- If you get permission errors, run:
-- CREATE POLICY "Anyone can read public stories" ON stories
--   FOR SELECT USING (is_public = true);
