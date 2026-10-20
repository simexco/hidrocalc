/* ════════════════════════════════════════
   Servicio de cotas satelitales (SRTM ~30 m) con caché y doble proveedor.
   POST { puntos: [{ lat, lon }] }  →  { cotas: (number|null)[], proveedor, desdeCache, proveedores, advertencia? }
   - Caché en Supabase (tabla public.elevaciones; si no existe, se omite sin fallar)
     → es también el "modo demo blindado": lo consultado una vez queda guardado.
   - Proveedor 1: Open Topo Data (srtm30m) · Proveedor 2: Open-Elevation (respaldo)
   - Los proveedores difieren entre sí hasta ~30 m en montaña para la MISMA coordenada
     (validación 2026-10-19; mediana 3.1 m en plano). Mezclarlos en un mismo perfil crea
     desniveles ficticios. Mitigación en dos capas:
       · El caché SOLO guarda cotas del primario (RLS permite insertar pero no actualizar,
         así que una fila de respaldo sería imposible de corregir después): el caché queda
         de una sola fuente por construcción.
       · Si aun así un request mezcla fuentes (caché del primario + faltantes del respaldo),
         se re-consulta TODO el trazo con un solo proveedor; si eso también falla, la
         respuesta trae `advertencia` para que el frontend la muestre en el banner.
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

const PROV_OTD = "opentopodata-srtm30m";
const PROV_OE = "open-elevation";

// Un solo proveedor para todo el lote: el preferido si se conoce vivo, si no primario→respaldo
async function consultarCotas(puntos: Punto[], preferido?: string): Promise<{ elevs: (number | null)[]; prov: string }> {
  if (preferido === PROV_OE) return { elevs: await deOpenElevation(puntos), prov: PROV_OE };
  if (preferido === PROV_OTD) return { elevs: await deOpenTopoData(puntos), prov: PROV_OTD };
  try { return { elevs: await deOpenTopoData(puntos), prov: PROV_OTD }; }
  catch { return { elevs: await deOpenElevation(puntos), prov: PROV_OE }; }
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
  const provPorClave = new Map<string, string>();

  // 1) Caché (si la tabla no existe aún, se ignora el error y se sigue)
  //    Solo se aceptan filas del primario: una fila de otra fuente (no debería existir,
  //    el paso 3 solo guarda primario) se trata como faltante y se re-consulta, para que
  //    una fila anómala no pueda meter un datum distinto al perfil.
  if (sb) {
    try {
      const claves = Array.from(new Set(puntos.map(clave)));
      for (let i = 0; i < claves.length; i += 200) {
        const { data } = await sb.from("elevaciones").select("key,cota,proveedor").in("key", claves.slice(i, i + 200));
        for (const fila of data ?? []) {
          if ((fila.proveedor as string | null) !== PROV_OTD) continue;
          cotasPorClave.set(fila.key as string, fila.cota as number);
          provPorClave.set(fila.key as string, fila.proveedor as string);
        }
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
  let provVivo: string | undefined; // el que respondió en ESTA solicitud (se sabe disponible)
  if (faltantes.length > 0) {
    let elevs: (number | null)[];
    try { ({ elevs, prov: proveedor } = await consultarCotas(faltantes)); provVivo = proveedor; }
    catch { return NextResponse.json({ error: "Los servicios de elevación no respondieron. Intenta de nuevo en un minuto." }, { status: 502 }); }
    const nuevos: { key: string; lat: number; lon: number; cota: number; proveedor: string }[] = [];
    faltantes.forEach((p, i) => {
      const e = elevs[i];
      if (e != null && Number.isFinite(e)) {
        cotasPorClave.set(clavesFaltantes[i], Math.round(e)); // metro entero, igual que el DEM
        provPorClave.set(clavesFaltantes[i], proveedor);
        nuevos.push({ key: clavesFaltantes[i], lat: p.lat, lon: p.lon, cota: Math.round(e), proveedor });
      }
    });
    // 3) Guardar en caché (mejor esfuerzo) — SOLO cotas del primario: las del respaldo no
    //    se cachean para que el caché nunca mezcle fuentes (RLS no deja corregirlas luego)
    if (sb && nuevos.length > 0 && proveedor === PROV_OTD) {
      try { await sb.from("elevaciones").upsert(nuevos, { onConflict: "key", ignoreDuplicates: true }); } catch { /* sin caché */ }
    }
  }

  // 4) Si el perfil quedó con cotas de DOS fuentes (caché del primario + faltantes del
  //    respaldo, o una fila vieja atípica), se re-consulta TODO el trazo con el proveedor
  //    que sí está respondiendo: el desnivel no debe mezclar datums que difieren ~30 m.
  //    Solo se unifica la RESPUESTA (en memoria): el caché no se toca, porque RLS no
  //    permite actualizar filas y el paso 3 ya garantiza que solo entren cotas del primario.
  const unicos: Punto[] = [];
  const clavesUnicas: string[] = [];
  for (const p of puntos) {
    const k = clave(p);
    if (!clavesUnicas.includes(k)) { unicos.push(p); clavesUnicas.push(k); }
  }
  const provsUsados = new Set(clavesUnicas.filter((k) => cotasPorClave.has(k)).map((k) => provPorClave.get(k) ?? "fuente-desconocida"));
  if (provsUsados.size > 1) {
    try {
      const { elevs, prov } = await consultarCotas(unicos, provVivo);
      unicos.forEach((p, i) => {
        const e = elevs[i];
        if (e != null && Number.isFinite(e)) {
          cotasPorClave.set(clavesUnicas[i], Math.round(e));
          provPorClave.set(clavesUnicas[i], prov);
        }
      });
      proveedor = prov;
    } catch { /* no se pudo unificar: abajo sale la advertencia con el conteo */ }
  }

  // 5) Conteo por fuente (sobre los puntos del request) y advertencia si siguió la mezcla
  const proveedores: Record<string, number> = {};
  for (const p of puntos) {
    const k = clave(p);
    if (!cotasPorClave.has(k)) continue;
    const pr = provPorClave.get(k) ?? "fuente-desconocida";
    proveedores[pr] = (proveedores[pr] ?? 0) + 1;
  }
  let advertencia: string | undefined;
  if (Object.keys(proveedores).length > 1) {
    const detalle = Object.entries(proveedores).map(([pr, n]) => `${n} de ${pr}`).join(" y ");
    advertencia = `Este perfil mezcla cotas de dos fuentes satelitales (${detalle}). Entre fuentes la misma coordenada puede diferir varios metros (hasta ~30 m en montaña), lo que crea desniveles ficticios. Reintenta en unos minutos para unificar la fuente, o verifica los puntos críticos antes de usar el perfil.`;
  }

  const cotas = puntos.map((p) => cotasPorClave.get(clave(p)) ?? null);
  const desdeCache = puntos.length - faltantes.length;
  return NextResponse.json({ cotas, proveedor, desdeCache, proveedores, ...(advertencia ? { advertencia } : {}) });
}
