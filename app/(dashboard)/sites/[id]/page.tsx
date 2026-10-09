import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppHeader, { navLinksFor } from "@/components/AppHeader";
import SiteDashboard from "@/components/SiteDashboard";
import { BADGE_NEUTRAL, LINK, MAIN, PAGE, PAGE_TITLE } from "@/components/ui/styles";
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
    <div className={PAGE}>
      <AppHeader role={ROLE_LABELS[me.role]} page="Site Detail" links={navLinksFor(me.role)} />

      <main className={`${MAIN} max-w-5xl`}>
        <Link href={back.href} className={`${LINK} inline-flex min-h-11 items-center text-sm`}>
          {back.label}
        </Link>

        <div className="mb-6 mt-1">
          <h1 className={`${PAGE_TITLE} flex flex-wrap items-center gap-2`}>
            {site.name}
            {site.status === "archived" && <span className={BADGE_NEUTRAL}>Archived</span>}
          </h1>
          {site.location && <p className="mt-1 text-sm text-subtle">{site.location}</p>}
        </div>

        <SiteDashboard siteId={site.id} data={data} />
      </main>
    </div>
  );
}
