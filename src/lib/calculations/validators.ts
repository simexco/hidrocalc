/* ════════════════════════════════════════
   Alert & Validation Logic
   ════════════════════════════════════════ */

import type { Alert } from "@/types/hydraulic";
import { VELOCITY_LIMITS, PRESSURE_LIMITS, GRADIENT_LIMITS } from "@/lib/constants";

export function getVelocityAlerts(V: number | null): Alert[] {
  if (V == null || !isFinite(V) || V < 0) return [];
  const alerts: Alert[] = [];

  if (V < VELOCITY_LIMITS.sedimentationRisk) {
    alerts.push({ level: "ERROR", field: "V", message: "Velocidad minima no alcanzada (V < 0.3 m/s) — riesgo sedimentación. Hazen-Williams pierde precision a flujos laminares, verificar con Darcy-Weisbach." });
  } else if (V < VELOCITY_LIMITS.lowerLimit) {
    alerts.push({ level: "WARN", field: "V", message: "Velocidad en limite inferior (V < 0.5 m/s) — Hazen-Williams pierde precision. Verificar con Darcy-Weisbach." });
  } else if (V <= VELOCITY_LIMITS.upperLimit) {
    alerts.push({ level: "OK", field: "V", message: "Velocidad en rango recomendado NOM (0.5 - 2.5 m/s)" });
  } else if (V <= VELOCITY_LIMITS.highWarning) {
    alerts.push({ level: "WARN", field: "V", message: "Velocidad elevada (V > 2.5 m/s) — revisar golpe de ariete" });
  } else {
    alerts.push({ level: "ERROR", field: "V", message: "Velocidad excesiva (V > 3.5 m/s) — erosión y golpe de ariete" });
  }

  return alerts;
}

export function getPressureAlerts(P2: number | null): Alert[] {
  if (P2 == null) return [];
  const alerts: Alert[] = [];

  if (P2 < PRESSURE_LIMITS.negative) {
    alerts.push({ level: "CRITICAL", field: "P2", message: "Presión negativa — posible cavitación" });
  } else if (P2 < PRESSURE_LIMITS.minCONAGUA) {
    alerts.push({ level: "ERROR", field: "P2", message: "Presión insuficiente (min. CONAGUA: 1.0 kg/cm2 = 10 m.c.a.)" });
  } else if (P2 <= PRESSURE_LIMITS.maxNormal) {
    alerts.push({ level: "OK", field: "P2", message: "Presión dentro de rango normativo" });
  } else if (P2 <= PRESSURE_LIMITS.excessive) {
    alerts.push({ level: "WARN", field: "P2", message: "Presión elevada — considerar válvula reductora" });
  } else {
    alerts.push({ level: "ERROR", field: "P2", message: "Presión excesiva — revisar diseño" });
  }

  return alerts;
}

export function getGradientAlerts(J_km: number | null): Alert[] {
  if (J_km == null || !isFinite(J_km)) return [];
  const alerts: Alert[] = [];

  if (J_km < GRADIENT_LIMITS.low) {
    alerts.push({ level: "WARN", field: "J", message: "Gradiente muy bajo (J < 1 m/km) — posible sobredimensionamiento" });
  } else if (J_km <= GRADIENT_LIMITS.optimalMax) {
    alerts.push({ level: "OK", field: "J", message: "Gradiente óptimo (J <= 5 m/km) — Ref. NOM-001-CONAGUA" });
  } else if (J_km <= GRADIENT_LIMITS.acceptableMax) {
    alerts.push({ level: "WARN", field: "J", message: "Gradiente aceptable (5 < J <= 10 m/km) — verificar con proyecto. Ref. NOM-001-CONAGUA" });
  } else {
    alerts.push({ level: "ERROR", field: "J", message: "Gradiente alto (J > 10 m/km) — revisar diametro. Ref. NOM-001-CONAGUA: J óptimo < 5, maximo 10 m/km" });
  }

  return alerts;
}

/**
 * Validates a numeric result - returns null if NaN/Infinity/negative-when-shouldnt-be
 */
export function safeNumber(val: number | null | undefined): number | null {
  if (val == null || !isFinite(val)) return null;
  return val;
}
