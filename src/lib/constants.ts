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

// ── PIPE CATALOG — for simple mode in Golpe de Ariete ──
// Each entry: { od, e, dInt } all in mm
export interface PipeCatalogEntry {
  label: string;    // display: "4in", "6in", "DN 100", etc.
  od: number;       // mm
  classes: { name: string; e: number }[];  // available classes with wall thickness
}

export interface PipeCatalogGroup {
  material: string;
  E: number;        // Pa
  label: string;    // display name
  sizes: PipeCatalogEntry[];
}

export const PIPE_CATALOG: PipeCatalogGroup[] = [
  {
    material: "PVC", E: 3e9, label: "PVC — AWWA C900 (4in-12in)",
    sizes: [
      { label: '4"', od: 118.1, classes: [{ name: "DR 25", e: 4.7 }, { name: "DR 18", e: 6.6 }, { name: "DR 14", e: 8.4 }] },
      { label: '6"', od: 168.3, classes: [{ name: "DR 25", e: 6.7 }, { name: "DR 18", e: 9.4 }, { name: "DR 14", e: 12.0 }] },
      { label: '8"', od: 219.1, classes: [{ name: "DR 25", e: 8.8 }, { name: "DR 18", e: 12.2 }, { name: "DR 14", e: 15.7 }] },
      { label: '10"', od: 273.0, classes: [{ name: "DR 25", e: 10.9 }, { name: "DR 18", e: 15.2 }, { name: "DR 14", e: 19.5 }] },
      { label: '12"', od: 323.9, classes: [{ name: "DR 25", e: 13.0 }, { name: "DR 18", e: 18.0 }, { name: "DR 14", e: 23.1 }] },
    ],
  },
  {
    material: "PVC", E: 3e9, label: "PVC — AWWA C905 (14in-24in)",
    sizes: [
      { label: '14"', od: 368.3, classes: [{ name: "DR 51", e: 7.2 }, { name: "DR 41", e: 9.0 }, { name: "DR 32.5", e: 11.3 }, { name: "DR 26", e: 14.2 }] },
      { label: '16"', od: 422.4, classes: [{ name: "DR 51", e: 8.3 }, { name: "DR 41", e: 10.3 }, { name: "DR 32.5", e: 13.0 }, { name: "DR 26", e: 16.2 }] },
      { label: '18"', od: 473.1, classes: [{ name: "DR 51", e: 9.3 }, { name: "DR 41", e: 11.5 }, { name: "DR 32.5", e: 14.6 }, { name: "DR 26", e: 18.2 }] },
      { label: '20"', od: 527.8, classes: [{ name: "DR 51", e: 10.3 }, { name: "DR 41", e: 12.9 }, { name: "DR 32.5", e: 16.2 }, { name: "DR 26", e: 20.3 }] },
      { label: '24"', od: 635.0, classes: [{ name: "DR 51", e: 12.5 }, { name: "DR 41", e: 15.5 }, { name: "DR 32.5", e: 19.5 }, { name: "DR 26", e: 24.4 }] },
    ],
  },
  {
    material: "PVC", E: 3e9, label: "PVC — Metrico ISO 4422",
    sizes: [
      { label: '2" (OD 63mm)', od: 63, classes: [{ name: "SDR 41", e: 1.5 }, { name: "SDR 26", e: 2.5 }, { name: "SDR 17", e: 3.8 }, { name: "SDR 13.6", e: 4.7 }, { name: "SDR 11", e: 5.7 }] },
      { label: '2.5" (OD 75mm)', od: 75, classes: [{ name: "SDR 41", e: 1.8 }, { name: "SDR 26", e: 3.0 }, { name: "SDR 17", e: 4.5 }, { name: "SDR 13.6", e: 5.6 }, { name: "SDR 11", e: 6.8 }] },
      { label: '3" (OD 90mm)', od: 90, classes: [{ name: "SDR 41", e: 2.2 }, { name: "SDR 26", e: 3.5 }, { name: "SDR 17", e: 5.4 }, { name: "SDR 13.6", e: 6.7 }, { name: "SDR 11", e: 8.2 }] },
      { label: '4" (OD 110mm)', od: 110, classes: [{ name: "SDR 41", e: 2.7 }, { name: "SDR 26", e: 4.3 }, { name: "SDR 17", e: 6.6 }, { name: "SDR 13.6", e: 8.1 }, { name: "SDR 11", e: 10.0 }] },
      { label: '6" (OD 160mm)', od: 160, classes: [{ name: "SDR 41", e: 3.9 }, { name: "SDR 26", e: 6.2 }, { name: "SDR 17", e: 9.5 }, { name: "SDR 13.6", e: 11.8 }, { name: "SDR 11", e: 14.5 }] },
      { label: '8" (OD 200mm)', od: 200, classes: [{ name: "SDR 41", e: 4.9 }, { name: "SDR 26", e: 7.7 }, { name: "SDR 17", e: 11.9 }, { name: "SDR 13.6", e: 14.8 }, { name: "SDR 11", e: 18.2 }] },
      { label: '10" (OD 250mm)', od: 250, classes: [{ name: "SDR 41", e: 6.1 }, { name: "SDR 26", e: 9.7 }, { name: "SDR 17", e: 14.8 }, { name: "SDR 13.6", e: 18.5 }, { name: "SDR 11", e: 22.7 }] },
      { label: '12" (OD 315mm)', od: 315, classes: [{ name: "SDR 41", e: 7.7 }, { name: "SDR 26", e: 12.2 }, { name: "SDR 17", e: 18.7 }, { name: "SDR 13.6", e: 23.2 }, { name: "SDR 11", e: 28.6 }] },
      { label: '16" (OD 400mm)', od: 400, classes: [{ name: "SDR 41", e: 9.8 }, { name: "SDR 26", e: 15.4 }, { name: "SDR 17", e: 23.5 }, { name: "SDR 13.6", e: 29.4 }, { name: "SDR 11", e: 36.4 }] },
      { label: '20" (OD 500mm)', od: 500, classes: [{ name: "SDR 41", e: 12.2 }, { name: "SDR 26", e: 19.2 }, { name: "SDR 17", e: 29.4 }, { name: "SDR 13.6", e: 36.8 }, { name: "SDR 11", e: 45.5 }] },
      { label: '24" (OD 630mm)', od: 630, classes: [{ name: "SDR 41", e: 15.4 }, { name: "SDR 26", e: 24.2 }, { name: "SDR 17", e: 37.1 }, { name: "SDR 13.6", e: 46.3 }, { name: "SDR 11", e: 57.3 }] },
    ],
  },
  {
    material: "PVC", E: 3e9, label: "PVC — Ingles ASTM D2241",
    sizes: [
      { label: '2"', od: 60.3, classes: [{ name: "SDR 41", e: 1.5 }, { name: "SDR 26", e: 2.3 }, { name: "SDR 17", e: 3.6 }, { name: "SDR 13.6", e: 4.4 }, { name: "SDR 11", e: 5.5 }] },
      { label: '3"', od: 88.9, classes: [{ name: "SDR 41", e: 2.2 }, { name: "SDR 26", e: 3.4 }, { name: "SDR 17", e: 5.2 }, { name: "SDR 13.6", e: 6.5 }, { name: "SDR 11", e: 8.1 }] },
      { label: '4"', od: 114.3, classes: [{ name: "SDR 41", e: 2.8 }, { name: "SDR 26", e: 4.4 }, { name: "SDR 17", e: 6.7 }, { name: "SDR 13.6", e: 8.4 }, { name: "SDR 11", e: 10.4 }] },
      { label: '6"', od: 168.3, classes: [{ name: "SDR 41", e: 4.1 }, { name: "SDR 26", e: 6.5 }, { name: "SDR 17", e: 9.9 }, { name: "SDR 13.6", e: 12.4 }, { name: "SDR 11", e: 15.3 }] },
      { label: '8"', od: 219.1, classes: [{ name: "SDR 41", e: 5.3 }, { name: "SDR 26", e: 8.4 }, { name: "SDR 17", e: 12.9 }, { name: "SDR 13.6", e: 16.1 }, { name: "SDR 11", e: 19.9 }] },
      { label: '10"', od: 273.0, classes: [{ name: "SDR 41", e: 6.7 }, { name: "SDR 26", e: 10.5 }, { name: "SDR 17", e: 16.1 }, { name: "SDR 13.6", e: 20.1 }, { name: "SDR 11", e: 24.8 }] },
      { label: '12"', od: 323.9, classes: [{ name: "SDR 41", e: 7.9 }, { name: "SDR 26", e: 12.5 }, { name: "SDR 17", e: 19.1 }, { name: "SDR 13.6", e: 23.8 }, { name: "SDR 11", e: 29.4 }] },
      { label: '14"', od: 355.6, classes: [{ name: "SDR 41", e: 8.7 }, { name: "SDR 26", e: 13.7 }, { name: "SDR 17", e: 20.9 }, { name: "SDR 13.6", e: 26.1 }, { name: "SDR 11", e: 32.3 }] },
      { label: '16"', od: 406.4, classes: [{ name: "SDR 41", e: 9.9 }, { name: "SDR 26", e: 15.6 }, { name: "SDR 17", e: 23.9 }, { name: "SDR 13.6", e: 29.9 }, { name: "SDR 11", e: 36.9 }] },
      { label: '18"', od: 457.2, classes: [{ name: "SDR 41", e: 11.1 }, { name: "SDR 26", e: 17.6 }, { name: "SDR 17", e: 26.9 }, { name: "SDR 13.6", e: 33.6 }, { name: "SDR 11", e: 41.6 }] },
      { label: '20"', od: 508.0, classes: [{ name: "SDR 41", e: 12.4 }, { name: "SDR 26", e: 19.5 }, { name: "SDR 17", e: 29.9 }, { name: "SDR 13.6", e: 37.4 }, { name: "SDR 11", e: 46.2 }] },
      { label: '24"', od: 609.6, classes: [{ name: "SDR 41", e: 14.9 }, { name: "SDR 26", e: 23.4 }, { name: "SDR 17", e: 35.9 }, { name: "SDR 13.6", e: 44.8 }, { name: "SDR 11", e: 55.4 }] },
    ],
  },
  {
    material: "HDPE", E: 1e9, label: "HDPE — IPS/DIPS (AWWA C906)",
    sizes: [
      { label: '2"', od: 60.3, classes: [{ name: "SDR 26", e: 2.3 }, { name: "SDR 17", e: 3.5 }, { name: "SDR 13.6", e: 4.4 }, { name: "SDR 11", e: 5.5 }, { name: "SDR 9", e: 6.7 }] },
      { label: '3"', od: 88.9, classes: [{ name: "SDR 26", e: 3.4 }, { name: "SDR 17", e: 5.2 }, { name: "SDR 13.6", e: 6.5 }, { name: "SDR 11", e: 8.1 }, { name: "SDR 9", e: 9.9 }] },
      { label: '4"', od: 114.3, classes: [{ name: "SDR 26", e: 4.4 }, { name: "SDR 17", e: 6.7 }, { name: "SDR 13.6", e: 8.4 }, { name: "SDR 11", e: 10.4 }, { name: "SDR 9", e: 12.7 }] },
      { label: '6"', od: 168.3, classes: [{ name: "SDR 26", e: 6.5 }, { name: "SDR 17", e: 9.9 }, { name: "SDR 13.6", e: 12.4 }, { name: "SDR 11", e: 15.3 }, { name: "SDR 9", e: 18.7 }] },
      { label: '8"', od: 219.1, classes: [{ name: "SDR 26", e: 8.4 }, { name: "SDR 17", e: 12.9 }, { name: "SDR 13.6", e: 16.1 }, { name: "SDR 11", e: 19.9 }, { name: "SDR 9", e: 24.3 }] },
      { label: '10"', od: 273.0, classes: [{ name: "SDR 26", e: 10.5 }, { name: "SDR 17", e: 16.1 }, { name: "SDR 13.6", e: 20.1 }, { name: "SDR 11", e: 24.8 }, { name: "SDR 9", e: 30.3 }] },
      { label: '12"', od: 323.9, classes: [{ name: "SDR 26", e: 12.5 }, { name: "SDR 17", e: 19.1 }, { name: "SDR 13.6", e: 23.8 }, { name: "SDR 11", e: 29.4 }, { name: "SDR 9", e: 36.0 }] },
      { label: '14"', od: 355.6, classes: [{ name: "SDR 26", e: 13.7 }, { name: "SDR 17", e: 20.9 }, { name: "SDR 13.6", e: 26.1 }, { name: "SDR 11", e: 32.3 }, { name: "SDR 9", e: 39.5 }] },
      { label: '16"', od: 406.4, classes: [{ name: "SDR 26", e: 15.6 }, { name: "SDR 17", e: 23.9 }, { name: "SDR 13.6", e: 29.9 }, { name: "SDR 11", e: 36.9 }, { name: "SDR 9", e: 45.2 }] },
      { label: '18"', od: 457.2, classes: [{ name: "SDR 26", e: 17.6 }, { name: "SDR 17", e: 26.9 }, { name: "SDR 13.6", e: 33.6 }, { name: "SDR 11", e: 41.6 }, { name: "SDR 9", e: 50.8 }] },
      { label: '20"', od: 508.0, classes: [{ name: "SDR 26", e: 19.5 }, { name: "SDR 17", e: 29.9 }, { name: "SDR 13.6", e: 37.4 }, { name: "SDR 11", e: 46.2 }, { name: "SDR 9", e: 56.4 }] },
      { label: '24"', od: 609.6, classes: [{ name: "SDR 26", e: 23.4 }, { name: "SDR 17", e: 35.9 }, { name: "SDR 13.6", e: 44.8 }, { name: "SDR 11", e: 55.4 }, { name: "SDR 9", e: 67.7 }] },
    ],
  },
  {
    material: "Hierro dúctil", E: 169e9, label: "Hierro ductil — ISO 2531",
    sizes: [
      { label: '3" (DN 80)', od: 98, classes: [{ name: "K9", e: 6.0 }] },
      { label: '4" (DN 100)', od: 118, classes: [{ name: "K9", e: 6.0 }] },
      { label: '6" (DN 150)', od: 170, classes: [{ name: "K9", e: 6.0 }] },
      { label: '8" (DN 200)', od: 222, classes: [{ name: "K9", e: 6.3 }] },
      { label: '10" (DN 250)', od: 274, classes: [{ name: "K9", e: 6.8 }] },
      { label: '12" (DN 300)', od: 326, classes: [{ name: "K9", e: 7.2 }] },
      { label: '14" (DN 350)', od: 378, classes: [{ name: "K9", e: 7.7 }] },
      { label: '16" (DN 400)', od: 429, classes: [{ name: "K9", e: 8.1 }] },
      { label: '18" (DN 450)', od: 480, classes: [{ name: "K9", e: 8.6 }] },
      { label: '20" (DN 500)', od: 532, classes: [{ name: "K9", e: 9.0 }] },
      { label: '24" (DN 600)', od: 635, classes: [{ name: "K9", e: 9.9 }] },
    ],
  },
  {
    material: "Acero", E: 210e9, label: "Acero — AWWA C200",
    sizes: [
      { label: '2"', od: 60.3, classes: [{ name: "Sch 10", e: 2.1 }, { name: "Sch 20", e: 2.8 }, { name: "Sch 40", e: 3.9 }, { name: "Sch 80", e: 5.5 }] },
      { label: '3"', od: 88.9, classes: [{ name: "Sch 10", e: 2.1 }, { name: "Sch 20", e: 3.0 }, { name: "Sch 40", e: 5.5 }, { name: "Sch 80", e: 7.6 }] },
      { label: '4"', od: 114.3, classes: [{ name: "Sch 10", e: 2.1 }, { name: "Sch 20", e: 3.1 }, { name: "Sch 40", e: 6.0 }, { name: "Sch 80", e: 8.6 }] },
      { label: '6"', od: 168.3, classes: [{ name: "Sch 10", e: 2.8 }, { name: "Sch 20", e: 4.0 }, { name: "Sch 40", e: 7.1 }, { name: "Sch 80", e: 11.0 }] },
      { label: '8"', od: 219.1, classes: [{ name: "Sch 10", e: 2.8 }, { name: "Sch 20", e: 5.2 }, { name: "Sch 40", e: 8.2 }, { name: "Sch 80", e: 12.7 }] },
      { label: '10"', od: 273.0, classes: [{ name: "Sch 10", e: 3.4 }, { name: "Sch 20", e: 5.2 }, { name: "Sch 40", e: 9.3 }, { name: "Sch 80", e: 15.1 }] },
      { label: '12"', od: 323.9, classes: [{ name: "Sch 10", e: 3.6 }, { name: "Sch 20", e: 6.4 }, { name: "Sch 40", e: 10.3 }, { name: "Sch 80", e: 17.5 }] },
      { label: '14"', od: 355.6, classes: [{ name: "Sch 10", e: 3.6 }, { name: "Sch 20", e: 6.4 }, { name: "Sch 40", e: 11.1 }, { name: "Sch 80", e: 19.0 }] },
      { label: '16"', od: 406.4, classes: [{ name: "Sch 10", e: 4.0 }, { name: "Sch 20", e: 6.4 }, { name: "Sch 40", e: 12.7 }, { name: "Sch 80", e: 21.4 }] },
      { label: '18"', od: 457.2, classes: [{ name: "Sch 10", e: 4.0 }, { name: "Sch 20", e: 6.4 }, { name: "Sch 40", e: 14.3 }, { name: "Sch 80", e: 23.8 }] },
      { label: '20"', od: 508.0, classes: [{ name: "Sch 10", e: 4.8 }, { name: "Sch 20", e: 6.4 }, { name: "Sch 40", e: 15.1 }, { name: "Sch 80", e: 26.2 }] },
      { label: '24"', od: 609.6, classes: [{ name: "Sch 10", e: 5.5 }, { name: "Sch 20", e: 6.4 }, { name: "Sch 40", e: 17.5 }, { name: "Sch 80", e: 30.9 }] },
    ],
  },
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
    title: "HDPE IPS/DIPS — AWWA C906 (referencia SDR)",
    note: "e = OD / SDR. D_interno = OD - 2e",
    columns: ["Nom.", "OD (mm)", "SDR 17", "SDR 11", "SDR 9"],
    rows: [
      { label: '2"', values: [60.3, 3.5, 5.5, 6.7] },
      { label: '3"', values: [88.9, 5.2, 8.1, 9.9] },
      { label: '4"', values: [114.3, 6.7, 10.4, 12.7] },
      { label: '6"', values: [168.3, 9.9, 15.3, 18.7] },
      { label: '8"', values: [219.1, 12.9, 19.9, 24.3] },
      { label: '10"', values: [273.0, 16.1, 24.8, 30.3] },
      { label: '12"', values: [323.9, 19.1, 29.4, 36.0] },
      { label: '14"', values: [355.6, 20.9, 32.3, 39.5] },
      { label: '16"', values: [406.4, 23.9, 36.9, 45.2] },
      { label: '18"', values: [457.2, 26.9, 41.6, 50.8] },
      { label: '20"', values: [508.0, 29.9, 46.2, 56.4] },
      { label: '24"', values: [609.6, 35.9, 55.4, 67.7] },
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
export type PVCSystem = "metrico" | "ingles" | "c900" | "c905";

export const PVC_SYSTEM_LABELS: Record<PVCSystem, string> = {
  metrico: "Metrico — ISO 4422 / NMX-E-143",
  ingles: "Ingles — NMX / ASTM D2241",
  c900: "AWWA C900 (4in-12in)",
  c905: "AWWA C905 (14in-24in)",
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
    title: "AWWA C900 — PVC Municipal (4in-12in)",
    note: "DR=OD/e. D_interno=OD-2e. PN a 23 C.",
    columns: ["Nom.", "OD (mm)", "DR 25", "DR 18", "DR 14"],
    rows: [
      { label: '4"', values: [118.1, 4.7, 6.6, 8.4] },
      { label: '6"', values: [168.3, 6.7, 9.4, 12.0] },
      { label: '8"', values: [219.1, 8.8, 12.2, 15.7] },
      { label: '10"', values: [273.0, 10.9, 15.2, 19.5] },
      { label: '12"', values: [323.9, 13.0, 18.0, 23.1] },
    ],
  },
  c905: {
    title: "AWWA C905 — PVC Municipal (14in-24in)",
    note: "DR=OD/e. D_interno=OD-2e. PN a 23 C.",
    columns: ["Nom.", "OD (mm)", "DR 51", "DR 41", "DR 32.5", "DR 26"],
    rows: [
      { label: '14"', values: [368.3, 7.2, 9.0, 11.3, 14.2] },
      { label: '16"', values: [422.4, 8.3, 10.3, 13.0, 16.2] },
      { label: '18"', values: [473.1, 9.3, 11.5, 14.6, 18.2] },
      { label: '20"', values: [527.8, 10.3, 12.9, 16.2, 20.3] },
      { label: '24"', values: [635.0, 12.5, 15.5, 19.5, 24.4] },
    ],
  },
};

/**
 * Get PVC pressure classes based on D_interno to auto-select C900 vs C905.
 * D > 290mm (~12") → C905 classes, otherwise C900.
 */
export function getPVCClasses(pvcSys: PVCSystem, isC905: boolean): { title: string; note?: string; classes: PipeClassRow[] } {
  if (pvcSys === "metrico" || pvcSys === "ingles") {
    return {
      title: pvcSys === "metrico" ? "ISO 4422 / NMX-E-143 — PVC Presion" : "NMX-E-143 / ASTM D2241 — PVC Presion",
      classes: [
        { clase: "SDR 41", pn: 3.4 }, { clase: "SDR 26", pn: 6 },
        { clase: "SDR 17", pn: 10 }, { clase: "SDR 13.6", pn: 12.5 }, { clase: "SDR 11", pn: 16 },
      ],
    };
  }
  // c900 vs c905 — determined by catalog selection, not by diameter
  if (isC905) {
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
  c900: { title: "AWWA C900 — PVC Municipal (4in-12in)", classes: [
    { clase: "DR 25", pn: 6.9 }, { clase: "DR 18", pn: 10.3 }, { clase: "DR 14", pn: 13.8 },
  ]},
  c905: { title: "AWWA C905 — PVC Municipal (14in-24in)", classes: [
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
    title: "HDPE IPS/DIPS — AWWA C906",
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
