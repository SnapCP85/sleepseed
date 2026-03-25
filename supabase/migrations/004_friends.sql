-- ============================================================================
-- 004_friends.sql
-- Friends system: invite-link friendships + story sharing
-- ============================================================================

-- 1. Friends table (mutual friendship via invite link)
CREATE TABLE IF NOT EXISTS friends (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK (user_a <> user_b)
);

-- 2. Shared stories table
CREATE TABLE IF NOT EXISTS shared_stories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id   text        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  message    text,
  shared_at  timestamptz DEFAULT now(),
  read       boolean     DEFAULT false
);

-- 3. RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_stories ENABLE ROW LEVEL SECURITY;

-- Friends: can see and create friendships you're part of
CREATE POLICY "friends_select_own" ON friends
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "friends_insert" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "friends_delete_own" ON friends
  FOR DELETE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Shared stories: can see stories shared to/from you
CREATE POLICY "shared_select_own" ON shared_stories
  FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);

CREATE POLICY "shared_insert" ON shared_stories
  FOR INSERT WITH CHECK (auth.uid() = from_user);

CREATE POLICY "shared_update_own" ON shared_stories
  FOR UPDATE USING (auth.uid() = to_user);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_a ON friends(user_a);
CREATE INDEX IF NOT EXISTS idx_friends_user_b ON friends(user_b);
CREATE INDEX IF NOT EXISTS idx_shared_stories_to ON shared_stories(to_user, read, shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_stories_from ON shared_stories(from_user);
