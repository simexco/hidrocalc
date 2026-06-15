import Link from "next/link";

const iconCls = "w-7 h-7";
const modules = [
  // ── Diseño ──
  {
    title: "Cálculo de gasto",
    desc: "Caudal de diseño por población, viviendas o superficie. Incluye tanque de regulación.",
    href: "/demanda",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  },
  // ── Conducción ──
  {
    title: "Cálculo de diámetro económico",
    desc: "Diámetro económico (Bresse), CDT, potencia de bomba y costo de energía.",
    href: "/impulsion",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>),
  },
  {
    title: "Línea de conducción",
    desc: "Perfil topográfico, tramos con diferente DN/material, presiones y materiales SIMEX.",
    href: "/perfil",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 20l4-8 3 4 4-12 3 6 4-4" /></svg>),
  },
  // ── Herramientas ──
  {
    title: "Elegir diámetro",
    desc: "Compara todos los diámetros estándar y encuentra el óptimo.",
    href: "/dimensionamiento",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>),
  },
  {
    title: "Verificar presión",
    desc: "Presión de salida, caudal máximo o diámetro recomendado para un tramo.",
    href: "/tramo-simple",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>),
  },
  {
    title: "Despiece de tramo",
    desc: "Lista de materiales y accesorios con SKU Sigma Flow. Exporta a Excel y PDF.",
    href: "/despiece",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>),
  },
  // ── Protección y control ──
  {
    title: "Válvulas de aire",
    desc: "Ubicación y dimensionamiento en los puntos críticos de la línea.",
    href: "/valvulas-aire",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>),
  },
  {
    title: "Golpe de ariete",
    desc: "Sobrepresión por cierre de válvulas y clase de tubería requerida.",
    href: "/golpe-ariete",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
  },
  {
    title: "Válvula reductora",
    desc: "Selecciona el tamaño correcto de VRP para tu línea.",
    href: "/vrp",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>),
  },
  // ── Entregables ──
  {
    title: "Reporte de proyecto",
    desc: "Genera el reporte PDF de predimensionamiento (demanda, conducción, bombeo y guía) de marca Sigma Flow.",
    href: "/entregable",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M9 13h6m-6 4h6" /></svg>),
  },
  {
    title: "Mis proyectos",
    desc: "Guarda, organiza y exporta todos tus cálculos.",
    href: "/proyectos",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F2438] via-[#1C3D5A] to-[#1C3D5A] flex flex-col">
      {/* Header bar */}
      <div className="w-full border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white/40 text-xs tracking-widest uppercase font-medium">Herramienta de Ingeniería</span>
          <span className="text-white/30 text-xs">v1.3</span>
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
          className="bg-white text-[#1C3D5A] px-10 py-3.5 rounded-lg font-semibold hover:bg-white/90 transition-colors shadow-lg text-sm tracking-wide mb-16"
        >
          Iniciar cálculo
        </Link>

        {/* Decision guide */}
        <div className="max-w-4xl w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-lg font-semibold text-white mb-1 text-center">Que módulo necesito?</h2>
          <p className="text-xs text-white/40 text-center mb-6">Selecciona segun tu situacion</p>
          <div className="space-y-3">
            {[
              { situation: "No se cuanto caudal necesito para mi proyecto", module: "Calculo de gasto", data: "Poblacion o viviendas, tipo, clima", href: "/demanda" },
              { situation: "¿La presión llega al final de mi tubería?", module: "Verificar presión (Modo A)", data: "Q, DN, L, P1", href: "/tramo-simple" },
              { situation: "¿Cuánto caudal puede pasar sin bajar la presión?", module: "Verificar presión (Modo B)", data: "DN, L, P1, P2 mínima", href: "/tramo-simple" },
              { situation: "No sé qué diámetro usar para mi caudal", module: "Elegir diámetro", data: "Q, L, P1", href: "/dimensionamiento" },
              { situation: "Mi linea cambia de diametro o material en el trayecto", module: "Linea de conduccion", data: "Q, P1, perfil topografico, tramos", href: "/perfil" },
              { situation: "¿Qué clase de tubería aguanta el golpe de cierre de una válvula?", module: "Golpe de ariete", data: "V0, D interno, espesor, material, Tc", href: "/golpe-ariete" },
              { situation: "¿Dónde pongo las válvulas de aire en mi línea?", module: "Válvulas de aire", data: "Q, DN, perfil de cotas", href: "/valvulas-aire" },
              { situation: "Quiero ver si la presion llega a lo largo de todo el trazo", module: "Linea de conduccion", data: "Q, DN, P1, perfil topografico", href: "/perfil" },
              { situation: "Necesito reducir la presion en una zona de mi red", module: "Valvula reductora", data: "Q, P1, P2, DN", href: "/vrp" },
              { situation: "¿Que volumen de tanque necesito para regular el suministro?", module: "Calculo de gasto", data: "Qmd, coef. regulacion", href: "/demanda" },
            ].map((r) => (
              <Link key={r.module} href={r.href} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-4 py-3 transition-colors group">
                <p className="text-sm text-white/80 flex-1 group-hover:text-white">{r.situation}</p>
                <span className="text-xs font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded whitespace-nowrap">{r.module}</span>
                <span className="text-[10px] text-white/30 whitespace-nowrap hidden md:block">{r.data}</span>
              </Link>
            ))}
          </div>
          <p className="text-[10px] text-white/20 text-center mt-4">
            Los campos marcados con * son obligatorios. Los demas tienen valores por defecto que permiten calcular con datos parciales.
          </p>
        </div>
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
