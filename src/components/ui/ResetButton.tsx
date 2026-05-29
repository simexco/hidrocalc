"use client";

import { clearFormState } from "@/lib/storage/form-persistence";

interface ResetButtonProps {
  moduleKey: string;
  onReset: () => void;
}

export function ResetButton({ moduleKey, onReset }: ResetButtonProps) {
  const handleReset = () => {
    if (!confirm("Iniciar un nuevo calculo? Se borraran todos los datos actuales.")) return;
    clearFormState(moduleKey);
    onReset();
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="text-[11px] text-white bg-[#1C3D5A] hover:bg-[#0F2438] px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
    >
      Nuevo calculo
    </button>
  );
}
