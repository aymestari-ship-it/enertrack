"use client";

import { useMemo, useState, type ReactNode } from "react";
import ConsumptionChart from "@/components/ConsumptionChart";
import ReadingsTable, { type Reading, type ReadingsEditing } from "@/components/ReadingsTable";
import { ENERGY_COLORS } from "@/components/energyColors";
import { PERIODS, inPeriod, periodRange, type Period } from "@/components/readingFilters";
import SelectionSummary from "@/components/SelectionSummary";
import { TYPE_LABELS } from "@/components/selectionStats";
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
import { ENERGY_TYPES, type EnergyType } from "@/lib/energy";

const SECTION = `${CARD} ${CARD_BODY}`;
const TITLE = `mb-4 ${SECTION_TITLE}`;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
    </svg>
  );
}

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
  // Kept in ENERGY_TYPES order; never empty.
  const [types, setTypes] = useState<EnergyType[]>([...ENERGY_TYPES]);

  const allTypes = types.length === ENERGY_TYPES.length;

  function toggleType(type: EnergyType) {
    setTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1 ? current : current.filter((t) => t !== type);
      }
      return ENERGY_TYPES.filter((t) => t === type || current.includes(t));
    });
  }

  const filtered = useMemo(() => {
    const range = periodRange(period, today);
    return readings.filter(
      (r) => inPeriod(r.date, range) && (types as string[]).includes(r.energy_type)
    );
  }, [readings, period, today, types]);

  const isFiltered = period !== "all" || !allTypes;
  const resetFilters = () => {
    setPeriod("all");
    setTypes([...ENERGY_TYPES]);
  };

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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`${EYEBROW} w-16 shrink-0`} id="type-label">
              Type
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="type-label">
              <button
                type="button"
                aria-pressed={allTypes}
                onClick={() => setTypes([...ENERGY_TYPES])}
                className={`${PILL} ${allTypes ? PILL_ON : PILL_OFF}`}
              >
                All
              </button>
              {ENERGY_TYPES.map((type) => {
                const on = types.includes(type);
                const last = on && types.length === 1; // at least one type stays active
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={on}
                    aria-disabled={last || undefined}
                    title={last ? "At least one energy type stays selected" : undefined}
                    onClick={() => toggleType(type)}
                    className={`${PILL} ${
                      on ? "border-ink/40 bg-surface text-ink hover:border-ink/60" : PILL_OFF
                    } ${last ? "cursor-not-allowed" : ""}`}
                  >
                    {/* Filled swatch when active, hollow when not: state never relies on color alone. */}
                    <span
                      className="size-3 shrink-0 rounded-full border-2"
                      style={{ borderColor: ENERGY_COLORS[type], backgroundColor: on ? ENERGY_COLORS[type] : "transparent" }}
                      aria-hidden="true"
                    />
                    {TYPE_LABELS[type]}
                    {on && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!readingsError && readings.length > 0 && (
        <SelectionSummary readings={filtered} types={types} period={period} today={today} />
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
              types={types}
              // /my-site: the charts share the row with the form, so 2 columns only from 1024 px.
              twoColumnsFrom={readingForm ? "lg" : "md"}
              emptyLabel={period !== "all" ? "No readings for this period" : "No readings yet"}
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
              emptyMessage={isFiltered ? "No readings match these filters." : "No readings yet."}
              emptyAction={emptyAction}
            />
          )}
        </section>
      </div>
    </div>
  );
}
