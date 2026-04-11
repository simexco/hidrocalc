"use client";

import { useState, useMemo, useCallback } from "react";
import { getConexionSKU, getValvulaSKU, buildKitBrida, hasABU, type KitItem, type AccesorioCalc, type KitOpcion, MATERIAL_MAP, DN_MM_TO_STR } from "@/hooks/useSIMEXKit";
import { STANDARD_DNS_LABELED } from "@/lib/constants";

interface AccesoriosProps {
  dnMm: number;
  materialName: string;
  accesorios: AccesorioCalc[];
  onAddAccesorio: (acc: AccesorioCalc) => void;
  onRemoveAccesorio: (id: string) => void;
  onClearAll: () => void;
}

let idCounter = 0;
const nextId = () => `acc-${++idCounter}-${Date.now()}`;

const FUNCTIONS_ROW1 = [
  { key: "direccion", icon: "\u21A9", title: "Cambio de dirección", sub: "Codo" },
  { key: "bifurcacion", icon: "\u2442", title: "Bifurcación", sub: "Tee / Abrazadera" },
  { key: "seccionamiento", icon: "\u2295", title: "Seccionamiento", sub: "Válvula compuerta" },
  { key: "reduccion", icon: "\u25B7", title: "Reducción", sub: "Cambio de DN" },
  { key: "antiretorno", icon: "\u2192|", title: "Antiretorno", sub: "Válvula check" },
  { key: "fin", icon: "\u25C9", title: "Fin de línea", sub: "Tapón bridado" },
];

const FUNCTIONS_ROW2 = [
  { key: "cople", icon: "\u2699", title: "Cople desmontaje", sub: "Mantenimiento" },
  { key: "medicion", icon: "\u2B07", title: "Medición / Control", sub: "Medidor, VRP, alivio" },
];

export function AccesoriosSection({ dnMm, materialName, accesorios, onAddAccesorio, onRemoveAccesorio, onClearAll }: AccesoriosProps) {
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const smallerDNs = STANDARD_DNS_LABELED.filter((d) => d.dn < dnMm).map((d) => DN_MM_TO_STR[d.dn]).filter(Boolean);

  const handleAdd = useCallback((tipo: string, label: string, angulo?: string, dn2?: string) => {
    onAddAccesorio({ id: nextId(), tipo, label, cantidad: 1, angulo, dn2 });
    setActiveFunc(null);
  }, [onAddAccesorio]);

  const handleClear = () => {
    if (confirmClear) { onClearAll(); setConfirmClear(false); }
    else setConfirmClear(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accesorios del tramo</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Mejoran la precisión del cálculo y generan la lista de materiales SIMEX</p>
        </div>
        {accesorios.length > 0 && (
          <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-600 transition-colors">
            {confirmClear ? "¿Confirmar?" : "Limpiar todo ×"}
          </button>
        )}
      </div>

      {/* Function cards - Row 1: Obra */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FUNCTIONS_ROW1.map((f) => (
          <button key={f.key} onClick={() => {
            if (f.key === "seccionamiento") handleAdd("valvula-compuerta", `V. Compuerta ${dn}`);
            else if (f.key === "antiretorno") handleAdd("check-resilente", `V. Check ${dn}`);
            else if (f.key === "fin") handleAdd("fin-linea", `Tapón ${dn}`);
            else setActiveFunc(activeFunc === f.key ? null : f.key);
          }} className={`p-3 rounded-lg border text-left transition-all ${
            activeFunc === f.key ? "border-[#1C3D5A] bg-[#1C3D5A]/5 ring-1 ring-[#1C3D5A]/30" : "border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}>
            <span className="text-lg block mb-1">{f.icon}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">{f.title}</span>
            <span className="text-[10px] text-gray-400">{f.sub}</span>
          </button>
        ))}
      </div>

      {/* Row 2: Complementarios */}
      <div className="grid grid-cols-2 gap-2">
        {FUNCTIONS_ROW2.map((f) => (
          <button key={f.key} onClick={() => {
            if (f.key === "cople") handleAdd("cople-desmontaje", `Cople desmontaje ${dn}`);
            else setActiveFunc(activeFunc === f.key ? null : f.key);
          }} className={`p-2 rounded-lg border text-left transition-all text-xs ${
            activeFunc === f.key ? "border-[#1C3D5A] bg-[#1C3D5A]/5" : "border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40"
          }`}>
            <span className="mr-1">{f.icon}</span>
            <span className="font-medium text-gray-600 dark:text-gray-400">{f.title}</span>
            <span className="text-[10px] text-gray-400 ml-1">{f.sub}</span>
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
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Tipo de derivación:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 font-semibold">Tee HD (corte de tubería)</p>
              <button onClick={() => handleAdd("tee-lateral", `Tee ${dn} × ${dn}`)}
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors text-left">
                Igual DN ({dn})
              </button>
              <div className="flex flex-wrap gap-1">
                {smallerDNs.map((d) => (
                  <button key={d} onClick={() => handleAdd("tee-lateral", `Tee ${dn} × ${d}`, undefined, d)}
                    className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 font-semibold">Abrazadera (sin cortar línea)</p>
              <div className="flex flex-wrap gap-1">
                {['1/2"', '3/4"', '1"', '2"'].map((d) => (
                  <button key={d} onClick={() => handleAdd("abrazadera", `Abrazadera ${dn} × ${d}`, undefined, d)}
                    className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">Toma {d}</button>
                ))}
              </div>
              <p className="text-[9px] text-gray-400">Para tomas domiciliarias</p>
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
                className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d}</button>
            ))}
          </div>
        </div>
      )}

      {activeFunc === "medicion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Tipo:</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleAdd("medidor-woltmann", `Medidor Woltmann ${dn}`)}
              className="px-3 py-2 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">Medidor Woltmann</button>
            <button onClick={() => handleAdd("vrp", `VRP ${dn}`)}
              className="px-3 py-2 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">Válvula Reductora</button>
            <button onClick={() => handleAdd("valvula-alivio", `V. Alivio ${dn}`)}
              className="px-3 py-2 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">Válvula de Alivio</button>
          </div>
          <p className="text-[9px] text-yellow-600">Pérdida estimada con Le/D=50. Consultar ficha técnica del fabricante.</p>
        </div>
      )}

      {/* Added accessories with individual × */}
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

// ── Materials list with A/B toggle ──
interface MatTableProps {
  dnMm: number;
  materialName: string;
  accesorios: AccesorioCalc[];
  hidden?: boolean;
  onToggleHidden?: () => void;
}

export function MaterialesSIMEXTable({ dnMm, materialName, accesorios, hidden, onToggleHidden }: MatTableProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [kitOpcion, setKitOpcion] = useState<KitOpcion>("A");
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const simexMat = MATERIAL_MAP[materialName] || "PVC AWWA C900";
  const abuAvailable = hasABU(dn, simexMat);

  // Force option B if no ABU available
  const effectiveOpcion = abuAvailable ? kitOpcion : "B";

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
        list.push({ sku: `CI-TAP-${dn.replace(/"/g, "")}`, descripcion: `Tapón Bridado HD ${dn}`, cantidad: 1, tipo: "pieza" });
        totalBridas += 1;
      } else if (acc.tipo === "cople-desmontaje") {
        list.push({ sku: `JN-JDE-${dn.replace(/"/g, "")}`, descripcion: `Cople Desmontaje ${dn}`, cantidad: 1, tipo: "pieza" });
        totalBridas += 2;
      } else if (acc.tipo === "medidor-woltmann" || acc.tipo === "vrp" || acc.tipo === "valvula-alivio") {
        list.push({ sku: "CONF", descripcion: `${acc.label} — Consultar SKU con distribuidor`, cantidad: 1, tipo: "sugerencia" as any });
        totalBridas += 2;
      } else if (acc.tipo === "abrazadera") {
        list.push({ sku: "CONF", descripcion: `Abrazadera ${dn} × ${acc.dn2} — Consultar SKU`, cantidad: 1, tipo: "sugerencia" as any });
      }
    }

    const bridaItems = totalBridas > 0 ? buildKitBrida(dn, simexMat, totalBridas, effectiveOpcion) : [];
    const all = [...list, ...bridaItems];
    const consolidated = new Map<string, KitItem>();
    for (const item of all) {
      const existing = consolidated.get(item.sku);
      if (existing) existing.cantidad += item.cantidad;
      else consolidated.set(item.sku, { ...item });
    }
    return { piezas: Array.from(consolidated.values()).filter((i) => i.tipo !== "kit_brida"), kit: Array.from(consolidated.values()).filter((i) => i.tipo === "kit_brida"), totalBridas };
  }, [accesorios, dn, simexMat, effectiveOpcion]);

  if (accesorios.length === 0) return null;
  if (hidden) return (
    <button onClick={onToggleHidden} className="text-[10px] text-[#1C3D5A] hover:underline">Mostrar lista de materiales SIMEX</button>
  );

  const copyToClipboard = () => {
    const all = [...items.piezas, ...items.kit];
    navigator.clipboard.writeText(all.map((i) => `${i.sku}\t${i.descripcion}\t${i.cantidad}`).join("\n"));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#1C3D5A]/20 overflow-hidden">
      <div className="bg-[#1C3D5A] px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Lista de materiales SIMEX</h3>
        <div className="flex gap-3">
          <button onClick={copyToClipboard} className="text-[10px] text-white/70 hover:text-white">Copiar SKUs</button>
          {onToggleHidden && <button onClick={onToggleHidden} className="text-[10px] text-white/50 hover:text-white">Ocultar</button>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-[10px] text-white/50 hover:text-white">{collapsed ? "\u25BC" : "\u25B2"}</button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Piezas principales */}
          {items.piezas.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Piezas principales</div>
              {items.piezas.map((item, i) => (
                <div key={`p-${i}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 text-xs">
                  <span className={`font-mono w-28 ${item.sku === "CONF" ? "text-yellow-600" : "text-[#1C3D5A] dark:text-blue-300"}`}>{item.sku === "CONF" ? "[CONF]" : item.sku}</span>
                  <span className="flex-1 text-gray-600 dark:text-gray-400 ml-2">{item.descripcion}</span>
                  <span className="font-mono text-gray-500 ml-2">×{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}

          {/* Kit de bridas with A/B toggle */}
          {items.kit.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Kit de conexión ({items.totalBridas} bridas) — Opción {effectiveOpcion}
                </span>
                {abuAvailable && (
                  <div className="flex gap-1">
                    <button onClick={() => setKitOpcion("A")} className={`text-[9px] px-2 py-0.5 rounded transition-colors ${effectiveOpcion === "A" ? "bg-[#1C3D5A] text-white" : "bg-gray-200 text-gray-500"}`}>A: ABU</button>
                    <button onClick={() => setKitOpcion("B")} className={`text-[9px] px-2 py-0.5 rounded transition-colors ${effectiveOpcion === "B" ? "bg-[#1C3D5A] text-white" : "bg-gray-200 text-gray-500"}`}>B: Ext+Gib</button>
                  </div>
                )}
              </div>
              {!abuAvailable && (
                <p className="px-3 py-1 text-[9px] text-yellow-600 bg-yellow-50">No existe ABU para este diámetro/material — se especifica Extremidad Bridada + Gibault</p>
              )}
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
