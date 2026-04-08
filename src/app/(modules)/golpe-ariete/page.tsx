"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useWaterHammerStore, useSinglePipeStore } from "@/store/calculationStore";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { calculateWaterHammer } from "@/lib/calculations/water-hammer";
import { formatNumber, mcaToKgcm2 } from "@/lib/calculations/conversions";
import { PIPE_ELASTICITY, THICKNESS_BY_MATERIAL, PIPE_CLASSES_BY_MATERIAL, PVC_THICKNESS, PVC_CLASSES, PVC_SYSTEM_LABELS, type PVCSystem } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import type { AssumedValue } from "@/types/hydraulic";

export default function GolpeArietePage() {
  const { inputs, results, setInput, setResults } = useWaterHammerStore();
  const singlePipe = useSinglePipeStore();
  const [showThicknessRef, setShowThicknessRef] = useState(false);
  const [pvcSystem, setPvcSystem] = useState<PVCSystem>("metrico");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const saved = loadFormState<typeof inputs>("golpe-ariete");
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setInput(key as keyof typeof inputs, value as never);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("golpe-ariete", inputs), 1000);
  }, [inputs]);

  const runCalc = useCallback(() => {
    // Convert P0 from kg/cm² to m.c.a. for engine
    const inputsConverted = {
      ...inputs,
      P0: inputs.P0 != null ? inputs.P0 * 10 : null,
    };
    const res = calculateWaterHammer(inputsConverted, inputs.materialName === "PVC" ? pvcSystem : undefined);
    setResults(res);
  }, [inputs, pvcSystem, setResults]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleNum = (key: keyof typeof inputs, val: string) => {
    setInput(key, (val === "" ? null : parseFloat(val)) as never);
  };

  const handleMaterial = (name: string) => {
    const mat = PIPE_ELASTICITY.find((m) => m.name === name);
    setInput("materialName", name);
    if (mat && name !== "Personalizado") setInput("E", mat.E);
  };

  const handleImportFromMod1 = () => {
    const v = singlePipe.results?.V;
    if (v != null) setInput("V0", v);
    const dn = singlePipe.inputs.DN;
    if (dn != null) setInput("D", dn);
    const l = singlePipe.inputs.L;
    if (l != null) setInput("L", l);
  };

  const missing: string[] = [];
  if (inputs.V0 == null) missing.push("velocidad V₀");
  if (inputs.D == null) missing.push("diámetro D");
  if (inputs.e == null) missing.push("espesor e");
  if (inputs.Tc == null) missing.push("tiempo cierre Tc");
  if (inputs.L == null) missing.push("longitud L");

  const assumed: AssumedValue[] = [];
  if (inputs.P0 == null) assumed.push({ field: "P0", value: 0, label: "Sin presión estática — resultados parciales" });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos de entrada</h2>
              {singlePipe.results?.V != null && (
                <button
                  onClick={handleImportFromMod1}
                  className="text-xs bg-[#E9EFF5] text-[#1C3D5A] px-2 py-1 rounded hover:bg-[#1C3D5A] hover:text-white transition-colors"
                >
                  Importar de Módulo 1
                </button>
              )}
            </div>

            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => setInput("projectName", v)} type="text" />
            <InputField
              label="Velocidad V₀"
              value={inputs.V0}
              onChange={(v) => handleNum("V0", v)}
              unit="m/s"
              required
              tooltip="Velocidad del agua en la tubería antes del cierre de válvula. Puedes obtenerla del Módulo 1 (Tramo Simple) o calcularla como Q/A"
            />
            <InputField label="Diámetro interno D" value={inputs.D} onChange={(v) => handleNum("D", v)} unit="mm" required tooltip="Diámetro interior real de la tubería (no el nominal). Consulta la ficha técnica del fabricante" />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField label="Espesor de pared e" value={inputs.e} onChange={(v) => handleNum("e", v)} unit="mm" required tooltip="Grosor de la pared de la tubería en milímetros. Haz clic en 'Ver ref.' para consultar valores típicos por diámetro" />
              </div>
              <button
                onClick={() => setShowThicknessRef(!showThicknessRef)}
                className="text-xs text-[#1C3D5A] hover:underline whitespace-nowrap pb-2"
              >
                {showThicknessRef ? "Ocultar ref." : "Ver ref."}
              </button>
            </div>

            {showThicknessRef && (() => {
              const ref = inputs.materialName === "PVC" ? PVC_THICKNESS[pvcSystem] : THICKNESS_BY_MATERIAL[inputs.materialName];
              if (!ref) return (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs text-gray-500">
                  Consultar especificaciones del fabricante o norma del proyecto.
                </div>
              );
              return (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">{ref.title}</p>
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400">
                        {ref.columns.map((c) => <th key={c} className="text-left py-0.5 px-1 font-medium">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ref.rows.map((r) => (
                        <tr key={r.label} className="text-gray-500 dark:text-gray-400">
                          <td className="py-0.5 px-1">{r.label}</td>
                          {r.values.map((v, i) => <td key={i} className="py-0.5 px-1 font-mono">{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ref.note && <p className="text-[10px] text-gray-400 mt-1">{ref.note}</p>}
                </div>
              );
            })()}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material (Módulo E)</label>
              <select
                value={inputs.materialName}
                onChange={(e) => handleMaterial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {PIPE_ELASTICITY.map((m) => (
                  <option key={m.name} value={m.name}>{m.name} ({(m.E / 1e9).toFixed(0)} GPa)</option>
                ))}
              </select>
              {inputs.materialName === "Personalizado" && (
                <InputField label="E (Pa)" value={inputs.E} onChange={(v) => setInput("E", parseFloat(v) || 0)} tooltip="Modulo de elasticidad del material en Pascales. Ej: Hierro ductil = 169,000,000,000 Pa" />
              )}
              {inputs.materialName === "PVC" && (
                <div className="mt-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Sistema PVC</label>
                  <select
                    value={pvcSystem}
                    onChange={(e) => setPvcSystem(e.target.value as PVCSystem)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  >
                    {(Object.keys(PVC_SYSTEM_LABELS) as PVCSystem[]).map((sys) => (
                      <option key={sys} value={sys}>{PVC_SYSTEM_LABELS[sys]}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <InputField label="Presión estática P₀" value={inputs.P0} onChange={(v) => handleNum("P0", v)} unit="kg/cm²" tooltip="Presión normal de operación en la tubería antes del cierre de válvula. Se mide con manómetro en metros columna de agua" />
            <InputField
              label="Tiempo de cierre Tc"
              value={inputs.Tc}
              onChange={(v) => handleNum("Tc", v)}
              unit="s"
              required
              tooltip="Tiempo en que la válvula pasa de totalmente abierta a cerrada. A mayor tiempo de cierre, menor golpe de ariete"
            />
            <InputField label="Longitud L" value={inputs.L} onChange={(v) => handleNum("L", v)} unit="m" required tooltip="Longitud total de la tubería desde la válvula hasta el punto donde se refleja la onda de presión (tanque, reservorio, etc.)" />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {missing.length > 0 ? (
                <DataStatusBanner assumed={[]} missingRequired={missing} />
              ) : (
                <DataStatusBanner assumed={assumed} />
              )}
            </div>
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Análisis de Golpe de Ariete",
                  module: "Golpe de Ariete",
                  projectName: inputs.projectName,
                  hasAssumedValues: inputs.P0 == null,
                  inputs: [
                    { label: "Velocidad V₀", value: inputs.V0 != null ? `${inputs.V0} m/s` : "—" },
                    { label: "Diámetro D", value: inputs.D != null ? `${inputs.D} mm` : "—" },
                    { label: "Espesor e", value: inputs.e != null ? `${inputs.e} mm` : "—" },
                    { label: "Material", value: `${inputs.materialName}` },
                    { label: "Presión estática P₀", value: inputs.P0 != null ? `${inputs.P0} kg/cm²` : "No ingresada" },
                    { label: "Tiempo cierre Tc", value: inputs.Tc != null ? `${inputs.Tc} s` : "—" },
                    { label: "Longitud L", value: inputs.L != null ? `${inputs.L} m` : "—" },
                  ],
                  results: [
                    { label: "Velocidad de onda a", value: formatNumber(results.a, 1), unit: "m/s" },
                    { label: "Período de fase T", value: formatNumber(results.Tphase, 2), unit: "s" },
                    { label: "Tipo de cierre", value: results.closureType === "brusco" ? "BRUSCO" : "LENTO", unit: "" },
                    { label: "Sobrepresión ΔH", value: formatNumber(mcaToKgcm2(results.deltaH ?? 0), 3), unit: "kg/cm²" },
                    { label: "ΔP", value: formatNumber(results.deltaP_kPa, 1), unit: "kPa" },
                    { label: "P máxima", value: formatNumber(mcaToKgcm2(results.Pmax ?? 0), 3), unit: "kg/cm²" },
                    { label: "P mínima", value: formatNumber(mcaToKgcm2(results.Pmin ?? 0), 3), unit: "kg/cm²" },
                    { label: "P máx (bar)", value: formatNumber(results.Pmax_bar, 1), unit: "bar" },
                    { label: "Clase recomendada", value: results.pipeClass ?? "—", unit: "" },
                  ],
                  alerts: results.alerts.map((a) => ({ level: a.level, message: a.message })),
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Closure type banner */}
              <div className={`rounded-xl p-4 text-center font-medium ${
                results.closureType === "brusco"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300"
                  : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
              }`}>
                {results.closureType === "brusco" ? "&#9888; Cierre Brusco" : "&#10003; Cierre Lento"}
                <span className="text-xs ml-2 font-normal">
                  (Tc={inputs.Tc}s {results.closureType === "brusco" ? "<" : "≥"} Tfase={formatNumber(results.Tphase, 2)}s)
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label="Velocidad de onda a" value={formatNumber(results.a, 1)} unit="m/s" dataStatus={results.dataStatus} />
                <MetricCard label="Período de fase T" value={formatNumber(results.Tphase, 2)} unit="s" dataStatus={results.dataStatus} />
                <MetricCard label="Sobrepresión ΔH" value={formatNumber(mcaToKgcm2(results.deltaH ?? 0), 3)} unit="kg/cm²" dataStatus={results.dataStatus} />
                <MetricCard label="ΔP" value={formatNumber(results.deltaP_kPa, 1)} unit="kPa" dataStatus={results.dataStatus} />
                <MetricCard label="ΔP" value={formatNumber(results.deltaP_bar, 2)} unit="bar" dataStatus={results.dataStatus} />
                <MetricCard
                  label="P máxima"
                  value={formatNumber(mcaToKgcm2(results.Pmax ?? 0), 3)}
                  unit="kg/cm²"
                  alertLevel={results.Pmax != null && results.Pmax_bar != null && results.Pmax_bar > 64 ? "ERROR" : results.Pmax_bar != null && results.Pmax_bar > 40 ? "WARN" : "OK"}
                  dataStatus={results.dataStatus}
                />
                <MetricCard
                  label="P mínima"
                  value={formatNumber(mcaToKgcm2(results.Pmin ?? 0), 3)}
                  unit="kg/cm²"
                  alertLevel={results.Pmin != null && results.Pmin < -10 ? "CRITICAL" : results.Pmin != null && results.Pmin < 0 ? "ERROR" : "OK"}
                  dataStatus={results.dataStatus}
                />
                <MetricCard label="P máx (bar)" value={formatNumber(results.Pmax_bar, 1)} unit="bar" dataStatus={results.dataStatus} />
                <MetricCard
                  label="Clase de tubería"
                  value={results.pipeClass ?? "—"}
                  alertLevel={results.pipeClass === "Excede K12" ? "ERROR" : "OK"}
                  dataStatus={results.dataStatus}
                />
              </div>

              {/* Safe Tc recommendation */}
              {results.closureType === "brusco" && results.safeTc != null && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                  Tc minimo recomendado para cierre lento: <strong>{formatNumber(results.safeTc, 2)} s</strong>
                </div>
              )}

              {/* Pipe class comparison table — dynamic by material */}
              {results.Pmax_bar != null && (() => {
                const matClasses = inputs.materialName === "PVC" ? PVC_CLASSES[pvcSystem] : PIPE_CLASSES_BY_MATERIAL[inputs.materialName];
                if (!matClasses) return (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-xs text-gray-500">
                    La recomendacion de clase no esta disponible para este material. Consultar la norma aplicable al proyecto.
                  </div>
                );
                return (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-[#1C3D5A] px-4 py-2">
                      <h3 className="text-xs font-semibold text-white">Clases disponibles ({matClasses.title})</h3>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          <th className="px-3 py-2 text-left">Clase</th>
                          <th className="px-3 py-2 text-right">PN (bar)</th>
                          <th className="px-3 py-2 text-center">Cumple Pmax</th>
                          <th className="px-3 py-2 text-right">Factor seg.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matClasses.classes.map((row) => {
                          const cumple = results.Pmax_bar != null && results.Pmax_bar <= row.pn;
                          const fs = results.Pmax_bar != null && results.Pmax_bar > 0 ? row.pn / results.Pmax_bar : 0;
                          const isRec = row.clase === results.pipeClass;
                          return (
                            <tr key={row.clase} className={`border-b border-gray-100 dark:border-gray-700 ${isRec ? "bg-green-50 dark:bg-green-900/20 font-medium" : ""}`}>
                              <td className="px-3 py-2">
                                {row.clase}
                                {isRec && <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded">REC</span>}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{row.pn}</td>
                              <td className="px-3 py-2 text-center">
                                {cumple ? <span className="text-green-600">&#10003;</span> : <span className="text-red-500">&#10005;</span>}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{fs > 0 ? fs.toFixed(2) : "\u2014"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {matClasses.note && (
                      <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
                        {matClasses.note}. Factor seg. = PN / Pmax.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Alerts */}
              {results.alerts.filter((a) => a.level !== "OK").map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
