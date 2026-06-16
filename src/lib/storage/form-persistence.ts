/* ════════════════════════════════════════
   Form Persistence — Auto-save to localStorage
   ════════════════════════════════════════ */

const PREFIX = "hidrocalc_form_";

export function saveFormState(moduleKey: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + moduleKey, JSON.stringify(data));
  } catch { /* quota exceeded, silently ignore */ }
}

export function loadFormState<T>(moduleKey: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(PREFIX + moduleKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearFormState(moduleKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + moduleKey);
}

// Borra TODOS los datos guardados de todos los modulos + el proyecto activo.
// Usado por "Nuevo proyecto" para empezar de cero en todas las paginas.
export function clearAllFormState(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(PREFIX) || key === "hidrocalc-active-project")) toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
