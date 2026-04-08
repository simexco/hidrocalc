import Link from "next/link";

const modules = [
  {
    title: "Tramo Simple",
    desc: "Verificación de presión, caudal máximo o diámetro recomendado para un tramo de tubería.",
    href: "/tramo-simple",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ),
  },
  {
    title: "Tuberías en Serie",
    desc: "Análisis en cascada para líneas con cambios de diámetro, material o pendiente.",
    href: "/en-serie",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h4m4 0h4m4 0h0M8 12a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
  },
  {
    title: "Golpe de Ariete",
    desc: "Sobrepresión transitoria por cierre de válvulas y recomendación de clase de tubería.",
    href: "/golpe-ariete",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Punto de Operación",
    desc: "Intersección de la curva del sistema con la curva de la bomba.",
    href: "/bombeo",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4M4 12h4" />
      </svg>
    ),
  },
  {
    title: "Dimensionamiento",
    desc: "Tabla comparativa de todos los diámetros estándar para seleccionar el óptimo.",
    href: "/dimensionamiento",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    title: "Mis Proyectos",
    desc: "Guardar, duplicar, exportar e importar cálculos realizados.",
    href: "/proyectos",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F2438] via-[#1C3D5A] to-[#1C3D5A] flex flex-col">
      {/* Header bar */}
      <div className="w-full border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white/40 text-xs tracking-widest uppercase font-medium">Herramienta de Ingeniería</span>
          <span className="text-white/30 text-xs">v1.2</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo — grande con presencia */}
        <div className="bg-white rounded-2xl px-10 py-6 shadow-2xl shadow-black/20 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sigmaflow-full.jpg"
            alt="Sigma Flow"
            className="h-20 md:h-28 w-auto"
          />
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl md:text-4xl font-light text-white tracking-[0.15em] uppercase mb-3 text-center">
          HidroCalc
        </h1>

        <div className="w-16 h-[1px] bg-white/25 mb-4" />

        <p className="text-white/60 text-center max-w-lg mb-2 text-sm leading-relaxed font-light">
          Calculadora hidráulica profesional para ingenieros en infraestructura de agua potable y alcantarillado
        </p>

        <p className="text-white/25 text-[11px] tracking-[0.2em] uppercase mb-14">
          Soluciones en Infraestructura Hidráulica
        </p>

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-12">
          {modules.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/25 transition-all group"
            >
              <div className="w-11 h-11 bg-white/10 text-white/70 rounded-lg flex items-center justify-center mb-3 group-hover:bg-white/20 group-hover:text-white transition-colors">
                {mod.icon}
              </div>
              <h3 className="font-heading font-semibold text-white text-sm mb-1.5">{mod.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{mod.desc}</p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/tramo-simple"
          className="bg-white text-[#1C3D5A] px-10 py-3.5 rounded-lg font-semibold hover:bg-white/90 transition-colors shadow-lg text-sm tracking-wide"
        >
          Iniciar cálculo
        </Link>
      </div>

      {/* Footer */}
      <div className="w-full border-t border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>HidroCalc by Sigma Flow &middot; Soluciones en Infraestructura Hidráulica</span>
          <span>Solo para uso técnico profesional</span>
        </div>
      </div>
    </div>
  );
}
