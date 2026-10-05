import { createClient } from "@/lib/supabase/server";
import { computeMonthlyTotals, previousMonthStart } from "@/lib/ai/monthlyTotals";
import { AiConfigError, AiRateLimitError, generateSummary } from "@/lib/ai/generateSummary";

// POST /api/ai-summary (Design Document, Section 4).
// Every query runs as the signed-in user, so RLS decides what is visible and writable.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) {
    return fail(401, "UNAUTHENTICATED", "No valid session");
  }

  const body = await request.json().catch(() => null);
  const siteId = body?.site_id;
  if (typeof siteId !== "string" || !UUID.test(siteId)) {
    return fail(422, "VALIDATION_ERROR", "site_id must be a valid UUID");
  }

  // RLS: returns nothing if the site does not exist or is not visible to this user.
  const { data: site } = await supabase
    .from("sites")
    .select("id, monthly_budget_kwh")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) {
    return fail(404, "NOT_FOUND", "Site not found");
  }

  const { data: readings, error: readingsError } = await supabase
    .from("readings")
    .select("energy_type, value, date")
    .eq("site_id", siteId)
    .gte("date", previousMonthStart());
  if (readingsError) {
    console.error("ai-summary: readings query failed", readingsError);
    return fail(500, "INTERNAL_ERROR", "Readings could not be loaded");
  }

  const totals = computeMonthlyTotals(readings ?? [], site.monthly_budget_kwh);
  if (totals.usableCount < 2) {
    return fail(
      422,
      "VALIDATION_ERROR",
      "At least 2 readings from this month or last month are needed to generate a summary"
    );
  }

  let summaryText: string;
  try {
    summaryText = await generateSummary(totals.facts);
  } catch (error) {
    if (error instanceof AiRateLimitError) {
      return fail(429, "RATE_LIMITED", "The AI service is busy. Please try again in a minute.");
    }
    if (error instanceof AiConfigError) {
      console.error("ai-summary:", error.message);
      return fail(500, "INTERNAL_ERROR", "The AI service is not configured");
    }
    console.error("ai-summary: Gemini call failed", error);
    return fail(502, "AI_ERROR", "The summary could not be generated. Please try again.");
  }
  if (!summaryText) {
    return fail(502, "AI_ERROR", "The AI service returned an empty summary. Please try again.");
  }

  // created_by is filled by DEFAULT auth.uid(); RLS checks role, site and author.
  const { data: summary, error: insertError } = await supabase
    .from("ai_summaries")
    .insert({ site_id: siteId, summary_text: summaryText })
    .select("id, site_id, summary_text, created_at")
    .single();
  if (insertError) {
    if (insertError.code === "42501") {
      return fail(403, "FORBIDDEN", "Not allowed for your role");
    }
    console.error("ai-summary: insert failed", insertError);
    return fail(500, "INTERNAL_ERROR", "The summary could not be saved");
  }

  return Response.json({ data: summary }, { status: 201 });
}
