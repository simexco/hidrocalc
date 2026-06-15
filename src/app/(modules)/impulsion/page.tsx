"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { FormulaDetail } from "@/components/ui/FormulaDetail";
import { calculatePumpLine, PUMPING_REGIMES, type PumpLineInputs } from "@/lib/calculations/pump-line";
import { formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS_LABELED, MATERIALS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";

const defaults: PumpLineInputs = {
  Qmd_ls: null,
  horasBombeo: 12,
  cotaBomba: 100,
  cotaTanque: 150,
  L: null,
  DN_mm: null,
  C: 150,
  materialName: "PVC C900",
  hmPercent: 10,
  eficienciaBomba: 0.70,
  eficienciaMotor: 0.90,
  tarifaCFE: 4.50,
};

export default function ImpulsionPage() {
  const [inputs, setInputs] = useState<PumpLineInputs>({ ...defaults });
  const [results, setResults] = useState<ReturnType<typeof calculatePumpLine>>(null);
  const [useEconomic, setUseEconomic] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = <K extends keyof PumpLineInputs>(key: K, value: PumpLineInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const saved = loadFormState<PumpLineInputs & { useEconomic?: boolean }>("impulsion");
    if (saved) {
      const { useEconomic: ue, ...rest } = saved;
      setInputs({ ...defaults, ...rest, tarifaCFE: rest.tarifaCFE && rest.tarifaCFE >= 3 ? rest.tarifaCFE : 4.50 });
      if (ue != null) setUseEconomic(ue);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("impulsion", { ...inputs, useEconomic }), 1000);
    return () => clearTimeout(t);
  }, [inputs, useEconomic]);

  const runCalc = useCallback(() => {
    const inp = { ...inputs };
    if (useEconomic) inp.DN_mm = null; // let calc pick economic DN
    setResults(calculatePumpLine(inp));
  }, [inputs, useEconomic]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleReset = () => { setInputs({ ...defaults }); setResults(null); setUseEconomic(true); };

  const handleMaterial = (name: string) => {
    const m = MATERIALS.find(m => m.name === name);
    if (m) set("C", m.c);
    set("materialName", name);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Calculo de diametro economico</h2>
              <ResetButton moduleKey="impulsion" onReset={handleReset} />
            </div>

            <InputField label="Nombre del proyecto" value={inputs.Qmd_ls === null ? "" : ""} onChange={() => {}} type="text" className="hidden" />

            <InputField label="Gasto medio diario Qmd" value={inputs.Qmd_ls} onChange={(v) => set("Qmd_ls", v === "" ? null : parseFloat(v))} unit="L/s" required tooltip="Caudal medio diario — obtenlo del modulo Calculo de gasto" />

            {/* Pumping regime */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Regimen de bombeo</label>
              <select value={inputs.horasBombeo} onChange={(e) => set("horasBombeo", parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                {PUMPING_REGIMES.map(r => (
                  <option key={r.hours} value={r.hours}>{r.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400">A menos horas → mas caudal de bombeo → tubo mas grande</p>
            </div>

            {/* Geometry */}
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Cota bomba" value={inputs.cotaBomba} onChange={(v) => set("cotaBomba", parseFloat(v) || 0)} unit="m.s.n.m." tooltip="Elevacion del eje de la bomba" />
              <InputField label="Cota tanque" value={inputs.cotaTanque} onChange={(v) => set("cotaTanque", parseFloat(v) || 0)} unit="m.s.n.m." tooltip="Nivel del agua en el tanque elevado" />
            </div>

            <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-lg px-3 py-2 text-xs text-[#1C3D5A]">
              Desnivel Hg = {(inputs.cotaTanque - inputs.cotaBomba).toFixed(1)} m
            </div>

            <InputField label="Longitud de tuberia" value={inputs.L} onChange={(v) => set("L", v === "" ? null : parseFloat(v))} unit="m" required tooltip="Longitud total de la linea de impulsion" />

            {/* Material */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
              <select value={inputs.materialName} onChange={(e) => handleMaterial(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                {MATERIALS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* DN selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={useEconomic} onChange={(e) => setUseEconomic(e.target.checked)} className="rounded border-gray-300" />
                Usar diametro economico (Bresse)
              </label>
              {!useEconomic && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN manual</label>
                  <select value={inputs.DN_mm ?? ""} onChange={(e) => set("DN_mm", parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                    {STANDARD_DNS_LABELED.map(d => <option key={d.dn} value={d.dn}>{d.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Advanced */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-[#1C3D5A] underline decoration-dotted">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} parametros avanzados
            </button>
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
                <InputField label="Perdidas menores" value={inputs.hmPercent} onChange={(v) => set("hmPercent", parseFloat(v) || 10)} unit="% de hf" tooltip="Estimacion de perdidas por accesorios como porcentaje de hf" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Eficiencia bomba" value={(inputs.eficienciaBomba * 100)} onChange={(v) => set("eficienciaBomba", (parseFloat(v) || 70) / 100)} unit="%" tooltip="Eficiencia de la bomba (tipico 60-80%)" />
                  <InputField label="Eficiencia motor" value={(inputs.eficienciaMotor * 100)} onChange={(v) => set("eficienciaMotor", (parseFloat(v) || 90) / 100)} unit="%" tooltip="Eficiencia del motor electrico (tipico 85-95%)" />
                </div>
                <InputField label="Tarifa CFE comercial" value={inputs.tarifaCFE} onChange={(v) => set("tarifaCFE", parseFloat(v) || 4.5)} unit="$/kWh" tooltip="Tarifa comercial CFE (PDBT) que pagan los organismos operadores. Ajustar al recibo real; varia por region y mes." />
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
                  title: "Linea de Impulsion — Bomba a Tanque",
                  module: "Impulsion",
                  projectName: "Linea de impulsion",
                  hasAssumedValues: false,
                  inputs: [
                    { label: "Qmd", value: `${inputs.Qmd_ls} L/s` },
                    { label: "Bombeo", value: `${inputs.horasBombeo} h/dia` },
                    { label: "Hg", value: `${results.Hg.toFixed(1)} m` },
                    { label: "L", value: `${inputs.L} m` },
                    { label: "Material", value: inputs.materialName },
                  ],
                  results: [
                    { label: "Q bombeo", value: formatNumber(results.Qbombeo_ls, 2), unit: "L/s" },
                    { label: "DN economico", value: `${results.DN_econ_mm}`, unit: "mm" },
                    { label: "DN usado", value: `${results.DN_used_mm}`, unit: "mm" },
                    { label: "CDT", value: formatNumber(results.CDT, 2), unit: "m" },
                    { label: "Potencia motor", value: formatNumber(results.Pm_HP, 1), unit: "HP" },
                    { label: "HP comercial", value: `${results.HP_comercial}`, unit: "HP" },
                    { label: "Costo mensual", value: `$${formatNumber(results.costo_mes, 0)}`, unit: "" },
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Flow regime */}
              <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-xl p-4">
                <p className="text-xs text-[#1C3D5A]/60 dark:text-blue-300/60">Caudal de bombeo ({inputs.horasBombeo}h/dia)</p>
                <p className="text-2xl font-bold text-[#1C3D5A] dark:text-blue-200">{formatNumber(results.Qbombeo_ls, 2)} <span className="text-sm font-normal">L/s</span> <span className="text-sm text-[#1C3D5A]/50 ml-2">({formatNumber(results.Qbombeo_m3h, 1)} m3/h)</span></p>
                <FormulaDetail
                  title="Q bombeo" value={formatNumber(results.Qbombeo_ls, 2)} unit="L/s"
                  formula="Q_bombeo = Qmd × (24 / horas_bombeo)"
                  steps={[
                    { substitution: `Q = ${inputs.Qmd_ls} × (24 / ${inputs.horasBombeo})` },
                    { result: `Q = ${formatNumber(results.Qbombeo_ls, 2)} L/s` },
                  ]}
                  reference="Regimen de bombeo"
                  norm="CONAGUA MAPAS"
                />
              </div>

              {/* Economic diameter */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Diametro economico (Bresse)</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{results.DN_econ_mm} <span className="text-sm font-normal">mm</span></p>
                    <p className="text-[10px] text-green-600/70">D = {results.K_bresse} × raiz({(results.Qbombeo_ls/1000).toFixed(4)}) = {(results.D_econ_m * 1000).toFixed(1)} mm → DN {results.DN_econ_mm}</p>
                  </div>
                  {results.DN_used_mm !== results.DN_econ_mm && (
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">DN seleccionado</p>
                      <p className="text-lg font-bold text-gray-700">{results.DN_used_mm} mm</p>
                    </div>
                  )}
                </div>
                <FormulaDetail
                  title="D economico" value={`${results.DN_econ_mm}`} unit="mm"
                  formula="D = K × √Q  (Bresse)"
                  steps={[
                    { label: `K = ${results.K_bresse} (para ${inputs.horasBombeo}h de bombeo)` },
                    { substitution: `D = ${results.K_bresse} × √(${(results.Qbombeo_ls/1000).toFixed(4)})` },
                    { result: `D = ${(results.D_econ_m * 1000).toFixed(1)} mm → DN estandar ${results.DN_econ_mm} mm` },
                  ]}
                  reference="Formula de Bresse — diametro economico"
                  norm="CONAGUA MAPAS / Sotelo Avila"
                />
              </div>

              {/* Hydraulics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Velocidad" value={formatNumber(results.V, 2)} unit="m/s" alertLevel={results.V > 2.0 ? "WARN" : results.V < 0.5 ? "WARN" : "OK"} dataStatus="calculated" />
                <MetricCard label="hf" value={formatNumber(results.hf, 2)} unit="m" dataStatus="calculated" />
                <MetricCard label="hm" value={formatNumber(results.hm, 2)} unit="m" dataStatus="calculated" />
                <MetricCard label="J" value={formatNumber(results.J_km, 2)} unit="m/km" alertLevel={results.J_km > 10 ? "WARN" : "OK"} dataStatus="calculated" />
              </div>

              {/* CDT */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-2">Carga Dinamica Total (CDT)</p>
                <p className="text-3xl font-bold text-[#1C3D5A] dark:text-blue-200">{formatNumber(results.CDT, 2)} <span className="text-sm font-normal">m</span> <span className="text-sm text-gray-400 ml-2">({formatNumber(results.CDT_kgcm2, 2)} kg/cm2)</span></p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Hg = {formatNumber(results.Hg, 1)} m</span>
                  <span>+ hf = {formatNumber(results.hf, 2)} m</span>
                  <span>+ hm = {formatNumber(results.hm, 2)} m</span>
                </div>
                <FormulaDetail
                  title="CDT" value={formatNumber(results.CDT, 2)} unit="m"
                  formula="CDT = Hg + hf + hm"
                  steps={[
                    { substitution: `CDT = ${formatNumber(results.Hg, 1)} + ${formatNumber(results.hf, 2)} + ${formatNumber(results.hm, 2)}` },
                    { result: `CDT = ${formatNumber(results.CDT, 2)} m = ${formatNumber(results.CDT_kgcm2, 2)} kg/cm2` },
                  ]}
                  reference="Carga Dinamica Total"
                  norm="CONAGUA MAPAS — Lineas de impulsion"
                />
              </div>

              {/* Power */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 space-y-3">
                <p className="text-xs text-amber-700 font-semibold">Potencia de la bomba</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-amber-600">Hidraulica</p>
                    <p className="text-lg font-bold text-amber-800">{formatNumber(results.Ph_kW, 2)} <span className="text-xs font-normal">kW</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-600">Al freno</p>
                    <p className="text-lg font-bold text-amber-800">{formatNumber(results.Pb_kW, 2)} <span className="text-xs font-normal">kW</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-600">Motor</p>
                    <p className="text-lg font-bold text-amber-800">{formatNumber(results.Pm_HP, 1)} <span className="text-xs font-normal">HP</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-600">HP comercial</p>
                    <p className="text-2xl font-bold text-amber-900">{results.HP_comercial} <span className="text-sm font-normal">HP</span></p>
                  </div>
                </div>
                <FormulaDetail
                  title="Potencia" value={formatNumber(results.Pm_HP, 1)} unit="HP"
                  formula="P_motor = (gamma × Q × CDT) / (1000 × eta_bomba × eta_motor)"
                  steps={[
                    { label: "Potencia hidraulica:", substitution: `Ph = (9810 × ${(results.Qbombeo_ls/1000).toFixed(4)} × ${formatNumber(results.CDT, 2)}) / 1000 = ${formatNumber(results.Ph_kW, 2)} kW` },
                    { label: "Al freno:", substitution: `Pb = ${formatNumber(results.Ph_kW, 2)} / ${inputs.eficienciaBomba} = ${formatNumber(results.Pb_kW, 2)} kW` },
                    { label: "Motor:", substitution: `Pm = ${formatNumber(results.Pb_kW, 2)} / ${inputs.eficienciaMotor} = ${formatNumber(results.Pm_kW, 2)} kW = ${formatNumber(results.Pm_HP, 1)} HP` },
                    { result: `HP comercial: ${results.HP_comercial} HP` },
                  ]}
                  reference="Potencia de bombeo"
                  norm="CONAGUA MAPAS / Crane TP-410"
                />
              </div>

              {/* Energy cost */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 font-semibold mb-3">Costo de energia</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400">kWh/dia</p>
                    <p className="text-sm font-bold text-gray-700">{formatNumber(results.kWh_dia, 1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">kWh/mes</p>
                    <p className="text-sm font-bold text-gray-700">{formatNumber(results.kWh_mes, 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Costo mensual</p>
                    <p className="text-lg font-bold text-[#1C3D5A]">${formatNumber(results.costo_mes, 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Costo anual</p>
                    <p className="text-lg font-bold text-[#1C3D5A]">${formatNumber(results.costo_anual, 0)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Tarifa CFE: ${inputs.tarifaCFE}/kWh × {formatNumber(results.Pm_kW, 1)} kW × {inputs.horasBombeo} h/dia × 30 dias</p>
              </div>

              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Reference */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-[11px] text-gray-500 leading-relaxed space-y-1">
                <p className="font-semibold">Referencias</p>
                <p>Diametro economico: Formula de Bresse (D = K × raiz Q)</p>
                <p>CDT: CONAGUA MAPAS — Lineas de impulsion</p>
                <p>Potencia: P = gamma × Q × CDT / (1000 × eta)</p>
                <p>Velocidad max en impulsion: 2.0 m/s (CONAGUA)</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
