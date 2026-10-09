"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorMessage, Spinner } from "@/components/ui/Feedback";
import { BUTTON_PRIMARY } from "@/components/ui/styles";
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
      <div className="flex flex-col items-start gap-3">
        <button type="button" onClick={handleGenerate} disabled={pending} className={BUTTON_PRIMARY}>
          {pending && <Spinner />}
          {pending ? "Generating…" : "Generate AI summary"}
        </button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>

      <div aria-live="polite">
        {latest ? (
          <div className="rounded-lg border border-line border-l-4 border-l-brand bg-surface p-4">
            <p className="leading-relaxed text-ink">{latest.summary_text}</p>
            <p className="mt-2 text-xs text-subtle">{formatTimestampUtc(latest.created_at)}</p>
          </div>
        ) : (
          <EmptyState>No summary yet.</EmptyState>
        )}
      </div>

      {previous.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted">Previous summaries</h3>
          <ul className="flex flex-col gap-2">
            {previous.map((s) => (
              <li key={s.id} className="rounded-lg border border-line bg-canvas p-3 text-sm">
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
