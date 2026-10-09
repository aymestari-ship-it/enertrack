import type { EnergyType } from "@/lib/energy";

// One color per energy type (--color-energy-* in app/globals.css), as hex values:
// recharts writes them as SVG attributes, where CSS variables are not reliably resolved.
export const ENERGY_COLORS: Record<EnergyType, string> = {
  electricity: "#008a7c",
  gas: "#c2410c",
  fuel: "#a21caf",
  water: "#2563eb",
};
