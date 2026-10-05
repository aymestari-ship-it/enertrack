// Deterministic formatting: identical output in Node (server render) and every browser,
// so no hydration mismatch. No toLocale*/Intl here on purpose.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// 1234567.891 -> "1,234,567.89"; trailing zeros dropped.
export function formatNumber(value: number, maxDecimals = 2) {
  if (!Number.isFinite(value)) return "—";
  const [int, dec] = Math.abs(value).toFixed(maxDecimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimals = dec?.replace(/0+$/, "");
  return `${value < 0 ? "-" : ""}${grouped}${decimals ? `.${decimals}` : ""}`;
}

// UTC timestamp (ms) of a calendar day -> "Oct 5" or "Oct 5, 2026".
export function formatDay(time: number, withYear = false) {
  const d = new Date(time);
  const day = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withYear ? `${day}, ${d.getUTCFullYear()}` : day;
}

// ISO timestamp -> "2026-10-05 06:11 UTC".
export function formatTimestampUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
