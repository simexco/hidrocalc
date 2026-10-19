"use client";

/* ════════════════════════════════════════
   Trazar la línea de conducción directamente sobre el mapa (Leaflet):
   cada clic agrega un punto del trazo; la longitud corre en vivo y la cota
   del último punto se consulta al instante (y queda en el caché).
   Al confirmar, el perfil completo se genera igual que al importar un KML.
   La última vista del mapa se recuerda (ideal para el demo de la expo).
   ════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import type * as LT from "leaflet";
import "leaflet/dist/leaflet.css";
import { haversine, type PuntoRuta } from "@/lib/geo/ruta-kml";

const VISTA_KEY = "hidrocalc_mapa_vista";

interface Props {
  ocupado: boolean; // true mientras el perfil procesa (consultando cotas)
  onUsar: (puntos: PuntoRuta[]) => void;
}

export default function MapaTrazo({ ocupado, onUsar }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LT.Map | null>(null);
  const LRef = useRef<typeof LT | null>(null);
  const capaSat = useRef<LT.TileLayer | null>(null);
  const capaCalles = useRef<LT.TileLayer | null>(null);
  const capaTrazo = useRef<LT.LayerGroup | null>(null);
  const puntosRef = useRef<PuntoRuta[]>([]);
  const [nPuntos, setNPuntos] = useState(0);
  const [longitud, setLongitud] = useState(0);
  const [cotaUltimo, setCotaUltimo] = useState<number | null>(null);
  const [vista, setVista] = useState<"sat" | "calles">("sat");
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<{ nombre: string; lat: number; lon: number }[]>([]);
  // Edición táctil (tablet/celular, también sirve en escritorio): tocar un punto lo
  // selecciona y aparece el botón Borrar; sin clic derecho necesario
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const seleccionadoRef = useRef<number | null>(null);

  // Cota de un punto, al instante (y queda cacheada para el perfil completo)
  const consultarCota = (lat: number, lon: number) => {
    setCotaUltimo(null);
    fetch("/api/elevacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puntos: [{ lat, lon }] }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { cotas?: (number | null)[] } | null) => { if (j?.cotas?.[0] != null) setCotaUltimo(j.cotas[0]); })
      .catch(() => { /* la cota en vivo es cortesía; el perfil completo se consulta al confirmar */ });
  };

  const redibujar = () => {
    const L = LRef.current, capa = capaTrazo.current;
    if (!L || !capa) return;
    capa.clearLayers();
    const pts = puntosRef.current;
    if (pts.length >= 2) {
      L.polyline(pts.map((p) => [p.lat, p.lon] as [number, number]), { color: "#7FC4E8", weight: 4, opacity: 0.95 }).addTo(capa);
      L.polyline(pts.map((p) => [p.lat, p.lon] as [number, number]), { color: "#1C3D5A", weight: 1.5, opacity: 0.9, dashArray: "6 6" }).addTo(capa);
    }
    // Cada punto es un marcador EDITABLE: arrastrar lo mueve (mouse o dedo),
    // tocarlo lo selecciona (botón Borrar), y en escritorio clic derecho lo borra directo
    pts.forEach((p, i) => {
      const sel = seleccionadoRef.current === i;
      const esExtremo = i === 0 || i === pts.length - 1;
      const tam = sel ? 22 : esExtremo ? 16 : 12;
      const color = i === 0 ? "#22c55e" : i === pts.length - 1 ? "#ef4444" : "#7FC4E8";
      const borde = sel ? "3px solid #f59e0b" : "2px solid #1C3D5A";
      const icono = L.divIcon({
        className: "",
        html: `<div style="width:${tam}px;height:${tam}px;border-radius:50%;background:${color};border:${borde};box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:grab"></div>`,
        iconSize: [tam, tam],
        iconAnchor: [tam / 2, tam / 2],
      });
      const m = L.marker([p.lat, p.lon], { icon: icono, draggable: true });
      m.bindTooltip(`Punto ${i + 1} · arrástralo para moverlo · tócalo para seleccionar/borrar`, { direction: "top", opacity: 0.9 });
      m.on("click", () => {
        const nuevo = seleccionadoRef.current === i ? null : i;
        seleccionadoRef.current = nuevo;
        setSeleccionado(nuevo);
        redibujar();
      });
      m.on("dragend", () => {
        const ll = m.getLatLng();
        puntosRef.current = puntosRef.current.map((q, j) => (j === i ? { lat: ll.lat, lon: ll.lng } : q));
        redibujar();
        consultarCota(ll.lat, ll.lng);
      });
      m.on("contextmenu", (ev: LT.LeafletMouseEvent) => {
        ev.originalEvent.preventDefault();
        puntosRef.current = puntosRef.current.filter((_, j) => j !== i);
        seleccionadoRef.current = null;
        setSeleccionado(null);
        setCotaUltimo(null);
        redibujar();
      });
      m.addTo(capa);
    });
    let acum = 0;
    for (let i = 1; i < pts.length; i++) acum += haversine(pts[i - 1], pts[i]);
    setLongitud(acum);
    setNPuntos(pts.length);
  };

  const agregarPunto = (lat: number, lon: number) => {
    puntosRef.current = [...puntosRef.current, { lat, lon }];
    redibujar();
    consultarCota(lat, lon);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default as unknown as typeof LT;
      if (cancelado || !divRef.current || mapRef.current) return;
      LRef.current = L;
      let centro: [number, number] = [23.63, -102.55]; // México
      let zoom = 5;
      try {
        const v = JSON.parse(localStorage.getItem(VISTA_KEY) ?? "null") as { lat: number; lon: number; z: number } | null;
        if (v) { centro = [v.lat, v.lon]; zoom = v.z; }
      } catch { /* vista default */ }
      // Sin zoom por doble clic/tap: en táctil el doble toque metía puntos dobles;
      // el zoom queda en los botones +/−, la rueda del mouse y el pellizco
      const map = L.map(divRef.current, { zoomControl: true, doubleClickZoom: false }).setView(centro, zoom);
      mapRef.current = map;
      capaSat.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19, attribution: "Imágenes © Esri — Maxar, Earthstar Geographics",
      });
      capaCalles.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "© OpenStreetMap",
      });
      capaSat.current.addTo(map);
      capaTrazo.current = L.layerGroup().addTo(map);
      map.on("click", (e: LT.LeafletMouseEvent) => {
        // Con un punto seleccionado, el toque en el mapa solo deselecciona
        // (evita agregar puntos sin querer mientras se edita en tablet)
        if (seleccionadoRef.current != null) {
          seleccionadoRef.current = null;
          setSeleccionado(null);
          redibujar();
          return;
        }
        agregarPunto(e.latlng.lat, e.latlng.lng);
      });
      map.on("moveend", () => {
        const c = map.getCenter();
        try { localStorage.setItem(VISTA_KEY, JSON.stringify({ lat: c.lat, lon: c.lng, z: map.getZoom() })); } catch { /* sin persistencia */ }
      });
    })();
    return () => { cancelado = true; mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !capaSat.current || !capaCalles.current) return;
    if (vista === "sat") { map.removeLayer(capaCalles.current); capaSat.current.addTo(map); }
    else { map.removeLayer(capaSat.current); capaCalles.current.addTo(map); }
  }, [vista]);

  // Buscar un lugar por nombre/dirección y volar el mapa hacia él
  const buscarLugar = async () => {
    const q = busqueda.trim();
    if (q.length < 2 || buscando) return;
    setBuscando(true);
    setResultados([]);
    try {
      const r = await fetch(`/api/geocodificar?q=${encodeURIComponent(q)}`);
      const j = (await r.json()) as { resultados?: { nombre: string; lat: number; lon: number }[]; error?: string };
      if (!r.ok || !j.resultados) throw new Error(j.error ?? "Sin respuesta");
      if (j.resultados.length === 0) { alert("No se encontró ese lugar. Prueba con «localidad, estado» (p. ej. Delicias, Chihuahua)."); return; }
      if (j.resultados.length === 1) irAResultado(j.resultados[0]);
      else setResultados(j.resultados);
    } catch {
      alert("El buscador de lugares no respondió. Intenta de nuevo o navega el mapa con el mouse.");
    } finally {
      setBuscando(false);
    }
  };
  const irAResultado = (res: { nombre: string; lat: number; lon: number }) => {
    mapRef.current?.setView([res.lat, res.lon], 13);
    setResultados([]);
  };

  const deseleccionar = () => { seleccionadoRef.current = null; setSeleccionado(null); };
  const borrarSeleccionado = () => {
    if (seleccionadoRef.current == null) return;
    puntosRef.current = puntosRef.current.filter((_, j) => j !== seleccionadoRef.current);
    deseleccionar();
    setCotaUltimo(null);
    redibujar();
  };
  const deshacer = () => { puntosRef.current = puntosRef.current.slice(0, -1); deseleccionar(); setCotaUltimo(null); redibujar(); };
  const limpiar = () => { puntosRef.current = []; deseleccionar(); setCotaUltimo(null); redibujar(); };
  const irAMiUbicacion = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14),
      () => alert("No se pudo obtener tu ubicación — puedes navegar el mapa con el mouse."),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void buscarLugar(); } }}
          placeholder="Buscar lugar: Delicias, Chihuahua…"
          className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
        />
        <button type="button" onClick={() => void buscarLugar()} disabled={buscando} className="text-[10px] font-semibold bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors disabled:opacity-50">
          {buscando ? "Buscando…" : "🔎 Buscar"}
        </button>
      </div>
      {resultados.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {resultados.map((r, i) => (
            <button key={i} type="button" onClick={() => irAResultado(r)} className="w-full text-left text-[11px] px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-[#E9EFF5] dark:hover:bg-gray-700 transition-colors">
              📍 {r.nombre}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button type="button" onClick={() => setVista("sat")} className={`text-[10px] px-2.5 py-1 ${vista === "sat" ? "bg-[#1C3D5A] text-white font-semibold" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>Satélite</button>
          <button type="button" onClick={() => setVista("calles")} className={`text-[10px] px-2.5 py-1 ${vista === "calles" ? "bg-[#1C3D5A] text-white font-semibold" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>Calles</button>
        </div>
        <button type="button" onClick={irAMiUbicacion} className="text-[10px] text-[#1C3D5A] dark:text-blue-300 border border-[#1C3D5A]/30 px-2 py-1 rounded hover:bg-[#1C3D5A]/10 transition-colors">📍 Mi ubicación</button>
        <span className="flex-1" />
        <button type="button" onClick={deshacer} disabled={nPuntos === 0} className="text-[10px] text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">↩ Deshacer</button>
        <button type="button" onClick={limpiar} disabled={nPuntos === 0} className="text-[10px] text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">✕ Limpiar</button>
      </div>

      <div ref={divRef} className="h-[420px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0" />

      {seleccionado != null && (
        <div className="flex items-center gap-2 flex-wrap bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2">
          <span className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Punto {seleccionado + 1} seleccionado</strong> — arrástralo para moverlo, o:
          </span>
          <button type="button" onClick={borrarSeleccionado} className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
            🗑 Borrar este punto
          </button>
          <button type="button" onClick={() => { deseleccionar(); redibujar(); }} className="text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {nPuntos === 0
            ? "Haz clic sobre el mapa siguiendo el trazo de tu línea (del inicio a la entrega)."
            : <><strong>{nPuntos}</strong> punto{nPuntos === 1 ? "" : "s"} · <strong>{(longitud / 1000).toFixed(2)} km</strong>{cotaUltimo != null && <> · último punto: cota <strong>{Math.round(cotaUltimo)} m</strong></>}</>}
        </p>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onUsar(puntosRef.current)}
          disabled={nPuntos < 2 || ocupado}
          className="text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {ocupado ? "Generando perfil…" : "✓ Usar este trazo → generar perfil"}
        </button>
      </div>
      <p className="text-[10px] text-gray-400">Verde = inicio · rojo = último punto. ¿Te equivocaste? <strong>Arrastra</strong> cualquier punto para moverlo (con el mouse o el dedo), <strong>tócalo</strong> para seleccionarlo y borrarlo con el botón (en escritorio también sirve el clic derecho), o «Deshacer» quita el último. Las cotas son satelitales (SRTM ~30 m, ±5–10 m): verificar puntos críticos en campo.</p>
    </div>
  );
}
