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

  // Use all standard DNs up to 600mm for sizing
  const dns = STANDARD_DNS.filter((d) => d <= 600);

  const { rows, recommendedDN } = compareDiameters(
    Q, L, C, P1, P2min, z1, z2, maxVelocity, dns
  );

  const alerts = [];
  if (recommendedDN) {
    alerts.push({
      level: "OK" as const,
      field: "DN",
      message: `DN recomendado: ${recommendedDN} mm — cumple velocidad y presión`,
    });
  } else {
    alerts.push({
      level: "ERROR" as const,
      field: "DN",
      message: "Ningún diámetro estándar cumple las restricciones con los parámetros ingresados. Verificar P₁ o L.",
    });
  }

  return {
    rows,
    recommendedDN,
    alerts,
    dataStatus: P1 != null ? "calculated" : "estimated",
  };
}
