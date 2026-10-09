"use client";

import { useState, useTransition } from "react";
import { assignSite, updateRole } from "@/app/(dashboard)/users/actions";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

export type UserRowData = {
  id: string;
  full_name: string | null;
  role: Role;
  site_id: string | null;
};

export type SiteOption = { id: string; name: string; status: string };

const SELECT =
  "rounded border border-line-strong bg-surface px-2 py-1 text-sm disabled:bg-panel disabled:text-subtle max-sm:w-full max-sm:min-h-11 max-sm:text-base";

// Below 640 px each row is a card: cells stack, and these labels replace the hidden headers.
const CELL = "max-sm:block max-sm:py-0";
const MOBILE_LABEL = "mb-1 block text-xs font-semibold text-muted sm:hidden";

export default function UserRow({
  user,
  sites,
  isMe,
}: {
  user: UserRowData;
  sites: SiteOption[];
  isMe: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Selects show the server value; they update after refresh() on success.
  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  // Archived sites cannot be newly assigned, but a current one stays visible.
  const options = sites.filter((s) => s.status === "active" || s.id === user.site_id);

  return (
    <tr className="border-b border-line align-top max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:py-4">
      <td className={`py-3 pr-3 font-medium sm:font-normal ${CELL}`}>
        {user.full_name || <span className="text-subtle">No name</span>}
        {isMe && <span className="ml-2 rounded bg-brand-soft px-1.5 text-xs text-brand-ink">You</span>}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </td>
      <td className={`py-3 pr-3 ${CELL}`}>
        <span className={MOBILE_LABEL} aria-hidden="true">Role</span>
        <select
          aria-label="Role"
          value={user.role}
          disabled={pending || isMe}
          title={isMe ? "You cannot change your own role" : undefined}
          onChange={(e) => run(() => updateRole(user.id, e.target.value))}
          className={SELECT}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </td>
      <td className={`py-3 ${CELL}`}>
        <span className={MOBILE_LABEL} aria-hidden="true">Assigned site</span>
        {user.role === "site_manager" ? (
          <select
            aria-label="Assigned site"
            value={user.site_id ?? ""}
            disabled={pending}
            onChange={(e) => run(() => assignSite(user.id, e.target.value || null))}
            className={SELECT}
          >
            <option value="">— Pending (no site) —</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.status === "archived" ? " (archived)" : ""}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-subtle">All sites</span>
        )}
      </td>
    </tr>
  );
}
