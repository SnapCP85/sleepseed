-- SleepSeed Supabase Migrations
-- Run these in the Supabase SQL editor

-- 1. Atomic read count increment (fixes race condition)
CREATE OR REPLACE FUNCTION increment_read_count(story_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE stories SET read_count = read_count + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Index for library queries (if not already present)
CREATE INDEX IF NOT EXISTS idx_stories_public_slug ON stories (library_slug) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_stories_public_mood ON stories (mood) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_stories_public_vibe ON stories (vibe) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_stories_public_submitted ON stories (submitted_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_stories_public_reads ON stories (read_count DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_stories_bod ON stories (book_of_day_date) WHERE is_book_of_day = true;

-- 3. Full-text search index for future use
-- Requires pg_trgm extension for ilike performance:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_stories_title_trgm ON stories USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stories_hero_trgm ON stories USING gin (hero_name gin_trgm_ops);
