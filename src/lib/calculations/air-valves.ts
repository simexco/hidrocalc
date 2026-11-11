/* ════════════════════════════════════════
   Air Valve Location & Sizing Engine
   Tipos: VA-C (Combinada), VA-A (Admisión/Expulsión), VA-E (Eliminadora)
   Ref: CONAGUA MAPAS, AWWA M51, Val-Matic
   ════════════════════════════════════════ */

import { G } from "@/lib/constants";

// ── Types ──
export interface AirValveVertex {
  id: string;
  dist: number;    // m from start
  cota: number;    // m.s.n.m.
  desc: string;    // optional description
}

export interface AirValveResult {
  dist: number;
  cota: number;
  pressure: number | null;  // m.c.a.
  type: "VA-C" | "VA-A" | "VA-E";
  bodySize: string;     // ANSI inches
  orificeSize: string;  // ANSI inches
  pn: string;
  reason: string;
  alert: "critical" | "low" | null;
  note: string;
}

export interface AirValveInputs {
  projectName: string;
  Q: number | null;       // m3/s
  DN_mm: number;
  // Interior REAL del tubo (material+DN+clase): la hidraulica usa este; el DN nominal
  // solo dimensiona las valvulas. Sin el, la friccion con el nominal sale ~10% alta.
  diametroInterior_mm?: number | null;
  C: number;
  P0_kgcm2: number | null;
  pressureMin: number;    // m.c.a.
  maxSpacing: number;     // m
  vertices: AirValveVertex[];
  // Linea por bombeo: la primera valvula va en la descarga de la bomba (admision y expulsion)
  esBombeo?: boolean;
  // false = cotas de topografia de campo (CSV/Excel): no se aplica el filtro de 5 m de las satelitales
  cotasSatelitales?: boolean | null;
  // Sobrepresion del modulo Golpe de ariete (m). Con ella se revisa si la onda de baja
  // presion hace vacio en cada punto: presion de operacion - ΔH < 0
  golpeDeltaH?: number | null;
  // Como llega el agua al final de la linea: true = cae libre al tanque, false = ahogada
  // o con valvula de llenado (flotador, altitud), null = no indicado
  llegadaLibre?: boolean | null;
}

export interface AirValveOutputs {
  valves: AirValveResult[];
  profilePoints: { dist: number; cota: number; pressure: number | null }[];
  totalVAC: number;
  totalVAA: number;
  totalVAE: number;
  alerts: string[];
  // Puntos bajos significativos: ahi NO va valvula de aire, va un desfogue (se grafican aparte)
  desagues: { dist: number; cota: number }[];
}

// ── Sizing tables (ANSI inches) ──
// Eliminadora (orificio chico): usa TODO el rango del catalogo (1/2" a 2").
// Progresion por tamaño de linea; la seleccion definitiva es con la curva del
// fabricante (presion de operacion vs capacidad de purga). Criterio preliminar.
const VAE_SIZE: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '1/2"', 150: '1/2"', 200: '1/2"',
  250: '3/4"', 300: '3/4"', 350: '3/4"',
  400: '1"', 450: '1"', 500: '1"',
  600: '2"', 750: '2"', 900: '2"',
};

const VAA_SIZE: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '3/4"', 150: '1"', 200: '2"', 250: '2"', 300: '2"',
  350: '3"', 400: '3"', 450: '4"', 500: '4"', 600: '6"', 750: '6"', 900: '8"',
};

const VAC_BODY: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '3/4"', 150: '1"', 200: '2"', 250: '2"', 300: '2"',
  350: '3"', 400: '3"', 450: '4"', 500: '4"', 600: '6"', 750: '6"', 900: '8"',
};

// Orificio chico de la combinada: misma progresion que la eliminadora
const VAC_ORIFICE: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '1/2"', 150: '1/2"', 200: '1/2"',
  250: '3/4"', 300: '3/4"', 350: '3/4"',
  400: '1"', 450: '1"', 500: '1"',
  600: '2"', 750: '2"', 900: '2"',
};

function getSize(table: Record<number, string>, dn: number): string {
  return table[dn] || table[Object.keys(table).map(Number).reduce((a, b) => Math.abs(b - dn) < Math.abs(a - dn) ? b : a)];
}

function getPN(P0_kgcm2: number | null): string {
  const p = P0_kgcm2 ?? 3.0;
  const pBar = p * 0.981 * 1.30; // 30% transient margin
  if (pBar <= 10) return "PN 10";
  if (pBar <= 16) return "PN 16";
  return "PN 25";
}

function getNote(type: string, dn: number): string {
  // Con 2" disponible ya no se requieren pares de 1" en paralelo; en lineas muy
  // grandes la capacidad de purga se confirma con la curva del fabricante.
  if (dn >= 750 && (type === "VA-E" || type === "VA-C")) return "Linea ≥ 30\": confirmar capacidad de purga con la curva del fabricante";
  return "";
}

// ── Hazen-Williams friction loss for a segment ──
function hfSegment(Q: number, D_m: number, C: number, L: number): number {
  if (Q <= 0 || D_m <= 0 || L <= 0) return 0;
  return 10.67 * L * Math.pow(Q, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}

// ── Main calculation ──
export function calculateAirValves(input: AirValveInputs): AirValveOutputs | null {
  const { Q, DN_mm, C, P0_kgcm2, pressureMin, maxSpacing, vertices } = input;
  if (vertices.length < 2) return null;

  const sorted = [...vertices].sort((a, b) => a.dist - b.dist);
  const D_m = (input.diametroInterior_mm ?? DN_mm) / 1000;
  const pn = getPN(P0_kgcm2);
  const hasHydraulics = Q != null && Q > 0 && P0_kgcm2 != null;
  const alerts: string[] = [];

  // Step 1: Calculate pressures at each vertex
  const pressures: (number | null)[] = [];
  if (hasHydraulics) {
    pressures[0] = P0_kgcm2! * 10; // kg/cm2 to m.c.a.
    for (let i = 0; i < sorted.length - 1; i++) {
      const L = sorted[i + 1].dist - sorted[i].dist;
      const hf = hfSegment(Q!, D_m, C, L);
      pressures[i + 1] = pressures[i]! + sorted[i].cota - sorted[i + 1].cota - hf;
    }
  } else {
    for (let i = 0; i < sorted.length; i++) pressures[i] = null;
  }

  // Profile points for chart
  const profilePoints = sorted.map((v, i) => ({ dist: v.dist, cota: v.cota, pressure: pressures[i] ?? null }));

  // Extremos SIGNIFICATIVOS del perfil (poda por amplitud): los perfiles satelitales
  // traen 30-40 vertices y cada ondulacion de 1-2 m marcaba punto alto/bajo, inundando
  // de valvulas y desagues. Solo cuentan los que sobresalen >= UMBRAL de su entorno.
  // Cotas satelitales (SRTM, precision vertical 16 m al 90 %, USGS): una loma de menos de
  // 5 m no se distingue del error y se ignora (criterio de la plataforma, sin fuente
  // normativa). Con topografia de campo NO se filtra: todo punto alto real lleva valvula
  // (AWWA M51); se deja 1 m para no reaccionar al redondeo de la nivelacion.
  const UMBRAL_EXTREMO_M = input.cotasSatelitales === false ? 1 : 5;
  const cotas = sorted.map((v) => v.cota);
  type Ext = { i: number; tipo: "alto" | "bajo" };
  const exts: Ext[] = [];
  for (let i = 1; i < cotas.length - 1; i++) {
    if (cotas[i] > cotas[i - 1] && cotas[i] >= cotas[i + 1]) exts.push({ i, tipo: "alto" });
    else if (cotas[i] < cotas[i - 1] && cotas[i] <= cotas[i + 1]) exts.push({ i, tipo: "bajo" });
  }
  // Poda iterativa: elimina el par adyacente de extremos con la menor amplitud
  // mientras esa amplitud quede por debajo del umbral
  for (;;) {
    let peor = -1, peorAmp = Infinity;
    for (let k = 0; k + 1 < exts.length; k++) {
      const amp = Math.abs(cotas[exts[k].i] - cotas[exts[k + 1].i]);
      if (amp < peorAmp) { peorAmp = amp; peor = k; }
    }
    if (peor < 0 || peorAmp >= UMBRAL_EXTREMO_M) break;
    exts.splice(peor, 2);
  }
  // Verificacion final contra los vecinos conservados (y los bordes de la serie).
  // Significativo = sobresale >= UMBRAL completo hacia AL MENOS un lado y >= 1 m
  // hacia el otro. Asi: (a) una cresta con caida fuerte adelante NO se descarta por
  // subir poco desde atras (auditoria: pico +2 m atras / -5.7 m adelante quedaba sin
  // VA-C); (b) lomas/valles de 2.5-4.9 m se tratan como ruido de forma uniforme,
  // vengan solos, en par o en tren impar (antes el umbral efectivo era 2.5 m solo
  // para extremos aislados).
  const refs = [0, ...exts.map((e) => e.i), cotas.length - 1];
  const altosSig = new Set<number>();
  const bajosSig = new Set<number>();
  exts.forEach((e) => {
    const pos = refs.indexOf(e.i);
    const izq = cotas[refs[pos - 1]], der = cotas[refs[pos + 1]];
    const d1 = e.tipo === "alto" ? cotas[e.i] - izq : izq - cotas[e.i];
    const d2 = e.tipo === "alto" ? cotas[e.i] - der : der - cotas[e.i];
    if (Math.max(d1, d2) >= UMBRAL_EXTREMO_M && Math.min(d1, d2) >= 1) {
      (e.tipo === "alto" ? altosSig : bajosSig).add(e.i);
    }
  });

  // Step 3: Apply rules — collect candidate valves
  // Criterio AWWA M51 (tabla de ubicacion de valvulas de aire), el mismo del diagrama
  // de fabricante que usan los proyectistas:
  //   Descarga de bomba ............................ admision y expulsion (VA-A)
  //   Inicio de linea por gravedad, punto alto,
  //   inicio y fin de tramo horizontal,
  //   aumenta la pendiente de bajada ............... combinada (VA-C)
  //   Disminuye la pendiente de subida ............. admision y expulsion (o combinada)
  //   Tramo horizontal largo ....................... eliminadora; combinada si el golpe hace vacio
  //   Ascenso largo, cada maxSpacing ............... admision y expulsion (o combinada)
  //   Descenso largo, cada maxSpacing .............. eliminadora; combinada si el golpe hace vacio
  //                                                  o si aun no se calcula el golpe (lado seguro)
  //   Aumenta la pendiente de subida, disminuye la
  //   pendiente de bajada .......................... ninguna
  //   Punto bajo ................................... ninguna: desfogue
  //   Llegada a tanque (si no llega bajando) ....... admision y expulsion con descarga libre;
  //                                                  combinada si llega ahogada o no se indica
  //   Los puntos bajos NO llevan valvula de aire: llevan desfogue (se avisa).
  //   La presion baja o negativa NO se corrige con valvulas de aire: se avisa como problema de diseno.
  type Candidate = { dist: number; cota: number; pressure: number | null; type: "VA-C" | "VA-A" | "VA-E"; reason: string };
  const candidates: Candidate[] = [];

  // Inicio por bombeo — admision y expulsion en la descarga de la bomba (antes de la check),
  // AWWA M51. El inicio por gravedad se decide mas abajo, con la pendiente del primer tramo.
  if (input.esBombeo) {
    candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: "VA-A", reason: "Descarga de bomba (antes de la valvula check)" });
  }
  // Fin — SOLO si la llegada NO es descendente: en un punto bajo el aire no se acumula
  // (una linea que baja uniformemente no necesita valvula al final)
  const last = sorted.length - 1;
  const llegadaDescendente = sorted[last].cota < sorted[last - 1].cota;
  // AWWA M51 admite admision y expulsion o combinada en la llegada. Con descarga libre el
  // aire que llega en operacion sale con el agua: no hace falta la purga de la combinada.
  if (!llegadaDescendente) {
    if (input.llegadaLibre === true) {
      candidates.push({ dist: sorted[last].dist, cota: sorted[last].cota, pressure: pressures[last], type: "VA-A", reason: "Llegada al tanque con descarga libre (el aire en operacion sale con el agua)" });
    } else {
      candidates.push({ dist: sorted[last].dist, cota: sorted[last].cota, pressure: pressures[last], type: "VA-C", reason: input.llegadaLibre === false ? "Llegada al tanque ahogada o con valvula de llenado (el aire se junta al final)" : "Fin de linea (llegada plana/ascendente)" });
      if (input.llegadaLibre == null) {
        alerts.push("Indica cómo llega el agua al tanque. Si cae libre, AWWA M51 permite en la llegada una válvula de admisión y expulsión, más sencilla que la combinada que se puso.");
      }
    }
  }

  const puntosBajos: { dist: number; cota: number }[] = [];
  for (let i = 1; i < sorted.length - 1; i++) {
    // Solo los extremos SIGNIFICATIVOS (≥ umbral de prominencia) cuentan como alto/bajo
    const isHighPoint = altosSig.has(i);
    const isLowPoint = bajosSig.has(i);
    const p = pressures[i];

    // Punto alto → VA-C (el aire se acumula y hay riesgo de vacio al vaciar la linea)
    if (isHighPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-C", reason: "Punto alto — acumulacion de aire" });
    }

    // Punto bajo → desague recomendado, NO valvula de aire (se agrega a los avisos)
    if (isLowPoint) puntosBajos.push({ dist: sorted[i].dist, cota: sorted[i].cota });

  }

  // Quiebres de pendiente SIGNIFICATIVOS: simplificacion gruesa del perfil (DP con
  // el mismo umbral de 5 m) y las reglas de cambio de pendiente SOLO aplican en esos
  // vertices macro, con pendientes NETAS entre ellos. Antes corrian sobre cada par de
  // vertices satelitales y cada escalon del terreno disparaba una valvula.
  const dpKeep = new Set<number>([0, last]);
  (function dp(i0: number, i1: number) {
    if (i1 - i0 < 2) return;
    let peor = -1, peorDesv = 0;
    for (let i = i0 + 1; i < i1; i++) {
      const f = (sorted[i].dist - sorted[i0].dist) / ((sorted[i1].dist - sorted[i0].dist) || 1);
      const cotaLinea = sorted[i0].cota + f * (sorted[i1].cota - sorted[i0].cota);
      const desv = Math.abs(sorted[i].cota - cotaLinea);
      if (desv > peorDesv) { peorDesv = desv; peor = i; }
    }
    if (peor >= 0 && peorDesv > UMBRAL_EXTREMO_M) { dpKeep.add(peor); dp(i0, peor); dp(peor, i1); }
  })(0, last);
  const macro = Array.from(dpKeep).sort((a, b) => a - b);
  // Inicio de una linea por gravedad: AWWA M51 no lo lista por si mismo. Lleva combinada
  // solo si es punto alto (la linea baja desde el tanque) o arranca un tramo horizontal;
  // si la linea sube desde el tanque, el aire sale por el siguiente punto alto.
  if (!input.esBombeo && macro.length >= 2) {
    const b0 = macro[1];
    const pend0 = ((sorted[b0].cota - sorted[0].cota) / ((sorted[b0].dist - sorted[0].dist) || 1)) * 100;
    if (pend0 < -1) {
      candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: "VA-C", reason: "Inicio de linea — punto alto (la linea baja desde el tanque)" });
    } else if (Math.abs(pend0) <= 1) {
      candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: "VA-C", reason: "Inicio de linea — inicio de tramo horizontal" });
    } else {
      alerts.push("La línea sube desde el inicio: AWWA M51 no pide válvula de aire ahí; el aire sale por el siguiente punto alto.");
    }
  }
  for (let k = 1; k <= macro.length - 2; k++) {
    const j = macro[k];
    if (altosSig.has(j) || bajosSig.has(j)) continue; // los extremos ya tienen su propio tratamiento
    const a = macro[k - 1], b = macro[k + 1];
    const pendA = ((sorted[j].cota - sorted[a].cota) / ((sorted[j].dist - sorted[a].dist) || 1)) * 100;
    const pendB = ((sorted[b].cota - sorted[j].cota) / ((sorted[b].dist - sorted[j].dist) || 1)) * 100;
    const p = pressures[j];
    const plano = (x: number) => Math.abs(x) <= 1;
    // Subida que llega a tramo horizontal → combinada (AWWA M51: inicio de horizontal)
    if (pendA > 1 && plano(pendB)) {
      candidates.push({ dist: sorted[j].dist, cota: sorted[j].cota, pressure: p, type: "VA-C", reason: "Inicio de tramo horizontal" });
    }
    // Tramo horizontal que termina en subida o en bajada → combinada (fin de horizontal)
    else if (plano(pendA) && (pendB > 1 || pendB < -1)) {
      candidates.push({ dist: sorted[j].dist, cota: sorted[j].cota, pressure: p, type: "VA-C", reason: pendB > 1 ? "Fin de tramo horizontal" : "Fin de tramo horizontal — inicia la bajada" });
    }
    // La subida se aplana (sigue subiendo, con menos pendiente): el aire se junta ahi y al
    // vaciar entra aire → admision y expulsion (o combinada)
    else if (pendA > 1 && pendB > 1 && pendB < pendA - 2) {
      candidates.push({ dist: sorted[j].dist, cota: sorted[j].cota, pressure: p, type: "VA-A", reason: "Disminuye la pendiente de subida (o combinada)" });
    }
    // La bajada se hace mas pronunciada → combinada (riesgo de vacio y aire en operacion)
    else if (pendA < -1 && pendB < pendA - 3) {
      candidates.push({ dist: sorted[j].dist, cota: sorted[j].cota, pressure: p, type: "VA-C", reason: "Aumenta la pendiente de bajada" });
    }
    // Aumenta la pendiente de subida o disminuye la de bajada → ninguna (AWWA M51)
  }

  // Corridas largas (AWWA M51), cada maxSpacing:
  //   ascendente → VA-A admision y expulsion (o combinada)
  //   plana → VA-E eliminadora (o combinada)
  //   descendente → VA-E eliminadora, o VA-C si el golpe de ariete hace vacio (M51 admite ambas)
  const interpola = (d: number) => {
    let k = 0;
    while (k < sorted.length - 2 && sorted[k + 1].dist <= d) k++;
    const L = sorted[k + 1].dist - sorted[k].dist;
    const frac = L > 0 ? (d - sorted[k].dist) / L : 0;
    const cota = sorted[k].cota + frac * (sorted[k + 1].cota - sorted[k].cota);
    const pr = pressures[k] != null && pressures[k + 1] != null ? pressures[k]! + frac * (pressures[k + 1]! - pressures[k]!) : null;
    return { cota, pr };
  };
  // Las corridas se miden SOLO entre extremos SIGNIFICATIVOS (auditoria: un extremo
  // podable que sobrevive la poda pero no es significativo no genera valvula ni
  // desague, y aun asi partia la corrida y reiniciaba el conteo — una bajada de 3 km
  // con terracitas planas quedaba con CERO VA-A). Cada valvula periodica se clasifica
  // por la pendiente LOCAL del tramo macro (DP) donde cae: una meseta dentro de una
  // corrida descendente recibe purga (VA-E), no proteccion de vacio (auditoria:
  // meseta de cumbre recibia VA-A con razon "tramo descendente" sobre pendiente 0%).
  const nodos = Array.from(new Set([0, ...altosSig, ...bajosSig, last])).sort((a, b) => a - b);
  const pendienteLocal = (d: number) => {
    let k = 0;
    while (k < macro.length - 2 && sorted[macro[k + 1]].dist <= d) k++;
    const L = sorted[macro[k + 1]].dist - sorted[macro[k]].dist;
    return L > 0 ? ((sorted[macro[k + 1]].cota - sorted[macro[k]].cota) / L) * 100 : 0;
  };
  const dH = input.golpeDeltaH != null && input.golpeDeltaH > 0 ? input.golpeDeltaH : null;
  const vacioEn = (pr: number | null): boolean | null => dH != null && pr != null ? pr - dH < 0 : null;
  let vacioCambia = 0, sinGolpeDesc = 0, sinGolpeHor = 0;
  for (let k = 0; k + 1 < nodos.length; k++) {
    const runStart = sorted[nodos[k]].dist;
    const runEnd = sorted[nodos[k + 1]].dist;
    if (runEnd - runStart <= maxSpacing) continue;
    for (let d = runStart + maxSpacing; d < runEnd - 1; d += maxSpacing) {
      // Si ya hay una valvula cerca (quiebre, punto alto, inicio/fin), esa cubre este tramo
      if (candidates.some((c) => Math.abs(c.dist - d) < 0.4 * maxSpacing)) continue;
      const { cota, pr } = interpola(d);
      const pend = pendienteLocal(d);
      // AWWA M51 admite eliminadora o combinada en descensos y tramos horizontales largos.
      // La eliminadora (orificio chico) no deja entrar aire suficiente si se forma vacio:
      // se revisa con el golpe de ariete (presion de operacion - ΔH < 0 = vacio).
      const vacio = vacioEn(pr);
      let tipo: "VA-A" | "VA-E" | "VA-C";
      let reason: string;
      if (pend > 1) {
        tipo = "VA-A"; reason = "Ascenso largo (o combinada)";
      } else if (pend < -1) {
        if (vacio === false) { tipo = "VA-E"; reason = "Descenso largo — purga de aire (sin vacio con el golpe de ariete)"; }
        else if (vacio === true) { tipo = "VA-C"; reason = "Descenso largo — combinada: con el golpe de ariete se forma vacio"; vacioCambia++; }
        else { tipo = "VA-C"; reason = "Descenso largo — combinada (falta revisar el vacio con el golpe de ariete)"; sinGolpeDesc++; }
      } else {
        if (vacio === true) { tipo = "VA-C"; reason = "Tramo horizontal largo — combinada: con el golpe de ariete se forma vacio"; vacioCambia++; }
        else { tipo = "VA-E"; reason = "Tramo horizontal largo — purga de aire (o combinada)"; if (vacio == null) sinGolpeHor++; }
      }
      candidates.push({ dist: d, cota, pressure: pr, type: tipo, reason });
    }
  }

  // El punto MAS BAJO real del perfil siempre merece desfogue (aunque desemboque en
  // un tramo plano y la prominencia de dos lados no lo marque), si es interior y
  // el perfil tiene relieve suficiente
  const iMin = cotas.indexOf(Math.min(...cotas));
  if (iMin > 0 && iMin < last && Math.max(...cotas) - cotas[iMin] >= UMBRAL_EXTREMO_M && !puntosBajos.some((p) => p.dist === sorted[iMin].dist)) {
    puntosBajos.push({ dist: sorted[iMin].dist, cota: sorted[iMin].cota });
    puntosBajos.sort((x, y) => x.dist - y.dist);
  }

  // El punto MAS ALTO real del perfil siempre merece valvula combinada (espejo del
  // minimo global; auditoria): una cresta justo antes de la entrega puede caer <1 m
  // hacia el tanque y perder a la vez la prominencia local y el VA-C de fin de linea,
  // dejando sin valvula el punto donde mas aire se acumula
  const iMax = cotas.indexOf(Math.max(...cotas));
  if (iMax > 0 && iMax < last && cotas[iMax] - Math.min(...cotas) >= UMBRAL_EXTREMO_M && !altosSig.has(iMax)) {
    candidates.push({ dist: sorted[iMax].dist, cota: sorted[iMax].cota, pressure: pressures[iMax], type: "VA-C", reason: "Punto alto — maximo del perfil" });
  }

  // Avisos del criterio de los tramos largos (descensos y horizontales)
  if (vacioCambia > 0) {
    alerts.push(`Con el golpe de ariete calculado (sobrepresión de ${Math.round(dH!)} m) la presión cae a vacío en ${vacioCambia} punto(s) de tramos largos: ahí va combinada y no eliminadora, porque la eliminadora no deja entrar aire suficiente.`);
  }
  if (sinGolpeDesc + sinGolpeHor > 0) {
    const falta = dH == null ? "Falta calcular el golpe de ariete (módulo Golpe de ariete)" : "Falta el caudal o la presión de operación";
    const partes: string[] = [];
    if (sinGolpeDesc > 0) partes.push("los descensos largos llevan combinada por seguridad; si no hay vacío, AWWA M51 permite eliminadora, que es más sencilla");
    if (sinGolpeHor > 0) partes.push("los tramos planos largos llevan eliminadora; si hay vacío, deben llevar combinada");
    alerts.push(`${falta} para revisar el vacío en los tramos largos: ${partes.join("; ")}.`);
  }
  if (input.cotasSatelitales === true) {
    alerts.push("Las válvulas se ubicaron con cotas del mapa (satelitales): confirma los puntos altos, bajos y cambios de pendiente con topografía de campo antes del proyecto ejecutivo.");
  }

  // Avisos de diseno (no son valvulas)
  if (hasHydraulics) {
    const negativos = sorted.map((v, i) => ({ v, p: pressures[i] })).filter((x) => x.p != null && x.p < 0);
    if (negativos.length > 0) {
      alerts.push(`Presion NEGATIVA en operacion en ${negativos.length} punto(s) del perfil (desde los ${Math.round(negativos[0].v.dist).toLocaleString("es-MX")} m). Las valvulas de aire NO corrigen esto: revisa el diametro, el trazo o si la linea requiere bombeo.`);
    } else {
      const bajos = sorted.filter((v, i) => pressures[i] != null && pressures[i]! < pressureMin);
      if (bajos.length > 0) alerts.push(`Presion por debajo de ${pressureMin} m.c.a. en ${bajos.length} punto(s): verifica con el fabricante que la valvula de aire selle a baja presion.`);
    }
  }
  // Un solo aviso con TODOS los puntos bajos significativos (antes era uno por punto)
  if (puntosBajos.length > 0) {
    const lista = puntosBajos.slice(0, 6).map((p) => `${Math.round(p.dist).toLocaleString("es-MX")} m`).join(" · ");
    const extra = puntosBajos.length > 6 ? ` (y ${puntosBajos.length - 6} más)` : "";
    alerts.push(`Puntos bajos del perfil (a los ${lista}${extra} del inicio): no llevan válvula de aire — se recomienda un desfogue para drenado y limpieza en cada uno. Puedes armar esos cruceros en el Generador de cruceros.`);
  }

  // Step 4: Deduplicate — within 30m, keep each type's highest priority
  // But DON'T merge different types — a location can have both VA-C and VA-E
  const sortedCandidates = candidates.sort((a, b) => a.dist - b.dist);
  const deduped: Candidate[] = [];

  for (const c of sortedCandidates) {
    // Check if there's already a valve of the SAME type within 30m
    const nearbySameType = deduped.find(d => Math.abs(d.dist - c.dist) < 30 && d.type === c.type);
    if (nearbySameType) continue; // skip duplicate of same type

    // Check if there's a HIGHER priority type within 30m
    const hierarchy: Record<string, number> = { "VA-C": 3, "VA-A": 2, "VA-E": 1 };
    const nearbyHigher = deduped.find(d => Math.abs(d.dist - c.dist) < 30 && hierarchy[d.type] > hierarchy[c.type]);
    if (nearbyHigher) {
      // VA-C already covers VA-A and VA-E functions, skip lower types
      continue;
    }

    // Check if we're adding a higher type near a lower one — replace
    const nearbyLower = deduped.findIndex(d => Math.abs(d.dist - c.dist) < 30 && hierarchy[d.type] < hierarchy[c.type]);
    if (nearbyLower >= 0) {
      deduped[nearbyLower] = c; // replace with higher priority
    } else {
      deduped.push(c);
    }
  }

  // Step 5: Convert to results with sizing
  const valves: AirValveResult[] = deduped.map((c) => {
    let bodySize: string;
    let orificeSize: string;

    if (c.type === "VA-C") {
      bodySize = getSize(VAC_BODY, DN_mm);
      orificeSize = getSize(VAC_ORIFICE, DN_mm);
    } else if (c.type === "VA-A") {
      bodySize = getSize(VAA_SIZE, DN_mm);
      orificeSize = bodySize;
    } else {
      bodySize = getSize(VAE_SIZE, DN_mm);
      orificeSize = bodySize;
    }

    // Alerta por presion: critica si es negativa, baja si esta bajo el minimo de sello
    const alert: "critical" | "low" | null = c.pressure != null && c.pressure < 0 ? "critical" : c.pressure != null && c.pressure < pressureMin ? "low" : null;

    return {
      dist: c.dist,
      cota: c.cota,
      pressure: c.pressure,
      type: c.type,
      bodySize,
      orificeSize,
      pn,
      reason: c.reason,
      alert,
      note: getNote(c.type, DN_mm),
    };
  }).sort((a, b) => a.dist - b.dist);

  // Count
  const totalVAC = valves.filter((v) => v.type === "VA-C").length;
  const totalVAA = valves.filter((v) => v.type === "VA-A").length;
  const totalVAE = valves.filter((v) => v.type === "VA-E").length;

  if (totalVAC === 0 && totalVAA === 0 && totalVAE === 0) {
    alerts.push("No se encontraron ubicaciones para valvulas de aire con el perfil ingresado.");
  }

  return { valves, profilePoints, totalVAC, totalVAA, totalVAE, alerts, desagues: puntosBajos };
}
