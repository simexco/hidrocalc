"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useSeriesPipeStore } from "@/store/calculationStore";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { HydraulicProfileChart } from "@/components/hydraulic/HydraulicProfileChart";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { calculateSeriesPipes } from "@/lib/calculations/series-pipes";
import { flowToM3s, formatNumber, mcaToKgcm2 } from "@/lib/calculations/conversions";
import { STANDARD_DNS, MATERIALS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import ListaMaterialesSIMEX, { type SIMEXAcc } from "@/components/ListaMaterialesSIMEX";
import type { FlowUnit, SeriesTramo, AssumedValue } from "@/types/hydraulic";

export default function EnSeriePage() {
  const { inputs, results, setInput, setResults, addTramo, removeTramo, updateTramo } = useSeriesPipeStore();
  const [simexPorTramo, setSimexPorTramo] = useState<Record<string, SIMEXAcc[]>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const saved = loadFormState<typeof inputs>("en-serie");
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setInput(key as keyof typeof inputs, value as never);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("en-serie", inputs), 1000);
  }, [inputs]);

  const runCalc = useCallback(() => {
    if (inputs.tramos.length === 0) { setResults(null); return; }
    const Q = inputs.rawQ != null ? flowToM3s(inputs.rawQ, inputs.flowUnit) : null;
    if (!inputs.variableFlow && Q == null) { setResults(null); return; }
    // Convert kg/cm² to m.c.a. for engine
    const P1_mca = inputs.P1 != null ? inputs.P1 * 10 : null;
    const res = calculateSeriesPipes(inputs.tramos, Q, P1_mca, inputs.z1, inputs.variableFlow);
    setResults(res);
  }, [inputs, setResults]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const [showRefTable, setShowRefTable] = useState(false);

  const K_LE_REF = [
    { acc: "Codo 90 deg radio largo", k: 0.3, leD: 16 },
    { acc: "Codo 90 deg radio corto", k: 0.9, leD: 50 },
    { acc: "Codo 45 deg", k: 0.2, leD: 12 },
    { acc: "Tee paso directo", k: 0.2, leD: 20 },
    { acc: "Tee ramal lateral", k: 1.0, leD: 60 },
    { acc: "Valvula compuerta (100%)", k: 0.2, leD: 8 },
    { acc: "Valvula mariposa (100%)", k: 0.3, leD: 40 },
    { acc: "Valvula check disco", k: 2.0, leD: 100 },
    { acc: "Reduccion gradual", k: 0.1, leD: 5 },
    { acc: "Reduccion brusca", k: 0.5, leD: 30 },
    { acc: "Entrada a tuberia", k: 0.5, leD: 25 },
    { acc: "Salida de tuberia", k: 1.0, leD: 50 },
  ];

  const handleAddTramo = () => {
    addTramo({
      id: uuid(),
      name: `Tramo ${inputs.tramos.length + 1}`,
      L: null,
      DN: 150,
      C: 140,
      zEnd: 0,
      lossMode: "accesorios",
      kTotal: 0,
      leTotal: 0,
      hmPercent: 10,
      fittings: [],
      Q: null,
    });
  };

  const assumed: AssumedValue[] = [];
  if (inputs.P1 == null) assumed.push({ field: "P1", value: 0, label: "Sin P₁ — presiones no disponibles" });

  // Build profile chart data
  const profilePoints: { x: number; terrain: number; piezo: number | null }[] = [];
  if (results && inputs.tramos.length > 0) {
    let cumDist = 0;
    let currentZ = inputs.z1;
    profilePoints.push({ x: 0, terrain: inputs.z1, piezo: results.tramoResults[0]?.Pentry != null ? inputs.z1 + (results.tramoResults[0].Pentry ?? 0) : null });

    for (let i = 0; i < inputs.tramos.length; i++) {
      const t = inputs.tramos[i];
      const r = results.tramoResults[i];
      cumDist += t.L ?? 0;
      profilePoints.push({
        x: cumDist,
        terrain: t.zEnd,
        piezo: r?.Pexit != null ? t.zEnd + r.Pexit : null,
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
              Datos globales
            </h2>
            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => setInput("projectName", v)} type="text" />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField label="Caudal Q global" value={inputs.rawQ} onChange={(v) => setInput("rawQ", (v === "" ? null : parseFloat(v)) as never)} required={!inputs.variableFlow} tooltip="Caudal de agua que circula por toda la línea. Es el mismo en todos los tramos a menos que actives 'Caudal variable'" />
              </div>
              <select value={inputs.flowUnit} onChange={(e) => setInput("flowUnit", e.target.value as FlowUnit)} className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                <option value="L/s">L/s</option>
                <option value="m³/h">m³/h</option>
              </select>
            </div>

            <InputField label="Presión entrada P₁" value={inputs.P1} onChange={(v) => setInput("P1", (v === "" ? null : parseFloat(v)) as never)} unit="kg/cm²" tooltip="Presión del agua al inicio de la línea. Se mide con manómetro. Si no la conoces, se calculan pérdidas pero no presiones" />
            <InputField label="Cota inicial z₁" value={inputs.z1} onChange={(v) => setInput("z1", parseFloat(v) || 0)} unit="m.s.n.m." tooltip="Elevación del punto de inicio respecto al nivel del mar. Si no la conoces, déjala en 0" />

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={inputs.variableFlow} onChange={(e) => setInput("variableFlow", e.target.checked)} className="rounded border-gray-300" />
              Caudal variable por tramo
            </label>
          </div>

          {/* Tramos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tramos</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowRefTable(true)} className="text-[10px] text-[#1C3D5A] border border-[#1C3D5A]/30 px-2 py-1 rounded hover:bg-[#1C3D5A]/10 transition-colors">
                  Ref. K/Le
                </button>
                <button onClick={handleAddTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
                  + Tramo
                </button>
              </div>
            </div>

            {/* K/Le reference modal */}
            {showRefTable && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRefTable(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Referencia de coeficientes K y Le/D</h3>
                    <button onClick={() => setShowRefTable(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1C3D5A] text-white">
                        <th className="px-3 py-2 text-left">Accesorio</th>
                        <th className="px-3 py-2 text-center">K (adim.)</th>
                        <th className="px-3 py-2 text-center">Le/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {K_LE_REF.map((r, i) => (
                        <tr key={r.acc} className={`border-b border-gray-100 dark:border-gray-700 ${i % 2 ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}>
                          <td className="px-3 py-1.5">{r.acc}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{r.k.toFixed(1)}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{r.leD}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
                    Ref: Sotelo Avila — Hidráulica General Vol. 1 / Streeter-Wylie
                  </div>
                </div>
              </div>
            )}

            {inputs.tramos.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Agrega al menos un tramo para calcular</p>
            )}

            {inputs.tramos.map((t, i) => (
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
                  <InputField label="L (m)" value={t.L} onChange={(v) => updateTramo(t.id, { L: v === "" ? null : parseFloat(v) })} tooltip="Longitud de este tramo en metros" />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN (mm)</label>
                    <select
                      value={t.DN ?? ""}
                      onChange={(e) => updateTramo(t.id, { DN: parseInt(e.target.value) })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                    >
                      {STANDARD_DNS.map((dn) => <option key={dn} value={dn}>{dn}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                    <select
                      value={MATERIALS.find(m => m.c === t.C)?.name || "Personalizado"}
                      onChange={(e) => {
                        const mat = MATERIALS.find(m => m.name === e.target.value);
                        if (mat) updateTramo(t.id, { C: mat.c });
                      }}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                    >
                      {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name} (C={m.c})</option>)}
                    </select>
                  </div>
                  <InputField label="Cota final" value={t.zEnd} onChange={(v) => updateTramo(t.id, { zEnd: parseFloat(v) || 0 })} unit="m" tooltip="Elevacion al final de este tramo (m.s.n.m.)" />
                  {inputs.variableFlow && (
                    <InputField label="Q (L/s)" value={t.Q} onChange={(v) => updateTramo(t.id, { Q: v === "" ? null : flowToM3s(parseFloat(v), inputs.flowUnit) })} />
                  )}
                </div>

                {/* SIMEX Accessory Selector — integrated in tramo card */}
                {t.DN && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <ListaMaterialesSIMEX
                      mode="selector"
                      dnMM={t.DN}
                      materialRaw={MATERIALS.find(m => m.c === t.C)?.name}
                      externalAccs={simexPorTramo[t.id] || []}
                      onAccsChange={(accs) => setSimexPorTramo(prev => ({...prev, [t.id]: accs}))}
                    />
                    {(simexPorTramo[t.id]?.length ?? 0) > 0 && (
                      <p className="text-[10px] text-[#1C3D5A]/60 dark:text-blue-300/50 mt-1 font-medium">
                        {simexPorTramo[t.id].reduce((s, a) => s + a.qty, 0)} pza{simexPorTramo[t.id].reduce((s, a) => s + a.qty, 0) !== 1 ? 's' : ''} seleccionada{simexPorTramo[t.id].reduce((s, a) => s + a.qty, 0) !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DataStatusBanner assumed={assumed} missingRequired={inputs.tramos.length === 0 ? ["al menos un tramo"] : undefined} />
            </div>
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Análisis de Tuberías en Serie",
                  module: "En Serie",
                  projectName: inputs.projectName,
                  hasAssumedValues: inputs.P1 == null,
                  inputs: [
                    { label: "Caudal Q", value: inputs.rawQ != null ? `${inputs.rawQ} ${inputs.flowUnit}` : "—" },
                    { label: "Presión P₁", value: inputs.P1 != null ? `${inputs.P1} kg/cm²` : "No ingresada" },
                    { label: "Cota z₁", value: `${inputs.z1} m.s.n.m.` },
                    { label: "N° de tramos", value: `${inputs.tramos.length}` },
                  ],
                  results: [
                    { label: "Longitud total", value: formatNumber(results.totalLength, 1), unit: "m" },
                    { label: "hf total", value: formatNumber(results.totalHf, 3), unit: "m" },
                    { label: "hm total", value: formatNumber(results.totalHm, 3), unit: "m" },
                    { label: "P₂ final", value: results.finalPressure != null ? formatNumber(mcaToKgcm2(results.finalPressure), 2) : "Requiere P₁", unit: "kg/cm²" },
                  ],
                  alerts: results.alerts.filter((a) => a.level !== "OK").map((a) => ({ level: a.level, message: a.message })),
                  tableData: {
                    head: ["Tramo", "DN", "L (m)", "V (m/s)", "hf (m)", "hm (m)", "P ent.", "P sal."],
                    body: results.tramoResults.map((r, i) => {
                      const t = inputs.tramos[i];
                      return [t?.name || r.id, `${t?.DN}`, `${t?.L}`, formatNumber(r.V, 3), formatNumber(r.hf, 3), formatNumber(r.hm, 3), r.Pentry != null ? formatNumber(mcaToKgcm2(r.Pentry), 2) : "—", r.Pexit != null ? formatNumber(mcaToKgcm2(r.Pexit), 2) : "—"];
                    }),
                  },
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Longitud total" value={formatNumber(results.totalLength, 1)} unit="m" dataStatus={results.dataStatus} />
                <MetricCard label="hf total" value={formatNumber(results.totalHf, 3)} unit="m" dataStatus={results.dataStatus} />
                <MetricCard label="hm total" value={formatNumber(results.totalHm, 3)} unit="m" dataStatus={results.dataStatus} />
                <MetricCard label="P₂ final" value={results.finalPressure != null ? formatNumber(mcaToKgcm2(results.finalPressure), 2) : "—"} unit="kg/cm²" unavailableMessage={results.finalPressure == null ? "Requiere P₁" : undefined} />
              </div>

              {/* Tramo results table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1C3D5A] text-white">
                        <th className="px-3 py-2 text-left">Tramo</th>
                        <th className="px-3 py-2 text-right">DN</th>
                        <th className="px-3 py-2 text-right">L (m)</th>
                        <th className="px-3 py-2 text-right">V (m/s)</th>
                        <th className="px-3 py-2 text-right">hf (m)</th>
                        <th className="px-3 py-2 text-right">hm (m)</th>
                        <th className="px-3 py-2 text-right">P ent.</th>
                        <th className="px-3 py-2 text-right">P sal.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.tramoResults.map((r, i) => {
                        const tramo = inputs.tramos[i];
                        const hasError = r.Pexit != null && r.Pexit < 0;
                        return (
                          <tr key={r.id} className={`border-b border-gray-100 dark:border-gray-700 ${hasError ? "bg-red-50 dark:bg-red-900/10" : i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                            <td className="px-3 py-2">{tramo?.name || r.id}</td>
                            <td className="px-3 py-2 text-right font-mono">{tramo?.DN}</td>
                            <td className="px-3 py-2 text-right font-mono">{tramo?.L}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatNumber(r.V, 3)}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatNumber(r.hf, 3)}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatNumber(r.hm, 3)}</td>
                            <td className="px-3 py-2 text-right font-mono">{r.Pentry != null ? formatNumber(mcaToKgcm2(r.Pentry), 2) : "—"}</td>
                            <td className={`px-3 py-2 text-right font-mono ${hasError ? "text-red-600 font-bold" : ""}`}>
                              {r.Pexit != null ? formatNumber(mcaToKgcm2(r.Pexit), 2) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alerts */}
              {results.alerts.filter((a) => a.level !== "OK").map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Profile Chart */}
              {profilePoints.length >= 2 && (
                <HydraulicProfileChart points={profilePoints} title="Perfil Hidráulico Completo" />
              )}

              {/* SIMEX Material Tables — one per tramo with accessories */}
              {inputs.tramos.some(t => (simexPorTramo[t.id]?.length ?? 0) > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#1C3D5A] to-[#2A5A7A] px-5 py-3">
                    <h3 className="text-sm font-semibold text-white tracking-wide">Lista de Materiales SIMEX</h3>
                    <p className="text-[10px] text-white/50 mt-0.5">Generada desde los accesorios seleccionados por tramo</p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {inputs.tramos.map((t, i) => {
                      if (!t.DN || (simexPorTramo[t.id]?.length ?? 0) === 0) return null;
                      const r = results?.tramoResults[i];
                      const matName = MATERIALS.find(m => m.c === t.C)?.name;
                      return (
                        <div key={`simex-table-${t.id}`} className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-[#1C3D5A]/10 text-[#1C3D5A] dark:bg-blue-900/30 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                            <h4 className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300">{t.name}</h4>
                            <span className="text-[10px] text-gray-400 ml-auto">DN {t.DN} mm</span>
                          </div>
                          <ListaMaterialesSIMEX
                            mode="table"
                            dnMM={t.DN}
                            materialRaw={matName}
                            hf={r?.hf ?? undefined}
                            longitud={t.L ?? undefined}
                            externalAccs={simexPorTramo[t.id] || []}
                            onAccsChange={(accs) => setSimexPorTramo(prev => ({...prev, [t.id]: accs}))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
