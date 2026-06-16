"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAllFormState } from "@/lib/storage/form-persistence";
import { useProjectStore } from "@/store/projectStore";

// Orden del flujo de proyecto (asistente)
const FLOW = [
  { href: "/demanda", label: "Cálculo de gasto" },
  { href: "/perfil", label: "Línea de conducción" },
  { href: "/impulsion", label: "Diámetro económico" },
  { href: "/despiece", label: "Despiece" },
  { href: "/valvulas-aire", label: "Válvulas de aire" },
  { href: "/entregable", label: "Reporte" },
];

export function FlowNav() {
  const pathname = usePathname();
  const idx = FLOW.findIndex((s) => pathname === s.href || pathname.startsWith(s.href + "/"));
  if (idx === -1) return null; // solo en los pasos del flujo

  const prev = idx > 0 ? FLOW[idx - 1] : null;
  const next = idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const step = FLOW[idx];

  const nuevoProyecto = () => {
    if (!confirm("¿Empezar un proyecto nuevo? Se borrarán TODOS los datos de todos los pasos.")) return;
    clearAllFormState();
    useProjectStore.getState().reset();
    window.location.reload();
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/asistente" className="text-[11px] text-[#1C3D5A] dark:text-blue-300 hover:underline shrink-0">
          ← Asistente
        </Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="text-[11px] text-gray-400 shrink-0">Paso {idx + 1} de {FLOW.length}</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{step.label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={nuevoProyecto} className="text-[11px] px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap" title="Borrar todos los datos y empezar de cero">
          ↺ Nuevo
        </button>
        {prev && (
          <Link href={prev.href} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap">
            ← Anterior
          </Link>
        )}
        {next ? (
          <Link href={next.href} className="text-[11px] px-3 py-1.5 rounded-lg bg-[#1C3D5A] text-white hover:bg-[#0F2438] transition-colors whitespace-nowrap font-medium">
            Siguiente: {next.label} →
          </Link>
        ) : (
          <span className="text-[11px] px-3 py-1.5 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 whitespace-nowrap font-medium">
            Último paso — genera el PDF abajo
          </span>
        )}
      </div>
    </div>
  );
}
