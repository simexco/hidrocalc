"use client";

import type { CalcMode } from "@/types/hydraulic";

interface ModeSelectorProps {
  mode: CalcMode;
  onChange: (mode: CalcMode) => void;
}

const modes: { key: CalcMode; label: string; desc: string }[] = [
  { key: "A", label: "Modo A", desc: "Verificar presión de salida" },
  { key: "B", label: "Modo B", desc: "Calcular caudal máximo" },
  { key: "C", label: "Modo C", desc: "Recomendar diámetro" },
];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {modes.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
            mode === m.key
              ? "bg-[#1C3D5A] text-white border-[#1C3D5A] shadow-sm"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/50"
          }`}
        >
          <div className="font-semibold">{m.label}</div>
          <div className={`text-xs mt-0.5 ${mode === m.key ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
            {m.desc}
          </div>
        </button>
      ))}
    </div>
  );
}
