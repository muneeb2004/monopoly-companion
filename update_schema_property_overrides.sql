-- Add per-game property override columns
ALTER TABLE IF EXISTS game_properties
  ADD COLUMN IF NOT EXISTS price_override integer,
  ADD COLUMN IF NOT EXISTS rent_override jsonb; -- stores array of rents if you want full override
