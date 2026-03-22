-- Hatchery eggs (one active egg per child character)
CREATE TABLE IF NOT EXISTS hatchery_eggs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id text NOT NULL,
  creature_type text NOT NULL,
  creature_emoji text NOT NULL DEFAULT '🥚',
  week_number  integer NOT NULL DEFAULT 1,
  started_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, character_id)
);

ALTER TABLE hatchery_eggs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eggs_select" ON hatchery_eggs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "eggs_insert" ON hatchery_eggs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eggs_update" ON hatchery_eggs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "eggs_delete" ON hatchery_eggs FOR DELETE USING (auth.uid() = user_id);

-- Hatched creatures
CREATE TABLE IF NOT EXISTS hatched_creatures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id      text NOT NULL,
  name              text NOT NULL,
  creature_type     text NOT NULL,
  creature_emoji    text NOT NULL,
  color             text NOT NULL DEFAULT '#F5B84C',
  rarity            text NOT NULL DEFAULT 'common'
                    CHECK (rarity IN ('common','rare','legendary')),
  personality_traits text[] NOT NULL DEFAULT '{}',
  dream_answer      text NOT NULL DEFAULT '',
  parent_secret     text NOT NULL DEFAULT '',
  photo_url         text,
  week_number       integer NOT NULL DEFAULT 1,
  hatched_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hatched_creatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creatures_select" ON hatched_creatures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "creatures_insert" ON hatched_creatures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "creatures_update" ON hatched_creatures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "creatures_delete" ON hatched_creatures FOR DELETE USING (auth.uid() = user_id);

-- Add missing columns to characters if not present
ALTER TABLE characters ADD COLUMN IF NOT EXISTS is_family boolean;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS parent_role text;
