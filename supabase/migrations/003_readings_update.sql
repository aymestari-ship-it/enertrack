-- 003_readings_update.sql
-- Fixes readings_update (from 002): its WITH CHECK required created_by = auth.uid(),
-- which blocked Direction and a new Site Manager from editing existing readings.
-- Column immutability moves to a trigger: only value and date can change.

-- ============================================================
-- 1. readings_update: WITH CHECK identical to USING
-- ============================================================

DROP POLICY readings_update ON public.readings;

CREATE POLICY readings_update ON public.readings
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'direction'
    OR (get_my_role() = 'site_manager' AND site_id = get_my_site_id())
  )
  WITH CHECK (
    get_my_role() = 'direction'
    OR (get_my_role() = 'site_manager' AND site_id = get_my_site_id())
  );

-- ============================================================
-- 2. Only value and date are editable, for every role
-- ============================================================

CREATE FUNCTION public.protect_reading_columns() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.site_id IS DISTINCT FROM OLD.site_id
      OR NEW.energy_type IS DISTINCT FROM OLD.energy_type
      OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Only value and date can be changed on a reading';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER protect_reading_columns
  BEFORE UPDATE ON public.readings
  FOR EACH ROW EXECUTE FUNCTION public.protect_reading_columns();
