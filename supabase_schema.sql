-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Games Table
create table if not exists public.games (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('SETUP', 'ACTIVE', 'COMPLETED')) default 'SETUP',
  turn_count integer default 1,
  current_player_index integer default 0,
  dice_mode text check (dice_mode in ('DIGITAL', 'PHYSICAL')) default 'DIGITAL'
);

-- Ensure dice_mode column exists (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'games' and column_name = 'dice_mode') then
    alter table public.games add column dice_mode text check (dice_mode in ('DIGITAL', 'PHYSICAL')) default 'DIGITAL';
  end if;
end;
$$;

-- Players Table
create table if not exists public.players (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  name text not null,
  color text not null,
  token text default 'dog', -- Added token column
  balance integer default 1500,
  position integer default 0,
  is_jailed boolean default false,
  jail_turns integer default 0,
  get_out_of_jail_cards integer default 0,
  loans integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure token column exists (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'players' and column_name = 'token') then
    alter table public.players add column token text default 'dog';
  end if;
end;
$$;

-- Game Properties Table (State of properties for a game)
create table if not exists public.game_properties (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  property_index integer not null, -- matches the ID in INITIAL_PROPERTIES
  owner_id uuid references public.players(id) on delete set null,
  houses integer default 0,
  is_mortgaged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(game_id, property_index)
);

-- Transactions Table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  type text not null,
  amount integer not null,
  from_id uuid references public.players(id) on delete set null, -- NULL implies BANK
  to_id uuid references public.players(id) on delete set null,   -- NULL implies BANK
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trades Table
create table if not exists public.trades (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  sender_id uuid references public.players(id) on delete cascade not null,
  receiver_id uuid references public.players(id) on delete cascade not null,
  offered_money integer default 0,
  requested_money integer default 0,
  offered_properties integer[] default '{}', -- Array of property indices
  requested_properties integer[] default '{}', -- Array of property indices
  status text check (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')) default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime (Idempotent check)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games') then
    alter publication supabase_realtime add table public.games;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players') then
    alter publication supabase_realtime add table public.players;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_properties') then
    alter publication supabase_realtime add table public.game_properties;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions') then
    alter publication supabase_realtime add table public.transactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trades') then
    alter publication supabase_realtime add table public.trades;
  end if;
end;
$$;

-- RLS Policies (Open for prototype/demo purposes)
alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.game_properties enable row level security;
alter table public.transactions enable row level security;
alter table public.trades enable row level security;

-- Create policies if they don't exist (Idempotent check)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'games' and policyname = 'Enable all access for all users') then
    create policy "Enable all access for all users" on public.games for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'players' and policyname = 'Enable all access for all users') then
    create policy "Enable all access for all users" on public.players for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'game_properties' and policyname = 'Enable all access for all users') then
    create policy "Enable all access for all users" on public.game_properties for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'transactions' and policyname = 'Enable all access for all users') then
    create policy "Enable all access for all users" on public.transactions for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trades' and policyname = 'Enable all access for all users') then
    create policy "Enable all access for all users" on public.trades for all using (true) with check (true);
  end if;
end;
$$;