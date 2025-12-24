-- Create canonical properties table and populate with the 40-square board (idempotent)
create table if not exists public.properties (
  property_index integer primary key,
  name text not null,
  type text not null,
  "group" text not null,
  price integer,
  rent integer[],
  house_cost integer
);

-- Add to realtime publication if present
do $$ begin
  if exists (select 1 from pg_class where relname = 'properties') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'properties') then
      alter publication supabase_realtime add table public.properties;
    end if;
  end if;
end$$;

-- Create a basic open RLS policy for prototype/demo
alter table public.properties enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'properties' and policyname = 'Enable all access for all users') then
    create policy "Enable all access for all users" on public.properties for all using (true) with check (true);
  end if;
end$$;

-- Upsert board entries (idempotent)
-- NOTE: rents are provided as integer arrays where applicable

INSERT INTO public.properties (property_index, name, type, "group", price, rent, house_cost) VALUES
(0, 'GO', 'corner', 'special', NULL, NULL, NULL),
(1, 'Gdynia', 'street', 'brown', 60, ARRAY[2,10,30,90,160,250], 50),
(2, 'Community Chest', 'chest', 'special', NULL, NULL, NULL),
(3, 'Taipei', 'street', 'brown', 60, ARRAY[4,20,60,180,320,450], 50),
(4, 'Income Tax', 'tax', 'special', NULL, NULL, NULL),
(5, 'Monopoly Rail', 'railroad', 'railroad', 200, ARRAY[25,50,100,200], NULL),
(6, 'Tokyo', 'street', 'lightBlue', 100, ARRAY[6,30,90,270,400,550], 50),
(7, 'Chance', 'chance', 'special', NULL, NULL, NULL),
(8, 'Barcelona', 'street', 'lightBlue', 100, ARRAY[6,30,90,270,400,550], 50),
(9, 'Athens', 'street', 'lightBlue', 120, ARRAY[8,40,100,300,450,600], 50),
(10, 'In Jail/Just Visiting', 'corner', 'special', NULL, NULL, NULL),
(11, 'Istanbul', 'street', 'pink', 140, ARRAY[10,50,150,450,625,750], 100),
(12, 'Solar Energy', 'utility', 'utility', 150, NULL, NULL),
(13, 'Kyiv', 'street', 'pink', 140, ARRAY[10,50,150,450,625,750], 100),
(14, 'Toronto', 'street', 'pink', 160, ARRAY[12,60,180,500,700,900], 100),
(15, 'Monopoly Air', 'railroad', 'railroad', 200, ARRAY[25,50,100,200], NULL),
(16, 'Rome', 'street', 'orange', 180, ARRAY[14,70,200,550,750,950], 100),
(17, 'Community Chest', 'chest', 'special', NULL, NULL, NULL),
(18, 'Shanghai', 'street', 'orange', 180, ARRAY[14,70,200,550,750,950], 100),
(19, 'Vancouver', 'street', 'orange', 200, ARRAY[16,80,220,600,800,1000], 100),
(20, 'Free Parking', 'corner', 'special', NULL, NULL, NULL),
(21, 'Sydney', 'street', 'red', 220, ARRAY[18,90,250,700,875,1050], 150),
(22, 'Chance', 'chance', 'special', NULL, NULL, NULL),
(23, 'New York', 'street', 'red', 220, ARRAY[18,90,250,700,875,1050], 150),
(24, 'London', 'street', 'red', 240, ARRAY[20,100,300,750,925,1100], 150),
(25, 'Monopoly Cruise', 'railroad', 'railroad', 200, ARRAY[25,50,100,200], NULL),
(26, 'Beijing', 'street', 'yellow', 260, ARRAY[22,110,330,800,975,1150], 150),
(27, 'Hong Kong', 'street', 'yellow', 260, ARRAY[22,110,330,800,975,1150], 150),
(28, 'Wind Energy', 'utility', 'utility', 150, NULL, NULL),
(29, 'Jerusalem', 'street', 'yellow', 280, ARRAY[24,120,360,850,1025,1200], 150),
(30, 'Go To Jail', 'corner', 'special', NULL, NULL, NULL),
(31, 'Paris', 'street', 'green', 300, ARRAY[26,130,390,900,1100,1275], 200),
(32, 'Belgrade', 'street', 'green', 300, ARRAY[26,130,390,900,1100,1275], 200),
(33, 'Community Chest', 'chest', 'special', NULL, NULL, NULL),
(34, 'Cape Town', 'street', 'green', 320, ARRAY[28,150,450,1000,1200,1400], 200),
(35, 'Monopoly Space', 'railroad', 'railroad', 200, ARRAY[25,50,100,200], NULL),
(36, 'Chance', 'chance', 'special', NULL, NULL, NULL),
(37, 'Riga', 'street', 'darkBlue', 350, ARRAY[35,175,500,1100,1300,1500], 200),
(38, 'Super Tax', 'tax', 'special', NULL, NULL, NULL),
(39, 'Montreal', 'street', 'darkBlue', 400, ARRAY[50,200,600,1400,1700,2000], 200)
ON CONFLICT (property_index) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  "group" = EXCLUDED."group",
  price = EXCLUDED.price,
  rent = EXCLUDED.rent,
  house_cost = EXCLUDED.house_cost;
