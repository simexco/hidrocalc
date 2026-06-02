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
    // 10% empírical rule
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
 * Mode B: Find practical maximum flow.
 * Returns the minimum of three limits:
 *   1. By pressure: P2 >= P2min
 *   2. By gradient: J <= 10 m/km (NOM-001-CONAGUA)
 *   3. By velocity: V <= 2.5 m/s
 * The practical Qmax is the most restrictive (smallest).
 */
export function findMaxFlow(
  D: number, L: number, C: number,
  P1: number, P2min: number,
  z1: number, z2: number,
  fittings?: Fitting[]
): { Qmax: number; QmaxPressure: number; QmaxGradient: number; QmaxVelocity: number; limitingFactor: string; result: HWResult } | null {
  if (P1 == null) return null;

  // 1. Q max by pressure (bisection: P2 >= P2min)
  let QmaxP = bisectQ(D, L, C, P1, z1, z2, fittings, (r) => r.P2 != null && r.P2 >= P2min);

  // 2. Q max by gradient (J <= 10 m/km)
  const QmaxJ = findQForLimit(D, L, C, P1, z1, z2, fittings, (r) => r.J_km, 10);

  // 3. Q max by velocity (V <= 2.5 m/s) — simple: Q = V * A
  const A = Math.PI * Math.pow(D / 2, 2);
  const QmaxV = 2.5 * A; // m³/s

  // Practical max = minimum of all three
  const limits = [
    { Q: QmaxP, name: "presion" },
    { Q: QmaxJ, name: "gradiente (J <= 10 m/km)" },
    { Q: QmaxV, name: "velocidad (V <= 2.5 m/s)" },
  ].filter(l => l.Q > 0).sort((a, b) => a.Q - b.Q);

  const practical = limits[0];
  if (!practical) return null;

  const Qmax = practical.Q;
  const result = calculateHazenWilliams({ Q: Qmax, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });

  return {
    Qmax,
    QmaxPressure: QmaxP,
    QmaxGradient: QmaxJ,
    QmaxVelocity: QmaxV,
    limitingFactor: practical.name,
    result,
  };
}

/** Bisect to find max Q where condition is true */
function bisectQ(
  D: number, L: number, C: number, P1: number, z1: number, z2: number,
  fittings: Fitting[] | undefined,
  condition: (r: HWResult) => boolean
): number {
  let Qlow = 0.0001, Qhigh = 10;
  for (let i = 0; i < 80; i++) {
    const Qmid = (Qlow + Qhigh) / 2;
    const r = calculateHazenWilliams({ Q: Qmid, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });
    if (condition(r)) Qlow = Qmid; else Qhigh = Qmid;
    if ((Qhigh - Qlow) < 0.0001) break;
  }
  return (Qlow + Qhigh) / 2;
}

/** Bisect to find Q where a metric equals a target */
function findQForLimit(
  D: number, L: number, C: number, P1: number, z1: number, z2: number,
  fittings: Fitting[] | undefined,
  metric: (r: HWResult) => number, target: number
): number {
  let Qlow = 0.0001, Qhigh = 10;
  for (let i = 0; i < 80; i++) {
    const Qmid = (Qlow + Qhigh) / 2;
    const r = calculateHazenWilliams({ Q: Qmid, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });
    if (metric(r) < target) Qlow = Qmid; else Qhigh = Qmid;
    if ((Qhigh - Qlow) < 0.0001) break;
  }
  return (Qlow + Qhigh) / 2;
}

/**
 * Find Q where gradient J = targetJ_km (m/km).
 * Uses bisection. Returns Q in m³/s or null.
 */
function findQForGradient(
  D: number, L: number, C: number,
  P1: number, z1: number, z2: number,
  targetJ_km: number,
  fittings?: Fitting[]
): number | null {
  let Qlow = 0.0001;
  let Qhigh = 10;
  for (let i = 0; i < 80; i++) {
    const Qmid = (Qlow + Qhigh) / 2;
    const r = calculateHazenWilliams({ Q: Qmid, D, L, C, P1, z1, z2, fittings, useEstimatedHm: true });
    if (Math.abs(r.J_km - targetJ_km) < 0.05 || (Qhigh - Qlow) < 0.0001) return Qmid;
    if (r.J_km < targetJ_km) Qlow = Qmid; else Qhigh = Qmid;
  }
  return (Qlow + Qhigh) / 2;
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
    const meetsGradient = result.J_km <= 10; // NOM-001-CONAGUA: max 10 m/km

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
      meetsGradient,
      recommended: false,
    };
  });

  // Find minimum DN that meets all criteria (velocity + pressure + gradient)
  let recommendedDN: number | null = null;
  for (const row of rows) {
    const meetsAll = row.meetsVelocity && row.meetsGradient && (row.meetsPressure === true || row.meetsPressure === null);
    if (meetsAll && recommendedDN === null) {
      row.recommended = true;
      recommendedDN = row.dn;
      break;
    }
  }

  return { rows, recommendedDN };
}
