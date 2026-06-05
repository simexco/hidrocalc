/* ════════════════════════════════════════
   Línea de Impulsión — Bomba a Tanque
   Cálculo de CDT, potencia, diámetro
   económico y costo de energía
   ════════════════════════════════════════ */

// Bresse K factors by pumping hours
export const PUMPING_REGIMES = [
  { hours: 24, K: 1.0, label: '24 horas (continuo)' },
  { hours: 20, K: 1.1, label: '20 horas' },
  { hours: 16, K: 1.2, label: '16 horas' },
  { hours: 12, K: 1.3, label: '12 horas' },
  { hours: 10, K: 1.4, label: '10 horas' },
  { hours: 8,  K: 1.5, label: '8 horas' },
];

export interface PumpLineInputs {
  // Flow
  Qmd_ls: number | null;       // mean daily flow L/s (from demand calc)
  horasBombeo: number;          // hours per day
  // Geometry
  cotaBomba: number;            // m.s.n.m. — pump centerline elevation
  cotaTanque: number;           // m.s.n.m. — tank water level
  // Pipe
  L: number | null;             // m — pipe length
  DN_mm: number | null;         // mm — if null, use economic diameter
  C: number;                    // Hazen-Williams
  materialName: string;
  hmPercent: number;            // minor losses as % of hf (default 10)
  // Pump
  eficienciaBomba: number;      // 0-1 (default 0.70)
  eficienciaMotor: number;      // 0-1 (default 0.90)
  // Energy
  tarifaCFE: number;            // $/kWh (default ~1.5)
}

export interface PumpLineResults {
  // Flow regime
  Qbombeo_ls: number;           // pumping flow L/s
  Qbombeo_m3h: number;
  volDiario_m3: number;         // daily volume
  // Economic diameter
  D_econ_m: number;             // Bresse result in m
  DN_econ_mm: number;           // nearest standard DN
  K_bresse: number;
  // Hydraulics (at selected DN)
  DN_used_mm: number;
  V: number;                    // m/s
  hf: number;                   // m
  hm: number;                   // m
  J_km: number;                 // m/km
  // Head
  Hg: number;                   // geometric head m
  CDT: number;                  // total dynamic head m
  CDT_kgcm2: number;
  // Power
  Ph_kW: number;                // hydraulic power
  Pb_kW: number;                // brake power
  Pm_kW: number;                // motor power
  Pm_HP: number;
  HP_comercial: number;         // nearest commercial HP
  // Energy
  kWh_dia: number;
  kWh_mes: number;
  costo_mes: number;            // $/month
  costo_anual: number;
  // Alerts
  alerts: { level: 'WARN' | 'ERROR'; message: string }[];
}

// Standard DNS for economic diameter selection
const STD_DNS = [50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 750, 900];

// Commercial HP sizes
const HP_COMERCIAL = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];

function hfHW(Q_m3s: number, D_m: number, C: number, L: number): number {
  if (Q_m3s <= 0 || D_m <= 0 || L <= 0) return 0;
  return 10.67 * L * Math.pow(Q_m3s, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}

export function calculatePumpLine(input: PumpLineInputs): PumpLineResults | null {
  const { Qmd_ls, horasBombeo, cotaBomba, cotaTanque, L, C, hmPercent, eficienciaBomba, eficienciaMotor, tarifaCFE } = input;

  if (Qmd_ls == null || Qmd_ls <= 0 || L == null || L <= 0) return null;

  const alerts: PumpLineResults['alerts'] = [];

  // 1. Pumping flow
  const factorBombeo = 24 / horasBombeo;
  const Qbombeo_ls = Qmd_ls * factorBombeo;
  const Qbombeo_m3s = Qbombeo_ls / 1000;
  const Qbombeo_m3h = Qbombeo_ls * 3.6;
  const volDiario_m3 = Qmd_ls * 86.4; // Qmd in L/s × 86400 / 1000

  // 2. Economic diameter (Bresse)
  const regime = PUMPING_REGIMES.find(r => r.hours === horasBombeo) ?? PUMPING_REGIMES[3];
  const K = regime.K;
  const D_econ_m = K * Math.sqrt(Qbombeo_m3s);
  const D_econ_mm = D_econ_m * 1000;

  // Find nearest standard DN
  let DN_econ_mm = STD_DNS[0];
  for (const dn of STD_DNS) {
    if (dn >= D_econ_mm) { DN_econ_mm = dn; break; }
    DN_econ_mm = dn;
  }

  // 3. Use selected DN or economic
  const DN_used_mm = input.DN_mm ?? DN_econ_mm;
  const D_m = DN_used_mm / 1000;
  const A = Math.PI * Math.pow(D_m / 2, 2);

  // 4. Hydraulics
  const V = Qbombeo_m3s / A;
  const hf = hfHW(Qbombeo_m3s, D_m, C, L);
  const hm = hf * (hmPercent / 100);
  const J_km = L > 0 ? (hf / L) * 1000 : 0;

  // 5. Head
  const Hg = cotaTanque - cotaBomba;
  const CDT = Hg + hf + hm;
  const CDT_kgcm2 = CDT / 10;

  // 6. Power
  const gamma = 9810; // N/m³
  const Ph_kW = (gamma * Qbombeo_m3s * CDT) / 1000;
  const Pb_kW = Ph_kW / eficienciaBomba;
  const Pm_kW = Pb_kW / eficienciaMotor;
  const Pm_HP = Pm_kW * 1.341;

  // Nearest commercial HP (round up)
  let HP_com = HP_COMERCIAL[HP_COMERCIAL.length - 1];
  for (const hp of HP_COMERCIAL) {
    if (hp >= Pm_HP) { HP_com = hp; break; }
  }

  // 7. Energy cost
  const kWh_dia = Pm_kW * horasBombeo;
  const kWh_mes = kWh_dia * 30;
  const costo_mes = kWh_mes * tarifaCFE;
  const costo_anual = costo_mes * 12;

  // 8. Alerts
  if (V > 2.0) alerts.push({ level: 'WARN', message: `Velocidad ${V.toFixed(2)} m/s (max recomendado en impulsion: 2.0 m/s)` });
  if (V < 0.5) alerts.push({ level: 'WARN', message: `Velocidad ${V.toFixed(2)} m/s (min recomendado: 0.5 m/s — sedimentacion)` });
  if (J_km > 10) alerts.push({ level: 'WARN', message: `Gradiente ${J_km.toFixed(1)} m/km (max 10)` });
  if (Hg < 0) alerts.push({ level: 'WARN', message: `Desnivel negativo (${Hg.toFixed(1)}m) — el tanque esta mas bajo que la bomba, no requiere impulsion` });
  if (CDT > 150) alerts.push({ level: 'WARN', message: `CDT muy alta (${CDT.toFixed(1)}m) — verificar datos o considerar estacion de rebombeo` });
  if (DN_used_mm !== DN_econ_mm) {
    const diff = ((DN_used_mm - DN_econ_mm) / DN_econ_mm * 100).toFixed(0);
    if (DN_used_mm < DN_econ_mm) alerts.push({ level: 'WARN', message: `DN seleccionado (${DN_used_mm}mm) es menor que el economico (${DN_econ_mm}mm) — mayor costo de energia` });
  }
  if (eficienciaBomba < 0.5) alerts.push({ level: 'WARN', message: `Eficiencia de bomba ${(eficienciaBomba*100).toFixed(0)}% es baja — verificar` });

  return {
    Qbombeo_ls, Qbombeo_m3h, volDiario_m3,
    D_econ_m, DN_econ_mm, K_bresse: K,
    DN_used_mm, V, hf, hm, J_km,
    Hg, CDT, CDT_kgcm2,
    Ph_kW, Pb_kW, Pm_kW, Pm_HP, HP_comercial: HP_com,
    kWh_dia, kWh_mes, costo_mes, costo_anual,
    alerts,
  };
}
