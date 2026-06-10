/* ════════════════════════════════════════
   Tanque de Regularización
   Volumen de regulación + reserva
   CONAGUA MAPAS — Datos básicos
   ════════════════════════════════════════ */

// Coeficiente de regulación según horas de aportación al tanque.
// Sale de la máxima diferencia acumulada entre la curva de suministro
// (constante durante las horas de aportación) y la curva de demanda
// horaria típica nacional.
export const REGULATION_COEFFICIENTS = [
  { hours: 24, R: 0.11, label: "24 horas (aportacion continua)" },
  { hours: 20, R: 0.15, label: "20 horas" },
  { hours: 16, R: 0.18, label: "16 horas" },
  { hours: 12, R: 0.25, label: "12 horas" },
  { hours: 10, R: 0.29, label: "10 horas" },
  { hours: 8,  R: 0.32, label: "8 horas" },
];

export type TankShape = "rectangular" | "circular";

export interface TankStorageInputs {
  projectName: string;
  Qmd_ls: number | null;       // gasto medio diario L/s
  horasAportacion: number;     // horas de bombeo/llenado al tanque
  // Reserva
  incluirReserva: boolean;
  horasReserva: number;        // horas de Qmd como reserva (ej. 2-4 h)
  // Geometría
  shape: TankShape;
  altura: number;              // m — tirante de agua útil
  bordoLibre: number;          // m — espacio sobre el agua
}

export interface TankStorageResults {
  volDiario_m3: number;        // consumo diario
  R: number;                   // coef regulación usado
  volRegulacion_m3: number;
  volReserva_m3: number;
  volTotal_m3: number;
  volComercial_m3: number;     // redondeado a tamaño común
  // Dimensions
  shape: TankShape;
  area_m2: number;
  // rectangular
  lado_m: number;              // si cuadrado
  largo_m: number;
  ancho_m: number;
  // circular
  diametro_m: number;
  alturaTotal_m: number;       // tirante + bordo libre
  alerts: { level: "WARN" | "ERROR"; message: string }[];
}

// Common commercial tank sizes (m³)
const COMMERCIAL_SIZES = [5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];

export function calculateTankStorage(input: TankStorageInputs): TankStorageResults | null {
  const { Qmd_ls, horasAportacion, incluirReserva, horasReserva, shape, altura, bordoLibre } = input;

  if (Qmd_ls == null || Qmd_ls <= 0) return null;

  const alerts: TankStorageResults["alerts"] = [];

  // Daily volume (m³)
  const volDiario_m3 = Qmd_ls * 86.4; // L/s × 86400 / 1000

  // Regulation coefficient
  const coef = REGULATION_COEFFICIENTS.find(c => c.hours === horasAportacion) ?? REGULATION_COEFFICIENTS[0];
  const R = coef.R;

  // Regulation volume
  const volRegulacion_m3 = R * volDiario_m3;

  // Reserve volume (optional): hours of Qmd
  const volReserva_m3 = incluirReserva ? (Qmd_ls * horasReserva * 3600) / 1000 : 0;

  // Total
  const volTotal_m3 = volRegulacion_m3 + volReserva_m3;

  // Round up to commercial size
  let volComercial_m3 = COMMERCIAL_SIZES[COMMERCIAL_SIZES.length - 1];
  for (const s of COMMERCIAL_SIZES) {
    if (s >= volTotal_m3) { volComercial_m3 = s; break; }
  }

  // Dimensions (use commercial volume)
  const h = altura > 0 ? altura : 3;
  const area_m2 = volComercial_m3 / h;

  let lado_m = 0, largo_m = 0, ancho_m = 0, diametro_m = 0;
  if (shape === "rectangular") {
    lado_m = Math.sqrt(area_m2); // square
    // suggest a 1.5:1 ratio rectangle as alternative
    ancho_m = Math.sqrt(area_m2 / 1.5);
    largo_m = area_m2 / ancho_m;
  } else {
    diametro_m = Math.sqrt((4 * area_m2) / Math.PI);
  }

  const alturaTotal_m = h + (bordoLibre > 0 ? bordoLibre : 0.3);

  // Alerts
  if (volTotal_m3 > 5000) alerts.push({ level: "WARN", message: `Volumen muy grande (${volTotal_m3.toFixed(0)} m3) — considerar varios tanques o tanque superficial con bombeo` });
  if (h > 6) alerts.push({ level: "WARN", message: `Tirante de ${h}m es alto — los tanques superficiales suelen ser de 3-5 m` });
  if (h < 2) alerts.push({ level: "WARN", message: `Tirante de ${h}m es bajo — verificar, el minimo practico es ~2 m` });

  return {
    volDiario_m3, R, volRegulacion_m3, volReserva_m3, volTotal_m3, volComercial_m3,
    shape, area_m2, lado_m, largo_m, ancho_m, diametro_m, alturaTotal_m,
    alerts,
  };
}
