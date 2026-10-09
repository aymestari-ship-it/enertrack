import HeaderNav from "@/components/HeaderNav";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/ui/Logo";
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

// `role` is the role label shown as a badge; `page` names the current screen.
export default function AppHeader({
  role,
  page,
  links = [],
  showLogout = true,
}: {
  role: string;
  page: string;
  links?: NavLink[];
  showLogout?: boolean;
}) {
  return (
    <header className="bg-brand-dark text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Logo onDark />

        {links.length > 0 && (
          <div className="order-last w-full sm:order-none sm:w-auto">
            <HeaderNav links={links} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex flex-col items-end leading-tight">
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
              {role}
            </span>
            <span className="mt-1 text-xs text-white/80">{page}</span>
          </div>
          {showLogout && <LogoutButton onDark />}
        </div>
      </div>
    </header>
  );
}
