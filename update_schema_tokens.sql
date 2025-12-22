
-- Add token column to players table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'players' and column_name = 'token') then
    alter table public.players add column token text default 'dog';
  end if;
end;
$$;
