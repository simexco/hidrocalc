"use client";

import { v4 as uuid } from "uuid";
import { FITTINGS_CATALOG, G } from "@/lib/constants";
import type { Fitting } from "@/types/hydraulic";

interface FittingsTableProps {
  fittings: Fitting[];
  velocity: number | null;
  onAdd: (fitting: Fitting) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Fitting>) => void;
}

export function FittingsTable({ fittings, velocity, onAdd, onRemove, onUpdate }: FittingsTableProps) {
  const velocityHead = velocity ? velocity * velocity / (2 * G) : 0;

  const handleAdd = () => {
    const catalog = FITTINGS_CATALOG[0];
    onAdd({
      id: uuid(),
      type: catalog.type,
      k: catalog.k,
      quantity: 1,
      hmPartial: catalog.k * 1 * velocityHead,
    });
  };

  const handleTypeChange = (id: string, typeName: string) => {
    const cat = FITTINGS_CATALOG.find((c) => c.type === typeName);
    if (cat) {
      onUpdate(id, { type: cat.type, k: cat.k });
    }
  };

  // Totals
  const totalK = fittings.reduce((sum, f) => sum + f.k * f.quantity, 0);
  const totalHm = totalK * velocityHead;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accesorios</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors"
        >
          + Accesorio
        </button>
      </div>

      {fittings.length === 0 ? (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800">
          &#9888; Sin accesorios — se asumira hm = 10% de hf (regla empirica)
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left px-2 py-2">Accesorio</th>
                <th className="text-center px-2 py-2 w-14">K</th>
                <th className="text-center px-2 py-2 w-16">Cant.</th>
                <th className="text-right px-2 py-2 w-20">hm (m)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {fittings.map((f) => {
                const hmPartial = f.k * f.quantity * velocityHead;
                const isCustom = f.type === "Personalizado";
                return (
                  <tr key={f.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-2 py-1.5">
                      <select
                        value={f.type}
                        onChange={(e) => handleTypeChange(f.id, e.target.value)}
                        className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1"
                      >
                        {FITTINGS_CATALOG.map((c) => (
                          <option key={c.type} value={c.type}>{c.type} (K={c.k})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs font-mono text-gray-500">
                      {isCustom ? (
                        <input
                          type="number"
                          value={f.k}
                          onChange={(e) => onUpdate(f.id, { k: parseFloat(e.target.value) || 0 })}
                          step="0.01"
                          className="w-12 text-center text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5"
                        />
                      ) : (
                        <span>{f.k}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        value={f.quantity}
                        onChange={(e) => onUpdate(f.id, { quantity: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="w-12 text-center text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right text-xs font-mono">
                      {isFinite(hmPartial) ? hmPartial.toFixed(3) : "\u2014"}
                    </td>
                    <td className="px-1 py-1.5">
                      <button
                        type="button"
                        onClick={() => onRemove(f.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        {"\u2717"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-medium">
                <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">Total</td>
                <td className="px-2 py-1.5 text-center font-mono text-gray-600">{totalK.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-center text-gray-400">{fittings.reduce((s, f) => s + f.quantity, 0)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-gray-700 dark:text-gray-300">{isFinite(totalHm) ? totalHm.toFixed(3) : "\u2014"}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
