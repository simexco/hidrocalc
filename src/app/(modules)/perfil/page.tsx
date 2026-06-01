"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { calculateProfile, type ProfileVertex, type ProfileResults } from "@/lib/calculations/hydraulic-profile";
import { flowToM3s, formatNumber, mcaToKgcm2 } from "@/lib/calculations/conversions";
import { STANDARD_DNS, MATERIALS } from "@/lib/constants";
import { saveFormState, loadFormState, clearFormState } from "@/lib/storage/form-persistence";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { FlowUnit } from "@/types/hydraulic";

export default function PerfilPage() {
  const [projectName, setProjectName] = useState("Perfil hidraulico");
  const [rawQ, setRawQ] = useState<number | null>(null);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("L/s");
  const [DN, setDN] = useState(150);
  const [materialName, setMaterialName] = useState(MATERIALS[0].name);
  const [C, setC] = useState(MATERIALS[0].c);
  const [P1, setP1] = useState<number | null>(null);
  const [Pmin, setPmin] = useState(1.0);
  const [vertices, setVertices] = useState<ProfileVertex[]>([
    { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
    { id: uuid(), dist: 1000, cota: 95, desc: "Fin" },
  ]);
  const [results, setResults] = useState<ProfileResults | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist
  useEffect(() => {
    const saved = loadFormState<{
      projectName: string; rawQ: number | null; flowUnit: FlowUnit;
      DN: number; materialName: string; C: number; P1: number | null;
      Pmin: number; vertices: ProfileVertex[];
    }>("perfil");
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (saved.rawQ != null) setRawQ(saved.rawQ);
      if (saved.flowUnit) setFlowUnit(saved.flowUnit);
      if (saved.DN) setDN(saved.DN);
      if (saved.materialName) setMaterialName(saved.materialName);
      if (saved.C) setC(saved.C);
      if (saved.P1 != null) setP1(saved.P1);
      if (saved.Pmin != null) setPmin(saved.Pmin);
      if (saved.vertices?.length >= 2) setVertices(saved.vertices);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("perfil", { projectName, rawQ, flowUnit, DN, materialName, C, P1, Pmin, vertices }), 1000);
    return () => clearTimeout(t);
  }, [projectName, rawQ, flowUnit, DN, materialName, C, P1, Pmin, vertices]);

  // Calculate
  const runCalc = useCallback(() => {
    const Q = rawQ != null ? flowToM3s(rawQ, flowUnit) : null;
    const res = calculateProfile({ Q, DN_mm: DN, C, P1_kgcm2: P1, Pmin_kgcm2: Pmin, vertices });
    setResults(res);
  }, [rawQ, flowUnit, DN, C, P1, Pmin, vertices]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleReset = () => {
    setProjectName("Perfil hidraulico");
    setRawQ(null); setFlowUnit("L/s"); setDN(150);
    setMaterialName(MATERIALS[0].name); setC(MATERIALS[0].c);
    setP1(null); setPmin(1.0); setResults(null);
    setVertices([
      { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
      { id: uuid(), dist: 1000, cota: 95, desc: "Fin" },
    ]);
  };

  // Vertex management
  const addVertex = () => {
    const last = vertices[vertices.length - 1];
    setVertices([...vertices, { id: uuid(), dist: (last?.dist ?? 0) + 500, cota: last?.cota ?? 100, desc: "" }]);
  };
  const removeVertex = (id: string) => {
    if (vertices.length <= 2) return;
    setVertices(vertices.filter(v => v.id !== id));
  };
  const updateVertex = (id: string, field: keyof ProfileVertex, value: string | number) => {
    setVertices(vertices.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // CSV Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const newVerts: ProfileVertex[] = [];
      for (const line of lines) {
        const parts = line.split(/[,;\t]+/).map(s => s.trim());
        const dist = parseFloat(parts[0]);
        const cota = parseFloat(parts[1]);
        if (isNaN(dist) || isNaN(cota)) continue;
        newVerts.push({ id: uuid(), dist, cota, desc: parts[2] || "" });
      }
      if (newVerts.length >= 2) {
        setVertices(newVerts);
      } else {
        alert("El archivo debe tener al menos 2 filas con formato: distancia, cota (opcional: descripcion)");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Chart data
  const chartData = results?.points.map(p => ({
    dist: p.dist,
    Terreno: p.cota,
    Piezometrica: p.piezo,
  })) ?? [];

  const missing: string[] = [];
  if (rawQ == null) missing.push("caudal Q");
  if (P1 == null) missing.push("presion P1");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos de la linea</h2>
              <ResetButton moduleKey="perfil" onReset={handleReset} />
            </div>

            <InputField label="Nombre del proyecto" value={projectName} onChange={setProjectName} type="text" />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField label="Caudal Q" value={rawQ} onChange={(v) => setRawQ(v === "" ? null : parseFloat(v))} required tooltip="Caudal de diseno de la linea" />
              </div>
              <select value={flowUnit} onChange={(e) => setFlowUnit(e.target.value as FlowUnit)} className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                <option value="L/s">L/s</option>
                <option value="m³/h">m3/h</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN (mm)</label>
                <select value={DN} onChange={(e) => setDN(parseInt(e.target.value))} className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                  {STANDARD_DNS.map(dn => <option key={dn} value={dn}>{dn}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                <select value={materialName} onChange={(e) => { const m = MATERIALS.find(m => m.name === e.target.value); if (m) { setMaterialName(m.name); setC(m.c); } }} className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                  {MATERIALS.map(m => <option key={m.name} value={m.name}>{m.name} (C={m.c})</option>)}
                </select>
              </div>
            </div>

            <InputField label="Presion de entrada P1" value={P1} onChange={(v) => setP1(v === "" ? null : parseFloat(v))} unit="kg/cm2" required tooltip="Presion disponible al inicio de la linea" />
            <InputField label="Presion minima requerida" value={Pmin} onChange={(v) => setPmin(parseFloat(v) || 1)} unit="kg/cm2" tooltip="Presion minima aceptable en cualquier punto (default 1 kg/cm2)" />
          </div>

          {/* Profile table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Perfil topografico</h2>
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} className="text-[10px] text-[#1C3D5A] border border-[#1C3D5A]/30 px-2 py-1 rounded hover:bg-[#1C3D5A]/10 transition-colors">
                  Importar CSV
                </button>
                <button onClick={addVertex} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
                  + Punto
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={handleCSVImport} className="hidden" />
            </div>

            <p className="text-[10px] text-gray-400">
              Ingresa los vertices del perfil del terreno. Formato CSV: distancia, cota, descripcion (opcional)
            </p>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_24px] gap-2 text-[10px] text-gray-400 font-semibold uppercase px-1">
              <span>Dist. (m)</span>
              <span>Cota (m.s.n.m.)</span>
              <span>Descripcion</span>
              <span></span>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {vertices.map((v, i) => (
                <div key={v.id} className={`grid grid-cols-[1fr_1fr_1fr_24px] gap-2 items-center ${results?.points[i]?.status === 'critical' ? 'bg-red-50 dark:bg-red-900/10 rounded px-1' : results?.points[i]?.status === 'low' ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded px-1' : 'px-1'}`}>
                  <input type="number" value={v.dist} onChange={(e) => updateVertex(v.id, "dist", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
                  <input type="number" value={v.cota} onChange={(e) => updateVertex(v.id, "cota", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
                  <input type="text" value={v.desc} onChange={(e) => updateVertex(v.id, "desc", e.target.value)} placeholder={i === 0 ? "Inicio" : ""} className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
                  {vertices.length > 2 ? (
                    <button onClick={() => removeVertex(v.id)} className="text-red-400 hover:text-red-600 text-xs text-center">{"✗"}</button>
                  ) : <span />}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-400">{vertices.length} puntos</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {missing.length > 0 ? (
                <DataStatusBanner assumed={[]} missingRequired={missing} />
              ) : (
                <DataStatusBanner assumed={P1 == null ? [{ field: "P1", value: 0, label: "Sin P1 — presiones no disponibles" }] : []} />
              )}
            </div>
            <ExportPDFButton
              disabled={!results}
              getData={() => {
                if (!results) return null;
                return {
                  title: "Analisis de Perfil Hidraulico",
                  module: "Perfil",
                  projectName,
                  hasAssumedValues: false,
                  inputs: [
                    { label: "Q", value: rawQ != null ? `${rawQ} ${flowUnit}` : "--" },
                    { label: "DN", value: `${DN} mm` },
                    { label: "Material", value: `${materialName} (C=${C})` },
                    { label: "P1", value: P1 != null ? `${P1} kg/cm2` : "--" },
                    { label: "P min", value: `${Pmin} kg/cm2` },
                    { label: "Puntos del perfil", value: `${vertices.length}` },
                  ],
                  results: [
                    { label: "Longitud total", value: formatNumber(results.totalLength, 0), unit: "m" },
                    { label: "hf total", value: formatNumber(results.totalHf, 3), unit: "m" },
                    { label: "Velocidad", value: results.V != null ? formatNumber(results.V, 2) : "--", unit: "m/s" },
                    { label: "P final", value: results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--", unit: "kg/cm2" },
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                  tableData: {
                    head: ["Dist (m)", "Cota", "Piezom.", "P (kg/cm2)", "Estado"],
                    body: results.points.map(p => [
                      `${p.dist}`,
                      `${p.cota}`,
                      p.piezo != null ? formatNumber(p.piezo, 1) : "--",
                      p.pressure_kgcm2 != null ? formatNumber(p.pressure_kgcm2, 2) : "--",
                      p.status === "ok" ? "OK" : p.status === "low" ? "Baja" : "Critica",
                    ]),
                  },
                };
              }}
            />
          </div>

          {results && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Longitud total" value={formatNumber(results.totalLength, 0)} unit="m" dataStatus="calculated" />
                <MetricCard label="Velocidad" value={results.V != null ? formatNumber(results.V, 2) : "--"} unit="m/s" alertLevel={results.V != null && results.V > 2.5 ? "WARN" : "OK"} dataStatus="calculated" />
                <MetricCard label="hf total" value={formatNumber(results.totalHf, 2)} unit="m" dataStatus="calculated" />
                <MetricCard
                  label="P final"
                  value={results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--"}
                  unit="kg/cm2"
                  alertLevel={results.finalPressure_kgcm2 != null && results.finalPressure_kgcm2 < Pmin ? "ERROR" : "OK"}
                  dataStatus="calculated"
                />
              </div>

              {/* Critical point */}
              {results.criticalPoint && results.criticalPoint.pressure_kgcm2 < Pmin && (
                <div className={`rounded-xl p-4 text-center font-medium ${results.criticalPoint.pressure_kgcm2 < 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 text-yellow-700'}`}>
                  Punto critico: <strong>{formatNumber(results.criticalPoint.pressure_kgcm2, 2)} kg/cm2</strong> a {formatNumber(results.criticalPoint.dist, 0)} m del inicio
                </div>
              )}

              {/* Profile chart */}
              {chartData.length >= 2 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-xs font-semibold text-gray-500 mb-3">Perfil del terreno + Linea piezometrica</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="dist" type="number" tick={{ fontSize: 10 }} label={{ value: "Distancia (m)", position: "bottom", fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: "Elevacion (m)", angle: -90, position: "insideLeft", fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [v?.toFixed(2), ""]} labelFormatter={(l) => `Dist: ${l} m`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="Terreno" stroke="#8B7355" fill="#D2B48C" fillOpacity={0.3} strokeWidth={2} />
                      <Line type="monotone" dataKey="Piezometrica" stroke="#1C3D5A" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="8 4" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Results table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-[#1C3D5A] px-4 py-2">
                  <h3 className="text-xs font-semibold text-white">Presiones en cada punto del perfil</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-right">Dist (m)</th>
                        <th className="px-3 py-2 text-right">Cota</th>
                        <th className="px-3 py-2 text-right">Piezom.</th>
                        <th className="px-3 py-2 text-right">P (kg/cm2)</th>
                        <th className="px-3 py-2 text-right">hf acum (m)</th>
                        <th className="px-3 py-2 text-center">Estado</th>
                        <th className="px-3 py-2 text-left">Desc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.points.map((p, i) => (
                        <tr key={i} className={`border-b border-gray-100 dark:border-gray-700 ${p.status === 'critical' ? 'bg-red-50 dark:bg-red-900/10' : p.status === 'low' ? 'bg-yellow-50 dark:bg-yellow-900/10' : i % 2 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatNumber(p.dist, 0)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatNumber(p.cota, 1)}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.piezo != null ? formatNumber(p.piezo, 1) : "--"}</td>
                          <td className={`px-3 py-2 text-right font-mono font-semibold ${p.status === 'critical' ? 'text-red-600' : p.status === 'low' ? 'text-yellow-600' : ''}`}>
                            {p.pressure_kgcm2 != null ? formatNumber(p.pressure_kgcm2, 2) : "--"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-400">{formatNumber(p.hfAccum, 2)}</td>
                          <td className="px-3 py-2 text-center">
                            {p.status === "ok" && <span className="text-green-600">{"✓"}</span>}
                            {p.status === "low" && <span className="text-yellow-600">{"⚠"}</span>}
                            {p.status === "critical" && <span className="text-red-600">{"✗"}</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alerts */}
              {results.alerts.map((a, i) => (
                <AlertBanner key={i} level={a.level} message={a.message} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
