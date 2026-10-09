import { ENERGY_COLORS } from "@/components/energyColors";
import type { CustomRange, Period } from "@/components/readingFilters";
import {
  TYPE_LABELS,
  describeSelection,
  summarizeSelection,
  type SelectionReading,
} from "@/components/selectionStats";
import { CARD, EYEBROW } from "@/components/ui/styles";
import type { EnergyType } from "@/lib/energy";
import { formatDay, formatNumber } from "@/lib/format";

// Grid by number of cards: always one column on mobile.
const GRID: Record<number, string> = {
  1: "grid gap-4",
  2: "grid gap-4 sm:grid-cols-2",
  3: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
};

function day(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return formatDay(Date.UTC(y, m - 1, d), true);
}

// One card per active energy type for the readings currently shown (filtered client-side).
export default function SelectionSummary({
  readings,
  types,
  period,
  today,
  custom,
}: {
  readings: SelectionReading[];
  types: readonly EnergyType[];
  period: Period;
  today: string;
  custom?: CustomRange | null; // applied custom range, when period is "custom"
}) {
  const summaries = summarizeSelection(readings, types);

  return (
    <section aria-labelledby="selection-summary-title" className="flex flex-col gap-3">
      <h2 id="selection-summary-title" className="sr-only">
        Selection summary
      </h2>
      <p className="text-sm text-muted" aria-live="polite">
        <span className="font-medium text-ink">Showing</span> {describeSelection(period, types, today, custom)}
      </p>

      <div className={GRID[summaries.length] ?? GRID[4]}>
        {summaries.map((s) => (
          <article
            key={s.type}
            className={`${CARD} border-t-4 px-5 py-4`}
            style={{ borderTopColor: ENERGY_COLORS[s.type] }}
          >
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: ENERGY_COLORS[s.type] }}
                aria-hidden="true"
              />
              {TYPE_LABELS[s.type]}
              <span className="font-normal text-subtle">({s.unit})</span>
            </h3>

            {s.count === 0 ? (
              <p className="mt-3 text-sm text-subtle">No readings</p>
            ) : (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className={EYEBROW}>Total</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
                    {formatNumber(s.total!)} {s.unit}
                  </dd>
                </div>
                <div>
                  <dt className={EYEBROW}>Daily average</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
                    {formatNumber(s.dailyAverage!)} {s.unit}
                  </dd>
                  <dd className="text-xs text-subtle">
                    over {s.daysCovered} day{s.daysCovered === 1 ? "" : "s"}
                  </dd>
                </div>
                <div>
                  <dt className={EYEBROW}>Highest day</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
                    {formatNumber(s.peak!.value)} {s.unit}
                  </dd>
                  <dd className="text-xs text-subtle">{day(s.peak!.date)}</dd>
                </div>
                <div>
                  <dt className={EYEBROW}>Readings</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{s.count}</dd>
                </div>
              </dl>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
