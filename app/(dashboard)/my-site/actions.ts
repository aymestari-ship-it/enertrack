"use server";

import { refresh } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actionResult";
import { isEnergyType } from "@/lib/energy";

export type AddReadingInput = {
  energyType: string;
  value: string;
  date: string;
};

export type UpdateReadingInput = {
  id: string;
  value: string;
  date: string;
};

export type AddReadingResult = ActionResult;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_EXPIRED = "Your session has expired. Please log in again.";

// Same rules as the database constraints, checked first for clearer messages.
function parseValueAndDate(
  input: { value: string; date: string }
): { ok: false; error: string } | { ok: true; value: number; date: string } {
  const value = Number(input.value);
  if (input.value.trim() === "" || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Value must be a number greater than or equal to 0." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Choose a valid date." };
  }
  return { ok: true, value, date: input.date };
}

function translateError(error: PostgrestError, forbidden: string, fallback: string): ActionResult {
  switch (error.code) {
    case "23505": // unique_violation: (site_id, energy_type, date)
      return { ok: false, error: "A reading already exists for this site, type and date." };
    case "23514": // check_violation: value >= 0, date <= current_date
      return { ok: false, error: "Value must be ≥ 0 and the date cannot be in the future." };
    case "42501": // insufficient_privilege: rejected by an RLS WITH CHECK
      return { ok: false, error: forbidden };
    default:
      console.error(fallback, error);
      return { ok: false, error: `${fallback} Please try again.` };
  }
}

export async function addReading(input: AddReadingInput): Promise<AddReadingResult> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return { ok: false, error: SESSION_EXPIRED };

  // site_id comes from the Site Manager's profile, never from the client.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, site_id")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "site_manager" || !profile.site_id) {
    return { ok: false, error: "No site is assigned to your account." };
  }

  if (!isEnergyType(input.energyType)) {
    return { ok: false, error: "Choose an energy type." };
  }
  const parsed = parseValueAndDate(input);
  if (!parsed.ok) return parsed;

  // created_by is filled by its DEFAULT auth.uid() and checked by RLS.
  const { error } = await supabase.from("readings").insert({
    site_id: profile.site_id,
    energy_type: input.energyType,
    value: parsed.value,
    date: parsed.date,
  });
  if (error) {
    return translateError(error, "Not allowed for your role.", "The reading could not be saved.");
  }

  refresh();
  return { ok: true };
}

// Value and date only: energy_type and site_id are never sent, so they cannot change.
export async function updateReading(input: UpdateReadingInput): Promise<ActionResult> {
  if (!UUID.test(input.id)) return { ok: false, error: "Invalid request." };
  const parsed = parseValueAndDate(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) return { ok: false, error: SESSION_EXPIRED };

  const { data, error } = await supabase
    .from("readings")
    .update({ value: parsed.value, date: parsed.date })
    .eq("id", input.id)
    .select("id");

  if (error) {
    // USING already limits rows to the user's site, so a 42501 here comes from
    // readings_update's WITH CHECK: created_by = auth.uid().
    return translateError(
      error,
      "Only the person who entered this reading can edit it. Delete it and add a new one instead.",
      "The reading could not be updated."
    );
  }
  // Hidden by RLS (other site or not allowed): no error, 0 rows.
  if (!data?.length) return { ok: false, error: "Reading not found or not allowed." };

  refresh();
  return { ok: true };
}

export async function deleteReading(id: string): Promise<ActionResult> {
  if (!UUID.test(id)) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) return { ok: false, error: SESSION_EXPIRED };

  const { data, error } = await supabase.from("readings").delete().eq("id", id).select("id");

  if (error) {
    console.error("deleteReading failed", error);
    return { ok: false, error: "The reading could not be deleted. Please try again." };
  }
  // A DELETE blocked by RLS does not raise an error: it matches 0 rows.
  if (!data?.length) return { ok: false, error: "Reading not found or not allowed." };

  refresh();
  return { ok: true };
}
