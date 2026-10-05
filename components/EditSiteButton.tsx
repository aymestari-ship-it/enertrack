"use client";

import { useState } from "react";
import { updateSite } from "@/app/(dashboard)/sites/actions";
import SiteForm from "@/components/SiteForm";

type EditableSite = {
  id: string;
  name: string;
  location: string | null;
  monthly_budget_kwh: number | null;
};

// Renders as direct children of the site's flex-wrap row: the form wraps to its own line.
export default function EditSiteButton({ site }: { site: EditableSite }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded border border-neutral-400 px-3 py-1 text-sm hover:bg-neutral-200"
      >
        Edit
      </button>
      {open && (
        <SiteForm
          title={`Edit ${site.name}`}
          submitLabel="Save"
          pendingLabel="Saving…"
          initial={{
            name: site.name,
            location: site.location ?? "",
            budget: site.monthly_budget_kwh == null ? "" : String(site.monthly_budget_kwh),
          }}
          onSubmit={(input) => updateSite(site.id, input)}
          onDone={() => setOpen(false)}
          className="basis-full"
        />
      )}
    </>
  );
}
