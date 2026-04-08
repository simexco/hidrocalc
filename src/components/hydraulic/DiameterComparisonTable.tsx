"use client";

import type { DiameterComparisonRow } from "@/types/hydraulic";
import { formatNumber, mcaToKgcm2 } from "@/lib/calculations/conversions";

interface DiameterComparisonTableProps {
  rows: DiameterComparisonRow[];
  showPressure: boolean;
}

export function DiameterComparisonTable({ rows, showPressure }: DiameterComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1C3D5A] text-white text-xs">
            <th className="px-3 py-2 text-left">DN (mm)</th>
            <th className="px-3 py-2 text-right">V (m/s)</th>
            <th className="px-3 py-2 text-right">hf (m)</th>
            <th className="px-3 py-2 text-right">J (m/km)</th>
            {showPressure && <th className="px-3 py-2 text-right">P₂ (kg/cm²)</th>}
            <th className="px-3 py-2 text-center">Vel.</th>
            {showPressure && <th className="px-3 py-2 text-center">Pres.</th>}
            <th className="px-3 py-2 text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const meetsAll = row.meetsVelocity && (row.meetsPressure === true || row.meetsPressure === null);
            const rowBg = row.recommended
              ? "bg-green-50 dark:bg-green-900/20 font-medium"
              : !meetsAll
                ? "bg-red-50/50 dark:bg-red-900/10"
                : i % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50 dark:bg-gray-800/50";

            return (
              <tr key={row.dn} className={`${rowBg} border-b border-gray-100 dark:border-gray-700 text-xs`}>
                <td className="px-3 py-2 font-mono">
                  {row.dn}
                  {row.recommended && (
                    <span className="ml-2 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      RECOMENDADO
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono">{formatNumber(row.V, 3)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatNumber(row.hf, 2)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatNumber(row.J_km, 2)}</td>
                {showPressure && (
                  <td className="px-3 py-2 text-right font-mono">
                    {row.P2 != null ? formatNumber(mcaToKgcm2(row.P2), 2) : "—"}
                  </td>
                )}
                <td className="px-3 py-2 text-center">
                  {row.meetsVelocity
                    ? <span className="text-green-600">&#10003;</span>
                    : <span className="text-red-500">&#10005;</span>
                  }
                </td>
                {showPressure && (
                  <td className="px-3 py-2 text-center">
                    {row.meetsPressure === true
                      ? <span className="text-green-600">&#10003;</span>
                      : row.meetsPressure === false
                        ? <span className="text-red-500">&#10005;</span>
                        : <span className="text-gray-400">—</span>
                    }
                  </td>
                )}
                <td className="px-3 py-2 text-center">
                  {row.recommended
                    ? <span className="text-green-700 dark:text-green-400 font-semibold">&#10003; OK</span>
                    : meetsAll
                      ? <span className="text-green-600">OK</span>
                      : <span className="text-red-500">No cumple</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
