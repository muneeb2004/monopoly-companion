-- Add bank_low_threshold to games so the low-bank threshold is configurable
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS bank_low_threshold integer DEFAULT 10000;

-- Backfill existing rows that may be NULL
UPDATE public.games SET bank_low_threshold = 10000 WHERE bank_low_threshold IS NULL;

-- Down migration (manual rollback):
-- ALTER TABLE public.games DROP COLUMN IF EXISTS bank_low_threshold;