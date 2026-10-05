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
averages or budget pace, not raw totals.`;

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
    // The SDK already retries 429s with backoff (up to ~30 s) before throwing.
    const status = (error as { status?: number; statusCode?: number }).status
      ?? (error as { statusCode?: number }).statusCode;
    if (status === 429) throw new AiRateLimitError("Gemini rate limit exceeded");
    throw error;
  }
}
