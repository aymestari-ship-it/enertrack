// Pure summary of the readings currently shown (already filtered by period and type).
// One result per energy type, in its own unit: different types are never added together.
import { periodRange, PERIODS, type CustomRange, type Period } from "@/components/readingFilters";
import { ENERGY_UNITS, type EnergyType } from "@/lib/energy";
import { formatDay, formatMonthUtc } from "@/lib/format";

export type SelectionReading = { energy_type: string; value: number; date: string };

export type TypeSummary = {
  type: EnergyType;
  unit: string;
  count: number; // readings of this type in the selection
  daysCovered: number; // distinct dates with a reading of this type
  total: number | null; // null when there is no reading: nothing is made up
  dailyAverage: number | null; // total / days covered
  peak: { value: number; date: string } | null; // highest reading; latest date on ties
};

export const TYPE_LABELS: Record<EnergyType, string> = {
  electricity: "Electricity",
  gas: "Gas",
  fuel: "Fuel",
  water: "Water",
};

export function summarizeSelection(
  readings: SelectionReading[],
  types: readonly EnergyType[]
): TypeSummary[] {
  return types.map((type) => {
    const own = readings.filter((r) => r.energy_type === type);
    const unit = ENERGY_UNITS[type];
    if (own.length === 0) {
      return { type, unit, count: 0, daysCovered: 0, total: null, dailyAverage: null, peak: null };
    }

    let total = 0;
    let peak = { value: Number(own[0].value), date: own[0].date };
    const dates = new Set<string>();
    for (const r of own) {
      const value = Number(r.value);
      total += value;
      dates.add(r.date);
      if (value > peak.value || (value === peak.value && r.date > peak.date)) {
        peak = { value, date: r.date };
      }
    }

    return {
      type,
      unit,
      count: own.length,
      daysCovered: dates.size,
      total,
      dailyAverage: total / dates.size,
      peak,
    };
  });
}

function monthOf(isoDate: string) {
  return formatMonthUtc(`${isoDate}T00:00:00Z`);
}

function listOf(words: string[]) {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return formatDay(Date.UTC(y, m - 1, d), true);
}

// "This month (October 2026) · Electricity and Gas"
// "Custom (Sep 15, 2026 – Oct 2, 2026) · all energy types"
export function describeSelection(
  period: Period,
  types: readonly EnergyType[],
  today: string,
  custom?: CustomRange | null
) {
  const range = periodRange(period, today);
  let when: string;
  if (period === "custom") {
    when = !custom
      ? "Custom"
      : custom.from === custom.to
        ? `Custom (${dayLabel(custom.from)})`
        : `Custom (${dayLabel(custom.from)} – ${dayLabel(custom.to)})`;
  } else if (period === "all") {
    when = "All readings";
  } else {
    const label = PERIODS.find((p) => p.id === period)?.label ?? "";
    const first = monthOf(range.from!);
    const last = period === "last-month" ? first : monthOf(today);
    if (first === last) {
      when = `${label} (${first})`;
    } else {
      // Same year: "August – October 2026"; otherwise "November 2025 – January 2026".
      const [firstMonth, firstYear] = first.split(" ");
      const lastYear = last.split(" ")[1];
      when = `${label} (${firstYear === lastYear ? firstMonth : first} – ${last})`;
    }
  }

  const what = types.length === Object.keys(ENERGY_UNITS).length
    ? "all energy types"
    : listOf(types.map((t) => TYPE_LABELS[t]));

  return `${when} · ${what}`;
}
