import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader, { navLinksFor } from "@/components/AppHeader";
import ArchiveSiteButton from "@/components/ArchiveSiteButton";
import EditSiteButton from "@/components/EditSiteButton";
import NewSiteForm from "@/components/NewSiteForm";
import { EmptyState, ErrorMessage } from "@/components/ui/Feedback";
import { BADGE_BRAND, BADGE_NEUTRAL, CARD, MAIN, PAGE, PAGE_TITLE } from "@/components/ui/styles";
import { getCurrentProfile } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

type Site = {
  id: string;
  name: string;
  location: string | null;
  monthly_budget_kwh: number | null;
  status: "active" | "archived";
};

// Screen 2: Site list (Direction / Energy Manager).
export default async function SitesPage() {
  const supabase = await createClient();
  const me = await getCurrentProfile(supabase);
  if (!me) redirect("/login");

  // RLS decides which sites come back (all of them for these two roles).
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, location, monthly_budget_kwh, status")
    .order("status")
    .order("name");
  const sites = (data ?? []) as Site[];

  // UI only: hides actions the database would refuse anyway.
  const isDirection = me.role === "direction";

  return (
    <div className={PAGE}>
      <AppHeader
        subtitle={`${ROLE_LABELS[me.role]} · Sites`}
        links={navLinksFor(me.role)}
      />

      <main className={`${MAIN} max-w-4xl`}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className={PAGE_TITLE}>Sites</h1>
          {isDirection && <NewSiteForm />}
        </div>

        {error ? (
          <ErrorMessage>Sites could not be loaded.</ErrorMessage>
        ) : sites.length === 0 ? (
          <EmptyState>No sites yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {sites.map((site) => (
              <li
                key={site.id}
                className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5 ${
                  site.status === "archived" ? "bg-panel shadow-none" : ""
                }`}
              >
                <Link
                  href={`/sites/${site.id}`}
                  className="group min-w-0 flex-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink group-hover:text-brand">
                    {site.name}
                    <span className={site.status === "active" ? BADGE_BRAND : BADGE_NEUTRAL}>
                      {site.status === "active" ? "Active" : "Archived"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-subtle">
                    {site.location ?? "No location"}
                    {site.monthly_budget_kwh != null &&
                      ` · Budget ${formatNumber(Number(site.monthly_budget_kwh))} kWh/month`}
                  </p>
                </Link>
                {isDirection && site.status === "active" && (
                  <>
                    <EditSiteButton site={site} />
                    <ArchiveSiteButton siteId={site.id} siteName={site.name} />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
