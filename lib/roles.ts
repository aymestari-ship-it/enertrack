export const ROLES = ["site_manager", "energy_manager", "direction"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  site_manager: "Site Manager",
  energy_manager: "Energy Manager",
  direction: "Direction",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
