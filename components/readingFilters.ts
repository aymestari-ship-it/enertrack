// Client-side filters for the readings a dashboard already loaded (no extra query).
// Calendar months in UTC, from the server's `today` (YYYY-MM-DD), like the rest of the app.

export type Period = "this-month" | "last-month" | "3-months" | "all" | "custom";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "3-months", label: "3 months" },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
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
    default: // "all"; "custom" uses customRange() instead
      return {};
  }
}

export function inPeriod(date: string, range: { from?: string; to?: string }) {
  return (!range.from || date >= range.from) && (!range.to || date < range.to);
}

// ---- Custom period ----

export type CustomRange = { from: string; to: string }; // both YYYY-MM-DD, both included

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isRealDay(date: string) {
  if (!ISO_DAY.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function nextDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

// Validates From / To (UTC calendar days, both included) and turns them into the
// [from, to) range used by inPeriod(). From = To selects that single day.
export function customRange(
  from: string,
  to: string
): { ok: true; range: { from: string; to: string } } | { ok: false; error: string } {
  if (!from || !to) return { ok: false, error: "Choose both a start and an end date." };
  if (!isRealDay(from) || !isRealDay(to)) return { ok: false, error: "Enter valid dates." };
  if (from > to) return { ok: false, error: "The start date must be on or before the end date." };
  return { ok: true, range: { from, to: nextDay(to) } };
}
