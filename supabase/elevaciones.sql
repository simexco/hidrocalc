-- ════════════════════════════════════════
-- Caché de cotas satelitales — correr UNA VEZ en Supabase (SQL Editor → Run).
-- Cada punto consultado queda guardado: es la base del "modo demo blindado"
-- (las rutas de la expo se pre-consultan y después responden al instante,
-- aunque los servicios externos o el WiFi fallen).
-- ════════════════════════════════════════

create table if not exists public.elevaciones (
  key text primary key,          -- "lat,lon" redondeados a 4 decimales (~11 m)
  lat double precision not null,
  lon double precision not null,
  cota double precision not null, -- m.s.n.m. (SRTM ~30 m)
  proveedor text,
  created_at timestamptz default now()
);

alter table public.elevaciones enable row level security;

create policy "lectura publica de cache de cotas"
  on public.elevaciones for select using (true);

create policy "escritura publica de cache de cotas"
  on public.elevaciones for insert with check (true);
