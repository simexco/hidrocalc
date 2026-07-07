"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { ResetButton } from "@/components/ui/ResetButton";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { STANDARD_DNS_LABELED, MATERIALS } from "@/lib/constants";
import { useProjectStore } from "@/store/projectStore";
import ListaMaterialesSIMEX, { type SIMEXAcc, type SIMEXConex } from "@/components/ListaMaterialesSIMEX";

interface DespieceTramo {
  id: string;
  name: string;
  DN: number;
  material: string;
}

export default function DespiecePage() {
  const [projectName, setProjectName] = useState("");
  const [tramos, setTramos] = useState<DespieceTramo[]>([]);
  const [accsPorTramo, setAccsPorTramo] = useState<Record<string, SIMEXAcc[]>>({});
  // Uniones brida-con-brida entre piezas del crucero, por tramo
  const [conexPorTramo, setConexPorTramo] = useState<Record<string, SIMEXConex[]>>({});
  // Lista completa computada por tramo (piezas + acoplamiento) para el reporte
  const [listaPorTramo, setListaPorTramo] = useState<Record<string, { sku: string; desc: string; qty: number }[]>>({});

  // Cargar guardado / flujo de proyecto
  useEffect(() => {
    const saved = loadFormState<{ projectName?: string; tramos?: DespieceTramo[]; accsPorTramo?: Record<string, SIMEXAcc[]>; conexPorTramo?: Record<string, SIMEXConex[]> }>("despiece");
    const tieneTramos = saved && Array.isArray(saved.tramos) && saved.tramos.length > 0;
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (Array.isArray(saved.tramos)) setTramos(saved.tramos);
      if (saved.accsPorTramo) setAccsPorTramo(saved.accsPorTramo);
      if (saved.conexPorTramo) setConexPorTramo(saved.conexPorTramo);
    }
    // Si no hay tramos propios, sembrar el primero con el material/DN del proyecto activo
    if (!tieneTramos) {
      const proj = useProjectStore.getState().project;
      if (proj.proyecto && !saved?.projectName) setProjectName(proj.proyecto);
      if (proj.diametroInterior != null || proj.material) {
        setTramos([{ id: uuid(), name: "Crucero 1", DN: proj.diametroInterior ?? 150, material: proj.material || "PVC Inglés" }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("despiece", { projectName, tramos, accsPorTramo, conexPorTramo }), 800);
  }, [projectName, tramos, accsPorTramo, conexPorTramo]);

  // Flujo de proyecto: escribir el despiece consolidado al proyecto (sale en el reporte)
  const patchProject = useProjectStore((s) => s.patch);
  useEffect(() => {
    const t = setTimeout(() => {
      // Consolidar la lista COMPLETA de cada tramo (incluye piezas + acoplamiento/adaptadores)
      // Solo tramos que aún tienen accesorios (ignora listas obsoletas)
      const acc: Record<string, { desc: string; sku: string; qty: number }> = {};
      tramos.forEach((t2) => {
        if ((accsPorTramo[t2.id]?.length ?? 0) === 0) return;
        (listaPorTramo[t2.id] ?? []).forEach((p) => {
          const key = p.sku && p.sku !== "—" ? p.sku : p.desc;
          if (!acc[key]) acc[key] = { desc: p.desc, sku: p.sku || "—", qty: 0 };
          acc[key].qty += p.qty;
        });
      });
      patchProject({ despiece: Object.values(acc) });
    }, 700);
    return () => clearTimeout(t);
  }, [listaPorTramo, accsPorTramo, tramos, patchProject]);

  const addTramo = () => {
    setTramos((prev) => [...prev, { id: uuid(), name: `Crucero ${prev.length + 1}`, DN: 150, material: "PVC Inglés" }]);
  };
  const updateTramo = (id: string, patch: Partial<DespieceTramo>) => {
    setTramos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTramo = (id: string) => {
    setTramos((prev) => prev.filter((t) => t.id !== id));
    setAccsPorTramo((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setConexPorTramo((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleReset = () => {
    setTramos([]); setAccsPorTramo({}); setConexPorTramo({}); setProjectName("");
  };

  const crucerosConPiezas = tramos.filter((t) => (accsPorTramo[t.id]?.length ?? 0) > 0);

  // Lista consolidada: suma de TODOS los cruceros, agrupada por SKU (los «CONF» se agrupan por descripción)
  const consolidada = (() => {
    const map: Record<string, { desc: string; sku: string; qty: number }> = {};
    crucerosConPiezas.forEach((t) => {
      (listaPorTramo[t.id] ?? []).forEach((p) => {
        const key = p.sku && p.sku !== "—" && p.sku !== "← CONF" ? p.sku : p.desc;
        if (!map[key]) map[key] = { desc: p.desc, sku: p.sku || "—", qty: 0 };
        map[key].qty += p.qty;
      });
    });
    return Object.values(map);
  })();
  const totalPiezas = consolidada.reduce((s, r) => s + r.qty, 0);

  const copiarConsolidada = () => {
    const lines = ["SKU\tDescripción\tCantidad"];
    consolidada.forEach((r) => lines.push(`${r.sku}\t${r.desc}\t${r.qty}`));
    navigator.clipboard.writeText(lines.join("\n")).then(() => alert("Lista consolidada copiada"));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Genera tus cruceros</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl mt-0.5">
            Arma cada crucero con sus piezas y sus uniones brida con brida. La lista de materiales —con adaptadores, empaques y tornillería— se genera automáticamente abajo, lista para cotizar.
          </p>
        </div>
        <ResetButton moduleKey="despiece" onReset={handleReset} />
      </div>

      {/* Proyecto */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <InputField label="Proyecto / Obra" value={projectName} onChange={setProjectName} type="text" placeholder="Ej. Línea conducción El Roble" />
      </div>

      {/* Cruceros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tus cruceros</h2>
          {tramos.length > 0 && (
            <button onClick={addTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
              + Nuevo crucero
            </button>
          )}
        </div>

        {tramos.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
            <div className="text-3xl mb-2">🔧</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Empieza creando tu primer crucero</p>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">Agrega sus piezas (codos, válvulas, tees…) y únelas entre sí. El acoplamiento (adaptadores, empaques, tornillería) se calcula solo.</p>
            <button onClick={addTramo} className="mt-4 text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors">+ Crear crucero</button>
          </div>
        )}

        {tramos.map((t, i) => (
          <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Cabecera del crucero */}
            <div className="bg-[#1C3D5A]/[0.04] dark:bg-gray-800/60 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-[#1C3D5A] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</span>
              <input
                value={t.name}
                onChange={(e) => updateTramo(t.id, { name: e.target.value })}
                className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#1C3D5A] dark:text-white focus:outline-none min-w-[140px]"
              />
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">DN principal</span>
                <select
                  value={t.DN}
                  onChange={(e) => updateTramo(t.id, { DN: parseInt(e.target.value) })}
                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                >
                  {STANDARD_DNS_LABELED.map((d) => <option key={d.dn} value={d.dn}>{d.label}</option>)}
                </select>
                <select
                  value={t.material}
                  onChange={(e) => updateTramo(t.id, { material: e.target.value })}
                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                >
                  {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
                <button onClick={() => removeTramo(t.id)} title="Eliminar crucero" className="text-red-400 hover:text-red-600 text-sm px-1">&#10005;</button>
              </div>
            </div>

            {/* Cuerpo: agregar piezas + tabla con uniones */}
            <div className="p-4 space-y-4">
              <ListaMaterialesSIMEX
                mode="selector"
                dnMM={t.DN}
                materialRaw={t.material}
                externalAccs={accsPorTramo[t.id] || []}
                onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                externalConex={conexPorTramo[t.id] || []}
                onConexChange={(cx) => setConexPorTramo((prev) => ({ ...prev, [t.id]: cx }))}
              />
              {(accsPorTramo[t.id]?.length ?? 0) > 0 && (
                <ListaMaterialesSIMEX
                  mode="table"
                  dnMM={t.DN}
                  materialRaw={t.material}
                  externalAccs={accsPorTramo[t.id] || []}
                  onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                  externalConex={conexPorTramo[t.id] || []}
                  onConexChange={(cx) => setConexPorTramo((prev) => ({ ...prev, [t.id]: cx }))}
                  onComputed={(rows) => setListaPorTramo((prev) => ({ ...prev, [t.id]: rows }))}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Lista de materiales consolidada (todos los cruceros) ── */}
      {consolidada.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#1C3D5A] to-[#2A5A7A] px-5 py-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Lista de materiales consolidada{projectName ? ` — ${projectName}` : ""}</h3>
              <p className="text-[10px] text-white/50 mt-0.5">Suma de todos los cruceros · {crucerosConPiezas.length} crucero(s) · {totalPiezas} pieza(s) · acoplamiento incluido</p>
            </div>
            <button onClick={copiarConsolidada} className="shrink-0 text-[11px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">Copiar SKUs</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {consolidada.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2">
                <span className="font-mono text-xs text-[#1C3D5A] dark:text-blue-300 w-28 shrink-0">{r.sku}</span>
                <span className="flex-1 text-[13px] text-gray-700 dark:text-gray-300">{r.desc}</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 w-12 text-right">×{r.qty}</span>
              </div>
            ))}
          </div>
          <p className="px-5 py-3 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
            Contacte a su distribuidor Sigma Flow autorizado para cotización — S.H.I. de México · simexco.com.mx
          </p>
        </div>
      )}
    </div>
  );
}
