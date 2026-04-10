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
            <th className="px-2 py-2 text-left">DN (mm)</th>
            <th className="px-2 py-2 text-right">V (m/s)</th>
            <th className="px-2 py-2 text-right">hf (m)</th>
            <th className="px-2 py-2 text-right">J (m/km)</th>
            {showPressure && <th className="px-2 py-2 text-right">P2 (kg/cm2)</th>}
            <th className="px-2 py-2 text-center" title="V >= 0.3 m/s">V min</th>
            <th className="px-2 py-2 text-center" title="V <= Vmax">V max</th>
            {showPressure && <th className="px-2 py-2 text-center">Pres.</th>}
            <th className="px-2 py-2 text-center">Estado</th>
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
                <td className="px-2 py-2 font-mono">
                  {row.dn}
                  {row.recommended && (
                    <span className="ml-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-1 py-0.5 rounded text-[10px] font-semibold">
                      REC
                    </span>
                  )}
                </td>
                <td className={`px-2 py-2 text-right font-mono ${row.V >= 0.3 && row.V < 0.5 ? "text-yellow-600" : ""}`}>
                  {formatNumber(row.V, 3)}
                  {row.V >= 0.3 && row.V < 0.5 && <span className="text-[8px] text-yellow-500 ml-0.5" title="Cumple mínimo (0.3) pero debajo del óptimo (0.5)">*</span>}
                </td>
                <td className="px-2 py-2 text-right font-mono">{formatNumber(row.hf, 2)}</td>
                <td className="px-2 py-2 text-right font-mono">{formatNumber(row.J_km, 2)}</td>
                {showPressure && (
                  <td className="px-2 py-2 text-right font-mono">
                    {row.P2 != null ? formatNumber(mcaToKgcm2(row.P2), 2) : "\u2014"}
                  </td>
                )}
                <td className="px-2 py-2 text-center">
                  {row.meetsVmin
                    ? <span className="text-green-600">&#10003;</span>
                    : <span className="text-red-500">&#10005;</span>
                  }
                </td>
                <td className="px-2 py-2 text-center">
                  {row.meetsVmax
                    ? <span className="text-green-600">&#10003;</span>
                    : <span className="text-red-500">&#10005;</span>
                  }
                </td>
                {showPressure && (
                  <td className="px-2 py-2 text-center">
                    {row.meetsPressure === true
                      ? <span className="text-green-600">&#10003;</span>
                      : row.meetsPressure === false
                        ? <span className="text-red-500">&#10005;</span>
                        : <span className="text-gray-400">\u2014</span>
                    }
                  </td>
                )}
                <td className="px-2 py-2 text-center">
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
      <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700 space-y-0.5">
        <p><strong>V min:</strong> V {"\u2265"} 0.3 m/s (mínimo absoluto NOM). <strong>V max:</strong> V {"\u2264"} velocidad máxima.</p>
        <p><span className="text-yellow-600">*</span> Velocidad entre 0.3 y 0.5 m/s — cumple mínimo pero está por debajo del rango óptimo (0.5-2.5 m/s).</p>
      </div>
    </div>
  );
}
