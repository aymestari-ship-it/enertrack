-- seed.sql — FICTIONAL demo data. Run manually in the Supabase SQL Editor.
-- Data, not structure: deliberately outside migrations/.
-- Re-runnable: existing sites are skipped, existing readings are left untouched.
-- In the SQL Editor auth.uid() is NULL, so every created_by is set explicitly.

-- ============================================================
-- 1. Sites D and E (Site A, B and C are left as they are)
-- ============================================================

INSERT INTO public.sites (name, location, monthly_budget_kwh, status, created_by)
SELECT v.name, v.location, v.budget, 'active',
       (SELECT id FROM public.profiles WHERE role = 'direction' ORDER BY id LIMIT 1)
FROM (VALUES
  ('Site D', 'North industrial zone', 16000),
  ('Site E', 'Logistics hub',         10000)
) AS v (name, location, budget)
WHERE NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.name = v.name);

-- ============================================================
-- 2. Readings: 4 active sites x 4 energy types, one per day,
--    from 5 months ago until yesterday
-- ============================================================

WITH site_params (site_name, scale, seed) AS (
  -- Size of each site relative to the base values, and a phase for the variation.
  VALUES
    ('Site A', 1.0, 0.0),
    ('Site C', 0.8, 1.3),
    ('Site D', 1.2, 2.6),
    ('Site E', 0.7, 3.9)
),
seeded_sites AS (
  SELECT s.id, s.name, p.scale, p.seed,
         COALESCE(
           (SELECT pr.id FROM public.profiles pr
             WHERE pr.site_id = s.id AND pr.role = 'site_manager'),
           (SELECT pr.id FROM public.profiles pr
             WHERE pr.role = 'direction' ORDER BY pr.id LIMIT 1)
         ) AS author
  FROM public.sites s
  JOIN site_params p ON p.site_name = s.name
  WHERE s.status = 'active'
),
energy_params (energy_type, base, amplitude, seed) AS (
  -- Base value per daily reading in the canonical unit:
  -- electricity kWh, gas m3, fuel L, water m3.
  VALUES
    ('electricity', 1100.0 / 3, 0.08, 0.0),
    ('gas',           90.0 / 3, 0.10, 0.7),
    ('fuel',          60.0 / 3, 0.15, 1.4),
    ('water',         25.0 / 3, 0.10, 2.1)
),
reading_days AS (
  -- n counts days from a fixed epoch: a given date always gets the same variation,
  -- whatever day the script is run.
  SELECT d::date AS date,
         d::date - DATE '2020-01-01' AS n,
         EXTRACT(DOY FROM d)::int AS doy
  FROM generate_series(
         (current_date - INTERVAL '5 months')::timestamp,
         (current_date - 1)::timestamp,
         INTERVAL '1 day'
       ) AS d
)
INSERT INTO public.readings (site_id, energy_type, value, date, created_by)
SELECT
  s.id,
  e.energy_type,
  round((
    e.base * s.scale
    -- Seasonality: gas peaks mid-January (rises through autumn),
    -- electricity and water peak in summer (cooling, watering).
    * CASE e.energy_type
        WHEN 'gas'         THEN 1 + 0.5 * cos(2 * pi() * (d.doy - 15)  / 365.0)
        WHEN 'electricity' THEN 1 + 0.1 * cos(2 * pi() * (d.doy - 200) / 365.0)
        WHEN 'water'       THEN 1 + 0.2 * cos(2 * pi() * (d.doy - 200) / 365.0)
        ELSE 1
      END
    -- Deterministic variation: same date, site and type always give the same value.
    * (1 + e.amplitude * sin(d.n * 1.7 + s.seed + e.seed))
    -- Intended anomaly: Site D electricity +30% over the current month.
    * CASE
        WHEN s.name = 'Site D' AND e.energy_type = 'electricity'
             AND d.date >= date_trunc('month', current_date)::date
        THEN 1.3 ELSE 1
      END
  )::numeric, 1),
  d.date,
  s.author
FROM seeded_sites s
CROSS JOIN energy_params e
CROSS JOIN reading_days d
ON CONFLICT (site_id, energy_type, date) DO NOTHING;

-- ============================================================
-- No ai_summaries rows: they are generated live during the demo.
-- ============================================================

-- Checks (run separately):
--
-- Readings per site:
-- SELECT s.name, s.status, count(r.id) AS readings,
--        min(r.date) AS first_date, max(r.date) AS last_date
-- FROM public.sites s
-- LEFT JOIN public.readings r ON r.site_id = s.id
-- GROUP BY s.id, s.name, s.status
-- ORDER BY s.name;
--
-- Site D electricity per month (current month should be ~30% higher per day):
-- SELECT date_trunc('month', r.date)::date AS month,
--        count(*) AS readings,
--        sum(r.value) AS total_kwh,
--        round(sum(r.value) / count(*), 1) AS avg_kwh_per_reading
-- FROM public.readings r
-- JOIN public.sites s ON s.id = r.site_id
-- WHERE s.name = 'Site D' AND r.energy_type = 'electricity'
-- GROUP BY 1
-- ORDER BY 1;
