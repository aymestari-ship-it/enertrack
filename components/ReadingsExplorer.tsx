"use client";

import { useMemo, useState, type ReactNode } from "react";
import ConsumptionChart from "@/components/ConsumptionChart";
import ReadingsTable, { type Reading, type ReadingsEditing } from "@/components/ReadingsTable";
import { PERIODS, inPeriod, periodRange, type Period } from "@/components/readingFilters";
import { ErrorMessage } from "@/components/ui/Feedback";
import {
  BUTTON_SECONDARY,
  CARD,
  CARD_BODY,
  EYEBROW,
  PILL,
  PILL_OFF,
  PILL_ON,
  SECTION_TITLE,
} from "@/components/ui/styles";

const SECTION = `${CARD} ${CARD_BODY}`;
const TITLE = `mb-4 ${SECTION_TITLE}`;

// Owns the filter state shared by the charts and the readings table.
// The reading form and the AI panel come in as ready-made slots and are not filtered.
export default function ReadingsExplorer({
  readings,
  readingsError,
  today,
  readingForm,
  aiPanel,
  readingsEditing,
}: {
  readings: Reading[];
  readingsError: boolean;
  today: string; // YYYY-MM-DD (UTC), from the server
  readingForm?: ReactNode;
  aiPanel: ReactNode;
  readingsEditing?: ReadingsEditing;
}) {
  const [period, setPeriod] = useState<Period>("all");

  const filtered = useMemo(() => {
    const range = periodRange(period, today);
    return readings.filter((r) => inPeriod(r.date, range));
  }, [readings, period, today]);

  const isFiltered = period !== "all";
  const resetFilters = () => setPeriod("all");

  const loadError = <ErrorMessage>Readings could not be loaded.</ErrorMessage>;
  // Only /my-site declares two columns (form + charts). Without the form, spanning 2
  // columns would create an implicit second column and squeeze the charts to half width.
  const fullWidth = readingForm ? "md:col-span-2" : "";

  const emptyAction = isFiltered ? (
    <button type="button" onClick={resetFilters} className={BUTTON_SECONDARY}>
      Show all readings
    </button>
  ) : (
    readingForm && (
      <a href="#new-reading" className={BUTTON_SECONDARY}>
        Add a reading
      </a>
    )
  );

  return (
    <div className="flex flex-col gap-6">
      {!readingsError && readings.length > 0 && (
        <div className={`${CARD} flex flex-col gap-3 px-5 py-4 sm:px-6`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`${EYEBROW} w-16 shrink-0`} id="period-label">
              Period
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="period-label">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={period === p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`${PILL} ${period === p.id ? PILL_ON : PILL_OFF}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${readingForm ? "md:grid-cols-[1fr_2fr]" : ""}`}>
        {readingForm && <section className={`self-start ${SECTION}`}>{readingForm}</section>}

        <section className={SECTION}>
          <h2 className={TITLE}>Consumption by energy type</h2>
          {readingsError ? (
            loadError
          ) : (
            <ConsumptionChart
              readings={filtered}
              emptyLabel={isFiltered ? "No readings for this period" : "No readings yet"}
            />
          )}
        </section>

        <section className={`${SECTION} ${fullWidth}`}>
          <h2 className={TITLE}>AI summary</h2>
          {aiPanel}
        </section>

        <section className={`${SECTION} ${fullWidth}`}>
          <h2 className={TITLE}>Readings</h2>
          {readingsError ? (
            loadError
          ) : (
            <ReadingsTable
              readings={filtered}
              editing={readingsEditing}
              emptyMessage={isFiltered ? "No readings for this period." : "No readings yet."}
              emptyAction={emptyAction}
            />
          )}
        </section>
      </div>
    </div>
  );
}
