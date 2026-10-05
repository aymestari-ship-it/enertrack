"use client";

import { useState, useTransition } from "react";
import { deleteReading, updateReading } from "@/app/(dashboard)/my-site/actions";
import type { Reading } from "@/components/ReadingsTable";
import { ENERGY_UNITS, isEnergyType } from "@/lib/energy";
import { formatNumber } from "@/lib/format";

const INPUT = "rounded border border-neutral-400 bg-white px-2 py-1";
const LINK_BUTTON = "text-teal-700 hover:underline disabled:opacity-50";

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
      <tr className={`${error ? "" : "border-b"} border-neutral-200`}>
        <td className="py-2">
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
        <td className="py-2 capitalize">{reading.energy_type}</td>
        <td className="py-2 text-right tabular-nums">
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
        <td className="py-2 pl-4 text-right whitespace-nowrap">
          {editing ? (
            <form id={formId} onSubmit={handleSave} className="inline-flex gap-3">
              <button type="submit" disabled={pending} className={LINK_BUTTON}>
                {pending ? "Saving…" : "Save"}
              </button>
              <button type="button" disabled={pending} onClick={() => setEditing(false)} className="text-neutral-600 hover:underline">
                Cancel
              </button>
            </form>
          ) : (
            <span className="inline-flex gap-3">
              <button type="button" disabled={pending} onClick={startEdit} className={LINK_BUTTON}>
                Edit
              </button>
              <button type="button" disabled={pending} onClick={handleDelete} className="text-red-700 hover:underline disabled:opacity-50">
                {pending ? "…" : "Delete"}
              </button>
            </span>
          )}
        </td>
      </tr>
      {error && (
        <tr className="border-b border-neutral-200">
          <td colSpan={4} className="pb-2 text-xs text-red-600">
            {error}
          </td>
        </tr>
      )}
    </>
  );
}
