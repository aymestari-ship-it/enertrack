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

// Renders as direct children of the site's flex-wrap row: the form wraps to its own line,
// and order-last keeps it after the Archive button so Edit and Archive stay side by side.
export default function EditSiteButton({ site }: { site: EditableSite }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded border border-line-strong px-3 py-1 text-sm hover:bg-panel max-sm:min-h-11"
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
          className="order-last basis-full"
        />
      )}
    </>
  );
}
