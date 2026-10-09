import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppHeader, { navLinksFor } from "@/components/AppHeader";
import SiteDashboard from "@/components/SiteDashboard";
import { getCurrentProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { getSiteDashboardData } from "@/lib/siteDashboard";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Screen 4: Site detail dashboard (read-only).
export default async function SiteDetailPage(props: PageProps<"/sites/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const me = await getCurrentProfile(supabase);
  if (!me) redirect("/login");

  const { site, ...data } = await getSiteDashboardData(supabase, id);
  // Missing and hidden-by-RLS look the same: 0 rows, same 404.
  if (!site) notFound();

  // A Site Manager only reaches their own site here; their home is /my-site.
  const back = me.role === "site_manager"
    ? { href: "/my-site", label: "← My site" }
    : { href: "/sites", label: "← All sites" };

  return (
    <div className="flex flex-1 flex-col bg-canvas text-ink">
      <AppHeader subtitle={`${ROLE_LABELS[me.role]} · Site Detail`} links={navLinksFor(me.role)} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Link href={back.href} className="text-sm text-brand hover:underline">
          {back.label}
        </Link>

        <h1 className="mb-6 mt-2 text-xl font-bold">
          {site.name}
          {site.location && (
            <span className="ml-2 text-base font-normal text-muted">{site.location}</span>
          )}
          {site.status === "archived" && (
            <span className="ml-2 rounded bg-line px-2 py-0.5 align-middle text-xs font-normal text-muted">
              Archived
            </span>
          )}
        </h1>

        <SiteDashboard siteId={site.id} data={data} />
      </main>
    </div>
  );
}
