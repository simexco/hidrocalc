/* ════════════════════════════════════════
   Servicio de cotas satelitales (SRTM ~30 m) con caché y doble proveedor.
   POST { puntos: [{ lat, lon }] }  →  { cotas: (number|null)[], proveedor, desdeCache }
   - Caché en Supabase (tabla public.elevaciones; si no existe, se omite sin fallar)
     → es también el "modo demo blindado": lo consultado una vez queda guardado.
   - Proveedor 1: Open Topo Data (srtm30m) · Proveedor 2: Open-Elevation (respaldo)
   ════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const MAX_PUNTOS = 450;
const CHUNK = 100;

interface Punto { lat: number; lon: number }

const clave = (p: Punto) => `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`; // ~11 m — resolución del DEM

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

async function deOpenTopoData(puntos: Punto[]): Promise<(number | null)[]> {
  const out: (number | null)[] = [];
  for (let i = 0; i < puntos.length; i += CHUNK) {
    const lote = puntos.slice(i, i + CHUNK);
    const locs = lote.map((p) => `${p.lat},${p.lon}`).join("|");
    const r = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${locs}`, { signal: AbortSignal.timeout(9000) });
    if (!r.ok) throw new Error(`opentopodata ${r.status}`);
    const j = (await r.json()) as { results: { elevation: number | null }[] };
    out.push(...j.results.map((x) => x.elevation));
    if (i + CHUNK < puntos.length) await new Promise((res) => setTimeout(res, 1100)); // su API pública pide 1 req/s
  }
  return out;
}

async function deOpenElevation(puntos: Punto[]): Promise<(number | null)[]> {
  const out: (number | null)[] = [];
  for (let i = 0; i < puntos.length; i += CHUNK) {
    const lote = puntos.slice(i, i + CHUNK);
    const r = await fetch("https://api.open-elevation.com/api/v1/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: lote.map((p) => ({ latitude: p.lat, longitude: p.lon })) }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`open-elevation ${r.status}`);
    const j = (await r.json()) as { results: { elevation: number }[] };
    out.push(...j.results.map((x) => x.elevation));
  }
  return out;
}

export async function POST(req: Request) {
  let puntos: Punto[];
  try {
    const body = (await req.json()) as { puntos?: Punto[] };
    puntos = (body.puntos ?? []).filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon));
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  if (puntos.length === 0) return NextResponse.json({ error: "Sin puntos" }, { status: 400 });
  if (puntos.length > MAX_PUNTOS) return NextResponse.json({ error: `Máximo ${MAX_PUNTOS} puntos por consulta` }, { status: 400 });

  const sb = supa();
  const cotasPorClave = new Map<string, number>();

  // 1) Caché (si la tabla no existe aún, se ignora el error y se sigue)
  if (sb) {
    try {
      const claves = Array.from(new Set(puntos.map(clave)));
      for (let i = 0; i < claves.length; i += 200) {
        const { data } = await sb.from("elevaciones").select("key,cota").in("key", claves.slice(i, i + 200));
        for (const fila of data ?? []) cotasPorClave.set(fila.key as string, fila.cota as number);
      }
    } catch { /* sin caché */ }
  }

  // 2) Faltantes → proveedores (con respaldo)
  const faltantes: Punto[] = [];
  const clavesFaltantes: string[] = [];
  for (const p of puntos) {
    const k = clave(p);
    if (!cotasPorClave.has(k) && !clavesFaltantes.includes(k)) { faltantes.push(p); clavesFaltantes.push(k); }
  }

  let proveedor = "cache";
  if (faltantes.length > 0) {
    let elevs: (number | null)[] | null = null;
    try { elevs = await deOpenTopoData(faltantes); proveedor = "opentopodata-srtm30m"; }
    catch {
      try { elevs = await deOpenElevation(faltantes); proveedor = "open-elevation"; }
      catch { return NextResponse.json({ error: "Los servicios de elevación no respondieron. Intenta de nuevo en un minuto." }, { status: 502 }); }
    }
    const nuevos: { key: string; lat: number; lon: number; cota: number; proveedor: string }[] = [];
    faltantes.forEach((p, i) => {
      const e = elevs![i];
      if (e != null && Number.isFinite(e)) {
        cotasPorClave.set(clavesFaltantes[i], e);
        nuevos.push({ key: clavesFaltantes[i], lat: p.lat, lon: p.lon, cota: e, proveedor });
      }
    });
    // 3) Guardar en caché (mejor esfuerzo)
    if (sb && nuevos.length > 0) {
      try { await sb.from("elevaciones").upsert(nuevos, { onConflict: "key", ignoreDuplicates: true }); } catch { /* sin caché */ }
    }
  }

  const cotas = puntos.map((p) => cotasPorClave.get(clave(p)) ?? null);
  const desdeCache = puntos.length - faltantes.length;
  return NextResponse.json({ cotas, proveedor, desdeCache });
}
