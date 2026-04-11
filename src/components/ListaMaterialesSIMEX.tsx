"use client";

import { useState, useMemo, useCallback } from "react";
import { getConexionSKU, getValvulaSKU, buildKitBrida, type KitItem, type AccesorioCalc, MATERIAL_MAP, DN_MM_TO_STR } from "@/hooks/useSIMEXKit";
import { STANDARD_DNS_LABELED } from "@/lib/constants";

interface Props {
  dnMm: number;
  materialName: string;
  accesorios: AccesorioCalc[];
  onAddAccesorio: (acc: AccesorioCalc) => void;
  onRemoveAccesorio: (id: string) => void;
}

let idCounter = 0;
const nextId = () => `acc-${++idCounter}-${Date.now()}`;

const FUNCTIONS = [
  { key: "direccion", icon: "↩", title: "Cambio de dirección", sub: "Codo" },
  { key: "bifurcacion", icon: "⑂", title: "Bifurcación", sub: "Tee" },
  { key: "seccionamiento", icon: "⊕", title: "Seccionamiento", sub: "Válvula compuerta" },
  { key: "reduccion", icon: "▷", title: "Reducción", sub: "Cambio de DN" },
  { key: "antiretorno", icon: "→|", title: "Antiretorno", sub: "Válvula check" },
  { key: "fin", icon: "◉", title: "Fin de línea", sub: "Tapón bridado" },
];

export function AccesoriosSection({ dnMm, materialName, accesorios, onAddAccesorio, onRemoveAccesorio }: Props) {
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const smallerDNs = STANDARD_DNS_LABELED.filter((d) => d.dn < dnMm).map((d) => DN_MM_TO_STR[d.dn]).filter(Boolean);

  const handleAdd = useCallback((tipo: string, label: string, angulo?: string, dn2?: string) => {
    onAddAccesorio({ id: nextId(), tipo, label, cantidad: 1, angulo, dn2 });
    setActiveFunc(null);
  }, [onAddAccesorio]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accesorios del tramo</h2>
        <p className="text-[10px] text-gray-400 mt-0.5">Mejoran la precisión del cálculo y generan la lista de materiales SIMEX</p>
      </div>

      {/* Function cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FUNCTIONS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              if (f.key === "seccionamiento") {
                handleAdd("valvula-compuerta", `V. Compuerta ${dn}`);
              } else if (f.key === "antiretorno") {
                handleAdd("check-resilente", `V. Check ${dn}`);
              } else if (f.key === "fin") {
                handleAdd("fin-linea", `Tapón ${dn}`);
              } else {
                setActiveFunc(activeFunc === f.key ? null : f.key);
              }
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeFunc === f.key
                ? "border-[#1C3D5A] bg-[#1C3D5A]/5 ring-1 ring-[#1C3D5A]/30"
                : "border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <span className="text-lg block mb-1">{f.icon}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">{f.title}</span>
            <span className="text-[10px] text-gray-400">{f.sub}</span>
          </button>
        ))}
      </div>

      {/* Sub-selectors */}
      {activeFunc === "direccion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Ángulo del codo:</p>
          <div className="flex gap-2">
            {["11°", "22°", "45°", "90°"].map((a) => (
              <button key={a} onClick={() => handleAdd(`codo-${a.replace("°", "")}`, `Codo ${dn} × ${a}`, a)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">{a}</button>
            ))}
          </div>
        </div>
      )}

      {activeFunc === "bifurcacion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">¿El ramal es igual o menor diámetro?</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => handleAdd("tee-lateral", `Tee ${dn} × ${dn}`)}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">
              Igual al DN principal ({dn})
            </button>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] text-gray-400">Ramal de menor diámetro:</p>
              <div className="flex flex-wrap gap-1">
                {smallerDNs.map((d) => (
                  <button key={d} onClick={() => handleAdd("tee-lateral", `Tee ${dn} × ${d}`, undefined, d)}
                    className="px-2 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeFunc === "reduccion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Reducir a:</p>
          <div className="flex flex-wrap gap-1">
            {smallerDNs.map((d) => (
              <button key={d} onClick={() => handleAdd("reduccion", `Reducción ${dn} × ${d}`, undefined, d)}
                className="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-600 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d}</button>
            ))}
          </div>
        </div>
      )}

      {/* Added accessories */}
      {accesorios.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">Accesorios agregados:</p>
          <div className="flex flex-wrap gap-1.5">
            {accesorios.map((a) => (
              <span key={a.id} className="text-[11px] bg-[#E9EFF5] text-[#1C3D5A] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                {a.label}
                <button onClick={() => onRemoveAccesorio(a.id)} className="text-[#1C3D5A]/40 hover:text-red-500 ml-0.5">{"\u2717"}</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {accesorios.length === 0 && (
        <p className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800">
          Sin accesorios — las pérdidas menores se estimarán como 10% de hf
        </p>
      )}
    </div>
  );
}

// ── Materials list (shown below results) ──
export function MaterialesSIMEXTable({ dnMm, materialName, accesorios }: { dnMm: number; materialName: string; accesorios: AccesorioCalc[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const simexMat = MATERIAL_MAP[materialName] || "PVC AWWA C900";

  const items = useMemo(() => {
    const list: KitItem[] = [];
    let totalBridas = 0;

    for (const acc of accesorios) {
      if (acc.tipo.startsWith("codo")) {
        const r = getConexionSKU("codo", dn, acc.angulo || "90°");
        if (r) { list.push({ sku: r.sku, descripcion: r.desc, cantidad: 1, tipo: "pieza" }); totalBridas += r.bridas; }
      } else if (acc.tipo.includes("tee")) {
        const r = getConexionSKU("tee", dn, acc.dn2 || dn);
        if (r) { list.push({ sku: r.sku, descripcion: r.desc, cantidad: 1, tipo: "pieza" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "reduccion") {
        const r = getConexionSKU("reduccion", dn, acc.dn2);
        if (r) { list.push({ sku: r.sku, descripcion: r.desc, cantidad: 1, tipo: "pieza" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "valvula-compuerta") {
        const r = getValvulaSKU("compuerta", dn);
        if (r) { list.push({ sku: r.sku, descripcion: `V. Compuerta Resilente ${dn} (${r.norma})`, cantidad: 1, tipo: "valvula" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "check-resilente") {
        const r = getValvulaSKU("check", dn);
        if (r) { list.push({ sku: r.sku, descripcion: `V. Check Resilente ${dn}`, cantidad: 1, tipo: "valvula" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "valvula-mariposa") {
        const r = getValvulaSKU("mariposa", dn);
        if (r) { list.push({ sku: r.sku, descripcion: `V. Mariposa ${dn}`, cantidad: 1, tipo: "valvula" }); totalBridas += r.bridas; }
      } else if (acc.tipo === "fin-linea") {
        list.push({ sku: `CI-TAP-${dn.replace('"', "")}`, descripcion: `Tapón Bridado HD ${dn}`, cantidad: 1, tipo: "pieza" });
        totalBridas += 1;
      }
    }

    const bridaItems = totalBridas > 0 ? buildKitBrida(dn, simexMat, totalBridas) : [];
    // Consolidate
    const all = [...list, ...bridaItems];
    const consolidated = new Map<string, KitItem>();
    for (const item of all) {
      const existing = consolidated.get(item.sku);
      if (existing) existing.cantidad += item.cantidad;
      else consolidated.set(item.sku, { ...item });
    }
    return { piezas: Array.from(consolidated.values()).filter((i) => i.tipo !== "kit_brida"), kit: Array.from(consolidated.values()).filter((i) => i.tipo === "kit_brida"), totalBridas };
  }, [accesorios, dn, simexMat]);

  if (accesorios.length === 0) return null;

  const copyToClipboard = () => {
    const all = [...items.piezas, ...items.kit];
    navigator.clipboard.writeText(all.map((i) => `${i.sku}\t${i.descripcion}\t${i.cantidad}`).join("\n"));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#1C3D5A]/20 overflow-hidden">
      <div className="bg-[#1C3D5A] px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Lista de materiales SIMEX</h3>
        <div className="flex gap-2">
          <button onClick={copyToClipboard} className="text-[10px] text-white/70 hover:text-white transition-colors">Copiar SKUs</button>
          <button onClick={() => setCollapsed(!collapsed)} className="text-[10px] text-white/50 hover:text-white">{collapsed ? "▼" : "▲"}</button>
        </div>
      </div>

      {!collapsed && (
        <>
          {items.piezas.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Piezas principales</div>
              {items.piezas.map((item, i) => (
                <div key={`p-${i}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 text-xs">
                  <span className="font-mono text-[#1C3D5A] dark:text-blue-300 w-28">{item.sku}</span>
                  <span className="flex-1 text-gray-600 dark:text-gray-400 ml-2">{item.descripcion}</span>
                  <span className="font-mono text-gray-500 ml-2">×{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}
          {items.kit.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Kit de conexión ({items.totalBridas} bridas)
              </div>
              {items.kit.map((item, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 dark:border-gray-700 text-xs text-gray-400">
                  <span className="font-mono w-28">{item.sku}</span>
                  <span className="flex-1 ml-2">{item.descripcion}</span>
                  <span className="font-mono ml-2">×{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}
          <div className="px-3 py-2 text-[9px] text-gray-400">
            Contacte a su distribuidor SIMEX autorizado para cotización · simexco.com.mx
          </div>
        </>
      )}
    </div>
  );
}
