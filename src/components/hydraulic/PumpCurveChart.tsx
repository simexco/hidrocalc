"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

interface PumpCurveChartProps {
  systemCurve: { Q: number; H: number }[];
  pumpCurve: { Q: number; H: number }[];
  Qop: number | null;
  Hop: number | null;
}

export function PumpCurveChart({ systemCurve, pumpCurve, Qop, Hop }: PumpCurveChartProps) {
  // Merge curves into chart data keyed by Q
  const allQ = new Set([...systemCurve.map((p) => p.Q), ...pumpCurve.map((p) => p.Q)]);
  const sortedQ = Array.from(allQ).sort((a, b) => a - b);

  const sysMap = new Map(systemCurve.map((p) => [p.Q, p.H]));
  const pumpMap = new Map(pumpCurve.map((p) => [p.Q, p.H]));

  const data = sortedQ
    .filter((q) => sysMap.has(q) || pumpMap.has(q))
    .map((Q) => ({
      Q,
      sistema: sysMap.get(Q) ?? null,
      bomba: pumpMap.get(Q) ?? null,
    }));

  // Find max values for domain
  const maxQ = Math.max(...sortedQ, 10);
  const allH = data.flatMap((d) => [d.sistema, d.bomba].filter((v): v is number => v != null));
  const maxH = Math.max(...allH, 10);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Curvas del sistema y bomba</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="Q"
            domain={[0, maxQ]}
            label={{ value: "Caudal Q (L/s)", position: "insideBottom", offset: -10, style: { fontSize: 11 } }}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            domain={[0, Math.ceil(maxH * 1.1)]}
            label={{ value: "Altura H (m)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              `${Number(value).toFixed(2)} m`,
              String(name) === "sistema" ? "Curva del sistema" : "Curva de la bomba",
            ]}
            labelFormatter={(label: unknown) => `Q: ${label} L/s`}
          />
          <Legend formatter={(v: string) => v === "sistema" ? "Curva del sistema" : "Curva de la bomba"} />
          <Line type="monotone" dataKey="sistema" stroke="#1C3D5A" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="bomba" stroke="#DC2626" strokeWidth={2} dot={false} connectNulls />
          {Qop != null && Hop != null && (
            <ReferenceDot
              x={Qop}
              y={Hop}
              r={8}
              fill="#0F6E56"
              stroke="#fff"
              strokeWidth={2}
              label={{ value: `${Qop.toFixed(1)} L/s`, position: "top", style: { fontSize: 11, fontWeight: 700 } }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
