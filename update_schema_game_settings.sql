-- Add game-level settings to games table
ALTER TABLE IF EXISTS games
  ADD COLUMN IF NOT EXISTS starting_money integer DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS price_multiplier real DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rent_multiplier real DEFAULT 1;
