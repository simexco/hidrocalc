/* ════════════════════════════════════════
   Demanda de Agua — Caudal de diseño
   CONAGUA MAPAS / NOM-001-CONAGUA
   ════════════════════════════════════════ */

// ── Tipos de desarrollo con dotación sugerida (L/hab/día) ──
export const DEVELOPMENT_TYPES = [
  { key: 'residencial-alto', label: 'Residencial alto', dotacion: 400, habViv: 3.5, densidad: 30 },
  { key: 'residencial-medio', label: 'Residencial medio', dotacion: 250, habViv: 3.8, densidad: 50 },
  { key: 'interes-social', label: 'Interes social', dotacion: 185, habViv: 4.0, densidad: 80 },
  { key: 'popular', label: 'Popular', dotacion: 150, habViv: 4.2, densidad: 100 },
  { key: 'rural', label: 'Rural', dotacion: 100, habViv: 4.5, densidad: 25 },
  { key: 'mixto', label: 'Uso mixto (habitacional + comercial)', dotacion: 220, habViv: 3.8, densidad: 60 },
  { key: 'custom', label: 'Personalizado', dotacion: 200, habViv: 3.8, densidad: 50 },
] as const;

// ── Ajuste por clima ──
export const CLIMATE_TYPES = [
  { key: 'calido-humedo', label: 'Calido humedo (costa, sureste)', factor: 1.20 },
  { key: 'calido-seco', label: 'Calido seco (noroeste, desierto)', factor: 1.30 },
  { key: 'templado', label: 'Templado (centro, bajio)', factor: 1.00 },
  { key: 'frio', label: 'Frio (sierra, altiplano)', factor: 0.85 },
] as const;

export type PopulationMode = 'habitantes' | 'viviendas' | 'superficie';

export interface WaterDemandInputs {
  projectName: string;
  mode: PopulationMode;
  // Mode A — direct population
  poblacionActual: number | null;
  // Mode B — by housing
  numViviendas: number | null;
  habPorVivienda: number;
  // Mode C — by area
  superficieHa: number | null;
  densidadHabHa: number;
  // Growth
  tasaCrecimiento: number;  // % annual
  periodoDiseno: number;    // years
  // Demand
  devType: string;
  climaKey: string;
  dotacionBase: number;     // L/hab/day (from devType, user can override)
  // Variation coefficients
  CVD: number;  // daily variation (default 1.4)
  CVH: number;  // hourly variation (default 1.55)
}

export interface WaterDemandResults {
  poblacionActual: number;
  poblacionDiseno: number;
  dotacionAjustada: number;  // L/hab/day after climate factor
  factorClima: number;
  // Flows
  Qmd_ls: number;    // mean daily flow L/s
  Qmd_m3h: number;
  QMD_ls: number;    // max daily flow L/s
  QMD_m3h: number;
  QMH_ls: number;    // max hourly flow L/s
  QMH_m3h: number;
  // Volume
  volDiario_m3: number;  // daily volume m³
  // Recommendations
  conduccion: string;    // "Para linea de conduccion usar QMD = X L/s"
  distribucion: string;  // "Para red de distribucion usar QMH = X L/s"
  alerts: { level: 'WARN' | 'ERROR'; message: string }[];
}

export function calculateWaterDemand(input: WaterDemandInputs): WaterDemandResults | null {
  const { mode, tasaCrecimiento, periodoDiseno, dotacionBase, climaKey, CVD, CVH } = input;

  // 1. Population
  let pobActual: number;
  if (mode === 'habitantes') {
    if (input.poblacionActual == null || input.poblacionActual <= 0) return null;
    pobActual = input.poblacionActual;
  } else if (mode === 'viviendas') {
    if (input.numViviendas == null || input.numViviendas <= 0) return null;
    pobActual = input.numViviendas * input.habPorVivienda;
  } else {
    if (input.superficieHa == null || input.superficieHa <= 0) return null;
    pobActual = input.superficieHa * input.densidadHabHa;
  }

  // 2. Future population
  const r = tasaCrecimiento / 100;
  const pobDiseno = pobActual * Math.pow(1 + r, periodoDiseno);

  // 3. Climate adjustment
  const clima = CLIMATE_TYPES.find(c => c.key === climaKey);
  const factorClima = clima?.factor ?? 1.0;
  const dotacionAjustada = dotacionBase * factorClima;

  // 4. Flows
  const Qmd_ls = (pobDiseno * dotacionAjustada) / 86400;
  const Qmd_m3h = Qmd_ls * 3.6;
  const QMD_ls = Qmd_ls * CVD;
  const QMD_m3h = QMD_ls * 3.6;
  // QMH se calcula sobre el maximo diario, no sobre el medio (CONAGUA MAPAS)
  const QMH_ls = QMD_ls * CVH;
  const QMH_m3h = QMH_ls * 3.6;
  const volDiario_m3 = (pobDiseno * dotacionAjustada) / 1000;

  // 5. Alerts
  const alerts: WaterDemandResults['alerts'] = [];
  if (dotacionAjustada > 500) alerts.push({ level: 'WARN', message: `Dotacion ajustada muy alta (${dotacionAjustada.toFixed(0)} L/hab/dia) — verificar tipo de desarrollo y clima` });
  if (dotacionAjustada < 75) alerts.push({ level: 'WARN', message: `Dotacion muy baja (${dotacionAjustada.toFixed(0)} L/hab/dia) — verificar que cubre necesidades basicas` });
  if (pobDiseno > pobActual * 5) alerts.push({ level: 'WARN', message: `La poblacion de diseno (${Math.round(pobDiseno)}) es ${(pobDiseno/pobActual).toFixed(1)}x la actual — verificar tasa de crecimiento y periodo` });
  if (tasaCrecimiento > 5) alerts.push({ level: 'WARN', message: `Tasa de crecimiento ${tasaCrecimiento}% es muy alta — el promedio nacional es 1-2%` });
  if (periodoDiseno > 30) alerts.push({ level: 'WARN', message: `Periodo de diseno > 30 años — CONAGUA recomienda 20-25 años para agua potable` });

  return {
    poblacionActual: Math.round(pobActual),
    poblacionDiseno: Math.round(pobDiseno),
    dotacionAjustada,
    factorClima,
    Qmd_ls, Qmd_m3h,
    QMD_ls, QMD_m3h,
    QMH_ls, QMH_m3h,
    volDiario_m3,
    conduccion: `Para linea de conduccion usar QMD = ${QMD_ls.toFixed(2)} L/s (${QMD_m3h.toFixed(1)} m3/h)`,
    distribucion: `Para red de distribucion usar QMH = ${QMH_ls.toFixed(2)} L/s (${QMH_m3h.toFixed(1)} m3/h)`,
    alerts,
  };
}
