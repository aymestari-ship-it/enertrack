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
import { EmptyState } from "@/components/ui/Feedback";

type ChartReading = {
  energy_type: string;
  value: number;
  date: string; // YYYY-MM-DD
};

// Palette values from app/globals.css (recharts writes them as SVG attributes,
// where CSS variables are not reliably resolved).
// One color per energy type (--color-energy-* in globals.css).
const ENERGY_COLORS: Record<EnergyType, string> = {
  electricity: "#008a7c",
  gas: "#c2410c",
  fuel: "#a21caf",
  water: "#2563eb",
};
const SURFACE = "#ffffff"; // --color-surface
const GRID = "#dce3e3"; // --color-line
const AXIS_TEXT = "#4f5b5d"; // --color-muted
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
export default function ConsumptionChart({
  readings,
  emptyLabel = "No readings yet",
}: {
  readings: ChartReading[];
  emptyLabel?: string;
}) {
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
          emptyLabel={emptyLabel}
        />
      ))}
    </div>
  );
}

function EnergyPanel({
  type,
  data,
  domain,
  emptyLabel,
}: {
  type: EnergyType;
  data: { time: number; value: number }[];
  domain: [number, number];
  emptyLabel: string;
}) {
  const unit = ENERGY_UNITS[type];
  const color = ENERGY_COLORS[type];
  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <figure className="rounded-lg border border-line bg-surface p-3">
      <figcaption className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        {title} <span className="font-normal text-subtle">({unit})</span>
      </figcaption>

      {data.length === 0 ? (
        <EmptyState className="h-40">{emptyLabel}</EmptyState>
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
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={
                  data.length <= MAX_POINTS_WITH_DOTS
                    ? { r: 4, fill: color, stroke: SURFACE, strokeWidth: 2 }
                    : false
                }
                activeDot={{ r: 5, fill: color, stroke: SURFACE, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
