"use client";

/* ════════════════════════════════════════
   Mi cuenta — acceso con correo y contraseña (Supabase).
   El modo invitado siempre está disponible: todo se guarda
   en este navegador. Con cuenta, además puedes guardar y
   abrir tus proyectos en la nube desde cualquier equipo.
   ════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase, nubeDisponible } from "@/lib/supabase";

export default function CuentaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [organismo, setOrganismo] = useState("");
  const [msj, setMsj] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const entrar = async () => {
    if (!supabase) return;
    setCargando(true); setMsj(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setCargando(false);
    if (error) setMsj({ tipo: "error", texto: "No se pudo iniciar sesión: revisa el correo y la contraseña." });
    else setMsj({ tipo: "ok", texto: "Sesión iniciada. Ya puedes guardar proyectos en la nube." });
  };

  const crear = async () => {
    if (!supabase) return;
    if (password.length < 6) { setMsj({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres." }); return; }
    setCargando(true); setMsj(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nombre: nombre.trim(), organismo: organismo.trim() } },
    });
    setCargando(false);
    if (error) setMsj({ tipo: "error", texto: `No se pudo crear la cuenta: ${error.message}` });
    else if (data.session) setMsj({ tipo: "ok", texto: "Cuenta creada y sesión iniciada. ¡Bienvenido!" });
    else setMsj({ tipo: "ok", texto: "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión." });
  };

  const salir = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMsj({ tipo: "ok", texto: "Sesión cerrada. Sigues trabajando como invitado en este navegador." });
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white";

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Mi cuenta</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Con una cuenta puedes <strong>guardar tus proyectos en la nube</strong> y abrirlos desde cualquier equipo. Como invitado, todo se guarda solo en este navegador.
        </p>
      </div>

      {!nubeDisponible ? (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">El guardado en la nube aún no está configurado</p>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
            Puedes seguir usando la plataforma como invitado sin ningún problema: tus datos se guardan en este navegador. Cuando el administrador conecte el servicio de cuentas, aquí podrás crear la tuya.
          </p>
          <Link href="/" className="inline-block mt-3 text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors">Continuar como invitado →</Link>
        </div>
      ) : user ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#1C3D5A] text-white flex items-center justify-center text-sm font-bold">
              {(user.user_metadata?.nombre || user.email || "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.user_metadata?.nombre || "Sesión iniciada"}</p>
              <p className="text-xs text-gray-500">{user.email}{user.user_metadata?.organismo ? ` · ${user.user_metadata.organismo}` : ""}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/proyectos" className="text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors font-medium">Mis proyectos en la nube →</Link>
            <button onClick={salir} className="text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cerrar sesión</button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button onClick={() => { setModo("entrar"); setMsj(null); }} className={`flex-1 text-xs py-2 transition-colors ${modo === "entrar" ? "bg-[#1C3D5A] text-white font-semibold" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>Iniciar sesión</button>
            <button onClick={() => { setModo("crear"); setMsj(null); }} className={`flex-1 text-xs py-2 transition-colors ${modo === "crear" ? "bg-[#1C3D5A] text-white font-semibold" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>Crear cuenta</button>
          </div>

          {modo === "crear" && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ing. Juan Pérez" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organismo / Empresa (opcional)</label>
                <input value={organismo} onChange={(e) => setOrganismo(e.target.value)} placeholder="JMAS, CEA, constructora…" className={inputCls} />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" className={inputCls} onKeyDown={(e) => { if (e.key === "Enter") (modo === "entrar" ? entrar() : crear()); }} />
          </div>

          {msj && (
            <p className={`text-xs rounded-lg px-3 py-2 ${msj.tipo === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{msj.texto}</p>
          )}

          <button
            onClick={modo === "entrar" ? entrar : crear}
            disabled={cargando || !email || !password}
            className="w-full text-sm bg-[#1C3D5A] text-white px-4 py-2.5 rounded-lg hover:bg-[#0F2438] transition-colors font-semibold disabled:opacity-50"
          >
            {cargando ? "Un momento…" : modo === "entrar" ? "Iniciar sesión" : "Crear cuenta"}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            ¿Sin cuenta? <Link href="/" className="underline text-[#1C3D5A] dark:text-blue-300">Continúa como invitado</Link> — todo se guarda en este navegador.
          </p>
        </div>
      )}
    </div>
  );
}
