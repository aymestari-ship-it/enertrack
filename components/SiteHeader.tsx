import type { ReactNode } from "react";
import type { Reading } from "@/components/ReadingsTable";
import { BADGE_BRAND, BADGE_NEUTRAL, CARD, EYEBROW, PAGE_SUBTITLE, PAGE_TITLE } from "@/components/ui/styles";
import { computeMonthlyTotals } from "@/lib/ai/monthlyTotals";
import { ENERGY_UNITS, isEnergyType } from "@/lib/energy";
import { formatNumber } from "@/lib/format";

type Stat = { label: string; value: string; hint?: string };

// Display only: a small non-zero share reads "<1%" rather than "0%".
function usedLabel(pct: number) {
  return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
}

// Key figures from calculations the app already makes: monthly totals and budget pace
// (lib/ai/monthlyTotals.ts, also used by the AI summary) and the latest reading.
// A figure is only shown when its data exists.
function keyFigures(readings: Reading[], budgetKwh: number | null): Stat[] {
  const stats: Stat[] = [];
  const totals = computeMonthlyTotals(readings, budgetKwh);
  const electricity = totals.byType.find((t) => t.type === "electricity");

  if (electricity?.currentCount) {
    stats.push({
      label: "Electricity this month",
      value: `${formatNumber(electricity.current)} kWh`,
      hint: `${electricity.coveredDays} day${electricity.coveredDays === 1 ? "" : "s"} covered`,
    });
  }
  if (budgetKwh && budgetKwh > 0) {
    stats.push({
      label: "Monthly budget",
      value: `${formatNumber(Number(budgetKwh))} kWh`,
      hint: totals.budgetPace ? `${usedLabel(totals.budgetPace.usedPct)} used` : undefined,
    });
  }
  const latest = readings[0]; // readings are sorted by date, newest first
  if (latest) {
    const unit = isEnergyType(latest.energy_type) ? ENERGY_UNITS[latest.energy_type] : "";
    stats.push({
      label: "Latest reading",
      value: `${formatNumber(Number(latest.value))} ${unit}`,
      hint: `${latest.energy_type.charAt(0).toUpperCase()}${latest.energy_type.slice(1)} · ${latest.date}`,
    });
  }
  return stats;
}

// Page header for site dashboards: name, status badge, location, then key figures.
export default function SiteHeader({
  name,
  location,
  status,
  readings,
  budgetKwh,
  before,
}: {
  name: string;
  location: string | null;
  status?: "active" | "archived";
  readings: Reading[];
  budgetKwh: number | null;
  before?: ReactNode; // e.g. a back link
}) {
  const stats = keyFigures(readings, budgetKwh);

  return (
    <div className="mb-6 sm:mb-8">
      {before}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className={PAGE_TITLE}>{name}</h1>
        {status && (
          <span className={status === "active" ? BADGE_BRAND : BADGE_NEUTRAL}>
            {status === "active" ? "Active" : "Archived"}
          </span>
        )}
      </div>
      {location && <p className={PAGE_SUBTITLE}>{location}</p>}

      {stats.length > 0 && (
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className={`${CARD} px-5 py-4`}>
              <dt className={EYEBROW}>{s.label}</dt>
              <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">{s.value}</dd>
              {s.hint && <dd className="mt-0.5 text-sm text-subtle">{s.hint}</dd>}
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
