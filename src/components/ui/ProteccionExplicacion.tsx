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

// Criterio de ubicación de válvulas de aire: tabla AWWA M51 (la misma que publican los
// fabricantes en su diagrama de ubicación). La plataforma aplica exactamente estas reglas.
const CRITERIO_AWWA: [string, string, string][] = [
  ["Descarga de bomba (antes de la check)", "Admisión y expulsión", "Al arrancar la bomba sale de golpe el aire de la columna; al parar, entra aire para que no se haga vacío."],
  ["Inicio de la línea por gravedad, si baja desde el tanque o arranca plana", "Combinada", "Ahí el inicio es un punto alto: por ahí sale el aire al llenar y entra al vaciar. Si la línea sube desde el tanque, no lleva."],
  ["Punto alto", "Combinada", "Ahí se junta el aire durante la operación y ahí se forma el vacío al vaciar."],
  ["Inicio de tramo horizontal (la subida termina)", "Combinada", "El aire que sube con el agua se detiene donde la pendiente se acaba."],
  ["Fin de tramo horizontal", "Combinada", "El aire que avanzó por el tramo plano se acumula donde vuelve a cambiar la pendiente."],
  ["Disminuye la pendiente de subida", "Admisión y expulsión (o combinada)", "El aire se frena donde la subida se suaviza; al vaciar, entra aire por ahí."],
  ["Aumenta la pendiente de bajada", "Combinada", "El agua se separa del tubo donde la bajada se empina: riesgo de vacío y de bolsas de aire."],
  ["Tramo horizontal largo (cada 500 m aprox.)", "Eliminadora (o combinada)", "Purga las burbujas que se juntan en operación a lo largo del tramo."],
  ["Ascenso largo (cada 500 m aprox.)", "Admisión y expulsión (o combinada)", "Mucho volumen de aire que sacar al llenar y meter al vaciar."],
  ["Descenso largo (cada 500 m aprox.)", "Combinada (M51 admite eliminadora)", "En las bajadas se forma el vacío al vaciar; la combinada además purga en operación."],
  ["Aumenta la pendiente de subida / disminuye la de bajada", "Ninguna", "Ahí el aire no se detiene: sigue de largo con el agua."],
  ["Punto bajo", "Ninguna: desfogue", "Ahí no hay aire; se pone un desfogue para vaciar la línea y sacar sedimentos."],
  ["Llegada al tanque (si no llega bajando)", "Combinada", "Sale el aire que trae la línea y entra aire cuando el tanque se vacía."],
];

export function CriterioValvulasAire() {
  return (
    <div className="space-y-2">
      <p>La plataforma coloca cada válvula con la tabla de ubicación del <strong>Manual AWWA M51</strong> (la misma que traen los diagramas de los fabricantes). Donde la tabla permite dos opciones, la columna «Razón» de las válvulas recomendadas dice cuál se eligió.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500">
              <th className="px-2 py-1 text-left">Lugar del perfil</th>
              <th className="px-2 py-1 text-left">Válvula</th>
              <th className="px-2 py-1 text-left">Por qué</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIO_AWWA.map(([lugar, valvula, porque]) => (
              <tr key={lugar} className="border-b border-gray-100 dark:border-gray-700 align-top">
                <td className="px-2 py-1 font-medium">{lugar}</td>
                <td className="px-2 py-1 whitespace-nowrap">{valvula}</td>
                <td className="px-2 py-1 text-gray-600 dark:text-gray-400">{porque}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500">Con cotas satelitales (mapa o KML) las lomas de menos de 5 m no cuentan: el SRTM tiene 16 m de precisión vertical (90 %, USGS) y una loma menor no se distingue del error. Es criterio de la plataforma. Con topografía de campo (CSV o Excel) se toman en cuenta desde 1 m.</p>
      <p className="text-gray-500">Combinada = admite y expulsa mucho aire (llenado y vaciado) y además purga burbujas con la línea en presión. Admisión y expulsión = solo grandes volúmenes (llenado y vaciado). Eliminadora = solo purga burbujas con la línea en presión.</p>
    </div>
  );
}
