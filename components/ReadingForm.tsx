"use client";

import { useState, useTransition } from "react";
import { addReading } from "@/app/(dashboard)/my-site/actions";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-bold">New reading</h2>

      <select
        value={energyType}
        onChange={(e) => setEnergyType(e.target.value as EnergyType)}
        className="rounded border border-line-strong bg-surface px-3 py-2"
      >
        {ENERGY_TYPES.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)} ({ENERGY_UNITS[type]})
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          required
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-line-strong bg-surface px-3 py-2"
        />
        <span className="w-10 text-sm">{ENERGY_UNITS[energyType]}</span>
      </div>

      <input
        type="date"
        required
        max={today}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-line-strong bg-surface px-3 py-2"
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand">Reading saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Submit"}
      </button>
    </form>
  );
}
