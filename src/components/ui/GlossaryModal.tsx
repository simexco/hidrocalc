"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

/* ════════════════════════════════════════
   Diccionario "para todos": cada término explicado en lenguaje llano,
   con analogías. Organizado por temas para quien apenas empieza.
   ════════════════════════════════════════ */

const GLOSSARY: { cat: string; items: { term: string; def: string }[] }[] = [
  {
    cat: "El terreno",
    items: [
      { term: "Cota", def: "Qué tan alto está un punto del terreno sobre el nivel del mar, en metros (m.s.n.m.). Piensa en el \"piso\" donde está cada punto: la cota 1,550 está 50 m más arriba que la 1,500. El agua siempre quiere irse de cotas altas a cotas bajas — de eso vive una línea por gravedad." },
      { term: "Cadenamiento", def: "A cuántos metros del INICIO de la línea está un punto, medidos sobre el trazo — como los kilómetros de una carretera (el \"km 0+500\"). Cada punto del perfil se captura como cadenamiento + cota." },
      { term: "Perfil topográfico", def: "La \"radiografía\" del terreno por donde va la tubería: la lista de puntos (cadenamiento, cota). Con él la app ve dónde hay lomas y barrancas, y calcula la presión en cada punto del recorrido." },
      { term: "m.s.n.m.", def: "Metros sobre el nivel del mar. Es la unidad de las cotas. Las puedes sacar de un levantamiento topográfico o de Google Earth." },
      { term: "Desnivel", def: "La diferencia de altura entre el inicio y el final de la línea. A favor (bajada) te regala presión; en contra (subida) te la quita y quizá necesites bomba." },
    ],
  },
  {
    cat: "Agua y caudal",
    items: [
      { term: "Caudal (Q)", def: "Cuánta agua pasa por el tubo cada segundo, en litros por segundo (L/s). Es el dato que manda en todo el diseño: el diámetro se elige según el caudal que debe pasar." },
      { term: "L/s", def: "Litros por segundo. Para dimensionar: 1 L/s equivale a unos 86.4 m³ al día — suficiente para unas 100-120 familias con dotación típica." },
      { term: "Velocidad (V)", def: "Qué tan rápido viaja el agua dentro del tubo (m/s). Sana entre 0.3 y 2.5 m/s: muy lenta deja que se asienten sedimentos; muy rápida desgasta el tubo y desperdicia presión en fricción." },
    ],
  },
  {
    cat: "Presión",
    items: [
      { term: "Presión", def: "La \"fuerza\" con la que el agua empuja dentro del tubo. En campo se mide en kg/cm². Referencia fácil: 1 kg/cm² es lo que empuja una columna de agua de 10 m de alto (un tinaco 10 m arriba de tu llave te da 1 kg/cm²)." },
      { term: "kg/cm²", def: "La unidad de presión común en México. 1 kg/cm² = 10 m.c.a. ≈ 0.98 bar ≈ 14.2 psi." },
      { term: "m.c.a.", def: "Metros de columna de agua: la presión expresada como la altura de agua que la produce. 10 m.c.a. = 1 kg/cm²." },
      { term: "Presión estática", def: "La presión con el agua DETENIDA (válvula cerrada). Solo depende del desnivel: 100 m de bajada son 10 kg/cm² estáticos. Es la máxima que vive la tubería en reposo." },
      { term: "Presión dinámica (de operación)", def: "La presión con el agua CORRIENDO: la estática menos lo que se gasta en fricción. Es la que ve el usuario cuando abre la llave." },
      { term: "P1 (presión de entrada)", def: "La presión al INICIO de la línea: la que entrega el tanque, la red o la bomba. La app puede calcular la P1 REQUERIDA: cuánta necesitas en el inicio para que toda la línea cumpla." },
      { term: "Presión mínima (Pmin)", def: "La presión que exiges en cualquier punto para que el servicio funcione. CONAGUA pide al menos 1 kg/cm² (10 m.c.a.) en redes de distribución." },
      { term: "Línea piezométrica", def: "Hasta dónde subiría el agua si en ese punto conectaras un tubito vertical abierto. Dibuja la energía disponible a lo largo del trazo: si toca el terreno, ahí la presión es CERO; si cruza por debajo, hay presión negativa y la línea no funciona en ese punto." },
      { term: "Punto crítico", def: "El punto del trazo con la presión más baja — casi siempre una loma. Si el punto crítico cumple la presión mínima, todo lo demás cumple." },
    ],
  },
  {
    cat: "La tubería",
    items: [
      { term: "DN (diámetro nominal)", def: "El \"nombre comercial\" del tamaño del tubo: 6\", DN 150. Es una etiqueta para pedirlo y cotizarlo, NO la medida exacta por donde pasa el agua." },
      { term: "OD (diámetro exterior)", def: "El diámetro exterior real del tubo, en mm. Un 6\" PVC Inglés mide 168.3 mm por fuera, no 150." },
      { term: "Diámetro interior (ID)", def: "El espacio real por donde pasa el agua: OD menos dos veces el espesor de pared. Con ESTE se calculan velocidad y pérdidas — la app lo deriva sola del material y la clase (lo ves bajo el selector de DN)." },
      { term: "Espesor (e)", def: "El grosor de la pared del tubo, en mm. Más espesor = aguanta más presión, pero deja un poco menos de espacio interior." },
      { term: "Clase / RD / SDR", def: "Indica cuánta presión aguanta el tubo. RD (o SDR) = diámetro exterior ÷ espesor: número MENOR = pared más gruesa = aguanta MÁS. Ejemplo: RD 26 (11.2 kg/cm²) aguanta más que RD 41 (7 kg/cm²)." },
      { term: "PN (presión nominal)", def: "La presión máxima de trabajo que la clase del tubo aguanta de forma continua, en bar. PN 11 ≈ 11.2 kg/cm². Si la presión de la línea la supera, hay que subir de clase, cambiar de material o poner una reductora." },
      { term: "C (Hazen-Williams)", def: "Qué tan \"liso\" es el tubo por dentro. Número mayor = más liso = pierde menos presión por fricción. PVC nuevo: 150; hierro dúctil: 130; acero: 120." },
      { term: "Materiales", def: "PVC Inglés: el hidráulico más común en México. PVC C900: municipal, empata con piezas de hierro. PVC Métrico: sistema ISO. HDPE: polietileno flexible (se termofusiona). Hierro dúctil y Acero: para presiones altas o cruces especiales." },
    ],
  },
  {
    cat: "Pérdidas y cálculo",
    items: [
      { term: "Pérdida de carga", def: "La presión que se \"gasta\" en empujar el agua por el tubo. Como la pila del celular: sales del inicio con P1 y se va consumiendo con la distancia; lo que llega al final es P1 + desnivel − pérdidas." },
      { term: "hf (pérdida por fricción)", def: "Lo que se pierde por el rozamiento del agua contra la pared del tubo en toda la longitud. Crece mucho si el tubo es chico para el caudal." },
      { term: "hm (pérdida por accesorios)", def: "Lo que se pierde extra al pasar por codos, tees y válvulas. En líneas largas se estima como un porcentaje de hf (típico 5%)." },
      { term: "Gradiente (J)", def: "Cuántos metros de presión pierdes por cada kilómetro de tubo. Óptimo hasta 5 m/km; arriba de 10 m/km el tubo va \"ahorcado\" y conviene subir de diámetro." },
    ],
  },
  {
    cat: "Demanda (cálculo de gasto)",
    items: [
      { term: "Dotación", def: "Los litros de agua que el sistema debe entregar por habitante por día (p.ej. 150 L/hab/día). Depende del clima y tipo de localidad." },
      { term: "Qm (gasto medio)", def: "El caudal promedio del día: población × dotación ÷ 86,400 segundos." },
      { term: "Qmd (gasto máximo diario)", def: "El caudal del día de mayor consumo del año: Qm × 1.4. Con ESTE se diseñan la conducción, el tanque y el equipo de bombeo." },
      { term: "Qmh (gasto máximo horario)", def: "El caudal de la hora pico de ese día: Qmd × 1.55. Con ESTE se diseña la red de distribución." },
      { term: "Coeficiente de regulación (R)", def: "Para dimensionar el tanque: Volumen = Qmd × R. Con suministro 24 h, R = 11 (CONAGUA): un Qmd de 10 L/s pide un tanque de 110 m³." },
    ],
  },
  {
    cat: "Bombeo",
    items: [
      { term: "Hg (carga estática)", def: "Los metros de subida que la bomba debe vencer: cota de entrega menos cota de succión. Es la parte \"fija\" del trabajo de la bomba." },
      { term: "CDT (carga dinámica total)", def: "TODO lo que la bomba debe vencer: la subida + la fricción + los accesorios + la presión de servicio en la entrega. El par Q + CDT es lo que el proveedor necesita para cotizarte la bomba." },
      { term: "Diámetro económico", def: "El DN donde cuesta menos la suma de tubería + energía eléctrica. Tubo chico = recibo de luz caro para siempre; tubo grande = inversión inicial cara. La fórmula de Bresse encuentra el equilibrio." },
      { term: "HP", def: "La potencia del motor de la bomba, en caballos de fuerza. La app redondea al HP comercial inmediato superior." },
      { term: "Eficiencia", def: "Qué parte de la energía eléctrica se convierte realmente en agua empujada. Típico 70% la bomba y 90% el motor; el resto se vuelve calor." },
      { term: "Punto de operación", def: "El caudal y la altura REALES a los que va a trabajar la bomba: donde se cruza la curva de la bomba (lo que puede dar) con la curva del sistema (lo que la línea le exige)." },
    ],
  },
  {
    cat: "Protecciones",
    items: [
      { term: "Golpe de ariete", def: "El \"manotazo\" de presión que da el agua cuando algo la detiene de golpe: el cierre de una válvula o el paro de la bomba. Puede agregar mucha presión extra en segundos; por eso se verifica que la clase del tubo lo aguante." },
      { term: "Celeridad (a)", def: "La velocidad a la que viaja la onda del golpe de ariete por el tubo (m/s). Depende del material: en PVC ronda 300-500 m/s, en acero más de 1,000." },
      { term: "Tc (tiempo de cierre)", def: "Lo que tarda la válvula en cerrar, en segundos. Cerrar LENTO suaviza el golpe; cerrar de golpe produce la sobrepresión máxima." },
      { term: "Sobrepresión (ΔH)", def: "Los metros de presión EXTRA que agrega el golpe de ariete encima de la operación normal. Operación + sobrepresión debe quedar dentro de lo que aguanta la clase." },
      { term: "VRP (válvula reductora de presión)", def: "Una válvula que \"baja el switch\" de la presión: recibe mucha y entrega aguas abajo una presión fija menor. Se usa cuando el desnivel mete más presión de la que la tubería o la zona aguantan." },
      { term: "Tanque rompedor", def: "Un tanque intermedio abierto que corta la presión a cero y \"reinicia\" la línea desde esa cota. Alternativa a la VRP en líneas por gravedad con mucho desnivel." },
      { term: "Válvulas de aire", def: "Van en los puntos ALTOS del trazo. Eliminadora (VA-E): saca el aire que se acumula operando. Admisión-expulsión (VAEA): saca el aire al llenar y mete aire al vaciar, para que el tubo no se colapse. Combinada (VA-C): hace las dos cosas." },
      { term: "Desagüe (desfogue)", def: "Válvula en los puntos BAJOS del trazo para drenar la línea en mantenimiento y sacar sedimentos." },
      { term: "Crucero", def: "El \"nudo\" de piezas en un punto de la red: codos, tees, válvulas, bridas y transiciones. El Generador de cruceros arma el despiece pieza por pieza para cotizarlo." },
    ],
  },
];

export function GlossaryButton({ variant = "footer" }: { variant?: "footer" | "header" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filtra términos y oculta categorías vacías
  const filtered = GLOSSARY
    .map((c) => ({
      ...c,
      items: search
        ? c.items.filter((g) => g.term.toLowerCase().includes(search.toLowerCase()) || g.def.toLowerCase().includes(search.toLowerCase()))
        : c.items,
    }))
    .filter((c) => c.items.length > 0);

  return (
    <>
      {variant === "header" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-[#1C3D5A] dark:text-blue-300 bg-[#1C3D5A]/10 dark:bg-blue-900/30 border border-[#1C3D5A]/30 rounded-lg px-4 py-2 hover:bg-[#1C3D5A] hover:text-white transition-colors whitespace-nowrap"
          title="¿Qué significa cada término? Explicado en lenguaje sencillo"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
          </svg>
          Diccionario
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="text-[10px] text-gray-400 hover:text-[#1C3D5A] transition-colors">
          Diccionario
        </button>
      )}

      {/* Portal al body: el header tiene backdrop-blur y eso "atrapa" al position:fixed */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#1C3D5A] px-5 py-3 flex items-center justify-between rounded-t-xl z-10">
              <div>
                <h2 className="text-sm font-semibold text-white">Diccionario</h2>
                <p className="text-[10px] text-white/60">Cada término explicado en lenguaje sencillo</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg">&times;</button>
            </div>
            <div className="sticky top-[52px] bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700 z-10">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca un término: cota, presión, RD, golpe de ariete..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1C3D5A]"
              />
            </div>
            <div className="p-4 space-y-5">
              {filtered.map((c) => (
                <div key={c.cat}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#1C3D5A] dark:text-blue-300 bg-[#1C3D5A]/[0.06] dark:bg-blue-900/20 rounded px-2 py-1 mb-2">{c.cat}</h3>
                  <div className="space-y-3">
                    {c.items.map((g) => (
                      <div key={g.term} className="border-b border-gray-50 dark:border-gray-700 pb-2">
                        <dt className="text-xs font-bold text-gray-800 dark:text-gray-100">{g.term}</dt>
                        <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{g.def}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No se encontró ese término. Prueba con otra palabra (p. ej. &quot;presión&quot;, &quot;cota&quot;, &quot;RD&quot;).</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
