/* ════════════════════════════════════════
   Búsqueda de lugares para el mapa (geocodificación).
   GET /api/geocodificar?q=delicias chihuahua
   Usa Nominatim (OpenStreetMap) con User-Agent propio, resultados en español
   y preferencia por México. Gratuito; uso ligero (una búsqueda por Enter).
   ════════════════════════════════════════ */

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ error: "Escribe un lugar a buscar" }, { status: 400 });
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=es&countrycodes=mx&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "SigmaFlow/2.0 (plataforma de ingenieria hidraulica; hidrocalc.vercel.app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`nominatim ${r.status}`);
    const datos = (await r.json()) as { display_name: string; lat: string; lon: string }[];
    return NextResponse.json({
      resultados: datos.map((d) => ({ nombre: d.display_name, lat: parseFloat(d.lat), lon: parseFloat(d.lon) })),
    });
  } catch {
    return NextResponse.json({ error: "El buscador de lugares no respondió. Intenta de nuevo." }, { status: 502 });
  }
}
