import { ENERGY_TYPES, ENERGY_UNITS, isEnergyType, type EnergyType } from "@/lib/energy";
import { formatNumber } from "@/lib/format";

export type SummaryReading = { energy_type: string; value: number; date: string };

// Below this many covered days, the month-to-date comparison is flagged as fragile.
export const LOW_COVERAGE_DAYS = 3;

export type TypeTotals = {
  type: EnergyType;
  unit: string;
  current: number;
  currentCount: number;
  coveredDays: number; // day of month of the latest reading this month; 0 if none
  previous: number;
  previousCount: number;
  currentDaily: number | null; // null when there is nothing to divide
  previousDaily: number | null;
  changePct: number | null; // daily average, current vs previous month
  lowCoverage: boolean;
};

export type BudgetPace = {
  budgetKwh: number;
  usedPct: number;
  elapsedPct: number; // covered days / days in month
};

export type MonthlyTotals = {
  currentMonthStart: string; // YYYY-MM-DD
  previousMonthStart: string;
  usableCount: number;
  byType: TypeTotals[];
  budgetPace: BudgetPace | null; // electricity only; null without budget or readings
  facts: string; // plain-text figures sent to the LLM
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoDay(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

function monthName(time: number) {
  const d = new Date(time);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${Math.round(n)}%`;
}

function days(n: number) {
  return `${n} day${n === 1 ? "" : "s"}`;
}

// Month boundaries in UTC, matching the database's current_date.
export function monthBounds(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    currentStart: Date.UTC(y, m, 1),
    previousStart: Date.UTC(y, m - 1, 1),
    today: Date.UTC(y, m, now.getUTCDate()),
    daysInCurrent: new Date(Date.UTC(y, m + 1, 0)).getUTCDate(),
    daysInPrevious: new Date(Date.UTC(y, m, 0)).getUTCDate(),
  };
}

// First day of last month: the oldest reading the summary needs.
export function previousMonthStart(now = new Date()) {
  return isoDay(monthBounds(now).previousStart);
}

// All arithmetic happens here; the LLM only explains the resulting figures.
// The current month is measured over its covered days (up to the latest reading),
// not up to today: today's reading is often not entered yet.
export function computeMonthlyTotals(
  readings: SummaryReading[],
  monthlyBudgetKwh: number | null,
  now = new Date()
): MonthlyTotals {
  const b = monthBounds(now);
  const currentMonthStart = isoDay(b.currentStart);
  const previousMonthStart = isoDay(b.previousStart);
  const today = isoDay(b.today);

  type Acc = { current: number; cn: number; lastDay: number; previous: number; pn: number };
  const sums = new Map<EnergyType, Acc>();
  let usableCount = 0;

  for (const r of readings) {
    if (!isEnergyType(r.energy_type) || r.date < previousMonthStart || r.date > today) continue;
    const s = sums.get(r.energy_type) ?? { current: 0, cn: 0, lastDay: 0, previous: 0, pn: 0 };
    if (r.date >= currentMonthStart) {
      s.current += Number(r.value);
      s.cn++;
      s.lastDay = Math.max(s.lastDay, Number(r.date.slice(8, 10)));
    } else {
      s.previous += Number(r.value);
      s.pn++;
    }
    sums.set(r.energy_type, s);
    usableCount++;
  }

  const byType: TypeTotals[] = [];
  for (const type of ENERGY_TYPES) {
    const s = sums.get(type);
    if (!s) continue;
    const currentDaily = s.cn ? s.current / s.lastDay : null;
    const previousDaily = s.pn ? s.previous / b.daysInPrevious : null;
    byType.push({
      type,
      unit: ENERGY_UNITS[type],
      current: s.current,
      currentCount: s.cn,
      coveredDays: s.lastDay,
      previous: s.previous,
      previousCount: s.pn,
      currentDaily,
      previousDaily,
      changePct:
        currentDaily !== null && previousDaily ? ((currentDaily - previousDaily) / previousDaily) * 100 : null,
      lowCoverage: s.cn > 0 && s.lastDay < LOW_COVERAGE_DAYS,
    });
  }

  const electricity = byType.find((t) => t.type === "electricity");
  const budgetPace: BudgetPace | null =
    monthlyBudgetKwh && monthlyBudgetKwh > 0 && electricity?.currentCount
      ? {
          budgetKwh: monthlyBudgetKwh,
          usedPct: (electricity.current / monthlyBudgetKwh) * 100,
          elapsedPct: (electricity.coveredDays / b.daysInCurrent) * 100,
        }
      : null;

  const lines = [
    `Current month: ${monthName(b.currentStart)} (${b.daysInCurrent} days), in progress.`,
    `Previous month: ${monthName(b.previousStart)} (${b.daysInPrevious} days).`,
    "",
  ];

  for (const t of byType) {
    const previous = t.previousCount
      ? `${formatNumber(t.previous)} ${t.unit} (${t.previousCount} readings)`
      : "no readings";

    if (!t.currentCount) {
      lines.push(
        `- ${t.type} (${t.unit}): no readings this month, so no comparison is possible; previous month: ${previous}.`
      );
    } else {
      lines.push(
        `- ${t.type} (${t.unit}): current month: ${formatNumber(t.current)} ${t.unit} over ${days(t.coveredDays)} covered (${t.currentCount} readings); previous month: ${previous}.`
      );
      if (t.currentDaily !== null && t.previousDaily !== null) {
        const change = t.changePct !== null ? ` (${pct(t.changePct)})` : "";
        lines.push(
          `  Daily average: ${formatNumber(t.currentDaily)} ${t.unit}/day this month vs ${formatNumber(t.previousDaily)} ${t.unit}/day last month${change}.`
        );
      } else {
        lines.push("  No readings last month, so no comparison is possible.");
      }
      if (t.lowCoverage) {
        lines.push(
          `  Caution: this month covers only ${days(t.coveredDays)} so far; the comparison rests on very few days.`
        );
      }
    }

    if (t.type === "electricity") {
      if (!monthlyBudgetKwh || monthlyBudgetKwh <= 0) {
        lines.push("  No monthly electricity budget is set for this site.");
      } else if (budgetPace) {
        lines.push(
          `  Monthly electricity budget: ${formatNumber(budgetPace.budgetKwh)} kWh; ${Math.round(budgetPace.usedPct)}% used after ${days(t.coveredDays)} covered (${Math.round(budgetPace.elapsedPct)}% of the month).`
        );
      } else {
        lines.push(
          `  Monthly electricity budget: ${formatNumber(monthlyBudgetKwh)} kWh; no readings this month, so budget pace cannot be assessed.`
        );
      }
    }
  }

  return { currentMonthStart, previousMonthStart, usableCount, byType, budgetPace, facts: lines.join("\n") };
}
