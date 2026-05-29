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
      className="text-[11px] text-gray-400 hover:text-[#1C3D5A] border border-gray-200 dark:border-gray-600 hover:border-[#1C3D5A]/40 px-2.5 py-1 rounded-lg transition-colors"
    >
      Nuevo calculo
    </button>
  );
}
