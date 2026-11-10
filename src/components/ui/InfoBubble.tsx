"use client";

import { useState, type ReactNode } from "react";

// Burbuja de ayuda "?" para textos que no son campos (InputField ya trae la suya).
// Mismo estilo que el tooltip de InputField: se abre al pasar el mouse o al tocarla.
export function InfoBubble({ children, label = "Más información" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle ml-1">
      <button
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
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full right-0 mb-2 w-80 p-3 text-xs font-normal leading-relaxed bg-gray-900 text-white rounded-lg shadow-lg space-y-1.5 block"
        >
          {children}
          <span className="absolute top-full right-1 w-2 h-2 bg-gray-900 rotate-45 -mt-1 block" />
        </span>
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
