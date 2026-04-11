"use client";

import { useState, useMemo, useCallback } from "react";
import { getConexionSKU, buildKitBrida, hasABU, getTapaCiegaSKU, getCopleSKU, VALV_CATALOG, VALV_TIPOS, LONGITUD_EQUIV, type KitItem, type AccesorioCalc, type KitOpcion, type ConexionAcero, MATERIAL_MAP, DN_MM_TO_STR } from "@/hooks/useSIMEXKit";
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

export function AccesoriosSection({ dnMm, materialName, accesorios, onAddAccesorio, onRemoveAccesorio, onClearAll }: AccesoriosProps) {
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [tipoBif, setTipoBif] = useState<"tee" | "cruz" | null>(null);
  const [tipoRed, setTipoRed] = useState<"linea" | "derivacion" | "bifurca" | null>(null);
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const smallerDNs = STANDARD_DNS_LABELED.filter((d) => d.dn < dnMm).map((d) => DN_MM_TO_STR[d.dn]).filter(Boolean);

  const add = useCallback((tipo: string, label: string, angulo?: string, dn2?: string, extra?: Record<string, unknown>) => {
    onAddAccesorio({ id: nid(), tipo, label, cantidad: 1, angulo, dn2, ...extra } as AccesorioCalc);
    setActiveFunc(null); setTipoBif(null); setTipoRed(null);
  }, [onAddAccesorio]);

  const addValvula = (vKey: string) => {
    const info = VALV_CATALOG[vKey]?.[dn];
    if (!info) return;
    const nombres: Record<string, string> = { "vcg-r": "Comp. Resilente C515", "vcg-b": "Comp. Bronce C500", "vmb-c": "Mariposa C504", "vmb-dex": "Mariposa D.Exc.", "vmb-w": "Mariposa Wafer" };
    add(vKey, `${nombres[vKey]} ${dn}`, undefined, undefined, { sku: info.sku });
  };

  const addReduc = (modo: string, dn2: string) => {
    if (modo === "linea") {
      const r = getConexionSKU("reduccion", dn, dn2);
      add("reduccion", `Reducción ${dn}×${dn2}`, undefined, dn2, r ? { sku: r.sku } : {});
    } else if (modo === "derivacion") {
      const r = getConexionSKU("tee", dn, dn2);
      add("tee-lateral", `Tee ${dn}×${dn2}`, undefined, dn2, r ? { sku: r.sku } : {});
    } else {
      // bifurca igual + reduce
      const t = getConexionSKU("tee", dn, dn);
      add("tee-lateral", `Tee ${dn}×${dn}`, undefined, undefined, t ? { sku: t.sku } : {});
      setTimeout(() => {
        const r = getConexionSKU("reduccion", dn, dn2);
        onAddAccesorio({ id: nid(), tipo: "reduccion", label: `Reducción ${dn}×${dn2}`, cantidad: 1, dn2, ...(r ? { sku: r.sku } : {}) } as AccesorioCalc);
      }, 50);
    }
  };

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
        {[
          { key: "codo", icon: "\u21A9", title: "Cambio dirección", sub: "Codo 11°-90°" },
          { key: "bifurc", icon: "\u2442", title: "Bifurcación", sub: "Tee o Cruz" },
          { key: "secc", icon: "\u2295", title: "Seccionamiento", sub: "5 tipos válvula" },
          { key: "reducc", icon: "\u25B7", title: "Reducción", sub: "3 modos" },
          { key: "antiret", icon: "\u2192|", title: "Antiretorno", sub: "Check / Duo" },
          { key: "finlinea", icon: "\u25C9", title: "Fin de línea", sub: "Tapa ciega" },
        ].map((f) => (
          <button key={f.key} onClick={() => {
            if (f.key === "finlinea") { add("tapa-ciega", `Tapa Ciega ${dn}`, undefined, undefined, { sku: getTapaCiegaSKU(dn) }); return; }
            setActiveFunc(activeFunc === f.key ? null : f.key); setTipoBif(null); setTipoRed(null);
          }} className={`p-3 rounded-lg border text-left transition-all ${activeFunc === f.key ? "border-[#1C3D5A] bg-[#1C3D5A]/5 ring-1 ring-[#1C3D5A]/30" : "border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40"}`}>
            <span className="text-lg block mb-1">{f.icon}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">{f.title}</span>
            <span className="text-[10px] text-gray-400">{f.sub}</span>
          </button>
        ))}
      </div>

      {/* Obra accessories */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 self-center">Obra:</span>
        <button onClick={() => add("cople-desmontaje", `Cople Desmontaje ${dn}`, undefined, undefined, { sku: getCopleSKU(dn) })} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600">{"\u2699"} Cople desmontaje</button>
        <button onClick={() => add("marco-tapa", "Marco con Tapa AI-MCT-D", undefined, undefined, { sku: "AI-MCT-D" })} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 dark:border-gray-600">{"\u2B1C"} Marco con tapa</button>
      </div>

      {/* ── CODO ── */}
      {activeFunc === "codo" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Ángulo:</p>
          <div className="flex gap-2">
            {["11°", "22°", "45°", "90°"].map((a) => (
              <button key={a} onClick={() => { const r = getConexionSKU("codo", dn, a); add(`codo-${a.replace("°", "")}`, `Codo ${dn}×${a}`, a, undefined, r ? { sku: r.sku } : {}); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-[#1C3D5A] hover:text-white transition-colors">{a}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── BIFURCACIÓN ── */}
      {activeFunc === "bifurc" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Tipo:</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {([["tee", "Tee — 1 ramal", "3 bridas"], ["cruz", "Cruz — 2 ramales", "4 bridas"]] as const).map(([k, l, s]) => (
              <button key={k} onClick={() => setTipoBif(tipoBif === k ? null : k)} className={`p-2 rounded-lg border text-left ${tipoBif === k ? "border-[#1C3D5A] bg-[#1C3D5A]/5" : "border-gray-200"}`}>
                <span className="text-xs font-semibold block">{l}</span><span className="text-[10px] text-gray-400">{s}</span>
              </button>
            ))}
          </div>
          {tipoBif && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1">DN ramal:</p>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => { const r = getConexionSKU(tipoBif, dn, dn); add(tipoBif === "tee" ? "tee-lateral" : "cruz", `${tipoBif === "tee" ? "Tee" : "Cruz"} ${dn}×${dn}`, undefined, undefined, r ? { sku: r.sku } : {}); }}
                  className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white">Igual ({dn})</button>
                {smallerDNs.map((d) => (
                  <button key={d} onClick={() => { const r = getConexionSKU(tipoBif, dn, d); add(tipoBif === "tee" ? "tee-lateral" : "cruz", `${tipoBif === "tee" ? "Tee" : "Cruz"} ${dn}×${d}`, undefined, d, r ? { sku: r.sku } : {}); }}
                    className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white">{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECCIONAMIENTO ── */}
      {activeFunc === "secc" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Tipo de válvula:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VALV_TIPOS.map((vt) => {
              const avail = !!VALV_CATALOG[vt.key]?.[dn];
              return (
                <button key={vt.key} onClick={() => avail && addValvula(vt.key)} disabled={!avail}
                  className={`p-2 rounded-lg border text-left ${avail ? "border-gray-200 hover:border-[#1C3D5A] cursor-pointer" : "border-gray-100 opacity-40 cursor-not-allowed"}`}>
                  <span className="text-xs font-semibold block">{vt.titulo}</span>
                  <span className="text-[9px] text-gray-400 block">{vt.sub}</span>
                  {!avail && <span className="text-[9px] text-red-400 block">No en {dn}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REDUCCIÓN ── */}
      {activeFunc === "reducc" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">¿Cómo reduce?</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {([["linea", "En línea", "Cambio DN"], ["derivacion", "Derivación", "Tee reducida"], ["bifurca", "Bifurca + reduce", "Tee + Reduc."]] as const).map(([k, l, s]) => (
              <button key={k} onClick={() => setTipoRed(tipoRed === k ? null : k)} className={`p-2 rounded-lg border text-left text-xs ${tipoRed === k ? "border-[#1C3D5A] bg-[#1C3D5A]/5" : "border-gray-200"}`}>
                <span className="font-semibold block">{l}</span><span className="text-[10px] text-gray-400">{s}</span>
              </button>
            ))}
          </div>
          {tipoRed && (
            <div className="flex flex-wrap gap-1">
              {smallerDNs.map((d) => (
                <button key={d} onClick={() => addReduc(tipoRed, d)} className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-[#1C3D5A] hover:text-white">{d}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANTIRETORNO ── */}
      {activeFunc === "antiret" && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Tipo de check:</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => add("check", `Check Resilente ${dn}`, undefined, undefined, { sku: `VI-CHK-R${dn.replace(/"/g, "")}` })}
              className="p-2 rounded-lg border border-gray-200 hover:border-[#1C3D5A] text-left">
              <span className="text-xs font-semibold block">Check Resilente</span>
              <span className="text-[9px] text-gray-400">2 bridas · AWWA C508</span>
            </button>
            <button onClick={() => add("duo-check", `Duo Check Wafer ${dn}`, undefined, undefined, { sku: `VI-DCK-I${dn.replace(/"/g, "")}` })}
              className="p-2 rounded-lg border border-gray-200 hover:border-[#1C3D5A] text-left">
              <span className="text-xs font-semibold block">Duo Check Wafer</span>
              <span className="text-[9px] text-gray-400">Entre bridas · ISO 5752</span>
            </button>
          </div>
        </div>
      )}

      {/* Accessories list */}
      {accesorios.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {accesorios.map((a) => (
            <span key={a.id} className="text-[11px] bg-[#E9EFF5] text-[#1C3D5A] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
              {a.label}
              <button onClick={() => onRemoveAccesorio(a.id)} className="text-[#1C3D5A]/40 hover:text-red-500">{"\u2717"}</button>
            </span>
          ))}
        </div>
      )}

      {accesorios.length === 0 && (
        <p className="text-[10px] text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-200">
          Sin accesorios — pérdidas menores estimadas como 10% de hf
        </p>
      )}
    </div>
  );
}

// ── Materials table with loss detail ──
interface MatProps { dnMm: number; materialName: string; accesorios: AccesorioCalc[]; hidden?: boolean; onToggleHidden?: () => void; hf?: number; longitud?: number }

export function MaterialesSIMEXTable({ dnMm, materialName, accesorios, hidden, onToggleHidden, hf, longitud }: MatProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [kitOpcion, setKitOpcion] = useState<KitOpcion>("A");
  const [conexionAcero, setConexionAcero] = useState<ConexionAcero>("bridado");
  const dn = DN_MM_TO_STR[dnMm] || `${dnMm}`;
  const simexMat = MATERIAL_MAP[materialName] || "PVC AWWA C900";
  const abuAvail = hasABU(dn, simexMat);
  const esAcero = materialName.includes("Acero");
  const efectivoOp = abuAvail ? kitOpcion : "B";
  const necesitaKit = !esAcero || conexionAcero === "bridado";
  const D_m = dnMm / 1000;
  const L = longitud || 1000;

  const { piezas, kit, totalBridas, lossDetail } = useMemo(() => {
    const list: KitItem[] = [];
    let totalBr = 0;
    const losses: { label: string; leD: number; Le: number; dH: number }[] = [];

    for (const acc of accesorios) {
      const skuAcc = (acc as any).sku;
      let bridas = 0;
      if (acc.tipo.startsWith("codo")) { const r = getConexionSKU("codo", dn, acc.angulo || "90°"); list.push({ sku: skuAcc || r?.sku || "CONF", descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = 2; }
      else if (acc.tipo.includes("tee") || acc.tipo === "cruz") { const r = getConexionSKU(acc.tipo === "cruz" ? "cruz" : "tee", dn, acc.dn2 || dn); list.push({ sku: skuAcc || r?.sku || "CONF", descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = acc.tipo === "cruz" ? 4 : 3; }
      else if (acc.tipo === "reduccion") { const r = getConexionSKU("reduccion", dn, acc.dn2); list.push({ sku: skuAcc || r?.sku || "CONF", descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = 2; }
      else if (acc.tipo.startsWith("vcg") || acc.tipo.startsWith("vmb")) { list.push({ sku: skuAcc || "CONF", descripcion: acc.label, cantidad: 1, tipo: "valvula" }); bridas = acc.tipo === "vmb-w" ? 0 : 2; }
      else if (acc.tipo === "check") { list.push({ sku: skuAcc || "CONF", descripcion: acc.label, cantidad: 1, tipo: "valvula" }); bridas = 2; }
      else if (acc.tipo === "duo-check") { list.push({ sku: skuAcc || "CONF", descripcion: acc.label, cantidad: 1, tipo: "valvula" }); bridas = 0; }
      else if (acc.tipo === "tapa-ciega") { list.push({ sku: skuAcc || getTapaCiegaSKU(dn), descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = 1; }
      else if (acc.tipo === "cople-desmontaje") { list.push({ sku: skuAcc || getCopleSKU(dn), descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = 2; }
      else if (acc.tipo === "marco-tapa") { list.push({ sku: "AI-MCT-D", descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = 0; }
      else { list.push({ sku: skuAcc || "CONF", descripcion: acc.label, cantidad: 1, tipo: "pieza" }); bridas = 2; }
      totalBr += bridas;

      // Loss calculation
      const leD = LONGITUD_EQUIV[acc.tipo] ?? 0;
      if (leD > 0 && hf && D_m > 0) {
        const Le = leD * D_m * acc.cantidad;
        const dH = (hf / L) * Le;
        losses.push({ label: acc.label, leD, Le: Math.round(Le * 100) / 100, dH: Math.round(dH * 1000) / 1000 });
      }
    }

    const bridaItems = necesitaKit && totalBr > 0 ? buildKitBrida(dn, simexMat, totalBr, efectivoOp) : [];
    const all = [...list, ...bridaItems];
    const con = new Map<string, KitItem>();
    for (const i of all) { const e = con.get(i.sku); if (e) e.cantidad += i.cantidad; else con.set(i.sku, { ...i }); }
    return { piezas: Array.from(con.values()).filter((i) => i.tipo !== "kit_brida"), kit: Array.from(con.values()).filter((i) => i.tipo === "kit_brida"), totalBridas: totalBr, lossDetail: losses };
  }, [accesorios, dn, simexMat, efectivoOp, necesitaKit, hf, D_m, L]);

  if (accesorios.length === 0) return null;
  if (hidden) return <button onClick={onToggleHidden} className="text-[10px] text-[#1C3D5A] hover:underline">Mostrar lista SIMEX</button>;

  const copy = () => { navigator.clipboard.writeText([...piezas, ...kit].map((i) => `${i.sku}\t${i.descripcion}\t${i.cantidad}`).join("\n")); };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#1C3D5A]/20 overflow-hidden simex-print-area">
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
          {/* Acero connection type */}
          {esAcero && (
            <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-200">
              <p className="text-[10px] font-medium text-yellow-800 mb-1">Conexión Acero:</p>
              <div className="flex gap-1">
                {(["bridado", "roscado", "soldado"] as const).map((t) => (
                  <button key={t} onClick={() => setConexionAcero(t)} className={`text-[10px] px-3 py-1 rounded ${conexionAcero === t ? "bg-[#1C3D5A] text-white" : "bg-white border border-gray-200"}`}>{t}</button>
                ))}
              </div>
              {conexionAcero !== "bridado" && <p className="text-[9px] text-yellow-700 mt-1">{conexionAcero === "roscado" ? "Roscada NPT — sin kit brida" : "Soldada — sin kit brida"}</p>}
            </div>
          )}

          {/* Piezas */}
          {piezas.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Piezas principales</div>
              {piezas.map((item, i) => (
                <div key={`p-${i}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 text-xs">
                  <span className={`font-mono w-28 ${item.sku === "CONF" ? "text-yellow-600" : "text-[#1C3D5A]"}`}>{item.sku === "CONF" ? "[CONF]" : item.sku}</span>
                  <span className="flex-1 text-gray-600 ml-2">{item.descripcion}</span>
                  <span className="font-mono text-gray-500 ml-2">×{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}

          {/* Kit bridas */}
          {necesitaKit && kit.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kit conexión ({totalBridas} bridas) — Op. {efectivoOp}</span>
                {abuAvail && (
                  <div className="flex gap-1">
                    <button onClick={() => setKitOpcion("A")} className={`text-[9px] px-2 py-0.5 rounded ${efectivoOp === "A" ? "bg-[#1C3D5A] text-white" : "bg-gray-200"}`}>A: ABU</button>
                    <button onClick={() => setKitOpcion("B")} className={`text-[9px] px-2 py-0.5 rounded ${efectivoOp === "B" ? "bg-[#1C3D5A] text-white" : "bg-gray-200"}`}>B: Ext+Gib</button>
                  </div>
                )}
              </div>
              {kit.map((item, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 text-xs text-gray-400">
                  <span className="font-mono w-28">{item.sku}</span>
                  <span className="flex-1 ml-2">{item.descripcion}</span>
                  <span className="font-mono ml-2">×{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}

          {/* Loss detail table */}
          {lossDetail.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pérdidas hidráulicas — Crane TP-410 / AWWA</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400">
                    <th className="text-left px-3 py-1 font-medium">Accesorio</th>
                    <th className="text-center px-2 py-1 font-medium">Le/D</th>
                    <th className="text-center px-2 py-1 font-medium">Le (m)</th>
                    <th className="text-center px-2 py-1 font-medium">ΔhF (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {lossDetail.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-1 text-gray-600">{d.label}</td>
                      <td className="px-2 py-1 text-center text-gray-400 font-mono">{d.leD}</td>
                      <td className="px-2 py-1 text-center font-mono">{d.Le.toFixed(2)}</td>
                      <td className="px-2 py-1 text-center font-mono text-red-500">{d.dH.toFixed(3)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 font-semibold">
                    <td className="px-3 py-1">TOTAL</td>
                    <td></td>
                    <td className="px-2 py-1 text-center font-mono">{lossDetail.reduce((s, d) => s + d.Le, 0).toFixed(2)}</td>
                    <td className="px-2 py-1 text-center font-mono text-red-500">{lossDetail.reduce((s, d) => s + d.dH, 0).toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="px-3 py-1 text-[9px] text-gray-400">Le = Le/D × D × cant. ΔhF = J × Le donde J = hf/L</p>
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
