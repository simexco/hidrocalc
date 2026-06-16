"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { MetricCard } from "@/components/ui/MetricCard";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataStatusBanner } from "@/components/ui/DataStatusBanner";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";
import { ResetButton } from "@/components/ui/ResetButton";
import { validateHydraulicInputs, InputWarnings } from "@/components/ui/InputWarning";
import { calculateProfile, calculateRequiredP1, type ProfileVertex, type ProfileTramo, type ProfileResults } from "@/lib/calculations/hydraulic-profile";
import { flowToM3s, formatNumber } from "@/lib/calculations/conversions";
import { STANDARD_DNS, STANDARD_DNS_LABELED, MATERIALS, getPipeClassesForMaterial } from "@/lib/constants";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { useProjectStore } from "@/store/projectStore";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { NumInput } from "@/components/ui/NumInput";
import type { FlowUnit } from "@/types/hydraulic";

export default function PerfilPage() {
  const [projectName, setProjectName] = useState("Perfil hidraulico");
  const [rawQ, setRawQ] = useState<number | null>(null);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("L/s");
  const [P1, setP1] = useState<number | null>(null);
  const [Pmin, setPmin] = useState(1.0);
  const [coefAccesorios, setCoefAccesorios] = useState(5); // % de hf (default 5%)
  const [vertices, setVertices] = useState<ProfileVertex[]>([
    { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
    { id: uuid(), dist: 1000, cota: 95, desc: "Fin" },
  ]);
  const [tramos, setTramos] = useState<ProfileTramo[]>([
    { id: uuid(), distFrom: 0, distTo: 1000, DN_mm: 150, C: MATERIALS[0].c, materialName: MATERIALS[0].name },
  ]);
  const [results, setResults] = useState<ProfileResults | null>(null);
  const [calcMode, setCalcMode] = useState<'verificar' | 'calcularP1'>('verificar');
  const [computedP1, setComputedP1] = useState<number | null>(null);
  const [showScenarioB, setShowScenarioB] = useState(false);
  const [tramosB, setTramosB] = useState<ProfileTramo[]>([
    { id: uuid(), distFrom: 0, distTo: 1000, DN_mm: 150, C: MATERIALS[0].c, materialName: MATERIALS[0].name },
  ]);
  const [resultsB, setResultsB] = useState<ProfileResults | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

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

  // Flujo de proyecto: prefill del Q desde el proyecto si no hay dato guardado
  useEffect(() => {
    const saved = loadFormState<{ rawQ?: number | null }>("perfil");
    const projQ = useProjectStore.getState().project.q_ls;
    if (saved?.rawQ == null && projQ != null) { setRawQ(projQ); setFlowUnit("L/s"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flujo de proyecto: la conduccion escribe sus datos al proyecto activo
  // (el perfil topografico viaja al siguiente paso: Valvulas de aire)
  const patchProject = useProjectStore((s) => s.patch);
  useEffect(() => {
    const t = setTimeout(() => {
      const sorted = [...vertices].filter((v) => v.dist != null && v.cota != null).sort((a, b) => a.dist - b.dist);
      const t0 = tramos[0];
      const dnLabel = t0 ? (STANDARD_DNS_LABELED.find((s) => s.dn === t0.DN_mm)?.label ?? `${t0.DN_mm} mm`) : "";
      // Presion maxima de operacion en la linea y PN de la clase elegida (del motor del perfil)
      const sums = results?.tramoSummaries ?? [];
      const presiones = sums.map((s) => s.maxPressure_kgcm2).filter((p): p is number => p != null);
      const pns = sums.map((s) => (s.PN_bar != null ? s.PN_bar / 0.9807 : null)).filter((p): p is number => p != null);
      patchProject({
        material: t0?.materialName ?? "PVC C900",
        dn: dnLabel,
        clase: t0?.pipeClass ?? "",
        diametroInterior: t0?.DN_mm ?? null,
        c: t0?.C ?? 150,
        longitud: sorted.length ? sorted[sorted.length - 1].dist : null,
        desnivel: sorted.length >= 2 ? sorted[0].cota - sorted[sorted.length - 1].cota : null,
        vertices: sorted.map((v) => ({ cad: v.dist, cota: v.cota, desc: v.desc || "" })),
        presionMaxLinea: presiones.length ? Math.max(...presiones) : null,
        pnLinea: pns.length ? Math.min(...pns) : null,
        p1: calcMode === "calcularP1" ? computedP1 : P1,
        presionFinalLinea: results?.finalPressure_kgcm2 ?? null,
      });
    }, 700);
    return () => clearTimeout(t);
  }, [vertices, tramos, results, P1, computedP1, calcMode, patchProject]);

  // Calculate
  const runCalc = useCallback(() => {
    const Q = rawQ != null ? flowToM3s(rawQ, flowUnit) : null;

    let effectiveP1 = P1;
    if (calcMode === 'calcularP1' && Q != null && Q > 0) {
      const reqP1 = calculateRequiredP1({ Q, Pmin_kgcm2: Pmin, vertices, tramos });
      setComputedP1(reqP1);
      effectiveP1 = reqP1;
    } else {
      setComputedP1(null);
    }

    const res = calculateProfile({ Q, P1_kgcm2: effectiveP1, Pmin_kgcm2: Pmin, vertices, tramos, coefAccesorios: coefAccesorios / 100 });
    setResults(res);

    // Scenario B
    if (showScenarioB) {
      const resB = calculateProfile({ Q, P1_kgcm2: effectiveP1, Pmin_kgcm2: Pmin, vertices, tramos: tramosB, coefAccesorios: coefAccesorios / 100 });
      setResultsB(resB);
    } else {
      setResultsB(null);
    }
  }, [rawQ, flowUnit, P1, Pmin, vertices, tramos, calcMode, showScenarioB, tramosB, coefAccesorios]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCalc, 300);
    return () => clearTimeout(debounceRef.current);
  }, [runCalc]);

  const handleReset = () => {
    setProjectName("Perfil hidraulico");
    setRawQ(null); setFlowUnit("L/s"); setP1(null); setPmin(1.0); setCoefAccesorios(5); setResults(null);
    setVertices([
      { id: uuid(), dist: 0, cota: 100, desc: "Inicio" },
      { id: uuid(), dist: 1000, cota: 95, desc: "Fin" },
    ]);
    setTramos([
      { id: uuid(), distFrom: 0, distTo: 1000, DN_mm: 150, C: MATERIALS[0].c, materialName: MATERIALS[0].name },
    ]);
    setCalcMode('verificar');
    setComputedP1(null);
    setShowScenarioB(false);
    setTramosB([{ id: uuid(), distFrom: 0, distTo: 1000, DN_mm: 150, C: MATERIALS[0].c, materialName: MATERIALS[0].name }]);
    setResultsB(null);
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

  // Longitud de la linea (segun los tramos) y maximo cadenamiento del perfil — para validar
  const lineLength = tramos.reduce((mx, t) => Math.max(mx, t.distTo ?? 0), 0);
  const perfilMax = vertices.reduce((mx, v) => Math.max(mx, v.dist ?? 0), 0);

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

  // Tramo B management
  const addTramoB = () => {
    const last = tramosB[tramosB.length - 1];
    const from = last?.distTo ?? 0;
    setTramosB([...tramosB, { id: uuid(), distFrom: from, distTo: from + 1000, DN_mm: last?.DN_mm ?? 150, C: last?.C ?? MATERIALS[0].c, materialName: last?.materialName ?? MATERIALS[0].name }]);
  };
  const removeTramoB = (id: string) => {
    if (tramosB.length <= 1) return;
    setTramosB(tramosB.filter(t => t.id !== id));
  };
  const updateTramoB = (id: string, updates: Partial<ProfileTramo>) => {
    setTramosB(tramosB.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Excel Template Download
  const downloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Perfil');
    const headerRow = ws.addRow(['Cadenamiento (m)', 'Cota (m.s.n.m.)', 'Descripcion']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C3D5A' } };
      cell.alignment = { horizontal: 'center' };
    });
    ws.addRow([0, 100, 'Inicio']);
    ws.addRow([1000, 95, 'Fin']);
    ws.getColumn(1).width = 16;
    ws.getColumn(2).width = 18;
    ws.getColumn(3).width = 20;
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Perfil_HidroCalc.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel Import
  const handleXLSXImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    if (!ws) { alert("No se encontro ninguna hoja en el archivo"); return; }
    const newVerts: ProfileVertex[] = [];
    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const dist = parseFloat(String(row.getCell(1).value));
      const cota = parseFloat(String(row.getCell(2).value));
      if (isNaN(dist) || isNaN(cota)) return;
      newVerts.push({ id: uuid(), dist, cota, desc: String(row.getCell(3).value || '') });
    });
    if (newVerts.length >= 2) {
      setVertices(newVerts);
      const maxDist = Math.max(...newVerts.map(v => v.dist));
      if (tramos.length === 1) {
        setTramos([{ ...tramos[0], distFrom: newVerts[0].dist, distTo: maxDist }]);
      }
    } else {
      alert("El archivo debe tener al menos 2 filas con formato: distancia, cota (opcional: descripcion)");
    }
    e.target.value = "";
  };

  // DN Recommendation: find optimal DN for current Q
  const Q_m3s = rawQ != null ? flowToM3s(rawQ, flowUnit) : null;
  const recommendedDN = (() => {
    if (!Q_m3s || Q_m3s <= 0) return null;
    for (const d of STANDARD_DNS) {
      const D_m = d / 1000;
      const A = Math.PI * Math.pow(D_m / 2, 2);
      const V = Q_m3s / A;
      if (V >= 0.6 && V <= 1.5) return { dn: d, V, label: STANDARD_DNS_LABELED.find(x => x.dn === d)?.label ?? `${d}` };
    }
    for (const d of STANDARD_DNS) {
      const D_m = d / 1000;
      const A = Math.PI * Math.pow(D_m / 2, 2);
      const V = Q_m3s / A;
      if (V <= 2.5) return { dn: d, V, label: STANDARD_DNS_LABELED.find(x => x.dn === d)?.label ?? `${d}` };
    }
    return null;
  })();

  function getTramoVelocity(DN_mm: number): { V: number; status: 'optimo' | 'aceptable' | 'alto' | 'bajo' } | null {
    if (!Q_m3s || Q_m3s <= 0) return null;
    const D_m = DN_mm / 1000;
    const A = Math.PI * Math.pow(D_m / 2, 2);
    const V = Q_m3s / A;
    let status: 'optimo' | 'aceptable' | 'alto' | 'bajo';
    if (V >= 0.6 && V <= 1.5) status = 'optimo';
    else if (V > 1.5 && V <= 2.5) status = 'aceptable';
    else if (V > 2.5) status = 'alto';
    else status = 'bajo';
    return { V, status };
  }

  const applyRecommendedDN = () => {
    if (!recommendedDN) return;
    setTramos(tramos.map(t => ({ ...t, DN_mm: recommendedDN.dn })));
  };

  // Chart data — merge scenario A and B by distance
  const chartData = (() => {
    if (!results) return [];
    const base = results.points.map(p => ({
      dist: p.dist,
      Terreno: p.cota,
      "Piezometrica A": p.piezo,
      "Piezometrica B": undefined as number | undefined,
    }));
    if (showScenarioB && resultsB) {
      // Build a map of B's piezo by distance for merging
      const bMap = new Map(resultsB.points.map(p => [p.dist, p.piezo]));
      for (const row of base) {
        const bVal = bMap.get(row.dist);
        if (bVal != null) row["Piezometrica B"] = bVal;
      }
    }
    return base;
  })();

  // Rango del eje Y ajustado a las cotas reales (no parte de 0) para que
  // se vean las variaciones de pocos metros del terreno.
  const yDomain: [number, number] = (() => {
    const vals = chartData.flatMap(d => [d.Terreno, d["Piezometrica A"], d["Piezometrica B"]])
      .filter((v): v is number => v != null && isFinite(v));
    if (vals.length === 0) return [0, 100];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = Math.max((hi - lo) * 0.1, 2); // 10% del rango o minimo 2 m
    return [Math.floor(lo - pad), Math.ceil(hi + pad)];
  })();

  const missing: string[] = [];
  if (rawQ == null) missing.push("caudal Q");
  if (calcMode === 'verificar' && P1 == null) missing.push("presion P1");

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
                <InputField label="Caudal Q" value={rawQ} onChange={(v) => setRawQ(v === "" ? null : parseFloat(v))} required tooltip="Caudal de diseño — se usa en todos los tramos" />
              </div>
              <select value={flowUnit} onChange={(e) => setFlowUnit(e.target.value as FlowUnit)} className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                <option value="L/s">L/s</option>
                <option value="m³/h">m3/h</option>
              </select>
            </div>
            {/* Mode toggle */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo de calculo</label>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setCalcMode('verificar')}
                  className={`flex-1 text-xs py-2 px-3 transition-colors ${calcMode === 'verificar' ? 'bg-[#1C3D5A] text-white font-semibold' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  Verificar presion
                </button>
                <button
                  onClick={() => setCalcMode('calcularP1')}
                  className={`flex-1 text-xs py-2 px-3 transition-colors ${calcMode === 'calcularP1' ? 'bg-[#1C3D5A] text-white font-semibold' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  Calcular P1 requerida
                </button>
              </div>
            </div>
            {calcMode === 'verificar' ? (
              <InputField label="Presion de entrada P1" value={P1} onChange={(v) => setP1(v === "" ? null : parseFloat(v))} unit="kg/cm2" required tooltip="Presion disponible al inicio de la linea" />
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                <p className="text-[10px] text-blue-500 dark:text-blue-400 mb-1">P1 requerida para cumplir Pmin</p>
                <p className="text-xl font-bold text-[#1C3D5A] dark:text-blue-300">
                  {computedP1 != null ? formatNumber(computedP1, 2) : "--"} <span className="text-sm font-normal">kg/cm2</span>
                </p>
              </div>
            )}
            <InputWarnings warnings={validateHydraulicInputs({ Q_ls: rawQ, P1_kgcm2: P1 })} />

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
              <InputField label="Presion minima requerida" value={Pmin} onChange={(v) => setPmin(parseFloat(v) || 1)} unit="kg/cm2" tooltip="Presion minima aceptable en cualquier punto" />
              <InputField label="Perdida por accesorios" value={coefAccesorios} onChange={(v) => setCoefAccesorios(parseFloat(v) || 5)} unit="% de hf" tooltip="Perdida por accesorios estimada como porcentaje de la perdida por friccion. Tipico 5% en lineas de conduccion." />
            </div>
          </div>

          {/* Tramos de tubería */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tramos de tuberia</h2>
              <button onClick={addTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">+ Tramo</button>
            </div>
            <p className="text-[10px] text-gray-400">Define en que distancia cambia el diametro o material</p>

            {/* DN Recommendation banner */}
            {recommendedDN && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-800 dark:text-green-300">DN recomendado para Q={rawQ} {flowUnit}</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-200">{recommendedDN.label} <span className="text-xs font-normal text-green-600">V={formatNumber(recommendedDN.V, 2)} m/s</span></p>
                  </div>
                  <button onClick={applyRecommendedDN} className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm">
                    Aplicar a todos
                  </button>
                </div>
              </div>
            )}

            {tramos.map((t, i) => {
              const vel = getTramoVelocity(t.DN_mm);
              return (
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
                      {MATERIALS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                {/* Pipe class selector */}
                {(() => {
                  const classes = getPipeClassesForMaterial(t.materialName);
                  if (!classes) return null;
                  return (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Clase de tuberia</label>
                      <select
                        value={t.pipeClass ?? ''}
                        onChange={(e) => {
                          const sel = classes.classes.find(c => c.clase === e.target.value);
                          updateTramo(t.id, { pipeClass: sel?.clase, PN_bar: sel?.pn });
                        }}
                        className={`w-full px-2 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:text-white ${
                          !t.pipeClass ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <option value="">-- Seleccionar clase --</option>
                        {classes.classes.map(c => (
                          <option key={c.clase} value={c.clase}>{c.clase} — {(c.pn / 0.9807).toFixed(1)} kg/cm2</option>
                        ))}
                      </select>
                      {!t.pipeClass && <p className="text-[10px] text-yellow-600">Selecciona la clase para verificar que resista la presion</p>}
                    </div>
                  );
                })()}

                {/* PN exceeded warning per tramo */}
                {(() => {
                  const ts = results?.tramoSummaries.find(s => s.id === t.id);
                  if (!ts?.exceedsPN || !ts.PN_bar) return null;
                  const pnKg = (ts.PN_bar / 0.9807).toFixed(1);
                  const classes = getPipeClassesForMaterial(t.materialName);
                  const recommended = classes?.classes.find(c => (c.pn / 0.9807) >= ts.maxPressure_kgcm2);
                  return (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 dark:text-red-400 space-y-1">
                      <p className="font-semibold">{"⚠"} Presion excede capacidad de la tuberia</p>
                      <p>P max en este tramo: <strong>{ts.maxPressure_kgcm2.toFixed(1)} kg/cm2</strong> — Capacidad {t.pipeClass}: <strong>{pnKg} kg/cm2</strong></p>
                      {recommended && <p>Clase minima requerida: <strong>{recommended.clase} (PN {recommended.pn} bar)</strong></p>}
                      {!recommended && <p>Ninguna clase de {t.materialName} es suficiente — considerar Hierro ductil o Acero</p>}
                    </div>
                  );
                })()}

                {/* Velocity indicator */}
                {vel && (
                  <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                    vel.status === 'optimo' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' :
                    vel.status === 'aceptable' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' :
                    vel.status === 'alto' ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400' :
                    'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      vel.status === 'optimo' ? 'bg-green-500' :
                      vel.status === 'aceptable' ? 'bg-blue-500' :
                      vel.status === 'alto' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span>V = {formatNumber(vel.V, 2)} m/s</span>
                    {(() => {
                      const ts = results?.tramoSummaries.find(s => s.id === t.id);
                      if (ts && ts.J_km > 0) return (
                        <span className={`font-semibold ${ts.J_km <= 5 ? 'text-green-600' : ts.J_km <= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          J={formatNumber(ts.J_km, 1)} m/km
                        </span>
                      );
                      return null;
                    })()}
                    <span className="text-[10px] opacity-70">
                      {vel.status === 'optimo' && '— Optimo'}
                      {vel.status === 'aceptable' && '— Aceptable'}
                      {vel.status === 'alto' && '— Muy alto (>2.5)'}
                      {vel.status === 'bajo' && '— Muy bajo (<0.3)'}
                    </span>
                    {vel.status !== 'optimo' && recommendedDN && recommendedDN.dn !== t.DN_mm && (
                      <button onClick={() => updateTramo(t.id, { DN_mm: recommendedDN.dn })} className="ml-auto text-[10px] underline opacity-70 hover:opacity-100">
                        Cambiar a {recommendedDN.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );})}
          </div>

          {/* Perfil topografico (despues de definir los tramos / longitud de la linea) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Perfil topografico</h2>
              <div className="flex gap-2">
                <button onClick={downloadTemplate} className="text-[10px] text-[#1C3D5A] border border-[#1C3D5A]/30 px-2 py-1 rounded hover:bg-[#1C3D5A]/10 transition-colors">
                  Plantilla .xlsx
                </button>
                <button onClick={() => xlsxRef.current?.click()} className="text-[10px] text-[#1C3D5A] border border-[#1C3D5A]/30 px-2 py-1 rounded hover:bg-[#1C3D5A]/10 transition-colors">
                  Importar Excel
                </button>
                <button onClick={() => fileRef.current?.click()} className="text-[10px] text-[#1C3D5A] border border-[#1C3D5A]/30 px-2 py-1 rounded hover:bg-[#1C3D5A]/10 transition-colors">
                  Importar CSV
                </button>
                <button onClick={addVertex} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
                  + Punto
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={handleCSVImport} className="hidden" />
              <input ref={xlsxRef} type="file" accept=".xlsx" onChange={handleXLSXImport} className="hidden" />
            </div>
            <p className="text-[10px] text-gray-400">La linea mide {formatNumber(lineLength, 0)} m segun los tramos. El cadenamiento del perfil no debe pasar de ahi. CSV: cadenamiento, cota, descripcion (opcional)</p>

            {perfilMax > lineLength && lineLength > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                {"⚠"} El perfil llega a {formatNumber(perfilMax, 0)} m pero la linea (tramos) mide {formatNumber(lineLength, 0)} m. Ajusta el cadenamiento o amplia los tramos para que coincidan.
              </div>
            )}

            <div className="grid grid-cols-[1fr_1fr_1fr_24px] gap-2 text-[10px] text-gray-400 font-semibold uppercase px-1">
              <span>Cadenam. (m)</span><span>Cota (m.s.n.m.)</span><span>Descripcion</span><span></span>
            </div>
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {vertices.map((v, i) => {
                const excede = v.dist != null && lineLength > 0 && v.dist > lineLength;
                return (
                <div key={v.id} className={`grid grid-cols-[1fr_1fr_1fr_24px] gap-2 items-center px-1 ${excede ? 'bg-amber-50 dark:bg-amber-900/10 rounded' : results?.points[i]?.status === 'critical' ? 'bg-red-50 dark:bg-red-900/10 rounded' : results?.points[i]?.status === 'low' ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded' : ''}`}>
                  <NumInput value={v.dist} onChange={(n) => updateVertex(v.id, "dist", n)} />
                  <NumInput value={v.cota} onChange={(n) => updateVertex(v.id, "cota", n)} />
                  <input type="text" value={v.desc} onChange={(e) => updateVertex(v.id, "desc", e.target.value)} placeholder={i === 0 ? "Inicio" : ""} className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
                  {vertices.length > 2 ? <button onClick={() => removeVertex(v.id)} className="text-red-400 hover:text-red-600 text-xs text-center">{"✗"}</button> : <span />}
                </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400">{vertices.length} puntos</p>
          </div>

          {/* Scenario B toggle + tramos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comparacion de escenarios</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Escenario B</span>
                <input type="checkbox" checked={showScenarioB} onChange={(e) => setShowScenarioB(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#1C3D5A] focus:ring-[#1C3D5A]" />
              </label>
            </div>
            {showScenarioB && (
              <>
                <p className="text-[10px] text-gray-400">Define tramos alternativos (mismo perfil y caudal)</p>
                <div className="flex items-center justify-end">
                  <button onClick={addTramoB} className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">+ Tramo B</button>
                </div>
                {tramosB.map((t, i) => (
                  <div key={t.id} className="border border-orange-200 dark:border-orange-800 rounded-lg p-3 space-y-2" style={{ borderLeftColor: '#F97316', borderLeftWidth: 3 }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Tramo B{i + 1}</span>
                      {tramosB.length > 1 && <button onClick={() => removeTramoB(t.id)} className="text-red-400 hover:text-red-600 text-xs">{"✗"}</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputField label="Desde (m)" value={t.distFrom} onChange={(v) => updateTramoB(t.id, { distFrom: parseFloat(v) || 0 })} />
                      <InputField label="Hasta (m)" value={t.distTo} onChange={(v) => updateTramoB(t.id, { distTo: parseFloat(v) || 0 })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">DN (mm)</label>
                        <select value={t.DN_mm} onChange={(e) => updateTramoB(t.id, { DN_mm: parseInt(e.target.value) })} className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                          {STANDARD_DNS_LABELED.map(d => <option key={d.dn} value={d.dn}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                        <select value={t.materialName} onChange={(e) => { const m = MATERIALS.find(mt => mt.name === e.target.value); if (m) updateTramoB(t.id, { materialName: m.name, C: m.c }); }} className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                          {MATERIALS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
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
                    { label: "P1", value: calcMode === 'calcularP1' && computedP1 != null ? `${formatNumber(computedP1, 2)} kg/cm2 (calculada)` : P1 != null ? `${P1} kg/cm2` : "--" },
                    { label: "P min", value: `${Pmin} kg/cm2` },
                    { label: "Tramos", value: tramos.map((t, i) => `T${i + 1}: ${t.DN_mm}mm ${t.materialName}`).join(", ") },
                    { label: "Puntos", value: `${vertices.length}` },
                  ],
                  results: [
                    { label: "Longitud total", value: formatNumber(results.totalLength, 0), unit: "m" },
                    { label: "Perdida longitudinal (hf)", value: formatNumber(results.totalHf, 3), unit: "m" },
                    { label: `Perdida accesorios (${coefAccesorios}%)`, value: formatNumber(results.totalHm, 3), unit: "m" },
                    { label: "Perdida total", value: formatNumber(results.totalPerdida, 3), unit: "m" },
                    { label: "P final", value: results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--", unit: "kg/cm2" },
                  ],
                  alerts: results.alerts.map(a => ({ level: a.level, message: a.message })),
                  tableData: {
                    head: ["Cadenam.", "Cota", "Piezo", "P (kg/cm2)", "DN", "V (m/s)", "Estado"],
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
                <MetricCard label="Perdida total" value={formatNumber(results.totalPerdida, 2)} unit="m" dataStatus="calculated" />
                <MetricCard
                  label="P final"
                  value={results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--"}
                  unit="kg/cm2"
                  alertLevel={results.finalPressure_kgcm2 != null && results.finalPressure_kgcm2 < Pmin ? "ERROR" : "OK"}
                  dataStatus="calculated"
                />
                <MetricCard label="Puntos criticos" value={`${results.pointsCritical}`} alertLevel={results.pointsCritical > 0 ? "ERROR" : "OK"} dataStatus="calculated" />
              </div>

              {/* Desglose de perdidas de carga */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-[#1C3D5A] px-4 py-2">
                  <h3 className="text-xs font-semibold text-white">Desglose de perdida de carga</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Perdida longitudinal (friccion)</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{formatNumber(results.totalHf, 2)} m</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Perdida por accesorios ({coefAccesorios}% de hf)</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{formatNumber(results.totalHm, 2)} m</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm bg-[#E9EFF5] dark:bg-[#1C3D5A]/20">
                    <span className="font-semibold text-[#1C3D5A] dark:text-blue-300">Perdida total</span>
                    <span className="font-mono font-bold text-[#1C3D5A] dark:text-blue-200">{formatNumber(results.totalPerdida, 2)} m</span>
                  </div>
                </div>
              </div>
              {calcMode === 'calcularP1' && computedP1 != null && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                  <span className="text-xs text-blue-500">P1 requerida para Pmin = {Pmin} kg/cm2:</span>
                  <span className="ml-2 text-lg font-bold text-[#1C3D5A] dark:text-blue-300">{formatNumber(computedP1, 2)} kg/cm2</span>
                </div>
              )}

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
                      <span className="text-gray-400 mx-1">|</span>
                      <span className={`font-semibold ${ts.J_km <= 5 ? 'text-green-600' : ts.J_km <= 10 ? 'text-yellow-600' : 'text-red-600'}`}>J={formatNumber(ts.J_km, 1)} m/km</span>
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

              {/* Scenario comparison summary */}
              {showScenarioB && resultsB && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-[#1C3D5A]/30 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-[#1C3D5A] dark:text-blue-300">Escenario A</h4>
                    <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      <p>hf total: <span className="font-mono font-semibold">{formatNumber(results.totalHf, 2)} m</span></p>
                      <p>P final: <span className="font-mono font-semibold">{results.finalPressure_kgcm2 != null ? formatNumber(results.finalPressure_kgcm2, 2) : "--"} kg/cm2</span></p>
                      <p>Puntos criticos: <span className="font-mono font-semibold">{results.pointsCritical}</span></p>
                      <p>Puntos bajo Pmin: <span className="font-mono font-semibold">{results.pointsBelowMin}</span></p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-orange-300 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400">Escenario B</h4>
                    <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      <p>hf total: <span className="font-mono font-semibold">{formatNumber(resultsB.totalHf, 2)} m</span></p>
                      <p>P final: <span className="font-mono font-semibold">{resultsB.finalPressure_kgcm2 != null ? formatNumber(resultsB.finalPressure_kgcm2, 2) : "--"} kg/cm2</span></p>
                      <p>Puntos criticos: <span className="font-mono font-semibold">{resultsB.pointsCritical}</span></p>
                      <p>Puntos bajo Pmin: <span className="font-mono font-semibold">{resultsB.pointsBelowMin}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile chart */}
              {chartData.length >= 2 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-xs font-semibold text-gray-500 mb-3">Perfil del terreno + Linea piezometrica</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="dist" type="number" tick={{ fontSize: 10 }} label={{ value: "Cadenamiento (m)", position: "bottom", fontSize: 10 }} />
                      <YAxis domain={yDomain} allowDataOverflow tick={{ fontSize: 10 }} label={{ value: "Elevacion (m)", angle: -90, position: "insideLeft", fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [v?.toFixed(2), ""]} labelFormatter={(l) => `Cadenam: ${l} m`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="Terreno" stroke="#8B7355" fill="#D2B48C" fillOpacity={0.3} strokeWidth={2} baseValue="dataMin" />
                      <Line type="monotone" dataKey="Piezometrica A" stroke="#1C3D5A" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="8 4" />
                      {showScenarioB && resultsB && (
                        <Line type="monotone" dataKey="Piezometrica B" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 4" />
                      )}
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
                        <th className="px-2 py-2 text-right">Cadenam. (m)</th>
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
                            {p.exceedsPN && <span className="ml-1 text-[9px] text-red-600 font-bold">{"⚠ PN"}</span>}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-gray-400">{formatNumber(p.hfAccum, 2)}</td>
                          <td className="px-2 py-1.5 text-center" style={{ color: tramoColors[p.tramoIndex % tramoColors.length] }}>{p.DN_mm}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{p.V != null ? formatNumber(p.V, 2) : "--"}</td>
                          <td className="px-2 py-1.5 text-center">
                            {p.exceedsPN ? <span className="text-red-600" title="Excede PN de la tuberia">{"✗"}</span>
                              : p.status === "ok" ? <span className="text-green-600">{"✓"}</span>
                              : p.status === "low" ? <span className="text-yellow-600">{"⚠"}</span>
                              : <span className="text-red-600">{"✗"}</span>}
                          </td>
                          <td className="px-2 py-1.5 text-gray-500 truncate max-w-[100px]">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 leading-relaxed">
                  <strong>Cadenam.</strong> = distancia desde el inicio (m). <strong>Cota</strong> = elevación del terreno (m.s.n.m.). <strong>Piezom.</strong> = línea piezométrica (nivel de energía del agua). <strong>P</strong> = presión disponible en ese punto. <strong>hf</strong> = pérdida por fricción acumulada. <strong>V</strong> = velocidad del agua. <strong>Estado</strong>: ✓ cumple, ⚠ presión baja, ✗ crítica.
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
