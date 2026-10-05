import type { ReactNode } from "react";
import AiSummaryPanel from "@/components/AiSummaryPanel";
import ConsumptionChart from "@/components/ConsumptionChart";
import ReadingsTable, { type ReadingsEditing } from "@/components/ReadingsTable";
import type { SiteDashboardData } from "@/lib/siteDashboard";

const SECTION = "rounded border border-neutral-300 bg-neutral-100 p-5";

// Shared by /my-site (reading form + Edit/Delete) and /sites/[id] (read-only).
export default function SiteDashboard({
  siteId,
  data,
  readingForm,
  readingsEditing,
}: {
  siteId: string;
  data: Omit<SiteDashboardData, "site">;
  readingForm?: ReactNode;
  readingsEditing?: ReadingsEditing;
}) {
  const loadError = <p className="text-sm text-red-600">Readings could not be loaded.</p>;

  return (
    <div className={`grid gap-6 ${readingForm ? "md:grid-cols-[1fr_2fr]" : ""}`}>
      {readingForm && <section className={`self-start ${SECTION}`}>{readingForm}</section>}

      <section className={SECTION}>
        <h2 className="mb-3 font-bold">Consumption by energy type</h2>
        {data.readingsError ? loadError : <ConsumptionChart readings={data.readings} />}
      </section>

      <section className={`${SECTION} md:col-span-2`}>
        <h2 className="mb-3 font-bold">AI summary</h2>
        <AiSummaryPanel siteId={siteId} summaries={data.summaries} />
      </section>

      <section className={`${SECTION} md:col-span-2`}>
        <h2 className="mb-3 font-bold">Readings</h2>
        {data.readingsError ? loadError : <ReadingsTable readings={data.readings} editing={readingsEditing} />}
      </section>
    </div>
  );
}
