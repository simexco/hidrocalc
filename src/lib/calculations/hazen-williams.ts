/* ════════════════════════════════════════
   Hazen-Williams Calculation Engine
   Modules 1, 2, 5
   ════════════════════════════════════════ */

import { G, NU_20C, DEFAULTS } from "@/lib/constants";
import type { Fitting, Alert, AlertLevel, DiameterComparisonRow } from "@/types/hydraulic";
import { getVelocityAlerts, getPressureAlerts, getGradientAlerts } from "./validators";

export interface HWInput {
  Q: number;    // m³/s
  D: number;    // m (internal diameter)
  L: number;    // m
  C: number;
  P1?: number | null;  // m.c.a.
  z1: number;
  z2: number;
  fittings?: Fitting[];
  useEstimatedHm?: boolean;  // if true, use 10% rule
}

export interface HWResult {
  A: number;
  V: number;
  hf: number;
  hm: number;
  hmEstimated: boolean;
  H1: number | null;
  H2: number | null;
  P2: number | null;
  P2_kPa: number | null;
  J: number;
  J_km: number;
  Re: number;
  alerts: Alert[];
}

/**
 * Core Hazen-Williams calculation for a single pipe segment.
 */
export function calculateHazenWilliams(input: HWInput): HWResult {
  const { Q, D, L, C, P1, z1, z2, fittings } = input;

  // Area
  const A = Math.PI * D * D / 4;

  // Velocity
  const V = Q / A;

  // Friction loss: hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)
  const hf = 10.67 * L * Math.pow(Q, 1.852) / (Math.pow(C, 1.852) * Math.pow(D, 4.87));

  // Minor losses from fittings
  let hm = 0;
  let hmEstimated = false;
  const velocityHead = V * V / (2 * G);

  if (fittings && fittings.length > 0) {
    const totalK = fittings.reduce((sum, f) => sum + f.k * f.quantity, 0);
    hm = totalK * velocityHead;
  } else if (input.useEstimatedHm !== false) {
    // 10% empirical rule
    hm = DEFAULTS.hmPercent * hf;
    hmEstimated = true;
  }

  // Hydraulic gradient
  const J = hf / L;
  const J_km = J * 1000;

  // Reynolds number
  const Re = V * D / NU_20C;

  // Energy equation (only if P1 is available)
  let H1: number | null = null;
  let H2: number | null = null;
  let P2: number | null = null;
  let P2_kPa: number | null = null;

  if (P1 != null) {
    H1 = z1 + P1 + velocityHead;
    H2 = H1 - hf - hm;
    P2 = H2 - z2 - velocityHead;
    P2_kPa = P2 * G;
  }

  // Collect alerts
  const alerts: Alert[] = [
    ...getVelocityAlerts(V),
    ...getPressureAlerts(P2),
    ...getGradientAlerts(J_km),
  ];

  return { A, V, hf, hm, hmEstimated, H1, H2, P2, P2_kPa, J, J_km, Re, alerts };
}

/**
 * Mode B: Find maximum flow Q such that P2 >= P2min
 * Uses bisection method.
 */
export function findMaxFlow(
  D: number, L: number, C: number,
  P1: number, P2min: number,
  z1: number, z2: number,
  fittings?: Fitting[]
): { Qmax: number; result: HWResult } | null {
  if (P1 == null) return null;

  let Qlow = 0.0001;  // m³/s
  let Qhigh = 10;      // m³/s (very high initial bound)
  const tolerance = 0.001; // m³/s
  const maxIter = 100;

  // First check if the high bound gives any pressure
  let resultHigh = calculateHazenWilliams({ Q: Qhigh, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });
  if (resultHigh.P2 != null && resultHigh.P2 >= P2min) {
    // Even at max flow, pressure is OK — return max
    return { Qmax: Qhigh, result: resultHigh };
  }

  // Bisection
  for (let i = 0; i < maxIter; i++) {
    const Qmid = (Qlow + Qhigh) / 2;
    const result = calculateHazenWilliams({ Q: Qmid, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });

    if (result.P2 == null) return null;

    if (Math.abs(result.P2 - P2min) < 0.01 || (Qhigh - Qlow) < tolerance) {
      return { Qmax: Qmid, result };
    }

    if (result.P2 > P2min) {
      Qlow = Qmid;
    } else {
      Qhigh = Qmid;
    }
  }

  // Return best result after max iterations
  const Qfinal = (Qlow + Qhigh) / 2;
  const finalResult = calculateHazenWilliams({ Q: Qfinal, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });
  return { Qmax: Qfinal, result: finalResult };
}

/**
 * Evaluate a given alert level as a numeric priority for sorting.
 */
function alertPriority(level: AlertLevel): number {
  switch (level) {
    case "CRITICAL": return 0;
    case "ERROR": return 1;
    case "WARN": return 2;
    case "OK": return 3;
  }
}

/**
 * Mode C / Module 5: Compare all standard diameters.
 */
export function compareDiameters(
  Q: number, L: number, C: number,
  P1: number | null, P2min: number,
  z1: number, z2: number,
  maxVelocity: number,
  dns: number[]
): { rows: DiameterComparisonRow[]; recommendedDN: number | null } {
  const rows = dns.map((dn) => {
    const D = dn / 1000; // mm → m
    const result = calculateHazenWilliams({ Q, D, L, C, P1, z1, z2, useEstimatedHm: true });

    const meetsVmin = result.V >= 0.3;
    const meetsVmax = result.V <= maxVelocity;
    const meetsVelocity = meetsVmin && meetsVmax;
    const meetsPressure = result.P2 != null ? result.P2 >= P2min : null;

    return {
      dn,
      V: result.V,
      hf: result.hf,
      hm: result.hm,
      P2: result.P2,
      J_km: result.J_km,
      meetsVmin,
      meetsVmax,
      meetsVelocity,
      meetsPressure,
      recommended: false,
    };
  });

  // Find minimum DN that meets all criteria
  let recommendedDN: number | null = null;
  for (const row of rows) {
    const meetsAll = row.meetsVelocity && (row.meetsPressure === true || row.meetsPressure === null);
    if (meetsAll && recommendedDN === null) {
      row.recommended = true;
      recommendedDN = row.dn;
      break;
    }
  }

  return { rows, recommendedDN };
}
