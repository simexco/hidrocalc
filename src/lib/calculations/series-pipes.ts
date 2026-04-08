/* ════════════════════════════════════════
   Series Pipes Calculation Engine
   Module 2 — with Le/D and % modes
   ════════════════════════════════════════ */

import { calculateHazenWilliams } from "./hazen-williams";
import type { SeriesTramo, SeriesTramoResult, SeriesPipeResults, Alert } from "@/types/hydraulic";
import { G } from "@/lib/constants";

/**
 * Calculate minor losses based on the selected mode.
 */
function calculateMinorLoss(
  tramo: SeriesTramo,
  V: number,
  hf: number,
  D: number,
  L: number,
  C: number,
  Q: number
): { hm: number; estimated: boolean } {
  const velocityHead = V * V / (2 * G);

  switch (tramo.lossMode) {
    case "K":
      if (tramo.kTotal > 0) {
        return { hm: tramo.kTotal * velocityHead, estimated: false };
      }
      // Fall through to estimated
      return { hm: 0.10 * hf, estimated: true };

    case "Le":
      if (tramo.leTotal > 0) {
        // Calculate hf for the equivalent length using same formula
        const hfLe = 10.67 * tramo.leTotal * Math.pow(Q, 1.852) / (Math.pow(C, 1.852) * Math.pow(D, 4.87));
        return { hm: hfLe, estimated: false };
      }
      return { hm: 0.10 * hf, estimated: true };

    case "percent":
      return { hm: (tramo.hmPercent / 100) * hf, estimated: false };

    default:
      return { hm: 0.10 * hf, estimated: true };
  }
}

export function calculateSeriesPipes(
  tramos: SeriesTramo[],
  Q_global: number | null,
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
        V: null, hf: null, hm: null,
        Pentry: currentP, Pexit: null,
        alerts: [{ level: "ERROR", field: tramo.id, message: "Datos incompletos en tramo" }],
      });
      continue;
    }

    const D = tramo.DN / 1000;
    const zEnd = tramo.zEnd;

    const result = calculateHazenWilliams({
      Q, D, L: tramo.L, C: tramo.C,
      P1: currentP, z1: currentZ, z2: zEnd,
      useEstimatedHm: false, // We'll handle hm ourselves
    });

    // Calculate hm based on selected mode
    const { hm } = calculateMinorLoss(tramo, result.V, result.hf, D, tramo.L, tramo.C, Q);

    // Recalculate P2 with our hm
    let P2 = result.P2;
    if (result.H1 != null) {
      const H2 = result.H1 - result.hf - hm;
      P2 = H2 - zEnd - result.V * result.V / (2 * G);
    }

    tramoResults.push({
      id: tramo.id,
      V: result.V, hf: result.hf, hm: hm,
      Pentry: currentP, Pexit: P2,
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
    tramoResults, totalLength, totalHf, totalHm,
    finalPressure: currentP, alerts: allAlerts,
    dataStatus: P1 != null ? "calculated" : "estimated",
  };
}
