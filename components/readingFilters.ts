// Client-side filters for the readings a dashboard already loaded (no extra query).
// Calendar months in UTC, from the server's `today` (YYYY-MM-DD), like the rest of the app.

export type Period = "this-month" | "last-month" | "3-months" | "all";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "3-months", label: "3 months" },
  { id: "all", label: "All" },
];

function monthStart(today: string, monthsBack: number) {
  const [y, m] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 - monthsBack, 1)).toISOString().slice(0, 10);
}

// [from, to) as YYYY-MM-DD strings; undefined = open-ended.
export function periodRange(period: Period, today: string): { from?: string; to?: string } {
  switch (period) {
    case "this-month":
      return { from: monthStart(today, 0) };
    case "last-month":
      return { from: monthStart(today, 1), to: monthStart(today, 0) };
    case "3-months": // current month and the two before it
      return { from: monthStart(today, 2) };
    default:
      return {};
  }
}

export function inPeriod(date: string, range: { from?: string; to?: string }) {
  return (!range.from || date >= range.from) && (!range.to || date < range.to);
}
