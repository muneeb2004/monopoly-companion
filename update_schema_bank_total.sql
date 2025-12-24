-- Add bank_total to games to track the total funds available in the bank
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS bank_total integer DEFAULT 100000;

-- Backfill existing rows that may be NULL
UPDATE public.games SET bank_total = 100000 WHERE bank_total IS NULL;

-- Down migration (manual rollback):
-- ALTER TABLE public.games DROP COLUMN IF EXISTS bank_total;