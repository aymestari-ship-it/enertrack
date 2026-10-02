import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

// Route protection (Design Document, 3.5). UX layer only: RLS protects the data.

type Role = "site_manager" | "energy_manager" | "direction";

const PUBLIC_ROUTES = ["/login", "/signup"];

function matches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(route + "/");
}

function homeFor(role: Role) {
  return role === "site_manager" ? "/my-site" : "/sites";
}

// Returns where to redirect, or null if the role may open this route.
function checkRoute(pathname: string, role: Role, siteId: string | null): string | null {
  if (matches(pathname, "/users")) {
    return role === "direction" ? null : homeFor(role);
  }
  if (matches(pathname, "/consolidated")) {
    return role === "site_manager" ? "/my-site" : null;
  }
  if (matches(pathname, "/sites")) {
    if (role !== "site_manager") return null;
    // /sites/:id is allowed for a Site Manager only on their own site.
    const id = pathname.split("/")[2];
    return id && id === siteId ? null : "/my-site";
  }
  if (matches(pathname, "/my-site")) {
    return role === "site_manager" ? null : "/sites";
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createProxyClient(request);
  const { pathname } = request.nextUrl;

  // Redirect while keeping any refreshed session cookies.
  function redirectTo(path: string) {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    getResponse().cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // Verifies the JWT and refreshes the session if needed.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // 1. Not signed in
  if (!userId) {
    return isPublic ? getResponse() : redirectTo("/login");
  }

  // 2. Role and site from profiles (same source as the RLS policies, 3.1)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, site_id")
    .eq("id", userId)
    .maybeSingle();

  // Signed in without a profile row: should not happen (handle_new_user).
  // Only the public pages stay reachable, to avoid a redirect loop.
  if (!profile) {
    return isPublic ? getResponse() : redirectTo("/login");
  }

  const role = profile.role as Role;
  const siteId = profile.site_id as string | null;

  // 3. Site Manager waiting for a site: /pending only
  if (role === "site_manager" && siteId === null) {
    return pathname === "/pending" ? getResponse() : redirectTo("/pending");
  }

  // 5. Signed in and assigned: login, signup, / and /pending lead home
  if (isPublic || pathname === "/" || pathname === "/pending") {
    return redirectTo(homeFor(role));
  }

  // 4. Route table from 3.5
  const target = checkRoute(pathname, role, siteId);
  return target ? redirectTo(target) : getResponse();
}

export const config = {
  matcher: [
    // Everything except API routes, Next.js assets and static files.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
