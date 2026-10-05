import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiSummary } from "@/components/AiSummaryPanel";
import type { Reading } from "@/components/ReadingsTable";

export type DashboardSite = {
  id: string;
  name: string;
  location: string | null;
  status: "active" | "archived";
};

export type SiteDashboardData = {
  site: DashboardSite | null; // null: does not exist or hidden by RLS
  readings: Reading[];
  readingsError: boolean;
  summaries: AiSummary[];
};

// Everything a site dashboard shows, read with the caller's session so RLS applies.
export async function getSiteDashboardData(
  supabase: SupabaseClient,
  siteId: string
): Promise<SiteDashboardData> {
  const [{ data: site }, { data: readings, error }, { data: summaries }] = await Promise.all([
    supabase.from("sites").select("id, name, location, status").eq("id", siteId).maybeSingle(),
    supabase
      .from("readings")
      .select("id, energy_type, value, date, created_by")
      .eq("site_id", siteId)
      .order("date", { ascending: false })
      .order("energy_type"),
    supabase
      .from("ai_summaries")
      .select("id, summary_text, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    site: (site as DashboardSite | null) ?? null,
    readings: (readings ?? []) as Reading[],
    readingsError: Boolean(error),
    summaries: (summaries ?? []) as AiSummary[],
  };
}
