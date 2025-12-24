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

  -- Add rent_override check if missing
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_properties_rent_override_nonnegative') THEN
    ALTER TABLE public.game_properties
    ADD CONSTRAINT game_properties_rent_override_nonnegative CHECK (
      rent_override IS NULL OR (
        jsonb_typeof(rent_override) = 'array' AND
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(rent_override) AS x
          WHERE jsonb_typeof(x) <> 'number' OR (x)::numeric < 0
        )
      )
    );
  END IF;
END
$$;
