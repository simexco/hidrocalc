"use client";

import { useEffect, useCallback, useRef } from "react";
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
import type { FlowUnit, SeriesTramo, AssumedValue } from "@/types/hydraulic";

export default function EnSeriePage() {
  const { inputs, results, setInput, setResults, addTramo, removeTramo, updateTramo } = useSeriesPipeStore();
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

  const handleAddTramo = () => {
    addTramo({
      id: uuid(),
      name: `Tramo ${inputs.tramos.length + 1}`,
      L: null,
      DN: 150,
      C: 140,
      zEnd: 0,
      lossMode: "percent",
      kTotal: 0,
      leTotal: 0,
      hmPercent: 10,
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tramos</h2>
              <button onClick={handleAddTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
                + Tramo
              </button>
            </div>

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
                  <InputField label="Coef. C" value={t.C} onChange={(v) => updateTramo(t.id, { C: parseFloat(v) || 140 })} tooltip="Coeficiente de rugosidad del material. PVC=150, HD nuevo diseño=130, HD verificacion=140" />
                  <InputField label="Cota final" value={t.zEnd} onChange={(v) => updateTramo(t.id, { zEnd: parseFloat(v) || 0 })} unit="m" tooltip="Elevacion al final de este tramo (m.s.n.m.)" />

                  {/* Minor losses mode selector */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Perdidas menores</label>
                    <div className="flex gap-1">
                      {(["K", "Le", "percent"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateTramo(t.id, { lossMode: mode })}
                          className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            (t.lossMode || "percent") === mode
                              ? "bg-[#1C3D5A] text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {mode === "K" ? "K (adim.)" : mode === "Le" ? "Le (m)" : "% de hf"}
                        </button>
                      ))}
                    </div>
                    {(t.lossMode || "percent") === "K" && (
                      <InputField label="K total" value={t.kTotal} onChange={(v) => updateTramo(t.id, { kTotal: parseFloat(v) || 0 })} tooltip="Suma de coeficientes K de accesorios (codos, valvulas, tees)" />
                    )}
                    {(t.lossMode) === "Le" && (
                      <InputField label="Le total" value={t.leTotal} onChange={(v) => updateTramo(t.id, { leTotal: parseFloat(v) || 0 })} unit="m" tooltip="Longitud equivalente total de accesorios en metros. Se calcula como Le = (Le/D) x D para cada accesorio" />
                    )}
                    {(t.lossMode || "percent") === "percent" && (
                      <InputField label="% de hf" value={t.hmPercent ?? 10} onChange={(v) => updateTramo(t.id, { hmPercent: parseFloat(v) || 10 })} unit="%" tooltip="Porcentaje de las perdidas por friccion. Valor tipico: 10% para estimacion preliminar" />
                    )}
                  </div>
                  {inputs.variableFlow && (
                    <InputField label="Q (L/s)" value={t.Q} onChange={(v) => updateTramo(t.id, { Q: v === "" ? null : flowToM3s(parseFloat(v), inputs.flowUnit) })} />
                  )}
                </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
