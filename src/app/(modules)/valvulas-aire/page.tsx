"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { calculateAirValves, type AirValveVertex, type AirValveInputs, type AirValveOutputs } from "@/lib/calculations/air-valves";
import { flowToM3s, formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS_LABELED, MATERIALS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Dot } from "recharts";
import type { FlowUnit } from "@/types/hydraulic";

const DN_LIST = STANDARD_DNS_LABELED;

export default function ValvulasAirePage() {
  const [projectName, setProjectName] = useState("Línea de conducción");
  const [rawQ, setRawQ] = useState<number | null>(null);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("L/s");
  const [DN, setDN] = useState(150);
  const [materialName, setMaterialName] = useState(MATERIALS[0].name);
  const [C, setC] = useState(MATERIALS[0].c);
  const [P0, setP0] = useState<number | null>(3);
  const [pressureMin, setPressureMin] = useState(5);
  const [maxSpacing, setMaxSpacing] = useState(600);
  const [vertices, setVertices] = useState<AirValveVertex[]>([
    { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
    { id: uuid(), dist: 1000, cota: 110, desc: "Fin" },
  ]);
  const [results, setResults] = useState<AirValveOutputs | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Persist
  useEffect(() => {
    const saved = loadFormState<{ projectName: string; rawQ: number | null; flowUnit: FlowUnit; DN: number; C: number; P0: number | null; pressureMin: number; maxSpacing: number; vertices: AirValveVertex[] }>("valvulas-aire");
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
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("valvulas-aire", { projectName, rawQ, flowUnit, DN, C, P0, pressureMin, maxSpacing, vertices }), 1000);
    return () => clearTimeout(t);
  }, [projectName, rawQ, flowUnit, DN, C, P0, pressureMin, maxSpacing, vertices]);

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

  const handleMaterial = (name: string) => {
    const mat = MATERIALS.find((m) => m.name === name);
    setMaterialName(name);
    if (mat && name !== "Personalizado") setC(mat.c);
  };

  // Chart data
  const chartData = results?.profilePoints.map((p) => ({
    dist: p.dist,
    cota: p.cota,
    presion: p.pressure,
  })) || [];

  // Valve dots for chart
  const valveDots = results?.valves || [];

  const typeBadge = (type: string) => {
    if (type === "VA-C") return "bg-blue-100 text-blue-700";
    if (type === "VA-A") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Global data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">Datos globales</h2>
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
                {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name} (C={m.c})</option>)}
              </select>
            </div>
            <InputField label="Presión de operación P₀" value={P0} onChange={(v) => setP0(v === "" ? null : parseFloat(v))} unit="kg/cm²" tooltip="Presión al inicio de la línea. Si no la conoces, se calculará solo geometría." />
            <InputField label="Presión mínima normativa" value={pressureMin} onChange={(v) => setPressureMin(parseFloat(v) || 5)} unit="m.c.a." tooltip="NOM-001-CONAGUA: mínimo absoluto 5 m.c.a. (0.5 kg/cm²), recomendado 10 m.c.a." />
            <InputField label="Espaciado máximo VA-E" value={maxSpacing} onChange={(v) => setMaxSpacing(parseFloat(v) || 600)} unit="m" tooltip="Distancia máxima entre válvulas eliminadoras en tramos rectos. AWWA M51: 500-800 m." />
          </div>

          {/* Profile table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Perfil topográfico</h2>
              <button onClick={addVertex} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">+ Vértice</button>
            </div>
            <p className="text-[10px] text-gray-400">Ingresa cada punto donde cambia la pendiente, puntos altos, bajos y referencias importantes.</p>
            <div className="space-y-2">
              {vertices.map((v, i) => (
                <div key={v.id} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-gray-400 text-center">{i + 1}</span>
                  <input
                    type="number"
                    defaultValue={v.dist}
                    key={`dist-${v.id}-${v.dist}`}
                    onBlur={(e) => updateVertex(v.id, { dist: parseFloat(e.target.value) || 0 })}
                    onChange={(e) => updateVertex(v.id, { dist: parseFloat(e.target.value) || 0 })}
                    placeholder="Dist (m)"
                    className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white text-xs"
                  />
                  <input
                    type="number"
                    defaultValue={v.cota}
                    key={`cota-${v.id}-${v.cota}`}
                    onBlur={(e) => updateVertex(v.id, { cota: parseFloat(e.target.value) || 0 })}
                    onChange={(e) => updateVertex(v.id, { cota: parseFloat(e.target.value) || 0 })}
                    placeholder="Cota (m)"
                    className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white text-xs"
                  />
                  <input type="text" value={v.desc} onChange={(e) => updateVertex(v.id, { desc: e.target.value })} placeholder="Descripción" className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white text-xs" />
                  {vertices.length > 2 && (
                    <button onClick={() => removeVertex(v.id)} className="text-red-400 hover:text-red-600">{"\u2717"}</button>
                  )}
                </div>
              ))}
            </div>
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
                      `${v.dist}`, `${v.cota}`, v.pressure != null ? `${v.pressure}` : "—",
                      v.type, v.bodySize, v.orificeSize, v.pn, v.reason,
                    ]),
                  },
                };
              }}
            />
          </div>

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
                    domain={[
                      Math.floor(Math.min(...vertices.map((v) => v.cota)) * 0.99),
                      Math.ceil(Math.max(...vertices.map((v) => v.cota)) * 1.01),
                    ]}
                    label={{ value: "Elevación (m)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="cota" stroke="#1C3D5A" fill="#1C3D5A" fillOpacity={0.15} strokeWidth={2} name="Terreno" />
                  {chartData.some((d) => d.presion != null) && (
                    <Line type="monotone" dataKey="presion" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Presión (m.c.a.)" />
                  )}
                  <ReferenceLine y={pressureMin} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `P mín ${pressureMin}`, position: "right", style: { fontSize: 9 } }} />
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
                        <td className="px-2 py-1.5 text-right font-mono">{v.dist}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{v.cota}</td>
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
        </div>
      </div>
    </div>
  );
}
