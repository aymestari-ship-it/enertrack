// Canonical unit per energy type (Design Document, Section 1).
export const ENERGY_UNITS = {
  electricity: "kWh",
  gas: "m³",
  fuel: "L",
  water: "m³",
} as const;

export type EnergyType = keyof typeof ENERGY_UNITS;

export const ENERGY_TYPES = Object.keys(ENERGY_UNITS) as EnergyType[];

export function isEnergyType(value: unknown): value is EnergyType {
  return typeof value === "string" && value in ENERGY_UNITS;
}
