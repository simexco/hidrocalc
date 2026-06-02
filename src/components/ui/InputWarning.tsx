"use client";

// Smart input validation warnings — shown BEFORE calculating
// Catches obviously wrong values early

interface Warning {
  level: "info" | "warn" | "error";
  message: string;
}

export function validateHydraulicInputs(params: {
  Q_ls?: number | null;     // L/s
  DN_mm?: number | null;
  L?: number | null;        // m
  P1_kgcm2?: number | null;
  z1?: number;
  z2?: number;
}): Warning[] {
  const { Q_ls, DN_mm, L, P1_kgcm2, z1, z2 } = params;
  const warnings: Warning[] = [];

  // Q validation
  if (Q_ls != null) {
    if (Q_ls < 0) warnings.push({ level: "error", message: "El caudal no puede ser negativo" });
    if (Q_ls > 5000) warnings.push({ level: "warn", message: `Q = ${Q_ls} L/s es muy alto — verificar unidades (¿son m³/h en vez de L/s?)` });
    if (DN_mm != null && Q_ls > 0) {
      const D_m = DN_mm / 1000;
      const A = Math.PI * Math.pow(D_m / 2, 2);
      const V = (Q_ls / 1000) / A;
      if (V > 5) warnings.push({ level: "warn", message: `V estimada = ${V.toFixed(1)} m/s — considerar DN mayor` });
    }
  }

  // L validation
  if (L != null) {
    if (L < 0) warnings.push({ level: "error", message: "La longitud no puede ser negativa" });
    if (L > 100000) warnings.push({ level: "warn", message: `L = ${L}m (${(L/1000).toFixed(0)} km) — verificar que sea correcto` });
  }

  // P1 validation
  if (P1_kgcm2 != null) {
    if (P1_kgcm2 < 0) warnings.push({ level: "error", message: "La presion no puede ser negativa" });
    if (P1_kgcm2 > 50) warnings.push({ level: "warn", message: `P1 = ${P1_kgcm2} kg/cm² es muy alta — verificar unidades (¿esta en m.c.a.?)` });
  }

  // Elevation check
  if (z1 != null && z2 != null && P1_kgcm2 != null) {
    const dz = z2 - z1;
    if (dz > 0 && P1_kgcm2 * 10 < dz) {
      warnings.push({ level: "warn", message: `El desnivel (${dz.toFixed(0)}m) es mayor que la presion disponible (${(P1_kgcm2*10).toFixed(0)} m.c.a.) — el agua no llegara` });
    }
  }

  return warnings;
}

export function InputWarnings({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="space-y-1">
      {warnings.map((w, i) => (
        <div key={i} className={`text-[11px] px-3 py-1.5 rounded-lg ${
          w.level === "error" ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
          w.level === "warn" ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" :
          "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        }`}>
          {w.level === "error" ? "✗" : w.level === "warn" ? "⚠" : "ℹ"} {w.message}
        </div>
      ))}
    </div>
  );
}
