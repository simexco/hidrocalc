/* ════════════════════════════════════════
   Perfil Hidráulico — Análisis de presiones
   a lo largo de una línea de conducción
   ════════════════════════════════════════ */

export interface ProfileVertex {
  id: string;
  dist: number;    // m from start (accumulated)
  cota: number;    // m.s.n.m.
  desc: string;    // optional label
}

export interface ProfilePointResult {
  dist: number;
  cota: number;
  desc: string;
  hfAccum: number;        // accumulated friction loss (m)
  piezo: number | null;   // piezometric elevation (m.s.n.m.)
  pressure_mca: number | null;  // pressure at this point (m.c.a.)
  pressure_kgcm2: number | null;
  status: "ok" | "low" | "critical";  // critical = negative, low = below min
}

export interface ProfileInputs {
  Q: number | null;        // m³/s
  DN_mm: number;
  C: number;
  P1_kgcm2: number | null;
  Pmin_kgcm2: number;     // minimum required pressure
  vertices: ProfileVertex[];
}

export interface ProfileResults {
  points: ProfilePointResult[];
  totalLength: number;
  totalHf: number;
  V: number | null;        // velocity m/s
  J: number | null;        // gradient m/m
  finalPressure_kgcm2: number | null;
  criticalPoint: { dist: number; pressure_kgcm2: number } | null;
  pointsBelowMin: number;
  pointsCritical: number;
  alerts: { level: "WARN" | "ERROR"; message: string }[];
}

// Hazen-Williams friction for a segment
function hfSegment(Q: number, D_m: number, C: number, L: number): number {
  if (Q <= 0 || D_m <= 0 || L <= 0) return 0;
  return 10.67 * L * Math.pow(Q, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}

export function calculateProfile(input: ProfileInputs): ProfileResults | null {
  const { Q, DN_mm, C, P1_kgcm2, Pmin_kgcm2, vertices } = input;
  if (vertices.length < 2) return null;

  const sorted = [...vertices].sort((a, b) => a.dist - b.dist);
  const D_m = DN_mm / 1000;
  const A = Math.PI * Math.pow(D_m / 2, 2);
  const hasHydraulics = Q != null && Q > 0 && P1_kgcm2 != null;

  // Velocity
  const V = Q != null && Q > 0 ? Q / A : null;

  // Total length
  const totalLength = sorted[sorted.length - 1].dist - sorted[0].dist;

  // Total friction loss
  const totalHf = hasHydraulics ? hfSegment(Q!, D_m, C, totalLength) : 0;

  // Gradient
  const J = totalLength > 0 && totalHf > 0 ? totalHf / totalLength : null;

  // Calculate pressure at each vertex
  const points: ProfilePointResult[] = [];
  let hfAccum = 0;
  let minPressure = Infinity;
  let criticalPoint: ProfileResults["criticalPoint"] = null;
  let pointsBelowMin = 0;
  let pointsCritical = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && hasHydraulics) {
      const segL = sorted[i].dist - sorted[i - 1].dist;
      hfAccum += hfSegment(Q!, D_m, C, segL);
    }

    let pressure_mca: number | null = null;
    let piezo: number | null = null;
    let pressure_kgcm2: number | null = null;

    if (hasHydraulics) {
      // Piezometric elevation at start
      const piezoStart = sorted[0].cota + P1_kgcm2! * 10; // convert kg/cm² to m.c.a.
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

    points.push({
      dist: sorted[i].dist,
      cota: sorted[i].cota,
      desc: sorted[i].desc,
      hfAccum,
      piezo,
      pressure_mca,
      pressure_kgcm2,
      status,
    });
  }

  const finalP = points[points.length - 1]?.pressure_kgcm2 ?? null;

  // Alerts
  const alerts: ProfileResults["alerts"] = [];
  if (V != null && V > 2.5) alerts.push({ level: "WARN", message: `Velocidad elevada: ${V.toFixed(2)} m/s (max recomendado 2.5 m/s)` });
  if (V != null && V < 0.3 && V > 0) alerts.push({ level: "WARN", message: `Velocidad baja: ${V.toFixed(2)} m/s (min recomendado 0.3 m/s — riesgo de sedimentacion)` });
  if (pointsCritical > 0) alerts.push({ level: "ERROR", message: `${pointsCritical} punto(s) con presion negativa — la linea no funciona en esos tramos` });
  if (pointsBelowMin > 0) alerts.push({ level: "WARN", message: `${pointsBelowMin} punto(s) con presion menor a ${Pmin_kgcm2} kg/cm2` });
  if (finalP != null && finalP < Pmin_kgcm2) alerts.push({ level: "ERROR", message: `Presion final (${finalP.toFixed(2)} kg/cm2) no cumple el minimo requerido` });

  return {
    points,
    totalLength,
    totalHf,
    V,
    J,
    finalPressure_kgcm2: finalP,
    criticalPoint: criticalPoint && minPressure < Infinity ? criticalPoint : null,
    pointsBelowMin,
    pointsCritical,
    alerts,
  };
}
