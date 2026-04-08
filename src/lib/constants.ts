/* ════════════════════════════════════════
   HidroCalc — Constants & Catalogs
   ════════════════════════════════════════ */

// ── Standard Nominal Diameters (mm) ──
export const STANDARD_DNS = [50, 63, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800];

// ── Materials with Hazen-Williams C ──
export const MATERIALS = [
  { name: "PVC / HDPE", c: 150 },
  { name: "HD nuevo — diseno", c: 130 },
  { name: "HD nuevo — verificacion", c: 140 },
  { name: "HD (10+ anos)", c: 130 },
  { name: "Hierro galvanizado / Acero nuevo", c: 120 },
  { name: "Concreto centrifugado", c: 130 },
  { name: "Asbesto cemento", c: 140 },
  { name: "Fibrocemento", c: 140 },
  { name: "Polietileno corrugado", c: 100 },
  { name: "Personalizado", c: 130 },
];

// Tooltip for C selection
export const C_TOOLTIP = "Para diseño de proyectos nuevos se recomienda C=130 (criterio conservador CONAGUA). C=140 es apropiado para verificación de líneas existentes.";

// ── Fittings Catalog (K values) ──
export const FITTINGS_CATALOG = [
  { type: "Codo 90° radio corto", k: 0.90 },
  { type: "Codo 90° radio largo", k: 0.40 },
  { type: "Codo 45°", k: 0.40 },
  { type: "Codo 22.5°", k: 0.20 },
  { type: "Codo 90° con radio = D", k: 0.75 },
  { type: "Tee paso directo", k: 0.20 },
  { type: "Tee derivación", k: 1.00 },
  { type: "Válvula compuerta abierta", k: 0.20 },
  { type: "Válvula mariposa abierta", k: 0.30 },
  { type: "Válvula globo abierta", k: 10.00 },
  { type: "Válvula check (retención)", k: 2.50 },
  { type: "Válvula reductora de presión", k: 4.00 },
  { type: "Válvula de aire triple función", k: 1.50 },
  { type: "Reducción gradual (cono)", k: 0.10 },
  { type: "Reducción brusca", k: 0.50 },
  { type: "Ampliación gradual", k: 0.20 },
  { type: "Entrada borda afilada", k: 0.50 },
  { type: "Salida descarga libre", k: 1.00 },
  { type: "Medidor Woltmann", k: 2.00 },
  { type: "Personalizado", k: 0 },
];

// ── Water Hammer: Pipe materials with E (Pa) ──
export const PIPE_ELASTICITY = [
  { name: "Hierro dúctil", E: 169e9 },
  { name: "PVC", E: 3e9 },
  { name: "HDPE", E: 1e9 },
  { name: "Acero", E: 210e9 },
  { name: "Asbesto cemento", E: 20e9 },
  { name: "Concreto", E: 30e9 },
  { name: "Personalizado", E: 0 },
];

// ── Wall thickness reference type ──
export interface ThicknessRef {
  title: string;
  note?: string;
  columns: string[];
  rows: { label: string; values: number[] }[];
}

// ── Wall thickness references by material ──
export const THICKNESS_BY_MATERIAL: Record<string, ThicknessRef | null> = {
  "Hierro dúctil": {
    title: "ISO 2531 — Hierro ductil K9 (referencia)",
    columns: ["DN", "K9 (mm)"],
    rows: [
      { label: "100", values: [6.0] }, { label: "150", values: [6.0] }, { label: "200", values: [6.3] },
      { label: "250", values: [6.8] }, { label: "300", values: [7.2] }, { label: "350", values: [7.7] },
      { label: "400", values: [8.1] }, { label: "500", values: [9.0] }, { label: "600", values: [9.9] },
      { label: "700", values: [10.8] }, { label: "800", values: [11.7] },
    ],
  },
  PVC: null, // handled by PVC_SUBSYSTEMS
  HDPE: {
    title: "ISO 4427 — HDPE PE100 (referencia SDR)",
    note: "e = OD / SDR. D_interno = OD - 2e",
    columns: ["OD (mm)", "DN aprox", "SDR 17 (PN10)", "SDR 11 (PN16)"],
    rows: [
      { label: "110", values: [100, 6.6, 9.5] },
      { label: "160", values: [150, 9.5, 14.6] },
      { label: "200", values: [200, 11.9, 18.2] },
      { label: "250", values: [250, 14.8, 22.7] },
      { label: "315", values: [300, 18.7, 28.6] },
      { label: "400", values: [400, 23.7, 36.4] },
      { label: "500", values: [500, 29.4, 45.5] },
      { label: "630", values: [600, 37.1, 57.3] },
    ],
  },
  Acero: {
    title: "AWWA C200 — Acero (referencia Schedule)",
    note: "Verificar con fabricante y especificacion del proyecto",
    columns: ["Nom.", "OD (mm)", "Sch 20", "Sch 40"],
    rows: [
      { label: '4"', values: [114.3, 3.1, 6.0] },
      { label: '6"', values: [168.3, 4.0, 7.1] },
      { label: '8"', values: [219.1, 5.2, 8.2] },
      { label: '10"', values: [273.0, 5.2, 9.3] },
      { label: '12"', values: [323.9, 6.4, 10.3] },
      { label: '16"', values: [406.4, 6.4, 12.7] },
      { label: '20"', values: [508.0, 6.4, 15.1] },
      { label: '24"', values: [609.6, 6.4, 17.5] },
    ],
  },
  "Asbesto cemento": null,
  Concreto: null,
  Personalizado: null,
};

// ── PVC Sub-systems ──
export type PVCSystem = "metrico" | "ingles" | "c900";

export const PVC_SYSTEM_LABELS: Record<PVCSystem, string> = {
  metrico: "Metrico — ISO 4422 / NMX-E-143",
  ingles: "Ingles — NMX / ASTM D2241",
  c900: "AWWA C900 (4in-12in) / C905 (14in-24in)",
};

export const PVC_THICKNESS: Record<PVCSystem, ThicknessRef> = {
  metrico: {
    title: "ISO 4422 / NMX-E-143 — PVC Metrico",
    note: "e = OD / SDR. D_interno = OD - 2e. Ref: ISO 4422",
    columns: ["OD (mm)", "DN aprox", "SDR 26 (PN6)", "SDR 17 (PN10)", "SDR 13.6 (PN16)"],
    rows: [
      { label: "63", values: [50, 2.5, 3.8, 4.7] },
      { label: "110", values: [100, 4.3, 6.6, 8.1] },
      { label: "160", values: [150, 6.2, 9.5, 11.8] },
      { label: "200", values: [200, 7.7, 11.9, 14.8] },
      { label: "250", values: [250, 9.7, 14.8, 18.5] },
      { label: "315", values: [300, 12.2, 18.7, 23.2] },
      { label: "400", values: [400, 15.4, 23.5, 29.4] },
      { label: "500", values: [500, 19.2, 29.4, 36.8] },
      { label: "630", values: [600, 24.2, 37.1, 46.3] },
    ],
  },
  ingles: {
    title: "NMX-E-143 Ingles / ASTM D2241 — PVC Hidraulico",
    note: "D_interno = OD - 2e. Ref: ASTM D2241 / NMX-E-143",
    columns: ["Nom.", "OD (mm)", "SDR 41 (100psi)", "SDR 26 (160psi)", "SDR 17 (250psi)"],
    rows: [
      { label: '2"', values: [60.3, 1.5, 2.3, 3.6] },
      { label: '3"', values: [88.9, 2.2, 3.4, 5.2] },
      { label: '4"', values: [114.3, 2.8, 4.4, 6.7] },
      { label: '6"', values: [168.3, 4.1, 6.5, 9.9] },
      { label: '8"', values: [219.1, 5.3, 8.4, 12.9] },
      { label: '10"', values: [273.0, 6.7, 10.5, 16.1] },
      { label: '12"', values: [323.9, 7.9, 12.5, 19.1] },
      { label: '14"', values: [355.6, 8.7, 13.7, 20.9] },
      { label: '16"', values: [406.4, 9.9, 15.6, 23.9] },
      { label: '18"', values: [457.2, 11.1, 17.6, 26.9] },
      { label: '20"', values: [508.0, 12.4, 19.5, 29.9] },
      { label: '24"', values: [609.6, 14.9, 23.4, 35.9] },
    ],
  },
  c900: {
    title: "AWWA C900 (4in-12in) / C905 (14in-24in)",
    note: "C900: 4in-12in. C905: 14in-48in. DR=OD/e. D_interno=OD-2e. PN a 23 C.",
    columns: ["Nom.", "OD (mm)", "Clase 1", "Clase 2", "Clase 3"],
    rows: [
      // C900 section
      { label: '4"', values: [118.1, 4.7, 6.6, 8.4] },
      { label: '6"', values: [168.3, 6.7, 9.4, 12.0] },
      { label: '8"', values: [219.1, 8.8, 12.2, 15.7] },
      { label: '10"', values: [273.0, 10.9, 15.2, 19.5] },
      { label: '12"', values: [323.9, 13.0, 18.0, 23.1] },
      // C905 section
      { label: '14"', values: [368.3, 7.2, 9.0, 14.2] },
      { label: '16"', values: [422.4, 8.3, 10.3, 16.2] },
      { label: '18"', values: [473.1, 9.3, 11.5, 18.2] },
      { label: '20"', values: [527.8, 10.3, 12.9, 20.3] },
      { label: '24"', values: [635.0, 12.5, 15.5, 24.4] },
    ],
  },
};

/**
 * Get PVC pressure classes based on D_interno to auto-select C900 vs C905.
 * D > 290mm (~12") → C905 classes, otherwise C900.
 */
export function getPVCClasses(pvcSys: PVCSystem, D_mm: number | null): { title: string; note?: string; classes: PipeClassRow[] } {
  if (pvcSys === "metrico" || pvcSys === "ingles") {
    return {
      title: pvcSys === "metrico" ? "ISO 4422 / NMX-E-143 — PVC Presion" : "NMX-E-143 / ASTM D2241 — PVC Presion",
      classes: [
        { clase: "SDR 41", pn: 3.4 }, { clase: "SDR 26", pn: 6 },
        { clase: "SDR 17", pn: 10 }, { clase: "SDR 13.6", pn: 12.5 }, { clase: "SDR 11", pn: 16 },
      ],
    };
  }
  // c900/c905
  if (D_mm != null && D_mm > 290) {
    return {
      title: "AWWA C905 — PVC Municipal (14in-24in)",
      note: "Aplica para diametros 14in a 24in. PN a 23 C.",
      classes: [
        { clase: "DR 51", pn: 4.8 }, { clase: "DR 41", pn: 6.0 },
        { clase: "DR 32.5", pn: 7.6 }, { clase: "DR 26", pn: 9.5 },
      ],
    };
  }
  return {
    title: "AWWA C900 — PVC Municipal (4in-12in)",
    note: "Aplica para diametros 4in a 12in. PN a 23 C.",
    classes: [
      { clase: "DR 25", pn: 6.9 }, { clase: "DR 18", pn: 10.3 }, { clase: "DR 14", pn: 13.8 },
    ],
  };
}

// Legacy — kept for non-PVC
export const PVC_CLASSES: Record<PVCSystem, { title: string; note?: string; classes: PipeClassRow[] }> = {
  metrico: { title: "ISO 4422 / NMX-E-143 — PVC Presion", classes: [
    { clase: "SDR 41", pn: 3.4 }, { clase: "SDR 26", pn: 6 }, { clase: "SDR 17", pn: 10 },
    { clase: "SDR 13.6", pn: 12.5 }, { clase: "SDR 11", pn: 16 },
  ]},
  ingles: { title: "NMX-E-143 / ASTM D2241 — PVC Presion", classes: [
    { clase: "SDR 41", pn: 3.4 }, { clase: "SDR 26", pn: 6 }, { clase: "SDR 17", pn: 10 },
    { clase: "SDR 13.6", pn: 12.5 }, { clase: "SDR 11", pn: 16 },
  ]},
  c900: { title: "AWWA C900/C905 — PVC Municipal", classes: [
    { clase: "DR 25", pn: 6.9 }, { clase: "DR 18", pn: 10.3 }, { clase: "DR 14", pn: 13.8 },
    { clase: "DR 51", pn: 4.8 }, { clase: "DR 41", pn: 6.0 }, { clase: "DR 32.5", pn: 7.6 }, { clase: "DR 26", pn: 9.5 },
  ]},
};

// ── Pipe class tables by material ──
export interface PipeClassRow { clase: string; pn: number }

export const PIPE_CLASSES_BY_MATERIAL: Record<string, {
  title: string;
  note?: string;
  classes: PipeClassRow[];
} | null> = {
  "Hierro dúctil": {
    title: "ISO 2531 — Hierro ductil",
    classes: [
      { clase: "K7", pn: 10 }, { clase: "K9", pn: 16 },
      { clase: "K12", pn: 25 }, { clase: "K14", pn: 25 }, { clase: "K16", pn: 40 },
    ],
  },
  PVC: null, // handled by PVC_CLASSES subsystem
  HDPE: {
    title: "ISO 4427 — HDPE PE100",
    classes: [
      { clase: "SDR 26", pn: 6.3 }, { clase: "SDR 17", pn: 10 },
      { clase: "SDR 13.6", pn: 12.5 }, { clase: "SDR 11", pn: 16 },
      { clase: "SDR 9", pn: 20 }, { clase: "SDR 7.4", pn: 25 },
    ],
  },
  Acero: {
    title: "AWWA C200 — Acero",
    note: "PN varia por DN y grado de acero. Verificar con fabricante.",
    classes: [
      { clase: "Sch 10", pn: 17 }, { clase: "Sch 20", pn: 21 },
      { clase: "Sch 40", pn: 38 }, { clase: "Sch 80", pn: 69 },
    ],
  },
  "Asbesto cemento": null,
  Concreto: null,
  Personalizado: null,
};

// Legacy compatibility
export const PIPE_CLASS_BY_PRESSURE = [
  { maxBar: 25, clase: "K9" },
  { maxBar: 40, clase: "K10" },
  { maxBar: 64, clase: "K12" },
];

// ── Physical constants ──
export const G = 9.81;                    // m/s²
export const RHO = 1000;                  // kg/m³ (water density)
export const K_AGUA = 2.1e9;              // Pa (bulk modulus of water)
export const NU_20C = 1.004e-6;           // m²/s (kinematic viscosity at 20°C)

// ── Default values ──
export const DEFAULTS = {
  z1: 0,
  z2: 0,
  C: 130,
  temperature: 20,
  hmPercent: 0.10,  // 10% of hf
  P2min: 1.0,       // kg/cm² para display (el motor convierte a m.c.a. internamente)
  maxVelocity: 2.5, // m/s
};

// ── Velocity limits ──
export const VELOCITY_LIMITS = {
  sedimentationRisk: 0.3,
  lowerLimit: 0.5,
  upperLimit: 2.5,
  highWarning: 3.5,
};

// ── Pressure limits (m.c.a. internally — display converts to kg/cm²) ──
export const PRESSURE_LIMITS = {
  negative: 0,
  minCONAGUA: 10,     // 10 m.c.a. = 1.0 kg/cm²
  maxNormal: 60,      // 60 m.c.a. = 6.0 kg/cm²
  excessive: 100,     // 100 m.c.a. = 10.0 kg/cm²
};

// ── Gradient limits (m/km) — NOM-001-CONAGUA ──
export const GRADIENT_LIMITS = {
  low: 1,          // < 1 m/km — possibly oversized
  optimalMax: 5,   // ≤ 5 m/km — optimal range
  acceptableMax: 10, // ≤ 10 m/km — acceptable with justification
  high: 10,        // > 10 m/km — requires review
};

// ── Flow unit conversions to m³/s ──
export function convertFlowToM3s(value: number, unit: string): number {
  switch (unit) {
    case "L/s": return value / 1000;
    case "m³/h": return value / 3600;
    case "m³/s": return value;
    default: return value / 1000;
  }
}

export function convertM3sToUnit(value: number, unit: string): number {
  switch (unit) {
    case "L/s": return value * 1000;
    case "m³/h": return value * 3600;
    case "m³/s": return value;
    default: return value * 1000;
  }
}
