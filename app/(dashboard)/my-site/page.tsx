import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ReadingForm from "@/components/ReadingForm";
import SiteDashboard from "@/components/SiteDashboard";
import { MAIN, PAGE, PAGE_TITLE } from "@/components/ui/styles";
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
      <AppHeader subtitle="Site Manager · My Site" />

      <main className={`${MAIN} max-w-5xl`}>
        <div className="mb-6">
          <h1 className={PAGE_TITLE}>{site?.name ?? "My site"}</h1>
          {site?.location && <p className="mt-1 text-sm text-subtle">{site.location}</p>}
        </div>

        <SiteDashboard
          siteId={me.site_id}
          data={data}
          readingForm={<ReadingForm today={today} />}
          readingsEditing={{ today }}
        />
      </main>
    </div>
  );
}
