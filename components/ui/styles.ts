// Shared Tailwind class strings, so every page uses the same cards, titles, buttons,
// fields and links. Colors come from the palette tokens in app/globals.css.

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// Layout
export const PAGE = "flex flex-1 flex-col bg-canvas text-ink";
export const MAIN = "mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8";
export const PAGE_TITLE = "text-2xl font-semibold tracking-tight text-ink";
export const SECTION_TITLE = "text-base font-semibold text-ink";

// Cards
export const CARD = "rounded-xl border border-line bg-surface shadow-sm";
export const CARD_BODY = "p-4 sm:p-5";

// Buttons: 44 px high everywhere (touch targets).
const BUTTON =
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;
export const BUTTON_PRIMARY = `${BUTTON} bg-brand text-white hover:bg-brand-hover`;
export const BUTTON_SECONDARY = `${BUTTON} border border-line-strong bg-surface text-ink hover:bg-panel`;
export const BUTTON_DANGER = `${BUTTON} border border-danger/40 bg-surface text-danger hover:bg-danger-soft`;
// Inside table rows: still 44 px on mobile, 32 px from 640 px up.
export const BUTTON_COMPACT = "sm:min-h-8 sm:px-3";

// Fields: 16 px text (no iOS zoom on focus) and 44 px high.
export const FIELD =
  "min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:bg-panel disabled:text-subtle";
// Inside table rows: same as FIELD on mobile, smaller from 640 px up.
export const FIELD_COMPACT = "sm:min-h-8 sm:px-2 sm:text-sm";
export const LABEL = "text-sm font-medium text-ink";

export const LINK = `rounded font-medium text-brand underline-offset-4 hover:underline ${FOCUS}`;

// Status badges
export const BADGE = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
export const BADGE_BRAND = `${BADGE} bg-brand-soft text-brand-ink`;
export const BADGE_NEUTRAL = `${BADGE} bg-line text-muted`;
