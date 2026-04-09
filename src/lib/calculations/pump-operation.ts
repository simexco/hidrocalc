/* ════════════════════════════════════════
   Pump Operation Point Calculation
   Module 4 — with pump recommendation
   ════════════════════════════════════════ */

import { calculateHazenWilliams } from "./hazen-williams";
import type { PumpOperationInputs, PumpOperationResults, PumpPoint, PumpRecommendation, Alert } from "@/types/hydraulic";

const G = 9.81;
const RHO = 1000; // kg/m³

/**
 * Interpolate pump curve from points (piecewise linear).
 */
function interpolatePumpCurve(points: PumpPoint[], Q: number): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.Q - b.Q);

  if (Q <= sorted[0].Q) return sorted[0].H;
  if (Q >= sorted[sorted.length - 1].Q) return sorted[sorted.length - 1].H;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (Q >= sorted[i].Q && Q <= sorted[i + 1].Q) {
      const t = (Q - sorted[i].Q) / (sorted[i + 1].Q - sorted[i].Q);
      return sorted[i].H + t * (sorted[i + 1].H - sorted[i].H);
    }
  }
  return null;
}

/**
 * Recommend pump type based on Q (L/s) and H (m).
 */
function recommendPumpType(Q: number, H: number): { type: string; desc: string; rpm: number } {
  // Ranges based on Mexican water utility practice
  if (H <= 15 && Q >= 50) {
    return { type: "Bomba centrífuga horizontal", desc: "Caudal alto, carga baja. Ideal para estaciones de rebombeo y pozos someros.", rpm: 1750 };
  }
  if (H <= 30 && Q >= 20) {
    return { type: "Bomba centrífuga horizontal", desc: "Rango de operación estándar para redes de distribución.", rpm: 1750 };
  }
  if (H > 30 && H <= 100 && Q >= 5) {
    return { type: "Bomba centrífuga multietapa vertical", desc: "Cargas medias-altas. Común en sistemas con desniveles significativos.", rpm: 3500 };
  }
  if (H > 100) {
    return { type: "Bomba de turbina vertical / sumergible", desc: "Cargas muy altas. Para pozos profundos o sistemas con mucha elevación.", rpm: 3500 };
  }
  if (Q < 5 && H > 20) {
    return { type: "Bomba sumergible", desc: "Caudales bajos con carga alta. Típica en pozos de agua potable.", rpm: 3500 };
  }
  if (Q < 5 && H <= 20) {
    return { type: "Bomba centrífuga horizontal monoetapa", desc: "Caudal bajo, carga baja. Para sistemas pequeños y domésticos.", rpm: 1750 };
  }
  return { type: "Bomba centrífuga horizontal", desc: "Tipo general recomendado. Consultar catálogo del fabricante.", rpm: 1750 };
}

/**
 * Estimate minimum pump efficiency based on Q.
 */
function estimateEfficiency(Q: number): number {
  // Based on CONAGUA guidelines for water supply pumps
  if (Q < 5) return 55;
  if (Q < 15) return 65;
  if (Q < 30) return 70;
  if (Q < 60) return 75;
  if (Q < 100) return 78;
  return 80;
}

/**
 * Estimate NPSH required (rough estimate based on pump type and Q).
 */
function estimateNPSHr(Q: number, rpm: number): number {
  // Simplified Thoma correlation: NPSHr ~ Ns^(4/3) factor
  // For practical purposes, use empírical ranges:
  if (rpm <= 1750) {
    if (Q < 10) return 2.0;
    if (Q < 30) return 3.0;
    if (Q < 60) return 4.0;
    return 5.0;
  } else {
    // 3500 RPM
    if (Q < 10) return 3.5;
    if (Q < 30) return 5.0;
    if (Q < 60) return 7.0;
    return 9.0;
  }
}

/**
 * Generate pump recommendation from operation point.
 */
function generateRecommendation(Qop: number, Hop: number, Hg: number): PumpRecommendation {
  const eff = estimateEfficiency(Qop);
  const effDecimal = eff / 100;

  const { type, desc, rpm } = recommendPumpType(Qop, Hop);
  const NPSHr = estimateNPSHr(Qop, rpm);

  // Power: P = (ρ × g × Q × H) / (η × 1000)
  const Q_m3s = Qop / 1000;
  const powerHydraulic = RHO * G * Q_m3s * Hop; // Watts
  const powerMotor = powerHydraulic / effDecimal; // Watts (including efficiency)
  const powerKW = powerMotor / 1000;
  const powerHP = powerKW * 1.341;

  // Round up to next standard motor size
  const standardHP = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];
  const recommendedHP = standardHP.find((hp) => hp >= powerHP) ?? powerHP;
  const recommendedKW = recommendedHP / 1.341;

  // Observations
  const obs: string[] = [];

  if (Qop < 2) {
    obs.push("Caudal muy bajo — considerar bomba de desplazamiento positivo.");
  }
  if (Hop > 80) {
    obs.push("Carga muy alta — verificar que la tubería soporte la presión de trabajo.");
  }
  if (powerHP > 50) {
    obs.push("Motor de alta potencia — verificar disponibilidad de energía eléctrica y arrancador.");
  }
  if (powerHP > 15) {
    obs.push("Se recomienda arrancador suave o variador de frecuencia (VFD) para reducir golpe de ariete.");
  }
  if (Hg > Hop * 0.8) {
    obs.push("La altura estática domina — la bomba trabaja cerca de carga máxima, verificar eficiencia.");
  }
  if (NPSHr > 5) {
    obs.push("NPSH requerido alto — verificar que NPSH disponible en la instalación sea mayor.");
  }

  obs.push("Seleccionar bomba con curva Q-H del fabricante que pase por el punto de operación.");
  obs.push("Verificar NPSH disponible >= NPSH requerido + 1 m de margen de seguridad.");

  return {
    pumpType: type,
    pumpTypeDesc: desc,
    powerKW: Math.round(recommendedKW * 100) / 100,
    powerHP: recommendedHP,
    minEfficiency: eff,
    NPSHr_estimated: NPSHr,
    motorRPM: rpm,
    observations: obs,
  };
}

export function calculatePumpOperation(input: PumpOperationInputs): PumpOperationResults | null {
  const { Hg, L, DN, C, kTotal, pumpMethod, pumpPoints, H0, Kbomba } = input;

  if (Hg == null || L == null || DN == null) return null;

  const D = DN / 1000;
  const alerts: Alert[] = [];

  // Generate system curve
  const Qmax_Ls = 200;
  const step = 0.5;
  const systemCurve: { Q: number; H: number }[] = [];
  const pumpCurve: { Q: number; H: number }[] = [];

  for (let QLs = 0; QLs <= Qmax_Ls; QLs += step) {
    const Q_m3s = QLs / 1000;

    if (Q_m3s > 0) {
      const result = calculateHazenWilliams({
        Q: Q_m3s, D, L, C, z1: 0, z2: 0,
        useEstimatedHm: kTotal > 0 ? false : true,
      });
      const V = result.V;
      const hmManual = kTotal * V * V / (2 * G);
      const Hsys = Hg + result.hf + (kTotal > 0 ? hmManual : result.hm);
      systemCurve.push({ Q: QLs, H: Hsys });
    } else {
      systemCurve.push({ Q: 0, H: Hg });
    }

    // Pump curve
    let Hpump: number | null = null;
    if (pumpMethod === "equation" && H0 != null && Kbomba != null) {
      Hpump = H0 - Kbomba * QLs * QLs;
    } else if (pumpMethod === "points" && pumpPoints.length >= 2) {
      Hpump = interpolatePumpCurve(pumpPoints, QLs);
    }
    if (Hpump != null && Hpump > 0) {
      pumpCurve.push({ Q: QLs, H: Hpump });
    }
  }

  // Find intersection
  let Qop: number | null = null;
  let Hop: number | null = null;
  let minDiff = Infinity;

  for (let i = 0; i < systemCurve.length; i++) {
    const pPump = pumpCurve.find((p) => Math.abs(p.Q - systemCurve[i].Q) < step / 2);
    if (!pPump) continue;

    const diff = Math.abs(pPump.H - systemCurve[i].H);
    if (diff < minDiff && pPump.H >= systemCurve[i].H - 1) {
      minDiff = diff;
      if (diff < 2) {
        Qop = systemCurve[i].Q;
        Hop = (pPump.H + systemCurve[i].H) / 2;
      }
    }
  }

  // Generate recommendation
  let recommendation: PumpRecommendation | null = null;

  if (Qop != null && Qop > 0 && Hop != null && Hop > 0) {
    recommendation = generateRecommendation(Qop, Hop, Hg);
    alerts.push({ level: "OK", field: "Qop", message: `Punto de operación: ${Qop.toFixed(1)} L/s @ ${Hop.toFixed(1)} m` });
  } else if (Qop === null || Qop === 0) {
    alerts.push({ level: "ERROR", field: "Qop", message: "La curva del sistema no intersecta la curva de la bomba" });
  } else if (Hop != null && Hop < Hg) {
    alerts.push({ level: "ERROR", field: "Hop", message: "La bomba no vence la altura estática" });
  }

  return {
    Qop, Hop, systemCurve, pumpCurve, recommendation, alerts, dataStatus: "calculated",
  };
}
