// Unit test for components/budgetStatus.ts. No network, no database.
//
//   npm run test:budget

import { budgetStatus, percentLabel } from "@/components/budgetStatus";

let failed = 0;
let total = 0;

function check(name: string, pass: boolean, detail: string) {
  total++;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
}

// [usedPct, elapsedPct, expected]
const statusCases: [number, number | null, ReturnType<typeof budgetStatus>][] = [
  [20, 25.8, "on-track"], // below the month's pace
  [25.8, 25.8, "on-track"], // exactly on pace
  [29.45, 25.8, "ahead"], // Site D seed on 9 October
  [99.9, 96.8, "ahead"],
  [100, 100, "over"], // budget reached counts as over
  [104.1, 93.5, "over"],
  [150, 100, "over"],
  [0.3, 3.2, "on-track"],
  [40, null, null], // unknown elapsed share: no status
];
const statusResults = statusCases.map(([u, e, want]) => ({ u, e, want, got: budgetStatus(u, e) }));
check(
  "budgetStatus: on track / ahead of pace / over budget / none",
  statusResults.every((r) => r.got === r.want),
  statusResults.map((r) => `${r.u}% vs ${r.e}% -> ${r.got}${r.got === r.want ? "" : ` (expected ${r.want})`}`).join(" | ")
);

const labelCases: [number, string][] = [
  [0, "0%"],
  [0.3, "<1%"],
  [0.99, "<1%"],
  [1, "1%"],
  [29.45, "29%"],
  [25.81, "26%"],
  [100.7, "101%"],
];
const labelResults = labelCases.map(([v, want]) => ({ v, want, got: percentLabel(v) }));
check(
  "percentLabel: <1% for tiny shares, rounded otherwise",
  labelResults.every((r) => r.got === r.want),
  labelResults.map((r) => `${r.v} -> ${r.got}${r.got === r.want ? "" : ` (expected ${r.want})`}`).join(" | ")
);

console.log(`\n${total - failed}/${total} PASS${failed ? `, ${failed} FAIL` : ""}`);
process.exitCode = failed ? 1 : 0;
