"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorMessage, Spinner } from "@/components/ui/Feedback";
import { BADGE_BRAND, BUTTON_PRIMARY, EYEBROW } from "@/components/ui/styles";
import { formatMonthUtc, formatTimestampUtc } from "@/lib/format";

export type AiSummary = {
  id: string;
  summary_text: string;
  created_at: string;
};

type PanelError = { kind: "quota" | "error"; message: string };

// ---- Display helpers: they only change how the stored text is shown. ----

// One paragraph per line break, or per sentence when the text is a single block.
function paragraphs(text: string): string[] {
  const blocks = text.split(/\n\s*\n|\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
}

const MONTH_NAMES =
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s$/;
// A number with an optional sign, thousands separators, decimals and unit.
const FIGURE = /([+−-]?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|kWh\/day|kWh|m³\/day|m³|L\/day|L\b))?)/g;

// Numbers and units in semi-bold; a year after a month name ("October 2026") stays plain.
function Emphasized({ text }: { text: string }) {
  const parts = text.split(FIGURE);
  return (
    <>
      {parts.map((part, i) => {
        const isFigure = i % 2 === 1;
        const isYear = /^\d{4}$/.test(part) && MONTH_NAMES.test(parts[i - 1] ?? "");
        return isFigure && !isYear ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

function SummaryText({ text }: { text: string }) {
  return (
    <div className="max-w-[65ch] space-y-3 text-[15px] leading-[1.6] text-ink/90">
      {paragraphs(text).map((p, i) => (
        <p key={i}>
          <Emphasized text={p} />
        </p>
      ))}
    </div>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M10 1.5 11.8 7l5.7 1.8-5.7 1.8L10 16.5l-1.8-5.9L2.5 8.8 8.2 7 10 1.5Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0 text-subtle transition-transform group-open:rotate-90"
      aria-hidden="true"
    >
      <path d="M7.2 4.2a1 1 0 0 1 1.4 0l5.1 5.1a1 1 0 0 1 0 1.4l-5.1 5.1a1 1 0 1 1-1.4-1.4L11.6 10 7.2 5.6a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}

export default function AiSummaryPanel({
  siteId,
  siteName,
  summaries,
}: {
  siteId: string;
  siteName: string;
  summaries: AiSummary[];
}) {
  const router = useRouter();
  const [error, setError] = useState<PanelError | null>(null);
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
          const message = body?.error?.message ?? "The summary could not be generated.";
          const quota = res.status === 429 || body?.error?.code === "RATE_LIMITED";
          setError({ kind: quota ? "quota" : "error", message });
          return;
        }
        // Reload the page's summaries from the server; the new one comes first.
        router.refresh();
      } catch {
        setError({ kind: "error", message: "Network error. Check your connection and try again." });
      }
    });
  }

  const [latest, ...previous] = summaries;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-subtle">Based on this month&apos;s and last month&apos;s readings.</p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          aria-busy={pending}
          className={`${BUTTON_PRIMARY} aria-busy:cursor-progress aria-busy:opacity-90 max-sm:w-full`}
        >
          {pending ? <Spinner /> : <SparkIcon />}
          {pending ? "Generating…" : "Generate AI summary"}
        </button>
      </div>

      {error?.kind === "quota" && (
        <div role="alert" className="flex gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="mt-0.5 size-5 shrink-0 text-muted"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="7.25" />
            <path d="M10 6v4l2.5 2.5" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-ink">AI quota reached</p>
            <p className="text-sm text-muted">{error.message}</p>
          </div>
        </div>
      )}
      {error?.kind === "error" && <ErrorMessage>{error.message}</ErrorMessage>}

      <div aria-live="polite">
        {pending ? (
          // Placeholder while the summary is generated.
          <div className="rounded-xl border border-line bg-surface p-5 sm:p-6" aria-hidden="true">
            <div className="h-4 w-48 animate-pulse rounded bg-panel" />
            <div className="mt-5 space-y-2.5">
              <div className="h-3 w-full max-w-[65ch] animate-pulse rounded bg-panel" />
              <div className="h-3 w-11/12 max-w-[60ch] animate-pulse rounded bg-panel" />
              <div className="h-3 w-3/4 max-w-[50ch] animate-pulse rounded bg-panel" />
            </div>
          </div>
        ) : latest ? (
          <article className="rounded-xl border border-line bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line/70 px-5 py-3.5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">
                  {siteName} · {formatMonthUtc(latest.created_at)}
                </h3>
                <span className={BADGE_BRAND}>Latest</span>
              </div>
              <p className="text-xs text-subtle">Generated {formatTimestampUtc(latest.created_at)}</p>
            </header>
            <div className="px-5 py-5 sm:px-6">
              <SummaryText text={latest.summary_text} />
            </div>
          </article>
        ) : (
          <EmptyState>
            No summary yet. Generate one to get a short explanation of this month&apos;s figures.
          </EmptyState>
        )}
      </div>

      {previous.length > 0 && (
        <div>
          <h3 className={`mb-2 ${EYEBROW}`}>Previous summaries ({previous.length})</h3>
          <ul className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line bg-surface">
            {previous.map((s) => (
              <li key={s.id}>
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-canvas/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden sm:px-5">
                    <ChevronIcon />
                    <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                      <span className="whitespace-nowrap text-sm font-medium text-ink">{formatMonthUtc(s.created_at)}</span>
                      <span className="text-xs text-subtle">{formatTimestampUtc(s.created_at)}</span>
                    </span>
                  </summary>
                  <div className="px-4 pb-5 pl-11 sm:px-5 sm:pl-12">
                    <SummaryText text={s.summary_text} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
