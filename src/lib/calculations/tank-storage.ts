/* ════════════════════════════════════════
   Tanque de Regularización
   Volumen de regulación + reserva
   CONAGUA MAPAS — Datos básicos
   ════════════════════════════════════════ */

// Coeficiente de regulación R (CONAGUA MAPAS) en m³ por cada L/s del gasto
// MÁXIMO diario: C(tanque) = R × QMd. Valores OFICIALES de las Tablas 1.3
// (curva de demanda nacional) y 1.4 (Ciudad de México) del manual MAPAS
// "Diseño, construcción y operación de tanques de regulación".
// OJO: el HORARIO importa, no solo las horas — el propio manual: bombear
// 20 h de las 0 a las 20 da R = 12.57, pero de las 4 a las 24 da 9.0.
// Para otro horario, R se calcula con la curva de demandas (Tabla 1.1 del manual).
export const MAPAS_TANQUES_URL = "https://www.conagua.gob.mx/CONAGUA07/Publicaciones/Publicaciones/Libros/13DisenoConstruccionyOperacionDeTanquesDeRegulacion.pdf";
export const REGULATION_COEFFICIENTS = [
  { key: "24", hours: 24, R: 11.0, label: "24 horas (suministro continuo)" },
  { key: "20", hours: 20, R: 9.0, label: "20 horas, de las 4 a las 24" },
  { key: "16", hours: 16, R: 19.0, label: "16 horas, de las 5 a las 21" },
  { key: "cdmx-24", hours: 24, R: 14.3, label: "CDMX — 24 horas" },
  { key: "cdmx-20", hours: 20, R: 9.6, label: "CDMX — 20 horas, de las 4 a las 24" },
  { key: "cdmx-16", hours: 16, R: 17.3, label: "CDMX — 16 horas, de las 5 a las 21" },
];

export type TankShape = "rectangular" | "circular";

export interface TankStorageInputs {
  projectName: string;
  Qmd_ls: number | null;       // gasto MAXIMO diario (QMd) L/s — base del volumen de regulacion MAPAS
  horasAportacion: number;     // horas de bombeo/llenado al tanque (compat con estados guardados)
  regimen?: string;            // key de REGULATION_COEFFICIENTS (horario oficial MAPAS)
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
  R: number;                   // coef regulación usado (m³ por L/s de QMd)
  regimenLabel: string;        // horario oficial MAPAS al que corresponde R
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

  // Coeficiente R oficial (Tablas 1.3/1.4 MAPAS); estados viejos con horas sueltas
  // caen al horario oficial de esas horas, o a 24 h si no existe en el manual
  const coef = (input.regimen != null ? REGULATION_COEFFICIENTS.find(c => c.key === input.regimen) : undefined)
    ?? REGULATION_COEFFICIENTS.find(c => c.hours === horasAportacion)
    ?? REGULATION_COEFFICIENTS[0];
  const R = coef.R;

  // Regulation volume: C(tanque) = R × QMd (CONAGUA MAPAS, ec. 1.3)
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
    volDiario_m3, R, regimenLabel: coef.label, volRegulacion_m3, volReserva_m3, volTotal_m3, volComercial_m3,
    shape, area_m2, lado_m, largo_m, ancho_m, diametro_m, alturaTotal_m,
    alerts,
  };
}
