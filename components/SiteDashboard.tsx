import type { ReactNode } from "react";
import AiSummaryPanel from "@/components/AiSummaryPanel";
import ConsumptionChart from "@/components/ConsumptionChart";
import ReadingsTable, { type ReadingsEditing } from "@/components/ReadingsTable";
import { ErrorMessage } from "@/components/ui/Feedback";
import { BUTTON_SECONDARY, CARD, CARD_BODY, SECTION_TITLE } from "@/components/ui/styles";
import type { SiteDashboardData } from "@/lib/siteDashboard";

const SECTION = `${CARD} ${CARD_BODY}`;
const TITLE = `mb-4 ${SECTION_TITLE}`;

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
  const loadError = <ErrorMessage>Readings could not be loaded.</ErrorMessage>;
  // Only /my-site declares two columns (form + charts). Without the form, spanning 2
  // columns would create an implicit second column and squeeze the charts to half width.
  const fullWidth = readingForm ? "md:col-span-2" : "";

  return (
    <div className={`grid gap-6 ${readingForm ? "md:grid-cols-[1fr_2fr]" : ""}`}>
      {readingForm && <section className={`self-start ${SECTION}`}>{readingForm}</section>}

      <section className={SECTION}>
        <h2 className={TITLE}>Consumption by energy type</h2>
        {data.readingsError ? loadError : <ConsumptionChart readings={data.readings} />}
      </section>

      <section className={`${SECTION} ${fullWidth}`}>
        <h2 className={TITLE}>AI summary</h2>
        <AiSummaryPanel siteId={siteId} summaries={data.summaries} />
      </section>

      <section className={`${SECTION} ${fullWidth}`}>
        <h2 className={TITLE}>Readings</h2>
        {data.readingsError ? (
          loadError
        ) : (
          <ReadingsTable
            readings={data.readings}
            editing={readingsEditing}
            emptyAction={
              readingForm && (
                <a href="#new-reading" className={BUTTON_SECONDARY}>
                  Add a reading
                </a>
              )
            }
          />
        )}
      </section>
    </div>
  );
}
