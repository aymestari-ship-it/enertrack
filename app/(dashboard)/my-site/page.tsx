import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ReadingForm from "@/components/ReadingForm";
import SiteDashboard from "@/components/SiteDashboard";
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
    <div className="flex flex-1 flex-col bg-neutral-50 text-neutral-900">
      <AppHeader subtitle="Site Manager · My Site" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">
          {site?.name ?? "My site"}
          {site?.location && (
            <span className="ml-2 text-base font-normal text-neutral-600">{site.location}</span>
          )}
        </h1>

        <SiteDashboard
          siteId={me.site_id}
          data={data}
          readingForm={<ReadingForm today={today} />}
        />
      </main>
    </div>
  );
}
