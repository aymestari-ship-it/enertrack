// Display-only reading of budgetPace (lib/ai/monthlyTotals.ts): no new calculation.

export type BudgetStatus = "on-track" | "ahead" | "over";

// usedPct and elapsedPct come from budgetPace. Without elapsedPct there is no status.
export function budgetStatus(usedPct: number, elapsedPct: number | null | undefined): BudgetStatus | null {
  if (elapsedPct == null || !Number.isFinite(elapsedPct)) return null;
  if (usedPct >= 100) return "over";
  return usedPct > elapsedPct ? "ahead" : "on-track";
}

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  "on-track": "On track",
  ahead: "Ahead of pace",
  over: "Over budget",
};

// A small non-zero share reads "<1%" rather than "0%".
export function percentLabel(pct: number) {
  return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
}
