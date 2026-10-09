// Shared by ReadingsTable (read-only rows) and EditableReadingRow.
// Below 640 px (max-sm) the table is laid out as wrapping blocks instead of columns,
// so a row never needs more width than its card.
export const TABLE = "w-full text-left text-sm max-sm:block";
export const THEAD = "text-xs uppercase tracking-wide text-subtle max-sm:hidden";
export const TBODY = "max-sm:block";
export const ROW =
  "border-b border-line last:border-b-0 max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-2 max-sm:py-3";
export const CELL = "py-2.5 pr-3 max-sm:py-0 max-sm:pr-0";
export const VALUE_CELL = "py-2.5 text-right font-medium tabular-nums max-sm:ml-auto max-sm:py-0";
export const ACTIONS_CELL = "py-2.5 pl-4 text-right whitespace-nowrap max-sm:basis-full max-sm:p-0 max-sm:text-left";
