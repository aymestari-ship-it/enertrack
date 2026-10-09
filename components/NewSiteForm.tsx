"use client";

import { useState } from "react";
import { createSite } from "@/app/(dashboard)/sites/actions";
import SiteForm from "@/components/SiteForm";

export default function NewSiteForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-hover"
      >
        + New site
      </button>
    );
  }

  return (
    <SiteForm
      title="New site"
      submitLabel="Create site"
      pendingLabel="Creating…"
      onSubmit={createSite}
      onDone={() => setOpen(false)}
      className="w-full"
    />
  );
}
