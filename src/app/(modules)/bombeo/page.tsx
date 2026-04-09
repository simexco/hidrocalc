"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { usePumpOperationStore } from "@/store/calculationStore";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { PumpCurveChart } from "@/components/hydraulic/PumpCurveChart";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { calculatePumpOperation } from "@/lib/calculations/pump-operation";
import { formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS, MATERIALS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import type { PumpInputMethod, PumpPoint } from "@/types/hydraulic";

export default function BombeoPage() {
  const { inputs, results, setInput, setResults, addPumpPoint, removePumpPoint, updatePumpPoint } = usePumpOperationStore();
  const [p2Req, setP2Req] = useState<number>(0); // kg/cm² — pressure required at delivery
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const saved = loadFormState<typeof inputs>("bombeo");
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setInput(key as keyof typeof inputs, value as never);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("bombeo", inputs), 1000);
  }, [inputs]);

  const runCalc = useCallback(() => {
    // Hs = Hg + P2_requerida (converted to m.c.a.)
    const Hs = (inputs.Hg ?? 0) + (p2Req * 10);
    const res = calculatePumpOperation({ ...inputs, Hg: Hs });
    setResults(res);
  }, [inputs, p2Req, setResults]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleNum = (key: keyof typeof inputs, val: string) => {
    setInput(key, (val === "" ? null : parseFloat(val)) as never);
  };

  const handleMaterial = (name: string) => {
    const mat = MATERIALS.find((m) => m.name === name);
    if (mat) setInput("C", mat.c);
  };

  const missing: string[] = [];
  if (inputs.Hg == null) missing.push("altura estática (Hg)");
  if (inputs.L == null) missing.push("longitud (L)");
  if (inputs.pumpMethod === "equation" && (inputs.H0 == null || inputs.Kbomba == null)) missing.push("datos de la bomba (H₀, K)");
  if (inputs.pumpMethod === "points" && inputs.pumpPoints.length < 2) missing.push("al menos 2 puntos de la bomba");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* System inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
              Sistema
            </h2>
            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => setInput("projectName", v)} type="text" />
            <InputField label="Altura geométrica Hg" value={inputs.Hg} onChange={(v) => handleNum("Hg", v)} unit="m" required tooltip="Diferencia de elevacion entre la succion y la descarga de la bomba (z2 - z1)" />
            <InputField label="Presión remanente P2" value={p2Req} onChange={(v) => setP2Req(parseFloat(v) || 0)} unit="kg/cm2" tooltip="Presión minima requerida en el punto de entrega (tanque, red). Si descarga a tanque atmosferico, usar 0." />
            <p className="text-[10px] text-gray-400 -mt-2 mb-1">Hs = Hg + P2 = {((inputs.Hg ?? 0) + p2Req * 10).toFixed(1)} m</p>
            <InputField label="Longitud total L" value={inputs.L} onChange={(v) => handleNum("L", v)} unit="m" required tooltip="Longitud total de la tubería desde la bomba hasta el punto de descarga" />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN</label>
              <select
                value={inputs.DN ?? ""}
                onChange={(e) => setInput("DN", parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {STANDARD_DNS.map((dn) => <option key={dn} value={dn}>{dn} mm</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
              <select
                onChange={(e) => handleMaterial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            <InputField label="K total accesorios" value={inputs.kTotal} onChange={(v) => setInput("kTotal", parseFloat(v) || 0)} tooltip="Suma de todos los coeficientes K de pérdidas menores (codos, válvulas, tees, etc.). Si no lo conoces, déjalo en 0 y se estimará como 10% de las pérdidas por fricción" />
          </div>

          {/* Pump inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
              Bomba
            </h2>

            <div className="flex gap-2">
              {(["equation", "points"] as PumpInputMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setInput("pumpMethod", m)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    inputs.pumpMethod === m ? "bg-[#1C3D5A] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {m === "equation" ? "Ecuación" : "Puntos"}
                </button>
              ))}
            </div>

            {inputs.pumpMethod === "equation" ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400">H = H₀ - K × Q²</p>
                <InputField label="H₀ (carga a Q=0)" value={inputs.H0} onChange={(v) => handleNum("H0", v)} unit="m" required tooltip="Altura máxima que da la bomba cuando no fluye agua (caudal cero). Se obtiene de la curva del fabricante o de la placa de la bomba" />
                <InputField label="K bomba" value={inputs.Kbomba} onChange={(v) => handleNum("Kbomba", v)} required tooltip="Coeficiente de la curva de la bomba. Define qué tan rápido cae la altura al aumentar el caudal. Valores típicos: 0.001 a 0.1. A menor K, la bomba mantiene más presión a caudales altos" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ingresa 3-8 puntos Q-H</p>
                  <button
                    onClick={() => addPumpPoint({ Q: 0, H: 0 })}
                    disabled={inputs.pumpPoints.length >= 8}
                    className="text-xs bg-[#1C3D5A] text-white px-2 py-1 rounded hover:bg-[#0F2438] transition-colors disabled:opacity-50"
                  >
                    + Punto
                  </button>
                </div>
                {inputs.pumpPoints.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <InputField label={`Q${i + 1}`} value={p.Q} onChange={(v) => updatePumpPoint(i, { Q: parseFloat(v) || 0, H: p.H })} unit="L/s" className="flex-1" />
                    <InputField label={`H${i + 1}`} value={p.H} onChange={(v) => updatePumpPoint(i, { Q: p.Q, H: parseFloat(v) || 0 })} unit="m" className="flex-1" />
                    <button onClick={() => removePumpPoint(i)} className="text-red-400 hover:text-red-600 text-xs mt-5">&#10005;</button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {missing.length > 0 ? (
                <DataStatusBanner assumed={[]} missingRequired={missing} />
              ) : (
                <DataStatusBanner assumed={[]} />
              )}
            </div>
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Punto de Operación de Bomba",
                  module: "Bombeo",
                  projectName: inputs.projectName,
                  hasAssumedValues: false,
                  inputs: [
                    { label: "Altura estática Hg", value: inputs.Hg != null ? `${inputs.Hg} m` : "—" },
                    { label: "Longitud L", value: inputs.L != null ? `${inputs.L} m` : "—" },
                    { label: "DN", value: inputs.DN != null ? `${inputs.DN} mm` : "—" },
                    { label: "C", value: `${inputs.C}` },
                    { label: "K accesorios", value: `${inputs.kTotal}` },
                    { label: "Método bomba", value: inputs.pumpMethod === "equation" ? `Ecuación: H=${inputs.H0} - ${inputs.Kbomba}×Q²` : `${inputs.pumpPoints.length} puntos` },
                  ],
                  results: [
                    { label: "Q operación", value: results.Qop != null ? formatNumber(results.Qop, 1) : "No encontrado", unit: "L/s" },
                    { label: "H operación", value: results.Hop != null ? formatNumber(results.Hop, 1) : "—", unit: "m" },
                    ...(results.recommendation ? [
                      { label: "Tipo de bomba", value: results.recommendation.pumpType, unit: "" },
                      { label: "Potencia motor", value: `${results.recommendation.powerHP} HP (${formatNumber(results.recommendation.powerKW, 1)} kW)`, unit: "" },
                      { label: "Eficiencia minima", value: `${results.recommendation.minEfficiency}%`, unit: "" },
                      { label: "RPM recomendadas", value: `${results.recommendation.motorRPM}`, unit: "RPM" },
                      { label: "NPSH requerido (est.)", value: formatNumber(results.recommendation.NPSHr_estimated, 1), unit: "m" },
                    ] : []),
                  ],
                  alerts: [
                    ...results.alerts.map((a) => ({ level: a.level, message: a.message })),
                    ...(results.recommendation?.observations.map((o) => ({ level: "WARN", message: o })) ?? []),
                  ],
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Operation point */}
              {results.Qop != null && results.Hop != null && (
                <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 border border-[#1C3D5A]/30 rounded-xl p-5 text-center">
                  <p className="text-xs text-[#1C3D5A] dark:text-blue-300 font-medium mb-1">Punto de operación</p>
                  <p className="text-2xl font-bold text-[#1C3D5A] dark:text-white">
                    {formatNumber(results.Qop, 1)} <span className="text-sm font-normal">L/s</span>
                    <span className="mx-2 text-gray-400">@</span>
                    {formatNumber(results.Hop, 1)} <span className="text-sm font-normal">m</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Q operación" value={results.Qop != null ? formatNumber(results.Qop, 1) : "—"} unit="L/s" dataStatus={results.dataStatus} />
                <MetricCard label="H operación" value={results.Hop != null ? formatNumber(results.Hop, 1) : "—"} unit="m" dataStatus={results.dataStatus} />
              </div>

              {/* Curve chart */}
              {results.systemCurve.length > 0 && results.pumpCurve.length > 0 && (
                <PumpCurveChart
                  systemCurve={results.systemCurve}
                  pumpCurve={results.pumpCurve}
                  Qop={results.Qop}
                  Hop={results.Hop}
                />
              )}

              {/* Pump Recommendation */}
              {results.recommendation && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-[#1C3D5A] px-5 py-3">
                    <h3 className="text-sm font-semibold text-white">Recomendación de Bomba</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Type */}
                    <div>
                      <p className="text-lg font-bold text-[#1C3D5A] dark:text-white">{results.recommendation.pumpType}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{results.recommendation.pumpTypeDesc}</p>
                    </div>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#E9EFF5] dark:bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Potencia</p>
                        <p className="text-xl font-bold text-[#1C3D5A] dark:text-white">{results.recommendation.powerHP}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">HP</p>
                        <p className="text-[10px] text-gray-400">({formatNumber(results.recommendation.powerKW, 1)} kW)</p>
                      </div>
                      <div className="bg-[#E9EFF5] dark:bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Eficiencia mín.</p>
                        <p className="text-xl font-bold text-[#1C3D5A] dark:text-white">{results.recommendation.minEfficiency}%</p>
                      </div>
                      <div className="bg-[#E9EFF5] dark:bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">RPM</p>
                        <p className="text-xl font-bold text-[#1C3D5A] dark:text-white">{results.recommendation.motorRPM}</p>
                      </div>
                      <div className="bg-[#E9EFF5] dark:bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NPSH req.</p>
                        <p className="text-xl font-bold text-[#1C3D5A] dark:text-white">{formatNumber(results.recommendation.NPSHr_estimated, 1)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">m</p>
                      </div>
                    </div>

                    {/* Observations */}
                    {results.recommendation.observations.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Observaciones</p>
                        <ul className="space-y-1.5">
                          {results.recommendation.observations.map((obs, i) => (
                            <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-[#1C3D5A] mt-0.5 shrink-0">&#8226;</span>
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
