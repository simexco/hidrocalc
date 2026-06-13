"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { FormulaDetail } from "@/components/ui/FormulaDetail";
import { calculateWaterDemand, DEVELOPMENT_TYPES, CLIMATE_TYPES, DENSITY_CATEGORIES, type PopulationMode, type WaterDemandInputs } from "@/lib/calculations/water-demand";
import { formatNumber } from "@/lib/calculations/conversions";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";

const defaults: WaterDemandInputs = {
  projectName: "Demanda de agua",
  mode: 'viviendas',
  poblacionActual: null,
  numViviendas: null,
  habPorVivienda: 4,
  superficieHa: null,
  densidadHabHa: 55,
  proyectarCrecimiento: false,
  tasaCrecimiento: 2.0,
  periodoDiseno: 20,
  devType: 'interes-social',
  climaKey: 'templado',
  dotacionBase: 185,
  CVD: 1.4,
  CVH: 1.55,
  coefRegulacion: 11.0,
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
    // habPorVivienda siempre arranca en 4 y coefRegulacion en 11.0 (ignora valores viejos guardados)
    if (saved) setInputs({ ...defaults, ...saved, habPorVivienda: 4, coefRegulacion: 11.0 });
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
      // Solo actualiza la dotacion — el resto lo controla el usuario
      setInputs(prev => ({
        ...prev,
        devType: key,
        dotacionBase: dt.dotacion,
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
                <div>
                  <InputField label="Habitantes por vivienda" value={inputs.habPorVivienda} onChange={(v) => set("habPorVivienda", parseFloat(v) || 4)} tooltip="Valor mas usado en Mexico: 4 hab/viv. Puedes cambiarlo segun el censo INEGI de tu localidad." />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Referencia: rural ~4.5 · interes social ~4.0 · medio ~3.8 · residencial ~3.5 (INEGI). Mas usado: <strong className="text-gray-500">4</strong>
                  </p>
                </div>
              </>
            )}
            {inputs.mode === 'superficie' && (
              <>
                <InputField label="Superficie" value={inputs.superficieHa} onChange={(v) => set("superficieHa", v === "" ? null : parseFloat(v))} unit="hectareas" required tooltip="Area total del desarrollo en hectareas" />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria de densidad</label>
                  <select
                    value={DENSITY_CATEGORIES.find(d => d.vivHa === inputs.densidadHabHa)?.key ?? 'custom'}
                    onChange={(e) => { const c = DENSITY_CATEGORIES.find(d => d.key === e.target.value); if (c && c.key !== 'custom') set("densidadHabHa", c.vivHa); }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  >
                    {DENSITY_CATEGORIES.map(d => <option key={d.key} value={d.key}>{d.label}{d.key !== 'custom' ? ` (${d.vivHa} viv/ha)` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <InputField label="Densidad de vivienda" value={inputs.densidadHabHa} onChange={(v) => set("densidadHabHa", parseFloat(v) || 50)} unit="viv/ha" tooltip="Viviendas por hectarea. Tomalo del plan parcial de desarrollo urbano de tu zona." />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Referencia: minima ~15 · baja ~30 · media ~55 · alta ~90 viv/ha (reglamentos de zonificacion)
                  </p>
                </div>
                <div>
                  <InputField label="Habitantes por vivienda" value={inputs.habPorVivienda} onChange={(v) => set("habPorVivienda", parseFloat(v) || 4)} tooltip="Valor mas usado en Mexico: 4 hab/viv. Puedes cambiarlo segun el censo INEGI de tu localidad." />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Referencia: rural ~4.5 · interes social ~4.0 · medio ~3.8 · residencial ~3.5 (INEGI). Mas usado: <strong className="text-gray-500">4</strong>
                  </p>
                </div>
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

            {/* Advanced */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-[#1C3D5A] underline decoration-dotted">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} parametros avanzados
            </button>
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
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

                {/* Growth projection — optional, off by default */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={inputs.proyectarCrecimiento} onChange={(e) => set("proyectarCrecimiento", e.target.checked)} className="rounded border-gray-300" />
                    Proyectar crecimiento a futuro
                  </label>
                  <p className="text-[10px] text-gray-400 -mt-1">Solo para localidades existentes que van a crecer. Para desarrollos nuevos (ya conoces el total de viviendas) dejalo apagado.</p>
                  {inputs.proyectarCrecimiento && (
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Tasa crecimiento" value={inputs.tasaCrecimiento} onChange={(v) => set("tasaCrecimiento", parseFloat(v) || 2)} unit="% anual" tooltip="Tasa de crecimiento poblacional. Promedio nacional INEGI: 1-2%." />
                      <InputField label="Periodo de diseno" value={inputs.periodoDiseno} onChange={(v) => set("periodoDiseno", parseFloat(v) || 20)} unit="años" tooltip="CONAGUA recomienda 20-25 años" />
                    </div>
                  )}
                </div>

                {/* Coeficientes de variacion */}
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="CVD (variacion diaria)" value={inputs.CVD} onChange={(v) => set("CVD", parseFloat(v) || 1.4)} tooltip="Coeficiente de variacion diaria. CONAGUA: 1.2-1.5, default 1.4" />
                  <InputField label="CVH (variacion horaria)" value={inputs.CVH} onChange={(v) => set("CVH", parseFloat(v) || 1.55)} tooltip="Coeficiente de variacion horaria. CONAGUA: 1.5-2.0, default 1.55" />
                </div>
                {/* Coeficiente del tanque de regulacion */}
                <InputField label="Coef. regulacion del tanque" value={inputs.coefRegulacion} onChange={(v) => set("coefRegulacion", parseFloat(v) || 11)} unit="%" tooltip="Coeficiente de regulacion CONAGUA segun horas de suministro al tanque. 24h=11.0, 20h=9.0, 16h=19.0 (CDMX: 24h=14.3). Se aplica sobre el gasto maximo diario." />
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
                    { label: "Modo", value: inputs.mode === 'habitantes' ? `${results.poblacionActual} hab` : inputs.mode === 'viviendas' ? `${inputs.numViviendas} viviendas × ${inputs.habPorVivienda} hab/viv` : `${inputs.superficieHa} ha × ${inputs.densidadHabHa} viv/ha × ${inputs.habPorVivienda} hab/viv` },
                    { label: "Tipo desarrollo", value: devType?.label ?? inputs.devType },
                    { label: "Clima", value: CLIMATE_TYPES.find(c => c.key === inputs.climaKey)?.label ?? inputs.climaKey },
                    { label: "Dotacion", value: `${inputs.dotacionBase} L/hab/dia (ajustada: ${results.dotacionAjustada.toFixed(0)})` },
                    { label: "Crecimiento", value: inputs.proyectarCrecimiento ? `${inputs.tasaCrecimiento}% × ${inputs.periodoDiseno} años` : "Sin proyeccion" },
                    { label: "CVD / CVH", value: `${inputs.CVD} / ${inputs.CVH}` },
                  ],
                  results: [
                    { label: "Poblacion actual", value: `${results.poblacionActual}`, unit: "hab" },
                    { label: "Poblacion diseno", value: `${results.poblacionDiseno}`, unit: "hab" },
                    { label: "Qmd", value: formatNumber(results.Qmd_ls, 2), unit: "L/s" },
                    { label: "QMD (conduccion)", value: formatNumber(results.QMD_ls, 2), unit: "L/s" },
                    { label: "QMH (distribucion)", value: formatNumber(results.QMH_ls, 2), unit: "L/s" },
                    { label: "Volumen diario", value: formatNumber(results.volDiario_m3, 0), unit: "m3/dia" },
                    { label: "Tanque de regulacion", value: formatNumber(results.volTanque_m3, 0), unit: "m3" },
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
                    formula="QMH = QMD × CVH"
                    steps={[
                      { label: "Sobre el maximo diario:", substitution: `QMH = ${formatNumber(results.QMD_ls, 2)} × ${inputs.CVH}` },
                      { result: `QMH = ${formatNumber(results.QMH_ls, 2)} L/s` },
                    ]}
                    reference="Caudal maximo horario"
                    norm="CONAGUA MAPAS: QMH = QMD × CVH, CVH = 1.5 a 2.0"
                  />
                </div>
              </div>

              {/* Volume */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Volumen diario" value={formatNumber(results.volDiario_m3, 0)} unit="m3/dia" dataStatus="calculated" />
                <MetricCard label="Tanque de regulacion" value={formatNumber(results.volTanque_m3, 0)} unit="m3" dataStatus="calculated" />
              </div>

              {/* Tanque de regulacion detalle */}
              <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-xl p-4">
                <p className="text-xs text-[#1C3D5A]/60 dark:text-blue-300/60">Volumen del tanque de regulacion</p>
                <p className="text-2xl font-bold text-[#1C3D5A] dark:text-blue-200">{formatNumber(results.volTanque_m3, 0)} <span className="text-sm font-normal">m3</span></p>
                <FormulaDetail
                  title="Tanque de regulacion"
                  value={formatNumber(results.volTanque_m3, 0)}
                  unit="m3"
                  formula="Vr = QMD × Coeficiente de regulacion"
                  steps={[
                    { substitution: `Vr = ${formatNumber(results.QMD_ls, 2)} L/s × ${inputs.coefRegulacion}` },
                    { result: `Vr = ${formatNumber(results.volTanque_m3, 0)} m3` },
                  ]}
                  reference="Volumen de regulacion"
                  norm="CONAGUA Tabla 1.3: 24h=11.0, 20h=9.0, 16h=19.0 (CDMX Tabla 1.4: 24h=14.3)"
                />
              </div>

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
