/* ════════════════════════════════════════
   HidroCalc — Types & Interfaces
   ════════════════════════════════════════ */

// ── Units ──
export type FlowUnit = "L/s" | "m³/h" | "m³/s";

// ── Calculation Modes ──
export type CalcMode = "A" | "B" | "C";

// ── Alert levels ──
export type AlertLevel = "OK" | "WARN" | "ERROR" | "CRITICAL";

// ── Data status ──
export type DataStatus = "calculated" | "estimated" | "unavailable";

// ── Fitting (accesorio) ──
export interface Fitting {
  id: string;
  type: string;
  k: number;
  quantity: number;
  hmPartial: number;
}

// ── Material ──
export interface Material {
  name: string;
  c: number;
}

// ── DN (Diámetro Nominal) ──
export interface NominalDiameter {
  dn: number;       // mm
  dInterno: number;  // mm (for display; we use dn as approx)
}

// ── Alert ──
export interface Alert {
  level: AlertLevel;
  field: string;
  message: string;
}

// ── Module 1 — Single Pipe Inputs ──
export interface SinglePipeInputs {
  projectName: string;
  mode: CalcMode;
  Q: number | null;         // m³/s (internally converted)
  flowUnit: FlowUnit;
  rawQ: number | null;      // user-entered value in flowUnit
  DN: number | null;        // mm
  customDN: boolean;
  L: number | null;         // m
  materialName: string;
  C: number;
  P1: number | null;        // m.c.a.
  z1: number;               // m.s.n.m.
  z2: number;               // m.s.n.m.
  P2min: number | null;     // m.c.a. (for Mode B/C)
  maxVelocity: number;      // m/s (for Mode C)
  fittings: Fitting[];
}

// ── Module 1 — Single Pipe Results ──
export interface SinglePipeResults {
  A: number | null;          // m²
  V: number | null;          // m/s
  hf: number | null;         // m
  hm: number | null;         // m
  hmEstimated: boolean;
  H1: number | null;         // m
  H2: number | null;         // m
  P2: number | null;         // m.c.a.
  P2_kPa: number | null;
  J: number | null;          // m/m
  J_km: number | null;       // m/km
  Re: number | null;
  alerts: Alert[];
  dataStatus: DataStatus;
  // For Mode B
  Qmax: number | null;       // m³/s
  // For Mode C
  diameterComparison: DiameterComparisonRow[] | null;
  recommendedDN: number | null;
}

// ── Diameter Comparison Row (Mode C / Module 5) ──
export interface DiameterComparisonRow {
  dn: number;
  V: number;
  hf: number;
  hm: number;
  P2: number | null;
  J_km: number;
  meetsVmin: boolean;
  meetsVmax: boolean;
  meetsVelocity: boolean;
  meetsPressure: boolean | null;
  recommended: boolean;
}

// ── Module 2 — Series Pipe Tramo ──
export interface SeriesTramo {
  id: string;
  name: string;
  L: number | null;
  DN: number | null;
  C: number;
  zEnd: number;
  // Minor losses
  lossMode: "accesorios" | "K" | "Le" | "percent";
  kTotal: number;
  leTotal: number;
  hmPercent: number;
  // Accessory list for "accesorios" mode
  fittings: { type: string; k: number; qty: number }[];
  // optional per-tramo Q
  Q: number | null;
}

export interface SeriesTramoResult {
  id: string;
  V: number | null;
  hf: number | null;
  hm: number | null;
  Pentry: number | null;
  Pexit: number | null;
  alerts: Alert[];
}

export interface SeriesPipeInputs {
  projectName: string;
  Q: number | null;          // m³/s global
  flowUnit: FlowUnit;
  rawQ: number | null;
  P1: number | null;
  z1: number;
  variableFlow: boolean;
  tramos: SeriesTramo[];
}

export interface SeriesPipeResults {
  tramoResults: SeriesTramoResult[];
  totalLength: number;
  totalHf: number;
  totalHm: number;
  finalPressure: number | null;
  alerts: Alert[];
  dataStatus: DataStatus;
}

// ── Module 3 — Water Hammer ──
export interface WaterHammerInputs {
  projectName: string;
  V0: number | null;         // m/s
  D: number | null;          // mm (internal diameter)
  e: number | null;          // mm (wall thickness)
  materialName: string;
  E: number | null;          // Pa
  P0: number | null;         // m.c.a. (static pressure)
  Tc: number | null;         // s (valve closure time)
  L: number | null;          // m
}

export interface WaterHammerResults {
  a: number | null;          // m/s (wave speed)
  Tphase: number | null;     // s
  closureType: "brusco" | "lento" | null;
  deltaH: number | null;     // m.c.a.
  deltaP_kPa: number | null;
  deltaP_bar: number | null;
  Pmax: number | null;       // m.c.a.
  Pmin: number | null;       // m.c.a.
  Pmax_bar: number | null;
  pipeClass: string | null;
  safeTc: number | null;     // recommended min closure time
  alerts: Alert[];
  dataStatus: DataStatus;
}

// ── Module 4 — Pump Operation ──
export type PumpInputMethod = "points" | "equation";

export interface PumpPoint {
  Q: number;  // L/s
  H: number;  // m
}

export interface PumpOperationInputs {
  projectName: string;
  Hg: number | null;          // m (static height)
  L: number | null;           // m
  DN: number | null;          // mm
  C: number;
  kTotal: number;
  pumpMethod: PumpInputMethod;
  pumpPoints: PumpPoint[];
  H0: number | null;          // m (for equation)
  Kbomba: number | null;      // for equation
}

export interface PumpRecommendation {
  pumpType: string;
  pumpTypeDesc: string;
  powerKW: number;
  powerHP: number;
  minEfficiency: number;        // %
  NPSHr_estimated: number;     // m
  motorRPM: number;
  observations: string[];
}

export interface PumpOperationResults {
  Qop: number | null;         // L/s
  Hop: number | null;         // m
  systemCurve: { Q: number; H: number }[];
  pumpCurve: { Q: number; H: number }[];
  recommendation: PumpRecommendation | null;
  alerts: Alert[];
  dataStatus: DataStatus;
}

// ── Module 5 — Pipe Sizing ──
export interface PipeSizingInputs {
  projectName: string;
  Q: number | null;           // m³/s
  flowUnit: FlowUnit;
  rawQ: number | null;
  L: number | null;
  C: number;
  materialName: string;
  P1: number | null;
  P2min: number;              // default 10
  z1: number;
  z2: number;
  maxVelocity: number;        // default 2.5
}

export interface PipeSizingResults {
  rows: DiameterComparisonRow[];
  recommendedDN: number | null;
  alerts: Alert[];
  dataStatus: DataStatus;
}

// ── Module 7 — VRP (Pressure Reducing Valve) ──
export interface VRPInputs {
  projectName: string;
  qMax: number | null;        // L/s
  qMin: number | null;        // L/s (optional)
  flowUnit: FlowUnit;
  rawQMax: number | null;     // user-entered value
  rawQMin: number | null;
  P1: number | null;          // kg/cm²
  P2: number | null;          // kg/cm²
  DN: number | null;          // mm (pipe diameter)
}

export interface VRPSelectionRow {
  dn: string;
  dn_mm: number;
  cv_max: number;
  pct_max: number;            // % aperture at Q_max
  pct_min: number;            // % aperture at Q_min
  status: "optimo" | "funcional" | "limite" | "insuficiente";
  isRecommended: boolean;
}

export interface VRPResults {
  Cv_max_req: number;
  Cv_min_req: number;
  deltaP_bar: number;
  Q_max_m3h: number;
  Q_min_m3h: number;
  sigma: number;              // cavitation index
  riesgoCavitacion: boolean;
  relacionPresion: number;    // P1/P2
  dobleEtapa: boolean;        // P1/P2 > 3
  v_aguas_abajo: number;      // m/s
  recommendedDN: string | null;
  recommendedDN_mm: number | null;
  pct_apertura_max: number | null;
  pct_apertura_min: number | null;
  selectionTable: VRPSelectionRow[];
  alerts: Alert[];
  dataStatus: DataStatus;
}

// ── Project ──
export interface Project {
  id: string;
  name: string;
  module: string;
  createdAt: string;
  updatedAt: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  mode?: CalcMode;
  hasAssumedValues: boolean;
}

// ── Assumed value tracking ──
export interface AssumedValue {
  field: string;
  value: number;
  label: string;
}
