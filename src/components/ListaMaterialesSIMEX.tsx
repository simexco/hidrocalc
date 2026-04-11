"use client";

import { useState, useMemo } from "react";
import { getConexionSKU, getValvulaSKU, buildKitBrida, type KitItem } from "@/hooks/useSIMEXKit";
import { STANDARD_DNS_LABELED } from "@/lib/constants";

interface Accesorio {
  id: string;
  tipo: string;
  angulo?: string;
  dn2?: string;
}

interface Props {
  dn: string;
  material: string;
}

const DN_OPTIONS = STANDARD_DNS_LABELED.map((d) => d.label.split(" ")[0]); // ["2\"", "3\"", ...]

let idCounter = 0;
const nextId = () => `acc-${++idCounter}`;

export function ListaMaterialesSIMEX({ dn, material }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [accesorios, setAccesorios] = useState<Accesorio[]>([]);

  const addAcc = (tipo: string, angulo?: string, dn2?: string) => {
    setAccesorios((prev) => [...prev, { id: nextId(), tipo, angulo, dn2 }]);
  };

  const removeAcc = (id: string) => setAccesorios((prev) => prev.filter((a) => a.id !== id));

  // Build material list
  const items = useMemo(() => {
    const list: KitItem[] = [];
    let totalBridas = 0;

    for (const acc of accesorios) {
      if (acc.tipo === "codo") {
        const r = getConexionSKU("codo", dn, acc.angulo || "90°");
        if (r) { list.push({ sku: r.sku, descripcion: `Codo HD ${dn} x ${acc.angulo || "90°"}`, cantidad: 1, tipo: "pieza" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "tee") {
        const r = getConexionSKU("tee", dn, acc.dn2 || dn);
        if (r) { list.push({ sku: r.sku, descripcion: `Tee HD ${dn} x ${acc.dn2 || dn}`, cantidad: 1, tipo: "pieza" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "reduccion") {
        const r = getConexionSKU("reduccion", dn, acc.dn2);
        if (r) { list.push({ sku: r.sku, descripcion: `Reducción HD ${dn} x ${acc.dn2}`, cantidad: 1, tipo: "pieza" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "valvula_compuerta") {
        const r = getValvulaSKU("compuerta", dn);
        if (r) { list.push({ sku: r.sku, descripcion: `Válvula Compuerta ${dn}`, cantidad: 1, tipo: "valvula" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "valvula_check") {
        const r = getValvulaSKU("check", dn);
        if (r) { list.push({ sku: r.sku, descripcion: `Válvula Check ${dn}`, cantidad: 1, tipo: "valvula" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "valvula_mariposa") {
        const r = getValvulaSKU("mariposa", dn);
        if (r) { list.push({ sku: r.sku, descripcion: `Válvula Mariposa ${dn}`, cantidad: 1, tipo: "valvula" }); totalBridas += r.bridas; }
      }
    }

    // Add brida kit
    if (totalBridas > 0) {
      list.push(...buildKitBrida(dn, material, totalBridas));
    }

    // Consolidate duplicates
    const consolidated = new Map<string, KitItem>();
    for (const item of list) {
      const existing = consolidated.get(item.sku);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        consolidated.set(item.sku, { ...item });
      }
    }

    return Array.from(consolidated.values());
  }, [accesorios, dn, material]);

  const copyToClipboard = () => {
    const text = items.map((i) => `${i.sku}\t${i.descripcion}\t${i.cantidad}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1C3D5A] dark:text-blue-300">
          Materiales SIMEX para este tramo
        </h3>
        <button onClick={() => setCollapsed(!collapsed)} className="text-xs text-gray-400 hover:text-gray-600">
          {collapsed ? "Expandir" : "Ocultar"}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4">
          {/* Quick add buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => addAcc("codo", "90°")} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
              + Codo 90°
            </button>
            <button onClick={() => addAcc("codo", "45°")} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
              + Codo 45°
            </button>
            <button onClick={() => addAcc("tee")} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
              + Tee
            </button>
            <button onClick={() => addAcc("valvula_compuerta")} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
              + V. Compuerta
            </button>
            <button onClick={() => addAcc("valvula_check")} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
              + V. Check
            </button>
            <button onClick={() => addAcc("valvula_mariposa")} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
              + V. Mariposa
            </button>
          </div>

          {/* Added accessories */}
          {accesorios.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {accesorios.map((a) => (
                <span key={a.id} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                  {a.tipo === "codo" ? `Codo ${a.angulo}` : a.tipo === "tee" ? `Tee ${a.dn2 || dn}` : a.tipo === "reduccion" ? `Red ${dn}x${a.dn2}` : a.tipo.replace("valvula_", "V.")}
                  <button onClick={() => removeAcc(a.id)} className="text-blue-400 hover:text-blue-600">{"\u2717"}</button>
                </span>
              ))}
            </div>
          )}

          {/* Materials table */}
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1C3D5A] text-white">
                    <th className="px-2 py-1.5 text-left">SKU</th>
                    <th className="px-2 py-1.5 text-left">Descripción</th>
                    <th className="px-2 py-1.5 text-center">Cant.</th>
                    <th className="px-2 py-1.5 text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={`${item.sku}-${i}`} className={`border-b border-gray-100 dark:border-gray-700 ${item.tipo === "kit_brida" ? "bg-gray-50 dark:bg-gray-800/50 text-gray-500" : ""}`}>
                      <td className="px-2 py-1.5 font-mono">{item.sku}</td>
                      <td className="px-2 py-1.5">{item.descripcion}</td>
                      <td className="px-2 py-1.5 text-center font-mono">{item.cantidad}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`text-[9px] px-1 py-0.5 rounded ${
                          item.tipo === "pieza" ? "bg-blue-100 text-blue-700" :
                          item.tipo === "valvula" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>{item.tipo === "kit_brida" ? "Kit brida" : item.tipo === "valvula" ? "Válvula" : "Pieza"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">Agrega accesorios para ver la lista de materiales SIMEX</p>
          )}

          {/* Actions */}
          {items.length > 0 && (
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="text-[10px] text-[#1C3D5A] border border-[#1C3D5A]/20 px-2.5 py-1 rounded hover:bg-[#1C3D5A]/5 transition-colors">
                Copiar SKUs
              </button>
            </div>
          )}

          <p className="text-[9px] text-gray-400 leading-tight">
            Contacte a su distribuidor SIMEX autorizado para cotización. S.H.I. de México — simexco.com.mx
          </p>
        </div>
      )}
    </div>
  );
}
