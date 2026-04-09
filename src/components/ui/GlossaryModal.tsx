"use client";

import { useState } from "react";

const GLOSSARY = [
  { term: "C (Coeficiente Hazen-Williams)", def: "Número adimensional que representa la rugosidad interior del tubo. Mayor C = superficie mas lisa = menos pérdida de carga. Rango: 100 (muy rugosa) a 150 (PVC nuevo)." },
  { term: "Celeridad de onda (a)", def: "Velocidad a la que viaja la onda de presión por la tubería ante un cambio brusco de flujo. Depende del módulo elástico del material y del diametro/espesor. Unidades: m/s. Rango típico: 200-1400 m/s." },
  { term: "Cota (z)", def: "Elevacion de un punto sobre el nivel del mar, en metros (m.s.n.m.). Se usa para calcular la componente de energia potencial en la ecuación de Bernoulli." },
  { term: "DR / SDR", def: "Relacion entre el diámetro exterior y el espesor de pared: DR = OD / e. A menor DR, mayor espesor y mayor capacidad de presión. Ej: DR 18 aguanta mas que DR 25." },
  { term: "Gradiente hidráulico (J)", def: "Perdida de carga por unidad de longitud: J = hf / L. Se expresa en m/km. Criterio NOM-001-CONAGUA: óptimo < 5 m/km, maximo 10 m/km." },
  { term: "Hazen-Williams", def: "Formula empírica para calcular pérdidas por fricción en tuberías de agua a presión. Valida para agua limpia a temperatura ambiente y flujo turbulento (V > 0.3 m/s)." },
  { term: "hf (Perdida por fricción)", def: "Energia que pierde el fluido al vencer la resistencia por fricción en la longitud del tubo. Unidades: metros de columna de agua." },
  { term: "hm (Perdida por accesorios)", def: "Energia que pierde el fluido al pasar por accesorios (codos, válvulas, tees, etc.). Se calcula como hm = K x V2/2g." },
  { term: "kg/cm2", def: "Unidad de presión comun en Mexico. 1 kg/cm2 = 10 m.c.a. = 98 kPa = 0.98 bar = 14.2 psi." },
  { term: "m.c.a.", def: "Metros de columna de agua. Unidad de presión que representa la altura de una columna de agua. 10 m.c.a. = 1 kg/cm2." },
  { term: "m.s.n.m.", def: "Metros sobre el nivel del mar. Unidad de elevacion topografica para cotas." },
  { term: "OD (Diámetro Exterior)", def: "Diámetro exterior real del tubo en mm. El DN es referencia comercial, no el OD real. Siempre verificar con ficha tecnica." },
  { term: "Perdida de carga", def: "Energia que pierde el fluido. hf = por fricción, hm = por accesorios. Total = hf + hm. Unidades: m.c.a." },
  { term: "PN (Presión Nominal)", def: "Presión maxima de trabajo del tubo a temperatura de referencia (20 C). En bar. PN 10 = maximo 10 bar." },
  { term: "Punto de operación", def: "Caudal y altura reales a los que trabaja la bomba. Es la interseccion de la curva de la bomba y la curva del sistema." },
  { term: "Tc (Tiempo de cierre)", def: "Tiempo en segundos que tarda una válvula en cerrarse. Tc < T_fase = cierre brusco (Joukowsky). Tc >= T_fase = cierre lento (Michaud)." },
  { term: "Velocidad (V)", def: "Velocidad media del agua en el tubo. V = Q / A. Criterio NOM: 0.3 <= V <= 2.5 m/s. Menor = sedimentación. Mayor = erosión." },
];

export function GlossaryButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? GLOSSARY.filter((g) => g.term.toLowerCase().includes(search.toLowerCase()) || g.def.toLowerCase().includes(search.toLowerCase()))
    : GLOSSARY;

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[10px] text-gray-400 hover:text-[#1C3D5A] transition-colors">
        Glosario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#1C3D5A] px-5 py-3 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-sm font-semibold text-white">Glosario</h2>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg">&times;</button>
            </div>
            <div className="sticky top-[44px] bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700 z-10">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar termino..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1C3D5A]"
              />
            </div>
            <div className="p-4 space-y-3">
              {filtered.map((g) => (
                <div key={g.term} className="border-b border-gray-50 dark:border-gray-700 pb-2">
                  <dt className="text-xs font-bold text-[#1C3D5A] dark:text-blue-300">{g.term}</dt>
                  <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{g.def}</dd>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No se encontraron resultados</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
