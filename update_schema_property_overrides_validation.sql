-- Sanitize existing data and add constraints for property overrides
-- Ensures price_override is non-negative when present
-- Ensures rent_override is an array of non-negative numbers when present

DO $$
BEGIN
  -- Sanitize invalid price overrides (set negative values to NULL)
  UPDATE public.game_properties
  SET price_override = NULL
  WHERE price_override IS NOT NULL AND price_override < 0;

  -- Sanitize rent_override: keep only numeric non-negative elements; set to NULL if none remain
  UPDATE public.game_properties
  SET rent_override = (
    SELECT CASE WHEN COUNT(elem) = 0 THEN NULL ELSE jsonb_agg(elem) END
    FROM (
      SELECT elem
      FROM jsonb_array_elements(rent_override) AS elem
      WHERE jsonb_typeof(elem) = 'number' AND (elem)::numeric >= 0
    ) sub
  )
  WHERE rent_override IS NOT NULL;

  -- Add price_override check if missing
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_properties_price_override_nonnegative') THEN
    ALTER TABLE public.game_properties
    ADD CONSTRAINT game_properties_price_override_nonnegative CHECK (price_override IS NULL OR price_override >= 0);
  END IF;

  -- Add helper function and rent_override check if missing (functions allowed in CHECK)
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rent_override_nonneg') THEN
    CREATE OR REPLACE FUNCTION public.rent_override_nonneg(rent jsonb) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE STRICT AS $fn$
    DECLARE
      rec jsonb;
    BEGIN
      IF rent IS NULL THEN
        RETURN TRUE;
      END IF;
      IF jsonb_typeof(rent) <> 'array' THEN
        RETURN FALSE;
      END IF;
      FOR rec IN SELECT * FROM jsonb_array_elements(rent) LOOP
        IF jsonb_typeof(rec) <> 'number' OR (rec)::numeric < 0 THEN
          RETURN FALSE;
        END IF;
      END LOOP;
      RETURN TRUE;
    END;
    $fn$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_properties_rent_override_nonnegative') THEN
    ALTER TABLE public.game_properties
    ADD CONSTRAINT game_properties_rent_override_nonnegative CHECK (public.rent_override_nonneg(rent_override));
  END IF;
END
$$;
