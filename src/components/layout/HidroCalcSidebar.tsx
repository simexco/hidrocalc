"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Iconos
const icons = {
  gasto: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  fuente: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6m0 0l-3-3m3 3l3-3M6 13h12v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6z" />,
  tanque: <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v16H5V4zm0 5h14M8 13h8" />,
  conduccion: <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l4-8 3 4 4-12 3 6 4-4" />,
  impulsion: <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />,
  bomba: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4M4 12h4" />,
  diametro: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />,
  presion: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />,
  golpe: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
  aire: <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />,
  vrp: <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />,
  proyectos: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>{children}</svg>
);

// Módulos agrupados por etapa del proyecto (sigue el flujo del agua)
const sections = [
  {
    title: "Diseño",
    items: [
      { href: "/demanda", label: "Cálculo de gasto", icon: icons.gasto },
    ],
  },
  {
    title: "Conducción",
    items: [
      { href: "/impulsion", label: "Diámetro económico", icon: icons.impulsion },
      { href: "/perfil", label: "Línea de conducción", icon: icons.conduccion },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/dimensionamiento", label: "Elegir diámetro", icon: icons.diametro },
      { href: "/tramo-simple", label: "Verificar presión", icon: icons.presion },
    ],
  },
  {
    title: "Protección y control",
    items: [
      { href: "/valvulas-aire", label: "Válvulas de aire", icon: icons.aire },
      { href: "/golpe-ariete", label: "Golpe de ariete", icon: icons.golpe },
      { href: "/vrp", label: "Válvula reductora", icon: icons.vrp },
    ],
  },
  {
    title: "",
    items: [
      { href: "/proyectos", label: "Proyectos", icon: icons.proyectos },
    ],
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
          <span className="text-[10px] text-white/30 ml-1.5">v1.4</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-white/30 tracking-widest uppercase">{section.title}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((mod) => {
                const isActive = pathname === mod.href || pathname.startsWith(mod.href + "/");
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-[#1C3D5A] text-white font-medium border-l-[3px] border-white/80 shadow-sm"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80 border-l-[3px] border-transparent"
                    }`}
                  >
                    <span className="shrink-0 opacity-80"><Icon>{mod.icon}</Icon></span>
                    <span>{mod.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/20 leading-relaxed">
          Sigma Flow<br />Soluciones en Infraestructura Hidráulica
        </p>
      </div>
    </aside>
  );
}
