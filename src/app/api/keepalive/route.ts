/* ════════════════════════════════════════
   Despertador de Supabase: el plan gratuito pausa los proyectos tras ~1 semana
   sin actividad. Un cron de Vercel visita este endpoint a diario y hace una
   consulta mínima — con eso el proyecto (folios, cuentas, nube, caché de cotas)
   se mantiene activo siempre. No escribe ni incrementa nada.
   ════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, motivo: "sin configuración de Supabase" });
  const sb = createClient(url, key);
  const toques: Record<string, string> = {};
  // Consultas de solo lectura, mínimas; si alguna tabla no existe, se reporta y se sigue
  for (const tabla of ["proyectos", "elevaciones"]) {
    try {
      const { error } = await sb.from(tabla).select("*", { head: true, count: "exact" }).limit(1);
      toques[tabla] = error ? `error: ${error.message}` : "ok";
    } catch (e) {
      toques[tabla] = `excepción: ${e instanceof Error ? e.message : "?"}`;
    }
  }
  const activo = Object.values(toques).some((v) => v === "ok");
  return NextResponse.json({ ok: activo, toques, fecha: new Date().toISOString() });
}
