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
  // Bombeo desde pozo o bomba vertical: AWWA M51 (p. 19 y 42) pide combinada con dispositivo
  // de cierre lento entre la bomba y la check
  esPozo?: boolean;
  // false (default) = combinada donde la tabla de M51 da opcion (M51 p. 44: "usar combinadas
  // siempre que sea posible"); true = la opcion mas sencilla que permite la tabla (fig. 3-1)
  opcionSencilla?: boolean;
  // Coeficiente de Chezy del tubo para el tamaño por ruptura de linea (M51 ec. 4-6, p. 31):
  // 190 PVC, 110 hierro, 130 acero, 120 concreto
  chezyC?: number | null;
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

// ── Tamaño por AWWA M51, capitulo 4 ──
// Sello: las valvulas se prueban a 20 psi minimo (M51 p. 35-36) = 14.06 m
const SELLO_MIN_M = 14.06;
// Capacidad de un orificio de d pulgadas (Cd 0.6), proporcional al area (d²):
//   entrada de aire a 5 psi de vacio (tabla 4-3, p. 30: 1" = 125 SCFM, 2" = 502 SCFM)
//   salida de aire al llenar a 2 psi (tabla 4-2, p. 27: 1" = 95 SCFM, 2" = 379 SCFM)
const CAP_VACIO_5PSI = 125.4;
const CAP_LLENADO_2PSI = 94.8;
const M3S_A_SCFM = 2118.88;
// Tamaños comerciales de valvula de aire (pulgadas)
const TAMANOS: [number, string][] = [[0.5, '1/2"'], [0.75, '3/4"'], [1, '1"'], [2, '2"'], [3, '3"'], [4, '4"'], [6, '6"'], [8, '8"']];

// Flujo por gravedad si la linea se rompe (M51 ec. 4-6, p. 31): Q = 0.0472 C √(S·ID⁵), SCFM
function flujoRuptura(S: number, idIn: number, chezy: number): number {
  if (S <= 0) return 0;
  return 0.0472 * chezy * Math.sqrt(Math.min(S, 1) * Math.pow(idIn, 5));
}

// ── Hazen-Williams friction loss for a segment ──
function hfSegment(Q: number, D_m: number, C: number, L: number): number {
  if (Q <= 0 || D_m <= 0 || L <= 0) return 0;
  return 10.67 * L * Math.pow(Q, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}

// ── Main calculation ──
export function calculateAirValves(input: AirValveInputs): AirValveOutputs | null {
  const { Q, DN_mm, C, P0_kgcm2, maxSpacing, vertices } = input;
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
  // Criterio AWWA M51, figura 3-1 (p. 18) y lista de ubicaciones (p. 19). Donde la tabla da
  // dos opciones se usa combinada (M51 p. 44: combinadas siempre que sea posible), salvo que el
  // usuario pida la opcion sencilla (opcionSencilla):
  //   Descarga de bomba ............................ combinada (sencilla: admision y expulsion);
  //                                                  pozo: combinada con cierre lento (p. 19, 42)
  //   Punto alto, inicio y fin de tramo horizontal,
  //   aumenta la pendiente de bajada ............... combinada
  //   Disminuye la pendiente de subida, ascenso largo  combinada (sencilla: admision y expulsion)
  //   Tramo horizontal y descenso largos ........... combinada (sencilla: eliminadora; combinada si hay vacio)
  //   Aumenta la pendiente de subida, disminuye la
  //   pendiente de bajada .......................... ninguna
  //   Punto bajo ................................... ninguna: desfogue (drain valve en la figura 3-1)
  //   Llegada a tanque ............................. descarga libre: ninguna (figura 3-1);
  //                                                  ahogada o sin indicar: combinada
  //   La presion baja o negativa NO se corrige con valvulas de aire: se avisa como problema de diseno.
  type Candidate = { dist: number; cota: number; pressure: number | null; type: "VA-C" | "VA-A" | "VA-E"; reason: string };
  const candidates: Candidate[] = [];

  // Inicio por bombeo — admision y expulsion en la descarga de la bomba (antes de la check),
  // AWWA M51. El inicio por gravedad se decide mas abajo, con la pendiente del primer tramo.
  // M51 fig. 3-1 (p. 18): descarga de bomba, admision y expulsion o combinada
  const simple = input.opcionSencilla === true;
  const opcion = (t: "VA-A" | "VA-E"): "VA-C" | "VA-A" | "VA-E" => (simple ? t : "VA-C");
  if (input.esBombeo) {
    if (input.esPozo) {
      candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: "VA-C", reason: "Descarga de bomba de pozo — combinada con dispositivo de cierre lento, entre la bomba y la check" });
    } else {
      candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: opcion("VA-A"), reason: "Descarga de bomba (antes de la valvula check)" });
    }
  }
  // Fin — SOLO si la llegada NO es descendente: en un punto bajo el aire no se acumula
  // (una linea que baja uniformemente no necesita valvula al final)
  const last = sorted.length - 1;
  const llegadaDescendente = sorted[last].cota < sorted[last - 1].cota;
  // AWWA M51 admite admision y expulsion o combinada en la llegada. Con descarga libre el
  // aire que llega en operacion sale con el agua: no hace falta la purga de la combinada.
  if (!llegadaDescendente) {
    if (input.llegadaLibre === true) {
      // M51 fig. 3-1: la linea entra libre al tanque y ahi no lleva valvula (el extremo esta abierto)
      alerts.push("Llegada al tanque con descarga libre: ahí no va válvula de aire, el extremo está abierto a la atmósfera (AWWA M51, figura 3-1, p. 18).");
    } else {
      candidates.push({ dist: sorted[last].dist, cota: sorted[last].cota, pressure: pressures[last], type: "VA-C", reason: input.llegadaLibre === false ? "Llegada al tanque ahogada o con valvula de llenado (el aire se junta al final)" : "Fin de linea (llegada plana/ascendente)" });
      if (input.llegadaLibre == null) {
        alerts.push("Indica cómo llega el agua al tanque. Si cae libre, la llegada no lleva válvula de aire (AWWA M51, figura 3-1); se dejó combinada mientras no se indique.");
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
      candidates.push({ dist: sorted[j].dist, cota: sorted[j].cota, pressure: p, type: opcion("VA-A"), reason: "Disminuye la pendiente de subida" });
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
        tipo = opcion("VA-A"); reason = "Ascenso largo";
      } else if (!simple) {
        tipo = "VA-C"; reason = pend < -1 ? "Descenso largo" : "Tramo horizontal largo";
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

  // Step 5: tamaño. Combinada y admision/expulsion por el metodo de AWWA M51 (cap. 4):
  // el orificio grande debe sacar el aire al llenar a 0.3 m/s (p. 26-28) y dejar entrar el
  // aire si la linea se rompe y se vacia por gravedad (p. 28-31), a 5 psi de vacio (tubo
  // enterrado, no sujeto a colapso, p. 31). La eliminadora purga en operacion: con el 2 %
  // del gasto (p. 23-26) basta el orificio mas chico, se usa la tabla por diametro.
  const idIn = (input.diametroInterior_mm ?? DN_mm) / 25.4;
  const areaM2 = Math.PI * Math.pow((input.diametroInterior_mm ?? DN_mm) / 1000, 2) / 4;
  const chezy = input.chezyC ?? 190;
  const qLlenado = 0.3 * areaM2 * M3S_A_SCFM * (16.7 / 14.7); // SCFM a 2 psi
  const pendMacro = (k: number) => {
    const a = macro[k], b = macro[k + 1];
    return (sorted[b].cota - sorted[a].cota) / ((sorted[b].dist - sorted[a].dist) || 1);
  };
  const pendientesEn = (d: number): { antes: number | null; despues: number | null; enVertice: boolean } => {
    const kv = macro.findIndex((m) => Math.abs(sorted[m].dist - d) < 1);
    if (kv >= 0) return { antes: kv > 0 ? pendMacro(kv - 1) : null, despues: kv < macro.length - 1 ? pendMacro(kv) : null, enVertice: true };
    let k = 0;
    while (k < macro.length - 2 && sorted[macro[k + 1]].dist <= d) k++;
    const sk = pendMacro(k);
    return { antes: sk, despues: sk, enVertice: false };
  };
  const aireRuptura = (d: number): number => {
    const { antes, despues, enVertice } = pendientesEn(d);
    const Qg = (S: number | null) => flujoRuptura(Math.abs(S ?? 0), idIn, chezy);
    if (!enVertice) return Qg(antes);
    // Cambio de pendiente sin cambiar de sentido: la diferencia entre el flujo del tramo de
    // abajo y el de arriba (M51 p. 29-31)
    if (antes != null && despues != null && antes < 0 && despues < 0) return Math.max(0, Qg(despues) - Qg(antes));
    if (antes != null && despues != null && antes > 0 && despues > 0) return Math.max(0, Qg(antes) - Qg(despues));
    // Punto alto, inicio/fin de tramo horizontal o extremo: el tramo que baja alejandose de la valvula
    const bajaAtras = antes != null && antes > 0 ? Qg(antes) : 0;
    const bajaAdelante = despues != null && despues < 0 ? Qg(despues) : 0;
    return Math.max(bajaAtras, bajaAdelante);
  };
  let maxPorRuptura = 0;
  const valves: AirValveResult[] = deduped.map((c) => {
    let bodySize: string;
    let orificeSize: string;
    let nota = getNote(c.type, DN_mm);

    if (c.type === "VA-E") {
      bodySize = getSize(VAE_SIZE, DN_mm);
      orificeSize = bodySize;
    } else {
      const qr = aireRuptura(c.dist);
      const dReq = Math.sqrt(Math.max(qr / CAP_VACIO_5PSI, qLlenado / CAP_LLENADO_2PSI));
      const sel = TAMANOS.find(([d]) => d >= dReq - 1e-6);
      bodySize = sel ? sel[1] : '8"';
      if (!sel) nota = "Requiere más de 8\": varias válvulas en grupo o rompedor de vacío (AWWA M51, p. 34-36)";
      if (qr / CAP_VACIO_5PSI >= qLlenado / CAP_LLENADO_2PSI) maxPorRuptura++;
      orificeSize = c.type === "VA-C" ? getSize(VAC_ORIFICE, DN_mm) : bodySize;
      const ls = (x: number) => Math.round(x * 0.4719);
      const det = `M51: aire si se rompe la línea ${ls(qr)} L/s, llenado ${ls(qLlenado)} L/s`;
      nota = nota ? `${nota}; ${det}` : det;
    }
    // Vacio por golpe de ariete: M51 (p. 19, 37-38) pide dispositivo de cierre lento
    if (c.type !== "VA-E" && vacioEn(c.pressure) === true) nota = `Con dispositivo de cierre lento (vacío por golpe); ${nota}`;

    // Alerta por presion: critica si es negativa, baja si esta bajo el minimo de sello
    const alert: "critical" | "low" | null = c.pressure != null && c.pressure < 0 ? "critical" : c.pressure != null && c.pressure < SELLO_MIN_M ? "low" : null;

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
      note: nota,
    };
  }).sort((a, b) => a.dist - b.dist);

  // Avisos de tamaño, sello y vacio (AWWA M51)
  const grandes = valves.filter((v) => v.type !== "VA-E");
  if (grandes.length > 0) {
    alerts.push(`Tamaño por el método de AWWA M51 (cap. 4): la válvula debe sacar el aire al llenar la línea a 0.3 m/s y dejar entrar el aire si la línea se rompe y se vacía por gravedad.${maxPorRuptura > 0 ? ` En ${maxPorRuptura} válvula(s) manda la ruptura: depende de la pendiente del tubo.` : ""} Confirma con las curvas del fabricante.`);
  }
  const bajos = valves.filter((v) => v.alert === "low").length;
  if (bajos > 0) {
    alerts.push(`${bajos} válvula(s) operan con menos de 14 m (20 psi): especifica al fabricante que la válvula selle a esa presión. AWWA M51 (p. 35-36) indica que se prueban a 20 psi como mínimo.`);
  }
  const conVacio = valves.filter((v) => v.type !== "VA-E" && vacioEn(v.pressure) === true).length;
  if (conVacio > 0) {
    alerts.push(`Con el golpe de ariete calculado, ${conVacio} válvula(s) quedan en zona de vacío: deben llevar dispositivo de cierre lento para no provocar un segundo golpe al expulsar el aire (AWWA M51, p. 19 y 37-38). Confirma ubicación y tamaño con un análisis de transitorios.`);
  }
  // Instalacion (M51 p. 46-47)
  if (valves.some((v) => v.type !== "VA-A") && DN_mm <= 300) {
    alerts.push("Instalación: monta la combinada y la eliminadora sobre una tee del mismo diámetro de la línea (por ejemplo 6\"×6\") con reducción a la válvula, y válvula de seccionamiento abajo. Ese tramo vertical junta el aire para que la válvula lo saque (AWWA M51, p. 46-47).");
  }

  // Count
  const totalVAC = valves.filter((v) => v.type === "VA-C").length;
  const totalVAA = valves.filter((v) => v.type === "VA-A").length;
  const totalVAE = valves.filter((v) => v.type === "VA-E").length;

  if (totalVAC === 0 && totalVAA === 0 && totalVAE === 0) {
    alerts.push("No se encontraron ubicaciones para valvulas de aire con el perfil ingresado.");
  }

  return { valves, profilePoints, totalVAC, totalVAA, totalVAE, alerts, desagues: puntosBajos };
}
