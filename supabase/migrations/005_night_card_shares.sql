-- Night Card sharing (grandparent share links)
create table if not exists night_card_shares (
  id uuid default gen_random_uuid() primary key,
  card_id text not null,
  share_token text not null unique,
  created_at timestamptz default now()
);

create index if not exists idx_night_card_shares_token on night_card_shares(share_token);

-- Allow public read access for shared cards (no auth needed)
alter table night_card_shares enable row level security;

create policy "Anyone can read shared card tokens"
  on night_card_shares for select
  using (true);

create policy "Authenticated users can create share tokens"
  on night_card_shares for insert
  to authenticated
  with check (true);
