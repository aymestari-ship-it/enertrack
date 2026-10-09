import { redirect } from "next/navigation";
import AppHeader, { navLinksFor } from "@/components/AppHeader";
import UserRow, { type SiteOption, type UserRowData } from "@/components/UserRow";
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
    <div className="flex flex-1 flex-col bg-neutral-50 text-neutral-900">
      <AppHeader
        subtitle="Direction · User & Role Management"
links={navLinksFor(me.role)}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">Users</h1>

        {error ? (
          <p className="text-sm text-red-600">Users could not be loaded.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-neutral-300 bg-white px-4">
            <table className="w-full text-left text-sm max-sm:block">
              <thead className="max-sm:hidden">
                <tr className="border-b border-neutral-300">
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Assigned site</th>
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
