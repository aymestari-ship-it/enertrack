"use client";

import { useState, useTransition } from "react";
import type { NewSiteInput } from "@/app/(dashboard)/sites/actions";
import type { ActionResult } from "@/lib/actionResult";

const INPUT = "rounded border border-neutral-400 bg-white px-3 py-2";

// Name / location / monthly budget fields, shared by "+ New site" and "Edit".
export default function SiteForm({
  title,
  submitLabel,
  pendingLabel,
  initial = { name: "", location: "", budget: "" },
  onSubmit,
  onDone,
  className = "",
}: {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  initial?: NewSiteInput;
  onSubmit: (input: NewSiteInput) => Promise<ActionResult>;
  onDone: () => void; // called on success and on Cancel
  className?: string;
}) {
  const [name, setName] = useState(initial.name);
  const [location, setLocation] = useState(initial.location);
  const [budget, setBudget] = useState(initial.budget);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({ name, location, budget });
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-3 rounded border border-neutral-300 bg-neutral-100 p-4 text-neutral-900 ${className}`}
    >
      <h2 className="font-bold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <input required placeholder="Name" aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
        <input placeholder="Location" aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={INPUT} />
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            placeholder="Monthly budget"
            aria-label="Monthly budget (kWh)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={`${INPUT} w-full`}
          />
          <span className="text-sm">kWh</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-60 max-sm:min-h-11"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDone}
          className="rounded px-4 py-2 text-sm text-neutral-700 hover:underline max-sm:min-h-11"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
