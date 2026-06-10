"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { FormulaDetail } from "@/components/ui/FormulaDetail";
import { calculateWellYield, type WellYieldInputs } from "@/lib/calculations/well-yield";
import { formatNumber } from "@/lib/calculations/conversions";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";

const defaults: WellYieldInputs = {
  projectName: "Aforo de pozo",
  nivelEstatico: null,
  nivelDinamico: null,
  Qprueba_ls: null,
  profundidadPozo: null,
  factorSeguridad: 0.7,
  QMD_ls: null,
  horasBombeo: 16,
};

export default function FuentePage() {
  const [inputs, setInputs] = useState<WellYieldInputs>({ ...defaults });
  const [results, setResults] = useState<ReturnType<typeof calculateWellYield>>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = <K extends keyof WellYieldInputs>(key: K, value: WellYieldInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const saved = loadFormState<WellYieldInputs>("fuente");
    if (saved) setInputs({ ...defaults, ...saved });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("fuente", inputs), 1000);
    return () => clearTimeout(t);
  }, [inputs]);

  const runCalc = useCallback(() => {
    setResults(calculateWellYield(inputs));
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
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aforo de pozo</h2>
              <ResetButton moduleKey="fuente" onReset={handleReset} />
            </div>

            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => set("projectName", v)} type="text" />

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Nivel estatico" value={inputs.nivelEstatico} onChange={(v) => set("nivelEstatico", v === "" ? null : parseFloat(v))} unit="m" required tooltip="Profundidad al agua sin bombear, medida desde la superficie" />
              <InputField label="Nivel dinamico" value={inputs.nivelDinamico} onChange={(v) => set("nivelDinamico", v === "" ? null : parseFloat(v))} unit="m" required tooltip="Profundidad al agua bombeando al caudal de prueba" />
            </div>

            <InputField label="Caudal de prueba" value={inputs.Qprueba_ls} onChange={(v) => set("Qprueba_ls", v === "" ? null : parseFloat(v))} unit="L/s" required tooltip="Caudal constante con el que se realizo la prueba de bombeo" />

            <InputField label="Profundidad del pozo" value={inputs.profundidadPozo} onChange={(v) => set("profundidadPozo", v === "" ? null : parseFloat(v))} unit="m" tooltip="Profundidad total del pozo (opcional — para calcular el abatimiento maximo permisible)" />

            <InputField label="Factor de seguridad" value={inputs.factorSeguridad * 100} onChange={(v) => set("factorSeguridad", (parseFloat(v) || 70) / 100)} unit="%" tooltip="Fraccion del abatimiento maximo que se permite usar (tipico 70%)" />

            <InputField label="QMD requerido" value={inputs.QMD_ls} onChange={(v) => set("QMD_ls", v === "" ? null : parseFloat(v))} unit="L/s" tooltip="Gasto maximo diario requerido — para comparar con la demanda (opcional)" />

            <InputField label="Horas de bombeo" value={inputs.horasBombeo} onChange={(v) => set("horasBombeo", parseFloat(v) || 16)} unit="h/dia" tooltip="Horas de bombeo del pozo al dia (tipico 16-20 h)" />
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
                  title: "Fuente de Abastecimiento — Aforo de Pozo",
                  module: "Fuente",
                  projectName: inputs.projectName,
                  hasAssumedValues: false,
                  inputs: [
                    { label: "Nivel estatico", value: `${inputs.nivelEstatico} m` },
                    { label: "Nivel dinamico", value: `${inputs.nivelDinamico} m` },
                    { label: "Q prueba", value: `${inputs.Qprueba_ls} L/s` },
                    { label: "Profundidad", value: inputs.profundidadPozo != null ? `${inputs.profundidadPozo} m` : "N/D" },
                    { label: "Factor seg.", value: `${(inputs.factorSeguridad * 100).toFixed(0)} %` },
                  ],
                  results: [
                    { label: "Abatimiento", value: formatNumber(results.abatimiento, 2), unit: "m" },
                    { label: "Caudal especifico", value: formatNumber(results.caudalEspecifico, 3), unit: "L/s/m" },
                    { label: "Q explotacion", value: formatNumber(results.Qexplotacion_ls, 2), unit: "L/s" },
                    { label: "Q explotacion", value: formatNumber(results.Qexplotacion_m3h, 1), unit: "m3/h" },
                    { label: "Vol diario pozo", value: formatNumber(results.volDiarioPozo_m3, 1), unit: "m3" },
                    ...(results.numPozos != null ? [{ label: "Pozos requeridos", value: `${results.numPozos}`, unit: "" }] : []),
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Abatimiento (s)" value={formatNumber(results.abatimiento, 2)} unit="m" dataStatus="calculated" />
                <MetricCard label="Caudal especifico" value={formatNumber(results.caudalEspecifico, 3)} unit="L/s/m" alertLevel={results.caudalEspecifico < 0.5 ? "WARN" : "OK"} dataStatus="calculated" />
              </div>

              {/* Q explotacion */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                <p className="text-xs text-green-600 font-medium">Caudal de explotacion recomendado</p>
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">{formatNumber(results.Qexplotacion_ls, 2)} <span className="text-sm font-normal">L/s</span> <span className="text-sm text-green-600/60 ml-2">({formatNumber(results.Qexplotacion_m3h, 1)} m3/h)</span></p>
                <FormulaDetail
                  title="Q explotacion" value={formatNumber(results.Qexplotacion_ls, 2)} unit="L/s"
                  formula="Q_explotacion = Caudal_especifico × Abatimiento_permisible"
                  steps={[
                    { label: `Caudal especifico = ${formatNumber(results.caudalEspecifico, 3)} L/s/m` },
                    { label: `Abatimiento permisible = ${results.abatimientoPermisible != null ? formatNumber(results.abatimientoPermisible, 2) : "N/D"} m` },
                    { substitution: `Q = ${formatNumber(results.caudalEspecifico, 3)} × ${results.abatimientoPermisible != null ? formatNumber(results.abatimientoPermisible, 2) : "?"}` },
                    { result: `Q = ${formatNumber(results.Qexplotacion_ls, 2)} L/s` },
                  ]}
                  reference="Aforo de pozo"
                  norm="CONAGUA MAPAS"
                />
                <div className="flex gap-4 mt-2 text-xs text-green-700/70">
                  {results.abatimientoMaximo != null && <span>Abatimiento max = {formatNumber(results.abatimientoMaximo, 2)} m</span>}
                  {results.abatimientoPermisible != null && <span>Abatimiento permisible = {formatNumber(results.abatimientoPermisible, 2)} m</span>}
                </div>
              </div>

              {/* Comparacion con demanda */}
              {results.cubreDemanda != null && (
                <div className={`rounded-xl border p-4 ${results.cubreDemanda ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                  <p className={`text-sm font-bold ${results.cubreDemanda ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                    {results.cubreDemanda ? "El pozo cubre la demanda" : `Se requieren ${results.numPozos} pozos`}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                    {results.Qbombeo_requerido_ls != null && <span>Q bombeo requerido = {formatNumber(results.Qbombeo_requerido_ls, 2)} L/s</span>}
                    {results.numPozos != null && <span>Pozos = {results.numPozos}</span>}
                    <span>Vol diario del pozo = {formatNumber(results.volDiarioPozo_m3, 1)} m3</span>
                  </div>
                </div>
              )}

              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Reference */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-[11px] text-gray-500 leading-relaxed space-y-1">
                <p className="font-semibold">Referencias</p>
                <p>Abatimiento: s = Nivel dinamico - Nivel estatico</p>
                <p>Caudal especifico: Cs = Q_prueba / s (L/s por metro)</p>
                <p>Q explotacion = Cs × abatimiento permisible (CONAGUA MAPAS — Estudios de fuentes)</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
