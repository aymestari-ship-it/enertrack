import { ENERGY_UNITS, isEnergyType } from "@/lib/energy";
import { formatNumber } from "@/lib/format";

export type Reading = {
  id: string;
  energy_type: string;
  value: number;
  date: string;
};

export default function ReadingsTable({ readings }: { readings: Reading[] }) {
  if (!readings.length) {
    return <p className="text-sm text-neutral-600">No readings yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-300">
          <th className="py-2">Date</th>
          <th className="py-2">Energy type</th>
          <th className="py-2 text-right">Value</th>
        </tr>
      </thead>
      <tbody>
        {readings.map((r) => (
          <tr key={r.id} className="border-b border-neutral-200">
            <td className="py-2">{r.date}</td>
            <td className="py-2 capitalize">{r.energy_type}</td>
            <td className="py-2 text-right tabular-nums">
              {formatNumber(Number(r.value))}{" "}
              {isEnergyType(r.energy_type) ? ENERGY_UNITS[r.energy_type] : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
