"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { InputField } from "@/components/ui/InputField";
import { ResetButton } from "@/components/ui/ResetButton";
import { saveFormState, loadFormState } from "@/lib/storage/form-persistence";
import { STANDARD_DNS_LABELED, MATERIALS } from "@/lib/constants";
import { useProjectStore } from "@/store/projectStore";
import ListaMaterialesSIMEX, { type SIMEXAcc, type SIMEXConex, dnStrFromMM, SIMEX_CAT } from "@/components/ListaMaterialesSIMEX";
import CruceroVisual, { vizToAccsConex, type VizNode } from "@/components/CruceroVisual";

interface DespieceTramo {
  id: string;
  name: string;
  DN: number;
  material: string;
  modo?: "visual" | "lista";
  cantidad?: number;    // veces que se repite este crucero en el proyecto
  colapsado?: boolean;  // tarjeta encogida a una línea de resumen
}

export default function DespiecePage() {
  const [projectName, setProjectName] = useState("");
  const [jGrad, setJGrad] = useState("");  // gradiente hidráulico opcional (m/km) para convertir ΣLe a pérdida
  const [tramos, setTramos] = useState<DespieceTramo[]>([]);
  const [accsPorTramo, setAccsPorTramo] = useState<Record<string, SIMEXAcc[]>>({});
  // Uniones brida-con-brida entre piezas del crucero, por tramo
  const [conexPorTramo, setConexPorTramo] = useState<Record<string, SIMEXConex[]>>({});
  // Armado visual (grafo de piezas) por tramo
  const [vizPorTramo, setVizPorTramo] = useState<Record<string, VizNode[]>>({});
  // Lista completa computada por tramo (piezas + acoplamiento) para el reporte
  const [listaPorTramo, setListaPorTramo] = useState<Record<string, { sku: string; desc: string; qty: number }[]>>({});

  // Cargar guardado / flujo de proyecto
  useEffect(() => {
    const saved = loadFormState<{ projectName?: string; jGrad?: string; tramos?: DespieceTramo[]; accsPorTramo?: Record<string, SIMEXAcc[]>; conexPorTramo?: Record<string, SIMEXConex[]>; vizPorTramo?: Record<string, VizNode[]> }>("despiece");
    const tieneTramos = saved && Array.isArray(saved.tramos) && saved.tramos.length > 0;
    if (saved) {
      if (saved.projectName) setProjectName(saved.projectName);
      if (saved.jGrad) setJGrad(saved.jGrad);
      if (Array.isArray(saved.tramos)) {
        // Cruceros guardados sin modo: si ya tenían lista armada con botones, respetarla
        setTramos(saved.tramos.map((t) => t.modo ? t : { ...t, modo: (saved.vizPorTramo?.[t.id]?.length ?? 0) === 0 && (saved.accsPorTramo?.[t.id]?.length ?? 0) > 0 ? "lista" : "visual" }));
      }
      if (saved.accsPorTramo) setAccsPorTramo(saved.accsPorTramo);
      if (saved.conexPorTramo) setConexPorTramo(saved.conexPorTramo);
      if (saved.vizPorTramo) setVizPorTramo(saved.vizPorTramo);
    }
    // Si no hay tramos propios, sembrar el primero con el material/DN del proyecto activo
    if (!tieneTramos) {
      const proj = useProjectStore.getState().project;
      if (proj.proyecto && !saved?.projectName) setProjectName(proj.proyecto);
      if (proj.diametroInterior != null || proj.material) {
        setTramos([{ id: uuid(), name: "Crucero 1", DN: proj.diametroInterior ?? 150, material: proj.material || "PVC Inglés", modo: "visual" }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir
  const persistRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => saveFormState("despiece", { projectName, jGrad, tramos, accsPorTramo, conexPorTramo, vizPorTramo }), 800);
  }, [projectName, jGrad, tramos, accsPorTramo, conexPorTramo, vizPorTramo]);

  // Armado visual → derivar piezas + uniones (alimentan la tabla, el consolidado y el reporte)
  useEffect(() => {
    tramos.forEach((t) => {
      if ((t.modo ?? "visual") !== "visual") return;
      const { accs, conex } = vizToAccsConex(vizPorTramo[t.id] ?? []);
      setAccsPorTramo((prev) => JSON.stringify(prev[t.id] ?? []) === JSON.stringify(accs) ? prev : { ...prev, [t.id]: accs });
      setConexPorTramo((prev) => JSON.stringify(prev[t.id] ?? []) === JSON.stringify(conex) ? prev : { ...prev, [t.id]: conex });
    });
  }, [vizPorTramo, tramos]);

  // Flujo de proyecto: escribir el despiece consolidado al proyecto (sale en el reporte)
  const patchProject = useProjectStore((s) => s.patch);
  useEffect(() => {
    const t = setTimeout(() => {
      // Consolidar la lista COMPLETA de cada tramo (incluye piezas + acoplamiento/adaptadores)
      // Solo tramos que aún tienen accesorios (ignora listas obsoletas)
      const acc: Record<string, { desc: string; sku: string; qty: number }> = {};
      tramos.forEach((t2) => {
        if ((accsPorTramo[t2.id]?.length ?? 0) === 0) return;
        const veces = Math.max(1, t2.cantidad ?? 1);
        (listaPorTramo[t2.id] ?? []).forEach((p) => {
          const key = p.sku && p.sku !== "—" ? p.sku : p.desc;
          if (!acc[key]) acc[key] = { desc: p.desc, sku: p.sku || "—", qty: 0 };
          acc[key].qty += p.qty * veces;
        });
      });
      patchProject({ despiece: Object.values(acc) });
    }, 700);
    return () => clearTimeout(t);
  }, [listaPorTramo, accsPorTramo, tramos, patchProject]);

  const addTramo = () => {
    // Al crear uno nuevo, los cruceros anteriores se colapsan para que la página no se haga interminable
    setTramos((prev) => [...prev.map((t) => ({ ...t, colapsado: true })), { id: uuid(), name: `Crucero ${prev.length + 1}`, DN: 150, material: "PVC Inglés", modo: "visual", cantidad: 1 }]);
  };
  const updateTramo = (id: string, patch: Partial<DespieceTramo>) => {
    setTramos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTramo = (id: string) => {
    setTramos((prev) => prev.filter((t) => t.id !== id));
    setAccsPorTramo((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setConexPorTramo((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setVizPorTramo((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };
  // Borrar una pieza del armado visual desde la lista (quita también las conectadas después de ella)
  const borrarPiezaVisual = (tramoId: string, accId: number) => {
    const nodes = vizPorTramo[tramoId] ?? [];
    const drop = new Set<number>([accId]);
    let grew = true;
    while (grew) { grew = false; nodes.forEach((n) => { if (n.parentId != null && drop.has(n.parentId) && !drop.has(n.id)) { drop.add(n.id); grew = true; } }); }
    if (drop.size > 1 && !confirm(`Esta pieza tiene ${drop.size - 1} pieza(s) conectada(s) después de ella; se borrarán también. ¿Continuar?`)) return;
    setVizPorTramo((prev) => ({ ...prev, [tramoId]: nodes.filter((n) => !drop.has(n.id)) }));
  };

  const cambiarModo = (t: DespieceTramo, modo: "visual" | "lista") => {
    if ((t.modo ?? "visual") === modo) return;
    if (modo === "visual" && (vizPorTramo[t.id]?.length ?? 0) === 0 && (accsPorTramo[t.id]?.length ?? 0) > 0) {
      if (!confirm("Este crucero ya tiene una lista armada con botones. El armado visual empieza desde cero y la reemplazará. ¿Continuar?")) return;
      setAccsPorTramo((prev) => ({ ...prev, [t.id]: [] }));
      setConexPorTramo((prev) => ({ ...prev, [t.id]: [] }));
    }
    updateTramo(t.id, { modo });
  };

  const handleReset = () => {
    setTramos([]); setAccsPorTramo({}); setConexPorTramo({}); setVizPorTramo({}); setProjectName("");
  };

  const crucerosConPiezas = tramos.filter((t) => (accsPorTramo[t.id]?.length ?? 0) > 0);

  // Lista consolidada: suma de TODOS los cruceros ×(veces que se repiten), agrupada por SKU
  const consolidada = (() => {
    const map: Record<string, { desc: string; sku: string; qty: number }> = {};
    crucerosConPiezas.forEach((t) => {
      const veces = Math.max(1, t.cantidad ?? 1);
      (listaPorTramo[t.id] ?? []).forEach((p) => {
        const key = p.sku && p.sku !== "—" && p.sku !== "← CONF" ? p.sku : p.desc;
        if (!map[key]) map[key] = { desc: p.desc, sku: p.sku || "—", qty: 0 };
        map[key].qty += p.qty * veces;
      });
    });
    return Object.values(map);
  })();
  const totalPiezas = consolidada.reduce((s, r) => s + r.qty, 0);
  const totalCruceros = crucerosConPiezas.reduce((s, t) => s + Math.max(1, t.cantidad ?? 1), 0);

  // Pérdidas por accesorios consolidadas (Crane TP-410): ΣLe de TODOS los cruceros con repeticiones
  const perdidas = (() => {
    const strToMM: Record<string, number> = {};
    Object.entries(SIMEX_CAT.DN_MM).forEach(([mm, s]) => { strToMM[s] = Number(mm); });
    const map: Record<string, { desc: string; leD: number; qty: number; Le: number }> = {};
    crucerosConPiezas.forEach((t) => {
      const veces = Math.max(1, t.cantidad ?? 1);
      (accsPorTramo[t.id] ?? []).forEach((a) => {
        const leD = SIMEX_CAT.LE_D[a.leKey] ?? 0;
        if (leD <= 0) return;  // tapas y válvulas de aire no agregan pérdida en línea
        const mm = strToMM[a.dn] ?? t.DN;
        if (!map[a.label]) map[a.label] = { desc: a.label, leD, qty: 0, Le: 0 };
        map[a.label].qty += a.qty * veces;
        map[a.label].Le += leD * (mm / 1000) * a.qty * veces;
      });
    });
    return Object.values(map);
  })();
  const sumLe = perdidas.reduce((s, p) => s + p.Le, 0);
  const jNum = parseFloat(jGrad) || 0;

  const copiarConsolidada = () => {
    const lines = ["SKU\tDescripción\tCantidad"];
    consolidada.forEach((r) => lines.push(`${r.sku}\t${r.desc}\t${r.qty}`));
    navigator.clipboard.writeText(lines.join("\n")).then(() => alert("Lista consolidada copiada"));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Genera tus cruceros</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl mt-0.5">
            Arma cada crucero visualmente, pieza por pieza, como en el plano: toca ⊕ en cada brida libre para conectar la siguiente pieza. La lista de materiales —con adaptadores, empaques y tornillería— se genera sola abajo, lista para cotizar.
          </p>
        </div>
        <ResetButton moduleKey="despiece" onReset={handleReset} />
      </div>

      {/* Proyecto */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <InputField label="Proyecto / Obra" value={projectName} onChange={setProjectName} type="text" placeholder="Ej. Línea conducción El Roble" />
      </div>

      {/* Cruceros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tus cruceros</h2>
          {tramos.length > 0 && (
            <button onClick={addTramo} className="text-xs bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors">
              + Nuevo crucero
            </button>
          )}
        </div>

        {tramos.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
            <div className="text-3xl mb-2">🔧</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Empieza creando tu primer crucero</p>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">Agrega sus piezas (codos, válvulas, tees…) y únelas entre sí. El acoplamiento (adaptadores, empaques, tornillería) se calcula solo.</p>
            <button onClick={addTramo} className="mt-4 text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors">+ Crear crucero</button>
          </div>
        )}

        {tramos.map((t, i) => (
          <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Cabecera del crucero */}
            <div
              className={`bg-[#1C3D5A]/[0.04] dark:bg-gray-800/60 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-wrap ${t.colapsado ? "cursor-pointer hover:bg-[#1C3D5A]/[0.09] transition-colors" : ""}`}
              onClick={t.colapsado ? () => updateTramo(t.id, { colapsado: false }) : undefined}
              title={t.colapsado ? "Clic para abrir y editar este crucero" : undefined}
            >
              <span className="w-6 h-6 rounded-full bg-[#1C3D5A] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</span>
              {t.colapsado ? (
                <>
                  <span className="text-sm font-semibold text-gray-700 dark:text-white">{t.name}</span>
                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {STANDARD_DNS_LABELED.find((d) => d.dn === t.DN)?.label ?? `${t.DN} mm`} · {t.material} · {(accsPorTramo[t.id] ?? []).reduce((s, a) => s + a.qty, 0)} pieza(s)
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${(t.cantidad ?? 1) > 1 ? "bg-[#1C3D5A] text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300"}`}>×{t.cantidad ?? 1}</span>
                    <span className="text-[11px] font-medium text-[#1C3D5A] dark:text-blue-300 border border-[#1C3D5A]/30 dark:border-blue-300/30 rounded-lg px-2.5 py-1 bg-white dark:bg-gray-800">▾ Abrir para editar</span>
                  </div>
                </>
              ) : (
                <>
              <input
                value={t.name}
                onChange={(e) => updateTramo(t.id, { name: e.target.value })}
                className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#1C3D5A] dark:text-white focus:outline-none min-w-[120px]"
              />
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <button onClick={() => cambiarModo(t, "visual")} className={`px-2.5 py-1.5 text-[11px] transition-colors ${(t.modo ?? "visual") === "visual" ? "bg-[#1C3D5A] text-white font-medium" : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50"}`}>🧩 Visual</button>
                    <button onClick={() => cambiarModo(t, "lista")} className={`px-2.5 py-1.5 text-[11px] transition-colors ${(t.modo ?? "visual") === "lista" ? "bg-[#1C3D5A] text-white font-medium" : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50"}`}>☰ Botones</button>
                  </div>
                  <select
                    value={t.DN}
                    onChange={(e) => updateTramo(t.id, { DN: parseInt(e.target.value) })}
                    title="Diámetro principal del crucero"
                    className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  >
                    {STANDARD_DNS_LABELED.map((d) => <option key={d.dn} value={d.dn}>{d.label}</option>)}
                  </select>
                  <select
                    value={t.material}
                    onChange={(e) => updateTramo(t.id, { material: e.target.value })}
                    className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  >
                    {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>
                  <div className="flex items-center gap-0.5 border border-gray-300 dark:border-gray-600 rounded-lg px-1.5 py-1 bg-white dark:bg-gray-800" title="¿Cuántas veces se repite este crucero en el proyecto? El consolidado multiplica sus materiales.">
                    <span className="text-[10px] text-gray-400 mr-1">Se repite</span>
                    <button onClick={() => updateTramo(t.id, { cantidad: Math.max(1, (t.cantidad ?? 1) - 1) })} className="px-1.5 text-xs font-bold text-gray-400 hover:text-[#1C3D5A]">−</button>
                    <span className="text-xs font-bold text-[#1C3D5A] dark:text-blue-300 w-7 text-center">×{t.cantidad ?? 1}</span>
                    <button onClick={() => updateTramo(t.id, { cantidad: (t.cantidad ?? 1) + 1 })} className="px-1.5 text-xs font-bold text-gray-400 hover:text-[#1C3D5A]">+</button>
                  </div>
                  <button onClick={() => updateTramo(t.id, { colapsado: true })} title="Terminar y encoger este crucero a una línea (lo puedes reabrir cuando quieras)" className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 font-medium transition-colors shadow-sm">✓ Listo</button>
                  <button onClick={() => removeTramo(t.id)} title="Eliminar crucero" className="text-red-400 hover:text-red-600 text-sm px-1">&#10005;</button>
                </div>
                </>
              )}
            </div>

            {/* Cuerpo: armado visual o botones, + tabla de materiales */}
            {!t.colapsado && (
            <div className="p-4 space-y-4">
              {(t.cantidad ?? 1) > 1 && (
                <p className="text-[10px] text-[#1C3D5A]/70 dark:text-blue-300/70 bg-[#1C3D5A]/[0.05] dark:bg-blue-900/20 rounded-lg px-3 py-1.5">
                  Este crucero se repite <strong>×{t.cantidad}</strong> en el proyecto. La tabla muestra los materiales de UNO; la lista consolidada de abajo ya los multiplica.
                </p>
              )}
              {(t.modo ?? "visual") === "visual" ? (
                <>
                  <CruceroVisual
                    dn={dnStrFromMM(t.DN)}
                    nodes={vizPorTramo[t.id] || []}
                    onChange={(nodes) => setVizPorTramo((prev) => ({ ...prev, [t.id]: nodes }))}
                  />
                  {(accsPorTramo[t.id]?.length ?? 0) > 0 && (
                    <ListaMaterialesSIMEX
                      mode="table"
                        hidePerdidas
                      dnMM={t.DN}
                      materialRaw={t.material}
                      externalAccs={accsPorTramo[t.id] || []}
                      onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                      externalConex={conexPorTramo[t.id] || []}
                      onConexChange={(cx) => setConexPorTramo((prev) => ({ ...prev, [t.id]: cx }))}
                      readOnly
                      onDelete={(accId) => borrarPiezaVisual(t.id, accId)}
                      onComputed={(rows) => setListaPorTramo((prev) => ({ ...prev, [t.id]: rows }))}
                    />
                  )}
                </>
              ) : (
                <>
                  <ListaMaterialesSIMEX
                    mode="selector"
                    dnMM={t.DN}
                    materialRaw={t.material}
                    externalAccs={accsPorTramo[t.id] || []}
                    onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                    externalConex={conexPorTramo[t.id] || []}
                    onConexChange={(cx) => setConexPorTramo((prev) => ({ ...prev, [t.id]: cx }))}
                  />
                  {(accsPorTramo[t.id]?.length ?? 0) > 0 && (
                    <ListaMaterialesSIMEX
                      mode="table"
                        hidePerdidas
                      dnMM={t.DN}
                      materialRaw={t.material}
                      externalAccs={accsPorTramo[t.id] || []}
                      onAccsChange={(accs) => setAccsPorTramo((prev) => ({ ...prev, [t.id]: accs }))}
                      externalConex={conexPorTramo[t.id] || []}
                      onConexChange={(cx) => setConexPorTramo((prev) => ({ ...prev, [t.id]: cx }))}
                      onComputed={(rows) => setListaPorTramo((prev) => ({ ...prev, [t.id]: rows }))}
                    />
                  )}
                </>
              )}
            </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Lista de materiales consolidada (todos los cruceros) ── */}
      {consolidada.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#1C3D5A] to-[#2A5A7A] px-5 py-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Lista de materiales consolidada{projectName ? ` — ${projectName}` : ""}</h3>
              <p className="text-[10px] text-white/50 mt-0.5">{crucerosConPiezas.length} crucero(s) distinto(s) · {totalCruceros} en total con repeticiones · {totalPiezas} pieza(s) · acoplamiento incluido</p>
            </div>
            <button onClick={copiarConsolidada} className="shrink-0 text-[11px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">Copiar SKUs</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {consolidada.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2">
                <span className="font-mono text-xs text-[#1C3D5A] dark:text-blue-300 w-28 shrink-0">{r.sku}</span>
                <span className="flex-1 text-[13px] text-gray-700 dark:text-gray-300">{r.desc}</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 w-12 text-right">×{r.qty}</span>
              </div>
            ))}
          </div>
          <p className="px-5 py-3 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
            Contacte a su distribuidor Sigma Flow autorizado para cotización — S.H.I. de México · simexco.com.mx
          </p>
        </div>
      )}

      {/* ── Pérdidas por accesorios consolidadas (todos los cruceros) ── */}
      {perdidas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pérdidas por accesorios — todos los cruceros</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Longitud equivalente (Crane TP-410 / AWWA) sumada de todos los cruceros, con repeticiones incluidas</p>
          </div>
          <div className="px-5 py-3">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600 text-gray-400">
                  <th className="text-left px-1 py-1 font-medium">Accesorio</th>
                  <th className="text-center px-1 py-1 font-medium">Cant. total</th>
                  <th className="text-center px-1 py-1 font-medium">Le/D</th>
                  <th className="text-center px-1 py-1 font-medium">Le total (m)</th>
                </tr>
              </thead>
              <tbody>
                {perdidas.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-1 py-1 text-gray-600 dark:text-gray-300">{p.desc}</td>
                    <td className="px-1 py-1 text-center font-mono">{p.qty}</td>
                    <td className="px-1 py-1 text-center text-gray-400 font-mono">{p.leD}</td>
                    <td className="px-1 py-1 text-center font-mono">{p.Le.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 dark:border-gray-500 font-semibold">
                  <td className="px-1 py-1.5 dark:text-gray-200">TOTAL — longitud equivalente ΣLe</td>
                  <td></td><td></td>
                  <td className="px-1 py-1.5 text-center font-mono text-[#1C3D5A] dark:text-blue-300">{sumLe.toFixed(2)} m</td>
                </tr>
              </tbody>
            </table>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <label className="text-xs text-gray-600 dark:text-gray-300">Gradiente hidráulico J:</label>
              <input
                type="number"
                value={jGrad}
                onChange={(e) => setJGrad(e.target.value)}
                placeholder="ej. 4.5"
                className="w-24 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
              />
              <span className="text-[11px] text-gray-400">m/km</span>
              {jNum > 0 && (
                <span className="text-xs font-semibold text-[#1C3D5A] dark:text-blue-300 bg-[#1C3D5A]/[0.06] dark:bg-blue-900/20 rounded-lg px-3 py-1.5">
                  Pérdida total por accesorios: hm ≈ {(sumLe * jNum / 1000).toFixed(2)} m
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              hm = J × ΣLe. El gradiente J (m/km) sale del cálculo de la Línea de conducción (pérdida por fricción ÷ longitud). Las tapas ciegas y válvulas de aire no agregan pérdida en la línea.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
