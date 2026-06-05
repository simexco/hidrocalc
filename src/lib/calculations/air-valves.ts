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
const VAE_SIZE: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '1/2"', 150: '1/2"', 200: '1/2"', 250: '1/2"', 300: '1/2"',
  350: '3/4"', 400: '3/4"', 450: '1"', 500: '1"', 600: '1"', 750: '1"', 900: '1"',
};

const VAA_SIZE: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '3/4"', 150: '1"', 200: '2"', 250: '2"', 300: '2"',
  350: '3"', 400: '3"', 450: '4"', 500: '4"', 600: '6"', 750: '6"', 900: '8"',
};

const VAC_BODY: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '3/4"', 150: '1"', 200: '2"', 250: '2"', 300: '2"',
  350: '3"', 400: '3"', 450: '4"', 500: '4"', 600: '6"', 750: '6"', 900: '8"',
};

const VAC_ORIFICE: Record<number, string> = {
  50: '1/2"', 75: '1/2"', 100: '1/2"', 150: '1/2"', 200: '1/2"', 250: '1/2"', 300: '1/2"',
  350: '3/4"', 400: '3/4"', 450: '1"', 500: '1"', 600: '1"', 750: '1"', 900: '1"',
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
  if (dn >= 750 && type === "VA-E") return "Instalar dos VA-E de 1\" en paralelo";
  if (dn >= 750 && type === "VA-C") return "Agregar VA-E de 1\" adicional";
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
  type Candidate = { dist: number; cota: number; pressure: number | null; type: "VA-C" | "VA-A" | "VA-E"; reason: string; alert: "critical" | "low" | null };
  const candidates: Candidate[] = [];

  // Rule 1: Start and end — ALWAYS VA-C
  candidates.push({ dist: sorted[0].dist, cota: sorted[0].cota, pressure: pressures[0], type: "VA-C", reason: "Inicio de linea", alert: null });
  const last = sorted.length - 1;
  candidates.push({ dist: sorted[last].dist, cota: sorted[last].cota, pressure: pressures[last], type: "VA-C", reason: "Fin de linea", alert: null });

  for (let i = 1; i < sorted.length - 1; i++) {
    const isHighPoint = sorted[i].cota > sorted[i - 1].cota && sorted[i].cota >= sorted[i + 1].cota;
    const isLowPoint = sorted[i].cota < sorted[i - 1].cota && sorted[i].cota <= sorted[i + 1].cota;
    const p = pressures[i];
    const alert: "critical" | "low" | null = p != null && p < 0 ? "critical" : p != null && p < pressureMin ? "low" : null;

    // Rule 2: High point → VA-C (air accumulates here)
    if (isHighPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-C", reason: "Punto alto — acumulacion de aire", alert });
    }

    // Rule 3: Transition from uphill to downhill (not a sharp peak) → VA-E
    if (i < slopes.length && slopes[i - 1] > 1 && slopes[i] < -1 && !isHighPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-E", reason: "Cambio pendiente ascendente a descendente", alert: null });
    }

    // Rule 4: Transition from downhill to uphill (valley) → VA-A at the low point
    if (isLowPoint && i < slopes.length) {
      // Only if significant slope change
      if (slopes[i - 1] < -2 && slopes[i] > 2) {
        candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-A", reason: "Punto bajo — riesgo de vacio en vaciado", alert: null });
      }
    }

    // Rule 5: Low pressure point → VA-C
    if (p != null && p < pressureMin && !isHighPoint) {
      candidates.push({ dist: sorted[i].dist, cota: sorted[i].cota, pressure: p, type: "VA-C", reason: "Presion insuficiente", alert });
    }
  }

  // Rule 6: Steep descents (>5%) — VA-A for vacuum protection
  for (let i = 0; i < slopes.length; i++) {
    if (slopes[i] < -5) {
      const L = sorted[i + 1].dist - sorted[i].dist;
      // For moderate descents (5-15%), place VA-A at start of descent
      if (L > 100) {
        const insertDist = sorted[i].dist + 50; // near the top of the descent
        const frac = 50 / L;
        const insertCota = sorted[i].cota + frac * (sorted[i + 1].cota - sorted[i].cota);
        const insertP = pressures[i] != null && pressures[i + 1] != null
          ? pressures[i]! + frac * (pressures[i + 1]! - pressures[i]!)
          : null;
        candidates.push({ dist: insertDist, cota: insertCota, pressure: insertP, type: "VA-A", reason: `Descenso ${Math.abs(slopes[i]).toFixed(1)}% — proteccion contra vacio`, alert: null });
      }
      // For very steep (>15%) or long descents, add another VA-A
      if (slopes[i] < -15 && L > 500) {
        const insertDist = sorted[i].dist + L / 2;
        const frac = 0.5;
        const insertCota = sorted[i].cota + frac * (sorted[i + 1].cota - sorted[i].cota);
        const insertP = pressures[i] != null && pressures[i + 1] != null
          ? pressures[i]! + frac * (pressures[i + 1]! - pressures[i]!)
          : null;
        candidates.push({ dist: insertDist, cota: insertCota, pressure: insertP, type: "VA-A", reason: `Descenso pronunciado ${Math.abs(slopes[i]).toFixed(1)}%`, alert: null });
      }
    }
  }

  // Rule 7: Long uphill segments — VA-E every maxSpacing
  for (let i = 0; i < slopes.length; i++) {
    const L = sorted[i + 1].dist - sorted[i].dist;
    if (L > maxSpacing && slopes[i] > 0) {
      // Uphill: air migrates to the top, need VA-E to purge
      const numVAE = Math.floor(L / maxSpacing);
      for (let j = 1; j <= numVAE; j++) {
        const insertDist = sorted[i].dist + j * maxSpacing;
        if (insertDist >= sorted[i + 1].dist) break;
        const frac = (insertDist - sorted[i].dist) / L;
        const insertCota = sorted[i].cota + frac * (sorted[i + 1].cota - sorted[i].cota);
        const insertP = pressures[i] != null && pressures[i + 1] != null
          ? pressures[i]! + frac * (pressures[i + 1]! - pressures[i]!)
          : null;
        candidates.push({ dist: insertDist, cota: insertCota, pressure: insertP, type: "VA-E", reason: "Tramo ascendente largo — purga de aire", alert: null });
      }
    }
    // Flat or gentle slopes: VA-E for maintenance
    if (L > maxSpacing && Math.abs(slopes[i]) <= 2) {
      const numVAE = Math.floor(L / maxSpacing);
      for (let j = 1; j <= numVAE; j++) {
        const insertDist = sorted[i].dist + j * maxSpacing;
        if (insertDist >= sorted[i + 1].dist) break;
        const frac = (insertDist - sorted[i].dist) / L;
        const insertCota = sorted[i].cota + frac * (sorted[i + 1].cota - sorted[i].cota);
        const insertP = pressures[i] != null && pressures[i + 1] != null
          ? pressures[i]! + frac * (pressures[i + 1]! - pressures[i]!)
          : null;
        candidates.push({ dist: insertDist, cota: insertCota, pressure: insertP, type: "VA-E", reason: "Espaciado maximo — mantenimiento", alert: null });
      }
    }
    // Long downhill: VA-A every maxSpacing for vacuum protection during drainage
    if (L > maxSpacing && slopes[i] < -2) {
      const numVAA = Math.floor(L / maxSpacing);
      for (let j = 1; j <= numVAA; j++) {
        const insertDist = sorted[i].dist + j * maxSpacing;
        if (insertDist >= sorted[i + 1].dist) break;
        const frac = (insertDist - sorted[i].dist) / L;
        const insertCota = sorted[i].cota + frac * (sorted[i + 1].cota - sorted[i].cota);
        const insertP = pressures[i] != null && pressures[i + 1] != null
          ? pressures[i]! + frac * (pressures[i + 1]! - pressures[i]!)
          : null;
        candidates.push({ dist: insertDist, cota: insertCota, pressure: insertP, type: "VA-A", reason: "Tramo descendente largo — proteccion vacio", alert: null });
      }
    }
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

    return {
      dist: c.dist,
      cota: c.cota,
      pressure: c.pressure,
      type: c.type,
      bodySize,
      orificeSize,
      pn,
      reason: c.reason,
      alert: c.alert,
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
