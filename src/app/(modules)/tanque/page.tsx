"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InputField } from "@/components/ui/InputField";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { FormulaDetail } from "@/components/ui/FormulaDetail";
import { calculateTankStorage, REGULATION_COEFFICIENTS, MAPAS_TANQUES_URL, type TankStorageInputs, type TankShape } from "@/lib/calculations/tank-storage";
import { formatNumber } from "@/lib/calculations/conversions";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";

const defaults: TankStorageInputs = {
  projectName: "Tanque de regulacion",
  Qmd_ls: null,
  horasAportacion: 24,
  horaInicio: 0,
  rManual: null,
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
    if (saved) {
      // Migración de estados viejos con horario por catálogo (regimen):
      // CDMX pasa a R manual; los demás a su hora de inicio oficial
      const legado = saved.regimen ? REGULATION_COEFFICIENTS.find((c) => c.key === saved.regimen) : undefined;
      setInputs({
        ...defaults, ...saved,
        horaInicio: saved.horaInicio ?? legado?.inicio ?? 0,
        rManual: saved.rManual ?? (saved.regimen?.startsWith("cdmx") ? legado?.R ?? null : null),
      });
    }
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

            <InputField label="Gasto máximo diario (QMD)" value={inputs.Qmd_ls} onChange={(v) => set("Qmd_ls", v === "" ? null : parseFloat(v))} unit="L/s" required tooltip="Gasto MÁXIMO diario (QMD) — obtenlo del módulo Cálculo de gasto. El volumen de regulación de MAPAS se calcula sobre el máximo diario, no sobre el medio." />

            {/* Advanced */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-[#1C3D5A] underline decoration-dotted">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} parametros avanzados
            </button>
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
                {/* Horario de bombeo del pozo → R se CALCULA con el método oficial del manual */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Horario de bombeo del pozo al tanque</label>
                  <div className="grid grid-cols-2 gap-2">
                    <InputField label="Horas de bombeo al día" value={inputs.horasAportacion} onChange={(v) => set("horasAportacion", Math.min(24, Math.max(1, parseInt(v) || 24)))} unit="h" tooltip="Cuántas horas al día bombea el pozo que llena este tanque (1 a 24)" />
                    <InputField label="Hora en que arranca" value={inputs.horaInicio ?? 0} onChange={(v) => set("horaInicio", Math.min(23, Math.max(0, parseInt(v) || 0)))} unit="h (0-23)" tooltip="Hora del día en que inicia el bombeo. IMPORTA: bombear 20 h de las 4 a las 24 da R = 9.0, pero de las 0 a las 20 da R = 12.57 (mismo manual)" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {REGULATION_COEFFICIENTS.filter((c) => !c.key.startsWith("cdmx")).map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setInputs((prev) => ({ ...prev, horasAportacion: c.hours, horaInicio: c.inicio, rManual: null }))}
                        className="text-[10px] px-2 py-1 rounded-lg border border-[#1C3D5A]/25 text-[#1C3D5A] dark:text-blue-300 dark:border-blue-300/25 hover:bg-[#1C3D5A] hover:text-white transition-colors"
                      >{c.label} (R = {c.R})</button>
                    ))}
                  </div>
                  {results && !results.rEsManual && (
                    <p className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300 bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-lg px-2.5 py-1.5">
                      Coeficiente de regulación (R) calculado = {results.R} m³/(L/s) — {results.regimenLabel}
                    </p>
                  )}
                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={inputs.rManual != null}
                      onChange={(e) => set("rManual", e.target.checked ? (REGULATION_COEFFICIENTS.find((c) => c.key === "cdmx-24")?.R ?? 14.3) : null)}
                      className="rounded border-gray-300"
                    />
                    Capturar coeficiente de regulación (R) manual (p. ej. CDMX — Tabla 1.4: 14.3 / 9.6 / 17.3)
                  </label>
                  {inputs.rManual != null && (
                    <InputField label="Coeficiente de regulación (R) manual" value={inputs.rManual} onChange={(v) => set("rManual", parseFloat(v) || null)} unit="m³/(L/s)" tooltip="Coeficiente de otra curva local (CDMX u organismo). Anula el calculado con la curva nacional." />
                  )}
                  <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 border border-[#1C3D5A]/15 rounded-lg px-2.5 py-2 space-y-1">
                    <p className="text-[10px] text-[#1C3D5A] dark:text-blue-300 leading-relaxed">
                      R se calcula con el <strong>método oficial del manual MAPAS</strong> (curva de demanda horaria nacional de la Figura 1.1 + diferencias acumuladas, ec. 1.2).
                      Reproduce exacto la Tabla 1.3: 24 h → 11.0 · 20 h (4-24) → 9.0 · 16 h (5-21) → 19.0.
                      Para CDMX usa la casilla de R manual (su curva es distinta — Tabla 1.4).
                    </p>
                    <a href={MAPAS_TANQUES_URL} target="_blank" rel="noreferrer" className="inline-block text-[10px] font-semibold text-[#1C3D5A] dark:text-blue-300 underline">
                      Ver el manual MAPAS de tanques (PDF oficial de CONAGUA) →
                    </a>
                  </div>
                </div>

                {/* Reserva */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={inputs.incluirReserva} onChange={(e) => set("incluirReserva", e.target.checked)} className="rounded border-gray-300" />
                    Incluir volumen de reserva
                  </label>
                  {inputs.incluirReserva && (
                    <InputField label="Horas de reserva" value={inputs.horasReserva} onChange={(v) => set("horasReserva", parseFloat(v) || 2)} unit="h" tooltip="Horas de gasto máximo diario (QMD) almacenadas como reserva ante fallas (tipico 2-4 h)" />
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
                    { label: "Gasto máximo diario (QMD)", value: `${inputs.Qmd_ls} L/s` },
                    { label: "Suministro al tanque", value: `${results.regimenLabel} (R = ${results.R} ${results.rEsManual ? "capturado manual" : "calculado con el metodo MAPAS"})` },
                    { label: "Reserva", value: inputs.incluirReserva ? `${inputs.horasReserva} h` : "No" },
                    { label: "Forma", value: inputs.shape },
                    { label: "Tirante", value: `${inputs.altura} m` },
                  ],
                  results: [
                    { label: "Volumen diario", value: formatNumber(results.volDiario_m3, 1), unit: "m3" },
                    { label: "Volumen de regulación", value: formatNumber(results.volRegulacion_m3, 1), unit: "m3" },
                    { label: "Volumen de reserva", value: formatNumber(results.volReserva_m3, 1), unit: "m3" },
                    { label: "Volumen total", value: formatNumber(results.volTotal_m3, 1), unit: "m3" },
                    { label: "Volumen comercial", value: `${results.volComercial_m3}`, unit: "m3" },
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
                    <p className="text-[10px] text-gray-400">Volumen diario</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.volDiario_m3, 1)} <span className="text-xs font-normal">m3</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Volumen de regulación (R = {results.R} m3/(L/s))</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.volRegulacion_m3, 1)} <span className="text-xs font-normal">m3</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Volumen de reserva</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.volReserva_m3, 1)} <span className="text-xs font-normal">m3</span></p>
                  </div>
                </div>
                <FormulaDetail
                  title="Volumen de regulacion" value={formatNumber(results.volRegulacion_m3, 1)} unit="m3"
                  formula="C = R × QMd  ·  R = (máx excedente − máx faltante) × 3.6/100  (ecs. 1.2 y 1.3)"
                  steps={results.rEsManual ? [
                    { label: `R = ${results.R} m³/(L/s) — capturado manual (${results.regimenLabel})` },
                    { substitution: `C = ${results.R} × ${inputs.Qmd_ls} L/s` },
                    { result: `C = ${formatNumber(results.volRegulacion_m3, 1)} m3` },
                  ] : [
                    { label: `Bombeo ${results.regimenLabel}: suministro = ${results.suministroPct}% de QMd por hora activa` },
                    { label: `Diferencias acumuladas vs curva de demanda (Fig. 1.1): máx excedente ${results.maxExcedente}%, máx faltante ${results.maxFaltante}%` },
                    { substitution: `R = (${results.maxExcedente} − (${results.maxFaltante})) × 3.6 / 100 = ${results.R} m³/(L/s)` },
                    { substitution: `C = ${results.R} × ${inputs.Qmd_ls} L/s` },
                    { result: `C = ${formatNumber(results.volRegulacion_m3, 1)} m3` },
                  ]}
                  reference="Metodo de la Tabla 1.1 (curva de demanda nacional)"
                  norm="CONAGUA MAPAS — Tanques de regulacion"
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
                <p>Volumen de regulacion: C = R × QMd (ec. 1.3) — Tablas 1.3 y 1.4 del manual MAPAS de tanques</p>
                <p>R oficial: 24 h = 11.0 · 20 h (4-24) = 9.0 · 16 h (5-21) = 19.0 · CDMX: 14.3 / 9.6 / 17.3</p>
                <p>Volumen diario de referencia: Vol = QMd × 86.4 (L/s a m3/dia)</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
