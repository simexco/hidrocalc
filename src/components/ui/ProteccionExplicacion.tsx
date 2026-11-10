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
