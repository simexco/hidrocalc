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

// Horarios con R publicado en el manual (presets de un clic; CDMX requiere R manual
// porque su curva horaria —Figura 1.2— no está tabulada en el manual)
export const REGULATION_COEFFICIENTS = [
  { key: "24", hours: 24, inicio: 0, R: 11.0, label: "24 horas (suministro continuo)" },
  { key: "20", hours: 20, inicio: 4, R: 9.0, label: "20 horas, de las 4 a las 24" },
  { key: "16", hours: 16, inicio: 5, R: 19.0, label: "16 horas, de las 5 a las 21" },
  { key: "cdmx-24", hours: 24, inicio: 0, R: 14.3, label: "CDMX — 24 horas" },
  { key: "cdmx-20", hours: 20, inicio: 4, R: 9.6, label: "CDMX — 20 horas, de las 4 a las 24" },
  { key: "cdmx-16", hours: 16, inicio: 5, R: 17.3, label: "CDMX — 16 horas, de las 5 a las 21" },
];

// Curva de demanda horaria nacional (Figura 1.1 / Tabla 1.2 del manual MAPAS):
// consumo de cada hora como % del gasto máximo diario. Suma exacta = 2400.
export const CURVA_DEMANDA_HORARIA = [
  60.6, 61.6, 63.3, 63.7, 65.1, 82.8, 93.8, 119.9, 130.7, 137.2, 134.3, 132.9,
  128.8, 126.6, 121.6, 120.1, 119.6, 115.1, 112.1, 105.6, 90.1, 78.4, 71.0, 65.1,
];

// Método oficial del manual (Tabla 1.1 + ec. 1.2): suministro constante durante la
// ventana de bombeo, diferencias acumuladas contra la curva de demanda, y
// R = (máx excedente − máx faltante) × 3.6 / 100, en m³ por (L/s) de QMd.
// Reproduce los valores publicados: (24h,0)=11.0 · (20h,4)=9.0 · (16h,5)=19.0 · (20h,0)=12.57.
export function calcularCoefRegulacion(horasBombeo: number, horaInicio: number): { R: number; maxExcedente: number; maxFaltante: number; suministroPct: number } {
  const h = Math.min(24, Math.max(1, Math.round(horasBombeo)));
  const ini = ((Math.round(horaInicio) % 24) + 24) % 24;
  const suministroPct = 2400 / h;
  const bombea = new Array(24).fill(false);
  for (let k = 0; k < h; k++) bombea[(ini + k) % 24] = true;
  let acum = 0, maxExc = 0, maxFal = 0;
  for (let hora = 0; hora < 24; hora++) {
    acum += (bombea[hora] ? suministroPct : 0) - CURVA_DEMANDA_HORARIA[hora];
    if (acum > maxExc) maxExc = acum;
    if (acum < maxFal) maxFal = acum;
  }
  // Redondeo a 1 decimal, como el propio manual ("10.96, aproximadamente 11.0")
  const R = Math.round(((maxExc - maxFal) * 3.6 / 100) * 10) / 10;
  return { R, maxExcedente: Math.round(maxExc * 10) / 10, maxFaltante: Math.round(maxFal * 10) / 10, suministroPct: Math.round(suministroPct * 100) / 100 };
}

export type TankShape = "rectangular" | "circular";

export interface TankStorageInputs {
  projectName: string;
  Qmd_ls: number | null;       // gasto MAXIMO diario (QMd) L/s — base del volumen de regulacion MAPAS
  horasAportacion: number;     // horas de bombeo/llenado al tanque por día
  horaInicio?: number;         // hora del día (0-23) en que arranca el bombeo
  rManual?: number | null;     // R capturado a mano (p. ej. CDMX 14.3) — anula el calculado
  regimen?: string;            // legado: key de REGULATION_COEFFICIENTS en estados guardados viejos
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
  regimenLabel: string;        // horario al que corresponde R
  rEsManual: boolean;          // true si R vino capturado a mano
  maxExcedente: number;        // % acumulado máximo a favor (método Tabla 1.1)
  maxFaltante: number;         // % acumulado máximo en contra
  suministroPct: number;       // % de QMd que entrega el bombeo en cada hora activa
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

  // R: capturado a mano (CDMX u otra curva local) o CALCULADO con el método oficial
  // del manual a partir del horario real de bombeo del pozo
  const horaInicio = input.horaInicio ?? REGULATION_COEFFICIENTS.find(c => c.key === input.regimen)?.inicio ?? 0;
  const calc = calcularCoefRegulacion(horasAportacion, horaInicio);
  const rEsManual = input.rManual != null && input.rManual > 0;
  const R = rEsManual ? input.rManual! : calc.R;
  const horaFin = (horaInicio + Math.min(24, Math.max(1, Math.round(horasAportacion)))) % 24;
  const regimenLabel = horasAportacion >= 24
    ? "24 horas (suministro continuo)"
    : `${horasAportacion} h, de las ${horaInicio} a las ${horaFin === 0 ? 24 : horaFin}`;

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
    volDiario_m3, R, regimenLabel, rEsManual,
    maxExcedente: calc.maxExcedente, maxFaltante: calc.maxFaltante, suministroPct: calc.suministroPct,
    volRegulacion_m3, volReserva_m3, volTotal_m3, volComercial_m3,
    shape, area_m2, lado_m, largo_m, ancho_m, diametro_m, alturaTotal_m,
    alerts,
  };
}
