"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded bg-brand px-6 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover max-sm:min-h-11"
    >
      Log out
    </button>
  );
}
