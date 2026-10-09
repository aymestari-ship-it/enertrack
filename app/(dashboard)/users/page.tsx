import { redirect } from "next/navigation";
import AppHeader, { navLinksFor } from "@/components/AppHeader";
import UserRow, { type SiteOption, type UserRowData } from "@/components/UserRow";
import { ErrorMessage } from "@/components/ui/Feedback";
import { CARD, MAIN, PAGE, PAGE_TITLE } from "@/components/ui/styles";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Screen 6: User & role management (Direction only; proxy.ts redirects other roles).
export default async function UsersPage() {
  const supabase = await createClient();
  const me = await getCurrentProfile(supabase);
  if (!me) redirect("/login");

  const [{ data: users, error }, { data: sites }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, site_id").order("full_name"),
    supabase.from("sites").select("id, name, status").order("name"),
  ]);

  return (
    <div className={PAGE}>
      <AppHeader
        role="Direction"
        page="User & Role Management"
        links={navLinksFor(me.role)}
      />

      <main className={`${MAIN} max-w-4xl`}>
        <h1 className={`mb-6 ${PAGE_TITLE}`}>Users</h1>

        {error ? (
          <ErrorMessage>Users could not be loaded.</ErrorMessage>
        ) : (
          <div className={`${CARD} overflow-x-auto px-4 sm:px-5`}>
            <table className="w-full text-left text-sm max-sm:block">
              <thead className="max-sm:hidden">
                <tr className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <th className="pb-2 pt-4 font-medium">Name</th>
                  <th className="pb-2 pt-4 font-medium">Role</th>
                  <th className="pb-2 pt-4 font-medium">Assigned site</th>
                </tr>
              </thead>
              <tbody className="max-sm:block">
                {((users ?? []) as UserRowData[]).map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    sites={(sites ?? []) as SiteOption[]}
                    isMe={u.id === me.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
