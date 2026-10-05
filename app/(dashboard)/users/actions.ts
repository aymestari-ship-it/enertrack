"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actionResult";
import { isRole, type Role } from "@/lib/roles";

// Runs with the signed-in user's session (publishable key), never the service-role key:
// RLS (profiles_update) and the protect_profile_columns trigger do the enforcing.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "Only Direction can change roles or site assignments.";

export async function updateRole(userId: string, role: string): Promise<ActionResult> {
  if (!UUID.test(userId) || !isRole(role)) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) return { ok: false, error: "Your session has expired. Please log in again." };

  // Keeps at least the current admin: Direction cannot demote itself.
  if (userId === auth.claims.sub) {
    return { ok: false, error: "You cannot change your own role. Ask another Direction member." };
  }

  // Only Site Managers hold a site; leaving that role releases it.
  const patch: { role: Role; site_id?: null } = { role };
  if (role !== "site_manager") patch.site_id = null;

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("id");

  if (error) {
    if (error.code === "P0001") return { ok: false, error: NOT_ALLOWED }; // protect_profile_columns
    console.error("updateRole failed", error);
    return { ok: false, error: "The role could not be changed. Please try again." };
  }
  // Blocked by RLS: no error, 0 rows updated.
  if (!data?.length) return { ok: false, error: NOT_ALLOWED };

  refresh();
  return { ok: true };
}

export async function assignSite(userId: string, siteId: string | null): Promise<ActionResult> {
  if (!UUID.test(userId) || (siteId !== null && !UUID.test(siteId))) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "User not found." };
  if (target.role !== "site_manager") {
    return { ok: false, error: "Only Site Managers can be assigned to a site." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ site_id: siteId })
    .eq("id", userId)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      // one_manager_per_site: name the current manager in the message.
      const { data: current } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("site_id", siteId!)
        .eq("role", "site_manager")
        .neq("id", userId)
        .maybeSingle();
      const who = current?.full_name ? ` (${current.full_name})` : "";
      return {
        ok: false,
        error: `This site already has a Site Manager${who}. Unassign them first.`,
      };
    }
    if (error.code === "23503") return { ok: false, error: "Site not found." };
    if (error.code === "P0001") return { ok: false, error: NOT_ALLOWED };
    console.error("assignSite failed", error);
    return { ok: false, error: "The site could not be assigned. Please try again." };
  }
  if (!data?.length) return { ok: false, error: NOT_ALLOWED };

  refresh();
  return { ok: true };
}
