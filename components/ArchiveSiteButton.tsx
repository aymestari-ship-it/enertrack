"use client";

import { useState, useTransition } from "react";
import { archiveSite } from "@/app/(dashboard)/sites/actions";

export default function ArchiveSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    if (!window.confirm(`Archive "${siteName}"? Its readings are kept.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveSite(siteId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleArchive}
        disabled={pending}
        className="rounded border border-neutral-400 px-3 py-1 text-sm hover:bg-neutral-200 disabled:opacity-60"
      >
        {pending ? "Archiving…" : "Archive"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
