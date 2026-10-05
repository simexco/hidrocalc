"use client";

import { useEffect } from "react";
import Link from "next/link";
import { InputField } from "@/components/ui/InputField";
import { useProjectStore } from "@/store/projectStore";
import { clearAllFormState } from "@/lib/storage/form-persistence";
import { computeReport } from "@/lib/export/report-generator";
import { obtenerFolio } from "@/lib/folio";

interface Step {
  n: number;
  title: string;
  desc: string;
  href: string;
  done: boolean | null; // null = sin verificacion automatica
  summary: string;
  // Guia "para todos": que tener a la mano, que capturar y que se obtiene
  guia: { ten: string; haz: string[]; obtienes: string };
}

export default function AsistentePage() {
  const { project: p, patch, reset } = useProjectStore();
  const r = computeReport(p);

  // Folio automático al iniciar el proyecto: consecutivo REAL global (arranca en 1000).
  // El usuario solo lo edita si el proyecto ya trae folio de seguimiento propio.
  useEffect(() => {
    const proj = useProjectStore.getState().project;
    if (!proj.folio) obtenerFolio().then((f) => patch({ folio: f }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNuevoProyecto = () => {
    if (!confirm("¿Empezar un proyecto nuevo? Se borrarán TODOS los datos de todos los pasos (gasto, conducción, válvulas, despiece y reporte).")) return;
    clearAllFormState();
    reset();
    // Recargar para que todas las paginas re-inicien limpias
    window.location.reload();
  };

  const gastoDone = p.poblacion != null && p.dotacion != null && p.q_ls != null;
  const condDone = !!p.material && !!p.dn && p.diametroInterior != null && p.longitud != null;
  const perfilDone = p.vertices.filter((v) => v.cad != null && v.cota != null).length >= 2;
  const valvDone = p.valvulas.filter((v) => v.cad || v.tipo).length > 0;
  const bombeoDone = p.incluyeBombeo ? p.he != null : null;

  const vrpRecomendada = p.vrpRequerida ?? (p.presionMaxLinea != null && p.pnLinea != null && p.presionMaxLinea > p.pnLinea);
  const steps: Step[] = [
    { n: 1, title: "Cálculo de gasto", desc: "Demanda de agua: población, dotación → QMD.", href: "/demanda", done: gastoDone, summary: r.qmd != null ? `QMD ${r.qmd.toFixed(2)} L/s (máx. diario)` : "Pendiente",
      guia: {
        ten: "El número de habitantes (si solo tienes viviendas, multiplica por ~4) y el tipo de localidad/clima.",
        haz: [
          "Captura la población y revisa la dotación sugerida (si dudas, déjala como está).",
          "Si el proyecto es a futuro, activa el crecimiento y pon los años.",
          "No tienes que calcular nada: los caudales aparecen solos.",
        ],
        obtienes: "El caudal de diseño (QMD) y el volumen de tanque. Ese caudal viaja solo a los siguientes pasos.",
      } },
    { n: 2, title: "Línea de conducción", desc: "Caudal, material, diámetro del tubo, longitud, perfil y presiones.", href: "/perfil", done: condDone, summary: condDone ? `${p.material} ${p.dn} · ${p.longitud} m` : "Pendiente",
      guia: {
        ten: "El recorrido del tubo con sus alturas (de topografía o Google Earth): a cuántos metros del inicio está cada punto (cadenamiento) y a qué altura está (cota).",
        haz: [
          "Captura el terreno con “+ Agregar cota” o importa el Excel (hay plantilla descargable).",
          "Verifica el caudal — llega solo del paso 1.",
          "Elige material, diámetro y clase. Si no sabes el diámetro, aplica el recomendado en verde.",
          "Lee el semáforo de la tabla: verde cumple, amarillo presión baja, rojo no funciona ahí.",
        ],
        obtienes: "La presión en cada punto del trazo, la P1 requerida al inicio y, si la presión excede la tubería, las soluciones con un clic (subir de clase, otro material o reductora de presión).",
      } },
    { n: 3, title: "Equipo de bombeo", desc: "Solo si es bombeo: CDT con cotas reales y potencia comercial (HP) para cotizar la bomba. ¿No sabes qué diámetro poner? Usa la herramienta «Diámetro económico».", href: "/equipo-bombeo", done: bombeoDone, summary: p.incluyeBombeo ? (p.he != null ? `He ${p.he} m · Q + CDT para el proveedor` : "Pendiente") : "Opcional (solo bombeo)",
      guia: {
        ten: "Solo si el agua debe SUBIR con bomba. Necesitas la cota donde estará la bomba (pozo o cárcamo) y la cota de entrega (tanque).",
        haz: [
          "Elige el caso: pozo → tanque, o tanque → red.",
          "Captura las cotas y las horas de bombeo al día.",
          "El caudal y la tubería llegan solos del proyecto.",
        ],
        obtienes: "El CDT y los HP: los dos datos con los que le pides cotización al proveedor de bombas.",
      } },
    { n: 4, title: "Golpe de ariete", desc: "¿La tubería resiste el golpe? Si no, válvula de protección.", href: "/golpe-ariete", done: null, summary: "Protección contra sobrepresión / vacío",
      guia: {
        ten: "El tiempo de cierre de la válvula (dato del fabricante); si no lo tienes, deja el valor por defecto.",
        haz: [
          "Los datos del proyecto se cargan solos (o pulsa “Traer datos del proyecto”).",
          "Revisa el veredicto: ¿tu clase de tubería resiste el manotazo de presión?",
        ],
        obtienes: "Si resiste: confirmación con factor de seguridad. Si no: la clase que sí resiste o la protección necesaria.",
      } },
    { n: 5, title: "Válvula reductora (VRP)", desc: "Si la presión excede la clase del tubo: reducir presión.", href: "/vrp", done: null, summary: vrpRecomendada ? "Recomendada (presión alta)" : "Revisar si aplica",
      guia: {
        ten: "Este paso solo aplica si el paso 2 lo marcó “Recomendada” (hay demasiada presión en alguna zona).",
        haz: [
          "El caudal y la presión de entrada llegan solos del proyecto.",
          "Define la presión de salida deseada (P2).",
          "Lee la tabla: la válvula óptima viene marcada.",
        ],
        obtienes: "El tamaño (DN) de la válvula reductora, listo para cotizar.",
      } },
    { n: 6, title: "Válvulas de aire", desc: "Ubicación de ventosas, seccionamiento y desfogue.", href: "/valvulas-aire", done: valvDone, summary: valvDone ? `${p.valvulas.length} válvulas/accesorios` : "Pendiente",
      guia: {
        ten: "Nada nuevo: el perfil del terreno llega solo del paso 2.",
        haz: [
          "Revisa que el perfil esté completo (que no falte ningún punto alto o bajo del trazo).",
          "Ajusta el espaciamiento máximo solo si tu normativa pide otro (típico 500 m).",
        ],
        obtienes: "Dónde va cada válvula de aire (en los puntos altos) y dónde conviene un desagüe (puntos bajos). Pasan solas al reporte.",
      } },
    { n: 7, title: "Generador de cruceros", desc: "Arma los cruceros pieza por pieza; la lista de materiales (despiece) con SKU Sigma Flow se genera sola.", href: "/despiece", done: null, summary: "Arma tus cruceros",
      guia: {
        ten: "Un croquis o idea de cada nudo de piezas de la red (cruces, derivaciones, válvulas).",
        haz: [
          "Arma cada crucero con los botones visuales: codo, tee, válvula, brida…",
          "El diámetro y el material llegan solos del proyecto.",
          "Agrega tantos cruceros como nudos tenga tu red.",
        ],
        obtienes: "La lista de materiales (despiece) con SKU Sigma Flow, consolidada y lista para cotizar.",
      } },
    { n: 8, title: "Generar reporte", desc: "Reporte PDF consolidado de marca Sigma Flow.", href: "/entregable", done: null, summary: "Documento final",
      guia: {
        ten: "Los pasos anteriores capturados (no es obligatorio tenerlos todos).",
        haz: [
          "Revisa la portada: nombre, localidad, folio y quién elabora.",
          "Los datos ya vienen llenos de los otros pasos — completa a mano lo que falte.",
          "Pulsa “Generar PDF”.",
        ],
        obtienes: "El reporte de predimensionamiento con marca Sigma Flow: cálculos, perfil, válvulas y lista de materiales.",
      } },
  ];

  const nextStep = steps.find((s) => s.done === false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Asistente de proyecto</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pon el nombre del proyecto y empieza por el paso 1. Dentro de cada paso tendrás un botón &quot;Siguiente&quot; para avanzar hasta el reporte.</p>
        </div>
        <button onClick={handleNuevoProyecto} className="text-xs border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap">
          Nuevo proyecto (borrar todo)
        </button>
      </div>

      {/* Datos del proyecto */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">Proyecto activo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="Nombre del proyecto" value={p.proyecto} onChange={(v) => patch({ proyecto: v })} type="text" />
          <InputField label="Localidad / Estado" value={p.localidad} onChange={(v) => patch({ localidad: v })} type="text" />
          <InputField label="Folio" value={p.folio} onChange={(v) => patch({ folio: v })} type="text" placeholder="SF-2026-1000" />
        </div>
      </div>

      <div className="bg-[#E9EFF5] dark:bg-[#1C3D5A]/20 border border-[#1C3D5A]/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-sm text-[#1C3D5A] dark:text-blue-200">
          {nextStep ? <>Siguiente paso: <strong>{nextStep.title}</strong></> : <>Todos los pasos listos. Ya puedes generar el reporte.</>}
        </span>
        <Link href={nextStep ? nextStep.href : "/entregable"} className="text-xs bg-[#1C3D5A] text-white px-4 py-2 rounded-lg hover:bg-[#0F2438] transition-colors whitespace-nowrap font-medium">
          {nextStep ? (steps[0].n === nextStep.n ? "Comenzar →" : "Continuar →") : "Generar reporte →"}
        </Link>
      </div>

      {/* Stepper */}
      <div className="space-y-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
              s.done === true ? "border-green-300 dark:border-green-800" : nextStep?.n === s.n ? "border-[#1C3D5A]/40 ring-1 ring-[#1C3D5A]/20" : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <Link href={s.href} className="flex items-center gap-4 p-4 hover:shadow-sm transition-all rounded-t-xl">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                s.done === true ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-[#1C3D5A]/10 text-[#1C3D5A] dark:bg-blue-900/30 dark:text-blue-300"
              }`}>
                {s.done === true ? "✓" : s.n}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.title}</h3>
                  {s.done === true && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Listo</span>}
                  {s.done === false && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pendiente</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-medium text-[#1C3D5A] dark:text-blue-300">{s.summary}</p>
                <span className="text-[10px] text-gray-400">Abrir →</span>
              </div>
            </Link>
            {/* Guia "para todos" del paso: que tener, que hacer, que se obtiene */}
            <details className="border-t border-gray-100 dark:border-gray-700 group">
              <summary className="px-4 py-2 text-[11px] font-medium text-[#1C3D5A] dark:text-blue-300 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-700/40 rounded-b-xl list-none flex items-center gap-1.5">
                <span className="inline-block transition-transform group-open:rotate-90 text-[9px]">{"▶"}</span>
                ¿Cómo hago este paso?
              </summary>
              <div className="px-4 pb-3 pt-1 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <p><strong className="text-gray-800 dark:text-gray-100">Ten a la mano:</strong> {s.guia.ten}</p>
                <div>
                  <strong className="text-gray-800 dark:text-gray-100">Haz esto:</strong>
                  <ol className="list-decimal ml-5 mt-0.5 space-y-0.5">
                    {s.guia.haz.map((h, i) => <li key={i}>{h}</li>)}
                  </ol>
                </div>
                <p><strong className="text-gray-800 dark:text-gray-100">Obtienes:</strong> {s.guia.obtienes}</p>
              </div>
            </details>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 text-center pb-4">
        Puedes entrar a cualquier paso por separado desde el menú. El reporte se arma con lo que captures en el proyecto activo.
      </p>
    </div>
  );
}
