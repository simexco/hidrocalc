"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSinglePipeStore } from "@/store/calculationStore";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ModeSelector } from "@/components/ui/ModeSelector";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { HydraulicProfileChart } from "@/components/hydraulic/HydraulicProfileChart";
import { DiameterComparisonTable } from "@/components/hydraulic/DiameterComparisonTable";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { AccesoriosSection, MaterialesSIMEXTable } from "@/components/ListaMaterialesSIMEX";
import { type AccesorioCalc, calcHmReal } from "@/hooks/useSIMEXKit";
import { calculateHazenWilliams, findMaxFlow, compareDiameters } from "@/lib/calculations/hazen-williams";
import { flowToM3s, m3sToFlow, formatNumber, mcaToKgcm2 } from "@/lib/calculations/conversions";
import { STANDARD_DNS, STANDARD_DNS_LABELED, MATERIALS, DEFAULTS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import type { CalcMode, FlowUnit, AssumedValue, Alert } from "@/types/hydraulic";

export default function TramoSimplePage() {
  const { inputs, results, setInput, setResults } = useSinglePipeStore();
  const [simexAccesorios, setSimexAccesorios] = useState<AccesorioCalc[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load persisted state
  useEffect(() => {
    const saved = loadFormState<typeof inputs>("tramo-simple");
    if (saved) {
      Object.entries(saved).forEach(([key, value]) => {
        setInput(key as keyof typeof inputs, value as never);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist with debounce
  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("tramo-simple", inputs), 1000);
  }, [inputs]);

  // Reactive calculation with debounce
  const runCalculation = useCallback(() => {
    const { mode, rawQ, flowUnit, DN, L, C, P1: P1_kgcm2, z1, z2, P2min: P2min_kgcm2, maxVelocity, fittings } = inputs;

    // Convert kg/cm² to m.c.a. for engine (1 kg/cm² = 10 m.c.a.)
    const P1 = P1_kgcm2 != null && isFinite(P1_kgcm2) ? P1_kgcm2 * 10 : null;
    const P2min = P2min_kgcm2 != null && isFinite(P2min_kgcm2) ? P2min_kgcm2 * 10 : null;

    // Collect assumed values
    const assumed: AssumedValue[] = [];
    if (z1 === 0) assumed.push({ field: "z1", value: 0, label: "Cota entrada: 0 m (terreno plano)" });
    if (z2 === 0) assumed.push({ field: "z2", value: 0, label: "Cota salida: 0 m (terreno plano)" });

    if (mode === "A") {
      if (rawQ == null || DN == null || L == null || rawQ <= 0 || L <= 0) {
        setResults(null);
        return;
      }
      const Q = flowToM3s(rawQ, flowUnit);
      const D = DN / 1000;
      const hasAccesorios = simexAccesorios.length > 0;

      // Calculate base result without fittings to get hf first
      const result = calculateHazenWilliams({
        Q, D, L, C, P1, z1, z2, useEstimatedHm: !hasAccesorios,
      });

      // If user added accessories, calculate real hm using Le/D method
      let hm = result.hm;
      let hmEstimated = result.hmEstimated;
      if (hasAccesorios) {
        hm = calcHmReal(simexAccesorios, L, D, result.hf);
        hmEstimated = false;
      }

      // Recalculate H2 and P2 with real hm
      let H1 = result.H1;
      let H2 = result.H2;
      let P2 = result.P2;
      let P2_kPa = result.P2_kPa;
      const velocityHead = result.V * result.V / (2 * 9.81);
      if (P1 != null) {
        H1 = z1 + P1 + velocityHead;
        H2 = H1 - result.hf - hm;
        P2 = H2 - z2 - velocityHead;
        P2_kPa = P2 * 9.81;
      }

      if (!hasAccesorios && hmEstimated) {
        assumed.push({ field: "hm", value: hm, label: `Accesorios asumidos: hm = 10% de hf (${formatNumber(hm, 3)} m)` });
      }

      setResults({
        A: result.A, V: result.V, hf: result.hf, hm,
        hmEstimated,
        H1, H2, P2, P2_kPa,
        J: result.J, J_km: result.J_km, Re: result.Re,
        alerts: result.alerts,
        dataStatus: P1 != null ? (assumed.length > 0 ? "estimated" : "calculated") : "estimated",
        Qmax: null, diameterComparison: null, recommendedDN: null,
      });
    } else if (mode === "B") {
      // Mode B: Find max flow
      if (DN == null || L == null || P1 == null || P2min == null || L <= 0) {
        setResults(null);
        return;
      }
      const D = DN / 1000;
      const res = findMaxFlow(D, L, C, P1, P2min, z1, z2, fittings.length > 0 ? fittings : undefined);
      if (!res) { setResults(null); return; }

      setResults({
        A: res.result.A, V: res.result.V, hf: res.result.hf, hm: res.result.hm,
        hmEstimated: res.result.hmEstimated,
        H1: res.result.H1, H2: res.result.H2, P2: res.result.P2, P2_kPa: res.result.P2_kPa,
        J: res.result.J, J_km: res.result.J_km, Re: res.result.Re,
        alerts: res.result.alerts,
        dataStatus: assumed.length > 0 ? "estimated" : "calculated",
        Qmax: res.Qmax, diameterComparison: null, recommendedDN: null,
      });
    } else if (mode === "C") {
      // Mode C: Recommend diameter
      if (rawQ == null || L == null || rawQ <= 0 || L <= 0) {
        setResults(null);
        return;
      }
      const Q = flowToM3s(rawQ, flowUnit);
      const { rows, recommendedDN } = compareDiameters(Q, L, C, P1, P2min ?? DEFAULTS.P2min, z1, z2, maxVelocity, STANDARD_DNS);

      // Get full result for recommended DN
      const recRow = rows.find((r) => r.recommended);
      let recH1: number | null = null;
      let recH2: number | null = null;
      if (recRow && P1 != null) {
        const recD = (recRow.dn) / 1000;
        const recV = recRow.V;
        const recVH = recV * recV / (2 * 9.81);
        recH1 = z1 + P1 + recVH;
        recH2 = recH1 - recRow.hf - recRow.hm;
      }
      setResults({
        A: null, V: recRow?.V ?? null, hf: recRow?.hf ?? null, hm: recRow?.hm ?? null,
        hmEstimated: true,
        H1: recH1, H2: recH2, P2: recRow?.P2 ?? null, P2_kPa: recRow?.P2 != null ? recRow.P2 * 9.81 : null,
        J: null, J_km: recRow?.J_km ?? null, Re: null,
        alerts: (() => {
          const a: { level: "OK" | "WARN" | "ERROR"; field: string; message: string }[] = [];
          if (recommendedDN && recRow) {
            a.push({ level: "OK", field: "DN", message: `DN recomendado: ${recommendedDN} mm — cumple V >= 0.3 m/s y P2 >= P2 mínima` });
            if (recRow.V < 0.5) a.push({ level: "WARN", field: "V_rec", message: `AVISO: El DN ${recommendedDN} tiene V=${recRow.V.toFixed(2)} m/s (< 0.5). Cumple el mínimo absoluto (0.3) pero está por debajo del óptimo NOM (0.5-2.5). Considerar aumentar el caudal o reducir el diámetro si la presión lo permite.` });
          } else {
            a.push({ level: "ERROR", field: "DN", message: "Ningún DN estándar cumple las restricciones" });
          }
          return a;
        })(),
        dataStatus: P1 != null ? "calculated" : "estimated",
        Qmax: null, diameterComparison: rows, recommendedDN,
      });
    }
  }, [inputs, simexAccesorios, setResults]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalculation, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalculation]);

  // Helpers
  const handleNumInput = (key: keyof typeof inputs, val: string) => {
    const num = val === "" ? null : parseFloat(val);
    setInput(key, num as never);
    if (key === "rawQ" && num != null) {
      setInput("Q", flowToM3s(num, inputs.flowUnit) as never);
    }
  };

  const handleMaterial = (name: string) => {
    const mat = MATERIALS.find((m) => m.name === name);
    setInput("materialName", name);
    if (mat && name !== "Personalizado") setInput("C", mat.c);
  };

  // Determine missing required fields
  const missingRequired: string[] = [];
  if (inputs.mode !== "B" && (inputs.rawQ == null || inputs.rawQ <= 0)) missingRequired.push("caudal (Q)");
  if (inputs.mode !== "C" && (inputs.DN == null)) missingRequired.push("diámetro (D)");
  if (inputs.L == null || inputs.L <= 0) missingRequired.push("longitud (L)");

  // Assumed values for display
  const assumed: AssumedValue[] = [];
  if (inputs.P1 == null) assumed.push({ field: "P1", value: 0, label: "Sin presión de entrada — resultados parciales" });

  // Profile chart data
  const profilePoints = results && results.H1 != null && results.H2 != null
    ? [
        { x: 0, terrain: inputs.z1, piezo: results.H1 },
        { x: inputs.L ?? 0, terrain: inputs.z2, piezo: results.H2 },
      ]
    : results && inputs.L
      ? [
          { x: 0, terrain: inputs.z1, piezo: null },
          { x: inputs.L, terrain: inputs.z2, piezo: null },
        ]
      : [];

  // Alert for a specific field
  const alertFor = (field: string) => results?.alerts.find((a) => a.field === field);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Mode Selector */}
      <ModeSelector mode={inputs.mode} onChange={(m) => setInput("mode", m)} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT: Form (40%) ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
              Datos de entrada
            </h2>

            <InputField
              label="Nombre del proyecto"
              value={inputs.projectName}
              onChange={(v) => setInput("projectName", v)}
              type="text"
              placeholder="Tramo sin nombre"
            />

            {/* Q — not shown in Mode B */}
            {inputs.mode !== "B" && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <InputField
                    label="Caudal Q"
                    value={inputs.rawQ}
                    onChange={(v) => handleNumInput("rawQ", v)}
                    tooltip="Volumen de agua por unidad de tiempo. Unidades: L/s (mas comun en Mexico), m3/h o m3/s. Rango típico: 2-500 L/s para lineas municipales. Campo obligatorio."
                    required
                    min={0}
                    step="0.1"
                  />
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
            )}

            {/* DN — not shown in Mode C */}
            {inputs.mode !== "C" && (
              <div>
                <InputField
                  label="Diámetro nominal DN"
                  value={inputs.DN}
                  onChange={(v) => handleNumInput("DN", v)}
                  unit="mm"
                  tooltip="Diámetro nominal comercial de la tubería en mm. NO es el diámetro interior real — varia segun material y clase. Rango: 2in (DN50) a 30in (DN800). Campo obligatorio."
                  required
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {STANDARD_DNS_LABELED.slice(0, 12).map((d) => (
                    <button
                      key={d.dn}
                      type="button"
                      onClick={() => setInput("DN", d.dn)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        inputs.DN === d.dn
                          ? "bg-[#1C3D5A] text-white border-[#1C3D5A]"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-[#1C3D5A]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <InputField
              label="Longitud L"
              value={inputs.L}
              onChange={(v) => handleNumInput("L", v)}
              unit="m"
              required
              min={0}
              step="1"
              tooltip="Distancia total del tramo en metros, medida a lo largo del eje de la tubería. Rango típico: 50-5,000 m por tramo. Campo obligatorio."
            />

            {/* Material / C */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material / Coef. C</label>
              <select
                value={inputs.materialName}
                onChange={(e) => handleMaterial(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              >
                {MATERIALS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} (C={m.c})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-1">
                Para mayor precisión en líneas existentes en buen estado usar C=140 con la opción Personalizado.
              </p>
              {inputs.materialName === "Personalizado" && (
                <InputField
                  label="C personalizado"
                  value={inputs.C}
                  onChange={(v) => setInput("C", parseFloat(v) || 130)}
                  tooltip="Coeficiente de rugosidad de Hazen-Williams"
                />
              )}
            </div>

            <InputField
              label="Presión entrada P₁"
              value={inputs.P1}
              onChange={(v) => handleNumInput("P1", v)}
              unit="kg/cm²"
              tooltip="Presión disponible al inicio del tramo en kg/cm2. 1 kg/cm2 = 10 m.c.a. = 98 kPa. Rango típico en redes: 1.5-7.0 kg/cm2. Si esta vacio: se calculan velocidad y pérdidas, pero NO presión de salida."
            />

            {/* Mode B: P2 min */}
            {(inputs.mode === "B" || inputs.mode === "C") && (
              <InputField
                label="P₂ mínima requerida"
                value={inputs.P2min}
                onChange={(v) => setInput("P2min", parseFloat(v) || DEFAULTS.P2min)}
                unit="kg/cm²"
                tooltip="Presión mínima requerida al final del tramo (CONAGUA: 10 kg/cm²)"
              />
            )}

            {inputs.mode === "C" && (
              <InputField
                label="Velocidad máxima"
                value={inputs.maxVelocity}
                onChange={(v) => setInput("maxVelocity", parseFloat(v) || DEFAULTS.maxVelocity)}
                unit="m/s"
                tooltip="Velocidad máxima permitida en la tubería. La norma mexicana recomienda entre 0.5 y 2.5 m/s para agua potable"
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Cota entrada z₁"
                value={inputs.z1}
                onChange={(v) => setInput("z1", parseFloat(v) || 0)}
                unit="m.s.n.m."
                tooltip="Elevación del punto respecto al nivel del mar"
                assumed={inputs.z1 === 0}
                assumedLabel="Valor por defecto: 0 m"
              />
              <InputField
                label="Cota salida z₂"
                value={inputs.z2}
                onChange={(v) => setInput("z2", parseFloat(v) || 0)}
                unit="m.s.n.m."
                tooltip="Elevación del punto respecto al nivel del mar"
                assumed={inputs.z2 === 0}
                assumedLabel="Valor por defecto: 0 m"
              />
            </div>
          </div>

          {/* Accessories section — Mode A */}
          {inputs.mode === "A" && inputs.DN && (
            <AccesoriosSection
              dnMm={inputs.DN}
              materialName={inputs.materialName}
              accesorios={simexAccesorios}
              onAddAccesorio={(acc) => setSimexAccesorios((prev) => [...prev, acc])}
              onRemoveAccesorio={(id) => setSimexAccesorios((prev) => prev.filter((a) => a.id !== id))}
            />
          )}
        </div>

        {/* ── RIGHT: Results (60%) ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Status + Export */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {missingRequired.length > 0 ? (
                <DataStatusBanner assumed={[]} missingRequired={missingRequired} />
              ) : (
                <DataStatusBanner assumed={assumed} />
              )}
            </div>
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: `Análisis de Tramo Simple — Modo ${inputs.mode}`,
                  module: "Tramo Simple",
                  projectName: inputs.projectName,
                  hasAssumedValues: results.hmEstimated || inputs.P1 == null,
                  inputs: [
                    { label: "Caudal Q", value: inputs.rawQ != null ? `${inputs.rawQ} ${inputs.flowUnit}` : "—" },
                    { label: "Diámetro DN", value: inputs.DN != null ? `${inputs.DN} mm` : "—" },
                    { label: "Longitud L", value: inputs.L != null ? `${inputs.L} m` : "—" },
                    { label: "Material", value: `${inputs.materialName} (C=${inputs.C})` },
                    { label: "Presión P₁", value: inputs.P1 != null ? `${inputs.P1} kg/cm²` : "No ingresada" },
                    { label: "Cota z₁", value: `${inputs.z1} m.s.n.m.` },
                    { label: "Cota z₂", value: `${inputs.z2} m.s.n.m.` },
                  ],
                  results: [
                    { label: "Velocidad V", value: formatNumber(results.V, 3), unit: "m/s" },
                    { label: "Pérdida fricción hf", value: formatNumber(results.hf, 3), unit: "m" },
                    { label: "Pérdida accesorios hm", value: formatNumber(results.hm, 3), unit: results.hmEstimated ? "m [EST]" : "m" },
                    { label: "Pérdida total hf+hm", value: formatNumber((results.hf ?? 0) + (results.hm ?? 0), 3), unit: "m" },
                    { label: "Gradiente J", value: formatNumber(results.J_km, 2), unit: "m/km" },
                    { label: "Carga H₁", value: results.H1 != null ? formatNumber(results.H1, 2) : "Requiere P₁", unit: "m" },
                    { label: "Carga H₂", value: results.H2 != null ? formatNumber(results.H2, 2) : "Requiere P₁", unit: "m" },
                    { label: "Presión salida P₂", value: results.P2 != null ? formatNumber(mcaToKgcm2(results.P2), 3) : "Requiere P₁", unit: "kg/cm²" },
                    { label: "P₂ (kPa)", value: results.P2_kPa != null ? formatNumber(results.P2_kPa, 1) : "—", unit: "kPa" },
                    ...(results.Qmax != null ? [{ label: "Caudal máximo", value: formatNumber(results.Qmax * 1000, 2), unit: "L/s" }] : []),
                  ],
                  alerts: results.alerts.map((a) => ({ level: a.level, message: a.message })),
                  tableData: results.diameterComparison ? {
                    head: ["DN (mm)", "V (m/s)", "hf (m)", "J (m/km)", "P₂ (kg/cm²)", "Estado"],
                    body: results.diameterComparison.map((r) => [
                      `${r.dn}${r.recommended ? " ★" : ""}`, r.V.toFixed(3), r.hf.toFixed(2), r.J_km.toFixed(2),
                      r.P2 != null ? mcaToKgcm2(r.P2).toFixed(2) : "—", r.recommended ? "RECOMENDADO" : r.meetsVelocity ? "OK" : "No cumple",
                    ]),
                  } : undefined,
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Mode B special: show max flow */}
              {inputs.mode === "B" && results.Qmax != null && (
                <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 border border-[#1C3D5A]/30 rounded-xl p-5 text-center">
                  <p className="text-xs text-[#1C3D5A] dark:text-blue-300 font-medium mb-1">Caudal máximo</p>
                  <p className="text-3xl font-bold text-[#1C3D5A] dark:text-white">
                    {m3sToFlow(results.Qmax, inputs.flowUnit).toFixed(2)}
                    <span className="text-lg font-normal ml-1">{inputs.flowUnit}</span>
                  </p>
                </div>
              )}

              {/* Mode C: Diameter comparison table */}
              {inputs.mode === "C" && results.diameterComparison && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {results.recommendedDN && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-300">
                      &#10003; DN recomendado: {results.recommendedDN} mm
                    </div>
                  )}
                  <DiameterComparisonTable
                    rows={results.diameterComparison}
                    showPressure={inputs.P1 != null}
                  />
                </div>
              )}

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard
                  label="Velocidad V"
                  value={formatNumber(results.V, 3)}
                  unit="m/s"
                  alertLevel={alertFor("V")?.level}
                  alertMessage={alertFor("V")?.message}
                  dataStatus={results.dataStatus}
                />
                <MetricCard
                  label="Pérdida fricción hf"
                  value={formatNumber(results.hf, 3)}
                  unit="m"
                  dataStatus={results.dataStatus}
                />
                <MetricCard
                  label="Pérdida accesorios hm"
                  value={formatNumber(results.hm, 3)}
                  unit="m"
                  dataStatus={results.hmEstimated ? "estimated" : results.dataStatus}
                />
                <MetricCard
                  label="Pérdida total hf+hm"
                  value={formatNumber((results.hf ?? 0) + (results.hm ?? 0), 3)}
                  unit="m"
                  dataStatus={results.dataStatus}
                />
                <MetricCard
                  label="Gradiente J"
                  value={formatNumber(results.J_km, 2)}
                  unit="m/km"
                  alertLevel={alertFor("J")?.level}
                  alertMessage={alertFor("J")?.message}
                  dataStatus={results.dataStatus}
                />
                <MetricCard
                  label="Carga H₁"
                  value={results.H1 != null ? formatNumber(results.H1, 2) : "—"}
                  unit="m"
                  unavailableMessage={results.H1 == null ? "Requiere P₁" : undefined}
                />
                <MetricCard
                  label="Carga H₂"
                  value={results.H2 != null ? formatNumber(results.H2, 2) : "—"}
                  unit="m"
                  unavailableMessage={results.H2 == null ? "Requiere P₁" : undefined}
                />
                <MetricCard
                  label="Presión salida P₂"
                  value={results.P2 != null ? formatNumber(mcaToKgcm2(results.P2), 3) : "—"}
                  unit="kg/cm²"
                  alertLevel={alertFor("P2")?.level}
                  alertMessage={alertFor("P2")?.message}
                  unavailableMessage={results.P2 == null ? "Requiere P₁" : undefined}
                />
                <MetricCard
                  label="P₂ (kPa)"
                  value={results.P2_kPa != null ? formatNumber(results.P2_kPa, 1) : "—"}
                  unit="kPa"
                  unavailableMessage={results.P2_kPa == null ? "Requiere P₁" : undefined}
                />
              </div>

              {/* Alerts — only those NOT already shown on metric cards */}
              {(() => {
                const shownOnCards = new Set(["V", "P2", "J"]);
                const extra = results.alerts.filter((a) => a.level !== "OK" && !shownOnCards.has(a.field));
                return extra.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alertas</h3>
                    {extra.map((a, i) => (
                      <AlertBanner key={i} level={a.level} message={a.message} />
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Hydraulic Profile Chart */}
              {profilePoints.length >= 2 && (
                <HydraulicProfileChart
                  points={profilePoints}
                  title="Perfil Hidráulico"
                />
              )}
              {/* SIMEX Materials Table */}
              {inputs.DN && simexAccesorios.length > 0 && (
                <MaterialesSIMEXTable
                  dnMm={inputs.DN}
                  materialName={inputs.materialName}
                  accesorios={simexAccesorios}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
