import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader, { navLinksFor } from "@/components/AppHeader";
import ArchiveSiteButton from "@/components/ArchiveSiteButton";
import EditSiteButton from "@/components/EditSiteButton";
import NewSiteForm from "@/components/NewSiteForm";
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
    <div className="flex flex-1 flex-col bg-neutral-50 text-neutral-900">
      <AppHeader
        subtitle={`${ROLE_LABELS[me.role]} · Sites`}
        links={navLinksFor(me.role)}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-bold">Sites</h1>
          {isDirection && <NewSiteForm />}
        </div>

        {error ? (
          <p className="text-sm text-red-600">Sites could not be loaded.</p>
        ) : sites.length === 0 ? (
          <p className="text-sm text-neutral-600">No sites yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sites.map((site) => (
              <li
                key={site.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded border border-neutral-300 p-4 ${
                  site.status === "archived" ? "bg-neutral-100 text-neutral-500" : "bg-white"
                }`}
              >
                <Link href={`/sites/${site.id}`} className="group flex-1">
                  <p className="font-semibold group-hover:underline">
                    {site.name}
                    <span
                      className={`ml-2 rounded px-2 py-0.5 text-xs font-normal ${
                        site.status === "active" ? "bg-teal-100 text-teal-800" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {site.status === "active" ? "Active" : "Archived"}
                    </span>
                  </p>
                  <p className="text-sm text-neutral-600">
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
