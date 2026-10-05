"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actionResult";

export type NewSiteInput = { name: string; location: string; budget: string };

// No role check here on purpose: RLS (sites_insert / sites_update) is the guard.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseSiteInput(
  input: NewSiteInput
): { ok: false; error: string } | { ok: true; name: string; location: string | null; budget: number | null } {
  const name = input.name.trim();
  const location = input.location.trim();
  if (!name) return { ok: false, error: "Name is required." };

  let budget: number | null = null;
  if (input.budget.trim() !== "") {
    budget = Number(input.budget);
    if (!Number.isFinite(budget) || budget < 0) {
      return { ok: false, error: "Monthly budget must be a number greater than or equal to 0." };
    }
  }
  return { ok: true, name, location: location || null, budget };
}

export async function createSite(input: NewSiteInput): Promise<ActionResult> {
  const parsed = parseSiteInput(input);
  if (!parsed.ok) return parsed;
  const { name, location, budget } = parsed;

  const supabase = await createClient();
  // created_by comes from DEFAULT auth.uid(); status defaults to 'active'.
  const { error } = await supabase
    .from("sites")
    .insert({ name, location, monthly_budget_kwh: budget });

  if (error) {
    if (error.code === "42501") return { ok: false, error: "Only Direction can create sites." };
    console.error("createSite failed", error);
    return { ok: false, error: "The site could not be created. Please try again." };
  }

  refresh();
  return { ok: true };
}

export async function updateSite(siteId: string, input: NewSiteInput): Promise<ActionResult> {
  if (!UUID.test(siteId)) return { ok: false, error: "Invalid request." };
  const parsed = parseSiteInput(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  // Name, location and budget only; status changes go through archiveSite.
  const { data, error } = await supabase
    .from("sites")
    .update({ name: parsed.name, location: parsed.location, monthly_budget_kwh: parsed.budget })
    .eq("id", siteId)
    .eq("status", "active")
    .select("id");

  if (error) {
    if (error.code === "42501") return { ok: false, error: "Only Direction can edit sites." };
    console.error("updateSite failed", error);
    return { ok: false, error: "The site could not be updated. Please try again." };
  }
  // Blocked by RLS, missing, or archived: no error, 0 rows.
  if (!data?.length) {
    return { ok: false, error: "Only Direction can edit sites, and only active ones." };
  }

  refresh();
  return { ok: true };
}

export async function archiveSite(siteId: string): Promise<ActionResult> {
  if (!UUID.test(siteId)) return { ok: false, error: "Invalid request." };
  const supabase = await createClient();
  // Never DELETE: archiving is an UPDATE on status.
  const { data, error } = await supabase
    .from("sites")
    .update({ status: "archived" })
    .eq("id", siteId)
    .select("id");

  if (error) {
    console.error("archiveSite failed", error);
    return { ok: false, error: "The site could not be archived. Please try again." };
  }
  // An UPDATE blocked by RLS does not raise an error: it simply matches 0 rows.
  if (!data?.length) {
    return { ok: false, error: "Only Direction can archive sites." };
  }

  refresh();
  return { ok: true };
}
