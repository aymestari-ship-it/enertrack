"use client";

import { useRouter } from "next/navigation";
import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/client";

// `onDark`: outlined white style for the brand header; default style elsewhere (e.g. /pending).
export default function LogoutButton({ onDark = false }: { onDark?: boolean }) {
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
      className={
        onDark
          ? "inline-flex min-h-11 items-center rounded-lg border border-white/40 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : BUTTON_SECONDARY
      }
    >
      Log out
    </button>
  );
}
