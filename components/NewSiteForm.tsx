"use client";

import { useState } from "react";
import { createSite } from "@/app/(dashboard)/sites/actions";
import SiteForm from "@/components/SiteForm";
import { BUTTON_PRIMARY } from "@/components/ui/styles";

export default function NewSiteForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={BUTTON_PRIMARY}
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
