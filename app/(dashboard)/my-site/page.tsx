import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ReadingForm from "@/components/ReadingForm";
import SiteDashboard from "@/components/SiteDashboard";
import SiteHeader from "@/components/SiteHeader";
import { MAIN, PAGE } from "@/components/ui/styles";
import { getCurrentProfile } from "@/lib/auth";
import { getSiteDashboardData } from "@/lib/siteDashboard";
import { createClient } from "@/lib/supabase/server";

// Screen 3: My Site (Site Manager).
export default async function MySitePage() {
  const supabase = await createClient();
  const me = await getCurrentProfile(supabase);
  if (!me) redirect("/login");
  if (!me.site_id) redirect("/pending");

  const { site, ...data } = await getSiteDashboardData(supabase, me.site_id);

  // Matches the database's current_date (UTC), used by CHECK (date <= current_date).
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={PAGE}>
      <AppHeader role="Site Manager" page="My Site" />

      <main className={MAIN}>
        <SiteHeader
          name={site?.name ?? "My site"}
          location={site?.location ?? null}
          status={site?.status}
          readings={data.readingsError ? [] : data.readings}
          budgetKwh={site?.monthly_budget_kwh ?? null}
        />

        <SiteDashboard
          siteId={me.site_id}
          siteName={site?.name ?? "My site"}
          data={data}
          readingForm={<ReadingForm today={today} />}
          readingsEditing={{ today }}
        />
      </main>
    </div>
  );
}
