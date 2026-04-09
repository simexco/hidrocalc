/* ════════════════════════════════════════
   Diameter Sizing Engine
   Module 5
   ════════════════════════════════════════ */

import { compareDiameters } from "./hazen-williams";
import { STANDARD_DNS } from "@/lib/constants";
import type { PipeSizingInputs, PipeSizingResults } from "@/types/hydraulic";

export function calculatePipeSizing(input: PipeSizingInputs): PipeSizingResults | null {
  const { Q, L, C, P1, P2min, z1, z2, maxVelocity } = input;

  if (Q == null || L == null || Q <= 0 || L <= 0) return null;

  const dns = STANDARD_DNS.filter((d) => d <= 600);

  const { rows, recommendedDN } = compareDiameters(
    Q, L, C, P1, P2min, z1, z2, maxVelocity, dns
  );

  const alerts = [];
  if (recommendedDN) {
    alerts.push({
      level: "OK" as const,
      field: "DN",
      message: `DN recomendado: ${recommendedDN} mm — cumple velocidad y presion`,
    });
  } else {
    // Determine specific failure reason
    const allFailVmin = rows.every((r) => !r.meetsVmin);
    const allFailVmax = rows.every((r) => !r.meetsVmax);
    const allFailP = rows.every((r) => r.meetsPressure === false);
    const someVok = rows.some((r) => r.meetsVelocity);
    const somePok = rows.some((r) => r.meetsPressure === true);

    if (allFailVmin) {
      alerts.push({
        level: "ERROR" as const,
        field: "DN",
        message: "Caudal muy bajo para los diámetros disponibles — todos tienen V < 0.3 m/s. Verificar caudal de diseño.",
      });
    } else if (allFailVmax) {
      alerts.push({
        level: "ERROR" as const,
        field: "DN",
        message: "Caudal muy alto para los diámetros disponibles — todos exceden velocidad maxima. Considerar diámetros mayores.",
      });
    } else if (allFailP) {
      alerts.push({
        level: "ERROR" as const,
        field: "DN",
        message: "Presión insuficiente para este tramo en todos los diámetros. Aumentar P1 o reducir longitud.",
      });
    } else if (someVok && somePok) {
      alerts.push({
        level: "ERROR" as const,
        field: "DN",
        message: "No existe DN estándar que cumpla simultáneamente velocidad y presión. Considerar cambio de condiciones de diseño.",
      });
    } else {
      alerts.push({
        level: "ERROR" as const,
        field: "DN",
        message: "Ningun diámetro estándar cumple las restricciones. Verificar parametros de entrada.",
      });
    }
  }

  return {
    rows,
    recommendedDN,
    alerts,
    dataStatus: P1 != null ? "calculated" : "estimated",
  };
}
