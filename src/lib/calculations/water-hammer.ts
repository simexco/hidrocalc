/* ════════════════════════════════════════
   Water Hammer Calculation Engine
   Module 3
   ════════════════════════════════════════ */

import { K_AGUA, RHO, G, PIPE_CLASSES_BY_MATERIAL } from "@/lib/constants";
import type { WaterHammerInputs, WaterHammerResults, Alert } from "@/types/hydraulic";

export function calculateWaterHammer(input: WaterHammerInputs): WaterHammerResults | null {
  const { V0, D, e, E, P0, Tc, L } = input;

  if (V0 == null || D == null || e == null || E == null || L == null || Tc == null) {
    return null;
  }
  if (E <= 0 || e <= 0 || D <= 0) return null;

  const D_m = D / 1000;  // mm → m
  const e_m = e / 1000;  // mm → m

  // Wave speed
  const a = Math.sqrt(K_AGUA / RHO) / Math.sqrt(1 + (K_AGUA * D_m) / (E * e_m));

  // Phase period
  const Tphase = 2 * L / a;

  // Closure type
  const closureType = Tc < Tphase ? "brusco" as const : "lento" as const;

  // Pressure surge
  let deltaP: number;
  if (Tc < Tphase) {
    deltaP = RHO * a * V0;
  } else {
    deltaP = RHO * a * V0 * (Tphase / Tc);
  }

  const deltaH = deltaP / (RHO * G);

  // Max/min pressures
  const Pmax = (P0 ?? 0) + deltaH;
  const Pmin = (P0 ?? 0) - deltaH;
  const Pmax_bar = Pmax * G / 100;
  const deltaP_kPa = deltaP / 1000;
  const deltaP_bar = deltaP / 100000;

  // Pipe class recommendation (material-specific)
  let pipeClass: string | null = null;
  const alerts: Alert[] = [];

  const matClasses = PIPE_CLASSES_BY_MATERIAL[input.materialName];
  if (matClasses) {
    let classFound = false;
    for (const pc of matClasses.classes) {
      if (Pmax_bar <= pc.pn) {
        pipeClass = pc.clase;
        alerts.push({ level: "OK", field: "pipeClass", message: `${pc.clase} (PN ${pc.pn} bar) adecuada para Pmax = ${Pmax_bar.toFixed(1)} bar` });
        classFound = true;
        break;
      }
    }
    if (!classFound) {
      const maxClass = matClasses.classes[matClasses.classes.length - 1];
      pipeClass = `Excede ${maxClass.clase}`;
      alerts.push({ level: "ERROR", field: "pipeClass", message: `Pmax (${Pmax_bar.toFixed(1)} bar) excede la clase maxima disponible (${maxClass.clase} PN ${maxClass.pn}). Revisar diseno o instalar proteccion contra ariete.` });
    }
  } else {
    pipeClass = null;
    alerts.push({ level: "WARN", field: "pipeClass", message: "Recomendacion de clase no disponible para este material. Consultar norma del proyecto." });
  }

  // Closure type alert
  if (closureType === "brusco") {
    alerts.push({ level: "WARN", field: "closure", message: `Cierre brusco (Tc=${Tc}s < Tfase=${Tphase.toFixed(2)}s)` });
  } else {
    alerts.push({ level: "OK", field: "closure", message: `Cierre lento (Tc=${Tc}s ≥ Tfase=${Tphase.toFixed(2)}s)` });
  }

  // Negative pressure alerts
  if (Pmin < -10) {
    alerts.push({ level: "CRITICAL", field: "Pmin", message: "Cavitación probable — instalar válvula de alivio" });
  } else if (Pmin < 0) {
    alerts.push({ level: "ERROR", field: "Pmin", message: "Riesgo de colapso de tubería (presión negativa transitoria)" });
  }

  // Safe closure time recommendation
  const safeTc = Tphase;  // minimum for "slow" closure

  return {
    a,
    Tphase,
    closureType,
    deltaH,
    deltaP_kPa,
    deltaP_bar,
    Pmax,
    Pmin,
    Pmax_bar,
    pipeClass,
    safeTc,
    alerts,
    dataStatus: P0 != null ? "calculated" : "estimated",
  };
}
