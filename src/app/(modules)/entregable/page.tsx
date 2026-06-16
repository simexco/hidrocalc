"use client";

import { useState } from "react";
import { InputField } from "@/components/ui/InputField";
import { ResetButton } from "@/components/ui/ResetButton";
import { MATERIALS, STANDARD_DNS_LABELED } from "@/lib/constants";
import { useProjectStore } from "@/store/projectStore";
import { computeReport, generateReportPDF, downloadReport, type ReportData, type ReportVertex, type ReportValve } from "@/lib/export/report-generator";

const num = (v: string) => (v === "" ? null : parseFloat(v));

export default function EntregablePage() {
  const { project: d, patch, reset } = useProjectStore();
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof ReportData>(key: K, value: ReportData[K]) => patch({ [key]: value } as Partial<ReportData>);
  const r = computeReport(d);

  // Vertices
  const addVertex = () => set("vertices", [...d.vertices, { cad: 0, cota: 0, desc: "" }]);
  const updVertex = (i: number, patch: Partial<ReportVertex>) => set("vertices", d.vertices.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const delVertex = (i: number) => set("vertices", d.vertices.filter((_, j) => j !== i));
  // Valvulas
  const addValve = () => set("valvulas", [...d.valvulas, { cad: "", tipo: "" }]);
  const updValve = (i: number, patch: Partial<ReportValve>) => set("valvulas", d.valvulas.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const delValve = (i: number) => set("valvulas", d.valvulas.filter((_, j) => j !== i));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const doc = await generateReportPDF(d);
      downloadReport(doc, `Reporte_${(d.proyecto || "predimensionamiento").replace(/\s+/g, "_")}_${d.folio || ""}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Error al generar el PDF. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Entregable {"—"} Reporte de predimensionamiento</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Captura los datos del proyecto y genera el reporte PDF de marca Sigma Flow.</p>
        </div>
        <div className="flex gap-2">
          <ResetButton moduleKey="hidrocalc-active-project" onReset={() => reset()} />
          <button onClick={handleGenerate} disabled={loading} className="text-sm bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors disabled:opacity-40 shadow-sm whitespace-nowrap">
            {loading ? "Generando..." : "Generar PDF"}
          </button>
        </div>
      </div>

      {/* Portada */}
      <Card title="Portada del reporte">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Nombre del proyecto" value={d.proyecto} onChange={(v) => set("proyecto", v)} type="text" />
          <InputField label="Localidad / Estado" value={d.localidad} onChange={(v) => set("localidad", v)} type="text" />
          <InputField label="Fecha" value={d.fecha} onChange={(v) => set("fecha", v)} type="text" placeholder="Junio 2026" />
          <InputField label="Folio" value={d.folio} onChange={(v) => set("folio", v)} type="text" placeholder="HCX-2026-001" />
          <InputField label="Elaboró" value={d.elaboro} onChange={(v) => set("elaboro", v)} type="text" placeholder="Ing. ..." />
        </div>
      </Card>

      {/* Modulo 1 */}
      <Card title="Hoja 1 — Demanda de agua">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label={d.proyectarCrecimiento ? "Población de diseño" : "Población"} value={d.poblacion} onChange={(v) => set("poblacion", num(v))} unit="hab" />
          <InputField label="Dotación" value={d.dotacion} onChange={(v) => set("dotacion", num(v))} unit="L/hab/día" />
          <InputField label="CMD" value={d.cmd} onChange={(v) => set("cmd", num(v))} tooltip="Coef. máximo diario (MAPAS: 1.2-1.5)" />
          <InputField label="CMH" value={d.cmh} onChange={(v) => set("cmh", num(v))} tooltip="Coef. máximo horario (MAPAS: 1.5-2.0)" />
          <InputField label="Horas equiv. tanque" value={d.horasTanque} onChange={(v) => set("horasTanque", num(v))} unit="h" tooltip="Coeficiente de regulación CONAGUA (horas equivalentes). V = Qmd × horas × 3.6" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={d.proyectarCrecimiento} onChange={(e) => set("proyectarCrecimiento", e.target.checked)} className="rounded border-gray-300" />
          Se proyectó crecimiento a futuro
        </label>
        {d.proyectarCrecimiento && (
          <InputField label="Periodo de diseño" value={d.periodoDiseno} onChange={(v) => set("periodoDiseno", num(v))} unit="años" />
        )}
        <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-lg px-3 py-2 text-xs text-[#1C3D5A] dark:text-blue-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <span>Qm: <strong>{r.qm != null ? r.qm.toFixed(2) : "—"} L/s</strong></span>
          <span>Qmd: <strong>{r.qmd != null ? r.qmd.toFixed(2) : "—"} L/s</strong></span>
          <span>Qmh: <strong>{r.qmh != null ? r.qmh.toFixed(2) : "—"} L/s</strong></span>
          <span>Tanque: <strong>{r.vtanque != null ? r.vtanque.toFixed(1) : "—"} m³</strong></span>
        </div>
      </Card>

      {/* Modulo 2 */}
      <Card title="Hoja 2 — Dimensionamiento de tubería">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="Gasto de diseño Q" value={d.q_ls} onChange={(v) => set("q_ls", num(v))} unit="L/s" tooltip="Normalmente el Qmd de la hoja 1" />
          <InputField label="Longitud L" value={d.longitud} onChange={(v) => set("longitud", num(v))} unit="m" />
          <InputField label="Desnivel (inicio-fin)" value={d.desnivel} onChange={(v) => set("desnivel", num(v))} unit="m" />
          <InputField label="Presión requerida final" value={d.presionRequerida} onChange={(v) => set("presionRequerida", num(v))} unit="m.c.a." />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
            <select value={d.material} onChange={(e) => set("material", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
              {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <InputField label="Coef. C (Hazen-Williams)" value={d.c} onChange={(v) => set("c", num(v))} tooltip="PVC/HDPE=150, HD=130, acero=120" />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Diámetro nominal</label>
            <select value={d.dn} onChange={(e) => set("dn", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
              <option value="">—</option>
              {STANDARD_DNS_LABELED.map((s) => <option key={s.dn} value={s.label}>{s.label}</option>)}
            </select>
          </div>
          <InputField label="Diámetro interior" value={d.diametroInterior} onChange={(v) => set("diametroInterior", num(v))} unit="mm" tooltip="Diámetro interno real para calcular la velocidad" />
          <InputField label="Clase / RD" value={d.clase} onChange={(v) => set("clase", v)} type="text" placeholder="RD-26" />
        </div>
        <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-lg px-3 py-2 text-xs text-[#1C3D5A] dark:text-blue-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <span>Velocidad: <strong>{r.velocidad != null ? r.velocidad.toFixed(2) : "—"} m/s</strong></span>
          <span>Hf: <strong>{r.hf != null ? r.hf.toFixed(2) : "—"} m</strong></span>
          <span>Pérdida total: <strong>{r.perdidaTotal != null ? r.perdidaTotal.toFixed(2) : "—"} m</strong></span>
          <span>P. final: <strong>{r.presionFinal != null ? r.presionFinal.toFixed(1) : "—"} m</strong></span>
        </div>

        {/* Perfil */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Perfil topográfico (cadenamiento, cota, descripción)</label>
            <button onClick={addVertex} className="text-xs bg-[#1C3D5A] text-white px-2 py-1 rounded hover:bg-[#0F2438]">+ Punto</button>
          </div>
          {d.vertices.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="number" value={v.cad} onChange={(e) => updVertex(i, { cad: parseFloat(e.target.value) || 0 })} placeholder="m" className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
              <input type="number" value={v.cota} onChange={(e) => updVertex(i, { cota: parseFloat(e.target.value) || 0 })} placeholder="cota" className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
              <input type="text" value={v.desc} onChange={(e) => updVertex(i, { desc: e.target.value })} placeholder="descripción" className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
              <button onClick={() => delVertex(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>

        {/* Valvulas */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Válvulas / accesorios por ubicación</label>
            <button onClick={addValve} className="text-xs bg-[#1C3D5A] text-white px-2 py-1 rounded hover:bg-[#0F2438]">+ Válvula</button>
          </div>
          {d.valvulas.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={v.cad} onChange={(e) => updValve(i, { cad: e.target.value })} placeholder="Km 0+450" className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
              <input type="text" value={v.tipo} onChange={(e) => updValve(i, { tipo: e.target.value })} placeholder="VAEA (punto alto)" className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white" />
              <button onClick={() => delValve(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Modulo 3 */}
      <Card title="Hoja 3 — Equipo de bombeo">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={d.incluyeBombeo} onChange={(e) => set("incluyeBombeo", e.target.checked)} className="rounded border-gray-300" />
          Incluir hoja de bombeo (si la línea es por bombeo, no por gravedad)
        </label>
        {d.incluyeBombeo && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InputField label="Carga estática He" value={d.he} onChange={(v) => set("he", num(v))} unit="m" tooltip="Diferencia de cotas entre succión y descarga" />
              <InputField label="Eficiencia del equipo" value={d.eficiencia} onChange={(v) => set("eficiencia", num(v))} unit="%" />
            </div>
            <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 rounded-lg px-3 py-2 text-xs text-[#1C3D5A] dark:text-blue-300 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <span>CDT: <strong>{r.cdt != null ? r.cdt.toFixed(1) : "—"} m</strong></span>
              <span>Potencia: <strong>~{r.hp != null ? r.hp.toFixed(1) : "—"} HP</strong></span>
              <span>Q: <strong>{r.qm3h != null ? r.qm3h.toFixed(1) : "—"} m³/h</strong></span>
            </div>
          </>
        )}
      </Card>

      <p className="text-[10px] text-gray-400 text-center pb-4">
        El reporte se genera con criterios MAPAS (CONAGUA). Documento sin carácter oficial: no sustituye al proyecto ejecutivo.
      </p>
    </div>
  );
}
