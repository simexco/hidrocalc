/* ════════════════════════════════════════
   Ruta desde Google Earth (KML/KMZ) → perfil topográfico
   - Lee el trazo (LineString) del archivo
   - Calcula cadenamientos reales (haversine) y remuestrea la ruta
   - Reduce el perfil (Douglas-Peucker sobre distancia-cota) a vértices útiles
   Las cotas NO vienen en el KML: se consultan a /api/elevacion (SRTM ~30 m).
   ════════════════════════════════════════ */

export interface PuntoRuta { lat: number; lon: number }
export interface PuntoMuestra extends PuntoRuta { dist: number }

const R_TIERRA = 6371008.8; // m

export function haversine(a: PuntoRuta, b: PuntoRuta): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R_TIERRA * Math.asin(Math.sqrt(s));
}

// Extrae las coordenadas del trazo de un KML (texto XML).
// Busca el primer LineString con puntos; si no hay, usa los Placemark de tipo Point en orden.
export function parseKML(xml: string): PuntoRuta[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseCoordsText = (txt: string): PuntoRuta[] =>
    txt.trim().split(/\s+/).map((t) => {
      const [lon, lat] = t.split(",").map(Number);
      return { lat, lon };
    }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  const lineStrings = Array.from(doc.getElementsByTagName("LineString"));
  for (const ls of lineStrings) {
    const c = ls.getElementsByTagName("coordinates")[0]?.textContent ?? "";
    const pts = parseCoordsText(c);
    if (pts.length >= 2) return pts;
  }
  // gx:Track (rutas grabadas con GPS)
  const gxCoords = Array.from(doc.getElementsByTagName("gx:coord"));
  if (gxCoords.length >= 2) {
    const pts = gxCoords.map((n) => {
      const [lon, lat] = (n.textContent ?? "").trim().split(/\s+/).map(Number);
      return { lat, lon };
    }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
    if (pts.length >= 2) return pts;
  }
  // Ultimo recurso: Placemarks de punto, en el orden del archivo
  const puntos: PuntoRuta[] = [];
  for (const pm of Array.from(doc.getElementsByTagName("Placemark"))) {
    const pt = pm.getElementsByTagName("Point")[0];
    const c = pt?.getElementsByTagName("coordinates")[0]?.textContent ?? "";
    const pts = parseCoordsText(c);
    if (pts.length === 1) puntos.push(pts[0]);
  }
  return puntos;
}

// Carga .kml directo o .kmz (zip con doc.kml adentro)
export async function cargarArchivoRuta(file: File): Promise<PuntoRuta[]> {
  const esKMZ = file.name.toLowerCase().endsWith(".kmz");
  let xml: string;
  if (esKMZ) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entrada = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith(".kml"));
    if (!entrada) throw new Error("El KMZ no contiene ningún archivo KML");
    xml = await zip.files[entrada].async("string");
  } else {
    xml = await file.text();
  }
  const pts = parseKML(xml);
  if (pts.length < 2) throw new Error("No se encontró un trazo (ruta) en el archivo. En Google Earth dibuja la línea con la herramienta «Agregar ruta» y guárdala como KML/KMZ.");
  return pts;
}

// Remuestrea la ruta a puntos cada ~paso metros (interpolación lineal entre vértices del trazo),
// conservando inicio y fin. Devuelve también el cadenamiento (dist) de cada muestra.
export function muestrearRuta(coords: PuntoRuta[], pasoM: number, maxMuestras = 400): PuntoMuestra[] {
  const acum: number[] = [0];
  for (let i = 1; i < coords.length; i++) acum.push(acum[i - 1] + haversine(coords[i - 1], coords[i]));
  const total = acum[acum.length - 1];
  if (total <= 0) return [{ ...coords[0], dist: 0 }];
  const paso = Math.max(pasoM, total / (maxMuestras - 1));
  const muestras: PuntoMuestra[] = [];
  let seg = 0;
  for (let d = 0; d < total; d += paso) {
    while (seg < coords.length - 2 && acum[seg + 1] < d) seg++;
    const L = acum[seg + 1] - acum[seg];
    const f = L > 0 ? (d - acum[seg]) / L : 0;
    muestras.push({
      lat: coords[seg].lat + f * (coords[seg + 1].lat - coords[seg].lat),
      lon: coords[seg].lon + f * (coords[seg + 1].lon - coords[seg].lon),
      dist: d,
    });
  }
  muestras.push({ ...coords[coords.length - 1], dist: total });
  return muestras;
}

// Reduce el perfil (dist, cota) a los vértices que importan (Douglas-Peucker vertical):
// conserva inicio/fin y todos los quiebres mayores a la tolerancia; si salen más de
// maxPuntos, sube la tolerancia hasta caber.
export function reducirPerfil(puntos: { dist: number; cota: number }[], toleranciaM = 1.0, maxPuntos = 40): { dist: number; cota: number }[] {
  if (puntos.length <= 2) return puntos;
  const dp = (tol: number): { dist: number; cota: number }[] => {
    const conservar = new Array(puntos.length).fill(false);
    conservar[0] = conservar[puntos.length - 1] = true;
    const pila: Array<[number, number]> = [[0, puntos.length - 1]];
    while (pila.length) {
      const [i0, i1] = pila.pop()!;
      if (i1 - i0 < 2) continue;
      const a = puntos[i0], b = puntos[i1];
      let peor = -1, peorDesv = 0;
      for (let i = i0 + 1; i < i1; i++) {
        const f = (puntos[i].dist - a.dist) / (b.dist - a.dist || 1);
        const cotaLinea = a.cota + f * (b.cota - a.cota);
        const desv = Math.abs(puntos[i].cota - cotaLinea);
        if (desv > peorDesv) { peorDesv = desv; peor = i; }
      }
      if (peor >= 0 && peorDesv > tol) {
        conservar[peor] = true;
        pila.push([i0, peor], [peor, i1]);
      }
    }
    return puntos.filter((_, i) => conservar[i]);
  };
  let tol = toleranciaM;
  let out = dp(tol);
  while (out.length > maxPuntos && tol < 64) { tol *= 1.6; out = dp(tol); }
  return out;
}
