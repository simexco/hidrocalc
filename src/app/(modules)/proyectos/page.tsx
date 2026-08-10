"use client";

/* ════════════════════════════════════════
   Mis proyectos — guardado en la nube por usuario (Supabase).
   Guarda un snapshot COMPLETO del estado local (proyecto activo
   + todos los módulos) y permite abrirlo en cualquier equipo.
   ════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase, nubeDisponible } from "@/lib/supabase";
import { tomarSnapshotLocal, aplicarSnapshotLocal, datosProyectoActivo, type SnapshotLocal } from "@/lib/storage/cloud-sync";

interface ProyectoNube {
  id: string;
  nombre: string;
  folio: string | null;
  updated_at: string;
}

export default function ProyectosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lista, setLista] = useState<ProyectoNube[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [msj, setMsj] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    if (!supabase) { setCargando(false); return; }
    const { data: u } = await supabase.auth.getUser();
    setUser(u.user ?? null);
    if (!u.user) { setCargando(false); return; }
    const { data, error } = await supabase
      .from("proyectos")
      .select("id, nombre, folio, updated_at")
      .order("updated_at", { ascending: false });
    if (!error && data) setLista(data as ProyectoNube[]);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarActual = async () => {
    if (!supabase || !user) return;
    const { nombre: nomAuto, folio } = datosProyectoActivo();
    const nombre = prompt("Nombre para guardar este proyecto:", nomAuto || "Mi proyecto");
    if (!nombre) return;
    setOcupado(true); setMsj(null);
    const snap = tomarSnapshotLocal();
    const existente = lista.find((p) => p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    let error;
    if (existente && confirm(`Ya existe "${existente.nombre}" en tu nube. ¿Reemplazarlo con el estado actual?`)) {
      ({ error } = await supabase.from("proyectos").update({ nombre: nombre.trim(), folio, data: snap, updated_at: new Date().toISOString() }).eq("id", existente.id));
    } else if (existente) {
      setOcupado(false); return;
    } else {
      ({ error } = await supabase.from("proyectos").insert({ user_id: user.id, nombre: nombre.trim(), folio, data: snap }));
    }
    setOcupado(false);
    if (error) setMsj({ tipo: "error", texto: `No se pudo guardar: ${error.message}` });
    else { setMsj({ tipo: "ok", texto: `Proyecto "${nombre}" guardado en la nube.` }); cargar(); }
  };

  const abrir = async (p: ProyectoNube) => {
    if (!supabase) return;
    if (!confirm(`¿Abrir "${p.nombre}"? Reemplazará TODO el trabajo actual de este navegador. Si quieres conservar lo actual, guárdalo primero.`)) return;
    setOcupado(true); setMsj(null);
    const { data, error } = await supabase.from("proyectos").select("data").eq("id", p.id).single();
    setOcupado(false);
    if (error || !data) { setMsj({ tipo: "error", texto: "No se pudo descargar el proyecto." }); return; }
    aplicarSnapshotLocal(data.data as SnapshotLocal);
    window.location.href = "/asistente";
  };

  const renombrar = async (p: ProyectoNube) => {
    if (!supabase) return;
    const nombre = prompt("Nuevo nombre:", p.nombre);
    if (!nombre || nombre.trim() === p.nombre) return;
    const { error } = await supabase.from("proyectos").update({ nombre: nombre.trim() }).eq("id", p.id);
    if (error) setMsj({ tipo: "error", texto: "No se pudo renombrar." }); else cargar();
  };

  const eliminar = async (p: ProyectoNube) => {
    if (!supabase) return;
    if (!confirm(`¿Eliminar "${p.nombre}" de tu nube? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("proyectos").delete().eq("id", p.id);
    if (error) setMsj({ tipo: "error", texto: "No se pudo eliminar." }); else { setMsj({ tipo: "ok", texto: `"${p.nombre}" eliminado.` }); cargar(); }
  };

  const fecha = (iso: string) => new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Mis proyectos</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Guardados en tu cuenta — ábrelos desde cualquier equipo. Cada guardado incluye TODO: gasto, línea, bomba, cruceros y reporte.</p>
        </div>
        {user && (
          <button onClick={guardarActual} disabled={ocupado} className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm disabled:opacity-50">
            {ocupado ? "Guardando…" : "⭱ Guardar proyecto actual"}
          </button>
        )}
      </div>

      {msj && (
        <p className={`text-xs rounded-lg px-3 py-2 ${msj.tipo === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{msj.texto}</p>
      )}

      {!nubeDisponible ? (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-xs text-amber-700 dark:text-amber-300">
          El guardado en la nube aún no está configurado por el administrador. Mientras tanto, tu trabajo se guarda automáticamente en este navegador.
        </div>
      ) : cargando ? (
        <p className="text-xs text-gray-400 text-center py-8">Cargando…</p>
      ) : !user ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Inicia sesión para guardar tus proyectos en la nube</p>
          <p className="text-xs text-gray-400 mb-4">Como invitado, tu trabajo vive solo en este navegador (y se conserva ahí).</p>
          <Link href="/cuenta" className="text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors font-medium">Iniciar sesión / Crear cuenta →</Link>
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Aún no tienes proyectos guardados</p>
          <p className="text-xs text-gray-400">Cuando termines (o a medio camino), usa <strong>“Guardar proyecto actual”</strong> y quedará en tu cuenta con todo: gasto, línea, cruceros y reporte.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
          {lista.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.nombre}</p>
                <p className="text-[11px] text-gray-400">{p.folio ? `Folio ${p.folio} · ` : ""}Actualizado {fecha(p.updated_at)}</p>
              </div>
              <button onClick={() => abrir(p)} disabled={ocupado} className="text-[11px] bg-[#1C3D5A] text-white px-3 py-1.5 rounded-lg hover:bg-[#0F2438] transition-colors font-medium disabled:opacity-50">Abrir</button>
              <button onClick={() => renombrar(p)} className="text-[11px] border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Renombrar</button>
              <button onClick={() => eliminar(p)} className="text-[11px] border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors">Eliminar</button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gray-400">
        Consejo: guarda con nombres claros (“Línea El Roble — 6\" bombeo”). Abrir un proyecto reemplaza el trabajo actual del navegador; guárdalo antes si lo quieres conservar.
      </p>
    </div>
  );
}
