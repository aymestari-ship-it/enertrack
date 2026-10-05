// Unit test for lib/ai/monthlyTotals.ts. No network, no database.
//
//   npm run test:totals

import { computeMonthlyTotals, type SummaryReading, type TypeTotals } from "@/lib/ai/monthlyTotals";

const DAY = 86_400_000;
const EPOCH = Date.UTC(2020, 0, 1);

let failed = 0;
let total = 0;

function check(name: string, pass: boolean, detail: string) {
  total++;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}

function iso(t: number) {
  return new Date(t).toISOString().slice(0, 10);
}

function doy(t: number) {
  return Math.floor((t - Date.UTC(new Date(t).getUTCFullYear(), 0, 1)) / DAY) + 1;
}

function find(byType: TypeTotals[], type: string) {
  return byType.find((t) => t.type === type);
}

function noNaN(facts: string) {
  return !/NaN|Infinity|undefined/.test(facts);
}

// Words glued together by a missing space in a template (e.g. "comparisonis").
function noGluedWords(facts: string) {
  return !/comparisonis|isposs|nocomparison|readingsthis/i.test(facts);
}

// Same formula as supabase/seed.sql for Site D (scale 1.2, seed 2.6), seed run on `runDay`:
// daily readings from 5 months ago until yesterday, +30% electricity this month.
function seedSiteD(runDay: number): SummaryReading[] {
  const now = new Date(runDay);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, now.getUTCDate());
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const types = [
    { type: "electricity", base: 1100 / 3, amp: 0.08, seed: 0.0, season: (d: number) => 1 + 0.1 * Math.cos((2 * Math.PI * (d - 200)) / 365) },
    { type: "gas", base: 90 / 3, amp: 0.1, seed: 0.7, season: (d: number) => 1 + 0.5 * Math.cos((2 * Math.PI * (d - 15)) / 365) },
    { type: "fuel", base: 60 / 3, amp: 0.15, seed: 1.4, season: () => 1 },
    { type: "water", base: 25 / 3, amp: 0.1, seed: 2.1, season: (d: number) => 1 + 0.2 * Math.cos((2 * Math.PI * (d - 200)) / 365) },
  ];
  const out: SummaryReading[] = [];
  for (let t = start; t <= runDay - DAY; t += DAY) {
    const n = (t - EPOCH) / DAY;
    for (const e of types) {
      const anomaly = e.type === "electricity" && t >= monthStart ? 1.3 : 1;
      const v = e.base * 1.2 * e.season(doy(t)) * (1 + e.amp * Math.sin(n * 1.7 + 2.6 + e.seed)) * anomaly;
      out.push({ energy_type: e.type, value: Math.round(v * 10) / 10, date: iso(t) });
    }
  }
  return out;
}

// Constant daily readings of one type between two dates (inclusive).
function daily(type: string, from: string, to: string, value: number): SummaryReading[] {
  const out: SummaryReading[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) {
    out.push({ energy_type: type, value, date: iso(t) });
  }
  return out;
}

// 1. Seed data, summary on 5 October: 4 covered days (1-4), anomaly visible.
{
  const r = computeMonthlyTotals(seedSiteD(Date.UTC(2026, 9, 5)), 16000, new Date(Date.UTC(2026, 9, 5)));
  const e = find(r.byType, "electricity");
  check(
    "Site D seed, now = 5 Oct: electricity up ~28%",
    !!e && e.coveredDays === 4 && e.changePct !== null && e.changePct >= 25 && e.changePct <= 31 && !e.lowCoverage && noNaN(r.facts),
    `covered ${e?.coveredDays} days, change ${e?.changePct?.toFixed(1)}%, lowCoverage ${e?.lowCoverage}, budget pace ${r.budgetPace?.usedPct.toFixed(0)}% used / ${r.budgetPace?.elapsedPct.toFixed(0)}% elapsed`
  );
}

// 2. Seed data, summary on 2 November: 1 covered day, still up but flagged as fragile.
{
  const r = computeMonthlyTotals(seedSiteD(Date.UTC(2026, 10, 2)), 16000, new Date(Date.UTC(2026, 10, 2)));
  const e = find(r.byType, "electricity");
  check(
    "Site D seed, now = 2 Nov: electricity up ~16%, low coverage flagged",
    !!e && e.coveredDays === 1 && e.changePct !== null && e.changePct >= 13 && e.changePct <= 19 &&
      e.lowCoverage && r.facts.includes("rests on very few days") && noNaN(r.facts),
    `covered ${e?.coveredDays} day, change ${e?.changePct?.toFixed(1)}%, lowCoverage ${e?.lowCoverage}`
  );
}

// 3. A reading dated today counts, and today is then a covered day.
{
  const readings = [
    ...daily("electricity", "2026-09-01", "2026-09-30", 100),
    ...daily("electricity", "2026-10-01", "2026-10-05", 100),
  ];
  const r = computeMonthlyTotals(readings, null, new Date(Date.UTC(2026, 9, 5, 15)));
  const e = find(r.byType, "electricity");
  check(
    "Reading dated today: counted, 5 covered days, flat trend",
    !!e && e.currentCount === 5 && e.coveredDays === 5 && e.currentDaily === 100 && e.changePct === 0 && noNaN(r.facts),
    `readings ${e?.currentCount}, covered ${e?.coveredDays}, daily ${e?.currentDaily}, change ${e?.changePct}%`
  );
}

// 4. A type with readings last month only: no figure computed for this month.
{
  const readings = [
    ...daily("electricity", "2026-09-01", "2026-10-04", 100),
    ...daily("gas", "2026-09-01", "2026-09-30", 30),
  ];
  const r = computeMonthlyTotals(readings, 16000, new Date(Date.UTC(2026, 9, 5)));
  const g = find(r.byType, "gas");
  const gasLines = r.facts.split("\n").filter((l) => l.includes("gas") || l.includes("m³/day"));
  check(
    "Type with no reading this month: stated, no daily average or change",
    !!g && g.currentCount === 0 && g.currentDaily === null && g.changePct === null && !g.lowCoverage &&
      r.facts.includes("gas (m³): no readings this month, so no comparison is possible; previous month: 900 m³ (30 readings).") &&
      noGluedWords(r.facts) &&
      !gasLines.some((l) => l.includes("Daily average")) && noNaN(r.facts),
    `currentDaily ${g?.currentDaily}, change ${g?.changePct}, facts: "${gasLines.join(" / ").trim()}"`
  );
}

// 4b. The mirror case: readings this month, none last month.
{
  const readings = daily("water", "2026-10-01", "2026-10-04", 8);
  const r = computeMonthlyTotals(readings, null, new Date(Date.UTC(2026, 9, 5)));
  const w = find(r.byType, "water");
  check(
    "Type with no reading last month: stated, no change computed",
    !!w && w.currentCount === 4 && w.previousDaily === null && w.changePct === null &&
      r.facts.includes("  No readings last month, so no comparison is possible.") &&
      noGluedWords(r.facts) && noNaN(r.facts),
    `previousDaily ${w?.previousDaily}, change ${w?.changePct}`
  );
}

// 5. A single covered day: low coverage flagged; budget pace uses 1 day.
{
  const readings = [
    ...daily("electricity", "2026-09-01", "2026-09-30", 100),
    ...daily("electricity", "2026-10-01", "2026-10-01", 130),
  ];
  const r = computeMonthlyTotals(readings, 3100, new Date(Date.UTC(2026, 9, 20)));
  const e = find(r.byType, "electricity");
  check(
    "Single covered day: +30% flagged as very few days, budget pace on 1 day",
    !!e && e.coveredDays === 1 && Math.round(e.changePct ?? NaN) === 30 && e.lowCoverage &&
      r.facts.includes("covers only 1 day so far") &&
      Math.round(r.budgetPace?.elapsedPct ?? NaN) === 3 && noNaN(r.facts),
    `covered ${e?.coveredDays}, change ${e?.changePct?.toFixed(1)}%, elapsed ${r.budgetPace?.elapsedPct.toFixed(1)}%`
  );
}

console.log(`\n${total - failed}/${total} PASS${failed ? `, ${failed} FAIL` : ""}`);
process.exitCode = failed ? 1 : 0;
