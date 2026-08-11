/* ════════════════════════════════════════
   Tanque de Regularización
   Volumen de regulación + reserva
   CONAGUA MAPAS — Datos básicos
   ════════════════════════════════════════ */

// Coeficiente de regulación C (CONAGUA MAPAS) en m³ por cada L/s del gasto
// MÁXIMO diario (QMd): Vr = C × QMd. Para aportación 24 h el valor MAPAS es 11.0.
// Los horarios reducidos derivan de la curva de demanda horaria típica nacional
// (máxima diferencia acumulada suministro-demanda) — validar contra la tabla
// MAPAS del horario real de aportación.
export const REGULATION_COEFFICIENTS = [
  { hours: 24, R: 11.0, label: "24 horas (aportacion continua)" },
  { hours: 20, R: 13.0, label: "20 horas" },
  { hours: 16, R: 15.6, label: "16 horas" },
  { hours: 12, R: 21.6, label: "12 horas" },
  { hours: 10, R: 25.1, label: "10 horas" },
  { hours: 8,  R: 27.6, label: "8 horas" },
];

export type TankShape = "rectangular" | "circular";

export interface TankStorageInputs {
  projectName: string;
  Qmd_ls: number | null;       // gasto MAXIMO diario (QMd) L/s — base del volumen de regulacion MAPAS
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

  // Regulation coefficient C (m³ por L/s de QMd)
  const coef = REGULATION_COEFFICIENTS.find(c => c.hours === horasAportacion) ?? REGULATION_COEFFICIENTS[0];
  const R = coef.R;

  // Regulation volume: Vr = C × QMd (CONAGUA MAPAS)
  const volRegulacion_m3 = R * Qmd_ls;

  // Reserve volume (optional): hours of Qmd
  const volReserva_m3 = incluirReserva ? (Qmd_ls * horasReserva * 3600) / 1000 : 0;

  // Total
  const volTotal_m3 = volRegulacion_m3 + volReserva_m3;

  // Round up to commercial size (por encima del catalogo: redondear al siguiente multiplo de 500)
  const volComercial_m3 = COMMERCIAL_SIZES.find((s) => s >= volTotal_m3) ?? Math.ceil(volTotal_m3 / 500) * 500;

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
