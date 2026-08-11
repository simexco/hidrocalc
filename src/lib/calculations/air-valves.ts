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
  C: number;
  P0_kgcm2: number | null;
  pressureMin: number;    // m.c.a.
  maxSpacing: number;     // m
  vertices: AirValveVertex[];
}

export interface AirValveOutputs {
  valves: AirValveResult[];
  profilePoints: { dist: number; cota: number; pressure: number | null }[];
  totalVAC: number;
  totalVAA: number;
  totalVAE: number;
  alerts: string[];
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
  const D_m = DN_mm / 1000;
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

  // Step 2: Calculate slopes (%)
  const slopes: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const dz = sorted[i + 1].cota - sorted[i].cota;
    const dx = sorted[i + 1].dist - sorted[i].dist;
    slopes[i] = dx > 0 ? (dz / dx) * 100 : 0;
  }

  // Step 3: Apply rules — collect candidate valves
  // Criterio (CONAGUA MAPAS / AWWA M51):
  //   VA-C en inicio, fin (si no llega bajando) y puntos altos.
  //   VA-E donde el aire se acumula en operacion (la subida se aplana, arranca un ascenso)
  //        y cada maxSpacing en corridas largas ascendentes o planas.
  //   VA-A donde hay riesgo de vacio (la bajada se hace mas pronunciada)
  //        y cada maxSpacing en corridas largas descendentes.
  //   Los puntos bajos NO llevan valvula de aire: llevan desague (se avisa).
  //   La presion baja o negativa NO se corrige con valvulas de aire: se avisa como problema de diseno.
  type Candidate = { dist: number; cota: number; pressure: number | null; type: "VA-C" | "VA-A" | "VA-E"; reason: string };
  const candidates: Candidate[] = [];

  // Inicio — VA-C siempre (llenado/vaciado y arranque)
  candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: "VA-C", reason: "Inicio de linea" });
  // Fin — SOLO si la llegada NO es descendente: en un punto bajo el aire no se acumula
  // (una linea que baja uniformemente no necesita valvula al final)
  const last = sorted.length - 1;
  const llegadaDescendente = sorted[last].cota < sorted[last - 1].cota;
  if (!llegadaDescendente) {
    candidates.push({ dist: sorted[last].dist, cota: sorted[last].cota, pressure: pressures[last], type: "VA-C", reason: "Fin de linea (llegada plana/ascendente)" });
  }

  const puntosBajos: number[] = [];
  for (let i = 1; i < sorted.length - 1; i++) {
    const isHighPoint = sorted[i].cota > sorted[i - 1].cota && sorted[i].cota >= sorted[i + 1].cota;
    const isLowPoint = sorted[i].cota < sorted[i - 1].cota && sorted[i].cota <= sorted[i + 1].cota;
    const p = pressures[i];

    // Punto alto → VA-C (el aire se acumula y hay riesgo de vacio al vaciar la linea)
    if (isHighPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-C", reason: "Punto alto — acumulacion de aire" });
    }

    // Punto bajo → desague recomendado, NO valvula de aire (se agrega a los avisos)
    if (isLowPoint) puntosBajos.push(sorted[i].dist);

    // La subida se aplana (sin ser pico): el aire arrastrado se junta ahi → VA-E
    if (i < slopes.length && slopes[i - 1] > 3 && slopes[i] >= -1 && slopes[i] < slopes[i - 1] - 2 && !isHighPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-E", reason: "Reduccion de pendiente ascendente — acumulacion de aire" });
    }

    // Arranca un ascenso fuerte desde plano: el aire migra hacia arriba → VA-E
    if (i < slopes.length && slopes[i - 1] <= 1 && slopes[i] > 3 && !isHighPoint && !isLowPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-E", reason: "Inicio de ascenso — aire migra hacia arriba" });
    }

    // La bajada se hace mas pronunciada → VA-A (riesgo de vacio / separacion de columna)
    if (i < slopes.length && slopes[i - 1] < -1 && slopes[i] < slopes[i - 1] - 3) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-A", reason: "La bajada se hace mas pronunciada — riesgo de vacio" });
    }
  }

  // Corridas largas — el caracter del tramo se mide agrupando segmentos consecutivos
  // del mismo tipo, aunque el perfil se haya capturado con varios vertices intermedios:
  //   ascendente o plana → VA-E de purga cada maxSpacing
  //   descendente → VA-A de proteccion de vacio cada maxSpacing
  const clase = (s: number): "up" | "down" | "flat" => (s > 1 ? "up" : s < -1 ? "down" : "flat");
  const interpola = (d: number) => {
    let k = 0;
    while (k < sorted.length - 2 && sorted[k + 1].dist <= d) k++;
    const L = sorted[k + 1].dist - sorted[k].dist;
    const frac = L > 0 ? (d - sorted[k].dist) / L : 0;
    const cota = sorted[k].cota + frac * (sorted[k + 1].cota - sorted[k].cota);
    const pr = pressures[k] != null && pressures[k + 1] != null ? pressures[k]! + frac * (pressures[k + 1]! - pressures[k]!) : null;
    return { cota, pr };
  };
  let i0 = 0;
  while (i0 < slopes.length) {
    let i1 = i0;
    while (i1 + 1 < slopes.length && clase(slopes[i1 + 1]) === clase(slopes[i0])) i1++;
    const cl = clase(slopes[i0]);
    const runStart = sorted[i0].dist;
    const runEnd = sorted[i1 + 1].dist;
    if (runEnd - runStart > maxSpacing) {
      const tipo: "VA-A" | "VA-E" = cl === "down" ? "VA-A" : "VA-E";
      const reason = cl === "up" ? "Tramo ascendente largo — purga de aire" : cl === "flat" ? "Tramo plano largo — purga de aire" : "Tramo descendente largo — proteccion contra vacio";
      for (let d = runStart + maxSpacing; d < runEnd - 1; d += maxSpacing) {
        const { cota, pr } = interpola(d);
        candidates.push({ dist: d, cota, pressure: pr, type: tipo, reason });
      }
    }
    i0 = i1 + 1;
  }

  // Avisos de diseno (no son valvulas)
  if (hasHydraulics) {
    const negativos = sorted.map((v, i) => ({ v, p: pressures[i] })).filter((x) => x.p != null && x.p < 0);
    if (negativos.length > 0) {
      alerts.push(`Presion NEGATIVA en operacion en ${negativos.length} punto(s) del perfil (desde cad ${negativos[0].v.dist.toFixed(0)} m). Las valvulas de aire NO corrigen esto: revisa el diametro, el trazo o si la linea requiere bombeo.`);
    } else {
      const bajos = sorted.filter((v, i) => pressures[i] != null && pressures[i]! < pressureMin);
      if (bajos.length > 0) alerts.push(`Presion por debajo de ${pressureMin} m.c.a. en ${bajos.length} punto(s): verifica con el fabricante que la valvula de aire selle a baja presion.`);
    }
  }
  puntosBajos.forEach((d) => alerts.push(`Punto bajo en cad ${d.toFixed(0)} m: no lleva valvula de aire — se recomienda un desague (desfogue) para drenado y limpieza. Puedes armar ese crucero en el Generador de cruceros.`));

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

  return { valves, profilePoints, totalVAC, totalVAA, totalVAE, alerts };
}
