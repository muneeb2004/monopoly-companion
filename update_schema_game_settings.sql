-- Add game-level settings to games table
ALTER TABLE IF EXISTS games
  ADD COLUMN IF NOT EXISTS starting_money integer DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS price_multiplier real DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rent_multiplier real DEFAULT 1,
  ADD COLUMN IF NOT EXISTS group_house_rent_mode text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS show_group_house_totals boolean DEFAULT false;

-- Add constraint restricting allowed values for group_house_rent_mode
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'games_group_house_rent_mode_check') THEN
    ALTER TABLE games ADD CONSTRAINT games_group_house_rent_mode_check CHECK (group_house_rent_mode IN ('standard','groupTotal'));
  END IF;
END $$;
