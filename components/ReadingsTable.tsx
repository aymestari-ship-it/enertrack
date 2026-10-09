import EditableReadingRow from "@/components/EditableReadingRow";
import { CELL, ROW, TABLE, TBODY, THEAD, VALUE_CELL } from "@/components/readingsTableStyles";
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
}: {
  readings: Reading[];
  editing?: ReadingsEditing;
}) {
  if (!readings.length) {
    return <p className="text-sm text-neutral-600">No readings yet.</p>;
  }

  return (
    <table className={TABLE}>
      <thead className={THEAD}>
        <tr className="border-b border-neutral-300">
          <th className="py-2">Date</th>
          <th className="py-2">Energy type</th>
          <th className="py-2 text-right">Value</th>
          {editing && <th className="py-2 pl-4 text-right">Actions</th>}
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
