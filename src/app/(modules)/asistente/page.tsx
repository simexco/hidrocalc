"use client";

import Link from "next/link";
import { InputField } from "@/components/ui/InputField";
import { useProjectStore } from "@/store/projectStore";
import { clearAllFormState } from "@/lib/storage/form-persistence";
import { computeReport } from "@/lib/export/report-generator";

interface Step {
  n: number;
  title: string;
  desc: string;
  href: string;
  done: boolean | null; // null = sin verificacion automatica
  summary: string;
}

export default function AsistentePage() {
  const { project: p, patch, reset } = useProjectStore();
  const r = computeReport(p);

  const handleNuevoProyecto = () => {
    if (!confirm("¿Empezar un proyecto nuevo? Se borrarán TODOS los datos de todos los pasos (gasto, conducción, válvulas, despiece y reporte).")) return;
    clearAllFormState();
    reset();
    // Recargar para que todas las paginas re-inicien limpias
    window.location.reload();
  };

  const gastoDone = p.poblacion != null && p.dotacion != null && p.q_ls != null;
  const condDone = !!p.material && !!p.dn && p.diametroInterior != null && p.longitud != null;
  const perfilDone = p.vertices.filter((v) => v.cad != null && v.cota != null).length >= 2;
  const valvDone = p.valvulas.filter((v) => v.cad || v.tipo).length > 0;
  const bombeoDone = p.incluyeBombeo ? p.he != null : null;

  const vrpRecomendada = p.presionMaxLinea != null && p.pnLinea != null && p.presionMaxLinea > p.pnLinea;
  const steps: Step[] = [
    { n: 1, title: "Cálculo de gasto", desc: "Demanda de agua: población, dotación → Qmd.", href: "/demanda", done: gastoDone, summary: r.qmd != null ? `Qmd ${r.qmd.toFixed(2)} L/s` : "Pendiente" },
    { n: 2, title: "Línea de conducción", desc: "Caudal, material, diámetro del tubo, longitud, perfil y presiones.", href: "/perfil", done: condDone, summary: condDone ? `${p.material} ${p.dn} · ${p.longitud} m` : "Pendiente" },
    { n: 3, title: "Diámetro económico", desc: "Si la línea es por bombeo: CDT y diámetro económico.", href: "/impulsion", done: bombeoDone, summary: p.incluyeBombeo ? (p.he != null ? `He ${p.he} m` : "Pendiente") : "Opcional (solo bombeo)" },
    { n: 4, title: "Golpe de ariete", desc: "¿La tubería resiste el golpe? Si no, válvula de protección.", href: "/golpe-ariete", done: null, summary: "Protección contra sobrepresión / vacío" },
    { n: 5, title: "Válvula reductora (VRP)", desc: "Si la presión excede la clase del tubo: reducir presión.", href: "/vrp", done: null, summary: vrpRecomendada ? "Recomendada (presión alta)" : "Revisar si aplica" },
    { n: 6, title: "Válvulas de aire", desc: "Ubicación de ventosas, seccionamiento y desfogue.", href: "/valvulas-aire", done: valvDone, summary: valvDone ? `${p.valvulas.length} válvulas/accesorios` : "Pendiente" },
    { n: 7, title: "Cálculo de lista de materiales (despiece)", desc: "Lista de materiales y accesorios con SKU Sigma Flow.", href: "/despiece", done: null, summary: "Arma la lista por tramo" },
    { n: 8, title: "Generar reporte", desc: "Reporte PDF consolidado de marca Sigma Flow.", href: "/entregable", done: null, summary: "Documento final" },
  ];

  const nextStep = steps.find((s) => s.done === false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Asistente de proyecto</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pon el nombre del proyecto y empieza por el paso 1. Dentro de cada paso tendrás un botón &quot;Siguiente&quot; para avanzar hasta el reporte.</p>
        </div>
        <button onClick={handleNuevoProyecto} className="text-xs border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap">
          Nuevo proyecto (borrar todo)
        </button>
      </div>

      {/* Datos del proyecto */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">Proyecto activo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="Nombre del proyecto" value={p.proyecto} onChange={(v) => patch({ proyecto: v })} type="text" />
          <InputField label="Localidad / Estado" value={p.localidad} onChange={(v) => patch({ localidad: v })} type="text" />
          <InputField label="Folio" value={p.folio} onChange={(v) => patch({ folio: v })} type="text" placeholder="HCX-2026-001" />
        </div>
      </div>

      <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 border border-[#1C3D5A]/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-sm text-[#1C3D5A] dark:text-blue-200">
          {nextStep ? <>Siguiente paso: <strong>{nextStep.title}</strong></> : <>Todos los pasos listos. Ya puedes generar el reporte.</>}
        </span>
        <Link href={nextStep ? nextStep.href : "/entregable"} className="text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors whitespace-nowrap font-medium">
          {nextStep ? (steps[0].n === nextStep.n ? "Comenzar →" : "Continuar →") : "Generar reporte →"}
        </Link>
      </div>

      {/* Stepper */}
      <div className="space-y-3">
        {steps.map((s) => (
          <Link
            key={s.n}
            href={s.href}
            className={`flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all hover:shadow-sm ${
              s.done === true ? "border-green-300 dark:border-green-800" : nextStep?.n === s.n ? "border-[#1C3D5A]/40 ring-1 ring-[#1C3D5A]/20" : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              s.done === true ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-[#1C3D5A]/10 text-[#1C3D5A] dark:bg-blue-900/30 dark:text-blue-300"
            }`}>
              {s.done === true ? "✓" : s.n}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.title}</h3>
                {s.done === true && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Listo</span>}
                {s.done === false && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pendiente</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-medium text-[#1C3D5A] dark:text-blue-300">{s.summary}</p>
              <span className="text-[10px] text-gray-400">Abrir →</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 text-center pb-4">
        Puedes entrar a cualquier paso por separado desde el menú. El reporte se arma con lo que captures en el proyecto activo.
      </p>
    </div>
  );
}
