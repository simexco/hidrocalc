"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const moduleNames: Record<string, string> = {
  "/tramo-simple": "Análisis de Tramo Simple",
  "/en-serie": "Tuberías en Serie",
  "/golpe-ariete": "Golpe de Ariete",
  "/bombeo": "Punto de Operación de Bomba",
  "/dimensionamiento": "Dimensionamiento de Tubería",
  "/proyectos": "Mis Proyectos",
};

export function HidroCalcHeader() {
  const pathname = usePathname();
  const moduleName = Object.entries(moduleNames).find(([path]) => pathname.startsWith(path))?.[1] || "";

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm" style={{ height: 56 }}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-[#1C3D5A]/40 hover:text-[#1C3D5A] transition-colors font-medium">
            HidroCalc
          </Link>
          {moduleName && (
            <>
              <span className="text-gray-300">/</span>
              <h1 className="text-sm font-semibold text-[#1C3D5A] tracking-wide">{moduleName}</h1>
            </>
          )}
        </div>
        <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Solo uso técnico</span>
      </div>
    </header>
  );
}
