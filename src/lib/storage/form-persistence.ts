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
