"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modules = [
  {
    href: "/tramo-simple",
    label: "Verificar presión",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ),
  },
  {
    href: "/en-serie",
    label: "Varios tramos",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h4m4 0h4m4 0h0M8 12a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
  },
  {
    href: "/golpe-ariete",
    label: "Golpe de ariete",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: "/bombeo",
    label: "Mi bomba",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4M4 12h4" />
      </svg>
    ),
  },
  {
    href: "/dimensionamiento",
    label: "Elegir diámetro",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    href: "/valvulas-aire",
    label: "Válvulas de aire",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ),
  },
  {
    href: "/vrp",
    label: "Valvula reductora",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
  },
  {
    href: "/proyectos",
    label: "Proyectos",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
];

export function HidroCalcSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#0F2438] text-white flex flex-col shrink-0 min-h-screen">
      {/* Logo */}
      <div className="px-3 py-5 border-b border-white/10">
        <Link href="/" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sigmaflow-full.jpg" alt="Sigma Flow" className="h-14 w-auto bg-white rounded-lg px-3 py-2 shadow-sm" />
        </Link>
        <div className="mt-3 px-1">
          <span className="text-sm font-semibold text-white/90 tracking-wide">HidroCalc</span>
          <span className="text-[10px] text-white/30 ml-1.5">v1.3</span>
        </div>
      </div>

      <div className="px-4 pt-5 pb-2">
        <span className="text-[10px] font-semibold text-white/30 tracking-widest uppercase">Módulos</span>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {modules.map((mod) => {
          const isActive = pathname === mod.href || pathname.startsWith(mod.href + "/");
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[#1C3D5A] text-white font-medium border-l-[3px] border-white/80 shadow-sm"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80 border-l-[3px] border-transparent"
              }`}
            >
              <span className="shrink-0 opacity-80">{mod.icon}</span>
              <span>{mod.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/20 leading-relaxed">
          Sigma Flow<br />Soluciones en Infraestructura Hidráulica
        </p>
      </div>
    </aside>
  );
}
