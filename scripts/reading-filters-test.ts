// Unit test for components/readingFilters.ts (custom period). No network, no database.
//
//   npm run test:filters

import { customRange, inPeriod } from "@/components/readingFilters";

let failed = 0;
let total = 0;

function check(name: string, pass: boolean, detail: string) {
  total++;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}

const DATES = ["2026-09-14", "2026-09-15", "2026-09-19", "2026-10-01", "2026-10-02", "2026-10-03"];

function select(from: string, to: string) {
  const r = customRange(from, to);
  return r.ok ? DATES.filter((d) => inPeriod(d, r.range)) : null;
}

// 1. Both bounds are included.
{
  const got = select("2026-09-15", "2026-10-02");
  check(
    "Bounds included (From and To days are kept)",
    JSON.stringify(got) === JSON.stringify(["2026-09-15", "2026-09-19", "2026-10-01", "2026-10-02"]),
    `2026-09-15 → 2026-10-02: ${got?.join(", ")}`
  );
}

// 2. From = To selects exactly that day.
{
  const got = select("2026-10-01", "2026-10-01");
  check("From = To selects that single day", JSON.stringify(got) === JSON.stringify(["2026-10-01"]), `${got?.join(", ")}`);
}

// 3. A valid range with no data returns nothing (no error).
{
  const r = customRange("2025-01-01", "2025-01-31");
  const got = select("2025-01-01", "2025-01-31");
  check("Range outside the data: valid, empty", r.ok && got?.length === 0, `ok=${r.ok}, readings=${got?.length}`);
}

// 4. From > To is refused with a message.
{
  const r = customRange("2026-10-02", "2026-09-15");
  check(
    "From > To: refused with a clear message",
    !r.ok && r.error === "The start date must be on or before the end date.",
    r.ok ? "accepted (wrong)" : r.error
  );
}

// 5. Empty or impossible dates are refused.
{
  const empty = customRange("", "2026-10-02");
  const bad = customRange("2026-02-30", "2026-03-01");
  check(
    "Missing or impossible date: refused",
    !empty.ok && !bad.ok,
    `empty: ${empty.ok ? "accepted" : empty.error} | 2026-02-30: ${bad.ok ? "accepted" : bad.error}`
  );
}

// 6. To at the end of a month / year: the next day is computed in UTC.
{
  const r = customRange("2026-12-31", "2026-12-31");
  check(
    "To on 31 December: range ends on 1 January (exclusive)",
    r.ok && r.range.to === "2027-01-01" && inPeriod("2026-12-31", r.range) && !inPeriod("2027-01-01", r.range),
    r.ok ? `[${r.range.from}, ${r.range.to})` : r.error
  );
}

console.log(`\n${total - failed}/${total} PASS${failed ? `, ${failed} FAIL` : ""}`);
process.exitCode = failed ? 1 : 0;
