import Link from "next/link";

const iconCls = "w-7 h-7";
const modules = [
  // ── Flujo de proyecto ──
  {
    title: "Asistente de proyecto",
    desc: "Guía paso a paso: gasto → conducción → válvulas → cruceros → reporte. Los datos avanzan solos.",
    href: "/asistente",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>),
  },
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
    title: "Conversor de unidades",
    desc: "Presión, caudal, diámetro, área, volumen, temperatura y más — conversiones comunes en agua.",
    href: "/conversor",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m4 6H4m0 0l4 4m-4-4l4-4" /></svg>),
  },
  {
    title: "Equipo de bombeo",
    desc: "CDT y potencia comercial (HP) para cotizar la bomba: pozo → tanque o tanque → red, con equipos en paralelo.",
    href: "/equipo-bombeo",
    icon: (<svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4M4 12h4" /></svg>),
  },
  {
    title: "Generador de cruceros",
    desc: "Arma tus cruceros pieza por pieza con símbolos de plano; la lista de materiales (despiece) con SKU Sigma Flow se genera sola.",
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
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1D2E] via-[#12293F] to-[#1C3D5A] flex flex-col">
      {/* Header bar */}
      <div className="w-full border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sigmaflow-full.jpg" alt="Sigma Flow" className="h-8 w-auto bg-white rounded-md px-2 py-1" />
            <span className="text-white/40 text-[10px] tracking-widest uppercase font-semibold hidden sm:inline">Plataforma de Ingeniería Hidráulica</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="text-white/30 text-xs">v2.0</span>
            <Link href="/cuenta" className="text-xs font-semibold text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/20 transition-colors">Iniciar sesión / Crear cuenta</Link>
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="max-w-6xl mx-auto w-full px-6 pt-14 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#7FC4E8] font-bold mb-4">Sigma Flow · Ingeniería Hidráulica</p>
          <h1 className="font-heading text-4xl md:text-[44px] leading-[1.08] font-extrabold text-white mb-5">
            Del cálculo de gasto<br />al despiece del crucero,<br />
            <span className="text-[#7FC4E8]">en una sola plataforma.</span>
          </h1>
          <p className="text-white/60 text-[15px] leading-relaxed mb-7 max-w-md">
            Diseña líneas de conducción, dimensiona bombas y válvulas, arma cruceros con símbolos de plano y entrega un reporte PDF listo para cotizar — con criterios CONAGUA y el catálogo Sigma Flow integrado.
          </p>
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <Link href="/asistente" className="bg-white text-[#1C3D5A] px-7 py-3 rounded-xl font-bold hover:bg-white/90 transition-colors shadow-xl shadow-black/20 text-sm">
              Empezar un proyecto →
            </Link>
            <Link href="/cuenta" className="border border-white/25 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
              Crear cuenta gratis
            </Link>
          </div>
          <p className="text-[11px] text-white/35">
            Criterios MAPAS (CONAGUA) · Reportes con tu folio · Proyectos guardados en la nube · Sin costo
          </p>
        </div>

        {/* Visual del producto (dibujado, nítido a cualquier tamaño) */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0B1D2E] shadow-2xl shadow-black/40 overflow-hidden">
          <svg viewBox="0 0 560 388" className="w-full block">
            <defs>
              <linearGradient id="hTer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8FA977" /><stop offset="22%" stopColor="#8A7654" /><stop offset="100%" stopColor="#3A3227" />
              </linearGradient>
              <linearGradient id="hAgua" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" /><stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.08" />
              </linearGradient>
              <filter id="hGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* barra de ventana */}
            <rect x="0" y="0" width="560" height="30" fill="#0F2438" />
            <circle cx="18" cy="15" r="4.5" fill="#E2655A" /><circle cx="34" cy="15" r="4.5" fill="#E0A63F" /><circle cx="50" cy="15" r="4.5" fill="#5FB86A" />
            <text x="72" y="19" fontSize="11" fill="#7F98AC" fontWeight="600">Línea de conducción — El Roble · 6&quot; PVC Inglés RD 26</text>
            {/* gráfica: columna de agua + terreno + piezométrica */}
            <polygon points="16,84 544,152 544,238 16,238" fill="url(#hAgua)" />
            <polygon points="16,196 120,128 210,158 306,98 408,146 544,176 544,238 16,238" fill="url(#hTer)" stroke="#4E4234" strokeWidth="2" />
            <path d="M16 84 L544 152" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" filter="url(#hGlow)" />
            <circle cx="16" cy="84" r="4" fill="#0EA5E9" /><circle cx="544" cy="152" r="4" fill="#0EA5E9" />
            {/* ventosa en el punto alto */}
            <line x1="306" y1="98" x2="306" y2="76" stroke="#7FC4E8" strokeWidth="2" />
            <circle cx="306" cy="70" r="6" fill="#0B1D2E" stroke="#7FC4E8" strokeWidth="2" />
            <text x="318" y="74" fontSize="10.5" fill="#7FC4E8" fontWeight="700">VA-C 2&quot;</text>
            {/* chip de resultado */}
            <rect x="398" y="52" width="140" height="40" rx="8" fill="#1C3D5A" stroke="#ffffff22" />
            <text x="468" y="69" textAnchor="middle" fontSize="11.5" fill="#fff" fontWeight="700">P1 requerida: 3.2 kg/cm²</text>
            <text x="468" y="84" textAnchor="middle" fontSize="10" fill="#9FC3DD">v = 1.42 m/s · hf = 8.6 m</text>
            {/* franja: generador de cruceros */}
            <rect x="16" y="256" width="528" height="116" rx="12" fill="#0F2438" stroke="#ffffff14" />
            <text x="32" y="280" fontSize="11" fill="#7F98AC" fontWeight="700">GENERADOR DE CRUCEROS</text>
            <g stroke="#7FC4E8" strokeWidth="2.4" strokeLinecap="round" fill="none">
              <line x1="40" y1="322" x2="96" y2="322" />
              <line x1="60" y1="312" x2="60" y2="332" /><line x1="66" y1="312" x2="66" y2="332" />
              <path d="M100 310 L100 334 L118 322 Z" /><path d="M136 310 L136 334 L118 322 Z" />
              <line x1="140" y1="322" x2="196" y2="322" />
              <line x1="166" y1="312" x2="166" y2="332" /><line x1="172" y1="312" x2="172" y2="332" />
              <line x1="196" y1="322" x2="252" y2="322" /><line x1="224" y1="322" x2="224" y2="348" />
              <line x1="214" y1="348" x2="234" y2="348" />
            </g>
            <g fontSize="10" fontWeight="600">
              <rect x="292" y="298" width="112" height="22" rx="6" fill="#16324B" /><text x="348" y="313" textAnchor="middle" fill="#9FC3DD">VI-VFF-6 · ×2</text>
              <rect x="292" y="326" width="112" height="22" rx="6" fill="#16324B" /><text x="348" y="341" textAnchor="middle" fill="#9FC3DD">CI-ABU-6159184</text>
              <rect x="414" y="298" width="112" height="22" rx="6" fill="#16324B" /><text x="470" y="313" textAnchor="middle" fill="#9FC3DD">Caja tipo 8</text>
              <rect x="414" y="326" width="112" height="22" rx="6" fill="#1C4D36" /><text x="470" y="341" textAnchor="middle" fill="#7FE8A8">Lista → Reporte PDF</text>
            </g>
          </svg>
        </div>
      </div>

      {/* ── Números ── */}
      <div className="w-full border-y border-white/10 bg-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { n: "13", t: "módulos de cálculo" },
            { n: "8", t: "pasos guiados de proyecto" },
            { n: "SKU", t: "catálogo Sigma Flow integrado" },
            { n: "PDF", t: "reporte listo para cotizar" },
          ].map((s) => (
            <div key={s.t}>
              <p className="text-2xl font-extrabold text-[#7FC4E8]">{s.n}</p>
              <p className="text-[11px] text-white/45 mt-0.5">{s.t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flujo como historia ── */}
      <div className="max-w-6xl mx-auto w-full px-6 pt-12 pb-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Un flujo que piensa como tú proyectas</h2>
        <p className="text-xs text-white/40 mb-6">Los datos avanzan solos de un paso al siguiente — sin recapturar nada</p>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          {["Gasto", "Línea de conducción", "Equipo de bombeo", "Golpe de ariete", "VRP", "Válvulas de aire", "Cruceros", "Reporte PDF"].map((p, i, arr) => (
            <span key={p} className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white/80 bg-white/[0.07] border border-white/10 rounded-full px-3 py-1.5">{p}</span>
              {i < arr.length - 1 && <span className="text-[#7FC4E8]/50 text-xs">→</span>}
            </span>
          ))}
        </div>
        <Link href="/asistente" className="text-xs text-[#7FC4E8] hover:text-white transition-colors underline decoration-dotted">Ver el asistente de proyecto →</Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12">
        <h2 className="text-xl font-bold text-white mb-1">Todos los módulos</h2>
        <p className="text-xs text-white/40 mb-8">Úsalos en el flujo guiado o de forma independiente</p>

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-12">
          {modules.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/25 hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-11 h-11 bg-white/10 text-white/70 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#7FC4E8]/20 group-hover:text-[#7FC4E8] transition-colors">
                {mod.icon}
              </div>
              <h3 className="font-heading font-semibold text-white text-sm mb-1.5">{mod.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{mod.desc}</p>
            </Link>
          ))}
        </div>

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
          <span>Sigma Flow &middot; Plataforma de Ingeniería Hidráulica &middot; Soluciones en Infraestructura Hidráulica</span>
          <span>Solo para uso técnico profesional</span>
        </div>
      </div>
    </div>
  );
}
