/* ════════════════════════════════════════
   HidroCalc — Constants & Catalogs
   ════════════════════════════════════════ */

// ── Standard Nominal Diameters (mm) ──
export const STANDARD_DNS = [50, 63, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800];

// ── Materials with Hazen-Williams C ──
export const MATERIALS = [
  { name: "PVC / HDPE", c: 150 },
  { name: "Hierro dúctil nuevo", c: 140 },
  { name: "Hierro dúctil (10+ años)", c: 130 },
  { name: "Hierro galvanizado / Acero nuevo", c: 120 },
  { name: "Concreto centrifugado", c: 130 },
  { name: "Asbesto cemento", c: 140 },
  { name: "Fibrocemento", c: 140 },
  { name: "Polietileno corrugado", c: 100 },
  { name: "Personalizado", c: 130 },
];

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

// ── Water Hammer: Wall thickness reference (mm) ──
export const WALL_THICKNESS_REF = [
  { material: "Hierro dúctil", dn: 100, clase: "K9", e: 6.0 },
  { material: "Hierro dúctil", dn: 150, clase: "K9", e: 6.0 },
  { material: "Hierro dúctil", dn: 200, clase: "K9", e: 6.3 },
  { material: "Hierro dúctil", dn: 250, clase: "K9", e: 6.8 },
  { material: "Hierro dúctil", dn: 300, clase: "K9", e: 7.2 },
  { material: "Hierro dúctil", dn: 350, clase: "K9", e: 7.7 },
  { material: "Hierro dúctil", dn: 400, clase: "K9", e: 8.1 },
  { material: "Hierro dúctil", dn: 500, clase: "K9", e: 9.0 },
  { material: "Hierro dúctil", dn: 600, clase: "K9", e: 9.9 },
];

// ── Pipe class recommendation by max pressure ──
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

// ── Gradient limits (m/km) ──
export const GRADIENT_LIMITS = {
  low: 1,
  high: 10,
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
