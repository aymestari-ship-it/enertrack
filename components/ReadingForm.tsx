"use client";

import { useState, useTransition } from "react";
import { addReading } from "@/app/(dashboard)/my-site/actions";
import { ErrorMessage, Spinner, SuccessMessage } from "@/components/ui/Feedback";
import { BUTTON_PRIMARY, FIELD, LABEL, SECTION_TITLE } from "@/components/ui/styles";
import { ENERGY_TYPES, ENERGY_UNITS, type EnergyType } from "@/lib/energy";

export default function ReadingForm({ today }: { today: string }) {
  const [energyType, setEnergyType] = useState<EnergyType>("electricity");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await addReading({ energyType, value, date });
      if (result.ok) {
        setValue("");
        setSaved(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form id="new-reading" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className={SECTION_TITLE}>New reading</h2>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Energy type</span>
        <select
          value={energyType}
          onChange={(e) => setEnergyType(e.target.value as EnergyType)}
          className={`${FIELD} w-full`}
        >
          {ENERGY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)} ({ENERGY_UNITS[type]})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Value</span>
        <span className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${FIELD} w-full`}
          />
          <span className="w-10 text-sm text-muted">{ENERGY_UNITS[energyType]}</span>
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Date</span>
        <input
          type="date"
          required
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${FIELD} w-full`}
        />
      </label>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {saved && <SuccessMessage>Reading saved.</SuccessMessage>}

      <button type="submit" disabled={pending} className={`${BUTTON_PRIMARY} self-start`}>
        {pending && <Spinner />}
        {pending ? "Saving…" : "Submit"}
      </button>
    </form>
  );
}
