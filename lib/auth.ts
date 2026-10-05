import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "@/lib/roles";

export type CurrentProfile = {
  id: string;
  role: Role;
  site_id: string | null;
  full_name: string | null;
};

// The signed-in user's profile, read through RLS (own row is always visible).
export async function getCurrentProfile(supabase: SupabaseClient): Promise<CurrentProfile | null> {
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, site_id, full_name")
    .eq("id", userId)
    .maybeSingle();
  return (data as CurrentProfile | null) ?? null;
}
