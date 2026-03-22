-- ============================================================================
-- Hatchery feature: active eggs + hatched creature collection
-- ============================================================================

-- ── Table 1: hatchery_eggs ──────────────────────────────────────────────────
-- One active egg per character. Stage is NOT stored here — it is derived by
-- counting night_cards rows for this character with date >= started_at.
-- When an egg hatches (stage 7), the row is deleted, a hatched_creatures row
-- is inserted, and a new egg row is created with week_number + 1.

create table hatchery_eggs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  character_id  uuid not null unique,   -- one active egg per character
  creature_type text not null,          -- e.g. 'Moon Bunny', 'Star Phoenix'
  creature_emoji text not null,         -- e.g. a rabbit emoji
  week_number   integer not null default 1,
  started_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ── Table 2: hatched_creatures ──────────────────────────────────────────────
-- Permanent collection. A character accumulates many creatures over time.

create table hatched_creatures (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  character_id      uuid not null,      -- not unique: many creatures per child
  name              text not null,       -- chosen by the child at hatch time
  creature_type     text not null,       -- e.g. 'Moon Bunny'
  creature_emoji    text not null,
  rarity            text not null check (rarity in ('common', 'rare', 'legendary')),
  week_number       integer not null,
  personality_traits text[] not null default '{}',  -- up to 4 traits
  favourite_quote   text,                -- best answer from that week
  hatched_at        timestamptz not null,
  created_at        timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

create index idx_hatchery_eggs_user      on hatchery_eggs (user_id);
create index idx_hatched_creatures_user   on hatched_creatures (user_id);
create index idx_hatched_creatures_char   on hatched_creatures (character_id);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Pattern: authenticated users can only read and write their own rows.

alter table hatchery_eggs enable row level security;
alter table hatched_creatures enable row level security;

-- hatchery_eggs policies
create policy "Users can view their own eggs"
  on hatchery_eggs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own eggs"
  on hatchery_eggs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own eggs"
  on hatchery_eggs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own eggs"
  on hatchery_eggs for delete
  using (auth.uid() = user_id);

-- hatched_creatures policies
create policy "Users can view their own creatures"
  on hatched_creatures for select
  using (auth.uid() = user_id);

create policy "Users can insert their own creatures"
  on hatched_creatures for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own creatures"
  on hatched_creatures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own creatures"
  on hatched_creatures for delete
  using (auth.uid() = user_id);
