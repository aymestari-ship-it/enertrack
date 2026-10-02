"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEnergyType } from "@/lib/energy";

export type AddReadingInput = {
  energyType: string;
  value: string;
  date: string;
};

export type AddReadingResult = { ok: true } | { ok: false; error: string };

export async function addReading(input: AddReadingInput): Promise<AddReadingResult> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return { ok: false, error: "Your session has expired. Please log in again." };

  // site_id comes from the Site Manager's profile, never from the client.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, site_id")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "site_manager" || !profile.site_id) {
    return { ok: false, error: "No site is assigned to your account." };
  }

  // Same rules as the database constraints, checked first for clearer messages.
  if (!isEnergyType(input.energyType)) {
    return { ok: false, error: "Choose an energy type." };
  }
  const value = Number(input.value);
  if (input.value.trim() === "" || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Value must be a number greater than or equal to 0." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Choose a valid date." };
  }

  // created_by is filled by its DEFAULT auth.uid() and checked by RLS.
  const { error } = await supabase.from("readings").insert({
    site_id: profile.site_id,
    energy_type: input.energyType,
    value,
    date: input.date,
  });

  if (error) {
    switch (error.code) {
      case "23505": // unique_violation: (site_id, energy_type, date)
        return { ok: false, error: "A reading already exists for this site, type and date." };
      case "23514": // check_violation: value >= 0, date <= current_date
        return { ok: false, error: "Value must be ≥ 0 and the date cannot be in the future." };
      case "42501": // insufficient_privilege: rejected by RLS
        return { ok: false, error: "Not allowed for your role." };
      default:
        console.error("addReading failed", error);
        return { ok: false, error: "The reading could not be saved. Please try again." };
    }
  }

  refresh();
  return { ok: true };
}
