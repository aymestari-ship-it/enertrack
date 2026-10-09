"use client";

import { useState, useTransition } from "react";
import type { NewSiteInput } from "@/app/(dashboard)/sites/actions";
import type { ActionResult } from "@/lib/actionResult";

import { ErrorMessage, Spinner } from "@/components/ui/Feedback";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD, LABEL, SECTION_TITLE } from "@/components/ui/styles";

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
      className={`flex flex-col gap-4 rounded-xl border border-line bg-panel p-4 text-ink sm:p-5 ${className}`}
    >
      <h2 className={SECTION_TITLE}>{title}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Name</span>
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={`${FIELD} w-full`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Location</span>
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={`${FIELD} w-full`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Monthly budget (kWh)</span>
          <span className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              placeholder="Monthly budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`${FIELD} w-full`}
            />
            <span className="text-sm text-muted">kWh</span>
          </span>
        </label>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
          {pending && <Spinner />}
          {pending ? pendingLabel : submitLabel}
        </button>
        <button type="button" disabled={pending} onClick={onDone} className={BUTTON_SECONDARY}>
          Cancel
        </button>
      </div>
    </form>
  );
}
