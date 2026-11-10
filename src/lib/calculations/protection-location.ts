/* ════════════════════════════════════════
   Ubicación de las protecciones sobre el perfil del proyecto
   - VRP (válvula reductora de presión): dónde va y con qué ajuste
   - Protección contra golpe de ariete: dónde va la aliviadora/anticipadora,
     con qué ajuste, y dónde van las ventosas contra vacío
   Presiones en kg/cm² (1 kg/cm² ≈ 10 m de columna de agua).
   ════════════════════════════════════════ */

export interface PuntoPerfil { cad: number; cota: number; desc?: string }

export const fmtCad = (cad: number) =>
  `${Math.floor(Math.round(cad) / 1000)}+${String(Math.round(cad) % 1000).padStart(3, "0")}`;

const r1 = (n: number) => Math.round(n * 10) / 10;

// ── VRP ─────────────────────────────────────────────────────────────
export interface PuntoPresion {
  dist: number;
  cota: number;
  desc?: string;
  pressure_kgcm2: number | null; // presión de operación con el gasto de diseño
  pn_kgcm2: number | null;       // clase de la tubería en ese punto
}

export interface PlanVRP {
  viable: boolean;
  motivo: string | null;          // por qué no es viable (si no lo es)
  cad: number;                    // dónde instalarla
  cota: number;
  desc: string;
  p1: number;                     // presión de entrada a la VRP (operación)
  p2: number;                     // ajuste de salida recomendado
  corte: number;                  // p1 − p2
  zonaDesde: number;              // primer punto que excede la clase
  zonaHasta: number;              // último punto que excede la clase
  puntoBajo: { cad: number; cota: number }; // punto más bajo aguas abajo (manda el ajuste)
  pEstaticaMaxAbajo: number;      // presión máxima aguas abajo con la línea detenida
  pMinAbajo: number;              // presión mínima aguas abajo con el gasto de diseño
}

/**
 * Ubica la VRP en el ÚLTIMO punto que todavía está dentro de clase antes de la zona que
 * la excede, y calcula su ajuste de salida (P2) con la línea DETENIDA:
 * con gasto cero no hay fricción y aguas abajo la presión sube a P2 + desnivel/10,
 * así que P2 = mín(PN − margen − desnivel/10) sobre los puntos aguas abajo.
 * Después verifica con el gasto de diseño que ningún punto aguas abajo quede bajo Pmin.
 */
export function ubicarVRP(puntos: PuntoPresion[], Pmin: number, margen = 0.5): PlanVRP | null {
  const ps = puntos.filter((p) => p.pressure_kgcm2 != null).sort((a, b) => a.dist - b.dist);
  const iExc = ps.findIndex((p) => p.pn_kgcm2 != null && p.pressure_kgcm2! > p.pn_kgcm2);
  if (iExc < 0) return null;
  let iFin = iExc;
  for (let i = iExc; i < ps.length; i++) if (ps[i].pn_kgcm2 != null && ps[i].pressure_kgcm2! > ps[i].pn_kgcm2!) iFin = i;

  const base = {
    zonaDesde: ps[iExc].dist, zonaHasta: ps[iFin].dist,
  };
  if (iExc === 0) {
    const p = ps[0];
    return {
      viable: false, motivo: "La presión ya excede la clase desde el arranque de la línea: la reducción tiene que hacerse antes (en la fuente o con una caja rompedora de presión).",
      cad: p.dist, cota: p.cota, desc: p.desc ?? "", p1: r1(p.pressure_kgcm2!), p2: 0, corte: 0,
      puntoBajo: { cad: p.dist, cota: p.cota }, pEstaticaMaxAbajo: r1(p.pressure_kgcm2!), pMinAbajo: r1(p.pressure_kgcm2!), ...base,
    };
  }
  const k = iExc - 1;
  const v = ps[k];
  const abajo = ps.slice(k);
  // Ajuste máximo que respeta la clase de cada punto con la línea detenida
  let p2 = Infinity;
  let bajo = v;
  for (const p of abajo) {
    if (p.cota < bajo.cota) bajo = p;
    if (p.pn_kgcm2 == null) continue;
    p2 = Math.min(p2, p.pn_kgcm2 - margen - (v.cota - p.cota) / 10);
  }
  p2 = r1(p2);
  const p1 = v.pressure_kgcm2!;
  // Con el gasto de diseño, cada punto aguas abajo queda en P2 + (P_i − P_k)
  const pMinAbajo = Math.min(...abajo.map((p) => p2 + (p.pressure_kgcm2! - p1)));
  const pEstMax = Math.max(...abajo.map((p) => p2 + (v.cota - p.cota) / 10));
  let motivo: string | null = null;
  if (!isFinite(p2) || p2 <= 0) motivo = "El desnivel aguas abajo es tan grande que ninguna presión de salida mantiene la línea dentro de clase con el agua detenida: se requieren dos reducciones en cascada (VRP o cajas rompedoras) o subir la clase de la zona baja.";
  else if (p2 >= p1) motivo = "En ese punto la presión de operación ya es menor que el ajuste necesario: revisa el perfil y las clases capturadas.";
  else if (pMinAbajo < Pmin) motivo = `Con ese ajuste, algún punto aguas abajo quedaría en ${r1(pMinAbajo)} kg/cm², por debajo de la presión mínima (${Pmin}). Se requiere reducir en dos etapas o subir la clase de la zona baja.`;
  return {
    viable: motivo == null, motivo,
    cad: v.dist, cota: v.cota, desc: v.desc ?? "",
    p1: r1(p1), p2, corte: r1(p1 - p2),
    puntoBajo: { cad: bajo.dist, cota: bajo.cota },
    pEstaticaMaxAbajo: r1(pEstMax), pMinAbajo: r1(pMinAbajo), ...base,
  };
}

// ── Golpe de ariete ─────────────────────────────────────────────────
export interface PlanGolpe {
  inicio: PuntoPerfil;
  fin: PuntoPerfil;
  bajo: PuntoPerfil;
  altos: PuntoPerfil[];
  valvula: PuntoPerfil;            // dónde va la aliviadora (gravedad) o anticipadora (bombeo)
  ajuste: {                        // solo gravedad, cuando se conoce P1 y la clase
    estaticaEnValvula: number;     // presión en la válvula con la línea detenida
    minimo: number;                // no abrir con la presión normal (estática + 10 %)
    maximo: number;                // abrir antes de que el punto bajo pase la clase
    recomendado: number;
    alcanza: boolean;              // false: la aliviadora sola no protege el punto bajo
  } | null;
}

export function ubicarProteccionGolpe(
  vertices: PuntoPerfil[], esBombeo: boolean, p1_kgcm2: number | null, pn_kgcm2: number | null, margen = 0.5,
): PlanGolpe | null {
  const vs = vertices.filter((v) => v.cad != null && v.cota != null).sort((a, b) => a.cad - b.cad);
  if (vs.length < 2) return null;
  let bajo = vs[0];
  for (const v of vs) if (v.cota < bajo.cota) bajo = v;
  const altos = vs.filter((v, i) => i > 0 && i < vs.length - 1 && v.cota > vs[i - 1].cota && v.cota >= vs[i + 1].cota);
  const inicio = vs[0], fin = vs[vs.length - 1];
  const valvula = esBombeo ? inicio : fin;
  let ajuste: PlanGolpe["ajuste"] = null;
  if (!esBombeo && p1_kgcm2 != null && pn_kgcm2 != null) {
    // Con la válvula cerrada el agua queda detenida: la carga en la llegada es la del arranque
    const cargaArranque = inicio.cota + p1_kgcm2 * 10;
    const estatica = (cargaArranque - valvula.cota) / 10;
    const minimo = estatica * 1.10;
    const maximo = pn_kgcm2 - margen - (valvula.cota - bajo.cota) / 10;
    ajuste = {
      estaticaEnValvula: r1(estatica), minimo: r1(minimo), maximo: r1(maximo),
      recomendado: r1(minimo <= maximo ? minimo : maximo), alcanza: minimo <= maximo,
    };
  }
  return { inicio, fin, bajo, altos, valvula, ajuste };
}
