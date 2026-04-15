"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useVRPStore } from "@/store/calculationStore";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { calculateVRP } from "@/lib/calculations/vrp";
import { formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import type { FlowUnit, AssumedValue } from "@/types/hydraulic";

export default function VRPPage() {
  const { inputs, results, setInput, setResults } = useVRPStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const saved = loadFormState<typeof inputs>("vrp");
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setInput(key as keyof typeof inputs, value as never);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("vrp", inputs), 1000);
  }, [inputs]);

  const runCalc = useCallback(() => {
    const res = calculateVRP(inputs);
    setResults(res);
  }, [inputs, setResults]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleNum = (key: keyof typeof inputs, val: string) => {
    setInput(key, (val === "" ? null : parseFloat(val)) as never);
  };

  const missing: string[] = [];
  if (inputs.rawQMax == null) missing.push("caudal maximo Q");
  if (inputs.P1 == null) missing.push("presion aguas arriba P1");
  if (inputs.P2 == null) missing.push("presion objetivo P2");

  const assumed: AssumedValue[] = [];
  if (inputs.rawQMin == null) assumed.push({ field: "qMin", value: 0, label: "Sin Q minimo - se estima 10% de Q max" });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
              Datos del sistema
            </h2>
            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => setInput("projectName", v)} type="text" />

            {/* Q max */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField
                  label="Caudal maximo Q"
                  value={inputs.rawQMax}
                  onChange={(v) => handleNum("rawQMax", v)}
                  required
                  tooltip="Caudal maximo de diseno de la linea. El Cv se calcula para este caudal."
                />
              </div>
              <select
                value={inputs.flowUnit}
                onChange={(e) => setInput("flowUnit", e.target.value as FlowUnit)}
                className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="L/s">L/s</option>
                <option value="m³/h">m3/h</option>
              </select>
            </div>

            {/* Q min */}
            <InputField
              label="Caudal minimo Q (opcional)"
              value={inputs.rawQMin}
              onChange={(v) => handleNum("rawQMin", v)}
              unit={inputs.flowUnit}
              tooltip="Caudal minimo esperado. Se usa para verificar estabilidad de la valvula a baja demanda. Si no lo conoces, se estima como 10% de Q max."
            />

            <InputField
              label="Presion aguas arriba P1"
              value={inputs.P1}
              onChange={(v) => handleNum("P1", v)}
              unit="kg/cm2"
              required
              tooltip="Presion disponible antes de la valvula reductora"
            />
            <InputField
              label="Presion objetivo P2"
              value={inputs.P2}
              onChange={(v) => handleNum("P2", v)}
              unit="kg/cm2"
              required
              tooltip="Presion deseada aguas abajo de la valvula"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Diametro de la linea DN (mm)</label>
              <select
                value={inputs.DN ?? ""}
                onChange={(e) => setInput("DN", parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {STANDARD_DNS.filter(dn => dn <= 600).map((dn) => <option key={dn} value={dn}>{dn}</option>)}
              </select>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-xl p-4 text-xs text-[#1C3D5A] dark:text-blue-300 space-y-2">
            <p className="font-semibold">Como funciona</p>
            <p className="text-[11px] leading-relaxed opacity-80">
              Se calcula el coeficiente de flujo Cv necesario para reducir la presion de P1 a P2 al caudal de diseno,
              usando la formula IEC 60534. Luego se selecciona el tamano de valvula donde la apertura se mantenga
              entre 30% y 70% para operacion estable.
            </p>
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
                  title: "Seleccion de Valvula Reductora de Presion",
                  module: "VRP",
                  projectName: inputs.projectName,
                  hasAssumedValues: inputs.rawQMin == null,
                  inputs: [
                    { label: "Q maximo", value: inputs.rawQMax != null ? `${inputs.rawQMax} ${inputs.flowUnit}` : "--" },
                    { label: "Q minimo", value: inputs.rawQMin != null ? `${inputs.rawQMin} ${inputs.flowUnit}` : "10% de Q max" },
                    { label: "P1", value: inputs.P1 != null ? `${inputs.P1} kg/cm2` : "--" },
                    { label: "P2", value: inputs.P2 != null ? `${inputs.P2} kg/cm2` : "--" },
                    { label: "DN linea", value: inputs.DN != null ? `${inputs.DN} mm` : "--" },
                  ],
                  results: [
                    { label: "DN recomendado", value: results.recommendedDN ?? "Excede catalogo", unit: "" },
                    { label: "Cv requerido", value: formatNumber(results.Cv_max_req, 1), unit: "" },
                    { label: "Apertura Q max", value: results.pct_apertura_max != null ? `${results.pct_apertura_max}` : "--", unit: "%" },
                    { label: "Apertura Q min", value: results.pct_apertura_min != null ? `${results.pct_apertura_min}` : "--", unit: "%" },
                    { label: "Indice cavitacion", value: formatNumber(results.sigma, 2), unit: "" },
                    { label: "Relacion P1/P2", value: `${results.relacionPresion}:1`, unit: "" },
                    { label: "DeltaP", value: formatNumber(results.deltaP_bar, 2), unit: "bar" },
                    { label: "V aguas abajo", value: formatNumber(results.v_aguas_abajo, 2), unit: "m/s" },
                  ],
                  alerts: results.alerts.map((a) => ({ level: a.level, message: a.message })),
                  tableData: {
                    head: ["DN", "Cv max", "% Q max", "% Q min", "Estado"],
                    body: results.selectionTable.map(r => [
                      r.dn,
                      `${r.cv_max}`,
                      r.status === "insuficiente" ? "--" : `${r.pct_max}%`,
                      r.status === "insuficiente" ? "--" : `${r.pct_min}%`,
                      r.status === "optimo" ? "Optimo" : r.status === "funcional" ? "Funcional" : r.status === "limite" ? "Limite" : "Insuficiente",
                    ]),
                  },
                };
              }}
            />
          </div>

          {results && results.alerts.find(a => a.field === "P2" && a.level === "ERROR") ? (
            <AlertBanner level="ERROR" message="P2 debe ser menor que P1 para que la valvula reduzca presion." />
          ) : results && (
            <>
              {/* Main recommendation */}
              {results.recommendedDN ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                    Valvula reductora recomendada
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[11px] text-green-600 dark:text-green-400">DN valvula</div>
                      <div className="text-2xl font-semibold text-green-900 dark:text-green-200">{results.recommendedDN}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-green-600 dark:text-green-400">Cv requerido</div>
                      <div className="text-2xl font-semibold text-green-900 dark:text-green-200">{formatNumber(results.Cv_max_req, 1)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-green-600 dark:text-green-400">Apertura Q max</div>
                      <div className="text-2xl font-semibold text-green-900 dark:text-green-200">{results.pct_apertura_max}%</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-green-600 dark:text-green-400">Apertura Q min</div>
                      <div className="text-2xl font-semibold text-green-900 dark:text-green-200">{results.pct_apertura_min}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <AlertBanner level="ERROR" message="El Cv requerido excede los tamanos estandar de catalogo. Consultar directamente con el fabricante." />
              )}

              {/* System parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="DeltaP" value={formatNumber(results.deltaP_bar, 2)} unit="bar" dataStatus={results.dataStatus} />
                <MetricCard label="Q max" value={formatNumber(results.Q_max_m3h, 1)} unit="m3/h" dataStatus={results.dataStatus} />
                <MetricCard
                  label="Indice cavitacion"
                  value={formatNumber(results.sigma, 2)}
                  unit={`\u03C3`}
                  alertLevel={results.riesgoCavitacion ? "WARN" : "OK"}
                  dataStatus={results.dataStatus}
                />
                <MetricCard
                  label="Relacion P1/P2"
                  value={`${results.relacionPresion}:1`}
                  alertLevel={results.dobleEtapa ? "WARN" : "OK"}
                  dataStatus={results.dataStatus}
                />
                <MetricCard label="V aguas abajo" value={formatNumber(results.v_aguas_abajo, 2)} unit="m/s" alertLevel={results.v_aguas_abajo > 3 ? "WARN" : "OK"} dataStatus={results.dataStatus} />
                <MetricCard label="Cv min req" value={formatNumber(results.Cv_min_req, 1)} dataStatus={results.dataStatus} />
              </div>

              {/* Selection table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-[#1C3D5A] px-4 py-2">
                  <h3 className="text-xs font-semibold text-white">Tabla de seleccion — todos los tamanos</h3>
                </div>
                <div className="px-4 py-2 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <strong>Optimo:</strong> apertura 35-65%.
                  <strong className="ml-2">Funcional:</strong> apertura 20-35% o 65-75%.
                  <strong className="ml-2">Limite:</strong> apertura {">"}75%.
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <th className="px-3 py-2 text-left">DN</th>
                      <th className="px-3 py-2 text-right">Cv max</th>
                      <th className="px-3 py-2 text-right">Apertura Q max</th>
                      <th className="px-3 py-2 text-right">Apertura Q min</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.selectionTable.map((row) => {
                      const bg = row.isRecommended
                        ? "bg-green-50 dark:bg-green-900/20"
                        : row.status === "optimo"
                        ? "bg-green-50/50 dark:bg-green-900/10"
                        : "";
                      return (
                        <tr key={row.dn} className={`border-b border-gray-100 dark:border-gray-700 ${bg}`}>
                          <td className="px-3 py-2 font-medium">
                            {row.dn}
                            {row.isRecommended && <span className="ml-1.5 text-[10px] bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">REC</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{row.cv_max}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {row.status === "insuficiente" ? "--" : `${row.pct_max}%`}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {row.status === "insuficiente" ? "--" : `${row.pct_min}%`}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {row.status === "optimo" && <span className="text-green-600 font-medium">{"\u2705"} Optimo</span>}
                            {row.status === "funcional" && <span className="text-blue-600">{"\u2713"} Funcional</span>}
                            {row.status === "limite" && <span className="text-yellow-600">{"\u26A0"} Limite sup.</span>}
                            {row.status === "insuficiente" && <span className="text-red-500">{"\u2717"} Insuficiente</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
                  Cv = Q(m3/h) / raiz(DeltaP en bar). IEC 60534 / Crane TP-410 para agua a 20 grados C.
                  Factor de seleccion: operacion entre 30-70% de apertura.
                </div>
              </div>

              {/* Alerts */}
              {results.alerts.filter((a) => a.level !== "OK").map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Note */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Calculo basado en IEC 60534 / Crane TP-410 para valvulas de control con agua a 20 grados C.
                Seleccion preliminar — para instalacion final, verificar con el fabricante
                la curva Cv vs. apertura del modelo especifico y las condiciones de cavitacion.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
