-- 001_schema.sql
-- Tables and constraints (Design Document, Section 1).
-- RLS is enabled on every table with no policy: all client access is denied
-- until 002_security.sql adds the policies.

-- ============================================================
-- profiles
-- ============================================================
-- Created before sites because sites.created_by references it;
-- the profiles.site_id foreign key is added once sites exists.

CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'site_manager'
             CHECK (role IN ('site_manager', 'energy_manager', 'direction')),
  site_id    uuid,
  full_name  text
);

-- ============================================================
-- sites
-- ============================================================

CREATE TABLE public.sites (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  location            text,
  monthly_budget_kwh  numeric,
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'archived')),
  created_by          uuid DEFAULT auth.uid() REFERENCES public.profiles (id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES public.sites (id);

-- 1 site = 1 Site Manager
CREATE UNIQUE INDEX one_manager_per_site
  ON public.profiles (site_id)
  WHERE role = 'site_manager' AND site_id IS NOT NULL;

-- ============================================================
-- readings
-- ============================================================
-- Canonical units: electricity kWh, gas m³, fuel L, water m³.

CREATE TABLE public.readings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      uuid NOT NULL REFERENCES public.sites (id) ON DELETE RESTRICT,
  energy_type  text NOT NULL
               CHECK (energy_type IN ('electricity', 'gas', 'fuel', 'water')),
  value        numeric NOT NULL CHECK (value >= 0),
  date         date NOT NULL CHECK (date <= current_date),
  created_by   uuid DEFAULT auth.uid() REFERENCES public.profiles (id),
  UNIQUE (site_id, energy_type, date)
);

CREATE INDEX readings_site_date_idx ON public.readings (site_id, date);

-- ============================================================
-- ai_summaries
-- ============================================================

CREATE TABLE public.ai_summaries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid NOT NULL REFERENCES public.sites (id) ON DELETE RESTRICT,
  summary_text  text NOT NULL,
  created_by    uuid DEFAULT auth.uid() REFERENCES public.profiles (id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security (policies in 002_security.sql)
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
