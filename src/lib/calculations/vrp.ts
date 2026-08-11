/* ════════════════════════════════════════
   VRP — Válvula Reductora de Presión
   Cálculo de Kv (coeficiente métrico, IEC 60534) y selección de tamaño.
   Kv: Q(m³/h) = Kv·√(ΔP bar). Cv (US) = 1.156·Kv.
   Tabla Kv base: válvula globo piloto-operada (Cla-Val 100-01 / Bermad 700).
   ════════════════════════════════════════ */

import { KV_VALVULAS_GLOBO, KV_FACTOR_SELECCION } from "@/lib/constants";
import type { VRPInputs, VRPResults, VRPSelectionRow, Alert } from "@/types/hydraulic";

const P_ATM_BAR = 1.013;   // presión atmosférica a nivel del mar
const P_VAPOR_BAR = 0.023; // presión de vapor del agua a 20 °C

export function calculateVRP(inputs: VRPInputs): VRPResults | null {
  const { rawQMax, rawQMin, P1, P2, DN, flowUnit } = inputs;

  if (rawQMax == null || rawQMax <= 0 || P1 == null || P2 == null || DN == null) return null;

  const alerts: Alert[] = [];

  // Validations
  if (P2 >= P1) {
    alerts.push({ level: "ERROR", field: "P2", message: "P2 debe ser menor que P1" });
    return {
      Kv_max_req: 0, Kv_min_req: 0, deltaP_bar: 0, Q_max_m3h: 0, Q_min_m3h: 0,
      sigma: 0, riesgoCavitacion: false, relacionPresion: 0, dobleEtapa: false,
      v_aguas_abajo: 0, recommendedDN: null, recommendedDN_mm: null,
      pct_capacidad_max: null, pct_capacidad_min: null, selectionTable: [],
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

  // 1. Kv requerido (IEC 60534: Q(m³/h) = Kv × √(ΔP/SG), SG=1). Cv = 1.156·Kv.
  const Kv_max_req = Q_max_m3h / Math.sqrt(deltaP_bar);
  const Kv_min_req = Q_min_m3h / Math.sqrt(deltaP_bar);

  // 2. Selección: válvula más chica donde Kv_req ≤ 70% de su Kv máximo
  const vrp_seleccionada = KV_VALVULAS_GLOBO.find(v => v.kv_max * KV_FACTOR_SELECCION >= Kv_max_req);

  // 3. % de la capacidad Kv utilizada (NO es % de carrera/apertura: la curva Kv-apertura
  //    de una válvula globo no es lineal — verificar con la curva del fabricante)
  const pct_capacidad_max = vrp_seleccionada
    ? Math.round((Kv_max_req / vrp_seleccionada.kv_max) * 100)
    : null;
  const pct_capacidad_min = vrp_seleccionada
    ? Math.round((Kv_min_req / vrp_seleccionada.kv_max) * 100)
    : null;

  // 4. Índice de cavitación — forma aguas abajo con presiones ABSOLUTAS
  //    (la que usan las cartas de fabricante): σ = (P2 + Patm − Pv) / (P1 − P2)
  const sigma = (P2_bar + P_ATM_BAR - P_VAPOR_BAR) / deltaP_bar;
  const riesgoCavitacion = sigma < 1.5;

  // 5. Relación de reducción (manométrica, regla de campo 3:1)
  const relacionPresion = parseFloat((P1 / P2).toFixed(2));
  const dobleEtapa = relacionPresion > 3.0;

  // 6. Velocidad aguas abajo (en la línea)
  const dn_m = DN / 1000;
  const A_linea = Math.PI * Math.pow(dn_m / 2, 2);
  const v_aguas_abajo = (Q_max_m3h / 3600) / A_linea;

  // 6b. Velocidad a través de la válvula seleccionada (límite continuo ~6 m/s)
  const v_valvula = vrp_seleccionada
    ? (Q_max_m3h / 3600) / (Math.PI * Math.pow(vrp_seleccionada.dn_mm / 2000, 2))
    : null;

  // 7. Tabla de selección completa
  const selectionTable: VRPSelectionRow[] = KV_VALVULAS_GLOBO.map(v => {
    const pct_max = Math.round((Kv_max_req / v.kv_max) * 100);
    const pct_min = Math.round((Kv_min_req / v.kv_max) * 100);
    const insuf = Kv_max_req > v.kv_max;

    let status: VRPSelectionRow["status"];
    if (insuf) status = "insuficiente";
    else if (pct_max > 75) status = "limite";
    else if (pct_max >= 35 && pct_max <= 65) status = "optimo";
    else if (pct_max < 20) status = "sobredimensionada";
    else status = "funcional";

    return {
      dn: v.dn,
      dn_mm: v.dn_mm,
      kv_max: v.kv_max,
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
      message: `Indice de cavitacion σ=${sigma.toFixed(2)} < 1.5 (aguas abajo, presiones absolutas) — zona de cavitacion probable: verificar carta anticavitacion del fabricante o considerar valvula anticavitacion`,
    });
  }
  if (dobleEtapa) {
    alerts.push({
      level: "WARN", field: "presion",
      message: `Relacion de presion > 3:1 (${relacionPresion}:1) — Considerar dos VRP en serie`,
    });
  }
  if (pct_capacidad_min != null && pct_capacidad_min < 10) {
    alerts.push({
      level: "WARN", field: "apertura",
      message: `A caudal minimo la valvula usaria ${pct_capacidad_min}% de su capacidad (<10%) — verificar el caudal minimo controlable con el fabricante (posible inestabilidad)`,
    });
  }
  if (pct_capacidad_max != null && pct_capacidad_max < 30) {
    alerts.push({
      level: "WARN", field: "apertura",
      message: `A caudal maximo la valvula usaria solo ${pct_capacidad_max}% de su capacidad — posible sobredimension; verificar con el fabricante o considerar un DN menor`,
    });
  }
  if (v_aguas_abajo > 3.0) {
    alerts.push({
      level: "WARN", field: "velocidad",
      message: `Velocidad aguas abajo elevada (${v_aguas_abajo.toFixed(1)} m/s) — Considerar DN mayor`,
    });
  }
  if (v_valvula != null && v_valvula > 6.0) {
    alerts.push({
      level: "WARN", field: "velocidad",
      message: `Velocidad a traves de la valvula ${v_valvula.toFixed(1)} m/s > 6 m/s (limite continuo tipico) — considerar un DN de valvula mayor`,
    });
  }
  if (vrp_seleccionada != null && vrp_seleccionada.dn_mm > DN) {
    alerts.push({
      level: "WARN", field: "seleccion",
      message: `La VRP recomendada (${vrp_seleccionada.dn}) es mayor que la linea (${DN} mm) — poco usual (la VRP suele ser 1-2 DN menor que la linea); revisar Q y presiones capturados`,
    });
  }
  if (!vrp_seleccionada) {
    alerts.push({
      level: "ERROR", field: "seleccion",
      message: "El Kv requerido excede los tamaños estándar de catálogo. Consultar directamente con el fabricante.",
    });
  }

  return {
    Kv_max_req,
    Kv_min_req,
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
    pct_capacidad_max,
    pct_capacidad_min,
    selectionTable,
    alerts,
    dataStatus: "calculated",
  };
}
