"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { ResetButton } from "@/components/ui/ResetButton";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { STANDARD_DNS_LABELED, MATERIALS } from "@/lib/constants";
import { useProjectStore } from "@/store/projectStore";
import ListaMaterialesSIMEX, { type SIMEXAcc } from "@/components/ListaMaterialesSIMEX";

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

  // Cargar guardado / flujo de proyecto
  useEffect(() => {
    const saved = loadFormState<{ projectName?: string; tramos?: DespieceTramo[]; accsPorTramo?: Record<string, SIMEXAcc[]> }>("despiece");
    const tieneTramos = saved && Array.isArray(saved.tramos) && saved.tramos.length > 0;
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (Array.isArray(saved.tramos)) setTramos(saved.tramos);
      if (saved.accsPorTramo) setAccsPorTramo(saved.accsPorTramo);
    }
    // Si no hay tramos propios, sembrar el primero con el material/DN del proyecto activo
    if (!tieneTramos) {
      const proj = useProjectStore.getState().project;
      if (proj.proyecto && !saved?.projectName) setProjectName(proj.proyecto);
      if (proj.diametroInterior != null || proj.material) {
        setTramos([{ id: uuid(), name: "Tramo 1", DN: proj.diametroInterior ?? 150, material: proj.material || "PVC C900" }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("despiece", { projectName, tramos, accsPorTramo }), 800);
  }, [projectName, tramos, accsPorTramo]);

  // Flujo de proyecto: escribir el despiece consolidado al proyecto (sale en el reporte)
  const patchProject = useProjectStore((s) => s.patch);
  useEffect(() => {
    const t = setTimeout(() => {
      const acc: Record<string, { desc: string; sku: string; qty: number }> = {};
      Object.values(accsPorTramo).flat().forEach((a) => {
        const key = a.sku || a.label;
        if (!acc[key]) acc[key] = { desc: a.label, sku: a.sku || "—", qty: 0 };
        acc[key].qty += a.qty;
      });
      patchProject({ despiece: Object.values(acc) });
    }, 700);
    return () => clearTimeout(t);
  }, [accsPorTramo, patchProject]);

  const addTramo = () => {
    setTramos((prev) => [...prev, { id: uuid(), name: `Tramo ${prev.length + 1}`, DN: 150, material: "PVC C900" }]);
  };
  const updateTramo = (id: string, patch: Partial<DespieceTramo>) => {
    setTramos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTramo = (id: string) => {
    setTramos((prev) => prev.filter((t) => t.id !== id));
    setAccsPorTramo((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleReset = () => {
    setTramos([]); setAccsPorTramo({}); setProjectName("");
  };

  const tramosConAccs = tramos.filter((t) => (accsPorTramo[t.id]?.length ?? 0) > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Captura ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos</h2>
              <ResetButton moduleKey="despiece" onReset={handleReset} />
            </div>
            <InputField label="Proyecto / Obra" value={projectName} onChange={setProjectName} type="text" placeholder="Ej. Línea conducción El Roble" />
          </div>

          {/* Tramos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tramos</h2>
              <button onClick={addTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
                + Tramo
              </button>
            </div>

            {tramos.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Agrega un tramo, elige su diámetro y material, y luego sus accesorios. El acoplamiento (adaptador bridado, empaque y tornillería) se agrega solo.</p>
            )}

            {tramos.map((t) => (
              <div key={t.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    value={t.name}
                    onChange={(e) => updateTramo(t.id, { name: e.target.value })}
                    className="text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:text-white focus:outline-none"
                  />
                  <button onClick={() => removeTramo(t.id)} className="text-red-400 hover:text-red-600 text-xs">&#10005;</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN (mm)</label>
                    <select
                      value={t.DN}
                      onChange={(e) => updateTramo(t.id, { DN: parseInt(e.target.value) })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                    >
                      {STANDARD_DNS_LABELED.map((d) => <option key={d.dn} value={d.dn}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                    <select
                      value={t.material}
                      onChange={(e) => updateTramo(t.id, { material: e.target.value })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                    >
                      {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Selector de accesorios SIMEX por tramo */}
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <ListaMaterialesSIMEX
                    mode="selector"
                    dnMM={t.DN}
                    materialRaw={t.material}
                    externalAccs={accsPorTramo[t.id] || []}
                    onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                  />
                  {(accsPorTramo[t.id]?.length ?? 0) > 0 && (
                    <p className="text-[10px] text-[#1C3D5A]/60 dark:text-blue-300/50 mt-1 font-medium">
                      {accsPorTramo[t.id].reduce((s, a) => s + a.qty, 0)} pza(s) seleccionada(s)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Despiece resultante ── */}
        <div className="lg:col-span-3 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Despiece de tramo</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lista de materiales y accesorios con SKU Sigma Flow. El acoplamiento se genera automáticamente.</p>
          </div>

          {tramosConAccs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
              Selecciona accesorios en algún tramo para ver el despiece con su acoplamiento.
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-[#1C3D5A] to-[#2A5A7A] px-5 py-3">
                <h3 className="text-sm font-semibold text-white tracking-wide">Lista de Materiales SIMEX{projectName ? ` — ${projectName}` : ""}</h3>
                <p className="text-[10px] text-white/50 mt-0.5">Generada desde los accesorios seleccionados por tramo, con acoplamiento incluido</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {tramos.map((t, i) => {
                  if ((accsPorTramo[t.id]?.length ?? 0) === 0) return null;
                  return (
                    <div key={`tabla-${t.id}`} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-[#1C3D5A]/10 text-[#1C3D5A] dark:bg-blue-900/30 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        <h4 className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300">{t.name}</h4>
                        <span className="text-[10px] text-gray-400 ml-auto">DN {t.DN} mm · {t.material}</span>
                      </div>
                      <ListaMaterialesSIMEX
                        mode="table"
                        dnMM={t.DN}
                        materialRaw={t.material}
                        externalAccs={accsPorTramo[t.id] || []}
                        onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400">
            Contacte a su distribuidor Sigma Flow autorizado para cotización — S.H.I. de México, simexco.com.mx
          </p>
        </div>
      </div>
    </div>
  );
}
