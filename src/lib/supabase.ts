/* ════════════════════════════════════════
   Cliente de Supabase — cuentas y proyectos en la nube.
   Si las variables de entorno no están configuradas, la app
   funciona igual en modo invitado (guardado local).
   ════════════════════════════════════════ */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const nubeDisponible = !!supabase;
