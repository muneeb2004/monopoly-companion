-- Add jail_bail_amount to games table
ALTER TABLE IF EXISTS games
  ADD COLUMN IF NOT EXISTS jail_bail_amount integer DEFAULT 50;
