"use client";

import type { AssumedValue } from "@/types/hydraulic";

interface DataStatusBannerProps {
  assumed: AssumedValue[];
  missingRequired?: string[];
}

export function DataStatusBanner({ assumed, missingRequired }: DataStatusBannerProps) {
  if (missingRequired && missingRequired.length > 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        Ingresa {missingRequired.join(", ")} para iniciar el cálculo.
      </div>
    );
  }

  if (assumed.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
        <span>&#9888;</span> Valores asumidos en este cálculo
      </div>
      <ul className="text-xs text-yellow-600 dark:text-yellow-500 space-y-0.5">
        {assumed.map((a) => (
          <li key={a.field}>&bull; {a.label}</li>
        ))}
      </ul>
    </div>
  );
}
