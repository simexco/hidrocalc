/* ════════════════════════════════════════
   Snapshot del estado local completo de HidroCalc:
   proyecto activo + formularios de todos los módulos.
   Se usa para guardar/abrir proyectos en la nube.
   ════════════════════════════════════════ */

const PREFIJO_FORM = "hidrocalc_form_";
const CLAVE_PROYECTO = "hidrocalc-active-project";

export interface SnapshotLocal {
  version: 1;
  claves: Record<string, string>;  // clave localStorage → valor JSON crudo
}

// Junta TODO lo que HidroCalc guarda en este navegador
export function tomarSnapshotLocal(): SnapshotLocal {
  const claves: Record<string, string> = {};
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(PREFIJO_FORM) || k === CLAVE_PROYECTO)) {
        const v = localStorage.getItem(k);
        if (v != null) claves[k] = v;
      }
    }
  }
  return { version: 1, claves };
}

// Reemplaza el estado local con el snapshot (abrir un proyecto guardado)
export function aplicarSnapshotLocal(snap: SnapshotLocal): void {
  if (typeof window === "undefined" || !snap?.claves) return;
  // Limpiar lo actual
  const aBorrar: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith(PREFIJO_FORM) || k === CLAVE_PROYECTO)) aBorrar.push(k);
  }
  aBorrar.forEach((k) => localStorage.removeItem(k));
  // Escribir el snapshot
  Object.entries(snap.claves).forEach(([k, v]) => {
    if (k.startsWith(PREFIJO_FORM) || k === CLAVE_PROYECTO) localStorage.setItem(k, v);
  });
}

// Nombre y folio del proyecto activo (para etiquetar el guardado)
export function datosProyectoActivo(): { nombre: string; folio: string } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CLAVE_PROYECTO) : null;
    if (raw) {
      const p = JSON.parse(raw)?.state?.project;
      return { nombre: p?.proyecto || "", folio: p?.folio || "" };
    }
  } catch { /* ignore */ }
  return { nombre: "", folio: "" };
}
