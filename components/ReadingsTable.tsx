import type { ReactNode } from "react";
import EditableReadingRow from "@/components/EditableReadingRow";
import { CELL, ROW, TABLE, TBODY, THEAD, VALUE_CELL } from "@/components/readingsTableStyles";
import { EmptyState } from "@/components/ui/Feedback";
import { ENERGY_UNITS, isEnergyType } from "@/lib/energy";
import { formatNumber } from "@/lib/format";

export type Reading = {
  id: string;
  energy_type: string;
  value: number;
  date: string;
};

// Pass `editing` to show Edit/Delete per row (/my-site); omit it for read-only (/sites/[id]).
export type ReadingsEditing = { today: string };

export default function ReadingsTable({
  readings,
  editing,
  emptyAction,
}: {
  readings: Reading[];
  editing?: ReadingsEditing;
  emptyAction?: ReactNode;
}) {
  if (!readings.length) {
    return <EmptyState action={emptyAction}>No readings yet.</EmptyState>;
  }

  return (
    <table className={TABLE}>
      <thead className={THEAD}>
        <tr className="border-b border-line">
          <th className="pb-3 pl-2 pr-3 font-medium">Date</th>
          <th className="pb-3 pr-3 font-medium">Energy type</th>
          <th className="pb-3 text-right font-medium">Value</th>
          {editing && <th className="pb-3 pl-4 pr-2 text-right font-medium">Actions</th>}
        </tr>
      </thead>
      <tbody className={TBODY}>
        {readings.map((r) =>
          editing ? (
            <EditableReadingRow
              key={r.id}
              reading={r}
              today={editing.today}
            />
          ) : (
            <tr key={r.id} className={ROW}>
              <td className={CELL}>{r.date}</td>
              <td className={`${CELL} capitalize`}>{r.energy_type}</td>
              <td className={VALUE_CELL}>
                {formatNumber(Number(r.value))}{" "}
                {isEnergyType(r.energy_type) ? ENERGY_UNITS[r.energy_type] : ""}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
