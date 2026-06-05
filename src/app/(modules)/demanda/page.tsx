"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { FormulaDetail } from "@/components/ui/FormulaDetail";
import { calculateWaterDemand, DEVELOPMENT_TYPES, CLIMATE_TYPES, type PopulationMode, type WaterDemandInputs } from "@/lib/calculations/water-demand";
import { formatNumber } from "@/lib/calculations/conversions";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";

const defaults: WaterDemandInputs = {
  projectName: "Demanda de agua",
  mode: 'viviendas',
  poblacionActual: null,
  numViviendas: null,
  habPorVivienda: 3.8,
  superficieHa: null,
  densidadHabHa: 50,
  tasaCrecimiento: 2.0,
  periodoDiseno: 20,
  devType: 'interes-social',
  climaKey: 'templado',
  dotacionBase: 185,
  CVD: 1.4,
  CVH: 1.55,
};

export default function DemandaPage() {
  const [inputs, setInputs] = useState<WaterDemandInputs>({ ...defaults });
  const [results, setResults] = useState<ReturnType<typeof calculateWaterDemand>>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = <K extends keyof WaterDemandInputs>(key: K, value: WaterDemandInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  // Persist
  useEffect(() => {
    const saved = loadFormState<WaterDemandInputs>("demanda");
    if (saved) setInputs({ ...defaults, ...saved });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("demanda", inputs), 1000);
    return () => clearTimeout(t);
  }, [inputs]);

  // Calculate
  const runCalc = useCallback(() => {
    setResults(calculateWaterDemand(inputs));
  }, [inputs]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleReset = () => { setInputs({ ...defaults }); setResults(null); };

  // Auto-update dotacion when dev type changes
  const handleDevType = (key: string) => {
    const dt = DEVELOPMENT_TYPES.find(d => d.key === key);
    if (dt) {
      setInputs(prev => ({
        ...prev,
        devType: key,
        dotacionBase: dt.dotacion,
        habPorVivienda: dt.habViv,
        densidadHabHa: dt.densidad,
      }));
    }
  };

  const devType = DEVELOPMENT_TYPES.find(d => d.key === inputs.devType);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos del proyecto</h2>
              <ResetButton moduleKey="demanda" onReset={handleReset} />
            </div>

            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => set("projectName", v)} type="text" />

            {/* Population mode */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Como defines la poblacion?</label>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                {([['habitantes', 'Habitantes'], ['viviendas', 'Viviendas'], ['superficie', 'Superficie']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => set('mode', k)} className={`flex-1 text-xs py-2 px-2 transition-colors ${inputs.mode === k ? 'bg-[#1C3D5A] text-white font-semibold' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode inputs */}
            {inputs.mode === 'habitantes' && (
              <InputField label="Poblacion actual" value={inputs.poblacionActual} onChange={(v) => set("poblacionActual", v === "" ? null : parseFloat(v))} required tooltip="Numero de habitantes actuales de la localidad o desarrollo" />
            )}
            {inputs.mode === 'viviendas' && (
              <>
                <InputField label="Numero de viviendas" value={inputs.numViviendas} onChange={(v) => set("numViviendas", v === "" ? null : parseFloat(v))} required tooltip="Total de viviendas del desarrollo o fraccionamiento" />
                <InputField label="Habitantes por vivienda" value={inputs.habPorVivienda} onChange={(v) => set("habPorVivienda", parseFloat(v) || 3.8)} tooltip={`Promedio INEGI: 3.8 hab/viv. Sugerido para ${devType?.label}: ${devType?.habViv}`} />
              </>
            )}
            {inputs.mode === 'superficie' && (
              <>
                <InputField label="Superficie" value={inputs.superficieHa} onChange={(v) => set("superficieHa", v === "" ? null : parseFloat(v))} unit="hectareas" required tooltip="Area total del desarrollo en hectareas" />
                <InputField label="Densidad" value={inputs.densidadHabHa} onChange={(v) => set("densidadHabHa", parseFloat(v) || 50)} unit="hab/ha" tooltip={`Sugerido para ${devType?.label}: ${devType?.densidad} hab/ha`} />
              </>
            )}

            {/* Development type */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de desarrollo</label>
              <select value={inputs.devType} onChange={(e) => handleDevType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                {DEVELOPMENT_TYPES.map(d => (
                  <option key={d.key} value={d.key}>{d.label} ({d.dotacion} L/hab/dia)</option>
                ))}
              </select>
            </div>

            {/* Climate */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Clima de la zona</label>
              <select value={inputs.climaKey} onChange={(e) => set('climaKey', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                {CLIMATE_TYPES.map(c => (
                  <option key={c.key} value={c.key}>{c.label} ({c.factor === 1 ? 'base' : c.factor > 1 ? `+${((c.factor-1)*100).toFixed(0)}%` : `${((c.factor-1)*100).toFixed(0)}%`})</option>
                ))}
              </select>
            </div>

            {/* Dotacion — editable */}
            <InputField label="Dotacion" value={inputs.dotacionBase} onChange={(v) => set("dotacionBase", parseFloat(v) || 150)} unit="L/hab/dia" tooltip="Sugerida segun tipo de desarrollo. Puedes modificarla si tienes un dato especifico." />

            {/* Growth */}
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Tasa crecimiento" value={inputs.tasaCrecimiento} onChange={(v) => set("tasaCrecimiento", parseFloat(v) || 2)} unit="% anual" tooltip="Tasa de crecimiento poblacional. Promedio nacional INEGI: 1-2%. Si no la conoces, usa 2%." />
              <InputField label="Periodo de diseno" value={inputs.periodoDiseno} onChange={(v) => set("periodoDiseno", parseFloat(v) || 20)} unit="años" tooltip="CONAGUA recomienda 20-25 años para sistemas de agua potable" />
            </div>

            {/* Advanced */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-[#1C3D5A] underline decoration-dotted">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} coeficientes de variacion
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <InputField label="CVD (variacion diaria)" value={inputs.CVD} onChange={(v) => set("CVD", parseFloat(v) || 1.4)} tooltip="Coeficiente de variacion diaria. CONAGUA: 1.2-1.5, default 1.4" />
                <InputField label="CVH (variacion horaria)" value={inputs.CVH} onChange={(v) => set("CVH", parseFloat(v) || 1.55)} tooltip="Coeficiente de variacion horaria. CONAGUA: 1.5-2.0, default 1.55" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1" />
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Calculo de Demanda de Agua",
                  module: "Demanda",
                  projectName: inputs.projectName,
                  hasAssumedValues: false,
                  inputs: [
                    { label: "Modo", value: inputs.mode === 'habitantes' ? `${results.poblacionActual} hab` : inputs.mode === 'viviendas' ? `${inputs.numViviendas} viviendas × ${inputs.habPorVivienda} hab/viv` : `${inputs.superficieHa} ha × ${inputs.densidadHabHa} hab/ha` },
                    { label: "Tipo desarrollo", value: devType?.label ?? inputs.devType },
                    { label: "Clima", value: CLIMATE_TYPES.find(c => c.key === inputs.climaKey)?.label ?? inputs.climaKey },
                    { label: "Dotacion", value: `${inputs.dotacionBase} L/hab/dia (ajustada: ${results.dotacionAjustada.toFixed(0)})` },
                    { label: "Crecimiento", value: `${inputs.tasaCrecimiento}% × ${inputs.periodoDiseno} años` },
                    { label: "CVD / CVH", value: `${inputs.CVD} / ${inputs.CVH}` },
                  ],
                  results: [
                    { label: "Poblacion actual", value: `${results.poblacionActual}`, unit: "hab" },
                    { label: "Poblacion diseno", value: `${results.poblacionDiseno}`, unit: "hab" },
                    { label: "Qmd", value: formatNumber(results.Qmd_ls, 2), unit: "L/s" },
                    { label: "QMD (conduccion)", value: formatNumber(results.QMD_ls, 2), unit: "L/s" },
                    { label: "QMH (distribucion)", value: formatNumber(results.QMH_ls, 2), unit: "L/s" },
                    { label: "Volumen diario", value: formatNumber(results.volDiario_m3, 0), unit: "m3/dia" },
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Population */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Poblacion actual" value={`${results.poblacionActual}`} unit="hab" dataStatus="calculated" />
                <MetricCard label="Poblacion de diseno" value={`${results.poblacionDiseno}`} unit="hab" dataStatus="calculated" />
              </div>

              {/* Dotacion */}
              <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1C3D5A]/60 dark:text-blue-300/60">Dotacion ajustada por clima</p>
                  <p className="text-xl font-bold text-[#1C3D5A] dark:text-blue-200">{results.dotacionAjustada.toFixed(0)} <span className="text-sm font-normal">L/hab/dia</span></p>
                </div>
                <div className="text-right text-xs text-[#1C3D5A]/50 dark:text-blue-300/50">
                  <p>Base: {inputs.dotacionBase} L/hab/dia</p>
                  <p>Factor clima: x{results.factorClima.toFixed(2)}</p>
                </div>
              </div>

              {/* Main flows */}
              <div className="space-y-3">
                {/* Qmd */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Caudal medio diario (Qmd)</p>
                      <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{formatNumber(results.Qmd_ls, 2)} <span className="text-sm font-normal">L/s</span></p>
                    </div>
                    <span className="text-sm text-gray-400">{formatNumber(results.Qmd_m3h, 1)} m3/h</span>
                  </div>
                  <FormulaDetail
                    title="Qmd"
                    value={formatNumber(results.Qmd_ls, 2)}
                    unit="L/s"
                    formula="Qmd = (Poblacion × Dotacion) / 86,400"
                    steps={[
                      { substitution: `Qmd = (${results.poblacionDiseno} × ${results.dotacionAjustada.toFixed(0)}) / 86,400` },
                      { result: `Qmd = ${formatNumber(results.Qmd_ls, 2)} L/s` },
                    ]}
                    reference="Caudal medio diario"
                    norm="CONAGUA MAPAS — Datos basicos"
                  />
                </div>

                {/* QMD */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Caudal maximo diario — QMD</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatNumber(results.QMD_ls, 2)} <span className="text-sm font-normal">L/s</span></p>
                      <p className="text-[11px] text-green-600/80 mt-1">Usar para lineas de conduccion</p>
                    </div>
                    <span className="text-sm text-green-500">{formatNumber(results.QMD_m3h, 1)} m3/h</span>
                  </div>
                  <FormulaDetail
                    title="QMD"
                    value={formatNumber(results.QMD_ls, 2)}
                    unit="L/s"
                    formula="QMD = Qmd × CVD"
                    steps={[
                      { substitution: `QMD = ${formatNumber(results.Qmd_ls, 2)} × ${inputs.CVD}` },
                      { result: `QMD = ${formatNumber(results.QMD_ls, 2)} L/s` },
                    ]}
                    reference="Caudal maximo diario"
                    norm="CONAGUA MAPAS: CVD = 1.2 a 1.5"
                  />
                </div>

                {/* QMH */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Caudal maximo horario — QMH</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatNumber(results.QMH_ls, 2)} <span className="text-sm font-normal">L/s</span></p>
                      <p className="text-[11px] text-blue-600/80 mt-1">Usar para redes de distribucion</p>
                    </div>
                    <span className="text-sm text-blue-500">{formatNumber(results.QMH_m3h, 1)} m3/h</span>
                  </div>
                  <FormulaDetail
                    title="QMH"
                    value={formatNumber(results.QMH_ls, 2)}
                    unit="L/s"
                    formula="QMH = Qmd × CVH"
                    steps={[
                      { substitution: `QMH = ${formatNumber(results.Qmd_ls, 2)} × ${inputs.CVH}` },
                      { result: `QMH = ${formatNumber(results.QMH_ls, 2)} L/s` },
                    ]}
                    reference="Caudal maximo horario"
                    norm="CONAGUA MAPAS: CVH = 1.5 a 2.0"
                  />
                </div>
              </div>

              {/* Volume */}
              <MetricCard label="Volumen diario" value={formatNumber(results.volDiario_m3, 0)} unit="m3/dia" dataStatus="calculated" />

              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Reference note */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-[11px] text-gray-500 leading-relaxed space-y-1">
                <p className="font-semibold">Referencias normativas</p>
                <p>Dotaciones: CONAGUA — Manual de Agua Potable, Alcantarillado y Saneamiento (MAPAS)</p>
                <p>Coeficientes de variacion: CONAGUA — Lineamientos Tecnicos para Factibilidades</p>
                <p>Crecimiento poblacional: INEGI — Tasa de crecimiento intercensal</p>
                <p>Periodo de diseno: CONAGUA — 20 a 25 años para sistemas de agua potable</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
