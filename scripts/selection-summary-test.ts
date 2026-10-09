// Unit test for components/selectionStats.ts. No network, no database.
//
//   npm run test:selection

import {
  describeSelection,
  summarizeSelection,
  type SelectionReading,
  type TypeSummary,
} from "@/components/selectionStats";

let failed = 0;
let total = 0;

function check(name: string, pass: boolean, detail: string) {
  total++;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}

function show(s: TypeSummary | undefined) {
  return s
    ? `${s.type}: count ${s.count}, days ${s.daysCovered}, total ${s.total}, avg ${s.dailyAverage}, peak ${s.peak ? `${s.peak.value}@${s.peak.date}` : null}, unit ${s.unit}`
    : "missing";
}

// 1. Empty period: no readings at all -> nothing computed, nothing made up.
{
  const [e, g] = summarizeSelection([], ["electricity", "gas"]);
  check(
    "Empty period: counts 0, all figures null",
    e.count === 0 && e.total === null && e.dailyAverage === null && e.peak === null &&
      g.count === 0 && g.total === null && g.unit === "m³",
    `${show(e)} | ${show(g)}`
  );
}

// 2. A single reading.
{
  const [e] = summarizeSelection([{ energy_type: "electricity", value: 120, date: "2026-10-02" }], ["electricity"]);
  check(
    "Single reading: total = average = peak",
    e.count === 1 && e.daysCovered === 1 && e.total === 120 && e.dailyAverage === 120 &&
      e.peak?.value === 120 && e.peak.date === "2026-10-02",
    show(e)
  );
}

// 3. Several readings, unsorted, values as strings (Supabase numeric), a tie on the peak.
{
  const readings = [
    { energy_type: "electricity", value: "140", date: "2026-10-02" },
    { energy_type: "electricity", value: "100", date: "2026-10-01" },
    { energy_type: "electricity", value: "60", date: "2026-10-07" },
    { energy_type: "electricity", value: "140", date: "2026-10-05" },
  ] as unknown as SelectionReading[];
  const [e] = summarizeSelection(readings, ["electricity"]);
  check(
    "Several readings: total 440, 4 days, average 110, peak 140 on the latest tie",
    e.count === 4 && e.daysCovered === 4 && e.total === 440 && e.dailyAverage === 110 &&
      e.peak?.value === 140 && e.peak.date === "2026-10-05",
    show(e)
  );
}

// 4. Average is per covered day, not per reading (two readings on the same date).
{
  const [e] = summarizeSelection(
    [
      { energy_type: "electricity", value: 30, date: "2026-10-01" },
      { energy_type: "electricity", value: 20, date: "2026-10-01" },
      { energy_type: "electricity", value: 50, date: "2026-10-03" },
    ],
    ["electricity"]
  );
  check("Average over distinct days covered", e.daysCovered === 2 && e.dailyAverage === 50, show(e));
}

// 5. Types are never mixed; each keeps its own unit; order follows `types`.
{
  const readings: SelectionReading[] = [
    { energy_type: "electricity", value: 300, date: "2026-10-01" },
    { energy_type: "gas", value: 12, date: "2026-10-01" },
    { energy_type: "gas", value: 8, date: "2026-10-02" },
    { energy_type: "water", value: 5, date: "2026-10-01" },
  ];
  const result = summarizeSelection(readings, ["gas", "electricity"]);
  const [g, e] = result;
  check(
    "No mixing between types, own unit, only selected types",
    result.length === 2 && g.type === "gas" && g.total === 20 && g.unit === "m³" &&
      e.type === "electricity" && e.total === 300 && e.unit === "kWh",
    `${show(g)} | ${show(e)}`
  );
}

// 6. A selected type with no reading in the period, next to one that has readings.
{
  const [e, f] = summarizeSelection([{ energy_type: "electricity", value: 10, date: "2026-10-01" }], ["electricity", "fuel"]);
  check("Type without readings stays empty", e.total === 10 && f.count === 0 && f.total === null && f.unit === "L", `${show(e)} | ${show(f)}`);
}

// 7. Context line.
{
  const cases: [Parameters<typeof describeSelection>, string][] = [
    [["this-month", ["electricity", "gas", "fuel", "water"], "2026-10-09"], "This month (October 2026) · all energy types"],
    [["last-month", ["electricity"], "2026-10-09"], "Last month (September 2026) · Electricity"],
    [["3-months", ["electricity", "gas"], "2026-10-09"], "3 months (August – October 2026) · Electricity and Gas"],
    [["3-months", ["gas", "fuel", "water"], "2026-01-15"], "3 months (November 2025 – January 2026) · Gas, Fuel and Water"],
    [["all", ["water"], "2026-10-09"], "All readings · Water"],
  ];
  const results = cases.map(([args, expected]) => ({ got: describeSelection(...args), expected }));
  check(
    "Context line: period + selected types",
    results.every((r) => r.got === r.expected),
    results.map((r) => (r.got === r.expected ? r.got : `"${r.got}" != "${r.expected}"`)).join(" | ")
  );
}

console.log(`\n${total - failed}/${total} PASS${failed ? `, ${failed} FAIL` : ""}`);
process.exitCode = failed ? 1 : 0;
