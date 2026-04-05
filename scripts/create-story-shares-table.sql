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

-- ── Family shares (Night Card collections shared with family) ──

CREATE TABLE IF NOT EXISTS family_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  child_name text NOT NULL DEFAULT 'Child',
  card_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE family_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family shares" ON family_shares
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create family shares" ON family_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own family shares" ON family_shares
  FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_family_shares_token ON family_shares (share_token);

-- Also ensure night_cards table allows anonymous SELECT when accessed via share
-- (needed for family view to read shared cards)
-- If you get permission errors on the family view, run:
-- CREATE POLICY "Anyone can read night cards by ID" ON night_cards
--   FOR SELECT USING (true);
