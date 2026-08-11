/* ════════════════════════════════════════
   Water Hammer Calculation Engine
   Module 3
   ════════════════════════════════════════ */

import { K_AGUA, RHO, G, PIPE_CLASSES_BY_MATERIAL, getPVCClasses, type PVCSystem, type PipeClassRow } from "@/lib/constants";
import type { WaterHammerInputs, WaterHammerResults, Alert } from "@/types/hydraulic";

export function calculateWaterHammer(input: WaterHammerInputs, pvcSystem?: PVCSystem): WaterHammerResults | null {
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

  // Get class table: for PVC use subsystem with D-based C900/C905 selection
  let matClassesData: { title: string; note?: string; classes: PipeClassRow[] } | null = null;
  if (input.materialName === "PVC" && pvcSystem) {
    matClassesData = getPVCClasses(pvcSystem, pvcSystem === "c905");
  } else {
    matClassesData = PIPE_CLASSES_BY_MATERIAL[input.materialName] ?? null;
  }
  const matClasses = matClassesData;
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
      alerts.push({ level: "ERROR", field: "pipeClass", message: `Pmax (${Pmax_bar.toFixed(1)} bar) excede la clase maxima disponible (${maxClass.clase} PN ${maxClass.pn}). Revisar diseño o instalar proteccion contra ariete.` });
    }
  } else {
    pipeClass = null;
    alerts.push({ level: "WARN", field: "pipeClass", message: "Recomendacion de clase no disponible para este material. Consultar norma del proyecto." });
  }

  // Closure type alert — OJO: en Tc = Tfase el golpe sigue siendo el maximo (Michaud = Joukowsky).
  // Solo se considera "reducido" cuando Tc es claramente mayor que Tfase.
  if (closureType === "brusco") {
    alerts.push({ level: "WARN", field: "closure", message: `Cierre brusco (Tc=${Tc}s < Tfase=${Tphase.toFixed(2)}s) — sobrepresion maxima (Joukowsky)` });
  } else if (Tc < 2 * Tphase) {
    alerts.push({ level: "WARN", field: "closure", message: `Cierre lento (Tc=${Tc}s ≥ Tfase=${Tphase.toFixed(2)}s), pero el golpe aun es ${Math.round(100 * Tphase / Tc)}% del maximo — aumentar Tc lo reduce en proporcion` });
  } else {
    alerts.push({ level: "OK", field: "closure", message: `Cierre lento (Tc=${Tc}s): el golpe se reduce a ${Math.round(100 * Tphase / Tc)}% del maximo` });
  }

  // Negative pressure alerts — SOLO si se conoce P0.
  // Sin P0 el motor asume P0=0 y Pmin siempre saldria negativa (falso positivo).
  if (P0 != null) {
    // Contra vacio protege la valvula de ADMISION DE AIRE (ventosa) en puntos altos;
    // la valvula de alivio solo actua contra sobrepresion (no puede abrir en depresion).
    if (Pmin < -10) {
      alerts.push({ level: "CRITICAL", field: "Pmin", message: "Vacío casi total — separación de columna probable. Instalar válvula de admisión de aire (ventosa) en los puntos altos; la válvula de alivio NO protege contra vacío." });
    } else if (Pmin < 0) {
      alerts.push({ level: "ERROR", field: "Pmin", message: "Presión negativa transitoria — riesgo de colapso del tubo. Instalar válvula de admisión de aire (ventosa) en los puntos altos." });
    }
  } else {
    alerts.push({ level: "WARN", field: "Pmin", message: "Ingresa la presión de operación P0 para evaluar la presión mínima y el riesgo de cavitación." });
  }

  // Frontera brusco/lento (2L/a). NO es un tiempo "seguro": cerrando exactamente en
  // Tc = 2L/a el golpe sigue siendo el maximo; se reduce en proporcion Tfase/Tc.
  const safeTc = Tphase;

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
