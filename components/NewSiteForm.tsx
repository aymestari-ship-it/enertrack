"use client";

import { useState, useTransition } from "react";
import { createSite } from "@/app/(dashboard)/sites/actions";

const INPUT = "rounded border border-neutral-400 bg-white px-3 py-2";

export default function NewSiteForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createSite({ name, location, budget });
      if (result.ok) {
        setName("");
        setLocation("");
        setBudget("");
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
      >
        + New site
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded border border-neutral-300 bg-neutral-100 p-4"
    >
      <h2 className="font-bold">New site</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={INPUT} />
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            placeholder="Monthly budget"
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
          className="rounded bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create site"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded px-4 py-2 text-sm text-neutral-700 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
