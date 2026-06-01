"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { calculateProfile, type ProfileVertex, type ProfileTramo, type ProfileResults } from "@/lib/calculations/hydraulic-profile";
import { flowToM3s, formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS, STANDARD_DNS_LABELED, MATERIALS } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ListaMaterialesSIMEX, { type SIMEXAcc } from "@/components/ListaMaterialesSIMEX";
import type { FlowUnit } from "@/types/hydraulic";

// Compact numeric input with local state (no lag, no spinners)
function NumInput({ value, onChange, className = "" }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [local, setLocal] = useState(String(value));
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { if (!focused.current) setLocal(String(value)); }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={local}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        clearTimeout(timer.current);
        const n = parseFloat(local);
        if (!isNaN(n)) { onChange(n); setLocal(String(n)); }
        else setLocal(String(value));
      }}
      onChange={(e) => {
        setLocal(e.target.value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(n);
        }, 200);
      }}
      className={`w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white ${className}`}
    />
  );
}

export default function PerfilPage() {
  const [projectName, setProjectName] = useState("Perfil hidraulico");
  const [rawQ, setRawQ] = useState<number | null>(null);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("L/s");
  const [P1, setP1] = useState<number | null>(null);
  const [Pmin, setPmin] = useState(1.0);
  const [vertices, setVertices] = useState<ProfileVertex[]>([
    { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
    { id: uuid(), dist: 1000, cota: 95, desc: "Fin" },
  ]);
  const [tramos, setTramos] = useState<ProfileTramo[]>([
    { id: uuid(), distFrom: 0, distTo: 1000, DN_mm: 150, C: MATERIALS[0].c, materialName: MATERIALS[0].name },
  ]);
  const [results, setResults] = useState<ProfileResults | null>(null);
  const [simexPorTramo, setSimexPorTramo] = useState<Record<string, SIMEXAcc[]>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist
  useEffect(() => {
    const saved = loadFormState<{
      projectName: string; rawQ: number | null; flowUnit: FlowUnit;
      P1: number | null; Pmin: number;
      vertices: ProfileVertex[]; tramos: ProfileTramo[];
    }>("perfil");
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (saved.rawQ != null) setRawQ(saved.rawQ);
      if (saved.flowUnit) setFlowUnit(saved.flowUnit);
      if (saved.P1 != null) setP1(saved.P1);
      if (saved.Pmin != null) setPmin(saved.Pmin);
      if (saved.vertices?.length >= 2) setVertices(saved.vertices);
      if (saved.tramos?.length >= 1) setTramos(saved.tramos);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveFormState("perfil", { projectName, rawQ, flowUnit, P1, Pmin, vertices, tramos }), 1000);
    return () => clearTimeout(t);
  }, [projectName, rawQ, flowUnit, P1, Pmin, vertices, tramos]);

  // Calculate
  const runCalc = useCallback(() => {
    const Q = rawQ != null ? flowToM3s(rawQ, flowUnit) : null;
    const res = calculateProfile({ Q, P1_kgcm2: P1, Pmin_kgcm2: Pmin, vertices, tramos });
    setResults(res);
  }, [rawQ, flowUnit, P1, Pmin, vertices, tramos]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleReset = () => {
    setProjectName("Perfil hidraulico");
    setRawQ(null); setFlowUnit("L/s"); setP1(null); setPmin(1.0); setResults(null);
    setVertices([
      { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
      { id: uuid(), dist: 1000, cota: 95, desc: "Fin" },
    ]);
    setTramos([
      { id: uuid(), distFrom: 0, distTo: 1000, DN_mm: 150, C: MATERIALS[0].c, materialName: MATERIALS[0].name },
    ]);
    setSimexPorTramo({});
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

  // Tramo management
  const addTramo = () => {
    const last = tramos[tramos.length - 1];
    const from = last?.distTo ?? 0;
    setTramos([...tramos, { id: uuid(), distFrom: from, distTo: from + 1000, DN_mm: last?.DN_mm ?? 150, C: last?.C ?? MATERIALS[0].c, materialName: last?.materialName ?? MATERIALS[0].name }]);
  };
  const removeTramo = (id: string) => {
    if (tramos.length <= 1) return;
    setTramos(tramos.filter(t => t.id !== id));
  };
  const updateTramo = (id: string, updates: Partial<ProfileTramo>) => {
    setTramos(tramos.map(t => t.id === id ? { ...t, ...updates } : t));
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
        // Auto-adjust first tramo to cover full profile
        const maxDist = Math.max(...newVerts.map(v => v.dist));
        if (tramos.length === 1) {
          setTramos([{ ...tramos[0], distFrom: newVerts[0].dist, distTo: maxDist }]);
        }
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

  // Colors per tramo for the table
  const tramoColors = ["#1C3D5A", "#2E7D32", "#C62828", "#F57F17", "#6A1B9A", "#00838F"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Global data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos de la linea</h2>
              <ResetButton moduleKey="perfil" onReset={handleReset} />
            </div>
            <InputField label="Nombre del proyecto" value={projectName} onChange={setProjectName} type="text" />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <InputField label="Caudal Q" value={rawQ} onChange={(v) => setRawQ(v === "" ? null : parseFloat(v))} required tooltip="Caudal de diseno — se usa en todos los tramos" />
              </div>
              <select value={flowUnit} onChange={(e) => setFlowUnit(e.target.value as FlowUnit)} className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                <option value="L/s">L/s</option>
                <option value="m³/h">m3/h</option>
              </select>
            </div>
            <InputField label="Presion de entrada P1" value={P1} onChange={(v) => setP1(v === "" ? null : parseFloat(v))} unit="kg/cm2" required tooltip="Presion disponible al inicio de la linea" />
            <InputField label="Presion minima requerida" value={Pmin} onChange={(v) => setPmin(parseFloat(v) || 1)} unit="kg/cm2" tooltip="Presion minima aceptable en cualquier punto" />
          </div>

          {/* Tramos de tubería */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tramos de tuberia</h2>
              <button onClick={addTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">+ Tramo</button>
            </div>
            <p className="text-[10px] text-gray-400">Define en que distancia cambia el diametro o material</p>

            {tramos.map((t, i) => (
              <div key={t.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 space-y-2" style={{ borderLeftColor: tramoColors[i % tramoColors.length], borderLeftWidth: 3 }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tramo {i + 1}</span>
                  {tramos.length > 1 && <button onClick={() => removeTramo(t.id)} className="text-red-400 hover:text-red-600 text-xs">{"✗"}</button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Desde (m)" value={t.distFrom} onChange={(v) => updateTramo(t.id, { distFrom: parseFloat(v) || 0 })} />
                  <InputField label="Hasta (m)" value={t.distTo} onChange={(v) => updateTramo(t.id, { distTo: parseFloat(v) || 0 })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN (mm)</label>
                    <select value={t.DN_mm} onChange={(e) => updateTramo(t.id, { DN_mm: parseInt(e.target.value) })} className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                      {STANDARD_DNS_LABELED.map(d => <option key={d.dn} value={d.dn}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                    <select value={t.materialName} onChange={(e) => { const m = MATERIALS.find(m => m.name === e.target.value); if (m) updateTramo(t.id, { materialName: m.name, C: m.c }); }} className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                      {MATERIALS.map(m => <option key={m.name} value={m.name}>{m.name} (C={m.c})</option>)}
                    </select>
                  </div>
                </div>
                {/* SIMEX Accessories */}
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <ListaMaterialesSIMEX
                    mode="selector"
                    dnMM={t.DN_mm}
                    materialRaw={t.materialName}
                    externalAccs={simexPorTramo[t.id] || []}
                    onAccsChange={(accs) => setSimexPorTramo(prev => ({...prev, [t.id]: accs}))}
                  />
                  {(simexPorTramo[t.id]?.length ?? 0) > 0 && (
                    <p className="text-[10px] text-[#1C3D5A]/60 dark:text-blue-300/50 mt-1 font-medium">
                      {simexPorTramo[t.id].reduce((s, a) => s + a.qty, 0)} pza(s) seleccionada(s)
                    </p>
                  )}
                </div>
              </div>
            ))}
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
            <p className="text-[10px] text-gray-400">CSV: distancia, cota, descripcion (opcional)</p>

            <div className="grid grid-cols-[1fr_1fr_1fr_24px] gap-2 text-[10px] text-gray-400 font-semibold uppercase px-1">
              <span>Dist. (m)</span><span>Cota (m.s.n.m.)</span><span>Descripcion</span><span></span>
            </div>
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {vertices.map((v, i) => (
                <div key={v.id} className={`grid grid-cols-[1fr_1fr_1fr_24px] gap-2 items-center px-1 ${results?.points[i]?.status === 'critical' ? 'bg-red-50 dark:bg-red-900/10 rounded' : results?.points[i]?.status === 'low' ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded' : ''}`}>
                  <NumInput value={v.dist} onChange={(n) => updateVertex(v.id, "dist", n)} />
                  <NumInput value={v.cota} onChange={(n) => updateVertex(v.id, "cota", n)} />
                  <input type="text" value={v.desc} onChange={(e) => updateVertex(v.id, "desc", e.target.value)} placeholder={i === 0 ? "Inicio" : ""} className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
                  {vertices.length > 2 ? <button onClick={() => removeVertex(v.id)} className="text-red-400 hover:text-red-600 text-xs text-center">{"✗"}</button> : <span />}
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
                <DataStatusBanner assumed={[]} />
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
                    { label: "P1", value: P1 != null ? `${P1} kg/cm2` : "--" },
                    { label: "P min", value: `${Pmin} kg/cm2` },
                    { label: "Tramos", value: tramos.map((t, i) => `T${i + 1}: ${t.DN_mm}mm ${t.materialName}`).join(", ") },
                    { label: "Puntos", value: `${vertices.length}` },
                  ],
                  results: [
                    { label: "Longitud total", value: formatNumber(results.totalLength, 0), unit: "m" },
                    { label: "hf total", value: formatNumber(results.totalHf, 3), unit: "m" },
                    { label: "P final", value: results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--", unit: "kg/cm2" },
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                  tableData: {
                    head: ["Dist", "Cota", "Piezo", "P (kg/cm2)", "DN", "V (m/s)", "Estado"],
                    body: results.points.map(p => [
                      `${p.dist}`, formatNumber(p.cota, 1),
                      p.piezo != null ? formatNumber(p.piezo, 1) : "--",
                      p.pressure_kgcm2 != null ? formatNumber(p.pressure_kgcm2, 2) : "--",
                      `${p.DN_mm}`, p.V != null ? formatNumber(p.V, 2) : "--",
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
                <MetricCard label="hf total" value={formatNumber(results.totalHf, 2)} unit="m" dataStatus="calculated" />
                <MetricCard
                  label="P final"
                  value={results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--"}
                  unit="kg/cm2"
                  alertLevel={results.finalPressure_kgcm2 != null && results.finalPressure_kgcm2 < Pmin ? "ERROR" : "OK"}
                  dataStatus="calculated"
                />
                <MetricCard label="Puntos criticos" value={`${results.pointsCritical}`} alertLevel={results.pointsCritical > 0 ? "ERROR" : "OK"} dataStatus="calculated" />
              </div>

              {/* Tramo summaries */}
              {results.tramoSummaries.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {results.tramoSummaries.map((ts, i) => (
                    <div key={ts.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs" style={{ borderLeftColor: tramoColors[i % tramoColors.length], borderLeftWidth: 3 }}>
                      <span className="font-semibold">T{i + 1}</span>
                      <span className="text-gray-400 mx-1">|</span>
                      <span>{ts.DN_mm}mm {ts.materialName}</span>
                      <span className="text-gray-400 mx-1">|</span>
                      <span>{formatNumber(ts.length, 0)}m</span>
                      <span className="text-gray-400 mx-1">|</span>
                      <span>V={ts.V != null ? formatNumber(ts.V, 2) : "--"} m/s</span>
                      <span className="text-gray-400 mx-1">|</span>
                      <span>hf={formatNumber(ts.hf, 2)}m</span>
                    </div>
                  ))}
                </div>
              )}

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
                        <th className="px-2 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-right">Dist (m)</th>
                        <th className="px-2 py-2 text-right">Cota</th>
                        <th className="px-2 py-2 text-right">Piezom.</th>
                        <th className="px-2 py-2 text-right">P (kg/cm2)</th>
                        <th className="px-2 py-2 text-right">hf (m)</th>
                        <th className="px-2 py-2 text-center">DN</th>
                        <th className="px-2 py-2 text-right">V (m/s)</th>
                        <th className="px-2 py-2 text-center">Estado</th>
                        <th className="px-2 py-2 text-left">Desc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.points.map((p, i) => (
                        <tr key={i} className={`border-b border-gray-100 dark:border-gray-700 ${p.status === 'critical' ? 'bg-red-50 dark:bg-red-900/10' : p.status === 'low' ? 'bg-yellow-50 dark:bg-yellow-900/10' : i % 2 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{formatNumber(p.dist, 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{formatNumber(p.cota, 1)}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{p.piezo != null ? formatNumber(p.piezo, 1) : "--"}</td>
                          <td className={`px-2 py-1.5 text-right font-mono font-semibold ${p.status === 'critical' ? 'text-red-600' : p.status === 'low' ? 'text-yellow-600' : ''}`}>
                            {p.pressure_kgcm2 != null ? formatNumber(p.pressure_kgcm2, 2) : "--"}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-gray-400">{formatNumber(p.hfAccum, 2)}</td>
                          <td className="px-2 py-1.5 text-center" style={{ color: tramoColors[p.tramoIndex % tramoColors.length] }}>{p.DN_mm}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{p.V != null ? formatNumber(p.V, 2) : "--"}</td>
                          <td className="px-2 py-1.5 text-center">
                            {p.status === "ok" && <span className="text-green-600">{"✓"}</span>}
                            {p.status === "low" && <span className="text-yellow-600">{"⚠"}</span>}
                            {p.status === "critical" && <span className="text-red-600">{"✗"}</span>}
                          </td>
                          <td className="px-2 py-1.5 text-gray-500 truncate max-w-[100px]">{p.desc}</td>
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

              {/* SIMEX Material Tables */}
              {tramos.some(t => (simexPorTramo[t.id]?.length ?? 0) > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#1C3D5A] to-[#2A5A7A] px-5 py-3">
                    <h3 className="text-sm font-semibold text-white tracking-wide">Lista de Materiales SIMEX</h3>
                    <p className="text-[10px] text-white/50 mt-0.5">Generada desde los accesorios seleccionados por tramo</p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tramos.map((t, i) => {
                      if ((simexPorTramo[t.id]?.length ?? 0) === 0) return null;
                      return (
                        <div key={`simex-${t.id}`} className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: tramoColors[i % tramoColors.length] }}>{i + 1}</span>
                            <h4 className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300">Tramo {i + 1} — {t.DN_mm}mm {t.materialName}</h4>
                            <span className="text-[10px] text-gray-400 ml-auto">{formatNumber(t.distFrom, 0)}m a {formatNumber(t.distTo, 0)}m</span>
                          </div>
                          <ListaMaterialesSIMEX
                            mode="table"
                            dnMM={t.DN_mm}
                            materialRaw={t.materialName}
                            externalAccs={simexPorTramo[t.id] || []}
                            onAccsChange={(accs) => setSimexPorTramo(prev => ({...prev, [t.id]: accs}))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
