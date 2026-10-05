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
          className="rounded bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate AI summary"}
        </button>
        {pending && (
          <p className="mt-2 text-sm text-neutral-600">This can take up to 30 seconds.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded border border-neutral-300 bg-white p-4" aria-live="polite">
        {latest ? (
          <>
            <p className="leading-relaxed">{latest.summary_text}</p>
            <p className="mt-2 text-xs text-neutral-500">{formatTimestampUtc(latest.created_at)}</p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">No summary yet.</p>
        )}
      </div>

      {previous.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Previous summaries</h3>
          <ul className="flex flex-col gap-2">
            {previous.map((s) => (
              <li key={s.id} className="rounded border border-neutral-200 bg-white p-3 text-sm">
                <p className="text-neutral-800">{s.summary_text}</p>
                <p className="mt-1 text-xs text-neutral-500">{formatTimestampUtc(s.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
