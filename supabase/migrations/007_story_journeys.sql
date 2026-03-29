-- ═══════════════════════════════════════════════════════════════════
-- SLEEPSEED v3 — StoryJourney System
-- One active journey per character. Journeys persist indefinitely.
-- ═══════════════════════════════════════════════════════════════════

-- story_journeys
-- character_id is text to match existing hatchery pattern
-- final_book_id is text to match stories.id type

create table if not exists story_journeys (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  character_id        text not null,
  creature_id         text not null,
  status              text not null default 'active'
                        check (status in ('active','completed','archived')),
  read_number         int not null default 1
                        check (read_number between 1 and 7),
  total_reads         int not null default 7,
  working_title       text not null,
  final_title         text,
  series_id           uuid,
  started_from        text not null default 'ritual'
                        check (started_from in ('ritual','create','series')),
  story_bible         jsonb not null default '{}'::jsonb,
  memory_bank         jsonb not null default '{
    "favoriteObjects": [],
    "recurringPlaces": [],
    "recurringPhrases": [],
    "emotionalMilestones": [],
    "relationshipMoments": [],
    "sensoryImages": []
  }'::jsonb,
  unresolved_threads  jsonb not null default '[]'::jsonb,
  resolved_threads    jsonb not null default '[]'::jsonb,
  final_book_id       text,
  spawned_egg_id      uuid,
  hatched_creature_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- Primary access pattern: get active journey for a specific character
create index if not exists idx_story_journeys_active_per_character
  on story_journeys(user_id, character_id, status)
  where status = 'active';

create index if not exists idx_story_journeys_user_id
  on story_journeys(user_id);

create index if not exists idx_story_journeys_status
  on story_journeys(status);

-- story_journey_chapters
-- Unique constraint ensures one chapter per read number per journey

create table if not exists story_journey_chapters (
  id                            uuid primary key default gen_random_uuid(),
  story_journey_id              uuid not null
                                  references story_journeys(id) on delete cascade,
  read_number                   int not null check (read_number between 1 and 7),
  chapter_title                 text not null,
  recap_text                    text not null default '',
  teaser                        text,
  summary                       text not null default '',
  story_id                      text,
  mood_input                    text,
  today_input                   text,
  specific_detail_used          text,
  characters_used               jsonb not null default '[]'::jsonb,
  memory_candidates             jsonb not null default '[]'::jsonb,
  unresolved_threads_after      jsonb not null default '[]'::jsonb,
  resolved_threads_in_chapter   jsonb not null default '[]'::jsonb,
  callbacks_used                jsonb not null default '[]'::jsonb,
  new_planted_details           jsonb not null default '[]'::jsonb,
  full_chapter_json             jsonb,
  created_at                    timestamptz not null default now(),
  unique(story_journey_id, read_number)
);

create index if not exists idx_chapters_journey_id
  on story_journey_chapters(story_journey_id);

-- story_series

create table if not exists story_series (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  character_id          text not null,
  title                 text not null,
  core_world            text not null default '',
  recurring_characters  jsonb not null default '[]'::jsonb,
  recurring_objects     jsonb not null default '[]'::jsonb,
  recurring_themes      jsonb not null default '[]'::jsonb,
  tone_profile          jsonb not null default '[]'::jsonb,
  book_ids              jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_story_series_user_id
  on story_series(user_id);

-- journey_summaries (Memory Reel data)

create table if not exists journey_summaries (
  id                    uuid primary key default gen_random_uuid(),
  story_journey_id      uuid not null
                          references story_journeys(id) on delete cascade
                          unique,
  user_id               uuid not null,
  character_id          text not null,
  summary_title         text not null,
  emotional_arc         text,
  highlights            jsonb not null default '[]'::jsonb,
  night_card_reel       jsonb not null default '[]'::jsonb,
  unlocked_character_id text,
  payload               jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists idx_journey_summaries_user_id
  on journey_summaries(user_id);

-- Row Level Security

alter table story_journeys enable row level security;
alter table story_journey_chapters enable row level security;
alter table story_series enable row level security;
alter table journey_summaries enable row level security;

create policy "Users can manage own journeys"
  on story_journeys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own chapters"
  on story_journey_chapters for all
  using (
    story_journey_id in (
      select id from story_journeys where user_id = auth.uid()
    )
  )
  with check (
    story_journey_id in (
      select id from story_journeys where user_id = auth.uid()
    )
  );

create policy "Users can manage own series"
  on story_series for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own summaries"
  on journey_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at trigger (matches existing project pattern)

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_story_journeys_updated_at on story_journeys;
create trigger update_story_journeys_updated_at
  before update on story_journeys
  for each row execute function update_updated_at_column();

drop trigger if exists update_story_series_updated_at on story_series;
create trigger update_story_series_updated_at
  before update on story_series
  for each row execute function update_updated_at_column();
