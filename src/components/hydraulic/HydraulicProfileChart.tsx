"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from "recharts";

interface ProfilePoint {
  x: number;         // distance (m)
  terrain: number;   // z (m)
  piezo: number | null;  // piezometric line (m)
}

interface HydraulicProfileChartProps {
  points: ProfilePoint[];
  title?: string;
}

export function HydraulicProfileChart({ points, title }: HydraulicProfileChartProps) {
  if (points.length < 2) return null;

  // Calculate Y axis bounds
  const allY = points.flatMap((p) => [p.terrain, p.piezo ?? p.terrain]);
  const minY = Math.floor(Math.min(...allY) - 5);
  const maxY = Math.ceil(Math.max(...allY) + 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {title && <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={points} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            label={{ value: "Distancia (m)", position: "insideBottom", offset: -10, style: { fontSize: 11 } }}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            domain={[minY, maxY]}
            label={{ value: "Elevación (m)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              `${Number(value).toFixed(2)} m`,
              String(name) === "piezo" ? "Línea piezométrica" : "Terreno",
            ]}
            labelFormatter={(label: unknown) => `Distancia: ${label} m`}
          />
          <Legend
            formatter={(value: string) => value === "piezo" ? "Línea piezométrica" : "Terreno"}
          />
          <Area
            type="monotone"
            dataKey="terrain"
            stroke="#8B6914"
            fill="#D4A853"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="piezo"
            stroke="#1C3D5A"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
