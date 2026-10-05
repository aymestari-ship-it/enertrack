import { ENERGY_TYPES, ENERGY_UNITS, isEnergyType, type EnergyType } from "@/lib/energy";

export type SummaryReading = { energy_type: string; value: number; date: string };

export type MonthlyTotals = {
  currentMonthStart: string; // YYYY-MM-DD
  previousMonthStart: string;
  usableCount: number;
  facts: string; // plain-text figures sent to the LLM
};

const MONTH_FORMAT = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });

function isoDay(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

function fmt(n: number) {
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${Math.round(n)}%`;
}

// Month boundaries in UTC, matching the database's current_date.
export function monthBounds(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    currentStart: Date.UTC(y, m, 1),
    previousStart: Date.UTC(y, m - 1, 1),
    daysElapsed: now.getUTCDate(),
    daysInCurrent: new Date(Date.UTC(y, m + 1, 0)).getUTCDate(),
    daysInPrevious: new Date(Date.UTC(y, m, 0)).getUTCDate(),
  };
}

// First day of last month: the oldest reading the summary needs.
export function previousMonthStart(now = new Date()) {
  return isoDay(monthBounds(now).previousStart);
}

// All arithmetic happens here; the LLM only explains the resulting figures.
export function computeMonthlyTotals(
  readings: SummaryReading[],
  monthlyBudgetKwh: number | null,
  now = new Date()
): MonthlyTotals {
  const b = monthBounds(now);
  const currentMonthStart = isoDay(b.currentStart);
  const previousMonthStart = isoDay(b.previousStart);

  const sums = new Map<EnergyType, { current: number; previous: number; cn: number; pn: number }>();
  let usableCount = 0;

  for (const r of readings) {
    if (!isEnergyType(r.energy_type) || r.date < previousMonthStart) continue;
    const s = sums.get(r.energy_type) ?? { current: 0, previous: 0, cn: 0, pn: 0 };
    if (r.date >= currentMonthStart) {
      s.current += Number(r.value);
      s.cn++;
    } else {
      s.previous += Number(r.value);
      s.pn++;
    }
    sums.set(r.energy_type, s);
    usableCount++;
  }

  const lines = [
    `Current month: ${MONTH_FORMAT.format(b.currentStart)}, month to date (day ${b.daysElapsed} of ${b.daysInCurrent}).`,
    `Previous month: ${MONTH_FORMAT.format(b.previousStart)} (${b.daysInPrevious} days).`,
    "",
  ];

  for (const type of ENERGY_TYPES) {
    const s = sums.get(type);
    if (!s) continue;
    const unit = ENERGY_UNITS[type];
    const current = s.cn
      ? `${fmt(s.current)} ${unit} month to date (${s.cn} readings)`
      : "no readings";
    const previous = s.pn ? `${fmt(s.previous)} ${unit} (${s.pn} readings)` : "no readings";
    lines.push(`- ${type} (${unit}): current month: ${current}; previous month: ${previous}.`);

    // Daily averages make a partial month comparable to a full one.
    if (s.cn && s.pn) {
      const curDaily = s.current / b.daysElapsed;
      const prevDaily = s.previous / b.daysInPrevious;
      const change = prevDaily > 0 ? ` (${pct(((curDaily - prevDaily) / prevDaily) * 100)})` : "";
      lines.push(
        `  Daily average: ${fmt(curDaily)} ${unit}/day this month vs ${fmt(prevDaily)} ${unit}/day last month${change}.`
      );
    }

    if (type === "electricity") {
      if (monthlyBudgetKwh && monthlyBudgetKwh > 0) {
        const used = (s.current / monthlyBudgetKwh) * 100;
        const elapsed = (b.daysElapsed / b.daysInCurrent) * 100;
        lines.push(
          `  Monthly electricity budget: ${fmt(monthlyBudgetKwh)} kWh; ${Math.round(used)}% used with ${Math.round(elapsed)}% of the month elapsed.`
        );
      } else {
        lines.push("  No monthly electricity budget is set for this site.");
      }
    }
  }

  return { currentMonthStart, previousMonthStart, usableCount, facts: lines.join("\n") };
}
