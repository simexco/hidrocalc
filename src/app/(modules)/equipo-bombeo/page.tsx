"use client";

/* ════════════════════════════════════════════════════════════
   Equipo de bombeo — predimensionamiento para cotizar la bomba
   Dos casos: Pozo → Tanque  y  Tanque → Red / otro tanque.
   Calcula la Carga Dinámica Total (CDT) y la potencia comercial
   de referencia (HP). Hereda Q, DN, material y longitud del
   proyecto activo (Línea de conducción) — editables aquí.
   ════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { InputField } from "@/components/ui/InputField";
import { ResetButton } from "@/components/ui/ResetButton";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { MATERIALS, STANDARD_DNS_LABELED } from "@/lib/constants";
import { useProjectStore } from "@/store/projectStore";

const HP_COMERCIALES = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200];
const TIPOS_EQUIPO = [
  "Bomba centrífuga horizontal",
  "Bomba centrífuga vertical (multietapa)",
  "Bomba sumergible",
  "Equipo tipo booster (presurización)",
  "Bomba de flecha / turbina vertical",
  "Bomba autocebante",
  "Otro",
];

interface BombeoState {
  caso: "pozo" | "tanque";
  cotaPozo: number; nivelDin: number; profBomba: number;
  cotaTanqueOrigen: number;
  Q: number; D: number; material: string; L: number;
  cotaTanque: number; altTanque: number;
  cotaEntrega: number;
  presion: number; uPresion: "mca" | "kg";
  nbombas: 1 | 2 | 3; tipoEquipo: string;
  pctLocal: number; efic: number;
  horasBombeo: number; tarifaCFE: number;
}

const DEFAULTS: BombeoState = {
  caso: "pozo",
  cotaPozo: 1850, nivelDin: 40, profBomba: 55,
  cotaTanqueOrigen: 1900,
  Q: 15, D: 150, material: "PVC Inglés", L: 850,
  cotaTanque: 1980, altTanque: 5,
  cotaEntrega: 2010,
  presion: 0, uPresion: "mca",
  nbombas: 1, tipoEquipo: "Bomba centrífuga horizontal",
  pctLocal: 5, efic: 70,
  horasBombeo: 12, tarifaCFE: 4.5,
};

const selCls = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white";

export default function EquipoBombeoPage() {
  const [st, setSt] = useState<BombeoState>(DEFAULTS);
  const [heredado, setHeredado] = useState<{ q: boolean; d: boolean; m: boolean; l: boolean }>({ q: false, d: false, m: false, l: false });
  const dirtyRef = useRef(false);

  const set = <K extends keyof BombeoState>(key: K, value: BombeoState[K]) => {
    dirtyRef.current = true;
    setSt((prev) => ({ ...prev, [key]: value }));
    // Si el usuario edita un campo heredado, deja de marcarse como "del proyecto"
    if (key === "Q") setHeredado((h) => ({ ...h, q: false }));
    if (key === "D") setHeredado((h) => ({ ...h, d: false }));
    if (key === "material") setHeredado((h) => ({ ...h, m: false }));
    if (key === "L") setHeredado((h) => ({ ...h, l: false }));
  };
  const num = (v: string) => parseFloat(v) || 0;

  // Cargar guardado / heredar la línea del proyecto activo (Línea de conducción)
  useEffect(() => {
    const saved = loadFormState<Partial<BombeoState>>("equipo-bombeo");
    const proj = useProjectStore.getState().project;
    setSt((prev) => {
      const base = { ...prev, ...(saved ?? {}) };
      if (!saved) {
        const her = { q: false, d: false, m: false, l: false };
        if (proj.q_ls != null && proj.q_ls > 0) { base.Q = proj.q_ls; her.q = true; }
        if (proj.diametroInterior != null && proj.diametroInterior > 0) { base.D = proj.diametroInterior; her.d = true; }
        if (proj.material) { base.material = proj.material; her.m = true; }
        if (proj.longitud != null && proj.longitud > 0) { base.L = proj.longitud; her.l = true; }
        setHeredado(her);
      } else {
        dirtyRef.current = true;
      }
      return base;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!dirtyRef.current) return;
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("equipo-bombeo", st), 800);
  }, [st]);

  // ── Cálculo (lógica del predimensionamiento validado) ──
  const r = useMemo(() => {
    const C = MATERIALS.find((m) => m.name === st.material)?.c ?? 150;
    const presionMca = st.presion * (st.uPresion === "kg" ? 10 : 1);

    let cotaSucc: number, cotaDesc: number, nOper = 1;
    if (st.caso === "pozo") {
      cotaSucc = st.cotaPozo - st.nivelDin;      // nivel del agua trabajando (dinámico)
      cotaDesc = st.cotaTanque + st.altTanque;   // nivel de entrada al tanque
    } else {
      cotaSucc = st.cotaTanqueOrigen;
      cotaDesc = st.cotaEntrega;
      nOper = st.nbombas === 3 ? 2 : 1;          // equipos en OPERACIÓN (la reserva no suma caudal)
    }
    const Hest = cotaDesc - cotaSucc;

    const Qb = st.caso === "tanque" ? st.Q / nOper : st.Q;

    // Fricción Hazen-Williams (SI): Q en m³/s, D en m — el caudal TOTAL pasa por la línea
    const Qm = st.Q / 1000, Dm = st.D / 1000;
    const hf = st.D > 0 ? 10.674 * Math.pow(Qm / C, 1.852) * st.L / Math.pow(Dm, 4.871) : 0;
    const hl = hf * (st.pctLocal / 100);
    let CDT = Hest + hf + hl + presionMca;
    if (CDT < 0) CDT = 0;

    const area = Math.PI * Dm * Dm / 4;
    const vel = area > 0 ? Qm / area : 0;

    const hpHid = st.efic > 0 ? (Qb * CDT) / (76 * (st.efic / 100)) : 0;
    const hpCom = HP_COMERCIALES.find((h) => h >= hpHid) ?? Math.ceil(hpHid);

    const tipo = st.caso === "pozo" ? "Bomba sumergible" : st.tipoEquipo;
    const etiquetaArreglo = st.nbombas === 3 ? "2+1" : st.nbombas === 2 ? "1+1" : "1";
    const varios = st.caso === "tanque" && st.nbombas !== 1;

    // Costo de operación con la potencia real al freno (ya incluye la eficiencia global)
    const kWbomba = hpHid * 0.746;
    const kWtotal = kWbomba * (st.caso === "tanque" ? nOper : 1);
    const kWh_dia = kWtotal * st.horasBombeo;
    const costo_mes = kWh_dia * 30 * st.tarifaCFE;
    const costo_anual = kWh_dia * 365 * st.tarifaCFE;

    return { C, presionMca, cotaSucc, cotaDesc, Hest, Qb, hf, hl, CDT, vel, hpHid, hpCom, tipo, etiquetaArreglo, varios, nOper, kWbomba, kWtotal, kWh_dia, costo_mes, costo_anual };
  }, [st]);

  // Flujo de proyecto: carga estática y eficiencia alimentan la hoja de bombeo del reporte
  const patchProject = useProjectStore((s) => s.patch);
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => {
      if (st.Q > 0 && st.D > 0 && st.L > 0 && r.CDT > 0) {
        patchProject({ incluyeBombeo: true, he: Math.round(r.Hest * 10) / 10, eficiencia: st.efic });
      }
    }, 900);
    return () => clearTimeout(t);
  }, [r, st, patchProject]);

  const handleReset = () => { setSt(DEFAULTS); setHeredado({ q: false, d: false, m: false, l: false }); dirtyRef.current = false; };

  // Barra de desglose de la CDT
  const partes = [
    { color: "#5499C7", label: "Carga estática", v: Math.max(0, r.Hest) },
    { color: "#48C9B0", label: "Fricción", v: r.hf },
    { color: "#F5B041", label: "Pérdidas locales", v: r.hl },
    { color: "#EC7063", label: "Presión servicio", v: r.presionMca },
  ];
  const totParts = partes.reduce((s, p) => s + p.v, 0) || 1;

  const advertencias: string[] = [];
  if (st.caso === "pozo" && st.profBomba <= st.nivelDin) advertencias.push("La bomba debe instalarse por debajo del nivel dinámico (profundidad de instalación > nivel dinámico).");
  if (r.vel > 2.5) advertencias.push(`Velocidad alta (${r.vel.toFixed(2)} m/s > 2.5 m/s): considerar un diámetro mayor.`);
  if (r.vel > 0 && r.vel < 0.3) advertencias.push(`Velocidad baja (${r.vel.toFixed(2)} m/s < 0.3 m/s): riesgo de sedimentación.`);
  if (r.Hest < 0) advertencias.push("La entrega está por debajo de la succión (carga estática negativa): verificar cotas — podría no requerirse bombeo.");

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Equipo de bombeo</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl mt-0.5">
            Indique el escenario y los datos básicos. El sistema calcula la <strong>Carga Dinámica Total (CDT)</strong> y la potencia de referencia para solicitar la bomba con un proveedor.
          </p>
        </div>
        <ResetButton moduleKey="equipo-bombeo" onReset={handleReset} />
      </div>

      {/* Selección de caso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          { key: "pozo", titulo: "Caso 1 · Pozo → Tanque", desc: "La bomba está dentro de un pozo y eleva el agua hasta un tanque." },
          { key: "tanque", titulo: "Caso 2 · Tanque → Red / otro tanque", desc: "La bomba toma agua de un tanque y la envía a la red o a otro tanque. Puede ser uno o varios equipos." },
        ] as const).map((c) => (
          <button
            key={c.key}
            onClick={() => set("caso", c.key)}
            className={`text-left rounded-xl border-2 p-4 transition-all ${st.caso === c.key ? "border-[#1C3D5A] bg-[#1C3D5A]/[0.04] ring-2 ring-[#1C3D5A]/15 shadow-sm" : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#1C3D5A]/40"}`}
          >
            <div className="text-sm font-semibold text-[#1C3D5A] dark:text-blue-300">{c.titulo}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Columna de entradas ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Datos de entrada</h2>

          {/* 1 — Fuente */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1C3D5A] text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <h3 className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Fuente (succión)</h3>
          </div>
          {st.caso === "pozo" ? (
            <>
              <InputField label="Cota del terreno en el pozo" value={st.cotaPozo} onChange={(v) => set("cotaPozo", num(v))} unit="msnm" tooltip="Elevación del terreno donde está el pozo. Puede tomarse de Google Earth." />
              <InputField label="Nivel dinámico del agua" value={st.nivelDin} onChange={(v) => set("nivelDin", num(v))} unit="m bajo el terreno" tooltip="Profundidad a la que baja el agua MIENTRAS la bomba trabaja (nivel estático + abatimiento). Desde aquí levanta la bomba — no desde donde está instalada." />
              <InputField label="Profundidad de instalación de la bomba" value={st.profBomba} onChange={(v) => set("profBomba", num(v))} unit="m" tooltip="Debe quedar por debajo del nivel dinámico para no descebarse." />
            </>
          ) : (
            <InputField label="Cota de desplante del tanque de origen" value={st.cotaTanqueOrigen} onChange={(v) => set("cotaTanqueOrigen", num(v))} unit="msnm" tooltip="Nivel de succión: la cota donde está desplantado el tanque del que toma la bomba." />
          )}

          {/* 2 — Línea */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="w-5 h-5 rounded-full bg-[#1C3D5A] text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <h3 className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Línea de impulsión</h3>
            {(heredado.q || heredado.d || heredado.m || heredado.l) && (
              <span className="text-[10px] bg-[#E9EFF5] text-[#1C3D5A] dark:bg-blue-900/30 dark:text-blue-300 rounded-md px-1.5 py-0.5">datos del proyecto — editables</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Caudal Q" value={st.Q} onChange={(v) => set("Q", num(v))} unit="L/s" assumed={heredado.q} assumedLabel="Del proyecto" />
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Diámetro nominal {heredado.d && <span className="text-[10px] bg-[#E9EFF5] text-[#1C3D5A] rounded px-1 ml-1">del proyecto</span>}</label>
              <select value={st.D} onChange={(e) => set("D", parseInt(e.target.value))} className={selCls}>
                {!STANDARD_DNS_LABELED.some((d) => d.dn === st.D) && <option value={st.D}>{st.D} mm</option>}
                {STANDARD_DNS_LABELED.map((d) => <option key={d.dn} value={d.dn}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Material {heredado.m && <span className="text-[10px] bg-[#E9EFF5] text-[#1C3D5A] rounded px-1 ml-1">del proyecto</span>}</label>
              <select value={st.material} onChange={(e) => set("material", e.target.value)} className={selCls}>
                {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name} (C={m.c})</option>)}
              </select>
            </div>
            <InputField label="Longitud de la línea" value={st.L} onChange={(v) => set("L", num(v))} unit="m" assumed={heredado.l} assumedLabel="Del proyecto" />
          </div>

          {/* 3 — Entrega */}
          <div className="flex items-center gap-2 pt-1">
            <span className="w-5 h-5 rounded-full bg-[#1C3D5A] text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <h3 className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Entrega (descarga)</h3>
          </div>
          {st.caso === "pozo" ? (
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Cota de desplante del tanque" value={st.cotaTanque} onChange={(v) => set("cotaTanque", num(v))} unit="msnm" />
              <InputField label="Altura del tanque" value={st.altTanque} onChange={(v) => set("altTanque", num(v))} unit="m" tooltip="Hasta el nivel de entrada del agua al tanque." />
            </div>
          ) : (
            <InputField label="Cota del punto de entrega (red / tanque destino)" value={st.cotaEntrega} onChange={(v) => set("cotaEntrega", num(v))} unit="msnm" />
          )}
          <div className="grid grid-cols-[1fr_110px] gap-3 items-end">
            <InputField label="Presión de servicio requerida en la entrega" value={st.presion} onChange={(v) => set("presion", num(v))} tooltip="0 si solo llena un tanque; 15–20 m.c.a. si descarga directo a la red." />
            <select value={st.uPresion} onChange={(e) => set("uPresion", e.target.value as "mca" | "kg")} className={selCls}>
              <option value="mca">m.c.a.</option>
              <option value="kg">kg/cm²</option>
            </select>
          </div>

          {st.caso === "tanque" && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de equipos en paralelo + reserva</label>
                <select value={st.nbombas} onChange={(e) => set("nbombas", parseInt(e.target.value) as 1 | 2 | 3)} className={selCls}>
                  <option value={1}>1 equipo (sin reserva)</option>
                  <option value={2}>1 en operación + 1 de reserva (1+1)</option>
                  <option value={3}>2 en operación + 1 de reserva (2+1)</option>
                </select>
                <p className="text-[11px] text-gray-400">Cada bomba se dimensiona para el caudal que le toca.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de equipo de bombeo</label>
                <select value={st.tipoEquipo} onChange={(e) => set("tipoEquipo", e.target.value)} className={selCls}>
                  {TIPOS_EQUIPO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-[11px] text-gray-400">Selección común en México según la aplicación.</p>
              </div>
            </>
          )}

          {/* Avanzado */}
          <details className="pt-1">
            <summary className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300 cursor-pointer select-none">Opciones avanzadas</summary>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <InputField label="Pérdidas locales" value={st.pctLocal} onChange={(v) => set("pctLocal", num(v))} unit="% de la fricción" tooltip="Pérdidas por piezas y accesorios de la línea, estimadas como porcentaje de la fricción. Valor usual: 5%." />
              <InputField label="Eficiencia de bomba" value={st.efic} onChange={(v) => set("efic", num(v))} unit="%" tooltip="Eficiencia global estimada del conjunto bomba-motor. Valor usual para predimensionar: 70%." />
            </div>
          </details>

          <p className="text-[10px] text-gray-400 pt-1">
            ¿Ya se tiene la curva del fabricante? El módulo <Link href="/bombeo" className="text-[#1C3D5A] dark:text-blue-300 underline">Punto de operación</Link> cruza la curva de la bomba con la del sistema.
          </p>
        </div>

        {/* ── Columna diagrama + resultado ── */}
        <div className="space-y-5">
          {/* Diagrama */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            <svg viewBox="0 0 560 320" className="w-full">
              {st.caso === "pozo" ? (
                <g>
                  <rect x="0" y="120" width="200" height="200" fill="#cfa06a" opacity="0.35" />
                  <line x1="0" y1="120" x2="200" y2="120" stroke="#cfa06a" strokeWidth="2" />
                  <text x="8" y="114" fontSize="11" fill="#64748b">Terreno pozo</text>
                  <text x="8" y="135" fontSize="11" fontWeight="bold" fill="#7d3c98">{st.cotaPozo} msnm</text>
                  <rect x="60" y="120" width="26" height="170" fill="white" stroke="#1C3D5A" />
                  {(() => { const yAgua = 120 + Math.min(st.nivelDin, 60) * 1.6; return (<g>
                    <rect x="60" y={yAgua} width="26" height={290 - yAgua} fill="#5499C7" opacity="0.5" />
                    <line x1="60" y1={yAgua} x2="120" y2={yAgua} stroke="#5499C7" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x="92" y={yAgua - 3} fontSize="11" fontWeight="bold" fill="#1C3D5A">Nivel dinámico −{st.nivelDin} m</text>
                  </g>); })()}
                  <rect x="66" y="270" width="14" height="18" fill="#1C3D5A" />
                  <text x="92" y="285" fontSize="11" fill="#64748b">Bomba sumergible a −{st.profBomba} m</text>
                  <rect x="420" y="70" width="90" height="55" fill="none" stroke="#1C3D5A" strokeWidth="2" />
                  <rect x="420" y="95" width="90" height="30" fill="#5499C7" opacity="0.5" />
                  <rect x="415" y="125" width="100" height="40" fill="#cfa06a" opacity="0.4" />
                  <text x="430" y="64" fontSize="11" fill="#64748b">Tanque</text>
                  <text x="430" y="142" fontSize="11" fontWeight="bold" fill="#7d3c98">{st.cotaTanque + st.altTanque} msnm</text>
                  <polyline points="73,272 73,114 455,114 455,78" fill="none" stroke="#1C3D5A" strokeWidth="3" />
                </g>
              ) : (
                <g>
                  <rect x="40" y="150" width="100" height="70" fill="none" stroke="#1C3D5A" strokeWidth="2" />
                  <rect x="40" y="195" width="100" height="25" fill="#5499C7" opacity="0.5" />
                  <rect x="35" y="220" width="110" height="40" fill="#cfa06a" opacity="0.4" />
                  <text x="50" y="144" fontSize="11" fill="#64748b">Tanque origen</text>
                  <text x="44" y="240" fontSize="11" fontWeight="bold" fill="#7d3c98">{st.cotaTanqueOrigen} msnm</text>
                  <rect x="150" y="222" width="20" height="16" fill="#1C3D5A" />
                  <text x="150" y="252" fontSize="11" fill="#64748b">Bombeo{r.varios ? ` (${r.etiquetaArreglo})` : ""}</text>
                  <rect x="430" y="60" width="90" height="50" fill="none" stroke="#1C3D5A" strokeWidth="2" />
                  <text x="438" y="54" fontSize="11" fill="#64748b">Red / tanque destino</text>
                  <rect x="425" y="110" width="100" height="40" fill="#cfa06a" opacity="0.4" />
                  <text x="440" y="128" fontSize="11" fontWeight="bold" fill="#7d3c98">{st.cotaEntrega} msnm</text>
                  <polyline points="160,224 160,135 475,135 475,95" fill="none" stroke="#1C3D5A" strokeWidth="3" />
                </g>
              )}
              <rect x="205" y="14" width="160" height="46" rx="8" fill="#1C3D5A" />
              <text x="285" y="33" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">CDT ≈ {r.CDT.toFixed(1)} m</text>
              <text x="285" y="50" textAnchor="middle" fill="#cfe0ee" fontSize="11">Q = {st.Q} L/s · v = {r.vel.toFixed(2)} m/s</text>
            </svg>
          </div>

          {/* Advertencias */}
          {advertencias.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 space-y-1">
              {advertencias.map((a, i) => <p key={i} className="text-xs text-amber-700 dark:text-amber-300">⚠ {a}</p>)}
            </div>
          )}

          {/* Resultado */}
          <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(160deg, #1C3D5A, #0F2438)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider border-b border-white/20 pb-2 mb-4">Datos para cotizar</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { v: r.CDT.toFixed(1), k: "CDT (m)" },
                { v: st.Q.toFixed(1), k: "Gasto total (L/s)" },
                { v: r.Qb.toFixed(1), k: "Gasto por bomba (L/s)" },
                { v: `${r.hpCom}`, k: "Potencia por bomba (HP)" },
              ].map((d2) => (
                <div key={d2.k} className="bg-white/[0.14] border border-white/[0.18] rounded-lg px-2 py-3 text-center">
                  <div className="text-2xl font-extrabold leading-tight">{d2.v}</div>
                  <div className="text-[10px] uppercase tracking-wide opacity-90 mt-1">{d2.k}</div>
                </div>
              ))}
            </div>

            <div className="bg-white/10 rounded-lg p-3.5 text-sm leading-relaxed mb-4">
              Solicite {r.varios ? "cada" : "una"} <strong>{r.tipo.toLowerCase()}</strong> con <strong className="text-base">Q = {r.Qb.toFixed(1)} L/s</strong> y <strong className="text-base">CDT = {r.CDT.toFixed(1)} m</strong>{r.varios ? <> · arreglo {r.etiquetaArreglo} equipos</> : null}
            </div>

            <p className="text-[11px] opacity-90 mb-1">Cómo se compone la CDT:</p>
            <div className="flex h-7 rounded-md overflow-hidden text-[10px] mb-1.5">
              {partes.map((p) => {
                const w = (p.v / totParts) * 100;
                return <div key={p.label} style={{ width: `${w}%`, background: p.color }} className="flex items-center justify-center whitespace-nowrap overflow-hidden">{w > 9 ? `${p.v.toFixed(1)} m` : ""}</div>;
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px]">
              {partes.map((p) => (
                <span key={p.label} className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: p.color }} />{p.label}</span>
              ))}
            </div>

            <p className="text-[11px] opacity-80 mt-4 leading-relaxed">
              <strong>Potencia estimada.</strong> Estos valores son un predimensionamiento orientativo: la potencia depende de la curva real de cada bomba y de su eficiencia. Para afinar el resultado se recomienda acercarse a un <strong>proveedor de bombas</strong> con el par <strong>Q + CDT</strong>, que definirá el modelo y el motor definitivos. Cálculo de fricción por Hazen-Williams.
            </p>
          </div>

          {/* Costo de operación (energía) — con la potencia fina de este módulo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <p className="text-xs text-gray-500 font-semibold">Costo de operación (energía)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas de bombeo al día</label>
                <select value={st.horasBombeo} onChange={(e) => set("horasBombeo", parseInt(e.target.value))} className={selCls}>
                  {[8, 12, 16, 20, 24].map((h) => <option key={h} value={h}>{h} h/día</option>)}
                </select>
              </div>
              <InputField label="Tarifa CFE comercial" value={st.tarifaCFE} onChange={(v) => set("tarifaCFE", num(v) || 4.5)} unit="$/kWh" tooltip="Tarifa comercial CFE (PDBT) que pagan los organismos operadores. Ajustar al recibo real; varía por región y mes." />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-gray-400">kWh/día</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{r.kWh_dia.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">kWh/mes</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{(r.kWh_dia * 30).toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Costo mensual</p>
                <p className="text-lg font-bold text-[#1C3D5A] dark:text-blue-300">${r.costo_mes.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Costo anual</p>
                <p className="text-lg font-bold text-[#1C3D5A] dark:text-blue-300">${r.costo_anual.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              Con la potencia real al freno: {r.kWbomba.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kW por bomba{st.caso === "tanque" && r.nOper > 1 ? ` × ${r.nOper} en operación` : ""} × {st.horasBombeo} h/día × ${st.tarifaCFE}/kWh. Este es el costo fino de operación; el del Diámetro económico es solo comparativo.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
        Elaborado con criterios de los MAPAS (CONAGUA). Predimensionamiento sin carácter oficial: no sustituye al proyecto ejecutivo. Sigma Flow suministra válvulas y piezas especiales; las bombas y tuberías se cotizan con proveedores de equipo.
      </p>
    </div>
  );
}
