"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePipeSizingStore } from "@/store/calculationStore";
import { InputField } from "@/components/ui/InputField";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DiameterComparisonTable } from "@/components/hydraulic/DiameterComparisonTable";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { calculatePipeSizing } from "@/lib/calculations/diameter-sizing";
import { flowToM3s, mcaToKgcm2 } from "@/lib/calculations/conversions";
import { MATERIALS, DEFAULTS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import type { FlowUnit, AssumedValue } from "@/types/hydraulic";

export default function DimensionamientoPage() {
  const { inputs, results, setInput, setResults } = usePipeSizingStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const saved = loadFormState<typeof inputs>("dimensionamiento");
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setInput(key as keyof typeof inputs, value as never);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("dimensionamiento", inputs), 1000);
  }, [inputs]);

  const runCalc = useCallback(() => {
    if (inputs.rawQ == null || inputs.L == null || inputs.rawQ <= 0 || inputs.L <= 0) {
      setResults(null);
      return;
    }
    const Q = flowToM3s(inputs.rawQ, inputs.flowUnit);
    // Convert kg/cm² inputs to m.c.a. for engine
    const P1_mca = inputs.P1 != null ? inputs.P1 * 10 : null;
    const P2min_mca = inputs.P2min * 10;
    const res = calculatePipeSizing({ ...inputs, Q, P1: P1_mca, P2min: P2min_mca });
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

  const handleMaterial = (name: string) => {
    const mat = MATERIALS.find((m) => m.name === name);
    setInput("materialName", name);
    if (mat && name !== "Personalizado") setInput("C", mat.c);
  };

  const missing: string[] = [];
  if (!inputs.rawQ || inputs.rawQ <= 0) missing.push("caudal (Q)");
  if (!inputs.L || inputs.L <= 0) missing.push("longitud (L)");

  const assumed: AssumedValue[] = [];
  if (inputs.P1 == null) assumed.push({ field: "P1", value: 0, label: "Sin P₁ — tabla muestra solo velocidad y pérdidas" });

  const handleExportCSV = () => {
    if (!results) return;
    const headers = ["DN (mm)", "V (m/s)", "hf (m)", "J (m/km)", "P2 (kg/cm²)", "Vel OK", "Pres OK", "Recomendado"];
    const rows = results.rows.map((r) =>
      [r.dn, r.V.toFixed(3), r.hf.toFixed(2), r.J_km.toFixed(2), r.P2 != null ? mcaToKgcm2(r.P2).toFixed(2) : "—", r.meetsVelocity ? "Sí" : "No", r.meetsPressure === true ? "Sí" : r.meetsPressure === false ? "No" : "—", r.recommended ? "Sí" : "No"].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HidroCalc_Dimensionamiento_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
              Datos de entrada
            </h2>

            <InputField label="Nombre del proyecto" value={inputs.projectName} onChange={(v) => setInput("projectName", v)} type="text" />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField label="Caudal Q de diseño" value={inputs.rawQ} onChange={(v) => handleNum("rawQ", v)} required min={0} step="0.1" tooltip="Caudal que necesitas que pase por la tubería. Es el dato principal para seleccionar el diámetro correcto" />
              </div>
              <select
                value={inputs.flowUnit}
                onChange={(e) => setInput("flowUnit", e.target.value as FlowUnit)}
                className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="L/s">L/s</option>
                <option value="m³/h">m³/h</option>
                <option value="m³/s">m³/s</option>
              </select>
            </div>

            <InputField label="Longitud L" value={inputs.L} onChange={(v) => handleNum("L", v)} unit="m" required min={0} tooltip="Distancia total de la tubería que vas a instalar, en metros" />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material / C</label>
              <select
                value={inputs.materialName}
                onChange={(e) => handleMaterial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {MATERIALS.map((m) => (
                  <option key={m.name} value={m.name}>{m.name} (C={m.c})</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-1">
                Para mayor precisión en líneas existentes en buen estado usar C=140 con la opción Personalizado.
              </p>
            </div>

            <InputField label="Presión entrada P₁" value={inputs.P1} onChange={(v) => handleNum("P1", v)} unit="kg/cm²" tooltip="Presión disponible al inicio de la tubería. Si no la conoces, la tabla mostrará solo velocidad y pérdidas, pero no podrá verificar presión de salida" />
            <InputField label="P₂ mínima requerida" value={inputs.P2min} onChange={(v) => setInput("P2min", parseFloat(v) || DEFAULTS.P2min)} unit="kg/cm²" tooltip="Presión mínima que necesitas al final de la tubería. CONAGUA establece 10 kg/cm² como mínimo para agua potable" />
            <InputField label="Velocidad máxima" value={inputs.maxVelocity} onChange={(v) => setInput("maxVelocity", parseFloat(v) || DEFAULTS.maxVelocity)} unit="m/s" tooltip="Velocidad máxima permitida. La norma recomienda no exceder 2.5 m/s en agua potable para evitar desgaste y golpe de ariete" />

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Cota z₁" value={inputs.z1} onChange={(v) => setInput("z1", parseFloat(v) || 0)} unit="m.s.n.m." assumed={inputs.z1 === 0} assumedLabel="0 m" tooltip="Elevación del punto de inicio sobre el nivel del mar. Si no la conoces, déjala en 0 (terreno plano)" />
              <InputField label="Cota z₂" value={inputs.z2} onChange={(v) => setInput("z2", parseFloat(v) || 0)} unit="m.s.n.m." assumed={inputs.z2 === 0} assumedLabel="0 m" tooltip="Elevación del punto final sobre el nivel del mar. Si es más alto que z1, el agua sube (más pérdida de presión)" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
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
                  title: "Dimensionamiento de Tubería",
                  module: "Dimensionamiento",
                  projectName: inputs.projectName,
                  hasAssumedValues: inputs.P1 == null,
                  inputs: [
                    { label: "Caudal Q", value: inputs.rawQ != null ? `${inputs.rawQ} ${inputs.flowUnit}` : "—" },
                    { label: "Longitud L", value: inputs.L != null ? `${inputs.L} m` : "—" },
                    { label: "Material", value: `${inputs.materialName} (C=${inputs.C})` },
                    { label: "Presión P₁", value: inputs.P1 != null ? `${inputs.P1} kg/cm²` : "No ingresada" },
                    { label: "P₂ mínima", value: `${inputs.P2min} kg/cm²` },
                    { label: "Vel. máxima", value: `${inputs.maxVelocity} m/s` },
                  ],
                  results: [
                    { label: "DN recomendado", value: results.recommendedDN ? `${results.recommendedDN} mm` : "Ninguno cumple", unit: "" },
                  ],
                  alerts: results.alerts.map((a) => ({ level: a.level, message: a.message })),
                  tableData: {
                    head: ["DN (mm)", "V (m/s)", "hf (m)", "J (m/km)", "P₂ (kg/cm²)", "Estado"],
                    body: results.rows.map((r) => [
                      `${r.dn}${r.recommended ? " ★" : ""}`, r.V.toFixed(3), r.hf.toFixed(2), r.J_km.toFixed(2),
                      r.P2 != null ? mcaToKgcm2(r.P2).toFixed(2) : "—", r.recommended ? "RECOMENDADO" : r.meetsVelocity ? "OK" : "No cumple",
                    ]),
                  },
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}

              {/* Comparison Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comparativa de diámetros</h3>
                  <button
                    onClick={handleExportCSV}
                    className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors"
                  >
                    Exportar CSV
                  </button>
                </div>
                <DiameterComparisonTable rows={results.rows} showPressure={inputs.P1 != null} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
