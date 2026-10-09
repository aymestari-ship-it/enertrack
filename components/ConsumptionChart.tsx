"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ENERGY_TYPES, ENERGY_UNITS, type EnergyType } from "@/lib/energy";
import { formatDay, formatNumber } from "@/lib/format";

type ChartReading = {
  energy_type: string;
  value: number;
  date: string; // YYYY-MM-DD
};

const SERIES_COLOR = "#0d9488"; // teal-600, validated against the white panel
const SURFACE = "#ffffff";
const GRID = "#e5e5e5";
const AXIS_TEXT = "#525252";
const DAY_MS = 24 * 60 * 60 * 1000;
// Above this many points, 8 px dots overlap and hide the line: draw the line only.
// The hover dot and tooltip stay.
const MAX_POINTS_WITH_DOTS = 24;

// Dates are calendar days: parse them in UTC so the time zone never shifts them.
function toTime(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// Small multiples: one chart per energy type, each with its own y-axis and unit.
export default function ConsumptionChart({ readings }: { readings: ChartReading[] }) {
  const points = readings.map((r) => ({ ...r, time: toTime(r.date), value: Number(r.value) }));

  // Shared time domain so the four charts line up; padded by a day for single points.
  const times = points.map((p) => p.time);
  const domain: [number, number] = times.length
    ? [Math.min(...times) - DAY_MS, Math.max(...times) + DAY_MS]
    : [0, 0];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ENERGY_TYPES.map((type) => (
        <EnergyPanel
          key={type}
          type={type}
          data={points.filter((p) => p.energy_type === type).sort((a, b) => a.time - b.time)}
          domain={domain}
        />
      ))}
    </div>
  );
}

function EnergyPanel({
  type,
  data,
  domain,
}: {
  type: EnergyType;
  data: { time: number; value: number }[];
  domain: [number, number];
}) {
  const unit = ENERGY_UNITS[type];
  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <figure className="rounded border border-neutral-300 bg-white p-3">
      <figcaption className="mb-2 text-sm font-semibold">
        {title} <span className="font-normal text-neutral-500">({unit})</span>
      </figcaption>

      {data.length === 0 ? (
        <p className="flex h-40 items-center justify-center text-sm text-neutral-500">
          No readings yet
        </p>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={domain}
                tickFormatter={(t: number) => formatDay(t)}
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                stroke={GRID}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                unit={` ${unit}`}
                tickFormatter={(v: number) => formatNumber(v)}
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                axisLine={false}
                tickLine={false}
                width={72}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: AXIS_TEXT, strokeWidth: 1 }}
                labelFormatter={(t) => formatDay(Number(t), true)}
                formatter={(v) => [`${formatNumber(Number(v))} ${unit}`, title]}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke={SERIES_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={
                  data.length <= MAX_POINTS_WITH_DOTS
                    ? { r: 4, fill: SERIES_COLOR, stroke: SURFACE, strokeWidth: 2 }
                    : false
                }
                activeDot={{ r: 5, fill: SERIES_COLOR, stroke: SURFACE, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
