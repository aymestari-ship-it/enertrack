import type { ReactNode } from "react";
import AiSummaryPanel from "@/components/AiSummaryPanel";
import ReadingsExplorer from "@/components/ReadingsExplorer";
import type { ReadingsEditing } from "@/components/ReadingsTable";
import type { SiteDashboardData } from "@/lib/siteDashboard";

// Shared by /my-site (reading form + Edit/Delete) and /sites/[id] (read-only).
// Filters live in ReadingsExplorer; the AI panel is passed in and is never filtered.
export default function SiteDashboard({
  siteId,
  siteName,
  data,
  today,
  readingForm,
  readingsEditing,
}: {
  siteId: string;
  siteName: string;
  data: Omit<SiteDashboardData, "site">;
  today: string; // YYYY-MM-DD (UTC)
  readingForm?: ReactNode;
  readingsEditing?: ReadingsEditing;
}) {
  return (
    <ReadingsExplorer
      readings={data.readings}
      readingsError={data.readingsError}
      today={today}
      readingForm={readingForm}
      readingsEditing={readingsEditing}
      aiPanel={<AiSummaryPanel siteId={siteId} siteName={siteName} summaries={data.summaries} />}
    />
  );
}
