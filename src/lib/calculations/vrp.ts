/* ════════════════════════════════════════
   VRP — Válvula Reductora de Presión
   Cálculo de Cv y selección de tamaño
   IEC 60534 / Crane TP-410
   ════════════════════════════════════════ */

import type { VRPInputs, VRPResults, VRPSelectionRow, Alert } from "@/types/hydraulic";

// Tabla de Cv máximo por DN (válvulas globo/diafragma piloto-operadas)
const VRP_TABLE: Array<{ dn: string; dn_mm: number; cv_max: number }> = [
  { dn: '2"',  dn_mm: 50,  cv_max: 18  },
  { dn: '3"',  dn_mm: 75,  cv_max: 45  },
  { dn: '4"',  dn_mm: 100, cv_max: 82  },
  { dn: '6"',  dn_mm: 150, cv_max: 185 },
  { dn: '8"',  dn_mm: 200, cv_max: 330 },
  { dn: '10"', dn_mm: 250, cv_max: 515 },
  { dn: '12"', dn_mm: 300, cv_max: 740 },
];

export function calculateVRP(inputs: VRPInputs): VRPResults | null {
  const { rawQMax, rawQMin, P1, P2, DN, flowUnit } = inputs;

  if (rawQMax == null || rawQMax <= 0 || P1 == null || P2 == null || DN == null) return null;

  const alerts: Alert[] = [];

  // Validations
  if (P2 >= P1) {
    alerts.push({ level: "ERROR", field: "P2", message: "P2 debe ser menor que P1" });
    return {
      Cv_max_req: 0, Cv_min_req: 0, deltaP_bar: 0, Q_max_m3h: 0, Q_min_m3h: 0,
      sigma: 0, riesgoCavitacion: false, relacionPresion: 0, dobleEtapa: false,
      v_aguas_abajo: 0, recommendedDN: null, recommendedDN_mm: null,
      pct_apertura_max: null, pct_apertura_min: null, selectionTable: [],
      alerts, dataStatus: "calculated",
    };
  }

  // Convert Q to m³/h
  const qMax_ls = flowUnit === "m³/h" ? rawQMax / 3.6 : rawQMax;
  const Q_max_m3h = qMax_ls * 3.6;

  const qMin_ls = rawQMin != null && rawQMin > 0
    ? (flowUnit === "m³/h" ? rawQMin / 3.6 : rawQMin)
    : qMax_ls * 0.1;
  const Q_min_m3h = qMin_ls * 3.6;

  if (rawQMin != null && rawQMin > 0 && rawQMin >= rawQMax) {
    alerts.push({ level: "WARN", field: "qMin", message: "Q minimo debe ser menor que Q maximo" });
  }

  // Convert pressures to bar
  const P1_bar = P1 * 0.9807;
  const P2_bar = P2 * 0.9807;
  const deltaP_bar = P1_bar - P2_bar;

  // 1. Cv requerido (IEC 60534: Q(m³/h) = Cv × √(ΔP/SG), SG=1)
  const Cv_max_req = Q_max_m3h / Math.sqrt(deltaP_bar);
  const Cv_min_req = Q_min_m3h / Math.sqrt(deltaP_bar);

  // 2. Selección: válvula donde Cv_max_req ≤ 70% de Cv_max
  const vrp_seleccionada = VRP_TABLE.find(v => v.cv_max * 0.70 >= Cv_max_req);

  // 3. Apertura
  const pct_apertura_max = vrp_seleccionada
    ? Math.round((Cv_max_req / vrp_seleccionada.cv_max) * 100)
    : null;
  const pct_apertura_min = vrp_seleccionada
    ? Math.round((Cv_min_req / vrp_seleccionada.cv_max) * 100)
    : null;

  // 4. Índice de cavitación (σ de Thoma simplificado)
  const sigma = P2_bar / (P1_bar - P2_bar);
  const riesgoCavitacion = sigma < 0.5;

  // 5. Relación de reducción
  const relacionPresion = parseFloat((P1 / P2).toFixed(2));
  const dobleEtapa = relacionPresion > 3.0;

  // 6. Velocidad aguas abajo
  const dn_m = DN / 1000;
  const A_linea = Math.PI * Math.pow(dn_m / 2, 2);
  const v_aguas_abajo = (Q_max_m3h / 3600) / A_linea;

  // 7. Tabla de selección completa
  const selectionTable: VRPSelectionRow[] = VRP_TABLE.map(v => {
    const pct_max = Math.round((Cv_max_req / v.cv_max) * 100);
    const pct_min = Math.round((Cv_min_req / v.cv_max) * 100);
    const insuf = Cv_max_req > v.cv_max;

    let status: VRPSelectionRow["status"];
    if (insuf) status = "insuficiente";
    else if (pct_max > 75) status = "limite";
    else if (pct_max >= 35 && pct_max <= 65) status = "optimo";
    else status = "funcional";

    return {
      dn: v.dn,
      dn_mm: v.dn_mm,
      cv_max: v.cv_max,
      pct_max,
      pct_min,
      status,
      isRecommended: vrp_seleccionada?.dn === v.dn,
    };
  });

  // Alerts
  if (riesgoCavitacion) {
    alerts.push({
      level: "WARN", field: "sigma",
      message: `Indice de cavitacion bajo (\u03C3=${sigma.toFixed(2)}) \u2014 Verificar con fabricante, considerar valvula anticavitacion`,
    });
  }
  if (dobleEtapa) {
    alerts.push({
      level: "WARN", field: "presion",
      message: `Relacion de presion > 3:1 (${relacionPresion}:1) \u2014 Considerar dos VRP en serie`,
    });
  }
  if (pct_apertura_min != null && pct_apertura_min < 10) {
    alerts.push({
      level: "WARN", field: "apertura",
      message: `Apertura minima < 10% (${pct_apertura_min}%) \u2014 Posible inestabilidad a caudal minimo`,
    });
  }
  if (v_aguas_abajo > 3.0) {
    alerts.push({
      level: "WARN", field: "velocidad",
      message: `Velocidad aguas abajo elevada (${v_aguas_abajo.toFixed(1)} m/s) \u2014 Considerar DN mayor`,
    });
  }
  if (!vrp_seleccionada) {
    alerts.push({
      level: "ERROR", field: "seleccion",
      message: "El Cv requerido excede los tamanos estandar de catalogo. Consultar directamente con el fabricante.",
    });
  }

  return {
    Cv_max_req,
    Cv_min_req,
    deltaP_bar,
    Q_max_m3h,
    Q_min_m3h,
    sigma,
    riesgoCavitacion,
    relacionPresion,
    dobleEtapa,
    v_aguas_abajo,
    recommendedDN: vrp_seleccionada?.dn ?? null,
    recommendedDN_mm: vrp_seleccionada?.dn_mm ?? null,
    pct_apertura_max,
    pct_apertura_min,
    selectionTable,
    alerts,
    dataStatus: "calculated",
  };
}
