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
import { PIPE_ELASTICITY, THICKNESS_BY_MATERIAL, PIPE_CLASSES_BY_MATERIAL, PVC_THICKNESS, getPVCClasses, PVC_SYSTEM_LABELS, type PVCSystem, PIPE_CATALOG, type PipeCatalogGroup } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import type { AssumedValue } from "@/types/hydraulic";

export default function GolpeArietePage() {
  const { inputs, results, setInput, setResults } = useWaterHammerStore();
  const singlePipe = useSinglePipeStore();
  const [showThicknessRef, setShowThicknessRef] = useState(false);
  const [pvcSystem, setPvcSystem] = useState<PVCSystem>("métrico");
  const [entryMode, setEntryMode] = useState<"simple" | "advanced">("simple");

  // Simple mode state
  const [selectedCatalog, setSelectedCatalog] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<number>(0);

  const catalog = PIPE_CATALOG[selectedCatalog];
  const sizeEntry = catalog?.sizes[selectedSize];
  const classEntry = sizeEntry?.classes[selectedClass];

  // When simple mode selection changes, auto-fill D, e, E, materialName, pvcSystem
  useEffect(() => {
    if (entryMode !== "simple" || !catalog || !sizeEntry || !classEntry) return;
    const dInt = Math.round((sizeEntry.od - 2 * classEntry.e) * 10) / 10;
    if (dInt > 0) setInput("D", dInt);
    setInput("e", classEntry.e);
    setInput("E", catalog.E);
    setInput("materialName", catalog.material);
    // Auto-detect PVC system from catalog label
    if (catalog.material === "PVC") {
      if (catalog.label.includes("C905")) setPvcSystem("c905");
      else if (catalog.label.includes("C900")) setPvcSystem("c900");
      else if (catalog.label.includes("Métrico")) setPvcSystem("métrico");
      else if (catalog.label.includes("Ingles")) setPvcSystem("ingles");
    }
  }, [entryMode, selectedCatalog, selectedSize, selectedClass, catalog, sizeEntry, classEntry, setInput]);

  // Reset size/class when catalog changes
  useEffect(() => { setSelectedSize(0); setSelectedClass(0); }, [selectedCatalog]);
  useEffect(() => { setSelectedClass(0); }, [selectedSize]);

  // Computed OD and DR for display
  const computedOD = inputs.D != null && inputs.e != null ? inputs.D + 2 * inputs.e : null;
  const computedDR = computedOD != null && inputs.e != null && inputs.e > 0 ? computedOD / inputs.e : null;
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
    // Velocidad
    const v = singlePipe.results?.V;
    if (v != null) setInput("V0", v);
    // Diámetro
    const dn = singlePipe.inputs.DN;
    if (dn != null) setInput("D", dn);
    // Longitud
    const l = singlePipe.inputs.L;
    if (l != null) setInput("L", l);
    // Presión estática P1 → P0 (ya viene en kg/cm2 del input del usuario)
    const p1 = singlePipe.inputs.P1;
    if (p1 != null) setInput("P0", p1);
    // Material → buscar equivalente en PIPE_ELASTICITY
    const matName = singlePipe.inputs.materialName;
    if (matName) {
      // Map HW material names to elasticity material names
      const matMap: Record<string, string> = {
        "PVC — AWWA C900/C905": "PVC",
        "PVC — Métrico ISO 4422": "PVC",
        "PVC — Ingles ASTM D2241": "PVC",
        "HDPE — AWWA C906": "HDPE",
        "Hierro dúctil": "Hierro dúctil",
        // Legacy names for localStorage compatibility
        "Hierro dúctil — diseño": "Hierro dúctil",
        "Hierro dúctil — verificación": "Hierro dúctil",
        "Hierro dúctil (10+ años)": "Hierro dúctil",
        "Acero nuevo": "Acero",
        "Acero (10+ años)": "Acero",
        "Asbesto cemento": "Asbesto cemento",
        "Concreto centrifugado": "Concreto",
      };
      const elastName = matMap[matName];
      if (elastName) {
        const mat = PIPE_ELASTICITY.find((m) => m.name === elastName);
        if (mat) {
          setInput("materialName", mat.name);
          setInput("E", mat.E);
        }
      }
    }
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
              label="Velocidad V0"
              value={inputs.V0}
              onChange={(v) => handleNum("V0", v)}
              unit="m/s"
              required
              tooltip="Velocidad del agua antes del cierre de válvula. Puedes obtenerla del Módulo 1 o calcularla como Q/A"
            />

            {/* Entry mode toggle */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEntryMode("simple")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${entryMode === "simple" ? "bg-[#1C3D5A] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                Seleccionar tuberia
              </button>
              <button type="button" onClick={() => setEntryMode("advanced")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${entryMode === "advanced" ? "bg-[#1C3D5A] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                Ingreso manual
              </button>
            </div>

            {entryMode === "simple" ? (
              <>
                {/* 1. Tipo de tubería */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de tuberia</label>
                  <select value={selectedCatalog} onChange={(e) => setSelectedCatalog(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                    {PIPE_CATALOG.map((g, i) => <option key={i} value={i}>{g.label}</option>)}
                  </select>
                </div>

                {/* 2. Diámetro */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Diámetro</label>
                  <select value={selectedSize} onChange={(e) => setSelectedSize(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                    {catalog?.sizes.map((s, i) => <option key={i} value={i}>{s.label} (OD {s.od} mm)</option>)}
                  </select>
                </div>

                {/* 3. Clase */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Clase / DR</label>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                    {sizeEntry?.classes.map((c, i) => <option key={i} value={i}>{c.name} (e={c.e} mm)</option>)}
                  </select>
                </div>

                {/* Auto-filled summary */}
                {sizeEntry && classEntry && (
                  <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-lg px-3 py-2.5 text-xs space-y-1">
                    <p className="font-medium text-[#1C3D5A] dark:text-blue-300 mb-1">Datos de la tubería (auto)</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-600 dark:text-gray-400">
                      <span>OD: <strong>{sizeEntry.od} mm</strong></span>
                      <span>e: <strong>{classEntry.e} mm</strong></span>
                      <span>D int: <strong>{(sizeEntry.od - 2 * classEntry.e).toFixed(1)} mm</strong></span>
                      <span>DR: <strong>{(sizeEntry.od / classEntry.e).toFixed(1)}</strong></span>
                      <span>Material: <strong>{catalog.material}</strong></span>
                      <span>E: <strong>{(catalog.E / 1e9).toFixed(0)} GPa</strong></span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Advanced: manual entry */}
                <InputField label="D interno" value={inputs.D} onChange={(v) => handleNum("D", v)} unit="mm" required tooltip="Diámetro interior real de la tuberia" />
                <InputField label="Espesor de pared e" value={inputs.e} onChange={(v) => handleNum("e", v)} unit="mm" required tooltip="Grosor de la pared de la tuberia" />

                {/* OD/DR display */}
                {computedOD != null && computedDR != null && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
                    <span>OD = <strong className="text-gray-700 dark:text-gray-300">{computedOD.toFixed(1)} mm</strong></span>
                    <span>DR = <strong className="text-gray-700 dark:text-gray-300">{computedDR.toFixed(1)}</strong></span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material (Módulo E)</label>
                  <select value={inputs.materialName} onChange={(e) => handleMaterial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {PIPE_ELASTICITY.map((m) => (
                  <option key={m.name} value={m.name}>{m.name} ({(m.E / 1e9).toFixed(0)} GPa)</option>
                ))}
              </select>
              {inputs.materialName === "Personalizado" && (
                <InputField label="E (Pa)" value={inputs.E} onChange={(v) => setInput("E", parseFloat(v) || 0)} tooltip="Módulo de elasticidad del material en Pascales. Ej: Hierro dúctil = 169,000,000,000 Pa" />
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
              </>
            )}

            <InputField label="Presión estática P0" value={inputs.P0} onChange={(v) => handleNum("P0", v)} unit="kg/cm2" tooltip="Presión normal de operación antes del cierre de valvula" />
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
                {results.closureType === "brusco" ? <><span>{"\u26A0"}</span> Cierre Brusco</> : <><span>{"\u2713"}</span> Cierre Lento</>}
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
                  label="Clase recomendada"
                  value={results.pipeClass ?? "—"}
                  alertLevel={results.pipeClass?.startsWith("Excede") ? "ERROR" : results.pipeClass == null ? "WARN" : "OK"}
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
                const matClasses = inputs.materialName === "PVC"
                  ? getPVCClasses(pvcSystem, pvcSystem === "c905")
                  : PIPE_CLASSES_BY_MATERIAL[inputs.materialName];
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
                    {/* Explanation of the table */}
                    <div className="px-4 py-2 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                      <strong>Cumple:</strong> La clase resiste la presión maxima del golpe de ariete.
                      <strong className="ml-2">REC:</strong> Clase minima suficiente (mas economica).
                      {computedDR != null && <><br /><strong>Tu seleccion:</strong> DR {computedDR.toFixed(1)} (e={inputs.e} mm). Las clases con pared igual o mas delgada que tu tubo estan marcadas.</>}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          <th className="px-3 py-2 text-left">Clase</th>
                          <th className="px-3 py-2 text-right">PN (bar)</th>
                          <th className="px-3 py-2 text-center">Aguanta golpe</th>
                          <th className="px-3 py-2 text-right">Factor seg.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matClasses.classes.map((row) => {
                          const cumple = results.Pmax_bar != null && results.Pmax_bar <= row.pn;
                          const fs = results.Pmax_bar != null && results.Pmax_bar > 0 ? row.pn / results.Pmax_bar : 0;
                          const isRec = row.clase === results.pipeClass;

                          // Highlight the class that matches user's selection
                          let isUserClass = false;
                          if (computedDR != null && inputs.materialName !== "Hierro dúctil") {
                            const classDR = parseFloat(row.clase.replace(/[^0-9.]/g, ""));
                            if (!isNaN(classDR) && Math.abs(computedDR - classDR) < 1.5) isUserClass = true;
                          }

                          return (
                            <tr key={row.clase} className={`border-b border-gray-100 dark:border-gray-700 ${isUserClass ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-inset ring-[#1C3D5A]/30" : isRec ? "bg-green-50 dark:bg-green-900/20" : ""}`}>
                              <td className="px-3 py-2">
                                {row.clase}
                                {isRec && <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded">REC</span>}
                                {isUserClass && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">TU TUBO</span>}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{row.pn}</td>
                              <td className="px-3 py-2 text-center">
                                {cumple ? <span className="text-green-600">{"\u2713"}</span> : <span className="text-red-500">{"\u2717"}</span>}
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

              {/* Relief valve recommendation */}
              {results.deltaP_bar != null && results.deltaP_bar > 0 && inputs.D != null && inputs.V0 != null && (() => {
                // Calculate relief valve sizing
                const CV_TABLE = [
                  { dn: '2"',  dn_mm: 50,  cv_max: 15  },
                  { dn: '3"',  dn_mm: 75,  cv_max: 38  },
                  { dn: '4"',  dn_mm: 100, cv_max: 72  },
                  { dn: '6"',  dn_mm: 150, cv_max: 165 },
                  { dn: '8"',  dn_mm: 200, cv_max: 295 },
                  { dn: '10"', dn_mm: 250, cv_max: 460 },
                  { dn: '12"', dn_mm: 300, cv_max: 665 },
                ];

                const dInt_m = (inputs.D) / 1000;
                const A_linea = Math.PI * Math.pow(dInt_m / 2, 2);
                const Q_linea_m3h = inputs.V0 * A_linea * 3600;

                // P0 in kg/cm² (inputs.P0 is already in kg/cm²)
                const p0 = inputs.P0 ?? 0;
                const pMax_kgcm2 = results.Pmax != null ? mcaToKgcm2(results.Pmax) : 0;
                const pSet = p0 > 0 ? p0 * 1.10 : pMax_kgcm2 * 0.85;

                const deltaP_valv_bar = (pMax_kgcm2 - pSet) * 0.9807;
                const Cv_requerido = deltaP_valv_bar > 0
                  ? Q_linea_m3h / Math.sqrt(deltaP_valv_bar)
                  : 0;

                const valv_recomendada = CV_TABLE.find(v => v.cv_max * 0.75 >= Cv_requerido);
                const pct_apertura = valv_recomendada
                  ? Math.round((Cv_requerido / valv_recomendada.cv_max) * 100)
                  : null;
                const pct_dn = valv_recomendada
                  ? Math.round((valv_recomendada.dn_mm / (dInt_m * 1000)) * 100)
                  : null;

                if (Cv_requerido <= 0) return null;

                return (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {"\u26A0"} Proteccion recomendada — Valvula de alivio/anticipacion
                    </h3>

                    {valv_recomendada ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">DN valvula</div>
                            <div className="text-xl font-semibold text-amber-900 dark:text-amber-200">{valv_recomendada.dn}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">Cv requerido</div>
                            <div className="text-xl font-semibold text-amber-900 dark:text-amber-200">{formatNumber(Cv_requerido, 1)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">Apertura estimada</div>
                            <div className="text-xl font-semibold text-amber-900 dark:text-amber-200">{pct_apertura}%</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">Relacion DN</div>
                            <div className="text-xl font-semibold text-amber-900 dark:text-amber-200">{pct_dn}% de la linea</div>
                          </div>
                        </div>

                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Presion de ajuste sugerida (Pset): <strong>{formatNumber(pSet, 2)} kg/cm2</strong>
                          {" "}{"\u2014"} La valvula debe abrirse cuando P supere este valor
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        El caudal de alivio requerido (Cv={formatNumber(Cv_requerido, 1)}) excede los tamanos estandar de catalogo.
                        Consultar directamente con el fabricante.
                      </p>
                    )}

                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
                      Recomendacion preliminar basada en Joukowsky/Crane TP-410.
                      Verificar con el fabricante para instalacion final.
                      Valvula piloto-operada tipo alivio/anticipacion (surge relief).
                    </p>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
