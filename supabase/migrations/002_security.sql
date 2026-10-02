-- 002_security.sql
-- Helper functions, RLS policies and triggers (Design Document, Section 3).
-- Requires 001_schema.sql: tables exist with RLS enabled and no policies.

-- ============================================================
-- 1. Helper functions (3.1)
-- ============================================================

CREATE FUNCTION public.get_my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE FUNCTION public.get_my_site_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT site_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 2. RLS policies (3.2)
-- ============================================================

-- sites ------------------------------------------------------

CREATE POLICY sites_select ON public.sites
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('energy_manager', 'direction') OR id = get_my_site_id());

CREATE POLICY sites_insert ON public.sites
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'direction' AND created_by = auth.uid());

CREATE POLICY sites_update ON public.sites
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'direction')
  WITH CHECK (get_my_role() = 'direction');

-- No DELETE policy: sites are archived through UPDATE on status.

-- readings ---------------------------------------------------

CREATE POLICY readings_select ON public.readings
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('energy_manager', 'direction') OR site_id = get_my_site_id());

CREATE POLICY readings_insert ON public.readings
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      get_my_role() = 'direction'
      OR (get_my_role() = 'site_manager' AND site_id = get_my_site_id())
    )
    AND created_by = auth.uid()
  );

CREATE POLICY readings_update ON public.readings
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'direction'
    OR (get_my_role() = 'site_manager' AND site_id = get_my_site_id())
  )
  WITH CHECK (
    (
      get_my_role() = 'direction'
      OR (get_my_role() = 'site_manager' AND site_id = get_my_site_id())
    )
    AND created_by = auth.uid()
  );

CREATE POLICY readings_delete ON public.readings
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'direction'
    OR (get_my_role() = 'site_manager' AND site_id = get_my_site_id())
  );

-- profiles ---------------------------------------------------

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_my_role() IN ('energy_manager', 'direction'));

-- Which columns may change is enforced by protect_profile_columns (3.3).
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_my_role() = 'direction')
  WITH CHECK (id = auth.uid() OR get_my_role() = 'direction');

CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (get_my_role() = 'direction');

-- No INSERT policy: rows are created by handle_new_user (3.4)
-- or by the server-side invite route (service-role key).

-- ai_summaries -----------------------------------------------

CREATE POLICY ai_summaries_select ON public.ai_summaries
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('energy_manager', 'direction') OR site_id = get_my_site_id());

CREATE POLICY ai_summaries_insert ON public.ai_summaries
  FOR INSERT TO authenticated
  WITH CHECK (
    (get_my_role() IN ('energy_manager', 'direction') OR site_id = get_my_site_id())
    AND created_by = auth.uid()
  );

CREATE POLICY ai_summaries_delete ON public.ai_summaries
  FOR DELETE TO authenticated
  USING (get_my_role() = 'direction');

-- No UPDATE policy: summaries are immutable.

-- ============================================================
-- 3. Protect profiles.role and profiles.site_id (3.3)
-- ============================================================

CREATE FUNCTION public.protect_profile_columns() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- auth.uid() is null for service-role calls and the SQL editor: not blocked.
  -- IS DISTINCT FROM (not <>) so a null role is treated as non-direction.
  IF auth.uid() IS NOT NULL
      AND get_my_role() IS DISTINCT FROM 'direction'
      AND (NEW.role IS DISTINCT FROM OLD.role
           OR NEW.site_id IS DISTINCT FROM OLD.site_id) THEN
    RAISE EXCEPTION 'Only direction can change role or site_id';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- ============================================================
-- 4. Create the profiles row at sign-up (3.4)
-- ============================================================

CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, site_id, full_name)
  VALUES (NEW.id, 'site_manager', NULL,
          NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
