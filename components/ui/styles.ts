// Shared Tailwind class strings, so every page uses the same cards, titles, buttons,
// fields and links. Colors come from the palette tokens in app/globals.css.

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// Layout
export const PAGE = "flex flex-1 flex-col bg-canvas text-ink";
// Content width ~1152 px (max-w-6xl), 24 px side padding on mobile, 32-40 px on desktop.
export const CONTAINER = "mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10";
export const MAIN = `${CONTAINER} flex-1 py-6 sm:py-8 lg:py-10`;
export const SECTION_GAP = "gap-6";
export const PAGE_TITLE = "text-2xl font-semibold tracking-tight text-ink sm:text-3xl";
export const PAGE_SUBTITLE = "mt-1 text-sm text-subtle sm:text-base";
export const SECTION_TITLE = "text-base font-semibold text-ink";
// Small grey capitals for table headers and stat labels.
export const EYEBROW = "text-xs font-medium uppercase tracking-wider text-subtle";

// Cards
// White, 1 px very light border, soft shadow, 16 px radius.
export const CARD =
  "rounded-2xl border border-line/70 bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.04)]";
export const CARD_BODY = "p-5 sm:p-6";

// Buttons: 44 px high everywhere (touch targets).
// One primary, one secondary, one destructive style; hover, focus and disabled are visible.
const BUTTON =
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${FOCUS}`;
export const BUTTON_PRIMARY = `${BUTTON} bg-brand text-white shadow-sm hover:bg-brand-hover disabled:hover:bg-brand`;
export const BUTTON_SECONDARY = `${BUTTON} border border-line-strong/70 bg-surface text-ink hover:border-line-strong hover:bg-canvas disabled:hover:bg-surface`;
export const BUTTON_DANGER = `${BUTTON} border border-danger/30 bg-surface text-danger hover:border-danger/60 hover:bg-danger-soft disabled:hover:bg-surface`;
// Inside table rows: 44 px on phones and tablets, 32 px from 1024 px up.
export const BUTTON_COMPACT = "lg:min-h-8 lg:px-3";

// Fields: 16 px text (no iOS zoom on focus) and 44 px high.
export const FIELD =
  "min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:bg-panel disabled:text-subtle";
// Inside table rows: same as FIELD on phones and tablets, smaller from 1024 px up.
export const FIELD_COMPACT = "lg:min-h-8 lg:px-2 lg:text-sm";
// Labels stay quieter than the values typed in the fields.
export const LABEL = "text-sm font-medium text-muted";

export const LINK = `rounded font-medium text-brand underline-offset-4 hover:underline ${FOCUS}`;

// Filter pills (toggle buttons): 44 px high, visible focus, pressed state via aria-pressed.
export const PILL =
  `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${FOCUS}`;
export const PILL_ON = "border-brand bg-brand text-white hover:bg-brand-hover";
export const PILL_OFF = "border-line-strong/60 bg-surface text-muted hover:border-line-strong hover:text-ink";

// Status badges
export const BADGE = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
export const BADGE_BRAND = `${BADGE} bg-brand-soft text-brand-ink`;
export const BADGE_NEUTRAL = `${BADGE} bg-line text-muted`;
