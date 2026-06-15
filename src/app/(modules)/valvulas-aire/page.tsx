"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { validateHydraulicInputs, InputWarnings } from "@/components/ui/InputWarning";
import { calculateAirValves, type AirValveVertex, type AirValveInputs, type AirValveOutputs } from "@/lib/calculations/air-valves";
import { flowToM3s, formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS_LABELED, MATERIALS, getPipeClassesForMaterial } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { ResetButton } from "@/components/ui/ResetButton";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { NumInput } from "@/components/ui/NumInput";
import type { FlowUnit } from "@/types/hydraulic";

const DN_LIST = STANDARD_DNS_LABELED;

export default function ValvulasAirePage() {
  const [projectName, setProjectName] = useState("Línea de conducción");
  const [rawQ, setRawQ] = useState<number | null>(null);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("L/s");
  const [DN, setDN] = useState(150);
  const [materialName, setMaterialName] = useState(MATERIALS[0].name);
  const [C, setC] = useState(MATERIALS[0].c);
  const [pipeClass, setPipeClass] = useState("");
  const [PNBar, setPNBar] = useState<number | null>(null);
  const [P0, setP0] = useState<number | null>(3);
  const [pressureMin, setPressureMin] = useState(5);
  const [maxSpacing, setMaxSpacing] = useState(600);
  const [vertices, setVertices] = useState<AirValveVertex[]>([
    { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
    { id: uuid(), dist: 1000, cota: 110, desc: "Fin" },
  ]);
  const [results, setResults] = useState<AirValveOutputs | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Persist
  useEffect(() => {
    const saved = loadFormState<{ projectName: string; rawQ: number | null; flowUnit: FlowUnit; DN: number; C: number; P0: number | null; pressureMin: number; maxSpacing: number; vertices: AirValveVertex[]; materialName?: string; pipeClass?: string; PNBar?: number | null }>("valvulas-aire");
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (saved.rawQ != null) setRawQ(saved.rawQ);
      if (saved.flowUnit) setFlowUnit(saved.flowUnit);
      if (saved.DN) setDN(saved.DN);
      if (saved.C) setC(saved.C);
      if (saved.P0 != null) setP0(saved.P0);
      if (saved.pressureMin) setPressureMin(saved.pressureMin);
      if (saved.maxSpacing) setMaxSpacing(saved.maxSpacing);
      if (saved.vertices?.length >= 2) setVertices(saved.vertices);
      if (saved.materialName) setMaterialName(saved.materialName);
      if (saved.pipeClass) setPipeClass(saved.pipeClass);
      if (saved.PNBar != null) setPNBar(saved.PNBar);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("valvulas-aire", { projectName, rawQ, flowUnit, DN, C, P0, pressureMin, maxSpacing, vertices, materialName, pipeClass, PNBar }), 1000);
    return () => clearTimeout(t);
  }, [projectName, rawQ, flowUnit, DN, C, P0, pressureMin, maxSpacing, vertices, materialName, pipeClass, PNBar]);

  // Calculate
  const runCalc = useCallback(() => {
    const Q = rawQ != null ? flowToM3s(rawQ, flowUnit) : null;
    const input: AirValveInputs = { projectName, Q, DN_mm: DN, C, P0_kgcm2: P0, pressureMin, maxSpacing, vertices };
    const res = calculateAirValves(input);
    setResults(res);
  }, [projectName, rawQ, flowUnit, DN, C, P0, pressureMin, maxSpacing, vertices]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const addVertex = () => {
    const lastDist = vertices.length > 0 ? vertices[vertices.length - 1].dist + 500 : 0;
    const lastCota = vertices.length > 0 ? vertices[vertices.length - 1].cota : 100;
    setVertices([...vertices, { id: uuid(), dist: lastDist, cota: lastCota, desc: "" }]);
  };

  const removeVertex = (id: string) => {
    if (vertices.length <= 2) return;
    setVertices(vertices.filter((v) => v.id !== id));
  };

  const updateVertex = (id: string, updates: Partial<AirValveVertex>) => {
    setVertices(vertices.map((v) => v.id === id ? { ...v, ...updates } : v));
  };

  const handleReset = () => {
    setProjectName("Línea de conducción");
    setRawQ(null);
    setFlowUnit("L/s");
    setDN(150);
    setMaterialName(MATERIALS[0].name);
    setC(MATERIALS[0].c);
    setPipeClass("");
    setPNBar(null);
    setP0(3);
    setPressureMin(5);
    setMaxSpacing(600);
    setVertices([
      { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
      { id: uuid(), dist: 1000, cota: 110, desc: "Fin" },
    ]);
    setResults(null);
  };

  const handleMaterial = (name: string) => {
    const mat = MATERIALS.find((m) => m.name === name);
    setMaterialName(name);
    if (mat && name !== "Personalizado") setC(mat.c);
    setPipeClass("");
    setPNBar(null);
  };

  // Chart data — include valve points so they can be plotted
  const chartData = (() => {
    if (!results) return [];
    // Base profile points
    const points = results.profilePoints.map(p => ({
      dist: p.dist, cota: p.cota, presion: p.pressure,
      valveType: null as string | null,
      valveReason: null as string | null,
    }));
    // Add valve points that are interpolated (not on a vertex)
    for (const v of results.valves) {
      const exists = points.find(p => Math.abs(p.dist - v.dist) < 1);
      if (exists) {
        exists.valveType = v.type;
        exists.valveReason = v.reason;
      } else {
        // Insert interpolated valve point
        points.push({
          dist: v.dist, cota: v.cota, presion: v.pressure,
          valveType: v.type, valveReason: v.reason,
        });
      }
    }
    return points.sort((a, b) => a.dist - b.dist);
  })();

  // Dominio Y relativo: se ajusta a la variacion real del terreno para que
  // los desniveles pequenos se vean claros (no escalado al valor absoluto de la cota).
  const yDomain = (() => {
    if (chartData.length < 2) return [0, 100] as [number, number];
    const cotas = chartData.map((d) => d.cota);
    const lo = Math.min(...cotas);
    const hi = Math.max(...cotas);
    const pad = Math.max((hi - lo) * 0.15, 2);
    return [Math.floor(lo - pad), Math.ceil(hi + pad)] as [number, number];
  })();

  const typeBadge = (type: string) => {
    if (type === "VA-C") return "bg-blue-100 text-blue-700";
    if (type === "VA-A") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  // Descripcion comercial completa Sigma Flow segun tipo de valvula
  const typeFullName = (type: string) => {
    if (type === "VA-C") return "Válvula de aire combinada";
    if (type === "VA-A") return "Válvula de aire de admisión y expulsión";
    return "Válvula eliminadora de aire";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Global data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos globales</h2>
              <ResetButton moduleKey="valvulas-aire" onReset={handleReset} />
            </div>
            <InputField label="Nombre del proyecto" value={projectName} onChange={setProjectName} type="text" />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField label="Caudal Q" value={rawQ} onChange={(v) => setRawQ(v === "" ? null : parseFloat(v))} tooltip="Volumen de agua por unidad de tiempo. Si no lo conoces, se calculará solo ubicación geométrica." />
              </div>
              <select value={flowUnit} onChange={(e) => setFlowUnit(e.target.value as FlowUnit)} className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                <option value="L/s">L/s</option>
                <option value="m³/h">m³/h</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Diámetro DN</label>
              <select value={DN} onChange={(e) => setDN(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                {DN_LIST.map((d) => <option key={d.dn} value={d.dn}>{d.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material / C</label>
              <select value={materialName} onChange={(e) => handleMaterial(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* Pipe class selector */}
            {(() => {
              const classes = getPipeClassesForMaterial(materialName);
              if (!classes) return null;
              return (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Clase de tuberia</label>
                  <select
                    value={pipeClass}
                    onChange={(e) => {
                      const sel = classes.classes.find(c => c.clase === e.target.value);
                      setPipeClass(sel?.clase ?? '');
                      setPNBar(sel?.pn ?? null);
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:text-white ${
                      !pipeClass ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">-- Seleccionar clase --</option>
                    {classes.classes.map(c => (
                      <option key={c.clase} value={c.clase}>{c.clase} — {(c.pn / 0.9807).toFixed(1)} kg/cm²</option>
                    ))}
                  </select>
                  {!pipeClass && <p className="text-[10px] text-yellow-600">Selecciona la clase para verificar resistencia</p>}
                </div>
              );
            })()}

            <InputWarnings warnings={validateHydraulicInputs({ Q_ls: rawQ, DN_mm: DN, P1_kgcm2: P0 })} />

            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-[#1C3D5A] underline decoration-dotted">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} parametros avanzados
            </button>
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
                <InputField label="Presión de operación P₀" value={P0} onChange={(v) => setP0(v === "" ? null : parseFloat(v))} unit="kg/cm²" tooltip="Presión al inicio de la línea. Si no la conoces, se calculará solo geometría." />
                <InputField label="Presión mínima normativa" value={pressureMin} onChange={(v) => setPressureMin(parseFloat(v) || 5)} unit="m.c.a." tooltip="NOM-001-CONAGUA: mínimo absoluto 5 m.c.a. (0.5 kg/cm²), recomendado 10 m.c.a." />
                <InputField label="Espaciado máximo VA-E" value={maxSpacing} onChange={(v) => setMaxSpacing(parseFloat(v) || 600)} unit="m" tooltip="Distancia máxima entre válvulas eliminadoras en tramos rectos. AWWA M51: 500-800 m." />
              </div>
            )}
          </div>

          {/* Profile table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Perfil topográfico</h2>
              <button onClick={addVertex} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">+ Vértice</button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Como capturar el perfil:</p>
              <p>Cada fila es un <strong>punto del terreno</strong>. Pon la distancia acumulada desde el inicio y la elevacion (cota) en ese punto.</p>
              <div className="font-mono text-[10px] bg-white dark:bg-gray-800 rounded px-2 py-1 mt-1 text-gray-600 dark:text-gray-400">
                Ej: Punto 1: 0m, cota 18m | Punto 2: 100m, cota 60m | Punto 3: 200m, cota 45m
              </div>
              <p className="text-[10px] opacity-70">Incluye todos los puntos altos, bajos y cambios de pendiente.</p>
            </div>
            <div className="grid grid-cols-[24px_1fr_1fr_1.5fr_24px] gap-2 text-[10px] text-gray-400 font-semibold uppercase px-1">
              <span>#</span><span>Dist. (m)</span><span>Cota (m)</span><span>Descripcion</span><span></span>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {vertices.map((v, i) => (
                <div key={v.id} className="grid grid-cols-[24px_1fr_1fr_1.5fr_24px] gap-2 items-center px-1">
                  <span className="text-[10px] text-gray-400 text-center">{i + 1}</span>
                  <NumInput value={v.dist} onChange={(n) => updateVertex(v.id, { dist: n })} placeholder="Dist" />
                  <NumInput value={v.cota} onChange={(n) => updateVertex(v.id, { cota: n })} placeholder="Cota" />
                  <input type="text" value={v.desc} onChange={(e) => updateVertex(v.id, { desc: e.target.value })} placeholder="Descripcion" className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
                  {vertices.length > 2 ? (
                    <button onClick={() => removeVertex(v.id)} className="text-red-400 hover:text-red-600 text-xs text-center">✗</button>
                  ) : <span />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">{vertices.length} vertices</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex justify-end">
            <ExportPDFButton
              disabled={!results || results.valves.length === 0}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Válvulas de Aire — " + projectName,
                  module: "Válvulas de Aire",
                  projectName,
                  hasAssumedValues: P0 == null || rawQ == null,
                  inputs: [
                    { label: "Caudal Q", value: rawQ != null ? `${rawQ} ${flowUnit}` : "No ingresado" },
                    { label: "DN", value: `${DN} mm` },
                    { label: "Material", value: `${materialName} (C=${C})` },
                    { label: "P0", value: P0 != null ? `${P0} kg/cm2` : "No ingresada" },
                    { label: "Presión mín.", value: `${pressureMin} m.c.a.` },
                    { label: "Espaciado VA-E", value: `${maxSpacing} m` },
                    { label: "Vértices", value: `${vertices.length}` },
                  ],
                  results: [
                    { label: "Total válvulas", value: `${results.valves.length}` },
                    { label: "VA-C", value: `${results.totalVAC}` },
                    { label: "VA-A", value: `${results.totalVAA}` },
                    { label: "VA-E", value: `${results.totalVAE}` },
                  ],
                  alerts: results.alerts.map((a) => ({ level: "WARN", message: a })),
                  tableData: {
                    head: ["Dist (m)", "Cota (m)", "P (m.c.a.)", "Tipo", "Cuerpo", "Orificio", "PN", "Razón"],
                    body: results.valves.map((v) => [
                      formatNumber(v.dist, 0), formatNumber(v.cota, 1), v.pressure != null ? formatNumber(v.pressure, 1) : "—",
                      v.type, v.bodySize, v.orificeSize, v.pn, v.reason,
                    ]),
                  },
                };
              }}
            />
          </div>

          {/* Pipe class pressure warning */}
          {pipeClass && PNBar && P0 != null && P0 > (PNBar / 0.9807) && (
            <AlertBanner level="ERROR" message={`La presion maxima (${P0.toFixed(1)} kg/cm²) excede la capacidad de ${pipeClass} (PN ${PNBar} bar = ${(PNBar / 0.9807).toFixed(1)} kg/cm²). Usar una clase superior.`} />
          )}

          {/* Alerts */}
          {results?.alerts.map((a, i) => (
            <AlertBanner key={i} level={a.includes("negativa") || a.includes("rediseño") ? "ERROR" : a.includes("Sin datos") ? "OK" : "WARN"} message={a} />
          ))}

          {/* Summary cards */}
          {results && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Total válvulas" value={`${results.valves.length}`} dataStatus="calculated" />
              <MetricCard label="VA-C (Combinada)" value={`${results.totalVAC}`} dataStatus="calculated" />
              <MetricCard label="VA-A (Admisión)" value={`${results.totalVAA}`} dataStatus="calculated" />
              <MetricCard label="VA-E (Eliminadora)" value={`${results.totalVAE}`} dataStatus="calculated" />
            </div>
          )}

          {/* Profile chart */}
          {chartData.length >= 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Perfil y ubicación de válvulas</h3>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dist" label={{ value: "Distancia (m)", position: "insideBottom", offset: -10, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={yDomain}
                    allowDataOverflow
                    label={{ value: "Elevación (m)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="cota" baseValue="dataMin" stroke="#1C3D5A" fill="#1C3D5A" fillOpacity={0.15} strokeWidth={2} name="Terreno"
                    dot={(props: Record<string, unknown>) => {
                      const { cx, cy, payload } = props as { cx: number; cy: number; payload: { valveType?: string | null; valveReason?: string | null } };
                      if (!payload?.valveType) return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={0} />;
                      const color = payload.valveType === "VA-C" ? "#3b82f6" : payload.valveType === "VA-A" ? "#f59e0b" : "#22c55e";
                      return (
                        <g key={`valve-${cx}-${cy}`}>
                          <circle cx={cx} cy={cy} r={8} fill={color} stroke="#fff" strokeWidth={2.5} />
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize={9} fontWeight="bold" fill={color}>
                            {payload.valveType === "VA-C" ? "C" : payload.valveType === "VA-A" ? "A" : "E"}
                          </text>
                        </g>
                      );
                    }}
                  />
                  {chartData.some((d) => d.presion != null) && (
                    <Line type="monotone" dataKey="presion" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Presion (m.c.a.)" />
                  )}
                  <ReferenceLine y={pressureMin} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `P min ${pressureMin}`, position: "right", style: { fontSize: 9 } }} />
                </ComposedChart>
              </ResponsiveContainer>
              {/* Valve legend */}
              <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> VA-C Combinada</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" /> VA-A Admisión</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-full" /> VA-E Eliminadora</span>
              </div>
            </div>
          )}

          {/* Valve table */}
          {results && results.valves.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-[#1C3D5A] px-4 py-2">
                <h3 className="text-xs font-semibold text-white">Válvulas recomendadas ({results.valves.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500">
                      <th className="px-2 py-2 text-left">N°</th>
                      <th className="px-2 py-2 text-right">Dist (m)</th>
                      <th className="px-2 py-2 text-right">Cota</th>
                      <th className="px-2 py-2 text-right">P (m.c.a.)</th>
                      <th className="px-2 py-2 text-center">Tipo</th>
                      <th className="px-2 py-2 text-center">Cuerpo</th>
                      <th className="px-2 py-2 text-center">Orificio</th>
                      <th className="px-2 py-2 text-center">PN</th>
                      <th className="px-2 py-2 text-left">Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.valves.map((v, i) => (
                      <tr key={i} className={`border-b border-gray-100 dark:border-gray-700 ${v.alert === "critical" ? "bg-red-50 dark:bg-red-900/10" : v.alert === "low" ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}>
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatNumber(v.dist, 0)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatNumber(v.cota, 1)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{v.pressure != null ? formatNumber(v.pressure, 1) : "—"}</td>
                        <td className="px-2 py-1.5 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadge(v.type)}`}>{v.type}</span></td>
                        <td className="px-2 py-1.5 text-center font-mono">{v.bodySize}</td>
                        <td className="px-2 py-1.5 text-center font-mono">{v.orificeSize}</td>
                        <td className="px-2 py-1.5 text-center">{v.pn}</td>
                        <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{v.reason}{v.note && <span className="text-[10px] text-gray-400 ml-1">({v.note})</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
                Tamaños en pulgadas ANSI/AWWA. Criterios: AWWA M51 / ISO 10802 / NMX-E-255-ONNCCE. Para selección definitiva consultar curvas del fabricante.
              </div>
            </div>
          )}
          {/* SIMEX Air Valve Products */}
          {results && results.valves.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Productos SIMEX recomendados</h3>
              {results.valves.filter((v, i, arr) => arr.findIndex((x) => x.type === v.type && x.bodySize === v.bodySize) === i).map((v, i) => (
                <div key={i} className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-medium">{typeFullName(v.type)} de {v.bodySize} Sigma Flow</span>
                  <span className="block text-[10px] text-blue-500 dark:text-blue-400/70 mt-0.5">
                    <span className="font-mono">{v.type === "VA-C" ? `VI-VAC-${v.bodySize.replace(/"/g, "")}` : v.type === "VA-A" ? `VI-VAE-${v.bodySize.replace(/"/g, "")}` : `VI-VEA-${v.bodySize.replace(/"/g, "")}`}</span>
                    {" — "}{v.type} — Conexión roscada NTP | HD A536
                  </span>
                </div>
              ))}
              <p className="text-[9px] text-blue-500 mt-2">Contacte a su distribuidor SIMEX autorizado para cotización. S.H.I. de México — simexco.com.mx</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
