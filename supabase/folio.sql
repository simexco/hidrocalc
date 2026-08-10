-- ════════════════════════════════════════
-- Folio consecutivo REAL de Sigma Flow — correr una sola vez
-- en Supabase: SQL Editor → pegar → Run.
-- Arranca en 1000. Cada proyecto nuevo toma el siguiente número,
-- así el folio sirve como medidor real de uso de la plataforma.
-- ════════════════════════════════════════

create sequence if not exists public.folio_seq start with 1000;

create or replace function public.siguiente_folio()
returns text
language sql
security definer
set search_path = public
as $$
  select 'SF-' || extract(year from now())::int || '-' || nextval('public.folio_seq')::text;
$$;

grant execute on function public.siguiente_folio() to anon, authenticated;

-- Para consultar cuántos proyectos se han iniciado (cuando quieras):
--   select last_value from public.folio_seq;
