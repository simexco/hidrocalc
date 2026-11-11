"use client";

import type { ReactNode } from "react";

// Explicaciones de POR QUÉ va cada protección donde va y para qué sirve cada pieza del
// arreglo. Se muestran en un desplegable para que el proyectista pueda justificarlas.

function Pieza({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="flex-none w-5 h-5 rounded-full bg-[#1C3D5A] text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
      <span><strong>{titulo}.</strong> {children}</span>
    </li>
  );
}

export function Desplegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60">
      <summary className="cursor-pointer select-none px-2.5 py-1.5 text-[11px] font-semibold text-[#1C3D5A] dark:text-blue-300">{titulo}</summary>
      <div className="px-3 pb-3 pt-1 space-y-2 text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
    </details>
  );
}

export function PiezasEstacionVRP() {
  return (
    <ol className="space-y-1.5">
      <Pieza n={1} titulo="Válvula de seccionamiento aguas arriba">Aísla la estación para darle mantenimiento sin vaciar la línea.</Pieza>
      <Pieza n={2} titulo="Filtro tipo «Y»">El piloto de la VRP tiene conductos muy pequeños; la arena o el sarro los tapan y la válvula deja de regular (se queda abierta o cerrada). El filtro la protege.</Pieza>
      <Pieza n={3} titulo="Manómetros a la entrada y a la salida">Sirven para calibrar el ajuste de salida (P2) y para comprobar en campo que la válvula está regulando.</Pieza>
      <Pieza n={4} titulo="Válvula reductora de presión (VRP) piloteada">Reduce la presión y la mantiene constante en P2 aunque cambien el gasto y la presión de entrada; con gasto cero cierra y sostiene P2.</Pieza>
      <Pieza n={5} titulo="Junta de desmontaje">Permite retirar la válvula bridada para repararla sin cortar ni mover la tubería.</Pieza>
      <Pieza n={6} titulo="Válvula de seccionamiento aguas abajo">Junto con la de entrada, deja la VRP fuera de servicio de forma segura.</Pieza>
      <Pieza n={7} titulo="By-pass con su propia regulación (normalmente cerrado)">Mantiene el servicio durante el mantenimiento. Debe llevar una segunda VRP o una válvula operada con manómetro: un by-pass abierto sin regulación mandaría la presión completa a una tubería que no la resiste.</Pieza>
      <Pieza n={8} titulo="Válvula de alivio aguas abajo">Se calibra arriba de P2 y abajo de la clase de la tubería. Si la VRP falla abierta (piloto tapado, diafragma roto), descarga antes de que la tubería aguas abajo reviente.</Pieza>
      <Pieza n={9} titulo="Caja de operación con drenaje">Da acceso para operar y calibrar la estación, y evita que se inunde.</Pieza>
    </ol>
  );
}

export function PiezasAliviadora({ bombeo }: { bombeo: boolean }) {
  const piezas: [string, ReactNode][] = [
    ...(bombeo ? [["Válvula check (de la bomba)", "Es contra la que regresa la onda después del paro. La anticipadora se conecta después de ella, del lado de la línea."] as [string, ReactNode]] : []),
    ["Tee o derivación en la línea", <>{bombeo ? "En la descarga, después de la check y antes de la válvula de seccionamiento de la línea." : "Justo aguas arriba de la válvula que se cierra (en la llegada)."} Conecta la válvula de protección sin interrumpir el paso del agua.</>],
    ["Válvula de seccionamiento bajo la válvula de protección", "Permite darle mantenimiento sin vaciar la línea. Debe quedar ABIERTA y con candado: si alguien la cierra, la protección deja de existir."],
    [bombeo ? "Válvula anticipadora de onda" : "Válvula aliviadora de presión", bombeo
      ? "Detecta la caída de presión que provoca el paro de la bomba y abre ANTES de que regrese la onda; el agua que regresa encuentra la válvula abierta y sale en lugar de golpear. Después cierra lentamente para no generar un segundo golpe."
      : "Abre en cuanto la presión supera su ajuste y descarga el exceso de agua, recortando el pico del golpe. Cierra lentamente para no provocar un segundo golpe."],
    ["Manómetro", "Para verificar la presión normal de operación y calibrar el ajuste de apertura."],
    ["Junta de desmontaje", "Permite retirar la válvula para mantenimiento sin cortar tubería."],
    ["Descarga libre a cauce o drenaje pluvial", "El agua sale con mucha fuerza. La descarga debe ser libre, con espacio de aire, para que agua sucia nunca pueda regresar a la línea de agua potable."],
  ];
  return (
    <ol className="space-y-1.5">
      {piezas.map(([t, d], i) => <Pieza key={t} n={i + 1} titulo={t}>{d}</Pieza>)}
    </ol>
  );
}

export function PorQueVentosasVacio() {
  return (
    <p>
      Después de la sobrepresión viene la onda de regreso, que baja la presión. En los <strong>puntos altos</strong> la línea tiene menos
      columna de agua encima, así que ahí es donde la presión cae primero bajo cero. Con vacío, un tubo de pared delgada puede colapsar, y la
      columna de agua se puede separar; cuando se vuelve a juntar, el choque es más fuerte que el golpe original. La <strong>válvula de
      admisión de aire</strong> deja entrar aire en ese instante y rompe el vacío. La aliviadora no sirve para esto: solo actúa contra la
      sobrepresión.
    </p>
  );
}

// Criterio de ubicación de válvulas de aire: AWWA M51 (2a. ed.), figura 3-1 (p. 18) y lista de
// ubicaciones (p. 19). Donde la tabla da dos opciones, la plataforma pone la más sencilla y combinada
// si el golpe de ariete hace vacío; se puede pedir combinada en todos (M51 p. 44).
// Columnas: lugar, válvula, por qué, dónde lo dice M51.
const CRITERIO_AWWA: [string, string, string, string][] = [
  ["Descarga de bomba (antes de la check)", "Admisión y expulsión (M51 permite combinada). Pozo: combinada con cierre lento", "Al arrancar la bomba sale de golpe el aire de la columna; al parar, entra aire para que no se haga vacío.", "Fig. 3-1 (p. 18); pozos: p. 19 y 42"],
  ["Inicio de la línea por gravedad, si baja desde el tanque o arranca plana", "Combinada", "Ahí el inicio es un punto alto o un inicio de tramo horizontal. Si la línea sube desde el tanque, no lleva.", "Punto alto e inicio de horizontal: fig. 3-1 y p. 19"],
  ["Punto alto", "Combinada", "Ahí se junta el aire durante la operación y ahí se forma el vacío al vaciar.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Inicio de tramo horizontal (la subida termina)", "Combinada", "El aire que sube con el agua se detiene donde la pendiente se acaba.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Fin de tramo horizontal", "Combinada", "El aire que avanzó por el tramo plano se junta donde cambia la pendiente. Si después sube y el tramo plano es corto (menos de 400 m), no lleva: el aire sigue hasta el punto alto.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Disminuye la pendiente de subida", "Admisión y expulsión (M51 permite combinada)", "El aire se frena donde la subida se suaviza; al vaciar, entra aire por ahí.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Aumenta la pendiente de bajada", "Combinada", "El agua se separa del tubo donde la bajada se empina: riesgo de vacío y de bolsas de aire.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Tramo horizontal largo, cada 400 a 800 m", "Eliminadora; combinada si el golpe hace vacío", "Purga las burbujas que se juntan en operación. Si hay vacío, la eliminadora no deja entrar aire suficiente.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Ascenso largo, cada 400 a 800 m", "Admisión y expulsión (M51 permite combinada)", "Mucho volumen de aire que sacar al llenar y meter al vaciar.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Descenso largo, cada 400 a 800 m", "Eliminadora; combinada si el golpe hace vacío", "Purga el aire en operación. Si el golpe hace vacío, la combinada deja entrar aire.", "Fig. 3-1 (p. 18) y p. 19"],
  ["Aumenta la pendiente de subida / disminuye la de bajada", "Ninguna", "Ahí el aire no se detiene: sigue de largo con el agua.", "Fig. 3-1 (p. 18)"],
  ["Punto bajo", "Ninguna: desfogue", "Ahí no hay aire; se pone un desfogue para vaciar la línea y sacar sedimentos.", "Fig. 3-1 (p. 18), «drain valve»; MAPAS §3.1.4"],
  ["Llegada al tanque", "Descarga libre: ninguna. Ahogada: combinada", "Con descarga libre el extremo está abierto. Ahogada o con válvula de llenado, la llegada funciona como punto alto.", "Fig. 3-1 (p. 18): la línea entra libre al tanque sin válvula"],
  ["Donde el golpe de ariete hace vacío", "Combinada con dispositivo de cierre lento", "Deja entrar aire y lo saca despacio, para no provocar un segundo golpe. Se confirma con un estudio de golpe de ariete hecho con software.", "p. 19, 34 y 37-38"],
];

const CRITERIO_TAMANO: [string, string][] = [
  ["Tamaño de combinada y de admisión y expulsión", "El orificio grande debe sacar el aire al llenar la línea a 0.3 m/s y dejar entrar el aire si la línea se rompe y se vacía por gravedad, a 5 psi de vacío. Manda el mayor de los dos. AWWA M51, cap. 4: llenado p. 26-28, ruptura p. 28-31, tablas 4-2 y 4-3."],
  ["Un solo tamaño por línea", "El cálculo da un tamaño en cada punto, porque depende de la pendiente del tubo. Se pone en todas el mayor de la línea: una válvula más grande que la calculada también cumple con M51, y así se compra un solo modelo."],
  ["Tamaño de la eliminadora", "Purga el aire que trae el agua en operación (M51 toma el 2 % del gasto, p. 23-26): basta el orificio chico."],
  ["Presión de sello", "Las válvulas se prueban a 20 psi (14 m) como mínimo; si operan abajo, se especifica al fabricante (M51 p. 35-36)."],
  ["Instalación", "En líneas de 12\" o menos, sobre una tee del diámetro de la línea con reducción a la válvula y válvula de seccionamiento abajo (M51 p. 46-47, figura 6-1)."],
];

export function CriterioValvulasAire() {
  return (
    <div className="space-y-2">
      <p>La plataforma coloca cada válvula con la tabla de ubicación del <strong>Manual AWWA M51</strong> (2a. edición, reafirmado en 2025). Donde la tabla permite dos opciones pone la más sencilla, y combinada donde el golpe de ariete hace vacío. Se puede pedir combinada en todos, como recomienda el manual siempre que sea posible (p. 44).</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500">
              <th className="px-2 py-1 text-left">Lugar del perfil</th>
              <th className="px-2 py-1 text-left">Válvula</th>
              <th className="px-2 py-1 text-left">Por qué</th>
              <th className="px-2 py-1 text-left">Dónde lo dice M51</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIO_AWWA.map(([lugar, valvula, porque, cita]) => (
              <tr key={lugar} className="border-b border-gray-100 dark:border-gray-700 align-top">
                <td className="px-2 py-1 font-medium">{lugar}</td>
                <td className="px-2 py-1">{valvula}</td>
                <td className="px-2 py-1 text-gray-600 dark:text-gray-400">{porque}</td>
                <td className="px-2 py-1 text-gray-500">{cita}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-1">
        {CRITERIO_TAMANO.map(([t, d]) => (
          <li key={t}><strong>{t}:</strong> <span className="text-gray-600 dark:text-gray-400">{d}</span></li>
        ))}
      </ul>
      <p className="text-gray-500">Con cotas satelitales (mapa o KML) las lomas de menos de 5 m no cuentan: el SRTM tiene 16 m de precisión vertical (90 %, USGS) y una loma menor no se distingue del error. Es criterio de la plataforma. Con topografía de campo (CSV o Excel) se toman en cuenta desde 1 m.</p>
      <p className="text-gray-500">Combinada = admite y expulsa mucho aire (llenado y vaciado) y además purga burbujas con la línea en presión. Admisión y expulsión = solo grandes volúmenes (llenado y vaciado). Eliminadora = solo purga burbujas con la línea en presión.</p>
    </div>
  );
}
