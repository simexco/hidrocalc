"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InputField } from "@/components/ui/InputField";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { FormulaDetail } from "@/components/ui/FormulaDetail";
import { calculateTankStorage, REGULATION_COEFFICIENTS, type TankStorageInputs, type TankShape } from "@/lib/calculations/tank-storage";
import { formatNumber } from "@/lib/calculations/conversions";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";

const defaults: TankStorageInputs = {
  projectName: "Tanque de regulacion",
  Qmd_ls: null,
  horasAportacion: 24,
  incluirReserva: false,
  horasReserva: 2,
  shape: "rectangular",
  altura: 3,
  bordoLibre: 0.3,
};

export default function TanquePage() {
  const [inputs, setInputs] = useState<TankStorageInputs>({ ...defaults });
  const [results, setResults] = useState<ReturnType<typeof calculateTankStorage>>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = <K extends keyof TankStorageInputs>(key: K, value: TankStorageInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const saved = loadFormState<TankStorageInputs>("tanque");
    if (saved) setInputs({ ...defaults, ...saved });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("tanque", inputs), 1000);
    return () => clearTimeout(t);
  }, [inputs]);

  const runCalc = useCallback(() => {
    setResults(calculateTankStorage(inputs));
  }, [inputs]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleReset = () => { setInputs({ ...defaults }); setResults(null); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tanque de regulacion</h2>
              <ResetButton moduleKey="tanque" onReset={handleReset} />
            </div>

            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => set("projectName", v)} type="text" />

            <InputField label="Gasto medio diario Qmd" value={inputs.Qmd_ls} onChange={(v) => set("Qmd_ls", v === "" ? null : parseFloat(v))} unit="L/s" required tooltip="Caudal medio diario — obtenlo del modulo Calculo de gasto" />

            {/* Advanced */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-[#1C3D5A] underline decoration-dotted">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} parametros avanzados
            </button>
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
                {/* Horas de aportacion */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas de aportacion al tanque</label>
                  <select value={inputs.horasAportacion} onChange={(e) => set("horasAportacion", parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                    {REGULATION_COEFFICIENTS.map(c => (
                      <option key={c.hours} value={c.hours}>{c.label} (R = {c.R})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400">Menos horas de aportacion → mayor coeficiente de regulacion</p>
                </div>

                {/* Reserva */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={inputs.incluirReserva} onChange={(e) => set("incluirReserva", e.target.checked)} className="rounded border-gray-300" />
                    Incluir volumen de reserva
                  </label>
                  {inputs.incluirReserva && (
                    <InputField label="Horas de reserva (Qmd)" value={inputs.horasReserva} onChange={(v) => set("horasReserva", parseFloat(v) || 2)} unit="h" tooltip="Horas de Qmd almacenadas como reserva ante fallas (tipico 2-4 h)" />
                  )}
                </div>

                {/* Geometria */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma del tanque</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["rectangular", "circular"] as TankShape[]).map(s => (
                      <button
                        key={s}
                        onClick={() => set("shape", s)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          inputs.shape === s
                            ? "bg-[#1C3D5A] text-white border-[#1C3D5A]"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#1C3D5A]"
                        }`}
                      >
                        {s === "rectangular" ? "Rectangular" : "Circular"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Tirante de agua" value={inputs.altura} onChange={(v) => set("altura", parseFloat(v) || 3)} unit="m" tooltip="Profundidad util del agua (tipico 3-5 m)" />
                  <InputField label="Bordo libre" value={inputs.bordoLibre} onChange={(v) => set("bordoLibre", parseFloat(v) || 0.3)} unit="m" tooltip="Espacio libre sobre el nivel del agua (tipico 0.3 m)" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex justify-end">
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Tanque de Regularizacion",
                  module: "Tanque",
                  projectName: inputs.projectName,
                  hasAssumedValues: false,
                  inputs: [
                    { label: "Qmd", value: `${inputs.Qmd_ls} L/s` },
                    { label: "Aportacion", value: `${inputs.horasAportacion} h (R = ${results.R})` },
                    { label: "Reserva", value: inputs.incluirReserva ? `${inputs.horasReserva} h` : "No" },
                    { label: "Forma", value: inputs.shape },
                    { label: "Tirante", value: `${inputs.altura} m` },
                  ],
                  results: [
                    { label: "Vol diario", value: formatNumber(results.volDiario_m3, 1), unit: "m3" },
                    { label: "Vol regulacion", value: formatNumber(results.volRegulacion_m3, 1), unit: "m3" },
                    { label: "Vol reserva", value: formatNumber(results.volReserva_m3, 1), unit: "m3" },
                    { label: "Vol total", value: formatNumber(results.volTotal_m3, 1), unit: "m3" },
                    { label: "Vol comercial", value: `${results.volComercial_m3}`, unit: "m3" },
                    { label: "Altura total", value: formatNumber(results.alturaTotal_m, 2), unit: "m" },
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Volumen total */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Volumen total requerido</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">{formatNumber(results.volTotal_m3, 1)} <span className="text-sm font-normal">m3</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-green-600/70">Volumen comercial</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{results.volComercial_m3} <span className="text-sm font-normal">m3</span></p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <p className="text-xs text-gray-500 font-semibold">Desglose de volumenes</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400">Vol diario</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.volDiario_m3, 1)} <span className="text-xs font-normal">m3</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Vol regulacion (R={results.R})</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.volRegulacion_m3, 1)} <span className="text-xs font-normal">m3</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Vol reserva</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.volReserva_m3, 1)} <span className="text-xs font-normal">m3</span></p>
                  </div>
                </div>
                <FormulaDetail
                  title="Volumen de regulacion" value={formatNumber(results.volRegulacion_m3, 1)} unit="m3"
                  formula="Vr = R × Vol_diario"
                  steps={[
                    { label: `R = ${results.R} (para ${inputs.horasAportacion} h de aportacion)` },
                    { substitution: `Vr = ${results.R} × ${formatNumber(results.volDiario_m3, 1)}` },
                    { result: `Vr = ${formatNumber(results.volRegulacion_m3, 1)} m3` },
                  ]}
                  reference="Volumen de regulacion"
                  norm="CONAGUA MAPAS"
                />
              </div>

              {/* Dimensiones */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <p className="text-xs text-gray-500 font-semibold">Dimensiones sugeridas ({results.shape === "rectangular" ? "rectangular" : "circular"})</p>
                {results.shape === "rectangular" ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-[#1C3D5A] dark:text-blue-200">
                      {formatNumber(results.largo_m, 2)} m × {formatNumber(results.ancho_m, 2)} m × {formatNumber(inputs.altura, 2)} m
                    </p>
                    <p className="text-xs text-gray-500">Opcion cuadrada: {formatNumber(results.lado_m, 2)} m × {formatNumber(results.lado_m, 2)} m × {formatNumber(inputs.altura, 2)} m</p>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-[#1C3D5A] dark:text-blue-200">
                    diametro {formatNumber(results.diametro_m, 2)} m × {formatNumber(inputs.altura, 2)} m de tirante
                  </p>
                )}
                <div className="flex gap-4 text-xs text-gray-500 pt-1">
                  <span>Area = {formatNumber(results.area_m2, 1)} m2</span>
                  <span>Altura total = {formatNumber(results.alturaTotal_m, 2)} m (tirante + bordo libre)</span>
                </div>
              </div>

              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Reference */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-[11px] text-gray-500 leading-relaxed space-y-1">
                <p className="font-semibold">Referencias</p>
                <p>Volumen de regulacion: Vr = R × Vol_diario (CONAGUA MAPAS — Datos basicos)</p>
                <p>Coeficiente R segun horas de aportacion al tanque</p>
                <p>Volumen diario: Vol = Qmd × 86.4 (L/s a m3/dia)</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
