/* ════════════════════════════════════════
   Perfil Hidráulico — Análisis de presiones
   a lo largo de una línea de conducción
   Soporta múltiples tramos (DN/material)
   ════════════════════════════════════════ */

export interface ProfileVertex {
  id: string;
  dist: number;    // m from start (accumulated)
  cota: number;    // m.s.n.m.
  desc: string;    // optional label
}

export interface ProfileTramo {
  id: string;
  distFrom: number;  // m — start distance
  distTo: number;    // m — end distance
  DN_mm: number;
  C: number;
  materialName: string;
  pipeClass?: string;   // e.g. "SDR 26", "DR 18", "K9"
  PN_bar?: number;      // max working pressure in bar (from class)
}

export interface ProfilePointResult {
  dist: number;
  cota: number;
  desc: string;
  hfAccum: number;
  piezo: number | null;
  pressure_mca: number | null;
  pressure_kgcm2: number | null;
  status: "ok" | "low" | "critical";
  tramoIndex: number;    // which tramo this point falls in
  DN_mm: number;         // DN at this point
  V: number | null;      // velocity at this point
}

export interface ProfileInputs {
  Q: number | null;        // m³/s
  P1_kgcm2: number | null;
  Pmin_kgcm2: number;
  vertices: ProfileVertex[];
  tramos: ProfileTramo[];  // if empty, use single-pipe mode (first tramo covers all)
}

export interface ProfileResults {
  points: ProfilePointResult[];
  totalLength: number;
  totalHf: number;
  finalPressure_kgcm2: number | null;
  criticalPoint: { dist: number; pressure_kgcm2: number } | null;
  pointsBelowMin: number;
  pointsCritical: number;
  tramoSummaries: { id: string; DN_mm: number; materialName: string; length: number; hf: number; V: number | null; J_km: number; pipeClass?: string; PN_bar?: number; maxPressure_kgcm2: number; exceedsPN: boolean }[];
  alerts: { level: "WARN" | "ERROR"; message: string }[];
}

// Hazen-Williams friction for a segment
function hfSegment(Q: number, D_m: number, C: number, L: number): number {
  if (Q <= 0 || D_m <= 0 || L <= 0) return 0;
  return 10.67 * L * Math.pow(Q, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}

// Find which tramo a distance falls into
function findTramo(dist: number, tramos: ProfileTramo[]): ProfileTramo | null {
  for (const t of tramos) {
    if (dist >= t.distFrom && dist <= t.distTo) return t;
  }
  // If between tramos, use the nearest one
  let best: ProfileTramo | null = null;
  let bestDist = Infinity;
  for (const t of tramos) {
    const d = dist < t.distFrom ? t.distFrom - dist : dist - t.distTo;
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best;
}

export function calculateProfile(input: ProfileInputs): ProfileResults | null {
  const { Q, P1_kgcm2, Pmin_kgcm2, vertices, tramos } = input;
  if (vertices.length < 2) return null;
  if (tramos.length === 0) return null;

  const sorted = [...vertices].sort((a, b) => a.dist - b.dist);
  const hasHydraulics = Q != null && Q > 0 && P1_kgcm2 != null;

  const totalLength = sorted[sorted.length - 1].dist - sorted[0].dist;

  // Calculate pressure at each vertex
  const points: ProfilePointResult[] = [];
  let hfAccum = 0;
  let minPressure = Infinity;
  let criticalPoint: ProfileResults["criticalPoint"] = null;
  let pointsBelowMin = 0;
  let pointsCritical = 0;

  // Track hf per tramo
  const tramoHf: Record<string, number> = {};
  for (const t of tramos) tramoHf[t.id] = 0;

  for (let i = 0; i < sorted.length; i++) {
    // Find which tramo this segment belongs to
    const midDist = i > 0 ? (sorted[i - 1].dist + sorted[i].dist) / 2 : sorted[0].dist;
    const tramo = findTramo(midDist, tramos);
    const DN_mm = tramo?.DN_mm ?? tramos[0].DN_mm;
    const C = tramo?.C ?? tramos[0].C;
    const D_m = DN_mm / 1000;
    const A = Math.PI * Math.pow(D_m / 2, 2);
    const V_point = Q != null && Q > 0 ? Q / A : null;

    if (i > 0 && hasHydraulics) {
      const segL = sorted[i].dist - sorted[i - 1].dist;
      const segHf = hfSegment(Q!, D_m, C, segL);
      hfAccum += segHf;
      if (tramo) tramoHf[tramo.id] = (tramoHf[tramo.id] ?? 0) + segHf;
    }

    let pressure_mca: number | null = null;
    let piezo: number | null = null;
    let pressure_kgcm2: number | null = null;

    if (hasHydraulics) {
      const piezoStart = sorted[0].cota + P1_kgcm2! * 10;
      piezo = piezoStart - hfAccum;
      pressure_mca = piezo - sorted[i].cota;
      pressure_kgcm2 = pressure_mca / 10;

      if (pressure_kgcm2 < minPressure) {
        minPressure = pressure_kgcm2;
        criticalPoint = { dist: sorted[i].dist, pressure_kgcm2 };
      }
    }

    let status: ProfilePointResult["status"] = "ok";
    if (pressure_kgcm2 != null) {
      if (pressure_kgcm2 < 0) { status = "critical"; pointsCritical++; }
      else if (pressure_kgcm2 < Pmin_kgcm2) { status = "low"; pointsBelowMin++; }
    }

    const tramoIdx = tramo ? tramos.indexOf(tramo) : 0;

    points.push({
      dist: sorted[i].dist,
      cota: sorted[i].cota,
      desc: sorted[i].desc,
      hfAccum,
      piezo,
      pressure_mca,
      pressure_kgcm2,
      status,
      tramoIndex: tramoIdx,
      DN_mm,
      V: V_point,
    });
  }

  const finalP = points[points.length - 1]?.pressure_kgcm2 ?? null;
  const totalHf = hfAccum;

  // Tramo summaries with max pressure check
  const tramoSummaries = tramos.map(t => {
    const D_m = t.DN_mm / 1000;
    const A = Math.PI * Math.pow(D_m / 2, 2);
    const V = Q != null && Q > 0 ? Q / A : null;
    const length = t.distTo - t.distFrom;
    // Find max pressure in this tramo's range
    const tramoPoints = points.filter(p => p.dist >= t.distFrom && p.dist <= t.distTo);
    const maxP = Math.max(0, ...tramoPoints.filter(p => p.pressure_kgcm2 != null).map(p => p.pressure_kgcm2!));
    const PN_kgcm2 = t.PN_bar ? t.PN_bar / 0.9807 : null;
    const exceedsPN = PN_kgcm2 != null && maxP > PN_kgcm2;
    const hf = tramoHf[t.id] ?? 0;
    const J_km = length > 0 ? (hf / length) * 1000 : 0;
    return { id: t.id, DN_mm: t.DN_mm, materialName: t.materialName, length, hf, V, J_km, pipeClass: t.pipeClass, PN_bar: t.PN_bar, maxPressure_kgcm2: maxP, exceedsPN };
  });

  // Alerts
  const alerts: ProfileResults["alerts"] = [];
  for (const ts of tramoSummaries) {
    if (ts.V != null && ts.V > 2.5) alerts.push({ level: "WARN", message: `Tramo ${ts.DN_mm}mm ${ts.materialName}: V=${ts.V.toFixed(2)} m/s (max 2.5)` });
    if (ts.V != null && ts.V < 0.3 && ts.V > 0) alerts.push({ level: "WARN", message: `Tramo ${ts.DN_mm}mm ${ts.materialName}: V=${ts.V.toFixed(2)} m/s (min 0.3 — sedimentacion)` });
  }
  for (const ts of tramoSummaries) {
    if (ts.J_km > 10) alerts.push({ level: "WARN", message: `Tramo ${ts.DN_mm}mm ${ts.materialName}: J=${ts.J_km.toFixed(1)} m/km (max 10)` });
  }
  for (const ts of tramoSummaries) {
    if (ts.exceedsPN && ts.PN_bar) {
      const pnKg = (ts.PN_bar / 0.9807).toFixed(1);
      alerts.push({ level: "ERROR", message: `Tramo ${ts.DN_mm}mm ${ts.materialName} ${ts.pipeClass ?? ''}: P max ${ts.maxPressure_kgcm2.toFixed(1)} kg/cm2 EXCEDE la capacidad de la tuberia (PN ${ts.PN_bar} bar = ${pnKg} kg/cm2)` });
    }
  }
  if (pointsCritical > 0) alerts.push({ level: "ERROR", message: `${pointsCritical} punto(s) con presion negativa` });
  if (pointsBelowMin > 0) alerts.push({ level: "WARN", message: `${pointsBelowMin} punto(s) con presion menor a ${Pmin_kgcm2} kg/cm2` });
  if (finalP != null && finalP < Pmin_kgcm2) alerts.push({ level: "ERROR", message: `Presion final (${finalP.toFixed(2)} kg/cm2) no cumple el minimo requerido` });

  return {
    points,
    totalLength,
    totalHf,
    finalPressure_kgcm2: finalP,
    criticalPoint: criticalPoint && minPressure < Infinity ? criticalPoint : null,
    pointsBelowMin,
    pointsCritical,
    tramoSummaries,
    alerts,
  };
}

/**
 * Inverse mode: calculate the required P1 so the most critical point
 * has exactly Pmin_kgcm2.
 * Since pressure is linear with P1, we run once with P1=0 and offset.
 */
export function calculateRequiredP1(
  input: Omit<ProfileInputs, 'P1_kgcm2'> & { Pmin_kgcm2: number }
): number | null {
  const testResult = calculateProfile({ ...input, P1_kgcm2: 0 });
  if (!testResult) return null;
  const pressures = testResult.points
    .filter(p => p.pressure_kgcm2 != null)
    .map(p => p.pressure_kgcm2!);
  if (pressures.length === 0) return null;
  const minP = Math.min(...pressures);
  if (!isFinite(minP)) return null;
  return input.Pmin_kgcm2 - minP;
}
