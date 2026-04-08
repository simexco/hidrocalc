/* ════════════════════════════════════════
   Default Values Logic
   ════════════════════════════════════════ */

import { DEFAULTS } from "@/lib/constants";
import type { AssumedValue } from "@/types/hydraulic";

export interface DefaultCheck {
  assumed: AssumedValue[];
  values: {
    z1: number;
    z2: number;
    C: number;
  };
}

export function applyDefaults(
  z1: number | null | undefined,
  z2: number | null | undefined,
  C: number | null | undefined
): DefaultCheck {
  const assumed: AssumedValue[] = [];
  const values = {
    z1: z1 ?? DEFAULTS.z1,
    z2: z2 ?? DEFAULTS.z2,
    C: C ?? DEFAULTS.C,
  };

  if (z1 == null || z1 === undefined) {
    assumed.push({ field: "z1", value: DEFAULTS.z1, label: "Cota entrada asumida: 0 m (terreno plano)" });
  }
  if (z2 == null || z2 === undefined) {
    assumed.push({ field: "z2", value: DEFAULTS.z2, label: "Cota salida asumida: 0 m (terreno plano)" });
  }
  if (C == null || C === undefined) {
    assumed.push({ field: "C", value: DEFAULTS.C, label: "Coeficiente C asumido: 130 (conservador)" });
  }

  return { assumed, values };
}
