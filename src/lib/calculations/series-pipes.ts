/* ════════════════════════════════════════
   Series Pipes Calculation Engine
   Module 2
   ════════════════════════════════════════ */

import { calculateHazenWilliams } from "./hazen-williams";
import type { SeriesTramo, SeriesTramoResult, SeriesPipeResults, Alert } from "@/types/hydraulic";
import { G } from "@/lib/constants";

export function calculateSeriesPipes(
  tramos: SeriesTramo[],
  Q_global: number | null,  // m³/s
  P1: number | null,
  z1_initial: number,
  variableFlow: boolean
): SeriesPipeResults | null {
  if (tramos.length === 0) return null;

  const tramoResults: SeriesTramoResult[] = [];
  let currentP = P1;
  let currentZ = z1_initial;
  let totalLength = 0;
  let totalHf = 0;
  let totalHm = 0;
  const allAlerts: Alert[] = [];

  for (const tramo of tramos) {
    const Q = variableFlow && tramo.Q != null ? tramo.Q : Q_global;
    if (Q == null || Q <= 0 || tramo.L == null || tramo.DN == null) {
      tramoResults.push({
        id: tramo.id,
        V: null,
        hf: null,
        hm: null,
        Pentry: currentP,
        Pexit: null,
        alerts: [{ level: "ERROR", field: tramo.id, message: "Datos incompletos en tramo" }],
      });
      continue;
    }

    const D = tramo.DN / 1000;
    const zEnd = tramo.zEnd;

    // Calculate hm from kTotal
    const A = Math.PI * D * D / 4;
    const V = Q / A;
    const hmManual = tramo.kTotal * V * V / (2 * G);

    const result = calculateHazenWilliams({
      Q,
      D,
      L: tramo.L,
      C: tramo.C,
      P1: currentP,
      z1: currentZ,
      z2: zEnd,
      useEstimatedHm: tramo.kTotal <= 0,
    });

    // Override hm if kTotal was provided
    let hm = result.hm;
    let P2 = result.P2;
    if (tramo.kTotal > 0) {
      hm = hmManual;
      if (result.H1 != null) {
        const H2 = result.H1 - result.hf - hm;
        P2 = H2 - zEnd - V * V / (2 * G);
      }
    }

    tramoResults.push({
      id: tramo.id,
      V: result.V,
      hf: result.hf,
      hm: hm,
      Pentry: currentP,
      Pexit: P2,
      alerts: result.alerts.map((a) => ({ ...a, field: `${tramo.name || tramo.id}: ${a.field}` })),
    });

    allAlerts.push(...result.alerts.map((a) => ({ ...a, field: `${tramo.name || tramo.id}: ${a.field}` })));

    totalLength += tramo.L;
    totalHf += result.hf;
    totalHm += hm;
    currentP = P2;
    currentZ = zEnd;
  }

  return {
    tramoResults,
    totalLength,
    totalHf,
    totalHm,
    finalPressure: currentP,
    alerts: allAlerts,
    dataStatus: P1 != null ? "calculated" : "estimated",
  };
}
