"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Burbuja de ayuda "?" para textos que no son campos (InputField ya trae la suya).
// Se dibuja sobre toda la página (portal, posición fija) y se acomoda para quedar
// SIEMPRE dentro de la ventana: no la corta la barra lateral ni el borde del panel.
const ANCHO = 320, MARGEN = 12;

export function InfoBubble({ children, label = "Más información" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; arriba: boolean; flecha: number; ancho: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);

  const colocar = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const ancho = Math.min(ANCHO, vw - 2 * MARGEN);
    const centro = r.left + r.width / 2;
    const left = Math.min(Math.max(MARGEN, centro - ancho / 2), vw - ancho - MARGEN);
    const arriba = r.top > window.innerHeight / 2; // abre hacia donde haya más espacio
    setPos({ left, top: arriba ? r.top - 8 : r.bottom + 8, arriba, flecha: centro - left, ancho });
  }, []);

  useEffect(() => {
    if (!open) return;
    colocar();
    window.addEventListener("scroll", colocar, true);
    window.addEventListener("resize", colocar);
    return () => { window.removeEventListener("scroll", colocar, true); window.removeEventListener("resize", colocar); };
  }, [open, colocar]);

  return (
    <span className="inline-flex align-middle ml-1">
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-[#1C3D5A] hover:text-white transition-colors flex items-center justify-center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
      >
        ?
      </button>
      {open && pos && createPortal(
        <div
          role="tooltip"
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.ancho, transform: pos.arriba ? "translateY(-100%)" : undefined }}
          className="z-[1000] p-3 text-xs font-normal leading-relaxed text-left bg-gray-900 text-white rounded-lg shadow-lg space-y-1.5 pointer-events-none"
        >
          {children}
          <span
            style={{ left: pos.flecha - 4 }}
            className={`absolute w-2 h-2 bg-gray-900 rotate-45 block ${pos.arriba ? "top-full -mt-1" : "bottom-full -mb-1"}`}
          />
        </div>,
        document.body,
      )}
    </span>
  );
}

// Definición del coeficiente de regulación (MAPAS), con el desglose del horario capturado
export function DefinicionCoefRegulacion({ R, maxExcedente, maxFaltante, horario }: {
  R: number; maxExcedente: number; maxFaltante: number; horario: string;
}) {
  return (
    <>
      <span className="block font-semibold">Coeficiente de regulación (R)</span>
      <span className="block">
        Volumen de tanque necesario por cada L/s de gasto máximo diario (QMD):
        <b> volumen de regulación = R × QMD</b>, en m³.
      </span>
      <span className="block">
        Se obtiene comparando, hora por hora, lo que entra al tanque (el bombeo) con lo que consume
        la población según la curva de demanda horaria del MAPAS. El tanque debe cubrir el máximo
        excedente y el máximo faltante acumulados: R = (excedente − faltante) × 3.6 / 100.
      </span>
      <span className="block text-gray-300">
        Con tu horario ({horario}): excedente máx. {maxExcedente.toFixed(1)} %, faltante máx. {maxFaltante.toFixed(1)} %
        → R = ({maxExcedente.toFixed(1)} + {Math.abs(maxFaltante).toFixed(1)}) × 3.6 / 100 = {R.toFixed(1)} m³/(L/s).
      </span>
      <span className="block text-gray-300">
        Con suministro continuo de 24 h, R = 11.0. Entre menos horas se bombea, mayor debe ser el tanque.
      </span>
    </>
  );
}
