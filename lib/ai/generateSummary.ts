import "server-only";
import { GoogleGenAI } from "@google/genai";

// Stable Flash model with a free tier (ai.google.dev/gemini-api/docs/models, Oct 2026).
const MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `You explain energy consumption figures for one site to its manager.
Write 2 to 3 sentences in plain English, no markdown, no lists:
1. the main finding from the figures,
2. one possible cause, phrased as a possibility,
3. one concrete recommendation.
Use only the figures provided. Never invent numbers, dates, energy types or events.
If a figure is missing, do not guess it. The current month is partial: compare daily
averages or budget pace, not raw totals.
If an energy type has no readings this month, do not compare it.
If a line says the comparison rests on very few days, say so and that the trend
cannot be confirmed yet, instead of stating a clear increase or decrease.`;

export class AiConfigError extends Error {}
export class AiRateLimitError extends Error {}

export async function generateSummary(facts: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiConfigError("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const interaction = await ai.interactions.create({
      model: MODEL,
      system_instruction: SYSTEM_INSTRUCTION,
      input: `Figures for this site:\n${facts}`,
    });
    return interaction.output_text?.trim() ?? "";
  } catch (error) {
    // The SDK retries a 429 up to 4 times before throwing: backoff from ~0.5 s, or the
    // server's Retry-After, each wait capped at 8 s (about 32 s at most in total).
    const status = (error as { status?: number; statusCode?: number }).status
      ?? (error as { statusCode?: number }).statusCode;
    if (status === 429) throw new AiRateLimitError("Gemini rate limit exceeded");
    throw error;
  }
}
