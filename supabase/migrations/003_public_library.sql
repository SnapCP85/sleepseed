-- ============================================================================
-- 003_public_library.sql
-- Public Story Library: sharing, voting, favourites, attribution, tier support
-- ============================================================================


-- ============================================================================
-- 1. ADD COLUMNS TO stories TABLE
-- ============================================================================

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS is_public        boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_slug     text      UNIQUE,
  ADD COLUMN IF NOT EXISTS age_group        text,
  ADD COLUMN IF NOT EXISTS vibe             text,
  ADD COLUMN IF NOT EXISTS theme            text,
  ADD COLUMN IF NOT EXISTS mood             text,
  ADD COLUMN IF NOT EXISTS story_style      text,
  ADD COLUMN IF NOT EXISTS story_length     text,
  ADD COLUMN IF NOT EXISTS lessons          text[],
  ADD COLUMN IF NOT EXISTS submitted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS thumbs_up        integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbs_down      integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count       integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_count integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_staff_pick    boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_book_of_day   boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS book_of_day_date date;


-- ============================================================================
-- 2. CREATE story_votes TABLE
-- stories.id is text, not uuid — foreign keys must match
-- ============================================================================

CREATE TABLE IF NOT EXISTS story_votes (
  id          uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id    text      NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id     uuid      REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  text,
  vote        smallint  NOT NULL CHECK (vote IN (-1, 1)),
  vote_note   text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id),
  UNIQUE(story_id, session_id)
);


-- ============================================================================
-- 3. CREATE story_reads TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS story_reads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id          text        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reader_user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id        text,
  referrer_user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ref_code          text,
  converted_to_paid boolean     DEFAULT false,
  read_at           timestamptz DEFAULT now()
);


-- ============================================================================
-- 4. CREATE library_favourites TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS library_favourites (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id  text        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  saved_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, story_id)
);


-- ============================================================================
-- 5. UPDATE profiles TABLE
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_subscribed        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ref_code             text    UNIQUE,
  ADD COLUMN IF NOT EXISTS rewards_months_earned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_count     integer DEFAULT 0;


-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE story_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_favourites ENABLE ROW LEVEL SECURITY;

-- story_votes policies
CREATE POLICY "votes_select_all" ON story_votes
  FOR SELECT USING (true);

CREATE POLICY "votes_insert" ON story_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "votes_delete_own" ON story_votes
  FOR DELETE USING (auth.uid() = user_id);

-- story_reads policies
CREATE POLICY "reads_insert_all" ON story_reads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reads_select_own" ON story_reads
  FOR SELECT USING (
    auth.uid() = reader_user_id
    OR auth.uid() = referrer_user_id
  );

-- library_favourites policies
CREATE POLICY "favs_all_own" ON library_favourites
  FOR ALL USING (auth.uid() = user_id);

-- stories table: enable RLS and create policies
-- Verified via API: RLS was NOT enabled. stories.id is text type.
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_read_public_or_own" ON stories
  FOR SELECT USING (
    is_public = true OR auth.uid() = user_id
  );

CREATE POLICY "stories_insert_own" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_own" ON stories
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_own" ON stories
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stories_public
  ON stories(is_public, submitted_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_stories_slug
  ON stories(library_slug)
  WHERE library_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_book_of_day
  ON stories(book_of_day_date)
  WHERE is_book_of_day = true;

CREATE INDEX IF NOT EXISTS idx_stories_staff_pick
  ON stories(is_staff_pick)
  WHERE is_staff_pick = true;

CREATE INDEX IF NOT EXISTS idx_story_votes_story
  ON story_votes(story_id);

CREATE INDEX IF NOT EXISTS idx_story_reads_story
  ON story_reads(story_id);

CREATE INDEX IF NOT EXISTS idx_story_reads_ref
  ON story_reads(ref_code)
  WHERE ref_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_story_reads_session
  ON story_reads(session_id)
  WHERE session_id IS NOT NULL;
