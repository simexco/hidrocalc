/* ════════════════════════════════════════
   Folio de proyecto — SF-AAAA-NNNN
   Consecutivo REAL global (secuencia en Supabase, arranca en 1000):
   sirve como medidor de uso — folio actual − 1000 = proyectos iniciados.
   Sin conexión, respaldo local con formato 0NNN (distinguible del real).
   ════════════════════════════════════════ */

import { supabase } from "@/lib/supabase";

export async function obtenerFolio(): Promise<string> {
  const año = new Date().getFullYear();
  try {
    if (supabase) {
      const { data, error } = await supabase.rpc("siguiente_folio");
      if (!error && typeof data === "string" && data) return data;
    }
  } catch { /* sin conexión */ }
  // Respaldo sin conexión: rango 0100-0999 — nunca se confunde con el consecutivo real (≥1000)
  return `SF-${año}-0${Math.floor(Math.random() * 900) + 100}`;
}
