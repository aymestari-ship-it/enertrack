"use client";

import { useState, useTransition } from "react";
import { deleteReading, updateReading } from "@/app/(dashboard)/my-site/actions";
import type { Reading } from "@/components/ReadingsTable";
import { ACTIONS_CELL, CELL, ROW, VALUE_CELL } from "@/components/readingsTableStyles";
import { ENERGY_UNITS, isEnergyType } from "@/lib/energy";
import { formatNumber } from "@/lib/format";

// Below 640 px: 16 px text (no iOS zoom on focus) and 44 px touch targets.
const INPUT = "rounded border border-line-strong bg-surface px-2 py-1 max-sm:min-h-11 max-sm:text-base";
const MOBILE_BUTTON = "max-sm:min-h-11 max-sm:rounded max-sm:border max-sm:border-line max-sm:px-4";
const LINK_BUTTON = `text-brand hover:underline disabled:opacity-50 ${MOBILE_BUTTON}`;

export default function EditableReadingRow({
  reading,
  today,
}: {
  reading: Reading;
  today: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(reading.value));
  const [date, setDate] = useState(reading.date);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unit = isEnergyType(reading.energy_type) ? ENERGY_UNITS[reading.energy_type] : "";

  function startEdit() {
    setValue(String(reading.value));
    setDate(reading.date);
    setError(null);
    setEditing(true);
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateReading({ id: reading.id, value, date });
      if (result.ok) setEditing(false);
      else setError(result.error);
    });
  }

  function handleDelete() {
    const label = `${reading.energy_type} ${formatNumber(Number(reading.value))} ${unit} on ${reading.date}`;
    if (!window.confirm(`Delete this reading (${label})?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReading(reading.id);
      if (!result.ok) setError(result.error);
    });
  }

  const formId = `edit-reading-${reading.id}`;

  return (
    <>
      <tr className={`${ROW} ${error ? "border-b-0" : ""}`}>
        <td className={CELL}>
          {editing ? (
            <input
              form={formId}
              type="date"
              required
              max={today}
              aria-label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT}
            />
          ) : (
            reading.date
          )}
        </td>
        <td className={`${CELL} capitalize`}>{reading.energy_type}</td>
        <td className={VALUE_CELL}>
          {editing ? (
            <span className="inline-flex items-center gap-1">
              <input
                form={formId}
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                required
                aria-label="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`${INPUT} w-28 text-right`}
              />
              {unit}
            </span>
          ) : (
            `${formatNumber(Number(reading.value))} ${unit}`
          )}
        </td>
        <td className={ACTIONS_CELL}>
          {editing ? (
            <form id={formId} onSubmit={handleSave} className="inline-flex gap-3">
              <button type="submit" disabled={pending} className={LINK_BUTTON}>
                {pending ? "Saving…" : "Save"}
              </button>
              <button type="button" disabled={pending} onClick={() => setEditing(false)} className={`text-muted hover:underline ${MOBILE_BUTTON}`}>
                Cancel
              </button>
            </form>
          ) : (
            <span className="inline-flex gap-3">
              <button type="button" disabled={pending} onClick={startEdit} className={LINK_BUTTON}>
                Edit
              </button>
              <button type="button" disabled={pending} onClick={handleDelete} className={`text-danger hover:underline disabled:opacity-50 ${MOBILE_BUTTON}`}>
                {pending ? "…" : "Delete"}
              </button>
            </span>
          )}
        </td>
      </tr>
      {error && (
        <tr className="border-b border-line max-sm:block">
          <td colSpan={4} className="pb-2 text-xs text-danger max-sm:block">
            {error}
          </td>
        </tr>
      )}
    </>
  );
}
