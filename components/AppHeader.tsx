import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import type { Role } from "@/lib/roles";

export type NavLink = { href: string; label: string };

// Header navigation per role (only routes allowed by proxy.ts).
export function navLinksFor(role: Role): NavLink[] {
  if (role === "direction") {
    return [
      { href: "/sites", label: "Sites" },
      { href: "/users", label: "Users" },
    ];
  }
  if (role === "energy_manager") return [{ href: "/sites", label: "Sites" }];
  return [];
}

export default function AppHeader({ subtitle, links = [] }: { subtitle: string; links?: NavLink[] }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 bg-teal-700 px-6 py-3 text-white">
      <div className="flex items-center gap-6">
        <span className="font-bold">EnerTrack</span>
        {links.length > 0 && (
          <nav className="flex gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">{subtitle}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
