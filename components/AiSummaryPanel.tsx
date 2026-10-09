"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTimestampUtc } from "@/lib/format";

export type AiSummary = {
  id: string;
  summary_text: string;
  created_at: string;
};

export default function AiSummaryPanel({
  siteId,
  summaries,
}: {
  siteId: string;
  summaries: AiSummary[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site_id: siteId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error?.message ?? "The summary could not be generated.");
          return;
        }
        // Reload the page's summaries from the server; the new one comes first.
        router.refresh();
      } catch {
        setError("Network error. Check your connection and try again.");
      }
    });
  }

  const [latest, ...previous] = summaries;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="rounded bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate AI summary"}
        </button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="rounded border border-line bg-surface p-4" aria-live="polite">
        {latest ? (
          <>
            <p className="leading-relaxed">{latest.summary_text}</p>
            <p className="mt-2 text-xs text-subtle">{formatTimestampUtc(latest.created_at)}</p>
          </>
        ) : (
          <p className="text-sm text-subtle">No summary yet.</p>
        )}
      </div>

      {previous.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Previous summaries</h3>
          <ul className="flex flex-col gap-2">
            {previous.map((s) => (
              <li key={s.id} className="rounded border border-line bg-surface p-3 text-sm">
                <p className="text-ink">{s.summary_text}</p>
                <p className="mt-1 text-xs text-subtle">{formatTimestampUtc(s.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
