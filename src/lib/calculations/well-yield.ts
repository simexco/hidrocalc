/* ════════════════════════════════════════
   Fuente de Abastecimiento — Aforo de Pozo
   Caudal de explotación a partir de prueba de bombeo
   CONAGUA MAPAS — Estudios de fuentes
   ════════════════════════════════════════ */

export interface WellYieldInputs {
  projectName: string;
  // Datos de la prueba de bombeo
  nivelEstatico: number | null;    // m — profundidad al agua sin bombear (desde la superficie)
  nivelDinamico: number | null;    // m — profundidad al agua bombeando a Qprueba
  Qprueba_ls: number | null;       // L/s — caudal de la prueba
  profundidadPozo: number | null;  // m — profundidad total del pozo (opcional)
  // Criterio de explotación
  factorSeguridad: number;         // fracción del abatimiento máx usable (default 0.7)
  // Demanda del proyecto (para comparar)
  QMD_ls: number | null;           // L/s — gasto máximo diario requerido
  horasBombeo: number;             // horas de bombeo al día
}

export interface WellYieldResults {
  abatimiento: number;             // m — s = ND - NE
  caudalEspecifico: number;        // L/s por metro de abatimiento
  abatimientoMaximo: number | null; // m — desde NE hasta fondo (si hay profundidad)
  abatimientoPermisible: number | null; // m
  Qexplotacion_ls: number;         // L/s — caudal de explotación recomendado
  Qexplotacion_m3h: number;
  // Comparación con demanda
  cubreDemanda: boolean | null;
  numPozos: number | null;          // cuántos pozos se necesitan
  Qbombeo_requerido_ls: number | null; // QMD ajustado por horas de bombeo
  volDiarioPozo_m3: number;        // volumen que aporta el pozo al día
  alerts: { level: "WARN" | "ERROR"; message: string }[];
}

export function calculateWellYield(input: WellYieldInputs): WellYieldResults | null {
  const { nivelEstatico, nivelDinamico, Qprueba_ls, profundidadPozo, factorSeguridad, QMD_ls, horasBombeo } = input;

  if (nivelEstatico == null || nivelDinamico == null || Qprueba_ls == null || Qprueba_ls <= 0) return null;

  const alerts: WellYieldResults["alerts"] = [];

  // Abatimiento (drawdown)
  const abatimiento = nivelDinamico - nivelEstatico;
  if (abatimiento <= 0) {
    alerts.push({ level: "ERROR", message: "El nivel dinamico debe ser mayor que el estatico (el agua baja al bombear)" });
    return {
      abatimiento, caudalEspecifico: 0, abatimientoMaximo: null, abatimientoPermisible: null,
      Qexplotacion_ls: 0, Qexplotacion_m3h: 0, cubreDemanda: null, numPozos: null,
      Qbombeo_requerido_ls: null, volDiarioPozo_m3: 0, alerts,
    };
  }

  // Caudal específico (specific capacity)
  const caudalEspecifico = Qprueba_ls / abatimiento;

  // Maximum drawdown available (from static level to bottom of well)
  const abatimientoMaximo = profundidadPozo != null && profundidadPozo > nivelEstatico
    ? profundidadPozo - nivelEstatico
    : null;

  // Permissible drawdown = factor × max drawdown (or based on test if no depth)
  const fs = factorSeguridad > 0 && factorSeguridad <= 1 ? factorSeguridad : 0.7;
  const abatimientoPermisible = abatimientoMaximo != null
    ? abatimientoMaximo * fs
    : abatimiento * 1.2; // if no depth data, allow 20% more than test drawdown (conservative)

  // Exploitation flow = specific capacity × permissible drawdown
  const Qexplotacion_ls = caudalEspecifico * abatimientoPermisible;
  const Qexplotacion_m3h = Qexplotacion_ls * 3.6;

  // Daily volume the well provides (pumping horasBombeo)
  const volDiarioPozo_m3 = (Qexplotacion_ls * horasBombeo * 3600) / 1000;

  // Compare with demand
  let cubreDemanda: boolean | null = null;
  let numPozos: number | null = null;
  let Qbombeo_requerido_ls: number | null = null;

  if (QMD_ls != null && QMD_ls > 0) {
    // The well pumps horasBombeo/day, so it must supply the full daily demand in that time
    Qbombeo_requerido_ls = QMD_ls * (24 / horasBombeo);
    cubreDemanda = Qexplotacion_ls >= Qbombeo_requerido_ls;
    numPozos = Math.ceil(Qbombeo_requerido_ls / Qexplotacion_ls);
  }

  // Alerts
  if (caudalEspecifico < 0.5) alerts.push({ level: "WARN", message: `Caudal especifico bajo (${caudalEspecifico.toFixed(2)} L/s/m) — el pozo es poco productivo` });
  if (abatimiento > 30) alerts.push({ level: "WARN", message: `Abatimiento alto (${abatimiento.toFixed(1)}m) — verificar bomba sumergible y profundidad` });
  if (abatimientoMaximo != null && abatimiento > abatimientoMaximo * 0.8) {
    alerts.push({ level: "WARN", message: "El abatimiento de prueba ya está cerca del fondo del pozo — riesgo de bombear en seco" });
  }
  if (cubreDemanda === false && numPozos != null) {
    alerts.push({ level: "ERROR", message: `Un solo pozo NO cubre la demanda — se requieren ${numPozos} pozos similares` });
  }

  return {
    abatimiento, caudalEspecifico, abatimientoMaximo, abatimientoPermisible,
    Qexplotacion_ls, Qexplotacion_m3h, cubreDemanda, numPozos,
    Qbombeo_requerido_ls, volDiarioPozo_m3, alerts,
  };
}
