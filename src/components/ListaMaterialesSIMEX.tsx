"use client";

import { useState, useMemo, useCallback } from "react";
import { getConexionSKU, buildKitBrida, hasABU, VALV_CATALOG, VALV_TIPOS, VALV_NOMBRES, type KitItem, type AccesorioCalc, type KitOpcion, type ConexionAcero, MATERIAL_MAP, DN_MM_TO_STR } from "@/hooks/useSIMEXKit";
import { STANDARD_DNS_LABELED } from "@/lib/constants";

interface AccesoriosProps {
  dnMm: number;
  materialName: string;
  accesorios: AccesorioCalc[];
  onAddAccesorio: (acc: AccesorioCalc) => void;
  onRemoveAccesorio: (id: string) => void;
  onClearAll: () => void;
}

let idC = 0;
const nid = () => `a-${++idC}-${Date.now()}`;

const FUNC_ROW1 = [
  { key: "direccion", icon: "\u21A9", title: "Cambio dirección", sub: "Codo" },
  { key: "bifurcacion", icon: "\u2442", title: "Bifurcación", sub: "Tee / Abrazadera" },
  { key: "seccionamiento", icon: "\u2295", title: "Seccionamiento", sub: "Válvula" },
  { key: "reduccion", icon: "\u25B7", title: "Reducción", sub: "Cambio DN" },
  { key: "antiretorno", icon: "\u2192|", title: "Antiretorno", sub: "Check" },
  { key: "fin", icon: "\u25C9", title: "Fin de línea", sub: "Tapón" },
];

export function AccesoriosSection({ dnMm, materialName, accesorios, onAddAccesorio, onRemoveAccesorio, onClearAll }: AccesoriosProps) {
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const smallerDNs = STANDARD_DNS_LABELED.filter((d) => d.dn < dnMm).map((d) => DN_MM_TO_STR[d.dn]).filter(Boolean);

  const add = useCallback((tipo: string, label: string, angulo?: string, dn2?: string, extra?: Partial<AccesorioCalc>) => {
    onAddAccesorio({ id: nid(), tipo, label, cantidad: 1, angulo, dn2, ...extra });
    setActiveFunc(null);
  }, [onAddAccesorio]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accesorios del tramo</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Mejoran la precisión del cálculo y generan la lista SIMEX</p>
        </div>
        {accesorios.length > 0 && (
          <button onClick={() => { if (confirmClear) { onClearAll(); setConfirmClear(false); } else setConfirmClear(true); }} className="text-[10px] text-red-400 hover:text-red-600">
            {confirmClear ? "¿Confirmar?" : "Limpiar todo ×"}
          </button>
        )}
      </div>

      {/* Function cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FUNC_ROW1.map((f) => (
          <button key={f.key} onClick={() => {
            if (f.key === "antiretorno") add("check-resilente", `V. Check ${dn}`);
            else if (f.key === "fin") add("fin-linea", `Tapón ${dn}`);
            else setActiveFunc(activeFunc === f.key ? null : f.key);
          }} className={`p-3 rounded-lg border text-left transition-all ${activeFunc === f.key ? "border-[#1C3D5A] bg-[#1C3D5A]/5 ring-1 ring-[#1C3D5A]/30" : "border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40"}`}>
            <span className="text-lg block mb-1">{f.icon}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">{f.title}</span>
            <span className="text-[10px] text-gray-400">{f.sub}</span>
          </button>
        ))}
      </div>

      {/* Complementarios */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "cople", icon: "\u2699", title: "Cople desmontaje" },
          { key: "medicion", icon: "\u2B07", title: "Medición/Control" },
          { key: "marco", icon: "\u2B1C", title: "Marco/Registro" },
        ].map((f) => (
          <button key={f.key} onClick={() => {
            if (f.key === "cople") add("cople-desmontaje", `Cople ${dn}`);
            else if (f.key === "marco") add("fin-linea", "Marco tapa AI-MCT-D");
            else setActiveFunc(activeFunc === f.key ? null : f.key);
          }} className={`p-2 rounded-lg border text-left text-xs ${activeFunc === f.key ? "border-[#1C3D5A] bg-[#1C3D5A]/5" : "border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40"}`}>
            <span className="mr-1">{f.icon}</span><span className="font-medium text-gray-600 dark:text-gray-400">{f.title}</span>
          </button>
        ))}
      </div>

      {/* Sub-selectors */}
      {activeFunc === "direccion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Ángulo:</p>
          <div className="flex gap-2">
            {["11°", "22°", "45°", "90°"].map((a) => (
              <button key={a} onClick={() => add(`codo-${a.replace("°", "")}`, `Codo ${dn} × ${a}`, a)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{a}</button>
            ))}
          </div>
        </div>
      )}

      {activeFunc === "bifurcacion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 font-semibold">Tee HD (corte de tubería)</p>
              <button onClick={() => add("tee-lateral", `Tee ${dn}×${dn}`)} className="w-full px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors text-left">Igual DN ({dn})</button>
              <div className="flex flex-wrap gap-1">{smallerDNs.map((d) => (
                <button key={d} onClick={() => add("tee-lateral", `Tee ${dn}×${d}`, undefined, d)} className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d}</button>
              ))}</div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 font-semibold">Abrazadera (sin cortar)</p>
              <div className="flex flex-wrap gap-1">{['1/2"', '3/4"', '1"', '2"'].map((d) => (
                <button key={d} onClick={() => add("abrazadera", `Abrazadera ${dn}×${d}`, undefined, d)} className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">Toma {d}</button>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {/* VALVE SUB-SELECTOR */}
      {activeFunc === "seccionamiento" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Tipo de válvula de seccionamiento:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VALV_TIPOS.map((vt) => {
              const available = !!VALV_CATALOG[vt.key]?.[dn];
              const info = VALV_CATALOG[vt.key]?.[dn];
              return (
                <button key={vt.key} onClick={() => {
                  if (!available || !info) return;
                  add(info.bridas === 0 ? "valvula-mariposa" : "valvula-compuerta", `${vt.titulo} ${dn}`, undefined, undefined, { sku: info.sku } as any);
                }} disabled={!available} className={`p-2.5 rounded-lg border text-left transition-all ${available ? "border-gray-200 hover:border-[#1C3D5A] hover:bg-[#1C3D5A]/5 cursor-pointer" : "border-gray-100 bg-gray-100/50 opacity-50 cursor-not-allowed"}`}>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">{vt.titulo}</span>
                  <span className="text-[10px] text-gray-400 block">{vt.sub}</span>
                  <span className="text-[9px] text-gray-400">{vt.rango}</span>
                  {!available && <span className="text-[9px] text-red-400 block mt-0.5">No disponible en {dn}</span>}
                  {available && info && <span className="text-[9px] text-[#1C3D5A] font-mono block mt-0.5">{info.sku}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeFunc === "reduccion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Reducir a:</p>
          <div className="flex flex-wrap gap-1">{smallerDNs.map((d) => (
            <button key={d} onClick={() => add("reduccion", `Reducción ${dn}×${d}`, undefined, d)} className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{d}</button>
          ))}</div>
        </div>
      )}

      {activeFunc === "medicion" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Tipo:</p>
          <div className="flex flex-wrap gap-2">
            {[["medidor-woltmann", "Medidor Woltmann"], ["vrp", "VRP"], ["valvula-alivio", "V. Alivio"]].map(([t, l]) => (
              <button key={t} onClick={() => add(t, `${l} ${dn}`)} className="px-3 py-2 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{l}</button>
            ))}
          </div>
          <p className="text-[9px] text-yellow-600">Pérdida estimada Le/D=50. Consultar ficha técnica.</p>
        </div>
      )}

      {/* Accessories list with individual × */}
      {accesorios.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">Accesorios agregados:</p>
          <div className="flex flex-wrap gap-1.5">{accesorios.map((a) => (
            <span key={a.id} className="text-[11px] bg-[#E9EFF5] text-[#1C3D5A] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
              {a.label}
              <button onClick={() => onRemoveAccesorio(a.id)} className="text-[#1C3D5A]/40 hover:text-red-500">{"\u2717"}</button>
            </span>
          ))}</div>
        </div>
      )}

      {accesorios.length === 0 && (
        <p className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800">
          Sin accesorios — pérdidas menores estimadas como 10% de hf
        </p>
      )}
    </div>
  );
}

// ── Materials list with A/B toggle + steel connection type ──
interface MatProps {
  dnMm: number;
  materialName: string;
  accesorios: AccesorioCalc[];
  hidden?: boolean;
  onToggleHidden?: () => void;
}

export function MaterialesSIMEXTable({ dnMm, materialName, accesorios, hidden, onToggleHidden }: MatProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [kitOpcion, setKitOpcion] = useState<KitOpcion>("A");
  const [conexionAcero, setConexionAcero] = useState<ConexionAcero>("bridado");
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const simexMat = MATERIAL_MAP[materialName] || "PVC AWWA C900";
  const abuAvail = hasABU(dn, simexMat);
  const esAcero = materialName.includes("Acero");
  const efectivoOp = abuAvail ? kitOpcion : "B";
  const necesitaKit = !esAcero || conexionAcero === "bridado";

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
        const skuAcc = (acc as any).sku;
        if (skuAcc) { list.push({ sku: skuAcc, descripcion: acc.label, cantidad: 1, tipo: "valvula" }); totalBridas += 2; }
      } else if (acc.tipo === "valvula-mariposa") {
        const skuAcc = (acc as any).sku;
        if (skuAcc) { list.push({ sku: skuAcc, descripcion: acc.label + " (Wafer)", cantidad: 1, tipo: "valvula" }); /* wafer = 0 bridas */ }
      } else if (acc.tipo === "check-resilente") {
        list.push({ sku: `VI-CHK-R${dn.replace(/"/g, "")}`, descripcion: `V. Check Resilente ${dn}`, cantidad: 1, tipo: "valvula" }); totalBridas += 2;
      } else if (acc.tipo === "fin-linea") {
        list.push({ sku: `CI-TAP-${dn.replace(/"/g, "")}`, descripcion: acc.label, cantidad: 1, tipo: "pieza" }); totalBridas += 1;
      } else if (acc.tipo === "cople-desmontaje") {
        list.push({ sku: `JN-JDE-${dn.replace(/"/g, "")}`, descripcion: `Cople Desmontaje ${dn}`, cantidad: 1, tipo: "pieza" }); totalBridas += 2;
      } else if (["medidor-woltmann", "vrp", "valvula-alivio"].includes(acc.tipo)) {
        list.push({ sku: "CONF", descripcion: `${acc.label} — Consultar SKU`, cantidad: 1, tipo: "pieza" }); totalBridas += 2;
      } else if (acc.tipo === "abrazadera") {
        list.push({ sku: "CONF", descripcion: `Abrazadera ${dn}×${acc.dn2}`, cantidad: 1, tipo: "pieza" });
      }
    }

    const bridaItems = necesitaKit && totalBridas > 0 ? buildKitBrida(dn, simexMat, totalBridas, efectivoOp) : [];
    const all = [...list, ...bridaItems];
    const consolidated = new Map<string, KitItem>();
    for (const item of all) { const ex = consolidated.get(item.sku); if (ex) ex.cantidad += item.cantidad; else consolidated.set(item.sku, { ...item }); }
    return { piezas: Array.from(consolidated.values()).filter((i) => i.tipo !== "kit_brida"), kit: Array.from(consolidated.values()).filter((i) => i.tipo === "kit_brida"), totalBridas };
  }, [accesorios, dn, simexMat, efectivoOp, necesitaKit]);

  if (accesorios.length === 0) return null;
  if (hidden) return <button onClick={onToggleHidden} className="text-[10px] text-[#1C3D5A] hover:underline">Mostrar lista SIMEX</button>;

  const copy = () => { const a = [...items.piezas, ...items.kit]; navigator.clipboard.writeText(a.map((i) => `${i.sku}\t${i.descripcion}\t${i.cantidad}`).join("\n")); };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#1C3D5A]/20 overflow-hidden">
      <div className="bg-[#1C3D5A] px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Lista de materiales SIMEX</h3>
        <div className="flex gap-3">
          <button onClick={copy} className="text-[10px] text-white/70 hover:text-white">Copiar SKUs</button>
          {onToggleHidden && <button onClick={onToggleHidden} className="text-[10px] text-white/50 hover:text-white">Ocultar</button>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-[10px] text-white/50 hover:text-white">{collapsed ? "\u25BC" : "\u25B2"}</button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Steel connection type selector */}
          {esAcero && (
            <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800">
              <p className="text-[10px] font-medium text-yellow-800 mb-1">Tipo de conexión (Acero):</p>
              <div className="flex gap-1">
                {(["bridado", "roscado", "soldado"] as ConexionAcero[]).map((t) => (
                  <button key={t} onClick={() => setConexionAcero(t)} className={`text-[10px] px-3 py-1 rounded transition-colors ${conexionAcero === t ? "bg-[#1C3D5A] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
                    {t === "bridado" ? "Bridado" : t === "roscado" ? "Roscado" : "Soldado"}
                  </button>
                ))}
              </div>
              {conexionAcero === "roscado" && dnMm > 100 && (
                <p className="text-[9px] text-yellow-700 mt-1">La conexión roscada no es común en DNs mayores a 4". Se recomienda bridada o soldada.</p>
              )}
              {conexionAcero === "soldado" && (
                <p className="text-[9px] text-yellow-700 mt-1">Las válvulas bridadas requieren bridas de transición soldadas. Consultar con distribuidor.</p>
              )}
              {conexionAcero === "roscado" && (
                <p className="text-[9px] text-gray-500 mt-1">Conexión roscada NPT — sin kit de brida</p>
              )}
            </div>
          )}

          {/* Piezas */}
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
          {necesitaKit && items.kit.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kit conexión ({items.totalBridas} bridas) — Op. {efectivoOp}</span>
                {abuAvail && (
                  <div className="flex gap-1">
                    <button onClick={() => setKitOpcion("A")} className={`text-[9px] px-2 py-0.5 rounded ${efectivoOp === "A" ? "bg-[#1C3D5A] text-white" : "bg-gray-200 text-gray-500"}`}>A: ABU</button>
                    <button onClick={() => setKitOpcion("B")} className={`text-[9px] px-2 py-0.5 rounded ${efectivoOp === "B" ? "bg-[#1C3D5A] text-white" : "bg-gray-200 text-gray-500"}`}>B: Ext+Gib</button>
                  </div>
                )}
              </div>
              {!abuAvail && <p className="px-3 py-1 text-[9px] text-yellow-600 bg-yellow-50">No existe ABU para este DN/material — Extremidad Bridada + Gibault</p>}
              {items.kit.map((item, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 dark:border-gray-700 text-xs text-gray-400">
                  <span className="font-mono w-28">{item.sku}</span>
                  <span className="flex-1 ml-2">{item.descripcion}</span>
                  <span className="font-mono ml-2">×{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}

          {!necesitaKit && (
            <div className="px-3 py-2 text-[10px] text-gray-500 bg-gray-50">
              {conexionAcero === "roscado" ? "Conexión roscada NPT — sin kit de brida. Verificar con proveedor." : "Conexión soldada — sin kit de brida. Las uniones las realiza el soldador."}
            </div>
          )}

          <div className="px-3 py-2 text-[9px] text-gray-400">
            Contacte a su distribuidor SIMEX autorizado · simexco.com.mx
          </div>
        </>
      )}
    </div>
  );
}
