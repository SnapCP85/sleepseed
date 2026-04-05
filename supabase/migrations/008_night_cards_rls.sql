-- Night Cards: Enable RLS and add policies
-- Applied 2026-04-05

alter table night_cards enable row level security;

create policy "Users read own cards"
  on night_cards for select to authenticated
  using (auth.uid() = user_id::uuid);

create policy "Shared cards are publicly readable"
  on night_cards for select
  using (id in (select card_id from night_card_shares));

create policy "Users insert own cards"
  on night_cards for insert to authenticated
  with check (auth.uid() = user_id::uuid);

create policy "Users update own cards"
  on night_cards for update to authenticated
  using (auth.uid() = user_id::uuid);

create policy "Users delete own cards"
  on night_cards for delete to authenticated
  using (auth.uid() = user_id::uuid);

-- Note: family_shares RLS policies were already applied in a prior session.
